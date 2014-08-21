const express = require('express');
const app = express();
const path = require('path');

//app.use(express.static(__dirname)); // Current directory is root
app.use(express.static(path.join(__dirname, 'public'))); //  "public" off of current is root
app.use('/:users(*)', function(req, res){res.sendFile(path.join(__dirname, 'public/index.html'))})


const port = process.env.PORT || 3000;
app.listen(port);
console.log('Listening on port ' + port);