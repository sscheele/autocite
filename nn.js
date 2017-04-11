var config = require('./config.js');

function sig(x) {
    return (1.0 / (1.0 + Math.exp(-1.0 * x)));
}

function sigPrime(x) {
    //deriv = 1/(1 + e^x) + 1/((1+e^x)^2)
    var tmp = 1.0 / (1.0 + Math.exp(x));
    return tmp + tmp * tmp;
}

function genNN(target) {
    var retVal = [{}, {}, { output: { value: 0, weights: {} } }];
    for (var feature in target) {
        tmp = { value: 0, weights: {} };
        if (typeof target[feature] == 'object') {
            for (var subFeature in target[feature]) {
                tmp.weights[subFeature] = target[feature][subFeature];
            }
        } else {
            tmp.weights[feature] = target[feature];
        }
        retVal[1][feature] = tmp;
    }
    return retVal;
}

function genInputNodes(wordArr) {
    var word = wordArr[wordArr.length / 2]; //this is close enough for many features
    var sentence = wordArr.reduce(function(accum, curr){
        accum += curr.value + ' ';
    }, '');
    var tag = '';
    if (word.ancestry.length > 0) tag = word.ancestry[word.ancestry.length - 1].split(' ')[0];
    var dateRegexes = [
        /jan(uary)?|feb(ruary)?|mar(ch)?|apr(il)?|may|jun(e?)|jul(y)?|aug(ust)?|sep(t)?|september|oct(ober)?|nov(ember)?|dec(ember)?/i,
        /\d+.+\d+/,
        /(\d{1,2}:){2}(\d{1,2})?( am| pm)?/
    ];
    //if a is falsy, return it, otherwise try to return its square
    var squareIf = function(a) {
        if (!a) return a;
        return a * a;
    }
    var numDateRegex = function(str){
        var retVal = 0;
        for (regex in dateRegexes){
            if (regex.test(str)) retVal++;
        }
        return retVal;
    }
    //sum up the number of words that begin with caps (exclude symbols), divide by number of words, and multiply by 100 (while converting to a float)
    var pctTtitleCase = function(strArr){
        return (100.0 * strArr.reduce(function(acc, val){if (val[0] != val[0].toLowerCase()) acc++;}, 0)) / (1.0 * strArr.length);
    }
    return {
        h1: {value: tag == 'h1' ? 1 : undefined},
        h2: {value: tag == 'h2' ? 1 : undefined},
        h3: {value: tag == 'h3' ? 1 : undefined},
        h4: {value: tag == 'h4' ? 1 : undefined},
        h5: {value: tag == 'h5' ? 1 : undefined},
        h6: {value: tag == 'h6' ? 1 : undefined},
        span: {value: tag == 'span' ? 1 : undefined},
        p: {value: tag == 'p' ? 1 : undefined},
        saContent: {value: word.saContent},
        saCopyright: {value: word.saCopyright},
        saImg: {value: word.saImg},
        dfContent: {value: word.distance.content},
        dfImg: {value: word.distance.img},
        dfCopyright: {value: word.distance.copyright},
        sqContent: {value: squareIf(word.distance.content)},
        sqImg: {value: squareIf(word.distance.img)},
        sqCopyright: {value: squareIf(word.distance.copyright)},
        matchesDateTimeRegex: {value: numDateRegex(sentence)},
        titleCasePercent: {value: pctTtitleCase(wordArr)},

    };
}

module.exports = {
    genAllNNs: function () {
        var retVal = {};
        for (var target in config.weights) {
            retVal[target] = genNN(config.weights[target]);
        }
        return retVal;
    }
};