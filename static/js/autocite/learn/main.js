(function () {
    var parse5 = require('parse5');
    var getWordInfo = require('./preprocess.js');

    var hasFirst = function (word) {
        return firstNames.hasOwnProperty(word.toLowerCase());
    }

    function hasLast(word) {
        return lastNames.hasOwnProperty(word.toLowerCase());
    }

    var alpha = .1;

    function sig(x) {
        return (1.0 / (1.0 + Math.exp(-1.0 * x)));
    }

    function sigPrime(x) {
        //deriv = 1/(1 + e^x) - 1/((1+e^x)^2)
        var tmp = 1.0 / (1.0 + Math.exp(x));
        return tmp * (1 - tmp);
    }

    function predict(nn, input) {
        nn[0] = input;
        for (var i = 1; i < nn.length; i++) {
            for (var neuron in nn[i]) {
                var sum = 0;
                for (var feature in nn[i][neuron].weights) {
                    var v = nn[i - 1][feature].value;
                    //if (nn[i - 1][feature].bias) v = Math.abs(v + nn[i - 1][feature].bias);
                    if (v) sum += nn[i][neuron].weights[feature] * v;
                }
                nn[i][neuron].value = sig(sum);
                nn[i][neuron]._sum = sum;
            }
        }
        return nn[nn.length - 1].output.value;
    }

    function propagateBack(nn, correct) {
        for (var i = nn.length - 1; i > 0; i--) {
            for (var neuron in nn[i]) {
                var est = nn[i][neuron].value;
                var dOutdNet = est * (1 - est);
                var dErrordOutInv = correct - est; //take the inverse because I like adding better and this way makes more sense to me
                for (var feature in nn[i][neuron].weights) {
                    var dNetdWeight = nn[i - 1][feature].value;
                    if (dNetdWeight) nn[i][neuron].weights[feature] += alpha * dErrordOutInv * dOutdNet * dNetdWeight;
                }
                delete nn[i][neuron]._sum;
            }
        }
    }

    function genInputNodes(wordArr) {
        var word = wordArr[Math.floor(wordArr.length / 2)]; //this is close enough for many features
        var sentence = wordArr.reduce(function (accum, curr) {
            return accum + curr.value + ' ';
        }, '');
        function hasA(w) {
            for (var i = w.length - 1; i > 0; i++) {
                if (w.ancestry[i].split(' '[0]) == 'a') return true;
            }
            return false;
        }
        var tag = '';
        if (word.ancestry.length > 0) tag = word.ancestry[word.ancestry.length - 1].split(' ')[0];
        var dateRegexes = [
            /jan(uary)?|feb(ruary)?|mar(ch)?|apr(il)?|may|jun(e?)|jul(y)?|aug(ust)?|sep(t)?|september|oct(ober)?|nov(ember)?|dec(ember)?/i,
            /\d+.+\d+/,
            /(\d{1,2}:){2}(\d{1,2})?( am| pm)?/
        ];
        //if a is falsy, return it, otherwise try to return its square
        var squareIf = function (a) {
            if (!a) return a;
            return a * a;
        }
        var numDateRegex = function (str) {
            var retVal = 0;
            for (var regex in dateRegexes) {
                if (dateRegexes[regex].test(str)) retVal++;
            }
            return retVal;
        }
        //sum up the number of words that begin with caps (exclude symbols), divide by number of words, and multiply by 100 (while converting to a float)
        var pctTtitleCase = function (strArr) {
            return (100.0 * strArr.reduce(function (acc, val) { if (val.length > 0 && val.value[0] != val.value[0].toLowerCase()) { return acc + 1; } return acc; }, 0)) / (1.0 * strArr.length);
        }
        var countNames = function (acc, val) {
            if (nameTest.hasFirst(val.value) || nameTest.hasLast(val.value)) {
                return acc + 1;
            }
            return acc;
        }
        //check this shit out, a 20-line return statement
        return {
            h1: { value: tag == 'h1' ? 1 : undefined },
            h2: { value: tag == 'h2' ? 1 : undefined },
            h3: { value: tag == 'h3' ? 1 : undefined },
            h4: { value: tag == 'h4' ? 1 : undefined },
            h5: { value: tag == 'h5' ? 1 : undefined },
            h6: { value: tag == 'h6' ? 1 : undefined },
            span: { value: tag == 'span' ? 1 : undefined },
            p: { value: tag == 'p' ? 1 : undefined },
            saContent: { value: word.saContent },
            saImg: { value: word.saImg },
            dfContent: { value: word.distance.content },
            dfImg: { value: word.distance.img },
            dfBy: { value: word.distance.by },
            sqBy: { value: squareIf(word.distance.by) },
            sqContent: { value: squareIf(word.distance.content) },
            sqImg: { value: squareIf(word.distance.img) },
            matchesDateTimeRegex: { value: numDateRegex(sentence) },
            titleCasePercent: { value: pctTtitleCase(wordArr) },
            matchesNameList: { value: wordArr.reduce(countNames, 0) },
            length: { value: wordArr.length },
            descendedFromA: { value: hasA(word) ? 1 : undefined }
        };
    }

    var badTags = ['head', 'link', 'script', 'nav', 'form', 'style'];

    //trim irrelevant tags (the ones in badTags) and add content variables
    function preprocessHelper(doc) {
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
            preprocessHelper(doc.childNodes[i]); //yeeeeeeah, recursion in a for loop
        }
        doc.isContent = totalWords > config.cfg.minContentWords;
    }

    function duplicateArray(arr) {
        var retVal = [];
        if (!arr) return retVal;
        for (var i = 0; i < arr.length; i++) {
            retVal.push(arr[i]);
        }
        return retVal;
    }

    function incrementTag(counter, tag) {
        if (counter[tag]) {
            counter[tag]++;
            return;
        }
        counter[tag] = 1;
    }

    function genWordObjects(root) {
        var retVal = [];
        var stack = [{ node: root, tree: [] }];
        var counter = {};
        while (stack.length != 0) {
            var curr = stack.pop();
            var doc = curr.node;
            //add ourseleves to ancestry
            var ancestors = duplicateArray(curr.tree);
            if (doc.tagName) {
                incrementTag(counter, doc.tagName);
                ancestors.push(doc.tagName + ' ' + counter[doc.tagName].toString());
            }

            if (!doc.childNodes) continue;
            var tStack = [];
            for (var i = 0; i < doc.childNodes.length; i++) {
                //add text and images to the NN, otherwise add to the stack
                if (doc.childNodes[i].nodeName == '#text' || doc.childNodes[i].nodeName == 'img') {
                    if (doc.childNodes[i].value) {
                        var words = doc.childNodes[i].value.split(' ');
                        for (var j = 0; j < words.length; j++) {
                            if (/^[^a-zA-Z0-9]*$/.test(words[j])) continue;
                            retVal.push({ type: "word", value: words[j], ancestry: ancestors, isContent: doc.isContent });
                        }
                    } else {
                        retVal.push({ type: "img", ancestry: ancestors, value: '' });
                    }
                    continue;
                }
                tStack.push({ node: doc.childNodes[i], tree: ancestors });
            }
            while (tStack.length > 0) stack.push(tStack.pop()); //this way, elements should be dealt with in order, I think
        }
        return retVal;
    }

    //getDistances will get the distance to content, copyright elements, etc and shared ancestry
    function getDistances(nn) {
        var familyTree = { content: {}, img: {}, by: {} };
        for (var i = 0; i < nn.length; i++) {
            nn[i].distance = {
                content: nn[i].isContent ? 0 : undefined,
                img: nn[i].type == "img" ? 0 : undefined,
                by: nn[i].value == 'By' || nn[i].value == "BY" ? 0 : undefined
            };
            if (nn[i].isContent) {
                for (var ancestor in nn[i].ancestry) {
                    familyTree.content[ancestor] = true;
                }
            }
            if (nn.type == "img") {
                for (var ancestor in nn[i].ancestry) {
                    familyTree.img[ancestor] = true;
                }
            }
        }

        var setDistanceForward = function (tag, net, i) {
            for (var j = 1; i + j < net.length && (!net[i + j].distance[tag] || net[i + j].distance[tag] > j); j++) {
                net[i + j].distance[tag] = j;
            }
        }

        var setDistanceBack = function (tag, net, i) {
            for (var j = 1; j <= i && (!net[i - j].distance[tag] || net[i - j].distance[tag] > j); j++) {
                net[i - j].distance[tag] = j;
            }
        }

        var was = {
            content: false,
            img: false
        };
        for (var i = 0; i < nn.length; i++) {
            if (nn[i].isContent ^ was.content) {
                if (was.content) {
                    setDistanceForward("content", nn, i);
                } else {
                    setDistanceBack("content", nn, i);
                }
                was.content = nn[i].isContent;
            }
            if ((nn[i].type == 'img') ^ was.img) {
                if (was.img) {
                    setDistanceForward('img', nn, i);
                } else {
                    setDistanceBack('img', nn, i);
                }
                was.img = nn[i].type == 'img';
                continue;
            }
            if ((nn[i].value == 'By' || nn[i].value == "BY") ^ was.by) {
                if (was.by) {
                    setDistanceForward('by', nn, i);
                } else {
                    setDistanceBack('by', nn, i)
                }
            }
            nn[i].saContent = 0;
            if (!nn[i].isContent) {
                var j = 1;
                var lim = nn[i].ancestry.length;
                for (; lim > j; j++) {
                    if (familyTree.content[nn[i].ancestry[lim - j]]) break;
                }
                nn[i].saContent = j;
            }
            nn[i].saImg = 0;
            if (nn[i].type != 'img') {
                var j = 1;
                var lim = nn[i].ancestry.length;
                for (; lim > j; j++) {
                    if (familyTree.img[nn[i].ancestry[lim - j]]) break;
                }
                nn[i].saImg = j;
            }
        }
    }

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
            var inNode = genInputNodes(candidates[candidate].words);
            for (nnName in config.cfg.nns) {
                var prob = predict(config.cfg.nns[nnName], inNode);
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
}())