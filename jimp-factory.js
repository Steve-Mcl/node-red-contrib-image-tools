'use strict'
/**
 * Provides the jimp library used by all the nodes, extended with webp support.
 *
 * Why not use `@jimp/wasm-webp`? It is an ES module (so cannot be required) and, more importantly, it calls the
 * @jsquash/webp `init()` with no arguments on every encode/decode. That makes the wasm loader `fetch()` a `file:` URL
 * which Node does not support, so it cannot work in Node-RED. Here the wasm is compiled from disk once, passed to
 * `init()`, and a small jimp format is built directly on top of @jsquash/webp.
 *
 * The ES modules are loaded with dynamic import() so this works from CommonJS on every supported Node version.
 */
const fs = require('fs')
const path = require('path')

const WEBP_MIME = 'image/webp'
let cached

/**
 * Get the jimp library (everything `require('jimp')` exports, with `Jimp` extended to read and write webp)
 * @returns {Promise<typeof import('jimp') & {webp: boolean, webpError?: Error}>}
 */
function getJimp () {
    if (!cached) {
        cached = create()
    }
    return cached
}

async function create () {
    const jimp = require('jimp')
    try {
        const { createJimp } = await import('@jimp/core')
        const encoder = await import('@jsquash/webp/encode.js')
        const decoder = await import('@jsquash/webp/decode.js')
        const packageDir = path.dirname(require.resolve('@jsquash/webp/package.json'))
        const compile = (file) => WebAssembly.compile(fs.readFileSync(path.join(packageDir, file)))

        let ready
        const init = () => {
            if (!ready) {
                ready = (async () => {
                    // the simd build is used by jsquash when the runtime supports it. Node 18+ always does
                    await encoder.init(await compile('codec/enc/webp_enc_simd.wasm'))
                    await decoder.init(await compile('codec/dec/webp_dec.wasm'))
                })()
                ready.catch(() => { ready = null }) // allow a retry
            }
            return ready
        }

        const webp = () => ({
            mime: WEBP_MIME,
            hasAlpha: true,
            encode: async (bitmap, options = {}) => {
                await init()
                const quality = typeof options.quality === 'number' ? options.quality : 75
                const encoded = await encoder.default({
                    data: new Uint8ClampedArray(bitmap.data),
                    width: bitmap.width,
                    height: bitmap.height,
                    colorSpace: 'srgb'
                }, { quality })
                return Buffer.from(encoded)
            },
            decode: async (data) => {
                await init()
                const result = await decoder.default(new Uint8Array(data).buffer)
                return {
                    data: Buffer.from(new Uint8Array(result.data.buffer, result.data.byteOffset, result.data.byteLength)),
                    width: result.width,
                    height: result.height
                }
            }
        })

        const Jimp = createJimp({
            formats: [...jimp.defaultFormats, webp],
            plugins: jimp.defaultPlugins
        })
        return { ...jimp, Jimp, JimpMime: { ...jimp.JimpMime, webp: WEBP_MIME }, webp: true }
    } catch (error) {
        // webp support is a bonus: if it cannot be loaded, carry on with the stock library
        return { ...jimp, webp: false, webpError: error }
    }
}

/**
 * Is `value` a jimp image? Images can come from another jimp instance (e.g. another package) so `instanceof` is not reliable.
 * @param {*} value
 * @returns {boolean}
 */
function isJimpImage (value) {
    return !!value && typeof value === 'object' && !!value.bitmap && typeof value.getBuffer === 'function' && typeof value.clone === 'function'
}

module.exports = { getJimp, isJimpImage, WEBP_MIME }
