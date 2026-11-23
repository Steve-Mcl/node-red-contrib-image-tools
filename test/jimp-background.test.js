'use strict'
/**
 * The background function. Jimp 0.x had image.background(hex), jimp 1.x does not, so the node provides it.
 * The background colour is used for:
 *  - the new pixels made by contain and rotate (jimp 1.x does this natively through image.background)
 *  - encoding to formats without transparency (JPEG)
 * These tests describe the jimp 0.x behaviour and should pass on both 0.x and 1.x.
 */
const { describe, it, before, after, afterEach } = require('node:test')
const assert = require('node:assert/strict')
const h = require('./helpers')
const { batchConfig, jimpConfig, runJimp, runJimpImage, px, near, decode, encode, makePng, solidPng, RED, BLUE, GREEN } = h

const dims = img => [img.bitmap.width, img.bitmap.height]
const WHITE_HEX = 0xffffffff // 4294967295
const GREEN_HEX = 0x00ff00ff // 16711935
const nearPx = (p, expected, tol = 3) => p.every((v, i) => near(v, expected[i], tol))

describe('jimp-image: background', () => {
    before(() => h.helper.startServer())
    afterEach(() => h.helper.unload())
    after(() => h.helper.stopServer())

    describe('contain', () => {
        it('letterbox is transparent by default', async () => {
            const { img } = await runJimpImage(batchConfig([{ name: 'contain', parameters: [30, 30] }]))
            assert.equal(px(img, 15, 0)[3], 0)
        })
        it('letterbox uses the background colour', async () => {
            const { img } = await runJimpImage(batchConfig([
                { name: 'background', parameters: [GREEN_HEX] },
                { name: 'contain', parameters: [30, 30] }
            ]))
            assert.deepEqual(dims(img), [30, 30])
            assert.deepEqual(px(img, 15, 0), GREEN)
            assert.deepEqual(px(img, 15, 29), GREEN)
            assert.deepEqual(px(img, 5, 15), RED, 'the image itself is not touched')
        })
        it('background from the dropdown function (not batch)', async () => {
            const { img } = await runJimpImage(jimpConfig('background', [[GREEN_HEX, 'num']]))
            assert.deepEqual(dims(img), [40, 20])
            assert.deepEqual(px(img, 30, 10), BLUE)
        })
    })

    describe('rotate', () => {
        it('new corners are transparent by default', async () => {
            const { img } = await runJimpImage(batchConfig([{ name: 'rotate', parameters: [45] }]))
            assert.equal(px(img, 0, 0)[3], 0)
        })
        it('new corners use the background colour', async () => {
            const { img } = await runJimpImage(batchConfig([
                { name: 'background', parameters: [GREEN_HEX] },
                { name: 'rotate', parameters: [45] }
            ]))
            assert.ok(img.bitmap.width > 40)
            assert.deepEqual(px(img, 0, 0), GREEN)
            assert.deepEqual(px(img, img.bitmap.width - 1, img.bitmap.height - 1), GREEN)
            const c = px(img, Math.floor(img.bitmap.width / 2), Math.floor(img.bitmap.height / 2))
            assert.ok(c[3] === 255 && (c[0] === 255 || c[2] === 255), 'the middle is still the image: ' + c)
        })
    })

    describe('formats without transparency (JPEG)', () => {
        const jpegOfRed = async () => encode(await decode(solidPng(20, 20, RED)), 'image/jpeg')
        it('transparency is flattened onto the background colour', async () => {
            const { img } = await runJimpImage(batchConfig([
                { name: 'background', parameters: [WHITE_HEX] },
                { name: 'fade', parameters: [0.5] }
            ]), await jpegOfRed())
            const p = px(img, 10, 10)
            assert.ok(p[0] > 240 && p[1] > 90 && p[1] < 170 && p[2] > 90 && p[2] < 170, 'red faded onto white is pink: ' + p)
        })
        it('without a background the image is encoded as it was', async () => {
            const { img } = await runJimpImage(batchConfig([{ name: 'fade', parameters: [0.5] }]), await jpegOfRed())
            assert.ok(nearPx(px(img, 10, 10), [255, 0, 0, 255], 12), String(px(img, 10, 10)))
        })
        it('PNG output keeps its transparency', async () => {
            const { img } = await runJimpImage(batchConfig([
                { name: 'background', parameters: [WHITE_HEX] },
                { name: 'fade', parameters: [0.5] }
            ]))
            assert.ok(near(px(img, 10, 10)[3], 128, 2))
            assert.deepEqual(px(img, 10, 10).slice(0, 3), [255, 0, 0])
        })
    })

    it('hex must be a number', async () => {
        const r = await runJimp(batchConfig([{ name: 'background', parameters: ['white'] }]), { payload: h.testPng() })
        assert.equal(r.msg, undefined)
        assert.equal(r.errors.length, 1)
    })

    it('a blank image remembers the colour it was created with (as jimp 0.x did)', async () => {
        const r = await runJimp(batchConfig([{ name: 'contain', parameters: [20, 20] }]), {
            payload: { w: 10, h: 5, width: 10, height: 5, background: GREEN_HEX, color: GREEN_HEX }
        })
        assert.ok(r.msg, 'no output: ' + (r.errors[0] && r.errors[0].message))
        const img = await decode(r.msg.payload)
        assert.deepEqual(dims(img), [20, 20])
        assert.ok(nearPx(px(img, 10, 0), GREEN, 2), 'letterbox is green: ' + px(img, 10, 0))
    })
})
