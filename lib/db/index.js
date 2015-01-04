var redis = require('redis');
var config = null, client = null;

var _defaultCallback = function(err, data){
	if(err){
		throw err;
	}
};

exports.init = function(conf){
	config = conf;
	var rhost = conf.database.host || 'localhost';
	var rport = conf.database.port || 6739;
	client = redis.createClient(conf);
};

exports.createToken = function(len){
	var a = 'abcdefghijlkmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	var out = '';
	while(len > 0){
		len --;
		out += a.charAt(Math.floor(Math.random() * a.length));
	}
	return out;
};

exports.createIdentToken = function(uid, value, ttl, callback){
	var token = exports.createToken(len);
	exports.checkToken(uid, token, function(err, result, data){
		if(err){
			callback(err, null);
			return;
		}
		if(result){
			// Exists
			exports.createIdentToken(uid, value, ttl, callback);
			return;
		} else {
			client.set(uid + ':' + token, function(err, dat){
				if(err){
					callback(err, token);
				}else{
					callback(null, token);
				}
			});
		}
	});
};

exports.checkToken = function(uid, token, callback){
	if(typeof callback !== 'function'){
		callback = _defaultCallback;
	}
	if(typeof uid !== 'string' || typeof token !== 'string'){
		callback(new Error('Invalid type for uid or token'), false, null);
		return;
	}
	if(client === null || !client.connected){
		callback(new Error('Database not connected'), false, null);
		return;
	}
	client.get(uid + ':' + token, function(err, data){
		if(err){
			callback(err, false, null);
			return;
		}else{
			callback(null, true, data);
		}
	});
};

exports.getPool = function(pool, callback){
	client.hgetall(pool, function(err, data){
		if(err){
			callback(err, null);
			return;
		}
		callback(null, data);
	});
};

exports.createPool = function(pool, data, callback){
	exports.getPool(pool, function(err, data){
		if(err){
			callback(err, false);
			return;
		}
		if(data === null || typeof data['name'] === 'undefined'){
			client.hmset(pool, data, function(err, data){
				if(err){
					callback(err, false);
					return;
				}
				callback(null, true);
			}); 
		} else {
			callback(null, false);
		}
	});
};
