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
	
	
	
	nextMap();
	nextMessage( "Et voici la carte\ndu jour d'après");
	
	TIMER_COUNT++;
	
}

var nextMessage = function (txt, x, y, clear) {
	if (x==null) { x=400; y=300;};
	if (clear==null) clear=true;
	if (TIMER_COUNT == timer_match) {
		if (clear) clearMessage();
		Map.InsertCommentInCanvas( CANVAS_TUTORIAL, txt, new Point(x, y), 20 );
	}
	timer_match+= Math.round(txt.length / 20); //wait more when text is longer
}

var nextMenu = function( menuName, clearMessage ) {
	
	if (clearMessage==null) clear=false;
	if (TIMER_COUNT == timer_match) {
		if (clearMessage) clearMessage();
		MENU_TUTORIAL[ menuName].fakeClick();
	}
	
	timer_match+=2; //wait more
}

var nextClick = function( x, y, clearMessage) {
	if (clearMessage==null) clear=false;
	if (TIMER_COUNT == timer_match) {
		if (clearMessage) clearMessage();
		INPUT_ORDER.onClick( new Point(581,226) );
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