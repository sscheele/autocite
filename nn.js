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

function genInputNodes(word) {
    return {

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