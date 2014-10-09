/**
Sequence of events for tutorial 
*/

TIMER_COUNT=0; //number of event
timer_match=0;

var tutorialNextTimer = function() {
	TIMER_COUNT++;
	
	timer_match=0; //to match with TIMER_COUNT
	
	nextMessage( "BIENVENUE DANS LE TUTORIEL\nDU HUITIEME SORTILEGE !", 200, 200);
	nextMessage( "Choisissons un endroit\noù nous faire apparaitre notre mage", 400, 300);

	nextMenu(InfoMessages["MenuReincarnation"]);
	nextMenu(People.WizardName[1]);
	nextClick(581,226);
	
	
}

var nextMessage = function (txt, x, y, clear) {
	timer_match++;
	if (clear==null) clear=true;
	if (TIMER_COUNT == timer_match) {
		if (clear) clearMessage();
		Map.InsertCommentInCanvas( CANVAS_TUTORIAL, txt, new Point(x, y), 20 );
	}
}

var nextMenu = function( menuName, clearMessage ) {
	timer_match++;
	if (clearMessage==null) clear=false;
	if (TIMER_COUNT == timer_match) {
		if (clearMessage) clearMessage();
		MENU_TUTORIAL[ menuName].fakeClick();
	}
}

var nextClick = function( x, y, clearMessage) {
	timer_match++;
	if (clearMessage==null) clear=false;
	if (TIMER_COUNT == timer_match) {
		if (clearMessage) clearMessage();
		INPUT_ORDER.onClick( new Point(581,226) );
	}
}

var clearMessage = function() { CANVAS_TUTORIAL.clearRect(0, 0, 2000, 2000); }