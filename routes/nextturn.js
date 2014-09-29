
var fs = require('fs');
//client shared lib
var okas= require('./../public/javascripts/Map.js');
var bots= require('./../public/javascripts/Bots.js');

//database access :
var redis = require('./../routes/redis');

/**
 * Init objects and solve current turn
 */

exports.index = function(req, res) {	
	var forceNextTurn = false;
	if (req.query.forced != null ) forceNextTurn = true; //next turn forced in GET parameter
	res.render('nextturn', { title: '!!!!8!!!! NEXT TURN', message: exports.proceedNextTurn(req.params.game, forceNextTurn ) });
};

exports.proceedNextTurn = function(game, forceNextTurn) {
	var init=readJsonObjects(game);
	if (init==null) return "new game, map not initialized, no nextturn. Log as admin to create new map";
	return nextturn(game, init.map, init.orders, forceNextTurn);
}

//return orders and map from json
readJsonObjects = function(game) {
	var init=new Object(); //store map and orders

	//use sync reading coz i can't deal with no sync reading. To be improved !

	//get the current map
	//console.log("Lecture map : " + "./games/" + game + "/map.json");
	var ficname="./games/" + game + "/map.json";
	
	if (!fs.existsSync(ficname)) return null; //new game
	
	init.map= new okas.Map(JSON.parse(fs.readFileSync(ficname)));
	//console.log("   map.land.spatialIndex.length=" + init.map.land.spatialIndex.length);
	
	//get the current orders : group all tactics orders of different wizards in one tactic object
	init.orders = new okas.Tactic(new Array(), init.map.turnNumber);
	
	var ia = new bots.Bots(okas, init.map); //used to generate ia order
	
	for (var i=1; i<okas.People.WIZARD_COUNT; i++) {
		var filename = "./games/" + game + "/orders" + i + ".json";
		console.log("Lecture orders : " + filename);
		
		var iaToPlay=true;
		
		if (fs.existsSync(filename)) {
			console.log("filename=" + filename  + "    fs=" + fs);
			
			var tactic = okas.Tactic.fromJSON( JSON.parse(fs.readFileSync (filename)), init.map );
						
			//orders for current map or deprecated orders (may happends if not updated by player)
			if ( tactic.turnNumber != init.map.turnNumber) { //ignored ! Too old !
				console.log("Ordres périmés : tactic.turnNumber=" + tactic.turnNumber + " map.turnNumber=" + init.map.turnNumber ); 
				tactic = null; 
			} 
			else {
				init.orders.acts = init.orders.acts.concat( tactic.acts );
				console.log("nombre ordres du magicien " + i + " = " + tactic.acts.length);
				iaToPlay=false;
			}
		} 
		
		if (iaToPlay) { //no human orders, ia replace it
		
			//bot enter its orders	
			var tactic = ia.getOrders(i);
			init.orders.acts = init.orders.acts.concat( tactic.acts );
			console.log("nombre ordres du bot " + i + " = " + tactic.acts.length);		
		
		}
		
	}
	
	//save orders into history of map
	if (init.map.history==null) init.map.history=new Object();
	init.map.history.orders=init.orders;
	
	return init;
}

/**
Solve current turn
*/
nextturn = function (game, map, orders, forceNextTurn) {
	var message = 'Next turn OK' ;
	
	//is it time to solve ?
	if ( (map.turnDuration!=-1) && ( !forceNextTurn ) ) { //automated next turn and forced next turn disabled
		if (map.isItTimeForNextAutomatedTurn() == false) {
			message = "map.turnDuration=" + map.turnDuration + " / "  + "No next turn, it's too soon !";
			console.log( message);
			return message;
		}
	}
	
	
	//saveMap(map, "map" + leftPad(map.turnNumber, 4) + ".json"); //save map before solving its orders, as an archive file
	saveToJson(game, map, "map_previous" + ".json"); //save map before solving its orders, as an archive file
	
	//1) APPLY ORDERS AND SETTLE FIGHTINGS
	map.addOrdersTactic( orders ); //apply orders to old map
	map.terminateOrders();
	
	//incremente date of next turn until it becomes too soon for next turn
	if (map.turnDuration!=-1) while(map.isItTimeForNextAutomatedTurn()) map.turnLastDate = new Date(map.turnLastDate.getTime() + (map.turnDuration * 60000) ) ;
	
	saveToJson(game, map, "map.json"); //saved as new current map
	
	return message;
}



/** save an object of the game on server */
saveToJson = function(game, object, filename) {
	var path = "./games/" + game + "/" + filename
	fs.writeFile(path, JSON.stringify(object), function(err) {
		if(err) {
			console.log(err);
		} else {
			console.log("The json was saved : " + path);
		}
	}); 	
}


/** pad number, used for naming archive map files **/
leftPad = function (n, len) {
    return (new Array(len - String(n).length + 1)).join("_").concat(n);
}
