//Dependencies 
var http = require('http');
var fs = require('fs');
var url = require('url');
var request = require('request');
var meat = require('./meat.js');

http.createServer(function (req, res) {

  if (req.url == '/put'){
    fs.readFile('index.html', function(err, data) {
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.write(data);
    });
  }

  if(req.url == "/get"){  
    meat.run_main("GET","", res, "Jellyfish.jpg");
  }

}).listen(3000);

//meat.run_main("PUT", );
// Console will print the message 
console.log('Server running at http://127.0.0.1:3000/');
