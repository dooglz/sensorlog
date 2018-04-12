var sensorlog = require('./');

var adds = 12;
//var times = [7,8,9,11,11,11,1,2,3,11,5,9,10,2];
var now = new Date();

//sensorlog.log("sensor1",101,new Date("01/01/11"));
//sensorlog.log("sensor1",201,new Date("01/01/12"));
//sensorlog.log("sensor1",50,new Date("01/01/13"));
//sensorlog.log("sensor1",22,new Date("01/01/14"));
//sensorlog.log("sensor1",33,new Date("01/01/15"));


testMin(new Date(),1);
//sensorlog.printData();
//testHour(new Date("02/jan/18"),100);
//sensorlog.printData();
//testHour(new Date("03/jan/18"),1000);
sensorlog.printData();
//console.log(sensorlog.getAll());
console.log(sensorlog.getAllNow());
console.log(sensorlog.getAll());
let g =6;

function testMin(dt,val){
	let d = new Date(dt);
	for (let index = 0; index < 60; index++) {
		sensorlog.log("sensor1",val++, d);
		d.setSeconds(d.getSeconds() + 1);
	}
}
function testHour(dt,val){
	let d = new Date(dt);
	for (let index = 0; index < 60; index++) {
		testMin(d,val++);
		d.setMinutes(d.getMinutes() + 1);
	}
}


function go(){
	adds--;
	if( adds <=0 ){sensorlog.printData();return;}

	//var newwait = Math.random() * 15000;
	var newwait = times[adds % times.length ] * 1000;
	console.log("TEST: storing", adds);
	sensorlog.log("sensor1",adds);
	console.log("TEST: waiting", Math.round(newwait / 1000.0));
	sensorlog.printData();
	setTimeout(go, newwait);
}
