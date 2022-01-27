
const _image_tools_fonts = new (function () {
    var __fonts = {}

    this.getFont = function (name) {
        return __fonts[name];
    }
    this.setFont = function (name, font) {
        __fonts[name] = font;
    }
})()

module.exports = function (RED) {

    function jimpNode(config) {
        RED.nodes.createNode(this, config);
        const Jimp = require('jimp');
        const threshold = require('@jimp/plugin-threshold')
        const configure = require('@jimp/custom')
        const isBase64 = require('is-base64');
        const { setObjectProperty, isEmpty, isJSON, isObject } = require('./common.js');
        const performanceLogger = require('./performanceLogger.js');

        configure({ plugins: [threshold] }, Jimp);

        const convolutions = {
            convolute_sharpen: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]],
            convolute_strongsharpen: [[-1, -1, -1], [-1, 9, -1], [-1, -1, -1]],
            convolute_edgeenhance: [[0, 0, 0], [-1, 1, 0], [0, 0, 0]],
            convolute_edgedetect: [[0, 1, 0], [1, -4, 1], [0, 1, 0]],
            convolute_emboss: [[-2, -1, 0], [-1, 1, 1], [0, 1, 2]],
            convolute_antialise: [[1, 2, 1], [2, 4, 2], [1, 2, 1]]
        }
        const isDef = v => typeof v !== 'undefined' && v !== null;
        const node = this;
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
        node.sendProperty = config.sendProperty || "payload";


        function normaliseJimpFunctionParameter(j, p) {
            if (p instanceof Jimp) {
                return p;
            }
            function normaliseJimpFunctionParameterValue(j, p) {
                if (typeof p == "string") {
                    if (p.startsWith("Align.")) {
                        let jp = p.replace("Align.", "")
                        let alignMode = {
                            "Left": 1,
                            "Centre": 2,
                            "Right": 4,
                            "Top": 8,
                            "Middle": 16,
                            "Bottom": 32,
                            "Top Left": 1 + 8,
                            "Top Centre": 2 + 8,
                            "Top Right": 4 + 8,
                            "Middle Left": 1 + 16,
                            "Middle Centre": 2 + 16,
                            "Middle Right": 4 + 16,
                            "Bottom Left": 1 + 32,
                            "Bottom Centre": 2 + 32,
                            "Bottom Right": 4 + 32,
                        }
                        if (alignMode[jp] != null) {
                            return alignMode[jp];
                        }
                    } else if (p.startsWith("AlignX.")) {
                        let jp = p.replace("AlignX.", "")
                        if (j[jp] != null) {
                            return j[jp];
                        }
                    } else if (p.startsWith("AlignY.")) {
                        let jp = p.replace("AlignY.", "")
                        if (j[jp] != null) {
                            return j[jp];
                        }
                    } else if (p.startsWith("Jimp.")) {
                        let jp = p.replace("Jimp.", "")
                        if (j[jp] != null) {
                            return j[jp];
                        }
                    } else if (p.startsWith("Font.")) {
                        let jp = p.replace("Font.", "")
                        if (j[jp] != null) {
                            return j[jp];
                        }
                    } else if (p.startsWith("Blend.")) {
                        let jp = p.replace("Blend.", "")
                        if (j[jp] != null) {
                            return j[jp];
                        }
                    } else if (isJSON(p)) {
                        return JSON.parse(p);
                    }
                }
                return p;
            }

            if (Array.isArray(p)) {
                for (let index = 0; index < p.length; index++) {
                    p[index] = normaliseJimpFunctionParameter(j, p[index]);
                }
                return p;
            } else if (isObject(p)) {
                let pNew = {};
                let keys = Object.keys(p);
                keys.forEach(key => {
                    pNew[key] = normaliseJimpFunctionParameter(j, p[key]);
                });
                return pNew;
            } else {
                return normaliseJimpFunctionParameterValue(j, p);
            }

        }

         node.on('input', async function (msg) {

            const nodeStatusError = function (err, msg, statusText) {
                node.error(err, msg);
                node.status({ fill: "red", shape: "dot", text: statusText });
            }
            const nodeStatusImageProcessError = function (err, msg) {
                nodeStatusError(err, msg, "Error processing image");
            }
            const nodeStatusParameterError = function (err, msg, propName) {
                nodeStatusError(err, msg, "Unable to evaluate property '" + propName + "' value")
            }

            try {

                const performance = new performanceLogger(node.id);
                performance.start("total");

                /* ****************  Node status **************** */
                node.status({});//clear status

                /* ****************  Get Image Data Parameter **************** */
                let data;
                try {
                    RED.util.evaluateNodeProperty(node.data, node.dataType, node, msg, (err, value) => {
                        if (err) {
                            nodeStatusParameterError(err, msg, "image");
                            return;//halt flow!
                        } else {
                            data = value;
                        }
                    });
                } catch (error) {
                    nodeStatusError(new Error("property 'image' is not valid"), msg, "property 'image' is not valid");
                    return;
                }
                

                if (!data) {
                    nodeStatusError(new Error("property 'image' is not valid"), msg, "image cannot be empty");
                    return;
                }

                let inputParameters = [];
                let fn = node.selectedJimpFunction;
                try {

                    /* ****************  Get Image Process Parameters **************** */
                    let parameterCount = fn && fn.parameters ? Math.min(8, fn.parameters.length) : 0;
                    for (let paramIndex = 0; paramIndex < parameterCount; paramIndex++) {
                        const paramNo = paramIndex + 1;
                        if (fn.fn == "batch" && paramNo > 1) {
                            break;//only parameter1 is used for batch mode
                        }
                        const nodeParam = node["parameter" + paramNo];
                        const nodeParamType = node["parameter" + paramNo + "Type"];
                        if (nodeParam || nodeParamType == "Jimp.AUTO" || nodeParamType == "auto" || fn.parameters[paramIndex].required) {
                            if (nodeParamType == "Jimp.AUTO" || nodeParamType == "auto") {
                                inputParameters[paramIndex] = -1;//Jimp.AUTO == -1
                            } else {
                                RED.util.evaluateNodeProperty(nodeParam, nodeParamType, node, msg, (err, value) => {
                                    if (err) {
                                        nodeStatusParameterError(err, msg, fn.parameters[paramIndex].name);
                                        return;//halt flow!
                                    } else {
                                        let p = {};
                                        inputParameters[paramIndex] = value;
                                        if (nodeParamType === 'Jimp' ||
                                            nodeParamType === 'Align' ||
                                            nodeParamType === 'AlignX' ||
                                            nodeParamType === 'AlignY' ||
                                            nodeParamType === 'Blend' ||
                                            nodeParamType === 'Font') {
                                            inputParameters[paramIndex] = nodeParamType + '.' + value;
                                        }
                                    }
                                });
                            }
                        }
                    }


                    /* **************** Main - Collect & normalise parameters then process image and send result **************** */

                    let jobs = [];
                    if (fn && fn.name) {

                        if (fn.fn === "batch") {
                            let batchInput = inputParameters[0];
                            //check batchInput - is it a JSON string? convert to object if it is.
                            if (batchInput && isJSON(batchInput)) {
                                batchInput = JSON.parse(batchInput);
                            }

                            //next see if batchInput is an array of "things to do".  
                            if (!(!batchInput || isEmpty(batchInput))) {
                                if (Array.isArray(batchInput)) {
                                    jobs = batchInput;
                                } else {
                                    jobs = [batchInput];
                                }
                                //now loop through the spec.parameters & normalise them where needed
                                for (let jIndex = 0; jIndex < jobs.length; jIndex++) {
                                    const job = jobs[jIndex];
                                    if (!job.parameters || !Array.isArray(job.parameters)) {
                                        job.parameters = [];
                                    }
                                    const normaliseParams = [];
                                    for (let pIndex = 0; pIndex < job.parameters.length; pIndex++) {
                                        normaliseParams[pIndex] = normaliseJimpFunctionParameter(Jimp, job.parameters[pIndex])
                                    }
                                    job.parameters = normaliseParams
                                }
                            }

                        } else if (fn.fn === "none") {
                            //do nothing
                        } else {
                            const job = {};
                            job.name = fn.fn;

                            //now we have collected users input, we need to see if any of the input parameters should be part of an {object} parameter
                            const normaliseParams = [];
                            let fplookup = {};
                            let fParam = 0;
                            for (let index = 0; index < fn.parameters.length; index++) {
                                let funcParam = fn.parameters[index];
                                if (funcParam.group) {
                                    let i = fplookup[funcParam.group];
                                    if (!(typeof i == "number")) {
                                        i = fParam;
                                        normaliseParams[i] = {};
                                        fplookup[funcParam.group] = i;
                                        fParam++;
                                    }
                                    let value = inputParameters[index];
                                    if (isDef(value)) {
                                        normaliseParams[i][funcParam.name] = normaliseJimpFunctionParameter(Jimp, value);
                                    }
                                } else {
                                    let value = inputParameters[index];
                                    if (isDef(value)) {
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


                    function doProcess(Jimp, img, job) {
                        let returnValue = {
                            success: false,
                            result: null,
                            image: img,
                            takeImage: false,
                        }
                        if (!job.parameters) {
                            job.parameters = [];
                        }

                        let theResult;
                        if (job.name == "print") {
                            let text = typeof job.parameters[3] == "object" ? job.parameters[3].text : job.parameters[3];
                            text = text.replace(/(?:\\r\\n|\\r|\\n|\r\n|\r|\n)/g, '\n');
                            let lines = text.split("\n");
                            let thisParams = [...job.parameters];
                            let lineSpacing = 0; //TODO: better way of handling line spacing
                            for (let l = 0; l < lines.length; l++) {
                                const line = lines[l];
                                if (typeof thisParams[3] == "object") {
                                    thisParams[3].text = line;
                                } else {
                                    thisParams[3] = line;
                                }
                                let newY = 0;
                                let thisResult = img.print(...thisParams, (err, image, { x, y }) => {
                                    if (err) {
                                        returnValue.success = false;
                                        throw err;
                                    }
                                    newY = y;
                                });
                                if (thisResult instanceof Error) {
                                    returnValue.result = thisResult;
                                    returnValue.success = false;
                                    throw thisResult;
                                }
                                returnValue.result = thisResult;//save last result TODO: consider better way of handling multiple results for multiple print lines
                                if (l < lines.length) {
                                    thisParams[2] = (newY + lineSpacing);
                                }
                            }
                            returnValue.success = true;

                            returnValue.image = img;
                        } else if (img[job.name]) {
                            theResult = img[job.name](...job.parameters); //call the image lib function
                            returnValue.result = theResult;
                            if (theResult instanceof Error) {
                                returnValue.success = false;
                                throw theResult;
                            }
                            returnValue.success = true;
                            returnValue.image = img;
                        } else if (Jimp[job.name]) {
                            //img._debug_tag="orig input img"
                            theResult = Jimp[job.name](img, ...job.parameters);
                            returnValue.takeImage = true;
                            if (theResult instanceof Jimp) {
                                returnValue.image = theResult;
                            }
                            //theResult.image._debug_tag="diff result"
                        } else {
                            throw new Error(`Process '${job.name}' is not supported`)
                        }
                        switch (job.name) {
                            case "diff":
                                job.result = theResult.percent;
                                returnValue.result = theResult.percent;
                                returnValue.takeImage = true;
                                returnValue.image = theResult && theResult.image;
                                returnValue.success = returnValue && (returnValue.image instanceof Jimp);
                                break;
                            case "distance":
                                job.result = theResult;
                                returnValue.success = !!theResult;
                                returnValue.result = theResult;
                                returnValue.image = img;
                                break;
                            case "histogram":
                                job.result = theResult;
                                returnValue.success = !!theResult;
                                returnValue.result = theResult;
                                returnValue.image = img;
                                break;

                            default:
                                job.result = true;
                                returnValue.success = true;
                                returnValue.result = true;
                                returnValue.image = img;
                                break;
                        }
                        return returnValue;
                    }

                    async function imageProcessor(Jimp, img, jobs, node, msg, performance) {
                        let doWork = (Array.isArray(jobs) && jobs.length > 0)
                        if (doWork) {
                            var jobPerformance = new performanceLogger(node.id);

                            //loop through jobs & carry them out
                            for (let i = 0; i < jobs.length; i++) {
                                var processResult = {
                                    image: img
                                };
                                let job = jobs[i];//get the job
                                //check job is valid and has a function name 
                                if (!job || !job.name || job.name === 'none') {
                                    continue;
                                }
                                //see if the function is a preset convolute function
                                //if so, get the kernel and change fn name to "convolute"
                                let convolutionParams = convolutions[job.name];
                                if (convolutionParams) {
                                    job.name = "convolute";
                                    job.parameters = [convolutionParams];
                                }
                                let perfMeasureName = "process" + (i + 1) + "_" + job.name;
                                jobPerformance.start(perfMeasureName);

                                if (job.name == "print") {

                                    //this is a print request where the text is an object with alignment
                                    //if either of parameters [4] or [5] are maxWidth/maxHeight
                                    //are set to auto (-1) then set them to actual height / width
                                    if (job.parameters[4] == -1) {
                                        job.parameters[4] = img.getWidth()
                                    }
                                    if (job.parameters[5] == -1) {
                                        job.parameters[5] = img.getHeight()
                                    }
                                    let fontFile = job.parameters[0];
                                    let fontName = (fontFile || "FONT_SANS_10_BLACK").toUpperCase();
                                    if (fontName.startsWith("JIMP.FONT_")) {
                                        fontName = fontName.replace("JIMP.", "")
                                    }
                                    if (fontName.startsWith("FONT_")) {
                                        fontFile = Jimp[fontFile];
                                    }
                                    let font = _image_tools_fonts.getFont(fontFile);

                                    if (font) {
                                        job.parameters[0] = font;
                                        processResult = doProcess(Jimp, img, job);
                                    } else {
                                        if (!fontFile) throw new Error(`'Print' error - cannot load font ${fontName}`)
                                        try {
                                            // let p = Jimp.loadFont(fontFile);
                                            let f = await Jimp.loadFont(fontFile);
                                            if (!f) throw new Error(`'Print' error - cannot load font ${fontName}, problem loading file ${fontFile}`)
                                            _image_tools_fonts.setFont(fontFile, f)
                                            job.parameters[0] = f;
                                            processResult = doProcess(Jimp, img, job);

                                            // Jimp.loadFont(fontFile, function(err, f) {
                                            //     if (err || !f) throw new Error(`'Print' error - cannot load font ${fontName}, problem loading file ${fontFile}`);
                                            //     _image_tools_fonts.setFont(fontFile, f);
                                            //     job.parameters[0] = f;
                                            //     processResult = doProcess(Jimp, img, job);
                                            // })

                                        } catch (err) {
                                            debugger
                                            throw err;
                                        }
                                    }
                                } else {
                                    processResult = doProcess(Jimp, img, job);
                                }
                                img = processResult && processResult.takeImage ? processResult.image : img;
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
                                // msg.payload = img;
                                setObjectProperty(msg, node.sendProperty, img);
                                msg.performance = performance.getPerformance();
                                node.send(msg);
                                break;
                            case "buf":
                                performance.start("jimp_to_buffer");
                                img.getBuffer(Jimp.AUTO, (err, buffer) => {
                                    if (err) {
                                        nodeStatusError(err, msg, "Error getting buffer of image")
                                        return;
                                    }
                                    performance.end("jimp_to_buffer");
                                    performance.end("total");
                                    // msg.payload = buffer;
                                    setObjectProperty(msg, node.sendProperty, buffer);
                                    msg.performance = performance.getPerformance();
                                    node.send(msg);
                                });
                                break;
                            case "b64":
                                performance.start("jimp_to_base64");
                                img.getBase64(Jimp.AUTO, (err, b64) => {
                                    if (err) {
                                        nodeStatusError(err, msg, "Error getting base64 image")
                                        return;
                                    }
                                    performance.end("jimp_to_base64");
                                    performance.end("total");
                                    // msg.payload = b64;
                                    setObjectProperty(msg, node.sendProperty, b64);
                                    msg.performance = performance.getPerformance();
                                    node.send(msg);
                                });
                                break;

                            default:
                                break;
                        }
                    }

                    //if image is base64, convert it to a buffer
                    let isBuffer = Buffer.isBuffer(data);
                    let isArray = Array.isArray(data);
                    let isString = typeof data === 'string';
                    let hasMime = false, isBase64Image = false
                    if (isString) {
                        hasMime = data.startsWith("data:");
                        isBase64Image = isBase64(data, { mimeRequired: hasMime });
                    }
                    //hack to support gif. Oddly, Jimp can read a gif but fails if you try to do most operations
                    if (data instanceof Jimp && data._originalMime == "image/gif") {
                        data.getBuffer(Jimp.MIME_PNG, (e, b) => {
                            if (e) {
                                throw e;
                            }
                            gif = true;
                            data = b;
                            isBuffer = true;
                        })
                    }
                    let isfileName = isString && !isBase64Image;
                    if (isString && isBase64Image) {
                        //convert to buffer ready for loading in jimp
                        performance.start("base64_to_buffer");
                        let b64Data;
                        if (hasMime) {
                            b64Data = data.replace(/^data:image\/\w+;base64,/, "");//get data part only 
                        } else {
                            b64Data = data;
                        }
                        //data = new Buffer(b64Data, 'base64'); depreciated
                        data = Buffer.from(b64Data, 'base64');
                        performance.end("base64_to_buffer");
                    }
                    //if data is a Jimp, then crack on with image processing functions
                    if (data instanceof Jimp) {
                        try {
                            await imageProcessor(Jimp, data, jobs, node, msg, performance);
                        } catch (err) {
                            nodeStatusImageProcessError(err, msg);
                        }
                    } else {
                        //so data was NOT an instance of Jimp - call read/create then do image processing
                        let perfName = "jimp_read";
                        var args = [data];
                        if (isObject(data) && data.w && data.h) {
                            perfName = "jimp_create"
                            args = [data.w, data.h];
                            if (data.background || typeof data.background == "number") {
                                args.push(data.background)
                            }
                        }
                        performance.start(perfName);
                        try {
                            const img = await Jimp.read(...args)
                            performance.end(perfName);
                            await imageProcessor(Jimp, img, jobs, node, msg, performance);
                        } catch (err) {
                            nodeStatusImageProcessError(err, msg);
                        }
                    }

                } catch (err) {
                    nodeStatusImageProcessError(err, msg);
                }
            } catch (error) {
                nodeStatusError(error, msg);
            }
        });
    }
    RED.nodes.registerType("jimp-image", jimpNode);
}
