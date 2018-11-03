let version = "1.0a";
let changelog = ["completely new UI", "code is less spaghetti", "add/remove shootersets"];
let $fileinfo, $console, $logs, $evalInput, $radDeg, $radInput, $degInput, $filetree, $container, $tip, $open, $ver, $verOut, $filename, $export, $log ,currentStruct, saveByteArray;

function getStruct($sel) {
	switch ($sel.value) {
		case "13":
			return window.struct_13;
		break;
		case "14":
		case "15":
			return window.struct_15;
		break;
		default:
			throw "unsupported version";
		break;
	};
};

window.onload = () => {
	$toolbar = document.querySelector(".toolbar");
	$fileinfo = document.querySelector(".file-info");

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