/**
Sequence of events for tutorial 
*/

TIMER_COUNT=0; //number of event

var tutorialNextTimer = function() {
	TIMER_COUNT++;
	
	var iTimer=0; //to match with TIMER_COUNT
	
	iTimer++; if (TIMER_COUNT == iTimer) {
		Map.InsertCommentInCanvas( CANVAS_TUTORIAL, "BIENVENUE DANS LE TUTORIEL\nDU HUITIEME SORTILEGE !", new Point(200, 200), 20 );
	}

	iTimer++; if (TIMER_COUNT == iTimer) {
		INPUT_ORDER.onClick( new Point(643,358) );
	}
	
			
}
