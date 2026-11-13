> **In the terminal:** this is the Asciiverse edition. Install and start it
> with [av](https://asciiverse.sh): `av install wardens-duty`, then pick it
> in av. To build it yourself: `make -f asciiverse/Makefile`, then
> `./out/wardens-duty`. What changed, and how it runs, is in
> [PATCHES.md](PATCHES.md); the licence and the author's permission in
> [PERMISSION.md](PERMISSION.md).

# Warden's Duty

![Screenshot](wardens-duty.png)

This is a [7DRL](http://7drl.org/) game. To play it, just open http://ondras.github.io/wardens-duty/ in your browser.

## Technology

HTML, CSS (LESS), JavaScript (ES6). To build, just `make`. To build continually, do `make watch` -- this requires `inotify-tools`.

Two custom fonts are used:

 - **Inconsolata** for the general UI,
 - **Droid Sans Mono** for individual critters and other dungeon features.
