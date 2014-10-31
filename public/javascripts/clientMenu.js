/**
* client specific menus
*/

//display diplomatic support :
var displayDiplomaticSupport = function( diplomacy, htmlElementParent ) {
	var htmlArray = document.createElement("array");
	
	//header
	var htmlheader=document.createElement("tr");
	for( var j=0; j<People.WIZARD_COUNT; j++) {
		if (j==0) {
			var htmlCell= document.createElement("td");
			htmlCell.innerHTML=InfoMessages["Support"];	
			htmlheader.appendChild(htmlCell);			
		} else { //wizard name
			var htmlCell= document.createElement("td");
			//htmlCell.innerHTML =People.WizardName[i];	
			htmlheader.appendChild(htmlCell);
			Map.InsertImage("./images/color" + j + ".png", null, htmlCell);		
		}

	}
	htmlArray.appendChild(htmlheader);
	
	//rows
	for ( var i=1; i<People.WIZARD_COUNT; i++) {
		var htmlRow= document.createElement("tr");

		//wizard name
		var htmlCell= document.createElement("td");
		htmlCell.innerHTML=People.WizardName[i]; htmlRow.appendChild(htmlCell);
		Map.InsertImage("./images/color" + i + ".png", null, htmlCell);
		
		//supports
		for( var j=1; j<People.WIZARD_COUNT; j++) {
		
			var htmlCell= document.createElement("td");
			
			htmlCell.idWizard1=i; htmlCell.idWizard2=j; htmlCell.typeOfSupport=Diplomacy.WAR;  //to send param on click event
			htmlRow.appendChild(htmlCell);
			
			if (diplomacy.supports[i][j]==Diplomacy.WAR) {
				Map.InsertImage("./images/dead.png", null, htmlCell,32,32);
				htmlCell.typeOfSupport=Diplomacy.SUPPORT_YES;
			}
			
			
			if (diplomacy.supports[i][j]==Diplomacy.SUPPORT_YES) {
				
				if (i==j) {  
					htmlCell.className="grayCell";
					Map.InsertImage("./images/support.png", null, htmlCell,32,32, 0.5);
				}
				else {
					Map.InsertImage("./images/support.png", null, htmlCell,32,32);
					htmlCell.typeOfSupport=Diplomacy.SUPPORT_NO;
				}
	
			}


			
			if (j!=i) { //change support on different wizard
				var changeDiplo = function() { //order for changing diplomatic status
					if (INPUT_ORDER!=null) {
						INPUT_ORDER.newDiplomaticOrder(this.idWizard1, this.idWizard2, this.typeOfSupport );
						//refresh view
						displayDiplomaticSupport(INPUT_ORDER.map.diplomacy, htmlElementParent );
					}
				}
				if (MENU_TUTORIAL == null) htmlCell.onclick = changeDiplo;
				else {
					htmlCell.fakeclick = changeDiplo;
					htmlCell.id="menuDiplo_" + i + "_" + j ; //required for tutorial
				}
			}
			
			//enlight wizard own's diplomacy concern
			if ( (i==CURRENT_WIZARD) || (j==CURRENT_WIZARD)  ) {
				if (i!=j) htmlCell.className="myDiplomacy"; 
			} else {
				if (i!=j) htmlCell.className="notMyDiplomacy"; 
			}
			

		}
		
		htmlArray.appendChild(htmlRow);
		
	}
	
	while (htmlElementParent.firstChild) htmlElementParent.removeChild(htmlElementParent.firstChild);
	htmlElementParent.appendChild(htmlArray);
	
	
	
	return;

}

//display incomes
var displayIncomes = function( incomes, htmlElementParent ) {
	var htmlArray = document.createElement("array");
	//item.className=cssClass;
	//item.innerHTML=name;
	
	//header
	var htmlheader=document.createElement("tr");
	for( var j=1; j<=3; j++) {
		var htmlCell= document.createElement("th");
		htmlCell.innerHTML=InfoMessages["IncomesCol"+j];	
		htmlheader.appendChild(htmlCell);
	}
	htmlArray.appendChild(htmlheader);
	
	for ( var i=1; i<incomes.incomes.length; i++) {
		var htmlRow= document.createElement("tr");
		
		//wizard name
		var htmlCell= document.createElement("td");
		htmlCell.innerHTML=People.WizardName[i]; htmlRow.appendChild(htmlCell);
		Map.InsertImage("./images/color" + i + ".png", null, htmlCell);
		
		//wizard funds
		htmlCell= document.createElement("td");
		htmlCell.innerHTML=incomes.stocks[i] + " " + InfoMessages["MoneyUnit"]; htmlRow.appendChild(htmlCell);
		
		//wizard incomes
		htmlCell= document.createElement("td");
		if (incomes.incomes[i]>=0) {
			htmlCell.innerHTML= " + " + incomes.incomes[i] + " " + InfoMessages["MoneyUnit"]; 
			if (incomes.incomes[i]<=2)  htmlCell.className="incomeLow" ; 
			else htmlCell.className="incomeHigh";
		}
		else  { 
			htmlCell.innerHTML= incomes.incomes[i] + " " + InfoMessages["MoneyUnit"];  
			if (incomes.stocks[i] <= -incomes.incomes[i])  htmlCell.className="incomeBankrupcy" ; 
			else htmlCell.className="incomeNegative";
		}
			
		htmlRow.appendChild(htmlCell);
		
		htmlArray.appendChild(htmlRow);
	}
	
	while (htmlElementParent.firstChild) htmlElementParent.removeChild(htmlElementParent.firstChild);
	htmlElementParent.appendChild(htmlArray);
}

//display a table of terrains with their caracteristics
var displayTerrainsTable = function( htmlElementParent ) {
	var htmlArray = document.createElement("array");
	//item.className=cssClass;
	//item.innerHTML=name;
	
	//header
	var htmlheader=document.createElement("tr");
	var j=1;
	//columns names
	while(InfoMessages["TerrainCol"+j]!=null) {
		var htmlCell= document.createElement("th");
		htmlCell.innerHTML=InfoMessages["TerrainCol"+j];	
		htmlheader.appendChild(htmlCell);
		j++;
	}

	
	htmlArray.appendChild(htmlheader);
	
	//Pre-calculate bonuses for each terrain
	//strengths
	/*
	var strengthsTerrains = new Array(); //store the terrains that offer a given key bonus : terrainId -> bonusId -> Array of unitId
	for(var i=0; i<Place.TERRAIN_COUNT; i++) {
		strengthsTerrains[i]=new Array(); //array of bonuses for this given terrain
		for(var j=0; j<Place.TERRAIN_COUNT; j++) { //look for bonus for each possible unit
			var typeOfUnit;
			if (j==-1) typeOfUnit=Unit.WIZARD; else typeOfUnit=Unit.typeRecruitedOn(j);
			var bonus = Unit.strengthOfType(typeOfUnit,i, Fighting.DEFENSE, 0);
			if (strengthsTerrains[i][bonus]==null) strengthsTerrains[i][bonus]= [ typeOfUnit ]; //new Array
			else strengthsTerrains[i][bonus].push(typeOfUnit);
		}
	}
	//movement
	var speedTerrains = new Array(); //store the terrains that offer a given key bonus : terrainId -> bonusId -> Array of unitId
	for(var i=0; i<Place.TERRAIN_COUNT; i++) {
		speedTerrains[i]=new Array(); //array of bonuses for this given terrain
		for(var j=-1; j<Place.TERRAIN_COUNT; j++) { //look for bonus for each possible unit,  -1 for wizard
			var typeOfUnit;
			if (j==-1) typeOfUnit=Unit.WIZARD; else typeOfUnit=Unit.typeRecruitedOn(j);
			var bonus = Unit.movementFactorOfType(typeOfUnit,i,0);
			if (speedTerrains[i][bonus]==null) speedTerrains[i][bonus]= [ typeOfUnit ]; //new Array
			else speedTerrains[i][bonus].push(typeOfUnit);
		}
	}
	*/
	
	//one row per type of terrain
	for(j=0; j<Place.TERRAIN_COUNT; j++) { 
	
		var htmlRow= document.createElement("tr");
		
		//Terrain type
		var htmlCell= document.createElement("td");
		if (j==-1) htmlCell.innerHTML=""; 
		else { htmlCell.innerHTML=InfoMessages["Terrain"+j]; Map.InsertImage("./images/terrain" + j + ".png", null, htmlCell); }
		htmlRow.appendChild(htmlCell);
		
		//revenue of terrain
		var htmlCell= document.createElement("td");
		htmlCell.innerHTML=Place.incomeOfTerrain(j) + " " + InfoMessages["MoneyUnitPerTurn"] ; htmlRow.appendChild(htmlCell);

		//duration of movement
		var htmlCell= document.createElement("td");
		htmlCell.innerHTML=Unit.movementFactorOfType(null,j) + " " + InfoMessages["MovementUnit"] ; htmlRow.appendChild(htmlCell);
		
		//---------------------------------------------- 
		//bonuses for each terrain
		//strengths
		/*
		var htmlCell= document.createElement("td");
		htmlCell.innerHTML="";
		for(var bonus=3; bonus>=0; bonus--) {
			if (bonus==1) continue; //ignore medium value
		
			//strenght
			if (strengthsTerrains[j][bonus]!=null) { //insert of each terrain that permits the given bonus
				if (htmlCell.innerHTML!="") htmlCell.innerHTML+="<br>";;
				htmlCell.innerHTML+= InfoMessages["Strength"+bonus];
				for (i=0; i<strengthsTerrains[j][bonus].length;i++) {
					Map.InsertImage("./images/unit" + strengthsTerrains[j][bonus][i] + ".png", null, htmlCell);
				}
			}			

			//speed
			if (speedTerrains[j][bonus]!=null) { //insert of each terrain that permits the given bonus
				if (htmlCell.innerHTML!="") htmlCell.innerHTML+=" ";;
				htmlCell.innerHTML+= InfoMessages["Speed"+bonus];
				for (i=0; i<speedTerrains[j][bonus].length;i++) {
					Map.InsertImage("./images/unit" + speedTerrains[j][bonus][i] + ".png", null, htmlCell);
				}
			}			
			

		}
		htmlRow.appendChild(htmlCell);
		*/
		//---------------------------------------------- 
		
		//regular unit
		var typeOfUnit=Unit.typeRecruitedOn(j);
		var htmlCell= document.createElement("td");
		htmlCell.innerHTML=InfoMessages["UnitName"+typeOfUnit] + " " + Unit.costOfType(typeOfUnit) + " " + InfoMessages["MoneyUnitPerTurn"]  + "<br>" + InfoMessages["UnitDescription"+typeOfUnit]; htmlRow.appendChild(htmlCell);
		

		//Magic type
		htmlCell= document.createElement("td");
		if (LearnedSpells.isSpellAMovement(j)) {
			htmlCell.innerHTML=InfoMessages["MagicAttackMovement"]; 
			//Map.InsertImage("./images/unit60.png", null, htmlCell);
			
		} else {
			htmlCell.innerHTML=InfoMessages["MagicAttackDistant"]; 
			//Map.InsertImage("./images/unit59.png", null, htmlCell);		
		}
		
		htmlCell.innerHTML += " <br> ";
		
		//htmlRow.appendChild(htmlCell);
		
		//Magic strength		
		//htmlCell= document.createElement("td");
		htmlCell.innerHTML+=InfoMessages["Strength"] + ' : ' + LearnedSpells.strength(j) + "<br>" + Math.round(LearnedSpells.rangeOfSpell(j)) + " " + InfoMessages["MagicRangeUnit"] ; //new Array(LearnedSpells.strength(j,0)+2).join('+'); 
		htmlRow.appendChild(htmlCell);
		
		htmlArray.appendChild(htmlRow);
	}
	
	while (htmlElementParent.firstChild) htmlElementParent.removeChild(htmlElementParent.firstChild);
	htmlElementParent.appendChild(htmlArray);
}
