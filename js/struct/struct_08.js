window.struct_08 = {
	ver: 8,
	editorVer: "08",
	main: [
		"unknown_head", "int16",
		"sht_off_cnt", "int16",
		"bomb_per_life", "float", // why is this a float? only ZUN knows
		"unknown_old_0", "int32",
		"hitbox", "float",
		"grazebox", "float",
		"item_magnet_spd", "float",
		"itembox", "float",
		"poc_line", "float", // distance of PoC from the top of the screen
		"unknown_old_1", "uint32",
		"move_nf_str", "float",
		"move_f_str", "float",
		"move_nf_dia", "float",
		"move_f_dia", "float",
		"unknown_old_2", "float",
		"sht_off", "sht_off",
		"sht_arr", "sht_arr"
	],
	sht_off: [
		"offset", "uint32",
		"power", "uint32"
	],
	sht_arr: [
		"fire_rate", "int16",
		"start_delay", "int16",
		"off_x", "float",
		"off_y", "float",
		"hitbox_x", "float",
		"hitbox_y", "float",
		"angle", "float",
		"speed", "float",
		"dmg", "int16",
		"unknown_old_sht_0", "int16",
		"option", "byte",
		"unknown_old_sht_1", "byte",
		"unknown_old_sht_2", "int16",
		"anm", "int16",
		"sfx_id", "int16",
		"func_on_init", "int32",
		"func_on_tick", "int32",
		"func_on_draw", "int32",
		"func_on_hit", "int32"
	],
	sht_off_type: "abs",
	option_pos_len: false, // they don't exist here
	max_opt: false, // ^
	flags_len: 0x0,
	flag_size: 2,
	type: "maingame",
	forced_shtoffarr_len: false,
	f_uf_shooter_split: false
};
