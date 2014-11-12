/**
Entering orders : deal with client GUI for entering order
*/

/**
when adding a new type of order :
- add its type in Act. class
- in Act class implement its serialization (JSON <-> Object)
- in Map.updateOrder add it
- in Map.getFightings add the new type if it has to do with conflicts
- in Client and ClientOrder add it 

**/


function ClientOrders(map, idWizard) { 
	this.presentMap=map; //map object used to store present map, and to recovered it if orders are canceled
	this.map = map.clone(); //map object used to apply entered orders
	this.idWizard=idWizard;
}

/** present map, where no order are applied **/
ClientOrders.prototype.presentMap;
/** future map where orders are applied**/
ClientOrders.prototype.map; 
ClientOrders.prototype.idWizard;


/** selection mode **/
ClientOrders.SELECT_UNIT=0;
ClientOrders.SELECT_PLACE=1;
ClientOrders.prototype.selectMode=ClientOrders.SELECT_UNIT; //default mode

/** display strength or not **/
ClientOrders.DISPLAY_STRENGTH=true;


/** graphics outputs : context to show which unit is selected **/
ClientOrders.prototype.ctxSelectedUnit;
/** graphics outputs : context to show where unit can go **/
ClientOrders.prototype.ctxPlacesToGo;
/** graphics outputs : context to show entered orders **/
ClientOrders.prototype.ctxOrders;
/** graphics outputs : strengths of orders **/
ClientOrders.prototype.ctxOrdersStrength;

ClientOrders.prototype.currentOrder;

/** init click on map**/	
ClientOrders.prototype.initClick = function (mapContainer, beforeFunction ) {
	var client = this;
	mapContainer.onclick = function(evt) {	
		if (beforeFunction!=null) beforeFunction( Point.mouseCoordinates( evt, mapContainer ) );
		ClientOrders.HideFloatingsMenus();
		client.onClick( Point.mouseCoordinates( evt, mapContainer ) );
	};
}

ClientOrders.MAX_CLICK_DISTANCE=25; //tolerance for clicking on a given place
ClientOrders.LAST_CLICKED_PLACE=null; //allow CANCELLING ORDER
ClientOrders.CURRENT_ORDER_CAN_BE_CANCELED=false; //allow CANCELLING ORDER
/** click event **/
ClientOrders.prototype.onClick = function( pos ) {
	
	//search nearest place on the present map, because client see it
	var place=this.presentMap.land.nearestPlace( pos, ClientOrders.MAX_CLICK_DISTANCE );
		
	if (place ==null) { //click nowhere : ends current order
		this.resetOrder(); 
		return;
	}	
	
	//display x y
	//if (document.getElementById('debugtext') != null) document.getElementById('debugtext').innerHTML="ClientOrders.onClick  new Point(" + pos.x + "," + pos.y + ")   place.id=" + place.id;
	
	
	var mode = this.selectMode; //this.selectMode can be changed too quickly, so save it before as local var mode
		
	//allow CANCELLING ORDER when user click again on the same place (except for recruiting, because one can recruit several units on the same place)
	ClientOrders.CURRENT_ORDER_CAN_BE_CANCELED = ( (ClientOrders.LAST_CLICKED_PLACE==place) && ((this.currentOrder==null) || (this.currentOrder.type!=Act.RECRUIT ))  ) ;
	if (ClientOrders.CURRENT_ORDER_CAN_BE_CANCELED ) mode = ClientOrders.SELECT_UNIT;
	ClientOrders.LAST_CLICKED_PLACE=place;
	
	
	if (mode == ClientOrders.SELECT_PLACE)  {
		this.selectPlace( this.map.land.places[place.id] ); //transform place into place which is in the order map
	}
	
	//search nearest unit on the present map, because client see it
	if (mode == ClientOrders.SELECT_UNIT)  { 
	
		//no selection until now
		this.map.clear(this.ctxSelectedUnit);
		
		var nearestUnit=null;
		var dMin;
		if (place.units!=null) for (var i=0; i<place.units.length; i++) {
			var unit=place.units[i];
			var d=pos.distance(Unit.position(place.position, unit.type, place.units.length, i, place.indexOfWizard()).add(-20,0));
			if (nearestUnit==null) {dMin=d; nearestUnit=unit;}
			else if (d<dMin) {dMin=d; nearestUnit=unit;}
		}
		if (nearestUnit!=null) {
			//show selected unit
			nearestUnit.showSelected(this.ctxSelectedUnit);
			
			//transform unit into unit which is in the order map
			var movedUnit = this.map.people.unitFromId[nearestUnit.id];
			//if this unit exist in map for order, then select it
			if (movedUnit!=null) this.selectUnit( movedUnit );
		}
	}
}

/** init graphics : canvas context to be drawn**/
ClientOrders.prototype.initCanvas = function( ctxOrders, ctxOrdersStrength, ctxSelectedUnit, ctxPlacesToGo ) {
	this.ctxOrders = ctxOrders; 
	this.ctxOrdersStrength = ctxOrdersStrength;
	this.ctxSelectedUnit=ctxSelectedUnit; 
	this.ctxPlacesToGo=ctxPlacesToGo; 
}

//mask floating menus
ClientOrders.HideFloatingsMenus = function() {
	document.getElementById('menuFloating').style.visibility="hidden";
	document.getElementById('menuChooseWizard').style.visibility="hidden"; 
	document.getElementById('menuChooseSupport').style.visibility="hidden"; 
}

/** event on choosing a unit **/
ClientOrders.prototype.selectUnit = function( unit ) {

	ClientOrders.HideFloatingsMenus();
	
	this.map.clear(this.ctxPlacesToGo); 
	
	if (unit.owner==0) return; //no order on neutral units

	//has this unit got an order ? 
	var newOrder = this.map.getOrder(unit);
	if ( (newOrder == null) )  { //choose another optional order
	
		var typeOfOrder=Act.MOVEMENT; //default order
		
		//type of new order 
		if ( unit.type == Unit.WIZARD ) { //floating menu on wizard, several choices
		
			//when opening the floating menu, indicate the current number of spell known by the selected wizard :
			document.getElementById('MenuLearnedSpells').innerHTML=this.map.spells.count(unit.owner) + " " + InfoMessages["MenuLearnedSpells"] ;
			
			typeOfOrder=this.selectFloatingMenuTypeOrder(unit); 
			if (typeOfOrder==null) return; //type of order not yet choosen
		} 	

		newOrder = new Act(unit.owner,typeOfOrder); //default order
		
		if (typeOfOrder==Act.MOVEMENT) {
			newOrder.parameters.places = new Array(); //first movement
			newOrder.parameters.places.push(unit.place); //first place is where unit stands now
			newOrder.parameters.graphicPositions=new Array();
			newOrder.parameters.graphicPositions[0]=this.presentMap.people.unitFromId[unit.id].graphicPosition().add(-16,-16);
		}
		
		if (typeOfOrder==Act.RECRUIT) {
			newOrder.parameters.places = new Array(); //where recruits will be set
		}
		
		if (typeOfOrder==Act.SPELL_THROW) {
			newOrder.parameters.places = new Array(); //where spell will be thrown
			newOrder.parameters.startGraphicPosition=unit.graphicPosition().add(-16,-16);  //to draw arrow from spell launcher
		}
		
	}
	else if (this.currentOrder!=null) if (newOrder.parameters.unit == this.currentOrder.parameters.unit ) { // is the same unit that is selected two times : if so, cancel other order that can have been given concerning this unit
		this.cancelCurrentOrder();
		return;
	}
	 
	
	this.currentOrder = newOrder;
		
	this.currentOrder.parameters.unit=unit;

	this.currentOrder.displayOrder( this.ctxPlacesToGo, true); //override the current order to display it appart and well visible
	
	//if ( unit.type == Unit.WIZARD ) if (this.selectFloatingMenuTypeOrder(unit) == null) return; //case of previous existing order (and uncanceled) : if an existing recruit was set before, ask again for confirmation about the type
	
	if  (this.currentOrder.type==Act.MOVEMENT )  {
		unit.showPossiblePlacesToGo( this.ctxPlacesToGo, this.currentOrder, this.map );
	
		this.selectMode = ClientOrders.SELECT_PLACE; //a place has to be choosen now
	}
	
	if  (this.currentOrder.type==Act.RECRUIT )  {
		
		unit.showPossiblePlacesToRecruit( this.ctxPlacesToGo, this.currentOrder, this.map );
		this.selectMode = ClientOrders.SELECT_PLACE; //a place has to be choosen now
	}
	
	if  (this.currentOrder.type==Act.SPELL_THROW )  {
		unit.showPossiblePlacesToThrowSpell( this.ctxPlacesToGo, this.currentOrder, this.map );
		this.selectMode = ClientOrders.SELECT_PLACE; //a place has to be choosen now
	}
	
}

/** open menu and return null, or return the type of order already choosen **/
ClientOrders.prototype.selectFloatingMenuTypeOrder = function(unit) {
	var menuFloating=document.getElementById('menuFloating'); //menu for choosing type of order
	if (menuFloating.unitTarget!=unit) { //display menu if unit has changed
		menuFloating.style.visibility="visible";
		
		//position of menu : where the present wizard stands
		var presentUnit = this.presentMap.people.unitFromId[unit.id];
		if (presentUnit==null) presentUnit=unit;
		
		var posMenu = MenuFloatingPosition( presentUnit.place.position, new Point( menuFloating.clientWidth, menuFloating.clientHeight), new Point(0,0), this.map.land.size() )
		menuFloating.style.left=posMenu.x + 'px';
		menuFloating.style.top=posMenu.y + 'px';
		
		menuFloating.unitTarget=unit;
		menuFloating.clientOrderInput=this; //function to call when type of order will be set, see client.js
		return null;
	} {
		return menuFloating.typeOfOrder; //order choosen
	}
}

/** 
New reincarnation order for wizard. Separate function because can't be instanciated directly from a unit/place.
**/
ClientOrders.prototype.newReincarnationOrder = function(idWizard) {
	setTimeout(ClientOrders.HideFloatingsMenus, 300) ; //to see choosen wizard	
	//is wizard dead ?
	if (!this.presentMap.people.isDead(idWizard)) {
		alert(InfoMessages["NoReincarnationWizardAlive"]);
		return;
	}
	
	//existing reincarnation order ?
	var existingReincarnation=null;
	if (this.map.planning != null) {
		var tactic=this.map.planning.tacticOf(idWizard);
		if (tactic!=null) {
			tactic.doOrders(Act.REINCARNATION, function(order) { existingReincarnation=order; });
			if (existingReincarnation!=null) { //remove old reincarnation
				this.currentOrder=existingReincarnation;
				this.cancelCurrentOrder();
			}
		}
	}
	
	var typeOfOrder=Act.REINCARNATION;
	this.currentOrder = new Act(idWizard,typeOfOrder);
	
	Unit.showPossiblePlacesForReincarnation(this.ctxPlacesToGo, this.currentOrder, this.map );
	
	this.selectMode = ClientOrders.SELECT_PLACE; 
}

/** 
New Diplomatic order for wizard.
**/
ClientOrders.prototype.newDiplomaticOrder = function(idWizard1, idWizard2, typeOfSupport) {

	//existing diplomatic order on this wizard ?
	var existingOrder=null;
	if (this.map.planning != null) {
		var tactic=this.map.planning.tacticOf(idWizard1);
		if (tactic!=null) {
			tactic.doOrders(Act.DIPLOMATIC_SUPPORT, function(order) { if (order.parameters.idWizard2 == idWizard2) existingOrder=order; });
			if (existingOrder!=null) { //remove old diplomatic order
				this.currentOrder=existingOrder;
				this.cancelCurrentOrder();
			}
		}
	}
	
	var order = new Act(idWizard1,Act.DIPLOMATIC_SUPPORT);
	order.parameters.idWizard2=idWizard2;
	order.parameters.support = typeOfSupport;
	
	this.map.addOrder(order); 
	this.map.planning.orderRefresh(this.ctxOrders, this.ctxOrdersStrength, this.map); //refresh orders
		
}

/** event on choosing a place **/
ClientOrders.prototype.selectPlace = function( place ) {

	ClientOrders.HideFloatingsMenus();

	this.map.clear(this.ctxPlacesToGo); 
	//alert( place.id + " en coordonnée : " + place.position );
	if (this.currentOrder==null) return;
	
	if (this.currentOrder.type==Act.REINCARNATION) {
	
		this.currentOrder.parameters.place=place; 
		this.map.addOrder(this.currentOrder); 
		
		//end order
		this.selectMode = ClientOrders.SELECT_UNIT; //restart another order
		this.map.planning.orderRefresh(this.ctxOrders, this.ctxOrdersStrength, this.map); //refresh orders
		
		this.resetOrder(); //ready for another order
		return;
	}
	
	if (this.currentOrder.type==Act.MOVEMENT) {
		if (this.currentOrder.parameters.unit != null)  { //movement in progress...
		
			//add the place to the order
			var mayGoToPlace = this.currentOrder.movementAddPlace(place, this.map, true);
			if  (this.currentOrder.parameters.places.length==2) this.map.addOrder(this.currentOrder); //at least one movement : this order is a valid one and therefore can be added to the list of valid orders
			if  (this.currentOrder.parameters.places.length>2) this.map.updateOrder(this.currentOrder);
			
			if( mayGoToPlace != Act.MVT_OK ) { //no further place possible, end of movement !
				this.resetOrder();
				return;
			} 	
			
			//new step in order
			//redraw orders
			this.map.planning.orderRefresh(this.ctxOrders, this.ctxOrdersStrength, this.map);
			this.currentOrder.displayOrder( this.ctxPlacesToGo, true); //override the current order to display it appart and well visible
			
			//show possible places to go
			this.currentOrder.parameters.unit.showPossiblePlacesToGo( this.ctxPlacesToGo, this.currentOrder, this.map );
			
		} 	
		return;
	}
	
	if (this.currentOrder.type==Act.RECRUIT) {
		var unit = this.currentOrder.parameters.unit;
		
		//place to recruit ?
		if ( this.currentOrder.recruitSelectPlace(place, this.map, false) == false ) {
			//no recruit possible there, end of recruit
			ClientOrders.CURRENT_ORDER_CAN_BE_CANCELED=true;
			this.resetOrder();
			return; 
		}
		//enough money ?
		if ( this.map.incomes.futureStock(this.currentOrder.owner) <= Unit.costOfType( Unit.typeRecruitedOn(place.terrain) )  ) {
			//not enough money
			ClientOrders.CURRENT_ORDER_CAN_BE_CANCELED=true;
			this.resetOrder();
			return; 		
		}
		
		this.currentOrder.parameters.places.push(place); //add  place 
		

		if (this.currentOrder.parameters.places.length==1) this.map.addOrder(this.currentOrder); //first recruit
		else this.map.updateOrder(this.currentOrder); //other recruits
		
		this.map.planning.orderRefresh(this.ctxOrders, this.ctxOrdersStrength, this.map); //refresh orders
		
		unit.showPossiblePlacesToRecruit( this.ctxPlacesToGo, this.currentOrder, this.map );
		
			
		//max recruit reached ? End of order
		if (this.currentOrder.parameters.places.length>= Act.MAX_RECRUIT_PER_TURN ) {
			ClientOrders.CURRENT_ORDER_CAN_BE_CANCELED=true;
			this.resetOrder(); //ready for another order	
			
		}
	
		//show the money earned by wizard :
		this.map.incomes.updateIncomes(this.map);
		this.map.incomes.displayIncomesOf( this.ctxPlacesToGo, this.currentOrder.owner, place.position.add(0,30), this.map ); 
	
	
		return;
	}
	
	if (this.currentOrder.type==Act.SPELL_THROW) {
	
		this.currentOrder.parameters.places.push(place); 
		this.map.addOrder(this.currentOrder); //one place selected, ok 
		
		var order=this.currentOrder; //remember current order
		this.map.planning.orderRefresh(this.ctxOrders, this.ctxOrdersStrength, this.map); //refresh orders
		this.resetOrder(); //ready for another order
		
		//finish displaying info, use order because this.currentOrder has been erased by resetOrder :
		if (order.result==Act.OUT_OF_RANGE) {
			//alert( InfoMessages["AlertOutOfRange"] );
		}
		else {
			//show strength of magic attack
			if (order._magicUnit!=null) { //distant attack
				order._magicUnit.showStrengthOfUnit(this.ctxPlacesToGo, order, this.map);	
			} else { //wizard attack
				this.map.people.wizards[order.owner].showStrengthOfUnit(this.ctxPlacesToGo, order, this.map);
			}
		}

		
		return;
	}
	
}

ClientOrders.prototype.resetOrder = function() {
	
	//back to normal mode
	this.selectMode = ClientOrders.SELECT_UNIT; //restart another order
	this.map.clear(this.ctxSelectedUnit); //no more unit selected
	this.map.clear(this.ctxPlacesToGo); //no more place to go	
			
	//no more unit targeted with an optionnal floating menu
	menuFloating=document.getElementById('menuFloating'); //menu for choosing type of order
	menuFloating.unitTarget=null;
	
	//permitting CANCELLING ORDER
	if (!ClientOrders.CURRENT_ORDER_CAN_BE_CANCELED ) this.currentOrder=null; //no more current order
}

/** cancelling order require regenerating map and order to new object, throughout json cloning **/
ClientOrders.prototype.cancelCurrentOrder = function() {
	if (this.map.planning == null) return; //no orders to be deleted
	this.map.planning.removeOrder(this.currentOrder);
	this.currentOrder=null; //no more current order 
	
	var orders =  JSON.parse(JSON.stringify(this.map.planning)); //cloned and unlinked orders
	this.map=this.presentMap.clone(); //back to present map
	this.map.addOrdersTactic( Tactic.fromJSON (orders, this.map) ); //relinked orders
	
	this.resetOrder();
	this.map.clear(this.ctxOrders); this.map.clear(this.ctxOrdersStrength); //no more orders
	if (this.map.planning != null)  this.map.planning.orderRefresh(this.ctxOrders, this.ctxOrdersStrength, this.map);
}

/** cancelling all orders require regenerating map and order to new object, throughout json cloning **/
ClientOrders.prototype.cancelAllOrders = function() {

	if (this.map.planning == null) return; //no orders to be deleted
	this.currentOrder=null; //no more current order 
	this.map=this.presentMap.clone(); //back to present map
	
	this.map.clear(this.ctxSelectedUnit); //no more unit selected
	this.map.clear(this.ctxPlacesToGo); //no more place to go
	this.map.clear(this.ctxOrders); this.map.clear(this.ctxOrdersStrength); //no more orders

}

ClientOrders.prototype.showLearnedSpellOf = function(unit) {

	var spells = this.map.spells.spells[unit.owner];
	var placesWithSpells = this.map.spells.placesWithLearnedSpell(unit.owner, this.map.land);
	for( var i=0; i<placesWithSpells.length; i++) {
		placesWithSpells[i].position.add(0,-10).showEnlightedCircle(this.ctxPlacesToGo, Unit.ColorOf(unit.owner) , 25);
	}
	
	//alert( this.map.spells.spells[unit.owner].length + " sorts connus - et par learnedspells : " + placesWithSpells.length );
	//this.resetOrder();
}
