/* CREDIT...
This image viewer node is heavily based on the excellent works by rikukissa and dceejay
* rikukissa (https://github.com/rikukissa) 
* dceejay (https://github.com/dceejay)
* src: https://github.com/rikukissa/node-red-contrib-image-output
MIT License included as per Copyright (c) 2018 Riku Rouvila

MIT License

Copyright (c) 2018 Riku Rouvila

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

		RED.nodes.createNode(this, config);
		var node = this;
		node.data = config.data || "";//data
		node.dataType = config.dataType || "msg";

		node.on("input", function (msg) {
			
			//first clear any error status
			node.status({});
			var nodeStatusError = function (err, msg, statusText) {
				console.error(err);
				node.error(err, msg);
				node.status({ fill: "red", shape: "dot", text: statusText });
			}

			var data;
			try {
				/* ****************  Get Image Data Parameter **************** */
				var dataInput;
				RED.util.evaluateNodeProperty(node.data, node.dataType, node, msg, (err, value) => {
					if (err) {
						nodeStatusError(err, msg, "Error getting Image Data parameter");
						return;//halt flow!
					} else {
						dataInput = value;
					}
				});
				if (!dataInput) {
					nodeStatusError(err, msg, "Error. Check the Image parameter");
				}
				if (typeof dataInput == 'string' && dataInput.substr(0, 30).indexOf('base64') != -1 && dataInput.substr(0, 4).indexOf('data') == 0) {
					//its already base 64
					node.send(msg);//pass it on before displaying
					RED.comms.publish("image", { id: this.id, data: dataInput });
				} else if (dataInput instanceof Jimp) {
					dataInput.getBase64(Jimp.AUTO, (err, b64) => {
						if (err) {
							nodeStatusError(err, msg, "Error getting base64 image")
							return;
						}
						node.send(msg);//pass it on before displaying
						RED.comms.publish("image", { id: this.id, data: b64 });
					});
				} else {
					var imageData;
					if(Buffer.isBuffer(dataInput)){
						//make a copy of the buffer before sending it on
						imageData = new Buffer(dataInput.length);
						dataInput.copy(imageData);
					} else {
						imageData = dataInput;
					}
					
					node.send(msg);//we have a copt of the data - pass ont the msg now

					//now generate an image from the buffer/url/path
					Jimp.read(imageData)
						.then(img => {
							try {
								img.getBase64(Jimp.AUTO, (err, b64) => {
									if (err) {
										nodeStatusError(err, msg, "Error getting base64 image")
										return;
									}
									RED.comms.publish("image", { id: this.id, data: b64 });
								});

							} catch (err) {
								nodeStatusError(err, msg, "Error getting base64 image")
							}
						})
						.catch(err => {
							nodeStatusError(err, msg, "Error reading image")
						});

				}
			}
			catch (e) {
				nodeStatusError(e, msg, "Error reading image")
			}
		});

		node.on("close", function () {
			RED.comms.publish("image", { id: this.id });
			node.status({});
		});
	}
	RED.nodes.registerType("image viewer", imageViewer);
};

