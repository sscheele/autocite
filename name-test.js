var fs = require('fs');
var firstNames = JSON.parse(fs.readFileSync('first-names.json').toString()); //hey, I know! let's load 27000 lines of text into memory as JS objects!
var lastNames = JSON.parse(fs.readFileSync('last-names.json').toString());

module.exports = {
    hasFirst: function(word){
        return firstNames.hasOwnProperty(word.toLowerCase());
    },
    hasLast: function(word){
        return lastNames.hasOwnProperty(word.toLowerCase());
    }
}

