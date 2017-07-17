//Dependencies 
var http = require('http');
var fs = require('fs');
var url = require('url');
var ejs = require('ejs');
var config = require('config');
var request = require('request');
var meat = require('./meat.js');
var express = require('express');
var formidable = require('formidable');

var server = config.get('api_conf.server');
var port = config.get('api_conf.port');
var version = config.get('api_conf.version');
var account = config.get('api_conf.account');

var app = express();

/********************************************************************
                          Important Notice
  Look into the meat.js file, that is where most of the core 
    functions are written. This page is more for rendering 
      UI stuff on web browser and calling the meaty functions. 

*********************************************************************/

//Generate url based on config file info 
function gen_url(object){
  var server = config.get('api_conf.server');
  var port = config.get('api_conf.port');
  var version = config.get('api_conf.version');
  var account = config.get('api_conf.account');

  url = "http://" + server + ":" + port + "/" + version + "/" + account 
  if(config.has('api_conf.container')){
     url += "/" + config.get('api_conf.container'); 
  } 
  if(config.has('api_conf.object')){
    url += "/" + config.get('api_conf.object');
  }
  url += object; 

  return url;
}

var header_title = [
  "content-type",
  "x-container-object-count",
  "accept-ranges",
  "x-storage-policy",
  "x-container-read",
  "x-container-bytes-used",
  "x-timestamp",
  "content-type",
  "x-trans-id",
  "date",
  "connection"
];

var header_title2 = [
  "content-type",
  "x-container-object-count",
  "accept-ranges",
  "x-storage-policy",
  "x-container-read",
  "x-container-bytes-used",
  "x-timestamp",
  "content-type",
  "x-trans-id",
  "date",
  "connection", 
  "last-modified",
  "x-object-meta-brand",
  "x-object-meta-model"
];


//Perform GET Function 
app.get("/", function (req, res) {

  url = gen_url("");

  meat.run_main("GET", url, "",  function(rep){
    fs.readFile('templates/index.html', 'utf-8', function(err, content) {
      if (err) {
        res.end('error occurred');
        return;
      }
      var header_raw = JSON.stringify(rep.header, null, 2);
      var header = [
        rep.header["content-type"],
        rep.header["x-container-object-count"],
        rep.header["accept-ranges"],
        rep.header["x-storage-policy"],
        rep.header["x-container-read"],
        rep.header["x-container-bytes-used"],
        rep.header["x-timestamp"],
        rep.header["content-type"],
        rep.header["x-trans-id"],
        rep.header["date"],
        rep.header["connection"]
      ];
      var token = rep.body.split("\n");

      var renderedHtml = ejs.render(content, {header_title: header_title, header: header, token: token, header_container: ""});
      res.end(renderedHtml);
    });
  });
});

/*
 * Performing a get function on objects within 
 * Container. Displaying the metadata of the 
 * Object passed in 
 */

app.post('/put', function (req, res){
  var form = new formidable.IncomingForm();
  form.parse(req, function (err, fields, files) {
      var oldpath = files.filetoupload.path;
      console.log(oldpath);
      url = gen_url(files.filetoupload.name);
      meat.run_main("PUT", url, oldpath, function(rep){});
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.write('<p>File successfully uploaded to ' +
      '<a href="' + url+ '">' + url + '</a>' + '</p>');
      return res.end();
  });

});

/* 
 * For each object, it has a head function, 
 * which allows you to view all the metadata within
 * it
 */

app.get('/head', function (req, res) {
  url = gen_url(req.query.container);
  meat.run_main("HEAD", url, "", function(rep){
    fs.readFile('templates/container.html', 'utf-8', function(err, content) {
      if (err) {
        res.end('error occurred');
        return;
      }

      var header_raw = JSON.stringify(rep.header, null, 2);
      console.log(header_raw);
      var header = [
        rep.header["content-type"],
        rep.header["x-container-object-count"],
        rep.header["accept-ranges"],
        rep.header["x-storage-policy"],
        rep.header["x-container-read"],
        rep.header["x-container-bytes-used"],
        rep.header["x-timestamp"],
        rep.header["content-type"],
        rep.header["x-trans-id"],
        rep.header["date"],
        rep.header["connection"],
        rep.header["last-modified"], 
        rep.header["x-object-meta-brand"],
        rep.header["x-object-meta-model"]
      ];
      var token = rep.body.split("\n");

      var renderedHtml = ejs.render(content, {header_title: header_title2, header: header, object_title: req.query.container, content: url});
      res.end(renderedHtml);
    });
  });
});

/*
 * Rendering the app server 
 */
var server = app.listen(8081, function () {
   var host = server.address().address
   var port = server.address().port
   console.log("Example app listening at http://%s:%s", host, port)

});

console.log('Server running at http://127.0.0.1:8081/');
