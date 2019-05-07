module.exports = function(RED) {
    
    function xzing2dDecode(config) {
        RED.nodes.createNode(this,config);
        const Jimp = require('jimp');
        const performanceLogger = require('./performanceLogger.js');
        const { MultiFormatReader, BarcodeFormat, DecodeHintType, RGBLuminanceSource, BinaryBitmap, HybridBinarizer } = require('@zxing/library/esm5');

        var node = this;
		node.data = config.data || "";//data
		node.dataType = config.dataType || "msg";
        node.specification = config.specification || "";//specification
        node.specificationType = config.specificationType || "str";

        function decode2d(img,options){
           
            const bitmap = img.bitmap;
            const hints = new Map();
            const formats = [];//[BarcodeFormat.QR_CODE, BarcodeFormat.DATA_MATRIX];
            const defaults = {QR: true, dataMatrix: true, tryHarder: true};
            options = options || {};
            options.QR = options.QR == undefined ? defaults.QR : options.QR;
            options.dataMatrix = options.dataMatrix == undefined ? defaults.dataMatrix : options.dataMatrix;
            options.tryHarder = options.tryHarder == undefined ? defaults.tryHarder : options.tryHarder;

            if(options.QR)
                formats.push(BarcodeFormat.QR_CODE);
            if(options.dataMatrix)
                formats.push(BarcodeFormat.DATA_MATRIX);
            if(formats.length)
                hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
            if(options.tryHarder)
                hints.set(DecodeHintType.TRY_HARDER, true);
          
            const reader = new MultiFormatReader();
            reader.setHints(hints);
          
            const len = bitmap.width * bitmap.height;
            const luminancesUint8Array = new Uint8Array(len);
          
            for(let i = 0; i < len; i++){
              luminancesUint8Array[i] = ((bitmap.data[i*4]+bitmap.data[(i*4)+1]+bitmap.data[(i*4)+2]) / 4) & 0xFF;
            }
    
            const luminanceSource = new RGBLuminanceSource(luminancesUint8Array, bitmap.width, bitmap.height);
            const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));
            const decoded = reader.decode(binaryBitmap,hints);
            
            return decoded;
          }


        function isEmpty(obj) {
            for(var key in obj) {
                if(obj.hasOwnProperty(key))
                    return false;
            }
            return true;
        }
        function isObject(val) {
            if (val === null) { return false;}
                return (typeof val === 'object');
        }
        function isJSON(json) {
            if(isObject(json))
                return false;
            try {
                var obj = JSON.parse(json)
                if (obj && typeof obj === 'object' && obj !== null) {
                    return true
                }
            } catch (err) { }
            return false
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
            var specification;
            RED.util.evaluateNodeProperty(node.specification,node.specificationType,node,msg,(err,value) => {
                if (err) {
                    node.error("Unable to evaluate specification",msg);
                    node.status({fill:"red",shape:"ring",text:"Unable to evaluate specification"});
                    return;//halt flow!
                } else {
                    specification = value;
                }
            }); 
            msg.originalPayload = msg.payload;//store original Payload incase user still wants it
            try {
                node.msgMem = msg;

                //check specification - is it a JSON string? convert to object if it is.
                if(specification && isJSON(specification)){
                    specification = JSON.parse(specification);
                }

                function decode(img,specification){
                    performance.start("decode");
                    let decoded = decode2d(img,specification);  
                    performance.end("decode");
                    performance.end("total");
                    node.msgMem.performance = performance.getPerformance();
                    node.msgMem.payload = decoded; 
                    node.status({fill:"green",shape:"dot",text:decoded.text});
                    node.send(node.msgMem); 
                }

                if(typeof data == 'string' && data.substr(0,30).indexOf('base64') != -1 && data.substr(0,4).indexOf('data') == 0) {
                    performance.start("base64_to_buffer");
                    let url = data.replace(/^data:image\/\w+;base64,/, "");
                    data = new Buffer(url, 'base64');
                    performance.end("base64_to_buffer");
                } else if(data instanceof Jimp){
                    decode(data,specification);
                } else {  
                    performance.start("jimp_read");
                    Jimp.read(data)
                        .then(img => {
                            performance.end("jimp_read");
                            decode(img,specification);
                        })
                        .catch(err => {
                            console.error(err);
                            node.error(err,msg);
                            node.status({fill:"red",shape:"dot",text:"Error processing image"});
                            return;//halt flow
                        });
                }
               
            } catch (error) {
                console.error(error);
                node.error(error,msg);
                node.status({fill:"red",shape:"dot",text:"Error"});
                return;//halt flow
            }
            
           
        });
    }
    RED.nodes.registerType("2d Barcode Decoder",xzing2dDecode);
}