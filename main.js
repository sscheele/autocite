var parse5 = require('parse5');
var request = require('request');
var fs = require('fs');

//TODO: more weighs for NN layer 2 (weights -> thresholds -> weights -> threshold -> answer)
var config = JSON.parse(fs.readFileSync('config.json').toString());
var badTags = ['head', 'link', 'script', 'nav', 'form'];

function writeConfig() {
    fs.writeFile('config.json', JSON.stringify(config));
}

//trim irrelevant tags (the ones in badTags) and add content variables
function preprocess(doc) {
    if (!doc.childNodes) {
        return;
    }
    var totalWords = 0;
    for (var i = 0; i < doc.childNodes.length; i++) {
        if (doc.childNodes[i].nodeName == '#text') {
            totalWords += doc.childNodes[i].value.split(" ").length;
        }
        if (doc.childNodes[i].tagName && badTags.indexOf(doc.childNodes[i].tagName) != -1) {
            doc.childNodes.splice(i, 1); //remove if a useless tag, then continue
            i--; //decrement i because we're removing from the list over which we're iterating
            continue;
        }
        preprocess(doc.childNodes[i]); //yeeeeeeah, recursion in a for loop
    }
    doc.isContent = totalWords > config.minContentWords;
}

function propagateContentUp(doc){
    //TODO: if more than detcontentpercent of an element is content, mark that element as content as well
    //use DFS-style recursion so that content tags propagate up
}

(function () {
    if (process.argv.length <= 2) {
        console.log("Required argument: a file with a list of urls");
        return;
    }

    var lines = fs.readFileSync(process.argv[2]).toString().split("\n");
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
            preprocess(doc);
            console.log(parse5.serialize(doc));
        });
    }
})();