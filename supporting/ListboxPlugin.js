/***
|Name|ListboxPlugin|
|Source|http://www.TiddlyTools.com/#ListboxPlugin|
|Documentation|http://www.TiddlyTools.com/#ListboxPluginInfo|
|Version|1.1.0|
|Author|Eric Shulman - ELS Design Studios|
|License|http://www.TiddlyTools.com/#LegalStatements <br>and [[Creative Commons Attribution-ShareAlike 2.5 License|http://creativecommons.org/licenses/by-sa/2.5/]]|
|~CoreVersion|2.1|
|Type|plugin|
|Requires||
|Overrides||
|Description|set tiddler fields by selecting enumerated values from a listbox or droplist|
The {{{<<select>>}}} macro allows you to set tiddler field values by selecting pre-configured enumerated values from a listbox/droplist control.  
!!!!!Documentation
>see [[ListboxPluginInfo]]
!!!!!Revisions
<<<
2008.07.22 [1.1.0] added "=cookiename" syntax for storing selected value in cookie instead of a tiddler field
|please see [[ListboxPluginInfo]] for additional revision details|
2007.05.12 [0.5.0] started
<<<
!!!!!Code
***/
//{{{
version.extensions.ListboxPlugin= {major: 1, minor: 1, revision: 0, date: new Date(2008,7,22)};

config.macros.select = {
	tooltip: "select a value for %0@%1",
	blankTooltip: "set %0@%1=[null] (delete field value)",
	valueTooltip: "set %0@%1=%2",
	otherLabel: "other",
	otherTooltip: "set %0@%1=[???] (enter custom value)",
	otherPrompt: "enter a value for '%0'",
	editLabel: "edit list...",
	editTooltip: "edit '%0' list definition (%1)",
	changeMsg: "setting %0@%1=%2",
	verbose: false,
	hereKeyword: "here",
	defaultTarget: "SiteFields",
	handler:
	function(place,macroName,params,wikifier,paramString,tiddler) {

		// get containing tiddler (or use default "SiteFields" catch-all tiddler)
		var here=story.findContainingTiddler(place);
		var targetID=here?here.getAttribute("tiddler"):this.defaultTarget;
		// get field name
		var field=params.shift();
		var pos=field.indexOf("@"); // if non-default target ("field@tiddler" syntax)
		if(pos!=-1) { // split field into field and tiddlername.
			if (field.substr(pos+1)!=this.hereKeyword) // "here" == use default target
				targetID=field.substr(pos+1); // switch to different target tiddler
			field=field.substr(0,pos);
		}

		// if no field name, do nothing
		if(!field || !field.length) return;
		// if field starts with "=", it is an option cookie instead of a tiddler field
		if (field.substr(0,1)=="=") targetID="(system)";

		var p=params.shift();
		var rows="0"; if (p.substr(0,5)=="rows:") { rows=p.substr(5); p=params.shift(); } // optional list height in lines
		var width="auto"; if (p.substr(0,6)=="width:") { width=p.substr(6); p=params.shift(); } // optional CSS width
		var autosave=(p.toLowerCase()=="autosave"); if (autosave) p=params.shift(); // optional autosave
		var allowBlank=(p.toLowerCase()=="allowblank"); if (allowBlank) p=params.shift(); // add optional empty item
		var allowOther=(p.toLowerCase()=="allowother"); if (allowOther) p=params.shift(); // add optional "other: ____" item

		if (tiddler && !story.isDirty(tiddler.title)) autosave=true; // if tiddler is in VIEW mode, force autosave

		var list=[];
		if (p.substr(0,1)=="+"||p.substr(0,1)=="*") { // get list from HR-separated tiddler (* means wikify source first)
			var listsrc=p.substr(1);
			var listtxt=store.getTiddlerText(listsrc);
			var wikifyData=p.substr(0,1)=="*"; if (wikifyData) listtxt=this.getWikifiedData(listtxt);
			var separator="\n";
			if (listtxt && listtxt.indexOf("\n----\n")!=-1) separator="\n----\n";
			if (listtxt && listtxt.length) var list=listtxt.split(separator);
			var allowEdit=(params[0] && params[0].toLowerCase()=="allowedit"); // add optional "edit list..." item
			if (allowEdit) p=params.shift();
		}
		else if (p.substr(0,1)=="=") { // get list from tagged tiddlers
			var tids=store.getTaggedTiddlers(p.substr(1));
			for (var t=0; t<tids.length; t++) list.push(tids[t].title);
		}
		else { // get list from macro params: "value value value ..." or "label=value label=value label=value ..."
			while (p) {
				var parts=p.split("=");
				var label=parts[0]; var v=parts[1]?parts[1]:parts[0];
				list.push(label+"="+v);
				p=params.shift();
			}
		}
		// register notification handler for ALL tiddler changes (to sync lists)
		store.addNotification(null,this.refresh);
		// render the control
		this.render(createTiddlyElement(place,"span"), null, targetID, field, list, listsrc, wikifyData, rows, width, autosave, allowBlank, allowOther, allowEdit);
	},
	getWikifiedData: // wikify tiddler content, then extract text WITH newlines and HRs included
	function(txt) {
		var e=createTiddlyElement(document.body,"div"); wikify(txt,e);
		var breaks=e.getElementsByTagName("br");
		for (var b=0; b<breaks.length; b++) breaks[b].parentNode.insertBefore(document.createTextNode("\n"),breaks[b]);
		var lines=e.getElementsByTagName("hr");
		for (var l=0; l<lines.length; l++) lines[l].parentNode.insertBefore(document.createTextNode("----\n"),lines[l]);
		var items=e.getElementsByTagName("li");
		for (var i=0; i<items.length; i++) items[i].parentNode.insertBefore(document.createTextNode("\n"),items[i]);
		var txt=getPlainText(e); removeNode(e); return txt;
	},
	refresh:
	function (title) {
		var lists=document.getElementsByTagName("select");
		for (i=0; i<lists.length; i++) {
			if (lists[i].getAttribute("listsrc")==title) {
				var here=lists[i];
				var place=here.parentNode;
				var targetID=here.getAttribute("tiddler");
				var field=here.getAttribute("edit");
				var listsrc=here.getAttribute("listsrc");
				var rows=here.getAttribute("rows");
				var width=here.getAttribute("width");
				var autosave=here.getAttribute("autosave")=="true";
				var allowBlank=here.getAttribute("allowBlank")=="true";
				var allowOther=here.getAttribute("allowOther")=="true";
				var allowEdit=here.getAttribute("allowEdit")=="true";
				var wikifyData=here.getAttribute("wikifyData")=="true";
				// get the list
				var listtxt=store.getTiddlerText(listsrc,""); if (wikifyData) listtxt=config.macros.select.getWikifiedData(listtxt);
				var separator="\n"; if (listtxt && listtxt.indexOf("\n----\n")!=-1) separator="\n----\n";
				var list=[]; if (listtxt && listtxt.length) var list=listtxt.split(separator);
				// re-render control
				config.macros.select.render(place, here, targetID, field, list, listsrc, wikifyData, rows, width, autosave, allowBlank, allowOther, allowEdit);
			}
		}
	},
	render:
	function (place, here, targetID, field, list, listsrc, wikifyData, rows, width, autosave, allowBlank, allowOther, allowEdit) {
		// use selected value from existing listbox (except for "edit list..." item)
		if (here && here.selectedIndex!=-1 && here.options[here.selectedIndex].text!=config.macros.select.editLabel)
			{ var val=here.value; if (val && !val.length) val=undefined; }
		// if listbox doesn't yet exist, or 'edit list' item was selected, use existing value from field (if any)
		if (!val) var val=(field.substr(0,1)=='=')?
			config.options[field.substr(1)]:store.getValue(targetID,field);
		var count=0; var options="";
		// add default 'undefined' item
		if (val==undefined || allowBlank) {
			var title=this.blankTooltip.format([field,targetID]);
			options+='<option value="" title="'+title+'"></option>';
			count++;
		}
		// add enumerated items
		var isOther=(val!=undefined);
		for (opt=0; opt<list.length; opt++) {
			var lines=list[opt].split("\n"); var parts=lines[0].split("=");
			var label=parts[0];
			var v=parts[1]?parts[1]:parts[0];
			var title=lines[1]?lines[1]:this.valueTooltip.format([field,targetID,v]);
			options+='<option value="'+v+'" '+(val==v?'selected':'')+' title="'+title+'">'+label+'</option>';
			if (val==v) isOther=false; // found matching value in list
			count++;
		}
		// add other... item
		if (isOther||allowOther) {
			var label="other"+(isOther?(": "+val):"...");
			var v=isOther?val:"";
			var title=this.otherTooltip.format([field,targetID]);
			options+='<option value="'+v+'" '+(isOther?'selected':'')+' title="'+title+'">'+label+'</option>';
			count++;
		}
		// add edit list... item
		if (listsrc && (!store.getTiddlerText(listsrc) || allowEdit)) {
			var title=this.editTooltip.format([field,listsrc]);
			options+='<option value="'+listsrc+'" title="'+title+'">'+this.editLabel+'</option>';
			count++;

		}
		// construct full HTML
		var html='<select ';
		html+=(val!=undefined?'value="'+val+'" ':'')+'" edit="'+field+'" ';
		html+='onclick="return config.macros.select.onClick(this,event)" ';
		html+='onchange="return config.macros.select.onChange(this,event)" ';
		html+='ondblclick="return false" ';
		html+='autosave="'+autosave+'" allowBlank="'+allowBlank+'" ';
		html+='allowOther="'+allowOther+'" allowEdit="'+allowEdit+'" ';
		html+='rows="'+rows+'" size="'+(rows!=0?rows:count)+'" ';
		html+='tiddler="'+targetID+'" '+'" listsrc="'+listsrc+'" wikifyData="'+wikifyData+'" ';
		html+='title="'+this.tooltip.format([field,targetID])+'" style="width:'+width+'">'+options+'</select>';
		// pass to browser for rendering
		place.innerHTML=html;
	},
	onClick:
	function(here,event) {
		var label=config.macros.select.otherLabel;
		if (here.getAttribute("allowother")=="true" && here.options[here.selectedIndex].text.substr(0,label.length)==label)
			here.onchange.apply(here,arguments);
	},
	onChange:
	function(here,event) {
		if (here.options[here.selectedIndex].text==config.macros.select.editLabel) {
			story.displayTiddler(story.findContainingTiddler(here),here.value,DEFAULT_EDIT_TEMPLATE);
			return false;
		}
		var label=config.macros.select.otherLabel;
		if (here.getAttribute("allowother")=="true" && here.options[here.selectedIndex].text.substr(0,label.length)==label) {
			var newval=prompt(config.macros.select.otherPrompt.format([here.getAttribute("edit")]),here.value);
			if (!newval) {// user cancelled
				var v=store.getValue(here.getAttribute("tiddler"),here.getAttribute("edit"));
				{ here.value=v; if (v==undefined) here.selectedIndex=0; return false; }
			};
			here.options[here.selectedIndex].value=newval;
			here.options[here.selectedIndex].text=config.macros.select.otherLabel+": "+newval;
			here.value=newval;
		}
		if (here.getAttribute("autosave")=="true") config.macros.select.setFieldValue(here);
		return false;
	},
	setFieldValue: function(here) {
		var tid=here.getAttribute("tiddler"); if (!tid || !tid.length) return; // no target, do nothing
		var field=here.getAttribute("edit");
		if (field.substr(0,1)=='=') { // option cookie instead of tiddler field
			config.macros.option.propagateOption(field.substr(1),"value",here.value,"input");
			return;
		}
		// if tiddler doesn't exist, create it...
		if (!store.tiddlerExists(tid)) store.saveTiddler(tid,tid,"",config.options.txtUserName,new Date(),[]);
		// set the field value in the target tiddler
		store.setValue(tid,field,here.value.length?here.value:null); // if value is blank, delete field
		// touch target tiddler so that modified and modifier are updated
		var t=store.getTiddler(tid);
		// store.saveTiddler(tid,tid,t.body,config.options.txtUserName,new Date(),t.tags,t.fields); // caused weird refresh problems
		if (config.macros.select.verbose) // tell user what happened
			{ clearMessage(); displayMessage(config.macros.select.changeMsg.format([field,tid,here.value])); }
	}
}
//}}}
