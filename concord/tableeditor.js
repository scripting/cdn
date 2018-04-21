var idTable = "idAttEditTable";
var tableEditCallback;


function tabEdDeleteRow (r) {
	var table = document.getElementById (idTable);
	var ixrow = r.parentNode.parentNode.parentNode.rowIndex;
	table.deleteRow (ixrow);
	}
function tabEdDeleteAllRows () {
	var table = document.getElementById (idTable);
	$(table).empty ();
	}
function tabEdAddRow (name, value, flSetFocus) {
	var table = document.getElementById (idTable);
	var row = table.insertRow (-1);
	
	var cell1 = row.insertCell (0);
	var cell2 = row.insertCell (1);
	var cell3 = row.insertCell (2);
	
	cell1.innerHTML = "<input type=\"text\" value=\"" + encodeXml (name) + "\">"; //11/3/14 by DW -- encode the name too.
	cell2.innerHTML = "<input type=\"text\" value=\"" + encodeXml (value) + "\">";
	cell3.innerHTML = "<span style=\"cursor:pointer\"><a onclick=\"tabEdDeleteRow (this)\"><i class=\"fa fa-trash-o\"></i></a></span>";
	
	if (flSetFocus) {
		cell1.firstChild.focus ();
		}
	}
function tabEdAddButtonClick () {
	tabEdAddRow ("", "", true);
	}
function tabEdClose () {
	$("#idAttsDialog").modal ("hide"); 
	};
function tabEdOkClick () {
	var table = document.getElementById (idTable), i, row;
	var atts = {};
	for (i = 0; i < table.rows.length; i++) {
		var row = table.rows [i]
		var str1 = row.cells [0].childNodes [0].value, str2 = row.cells [1].childNodes [0].value;
		atts [str1] = str2;
		}
	
	if (tableEditCallback != undefined) {
		tableEditCallback (atts);
		}
	tabEdClose ();
	};
function tabEdShow (title, obj, callback) {
	function showDialog () {
		function setupAttsDialog () {
			tabEdDeleteAllRows ();
			for (var p in obj) {
				if (obj.hasOwnProperty (p)) {
					tabEdAddRow (p, obj [p], false);
					}
				}
			var table = document.getElementById (idTable);
			if (table.rows.length == 0) {
				tabEdAddRow ("", "", false);
				}
			}
		tableEditCallback = callback; //called when the user clicks OK
		$("#idAttsDialog").bind ("show", function () {
			setupAttsDialog ();
			$("#idTabEdTitle").html (title);
			});
		$("#idAttsDialog").modal ("show"); 
		}
	if ($("#idAttsDialog").length == 0) { //hasn't been loaded yet
		readHttpFile ("http://fargo.io/code/shared/tableeditor.html", function (s) {
			$("body").prepend (s);
			showDialog ();
			});
		}
	else {
		showDialog ();
		}
	};
