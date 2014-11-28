Palette = {
	mapBorder: "#ccc",
	
	pathGround: "hsl(80,6%,70%)",
	pathSea:"hsl(215,59%,70%)",
	
	ground:"hsl(45,30%,89%)",
	groundDark:"hsl(45,30%,80%)",
	groundBorder: "hsl(45,30%,66%)", //"#e9cf8e",
	
	sea: "hsl(220,30%,92%)", //c3c4bb  
	seaDark: "hsl(206,30%,80%)",
	
	tree:"hsl(120,22%,73%)",
	
	label: "hsl(45,6%,55%)",
	
	armyBorder:"#543"

};

//colors of towers
/*
TowerColor= {
	Border:function(tower) { return "hsl(" + Math.round(tower/8.5 * 360)%360 + ",20%,35%)";},
	Fill1:function(tower) {	
		return "hsl(" + Math.round(tower/8.5 * 360)%360 + ",70%,55%)";},
	Fill2:function(tower) {  
	return "hsl(" + Math.round(tower/17 * 360)%360 + ",100%,80%)";}
}
*/

TowerColor={ 
	Fill1:"hsl(20,20%,35%)", Fill2:"hsl(20,80%,55%)"
};

//colors of army : depend on owner
ArmyColor = {
	Border:function(owner) { if (owner==0) return "#777" ; return "hsl(" + Math.round(owner * 47)%360 + ",20%,30%)";},
	Fill1:function(owner) {	if (owner==0) return "#999" ; 
		return "hsl(" + Math.round(owner * 73)%360 + ",45%,48%)";},
	Fill2:function(owner) { if (owner==0) return "#eee" ;  
	return "hsl(" + Math.round(owner* 89)%360 + ",45%,80%)";},
	WizardName:function(owner) { if (owner==0) return "#ccc" ;  
	return "hsl(" + Math.round(owner * 73)%360 + ",100%,50%)";}
}

