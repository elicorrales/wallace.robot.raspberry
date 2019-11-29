'use strict';

const express = require('express');

const app = express();

const PORT = 8080;

app.use(express.static('/home/devchu/Development/Node.js/client'));

app.get('/',(req,res) => {
	res.send('Hellow World');
});


app.listen(PORT,() => {
	console.log('HTTP Node.js server listening at port ' + PORT);
});
