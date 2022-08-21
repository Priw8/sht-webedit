let file = null;
let reader = null;

function openFile(files) {
	let sht = files[0];
	$filename.value = sht.name;
	reader = new FileReader();
	reader.onload = f => file = f;
	reader.readAsArrayBuffer(sht);
};

function openFileJson(files) {
	let json = files[0];
	$filename.value = json.name;
	reader = new FileReader();
	reader.onload = f => file = f;
	reader.readAsBinaryString(json);
}

function readFile() {
	if (!file) return;
	let arrayBuffer = reader.result;
	let array = new Uint8Array(arrayBuffer);
	log("file loaded");
	console.log(array);
	let struct = getStruct($ver);
	currentStruct = struct;
	log("sht version "+$ver.value);
	try {
		let data = readSht(array, struct);
		generateEditorTable(data, struct);
		setFileInfo($filename.value + " (v"+struct.ver+")");
	} catch(e) {
		log("An error has occurred while parsing the .sht file. Have you selected the right .sht version?");
		error(e.toString());
		throw e;
	};
};

function readFileJson() {
	if (!file) return;
	
	let data;
	try {
		data = JSON.parse(reader.result);
	} catch(e) {
		log("An error has occurred while parsing the .json file (invalid syntax, probably)");
		error(e.toString());
		throw e;
	}
	log("file loaded (JSON)");

	let struct = getStruct($verInJson);
	currentStruct = struct;
	log("sht version "+$verInJson.value);

	try {
		generateEditorTable(data, struct);
		setFileInfo($filename.value + " (v"+struct.ver+")");
	} catch(e) {
		log("An error has occurred while loading the .json file. Have you selected the right game version?");
		error(e.toString());
		throw e;
	};
}

function readSht(arr, struct) {
	log("reading file");
	let main = struct.main;
	let offset = 0;
	let i = 0;
	let data = {};
	if (struct.ver == 10 || struct.ver == 10.3) data.pwr_lvl_cnt = 4; // janky format of a janky game

	while(offset < arr.length) {
		let prop = main[i], tmp = main[i+1].split("@");
		let type = tmp[0], typeArg = tmp[1];
		let val, len;
		log("read "+prop+" ("+type+")");
		switch(type) {
			//number types
			case "byte":
				len = 1;
				val = arr[offset];
			break;
			case "int16":
				len = 2;
				val = readInt16(arr[offset+1], arr[offset]);
			break;
			case "int32":
				len = 4;
				val = readInt32(arr[offset+3], arr[offset+2], arr[offset+1], arr[offset]);
			break;
			case "uint32":
				len = 4;
				val = readUint32(arr[offset+3], arr[offset+2], arr[offset+1], arr[offset]);
			break;
			case "float":
				len = 4;
				val = readFloat(arr[offset+3], arr[offset+2], arr[offset+1], arr[offset]);
			break;
			case "string":
				len = parseInt(typeArg);
				val = readShiftJisString(arr.slice(offset, offset + len));
			break;

			//special cases
			case "option_pos":
				len = struct.option_pos_len;
				let max = struct.ver > 12 ? struct.max_opt : data.pwr_lvl_cnt;
				val = readOptionPos(arr, offset, max, struct.ver);
			break;
			case "sht_off":
				len = data.sht_off_cnt*4;
				let {off, powers, real_sht_off_cnt} = readShtOff(arr, offset, data.sht_off_cnt, struct);
				val = off;
				data.real_sht_off_cnt = real_sht_off_cnt;
				data.powers = powers;
			break;
			case "sht_arr":
				len = 99999999999999999999999;
				val = readShtArr(arr, offset, data.sht_off, struct.sht_arr, struct.flags_len, struct.flag_size, data.pwr_lvl_cnt, struct.sht_off_type, data.powers);
			break;
			case "spellname_arr": // thanks PoFV
				val = [];
				len = 0;
				for (let i=0; i<struct.spellname_arr_len; i++) {
					val.push(readShiftJisString(arr.slice(offset + len, offset + len + struct.spellname_len)));
					len += struct.spellname_len;
				}
			break;
			default:
				throw "unknown datatype - "+type;
			break;
		};
		data[prop] = val;
		offset += len;
		i+=2;
	};
	return data;
};

function readShtArr(arr, offset, sht_off, struct, flags_len, flag_size, pwr_lvl_cnt, off_type, powers) {
	let shooters = {
		unfocused: [],
		focused: [],
		extra: [], // trance in TD is a separate shooterset
		main: [] // for old games (<TH10) which don't have shootersets split between focus/unfocus
	};
	for (let i=0; i<sht_off.length; i++){
		let foc;
		if (currentStruct.type == "maingame" && currentStruct.f_uf_shooter_split) {
			foc = i >= (pwr_lvl_cnt+1) ? "focused" : "unfocused";	
			if (i >= (pwr_lvl_cnt+1)*2) foc = "extra";
		} else if (currentStruct.f_uf_shooter_split) {
			// photogames are weird
			foc = "extra";
		} else {
			foc = "main";
		};
		let off = off_type == "rel" ? offset + sht_off[i] : sht_off[i];
		let val = readOneSht(arr, off, struct, flags_len, flag_size, i);
		if (powers[i]) val.power = powers[i];
		shooters[foc].push(val);
	};
	return shooters;
};

function readOneSht(arr, offset, struct, flags_len, flag_size, pow) {
	log("read shtset "+pow);
	let i = 0;
	let data = [];
	let shooter = 0;
	while(offset < arr.length) {
		if ((i >= struct.length || i == 0) && (arr[offset] == 255 && arr[offset+1] == 255 && arr[offset+2] == 255 && arr[offset+3] == 255)) break;
		if (i >= struct.length) {
			i = 0;
			shooter++;
		};
		let prop = struct[i], type = struct[i+1];
		let val, len;
		switch(type) {
			//number types
			case "byte":
				len = 1;
				val = arr[offset];
			break;
			case "int16":
				len = 2;
				val = readInt16(arr[offset+1], arr[offset]);
			break;
			case "int32":
				len = 4;
				val = readInt32(arr[offset+3], arr[offset+2], arr[offset+1], arr[offset]);
			break;
			case "uint32":
				len = 4;
				val = readUint32(arr[offset+3], arr[offset+2], arr[offset+1], arr[offset]);
			break;
			case "float":
				len = 4;
				val = readFloat(arr[offset+3], arr[offset+2], arr[offset+1], arr[offset]);
			break;

			//special cases
			case "flags":
				len = flags_len;
				val = [];
				for (let i=0; i<len; i+=flag_size) {
					switch(flag_size) {
						case 4:
							val.push(readInt32(arr[offset+i+3], arr[offset+i+2], arr[offset+i+1], arr[offset+i]));
							break;
						case 2:
							val.push(readInt16(arr[offset+i+1], arr[offset+i]));
					}
				};
			break;
			default:
				throw "unknown datatype - "+type;
		};
		if (!data[shooter]) data[shooter] = {};
		data[shooter][prop] = val;
		offset += len;
		i+=2;
	};
	return data;
};

function readShtOff(arr, offset, cnt, struct) {
	let off = [];
	let pow = [];
	let off_struct = struct.sht_off;

	// th18 jank
	let isFirstOffset = true;
	let real_sht_off_cnt = 0;

	// js labels oh god oh fuck
outerLoop:
	for (let i=0; i<cnt; i++) {
		for (let j=0; j<off_struct.length; j+=2) {
			if (off_struct[j] == "offset") {
				let val = readUint32(arr[offset+3], arr[offset+2], arr[offset+1], arr[offset]);
				if (val === struct.dummy_offset_value && !isFirstOffset) {
					break outerLoop;
				}
				off.push(val);
			} else if (off_struct[j] == "power") {
				let val = readUint32(arr[offset+3], arr[offset+2], arr[offset+1], arr[offset]);
				pow.push(val);
			};
			isFirstOffset = false;
			real_sht_off_cnt = i + 1;
			offset += 4;
		};
	};
	return {
		off: off,
		powers: pow,
		real_sht_off_cnt: real_sht_off_cnt
	};
};

function readOptionPos(arr, offset, max_opt, ver) {
	let opts = {
		unfocused: [],
		focused: []
	};
	for (let focused=0; focused<2; focused++) {
		for (let power=1; power<=max_opt; power++) {
			for (let i=0; i<power; i++) {
				let x = readFloat(arr[offset+3], arr[offset+2], arr[offset+1], arr[offset]);
				let y = readFloat(arr[offset+7], arr[offset+6], arr[offset+5], arr[offset+4]);
				if (!opts[focused ? "focused" : "unfocused"][power]) opts[focused ? "focused" : "unfocused"][power] = [];
				opts[focused ? "focused" : "unfocused"][power].push({
					x: x,
					y: y
				});
				offset += 8;
				if (ver == 10 || ver == 10.3) offset += 4;
			};
		};
	};
	return opts;
};
