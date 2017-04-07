function sig(x) {
    return (1.0 / (1.0 + Math.exp(-1.0 * x)));
}

function sigPrime(x) {
    //deriv = 1/(1 + e^x) + 1/((1+e^x)^2)
    var tmp = 1.0 / (1.0 + Math.exp(x));
    return tmp + tmp * tmp;
}

function genNN(config, target) {
    var retVal = [{}, {}, {output: {value: 0, weights: {}}}];
    for (var feature in config[target]) {
        tmp = { value: 0, weights: {} };
        if (typeof config[target][feature] == 'object') {
            for (var subFeature in config[target][feature]) {
                tmp.weights[subFeature] = config[target][feature][subFeature];
            }
        } else {
            tmp.weights[feature] = config[target][feature];
        }
        retVal[1][feature] = tmp;
    }
    return retVal;
}

function genAllNNs(config) {
    var retVal = [];
    for (var target in config) {

    }
    return retVal;
}
var retVal = {
    "author": [
        {
            "h1": config.author.tags.h1
        }
    ]
};
}

module.exports = {

};