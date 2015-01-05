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
	var token = exports.createToken(64);
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
			client.set('token:' + uid + ':' + token, value, function(err, dat){
				if(err){
					callback(err, token);
				}else{
					callback(null, token);
				}
			});
		}
	});
};

exports.removeIdentToken = function(uid, tokenId, callback){
	exports.del('token:' + uid + ':' + token, function(err, data){
		if(err){
			callback(err, false);
			return;
		} else {
			callback(null, true);
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
	client.get('token:' + uid + ':' + token, function(err, data){
		if(err){
			callback(err, false, null);
			return;
		}else{
			callback(null, data !== null, data);
		}
	});
};

exports.checkUser = function(uid, pass, callback){
	if(typeof callback !== "function"){
		callback = _defaultCallback;
	}
	if(typeof uid !== 'string' || typeof pass !== 'string'){
		callback(new Error('Invalid type for uid or password'), false);
		return;
	}
	if(client === null || !client.connected){
		callback(new Error('Database not connected'), false);
		return;
	}
	client.sismember('user:' + uid + ':passwords', pass, function(err, data){
		if(err){
			callback(err, false);
			return;
		}
		if(typeof data === 'string'){
			data = parseInt(data, 10);
		}
		callback(null, data > 0);
	});
};

exports.getDanmaku = function(resourceId, pools, callback){
	if(typeof pools === 'string'){
		pools = [ pools ];
	}
	if(pools.length < 1){
		callback(null, []);
		return;
	}
	if(pools.length === 1){
		client.lrange(['dmlist:' + pools[0] + ':' + resourceId, 0, -1], function(err, data){
			if(err){
				callback(err, null);
				return;
			}
			var list = data;
			if(list === null || list.length === 0){
				callback(null, []);
			} else {
				client.mget(list, function(err, data){
					if(err){
						callback(err, null);
						return;
					}
					var dmo = [];
					for(var i = 0; i < data.length; i++){
						try{
							var dm = JSON.parse(data[i]);
							dmo.push(dm);
						} catch(e) {}
					}
					callback(null, dmo);
				});
			}
		});
	} else {
		// TODO: Implement multi-pool support
		callback(new Error('Multi Pools not implemented yet'), null);
	}
};

exports.createDanmaku = function(resourceId, poolId, danmaku, callback){
	// Allocate a danmaku ID 
	client.incr('pool:' + poolId + ':lastId', function(err, dmId){
		if(err){
			callback(err, null);
			return;
		} else {
			//Write danmaku
			client.set('dm:' + poolId + ':' + dmId, JSON.stringify(danmaku), function(err, data){
				if(err){
					callback(err, null);
					return;
				}
				client.lpush('dmlist:'  + poolId + ':' + resourceId, 'dm:' + poolId + ':' + dmId, function(err, data){
					if(err){
						callback(err, null);
						return;
					}
					callback(null, dmId);
				});
			});
		}
	});
};

exports.getResource = function(resource, callback){
	client.hgetall('res:' + resource, function(err, data){
		if(err){
			callback(err, null);
			return;
		}
		callback(null, data);
	});
};

exports.createResource = function(resource, data, callback){
	exports.getResource(resource, function(err, dt){
		if(err){
			callback(err, false);
			return;
		}
		if(dt !== null && typeof dt === 'object'){
			callback(null, false);
			return;
		}
		client.hmset('res:' + resource, data, function(err, d){
			if(err){
				callback(err, false);
				return;
			}
			callback(null, true);
		});
	});
};

exports.registerTags = function(tags, data, callback){
	// Registers tags so we can search for resources
};

exports.getPool = function(pool, callback){
	client.hgetall('pool:' + pool, function(err, data){
		if(err){
			callback(err, null);
			return;
		}
		callback(null, data);
	});
};

exports.createPool = function(pool, pdata, callback){
	exports.getPool(pool, function(err, data){
		if(err){
			callback(err, false);
			return;
		}
		if(data === null || typeof data['name'] === 'undefined'){
			client.hmset('pool:' + pool, pdata, function(err, data){
				if(err){
					callback(err, false);
					return;
				}
				client.sadd('user:' + pdata.owner + ':pools', pool, function(err, data){
					if(err){
						callback(err, false);
						return;
					}
					callback(null, true);
				});
			}); 
		} else {
			callback(null, false);
		}
	});
};

exports.deletePool = function(pool, callback){
	exports.getPool(pool, function(err, data){
		if(err){
			callback(err, false);
			return;
		}
		if(data === null || typeof data['name'] === 'undefined'){
			callback(new Error('Pool does not exist'), false);
			return;
		}
		var poolData = data;
		client.del('pool:' + pool, function(err, data){
			if(err){
				callback(err, false);
				return;
			}
			client.srem('user:' + poolData.owner + ':pools', pool, function(err, data){
				if(err){
					callback(err, false);
					return;
				}
				callback(null, true);
			});
		});
	});
}
