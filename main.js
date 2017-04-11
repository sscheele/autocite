var parse5 = require('parse5');
var request = require('request');
var fs = require('fs');
var getWordInfo = require('./preprocess.js');
var config = require('./config.js');
var nnlib = require('./nn.js');


function writeConfig() {
    fs.writeFile('config.json', JSON.stringify(config));
}

(function () {
    if (process.argv.length <= 2) {
        console.log("Required argument: a file with a list of urls");
        return;
    }

    var lines = fs.readFileSync(process.argv[2]).toString().split("\n");
    //fight me
    var urlRegex = /^(https?:\/\/)?([a-zA-Z0-9]+\.)?[a-zA-Z0-9]+\.[a-zA-Z0-9]{1,7}(\/.+)*\/?$/;

    for (var i = 0; i < lines.length; i++) {
        if (!urlRegex.test(lines[i])) {
            console.log(lines[i], ' is not a valid URL');
            continue;
        }
        var url = lines[i];
        request(lines[i], function (error, response, body) {
            console.log(url + ':');
            if (error) {
                console.log('error:', error); // Print the error if one occurred
                return;
            }
            var doc = parse5.parse(body); // Parse the HTML
            var wordInfo = getWordInfo(doc);
            var nns = nnlib.genAllNNs();
            var inputNode = nnlib.genInputNodes([wordInfo[0]]);

            console.log(JSON.stringify(wordInfo, null, 2));
            //console.log(JSON.stringify(nns));
            //console.log(JSON.stringify(inputNode, null, 2));
            //TODO: When parsing for title, it should take up an entire tag
            
            
        });
    }
})();