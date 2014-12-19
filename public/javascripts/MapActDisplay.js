/**
DEPECRATED !!!  see clientOrderInputs     
Displaying and enter orders in GUI
*/


/** TO BE TESTED AGAIN !
* Display an animation to figure the act on map. Modify the people object of the map to be consistent with the act & drawing.
* return true if animation can be done, false if the map is not consistent with the act.
*/
/* deprecated 
Act.prototype.animate = function(layer,map) {
	var animationDuration=500;

	if ( (this.type=Act.ATTACK)  ) {
		
		//which place ?
		var pStart = map.land.places[this.parameters.start];
		var pEnd = map.land.places[this.parameters.end];
		if (pStart.units==null) return false; if (pStart.units.length==0) return false; //no unit there
		//which unit ?
		indexOfUnit=0; //testing purpose 
		var u = pStart.units[indexOfUnit];
		u.img.style.zIndex=100; //to be well visible
		startPos=Unit.position(pStart.position, u.type, pStart.units.length, indexOfUnit, pStart.indexOfWizard());
		//which destination
		var endPos = Unit.position(pEnd.position, u.type,    1, 0, -1 );
		
		//let start a new animation
		var elapsedTime=0; var animationDuration=500; var deltaTime=40;
		var anim = function() {
			
			if ( elapsedTime < animationDuration ) { 
				var pos = startPos.interpolate( endPos, 1 - elapsedTime/animationDuration  )
				//u.img.setX(pos.x); u.kineticImg.setY(pos.y);
				u.img.style.left=pos.add(Unit.OFFSET).x + "px";
				u.img.style.top=pos.add(Unit.OFFSET).y + "px";
				elapsedTime+=deltaTime;
				setTimeout(anim, deltaTime); //restart animation
			}
			else { 
				
				u.img.style.zIndex=10; //return to its lower zIndex
				
				if (pEnd.owner!=u.owner) map.people.removeUnitsIn(pEnd); //remove ancient unit if their owner is not the new one
				map.people.removeUnit(u);
				map.people.addUnit(u, pEnd);
			
				//ok, so let redraw the scene properly :
				Unit.DrawUnits( layer, pEnd );
				Unit.DrawUnits( layer, pStart );
			}
		};
		anim();	
		
		return true;
	}
	
};
*/

/**redraw order of Tactic on a given canvas (clear it).*/
Tactic.prototype.orderRefresh = function(ctx, ctxOrdersStrength, map) {
	//clear the canvas layer
	ctx.clearRect(0, 0, map.land.size().x, map.land.size().y);
	
	if (this==null) return;
	
	//ORDERS
	//search places where movemnts occur to display them properly
	
	//1) count & mesure angle from places
	var placesArrowAngle=new Array(); //index of places where movemnet occurs : index : place.id, value : array of angle in degree from place where unit com from
	this.doOrders(Act.MOVEMENT, function(order) { //redraw each order of tactics
		if (order.parameters.places==null) return;
		for (var i=1; i<order.parameters.places.length; i++) { //ignore first place
			
			var placeFrom = order.parameters.places[i-1];
			var placeTo = order.parameters.places[i];
			if (placesArrowAngle[ placeTo.id ] == null)  placesArrowAngle[ placeTo.id ] = new Array();
			
			var angle = placeFrom.position.degreesToYInv( placeTo.position );
			
			placesArrowAngle[ placeTo.id ].push(  angle );
			
			//link between order and placesArrowAngle array
			if(i==1) order._arrowIndex=new Array(); 
			order._arrowIndex[i]=placesArrowAngle[ placeTo.id ].length-1;
			
		}
	});
	//2) set the graphic position of arrow for each place of movement
	var settledAngle = new Array(); //settled angles, to add an offset when arrow came from same place (same angle). array[placeTo.id]->array[placeFrom.id]->array[i] : angle already added (sorted)
	this.doOrders(Act.MOVEMENT, function(order) { 
		if (order.parameters.places==null) return;
		if (order.parameters.graphicPositions==null) { order.parameters.graphicPositions=new Array(); order.parameters.graphicPositions[0]=order.parameters.places[0].position;} //security : should be already set
		
		for (var i=1; i<order.parameters.places.length; i++) {
			var placeFrom = order.parameters.places[i-1];
			var placeTo = order.parameters.places[i];
			var positionOfDestinationArrow=order.parameters.places[i].arrowTargetPosition(placesArrowAngle, order, i);
			if (settledAngle[placeTo.id]==null) { //first movement to here
				
				order.parameters.graphicPositions[i]= positionOfDestinationArrow;
				
				settledAngle[placeTo.id]=new Array();
				var settledAngleToHere = new Array();
				settledAngle[placeTo.id][placeFrom.id] = settledAngleToHere;
				settledAngleToHere.push(order.parameters.graphicPositions[i-1].degreesToYInv( order.parameters.graphicPositions[i] ) );
				
			} else { 
				var settledAngleToHere = settledAngle[placeTo.id][placeFrom.id];
				if ( settledAngleToHere == null ) { //first movement to here from there
				
					order.parameters.graphicPositions[i]= positionOfDestinationArrow;
					
					var settledAngleToHere = new Array();
					settledAngle[placeTo.id][placeFrom.id] = settledAngleToHere;
					settledAngleToHere.push(order.parameters.graphicPositions[i-1].degreesToYInv( order.parameters.graphicPositions[i] ) );
				} else { //other movements from de same place : should add offset to avoir superimposition of arrows
					
					//angle that we would like to use
					var wantedAngle = order.parameters.graphicPositions[i-1].degreesToYInv( positionOfDestinationArrow );
					var correctedAngle; //angle that we will use, once offset applied
					var offSetStep= 20; //360 / ( placesArrowAngle[placeTo.id].length + 30 ); //offset that we will apply to angle if it's too close to another
					
					//compare with other angles (in the sorted array settledAngleToHere)
					var endOfSearch = false;
					var j=0;
					while (!endOfSearch) {
					
						if (wantedAngle<settledAngleToHere[j]) { 
						
							if (j==0) { //end of search, angle is the first and lowest one
								//insert as the lowest angle :
								var correctedAngle = wantedAngle - offSetStep;
								endOfSearch=true;
							}
							
							if (j>0) { //Can this angle can be inserted here ?
								if (settledAngleToHere[j]-settledAngleToHere[j-1]<(2 * offSetStep) ) {
									//insert as intermediate angle :
									var correctedAngle = settledAngleToHere[j] + ( settledAngleToHere[j]-settledAngleToHere[j-1] ) / 2 ;								
									endOfSearch=true;
								}
							}
							
						} 
						
						if (!endOfSearch) if (j==settledAngleToHere.length-1) {
							//insert as the greater angle :
							correctedAngle = wantedAngle + offSetStep;
							endOfSearch=true;
						}
						
						if (!endOfSearch) j++; //angle not yet found
						
					}
					
					//apply corrected angle to destination
					settledAngleToHere.splice(j, 0, correctedAngle);
					order.parameters.graphicPositions[i] = order.parameters.places[i].arrowTargetPosition(placesArrowAngle, order, i, correctedAngle);
					
					
				
				}
			} //end of setting settledAngle[placeTo.id];
			
			//console.log( "DEBUG orderRefresh : Angles d'arrivée sur la place : " + placeTo.id );
			//console.log( settledAngle[placeTo.id] );
			
		}
		
	});
	
	
	//draw orders
	this.doOrders(null, function(order) { //redraw each order of tactics
		order.displayOrder(ctx);
	});
	
	//display warning on places where current wizard has more than 2 units, and may lose one of it
	if (CURRENT_WIZARD!=null) for( var i=0; i<map.land.places.length; i++) {
		var p=map.land.places[i];
		if (p.units==null) continue; if (p.units.length<=2) continue;
		
		//more than 2 units ?
		var numberOfUnit=0;
		for (var j=0; j<p.units.length; j++) if (p.units[j].owner==CURRENT_WIZARD) numberOfUnit++; 
		if (numberOfUnit<=2) continue;
		
		//if so, display a warning :
		ctx.font="normal bold 12px Arial"; 
		
		var pos = p.position;
		var text= new Array(numberOfUnit - 1).join( '!' );
		
		ctx.strokeStyle = 'white'; ctx.lineWidth = 2; //halo
		ctx.strokeText(text,pos.x - text.length * 3,pos.y); 	
		
		ctx.fillStyle = Unit.ColorOf(CURRENT_WIZARD);
		ctx.fillText(text,pos.x - text.length * 3,pos.y); 			
		
	}
	
	//STRENGTHS
	
	ctxOrdersStrength.clearRect(0, 0, map.land.size().x, map.land.size().y); 
	
	if (!ClientOrders.DISPLAY_STRENGTH) return; 
	
	//solve order to show strengths
	var fightings = map.getFightings();
	ctxOrdersStrength.clearRect(0, 0, map.land.size().x, map.land.size().y);
	for( var i=0; i<fightings.length; i++) fightings[i].displayStrength(ctxOrdersStrength, map);
	
}

/* return a position around a targeted place, given the array of angle that all movements towards this place make **/
Place.prototype.arrowTargetPosition = function(placesArrowAngle, order, indexOfPlaceInOrder, forcedAngle) {
	if ( (placesArrowAngle[this.id]==null) || (order._arrowIndex==null) ) return this.position; //only one movement arrive here
	var angle;
	if (forcedAngle==null) angle = placesArrowAngle[this.id][ order._arrowIndex[indexOfPlaceInOrder] ];
	else angle=forcedAngle;
	pos = this.position.orbitFromCenterYInv(angle, Place.SIZE * 0.25 );  // Math.sqrt( placesArrowAngle[this.id].length ) 
	return pos; //the more movement, the far from place the arrows are drawn
}


/*** display order on context
***/
Act.prototype.displayOrder = function( ctx, halo) {
	if (this.parameters==null) return;
	
	if (this.type == Act.REINCARNATION ) {
		if (this.parameters.place==null) return;
		var p = this.parameters.place.position.add(-20,-20);
		Map.InsertImageInCanvas("images/reincarnation.png", p , ctx);
		Map.InsertImageInCanvas("images/color" + this.owner + ".png", p, ctx,  null, null);
		return;
	
	}
	
	if (this.type == Act.MOVEMENT ) {
		if (this.parameters.places==null) return; //first movement
		if (this.parameters.places.length <= 1) return;
		
		var pos2;
			
		//arrow from place to place...
		for (var p=0; p<= this.parameters.places.length-2; p++) {
			var pos1 = null;
		
			if (this.parameters.graphicPositions!= null)  { //take care of other movement position
				pos1 = this.parameters.graphicPositions[p];
				pos2=this.parameters.graphicPositions[p+1];
			} else { //security : chould never occurs
				pos1 = this.parameters.places[p].position;
				pos2 = this.parameters.places[p+1].position;
			}
			
			var curveParam = -0.1 * ( pos1.distance(pos2) / Place.SIZE );
			
			ctx.lineWidth=1;
			
			var angle=.20; var d=10; //arrow parameters
			//different arrow for last movement
			if (p==this.parameters.places.length-2) {
				angle=.25; d=13;
			}
			
			//halo ?
			if (halo == true) {
				ctx.strokeStyle = 'white'; ctx.fillStyle = 'white'; ctx.lineWidth = 4;
				CanvasDrawArrow (ctx, pos1, pos2, 2, 1, angle, d, curveParam);
			}
				
			var color=Unit.ColorOf(this.owner); //color =  "hsl(" + ( ( this.parameters.unit.id * 100 ) % 255 ) + ",99%,30%)";  
			ctx.strokeStyle = color; ctx.fillStyle = color;	 ctx.lineWidth = 1;
			CanvasDrawArrow (ctx, pos1, pos2, 0, 1, angle, d, curveParam);			
		}	 
		
		
	}
	
	if (this.type == Act.RECRUIT ) {
		if (this.parameters.places==null) return;
		
		for (var i=0; i<this.parameters.places.length; i++) { //display each recruit on each place
			var place = this.parameters.places[i];
			var pos=place.position.add(  
				(Place.SIZE*.25) + Math.cos( this.owner *.8 ) * (Place.SIZE*.5), (Place.SIZE*.25) + Math.sin( this.owner *.8 ) * (Place.SIZE*.5)  );
				
			Unit.DrawArmy(ctx,ctx, pos,  //random place around, with wizard id as random generator
				this.owner,  Unit.typeRecruitedOn(place.terrain), 
				0.75 ); //opacity
			
			//arrow to the place of recruit
			var curveParam=1.4 + (i * 0.4 );
			var d=10;
			var angle=.4;
			var pos1=pos.add(-16,-16);
			//halo ?
			if (halo == true) {
				ctx.strokeStyle = 'white'; ctx.fillStyle = 'white'; ctx.lineWidth = 4;
				CanvasDrawArrow (ctx, pos1, place.position, 2, 1, angle, d, curveParam);
			}
			if (color == null) color = Unit.ColorOf(this.owner);
			ctx.strokeStyle = color; ctx.fillStyle = color;	 ctx.lineWidth = 1;
			CanvasDrawArrow (ctx, pos1, place.position, 0, 1, angle, d, curveParam );	
			
			/*
			//testing positionning
			for (var i=1; i<=8; i++)
				Unit.DrawArmy(ctx,ctx, this.parameters.place.position.add(  
					(Place.SIZE*.25) + Math.cos( i *.8 ) * (Place.SIZE*.5), (Place.SIZE*.25)  + Math.sin( i *.8 ) * (Place.SIZE*.5)  ),  //random place around, with wizard id as random generator
					i, Unit.typeRecruitedOn(place.terrain), 
					0.66 ); //opacity
			*/
			
			//Map.InsertImageInCanvas("./images/", position, ctx, height, width, opacity) ;
		}
	}
	
	if (this.type == Act.SPELL_LEARN ) {
		if (this.parameters.unit==null) return;
		Map.InsertImageInCanvas("images/spell.png", this.parameters.unit.place.position.add(3,-25), ctx);
	}
	
	if (this.type == Act.SPELL_THROW ) {
		if (this.result==Act.OUT_OF_RANGE) return;
		if (this.parameters.places==null) return;
		if (this.parameters.places.length==0) return;
		var place = this.parameters.places[0];
		
		if (color == null) color = Unit.ColorOf(this.owner);
		ctx.shadowBlur = 7; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; ctx.shadowColor="red";  //blur option (differenciate from other orders)
		ctx.strokeStyle = color; ctx.fillStyle = color;	 ctx.lineWidth = 1;
		
		//movement or distant attack ?
		if (LearnedSpells.isSpellAMovement(place.terrain)) { //magic movement
			//arrow from spell launcher	
			CanvasDrawArrow (ctx, this.parameters.startGraphicPosition, place.position, 0, 1, 0.25, 13, 0.2 );
			
			
		} else { //distant attack
			Map.InsertImageInCanvas("images/unit59.png", place.position.add(0,-25), ctx);
			//arrow from spell launcher
			CanvasDrawArrow (ctx, this.parameters.startGraphicPosition, place.position.add(16,-16), 0, 1, 0  , 4, 0.2 );	
		}
		
		ctx.shadowBlur = 0; //end blur for next draw
		
	}
	
}


/* deprecated return a position around a targeted place, given the start position of the arrow and the position of the start place**/
/*
Place.prototype.arrowTargetPosition = function(startPlacePosition, startArrowPosition) {
	var d = Place.SIZE * 0.25; //distance around place
	
	//delta positionning to avoid different unit on same place to arrive on same position
	targetDelta1 = this.position.add(  startArrowPosition.subtract(startPlacePosition) );
	
	//delat positionning to avoid different unit on different places to arrive on same position
	if (targetDelta1.distance(this.position)<Place.SIZE * 0.25) targetDelta2 =  startArrowPosition.interpolate(targetDelta1, 0.1);
	else targetDelta2 = targetDelta1;
	
	return targetDelta2;
}
*/

/** show the resulting strenghts on map **/
Fighting.prototype.displayStrength = function(ctx, map) {

	if (this.opponents.length<=1) return; //no true fight

	this.andTheWinnerIs(); //determine winner
	
	//new position if text near map border
	var pos0  = MenuFloatingPosition( this.place.position.add(0, - (this.opponents.length * 15 ) / 2 ) , new Point( 50, this.opponents.length * 15 ), new Point(0,0), map.land.size() );
		
	for (var i=this.opponents.length-1; i>=0; i--) {
		wizardId=this.opponents[i];
		
		var pos = pos0.add(0, i * 15 ); //strength text position
		

		if (wizardId==this.winner)	ctx.font="normal bold 12px Arial"; 
		else	ctx.font="normal normal 12px Arial"; 
		ctx.lineWidth=2; ctx.strokeStyle = "white";
		ctx.fillStyle = Unit.ColorOf(wizardId);
		
		var text= People.WizardName[wizardId] + " " + this.strengths[wizardId]; //substr(0,3)
		ctx.strokeText(text,pos.x - text.length * 3,pos.y);   ctx.fillText(text,pos.x - text.length * 3,pos.y); 		
	}
		
}
