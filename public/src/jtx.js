/* JavaScript Type Extensions (jtx) provides useful methods associated with
   specific JavaScript datatypes, but (unlike previous implementations) without
   monkey patching.
*/

define(function(require, module, exports) {
	var jtx = {
		String: {},
		Array: {},
		Object: {},
		Date: {},
		Number: {}
	};
	
	/* --- String Extensions --- */

	jtx.String.capitalize = function(obj) {
		var parts = obj.split(' ');
		for (var i = 0; i < parts.length; i++) {
			if (parts[i].length > 0) {
				var part = parts[i];
				parts[i] = part[0].toUpperCase() + part.substr(1);
			}
		}
		return parts.join(' ');
	};
	
	jtx.String.strip = function(str) {
		return str.replace(/^\s+/, '').replace(/\s+$/, '');
	};

	/* --- Array Extensions --- */

	jtx.Array.intersect = function(obj, rhs) {
		var result = [];
		obj.forEach(function(val) {
			if (rhs.indexOf(val) >= 0) {
				result.push(val);
			}
		});
		return result;
	};

	jtx.Array.union = function(obj, rhs) {
		var result = [];
		obj.forEach(function(val) {
			if (result.indexOf(val) < 0) {
				result.push(val);
			}
		});
		rhs.forEach(function(val) {
			if (result.indexOf(val) < 0) {
				result.push(val);
			}
		});
		return result;
	};

	jtx.Array.argsort = function(obj, args) {
		/* Returns a copy of the Array *obj* in which entries are sorted by the
		   values in the Array *args*.
		*/
		var copy = JSON.parse(JSON.stringify(obj));
		return copy
			.map((item, index) => [args[index], item]) // add the clickCount to sort by
  			.sort(([count1], [count2]) => count2 - count1) // sort by the clickCount data
  			.map(([, item]) => item); // extract the sorted items
	};

	jtx.Array.unique = function(obj) {
		/* Returns an Array consisting of the unique entries from the given
		   Array. This is effectively a union with itself.
		*/
		return jtx.Array.union(obj, obj);
	};

	jtx.Array.mask = function(obj, mask) {
		/* Returns a copy of the given array with non-True corresponding
		   entries from mask removed.
		*/
		var matches = [];
		obj.forEach(function(val, ndx) {
			if (mask[ndx]) { matches.push(val); }
		});
		return matches;
	};

	/* --- Object Extensions --- */

	jtx.Object.copy = function(obj) {
		return JSON.parse(JSON.stringify(obj));
	};

	jtx.Object.override = function(obj, rhs) {
		var result = jtx.Object.copy(obj);
		var keys = jtx.Array.intersect(Object.keys(obj), Object.keys(rhs));
		keys.forEach(function(key) { result[key] = rhs[key]; });
		return result;
	};
	
	jtx.Object.class = function(obj) {
		/* Returns string of class name from parsing object constructor of
		   given instance. Also works with constructors.
		*/
		var c = "";
		if (typeof(obj) == typeof({})) {
			c = obj.constructor.toString();
		} else if (typeof(obj) == typeof(function(){})) {
			c = obj.toString();
		} else {
			console.error("Class name inspection must operate on constructor function or instance");
		}
		var m = c.match(/function ([^\(]+)\(/);
		return m[1];
	};

	/* --- Date Extensions --- */

	jtx.Date.j2000_nx = Date.UTC(2000, 0, 1, 12, 0, 0) * 1e-3;
	jtx.Date.j2000_jd = 2451545.0;

	jtx.Date.toJulian = function(obj) {
		/* Converts a JavaScript Date object to a Julian date value
		*/
		var dt_s = obj.getTime() * 1e-3 - jtx.Date.j2000_nx;
		return jtx.Date.j2000_jd + dt_s / 86400;
	};
	
	jtx.Date.fromJulian = function(jd) {
		/* Converts a Julian date value to a JavaScript Date object
		*/
		var obj = new Date();
		var dt_s = (jd - jtx.Date.j2000_jd) * 86400;
		obj.setTime((jtx.Date.j2000_nx + dt_s) * 1e3);
		return obj;
	};
	
	jtx.Date.toGMST = function(obj) {
		var y, m, d, H, M, S;
		[y,m,d,H,M,S] = jtx.Date.ymdHMS(obj);
		var J0 = 367 * y - Math.floor(7 * (y + Math.floor((m + 9) / 12)) / 4) + Math.floor(275 * m / 9) + d + 1721013.5;
		var UT = H + M / 60 + S / 3600;
		var T0 = (J0 - 2451545) / 36525;
		var GST0 = 1.004606184e2 + 3.600077004e4 * T0 + 3.87933e-4 * T0**2 - 2.583e-8 * T0**3;
		var GMST_deg = (GST0 + 360.98564724 * UT / 24) % 360;
		return GMST_deg * Math.PI / 180;
	};

	jtx.Date.ymdHMS = function(obj) {
		// Returns year, month, day, hour, minute, and second in standard UTC
		var y = obj.getUTCFullYear();
		var m = obj.getUTCMonth() + 1;
		var d = obj.getUTCDate();
		var H = obj.getUTCHours();
		var M = obj.getUTCMinutes();
		var S = obj.getUTCSeconds();
		return [y,m,d,H,M,S];
	};

	jtx.Date.isLeapYear = function(obj) {
		/* Returns *true* if the given year of the given date is a leap year.
		*/
		var fy = obj.getFullYear();
		return (fy % 4 == 0) && ((fy % 100 != 0) || (fy % 1000 == 0));
	};

	jtx.Date.getDayOfYear = function(obj) {
		/* Returns number of days + day fraction since the beginning of the
		   year. The first day of the year results in a '1' value (plus the day
		   fraction).
		*/
		var boy = new Date(obj.getFullYear(), 0, 1, 0, 0, 0);
		return (obj - boy + 8.64e7) / 8.64e7;
	};

	jtx.Date.getTimezoneName = function(obj) {
		var dtf = new Intl.DateTimeFormat('en-AU', { timeZoneName: 'long' });
		var str = dtf.format(obj);
		var tzn = str.split(', ')[1];
		return tzn;
	};

	jtx.Date.getTimezoneAbbr = function(obj) {
		var tzn = jtx.Date.getTimezoneName(obj);
		var abbr = '';
		tzn.split(' ').forEach(function(part) {
			abbr += part[0];
		});
		return abbr;
	};

	jtx.Date.getWeekOfYear = function(obj) {
		/* Returns the number of weeks (rounded up) since the first Sunday of
		   this year. Days occuring before the first Sunday of the year belong
		   to week 0.
		*/
		var boy = new Date(obj.getFullYear(), 0, 1, 0, 0, 0);
		var sun = new Date(boy.valueOf() + (7 - boy.getDay()) * 8.64e7);
		var daysFromSun = (obj.valueOf() - sun.valueOf()) / 8.64e7;
		return Math.abs(Math.ceil((daysFromSun + 1) / 7));
	};

	jtx.Date.format = function(obj, fmt) {
		/* Date format method using percent-marked entries, as defined by:
		   https://docs.python.org/2/library/datetime.html#strftime-strptime-behavior
		*/
		var dow = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
		var mth = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
		var us = 1e3 * obj.getMilliseconds();
		var tzh = Math.abs(obj.getTimezoneOffset() /  60);
		var tzs = jtx.Number.zeroPad(Math.floor(tzh), 2) + jtx.Number.zeroPad(Math.floor((tzh % 1.0) * 60), 2);
		var map = {
			'%a': dow[obj.getDay()].substring(0,3),
			'%A': dow[obj.getDay()],
			'%w': obj.getDay(),
			'%d': jtx.Number.zeroPad(obj.getDate(), 2),
			'%b': mth[obj.getMonth()].substring(0,3),
			'%B': mth[obj.getMonth()],
			'%m': jtx.Number.zeroPad(obj.getMonth() + 1, 2),
			'%y': jtx.Number.zeroPad(obj.getFullYear() % 100, 2),
			'%Y': obj.getFullYear(),
			'%H': jtx.Number.zeroPad(obj.getHours(), 2),
			'%I': jtx.Number.zeroPad(obj.getHours() % 12, 2),
			'%p': obj.getHours() > 12 ? 'PM' : 'AM',
			'%M': jtx.Number.zeroPad(obj.getMinutes(), 2),
			'%S': jtx.Number.zeroPad(obj.getSeconds(), 2),
			'%f': jtx.Number.zeroPad(us, 6),
			'%z': obj.getTimezoneOffset() >= 0 ? '-' + tzs : '+' + tzs,
			'%Z': jtx.Date.getTimezoneAbbr(obj),
			'%j': jtx.Number.zeroPad(Math.floor(jtx.Date.getDayOfYear(obj)), 3),
			'%U': jtx.Number.zeroPad(jtx.Date.getWeekOfYear(obj), 2),
			'%W': jtx.Date.getWeekOfYear(new Date(obj.valueOf() + 8.64e7))
		};
		map['%X'] = map['%H'] + ':' + map['%M'] + ':' + map['%S'];
		map['%c'] = map['%a'] + ' ' + map['%b'] + ' ' + map['%d'] + ' ' + map['%X'] + ' ' + map['%Y'];
		map['%x'] = map['%m'] + '/' + map['%d'] + '/' + map['%y'];
		var formatted = fmt.replace('%%', '%');
		Object.keys(map).forEach(function(key) {
			var re = RegExp(key, 'g');
			formatted = formatted.replace(re, map[key]);
		});
		return formatted;
	};

	/* --- Number Extensions --- */

	jtx.Number.zeroPad = function(obj, length) {
		/* Returns a string of the given number with zeros padded to ensure
		   integer (pre-decimal) length.
		*/
		var result = String(obj);
		var n = obj > 0 ? length - Math.floor(Math.log10(obj)) - 1 : length - 1;
		result = (n > 0 ? '0'.repeat(n) : '') + result;
		return result;
	};

	jtx.Number.ordinalSuffix = function(obj) {
		/* Returns the two-letter suffix appropriate for the given natural
		   number. Defaults to 'th' for any number not 1, 2, or 3.
		*/
		if (obj == 1) {
			return 'st';
		} else if (obj == 2) {
			return 'nd';
		} else if (obj == 3) {
			return 'rd';
		} else {
			return 'th';
		}
	};
	
	jtx.Number.getMachEps = function(scale) {
		/* Returns the machine epsilon value (the value for which the language
		   precision is incapable of determining precision-constrained
		   differences). Optionally, can be computed for a specific reference
		   value (*scale*), which defaults to 1.
		*/
		if (typeof(scale) == 'undefined') { scale = 1.0; }
		var machEps = scale;
		while (scale + machEps > scale) {
			machEps *= 0.5;
		}
		return machEps;
	};
	
	return jtx;
});
