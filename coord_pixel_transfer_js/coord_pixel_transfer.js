// coord_pixel_transfer.as


function coord_pixel_transfer()
{
	// var obj = document.createElement("script");
	// obj.setAttribute("type", "text/javascript");
	// obj.setAttribute("src", "./js");
	// document.getElementsByTagName("head")[0].appendChild(obj);

    this._PI = Math.PI;
	this._R  = 128/this._PI;

	this._zoomLevelMin = 0.0;
	this._zoomLevelMax = 20.0;
	this._tileWidth    = 256;
	this._tileHeight   = 256;
	this._latMin = parseFloat(sprintf("%3.8f", (Math.atan(this.sinh(((128 - (256 -   0)) * this._PI) / 128))) * 180/this._PI));
	this._latMax = parseFloat(sprintf("%3.8f", (Math.atan(this.sinh(((128 - (256 - 256)) * this._PI) / 128))) * 180/this._PI));
	this._lngMin = parseFloat(sprintf("%3.8f", (((  0 * this._PI) / 128) - this._PI) * 180/this._PI));
	this._lngMax = parseFloat(sprintf("%3.8f", (((256 * this._PI) / 128) - this._PI) * 180/this._PI));
}


coord_pixel_transfer.prototype.fromLatLngToWorldCoord = function(geo)
{
	var slat = parseFloat(sprintf("%3.8f", geo.lat));
	var slng = parseFloat(sprintf("%3.8f", geo.lng));
	
	if((slat < this._latMin || slat > this._latMax) || (slng < this._lngMin || slng > this._lngMax)) {
		//throw new Error("out of range latlng.");
	}
	
	var slat_rad = slat * this._PI/180;
	var slng_rad = slng * this._PI/180;
	
	return {
		x:parseFloat(sprintf("%3.8f", this._R * (slng_rad + this._PI))),
		y:parseFloat(sprintf("%3.8f", -this._R/2 * Math.log((1 + Math.sin(slat_rad)) / (1 - Math.sin(slat_rad))) + 128))
	};
}


coord_pixel_transfer.prototype.fromWorldCoordToLatLng = function(wp)
{
	if((wp.x < 0 || wp.x > this._tileWidth) || (wp.y < 0 || wp.y > this._tileHeight)) {
		//throw new Error("out of range world coordinate.");
	}
	
	return {
		lat:parseFloat(sprintf("%3.8f", (Math.atan(this.sinh(((128 - wp.y) * this._PI) / 128))) * 180/this._PI)),
		lng:parseFloat(sprintf("%3.8f", (((wp.x * this._PI) / 128) - this._PI) * 180/this._PI))
	};
}


// ズームレベルを考慮した画面上のピクセル座標を返す
coord_pixel_transfer.prototype.fromLatLngToPixelCoord = function(geo, zoomLevel)
{
	if(zoomLevel < this._zoomLevelMin || zoomLevel > this._zoomLevelMax) {
		//throw new Error("out of range zoom level.");
	}
	
	var wc = this.fromLatLngToWorldCoord(geo);
	
	return {
		x:Math.round(wc.x * Math.pow(2, zoomLevel)),
		y:Math.round(wc.y * Math.pow(2, zoomLevel))
	};
}


coord_pixel_transfer.prototype.fromPixelCoordToLatLng = function(pp, zoomLevel)
{
	if(zoomLevel < this._zoomLevelMin || zoomLevel > this._zoomLevelMax) {
		//throw new Error("out of range zoom level.");
	}
	
	var wx = parseFloat(sprintf("%3.8f", pp.x / Math.pow(2, zoomLevel)));
	var wy = parseFloat(sprintf("%3.8f", pp.y / Math.pow(2, zoomLevel)));
	
	return this.fromWorldCoordToLatLng({ x:wx, y:wy });
}


// タイル番号を返す
coord_pixel_transfer.prototype.fromLatLngToTileCoord = function(geo, zoomLevel)
{
	var pc = this.fromLatLngToPixelCoord(geo, zoomLevel);
	
	return {
		x:parseFloat(sprintf("%u", Math.floor(pc.x / this._tileWidth))),
		y:parseFloat(sprintf("%u", Math.floor(pc.y / this._tileHeight))),
		// タイル内のピクセル座標
		tp_inner_px:parseFloat(sprintf("%u", pc.x % this._tileWidth)),
		tp_inner_py:parseFloat(sprintf("%u", pc.y % this._tileHeight))
	};
}


// タイルの左上隅(0, 0)を返す
coord_pixel_transfer.prototype.fromTileCoordToLatLng = function(tp, zoomLevel)
{
	var px = tp.x * this._tileWidth;
	var py = tp.y * this._tileHeight;
	
	return this.fromPixelCoordToLatLng({ x:px, y:py }, zoomLevel);
}


coord_pixel_transfer.prototype.getTileCountWithViewRange = function(geo1, geo2, zoomLevel)
{
	var tc1 = this.fromLatLngToTileCoord(geo1, zoomLevel);
	var tc2 = this.fromLatLngToTileCoord(geo2, zoomLevel);
	
	return {
		h:Math.abs(tc2.x - tc1.x) + 1,
		v:Math.abs(tc2.y - tc1.y) + 1
	};
}


coord_pixel_transfer.prototype.getTileSize = function()
{
	return { width: this._tileWidth, height: this._tileHeight };
}


coord_pixel_transfer.prototype.getZoomLevelRange = function()
{
	return { min: this._zoomLevelMin, max: this._zoomLevelMax };
}


coord_pixel_transfer.prototype.sinh = function(x)
{
	return (Math.exp(x) - Math.exp(-x)) / 2;
}


coord_pixel_transfer.prototype.asinh = function(x)
{
	return Math.log(x + Math.sqrt(Math.pow(x, 2) - 1));
}


coord_pixel_transfer.prototype.test = function()
{
	var t = sprintf("%f", 0.1);

    var o;
    var lat = 34.1234;
    var lng = 134.1234;

    o = this.fromWorldCoordToLatLng({ x:2, y:223 });
    //trace("(lat, lng) = " + o.lat + ", " + o.lng);

    o = this.fromLatLngToWorldCoord({ lat:lat, lng:lng });
    //trace("(wx, wy)   = " + o.x + ", " + o.y);

    o = this.fromLatLngToPixelCoord({ lat:lat, lng:lng }, 7);
    //trace("(px, py)   = " + o.x + ", " + o.y);

    o = this.fromLatLngToTileCoord({ lat:lat, lng:lng }, 7);
    //trace("(tx, ty)   = " + o.x + ", " + o.y);
}


var sprintf = (function() {
	function get_type(variable) {
		return Object.prototype.toString.call(variable).slice(8, -1).toLowerCase();
	}
	function str_repeat(input, multiplier) {
		for (var output = []; multiplier > 0; output[--multiplier] = input) {/* do nothing */}
		return output.join('');
	}

	var str_format = function() {
		if (!str_format.cache.hasOwnProperty(arguments[0])) {
			str_format.cache[arguments[0]] = str_format.parse(arguments[0]);
		}
		return str_format.format.call(null, str_format.cache[arguments[0]], arguments);
	};

	str_format.format = function(parse_tree, argv) {
		var cursor = 1, tree_length = parse_tree.length, node_type = '', arg, output = [], i, k, match, pad, pad_character, pad_length;
		for (i = 0; i < tree_length; i++) {
			node_type = get_type(parse_tree[i]);
			if (node_type === 'string') {
				output.push(parse_tree[i]);
			}
			else if (node_type === 'array') {
				match = parse_tree[i]; // convenience purposes only
				if (match[2]) { // keyword argument
					arg = argv[cursor];
					for (k = 0; k < match[2].length; k++) {
						if (!arg.hasOwnProperty(match[2][k])) {
							throw(sprintf('[sprintf] property "%s" does not exist', match[2][k]));
						}
						arg = arg[match[2][k]];
					}
				}
				else if (match[1]) { // positional argument (explicit)
					arg = argv[match[1]];
				}
				else { // positional argument (implicit)
					arg = argv[cursor++];
				}

				if (/[^s]/.test(match[8]) && (get_type(arg) != 'number')) {
					throw(sprintf('[sprintf] expecting number but found %s', get_type(arg)));
				}
				switch (match[8]) {
					case 'b': arg = arg.toString(2); break;
					case 'c': arg = String.fromCharCode(arg); break;
					case 'd': arg = parseInt(arg, 10); break;
					case 'e': arg = match[7] ? arg.toExponential(match[7]) : arg.toExponential(); break;
					case 'f': arg = match[7] ? parseFloat(arg).toFixed(match[7]) : parseFloat(arg); break;
					case 'o': arg = arg.toString(8); break;
					case 's': arg = ((arg = String(arg)) && match[7] ? arg.substring(0, match[7]) : arg); break;
					case 'u': arg = Math.abs(arg); break;
					case 'x': arg = arg.toString(16); break;
					case 'X': arg = arg.toString(16).toUpperCase(); break;
				}
				arg = (/[def]/.test(match[8]) && match[3] && arg >= 0 ? '+'+ arg : arg);
				pad_character = match[4] ? match[4] == '0' ? '0' : match[4].charAt(1) : ' ';
				pad_length = match[6] - String(arg).length;
				pad = match[6] ? str_repeat(pad_character, pad_length) : '';
				output.push(match[5] ? arg + pad : pad + arg);
			}
		}
		return output.join('');
	};

	str_format.cache = {};

	str_format.parse = function(fmt) {
		var _fmt = fmt, match = [], parse_tree = [], arg_names = 0;
		while (_fmt) {
			if ((match = /^[^\x25]+/.exec(_fmt)) !== null) {
				parse_tree.push(match[0]);
			}
			else if ((match = /^\x25{2}/.exec(_fmt)) !== null) {
				parse_tree.push('%');
			}
			else if ((match = /^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-fosuxX])/.exec(_fmt)) !== null) {
				if (match[2]) {
					arg_names |= 1;
					var field_list = [], replacement_field = match[2], field_match = [];
					if ((field_match = /^([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
						field_list.push(field_match[1]);
						while ((replacement_field = replacement_field.substring(field_match[0].length)) !== '') {
							if ((field_match = /^\.([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
								field_list.push(field_match[1]);
							}
							else if ((field_match = /^\[(\d+)\]/.exec(replacement_field)) !== null) {
								field_list.push(field_match[1]);
							}
							else {
								throw('[sprintf] huh?');
							}
						}
					}
					else {
						throw('[sprintf] huh?');
					}
					match[2] = field_list;
				}
				else {
					arg_names |= 2;
				}
				if (arg_names === 3) {
					throw('[sprintf] mixing positional and named placeholders is not (yet) supported');
				}
				parse_tree.push(match);
			}
			else {
				throw('[sprintf] huh?');
			}
			_fmt = _fmt.substring(match[0].length);
		}
		return parse_tree;
	};

	return str_format;
})();


var vsprintf = function(fmt, argv) {
	argv.unshift(fmt);
	return sprintf.apply(null, argv);
};

