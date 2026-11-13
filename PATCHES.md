# Changes from upstream

This is the Asciiverse terminal edition of Warden's Duty, Ondřej Žára's
game for the 2015 Seven Day Roguelike Challenge, from
github.com/ondras/wardens-duty (the `upstream` remote; this branch,
`asciiverse`, starts from its master at `1c42888`, 2015-03-17, with the
full history). It is ISC licensed, and here with the author's permission
as well (`PERMISSION.md`).

**The game's own files are unchanged.** The game runs from its built
`app.js` (its ES6 sources compiled by Babel, as the upstream Makefile
makes it). Everything new is in `asciiverse/`, plus this file and
`PERMISSION.md`; README.md gets a note at the top on playing it with av.

## How it works

Warden's Duty is not drawn on a rot.js display: every prison cell is a
page of HTML the size of the browser window, and the game slides from one
to the next. Here the cell you are in fills the terminal.

- `asciiverse/rotty/`: rotty, our runtime for Ondřej's rot.js games (as in
  Goldfish, The Royal Wedding, The Conception and Café Havoc): the browser
  as far as these games use it, keys as browser events, HTML drawn into
  boxes. It redraws only when the page changed, and a few times a second
  for what blinks.
- `asciiverse/game.js`: Warden's Duty's page, after its CSS:
  - the stone wall: the level's own 13x6 pattern of dark `#`, each two
    cells by two, repeating behind every cell;
  - the prisoner: his glyph is 12rem tall on the page, so here it is a
    5x9 pixel letter drawn in blocks, in a dark box, with the others
    waiting in the same cell in small letters under it;
  - the bottom half: the name between `---=<(` and `)>=---`, the options
    with `[1]`, `[2]`, ... and the confirmation under the chosen one, and
    the two columns of gauges, the change blinking;
  - O.'s letter in each level's first cell, the minimap in the corner,
    the title page in black on white and the game over page.
- `asciiverse/build.py`, `asciiverse/Makefile`: the page's scripts as one
  classic script, compiled with QuickJS-ng into one native binary of about
  2 MB that needs nothing to run.

## Ours

- **Keys:** as in the browser: arrows, WASD or HJKL, 1 to 9, Enter.
  Ctrl+C or Ctrl+Q quits.
- **`--seed N`:** seeds rot.js's random numbers, so the prison fills the
  same way each time (the preview uses seed 3).
- **Session log:** `wardens-duty.log` in the state folder
  (`$XDG_STATE_HOME/wardens-duty`, `~/.local/state/wardens-duty`,
  Application Support on macOS, `%LOCALAPPDATA%` on Windows).
  `WARDENS_DUTY_LOG=debug` (or `ROTTY_LOG=debug`) records every key and a
  snapshot each second.
- The page's web fonts are not loaded, and the share links on the game
  over page are left out (there is nothing to click).

## Imported

- `asciiverse/quickjs/`: QuickJS-ng 0.17.0 as in our Candy Box 2 (one
  change in `quickjs-libc.c`: a signal interrupting `poll()` no longer ends
  the event loop), MIT.
- `asciiverse/ROT-LICENSE`: rot.js's licence (BSD-3-Clause), for the
  `rot.min.js` the game bundles.

## Packaging

- `.github/workflows/release.yml`: static Linux (musl, x86-64 and ARM64),
  macOS (x86-64 and ARM64) and Windows (x86-64, MinGW) archives plus
  SHA256SUMS, on tags `*-av.*`.
- `asciiverse/package.sh`: the archive (the program, LICENSE, PERMISSION.md,
  PATCHES.md, the licences).
- `asciiverse/record-preview.sh`: the 100x30 catalog preview, with hub's
  castrec.py.
