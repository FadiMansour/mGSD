/***
|Name|extendedTicklersPlugin|
|Requires|mGSD, ListboxPlugin|
|Description|adds activation time and custom date intervals to ticklers|
!!!Instructions
*Import [[ListboxPlugin]], [[extendedTicklersPlugin]] and [[extendedTicklerButtons]]
*Import [[TitleButtonsSelector]] or manually change //~TitleButtons##Tickler// to //extendedTicklerButtons//
*Uncomment the optional notification if you want to see it (shows the new date when rescheduling ticklers)
!!!New Code
***/
//{{{
merge(config.macros, {
	addInterval: {
			label:   {addDay:"d", addWeek:"w",  addMonth:"m",   addYear:"y"},
			tooltip: {addDay:" day",addWeek:" week",addMonth:" month",addYear:" year"},
	  	        handler: function(place,macroName,params,wikifier,paramString,tiddler) {
				if (tiddler) var useTiddler = tiddler;
			        if (params[0]) var useTiddler = store.fetchTiddler(params[0]);
				if (useTiddler.hasTag('Yearly')) macroName = "addYear";
					else if (useTiddler.hasTag('Monthly')) macroName = "addMonth";
					else if (useTiddler.hasTag('Weekly')) macroName = "addWeek";
					else if (useTiddler.hasTag('Daily')) macroName = "addDay";

				if ((useTiddler.fields.customint) && (useTiddler.fields.customint >= 2)) {
					var intervalNumber = Math.floor(useTiddler.fields.customint); // eliminate decimals
					var pluralEnding = "s";
				}
				else { // fixes negative intervals, etc.
					var intervalNumber = 1;
					var pluralEnding = "";
				}

				createTiddlyButton(place,"+"+((intervalNumber==1) ? "" : intervalNumber)+ config.macros.addInterval.label[macroName], "add "+intervalNumber+config.macros.addInterval.tooltip[macroName]+pluralEnding, function() {

					var curVal = useTiddler.fields['mgtd_date'] || undefined;
		        	        var curDate = curVal ? Date.convertFromYYYYMMDDHHMM(curVal) : new Date();    
					// ensure ticklers don't have minutes/hours since new Date() has minutes/hours
					curDate.setHours(0);
					curDate.setMinutes(0);
					curDate.setSeconds(0);

					// call the applicable date method m times
					for(var m = 0; m < intervalNumber; m++) {
						curDate[macroName](1);
					}

					if (intervalNumber == 1) intervalNumber = null; // unset customint

					store.suspendNotifications();
					store.setValue(useTiddler, 'customint', intervalNumber);
					store.resumeNotifications();

					store.setValue(useTiddler, 'mgtd_date',curDate.convertToYYYYMMDDHHMM());

					// Optional notification
					// displayMessage('Rescheduled '+useTiddler.title+' to '+curDate.formatString(config.mGTD.getOptTxt('ticklerdateformat'))+(useTiddler.fields.ticklerhh ? (' ('+useTiddler.fields.ticklerhh+':'+(useTiddler.fields.ticklermm ? useTiddler.fields.ticklermm : '00')+')') : ''));

					return false;
				});
			}
		}
});
//}}}

/***
!!!Tweaked mGSD functions
***/
//{{{
// This change shows the custom intervals and activation times in Tickler lists
Tiddler.prototype.render_Tickler=function() {
        var repeatType = this.getByIndex('TicklerRepeatType');
        var doneControl = "";
        if (repeatType.length == 0 || repeatType.contains('Once')) {
            // show normal done checkbox
            doneControl = '<<toggleTag Actioned [[%0]] ->>';
        }
        else doneControl = '<<addInterval [[%0]]>>'; // Custom Interval
		
	var pLink = "";
	if (config.mGTD.getOptChk('FullContactInActionLists')) {
		pLink += "{{projLinkFull{<<linkToParent Project [[title]] [[%0]]>>}}}".format([this.title]);
	}
	else {
		pLink += "{{projLink{<<linkToParent Project '[P]' [[%0]]>>}}}".format([this.title]);
	}

	return this.renderUtil(
		'{{tickler{'+
        	'%1'+  
		'<<singleToggleTag tag:Starred title:[[%0]]>>'+
		'<<dateChooser [[%0]]>>'+
		(this.fields.ticklerhh ? (' //('+this.fields.ticklerhh+':'+(this.fields.ticklermm ? this.fields.ticklermm : '00')+')//') : '')+
		'<<newTiddler label:"Y" title:[[%0]] tag:Pending tag:Action tag:[[%3]] text:[[%4]]>>'+
		'&nbsp;[[%0]]'+
		'<<deleteTiddler [[%0]]>>'+
		'}}}'+
		'{{notesLink{<<showNotesIcon [[%0]]>>}}}'+
		' %2',
		[
			this.title,
            		doneControl.format([this.title]),
			pLink,
			config.macros.mgtdList.getRealm(),
			this.text.htmlEncode(),
		]
	);};

// This change makes ticklers activate on their activation time (or X hours before, useful for reminders where you set the time but want to know in advance)
merge(Tiddler.prototype, {
	ticklerIsActive: function() {
		if(this.fields.mgtd_date)
		{
			var defaultHourToActivate = 5; // fixme put elsewhere
			var hourToActivate = config.mGTD.getOptTxt('tickleractivatehour') || defaultHourToActivate;
			var nowTime = new Date();
			var ticklerTime = Date.convertFromYYYYMMDDHHMM(this.fields.mgtd_date);
			if (this.fields.ticklerhh) {
				ticklerTime.setHours(this.fields.ticklerhh);
				if (this.fields.tickleractivate) hourToActivate = -this.fields.tickleractivate; // activate X hours in advance
					else hourToActivate = 0; // or activate exactly on time
				if (this.fields.ticklermm) ticklerTime.setMinutes(this.fields.ticklermm);
			}
		nowTime.setHours(nowTime.getHours() - hourToActivate);
		var ItsActive = (nowTime.convertToYYYYMMDDHHMM() >= ticklerTime.convertToYYYYMMDDHHMM());
		}
		return (!this.fields.mgtd_date || ItsActive);
	}
});
//}}}
