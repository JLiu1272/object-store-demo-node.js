//Dependencies 
var request = require('request');
var fs = require('fs');

/********************************************************************
                          Important Notice
  This utilizes an npm package, request. You need to install this 
              with the command [npm install request] 

*********************************************************************/
//Authentication
/* 
 * You can auto generate a url based on the values 
 * inside config/production.json. An example of such
 * can be seen in the main.js 
 */
var options_auth = {
  url: 'http://hln2329p:8080/auth/v1.0',
  headers: {
    'X-Storage-User': 'companyA:AdminA',
    'X-Storage-Pass': 'password'
  }
};

/*
  Helper function for generating the output 
  Param:
     Options (JSON) 
        Use this to indicate Headers, Method, and URL 
     Status (number)
        A success status code. It could be 200, 202 etc...   
*/
exports.run = function (options, status, url_s, resp){
  function callback(error, response, body){
    if(!error && response.statusCode == status){
      console.log("--------------------------------------------------------------");
      console.log("\nSending an " + options.method + " request: \n");
      console.log("--------------------------------------------------------------");
      resp({'header': response.headers, 'body': body});
    }
  }
  request(options, callback);
}

/*
   With Swift version 1, you must first get the Auth Token by running a 
   request. The callback function is responsible for grabbing the auth token.
   Due to the nature of Node.js (Async, Non-Blocking Design), you must 
   do the GET/PUT/DELETE/... etc request within the callback function. 
*/
exports.run_main = function (method, url_s, file, result){
    function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        console.log("You are authenticated");
        var auth_token = response.headers['x-auth-token'].toString();
        console.log("Auth Token: " + JSON.stringify(response.headers['x-auth-token']));

        /*
          Send a Get Request
            -The GET Request will list all the containers available within the account
            -If you include the container, it will list all the objects
            -If you only include the account, it will list all the containers available
             within the account
            -If you list the objects as well, it will output the metadata of that object
          Return: The function written here included only the account, so it will
              only list the containers within the account
         */
        if (method == "GET"){
            var get_options = {
              method: "GET",
              url: url_s,
              headers: { 
                "X-Auth-Token": auth_token
              }
            }

            exports.run(get_options, 200, url_s, function(res){
              //Doing this to combat the async nature of node.js 
              result({'header': res.header, 'body': res.body});
            });

            //This will pip the image to the response 
            //request(get_options).pipe(res);
        }  

        /* 
         * Delete an object/container
         */
        if (method == "DELETE"){
          var options_delete = {
            method: "DELETE",
            url: url_s,
            headers: {
              "X-Auth-Token": (response.headers['x-auth-token']).toString(),
            }
          }

          exports.run(options_delete, 200, url_s, function(res){
            result({'header': "", 'body': ""});
          });

        }


        /*
          POST - Used to update, create, or delete metadata
          Usage:
             Account - Create, update, or delete account metadata
             Containers - Create, update, or delete container metadata
             Objects - Create or update object metadata
          Function:
             - Adds two custom metadata to the object volkwagen.png 
             - You do not always need to create custom metadata. Swift comes with a suit of commonly used Metadata
               as well. For example, X-Delete-At, Bulk-Dete etc.. For more info, visit swift's API Doc
             - The two custom metadata are "X-Object-Meta-Brand : BMW" and "X-Object-Meta-Model : x3"
             - When adding custom metadata, you must add in the following format:
                  "X-Object-Meta-{name} : {value}"
          Notice:
             -With POST and HEAD, the valid return status code is 202        
        */
        if (method == "POST"){
           var post_options = {
              method: "POST",
              url: "http://hln2329p:8080/v1/AUTH_companyA/folder1/" + file_name,
              headers: {
                "X-Auth-Token": auth_token,
                "X-Object-Meta-Brand": "BMW", 
                "X-Object-Met-aModel": "x3"
              }
            }
            exports.run(post_options, 202, url_s, function(res){
              console.log(res);
            });
        }

        /*
          HEAD - Show metadata
          Usage:
             Account - Show Account Metadata
             Containers - Show container Metadata
             Objects - Show object metadata
          Function:
             Earlier in the POST Method, we added 2 new custom metadata, HEAD
             will be able to show that the custom Metadata has been updated
         */  
        if (method == "HEAD"){
          var head_options = {
            method: "HEAD",
            url: url_s,
            headers: {
              "X-Auth-Token": auth_token
            }
          }
          console.log("Passed here");
          exports.run(head_options, 200, url_s, function(res){
              result({'header': res.header, 'body': res.body});
          });
        }
      }
    }

    request(options_auth, callback);
}

/* 
 * Put has its own function because it requires
 * a lot more parameter so it will be easier 
 * to create another function to do it 
 */
exports.run_main_put = function (url_s, file, type, metadata, result){
    function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        console.log("You are authenticated");
        var auth_token = response.headers['x-auth-token'].toString();
        console.log("Auth Token: " + JSON.stringify(response.headers['x-auth-token']));

        /*
          PUT Function differs when used in different levels (Account, Container, Object)
          Account - Request is not available in Account
          Containers - Create container
          Objects - Create or replace object
        */
        var options_put = {
          method: "PUT",
          url: url_s,
          headers: {
            "X-Auth-Token": (response.headers['x-auth-token']).toString(),
            "Content-Type": type
          }
        }
        if(Object.keys(metadata)[0] != ""){
          for(var key in metadata){
            options_put.headers[key] = metadata[key]; 
          }
          console.log(options_put);
        }

        fs.createReadStream(file).pipe(request.put(options_put, function(err, response, body) {
            console.log("---------------------------------------------------------");
            console.log("\nSending a PUT Request\n");
            console.log("--------------------------------------------------------");
            console.log("File successfully uploaded to " + url_s + "\n");
        })); 
      }      
    }  
    request(options_auth, callback);
}

/* 
 * Check if Dictionary is empty 
 */
function isEmpty(obj) {

    // null and undefined are "empty"
    if (obj == null) return true;

    // Assume if it has a length property with a non-zero value
    // that that property is correct.
    if (obj.length > 0)    return false;
    if (obj.length === 0)  return true;

    // If it isn't an object at this point
    // it is empty, but it can't be anything *but* empty
    // Is it empty?  Depends on your application.
    if (typeof obj !== "object") return true;

    // Otherwise, does it have any properties of its own?
    // Note that this doesn't handle
    // toString and valueOf enumeration bugs in IE < 9
    for (var key in obj) {
        if (hasOwnProperty.call(obj, key)) return false;
    }

    return true;
}