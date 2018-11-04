function exportSht() {
	let name = $filename.value;
	if (name == "") name = "export.sht";
	let struct = getStruct($verOut);
	log("export sht v"+$verOut.value);
	let arr;
	try {
		validateExport(shtObject, struct);
		arr = getExportArr(struct);
	} catch(e) {
		log("An error has occurred while exporting the .sht file.");
		error(e.toString());
		throw e;
	};

	// it's now necessary to convert the array to binary
	let binary = new Uint8Array(arr);
	saveByteArray([binary], name);
};

function validateExport(data, struct) {
	let ver = struct.ver;

	//validate power level in games that can't change it (ZUN's parser is janky and expects shooterset array to always start at the same position, which won't happen with different power levels)
	if (!struct.pwr_editable) {
		if (data.pwr_lvl_cnt != struct.def_power) throw "pwr_lvl_cnt must be "+struct.def_power+" in this version because ZUN's parser is janky";
	};

	//check if trance shooterset exists
	if (ver == 13) {
		if (data.sht_arr.extra.length < 1) throw "trance shooterset doesn't exist";
	};

	//check amount of foc/unfoc shootersets
	//ingore for photogames since their .shts are janky
	if (struct.type == "maingame") {
		let len = data.pwr_lvl_cnt + 1;
		if (data.sht_arr.focused.length != len) throw "bad amount of focused shootersets (should be "+len+")";
		if (data.sht_arr.unfocused.length != len) throw "bad amount of unfocused shootersets (should be "+len+")";
	};

	//check if sht_off_cnt equals the amount of shootersets
	let cnt = data.sht_off_cnt;
	let sum = data.sht_arr.unfocused.length + data.sht_arr.focused.length + data.sht_arr.extra.length;
	if (cnt != sum) throw "bad sht_off_cnt (should be "+sum+")";
};

function getExportArr(struct) {
	let main = struct.main;
	let arr = []; // array of bytes that will be later changed to a file
	let sht_off_off; //offset of shot array offsets
	for (let i=0; i<main.length; i+=2) {
		let prop = main[i], type = main[i+1];
		let val = Number(getLastValid("main", prop));
		switch(type) {
			case "byte":
				arr.push(val);
			break;
			case "int16":
				arr.push.apply(arr, int16ToBytes(val).reverse());
			break;
			case "int32":
				arr.push.apply(arr, int32ToBytes(val).reverse());
			break;
			case "uint32":
				arr.push.apply(arr, uint32ToBytes(val).reverse());
			break;
			case "float":
				arr.push.apply(arr, floatToBytes(val).reverse());
			break;

			//special
			case "option_pos":
				arr.push.apply(arr, getExportOptPos(struct));
			break;
			case "sht_off":
				let cnt = getLastValid("main", "sht_off_cnt");
				sht_off_off = arr.length;
				// push placeholder values
				arr.push.apply(arr, new Array(cnt*4)); //cnt - amount of offsets, every offset is uint32 so 4 bytes
				// these values will be later updated
			break;
			case "sht_arr":
				let {push, offsets} = getExportShtArr(struct);
				arr.push.apply(arr, push);
				if (offsets.length != getLastValid("main", "sht_off_cnt")) throw "shoot offset count mismatch (should be "+offsets.length+")";
				for (let j=0; j<offsets.length; j++) {
					let bytes = uint32ToBytes(offsets[j]).reverse();
					for (let k=0; k<4; k++) {
						arr[sht_off_off + j*4 + k] = bytes[k];
					};
				};
			break;
		};
	};
	console.log(arr);
	return arr;
};

function getExportShtArr(struct) {
	let arr = [];
	let offsets = [];
	let pwr_lvl_cnt = getLastValid("main", "pwr_lvl_cnt");

	// photogames only have extra shootersets
	if (struct.type == "maingame") {
		for (let focused=0; focused<2; focused++) {
			let foc = focused ? "focused" : "unfocused";
			for (let pow=0; pow<=pwr_lvl_cnt; pow++) {
				offsets.push(arr.length);
				let shooterset = shtObject.sht_arr[foc][pow];
				if (shooterset) {
					for (let i=0; i<shooterset.length; i++) {
						let shooter = getExportOneShooter(struct, foc, pow, i);
						if (!shooter) break;
						arr.push.apply(arr, shooter);
					};
				};
				arr.push(255, 255, 255, 255);
			};
		};
	};

	// extra shootersets (such as trance in TD)
	let extra = shtObject.sht_arr.extra;
	for (let cnt=0; cnt<extra.length; cnt++) {
		offsets.push(arr.length);
		let shooterset = extra[cnt];
		for (let i=0; i<shooterset.length; i++) {
			let shooter = getExportOneShooter(struct, "extra", cnt, i);
			if (!shooter) break;
			arr.push.apply(arr, shooter);
		};
		arr.push(255, 255, 255, 255);
	};
	return {
		push: arr,
		offsets: offsets
	};
};

function getExportOneShooter(struct, foc, pow, index) {
	let shtStruct = struct.sht_arr;
	let arr = [];
	for (let i=0; i<shtStruct.length; i+=2) {
		let prop = shtStruct[i], type = shtStruct[i+1];
		let val = Number(getLastValid("sht_arr", index+"-"+prop, foc, pow));
		switch(type) {
			case "byte":
				arr.push(val);
			break;
			case "int16":
				arr.push.apply(arr, int16ToBytes(val).reverse());
			break;
			case "int32":
				arr.push.apply(arr, int32ToBytes(val).reverse());
			break;
			case "uint32":
				arr.push.apply(arr, uint32ToBytes(val).reverse());
			break;
			case "float":
				arr.push.apply(arr, floatToBytes(val).reverse());
			break;

			//special
			case "flags":
				let cnt = struct.flags_len/2;
				for (let j=0; j<cnt; j++) {
					let val = Number(getLastValid("sht_arr", index+"-flag-"+j, foc, pow));
					arr.push.apply(arr, int16ToBytes(val).reverse());
				};
			break;
		};
	};
	return arr;
};

function getExportOptPos(struct) {
	let arr = new Array(struct.option_pos_len);
	for (let i=0; i<arr.length; i++) arr[i] = 0;
	let pwr_lvl_cnt = getLastValid("main", "pwr_lvl_cnt");
	let j = 0;
	for (let focused=0; focused<2; focused++) {
		let foc = focused ? "focused" : "unfocused";
		for (let pow=1; pow<=struct.max_opt; pow++) {
			for (let i=0; i<pow; i++) {
				let x = getLastValid("option_pos", foc+"-"+pow+"-"+i+"-x");
				let y = getLastValid("option_pos", foc+"-"+pow+"-"+i+"-y");
				let xBytes = floatToBytes(x).reverse();
				let yBytes = floatToBytes(y).reverse();
				for (let k=0; k<4; k++) arr[j+k] = xBytes[k];
				for (let k=4; k<8; k++) arr[j+k] = yBytes[k-4];
				j+=8;
			};
		};
	};
	return arr;
};
