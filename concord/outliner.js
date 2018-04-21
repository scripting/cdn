
document.write ("<script src=\"http://fargo.io/code/keypress.js\" /></script>");
document.write ("<script src=\"http://fargo.io/code/shared/beep.js\"></script>");

var idDefaultOutliner = "outliner";
var initialOpmltext = 
	"<?xml version=\"1.0\" encoding=\"ISO-8859-1\"?><opml version=\"2.0\"><head><title>Untitled</title></head><body><outline text=\"\"/></body></opml>";
var urlReadFileApi = "http://pub2.fargo.io:5347/httpReadUrl";
var opTypeIcons = {
	"blogpost": "file-text-o",
	"essay": "file-text-o", //2/11/13 by DW
	"code": "laptop",
	"css": "code", //5/2/15 by DW
	"directory": "folder-open-o",
	"discusstree": "comments",
	"home": "home",
	"html": "code",
	"icon-comment": "comment-o", //2/16/13 by DW
	"icon-star": "star-empty", //2/16/13 by DW
	"icon-time": "time", //2/16/13 by DW
	"icon-user": "user", //2/16/13 by DW
	"include": "mail-forward", //2/28/14 by DW
	"index": "file-text-o",
	"link": "bookmark-o",
	"outline": "file-text-o",
	"medium": "file-text-o", //2/12/14 by DW
	"photo": "camera",
	"presentation": "file-text-o",
	"redirect": "refresh",
	"river": "file-text-o",
	"rss": "rss",
	"tabs": "file-text-o",
	"thread": "comments",
	"thumblist": "th",
	"profile": "user", //5/14/13 by DW
	"calendar": "calendar", //6/3/13 by DW
	"markdown": "file-text-o", //6/3/13 by DW
	"tweet": "twitter", //6/10/13 by DW
	"idea": "lightbulb-o", //3/11/14 by DW
	"metaWeblogPost": "file-text-o",
	"twitterFriend": "user" //6/27/14 by DW
	}

function opGetActiveOutliner () {
	return ("#" + idDefaultOutliner);
	}
function opImportOpmlIntoOutline (opmlurl, idoutline) { //11/3/14 by DW
	if (idoutline === undefined) {
		idoutline = opGetActiveOutliner ();
		}
	readHttpFileThruProxy (opmlurl, undefined, function (opmltext) {
		if (opmltext != undefined) {
			var id = "#" + idoutline;
			$(id).concord ().op.insertXml (opmltext, down); 
			$(id).concord ().op.go (down, 1); 
			}
		else {
			alertDialog ("Can't import the outline because there was an error reading the file.");
			}
		});
	}
function opGetAttsDisplayString () {
	var bc = opGetBarCursor (), atts = bc.attributes.getAll ();
	function hasAtLeastOne (s, ch) { 
		for (var i = 0; i < s.length; i++) {
			if (s [i] == ch) {
				return (true);
				}
			}
		return (false)
		}
	var str = '', attvalstring, flTruncateValues = false, maxAttValueLength = 10;
	if (appPrefs.flTruncateAttValues !== undefined) {
		flTruncateValues = appPrefs.flTruncateAttValues;
		}
	if (appPrefs.maxAttValueLength !== undefined) { //7/19/16 by DW
		maxAttValueLength = appPrefs.maxAttValueLength;
		}
	for (var p in atts) {
		if (atts.hasOwnProperty (p)) {
			if (p != "created") {
				attvalstring = atts [p];
				if (!hasAtLeastOne (attvalstring, " ")) {
					if ((attvalstring.length > maxAttValueLength) && flTruncateValues) {
						attvalstring = attvalstring.slice (0, maxAttValueLength - 1) + "..";
						}
					}
				//hot up urls -- 12/22/14 by DW
					if (beginsWith (stringLower (atts [p]), "http://")) {
						attvalstring = "<a href=\"" + atts [p] + "\" target=\"_blank\">" + attvalstring + "</a>";
						}
				if (str.length > 0) {
					str += ", "
					}
				str += p + '=' + attvalstring;
				}
			}
		}
	if (str.length > 0) {
		str += ".";
		}
	return (str);
	}
function opDisplayAttributes (idDisplay) {
	if (idDisplay === undefined) {
		idDisplay = "idAttributesDisplay";
		}
	var attsdisplayobject = document.getElementById (idDisplay);
	if (attsdisplayobject != null) {
		var s = opGetAttsDisplayString ();
		if (s.length > 0) {
			s = "Atts: " + s;
			}
		if (s != attsdisplayobject.innerHTML) {
			attsdisplayobject.innerHTML = s;
			}
		}
	}
function opEraseCursor () {
	try {
		$(opGetActiveOutliner()).concord ().root.find ('.concord-cursor').removeClass ('selected concord-cursor');  
		}
	catch (err) {
		console.log ("opEraseCursor: error == " + err);
		}
	}
function opExpandHeadWithId (id, callback) { //12/18/14 by DW
	opVisitAll (function (head) {
		var created = head.attributes.getOne ("created");
		if (created != undefined) {
			if (id == Number (new Date (created))) { //found it
				console.log ("opExpandHeadWithId: found headline with id == " + id + " at " + head.getLineText ());
				opEraseCursor (); //2/9/15 by DW
				expandToCursor (head);
				opSetCursor (head.getCursor ());
				head.expand ();
				if (callback != undefined) {
					callback (head);
					}
				return (false);
				}
			}
		return (true); //keep looking
		});
	}
function opInsertCallback (headline) {
	var atts = {};
	atts.created = new Date ().toUTCString (); 
	headline.attributes.addGroup (atts);
	}
function opKeystrokeCallback (event) {
	var now = new Date ();
	whenLastKeystroke = now; 
	whenLastUserAction = now;
	}
function opExpandCallback () { //12/31/14 by DW
	try {
		var type = opGetOneAtt ("type"), url = opGetOneAtt ("url");
		if ((type == "link") && (url != undefined)) {
			window.open (url);
			return;
			}
		if ((type == "include") && (url != undefined)) { //2/16/15 by DW
			var headers = {"Accept": "text/x-opml"}; //7/17/15 by DW -- the same header the OPML Editor uses for includes.
			console.log ("opExpandCallback: headers = " + jsonStringify (headers));
			readHttpFile (url, function (s) {
				console.log ("opExpandCallback: expanding the include == " + url);
				console.log ("opExpandCallback: s == " + s);
				opDeleteSubs ();
				opInsertXml (s, right); 
				opClearChanged ();
				}, undefined, headers);
			}
		}
	catch (err) {
		console.log ("opExpandCallback: error == " + err.message);    
		}
	}
function opCollapseCallback () { //2/17/15 by DW
	switch (opGetOneAtt ("type")) {
		case "include":
			opDeleteSubs ();
			console.log ("opCollapseCallback: deleted the subs.");
			break;
		}
	}
function opNewPost (s, flSetIcon, attsForNewNode) { //1/26/15 by DW
	var nameUpdatedIcon = "bolt", insertedNodeType, nextCreatedAtt;
	var now = new Date (), yearstring = now.getFullYear (), ms = monthToString (), monthstring = ms + " " + yearstring;
	var daystring = ms + " " + now.getDate (), flTypeSet = false;
	function doInsertForNewPost (s, dir) { //12/22/14 by DW
		var attstring = nextCreatedAtt.toUTCString ();
		opInsert (s, dir);
		opSetOneAtt ("created", attstring);
		nextCreatedAtt = new Date (Number (nextCreatedAtt) + 1000); //make sure the timestamps are different
		}
	function setInsertedNodeType () { //7/14/13 by DW
		var theNode = opGetBarCursor ();
		insertedNodeType = appPrefs.typeInsertedNode; //default
		
		if (insertedNodeType == undefined) { //6/24/14 by DW
			insertedNodeType = "";
			}
		
		var headers = opGetHeaders () //1/6/14 by DW;
		if ((headers.typeInsertedNode != undefined) && (headers.typeInsertedNode.length > 0)) { 
			insertedNodeType = headers.typeInsertedNode; 
			}
		
		theNode.visitToSummit (function (headline) { //look for a parent with an insertedNodeType att
			var type = headline.attributes.getOne ("insertedNodeType");
			if (type != undefined) {
				insertedNodeType = type;
				return (false);
				}
			return (true); //keep visiting
			});
		}
	function setCalendarHomeAtts () { //7/20/13 by DW
		var now = new Date (), yearstring = now.getFullYear ();
		if (opGetOneAtt ("name") == undefined) { //6/6/13 by DW
			opSetOneAtt ("name", yearstring);
			}
		if (opGetOneAtt ("icon") == undefined) { //6/11/13 by DW
			opSetOneAtt ("icon", "calendar");
			}
		if (opGetOneAtt ("type") == "calendar") { //6/11/13 by DW
			opDeleteAtt ("type");
			}
		}
	function findYearAtTopLevel () { //6/3/13 by DW
		var now = new Date (), yearstring = now.getFullYear (), type;
		opFirstSummit ();
		while (true) {
			if (opGetLineText () == yearstring) {
				break;
				}
			if (!opGo (down, 1)) {
				opFirstSummit ();
				doInsertForNewPost (yearstring, up);
				break;
				}
			}
		setCalendarHomeAtts ();
		}
	function findYearAnywhere () { //7/20/13 by DW
		var now = new Date (), yearstring = now.getFullYear (), flfound = false;
		opVisitAll (function (headline) {
			if (headline.getLineText () == yearstring) {
				expandToCursor (headline);
				opSetCursor (headline.getCursor ());
				flfound = true;
				return (false)
				}
			return (true); //keep looking
			});
		if (!flfound) {
			opFirstSummit ();
			doInsertForNewPost (yearstring, up);
			}
		setCalendarHomeAtts ();
		}
	function findMonthAnywhere () { //2/22/15 by DW
		var flfound = false;
		opVisitAll (function (headline) {
			if (headline.getLineText () == monthstring) {
				expandToCursor (headline);
				opSetCursor (headline.getCursor ());
				flfound = true;
				return (false); //stop looking
				}
			return (true); //keep looking
			});
		if (!flfound) {
			opFirstSummit ();
			doInsertForNewPost (monthstring, up);
			opSetOneAtt ("name", innerCaseName (monthstring)); //4/23/15 by DW
			}
		}
	function setNewPostType (flSetIcon) { //6/11/13 by DW
		if (insertedNodeType.length > 0) {
			opSetOneAtt ("type", insertedNodeType);
			}
		else {
			if (flSetIcon) {
				opSetOneAtt ("icon", nameUpdatedIcon);
				}
			}
		if ((appPrefs.flPlusIconAddsFeedItem != undefined) && appPrefs.flPlusIconAddsFeedItem) { //6/20/13 by DW
			opSetOneAtt ("isFeedItem", "true");
			}
		if ((appPrefs.flInsertComments != undefined) && appPrefs.flInsertComments) { //7/12/13 by DW -- insert as a comment if pref is set and it's a named outline
			var headers = getActiveHeaders ();
			if (headers.link != undefined) { //it's a named outline
				op.makeComment (); //7/28/13 by DW
				}
			}
		}
	function didSimplifiedInsert () { //6/11/17 by DW
		var origcursor = opGetCursor ();
		if (opGo (left, 1)) {
			if (opGetOneAtt ("name") == now.getDate ()) {
				if (opGo (left, 1)) {
					if (opGetOneAtt ("name") == innerCaseName (monthstring)) {
						opSetCursor (origcursor);
						doInsertForNewPost ("", down);
						setNewPostType ();
						opSetTextMode (true);
						return (true);
						}
					}
				}
			}
		return (false);
		}
	
	nextCreatedAtt = now; //12/22/14 by DW
	setInsertedNodeType (); //7/14/13 by DW
	if (flSetIcon == undefined) {
		flSetIcon = true;
		}
	flExpandCallbackDisabled = true; //3/14/13 by DW
	
	if (getBoolean (appPrefs.flSimplifiedInsertPossible)) { //6/11/17 by DW
		if (didSimplifiedInsert ()) {
			return;
			}
		}
	
	if (getBoolean (appPrefs.flPlusIconMonthBased)) { //2/22/15 by DW
		findMonthAnywhere (); 
		}
	else {
		findYearAnywhere (); //7/20/13 by DW
		//do the month
			if (opHasSubs ()) { 
				if (!opSubsExpanded ()) {
					opExpand ();
					}
				opGo (right, 1);
				if (opGetLineText () != monthstring) {
					doInsertForNewPost (monthstring, up);
					}
				}
			else {
				doInsertForNewPost (monthstring, right);
				}
			if (opGetOneAtt ("name") == undefined) { //6/6/13 by DW
				opSetOneAtt ("name", padWithZeros (now.getMonth () + 1, 2));
				}
		}
	//do the day
		if (opHasSubs ()) { 
			if (!opSubsExpanded ()) {
				opExpand ();
				}
			opGo (right, 1);
			if (opGetLineText () != daystring) {
				doInsertForNewPost (daystring, up);
				}
			}
		else {
			doInsertForNewPost (daystring, right);
			}
		if (opGetOneAtt ("name") == undefined) { //6/6/13 by DW
			opSetOneAtt ("name", padWithZeros (now.getDate (), 2));
			}
	
	if (!appPrefs.flOneNotePerDay) {
		doInsertForNewPost (timeString (now, true), right);
		setNewPostType (flSetIcon); flTypeSet = true;
		}
	
	if (s == undefined) {
		doInsertForNewPost ("", right);
			opSetTextMode (true);
		}
	else {
		doInsertForNewPost (s, right);
		}
	
	if (attsForNewNode != undefined) { //6/24/14 by DW
		opSetAllAtts (attsForNewNode);
		if (!flTypeSet) {
			flTypeSet = attsForNewNode.type != undefined;
			}
		}
	
	if (!flTypeSet) {
		setNewPostType (flSetIcon); flTypeSet = true;
		}
	
	flExpandCallbackDisabled = false; //3/14/13 by DW
	
	
	opMarkChanged (); //1/26/15 by DW
	}
function opGetMywordJstruct (theNode) { //2/15/15 by DW
	if (theNode == undefined) {
		theNode = opGetBarCursor ();
		}
	function getImg (headline) {
		var urlImg;
		headline.visitToSummit (function (theNode) {
			var img = theNode.attributes.getOne ("img");
			if (img != undefined) {
				urlImg = img;
				return (false); //stop looking
				}
			return (true); //keep looking
			});
		
		if (urlImg === undefined) { //2/19/15 by DW
			if (appPrefs.defaultImage !== undefined) {
				if (appPrefs.defaultImage.length > 0) {
					urlImg = appPrefs.defaultImage;
					}
				}
			}
		
		return (urlImg);
		}
	function notComment (headline) {
		return (!getBoolean (headline.attributes.getOne ("isComment")));
		}
	function addsubs (adrx) {
		var theSubs = new Array ();
		adrx.visitLevel (function (headline) {
			if (notComment (headline)) {
				var linetext = headline.getLineText ();
				if (headline.countSubs () > 0) {
					var sub = new Object ();
					sub.title = linetext;
					sub.subs = addsubs (headline);
					theSubs [theSubs.length] = sub;
					}
				else {
					theSubs [theSubs.length] = linetext;
					}
				}
			});
		return (theSubs);
		}
	var jstruct = new Object (), atts = theNode.attributes.getAll ();
	jstruct.title = theNode.getLineText ();
	jstruct.description = atts.description;
	jstruct.authorname = appPrefs.authorName;
	
	if (appPrefs.authorWebsite !== undefined) { //2/19/15 by DW
		if (appPrefs.authorWebsite.length > 0) {
			jstruct.authorwebsite = appPrefs.authorWebsite;
			}
		}
	
	jstruct.when = atts.created;
	jstruct.img = getImg (theNode); //walk to summit
	jstruct.subs = addsubs (theNode);
	return (jstruct);
	}
function opVisitSubs (theNode, callback, level) { //3/2/15 by DW
	if (level === undefined) {
		level = 0;
		}
	theNode.visitLevel (function (subnode) {
		if (callback !== undefined) {
			if (!callback (subnode, level)) {
				return (false);
				}
			}
		if (subnode.countSubs () > 0) {
			if (!opVisitSubs (subnode, callback, level + 1)) {
				return (false);
				}
			}
		return (true);
		});
	return (true);
	}
function opOutlineIsEmpty () { //4/10/15 by DW 
	var flempty = true;
	opVisitAll (function (headline) {
		var s = trimWhitespace (headline.getLineText ());
		if (s.length > 0) {
			flempty = false;
			return (false); //stop visiting
			}
		return (true);
		});
	return (flempty);
	}
function opToJstruct (theNode, flSubsOnly, flAddCollapseAtts) { //4/25/15 by DW
	var theOutline = new Object (), currentSubsList = new Array ();
	function copyAtts (fromNode, toObject) {
		var atts = fromNode.attributes.getAll ();
		for (var x in atts) {
			toObject [x] = atts [x];
			}
		if (flAddCollapseAtts) { //5/1/15 by DW
			if (fromNode.countSubs () > 0) {
				if (!fromNode.subsExpanded ()) {
					toObject.collapse = true;
					}
				}
			}
		}
	if (flSubsOnly === undefined) {
		flSubsOnly = false;
		}
	if (flAddCollapseAtts === undefined) { //5/1/15 by DW
		flAddCollapseAtts = false;
		}
	if (!flSubsOnly) {
		theOutline.text = theNode.getLineText ();
		copyAtts (theNode, theOutline);
		}
	theOutline.subs = currentSubsList;
	function visit (sub) {
		var thisSubsObject = new Object ();
		thisSubsObject.text = sub.getLineText ();
		copyAtts (sub, thisSubsObject);
		currentSubsList [currentSubsList.length] = thisSubsObject;
		if (sub.countSubs () > 0) {
			var savedSubs = currentSubsList;
			currentSubsList = new Array ();
			thisSubsObject.subs = currentSubsList;
			sub.visitLevel (visit);
			currentSubsList = savedSubs;
			}
		return (true);
		}
	theNode.visitLevel (visit);
	return (theOutline);
	}

function opDoFind (lookfor, fldialog) { //4/30/15 by DW
	var lowerlookfor = lookfor.toLowerCase (), flfound = false;
	var flpastcursor = false, startmarker = getRandomPassword (10);
	opSetOneAtt ("fargoFindStart", startmarker);
	opVisitAll (function (headline) {
		if (flpastcursor) {
			var lowerlinetext = headline.getLineText ().toLowerCase ();
			if (lowerlinetext.indexOf (lowerlookfor) != -1) {
				expandToCursor (headline);
				opSetCursor (headline.getCursor ());
				flfound = true;
				return (false);
				}
			}
		else {
			if (headline.attributes.getOne ("fargoFindStart") == startmarker) {
				flpastcursor = true;
				}
			}
		return (true);
		});
	if (!flfound) { //effectively loop back to the top -- 9/4/13 by DW
		opVisitAll (function (headline) {
			if (headline.attributes.getOne ("fargoFindStart") == startmarker) { //we've reached the place we started, not found.
				return (false);
				}
			var lowerlinetext = headline.getLineText ().toLowerCase ();
			if (lowerlinetext.indexOf (lowerlookfor) != -1) {
				op.expandTo (headline);
				flfound = true;
				return (false);
				}
			return (true);
			});
		}
	//delete the fargoFindStart att -- 9/6/13 by DW
		opVisitAll (function (headline) {
			if (headline.attributes.getOne ("fargoFindStart") != undefined) {
				var atts = headline.attributes.getAll ();
				delete atts ["fargoFindStart"];
				headline.attributes.addGroup (atts);
				}
			return (true); //keep going
			});
	if (!flfound) {
		speakerBeep ();
		if (fldialog) {
			dialog.alert ("Not found!");
			}
		}
	}
function opFindCommand () { //4/30/15 by DW
	var defaultValue = appPrefs.lastFindString;
	askDialog ("String to search for?", defaultValue, "Type something you want to find here.", function (lookfor) {
		if (lookfor != appPrefs.lastFindString) {
			appPrefs.lastFindString = lookfor; 
			prefsChanged ();
			}
		opDoFind (lookfor, true);
		});
	}
function opFindAgainCommand () { //4/30/15 by DW
	if (appPrefs.lastFindString.length > 0) {
		opDoFind (appPrefs.lastFindString, false);
		}
	else {
		speaker.beep ();
		alertDialog ("Can't Find because there is no search string.");
		}
	}
function opChangeButDontMarkChange (callback) { //5/3/15 by DW
	var flchanges = opHasChanged ();
	callback (); //something that will mark the outline as changed
	if (!flchanges) {
		opClearChanged ();
		}
	}
function opSetNameAtt (theNode) { //5/3/15 by DW
	var name = innerCaseName (theNode.getLineText ());
	theNode.attributes.setOne ("name", name);
	return (name);
	}

function opInitOutliner (opmltext, flReadOnly, flSetFocus) {
	function initOutlinerKeystrokes () {
		myCombos = [
			{ //cmd-comma to expand
				"keys": "meta ,",
				"is_ordered": true,
				"on_keydown": function (ev) {
					opExpand ();
					event.stopPropagation ();
					event.preventDefault ();
					return (false);
					}
				},
			{ //cmd-period to collapse
				"keys": "meta .",
				"is_ordered": true,
				"on_keydown": function (ev) {
					opCollapse ();
					event.stopPropagation ();
					event.preventDefault ();
					return (false);
					}
				},
			{ //cmd-f to find
				"keys": "meta f",
				"is_ordered": true,
				"on_keydown": function (ev) {
					opFindCommand ();
					event.stopPropagation ();
					event.preventDefault ();
					return (false);
					}
				},
			{ //cmd-g to find-again
				"keys": "meta g",
				"is_ordered": true,
				"on_keydown": function (ev) {
					opFindAgainCommand ();
					event.stopPropagation ();
					event.preventDefault ();
					return (false);
					}
				}
			];
		keypress.register_many (myCombos);
		}
	var theFont = "Ubuntu", theFontSize = 18, theLineHeight = 28;
	flConcordScrollEnabled = true;
	ctPixelsAboveOutlineArea = 0;
	if (flReadOnly === undefined) {
		flReadOnly = false;
		}
	try {
		if (appPrefs.outlineFont != undefined) {
			theFont = appPrefs.outlineFont;
			}
		if (appPrefs.outlineFontSize != undefined) {
			theFontSize = appPrefs.outlineFontSize;
			}
		if (appPrefs.outlineLineHeight != undefined) {
			theLineHeight = appPrefs.outlineLineHeight;
			}
		}
	catch (err) {
		}
	$(opGetActiveOutliner ()).concord ({
		"prefs": {
			"outlineFont": theFont, 
			"outlineFontSize": theFontSize, 
			"outlineLineHeight": theLineHeight,
			"renderMode": true,
			"readonly": flReadOnly,
			"typeIcons": opTypeIcons
			},
		"callbacks": {
			"opInsert": function (op) {
				opInsertCallback (op);
				},
			"opCursorMoved": function (op) {
				},
			"opExpand": function (op) {
				whenLastUserAction = new Date (); 
				opExpandCallback (); //12/31/14 by DW
				},
			"opHover": function (op) {
				},
			"opKeystroke": function (event) {
				opKeystrokeCallback (event);
				}
			}
		});
	if (opmltext != undefined) {
		opXmlToOutline (opmltext, true); //flSetFocus param not passed, see comment under Changes, above
		}
	initOutlinerKeystrokes (); //4/30/15 by DW
	}
//glue routines
	function opGetBarCursor () { //11/12/14 by DW
		return ($(opGetActiveOutliner ()).concord ().op.getCursorRef ());
		}
	function opGetCursorContext () { //1/27/15 by DW
		var theCursor = $(opGetActiveOutliner ()).concord ().op.getCursor ();
		return ($(opGetActiveOutliner ()).concord ().op.setCursorContext (theCursor))
		}
	function opUndo () {
		return ($(opGetActiveOutliner ()).concord ().op.undo ())
		}
	function opCut () {
		return ($(opGetActiveOutliner ()).concord ().op.cut ())
		}
	function opCopy () {
		return ($(opGetActiveOutliner ()).concord ().op.copy ())
		}
	function opPaste () {
		return ($(opGetActiveOutliner ()).concord ().op.paste ())
		}
	function opReorg (dir, count) {
		return ($(opGetActiveOutliner ()).concord().op.reorg (dir, count));
		}
	function opSetFont (font, fontsize, lineheight) {
		$(opGetActiveOutliner ()).concord().prefs({"outlineFont": font, "outlineFontSize": fontsize, "outlineLineHeight": lineheight});
		}
	function opPromote () {
		$(opGetActiveOutliner ()).concord().op.promote();
		}
	function opDemote () {
		$(opGetActiveOutliner ()).concord().op.demote();
		}
	function opBold () {
		return ($(opGetActiveOutliner ()).concord().op.bold ());
		}
	function opItalic () {
		return ($(opGetActiveOutliner ()).concord().op.italic ());
		}
	function opLink (url) {
		return ($(opGetActiveOutliner ()).concord().op.link (url));
		}
	function opSetTextMode (fltextmode) {
		$(opGetActiveOutliner ()).concord ().op.setTextMode (fltextmode);
		}
	function opInTextMode () {
		return ($(opGetActiveOutliner ()).concord ().op.inTextMode ());
		}
	function opGetAtts () {
		return $(opGetActiveOutliner ()).concord().op.attributes.getAll();
		}
	function opGetOneAtt (name) {
		return $(opGetActiveOutliner ()).concord().op.attributes.getOne (name);
		}
	function opHasAtt (name) {
		return (opGetOneAtt (name) != undefined);
		}
	function opSetOneAtt (name, value) {
		return $(opGetActiveOutliner ()).concord().op.attributes.setOne (name, value);
		}
	function opSetAtts (atts) {
		return $(opGetActiveOutliner ()).concord().op.attributes.setGroup(atts);
		}
	function opAddAtts (atts) { //2/1/13 by DW
		return $(opGetActiveOutliner ()).concord().op.attributes.addGroup(atts);
		}
	function opSetStyle (css) {
		return $(opGetActiveOutliner ()).concord ().op.setStyle (css);
		}
	function opGetLineText () {
		return ($(opGetActiveOutliner ()).concord().op.getLineText());
		}
	function opExpand () {
		return ($(opGetActiveOutliner ()).concord().op.expand());
		}
	function opExpandAllLevels () {
		return ($(opGetActiveOutliner ()).concord().op.expandAllLevels());
		}
	function opExpandEverything () {
		return ($(opGetActiveOutliner ()).concord().op.fullExpand());
		}
	function opCollapse () {
		return ($(opGetActiveOutliner ()).concord().op.collapse());
		}
	function opIsComment () {
		return ($(opGetActiveOutliner ()).concord ().script.isComment ());
		}
	function opMakeComment () {
		return ($(opGetActiveOutliner ()).concord ().script.makeComment ());
		}
	function opUnComment () {
		return ($(opGetActiveOutliner ()).concord ().script.unComment ());
		}
	function opToggleComment () {
		if (opIsComment ()) {
			opUnComment ();
			}
		else {
			opMakeComment ();
			}
		}
	function opCollapseEverything () {
		return ($(opGetActiveOutliner ()).concord().op.fullCollapse());
		}
	function opInsert (s, dir) {
		return ($(opGetActiveOutliner ()).concord().op.insert(s, dir));
		}
	function opInsertImage (url) {
		return ($(opGetActiveOutliner ()).concord ().op.insertImage (url));
		}
	function opSetLineText (s) {
		return ($(opGetActiveOutliner ()).concord().op.setLineText(s));
		}
	function opDeleteLine () { //11/7/14 by DW
		$(opGetActiveOutliner ()).concord().op.deleteLine ();
		}
	function opDeleteSubs () {
		return ($(opGetActiveOutliner ()).concord().op.deleteSubs());
		}
	function opCountSubs () {
		return ($(opGetActiveOutliner ()).concord().op.countSubs());
		}
	function opHasSubs () { //3/8/13 by DW
		return (opCountSubs () > 0);
		}
	function opSubsExpanded () {
		return ($(opGetActiveOutliner ()).concord().op.subsExpanded());
		}
	function opGo (dir, ct) {
		return ($(opGetActiveOutliner ()).concord().op.go(dir, ct));
		}
	function opFirstSummit () {
		opGo (left, 32767);
		opGo (up, 32767);
		}
	function opXmlToOutline (xmltext, flSetFocus) { //1/30/15 by DW -- add flSetFocus param
		return ($(opGetActiveOutliner ()).concord ().op.xmlToOutline (xmltext, flSetFocus));
		}
	function opInsertXml (xmltext, dir) { //2/14/13 by DW
		return ($(opGetActiveOutliner ()).concord ().op.insertXml (xmltext, dir));
		}
	function opOutlineToXml (ownerName, ownerEmail, ownerId) {
		return ($(opGetActiveOutliner ()).concord ().op.outlineToXml (ownerName, ownerEmail, ownerId));
		}
	function opCursorToXml () {
		return ($(opGetActiveOutliner ()).concord ().op.cursorToXml ());
		}
	function opSetTitle (title) {
		return ($(opGetActiveOutliner ()).concord ().op.setTitle (title));
		}
	function opGetTitle () {
		return ($(opGetActiveOutliner ()).concord ().op.getTitle ());
		}
	function opHasChanged () {
		return ($(opGetActiveOutliner ()).concord ().op.changed ());
		}
	function opClearChanged () {
		return ($(opGetActiveOutliner ()).concord ().op.clearChanged ());
		}
	function opMarkChanged () { //3/24/13 by DW
		return ($(opGetActiveOutliner ()).concord ().op.markChanged ());
		}
	function opRedraw () { //3/9/13 by DW
		return ($(opGetActiveOutliner ()).concord ().op.redraw ());
		}
	function opGetHeaders () { //4/20/14 by DW
		return ($(opGetActiveOutliner ()).concord ().op.getHeaders ());
		}
	function opSetHeaders (theHeaders) { //2/23/15 by DW
		return ($(opGetActiveOutliner ()).concord ().op.setHeaders (theHeaders));
		}
	function opVisitAll (callback) { //7/20/13 by DW
		return ($(opGetActiveOutliner ()).concord ().op.visitAll (callback));
		}
	function opGetCursor () { //12/8/14 by DW
		return ($(opGetActiveOutliner ()).concord ().op.getCursor ());
		}
	function opSetCursor (theCursor) { //10/6/14 by DW
		return ($(opGetActiveOutliner ()).concord ().op.setCursor (theCursor)); 
		}
	function expandToCursor (theCursor) {
		var flfirst = true;
		theCursor.visitToSummit (
			function (parent) {
				if (!flfirst) {
					if (parent.subsExpanded ()) {
						return (false); //we can stop expanding here
						}
					console.log ("expandToCursor: expanding " + parent.getLineText ());
					parent.expand ();
					}
				flfirst = false;
				return (true); //keep going
				}
			);
		}
	function opGetCursorOpmlSubsOnly () {
		return ($(opGetActiveOutliner ()).concord ().op.cursorToXmlSubsOnly ());
		}
