/**
* UI for editing the Map.
*/

var stage; //canvas for map
var layerLand; //to be saved as an simple image for client
var layerPeople;
var stageUnits; //canvas for units (to be save as an image)
var map;

var init = function () {


	map = new Map();

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
		
		layerLand = new Kinetic.Layer();
		//layerPeople = new Kinetic.Layer();
		map.draw(layerLand, layerPeople ); 
		stage.add(layerLand);
		//stage.add(layerPeople);    
		
		//units drawn without canvas :
		var canvas_units1 = Map.InsertCanvas(new Point(0,0),map.land.size(),document.getElementById('canvasMap'),"noClick").getContext("2d");
		var canvas_units2 = Map.InsertCanvas(new Point(0,0),map.land.size(),document.getElementById('canvasMap'),"noClick").getContext("2d");
		var canvas_units3 = Map.InsertCanvas(new Point(0,0),map.land.size(),document.getElementById('canvasMap'),"noClick").getContext("2d");
		map.people.draw(canvas_units1, canvas_units2, canvas_units3, map);
	
		
		stage.on('click', function(evt) {

			//alert( "c'est bien t'as cliqué ici : " + ( evt.clientX - document.getElementById('canvasMap').getBoundingClientRect().left ) );
			//alert( "c'est bien t'as cliqué ici : " + Point.mouseCoordinates( evt, document.getElementById('canvasMap') ) );
			
			
			var pos = Point.mouseCoordinates( evt, document.getElementById('canvasMap') )
			var place=map.land.nearestPlace( pos );
			alert( place.id );
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
