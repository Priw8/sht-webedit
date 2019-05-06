let version = "1.8";
let changelog = ["WBaWC demo support"];
let $fileinfo, $console, $logs, $evalInput, $radDeg, $radInput, $degInput, $filetree, $container, $tip, $open, $ver, 
	$verOut, $filename, $export, $log, $clipboard, $openLS, $openLSsel, currentStruct, saveByteArray;

function getStruct($sel, raw) {
	let val = raw ? $sel : $sel.value;
	switch (val) {
		case "07":
			return window.struct_07;
		break;
		case "08":
			return window.struct_08;
		break;
		case "10":
			return window.struct_10;
		break;
		case "alcostg":
			return window.struct_alcostg;
		break;
		case "11":
		case "12":
			return window.struct_12;
		break;
		case "12.8":
			return window.struct_128;
		break;
		case "13":
			return window.struct_13;
		break;
		case "14":
		case "15":
			return window.struct_15;
		break;
		case "14.3":
			return window.struct_143;
		break;
		case "16":
			return window.struct_16;
		break;
		case "16.5": //actually can be loaded in the same way I guess
		case "16-sub":
			return window.struct_16_sub;
		break;
		case "17tr":
			return window.struct_17tr;
		break;
		default:
			throw "unsupported version";
		break;
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

	saveByteArray = (function () {
		let a = document.createElement("a");
		a.style = "display: none";
		document.onload = () => document.body.appendChild(a);
		return function (data, name) {
			let blob = new Blob(data),
				url = window.URL.createObjectURL(blob);
			a.href = url;
			a.download = name;
			a.click();
			window.URL.revokeObjectURL(url);
		};
	}());

	initUI();
	// loadTest();
};