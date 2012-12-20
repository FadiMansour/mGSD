/***
|''Name:''|CloseOpenList|
|''Author:''|Fadi Mansour (fadi (dot) redeemer (dot) mansour (at) gmail|
|''Source:''|http://redeemer.tiddlyspot.com/#CloseOpenList|
|''License:''|[[Creative Commons NonCommercial-Attribution-ShareAlike 3.0 License|http://creativecommons.org/licenses/nc-by-sa/3.0/]]|
|''Version:''|1.0 |

This plugin is a helper to implement Mark Forester's AutoFocus methodology. This plugin will create a button, when pressed will do the following:

- All items in the "Closed list" will be marked as "Pending" and "Starred", so that they can be reviewed.
- All items in the "Open list" will be marked as "Next", so they move to the "Closed list".

To use this insert {{{<<closeOpenList>>}}} into the desired tiddler.

Example usage:
{{{<<closeOpenList>>}}}
<<closeOpenList>>
***/
//{{{

config.macros.closeOpenList = {
	handler: function ( place,macroName,params,wikifier,paramString,tiddler ) {
		createTiddlyButton( place, "Close Open list", "Close Open list",
			this.closeOpenList());
	},

	closeOpenList: function() {
		return function() {
			var closedList = fastTagged("Action").filterByTagExpr('Next && !Done').filterByEval(
				'tiddler.tags.containsAny(config.macros.mgtdList.getActiveRealms())');
			var openList = fastTagged("Action").filterByTagExpr('Pending && !Done').filterByEval(
				'tiddler.tags.containsAny(config.macros.mgtdList.getActiveRealms())');
			if (confirm( "Are you sure you want to close the open list and review the current closed list?")) {
				store.suspendNotifications();
				for ( var i=0;i<closedList.length;i++ ) {
					closedList[i].addTag('Starred');
					closedList[i].setTagFromGroup('ActionStatus', 'Pending');
				}
				for ( var i=0;i<openList.length;i++ ) {
					openList[i].setTagFromGroup('ActionStatus', 'Next');
				}
				store.resumeNotifications();
				refreshAll();				
			}
		}
	}
};

//}}}

