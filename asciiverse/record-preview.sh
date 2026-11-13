#!/bin/sh
# Records the catalog preview, asciiverse/wardens-duty.cast, at 100x30 with
# hub's castrec.py: the title page, O.'s first letter, the goblin, then the
# second level of --seed 3: the letter, a rat and the options against it,
# the next cell. Run from the repo root after building.
set -eu
CASTREC=${CASTREC:-../hub/tools/castrec.py}
state=$(mktemp -d)
trap 'rm -rf "$state"' EXIT
S="w3;kenter;w4;ks;w2.5;kenter;w4;ks;w2;k2;w1.5;k3;w1.5;k1;w1.5;k2;w1;kenter;w1.5;kd;w2;k2;w1.5;k3;w1.5;kenter;w2.5"
XDG_STATE_HOME="$state" python3 "$CASTREC" "${1:-asciiverse/wardens-duty.cast}" . "$S" -- ./out/wardens-duty --seed 3
