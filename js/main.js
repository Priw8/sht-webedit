// NEWHOU
let version = "2.5a";
let changelog = [
	"add UDoALG support (very experimental, there are unknown fields and some may have incorrect sizes!)"
];
let $fileinfo, $console, $logs, $evalInput, $radDeg, $radInput, $degInput, $filetree, $container, $tip, $open, $ver, 
	$verOut, $filename, $export, $log, $clipboard, $openLS, $openLSsel, currentStruct, saveByteArray, validationOff = false;

function getStruct($sel, raw) {
	let val = raw ? $sel : $sel.value;
	switch (val) {
		case "07":
			return window.struct_07;
		case "08":
			return window.struct_08;
		case "09":
			return window.struct_09;
		case "10":
			return window.struct_10;
		case "alcostg":
			return window.struct_alcostg;
		case "11":
		case "12":
			return window.struct_12;
		case "12.8":
			return window.struct_128;
		case "13":
			return window.struct_13;
		case "14":
			return window.struct_14;
		case "14.3":
			return window.struct_143;
		case "15":
			return window.struct_15;
		case "16":
			return window.struct_16;
		case "16.5": //actually can be loaded in the same way I guess
		case "16-sub":
			return window.struct_16_sub;
		case "17":
			return window.struct_17;
		case "18":
			return window.struct_18;
		case "18.5":
			return window.struct_185;
		case "19":
			return window.struct_19;
		// NEWHOU
		default:
			throw "unsupported version";
	};
};

window.onload = () => {
	$toolbar = document.querySelector(".toolbar");
	$fileinfo = document.querySelector(".file-info");
	$clipboard = document.querySelector(".clipboard-content");

	$console = document.querySelector(".console");
	$log = $console.querySelector(".log");
	$evalInput = document.querySelector(".eval-input");

	$radDeg = document.querySelector(".raddeg");
	$radInput = $radDeg.querySelector(".rad-input");
	$degInput = $radDeg.querySelector(".deg-input");

	$filetree = document.querySelector(".file-tree");
	$container = document.querySelector(".table-container");
	$tip = document.querySelector(".tip");

	$open = document.querySelector(".open");
	$verSel = document.querySelector(".version-select");
	$ver = document.querySelector(".sht-ver");

	$export = document.querySelector(".export");
	$filename = document.querySelector(".filename");
	$verOut = document.querySelector(".sht-ver-out");
	$verOut.innerHTML = $ver.innerHTML;

	$openLS = document.querySelector(".openLS");
	$openLSsel = document.querySelector(".openLS-sel");

	$openJson = document.querySelector(".openJson");
	$verInJson = document.querySelector(".json-ver-in");
	$verInJson.innerHTML = $ver.innerHTML;

	saveDataToFile = (function () {
		let a = document.createElement("a");
		a.style = "display: none";
		document.onload = () => document.body.appendChild(a);
		return function (data, name) {
			let blob = new Blob(data),
				url = window.URL.createObjectURL(blob);
			a.href = url;
			a.download = name;
			a.dispatchEvent(new MouseEvent("click", {bubbles: true, cancelable: true, view: window})); // a.click() doesn't work on firefox, unless the element is added to DOM
			window.URL.revokeObjectURL(url);
		};
	}());

	initUI();
	// loadTest();
};
