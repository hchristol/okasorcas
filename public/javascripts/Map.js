

/**
* Map! of the game. 
* @constructor
* @function
* @class
* Describe all the data game required and shown to each player, for one round of the game.
* Give methods to load and save map and to draw map.
* Manage UI events on the map.
*/
function Map(json) { //land, people, planning, diplomacy) { 
	if (json != null) { 
		
		this.turnNumber=json.turnNumber;
		this.turnDuration=json.turnDuration;
		this.turnLastDate=new Date(json.turnLastDate);
		this.aiEnabled=json.aiEnabled; //bots or not bots
		
		this.land = new Land(json.land);
		
		//json reading of units made here because of indexing
		this.people = new People();
				
		//have to put people on map to recreate indexes of places linked to units
		for (var i=0; i<json.people.units.length; i++) {
			var unit = json.people.units[i];
			if (unit!=null) {
				var place = this.land.places[unit.p];
				this.people.addUnit(Unit.fromJSON(unit),place) ;
			}
		}
		
		this.incomes=new Incomes(json.incomes);
		this.spells = new LearnedSpells(json.spells);
		this.diplomacy = new Diplomacy(json.diplomacy);
		
		//History
		this.history = new Object();
		if (json.history!=null) if (json.history.orders != null) { //past orders	
			this.history.orders=new Tactic.fromJSON(json.history.orders, this) ;
		}
		if (json.history!=null) if (json.history.fightings != null) { //past fightings	
			this.history.fightings=json.history.fightings ;
		}	
		
	} else {
		//create new map
		this.turnNumber=1;
		this.turnDuration=1440; //one day : default turn duration
		this.turnLastDate=new Date(); this.turnLastDate.setHours(2); this.turnLastDate.setMinutes(30); //default last resolution : today at 02:30
		this.land = new Land();
		this.people = new People();
		//this.people.disseminateRandomly(this.land); //for testing purpose
		this.incomes = new Incomes();
		this.incomes.updateIncomes(this);
		this.spells=new LearnedSpells();
		this.diplomacy = new Diplomacy();
		this.aiEnabled=false;
		
	}
	
} 

/**
* @property {integer} : count of the past turns in game. Start at Year One.
*/
Map.prototype.turnNumber;
/**
* @property {number} : count of turn in minute (-1 to desactivate automated next turn)
*/
Map.prototype.turnDuration;
/**
* @property {date} : last date of turn resolution
*/
Map.prototype.turnLastDate;

/** true if map need to make its next turn (in automated mode) **/
Map.prototype.isItTimeForNextAutomatedTurn = function() {
	if (this.turnDuration==-1) return false; //automated next turn disabled
	var minutesFromLastNextTurn= (new Date().getTime() - this.turnLastDate.getTime() ) / 60000;
	if (minutesFromLastNextTurn < this.turnDuration) return false;
	return true;
}

/**
* @property {Land} terrains of map
*/
Map.prototype.land;
/**
* @property {People} units on the map
*/
Map.prototype.people;
/**
* @property {Tactic} orders from the past round. Saved in json.
*/
Map.prototype.history;

/**
* @property {Tactic} orders for the current round. Never saved in json (to be put in history if required).
*/
Map.prototype.planning;

/**
* @property {Map} copy of map before any order has been added. Used in Unit.prototype.strength . Never saved in json
*/
Map.prototype.oldMap;


/**
* @property {Incomes} incomes for the current
*/
Map.prototype.incomes;
/**
* @property {LearnedSpells} spell of wizards
*/
Map.prototype.spells;

/**
* @property {Diplomacy} support of each wizard
*/
Map.prototype.diplomacy;

/**
* Deep copy of the map
**/
Map.prototype.clone = function() {
	return new Map( JSON.parse(JSON.stringify(this)));
}

/** create oldMap **/
Map.prototype.initOldMap = function() {
	if (this.oldMap==null) {
		this.oldMap=this.clone(); //memory before adding order
	}
}

/** 
Add an order to the planning. 
**/
Map.prototype.addOrder = function(order) {
	this.initOldMap();
	if (this.planning == null) {
		this.planning = new Tactic(new Array(), this.turnNumber);
	}
	
	//existing order ?
	var i=this.planning.acts.indexOf(order);
	if (i>=0) return;
	
	this.planning.addOrder(order);
	if (order.type == Act.MOVEMENT ) order._indexOfPlaceFrom=0; //number of movement validated on map. See updateOrder()
	if (order.type == Act.RECRUIT ) order._indexOfPlaceFrom=0; //number of recruit already validated on map. See updateOrder()
	
	//apply order to the map
	return this.updateOrder(order);
}

/** 
Update an order of the planning. The order MUST NOT have been canceled : number of movements should have increased, for example.
If the order has been reduced, the map will be wrong. The order should not ever imply any return to past (entropic method)
**/
Map.prototype.updateOrder = function(order) {
	if (this.planning == null) this.planning = new Tactic(new Array(), this.turnNumber);
	var i=this.planning.acts.indexOf(order);
	if (i<0) return;
	

	if (order.type == Act.REINCARNATION ) {
		if (order.parameters.place==null) return;
		if (!this.people.isDead(order.owner)) return;  //no reincarnation if wizard is alive

		this.people.addUnit( 
			new Unit(Unit.WIZARD, order.owner ), //new Unit belongs to its recruiter
			order.parameters.place, true) ;		
						
	}
	
	if (order.type == Act.MOVEMENT ) {
		//make movement of unit
		if (order.parameters.unit==null) return;
		if (order.parameters.places==null) return;
		
		//validate movements from the last position moved to the new one
		for (var k=order._indexOfPlaceFrom; k<order.parameters.places.length;k++) {
			
			var leftPlace = order.parameters.unit.place;
			if (leftPlace==null) return;
						
			//move the unit :
			this.people.moveUnitTo(order.parameters.unit, order.parameters.places[k], true); //force too crowded places, conflicts may occurs
			
			//if the place where the unit come from is emptied, has to deal with the new owner of the place
			if (leftPlace.units !=null) if (leftPlace.units.length==0) {
			
				//diplomacy of the old owner of the left place, to set if this left place remains to its old owner or if it is captured
				oldLeftPlace=this.oldMap.land.places[leftPlace.id];
				var diplomacy=this.oldMap.diplomacy.diploBetween(order.owner, oldLeftPlace.owner);
				
				//potential capture of the place :
				if ( (diplomacy==Diplomacy.WAR) || (diplomacy==Diplomacy.SUPPORT_NO ) || (diplomacy==Diplomacy.NEUTRAL_NO_WIZARD ) || (diplomacy==Diplomacy.SELF )  ) {
				
					//remember it as a place that can be owned only if no one else pass throught it
					//_ownerByMove : owner of the place, only if no other ennemy unit pass on it. see terminateOrders to get the use of _ownerByMove
					if (leftPlace._ownerByMove== null) leftPlace._ownerByMove = order.owner;
					else if (leftPlace._ownerByMove != order.owner) leftPlace._ownerByMove = Place.CONFLICT;
					
				} else { //neutral or friend wizard : ignore this place, just pass througth
					leftPlace.owner=oldLeftPlace.owner; //this empty place remain to its owner
				}
				
				
			}
		}
		
		order._indexOfPlaceFrom=order.parameters.places.length; //in case of next update, movement will restart from this index
	}
	
	if (order.type == Act.RECRUIT ) {
	
		if (order.parameters.unit==null) return;
		if (order.parameters.places==null) return;
	
		if (order._indexOfPlaceFrom >= Act.MAX_RECRUIT_PER_TURN) return; //too much recruit !
	
		for (var k=order._indexOfPlaceFrom; k<order.parameters.places.length; k++) {
			var typeOfUnit=Unit.typeRecruitedOn(order.parameters.places[k].terrain)
			this.people.addUnit( 
				new Unit(typeOfUnit, order.parameters.unit.owner ), //new Unit belongs to its recruiter
				order.parameters.places[k], true) ;
				
		}
		
		order._indexOfPlaceFrom=order.parameters.places.length; //in case of next update, order will restart from this index
	}
	
	if (order.type == Act.SPELL_THROW ) {
		if (order.parameters.unit==null) return;
		if (order.parameters.places==null) return;

		//valid target place ?
		var possiblePlaces = this.spells.placesToThrowSpell(order.owner, order.parameters.unit.place, this.land );
		if (possiblePlaces.indexOf(order.parameters.places[0]) < 0) { order.result=Act.OUT_OF_RANGE; return;}
		
		//movement or attack ?
		if (LearnedSpells.isSpellAMovement(order.parameters.places[0].terrain)) { //movement of wizard
			this.people.moveUnitTo(order.parameters.unit, order.parameters.places[0], true);
		} else { //distant attack
			order._magicUnit=new Unit(Unit.MAGIC_ATTACK, order.owner ); //memorize this new temporary unit to display its strength
			this.people.addUnit( 
				order._magicUnit, //new special magic Unit which belongs to wizard
				order.parameters.places[0], true) ;
		}
	}
	
	
	if (order.type == Act.DIPLOMATIC_SUPPORT ) {
		if (order.parameters.idWizard2==null) return;
		if (order.parameters.support==null) return;
		
		if (  (order.parameters.idWizard2!=order.owner) && ( order.parameters.idWizard2 != 0) ) //security : no diplomacy change on self or neutral wizard
			if ( this.diplomacy.supports[order.owner] != null )
				this.diplomacy.supports[order.owner][order.parameters.idWizard2]=order.parameters.support;
						
	}
	
	
}

/** get order of a given unit **/
Map.prototype.getOrder = function( unit ) {
	if (this.planning == null) this.planning = new Tactic(new Array(), this.turnNumber);
	return unit.order( this.planning );
}

/** use a tactic with unlinked act and link those act to map **/
Map.prototype.addOrdersTactic = function( tactic ) {
	
	for (var i=0; i<tactic.acts.length; i++) {
		var order=tactic.acts[i];
		this.addOrder(order);
	}
	
	//fraud detection for too crowded places. TODO : return an array of hacker wizard and desactivate their orders
	hackers = new Array();
	for (idWizard=1; idWizard<People.WIZARD_COUNT; idWizard++)
		if (this.land.placesTooCrowdedFor(idWizard).length>0) {
			console.log("ALERT !!! wizard " + idWizard + " (" + People.WizardName[idWizard] + ") PUT too much UNITS ! HE's a hacker !");
			
			hackers.push(idWizard);
		}
	
	return hackers;
}

/** Return an array of Fightings, due to places in conflict.  **/
Map.prototype.getFightings = function() {

	if (this.planning == null) return null;

	var fightings = new Array();
	var tmpIndex = new Array(); //used if several order arrive on a same place
	var f; // a fighting
	
	for (var i=0; i<this.planning.acts.length; i++) { //conflict may only occurs whenever an order cause it
		var order =  this.planning.acts[i]; 

		//MOVEMENT :
		if (order.type == Act.MOVEMENT) {
			if (order.parameters.places==null) continue;
			if (order.parameters.places.length<2) continue; //not enought movement
			var place = order.destination(); //where order occurs
			//create fight :
			var f = this.getFightingOnPlace(place,tmpIndex);
			if (f!=null) {	fightings.push(f);	tmpIndex[place.id]=f; }
		}
		
		//REINCARNATION :
		if  (order.type == Act.REINCARNATION) {
			if (order.parameters.place==null) continue;
			var place=order.parameters.place; //where order occurs
			//create fight :
			var f = this.getFightingOnPlace(place,tmpIndex);
			if (f!=null) {	fightings.push(f);	tmpIndex[place.id]=f; }			
		}
		
		//RECRUIT :
		if (order.type == Act.RECRUIT) {
			if (order.parameters.places==null) continue;
			for( var j=0; j<order.parameters.places.length; j++) { //where order occurs (one fight for each place with new recruit)
				var place=order.parameters.places[j];
				//create fight :
				var f = this.getFightingOnPlace(place,tmpIndex);
				if (f!=null) {	fightings.push(f);	tmpIndex[place.id]=f; }		
			}
		}
		
		//SPELL THROW (magic attack) :
		if (order.type == Act.SPELL_THROW) {
			if (order.parameters.places==null) continue;
			var place=order.parameters.places[0];
			//create fight :
			var f = this.getFightingOnPlace(place,tmpIndex);
			if (f!=null) {	fightings.push(f);	tmpIndex[place.id]=f; }		
		}
		
		
	}
	return fightings;
}
/** create a fighting on a given place. Return null if no conflict or if place.id is a key in excludedPlaceArray  (optional) **/
Map.prototype.getFightingOnPlace = function( place, excludedPlaceArray ) {

	if (place==null) return;
	//conflict ?
	if (place.owner != Place.CONFLICT) return null; //no attack
	
	//init fighting
	if (excludedPlaceArray[place.id]!=null) return null; //existing fighting, already solved with another attack on this place
	
	f = new Fighting(place);
	
	f.addStrengthsOnPlace(place, this, false);
	
	//search for support units
	var neighborsPlaces=place.neighbors(this.land);
	for (j=0;j<neighborsPlaces.length;j++) { //places all around
	
		var nearplace=neighborsPlaces[j];
		f.addStrengthsOnPlace(nearplace, this, true);
		
	}
	
	return f;
}

/**
Set results of fightings to the map, and apply all other changes required for next turn
if incrementeTurnNumber = false, doesn't add 1 to turnnumber (usefull for client side simulation)
*/
Map.prototype.terminateOrders = function(incrementeTurnNumber) {

	//empty places that becom neutral because of several movement on it  (see the use of _ownerByMove in updateOrder)
	for (var i=0; i<this.land.places.length; i++) {
		var p = this.land.places[i];
		if (p.units!=null) if (p.units.length==0) if (p._ownerByMove!=null) if (p._ownerByMove==Place.CONFLICT)
			p.owner=0;
	}

	//Fightings
	var fightings = this.getFightings();
	if (fightings == null) return;
	
	//will remember in map history the places where fightings have occured
	if (this.history==null) this.history=new Object();
	this.history.fightings=new Array(); //will store id of places
	
	//terminate fightings : destroy loosing units
	for (var i=0; i<fightings.length; i++) {
		var f = fightings[i];
		f.andTheWinnerIs();
		
		if (f.winner==Fighting.NO_WINNER) { //in case of equal strength, all units are deleted
			this.people.removeUnitsIn(f.place,null);
			f.place.owner=0; //become neutral place
		} else { //only units of winner survive
			this.people.removeUnitsIn(f.place, function(unit) { if (unit.owner!=f.winner) return true; return false; } );
			f.place.updateOwner();
		}
		
		this.history.fightings.push(f.place.id); //remember for later
		
	}
	
	//delete magic attack (special unit used in spell throwing)
	this.removeMagicalUnits();
	
	//Incomes and other : BEFORE deleting units on too crowded places !
	this.incomes.nextTurn(this); 
	
	//Delete units on too crowded places : the poorest units are deleted
	this.removeUnitsOnTooCrowdedPlaces();
	
	
	//living wizards automatically learn spell if they can, dead wizard lost all their units :
	for (idWizard=1;idWizard<People.WIZARD_COUNT;idWizard++) { 
	
		if (!this.people.isDead(idWizard)) {
			
			this.spells.learn(idWizard, this.people.wizards[idWizard].place );
			continue; //alive !
		}
		
		//neutralized places and units
		for (i=0; i<this.land.places.length; i++ ) {
			var place = this.land.places[i];
			if (place.owner!=idWizard) continue;
			
			if (place.isEmpty()) { place.owner=0; continue; }
			
			for( var j=0;j<place.units.length;j++) {
				this.people.changeOwner( place.units[j]  , 0)
			}
			place.updateOwner();
		}
		
		//lost spells
		this.spells.loseSpells(idWizard);
		
	}
		
	//save result
	if (incrementeTurnNumber!=false) this.turnNumber++; //next round !
	
}

/** Delete outnumbered units **/
Map.prototype.removeUnitsOnTooCrowdedPlaces = function() {

	for (var i=0; i<this.land.places.length; i++) {
		this.land.places[i].removeOutnumberedUnits(this.people);
	}
		
}

/** Delete magical temporary units **/
Map.prototype.removeMagicalUnits = function() {

	for (var i=0; i<this.land.places.length; i++) {
		this.people.removeUnitsIn(this.land.places[i], function(unit) { if (unit.type==Unit.MAGIC_ATTACK) return true; return false;} );
	}
		
}


/**
* Diplomacy! Stores the support between wizards
*/
function Diplomacy(json) {

	if (json != null) { 
		//read json
		this.supports=json.supports;		
		
	} else { //new diplomacy
		
		this.supports=new Array();
		for (var i=0; i<People.WIZARD_COUNT; i++) {
			this.supports[i]=new Array();
			for (var j=0; j<People.WIZARD_COUNT; j++) {
				if ( (i==j) && (i!=0) && (j!=0) ) this.supports[i][j]=Diplomacy.SUPPORT_YES;  //support himself
				else this.supports[i][j]=Diplomacy.SUPPORT_NO; //no support at the beginning
			}
		}  
			
	}
}

/** Value for support **/
Diplomacy.SUPPORT_YES=2;
Diplomacy.SUPPORT_NO=1;
Diplomacy.WAR=-1;
/** other values : for  stealthDuration */
Diplomacy.NEUTRAL_NO_WIZARD=0; //diplomacy of only neutral place and unit that belong to no one
Diplomacy.SELF=3; //diplomacy with myself !

/**
* @property {Number} support between wizard : array i of array j of idwizard (j>i)
*/
Diplomacy.prototype.supports;
/**


/** 
* TO json 
*/
Diplomacy.prototype.toJSON = function() { //save only truly required fields
	return { supports:this.supports };
}

/** diplomacy between two wizards : the worst status is returned**/
Diplomacy.prototype.diploBetween = function(idWizard1, idWizard2) {
	var diplomacy=Diplomacy.SELF; //diplomacy with targeted place
	if (idWizard1!=idWizard2) {
		if ( (idWizard1==0) || (idWizard2==0) ) diplomacy=Diplomacy.NEUTRAL_NO_WIZARD;
		else {
			diplomacy=Math.min(this.supports[idWizard1][idWizard2], this.supports[idWizard2][idWizard1]);
		}
	}
	return diplomacy;
}

/**
* Incomes! Stores the incomes of wizard
*/
function Incomes(json) {

	if (json != null) { 
		//read json
		this.stocks=json.stocks;
		this.incomes=json.incomes;			
		
	} else { //new incomes
		
		this.stocks=new Array();
		for (var i=0; i<People.WIZARD_COUNT; i++) this.stocks[i]=Incomes.INITIAL_STOCK;
		this.incomes=new Array();
		for (var i=0; i<People.WIZARD_COUNT; i++) this.incomes[i]=Incomes.INITIAL_INCOMES;	
	}
}
/**
* @property {Number} number of wealth (crystals) owned
*/
Incomes.prototype.stocks;
/**
* @property {Number} variation of wealth (crystals) per turn
*/
Incomes.prototype.incomes;

/** default values **/
Incomes.INITIAL_STOCK = 100;
Incomes.INITIAL_INCOMES = 100;
Incomes.MAX_STOCK = 1000;

/** calculates new incomes values, depending on units on map*/
Incomes.prototype.updateIncomes = function(map) {

	//erase old incomes
	for (var i=0; i<People.WIZARD_COUNT; i++) this.incomes[i]=Incomes.INITIAL_INCOMES;	//basic incomes
		
	for (i=0; i<map.land.places.length; i++ ) {
				
		var place = map.land.places[i];

		place.updateOwner();
		
		//revenues :
		this.incomes[place.owner]+=place.income();		
		
		//spending :
		if (place.units!=null) {
			for (var j=0; j<place.units.length; j++) {
				var unit=place.units[j];
				if (unit.type!=Unit.WIZARD)	this.incomes[unit.owner]-=unit.cost();
			}
		}
	}
	
	//round result
	for (var i=0; i<People.WIZARD_COUNT; i++) this.incomes[i]=Math.round(this.incomes[i]);
}

/**estimate the next stock for a given wizard **/
Incomes.prototype.futureStock = function( idWizard, numberOfTurn ) {	
	if (numberOfTurn==null) numberOfTurn=1;
	var fs=this.stocks[idWizard] + this.incomes[idWizard] * numberOfTurn;
	if (fs > Incomes.MAX_STOCK) fs = Incomes.MAX_STOCK;
	return fs;
}


/** add incomes to stocks. If stocks are negatives, all units became neutral ones**/
Incomes.prototype.nextTurn = function(map) {
	this.updateIncomes(map);
	
	var isThereABankrupcy = false;
	for (var i=0; i<People.WIZARD_COUNT; i++)  {
		this.stocks[i]=this.futureStock(i);
		
		if ((i>0) && (this.stocks[i]<0)) isThereABankrupcy = true;
		
	}
	
	if (isThereABankrupcy) {
	
		//bankruptcy : all units of wizard become neutral 
		for (i=0; i<map.land.places.length; i++ ) {
			var place = map.land.places[i];
			
			if (place.owner==0) continue;
			if (this.stocks[place.owner]<0) {
			
				if (place.units==null) { place.owner=0; continue; }
				if (place.units.length==0) { place.owner=0; continue; }
				
				for( var j=0;j<place.units.length;j++) {
					
					map.people.changeOwner( place.units[j]  , 0)
					place.updateOwner(); //required if wizard present there
										
				}
				
				//conflict with wizard and its became neutral unit ?
				if (place.owner == Place.CONFLICT) {
					map.people.removeUnitsIn(place, function(unit) { if ( (unit.type!=Unit.WIZARD) ) return true;  return false; } );
					place.updateOwner();							
				}
					
			}
			
		}
		
		this.updateIncomes(map);
	}
	
	//non negative stock after bankrupcy
	for (var i=0; i<People.WIZARD_COUNT; i++)  if (this.stocks[i]<0) this.stocks[i]=0;
	
	//dead wizards : loss money !
	for (var i=1; i<People.WIZARD_COUNT; i++) if (map.people.isDead(i)) {
		this.stocks[i]=Incomes.INITIAL_STOCK;
		this.incomes[i]=Incomes.INITIAL_INCOMES;		
	}
	
}

/** 
* TO json 
*/
Incomes.prototype.toJSON = function() { //save only truly required fields
	return { stocks:this.stocks , incomes:this.incomes };
}


/**
* LearnedSpells! Stores the learned spells of wizard
*/
function LearnedSpells(json) {

	if (json != null) { 
		//read json
		this.spells=json.spells;	
		
	} else { //new incomes
		
		this.spells=new Array();
		for (var i=0; i<People.WIZARD_COUNT; i++) this.spells[i]=new Array();
	}
}
/**
* @property array of array of spells learned by wizard [idWizard][i]=idPlace
*/
LearnedSpells.prototype.spells;

LearnedSpells.NO_SPELL_HERE=-1;
LearnedSpells.SPELL_ALREADY_KNOWN=-2;
LearnedSpells.SPELL_LEARNED=0;

/** return the number of spells known by a given wizard **/
LearnedSpells.prototype.count = function( idWizard ) {
	if (this.spells[idWizard]==null) return 0;
	return this.spells[idWizard].length;
}

/** try to learn spell and return result **/
LearnedSpells.prototype.learn= function(idWizard, place ) {  
	var idPlace=place.id;
	if (place.tower==null) return LearnedSpells.NO_SPELL_HERE;
	if (this.spells[idWizard].indexOf(idPlace)==-1) { 
		this.spells[idWizard].push(idPlace); 
		return LearnedSpells.SPELL_LEARNED ; 
	}
	return LearnedSpells.SPELL_ALREADY_KNOWN;
}

/** true if wizard has already learn spell **/
LearnedSpells.prototype.hasLearn = function( idWizard, place ) {
	if (place.tower==null) return true;
	var idPlace=place.id;
	if (idWizard==0) return true;
	if (this.spells[idWizard] == null) return false;
	if (this.spells[idWizard].indexOf(idPlace) >= 0) return true;
	return false;
}

/** Lose all spell (dead wizard) **/
LearnedSpells.prototype.loseSpells = function( idWizard) {
	this.spells[idWizard]=new Array();
}

/** return an array of places where the given wizard has learnt its spells**/
LearnedSpells.prototype.placesWithLearnedSpell = function ( idWizard, land ) {

	var places=new Array();
	for (var i=0; i<this.spells[idWizard].length;i++) {
		places.push( land.places[ this.spells[idWizard][i] ] );
	}
	return places;

	/*
	var me=this;
	return land.filteringPlaces( function(place) {
		if (place.tower==null) return false; //no tower
		if (me.spells[idWizard].indexOf(place.id)>=0) return true; //learned spell here
		return false; //not yet learned
	});
	*/
}

/** return an array containing the number of spells known for a given type of terrain index **/
LearnedSpells.prototype.typeOfSpellKnownForTerrain = function(idWizard,land) {
	var countTerrain=new Array();
	for (var i=0; i<this.spells[idWizard].length;i++) {
		var terrain = land.places[ this.spells[idWizard][i] ].terrain ;
		if (countTerrain[terrain]==null) countTerrain[terrain]=1;
		else countTerrain[terrain]++;
	}
	return countTerrain;
}

/** return an array of places where, from a given place, a wizard can throw it spells**/
LearnedSpells.prototype.placesToThrowSpell = function (idWizard, placeFrom, land ) {

		var places=new Array();
		countTerrain=this.typeOfSpellKnownForTerrain(idWizard, land);
		
		for (var terrain=0; terrain<countTerrain.length; terrain++) {
			if (countTerrain[terrain]==null) continue;
			places = land.placesWithinDistance(placeFrom.position, countTerrain[terrain] * LearnedSpells.rangeOfSpell(terrain) , places, terrain );
		}
		
		return places;
}

/** return true if a spell target a specific terrain is a distant attack or a movement of wizard **/
LearnedSpells.isSpellAMovement = function(terrain) {

	if (terrain==Place.PLAIN) return true;
	if (terrain==Place.FOREST) return true;
	if (terrain==Place.CITY) return true;	
	if (terrain==Place.HILL) return true;
	
	if (terrain==Place.SEA) return false;
	if (terrain==Place.MOUNTAIN) return false;
	if (terrain==Place.DESERT) return false;	
	if (terrain==Place.VOLCANO) return false;
	
	return false;
}

/**
 Spells! strength
**/
LearnedSpells.strength = function(terrain) {
	var baseStrength=Unit.strengthOfType(null, Place.PLAIN, Fighting.ATTACK );
	if (terrain==Place.PLAIN) return Math.round(baseStrength * 1.2);
	if (terrain==Place.FOREST) return Math.round(baseStrength * 2);
	if (terrain==Place.SEA) return Math.round(baseStrength * 3.1);
	if (terrain==Place.MOUNTAIN) return Math.round(baseStrength * 3);
	if (terrain==Place.DESERT) return Math.round(baseStrength * 2.8);
	if (terrain==Place.CITY) return Math.round(baseStrength * 1.1);
	if (terrain==Place.VOLCANO) return Math.round(baseStrength * 3.2);
	if (terrain==Place.HILL) return Math.round(baseStrength * 1.5);
	return Math.round(baseStrength * 1);	
}

/**
 Spells range of attack for one spell 
**/
LearnedSpells.rangeOfSpell = function( terrain ) {
	if (terrain==Place.PLAIN) return Place.SIZE * 4;
	if (terrain==Place.FOREST) return Place.SIZE * 6;
	if (terrain==Place.SEA) return  Place.SIZE * 11;
	if (terrain==Place.MOUNTAIN) return  Place.SIZE * 10;
	if (terrain==Place.DESERT) return Place.SIZE * 7;
	if (terrain==Place.CITY) return Place.SIZE * 12;
	if (terrain==Place.VOLCANO) return Place.SIZE * 10;
	if (terrain==Place.HILL) return Place.SIZE * 5;
	return Place.SIZE * 1.5;
}

/**
* Land! List of places describing the battlefield
* @constructor
* @function
* @class
* Describe the position and type of terrain. Store the graph of the map
* Give methods to compute path from one place to another.
*/
function Land(json) { 
	if (json != null) { 
	
		//read json
		this.height=json.height;
		this.width=json.width;
		this.neighbors=json.neighbors;
		this.labels=json.labels;
		if (this.labels==null) 	this.labels = new Array(); //empty labels
		
		this.places = new Array();
		for (var i=0; i<json.places.length;i++) {
			this.places[i]=Place.fromJSON(json.places[i]);
			this.places[i].id=i;
		}
		
		this.spatialIndexInit();
	}
	else { //new Land

		this.height=750; //default height
		this.width=1000; //default width
		//random places...
		this.places = new Array();
		
		//empty labels
		this.labels = new Array();
		//test :
		//this.labels.push(["Hobbiton", 200, 200, 3.14 / 2]);
		
		var i=0;
		
		//Try to put place not too close from each other. Stop generate places if the number of try exceed tryMax.
		var tryMax=4000;
		var tryCount=0;
		
		while( tryCount<tryMax) {
			
			//choose random position not too close the borders
			var pNew = new Place( new Point( 
				Math.round( Math.random() * ( this.width - Place.SIZE ) ) + (Place.SIZE/2), 
				Math.round( Math.random() * ( this.height -Place.SIZE ) ) + (Place.SIZE/2) ), Place.PLAIN);
			
			
			var placeIsOk=true;
			
			for (var j=0; j<this.places.length; j++) {
				var d=pNew.position.distance(this.places[j].position);
				if ( d <= Place.MIN_INTER_DISTANCE ) 
					placeIsOk=false;
				//refuse the place if it stands in the confusing area, where it looks as true neighbor but is not.
				if ( ( d > Place.NEIGHBOR_MAX_INTER_DISTANCE ) &&
					 ( d <= ( Place.NEIGHBOR_MAX_INTER_DISTANCE * 1.2 ) ) )
					placeIsOk=false;
			}
			
			
			if ( placeIsOk ) {
				this.places[i]= pNew; pNew.id=i; i++; //validate the new place
				tryCount=0;
			} else {
				tryCount++; //next try
			}
			
		}
		
		//alert( this.places.length + " places created" );
		
		//create graph index
		this.graphInitByDistance();
		
		//set different terrains
		//begin with SEA : affect SEA to places with few neighbors
		for (var i=0; i<this.places.length; i++) {
			if (this.neighbors[i].length<=Math.random()*4) this.places[i].terrain=Place.SEA;
		}
		
		this.graphInitByDistance(); //to create more link between long distant seas
		
		//update again graph because of sea increased neighbors tolerance
		this.graphRemoveCrossingNeighbors();
		

		//continue affecting terrain on ground
		//casual terrain
		for (i=0; i<this.places.length/3; i++) { //several tries
			var randomIndex = Math.floor( Math.random() * this.places.length );
			var randomPlace = this.places[ randomIndex ] ;

			//random type of terrain
			var rnd=Math.random()*100;
			if (rnd<=50) continue;
			if (rnd>50) { terrain=Place.HILL; }
			if (rnd>65) { terrain=Place.MOUNTAIN; }
			if (rnd>75) { terrain=Place.DESERT; }
			if (rnd>90) { terrain=Place.FOREST }

			if( randomPlace.terrain !=Place.SEA ) randomPlace.terrain = terrain;
			
			//terrain propagation
			var neighborIndex = randomIndex;
			var propagationSize = Math.random() * 10;
			for (var j=1; 	j<=propagationSize; j++) {
				var neighborIndexes= this.neighbors[neighborIndex] ;
				//random neighbor
				neighborIndex = neighborIndexes[ Math.floor(Math.random() * neighborIndexes.length) ];
				if (this.places[neighborIndex].terrain!=Place.SEA) this.places[neighborIndex].terrain=terrain;
			}
			
		}
		//rare terrains
		for (i=0; i<this.places.length/10; i++) { //several tries
			var randomIndex = Math.floor( Math.random() * this.places.length );
			var randomPlace = this.places[ randomIndex ] ;

			//random type of terrain
			var rnd=Math.random()*100;
			var terrain=Place.FOREST;
			if (rnd<=50) continue;
			if (rnd>50) { terrain=Place.CITY; }
			if (rnd>80) { terrain=Place.VOLCANO; }

			if( randomPlace.terrain !=Place.SEA ) randomPlace.terrain = terrain;
			
			//no terrain propagation.

			//tower on this terrain ?
			//if ( (towerCount<8) ||  (Math.random()*100< 0  )  )
			//	{ randomPlace.tower=towerCount; towerCount++; }
			
		}

		this.spatialIndexInit();

		//put towers!! (spatialindex must have been made)
		var towerCount=0;
		var towerMaxCount=8 ;
		while( towerCount<towerMaxCount) {
			var bounding=0.7;
			var randomX=(1-bounding)*0.5*this.width + towerCount * this.width*bounding / towerMaxCount + 6 * Place.SIZE * (0.5-Math.random());
			if (randomX<0) randomX=0; if (randomX>this.width) randomX=this.width;

			var randomY=(1-bounding)*0.5*this.height + towerCount * this.height*bounding / towerMaxCount + 6 * Place.SIZE * (0.5-Math.random());
			if (randomY<0) randomY=0; if (randomY>this.height) randomY=this.height;

			var randomPlace = this.nearestPlace( new Point(randomX, randomY) );
			if (randomPlace.tower ==null) {
				randomPlace.tower=towerCount;
				towerCount++;
			}
			
		}
		
	
		
	}
	
} 

/** 
* TO json 
*/
Land.prototype.toJSON = function() { //save only truly required fields
	return { height:this.height, width:this.width, places:this.places, labels:this.labels, neighbors:this.neighbors };
}

/**
* @property {Number} height of the map in pixel
*/
Land.prototype.height;
/**
* @property {Number} width of the map in pixel
*/
Land.prototype.width;

/**
* @property {Array} places - list of all place
*/
Land.prototype.places;

/**
* @property {Array} labels - texts on map 
*/
Land.prototype.labels;

/**
* @property {Array} neighbors - indexes of neighbors places, given an index of a place
*/
Land.prototype.neighbors;

/**
* @property {Array} spatialIndex - array 2D of tiles. Each tiles is an Array of places related to it :   spatialIndex[xtile][ytile][0...n] : a Place in tile 
*/
Land.prototype.spatialIndex;
/**
* Number of tile for spatial index
*/
Land.TILE_NUMBER_OF_COLUMNS=6; 

/**
* @function compute tile for spatial index. Required only at first instance
*/
Land.prototype.spatialIndexInit = function() {
	
	//init tiles arrays
	this.spatialIndex=new Array();
	for (var i=0;i<Land.TILE_NUMBER_OF_COLUMNS;i++) { 
		this.spatialIndex[i]=new Array();
		for (var j=0;j<Land.TILE_NUMBER_OF_COLUMNS;j++) {
			this.spatialIndex[i][j]= new Array();
		}
	}
	
	//Put each place in its own tile
	for (var i=0; i<this.places.length; i++) {
		this.tileRelated(this.places[i].position).push( this.places[i] );
	}			
	
	//alert( this.spatialIndex[2][2].length );
	
}

/**
* @function return the array of the tile related to the position, or null if no tile at that position.
*/
Land.prototype.tileRelated = function(position) {
	var coord= this.tileCoordinate(position);
	if (coord == null) return null;
	return this.spatialIndex[coord.x][coord.y];
}
/** column and row of the tile related to the position. Return null if coordinates are out of bounds **/
Land.prototype.tileCoordinate = function(position) {
	var tilewidth=this.width/(Land.TILE_NUMBER_OF_COLUMNS-1);
	var tileheight=this.height/(Land.TILE_NUMBER_OF_COLUMNS-1);
	var xtile= Math.round( position.x / tilewidth ); if (xtile<0) return null; if (xtile>Land.TILE_NUMBER_OF_COLUMNS) return null;
	var ytile= Math.round( position.y / tileheight ); if (ytile<0) return null; if (ytile>Land.TILE_NUMBER_OF_COLUMNS) return null;
	return new Point( xtile, ytile);
}

/**
* @function return an array of tile(s) near a position. Used by nearestPlace function.
*/
Land.prototype.nearestTiles = function(position) {
	var nt = new Array();
	nt.push( this.tileRelated(position)) ; //obvious tile
	
	//other tiles near position ?
	var t;
	t= this.tileRelated(position.add( Place.SIZE/2, Place.SIZE/2) ); if (t!=null) nt.push(t);
	t= this.tileRelated(position.add( -Place.SIZE/2, Place.SIZE/2) ); if (t!=null) nt.push(t);
	t= this.tileRelated(position.add( Place.SIZE/2, -Place.SIZE/2) ); if (t!=null) nt.push(t);
	t= this.tileRelated(position.add( -Place.SIZE/2, -Place.SIZE/2) ); if (t!=null) nt.push(t);
	
	return nt;
}

/**
* @function return the nearest place of a given position. Optional : Return null if the distance between the place and position is > distMax
*/
Land.prototype.nearestPlace = function(position, distMax) {
	var tiles = this.nearestTiles(position); //may be several tile if position is on border of tiles	

	var d; //min found distance
	var iTileNearest=0;
	var iPlaceNearest=0;
	for( var iTile=0; iTile<tiles.length; iTile++) {
		var tile=tiles[iTile];
		for (var i=0; i<tile.length; i++) {
			if ( (iTile==0 ) && (i==0) ) d= position.distance(tile[i].position);
			else {
				var d2 = position.distance(tile[i].position);
				if (d2<d) { d=d2; iTileNearest=iTile; iPlaceNearest=i;}
			}
		}
	}
	
	//try improve result 
	if ( (distMax==null) || (distMax>d) ) return tiles[iTileNearest][iPlaceNearest];
	else return null;
	
}

/**
* @function return an Array of places within a distance from a given position (or add found places to the given placesToAdd array)
*/
Land.prototype.placesWithinDistance = function(position, distance, placesToAdd, terrainFilter) {
	//distance, in tile coordinate, of possible distance tiles from the tile related to position
	
	var tilewidth=this.width/(Land.TILE_NUMBER_OF_COLUMNS-1);
	var tileheight=this.height/(Land.TILE_NUMBER_OF_COLUMNS-1);
	
	var dTileX=1 + Math.floor(distance / tilewidth  );
	var dTileY=1 + Math.floor(distance / tileheight  );
	
	//DEBUG : trace le cercle de portée
	//if (INPUT_ORDER!=null) {
	//	position.showEnlightedCircle(INPUT_ORDER.ctxSelectedUnit, "red", distance);
	//}
	
	var places ;
	if (placesToAdd == null) places = new Array(); else places = placesToAdd;
	
	coord= this.tileCoordinate(position);
	if (coord == null) return places;
	
	//search places in the possibles tiles (optimization)
	for ( var i= coord.x - dTileX; i<=coord.x + dTileX; i++) { 
		if ( (i<0) || (i>=Land.TILE_NUMBER_OF_COLUMNS) ) continue;
		for ( var j= coord.y - dTileY; j<=coord.y + dTileY; j++) {
			if ( (j<0) || (j>=Land.TILE_NUMBER_OF_COLUMNS) ) continue;
			
			var tile = this.spatialIndex[i][j]
			if (tile == null) continue;
			for (var k=0; k<tile.length; k++) { //make true distance test with places in neighbor tile
				var p = tile[k];
				if (p.position.distance(position) <= distance) {
					if ( (terrainFilter==null) || (terrainFilter==p.terrain ) ) 	
						if (places.indexOf(p)<0) 
							places.push(p); //ok, one place found
				}
			}
			
		} 
	}
	
	return places;
}

/** return an array of too crowded places with units that belongs to the given wizard.  **/
Land.prototype.placesTooCrowdedFor =  function(idWizard) {
	var tooCrowded = new Array();
	for (var i=0; i<this.places.length; i++) {
		if (this.places[i].units==null) continue;
		if (this.places[i].units.length<=People.MAX_UNIT_PER_PLACE) continue;
		
		//too crowded place. Same wizard ?
		var unitsOfWizard=this.places[i].unitsOf(idWizard);
		if (unitsOfWizard.length>People.MAX_UNIT_PER_PLACE)
			tooCrowded.push(this.places[i]);
			
	}
	return tooCrowded;
}

/**
* useful ?
* @function {Point} size - coordinate of the relative bottom right corner of the map in pixels
*/
Land.prototype.size = function() {
	return new Point( this.width, this.height );
}





/**
* Create graph relation by considering neighbors places close to each others.
**/
Land.prototype.graphInitByDistance = function(removeCrossingNeighbors){

	console.log("Map.js : graphInitByDistance" );
	
	this.neighbors= new Array();
	for(var i=0; i<this.places.length;i++) {
		var countNeighbor = 0;
		this.neighbors[i]=new Array();
		
		for(var j=0; j<this.places.length;j++) {
		
			if (i==j) continue; //not neighbor of itself !
			
			var dist_ij=this.places[i].position.distance(this.places[j].position);
			//warning if too close place
			if ( dist_ij <=  Place.NEIGHBOR_MAX_INTER_DISTANCE * 0.4 ) {
				console.log("Places " + i + " and " + j + " are too close !! dist_ij = " + dist_ij );
			}
			
			var neighborOk=false; 
			
			if ( dist_ij <= Place.NEIGHBOR_MAX_INTER_DISTANCE ) {
				neighborOk=true;
			} 
			else { 
			
				//for sea terrain, allow greater distance for neighbors (and even more if both are seas)
				if ( ( this.places[i].terrain == Place.SEA ) || ( this.places[j].terrain == Place.SEA )  ) {
					if ( dist_ij <=  Place.NEIGHBOR_MAX_INTER_DISTANCE * 1.5 ) {
						neighborOk=true;
					}
				}
				if ( ( this.places[i].terrain == Place.SEA ) && ( this.places[j].terrain == Place.SEA )  ) {
					if ( dist_ij <=  Place.NEIGHBOR_MAX_INTER_DISTANCE * 3 ) {
						neighborOk=true;
					}
				}
			}
		
			if (neighborOk) {
				this.neighbors[i][countNeighbor]=j;
				countNeighbor++;					
			}
		}
		
	}
	
	//delete path with too small angle with other path
	for(var i=0; i<this.places.length;i++) {
		this.graphRemoveTooClosePath(i);
	}
	
}

/**
* Remove the link of a place that are too close : angle from one to the other is too small, and so visually confusing
**/
Land.prototype.graphRemoveTooClosePath = function(idPlace){
	var neighborToDelete=-1;
	var maxDistance=-1; //to remove the farest neighbor if multiple choices
	for ( var n1=0; n1<this.neighbors[idPlace].length; n1++) { for ( var n2=0; n2<this.neighbors[idPlace].length; n2++) {
		if (n1==n2) continue;
		
		//both vectors
		var v1=this.places[this.neighbors[idPlace][n1]].position.subtract(this.places[idPlace].position) ;
		var v2=this.places[this.neighbors[idPlace][n2]].position.subtract(this.places[idPlace].position) ;
		//...and their angle :
		var sin = Math.abs( Point.sin( v1, v2 ) );
		if (sin<0.3) { //too close ! Remove the worst 
			if ( Point.scalarProduct(v1,v2) <0 ) continue; //opposite vectors, not confusing
			var d1=Point.distance(v1); var d2=Point.distance(v2);
			if ( (d1>maxDistance) && (d2>maxDistance) ) { //only if no another farest neighbor is to be deleted
				if (Point.distance(v1) > Point.distance(v2) ) 
						{ neighborToDelete=n1; maxDistance=d1;}
				else 	{ neighborToDelete=n2; maxDistance=d1; }
			}
		}
	}}
	
	if (neighborToDelete>=0) {
		this.graphRemovePath(idPlace,this.neighbors[idPlace][neighborToDelete] );
		this.graphRemoveTooClosePath(idPlace); //and restart, to ensure that there are no other too close path remaining
	}
}

/**
* Remove the link beetwen two places.
* @param reverseDelete is to be used only for internal purpose.
**/
Land.prototype.graphRemovePath = function(idPlace1, idPlace2, reverseDelete){
	var iNeighbor=this.neighbors[idPlace1].indexOf(idPlace2);
	if (iNeighbor >= 0 ) this.neighbors[ idPlace1 ].splice(iNeighbor,1);
	if (reverseDelete==null) this.graphRemovePath(idPlace2,idPlace1,true); //reverse deleting to ensure both links are removed
}

/**
* Update graph by deleting crossing path from one place to another
**/
Land.prototype.graphRemoveCrossingNeighbors = function(removeCrossingNeighbors){
	
	
	//look for crossing relations (caused by increased distance tolerance to neighbors)
	var allSegments=new Array(); //junction between places, indexed as minId + 1000*maxId, and contains pair of 2 positions 
	for (var i=0; i<this.places.length; i++) {
		//store each segment beetwen sea and its neighbors as a potential crossing issue. 
		for (var countNeighbor=0; countNeighbor<this.neighbors[i].length; countNeighbor++)  {
			var minId=Math.min(i,this.neighbors[i][countNeighbor]); 
			var maxId=Math.max(i,this.neighbors[i][countNeighbor]); 
			//var id= (minId + 1000 * maxId);
			allSegments[minId + 1000 * maxId ] = [ this.places[minId], this.places[maxId] ] ;
		}
	}
	//search crossing relation
	var crossingSegments=new Array();
	//var tmpCOUNTdebug=0;
	for( var id1 in allSegments ) { for( var id2 in allSegments ) {
		if (id1 == id2) continue;
		var segment1= allSegments[id1]; var segment2 = allSegments[id2];
		//ignore segment sharing a same place
		if (segment1[0].position == segment2[0].position) continue;
		if (segment1[1].position == segment2[0].position) continue;
		if (segment1[0].position == segment2[1].position) continue;
		if (segment1[1].position == segment2[1].position) continue;
		
		
		if (Point.isSegmentIntersected(segment1[0].position, segment1[1].position, segment2[0].position, segment2[1].position) == true) {
			//crossingSegments[id1] = segment1; crossingSegments[id2]=segment2;
			crossingSegments[Math.min(id1,id2) + " ++ " + Math.max(id1,id2)] = [segment1,segment2];
			//alert(id1 + "->" + segment1[0].position + " - " + segment1[1].position    + "        " + id2 + "->" + segment2[0].position + " - " + segment2[1].position);
			//tmpCOUNTdebug++; if (tmpCOUNTdebug>=1) return;
		}
	}}
	//...and remove it from neighbors
	var deletedSegments=new Array(); //store deleted segment to minimize de number of required deletings
	for( var pairOfSegment in crossingSegments ) { 
		//has to choose wich one is to be deleted : calculate weight for each one
		var weight=new Array(); 
		weight[0]=Math.random(); 
		var idPlaceOfSegment;
		
		//one of the segment has already been deleted ?
		if (deletedSegments.indexOf(crossingSegments[pairOfSegment][0])>=0 ) continue;
		if (deletedSegments.indexOf(crossingSegments[pairOfSegment][1])>=0 ) continue;
		
		for( idPlaceOfSegment=0; idPlaceOfSegment<=1; idPlaceOfSegment++) {
			
			var placeA=crossingSegments[pairOfSegment][idPlaceOfSegment][0];
			var placeB=crossingSegments[pairOfSegment][idPlaceOfSegment][1];
			
			weight[idPlaceOfSegment]=Point.distance( placeA.position, placeB.position ) / Place.NEIGHBOR_MAX_INTER_DISTANCE * 60 ;
			
			//prefer ground rather than sea
			if (  (placeA.terrain==Place.SEA) && (placeB.terrain==Place.SEA) ) weight[idPlaceOfSegment]+=100;
			//and the more the places have related neighbors, the more it is suitable to remove one of them
			weight[idPlaceOfSegment]+=this.neighbors[placeA.id].length + this.neighbors[placeB.id].length ;
		}
		
		//the worst weight designs the one to be deleted
		var idSegmentToDelete=0; if (weight[1]>weight[0]) idSegmentToDelete=1;
		
		deletedSegments.push( crossingSegments[pairOfSegment][idSegmentToDelete] );
		
		//delete the path
		this.graphRemovePath(crossingSegments[pairOfSegment][idSegmentToDelete][0].id, crossingSegments[pairOfSegment][idSegmentToDelete][1].id );
		
		//delete each part relation
		/*
		for( idPlaceOfSegment=0; idPlaceOfSegment<=1; idPlaceOfSegment++) {
			var placeA=crossingSegments[pairOfSegment][idSegmentToDelete][idPlaceOfSegment];
			var placeB=crossingSegments[pairOfSegment][idSegmentToDelete][(idPlaceOfSegment+1)%2];
			var iplaceB=this.neighbors[ placeA.id ].indexOf( placeB.id);

			if (iplaceB >= 0 ) {
//alert( "this.neighbors[ placeA.id ]=" + this.neighbors[ placeA.id ] + "         iplaceB=" + iplaceB );
				this.neighbors[ placeA.id ].splice(iplaceB,1);
//alert( "this.neighbors[ placeA.id ]=" + this.neighbors[ placeA.id ] + "  une fois removed b"); return;
			}
		}
		*/
		
	}
	
};

/** return an array of place given a filter function that take a place as argument and should return true or false, true to retain place**/
Land.prototype.filteringPlaces = function (filterFunction) {
	var goodPlaces=new Array();
	for( var i=0; i<this.places.length; i++) {
		if ( filterFunction( this.places[i] ) ) goodPlaces.push( this.places[i] );
	}
	return goodPlaces;
}

/**
* Place! A terrain on the Land
* @constructor
* @function
* @class
* Describe the position and type of the place
*/
function Place(position, terrain) { 

	this.position = position; this.terrain=terrain;	
	this.boundaryRandom=9+Math.round(Math.random()*990); 

} 

/**
* Types of terrain
*/
Place.SEA=0;
Place.DESERT=1;
Place.MOUNTAIN=2;
Place.FOREST=3;
Place.PLAIN=4;
Place.CITY=5;
Place.VOLCANO=6;
Place.HILL=7;
/*
Place.SWAMP=6;
Place.HARBOR=22;
*/
Place.TERRAIN_COUNT=8; //count type of terrain

/** Incomes! of terrain **/
Place.incomeOfTerrain = function(terrain) {
	if (terrain==Place.PLAIN) return 16;
	if (terrain==Place.HILL) return 14;
	if (terrain==Place.CITY) return 30;
	if (terrain==Place.FOREST) return 12;
	if (terrain==Place.SEA) return 12;
	if (terrain==Place.MOUNTAIN) return 10;
	if (terrain==Place.DESERT) return 8;
	if (terrain==Place.VOLCANO) return 8;
	return 14; //unknown place : medium income. medium incomes is used to scale strenght of units too. See averageNumberOfTerrainForOneUnit
}


/** 
* TO json 
*/
Place.prototype.toJSON = function() { //abreviate field and filter non required attributes
	if (this.tower!=null)
		return { p:this.position, t:this.terrain, b:this.boundaryRandom, o:this.owner, tower:this.tower};
	else return { p:this.position, t:this.terrain, b:this.boundaryRandom, o:this.owner}
}
/**
* from json
*/
Place.fromJSON = function(json) {
	var p = new Place( Point.fromJSON(json.p), json.t);
	p.boundaryRandom = json.b;
	p.owner=json.o;
	p.tower=json.tower;
	return p;
}
	

/**
* @property {Number} id - id of the place in Land
*/
Place.prototype.id;

/**
* @property {Point} position - coordinate of place in pixels
*/
Place.prototype.position;

/**
* @property {Integer} type of terrain
*/
Place.prototype.terrain;

/**
* @property {Integer} id of tower (or null if no tower)
*/
Place.prototype.tower;


/**
* @property {Integer} random number for the boundary of the place (to minimize data to be saved, instead of saving all points of boundary).
*/
Place.prototype.boundaryRandom = null;

/**
* @property {Array} unit(s) occupying the place : An array of Units.
*/
Place.prototype.units = null;

/**
* @property {Integer} owner of the place 
	if several units of different owners stand on this place, than owner will be Place.CONFLICT
*/
Place.prototype.owner = 0;
Place.CONFLICT = -1; //value of owner when several units

/** 
return index of Wizard (in units) if there is wizard on the place, -1 else.
*/
Place.prototype.indexOfWizard = function() {
	if (this.units == null) return -1;
	for (var i=0; i<this.units.length; i++ ) { if (this.units[i].type == Unit.WIZARD ) { return i; } }
	return -1;
}


/**
* Number of points of the random boundary
* @function
* @param 
* @returns {Number} 
*/
Place.prototype.boundaryNumberOfPoints = function(){	
	return 25 + (this.boundaryRandom % 15);
};

/**
* Generate a random boundary for the place by using this.boundaryRandom, and return it 
* @function
* @param 
* @returns {Array} of pairs of number (coordinates)
*/
Place.prototype.boundaryPathCoord = function(){

	var maxPoints=this.boundaryNumberOfPoints();
	
	var boundary=new Array();
	
	for (var i=0; i<maxPoints; i++) {
		var pt=this.boundaryPoint(i);
		boundary[2*i] = pt.x;
		boundary[2*i+1] = pt.y;
	}
		
	return boundary;
};

/** 
* Generate a random boundary for the place by using this.boundaryRandom, and return it 
* @function
* @param 
* @returns {Array} of points
*/
Place.prototype.boundaryPath = function(){

	var maxPoints=this.boundaryNumberOfPoints();
	
	var boundary=new Array();
	
	for (var i=0; i<maxPoints; i++) boundary[i] = this.boundaryPoint(i);
	
	return boundary;
};

/**
* Generate the index given point of the random boundary
* @function
* @param 
* @returns {Array} of points
*/
Place.prototype.boundaryPoint = function(i){
	var rand1= this.boundaryRandomNumber(i);
	var rand2=Math.abs(Math.cos(9+rand1*this.boundaryRandom));
	return Point.polar( Place.NEIGHBOR_MAX_INTER_DISTANCE / 2 * (0.7 + (rand1+.2)/ (0.3+this.boundaryNumberOfPoints()/15) ) , Math.PI * 2 / this.boundaryNumberOfPoints() * (i + rand2 ) ).add( this.position);

};	
Place.prototype.boundaryRandomNumber = function(iPoint){
	//pseudo random with sin :-P
	rand= Math.abs(Math.sin(iPoint*(100-iPoint)*this.boundaryRandom));
	return rand
}

/**
Return an array of places, neighbors of a given place
*/
Place.prototype.neighbors = function(land) {
	var neighbors= new Array();
	for (var i=0; i<land.neighbors[this.id].length;i++) {
		neighbors.push( land.places[land.neighbors[this.id][i]] );
	}
	return neighbors;
}

//true if two places are linked
Place.prototype.isNeighbor = function( otherPlace, land ) {
	if ( land.neighbors[this.id].indexOf(otherPlace.id) != -1) return true;
	return false;
}

/** update the owner of a place, by looking at its current units **/
Place.prototype.updateOwner = function( ) {
	if (this.units == null) return;
	if (this.units.length==0) {
		if (this.owner==Place.CONFLICT) this.owner=0; //no more conflict on emptied places
		return; 
	}
	this.owner=this.units[0].owner; 
	for (var i=1; i<this.units.length; i++) {
		if (this.owner != this.units[i].owner) this.owner=Place.CONFLICT;
	}
	return this.owner;
}

/** incomes from a given place **/
Place.prototype.income = function( ) {
	if (this.owner==Place.CONFLICT) return 0;//no gain on warland
	return Place.incomeOfTerrain(this.terrain);
}






/** size of a place (width & height), in pixel */
Place.SIZE=50; 
/** minimum distance between places, in pixels */
Place.MIN_INTER_DISTANCE=Place.SIZE; 
/** maximum distance between places, in pixels, to let them be considered as neighbors (graph) */
Place.NEIGHBOR_MAX_INTER_DISTANCE=Place.SIZE*Math.sqrt(2); //to be certain that there will not be cross neighbors

/** eliminate units if the place is too crowded **/
Place.prototype.removeOutnumberedUnits = function(people) {
	if (this.units==null) return;
	var maxUnit=People.MAX_UNIT_PER_PLACE;
	
	if ( (this.owner==0) && (this.units.length>0)) { //neutral place has to be  with less units (avoid to much neutral units)
		//if (Unit.typeRecruitedOn(this.terrain) != this.units[0].type)
		maxUnit=1; 
	}
	
	while (this.units.length>maxUnit) {
		
		//take the weakest unit
		var weak=this.units[0];
		for (var i=0; i<this.units.length;i++)
			if (this.units[i].type<weak.type) weak=this.units[i];
		
		people.removeUnit(weak);
		
	}
}


/** true if no units **/
Place.prototype.isEmpty = function() {
	if (this.units==null) return true;
	if (this.units.length==0) return true;
	return false;
}

/**  array of units that belongs to wizard **/
Place.prototype.unitsOf = function(idWizard) {
	var u=new Array();
	if (this.units==null) return u;
	
	for (var j=0; j<this.units.length;j++) {
		if (this.units[j].owner==idWizard)
			u.push(this.units[j]);
	}
	
	return u;
}




/**
* People! on the map. One unit per place.
* @constructor
* @function
* @class
* Describe units on the map
*/
function People() { 
	this.units = new Array();
	this.wizards = new Array();
	this.unitNextId=1;
	this.unitFromId=new Array();
} 


People.WizardName = [ "Neutre", "Ange", "Crochet", "Elrond", "Gengis", "Odin", "Sauron", "Thorin", "Vaillant" ];
People.WIZARD_COUNT=People.WizardName.length;
People.MAX_UNIT_PER_PLACE=2; /** max number of units on a place */
People.PLACE_TOO_CROWDED=-1; /** code to indicate there's no more place for another unit **/
People.INVALID_UNIT_ID=-2;  /** unit id duplicated **/

/** 
* TO json 
*/
People.prototype.toJSON = function() { //save only truly required fields
	return { unitNextId:this.unitNextId, units:this.units };
}

/**
* @property {Array} units on map (army, wizard, etc...)
*/
People.prototype.units;
/** unit id generator, increased each time a unit is created (see addUnit) **/
People.prototype.unitNextId ;
/** unit index by id **/
People.prototype.unitFromId;

/**
* @property {Array} units on map that are wizards (index)
*/
People.prototype.wizards;


/**
* randomly generate units on a given land
*/
People.prototype.disseminateRandomly = function(land) {

	var idWizard=1;
	
	for( var i=0; i<land.places.length ; i++ ) {
		
		var place = land.places[Math.round(Math.random()* (land.places.length - 1))];
		if (place.units!=null) continue; //place already occupied
		
		//add only wizard
		if ( idWizard <= 8) this.addUnit( new Unit(Unit.WIZARD, idWizard ) , place); idWizard++;
		
		
	}
};

/**
*  Add a unit to the map. This method must be the only way to add an unit on map, because of indexing.

	The number of unit can't exceed MAX_UNIT_PER_PLACE.
	If unit is correctly added, return it. Return People.PLACE_TOO_CROWDED if unit can't be added.
	if forceCrowdedPlace = true, ignore such a constraint.
*/
People.prototype.addUnit= function(unit,place, forceCrowdedPlace)  {
	if (place.units==null) place.units=new Array();
	
	if (forceCrowdedPlace!= true) if (place.units.length >= People.MAX_UNIT_PER_PLACE) return People.PLACE_TOO_CROWDED; 
	
	//create id for this unit 
	if (unit.id == null) { 
		unit.id=this.unitNextId; 
		this.unitNextId++;
	} else { //unique id ?
		if ( (this.unitFromId[unit.id] != null) && (this.unitFromId[unit.id] != unit ) ) return People.INVALID_UNIT_ID; 
		if (unit.id>=this.unitNextId) this.unitNextId = unit.id + 1 ; //search the next possible id for unit
	}
	this.unitFromId[unit.id]=unit; //indexed id	
	
	if ( (place.units.length>0) && ( place.owner!=unit.owner ) ) place.owner=Place.CONFLICT; 
	if (place.units.length==0) place.owner=unit.owner; //required if the empty place is conquered by a new unit
	
	place.units.push(unit);
	
	unit.place=place;
	this.units.push(unit);
	if ( unit.type == Unit.WIZARD) {
		if (this.wizards[unit.owner]!=null) { if (this.wizards[unit.owner] != unit ) {
			this.wizards[unit.owner].type = Unit.WARRIOR; //if previous army was the wizard, transform it back to plain army : there can be only ONE wizard 
		} }
		this.wizards[unit.owner]=unit;
	}
	
	return unit;
};

/**
* Delete an unit. This method must be the only way to remove an unit on map, because of indexing.
**/
People.prototype.removeUnit= function(unit)  {
	
	if (unit.id != null) this.unitFromId[unit.id]==null; //removed from index id
	
	var i;
	if (unit.place != null) { //remove unit on its place
		i=unit.place.units.indexOf(unit);
		if (i>=0) unit.place.units.splice(i,1);
		unit.place.updateOwner();
		unit.place=null;
		if (unit.kineticImg != null) unit.kineticImg.destroy(); 
	}
	i=this.units.indexOf(unit);
	if (i>=0) this.units.splice(i,1);
	if (unit.type == Unit.WIZARD) this.wizards[unit.owner]=null; 
};

/**
* Delete all units present in a given place
* filterFunction(unit) can be called to eliminate only some given units (true => unit removed)
**/
People.prototype.removeUnitsIn= function(place, filterFunction )  {
	if ( place.units==null) return;
	var nbOfValidUnits=0; //incremented to ignore units to be keep
	while ( place.units.length > nbOfValidUnits) { 
		if (filterFunction == null)	this.removeUnit(place.units[0]);  //no filter : eliminate all units
		else { //filtering : 
			if (filterFunction(place.units[nbOfValidUnits])) this.removeUnit(place.units[nbOfValidUnits]);
			else nbOfValidUnits++;
		}
	}
};

/**
* change the owner of a given unit
*/
People.prototype.changeOwner = function(unit, newOwner) {
	if (unit.type == Unit.WIZARD) return; //wizard can't change of owner
	unit.owner = newOwner;
	unit.place.updateOwner();
}

/** move a unit to a given place. If place is too crowded, return People.PLACE_TOO_CROWDED and do nothing */
People.prototype.moveUnitTo= function(unit, place, forceCrowdedPlace) {
	if (forceCrowdedPlace!=true) if ( (place.units!=null) && (place.units.length >= People.MAX_UNIT_PER_PLACE) ) return People.PLACE_TOO_CROWDED; //too crowded !
	this.removeUnit(unit);
	return this.addUnit(unit,place,forceCrowdedPlace);
}

/** true if wizard is dead **/
People.prototype.isDead = function(idWizard) {
	return (this.wizards[idWizard]==null);
}

/**
* Unit! on the map
* @constructor
* @function
* @class
* Describe units on the map
*/
function Unit(type,owner) { 
	this.type = type; 
	if (owner==null) this.owner=0;
	else this.owner=owner;
} 

/** feeble to important - ordered types of units */
Unit.CORSAIR=0;
Unit.PLUNDERER=1;
Unit.DWARF=2;
Unit.BOWMAN=3;
Unit.RIDER=4;
Unit.TREBUCHET=5;
Unit.DRAGON=6;	
Unit.PEASANT=7;
Unit.WARRIOR=31;


Unit.MAGIC_ATTACK=59; //special unit dedicated to magic thrown spell attack. 
Unit.WIZARD=60; 

/** movement! return the speed of unit on a given type of terrain, in day for an average distance
the more rapid the unit is, the less this value is */
Unit.movementFactorOfType = function(typeUnit, terrain) {
	if (terrain==null) terrain=Place.PLAIN;
	
	if (typeUnit == Unit.WIZARD )  {
	}
	if (typeUnit == Unit.WARRIOR ) {

	}
	if (typeUnit == Unit.RIDER ) {
		if (terrain!=Place.SEA)	return Unit.movementFactorOfType(null, terrain) * 0.66;
	}
	if (typeUnit == Unit.PLUNDERER ) {

	}
	if (typeUnit == Unit.DWARF ) {
		if ( (terrain==Place.MOUNTAIN) || (terrain==Place.VOLCANO) ) return 3;
	}
	if (typeUnit == Unit.BOWMAN ) {
		if (terrain==Place.FOREST) return 3;
	}
	if (typeUnit == Unit.CORSAIR ) {
		if (terrain==Place.SEA) return 2;
		return Unit.movementFactorOfType(null, terrain) + 4 ;

	}
	if (typeUnit == Unit.TREBUCHET ) {
		return Unit.movementFactorOfType(null, terrain) + 7;

	}
	if (typeUnit == Unit.PEASANT ) return Unit.movementFactorOfType(null, terrain) + 1 ;
	if (typeUnit == Unit.DRAGON ) { 
		return 3;
	}
	
	//default movement factor : depend only of terrain
	if (terrain==Place.PLAIN) return 2;
	if (terrain==Place.FOREST) return 3;
	if (terrain==Place.SEA) return 3; //see stealthDurationOfType : unit are slow on hostile places
	if (terrain==Place.MOUNTAIN) return 6;
	if (terrain==Place.VOLCANO) return 7;
	if (terrain==Place.DESERT) return 2;
	if (terrain==Place.HILL) return 4;
	if (terrain==Place.CITY) return 2;
	
	return 5; //medium value

}

/** Stealth! return the base duration of movement toward a neutral or hostile place **/
Unit.stealthDurationOfType = function(typeUnit, terrain, diplomacy) {
	if ( (diplomacy==Diplomacy.SELF) || (diplomacy==Diplomacy.SUPPORT_YES) ) return 0; //no lost time on friendly places !
	var malus=0;
	if (diplomacy==Diplomacy.NEUTRAL_NO_WIZARD) {
		malus+=2;
	}
	if ( (diplomacy==Diplomacy.SUPPORT_NO) || (diplomacy==Diplomacy.WAR) ) {
		malus+=4;
	}

	if (terrain==Place.SEA) {
		if (typeUnit == Unit.CORSAIR ) return malus;
		return 7 + malus; //units other than corsair have to wait a boat !
	}
	if (terrain==Place.PLAIN) return 0+malus;
	if (terrain==Place.FOREST) return 1+malus;
	if (terrain==Place.MOUNTAIN) return 2*malus;
	if (terrain==Place.VOLCANO) return 2.5*malus;
	if (terrain==Place.DESERT) return 1.5*malus;
	if (terrain==Place.HILL) return 1.25*malus;
	if (terrain==Place.CITY) return 3+2*malus;	
	
}

/** return the basic strength! of the unit on a given terrain. 
typeOfFight : attack, defense or support.
Value : in equivalent thousands men at arms
*/
Unit.strengthOfType = function(typeUnit, terrain, typeOfFight) {
	
	if (terrain==null) { //average strength
		var sum = 0;
		for (var i = 0; i < Place.TERRAIN_COUNT; i++)
			sum = Unit.strengthOfType(typeUnit, i, typeOfFight );
		return sum / Place.TERRAIN_COUNT;
	}
	
	if (typeUnit == Unit.WIZARD )  {
		if (typeOfFight==Fighting.DEFENSE) return Unit.strengthOfType(null, terrain, typeOfFight ) * 1.33 ; 
	}
	if (typeUnit == Unit.WARRIOR ) { }
	if (typeUnit == Unit.RIDER ) {
		if (typeOfFight==Fighting.ATTACK) {
			if ( (terrain==Place.PLAIN) || (terrain == Place.DESERT) ) return Unit.strengthOfType(null, terrain, typeOfFight ) * 1.33 ; 
		}
	}
	if (typeUnit == Unit.PLUNDERER ) {
		if (typeOfFight==Fighting.SUPPORT)  return Unit.strengthOfType(null, terrain, typeOfFight ) * 0.5 ; 
		if (typeOfFight==Fighting.ATTACK) 	return Unit.strengthOfType(null, terrain, typeOfFight ) * 2 ; 
	}
	if (typeUnit == Unit.DWARF ) {
		if ( (terrain==Place.MOUNTAIN) || (terrain==Place.VOLCANO)  ) return Unit.strengthOfType(null, terrain, typeOfFight ) * 1.5 ; 
	}
	if (typeUnit == Unit.BOWMAN ) {
		if ( (typeOfFight==Fighting.SUPPORT) || (typeOfFight==Fighting.DEFENSE) ) return Unit.strengthOfType(null, terrain, typeOfFight ) * 1.5 ; 
	}
	if (typeUnit == Unit.CORSAIR ) {
		if (terrain==Place.SEA) return 15;
		return Unit.strengthOfType(null, terrain, typeOfFight ) * 0.5 ; 
	}
	if (typeUnit == Unit.TREBUCHET ) {
		if ( (terrain==Place.SEA) && (typeOfFight==Fighting.ATTACK) ) return 1; 
		var coefTypeFight=1;
		if (typeOfFight==Fighting.ATTACK) coefTypeFight=0.5 ;
		if (terrain==Place.CITY) return 35 * coefTypeFight;
		if ( (terrain==Place.FOREST) ||  (terrain==Place.SEA) ) return 20 * coefTypeFight;
        if (terrain==Place.MOUNTAIN) return 15 * coefTypeFight;
		return 25 * coefTypeFight;
	}
	if (typeUnit == Unit.PEASANT ) {
		if ( (typeOfFight==Fighting.ATTACK) || (typeOfFight==Fighting.DEFENSE) ) return Unit.strengthOfType(null, terrain, typeOfFight ) * 0.25 ; 

	}
	if (typeUnit == Unit.DRAGON ) { 
		if (typeOfFight==Fighting.SUPPORT) return 1;
		return 42;
	}
	
	//special magic unit strength
	if (typeUnit == Unit.MAGIC_ATTACK ) return LearnedSpells.strength(terrain);
	
	//default strength factor : depend only of terrain and type of attack
	if (terrain==Place.PLAIN) return 10;
	if (terrain==Place.FOREST)  {
		if (typeOfFight==Fighting.ATTACK) return 11;
		return 8;
	}
	if (terrain==Place.SEA) {
		if (typeOfFight==Fighting.DEFENSE) return 5;
		return 4;
	}
	if (terrain==Place.MOUNTAIN) {
		if (typeOfFight==Fighting.DEFENSE) return 5;
		return 3;
	}
	if (terrain==Place.VOLCANO) return 3;
	if (terrain==Place.DESERT) return 6;
	if (terrain==Place.HILL) {
		if (typeOfFight==Fighting.DEFENSE) return 11;
		return 10;
	}
	if (terrain==Place.CITY) {
		if (typeOfFight==Fighting.DEFENSE) return 15;
		return 10;
	}
	
	return 10; //medium value
	

}


/** Return the unit recruited on a given terrain **/
Unit.typeRecruitedOn = function ( terrain ) {
	return terrain;
}


/** 
* TO json 
*/
Unit.prototype.toJSON = function() { //abreviate field and filter non required attributes
	if (this.place==null) {
		return null; //no unit out of place is allowed
	}
	return {  i:this.id, t:this.type, o:this.owner, p:this.place.id};
}
/**
* from json
*/
Unit.fromJSON= function(json) {
	var u = new Unit( json.t, json.o);
	u.id = json.i;
	return u;
}

Unit.prototype.id;
Unit.prototype.type;
Unit.prototype.owner; 
Unit.prototype.place;

/** 
* Position of unit : an array of 2 integer : its id place, and its index in the array of unit of the place. Used to jsonify Unit objects.
*/
Unit.prototype.key = function() { //abreviate field and filter non required attributes
	if (this.place==null) return null;
	return [ this.place.id , this.place.units.indexOf(this) ];
}



/** cost! of a unit **/
Unit.prototype.cost = function() {
	return Unit.costOfType(this.type);
}
Unit.costOfType = function(type) {

	if (type == Unit.WIZARD ) return 0;
	var cost = 100; //basic cost for all units
	var mediumCost=cost; //to normalize value
	for (var i=0; i<Place.TERRAIN_COUNT; i++)  {
		cost += 
			Unit.strengthOfType(type, i, Fighting.ATTACK) + Unit.strengthOfType(type, i, Fighting.DEFENSE) + Unit.strengthOfType(type, i, Fighting.SUPPORT) +
			( ( 15 - (Unit.movementFactorOfType(type,i))  ) * 3  );
		mediumCost += 
			Unit.strengthOfType(null, i, Fighting.ATTACK) + Unit.strengthOfType(null, i, Fighting.DEFENSE) + Unit.strengthOfType(null, i, Fighting.SUPPORT) +
			( ( 15 - (Unit.movementFactorOfType(null,i))  ) * 3  );
			
		//add stealth factor
		cost += 15 - (Unit.stealthDurationOfType(type, i, Diplomacy.NEUTRAL_NO_WIZARD) + Unit.stealthDurationOfType(type, i, Diplomacy.WAR) ) / 3
		
		mediumCost += 15 - (Unit.stealthDurationOfType(null, i, Diplomacy.NEUTRAL_NO_WIZARD) + Unit.stealthDurationOfType(null, i, Diplomacy.WAR) ) / 3
	}
		
	
	averageNumberOfTerrainForOneUnit = 3;
	cost = cost * ( Place.incomeOfTerrain(null) * averageNumberOfTerrainForOneUnit ) / mediumCost;
	
	//flying unit bonus
	var flyDistance = Unit.movementFreeFlyingDistance(type);
	if (flyDistance > Place.SIZE  )
		cost = cost + mediumCost / 4 * ( (flyDistance - Place.SIZE) / (Place.SIZE )  ) ;
	
	//return Math.round(cost);
	return Math.round(0.2 * cost) * 5;
	
}


Unit.prototype.movementFactor = function(terrain) {
	return Unit.movementFactorOfType(this.type,terrain);
}

/** Flying unit distance **/
Unit.movementFreeFlyingDistance = function(unitType) {
	if (unitType == Unit.DRAGON) 
		return Place.SIZE /  Unit.movementFactorOfType(unitType, null) * 9 ;
	return 0;
}


//return the strength of the unit, given its position
//order : null for pure defensive unit (no order). Else order of the unit.
//anotherUnitTerrain : if unit is attended on another place than its current one
// (used in case of recruit or in case of support)
//typeOfFight : attack, defense or support 
Unit.prototype.strength = function(map, order, anotherUnitTerrain, typeOfFight ) {
	
	if ( (order==null) || (order.parameters.places==null) || (order.parameters.places.length==0) ) {
		if (typeOfFight==null) typeOfFight = Fighting.DEFENSE;
		//debug : seems that every recruit are set here
		//console.log("debug Unit.prototype.strength Fighting.DEFENSE;");
		if (anotherUnitTerrain == null) 
			strength=Unit.strengthOfType(this.type, this.place.terrain, typeOfFight); 
		else strength=Unit.strengthOfType(this.type, anotherUnitTerrain, typeOfFight ); 
	} 
	else { 
		
		
		//RECRUIT : strength 
		if (order.type==Act.RECRUIT) {
			//debug : never reached ? console.log("debug Unit.prototype.strength RECRUIT Fighting.ATTACK;");
			strength=Unit.strengthOfType(this.type, anotherUnitTerrain, Fighting.ATTACK);
		}
		
		//SPELL THROW associated with a movement of wizard : strenght of the magic attack
		if (order.type==Act.SPELL_THROW) {  // if (LearnedSpells.isSpellAMovement(order.parameters.places[0].terrain))
			strength=LearnedSpells.strength(this.place.terrain); 
		}
		
		//MOVEMENT
		if (order.type==Act.MOVEMENT) {

			if (typeOfFight==null) {
				if (!order.isMovementAnAttack()) typeOfFight = Fighting.DEFENSE;
				else typeOfFight = Fighting.ATTACK;
			}
			
			//eliminate not true movements
			var strength=-1; 
			if ( (order.parameters.places==null) || (order.parameters.places.length<=1 ) ) {
				strength= Unit.strengthOfType(this.type, this.place.terrain, typeOfFight);
			}
				
			if (strength<0) {
				
				var daysOfJourney= 0;  //number of days unit journey
				var max_duration = 30; //max one month of journey
		
				//movement duration 
				for ( var i=1; i<order.parameters.places.length; i++) { 
					var place = order.parameters.places[i];
				
					//duration of movement
					
					//stealth factor
					var stealthDuration=0; //malus duration applied to duration when crossing neutral or ennemy territory 
					
					if ( i<order.parameters.places.length-1) { //crossing place duration : not on the last place entered
					
						//use map before orders were added
						if (map.oldMap==null) map.initOldMap(); //first added order
						var oldPlace = map.oldMap.land.places[place.id]; //place before order were applied
						var diplomacy = map.oldMap.diplomacy.diploBetween(this.owner, oldPlace.owner);
					
						stealthDuration=Unit.stealthDurationOfType(this.type, place.terrain, diplomacy); 
						if ( (diplomacy==Diplomacy.WAR) || (diplomacy==Diplomacy.SUPPORT_NO) || (diplomacy==Diplomacy.NEUTRAL_NO_WIZARD)  )  if (oldPlace.units!=null) {
							//if (anotherUnitTerrain==null) console.log( "debug Map.js BEFORE increasing number of non friendly units  stealthDuration= " + stealthDuration);
							for (var u=0; u<oldPlace.units.length; u++) { //unit slow down when it encounter a increasing number of non friendly units 
								stealthDuration+= 0.75 * Unit.strengthOfType(oldPlace.units[u].type, oldPlace.terrain, Fighting.DEFENSE); 
							}
							//if (anotherUnitTerrain==null) console.log( "debug Map.js AFTER increasing number of non friendly units  stealthDuration= " + stealthDuration);
						}
						
					}
					
					if (stealthDuration<0) stealthDuration=0;
				
					//movement factor
					var movementDuration = this.movementFactor(place.terrain) * ( 0.75 + 0.25 * place.position.distance(order.parameters.places[i-1].position) / Place.SIZE) 
					
					//exhaustion factor : the more the unit is moving, the more it needs to have a rest
					var restDuration=(1.5*i-5);
					
					var duration = stealthDuration + movementDuration + restDuration;
					//if (anotherUnitTerrain==null) console.log( "	debug Map.js duration on place " + i + " = "  + duration + "    (" + stealthDuration + " + " + movementDuration + " + " + restDuration + ")" );
				
					if (duration<0) duration=1; //at least one day
					
					daysOfJourney += duration;
				
				}

				//more days of travel, less strength
				i=order.parameters.places.length-1;
				strength = ( (max_duration - daysOfJourney ) / max_duration) * this.strength(map, null, order.parameters.places[i].terrain, typeOfFight); 			
				
				
				//if (anotherUnitTerrain==null) console.log( "debug Map.js Unit.prototype.strength  daysOfJourney= " + daysOfJourney);
				//debug change strength 2014-12 (display duration, see MapUnitDisplay.js  showStrengthOfUnit)
				//if (anotherUnitTerrain==null) order._DebugDayOfJourney = daysOfJourney; //console.log("Map.js debug change strength 2014-12  daysOfJourney=" + daysOfJourney);
					
					
				//distant support : limit strenght if required
				if (anotherUnitTerrain != null) {
					var max_strength=Unit.strengthOfType(this.type, anotherUnitTerrain, typeOfFight);
					if (strength>max_strength) strength = max_strength;
				}
				
			}//end of real movement
			
		} //end of movement order
		
	}
	
	//return strength;
	return Math.ceil(strength);
}

/** return existing order that a unit can have in a given tactic **/
Unit.prototype.order = function( tactic ) {
	return tactic.unitOrder[this.id];
}

/** Return strict positive integer if type of unit type1 is better than type2, negative if not, and 0 if two types are identical  */
Unit.CompareType= function(type1,type2) {
	return (type1-type2);
}


/**
* Act! An action performed on map, or to be performed (order)
*/
function Act(owner, type, parameters, result) { 

	if (parameters!=null)
		{ this.owner=owner; this.type=type; this.parameters=parameters; this.result=result;}
	else 
		{ this.owner=owner; this.type=type; this.parameters=new Object(); this.result=result; }
}

/**
* @property {integer} owner - author of acting
*/
Act.prototype.owner;
/**
* @property {integer} type - type of act
*/
Act.prototype.type;
Act.MOVEMENT=1; 
Act.RECRUIT=2; 
//Act.SPELL_LEARN=3; 
Act.SPELL_THROW=4; 
Act.REINCARNATION=5; 
Act.DIPLOMATIC_SUPPORT=6; 

/** number of recruited unit per turn **/
Act.MAX_RECRUIT_PER_TURN=4; 

/** code for possible result of an act**/
Act.OUT_OF_RANGE=-10;

/**
* @property {array} parameters - parameters of act
*/
Act.prototype.parameters;

/**
* @property {object} result - results of act. Must at least contain succeed true/false 
*/
Act.prototype.result;

/** for movement, index of the last validated movemnet in map. Private to map method, see Map.updateOrder**/
Act.prototype._indexOfPlaceFrom; 

Act.prototype.isAborted = function() { 

	if ( this.type == Act.MOVEMENT ) {
		if (this.parameters.unit==null) return true; 
		if (this.parameters.places==null) return true; 
		if (this.parameters.places.length==0) return true;	
	}

	return false;
}

//return the departure of a movement (place of its unit)
Act.prototype.departure = function() {
	if ( this.type != Act.MOVEMENT ) return null;
	if (this.parameters.places == null) return null;
	return this.parameters.places[0] ; 
}

//return the destination of an attack or support (its last place)
Act.prototype.destination = function() {
	if ( this.type != Act.MOVEMENT ) return null;
	if (this.parameters.places == null) return null;
	return this.parameters.places[this.parameters.places.length-1] ; 
}
	
	
/** 
* TO json 
*/
Act.prototype.toJSON = function() { //abreviate field and filter non required attributes

	// !!! PARAMETERS -> TO JSON !!!!!
	//jsonify parameters that contains map's related object
	var jsonParameters = new Object(); //the parameters which going to store jsonified parameters
	
	if (this.type==Act.MOVEMENT) {
	
		if ( this.parameters.p != null ) console.log("debug Act.prototype.toJSON : act has wrong parameters !!!! (parameters.p found !!!!)");
	
		if ( (this.parameters.places==null) && ( this.parameters.p != null ) ) { //places in unconverted parameters
			//return directly unconverted parameters :
			return {  o:this.owner, t:this.type, p:this.parameters, r:this.result } 
		}
		
		//places
		if ( this.parameters.places != null ) { 
			jsonParameters.p=new Array();
			for (var i=0; i<this.parameters.places.length; i++) {
				jsonParameters.p.push( this.parameters.places[i].id );
			}
		}
		//position of the first arrow (graphic purpose)
		if ( this.parameters.graphicPositions != null ) { 
			jsonParameters.gpos = new Array();
			for (var i=0; i<this.parameters.graphicPositions.length; i++) {
				jsonParameters.gpos.push(this.parameters.graphicPositions[i].round(0));
			}
			
		}
		
		//unit
		if ( this.parameters.unit != null ) { 
			jsonParameters.u = this.parameters.unit.id ;
		}

		return {  o:this.owner, t:this.type, p:jsonParameters, r:this.result }
		
	}
	
	if (this.type==Act.RECRUIT) {
	
		if ( (this.parameters.places==null) && ( this.parameters.p != null ) ) { //place in unconverted parameters
			//return directly unconverted parameters :
			return {  o:this.owner, t:this.type, p:this.parameters } 
		}
		
		//places to recruit
		if ( this.parameters.places != null ) { 
			jsonParameters.p=new Array();
			for (var i=0; i<this.parameters.places.length; i++) {
				jsonParameters.p.push( this.parameters.places[i].id );
			}
		}
		
		//recruiting unit
		if ( this.parameters.unit != null ) { 
			jsonParameters.u = this.parameters.unit.id ;
		}
			
		return {  o:this.owner, t:this.type, p:jsonParameters, r:this.result }
		
	}	
	
/* deprecated
	if (this.type==Act.SPELL_LEARN) {
		
		if ( (this.parameters.unit==null) && ( this.parameters.u != null ) ) { //unit in unconverted parameters
			//return directly unconverted parameters :
			return {  o:this.owner, t:this.type, p:this.parameters, r:this.result } 
		}

		if ( this.parameters.unit != null ) { 
			jsonParameters.u = this.parameters.unit.id ;
		}		
		
		return {  o:this.owner, t:this.type, p:jsonParameters, r:this.result }		
		
	}
*/
	
	if (this.type==Act.SPELL_THROW) {
	
		if ( (this.parameters.places==null) && ( this.parameters.p != null ) ) { //places in unconverted parameters
			//return directly unconverted parameters :
			return {  o:this.owner, t:this.type, p:this.parameters, r:this.result } 
		}
		
		//places
		if ( this.parameters.places != null ) { 
			jsonParameters.p=new Array();
			for (var i=0; i<this.parameters.places.length; i++) {
				jsonParameters.p.push( this.parameters.places[i].id );
			}
		}
		//position of the first arrow (graphic purpose)
		if ( this.parameters.startGraphicPosition != null ) { 
			jsonParameters.pos0 = this.parameters.startGraphicPosition;
		}
		
		//unit
		if ( this.parameters.unit != null ) { 
			jsonParameters.u = this.parameters.unit.id ;
		}

		return {  o:this.owner, t:this.type, p:jsonParameters, r:this.result }
		
	}
	
	
	if (this.type==Act.REINCARNATION) {
		
		if ( (this.parameters.place==null) && ( this.parameters.p != null ) ) { //place in unconverted parameters
			//return directly unconverted parameters :
			return {  o:this.owner, t:this.type, p:this.parameters, r:this.result } 
		}

		//place to reincarnation
		if ( this.parameters.place != null ) { 
			jsonParameters.p=this.parameters.place.id ;
		}
		
		return {  o:this.owner, t:this.type, p:jsonParameters, r:this.result }		
		
	}

	if (this.type==Act.DIPLOMATIC_SUPPORT) {
		
		//supported wizard
		if ( this.parameters.idWizard2 != null ) { 
			jsonParameters.w=this.parameters.idWizard2 ;
		}
		//type of support
		if ( this.parameters.support != null ) { 
			jsonParameters.s=this.parameters.support ;
		}		
		return {  o:this.owner, t:this.type, p:jsonParameters, r:this.result }		
	}
	
	
}
/**
* from json

	translate json parameter of act into truely map's related objects paramaters (as the "unit" parameter). Map object required
	To be called after a fromJSON call. If act is already converted, do nothing
	
*/
Act.fromJSON = function(json, map) {
	
	// !!! JSON -> TO PARAMETERS !!!!!
	
	if (json==null) { console.log("ERREUR Act.fromJSON : json is null ! " ); return; }
	
	var jsonParameters=json.p;
	var linkedParameters= new Object();
	
	if (json.t==Act.MOVEMENT) {
		
		//places
		if ( jsonParameters.p != null ) { 
			linkedParameters.places = new Array();
			for (var i=0; i<jsonParameters.p.length; i++) {
				linkedParameters.places.push(map.land.places[ jsonParameters.p[i] ]);
			}
		}	
		//position of the first arrow (graphic purpose)
		if ( jsonParameters.gpos != null ) { 
			linkedParameters.graphicPositions = new Array();
			for (var i=0; i<jsonParameters.gpos.length; i++) {
				linkedParameters.graphicPositions.push( Point.fromJSON(jsonParameters.gpos[i]) );
			}
		}
		
		//unit
		if ( jsonParameters.u != null ) { 
			linkedParameters.unit = map.people.unitFromId[jsonParameters.u];
		}
		
	}
	
	if (json.t==Act.RECRUIT) {

		//places
		if ( jsonParameters.p != null ) { 
			linkedParameters.places = new Array();
			for (var i=0; i<jsonParameters.p.length; i++) {
				linkedParameters.places.push(map.land.places[ jsonParameters.p[i] ]);
			}
		}	
		//recruiting unit
		if ( jsonParameters.u != null ) linkedParameters.unit = map.people.unitFromId[jsonParameters.u];
	}

	/* deprecated
	if (json.t==Act.SPELL_LEARN) {
		if ( jsonParameters.u != null ) linkedParameters.unit = map.people.unitFromId[jsonParameters.u];
	}
	*/
	
	if (json.t==Act.SPELL_THROW) {
		
		//places
		if ( jsonParameters.p != null ) { 
			linkedParameters.places = new Array();
			for (var i=0; i<jsonParameters.p.length; i++) {
				linkedParameters.places.push(map.land.places[ jsonParameters.p[i] ]);
			}
		}	
		//position of the first arrow (graphic purpose)
		if ( jsonParameters.pos0 != null ) { 
			linkedParameters.startGraphicPosition = Point.fromJSON(jsonParameters.pos0);
		}
		
		//unit
		if ( jsonParameters.u != null ) { 
			linkedParameters.unit = map.people.unitFromId[jsonParameters.u];
		}
	}
	
	if (json.t==Act.REINCARNATION) {
		//place
		if ( jsonParameters.p != null ) linkedParameters.place=map.land.places[ jsonParameters.p ];
	}
	
	if (json.t==Act.DIPLOMATIC_SUPPORT) {
		//wizard
		if ( jsonParameters.w != null ) linkedParameters.idWizard2=jsonParameters.w ;
		//type of support
		if ( jsonParameters.s != null ) linkedParameters.support=jsonParameters.s ;
	}
	
	
	return new Act( json.o, json.t, linkedParameters, json.r);
}

/**
Add a new place to an order. If the place is not a valid movement, return an error code.
 if reallyAddPlace is false, then just make a test, but the act is not modified
*/
Act.prototype.movementAddPlace = function( newPlace, map, reallyAddPlace ) {

	//end of movement on an unfriendly territory : no other movement can be achieved
/*	if ( this.parameters.places != null ) 
		if (this.parameters.places.length>=1)
			if (this.parameters.places[this.parameters.places.length-1].owner != this.owner) return Act.MVT_KO_UNFRIENDLY_PLACE;
*/
	
	if ( this.parameters.places == null ) return Act.INVALID_ORDER; //invalid order, must have at least departure place
	if ( this.parameters.places.length == 0 ) return Act.INVALID_ORDER;
	
	//not neighborplace
	//place where unit come from :
	var fromPlace=this.parameters.places[this.parameters.places.length-1]; //...or last journeyed place
	var neighbors = Act.MovementPossiblePlacesToGo(fromPlace, this.parameters.unit.type, map.land);
	if (neighbors.indexOf(newPlace) < 0) return Act.MVT_KO_DISTANCE; //not permitted 

	this.parameters.places.push(newPlace); //to test movement
	
	var strength = this.parameters.unit.strength(map,this, newPlace.terrain, Fighting.ATTACK ) ;
	var minStrength =  Act.MIN_STRENGTH_FOR_MOVEMENT_RATIO * Unit.strengthOfType(this.parameters.unit.type, null, Fighting.ATTACK); //2014-11-05 instead of fromPlace, 2014-11-12 null instead of newPlace.terrain
	if (minStrength < Act.MIN_STRENGTH_FOR_MOVEMENT_VALUE ) minStrength = Act.MIN_STRENGTH_FOR_MOVEMENT_VALUE ;
	
	//debug Movement!
	//console.log("	DEBUG movementAddPlace : strength=" + strength + "  minStrength =" + minStrength);
	
	if ( (strength>=  minStrength ) ||  ( this.parameters.places.length <= 2 ) ) { //enough strenght to move, or first movement
		if ( reallyAddPlace == false ) this.parameters.places.splice(this.parameters.places.length-1,1); //only testing, place can be removed
		return Act.MVT_OK;
	} else {
		this.parameters.places.splice(this.parameters.places.length-1,1); //no movement possible, can't keep place anyway
		return Act.MVT_KO_DISTANCE; //no further movement 
	}
	
};

/** return an array of possible places to move from a given place **/
Act.MovementPossiblePlacesToGo = function( place, unitType, land) {
	//1) places with path connected to this place :
	var neighbors = place.neighbors(land); 
	
	//2) free flying movement places for dragon : 
	var flyDistance = Unit.movementFreeFlyingDistance(unitType);
	if (flyDistance > 0 ) {
		land.placesWithinDistance( place.position, flyDistance, neighbors )	;	//new distant places added to neighbors array
		//remove place itself
		neighbors.splice(neighbors.indexOf(place),1);
	}
	
	return neighbors;
}

Act.INVALID_ORDER=-1;
Act.MVT_OK=0;
Act.MVT_KO_DISTANCE=2;
Act.MIN_STRENGTH_FOR_MOVEMENT_RATIO=0.25; //in ratio of the strength of unit
Act.MIN_STRENGTH_FOR_MOVEMENT_VALUE=2; //in absolute

/** is this place is good for recruiting ? 
	return MVT_OK if recruiting is good
	return MVT_KO_DISTANCE if recruiting is not good (too far from the unit who did it)
	return Act.RECRUIT_TOO_EXPENSIVE if wizard will have not enought money
if reallySelectPlace is false, then just make a test, but the act is not modified
*/
Act.prototype.recruitSelectPlace = function( newPlace, map, reallySelectPlace ) {
	var recruitOk=false; //default
	if (this.parameters.unit.place == newPlace) recruitOk= true; //can recruit where it stands
	if ( recruitOk==false) if (newPlace.isNeighbor( this.parameters.unit.place, map.land)) recruitOk= true; //or can recruit on neighboor places
	
	//same type of terrain ?
	//if (this.parameters.places.length > 1 ) if (this.parameters.places[0].terrain != newPlace.terrain ) recruitOk=false;
	
	if (recruitOk) if (reallySelectPlace) this.parameters.places.push(newPlace);
	return recruitOk;
}

/** return true if a movement is a true attack (a loop is not an attack) **/
Act.prototype.isMovementAnAttack = function() {

	if (this.type!=Act.MOVEMENT) return false;

	//invalid movement :
	if (this.parameters==null) return false;
	if (this.parameters.places==null) return false;
	if (this.parameters.places.length<=1) return false;
	
	//loop :
	if (this.parameters.places[ this.parameters.places.length - 1 ] == this.parameters.places[0] ) return false;
	
	return true;
}

/** return all the possible places for recruiting **/
Act.prototype.recruitAllPossiblePlaces = function(map) {
	
	var placesOk = new Array();
	var unit = this.parameters.unit;
	var place = unit.place;
	
	//neighbor places
	if (place==null) return placesOk;
	
	//can recruit where it stands
	placesOk.push(place);
	
	//...and on neighbor places
	var neighbors = place.neighbors(map.land); //places with path
	for( var i=0; i<neighbors.length; i++) placesOk.push(neighbors[i]);
	
	return placesOk;
}

/** return the type of recruited unit 
	terrainIfNoYetPlace : to know if a terrain is not set
**/
Act.prototype.recruitType = function() {
	if (this.parameters.places==null) return Unit.PEASANT;
	return Unit.typeRecruitedOn(this.parameters.places[0].terrain);
}

/**
* Tactic! An list of Act (of different wizards) describing the orders for the current round.
* it offers methods to know which unit do which order, and where it is. Used to calculate strength of each unit
*/
function Tactic(actsArray, turnNumber) { 
	//array of acts
	this.acts=new Array(); 
	//ensure it's truly acts, if not, convert them 
	if (actsArray!=null)  {
		for( var i=0; i<actsArray.length; i++) {
			var a = actsArray[i];
			if (a!=null) {
			
				var result=a.r; if (a.result!=null) result=a.result;
								
				if (a.type != null) this.acts.push( new Act(a.owner, a.type, a.parameters, result ) );
				else if (a.t!=null) this.acts.push( new Act(a.o, a.t, a.p, result ) ); //json act
			}
		}
	}
	this.turnNumber=turnNumber;
	this.unitOrder=new Array();
}


Tactic.prototype.acts;

/**
* @property {integer} : count of the past turns in game. Start at Year One.
*/
Tactic.prototype.turnNumber;

/** Index of unit concerned by an order **/
Tactic.prototype.unitOrder;


/**
* from json
*/
Tactic.fromJSON = function(json, map) {

	if (json.a==null) throw "Error Tactic.fromJSON : json is unparsed !"
	
	if (map==null) throw "Error Tactic.fromJSON : map is null !"
	//read json
	//alert(json);
	var json;
	
	var o = new Tactic( null, json.t);
	o.acts = new Array();
	
	for (var i=0; i<json.a.length;i++) {
		o.acts[i]=Act.fromJSON(json.a[i], map);
	}
	return o;
}

/** 
* TO json 
*/
Tactic.prototype.toJSON = function() { 
	return {  a: this.acts , t: this.turnNumber };
}

/** add order to tactic **/
Tactic.prototype.addOrder = function( order ) {
	this.acts.push( order );
	if (order.parameters.unit!=null) this.unitOrder[order.parameters.unit.id]=order; //indexing
}
/** remove order **/
Tactic.prototype.removeOrder = function( order ) {
	if (order==null) return;
	var i = this.acts.indexOf(order);
	if (i<0) return; //not found
	if (order.parameters.unit!=null) this.unitOrder[order.parameters.unit.id]=null; //indexing
	this.acts.splice(i,1);
	
}

/** cancel an order given to unit. Return true if an order has truly been deleted */
Tactic.prototype.orderCancelOrderFrom = function(unit) {

	if (this.unitOrder[order.parameters.unit.id]==null) return false; //no order for this unit
	this.removeOrder( this.unitOrder[order.parameters.unit.id] );
	return true;
	
}


/** deal with orders from a given type (or all orders if null type) 
	callBack ( order) is called for each found order
**/
Tactic.prototype.doOrders = function(type, callBack) {
	if ( this.acts==null) return;
	for ( var i=0; i<this.acts.length; i++) {
		if (type==null) { callBack(this.acts[i]); continue; }
		if ((typeof type=="number") && (type == this.acts[i].type))  { callBack(this.acts[i]); continue; }
	}
}

/** return a tactic of a given wizard (extracted from this, keep only order of the given owner) */
Tactic.prototype.tacticOf = function(owner) { 
	
	if ( this.acts==null) return null;
	
	var t = new Tactic(new Array(), this.turnNumber);
	
	for ( var i=0; i<this.acts.length; i++) {
		if (this.acts[i].owner == owner)  { t.acts.push(this.acts[i]); }
	}
	if ( t.acts.length == 0) return null;
	return t;
}


/**
* A Fighting! is used to solve multiple attacks/support on a given place
**/
function Fighting(place) {

	this.opponents=new Array();
	this.strengths=new Array(); 	
	this.place=place;
	
}

/** place where fighting occurs**/
Fighting.prototype.place;

/** array of sides engaged : indexed wizard id **/
Fighting.prototype.opponents;
/** array of strengths of the wizard fighting. Index is wizard id index, not opponent **/
Fighting.prototype.strengths; 
/** winner **/
Fighting.prototype.winner;


/** Adjust strenght of unit with type of fighting */
Fighting.ATTACK=1;
Fighting.DEFENSE=2;
Fighting.SUPPORT=3;

/** result of fighting **/
Fighting.VICTORY=2;
Fighting.DEFEAT=1;
/** equality : no winner **/
Fighting.NO_WINNER=-1;

/** add strengths of units based on a given place. isSupporting = true if the place is only a place for supporting distant fight **/
Fighting.prototype.addStrengthsOnPlace = function(place,map, isSupporting) {

	if (place.units==null) return;
	for (var i=0; i<place.units.length;i++) {
		var unit=place.units[i];
		
		if ( (isSupporting) && ( unit.owner==0 ) ) continue; //neutral unit don't support anyone
		
		var order = map.getOrder(unit);
		if ( (order==null) || ( order.type==Act.RECRUIT ) || ( order.type==Act.SPELL_THROW ) ) this.addStaticUnit(unit, isSupporting, map.diplomacy);
		else this.addMovement(order,map,isSupporting);
	}
}

/** add strength of a non moving unit (defense) **/
Fighting.prototype.addStaticUnit = function(unit, isSupporting, diplomacy) {
	var typeOfFight = Fighting.DEFENSE;
	
	//support ?
	var anotherUnitTerrain = null;
	
	var idWizardSupported=null; //opponent that unit support
	if (!isSupporting) {
		//wizard directly implicated in conflict
		idWizardSupported = this.createOpponent(unit.owner);
	} else { //wizard may be implicated due to diplomacy
		typeOfFight = Fighting.SUPPORT;
		anotherUnitTerrain = this.place.terrain;
		idWizardSupported=this.idWizardSupportedBy(unit.owner,diplomacy); 
	}
	
	if (idWizardSupported==null) return; //no diplomatic support
	
	//potential diplomatic support
	if (this.strengths[idWizardSupported]!=null) {
		//console.log("DEBUG Fighting.prototype.addStaticUnit : idWizardSupported=" + idWizardSupported + " unit.strength=" + unit.strength(null, null, anotherUnitTerrain, typeOfFight) + "  anotherUnitTerrain=" + anotherUnitTerrain);
		this.strengths[idWizardSupported]+=unit.strength(null, null, anotherUnitTerrain, typeOfFight);
	}
}

/** add strength of a moving unit **/
Fighting.prototype.addMovement = function(order, map, isSupporting) {
	var typeOfFight = Fighting.ATTACK;
	
	//if unit returns on its own terrain (loop), it's a defense
	if ( !order.isMovementAnAttack() ) typeOfFight = Fighting.DEFENSE;	
	
	
	var anotherUnitTerrain = null;
	var unit = order.parameters.unit;
	
	var idWizardSupported=null; //opponent that unit support
	
	if (!isSupporting) {
		//wizard directly implicated in conflict
		idWizardSupported = this.createOpponent(unit.owner);
	} else { //wizard may be implicated due to diplomacy
		typeOfFight = Fighting.SUPPORT;
		anotherUnitTerrain = this.place.terrain;
		//choose opponent that is supported due to diplomacy :
		idWizardSupported=this.idWizardSupportedBy(unit.owner,map.diplomacy); 
	} 
	
	if (idWizardSupported==null) return; //no diplomatic support
	
	//increase strength
	if (this.strengths[idWizardSupported]!=null) {
		//console.log("DEBUG Fighting.prototype.addMovement : idWizardSupported=" + idWizardSupported + " unit.strength=" + unit.strength(map, order, anotherUnitTerrain, typeOfFight));
		this.strengths[idWizardSupported]+=unit.strength(map, order, anotherUnitTerrain, typeOfFight);
	}
}

/** Create a side if not exists and return idwizard **/
Fighting.prototype.createOpponent = function(wizardId) {
	if (this.strengths[wizardId]==null) { 		
		this.strengths[wizardId]=0; //initialize strength on this place
		this.opponents.push(wizardId);
	};
	
	//console.log("DEBUG Fighting.prototype.createOpponent : wizardId=" + wizardId);
	return wizardId;
}

/** diplomatic support : return the id of wizard that a given wizard may support. Return -1 if there's no diplomatic support  **/
Fighting.prototype.idWizardSupportedBy = function( wizardId, diplomacy ) {
	//support himself first
	if ( this.opponents.indexOf( wizardId ) >= 0 ) return wizardId;
	
	//no part of fighting, but can be involved coz of diplomacy, if only he support ONE opponent (no less, no more)
	var supportedOpponent=null;
	
	//one supported ally ?
	for (var o=0; o<this.opponents.length; o++) {
		var i=this.opponents[o];
		//simple support
		if (diplomacy.diploBetween(wizardId,i)==Diplomacy.SUPPORT_YES) {
			if (supportedOpponent!=null) return null; //if he support more than one opponent, he stays neutral
			supportedOpponent=i;
		}
	}
	
	if (supportedOpponent!=null) return supportedOpponent; //one ally
	
	//one neutral opponent against a hatred ennemy ?
	//is there an opponent that wizard is at war with ?
	var hatedOpponent=null
	
	//search an ennemy at war with
	for (var o=0; o<this.opponents.length; o++) {
		var i=this.opponents[o];
		if (diplomacy.diploBetween(wizardId,i)==Diplomacy.WAR) {
			hatedOpponent=i;
		}
	}
	if (hatedOpponent==null) return null; //no war, no support
	
	//search potential neutral ally
	for (var o=0; o<this.opponents.length; o++) {
		var i=this.opponents[o];
		
		//no support : can be supported if only wizard is at war with other opponent
		if ( (diplomacy.diploBetween(wizardId,i)==Diplomacy.SUPPORT_NO) || (diplomacy.diploBetween(wizardId,i)==Diplomacy.NEUTRAL_NO_WIZARD) )  {
			if (supportedOpponent!=null) return null; //if he support more than one opponent, he stays neutral
			supportedOpponent=i;
		}

	}
	
	return supportedOpponent;
}

/* to delete
Fighting.RETREAT=1; //unit loose and retreat, but keep its owner
Fighting.RETREAT_AND_NEUTRAL=2; //unit loose, retreat and became a neutral one
Fighting.CONVERSION=3; //unit loose and is converted to its winner side
*/


/** 
* Return and set the winner of the fighting (by comparing strengths)
*/
Fighting.prototype.andTheWinnerIs = function() {

	this.winner = Fighting.NO_WINNER;
	var winnerStrength=0; //default strenght ...
	
	for (var o=0; o<this.opponents.length; o++) {
		var i=this.opponents[o];
		
		if (this.strengths[i]==null) continue;
		
		//equality : no winner
		if (this.strengths[i]==winnerStrength) {
			this.winner = Fighting.NO_WINNER;
		}
		
		if (this.strengths[i]>winnerStrength) {
			this.winner=i;
			winnerStrength=this.strengths[i];
		}
		
	}
	
	return this.winner;
}

/**
* Point! instance - used to manage a point in 2-D space, and compute distances, angles, polar and orbital positions, etc.
* @constructor
* @function
* @param {number} x - The position of the point along the horizontal axis
* @param {number} y - The position of the point along the vertical axis
* @class
* The Point object represents a location in a two-dimensional coordinate system, where x represents the horizontal axis and y represents the vertical axis.
*/
function Point(x, y){
	this.x = x || 0;
	this.y = y || 0;
};

/**
* @property {number} x - The position of the point along the horizontal axis
*/
Point.prototype.x;

/**
* @property {number} y - The position of the point along the vertical axis
*/
Point.prototype.y;

/**
* Adds the coordinates of another point to the coordinates of this point to create a new point.
* @function
* @param {Point} v The point to be added.
* @returns Point
*/
Point.prototype.add = function(v,y){
	if (y==null) return new Point(this.x + v.x, this.y + v.y);
	else return new Point(this.x + v, this.y + y);
};

/**
* Creates a copy of this Point object.
* @function
* @returns Point
*/
Point.prototype.clone = function(){
	return new Point(this.x, this.y);
};

/**
* Returns the degrees of rotation facing the target point.
* @function
* @param {Point} v The point at the opposite end of the radial comparison.
* @returns number
*/
Point.prototype.degreesTo = function(v){
	var dx = this.x - v.x;
	var dy = this.y - v.y;
	var angle = Math.atan2(dy, dx); // radians
	return angle * (180 / Math.PI); // degrees
};

/**
* Returns the degrees of rotation facing the target point. Y axis is reversed.
* @function
* @param {Point} v The point at the opposite end of the radial comparison.
* @returns number
*/
Point.prototype.degreesToYInv = function(v){
	var dx = this.x - v.x;
	var dy = v.y - this.y;
	var angle = Math.atan2(dy, dx); // radians
	return angle * (180 / Math.PI); // degrees
};

/**
* Returns the distance between this and another Point.
* @function
* @param {Point} v The point at the opposite end of the distance comparison.
* @returns number
*/
Point.prototype.distance = function(v){
	var x = this.x - v.x;
	var y = this.y - v.y;
	return Math.sqrt(x * x + y * y);
};

/**
* Determines whether two points are equal. Two points are equal if they have the same x and y values.
* @function
* @param {Point} toCompare The point to be compared.
* @returns Boolean
*/
Point.prototype.equals = function(toCompare){
	return this.x == toCompare.x && this.y == toCompare.y;
};

/** (added)
* Simplify point to a number of decimal
* @function
* @param {number} number of decimal
* @returns this
*/
Point.prototype.round = function(nbDecimal){
	if (nbDecimal==null) nbDecimal=2;
	
	if (nbDecimal==0) {
		this.x= Math.round(this.x); this.y= Math.round(this.y);
		return this;
	}
	
	var f= Math.pow(10, nbDecimal);
	this.x= Math.round(this.x * f)/f; this.y= Math.round(this.y * f)/f;
	return this;
};

/**
* (corrected)
* Determines a point between two specified points. The parameter f determines where the new interpolated point is located relative to this and the end point (parameter v). The closer the value of the parameter f is to 1.0, the closer the interpolated point is to this. The closer the value of the parameter f is to 0, the closer the interpolated point is to the destination point (parameter v).
* @function
* @param {Point} v The point at the opposite end of the distance comparison.
* @param {number} f The level of interpolation between the two points. Indicates where the new point will be, along the line between this and the destination point. If f=1, this is returned; if f=0, v is returned.
* @returns Point
*/
Point.prototype.interpolate = function(v, f){
	return new Point( (this.x * f + v.x * (1-f) ), (this.y *f  + v.y*(1-f)));
};

/**
* Returns the length of the line segment from (0,0) to this point.
* @function
* @returns number
*/
Point.prototype.length = function(){
	return Math.sqrt(this.x * this.x + this.y * this.y);
};

/**
* Scales the line segment between (0,0) and the current point to a set length.
* @function
* @param thickness The scaling value. For example, if the current point is (0,5), and you normalize it to 1, the point returned is at (0,1).
*/
Point.prototype.normalize = function(thickness){
	var l = this.length();
	this.x = this.x / l * thickness;
	this.y = this.y / l * thickness;
};

/**
* Updates a Point to reflect the position based on the passed parameters describing an arc.
* @function
* @param {Point} origin The point from which to calculate the new position of this.
* @param {number} arcWidth A number desribing the width of the arc definining the orbital path.
* @param {number} arcHeight A number desribing the height of the arc definining the orbital path.
* @param {number} degrees The position (0 to 360) describing the position along the arc to be computed.
*/
Point.prototype.orbit = function(origin, arcWidth, arcHeight, degrees){
	var radians = degrees * (Math.PI / 180);
	this.x = origin.x + arcWidth * Math.cos(radians);
	this.y = origin.y + arcHeight * Math.sin(radians);
};

/**
* Return a Point to reflect the position based on the passed parameters describing an arc.
* Y axis is inverted
* @function
* @param {Point} origin The point from which to calculate the new position of this.
* @param {number} arcWidth A number desribing the width of the arc definining the orbital path.
* @param {number} arcHeight A number desribing the height of the arc definining the orbital path (=arcWidth if not defined)
* @param {number} degrees The position (0 to 360) describing the position along the arc to be computed.
*/
Point.prototype.orbitFromCenterYInv = function(degrees, arcWidth, arcHeight){
	if (arcHeight==null) arcHeight=arcWidth; //circle
	var radians = degrees * (Math.PI / 180);
	return new Point(this.x + arcWidth * Math.cos(radians), this.y - arcHeight * Math.sin(radians) );
};

/**
* Offsets the Point object by the specified amount. The value of dx is added to the original value of x to create the new x value. The value of dy is added to the original value of y to create the new y value.
* @function
* @param {number} dx The amount by which to offset the horizontal coordinate, x.
* @param {number} dy The amount by which to offset the vertical coordinate, y.
*/
Point.prototype.offset = function(dx, dy){
	this.x += dx;
	this.y += dy;
};

/**
* Subtracts the coordinates of another point from the coordinates of this point to create a new point.
* @function
* @param {Point} v The point to be subtracted.
* @returns Point
*/
Point.prototype.subtract = function(v){
	return new Point(this.x - v.x, this.y - v.y);
};

/**
* Returns the Point object expressed as a String value.
* @function
* @returns string
*/
Point.prototype.toString = function(){
	return "(x=" + this.x + ", y=" + this.y + ")";
}; 
 
/**
* (added)
* translate and multiply coordinates
* @function
* @param {number} resolution  coefficient applied to coordinates
* @param {Point} newOrigin The point of new origin, or null if no translation
* @returns Point
*/
Point.prototype.transform = function(resolution, newOrigin){
	if (newOrigin != null)
		return new Point( (this.x + newOrigin.x)*resolution, (this.y + newOrigin.y)*resolution);
	else 
		return new Point( this.x *resolution, this.y *resolution);
};



/** 
* TO json 
*/
Point.prototype.toJSON = function() {
	return this.x + ";" + this.y;
};

/**
* from JSON
*/
Point.fromJSON= function(json) {
	return new Point( parseFloat(json.split(';')[0]), parseFloat(json.split(';')[1]));
};

/**
* Determines a point between two specified points. The parameter f determines where the new interpolated point is located relative to the two end points specified by parameters pt1 and pt2. The closer the value of the parameter f is to 1.0, the closer the interpolated point is to the first point (parameter pt1). The closer the value of the parameter f is to 0, the closer the interpolated point is to the second point (parameter pt2).
* @function
* @static
* @param {Point} pt1 The first point.
* @param {Point} pt2 The second point.
* @param {number} f The level of interpolation between the two points. Indicates where the new point will be, along the line between pt1 and pt2. If f=1, pt1 is returned; if f=0, pt2 is returned.
* @returns Point
*/
Point.interpolate = function(pt1, pt2, f){
	//return new Point((pt1.x + pt2.x) * f, (pt1.y + pt2.y) * f);
	return new Point( (pt1.x *f + pt2.x * (1-f) ), (pt1.y *f  + pt2.y*(1-f)));
};

/**
* Converts a pair of polar coordinates to a Cartesian point coordinate.
* @function
* @static
* @param {number} len The length coordinate of the polar pair.
* @param {number} angle The angle, in radians, of the polar pair.
* @returns Point
*/
Point.polar = function(len, angle){
	return new Point(len * Math.sin(angle), len * Math.cos(angle));
};

/**
* Returns the distance between pt1 and pt2.
* @function
* @static
* @returns Point
*/
Point.distance = function(pt1, pt2){
	if (pt2 == null) return Math.sqrt(pt1.x  * pt1.x  + pt1.y * pt1.y); //distance to origin
	var x = pt1.x - pt2.x;
	var y = pt1.y - pt2.y;
	return Math.sqrt(x * x + y * y);
};

/** (added)
* Returns the scalar product of two vectors.
* @function
* @static
* @returns Point
*/
Point.scalarProduct = function(v1, v2){
	return v1.x * v2.x + v1.y * v2.y;
};

/** (added)
* Returns the vector product (cross product) of two vectors.
* @function
* @static
* @returns Point
*/
Point.crossProduct = function(v1, v2){
	return v1.x * v2.y - v1.y * v2.x;
};

/** (added)
* Returns the sinus value of angle between two vector 
* @function
* @static
* @returns Point
*/
Point.sin = function(v1, v2){
	return Point.crossProduct(v1,v2)/(Point.distance(v1)*Point.distance(v2));
};

/** (added)
* Returns intersection of two lines (a,c) and (b,d) or false if parallels
*/
Point.Intersection = function(a,c,b,d) {
	
	var x=((d.y-(((b.y-d.y)/(b.x-d.x))*d.x))-(a.y-(((c.y-a.y)/(c.x-a.x))*a.x)))/(((c.y-a.y)/(c.x-a.x))-((b.y-d.y)/(b.x-d.x)));
	
	var y=x*((c.y-a.y)/(c.x-a.x))+(a.y-((c.y-a.y)/(c.x-a.x)*a.x));

	if (isFinite(x) && isFinite(y)  ) return new Point( x, y);
	
	//specific case of vertical line
	if (c.x-a.x==0) { x=c.x; y= b.y + (d.y-b.y)*(x-b.x)/(d.x-b.x); } 
	
	if (isFinite(x) && isFinite(y)  ) return new Point( x, y);
	
	return false;
	
	//if (reverseIntersection) return false;
	//else return Point.Intersection(c,a,d,b, true); //case of vertical line ab : revert the line ab and cd allow returning true intersection instead of infinte value
};

/** (added)
* Returns true if segment a b intersect segment c d 
*/
Point.isSegmentIntersected = function(a,b,c,d) {
	
	var m = Point.Intersection(a,b,c,d);
	if (m==false) return false;
	
	//intersection on both segment ab and cd ?
	
	//alert(a + " " + b + "   /   " + c + " " + d);
	var ab=b.subtract(a); var am=m.subtract(a);
	var projm = Point.scalarProduct(ab,am);
	if (projm<0) return false; if( projm > Point.scalarProduct(ab,ab)) return false;
	
	var cd=d.subtract(c); var cm=m.subtract(c);
	projm = Point.scalarProduct(cd,cm);
	if (projm<0) return false; if( projm > Point.scalarProduct(cd,cd)) return false;
	
	return true;
	//debug
	//alert("projc=" + projc + "    projd=" + projd + "   dab2=" + dab2);  
};


/** (added)
* Return an array of points set with de relatives to (x,y) origin.
* @param  {Array} coord list of coordinates : array of number. The first point is absolute, the next coordinates are relatives to the last position
* @param {Point} origin point (0,0) of the relative path
* @param {number} sizing coefficient applied to coordinates, before translating to origin
* @returns {Array} Array of point
*/
Point.relativePath = function(coord, origin, sizing) {
	p = new Array();
	
	if (sizing == null) sizing=1;
	
	for (var i=0; i< coord.length; i++) {
		if (i % 2 == 0)	{
			if (i==0) p[i/2]= new Point( coord[i]*sizing, coord[i+1]*sizing ); 	//first point
			else p[i/2]= new Point(coord[i] *sizing, coord[i+1]*sizing ).add(p[i/2-1]); //relative coordinate
		}
	}
	for(i=0;i<p.length;i++) p[i]=p[i].add( origin); //translation
	
	return p;
};


/** ===========================================
!! Shared client/server code !!
Make this a Node module, if possible (ignored on client app)
**/ 
if (typeof exports == 'object' && exports) {
	exports.Map = Map;
	exports.Land=Land;
	exports.Incomes = Incomes;
	exports.LearnedSpells = LearnedSpells;
	exports.Diplomacy = Diplomacy;
	exports.Place=Place;
	exports.People=People;
    exports.Unit = Unit;
	exports.Act=Act;
	exports.Tactic=Tactic;
	exports.Fighting=Fighting;
	exports.Point=Point;
}
