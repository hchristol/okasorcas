/**
* UI for clients
*/

//prévoir le chargement de la précédente carte en paramètre et ça devrait rouler

var menuParent;
var mapContainer;

var INPUT_ORDER; //input order control

var CURRENT_WIZARD;
//alert(document.location);
var CURRENT_MAP;
var CURRENT_ORDERS;

var TURN_REPLAY=0; //0 for now, and 1 or more if previous map is displayed (not exactly turnNumber of Map, be careful) 
var SIMULATE_VIEW=0; //simulated orders : 1 for only movements, 2 for movements+fightings, 0 for normal view
var LAND_IMAGE_ELEMENT; //image element of land map, stored to avoid reloading when replay
var REPLAY_CACHE=new Array(); //array of object of loaded objects (map.json and orders). To avoid reloading when replay. Indexes : TURN_REPLAY, and object.map and object.orders

var CANVAS_TUTORIAL; //extra info tuto
var TIMER_TUTORIAL; //timer for tutorial sequence
var MENU_TUTORIAL={}; //menu functions lists

var init = function () {

	//if( isMobile.any() ) alert('Mobile :-))'); else alert('Pas mobile :-(');
	
	CURRENT_WIZARD= 1; //wizard for tutorial

	loadMap();
	
	
	//menu display for mobile device :
	menuParent=document.getElementById('menuParent');
	
	if( true ) {  //set UI for desktop client
		document.getElementById('menuOpen').style.visibility='hidden';
		document.getElementById('menuParent').style.visibility='visible'; 
		document.getElementById('menuParent').style.position='absolute';  
		//document.getElementById('menuParent').style.boxShadow='none';
		document.getElementById('menuParent').style.left= 1000 + 'px'; //map.land.width
		document.getElementById('menuParent').style.top='0px';
	};

	
	//Menu actions
	var item; var img;
	
	//add the image of player's units
	var owner=CURRENT_WIZARD; 

	
	item = AddMenuItem(menuParent, InfoMessages["MenuReincarnation"] , "menu", function() { 
		MenuSelectItem(this, "menu", "selectedMenu");
		var posMenu = MenuFloatingPosition( 
			new Point(993,15), 
			new Point( menuChooseWizard.clientWidth, menuChooseWizard.clientHeight), 
			new Point(0,0), CURRENT_MAP.land.size() )
		menuChooseWizard.style.left=posMenu.x + 'px';
		menuChooseWizard.style.top=posMenu.y + 'px';
		menuChooseWizard.style.visibility="visible";
	} );
	
	//DIPLOMACY
	item = AddMenuItem(menuParent, InfoMessages["MenuDiplo"] , "menu", function() { 
		MenuSelectItem(this,"menu", "selectedMenu"); 
		if (INPUT_ORDER.map!=null) {
			var menuChooseSupport=document.getElementById('menuChooseSupport');
			if (menuChooseSupport.style.visibility=="visible") { menuChooseSupport.style.visibility="hidden"; }
			else {
				menuChooseSupport.innerHTML=""; //clear old data
				displayDiplomaticSupport(INPUT_ORDER.map.diplomacy, menuChooseSupport );
				menuChooseSupport.style.visibility="visible";
				
				//menuChooseSupport.onclick=function() { menuChooseSupport.style.visibility="hidden"; }  //exit
			}
		}
		
	} );
	
	item = AddMenuItem(menuParent, InfoMessages["MenuRevenue"] , "menu", function() { 
		MenuSelectItem(this, "menu", "selectedMenu"); 
		if (CURRENT_MAP!=null) {
			var htmlViewIncomes=document.getElementById('viewIncomes');
			if (htmlViewIncomes.style.visibility=="visible") { htmlViewIncomes.style.visibility="hidden"; }
			else {
				htmlViewIncomes.innerHTML=""; //clear old data
				CURRENT_MAP.incomes.updateIncomes(CURRENT_MAP); //ensure that incomes are consistent
				displayIncomes(CURRENT_MAP.incomes, htmlViewIncomes );
				htmlViewIncomes.style.visibility="visible";
				
				htmlViewIncomes.onclick=function() { htmlViewIncomes.style.visibility="hidden"; }  //exit
			}
		}
	} );
	
	itemValidate = AddMenuItem(menuParent, "<b>" + InfoMessages["MenuValidateOrders"] + "</b>" , "menu", function() {
		MenuSelectItem(this,"menu", "selectedMenu");
		nextMessage(InfoMessages["InfoOrdersValidated"]  );  //tutorial response
		return; 
		
		//save json orders
		var myTactic = INPUT_ORDER.map.planning.tacticOf(CURRENT_WIZARD);
		if (myTactic!=null) {
			str_json = JSON.stringify(myTactic);
			RequestJson("orders/" + owner, function(json) { 
				alert(InfoMessages["InfoOrdersValidated"]  );  
				itemValidate.innerHTML = InfoMessages["MenuValidateOrders"]; //unbold text when orders has been sent
			}, str_json); 
		} else alert(InfoMessages["InfoOrdersEmpty"]); 
	} );


	
	//simulate orders
	//after resolution
	var itemSimulate = AddMenuItem(menuParent, InfoMessages["MenuNextTurn"] , "menu", function() { 
		MenuSelectItem(this,"menu", "selectedMenu"); 
	
		//see attacks 
		if (SIMULATE_VIEW==0) {  
			SIMULATE_VIEW=0; //required for reloading orders
			saveMapInCache();
			SIMULATE_VIEW=2;	
			itemSimulate.innerHTML=InfoMessages["MenuNextTurnCancel"];	
			loadMap();	
			return;
		}

		//no more simulation available : back to actual map
		if (SIMULATE_VIEW==2) {
			SIMULATE_VIEW=0;
			itemSimulate.innerHTML=InfoMessages["MenuNextTurn"];
			loadMap();	
			return;			
		}
	
	} );
	
	var itemCancelOrder = AddMenuItem(menuParent, InfoMessages["MenuCancelOrders"] , "menu", function() {
		MenuSelectItem(this,"menu", "selectedMenu");
		
		//save json orders
		var myTactic = INPUT_ORDER.cancelAllOrders();
	} );
	
	//previous map and orders
	var itemHistory = AddMenuItem(menuParent, InfoMessages["MenuReplay"] , "menu", function() { 
		MenuSelectItem(this,"menu", "selectedMenu"); 
		
		if (SIMULATE_VIEW!=0) {  //quit simulated view before changing turn
			SIMULATE_VIEW=0; 
			loadMap(false); SIMULATE_VIEW=0; 
			itemSimulate.innerHTML=InfoMessages["MenuNextTurnBeforeAttack"]; 
		} 
		
		if (TURN_REPLAY==0) { //swich to previous map
			saveMapInCache();
			TURN_REPLAY=1;	
			itemHistory.innerHTML=InfoMessages["MenuReplayCancel"];		
			loadMap();
			
		} else { if (TURN_REPLAY==1) {
				saveMapInCache();
				TURN_REPLAY=0; 
				itemHistory.innerHTML=InfoMessages["MenuReplay"];
				loadMap();
		} }
		
	} );
	
	//display rules for all existing terrains
	var itemMenuTerrainArray = AddMenuItem(menuParent, InfoMessages["MenuTerainArray"] , "menu", function() { 
		MenuSelectItem(itemMenuTerrainArray,"menu", "selectedMenu"); 
		
		if (document.getElementById('viewTerrainRules').style.visibility=="visible") document.getElementById('viewTerrainRules').style.visibility="hidden";
		else {
			 if ( !document.getElementById('viewTerrainRules').hasChildNodes()) displayTerrainsTable( document.getElementById('viewTerrainRules') ); //first init
			document.getElementById('viewTerrainRules').style.visibility="visible";
			
			document.getElementById('viewTerrainRules').onclick=function() { document.getElementById('viewTerrainRules').style.visibility="hidden"; }  //exit
		}
		
	} );	
	
	//display strengths option
	var itemStrengthDisplay = AddMenuItem(menuParent, InfoMessages["MenuStrengthDisplayNo"] , "menu", function() { 
		MenuSelectItem(itemStrengthDisplay,"menu", "selectedMenu"); 
		if ( ClientOrders.DISPLAY_STRENGTH ) {
			ClientOrders.DISPLAY_STRENGTH=false;
			itemStrengthDisplay.innerHTML=InfoMessages["MenuStrengthDisplayYes"];
		} else {
			ClientOrders.DISPLAY_STRENGTH=true;
			itemStrengthDisplay.innerHTML=InfoMessages["MenuStrengthDisplayNo"];		
		}
		if ( INPUT_ORDER != null ) INPUT_ORDER.map.planning.orderRefresh(INPUT_ORDER.ctxOrders, INPUT_ORDER.ctxOrdersStrength, INPUT_ORDER.map);
				
	} );
	
	
	//floating menu orders -----------------------	
	var menuFloating=document.getElementById('menuFloating');
	var itemMovement = AddMenuItem(menuFloating, InfoMessages["MenuMovement"] , "menu", function() { 
		MenuSelectItem(this,"menu", "selectedMenu"); 
		menuFloating.typeOfOrder=Act.MOVEMENT;
		if (menuFloating.unitTarget!=null) menuFloating.clientOrderInput.selectUnit(menuFloating.unitTarget);  
		menuFloating.unitTarget=null; menuFloating.style.visibility="hidden";
	} );
	var itemRecruit = AddMenuItem(menuFloating, InfoMessages["MenuRecruit"] , "menu", function() { 
		MenuSelectItem(this,"menu", "selectedMenu"); 
		menuFloating.typeOfOrder=Act.RECRUIT;
		if (menuFloating.unitTarget!=null) menuFloating.clientOrderInput.selectUnit(menuFloating.unitTarget);
		menuFloating.unitTarget=null; menuFloating.style.visibility="hidden";
	} );
	/* deprecated
	item = AddMenuItem(menuFloating, InfoMessages["MenuSpellLearn"] , "menu", function() { 
		MenuSelectItem(this,"menu", "selectedMenu"); 
		menuFloating.typeOfOrder=Act.SPELL_LEARN;
		if (menuFloating.unitTarget!=null) menuFloating.clientOrderInput.selectUnit(menuFloating.unitTarget);
		menuFloating.unitTarget=null; menuFloating.style.visibility="hidden";
	} );
	*/
	itemSpellThrow = AddMenuItem(menuFloating, InfoMessages["MenuSpellThrow"] , "menu", function() { 
		MenuSelectItem(this,"menu", "selectedMenu"); 
		menuFloating.typeOfOrder=Act.SPELL_THROW;
		if (menuFloating.unitTarget!=null) menuFloating.clientOrderInput.selectUnit(menuFloating.unitTarget);
		menuFloating.unitTarget=null; menuFloating.style.visibility="hidden";
	} );
	item = AddMenuItem(menuFloating, InfoMessages["MenuLearnedSpells"]  , "menu", function() { 
		MenuSelectItem(this,"menu", "selectedMenu"); 
		if (menuFloating.unitTarget!=null) menuFloating.clientOrderInput.showLearnedSpellOf(menuFloating.unitTarget);  		
		menuFloating.style.visibility="hidden";
	} );
	item.id="MenuLearnedSpells"; //id for menu, to show later the number of learned spells

	
	//floating menu to choose a wizard
	var menuChooseWizard = document.getElementById('menuChooseWizard');
	var item;
	for (var i=1; i<People.WIZARD_COUNT; i++ ) {
		var item = AddMenuItem(menuChooseWizard, People.WizardName[i] , "menu", function() { 
			MenuSelectItem(this,"menu", "selectedMenu"); 
			menuChooseWizard.wizardId=this.wizardId; 
			if (INPUT_ORDER!=null) INPUT_ORDER.newReincarnationOrder(this.wizardId);
			//menuChooseWizard.style.visibility="hidden";
			//alert("Unit type selected : "  + menuChooseWizard.typeOfUnit);
		} );
		item.wizardId=i;
		Map.InsertImage("./images/color" + i + ".png", null, item)
	}	
	
	//redim events
	window.onresize = function(event) {
		
		//to ensure menu is not too far below map (wide screen)
		/*
		h=map.land.height + 25; //max height
		if ( window.innerHeight > h ) menuParent.style.bottom= (window.innerHeight - h) + "px";
		*/
	}
	window.onresize();

}


//load current map. redrawMap : false to disable drawing (default : true)
var loadMap = function(redrawMap) {

	//simulated map
	if (SIMULATE_VIEW==1) {
		if (INPUT_ORDER==null) return;
		var map=INPUT_ORDER.map;
		//before battle : don't solve battle map.terminateOrders();
		
		//show map
		initMap(map,null,redrawMap);
		
		return;
	}
	if (SIMULATE_VIEW==2) {
		if (INPUT_ORDER==null) return;
		var map=INPUT_ORDER.map;
		map.terminateOrders(false);
		
		//show map
		initMap(map,null,redrawMap);
		
		return;
	}
	
	//cached map ?
	if (REPLAY_CACHE[TURN_REPLAY] != null) {
		var map=new Map( JSON.parse(REPLAY_CACHE[TURN_REPLAY].map) );
		var orders = null;
		if (REPLAY_CACHE[TURN_REPLAY].orders != null) orders=Tactic.fromJSON(JSON.parse(REPLAY_CACHE[TURN_REPLAY].orders), map );
		initMap( map , orders,redrawMap );
	} 
	else 
	{ //first loading of map
		document.getElementById("fadingTutorial").className = "fade-out";
		var request="tutorial/map" + TUTO_MAP_COUNT + ".json";
		if (TURN_REPLAY>0) request+="?previous=" + TURN_REPLAY; //optional historic map
		RequestJson(request, function(json) {  //load map object
		
			//Tutorial : next map on click
			//document.getElementById("fadingTutorial").onclick=function() { if (TUTO_MAP_COUNT < TUTO_MAX_MAP_COUNT) TIMER_COUNT = NEXT_MAP_FORCED; };
		
			var map = new Map( JSON.parse(json) );
			
			if (TURN_REPLAY>0) { //previous orders are stored in map
				if (map.history!=null) map.history.fightings=null; //don't display old fighting on previous map
				initMap(map,map.history.orders,redrawMap);
				return;
			}
			
			
			initMap(map,null,redrawMap);
			
			//request for possible current order of wizard
			/*
			var requestOrder = "orders/" + CURRENT_WIZARD;
			RequestJson(requestOrder, function(jsonOrders) {  //load orders object

				var orders= Tactic.fromJSON(JSON.parse(jsonOrders),map);
				if (orders.turnNumber == map.turnNumber ) {
					//convert json order parameters to objects parameters
					initMap(map,orders);
				} else { //unrelated orders
					initMap(map,null,redrawMap);
				}
				
			});
			*/
			
		} );
	}
	

	
}
//draw and enable event on new loaded map. redrawMap : false to disable drawing (default : true)
var initMap = function(map, orders, redrawMap) {
	CURRENT_MAP = map;
	CURRENT_ORDERS=null;
	if (orders!=null) if (orders.turnNumber == CURRENT_MAP.turnNumber ) CURRENT_ORDERS = orders; //reload existing order related to this map
	
	mapContainer=document.getElementById('map');
	mapContainer.textContent =""; //delete old canvas and image objects
	
	//load the image of land
	if (LAND_IMAGE_ELEMENT==null) //first reading of land image
		LAND_IMAGE_ELEMENT = Map.InsertImage('tutorial/map.jpg',new Point(0,0));
	else document.getElementById('map').appendChild(LAND_IMAGE_ELEMENT.cloneNode(true)); //reload clone of image element, to ensure that no image will be reloaded throught network
	
	//layers for drawing
	
	//canvas layer for drawing units and other
	var canvas_tower = Map.InsertCanvas(new Point(0,0),map.land.size(),null,"noClick").getContext("2d");
//canvas_tower.debugname="TOWER";
	var canvas_unitsFlag = Map.InsertCanvas(new Point(0,0),map.land.size(),null,"noClick").getContext("2d");
//canvas_unitsFlag.debugname="FLAG";	
	var canvas_units = Map.InsertCanvas(new Point(0,0),map.land.size(),null,"noClick").getContext("2d");
//canvas_units.debugname="UNITS";	
	
	//canvas layer for drawing orders, refresh at each order seized
	var canvas_order = Map.InsertCanvas(new Point(0,0),map.land.size(),null,"noClick").getContext("2d");
	var canvas_orderStrength = Map.InsertCanvas(new Point(0,0),map.land.size(),null,"noClick").getContext("2d");
	
	//canvas layer for drawing selected unit, refreshed at each unit choosen
	var canvas_selected_unit = Map.InsertCanvas(new Point(0,0),map.land.size(),null,"noClick").getContext("2d");

	//canvas layer for drawing point to click, refreshed at each possible place to go
	var canvas_places_to_go = Map.InsertCanvas(new Point(0,0),map.land.size(),null,"noClick").getContext("2d");
	
	//draw units on map, and link them to order input
	if (redrawMap!=false) map.people.draw( canvas_tower, canvas_unitsFlag, canvas_units, canvas_places_to_go, map); //, function(ev) {  Act.UnitClick( this.mapUnit ); } );
	
	//order input
	INPUT_ORDER=new ClientOrders(map, CURRENT_WIZARD);
	
	/*
	INPUT_ORDER.initClick(mapContainer, function(coordinate) { //to be done before an event click is raised
		//hide all panel once clicked on map
		if( isMobile.any() ) {
			menuParent.style.visibility="hidden";
			document.getElementById('menuOpenClose').innerHTML="+";
		}
		document.getElementById('viewIncomes').style.visibility="hidden";
		document.getElementById('viewTerrainRules').style.visibility="hidden";
		document.getElementById('menuChooseSupport').style.visibility="hidden";
	} );
	*/
	
	INPUT_ORDER.initCanvas(canvas_order, canvas_orderStrength, canvas_selected_unit, canvas_places_to_go);
	if (CURRENT_ORDERS != null) { //show pre existing orders
		INPUT_ORDER.map.addOrdersTactic( Tactic.fromJSON(JSON.parse(JSON.stringify(CURRENT_ORDERS)), INPUT_ORDER.map ) ); //clone orders to apply them on the right map
		if (INPUT_ORDER.map.planning!=null) if (redrawMap!=false) INPUT_ORDER.map.planning.orderRefresh(INPUT_ORDER.ctxOrders, INPUT_ORDER.ctxOrdersStrength, INPUT_ORDER.map);
	}
	
	//tutorial info
	CANVAS_TUTORIAL = Map.InsertCanvas(new Point(0,0),map.land.size().add(400,100), document.getElementById('canvasTutorial'), "noClick").getContext("2d");
	if (TIMER_TUTORIAL==null) {
		TIMER_TUTORIAL = setInterval( tutorialNextTimer, TIMER_BASE_DURATION_MS);
	}

}

//save current map in cache
var saveMapInCache = function() {
	
	if (SIMULATE_VIEW!=0) return; //never save map and order from a simulated view
	
	if (CURRENT_MAP != null) {
		REPLAY_CACHE[TURN_REPLAY]=new Object();
		REPLAY_CACHE[TURN_REPLAY].map=JSON.stringify(CURRENT_MAP);
		//save current order to json format, so then order can be added to map later (see addOrdersTactic)
		if (INPUT_ORDER.map.planning!=null ) REPLAY_CACHE[TURN_REPLAY].orders=JSON.stringify(INPUT_ORDER.map.planning); 
	}
	
}

