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
    if (!doc.childNodes) return;

    var totalWords = 0;
    for (var i = 0; i < doc.childNodes.length; i++) {
        if (doc.childNodes[i].nodeName == '#text') {
            totalWords += doc.childNodes[i].value.split(" ").length;
        }
        if ((doc.childNodes[i].tagName && badTags.indexOf(doc.childNodes[i].tagName) != -1) ||
            (doc.childNodes[i].nodeName == '#text' && /^\s+$/.test(doc.childNodes[i].value))) {
            doc.childNodes.splice(i, 1); //remove if a useless tag, then continue
            i--; //decrement i because we're removing from the list over which we're iterating
            continue;
        }
        preprocess(doc.childNodes[i]); //yeeeeeeah, recursion in a for loop
    }
    doc.isContent = totalWords > config.minContentWords;
}

function duplicateArray(arr) {
    var retVal = [];
    if (!arr) return retVal;
    for (var i = 0; i < arr.length; i++) {
        retVal.push(arr[i]);
    }
    return retVal;
}

function genNeuralNet(root) {
    var retVal = [];
    var stack = [{node: root, tree: []}];
    while (stack.length != 0) {
        var curr = stack.shift();
        var doc = curr.node;
        //add ourseleves to ancestry
        var ancestors = duplicateArray(curr.tree);
        if (doc.tagName) ancestors.push(doc.tagName);

        if (!doc.childNodes) continue;

        for (var i = 0; i < doc.childNodes.length; i++) {
            //add text and images to the NN, otherwise add to the stack
            if (doc.childNodes[i].nodeName == '#text' || doc.childNodes[i].nodeName == 'img') {
                if (doc.childNodes[i].value) {
                    var words = doc.childNodes[i].value.split(' ');
                    for (var i = 0; i < words.length; i++) {
                        if (/^[^a-zA-Z0-9]*$/.test(words[i])) continue;
                        retVal.push({ type: "word", value: words[i], ancestry: ancestors, isContent: doc.isContent});
                    }
                } else {
                    retVal.push({type: "img", ancestry: ancestors});
                }
                continue;
            }
            stack.push({node: doc.childNodes[i], tree: ancestors });
        }
    }
    return retVal;
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
            var nn = genNeuralNet(doc);
            console.log(JSON.stringify(nn, null, 2));
        });
    }
})();