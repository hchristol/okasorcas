/**
 * orders management
 */

var fs = require('fs');
var okas= require('./../public/javascripts/Map.js');
//database access :
var redis = require('./../routes/redis');

//return the current json order for wizard, or old one
exports.read = function(req, res){
	var orderFile = exports.getFileNameCurrentOrder( req.params.game, req.params.idWizard); //current
	
	//console.log("read orders file = " + orderFile + " ; il existe : " + fs.existsSync(orderFile));

	redis.client.get( orderFile, function(err,reply) {
		res.writeHead(200, {'Content-Type': 'text/plain' });
		if(err) {
			console.log(err); res.end(err);
		} else {
			if (reply==null) { //no order for now
				res.end( JSON.stringify(new okas.Tactic(new Array(), -1)) );
			} else {
				res.end(reply);
			}
			
		}
	});
	
	
	/*
	if (fs.existsSync(orderFile)) { res.end(fs.readFileSync(orderFile)); return; }
	else { res.end( JSON.stringify(new okas.Tactic(new Array(), -1)) ); return; }
	*/
	
	/*
	//get the current orders
	var orders;
	//console.log("read orders file = " + orderFile);
	if (fs.existsSync(orderFile)) orders = okas.Tactic.fromJSON( JSON.parse(fs.readFileSync(orderFile)));
	else orders=new okas.Tactic(new Array(), -1); //no orders
	res.writeHead(200, {'Content-Type': 'text/plain' });
	res.end(JSON.stringify(orders));	
	*/
}

exports.write = function(req, res){
	//content = new Object();
	//res.send("Requete sur les ordres, methode : " + req.method + "  magicien : " + req.params.idWizard );
	//res.send(JSON.stringify(content)+"\n", 200);
	//console.log("Requete sur les ordres, methode : " + req.method + "  magicien : " + req.params.idWizard + " ;  nombre ordres = " +  req.body.length + "   is json ?" + req.is('application/json') );
	
	//save orders
	redis.client.set(exports.getFileNameCurrentOrder( req.params.game, req.params.idWizard), JSON.stringify(req.body), function(err) { 
	//fs.writeFile(exports.getFileNameCurrentOrder( req.params.game, req.params.idWizard), JSON.stringify(req.body), function(err) {
		res.setHeader('Content-Type', 'text/plain');
		if(err) {
			console.log(err); res.send(err);
		} else {
			console.log("The file was saved!");
			res.send("OK !! \n", 200);
		}
	}); 


};

/** return the current order json file **/
exports.getFileNameCurrentOrder = function(game, wizardId) {
	return game  + ".orders" + wizardId+ ".json";
}
