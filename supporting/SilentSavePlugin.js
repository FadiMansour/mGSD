/***
	|Name:|SilentSavePlugin|
	|Description:|Adds an alternate autosave feature based on time|
	!!!Instructions
	*Simply import this plugin and change the value of seconds from 60 to whatever you want.
	*You can also comment out clearMessage(); if you want to see notifications
	!!!Code
	***/
//{{{
window.AutoSaveIfNeeded=function(){
		var seconds=60;
			config.options.chkAutoSave = false; // turn off normal autosave (redundant)
				if (seconds > 0 && (window.location.protocol == "file:")) { // local only
							if(store && store.isDirty && store.isDirty()) {	
											saveChanges();
														//clearMessage(); // hence silent
													}
									setTimeout('window.AutoSaveIfNeeded()',(seconds*1000));
										}
}
AutoSaveIfNeeded();
//}}}
