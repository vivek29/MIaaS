// app/routes.js
var	constants = require('./constants');
var mongoose = require('mongoose');
 var http = require('http');
var querystring = require('querystring');
var my_token = "";
//var db = mongoose.connect('mongodb://localhost:27017/test1');

var Instances = new mongoose.Schema({
  	"TYPE" : { type: String, },
	"VCPU" : { type: String }, 
	"RAM" : { type: String, },
	"DISC_SIZE" : { type: String, },
	"BASE_PRICE" : { type: Number, min: 0 },
	"PRICE"	: { type: Number, min: 0 }
},{collection : 'Instance'});

module.exports = function(app, passport) {

	// =====================================
	// HOME PAGE (with login links) ========
	// =====================================
	app.get('/', function(req, res) {
		res.render('index.ejs'); // load the index.ejs file
	});

	// =====================================
	// LOGIN ===============================
	// =====================================
	// show the login form
	app.get('/login', function(req, res) {
		
		var options = {
			host	: '10.0.2.15',
			port	: 5000,
			path	: '/v2.0/tokens',
			method : 'POST',
			headers:{
				'Content-Type' : 'application/json'				
				}
			};
		var reqs = http.request(options,function(res){
				var response_recv="";
				var final_resp = "";
				var token = ""; 
					res.setEncoding('utf8');
				res.on('data',function(data){
					response_recv+=data
				});		
				res.on('end',function(){
					console.log("response received");	
					//final_resp = JSON.stringify(eval("("+response_recv+")"));
					//console.log(JSON.parse(response_recv));
					final_resp =  JSON.parse(response_recv);
					my_token = final_resp.access.token.id;
//					console.log(token);
				});
		});
		
		var myData = JSON.stringify({
					"auth": {
					"tenantName": "demo",
					"passwordCredentials": {
					    "username": "admin",
					    "password": "openstack"
					}
				    }
				});
		reqs.write(myData);
		reqs.end();
	

		// render the page and pass in any flash data if it exists
		res.render('login.ejs', { message: req.flash('loginMessage') });
	});

	// process the login form
	app.post('/login', passport.authenticate('local-login', {
		successRedirect : '/home', // redirect to the secure home section
		failureRedirect : '/login', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));

	// =====================================
	// SIGNUP ==============================
	// =====================================
	// show the signup form
	app.get('/signup', function(req, res) {

		// render the page and pass in any flash data if it exists
		res.render('signup.ejs', { message: req.flash('signupMessage') });
	});

	// process the signup form
	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect : '/home', // redirect to the secure home section
		failureRedirect : '/signup', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));

	// =====================================
	// home SECTION =========================
	// =====================================
	// we will want this protected so you have to be logged in to visit
	// we will use route middleware to verify this (the isLoggedIn function)
	app.get('/home', isLoggedIn, function(req, res) {
		res.render('home.ejs', {
			user : req.user // get the user out of session and pass to template
		});
	});

	app.get('/billing', isLoggedIn, function(req, res) {


			var options1 = {
			host	: '10.0.2.15',
			port	: 8774,
			path	: '/v2/9f03ec516dd8479f99d038f5201c5dc0/servers/detail',
			headers:{
				'Content-Type' : 'application/json',
				'X-Auth-Token' : my_token				
				}
			};

		var reqs1 = http.request(options1,function(resp1){
			
			var result = "";
			resp1.on('data',function(data){
				result+=data;
			});
			resp1.on('end',function(){
				//console.log(result);
				var final_result = JSON.parse(result);
				var inst_arr = [];
				var created_dt = "";
				final_result.servers.forEach(function(row){
					created_dt = new Date(row.created);
					var diff = Math.abs(new Date() - new Date(created_dt));
						
						
						var duration = (diff/(60*60*1000));
						console.log(duration);
						var durinint = parseInt(duration);
					var price = Math.floor((Math.random() * 10) + 2);
					price = (price/10).toFixed(2);
					var billing_amt = (duration*price).toFixed(2);
					inst_arr.push({'id': row.id,'instance':row.name,'time' : durinint,'price':billing_amt});
				
					});
				//console.log(inst_arr);
				res.render('billing.ejs', {
					user : req.user,
					data : inst_arr // get the user out of session and pass to template
				});
			});
			
		});
		reqs1.end();


		//var instanceSc = mongoose.model('Instance',Instances);

		/*instanceSc.find({},function(err,data){
			res.render('billing.ejs', {
			user : req.user,
			data : data // get the user out of session and pass to template
			});

		});*/
	});

	app.get('/morris', isLoggedIn, function(req, res) {
		res.render('morris.ejs', {
			user : req.user // get the user out of session and pass to template
		});
	});

	app.get('/flot', isLoggedIn, function(req, res) {
		res.render('flot.ejs', {
			user : req.user // get the user out of session and pass to template
		});
	});


	// =====================================
	// LOGOUT ==============================
	// =====================================
	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});

	app.get('/instance', isLoggedIn, function(req, res) {

		var options = {
			host	: '10.0.2.15',
			port	: 8774,
			path	: '/v2/9f03ec516dd8479f99d038f5201c5dc0/servers/detail',
			headers:{
				'Content-Type' : 'application/json',
				'X-Auth-Token' : my_token				
				}
			};

		var reqs = http.request(options,function(resp){
			
			var result = "";
			resp.on('data',function(data){
				result+=data;
			});
			resp.on('end',function(){
				//console.log(result);
				var final_result = JSON.parse(result);
				//console.log(final_result);
				var inst_arr = [];
				var addr = "";
				final_result.servers.forEach(function(row){
					if(row.addresses.private){
						addr = row.addresses.private[0].addr;
					}else{
						addr = "No IP";
					}
					
					inst_arr.push({'id': row.id,'name': row.name,'created':row.created.replace(/T/, ' ').replace(/\..+/, '').replace(/Z/, ' '), 'address': addr});
				
					});
				//console.log(inst_arr);
				res.render('instance.ejs', {
					user : req.user,
					data : inst_arr // get the user out of session and pass to template
					});
			});
			
			});
		reqs.end();

		//var instanceSc = mongoose.model('Instance',Instances);

		/*instanceSc.find({},function(err,data){
			res.render('instance.ejs', {
			user : req.user,
			data : data // get the user out of session and pass to template
			});

		});*/
	});
	app.post('/instance',function(req,res){

		var inst_name = req.body.instances;

		var obj = constants[inst_name];
		var inst_id = obj.ID;
		var server_name = "instance-"+Math.floor((Math.random() * 100) + 1);

			var options = {
			host	: '10.0.2.15',
			port	: 8774,
			path	: '/v2/9f03ec516dd8479f99d038f5201c5dc0/servers',
			method : 'POST',
			headers:{
				'Content-Type' : 'application/json',
				'X-Auth-Token' : my_token
				}
			};
		var reqs = http.request(options,function(resp){
				var response_recv="";
				var final_resp = "";
				
				resp.setEncoding('utf8');
				resp.on('data',function(data){
					response_recv+=data
				});		
				resp.on('end',function(){
					console.log("response received");	
					//console.log(response_recv);



					var options1 = {
						host	: '10.0.2.15',
						port	: 8774,
						path	: '/v2/9f03ec516dd8479f99d038f5201c5dc0/servers/detail',
						headers:{
							'Content-Type' : 'application/json',
							'X-Auth-Token' : my_token				
							}
						};

		var reqs1 = http.request(options1,function(resp1){
			
			var result = "";
			resp1.on('data',function(data){
				result+=data;
			});
			resp1.on('end',function(){
				//console.log(result);
				var final_result = JSON.parse(result);
				var inst_arr = [];
				final_result.servers.forEach(function(row){
					//inst_arr.push({'name': row.name,'status':row.status});
				if(row.addresses.private){
						addr = row.addresses.private[0].addr;
					}else{
						addr = "No IP";
					}
					
					inst_arr.push({'id': row.id,'name': row.name,'created':row.created.replace(/T/, ' ').replace(/\..+/, '').replace(/Z/, ' '), 'address': addr});


				
					});
				//console.log(inst_arr);
				res.render('instance.ejs', {
					user : req.user,
					data : inst_arr // get the user out of session and pass to template
				});
			});
			
		});
		reqs1.end();
				});
		});
		
		var myData = JSON.stringify({
					    "server": {
						"name": server_name,
						"imageRef": "93f4b647-5f8d-435e-aaa5-cac0f2aa3da2",
						"flavorRef": inst_id,
						"max_count": 1,
						"min_count": 1,
						"networks": [
						    {
							"uuid": "019e9594-4076-4cea-90bf-8527022dbd51"
						    }
						],
						"security_groups": [
						    {
							"name": "default"
						    }
						]
					    }
					});

		reqs.write(myData);
		reqs.end();
	});


app.post('/delInstance',isLoggedIn,function(req,res){

	console.log("delete instances");
	var id = req.body.instances;

	var options = {
			host	: '10.0.2.15',
			port	: 8774,
			path	: '/v2/9f03ec516dd8479f99d038f5201c5dc0/servers/'+id,
			method : 'DELETE',
			headers:{
				'Content-Type' : 'application/json',
				'X-Auth-Token' : my_token				
				}
			};

	console.log(req.body.instances);

	var reqs = http.request(options,function(resp){


			/*var result = "";*/
			resp.on('data',function(data){
				/*result+=data;*/
			});
			
			
			resp.on('end',function(){
				console.log("delete instance executed");
				
				var options1 = {
						host	: '10.0.2.15',
						port	: 8774,
						path	: '/v2/9f03ec516dd8479f99d038f5201c5dc0/servers/detail',
						headers:{
							'Content-Type' : 'application/json',
							'X-Auth-Token' : my_token				
							}
						};

		var reqs1 = http.request(options1,function(resp1){
			
			var result = "";
			resp1.on('data',function(data){
				result+=data;
			});
			resp1.on('end',function(){
				//console.log(result);
				console.log("get instance executed");
				var final_result = JSON.parse(result);
				var inst_arr = [];
				final_result.servers.forEach(function(row){
					//inst_arr.push({'name': row.name,'status':row.status});

				if(row.addresses.private){
						addr = row.addresses.private[0].addr;
					}else{
						addr = "No IP";
					}
					
					inst_arr.push({'id': row.id,'name': row.name,'created':row.created.replace(/T/, ' ').replace(/\..+/, '').replace(/Z/, ' '), 'address': addr});


				
					});
				//console.log(inst_arr);
				res.render('instance.ejs', {
					user : req.user,
					data : inst_arr // get the user out of session and pass to template
				});
			});
			
		});
		reqs1.end();

			});
			
			});
		reqs.end();




});

app.get('/monitor', isLoggedIn, function(req, res) {

		var options = {
			host	: '10.0.2.15',
			port	: 8774,
			path	: '/v2/9f03ec516dd8479f99d038f5201c5dc0/servers/detail',
			headers:{
				'Content-Type' : 'application/json',
				'X-Auth-Token' : my_token				
				}
			};

		var reqs = http.request(options,function(resp){
			
			var result = "";
			resp.on('data',function(data){
				result+=data;
			});
			resp.on('end',function(){
				//console.log(result);
				var final_result = JSON.parse(result);
				var inst_arr = [];
				final_result.servers.forEach(function(row){
					inst_arr.push({'name': row.name,'status':row.status});
				
					});
				//console.log(inst_arr);
				res.render('monitor.ejs', {
					user : req.user,
					data : inst_arr // get the user out of session and pass to template
					});
			});
			
			});
		reqs.end();

		//var instanceSc = mongoose.model('Instance',Instances);

		/*instanceSc.find({},function(err,data){
			res.render('instance.ejs', {
			user : req.user,
			data : data // get the user out of session and pass to template
			});

		});*/
	});

	app.get('/requestGenerator',function(req,res){

		var inst_name = "";
		var inst_val = 0;
		var obj_arr = [];
		for(var i=0;i<5;i++){
			inst_val = Math.floor((Math.random() * 7) + 1);

			if(inst_val===1){
				inst_name = "SMALL";
			}else if(inst_val===2){
				inst_name = "LARGE";
			}else if(inst_val===3){
				inst_name = "MEDIUM";
			}else if(inst_val===4){
				inst_name = "X_LARGE";
			}else if(inst_val===5){
				inst_name = "TINY";
			}else{
				inst_name = "MICRO";
			}

			var obj = constants[inst_name];
			
			
			var inst_id = obj.ID;
			var server_name = "instance-"+Math.floor((Math.random() * 100) + 1);

			var options = {
			host	: '10.0.2.15',
			port	: 8774,
			path	: '/v2/9f03ec516dd8479f99d038f5201c5dc0/servers',
			method : 'POST',
			headers:{
				'Content-Type' : 'application/json',
				'X-Auth-Token' : my_token
				}
			};
			var reqs = http.request(options,function(resp){
				var response_recv="";
				var final_resp = "";
				
				resp.setEncoding('utf8');
				resp.on('data',function(data){
					response_recv+=data
				});		
				resp.on('end',function(){
					console.log("response received");	
					console.log(response_recv);

					});
				});

			
			var myData = JSON.stringify({
					    "server": {
						"name": server_name,
						"imageRef": "93f4b647-5f8d-435e-aaa5-cac0f2aa3da2",
						"flavorRef": inst_id,
						"max_count": 1,
						"min_count": 1,
						"networks": [
						    {
							"uuid": "019e9594-4076-4cea-90bf-8527022dbd51"
						    }
						],
						"security_groups": [
						    {
							"name": "default"
						    }
						]
					    }
					});

			reqs.write(myData);
			reqs.end();
		}
		
		
			var options = {
			host	: '10.0.2.15',
			port	: 8774,
			path	: '/v2/9f03ec516dd8479f99d038f5201c5dc0/servers/detail',
			headers:{
				'Content-Type' : 'application/json',
				'X-Auth-Token' : my_token				
				}
			};

			var reqs = http.request(options,function(resp){
			
			var result = "";
			resp.on('data',function(data){
				result+=data;
			});
			resp.on('end',function(){
				//console.log(result);
				var final_result = JSON.parse(result);
				var inst_arr = [];
				final_result.servers.forEach(function(row){
					inst_arr.push({'name': row.name,'status':row.status});
				
					});
				console.log(inst_arr);
				res.render('instance.ejs', {
					user : req.user,
					data : inst_arr // get the user out of session and pass to template
					});
				});
			
			});
			reqs.end();			
	});
};

// route middleware to make sure
function isLoggedIn(req, res, next) {

	// if user is authenticated in the session, carry on
	if (req.isAuthenticated())
		return next();

	// if they aren't redirect them to the home page
	res.redirect('/');
}


