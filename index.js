
let verbose = 1;
let timeStorageType = "unix" //actually milseconds
let data = [];
let accuracy = {year:1,month:12,day:30,hour:6,minute:6,second:-1};
let avg = {year:true,month:true,day:true,hour:true,minute:true,second:false};
let dims = ["year","month","day","hour","minute","second"];
let durations={year:31536000000,month:2592000000,day:86400000,hour:3600000,minute:60000,second:1000};
let seperations = {
	year:Math.floor(durations.year/accuracy.year),
	month:Math.floor(durations.month/accuracy.month),
	day:Math.floor(durations.day/accuracy.day),
	hour:Math.floor(durations.hour/accuracy.hour),
	minute:Math.floor(durations.minute/accuracy.minute),
	second:Math.floor(durations.second/accuracy.second),
};

function printData(){
	for (let f of data) {
		console.log(f.name);
		let str = "";
		for (let fv in f.values) {
			str += fv + "\t ";
		}
		console.log(str);
		str = "";
		let i = 0;
		let bl = true;
		while(bl){
			str = "";
			bl = false;
			for (let fv in f.values) {
				if(f.values[fv][i]){
					bl = true;
					str += f.values[fv][i].d + "\t ";
				}else{
					str += " " + "\t ";
				}
			}
			console.log(str);
			i++;
		}
		str = "";
		let str2 = "";
		for (let fv in f.values) {
			str += "-"+ "\t ";
			str2 += f.averages[fv]+ "\t ";;
		}
		console.log(str);
		console.log(str2);

	}
}

function buildRow(){
	
	let row = {};
	row.values = {};
	for (let f in accuracy) {
		if(accuracy[f] != -1){
			row.values[f] = [];
			if(avg[f]){
				if(!row.averages){row.averages = {};}
				row.averages[f] = 0;
			}
		}	
	}
	return row;
}

function formatTime(time){
	if(timeStorageType.toLowerCase() === "iso"){
		return new Date(time).toISOString();
	}else{
		return new Date(time).valueOf();
	}
}

function print(msg,lvl =0 ){
	msg = "SL-" + (new Date()).toISOString()+": " + msg;
	if(lvl == 0){
		console.log(msg);
	}else if(lvl == 1){
		console.info(msg);
	}else{
		console.error(msg);
	}
}

function log (who, what, when = (new Date())){
	if(who === undefined || who ===""){
		print("Log needs a Who!",2);
		return;
	}
	who = who.toLowerCase();
	what = parseInt(what);
	if(what === undefined || isNaN(what)){
		print("Log needs Numeric Data!",2);
		return;
	}
	when = formatTime(when);
	if (verbose > 0 ){
		print(who + " - " + what  + " - " + when);
	}

	let datarow = data.find(function(element) {
  		return element.name === who;
	});
	if(datarow === undefined){
		datarow = buildRow();
		datarow.name = who;
		data.push(datarow);
		if (verbose > 0 ){
			print("New sensor: " + who);
		}
	}

	for (let d of dims.slice().reverse()) {
		let acc = accuracy[d];
		if(acc == -1){continue;}
		let timerow = datarow.values[d];
		let existing = timerow.length;
		if(acc == 0 || existing == 0){
			timerow.push({t:when,d:what});
			print("Estored "+ d,1);
		}else{
			var timesince = new Date(when) - new Date(timerow[timerow.length-1].t);
			if(timesince >= seperations[d]){
				if(existing < acc){
					timerow.push({t:when,d:what});
					print("stored "+ d,1);
				}else{
					print("Gotta pop "+ d,1);
				}
			}else{
				print("Not enough time passed to store as"+ d + " (" + timesince + " < " + seperations[d] + ")" ,1);
			}
		}
		break;
	}

}

module.exports.printData  =printData;
module.exports.log = log;
module.exports.data = data;