// server.js
// where your node app starts

// init project
var https = require('https');
var express = require('express');
var app = express();

// we've started you off with Express, 
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

app.get('/image/:q?offset=:n?', function(req, res) {
  var API_KEY = "AIzaSyA8Q1UzLWjDfVp_RJ7MKdPiC7V66vyo-TA";
  var CSE_ID = "011940694808885930266:hwnnsctwhi0";
  var endPoint = 'https://www.googleapis.com/customsearch/v1?key=' + API_KEY + '&cx=' + 
        CSE_ID + '&q=' + req.params.q + '&num=10&searchType=image&start=' + req.params.n
  https.get(endPoint, (response) => {
    const statusCode  = response.statusCode;
    const contentType = response.headers['content-type'];
    var error;
    if (statusCode !== 200) {
      error = new Error('Request Failed.\n' + `Status Code: ${statusCode}`);    
    }else if(!/^application\/json/.test(contentType)) {
      error = new Error('Invalid content-type.\n' +
                      `Expected application/json but received ${contentType}`);
    }
    if (error) {
      console.error(error.message);
      response.resume();
      return;
   }
  response.setEncoding('utf8');
  var apiData = '';
  response.on('data', (chunk) => { apiData += chunk;});
  response.on('end', () => {
    try {
      var result = JSON.parse(apiData);
      var result1 = result.items;
      var display = [];
      for (let i=0; i<result1.length; i++) {
        var item = {};
        item.image = result1[i].link;
        item.snippet = result1[i].snippet;
        item.thumbnail = result1[i].image.thumbnailLink;
        item.context = result1[i].image.contextLink;
        display.push(item);}      
      
      res.send(display);
    } catch (e) {
      console.error(e.message);
    }
  });
}).on('error', (e) => {
  console.error(`Got error: ${e.message}`);
}); 
  //res.sendFile(process.cwd() + '/views/index.html');
})

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
