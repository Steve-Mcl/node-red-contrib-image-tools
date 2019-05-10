node-red-contrib-image-tools
============================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to perform functions on images and decode 2D barcodes.

FEATURES
--------
* image viewer node
    * View images in the node-red editor (for preview / debug purposes)
    * **Full credit** to [rikukissa](https://github.com/rikukissa) and [dceejay](https://github.com/dceejay) for the excellent [node-red-contrib-image-output](https://github.com/rikukissa/node-red-contrib-image-output) on which this is heavily based. (Copy of MIT license included in src files as requested)
    * Features include ability to send jimp image, buffer, base64 string, file name, 
    * Works in Internet Explorer (IE11 tested)

<br>
* image node
    * Read image from file, http, base64 string or buffer
    * Create blank image by setting Image field to an object `{"w":100,"h":100,"background":0}`
    * Over 40 image function built in with many more possible by using [convolution kernels](https://en.wikipedia.org/wiki/Kernel_(image_processing))
    * Perform 1 or more images processes in each node
      * TIP: you can convert a function to batch JSON my clicking the button adjacent to the function dropdown field
    * All function parameters can be either fixed or passed in my msg/flow/global
    * Can output image data as a buffer or base64 string.
    * All functions and parameters are self doumenting - a tip under each item in the node editor helps the user

<br>
* 2D Barcode Decode node
    * Ability to decode QR and Data Matrix barcodes

<br>
* Other...
    * Built in samples.  In node-red, look under the hamburger menu >> import >> examples >> image tools

Pre-requesites
--------------

None! 


Install
-------

Run the following command in the root directory of your Node-RED install.
Usually this is `~/.node-red` or `%userprofile%\.node-red`.

    npm install node-red-contrib-image-tools 

Alternatively, install from a folder

    npm install c:/tempfolder/node-red-contrib-image-tools


NOTES
-----
* Tested on Node V 10 only. YMMV
* Bugs are likely :)


TODO
----
* Add functions to permit writing text on to an image
* Add functions to get and set pixels

