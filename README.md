
node-red-contrib-image-tools
============================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to perform functions on images, generate and decode barcodes.

## Screenshots - to whet the appetite


### Image processing...
![Image_processing](https://user-images.githubusercontent.com/44235289/59148882-30857400-8a06-11e9-9b7a-227e761bd617.png)

### Get image from internet...
![kittens](https://user-images.githubusercontent.com/44235289/79025855-dea9ff00-7b7e-11ea-98de-2297d879962d.png)

### Printing text...
![printing_text](https://user-images.githubusercontent.com/44235289/59148604-fcf51a80-8a02-11e9-9a6b-f1578d6ee391.gif)
![printing_text](https://user-images.githubusercontent.com/44235289/81293532-66433a80-9065-11ea-88e5-3a3893574255.png)

### Barcode decoding...
![barcode-decoding](https://user-images.githubusercontent.com/44235289/122010221-cd780600-cdb2-11eb-9ced-b61699808d5c.gif)

### Barcode generating...
![barcode-generating](https://user-images.githubusercontent.com/44235289/122010342-f13b4c00-cdb2-11eb-8358-82bc79dce4e8.gif)



## FEATURES

* Built in demos.  
  * **In Node-RED, look under the hamburger menu → import → examples → node-red-contrib-image-tools**

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

* Barcode Generator node
  * Ability to create over 100 types of barcodes...
    * auspost • AusPost 4 State Customer Code
    * azteccode • Aztec Code
    * azteccodecompact • Compact Aztec Code
    * aztecrune • Aztec Runes
    * bc412 • BC412
    * channelcode • Channel Code
    * codablockf • Codablock F
    * code11 • Code 11
    * code128 • Code 128
    * code16k • Code 16K
    * code2of5 • Code 25
    * code32 • Italian Pharmacode
    * code39 • Code 39
    * code39ext • Code 39 Extended
    * code49 • Code 49
    * code93 • Code 93
    * code93ext • Code 93 Extended
    * codeone • Code One
    * coop2of5 • COOP 2 of 5
    * daft • Custom 4 state symbology
    * databarexpanded • GS1 DataBar Expanded
    * databarexpandedcomposite • GS1 DataBar Expanded Composite
    * databarexpandedstacked • GS1 DataBar Expanded Stacked
    * databarexpandedstackedcomposite • GS1 DataBar Expanded Stacked Composite
    * databarlimited • GS1 DataBar Limited
    * databarlimitedcomposite • GS1 DataBar Limited Composite
    * databaromni • GS1 DataBar Omnidirectional
    * databaromnicomposite • GS1 DataBar Omnidirectional Composite
    * databarstacked • GS1 DataBar Stacked
    * databarstackedcomposite • GS1 DataBar Stacked Composite
    * databarstackedomni • GS1 DataBar Stacked Omnidirectional
    * databarstackedomnicomposite • GS1 DataBar Stacked Omnidirectional Composite
    * databartruncated • GS1 DataBar Truncated
    * databartruncatedcomposite • GS1 DataBar Truncated Composite
    * datalogic2of5 • Datalogic 2 of 5
    * datamatrix • Data Matrix
    * datamatrixrectangular • Data Matrix Rectangular
    * datamatrixrectangularextension • Data Matrix Rectangular Extension
    * dotcode • DotCode
    * ean13 • EAN-13
    * ean13composite • EAN-13 Composite
    * ean14 • GS1-14
    * ean2 • EAN-2 (2 digit addon)
    * ean5 • EAN-5 (5 digit addon)
    * ean8 • EAN-8
    * ean8composite • EAN-8 Composite
    * flattermarken • Flattermarken
    * gs1-128 • GS1-128
    * gs1-128composite • GS1-128 Composite
    * gs1-cc • GS1 Composite 2D Component
    * gs1datamatrix • GS1 Data Matrix
    * gs1datamatrixrectangular • GS1 Data Matrix Rectangular
    * gs1dotcode • GS1 DotCode
    * gs1northamericancoupon • GS1 North American Coupon
    * gs1qrcode • GS1 QR Code
    * hanxin • Han Xin Code
    * hibcazteccode • HIBC Aztec Code
    * hibccodablockf • HIBC Codablock F
    * hibccode128 • HIBC Code 128
    * hibccode39 • HIBC Code 39
    * hibcdatamatrix • HIBC Data Matrix
    * hibcdatamatrixrectangular • HIBC Data Matrix Rectangular
    * hibcmicropdf417 • HIBC MicroPDF417
    * hibcpdf417 • HIBC PDF417
    * hibcqrcode • HIBC QR Code
    * iata2of5 • IATA 2 of 5
    * identcode • Deutsche Post Identcode
    * industrial2of5 • Industrial 2 of 5
    * interleaved2of5 • Interleaved 2 of 5 (ITF)
    * isbn • ISBN
    * ismn • ISMN
    * issn • ISSN
    * itf14 • ITF-14
    * japanpost • Japan Post 4 State Customer Code
    * kix • Royal Dutch TPG Post KIX
    * leitcode • Deutsche Post Leitcode
    * mailmark • Royal Mail Mailmark
    * matrix2of5 • Matrix 2 of 5
    * maxicode • MaxiCode
    * micropdf417 • MicroPDF417
    * microqrcode • Micro QR Code
    * msi • MSI Modified Plessey
    * onecode • USPS Intelligent Mail
    * pdf417 • PDF417
    * pdf417compact • Compact PDF417
    * pharmacode • Pharmaceutical Binary Code
    * pharmacode2 • Two-track Pharmacode
    * planet • USPS PLANET
    * plessey • Plessey UK
    * posicode • PosiCode
    * postnet • USPS POSTNET
    * pzn • Pharmazentralnummer (PZN)
    * qrcode • QR Code
    * rationalizedCodabar • Codabar
    * raw • Custom 1D symbology
    * rectangularmicroqrcode • Rectangular Micro QR Code
    * royalmail • Royal Mail 4 State Customer Code
    * sscc18 • SSCC-18
    * symbol • Miscellaneous symbols
    * telepen • Telepen
    * telepennumeric • Telepen Numeric
    * ultracode • Ultracode
    * upca • UPC-A
    * upcacomposite • UPC-A Composite
    * upce • UPC-E
    * upcecomposite • UPC-E Composite




## IMPORTANT - Breaking changes in V1

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

## Pre-requisites

None!


## Install

### Simple
The easiest wat to install is to use the Pallet Manager in node-red. 


### Install from GIT
Run the following command in the directory of your Node-RED install.
(Usually this is `~/.node-red` or `%userprofile%\.node-red`).

    npm install Steve-Mcl/node-red-contrib-image-tools


### Install from NPM 
Run the following command in the directory of your Node-RED install.
(Usually this is `~/.node-red` or `%userprofile%\.node-red`).

    npm install node-red-contrib-image-tools 


### Install from local directory
Run the following command in the root directory of your Node-RED install.
(Usually this is `~/.node-red` or `%userprofile%\.node-red`).

    npm install c:/tempfolder/node-red-contrib-image-tools


## NOTES
* Tested on Node V10, V12, V14 only. YMMV
* Bugs are quite possible :)


