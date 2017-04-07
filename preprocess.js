var badTags = ['head', 'link', 'script', 'nav', 'form'];

//trim irrelevant tags (the ones in badTags) and add content variables
function preprocessHelper(doc, config) {
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

function incrementTag(counter, tag) {
    if (counter[tag]) {
        counter[tag]++;
        return;
    }
    counter[tag] = 1;
}

function genInputNeurons(root) {
    var retVal = [];
    var stack = [{ node: root, tree: [] }];
    var counter = {};
    while (stack.length != 0) {
        var curr = stack.shift();
        var doc = curr.node;
        //add ourseleves to ancestry
        var ancestors = duplicateArray(curr.tree);
        if (doc.tagName) {
            incrementTag(counter, doc.tagName);
            ancestors.push(doc.tagName + ' ' + counter[doc.tagName].toString());
        }

        if (!doc.childNodes) continue;

        for (var i = 0; i < doc.childNodes.length; i++) {
            //add text and images to the NN, otherwise add to the stack
            if (doc.childNodes[i].nodeName == '#text' || doc.childNodes[i].nodeName == 'img') {
                if (doc.childNodes[i].value) {
                    var words = doc.childNodes[i].value.split(' ');
                    for (var i = 0; i < words.length; i++) {
                        if (/^[^a-zA-Z0-9]*$/.test(words[i])) continue;
                        retVal.push({ type: "word", value: words[i], ancestry: ancestors, isContent: doc.isContent });
                    }
                } else {
                    retVal.push({ type: "img", ancestry: ancestors });
                }
                continue;
            }
            stack.push({ node: doc.childNodes[i], tree: ancestors });
        }
    }
    return retVal;
}

function getDistances(nn) {
    for (var i = 0; i < nn.length; i++) {
        nn[i].distance = {
            content: nn[i].isContent ? 0 : Number.MAX_SAFE_INTEGER,
            img: Number.MAX_SAFE_INTEGER,
            copyrightWord: Number.MAX_SAFE_INTEGER,
            copyrightSymbol: Number.MAX_SAFE_INTEGER
        };
    }

    var setDistanceForward = function (tag, net, i) {
        for (j = 1; i + j < net.length && net[i + j].distance[tag] > j; j++) {
            net[i + j].distance[tag] = j;
        }
    }

    var setDistanceBack = function (tag, net, i) {
        for (var j = 1; j <= i && net[i - j].distance[tag] > j; j++) {
            net[i - j].distance[tag] = j;
        }
    }

    var was = {
        content: false,
        img: false,
        copyrightSymbol: false,
        copyrightWord: false
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
        if ((nn[i].value.toLowerCase() == 'copyright') ^ was.copyrightWord) {
            if (was.copyrightWord) {
                setDistanceForward('copyrightWord', nn, i);
            } else {
                setDistanceBack('copyrightWord', nn, i);
            }
            was.copyrightWord = nn[i].value.toLowerCase() == 'copyright';
        }
        if ((nn[i].value == '©') ^ was.copyrightSymbol) {
            if (was.copyrightSymbol) {
                setDistanceForward('copyrightSymbol', nn, i);
            } else {
                setDistanceBack('copyrightSymbol', nn, i);
            }
            was.copyrightSymbol = nn[i].value == '©';
        }
    }
}

module.exports = function (doc, config) {
    preprocessHelper(doc, config);
    var nn = genInputNeurons(doc);
    getDistances(nn);
    return nn;
};
