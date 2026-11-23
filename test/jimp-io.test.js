'use strict'
/**
 * jimp-image node: image inputs, outputs, msg decoration and error handling
 */
const fs = require('fs')
const os = require('os')
const path = require('path')
const { describe, it, before, after, afterEach } = require('node:test')
const assert = require('node:assert/strict')
const h = require('./helpers')
const { jimpConfig, runJimp, px, decode, encode, testPng, solidPng, RED, BLUE, Jimp } = h

const dims = img => [img.bitmap.width, img.bitmap.height]

describe('jimp-image: input / output', () => {
    before(() => h.helper.startServer())
    afterEach(() => h.helper.unload())
    after(() => h.helper.stopServer())

    describe('input', () => {
        it('Buffer', async () => {
            const r = await runJimp(jimpConfig('none'), { payload: testPng() })
            assert.deepEqual(dims(await decode(r.msg.payload)), [40, 20])
        })
        it('base64 string', async () => {
            const r = await runJimp(jimpConfig('none'), { payload: testPng().toString('base64') })
            assert.deepEqual(dims(await decode(r.msg.payload)), [40, 20])
        })
        it('base64 data URI', async () => {
            const r = await runJimp(jimpConfig('none'), { payload: 'data:image/png;base64,' + testPng().toString('base64') })
            assert.deepEqual(dims(await decode(r.msg.payload)), [40, 20])
        })
        it('Jimp image instance', async () => {
            const r = await runJimp(jimpConfig('resize', [20, 10]), { payload: await decode(testPng()) })
            assert.deepEqual(dims(await decode(r.msg.payload)), [20, 10])
        })
        it('file name', async () => {
            const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'image-tools-'))
            const file = path.join(dir, 'in.png')
            fs.writeFileSync(file, testPng())
            try {
                const r = await runJimp(jimpConfig('none', [], { data: file, dataType: 'str' }), { payload: null })
                assert.ok(r.msg, 'no output: ' + (r.errors[0] && r.errors[0].message))
                assert.deepEqual(dims(await decode(r.msg.payload)), [40, 20])
            } finally {
                fs.rmSync(dir, { recursive: true, force: true })
            }
        })
        it('creates a blank image from {w, h, background}', async () => {
            const r = await runJimp(jimpConfig('none'), { payload: { w: 30, h: 10, width: 30, height: 10, background: 0xff0000ff, color: 0xff0000ff } })
            assert.ok(r.msg, 'no output: ' + (r.errors[0] && r.errors[0].message))
            const img = await decode(r.msg.payload)
            assert.deepEqual(dims(img), [30, 10])
            const p = px(img, 5, 5) // jimp 1.x can be off by one on the red channel
            assert.ok(h.near(p[0], 255, 2) && p[1] === 0 && p[2] === 0 && p[3] === 255, String(p))
        })
        it('reads the image from a different msg property', async () => {
            const r = await runJimp(jimpConfig('none', [], { data: 'picture' }), { picture: testPng() })
            assert.deepEqual(dims(await decode(r.msg.payload)), [40, 20])
        })
        it('reads the image from a flow context variable', async () => {
            const r = await runJimp(jimpConfig('none', [], { data: 'pic', dataType: 'flow' }), { payload: null })
            assert.equal(r.msg, undefined, 'flow variable is not set so there is nothing to process')
            assert.ok(r.errors.length >= 1)
        })
        it('jpeg input', async () => {
            const jpg = await encode(await decode(testPng()), 'image/jpeg')
            const r = await runJimp(jimpConfig('resize', [20, 10]), { payload: jpg })
            assert.ok(r.msg, 'no output: ' + (r.errors[0] && r.errors[0].message))
            const img = await decode(r.msg.payload)
            assert.deepEqual(dims(img), [20, 10])
            assert.equal(r.msg.imageInfo.MIME, 'image/jpeg')
        })
        it('bmp input', async () => {
            const bmp = await encode(await decode(testPng()), 'image/bmp')
            const r = await runJimp(jimpConfig('resize', [20, 10]), { payload: bmp })
            assert.ok(r.msg, 'no output: ' + (r.errors[0] && r.errors[0].message))
            assert.deepEqual(dims(await decode(r.msg.payload)), [20, 10])
            assert.equal(r.msg.imageInfo.MIME, 'image/bmp')
        })
    })

    describe('output', () => {
        it('buf: Buffer in the same format as the input', async () => {
            const r = await runJimp(jimpConfig('none', [], { ret: 'buf' }), { payload: testPng() })
            assert.ok(Buffer.isBuffer(r.msg.payload))
            assert.equal(r.msg.payload.subarray(1, 4).toString(), 'PNG')
        })
        it('b64: base64 string', async () => {
            const r = await runJimp(jimpConfig('none', [], { ret: 'b64' }), { payload: testPng() })
            assert.equal(typeof r.msg.payload, 'string')
            assert.deepEqual(dims(await decode(r.msg.payload)), [40, 20])
        })
        it('img: Jimp image', async () => {
            const r = await runJimp(jimpConfig('none', [], { ret: 'img' }), { payload: testPng() })
            assert.ok(r.msg.payload instanceof Jimp)
            assert.deepEqual(dims(r.msg.payload), [40, 20])
        })
        it('jpeg in, jpeg out', async () => {
            const jpg = await encode(await decode(testPng()), 'image/jpeg')
            const r = await runJimp(jimpConfig('none'), { payload: jpg })
            assert.equal(r.msg.payload[0], 0xff)
            assert.equal(r.msg.payload[1], 0xd8)
        })
        it('sendProperty: custom (nested) property', async () => {
            const r = await runJimp(jimpConfig('none', [], { sendProperty: 'result.image' }), { payload: testPng(), topic: 'keep me' })
            assert.ok(Buffer.isBuffer(r.msg.result.image))
            assert.ok(Buffer.isBuffer(r.msg.payload), 'original payload is untouched')
            assert.equal(r.msg.topic, 'keep me')
        })
        it('adds msg.imageInfo', async () => {
            const r = await runJimp(jimpConfig('resize', [20, 10]), { payload: testPng() })
            assert.equal(r.msg.imageInfo.width, 20)
            assert.equal(r.msg.imageInfo.height, 10)
            assert.equal(r.msg.imageInfo.MIME, 'image/png')
            assert.equal(typeof r.msg.imageInfo.hasAlpha, 'boolean')
        })
        it('adds msg.jobs and msg.performance', async () => {
            const r = await runJimp(jimpConfig('resize', [20, 10]), { payload: testPng() })
            assert.ok(Array.isArray(r.msg.jobs))
            assert.equal(r.msg.jobs[0].name, 'resize')
            assert.ok(r.msg.performance && typeof r.msg.performance === 'object')
        })
        it('keeps other msg properties', async () => {
            const r = await runJimp(jimpConfig('none'), { payload: testPng(), topic: 'abc', _msgid: 'xyz', custom: { a: 1 } })
            assert.equal(r.msg.topic, 'abc')
            assert.deepEqual(r.msg.custom, { a: 1 })
        })
    })

    describe('parameters', () => {
        it('parameter values can come from msg', async () => {
            const r = await runJimp(jimpConfig('resize', [['w', 'msg'], ['h', 'msg']]), { payload: testPng(), w: 10, h: 5 })
            assert.deepEqual(dims(await decode(r.msg.payload)), [10, 5])
        })
        it('parameter values can be jsonata', { todo: 'jsonata is evaluated asynchronously and the node does not wait for the result' }, async () => {
            const r = await runJimp(jimpConfig('resize', [['5 * 4', 'jsonata'], ['5 * 2', 'jsonata']]), { payload: testPng() })
            assert.deepEqual(dims(await decode(r.msg.payload)), [20, 10])
        })
        it('numeric strings for num parameters either work or fail cleanly (jimp 0.x rejects them, 1.x coerces them)', async () => {
            const r = await runJimp(jimpConfig('crop', [['10', 'str'], ['5', 'str'], ['10', 'str'], ['10', 'str']]), { payload: testPng() })
            if (r.msg) {
                assert.deepEqual(dims(await decode(r.msg.payload)), [10, 10])
            } else {
                assert.equal(r.errors.length, 1)
            }
        })
    })

    describe('errors', () => {
        it('empty image property', async () => {
            const r = await runJimp(jimpConfig('none'), { payload: '' })
            assert.equal(r.msg, undefined)
            assert.equal(r.errors.length, 1)
            assert.equal(r.statuses.at(-1).fill, 'red')
        })
        it('missing image property', async () => {
            const r = await runJimp(jimpConfig('none'), {})
            assert.equal(r.msg, undefined)
            assert.ok(r.errors.length >= 1)
        })
        it('data that is not an image', async () => {
            const r = await runJimp(jimpConfig('none'), { payload: Buffer.from('this is not an image at all') })
            assert.equal(r.msg, undefined)
            assert.ok(r.errors.length >= 1)
            assert.equal(r.statuses.at(-1).fill, 'red')
        })
        it('a missing file', async () => {
            const r = await runJimp(jimpConfig('none', [], { data: path.join(os.tmpdir(), 'does-not-exist-1234.png'), dataType: 'str' }), { payload: null })
            assert.equal(r.msg, undefined)
            assert.ok(r.errors.length >= 1)
        })
        it('parameter that cannot be evaluated', async () => {
            const r = await runJimp(jimpConfig('resize', [['(((', 'jsonata'], 10]), { payload: testPng() })
            assert.equal(r.msg, undefined)
            assert.ok(r.errors.length >= 1)
        })
    })

    it('can process several messages in a row', async () => {
        const r1 = await runJimp(jimpConfig('resize', [20, 10]), { payload: testPng() })
        assert.deepEqual(dims(await decode(r1.msg.payload)), [20, 10])
        await h.helper.unload()
        const r2 = await runJimp(jimpConfig('resize', [10, 5]), { payload: solidPng(40, 20) })
        assert.deepEqual(dims(await decode(r2.msg.payload)), [10, 5])
        assert.ok(BLUE)
    })
})
