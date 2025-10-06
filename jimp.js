
const _image_tools_fonts = new (function () {
    var __fonts = {}


    this.getFont = function (name) {
        if (__fonts[name]) {
            return {
                fontData: __fonts[name].fontData,
                fileName: __fonts[name].fileName,
                loaded: __fonts[name].loaded
            }
        }
    }
    this.setFont = function (name, fileName, fontData) {
        __fonts[name] = {
            fontData: fontData,
            fileName: fileName,
            loaded: !!fontData
        }
    }
})()

module.exports = function (RED) {
    const image_tools = require("./static/js/image_tools");
    const functions = image_tools.getJimpFunctions();
    const JIMP_KNOWN_FONTS = image_tools.JIMP_FONTS;
    JIMP_KNOWN_FONTS.forEach(font => {
        _image_tools_fonts.setFont(font, null, null)
    })
    const JIMP_BLEND_MODES = image_tools.JIMP_BLEND_MODES
    const JIMP_BLEND_MODES_V1 = image_tools.JIMP_BLEND_MODES_V1
    // const JIMP_ALIGN_MODES = image_tools.JIMP_ALIGN_MODES
    function jimpNode(config) {
        RED.nodes.createNode(this, config);
        const JIMP = require('jimp')
        const { Jimp, JimpMime } = JIMP
        const FONTS = require('jimp/fonts')
        const isBase64 = require('is-base64');
        const { setObjectProperty, isEmpty, tryParseJSON, isObject } = require('./common.js');
        const performanceLogger = require('./performanceLogger.js');

        // const { createJimp } = require('@jimp/core')
        // const { defaultFormats, defaultPlugins, JimpMime } = require("jimp")
        // const webp = require('@jimp/wasm-webp')
        // // const threshold = require('@jimp/plugin-threshold')
        // // const configure = require('@jimp/custom').default
        // const webp2 = require('@jimp/plugin-webp');
        // const Jimp = createJimp({
        //     formats: [...defaultFormats, webp],
        //     plugins: [...defaultPlugins, threshold],
        // })

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
        node.sendProperty = config.sendProperty || "payload";

        const minusOneCompatibility = {
            "resize.h": undefined,
            "resize.w": undefined,
        }
        function normaliseJimpFunctionParameter(fn, fnParam, p) {
            if (p instanceof Jimp) {
                return p;
            }
            function normaliseJimpFunctionParameterValue(fn, fnParam, p) {
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
                    } else if (p.startsWith("AlignX.") || p.startsWith("AlignX.HORIZONTAL_ALIGN_") || p.startsWith("Jimp.HORIZONTAL_ALIGN_")) {
                        const jp = p.replace("AlignX.", "").replace("Jimp.", "").replace("HORIZONTAL_ALIGN_", "")
                        if (JIMP.HorizontalAlign[jp] != null) {
                            return JIMP.HorizontalAlign[jp];
                        }
                    } else if (p.startsWith("AlignY.") || p.startsWith("AlignY.VERTICAL_ALIGN_") || p.startsWith("Jimp.VERTICAL_ALIGN_")) {
                        const jp = p.replace("AlignY.", "").replace("Jimp.", "").replace("VERTICAL_ALIGN_", "")
                        if (JIMP.VerticalAlign[jp] != null) {
                            return JIMP.VerticalAlign[jp];
                        }
                    } else if (p.startsWith("Jimp.")) {
                        let jp = p.replace("Jimp.", "")
                        if (jp === "AUTO") {
                            // pre V1 Jimp, "Jimp.AUTO" meant -1. This is no longer supported. Instead, just return undefined (handled later on a case by case basis)
                            return undefined
                        }
                        if (JIMP[jp] != null) {
                            return JIMP[jp];
                        } else if (Jimp[jp] != null) {
                            return Jimp[jp];
                        }
                    } else if (p.startsWith("Font.")) {
                        //TODO: check handle font loading (consider loading font here?)
                        let jp = p.replace("Font.", "")
                        return jp;
                    } else if (p.startsWith("Blend.")) {
                        let jp = p.replace("Blend.", "")
                        if (JIMP.BlendMode[jp]) {
                            return JIMP.BlendMode[jp]
                        } else if (JIMP.BlendMode[JIMP_BLEND_MODES_V1[jp]]) {
                            return JIMP.BlendMode[JIMP_BLEND_MODES_V1[jp]]
                        }
                    } else if (p.startsWith("BLEND_")) {
                        let jp = p.replace("BLEND_", "")
                        if (JIMP.BlendMode[jp]) {
                            return JIMP.BlendMode[jp]
                        } else if (JIMP.BlendMode[JIMP_BLEND_MODES_V1[jp]]) {
                            return JIMP.BlendMode[JIMP_BLEND_MODES_V1[jp]]
                        }
                    } else if (p.startsWith("RESIZE_")) {
                        switch (p) {
                            case "RESIZE_NEAREST_NEIGHBOR":
                                return 'nearestNeighbor';
                            case "RESIZE_BILINEAR":
                                return 'bilinearInterpolation';
                            case "RESIZE_BICUBIC":
                                return 'bicubicInterpolation';
                            case "RESIZE_HERMITE":
                                return 'hermiteInterpolation';
                            case "RESIZE_BEZIER":
                                return 'bezierInterpolation';
                            default:
                                return 'nearestNeighbor';
                        }
                    } else {
                        const [err, o] = tryParseJSON(p)
                        if (!err) {
                            return o;
                        }
                    }
                } else if (p === -1) {
                    const lookup = `${fn.name}.${fnParam.name}`
                    if (lookup in minusOneCompatibility) {
                        return minusOneCompatibility[lookup]
                    }
                }
                return p;
            }

            if (Array.isArray(p)) {
                for (let index = 0; index < p.length; index++) {
                    p[index] = normaliseJimpFunctionParameter(fn, fnParam, p[index]);
                }
                return p;
            } else if (isObject(p)) {
                let pNew = {};
                let keys = Object.keys(p);
                keys.forEach(key => {
                    pNew[key] = normaliseJimpFunctionParameter(fn, fnParam, p[key]);
                });
                return pNew;
            } else {
                return normaliseJimpFunctionParameterValue(fn, fnParam, p);
            }

        }

         node.on('input', async function (msg) {
            const nodeStatusError = function (err, msg, statusText) {
                err.cause = statusText;
                node.error(err, msg);
                node.status({ fill: "red", shape: "dot", text: statusText });
            }
            const nodeStatusImageProcessError = function (err, msg) {
                err.cause = "Error processing image"
                nodeStatusError(err, msg, err.cause)
            }
            const nodeStatusParameterError = function (err, msg, propName) {
                err.cause = "Unable to evaluate property '" + propName + "' value"
                nodeStatusError(err, msg, err.cause)
            }

            try {

                const performance = new performanceLogger(node.id);
                performance.start("total");

                /* ****************  Node status **************** */
                node.status({ fill: undefined, shape: undefined, text: '' });

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

                let inputParameters = []
                const fn = functions[node.jimpFunction || ''] // get definition from functions object;
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
                                inputParameters[paramIndex] = "Jimp.AUTO" // undefined //-1;//Jimp.AUTO == -1
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
                            const [err, o] = tryParseJSON(batchInput)
                            if (!err) {
                                batchInput = o;
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
                                    if (job.name == "grayscale") {
                                        job.name = "greyscale"; // Flow Compatibility
                                    }
                                    const batchFn = functions[job.name]
                                    if (!batchFn) {
                                        throw new Error(`Function '${job.name}' is not supported`)
                                    }
                                    job.parameters = job.parameters || []
                                    if (batchFn && Array.isArray(batchFn.parameters) && batchFn.parameters.length) {
                                        job.parameters = normaliseJimpFunctionParameters(batchFn, job.parameters)
                                    }
                                }
                            }

                        } else if (fn.fn === "none") {
                            //do nothing
                        } else {
                            const job = {};
                            job.name = fn.fn;
                            job.parameters = normaliseJimpFunctionParameters(fn, inputParameters);
                            jobs = [job];
                        }
                    }

                    // TODO: Consider when a batch passes an object instead of individual indexed params!
                    // Option 1: enforce batch params to be single values (i.e. not objects)
                    // Option 2: allow batch to pass object and map them into correct function parameters
                    function normaliseJimpFunctionParameters(fn, parameters) {
                        const normaliseParams = []
                        let fpLookup = {}
                        let fParam = 0
                        for (let index = 0; index < fn.parameters.length; index++) {
                            let funcParam = fn.parameters[index]
                            if (funcParam.group) {
                                let i = fpLookup[funcParam.group]
                                if (!(typeof i == "number")) {
                                    i = fParam
                                    normaliseParams[i] = {}
                                    fpLookup[funcParam.group] = i
                                    fParam++
                                }
                                let value = parameters[index]
                                if (isDef(value)) {
                                    normaliseParams[i][funcParam.name] = normaliseJimpFunctionParameter(fn, funcParam, value)
                                }
                            } else {
                                let value = parameters[index]
                                if (isDef(value)) {
                                    normaliseParams[fParam++] = normaliseJimpFunctionParameter(fn, funcParam, value)
                                } else {
                                    normaliseParams[fParam++] = undefined
                                }
                            }
                        }
                        return normaliseParams
                    }


                    function doProcess(Jimp, img, job) {
                        let returnValue = {
                            success: false,
                            result: null,
                            image: img,
                            takeImage: false,
                        }
                        if (!job.parameters || !Array.isArray(job.parameters)) {
                            job.parameters = []
                        }

                        let theResult;
                        if (job.name == "grayscale") {
                            job.name = "greyscale"; // Flow Compatibility
                        }
                        if (job.name == "print") {

                            // TODO
                            let textObject
                            const otherStuff = {...job.parameters[0]}
                            if (job.parameters[1] && typeof job.parameters[1] === "object") {
                                textObject = job.parameters[1]
                            } else {
                                textObject = typeof job.parameters[0].text == "object" ? job.parameters[0].text : { text: job.parameters[0].text };
                                delete otherStuff.text
                            }
                            textObject.text = textObject.text.replace(/(?:\\r\\n|\\r|\\n|\r\n|\r|\n)/g, '\n');
                            let lines = textObject.text.split("\n");
                            let thisParams = {...otherStuff, text: textObject};
                            thisParams.x = thisParams.x ?? 0
                            thisParams.y = thisParams.y ?? 0
                            let lineSpacing = 0; //TODO: better way of handling line spacing
                            let nextY = thisParams.y;
                            for (let l = 0; l < lines.length; l++) {
                                const line = lines[l];
                                if (typeof thisParams.text == "object") {
                                    thisParams.text.text = line
                                } else {
                                    thisParams.text = line;
                                }
                                let newY = 0;
                                thisParams.cb = ({x, y}) => {
                                    newY = y;
                                }
                                thisParams.y = nextY;
                                let thisResult = img.print(thisParams);
                                if (thisResult instanceof Error) {
                                    returnValue.result = thisResult;
                                    returnValue.success = false;
                                    throw thisResult;
                                }
                                returnValue.result = thisResult;//save last result TODO: consider better way of handling multiple results for multiple print lines
                                if (l < lines.length) {
                                    nextY = (newY + lineSpacing);
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
                    /**
                     *
                     * @param {import('jimp').Jimp} Jimp
                     * @param {import('jimp').JimpInstance} img
                     * @param {*} jobs
                     * @param {*} node
                     * @param {*} msg
                     * @param {*} performance
                     */
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
                                    // TODO
                                    job.parameters = [convolutionParams];
                                }
                                let perfMeasureName = "process" + (i + 1) + "_" + job.name;
                                jobPerformance.start(perfMeasureName);

                                if (job.name == "quality") {
                                    const buf = await img.getBuffer(img.mime || JimpMime.jpeg, { quality: job.parameters[0] })
                                    img = await Jimp.read(buf)
                                } else if (job.name == "print") {
                                    const printOptions = job.parameters[0]
                                    //this is a print request where the text is an object with alignment
                                    //if either of maxWidth/maxHeight are set to auto (-1) then set them to actual height / width
                                    if (printOptions.maxWidth === -1 || typeof printOptions.maxWidth === "undefined") {
                                        printOptions.maxWidth = img.width
                                    }
                                    if (printOptions.maxHeight === -1 || typeof printOptions.maxHeight === "undefined") {
                                        printOptions.maxHeight = img.height
                                    }
                                    let fontName = printOptions.font;
                                    fontName = (fontName || "FONT_SANS_10_BLACK").toUpperCase();
                                    if (fontName.startsWith("JIMP.FONT_")) {
                                        fontName = fontName.replace("JIMP.", "")
                                    }
                                    let fontFileName = fontName
                                    let internalFontName = fontName
                                    if (JIMP_KNOWN_FONTS.includes(fontName)) {
                                        internalFontName = fontName.replace("FONT_", "")
                                        fontFileName = FONTS[internalFontName]
                                    }
                                    let font = _image_tools_fonts.getFont(fontName)
                                    if (!font?.loaded) {
                                        let fontData = await JIMP.loadFont(fontFileName)
                                        if (!fontData) {
                                            throw new Error(`'Print' error - cannot load font ${fontName}`)
                                        }
                                        _image_tools_fonts.setFont(fontName, fontFileName, fontData)
                                        font = _image_tools_fonts.getFont(fontName)
                                    }

                                    try {
                                        printOptions.font = font.fontData
                                        processResult = doProcess(Jimp, img, job)
                                    } catch (err) {
                                        // debugger
                                        throw err
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
                            MIME: img.mime,
                            quality: img._quality, // TODO: check this is correct
                            width: img.width,
                            height: img.height
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
                                try {
                                    const buffer = await img.getBuffer(img.mime || JimpMime.jpeg)
                                    performance.end("jimp_to_buffer");
                                    performance.end("total");
                                    setObjectProperty(msg, node.sendProperty, buffer);
                                    msg.performance = performance.getPerformance();
                                    node.send(msg);
                                } catch (error) {
                                    error.cause = "Error getting buffer of image"
                                    nodeStatusError(error, msg, error.cause)
                                    return
                                } finally {
                                    performance.end("jimp_to_buffer");
                                    performance.end("total");
                                }
                                break;
                            case "b64":
                                performance.start("jimp_to_base64");
                                try {
                                    const b64 = await img.getBase64(img.mime || JimpMime.jpeg);
                                    performance.end("jimp_to_base64");
                                    performance.end("total");
                                    // msg.payload = b64;
                                    setObjectProperty(msg, node.sendProperty, b64);
                                    msg.performance = performance.getPerformance();
                                    node.send(msg);
                                } catch (error) {
                                    performance.end("jimp_to_base64");
                                    performance.end("total");
                                    nodeStatusError(error, msg, "Error getting base64 image")
                                    return
                                }
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
                    // //hack to support gif. Oddly, Jimp can read a gif but fails if you try to do most operations
                    // if (data instanceof Jimp && data._originalMime == "image/gif") {
                    //     data.getBuffer(Jimp.MIME_PNG, (e, b) => {
                    //         if (e) {
                    //             throw e;
                    //         }
                    //         gif = true;
                    //         data = b;
                    //         isBuffer = true;
                    //     })
                    // }
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
                        isBuffer = true;
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
                        let options = data;
                        if (!isBuffer && !isArray && isObject(data) && ((data.w && data.h) || (data.width && data.height))) {
                            perfName = "jimp_create"
                            options = {
                                width: data.width ?? data.w,
                                height: data.height ?? data.h
                            }
                            if ((data.color || data.color === 0) || (data.background || data.background === 0)) {
                                options.color = data.color ?? data.background
                            }
                        }
                        performance.start(perfName);
                        try {
                            if (isBuffer) {
                                img = await Jimp.fromBuffer(data);
                            } else if (isfileName) {
                                img = await Jimp.read(data);
                            } else {
                                img = new Jimp(options)
                            }
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
