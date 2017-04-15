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

//PRE: dir, a subdirectory of ./corpus containing articles from the same site
//ans, an object containing the author, title, date, and company
//POST: the NN is trained to be a little better than it was
function trainFromSubCorpus(dir, ans) {
    fs.readdir(path.join('./corpus', dir), function (err, files) {
        if (err) {
            console.error("Could not list the directory.", err);
            process.exit(1);
        }

        files.forEach(function (file, index) {
            var body = fs.readFileSync(path.join('./corpus/', dir, file))
            var doc = parse5.parse(body); // Parse the HTML
            var wordInfo = getWordInfo(doc);

            var candidates = generateCandidates(wordInfo);

            //train the NN to be better at identifying titles
            for (var i = 0; i < 500; i++) {
                for (var candidate in candidates) {
                    var inNode = nnlib.genInputNodes(candidates[candidate].words);
                    var prob = nnlib.predict(config.cfg.nns.title, inNode);
                    for (var target in ans) {
                        if (candidates[candidate].raw == ans[target]) nnlib.propagateBack(config.cfg.nns[target], 1);
                        else if (Math.random() < .2) {
                            nnlib.propagateBack(config.cfg.nns[target], 0);
                        }
                    }
                }
            }

            console.log("Training complete, writing configuration to file");
            config.writeConfig();
        });
    });
}

//TODO: ADD RANDOM SAMPLES OF CONTENT

(function () {

})();