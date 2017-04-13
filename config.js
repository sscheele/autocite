var fs = require('fs');
var config = JSON.parse(fs.readFileSync('config.json').toString());
module.exports = {
    'cfg': config, 
    'updateConfig': function(nns){
        for (var target in nns){
            
        }
    },
    'writeConfig': function(){
        fs.writeFile('config.json', JSON.stringify(config));
    }
}