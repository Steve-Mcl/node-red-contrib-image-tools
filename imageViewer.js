/* CREDIT...
This image viewer node is heavily based on the excellent works by rikukissa and dceejay
* rikukissa (https://github.com/rikukissa) 
* dceejay (https://github.com/dceejay)
* src: https://github.com/rikukissa/node-red-contrib-image-output
MIT License included as per Copyright (c) 2018 Riku Rouvila

MIT License

Copyright (c) 2018 Riku Rouvila, 2021 Steve-Mcl

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE. 
*/

module.exports = function (RED) {
    function imageViewer(config) {
        var Jimp = require('jimp');
        const isBase64 = require('is-base64');
        const _prefixURIMap = {
            "iVBOR": "data:image/png;base64,",
            "R0lGO": "data:image/gif;base64,",
            "/9j/4": "data:image/jpeg;base64,",
            "Qk02U": "data:image/bmp;base64,"
        }
        const createDataURI = function (rawImage) {
            let first5 = rawImage.substr(0, 5)
            if (_prefixURIMap[first5]) {
                return _prefixURIMap[first5] + rawImage;
            }
            return _prefixURIMap["iVBOR"] + rawImage;//default to png
        }
        RED.nodes.createNode(this, config);
        var node = this;
        node.data = config.data || "";//data
        node.dataType = config.dataType || "msg";
        this.active = config.active;

        node.on("input", async function (msg) {

            //first clear any error status
            node.status({});

            if (this.active !== true) {
                node.send(msg);//pass it on & return
                return;
            }

            var nodeStatusError = function (err, msg, statusText) {
                console.error(err);
                node.error(err, msg);
                node.status({ fill: "red", shape: "dot", text: statusText });
            }

            try {
                /* ****************  Get Image Data Parameter **************** */
                let payload;
                RED.util.evaluateNodeProperty(node.data, node.dataType, node, msg, (err, value) => {
                    if (err) {
                        nodeStatusError(err, msg, "Error getting Image Data parameter");
                        return;//halt flow!
                    } else {
                        payload = value;
                    }
                });
                if (!payload) {
                    nodeStatusError("payload is empty (Image parameter)", msg, "Error. Image is null");
                    return null;
                }

                let isString = typeof payload === 'string';
                let hasMime = false, isBase64Image = false;
                let gif = false;
                if (isString) {
                    hasMime = payload.startsWith("data:");
                    isBase64Image = isBase64(payload, { mimeRequired: hasMime });
                    if (isBase64Image && !hasMime) {
                        payload = createDataURI(payload);
                        hasMime = true;
                    }
                }
                let isfileName = isString && !isBase64Image;
                //hack to support gif. Oddly, Jimp can read a gif but fails if you try to do most operations
                if (payload instanceof Jimp.Jimp && payload._originalMime == "image/gif") {
                    try {
                        payload = await payload.getBuffer(Jimp.JimpMime.gif)
                        gif = true;
                    } catch (error) {
                        nodeStatusError(e, msg, "Error getting image buffer")
                    }
                }
                if (isString && isBase64Image && hasMime) {
                    //its already base 64 with mime
                    node.send(msg);//pass it on before displaying
                    RED.comms.publish("image-tools-image-viewer", { id: this.id, data: payload });
                } else if (payload instanceof Jimp.Jimp && !gif) {
                    try {
                        payload = await payload.getBase64(payload._originalMime || payload.mime || Jimp.JimpMime.png)
                        node.send(msg);//pass it on before displaying
                        RED.comms.publish("image-tools-image-viewer", { id: this.id, data: payload })
                    } catch (err) {
                        nodeStatusError(err, msg, "Error getting base64 image")
                    }
                } else {
                    var imageData;
                    if (isString && isBase64Image && !hasMime) {
                        imageData = Buffer.from(payload, 'base64')
                    } else if (Buffer.isBuffer(payload)) {
                        //make a copy of the buffer before sending it on
                        imageData = new Buffer.alloc(payload.length)
                        payload.copy(imageData)
                    } else {
                        imageData = payload
                    }

                    node.send(msg) //we have a copy of the data - pass ont the msg now

                    //now generate an image from the buffer/url/path
                    Jimp.Jimp.read(imageData)
                        .then(img => {
                            console.log("image loaded", img.mime)
                            return img.getBase64(img.mime || Jimp.JimpMime.png)
                        }).then(data => {
                            RED.comms.publish("image-tools-image-viewer", { id: this.id, data })
                        }).catch(err => {
                            nodeStatusError(err, msg, "Error reading image")
                        })
                }
            }
            catch (e) {
                nodeStatusError(e, msg, "Error reading image")
            }
        });

        node.on("close", function () {
            RED.comms.publish("image-tools-image-viewer", { id: this.id });
            node.status({});
        });
    }
    RED.nodes.registerType("image viewer", imageViewer);
    RED.httpAdmin.post("/image-viewer/:id/:state", RED.auth.needsPermission("image-viewer.write"), function (req, res) {
        var state = req.params.state;
        var node = RED.nodes.getNode(req.params.id);

        if (node === null || typeof node === "undefined") {
            res.sendStatus(404);
            return;
        }

        if (state === "enable") {
            node.active = true;
            res.send('activated');
        }
        else if (state === "disable") {
            node.active = false;
            res.send('deactivated');
        }
        else {
            res.sendStatus(404);
        }
    });
};

