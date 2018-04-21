var flArrowPadSetUp = false;
var flArrowPadReadOnly = false; //2/20/15 by DW



function setupArrowPad (callback) {
	if (flArrowPadSetUp) {
		callback ();
		}
	else {
		readHttpFile ("http://fargo.io/code/shared/arrowpad.html", function (s) {
			$("body").prepend (s);
			flArrowPadSetUp = true;
			callback ();
			});
		}
	}
function arrowPadVisible () {
	if (flArrowPadSetUp) {
		return (document.getElementById ("idArrowPad").style.visibility == "visible");
		}
	else {
		return (false);
		}
	}
function updateArrowPad (canExpandCallback) {
	setupArrowPad (function () {
		var arrowEnable = function (idArrow, direction) {
			var arrow = document.getElementById (idArrow), flenabled; 
			if (opInTextMode () || getBoolean (localStorage.flReorgMode)) {
				flenabled = canReorg (direction);
				}
			else {
				flenabled = canGo (direction);
				}
			if (flenabled) {
				arrow.style.color = "white";
				}
			else {
				arrow.style.color = "gray";
				}
			}
		//expand button 
			var button = document.getElementById ("idExpandButton"); 
			var s = "Expand", classname = "btn disabled";
			if (opHasSubs ()) {
				if (opSubsExpanded ()) {
					s = "Collapse";
					}
				classname = "btn";
				}
			
			if (canExpandCallback != undefined) { //7/10/14 by DW
				if (canExpandCallback ()) { //it's enabled
					classname = "btn";
					s = "Expand";
					}
				}
			
			button.innerHTML = s;
			button.className = classname;
		//four arrows
			arrowEnable ("idLeftArrow", left);
			arrowEnable ("idRightArrow", right);
			arrowEnable ("idUpArrow", up);
			arrowEnable ("idDownArrow", down);
		//arrow mode button
			var button = document.getElementById ("idArrowModeButton"),  s = "Navigate"; 
			if (opInTextMode () || (localStorage.flReorgMode == "true")) {
				s = "Reorg";
				}
			button.innerHTML = s;
		//menu command string
			var s;
			if (arrowPadVisible ()) {
				s = "Hide arrow pad";
				}
			else {
				s = "Show arrow pad";
				}
			document.getElementById ("idArrowPadCommandString").innerHTML = s;
		});
	}
function arrowClick (direction) {
	if (direction == "right") {
		opExpand ();
		}
	if (opInTextMode () || (localStorage.flReorgMode == "true")) {
		opReorg (direction, 1);
		}
	else {
		opGo (direction, 1);
		}
	updateArrowPad ();
	}
function canGo (direction) {
	var cursor = $(opGetActiveOutliner()).concord ().op.getCursor (), x;
	switch (direction) {
		case up:
			x = cursor.prev ();
			break;
		case down:
			x = cursor.next ();
			break;
		case left:
			x = cursor.parents (".concord-node:first");
			break;
		case right:
			x = cursor.children("ol").children(".concord-node:first");
			break;
		}
	return (x.length == 1);
	}
function canReorg (direction) {
	var cursor = $(opGetActiveOutliner()).concord ().op.getCursor (), x;
	switch (direction) {
		case up:
			x = cursor.prev ();
			break;
		case down:
			x = cursor.next ();
			break;
		case left:
			x = cursor.parent ();
			return (!x.hasClass ("concord-root"));
		case right:
			x = cursor.prev ();
			break;
		}
	return (x.length == 1);
	}
function toggleExpand () {
	if (document.getElementById ("idExpandButton").innerHTML == "Expand") {
		opExpand ();
		}
	else {
		if (opHasSubs ()) {
			if (opSubsExpanded ()) {
				opCollapse ();
				}
			else {
				opExpand ();
				}
			updateArrowPad ();
			}
		else {
			speakerBeep ();
			}
		}
	}
function toggleReorgMode () {
	if (localStorage.flReorgMode == "false") {
		localStorage.flReorgMode = "true";
		}
	else {
		localStorage.flReorgMode = "false";
		}
	if (opInTextMode ()) {
		opSetTextMode (false);
		}
	updateArrowPad ();
	}
function hideArrowPad () {
	document.getElementById ("idArrowPad").style.visibility = "hidden";
	}
function showArrowPad () {
	setupArrowPad (function () {
		if (flArrowPadReadOnly) { //2/20/15 by DW
			localStorage.flReorgMode = "false";
			document.getElementById ("idArrowModeButton").disabled = true;
			}
		document.getElementById ("idArrowPad").style.visibility = "visible";
		});
	}
function toggleArrowPad () {
	if (arrowPadVisible ()) {
		hideArrowPad ();
		}
	else {
		showArrowPad ();
		}
	}
