
var fonts = new (function () {
    var __fonts = {}

    this.getFont = function (name) {
        return __fonts[name];
    }
    this.setFont = function (name, font) {
        __fonts[name] = font;
    }
})()

module.exports = function(RED) {
    function jimpNode(config) {
        RED.nodes.createNode(this,config);
        var JimpBase = require('jimp');
        const threshold = require('@jimp/plugin-threshold')
        const configure = require('@jimp/custom')
        const performanceLogger = require('./performanceLogger.js');

        const Jimp = configure({ plugins: [threshold] }, JimpBase)
        //FUTURE: const theFontMgr = FontManager.instance();        
        
        const convolutions = {
            convolute_sharpen: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]],
            convolute_strongsharpen: [[-1, -1, -1], [-1, 9, -1], [-1, -1, -1]],
            convolute_edgeenhance: [[0, 0, 0], [-1, 1, 0], [0, 0, 0]],
            convolute_edgedetect: [[0, 1, 0], [1, -4, 1], [0, 1, 0]],
            convolute_emboss: [[-2, -1, 0], [-1, 1, 1], [0, 1, 2]],
            convolute_antialise: [[1, 2, 1], [2, 4, 2], [1, 2, 1]]
        }
        const isDef = v => typeof v !== 'undefined' && v !== null;
        var node = this;
		node.data = config.data || "";//data
		node.dataType = config.dataType || "msg";
        node.ret = config.ret || "buf";

		node.parameter1 = config.parameter1 || "";
		node.parameter1Type = config.parameter1Type;
		node.parameter2 = config.parameter2 || "";
		node.parameter2Type = config.parameter2Type;
		node.parameter3 = config.parameter3 || "";
		node.parameter3Type = config.parameter3Type;
		node.parameter4 = config.parameter4 || "";
		node.parameter4Type = config.parameter4Type;
		node.parameter5 = config.parameter5 || "";
		node.parameter5Type = config.parameter5Type;
		node.parameter6 = config.parameter6 || "";
		node.parameter6Type = config.parameter6Type;
		node.parameter7 = config.parameter7 || "";
		node.parameter7Type = config.parameter7Type;
		node.parameter8 = config.parameter8 || "";
		node.parameter8Type = config.parameter8Type;
        node.parameterCount = config.parameterCount;
        node.jimpFunction = config.jimpFunction || {};
        node.fn = config.fn || "";
        node.selectedJimpFunction = config.selectedJimpFunction || {};
        
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
        function normaliseJimpFunctionParameter(j,p){
            if(typeof p == "string"){ 
                if(p.startsWith("Align.")){
                    let jp = p.replace("Align.","")
                    let alignMode = {
                        "Left" : 1,
                        "Centre": 2,
                        "Right" : 4,
                        "Top" : 8,
                        "Middle": 16,
                        "Bottom": 32,
                        "Top Left" : 1 + 8,
                        "Top Centre" : 2 + 8,
                        "Top Right" : 4 + 8,
                        "Middle Left" : 1 + 16,
                        "Middle Centre" : 2 + 16,                        
                        "Middle Right" : 4 + 16,                        
                        "Bottom Left" : 1 + 32,
                        "Bottom Centre" : 2 + 32,                        
                        "Bottom Right" : 4 + 32,                        
                    }   
                    if(alignMode[jp] != null){
                        return alignMode[jp];
                    }
                } else if(p.startsWith("AlignX.")){
                    let jp = p.replace("AlignX.","")
                    if(j[jp] != null){
                        return j[jp];
                    }
                } else if(p.startsWith("AlignY.")){
                    let jp = p.replace("AlignY.","")
                    if(j[jp] != null){
                        return j[jp];
                    }
                } else if(p.startsWith("Jimp.")){
                    let jp = p.replace("Jimp.","")
                    if(j[jp] != null){
                        return j[jp];
                    }
                } else if(p.startsWith("Font.")){
                    let jp = p.replace("Font.","")
                    if(j[jp] != null){
                        return j[jp];
                    }
                } else if(p.startsWith("Blend.")){
                    let jp = p.replace("Blend.","")
                    if(j[jp] != null){
                        return j[jp];
                    }
                } else if(isJSON(p)){
                    return JSON.parse(p);
                }
            }
            return p;
        }
          
        node.on('input', function(msg) {

            var performance = new performanceLogger(node.id);
            performance.start("total");

            /* ****************  Node status **************** */
            node.status({});//clear status
            var nodeStatusError = function(err,msg,statusText){
                console.error(err);
                node.error(err,msg);
                node.status({fill:"red",shape:"dot",text:statusText});
            }
            var nodeStatusImageProcessError = function(err,msg){
                nodeStatusError(err, msg, "Error processing image");
            }
            var nodeStatusParameterError = function(err, msg, propName){
                nodeStatusError(err, msg, "Unable to evaluate property '" + propName + "' value")
            }

            

            /* ****************  Get Image Data Parameter **************** */
            var data;
            RED.util.evaluateNodeProperty(node.data,node.dataType,node,msg,(err,value) => {
                if (err) {
                    nodeStatusParameterError(err,msg,"image");
                    return;//halt flow!
                } else {
                    data = value; 
                }
            }); 

            if(!data){
                nodeStatusError(new Error("property 'image' is not valid"),msg,"image cannot be empty");
                return;
            }

            let inputParameters = [];
            let fn = node.selectedJimpFunction;
            try {

                /* ****************  Get Image Process Parameters **************** */
                let parameterCount = fn && fn.parameters ? Math.min(8, fn.parameters.length) : 0;
                for (let paramIndex = 0; paramIndex < parameterCount; paramIndex++) {
                    const paramNo = paramIndex+1;
                    if(fn.fn == "batch" && paramNo > 1){
                        break;//only parameter1 is used for batch mode
                    }
                    const nodeParam = node["parameter" + paramNo];
                    const nodeParamType = node["parameter" + paramNo + "Type"];
                    if(nodeParam || nodeParamType == "Jimp.AUTO" || nodeParamType == "auto" || fn.parameters[paramIndex].required) {
                        if(nodeParamType == "Jimp.AUTO" || nodeParamType == "auto"){
                            inputParameters[paramIndex] = -1;//Jimp.AUTO == -1
                        } else {
                            RED.util.evaluateNodeProperty(nodeParam,nodeParamType,node,msg,(err,value) => {
                                if (err) {
                                    nodeStatusParameterError(err,msg,fn.parameters[paramIndex].name);
                                    return;//halt flow!
                                } else {
                                    let p = {};
                                    inputParameters[paramIndex] = value;
                                    if(nodeParamType === 'Jimp' || 
                                        nodeParamType === 'Align' || 
                                        nodeParamType === 'AlignX' || 
                                        nodeParamType === 'AlignY' || 
                                        nodeParamType === 'Blend' || 
                                        nodeParamType === 'Font'){
                                        inputParameters[paramIndex] = nodeParamType + '.' + value;
                                    }
                                }
                            }); 
                        }
                    }
                }
 
           
                /* **************** Main - Collect & normalise parameters then process image and send result **************** */

                let jobs = [];
                if(fn && fn.name){
                    
                    if(fn.fn === "batch"){
                        let batchInput = inputParameters[0];
                        //check batchInput - is it a JSON string? convert to object if it is.
                        if(batchInput && isJSON(batchInput)){
                            batchInput = JSON.parse(batchInput);
                        }
 
                        //next see if batchInput is an array of "things to do".  
                        if(!(!batchInput || isEmpty(batchInput))){
                            if(Array.isArray(batchInput)){
                                jobs = batchInput;
                            } else {
                                jobs = [batchInput];
                            }
                            //now loop through the spec.parameters & normalise them where needed
                            for (let jIndex = 0; jIndex < jobs.length; jIndex++) {
                                const job = jobs[jIndex];
                                if(!job.parameters || !Array.isArray(job.parameters)){
                                    job.parameters = [];
                                }
                                for (let pIndex = 0; pIndex < job.parameters.length; pIndex++) {
                                    job.parameters[pIndex] = normaliseJimpFunctionParameter(Jimp, job.parameters[pIndex])
                                }
                            }
                        }

                    } else if(fn.fn === "none"){
                        //do nothing
                    } else {
                        let job = {};
                        job.name = fn.fn;

                        //now we have collected users input, we need to see if any of the input parameters should be part of an {object} parameter
                        let normaliseParams = [];
                        let fplookup = {};
                        let fParam = 0;
                        for (let index = 0; index < fn.parameters.length; index++) {                       
                            let funcParam = fn.parameters[index];
                            if(funcParam.group){
                                let i = fplookup[funcParam.group];
                                if(!(typeof i == "number")){
                                    i = fParam;
                                    normaliseParams[i] = {};
                                    fplookup[funcParam.group] = i;
                                    fParam++;
                                }
                                let value = inputParameters[index];
                                if(isDef(value)){
                                    normaliseParams[i][funcParam.name] = normaliseJimpFunctionParameter(Jimp, value);
                                }
                            } else {
                                let value = inputParameters[index];
                                if(isDef(value)){
                                    normaliseParams[fParam++] = normaliseJimpFunctionParameter(Jimp, value);
                                } else {
                                    normaliseParams[fParam++] = undefined;
                                }
                            }
                        }  
                        job.parameters = normaliseParams;
                        jobs = [job];
                    }
                } 


                function doProcess(Jimp, img, job){
                    if(!job.parameters){
                        job.parameters = [];
                    }

                    let theResult;
                    if(img[job.name]){
                        theResult = img[job.name](...job.parameters); //call the image lib function
                        if(theResult instanceof Error)
                            throw theResult;
                    } else {
                        theResult = Jimp[job.name](img,...job.parameters);
                    }
                    switch (job.name) {
                        case "diff":
                            job.result = theResult.percent;
                            img = theResult.image;
                            break;
                        case "distance":
                            job.result = theResult;
                            break;
                        case "histogram":
                            job.result = theResult;
                            break;
                    
                        default:
                            job.result = true;
                            break;
                    }
                }
                                
                async function imageProcessor(Jimp,img,jobs,node,msg,performance){
                    let doWork = (Array.isArray(jobs) && jobs.length > 0)
                    if(doWork){
                        var jobPerformance = new performanceLogger(node.id);

                        //loop through jobs & carry them out
                        for(let i = 0; i < jobs.length; i++){
                            let job = jobs[i];//get the job
                            //check job is valid and has a function name 
                            if(!job || !job.name || job.name === 'none'){
                                continue;
                            }
                            //see if the function is a preset convolute function
                            //if so, get the kernel and change fn name to "convolute"
                            let convolutionParams = convolutions[job.name];
                            if(convolutionParams){
                                job.name = "convolute";
                                job.parameters = [convolutionParams];
                            }
                            let perfMeasureName = "process" + (i+1) + "_" + job.name;
                            jobPerformance.start(perfMeasureName);
                            
                            if(job.name == "print"){
                                
                                //this is a print request where the text is an object with alignment
                                //if either of parameters [4] or [5] are maxWidth/maxHeight
                                //are set to auto (-1) then set them to actual height / width
                                if(job.parameters[4] == -1){
                                    job.parameters[4] = img.getWidth()
                                }
                                if(job.parameters[5] == -1){
                                    job.parameters[5] = img.getHeight()
                                }

                                let fontFile = job.parameters[0];
                                if(fontFile.startsWith("FONT_")){
                                    fontFile = Jimp[fontFile];
                                }
                                //if(!fonts) fonts = {};
                                let font = fonts.getFont(fontFile);
                                if(font){
                                    job.parameters[0] = font;
                                    doProcess(Jimp,img,job);
                                } else {
                                    try {
                                        let p = Jimp.loadFont(fontFile);
                                        let f = await p;
                                        fonts.setFont(fontFile, f)
                                        job.parameters[0] = f;
                                        doProcess(Jimp,img,job);
                                    } catch (e) {
                                        console.error(e);
                                    }
                                }
                            } else {
                                doProcess(Jimp,img,job);
                            }
                             
                            jobPerformance.end(perfMeasureName);
                            job.performance = jobPerformance.getPerformance(perfMeasureName);

                        }
                    }

                    /* *************** prepare the reply ****************** */
                    msg.jobs = jobs;//add jobs object to msg.jobs. This will permit user to access performance values & inspect any paramter 'normalization' that occurred

                    //gather useful image info to send in msg.imageInfo
                    msg.imageInfo = {
                        hasAlpha: img.hasAlpha(),
                        MIME: img.getMIME(),
                        quality: img._quality,
                        width: img.getWidth(),
                        height: img.getHeight()
                    }

                    //convert image (if required) then send msg
                    switch (node.ret) {
                        case "img":
                            msg.payload = img;
                            msg.performance = performance.getPerformance();
                            console.log(`node.send()  ${node.id},${msg._msgid}`)
                            node.send(msg);
                            break;
                        case "buf":
                            performance.start("jimp_to_buffer");
                            img.getBuffer(Jimp.AUTO,(err, buffer) => {
                                if(err){
                                    nodeStatusError(err,msg,"Error getting buffer of image")
                                    return;
                                }
                                performance.end("jimp_to_buffer");
                                performance.end("total");
                                msg.payload = buffer;
                                msg.performance = performance.getPerformance();
                                console.log(`node.send() ${node.id},${msg._msgid}`)
                                node.send(msg);
                            });
                            break;
                        case "b64":
                            performance.start("jimp_to_base64");
                            img.getBase64(Jimp.AUTO,(err, b64) => {
                                if(err){
                                    nodeStatusError(err,msg,"Error getting base64 image")
                                    return;
                                }
                                performance.end("jimp_to_base64");
                                performance.end("total");
                                msg.payload = b64;
                                msg.performance = performance.getPerformance();
                                console.log(`node.send()  ${node.id},${msg._msgid}`)
                                node.send(msg);
                            });    
                            break;
                    
                        default:
                            break;
                    }
                }

                //if image is base64, convert it to a buffer
                if(typeof data == 'string' && data.substr(0,30).indexOf('base64') != -1 && data.substr(0,4).indexOf('data') == 0) {
                    performance.start("base64_to_buffer");
                    let url = data.replace(/^data:image\/\w+;base64,/, "");
                    data = new Buffer(url, 'base64');
                    performance.end("base64_to_buffer");
                } 
                //if data is a Jimp, then crack on with image processing functions
                if(data instanceof Jimp){
                    try {
                        imageProcessor(Jimp,data,jobs,node,msg,performance);
                    } catch (err) {
                        nodeStatusImageProcessError(err,msg);
                    }     
                } else {               
                    //so data was NOT an instance of Jimp - call read/create then do image processing
                    let perfName = "jimp_read";
                    var args = [data];
                    if(isObject(data) && data.w && data.h){
                        perfName = "jimp_create"
                        args = [data.h, data.w];
                        if(data.background || typeof data.background == "number"){
                            args.push(data.background)
                        }
                    }
                    performance.start(perfName);
                    Jimp.read(...args)
                        .then(img => {
                            performance.end(perfName);
                            try {
                                imageProcessor(Jimp,img,jobs,node,msg,performance);
                            } catch (err) {
                                nodeStatusImageProcessError(err,msg);
                            }                            
                        })
                        .catch(err => {
                            nodeStatusImageProcessError(err,msg);
                        });
                        
                    
                }
                
            } catch (err) {
                nodeStatusImageProcessError(err,msg);
            }
            
           
        });
    }
    RED.nodes.registerType("jimp-image",jimpNode);
}