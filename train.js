var parse5 = require('parse5');
var fs = require('fs');
var getWordInfo = require('./preprocess.js');
var config = require('./config.js');
var nnlib = require('./nn.js');
var path = require('path');

function generateCandidates(wordInfo) {
    var tagWords = {};
    for (var wordIndex in wordInfo) {
        var word = wordInfo[wordIndex];
        if (word.isContent && Math.random() < .09) continue; //ignore most content, but leave some so we can effectively train
        var lastTag = word.ancestry.length == 0 ? '#text' : word.ancestry[word.ancestry.length - 1];
        if (!tagWords[lastTag]) tagWords[lastTag] = { words: [word], probabilities: {}, raw: word.value };
        else {
            tagWords[lastTag].words.push(word);
            tagWords[lastTag].raw += ' ' + word.value
        }
    }
    return tagWords;
}

//PRE: body, the raw html of the webpage
//ans, an object containing the author, title, date, and company
//POST: the NN is trained to be a little better than it was
function trainFromHTML(body, ans) {
    var doc = parse5.parse(body); // Parse the HTML
    var wordInfo = getWordInfo(doc);

    var candidates = generateCandidates(wordInfo);

    //train the NN to be better at identifying titles
    for (var i = 0; i < 5000; i++) {
        for (var candidate in candidates) {
            var inNode = nnlib.genInputNodes(candidates[candidate].words);
            for (var target in ans) {
                var prob = nnlib.predict(config.cfg.nns[target], inNode);
                if (candidates[candidate].raw == ans[target]) nnlib.propagateBack(config.cfg.nns[target], 1);
                else nnlib.propagateBack(config.cfg.nns[target], 0);
            }
        }
    }

    console.log("Training complete, writing configuration to file");
    
}

(function () {
    trainFromHTML(fs.readFileSync('./corpus/nytimes/hamid-karzai-afghanistan-us-bombing.html'), {

    });
    trainFromHTML(fs.readFileSync('./corpus/nytimes/visitor-log-white-house-trump.html'), {

    });
    trainFromHTML(fs.readFileSync('./corpus/nytimes/north-korea-china-nuclear.html'), {

    });
    trainFromHTML(fs.readFileSync('./corpus/washpo/even-canadians-are-skipping-trips.html'), {

    });
    trainFromHTML(fs.readFileSync('./corpus/washpo/north-korea-shows-off-new-missiles.html'), {

    });
    trainFromHTML(fs.readFileSync('./corpus/wsj/united-pepsi-outcry.html'), {

    });
    
    config.writeConfig();
})();