
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

//authentication : an array of users 

var defaultUsers =
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

var users=null; //users that will be read in users.json file
adminReadUserFile = function() {
	var usersFile="./games/users.json";
	console.log(usersFile + " exists ? " + fs.existsSync(usersFile)); 
	if (!fs.existsSync(usersFile)) { //first init of admin map
		fs.writeFileSync(usersFile, JSON.stringify(defaultUsers, null, '\t')); //in plain readable json
		console.log("user file has been initialized !");
	} 
	users =  JSON.parse( fs.readFileSync(usersFile) );
	console.log("user.json file has been read.");
}
adminReadUserFile(); //reading of user at first start of application

//default link between authenticated users and a given game. Password is here only to permit an accerated acces in debug
//this array is saved in each game dir an can be changed
var defaultWizardUser = 
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

//associate user to different games : create default for each existing game (if required)
var games = fs.readdirSync("./games");
for (var i=0; i<games.length; i++) {
	//console.log(games[i]);
	if (games[i]=="users.json") continue; //ignore user file
	
	var fileAdmin="./games/"+ games[i] + "/admin.json";
	console.log(fileAdmin + " exists ? " + fs.existsSync(fileAdmin)); 
	if (!fs.existsSync(fileAdmin)) { //first init of admin map
		fs.writeFile(fileAdmin, JSON.stringify(defaultWizardUser, null, '\t'), function(err) { if(err) console.log(err); else console.log("The admin file was saved!"); }); 
	} 
		
}
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
	
	var wizardToUser =  JSON.parse( fs.readFileSync("./games/"+ req.params.game + "/admin.json") );
	console.log(wizardToUser.length);

	//add wizard name
	var okas= require('./public/javascripts/Map.js');
	for ( var i=0; i<okas.People.WizardName.length; i++) wizardToUser[i].wizardname=okas.People.WizardName[i];
	res.render('login', { game: req.params.game, users: wizardToUser, user: req.user, messages: req.flash('error') }); 
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

	var wizardToUser =  JSON.parse( fs.readFileSync("./games/"+ req.params.game + "/admin.json") );
	
	if (! req.isAuthenticated() ) 
		res.render('client', { title: '!!!!8!!!!  guest - ' + req.params.game , wizard: -1 });
	else  {
		console.log("connexion de : " + req.user.username + " ; wizardToUser " + wizardToUser.length );	
		
		var idWizard = findByUsernameInArray(wizardToUser, req.user.username).id;
		//authenticated admin
		if (idWizard==0) 
			//authenticated player
			res.render('admin', { title: '!!!!8 ADMIN!!!! ' + req.user.username + ' - ' + req.params.game , wizard : idWizard, gameId : req.params.game });
		else
			//authenticated player
			res.render('client', { title: '!!!!8!!!! ' + req.user.username + ' - ' + req.params.game , wizard : idWizard });
	}
	
});
//map editing
app.get('/:game/adminMapEdit',
	function(req, res) {

	var wizardToUser =  JSON.parse( fs.readFileSync("./games/"+ req.params.game + "/admin.json") );
	
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


app.get('/:game/images/:img', function(req, res){ res.redirect('/images/' + req.params.img ); } ); //image redirect

//map client reading/writing  
app.get('/:game/mapjson', map.readjson);
app.get('/:game/mapimage', map.readimage);
app.post('/:game/mapwritejson', map.write);
app.post('/:game/mapwriteimage', map.write);

//order client reading/writing
app.get('/:game/orders/:idWizard', 
	function(req, res) {
		
		//allowed ?
		var wizardToUser =  JSON.parse( fs.readFileSync("./games/"+ req.params.game + "/admin.json") );
		
		if (! req.isAuthenticated() ) 
			{ res.writeHead(200, {'Content-Type': 'text/plain' }); res.end( "Not allowed !" ); return;  } 
		else  {
			var idWizard = findByUsernameInArray(wizardToUser, req.user.username).id;
			
			if ( (idWizard==0) || ( idWizard==req.params.idWizard ) ) order.read(req,res); //allowed, ok 
			
			else { res.writeHead(200, {'Content-Type': 'text/plain' }); res.end( "Not allowed !" ); return;  } 
		}
	
	}
); //read current order of wizard, or old ones
app.post('/:game/orders/:idWizard', 
	function(req,res) {
		//allowed ?
		var wizardToUser =  JSON.parse( fs.readFileSync("./games/"+ req.params.game + "/admin.json") );

		if (! req.isAuthenticated() ) 
			{ res.writeHead(200, {'Content-Type': 'text/plain' }); res.end( "Not allowed !" ); return;  } 
		else  {
			var idWizard = findByUsernameInArray(wizardToUser, req.user.username).id;
			
			if ( (idWizard==0) || ( idWizard==req.params.idWizard ) ) order.write(req,res); //allowed, ok 
			
			else { res.writeHead(200, {'Content-Type': 'text/plain' }); res.end( "Not allowed !" ); return;  } 
		}	
	
	}
); //write order of current wizard

//backup zip of the game
app.get('/:game/backup.zip',
	function(req, res) {
		//allowed ?
		var wizardToUser =  JSON.parse( fs.readFileSync("./games/"+ req.params.game + "/admin.json") );
		if (! req.isAuthenticated() ) 
			{ res.writeHead(200, {'Content-Type': 'text/plain' }); res.end( "Not allowed !" ); return;  } 

		var idWizard = findByUsernameInArray(wizardToUser, req.user.username).id;		
		if (idWizard!=0) { res.writeHead(200, {'Content-Type': 'text/plain' }); res.end( "Not allowed !" ); return; }	

		//zip files init
		var zip = new require('node-zip')();
		
		//users file (in common with all games)
		zip.file('users.json', fs.readFileSync("./games/users.json") );		
		//admin file
		zip.file('admin.json', fs.readFileSync("./games/" + req.params.game + "/admin.json") );
		//map image file
		zip.file('map.jpg', map.imagefile( req.params.game  )  );
		//map json file
		zip.file('map.json', map.jsonfile( req.params.game, 0  )  );
		if (fs.existsSync(  map.jsonfilepath( req.params.game, 1  )  )) { //may not exists at the beginning of the game
			zip.file('map_previous.json', map.jsonfile( req.params.game, 1  )  );
		}
		//current order files
		var okas= require('./public/javascripts/Map.js'); 
		for ( var i=1; i<okas.People.WizardName.length; i++) {
			var orderFile = order.getFileNameCurrentOrder( req.params.game, i); //current
			//console.log(orderFile);
			if (fs.existsSync(orderFile)) { 
				zip.file('orders' + i + '.json', fs.readFileSync(orderFile)) ; 
			}
		}
		//send zip
		var data = zip.generate({base64:false,compression:'DEFLATE'});
		res.writeHead(200, {'Content-Type': 'application/zip' });
		res.end(data, 'binary');
	}
);

//upload zip and replace existing data game with the zip ones (admin only)
app.post('/:game/restore', 
	function(req,res) { 
	
		//allowed ?
		var wizardToUser =  JSON.parse( fs.readFileSync("./games/"+ req.params.game + "/admin.json") );
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
				fs.writeFile("./games/" + file.name, file._data, function(err) {
					file_count++;
					if(err) msg += "\n game/restore ERREUR : " + err; 
					else adminReadUserFile(); //read user file again to update authentification
					uploadComplete(res, file_count, file_count_complete, msg); 
				}); 
			}
			else file_count++;
			
			var file = zip.files['admin.json']; 			
			if (file != null ) {
				msg += "\n Restoring " + file.name;
				fs.writeFile("./games/" + req.params.game + "/" + file.name, file._data, function(err) {
					file_count++;
					if(err) msg += "\n game/restore ERREUR : " + err; 
					uploadComplete(res, file_count, file_count_complete, msg); 
				}); 
			}
			else file_count++;
			
			var file = zip.files['map.json']; 			
			if (file != null ) {
				msg += "\n Restoring " + file.name;
				fs.writeFile("./games/" + req.params.game + "/" + file.name, file._data, function(err) {
					file_count++;
					if(err) msg += "\n game/restore ERREUR : " + err; 
					uploadComplete(res, file_count, file_count_complete, msg); 
				}); 	
			}
			else file_count++;
			
			//delete old map_previous file (not to have inconsistent data)...
			oldfile="./games/" + req.params.game + "/" + "map_previous.json";
			if (fs.existsSync( oldfile) ) fs.unlinkSync(oldfile) 
			//...and restore new one (if exists)
			var file = zip.files['map_previous.json']; 
			if (file != null ) {
				msg += "\n Restoring " + file.name;
				fs.writeFile("./games/" + req.params.game + "/" + file.name, file._data, function(err) {
					file_count++;
					if(err) msg += "\n game/restore ERREUR : " + err; 
					uploadComplete(res, file_count, file_count_complete, msg); 
				}); 
			}
			else file_count++;
			
			var file = zip.files['map.jpg']; 
			if (file != null ) {
				msg += "\n Restoring " + file.name;
				fs.writeFile("./games/" + req.params.game + "/" + file.name, file._data, 'binary', function(err) {
					file_count++;
					if(err) msg += "\n game/restore ERREUR : " + err; 
					uploadComplete(res, file_count, file_count_complete, msg); 
				}); 
			}
			else file_count++;
			
			//current order files
			for ( var i=1; i<okas.People.WizardName.length; i++) {
			
				//delete all old orders...
				oldfile=order.getFileNameCurrentOrder( req.params.game, i);
				if (fs.existsSync( oldfile) ) fs.unlinkSync(oldfile) //delete old file (not to have inconsistent data)
			
				//and restore new ones if they exist
				var file = zip.files['orders' + i + '.json']; 
				if (file != null ) {
					msg += "\n Restoring " + file.name;
					fs.writeFile(order.getFileNameCurrentOrder( req.params.game, i), file._data, function(err) {
						file_count++;
						if(err) msg += "\n game/restore ERREUR : " + err; 
						uploadComplete(res, file_count, file_count_complete, msg); 
					}); 
				}
				else file_count++;
				
			}
		
			
			uploadComplete(res, file_count, file_count_complete, msg); 
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



//end of turn : solving order
app.get('/:game/nextturn', nextturn.index);

//TEST
//app.get('/test', test01.index);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
