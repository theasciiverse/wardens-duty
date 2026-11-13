// Warden's Duty in the terminal: how the page is laid out on the screen.
// The browser shows one prison cell at a time, a window-sized page, and
// slides between them; here the current one fills the terminal. As on the
// page: the stone wall behind everything, the prisoner as one big glyph in
// the top half, its name, your options and your stats in the bottom half,
// the minimap in the top right corner.
/* BUILD {"files": []} */

var GAME = {
    id: "wardens-duty",
    idleMs: 200,   // the gauges blink slowly
    usage: "wardens-duty [--seed N] [--version]\n\n" +
        "Warden's Duty by Ondrej Zara (7DRL 2015), in the terminal. Arrows, WASD or\n" +
        "HJKL move between the prison cells; 1 to 9 pick what to do with the\n" +
        "prisoner, Enter does it. Ctrl+C or Ctrl+Q quits. Best at 100x30.\n" +
        "--seed N fills the same prison each time. WARDENS_DUTY_LOG=debug logs\n" +
        "every key to the state folder.\n"
};

// ------------------------------------------------------------ big glyphs

// The prisoners are drawn at 12rem, so here as 5x9 pixel letters, each
// pixel two cells wide (rows 0 to 6 above the baseline, 7 and 8 below)
GAME.FONT = (function () {
    var up = {
        A: ".###.#...##...#######...##...##...#", B: "####.#...##...#####.#...##...#####.",
        C: ".#####....#....#....#....#.....####", D: "####.#...##...##...##...##...#####.",
        E: "######....#....####.#....#....#####", F: "######....#....####.#....#....#....",
        G: ".#####....#....#.####...##...#.####", H: "#...##...##...#######...##...##...#",
        I: "#####..#....#....#....#....#..#####", J: "..###...#....#....#....#.#..#..##..",
        K: "#...##..#.#.#..##...#.#..#..#.#...#", L: "#....#....#....#....#....#....#####",
        M: "#...###.###.#.##.#.##...##...##...#", N: "#...###..##.#.##..###...##...##...#",
        O: ".###.#...##...##...##...##...#.###.", P: "####.#...##...#####.#....#....#....",
        Q: ".###.#...##...##...##.#.##..#..##.#", R: "####.#...##...#####.#.#..#..#.#...#",
        S: ".#####....#.....###.....#....#####.", T: "#####..#....#....#....#....#....#..",
        U: "#...##...##...##...##...##...#.###.", V: "#...##...##...##...##...#.#.#...#..",
        W: "#...##...##...##.#.##.#.###.###...#", X: "#...##...#.#.#...#...#.#.#...##...#",
        Y: "#...##...#.#.#...#....#....#....#..", Z: "#####....#...#...#...#...#....#####",
        "$": "..#...#####.#...###...#.#####...#..", "@": ".###.#...##.####.#.##.####.....####",
        "^": "..#...#.#.#...#...............................", "?": ".###.#...#....#...#...#.........#..",
        "≈": "......##.##.##.......##.##.##......"
    };
    var low = {
        a: "...........###.....#.#####...#.####", b: "#....#....####.#...##...##...#####.",
        c: "...........#####....#....#.....####", d: "....#....#.#####...##...##...#.####",
        e: "...........###.#...#######....#####", f: "..##..#..#.#...###...#....#....#...",
        g: "...........#####...##...#.####....#....#.###.", h: "#....#....####.#...##...##...##...#",
        i: "..#........##....#....#....#...###.", j: "...#........##....#....#....#....#.#..#..##..",
        k: "#....#....#..#.#.#..##...#.#..#..#.", l: ".##....#....#....#....#....#...###.",
        m: "..........##.#.#.#.##.#.##.#.##.#.#", n: "..........####.#...##...##...##...#",
        o: "...........###.#...##...##...#.###.", p: "..........####.#...##...#####.#....#....#....",
        q: "...........#####...##...#.####....#....#....#", r: "..........#.##.##..##....#....#....",
        s: "...........#####.....###.....#####.", t: ".#....#...####..#....#....#..#..##.",
        u: "..........#...##...##...##..##.##.#", v: "..........#...##...##...#.#.#...#..",
        w: "..........#...##...##.#.##.#.#.#.#.", x: "..........#...#.#.#...#...#.#.#...#",
        y: "..........#...##...##...#.####....#....#.###.", z: "..........#####...#...#...#...#####"
    };
    var font = {};
    var add = function (map) {
        for (var k in map) {
            var s = map[k], rows = [];
            for (var r = 0; r < 9; r++) rows.push((s.substr(r * 5, 5) + ".....").slice(0, 5));
            font[k] = rows;
        }
    };
    add(up); add(low);
    return font;
})();

GAME.bigGlyph = function (ch, x, y, fg) {
    var g = GAME.FONT[ch] || GAME.FONT["?"];
    for (var r = 0; r < 9; r++) for (var c = 0; c < 5; c++) {
        if (g[r][c] == "#") { TERM.put(x + 2 * c, y + r, "█", fg, null); TERM.put(x + 2 * c + 1, y + r, "█", fg, null); }
    }
};

// ------------------------------------------------------------ helpers

// a box of the page with a translucent black background (rgba(0,0,0,.75))
GAME.dim = function (x, y, w, h, amount) {
    var k = amount == null ? 0.75 : amount;
    for (var j = Math.max(0, y); j < Math.min(TERM.h, y + h); j++) {
        for (var i = Math.max(0, x); i < Math.min(TERM.w, x + w); i++) {
            var c = TERM.cells[j * TERM.w + i];
            c.fg = TERM.mix(c.fg, [0, 0, 0], k); c.bg = TERM.mix(c.bg, [0, 0, 0], k);
            if (c.ch == "#") c.ch = k >= 0.75 ? " " : c.ch;
        }
    }
};
GAME.has = function (n, cls) { return !!(n && n.classList && n.classList.contains(cls)); };
GAME.runs = function (line, x, y, w, bg) {
    var cx = x;
    line.forEach(function (r) {
        Array.from(r.t).forEach(function (ch) {
            if (cx < x + w) TERM.put(cx, y, ch, r.fg, bg || null, false, r.bold);
            cx++;
        });
    });
    return cx - x;
};
GAME.lineLen = function (l) { var n = 0; l.forEach(function (r) { n += Array.from(r.t).length; }); return n; };
// paragraphs of an element, a blank line between them
GAME.paras = function (el, w, base) {
    var out = [];
    el.childNodes.forEach(function (n) {
        if (n.nodeType == 3 && !n.data.trim()) return;
        var ls = PANEL.lines(n.nodeType == 3 ? { nodeType: 1, tagName: "P", style: {}, childNodes: [n] } : n, w, base);
        if (!ls.length) return;
        if (out.length) out.push([]);
        ls.forEach(function (l) { l.cls = n.className || ""; out.push(l); });
    });
    return out;
};

GAME.css = function (n) {
    if (n.tagName == "STRONG") return { fg: GAME.inIntro ? "#000" : "#fff", bold: true };
    if (n.tagName == "A") return GAME.inIntro ? { fg: "#00c" } : { hidden: true };
    if (n.tagName == "EM") return { fg: GAME.inIntro ? "#333" : null };
    return null;
};

// ------------------------------------------------------------ the wall

// Level._renderTexture: a 13x6 pattern of bold "#" in dark colours, each
// 2rem (two rows, two columns), repeating from the level's corner
GAME.wall = function (level) {
    var tex = level._texture;
    if (!tex || !tex.length) return;
    if (level._rottyWall != tex) {   // the colours, once per level
        level._rottyWall = tex;
        level._rottyColors = tex.map(function (col) {
            return col.map(function (c) { return c.map(function (v) { return Math.max(0, Math.min(255, Math.round(v))); }); });
        });
    }
    var cols = level._rottyColors, tw = cols.length, th = cols[0].length, cur = level._current || [0, 0];
    var ox = cur[0] * TERM.w, oy = cur[1] * TERM.h;
    for (var y = 0; y < TERM.h; y++) {
        var gy = ((y + oy) >> 1) % th;
        for (var x = 0; x < TERM.w; x++) TERM.put(x, y, "#", cols[((x + ox) >> 1) % tw][gy], null, false, true);
    }
};

// ------------------------------------------------------------ the screens

GAME.introPage = function (node) {
    GAME.inIntro = true;
    var W = TERM.w, H = TERM.h;
    TERM.fillRect(0, 0, W, H, "#fff");
    var y = 1;
    var h1 = node.querySelector("h1");
    if (h1) { var t = h1.textContent; TERM.text(((W - t.length) / 2) | 0, y, t, "#000", "#fff"); TERM.cells[y * W + (((W - t.length) / 2) | 0)].bold = true; y += 2; }
    var w = Math.min(W - 4, 76), x = ((W - w) / 2) | 0;
    var body = { nodeType: 1, tagName: "DIV", style: {}, childNodes: node.childNodes.filter(function (n) { return n.tagName != "H1"; }) };
    GAME.paras(body, w, { fg: "#000" }).forEach(function (l) { if (y < H) GAME.runs(l, x, y++, w, "#fff"); });
    GAME.inIntro = false;
};

GAME.outroPage = function (node) {
    var W = TERM.w, H = TERM.h;
    TERM.fillRect(0, 0, W, H, "#000");
    var y = 1;
    var h1 = node.querySelector("h1");
    if (h1) { var t = h1.textContent; TERM.text(((W - t.length) / 2) | 0, y, t, "#c33", null); y += 2; }
    var w = Math.min(W - 4, 76), x = ((W - w) / 2) | 0;
    var body = { nodeType: 1, tagName: "DIV", style: {}, childNodes: node.childNodes.filter(function (n) { return n.tagName == "P"; }) };
    GAME.paras(body, w, { fg: "#ccc" }).forEach(function (l) { if (y < H) GAME.runs(l, x, y++, w); });
};

// the letter from O. in the level's first cell: 4rem from the top, 8rem
// from the sides, 2rem of padding
GAME.letter = function (level) {
    var div = level._dom.intro.querySelector(".intro");
    if (!div) return;
    var W = TERM.w, H = TERM.h;
    var mx = Math.max(1, Math.min(16, ((W - 64) / 2) | 0)), my = Math.max(0, Math.min(4, H - 26));
    var px = W >= 80 ? 4 : 2, py = H >= 28 ? 2 : 1;
    var w = W - 2 * mx - 2 * px;
    var lines = GAME.paras(div, w, { fg: "#ccc" });
    var bh = Math.min(H - my, lines.length + 2 * py);
    GAME.dim(mx, my, W - 2 * mx, bh);
    lines.forEach(function (l, j) {
        var y = my + py + j;
        if (y >= my + bh - (py ? 1 : 0)) return;
        var x = mx + px;
        if (/sign/.test(l.cls)) x = mx + px + w - 5 - GAME.lineLen(l);   // text-align: right; margin-right: 5ch
        GAME.runs(l, x, y, w);
    });
};

GAME.minimap = function (level) {
    var t = level._dom.node.querySelector(".minimap");
    if (!t || !t.parentNode) return;
    var rows = t.children, cols = rows.length ? rows[0].children.length : 0;
    if (!cols) return;
    var w = cols * 3 + 1, h = rows.length * 2 + 1, x0 = TERM.w - w - 1, y0 = 0;
    GAME.dim(x0, y0, w, h);
    var B = "#666";
    for (var j = 0; j <= rows.length; j++) for (var i = 0; i <= cols; i++) {
        var top = j == 0, bot = j == rows.length, left = i == 0, right = i == cols;
        var ch = top ? (left ? "┌" : right ? "┐" : "┬") : bot ? (left ? "└" : right ? "┘" : "┴") : (left ? "├" : right ? "┤" : "┼");
        TERM.put(x0 + i * 3, y0 + j * 2, ch, B, null);
        if (i < cols) { TERM.put(x0 + i * 3 + 1, y0 + j * 2, "─", B, null); TERM.put(x0 + i * 3 + 2, y0 + j * 2, "─", B, null); }
        if (j < rows.length) TERM.put(x0 + i * 3, y0 + j * 2 + 1, "│", B, null);
    }
    rows.forEach(function (tr, j) {
        tr.children.forEach(function (td, i) {
            var act = GAME.has(td, "active");
            var bg = act ? "#333" : null;
            TERM.put(x0 + i * 3 + 1, y0 + j * 2 + 1, td.textContent || " ", td.style.color || "#ccc", bg || "#000");
            TERM.put(x0 + i * 3 + 2, y0 + j * 2 + 1, " ", null, bg || "#000");
        });
    });
};

// one prison cell: the prisoner, then the info box in the bottom half
GAME.cell = function (cell) {
    var W = TERM.w, H = TERM.h, node = cell._dom.node, half = H >> 1;
    var ent = node.querySelector(".entity"), info = node.querySelector(".info");

    // the prisoner: 2rem down, a box of 1rem padding round the glyph
    var span = ent && ent.children[0];
    if (span) {
        var ch = Array.from(span.childNodes.filter(function (n) { return n.nodeType == 3; }).map(function (n) { return n.data; }).join(""))[0] || "?";
        var bw = 14, bh = 11, bx = ((W - bw) / 2) | 0, by = Math.max(0, Math.min(2, half - bh));
        GAME.dim(bx, by, bw, bh);
        var fg = TERM.color(span.style.color) || [255, 255, 255];
        if (fg[0] + fg[1] + fg[2] > 0) GAME.bigGlyph(ch, bx + 2, by + 1, fg);
        var more = span.querySelector(".more");
        if (more) {
            var mx = bx + 2;
            more.children.forEach(function (s) {
                GAME.dim(mx, by + bh, 3, 1);
                TERM.put(mx + 1, by + bh, s.textContent, s.style.color || "#ccc", null);
                mx += 4;
            });
        }
    }

    if (!info) return;
    var top = half;
    GAME.dim(0, top, W, H - top);
    if (GAME.has(info, "done")) {   // the outcome, 1em and 5ch of padding
        var w = W - 10;
        GAME.paras(info, w, { fg: "#ccc" }).forEach(function (l, j) { if (top + 1 + j < H) GAME.runs(l, 5, top + 1 + j, w); });
        return;
    }

    // the name, between goldenrod ---=<( and )>=---
    var label = info.querySelector(".label");
    var y = top;
    if (label) {
        var name = label.textContent, a = "---=<( ", b = " )>=---";
        var lx = ((W - a.length - name.length - b.length) / 2) | 0;
        TERM.text(lx, y, a, "goldenrod"); TERM.text(lx + a.length, y, name, "#ccc"); TERM.text(lx + a.length + name.length, y, b, "goldenrod");
        y += 2;
    }

    // [1] the options, the chosen one with its confirmation under it
    var narrow = W < 84, ax = narrow ? 1 : 2, aw = 26;
    var ul = info.querySelector(".attacks ul"), ay = y;
    if (ul) ul.children.forEach(function (li, i) {
        var dis = GAME.has(li, "disabled"), fg = dis ? "#666" : "#ccc";
        var text = "";
        li.childNodes.forEach(function (n) { if (!(n.classList && n.classList.contains("confirm"))) text += n.textContent; });
        TERM.text(ax, ay, "[" + (i + 1) + "] ", dis ? "#808080" : "#fff");
        TERM.text(ax + 4, ay, text.slice(0, aw - 4), fg);
        ay++;
        var conf = li.querySelector(".confirm");
        if (conf) {
            var bad = GAME.has(conf, "disabled");
            TERM.text(ax + 4, ay, bad ? "✘ " : "✔ ", bad ? "#f00" : "#0f0", null);
            GAME.runs(PANEL.lines(conf, aw, { fg: fg })[0] || [], ax + 6, ay, aw - 6);
            ay += 2;
        }
    });

    // the gauges: two groups of five, 25 characters each
    var groups = info.querySelectorAll(".gauges .group");
    var gx = ax + aw + (narrow ? 0 : 0), step = Math.max(1, Math.min(2, ((H - y) / 5) | 0));
    groups.forEach(function (g, gi) {
        var gy = y;
        g.children.forEach(function (gauge) {
            if (gy < H) GAME.gauge(gauge, gx + gi * (narrow ? 26 : 27), gy);
            gy += step;
        });
    });
};

// one gauge: the full part in the stat's colour, the change blinking, the
// empty rest dark grey; the label centred over it
GAME.gauge = function (node, x, y) {
    var base = node.style.backgroundColor || "#666", t = Date.now() / 1000;
    var fg = GAME.has(node, "underflow") ? "#f33" : "#eee";
    var cx = x;
    node.children.forEach(function (s) {
        var bg = base;
        if (GAME.has(s, "empty")) bg = "#323232";
        else if (GAME.has(s, "up") || GAME.has(s, "down")) {
            // 1.5 s from dark grey to clear, reversed when going down
            var p = (t % 1.5) / 1.5; if (GAME.has(s, "down")) p = 1 - p;
            bg = TERM.mix([50, 50, 50], TERM.color(base) || [0, 0, 0], p);
        }
        Array.from(s.textContent).forEach(function (ch) { TERM.put(cx++, y, ch, fg, bg); });
    });
};

GAME.layout = function () {
    var intro = document.getElementById("intro");
    var outro = document.getElementById("outro");
    if (outro) { GAME.outroPage(outro); return; }
    var level = typeof game != "undefined" && game._level;
    if (level && !GAME.has(level._dom.node, "done")) {
        GAME.wall(level);
        var cur = level._current || [0, 0];
        if (cur[1] == 0) GAME.letter(level);
        else {
            var cell = level._cells[cur[0] + (cur[1] - 1) * level._size[0]];
            if (cell) GAME.cell(cell);
        }
        GAME.minimap(level);
    }
    if (intro && !GAME.has(intro, "transparent")) GAME.introPage(intro);
};

GAME.snapshot = function () {
    var level = typeof game != "undefined" && game._level;
    if (!level) return "intro";
    var s = pc.getStats();
    return "depth=" + level.getDepth() + " at=" + level._current + " hp=" + s.hp + "/" + s.maxhp + " mana=" + s.mana +
        " gold=" + s.gold + " xp=" + s.xp + (document.getElementById("outro") ? " over" : "");
};

// --seed N: the same prison every time (for the preview)
GAME.seed = null;
GAME.arg = function (a, b) {
    if (a == "--seed" && b) { GAME.seed = parseInt(b, 10); return true; }
    return false;
};
GAME.patchRot = function () {
    if (GAME.seed !== null) ROT.RNG.setSeed(GAME.seed);
};
