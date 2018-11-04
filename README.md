# sht-webedit
a tool for editing .sht files used in Touhou games - https://priw8.github.io/sht-webedit/

### Supported games
- TH12 - Undefined Fantastic Object
- TH12.8 - Great Fairy Wars
- TH13 - Ten Desires
- TH14 - Double Dealing Character
- TH14.3 - Impossible Spell Card
- TH15 - Legacy of Lunatic Kingdom
- TH16 - Hidden Star in Four Seasons
- TH16.5 - Violet Detector

the tool will be updated with support for more games.

### Features
- load data of .sht files into editable tables
- freely modify shootersets
- export edited data back to .sht
- some tools to make life easier (console for evaluating js code, radians <-> degrees converer)

### TODO
- support more games

### How .sht files work
Basically there's a header (the "main" table) which stores the basic informations. After the header, there are option positions for each power level (power level = option count). Then there's the shooterset offset array, which stores offsets of shootersets in the shooterset array. The shooterset array comes right after the shooterset offset array, and consists of shootersets separated by 4 FF bytes. Basically, if pwr_lvl_cnt (max power level) is 4, there should be 10 shootersets - 5 for each power level of the unfocused shot and 5 for each level of the focused shot (0 power shooterset exists, despite power starting at 1 in the game. It's used in HSiFS during the Okina finals). In some cases, there can be more shootersets (TD has one more for trance mode). A shooterset itself is a set of shooters (duh). A shooter contains data of a single bullet the player/option fires, and the frequency it should fire at. So if you want an option to shoot 2 bullets at once, you have to assign it to 2 shooters.

### Brief usage instructions
**main table**

- *_u - unused (afaik)
- sht\_off\_cnt: length of the shooter offset array
- move\_nf/f\_str/dia - unfocused/focused speed when moving straight/diagonally
- pwr\_lvl\_cnt - max power level

**option_pos table**

(I think it doesn't require explaining)

**sht_off table**

the shooterset offset array, you can ignore it as the offsets are recalculated automatically when exporting

**sht_arr tables**

shootersets for each power level of focused/unfocused mode. There's also "extra" at the end, this is where unusual things like TD trance shootersets go

shooter tables

- fire_rate - delay between bullets being shot (LoLK also has a flag that affects this?)
- start_delay - delay before the shooter activates after pressing the shot key
- off_x/y - x/y offset of bullet spawning from the sprite the shooter is assigned to
- hitbox_x/y - obvious
- angle - angle at which the bullets fire (in radians; 0 is straight right)
- speed - speed at which the bullets move
- option - option to which the shooter is assigned. 0 = player
- anm - anm script of the bullet
- anm_hit - anm script when the bullet hits something
- flags - they do a variety of things, such as making the bullets homing, giving them splash damage etc. (documentation is yet to be made). Note that their behaviour may differ even if the .sht format is the same version (e.g. DDC and LoLK flags do different things)
