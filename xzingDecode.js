module.exports = function (RED) {

    function xzingDecode(config) {
        RED.nodes.createNode(this, config);
        const Jimp = require('jimp');
        const performanceLogger = require('./performanceLogger');
        const { MultiFormatReader, BarcodeFormat, DecodeHintType, RGBLuminanceSource, BinaryBitmap, HybridBinarizer } = require('@zxing/library');
        const node = this;
        node.data = config.data || "payload";//data
        node.dataType = config.dataType || "msg";
        node.tryHarder = config.tryHarder || false;
        node.tryHarderType = config.tryHarderType || "bool";
        node.DATA_MATRIX = config.DATA_MATRIX;
        node.QR_CODE = config.QR_CODE;
        node.PDF_417 = config.PDF_417;
        node.EAN_8 = config.EAN_8;
        node.EAN_13 = config.EAN_13;
        node.CODE_39 = config.CODE_39;
        node.CODE_128 = config.CODE_128;
        node.ITF = config.ITF;
        node.RSS_14 = config.RSS_14;
        node.formats = [];
        let stringformats = []
        if (node.DATA_MATRIX) { stringformats.push("DATA_MATRIX") }
        if (node.QR_CODE) { stringformats.push("QR_CODE") }
        if (node.PDF_417) { stringformats.push("PDF_417") }
        if (node.EAN_8) { stringformats.push("EAN_8") }
        if (node.EAN_13) { stringformats.push("EAN_13") }
        if (node.CODE_39) { stringformats.push("CODE_39") }
        if (node.CODE_128) { stringformats.push("CODE_128") }
        if (node.ITF) { stringformats.push("ITF") }
        if (node.RSS_14) { stringformats.push("RSS_14") }
        node.formats = barcodeStringFormatsConvertor(stringformats);
        node.status({ fill: "grey", shape: "ring", text: "Initialised" });
        function barcodeStringFormatsConvertor(ArrayOfStringFormats) {
            let formats = null;
            try {
                if (ArrayOfStringFormats && ArrayOfStringFormats.length) {
                    formats = [];
                    for (let index = 0; index < ArrayOfStringFormats.length; index++) {
                        const format = BarcodeFormat[ArrayOfStringFormats[index]];
                        if (format || format === 0) {
                            if (formats.includes(format) === false) {
                                formats.push(format);
                            }
                        }
                    }
                }
            } catch (error) {
            }
            return formats;
        }

        function decodeBarcode(img, formats, tryHarder) {
            if (!img || !img.bitmap) {
                throw new Error("Image is not valid. Expected an object with a bitmap property.")
            }
            const bitmap = img.bitmap;
            const hints = new Map();
            const reader = new MultiFormatReader();
            const len = bitmap.width * bitmap.height;
            const luminancesUint8Array = new Uint8Array(len);

            if (formats && Array.isArray(formats) && formats.length)
                hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);

            if (tryHarder)
                hints.set(DecodeHintType.TRY_HARDER, true);

            reader.setHints(hints);
            for (let i = 0; i < len; i++) {
                luminancesUint8Array[i] = ((bitmap.data[i * 4] + bitmap.data[(i * 4) + 1] + bitmap.data[(i * 4) + 2]) / 4) & 0xFF;
            }
            const luminanceSource = new RGBLuminanceSource(luminancesUint8Array, bitmap.width, bitmap.height);
            const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));
            const decoded = reader.decode(binaryBitmap, hints);
            return decoded;
        }

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
            var tryHarder = false;
            RED.util.evaluateNodeProperty(node.tryHarder, node.tryHarderType, node, msg, (err, value) => {
                if (err) {
                    node.error("Unable to evaluate tryHarder", msg);
                    node.status({ fill: "red", shape: "ring", text: "Unable to evaluate tryHarder" });
                    return;//halt flow!
                } else {
                    tryHarder = value;
                }
            });
            msg.originalPayload = msg.payload;//store original Payload in case user still wants it
            let formats = null;

            try {
                node.msgMem = msg;
                if (msg.barcodeFormats) {
                    formats = barcodeStringFormatsConvertor(msg.barcodeFormats);
                } else {
                    formats = node.formats;
                }

                function _decode(img, formats, tryHarder) {
                    performance.start("decode");
                    let decoded = decodeBarcode(img, formats, tryHarder);
                    performance.end("decode");
                    performance.end("total");
                    node.msgMem.performance = performance.getPerformance();
                    node.msgMem.payload = decoded;
                    node.status({ fill: "green", shape: "dot", text: decoded.text });
                    node.send(node.msgMem);
                }

                if (typeof data == 'string' && data.substr(0, 30).indexOf('base64') != -1 && data.substr(0, 4).indexOf('data') == 0) {
                    performance.start("base64_to_buffer");
                    let url = data.replace(/^data:image\/\w+;base64,/, "");
                    data = new Buffer(url, 'base64');
                    performance.end("base64_to_buffer");
                }
                if (data instanceof Jimp) {
                    _decode(data, formats, tryHarder);
                } else {
                    performance.start("jimp_read");
                    Jimp.read(data)
                        .then(img => {
                            performance.end("jimp_read");
                            _decode(img, formats, tryHarder);
                        })
                        .catch(err => {
                            node.error(err, msg);
                            node.status({ fill: "red", shape: "dot", text: "Error processing image" });
                            return;//halt flow
                        });
                }

            } catch (error) {
                if (error.name = "NotFoundException" || error.message == "No MultiFormat Readers were able to detect the code.") {
                    //do nothing 
                    node.status({ fill: "yellow", shape: "ring", text: "Not found" });
                    return;//halt flow
                }
                //other errors
                node.error(error, msg);
                node.status({ fill: "red", shape: "dot", text: "Error" });
                return;//halt flow
            }

        });
    }
    RED.nodes.registerType("Barcode Decoder", xzingDecode);
}