
/**
* add an image to the layer (html element). If layer is omited, 'map' div element is used
*/
Map.InsertImage= function(url, position, layer,  height, width, opacity) {
	if (layer==null) layer=document.getElementById('map');
	var img = document.createElement("img");
	img.src = url;
	if (position !=null) {
		img.style.position="absolute";
		img.style.left=position.x + "px";
		img.style.top=position.y + "px";
	}
	if (height!=null) {
		img.style.width= height + "px";
		img.style.height=width + "px";
	}
	if (opacity!=null) {
		img.style.opacity=opacity;
	}
	//img.style.border='solid';
	layer.appendChild(img);
	return img;
};

/**
* add an canvas element to the layer (html element). If layer is omited, 'map' div element is used
*/
Map.InsertCanvas= function(position, size, layer, classname) {
	if (layer==null) layer=document.getElementById('map');
	var canvas = document.createElement("canvas");
	if (classname!=null) canvas.className=classname;
	if (position !=null) {
		canvas.style.position="absolute";
		canvas.style.left=position.x + "px";
		canvas.style.top=position.y + "px";
	}
	if (size !=null) {
		canvas.width=size.x;
		canvas.height=size.y; 
	}
	layer.appendChild(canvas);
		
	return canvas;
};

/** add an image in a canvas element**/
Map.InsertImageInCanvas = function (url, position, ctx, height, width, opacity) {
	if (ctx == null) return;
	var img = new Image(); 
	
	//console.log("loading..... " + ctx.debugname + " " + url);
	img.onload = function () {
		
		//deal with transparency, if required
		var oldOpacity;
		if (opacity!=null) { oldOpacity=ctx.globalAlpha; ctx.globalAlpha=opacity; }
		
		if (height==null) {
			ctx.imageSmoothingEnabled=false; //better look if not redim
			ctx.drawImage(img, position.x, position.y);
		} 
		else {
			ctx.imageSmoothingEnabled=true; //better look if redim
			ctx.drawImage(img, position.x, position.y, height, width);
		}
		//console.log("drawing ! => " + ctx.debugname + " " + url);
		
		ctx.globalAlpha=oldOpacity; //restore old transparency
	}
	img.src = url;
		
}


/**
* add an icon to the layer (html element) : icon is a div element with background image. Used for units drawing. If layer is omited, 'map' div element is used
*/
Map.InsertIcon= function(iconClass, position,layer) {
	if (layer==null) layer=document.getElementById('map');
	var img = document.createElement("div");
	img.className=iconClass;
	if (position !=null) {
		img.style.position='absolute';  
		img.style.left=position.x + "px";
		img.style.top=position.y + "px";
	}
	layer.appendChild(img);
	return img;
};



/** Move an existing object (icon or image) to its new position */
Map.MoveObject = function( htmlObject, position ) {
	htmlObject.style.left=position.x + "px";
	htmlObject.style.top=position.y + "px";
}

/**
* Remove an element 
*/
Map.RemoveElement = function(element) { element.parentNode.removeChild(element); }


Map.InsertCommentInCanvas = function(ctx, text, pos, fontHeigth) {
	
	if (fontHeigth==null) fontHeigth=11;
	ctx.font="normal " + fontHeigth + "px Arial"; 
	
	lines = text.split("\n"); //multiline ?
	
	pos=pos.add(Place.SIZE/8, -Place.SIZE/2 - fontHeigth );
	
	maxwidth=ctx.measureText(lines[0]).width;
	for (var i = 1; i < lines.length; ++i) {
		if (ctx.measureText(lines[i]).width > maxwidth) maxwidth=ctx.measureText(lines[i]).width;
	}
	
	ctx.strokeStyle = "brown"; ctx.fillStyle = "white"	; ctx.lineWidth = 1;
	var margin=5;
	ctx.fillRect(pos.x-margin,pos.y-margin, maxwidth+ (margin*2), (fontHeigth * lines.length) + 4 + (margin*2));
	ctx.strokeRect(pos.x-margin,pos.y-margin, maxwidth+ (margin*2), (fontHeigth * lines.length) + 4 + (margin*2));
	/*
	ctx.lineWidth=7; ctx.strokeStyle = "brown";
	ctx.strokeText(text,pos.x,pos.y);   
	ctx.lineWidth=5; ctx.strokeStyle = "white";
	ctx.strokeText(text,pos.x,pos.y);   
	*/
	
	pos=pos.add(0, fontHeigth);
	ctx.fillStyle = "brown"	;
	
	
	for (var i = 0; i < lines.length; ++i) {
		ctx.fillText(lines[i],pos.x,pos.y + ( fontHeigth * i ) );
	}
	
}

/** Clear canvas of the size of the map**/
Map.prototype.clear = function( canvasContext ) {
	canvasContext.clearRect(0, 0, this.land.size().x, this.land.size().y);
}

Place.DrawTower = function(ctx, position, idTower, terrain ) {

	//position
	var p=null;
	if (position!=null)  p=position.add(-15,-30);
	
	//var t = Place.TowerTypeOfMagic(idTower);
	//Ground blazon (except for neutral units)
	//Map.InsertImageInCanvas("images/V2Magie" + t + ".gif", p, ctx);
	
	if (LearnedSpells.isSpellAMovement(terrain))
			Map.InsertImageInCanvas("images/towerMovement.png", p, ctx);
	else	Map.InsertImageInCanvas("images/tower.png", p, ctx);
	
	//magic strength
	var s = Math.sqrt( Unit.strengthOfType( Unit.MAGIC_ATTACK, Fighting.ATTACK, terrain)  ) * 3 ;
	Map.InsertImageInCanvas("images/spell.png", p.add(-s/2+14,-s/2+3), ctx, s, s );
	
	//tower id
	/*
	ctx.shadowBlur = 0;
	ctx.font="normal 11px Arial"; 
	ctx.fillStyle = "brown";
	var text = InfoMessages["Magic" + t] + " n°" + Place.TowerIdWithinMagic(idTower);
	var pos = position.add(-text.length*3,15);
	ctx.fillText(text,pos.x,pos.y); 
	*/
}

/** draw the id of the place **/
Place.prototype.drawId = function( ctx ) {
	ctx.font="normal bold 10px Arial"; 
	//ctx.lineWidth=2; ctx.strokeStyle = "white";
	ctx.fillStyle = "grey"
	
	var text= this.id;
	//ctx.strokeText(text,pos.x,pos.y);   
	var pos = this.position;
	if (this.units!=null) pos = this.position.add(-7 * this.units.length, -20 );
	ctx.fillText(text,pos.x,pos.y); 
}

/** draw the tile position of a place (debug of spatial index) **/
Place.prototype.drawTileRef = function( ctx, land ) {
	ctx.font="normal bold 10px Arial"; 
	//ctx.lineWidth=2; ctx.strokeStyle = "white";
	ctx.fillStyle = "black"
	
	
	//ctx.strokeText(text,pos.x,pos.y);   
	var pos = this.position;
	var tile = land.tileCoordinate(pos);
	var text= this.id + " (" + tile.x + "," + tile.y + ")" ;
	if (this.units!=null) pos = this.position.add(-7 * this.units.length, -20 );
	ctx.fillText(text,pos.x,pos.y); 
}


/**
* Draw the units
* ctx : a canvas context (one for each level)
*/
People.prototype.draw = function(ctx1, ctx2, ctx3, ctx4, map ){
	
	//draw ancient war (only on actual map)
	if ( (map.history != null) && (map.planning==null) ) if (map.history.fightings!=null) {
		
		for (var i=0; i<map.history.fightings.length;i++) {
			var place = map.land.places[map.history.fightings[i]];
			//recenter war icon either a unit stands there or not
			if ( (place.units==null) || ( place.units.length==0) ) Unit.DrawWarIcon(ctx4, place.position.add(0,20));	
			else Unit.DrawWarIcon(ctx4, place.position);		
		}
		
	}

	//draw units on a place 
	for(i=0; i<map.land.places.length;i++) {
		var p=map.land.places[i];
		//if (p.units == null) continue;
		//if (p.units.length==0) continue;
		Unit.DrawUnits(ctx1, ctx2, ctx3, p, map ) ;
		//p.drawId(ctx3); //debug purpose 
		//p.drawTileRef(ctx3,map.land); //debug purpose
	}
	
	//draw wizard's messages
/*	for(i=1; i<People.WIZARD_COUNT;i++) { if (this.wizards[i]!=null) {
		Map.InsertCommentInCanvas( ctx3, "J'aurai ta peau petit chenapan !", this.wizards[i].place.position )
	} }
*/
	
};

/**
Draw incomes and stock of the given wizard at the given position
**/
Incomes.prototype.displayIncomesOf = function(ctx, wizardId, pos, map ) {

	//new position if text near map border
	pos  = MenuFloatingPosition( pos, new Point( 120, 40), new Point(0,0), map.land.size() )

	ctx.shadowBlur = 0;
	ctx.font="normal bold 12px Arial"; 
	ctx.lineWidth=2; ctx.strokeStyle = "white";
	ctx.fillStyle = "green";
	
	//stock will be negative next turn : bankrupcy
	if (this.incomes[wizardId]<-this.stocks[wizardId]) ctx.fillStyle = "red"; 
	
	var text= InfoMessages["IncomesCol2"] + " : " + this.stocks[wizardId] + " " + InfoMessages["MoneyUnit"] ;
	ctx.strokeText(text,pos.x,pos.y);   ctx.fillText(text,pos.x,pos.y); 
	
	//incomes will be negative
	if (this.incomes[wizardId]<0) ctx.fillStyle = "red"; //Unit.ColorOf(wizardId);
	
	pos=pos.add(0, 20);
	var text= InfoMessages["IncomesCol3"] + " : " + this.incomes[wizardId] + " " + InfoMessages["MoneyUnit"] ;
	ctx.strokeText(text,pos.x,pos.y);   ctx.fillText(text,pos.x,pos.y); 
}

/** Enlight a point with a rounding circle **/
Point.prototype.showEnlightedCircle = function ( ctx, color, size ) {
	ctx.beginPath();
	ctx.arc(this.x, this.y, size, 0, Math.PI*2, true); 
	ctx.closePath();
	ctx.shadowBlur = 5; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; ctx.shadowColor=color;  //blur option 
	ctx.strokeStyle = color;  ctx.lineWidth=1.3; ctx.stroke();	
	ctx.shadowBlur = 0;
}
/** Enlight a point with a rounding ray **/
Point.prototype.showEnlightedRay = function ( ctx, color, size ) {
	ctx.beginPath();
	ctx.moveTo(this.x,this.y);
	ctx.lineTo(this.x+size/4,this.y-size/2);
	ctx.lineTo(this.x,this.y-size/2);
	ctx.lineTo(this.x+size/2,this.y-size);
	ctx.closePath();
	ctx.shadowBlur = 5; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; ctx.shadowColor=color;  //blur option 
	ctx.strokeStyle = color;  ctx.lineWidth=1.3; ctx.stroke();	
	ctx.shadowBlur = 0;
}

/** (added)
* Draw line to this point
* @function
*/
Point.prototype.lineTo= function(ctx, resolution){
	ctx.lineTo(this.x * resolution, this.y * resolution  ); 
};

/** (added)
* move canvas context to this point
* @function
*/
Point.prototype.moveTo= function(ctx, resolution){
	ctx.moveTo(this.x * resolution, this.y * resolution); 
};

/** (added)
* put a path in context
* @param {path} Array of points
*/
Point.pathTo = function(ctx,path,closing, resolution) {
	
	ctx.beginPath();
	path[0].moveTo(ctx, resolution);
	for (var i=1; i<path.length; i++) path[i].lineTo(ctx, resolution);
	if (closing) ctx.closePath(); 
	return ctx;
};

/**
* from mouse event : return a point in the relative DOMelement system of the mouse event
*/
Point.mouseCoordinates= function(evt, DOMelement) {

	if (DOMelement == null) return new Point(evt.clientX, evt.clientY); //no container
	
	var containerX = DOMelement.offsetLeft;
	var containerY = DOMelement.offsetTop;
		
	//old since 2013 return new Point(  ( mouseEvent.clientX - DOMelement.getBoundingClientRect().left ), ( mouseEvent.clientY - DOMelement.getBoundingClientRect().top )  );
	
	//since November 2014 : 
	return new Point(  ( evt.clientX - containerX ), ( evt.clientY - containerY )  );
	
	//first bug of android chrome fix, don't work anymore since November 2014
	var isTouchSupported = 'ontouchstart' in window;
	if(isTouchSupported){                     // for touch devices
		return new Point(evt.clientX-containerX, evt.clientY-containerY);
	}

	else if(evt.offsetX || evt.offsetX == 0){    //for webkit browser like safari and chrome
		return new Point( evt.offsetX, evt.offsetY);
	}

	else if(evt.layerX || evt.layerX == 0){      // for mozilla firefox
		return new Point( evt.layerX, evt.layerY);
	}	
};

