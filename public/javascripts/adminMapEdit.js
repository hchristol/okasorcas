/**
* UI for editing the Map.
*/

var stage; //canvas for map
var layerLand; //to be saved as an simple image for client
var stageUnits; //canvas for units (to be save as an image)
var map;

var canvas_units1;
var canvas_units2;
var canvas_units3;

//canvas for control
var canvas_control;


var place_with_tower = null; //tower that will be exchanged with another place
var place_to_move = null; //place that we want to move
		
var CURRENT_EDIT_CONTROL = -1;

lastTypeOfTerrainChoosen = Place.PLAIN; //default type for newly created place

//control button click
var adminEditControl = function( controlId ) { 
	selectControl(controlId);
	CURRENT_EDIT_CONTROL = controlId;
	
	//remember type of terrain choosen coz it's used in creating a new place
	if ( (CURRENT_EDIT_CONTROL >= 0) && (CURRENT_EDIT_CONTROL < 20) ) { 
		lastTypeOfTerrainChoosen=CURRENT_EDIT_CONTROL;
	}
			
	//validate and redraw
	if (CURRENT_EDIT_CONTROL == 30 ) { 
		map.clear(canvas_control);
		
		//rebuild graph
		map.land.graphInitByDistance();
		map.land.graphRemoveCrossingNeighbors();
		//rebuild spatial index
		map.land.spatialIndexInit(); 
		
		//refresh map
		redrawKineticMap(); redrawUnitMap(); 
	}
			
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
		
		
		
		canvas_units1 = Map.InsertCanvas(new Point(0,0),map.land.size(),document.getElementById('canvasMap'),"noClick").getContext("2d");
		canvas_units2 = Map.InsertCanvas(new Point(0,0),map.land.size(),document.getElementById('canvasMap'),"noClick").getContext("2d");
		canvas_units3 = Map.InsertCanvas(new Point(0,0),map.land.size(),document.getElementById('canvasMap'),"noClick").getContext("2d");
		redrawUnitMap();
		
		//canvas for control
		canvas_control = Map.InsertCanvas(new Point(0,0),map.land.size(),document.getElementById('canvasMap'),"noClick").getContext("2d");
	

		place_with_tower = null; //tower that will be exchanged with another place
		place_to_move = null; //place that we want to move
		
		pointsLabel=new Array(); //array of point for label on curve

		document.getElementById('canvasMap').onclick = function(evt) {

			//alert( "c'est bien t'as cliqué ici : " + ( evt.clientX - document.getElementById('canvasMap').getBoundingClientRect().left ) );
			//alert( "c'est bien t'as cliqué ici : " + Point.mouseCoordinates( evt, document.getElementById('canvasMap') ) );
			
			
			var pos = Point.mouseCoordinates( evt, null) ; //document.getElementById('canvasMap') 
			var place=map.land.nearestPlace( pos );
			
			if (place==null) return;
			
			//alert( place.id );
			
			//terrain control
			if ( (CURRENT_EDIT_CONTROL >= 0) && (CURRENT_EDIT_CONTROL < 20) ) { 
				Map.InsertImageInCanvas("images/terrain" + CURRENT_EDIT_CONTROL + ".png", place.position.add(-16,-16), canvas_control );
				place.terrain = CURRENT_EDIT_CONTROL;
				//redrawKineticMap(); //refresh map
			}
			
			//tower exchange control
			if (CURRENT_EDIT_CONTROL == 20 ) { 
				
				if (place.tower != null) { //first place : choose de tower
					place_with_tower = place; //id tower that will be moved
					place_with_tower.position.showEnlightedCircle(canvas_control, "red", 3 );
				} 
				else { //place that will receive tower
					if (place_with_tower==null) return; //no previous tower selected
					pos1=place_with_tower.position;
					pos2=place.position;
					canvas_control.strokeStyle = "red"; canvas_control.fillStyle = "red";	 canvas_control.lineWidth = 1;
					CanvasDrawArrow (canvas_control, pos1, pos2, 2, 1, 0.2, 10, 0.2);
					place.tower = place_with_tower.tower;
					place_with_tower.tower = null;
					place_with_tower = place; //ready for new exchange
					//refresh map
					//redrawUnitMap();
				}
				
			}			
			
			//coord moving control
			if (CURRENT_EDIT_CONTROL == 21 ) { 
				
				if (place_to_move == null) { //first place choosen
					place_to_move = place; //id tower that will be moved
					place_to_move.position.showEnlightedCircle(canvas_control, "green", 3 );
				} 
				else { //coord to move place on
					
					if (place_to_move==null) return; //no previous tower selected

					canvas_control.strokeStyle = "green"; canvas_control.fillStyle = "green";	 canvas_control.lineWidth = 1;
					CanvasDrawArrow (canvas_control, place_to_move.position, pos, 2, 1, 0.2, 10, 0.2);
					
					place_to_move.position = pos;
					place_to_move = null; //ready for new exchange
					
				}
				
			}

			//place create
			if (CURRENT_EDIT_CONTROL == 22 ) { 
				
				Map.InsertImageInCanvas("images/terrain" + lastTypeOfTerrainChoosen + ".png", pos.add(-16,-16), canvas_control );
				pos.showEnlightedCircle(canvas_control, "green", 30 );
				
				var pNew = new Place( pos, lastTypeOfTerrainChoosen);
				idPlace=map.land.places.length;
				map.land.places[idPlace]= pNew; pNew.id=idPlace;//validate the new place
								
			}	
			
			if (CURRENT_EDIT_CONTROL == 23 ) { 
				
				var myLabel = document.getElementById("labelText").value;
				if (myLabel == "") { alert("You have to enter a non empty label text"); return;}
				
				var onSea = 0;
				if (document.getElementById("labelOnSea").checked ) onSea =1;
				
				Map.InsertImageInCanvas("images/toolLabel.png", pos.add(-16,-16), canvas_control );
				
				//existing label ?
				for (var i=0; i<map.land.labels.length; i++) {
					var other = map.land.labels[i]; //other label
					if (other.length!=4) continue; //ignore curved labels
					if (other[0]==myLabel) { //move existing label to its new position
						other[1]=pos.x;
						other[2]=pos.y;
						other[3]=onSea;
						return;
					}
				}
				
				//new label
				map.land.labels.push([ myLabel, pos.x, pos.y, onSea ]);
								
			}	
			
			if (CURRENT_EDIT_CONTROL == 24 ) { 
				
				if (pointsLabel.length<2) {
					pointsLabel.push(pos);
					pos.showEnlightedCircle(canvas_control, "darkgray", 5 );
					return;
				}
				
				tmpPointsLabel=pointsLabel;
				pointsLabel = new Array(); //ready for another label
				
				var myLabel = document.getElementById("labelText").value;
				if (myLabel == "") { alert("You have to enter a non empty label text"); return;}
				
				var onSea = 0;
				if (document.getElementById("labelOnSea").checked ) onSea =1;
				
				Map.InsertImageInCanvas("images/toolLabel.png", pos.add(-16,-16), canvas_control );
				pos.showEnlightedCircle(canvas_control, "darkgray", 5 );
				
				//existing label ?
				for (var i=0; i<map.land.labels.length; i++) {
					var other = map.land.labels[i]; //other label
					if (other.length!=8) continue; //ignore non curved labels
					if (other[0]==myLabel) { //move existing label to its new position
						other[1]=tmpPointsLabel[0].x;
						other[2]=tmpPointsLabel[0].y;					
						other[3]=onSea;
						other[4]=tmpPointsLabel[1].x;
						other[5]=tmpPointsLabel[1].y;
						other[6]=pos.x;
						other[7]=pos.y;
						return;
					}
				}
				
				//new label
				map.land.labels.push([ myLabel, tmpPointsLabel[0].x, tmpPointsLabel[0].y, onSea, tmpPointsLabel[1].x, tmpPointsLabel[1].y, pos.x, pos.y ]);
								
			}
			
			
		};
		
		//mouse move event used for changing many terrain type
		document.getElementById('canvasMap').onmousemove = function(evt) {
			
			if (!evt.altKey) return; //no button pressed
			
			var pos = Point.mouseCoordinates( evt, null) ; //document.getElementById('canvasMap') 
			var place=map.land.nearestPlace( pos );
			
			if (place==null) return;
			
			//alert( place.id );
			
			//terrain control
			if ( (CURRENT_EDIT_CONTROL >= 0) && (CURRENT_EDIT_CONTROL < 20) ) { 
				Map.InsertImageInCanvas("images/terrain" + CURRENT_EDIT_CONTROL + ".png", place.position.add(-16,-16), canvas_control );
				place.terrain = CURRENT_EDIT_CONTROL;
				//redrawKineticMap(); //refresh map
			}	
			
		};
		
		
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
