//to know who am I !
var isMobile = {
    Android: function() {
        return navigator.userAgent.match(/Android/i);
    },
    BlackBerry: function() {
        return navigator.userAgent.match(/BlackBerry/i);
    },
    iOS: function() {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i);
    },
    Opera: function() {
        return navigator.userAgent.match(/Opera Mini/i);
    },
    Windows: function() {
        return navigator.userAgent.match(/IEMobile/i);
    },
	DEBUGwithChrome: function() {  //DEBUG with chrome as a mobile device :-P
		return false;
		return navigator.userAgent.match(/Chrome/i);
	},
    any: function() {
        return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows() || isMobile.DEBUGwithChrome() );
    }
};

/**
* Deal with server : json (or other) sending and receive
*/
function RequestJson(url, callbackFunction, dataPost, mimeType) {
	var request= new XMLHttpRequest();
	
	request.onreadystatechange=function() {
	  if (request.readyState==4 && request.status==200) 	{ callbackFunction( request.responseText); }
	};
	
	if (dataPost!=null) {
		if ( mimeType == null ) mimeType = "application/json"; //The MIME media type for JSON text is application/json
		request.open("POST", url,true);
		request.setRequestHeader("Content-Type", mimeType ); 
		request.send(dataPost);
	} else {
		request.open("GET", url,true);
		request.send();	
	}
		  
}

/**
* Deal with server : uploading an image 
TESTING PURPOSE    
*/
function RequestImageUpload(url, callbackFunction, imageDataUrl, mimeType) {

	var request= new XMLHttpRequest();
	
    request.onload = function() {
		callbackFunction( request.responseText);
    };
	
	// Upload
	var form = document.createElement('form');
    var input = document.createElement('input');
    input.type = 'file';
    input.name = 'displayImage';
	input.href=imageDataUrl;
    form.appendChild(input);
	
    request.open('POST', url); // Rappelons qu'il est obligatoire d'utiliser la méthode POST quand on souhaite utiliser un FormData
	request.setRequestHeader("Content-Type", mimeType ); //  multipart/form-data
	request.send(form);

}

/**
* List of menu items
*/
var MENU_ITEMS=new Array();
var MENU_WIDTH=90;
/**
* Add a new menu item (horizontal menu)
*/
function AddMenuItem(htmlElementParent, name, cssClass, functionOnClick, elementType ) {
	if (elementType==null) elementType = "div";
	var item = document.createElement(elementType);
	if (cssClass!=null) item.className=cssClass;
	if (name!=null) item.innerHTML=name;
	htmlElementParent.appendChild(item);
	//MenuSetPosition(item);
	if (functionOnClick!=null) { //ignore inactive menu
		if (MENU_TUTORIAL == null) item.onclick=functionOnClick; //in game
		else {
			MENU_TUTORIAL[name] = item; //in tuto only
			item.fakeClick = functionOnClick;
		}
		MENU_ITEMS.push(item);
		//console.log("DEBUG Util.AddMenuItem  : item = " + item + "  " + name);
	}
	return item;
}
//Add this function to your onclik event : menu item will be selected, and other menu unselected
function MenuSelectItem(item, classUnselectedMenu, classSelectedMenu) {

console.log("DEBUG Util.MenuSelectItem  : item = " + item );

	//remove class from all menu
	for( var i=0; i<MENU_ITEMS.length;i++) {
		if (MENU_ITEMS[i].tagName.toLowerCase() == "div") 	MENU_ITEMS[i].className=classUnselectedMenu;
		if (MENU_ITEMS[i].tagName.toLowerCase() == "tr") {
			for (var k=0; k<MENU_ITEMS[i].childNodes.length; k++) MENU_ITEMS[i].childNodes[k].className=classUnselectedMenu;
		}
	}
	//...and add it to the new one
	if (item.tagName.toLowerCase() == "div") item.className=classSelectedMenu;
	if (item.tagName.toLowerCase() == "tr") for (var k=0; k<item.childNodes.length; k++) item.childNodes[k].className=classSelectedMenu;
	//MenuSetPosition(item);
}
 

/** return a good position for floating menu that it is always visible for user : never outpass boundaries of map
	pos : position of menu without limited constraints
	menuSize : size of menu
	minPoint : upper right point of boundary within which menu has to be
	maxPoint : lower left point of boundary
**/
function MenuFloatingPosition( pos, menuSize, minPoint, maxPoint ) {
	var newPos = new Point(pos.x, pos.y);
	if ( (newPos.x) < minPoint.x ) newPos.x = minPoint.x;
	if ( (newPos.x) > (maxPoint.x - menuSize.x) ) newPos.x = maxPoint.x - menuSize.x;

	if ( (newPos.y) < minPoint.y ) newPos.y = minPoint.y;
	if ( (newPos.y) > (maxPoint.y - menuSize.y) ) newPos.y = maxPoint.y - menuSize.y;
	
	return newPos;
}

CanvasDrawText=function(ctx, pt, txt) {
	ctx.font = "bold 12pt Calibri,Geneva,Arial";
	ctx.strokeStyle = "white"; 
	ctx.strokeText(txt, pt.x, pt.y);
	ctx.fillStyle = "black";
	ctx.fillText(txt , pt.x, pt.y);
}

/** draw arrow between two points http://www.dbp-consulting.com/tutorials/canvas/CanvasArrow.html 
	deltaCurve : curve factor of arrow : 0 for straight arrow, 1 for large arrow. default : 0.2
**/
CanvasDrawArrow=function(ctx,pt1,pt2,style,which,angle,d, deltaCurve)
{
  var x1=pt1.x; var y1=pt1.y; var x2=pt2.x; var y2=pt2.y;
  deltaCurve=typeof(deltaCurve)!='undefined'? deltaCurve:.2;
  
  'use strict';
  // Ceason pointed to a problem when x1 or y1 were a string, and concatenation
  // would happen instead of addition
  if(typeof(x1)=='string') x1=parseInt(x1);
  if(typeof(y1)=='string') y1=parseInt(y1);
  if(typeof(x2)=='string') x2=parseInt(x2);
  if(typeof(y2)=='string') y2=parseInt(y2);
  style=typeof(style)!='undefined'? style:3;
  which=typeof(which)!='undefined'? which:1; // end point gets arrow
  angle=typeof(angle)!='undefined'? angle:Math.PI/8;
  d    =typeof(d)    !='undefined'? d    :10;
  // default to using drawHead to draw the head, but if the style
  // argument is a function, use it instead
  var toDrawHead=typeof(style)!='function'?CanvasDrawHead:style;

  // For ends with arrow we actually want to stop before we get to the arrow
  // so that wide lines won't put a flat end on the arrow.
  //
  var dist=Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1));
  var ratio=(dist-d/3)/dist;
  var tox, toy,fromx,fromy;
  if(which&1){
	tox=Math.round(x1+(x2-x1)*ratio);
	toy=Math.round(y1+(y2-y1)*ratio);
  }else{
	tox=x2;
	toy=y2;
  }
  if(which&2){
	fromx=x1+(x2-x1)*(1-ratio);
	fromy=y1+(y2-y1)*(1-ratio);
  }else{
	fromx=x1;
	fromy=y1;
  }

  // Draw the shaft of the arrow
  ctx.beginPath();
  ctx.moveTo(x1,y1);
  //ctx.lineTo(tox,toy);  HC
  var dx=(x2 - x1 ); var dy=(y2 - y1 );
  //random control point for quadratic curve, to avoid superimposition of arrows which share the same path 
  //perpendicular vector :
  var nx=Math.abs(dy); var ny=Math.abs(dx); 
  //sign correctly perpendicular vector
  if ((dx>0) && (dy>0)) ny=-ny;
  if ((dx>0) && (dy<0)) { nx=-nx ; ny=-ny; }
  if ((dx<0) && (dy<0)) nx=-nx;
  //if ((dx<0) && (dy>0)) 
  var randomPointX= x1 + dx *.5 + deltaCurve * nx ; 
  var randomPointY= y1 + dy *.5 + deltaCurve * ny ; 
  //ctx.lineTo(randomPointX,randomPointY); 
  ctx.quadraticCurveTo( randomPointX, randomPointY, x2,y2);
  
 // ctx.fillRect( x1 + (y2 - y1 ), y1 + (x2 - x1 ), 3, 3  );
 // ctx.fillRect( randomPointX,randomPointY, 2,2 );
  
  ctx.stroke();

  // calculate the angle of the line
  //var lineangle=Math.atan2(y2-y1,x2-x1);  HC
  var lineangle=Math.atan2(y2-randomPointY,x2-randomPointX);
  // h is the line length of a side of the arrow head
  var h=Math.abs(d/Math.cos(angle));

  if(which&1){	// handle far end arrow head
	var angle1=lineangle+Math.PI+angle;
	var topx=x2+Math.cos(angle1)*h;
	var topy=y2+Math.sin(angle1)*h;
	var angle2=lineangle+Math.PI-angle;
	var botx=x2+Math.cos(angle2)*h;
	var boty=y2+Math.sin(angle2)*h;
	toDrawHead(ctx,topx,topy,x2,y2,botx,boty,style);
  }
  if(which&2){ // handle near end arrow head
	var angle1=lineangle+angle;
	var topx=x1+Math.cos(angle1)*h;
	var topy=y1+Math.sin(angle1)*h;
	var angle2=lineangle-angle;
	var botx=x1+Math.cos(angle2)*h;
	var boty=y1+Math.sin(angle2)*h;
	toDrawHead(ctx,topx,topy,x1,y1,botx,boty,style);
  }
}
/** draw head of arrow **/
CanvasDrawHead=function(ctx,x0,y0,x1,y1,x2,y2,style)
{
  'use strict';
  x0=parseInt(x0);
  y0=parseInt(y0);
  x1=parseInt(x1);
  y1=parseInt(y1);
  x1=parseInt(x1);
  y2=parseInt(y2);
  var radius=3;
  var twoPI=2*Math.PI;

  // all cases do this.
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x0,y0);
  ctx.lineTo(x1,y1);
  ctx.lineTo(x2,y2);
  switch(style){
	case 0:
	  // curved filled, add the bottom as an arcTo curve and fill
	  var backdist=Math.sqrt(((x2-x0)*(x2-x0))+((y2-y0)*(y2-y0)));
	  ctx.arcTo(x1,y1,x0,y0,.55*backdist);
	  ctx.fill();
	  break;
	case 1:
	  // straight filled, add the bottom as a line and fill.
	  ctx.beginPath();
	  ctx.moveTo(x0,y0);
	  ctx.lineTo(x1,y1);
	  ctx.lineTo(x2,y2);
	  ctx.lineTo(x0,y0);
	  ctx.fill();
	  break;
	case 2:
	  // unfilled head, just stroke.
	  ctx.stroke();
	  break;
	case 3:
	  //filled head, add the bottom as a quadraticCurveTo curve and fill
	  var cpx=(x0+x1+x2)/3;
	  var cpy=(y0+y1+y2)/3;
	  ctx.quadraticCurveTo(cpx,cpy,x0,y0);
	  ctx.fill();
	  break;
	case 4:
	  //filled head, add the bottom as a bezierCurveTo curve and fill
	  var cp1x, cp1y, cp2x, cp2y,backdist;
	  var shiftamt=5;
	  if(x2==x0){
	// Avoid a divide by zero if x2==x0
	backdist=y2-y0;
	cp1x=(x1+x0)/2;
	cp2x=(x1+x0)/2;
	cp1y=y1+backdist/shiftamt;
	cp2y=y1-backdist/shiftamt;
	  }else{
	backdist=Math.sqrt(((x2-x0)*(x2-x0))+((y2-y0)*(y2-y0)));
	var xback=(x0+x2)/2;
	var yback=(y0+y2)/2;
	var xmid=(xback+x1)/2;
	var ymid=(yback+y1)/2;

	var m=(y2-y0)/(x2-x0);
	var dx=(backdist/(2*Math.sqrt(m*m+1)))/shiftamt;
	var dy=m*dx;
	cp1x=xmid-dx;
	cp1y=ymid-dy;
	cp2x=xmid+dx;
	cp2y=ymid+dy;
	  }

	  ctx.bezierCurveTo(cp1x,cp1y,cp2x,cp2y,x0,y0);
	  ctx.fill();
	  break;
  }
  ctx.restore();
};