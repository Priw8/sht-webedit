# sht-webedit
a tool for editing .sht files used in Touhou games - https://priw8.github.io/sht-webedit/

### Supported games
- TH07 - Perfect Cherry Blossom
- TH08 - Imperishable Night
- TH09 - Phantasmagoria of Flower View
- TH10 - Mountain of Faith
- TH11 - Subterranean Animism
- TH12 - Undefined Fantastic Object
- TH12.8 - Great Fairy Wars
- TH13 - Ten Desires
- TH14 - Double Dealing Character
- TH14.3 - Impossible Spell Card
- TH15 - Legacy of Lunatic Kingdom
- TH16 - Hidden Star in Four Seasons
- TH16.5 - Violet Detector
- TH17 - Wily Beast and Weakest Creature (demo)
- 黄昏酒場 ～ Uwabami Breakers (alcostg)

the tool will be updated with support for more games.

### Features
- load data of .sht files into editable tables
- freely modify shootersets
- export edited data back to .sht
- some tools to make life easier (console for evaluating js code, radians <-> degrees converer)

### TODO
- find out what the unknown values do

## How .sht files work
### TH10+
Basically there's a header (the "main" table) which stores the basic informations. After the header, there are option positions for each power level (power level = option count). Then there's the shooterset offset array, which stores offsets of shootersets in the shooterset array. The shooterset array comes right after the shooterset offset array, and consists of shootersets separated by 4 FF bytes. Basically, if pwr_lvl_cnt (max power level) is 4, there should be 10 shootersets - 5 for each power level of the unfocused shot and 5 for each level of the focused shot (0 power shooterset exists, despite power starting at 1 in the game. It's used in HSiFS during the Okina finals). In some cases, there can be more shootersets (TD has one more for trance mode). A shooterset itself is a set of shooters (duh). A shooter contains data of a single bullet the player/option fires, and the frequency it should fire at. So if you want an option to shoot 2 bullets at once, you have to assign it to 2 shooters.

### TH07, TH08 (TH06 doesn't have .shts, shot data is probably hardcoded)
It's quite a bit different than TH10+. Most notably, option table doesn't exist (options probably hardcoded), and there's no focus/unfocus split in the file itself - there are 2 .shts per shottype, 1 for unfocused shot and 1 for the focused shot. There are also more things that can be modified there, such as at what height PoC is. Power levels work differently too, as the .sht controls when the switch to the next shooterset occurs. This that there are up to 129 power levels avalible (0-128 inclusive)

## Brief usage instructions
**main table**

- *_u - unused (afaik)
- sht\_off\_cnt: length of the shooter offset array
- move\_nf/f\_str/dia - unfocused/focused speed when moving straight/diagonally
- pwr\_lvl\_cnt - max power level
- SA_power_divisor - only for SA, unused in other games. Sets how much power one poweritem gives. Basically power per item = 100/SA_power_divisor
- max_dmg - max damage dealt to a given entity during a single frame. Also applies to bombs.

**option_pos table**

(I think it doesn't require explaining)

**sht_off table**

the shooterset offset array, you can ignore it as the offsets are recalculated automatically when exporting

**sht_arr tables**

shootersets for each power level of focused/unfocused mode. There's also "extra" at the end, this is where unusual things like TD trance shootersets go

shooter tables

- fire_rate - delay between bullets being shot. More info below
- start_delay - delay before the shooter activates after pressing the shot key
- off_x/y - x/y offset of bullet spawning from the sprite the shooter is assigned to
- hitbox_x/y - obvious
- angle - angle at which the bullets fire (clockwise in radians; 0 is straight right)
- speed - speed at which the bullets move
- option - option to which the shooter is assigned. 0 = player. 100 is added for subseason options
- anm - anm script of the bullet
- anm_hit - anm script when the bullet hits something
- sfx_id - sound id to play when the shooter fires a bullet
- fire_rate2/start_delay2 - see below
- func_on_init/tick/draw/hit - sets index of hardcoded functions that implement behavior like homing, splash damage, hit sound effects, etc. (documentation is yet to be made). Different games have different functions
- flags - mysterious extra fields, seldom used, who knows

more about fire_rate/start_delay

- PCB - shooting uses a 60-frame timer.  For bullets to fire consistently, choose a fire_rate that is a factor of 60
- IN-DDC - shooting uses a 15-frame timer, so any rate other than 1, 3, 5, or 15 will be uneven
- LoLK onwards - fire_rate/start_delay still use a 15-frame timer, but there are alternative fields fire_rate2/start_delay2 that use a 120-frame timer. (when fire_rate2 is set, the original fire_rate/start_delay are ignored).  Shots using this timer famously have rare bugs that can cause them to stop firing
