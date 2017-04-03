var parse5 = require('parse5');
var request = require('request');
var fs = require('fs');

var config = JSON.parse(fs.readFileSync('config.json').toString());

function writeConfig() {
    fs.writeFile('config.json', JSON.stringify(config));
}

(function () {
    if (process.argv.length <= 2) {
        console.log("Required argument: a file with a list of urls");
        return;
    }

    var lines = fs.readFileSync(process.argv[2]).toString().split("\n");
    var urlRegex = /^(https?:\/\/)?([a-zA-Z0-9]+\.)?[a-zA-Z0-9]+\.[a-zA-Z0-9]{1,7}(\/.+)*\/?$/;

    for (var i = 0; i < lines.length; i++) {
        if (!urlRegex.test(lines[i])){
            console.log(lines[i], ' is not a valid URL');
            continue;
        }
        var url = lines[i];
        request(lines[i], function (error, response, body) {
            console.log(url + ':');
            if (error){
                console.log('error:', error); // Print the error if one occurred
                return;
            }
            console.log('body:', body); // Print the HTML
        });
    }
})();