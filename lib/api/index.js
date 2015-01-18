var express = require('express');
var db = require('../db');
var router = express.Router();
var config = null;

router.options('*', function(req, res){
	res.header('Access-Control-Allow-Methods', config.http.cors.methods);
	res.header('Access-Control-Allow-Headers', 'authorization');
	next();
});

router.get('/', function(req, res) {
	if(!config){
		res.json({
			'error': 'Config not initialized. Please check!'
		});
	} else {
		res.json({
			'message': 'Akagi, APIs ready!',
			'auth': req.auth
		});
	}
});

/** Pool Actions **/
router.get('/pool/:id', function(req, res) {
	db.getPool(req.param('id'), function(err, data){
		if(err){
			res.status(500, 'Internal Error');
			res.json({
				'error': 'Error retrieving resource'
			});
			return;
		}
		if(data === null || typeof data['name'] === 'undefined'){
			res.status(404, 'Not Found');
			res.json({
				'error': 'Resource does not exist'
			});
			return
		}
		res.json({
			'name': data['name'],
			'description': data['description'],
			'owner': data['owner'],
			'read': data['read'] === 'true',
			'write': data['write'] === 'true'
		});
	});
});

router.post('/pool/:id', function(req, res) {
	if(!req.auth.status || req.auth.type !== 'manage'){
		res.status(401, 'Not Authorized');
		res.header('WWW-Authenticate', 'Basic realm="Akagi Manage Token"');
		res.json({
			'message':'Please provide authentication with management user and management token to create pools'
		});
		return;
	}
	var poolData = req.body;
	if(!poolData.hasOwnProperty('name') || !poolData.hasOwnProperty('description')
		|| !poolData.hasOwnProperty('read') || !poolData.hasOwnProperty('write')){
		res.status(400, 'Bad Request');
		res.json({
			'error':'Missing required fields. Cannot create pool'
		});
		return;
	}else{
		poolData = {
			"name":req.body.name,
			"description":req.body.description,
			"read":req.body.read ? 'true' : 'false',
			"write":req.body.write ? 'true' : 'false',
			"owner":req.auth.uid
		};
	}
	db.createPool(req.param('id'), poolData, function(err, result){
		if(err){
			res.status(500, 'Internal Error');
			res.json({
				'error':'Error checking resource availability'
			});
			return;
		}
		if(!result){
			res.status(405, 'Method Not Allowed');
			res.json({
				'error':'Pool id exists.'
			});
			return;
		}
		res.status(201, 'Created');
		res.json({
			'message':'Successfully created'
		});
	});
});

router.put('/pool/:id', function(req, res) {
	
});

router.delete('/pool/:id', function(req, res) {
	
});

/** Resource Actions **/
router.get('/res/:id', function(req, res) {
	// Read resource
	if(req.param('id') === null || req.param('id').length < 1){
		res.status(404, 'Not Found');
		res.json({
			'error': 'Resource not registered'
		});
	} 
	db.getResource(req.param('id'), function(err, data){
		if(err){
			res.status(500, 'Internal Error');
			res.json({
				'error':'Internal Error while fetching resource information'
			});
			return;
		}
		if(data === null){
			res.status(404, 'Not Found');
			res.json({
				'error':'Resource not registered'
			});
			return;
		}
		var resource = {
			'name': data['name'] ? data['name'] : '',
			'tags': data['tags'] ? data['tags'].split(',') : [],
			'description': data['description'] ? data['description'] : '',
			'modify': (typeof data['modify'] === 'string') ? data['modify'] : null,
		};
		res.json(resource);
	});
});

router.post('/res/:id', function(req, res) {
	// Creates resource
	if(!req.auth.status || req.auth.type !== 'manage'){
		res.status(401, 'Not Authorized');
		res.header('WWW-Authenticate', 'Basic realm="Akagi Manage Token"');
		res.json({
			'message':'Please provide authentication with management user and management token to create resources'
		});
		return;
	}
	if(req.param('id') === null || req.param('id').length < 1){
		res.status(400, 'Bad Request');
		res.json({
			'error':'Must provide a valid resource id'
		});
		return;
	}
	var resource = {
		'name': (typeof req.body.name === 'string') ? req.body.name : '',
		'description': (typeof req.body.description === 'string') ? req.body.description : '',
	};
	var tags = [];
	if(typeof req.body.tags !== 'undefined' && typeof req.body.tags.length === 'number' && req.body.tags.length > 0){
		resource['tags'] = req.body.tags.join(',');
		tags = req.body.tags;
	}
	db.createResource(req.param('id'), resource, function(err, data){
		if(err){
			res.status(500, 'Internal Error');
			res.json({
				'error':'Internal Error while creating resource'
			});
		}
		if(data){
			res.status(201, 'Created');
			res.json({
				'message':'Resource created'
			});
		}else{
			res.status(405, 'Method not allowed');
			res.json({
				'error':'Resource already exists'
			});
		}
	});
});

router.put('/res/:id', function(req, res) {
	// Updates resource
});

router.delete('/res/:id', function(req, res) {
	// Deletes resource
});

/** Danmaku Actions **/
router.get('/dm/:poolId/:resourceId', function(req, res){
	var resId = req.param('resourceId');
	var poolId = req.param('poolId');
	if(resId === null || poolId === null || resId.length < 1 || poolId.length < 1){
		res.status(400, 'Bad Request');
		res.json({
			'error':'Provided pool or resource id is illegal'
		});
		return;
	};
	db.getPool(poolId, function(err, pdata){
		if(err){
			res.status(500, 'Internal Error');
			res.json({
				'error':'Internal Error while fetching pool information'
			});
			return;
		}
		if(pdata === null){
			res.status(404, 'Not Found');
			res.json({
				'error':'Pool does not exist'
			});
			return;
		}
		if(pdata.read === 'true' || (req.auth.status && pdata.owner === req.auth.uid)){
			db.getDanmaku(resId, poolId, function(err,data){
				if(err){
					res.status(500, 'Internal Error');
					res.json({
						'error':'Internal Error while retrieving danmaku'
					});
					return;
				}
				res.json({
					'count':data.length,
					'list':data
				});
			});
		} else {
			res.status(401, 'Not Authorized');
			res.header('WWW-Authenticate', 'Basic realm="Akagi Access Token"');
			res.json({
				'error':'Private pool: Please provide a valid access token to view danmaku'
			});
		}
	});
});

router.post('/dm/:poolId/:resourceId', function(req, res){
	var resId = req.param('resourceId');
	var poolId = req.param('poolId');
	if(resId === null || poolId === null || resId.length < 1 || poolId.length < 1){
		res.status(400, 'Bad Request');
		res.json({
			'error':'Provided pool or resource id is illegal'
		});
		return;
	};
	db.getPool(poolId, function(err, data){
		if(err){
			res.status(500, 'Internal Error');
			res.json({
				'error':'Internal Error fetching pool information'
			});
			return;
		}
		if(data === null){
			res.status(404, 'Not Found');
			res.json({
				'error':'Pool does not exist'
			});
			return;
		};
		if(data.write === 'true' || (req.auth.status && data.owner === req.auth.uid)){
			// Allowed to post, check if resource is ok
			db.getResource(resId, function(err, data){
				if(err){
					res.status(500, 'Internal Error');
					res.json({
						'error':'Internal Error fetching resource information'
					});
					return;
				}
				if(data === null){
					res.status(404, 'Not Found');
					res.json({
						'error':'Resource is not registered'
					});
					return;
				} else {
					if(typeof req.body.text !== 'string' || typeof req.body.stime !== 'number' ||
						req.body.text.length < 1 || req.body.stime < 0){
						res.status(400, 'Bad Request');
						res.json({
							'error':'Danmaku format error. Please provide valid text and stime info'
						});
						return;
					};
					var danmaku = {
						'text': req.body.text,
						'stime': req.body.stime,
						'time': (new Date()).toISOString(),
						'type': (typeof req.body.mode === "string") ? req.body.mode : 'scroll',
						'color': (typeof req.body.color === "number") ? req.body.color : 0xffffff,
						'size': (typeof req.body.size === "number") ? req.body.size : 25,
						'author': (typeof req.body.author === "string") ? req.body.author : null,
						'extra': req.body.extra
					};
					db.createDanmaku(resId, poolId, danmaku, function(err, data){
						if(err){
							res.status(500, 'Internal Error');
							res.json({
								'error':'Internal Error writing danmaku data'
							});
							return;
						}
						res.status(201, 'Created');
						res.json({
							'id':data,
							'time':danmaku.time
						});
					});
				}
			});
		} else {
			res.status(401, 'Not Authorized');
			res.header('WWW-Authenticate', 'Basic realm="Akagi Access Token"');
			res.json({
				'error':'Please provide valid access token to post danmaku.'
			});
		}
	});
});

/** Pooling Data **/

router.get('/token/manage', function(req, res) {
	if(typeof req.headers['authorization'] !== 'string' || typeof req.authUser === 'undefined'){
		res.status(401, 'Not Authorized');
		res.header('WWW-Authenticate', 'Basic realm="Akagi User"');
		res.json({
			'message':'Provide user credentials to get authorization token.'
		});
	} else {
		db.checkUser(req.authUser.username, req.authUser.password, function(err, data){
			if(err){
				res.status(500, 'Internal Error');
				res.json({
					'error':'Internal error while checking credentials'
				});
				return;
			}
			if(!data){
				// Not authorized
				res.status(401, 'Not Authorized');
				res.header('WWW-Authenticate', 'Basic realm="Akagi User"');
				res.json({
					'error':'Authorization failed. Please check credentials'
				});
			}
			db.createIdentToken(req.authUser.username, 'manage', -1, function(err, data){
				if(err){
					res.status(500, 'Internal Error');
					res.json({
						'error':'Internal error while creating identity tokens'
					});
					return;
				}
				res.json({
					'token': data
				});
			});
		});
	}
});

router.get('/token/access', function(req, res){
	if(typeof req.headers['authorization'] !== 'string' || typeof req.authUser === 'undefined'){
		res.status(401, 'Not Authorized');
		res.header('WWW-Authenticate', 'Basic realm="Akagi User"');
		res.json({
			'message':'Provide user credentials to get authorization token.'
		});
	} else {
		db.checkUser(req.authUser.username, req.authUser.password, function(err, data){
			if(err){
				res.status(500, 'Internal Error');
				res.json({
					'error':'Internal error while checking credentials'
				});
				return;
			}
			if(!data){
				// Not authorized
				res.status(401, 'Not Authorized');
				res.header('WWW-Authenticate', 'Basic realm="Akagi User"');
				res.json({
					'error':'Authorization failed. Please check credentials'
				});
			}
			db.createIdentToken(req.authUser.username, 'access', -1, function(err, data){
				if(err){
					res.status(500, 'Internal Error');
					res.json({
						'error':'Internal error while creating identity tokens'
					});
					return;
				}
				res.json({
					'token': data
				});
			});
		});
	}
});

router.get('/token/store/:tokenId', function(req, res) {
	if(typeof req.headers['authorization'] !== 'string' || typeof req.authUser === 'undefined'){
		res.status(401, 'Not Authorized');
		res.header('WWW-Authenticate', 'Basic realm="Akagi User"');
		res.json({
			'message':'Provide user credentials to get authorization token.'
		});
	} else {
		db.checkUser(req.authUser.username, req.authUser.password, function(err, data){
			if(err){
				res.status(500, 'Internal Error');
				res.json({
					'error':'Internal error while checking credentials'
				});
				return;
			}
			if(!data){
				// Not authorized
				res.status(401, 'Not Authorized');
				res.header('WWW-Authenticate', 'Basic realm="Akagi User"');
				res.json({
					'error':'Authorization failed. Please check credentials'
				});
				return;
			}
			db.checkToken(req.authUser.username, req.param('tokenId') , function(err, result, data){
				if(err){
					res.status(500, 'Internal Error');
					res.json({
						'error':'Internal error while checking token'
					});
					return;
				}
				if(!result){
					res.status(404, 'Not Found');
					res.json({
						'error': 'No token was found under this given id'
					});
					return;
				} else{
					res.json({
						'token': req.param('tokenId'),
						'type': data
					});
				}
			});
		});
	}
});

router.delete('/token/store/:tokenId', function(req,res) {
	if(typeof req.headers['authorization'] !== 'string' || typeof req.authUser === 'undefined'){
		res.status(401, 'Not Authorized');
		res.header('WWW-Authenticate', 'Basic realm="Akagi User"');
		res.json({
			'message':'Provide user credentials to delete authorization token.'
		});
	} else {
		if(req.param('tokenId') === null || req.param('tokenId').length < 16){
			res.status(404, 'Not Found');
			res.json({
				'error':'Token id not found.'
			});
			return;
		}
		db.checkUser(req.authUser.username, req.authUser.password, function(err, data){
			if(err){
				res.status(500, 'Internal Error');
				res.json({
					'error':'Internal error while checking credentials'
				});
				return;
			}
			if(!data){
				res.status(401, 'Not Authorized');
				res.header('WWW-Authenticate', 'Basic realm="Akagi User"');
				res.json({
					'message':'Provide user credentials to delete authorization token.'
				});
				return;
			}
			db.removeIdentToken(req.authUser.username, req.param('tokenId'), function(err, data){
				if(err){
					res.status(500, 'Internal Error');
					res.json({
						'error':'Internal error while deleting identity tokens'
					});
					return;
				}
				res.json({
					'success': data
				});
			});
		});
	}
});

module.exports = {
	"router":router,
	"init": function(conf){
		config = conf;
		db.init(conf);
	}
}
