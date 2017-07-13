//Dependencies 
var request = require('request');
var fs = require('fs');

/********************************************************************
                          Important Notice
  This utilizes an npm package, request. You need to install this 
              with the command [npm install request] 

*********************************************************************/
//Authentication
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
exports.run = function (options, status){
  function callback(error, response, body){
    if(!error && response.statusCode == status){
      console.log("--------------------------------------------------------------");
      console.log("\nSending an " + options.method + " request: \n");
      console.log("--------------------------------------------------------------");
      console.log("Body is returning (sometimes body can be empty): \n");
      console.log(body + "\n");
      console.log("Response Header: \n");
      console.log(response.headers);
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
exports.run_main = function (method, file, res,file_name){
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
            var url_s = "http://hln2329p:8080/v1/AUTH_companyA/folder1/" + file_name;
            var get_options = {
              method: "GET",
              url: "http://hln2329p:8080/v1/AUTH_companyA/folder1/" + file_name,
              headers: { 
                "X-Auth-Token": auth_token
              }
            }

            //This will pip the image to the response 
            request(get_options).pipe(res);
        }  

        /*
          PUT Function differs when used in different levels (Account, Container, Object)
          Account - Request is not available in Account
          Containers - Create container
          Objects - Create or replace object
        */

        if (method == "PUT"){
            var url_s = "http://hln2329p:8080/v1/AUTH_companyA/folder1/" + file_name;
            var options_put = {
              method: "PUT",
              url: url_s,
              headers: {
                "X-Auth-Token": (response.headers['x-auth-token']).toString(),
                "Content-Type": "image/jpeg"
              }
            }
            fs.createReadStream(file).pipe(request.put(options_put, function(err, response, body) {
                console.log("---------------------------------------------------------");
                console.log("\nSending a PUT Request\n");
                console.log("--------------------------------------------------------");
                console.log("File successfully uploaded to " + url_s + "\n");
            })); 
            //__dirname + '/volkswagen-1.4MB.jpg'
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
            exports.run(post_options, 202);
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
            url: "http://hln2329p:8080/v1/AUTH_companyA/folder1/" + file_name,
            headers: {
              "X-Auth-Token": auth_token
            }
          }
          exports.run(head_options, 200);
        }
      }
    }

    request(options_auth, callback);
}

//run_main("GET");