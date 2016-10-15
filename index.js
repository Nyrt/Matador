var express = require('express');
var app = express();
var http = require('http');
var https = require('https');
var bodyParser = require('body-parser')
var stockdriver = require('./data_driver.js');

//var mongoUri = "mongodb://localhost/matador";
var mongoUri = "mongodb://heroku_3r2wzlwq:d6v5lr57ljp7ge1agj4i8v837i@ds047592.mlab.com:47592/heroku_3r2wzlwq"
var MongoClient = require('mongodb').MongoClient, format = require('util').format;
var db = MongoClient.connect(mongoUri, function(error, databaseConnection) {
        db = databaseConnection;
});


app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  response.render('pages/index');
});

app.get('/login', function(request, response) {
  response.render('pages/login');
});

app.get('/buysell', function(request, response) {
  response.render('pages/buysell');
});

app.get('/portfolio', function(request, response) {
  response.render('pages/portfolio');
});

app.post('/getQuote', function(request, response) {
  stockdriver.getRealtimeData([request.body.symbol], function(data) {
    response.send(data);
  });
});

function authenticate(id_token, callback) {
  var options = {
    host: "www.googleapis.com",
    path: "/oauth2/v3/tokeninfo?id_token=" + id_token
  }
  var request = https.get(options, function(response) {
    var raw_data = '';
    response.on("data", function(chunk) {
      raw_data += chunk;
    });
    response.on("end", function() {
      var data = JSON.parse(raw_data);
      callback(data);
    });
  });
}

app.get('/userProfile', function(request, response) {
  console.log(request.query.id_token);
  authenticate(request.query.id_token, function (user) {
    db.collection('users').find({'id_token': user.sub}).toArray(function (err, cursor) {
      if (err) { response.send(500) }
      else {
        if (cursor.length == 0) {
          db.collection('users').insert({'id_token': user.sub, 'email': user.email, 'money': 10000, 'stocks': {}});
          response.send({'email': user.email, 'money': 10000, 'stocks': {}});
        } else {
          response.send({'email': cursor[0].email, 'money': cursor[0].money, 'stocks': cursor[0].stocks});
        }
      }
    });
  });
});

app.post('/buyStock', function(request, response) {
  authenticate(request.body.id_token, function(user) {
    console.log(request.body.symbol.toUpperCase());
    stockdriver.getRealtimeData([request.body.symbol.toUpperCase()], function(data) {
      if (data.Ask == null) { response.send({msg: "Invalid symbol"}); }
      else {
        var price = parseFloat(data.AskRealtime || data.Ask) * parseFloat(request.body.quantity);
        db.collection('users').find({id_token: user.sub}).toArray(function (err, cursor) {
          if (err) { response.send(500) }
          else {
            if (cursor.length == 0) {
              response.send({msg: "That login does not exist."});
            } else {
              if (cursor[0].money < price) {
                response.send({msg: "Not enough money."});
              } else {
                var stock_json = cursor[0].stocks;
                if (!(request.body.symbol.toUpperCase() in stock_json) || stock_json[request.body.symbol.toUpperCase()].quantity <= 0) {
                  stock_json[request.body.symbol.toUpperCase()] = {'quantity': parseInt(request.body.quantity), 'net_spent': price};
                } else {
                  stock_json[request.body.symbol.toUpperCase()] = {'quantity': stock_json[request.body.symbol.toUpperCase()].quantity + parseInt(request.body.quantity),
                                                     'net_spent': stock_json[request.body.symbol.toUpperCase()].net_spent + price };
                }
                db.collection('users').update({'id_token': user.sub},
                                                {'id_token': user.sub,
                                                 'email': user.email,
                                                 'money': cursor[0].money - price,
                                                 'stocks': stock_json});
                console.log(stock_json);
                response.send({'email': user.email,
                               'money': cursor[0].money - price,
                               'stocks': stock_json});
              }
            }
          }
        });
      }
    });
  });
});

app.post('/sellStock', function(request, response) {
  authenticate(request.body.id_token, function(user) {
    db.collection('users').find({'id_token': user.sub}).toArray(function (err, cursor) {
      if (err) { response.send(500) }
      else {
        if (cursor.length == 0) {
          response.send({msg: "That login does not exist."});
        } else {
          stockdriver.getRealtimeData([request.body.symbol.toUpperCase()], function(data) {
            if (data.Ask == null) { response.send({msg: "Invalid symbol"}); }
            else {
              if (!(request.body.symbol.toUpperCase() in cursor[0].stocks)) { response.send({msg: "You haven't purchased this stock!"}); }
              else {
                if (cursor[0].stocks[request.body.symbol.toUpperCase()] < parseInt(request.body.quantity)) {
                  response.send({msg: "Not enough stocks purchased"});
                } else {
                  var price = parseFloat(data.AskRealtime || data.Ask) * parseFloat(request.body.quantity);
                  var stock_json = cursor[0].stocks;
                  if (cursor[0].stocks[request.body.symbol.toUpperCase()].quantity <= 1) {
                    delete stock_json[request.body.symbol.toUpperCase()];
                  } else {
                    stock_json[request.body.symbol.toUpperCase()] = {'quantity': stock_json[request.body.symbol.toUpperCase()].quantity - parseInt(request.body.quantity),
                                                       'net_spent': stock_json[request.body.symbol.toUpperCase()].net_spent - price };
                  }
                  db.collection('users').update({'id_token': user.sub},
                                                {'id_token': user.sub,
                                                 'email': user.email,
                                                 'money': cursor[0].money + price,
                                                 'stocks': stock_json});
                  response.send({'email': user.email,
                                 'money': cursor[0].money + price,
                                 'stocks': stock_json});
                }
              }
            }
          });
        }
      }
    });
  });
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});


