InfoMessages = new Array();

/** French translatation of game messages **/
InfoMessages["MenuReincarnation"] = "Réincarner<br>un magicien";
InfoMessages["MenuDiplo"] = "Diplomatie<br>entre mages";
InfoMessages["MenuRevenue"] = "Info<br>Revenus";
InfoMessages["MenuReplay"] = "Carte<br>précédente";
InfoMessages["MenuReplayCancel"] = "Réafficher<br>carte actuelle";
InfoMessages["MenuNextTurnBeforeAttack"] = "Simuler<br>déplacements !"; 
InfoMessages["MenuNextTurn"] = "Simuler<br>la bataille !"; 
InfoMessages["MenuNextTurnCancel"] = "Réafficher<br>ordres actuels"; 
InfoMessages["MenuValidateOrders"] = "VALIDER<br>les ordres";
InfoMessages["MenuCancelOrders"] = "Effacer<br>les ordres";
InfoMessages["MenuLearnedSpells"] = "Sorts<br>connus";
InfoMessages["MenuTerainArray"] = "Tableau des terrains/unités";
InfoMessages["MenuRecruit"] = "Recruter <br> une unité";
InfoMessages["MenuMovement"] = "Se <br> déplacer";
//InfoMessages["MenuSpellLearn"] = "Apprendre <br> Sortilège";
InfoMessages["MenuSpellThrow"] = "Attaque <br> magique !";
InfoMessages["MenuStrengthDisplayYes"] = "Afficher<br>Forces";
InfoMessages["MenuStrengthDisplayNo"] = "Masquer<br>Forces";
InfoMessages["AlertClickOnYourUnit"] = "Cliquez sur une unité vous appartenant !";
InfoMessages["InfoOrdersValidated"] = "Bien Maître, vos ordres ont été envoyés !";
InfoMessages["InfoOrdersEmpty"] = "Aucun ordre passé, maître. Un peu surmené, peut-être ?";
InfoMessages["InfoOrdersThereAreStillTooCrowdedPlaces"]="Pas plus de deux unités par territoire, modifiez vos ordres !";
InfoMessages["AlertOutOfRange"] = "Territoire hors de portée !";

InfoMessages["Terrain" + Place.PLAIN ] = "Plaine";
InfoMessages["Terrain" + Place.FOREST ]  = "Forêt";
InfoMessages["Terrain" + Place.MOUNTAIN ] = "Montagne";
InfoMessages["Terrain" + Place.SEA ] = "Mer";
InfoMessages["Terrain" + Place.DESERT ] = "Désert";
InfoMessages["Terrain" + Place.CITY ] = "Cité";
InfoMessages["Terrain" + Place.VOLCANO ] = "Volcan";
InfoMessages["Terrain" + Place.HILL ] = "Colline";

InfoMessages["UnitName" + Unit.CORSAIR] = "Corsaire";
InfoMessages["UnitDescription" + Unit.CORSAIR] = "Fort et rapide sur mer. Faible et lent ailleurs.";
InfoMessages["UnitName" + Unit.BOWMAN] = "Elfe";
InfoMessages["UnitDescription" + Unit.BOWMAN] = "Rapide en forêt. Force augmentée en défense et en soutien.";
InfoMessages["UnitName" + Unit.DWARF] = "Nain";
InfoMessages["UnitDescription" + Unit.DWARF] = "Rapide et fort sur les montagnes et volcans.";
InfoMessages["UnitName" + Unit.RIDER] = "Cavalier";
InfoMessages["UnitDescription" + Unit.RIDER] = "Rapidité augmentée partout, sauf sur mer. Force en attaque augmentée sur plaine et désert.";
InfoMessages["UnitName" + Unit.PLUNDERER] = "Pillard";
InfoMessages["UnitDescription" + Unit.PLUNDERER] = "Force en attaque augmentée, force en soutien diminuée.";
InfoMessages["UnitName" + Unit.TREBUCHET] = "Trébuchet";
InfoMessages["UnitDescription" + Unit.TREBUCHET] = "Très fort, particulièrement sur les cités, mais très lent. Inefficace sur mer.";
InfoMessages["UnitName" + Unit.DRAGON] = "Dragon";
InfoMessages["UnitDescription" + Unit.DRAGON] = "Unité volante, rapide et forte partout. Inefficace cependant en soutien.";
InfoMessages["UnitName" + Unit.PEASANT] = "Paysan";
InfoMessages["UnitDescription" + Unit.PEASANT] = "Unité peu onéreuse, faible en attaque et défense, mais utile en soutien. Un peu lente.";
for (var i=0; i<Place.TERRAIN_COUNT;i++) { //add immage
	InfoMessages["UnitName"+i] += " <img src=\"images/unit" + i + ".png\"></img>";
}
InfoMessages["UnitName"+Unit.WIZARD] = "Mage <img src=\"images/unit" + Unit.WIZARD + ".png\"></img>";

InfoMessages["Strength"] = "Force";
InfoMessages["MagicRangeUnit"] = " de portée";

InfoMessages["TerrainCol1"] = "Terrain";
InfoMessages["TerrainCol2"] = "Revenus";
InfoMessages["TerrainCol3"] = "Durée indicative d'un déplacement <br> (1 tour = 1 mois virtuel)";
InfoMessages["TerrainCol4"] = "Unité recrutée<br>Coût, forces et faiblesses";
InfoMessages["TerrainCol5"] = "Attaque magique <br> lancée par le mage";
InfoMessages["MagicAttackDistant"] = "Distante";
InfoMessages["MagicAttackMovement"] = "Mouvement";

InfoMessages["Support"]="Envers : ->"

InfoMessages["IncomesCol1"] = "Mage";
InfoMessages["IncomesCol2"] = "En caisse";
InfoMessages["IncomesCol3"] = "Revenu / tour";
InfoMessages["MoneyUnit"] = "cristaux";
InfoMessages["MoneyUnitPerTurn"] = "cristaux/tour";

InfoMessages["MovementUnit"] = "jours";

InfoMessages["TooMuchRecruits"] = "Nombre maximum de recrues par tour atteint !";

InfoMessages["NoReincarnationWizardAlive"] = "Magicien bien vivant sur la carte ! Pas de réincarnation possible !" ;

//type of magic DEPRECATED
/*
InfoMessages["Magic0"]= "Redstone";
InfoMessages["Magic1"]= "Air";
InfoMessages["Magic2"]= "Sacré";
InfoMessages["Magic3"]= "Givre";
InfoMessages["Magic4"]= "Feu";
InfoMessages["Magic5"]= "Ombre";
InfoMessages["Magic6"]= "Arcanes";
InfoMessages["Magic6"]= "Démon";
*/