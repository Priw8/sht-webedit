function exportSht() {
	let name = $filename.value;
	if (name == "")
		name = exportType == EXPORT.JSON ? "export.json" : "export.sht";

	if (exportType == EXPORT.JSON) {
		saveDataToFile([JSON.stringify(shtObject, null, 4)], name);
		return;
	}

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

	// global var set in ui.js
	switch(exportType) {
		case EXPORT.SHT:
			saveDataToFile([new Uint8Array(arr)], name);	
			break;

		case EXPORT.LS:
			exportToLS(arr, name, struct.editorVer);
			break;
	}
};

function err(txt, fatal) {
	error(txt);
	if (!fatal) {
		if (validationOff) log("Validation is off, ignoring error..."); 
		else throw "Use '<span style=\"color:lime\">validation off</span>' command in this console to try to export despite the error.";
	} else throw log("Fatal error - cannot export this!");
}

function validateExport(data, struct) {
	let ver = struct.ver;

	//check if trance shooterset exists
	if (ver == 13) {
		if (data.sht_arr.extra.length < 1)  err("trance shooterset doesn't exist");
	};

	//check amount of foc/unfoc shootersets
	//ingore for photogames since their .shts are janky
	if (struct.type == "maingame") {
		let len = data.pwr_lvl_cnt + 1;
		if (!isNaN(len)) {
			if (struct.f_uf_shooter_split) {
				if (data.sht_arr.focused.length != len) err("bad amount of focused shootersets (should be "+len+")");
				if (data.sht_arr.unfocused.length != len) err("bad amount of unfocused shootersets (should be "+len+")");
			};
		};
	};

	if (data.sht_off_cnt < data.real_sht_off_cnt) err("sht_off_cnt must not be smaller than real_sht_off_cnt", true);

	//check if sht_off_cnt equals the amount of shootersets
	let cnt = data.real_sht_off_cnt;
	let sum = data.sht_arr.unfocused.length + data.sht_arr.focused.length + data.sht_arr.extra.length +  data.sht_arr.main.length;
	if (cnt != sum) err("bad real_sht_off_cnt (should be "+sum+")");

	//ZUN's parser is jank and expects shooterset array offset to be static, so some games have forced shtoffarr lengths
	if (struct.forced_shtoffarr_len) {
		if (data.sht_off_cnt != struct.forced_shtoffarr_len)
			err(
`ZUN's parser is jank and expects shooterset array to start at a static offset,
so sht_off_cnt must be ${struct.forced_shtoffarr_len}. If you want it to be smaller,
you can set real_sht_off_cnt to the value you want - empty offsets will be automatically inserted,
to match the required amount. If you want it to be bigger, you can't`
			);
	};
};

function getExportArr(struct) {
	let main = struct.main;
	let arr = []; // array of bytes that will be later changed to a file
	let sht_off_off; //offset of shot array offsets
	for (let i=0; i<main.length; i+=2) {
		let prop = main[i], type = main[i+1];
		let val = getLastValid("main", prop);
		if (!val) val = getLastValid("main", prop+"_u"); // check if unused values exist (for converting from new to old)
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
				let entrySize = struct.ver > 12 ? 4 : 8; // TODO: bad hardcode, compute the size from the struct instead of checking version
				
				for (let i=0; i<cnt*entrySize; ++i) {
					arr.push(struct.dummy_offset_value ?? 0);
				}
			break;
			case "sht_arr":
				let {push, offsets, powers} = getExportShtArr(struct);
				arr.push.apply(arr, push);

				if (offsets.length != getLastValid("main", "real_sht_off_cnt"))
					err("shoot offset count mismatch (should be "+offsets.length+") - this indicates a bad real_sht_off_cnt", true);
				
				let entrysize = struct.ver > 12 ? 4 : 8; // TODO: same bad hardcode as above
				for (let j=0; j<offsets.length; j++) {
					let off = struct.sht_off_type == "rel" ? offsets[j] : offsets[j] + sht_off_off + offsets.length*entrysize;
					let bytes = uint32ToBytes(off).reverse();
					for (let k=0; k<4; k++) {
						arr[sht_off_off + j*entrysize + k] = bytes[k];
					};
					if (entrysize == 8) {
						if (struct.f_uf_shooter_split) { // MoF - UFO
							if ((j == 0 || j == offsets.length/2) && struct.ver != 10.3) { //alcostg has to be different of course
								arr[sht_off_off + j*entrysize + 4] = 0x08;
								arr[sht_off_off + j*entrysize + 5] = 0x00;
								arr[sht_off_off + j*entrysize + 6] = 0x00;
								arr[sht_off_off + j*entrysize + 7] = 0x00;
							} else {
								arr[sht_off_off + j*entrysize + 4] = 0xE7;
								arr[sht_off_off + j*entrysize + 5] = 0x03;
								arr[sht_off_off + j*entrysize + 6] = 0x00;
								arr[sht_off_off + j*entrysize + 7] = 0x00;
								//int32=999
							};
						} else { // <MoF
							let bytes = uint32ToBytes(powers[j]).reverse();
							for (let k=0; k<4; k++) {
								arr[sht_off_off + j*entrysize + k + 4] = bytes[k];
							};
						};
					};
				};
			break;
			case "spellname_arr":
				arr.push.apply(arr, getExportSpellNameArray(struct));
			break;
		};
	};
	console.log(arr);
	return arr;
};

function getExportSpellNameArray(struct) {
	let arr = shtObject.spellname_arr;
	let bytes = [];
	for (let i=0; i<arr.length; i++) bytes.push.apply(bytes, shiftJisStringToBytes(arr[i], struct.spellname_len));
	return bytes;
}

function getExportShtArr(struct) {
	let arr = [];
	let offsets = [];
	let powers = []; // for <TH10
	let pwr_lvl_cnt = getLastValid("main", "pwr_lvl_cnt");

	// photogames only have extra shootersets
	if (struct.type == "maingame") {
		if (struct.f_uf_shooter_split) {
			for (let focused=0; focused<2; focused++) {
				let foc = focused ? "focused" : "unfocused";
				for (let pow=0; pow<=pwr_lvl_cnt; pow++) {
					let shooterset = shtObject.sht_arr[foc][pow];
					if (shooterset) {
						offsets.push(arr.length);
						for (let i=0; i<shooterset.length; i++) {
							let shooter = getExportOneShooter(struct, foc, pow, i);
							if (!shooter) break;
							arr.push.apply(arr, shooter);
						};
					};
					arr.push(255, 255, 255, 255);
				};
			};
		} else {
			// when exporting from new to old, don't delete shootersets by accident but put them all into main instead
			let types = ["main", "unfocused", "focused", "extra"];
			for (let type=0; type<4; type++) {
				let shootersets = shtObject.sht_arr[types[type]];
				for (let j=0; j<shootersets.length; j++) {
					offsets.push(arr.length);
					let shooterset = shootersets[j];
					for (let i=0; i<shooterset.length; i++) {
						let shooter = getExportOneShooter(struct, types[type], j, i);
						arr.push.apply(arr, shooter);
					};
					powers.push(typeof shooterset.power != "undefined" ? shooterset.power : 999);
					arr.push(255, 255, 255, 255);
				};
			};
		};
	};

	// extra shootersets (such as trance in TD)
	let extra = shtObject.sht_arr.extra;
	let extraBak = cloneObject(shtObject.sht_arr.extra);
	
	// when converting from an older format, put 'main' shooters into extra so they don't get lost
	if (struct.f_uf_shooter_split && shtObject.sht_arr.main.length) extra.push.apply(extra, shtObject.sht_arr.main);

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

	shtObject.sht_arr.extra = extraBak;

	return {
		push: arr,
		offsets: offsets,
		powers: powers
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
				let cnt = struct.flags_len/struct.flag_size;
				for (let j=0; j<cnt; j++) {
					let val = Number(getLastValid("sht_arr", index+"-flag-"+j, foc, pow));
					let data;
					switch(struct.flag_size) {
						case 2:
							data = int16ToBytes(val).reverse();
							break;
						case 4:
							data = int32ToBytes(val).reverse();
							break;
					}
					arr.push.apply(arr, data);
				};
			break;
		};
	};
	return arr;
};

function getExportOptPos(struct) {
	let arr = new Array(struct.option_pos_len);
	for (let i=0; i<arr.length; i+=4) {
		if (struct.ver > 12) {
			arr[i] = 0x00;
			arr[i+1] = 0x00;
			arr[i+2] = 0x00;
			arr[i+3] = 0x00;
		} else {
			arr[i] = 0x00;
			arr[i+1] = 0xC0;
			arr[i+2] = 0x79;
			arr[i+3] = 0xC4;
			// 999.0f
		};
	};
	let pwr_lvl_cnt = getLastValid("main", "pwr_lvl_cnt");
	let j = 0;
	let max = struct.ver > 12 ? struct.max_opt : shtObject.pwr_lvl_cnt;
	for (let focused=0; focused<2; focused++) {
		let foc = focused ? "focused" : "unfocused";
		for (let pow=1; pow<=max; pow++) {
			for (let i=0; i<pow; i++) {
				let x = getLastValid("option_pos", foc+"-"+pow+"-"+i+"-x");
				let y = getLastValid("option_pos", foc+"-"+pow+"-"+i+"-y");
				let xBytes = floatToBytes(x).reverse();
				let yBytes = floatToBytes(y).reverse();
				for (let k=0; k<4; k++) arr[j+k] = xBytes[k];
				for (let k=4; k<8; k++) arr[j+k] = yBytes[k-4];
				j+=8;
				if (struct.ver == 10 || struct.ver == 10.3) { // janky game with some weirdass padding
					arr[j] = 0;
					arr[j+1] = 0;
					arr[j+2] = 0;
					arr[j+3] = 0;
					j+=4;
				};
			};
		};
	};
	return arr;
};
