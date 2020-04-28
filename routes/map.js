/**
 * map management
 */

var fs = require('fs');
//client shared lib :
var okas= require('./../public/javascripts/Map.js');
//database access :
var redis = require('./../routes/redis');

//return the current json map for the wizard
exports.readjson = function(req, res){
	redis.client.get( exports.jsonfilepath(req.params.game, req.query.previous), function(err,reply) {
		var map= new okas.Map( JSON.parse(reply));
		res.writeHead(200, {'Content-Type': 'text/plain' });
		res.end(JSON.stringify(map));	
	});
}
exports.jsonfilepath = function(game, previous) {
	var mapFile = "map.json";
	if (previous==1) mapFile = "map_previous.json";
	return game  + "." + mapFile;
}

//return the current image map 
exports.readimage = function(req, res){	

	redis.client.get(req.params.game + ".map.jpg", function(err,reply) {
		if (reply == null) { 
			res.setHeader('Content-Type', 'text/plain');
			res.send("No image file for game \n" + req.params.game, 200);
			return;
		}

		res.writeHead(200, {'Content-Type': 'image/jpg' });	
		res.end( new Buffer(reply, 'base64') ); //convert image string into binary
	});

}

//save the map on server
exports.write = function(req, res){

	//save map json object
	if ( req.is('application/json') ) {
		//for(var key in req.body ) console.log( "body propertie : " + key);
		
		//map file object 
		if ( 'land' in req.body ) {
		
			redis.client.set(req.params.game + ".map.json", JSON.stringify(req.body), function(err) { 
				if(err) {
					console.log(err);
				} else {
					console.log("The file map.json was saved!");
					
					//remove old files
					redis.client.del(req.params.game + ".map_previous.json");
					deleteFile("./games/"+ req.params.game  + "/map_previous.json");
					for( var i=1; i<=8; i++) redis.client.set(req.params.game + ".orders" + i + ".json", null); 
			
				}			
			});
			
			/*
			fs.writeFile("./games/"+ req.params.game  + "/map.json", JSON.stringify(req.body), function(err) {
				if(err) {
					console.log(err);
				} else {
					console.log("The file was saved!");
				}
			}); 
			*/

		}
		
		//map file image
		//http://stackoverflow.com/questions/8110294/nodejs-base64-image-encoding-decoding-not-quite-working
		if ( 'imageFile' in req.body ) {
			
			decodedImage = new Buffer( req.body.imageFile.substring("data:image/png;base64,".length+1), 'base64');
			
			//image has to be converted into string to be read successfully by all redis client (buffer option to true in redis client seems not to work on all redis server)
			redis.client.set(req.params.game + ".map.jpg", decodedImage.toString('base64'), function(err) { 
				if(err) {
					console.log(err);
				} else {
					console.log("The file map.jpg was saved!");
				}			
			});
			
			
		}	
		
	}
	
	
	//to read file, see  : http://www.sitepoint.com/accessing-the-file-system-in-node-js/
	
	res.setHeader('Content-Type', 'text/plain');
	res.send("OK !! \n", 200);
};

deleteFile = function(path) {

	if (fs.existsSync(path)) {
		fs.unlink(path, function (err) {
		  if (err) response.errors.push("Erorr : " + err);
		  //console.log('successfully deleted : '+ path );
		});

	} //end if exists file
}
