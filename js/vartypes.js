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