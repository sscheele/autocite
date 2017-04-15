var fs = require('fs');
var config = JSON.parse(fs.readFileSync('config.json').toString());
module.exports = {
    'cfg': config,
    'writeConfig': function(){
        fs.writeFile('config.json', JSON.stringify(config));
    }
}