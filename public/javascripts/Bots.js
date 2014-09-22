/**
Create orders for IA (bots) players
okas : namespace for Map, Land, etc... (node compatibility)
**/
function Bots(okas, map) {
	this.map=map;
	this.map.incomes.updateIncomes(this.map);
	this.okas=okas;

}
Bots.prototype.okas; 
Bots.prototype.map;

/** create order for wizard **/
Bots.prototype.getOrders= function( idWizard ) {
	
	var tactic = new this.okas.Tactic( new Array(), this.map.turnNumber );
	
	var wizard = this.map.people.wizards[idWizard];
	//wizard order : recruit or movement ?
	
	//where bot want to go : 
	var targetPlace=null;
	var order = null;
	
	if (wizard!=null) { //undead wizard

		targetPlace = this.nearestTower(wizard.place, idWizard); //search tower
		if (targetPlace==null) targetPlace = this.randomPlace(); 
		
		/* deprecated
		//learn spell if tower
		if (wizard.place.tower!=null) if ( this.map.spells.hasLearn(wizard.owner, wizard.place) == false ) {
			order = new this.okas.Act(idWizard, this.okas.Act.SPELL_LEARN) ;
			order.parameters.unit=wizard;			
			tactic.addOrder(order);		
		}
		*/
		
		//recruit if possible
		var stocksAfter=this.map.incomes.futureStock(idWizard,1);
		if (this.map.incomes.futureStock(idWizard,4) < stocksAfter ) stocksAfter = this.map.incomes.futureStock(idWizard,4); //long term trend
		
		var incomesAfter=this.map.incomes.incomes[idWizard];
//&& ( stocksAfter > Math.random() * this.okas.Incomes.MAX_STOCK / 5 )
		if ( (order==null)  && ( incomesAfter > 0) && (this.numberOfAllyUnitsAround( wizard.place ) < Math.random() * 7 ) ) { //enough money, and enough places to recruit !

			//recruit
			order = new this.okas.Act(idWizard, this.okas.Act.RECRUIT) ;
			order.parameters.unit=wizard;
			order.parameters.places=new Array();
			
			while ( (incomesAfter>=0)  && (order.parameters.places.length<this.okas.Act.MAX_RECRUIT_PER_TURN ) ) {
				var place = this.randomPlace(wizard.place, true);
				var typeOfRecruit=this.okas.Unit.typeRecruitedOn(place.terrain); //place to recruit
				incomesAfter-=this.okas.Unit.costOfType(typeOfRecruit) - ( stocksAfter * Math.random() * .12 ) ; //if many stock of money, take more risk for recruiting
				if (incomesAfter>=0) order.parameters.places.push(place);
			}
			
			tactic.addOrder(order);
		} 

		//movement if nothing else to do
		if (order==null) {
			order = this.randomDestination( wizard, targetPlace);
			if (order!=null) tactic.addOrder(order);
		}
		
	} else { 
		//dead wizard ? reincarnation !

		//search an empty towered place to go (or a neighbour of a towered place)
		var tryCount=0;
		var targetPlace=this.randomPlace(this.nearestTower(this.randomPlace(null,true), idWizard ),true);
		while(  (!targetPlace.isEmpty()) && (tryCount<5) ) { tryCount++; targetPlace=this.randomPlace(this.nearestTower(this.randomPlace(null,true), idWizard ),true); }

		order = new this.okas.Act(idWizard, this.okas.Act.REINCARNATION) ;
		order.parameters.place=targetPlace;

		tactic.addOrder(order);		
		return tactic; //no other orders possible

	}
	
	if (targetPlace==null) targetPlace = this.randomPlace(); //dead wizard
	
	//movement of other units of wizard
	var bodygards=0; //number of units that go with wizard
	for (var i=0; i<this.map.people.units.length; i++) {
		var unit=this.map.people.units[i];
		if ( (unit.owner==idWizard) && ( unit.type != this.okas.Unit.WIZARD ) ) {
			
			if (bodygards<this.map.spells.count(unit.owner)/2 ) { //the more the wizard have spell, the more he require protection
				order = this.randomDestination( unit, this.randomPlace(targetPlace, true) ); //destination : place around targeted place by wizard
				bodygards++;
			} else { //enough unit beside wizard : let's explore the world !
				
				order = this.randomDestination( unit, this.nearestPlaceForIncomes(unit.place, unit.owner) ); 
			}
			
			if (order!=null) tactic.addOrder(order);		
		}
	}
	
	//diplomatic support ?
	for (var idWizard2=1; idWizard2<this.okas.People.WIZARD_COUNT; idWizard2++) {
		
	
		if ( ( idWizard2 != idWizard ) && ( Math.random() < 0.2 ) ) { //try diplomacy with this guy ?
		
			var nbOfSpells=this.map.spells.count(idWizard2);
			var isThisGuyMayBeAnAlly = Math.random() * 20 >  ( nbOfSpells * nbOfSpells );
			
			//no yet supporting ?
			if (this.map.diplomacy.supports[idWizard][idWizard2] == this.okas.Diplomacy.SUPPORT_NO) {
			
				//should wizard support this guy ?
				if ( isThisGuyMayBeAnAlly ) {
					order = new this.okas.Act(idWizard, this.okas.Act.DIPLOMATIC_SUPPORT) ;
					order.parameters.idWizard2=idWizard2;
					order.parameters.support=this.okas.Diplomacy.SUPPORT_YES;
					tactic.addOrder(order);					
				}
				
			} 
			//...or already supporting : is it still a good deal ?
			else { 
			
				//should wizard support again guy ?
				if ( ! isThisGuyMayBeAnAlly ) {
					order = new this.okas.Act(idWizard, this.okas.Act.DIPLOMATIC_SUPPORT) ;
					order.parameters.idWizard2=idWizard2;
					order.parameters.support=this.okas.Diplomacy.SUPPORT_NO;
					tactic.addOrder(order);					
				}			
				
			}
			
		}
		
	}
	
	
	return tactic;

}

/** return the number of ally units around a given place **/
Bots.prototype.numberOfAllyUnitsAround= function( place ) {
	
	var neighbors = this.map.land.neighbors[place.id];
	var countAllies=0;
	
	for (var i=0; i< neighbors.length; i++) {

		var p=this.map.land.places[neighbors[i]]; //neighbooring place
		
		if (p.units==null) continue;
		if (p.units.length==0) continue;
		
		//console.log( this.map.diplomacy.supports[p.owner][place.owner] );
		
		if (this.map.diplomacy.supports[p.owner][place.owner] == this.okas.Diplomacy.SUPPORT_YES) {
			if (p.owner==place.owner) countAllies++;
			else countAllies+=0.5; //ally count for half an ally, ah ah
		}
	
	}

	return countAllies;
}

/** return the nearest tower with no learned spell **/
Bots.prototype.nearestTower = function( placeFrom, idWizard ) {
	var placeWithTower=null;
	var distMin=null;
	for (var i=0; i<this.map.land.places.length; i++) {
		var place=this.map.land.places[i];
		if (place.tower==null) continue;
		if ( this.map.spells.hasLearn(idWizard, place) ) continue;
		if (placeWithTower==null) { //firt place found with tower
			placeWithTower=place; 
			distMin=placeFrom.position.distance(placeWithTower.position); 
			continue; 
		}
		if (placeFrom.position.distance(place.position)<distMin) { //nearer place
			placeWithTower=place; 
			distMin=placeFrom.position.distance(placeWithTower.position); 
			continue;
		}

	}
	return placeWithTower;
}

/** return the nearest empty place good to increase incomes **/
Bots.prototype.nearestPlaceForIncomes = function( placeFrom, idWizard ) {
	var placeToGo=null;
	var distMin=null;
	for (var i=0; i<this.map.land.places.length; i++) {
		var place=this.map.land.places[i];
		
		
		if (place.owner==idWizard) continue; //already owned
		if (place.units!=null)  if (place.units.length>0) continue; //crowded place
				
		if (placeToGo==null) { //first place found 
			placeToGo=place; 
			distMin=placeFrom.position.distance(placeToGo.position); 
			continue; 
		}
		if (placeFrom.position.distance(place.position)<distMin) { //nearer place
			placeToGo=place; 
			distMin=placeFrom.position.distance(placeToGo.position); 
			continue;
		}

	}
	return placeToGo;
}


/** return a random place (neighbors) from a given place. If itself is true, placeFrom can be also returned.  **/
Bots.prototype.randomPlace = function ( placeFrom, itself ) {
	if (placeFrom==null) return this.map.land.places[Math.floor( Math.random()*this.map.land.places.length ) ];
	
	var neighbors = this.map.land.neighbors[placeFrom.id];
	var maxId = neighbors.length;
	if (itself) maxId++;
	var randomId = Math.floor( Math.random()*maxId ) ;
	if (randomId >= neighbors.length ) return placeFrom;
	else return this.map.land.places[neighbors[randomId]];
}

/** return a movement order for a unit, given a target place to go 
	overpopulate represents how much a destination can be overpopulated (default : 0)
**/
Bots.prototype.randomDestination = function( unit, targetPlace, overpopulate ) {

	if (overpopulate==null) overpopulated=0;
	var maxTry=20; 
	
	//init order
	var order = new this.okas.Act(unit.owner, this.okas.Act.MOVEMENT) ;
	order.parameters.unit=unit;
	order.parameters.places=new Array();
	order.parameters.places.push(unit.place);
	//order.parameters.startGraphicPosition=unit.place.position; //unit.graphicPosition().add(-16,-16);;
			
	
	var movementCount=0; 
	var movementPossible=true;
	for( var i=1; i<maxTry; i++) { if (movementPossible) {
		var placeProposition = this.randomPlace( order.parameters.places[movementCount], false);
		
		if (placeProposition.position.distance( targetPlace.position)  < order.parameters.places[movementCount].position.distance(targetPlace.position)  ) {
			
			if ( order.movementAddPlace(placeProposition, this.map, true ) == this.okas.Act.MVT_OK ) {
				movementCount++;
				//order.parameters.places[movementCount]=placeProposition;
			} else movementPossible = false; //no more strength
			
			//avoid too long movements
			if (movementCount>Math.random()*Math.random()*12) movementPossible = false; //stop moving even if there's strength remaining
			
		}
	
	}}

	//don't move on too crowded own place
	var tooCrowded=false;
	var destination = order.destination();
	if (destination!=null) if (order.destination()==unit.owner) {
		if (destination.units!=null) if (destination.units.length>=this.okas.People.MAX_UNIT_PER_PLACE + overpopulated ) tooCrowded=true ;
	}
	if (tooCrowded) return this.randomDestination( unit, targetPlace, (overpopulate+1) ); //try to set more units on the same destination. 

	if (order.parameters.places.length>1) return order;
	return null; //no movement
}

/** ===========================================
!! Shared client/server code !!
Make this a Node module, if possible (ignored on client app)
**/ 
if (typeof exports == 'object' && exports) {
	exports.Bots = Bots;
}