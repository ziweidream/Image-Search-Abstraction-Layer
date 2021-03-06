var https = require('https');
var MongoClient = require('mongodb').MongoClient;
var express = require('express');
var app = express();

function saveQuery(str) {
  var url = process.env.MONGODB_URI;;
  MongoClient.connect(url, function(err, db) {
    if (err)
      throw err;
    var dbo = db.db("images_fcc");
    var t = Date();
    var myobj = {
      term: str,
      when: t
    };
    dbo.collection("latest").insertOne(myobj, function(err, res) {
      if (err)
        throw err;  
      db.close();
    });
  });
}

app.use(express.static('public'));

app.get("/", function(request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

app.get('/image/:q', function(req, res) {
  saveQuery(req.params.q);
  const API_KEY = process.env.API_KEY;
  const CSE_ID = process.env.CSE_ID;
  var offset = req.query.offset || 1;
  const strUrl = 'https://www.googleapis.com/customsearch/v1?key=' + API_KEY + '&cx=' + CSE_ID + '&q=' + req.params.q + '&searchType=image&start=' + offset;
  https.get(strUrl, (response) => {
    const statusCode = response.statusCode;
    var error;
    if (statusCode !== 200) {
      error = new Error('Request Failed.\n' + `Status Code: ${statusCode}`);
    }
    if (error) {
      console.error(error.message);
      response.resume();
      return;
    }
    response.setEncoding('utf8');
    var apiData = '';
    response.on('data', (chunk) => {
      apiData += chunk;
    });
    response.on('end', () => {
      try {
        const result = JSON.parse(apiData);
        const result1 = result.items;
        var display = [];
        for (let i = 0; i < result1.length; i++) {
          let item = {};
          item.image = result1[i].link;
          item.snippet = result1[i].snippet;
          item.thumbnail = result1[i].image.thumbnailLink;
          item.context = result1[i].image.contextLink;
          display.push(item);
        }
        res.send(display);
      } catch (e) {
        console.error(e.message);
      }
    });
  }).on('error', (e) => {
    console.error(`Got error: ${e.message}`);
  });
});

app.get('/latest', function(req, res) {
  var url = process.env.MONGODB_URI;
  MongoClient.connect(url, function(err, db) {
    if (err)
      throw err;
    var dbo = db.db("images_fcc");
    var sort = {
      when: -1
    };
    dbo.collection("latest").find({}, {_id: 0}).sort(sort).limit(10).toArray(function(err, result) {
      if (err)
        throw err;
      res.send(result);
      db.close();
    });
  });
})

var listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});
