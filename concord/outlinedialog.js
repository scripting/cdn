var flOutlineDialogSetUp = false;
var urlOutlineDialogHtml = "http://fargo.io/code/shared/outlinedialog.html";
var outlineDialogFont = "Arial", outlineDialogFontSize = "17", outlineDialogLineHeight = "24";

var savedOutlineDialogState = {
	idoutliner: "",
	callback: ""
	};


var idOrigOutliner, savedOpmlText;

document.write ("<link href=\"http://fargo.io/code/shared/outlinedialog.css\" rel=\"stylesheet\" type=\"text/css\">");

function closeOutlineDialog (flSave) {
	var opmltext = opOutlineToXml ();
	idDefaultOutliner = savedOutlineDialogState.idoutliner;
	$("#idOutlineDialog").modal ("hide"); 
	
	setTimeout (function () { //2/27/16 by DW -- wait a second before deleting styles, give dialog a chance to be hidden
		if (savedOutlineDialogState.styleNode !== undefined) {
			document.getElementsByTagName ("head") [0].removeChild (savedOutlineDialogState.styleNode);
			delete savedOutlineDialogState.styleNode;
			}
		}, 1000);
	
	if (savedOutlineDialogState.callback !== undefined) {
		savedOutlineDialogState.callback (flSave, opmltext);
		}
	}
function cancelOutlineDialog () {
	closeOutlineDialog (false);
	}
function okOutlineDialog () {
	closeOutlineDialog (true);
	}
function extraButtonOutlineDialog () {
	if (savedOutlineDialogState.extraButtonCallback !== undefined) {
		savedOutlineDialogState.extraButtonCallback (opOutlineToXml ());
		}
	}
function setupOutlineDialog (callback) {
	if (flOutlineDialogSetUp) {
		if (callback != undefined) {
			callback ();
			}
		}
	else {
		readHttpFileThruProxy (urlOutlineDialogHtml, undefined, function (s) {
			if (s === undefined) { //4/7/16 by DW
				alertDialog ("There was a problem reading the outline dialog.");
				}
			else {
				$("body").prepend (s);
				$("#idOutlineDialogInput").on ("keydown", function (event) { 
					if (event.which == 13) {
						okOutlineDialog ();
						return (false);
						}
					});
				flAskDialogSetUp = true;
				if (callback != undefined) {
					callback ();
					}
				}
			});
		}
	}
function outlineDialog (dialogTitle, opmltext, flReadOnly, callback, afterOpenCallback, extraButtonTitle, extraButtonCallback, styles) {
	savedOutlineDialogState.callback = callback;
	setupOutlineDialog (function () {
		var headers;
		savedOutlineDialogState.idoutliner = idDefaultOutliner; //save so we can restore it later
		idDefaultOutliner = "idOutlineDialogOutline"; //this is the one in the dialog
		opInitOutliner (opmltext, getBoolean (flReadOnly));
		$("#idOutlineDialogTitle").text (dialogTitle);
		if (flReadOnly) {
			$("#idOutlineDialogCancelButton").css ("visibility", "hidden");
			}
		//set up the extraButton -- 2/25/16 by DW
			if (extraButtonTitle !== undefined) {
				savedOutlineDialogState.extraButtonCallback = extraButtonCallback;
				$("#idOutlineDialogExtraButton").css ("display", "block");
				$("#idOutlineDialogExtraButton").text (extraButtonTitle);
				}
			else {
				savedOutlineDialogState.extraButtonCallback = undefined;
				$("#idOutlineDialogExtraButton").css ("display", "none");
				}
		//insert styles, if specified -- 2/27/16 by DW
			var styleNode = document.createElement ("style");
			var styleText = document.createTextNode (styles);
			styleNode.type = "text/css";
			styleNode.appendChild (styleText);
			document.getElementsByTagName ("head") [0].appendChild (styleNode);
			savedOutlineDialogState.styleNode = styleNode; //so we can delete it later
		$("#idOutlineDialog").modal ("show");
		if (afterOpenCallback !== undefined) { //9/21/15 by DW
			afterOpenCallback ();
			}
		$("#idOutlineDialogOutline").on ("shown", function () { //5/4/15 by DW
			$("#idOutlineDialogOutline").focus (); 
			});
		});
	}
