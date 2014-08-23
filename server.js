const express = require('express');
const app = express();
const path = require('path');


app.set('view engine', 'jade')
if(process.env.PORT !== 'development') {
	require('newrelic');
	app.set('env', 'development');
}
else {
	app.set('env', 'production');
	app.set('view cache', true)
}



app.use(express.static(path.join(__dirname, 'public')));

app.use('/fonts/:path', function(req, res) {
	res.redirect(301, 'http://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.2.0/fonts/' + req.params.path)
});
app.use('/', function(req, res) {res.render('index')});



const port = process.env.PORT || 3000;
app.listen(port);
console.log('Listening on port ' + port);