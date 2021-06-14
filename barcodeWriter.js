module.exports = function (RED) {

    function barcodeWriter(config) {
        RED.nodes.createNode(this, config);
        const performanceLogger = require('./performanceLogger');
        const bwipjs = require('bwip-js');
        const { setObjectProperty } = require('./common.js');
        const image_tools = require("./static/js/image_tools");
        const symbology = image_tools.getSymbology();
        const symbologyOptionsList = image_tools.getOptionsList();
        const symbologyOptionsMap = image_tools.getOptionsMap();
        const node = this;
        node.data = config.data || "payload";//data
        node.dataType = config.dataType || "msg";
        node.barcode = config.barcode || "qrcode";
        node.barcodeType = config.barcodeType || "str";
        node.options = config.options || "";
        node.optionsType = config.optionsType || "ui";
        node.props = config.props || [];
        node.sendProperty = config.sendProperty || "payload";


        node.on('input', function (msg) {
            var performance = new performanceLogger(node.id);
            performance.start("total");
            node.status({});//clear status
            var data;
            RED.util.evaluateNodeProperty(node.data, node.dataType, node, msg, (err, value) => {
                if (err) {
                    node.error("Unable to evaluate data", msg);
                    node.status({ fill: "red", shape: "ring", text: "Unable to evaluate data" });
                    return;//halt flow!
                } else {
                    data = value;
                }
            });
            var barcode;
            RED.util.evaluateNodeProperty(node.barcode, node.barcodeType, node, msg, (err, value) => {
                if (err) {
                    node.error("Unable to evaluate barcode", msg);
                    node.status({ fill: "red", shape: "ring", text: "Unable to evaluate barcode" });
                    return;//halt flow!
                } else {
                    barcode = value;
                }
            });
            var options;
            if(node.optionsType == "ui") {
                if(node.props && Array.isArray(node.props) && node.props.length) {
                    options = {};
                    for (let index = 0; index < node.props.length; index++) {
                        const prop = node.props[index];
                        let name = prop.p;
                        let value = prop.v;
                        let valueType = prop.vt;
                        value = RED.util.evaluateNodeProperty(value, valueType, node, msg)
                        if(!symbologyOptionsMap[name]) {
                            node.warn(`option '${name}' not recognised`);
                        }
                        options[name] = value;
                    }
                }
            } else {
                RED.util.evaluateNodeProperty(node.options, node.optionsType, node, msg, (err, value) => {
                    if (err) {
                        node.error("Unable to evaluate options", msg);
                        node.status({ fill: "red", shape: "ring", text: "Unable to evaluate options" });
                        return;//halt flow!
                    } else {
                        options = value;
                    }
                });
                options = options || {};
                if (typeof options == "string") {
                    try {
                        options = JSON.parse(options);
                    } catch (error) {
                        options = {};
                    }
                }
            }

            if(!data) {
                node.error("text is empty - cannot generate barcode", msg);
                node.status({ fill: "red", shape: "ring", text: "text is empty - cannot generate barcode" });
                return;
            }
            if(!barcode) {
                node.error("barcode type not specified", msg);
                node.status({ fill: "red", shape: "ring", text: "barcode type not specified" });
                return;
            }
            if(!symbology[barcode]) {
                node.error(`barcode type '${barcode}' not valid`, msg);
                node.status({ fill: "red", shape: "ring", text: `barcode type '${barcode}' not valid` });
                return;
            }


            options = options || {};
            options.bcid = barcode; // Barcode type
            options.text = data;    // Text to encode
            options.includetext = options.includetext == null ? true : options.includetext; // Show human-readable text
            options.textxalign = options.textxalign == null ? 'center' :options.textxalign; // Show human-readable text

            performance.start("barcode_create");

            bwipjs.toBuffer(options)
                .then(png => {
                    performance.end("barcode_create");
                    performance.end("total");
                    msg.performance = performance.getPerformance();
                    setObjectProperty(msg, node.sendProperty, png);

                    node.send(msg);
                })
                .catch(err => {
                    node.error(err, msg);
                    node.status({ fill: "red", shape: "ring", text: "Error creating barcode" });
                });

            return;

        });
    }
    RED.nodes.registerType("Barcode Generator", barcodeWriter);
}