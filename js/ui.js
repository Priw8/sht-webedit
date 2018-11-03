let tables = {
	main: null,
	option_pos: null,
	sht_off: null,
	sht_arr: {
		unfocused: [],
		focused: [],
		extra: []
	},
	active: null
};

let activeTable = [false];

let shtObject = null;

function getTemplate(classname) {
	let temp = document.querySelector("."+classname+".template").cloneNode(true);
	temp.classList.remove("template");
	return temp;
};

function setFileInfo(txt) {
	$fileinfo.innerText = txt;
	document.head.querySelector("title").innerText = txt;
};

function toolbarClick(e) {
	let $targ = e.target;
	if ($targ.dataset.toolbar)  {
		toolbarAction($targ.dataset.toolbar);
	};
};

function toolbarAction(action) {
	switch(action) {
		case "open":
			openImport();
		break;
		case "opentest":
			loadTest();
		break;
		case "export":
			openExport();
		break;
		case "console":
			openConsole();
		break;
		case "raddeg":
			openRadDeg();
		break;
		case "github":
			window.open("https://github.com/Priw8/sht-webedit",  "_blank");
		break;
		case "info":
			openInfo();
		break;
	};
};

let activeWindows = [];
let draggedWindow = null;
let dragOrigin = {left: 0, top: 0};

function editorWindow(options) {
	let $wnd = getTemplate("editor-window");
	let $header =  $wnd.querySelector(".window-header");
	let $content = $wnd.querySelector(".window-content");

	if (options.header) {
		if (activeWindows.indexOf(options.header) > -1) return;
		activeWindows.push(options.header);
		$header.innerHTML = options.header;
	};
	if (options.content) {
		if (typeof options.content == "string") $content.innerHTML = options.content;
		else $content.appendChild(options.content);
	};
	if (options.width) $wnd.style.width = options.width + "px";
	document.body.appendChild($wnd);

	let rect = $wnd.getBoundingClientRect();
	$wnd.style.left = window.innerWidth/2 - rect.width/2 + "px";
	$wnd.style.top = window.innerHeight/2 - rect.height/2 + "px";

	let $close = $wnd.querySelector(".window-close");
	$close.addEventListener("click", e => {
		if (options.close) options.close(e);
		if (options.header) activeWindows.splice(activeWindows.indexOf(options.header), 1);
		document.body.removeChild($wnd);
	});

	$header.addEventListener("mousedown", e => {
		draggedWindow = $wnd;
		dragOrigin.left = e.offsetX;
		dragOrigin.top = e.offsetY;
		let $top = document.querySelector(".on-top");
		if ($top) $top.classList.remove("on-top");
		$wnd.classList.add("on-top");
	});

	if (options.success) options.success();
};

function openImport() {
	editorWindow({
		header: "Open",
		content: $open,
		width: 313
	});
};

function openExport() {
	if (!shtObject) return error("Can't export a file before loading it");
	editorWindow({
		header: "Export",
		content: $export,
		width: 275
	});
};

function loadTest() {
	let $script = document.createElement("script");
	$script.src = "js/test.js";
	document.head.appendChild($script);
};

function openRadDeg() {
	editorWindow({
		header: "Radian converter",
		content: $radDeg,
		width: 324
	});
};

function toDeg() {
	$degInput.value = parseFloat(($radInput.value * 180 / Math.PI).toFixed(5));
};

function toRad() {
	$radInput.value = $degInput.value * Math.PI / 180;
};

function openInfo() {
	editorWindow({
		header: "Info",
		content: "<b>.sht webeditor v"+version+" by Priw8</b>discord: Priw8#9873<br><br><b>Changelog</b>- "+changelog.join("<br>- "),
		width: 300
	});
};

function openConsole() {
	editorWindow({
		header: "Console",
		content: $console
	});
	$log.scrollTop = 9999999;
};

function log(txt) {
	$log.innerHTML += "<div>"+txt+"</div>";
	$log.scrollTop = 9999999;
};

function error(txt) {
	log("Error: " + txt);
	openConsole();
};

function doEval() {
	let val = $evalInput.value;
	$evalInput.value = "";
	log("&gt; "+val);
	try {
		let res = eval(val);
		log("&lt; " + res);
	} catch(e) {
		log(e.toString());
	};
};

function getLastValid(table, stat, foc, pow) {
	try {
		if (table == "sht_arr") {
			let [i, rstat, flagno] = stat.split("-");
			if (rstat != "flag") return shtObject[table][foc][pow][i][rstat];
			return shtObject[table][foc][pow][i].flags[flagno]
		} else if (table == "main") {
			return shtObject[stat];
		} else if (table == "option_pos") {
			let [foc, pow, i, coord] = stat.split("-");
			return shtObject[table][foc][pow][i][coord];
		};
	} catch(e) {
		return 0;
	};
};

function onInput(e) {
	let $targ = e.target;
	if ($targ.dataset.type) {
		tableInput($targ, $targ.value, $targ.dataset.type, $targ.dataset.stat);
	};
};

function tableInput($targ, val, type, stat) {
	switch(type) {
		case "byte":
			if (isNaN(val)) $targ.value = getLastValid(activeTable[0], activeTable[1], activeTable[2], stat);
			if (val < 0) $targ.value = 0;
			if (val > 255) $targ.value = 255;
		break;
		case "int16":
			if (isNaN(val) && val != "-") $targ.value = getLastValid(activeTable[0], activeTable[1], activeTable[2], stat);
			if (val < -32768) $targ.value = -32768;
			if (val > 32767) $targ.value = 32767;
		break;
		case "int32":
			if (isNaN(val) && val != "-") $targ.value = getLastValid(activeTable[0], activeTable[1], activeTable[2], stat);
			if (val < -2147483648) $targ.value = -2147483648;
			if (val > 2147483647) $targ.value = 2147483647;
		break;
		case "uint32":
			if (isNaN(val)) $targ.value = getLastValid(activeTable[0], activeTable[1], activeTable[2], stat);
			if (val < 0) $targ.value = 0;
			if (val > 4294967295) $targ.value = 4294967295; 
		break;
		case "float":
			if (isNaN(val) && val != "-") $targ.value = getLastValid(activeTable[0], activeTable[1], activeTable[2], stat);
		break;
	};

	updateData(Number($targ.value), stat);
};

function updateData(val, stat) {
	let table = activeTable[0], foc = activeTable[1], pow = activeTable[2];
	if (table == "sht_arr") {
		let [i, rstat, flagno] = stat.split("-");
		if (rstat != "flag") shtObject[table][foc][pow][i][rstat] = val;
		else shtObject[table][foc][pow][i].flags[flagno] = val;
	} else if (table == "main") {
		shtObject[stat] = val;
	} else if (table == "option_pos") {
		let [foc, pow, i, coord] = stat.split("-");
		shtObject[table][foc][pow][i][coord] = val
	};
};

function initUI() {
	$toolbar.addEventListener("click", toolbarClick);

	document.addEventListener("mousemove", e => {
		if (draggedWindow) {
			draggedWindow.style.left = e.clientX - dragOrigin.left + "px";
			draggedWindow.style.top = e.clientY - dragOrigin.top + "px";
			let rect = draggedWindow.getBoundingClientRect();
			if (rect.top < 0) draggedWindow.style.top = "0px";
			if (rect.left < 0) draggedWindow.style.left = "0px";
			if (rect.left > window.innerWidth - rect.width) draggedWindow.style.left = window.innerWidth - rect.width + "px";
			if (rect.top > window.innerHeight - rect.height) draggedWindow.style.top = window.innerHeight - rect.height + "px";
		};
	});
	document.addEventListener("mouseup", e => {
		draggedWindow = null;
	});

	$evalInput.addEventListener("keydown", e => {
		if (e.which == 13) doEval();
	})

	document.addEventListener("mouseover", e => {
		let $targ = e.target;
		if ($targ.dataset.type) showTip($targ);
	});
	document.addEventListener("mouseout", e => {
		let $targ = e.target;
		if ($targ.dataset.type) hideTip();
	});

	document.addEventListener("keydown", onInput);
	document.addEventListener("keyup", onInput);
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

	$tip.style.left = left + targW/2 - tipW/2 + "px";
	$tip.style.top = top - tipH - 2 + "px";

	$tip.style.opacity = 1;
};

function hideTip() {
	$tip.style.opacity = 0;
	$tip.style.display = "none";
};

function generateFileTree(regen) {
	let html = "";

	html += "<div data-tree='main' onclick='loadTable(\"main\", false, false, this)' class='filetree-entry'>main</div>";
	html += "<div data-tree='option_pos' onclick='loadTable(\"option_pos\", false, false, this)' class='filetree-entry'>option_pos</div>";
	html += "<div data-tree='sht_off' onclick='loadTable(\"sht_off\", false, false, this)' class='filetree-entry'>sht_off</div>";

	html += "<div data-tree='sht_arr_unfocused' class='filetree-entry expandable hidden'>";
		html += "<div onclick='expandTree(this)' class='expandable-text'>sht_arr_unfocused</div>";
		for (let i=0; i<tables.sht_arr.unfocused.length; i++) {
			html += "<div data-tree='unfocused-"+i+"' class='expandable-option'><span onclick='loadTable(\"sht_arr\", \"unfocused\", "+i+", this)'>"+i+" power</span> <span onclick='removeShooterset(\"unfocused\", "+i+")'>(remove)</span></div>";
		};
		html += "<div onclick='addShooterset(\"unfocused\")' class='expandable-option'><span>Add new</span></div>";
	html += "</div>";

	html += "<div data-tree='sht_arr_focused' class='filetree-entry expandable hidden'>";
		html += "<div onclick='expandTree(this)'class='expandable-text'>sht_arr_focused</div>";
		for (let i=0; i<tables.sht_arr.focused.length; i++) {
			html += "<div data-tree='focused-"+i+"' class='expandable-option'><span onclick='loadTable(\"sht_arr\", \"focused\", "+i+", this)'>"+i+" power</span> <span onclick='removeShooterset(\"focused\", "+i+")'>(remove)</span></div>";
		};
		html += "<div onclick='addShooterset(\"focused\")' class='expandable-option'><span>Add new</span></div>";
	html += "</div>";

	html += "<div data-tree='sht_arr_extra' class='filetree-entry expandable hidden'>";
		html += "<div onclick='expandTree(this)' class='expandable-text'>sht_arr_extra</div>";
		for (let i=0; i<tables.sht_arr.extra.length; i++) {
			html += "<div data-tree='extra-"+i+"' class='expandable-option'><span onclick='loadTable(\"sht_arr\", \"extra\", "+i+", this)'>extra "+i+"</span> <span onclick='removeShooterset(\"extra\", "+i+")'>(remove)</span></div>";
		};
		html += "<div onclick='addShooterset(\"extra\")' class='expandable-option'><span>Add new</span></div>";
	html += "</div>";

	let $els;
	if (regen) $els = document.querySelectorAll("[data-tree]");
	else $els = [];
	$filetree.innerHTML = html;

	for (let i=0; i<$els.length; i++) {
		let $old = $els[i];
		let dat = $old.dataset.tree;
		let $new = document.querySelector("[data-tree='"+dat+"']");
		if ($new) $new.classList.value = $old.classList.value;
	};
};

function expandTree($node) {
	let $parent = $node.parentElement;
	$parent.classList.toggle("hidden");
};

function loadTable(type, foc, pow, $btt) {
	let $active = tables.active;
	if ($active) $container.removeChild($active);

	let $activebtt = document.querySelector(".tree-active");
	if ($activebtt) $activebtt.classList.remove("tree-active");

	$btt.classList.add("tree-active");
	
	let $table;
	if (type != "sht_arr") {
		$table = tables[type];
	} else {
		let arr = table = tables[type][foc][pow];
		$table = document.createElement("div");
		arr.forEach(a => $table.appendChild(a));
	};
	$container.appendChild($table);
	tables.active = $table;

	activeTable = [type, foc, pow, $btt];
};

function reloadCurrentEditor() {
	loadTable.apply(window, activeTable);
};

function generateEditorTable(data, struct) {
	$active = null;
	tables.active = null;
	$container.innerHTML = "";
	log("starting table generation");
	console.log(data);
	log("generate main table");

	let html = "";
	html += "<table>";
	html += "<tr><th>stat</th><th>value</th></tr>";
	for (let i=0; i<struct.main.length; i+=2) {
		let stat = struct.main[i];
		let type = struct.main[i+1];
		if (type == "option_pos") {
			generateOptionPosTable(data, struct);
		} else if (type == "sht_off") {
			generateShotOffsetTable(data, struct);
		} else if (type == "sht_arr") {
			generateShootArrayTable(data, struct);
		} else {
			html += `
			<tr>
				<td>${stat}</td>
				<td><input value="${data[stat]}" data-type="${type}" data-stat="${stat}"></td>
			</tr>`;
		};
	};
	html += "</table>";

	let $main = document.createElement("div");
	$main.innerHTML = html;
	tables.main = $main;

	generateFileTree();
};

function generateOptionPosTable(data, struct) {
	shtObject = data;
	log("generate option_pos table");
	let html = "";
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
					<td><input value="${coords.x}" data-type="float" data-stat="${foc}-${i}-${j}-x"></td>
					<td><input value="${coords.y}" data-type="float" data-stat="${foc}-${i}-${j}-y"></td>
				</tr>
				`;
			};
			html +=  "</table><br>";
		};
	};
	
	let $option_pos = document.createElement("div");
	$option_pos.innerHTML = html;
	tables.option_pos = $option_pos;
};

function generateShotOffsetTable(data, struct) {
	log("generate sht_off table");
	let offs = data.sht_off;
	let html = "";
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
	
	let $sht_off = document.createElement("div");
	$sht_off.innerHTML = html;
	tables.sht_off = $sht_off;
};

function generateShootArrayTable(data, struct) {
	log("generate sht_arr table");
	let shtstruct = struct.sht_arr;
	for (let focused=0; focused<3; focused++) {
		let foc;
		if (focused == 0) foc = "unfocused";
		else if (focused == 1) foc = "focused";
		else foc = "extra";
		let arr = data.sht_arr[foc];
		tables.sht_arr[foc] = [];
		for (let pow=0; pow<arr.length; pow++) {
			let shooters = arr[pow];
			tables.sht_arr[foc][pow] = [];
			let i=0;
			for (i; i<shooters.length; i++) {
				let html = generateOneShooterTable(shooters[i], shtstruct, struct.flags_len, foc, pow, i);
				let $wrap = document.createElement("div");
				$wrap.classList.add("shooter-table");
				$wrap.innerHTML = html;
				tables.sht_arr[foc][pow].push($wrap);
			};
			let $btt = document.createElement("button");
			$btt.style.width = "100%";
			$btt.style.height = "50px";
			$btt.style.fontSize = "20px";
			$btt.innerHTML = "Add a new shooter";
			$btt.addEventListener("click", addShooter);
			tables.sht_arr[foc][pow].push($btt);
		};
	};
};

function generateOneShooterTable(shooter, shtstruct, flags_len, foc, pow, i) {
	let html = "";
	html += "<i>shooter "+i+"</i>";
	html += "<button style='width: 100%' onclick='removeShooter("+i+", this)'>remove shooter</button>";
	html += "<table>";
	html += "<tr><th>stat</th><th>value</th></tr>";
	for (let j=0; j<shtstruct.length; j+=2) {
		let stat = shtstruct[j];
		let type = shtstruct[j+1];
		if (type == "flags") {
			let flen = flags_len/2;
			for (let flag=0; flag<flen; flag++) {
				html += `
				<tr>
					<td>flag ${flag}</td>
					<td><input value="${shooter.flags[flag]}" data-type="int16" data-stat="${i}-flag-${flag}"></td>
				</tr>
				`;
			};
		} else {
			html += `
			<tr>
				<td>${stat}</td>
				<td><input value="${shooter[stat]}" data-type="${type}" data-stat="${i}-${stat}"></td>
			</tr>
			`;
		};
	};
	html += "</table>";
	return html;
};

function addShooter() {
	let shooter = generateEmptyShooterFromStruct(currentStruct);
	let [table, foc, pow] = activeTable;
	let arr = shtObject.sht_arr[foc][pow];
	arr.push(shooter);

	// regenerate tables
	generateShootArrayTable(shtObject, currentStruct);
	reloadCurrentEditor();
};

function removeShooter(i, $btt) {
	// remove shooter
	let [table, foc, pow] = activeTable;
	let arr = shtObject.sht_arr[foc][pow];
	arr.splice(i, 1);

	// regenerate tables
	generateShootArrayTable(shtObject, currentStruct);
	reloadCurrentEditor();
};

function generateEmptyShooterFromStruct(struct) {
	let shtStruct = struct.sht_arr;
	let flen = struct.flags_len;
	let shooter = {};
	for (let i=0; i<shtStruct.length; i+=2) {
		let prop = shtStruct[i], type = shtStruct[i+1];
		if (type != "flags") shooter[prop] = 0;
		else {
			shooter[prop] = new Array(flen);
			for (let i=0; i<flen; i++) {
				shooter[prop][i] = 0;
			};
		};
	};
	return shooter;
};

function addShooterset(foc) {
	let arr = shtObject.sht_arr[foc];
	arr.push([]);
	generateShootArrayTable(shtObject, currentStruct);
	generateFileTree(true);
};

function removeShooterset(foc, i) {
	let arr = shtObject.sht_arr[foc];
	arr.splice(i, 1);
	if (activeTable[0] == "sht_arr" && activeTable[1] == foc && activeTable[2] == i) {
		$container.innerHTML = "";
		$active = null;
		tables.active = null;
	};
	generateShootArrayTable(shtObject, currentStruct);
	generateFileTree(true);
};