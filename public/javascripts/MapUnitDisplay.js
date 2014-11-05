/**
Displaying unit on map
*/

/**
Single image which stores all units images (performance enhancement). Images will be drawn as div with specific backgroundPosition to focuse on.
See adminMapEdit.js to see how the image is performed.
*/
Unit.IMAGES_SRC='images/units.png';
Unit.IMAGES_SIZE=48;

/** Html image of the Unit on the map */
Unit.prototype.img = null;

/**
* Draw units on a given place.
* @function
* @param  ctx : canvas context (one for each layered)
* @returns 
*/
Unit.DrawUnits = function(ctx1,ctx2,ctx3, place, map) { 

	map.incomes.updateIncomes(map); //to draw icon incomes around wizard
	
	var position=place.position;
	var owner = place.owner;
	if (place.units==null) numberOfUnits=0;
	else  numberOfUnits=place.units.length;
	
	//draw tower
	if (place.tower!=null) {
		var dy=0;
		if (numberOfUnits>0) dy=-Place.SIZE*.25; //-numberOfUnits*Place.SIZE*.15;
		Place.DrawTower(ctx1, position.add(0,dy),place.tower, place.terrain);
	}
	
	if (owner!=0)  { //owner's flag	
	
		//empty territory : draw pike which supports flag	
		if (numberOfUnits==0) { 
			var dx=0; if (place.tower!=null) dx=8;
			Unit.DrawEmptyPlace(ctx2, position, owner, place.terrain );
		} else {
			//flag position on center army
			var s=Math.sqrt(Math.sqrt(numberOfUnits))/Math.sqrt(Math.sqrt(5));
			if (owner>=People.WIZARD_COUNT) return;
			//place.flagKineticImg = Unit.DrawFlag(ctx, owner, position.add(-(numberOfUnits/2-.5)*Place.SIZE/5,-Place.SIZE/2.5), s );
		}
	
	}
	
	var indexOfWizard = place.indexOfWizard(); //to draw wizard after others armies

	for (var i=0; i<numberOfUnits; i++) {
		var u=place.units[i];
		Unit.DrawArmy(ctx2,ctx3, u.graphicPosition(), place.units[i].owner, u.type );
	}
	
	
	//for (var idWizard=1;idWizard<People.WIZARD_COUNT;idWizard++) { }
	
	//specific drawing on wizard!
	if ( ( owner>0) && (indexOfWizard>=0) ) {
		
		//draw icon incomes! around wizard
		//size of icon depend on futureStock
		var icon="images/crystal.png";
		var sizeOfIcon=0;
		var maxSize=32;
		var minSizeVisibility=16;
		if (map.incomes.incomes[owner]<0) { //risk of bankrupcy
			icon="images/crystalNoMore.png";
			var futureStock = map.incomes.futureStock(owner, 1);
			if ( map.incomes.futureStock(owner, 1) < 0 ) { //bankrupcy may happend at next turn !
				sizeOfIcon = maxSize * ( -futureStock * 10  ) / Incomes.MAX_STOCK ; 
				if (sizeOfIcon<minSizeVisibility) sizeOfIcon=minSizeVisibility*1.2; //well visible warning even if risk is low
			} else { //no immediate risk. Let see long term trend
				futureStock = map.incomes.futureStock(owner, 5); //apply several turns of incomes 
				sizeOfIcon = maxSize * ( -futureStock ) / Incomes.MAX_STOCK; 		
			}
		}
		else { //positive income
			var futureStock = map.incomes.futureStock(owner, 2); //apply several turns of incomes to see long term trend
			sizeOfIcon = maxSize *  futureStock   / Incomes.MAX_STOCK; 
		}
		//draw icon
		if ( sizeOfIcon>=minSizeVisibility)   { //draw only significant icons
			if (sizeOfIcon>maxSize) sizeOfIcon=maxSize;
			Map.InsertImageInCanvas(icon,  place.units[indexOfWizard].graphicPosition().add(-(sizeOfIcon/2) ,-sizeOfIcon ), ctx3, sizeOfIcon, sizeOfIcon );			
		} 
		
		//draw learned spells! around wizard
		if (map.spells.spells[owner].length<8) 
			for( var j=0; j<map.spells.spells[owner].length; j++ ) {
				Map.InsertImageInCanvas("images/spell.png",  place.units[indexOfWizard].graphicPosition().add(-15 + 18 * Math.cos(j/4*Math.PI) ,-33 - 20 * Math.sin(j/4*Math.PI) ), ctx3);
			}
		else //winner !!!
			Map.InsertImageInCanvas("images/victory.png",  place.units[indexOfWizard].graphicPosition().add(-70,-95), ctx1 );
	
		
	}
	
	/*
	//now can draw wizard in front of armies
	if (indexOfWizard>=0) {
		var u=place.units[indexOfWizard];
		if (u.img != null) Map.RemoveElement(u.img); 
		u.img = Unit.DrawWizard(ctx,Unit.position(position,u.type,numberOfUnits,indexOfWizard,indexOfWizard), owner);
	}
	*/
	

}

/** return the position of unit **/
Unit.prototype.graphicPosition = function() {
	return Unit.position( this.place.position, this.type, this.place.units.length, this.place.units.indexOf(this), this.place.indexOfWizard());
}

//return the position of the unit, given the position of its place and the information about other units nearby
Unit.position = function(placePosition, typeOfUnit, numberOfUnits, indexOfUnit, indexOfWizard)  {
	var iPos=indexOfUnit; //position of the image, in the order of the armies
	if ( (indexOfWizard>=0) && (iPos>indexOfWizard) )iPos--; //don't put wizard amidst armies (if present), so put army to its position...
	
	var space=Place.SIZE*.5;

	if (typeOfUnit == Unit.WIZARD ) 	{
		if (iPos==indexOfWizard) iPos=numberOfUnits-1; //...and let the wizard be at the right, last drawn, and chief of all !
		return placePosition.add(space + iPos*space-(numberOfUnits/2)*space,space*.8);
	}
	
	else return placePosition.add(space + iPos*space-(numberOfUnits/2)*space,space*.8);
}



Unit.OFFSET =new Point(-Unit.IMAGES_SIZE*.5,-Unit.IMAGES_SIZE*.75) ;

Unit.DrawArmy = function(ctx2,ctx3, position, owner, t, opacity ) {

	//position
	var p=null;
	if (position!=null)  {
		p=position.add(-Unit.IMAGES_SIZE*.45,-Unit.IMAGES_SIZE*.65);
		p=p.add(-5,-15); //new images
	}
	
	//Ground blazon (except for neutral units)
	if (owner > 0) Map.InsertImageInCanvas("images/color" + owner + ".png", p, ctx2,  null, null);
	
	//unit symbol
	if (opacity==null) opacity=1;
	
	var img = Map.InsertImageInCanvas("images/unit" + t + ".png", p, ctx3,  null, null, opacity);
	
	return img;
	
}

Unit.DrawEmptyPlace = function(ctx, position, owner, terrain ) { 

	var size = 28 * Math.sqrt( Place.incomeOfTerrain( terrain) /  Place.incomeOfTerrain(null) ) ;
	if (owner > 0)  return Map.InsertImageInCanvas("images/color" + owner + ".png", position.add(-12,-20), ctx,  size, size);
	return null;
}

Unit.DrawWarIcon = function(ctx, position ) { //, stroke: 'black'
	return Map.InsertImageInCanvas("images/dead.png", position.add(-12,-45), ctx,  28, 28);
	return null;
}

/** 
Enlight selected unit an show its possible destinations
ctx : canvas where to show
*/
Unit.prototype.showSelected = function ( ctx, color ) {
	 
	if (color == null) color = Unit.ColorOf(this.owner); //default color
	
	pos = this.graphicPosition().add(-11,-26);
	
	pos.showEnlightedCircle(ctx, color, 22);
	
	/*
	ctx.beginPath();
	ctx.arc(pos.x, pos.y, 22, 0, Math.PI*2, true); 
	ctx.closePath();
	
	ctx.shadowBlur = 5; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; ctx.shadowColor=color;  //blur option 
	ctx.strokeStyle = color;  ctx.lineWidth=1.3; ctx.stroke();
	*/
}

Unit.ColorOfMe="blue";
Unit.ColorOfOthers="red";
Unit.ColorOf = function(owner) { 

	if (owner==1) return "blue" ;  
	if (owner==2) return "red" ;  
	if (owner==3) return "green" ;  
	if (owner==4) return "OrangeRed" ;  
	if (owner==5) return "MediumVioletRed" ;  
	if (owner==6) return  "#522525"; //"IndianRed" ;  
	if (owner==7) return "darkred" ;  
	if (owner==8) return "Fuchsia" ;  

	return "#555" ;  //neutral
	//return "hsl(" + Math.round(owner * 73)%360 + ",100%,25%)";
};

/**
Draw on canvas the places where a unit and its given order may go
*/
Unit.prototype.showPossiblePlacesToGo = function( ctx, order, map) {
	var place = this.place;
	//neighbor places
	if (place==null) return;
	
			
	
	/**
	if ( order.parameters["places"] != null )
		if ( order.parameters["places"].lenght > 0 ) ////place where order is currently set
			place=order.parameters["places"][ order.parameters["places"].lenght - 1 ]
	**/
	
	/*
	var neighbors = place.neighbors(map.land); //places with path
	//free movement places : access to farther place when unit have a good movement on its startup terrain
	var flyDistance= Place.SIZE /  Unit.movementFactorOfType(this.type, place.terrain) * 10 ;
	map.land.placesWithinDistance( place.position, flyDistance, neighbors )	;
	*/
	
	var neighbors = Act.MovementPossiblePlacesToGo(place, this.type, map.land);
	
	//add only reachable places (testing movement)
	for( var i=0; i<neighbors.length; i++) {
		if (order.movementAddPlace(neighbors[i], map, false) == Act.MVT_OK ) {
			Unit.ShowPlaceToGo(  ctx, neighbors[i].position, Unit.ColorOf(this.owner) );
		}
	}
	
	if (order.type!=Act.MOVEMENT) return; //no more required for other orders
	
	//show strength of unit
	this.showStrengthOfUnit(ctx, order, map);
	
}
Unit.ShowPlaceToGo = function( ctx, pos, color ) {
	pos.showEnlightedCircle(ctx, color, 6);
/*
	ctx.beginPath();
	ctx.arc(pos.x, pos.y, 6, 0, Math.PI*2, true); 
	ctx.closePath();
	ctx.shadowBlur = 5; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; ctx.shadowColor=color;  //blur option 
	ctx.strokeStyle = color;  ctx.lineWidth=1.3; ctx.stroke();	
*/
}

/** show strength of unit **/
Unit.prototype.showStrengthOfUnit = function(ctx, order, map) {
	ctx.shadowBlur = 0;
	var pos = this.place.position; //strength text position
	
	if (order.destination() != null) pos = order.destination().position;
	pos = pos.add(0, 15 );
	
	//new position if text near map border
	pos  = MenuFloatingPosition( pos, new Point( 80, 25), new Point(0,0), map.land.size() );
	
	ctx.font="normal bold 12px Arial"; 
	ctx.lineWidth=2; ctx.strokeStyle = "white";
	ctx.fillStyle = "black"
	
	var text= InfoMessages["Strength"] + " " + this.strength(map, order);
	ctx.strokeText(text,pos.x,pos.y);   
	ctx.fillText(text,pos.x,pos.y); 
}

/**
Draw on canvas the places where a unit can recruit
*/
Unit.prototype.showPossiblePlacesToRecruit= function( ctx, order, map) {
	
	if (order.parameters.places.length>= Act.MAX_RECRUIT_PER_TURN) return;

	var places = order.recruitAllPossiblePlaces(map);

	for( var i=0; i<places.length; i++) Unit.ShowPlaceToGo(  ctx, places[i].position, Unit.ColorOf(this.owner) );
	
}

/**
Draw on canvas the places where a wizard can set his reincarnation
*/
Unit.showPossiblePlacesForReincarnation= function( ctx, order, map) {


	for( var i=0; i<map.land.places.length; i++) Unit.ShowPlaceToGo(  ctx, map.land.places[i].position, Unit.ColorOf(order.owner) );
	
}

/**
Draw on canvas the places where a unit (wizard supposed) can throw an given spell
*/
Unit.prototype.showPossiblePlacesToThrowSpell= function( ctx, order, map) {
	
	//places where spells has been learnt by wizard :
	//towers= map.spells.placesWithLearnedSpell(this.owner, map.land);
	
	//var places = map.land.placesWithinDistance(this.place.position, Place.SIZE * towers.length * 4, null );
	
	var places = map.spells.placesToThrowSpell(this.owner, this.place, map.land );
	
	for( var i=0; i<places.length; i++) {
		if (LearnedSpells.isSpellAMovement( places[i].terrain ) )
			Unit.ShowPlaceToGo(  ctx, places[i].position, Unit.ColorOf(this.owner) );
		else  places[i].position.showEnlightedRay(ctx, Unit.ColorOf(this.owner), 15); //distant attack ; display it differently
	}
	
}
