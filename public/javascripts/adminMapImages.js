/**
* List of cached images for performance enhancement
*/

//cached images shape (drawing performance boost)
CACHED_IMAGES = new Array();
CACHED_IMAGES_OFFSET = new Array(); //for centered images (usefull with animated images, where the offset has to be known)

/***
* Load images. callBackFunction is required because of asynchronous loading.
*/
function InitCachedImages( callBackFunction ) {

	var shape;
	
	var tmpLayer = new Kinetic.Layer(); //required by drawimage but not displayed
	
	//recursive call of this function until all images are in cache
	
	if ( CACHED_IMAGES["Forest"] == null ) {
		shape= new Kinetic.Path({
				x: 0,
				y: 0,
				data: 'M -0.57,0.16 -0.64,-6.5 C -1.5,-6.2 -3.5,-5.3 -4,-6 -4.3,-6.5 -3.4,-7.4 -3.4,-7.4 -3.4,-7.4 -5.2,-8.1 -5.2,-8.8 -5.2,-9.6 -3.7,-9.9 -3.7,-9.9 -3.7,-9.9 -4.4,-12 -3.9,-12 -3.4,-13 -1.9,-12 -1.9,-12 -1.9,-12 0.33,-14 1.3,-14 2.2,-14 2.7,-12 2.7,-12 2.7,-12 4,-13 4.7,-12 6.5,-11 6.1,-9.9 4.9,-8.5 4.9,-8.5 5.3,-7.6 5.1,-7.2 4.8,-6.9 3.7,-6.9 3.7,-6.9 3.7,-6.9 4.4,-5.7 4,-5.2 3,-4.7 1.8,-5.3 0.93,-5.6 L 0.83,0.03',
				stroke: Palette.tree,
				strokeWidth: 1.1,
				fillLinearGradientStartPoint: [5, 0],
				fillLinearGradientEndPoint: [0, -17],
				fillLinearGradientColorStops: [.3, Palette.tree, .8, Palette.ground, 1, 'white'],
				scale: 1
			  });
		tmpLayer.add(shape); shape.toImage({	width: 32,height: 32,x:-16,y:-16, callback: function(img) {	CACHED_IMAGES["Forest"]=img; InitCachedImages(callBackFunction); }  });
		return; 
	}
	
	if ( CACHED_IMAGES["Mountain"] == null ) {
	
	
		var img = new Image();
		img.onload = function() {
			CACHED_IMAGES["Mountain"]=img; InitCachedImages(callBackFunction);
		}
		img.src = "images/terrain2.png";
		return; 
		
		//old 
		/*
		shape= new Kinetic.Image({
				x: 0,
				y: 0,
				data: 'M -20,-0.27 C -15,-1.3 -5,-13 -4,-14 -1.9,-16 -0.9,-12 1.1,-13 3.1,-14 5.1,-17 5.1,-17 5.1,-17 7.1,-18 10,-12 11,-9.3 16,-0.27 19,-0.27',
				stroke: "#dcb",
				strokeWidth: 2,
				fillLinearGradientStartPoint: [10, 0],
				fillLinearGradientEndPoint: [0, -15],
				fillLinearGradientColorStops: [0, Palette.groundBorder, .75, Palette.ground, 1, 'white'],
				scale: 1
			  });
		tmpLayer.add(shape); shape.toImage({	width: 32,height: 32,x:-16,y:-16, callback: function(img) {	CACHED_IMAGES["Mountain"]=img; InitCachedImages(callBackFunction); }  });
		return; 
		*/
	}
	

	if ( CACHED_IMAGES["Desert"] == null ) {
	
		var img = new Image();
		img.onload = function() {
			CACHED_IMAGES["Desert"]=img; InitCachedImages(callBackFunction);
		}
		img.src = "images/terrain1.png";
		return; 
	}
	
	if ( CACHED_IMAGES["Hill"] == null ) {
	
		var img = new Image();
		img.onload = function() {
			CACHED_IMAGES["Hill"]=img; InitCachedImages(callBackFunction);
		}
		img.src = "images/terrain7.png";
		return; 
	}
	
	if ( CACHED_IMAGES["City"] == null ) {
	
		var img = new Image();
		img.onload = function() {
			CACHED_IMAGES["City"]=img; InitCachedImages(callBackFunction);
		}
		img.src = "images/terrain5.png";
		return; 
	}

	if ( CACHED_IMAGES["Volcano"] == null ) {
	
		var img = new Image();
		img.onload = function() {
			CACHED_IMAGES["Volcano"]=img; InitCachedImages(callBackFunction);
		}
		img.src = "images/terrain6.png";
		return; 
	}
	if ( CACHED_IMAGES["VolcanoB"] == null ) {
	
		var img = new Image();
		img.onload = function() {
			CACHED_IMAGES["VolcanoB"]=img; InitCachedImages(callBackFunction);
		}
		img.src = "images/terrain6b.png";
		return; 
	}
	
	/*
	if ( CACHED_IMAGES["Tower"] == null ) {
		shape= new Kinetic.Path({
				x: 0,
				y: 0,
				data: 'M 0.22,-25 -1.2,-19 -2.5,-19 -3.5,-23 -4.8,-18 -4.2,-18 -4.2,-15 -3.1,-15 -3.9,-8 -5.8,-0.1 6.3,-0.1 4.6,-7.3 3.8,-15 4.9,-15 4.9,-18 5.7,-18 4.3,-23 3.3,-19 1.7,-19 0.22,-25 z',
				//stroke: "#dcb",
				//strokeWidth: 2,
				fillLinearGradientStartPoint: [0, 0],
				fillLinearGradientEndPoint: [0, -20],
				fillLinearGradientColorStops: [0,  Palette.ground, .4, TowerColor.Fill1, .9, TowerColor.Fill2],
				scale: 1
			  });
		tmpLayer.add(shape); shape.toImage({	width: 32,height: 32,x:-16,y:-25, callback: function(img) {	CACHED_IMAGES["Tower"]=img; InitCachedImages(callBackFunction); }  });
		return; 
	}
	*/
	
	if ( CACHED_IMAGES["BorderMotif"] == null ) {
		var shape=new Kinetic.Group();
		shape.add( new Kinetic.Path({
				x: 0,
				y: 0,
				data: 'M -1.25 -14.8 C -1.42 -14.8 -1.4 -14.6 -1.25 -14.4 C -1.11 -14.6 -1.08 -14.8 -1.25 -14.8 z M -1.25 -14.4 C -2.03 -12.9 -6.77 -8.24 -8.22 -7.47 C -6.78 -6.69 -2.09 -1.98 -1.31 -0.531 C -0.532 -1.97 4.16 -6.64 5.62 -7.44 C 4.15 -8.27 -0.465 -12.9 -1.25 -14.4 z M 5.62 -7.44 C 5.91 -7.28 6.06 -7.23 6.06 -7.41 C 6.06 -7.58 5.9 -7.59 5.62 -7.44 z M -1.31 -0.531 C -1.46 -0.267 -1.48 -0.0944 -1.31 -0.0938 C -1.15 -0.0931 -1.17 -0.266 -1.31 -0.531 z M -8.22 -7.47 C -8.48 -7.61 -8.62 -7.64 -8.62 -7.47 C -8.63 -7.3 -8.48 -7.33 -8.22 -7.47 z',
				stroke: Palette.groundBorder,
				strokeWidth: 1,
				fill: Palette.ground,
				scale: 1
			  }));
		shape.add( new Kinetic.Path({
				x: 0,
				y: 0,
				data: 'M -1.28,-11.7 C -1.37,-11.7 -1.35,-11.6 -1.28,-11.4 -1.2,-11.6 -1.19,-11.7 -1.28,-11.7 z M -1.28,-11.4 C -1.71,-10.6 -4.39,-7.89 -5.19,-7.47 -4.39,-7.04 -1.73,-4.34 -1.3,-3.53 -0.88,-4.34 1.79,-7 2.61,-7.42 1.79,-7.85 -0.86,-10.6 -1.28,-11.4 z M 2.61,-7.42 C 2.74,-7.34 2.84,-7.33 2.84,-7.42 2.84,-7.52 2.74,-7.5 2.61,-7.42 z M -1.3,-3.53 C -1.39,-3.39 -1.41,-3.3 -1.3,-3.3 -1.21,-3.3 -1.23,-3.39 -1.3,-3.53 z M -5.19,-7.47 C -5.33,-7.54 -5.43,-7.56 -5.43,-7.47 -5.43,-7.38 -5.34,-7.4 -5.19,-7.47 z',
				stroke: Palette.groundBorder,
				strokeWidth: 1,
				fill: Palette.groundDark,
				scale: 1
			  }));
		tmpLayer.add(shape); shape.toImage({	width: 32,height: 32,x:-16,y:-25, callback: function(img) {	CACHED_IMAGES["BorderMotif"]=img; InitCachedImages(callBackFunction); }  });
		return; 
	}

	//all image in cache, ok !
	callBackFunction();	  
}

