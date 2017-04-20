var parse5 = require('parse5');
var request = require('request');
var fs = require('fs');
var getWordInfo = require('./preprocess.js');
var config = require('./config.js');
var nnlib = require('./nn.js');

function generateCandidates(wordInfo) {
    var tagWords = {};
    for (var wordIndex in wordInfo) {
        var word = wordInfo[wordIndex];
        if (word.isContent) continue; //ignore content
        var lastTag = word.ancestry.length == 0 ? '#text' : word.ancestry[word.ancestry.length - 1];
        if (!tagWords[lastTag]) tagWords[lastTag] = { words: [word], probabilities: {}, raw: word.value };
        else {
            tagWords[lastTag].words.push(word);
            tagWords[lastTag].raw += ' ' + word.value
        }
    }
    return tagWords;
}

function predictFromHTML(body, numPredictions) {
    var probs = { author: [], title: [], date: [] };
    var doc = parse5.parse(body); // Parse the HTML
    var wordInfo = getWordInfo(doc);

    var candidates = generateCandidates(wordInfo);

    //show initial values
    for (var candidate in candidates) {
        var inNode = nnlib.genInputNodes(candidates[candidate].words);
        for (nnName in config.cfg.nns) {
            var prob = nnlib.predict(config.cfg.nns[nnName], inNode);
            probs[nnName].push({ val: candidates[candidate].raw, "prob": prob });
        }
    }

    for (var target in probs) {
        probs[target].sort(function (a, b) { return b.prob - a.prob; });
        probs[target] = probs[target].slice(0, numPredictions);
    }

    return probs;
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
            var probs = predictFromHTML(body, 5);
            
            console.log(JSON.stringify(probs, null, 2));
        });
    }
})();