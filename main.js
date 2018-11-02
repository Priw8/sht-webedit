let $log = document.querySelector("#log");
let $container = document.querySelector("#table_container");
let $tip = document.querySelector("#tip");
let $navigation = document.querySelector("#navigation");
let $eval = document.querySelector("#eval");
let $evalRes = document.querySelector("#eval_result");
let $deg = document.querySelector("#deg");
let $rad = document.querySelector("#rad");
let $ver = document.querySelector("#sht_ver");
let $filename = document.querySelector("#filename");
let $verOut = document.querySelector("#sht_ver_out");

function openFile(files) {
	let sht = files[0];
	document.head.querySelector("title").innerHTML = sht.name;
	$filename.value= sht.name;
	let reader = new FileReader();
	reader.onload = readFile;
	reader.readAsArrayBuffer(sht);
};

function readFile(file) {
	let arrayBuffer = this.result;
	let array = new Uint8Array(arrayBuffer);
	log("file loaded");
	console.log(array);
	let struct = getStruct($ver);
	log("sht version "+$ver.value);
	readSht(array, struct);
};

function getStruct($sel) {
	switch ($sel.value) {
		case "14":
		case "15":
			return window.struct_15;
		break;
		default:
			throw "unsupported version";
		break;
	};
};

function exportSht() {
	let name = $filename.value;
	if (name == "") name = "export.sht";
	let struct = getStruct($verOut);
	log("export sht v"+$verOut.value);
	let arr = getExportArr(struct);

	//it's now necessary to convert the array to binary
	let binary = new Uint8Array(arr);
	saveByteArray([binary], name);
};

function getExportArr(struct) {
	let main = struct.main;
	let arr = []; // array of bytes that will be later changed to a file
	let sht_off_off; //offset of shot array offsets
	for (let i=0; i<main.length; i+=2) {
		let prop = main[i], type = main[i+1];
		let val = Number(getLastValid(false, prop));
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
				let cnt = getLastValid(false, "sht_off_cnt");
				sht_off_off = arr.length;
				// push placeholder values
				arr.push.apply(arr, new Array(cnt*4)); //cnt - amount of offsets, every offset is uint32 so 4 bytes
				// these values will be later updated
			break;
			case "sht_arr":
				let {push, offsets} = getExportShtArr(struct);
				arr.push.apply(arr, push);
				if (offsets.length != getLastValid(false, "sht_off_cnt")) throw "shoot offset count mismatch";
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
	let pwr_lvl_cnt = getLastValid(false, "pwr_lvl_cnt");
	for (let focused=0; focused<2; focused++) {
		let foc = focused ? "focused" : "unfocused";
		for (let pow=0; pow<=pwr_lvl_cnt; pow++) {
			offsets.push(arr.length);
			for (let i=0; true; i++) {
				let shooter = getExportOneShooter(struct, "shooter-"+foc+"-"+pow+"-"+i+"-");
				if (!shooter) break;
				arr.push.apply(arr, shooter);
			};
			arr.push(255, 255, 255, 255);
		};
	};
	return {
		push: arr,
		offsets: offsets
	};
};

function getExportOneShooter(struct, path) {
	let shtStruct = struct.sht_arr;
	let arr = [];
	for (let i=0; i<shtStruct.length; i+=2) {
		let prop = shtStruct[i], type = shtStruct[i+1];
		let val = Number(getLastValid(false, path+prop));
		if (isNaN(val) && prop != "flags") return false; //end of shooters for a given power level
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
					let val = Number(getLastValid(false, path+"flag-"+j));
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
	let pwr_lvl_cnt = getLastValid(false, "pwr_lvl_cnt");
	let j = 0;
	for (let focused=0; focused<2; focused++) {
		let foc = focused ? "focused" : "unfocused";
		for (let pow=1; pow<=pwr_lvl_cnt; pow++) {
			for (let i=0; i<pow; i++) {
				let x = getLastValid(false, "option_pos-"+foc+"-"+pow+"-"+i+"-x");
				let y = getLastValid(false, "option_pos-"+foc+"-"+pow+"-"+i+"-y");
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

function readSht(arr, struct) {
	log("reading file");
	let main = struct.main;
	let offset = 0;
	let i = 0;
	let data = {};
	//TODO: unspaghetti this piece of shit
	while(offset < arr.length) {
		let prop = main[i], type = main[i+1];
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

			//special cases
			case "option_pos":
				len = struct.option_pos_len;
				val = readOptionPos(arr, offset, struct.max_opt);
			break;
			case "sht_off":
				len = data.sht_off_cnt*4;
				val = readShtOff(arr, offset, data.sht_off_cnt);
			break;
			case "sht_arr":
				len = 99999999999999999999999;
				val = readShtArr(arr, offset, data.sht_off, struct.sht_arr, struct.flags_len, data.pwr_lvl_cnt);
			break;
			default:
				throw "unknown datatype - "+type;
			break;
		};
		data[prop] = val;
		offset += len;
		i+=2;
	};
	generateEditorTable(data, struct);
};

function readShtArr(arr, offset, sht_off, struct, flags_len, pwr_lvl_cnt) {
	let shooters = {
		unfocused: [],
		focused: []
	};
	for (let i=0; i<sht_off.length; i++){
		let foc = i >= sht_off.length/2 ? "focused" : "unfocused";
		let val = readOneSht(arr, offset + sht_off[i], struct, flags_len, i);
		shooters[foc].push(val);
	};
	return shooters;
};

function readOneSht(arr, offset, struct, flags_len, pow) {
	log("read shtset "+pow);
	let i = 0;
	let data = [];
	let shooter = 0;
	while(offset < arr.length) {
		if (i >= struct.length) {
			if (arr[offset] == 255 && arr[offset+1] == 255 && arr[offset+2] == 255 && arr[offset+3] == 255) break;
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
				for (let i=0; i<len; i+=2) {
					val.push(readInt16(arr[offset+i+1], arr[offset+i]));
				};
				/*for (let i=0; i<len; i++) {
					val.push(arr[offset+i]);
				};*/
			break;
			default:
				throw "unknown datatype - "+type;
			break;
		};
		if (!data[shooter]) data[shooter] = {};
		data[shooter][prop] = val;
		offset += len;
		i+=2;
	};
	return data;
};

function readShtOff(arr, offset, cnt) {
	let off = [];
	for (let i=0; i<cnt; i++) {
		let val = readUint32(arr[offset+3], arr[offset+2], arr[offset+1], arr[offset]);
		off.push(val);
		offset += 4;
	};
	return off;
};

function readOptionPos(arr, offset, max_opt) {
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
			};
		};
	};
	return opts;
};

function readInt16(byte1, byte2) {
	let buff = new ArrayBuffer(2);
	let view = new DataView(buff);
	view.setUint8(0, byte1);
	view.setUint8(1, byte2);
	return view.getInt16(0);
};

function readFloat(byte1, byte2, byte3, byte4) {
	let buff = new ArrayBuffer(4);
	let view = new DataView(buff);
	view.setUint8(0, byte1);
	view.setUint8(1, byte2);
	view.setUint8(2, byte3);
	view.setUint8(3, byte4);
	return view.getFloat32(0);
};

function readInt32(byte1, byte2, byte3, byte4) {
	let buff = new ArrayBuffer(4);
	let view = new DataView(buff);
	view.setUint8(0, byte1);
	view.setUint8(1, byte2);
	view.setUint8(2, byte3);
	view.setUint8(3, byte4);
	return view.getInt32(0);
};

function readUint32(byte1, byte2, byte3, byte4) {
	let buff = new ArrayBuffer(4);
	let view = new DataView(buff);
	view.setUint8(0, byte1);
	view.setUint8(1, byte2);
	view.setUint8(2, byte3);
	view.setUint8(3, byte4);
	return view.getUint32(0);
};

function int16ToBytes(val) {
	let buff = new ArrayBuffer(2);
	let view = new DataView(buff);
	view.setInt16(0, val);
	return [view.getUint8(0), view.getUint8(1)]
};

function floatToBytes(val) {
	let buff = new ArrayBuffer(4);
	let view = new DataView(buff);
	view.setFloat32(0, val);
	return [view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3)];
};

function int32ToBytes(val) {
	let buff = new ArrayBuffer(4);
	let view = new DataView(buff);
	view.setInt32(0, val);
	return [view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3)];
};

function uint32ToBytes(val) {
	let buff = new ArrayBuffer(4);
	let view = new DataView(buff);
	view.setUint32(0, val);
	return [view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3)];
};


function log(txt) {
	$log.innerHTML += "<div>"+txt+"</div>";
	$log.scrollTop = 9999999;
};

function generateEditorTable(data, struct) {
	log("starting table generation");
	$navigation.innerHTML = "";
	console.log(data);
	let html = ["", "", "", ""];
	log("generate main table");
	addNavigation("main");
	html[0] += "<h2 id='nav_main'>main</h2>";
	html[0] += "<table>";
	html[0] += "<tr><th>stat</th><th>value</th></tr>";
	for (let i=0; i<struct.main.length; i+=2) {
		let stat = struct.main[i];
		let type = struct.main[i+1];
		if (type == "option_pos") {
			html[1] = generateOptionPosTable(data, struct);
		} else if (type == "sht_off") {
			html[2] = generateShotOffsetTable(data, struct);
		} else if (type == "sht_arr") {
			html[3] = generateShotArrayTable(data, struct);
		} else {
			html[0] += `
			<tr>
				<td>${stat}</td>
				<td><input value="${data[stat]}" data-type="${type}" data-stat="${stat}"></td>
			</tr>`;
		};
	};
	html[0] += "</table>";
	$container.innerHTML = html.join("<hr>") + "<hr>";
	initLastValids();
};

function generateOptionPosTable(data, struct) {
	log("generate option_pos table");
	addNavigation("option_pos");
	let html = "<h2 id='nav_option_pos'>option_pos</h2>";
	for (let focused=0; focused<2; focused++) {
		let foc = (focused ? "focused" : "unfocused");
		let pos = data.option_pos[foc];
		html +=  "<h3>"+foc+"</h3>";
		for (let i=1; i<pos.length;i++) {
			html += "<b>"+i+" power</b>";
			html += "<table>";
			html += "<tr><th>opt no.</th><th>x</th><th>y</th></tr>"
			for (let j=0; j<i; j++) {
				let coords = pos[i][j];
				html += `
				<tr>
					<td>${j}</td>
					<td><input value="${coords.x}" data-type="float" data-stat="option_pos-${foc}-${i}-${j}-x"></td>
					<td><input value="${coords.y}" data-type="float" data-stat="option_pos-${foc}-${i}-${j}-y"></td>
				</tr>
				`;
			};
			html +=  "</table><br>";
		};
	};
	return html;
};

function generateShotOffsetTable(data, struct) {
	log("generate sht_off table");
	addNavigation("sht_off");
	let html = "<h2 id='nav_sht_off'>sht_off (read only, offsets are recalculated automatically)</h2>";
	let offs = data.sht_off;
	html += "<table>";
	html += "<tr><th>no.</th><th>offset</th></tr>";
	for (let i=0; i<offs.length; i++) {
		html += `
		<tr>
			<td>${i}</td>
			<td>${offs[i]}</td>
		</tr>
		`;
	};
	html += "</table>";
	return html;
};

function generateShotArrayTable(data, struct) {
	log("generate sht_arr table");
	addNavigation("sht_arr");
	let html = "<h2 id='nav_sht_arr'>sht_arr</h2>";
	let shtstruct = struct.sht_arr;
	for (let focused=0; focused<2; focused++) {
		let foc = (focused ? "focused" : "unfocused");
		let arr = data.sht_arr[foc];
		addNavigation("sht_arr_"+foc);
		html += "<h3 id='nav_sht_arr_"+foc+"'>"+foc+"</h3>";
		for (let pow=0; pow<arr.length; pow++) {
			let shooters = arr[pow];
			addNavigation("sht_arr_"+foc+"_"+pow);
			html += "<b id='nav_sht_arr_"+foc+"_"+pow+"'>"+pow+" power "+foc+"</b>";
			for (let i=0; i<shooters.length; i++) {
				let shooter = shooters[i];
				html += "<i>shooter "+i+"</i>";
				html += "<table>";
				html += "<tr><th>stat</th><th>value</th></tr>";
				for (let j=0; j<shtstruct.length; j+=2) {
					let stat = shtstruct[j];
					let type = shtstruct[j+1];
					if (type == "flags") {
						let flen = struct.flags_len/2;
						for (let flag=0; flag<flen; flag++) {
							html += `
							<tr>
								<td>flag ${flag}</td>
								<td><input value="${shooter.flags[flag]}" data-type="int16" data-stat="shooter-${foc}-${pow}-${i}-flag-${flag}"></td>
							</tr>
							`;
						};
					} else {
						html += `
						<tr>
							<td>${stat}</td>
							<td><input value="${shooter[stat]}" data-type="${type}" data-stat="shooter-${foc}-${pow}-${i}-${stat}"></td>
						</tr>
						`;
					};
				};
				html += "</table>";
			};
		};
	};
	return html;
};

function addNavigation(id) {
	$navigation.innerHTML += "<div onclick='navigate(\""+id+"\")'>- "+id+"</div>";
};

function navigate(id) {
	location.href = location.origin + location.pathname + "#nav_"+id;
};

function generateTips() {
	document.addEventListener("mouseover", e => {
		let $targ = e.target;
		if ($targ.dataset.type) showTip($targ);
	});
	document.addEventListener("mouseout", e => {
		let $targ = e.target;
		if ($targ.dataset.type) hideTip();
	});
};

function showTip($targ) {
	$tip.style.display = "block";
	let rect = $targ.getBoundingClientRect();
	let left = rect.left;
	let top = rect.top + window.scrollY;
	let targW = rect.width;
	let targH = rect.height;
	$tip.innerHTML = $targ.dataset.type;
	let tipW = $tip.offsetWidth;
	let tipH = $tip.offsetHeight;

	$tip.style.left = left + targW/2 - tipW/2;
	$tip.style.top = top - tipH - 2;

	$tip.style.opacity = 1;
};

function hideTip() {
	$tip.style.opacity = 0;
	$tip.style.display = "none";
};

generateTips();

function validateInputListen(e) {
	let $targ = e.target;
	if ($targ.dataset.type) {
		validateInput($targ, $targ.value, $targ.dataset.type);
	};
};

function validateInput($targ, val, type) {
	switch(type) {
		case "byte":
			if (isNaN(val)) $targ.value = getLastValid($targ);
			if (val < 0) $targ.value = 0;
			if (val > 255) $targ.value = 255;
		break;
		case "int16":
			if (isNaN(val) && val != "-") $targ.value = getLastValid($targ);
			if (val < -32768) $targ.value = -32768;
			if (val > 32767) $targ.value = 32767;
		break;
		case "int32":
			if (isNaN(val) && val != "-") $targ.value = getLastValid($targ);
			if (val < -2147483648) $targ.value = -2147483648;
			if (val > 2147483647) $targ.value = 2147483647;
		break;
		case "uint32":
			if (isNaN(val)) $targ.value = getLastValid($targ);
			if (val < 0) $targ.value = 0;
			if (val > 4294967295) $targ.value = 4294967295; 
		break;
		case "float":
			if (isNaN(val) && val != "-") $targ.value = getLastValid($targ);
		break;
	};
	saveLastValid($targ);
};

let lastValidVals = {};

function saveLastValid($targ) {
	lastValidVals[$targ.dataset.stat] = $targ.value;
};

function getLastValid($targ, stat) {
	return lastValidVals[$targ ? $targ.dataset.stat : stat];
};

function initLastValids() {
	let $inps = document.querySelectorAll("[data-stat]");
	$inps.forEach(saveLastValid);
};

function initInputValidation() {
	document.addEventListener("keydown", validateInputListen);
	document.addEventListener("keyup", validateInputListen);
};

initInputValidation();

function doEval() {
	let val = $eval.value;
	$evalRes.innerHTML = eval(val);
};

function toDeg() {
	$deg.value = parseFloat(($rad.value * 180 / Math.PI).toFixed(5));
};

function toRad() {
	$rad.value = $deg.value * Math.PI / 180;
};

let saveByteArray = (function () {
    let a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    return function (data, name) {
        let blob = new Blob(data),
            url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = name;
        a.click();
        window.URL.revokeObjectURL(url);
    };
}());