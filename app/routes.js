var path = require('path');

module.exports = function(app, basedir) {
    app.get('/', function(req, res){
        res.redirect('/autocite');
    });
    app.get('/autocite', function(req, res){
        res.sendFile(path.join(basedir, 'static', 'html', 'autocite', 'index.html'));
    });
}