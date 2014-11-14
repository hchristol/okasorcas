/**
* UI for editing the Map.
*/

var stage; //canvas for map
var layerLand; //to be saved as an simple image for client
var stageUnits; //canvas for units (to be save as an image)
var map;

var CURRENT_EDIT_CONTROL = -1;

//change control to terrain
var adminEditControl = function( controlId ) { 
	selectControl(controlId);
	CURRENT_EDIT_CONTROL = controlId;
}
		
var selectControl = function ( idControl ) {
	for (var k=0; k<30; k++) {
		if ( document.getElementById('mapEditControl' + k) != null ) {
			document.getElementById('mapEditControl' + k).className = "menu" ;
		}
	}
	document.getElementById('mapEditControl' + idControl).className = "selectedMenu" ;
		
}

var init = function () {

	//argument that request a new map ?
	var newMap = document.URL.match(/newMap=([a-z]+)/);
	if ( (newMap!=null) && (newMap.length==2) && ( newMap[1]=="yes" ) ) {
		map = new Map(); //generate a new map
		initMap();
	}
	else //reload ancient map
		RequestJson("mapjson", function(json) {  //load map object
			map = new Map( JSON.parse(json) );
			initMap();
		});
}

var initMap = function () {

	//Canvas context where to display map
	document.getElementById('canvasMap').width=map.land.size().x;
	document.getElementById('canvasMap').height=map.land.size().y; 
	
	InitCachedImages( function() { //once all images had been loaded, draw the map
		
		//map display with kinetic js
		stage = new Kinetic.Stage({
			container: 'canvasMap',
			width: map.land.size().x,
			height: map.land.size().y
		});
		
		//redraw map
		redrawKineticMap = function() {
			var first_init = (layerLand == null);
			if (first_init) 
				layerLand = new Kinetic.Layer();
			else layerLand.clear();
			map.draw(layerLand ); 
			if (first_init) stage.add(layerLand); 
			else stage.draw();
		};
		redrawKineticMap(); //first drawing

		//units drawn without canvas :
		redrawUnitMap = function() { 
			map.clear(canvas_units1); map.clear(canvas_units2); map.clear(canvas_units3); 
			map.people.draw(canvas_units1, canvas_units2, canvas_units3, null, map); //redraw towers
		}
		
		
		
		var canvas_units1 = Map.InsertCanvas(new Point(0,0),map.land.size(),document.getElementById('canvasMap'),"noClick").getContext("2d");
		var canvas_units2 = Map.InsertCanvas(new Point(0,0),map.land.size(),document.getElementById('canvasMap'),"noClick").getContext("2d");
		var canvas_units3 = Map.InsertCanvas(new Point(0,0),map.land.size(),document.getElementById('canvasMap'),"noClick").getContext("2d");
		redrawUnitMap();
		
		//canvas for control
		var canvas_control = Map.InsertCanvas(new Point(0,0),map.land.size(),document.getElementById('canvasMap'),"noClick").getContext("2d");
	

		var place_with_tower = null; //tower that will be exchanged with another place
		var place_to_move = null; //place that we want to move
		stage.on('click', function(evt) {

			//alert( "c'est bien t'as cliqué ici : " + ( evt.clientX - document.getElementById('canvasMap').getBoundingClientRect().left ) );
			//alert( "c'est bien t'as cliqué ici : " + Point.mouseCoordinates( evt, document.getElementById('canvasMap') ) );
			
			
			var pos = Point.mouseCoordinates( evt, document.getElementById('canvasMap') )
			var place=map.land.nearestPlace( pos );
			
			if (place==null) return;
			
			//alert( place.id );
			
			//terrain control
			if ( (CURRENT_EDIT_CONTROL >= 0) && (CURRENT_EDIT_CONTROL < 20) ) { 
				place.terrain = CURRENT_EDIT_CONTROL;
				redrawKineticMap(); //refresh map
			}
			
			//tower exchange control
			if (CURRENT_EDIT_CONTROL == 20 ) { 
				
				map.clear(canvas_control); 
				
				if (place.tower != null) { //first place : choose de tower
					place_with_tower = place; //id tower that will be moved
					place_with_tower.position.showEnlightedCircle(canvas_control, "blue", 10 );
				} 
				else { //place that will receive tower
					if (place_with_tower==null) return; //no previous tower selected
					place.tower = place_with_tower.tower;
					place_with_tower.tower = null;
					place_with_tower = place; //ready for new exchange
					//refresh map
					redrawUnitMap();
					place_with_tower.position.showEnlightedCircle(canvas_control, "blue", 10 );
				}
				
			}			
			
			//coord moving control
			if (CURRENT_EDIT_CONTROL == 21 ) { 
				
				map.clear(canvas_control); 
				
				if (place_to_move == null) { //first place choosen
					place_to_move = place; //id tower that will be moved
					place_to_move.position.showEnlightedCircle(canvas_control, "red", 10 );
				} 
				else { //coord to move place on
				
					pos.showEnlightedCircle(canvas_control, "orange", 10 );
					
					if (place_to_move==null) return; //no previous tower selected
					place_to_move.position = pos;
					place_to_move = null; //ready for new exchange
					
					//rebuild graph
					map.land.graphInitByDistance();
					map.land.graphRemoveCrossingNeighbors();
					//rebuild spatial index
					map.land.spatialIndexInit(); 
					
					redrawKineticMap(); redrawUnitMap(); //refresh map
					map.clear(canvas_control); pos.showEnlightedCircle(canvas_control, "green", 10 );
				}
				
			}

			//place create
			if (CURRENT_EDIT_CONTROL == 22 ) { 
				
				map.clear(canvas_control); 
				pos.showEnlightedCircle(canvas_control, "orange", 10 );
				
				var pNew = new Place( pos, Place.PLAIN);
				idPlace=map.land.places.length;
				map.land.places[idPlace]= pNew; pNew.id=idPlace;//validate the new place
				
				//rebuild graph
				map.land.graphInitByDistance();
				map.land.graphRemoveCrossingNeighbors();
				//rebuild spatial index
				map.land.spatialIndexInit(); 
					
				redrawKineticMap(); redrawUnitMap(); //refresh map
				map.clear(canvas_control); pos.showEnlightedCircle(canvas_control, "green", 10 );					
			}	
			
			
			
		});
		
		/*
		//-----------------------
		//display units (to be saved as an image for client access without kinetic js)
		var s=48;
		stageUnits = new Kinetic.Stage({
			container: 'canvasUnits',
			width: People.WIZARD_COUNT*s,
			height: 4*s
			//,x:800, y:50
		});
		var layerUnits = new Kinetic.Layer();
		for (var i=0;i<People.WIZARD_COUNT;i++) {
			Unit.DrawArmy (layerUnits, new Point((i+1)*s, s ).add(-s/2,-s/4), 1, i );
			Unit.DrawBoat (layerUnits, new Point((i+1)*s, 2*s ).add(-s/2,-s/4), 1, i );
			Unit.DrawWizard (layerUnits, new Point((i+1)*s, 3*s ).add(-s/2,-s/4), 1, i );
			Unit.DrawEmptyPlace (layerUnits, new Point((i+1)*s, 4*s ).add(-s/2,-s/4), 1, i )
		}
		stageUnits.add(layerUnits);
		*/
		
	});
	
	//save map
	document.getElementById('saveMap').onclick = function(e) {

		var saveBoth=0;
		var gameId=document.getElementById('gameId').value;
		
		//force duration on special games :
		if (gameId=="test") map.turnDuration=-1;
		if (gameId=="partie2") map.turnDuration=1440000;

		//save json map
		str_json = JSON.stringify(map);
		RequestJson("mapwritejson", function(json) { saveBoth++; if (saveBoth==2) alert("Map saved !");  }, str_json);
		
		//save image map (land only)
		stage.clear(); stage.add(layerLand); //mask layer people
        stage.toDataURL({
          callback: function(dataUrl) {
			//create an object to be passed as a json in post query (required by nodejs / express / bodyparser)
			myData = new Object();
			myData.imageFile=dataUrl;
            //same way as json : it's only a data send  
			RequestJson("mapwriteimage", function(json) { saveBoth++; if (saveBoth==2) alert("Map saved !");  }, JSON.stringify( myData ) );
			//try direct form upload : does not work (2014-10): RequestImageUpload("mapwriteimage", function(json) { saveBoth++; if (saveBoth==2) alert("Map saved !");  }, myData.imageFile, 'multipart/form-data' );
          }
		  ,mimeType:"image/jpeg"
		  ,quality:0.85
		  ,width: map.land.size().x
		  ,height: map.land.size().y
        });
	
		//save units
		/*
        stageUnits.toDataURL({
          callback: function(dataUrl) {
            //same way as json : it's only a data send
			RequestJson("adminImageSave.php?name=images/units.png", function(json) { saveBoth++; if (saveBoth==3) alert("Carte sauvegardée !");    }, dataUrl );
          }
		  ,mimeType:"image/png"
		  ,quality:0.85
        });
		*/
		
		/*
		var request= new XMLHttpRequest();
		request.open("POST", "adminMapEditSave.php");
		request.setRequestHeader("Content-type", "application/json", true);
		request.send(str_json);
		*/
		
	};
	
}
