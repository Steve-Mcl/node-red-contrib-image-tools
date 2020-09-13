module.exports = function(RED) {
    
    function barcodeWriter(config) {
        RED.nodes.createNode(this,config);
        const Jimp = require('jimp');
        const performanceLogger = require('node-red-contrib-image-tools/performanceLogger');
        const symbology = require('symbology');


        // const bitgener = require('bitgener');

        // const stream = require('stream');
        // const path = require('path');
        
        // const { promisify, inherits } = require('util');
        // const sharp = require('sharp');
         
        // const pipeline = promisify(stream.pipeline);

        // const  Writable = stream.Writable;

        // var memStore = { };
        // /* Writable memory stream */
        // function WMStrm(key, options) {
        //     // allow use without new operator
        //     if (!(this instanceof WMStrm)) {
        //     return new WMStrm(key, options);
        //     }
        //     Writable.call(this, options); // init super
        //     this.key = key; // save key
        //     memStore[key] = new Buffer(''); // empty
        // }
        // inherits(WMStrm, Writable);
        
        // WMStrm.prototype._write = function (chunk, enc, cb) {
        //     // our memory store stores things in buffers
        //     var buffer = (Buffer.isBuffer(chunk)) ?
        //     chunk :  // already is Buffer use it
        //     new Buffer(chunk, enc);  // string, convert
        
        //     // concat to the buffer already there
        //     memStore[this.key] = Buffer.concat([memStore[this.key], buffer]);
        //     cb();
        // };



        var node = this;
		node.data = config.data || "payload";//data
        node.dataType = config.dataType || "msg";
        node.barcode = config.barcode || "QRCODE";
        node.barcodeType = config.barcodeType || "str";
        
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
            msg.originalPayload = msg.payload;//store original Payload incase user still wants it
            let formats = null;

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
            var options = msg.options || {};
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
            options.symbology = symbology.Barcode[barcode];
            if(outputOptions) options.outputOptions = outputOptions;

            symbology
            .createStream(options, data)
            .then((result) => {
              console.log('Result: ', result)
              result.buf = new Buffer(result.data, 'base64');
              msg.payload = result;
              node.send(msg);
              return
            }).catch(e => {
                node.error(e,msg);
            }) 

            return;
            // try {
            //     node.msgMem = msg;
            //     const convert = async function convert({
            //         buffer,
            //         density,
            //         format,
            //         method,
            //         filePath,
            //       } = {}) {
            //         // sharp it!
            //         const sharped = sharp(buffer, { density });
            //         let ret;
                   
            //         if (method === 'toFile' || filePath !== undefined) {
            //           ret = await sharped.toFile(filePath);
            //           // object returned by sharp: https://sharp.pixelplumbing.com/en/stable/api-output/#tofile
            //         // } else if (method === 'toBuffer') {
            //         //   ret = sharped.toFormat(format).toBuffer();
            //         } else {
            //           // return a sharp/streamable object
            //           ret = sharped[format]();
            //         }
                   
            //         return ret;
            //       };
        
                  
                 


            //         // then use it in an async function
            //         (async () => {
            //             try {
            //             // const wstream = createWriteStream(path.join(__dirname, 'sharped.png'));
            //             var wstream = new WMStrm('foo');
            //             wstream.on('finish', function () {
            //                 console.log('finished writing');
            //                 msg.payload = memStore.foo;
            //                 node.send(msg)
            //             });
            //             const {
            //                 svg: buffer,
            //                 density,
            //             } = await bitgener({
            //                 data: msg.payload,
            //                 type: 'codabar',
            //                 output: 'buffer',
            //                 encoding: 'utf8',
            //                 rectangular: true,
            //                 padding: 0,
            //                 width: 250,
            //                 height: 250,
            //                 original2DSize: false,
            //                 color: '#000000',
            //                 opacity: 1,
            //                 bgColor: '#eeeeee',
            //                 bgOpacity: 1,
            //                 hri: {
            //                 show: true,
            //                 fontFamily: 'Courier New',
            //                 fontSize: 15,
            //                 marginTop: 0,
            //                 },
            //             });
                    
            //             const rstream = await convert({
            //                 buffer,
            //                 density,
            //                 format: 'png',
            //                 method: "toBuffer"
            //             });

            //             // listen to rstream and wstream error events ;)
                    
            //             // use pipeline to automatically clean up streams or you're exposing your code to memory leaks
            //             await pipeline(rstream, wstream);                    
                        

            //             // ...
            //         } catch (e) {
            //             node.error(e,msg);
            //         }
            //         })();
               
            // } catch (error) {
            //     //console.error(error);
            //     if(error.name = "NotFoundException" || error.message == "No MultiFormat Readers were able to detect the code."){
            //         //do nothing 
            //         node.status({fill:"yellow",shape:"ring",text:"Not found"});
            //         return;//halt flow
            //     } 
            //     //other errors
            //     node.error(error,msg);
            //     node.status({fill:"red",shape:"dot",text:"Error"});
            //     return;//halt flow
            // }
            
           
        });
    }
    RED.nodes.registerType("Barcode Writer",barcodeWriter);
}