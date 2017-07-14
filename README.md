# object-store-demo-node.js
A Demo Application showing how developers and system administrators can benefit from Object Storage System 

#Usage
Download this code into your local computer
$git pull https://github.com/JLiu1272/object-store-demo-node.js.git

Run the main.js file
$node main.js 

a) Each page with different URL will have different functionalities 
http://localhost:3000/put 
1) Upload a file, on the console where node is running, it will output a link
   where the file is uploaded. 
2) Once you uploaded, go to http://localhost:3000/get 
3) To change the file you want to get, change it in main.js (I have commented a section 
for you to make changes there) 

Code Architecture 
Meat.js - This is where the functions for calling Object Store Restful API are written. 
Main.js - This is where the app is interacting with the browser. It is also where the API are 
          being called while rendering the browser  