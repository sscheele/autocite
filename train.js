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
        if (word.isContent) continue;
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

    //train the NN to be better at identifying each feature
    for (var i = 0; i < 3000; i++) {
        for (var candidate in candidates) {
            var inNode = nnlib.genInputNodes(candidates[candidate].words);
            for (var target in ans) {
                var prob = nnlib.predict(config.cfg.nns[target], inNode);
                if (ans[target].indexOf(candidates[candidate].raw) != -1) nnlib.propagateBack(config.cfg.nns[target], 1);
                else nnlib.propagateBack(config.cfg.nns[target], 0);
            }   
        }
    }
}

//PRE: body, the raw HTML of the webpage
//POST: an object containing the top 3 most likely candidates for author, title, date, and company
function predictFromHTML(body) {
    var retVal = {author: [], title: [], date: [], company: []};

    var doc = parse5.parse(body); // Parse the HTML
    var wordInfo = getWordInfo(doc);
    var candidates = generateCandidates(wordInfo);

    for (var candidate in candidates) {
        var inNode = nnlib.genInputNodes(candidates[candidate].words);
        for (var target in retVal) {
            var prob = nnlib.predict(config.cfg.nns[target], inNode);
            retVal[target].push({val: candidates[candidate].raw, "prob": prob});
        }
    }
    for (var target in retVal){ 
        retVal[target].sort(function(a,b){return b.prob-a.prob;});
        retVal[target] = retVal[target].slice(0, 3);
    }
    return retVal;
}

(function () {
    console.log("**************\nTRAINING (1/10)\n*****************");
    trainFromHTML(fs.readFileSync('./corpus/nytimes/hamid-karzai-afghanistan-us-bombing.html').toString(), {
        title: ["Afghan Ex-President Denounces Bombing and Says He Wants U.S. Out"],
        author: ["MUJIB MASHAL"],
        date: ["APRIL 15, 2017"],
        company: ["The New York Times", "The New York Times Company"]
    });
    console.log("**************\nTRAINING (2/10)\n*****************");
    trainFromHTML(fs.readFileSync('./corpus/nytimes/visitor-log-white-house-trump.html').toString(), {
        title: ["White House to Keep Its Visitor Logs Secret"],
        author: ["JULIE HIRSCHFELD DAVIS"],
        date: ["APRIL 14, 2017"],
        company: ["The New York Times", "The New York Times Company"]
    });
    console.log("**************\nTRAINING (3/10)\n*****************");
    trainFromHTML(fs.readFileSync('./corpus/nytimes/north-korea-china-nuclear.html').toString(), {
        title: ["China Warns of ‘Storm Clouds Gathering’ in U.S.-North Korea Standoff"],
        author: ["GERRY MULLANY", "CHRIS BUCKLEY", "DAVID E. SANGER"],
        date: ["APRIL 14, 2017"],
        company: ["The New York Times", "The New York Times Company"]
    });
    console.log("**************\nTRAINING (4/10)\n*****************");
    trainFromHTML(fs.readFileSync('./corpus/washpo/even-canadians-are-skipping-trips.html').toString(), {
        title: ["Even Canadians are skipping trips to America after Trump travel ban"],
        author: ["Abha Bhattarai"],
        date: ["April 14 at 11:58 AM"],
        company: ["The Washington Post"]
    });
    console.log("**************\nTRAINING (5/10)\n*****************");
    trainFromHTML(fs.readFileSync('./corpus/washpo/north-korea-shows-off-new-missiles.html').toString(), {
        title: ["North Korea shows off new missiles in huge military parade but doesn’t test nuclear weapon"],
        author: ["Anna Fifield", "Simon Denyer"],
        date: ["April 15 at 7:47 AM"],
        company: ["The Washington Post"]
    });
    console.log("**************\nTRAINING (6/10)\n*****************");
    trainFromHTML(fs.readFileSync('./corpus/wsj/united-pepsi-outcry.html').toString(), {
        title: ["United, Pepsi Outcry Unlikely to Hurt Financial Results"],
        author: ["Tatyana Shumsky"],
        date: ["April 15, 2017 6:00 a.m. ET"],
        company: ["The Wall Street Journal"]
    });
    console.log("**************\nTRAINING (7/10)\n*****************");
    trainFromHTML(fs.readFileSync('./corpus/huffpost/wh-visitor-logs.html').toString(), {
        title: ["Trump White House Says It Won't Be Transparent At All Because Obama Wasn't Transparent Enough"],
        author: ["Sam Stein", "Paul Blumenthal"],
        date: ["04/17/2017 04:53 pm ET"],
        company: []
    });
    console.log("**************\nTRAINING (8/10)\n*****************");
    trainFromHTML(fs.readFileSync('./corpus/huffpost/plot-holes.html').toString(), {
        title: ["This Might Explain Every Plot Hole In 'Pretty Little Liars'"],
        author: ["Julia Brucculieri"],
        date: ["04/17/2017 05:38 pm ET"],
        company: []
    });
    console.log("**************\nTRAINING (9/10)\n*****************");
    trainFromHTML(fs.readFileSync('./corpus/huffpost/trump-at-maralago.html').toString(), {
        title: ["This Site Tracks How Much Trump’s Mar-A-Lago Trips Are Costing You"],
        author: ["Sarah Ruiz-Grossman"],
        date: ["04/17/2017 05:31 pm ET"],
        company: []
    });
    console.log("**************\nTRAINING (10/10)\n*****************");
    trainFromHTML(fs.readFileSync('./corpus/cnn/index.html').toString(), {
        title: ["North Korean envoy at UN warns of nuclear war possibility"],
        author: ["Richard Roth"],
        date: ["Updated 5:32 PM ET, Mon April 17, 2017"],
        company: ["By CNN"]
    });
    console.log("Training complete! Attempting to extract info from BBC test");
    //console.log(JSON.stringify(predictFromHTML(fs.readFileSync('./corpus/bbc/world-europe.html').toString()), null, 2));
    console.log(JSON.stringify(predictFromHTML(fs.readFileSync('./corpus/washpo/north-korea-shows-off-new-missiles.html').toString()), null, 2));
    config.writeConfigTo('config.test-2.json');
})();