var sensorlog = require('./');

var adds = 8;
var now = new Date();
go();


function go(){
	adds--;
	if( adds <=0 ){sensorlog.printData();return;}

	var newwait = Math.random() * 15000;
	console.log("TEST: storing", adds);
	sensorlog.log("sensor1",adds);
	console.log("TEST: waiting", Math.round(newwait / 1000.0));
	setTimeout(go, newwait);
}




console.log(sensorlog.data);