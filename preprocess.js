var badTags = ['head', 'link', 'script', 'nav', 'form'];
var config = require('./config.js').cfg;

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
                    for (var i = 0; i < words.length; i++) {
                        if (/^[^a-zA-Z0-9]*$/.test(words[i])) continue;
                        retVal.push({ type: "word", value: words[i], ancestry: ancestors, isContent: doc.isContent });
                    }
                } else {
                    retVal.push({ type: "img", ancestry: ancestors });
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
    var familyTree = {content: {}, copyright: {}, img: {}};
    for (var i = 0; i < nn.length; i++) {
        nn[i].distance = {
            content: nn[i].isContent ? 0 : undefined,
            img: nn[i].type == "img" ? 0 : undefined,
            copyright: nn[i].value.toLowerCase() == 'copyright' || nn[i].value == '©' ? 0 : undefined
        };
        if (nn[i].isContent){
            for (var ancestor in nn[i].ancestry){
                familyTree.content[ancestor] = true;
            }
        }
        if (nn[i].value.toLowerCase() == 'copyright' || nn[i].value == '©'){
            for (var ancestor in nn[i].ancestry){
                familyTree.copyright[ancestor] = true;
            }
        }
        if (nn.type == "img"){
            for (var ancestor in nn[i].ancestry){
                familyTree.img[ancestor] = true;
            }
        }
    }

    var setDistanceForward = function (tag, net, i) {
        for (var j = 1; i + j < net.length && (net[i + j].distance[tag] == -1 || net[i + j].distance[tag] > j); j++) {
            net[i + j].distance[tag] = j;
        }
    }

    var setDistanceBack = function (tag, net, i) {
        for (var j = 1; j <= i && (net[i + j].distance[tag] == -1 || net[i - j].distance[tag] > j); j++) {
            net[i - j].distance[tag] = j;
        }
    }

    var was = {
        content: false,
        img: false,
        copyright: false
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
        if ((nn[i].value.toLowerCase() == 'copyright' || nn[i].value == '©') ^ was.copyright) {
            if (was.copyright) {
                setDistanceForward('copyright', nn, i);
            } else {
                setDistanceBack('copyright', nn, i);
            }
            was.copyright = nn[i].value.toLowerCase() == 'copyright';
        }
        nn[i].saContent = 0;
        if (!nn[i].isContent) {
            var j = 1;
            var lim = nn[i].ancestry.length;
            for (; lim > j; j++){
                if (familyTree.content[nn[i].ancestry[lim-j]]) break;
            }
            nn[i].saContent = j;
        }
        nn[i].saCopyright = 0;
        if (nn[i].value.toLowerCase() != 'copyright' && nn[i].value != '©') {
            var j = 1;
            var lim = nn[i].ancestry.length;
            for (; lim > j; j++){
                if (familyTree.copyright[nn[i].ancestry[lim-j]]) break;
            }
            nn[i].saCopyright = j;
        }
        nn[i].saImg = 0;
        if (nn[i].type != 'img') {
            var j = 1;
            var lim = nn[i].ancestry.length;
            for (; lim > j; j++){
                if (familyTree.img[nn[i].ancestry[lim-j]]) break;
            }
            nn[i].saImg = j;
        }
        
    }
}

module.exports = function (doc) {
    preprocessHelper(doc, config);
    var nn = genWordObjects(doc);
    getDistances(nn);
    return nn;
};
