
let verbosity = 0;
let timeStorageType = "unix" //actually milseconds
let data = [];
let quantities = { year: 12, month: 30, day: 24, hour: 60, minute: 60, second: 60 };
let average = { year: true, month: true, day: true, hour: true, minute: true, second: false };
let dims = ["year", "month", "day", "hour", "minute", "second"];
let durations = { year: 31536000000, month: 2592000000, day: 86400000, hour: 3600000, minute: 60000, second: 1000 };
let separations = {
	year: Math.floor(durations.year / quantities.year),
	month: Math.floor(durations.month / quantities.month),
	day: Math.floor(durations.day / quantities.day),
	hour: Math.floor(durations.hour / quantities.hour),
	minute: Math.floor(durations.minute / quantities.minute),
	second: Math.floor(durations.second / quantities.second),
};
let yearoffest = 2018;
let decimals = 0;
let discard = true;




function buildRow() {
	let row = {};
	row.averages = {};
	row.raw = [];
	for (let f in quantities) {
		row.averages[f] = [];
	}
	return row;
}

function formatTime(time) {
	if (timeStorageType.toLowerCase() === "iso") {
		return new Date(time).toISOString();
	} else {
		return new Date(time).valueOf();
	}
}

function print(msg, lvl = 0, verb = 1) {
	if (verb > verbosity) { return; }
	msg = "SL-" + (new Date()).toISOString() + ": " + msg;
	if (lvl == 0) {
		console.log(msg);
	} else if (lvl == 1) {
		console.info(msg);
	} else {
		console.error(msg);
	}
}

function log(who, what, when = (new Date())) {
	if (who === undefined || who === "") {
		print("Log needs a Who!", 2);
		return;
	}
	who = who.toLowerCase();
	what = parseInt(what);
	if (what === undefined || isNaN(what)) {
		print("Log needs Numeric Data!", 2);
		return;
	}
	when = formatTime(when);
	print(who + " - " + what + " - " + when);

	let datarow = data.find(function (element) {
		return element.name === who;
	});
	if (datarow === undefined) {
		datarow = buildRow();
		datarow.name = who;
		data.push(datarow);
		print("New sensor: " + who,0,1);
	}

	let datapoint = { t: when, d: what };
	save(datarow, datapoint);
	normalize(datarow);
};

function save(datarow, datapoint) {
	print("save: " + datapoint.d, 0, 3);
	datarow.raw.push(datapoint);
};

function _round(v) {
	return Math.round(v * Math.pow(10, decimals)) / Math.pow(10, decimals);
}
function _average(array, element) {
	if (array.length == 0) { return undefined; }
	if (element && array[0][element] !== undefined) {
		if (array.length == 1) { return array[0][element] }
		return _round(array.reduce((a, b) => a + b[element]) / array.length);
	}
	return _round(array.reduce((a, b) => a + b) / array.length);
}

function isWithin(now, value, width) {
	value = new Date(value);
	now = new Date(now);
	if (value.getFullYear() == now.getFullYear()) {
		if (width == "year") { return true; }
		if (value.getMonth() == now.getMonth()) {
			if (width == "month") { return true; }
			if (value.getDate() == now.getDate()) {
				if (width == "day") { return true; }
				if (value.getHours() == now.getHours()) {
					if (width == "hour") { return true; }
					if (value.getMinutes() == now.getMinutes()) {
						if (width == "minute") { return true; }
						if (value.getSeconds() == now.getSeconds()) {
							if (width == "second") { return true; }
							print("what do you want?!: " + width, 2, 2);
						}
					}
				}
			}
		}
	}
	return false;
}

function normalize(datarow) {
	const now = new Date(datarow.raw[datarow.raw.length - 1].t);

	if (discard) {
		datarow.raw = datarow.raw.filter(a => isWithin(now, a.t, "minute"));
	}

	let vals = {};
	for (let i = datarow.raw.length - 1; i >= 0; i--) {
		const element = datarow.raw[i];
		const ed = new Date(element.t);
		if (ed.getFullYear() < yearoffest) {
			print("New value is really old!", 2, 1);
			//Well this is a pain. TODO Test This.
			const nudge = yearoffest - ed.getFullYear();
			for (let j = 0; j <= nudge; j++) {
				for (let dr in data) {
					dr.averages.year.unshift(0);
				}
			}
		}
	}

	datarow.averages.second[now.getSeconds()] = _average(datarow.raw.filter((a) => isWithin(now, a.t, "second")), "d");
	datarow.averages.minute[now.getMinutes()] = _average(datarow.averages.second.filter((a, i) => i <= now.getSeconds()));
	datarow.averages.hour[now.getHours()] = _average(datarow.averages.minute.filter((a, i) => i <= now.getMinutes()));
	datarow.averages.day[now.getDate()] = _average(datarow.averages.hour.filter((a, i) => i <= now.getHours()));
	datarow.averages.month[now.getMonth()] = _average(datarow.averages.day.filter((a, i) => i <= now.getDate()));
	datarow.averages.year[now.getFullYear() - yearoffest] = _average(datarow.averages.month.filter((a, i) => i <= now.getMonth()));
};

//Get all data of all sensors
function getAll() {
	let ret = {};
	for (let f of data) {
		ret[f.name] = get(f.name);
	}
	return ret;
}

//Get all data of sensor
function get(sensor) {
	const datarow = data.find(function (element) {
		return element.name === sensor;
	});
	if (datarow === undefined) {
		return undefined;
	}
	const latest = datarow.raw[datarow.raw.length - 1];
	const now = new Date(latest.t);
	let ret = {
		second: datarow.averages.second.slice(),
		minute: datarow.averages.minute.slice(),
		hour: datarow.averages.hour.slice(),
		day: datarow.averages.day.slice(),
		month: datarow.averages.month.slice(),
		year: datarow.averages.year.slice(),
		last: latest.d,
		asof: formatTime(latest.t),
		raw: datarow.raw.slice()
	}
	//reorder ret to make te most sense
	ret.second = ret.second.reverse().slice(ret.second.length - now.getSeconds() - 1, ret.second.length).concat(ret.second.slice(0, ret.second.length - now.getSeconds() - 1));
	ret.minute = ret.minute.reverse().slice(ret.minute.length - now.getMinutes() - 1, ret.minute.length).concat(ret.minute.slice(0, ret.minute.length - now.getMinutes() - 1));
	ret.hour = ret.hour.reverse().slice(ret.hour.length - now.getHours() - 1, ret.hour.length).concat(ret.hour.slice(0, ret.hour.length - now.getHours() - 1));
	ret.day = ret.day.reverse().slice(ret.day.length - now.getDate() - 1, ret.day.length).concat(ret.day.slice(0, ret.day.length - now.getDate() - 1));
	ret.month = ret.month.reverse().slice(ret.month.length - now.getMonth() - 1, ret.month.length).concat(ret.month.slice(0, ret.month.length - now.getMonth() - 1));
	ret.year = ret.year.reverse().slice(ret.year.length - now.getFullYear() - 1, ret.year.length).concat(ret.second.slice(0, ret.year.length - now.getFullYear() - 1));
	return ret;
}

//Get the latest data we have for all sensors
function getAllNow() {
	let ret = {};
	for (let f of data) {
		ret[f.name] = getNow(f.name);
	}
	return ret;
};

//Get the latest data we have for sensor
function getNow(sensor) {
	const datarow = data.find(function (element) {
		return element.name === sensor;
	});
	if (datarow === undefined) {
		return undefined;
	}
	const latest = datarow.raw[datarow.raw.length - 1].t;
	return {
		second: datarow.averages.second[latest.getSeconds()],
		minute: datarow.averages.minute[latest.getMinutes()],
		hour: datarow.averages.hour[latest.getHours()],
		day: datarow.averages.day[latest.getDate()],
		month: datarow.averages.month[latest.getMonth()],
		year: datarow.averages.year[latest.getFullYear() - yearoffest],
		last: latest.d,
		asof: formatTime(latest.t)
	}
}

function getData(){
  return data;
}
function setData(d){
	data = d;
}

function printData() {
	for (let f of data) {
		console.log(f.name);
		let str = "";
		for (let fv in f.averages) {
			str += fv + "\t ";
		}
		console.log(str);
		str = "";
		let i = 0;
		let bl = true;
		while (bl) {
			str = "";
			bl = false;
			for (let fv in f.averages) {
				bl = bl || i < f.averages[fv].length;
				if (f.averages[fv][i]) {
					str += f.averages[fv][i] + "\t ";
				} else {
					str += " " + "\t ";
				}
			}
			console.log(str);
			i++;
		}
	}
}

module.exports.getAll = getAll;
module.exports.get = get;
module.exports.getAllNow = getAllNow;
module.exports.getNow = getNow;
module.exports.printData = printData;
module.exports.log = log;
module.exports.data = data;
module.exports.verbosity = verbosity;