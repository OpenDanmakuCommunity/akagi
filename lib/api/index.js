var express = require('express');
var db = require('../db');
var router = express.Router();
var config = null;


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
	if(!req.auth.status){
		res.status(401, 'Not Authorized');
		res.json({
			'message':'Please provide authenticate with management user and management token to create pools'
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
	}
	db.createPool(req.param('id'), req.body, function(err, result){
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
});

router.post('/res/:id', function(req, res) {
	// Creates resource
});

router.put('/res/:id', function(req, res) {
	// Updates resource
});

router.delete('/res/:id', function(req, res) {
	// Deletes resource
});

/** Pooling Data **/

router.get('/auth', function(req, res) {
	if(typeof req.headers['authorization'] !== 'string'){
		res.status(401, 'Not Authorized');
		res.header('WWW-Authenticate', 'Basic realm="Akagi User"');
		res.json({
			'message':'Provide user credentials to get authorization token.'
		});
	} else {
		res.json({
			'message': 'Akagi, ready!'
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
