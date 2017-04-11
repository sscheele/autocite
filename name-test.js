var fs = require('fs');
var firstNames = JSON.parse('first-names.txt'); //hey, I know! let's load 27000 lines of text into memory as JS objects!
var lastNames = JSON.parse('last-names.txt');

module.exports = {
    hasFirst: function(word){
        return firstNames.hasOwnProperty(word.toLowerCase());
    },
    hasLast: function(word){
        return lastNames.hasOwnProperty(word.toLowerCase());
    }
}

