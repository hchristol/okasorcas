
/**
 * Module dependencies.
 */

var express = require('express');

var fs = require('fs');

//authentication 
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
//storing messages in session
var flash = require('connect-flash');

var routes = require('./routes');
var user = require('./routes/user');
var order = require('./routes/order');
var map = require('./routes/map');
var nextturn = require('./routes/nextturn');

var test01 = require('./routes/test');

var http = require('http');
var path = require('path');


//console.log('Client shared lib, okas.Unit.WIZARD=' + okas.Unit.WIZARD);

var app = express();

var redis = require('./routes/redis');

//authentication : an array of users 
defaultUsers =
[
	{ id: 0, username: 'j0', password: 'todo', email: 'todo' }
  , { id: 1, username: 'j1', password: 'todo', email: 'todo' }
  , { id: 2, username: 'j2', password: 'todo', email: 'todo' }
  , { id: 3, username: 'j3', password: 'todo', email: 'todo' }
  , { id: 4, username: 'j4', password: 'todo', email: 'todo' }
  , { id: 5, username: 'j5', password: 'todo', email: 'todo' }
  , { id: 6, username: 'j6', password: 'todo', email: 'todo' }
  , { id: 7, username: 'j7', password: 'todo', email: 'todo' }
  , { id: 8, username: 'j8', password: 'todo', email: 'todo' }
];

//defaut games name availlable
defaultGames = [ 'test', 'partie1', 'partie2' ] ;

//default link between authenticated users and a given game. Password is here only to permit an accerated acces in debug
//this array is saved in each game dir an can be changed
defaultWizardUser = 
[
	{ id: 0, username: 'j0', password: '' }
  , { id: 1, username: 'j1', password: ''  }
  , { id: 2, username: 'j2', password: ''  }
  , { id: 3, username: 'j3', password: ''  }
  , { id: 4, username: 'j4', password: ''  }
  , { id: 5, username: 'j5', password: ''  }
  , { id: 6, username: 'j6', password: ''  }
  , { id: 7, username: 'j7', password: ''  }
  , { id: 8, username: 'j8', password: ''  }
];

users=null; //users that will be read in users.json file
games=null; //games existing in database

adminReadUserFile = function() {
	//var usersFile="./games/users.json";
	
	//read user file in redis
	redis.client.get("users.json",  function(err, reply) {
		
		
		if (err) { console.log( "REDIS TEST ERROR : " + err ); return;}
		
		//first init of users data
		if (reply==null) {
			redis.client.set("users.json", JSON.stringify(defaultUsers, null, '\t'))
			console.log("user file has been initialized !");		
			users=defaultUsers;
		} else {
			//read existing users parameters :
			users =  JSON.parse( reply );
			console.log("user.json file has been read.");
		}
		
		//reread games
		redis.client.get("games",  function(err, reply) {
			if (reply==null) {
				redis.client.set("games", JSON.stringify(defaultGames, null, '\t'))
				console.log("games list has been initialized!");	
				games=defaultGames;
			} else {
				//read existing users parameters :
				games =  JSON.parse( reply );
				console.log("games list has been read.");
			}

			//associate user to different games : create default for each existing game (if required)
			i=-1;
			var adminGameName= function(i) { return games[i] + ".admin.json" } //name of the key in redis of the admin game parameters
			var nextGameName = function() {
				i++;
				if (i<games.length) return adminGameName(i);
				else return null; //no more games
			}
			var nextGameReadAndInit = function(err, reply) {
				if (reply==null) { //first init of admin map
					redis.client.set(adminGameName(i), JSON.stringify(defaultWizardUser, null, '\t'), function(err) { 
						if(err) console.log(err); else console.log("The admin file " + adminGameName(i) + " was initialized !"); 
						if (nextGameName()!=null) redis.client.get(adminGameName(i), nextGameReadAndInit); //recursive call						
					}); 
				} else {		
					console.log("Adminfile " + i + " exists : " + adminGameName(i));
					if (nextGameName()!=null) redis.client.get(adminGameName(i), nextGameReadAndInit); //recursive call	
				}
			};
			redis.client.get(nextGameName(), nextGameReadAndInit); //first call
	
		
		});
		

	}); 		
}

adminReadUserFile(); //reading of user at first start of application



/* search username in a array */
function findByUsernameInArray(myArray, username) {
  for (var i = 0, len = myArray.length; i < len; i++) {
    var user = myArray[i];
    if (user.username === username) {
      return user;
    }
  }
  return null;
}

	
/* search in user array*/
function findById(id, fn) {
  var idx = id ;
  if (users[idx]) {
    fn(null, users[idx]);
  } else {
    fn(new Error('User ' + id + ' does not exist'));
  }
}
/* search in user array*/
function findByUsername(username, fn) {
  for (var i = 0, len = users.length; i < len; i++) {
    var user = users[i];
    if (user.username === username) {
      return fn(null, user);adminEditMap
    }
  }
  return fn(null, null);
}


// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  findById(id, function (err, user) {
    done(err, user);
  });
});


// Use the LocalStrategy within Passport.
//   Strategies in passport require a `verify` function, which accept
//   credentials (in this case, a username and password), and invoke a callback
//   with a user object.  In the real world, this would query a database;
//   however, in this example we are using a baked-in set of users.
passport.use(new LocalStrategy(
  function(username, password, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
      
      // Find the user by username.  If there is no user with the given
      // username, or the password is not correct, set the user to `false` to
      // indicate failure and set a flash message.  Otherwise, return the
      // authenticated `user`.
      findByUsername(username, function(err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false, { message: 'Unknown user ' + username }); }
        if (user.password != password) { return done(null, false, { message: 'Invalid password' }); }
        return done(null, user);
      })
    });
  }
));

//---------- 

// all environments
app.set('port', process.env.PORT || 80);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());

app.use(express.logger('dev'));
app.use(express.cookieParser()); //authentication
app.use(express.bodyParser());
app.use(express.methodOverride());

//authentication
app.use(express.session({ secret: 'keyboard cat' }));  
app.use(passport.initialize());
app.use(passport.session());
//messages in session
app.use(flash());

app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
//app.get('/users', user.list);

//authentication
app.get('/:game/login', function(req, res) {
		
	nextturn.proceedNextTurn(req.params.game, false);
	
	redis.client.get(req.params.game + ".admin.json", function(err, reply) { //read link between authenticated users and their wizard

		var wizardToUser =  JSON.parse( reply );
		//console.log("DEBUG login : wizardToUser.length=" + wizardToUser.length);

		//add wizard name
		var okas= require('./public/javascripts/Map.js');
		for ( var i=0; i<okas.People.WizardName.length; i++) wizardToUser[i].wizardname=okas.People.WizardName[i];
		res.render('login', { game: req.params.game, users: wizardToUser, user: req.user, messages: req.flash('error') }); 
	
	});
	

});

app.post('/:game/login', 
	passport.authenticate('local', { 
		successRedirect: '../client',
		failureRedirect: '../login',
		failureFlash: true
	})
);
//  passport.authenticate('local', { failureRedirect: '/login/' + req.params.game , failureFlash: true}),
//res.redirect('/' + myGame + '/client');
  
//client main page (map)
app.get('/:game/client', //client.index);
	function(req, res) {

	redis.client.get(req.params.game + ".admin.json", function(err, reply) { //read link between authenticated users and their wizard
	
		var wizardToUser =  JSON.parse( reply ) ;
		
		if (! req.isAuthenticated() ) 
			res.render('client', { title: '!!!!8!!!!  guest - ' + req.params.game , wizard: -1 });
		else  {
			var idWizard = findByUsernameInArray(wizardToUser, req.user.username).id;
			
			console.log("player " + req.user.username + " is logged as wizard " + idWizard );	
			
			//authenticated admin
			if (idWizard==0) {
				//authenticated administrator
				
				//push passwords and email of global users to the rendered page
				for (var i=0; i<wizardToUser.length; i++) {
					var globaluser=findByUsernameInArray(users, wizardToUser[i].username);
					wizardToUser[i].password=globaluser.password; 
					wizardToUser[i].email=globaluser.email; 
				}
				//add wizard name
				var okas= require('./public/javascripts/Map.js');
				for ( var i=0; i<okas.People.WizardName.length; i++) wizardToUser[i].wizardname=okas.People.WizardName[i];
		
				//read current map to display its parameters
				redis.client.get( map.jsonfilepath(req.params.game, 0), function(err,reply) {
					
					if (reply == null) { //no map yet
						res.render('admin', { title: '!!!!8 ADMIN!!!! ' + req.user.username + ' - ' + req.params.game , wizard : idWizard, gameId : req.params.game, users: wizardToUser, turnDuration:1440, turnLastDate:"2014-09-22T00:30:11.563Z", aiEnabled:"false" });	 //no parameters
					} else {
						var map= new okas.Map( JSON.parse(reply));
						res.render('admin', { title: '!!!!8 ADMIN!!!! ' + req.user.username + ' - ' + req.params.game , wizard : idWizard, gameId : req.params.game, users: wizardToUser, turnDuration:map.turnDuration, turnLastDate:JSON.stringify(map.turnLastDate), aiEnabled:JSON.stringify(map.aiEnabled)});						
					}

				});
				
			} else
				//authenticated player
				res.render('client', { title: '!!!!8!!!! ' + req.user.username + ' - ' + req.params.game , wizard : idWizard });
		}
		
	});
	
});
//map editing
app.get('/:game/adminMapEdit', function(req, res) {

	redis.client.get(req.params.game + ".admin.json", function(err, reply) { //read link between authenticated users and their wizard
	
		var wizardToUser =  JSON.parse( reply );
		
		if (! req.isAuthenticated() ) 
			{ res.writeHead(200, {'Content-Type': 'text/plain' }); res.end( "Not allowed !" ); return;  } 
		else  {
			console.log("adminMapEdit : connexion de : " + req.user.username + " ; wizardToUser " + wizardToUser.length );	
			
			var idWizard = findByUsernameInArray(wizardToUser, req.user.username).id;
			//authenticated admin
			if (idWizard==0) 
				//authenticated player
				res.render('adminMapEdit', { title: '!!!!8 ADMIN!!!! ' + req.user.username + ' - ' + req.params.game , wizard : idWizard, gameId : req.params.game });
			else
				{ res.writeHead(200, {'Content-Type': 'text/plain' }); res.end( "Not allowed !" ); return;  } 
		}
		
	});
});

app.get('/:game/images/:img', function(req, res){ res.redirect('/images/' + req.params.img ); } ); //image redirect

//map client reading/writing  
app.get('/:game/mapjson', map.readjson);
app.get('/:game/mapimage', map.readimage);
app.post('/:game/mapwritejson', map.write);
app.post('/:game/mapwriteimage', map.write);

//order client reading/writing
app.get('/:game/orders/:idWizard', 
	function(req, res) {
		
		redis.client.get(req.params.game + ".admin.json", function(err, reply) { //read link between authenticated users and their wizard
			//allowed ?
			var wizardToUser =  JSON.parse( reply );
			
			if (! req.isAuthenticated() ) 
				{ res.writeHead(200, {'Content-Type': 'text/plain' }); res.end( "Not allowed !" ); return;  } 
			else  {
				var idWizard = findByUsernameInArray(wizardToUser, req.user.username).id;
				
				if ( (idWizard==0) || ( idWizard==req.params.idWizard ) ) order.read(req,res); //allowed, ok 
				
				else { res.writeHead(200, {'Content-Type': 'text/plain' }); res.end( "Not allowed !" ); return;  } 
			}
		});
	
	}
); //read current order of wizard, or old ones
app.post('/:game/orders/:idWizard', 
	function(req,res) {
	
		redis.client.get(req.params.game + ".admin.json", function(err, reply) { //read link between authenticated users and their wizard
		
			//allowed ?
			var wizardToUser =  JSON.parse( reply );

			if (! req.isAuthenticated() ) 
				{ res.writeHead(200, {'Content-Type': 'text/plain' }); res.end( "Not allowed !" ); return;  } 
			else  {
				var idWizard = findByUsernameInArray(wizardToUser, req.user.username).id;
				
				if ( (idWizard==0) || ( idWizard==req.params.idWizard ) ) order.write(req,res); //allowed, ok 
				
				else { res.writeHead(200, {'Content-Type': 'text/plain' }); res.end( "Not allowed !" ); return;  } 
			}	
			
		});
	
	}
); //write order of current wizard

//backup zip of the game
app.get('/:game/backup.zip',
	function(req, res) {
	
		redis.client.get(req.params.game + ".admin.json", function(err, reply) { //read link between authenticated users and their wizard
		
			//allowed ?
			var wizardToUser =  JSON.parse( reply );
			if (! req.isAuthenticated() ) 
				{ res.writeHead(200, {'Content-Type': 'text/plain' }); res.end( "Not allowed !" ); return;  } 

			var idWizard = findByUsernameInArray(wizardToUser, req.user.username).id;		
			if (idWizard!=0) { res.writeHead(200, {'Content-Type': 'text/plain' }); res.end( "Not allowed !" ); return; }	

			//zip files init
			var zip = new require('node-zip')();
			
			//files to be saved
			var tobesaved = [ "users.json", "admin.json", "map.json", "map_previous.json", "map.jpg" ];
			//current order files to be saved 
			var okas= require('./public/javascripts/Map.js'); 
			for ( var i=1; i<okas.People.WizardName.length; i++) {
				tobesaved.push('orders' + i + '.json')
			}
			
			//callback for redis get
			var i=-1;
			var zipNextFile = function() {
				i++;
				
				//end ?
				if (i>=tobesaved.length) { 
					//send zip
					var data = zip.generate({base64:false,compression:'DEFLATE'});
					res.writeHead(200, {'Content-Type': 'application/zip' });
					res.end(data, 'binary');
					return;
				}
				
				//save current file to zip :
				if (tobesaved[i]!="users.json")
					rediskey=req.params.game + "." + tobesaved[i]; //file date rely on a given game
				else rediskey = tobesaved[i];  //file for all games
				
				redis.client.get(rediskey,  function(err, reply) { 
					if (reply==null) { 
						//no data to be saved
						console.log("backup : nothing found for : " + tobesaved[i]); 
					} else {
						if (tobesaved[i]=="map.jpg") { //binary image
							console.log("backup : save binary data of " + tobesaved[i]); 
							zip.file( tobesaved[i], new Buffer(reply, 'base64') ); //convert image string into binary 
						} else { //other json file
							console.log("backup : save data of " + tobesaved[i]);
							zip.file( tobesaved[i], reply ) 
						}
					}
					zipNextFile(); //and continue with next file to be saved
				});
				
				
			};
			zipNextFile(); //start backup in zip
			
		});
	}
);

//upload zip and replace existing data game with the zip ones (admin only)
app.post('/:game/restore', 
	function(req,res) { 
	
		redis.client.get(req.params.game + ".admin.json", function(err, reply) { //read link between authenticated users and their wizard
	
			//allowed ?
			var wizardToUser =  JSON.parse( reply );
			
			
			if (! req.isAuthenticated() ) 
				{ res.writeHead(200, {'Content-Type': 'text/plain' }); res.end( "Not allowed !" ); return;  } 

			var idWizard = findByUsernameInArray(wizardToUser, req.user.username).id;		
			if (idWizard!=0) { res.writeHead(200, {'Content-Type': 'text/plain' }); res.end( "Not allowed !" ); return; }	
			
			
			//data transferred ?
			if ( req.files.zipbackup.size <= 0 ) {
				res.setHeader('Content-Type', 'text/plain');
				res.send("NO FILE RECEIVED ! YOU HAVE TO CHOOSE A zip FILE \n", 200);			
				return;
			}
			
			//read uploaded zip file 
			fs.readFile(req.files.zipbackup.path, function (err, data) {
				
				//uploaded zip
				var zip = new require('node-zip')(data, {base64: false, checkCRC32: true});
		
				//restore each file
				
				
				var file_count=0; //to inform that uploading is ok
				var okas= require('./public/javascripts/Map.js'); 
				var file_count_complete=4+okas.People.WizardName.length;
				var msg = ""; //displayed message
				
				//users file
				var file = zip.files['users.json']; 			
				if (file != null ) {
					msg += "\n Restoring " + file.name;
					
					redis.client.set("users.json", file._data, function(err, reply) {
						file_count++;
						if(err) msg += "\n game/restore users.json ERREUR : " + err; 
						else adminReadUserFile(); //read user file again to update authentification
						uploadComplete(res, file_count, file_count_complete, msg); 
					}); 
				}
				else file_count++;
				
				var file = zip.files['admin.json']; 			
				if (file != null ) {
					msg += "\n Restoring " + file.name;
					redis.client.set(req.params.game + "." + file.name, file._data, function(err, reply) {
					//fs.writeFile("./games/" + req.params.game + "/" + file.name, file._data, function(err) {
						file_count++;
						if(err) msg += "\n game/restore admin.json ERREUR : " + err; 
						uploadComplete(res, file_count, file_count_complete, msg); 
					}); 
				}
				else file_count++;
				
				var file = zip.files['map.json']; 			
				if (file != null ) {
					msg += "\n Restoring " + file.name;
					redis.client.set(req.params.game + "." + file.name, file._data, function(err, reply) {
					//fs.writeFile("./games/" + req.params.game + "/" + file.name, file._data, function(err) {
						file_count++;
						if(err) msg += "\n game/restore map.json ERREUR : " + err; 
						uploadComplete(res, file_count, file_count_complete, msg); 
					}); 	
				}
				else { 
					msg += "  NO map.json FOUND !!!";
					file_count++; 
				}
				
				var file = zip.files['map_previous.json']; 
				msg += "\n Restoring (if exists) " + 'map_previous.json';
				if (file!=null) { 
					redis.client.set(req.params.game + "." + file.name, file._data, function(err, reply) {  
						file_count++;
						if(err) msg += "\n game/restore ERREUR map_previous : " + err; 
						uploadComplete(res, file_count, file_count_complete, msg); 
					}); 
				} else { //if no file, erase old data to avoid inconsistent data
					redis.client.del(req.params.game + "." + 'map_previous.json', function(err, reply) {  
						file_count++;
						if(err) msg += "\n game/delete ERREUR map_previous : " + err; 
						uploadComplete(res, file_count, file_count_complete, msg); 					
					});
				}
				
				var file = zip.files['map.jpg']; 
				if (file != null ) {
					msg += "\n Restoring " + file.name;
					var decodedImage = new Buffer(file._data, 'binary');  //binary data
					redis.client.set(req.params.game + "." + file.name, decodedImage.toString('base64'), function(err, reply) {
						file_count++;
						if(err) msg += "\n game/restore ERREUR map.jpg : " + err; 
						uploadComplete(res, file_count, file_count_complete, msg); 
					}); 
				}
				else file_count++;
				
				//current order files
				for ( var i=1; i<okas.People.WizardName.length; i++) {
							
					var file = zip.files['orders' + i + '.json']; 
					msg += "\n Restoring (if exists) " + order.getFileNameCurrentOrder( req.params.game, i);
					if (file!=null) { 
						redis.client.set(order.getFileNameCurrentOrder( req.params.game, i), file._data, function(err, reply) {  
							file_count++;
							if(err) msg += "\n game/restore orders ERREUR : " + err; 
							uploadComplete(res, file_count, file_count_complete, msg); 
						}); 
					} else { //if no file, erase old data to avoid inconsistent data
						redis.client.del(order.getFileNameCurrentOrder( req.params.game, i), function(err, reply) {  
							file_count++;
							if(err) msg += "\n game/delete orders ERREUR : " + err; 
							uploadComplete(res, file_count, file_count_complete, msg); 
						}); 					
					}
					
				}
			
				
				uploadComplete(res, file_count, file_count_complete, msg); 
			});

		});
	
	}
); //write order of current wizard
//display message when upload is completed
uploadComplete=function(res, file_count, file_count_complete, msg) {
	//console.log( "Upload : " + file_count + "/" + file_count_complete )
	if (file_count==file_count_complete) {
		res.setHeader('Content-Type', 'text/plain');
		res.send("Upload OK !! \n" + msg, 200);			
	}
}


//update parameters of game
app.post('/:game/adminchangeparam',
	function(req, res) {
	
		redis.client.get(req.params.game + ".admin.json", function(err, reply) { //read link between authenticated users and their wizard
		
			//allowed ?
			var wizardToUser =  JSON.parse( reply );
			if (! req.isAuthenticated() ) 
				{ res.writeHead(200, {'Content-Type': 'text/plain' }); res.end( "Not allowed !" ); return;  } 

			var idWizard = findByUsernameInArray(wizardToUser, req.user.username).id;		
			if (idWizard!=0) { res.writeHead(200, {'Content-Type': 'text/plain' }); res.end( "Not allowed !" ); return; }	
			
			res.setHeader('Content-Type', 'text/plain');
			
			//get the current map
			var ficname= req.params.game + ".map.json";
			
			//valid paramaters ?
			var turnDuration = parseInt(req.body.turnDuration);
			if (isNaN(turnDuration) ) { res.send("turnDuration : invalid number value : " + req.body.turnDuration, 200);	 return; }
			var turnLastDate = Date.parse(req.body.turnLastDate.replace(/"/g, "")); //delete " if present (bug jade ?)
			if (isNaN(turnLastDate) ) { res.send("turnLastDate : invalid date value : " + req.body.turnLastDate, 200);	 return; }
			
			//load map
			redis.client.get( ficname, function(err,reply) {

				if (reply==null) { if (res != null) res.send("no map found in database !"); return; }
				
				var okas= require('./public/javascripts/Map.js');
				var map= new okas.Map(JSON.parse(reply));
				
				//modify param
				map.turnDuration = turnDuration;
				map.turnLastDate = turnLastDate;
				
				if (req.body.aiEnabled=="true") map.aiEnabled=true;
				else map.aiEnabled=false;
				
				//save modified map
				redis.client.set(ficname, JSON.stringify(map), function(err) { 
					if(err) { console.log(err); res.send("ERROR in save map : " + err); }
					res.send("OK ! Parameters updated : turnDuration=" + turnDuration + "  ;  turnLastDate=" + req.body.turnLastDate + " ; aiEnabled=" + req.body.aiEnabled);
				}); 
				
				
			});
			
			

		});
	}
);	

//end of turn : solving order
app.get('/:game/nextturn', nextturn.index);


//tutorial main page (map)
app.get('/tutorial', //client.index);
	function(req, res) {
	res.render('tutorial', { title: '!!!!8!!!! TUTORIAL' });
});


//TEST
//app.get('/test', test01.index);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
