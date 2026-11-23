'use strict'
/**
 * Shared test helpers.
 *
 * These helpers are deliberately independent of the jimp major version in use:
 * test images are produced by a tiny built-in PNG encoder, output images are
 * decoded with whatever jimp is installed (0.x or 1.x) and only `bitmap` is
 * inspected. This lets the same suite run against master (jimp 0.x) and v3 (jimp 1.x).
 */
const fs = require('fs')
const path = require('path')
const vm = require('vm')
const zlib = require('zlib')
// a minimal fake of the Node-RED runtime (see fake-runtime.js) - avoids needing node-red as a dev dependency
const helper = require('./fake-runtime')

const ROOT = path.join(__dirname, '..')
const jimpModule = require('jimp')
const Jimp = jimpModule.Jimp || jimpModule


/* ------------------------------ PNG encoder ------------------------------ */
const CRC_TABLE = (() => {
    const t = new Uint32Array(256)
    for (let n = 0; n < 256; n++) {
        let c = n
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
        t[n] = c >>> 0
    }
    return t
})()
function crc32 (buf) {
    let c = 0xffffffff
    for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
    return (c ^ 0xffffffff) >>> 0
}
function chunk (type, data) {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
    const td = Buffer.concat([Buffer.from(type, 'ascii'), data])
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td))
    return Buffer.concat([len, td, crc])
}
/** Create an RGBA PNG. `pixel(x, y)` returns [r, g, b, a] */
function makePng (width, height, pixel) {
    const raw = Buffer.alloc((width * 4 + 1) * height)
    let o = 0
    for (let y = 0; y < height; y++) {
        raw[o++] = 0 // filter: none
        for (let x = 0; x < width; x++) {
            const [r, g, b, a = 255] = pixel(x, y)
            raw[o++] = r; raw[o++] = g; raw[o++] = b; raw[o++] = a
        }
    }
    const ihdr = Buffer.alloc(13)
    ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4)
    ihdr[8] = 8; ihdr[9] = 6 // 8 bit RGBA
    return Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        chunk('IHDR', ihdr),
        chunk('IDAT', zlib.deflateSync(raw)),
        chunk('IEND', Buffer.alloc(0))
    ])
}

const RED = [255, 0, 0, 255]
const BLUE = [0, 0, 255, 255]
const GREEN = [0, 255, 0, 255]
const WHITE = [255, 255, 255, 255]
const BLACK = [0, 0, 0, 255]

/**
 * 40 x 20 image: left half red, right half blue, with a 4x4 green marker in
 * the top left corner (so flips/rotations are detectable)
 */
function testPng () {
    return makePng(40, 20, (x, y) => {
        if (x < 4 && y < 4) return GREEN
        return x < 20 ? RED : BLUE
    })
}
function solidPng (w, h, colour = WHITE) {
    return makePng(w, h, () => colour)
}

/* ------------------------------ decode / inspect ------------------------------ */
async function decode (buf) {
    if (typeof buf === 'string') { // base64 (with or without data uri prefix)
        buf = Buffer.from(buf.replace(/^data:image\/\w+;base64,/, ''), 'base64')
    }
    return Jimp.fromBuffer ? Jimp.fromBuffer(buf) : Jimp.read(buf)
}
/** encode a jimp image to a buffer (jimp 0.x is callback/getBufferAsync based, 1.x is promise based) */
async function encode (img, mime) {
    return img.getBufferAsync ? img.getBufferAsync(mime) : img.getBuffer(mime)
}
function px (img, x, y) {
    const { width, data } = img.bitmap
    const i = (y * width + x) * 4
    return [data[i], data[i + 1], data[i + 2], data[i + 3]]
}
/** count pixels in the image (optionally restricted to a rect) matching predicate */
function countPixels (img, pred, rect) {
    const { width, height } = img.bitmap
    const r = rect || { x: 0, y: 0, w: width, h: height }
    let n = 0
    for (let y = r.y; y < r.y + r.h; y++) {
        for (let x = r.x; x < r.x + r.w; x++) {
            if (pred(px(img, x, y), x, y)) n++
        }
    }
    return n
}
/** bounding box of pixels matching pred, or null */
function bounds (img, pred) {
    const { width, height } = img.bitmap
    let x0 = Infinity; let y0 = Infinity; let x1 = -1; let y1 = -1
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (pred(px(img, x, y))) {
                x0 = Math.min(x0, x); x1 = Math.max(x1, x)
                y0 = Math.min(y0, y); y1 = Math.max(y1, y)
            }
        }
    }
    return x1 < 0 ? null : { x0, y0, x1, y1 }
}
const isDark = p => p[3] > 0 && p[0] < 100 && p[1] < 100 && p[2] < 100
const near = (a, b, tol = 3) => Math.abs(a - b) <= tol

/* ------------------------------ function definitions ------------------------------ */
let _fnDefs
/**
 * Get the jimp node function definitions. On master they live in jimp.html (browser side),
 * on later branches they move server side to static/js/image_tools.js
 */
function fnDefs () {
    if (_fnDefs) return _fnDefs
    const tools = require(path.join(ROOT, 'static/js/image_tools.js'))
    if (typeof tools.getJimpFunctions === 'function') {
        _fnDefs = tools.getJimpFunctions()
        return _fnDefs
    }
    const html = fs.readFileSync(path.join(ROOT, 'jimp.html'), 'utf8')
    const marker = 'imageToolsNodeCommon.functions = '
    const start = html.indexOf(marker)
    const end = html.indexOf('imageToolsNodeCommon.requiredParameterValidator')
    if (start < 0 || end < 0) throw new Error('cannot locate function definitions in jimp.html')
    const src = html.slice(start + marker.length, end).trim().replace(/;$/, '')
    _fnDefs = JSON.parse(JSON.stringify(vm.runInNewContext('(' + src + ')'))) // JSON round trip: drop the foreign realm prototypes
    return _fnDefs
}

/* ------------------------------ node config builders ------------------------------ */
const KNOWN_TYPES = ['num', 'str', 'bool', 'json', 'msg', 'flow', 'global', 'env', 'jsonata', 're', 'bin', 'date',
    'auto', 'Jimp.AUTO', 'Jimp', 'Align', 'AlignX', 'AlignY', 'Blend', 'Font', 'jimpFont', 'resizeMode', 'blend', 'alignMode']
function inferType (v) {
    if (typeof v === 'number') return 'num'
    if (typeof v === 'boolean') return 'bool'
    if (typeof v === 'object' && v !== null) return 'json'
    return 'str'
}
/**
 * Build the config of a "jimp-image" node as the editor would have saved it.
 * @param {string} fnKey - key of the function (e.g. "resize", "print2")
 * @param {Array} params - positional values. Either plain values or [value, type]
 * @param {object} [extra] - extra node properties (e.g. ret, data, dataType, sendProperty)
 */
function jimpConfig (fnKey, params = [], extra = {}) {
    const defs = fnDefs()
    const def = defs[fnKey]
    if (!def) throw new Error(`unknown jimp function '${fnKey}'`)
    const cfg = {
        id: 'n1',
        type: 'jimp-image',
        name: '',
        data: 'payload',
        dataType: 'msg',
        ret: 'buf',
        jimpFunction: fnKey,
        selectedJimpFunction: def, // master reads the definition from the node config
        parameterCount: def.parameters.length,
        wires: [['h1']]
    }
    for (let i = 1; i <= 8; i++) {
        cfg['parameter' + i] = ''
        cfg['parameter' + i + 'Type'] = ''
    }
    params.forEach((p, i) => {
        const isPair = Array.isArray(p) && p.length === 2 && typeof p[1] === 'string' && KNOWN_TYPES.includes(p[1])
        let [value, type] = isPair ? p : [p, inferType(p)]
        if (type === 'json' && typeof value !== 'string') value = JSON.stringify(value)
        cfg['parameter' + (i + 1)] = String(value)
        cfg['parameter' + (i + 1) + 'Type'] = type
    })
    return Object.assign(cfg, extra)
}
/** batch config - jobs is the array of {name, parameters} */
function batchConfig (jobs, extra) {
    return jimpConfig('batch', [[JSON.stringify(jobs), 'json']], extra)
}

/* ------------------------------ run a node ------------------------------ */
/**
 * Load `cfg` into a test flow, send `msg` and wait for the outcome.
 * Resolves with { msg, msgs, errors, statuses }. `msg` is undefined if nothing was sent
 * (resolves after `settle` ms in that case)
 */
async function run (nodeFiles, cfg, msg, { settle = 4000, extraNodes = [] } = {}) {
    const files = Array.isArray(nodeFiles) ? nodeFiles : [nodeFiles]
    const flow = [Object.assign({ wires: [['h1']] }, cfg), { id: 'h1', type: 'helper' }, ...extraNodes]
    await helper.load(files.map(f => require(path.join(ROOT, f))), flow)
    const n1 = helper.getNode(cfg.id || 'n1')
    const h1 = helper.getNode('h1')
    const result = { msgs: [], errors: [], statuses: [] }
    n1.on('call:error', c => result.errors.push(c.args[0]))
    n1.on('call:status', c => result.statuses.push(c.args[0]))
    return new Promise(resolve => {
        let done = false
        let timer
        const finish = () => {
            if (done) return
            done = true
            clearTimeout(timer)
            result.msg = result.msgs[0]
            resolve(result)
        }
        timer = setTimeout(finish, settle)
        h1.on('input', m => { result.msgs.push(m); setTimeout(finish, 20) })
        n1.on('call:error', () => setTimeout(finish, 100))
        n1.receive(msg)
    })
}
const runJimp = (cfg, msg, opts) => run('jimp.js', cfg, msg, opts)

/** run a jimp node and decode the resulting image (expects ret: buf or b64, the default is buf) */
async function runJimpImage (cfg, payload, opts) {
    const r = await runJimp(cfg, { payload: payload || testPng() }, opts)
    if (!r.msg) {
        const e = r.errors[0]
        throw new Error('no output from jimp node' + (e ? ': ' + (e.message || e) : ''))
    }
    r.img = await decode(r.msg[cfg.sendProperty || 'payload'])
    return r
}

module.exports = {
    helper, ROOT, Jimp,
    makePng, testPng, solidPng, RED, BLUE, GREEN, WHITE, BLACK,
    decode, encode, px, countPixels, bounds, isDark, near,
    fnDefs, jimpConfig, batchConfig, run, runJimp, runJimpImage
}
