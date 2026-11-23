'use strict'
/**
 * Unit tests for the shared helpers and the static definitions
 */
const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const path = require('path')
const common = require('../common.js')
const tools = require('../static/js/image_tools.js')
const performanceLogger = require('../performanceLogger.js')

describe('common.js', () => {
    it('setObjectProperty: sets a simple property', () => {
        const o = {}
        common.setObjectProperty(o, 'payload', 1)
        assert.deepEqual(o, { payload: 1 })
    })
    it('setObjectProperty: creates nested objects', () => {
        const o = {}
        common.setObjectProperty(o, 'a.b.c', 'x')
        assert.deepEqual(o, { a: { b: { c: 'x' } } })
    })
    it('setObjectProperty: keeps existing siblings', () => {
        const o = { a: { keep: 1 } }
        common.setObjectProperty(o, 'a.b', 2)
        assert.deepEqual(o, { a: { keep: 1, b: 2 } })
    })
    it('isNumber', () => {
        for (const v of [0, 1, -1, 1.5, '1', '1.5', '-3', ' 4 ']) assert.equal(common.isNumber(v), true, String(v))
        for (const v of ['', 'a', true, false, NaN, Infinity, undefined, null, {}, '1a']) assert.equal(common.isNumber(v), false, String(v))
    })
    it('isEmpty', () => {
        assert.equal(common.isEmpty({}), true)
        assert.equal(common.isEmpty({ a: 1 }), false)
        assert.equal(common.isEmpty([]), true)
        assert.equal(common.isEmpty([1]), false)
    })
    it('isObject', () => {
        assert.equal(common.isObject({}), true)
        assert.equal(common.isObject([]), true) // arrays are objects as far as this helper is concerned
        assert.equal(common.isObject(null), false)
        assert.equal(common.isObject('a'), false)
        assert.equal(common.isObject(1), false)
    })
    it('isJSON: true only for JSON strings that parse to an object/array', () => {
        assert.equal(common.isJSON('{"a":1}'), true)
        assert.equal(common.isJSON('[1,2]'), true)
        assert.equal(common.isJSON('1'), false)
        assert.equal(common.isJSON('"x"'), false)
        assert.equal(common.isJSON('not json'), false)
        assert.equal(common.isJSON('null'), false)
        assert.equal(common.isJSON({ a: 1 }), false, 'objects are not JSON strings')
    })
})

describe('performanceLogger', () => {
    it('records start/end durations by name', async () => {
        const p = new performanceLogger('id1')
        p.start('a')
        await new Promise(resolve => setTimeout(resolve, 15))
        p.end('a')
        const perf = p.getPerformance()
        assert.ok(perf.a.milliseconds >= 10, JSON.stringify(perf))
        assert.equal(perf.nodeid, 'id1')
        assert.equal(p.getPerformance('a'), perf.a)
    })
})

describe('static/js/image_tools.js', () => {
    it('exposes the barcode symbology list', () => {
        const s = tools.getSymbology()
        for (const k of ['qrcode', 'code128', 'datamatrix', 'ean13', 'pdf417']) assert.ok(s[k], k)
    })
    it('exposes the barcode options list and map', () => {
        const list = tools.getOptionsList()
        const map = tools.getOptionsMap()
        assert.ok(list.length > 20)
        assert.equal(Object.keys(map).length, list.length)
        for (const k of ['scale', 'includetext', 'backgroundcolor']) assert.ok(map[k], k)
        for (const o of list) assert.ok(o.name && o.type, JSON.stringify(o))
    })
    it('static files are served path-safe by app.js', () => {
        const app = require('../app.js')
        const routes = []
        app({ httpAdmin: { get: (p, fn) => routes.push([p, fn]) } })
        assert.equal(routes.length, 1)
        assert.equal(routes[0][0], '/image-tools/static/*')
        const sent = []
        routes[0][1]({ params: ['js/image_tools.js'] }, { sendFile: (f, o) => sent.push([f, o]) })
        assert.equal(sent[0][0], 'js/image_tools.js')
        assert.equal(sent[0][1].dotfiles, 'deny')
        assert.equal(path.normalize(sent[0][1].root), path.normalize(path.join(__dirname, '..', 'static') + path.sep))
    })
})
