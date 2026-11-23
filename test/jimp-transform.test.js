'use strict'
/**
 * jimp-image node: geometry functions (resize, scale, crop, flip, rotate, ...)
 */
const { describe, it, before, after, afterEach } = require('node:test')
const assert = require('node:assert/strict')
const h = require('./helpers')
const { jimpConfig, runJimpImage, px, bounds, testPng, makePng, RED, BLUE, GREEN } = h

const dims = img => [img.bitmap.width, img.bitmap.height]
const isGreen = p => p[1] > 200 && p[0] < 60 && p[2] < 60

describe('jimp-image: transforms', () => {
    before(() => h.helper.startServer())
    afterEach(() => h.helper.unload())
    after(() => h.helper.stopServer())

    it('none: loads the image and leaves it untouched', async () => {
        const { img } = await runJimpImage(jimpConfig('none'))
        assert.deepEqual(dims(img), [40, 20])
        assert.deepEqual(px(img, 30, 10), BLUE)
        assert.deepEqual(px(img, 10, 10), RED)
        assert.deepEqual(px(img, 1, 1), GREEN)
    })

    describe('resize', () => {
        it('resizes to w x h', async () => {
            const { img } = await runJimpImage(jimpConfig('resize', [20, 10]))
            assert.deepEqual(dims(img), [20, 10])
            assert.deepEqual(px(img, 15, 5), BLUE)
        })
        it('keeps aspect ratio when height is auto', async () => {
            const { img } = await runJimpImage(jimpConfig('resize', [80, ['', 'auto']]))
            assert.deepEqual(dims(img), [80, 40])
        })
        it('keeps aspect ratio when width is auto', async () => {
            const { img } = await runJimpImage(jimpConfig('resize', [['', 'auto'], 10]))
            assert.deepEqual(dims(img), [20, 10])
        })
        for (const mode of ['RESIZE_NEAREST_NEIGHBOR', 'RESIZE_BILINEAR', 'RESIZE_BICUBIC', 'RESIZE_HERMITE', 'RESIZE_BEZIER']) {
            it(`supports resize mode ${mode}`, async () => {
                const { img, errors } = await runJimpImage(jimpConfig('resize', [60, 30, [mode, 'Jimp']]))
                assert.equal(errors.length, 0)
                assert.deepEqual(dims(img), [60, 30])
                assert.deepEqual(px(img, 50, 15), BLUE)
                assert.deepEqual(px(img, 20, 15), RED)
            })
        }
        it('nearest neighbour keeps hard edges when upscaling', async () => {
            const { img } = await runJimpImage(jimpConfig('resize', [80, 40, ['RESIZE_NEAREST_NEIGHBOR', 'Jimp']]))
            for (let x = 0; x < 80; x++) {
                const p = px(img, x, 30)
                assert.ok(h.near(p[0], 255) && p[2] === 0 || p[0] === 0 && h.near(p[2], 255), `pixel ${x} should be pure red or blue: ${p}`)
            }
        })
    })

    describe('scale', () => {
        it('scales up by a factor', async () => {
            const { img } = await runJimpImage(jimpConfig('scale', [2]))
            assert.deepEqual(dims(img), [80, 40])
        })
        it('scales down by a factor', async () => {
            const { img } = await runJimpImage(jimpConfig('scale', [0.5]))
            assert.deepEqual(dims(img), [20, 10])
        })
        it('accepts a resize mode', async () => {
            const { img } = await runJimpImage(jimpConfig('scale', [2, ['RESIZE_BILINEAR', 'Jimp']]))
            assert.deepEqual(dims(img), [80, 40])
        })
    })

    describe('scaleToFit', () => {
        it('fits inside the box preserving aspect ratio', async () => {
            const { img } = await runJimpImage(jimpConfig('scaleToFit', [20, 20]))
            assert.deepEqual(dims(img), [20, 10])
        })
        it('supports auto height', async () => {
            const { img } = await runJimpImage(jimpConfig('scaleToFit', [80, ['', 'auto']]))
            assert.deepEqual(dims(img), [80, 40])
        })
    })

    describe('contain / cover', () => {
        it('contain: result is exactly w x h and letterboxed', async () => {
            const { img } = await runJimpImage(jimpConfig('contain', [30, 30]))
            assert.deepEqual(dims(img), [30, 30])
            assert.equal(px(img, 15, 0)[3], 0, 'top letterbox should be transparent')
            assert.equal(px(img, 15, 29)[3], 0, 'bottom letterbox should be transparent')
            assert.equal(px(img, 5, 15)[3], 255)
        })
        it('contain: honours alignment', async () => {
            const { img } = await runJimpImage(jimpConfig('contain', [30, 30, ['Top Left', 'Align']]))
            assert.deepEqual(dims(img), [30, 30])
            assert.equal(px(img, 15, 2)[3], 255, 'image is at the top')
            assert.equal(px(img, 15, 29)[3], 0, 'letterbox is at the bottom')
        })
        it('cover: result is exactly w x h with no transparent pixels', async () => {
            const { img } = await runJimpImage(jimpConfig('cover', [30, 30]))
            assert.deepEqual(dims(img), [30, 30])
            assert.equal(h.countPixels(img, p => p[3] !== 255), 0)
        })
    })

    describe('crop / autocrop', () => {
        it('crop: extracts the region', async () => {
            const { img } = await runJimpImage(jimpConfig('crop', [10, 5, 10, 10]))
            assert.deepEqual(dims(img), [10, 10])
            assert.deepEqual(px(img, 5, 5), RED)
            assert.equal(h.countPixels(img, isGreen), 0)
        })
        it('crop: region including the marker', async () => {
            const { img } = await runJimpImage(jimpConfig('crop', [0, 0, 8, 8]))
            assert.deepEqual(dims(img), [8, 8])
            assert.deepEqual(px(img, 1, 1), GREEN)
            assert.deepEqual(px(img, 6, 6), RED)
        })
        it('autocrop: removes same colour borders', async () => {
            const png = makePng(30, 30, (x, y) => (x >= 10 && x < 20 && y >= 12 && y < 22) ? RED : [255, 255, 255, 255])
            const { img } = await runJimpImage(jimpConfig('autocrop1'), png)
            assert.deepEqual(dims(img), [10, 10])
            assert.deepEqual(px(img, 5, 5), RED)
        })
        it('autocrop: tolerance and cropOnlyFrames as separate parameters', async () => {
            const png = makePng(30, 30, (x, y) => (x >= 10 && x < 20 && y >= 12 && y < 22) ? RED : [255, 255, 255, 255])
            const { img } = await runJimpImage(jimpConfig('autocrop1', [[0.0002, 'num'], [false, 'bool']]), png)
            assert.deepEqual(dims(img), [10, 10])
        })
        it('autocrop: options json', async () => {
            const png = makePng(30, 30, (x, y) => (x >= 10 && x < 20 && y >= 12 && y < 22) ? RED : [255, 255, 255, 255])
            const { img } = await runJimpImage(jimpConfig('autocrop2', [{ tolerance: 0.0002, cropOnlyFrames: false }]), png)
            assert.deepEqual(dims(img), [10, 10])
        })
    })

    describe('flip / mirror', () => {
        it('flip horizontally', async () => {
            const { img } = await runJimpImage(jimpConfig('flip', [true, false]))
            assert.deepEqual(dims(img), [40, 20])
            assert.deepEqual(px(img, 38, 1), GREEN, 'marker moves to the top right')
            assert.deepEqual(px(img, 30, 10), RED, 'red moves to the right')
            assert.deepEqual(px(img, 10, 10), BLUE)
        })
        it('flip vertically', async () => {
            const { img } = await runJimpImage(jimpConfig('flip', [false, true]))
            assert.deepEqual(px(img, 1, 18), GREEN, 'marker moves to the bottom left')
            assert.deepEqual(px(img, 10, 10), RED, 'left/right unchanged')
        })
        it('flip both', async () => {
            const { img } = await runJimpImage(jimpConfig('flip', [true, true]))
            assert.deepEqual(px(img, 38, 18), GREEN)
        })
        it('mirror is an alias of flip', async () => {
            const { img } = await runJimpImage(jimpConfig('mirror', [true, false]))
            assert.deepEqual(px(img, 38, 1), GREEN)
        })
    })

    describe('rotate', () => {
        it('rotate 90 swaps width and height', async () => {
            const { img } = await runJimpImage(jimpConfig('rotate', [90]))
            assert.deepEqual(dims(img), [20, 40])
            const b = bounds(img, isGreen)
            assert.ok(b, 'marker still present')
            assert.equal(b.x1 - b.x0, 3)
            assert.equal(b.y1 - b.y0, 3)
        })
        it('rotate 180 keeps size and moves marker to the opposite corner', async () => {
            const { img } = await runJimpImage(jimpConfig('rotate', [180]))
            assert.deepEqual(dims(img), [40, 20])
            assert.deepEqual(px(img, 38, 18), GREEN)
            assert.deepEqual(px(img, 10, 10), BLUE)
        })
        it('rotate 360 is a no-op', async () => {
            const { img } = await runJimpImage(jimpConfig('rotate', [360]))
            assert.deepEqual(dims(img), [40, 20])
            assert.deepEqual(px(img, 1, 1), GREEN)
        })
        it('rotate with resize disabled keeps the original size', async () => {
            const { img } = await runJimpImage(jimpConfig('rotate', [45, [false, 'bool']]))
            assert.deepEqual(dims(img), [40, 20])
        })
        it('rotate 45 with resize enabled grows the canvas', async () => {
            const { img } = await runJimpImage(jimpConfig('rotate', [45]))
            assert.ok(img.bitmap.width > 40 && img.bitmap.height > 20, dims(img).join('x'))
        })
    })

    it('clone: returns an identical image', async () => {
        const { img } = await runJimpImage(jimpConfig('clone'))
        assert.deepEqual(dims(img), [40, 20])
        assert.deepEqual(px(img, 1, 1), GREEN)
    })
})

module.exports = { testPng }
