window.struct_10 = {
	ver: 10,
	editorVer: "10",
	main: [
		"unknown_head", "int16",
		"sht_off_cnt", "int16",
		"hitbox_u", "float",
		"grazebox_u", "float",
		"itembox_u", "float",
		"move_nf_str", "float",
		"move_f_str", "float",
		"move_nf_dia", "float",
		"move_f_dia", "float",
		"option_pos", "option_pos",
		"sht_off", "sht_off",
		"sht_arr", "sht_arr"
	],
	option_pos: [
		"x", "float",
		"y", "float",
		"padding", "uint32" //always 0?
	],
	sht_off: [
		"offset", "uint32",
		"jank", "int32"
	],
	sht_arr: [
		"fire_rate", "byte",
		"start_delay", "byte",
		"dmg", "int16",
		"off_x", "float",
		"off_y", "float",
		"hitbox_x", "float",
		"hitbox_y", "float",
		"angle", "float",
		"speed", "float",
		"option", "byte",
		"unknown_sht_byte_0", "byte",
		"anm", "int16",
		"anm_hit", "int16",
		"sfx_id", "int16",
		"func_on_init", "int32",
		"func_on_tick", "int32",
		"_old_on_draw", "int32",
		"func_on_hit", "int32"
	],
	sht_off_type: "abs",
	option_pos_len: 0xF0,
	max_opt: 0x08,
	flags_len: 0x0,
	flag_size: 2,
	type: "maingame",
	forced_shtoffarr_len: false,
	f_uf_shooter_split: true
};
