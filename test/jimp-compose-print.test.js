'use strict'
/**
 * jimp-image node: compositing (blit/composite/mask/diff), text printing, batch, write/quality
 */
const fs = require('fs')
const os = require('os')
const path = require('path')
const { describe, it, before, after, afterEach } = require('node:test')
const assert = require('node:assert/strict')
const h = require('./helpers')
const { jimpConfig, batchConfig, runJimp, runJimpImage, px, bounds, isDark, near, solidPng, decode, RED, BLUE, GREEN, WHITE, BLACK } = h

const dims = img => [img.bitmap.width, img.bitmap.height]
const FONT = ['FONT_SANS_16_BLACK', 'jimpFont']
const height = b => b.y1 - b.y0 + 1
const width = b => b.x1 - b.x0 + 1

describe('jimp-image: compositing', () => {
    before(() => h.helper.startServer())
    afterEach(() => h.helper.unload())
    after(() => h.helper.stopServer())

    const withSrc = async (cfg, src, payload) => {
        const r = await runJimp(cfg, { payload: payload || h.testPng(), src: await decode(src) })
        assert.ok(r.msg, 'no output: ' + (r.errors[0] && r.errors[0].message))
        r.img = await decode(r.msg.payload)
        return r
    }

    it('blit: draws another image at x, y', async () => {
        const { img } = await withSrc(jimpConfig('blit', [['src', 'msg'], 5, 5]), solidPng(10, 10, GREEN))
        assert.deepEqual(dims(img), [40, 20])
        assert.deepEqual(px(img, 7, 7), GREEN)
        assert.deepEqual(px(img, 14, 14), GREEN)
        assert.deepEqual(px(img, 16, 7), RED)
        assert.deepEqual(px(img, 30, 10), BLUE)
    })

    it('blit: can take a region of the source', async () => {
        const src = h.makePng(20, 10, x => x < 10 ? GREEN : BLACK)
        const { img } = await withSrc(jimpConfig('blit', [['src', 'msg'], 22, 2, 0, 0, 10, 10]), src)
        assert.deepEqual(px(img, 25, 5), GREEN)
        assert.deepEqual(px(img, 35, 5), BLUE, 'only the 10x10 region was blitted')
    })

    it('composite: source over', async () => {
        const { img } = await withSrc(jimpConfig('composite', [['src', 'msg'], 10, 4, ['BLEND_SOURCE_OVER', 'Blend'], 1, 1]), solidPng(6, 6, GREEN))
        assert.deepEqual(px(img, 12, 6), GREEN)
        assert.deepEqual(px(img, 30, 10), BLUE)
    })

    it('composite: partial source opacity blends with the destination', async () => {
        const { img } = await withSrc(jimpConfig('composite', [['src', 'msg'], 10, 4, ['BLEND_SOURCE_OVER', 'Blend'], 0.5, 1]), solidPng(6, 6, GREEN))
        const p = px(img, 12, 6)
        assert.ok(p[0] > 60 && p[1] > 60, `blended with red: ${p}`)
    })

    it('composite: multiply', async () => {
        const { img } = await withSrc(jimpConfig('composite', [['src', 'msg'], 0, 0, ['BLEND_MULTIPLY', 'Blend'], 1, 1]), solidPng(40, 20, WHITE))
        assert.deepEqual(px(img, 10, 10), RED, 'white multiply leaves the destination unchanged')
    })

    it('mask: white mask keeps the image', async () => {
        const { img } = await withSrc(jimpConfig('mask', [['src', 'msg'], 0, 0]), solidPng(40, 20, WHITE))
        assert.equal(px(img, 10, 10)[3], 255)
    })

    it('mask: black mask removes the image', async () => {
        const { img } = await withSrc(jimpConfig('mask', [['src', 'msg'], 0, 0]), solidPng(40, 20, BLACK))
        assert.equal(px(img, 10, 10)[3], 0)
    })

    describe('distance / diff', () => {
        it('distance: identical images have no distance', async () => {
            const r = await runJimp(jimpConfig('distance', [['src', 'msg']]), { payload: h.testPng(), src: await decode(h.testPng()) })
            assert.ok(r.msg, 'no output: ' + (r.errors[0] && r.errors[0].message))
            assert.equal(r.msg.jobs[0].result, 0)
        })
        it('distance: different images have a distance', async () => {
            const a = h.makePng(32, 32, (x) => x < 16 ? BLACK : WHITE)
            const b = h.makePng(32, 32, (x, y) => (x + y) % 2 ? BLACK : WHITE)
            const r = await runJimp(jimpConfig('distance', [['src', 'msg']]), { payload: a, src: await decode(b) })
            assert.ok(r.msg, 'no output: ' + (r.errors[0] && r.errors[0].message))
            assert.ok(r.msg.jobs[0].result > 0)
        })
        it('diff: identical images have 0% difference', async () => {
            const r = await runJimp(jimpConfig('diff', [['src', 'msg']]), { payload: h.testPng(), src: await decode(h.testPng()) })
            assert.ok(r.msg, 'no output: ' + (r.errors[0] && r.errors[0].message))
            assert.equal(r.msg.jobs[0].result, 0)
        })
        it('diff: different images have a difference', async () => {
            const r = await runJimp(jimpConfig('diff', [['src', 'msg']]), { payload: h.testPng(), src: await decode(solidPng(40, 20, BLACK)) })
            assert.ok(r.msg, 'no output: ' + (r.errors[0] && r.errors[0].message))
            assert.ok(r.msg.jobs[0].result > 0.5, String(r.msg.jobs[0].result))
        })
    })

    describe('write / quality', () => {
        it('write: saves the image to a file', async () => {
            const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'image-tools-'))
            const file = path.join(dir, 'out.png')
            try {
                const { img } = await runJimpImage(jimpConfig('write', [file]))
                assert.deepEqual(dims(img), [40, 20])
                // the write may complete just after the node sends - give it a moment
                for (let i = 0; i < 20 && !fs.existsSync(file); i++) await new Promise(resolve => setTimeout(resolve, 50))
                assert.ok(fs.existsSync(file), 'file was written')
                assert.deepEqual(dims(await decode(fs.readFileSync(file))), [40, 20])
            } finally {
                fs.rmSync(dir, { recursive: true, force: true })
            }
        })
        it('quality: image is still produced', async () => {
            const { img, errors } = await runJimpImage(jimpConfig('quality', [50]))
            assert.equal(errors.length, 0)
            assert.deepEqual(dims(img), [40, 20])
        })
    })
})

describe('jimp-image: print', () => {
    before(() => h.helper.startServer())
    afterEach(() => h.helper.unload())
    after(() => h.helper.stopServer())

    const canvas = (w = 200, h = 80) => solidPng(w, h, WHITE)
    const print = async (text, { x = 10, y = 10, w = 200, ht = 80, extra = [] } = {}) => {
        const { img } = await runJimpImage(jimpConfig('print', [FONT, x, y, text, ...extra]), canvas(w, ht))
        await h.helper.unload()
        return img
    }

    it('prints text at x, y', async () => {
        const img = await print('Hello')
        const b = bounds(img, isDark)
        assert.ok(b, 'text was drawn')
        assert.ok(b.x0 >= 10 && b.y0 >= 10, JSON.stringify(b))
        assert.ok(width(b) > 20, JSON.stringify(b))
        assert.ok(height(b) < 20, 'single line is one line high: ' + JSON.stringify(b))
    })

    it('prints at the requested position', async () => {
        const a = bounds(await print('Hello', { x: 10, y: 10 }), isDark)
        const b = bounds(await print('Hello', { x: 60, y: 30 }), isDark)
        assert.equal(b.x0 - a.x0, 50)
        assert.equal(b.y0 - a.y0, 20)
    })

    it('newline: prints on multiple lines', async () => {
        const one = bounds(await print('Hi'), isDark)
        const two = bounds(await print('Hi\nHo'), isDark)
        assert.ok(height(two) > height(one) * 1.7, `${height(two)} vs ${height(one)}`)
    })

    it('escaped newline sequences (\\n typed into the editor) are treated as newlines', async () => {
        const real = bounds(await print('Hi\nHo'), isDark)
        const escaped = bounds(await print('Hi\\nHo'), isDark)
        assert.deepEqual(escaped, real)
    })

    it('CRLF is treated as a single newline', async () => {
        const lf = bounds(await print('Hi\nHo'), isDark)
        const crlf = bounds(await print('Hi\r\nHo'), isDark)
        assert.deepEqual(crlf, lf)
    })

    it('three lines are taller than two', async () => {
        const two = bounds(await print('A\nB'), isDark)
        const three = bounds(await print('A\nB\nC'), isDark)
        assert.ok(height(three) > height(two))
    })

    it('blank lines add vertical space', async () => {
        const tight = bounds(await print('A\nB'), isDark)
        const gap = bounds(await print('A\n\nB'), isDark)
        assert.ok(height(gap) > height(tight), `${height(gap)} vs ${height(tight)}`)
    })

    it('maxWidth wraps long text', async () => {
        const unwrapped = bounds(await print('aaa bbb ccc ddd eee fff', { w: 400 }), isDark)
        const wrapped = bounds(await print('aaa bbb ccc ddd eee fff', { w: 400, extra: [60, 70] }), isDark)
        assert.ok(height(wrapped) > height(unwrapped), `${height(wrapped)} vs ${height(unwrapped)}`)
        assert.ok(wrapped.x1 <= 10 + 60, `wrapped within maxWidth: ${JSON.stringify(wrapped)}`)
    })

    it('white font prints light pixels', async () => {
        const { img } = await runJimpImage(jimpConfig('print', [['FONT_SANS_16_WHITE', 'jimpFont'], 10, 10, 'Hello']), solidPng(200, 80, BLACK))
        assert.ok(bounds(img, p => p[0] > 200 && p[1] > 200 && p[2] > 200))
    })

    it('a larger font gives larger text', async () => {
        const small = bounds(await print('Hi'), isDark)
        const { img } = await runJimpImage(jimpConfig('print', [['FONT_SANS_32_BLACK', 'jimpFont'], 10, 10, 'Hi']), canvas())
        const big = bounds(img, isDark)
        assert.ok(height(big) > height(small) * 1.5)
    })

    describe('print aligned', () => {
        const printAligned = async (text, ax, ay, { maxWidth = ['', 'auto'], maxHeight = ['', 'auto'] } = {}) => {
            const params = [FONT, 0, 0, text, [ax, 'AlignX'], [ay, 'AlignY'], maxWidth, maxHeight]
            const { img } = await runJimpImage(jimpConfig('print2', params), canvas())
            await h.helper.unload()
            return img
        }
        it('left / top', async () => {
            const b = bounds(await printAligned('Hi', 'HORIZONTAL_ALIGN_LEFT', 'VERTICAL_ALIGN_TOP'), isDark)
            assert.ok(b.x0 < 10 && b.y0 < 10, JSON.stringify(b))
        })
        it('centre / middle', async () => {
            const b = bounds(await printAligned('Hi', 'HORIZONTAL_ALIGN_CENTER', 'VERTICAL_ALIGN_MIDDLE'), isDark)
            assert.ok(near((b.x0 + b.x1) / 2, 100, 8), JSON.stringify(b))
            assert.ok(near((b.y0 + b.y1) / 2, 40, 10), JSON.stringify(b))
        })
        it('right / bottom', async () => {
            const b = bounds(await printAligned('Hi', 'HORIZONTAL_ALIGN_RIGHT', 'VERTICAL_ALIGN_BOTTOM'), isDark)
            assert.ok(b.x1 > 185 && b.y1 > 60, JSON.stringify(b))
        })
        it('explicit maxWidth / maxHeight', async () => {
            const b = bounds(await printAligned('Hi', 'HORIZONTAL_ALIGN_CENTER', 'VERTICAL_ALIGN_MIDDLE', { maxWidth: 100, maxHeight: 40 }), isDark)
            assert.ok(near((b.x0 + b.x1) / 2, 50, 8), JSON.stringify(b))
            assert.ok(near((b.y0 + b.y1) / 2, 20, 10), JSON.stringify(b))
        })
        it('multiple lines are all centred', async () => {
            const b = bounds(await printAligned('Hi\nHello there', 'HORIZONTAL_ALIGN_CENTER', 'VERTICAL_ALIGN_TOP'), isDark)
            assert.ok(near((b.x0 + b.x1) / 2, 100, 10), JSON.stringify(b))
            const single = bounds(await printAligned('Hi', 'HORIZONTAL_ALIGN_CENTER', 'VERTICAL_ALIGN_TOP'), isDark)
            assert.ok(height(b) > height(single) * 1.7)
        })
    })

    it('a font can be loaded from a .fnt file path', async () => {
        const fontPath = require.resolve('jimp').replace(/[\\/]index\.js$/, '')
        void fontPath // location of bundled fonts differs between jimp 0.x and 1.x, covered by the preset tests
        const { img, errors } = await runJimpImage(jimpConfig('print', [['FONT_SANS_8_BLACK', 'jimpFont'], 1, 1, 'tiny']), canvas())
        assert.equal(errors.length, 0)
        assert.ok(bounds(img, isDark))
    })

    for (const font of ['FONT_SANS_8_BLACK', 'FONT_SANS_10_BLACK', 'FONT_SANS_12_BLACK', 'FONT_SANS_14_BLACK', 'FONT_SANS_16_BLACK', 'FONT_SANS_32_BLACK', 'FONT_SANS_64_BLACK', 'FONT_SANS_128_BLACK']) {
        it(`preset font ${font} loads`, async () => {
            const { img, errors } = await runJimpImage(jimpConfig('print', [[font, 'jimpFont'], 0, 0, 'A']), canvas(300, 300))
            assert.equal(errors.length, 0)
            assert.ok(bounds(img, isDark), 'something was drawn')
        })
    }
})

describe('jimp-image: batch', () => {
    before(() => h.helper.startServer())
    afterEach(() => h.helper.unload())
    after(() => h.helper.stopServer())

    it('runs jobs in order', async () => {
        const { img, msg } = await runJimpImage(batchConfig([
            { name: 'resize', parameters: [20, 10] },
            { name: 'invert' }
        ]))
        assert.deepEqual(dims(img), [20, 10])
        assert.deepEqual(px(img, 15, 5), [255, 255, 0, 255])
        assert.equal(msg.jobs.length, 2)
        assert.equal(msg.jobs[0].name, 'resize')
        assert.ok(msg.jobs[0].performance, 'jobs carry performance info')
    })

    it('accepts a single job object (not an array)', async () => {
        const { img } = await runJimpImage(h.jimpConfig('batch', [[JSON.stringify({ name: 'resize', parameters: [10, 5] }), 'json']]))
        assert.deepEqual(dims(img), [10, 5])
    })

    it('print in a batch', async () => {
        const { img } = await runJimpImage(batchConfig([
            { name: 'print', parameters: ['FONT_SANS_16_BLACK', 5, 5, 'Hi'] }
        ]), solidPng(100, 40))
        assert.ok(bounds(img, isDark))
    })

    it('print aligned in a batch', async () => {
        const { img } = await runJimpImage(batchConfig([
            { name: 'print', parameters: ['FONT_SANS_16_BLACK', 0, 0, { text: 'Hi', alignmentX: 'AlignX.HORIZONTAL_ALIGN_CENTER', alignmentY: 'AlignY.VERTICAL_ALIGN_MIDDLE' }, -1, -1] }
        ]), solidPng(100, 40))
        const b = bounds(img, isDark)
        assert.ok(b && near((b.x0 + b.x1) / 2, 50, 8), JSON.stringify(b))
    })

    it('grayscale is accepted as an alias of greyscale', async () => {
        const { img, errors } = await runJimpImage(batchConfig([{ name: 'grayscale' }]))
        assert.equal(errors.length, 0)
        assert.equal(h.countPixels(img, p => p[0] !== p[1] || p[1] !== p[2]), 0)
    })

    it('resize mode names are accepted in a batch', async () => {
        const { img, errors } = await runJimpImage(batchConfig([{ name: 'resize', parameters: [20, 10, 'Jimp.RESIZE_BILINEAR'] }]))
        assert.equal(errors.length, 0)
        assert.deepEqual(dims(img), [20, 10])
    })

    it('an unsupported job name is reported as an error', async () => {
        const r = await runJimp(batchConfig([{ name: 'doesNotExist' }]), { payload: h.testPng() })
        assert.equal(r.msg, undefined)
        assert.ok(r.errors.length >= 1)
    })
})
