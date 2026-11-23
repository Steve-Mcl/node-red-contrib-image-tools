'use strict'
/**
 * jimp-image node: colour / filter functions
 */
const { describe, it, before, after, afterEach } = require('node:test')
const assert = require('node:assert/strict')
const h = require('./helpers')
const { jimpConfig, batchConfig, runJimpImage, px, countPixels, near, makePng, RED, BLUE, GREEN } = h

const dims = img => [img.bitmap.width, img.bitmap.height]
const isGrey = p => p[0] === p[1] && p[1] === p[2]

describe('jimp-image: filters', () => {
    before(() => h.helper.startServer())
    afterEach(() => h.helper.unload())
    after(() => h.helper.stopServer())

    it('invert: inverts colour channels, keeps alpha', async () => {
        const { img } = await runJimpImage(jimpConfig('invert'))
        assert.deepEqual(px(img, 10, 10), [0, 255, 255, 255])
        assert.deepEqual(px(img, 30, 10), [255, 255, 0, 255])
        assert.deepEqual(px(img, 1, 1), [255, 0, 255, 255])
    })

    it('greyscale: removes colour', async () => {
        const { img } = await runJimpImage(jimpConfig('greyscale'))
        assert.equal(countPixels(img, p => !isGrey(p)), 0)
        assert.equal(countPixels(img, p => p[3] !== 255), 0)
        assert.notDeepEqual(px(img, 10, 10), px(img, 30, 10), 'red and blue have different luminance')
    })

    it('sepia: tints the image', async () => {
        const { img } = await runJimpImage(jimpConfig('sepia'))
        const p = px(img, 30, 10)
        assert.notDeepEqual(p, BLUE)
        assert.equal(p[3], 255)
        assert.notDeepEqual(px(img, 10, 10), RED)
    })

    describe('alpha', () => {
        it('opacity: multiplies the alpha channel', async () => {
            const { img } = await runJimpImage(jimpConfig('opacity', [0.5]))
            assert.ok(near(px(img, 10, 10)[3], 128, 2), String(px(img, 10, 10)))
        })
        it('fade: fades the image', async () => {
            const { img } = await runJimpImage(jimpConfig('fade', [0.5]))
            assert.ok(near(px(img, 10, 10)[3], 128, 2), String(px(img, 10, 10)))
        })
        it('opaque: sets alpha to 255', async () => {
            const png = makePng(10, 10, () => [10, 20, 30, 50])
            const { img } = await runJimpImage(jimpConfig('opaque'), png)
            assert.deepEqual(px(img, 5, 5), [10, 20, 30, 255])
        })
    })

    describe('brightness (jimp 0.x semantics: -1 black ... 0 unchanged ... +1 white)', () => {
        it('0 leaves the image unchanged', async () => {
            const { img } = await runJimpImage(jimpConfig('brightness', [0]))
            assert.deepEqual(px(img, 10, 10), RED)
            assert.deepEqual(px(img, 30, 10), BLUE)
        })
        it('1 gives a fully white image', async () => {
            const { img } = await runJimpImage(jimpConfig('brightness', [1]))
            assert.deepEqual(px(img, 10, 10), [255, 255, 255, 255])
            assert.deepEqual(px(img, 30, 10), [255, 255, 255, 255])
        })
        it('-1 gives a fully black image', async () => {
            const { img } = await runJimpImage(jimpConfig('brightness', [-1]))
            assert.deepEqual(px(img, 10, 10), [0, 0, 0, 255])
            assert.deepEqual(px(img, 30, 10), [0, 0, 0, 255])
        })
        it('0.5 lightens by half', async () => {
            const { img } = await runJimpImage(jimpConfig('brightness', [0.5]))
            const p = px(img, 30, 10) // blue (0,0,255) -> (127,127,255)
            assert.ok(near(p[0], 128, 2) && near(p[1], 128, 2) && p[2] === 255, String(p))
        })
        it('-0.5 darkens by half', async () => {
            const { img } = await runJimpImage(jimpConfig('brightness', [-0.5]))
            const p = px(img, 30, 10) // blue (0,0,255) -> (0,0,127)
            assert.ok(p[0] === 0 && p[1] === 0 && near(p[2], 128, 2), String(p))
        })
    })

    it('brightness: values outside -1..+1 are rejected', async () => {
        const r = await h.runJimp(jimpConfig('brightness', [2]), { payload: h.testPng() })
        assert.equal(r.msg, undefined)
        assert.equal(r.errors.length, 1)
    })

    it('brightness: a batch job named brightness uses the same scale as the dropdown function', async () => {
        const { img } = await runJimpImage(batchConfig([{ name: 'brightness', parameters: [1] }]))
        assert.deepEqual(px(img, 10, 10), [255, 255, 255, 255])
    })

    // New in v3 (jimp 1.x multiplier). Not available when running against jimp 0.x
    describe('brightness multiplier (jimp 1.x scale: 0 black, 1 unchanged)', { skip: !h.fnDefs().brightnessMultiply && 'jimp 0.x has no multiplier brightness' }, () => {
        it('1 leaves the image unchanged', async () => {
            const { img } = await runJimpImage(jimpConfig('brightnessMultiply', [1]))
            assert.deepEqual(px(img, 10, 10), RED)
            assert.deepEqual(px(img, 30, 10), BLUE)
        })
        it('0 gives a fully black image', async () => {
            const { img } = await runJimpImage(jimpConfig('brightnessMultiply', [0]))
            assert.deepEqual(px(img, 30, 10), [0, 0, 0, 255])
        })
        it('0.5 halves each channel', async () => {
            const { img } = await runJimpImage(jimpConfig('brightnessMultiply', [0.5]))
            const p = px(img, 30, 10)
            assert.ok(p[0] === 0 && p[1] === 0 && near(p[2], 128, 2), String(p))
        })
        it('in a batch', async () => {
            const { img } = await runJimpImage(batchConfig([{ name: 'brightnessMultiply', parameters: [0.5] }]))
            assert.ok(near(px(img, 30, 10)[2], 128, 2))
        })
    })

    it('contrast: runs and preserves size', async () => {
        const { img, errors } = await runJimpImage(jimpConfig('contrast', [0.5]))
        assert.equal(errors.length, 0)
        assert.deepEqual(dims(img), [40, 20])
    })

    for (const fn of ['blur', 'gaussian']) {
        it(`${fn}: softens the edge between red and blue`, async () => {
            const { img } = await runJimpImage(jimpConfig(fn, [2]))
            assert.deepEqual(dims(img), [40, 20])
            assert.ok(near(px(img, 10, 15)[0], 255, 3) && px(img, 10, 15)[2] === 0, 'away from the edge is (nearly) unchanged')
            const edge = px(img, 19, 15)
            assert.ok(edge[2] > 0, `edge pixel picked up some blue: ${edge}`)
        })
    }

    it('posterize: runs', async () => {
        const { img, errors } = await runJimpImage(jimpConfig('posterize', [4]))
        assert.equal(errors.length, 0)
        assert.deepEqual(dims(img), [40, 20])
    })

    it('pixelate: blocks of pixels share a colour', async () => {
        const { img } = await runJimpImage(jimpConfig('pixelate', [10]))
        assert.deepEqual(dims(img), [40, 20])
        assert.deepEqual(px(img, 0, 0), px(img, 9, 9))
        assert.notDeepEqual(px(img, 0, 0), RED, 'marker is averaged into the block')
    })

    it('threshold: produces a greyscale image', async () => {
        const { img, errors } = await runJimpImage(jimpConfig('threshold', [[128, 'num']]))
        assert.equal(errors.length, 0)
        assert.equal(countPixels(img, p => !isGrey(p)), 0)
    })

    it('normalize: runs and preserves size', async () => {
        const { img, errors } = await runJimpImage(jimpConfig('normalize'))
        assert.equal(errors.length, 0)
        assert.deepEqual(dims(img), [40, 20])
    })

    describe('dither565 (renamed to dither in jimp 1.x, flows saved with the old name must keep working)', () => {
        // the config as an older version of the editor would have saved it
        const savedWithOldName = () => Object.assign(jimpConfig('none'), { jimpFunction: 'dither565', selectedJimpFunction: { name: 'dither565', fn: 'dither565', parameters: [] } })
        it('saved flow using dither565 still runs', async () => {
            const { img, errors } = await runJimpImage(savedWithOldName())
            assert.equal(errors.length, 0)
            assert.deepEqual(dims(img), [40, 20])
        })
        it('dither565 in a batch still runs', async () => {
            const { img, errors } = await runJimpImage(batchConfig([{ name: 'dither565' }]))
            assert.equal(errors.length, 0)
            assert.deepEqual(dims(img), [40, 20])
        })
    })

    describe('convolute', () => {
        it('custom kernel (identity) leaves the image unchanged', async () => {
            const { img } = await runJimpImage(jimpConfig('convolute', [[[0, 0, 0], [0, 1, 0], [0, 0, 0]]]))
            assert.deepEqual(px(img, 10, 10), RED)
            assert.deepEqual(px(img, 30, 10), BLUE)
        })
        it('custom kernel (box) changes the edge', async () => {
            const k = [[1 / 9, 1 / 9, 1 / 9], [1 / 9, 1 / 9, 1 / 9], [1 / 9, 1 / 9, 1 / 9]]
            const { img } = await runJimpImage(jimpConfig('convolute', [k]))
            assert.ok(px(img, 19, 10)[2] > 0)
        })
        for (const preset of ['convolute_sharpen', 'convolute_strongsharpen', 'convolute_edgeenhance', 'convolute_edgedetect', 'convolute_emboss', 'convolute_antialise']) {
            it(`preset ${preset} (via the function dropdown)`, async () => {
                if (!h.fnDefs()[preset]) return // preset only available via batch on some branches
                const { img, errors } = await runJimpImage(jimpConfig(preset))
                assert.equal(errors.length, 0)
                assert.deepEqual(dims(img), [40, 20])
            })
            it(`preset ${preset} (via batch)`, async () => {
                const { img, errors } = await runJimpImage(batchConfig([{ name: preset }]))
                assert.equal(errors.length, 0)
                assert.deepEqual(dims(img), [40, 20])
            })
        }
    })

    it('every function in the editor dropdown has a name, fn and parameters list', () => {
        const defs = h.fnDefs()
        assert.ok(Object.keys(defs).length > 40)
        for (const [key, d] of Object.entries(defs)) {
            assert.equal(typeof d.name, 'string', key)
            assert.equal(typeof d.fn, 'string', key)
            assert.ok(Array.isArray(d.parameters), key)
        }
        assert.ok(GREEN && BLUE)
    })
})
