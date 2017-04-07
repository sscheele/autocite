var parse5 = require('parse5');
var request = require('request');
var fs = require('fs');
var getInputNodes = require('./preprocess.js');



function writeConfig(config) {
    fs.writeFile('config.json', JSON.stringify(config));
}

(function () {
    if (process.argv.length <= 2) {
        console.log("Required argument: a file with a list of urls");
        return;
    }

    //TODO: more weighs for NN layer 2 (weights -> thresholds -> weights -> threshold -> answer)
    var config = JSON.parse(fs.readFileSync('config.json').toString());

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
            var nn = getInputNodes(doc, config);

            //TODO: When parsing for title, it should take up an entire tag
            //var results = applyNN(nn);
            console.log(JSON.stringify(nn, null, 2));
        });
    }
})();