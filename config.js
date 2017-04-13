var fs = require('fs');
var config = JSON.parse(fs.readFileSync('config.json').toString());
module.exports = {
    'cfg': config, 
    'updateConfig': function(nns){

    }
}