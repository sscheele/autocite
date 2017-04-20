var express = require('express');
var app = express();
var path = require('path');

app.use('/static', express.static(path.join(__dirname, 'static')));

app.set('view engine', 'pug');

require('./app/routes.js')(app, __dirname);

app.listen(8080, function(){
    console.log('Listening on port 80');
});