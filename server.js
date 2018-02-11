var MongoClient = require('mongodb').Mongoclient;
var https = require('https');
var express = require('express');
var app = express();

function saveQuery(str) {
  var url = "mongodb://vivi:123@ds125198.mlab.com:25198/images_fcc";
  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("images_fcc");
    var t = Date();
    var myobj = { name: str, when: t };
    dbo.collection("latest").insertOne(myobj, function(err, res) {
      if (err) throw err;
      console.log("1 document inserted");
      db.close();
    });
  });
}

app.use(express.static('public'));
app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

app.get('/image/:q', function(request, response) {
  saveQuery(request.params.q);
  const API_KEY = "AIzaSyA8Q1UzLWjDfVp_RJ7MKdPiC7V66vyo-TA";
  const CSE_ID = "011940694808885930266:hwnnsctwhi0";  
  var offset = request.query.offset || 1;
  const endPoint = 'https://www.googleapis.com/customsearch/v1?key=' + API_KEY + '&cx=' + 
        CSE_ID + '&q=' + request.params.q + '&num=10&searchType=image&start=' + offset
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
      const result = JSON.parse(apiData);
      const result1 = result.items;
      var display = [];
      for (let i=0; i<result1.length; i++) {
        let item = {};
        item.image = result1[i].link;
        item.snippet = result1[i].snippet;
        item.thumbnail = result1[i].image.thumbnailLink;
        item.context = result1[i].image.contextLink;
        display.push(item);
      }           
      response.send(display);
    } catch (e) {
      console.error(e.message);
    }
  });
}).on('error', (e) => {
  console.error(`Got error: ${e.message}`);
});   

})

app.get("/api/latest", function(req, res){
  
  res.send("hello");
})

var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
