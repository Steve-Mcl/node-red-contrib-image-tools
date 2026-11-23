'use strict'
/**
 * A small stand-in for the Node-RED runtime: just enough to load this package's
 * node modules, instantiate them from flow-style configs, wire them together
 * and observe what they send, log and report.
 *
 * It exists so the tests do not need `node-red` / `node-red-node-test-helper`
 * as dev dependencies (they pull in hundreds of transitive packages).
 *
 * Only the parts of the runtime the nodes actually use are implemented:
 *   RED.nodes.{createNode, registerType, getNode}
 *   RED.util.evaluateNodeProperty
 *   RED.comms.publish
 *   RED.httpAdmin.{get, post, ...}  and  RED.auth.needsPermission
 *
 * The surface mirrors the bits of node-red-node-test-helper used by the tests:
 *   load(moduleFns, flow), getNode(id), unload(), startServer(), stopServer()
 * Nodes also emit `call:error`, `call:status`, `call:warn` and `call:log`
 * events (with `{ args }`) whenever they call those methods, as the helper does.
 */
const { EventEmitter } = require('events')

function getMessageProperty (msg, expr) {
    return String(expr).split('.').reduce((o, k) => (o === null || o === undefined ? undefined : o[k]), msg)
}

/**
 * Mirrors the behaviour of RED.util.evaluateNodeProperty for the types used here.
 * Unknown types (the editor's custom "Jimp", "Align", "Font" ... types) return the value
 * unchanged, as the real function does. jsonata is evaluated asynchronously, like the real
 * thing. NOTE: expressions are evaluated as plain JavaScript - only good enough for simple
 * arithmetic in tests.
 */
function evaluateNodeProperty (value, type, node, msg, callback) {
    const done = (err, result) => {
        if (callback) { callback(err, result); return undefined }
        if (err) throw err
        return result
    }
    let result = value
    try {
        switch (type) {
        case 'str': result = String(value); break
        case 'num': result = Number(value); break
        case 'bool': result = /^true$/i.test(value); break
        case 'json': result = JSON.parse(value); break
        case 're': result = new RegExp(value); break
        case 'date': result = Date.now(); break
        case 'bin': result = Buffer.from(JSON.parse(value)); break
        case 'env': result = process.env[value]; break
        case 'msg': result = getMessageProperty(msg, value); break
        case 'flow':
        case 'global': result = undefined; break // no context in the fake runtime
        case 'jsonata': {
            if (!callback) throw new Error('jsonata can only be evaluated with a callback')
            // eslint-disable-next-line no-new-func
            const fn = new Function('msg', 'return (' + value + ')')
            const r = fn(msg) // throws synchronously for invalid expressions
            setImmediate(() => callback(null, r))
            return undefined
        }
        default: break
        }
    } catch (err) {
        return done(err)
    }
    return done(null, result)
}

function createRuntime () {
    const types = {}
    const nodes = new Map()
    const routes = { get: [], post: [], put: [], delete: [] }
    const published = []

    const httpAdmin = {}
    Object.keys(routes).forEach(m => { httpAdmin[m] = (path, ...handlers) => routes[m].push({ path, handlers }) })

    const RED = {
        settings: {},
        httpAdmin,
        httpNode: httpAdmin,
        auth: { needsPermission: () => (req, res, next) => next && next() },
        comms: { publish: (topic, data) => published.push({ topic, data }) },
        util: { evaluateNodeProperty, getMessageProperty },
        log: { info () {}, warn () {}, error () {}, debug () {}, trace () {} },
        nodes: {
            registerType (type, ctor) { types[type] = ctor },
            getNode (id) { return nodes.get(id) },
            createNode (node, config) {
                const emitter = new EventEmitter()
                // copy the EventEmitter API onto the node (as the real runtime does)
                for (const m of ['off', 'emit', 'removeListener', 'removeAllListeners', 'listeners']) {
                    node[m] = emitter[m].bind(emitter)
                }
                // handlers are called with `this` set to the node, as the real runtime does (nodes use this.active, this.id etc)
                node.on = (event, fn) => { emitter.on(event, fn.bind(node)); return node }
                node.once = (event, fn) => { emitter.once(event, fn.bind(node)); return node }
                node.id = config.id
                node.type = config.type
                node.name = config.name
                node.wires = config.wires || []
                for (const m of ['status', 'error', 'warn', 'log', 'debug', 'trace']) {
                    node[m] = (...args) => { emitter.emit('call:' + m, { args }) }
                }
                node.send = (msg) => {
                    const out = Array.isArray(msg) ? msg : [msg]
                    out.forEach((m, port) => {
                        if (!m) return
                        const targets = node.wires[port] || []
                        for (const id of targets) {
                            const target = nodes.get(id)
                            if (target) setImmediate(() => target.emit('input', m))
                        }
                    })
                }
                // inject a message into the node as the runtime would
                node.receive = (msg = {}) => {
                    if (!msg._msgid) msg._msgid = Math.random().toString(16).slice(2)
                    try {
                        node.emit('input', msg)
                    } catch (err) {
                        node.error(err, msg)
                    }
                }
            }
        }
    }

    // a "helper" node: captures whatever is wired to it
    types.helper = function (config) {
        RED.nodes.createNode(this, config)
    }

    return { RED, types, nodes, routes, published }
}

let runtime = null

const fakeRuntime = {
    /** kept for API compatibility with node-red-node-test-helper (nothing to start) */
    async startServer () {},
    async stopServer () { await fakeRuntime.unload() },

    /**
     * @param {Function|Function[]} moduleFns - node module exports, `function (RED) {...}`
     * @param {object[]} flow - flow JSON
     */
    async load (moduleFns, flow) {
        await fakeRuntime.unload()
        runtime = createRuntime()
        for (const fn of [].concat(moduleFns)) {
            await fn(runtime.RED)
        }
        for (const config of flow) {
            const ctor = runtime.types[config.type]
            if (!ctor) throw new Error(`Node type '${config.type}' is not registered`)
            const node = {}
            runtime.nodes.set(config.id, node)
            ctor.call(node, config)
        }
    },

    getNode (id) {
        return runtime && runtime.nodes.get(id)
    },

    /** close every node (runs their `close` handlers) and discard the runtime */
    async unload () {
        if (!runtime) return
        const r = runtime
        runtime = null
        for (const node of r.nodes.values()) {
            const handlers = node.listeners ? node.listeners('close') : []
            await Promise.all(handlers.map(fn => new Promise(resolve => {
                if (fn.length >= 2) fn(true, resolve)
                else { Promise.resolve(fn(true)).then(resolve, resolve) }
            })))
        }
    },

    /** the admin routes / comms messages recorded by the current runtime (for tests) */
    get routes () { return runtime && runtime.routes },
    get published () { return runtime && runtime.published }
}

module.exports = fakeRuntime
module.exports.evaluateNodeProperty = evaluateNodeProperty
