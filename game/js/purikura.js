// ぷりくら（Meeときょれじゃ の しゃしんの ブース・UI-11）: 300コイン → はいけいを えらぶ → 4まい とる（ポーズ・かお・アップ／ぜんしん・3・2・1）→ らくがき（ペン・スタンプ・もじ）→ すまほの「しゃしん」アプリで みる。
// ほんものの プリクラと おなじ ながれ（お金を いれる → はいけい → さつえい → らくがき → スマホで みる）。
// しゃしんは 画像では なく 絵の データ（Save.d.photos）。みる ときに 描く ので セーブが 大きく ならない。しゃしんの 座標は 300×400（たて）。
// 3人は Chara.draw、はいけい・スタンプは SvgCache（キーは しゅるいと 3だんかいの 大きさ だけ）。
const Purikura = (() => {
  const PW = 300, PH = 400, MAX = 60, SHOTS = 4, PRICE = 300;
  const BGS = [
    { id: "yume", name: "ゆめかわ" }, { id: "hana", name: "おはな" }, { id: "hoshi", name: "ほしぞら" },
    { id: "umi", name: "うみ" }, { id: "heart", name: "ハート" }, { id: "mee", name: "Mee" },
  ];
  // ポーズ（キャラ素材の ポーズ）。よこむき は りょうはしの 2人が まんなかを むく
  const POSES = [
    { id: "stand", name: "たつ", pose: "idle_01" }, { id: "jump", name: "ジャンプ", pose: "jump_01" }, { id: "crouch", name: "しゃがむ", pose: "land_01" },
    { id: "sway", name: "ゆらゆら", pose: "idle_02" }, { id: "walk", name: "あるく", pose: "walk_01" }, { id: "side", name: "よこむき", pose: "idle_01", side: true },
  ];
  // かお（Chara の EMO。3人で それぞれの かおに なる）
  const FACES = [
    { id: "happy", name: "にっこり" }, { id: "excited", name: "わくわく" }, { id: "love", name: "らぶらぶ" }, { id: "surprise", name: "びっくり" },
    { id: "angry", name: "ぷんぷん" }, { id: "sad", name: "えーん" }, { id: "sleep", name: "すやすや" }, { id: "normal", name: "ふつう" },
  ];
  const PENS = ["#FF7BA8", "#FFD84D", "#6FC7EF", "#7CCB6B", "#B79BEA", "#FFFFFF"], PEN_W = [4, 9];
  const STAMPS = [
    { id: "heart", name: "ハート" }, { id: "star", name: "ほし" }, { id: "kira", name: "キラキラ" }, { id: "ribbon", name: "リボン" },
    { id: "flower", name: "おはな" }, { id: "crown", name: "おうかん" }, { id: "onpu", name: "おんぷ" }, { id: "niji", name: "にじ" },
    { id: "ashi", name: "あしあと" }, { id: "fusen", name: "ふうせん" }, { id: "ichigo", name: "いちご" }, { id: "mee", name: "Mee" },
  ];
  const STAMP_SIZE = [34, 56, 84];
  const WORDS = ["なかよし", "だいすき", "ずっと いっしょ", "ぽかぽか", "イェーイ", "ともだち", "たのしい！", "Mee"];
  const LIMIT = { strokes: 40, points: 1500, stamps: 30, texts: 6, word: 10 };
  const INDEX = (list) => Object.fromEntries(list.map((x) => [x.id, x]));
  const BG = INDEX(BGS), POSE = INDEX(POSES), FACE = INDEX(FACES), STAMP = INDEX(STAMPS);

  // ---- せんの データ（色 1もじ・太さ 1もじ・点は x y を 2もじずつ。0〜4095）----
  const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  const enc = (v) => { v = Math.max(0, Math.min(4095, Math.round(v))); return B64[v >> 6] + B64[v & 63]; };
  const dec = (s, i) => (B64.indexOf(s[i]) << 6) | B64.indexOf(s[i + 1]);
  const packStroke = (st) => String(st.c) + String(st.w) + st.pts.map(([x, y]) => enc(x) + enc(y)).join("");
  const unpackStroke = (s) => {
    if (typeof s !== "string" || !/^[0-5][01](?:[A-Za-z0-9_-]{4})+$/.test(s)) return null;
    const pts = []; for (let i = 2; i + 3 < s.length; i += 4) pts.push([Math.min(PW, dec(s, i)), Math.min(PH, dec(s, i + 2))]);
    return { c: +s[0], w: +s[1], pts };
  };
  const num = (v, a, b) => (Number.isFinite(+v) ? Math.max(a, Math.min(b, Math.round(+v))) : null);
  const word = (t) => (typeof t === "string" ? t.replace(/[<>&"'`\u0000-\u001f]/g, "").slice(0, LIMIT.word) : "");

  // ---- しゃしん 1まい（セーブの かたち）をたしかめる。こわれて いれば null。つかえない ぶぶんは すてる ----
  // { id, t, bg, z: 0 ぜんしん|1 アップ, r: [3人の じゅんばん], c: { だれ: [ポーズ, かお] }, o: { だれ: [服, いろ] }, d: { p: [せん], s: [[スタンプ, x, y, 大きさ]], x: [[ことば, x, y, いろ]] } }
  const clean = (p) => {
    if (!p || typeof p !== "object" || typeof p.id !== "string" || !/^[a-z0-9-]{3,40}$/.test(p.id)) return null;
    const ids = Chara.IDS, r = Array.isArray(p.r) && p.r.length === 3 && p.r.every((id) => ids.includes(id)) && new Set(p.r).size === 3 ? p.r.slice() : ids.slice();
    const c = {}, o = {};
    for (const id of ids) {
      const v = p.c && p.c[id]; c[id] = Array.isArray(v) && POSE[v[0]] && FACE[v[1]] ? [v[0], v[1]] : ["stand", "happy"];
      const w = p.o && p.o[id], fit = w && Array.isArray(w) && w[0] && typeof w[0] === "object" ? w[0] : {}, outfit = {};
      for (const [slot, item] of Object.entries(fit)) if (typeof item === "string" && typeof ITEM_INDEX !== "undefined" && ITEM_INDEX[item]) outfit[slot] = item;
      o[id] = [outfit, w && w[1] === "dark" ? "dark" : "soft"];
    }
    const d = p.d && typeof p.d === "object" ? p.d : {};
    let pts = 0;
    const strokes = (Array.isArray(d.p) ? d.p : []).filter((s) => { const u = unpackStroke(s); if (!u || pts + u.pts.length > LIMIT.points) return false; pts += u.pts.length; return true; }).slice(0, LIMIT.strokes);
    const stamps = (Array.isArray(d.s) ? d.s : []).filter((s) => Array.isArray(s) && STAMP[s[0]]).map((s) => [s[0], num(s[1], 0, PW), num(s[2], 0, PH), num(s[3], 0, 2)]).filter((s) => s.every((v) => v !== null)).slice(0, LIMIT.stamps);
    const texts = (Array.isArray(d.x) ? d.x : []).filter((s) => Array.isArray(s) && word(s[0])).map((s) => [word(s[0]), num(s[1], 0, PW), num(s[2], 0, PH), num(s[3], 0, PENS.length - 1)]).filter((s) => s.every((v) => v !== null)).slice(0, LIMIT.texts);
    return { id: p.id, t: num(p.t, 0, 9e15) || 0, bg: BG[p.bg] ? p.bg : "yume", z: p.z ? 1 : 0, r, c, o, d: { p: strokes, s: stamps, x: texts } };
  };
  // 描く ための かたち（せんを 点の ならびに もどす）
  const unpacked = new WeakMap();
  const view = (p) => { let v = unpacked.get(p); if (!v) { v = { ...p, d: { p: p.d.p.map(unpackStroke).filter(Boolean), s: p.d.s, x: p.d.x } }; unpacked.set(p, v); } return v; };

  const st = () => { const s = Save.d.purikura || (Save.d.purikura = { plays: 0, active: null, taken: 0 }); if (!Array.isArray(Save.d.photos)) Save.d.photos = []; return s; };
  return {
    PW, PH, MAX, SHOTS, PRICE, BGS, POSES, FACES, PENS, PEN_W, STAMPS, STAMP_SIZE, WORDS, LIMIT, BG, POSE, FACE, STAMP,
    packStroke, unpackStroke, clean, view, st,
    // こわれて いない しゃしん（ふるい じゅん）。こわれた ものは セーブから のぞく
    list() { st(); const ok = Save.d.photos.map(clean).filter(Boolean); if (ok.length !== Save.d.photos.length || ok.some((p, i) => JSON.stringify(p) !== JSON.stringify(Save.d.photos[i]))) Save.d.photos = ok; return Save.d.photos; },
    full() { return this.list().length > MAX - SHOTS; },
    // 300コインを はらう（セーブに のこせた ときだけ）
    pay() {
      const s = st(); if (s.active || Save.d.coins < PRICE) return false;
      Save.d.coins -= PRICE; s.active = "s" + Date.now().toString(36); s.plays++; Save.write(); if (typeof UI !== "undefined" && UI.updateHud) UI.updateHud(); return true;
    },
    // できあがり（1かいだけ）: しゃしんを いれて おわり
    finish(photos) {
      const s = st(); if (!s.active) return false;
      const add = photos.map(clean).filter(Boolean).slice(0, SHOTS);
      Save.d.photos.push(...add); while (Save.d.photos.length > MAX) Save.d.photos.shift();
      s.active = null; s.taken = (s.taken || 0) + add.length;
      for (const id of Chara.IDS) if (Save.care) Save.care(id, { mood: 1 });
      Save.write(); return true;
    },
    remove(id) { const n = this.list().length; Save.d.photos = Save.d.photos.filter((p) => p.id !== id); if (Save.d.photos.length !== n) { Save.write(); return true; } return false; },
    // いまの 3人の 服（しゃしんに のこす）
    outfits() { const o = {}; for (const id of Chara.IDS) { const c = Save.d.chars[id]; o[id] = [{ ...(c.outfit || {}) }, c.color === "dark" ? "dark" : "soft"]; } return o; },
    // ブースを しらべた とき（館の 什器 photobooth）
    async open(back) {
      const s = st();
      if (s.active) { if (await UI.confirm("とちゅうだった ぷりくらが あるよ。\nおかねは はらわずに もういちど とる？", "もういちど とる", "やめる")) Game.goto("purikura", { back }); return; }
      if (this.full()) { await UI.say([{ name: "ぷりくら", text: "すまほの しゃしんが いっぱい。\n「しゃしん」アプリで いらない しゃしんを けしてから きてね。" }]); return; }
      if (!(await UI.confirm(`ぷりくら 1かい ${PRICE}コイン。\nはいけいを えらんで 4まい とって、ペンや スタンプで らくがき できるよ。\nとった しゃしんは すまほの「しゃしん」アプリで みられるよ。`, `${PRICE}コインで とる`, "やめる"))) return;
      if (!this.pay()) { UI.toast("コインが たりないよ"); return; }
      Game.goto("purikura", { back });
    },
    dateText(t) { const d = new Date(t || Date.now()); return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`; },
  };
})();

// ---- 絵（はいけい・スタンプ・わく・しゃしん 1まい）----
const PurikuraArt = (() => {
  const P = Purikura, K = INK, f1 = (v) => Math.round(v * 10) / 10;
  const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`;
  const star = (x, y, r, fill, extra = "") => `<path d="${starPath(x, y, r, r * 0.45)}" fill="${fill}" ${extra}/>`;
  const heart = (x, y, s, fill, extra = "") => `<path d="M${f1(x)} ${f1(y + s * 0.9)} C${f1(x - s * 1.3)} ${f1(y)} ${f1(x - s * 0.9)} ${f1(y - s * 0.9)} ${f1(x)} ${f1(y - s * 0.25)} C${f1(x + s * 0.9)} ${f1(y - s * 0.9)} ${f1(x + s * 1.3)} ${f1(y)} ${f1(x)} ${f1(y + s * 0.9)}Z" fill="${fill}" ${extra}/>`;
  // きまった ならびの ちらばり（まいかい おなじ 絵）
  const scatter = (n, seed, fn) => { let a = seed; const r = () => ((a = (a * 1103515245 + 12345) >>> 0) / 4294967296); return Array.from({ length: n }, (_, i) => fn(r() * 300, r() * 400, r(), i)).join(""); };
  const grad = (id, stops, vert = true) => `<linearGradient id="${id}" x1="0" y1="0" x2="${vert ? 0 : 1}" y2="${vert ? 1 : 0}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join("")}</linearGradient>`;
  const BG_SVG = {
    yume: () => svg(300, 400, `<defs>${grad("pk-yume", [[0, "#FFD6E8"], [0.5, "#E6D6FF"], [1, "#CFF3EA"]])}</defs><rect width="300" height="400" fill="url(#pk-yume)"/>
      ${[[60, 80, 46], [230, 60, 38], [250, 250, 44], [40, 300, 36]].map(([x, y, r]) => `<g fill="#FFFFFF" opacity="0.7"><ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.45}"/><ellipse cx="${x - r * 0.45}" cy="${y + 4}" rx="${r * 0.6}" ry="${r * 0.36}"/><ellipse cx="${x + r * 0.5}" cy="${y + 5}" rx="${r * 0.55}" ry="${r * 0.32}"/></g>`).join("")}
      ${scatter(26, 7, (x, y, r, i) => (i % 3 ? star(x, y, 4 + r * 5, i % 2 ? "#FFF3A8" : "#FFFFFF") : heart(x, y, 5 + r * 4, "#FFB3CF")))}`),
    hana: () => svg(300, 400, `<defs>${grad("pk-hana", [[0, "#FFF7D6"], [0.55, "#E9F8D2"], [1, "#BFE8A8"]])}</defs><rect width="300" height="400" fill="url(#pk-hana)"/>
      <path d="M0 300 C60 270 110 290 160 280 C220 268 260 285 300 275 L300 400 L0 400 Z" fill="#A8DB8C"/><path d="M0 335 C70 318 140 340 210 326 C250 318 280 325 300 322 L300 400 L0 400 Z" fill="#8FCB74"/>
      ${scatter(22, 3, (x, y, r, i) => { const yy = 290 + (y % 100), c = ["#FF9EC4", "#FFD84D", "#FFFFFF", "#B79BEA"][i % 4]; return `<g transform="translate(${f1(x)} ${f1(yy)})">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-6" rx="4.4" ry="6.6" fill="${c}" stroke="${K}" stroke-width="1.2" transform="rotate(${a})"/>`).join("")}<circle r="3.4" fill="#F7B94A" stroke="${K}" stroke-width="1.2"/></g>`; })}
      ${scatter(10, 11, (x, y, r) => `<ellipse cx="${f1(x)}" cy="${f1(y * 0.6)}" rx="4" ry="2.4" fill="#FFC6DA" transform="rotate(${f1(r * 180)} ${f1(x)} ${f1(y * 0.6)})"/>`)}`),
    hoshi: () => svg(300, 400, `<defs>${grad("pk-hoshi", [[0, "#1E2250"], [0.6, "#3B3276"], [1, "#5B4396"]])}</defs><rect width="300" height="400" fill="url(#pk-hoshi)"/>
      <circle cx="238" cy="62" r="30" fill="#FFF3B0"/><circle cx="252" cy="52" r="27" fill="#2A2A62"/>
      ${scatter(46, 5, (x, y, r, i) => (i % 4 ? `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(0.8 + r * 1.6)}" fill="#FFFFFF" opacity="${f1(0.5 + r * 0.5)}"/>` : star(x, y, 4 + r * 5, "#FFE07A")))}`),
    umi: () => svg(300, 400, `<defs>${grad("pk-sky", [[0, "#9FDBFF"], [1, "#E8F7FF"]])}${grad("pk-sea", [[0, "#6CC3EC"], [1, "#2E86C1"]])}</defs><rect width="300" height="400" fill="url(#pk-sky)"/><rect y="230" width="300" height="170" fill="url(#pk-sea)"/>
      <circle cx="62" cy="70" r="28" fill="#FFE07A" stroke="#FFF6C8" stroke-width="6"/>${[0, 1, 2, 3, 4, 5].map((k) => `<path d="M${-10 + (k % 2) * 25} ${250 + k * 26} q18 -9 36 0 t36 0 t36 0 t36 0 t36 0 t36 0 t36 0 t36 0 t36 0" fill="none" stroke="#FFFFFF" stroke-width="3" opacity="0.65" stroke-linecap="round"/>`).join("")}
      ${[[190, 90], [228, 116], [160, 126]].map(([x, y]) => `<path d="M${x - 9} ${y} q4.5 -6 9 0 q4.5 -6 9 0" fill="none" stroke="${K}" stroke-width="2.4" stroke-linecap="round"/>`).join("")}`),
    heart: () => svg(300, 400, `<rect width="300" height="400" fill="#FFD1E3"/>${Array.from({ length: 8 }, (_, j) => Array.from({ length: 6 }, (_, i) => heart(25 + i * 50 + (j % 2) * 25, 25 + j * 52, 11, (i + j) % 3 ? "#FFA8CA" : "#FFFFFF", `opacity="0.85"`)).join("")).join("")}`),
    mee: () => svg(300, 400, `<rect width="300" height="400" fill="#2B2346"/>${Array.from({ length: 9 }, (_, k) => `<path d="M0 ${40 + k * 44} H300" stroke="#3F3363" stroke-width="2"/>`).join("")}
      <rect x="40" y="46" width="220" height="92" rx="24" fill="none" stroke="#FF8FB8" stroke-width="7" opacity="0.9"/><rect x="40" y="46" width="220" height="92" rx="24" fill="none" stroke="#FFFFFF" stroke-width="2"/>
      <text x="150" y="113" font-size="58" font-weight="900" text-anchor="middle" fill="#FFE3EF" stroke="#FF8FB8" stroke-width="3" font-family="'M PLUS Rounded 1c',sans-serif">Mee</text>
      ${scatter(24, 9, (x, y, r, i) => star(x, 150 + (y % 250), 3 + r * 5, ["#FFE07A", "#7FD3F0", "#FF8FB8"][i % 3]))}`),
  };
  // スタンプ（64×64。ふちは INK）
  const S = (body) => svg(64, 64, body), st = `stroke="${K}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
  const STAMP_SVG = {
    heart: () => S(heart(32, 30, 17, "#FF7BA8", st) + `<ellipse cx="23" cy="22" rx="5" ry="3" fill="#FFFFFF" opacity="0.7" transform="rotate(-30 23 22)"/>`),
    star: () => S(star(32, 34, 26, "#FFD84D", st) + `<circle cx="25" cy="30" r="2.4" fill="${K}"/><circle cx="39" cy="30" r="2.4" fill="${K}"/><path d="M27 38 q5 4 10 0" fill="none" ${st}/>`),
    kira: () => S(`<path d="M32 4 C34 22 42 30 60 32 C42 34 34 42 32 60 C30 42 22 34 4 32 C22 30 30 22 32 4 Z" fill="#9EE3FF" ${st}/><path d="M50 8 C51 13 53 15 58 16 C53 17 51 19 50 24 C49 19 47 17 42 16 C47 15 49 13 50 8 Z" fill="#FFFFFF" ${st}/>`),
    ribbon: () => S(`<path d="M32 32 L8 16 C4 26 4 38 8 48 Z" fill="#FF9EC4" ${st}/><path d="M32 32 L56 16 C60 26 60 38 56 48 Z" fill="#FF9EC4" ${st}/><path d="M28 34 L20 58 L28 54 L32 60 L32 36 M36 34 L44 58 L36 54 L32 60" fill="#FF7BA8" ${st}/><circle cx="32" cy="32" r="7" fill="#FF7BA8" ${st}/>`),
    flower: () => S([0, 72, 144, 216, 288].map((a) => `<ellipse cx="32" cy="17" rx="10" ry="13" fill="#FFFFFF" ${st} transform="rotate(${a} 32 32)"/>`).join("") + `<circle cx="32" cy="32" r="9" fill="#FFD84D" ${st}/>`),
    crown: () => S(`<path d="M8 50 L6 18 L20 32 L32 10 L44 32 L58 18 L56 50 Z" fill="#FFD84D" ${st}/><path d="M8 50 L56 50 L56 57 L8 57 Z" fill="#F2B632" ${st}/><circle cx="32" cy="40" r="5" fill="#FF7BA8" ${st}/><circle cx="18" cy="42" r="3.4" fill="#6FC7EF" ${st}/><circle cx="46" cy="42" r="3.4" fill="#7CCB6B" ${st}/>`),
    onpu: () => S(`<path d="M24 48 L24 12 L52 6 L52 40" fill="none" stroke="${K}" stroke-width="5" stroke-linejoin="round"/><path d="M24 20 L52 14" stroke="${K}" stroke-width="5"/><ellipse cx="17" cy="48" rx="10" ry="8" fill="#B79BEA" ${st}/><ellipse cx="45" cy="42" rx="10" ry="8" fill="#6FC7EF" ${st}/>`),
    niji: () => S(["#FF7BA8", "#FFD84D", "#7CCB6B", "#6FC7EF"].map((c, i) => `<path d="M${6 + i * 5} 50 A${26 - i * 5} ${26 - i * 5} 0 0 1 ${58 - i * 5} 50" fill="none" stroke="${c}" stroke-width="6"/>`).join("") + `<path d="M4 50 A28 28 0 0 1 60 50" fill="none" stroke="${K}" stroke-width="2.4"/><ellipse cx="12" cy="52" rx="10" ry="6" fill="#FFFFFF" ${st}/><ellipse cx="52" cy="52" rx="10" ry="6" fill="#FFFFFF" ${st}/>`),
    ashi: () => S(`<ellipse cx="32" cy="40" rx="14" ry="12" fill="#C98E5C" ${st}/>${[[14, 24], [24, 14], [40, 14], [50, 24]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="6" ry="7.5" fill="#C98E5C" ${st}/>`).join("")}`),
    fusen: () => S(`<path d="M32 44 C26 50 36 54 30 62" fill="none" stroke="${K}" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="32" cy="24" rx="17" ry="20" fill="#FF7BA8" ${st}/><path d="M29 44 L35 44 L32 40 Z" fill="#FF7BA8" ${st}/><ellipse cx="25" cy="16" rx="4" ry="6" fill="#FFFFFF" opacity="0.7"/>`),
    ichigo: () => S(`<path d="M32 60 C12 48 8 30 16 22 C24 16 40 16 48 22 C56 30 52 48 32 60 Z" fill="#FF6B7A" ${st}/><path d="M18 22 L24 12 L32 20 L40 12 L46 22 Z" fill="#7CCB6B" ${st}/>${[[24, 32], [36, 30], [30, 42], [42, 42], [22, 44]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.6" ry="2.4" fill="#FFF3B0"/>`).join("")}`),
    mee: () => S(`<path d="M6 12 H58 V44 H30 L18 56 L20 44 H6 Z" fill="#FFFFFF" ${st}/><text x="32" y="36" font-size="20" font-weight="900" text-anchor="middle" fill="#FF7BA8" font-family="'M PLUS Rounded 1c',sans-serif">Mee</text>`),
  };
  // はいけい・スタンプの ラスタは 3だんかいの 大きさ だけ（SvgCache の キーが 有限）
  const bgW = (px) => (px <= 160 ? 150 : px <= 320 ? 300 : 600), stW = (px) => (px <= 48 ? 48 : px <= 96 ? 96 : 192);
  const dprOf = () => (typeof G !== "undefined" && G.px) || (typeof devicePixelRatio !== "undefined" ? devicePixelRatio : 2);
  // 3人の ならび（ぜんしん: 足もとが 350・アップ: 大きく かさなって）。order は 描く じゅん（あとが まえ）
  const LAYOUT = [{ S: 156, y: 350, xs: [68, 150, 232], order: [0, 2, 1] }, { S: 212, y: 372, xs: [62, 150, 238], order: [0, 2, 1] }];
  const charaOpts = (ph, i) => {
    const id = ph.r[i], [poseId, faceId] = ph.c[id] || ["stand", "happy"], pz = P.POSE[poseId] || P.POSES[0], [outfit, color] = ph.o[id] || [{}, "soft"];
    return { pose: pz.pose, dir: pz.side ? (i === 0 ? "right" : i === 2 ? "left" : "down") : "down", face: faceId, outfit, color };
  };
  const A = {
    BG_SVG, STAMP_SVG, LAYOUT,
    keys() { return [...P.BGS.map((b) => "puri:bg:" + b.id), ...P.STAMPS.map((s) => "puri:stamp:" + s.id)]; },
    bgImg(id, px) { const w = bgW(px); return SvgCache.get("puri:bg:" + id, BG_SVG[id] || BG_SVG.yume, w, Math.round((w * 4) / 3)); },
    stampImg(k, px) { const w = stW(px); return SvgCache.get("puri:stamp:" + k, STAMP_SVG[k] || STAMP_SVG.heart, w, w); },
    // しゃしんを 描く まえに 絵を よみこむ（はば w の とき）
    ready(ph, w) {
      const dpr = dprOf(), k = w / P.PW, bw = bgW(w * dpr), L = LAYOUT[ph.z ? 1 : 0], jobs = [SvgCache.ensure("puri:bg:" + ph.bg, BG_SVG[ph.bg] || BG_SVG.yume, bw, Math.round((bw * 4) / 3))];
      for (const s of ph.d.s) { const sw = stW(P.STAMP_SIZE[s[3]] * k * dpr); jobs.push(SvgCache.ensure("puri:stamp:" + s[0], STAMP_SVG[s[0]], sw, sw)); }
      jobs.push(Chara.preload([0, 1, 2].map((i) => [ph.r[i], charaOpts(ph, i)]), L.S * k));
      return Promise.all(jobs);
    },
    // しゃしん 1まい（x, y: 左上・w: はば）。o.frame: わく（ロゴと 日づけ）
    draw(ctx, ph, x, y, w, o = {}) {
      const k = w / P.PW, h = P.PH * k, dpr = dprOf(), L = LAYOUT[ph.z ? 1 : 0];
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
      const bg = this.bgImg(ph.bg, w * dpr); if (bg) ctx.drawImage(bg, x, y, w, h); else { ctx.fillStyle = "#FBE3EC"; ctx.fillRect(x, y, w, h); }
      for (const i of L.order) if (ph.r[i]) Chara.draw(ctx, ph.r[i], charaOpts(ph, i), x + L.xs[i] * k, y + L.y * k, L.S * k);
      this.deco(ctx, ph.d, x, y, k, dpr);
      if (o.frame !== false) this.frame(ctx, ph, x, y, k);
      ctx.restore();
    },
    deco(ctx, d, x, y, k, dpr = dprOf()) {
      ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.lineCap = "round"; ctx.lineJoin = "round";
      for (const s of d.p) {
        const pts = s.pts; if (!pts.length) continue;
        ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); if (pts.length === 1) ctx.lineTo(pts[0][0] + 0.01, pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
        const w = P.PEN_W[s.w] || 4; ctx.strokeStyle = s.c === 5 ? "#FF7BA8" : "#FFFFFF"; ctx.lineWidth = w + 4; ctx.stroke(); ctx.strokeStyle = P.PENS[s.c] || P.PENS[0]; ctx.lineWidth = w; ctx.stroke();
      }
      ctx.restore();
      for (const [kind, sx, sy, sz] of d.s) { const s = (P.STAMP_SIZE[sz] || 56) * k, img = this.stampImg(kind, s * dpr); if (img) ctx.drawImage(img, x + sx * k - s / 2, y + sy * k - s / 2, s, s); }
      for (const [t, tx, ty, c] of d.x) {
        const fs = 26 * k; ctx.save(); ctx.font = `900 ${fs}px 'M PLUS Rounded 1c', sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.lineJoin = "round";
        ctx.lineWidth = 7 * k; ctx.strokeStyle = c === 5 ? "#FF7BA8" : "#FFFFFF"; ctx.strokeText(t, x + tx * k, y + ty * k, (P.PW - 12) * k); ctx.fillStyle = P.PENS[c] || P.PENS[0]; ctx.fillText(t, x + tx * k, y + ty * k, (P.PW - 12) * k); ctx.restore();
      }
    },
    // わく: しろい ふち・したの おび（Mee ぷりくら と 日づけ）
    frame(ctx, ph, x, y, k) {
      const w = P.PW * k, h = P.PH * k, b = 7 * k, band = 30 * k;
      ctx.save(); ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(x, y, w, b); ctx.fillRect(x, y, b, h); ctx.fillRect(x + w - b, y, b, h); ctx.fillRect(x, y + h - band, w, band);
      ctx.strokeStyle = "#FF9EC4"; ctx.lineWidth = Math.max(1, 2 * k); ctx.strokeRect(x + b, y + b, w - b * 2, h - band - b);
      // ちいさい しゃしん（アルバム・らくがきの えらび）は ロゴ だけ
      ctx.textBaseline = "middle"; ctx.fillStyle = "#FF7BA8";
      if (k < 0.5) { ctx.font = `900 ${Math.max(6, 18 * k)}px 'M PLUS Rounded 1c', sans-serif`; ctx.textAlign = "center"; ctx.fillText("Mee ぷりくら", x + w / 2, y + h - band / 2, w - 4); }
      else {
        ctx.font = `900 ${15 * k}px 'M PLUS Rounded 1c', sans-serif`; ctx.textAlign = "left"; ctx.fillText("Mee ぷりくら", x + 14 * k, y + h - band / 2);
        ctx.textAlign = "right"; ctx.fillStyle = INK; ctx.font = `800 ${12 * k}px 'M PLUS Rounded 1c', sans-serif`; ctx.fillText(Purikura.dateText(ph.t), x + w - 14 * k, y + h - band / 2);
      }
      ctx.restore();
    },
    // canvas 1まいに しゃしんを（すまほの アルバム）。はじめは うすい いろ → 絵が そろったら 描く
    async paint(cv, ph, cssW) {
      const dpr = dprOf(), h = Math.round((cssW * P.PH) / P.PW);
      cv.width = Math.round(cssW * dpr); cv.height = Math.round(h * dpr); cv.style.width = cssW + "px"; cv.style.height = h + "px";
      const ctx = cv.getContext("2d"); if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = "#FBE3EC"; ctx.fillRect(0, 0, cssW, h);
      try { await this.ready(ph, cssW); } catch (e) {}
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); this.draw(ctx, ph, 0, 0, cssW);
    },
  };
  return A;
})();

// ---- ぷりくらの 画面（SCENES.purikura）: はいけい → さつえい 4まい → らくがき → できあがり ----
class PurikuraScene {
  async enter(p = {}) {
    this.back = p.back || null; this.phase = "bg"; this.bg = "yume"; this.z = 0; this.who = "all"; this.tab = "pose";
    this.sel = Object.fromEntries(Chara.IDS.map((id) => [id, ["stand", "happy"]]));
    this.shots = []; this.deco = []; this.di = 0; this.tool = "pen"; this.pen = { c: 0, w: 1 }; this.stamp = "heart"; this.ssz = 1; this.word = Purikura.WORDS[0]; this.wc = 0; this.hist = [];
    this.count = null; this.flash = 0; this.clock = 0; this.speed = 1; this.drawing = null; this.saved = false; this.closed = false; this.msg = "";
    UI.showHud(true, "ぷりくら"); Sound.bgm("arcade_hall");
    this.buildUI(); this.resize();
    const o = Purikura.outfits(), list = [];
    for (const id of Chara.IDS) for (const P of Purikura.POSES) list.push([id, { pose: P.pose, dir: "down", face: "happy", outfit: o[id][0], color: o[id][1] }]);
    await Promise.all([Chara.preload(list, this.charaSize()), ...Purikura.BGS.map((b) => SvgCache.ensure("puri:bg:" + b.id, PurikuraArt.BG_SVG[b.id], 300, 400))]);
  }
  exit() { this.closed = true; this.panel?.remove(); UI.showHud(false); }
  // いまの えらびかた（さつえいの まえの カメラ・とった しゃしん）
  photoOf(shot, deco) {
    const o = shot ? shot.o : Purikura.outfits(), c = shot ? shot.c : this.sel;
    return { id: "live", t: shot ? shot.t : Date.now(), bg: this.bg, z: shot ? shot.z : this.z, r: Save.d.order.slice(), c, o, d: deco || { p: [], s: [], x: [] } };
  }
  charaSize() { return PurikuraArt.LAYOUT[1].S * ((this.view ? this.view.w : 260) / Purikura.PW); }
  // ---- ボタン ----
  buildUI() {
    this.panel?.remove();
    const P = (this.panel = U.el("div", { class: "puri-panel" }));
    UI.root.append(P); this.ui();
  }
  chip(label, on, fn, cls = "") { const b = UI.btn("", () => { Sound.se("tap"); fn(); }, "puri-chip " + cls + (on ? " on" : "")); b.textContent = label; b.setAttribute("aria-pressed", on ? "true" : "false"); return b; }
  row(cls, kids) { return U.el("div", { class: cls }, kids); }
  ui() {
    const P = this.panel, ph = this.phase; P.replaceChildren(); P.dataset.phase = ph;
    if (ph === "bg") {
      P.append(U.el("div", { class: "puri-title", text: "はいけいを えらんでね" }));
      const grid = U.el("div", { class: "puri-bgs" });
      for (const b of Purikura.BGS) { const btn = UI.btn("", () => { Sound.se("tap"); this.bg = b.id; this.ui(); }, "puri-bg" + (this.bg === b.id ? " on" : "")); btn.setAttribute("aria-label", b.name); btn.append(U.el("img", { src: U.svgUrl(PurikuraArt.BG_SVG[b.id]()), alt: "" }), U.el("span", { text: b.name })); grid.append(btn); }
      P.append(grid, this.row("puri-actions", [UI.btn("やめる", () => this.quit(), "puri-small"), UI.btn("とりはじめる", () => { Sound.se("ok"); this.phase = "shoot"; this.ui(); this.resize(); }, "yellow puri-main")]));
    } else if (ph === "shoot") {
      const whoRow = this.row("puri-who", [["all", "みんな"], ...Save.d.order.map((id) => [id, Save.d.chars[id].name])].map(([k, name]) => this.chip(name, this.who === k, () => { this.who = k; this.ui(); })));
      const tabs = this.row("puri-tabs", [this.chip("ポーズ", this.tab === "pose", () => { this.tab = "pose"; this.ui(); }, "tab"), this.chip("かお", this.tab === "face", () => { this.tab = "face"; this.ui(); }, "tab"), this.chip(this.z ? "ぜんしんに" : "アップに", false, () => { this.z = this.z ? 0 : 1; this.ui(); }, "tab zoom")]);
      const cur = (k) => (this.who === "all" ? Save.d.order.every((id) => this.sel[id][k] === this.sel[Save.d.order[0]][k]) && this.sel[Save.d.order[0]][k] : this.sel[this.who][k]);
      const set = (k, v) => { for (const id of this.who === "all" ? Chara.IDS : [this.who]) this.sel[id][k] = v; this.ui(); };
      const opts = this.tab === "pose" ? Purikura.POSES.map((x) => this.chip(x.name, cur(0) === x.id, () => set(0, x.id))) : Purikura.FACES.map((x) => this.chip(x.name, cur(1) === x.id, () => set(1, x.id)));
      const shot = UI.btn("とる！", () => this.shoot(), "puri-shot" + (this.count ? "" : " ready")); shot.disabled = !!this.count;
      P.append(whoRow, tabs, this.row("puri-chips", opts), this.row("puri-actions", [UI.btn("やめる", () => this.quit(), "puri-small"), shot, U.el("div", { class: "puri-count", text: `${this.shots.length + 1} / ${Purikura.SHOTS}` })]));
    } else if (ph === "deco") {
      const thumbs = this.row("puri-thumbs", this.shots.map((s, i) => { const b = UI.btn("", () => { Sound.se("tap"); this.di = i; this.ui(); }, "puri-thumbbtn" + (this.di === i ? " on" : "")); b.setAttribute("aria-label", `${i + 1}まいめ`); const cv = U.el("canvas"); b.append(cv); PurikuraArt.paint(cv, this.photoOf(s, this.deco[i]), 36); return b; }));
      const undo = UI.btn("もどす", () => this.undo(), "puri-small"); undo.disabled = !this.hist.some((h) => h.i === this.di);
      thumbs.append(undo);
      const tools = this.row("puri-tabs", [["pen", "ペン"], ["stamp", "スタンプ"], ["text", "もじ"]].map(([k, name]) => this.chip(name, this.tool === k, () => { this.tool = k; this.ui(); }, "tab")));
      let opts = [];
      if (this.tool === "pen") opts = [...Purikura.PENS.map((c, i) => { const b = this.chip("", this.pen.c === i, () => { this.pen.c = i; this.ui(); }, "swatch"); b.style.setProperty("--sw", c); b.setAttribute("aria-label", ["ピンク", "きいろ", "みずいろ", "みどり", "むらさき", "しろ"][i]); return b; }), this.chip("ほそい", this.pen.w === 0, () => { this.pen.w = 0; this.ui(); }), this.chip("ふとい", this.pen.w === 1, () => { this.pen.w = 1; this.ui(); })];
      else if (this.tool === "stamp") opts = [...Purikura.STAMPS.map((s) => { const b = this.chip("", this.stamp === s.id, () => { this.stamp = s.id; this.ui(); }, "stamp"); b.setAttribute("aria-label", s.name); b.append(U.el("img", { src: U.svgUrl(PurikuraArt.STAMP_SVG[s.id]()), alt: "" })); return b; }), ...["ちいさい", "ふつう", "おおきい"].map((t, i) => this.chip(t, this.ssz === i, () => { this.ssz = i; this.ui(); }))];
      else opts = [...Purikura.WORDS.map((w) => this.chip(w, this.word === w, () => { this.word = w; this.ui(); })), this.chip("じぶんで かく", false, () => this.ownWord()), ...Purikura.PENS.map((c, i) => { const b = this.chip("", this.wc === i, () => { this.wc = i; this.ui(); }, "swatch"); b.style.setProperty("--sw", c); b.setAttribute("aria-label", "もじの いろ " + (i + 1)); return b; })];
      P.append(thumbs, tools, this.row("puri-chips", opts), this.row("puri-actions", [UI.btn("できあがり", () => this.done(), "yellow puri-main")]));
      P.append(U.el("div", { class: "puri-hint", text: this.tool === "pen" ? "しゃしんを なぞって かこう" : this.tool === "stamp" ? "しゃしんを タップして スタンプ" : "しゃしんを タップして もじ" }));
    } else {
      P.append(U.el("div", { class: "puri-title", text: "できあがり！\nすまほの「しゃしん」に 4まい はいったよ" }), this.row("puri-actions", [UI.btn("すまほで みる", () => { Sound.se("ok"); Smaho.open("photos"); }, "yellow puri-main"), UI.btn("おみせに もどる", () => this.leave(), "puri-main")]));
    }
    requestAnimationFrame(() => this.resize());
  }
  resize() {
    const top = 70, bot = this.panel ? this.panel.getBoundingClientRect().height + 14 : 240, h = Math.max(160, G.H - top - bot), w = Math.min(G.W - 36, h * 0.75);
    this.view = { x: (G.W - w) / 2, y: top + Math.max(0, (h - w / 0.75) / 2), w, h: w / 0.75 };
  }
  // ---- さつえい ----
  shoot() {
    if (this.count || this.phase !== "shoot" || Game.inputLocked) return;
    Sound.se("ok"); this.count = { n: 3, t: 0 }; this.ui(); Sound.se("puri_count");
  }
  snap() {
    this.count = null; this.flash = 0.45; Sound.se("puri_shutter");
    this.shots.push({ c: JSON.parse(JSON.stringify(this.sel)), z: this.z, o: Purikura.outfits(), t: Date.now() }); this.deco.push({ p: [], s: [], x: [] });
    if (this.shots.length >= Purikura.SHOTS) { this.phase = "deco"; this.di = 0; this.msg = "らくがき しよう！"; } else this.msg = `${this.shots.length}まいめ とれたよ！`;
    this.msgT = 1.2; this.ui();
  }
  // ---- らくがき ----
  toPhoto(p) { const v = this.view, k = v.w / Purikura.PW, x = (p.x - v.x) / k, y = (p.y - v.y) / k; return x >= 0 && x <= Purikura.PW && y >= 0 && y <= Purikura.PH ? [Math.round(x), Math.round(y)] : null; }
  full(kind) {
    const d = this.deco[this.di], L = Purikura.LIMIT, pts = d.p.reduce((s, x) => s + x.pts.length, 0);
    const over = kind === "p" ? d.p.length >= L.strokes || pts >= L.points : kind === "s" ? d.s.length >= L.stamps : d.x.length >= L.texts;
    if (over) UI.toast(kind === "p" ? "ペンは もう いっぱい" : kind === "s" ? "スタンプは もう いっぱい" : "もじは もう いっぱい");
    return over;
  }
  down(p) {
    if (this.phase !== "deco" || UI.busy) return;
    const q = this.toPhoto(p); if (!q) return;
    const d = this.deco[this.di];
    if (this.tool === "pen") { if (this.full("p")) return; this.drawing = { id: p.id, st: { c: this.pen.c, w: this.pen.w, pts: [q] } }; d.p.push(this.drawing.st); }
    else if (this.tool === "stamp") { if (this.full("s")) return; d.s.push([this.stamp, q[0], q[1], this.ssz]); this.hist.push({ i: this.di, k: "s" }); Sound.se("puri_stamp"); this.ui(); }
    else { if (this.full("x")) return; d.x.push([this.word, q[0], q[1], this.wc]); this.hist.push({ i: this.di, k: "x" }); Sound.se("puri_stamp"); this.ui(); }
  }
  move(p) {
    const D = this.drawing; if (!D || (p.id != null && p.id !== D.id)) return;
    const q = this.toPhoto(p); if (!q) return;
    const pts = D.st.pts, last = pts[pts.length - 1], d = this.deco[this.di], all = d.p.reduce((s, x) => s + x.pts.length, 0);
    if (Math.hypot(q[0] - last[0], q[1] - last[1]) >= 2.5 && all < Purikura.LIMIT.points) pts.push(q);
  }
  up(p) { if (this.drawing && (p.id == null || p.id === this.drawing.id)) { this.hist.push({ i: this.di, k: "p" }); this.drawing = null; Sound.se("tap"); this.ui(); } }
  undo() {
    for (let k = this.hist.length - 1; k >= 0; k--) { const h = this.hist[k]; if (h.i !== this.di) continue; this.deco[h.i][h.k].pop(); this.hist.splice(k, 1); Sound.se("cancel"); break; }
    this.ui();
  }
  async ownWord() {
    const t = await UI.input(`しゃしんに かく ことば（${Purikura.LIMIT.word}もじ まで）`, "", { max: Purikura.LIMIT.word });
    const w = t ? t.replace(/[<>&"'`\u0000-\u001f]/g, "").slice(0, Purikura.LIMIT.word) : "";
    if (w) { this.word = w; if (!Purikura.WORDS.includes(w)) this.customWord = w; } this.ui();
  }
  // できあがり: しゃしん 4まいを すまほへ（1かいだけ）
  async done() {
    if (this.saved || UI.busy) return;
    const base = Date.now().toString(36);
    const photos = this.shots.map((s, i) => ({ id: `p${base}-${i}`, t: s.t, bg: this.bg, z: s.z, r: Save.d.order.slice(), c: s.c, o: s.o, d: { p: this.deco[i].p.filter((x) => x.pts.length).map(Purikura.packStroke), s: this.deco[i].s, x: this.deco[i].x } }));
    if (!Purikura.finish(photos)) { UI.toast("もう できあがって いるよ"); return; }
    this.saved = true; this.photos = photos.map(Purikura.clean); this.phase = "done"; Sound.se("fanfare"); this.ui(); this.resize();
    await UI.say(Save.d.order.map((id) => ({ who: id, emo: "happy", text: id === "goji" ? "ガゥ♪ いい かお できた！" : id === "gachan" ? "ピヨ！ きらきらに なった♪" : "わん！ すまほで また みようね！" })));
  }
  async quit() {
    if (UI.busy) return;
    if (!(await UI.confirm("ぷりくらを やめる？\n（おかねは もどらないけど、つぎに きた ときに ただで とりなおせるよ）", "やめる", "つづける"))) return;
    this.leave();
  }
  leave() { if (Game.inputLocked) return; if (this.back) Game.goto("venue", this.back, "circle"); else Game.goto("house", {}, "circle"); }
  update(dt) {
    if (this.closed) return;
    this.clock += dt;
    if (this.count) {
      this.count.t += dt * this.speed;
      if (this.count.t >= 0.8) { this.count.t = 0; this.count.n--; if (this.count.n <= 0) this.snap(); else Sound.se("puri_count"); }
    }
    if (this.flash > 0) this.flash -= dt;
    if (this.msgT > 0) this.msgT -= dt;
  }
  // ---- 描く ----
  render(ctx) {
    const W = G.W, H = G.H, v = this.view;
    // ブースの なか（ピンクの カーテンと ライト）
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#F8C8DA"); g.addColorStop(1, "#E59BB9"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(255,255,255,0.18)"; for (let x = 12; x < W; x += 34) ctx.fillRect(x, 0, 12, H);
    for (let i = 0; i < 9; i++) { const x = ((i + 0.5) * W) / 9, on = (i + Math.floor(this.clock * 4)) % 3 === 0; ctx.fillStyle = on ? "#FFF6C8" : "#FFFFFF"; ctx.beginPath(); ctx.arc(x, 66, 4, 0, 7); ctx.fill(); }
    if (!v) return;
    // カメラの がめん
    ctx.fillStyle = INK; U.rr(ctx, v.x - 8, v.y - 8, v.w + 16, v.h + 16, 14); ctx.fill();
    if (this.phase === "done" && this.photos) {
      // できあがり: 4まい ならべる
      const gw = (v.w - 10) / 2, gh = (gw * 4) / 3, oy = v.y + (v.h - gh * 2 - 10) / 2;
      ctx.fillStyle = "#FFF6FA"; ctx.fillRect(v.x, v.y, v.w, v.h);
      this.photos.forEach((ph, i) => PurikuraArt.draw(ctx, Purikura.view(ph), v.x + (i % 2) * (gw + 10), oy + Math.floor(i / 2) * (gh + 10), gw));
    } else {
      const shot = this.phase === "deco" ? this.shots[this.di] : null, ph = this.photoOf(shot, this.phase === "deco" ? this.deco[this.di] : null);
      PurikuraArt.draw(ctx, ph, v.x, v.y, v.w, { frame: this.phase === "deco" });
      if (this.phase === "shoot") {
        // カメラの しるし（すみの かぎ・REC）
        ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 3; const c = 16;
        for (const [x, y, sx, sy] of [[v.x + 8, v.y + 8, 1, 1], [v.x + v.w - 8, v.y + 8, -1, 1], [v.x + 8, v.y + v.h - 8, 1, -1], [v.x + v.w - 8, v.y + v.h - 8, -1, -1]]) { ctx.beginPath(); ctx.moveTo(x, y + c * sy); ctx.lineTo(x, y); ctx.lineTo(x + c * sx, y); ctx.stroke(); }
        ctx.fillStyle = Math.floor(this.clock * 2) % 2 ? "#FF5A6E" : "rgba(255,90,110,0.4)"; ctx.beginPath(); ctx.arc(v.x + 22, v.y + 24, 5, 0, 7); ctx.fill();
        ctx.font = "900 13px 'M PLUS Rounded 1c', sans-serif"; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillStyle = "#FFFFFF"; ctx.fillText(`${Math.min(this.shots.length + 1, Purikura.SHOTS)} / ${Purikura.SHOTS}`, v.x + 32, v.y + 24);
      }
    }
    // カウントダウン・フラッシュ・ひとこと
    if (this.count) { const s = 1 + (1 - this.count.t / 0.8) * 0.3; ctx.save(); ctx.translate(v.x + v.w / 2, v.y + v.h * 0.42); ctx.scale(s, s); ctx.font = "900 96px 'M PLUS Rounded 1c', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.lineWidth = 10; ctx.strokeStyle = INK; ctx.strokeText(String(this.count.n), 0, 0); ctx.fillStyle = "#FFFFFF"; ctx.fillText(String(this.count.n), 0, 0); ctx.restore(); }
    if (this.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${Math.min(1, this.flash * 2.4)})`; ctx.fillRect(0, 0, W, H); }
    if (this.msgT > 0 && this.msg) { ctx.save(); ctx.globalAlpha = Math.min(1, this.msgT * 2); ctx.font = "900 22px 'M PLUS Rounded 1c', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.strokeText(this.msg, W / 2, v.y + v.h * 0.12, W - 30); ctx.fillStyle = "#FFE45C"; ctx.fillText(this.msg, W / 2, v.y + v.h * 0.12, W - 30); ctx.restore(); }
  }
}
SCENES.purikura = PurikuraScene;

// ---- すまほの「しゃしん」アプリ（Smaho.APPS の photos）----
Purikura.phoneView = function (el, ph, openId = null) {
  el.replaceChildren();
  const list = this.list().slice().reverse(); // あたらしい じゅん
  if (openId && list.some((p) => p.id === openId)) return this.phoneOne(el, ph, openId);
  el.append(U.el("p", { class: "note", text: list.length ? `しゃしん ${list.length}まい（${this.MAX}まい まで）。タップで おおきく みられるよ。` : "まだ しゃしんが ないよ。Meeときょれじゃ の ぷりくらで とろう！" }));
  const grid = U.el("div", { class: "puri-album" });
  for (const p of list) {
    const b = U.el("button", { class: "puri-photo", "aria-label": "しゃしん " + this.dateText(p.t) }), cv = U.el("canvas");
    b.append(cv); PurikuraArt.paint(cv, this.view(p), 90);
    b.addEventListener("click", () => { Sound.se("tap"); this.phoneOne(el, ph, p.id); });
    grid.append(b);
  }
  el.append(grid);
};
Purikura.phoneOne = function (el, ph, id) {
  el.replaceChildren();
  const list = this.list().slice().reverse(), i = list.findIndex((p) => p.id === id), p = list[i];
  if (!p) return this.phoneView(el, ph);
  // しゃしんは たても はいる 大きさ（したの ボタン 2だんが スクロール しないで 見える）。日づけは しゃしんの わくに ある
  const room = el.clientHeight ? el.clientHeight - 130 : 400, w = Math.floor(Math.max(150, Math.min(300, (el.clientWidth || 300) - 24, room * 0.75)));
  const box = U.el("div", { class: "puri-viewer" }), cv = U.el("canvas", { class: "puri-big", role: "img", "aria-label": "しゃしん " + this.dateText(p.t) });
  PurikuraArt.paint(cv, this.view(p), w);
  const nav = U.el("div", { class: "puri-nav" });
  const prev = UI.btn("‹ まえ", () => { Sound.se("tap"); this.phoneOne(el, ph, list[i - 1].id); }, "small"), next = UI.btn("つぎ ›", () => { Sound.se("tap"); this.phoneOne(el, ph, list[i + 1].id); }, "small");
  prev.disabled = i <= 0; next.disabled = i >= list.length - 1;
  nav.append(prev, U.el("span", { class: "puri-pos", text: `${i + 1} / ${list.length}` }), next);
  const acts = U.el("div", { class: "puri-nav" });
  acts.append(
    UI.btn("いちらん", () => { Sound.se("cancel"); this.phoneView(el, ph); }, "small"),
    UI.btn("ほぞん", () => this.download(p), "small yellow"),
    UI.btn("けす", async () => { if (await UI.confirm("この しゃしんを けす？（もとに もどせないよ）", "けす", "やめる")) { this.remove(p.id); Sound.se("cancel"); const rest = this.list().slice().reverse(); if (rest.length) this.phoneOne(el, ph, (rest[Math.min(i, rest.length - 1)] || rest[0]).id); else this.phoneView(el, ph); } }, "small"),
  );
  box.append(cv, nav, acts);
  el.append(box);
};
// たんまつに 画像で ほぞん（PNG・この 端末の 中だけ。そとには おくらない）
Purikura.download = async function (p) {
  const cv = document.createElement("canvas"), ctx = cv.getContext("2d"); if (!ctx) return;
  const w = 600; cv.width = w; cv.height = (w * this.PH) / this.PW;
  const v = this.view(p); try { await PurikuraArt.ready(v, w / (typeof G !== "undefined" && G.px ? G.px : 1)); } catch (e) {}
  const k = typeof G !== "undefined" && G.px ? G.px : 1; ctx.setTransform(k, 0, 0, k, 0, 0); PurikuraArt.draw(ctx, v, 0, 0, w / k);
  try { const a = U.el("a", { href: cv.toDataURL("image/png"), download: `pokapoka-purikura-${this.dateText(p.t).replace(/\./g, "-")}.png` }); document.body.append(a); a.click(); a.remove(); UI.toast("がぞうを ほぞん したよ"); } catch (e) { UI.toast("ほぞん できなかったよ"); }
};

// ---- こうかおん ----
Object.assign(CraneSE, {
  puri_count: (S, T) => { T({ f: 880, dur: 0.08, type: "pulse", vol: 0.1 }); },
  puri_shutter: (S, T, N) => { N({ dur: 0.06, vol: 0.3, freq: 3000, q: 1.2 }); N({ dur: 0.09, vol: 0.22, freq: 1400, q: 1, t: 0.07 }); T({ f: 1760, t: 0.02, dur: 0.05, type: "square", vol: 0.05 }); },
  puri_stamp: (S, T) => { T({ f: 1318, dur: 0.05, type: "triangle", vol: 0.09 }); T({ f: 1760, t: 0.05, dur: 0.07, type: "triangle", vol: 0.08 }); },
});
