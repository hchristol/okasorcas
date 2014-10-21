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
/*
	nextMessage( "BIENVENUE DANS LE TUTORIEL\nDU HUITIEME SORTILEGE !\n\nDans ce jeu vous êtes un magicien", 100, 100);
	nextArrow( 420,339, "Le but du jeu est d'emmener\nson mage sur 8 de ces tours");

	nextArrow(241,158); nextArrow(297,152); nextArrow(332,87); nextArrow(519,157); nextArrow(566,384); nextArrow(752,373); nextArrow(689,570);
	nextMessage( "Au début, je choisi un endroit\noù faire apparaitre mon mage");
	nextArrow( 999,23, "Je sélectionne \nle menu réincarnation");
	nextMenu(InfoMessages["MenuReincarnation"]);
	nextArrow( 888,40, "Dans ce menu,\nje sélectionne mon mage\n(dans mon cas, Ange)");
	nextMenu(People.WizardName[1]);
	nextMessage( "Ces ronds m'indiquent les endroits\noù je peux faire apparaitre mon mage\n(en gros : partout !)");
	nextClick(581,226);
	nextMessage( "Voici l'endroit que j'ai choisi");
	nextMessage( "Je ne peux rien faire d'autre\npour le moment\nJe VALIDE MES ORDRES !");
	nextMenu("<b>" + InfoMessages["MenuValidateOrders"] + "</b>" );
	nextMessage( "Plus qu'à attendre le lendemain !" );
*/	

	//recruiting
	nextMap();
	nextMessage( "Et voici la carte\ndu jour d'après");
	nextMessage( "Je vais recruter\nde nouvelles armées");
	nextClick(581,226); nextMenu(InfoMessages["MenuRecruit"]); 
	nextMessage( "Les ronds m'indiquent où je peux recruter :\nsur les territoires proches de mon mage\n\nJe peux recruter jusqu'à\n4 UNITES à la fois");
	nextClick(528,190); nextClick(513,238); 

	nextArrow( 996,307, "L'unité recruté dépend du terrain\nPour plus d'info, consulter l'aide sur les terrains");
	nextMenu(InfoMessages["MenuTerainArray"]);
	timer_match+=5; if (TIMER_COUNT == timer_match) document.getElementById('viewTerrainRules').style.visibility="hidden";

	nextArrow( 507,205, "Je suis limité par mon argent (cristaux)\nLe coût est indiqué à côté", 100, 100);
	nextArrow( 992,99, "L'état des finances de chaque mage\nest aussi consultable en détail\nà partir du menu Info Revenu");
	nextMenu(InfoMessages["MenuRevenue"]);
	timer_match+=3; if (TIMER_COUNT == timer_match) document.getElementById('viewIncomes').style.visibility="hidden";
	
	nextMessage( "Hop ! Je valide mes ordres\net j'attends le lendemain !" );
	nextMenu("<b>" + InfoMessages["MenuValidateOrders"] + "</b>" );
	
	
	
	/*
	//moving 
	nextMap();
	//nextMessage( "Le lendemain, mes copains\naussi ont recruté\n\nLes têtes de morts indiquent\nqu'il y a eu des combats");
	nextClick(534,188);
	nextMessage("Je veux déplacer\nmon cavalier", 500,100);
	nextClick(597,167);nextClick(646,212);nextClick(706,204);
	nextMessage("Plus il se déplace,\nplus sa force diminue.");
	nextClick(754,162);nextClick(798,126);
	nextMessage("Les territoires traversés me\nrapporteront des cristaux");
	
	nextMessage( "Je veux aussi déplacer\nmon mage vers une tour", 300, 300);
	nextClick(582,225); nextClick(582,225);
	nextMenu(InfoMessages["MenuMovement"]);
	nextClick(532,190);
	nextMessage( "Fini ! Je valide mes ordres", 100, 100 );
	nextMenu("<b>" + InfoMessages["MenuValidateOrders"] + "</b>" );
	*/
	
	//learnt spell and first fighting
	nextMap();
	
	/*
	nextMessage( "Carte du lendemain !\n\nJ'ai conquis de nouveaux territoires", 50, 100);
	nextMessage( "J'ai appris un sort automatiquement :\nune étoile rouge s'affiche à côté du mage\npour chaque sort appris", 565,200);
	*/
	
/*
	nextClick(537,193); nextMessage( "Je vais livrer mon\npremier combat", 600, 150);
	nextMenu(InfoMessages["MenuMovement"]);
	nextClick(473,189); nextClick(200,400);
	nextMessage( "Les forces de chaque camp s'affichent :\npour le moment, je gagne !");
	
	nextClick(410,118); nextMessage("Imaginons que mon adversaire\nsoit défendu par son cavalier", 100, 100); nextClick(433,164); nextClick(200,400);
	nextMessage( "Je peux SIMULER les ordres\nde mon adversaire...\n\n...et anticiper le résultat !\n\nMaintenant, mon adversaire est le plus fort\ncar son cavalier le soutient", 40, 250);
	
	nextClick(513,239); nextMessage("J'attaque avec une unité plus doué\nen attaque qu'en soutien...", 600, 150); nextClick(477,191); nextClick(200,400);
	nextMessage( "...et je reprends le dessus !");
	
*/

	//nextArrow(996,189, "En cliquant sur le menu\nde Simulation, je peux même\nvisualiser la carte\ntelle qu'elle sera\nau prochain tour !");
	TIMER_COUNT++;
	
}

TUTO_old_X=50; TUTO_old_Y=100; //current position of message
var nextMessage = function (txt, x, y, clear) {
	if (x==null) 
		{ x=TUTO_old_X; y=TUTO_old_Y;}
	else { TUTO_old_X=x; TUTO_old_Y=y; }
	if (clear==null) clear=true;
	if (TIMER_COUNT == timer_match) {
		if (clear) clearMessage();
		Map.InsertCommentInCanvas( CANVAS_TUTORIAL, txt, new Point(x, y), 20 );
	}
	
	timer_match+= nextMessageWaitFor(txt);  
	
}
//how long a message stay before passing to another event
var nextMessageWaitFor = function(txt) { return 1 + Math.round(txt.length / 20); }

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

var nextArrow = function( x, y, message ) {
	if (TIMER_COUNT == timer_match) {
		var dx=-60; dy=-60;
		if (message!=null)
			var dy_message = dy+20 - message.length/2;
		if (y<150) { dy=60; dy_message= 1.5 *dy; }
		if (message != null) clearMessage();
		CANVAS_TUTORIAL.strokeStyle = "brown"; CANVAS_TUTORIAL.fillStyle = "white"	;
		CANVAS_TUTORIAL.lineWidth = 10;
		CanvasDrawArrow(CANVAS_TUTORIAL,new Point(x+dx,y+dy), new Point(x,y), 2, 1, Math.PI/8, 20, 0) ;
		if (message != null) {
			nextMessage(message, x+dx - 100, y+dy_message, false );
		} 
	} else if (message!=null) timer_match+=nextMessageWaitFor(message); //increase waiting time when there has been a message
	
	
	timer_match++;
}


var nextMap = function() {
	if (TIMER_COUNT == timer_match) {
		clearMessage();
		TUTO_MAP_COUNT++; loadMap();
	}
	timer_match+=2;
}

var clearMessage = function() { CANVAS_TUTORIAL.clearRect(0, 0, 2000, 2000); }