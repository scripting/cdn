var lineEnding = "\r\n";

function isPoundItem (s) { //#name "value"
	if (s.length > 0) {
		if (s [0] == "#") {
			s = stringDelete (s, 1, 1);
			for (var i = 0; i < s.length; i++) {
				if (s [i] == " ") {
					s = stringDelete (s, 1, i);
					s = trimWhitespace (s);
					if (s.length >= 2) {
						if ((s [0] == "\"") && (s [s.length - 1] == "\"")) {
							return (true);
							}
						}
					break;
					}
				}
			//if it's something like #glossary, return true
				if (isPoundItemTableName (s)) {
					return (true);
					}
			}
		}
	return (false);
	}
function isPoundItemTableName (name) {
	switch (trimWhitespace (stringLower (name))) {
		case "glossary":
		case "templates":
		case "finalfilter": //12/8/13 by DW
		case "macros": //12/16/13 by DW
		case "style": //1/4/14 by DW
		case "menus":
			return (true);
		}
	return (false);
	}
function xmlGetValue (adrx, name) {
	return (adrx.children (name).text ());
	}
function xmlGetAddress (adrx, name) {
	return (adrx.find (name));
	}
function xmlGetAttribute (adrx, name) {
	return ($(adrx).attr (name));
	}
function xmlGetTextAtt (adrx) {
	var s = xmlGetAttribute (adrx, "text");
	if (s === undefined) {
		s = "";
		}
	return (s);
	}
function xmlIsComment (adrx) {
	return (xmlGetAttribute (adrx, "isComment") == "true");
	}
function xmlSetAttribute (adrx, name, value) {
	$(adrx).attr (name, value);
	}
function xmlDeleteAttribute (adrx, name) {
	$(adrx).removeAttr (name);
	}
function xmlGatherAttributes (adrx, theTable) {
	if (adrx.attributes != undefined) {
		for (var i = 0; i < adrx.attributes.length; i++) {
			var att = adrx.attributes [i];
			if (att.specified) {
				theTable [att.name] = att.value;
				}
			}
		}
	}
function xmlHasSubs (adrx) {
	return ($(adrx).children ().length > 0); //use jQuery to get answer -- 12/30/13 by DW
	
	};
function xmlGetSub1 (adrx) {
	var sub1;
	xmlOneLevelVisit (adrx, function (adrx) {
		if (!xmlIsComment (adrx)) {
			sub1 = adrx;
			return (false); 
			}
		return (true); 
		});
	return (sub1);
	}
function xmlGetParent (adrx) { //3/4/14 by DW
	return ($(adrx).parent ());
	}
function xmlGetNext (adrx) { //4/11/14 by DW
	return ($(adrx).next ());
	}
function xmlGetPrev (adrx) { //4/11/14 by DW
	return ($(adrx).prev ());
	}
function xmlGetNodeName (adrx) {
	var name = xmlGetAttribute (adrx, "name");
	if (name != undefined) {
		return (name);
		}
	return (getCanonicalName (xmlGetTextAtt (adrx)));
	}
function xmlGetDivWithData (adrx, divname) { //3/23/14 by DW
	var s = "<div class=\"" + divname + "\" ";
	$.each (adrx.attributes, function () {
		if (this.specified) {
			var name = this.name.toLowerCase (); //data atts are unicase
			switch (name) {
				case "text": case "created": case "name": case "hash":
					break; 
				default:
					s += "data-" + name + "=\"" + this.value + "\" ";
					break;
				}
			}
		});
	return (s + ">");
	}
function xmlNodesAreSiblings (adr1, adr2) { //1/10/14 by DW
	return ($(adr1).parent () == $(adr2).parent ());
	}
function xmlIsDocumentNode (adrx) {
	var type = xmlGetAttribute (adrx, "type");
	return ((type != undefined) && (type != "include") && (type != "link"));
	}
function xmlGetNodeNameProp (adrx) { //12/10/13 by DW
	return ($(adrx).prop ("nodeName"));
	}
function xmlNodeIsContent (adrx) { //12/2/13 by DW
	if (xmlGetNodeNameProp (adrx) != "outline") { //12/10/13 by DW
		return (false);
		}
	return ((!xmlIsComment (adrx)) && (!isPoundItem (xmlGetTextAtt (adrx))));
	}
function xmlReadFile (url) { //a synchronous file read
	return ($.ajax ({ 
		url: getReadHttpUrl () + "?url=" + encodeURIComponent (url) + "&type=" + encodeURIComponent ("text/plain"),
		headers: {"Accept": "text/x-opml"},
		async: false,
		dataType: "text" , 
		timeout: 30000 
		}).responseText);
	}
function xmlExpandInclude (adrx) {
	var typeatt = xmlGetAttribute (adrx, "type");
	if (typeatt == "include") {
		var urlatt = xmlGetAttribute (adrx, "url");
		if (urlatt != undefined) {
			try {
				var opmltext = xmlReadFile (urlatt);
				var xstruct = $($.parseXML (opmltext));
				var adropml = xmlGetAddress (xstruct, "opml");
				var adrbody = xmlGetAddress (adropml, "body");
				$(adrbody).children ("outline").each (function () {
					var adrcopy = this.cloneNode (true);
					adrx.appendChild (adrcopy);
					});
				xmlDeleteAttribute (adrx, "type");
				xmlDeleteAttribute (adrx, "url");
				}
			catch (err) {
				console.log ("xmlExpandInclude, error expanding: " + urlatt + ", " + err.message);
				}
			
			}
		}
	}
function xmlVisit (adrx, callback, level, path) {
	if (level === undefined) {
		level = 0;
		}
	if (path === undefined) {
		path = "";
		}
	$(adrx).children ("outline").each (function () {
		var flvisitsubs = true,  name = xmlGetNodeName (this);
		xmlExpandInclude (this);
		if (callback != undefined) {
			if (!callback (this, level, path + name)) {
				flvisitsubs = false;
				}
			}
		if (flvisitsubs) {
			if (!xmlVisit (this, callback, level + 1, path + name + "/")) {
				return (false);
				}
			}
		});
	return (true);
	}
function xmlOneLevelVisit (adrx, callback) {
	$(adrx).children ("outline").each (function () {
		xmlExpandInclude (this);
		if (callback != undefined) {
			if (!callback (this)) {
				return (false);
				}
			}
		return (true);
		});
	}
function xmlHasSubDocs (adrx) { //1/10/14 by DW -- return true if the node has any subs that are document nodes
	var flhassubdocs = false;
	xmlVisit (adrx, function (adrx, level, path) {
		if (flhassubdocs) { //unwind levels of recursion
			return (false);
			}
		if (xmlIsComment (adrx) || isPoundItem (xmlGetTextAtt (adrx))) { 
			return (false);
			}
		if (xmlIsDocumentNode (adrx)) {
			flhassubdocs = true;
			return (false); 
			}
		return (true);
		});
	return (flhassubdocs);
	}
function xmlStoryVisit (adrsummit, adrmustvisit, callback) { //12/28/13 by DW
	var fldone = false;
	xmlVisit (adrsummit, function (adrx, level, path) {
		if (fldone) {
			return (false);
			}
		if (xmlIsComment (adrx) || isPoundItem (xmlGetTextAtt (adrx))) { //12/31/13 by DW
			return (false);
			}
		if (xmlIsDocumentNode (adrx) || (adrx == adrmustvisit)) {
			if (callback != undefined) {
				var name = xmlGetNodeName (this);
				if (!callback (adrx, level, path + name)) {
					fldone = true;
					}
				}
			return (false); //don't visit inside document nodes
			}
		return (true);
		});
	}
function xmlFind (adrparent, nameToLookFor) {
	var s = stringLower (nameToLookFor), adrfound;
	xmlOneLevelVisit (adrparent, function (adrsub) {
		if (xmlNodeIsContent (adrsub)) {
			if (stringLower (xmlGetNodeName (adrsub)) == s) {
				adrfound = adrsub;
				return (false);
				}
			}
		return (true); 
		});
	return (adrfound);
	}
function xmlGetImgAtt (adrx) { //3/9/14 by DW
	var imgatt = xmlGetAttribute (adrx, "img"), img = "";
	if (imgatt != undefined) {
		var urlatt = xmlGetAttribute (adrx, "url"), textatt = xmlGetTextAtt (adrx);
		if (textatt.length > 0) { //4/11/14 by DW
			img = "<img style=\"float: right; margin-left: 25px; margin-top: 15px; margin-right: 15px; margin-bottom: 15px;\" src=\"" + imgatt + "\">";
			}
		else {
			img = "<center><img src=\"" + imgatt + "\"></center>";
			}
		if (urlatt != undefined) {
			img = "<a href=\"" + urlatt + "\" target=\"_blank\">" + img + "</a>"
			}
		img += lineEnding;
		}
	return (img);
	}
function xmlGetPermalinkValue (when) { //3/11/14 by DW
	var num = Number (when), name;
	if (num < 0) {
		num = -num;
		}
	name = "a" + (num / 1000);
	return (name);
	}
function getXstuctBody (xstruct) {
	var adropml, adrbody;
	adropml = xmlGetAddress (xstruct, "opml");
	adrbody = xmlGetAddress (adropml, "body");
	return (adrbody);
	}
function getXstuctHead (xstruct) { //11/11/14 by DW
	var adropml, adrhead;
	adropml = xmlGetAddress (xstruct, "opml");
	adrhead = xmlGetAddress (adropml, "head");
	return (adrhead);
	}
function xmlNotComment (adrx) { //7/10/14 by DW
	if (xmlIsComment (adrx)) {
		return (false);
		}
	if (isPoundItem (xmlGetTextAtt (adrx))) {
		return (false);
		}
	return (true);
	}
function xmlStringify (xstruct) { //7/17/15 by DW
	var oSerializer = new XMLSerializer ();
	var xmlString = oSerializer.serializeToString (xstruct [0]);
	return (xmlString);
	}
function xmlGetSubText (adrx, flAddTabsNewlines) { //11/17/15 by DW
	var htmltext = "";
	if (flAddTabsNewlines === undefined) { //8/11/16 by DW
		flAddTabsNewlines = true;
		}
	xmlVisit (adrx, function (adrx, level) {
		var textatt = xmlGetTextAtt (adrx); 
		if (xmlIsComment (adrx)) {
			return (false);
			}
		
		if (flAddTabsNewlines) {
			htmltext += filledString ("\t", level) + textatt + lineEnding;
			}
		else {
			
			htmltext += textatt;
			}
		
		return (true);
		});
	return (htmltext);
	}
function xmlGetStringFromOutline (opmltext) { //2/24/16 by DW
	var xstruct = $($.parseXML (opmltext)), ctread = 0;
	var adropml = xmlGetAddress (xstruct, "opml");
	var adrbody = xmlGetAddress (adropml, "body");
	var subtext = xmlGetSubText (adrbody);
	return (subtext);
	}
function xmlGetSubValues (adrx) { //10/12/16 by DW
	var values = new Object ();
	$(adrx).children ().each (function () {
		var name = xmlGetNodeNameProp (this);
		if (name.length > 0) {
			var val = $(this).prop ("textContent");
			values [name] = val;
			}
		});
	return (values);
	}
function xmlCountSibs (adrx) { //1/6/17 by DW
	var adrparent = xmlGetParent (adrx), ct = 0;
	xmlOneLevelVisit (adrx, function (adrsub) {
		ct++;
		});
	return (ct - 1);
	}
function xmlBuildMenusFromOpmltext (opmltext, idMenuToInsertAfter, evalCallback, newMenuCommandCallback, menuIdPrefix) { //1/17/17 by DW
	var xstruct = $($.parseXML (opmltext)), ctScriptMenus = 0;
	var adrbody = getXstuctBody (xstruct);
	function installApp (urlApp, liMenuItem, menuNameLink, callback) {
		readHttpFileThruProxy (urlApp, undefined, function (jsontext) {
			if (jsontext !== undefined) {
				var jstruct = JSON.parse (jsontext);
				menuNameLink.html (jstruct.name);
				readHttpFileThruProxy (jstruct.urlMenu, undefined, function (opmltext) {
					var xstruct = $($.parseXML (opmltext)), ctScriptMenus = 0;
					var adrbody = getXstuctBody (xstruct);
					getSubMenu (adrbody, liMenuItem, true)
					});
				}
			});
		}
	function getSubMenu (adrMenuInOutline, liMenuItem, flSubMenu) {
		var ulSubMenu = $("<ul></ul>"), myClass = "dropdown";
		if (flSubMenu) {
			myClass = "dropdown-submenu";
			}
		liMenuItem.addClass (myClass);
		ulSubMenu.addClass ("dropdown-menu");
		
		
		xmlOneLevelVisit (adrMenuInOutline, function (adrSubMenuItem) {
			if (!xmlIsComment (adrSubMenuItem)) {
				var textatt = xmlGetTextAtt (adrSubMenuItem), nametext = textatt, liSubMenuItem;
				var cmdKeyPrefix = getCmdKeyPrefix (), cmdKeyAtt = xmlGetAttribute (adrSubMenuItem, "cmdKey"); 
				
				if (textatt == "-") {
					liSubMenuItem = $("<li class=\"divider\"></li>");
					}
				else {
					liSubMenuItem = $("<li></li>");
					var menuNameLink = $("<a></a>");
					menuNameLink.attr ("href", "#");
					menuNameLink.attr ("tabindex", "-1");
					if (cmdKeyAtt !== undefined) {
						nametext = "<span class=\"menuKeystroke\">" + cmdKeyPrefix + cmdKeyAtt + "</span>" + nametext;
						}
					menuNameLink.html (nametext);
					liSubMenuItem.append (menuNameLink);
					
					if (getBoolean (xmlGetAttribute (adrSubMenuItem, "flSubMenu"))) {
						getSubMenu (adrSubMenuItem, liSubMenuItem, true);
						}
					else {
						var urlApp = xmlGetAttribute (adrSubMenuItem, "urlApp");
						if (urlApp !== undefined) {
							console.log ("getSubMenu: adding app, url == \"" + urlApp + "\".");
							installApp (urlApp, liSubMenuItem, menuNameLink, function () {
								});
							}
						else {
							var subtext = trimWhitespace (xmlGetSubText (adrSubMenuItem));
							if (subtext.length > 0) {
								menuNameLink.data ("script", subtext);
								
								var whenCreated = xmlGetAttribute (adrSubMenuItem, "created"); //1/22/17 by DW
								if (whenCreated !== undefined) {
									menuNameLink.data ("created", whenCreated);
									}
								
								menuNameLink.click (function (event) { 
									var s = $(this).data ("script");
									event.preventDefault ();
									if (evalCallback !== undefined) {
										evalCallback (s, this); //1/22/17 by DW -- added new param, this, so caller can access the DOM node directly, used in pngWriter
										}
									else {
										eval (s);
										}
									});
								
								if (newMenuCommandCallback !== undefined) { //1/22/17 by DW
									newMenuCommandCallback (subtext, menuNameLink);
									}
								}
							else {
								liSubMenuItem.addClass ("disabled");
								}
							}
						}
					}
				
				ulSubMenu.append (liSubMenuItem);
				}
			return (true); //keep visiting
			});
		
		
		liMenuItem.append (ulSubMenu)
		}
	if (menuIdPrefix === undefined) { //6/11/17 by DW
		menuIdPrefix = "idScriptMenu";
		}
	xmlOneLevelVisit (adrbody, function (adrmenu) {
		if (!xmlIsComment (adrmenu)) {
			var menuName = xmlGetTextAtt (adrmenu);
			var liDropdown = $("<li></li>");
			var idThisMenu = menuIdPrefix + ++ctScriptMenus;
			liDropdown.addClass ("dropdown");
			liDropdown.attr ("id", idThisMenu);
			var menuNameLink = $("<a></a>");
			menuNameLink.addClass ("dropdown-toggle");
			menuNameLink.attr ("href", "#");
			menuNameLink.attr ("data-toggle", "dropdown");
			menuNameLink.text (menuName);
			menuNameLink.append (" <b class=\"caret\"></b>");
			liDropdown.append (menuNameLink);
			
			
			
			getSubMenu (adrmenu, liDropdown, false); //get the submenu, attach it to the menu item
			
			
			
			
			
			liDropdown.insertAfter ("#" + idMenuToInsertAfter);
			idMenuToInsertAfter = idThisMenu;
			}
		return (true); //keep visiting
		});
	}
function xmlCompile (xmltext) { //3/27/17 by DW
	return ($($.parseXML (xmltext)));
	}
function xmlGetSubsFromOpml (opmltext) { //3/27/17 by DW
	function gatherSubs (adrx) {
		xmlOneLevelVisit (adrx, function (adrsub) {
			if (xmlHasSubs (adrsub)) {
				gatherSubs (adrsub);
				}
			else {
				var atts = new Object ();
				xmlGatherAttributes (adrsub, atts);
				subsArray.push (atts);
				}
			return (true);
			});
		}
	var xstruct = xmlCompile (opmltext);
	var adrbody = getXstuctBody (xstruct);
	var subsArray = [];
	gatherSubs (adrbody);
	return (subsArray);
	}
