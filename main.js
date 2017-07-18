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

var header_title = [];

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
      var header = [];

      for(var key in rep.header){
        header.push(rep.header[key]);
        header_title.push(key);
      }
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
      var file_type = files.filetoupload.type;
      url = gen_url(files.filetoupload.name);
      meat.run_main_put(url, oldpath, file_type, function(rep){});
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
  meat.run_main("GET", url, "", function(rep){
    fs.readFile('templates/container.html', 'utf-8', function(err, content) {
      if (err) {
        res.end('error occurred');
        return;
      }

      var header_raw = JSON.stringify(rep.header, null, 2);
      var header = [];
      for(var key in rep.header){
        header.push(rep.header[key]);
        header_title.push(key);
      }
      var token = rep.body.split("\n");

      //If content is an image show it as an image 
      if((rep.header["content-type"]).match('image')){
        var renderedHtml = ejs.render(content, {header_title: header_title, header: header, object_title: req.query.container, img_content: url, text_cont: ""});
        res.end(renderedHtml);
      }
      //If content is a text file, render it as text 
      else if((rep.header["content-type"]).match('text')){
        console.log(rep.body);
        var renderedHtml = ejs.render(content, {header_title: header_title, header: header, object_title: req.query.container, text_cont: rep.body, url: url, img_content: ""});
        res.end(renderedHtml);
      }
      //If file is none of the described type, return file cannot be 
      //opened
      else{
        var text_cont = "This file is either an application or a directory";
        var renderedHtml = ejs.render(content, {header_title: header_title, header: header, object_title: req.query.container, text_cont: text_cont, img_content: ""});
        res.end(renderedHtml);
      }
    });
  });
});





/*
 * Rendering the app server 
 */
var server = app.listen(process.env.PORT || 8081, function () {
   var host = server.address().address
   var port = server.address().port
   process.env.NODE_ENV = 'production';
   console.log("Example app listening at http://%s:%s", host, port)

});

console.log('Server running at https://jennifer-nodejs.spi-pcf.oocl.com/');
