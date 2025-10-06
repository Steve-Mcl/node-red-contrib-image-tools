
(function(exports){

    const symbology = {
        "ean5":{ sym:"ean5",desc:"EAN-5 (5 digit addon)",text:"90200",opts:"includetext guardwhitespace" },
        "ean2":{ sym:"ean2",desc:"EAN-2 (2 digit addon)",text:"05",opts:"includetext guardwhitespace" },
        "ean13":{ sym:"ean13",desc:"EAN-13",text:"2112345678900",opts:"includetext guardwhitespace" },
        "ean8":{ sym:"ean8",desc:"EAN-8",text:"02345673",opts:"includetext guardwhitespace" },
        "upca":{ sym:"upca",desc:"UPC-A",text:"416000336108",opts:"includetext" },
        "upce":{ sym:"upce",desc:"UPC-E",text:"00123457",opts:"includetext" },
        "isbn":{ sym:"isbn",desc:"ISBN",text:"978-1-56581-231-4 90000",opts:"includetext guardwhitespace" },
        "ismn":{ sym:"ismn",desc:"ISMN",text:"979-0-2605-3211-3",opts:"includetext guardwhitespace" },
        "issn":{ sym:"issn",desc:"ISSN",text:"0311-175X 00 17",opts:"includetext guardwhitespace" },
        "code128":{ sym:"code128",desc:"Code 128",text:"Count01234567!",opts:"includetext" },
        "gs1-128":{ sym:"gs1-128",desc:"GS1-128",text:"(01)95012345678903(3103)000123",opts:"includetext" },
        "ean14":{ sym:"ean14",desc:"GS1-14",text:"(01) 0 46 01234 56789 3",opts:"includetext" },
        "sscc18":{ sym:"sscc18",desc:"SSCC-18",text:"(00) 0 0614141 123456789 0",opts:"includetext" },
        "code39":{ sym:"code39",desc:"Code 39",text:"THIS IS CODE 39",opts:"includetext includecheck includecheckintext" },
        "code39ext":{ sym:"code39ext",desc:"Code 39 Extended",text:"Code39 Ext!",opts:"includetext includecheck includecheckintext" },
        "code32":{ sym:"code32",desc:"Italian Pharmacode",text:"01234567",opts:"includetext" },
        "pzn":{ sym:"pzn",desc:"Pharmazentralnummer (PZN)",text:"123456",opts:"includetext" },
        "code93":{ sym:"code93",desc:"Code 93",text:"THIS IS CODE 93",opts:"includetext includecheck" },
        "code93ext":{ sym:"code93ext",desc:"Code 93 Extended",text:"Code93 Ext!",opts:"includetext includecheck" },
        "interleaved2of5":{ sym:"interleaved2of5",desc:"Interleaved 2 of 5 (ITF)",text:"2401234567",opts:"height=12 includecheck includetext includecheckintext" },
        "itf14":{ sym:"itf14",desc:"ITF-14",text:"0 46 01234 56789 3",opts:"includetext" },
        "identcode":{ sym:"identcode",desc:"Deutsche Post Identcode",text:"563102430313",opts:"includetext" },
        "leitcode":{ sym:"leitcode",desc:"Deutsche Post Leitcode",text:"21348075016401",opts:"includetext" },
        "databaromni":{ sym:"databaromni",desc:"GS1 DataBar Omnidirectional",text:"(01)24012345678905",opts:"" },
        "databarstacked":{ sym:"databarstacked",desc:"GS1 DataBar Stacked",text:"(01)24012345678905",opts:"" },
        "databarstackedomni":{ sym:"databarstackedomni",desc:"GS1 DataBar Stacked Omnidirectional",text:"(01)24012345678905",opts:"" },
        "databartruncated":{ sym:"databartruncated",desc:"GS1 DataBar Truncated",text:"(01)24012345678905",opts:"" },
        "databarlimited":{ sym:"databarlimited",desc:"GS1 DataBar Limited",text:"(01)15012345678907",opts:"" },
        "databarexpanded":{ sym:"databarexpanded",desc:"GS1 DataBar Expanded",text:"(01)95012345678903(3103)000123",opts:"" },
        "databarexpandedstacked":{ sym:"databarexpandedstacked",desc:"GS1 DataBar Expanded Stacked",text:"(01)95012345678903(3103)000123",opts:"segments=4" },
        "gs1northamericancoupon":{ sym:"gs1northamericancoupon",desc:"GS1 North American Coupon",text:"(8110)106141416543213500110000310123196000",opts:"includetext segments=8" },
        "pharmacode":{ sym:"pharmacode",desc:"Pharmaceutical Binary Code",text:"117480",opts:"showborder" },
        "pharmacode2":{ sym:"pharmacode2",desc:"Two-track Pharmacode",text:"117480",opts:"includetext showborder" },
        "code2of5":{ sym:"code2of5",desc:"Code 25",text:"01234567",opts:"includetext includecheck includecheckintext" },
        "industrial2of5":{ sym:"industrial2of5",desc:"Industrial 2 of 5",text:"01234567",opts:"includetext includecheck includecheckintext" },
        "iata2of5":{ sym:"iata2of5",desc:"IATA 2 of 5",text:"01234567",opts:"includetext includecheck includecheckintext" },
        "matrix2of5":{ sym:"matrix2of5",desc:"Matrix 2 of 5",text:"01234567",opts:"includetext includecheck includecheckintext" },
        "coop2of5":{ sym:"coop2of5",desc:"COOP 2 of 5",text:"01234567",opts:"includetext includecheck includecheckintext" },
        "datalogic2of5":{ sym:"datalogic2of5",desc:"Datalogic 2 of 5",text:"01234567",opts:"includetext includecheck includecheckintext" },
        "code11":{ sym:"code11",desc:"Code 11",text:"0123456789",opts:"includetext includecheck includecheckintext" },
        "bc412":{ sym:"bc412",desc:"BC412",text:"BC412",opts:"semi includetext includecheckintext" },
        "rationalizedCodabar":{ sym:"rationalizedCodabar",desc:"Codabar",text:"A0123456789B",opts:"includetext includecheck includecheckintext" },
        "onecode":{ sym:"onecode",desc:"USPS Intelligent Mail",text:"0123456709498765432101234567891",opts:"barcolor=FF0000" },
        "postnet":{ sym:"postnet",desc:"USPS POSTNET",text:"01234",opts:"includetext includecheckintext" },
        "planet":{ sym:"planet",desc:"USPS PLANET",text:"01234567890",opts:"includetext includecheckintext" },
        "royalmail":{ sym:"royalmail",desc:"Royal Mail 4 State Customer Code",text:"LE28HS9Z",opts:"includetext barcolor=FF0000" },
        "auspost":{ sym:"auspost",desc:"AusPost 4 State Customer Code",text:"5956439111ABA 9",opts:"includetext custinfoenc=character" },
        "kix":{ sym:"kix",desc:"Royal Dutch TPG Post KIX",text:"1231FZ13XHS",opts:"includetext" },
        "japanpost":{ sym:"japanpost",desc:"Japan Post 4 State Customer Code",text:"6540123789-A-K-Z",opts:"includetext includecheckintext" },
        "msi":{ sym:"msi",desc:"MSI Modified Plessey",text:"0123456789",opts:"includetext includecheck includecheckintext" },
        "plessey":{ sym:"plessey",desc:"Plessey UK",text:"01234ABCD",opts:"includetext includecheckintext" },
        "telepen":{ sym:"telepen",desc:"Telepen",text:"ABCDEF",opts:"includetext" },
        "telepennumeric":{ sym:"telepennumeric",desc:"Telepen Numeric",text:"01234567",opts:"includetext" },
        "posicode":{ sym:"posicode",desc:"PosiCode",text:"ABC123",opts:"version=b inkspread=-0.5 parsefnc includetext" },
        "codablockf":{ sym:"codablockf",desc:"Codablock F",text:"CODABLOCK F 34567890123456789010040digit",opts:"columns=8" },
        "code16k":{ sym:"code16k",desc:"Code 16K",text:"Abcd-1234567890-wxyZ",opts:"" },
        "code49":{ sym:"code49",desc:"Code 49",text:"MULTIPLE ROWS IN CODE 49",opts:"" },
        "channelcode":{ sym:"channelcode",desc:"Channel Code",text:"3493",opts:"height=12 includetext" },
        "flattermarken":{ sym:"flattermarken",desc:"Flattermarken",text:"11099",opts:"inkspread=-0.25 showborder borderleft=0 borderright=0" },
        "raw":{ sym:"raw",desc:"Custom 1D symbology",text:"331132131313411122131311333213114131131221323",opts:"height=12" },
        "daft":{ sym:"daft",desc:"Custom 4 state symbology",text:"FATDAFTDAD",opts:"" },
        "symbol":{ sym:"symbol",desc:"Miscellaneous symbols",text:"fima",opts:"backgroundcolor=DD000011" },
        "pdf417":{ sym:"pdf417",desc:"PDF417",text:"This is PDF417",opts:"columns=2" },
        "pdf417compact":{ sym:"pdf417compact",desc:"Compact PDF417",text:"This is compact PDF417",opts:"columns=2" },
        "micropdf417":{ sym:"micropdf417",desc:"MicroPDF417",text:"MicroPDF417",opts:"" },
        "datamatrix":{ sym:"datamatrix",desc:"Data Matrix",text:"This is Data Matrix!",opts:"" },
        "datamatrixrectangular":{ sym:"datamatrixrectangular",desc:"Data Matrix Rectangular",text:"1234",opts:"" },
        "datamatrixrectangularextension":{ sym:"datamatrixrectangularextension",desc:"Data Matrix Rectangular Extension",text:"1234",opts:"version=8x96" },
        "mailmark":{ sym:"mailmark",desc:"Royal Mail Mailmark",text:"JGB 012100123412345678AB19XY1A 0             www.xyz.com",opts:"type=29" },
        "qrcode":{ sym:"qrcode",desc:"QR Code",text:"http://goo.gl/0bis",opts:"eclevel=M" },
        "microqrcode":{ sym:"microqrcode",desc:"Micro QR Code",text:"1234",opts:"" },
        "rectangularmicroqrcode":{ sym:"rectangularmicroqrcode",desc:"Rectangular Micro QR Code",text:"1234",opts:"version=R17x139" },
        "maxicode":{ sym:"maxicode",desc:"MaxiCode",text:"[)>^03001^02996152382802^029840^029001^0291Z00004951^029UPSN^02906X610^029159^0291234567^0291/1^029^029Y^029634 ALPHA DR^029PITTSBURGH^029PA^029^004",opts:"mode=2 parse" },
        "azteccode":{ sym:"azteccode",desc:"Aztec Code",text:"This is Aztec Code",opts:"format=full" },
        "azteccodecompact":{ sym:"azteccodecompact",desc:"Compact Aztec Code",text:"1234",opts:"" },
        "aztecrune":{ sym:"aztecrune",desc:"Aztec Runes",text:"1",opts:"" },
        "codeone":{ sym:"codeone",desc:"Code One",text:"Code One",opts:"" },
        "hanxin":{ sym:"hanxin",desc:"Han Xin Code",text:"This is Han Xin",opts:"" },
        "dotcode":{ sym:"dotcode",desc:"DotCode",text:"This is DotCode",opts:"inkspread=0.16" },
        "ultracode":{ sym:"ultracode",desc:"Ultracode",text:"Awesome colours!",opts:"eclevel=EC2" },
        "gs1-cc":{ sym:"gs1-cc",desc:"GS1 Composite 2D Component",text:"(01)95012345678903(3103)000123",opts:"ccversion=b cccolumns=4" },
        "ean13composite":{ sym:"ean13composite",desc:"EAN-13 Composite",text:"2112345678900|(99)1234-abcd",opts:"includetext" },
        "ean8composite":{ sym:"ean8composite",desc:"EAN-8 Composite",text:"02345673|(21)A12345678",opts:"includetext" },
        "upcacomposite":{ sym:"upcacomposite",desc:"UPC-A Composite",text:"416000336108|(99)1234-abcd",opts:"includetext" },
        "upcecomposite":{ sym:"upcecomposite",desc:"UPC-E Composite",text:"00123457|(15)021231",opts:"includetext" },
        "databaromnicomposite":{ sym:"databaromnicomposite",desc:"GS1 DataBar Omnidirectional Composite",text:"(01)03612345678904|(11)990102",opts:"" },
        "databarstackedcomposite":{ sym:"databarstackedcomposite",desc:"GS1 DataBar Stacked Composite",text:"(01)03412345678900|(17)010200",opts:"" },
        "databarstackedomnicomposite":{ sym:"databarstackedomnicomposite",desc:"GS1 DataBar Stacked Omnidirectional Composite",text:"(01)03612345678904|(11)990102",opts:"" },
        "databartruncatedcomposite":{ sym:"databartruncatedcomposite",desc:"GS1 DataBar Truncated Composite",text:"(01)03612345678904|(11)990102",opts:"" },
        "databarlimitedcomposite":{ sym:"databarlimitedcomposite",desc:"GS1 DataBar Limited Composite",text:"(01)03512345678907|(21)abcdefghijklmnopqrst",opts:"" },
        "databarexpandedcomposite":{ sym:"databarexpandedcomposite",desc:"GS1 DataBar Expanded Composite",text:"(01)93712345678904(3103)001234|(91)1A2B3C4D5E",opts:"" },
        "databarexpandedstackedcomposite":{ sym:"databarexpandedstackedcomposite",desc:"GS1 DataBar Expanded Stacked Composite",text:"(01)00012345678905(10)ABCDEF|(21)12345678",opts:"segments=4" },
        "gs1-128composite":{ sym:"gs1-128composite",desc:"GS1-128 Composite",text:"(00)030123456789012340|(02)13012345678909(37)24(10)1234567ABCDEFG",opts:"ccversion=c" },
        "gs1datamatrix":{ sym:"gs1datamatrix",desc:"GS1 Data Matrix",text:"(01)03453120000011(17)120508(10)ABCD1234(410)9501101020917",opts:"" },
        "gs1datamatrixrectangular":{ sym:"gs1datamatrixrectangular",desc:"GS1 Data Matrix Rectangular",text:"(01)03453120000011(17)120508(10)ABCD1234(410)9501101020917",opts:"" },
        "gs1qrcode":{ sym:"gs1qrcode",desc:"GS1 QR Code",text:"(01)03453120000011(8200)http://www.abc.net(10)ABCD1234(410)9501101020917",opts:"" },
        "gs1dotcode":{ sym:"gs1dotcode",desc:"GS1 DotCode",text:"(235)5vBZIF%!<B;?oa%(01)01234567890128(8008)19052001",opts:"rows=16" },
        "hibccode39":{ sym:"hibccode39",desc:"HIBC Code 39",text:"A123BJC5D6E71",opts:"includetext" },
        "hibccode128":{ sym:"hibccode128",desc:"HIBC Code 128",text:"A123BJC5D6E71",opts:"includetext" },
        "hibcdatamatrix":{ sym:"hibcdatamatrix",desc:"HIBC Data Matrix",text:"A123BJC5D6E71",opts:"" },
        "hibcdatamatrixrectangular":{ sym:"hibcdatamatrixrectangular",desc:"HIBC Data Matrix Rectangular",text:"A123BJC5D6E71",opts:"" },
        "hibcpdf417":{ sym:"hibcpdf417",desc:"HIBC PDF417",text:"A123BJC5D6E71",opts:"" },
        "hibcmicropdf417":{ sym:"hibcmicropdf417",desc:"HIBC MicroPDF417",text:"A123BJC5D6E71",opts:"" },
        "hibcqrcode":{ sym:"hibcqrcode",desc:"HIBC QR Code",text:"A123BJC5D6E71",opts:"" },
        "hibccodablockf":{ sym:"hibccodablockf",desc:"HIBC Codablock F",text:"A123BJC5D6E71",opts:"" },
        "hibcazteccode":{ sym:"hibcazteccode",desc:"HIBC Aztec Code",text:"A123BJC5D6E71",opts:"" }
    };
    // adapted from https://github.com/metafloor/bwip-js/blob/6dac9f9ec1e24ffadd96f98fac5aa1d8eef2e04e/bin/bwip-js.js#L56
    const optlist = [
        // { name: 'help', type: 'boolean',
        //   desc: 'Displays this help message.' },
        // { name: 'version', type: 'boolean',
        //   desc: 'Displays the bwip-js and BWIPP version strings.' },
        // { name: 'symbols', type: 'boolean',
        //   desc: 'Display a list of the supported barcode types.' },
        // { name: 'loadfont', type: 'string',
        //   desc: 'Loads a truetype/opentype font.  Format of this option is one of:\n\n' +
        //           '  --loadfont=font-name,y-mult,x-mult,path-to-font-file\n' +
        //           '  --loadfont=font-name,size-mult,path-to-font-file\n' +
        //           '  --loadfont=font-name,path-to-font-file\n\n' +
        //         'For example:  --loadfont=Courier,100,120,c:\\windows\\fonts\\cour.ttf' },

        // // bwipjs options
        // { name: 'bcid', type: 'string',
        //   desc: 'Barcode symbol name/type. Required.' },
        // { name: 'text', type: 'string',
        //   desc: 'The text to encode. Required.\n' +
        //         'Use single quotes around the text to protect from the shell.' },
        { name: 'scaleX', type: 'int',
          desc: 'The x-axis scaling factor. Must be an integer > 0. Default is 2.' },
        { name: 'scaleY', type: 'int',
          desc: 'The y-axis scaling factor. Must be an integer > 0. Default is scaleX.' },
        { name: 'scale', type: 'int',
          desc: 'Sets both the x-axis and y-axis scaling factors. Must be an integer > 0.' },
        { name: 'rotate', type: 'string',
          desc: 'Rotates the image to one of the four orthogonal orientations.\n' +
                'A string value. Must be one of:\n' +
                '    N : Normal orientation.\n' +
                '    R : Rotated right 90 degrees.\n' +
                '    L : Rotated left 90 degrees.\n' +
                '    I : Inverted, rotated 180 degrees.' },
        { name: 'padding', type: 'int',
          desc: 'Shorthand for setting paddingtop, paddingleft, paddingright, and paddingbottom.' },
        { name: 'paddingwidth', type: 'int',
          desc: 'Shorthand for setting paddingleft and paddingright.' },
        { name: 'paddingheight', type: 'int',
          desc: 'Shorthand for setting paddingtop and paddingbottom.' },
        { name: 'paddingtop', type: 'int',
          desc: 'Sets the height of the padding area, in points, on the top of\n' +
                'the barcode image. Rotates and scales with the image.' },
        { name: 'paddingleft', type: 'int',
          desc: 'Sets the width of the padding area, in points, on the left side\n' +
                'of the barcode image. Rotates and scales with the image.' },
        { name: 'paddingright', type: 'int',
          desc: 'Sets the width of the padding area, in points, on the right side\n' +
                'of the barcode image. Rotates and scales with the image.' },
        { name: 'paddingbottom', type: 'int',
          desc: 'Sets the height of the padding area, in points, on the bottom of\n' +
                'the barcode image. Rotates and scales with the image.' },
    //	{ name: 'monochrome', type: 'boolean',
    //	  desc: 'Sets the human-readable text to render in monochrome.\n'
    //			'Default is false which renders 256-level gray-scale anti-aliased text.' },

        // bwipp options
        { name: 'alttext', type: 'string',
          desc: 'The human-readable text to use instead of the encoded text.' },
        { name: 'includecheck', type: 'boolean',
          desc: 'Generate check digit(s) for symbologies where the use of check digits is\n' +
                'optional.' },
        { name: 'includecheckintext', type: 'boolean',
          desc: 'Show the calculated check digit in the human readable text.' },
        // { name: 'parse', type: 'boolean',
        //   desc: 'In supporting barcode symbologies, when the parse option is specified,\n' +
        //         'any instances of ^NNN in the data field are replaced with their equivalent\n' +
        //         'ASCII value, useful for specifying unprintable characters.' },
        // { name: 'parsefnc', type: 'boolean',
        //   desc: 'In supporting barcode symbologies, when the parsefnc option is specified,\n' +
        //         'non-data function characters can be specified by escaped combinations such\n' +
        //         'as ^FNC1, ^FNC4 and ^SFT.' },
        { name: 'height', type: 'float',
          desc: 'Height of longest bar, in millimetermillimeters.' },
        { name: 'width', type: 'float',
          desc: 'Stretch the symbol to precisely this width, in millimeters.' },
        { name: 'inkspread', type: 'float',
          desc: 'Amount by which to reduce the bar widths to compensate for inkspread,\n' +
                  'in points.' },
        { name: 'inkspreadh', type: 'float',
          desc: 'For matrix barcodes, the amount by which the reduce the width of dark\n' +
                'modules to compensate for inkspread, in points.\n\n' +
                'Note: inkspreadh is most useful for stacked-linear type barcodes such as\n' +
                'PDF417 and Codablock F.' },
        { name: 'inkspreadv', type: 'float',
          desc: 'For matrix barcodes, the amount by which the reduce the height of dark\n' +
                'modules to compensate for inkspread, in points.' },
        { name: 'dotty', type: 'boolean',
          desc: 'For matrix barcodes, render the modules as dots rather than squares.\n' +
                'The dot radius can be adjusted using the inkspread option.' },
        { name: 'includetext', type: 'boolean',
          desc: 'Show human readable text for data in symbol.' },
        { name: 'textfont', type: 'string',
          desc: 'The font name to use for the text.' },
        { name: 'textsize', type: 'int',
          desc: 'The font size of the text, in points.' },
        { name: 'textgaps', type: 'int',
          desc: 'The inter-character spacing of the text.' },
        { name: 'textxalign', type: 'string',
          desc: 'Specifies where to horizontally position the text.' },
        { name: 'textyalign', type: 'string',
          desc: 'Specifies where to vertically position the text.' },
        { name: 'textxoffset', type: 'int',
          desc: 'The horizontal position of the text, in points, relative to the\n' +
                'default position.' },
        { name: 'textyoffset', type: 'int',
          desc: 'The vertical position of the text, in points, relative to the\n' +
                'default position.' },
        { name: 'showborder', type: 'boolean',
          desc: 'Display a border around the symbol.' },
        { name: 'borderwidth', type: 'int',
          desc: 'Width of a border, in points.' },
        { name: 'borderleft', type: 'int',
          desc: 'Left margin gap of the border, in points.' },
        { name: 'borderright', type: 'int',
          desc: 'Right margin gap of the border, in points.' },
        { name: 'bordertop', type: 'int',
          desc: 'Top margin gap of the border, in points.' },
        { name: 'borderbottom', type: 'int',
          desc: 'Bottom margin gap of the border, in points.' },
        { name: 'barcolor', type: 'string',
          desc: 'Color of the bars, either as a hex RRGGBB value or a hex CCMMYYKK value.' },
        { name: 'backgroundcolor', type: 'string',
          desc: 'Color of a the image background, either as a hex RRGGBB value or a\n' +
                  'hex CCMMYYKK value.  The default is a transparent background.' },
        { name: 'bordercolor', type: 'string',
          desc: 'Color of the border, either as a hex RRGGBB value or a hex CCMMYYKK value.\n' +
                  'You must specify --showborder for this setting to take effect.' },
        { name: 'textcolor', type: 'string',
          desc: 'Color of the text, either as a hex RRGGBB value or a hex CCMMYYKK value.' },
        { name: 'addontextfont', type: 'string',
          desc: 'The font name to use for the add-on text in ISBN, ISMN, and ISSN barcodes.' },
        { name: 'addontextsize', type: 'int',
          desc: 'The font size of the add on text, in points.' },
        { name: 'addontextxoffset', type: 'int',
          desc: 'Overrides the default positioning for the add on text.' },
        { name: 'addontextyoffset', type: 'int',
          desc: 'Overrides the default positioning for the add on text.' },
        { name: 'guardwhitespace', type: 'boolean',
          desc: 'Display white space guards.' },
        { name: 'guardwidth', type: 'int',
          desc: 'Width of white space guards, in points.' },
        { name: 'guardheight', type: 'int',
          desc: 'Height of white space guards, in points.' },
        { name: 'guardleftpos', type: 'int',
          desc: 'Amount of white space to guard to left of the symbol, in points.' },
        { name: 'guardrightpos', type: 'int',
          desc: 'Amount of white space to guard to right of the symbol, in points.' },
        { name: 'guardleftypos', type: 'int',
          desc: 'Vertical position of the guard symbols on the left, in points.' },
        { name: 'guardrightypos', type: 'int',
          desc: 'Vertical position of the guard symbols on the right, in points.' },
    ];
    const optmap = optlist.reduce(function(map, elt) { map[elt.name] = elt; return map; }, {});
    exports.getSymbology = function(){
         return symbology;
    };
    exports.getOptionsList = function(){
         return optlist;
    };
    exports.getOptionsMap = function(){
         return optmap;
    };
    exports.getJimpFunctions = function() {
        return {

          "none" : {"name" : "none","fn" : "none", "description" : "Just loads the image.","parameters" : [] },

          //FUTURE: possible way of simplifying calling any function via msg.payload
          //but how to handle varying amount of variables is problematic
          //For now, user will have to use batch option and send function+parameters via parameter1
          // "custom" : {"name" : "custom","fn" : "", "description" : "Send function name from msg/flow/global. NOTE: Consider using batch mode and sending a batch object via payload (see side panel info for info)","parameters" : [
          // {"name" : "Function", "type" : "str", "required" : true, "hint" : "Name of the Jimp function to execute", "defaultType" : "str" },
          // {"name" : "Parameter1", "type" : "none|str|num|buf|json", "required" : false, "hint" : "Parameter 1", "defaultType" : "none" },
          // {"name" : "Parameter2", "type" : "none|str|num|buf|json", "required" : false, "hint" : "Parameter 2", "defaultType" : "none" },
          // {"name" : "Parameter3", "type" : "none|str|num|buf|json", "required" : false, "hint" : "Parameter 3", "defaultType" : "none" },
          // {"name" : "Parameter4", "type" : "none|str|num|buf|json", "required" : false, "hint" : "Parameter 4", "defaultType" : "none" },
          // {"name" : "Parameter5", "type" : "none|str|num|buf|json", "required" : false, "hint" : "Parameter 5", "defaultType" : "none" },
          // {"name" : "Parameter6", "type" : "none|str|num|buf|json", "required" : false, "hint" : "Parameter 6", "defaultType" : "none" },
          // {"name" : "Parameter7", "type" : "none|str|num|buf|json", "required" : false, "hint" : "Parameter 7", "defaultType" : "none" }] },


          "write" : {"name" : "write","fn" : "write", "description" : "Write to file. NOTE: You can specify an alternative file extension type to change the type. Currently support types are jpg, png, bmp.","parameters" : [
          {"name" : "filename", "type" : "str", "required" : true, "hint" : "Name of the file", "defaultType" : "str" }] },

          // TODO: quality is no longer a function in Jimp 1.x see: https://jimp-dev.github.io/jimp/guides/migrate-to-v1/#encoding-and-decoding-options
          // Internally, I have remapped this to use the quality function in the getBuffer function
          "quality" : {"name" : "quality","fn" : "quality", "description" : "Set the quality of the image. Useful for reducing size of image before calling the write function.","parameters" : [
          {"name" : "quality", "type" : "num", "defaultType": "num", "required" : true, "hint" : "Quality value 1 ~ 100" }] },


          "contain" : {"name" : "contain","fn" : "contain", "description" : "scale the image to the given width and height, some parts of the image may be letter boxed","parameters" : [
          {"name" : "w", "group" : "options", "type" : "num", "defaultType": "num", "required" : true, "hint" : "the width to resize the image to" },
          {"name" : "h", "group" : "options", "type" : "num", "defaultType": "num", "required" : true, "hint" : "the height to resize the image to" },
          {"name" : "alignBits", "group" : "options", "type" : "alignMode", "required" : false, "hint" : "A bitmask for horizontal and vertical alignment. Jimp.HORIZONTAL_ALIGN_LEFT | Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.HORIZONTAL_ALIGN_RIGHT | Jimp.VERTICAL_ALIGN_TOP | Jimp.VERTICAL_ALIGN_MIDDLE | Jimp.VERTICAL_ALIGN_BOTTOM;" },
          {"name" : "mode", "group" : "options", "type" : "resizeMode", "required" : false, "hint" : "A scaling method (e.g. Jimp.RESIZE_BEZIER)" }] },


          "cover" : {"name" : "cover","fn" : "cover", "description" : "scale the image to the given width and height, some parts of the image may be clipped","parameters" : [
          {"name" : "w", "group" : "options", "type" : "num", "defaultType": "num", "required" : true, "hint" : "the width to resize the image to" },
          {"name" : "h", "group" : "options", "type" : "num", "defaultType": "num", "required" : true, "hint" : "the height to resize the image to" },
          {"name" : "alignBits", "group" : "options", "type" : "alignMode|str", "required" : false, "hint" : "A bitmask for horizontal and vertical alignment. Jimp.HORIZONTAL_ALIGN_LEFT | Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.HORIZONTAL_ALIGN_RIGHT | Jimp.VERTICAL_ALIGN_TOP | Jimp.VERTICAL_ALIGN_MIDDLE | Jimp.VERTICAL_ALIGN_BOTTOM;" },
          {"name" : "mode", "group" : "options", "type" : "resizeMode", "required" : false, "hint" : "a scaling method (e.g. Jimp.RESIZE_BEZIER)" }] },


          "resize" : {"name" : "resize","fn" : "resize", "description" : "resize the image. One of the w or h parameters can be set to automatic (\"Jimp.AUTO\" or -1).","parameters" : [
          {"name" : "w", "group" : "options", "type" : "num|auto", "required" : true, "hint" : "the width to resize the image to (or \"Jimp.AUTO\" or -1)" },
          {"name" : "h", "group" : "options", "type" : "num|auto", "required" : true, "hint" : "the height to resize the image to (or \"Jimp.AUTO\" or -1)" },
          {"name" : "mode", "group" : "options", "type" : "resizeMode", "required" : false, "hint" : "a scaling method (e.g. Jimp.RESIZE_BEZIER)" }] },


          "scale" : {"name" : "scale","fn" : "scale", "description" : "scale the image by the factor f","parameters" : [
          {"name" : "f", "group" : "options", "type" : "num", "defaultType": "num", "required" : true, "hint" : "f the factor to scale the image by" },
          {"name" : "mode", "group" : "options", "type" : "resizeMode", "required" : false, "hint" : "a scaling method (e.g. Jimp.RESIZE_BEZIER)" }] },


          "scaleToFit" : {"name" : "scaleToFit","fn" : "scaleToFit", "description" : "scale the image to the largest size that fits inside the given width and height. One of the w or h parameters can be set to automatic (\"Jimp.AUTO\" or -1).","parameters" : [
          {"name" : "w", "group" : "options", "type" : "num|auto", "required" : true, "hint" : "the width to resize the image to (or \"Jimp.AUTO\" or -1)" },
          {"name" : "h", "group" : "options", "type" : "num|auto", "required" : true, "hint" : "the height to resize the image to (or \"Jimp.AUTO\" or -1)" },
          {"name" : "mode", "group" : "options", "type" : "resizeMode", "required" : false, "hint" : "a scaling method (e.g. Jimp.RESIZE_BEZIER)" }] },


          "autocrop1" : {"name" : "autocrop","fn" : "autocrop", "description" : "automatically crop same-color borders from image (if any), frames must be a Boolean","parameters" : [
          {"name" : "tolerance", "type" : "num", "defaultType": "num", "required" : false, "hint" : "a percent value of tolerance for pixels color difference (default: 0.0002%)" }] },


          "autocrop2" : {"name" : "autocrop","fn" : "autocrop", "description" : "automatically crop same-color borders from image (if any), options may contain tolerance, cropOnlyFrames, cropSymmetric, leaveBorder","parameters" : [
          {"name" : "options", "type" : "json", "required" : false, "hint" : "options may contain tolerance, cropOnlyFrames, cropSymmetric, leaveBorder, ignoreSides" }] },



          "crop" : {"name" : "crop","fn" : "crop", "description" : "crop to the given region","parameters" : [
          {"name" : "x", "group" : "options", "type" : "num", "defaultType": "num", "required" : true, "hint" : "the x coordinate to crop form" },
          {"name" : "y", "group" : "options", "type" : "num", "defaultType": "num", "required" : true, "hint" : "the y coordinate to crop form" },
          {"name" : "w", "group" : "options", "type" : "num", "defaultType": "num", "required" : true, "hint" : "the width of the crop region" },
          {"name" : "h", "group" : "options", "type" : "num", "defaultType": "num", "required" : true, "hint" : "the height of the crop region" }] },


          "blit" : {"name" : "blit","fn" : "blit", "description" : "blit the image with another Jimp image at x, y, optionally cropped","parameters" : [
          {"name" : "src", "group" : "options", "type" : "", "required" : true, "hint" : "the source image (a Jimp instance)", "defaultType" : "msg", "defaultValue" : "payload" },
          {"name" : "x", "group" : "options", "type" : "num", "defaultType": "num", "required" : true, "hint" : "the x position to blit the image" },
          {"name" : "y", "group" : "options", "type" : "num", "defaultType": "num", "required" : true, "hint" : "the y position to blit the image" },
          {"name" : "srcX", "group" : "options", "type" : "num", "defaultType": "num", "required" : false, "hint" : "the x position from which to crop the source image" },
          {"name" : "srcY", "group" : "options", "type" : "num", "defaultType": "num", "required" : false, "hint" : "the y position from which to crop the source image" },
          {"name" : "srcW", "group" : "options", "type" : "num", "defaultType": "num", "required" : false, "hint" : "the width to which to crop the source image" },
          {"name" : "srcH", "group" : "options", "type" : "num", "defaultType": "num", "required" : false, "hint" : "the height to which to crop the source image" }] },


          "composite" : {"name" : "composite","fn" : "composite", "description" : "composites another Jimp image over this image at x, y","parameters" : [
          {"name" : "src", "type" : "", "required" : true, "hint" : "the source image (a Jimp instance)", "defaultType" : "msg", "defaultValue" : "payload" },
          {"name" : "x", "type" : "num", "defaultType": "num", "required" : true, "hint" : "the x position to blit the image" },
          {"name" : "y", "type" : "num", "defaultType": "num", "required" : true, "hint" : "the y position to blit the image" },
          {"name" : "mode", "group" : "options", "type" : "blend", "required" : true, "hint" : "what blend mode to use" },
          {"name" : "opacitySource", "group" : "options", "type" : "num", "defaultType": "num", "required" : true, "hint" : "opacity of src image 0.0 to 1.0" },
          {"name" : "opacityDest", "group" : "options", "type" : "num", "defaultType": "num", "required" : true, "hint" : "opacity of src image 0.0 to 1.0" }] },



          "mask" : {"name" : "mask","fn" : "mask", "description" : "masks the image with another Jimp image at x, y using average pixel value","parameters" : [
          {"name" : "src", "group" : "options", "type" : "", "required" : true, "hint" : "the source image (a Jimp instance)", "defaultType" : "msg", "defaultValue" : "payload" },
          {"name" : "x", "group" : "options", "type" : "num", "defaultType": "num", "required" : true, "hint" : "the horizontal position to blit the image" },
          {"name" : "y", "group" : "options", "type" : "num", "defaultType": "num", "required" : true, "hint" : "the vertical position to blit the image" }] },



          "flip" : {"name" : "flip","fn" : "flip", "description" : "flip the image horizontally or vertically","parameters" : [
          {"name" : "horizontal", "group" : "options", "type" : "bool", "required" : true, "hint" : "if true the image will be flipped horizontally" },
          {"name" : "vertical", "group" : "options", "type" : "bool", "required" : true, "hint" : "if true the image will be flipped vertically" }] },

          // Mirror is not a function in Jimp 1.x see: https://jimp-dev.github.io/jimp/guides/migrate-to-v1/#flipping-and-rotating
          // maintained as an alias for flip for backwards compatibility with 2.x of image-tools
          "mirror" : {"name" : "mirror","fn" : "flip", "description" : "DEPRECIATED: This is an alias for flip. Please use flip instead","parameters" : [
          {"name" : "horizontal", "group" : "options", "type" : "bool", "required" : true, "hint" : "if true the image will be flipped horizontally" },
          {"name" : "vertical", "group" : "options", "type" : "bool", "required" : true, "hint" : "if true the image will be flipped vertically" }] },

          "rotate" : {"name" : "rotate","fn" : "rotate", "description" : "rotate the image clockwise by a number of degrees. Optionally, a resize mode can be passed. If `false` is passed as the second parameter, the image width and height will not be resized.","parameters" : [
          {"name" : "deg", "group" : "options", "type" : "num", "defaultType": "num", "required" : true, "hint" : "the number of degrees to rotate the image by" },
          {"name" : "mode", "group" : "options", "type" : "resizeMode|bool", "required" : false, "hint" : "resize mode or a boolean, if false then the width and height of the image will not be changed" }] },

          "brightness" : {"name" : "brightness","fn" : "brightness", "description" : "adjust the brightness", "parameters" : [
          {"name" : "val", "type" : "num", "defaultType": "num", "required" : true, "hint" : "adjust the brightness by a value 0 (fully dark), 0.5 (50%), 1 (100%), 1.5 (150%), etc" }] },


          "contrast" : {"name" : "contrast","fn" : "contrast", "description" : "adjust the contrast", "parameters" : [
          {"name" : "val", "type" : "num", "defaultType": "num", "required" : true, "hint" : "adjust the contrast by a value -1.0 to 1.0" }] },

          "fisheye" : {"name" : "fisheye","fn" : "fisheye", "description" : "apply a fisheye effect to the image","parameters" : [
          {"name" : "radius", "group" : "options", "type" : "num", "defaultType": "num", "required" : false, "hint" : "the pixel radius of the effect" }] },

          "dither" : {"name" : "dither565","fn" : "dither", "description" : "ordered dithering of the image and reduce color space to 16-bits (RGB565)","parameters" : [] },


          "greyscale" : {"name" : "greyscale","fn" : "greyscale", "description" : "remove colour from the image","parameters" : [] },


          "invert" : {"name" : "invert","fn" : "invert", "description" : "invert the image colours","parameters" : [] },


          "normalize" : {"name" : "normalize","fn" : "normalize", "description" : "normalize the channels in an image","parameters" : [] },

          "fade" : {"name" : "fade","fn" : "fade", "description" : "an alternative to opacity, fades the image by a factor 0 - 1. 0 will haven no effect.","parameters" : [
          {"name" : "f", "type" : "num", "defaultType": "num", "required" : true, "hint" : "A number from 0 to 1. 0 will haven no effect. 1 will turn the image completely transparent." }] },


          "opacity" : {"name" : "opacity","fn" : "opacity", "description" : "multiply the alpha channel by each pixel by the factor f, 0 - 1","parameters" : [
          {"name" : "f", "type" : "num", "defaultType": "num", "required" : true, "hint" : "A number, the factor by which to multiply the opacity of each pixel" }] },

          "opaque" : {"name" : "opaque","fn" : "opaque", "description" : "set the alpha channel on every pixel to fully opaque","parameters" : [] },

          "gaussian" : {"name" : "gaussian","fn" : "gaussian", "description" : "Gaussian blur the image by r pixels (VERY slow)","parameters" : [
          {"name" : "r", "type" : "num", "defaultType": "num", "required" : true, "hint" : "the pixel radius of the blur" }] },


          "blur" : {"name" : "blur","fn" : "blur", "description" : "fast blur the image by r pixels","parameters" : [
          {"name" : "r", "type" : "num", "defaultType": "num", "required" : true, "hint" : "the pixel radius of the blur" }] },

          "convolute" : {"name" : "convolute","fn" : "convolute", "description" : "applies a convolution kernel matrix to the image or a region","parameters" : [
          {"name" : "kernel", "type" : "json", "required" : true, "hint" : "a kernel matrix.  e.g. emboss [[-2, -1, 0], [-1, 1, 1], [0, 1, 2]]", "defaultValue" : "[[-2, -1, 0], [-1, 1, 1], [0, 1, 2]]" }] },

          "convolute_antialise" : {"name" : "antialise*","fn" : "convolute_antialise", "description" : "antialise image (*uses convolute([[1, 2, 1], [2, 4, 2], [1, 2, 1]])","parameters" : [] },
          "convolute_edgedetect" : {"name" : "edgedetect*","fn" : "convolute_edgedetect", "description" : "edge detect image (*uses convolute([[0, 1, 0], [1, -4, 1], [0, 1, 0]])","parameters" : [] },
          "convolute_edgeenhance" : {"name" : "edgeenhance*","fn" : "convolute_edgeenhance", "description" : "edge enhance image (*uses convolute([[0, 0, 0], [-1, 1, 0], [0, 0, 0]])","parameters" : [] },
          "convolute_emboss" : {"name" : "emboss*","fn" : "convolute_emboss", "description" : "emboss image (*uses convolute([[-2, -1, 0], [-1, 1, 1], [0, 1, 2]])","parameters" : [] },
          "convolute_sharpen" : {"name" : "sharpen*","fn" : "convolute_sharpen", "description" : "sharpen image (*uses convolute([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])","parameters" : [] },
          "convolute_strongsharpen" : {"name" : "strong sharpen*","fn" : "convolute_strongsharpen","description" : "sharpen image (*uses convolute([[-1, -1, -1], [-1, 9, -1], [-1, -1, -1]])","parameters" : [] },

          "posterize" : {"name" : "posterize","fn" : "posterize", "description" : "apply a posterization effect with n level","parameters" : [
          {"name" : "n", "type" : "num", "defaultType": "num", "required" : true, "hint" : "the amount to adjust the contrast, minimum threshold is two" }] },


          "sepia" : {"name" : "sepia","fn" : "sepia", "description" : "apply a sepia wash to the image","parameters" : [] },


          "pixelate" : {"name" : "pixelate","fn" : "pixelate", "description" : "apply a pixelation effect to the image or a region","parameters" : [
          {"name" : "size", "group" : "options", "type" : "num", "defaultType": "num", "required" : true, "hint" : "the size of the pixels" },
          {"name" : "x", "group" : "options", "type" : "num", "defaultType": "num", "required" : false, "hint" : "the x position of the region to pixelate" },
          {"name" : "y", "group" : "options", "type" : "num", "defaultType": "num", "required" : false, "hint" : "the y position of the region to pixelate" },
          {"name" : "w", "group" : "options", "type" : "num", "defaultType": "num", "required" : false, "hint" : "the width of the region to pixelate" },
          {"name" : "h", "group" : "options", "type" : "num", "defaultType": "num", "required" : false, "hint" : "the height of the region to pixelate" }] },


          "displace" : {"name" : "displace","fn" : "displace", "description" : "displaces the image pixels based on the provided displacement map. Useful for making stereoscopic 3D images.","parameters" : [
          {"name" : "map", "group" : "options", "type" : "", "required" : true, "hint" : "the source image (a Jimp instance)", "defaultValue" : "payload" },
          {"name" : "offset", "group" : "options", "type" : "num", "defaultType": "num", "required" : false, "hint" : "the maximum displacement value" }] },

            // TODO: background is not a function in Jimp 1.x see: https://jimp-dev.github.io/jimp/guides/migrate-to-v1
        //   "background" : {"name" : "background","fn" : "background", "description" : "set the default new pixel colour (e.g. 0xFFFFFFFF or 0x00000000) useful for by some operations e.g. contain or rotate","parameters" : [
        //   {"name" : "hex", "type" : "num", "required" : true, "hint" : "hexadecimal rgba value (must be entered as a decimal e.g. 0xFFFFFFFF = 4294967295)", "defaultValue" : "4294967295" }] },

          "threshold" : {"name" : "threshold","fn" : "threshold", "description" : "apply one or more functions","parameters" : [
          {"name" : "max", "group" : "options", "type" : "num", "defaultType": "num", "required" : true, "hint" : "max value of byte 0 ~ 255" },
          {"name" : "replace", "group" : "options", "type" : "num", "defaultType": "num", "required" : false, "hint" : "replace with byte 0 ~ 255. Default is 255" },
          {"name" : "autoGreyscale", "group" : "options", "type" : "bool", "required" : false, "hint" : "default is true" }] },

          "batch" : {"name" : "batch","fn" : "batch", "description" : "apply one or more functions","parameters" : [
          {"name" : "options", "type" : "json", "required" : true, "hint" : "an object or an array of objects containing {\"name\" : \"function_name\", \"parameters\" : [x,y,z]}.  Refer to info on side panel}" }] },

          "clone" : {"name" : "clone","fn" : "clone", "description" : "returns a clone of the image","parameters" : [] },

  //not ready        "histogram" : {"name" : "histogram","fn" : "histogram", "description" : "Generate a histogram of the image. The histogram data will be returned in msg.jobs[x].result, msg.jobs[x].g[], msg.jobs[x].b[].","parameters" : [] },

          "distance" : {"name" : "distance","fn" : "distance", "description" : "calculate the hamming distance between two Jimp images based on their perceptual hash. msg.jobs[x].result will contain a number 0-1, where 0 means the two images are perceived to be identical","parameters" : [
          {"name" : "image2", "type" : "", "required" : true, "hint" : "image to compare to" }] },

          "diff" : {"name" : "diff","fn" : "diff", "description" : "Using a mix of hamming distance and pixel diffing to compare images. Returns an image showing differences and msg.jobs[x].result will contain the proportion of different pixels (0-1), where 0 means the images are pixel identical","parameters" : [
          {"name" : "image2", "type" : "", "required" : true, "hint" : "image to compare to" },
          {"name" : "threshold", "type" : "num", "defaultType": "num", "required" : false, "hint" : "threshold ranges 0-1 (default: 0.1)" }] },

          "print" : {"name" : "print","fn" : "print", "description" : "Print text to the image","parameters" : [
          {"name" : "font", "group": "options", "type" : "jimpFont|str", "required" : true, "hint" : "font to print. NOTE: This can be one of the presets or the path to a fnt file" },
          {"name" : "x", "group": "options", "type" : "num", "defaultType": "num", "required" : true, "hint" : "x coordinate to print text" },
          {"name" : "y", "group": "options", "type" : "num", "defaultType": "num", "required" : true, "hint" : "y coordinate to print text" },
          {"name" : "text", "group": "options", "type" : "str", "required" : true, "hint" : "text to print" },
          {"name" : "maxWidth", "group": "options", "type" : "num", "defaultType": "num", "required" : false, "hint" : "wrap text at maxWidth" },
          {"name" : "maxHeight", "group": "options", "type" : "num", "defaultType": "num", "required" : false, "hint" : "max height" }] },

          "print2" : {"name" : "print aligned","fn" : "print", "description" : "Print text to the image","parameters" : [
          {"name" : "font", "group": "options", "type" : "jimpFont|str", "required" : true, "hint" : "font to print. NOTE: This can be one of the presets or the path to a fnt file" },
          {"name" : "x", "group": "options", "type" : "num", "defaultType": "num", "required" : true, "hint" : "x coordinate to print text" },
          {"name" : "y", "group": "options", "type" : "num", "defaultType": "num", "required" : true, "hint" : "y coordinate to print text" },
          {"name" : "text", "group" : "options.text", "type" : "str", "required" : true, "hint" : "text to print" },
          {"name" : "alignmentX", "group" : "options.text", "type" : "AlignX", "required" : false, "hint" : "X Alignment" },
          {"name" : "alignmentY", "group" : "options.text", "type" : "AlignY", "required" : false, "hint" : "Y Alignment" },
          {"name" : "maxWidth", "group": "options", "type" : "auto|num", "required" : false, "hint" : "wrap text at maxWidth" },
          {"name" : "maxHeight", "group": "options", "type" : "auto|num", "required" : false, "hint" : "max height" }] }

        }
    }

    exports.JIMP_FONTS = [
        'FONT_SANS_8_BLACK',
        'FONT_SANS_10_BLACK',
        'FONT_SANS_12_BLACK',
        'FONT_SANS_14_BLACK',
        'FONT_SANS_16_BLACK',
        'FONT_SANS_32_BLACK',
        'FONT_SANS_64_BLACK',
        'FONT_SANS_128_BLACK',
        'FONT_SANS_8_WHITE',
        'FONT_SANS_16_WHITE',
        'FONT_SANS_32_WHITE',
        'FONT_SANS_64_WHITE',
        'FONT_SANS_128_WHITE'
    ]

    exports.JIMP_BLEND_MODES = [
      "BLEND_SOURCE_OVER",
      "BLEND_DESTINATION_OVER",
      "BLEND_MULTIPLY",
      "BLEND_SCREEN",
      "BLEND_OVERLAY",
      "BLEND_DARKEN",
      "BLEND_LIGHTEN",
      "BLEND_HARDLIGHT",
      "BLEND_DIFFERENCE",
      "BLEND_EXCLUSION",
  ];

  exports.JIMP_BLEND_MODES_V1 = {
      "BLEND_SOURCE_OVER": "SRC_OVER",
      "BLEND_DESTINATION_OVER":"DST_OVER",
      "BLEND_MULTIPLY": "MULTIPLY",
      "BLEND_SCREEN": "SCREEN",
      "BLEND_OVERLAY": "OVERLAY",
      "BLEND_DARKEN": "DARKEN",
      "BLEND_LIGHTEN": "LIGHTEN",
      "BLEND_HARDLIGHT": "HARD_LIGHT",
      "BLEND_DIFFERENCE": "DIFFERENCE",
      "BLEND_EXCLUSION": "EXCLUSION",
  };

}(typeof exports === 'undefined' ? this.image_tools = {} : exports));


