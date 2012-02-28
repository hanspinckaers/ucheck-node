/* 
** Copyright (c) 2011 by Hans Pinckaers 
**
** This work is licensed under the Creative Commons 
** Attribution-NonCommercial-ShareAlike 3.0 Unported License. 
** To view a copy of this license, visit 
** http://creativecommons.org/licenses/by-nc-sa/3.0/ 
**
** ucheck-php: https://github.com/HansPinckaers/ucheck-php
** ucheck-node: https://github.com/HansPinckaers/ucheck-node
**
*/

var express = require('express');
var https = require('https');
var htmlparser = require("htmlparser");
var select = require('soupselect').select;
var Fs = require('fs');

try
{
    stats = Fs.lstatSync("prowler-setup.js");
	
	var notification = require("./prowler-setup");	
}
catch (e)
{
    console.log("Geen Prowl aanwezig: "+e);
}

var requests = [];

var app = module.exports = express.createServer();

function get_token(length) {
	var chars = "ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
	var randomstring = '';
	for (var i=0; i<length; i++) {
		var rnum = Math.floor(Math.random() * chars.length);
		randomstring += chars.substring(rnum,rnum+1);
	}
	return randomstring+new Date().getTime();
}

app.configure(function(){
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
	app.use(express.errorHandler()); 
});

app.get('\/cijfers_token\/(([^\/]+))\/(([^\/]+))\/?', function(req, res)
{
	var token = get_token(10);
	
	requests[token] = {};
	
	req_cijfers(req.params[0], req.params[1], function(json){			
		if(requests[token]  && "listener" in requests[token]){
		 	var res = requests[token]["listener"];
			res.send(JSON.stringify(json));
			
			delete requests[token];
		} else if(requests[token]) {
			requests[token]['result'] = JSON.stringify(json);
		}
		
	});	
	
	setTimeout(function(){
		console.log("deleted: "+token);
		
		if(requests[token] && "listener" in requests[token]){
			var token_res = requests[token]["listener"];
			token_res.send("Invalid token.");
		}
		
		delete requests[token];
	}, 60000);	
	
	res.send(token);
});

app.get('\/inschrijvingen_token\/(([^\/]+))\/(([^\/]+))\/(([^\/]+))?\/?', function(req, res)
{
	var token = get_token(10);
	
	requests[token] = {};
	
	req_inschrijvingen(req.params[0], req.params[1],req.params[2], function(json){
		if(requests[token] && "listener" in requests[token]){
		 	var res = requests[token]["listener"];
			res.send(JSON.stringify(json));
			
			delete requests[token];
		} else if(requests[token]){
			requests[token]['result'] = JSON.stringify(json);
		}
	});
	
	setTimeout(function(){
		console.log("deleted: "+token);
	
		if(requests[token] && "listener" in requests[token]){
			var token_res = requests[token]["listener"];
			token_res.send("Invalid token.");
		}
		
		delete requests[token];
		
		
	}, 60000);	
	
	res.send(token);
});

app.get('\/token\/(([^\/]+))\/?', function(req, res)
{
	var token = req.params[0];
	
	if(!requests[token])
	{
		res.send("Invalid token.");
	} else {
		
		var request_dict = requests[token];
		
		if('result' in request_dict){
			res.send(request_dict['result']);
			
			delete requests[token];
		} else {
			request_dict['listener'] = res;
		}
	}
});


app.get('\/cijfers\/(([^\/]+))\/(([^\/]+))\/?', function(req, res)
{
	req_cijfers(req.params[0], req.params[1], function(json){
		res.send(JSON.stringify(json));
	});
});

app.get('\/inschrijvingen\/(([^\/]+))\/(([^\/]+))\/(([^\/]+))?\/?', function(req, res)
{
	req_inschrijvingen(req.params[0], req.params[1], req.params[2], function(json){
		res.send(JSON.stringify(json));
	});
});

app.get('\/voortgang\/(([^\/]+))\/(([^\/]+))\/?', function(req, root_res)
{
	
	var data = 'userid='+req.params[0]+'&pwd='+req.params[1]+'&timezoneOffset=0';

	var options = {
		host: 'usis.leidenuniv.nl',
		port: 443,
		path: 'psc/S040PRD/EMPLOYEE/HRMS/c/SA_LEARNER_SERVICES.SAA_SS_DPR_ADB.GBL?',
		method: 'POST',
		headers: {'User-Agent': 'Fake Mozilla 5.0', 'Content-Length':data.length,'Content-Type':'application/x-www-form-urlencoded', 'Cookie' : '' }
	};


	var req = https.request(options, function(res) {		
		console.log('STATUS: ' + res.statusCode);
	
		var cookies = res.headers['set-cookie'];
		
		res.setEncoding('utf8');
		
		//second request!!	
		var options = {
			host: 'usis.leidenuniv.nl',
			port: 443,
			path: 'psc/S040PRD/EMPLOYEE/HRMS/c/SA_LEARNER_SERVICES.SAA_SS_DPR_ADB.GBL?',
			method: 'POST',
			headers: {'User-Agent': 'Fake Mozilla 5.0', 'Cookie' : cookies, 'Content-Length':data.length,'Content-Type':'application/x-www-form-urlencoded' }
		};
	
		var req_second = https.request(options, function(res) {		
			console.log('STATUS: ' + res.statusCode);
		
			//var cookies = res.headers['set-cookie'];
			
			res.setEncoding('utf8');
			
			var data = "ICType=Panel&ICElementNum=0&ICAction=DERIVED_SAA_DPR_SSS_EXPAND_ALL&ICXPos=0&ICYPos=0&ICFocus=&ICSaveWarningFilter=0&ICChanged=-1&ICResubmit=0&ICSID=l2NQFmLyPJGQ&DERIVED_SSTSNAV_SSTS_MAIN_GOTO$22$=9999&DERIVED_SSTSNAV_SSTS_MAIN_GOTO$116$=9999";
								
			var body = "";			
			var options = {
				host: 'usis.leidenuniv.nl',
				port: 443,
				path: '/psc/S040PRD/EMPLOYEE/HRMS/c/SA_LEARNER_SERVICES.SAA_SS_DPR_ADB.GBL',
				method: 'POST',
				headers: {'User-Agent': 'Fake Mozilla 5.0', 'Cookie' : cookies, 'Content-Length':data.length,'Content-Type':'application/x-www-form-urlencoded' }
			};
			
			var voortgang_req = https.request(options, function(res) {
				console.log('STATUS: ' + res.statusCode);
			
				var html = "";
				
				var handler = new htmlparser.DefaultHandler(function (error, dom)
				{
					if (error){
						console.log(error);
					} else {
						root_res.send(html);
					}
				});
					
				var parser = new htmlparser.Parser(handler);

				res.setEncoding('utf8');
 
				res.on('data', function (chunk) {
					//parser.parseChunk(chunk);
					html += chunk;
				});
				
				res.on('end', function(){
					parser.done();
				});
				
			}); // voortgang_req
			
			voortgang_req.on('error', function(err) {
				console.log(err);
			}); 
	
			voortgang_req.write(data);

			voortgang_req.end();
					
		}); // req_second
		
		req_second.write(data);

		req_second.end();
				
	}); //req
	
	
	req.on('error', function(err) {
			console.log(err);
	}); 
	
	// write data to request body
	req.write(data);
	req.end();

	//root_res.send("OK");
});

app.get('/', function(req, root_res)
{
	root_res.send("OK");
});

// Only listen on var  node app.js

if (!module.parent) 
{
	console.log(process.env['app_port']);
	if(process.env['app_port'])
	{ 
		app.listen(process.env['app_port']);
	} else {
		app.listen(3000);
	}
	
	console.log("Express server listening on port %d", app.address().port);

	if(notification)
	{
		notification.send({
			'application': 'ucheck-node',
	    	'event': 'Server opnieuw opgestart!',
		    'description': ''
		});
	}

}


function req_inschrijvingen(user, password, year, callback)
{
	if(!year) year = '10';

	var data = 'userid='+user+'&pwd='+password+'&timezoneOffset=0';

	var options = {
		host: 'usis.leidenuniv.nl',
		port: 443,
		path: '/psc/S040PRD/EMPLOYEE/HRMS/c/SA_LEARNER_SERVICES.SSR_SSENRL_DROP.GBL?Page=SSR_SSENRL_DROP&Action=A&ACAD_CAREER=10&EMPLID=0924121&ENRL_REQUEST_ID=&INSTITUTION=LEI01&STRM=2'+year+'0',
		method: 'POST',
		headers: {'User-Agent': 'Fake Mozilla 5.0', 'Content-Length':data.length,'Content-Type':'application/x-www-form-urlencoded', 'Cookie' : '' }
	};


	var req = https.request(options, function(res) {
		console.log('STATUS: ' + res.statusCode);
	
		var cookies = res.headers['set-cookie'];
		
		res.setEncoding('utf8');

		var body = "";			
		var options = {
			host: 'usis.leidenuniv.nl',
			port: 443,
			path: '/psc/S040PRD/EMPLOYEE/HRMS/c/SA_LEARNER_SERVICES.SSR_SSENRL_DROP.GBL?Page=SSR_SSENRL_DROP&Action=A&ACAD_CAREER=10&EMPLID=0924121&ENRL_REQUEST_ID=&INSTITUTION=LEI01&STRM=2'+year+'0',
			method: 'GET',
			headers: {'User-Agent': 'Fake Mozilla 5.0', 'Cookie' : cookies	}
		};
		
		var inschrijvingen_req = https.request(options, function(res) {
			console.log('STATUS: ' + res.statusCode);
			
			var handler = new htmlparser.DefaultHandler(function (error, dom){
				if (error){
					console.log(error);
				} else {
					callback(dom2inschrijvingen(dom));
				}
			});
				
			var parser = new htmlparser.Parser(handler);

			res.setEncoding('utf8');

			res.on('data', function (chunk) {
				parser.parseChunk(chunk);
				//console.log('BODY: ' + chunk);			
			});
			
			res.on('end', function(){
				parser.done();
			});
		});
		
		inschrijvingen_req.on('error', function(err) {
			console.log(err);
		}); 

		inschrijvingen_req.end();
	});
		
	req.on('error', function(err) {
			console.log(err);
	}); 
	
	// write data to request body
	req.write(data);
	req.end();
}

function req_cijfers(user, password, callback)
{
	
	var data = 'userid='+user+'&pwd='+password+'&timezoneOffset=0';
	
	var options = {
		host: 'usis.leidenuniv.nl',
		port: 443,
		path: '/psc/S040PRD/EMPLOYEE/HRMS/c/SA_LEARNER_SERVICES_2.SSS_MY_CRSEHIST.GBL',
		method: 'POST',
		headers: {'User-Agent': 'Fake Mozilla 5.0', 'Content-Length':data.length,'Content-Type':'application/x-www-form-urlencoded', 'Cookie' : '' }
	};


	var req = https.request(options, function(res) {
		console.log('STATUS: ' + res.statusCode);
	
		var cookies = res.headers['set-cookie'];
		
		res.setEncoding('utf8');
							
		var body = "";			
		var options = {
			host: 'usis.leidenuniv.nl',
			port: 443,
			path: '/psc/S040PRD/EMPLOYEE/HRMS/c/SA_LEARNER_SERVICES_2.SSS_MY_CRSEHIST.GBL?',
			method: 'GET',
			headers: {'User-Agent': 'Fake Mozilla 5.0', 'Cookie' : cookies	}
		};
		
		var cijfers_req = https.request(options, function(res) {
			console.log('STATUS: ' + res.statusCode);
 
 			var html;

			var handler = new htmlparser.DefaultHandler(function (error, dom){
				if (error){
					console.log(error);
				} else {
					var json = dom2cijfers(dom);
					
					if(html.search("Your User ID and/or Password are invalid.") != -1)
					{
						json["error"] = "loginerror";
					} else if(html.search("Mijn studieresultaten") == -1)
					{
						json["error"] = "usiserror";
					}
					else {
						
					}

					callback(json);
				}
			});
				
			var parser = new htmlparser.Parser(handler);

			res.setEncoding('utf8');

			res.on('data', function (chunk) {
				html += chunk;
				parser.parseChunk(chunk);
			});
			
			res.on('end', function(){
				parser.done();
				// console.log(html);
			});
		});
		
		cijfers_req.on('error', function(err) {
			console.log(err);
		}); 

		cijfers_req.end();		
	});
	
	req.on('error', function(err) {
		console.log(err);
	}); 
	
	// write data to request body
	req.write(data);
	req.end();
}


function dom2cijfers(dom){
	var start = new Date().getTime();
	
	var trs = select(dom, 'table[class=PSLEVEL1GRIDWBO] tr');
	var trs_counter = 0;

	var vakken = [];
	var eerste = true;
	
	trs.forEach(function(el, index){
			if(eerste) 
			{
				eerste=false;
			} else {
			
				var tds = el.children;
			
				var td_counter = 0;
				
				var rij_dict = {};
	
				tds.forEach(function(el){
				
					if(el.name == "td") {
						var text = "";
						
						if(td_counter == 0)
						{		
							text = el.children[1].children[0].raw;
							
							rij_dict['id'] = text;
							
							var arr = text.split(" ");
							
							rij_dict['studie'] = arr[0];
							rij_dict['usis_id'] = arr[1];

						} else if(td_counter == 1)
						{
							text = el.children[1].children[1].children[0].raw;
							
							rij_dict['vak'] = text;
						} else if(td_counter == 2)
						{
							text = el.children[1].children[0].raw;
							
							var d=new Date(text);
							rij_dict['date'] = d;
						} else if(td_counter == 3)
						{
							text = el.children[1].children[0].raw;
							rij_dict['cijfer'] = text;
							
							if((!IsNumeric(text) && text == "O") || (!IsNumeric(text) && text == "NVO"))
							{
								rij_dict['gehaald'] = false;
							} else if(text < 5.5) {
								rij_dict['gehaald'] = false;
							} else {
								rij_dict['gehaald'] = true;
							}
						} else if(td_counter == 4){
							if(el.children.length > 1){
								text = el.children[1].children[0].raw;
								text = text.replace("\n","").replace("&nbsp;","")
							} else {
							}

							rij_dict['ects'] = text;

						}
						
						td_counter++;
					}
				
				});
							
			vakken.push(rij_dict);
		}
		
	});
		
	var newvakken = [];	
	var overige = [];	

	for(var i=0; i<vakken.length; i++){
		var cijfer = vakken[i];
		var nextcijfer = vakken[i+1];
		
		var usisid = cijfer['id'].substring(0, cijfer['id'].length - 1);		
		
		if((cijfer['cijfer'] == "-" || cijfer['cijfer'] == "" || cijfer['cijfer'] == " ") && cijfer['ects'] == "") 
		{			
			overige.push(cijfer);
			continue;
		}
		
		if(nextcijfer){
			var nextusisid = nextcijfer['id'].substring(0, nextcijfer['id'].length - 1);

			if(usisid == nextusisid && cijfer['cijfer'] == nextcijfer['cijfer'] && cijfer['rawdatum'] == nextcijfer['rawdatum'])
			{
				if(cijfer['ects'] == nextcijfer['ects'])
				{
					newvakken.push(cijfer);
					i++;
					continue;
				} else {
					if(cijfer['ects'] != 0)
					{
						newvakken.push(cijfer);
						i++;
						continue;
					} else {				
						newvakken.push(nextcijfer);
						i++;
						continue;
					}
				}
			}
		}
	
		newvakken.push(cijfer);	
	}	
	
	vakken = newvakken;
	
	var end = new Date().getTime();
	var time = end - start;
	console.log('Execution time: ' + time + 'ms \n');

	var json = {'vakken':vakken, 'overige': overige};
	return json;
}


function dom2inschrijvingen(dom){
	var start = new Date().getTime();
	
	var eerste = true;
	
	var inschrijvingen = [];
	var studies = [];
	
	var trs = select(dom, 'table[class=PSLEVEL1GRIDWBO] tr');
	var trs_counter = 0;

	trs.forEach(function(el, index){
		if(eerste){
			eerste = false;
		} else {		
			var tds = el.children;
				
			var td_counter = 0;
					
			var vak_dict = {};
		
			tds.forEach(function(el){
						
				if(el.name == "td") 
				{
					var text = "";
					
					if (td_counter == 0)
					{						
						vak_dict['stopid'] = el.children[1].attribs.name.replace("DERIVED_REGFRM1_SSR_SELECT$chk", "");
					}
					else if (td_counter == 1)
					{
						var text = el.children[1].children[0].raw;
						if(studies.indexOf(text) == -1) studies.push(text);

						vak_dict['origineel_id'] = text;
						vak_dict['studie'] = text;
					}
					else if (td_counter == 2)//Studiegidsnr
					{
						var text = el.children[1].children[0].raw;
						vak_dict['origineel_id'] += " "+text;
						vak_dict['usis_id'] = text;
					}

					else if (td_counter == 3) //omschtijving
					{
						var text = el.children[1].children[0].raw;

						vak_dict['vak'] = text;					
					}
					else if (td_counter == 4) //sessie?
					{
					
					}
					else if (td_counter == 5)
					{
						var regex = /([0-9A-Z]*)-(.*)/;
						var text = el.children[1].children[1].children[0].raw;
						
						vak_dict['code'] = text;

						var match = text.match(regex);
						//console.log(match);
						
						if (match && match.length > 0)
						{
							var id = match[1];
						
							vak_dict['id'] = id;
							
							//if (!IsNumeric(id))
							//{
								vak_dict['id'] = id;
							//} else {
							//	vak_dict['id'] = "";
							//}
						} 
						else 
						{
							vak_dict['id'] = "";
						}
						
					} else if (td_counter == 6)
					{
						var text = el.children[1].children[3].attribs.alt;

						vak_dict['status'] = text;
					}
					
					vak_dict['datum'] = "";
					vak_dict['lokaal'] = "";
					vak_dict['docent'] = "";
					vak_dict['ects'] = "";
									
					td_counter++;
				}
			});
			
			//niet gestopt -> dus ingeschreven? stop in array.
			if(vak_dict['status'] != "Gestopt") inschrijvingen.push(vak_dict);
		}
	});

	var end = new Date().getTime();
	var time = end - start;
	console.log('Execution time: ' + time + 'ms \n');

	var json = {'inschrijvingen':inschrijvingen, 'studies': studies};
	return json;
}

function IsNumeric(input)
{
 	return (input - 0) == input && input.length > 0;
}

process.on("uncaughtException", function (exception) {
	if(notification)
		{
	    notification.send({
	        'application': 'ucheck-node',
	        'event': 'uncaughtException - '+exception.message,
	        'description': exception.stack
	    });
    }
});


