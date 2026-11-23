'use strict'
/**
 * Image viewer node
 */
const { describe, it, before, after, afterEach } = require('node:test')
const assert = require('node:assert/strict')
const h = require('./helpers')
const { run, testPng } = h

const viewer = (extra) => ({ id: 'n1', type: 'image viewer', active: true, data: 'payload', dataType: 'msg', ...extra })
const nextTick = (ms = 150) => new Promise(resolve => setTimeout(resolve, ms))

/** the viewer publishes to the editor with { id, data } to show an image and { id } to remove it */
async function publishedAfter (payload, config, extraMsg) {
    const r = await run('imageViewer.js', viewer(config), { payload, ...extraMsg })
    for (let i = 0; i < 40 && !h.helper.published.length; i++) await nextTick(25)
    await nextTick()
    return { r, published: h.helper.published }
}

describe('image viewer', () => {
    before(() => h.helper.startServer())
    afterEach(() => h.helper.unload())
    after(() => h.helper.stopServer())

    it('shows an image', async () => {
        const { r, published } = await publishedAfter(testPng())
        assert.ok(r.msg, 'the msg is passed on')
        const shown = published.find(p => p.data && p.data.data)
        assert.ok(shown, 'image published to the editor')
        assert.ok(shown.data.data.startsWith('data:image/png;base64,'))
    })

    describe('reset (an undefined, null or empty payload removes the image)', () => {
        for (const [name, payload] of [['undefined', undefined], ['null', null], ['empty string', ''], ['empty buffer', Buffer.alloc(0)]]) {
            it(`${name}`, async () => {
                const { r, published } = await publishedAfter(payload)
                assert.ok(r.msg, 'the msg is passed on')
                assert.equal(r.errors.length, 0, 'it is not an error')
                assert.notEqual((r.statuses.at(-1) || {}).fill, 'red')
                assert.equal(published.length, 1)
                assert.equal(published[0].topic, 'image-tools-image-viewer')
                assert.equal(published[0].data.id, 'n1')
                assert.equal(Object.prototype.hasOwnProperty.call(published[0].data, 'data'), false, 'no data: the editor removes the image')
            })
        }

        it('after an image was shown', async () => {
            const { published } = await publishedAfter(testPng())
            assert.ok(published.some(p => p.data && p.data.data))
            await h.helper.unload()
            const second = await publishedAfter(undefined)
            assert.equal(Object.prototype.hasOwnProperty.call(second.published.at(-1).data, 'data'), false)
        })

        it('a viewer that is not active does nothing', async () => {
            const { r, published } = await publishedAfter(undefined, { active: false })
            assert.ok(r.msg, 'the msg is passed on')
            assert.equal(published.length, 0)
        })
    })

    describe('msg.reset === true removes the image', () => {
        const removed = (published) => published.length === 1 && published[0].data.id === 'n1' && !Object.prototype.hasOwnProperty.call(published[0].data, 'data')
        it('even when the payload is an image', async () => {
            const { r, published } = await publishedAfter(testPng(), undefined, { reset: true })
            assert.ok(r.msg, 'the msg is passed on')
            assert.equal(r.errors.length, 0)
            assert.ok(removed(published), JSON.stringify(published.map(p => Object.keys(p.data))))
        })
        it('when there is no payload', async () => {
            const { r, published } = await publishedAfter(undefined, undefined, { reset: true })
            assert.ok(r.msg)
            assert.ok(removed(published))
        })
        it('only for true (not "true", 1 or false)', async () => {
            for (const reset of ['true', 1, false]) {
                const { published } = await publishedAfter(testPng(), undefined, { reset })
                assert.ok(published.some(p => p.data && p.data.data), `reset: ${JSON.stringify(reset)} still shows the image`)
                await h.helper.unload()
            }
        })
        it('a viewer that is not active does nothing', async () => {
            const { r, published } = await publishedAfter(testPng(), { active: false }, { reset: true })
            assert.ok(r.msg)
            assert.equal(published.length, 0)
        })
    })

    it('a payload that is not an image is still an error', async () => {
        const { r } = await publishedAfter(0)
        assert.equal(r.errors.length, 1)
    })
})
