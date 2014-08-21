const express = require('express');
const app = express();
const path = require('path');

app.use(express.static(path.join(__dirname, 'public'))); //  "public" off of current is root

const port = process.env.PORT || 3000;
app.listen(port);
console.log('Listening on port ' + port);