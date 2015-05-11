
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
	exports.proceedNextTurn(req.params.game, forceNextTurn, res );
	
};

//res : response wanted, null if no res parameter
exports.proceedNextTurn = function(game, forceNextTurn, res) {
	
	//get the current map
	var ficname= game + ".map.json";
	
	redis.client.get( ficname, function(err,reply) {

		if (reply==null) {
			if (res != null) res.render('nextturn', { title: '!!!!8!!!! NEXT TURN', message: "new game, map not initialized, no nextturn. Log as admin to create new map" });
			return;
		}
		
		var init=new Object(); //store map and orders
		init.map= new okas.Map(JSON.parse(reply));
		//console.log("   map.land.spatialIndex.length=" + init.map.land.spatialIndex.length);
	
		//get the current orders : group all tactics orders of different wizards in one tactic object
		init.orders = new okas.Tactic(new Array(), init.map.turnNumber);
		
		var ia = new bots.Bots(okas, init.map); //used to generate ia order
		
		//read each wizard order
		iOrder=0;
		var readNextOrder = function() {
			iOrder++; //start to wizard 1, 0 is neutral
			
			if (iOrder>=okas.People.WIZARD_COUNT) { //END OF READING ALL ORDER.
				
				//save orders into history of map
				if (init.map.history==null) init.map.history=new Object();
				init.map.history.orders=init.orders;
				
				nextturnMessage=nextturn(game, init.map, init.orders, forceNextTurn);
				if (res != null) res.render('nextturn', { title: '!!!!8!!!! NEXT TURN', message: nextturnMessage});
				return;
			}
			
			//READ NEXT ORDER
			var redisorder = game + ".orders" + iOrder + ".json";
			//console.log("proceedNextTurn : read orders : " + redisorder);
			redis.client.get( redisorder, function(err,reply) { //read orders

				var iaToPlay=false;
				if (init.map.aiEnabled==true) iaToPlay=true; //bots activated
				
				if (reply!=null) {
					
					var tactic = okas.Tactic.fromJSON( JSON.parse(reply), init.map );
								
					//orders for current map or deprecated orders (may happends if not updated by player)
					if ( tactic.turnNumber != init.map.turnNumber) { //ignored ! Too old !
						//console.log("Ordres périmés : tactic.turnNumber=" + tactic.turnNumber + " map.turnNumber=" + init.map.turnNumber ); 
						tactic = null; 
					} 
					else {
						init.orders.acts = init.orders.acts.concat( tactic.acts );
						console.log("Round " + init.map.turnNumber + " : number of orders of wizard " + okas.People.WizardName[iOrder] + " = " + tactic.acts.length);
						iaToPlay=false;
					}
				} 
				
				if (iaToPlay) { //no human orders, ia replace it
				
					//bot enter its orders	
					var tactic = ia.getOrders(iOrder);
					init.orders.acts = init.orders.acts.concat( tactic.acts );
					console.log("nombre ordres du bot " + iOrder + " = " + tactic.acts.length);		
				
				}
				
				readNextOrder(); 
		
			}); //end reading order		
		};
		readNextOrder(); //start reading orders

	
	});
	

}

/**
Solve current turn
*/
nextturn = function (game, map, orders, forceNextTurn) {
	var message = 'Next turn OK' ;
	
	
	//is it time to solve ?
	if ( (map.turnDuration>0) ) { //automated next turn and forced next turn disabled
		if (map.isItTimeForNextAutomatedTurn() == false) {
			message = "map.turnDuration=" + map.turnDuration + " / "  + "No next turn, it's too soon !";
			console.log( message);
			return message;
		}
	}
	
	if ( (map.turnDuration==-2) && ( !forceNextTurn )  ) {
		message = "map.turnDuration=" + map.turnDuration + " / "  + "No next turn : it has to be forced (url...?forced) !";
		console.log( message);
		return message;	
	}
	
	
	//saveMap(map, "map" + leftPad(map.turnNumber, 4) + ".json"); //save map before solving its orders, as an archive file
	saveToJson(game, map, "map_previous" + ".json"); //save map before solving its orders, as an archive file
	
	//1) APPLY ORDERS AND SETTLE FIGHTINGS
	map.addOrdersTactic( orders ); //apply orders to old map
	map.terminateOrders();
	
	//incremente date of next turn until it becomes too soon for next turn
	if (map.turnDuration>0) while(map.isItTimeForNextAutomatedTurn()) map.turnLastDate = new Date(map.turnLastDate.getTime() + (map.turnDuration * 60000) ) ;
	
	saveToJson(game, map, "map.json"); //saved as new current map
	
	console.log("nextturn : " + message);
	
	return message;
}



/** save an object of the game on server */
saveToJson = function(game, object, filename) {
	var path = game + "." + filename
	redis.client.set(path, JSON.stringify(object), function(err) { 
		if(err) console.log(err);
	}); 	
}


/** pad number, used for naming archive map files **/
leftPad = function (n, len) {
    return (new Array(len - String(n).length + 1)).join("_").concat(n);
}
