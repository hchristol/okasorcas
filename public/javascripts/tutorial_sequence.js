/**
Sequence of events for tutorial 
*/

TIMER_BASE_DURATION_MS = 800;

TIMER_COUNT=0; //number of event
timer_match=0;

TUTO_MAP_COUNT=0; //index N of mapN.json file to be loaded during tutorial

//sequence of tutorial info
var tutorialNextTimer = function() {
	
	timer_match=0; //to match with TIMER_COUNT

	//reincarnation	
	nextMessage( "BIENVENUE DANS LE TUTORIEL\nDU HUITIEME SORTILEGE !");
	nextMessage( "Au début, je choisi un endroit\noù faire apparaitre mon mage");
	nextMessage( "Je sélectionne le menu réincarnation");
	nextMenu(InfoMessages["MenuReincarnation"]);
	nextMessage( "Dans ce menu,\nje sélectionne mon mage\n(dans mon cas, Ange)");
	nextMenu(People.WizardName[1]);
	nextMessage( "Ces ronds m'indiquent les endroits\noù je peux faire apparaitre mon mage\n(en gros : partout !)");
	nextClick(581,226);
	nextMessage( "Voici l'endroit que j'ai choisi");
	nextMessage( "Je ne peux rien faire d'autre\npour le moment\nJe VALIDE MES ORDRES !");
	nextMenu("<b>" + InfoMessages["MenuValidateOrders"] + "</b>" );
	nextMessage( "Plus qu'à attendre le lendemain !" );

	//recruiting
	nextMap();
	nextMessage( "Et voici la carte\ndu jour d'après\n\nMes copains sont là aussi\nOn va pouvoir se mettre\nsur la figure !");
	nextMessage( "Je vais recruter\nde nouvelles armées");
	nextClick(581,226); nextMenu(InfoMessages["MenuRecruit"]); 
	nextMessage( "Les ronds m'indiquent où je peux recruter :\nsur les territoires proches de mon mage");
	nextClick(528,190); nextClick(513,238); 
	nextMessage( "Je peux recruter jusqu'à\n4 UNITES à la fois");

	nextMessage( "L'unité recruté dépend du terrain\nPour plus d'info, consulter l'aide sur les terrains", 450, 50);
	nextMenu(InfoMessages["MenuTerainArray"]);
	timer_match+=5; if (TIMER_COUNT == timer_match) document.getElementById('viewTerrainRules').style.visibility="hidden";

	nextMessage( "Je suis limité par mon argent (cristaux)\nLe coût est indiqué à côté");
	nextMessage( "L'état des finances de chaque mage\nest aussi consultable en détail\nà partir du menu Info Revenu", 450, 50);
	nextMenu(InfoMessages["MenuRevenue"]);
	timer_match+=3; if (TIMER_COUNT == timer_match) document.getElementById('viewIncomes').style.visibility="hidden";
	
	nextMessage( "Hop ! Je valide mes ordres\net j'attends le lendemain !" );
	nextMenu("<b>" + InfoMessages["MenuValidateOrders"] + "</b>" );
	
	//learning spell
	nextMap();
	nextMessage( "Le lendemain, mes copains\naussi ont recruté\n\nLes têtes de morts indiquent\nqu'il y a eu des combats");
	
	TIMER_COUNT++;
	
}

var nextMessage = function (txt, x, y, clear) {
	if (x==null) { x=50; y=100;};
	if (clear==null) clear=true;
	if (TIMER_COUNT == timer_match) {
		if (clear) clearMessage();
		Map.InsertCommentInCanvas( CANVAS_TUTORIAL, txt, new Point(x, y), 20 );
	}
	timer_match+= Math.round(txt.length / 18); //wait more when text is longer
}

var nextMenu = function( menuName, clearMessage ) {
	
	if (clearMessage==null) clear=false;
	
	//select menu first
	if (TIMER_COUNT == timer_match) {
		if (clearMessage) clearMessage();
		MenuSelectItem(MENU_TUTORIAL[ menuName ], "menu", "selectedMenu");
	}
	
	//...then send click on it
	if (TIMER_COUNT == timer_match + 2) {
		MENU_TUTORIAL[ menuName].fakeClick();
		MENU_TUTORIAL[ menuName].className="menu"; //unselect menu
	}
	
	timer_match+=3; //wait more
}

var nextClick = function( x, y, clearMessage) {
	if (clearMessage==null) clear=false;
	if (TIMER_COUNT == timer_match) {
		if (clearMessage) clearMessage();
		INPUT_ORDER.onClick( new Point(x, y) );
	}
	timer_match+=2;
}


var nextMap = function() {
	if (TIMER_COUNT == timer_match) {
		TUTO_MAP_COUNT++; loadMap();
	}
	timer_match+=2;
}

var clearMessage = function() { CANVAS_TUTORIAL.clearRect(0, 0, 2000, 2000); }