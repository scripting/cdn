function twFindTweetWithId (idToFind) {
	var fl = false;
	$(opGetActiveOutliner ()).concord ().op.visitAll (function (headline) {
		var id = headline.attributes.getOne ("tweetId");
		if (id == idToFind) {
			fl = true;
			return (false); //stop looking
			}
		else {
			return (true); //keep looking
			}
		});
	return (fl);
	}
function twGetTweetInfo (idTweet, callback) { 
	function encode (s) {
		return (encodeURIComponent (s));
		}
	$.ajax({
		type: "GET",
		url: twGetDefaultServer () + "gettweetinfo" + "?oauth_token=" + encode (localStorage.twOauthToken) + "&oauth_token_secret=" + encode (localStorage.twOauthTokenSecret) + "&id=" + encode (idTweet),
		success: function (data) {
			callback (data);
			},
		error: function (status) { 
			console.log ("twGetTweetInfo: error == " + JSON.stringify (status, undefined, 4));
			},
		dataType: "json"
		});
	}
function twOutlinerGetMyTweets () {
	var flFirstGetMyTweets = true;
	if (appPrefs.lastSeenMyTweetId != undefined) {
		if (appPrefs.lastSeenMyTweetId.length > 0) {
			flFirstGetMyTweets = false; 
			}
		}
	twGetMyTweets (localStorage.twUserId, function (myTweets) {
		var starttime = new Date ();
		for (var i = 0; i < myTweets.length; i++) {
			var thisTweet = myTweets [i];
			if (!flFirstGetMyTweets) { //the first time we don't add them to the outline
				if (thisTweet.in_reply_to_status_id_str == null) { //an original tweet, not a reply
					if (!twFindTweetWithId (thisTweet.id_str)) { //we don't already have it
						newPostWithoutIcon (hotUpText (thisTweet.text));
						twSetHeadlineAtts (thisTweet);
						opSetOneAtt ("cssTextClass", "newTweetReply");
						}
					}
				}
			//maintain localStorage.lastSeenMyTweetId
				if ((localStorage.lastSeenMyTweetId == undefined) || (thisTweet.id_str > localStorage.lastSeenMyTweetId)) {
					localStorage.lastSeenMyTweetId = thisTweet.id_str;
					}
			}
		}, localStorage.lastSeenMyTweetId);
	}
function twOutlinerGetTwitterReplies (flBeepIfNoReplies, callback) {
	var timestamp = new Date ().getTime (), ctreplies = 0;
	var oldcursor = opGetCursor ();
	whenLastReplyCheck = new Date ();
	if (flBeepIfNoReplies === undefined) {
		if (appPrefs.flBeepIfNoReplies === undefined) {
			flBeepIfNoReplies = false;
			}
		else {
			flBeepIfNoReplies = appPrefs.flBeepIfNoReplies;
			}
		}
	
	console.log ("twOutlinerGetTwitterReplies: appPrefs.lastSeenMyTweetId == " + appPrefs.lastSeenMyTweetId);
	
	twGetTwitterReplies (localStorage.twUserId, appPrefs.lastSeenMyTweetId, function (myTweets) {
		console.log ("twOutlinerGetTwitterReplies: myTweets.length == " + myTweets.length);
		opVisitAll (function (headline) {
			var cssClass = headline.attributes.getOne ("cssTextClass");
			if (cssClass == "newTweetReply") {
				var atts = headline.attributes.getAll ();
				delete atts ["cssTextClass"];
				headline.attributes.setGroup (atts);
				}
			for (var i = 0; i < myTweets.length; i++) {
				var id = headline.attributes.getOne ("tweetId"), thisTweet = myTweets [i];
				if (id != undefined) {
					if (thisTweet.in_reply_to_status_id_str == id) {
						if (!twFindTweetWithId (thisTweet.id_str)) {
							var screenName = thisTweet.user.screen_name;
							var tweetText = popTweetNameAtStart (thisTweet.text);
							tweetText = hotUpText ("@" + screenName + ": "  + tweetText);
							headline.insert (tweetText, right);
							opSetOneAtt ("type", "tweet");
							opSetOneAtt ("tweetId", thisTweet.id_str);
							opSetOneAtt ("tweetUserName", screenName);
							opSetOneAtt ("created", thisTweet.created_at);
							opSetOneAtt ("cssTextClass", "newTweetReply");
							if (appPrefs.flExpandToShowReplies) {
								opExpandTo (getCursorRef ());
								}
							ctreplies++;
							}
						}
					}
				
				if (appPrefs.lastSeenMyTweetId === undefined) {
					appPrefs.lastSeenMyTweetId = thisTweet.id_str;
					}
				else {
					if (thisTweet.id_str > appPrefs.lastSeenMyTweetId) {
						appPrefs.lastSeenMyTweetId = thisTweet.id_str;
						}
					else {
						}
					}
				}
			});
		
		if (ctreplies > 0) { //1/30/17 by DW
			opSetCursor (oldcursor);
			}
		
		if ((ctreplies == 0) && flBeepIfNoReplies) {
			speakerBeep ();
			}
		if (callback != undefined) {
			callback ();
			}
		});
	}
function twOutlinerTweet (twitterStatus, inReplyToId, origcursor, otherguysname) {
	twTweet (twitterStatus, inReplyToId, function (data) {
		var urlReplyTo = "";
		lastTweetData = data;
		origcursor.attributes.setOne ("type", "tweet");
		origcursor.attributes.setOne ("tweetId", data.id_str);
		origcursor.attributes.setOne ("tweetUserName", data.user.screen_name);
		if (data.in_reply_to_status_id_str != null) {
			origcursor.attributes.setOne ("tweetInReplyToId", data.in_reply_to_status_id_str);
			}
		if (appPrefs.flTweetToPorkChopServer) {
			var url = opGetOneAtt ("url");
			if (url == undefined) {
				url = "";
				}
			if (otherguysname != undefined) {
				urlReplyTo = "http://twitter.com/" + otherguysname + "/status/" + inReplyToId;
				}
			sendToPorkChopServer (localStorage.twScreenName, origcursor.getLineText (), url, urlReplyTo); 
			}
		});
	}
function twSendStatus (s, callback) { //8/27/14 by DW -- a streamlined interface for sending a tweet
	twTweet (s, undefined, function (tweetData) {
		if (callback != undefined) {
			callback (tweetData);
			}
		});
	}
function twSetHeadlineAtts (thisTweet) { //6/21/14 by DW
	opSetOneAtt ("type", "tweet");
	opSetOneAtt ("tweetId", thisTweet.id_str);
	opSetOneAtt ("tweetUserName", thisTweet.user.screen_name);
	opSetOneAtt ("created", thisTweet.created_at);
	}
function twTweetFromOutline (flJustReturnText, flConfirmTweets, idoutliner, flAddUrlIfPresent) {
	function getCursorRef () {
		var theCursor = $(idoutliner).concord ().op.getCursor ();
		return ($(idoutliner).concord ().op.setCursorContext (theCursor))
		}
	var origcursor = getCursorRef (), text = opGetLineText (), ctlevels = 0, idparent = undefined, otherguysname = undefined;
	var tweetLength = text.length; //8/8/14 by DW
	if (flAddUrlIfPresent === undefined) { //12/8/14 by DW
		flAddUrlIfPresent = true;
		}
	if (flJustReturnText === undefined) {
		flJustReturnText = false;
		}
	$(idoutliner).concord ().op.visitToSummit (function (op) {
		if (ctlevels++ == 1) {
			idparent = op.attributes.getOne ("tweetId");
			if (idparent != undefined) {
				otherguysname = op.attributes.getOne ("tweetUserName");
				}
			return (false);
			}
		return (true);
		});
	if (idparent == undefined) {
		idparent = 0;
		}
	if (otherguysname != undefined) {
		text = "@" + otherguysname + " -- " + text;
		}
	if (flAddUrlIfPresent) { //look for a url
		var shortUrl = opGetOneAtt ("shortUrl");
		if (shortUrl != undefined) {
			text += " " + shortUrl;
			tweetLength += twGetUrlLength ();
			}
		else {
			var urlRenderedPage = opGetOneAtt ("urlRenderedPage");
			if (urlRenderedPage != undefined) {
				text += " " + urlRenderedPage;
				tweetLength += twGetUrlLength ();
				}
			}
		}
	if (flJustReturnText) {
		return (text);
		}
	if (tweetLength > appPrefs.maxTweetLength) {
		alertDialog ("Can't tweet because the text is longer than " + appPrefs.maxTweetLength + " characters.");
		return;
		}
	if (flConfirmTweets) {
		confirmDialog ("Send the text to your Twitter followers?", function () {
			twOutlinerTweet (text, idparent, origcursor, otherguysname);
			});
		}
	else {
		twOutlinerTweet (text, idparent, origcursor, otherguysname);
		}
	}
function twGetCursorTweetUrl () { //5/25/17 by DW
	return ("http://twitter.com/" + opGetOneAtt ("tweetUserName") + "/status/" + opGetOneAtt ("tweetId"))
	}
function twViewCursorTweet () {
	window.open (twGetCursorTweetUrl ())
	}
