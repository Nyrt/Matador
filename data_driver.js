module.exports = {

	getOpen: function (stock, callback){
    var http = require('http');
		token = "/v1/public/yql?q=select%20*%20from%20yahoo.finance.quotes%20where%20symbol%20in%20(%22" + stock + "%22)&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=";
    var options = {
        host: "query.yahooapis.com",
        path: token
    };

		var request = http.get(options,
			// callback function that recieves the data and returns it
			function(response)
			{
        console.log("Got response\n");
				//if(response.statusCode == 200)
				//{
					var raw_data = '';
					//callback function that concatenates chunks of data as they are recieved
					response.on("data", function(chunk)
					{
							raw_data += chunk;
              console.log("got a chunk");
					});

					//call back function that returns the collected data
					response.on("end", function()
					{
            console.log(JSON.parse(raw_data).query.results.quote);
						callback(JSON.parse(raw_data).query.results.quote);
					});
				//}
			}
		);
		request.end();
	},

	getRealtimeData: function (stocks, callback){
    var http = require('http');
		token = "/v1/public/yql?q=select%20*%20from%20yahoo.finance.quotes%20where%20symbol%20in%20(";
    stocks.forEach(function(stock) { token += stock + "%2C"; });


		token = token.substring(0, token.length-3) + ")&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=";

    var options = {
        host: "query.yahooapis.com",
        path: token
    };

		var request = http.get(options,
			// callback function that recieves the data and returns it
			function(response)
			{
        console.log("Got response\n");
				//if(response.statusCode == 200)
				//{
					var raw_data = '';
					//callback function that concatenates chunks of data as they are recieved
					response.on("data", function(chunk)
					{
							raw_data += chunk;
              console.log("got a chunk");
					});

					//call back function that returns the collected data
					response.on("end", function()
					{
            callback(JSON.parse(raw_data).query.results.quote);
					});
				//}
			}
		);
		request.end();
	},

	getHistorical: function (stock, callback){
    var http = require('http');
		token = "/instrument/1.0/" + stock +"/chartdata;type=quote;range=1d/json"
    var options = {
        host: "chartapi.finance.yahoo.com",
        path: token
    };

		var request = http.get(options,
			// callback function that recieves the data and returns it
			function(response)
			{
        console.log("Got response\n");
				//if(response.statusCode == 200)
				//{
					var raw_data = '';
					//callback function that concatenates chunks of data as they are recieved
					response.on("data", function(chunk)
					{
							raw_data += chunk;
              console.log("got a chunk");
					});

					//call back function that returns the collected data
					response.on("end", function()
					{
						callback(JSON.parse(raw_data.substring(29, raw_data.length - 1)));
					});
				//}
			}
		);
		request.end();
	}
};