'use strict'
/**
 * webp support (issue #53). jimp 1.x has no webp codec by default and @jimp/wasm-webp cannot work in Node,
 * so the node builds its own (see jimp-factory.js).
 */
const { describe, it, before, after, afterEach } = require('node:test')
const assert = require('node:assert/strict')
const bwipjs = require('bwip-js')
const h = require('./helpers')
const { getJimp, isJimpImage } = require('../jimp-factory')
const { jimpConfig, batchConfig, run, runJimp, makePng, testPng, near } = h

const isWebp = buf => Buffer.isBuffer(buf) && buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP'
const isPng = buf => Buffer.isBuffer(buf) && buf.subarray(1, 4).toString() === 'PNG'
const pixel = (img, x, y) => Array.from(img.bitmap.data.subarray((y * img.bitmap.width + x) * 4, (y * img.bitmap.width + x) * 4 + 4))

/** make a webp from a png (using the same library the nodes use) */
async function toWebp (png, quality = 100) {
    const { Jimp } = await getJimp()
    return (await Jimp.fromBuffer(png)).getBuffer('image/webp', { quality })
}
async function readWebp (buf) {
    const { Jimp } = await getJimp()
    return Jimp.fromBuffer(buf)
}
/** a noisy image: its size depends strongly on the quality it is encoded with */
const noisyPng = () => makePng(64, 64, (x, y) => [(x * 37 + y * 11) % 256, (x * 13 + y * 29) % 256, (x * y) % 256, 255])

describe('webp', () => {
    before(() => h.helper.startServer())
    afterEach(() => h.helper.unload())
    after(() => h.helper.stopServer())

    it('the library reports webp is available', async () => {
        const jimp = await getJimp()
        assert.equal(jimp.webp, true, jimp.webpError && jimp.webpError.message)
        assert.equal(jimp.JimpMime.webp, 'image/webp')
        assert.equal(jimp.JimpMime.png, 'image/png', 'other mime types are kept')
    })

    it('getJimp always gives the same library', async () => {
        assert.equal(await getJimp(), await getJimp())
    })

    it('isJimpImage recognises images and nothing else', async () => {
        const { Jimp } = await getJimp()
        assert.equal(isJimpImage(new Jimp({ width: 2, height: 2 })), true)
        assert.equal(isJimpImage(new h.Jimp({ width: 2, height: 2 })), true, 'an image from a different jimp instance')
        for (const v of [null, undefined, 'x', 1, {}, Buffer.alloc(4), { bitmap: {} }]) assert.equal(isJimpImage(v), false)
    })

    describe('jimp node', () => {
        it('reads and writes webp (the format is kept)', async () => {
            const input = await toWebp(testPng())
            const r = await runJimp(jimpConfig('resize', [20, 10]), { payload: input })
            assert.ok(r.msg, 'no output: ' + (r.errors[0] && r.errors[0].message))
            assert.ok(isWebp(r.msg.payload), 'output is webp')
            assert.equal(r.msg.imageInfo.MIME, 'image/webp')
            assert.equal(r.msg.imageInfo.width, 20)
            assert.equal(r.msg.imageInfo.height, 10)
            const img = await readWebp(r.msg.payload)
            assert.deepEqual([img.bitmap.width, img.bitmap.height], [20, 10])
            const p = pixel(img, 15, 5) // blue half
            assert.ok(p[2] > 200 && p[0] < 60, 'still blue: ' + p)
        })

        it('reads webp from a base64 string', async () => {
            const input = (await toWebp(testPng())).toString('base64')
            const r = await runJimp(jimpConfig('none', [], { ret: 'b64' }), { payload: input })
            assert.ok(r.msg, 'no output: ' + (r.errors[0] && r.errors[0].message))
            assert.equal(r.msg.imageInfo.MIME, 'image/webp')
            assert.ok(r.msg.payload.startsWith('data:image/webp;base64,'))
        })

        it('keeps transparency', async () => {
            const input = await toWebp(makePng(8, 8, (x) => x < 4 ? [255, 0, 0, 255] : [0, 0, 255, 0]))
            const r = await runJimp(jimpConfig('invert'), { payload: input })
            const img = await readWebp(r.msg.payload)
            assert.equal(pixel(img, 1, 1)[3], 255)
            assert.equal(pixel(img, 6, 1)[3], 0)
        })

        it('png to webp with the convert function', async () => {
            const r = await runJimp(jimpConfig('convert', ['webp']), { payload: testPng() })
            assert.ok(r.msg, 'no output: ' + (r.errors[0] && r.errors[0].message))
            assert.ok(isWebp(r.msg.payload))
            assert.equal(r.msg.imageInfo.MIME, 'image/webp')
            const img = await readWebp(r.msg.payload)
            assert.deepEqual([img.bitmap.width, img.bitmap.height], [40, 20])
            const p = pixel(img, 10, 10)
            assert.ok(p[0] > 240 && p[1] < 20 && p[2] < 20, 'still red: ' + p)
        })

        it('webp to png with the convert function', async () => {
            const r = await runJimp(jimpConfig('convert', ['png']), { payload: await toWebp(testPng()) })
            assert.ok(isPng(r.msg.payload))
            assert.equal(r.msg.imageInfo.MIME, 'image/png')
        })

        it('convert accepts mime types and jpg', async () => {
            const a = await runJimp(jimpConfig('convert', ['image/webp']), { payload: testPng() })
            assert.ok(isWebp(a.msg.payload))
            await h.helper.unload()
            const b = await runJimp(jimpConfig('convert', ['jpg']), { payload: testPng() })
            assert.equal(b.msg.payload[0], 0xff)
            assert.equal(b.msg.payload[1], 0xd8)
        })

        it('convert can be used in a batch', async () => {
            const r = await runJimp(batchConfig([{ name: 'resize', parameters: [20, 10] }, { name: 'convert', parameters: ['webp'] }]), { payload: testPng() })
            assert.ok(isWebp(r.msg.payload))
            assert.equal(r.msg.imageInfo.width, 20)
        })

        it('a blank image can be created as webp', async () => {
            const payload = { w: 30, h: 10, width: 30, height: 10, background: 0xff0000ff, color: 0xff0000ff, format: 'webp' }
            const r = await runJimp(jimpConfig('none'), { payload })
            assert.ok(r.msg, 'no output: ' + (r.errors[0] && r.errors[0].message))
            assert.ok(isWebp(r.msg.payload))
            assert.equal(r.msg.imageInfo.MIME, 'image/webp')
        })

        it('convert to an unsupported format is an error', async () => {
            const r = await runJimp(jimpConfig('convert', ['heic']), { payload: testPng() })
            assert.equal(r.msg, undefined)
            assert.equal(r.errors.length, 1)
        })

        it('quality changes the size of a webp', async () => {
            const low = await runJimp(batchConfig([{ name: 'quality', parameters: [10] }]), { payload: await toWebp(noisyPng(), 100) })
            await h.helper.unload()
            const high = await runJimp(batchConfig([{ name: 'quality', parameters: [100] }]), { payload: await toWebp(noisyPng(), 100) })
            assert.ok(isWebp(low.msg.payload) && isWebp(high.msg.payload))
            assert.ok(low.msg.payload.length < high.msg.payload.length, `${low.msg.payload.length} should be smaller than ${high.msg.payload.length}`)
        })

        it('convert then quality: png to a small webp', async () => {
            const r = await runJimp(batchConfig([{ name: 'convert', parameters: ['webp'] }, { name: 'quality', parameters: [20] }]), { payload: noisyPng() })
            assert.ok(r.msg, 'no output: ' + (r.errors[0] && r.errors[0].message))
            assert.ok(isWebp(r.msg.payload))
            assert.ok(r.msg.payload.length < noisyPng().length)
        })

        it('output as a jimp image can be passed to another jimp node', async () => {
            const r1 = await runJimp(jimpConfig('convert', ['webp'], { ret: 'img' }), { payload: testPng() })
            assert.ok(isJimpImage(r1.msg.payload))
            await h.helper.unload()
            const r2 = await runJimp(jimpConfig('resize', [20, 10]), { payload: r1.msg.payload })
            assert.ok(isWebp(r2.msg.payload))
        })

        it('images from another jimp instance (e.g. another package) can be processed and used as parameters', async () => {
            const foreign = new h.Jimp({ width: 40, height: 20, color: 0x00ff00ff })
            const r = await runJimp(jimpConfig('composite', [['src', 'msg'], 0, 0, ['BLEND_SOURCE_OVER', 'Blend'], 1, 1]), { payload: foreign, src: new h.Jimp({ width: 10, height: 10, color: 0xff0000ff }) })
            assert.ok(r.msg, 'no output: ' + (r.errors[0] && r.errors[0].message))
            const img = await h.decode(r.msg.payload)
            assert.ok(near(h.px(img, 5, 5)[0], 255, 2) && h.px(img, 5, 5)[1] === 0, 'the composited image is red: ' + h.px(img, 5, 5))
            const green = h.px(img, 30, 10) // jimp 1.x colours can be off by one
            assert.ok(green[0] <= 2 && near(green[1], 255, 2) && green[2] <= 2 && green[3] === 255, 'the payload image is green: ' + green)
        })
    })

    describe('barcode decoder', () => {
        it('decodes a QR code from a webp image', async () => {
            const png = await bwipjs.toBuffer({ bcid: 'qrcode', text: 'from webp', scale: 4, paddingwidth: 10, paddingheight: 10, backgroundcolor: 'ffffff' })
            const webp = await toWebp(png, 100)
            const r = await run('xzingDecode.js', { id: 'n1', type: 'Barcode Decoder', data: 'payload', dataType: 'msg', tryharder: true, tryharderType: 'bool' }, { payload: webp })
            assert.ok(r.msg, 'no output: ' + (r.errors[0] && r.errors[0].message))
            assert.equal(r.msg.payload.text, 'from webp')
        })
    })

    describe('image viewer', () => {
        const viewer = { id: 'n1', type: 'image viewer', active: true, data: 'payload', dataType: 'msg' }
        it('shows a webp image', async () => {
            const r = await run('imageViewer.js', viewer, { payload: await toWebp(testPng()) })
            assert.ok(r.msg, 'no output: ' + (r.errors[0] && r.errors[0].message))
            for (let i = 0; i < 40 && !(h.helper.published || []).length; i++) await new Promise(resolve => setTimeout(resolve, 25))
            const shown = h.helper.published.find(p => p.data && p.data.data)
            assert.ok(shown, 'the image was published to the editor')
            assert.ok(shown.data.data.startsWith('data:image/webp;base64,'), shown.data.data.slice(0, 30))
        })
        it('shows a webp image sent as base64 without a mime type', async () => {
            const r = await run('imageViewer.js', viewer, { payload: (await toWebp(testPng())).toString('base64') })
            assert.ok(r.msg)
            for (let i = 0; i < 40 && !(h.helper.published || []).length; i++) await new Promise(resolve => setTimeout(resolve, 25))
            const shown = h.helper.published.find(p => p.data && p.data.data)
            assert.ok(shown && shown.data.data.startsWith('data:image/webp;base64,'))
            assert.ok(near(1, 1))
        })
    })
})
