module.exports = function(RED) {
    
    function barcodeWriter(config) {
        RED.nodes.createNode(this,config);
        const performanceLogger = require('./performanceLogger');
        const symbology = require('symbology');

        var node = this;
		node.data = config.data || "payload";//data
        node.dataType = config.dataType || "msg";
        node.barcode = config.barcode || "QRCODE";
        node.barcodeType = config.barcodeType || "str";
        
        node.options = config.options || "payload";
        node.optionsType = config.optionsType || "msg";

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
        if(node.DATA_MATRIX) {stringformats.push("DATA_MATRIX")}
        if(node.QR_CODE) {stringformats.push("QR_CODE")}
        if(node.PDF_417) {stringformats.push("PDF_417")}
        if(node.EAN_8) {stringformats.push("EAN_8")}
        if(node.EAN_13) {stringformats.push("EAN_13")}
        if(node.CODE_39) {stringformats.push("CODE_39")}
        if(node.CODE_128) {stringformats.push("CODE_128")}
        if(node.ITF) {stringformats.push("ITF")}
        if(node.RSS_14) {stringformats.push("RSS_14")}
        node.formats = barcodeStringFormatsConvertor(stringformats);
        node.status({fill:"grey",shape:"ring",text:"Initialised"});
        function barcodeStringFormatsConvertor(ArrayOfStringFormats){
            let formats = null;
            try {
                if(ArrayOfStringFormats && ArrayOfStringFormats.length){
                    formats = [];
                    for (let index = 0; index < ArrayOfStringFormats.length; index++) {
                        const format = BarcodeFormat[ArrayOfStringFormats[index]];
                        if(format || format === 0){
                            if(formats.includes(format) === false){
                                formats.push(format);
                            }
                        }
                    }
                } 
            } catch (error) {
            }            
            return formats;
        }
        
        function isNumber(n) {
            if (n === "" || n === true || n === false) return false;
            return !isNaN(parseFloat(n)) && isFinite(n);
        }

        node.on('input', function(msg) {
            var performance = new performanceLogger(node.id);
            performance.start("total");

            node.status({});//clear status
            var data;
            RED.util.evaluateNodeProperty(node.data,node.dataType,node,msg,(err,value) => {
                if (err) {
                    node.error("Unable to evaluate data",msg);
                    node.status({fill:"red",shape:"ring",text:"Unable to evaluate data"});
                    return;//halt flow!
                } else {
                    data = value; 
                }
            }); 
            var barcode;
            RED.util.evaluateNodeProperty(node.barcode,node.barcodeType,node,msg,(err,value) => {
                if (err) {
                    node.error("Unable to evaluate barcode",msg);
                    node.status({fill:"red",shape:"ring",text:"Unable to evaluate barcode"});
                    return;//halt flow!
                } else {
                    barcode = value; 
                }
            }); 
            var options;
            RED.util.evaluateNodeProperty(node.options,node.optionsType,node,msg,(err,value) => {
                if (err) {
                    node.error("Unable to evaluate options",msg);
                    node.status({fill:"red",shape:"ring",text:"Unable to evaluate options"});
                    return;//halt flow!
                } else {
                    options = value; 
                }
            }); 
            options = options || {};
            if(typeof options == "string") {
                try {
                    options = JSON.parse(options);
                } catch (error) {
                    options = {};
                }
            }

            if(!options.symbology) {
                if(isNumber(barcode)) {
                    options.symbology = parseInt(barcode);
                } else {
                    options.symbology = symbology.Barcode[barcode] || symbology.Barcode["QRCODE"];
                }
            }

            msg.originalPayload = msg.payload;//store original Payload incase user still wants it

            let getDeepVal = function(obj, path, def) {
                if (typeof obj === "undefined" || obj === null) return def;
                path = path.split(/[\.\[\]\"\']{1,2}/);
                for (var i = 0, l = path.length; i < l; i++) {
                    if (path[i] === "") continue;
                    obj = obj[path[i]];
                    if (typeof obj === "undefined" || obj === null) return def;
                }
                return obj == null ? def : obj;
            }



            
            //convert any symbology.xxx.yyy values into real option values
            for(let p in options) {
                let v = options[p];
                if(!v) continue;
                if(typeof v == "string") {
                    
                    if(v.startsWith("symbology.Options.")) {
                        try {
                            options[p] = eval(v);    
                        } catch (error) { }
                        
                    } else if(v.startsWith("symbology.")) {
                        options[p] = getDeepVal( {symbology}, v, v);
                    }
                }
            }

            var outputOptions = msg.outputOptions;
            if(outputOptions) options.outputOptions = outputOptions;
            performance.start("barcode_create");
            symbology
            .createStream(options, data)
            .then((result) => {
                performance.end("barcode_create");
                performance.end("total");
                console.log('Result: ', result); 
                msg.payload = result;
                msg.performance = performance.getPerformance();
                node.send(msg);
                return
            }).catch(e => {
                node.error(e,msg);
            }) 

            return;
           
        });
    }
    RED.nodes.registerType("Barcode Generator",barcodeWriter);
}