node-red-contrib-image-tools
============================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to perform functions on images and decode 2D barcodes.

FEATURES
--------
* Read image from file, http, base64 string or buffer
* Create blank image by setting Image field to an object `{"w":100,"h":100,"background":0}`
* Over 40 image function built in with many more possible by using [convolution kernels](https://en.wikipedia.org/wiki/Kernel_(image_processing))
* Perform 1 or more images processes in each node
  * TIP: you can convert a function to batch JSON my clicking the button adjacent to the function dropdown field
* All function parameters can be either fixed or passed in my msg/flow/global
* Can output image data as a buffer or base64 string.
* All functions and parameters are self doumenting - a tip under each item in the node editor helps the user
* Built in samples.  In node-red, look under the hamburger menu >> import >> examples >> image tools


Pre-requesites
--------------

None! However some of the examples make use of [node-red-contrib-image-output](https://www.npmjs.com/package/node-red-contrib-image-output) for visualising operations directly in the flow.


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
* Image Node doesn't show in IE11 (working on it)
* Bugs are likely :)


TODO
----
* Add functions to permit writing text on to an image
* Add functions to get and set pixels

