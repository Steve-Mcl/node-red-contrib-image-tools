# Changelog

## [3.0.0](https://github.com/Steve-Mcl/node-red-contrib-image-tools/compare/v2.1.1...v3.0.0) (2026-11-23)

Image processing now uses Jimp 1.x (Jimp 0.x before). Flows saved with 2.x keep working, see the upgrade notes below.


### ⚠ BREAKING CHANGES

* Requires Node.js 18 or later (was 14) and Node-RED 3 or later (was 1), because of Jimp 1.x
* Jimp 1.x is a different library underneath, so a few functions can produce slightly different pixels than before. See the upgrade notes


### Features

* **WebP support** ([#53](https://github.com/Steve-Mcl/node-red-contrib-image-tools/issues/53)): WebP images are read and written, and the format of the input is kept. The barcode decoder and the image viewer handle WebP too
* **convert format** function to change the format an image is output in (png, jpeg, bmp, tiff or webp). Use **quality** after it for the lossy formats
* A blank image (`{"w":100,"h":100,"background":0}`) takes an optional `"format"` (or `"mime"`) to be a format other than PNG
* **Image viewer** can be reset ([#57](https://github.com/Steve-Mcl/node-red-contrib-image-tools/issues/57)): an undefined, null or empty payload, or `msg.reset` set to `true`, removes the image
* **Barcode decoder** can choose the text encoding (ascii, UTF-8, ISO-8859-15, Shift_JIS, etc), and barcode generation is updated to bwip-js 4.11
* New functions: **fisheye**, and a **brightness** that multiplies each colour (see the upgrade notes)


### Documentation

* Tips for working with large images (README and node help): keep the flow in a single line and avoid branching ([#55](https://github.com/Steve-Mcl/node-red-contrib-image-tools/issues/55))
* New help panel for the image viewer


### Upgrade notes

* **brightness**: Jimp 1.x changed the scale, so the existing function is kept on the old scale (-1 to +1, 0 is no change) and is now labelled **brightness (legacy)**. Saved flows give the same result as before. The new **brightness** entry uses the Jimp 1.x scale (a multiplier: 0 is black, 1 is no change)
* **dither565** is now called **dither (RGB565)**. Flows and batch jobs that use either name still work
* **background** still works. Jimp 1.x removed it, so the node provides it
* **autocrop** keeps its options, the second one is now called `cropOnlyFrames`
* Numbers entered as text are accepted for number parameters (Jimp 0.x rejected them), and an image created from a colour can differ by one in a colour channel
