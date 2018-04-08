
let verbose = 4;
let timeStorageType = "unix" //actually milseconds
let data = [];
let accuracy = {year:1,month:12,day:30,hour:6,minute:6,second:-1};
let average = {year:true,month:true,day:true,hour:true,minute:true,second:false};
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
			if(average[f]){
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

function print(msg,lvl =0,verb = 1){
	if(verb > verbose){return;}
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
	print(who + " - " + what  + " - " + when);

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

	let datapoint = {t:when,d:what};
	save(datarow,datapoint);
	normalize(datarow);
}

function save(datarow, datapoint, startdim =0){
	print("save: "+datapoint.d,0,3);
	for (let i = dims.length - 1 - startdim; i >= 0; i--) {
		let d = dims[i];
		print("ddg: "+d,0,2);
		let acc = accuracy[d];
		//If we never save this dim
		if(acc == -1){continue;}

		let timerow = datarow.values[d];
		let existing = timerow.length;

		//If we save all values for this dim, or no values exist yet
		if(acc == 0 || existing == 0){
			timerow.push(datapoint);
			print("Estored "+ d,0,2);
		}else{
			//Some Values already exist
			var timesince = new Date(datapoint.t) - new Date(timerow[timerow.length-1].t);
			if(timesince < 0){print("TIMEWARP! ",0,2);}
			//Shouldl we save this value?
			if(timesince >= seperations[d]){
				if(existing <= acc){
					timerow.push(datapoint);
					print("stored "+ d,0,2);
				}else{
					timerow.push(datapoint);
					print("stored "+ d,0,2);
					//we have too many values for this dim
					print("Gotta pop "+ d,0,3);
				}
			}else{
				//Throw away value!
				print("Not enough time passed to store in "+ d + " (" + timesince + " < " + seperations[d] + ")" ,1);
			}
		}
		break;
	}
}


function normalize(datarow){
	for (let i = dims.length - 1; i >= 0; i--) {
		let d = dims[i];
		let acc = accuracy[d];
		//If we never save this dim
		if(acc == -1){continue;}
		let timerow = datarow.values[d];
		let existing = timerow.length;


		if (existing > acc){
			print(datarow.name + "Popping "+ d,0,3);
			//get average
			let avg = doAverageDim(datarow,d);
			if(average[d]){
				//save to data if we doin that
				datarow.averages[d] = avg;
			}
			let datapoint = {t:formatTime(new Date()),d:avg};
			//save avg to larger dim
			save(datarow,datapoint,dims.length - i);
			//pop off extra data
			datarow.values[d] = timerow.slice(timerow.length - (acc+1));
		}	else if(acc == 0){
			let didmove = false;
			//pop off old data
			//These better be in order!
			let now = new Date();
			for (let j = timerow.length - 1; j >= 0; j--) {
				if(now - timerow[j].t > durations[d]){
					//add a new average value to larger dim before popping
					if(!didmove){
						let avg = doAverageDim(datarow,d);
						if(average[d]){
							//save to data if we doin that
							datarow.averages[d] = avg;
						}
						let datapoint = {t:formatTime(new Date()),d:avg};
						//save avg to larger dim
						save(datarow,datapoint,dims.length - i);
					}
					didmove = true;
					print("popping old data"+ timerow[j].d + " _ " + d,0,2);
					//TODO: actually pop data
				}
			}


		}

	}
}




function doAverageDim(datarow, dim){
	print(datarow.name + "Averaging "+ dim,0,3);
	let total = 0;
	let count = 0;
	for (var i = datarow.values[dim].length - 1; i >= 0; i--) {
		total += datarow.values[dim][i].d;
		count++;
	}
	let avg = (Math.round((total / count) * 100)) / 100;
	return avg;
}

module.exports.printData  =printData;
module.exports.log = log;
module.exports.data = data;







