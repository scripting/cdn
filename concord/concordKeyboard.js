// Copyright 2013, Small Picture, Inc.


var concordKeystrokes = {
	"backspace": "backspace", 
	"tab": "tab",
	"return": "return",
	"delete": "delete",
	"uparrow": "cursor-up",
	"downarrow": "cursor-down",
	"leftarrow": "cursor-left",
	"rightarrow": "cursor-right",
	
	"meta-A": "select-all",
	"meta-B": "bolden",
	"meta-C": "copy",
	"meta-D": "reorg-down",
	"meta-F": "find", //9/19/13 by DW
	"meta-I": "italicize",
	"meta-L": "reorg-left",
	"meta-R": "reorg-right",
	"meta-U": "reorg-up",
	"meta-V": "paste",
	"meta-X": "cut",
	"meta-Z": "undo",
	
	"meta-[": "promote",
	"meta-]": "demote",
	
	"meta-\\": "toggle-comment",
	"meta-/": "run-selection",
	"meta-`": "toggle-render",
	"meta-,": "toggle-expand"
	}
function concordMetaizeKeystroke (event) { //9/17/13 by DW
	var flmeta = event.metaKey || event.ctrlKey, ch = event.which;
	if ((ch >= 65) && (ch <= 90)) { //meta-A through meta-Z
		if (flmeta) {
			return ("meta-" + String.fromCharCode (ch));
			}
		}
	switch (ch) {
		case 8:
			return ("backspace");
		case 9:
			return ("tab");
		case 13:
			return ("return");
		case 37:
			return ("leftarrow");
		case 38:
			return ("uparrow");
		case 39:
			return ("rightarrow");
		case 40:
			return ("downarrow");
		case 46:
			return ("delete");
		case 188:
			if (flmeta) {
				return ("meta-,");
				}
		case 190:
			if (flmeta) {
				return ("meta-.");
				}
		case 191:
			if (flmeta) {
				return ("meta-/");
				}
		case 192:
			if (flmeta) {
				return ("meta-`");
				}
		case 219:
			if (flmeta) {
				return ("meta-[");
				}
		case 220:
			if (flmeta) {
				return ("meta-\\");
				}
		case 221:
			if (flmeta) {
				return ("meta-]");
				}
		}
	return (ch);
	}
function concordGetKeystroke (event) { //9/17/13 by DW
	var s = concordMetaizeKeystroke (event);
	if (concordKeystrokes [s] != undefined) {
		var val = concordKeystrokes [s];
		if (val.length > 0) { //2/23/14 by DW
			return (val);
			}
		}
	return (s);
	}
