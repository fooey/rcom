if(process.env.PORT !== 'development') {
	require('newrelic');
}


const express = require('express');
const app = express();
const path = require('path');

app.use(express.static(path.join(__dirname, 'public'))); //  "public" off of current is root

app.use('/fonts/:path', function(req, res) {
	res.redirect(301, 'http://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.2.0/fonts/' + req.params.path)
});

const port = process.env.PORT || 3000;
app.listen(port);
console.log('Listening on port ' + port);