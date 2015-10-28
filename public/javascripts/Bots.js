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
	
	//where wizard bot want to go : 
	var targetPlace=null;
	var order = null;
	
    //Choose a place to go : targetPlace
    if (wizard!=null) { //undead wizard
		targetPlace = this.nearestTower(wizard.place, idWizard); //search tower
		if (targetPlace==null) targetPlace = this.randomPlace();  
    }
    else { //dead wizard
		//search an empty towered place to go (or a neighbour of a towered place)
		var tryCount=0;
		var targetPlace=this.randomPlace(this.nearestTower(this.randomPlace(null,true), idWizard ),true);
		while(  (!targetPlace.isEmpty()) && (tryCount<5) ) { tryCount++; targetPlace=this.randomPlace(this.nearestTower(this.randomPlace(null,true), idWizard ),true); }        
    }
        
    
	//movements of units that ARE NOT the wizard
	var bodygards=0; //number of units that go with wizard
    var destinationsStrengths=new Object(); //destinations of different units, with their strength (index : id place). Used to know where is the safest place for wizard
	for (var i=0; i<this.map.people.units.length; i++) {
		var unit=this.map.people.units[i];
		if ( (unit.owner==idWizard) && ( unit.type != this.okas.Unit.WIZARD ) ) {
			
			if (bodygards< (1 + this.map.spells.count(unit.owner)/2 ) ) { //the more the wizard have spell, the more he requires protection
                if ( (unit.type == this.okas.Unit.DRAGON) || (unit.type == this.okas.Unit.PLUNDERER ) )
                    order = this.randomDestination( unit, targetPlace); //dragon and plunderer are not quite good on support
				else //destination : place around targeted place by wizard, good if unit are quite good on support 
                    if (unit.type == this.okas.Unit.PEASANT) //unit better on support
                        order = this.randomDestination( unit, this.randomPlace(targetPlace, false) ); 
                    else //unit quite as good in support or defense
                        order = this.randomDestination( unit, this.randomPlace(targetPlace, true) ); 
                
                if (order!=null) {
                    if (order.destination().id == targetPlace.id) { //unit can be a bodyguard
                        if (targetPlace.terrain == this.okas.Place.SEA) { //sea are special placse where only fleets are strong
                            if (unit.type == this.okas.Unit.CORSAIR) bodygards++;
                            else bodygards+=0.5; //others than fleet are of some poor protection
                        } else {
                            if (unit.type == this.okas.Unit.CORSAIR) bodygards+=0.5; //on earth fleet are useless
                            else bodygards++;                    
                        }
                    }
                }
            
			} else { //enough unit beside wizard : let's explore the world !
				
				order = this.randomDestination( unit, this.nearestPlaceForIncomes(unit.place, unit.owner, unit.type) ); 
			}
			
			if (order!=null) {
				var destination = order.destination();
				if (destination!=null) 
					if (destination.unitsOf(idWizard).length < this.okas.People.MAX_UNIT_PER_PLACE ) { //enough place here to move
						tactic.addOrder(order);		
                        //add the destination strenght
                        if (destinationsStrengths[order.destination().id] == null);
                            destinationsStrengths[order.destination().id] =0;
                        destinationsStrengths[order.destination().id] += this.okas.Unit.strengthOfType(unit.type,destination.terrain)
                    }
                
			}
			
		}
	}
        
    //orders of wizard (after moving other unit coz can check if there's enough bodygard on targeted place)
    order = null; //reinit current order
	if (wizard!=null) { //undead wizard
		
		//recruit if possible
		var stocksAfter=this.map.incomes.futureStock(idWizard,1);
		if (this.map.incomes.futureStock(idWizard,4) < stocksAfter ) stocksAfter = this.map.incomes.futureStock(idWizard,4); //long term trend
		
		var incomesAfter=this.map.incomes.incomes[idWizard];

		//if ( (order==null)  && ( incomesAfter > 0) && (this.numberOfAllyUnitsAround( wizard.place ) < Math.random() * 7 ) ) { //enough money, and enough places to recruit !
		if ( (order==null)  && ( incomesAfter > 0) && (bodygards < 2) ) { //enough money, and too few bodygards !
			//recruit
			order = new this.okas.Act(idWizard, this.okas.Act.RECRUIT) ;
			order.parameters.unit=wizard;
			order.parameters.places=new Array();
			
			var tryRecruitCount=0;
            var placesRecruitedOn=new Array(); //avoid recruiting on same places
			while ( (incomesAfter>=0)  && (order.parameters.places.length<this.okas.Act.MAX_RECRUIT_PER_TURN ) && (tryRecruitCount<20) ) {
				tryRecruitCount++;
                
				var place = this.randomPlace(wizard.place, true);
                //recruit on same place : avoided unless hazard
                var tryPlaceToRecruitSearch=0; //to avoid endless loop
                while ( ( tryPlaceToRecruitSearch < 20 ) && ( ( placesRecruitedOn.indexOf(place.id) >=0) || (Math.random()<0.04) ) ) {
                    place = this.randomPlace(wizard.place, true);
                    tryPlaceToRecruitSearch++;
                }
                placesRecruitedOn.push(place.id);
                
				var typeOfRecruit=this.okas.Unit.typeRecruitedOn(place.terrain); //place to recruit
				incomesAfter-=this.okas.Unit.costOfType(typeOfRecruit) - ( stocksAfter * Math.random() * .12 ) ; //if many stock of money, take more risk for recruiting
				if ( (incomesAfter>=0) && (place.unitsOf(idWizard).length < this.okas.People.MAX_UNIT_PER_PLACE ) ) { 
					order.parameters.places.push(place);
				}
			}
			
			if (order.parameters.places.length>0) tactic.addOrder(order);
		}
        
        if (bodygards < 1.7 + Math.random() * 1.4)  { //change targetPlace for a safest place if not enough bodygards
            
            //search the strongest place
            otherTarget=null;
            var sMax=0;
            for (var d in destinationsStrengths) { //each destination
                if (destinationsStrengths.hasOwnProperty(d)) {
                    s=destinationsStrengths[d];
                    if (s>sMax) { //best place found : where strength is higher
                        otherTarget = this.map.land.places[d];
                        sMax=s;
                    }
                }
            }
            
            //validate this place (must be not to far from wizard), and take a random place near this one
            if ( (otherTarget!=null) && ( otherTarget.position.distance(wizard.place.position) < this.okas.Place.SIZE * (3 + Math.random() * 1.5)  ) ) {
                targetPlace=this.randomPlace(otherTarget, true); //random place all around this place (to avoid too much unit on the same place)
                console.log("       TARGET PLACE CHANGED !!!!!! Bot Wizard " + idWizard  );
            }
            
        }

        //throw spells if no recruiting
        if (order==null) {
            spells = this.map.spells;
            typeOfSpellKnownForTerrain=spells.typeOfSpellKnownForTerrain(idWizard, this.map.land);
            
            //wizard could move by spell toward the targeted place ?
            if (this.okas.LearnedSpells.isSpellAMovement(targetPlace.terrain) && (typeOfSpellKnownForTerrain[targetPlace.terrain]>0) ) { 
                
                
                placeToThrow=spells.placesToThrowSpell(idWizard, wizard.place, this.map.land );
                for (var i=0; i<placeToThrow.length; i++) {
                    if (placeToThrow[i].id == targetPlace.id) {
                        //let's go !
                        var order = new this.okas.Act(idWizard, this.okas.Act.SPELL_THROW) ;
                        order.parameters.unit=wizard;
                        order.parameters.places=new Array();
                        order.parameters.places.push(targetPlace); 
                        order.parameters.startGraphicPosition = wizard.place.position;  //to draw arrow from spell launcher
                        
                        tactic.addOrder(order);
                        console.log("       SPELL SPELL SPELL !!!!!! Bot Wizard " + idWizard + " is throwing a MOVEMent SPELL !" );
                    }
                }
            } 
            
                
            //TODO : throwing distant spell
        }
        
		//movement if nothing else to do
		if (order==null) {
			order = this.randomDestination( wizard, targetPlace);
			if (order!=null) tactic.addOrder(order);
		}
		
	} else { 
		//dead wizard ? reincarnation !
		order = new this.okas.Act(idWizard, this.okas.Act.REINCARNATION) ;
		order.parameters.place=targetPlace;

		tactic.addOrder(order);		
		return tactic; //no other orders possible

	}
	
	if (targetPlace==null) targetPlace = this.randomPlace(); //dead wizard
	

    
    //console.log("Bots of wizard " + idWizard + " : bodygards = " + bodygards );
	
	//diplomatic support ?
	for (var idWizard2=1; idWizard2<this.okas.People.WIZARD_COUNT; idWizard2++) {
		
	
		if ( ( idWizard2 != idWizard ) && ( Math.random() < 0.5 ) ) { //try diplomacy with this guy ?
		
			var nbOfSpells=this.map.spells.count(idWizard2);
			var isThisGuyMayBeAnAlly = (Math.random() * 20) -  ( nbOfSpells * nbOfSpells );
			
			//console.log("bots isThisGuyMayBeAnAlly : " + isThisGuyMayBeAnAlly );
			
			//war ?
			if ( isThisGuyMayBeAnAlly < -10 ) {
				order = new this.okas.Act(idWizard, this.okas.Act.DIPLOMATIC_SUPPORT) ;
				order.parameters.idWizard2=idWizard2;
				order.parameters.support=this.okas.Diplomacy.WAR;
				tactic.addOrder(order);					
			}
			else 
				//should wizard support this guy ?
				if ( isThisGuyMayBeAnAlly > 18 ) {
					order = new this.okas.Act(idWizard, this.okas.Act.DIPLOMATIC_SUPPORT) ;
					order.parameters.idWizard2=idWizard2;
					order.parameters.support=this.okas.Diplomacy.SUPPORT_YES;
					tactic.addOrder(order);					
				}
				else {
					order = new this.okas.Act(idWizard, this.okas.Act.DIPLOMATIC_SUPPORT) ;
					order.parameters.idWizard2=idWizard2;
					order.parameters.support=this.okas.Diplomacy.SUPPORT_NO;
					tactic.addOrder(order);						
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
		
		if (this.map.diplomacy.supports[p.owner] != null)
			if (this.map.diplomacy.supports[p.owner][place.owner] == this.okas.Diplomacy.SUPPORT_YES) {
				if (p.owner==place.owner) countAllies++;
				else countAllies+=0.5; //ally count for half an ally, ah ah
			}
		//else { console.log("DEBUG Bots.prototype.numberOfAllyUnitsAround : this.map.diplomacy.supports.length=" + this.map.diplomacy.supports.length + 
		//		" p.owner=" + p.owner + "   array : "  ); }  //+ JSON.stringify(this.map.diplomacy.supports)
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
Bots.prototype.nearestPlaceForIncomes = function( placeFrom, idWizard, unitType ) {
	var placeToGo=null;
	var distMin=null;
    var isOnPreferredTerrain=false;
    var newIsOnPreferredTerrain=false;
	for (var i=0; i<this.map.land.places.length; i++) {
		var place=this.map.land.places[i];
		
		
		if (place.owner==idWizard) continue; //already owned
		if (place.units!=null)  if (place.units.length>0) continue; //crowded place
				
        //typeRecruitedOn
        
        //am I where I like to be ?
        newIsOnPreferredTerrain=(this.okas.Unit.typeRecruitedOn(place.terrain)==unitType);
        
		if (placeToGo==null) { //first place found 
			placeToGo=place; 
			distMin=placeFrom.position.distance(placeToGo.position); 
            isOnPreferredTerrain=newIsOnPreferredTerrain; 
			continue; 
		}
        
		if ( //get more importance on place that are preffered by unit
                (isOnPreferredTerrain && newIsOnPreferredTerrain && (placeFrom.position.distance(place.position)<distMin) ) 
            ||  (!isOnPreferredTerrain && newIsOnPreferredTerrain && (placeFrom.position.distance(place.position)<distMin*2) ) 
            ||  (isOnPreferredTerrain && !newIsOnPreferredTerrain && (placeFrom.position.distance(place.position)<distMin/2) ) 
           ) 
        { //nearer place
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

	//don't move on too cro wded own place
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
