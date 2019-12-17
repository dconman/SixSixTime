Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}
Date.prototype.addTicks = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getMilliseconds() + days);
    return date;
}
function generateUrl(lat, long, date) {
	return `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${long}&formatted=0&date=${date.toISOString()}`;
}

function getTimeString(ticks, night)
{
	const pm = night ^ (ticks > 2.16e+7)
	const totalSeconds = Math.floor(ticks / 1000);
	const seconds = totalSeconds % 60;
	const totalMinutes = Math.floor(totalSeconds / 60);
	const minutes = totalMinutes % 60;
	const hour = ((Math.floor(totalMinutes / 60) + 5) % 12) + 1;
	
	return `${hour}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} ${night ^ (ticks > 2.16e+7) ? "PM" : "AM"}`
}

function SixSixTime(now, sunrise, sunset) {
	const night = sunset < sunrise;
	const duration = Math.abs(sunset.valueOf() - sunrise.valueOf());
	const ratio = 4.32e+7 / duration;
	const time = ratio * (now.valueOf() - (night ? sunset.valueOf() : sunrise.valueOf()));
	return getTimeString(time, night);
}

function request(url, callback) {
	const xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = () => {
		if (xhttp.readyState == 4 && xhttp.status == 200)
			callback(xhttp.responseText);
	}
	xhttp.open('GET', url);
	xhttp.send();
}

function storeResults(lat, long, now, sunrise, sunset) {
	return (responseText) => {
		try{
			const response = JSON.parse(responseText);
			let sr = new Date(response.results.sunrise);
			let ss = new Date(response.results.sunset);
			if(ss > now) sunrise = sr;
			if(sr < now) sunset = ss;
			let url;
			if (sunrise === undefined) url = generateUrl(lat, long, now.addDays(1));
			if (sunset === undefined ) url = generateUrl(lat, long, now.addDays(-1));
			if (url !== undefined) return request(url, storeResults(lat, long, now, sunrise, sunset));
			var timer = setInterval(getIntervalFunction(sunrise, sunset, timer), 1000);
		} catch (ex) {
			document.getElementById("test").innerHTML = "error parsing response: " + responseText;
			throw ex;
		}
	}
}

function getIntervalFunction(sunrise, sunset, timer) {
	return function() {
		var now = new Date();
		if(now > sunrise && now > sunset) {
			clearInterval(timer);
			getLocation();
		} else
			document.getElementById("test").innerHTML = SixSixTime(now, sunrise, sunset);
	}
}

function storeLocation(position) {
	const lat = position.coords.latitude;
	const long = position.coords.longitude;
	const now = new Date();
	const url = generateUrl(lat, long, now);
	const callback = storeResults(lat, long, now);
	request(url, callback);
}

function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(storeLocation);
  } else {
    document.getElementById("test").innerHTML = "Geolocation is not supported by this browser.";
  }
}


function test(now, am, sunrise, sunset) {
    var sr = Date.parse("2019-12-16T" + sunrise);
    var ss = Date.parse("2019-12-15T" + sunset);
    var n = Date.parse((am ? "2019-12-16T" : "2019-12-15T") + now);
    return SixSixTime(n, sr, ss);
}
