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
var bodyParser = require('body-parser');

var server = config.get('api_conf.server');
var port = config.get('api_conf.port');
var version = config.get('api_conf.version');
var account = config.get('api_conf.account');

var app = express();

//Allow data transfer with post  
var bodyParser = require('body-parser')
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

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
      var header_title = [];

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
    
      //Parsing the values gathered from field
      var metadata_val = [];
      //Separating the key and values based on metadata_val
      var meta_key = [];
      var meta_value = [];

      //Creating an array that only contains the values
      for(var key in fields){
        metadata_val.push(fields[key]); 
      }
      var keys = Object.keys(fields);

      for(var i=0; i < keys.length; i++){
        //i is an even number
        if(i % 2 == 0){
          meta_key.push(metadata_val[i]);
        }
        //i is not an even number
        else{
          meta_value.push(metadata_val[i]);
        }
      }
      //Construct the dic as the input for put function 
      var metadata = {};
      for(var i = 0; i < meta_key.length; i++){
        metadata[meta_key[i]] = meta_value[i];
      }

      meat.run_main_put(url, oldpath, file_type,  metadata,  function(rep){});
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.write('<p>File successfully uploaded to ' +
      '<a href="' + url+ '">' + url + '</a>' + '</p>');
      return res.end();
  });

});

/*
 * Performs a GET Request. If it is applied to container, 
 * it will list all objects within container, and 
 * the metadata of the container. If it is applied to object, 
 * it output the file to the browser, and list its metadata 
 *
 * A nice feature of object store is its metadata. Because of
 * metadata, we are able to know the type of file beforehand. 
 * Having this knowledge, we are able to handle the data 
 * differently depending on what type it is 
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
      var header_title = [];
      for(var key in rep.header){
        console.log(key);
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
        var renderedHtml = ejs.render(content, {header_title: header_title, header: header, object_title: req.query.container, text_cont: text_cont, img_content: "", url: url});
        res.end(renderedHtml);
      }
    });
  });
});

/* 
 * Delete an object
 */ 
app.get("/delete", function(req, res){
  console.log(url);
  meat.run_main("DELETE", url, "", function(rep){});
  res.writeHead(200, {'Content-Type': 'text/html'});
  url = "https://jennifer-nodejs.spi-pcf.oocl.com/"
  res.write('<p>File successfully deleted <br/>');
  res.write("Return to Homepage " + '<a href="' + url+ '">' + url + '</a>' + '</p>');
  return res.end();
});






/*
 * Rendering the app server 
 */
var server = app.listen(process.env.PORT || 8081, function () {
   var host = server.address().address
   var port = server.address().port
   console.log("Example app listening at http://%s:%s", host, port)

});

console.log('Server running at https://jennifer-nodejs.spi-pcf.oocl.com/');
