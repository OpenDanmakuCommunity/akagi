var express = require('express');
var bodyParser = require('body-parser');
try{
	var config = require('./config.js');
} catch(e) {
	console.log('Please confirm that a config.js file is present in the working directory');
	process.exit(1);
}

var app = express();

if(config.http.compress){
	var compress = require('compression');
	app.use(compress({
		threshold:512
	}));
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(function (req, res, next) {
	res.header("X-powered-by", "Akagi");
	next();
})

app.use(function (req, res, next) {
	if(config.http.allowAll){
		req.auth = { status: true, uid: '' };
		next();
	} else {
		var db = require('./lib/db');
		if(typeof req.headers['authorization'] !== 'string'){
			req.auth = { status: false, uid: null };
			next();
			return;
		}
		var authKeys = req.headers['authorization'].split(' ');
		if(authKeys.length < 2 || authKeys[0].toLowerCase() !== 'basic'){
			// Proto Error
			req.auth = { status: false, uid: null };
			next();
			return;
		}
		try{
			var userToken = (new Buffer(authKeys[1], 'base64')).toString('utf8');
			var fields = userToken.split(':');
			var uid = fields[0], token = fields[1];
			req.authUser = {
				username: uid,
				password: token
			};
			db.checkToken(uid, token, function(err, result, type){
				if(err){
					req.auth = { status: false, uid: null };
					next();
					return;
				}
				if(result === true){
					req.auth = { status: true, uid: uid, type: type };
					next();
					return;
				} else {
					req.auth = { status: false, uid: null };
					next();
					return;
				}
			});
		} catch (e) {
			req.auth = { status: false, uid: null };
			next();
			return;
		}
	}
});

if(typeof config.http.cors === 'object' && config.http.cors !== null){
	app.use(function(req, res, next){
		res.header('Access-Control-Allow-Origin', config.http.cors.allow);
		next();
	});
}

var port = process.env.PORT || config.http.port || 8080;

var api = require('./lib/api');
api.init(config);
app.use('/api', api.router);


// Default Sanity Check
app.get('/',function(req, res) {
	res.json({
		'message': 'Akagi, up and ready!'
	});
}); 

app.get('*',function(req, res) {
	res.status(404, 'Not Found');
	res.json({
		'error': 'No API binding at resource'
	});
});

app.delete('*',function(req, res) {
	res.status(405, 'Method not allowed');
	res.json({
		'error': 'Cannot perform delete at resoursce'
	});
});

app.listen(port);
console.log('Akagi running on port ' + port);
