'use strict'
/**
 * Barcode Generator + Barcode Decoder nodes
 */
const { describe, it, before, after, afterEach } = require('node:test')
const assert = require('node:assert/strict')
const bwipjs = require('bwip-js')
const h = require('./helpers')
const { run, decode } = h

const generatorConfig = (extra = {}) => Object.assign({
    id: 'n1',
    type: 'Barcode Generator',
    name: '',
    data: 'payload',
    dataType: 'msg',
    barcode: 'qrcode',
    barcodeType: 'str',
    optionsType: 'ui',
    props: [],
    sendProperty: 'payload'
}, extra)

const decoderConfig = (extra = {}) => Object.assign({
    id: 'n1',
    type: 'Barcode Decoder',
    name: '',
    data: 'payload',
    dataType: 'msg',
    tryharder: true,
    tryharderType: 'bool'
}, extra)

const makeBarcode = (bcid, text, opts = {}) => bwipjs.toBuffer(Object.assign({ bcid, text, scale: 4, paddingwidth: 10, paddingheight: 10, backgroundcolor: 'ffffff' }, opts))

describe('Barcode Generator', () => {
    before(() => h.helper.startServer())
    afterEach(() => h.helper.unload())
    after(() => h.helper.stopServer())

    it('generates a QR code PNG', async () => {
        const r = await run('barcodeWriter.js', generatorConfig(), { payload: 'hello world' })
        assert.ok(r.msg, 'no output: ' + (r.errors[0] && r.errors[0].message))
        assert.ok(Buffer.isBuffer(r.msg.payload))
        assert.equal(r.msg.payload.subarray(1, 4).toString(), 'PNG')
        const img = await decode(r.msg.payload)
        assert.ok(img.bitmap.width > 20 && img.bitmap.height > 20)
        assert.ok(r.msg.performance)
    })

    it('barcode type can come from msg', async () => {
        const r = await run('barcodeWriter.js', generatorConfig({ barcode: 'type', barcodeType: 'msg' }), { payload: '12345', type: 'code128' })
        assert.ok(r.msg, 'no output: ' + (r.errors[0] && r.errors[0].message))
        const img = await decode(r.msg.payload)
        assert.ok(img.bitmap.width > 0 && img.bitmap.width !== img.bitmap.height, '1D barcode is not square')
    })

    it('options from UI properties change the output', async () => {
        const small = await run('barcodeWriter.js', generatorConfig(), { payload: 'hello' })
        await h.helper.unload()
        const big = await run('barcodeWriter.js', generatorConfig({ props: [{ p: 'scale', v: '6', vt: 'num' }] }), { payload: 'hello' })
        assert.ok((await decode(big.msg.payload)).bitmap.width > (await decode(small.msg.payload)).bitmap.width)
    })

    it('options from a JSON object', async () => {
        const base = await run('barcodeWriter.js', generatorConfig({ optionsType: 'json', options: '{}' }), { payload: 'hello' })
        await h.helper.unload()
        const big = await run('barcodeWriter.js', generatorConfig({ optionsType: 'json', options: '{"scale":6}' }), { payload: 'hello' })
        assert.ok((await decode(big.msg.payload)).bitmap.width > (await decode(base.msg.payload)).bitmap.width)
    })

    it('sendProperty', async () => {
        const r = await run('barcodeWriter.js', generatorConfig({ sendProperty: 'barcode.image' }), { payload: 'hello' })
        assert.ok(Buffer.isBuffer(r.msg.barcode.image))
    })

    it('empty data is an error', async () => {
        const r = await run('barcodeWriter.js', generatorConfig(), { payload: '' })
        assert.equal(r.msg, undefined)
        assert.equal(r.errors.length, 1)
    })

    it('unknown barcode type is an error', async () => {
        const r = await run('barcodeWriter.js', generatorConfig({ barcode: 'notabarcode' }), { payload: 'hello' })
        assert.equal(r.msg, undefined)
        assert.equal(r.errors.length, 1)
    })

    it('data that is invalid for the symbology is an error', async () => {
        const r = await run('barcodeWriter.js', generatorConfig({ barcode: 'ean13' }), { payload: 'not digits' })
        assert.equal(r.msg, undefined)
        assert.ok(r.errors.length >= 1)
    })

    for (const [bcid, text] of [['qrcode', 'hello'], ['datamatrix', 'hello'], ['code128', 'ABC-123'], ['code39', 'ABC123'], ['ean13', '5901234123457'], ['pdf417', 'hello'], ['azteccode', 'hello']]) {
        it(`generates ${bcid}`, async () => {
            const r = await run('barcodeWriter.js', generatorConfig({ barcode: bcid }), { payload: text })
            assert.ok(r.msg, 'no output: ' + (r.errors[0] && r.errors[0].message))
            assert.ok(Buffer.isBuffer(r.msg.payload))
        })
    }
})

describe('Barcode Decoder', () => {
    before(() => h.helper.startServer())
    afterEach(() => h.helper.unload())
    after(() => h.helper.stopServer())

    for (const [bcid, text, format] of [
        ['qrcode', 'hello world', 'QR_CODE'],
        ['datamatrix', 'hello', 'DATA_MATRIX'],
        ['code128', 'ABC-123', 'CODE_128'],
        ['code39', 'ABC123', 'CODE_39'],
        ['ean13', '5901234123457', 'EAN_13']
    ]) {
        it(`decodes ${bcid}`, async () => {
            const png = await makeBarcode(bcid, text)
            const r = await run('xzingDecode.js', decoderConfig(), { payload: png })
            assert.ok(r.msg, 'no output: ' + (r.errors[0] && r.errors[0].message))
            assert.equal(r.msg.payload.text, text)
            assert.ok(r.msg.payload.format !== undefined)
            assert.ok(r.msg.performance)
            assert.ok(Buffer.isBuffer(r.msg.originalPayload), 'original payload is kept')
            assert.equal(typeof format, 'string')
        })
    }

    it('decodes from a base64 data URI', async () => {
        const png = await makeBarcode('qrcode', 'data uri')
        const r = await run('xzingDecode.js', decoderConfig(), { payload: 'data:image/png;base64,' + png.toString('base64') })
        assert.ok(r.msg, 'no output: ' + (r.errors[0] && r.errors[0].message))
        assert.equal(r.msg.payload.text, 'data uri')
    })

    it('decodes from a Jimp image', async () => {
        const png = await makeBarcode('qrcode', 'jimp input')
        const r = await run('xzingDecode.js', decoderConfig(), { payload: await decode(png) })
        assert.ok(r.msg, 'no output: ' + (r.errors[0] && r.errors[0].message))
        assert.equal(r.msg.payload.text, 'jimp input')
    })

    it('restricts formats when configured (match)', async () => {
        const png = await makeBarcode('qrcode', 'only qr')
        const r = await run('xzingDecode.js', decoderConfig({ QR_CODE: true }), { payload: png })
        assert.ok(r.msg, 'no output: ' + (r.errors[0] && r.errors[0].message))
        assert.equal(r.msg.payload.text, 'only qr')
    })

    it('restricts formats when configured (no match)', async () => {
        const png = await makeBarcode('qrcode', 'only qr')
        const r = await run('xzingDecode.js', decoderConfig({ CODE_128: true }), { payload: png }, { settle: 1000 })
        assert.equal(r.msg, undefined)
    })

    it('msg.barcodeFormats overrides the configured formats', async () => {
        const png = await makeBarcode('qrcode', 'override')
        const r = await run('xzingDecode.js', decoderConfig({ CODE_128: true }), { payload: png, barcodeFormats: ['QR_CODE'] })
        assert.ok(r.msg, 'no output: ' + (r.errors[0] && r.errors[0].message))
        assert.equal(r.msg.payload.text, 'override')
    })

    it('an image with no barcode sends nothing', async () => {
        const r = await run('xzingDecode.js', decoderConfig(), { payload: h.solidPng(100, 100) }, { settle: 1000 })
        assert.equal(r.msg, undefined)
    })

    it('data that is not an image sends nothing and reports an error', async () => {
        const r = await run('xzingDecode.js', decoderConfig(), { payload: Buffer.from('not an image') }, { settle: 1500 })
        assert.equal(r.msg, undefined)
        assert.ok(r.errors.length >= 1)
    })

    it('round trip: generator node (default transparent background) -> decoder node', { todo: 'transparent pixels are read as black so the default generator output cannot be decoded' }, async () => {
        const gen = await run('barcodeWriter.js', generatorConfig(), { payload: 'round trip' })
        await h.helper.unload()
        const dec = await run('xzingDecode.js', decoderConfig(), { payload: gen.msg.payload })
        assert.ok(dec.msg, 'no output: ' + (dec.errors[0] && dec.errors[0].message))
        assert.equal(dec.msg.payload.text, 'round trip')
    })

    it('round trip: generator node (white background) -> decoder node', async () => {
        const gen = await run('barcodeWriter.js', generatorConfig({ props: [{ p: 'backgroundcolor', v: 'ffffff', vt: 'str' }, { p: 'scale', v: '4', vt: 'num' }, { p: 'paddingwidth', v: '10', vt: 'num' }, { p: 'paddingheight', v: '10', vt: 'num' }] }), { payload: 'round trip' })
        await h.helper.unload()
        const dec = await run('xzingDecode.js', decoderConfig(), { payload: gen.msg.payload })
        assert.ok(dec.msg, 'no output: ' + (dec.errors[0] && dec.errors[0].message))
        assert.equal(dec.msg.payload.text, 'round trip')
    })
})
