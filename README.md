node-red-contrib-image-tools
============================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to perform functions on images and decode barcodes.


Screenshots - to whet the appetite
----------------------------------

Image processing...<br>
![Image_processing](https://user-images.githubusercontent.com/44235289/59148882-30857400-8a06-11e9-9b7a-227e761bd617.png)

Get image from internet...<br>
![kittens](https://user-images.githubusercontent.com/44235289/79025855-dea9ff00-7b7e-11ea-98de-2297d879962d.png)

Printing text...<br>
![printing_text](https://user-images.githubusercontent.com/44235289/59148604-fcf51a80-8a02-11e9-9a6b-f1578d6ee391.gif)
![printing_text](https://user-images.githubusercontent.com/44235289/81293532-66433a80-9065-11ea-88e5-3a3893574255.png)

Barcode decoding...<br>
![barcode](https://user-images.githubusercontent.com/44235289/79025486-d43b3580-7b7d-11ea-8f42-b7ad6471d00c.gif)

FEATURES
--------

* Image node
  * Read image from file, http, base64 string or buffer
  * Print single or multi line text to an image
  * Over 40 image function built in with many more possible by using [convolution kernels](https://en.wikipedia.org/wiki/Kernel_(image_processing))
  * Perform 1 or multiple (batch) images processes in each node
    * TIP: you can convert a function to batch JSON by clicking the button adjacent to the function dropdown field. Then simply edit the batch JSON into an array `[{...},{...},{...}]` to perform as many operations as needed in one go.
  * Create blank image by setting Image field to an object `{"w":100,"h":100,"background":0}`
  * All function parameters can be either fixed or passed in by msg/flow/global
  * Can output image data as a Jimp image, a buffer or base64 string.
  * All functions and parameters are self documenting - a tip under each item in the node editor helps the user
  * Partial (non animated) GIF loading & processing support (experimental)

* Image viewer node
  * View images in the node-red editor (for preview / debug purposes)
  * **Full credit** to [rikukissa](https://github.com/rikukissa) and [dceejay](https://github.com/dceejay) for the excellent [node-red-contrib-image-output](https://github.com/rikukissa/node-red-contrib-image-output) on which the "image viewer node" is heavily based. (Copy of MIT license included in src files as requested)
  * Features include ability to display a jimp image, buffer, file name, base64 string, Data URL, Image URL.
  * Works in Internet Explorer (IE11 tested)

* Barcode Decode node
  * Ability to decode 1D, QR and Data Matrix barcodes. See [supported formats](https://www.npmjs.com/package/@zxing/library#supported-formats).


* Other...
  * Built in examples.  
    * **In node-red, look under the hamburger menu >> import >> examples >> image tools**


IMPORTANT - Breaking changes in V1
---------
Version 1 has breaking change ~ vs ~ V0.x versions.
Existing flows using the "2D Barcode Decode" node will need to be modified. The easy way of fixing this is to delete any "2D Barcode Decode" & deploy, then update the node, then re-add the new "Barcode Decode" nodes.

Alternatively, you can avoid this issue by performing the following steps...

1. Upgrade node-red-contrib-image-tools
1. Stop node-red
1. Make a backup of your flow.json file
1. Opening your flow.json file in a text editor 
1. Search / replace all instances of `"type":"2D Barcode Decoder"` with `"type":"Barcode Decoder"`
1. Save and close your flow file
1. Start node-red

Pre-requisites
--------------

None!


Install
-------

Run the following command in the root directory of your Node-RED install.
(Usually this is `~/.node-red` or `%userprofile%\.node-red`).

Install from GIT

    npm install Steve-Mcl/node-red-contrib-image-tools

Install from NPM 

    npm install node-red-contrib-image-tools 

Alternatively, install from a folder

    npm install c:/tempfolder/node-red-contrib-image-tools

Or simply copy the folder `node-red-contrib-image-tools` into a folder named `nodes` inside your node-red folder then `cd` into `nodes/node-red-contrib-image-tools` and execute `npm install`

NOTES
-----
* Tested on Node V10 & V12 only. YMMV
* Bugs are likely :)

KNOWN ISSUES
------------
Clicking the preview image in IE doesn't dismiss it (works in chrome)

