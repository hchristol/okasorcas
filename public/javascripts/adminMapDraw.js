/**
kineticjs is used by admin to generate the map.
add methods to objets to draw them with kinetic js
Units are also rendered with Kinetic js (for historical reasons ; it would be better if units were rendered with the same method than client, but not time for it).
It doesn't matter anyway. Keep in mind the way we render unit in admin map :
- we create each unit once as kinetic shape
- we make a cached image of it (historical performance issue)
- we draw units as kineticjs image, using these cached images
Furthermore, we draw each cached units on a separated kinetic canvas (the one which is on the right side of map in admin mode). Then, we save the entire image of these units to deliver it for client rendering (see clientMapDraw.js).
**/


/**
* Draw the map
* @function
* @returns 
*/
Map.prototype.draw = function(layerLand){

	//Fill the background Map
	layerLand.add( new Kinetic.Rect({
		x: 0,
		y: 0,
		width: this.land.width,
		height: this.land.height,
		fill: Palette.seaDark
	  }));
	
	this.land.draw(layerLand);
	
	//test animation
	/*
	var unitTest = this.people.units[20];
	var anim = new Kinetic.Animation(function(frame) {
		unitTest.kineticImg.setX(200 * Math.sin(frame.time * 2 * Math.PI / 2000) + unitTest.place.position.x);
		if ( frame.time > 2000 ) { 
			anim.stop(); 
			unitTest.kineticImg.destroy(); 
		}
	}, layerPeople);
	anim.start();		
	*/
	
	//border embellishment
	layerLand.add( new Kinetic.Rect({
		x: 3,
		y: 3,
		width: this.land.size().x -6,
		height: this.land.size().y -6,
		stroke: Palette.mapBorder,
		strokeWidth: 6
	  }));		

	var myImage; var i;
	for (i=-10;i<this.land.height;i+=10) {
		myImage=new Kinetic.Image({image: CACHED_IMAGES["BorderMotif"], x: -10, y: i,  scale:1}) ;
		layerLand.add( myImage );
		myImage=new Kinetic.Image({image: CACHED_IMAGES["BorderMotif"], x: this.land.width-20, y: i,  scale:1}) ;
		layerLand.add( myImage );
	}
	for (i=-10;i<this.land.width;i+=10) {
		myImage=new Kinetic.Image({image: CACHED_IMAGES["BorderMotif"], x: i, y: -12,  scale:1}) ;
		layerLand.add( myImage );
		myImage=new Kinetic.Image({image: CACHED_IMAGES["BorderMotif"], x: i, y: this.land.height-25,  scale:1}) ;
		layerLand.add( myImage );
	}
};

/**
* Draw the Land in the given div
* @function
* @param  layer - KineticJS layer
* @returns 
*/
Land.prototype.draw = function(layer){
	
	//ctx.lineJoin='round';	
	
	var i;
		
	/* waves effect : desactivated for better performances
	//draw ground background (border), water waves effect
	for(i=0; i<this.places.length;i++) { if (this.places[i].terrain!=Place.SEA) {
		layer.add( new Kinetic.Polygon({
			points:this.places[i].boundaryPathCoord(),
			stroke:Palette.seaThinBorder,
			strokeWidth:20,
			lineJoin:'round'
		}));
	}}
	
	for(i=0; i<this.places.length;i++) { if (this.places[i].terrain!=Place.SEA) {
		layer.add( new Kinetic.Polygon({
			points:this.places[i].boundaryPathCoord(),
			stroke:Palette.seaWideBorder,
			strokeWidth:19,
			lineJoin:'round'
		}));
	}}
	for(i=0; i<this.places.length;i++) { if (this.places[i].terrain!=Place.SEA) {
		layer.add( new Kinetic.Polygon({
			points:this.places[i].boundaryPathCoord(),
			stroke:Palette.seaThinBorder,
			strokeWidth:14,
			lineJoin:'round'
		}));
	}}
	for(i=0; i<this.places.length;i++) { if (this.places[i].terrain!=Place.SEA) {
		layer.add( new Kinetic.Polygon({
			points:this.places[i].boundaryPathCoord(),
			stroke:Palette.seaWideBorder,
			strokeWidth:13,
			lineJoin:'round'
		}));
	}}
	for(i=0; i<this.places.length;i++) { if (this.places[i].terrain!=Place.SEA) {
		layer.add( new Kinetic.Polygon({
			points:this.places[i].boundaryPathCoord(),
			stroke:Palette.seaThinBorder,
			strokeWidth:8,
			lineJoin:'round'
		}));
	}}
	for(i=0; i<this.places.length;i++) { if (this.places[i].terrain!=Place.SEA) {
		layer.add( new Kinetic.Polygon({
			points:this.places[i].boundaryPathCoord(),
			stroke:Palette.seaWideBorder,
			strokeWidth:7,
			lineJoin:'round'
		}));
	}}
	*/
	
	/*
	for(i=0; i<this.places.length;i++) { if (this.places[i].terrain!=Place.SEA) {
		layer.add( new Kinetic.Polygon({
			points:this.places[i].boundaryPathCoord(),
			stroke:Palette.seaWideBorder,
			strokeWidth:15,
			lineJoin:'round'
		}));
	}}
	*/
	
	//draw sea background 
	for(i=0; i<this.places.length;i++) { if (this.places[i].terrain==Place.SEA) {
		layer.add( new Kinetic.Polygon({
			points:this.places[i].boundaryPathCoord(),
			//fill:Palette.ground,
					fillRadialGradientStartPoint: [ this.places[i].position.x, this.places[i].position.y  ] ,
					fillRadialGradientStartRadius: 0,
					fillRadialGradientEndPoint: [ ( this.places[i].position.x  ), (this.places[i].position.y ) ], //this.places[i].position.add(Place.SIZE/4,Place.SIZE/4),
					fillRadialGradientEndRadius:  Place.SIZE  ,
					//fillRadialGradientColorStops: [0, 'white', 1, 'black'],
					fillRadialGradientColorStops: [0, Palette.sea, .85, Palette.seaDark ],
			//fillPatternImage: CACHED_IMAGES["GroundFill"],
			lineJoin:'round'
		}));
	}}
	
	//draw ground background (border)
	for(i=0; i<this.places.length;i++) { if (this.places[i].terrain!=Place.SEA) {
		layer.add( new Kinetic.Polygon({
			points:this.places[i].boundaryPathCoord(),
			stroke:Palette.groundBorder,
			strokeWidth:2,
			lineJoin:'round'
		}));
	}}

	//draw ground background (fill)
	for(i=0; i<this.places.length;i++) { if (this.places[i].terrain!=Place.SEA) {
	
		layer.add( new Kinetic.Polygon({
			points:this.places[i].boundaryPathCoord(),
			//fill:Palette.ground,
					fillRadialGradientStartPoint: [ this.places[i].position.x, this.places[i].position.y  ] ,
					fillRadialGradientStartRadius: Place.SIZE/5,
					fillRadialGradientEndPoint: [ ( this.places[i].position.x  ), (this.places[i].position.y ) ], //this.places[i].position.add(Place.SIZE/4,Place.SIZE/4),
					fillRadialGradientEndRadius:  Place.SIZE  ,
					//fillRadialGradientColorStops: [0, 'white', 1, 'black'],
					fillRadialGradientColorStops: [0, Palette.ground, 1, Palette.groundDark],
			//fillPatternImage: CACHED_IMAGES["GroundFill"],
			lineJoin:'round'
		}));
	}}
	

	//draw each place
	for(i=0; i<this.places.length;i++) {
		this.places[i].drawTerrain(layer, this.resolution);
	}
	
	this.drawGraph(layer);
	
};

/**
* draw the graph on map
**/
Land.prototype.drawGraph = function(layer) {
	
	for(var i=0; i<this.places.length;i++) {
			
		//draw a line to show graph connections :
		for (var countNeighbor=0; countNeighbor<this.neighbors[i].length; countNeighbor++)  {
			
			if (this.neighbors[i][countNeighbor]>i) continue; //avoid redrawing of one same path
		
			//Point.pathTo( ctx, [this.places[i].position, (this.places[ this.neighbors[i][countNeighbor] ]).position ], false, this.resolution );
			


			//distincts styles for sea and ground
			if ( (this.places[i].terrain == Place.SEA) || (this.places[ this.neighbors[i][countNeighbor] ].terrain == Place.SEA) ) { 
				
				layer.add( 
					new Kinetic.Line({
							points: [this.places[i].position.x,this.places[i].position.y,   (this.places[ this.neighbors[i][countNeighbor] ]).position.x, (this.places[ this.neighbors[i][countNeighbor] ]).position.y  ],
							stroke: Palette.pathSea,
							strokeWidth: 1,
							dashArray: [3,3]
						  })
				);
			} else { 
				layer.add( 
					new Kinetic.Line({
							points: [this.places[i].position.x,this.places[i].position.y,   (this.places[ this.neighbors[i][countNeighbor] ]).position.x, (this.places[ this.neighbors[i][countNeighbor] ]).position.y  ],
							stroke: Palette.pathGround,
							strokeWidth: 1,
							dashArray: [3,3]
						  })
				);	  
					//ctx.strokeStyle = Palette.pathGround;  ctx.stroke(); 
			}
		}	
	}
	
	/*
	//remove dotted line for next drawings
	if ( ctx.setLineDash !== undefined ) {  ctx.setLineDash(null);  } //chrome
	if ( ctx.mozDash !== undefined )     {  ctx.mozDash =null; } //mozilla
	*/
};	

	
	
	
	
/**
* @property image of the flag
*/
Place.prototype.flagKineticImg;
	
/**
* Draw the place in the given div
* @function
* @param  {Object} layer - KinectJS layer
* @returns 
*/
Place.prototype.drawTerrain = function(layer){	

	//plain and see : no more image
	if (this.terrain == Place.PLAIN ) return;
	if (this.terrain == Place.SEA ) return;
	
	if (this.terrain == Place.MOUNTAIN ) {			
		var u=Place.SIZE/3;
		
		for( var i=0; i<this.boundaryNumberOfPoints(); i+=9) {
			Place.DrawTerrain[Place.MOUNTAIN](layer,Point.interpolate(this.position, this.boundaryPoint(i),0.3).add(0,-u), 0.7 );
		}
		for( var i=0; i<this.boundaryNumberOfPoints(); i+=11) {  Place.DrawTerrain[this.terrain](layer,Point.interpolate(this.position, this.boundaryPoint(i),0.6).add(0,-u), 1 );	  } 
		Place.DrawTerrain[this.terrain](layer,this.position.add(new Point(0,-u)), 1 );	
		return;
	}
	
	if (this.terrain == Place.HILL ) {			
		var u=Place.SIZE/3;
		for( var i=0; i<this.boundaryNumberOfPoints(); i+=7) {  Place.DrawTerrain[this.terrain](layer,Point.interpolate(this.position, this.boundaryPoint(i),0.5).add(0,-u), 1 );	  }
		Place.DrawTerrain[this.terrain](layer,this.position.add(new Point(0,-u)), 1 );	
		return;
	}
	
	if (this.terrain == Place.FOREST ) {			
		var u=Place.SIZE/8;
		for( var i=0; i<this.boundaryNumberOfPoints(); i+=2) {
			Place.DrawTerrain[Place.FOREST](layer,Point.interpolate(this.position, this.boundaryPoint(i),0.35), .8);
		}
		
		Place.DrawTerrain[Place.FOREST](layer,this.position.add(new Point(-u,-1.5*u)), 1 );
		Place.DrawTerrain[Place.FOREST](layer,this.position.add(new Point(-2*u,0)), 1 );
		Place.DrawTerrain[Place.FOREST](layer,this.position.add(new Point(-u,u)), 1 );
		
		Place.DrawTerrain[Place.FOREST](layer,this.position.add(new Point(u,-u)), 1 );
		Place.DrawTerrain[Place.FOREST](layer,this.position, 1 );
		Place.DrawTerrain[Place.FOREST](layer,this.position.add(new Point(u,1.5*u)), 1);
		return;
	}
	
	if (this.terrain == Place.DESERT ) {	
		var u=Place.SIZE/3;
		
		/*
		var reduce=0.4;
		for( var i=0; i<this.boundaryNumberOfPoints(); i+=3) {  Place.DrawTerrain[this.terrain](layer,Point.interpolate(this.position, this.boundaryPoint(i),0.2).add((1-reduce)*u,-u*reduce),reduce );	  }
		var reduce=0.6;
		for( var i=0; i<this.boundaryNumberOfPoints(); i+=5) {  Place.DrawTerrain[this.terrain](layer,Point.interpolate(this.position, this.boundaryPoint(i),0.3).add((1-reduce)*u,-u*reduce),reduce );	  }
		reduce=0.75;
		for( var i=0; i<this.boundaryNumberOfPoints(); i+=7) {  Place.DrawTerrain[this.terrain](layer,Point.interpolate(this.position, this.boundaryPoint(i),0.5).add((1-reduce)*u,-u*reduce), reduce );	  }
		*/
		
		var reduce=1;
		for( var i=0; i<this.boundaryNumberOfPoints(); i+=6) {  Place.DrawTerrain[this.terrain](layer,Point.interpolate(this.position, this.boundaryPoint(i),0.4).add((1-reduce)*u,-u*reduce), reduce );	  }
		
		Place.DrawTerrain[this.terrain](layer,this.position.add(new Point(0,-u)), 1 );	
		return;
	}

	if (this.terrain == Place.CITY ) {	
		var u=Place.SIZE/3;
		for( var i=0; i<this.boundaryNumberOfPoints(); i+=10) {  Place.DrawTerrain[this.terrain](layer,Point.interpolate(this.position, this.boundaryPoint(i),0.35).add(0,-u), 1 );	  }
		Place.DrawTerrain[this.terrain](layer,this.position.add(new Point(0,-u)), 1 );	
		return;
	}
		
	if (this.terrain == Place.VOLCANO ) {	
		var u=Place.SIZE/3;
		for( var i=0; i<this.boundaryNumberOfPoints(); i+=5) {  Place.DrawTerrain[Place.VOLCANO + 200](layer,Point.interpolate(this.position, this.boundaryPoint(i),0.5).add(0,-u*0.5), 1 );	  }
		if (this.tower>=0) Place.DrawTerrain[this.terrain](layer,this.position.add(new Point(-u,-u*1.5)), 1 );	//move aside volcano to avoid tower icon
		else Place.DrawTerrain[this.terrain](layer,this.position.add(new Point(0,-u)), 1 );	
		return;
	}
	
	//single image terrain :
	var u=Place.SIZE/3;
	Place.DrawTerrain[this.terrain](layer,this.position.add(new Point(0,-u)), 1 );

};


/**
* Function used to draw terrain
*/
Place.DrawTerrain= new Array();
Place.DrawTerrain[Place.MOUNTAIN] = function(layer, position, size ) {	
	//document.body.appendChild( CACHED_SHAPES["Forest"] );
	var myImage=new Kinetic.Image({image: CACHED_IMAGES["Mountain"], x: (position.x-16), y: position.y,  scale:size}) ;
	layer.add( myImage );		
};

Place.DrawTerrain[Place.FOREST] = function(layer, position, size) {
	//document.body.appendChild( CACHED_SHAPES["Forest"] );
	var myImage=new Kinetic.Image({image: CACHED_IMAGES["Forest"], x: (position.x-16), y: position.y,  scale:size}) ;
	//alert( myImage );
	layer.add( myImage );
};

Place.DrawTerrain[Place.HILL] = function(layer, position, size) {
	//document.body.appendChild( CACHED_SHAPES["Forest"] );
	var myImage=new Kinetic.Image({image: CACHED_IMAGES["Hill"], x: (position.x-16), y: position.y,  scale:size}) ;
	//alert( myImage );
	layer.add( myImage );
};

Place.DrawTerrain[Place.DESERT] = function(layer, position, size) {
	//document.body.appendChild( CACHED_SHAPES["Forest"] );
	var myImage=new Kinetic.Image({image: CACHED_IMAGES["Desert"], x: (position.x-16), y: position.y,  scale:size}) ;
	//alert( myImage );
	layer.add( myImage );
};

Place.DrawTerrain[Place.CITY] = function(layer, position, size) {
	//document.body.appendChild( CACHED_SHAPES["Forest"] );
	var myImage=new Kinetic.Image({image: CACHED_IMAGES["City"], x: (position.x-16), y: position.y,  scale:size}) ;
	//alert( myImage );
	layer.add( myImage );
};

Place.DrawTerrain[Place.VOLCANO] = function(layer, position, size) {
	//document.body.appendChild( CACHED_SHAPES["Forest"] );
	var myImage=new Kinetic.Image({image: CACHED_IMAGES["Volcano"], x: (position.x-16), y: position.y,  scale:size}) ;
	//alert( myImage );
	layer.add( myImage );
};
Place.DrawTerrain[Place.VOLCANO + 200] = function(layer, position, size) { //round volcano
	//document.body.appendChild( CACHED_SHAPES["Forest"] );
	var myImage=new Kinetic.Image({image: CACHED_IMAGES["VolcanoB"], x: (position.x-16), y: position.y,  scale:size}) ;
	//alert( myImage );
	layer.add( myImage );
};