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
		res.writeHead(200, {'Content-Type': 'image/jpg' });
		res.end(reply, 'binary');	
	});

}

//save the map on server
exports.write = function(req, res){
	//content = new Object();
	//res.send("Requete sur les ordres, methode : " + req.method + "  magicien : " + req.params.idWizard );
	//res.send(JSON.stringify(content)+"\n", 200);
	console.log("Requete sur la carte, methode : " + req.method + "  partie : " + req.params.game + "   is json ?" + req.is('application/json') );
	
	//save map json object
	if ( req.is('application/json') ) {
		for(var key in req.body ) console.log( "body propertie : " + key);
		
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
			
			var decodedImage = new Buffer( req.body.imageFile.substring("data:image/png;base64,".length+1), 'base64');
			
			redis.client.set(req.params.game + ".map.jpg", decodedImage, function(err) { 
				if(err) {
					console.log(err);
				} else {
					console.log("The file map.jpg was saved!");
				}			
			});
			/*
			fs.writeFile("./games/"+ req.params.game  + "/map.jpg", decodedImage , function(err) { // remove "data:image/png;base64,", that's why we remove this
				if(err) {
					console.log(err);
				} else {
					console.log("The file was saved!");
				}
			}); 
			*/
			
			
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