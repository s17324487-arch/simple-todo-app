// ぷりくら（Meeときょれじゃ 3F の しゃしんの ブース 3台・UI-11／UI-21／UI-24／UI-25／UI-87）: 300コイン → はいけいを えらぶ（ぜんぶ おなじ か 1まいずつ・とる まえにも かえられる）→ 4まい とる（ポーズ・かお・アップ／ぜんしん・3・2・1）→ らくがき（ペン・スタンプ・かお・もじ・キラキラ。おいた ものは さわって うごかす・まわす）→ すまほの「しゃしん」アプリで みる。
// ブースは 3つの コンセプト（ゆめかわ・がっこう・おでかけ）。ブースごとに はいけい 6つ・わくの いろ・ことばが ちがう（BOOTHS）。
// ほんものの プリクラと おなじ ながれ（お金を いれる → はいけい → さつえい → らくがき → スマホで みる）。
// しゃしんは 画像では なく 絵の データ（Save.d.photos）。みる ときに 描く ので セーブが 大きく ならない。しゃしんの 座標は 300×400（たて）。
// 3人は Chara.draw、はいけい・スタンプ・キラキラは SvgCache（キーは しゅるいと 3だんかいの 大きさ だけ）。
const Purikura = (() => {
  const PW = 300, PH = 400, MAX = 60, SHOTS = 4, PRICE = 300;
  const BGS = [
    // ゆめかわ
    { id: "yume", name: "ゆめかわ" }, { id: "hana", name: "おはな" }, { id: "hoshi", name: "ほしぞら" },
    { id: "umi", name: "うみ" }, { id: "heart", name: "ハート" }, { id: "mee", name: "Mee" },
    // がっこう
    { id: "kyoshitsu", name: "きょうしつ" }, { id: "rouka", name: "ろうか" }, { id: "taiiku", name: "たいいくかん" },
    { id: "kotei", name: "こうてい" }, { id: "okujo", name: "おくじょう" }, { id: "toshokan", name: "としょしつ" },
    // おでかけ
    { id: "yuenchi", name: "ゆうえんち" }, { id: "matsuri", name: "おまつり" }, { id: "cafe", name: "カフェ" },
    { id: "suizoku", name: "すいぞくかん" }, { id: "uchu", name: "うちゅう" }, { id: "oshiro", name: "おしろ" },
  ];
  // ブース（Meeときょれじゃ 3F の 3台。id と なまえは js/ike-arcade.js の IkeArcade.BOOTHS と おなじ）。はいけい 6つ・わくの いろ（col・line）・わくの もじ（logo）・ことば（words は ぜんぶの ブースの WORDS の まえに ならぶ）
  const BOOTHS = [
    { id: "yume", name: "ゆめかわ", logo: "Mee ぷりくら", bgs: ["yume", "hana", "hoshi", "umi", "heart", "mee"], col: "#FF7BA8", line: "#FF9EC4", words: [] },
    { id: "school", name: "がっこう", logo: "Mee がっこう", bgs: ["kyoshitsu", "rouka", "taiiku", "kotei", "okujo", "toshokan"], col: "#4A67B0", line: "#9FB3DE", words: ["おなじ クラス", "がっこう だいすき", "なかよし はん"] },
    { id: "odekake", name: "おでかけ", logo: "Mee おでかけ", bgs: ["yuenchi", "matsuri", "cafe", "suizoku", "uchu", "oshiro"], col: "#2E9CC9", line: "#9FD8EC", words: ["おでかけ だいすき", "また いこうね", "たのしい いちにち"] },
  ];
  // ポーズ（キャラ素材の ポーズ）。よこむき は りょうはしの 2人が まんなかを むく。
  // gesture: うでの ポーズ（js/puri-pose.js の PuriPose・UI-24。ピース・しゃきーん・わーい・ハート・にゃん）。はっきり ちがう ポーズを さきに ならべる
  const POSES = [
    { id: "stand", name: "たつ", pose: "idle_01" },
    { id: "peace", name: "ピース", pose: "idle_01", gesture: "peace" }, { id: "shakin", name: "しゃきーん", pose: "idle_01", gesture: "shakin" }, { id: "wai", name: "わーい", pose: "jump_01", gesture: "wai" },
    { id: "heart", name: "ハート", pose: "idle_01", gesture: "heart" }, { id: "nyan", name: "にゃん", pose: "idle_02", gesture: "nyan" },
    { id: "jump", name: "ジャンプ", pose: "jump_01" }, { id: "crouch", name: "しゃがむ", pose: "land_01" },
    { id: "sway", name: "ゆらゆら", pose: "idle_02" }, { id: "walk", name: "あるく", pose: "walk_01" }, { id: "side", name: "よこむき", pose: "idle_01", side: true },
  ];
  // かお（Chara の EMO。3人で それぞれの かおに なる。キャラ素材に ない かおは PuriPose.faceOf が くみたてた かおに する: 8つの ボタンが 3人とも ちがう かお）
  const FACES = [
    { id: "happy", name: "にっこり" }, { id: "excited", name: "わくわく" }, { id: "love", name: "らぶらぶ" }, { id: "surprise", name: "びっくり" },
    { id: "angry", name: "ぷんぷん" }, { id: "sad", name: "えーん" }, { id: "sleep", name: "すやすや" }, { id: "normal", name: "ふつう" },
  ];
  const PENS = ["#FF7BA8", "#FFD84D", "#6FC7EF", "#7CCB6B", "#B79BEA", "#FFFFFF"], PEN_W = [4, 9];
  const STAMPS = [
    { id: "heart", name: "ハート" }, { id: "star", name: "ほし" }, { id: "kira", name: "キラキラ" }, { id: "ribbon", name: "リボン" },
    { id: "flower", name: "おはな" }, { id: "crown", name: "おうかん" }, { id: "onpu", name: "おんぷ" }, { id: "niji", name: "にじ" },
    { id: "ashi", name: "あしあと" }, { id: "fusen", name: "ふうせん" }, { id: "ichigo", name: "いちご" }, { id: "mee", name: "Mee" },
    // かおの スタンプ（UI-25。「かお」の タブ）: かおに かさねて つかう
    { id: "hoppe", name: "ほっぺ", face: true }, { id: "matsuge", name: "まつげ", face: true }, { id: "namida", name: "なみだ", face: true }, { id: "kushami", name: "くしゃみ", face: true },
    { id: "hige", name: "ねこひげ", face: true }, { id: "ase", name: "あせ", face: true }, { id: "nekomimi", name: "ねこみみ", face: true }, { id: "wakka", name: "てんしの わ", face: true },
  ];
  const STAMP_SIZE = [34, 56, 84];
  // キラキラ（UI-25）: しゃしん ぜんたいに かさねる エフェクト。いくつでも かさねられる（3人の うえ・らくがきの した）
  const EFFECTS = [
    { id: "kira", name: "きらきら" }, { id: "heart", name: "ハート" }, { id: "hoshi", name: "ほし" }, { id: "awa", name: "しゃぼんだま" },
    { id: "sakura", name: "さくら" }, { id: "yuki", name: "ゆき" }, { id: "fuwa", name: "ふんわり" }, { id: "niji", name: "にじいろ" },
  ];
  const WORDS = ["なかよし", "だいすき", "ずっと いっしょ", "ぽかぽか", "イェーイ", "ともだち", "たのしい！", "Mee"];
  const LIMIT = { strokes: 40, points: 1500, stamps: 30, texts: 6, word: 10 };
  const INDEX = (list) => Object.fromEntries(list.map((x) => [x.id, x]));
  const BG = INDEX(BGS), POSE = INDEX(POSES), FACE = INDEX(FACES), STAMP = INDEX(STAMPS), BOOTH = INDEX(BOOTHS), EFFECT = INDEX(EFFECTS);
  // はいけいの ある ブース（ふるい しゃしんは ゆめかわ）
  const boothOf = (bg) => BOOTHS.find((b) => b.bgs.includes(bg)) || BOOTHS[0];

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
  // かたむき（UI-25）: どの かずでも -180〜179 の せいすう に（ない・こわれて いる ときは 0）
  const turn = (v) => { const n = Math.round(+v); return Number.isFinite(n) ? (((n % 360) + 540) % 360) - 180 : 0; };

  // ---- しゃしん 1まい（セーブの かたち）をたしかめる。こわれて いれば null。つかえない ぶぶんは すてる ----
  // { id, t, bg, k: ブース, z: 0 ぜんしん|1 アップ, r: [3人の じゅんばん], c: { だれ: [ポーズ, かお] }, o: { だれ: [服, いろ] }, d: { p: [せん], s: [[スタンプ, x, y, 大きさ, かたむき?, はんてん?]], x: [[ことば, x, y, いろ, かたむき?]], e?: [キラキラ] } }
  // k が ない（UI-21 より まえの）しゃしんは はいけいの ブース。かたむき・はんてん・e（UI-25）は 0／ない ときは かかない（まえの しゃしんと おなじ かたち）
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
    const stamps = (Array.isArray(d.s) ? d.s : []).filter((s) => Array.isArray(s) && STAMP[s[0]]).map((s) => { const a = [s[0], num(s[1], 0, PW), num(s[2], 0, PH), num(s[3], 0, 2)], r = turn(s[4]), f = s[5] === 1 || s[5] === true; return r || f ? [...a, r, ...(f ? [1] : [])] : a; }).filter((s) => s.every((v) => v !== null)).slice(0, LIMIT.stamps);
    const texts = (Array.isArray(d.x) ? d.x : []).filter((s) => Array.isArray(s) && word(s[0])).map((s) => { const a = [word(s[0]), num(s[1], 0, PW), num(s[2], 0, PH), num(s[3], 0, PENS.length - 1)], r = turn(s[4]); return r ? [...a, r] : a; }).filter((s) => s.every((v) => v !== null)).slice(0, LIMIT.texts);
    const fx = EFFECTS.map((e) => e.id).filter((id) => Array.isArray(d.e) && d.e.includes(id));
    const bg = BG[p.bg] ? p.bg : "yume", k = BOOTH[p.k] && BOOTH[p.k].bgs.includes(bg) ? p.k : boothOf(bg).id;
    const out = { id: p.id, t: num(p.t, 0, 9e15) || 0, bg, k, z: p.z ? 1 : 0, r, c, o, d: { p: strokes, s: stamps, x: texts, ...(fx.length ? { e: fx } : {}) } }, m = moves(p.m);
    if (m) out.m = m;
    return out;
  };
  // 3人の ばしょ（UI-24。ならびの ばしょ からの ずれ・しゃしんの 座標）。うごかして いなければ なし（まえの しゃしんと おなじ かたち）
  const MOVE = { x: 240, up: 150, down: 40 };
  const moves = (m) => {
    if (!m || typeof m !== "object") return null;
    const out = {}; let any = false;
    for (const id of Chara.IDS) { const v = Array.isArray(m[id]) ? m[id] : [0, 0], x = num(v[0], -MOVE.x, MOVE.x) || 0, y = num(v[1], -MOVE.up, MOVE.down) || 0; out[id] = [x, y]; if (x || y) any = true; }
    return any ? out : null;
  };
  // 描く ための かたち（せんを 点の ならびに もどす）
  const unpacked = new WeakMap();
  const view = (p) => { let v = unpacked.get(p); if (!v) { v = { ...p, d: { p: p.d.p.map(unpackStroke).filter(Boolean), s: p.d.s, x: p.d.x, e: p.d.e || [] } }; unpacked.set(p, v); } return v; };

  const st = () => { const s = Save.d.purikura || (Save.d.purikura = { plays: 0, active: null, taken: 0 }); if (!Array.isArray(Save.d.photos)) Save.d.photos = []; return s; };
  return {
    PW, PH, MAX, SHOTS, PRICE, BGS, BOOTHS, POSES, FACES, PENS, PEN_W, STAMPS, STAMP_SIZE, EFFECTS, WORDS, LIMIT, BG, BOOTH, POSE, FACE, STAMP, EFFECT,
    packStroke, unpackStroke, clean, view, st, boothOf, MOVE, moves, turn,
    // 1まいずつの はいけい（UI-87。オーナーの 指示 2026-10-04「撮影ごとに背景を変えられるようにして」）: 4まいぶん（はじめは ブースの 1つめ）。
    // slot は "all"（ぜんぶ おなじ）か 0〜3（その まい）。ブースに ない はいけいは つかわない（しゃしんは 1まいずつ bg を もつ ので セーブの かたちは まえの まま）
    slotBgs(booth) { const b = BOOTH[booth] || BOOTHS[0]; return Array(SHOTS).fill(b.bgs[0]); },
    setBg(bgs, slot, id, booth) {
      const b = BOOTH[booth] || BOOTHS[0], out = Array.from({ length: SHOTS }, (_, i) => (Array.isArray(bgs) && b.bgs.includes(bgs[i]) ? bgs[i] : b.bgs[0]));
      if (!b.bgs.includes(id)) return out;
      if (slot === "all") out.fill(id); else if (Number.isInteger(slot) && slot >= 0 && slot < SHOTS) out[slot] = id;
      return out;
    },
    // ブースで つかえる ことば（ブースの ことば → みんなの ことば）
    wordsOf(booth) { const b = BOOTH[booth] || BOOTHS[0]; return [...b.words, ...WORDS]; },
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
    // ブースを しらべた とき（館の 什器 photobooth。booth = ブースの id）
    async open(back, booth) {
      const s = st(), b = BOOTH[booth] || BOOTHS[0];
      if (s.active) { if (await UI.confirm("とちゅうだった ぷりくらが あるよ。\nおかねは はらわずに もういちど とる？", "もういちど とる", "やめる")) Game.goto("purikura", { back, booth: b.id }); return; }
      if (this.full()) { await UI.say([{ name: "ぷりくら", text: "すまほの しゃしんが いっぱい。\n「しゃしん」アプリで いらない しゃしんを けしてから きてね。" }]); return; }
      if (!(await UI.confirm(`${b.name} ぷりくら 1かい ${PRICE}コイン。\nはいけい: ${b.bgs.map((id) => BG[id].name).join("・")}\n4まい とって、ペンや スタンプで らくがき できるよ。とった しゃしんは すまほの「しゃしん」アプリで みられるよ。`, `${PRICE}コインで とる`, "やめる"))) return;
      if (!this.pay()) { UI.toast("コインが たりないよ"); return; }
      Game.goto("purikura", { back, booth: b.id });
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
    // ---- がっこう（ブース「がっこう」）----
    // きょうしつ: こくばん（チョークの らくがき・3人の にがおえ・にっちょく）・とけい・きの ゆか
    kyoshitsu: () => {
      const chs = `stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" opacity="0.92"`, ch = `fill="none" ${chs}`;
      return svg(300, 400, `<defs>${grad("pk-kyo", [[0, "#FFF4DA"], [1, "#F4DDB2"]])}</defs><rect width="300" height="400" fill="url(#pk-kyo)"/>
      <rect y="292" width="300" height="108" fill="#D9A46A"/>${[0, 1, 2, 3, 4].map((k) => `<path d="M0 ${304 + k * 20} H300" stroke="#C48C52" stroke-width="2"/>`).join("")}${[40, 130, 220].map((x, k) => `<path d="M${x + k * 12} 292 V400" stroke="#C48C52" stroke-width="1.6" opacity="0.6"/>`).join("")}
      <rect x="20" y="46" width="260" height="152" rx="6" fill="#B98552" stroke="${K}" stroke-width="3"/><rect x="30" y="56" width="240" height="130" rx="3" fill="#3E7A5C"/>
      <path d="M36 62 L120 62" stroke="#FFFFFF" stroke-width="3" opacity="0.08"/>
      <text x="112" y="104" font-size="30" font-weight="900" text-anchor="middle" fill="#FFFFFF" opacity="0.92" font-family="'M PLUS Rounded 1c',sans-serif">なかよし</text>
      <path d="M58 116 Q112 128 166 116" ${ch}/>
      <g transform="translate(60 152)"><circle r="14" ${ch}/><path d="M-12 -6 q-8 -10 -2 -14 M12 -6 q8 -10 2 -14" ${ch}/><circle cx="-5" cy="-2" r="1.4" fill="#FFFFFF"/><circle cx="5" cy="-2" r="1.4" fill="#FFFFFF"/><path d="M-4 5 q4 3 8 0" ${ch}/></g>
      <g transform="translate(100 152)"><circle r="13" ${ch}/><path d="M-3 2 L0 7 L3 2" ${ch}/><circle cx="-5" cy="-3" r="1.4" fill="#FFFFFF"/><circle cx="5" cy="-3" r="1.4" fill="#FFFFFF"/><path d="M-6 -13 q6 -6 12 0" ${ch}/></g>
      <g transform="translate(140 152)"><path d="M-13 12 Q-15 -14 0 -14 Q15 -14 13 12 Z" ${ch}/><path d="M-6 -14 l3 -6 l3 6 M2 -14 l3 -6 l3 6" ${ch}/><circle cx="-5" cy="-3" r="1.4" fill="#FFFFFF"/><circle cx="5" cy="-3" r="1.4" fill="#FFFFFF"/><path d="M-6 5 h12" ${ch}/></g>
      ${heart(196, 92, 9, "none", chs)}${star(232, 82, 10, "none", chs)}<path d="M200 128 q10 -12 20 0 t20 0" ${ch}/>
      <rect x="212" y="140" width="50" height="38" rx="3" ${ch}/><text x="237" y="155" font-size="9" font-weight="800" text-anchor="middle" fill="#FFFFFF" opacity="0.9" font-family="'M PLUS Rounded 1c',sans-serif">にっちょく</text><text x="237" y="172" font-size="11" font-weight="900" text-anchor="middle" fill="#FFE07A" font-family="'M PLUS Rounded 1c',sans-serif">わんこ</text>
      <rect x="26" y="194" width="248" height="9" rx="3" fill="#A87444" stroke="${K}" stroke-width="2"/>${[[70, "#FFFFFF"], [86, "#FFB3CF"], [102, "#FFE07A"]].map(([x, c]) => `<rect x="${x}" y="190" width="12" height="5" rx="2" fill="${c}" stroke="${K}" stroke-width="1"/>`).join("")}
      <circle cx="150" cy="24" r="15" fill="#FFFFFF" stroke="${K}" stroke-width="3"/><path d="M150 24 V14 M150 24 L157 28" stroke="${K}" stroke-width="2.4" stroke-linecap="round"/>
      ${[[6, 210], [246, 210]].map(([x, y]) => `<rect x="${x}" y="${y}" width="48" height="12" rx="2" fill="#E9C38E" stroke="${K}" stroke-width="2"/><path d="M${x + 6} ${y + 12} V${y + 70} M${x + 42} ${y + 12} V${y + 70}" stroke="#8C8C8C" stroke-width="3"/>`).join("")}`);
    },
    // ろうか: おくへ のびる ろうか（ひだりに まど・みぎに きょうしつの ドアと ふだ・てんじょうの あかり）
    rouka: () => {
      const L = (d, f) => { const yt = 120 * d, yb = 400 - 200 * d; return [110 * d, yt + f * (yb - yt)]; }, R = (d, f) => { const [x, y] = L(d, f); return [300 - x, y]; };
      const quad = (P, d0, d1, f0, f1, fill, extra = "") => { const a = P(d0, f0), b = P(d1, f0), c = P(d1, f1), e = P(d0, f1); return `<path d="M${f1v(a)} L${f1v(b)} L${f1v(c)} L${f1v(e)} Z" fill="${fill}" stroke="${K}" stroke-width="2" ${extra}/>`; };
      const f1v = ([x, y]) => `${f1(x)} ${f1(y)}`;
      return svg(300, 400, `<defs>${grad("pk-rousky", [[0, "#8FD0FF"], [1, "#E2F6FF"]])}</defs><rect width="300" height="400" fill="#EEF3EF"/>
      <path d="M0 0 L300 0 L190 120 L110 120 Z" fill="#FAFCFA"/><path d="M0 400 L110 200 L190 200 L300 400 Z" fill="#CDD8C6"/>
      ${[0.12, 0.38, 0.64].map((d) => { const a = L(d, 0), b = R(d, 0); return `<path d="M${f1(a[0] + 18 * (1 - d))} ${f1(a[1] + 8)} L${f1(b[0] - 18 * (1 - d))} ${f1(b[1] + 8)}" stroke="#FFFFFF" stroke-width="${f1(6 * (1 - d) + 2)}" stroke-linecap="round"/>`; }).join("")}
      ${[0.2, 0.5, 0.8].map((d) => { const a = L(d, 1), b = R(d, 1); return `<path d="M${f1v(a)} L${f1v(b)}" stroke="#B9C6B1" stroke-width="1.6"/>`; }).join("")}
      <path d="M150 400 L150 200" stroke="#E3EADF" stroke-width="10" opacity="0.6"/>
      <path d="M0 0 L110 120 L110 200 L0 400 Z" fill="#E1EAE3"/><path d="M300 0 L190 120 L190 200 L300 400 Z" fill="#E8EFE9"/>
      ${[[0.04, 0.3], [0.38, 0.62], [0.7, 0.9]].map(([d0, d1]) => quad(L, d0, d1, 0.18, 0.55, "url(#pk-rousky)") + (() => { const m = L((d0 + d1) / 2, 0.18), n = L((d0 + d1) / 2, 0.55); return `<path d="M${f1v(m)} L${f1v(n)}" stroke="${K}" stroke-width="1.6"/>`; })()).join("")}
      ${[[0.05, 0.3, "1-1"], [0.45, 0.66, "1-2"]].map(([d0, d1, t]) => { const dm = (d0 + d1) / 2, [px, py] = R(dm, 0.12), k = 1 - dm * 0.7, pw = 34 * k, ph = 15 * k; return quad(R, d0, d1, 0.2, 0.9, "#C69A6B") + quad(R, d0 + (d1 - d0) * 0.55, d1 - (d1 - d0) * 0.12, 0.32, 0.5, "#E6F4FF") + `<rect x="${f1(px - pw / 2)}" y="${f1(py - ph / 2)}" width="${f1(pw)}" height="${f1(ph)}" rx="3" fill="#FFFFFF" stroke="${K}" stroke-width="1.6"/><text x="${f1(px)}" y="${f1(py + ph * 0.32)}" font-size="${f1(11 * k)}" font-weight="900" text-anchor="middle" fill="${K}" font-family="'M PLUS Rounded 1c',sans-serif">${t}</text>`; }).join("")}
      <rect x="110" y="120" width="80" height="80" fill="#F4F7F3" stroke="${K}" stroke-width="2"/><rect x="124" y="132" width="52" height="40" fill="url(#pk-rousky)" stroke="${K}" stroke-width="1.6"/><path d="M150 132 V172" stroke="${K}" stroke-width="1.2"/>
      ${scatter(5, 21, (x, y) => `<ellipse cx="${f1(20 + (x % 70))}" cy="${f1(110 + (y % 60))}" rx="7" ry="2.6" fill="#FFFFFF" opacity="0.7"/>`)}`);
    },
    // たいいくかん: きの ゆか（コートの せん）・バスケットの ゴール・うえの まど・さんかくの はた
    taiiku: () => svg(300, 400, `<defs>${grad("pk-tai", [[0, "#F6EAD2"], [1, "#EBD6B0"]])}${grad("pk-taifl", [[0, "#E9BC7E"], [1, "#D49A57"]])}</defs><rect width="300" height="400" fill="url(#pk-tai)"/>
      <rect y="18" width="300" height="40" fill="#E4D2B0"/>${[0, 1, 2, 3, 4, 5].map((k) => `<rect x="${8 + k * 50}" y="22" width="40" height="30" rx="3" fill="#CFEFFF" stroke="${K}" stroke-width="2"/><path d="M${28 + k * 50} 22 V52" stroke="${K}" stroke-width="1.2"/>`).join("")}
      <path d="M0 66 Q75 84 150 66 Q225 84 300 66" fill="none" stroke="${K}" stroke-width="1.6"/>${Array.from({ length: 12 }, (_, k) => { const x = 12 + k * 25, y = 66 + Math.sin(((k + 0.5) / 12) * Math.PI * 2) * 0 + (k % 6 < 3 ? (k % 6) * 6 : (5 - (k % 6)) * 6) * 0.5; return `<path d="M${x - 8} ${f1(70 + Math.abs(Math.sin((k * Math.PI) / 6)) * 8)} L${x + 8} ${f1(70 + Math.abs(Math.sin((k * Math.PI) / 6)) * 8)} L${x} ${f1(86 + Math.abs(Math.sin((k * Math.PI) / 6)) * 8)} Z" fill="${["#FF7BA8", "#FFD84D", "#6FC7EF", "#7CCB6B"][k % 4]}" stroke="${K}" stroke-width="1.2"/>`; }).join("")}
      <rect x="112" y="98" width="76" height="52" rx="4" fill="#FFFFFF" stroke="${K}" stroke-width="3"/><rect x="134" y="118" width="32" height="24" fill="none" stroke="#FF6B6B" stroke-width="3"/>
      <ellipse cx="150" cy="152" rx="17" ry="5" fill="none" stroke="#F28C28" stroke-width="4"/>${[-12, -6, 0, 6, 12].map((dx) => `<path d="M${150 + dx} 154 L${150 + dx * 0.6} 178" stroke="#FFFFFF" stroke-width="1.6"/>`).join("")}<path d="M136 166 H164 M139 176 H161" stroke="#FFFFFF" stroke-width="1.2"/>
      <rect y="240" width="300" height="160" fill="url(#pk-taifl)"/>${[0, 1, 2, 3, 4, 5, 6].map((k) => `<path d="M0 ${252 + k * 22} H300" stroke="#C4884A" stroke-width="1.4" opacity="0.7"/>`).join("")}
      <path d="M0 300 H300" stroke="#FFFFFF" stroke-width="4"/><ellipse cx="150" cy="320" rx="70" ry="22" fill="none" stroke="#FFFFFF" stroke-width="4"/><path d="M60 240 Q150 280 240 240" fill="none" stroke="#FFE07A" stroke-width="4"/>
      <circle cx="54" cy="226" r="16" fill="#F28C28" stroke="${K}" stroke-width="2.4"/><path d="M38 226 H70 M54 210 V242 M42 214 Q54 226 42 238 M66 214 Q54 226 66 238" fill="none" stroke="${K}" stroke-width="1.6"/>`),
    // こうてい: さくらの 木・こうしゃ（とけい）・すなの こうてい・はなびら
    kotei: () => svg(300, 400, `<defs>${grad("pk-kot", [[0, "#AEE2FF"], [1, "#EAF8FF"]])}</defs><rect width="300" height="400" fill="url(#pk-kot)"/>
      ${[[70, 54, 30], [236, 38, 24]].map(([x, y, r]) => `<g fill="#FFFFFF" opacity="0.85"><ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.42}"/><ellipse cx="${x - r * 0.5}" cy="${y + 4}" rx="${r * 0.6}" ry="${r * 0.34}"/><ellipse cx="${x + r * 0.5}" cy="${y + 4}" rx="${r * 0.55}" ry="${r * 0.3}"/></g>`).join("")}
      <rect x="40" y="118" width="220" height="132" fill="#FFFDF7" stroke="${K}" stroke-width="3"/><path d="M30 118 L150 92 L270 118 Z" fill="#E8D7C4" stroke="${K}" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="150" cy="112" r="11" fill="#FFFFFF" stroke="${K}" stroke-width="2.4"/><path d="M150 112 V105 M150 112 L155 114" stroke="${K}" stroke-width="1.8" stroke-linecap="round"/>
      ${[0, 1, 2].map((j) => [0, 1, 2, 3, 4, 5, 6].map((i) => `<rect x="${52 + i * 29}" y="${130 + j * 36}" width="20" height="22" rx="2" fill="#BFE6FF" stroke="${K}" stroke-width="1.6"/>`).join("")).join("")}
      <rect x="132" y="216" width="36" height="34" fill="#C69A6B" stroke="${K}" stroke-width="2.4"/><path d="M150 216 V250" stroke="${K}" stroke-width="1.6"/>
      <rect y="250" width="300" height="150" fill="#E8D3A8"/><path d="M0 250 H300" stroke="${K}" stroke-width="2"/><ellipse cx="150" cy="330" rx="120" ry="30" fill="none" stroke="#FFFFFF" stroke-width="3" opacity="0.8"/>
      ${[[18, 1], [282, -1]].map(([x, s]) => `<path d="M${x} 300 L${x + s * 6} 180" stroke="#8B5E3C" stroke-width="12" stroke-linecap="round"/><path d="M${x + s * 4} 220 L${x + s * 26} 190" stroke="#8B5E3C" stroke-width="6" stroke-linecap="round"/>${[[0, 150, 40], [s * 30, 170, 30], [s * -14, 186, 28], [s * 38, 132, 26], [s * 8, 112, 26]].map(([dx, y, r]) => `<circle cx="${x + dx}" cy="${y}" r="${r}" fill="#FFC6DA" stroke="${K}" stroke-width="2"/>`).join("")}${[[s * 10, 148], [s * 30, 168], [s * -6, 176], [s * 24, 128]].map(([dx, y]) => `<g transform="translate(${x + dx} ${y})">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-3.4" rx="2.2" ry="3.4" fill="#FFFFFF" transform="rotate(${a})"/>`).join("")}</g>`).join("")}`).join("")}
      ${scatter(26, 13, (x, y, r) => `<ellipse cx="${f1(x)}" cy="${f1(y * 0.9 + 20)}" rx="3.4" ry="2.2" fill="#FFB3CF" transform="rotate(${f1(r * 180)} ${f1(x)} ${f1(y * 0.9 + 20)})"/>`)}`),
    // おくじょう: おおきな あおぞら・とおくの まち・みどりの フェンス・かみひこうき
    okujo: () => svg(300, 400, `<defs>${grad("pk-oku", [[0, "#6EC3FF"], [0.7, "#CDEBFF"], [1, "#F2FAFF"]])}</defs><rect width="300" height="400" fill="url(#pk-oku)"/>
      ${[[64, 70, 40], [220, 50, 34], [170, 120, 26]].map(([x, y, r]) => `<g fill="#FFFFFF" opacity="0.9"><ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.42}"/><ellipse cx="${x - r * 0.5}" cy="${y + 5}" rx="${r * 0.62}" ry="${r * 0.34}"/><ellipse cx="${x + r * 0.52}" cy="${y + 5}" rx="${r * 0.56}" ry="${r * 0.3}"/></g>`).join("")}
      ${[[0, 238, 30, 42], [32, 226, 26, 54], [60, 244, 34, 36], [100, 232, 22, 48], [126, 246, 40, 34], [170, 222, 26, 58], [200, 240, 36, 40], [240, 230, 24, 50], [266, 244, 34, 36]].map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h + 20}" fill="#B9D3E6"/>${[0, 1, 2].map((j) => `<rect x="${x + 5}" y="${y + 8 + j * 14}" width="${w - 10}" height="5" fill="#DDEBF5"/>`).join("")}`).join("")}
      <path d="M210 92 l30 -10 l-14 16 Z" fill="#FFFFFF" stroke="${K}" stroke-width="2" stroke-linejoin="round"/><path d="M226 98 l-4 8" stroke="${K}" stroke-width="2"/>
      ${[[90, 30], [108, 40]].map(([x, y]) => `<path d="M${x - 7} ${y} q3.5 -5 7 0 q3.5 -5 7 0" fill="none" stroke="${K}" stroke-width="2" stroke-linecap="round"/>`).join("")}
      <rect x="0" y="198" width="300" height="104" fill="none"/>${Array.from({ length: 16 }, (_, i) => `<path d="M${i * 20 - 50} 200 L${i * 20 + 50} 300 M${i * 20 + 50} 200 L${i * 20 - 50} 300" stroke="#5FAE6E" stroke-width="1.6" opacity="0.75"/>`).join("")}
      <path d="M0 198 H300 M0 300 H300" stroke="#3F8A4E" stroke-width="5"/>${[10, 80, 150, 220, 290].map((x) => `<path d="M${x} 190 V306" stroke="#3F8A4E" stroke-width="6" stroke-linecap="round"/>`).join("")}
      <rect y="306" width="300" height="94" fill="#CBD2D6"/>${[0, 1, 2].map((k) => `<path d="M0 ${330 + k * 26} H300" stroke="#B5BDC2" stroke-width="2"/>`).join("")}
      <rect x="8" y="132" width="44" height="58" rx="10" fill="#E8EDF0" stroke="${K}" stroke-width="2.4"/><path d="M8 150 H52 M8 170 H52" stroke="#B5BDC2" stroke-width="2"/><path d="M14 190 V200 M46 190 V200" stroke="${K}" stroke-width="3"/>`),
    // としょしつ: いろとりどりの 本の たな・まどの ひかり・ちきゅうぎ・「しずかに ね」
    toshokan: () => {
      let books = "";
      const shelf = (x0, y0, w, rows, seed) => { let a = seed, s = `<rect x="${x0 - 6}" y="${y0 - 8}" width="${w + 12}" height="${rows * 48 + 10}" fill="#B07A4C" stroke="${K}" stroke-width="2.4"/>`; const r = () => ((a = (a * 1103515245 + 12345) >>> 0) / 4294967296);
        for (let j = 0; j < rows; j++) { const y = y0 + j * 48; s += `<rect x="${x0}" y="${y}" width="${w}" height="40" fill="#7A4E2C"/>`; let x = x0 + 2; while (x < x0 + w - 8) { const bw = 7 + Math.floor(r() * 7), bh = 26 + Math.floor(r() * 12), c = ["#FF7BA8", "#FFD84D", "#6FC7EF", "#7CCB6B", "#B79BEA", "#F28C5B", "#FFFFFF"][Math.floor(r() * 7)]; s += `<rect x="${x}" y="${y + 40 - bh}" width="${bw}" height="${bh}" rx="1.5" fill="${c}" stroke="${K}" stroke-width="1"/>`; x += bw + 1; } s += `<rect x="${x0 - 6}" y="${y + 40}" width="${w + 12}" height="6" fill="#C4925E" stroke="${K}" stroke-width="1.4"/>`; }
        return s; };
      books = shelf(10, 70, 86, 6, 3) + shelf(204, 70, 86, 6, 9);
      return svg(300, 400, `<defs>${grad("pk-tos", [[0, "#FBEFD8"], [1, "#F1DDBA"]])}${grad("pk-tossun", [[0, "#FFF6C8"], [1, "#FFF6C800"]])}</defs><rect width="300" height="400" fill="url(#pk-tos)"/>
        <rect x="112" y="40" width="76" height="96" rx="38" fill="#CFEFFF" stroke="${K}" stroke-width="3"/><path d="M150 40 V136 M112 92 H188" stroke="${K}" stroke-width="2"/><path d="M112 136 L60 400 L240 400 L188 136 Z" fill="url(#pk-tossun)" opacity="0.5"/>
        ${books}
        <rect y="364" width="300" height="36" fill="#C99A68"/><path d="M0 364 H300" stroke="${K}" stroke-width="2"/>
        <rect x="114" y="150" width="72" height="26" rx="6" fill="#FFFFFF" stroke="${K}" stroke-width="2"/><text x="150" y="168" font-size="12" font-weight="900" text-anchor="middle" fill="#4E8B56" font-family="'M PLUS Rounded 1c',sans-serif">しずかに ね</text>
        <circle cx="52" cy="46" r="16" fill="#6FC7EF" stroke="${K}" stroke-width="2.4"/><path d="M40 40 q8 -6 14 2 q6 8 12 2 M42 54 q8 2 12 -4" fill="none" stroke="#7CCB6B" stroke-width="4" stroke-linecap="round"/><path d="M52 62 V68 M44 68 H60" stroke="${K}" stroke-width="2.4"/>`);
    },
    // ---- おでかけ（ブース「おでかけ」）----
    // ゆうえんち: かんらんしゃ・サーカスの テント・ふうせん・はた
    yuenchi: () => {
      const cx = 208, cy = 146, R = 92, n = 10;
      const spokes = Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2; return `<path d="M${cx} ${cy} L${f1(cx + Math.cos(a) * R)} ${f1(cy + Math.sin(a) * R)}" stroke="#F2A7C0" stroke-width="2"/>`; }).join("");
      const cabs = Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2, x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R; return `<rect x="${f1(x - 9)}" y="${f1(y - 2)}" width="18" height="16" rx="5" fill="${["#FF7BA8", "#FFD84D", "#6FC7EF", "#7CCB6B", "#B79BEA"][i % 5]}" stroke="${K}" stroke-width="1.6"/><path d="M${f1(x)} ${f1(y - 2)} V${f1(y - 6)}" stroke="${K}" stroke-width="1.4"/>`; }).join("");
      return svg(300, 400, `<defs>${grad("pk-yue", [[0, "#FFD3EA"], [0.6, "#D9EEFF"], [1, "#F0F9FF"]])}</defs><rect width="300" height="400" fill="url(#pk-yue)"/>
        <path d="M${cx} ${cy} L${cx - 54} 330 M${cx} ${cy} L${cx + 54} 330" stroke="#B6A2D8" stroke-width="7" stroke-linecap="round"/>
        <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#F29BB8" stroke-width="5"/><circle cx="${cx}" cy="${cy}" r="${R - 12}" fill="none" stroke="#FFD1E2" stroke-width="2"/>${spokes}${cabs}<circle cx="${cx}" cy="${cy}" r="10" fill="#FFE07A" stroke="${K}" stroke-width="2"/>
        <path d="M14 260 L66 196 L118 260 Z" fill="#FFFFFF" stroke="${K}" stroke-width="2.6" stroke-linejoin="round"/>${[0, 1, 2].map((k) => `<path d="M${66 - 8 + k * 0} 196 L${28 + k * 30} 260 L${42 + k * 30} 260 Z" fill="#FF6B7A"/>`).join("")}<path d="M14 260 L66 196 L118 260" fill="none" stroke="${K}" stroke-width="2.6" stroke-linejoin="round"/><rect x="20" y="260" width="92" height="40" fill="#FFF1F6" stroke="${K}" stroke-width="2.4"/><path d="M58 300 Q66 276 74 300" fill="#2A2238"/><path d="M66 196 V178" stroke="${K}" stroke-width="2"/><path d="M66 178 l14 5 l-14 5 Z" fill="#FFD84D" stroke="${K}" stroke-width="1.4"/>
        ${[[32, 70, "#FF7BA8"], [54, 52, "#6FC7EF"], [78, 76, "#FFD84D"]].map(([x, y, c]) => `<path d="M${x} ${y + 22} Q${x - 6} ${y + 50} ${x + 4} ${y + 80}" fill="none" stroke="${K}" stroke-width="1.4"/><ellipse cx="${x}" cy="${y}" rx="15" ry="19" fill="${c}" stroke="${K}" stroke-width="2"/><ellipse cx="${x - 5}" cy="${y - 7}" rx="3.4" ry="5" fill="#FFFFFF" opacity="0.7"/>`).join("")}
        <path d="M0 330 Q150 318 300 330 L300 400 L0 400 Z" fill="#BFE3A8"/>`);
    },
    // おまつり: よるの そら・はなび・ちょうちん・やたい（わたあめ・きんぎょ）
    matsuri: () => {
      const burst = (x, y, r, c) => Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2; return `<path d="M${f1(x + Math.cos(a) * r * 0.3)} ${f1(y + Math.sin(a) * r * 0.3)} L${f1(x + Math.cos(a) * r)} ${f1(y + Math.sin(a) * r)}" stroke="${c}" stroke-width="2.6" stroke-linecap="round"/><circle cx="${f1(x + Math.cos(a) * r * 1.08)}" cy="${f1(y + Math.sin(a) * r * 1.08)}" r="2" fill="${c}"/>`; }).join("");
      const lantern = (x, y, c) => `<path d="M${x} ${y - 14} V${y - 9}" stroke="${K}" stroke-width="1.4"/><rect x="${x - 9}" y="${y - 10}" width="18" height="4" rx="1" fill="${K}"/><ellipse cx="${x}" cy="${y + 6}" rx="12" ry="15" fill="${c}" stroke="${K}" stroke-width="1.8"/><path d="M${x - 12} ${y + 2} H${x + 12} M${x - 11} ${y + 10} H${x + 11}" stroke="${K}" stroke-width="0.9" opacity="0.5"/><rect x="${x - 9}" y="${y + 19}" width="18" height="4" rx="1" fill="${K}"/>`;
      return svg(300, 400, `<defs>${grad("pk-mat", [[0, "#151A4A"], [0.7, "#352B6C"], [1, "#5B3E7E"]])}</defs><rect width="300" height="400" fill="url(#pk-mat)"/>
        ${scatter(30, 17, (x, y, r) => `<circle cx="${f1(x)}" cy="${f1(y * 0.55)}" r="${f1(0.8 + r)}" fill="#FFFFFF" opacity="${f1(0.4 + r * 0.5)}"/>`)}
        ${burst(78, 92, 46, "#FF8FB8")}${burst(214, 70, 54, "#FFE07A")}${burst(160, 150, 30, "#7FD3F0")}
        <path d="M0 196 Q75 222 150 200 Q225 178 300 204" fill="none" stroke="${K}" stroke-width="1.6"/>${[[20, 202, "#FF6B6B"], [64, 214, "#FFFFFF"], [108, 210, "#FF6B6B"], [150, 200, "#FFFFFF"], [194, 192, "#FF6B6B"], [238, 192, "#FFFFFF"], [282, 200, "#FF6B6B"]].map(([x, y, c]) => lantern(x, y + 14, c)).join("")}
        ${[[0, 290, "わたあめ", "#FFB3CF"], [196, 290, "きんぎょ", "#7FD3F0"]].map(([x, y, t, c]) => `<rect x="${x}" y="${y}" width="104" height="110" fill="#8C5A3C" stroke="${K}" stroke-width="2.4"/><path d="M${x - 6} ${y} L${x + 110} ${y} L${x + 100} ${y - 22} L${x + 4} ${y - 22} Z" fill="#FFFFFF" stroke="${K}" stroke-width="2.4" stroke-linejoin="round"/>${[0, 1, 2, 3, 4].map((k) => `<path d="M${x + 4 + k * 21} ${y - 22} L${x - 6 + k * 23} ${y} L${x + 5 + k * 23} ${y} L${x + 14 + k * 21} ${y - 22} Z" fill="#FF6B6B"/>`).join("")}<rect x="${x + 14}" y="${y + 12}" width="76" height="24" rx="4" fill="${c}" stroke="${K}" stroke-width="2"/><text x="${x + 52}" y="${y + 30}" font-size="14" font-weight="900" text-anchor="middle" fill="${K}" font-family="'M PLUS Rounded 1c',sans-serif">${t}</text>`).join("")}`);
    },
    // カフェ: しましまの かべ・まるい まどと カーテン・ランプ・ケーキの ショーケース・メニュー
    cafe: () => svg(300, 400, `<rect width="300" height="400" fill="#FFF7EC"/>${Array.from({ length: 10 }, (_, k) => `<rect x="${k * 30}" y="0" width="15" height="300" fill="#DDF3EA"/>`).join("")}
      <rect x="86" y="44" width="128" height="140" rx="64" fill="#CDEBFF" stroke="${K}" stroke-width="3"/><path d="M150 44 V184 M86 120 H214" stroke="${K}" stroke-width="2"/>
      <path d="M78 40 Q92 110 84 192 L104 192 Q100 110 112 40 Z" fill="#FFB3CF" stroke="${K}" stroke-width="2.2"/><path d="M222 40 Q208 110 216 192 L196 192 Q200 110 188 40 Z" fill="#FFB3CF" stroke="${K}" stroke-width="2.2"/><rect x="70" y="32" width="160" height="10" rx="5" fill="#C69A6B" stroke="${K}" stroke-width="2"/>
      ${[40, 260].map((x) => `<path d="M${x} 0 V36" stroke="${K}" stroke-width="1.6"/><path d="M${x - 16} 52 Q${x} 30 ${x + 16} 52 Z" fill="#FFE07A" stroke="${K}" stroke-width="2"/><circle cx="${x}" cy="56" r="5" fill="#FFF6C8"/>`).join("")}
      <rect x="10" y="70" width="58" height="76" rx="4" fill="#3E5E52" stroke="#B98552" stroke-width="5"/><text x="39" y="92" font-size="10" font-weight="900" text-anchor="middle" fill="#FFFFFF" font-family="'M PLUS Rounded 1c',sans-serif">きょうの</text><text x="39" y="106" font-size="10" font-weight="900" text-anchor="middle" fill="#FFFFFF" font-family="'M PLUS Rounded 1c',sans-serif">おすすめ</text><path d="M28 116 h22 l-4 16 h-14 Z" fill="#FFB3CF" stroke="#FFFFFF" stroke-width="1.4"/><circle cx="39" cy="114" r="5" fill="#FF6B7A"/>
      <rect x="230" y="96" width="62" height="12" rx="3" fill="#C69A6B" stroke="${K}" stroke-width="2"/>${[0, 1, 2].map((k) => `<path d="M${238 + k * 18} 96 q0 -14 8 -14 q8 0 8 14 Z" fill="${["#FFFFFF", "#FFE07A", "#B79BEA"][k]}" stroke="${K}" stroke-width="1.6"/>`).join("")}
      <rect y="300" width="300" height="100" fill="#E8C9A4"/><rect x="0" y="230" width="300" height="76" fill="#FFFFFF" stroke="${K}" stroke-width="2.4"/><rect x="8" y="238" width="284" height="56" fill="#E9F7FF" opacity="0.8"/><path d="M8 266 H292" stroke="${K}" stroke-width="1.4"/>
      ${[[24, 262, "#FFFFFF", "#FF6B7A"], [64, 262, "#F7C98A", "#7A4E2C"], [104, 262, "#FFB3CF", "#FF6B7A"], [196, 262, "#FFFFFF", "#6FC7EF"], [236, 262, "#F7C98A", "#FFD84D"], [272, 262, "#B79BEA", "#FFFFFF"]].map(([x, y, c, t]) => `<path d="M${x - 12} ${y} L${x + 12} ${y} L${x + 12} ${y - 14} L${x - 12} ${y - 20} Z" fill="${c}" stroke="${K}" stroke-width="1.6"/><path d="M${x - 12} ${y - 20} L${x + 12} ${y - 14}" stroke="${t}" stroke-width="3"/><circle cx="${x + 4}" cy="${y - 22}" r="4" fill="#FF6B7A" stroke="${K}" stroke-width="1"/>`).join("")}
      ${[[132, 290], [150, 290], [168, 290], [141, 280], [159, 280]].map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="8" ry="5" fill="${["#FFB3CF", "#BDE7C5", "#FFE07A", "#C9B6EE", "#9FD3F0"][i]}" stroke="${K}" stroke-width="1.4"/><path d="M${x - 8} ${y} H${x + 8}" stroke="#FFFFFF" stroke-width="1.6"/>`).join("")}`),
    // すいぞくかん: あおい 水そう・ひかりの すじ・さかな・くらげ・あわ・さんご
    suizoku: () => {
      const fish = (x, y, s, c, dir = 1) => `<g transform="translate(${x} ${y}) scale(${dir * s} ${s})"><path d="M-14 0 Q-4 -10 10 0 Q-4 10 -14 0 Z" fill="${c}" stroke="${K}" stroke-width="1.6"/><path d="M-14 0 L-22 -7 L-22 7 Z" fill="${c}" stroke="${K}" stroke-width="1.6" stroke-linejoin="round"/><circle cx="4" cy="-2" r="1.6" fill="${K}"/></g>`;
      const jelly = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})" opacity="0.85"><path d="M-14 0 Q-14 -16 0 -16 Q14 -16 14 0 Z" fill="#FFD1E8" stroke="#FFFFFF" stroke-width="1.6"/>${[-9, -3, 3, 9].map((dx) => `<path d="M${dx} 0 q3 8 0 16 q-3 8 0 14" fill="none" stroke="#FFD1E8" stroke-width="1.6"/>`).join("")}</g>`;
      return svg(300, 400, `<defs>${grad("pk-sui", [[0, "#4FB3E8"], [0.6, "#1F78B8"], [1, "#0E4E86"]])}${grad("pk-suiray", [[0, "#FFFFFF66"], [1, "#FFFFFF00"]])}</defs><rect width="300" height="400" fill="url(#pk-sui)"/>
        ${[[40, 90], [130, 200], [210, 260]].map(([a, b]) => `<path d="M${a} 0 L${a + 40} 0 L${b + 30} 400 L${b - 20} 400 Z" fill="url(#pk-suiray)"/>`).join("")}
        <path d="M0 0 H300" stroke="#BFE9FF" stroke-width="6" opacity="0.6"/>
        ${fish(60, 80, 1.3, "#FFD84D")}${fish(110, 60, 0.9, "#FF8FB8", -1)}${fish(220, 120, 1.5, "#7FD3F0")}${fish(250, 70, 0.8, "#FFB25B", -1)}${fish(170, 180, 1.1, "#B79BEA")}${fish(40, 170, 0.8, "#7CCB6B", -1)}
        ${jelly(150, 60, 1)}${jelly(270, 200, 0.8)}${jelly(26, 250, 0.7)}
        <path d="M150 112 C170 100 200 104 214 116 C200 120 186 124 176 136 C170 128 160 122 150 112 Z" fill="#9FC7E0" stroke="${K}" stroke-width="1.6" opacity="0.8"/>
        ${scatter(18, 31, (x, y, r) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(2 + r * 4)}" fill="none" stroke="#FFFFFF" stroke-width="1.4" opacity="0.7"/>`)}
        <path d="M0 360 Q40 340 80 356 Q130 372 170 352 Q220 334 300 356 L300 400 L0 400 Z" fill="#E9D7B0"/>
        ${[[24, 360, "#FF8FB8"], [60, 366, "#FFB25B"], [250, 358, "#FF8FB8"], [280, 364, "#B79BEA"]].map(([x, y, c]) => `<path d="M${x} ${y} q-6 -22 -2 -34 M${x} ${y} q4 -18 12 -26 M${x} ${y} q-14 -10 -18 -22" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round"/>`).join("")}
        ${[[100, 362], [200, 358]].map(([x, y]) => `<path d="M${x} ${y} q-4 -30 4 -60 q6 20 -4 60 M${x + 10} ${y} q6 -24 -2 -48" fill="none" stroke="#5FAE6E" stroke-width="4" stroke-linecap="round"/>`).join("")}`);
    },
    // うちゅう: ほしぞら・わの ある わくせい・つき・ロケット・UFO・ながれぼし
    uchu: () => svg(300, 400, `<defs>${grad("pk-uch", [[0, "#0E0B33"], [0.6, "#24185C"], [1, "#3B2478"]])}${grad("pk-uchpl", [[0, "#FFC6A8"], [1, "#F28C8C"]], false)}</defs><rect width="300" height="400" fill="url(#pk-uch)"/>
      ${scatter(60, 23, (x, y, r, i) => (i % 6 ? `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(0.7 + r * 1.5)}" fill="#FFFFFF" opacity="${f1(0.5 + r * 0.5)}"/>` : star(x, y, 3 + r * 4, "#FFE07A")))}
      <ellipse cx="226" cy="84" rx="62" ry="15" fill="none" stroke="#FFE7A8" stroke-width="5" transform="rotate(-16 226 84)"/><circle cx="226" cy="84" r="38" fill="url(#pk-uchpl)" stroke="${K}" stroke-width="2.4"/><path d="M196 76 Q226 66 256 78 M192 92 Q226 100 260 90" fill="none" stroke="#FFFFFF" stroke-width="3" opacity="0.5"/><path d="M168 98 A62 15 -16 0 0 284 66" fill="none" stroke="#FFE7A8" stroke-width="5" transform="rotate(0)"/>
      <circle cx="62" cy="62" r="26" fill="#FFF3B0" stroke="${K}" stroke-width="2.4"/>${[[54, 54, 5], [70, 68, 4], [58, 74, 3]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#F2DE8A"/>`).join("")}
      <g transform="translate(58 196) rotate(-30)"><path d="M0 -38 Q14 -20 14 12 L-14 12 Q-14 -20 0 -38 Z" fill="#FFFFFF" stroke="${K}" stroke-width="2.4"/><circle cx="0" cy="-12" r="6" fill="#7FD3F0" stroke="${K}" stroke-width="2"/><path d="M-14 0 L-24 16 L-14 12 Z M14 0 L24 16 L14 12 Z" fill="#FF7BA8" stroke="${K}" stroke-width="2" stroke-linejoin="round"/><path d="M-8 12 Q0 34 8 12 Z" fill="#FFB25B"/><path d="M-4 12 Q0 24 4 12 Z" fill="#FFE07A"/></g>
      <g transform="translate(236 210)"><ellipse rx="28" ry="9" fill="#C9B6EE" stroke="${K}" stroke-width="2"/><path d="M-14 -4 Q0 -24 14 -4 Z" fill="#BFE9FF" stroke="${K}" stroke-width="2"/>${[-16, 0, 16].map((x) => `<circle cx="${x}" cy="2" r="2.4" fill="#FFE07A"/>`).join("")}</g>
      <path d="M120 140 L190 112" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" opacity="0.8"/>${star(192, 111, 6, "#FFFFFF")}`),
    // おしろ: パステルの そら・にじ・おとぎの おしろ・くも・きらきら
    oshiro: () => {
      const tower = (x, top, w, roof) => `<rect x="${x - w / 2}" y="${top}" width="${w}" height="${250 - top}" fill="#FFF6FB" stroke="${K}" stroke-width="2.4"/><path d="M${x - w / 2 - 6} ${top} L${x} ${top - w * 1.3} L${x + w / 2 + 6} ${top} Z" fill="${roof}" stroke="${K}" stroke-width="2.4" stroke-linejoin="round"/><path d="M${x} ${top - w * 1.3} V${top - w * 1.3 - 16}" stroke="${K}" stroke-width="1.6"/><path d="M${x} ${top - w * 1.3 - 16} l12 4 l-12 4 Z" fill="#FFE07A" stroke="${K}" stroke-width="1.2"/><rect x="${x - 5}" y="${top + 16}" width="10" height="14" rx="5" fill="#CDEBFF" stroke="${K}" stroke-width="1.6"/>`;
      return svg(300, 400, `<defs>${grad("pk-osh", [[0, "#FFE1F0"], [0.6, "#EAE2FF"], [1, "#F8F4FF"]])}</defs><rect width="300" height="400" fill="url(#pk-osh)"/>
        ${["#FF9EC4", "#FFD84D", "#9EE3B5", "#9FD3F0", "#C9B6EE"].map((c, i) => `<path d="M${-10 + i * 10} 250 A${160 - i * 10} ${150 - i * 10} 0 0 1 ${310 - i * 10} 250" fill="none" stroke="${c}" stroke-width="10" opacity="0.75"/>`).join("")}
        ${tower(72, 150, 34, "#C9B6EE")}${tower(228, 150, 34, "#C9B6EE")}${tower(118, 118, 30, "#FF9EC4")}${tower(182, 118, 30, "#FF9EC4")}${tower(150, 86, 42, "#B79BEA")}
        <rect x="88" y="176" width="124" height="74" fill="#FFF6FB" stroke="${K}" stroke-width="2.4"/>${[100, 116, 132, 148, 164, 180, 196].map((x) => `<rect x="${x - 4}" y="168" width="10" height="10" fill="#FFF6FB" stroke="${K}" stroke-width="1.8"/>`).join("")}
        <path d="M134 250 V218 Q150 198 166 218 V250 Z" fill="#E59BBB" stroke="${K}" stroke-width="2.4"/>${heart(150, 196, 7, "#FF7BA8", `stroke="${K}" stroke-width="1.4"`)}
        ${[[40, 262, 50], [150, 272, 64], [262, 262, 50]].map(([x, y, r]) => `<g fill="#FFFFFF"><ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.36}"/><ellipse cx="${x - r * 0.5}" cy="${y + 8}" rx="${r * 0.6}" ry="${r * 0.32}"/><ellipse cx="${x + r * 0.5}" cy="${y + 8}" rx="${r * 0.56}" ry="${r * 0.3}"/></g>`).join("")}
        <rect y="282" width="300" height="118" fill="#F6E9FF"/>
        ${scatter(18, 41, (x, y, r, i) => (i % 2 ? star(x, y * 0.6, 3 + r * 4, "#FFE07A") : heart(x, y * 0.6, 3 + r * 3, "#FFB3CF")))}`);
    },
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
    // ---- かおの スタンプ（UI-25）。はんてん（⇆）で みぎ・ひだりを かえられる ----
    // ほっぺ: ふんわり ピンクと ななめの せん
    hoppe: () => S(`<ellipse cx="32" cy="33" rx="27" ry="17" fill="#FFB3C9" opacity="0.55"/><ellipse cx="32" cy="33" rx="20" ry="12" fill="#FF8FB1" opacity="0.6"/>${[15, 25, 35, 45].map((x) => `<path d="M${x} 42 L${x + 7} 24" stroke="#F0578D" stroke-width="3.2" stroke-linecap="round"/>`).join("")}<ellipse cx="21" cy="27" rx="4.5" ry="2.6" fill="#FFFFFF" opacity="0.85" transform="rotate(-18 21 27)"/>`),
    // まつげ: うわまぶたの せんと くるんと あがった まつげ（パーマ）・きらり
    matsuge: () => S(`<path d="M5 46 Q27 24 58 37" fill="none" stroke="${K}" stroke-width="6" stroke-linecap="round"/>` +
      [[16, 38, 11, 28, 13, 19, 19, 15], [26, 33, 22, 22, 27, 13, 34, 11], [37, 31, 37, 20, 43, 13, 50, 13], [47, 33, 51, 24, 57, 20, 62, 22]].map(([x0, y0, a, b, c, d, x1, y1]) => `<path d="M${x0} ${y0} C${a} ${b} ${c} ${d} ${x1} ${y1}" fill="none" stroke="${K}" stroke-width="3.8" stroke-linecap="round"/>`).join("") +
      `<path d="M14 57 l2 -6 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2 Z" fill="#FFE07A" stroke="${K}" stroke-width="1.6" stroke-linejoin="round" transform="translate(0 -6)"/>`),
    // なみだ: おおきい しずくと ちいさい しずく
    namida: () => S(drop(24, 6, 44, "#8FD3FF") + drop(47, 30, 24, "#B5E3FF") + `<ellipse cx="19" cy="38" rx="3.2" ry="6" fill="#FFFFFF" opacity="0.85" transform="rotate(14 19 38)"/><ellipse cx="44" cy="45" rx="2" ry="3.4" fill="#FFFFFF" opacity="0.85"/>`),
    // くしゃみ: はなの ほうから ぶわっと でる しぶき・くもに「くしゅん」（もじは 端末の まるい ゴシック）
    kushami: () => S(`<path d="M2 26 L12 29 M1 34 L12 34 M2 42 L12 39" stroke="#6FC7EF" stroke-width="2.6" stroke-linecap="round"/>` +
      [[15, 22, 2.6], [10, 47, 2.2], [18, 52, 1.8], [6, 18, 1.6], [20, 16, 1.6]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#8FD3FF" stroke="${K}" stroke-width="1.3"/>`).join("") +
      `<path d="M26 16 C30 8 42 8 46 15 C55 12 62 21 58 29 C64 35 60 46 51 45 C49 54 37 56 33 49 C25 54 15 48 18 40 C11 37 12 26 19 25 C18 19 21 16 26 16 Z" fill="#FFFFFF" ${st}/>` +
      `<text x="39" y="35" font-size="10" font-weight="900" text-anchor="middle" fill="#F0578D" font-family="'M PLUS Rounded 1c','Hiragino Maru Gothic ProN','Hiragino Sans','Yu Gothic','Noto Sans JP',sans-serif">くしゅん</text>`),
    // ねこひげ: ピンクの はな・ω の くち・りょうがわに 3本ずつ
    hige: () => S(`<path d="M26 24 Q32 19 38 24 Q37 31 32 32 Q27 31 26 24 Z" fill="#FF8FB1" ${st}/><path d="M23 37 Q27.5 43 32 37 Q36.5 43 41 37" fill="none" stroke="${K}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>` +
      [[21, 29, 3, 23], [21, 33, 2, 34], [22, 37, 4, 44]].map(([x0, y0, x1, y1]) => `<path d="M${x0} ${y0} L${x1} ${y1} M${64 - x0} ${y0} L${64 - x1} ${y1}" stroke="${K}" stroke-width="2.6" stroke-linecap="round"/>`).join("")),
    // あせ: ななめの おおきい しずくと ちいさい せん
    ase: () => S(`<g transform="rotate(16 34 34)">${drop(34, 4, 54, "#9EE3FF")}<ellipse cx="28" cy="40" rx="3.6" ry="8" fill="#FFFFFF" opacity="0.85" transform="rotate(10 28 40)"/></g><path d="M10 14 q4 4 2 10 M4 24 q4 3 3 8" fill="none" stroke="#6FC7EF" stroke-width="3" stroke-linecap="round"/>`),
    // ねこみみ: カチューシャ と ピンクの みみ
    nekomimi: () => S(`<path d="M5 57 Q32 37 59 57" fill="none" stroke="${K}" stroke-width="9" stroke-linecap="round"/><path d="M5 57 Q32 37 59 57" fill="none" stroke="#B79BEA" stroke-width="4.5" stroke-linecap="round"/>` +
      [false, true].map((m) => `<g${m ? ' transform="matrix(-1 0 0 1 64 0)"' : ""}><path d="M8 50 L12 9 L33 41 Z" fill="#FFFFFF" ${st}/><path d="M14 43 L16 20 L27 38 Z" fill="#FF9EBB"/></g>`).join("")),
    // てんしの わ: きんいろの わっか と きらり
    wakka: () => S(`<ellipse cx="32" cy="36" rx="27" ry="10.5" fill="none" stroke="${K}" stroke-width="10.5"/><ellipse cx="32" cy="36" rx="27" ry="10.5" fill="none" stroke="#FFE07A" stroke-width="5.5"/><path d="M12 33 Q20 27.5 31 26.5" fill="none" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round"/>${star(52, 14, 8, "#FFFFFF", st.replace('stroke-width="3"', 'stroke-width="2"'))}${star(12, 16, 5, "#FFE07A", st.replace('stroke-width="3"', 'stroke-width="1.6"'))}`),
  };
  // しずく（とがった ところが うえ・まるい そこ）
  function drop(x, y, h, fill) {
    const r = h * 0.38, cy = y + h - r;
    return `<path d="M${f1(x)} ${f1(y)} C${f1(x + r * 0.35)} ${f1(y + h * 0.3)} ${f1(x + r)} ${f1(cy - r * 0.7)} ${f1(x + r)} ${f1(cy)} A${f1(r)} ${f1(r)} 0 0 1 ${f1(x - r)} ${f1(cy)} C${f1(x - r)} ${f1(cy - r * 0.7)} ${f1(x - r * 0.35)} ${f1(y + h * 0.3)} ${f1(x)} ${f1(y)} Z" fill="${fill}" ${st}/>`;
  }
  // ---- キラキラ（UI-25）: しゃしん ぜんたい（300×400）に かさねる 絵。まん中（3人の かお）は すくなめ ----
  // ちらばり: まん中の だ円の 中は 4つに 1つ だけ のこす
  const edge = (n, seed, fn) => scatter(n, seed, (x, y, r, i) => (((x - 150) / 128) ** 2 + ((y - 215) / 150) ** 2 < 1 && i % 4 ? "" : fn(x, y, r, i)));
  const spark = (x, y, r, fill, op = 1) => `<path d="M${f1(x)} ${f1(y - r)} Q${f1(x + r * 0.16)} ${f1(y - r * 0.16)} ${f1(x + r)} ${f1(y)} Q${f1(x + r * 0.16)} ${f1(y + r * 0.16)} ${f1(x)} ${f1(y + r)} Q${f1(x - r * 0.16)} ${f1(y + r * 0.16)} ${f1(x - r)} ${f1(y)} Q${f1(x - r * 0.16)} ${f1(y - r * 0.16)} ${f1(x)} ${f1(y - r)} Z" fill="${fill}" opacity="${op}"/>`;
  const petal = (x, y, s, a, fill) => `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${Math.round(a)}) scale(${f1(s)})"><path d="M0 -7 C5 -7 7 -2 5 3 C4 6 1 7 0 5 C-1 7 -4 6 -5 3 C-7 -2 -5 -7 0 -7 Z" fill="${fill}"/><path d="M0 -4 V3" stroke="#FF9EC4" stroke-width="1.2" stroke-linecap="round"/></g>`;
  const flake = (x, y, r) => `<g stroke="#FFFFFF" stroke-width="${f1(Math.max(1.2, r * 0.22))}" stroke-linecap="round" opacity="0.95">${[0, 60, 120].map((a) => `<path d="M${f1(x - r)} ${f1(y)} H${f1(x + r)}" transform="rotate(${a} ${f1(x)} ${f1(y)})"/>`).join("")}</g>`;
  const FX_SVG = {
    // きらきら: しろと きんの ひかり（うしろに ぼんやりした まる）
    kira: () => svg(300, 400, edge(46, 7, (x, y, r, i) => { const s = 4 + r * 13, c = i % 3 === 0 ? "#FFF3B0" : i % 3 === 1 ? "#FFFFFF" : "#FFD6E8"; return (s > 10 ? `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(s * 0.75)}" fill="${c}" opacity="0.3"/>` : "") + spark(x, y, s, c, 0.95) + (s > 12 ? spark(x, y, s * 0.4, "#FFFFFF") : ""); }) + edge(40, 19, (x, y, r) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(1 + r * 1.6)}" fill="#FFFFFF" opacity="0.9"/>`)),
    // ハート: ピンクと しろの ハートが ふわふわ
    heart: () => svg(300, 400, edge(30, 23, (x, y, r, i) => `<g transform="rotate(${Math.round((r - 0.5) * 50)} ${f1(x)} ${f1(y)})" opacity="${f1(0.65 + r * 0.3)}">${heart(x, y, 5 + r * 11, i % 3 === 0 ? "#FFFFFF" : i % 3 === 1 ? "#FF9EC4" : "#FF7BA8", i % 3 === 0 ? 'stroke="#FF9EC4" stroke-width="1.4"' : 'stroke="#FFFFFF" stroke-width="1.4"')}</g>`)),
    // ほし: きいろと しろの ほし・ながれぼし
    hoshi: () => svg(300, 400, `<path d="M300 22 L196 92" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity="0.75"/><path d="M300 34 L210 96" stroke="#FFE07A" stroke-width="2" stroke-linecap="round" opacity="0.7"/>${star(196, 92, 9, "#FFE07A", 'stroke="#FFFFFF" stroke-width="1.6"')}` + edge(38, 31, (x, y, r, i) => star(x, y, 3 + r * 8, i % 2 ? "#FFE07A" : "#FFFFFF", `opacity="${f1(0.75 + r * 0.25)}"${r > 0.6 ? ' stroke="#FFFFFF" stroke-width="1"' : ""}`)) + edge(30, 37, (x, y, r) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(0.8 + r * 1.4)}" fill="#FFF6C8"/>`)),
    // しゃぼんだま: すきとおった まると にじいろの ふち・ひかり
    awa: () => svg(300, 400, edge(20, 43, (x, y, r) => { const R = 8 + r * 20; return `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(R)}" fill="#FFFFFF" fill-opacity="0.22" stroke="#FFFFFF" stroke-width="2.6"/><circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(R - 2.4)}" fill="none" stroke="#B79BEA" stroke-width="1" stroke-opacity="0.45"/><path d="M${f1(x + R * 0.2)} ${f1(y + R * 0.97)} A${f1(R)} ${f1(R)} 0 0 0 ${f1(x + R * 0.97)} ${f1(y + R * 0.2)}" fill="none" stroke="#6FC7EF" stroke-width="2.6" opacity="0.9"/><path d="M${f1(x - R * 0.97)} ${f1(y - R * 0.2)} A${f1(R)} ${f1(R)} 0 0 1 ${f1(x - R * 0.2)} ${f1(y - R * 0.97)}" fill="none" stroke="#FF9EC4" stroke-width="2.6" opacity="0.9"/><ellipse cx="${f1(x - R * 0.38)}" cy="${f1(y - R * 0.42)}" rx="${f1(R * 0.24)}" ry="${f1(R * 0.14)}" fill="#FFFFFF" opacity="0.95" transform="rotate(-40 ${f1(x - R * 0.38)} ${f1(y - R * 0.42)})"/>`; })),
    // さくら: ピンクの はなびらが ひらひら
    sakura: () => svg(300, 400, edge(34, 53, (x, y, r, i) => petal(x, y, 0.9 + r * 1.1, r * 360, i % 3 ? "#FFC9DC" : "#FFE3EE"))),
    // ゆき: しろい つぶ と ゆきの けっしょう
    yuki: () => svg(300, 400, edge(54, 61, (x, y, r, i) => (i % 5 === 0 ? flake(x, y, 6 + r * 6) : `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(1.4 + r * 3)}" fill="#FFFFFF" opacity="${f1(0.7 + r * 0.3)}"/>`))),
    // ふんわり: ふちが しろく ぼやける ひかりと やわらかい ひかりの まる
    fuwa: () => svg(300, 400, `<defs><radialGradient id="pkfx-fuwa-v" cx="0.5" cy="0.5" r="0.72"><stop offset="0.55" stop-color="#FFFFFF" stop-opacity="0"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0.8"/></radialGradient><radialGradient id="pkfx-fuwa-o"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.75"/><stop offset="1" stop-color="#FFF0F6" stop-opacity="0"/></radialGradient></defs><rect width="300" height="400" fill="url(#pkfx-fuwa-v)"/>` +
      [[46, 52, 40], [250, 70, 30], [262, 330, 44], [36, 300, 30], [150, 28, 26]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#pkfx-fuwa-o)"/>`).join("")),
    // にじいろ: ななめの にじの ひかり（みぎうえ から）と うすい にじの わ
    niji: () => svg(300, 400, `<defs><linearGradient id="pkfx-niji-b" x1="0" y1="0" x2="0" y2="1">${["#FF7BA8", "#FFB36B", "#FFE07A", "#9EE3B5", "#7FC8F0", "#B79BEA"].map((c, i, a) => `<stop offset="${f1(i / (a.length - 1))}" stop-color="${c}"/>`).join("")}</linearGradient>` +
      `<linearGradient id="pkfx-niji-f" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000000"/><stop offset="0.5" stop-color="#FFFFFF"/></linearGradient><mask id="pkfx-niji-m"><rect x="40" y="-20" width="320" height="150" fill="url(#pkfx-niji-f)"/></mask></defs>` +
      `<g transform="rotate(-38 300 0)"><g mask="url(#pkfx-niji-m)"><rect x="40" y="-6" width="320" height="74" fill="url(#pkfx-niji-b)" opacity="0.38"/><rect x="40" y="90" width="320" height="26" fill="url(#pkfx-niji-b)" opacity="0.22"/></g></g>` +
      ["#FF7BA8", "#FFE07A", "#9EE3B5", "#7FC8F0"].map((c, i) => `<path d="M${-30 + i * 7} 420 A${190 - i * 7} ${190 - i * 7} 0 0 1 ${330 - i * 7} 420" fill="none" stroke="${c}" stroke-width="6" opacity="0.28"/>`).join("") + edge(14, 71, (x, y, r) => spark(x, y, 3 + r * 6, "#FFFFFF", 0.9))),
  };
  // はいけい・スタンプの ラスタは 3だんかいの 大きさ だけ（SvgCache の キーが 有限）
  const bgW = (px) => (px <= 160 ? 150 : px <= 320 ? 300 : 600), stW = (px) => (px <= 48 ? 48 : px <= 96 ? 96 : 192);
  const dprOf = () => (typeof G !== "undefined" && G.px) || (typeof devicePixelRatio !== "undefined" ? devicePixelRatio : 2);
  // 3人の ならび（ぜんしん: 足もとが 350・アップ: 大きく かさなって）。order は 描く じゅん（あとが まえ）
  const LAYOUT = [{ S: 156, y: 350, xs: [68, 150, 232], order: [0, 2, 1] }, { S: 212, y: 372, xs: [62, 150, 238], order: [0, 2, 1] }];
  // gesture: うでの ポーズ・face: ボタンの かお → その 人の かお（PuriPose）
  const charaOpts = (ph, i) => {
    const id = ph.r[i], [poseId, faceId] = ph.c[id] || ["stand", "happy"], pz = P.POSE[poseId] || P.POSES[0], [outfit, color] = ph.o[id] || [{}, "soft"];
    return { pose: pz.pose, dir: pz.side ? (i === 0 ? "right" : i === 2 ? "left" : "down") : "down", face: PuriPose.faceOf(id, faceId), outfit, color, ...(pz.gesture ? { gesture: pz.gesture } : {}) };
  };
  // 3人の あしもと（しゃしんの 座標。ならびの ばしょ ＋ うごかした ぶん m）と 描く じゅん（したに いる ほど まえ・おなじ なら ならびの order）
  const placed = (ph) => {
    const L = LAYOUT[ph.z ? 1 : 0], m = ph.m || {};
    return L.order.map((i, n) => { const id = ph.r[i], d = m[id] || [0, 0]; return { i, id, n, x: Math.max(24, Math.min(P.PW - 24, L.xs[i] + d[0])), y: Math.max(L.y - P.MOVE.up, Math.min(L.y + P.MOVE.down, L.y + d[1])) }; })
      .filter((q) => q.id).sort((a, b) => a.y - b.y || a.n - b.n);
  };
  // もじの はば（しゃしんの 座標・26の ふとじ）。はかれない ときは 1もじ 26
  let measure = null;
  const textW = (t) => {
    if (measure === null) { try { measure = typeof document !== "undefined" && document.createElement("canvas").getContext("2d"); } catch (e) { measure = false; } }
    const w = measure ? ((measure.font = "900 26px 'M PLUS Rounded 1c', sans-serif"), measure.measureText(t).width) : t.length * 26;
    return Math.min(P.PW - 12, w || t.length * 26);
  };
  // スタンプ・もじの はこ（しゃしんの 座標: まん中・はばの はんぶん・たかさの はんぶん・かたむき）。さわる・まわす ときに つかう
  const box = (kind, it) => {
    if (kind === "s") { const h = ((P.STAMP_SIZE[it[3]] || 56) / 2) * 0.86; return { cx: it[1], cy: it[2], hw: h, hh: h, rot: it[4] || 0 }; }
    return { cx: it[1], cy: it[2], hw: textW(it[0]) / 2 + 5, hh: 17, rot: it[4] || 0 };
  };
  const A = {
    BG_SVG, STAMP_SVG, FX_SVG, LAYOUT, charaOpts, placed, textW, box,
    keys() { return [...P.BGS.map((b) => "puri:bg:" + b.id), ...P.STAMPS.map((s) => "puri:stamp:" + s.id), ...P.EFFECTS.map((e) => "puri:fx:" + e.id)]; },
    bgImg(id, px) { const w = bgW(px); return SvgCache.get("puri:bg:" + id, BG_SVG[id] || BG_SVG.yume, w, Math.round((w * 4) / 3)); },
    fxImg(id, px) { const w = bgW(px); return FX_SVG[id] ? SvgCache.get("puri:fx:" + id, FX_SVG[id], w, Math.round((w * 4) / 3)) : null; },
    stampImg(k, px) { const w = stW(px); return SvgCache.get("puri:stamp:" + k, STAMP_SVG[k] || STAMP_SVG.heart, w, w); },
    // しゃしんを 描く まえに 絵を よみこむ（はば w の とき）
    ready(ph, w) {
      const dpr = dprOf(), k = w / P.PW, bw = bgW(w * dpr), L = LAYOUT[ph.z ? 1 : 0], jobs = [SvgCache.ensure("puri:bg:" + ph.bg, BG_SVG[ph.bg] || BG_SVG.yume, bw, Math.round((bw * 4) / 3))];
      for (const s of ph.d.s) { const sw = stW(P.STAMP_SIZE[s[3]] * k * dpr); jobs.push(SvgCache.ensure("puri:stamp:" + s[0], STAMP_SVG[s[0]], sw, sw)); }
      for (const e of ph.d.e || []) if (FX_SVG[e]) jobs.push(SvgCache.ensure("puri:fx:" + e, FX_SVG[e], bw, Math.round((bw * 4) / 3)));
      jobs.push(Chara.preload([0, 1, 2].map((i) => [ph.r[i], charaOpts(ph, i)]), L.S * k));
      return Promise.all(jobs);
    },
    // しゃしん 1まい（x, y: 左上・w: はば）。o.frame: わく（ロゴと 日づけ）・o.t: とき（らくがき中の きらきら・ほしが またたく）
    draw(ctx, ph, x, y, w, o = {}) {
      const k = w / P.PW, h = P.PH * k, dpr = dprOf(), L = LAYOUT[ph.z ? 1 : 0];
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
      const bg = this.bgImg(ph.bg, w * dpr); if (bg) ctx.drawImage(bg, x, y, w, h); else { ctx.fillStyle = "#FBE3EC"; ctx.fillRect(x, y, w, h); }
      for (const q of placed(ph)) Chara.draw(ctx, q.id, charaOpts(ph, q.i), x + q.x * k, y + q.y * k, L.S * k);
      // キラキラ（3人の うえ・らくがきの した）
      (ph.d.e || []).forEach((e, i) => {
        const img = this.fxImg(e, w * dpr); if (!img) return;
        const tw = o.t != null && (e === "kira" || e === "hoshi") ? 0.78 + 0.22 * Math.sin(o.t * 4.2 + i * 1.7) : 1;
        if (tw !== 1) { ctx.save(); ctx.globalAlpha *= tw; ctx.drawImage(img, x, y, w, h); ctx.restore(); } else ctx.drawImage(img, x, y, w, h);
      });
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
      // スタンプ・もじ（UI-25: かたむき・スタンプの はんてん）
      for (const [kind, sx, sy, sz, rot, flip] of d.s) {
        const s = (P.STAMP_SIZE[sz] || 56) * k, img = this.stampImg(kind, s * dpr); if (!img) continue;
        if (!rot && !flip) { ctx.drawImage(img, x + sx * k - s / 2, y + sy * k - s / 2, s, s); continue; }
        ctx.save(); ctx.translate(x + sx * k, y + sy * k); if (rot) ctx.rotate((rot * Math.PI) / 180); if (flip) ctx.scale(-1, 1); ctx.drawImage(img, -s / 2, -s / 2, s, s); ctx.restore();
      }
      for (const [t, tx, ty, c, rot] of d.x) {
        const fs = 26 * k; ctx.save(); ctx.translate(x + tx * k, y + ty * k); if (rot) ctx.rotate((rot * Math.PI) / 180);
        ctx.font = `900 ${fs}px 'M PLUS Rounded 1c', sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.lineJoin = "round";
        ctx.lineWidth = 7 * k; ctx.strokeStyle = c === 5 ? "#FF7BA8" : "#FFFFFF"; ctx.strokeText(t, 0, 0, (P.PW - 12) * k); ctx.fillStyle = P.PENS[c] || P.PENS[0]; ctx.fillText(t, 0, 0, (P.PW - 12) * k); ctx.restore();
      }
    },
    // わく: しろい ふち・したの おび（ブースの ロゴ と 日づけ。いろは ブースの いろ）
    frame(ctx, ph, x, y, k) {
      const w = P.PW * k, h = P.PH * k, b = 7 * k, band = 30 * k, B = P.BOOTH[ph.k] || P.BOOTHS[0];
      ctx.save(); ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(x, y, w, b); ctx.fillRect(x, y, b, h); ctx.fillRect(x + w - b, y, b, h); ctx.fillRect(x, y + h - band, w, band);
      ctx.strokeStyle = B.line; ctx.lineWidth = Math.max(1, 2 * k); ctx.strokeRect(x + b, y + b, w - b * 2, h - band - b);
      // ちいさい しゃしん（アルバム・らくがきの えらび）は ロゴ だけ
      ctx.textBaseline = "middle"; ctx.fillStyle = B.col;
      if (k < 0.5) { ctx.font = `900 ${Math.max(6, 18 * k)}px 'M PLUS Rounded 1c', sans-serif`; ctx.textAlign = "center"; ctx.fillText(B.logo, x + w / 2, y + h - band / 2, w - 4); }
      else {
        ctx.font = `900 ${15 * k}px 'M PLUS Rounded 1c', sans-serif`; ctx.textAlign = "left"; ctx.fillText(B.logo, x + 14 * k, y + h - band / 2);
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
    this.booth = Purikura.BOOTH[p.booth] || Purikura.BOOTHS[0];
    this.back = p.back || null; this.phase = "bg"; this.bgs = Purikura.slotBgs(this.booth.id); this.slot = "all"; this.z = 0; this.who = "all"; this.tab = "pose";
    this.sel = Object.fromEntries(Chara.IDS.map((id) => [id, ["stand", "happy"]]));
    // 3人の ばしょ（ならびから の ずれ・しゃしんの 座標）。ゆびで うごかす（drag）
    this.pos = Object.fromEntries(Chara.IDS.map((id) => [id, [0, 0]])); this.drag = null; this.moved = false;
    this.shots = []; this.deco = []; this.di = 0; this.tool = "pen"; this.pen = { c: 0, w: 1 }; this.stamp = "heart"; this.face = "hoppe"; this.ssz = 1; this.words = Purikura.wordsOf(this.booth.id); this.word = this.words[0]; this.wc = 0; this.hist = [];
    // らくがき: えらんだ スタンプ・もじ（pick = { k: "s"|"x", j }）と ゆびで うごかす／まわす（grab）。UI-25
    this.pick = null; this.grab = null;
    this.count = null; this.flash = 0; this.clock = 0; this.speed = 1; this.drawing = null; this.saved = false; this.closed = false; this.msg = "";
    UI.showHud(true, this.booth.name + " ぷりくら"); Sound.bgm("arcade_hall");
    this.buildUI(); this.resize();
    const o = Purikura.outfits(), list = [];
    for (const id of Chara.IDS) for (const P of Purikura.POSES) list.push([id, { pose: P.pose, dir: "down", face: PuriPose.faceOf(id, "happy"), outfit: o[id][0], color: o[id][1], ...(P.gesture ? { gesture: P.gesture } : {}) }]);
    await Promise.all([Chara.preload(list, this.charaSize()), ...this.booth.bgs.map((id) => SvgCache.ensure("puri:bg:" + id, PurikuraArt.BG_SVG[id], 300, 400))]);
  }
  exit() { this.closed = true; this.panel?.remove(); this.resetBtn?.remove(); UI.showHud(false); }
  // いま カメラに うつす はいけい（UI-87: 1まいずつ）: えらぶ ときは えらんで いる まい（ぜんぶ なら 1まいめ）・さつえいは つぎに とる まい・らくがきは その しゃしん
  shotIndex() { return Math.min(this.shots.length, Purikura.SHOTS - 1); }
  curBg() {
    if (this.phase === "deco" || this.phase === "done") return (this.shots[this.di] && this.shots[this.di].bg) || this.bgs[0];
    return this.bgs[this.phase === "shoot" ? this.shotIndex() : this.slot === "all" ? 0 : this.slot];
  }
  // はいけいを えらぶ: えらぶ ときは ぜんぶ か その まい・さつえいの とちゅうは つぎに とる まい だけ
  pickBg(id) { Sound.se("tap"); this.bgs = Purikura.setBg(this.bgs, this.phase === "shoot" ? this.shotIndex() : this.slot, id, this.booth.id); this.ui(); }
  bgThumb(id) { return U.el("img", { src: U.svgUrl(PurikuraArt.BG_SVG[id]()), alt: "" }); }
  // いまの えらびかた（さつえいの まえの カメラ・とった しゃしん）
  photoOf(shot, deco) {
    const o = shot ? shot.o : Purikura.outfits(), c = shot ? shot.c : this.sel;
    const m = shot ? shot.m : Purikura.moves(this.pos);
    return { id: "live", t: shot ? shot.t : Date.now(), bg: shot ? shot.bg || this.bgs[0] : this.curBg(), k: this.booth.id, z: shot ? shot.z : this.z, r: Save.d.order.slice(), c, o, d: deco || { p: [], s: [], x: [] }, ...(m ? { m } : {}) };
  }
  charaSize() { return PurikuraArt.LAYOUT[1].S * ((this.view ? this.view.w : 260) / Purikura.PW); }
  // ---- ボタン ----
  buildUI() {
    this.panel?.remove(); this.resetBtn?.remove();
    const P = (this.panel = U.el("div", { class: "puri-panel" }));
    // 3人を うごかした ときだけ カメラの がめんの みぎうえに「もとの ならび」
    this.resetBtn = UI.btn("もとの ならび", () => { Sound.se("cancel"); for (const id of Chara.IDS) this.pos[id] = [0, 0]; this.placeReset(); }, "puri-reset hidden");
    UI.root.append(P, this.resetBtn); this.ui();
  }
  placeReset() {
    const b = this.resetBtn, v = this.view; if (!b) return;
    const show = this.phase === "shoot" && !!v && Chara.IDS.some((id) => this.pos[id][0] || this.pos[id][1]);
    b.classList.toggle("hidden", !show); if (!show) return;
    // カメラの がめん（ゲームの 座標）→ CSS の px
    const u = G.cssPerUnit || 1, rc = G.canvas ? G.canvas.getBoundingClientRect() : { left: 0, top: 0 }, root = UI.root.getBoundingClientRect();
    b.style.right = Math.round(root.right - (rc.left + (v.x + v.w) * u) + 6) + "px"; b.style.top = Math.round(rc.top - root.top + v.y * u + 6) + "px";
  }
  chip(label, on, fn, cls = "") { const b = UI.btn("", () => { Sound.se("tap"); fn(); }, "puri-chip " + cls + (on ? " on" : "")); b.textContent = label; b.setAttribute("aria-pressed", on ? "true" : "false"); return b; }
  row(cls, kids) { return U.el("div", { class: cls }, kids); }
  ui() {
    const P = this.panel, ph = this.phase; P.replaceChildren(); P.dataset.phase = ph;
    if (ph === "bg") {
      P.append(U.el("div", { class: "puri-title", text: "はいけいを えらんでね" }));
      // ぜんぶ おなじ／1まいめ〜4まいめ（UI-87）。えらんで いる まいの はいけいを したの 6つから えらぶ
      const all = this.slot === "all";
      const slots = this.row("puri-slots", [["all", "ぜんぶ"], ...this.bgs.map((id, i) => [i, `${i + 1}まいめ`])].map(([k, name]) => {
        const b = this.chip("", this.slot === k, () => { this.slot = k; this.ui(); }, "slot");
        if (k !== "all") { b.append(this.bgThumb(this.bgs[k])); b.title = Purikura.BG[this.bgs[k]].name; }
        b.append(U.el("span", { text: name })); return b;
      }));
      const grid = U.el("div", { class: "puri-bgs" });
      for (const b of this.booth.bgs.map((id) => Purikura.BG[id])) { const on = all ? this.bgs.every((x) => x === b.id) : this.bgs[this.slot] === b.id, btn = UI.btn("", () => this.pickBg(b.id), "puri-bg" + (on ? " on" : "")); btn.setAttribute("aria-label", b.name); btn.append(this.bgThumb(b.id), U.el("span", { text: b.name })); grid.append(btn); }
      P.append(slots, grid, U.el("div", { class: "puri-hint", text: all ? "1〜4まいめを おすと 1まいずつ えらべるよ" : `${this.slot + 1}まいめの はいけいを えらんでね` }), this.row("puri-actions", [UI.btn("やめる", () => this.quit(), "puri-small"), UI.btn("とりはじめる", () => { Sound.se("ok"); this.phase = "shoot"; this.ui(); this.resize(); }, "yellow puri-main")]));
    } else if (ph === "shoot") {
      const whoRow = this.row("puri-who", [["all", "みんな"], ...Save.d.order.map((id) => [id, Save.d.chars[id].name])].map(([k, name]) => this.chip(name, this.who === k, () => { this.who = k; this.ui(); })));
      const tabs = this.row("puri-tabs", [this.chip("ポーズ", this.tab === "pose", () => { this.tab = "pose"; this.ui(); }, "tab"), this.chip("かお", this.tab === "face", () => { this.tab = "face"; this.ui(); }, "tab"), this.chip("はいけい", this.tab === "bg", () => { this.tab = "bg"; this.ui(); }, "tab"), this.chip(this.z ? "ぜんしんに" : "アップに", false, () => { this.z = this.z ? 0 : 1; this.ui(); }, "tab zoom")]);
      const cur = (k) => (this.who === "all" ? Save.d.order.every((id) => this.sel[id][k] === this.sel[Save.d.order[0]][k]) && this.sel[Save.d.order[0]][k] : this.sel[this.who][k]);
      const set = (k, v) => { for (const id of this.who === "all" ? Chara.IDS : [this.who]) this.sel[id][k] = v; this.ui(); };
      // はいけい（UI-87）: つぎに とる まいの はいけいを かえる（ほかの まいは そのまま）
      const bgOpt = (id) => { const b = UI.btn("", () => this.pickBg(id), "puri-chip bgchip" + (this.curBg() === id ? " on" : "")); b.setAttribute("aria-pressed", this.curBg() === id ? "true" : "false"); b.append(this.bgThumb(id), U.el("span", { text: Purikura.BG[id].name })); return b; };
      const opts = this.tab === "pose" ? Purikura.POSES.map((x) => this.chip(x.name, cur(0) === x.id, () => set(0, x.id))) : this.tab === "face" ? Purikura.FACES.map((x) => this.chip(x.name, cur(1) === x.id, () => set(1, x.id))) : this.booth.bgs.map(bgOpt);
      const shot = UI.btn("とる！", () => this.shoot(), "puri-shot" + (this.count ? "" : " ready")); shot.disabled = !!this.count;
      P.append(whoRow, tabs, this.row("puri-chips", opts), this.row("puri-actions", [UI.btn("やめる", () => this.quit(), "puri-small"), shot, U.el("div", { class: "puri-count", text: `${this.shots.length + 1} / ${Purikura.SHOTS}` })]));
    } else if (ph === "deco") {
      const thumbs = this.row("puri-thumbs", this.shots.map((s, i) => { const b = UI.btn("", () => { Sound.se("tap"); this.di = i; this.pick = null; this.ui(); }, "puri-thumbbtn" + (this.di === i ? " on" : "")); b.setAttribute("aria-label", `${i + 1}まいめ`); const cv = U.el("canvas"); b.append(cv); PurikuraArt.paint(cv, this.photoOf(s, this.deco[i]), 36); return b; }));
      const undo = UI.btn("もどす", () => this.undo(), "puri-small"); undo.disabled = !this.hist.some((h) => h.i === this.di);
      thumbs.append(undo);
      // どうぐ: ペン・スタンプ・かお（かおの スタンプ）・もじ・キラキラ（UI-25）
      const tools = this.row("puri-tabs", [["pen", "ペン"], ["stamp", "スタンプ"], ["face", "かお"], ["text", "もじ"], ["fx", "キラキラ"]].map(([k, name]) => this.chip(name, this.tool === k, () => { this.tool = k; this.pick = null; this.ui(); }, "tab")));
      const it = this.pickItem(), d = this.deco[this.di];
      let opts = [];
      if (this.tool === "pen") opts = [...Purikura.PENS.map((c, i) => { const b = this.chip("", this.pen.c === i, () => { this.pen.c = i; this.ui(); }, "swatch"); b.style.setProperty("--sw", c); b.setAttribute("aria-label", ["ピンク", "きいろ", "みずいろ", "みどり", "むらさき", "しろ"][i]); return b; }), this.chip("ほそい", this.pen.w === 0, () => { this.pen.w = 0; this.ui(); }), this.chip("ふとい", this.pen.w === 1, () => { this.pen.w = 1; this.ui(); })];
      else if (this.tool === "stamp" || this.tool === "face") {
        // スタンプを えらぶと つぎに おく スタンプ（えらんで いた ものは はなす）。大きさは えらんで いる スタンプにも
        const face = this.tool === "face", cur = face ? this.face : this.stamp;
        opts = [...Purikura.STAMPS.filter((s) => !!s.face === face).map((s) => { const b = this.chip("", cur === s.id, () => { if (face) this.face = s.id; else this.stamp = s.id; this.pick = null; this.ui(); }, "stamp"); b.setAttribute("aria-label", s.name); b.append(U.el("img", { src: U.svgUrl(PurikuraArt.STAMP_SVG[s.id]()), alt: "" })); return b; }),
          ...["ちいさい", "ふつう", "おおきい"].map((t, i) => this.chip(t, it ? it.a[3] === i : this.ssz === i, () => { this.ssz = i; if (it) this.edit((a) => { a[3] = i; }); this.ui(); }))];
      } else if (this.tool === "text") opts = [...this.words.map((w) => this.chip(w, this.word === w, () => { this.word = w; this.pick = null; this.ui(); })), this.chip("じぶんで かく", false, () => this.ownWord()), ...Purikura.PENS.map((c, i) => { const b = this.chip("", it ? it.a[3] === i : this.wc === i, () => { this.wc = i; if (it) this.edit((a) => { a[3] = i; }); this.ui(); }, "swatch"); b.style.setProperty("--sw", c); b.setAttribute("aria-label", "もじの いろ " + (i + 1)); return b; })];
      // キラキラ: なんこでも かさねられる（もう いちど おすと けす）
      else opts = Purikura.EFFECTS.map((e) => this.chip(e.name, d.e.includes(e.id), () => this.toggleFx(e.id)));
      P.append(thumbs, tools, this.row("puri-chips", opts), this.row("puri-actions", [UI.btn("できあがり", () => this.done(), "yellow puri-main")]));
      const hint = this.tool === "pen" ? "しゃしんを なぞって かこう" : this.tool === "fx" ? "しゃしん ぜんぶが キラキラに なるよ" : it ? (it.k === "s" ? "↻ で まわす・⇆ はんてん・× けす" : "↻ で まわす・× けす") : this.tool === "text" ? "タップで もじ・もじを さわると まわせる" : "タップで おく・スタンプを さわると まわせる";
      P.append(U.el("div", { class: "puri-hint", text: hint }));
    } else {
      P.append(U.el("div", { class: "puri-title", text: "できあがり！\nすまほの「しゃしん」に 4まい はいったよ" }), this.row("puri-actions", [UI.btn("すまほで みる", () => { Sound.se("ok"); Smaho.open("photos"); }, "yellow puri-main"), UI.btn("おみせに もどる", () => this.leave(), "puri-main")]));
    }
    requestAnimationFrame(() => this.resize());
  }
  resize() {
    const top = 70, bot = this.panel ? this.panel.getBoundingClientRect().height + 14 : 240, h = Math.max(160, G.H - top - bot), w = Math.min(G.W - 36, h * 0.75);
    this.view = { x: (G.W - w) / 2, y: top + Math.max(0, (h - w / 0.75) / 2), w, h: w / 0.75 };
    this.placeReset();
  }
  // ---- さつえい: 3人を ゆびで うごかす（さわった 人を えらぶ）----
  // その 人の あしもとが しゃしんの 中に いる はんい（ならびの ばしょ からの ずれ）
  clampPos(id, [dx, dy]) {
    const L = PurikuraArt.LAYOUT[this.z ? 1 : 0], i = Math.max(0, Save.d.order.indexOf(id)), M = Purikura.MOVE, x0 = L.xs[i];
    return [Math.round(Math.max(Math.max(-M.x, 24 - x0), Math.min(Math.min(M.x, Purikura.PW - 24 - x0), dx))), Math.round(Math.max(-M.up, Math.min(M.down, dy)))];
  }
  // ゆびの ところに いる 人（まえに いる 人から。からだの はんいは キャラ素材の 座標で よこ ±78・あしもとから うえ 200）
  hitChara(p) {
    const v = this.view; if (!v) return null;
    const k = v.w / Purikura.PW, L = PurikuraArt.LAYOUT[this.z ? 1 : 0], s = (L.S * k) / Chara.VB.w;
    for (const q of PurikuraArt.placed(this.photoOf(null, null)).reverse()) { const fx = v.x + q.x * k, fy = v.y + q.y * k; if (p.x > fx - 78 * s && p.x < fx + 78 * s && p.y > fy - 200 * s && p.y < fy + 6 * s) return q.id; }
    return null;
  }
  // ---- さつえい ----
  shoot() {
    if (this.count || this.phase !== "shoot" || Game.inputLocked) return;
    Sound.se("ok"); this.count = { n: 3, t: 0 }; this.ui(); Sound.se("puri_count");
  }
  snap() {
    this.count = null; this.flash = 0.45; Sound.se("puri_shutter");
    const m = Purikura.moves(this.pos), bg = this.curBg();
    this.shots.push({ c: JSON.parse(JSON.stringify(this.sel)), z: this.z, o: Purikura.outfits(), t: Date.now(), bg, ...(m ? { m } : {}) }); this.deco.push({ p: [], s: [], x: [], e: [] });
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
    if (UI.busy) return;
    if (this.phase === "shoot") {
      const id = this.flash > 0 ? null : this.hitChara(p); if (!id) return;
      this.drag = { id: p.id, who: id, x: p.x, y: p.y, base: this.pos[id].slice() };
      if (this.who !== id) { this.who = id; Sound.se("tap"); this.ui(); }
      return;
    }
    if (this.phase !== "deco") return;
    const d = this.deco[this.di], kind = this.kindOf();
    // えらんで いる ものの とって: ↻ まわす（ゆびで ぐるっと）・⇆ はんてん・× けす
    const h = kind && this.pick ? this.handleAt(p) : null;
    if (h) {
      const it = this.pickItem();
      if (h.id === "del") { d[it.k].splice(it.j, 1); this.hist.push({ i: this.di, k: it.k, j: it.j, t: "del", item: it.a }); this.pick = null; Sound.se("cancel"); this.ui(); return; }
      if (h.id === "flip") { this.edit((a) => { a[5] = a[5] ? 0 : 1; }); Sound.se("puri_stamp"); this.ui(); return; }
      const v = this.view, k = v.w / Purikura.PW, cx = v.x + it.a[1] * k, cy = v.y + it.a[2] * k;
      this.grab = { id: p.id, mode: "rot", k: it.k, j: it.j, cx, cy, a0: Math.atan2(p.y - cy, p.x - cx), r0: it.a[4] || 0, prev: it.a.slice() };
      return;
    }
    const q = this.toPhoto(p); if (!q) return;
    if (this.tool === "pen") { if (this.full("p")) return; this.drawing = { id: p.id, st: { c: this.pen.c, w: this.pen.w, pts: [q] } }; d.p.push(this.drawing.st); return; }
    if (!kind) return;
    // おいた ものを さわる → えらぶ（そのまま ゆびで うごかせる）。えらんで いる ときに ほかの ところ → はなす
    const hit = this.hitDeco(q, kind);
    if (hit) {
      const a = d[hit.k][hit.j], same = this.pick && this.pick.k === hit.k && this.pick.j === hit.j;
      this.pick = hit; this.grab = { id: p.id, mode: "move", k: hit.k, j: hit.j, sx: q[0], sy: q[1], bx: a[1], by: a[2], prev: a.slice() };
      if (!same) { Sound.se("tap"); this.ui(); }
      return;
    }
    if (this.pick) { this.pick = null; this.ui(); return; }
    if (kind === "x") { if (this.full("x")) return; d.x.push([this.word, q[0], q[1], this.wc]); this.hist.push({ i: this.di, k: "x" }); }
    else { if (this.full("s")) return; d.s.push([this.tool === "face" ? this.face : this.stamp, q[0], q[1], this.ssz]); this.hist.push({ i: this.di, k: "s" }); }
    Sound.se("puri_stamp"); this.ui();
  }
  // ---- らくがきの スタンプ・もじを えらぶ・うごかす・まわす（UI-25）----
  // いまの どうぐで えらべる もの（スタンプ・かお → スタンプ、もじ → もじ）
  kindOf() { return this.tool === "text" ? "x" : this.tool === "stamp" || this.tool === "face" ? "s" : null; }
  pickItem() { const p = this.pick; if (!p || this.phase !== "deco" || this.kindOf() !== p.k) return null; const a = this.deco[this.di][p.k][p.j]; return a ? { k: p.k, j: p.j, a } : null; }
  // ゆびの ところの もの（あとから おいた ものから）。かたむいた はこの 中か
  hitDeco(q, k) {
    const list = this.deco[this.di][k];
    for (let j = list.length - 1; j >= 0; j--) {
      const B = PurikuraArt.box(k, list[j]), a = (-B.rot * Math.PI) / 180, dx = q[0] - B.cx, dy = q[1] - B.cy;
      if (Math.abs(dx * Math.cos(a) - dy * Math.sin(a)) <= B.hw && Math.abs(dx * Math.sin(a) + dy * Math.cos(a)) <= B.hh) return { k, j };
    }
    return null;
  }
  // とっての ばしょ（ゲームの 座標・カメラの がめんの 中）: ↻ みぎうえ・× ひだりうえ・⇆ ひだりした（スタンプ だけ）。はこと いっしょに かたむく
  handles() {
    const it = this.pickItem(), v = this.view; if (!it || !v) return [];
    const k = v.w / Purikura.PW, B = PurikuraArt.box(it.k, it.a), a = (B.rot * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a), pad = 15 / k;
    const at = (id, lx, ly) => { const px = B.cx + lx * c - ly * s, py = B.cy + lx * s + ly * c; return { id, x: Math.max(v.x + 14, Math.min(v.x + v.w - 14, v.x + px * k)), y: Math.max(v.y + 14, Math.min(v.y + v.h - 14, v.y + py * k)) }; };
    const out = [at("rot", B.hw + pad, -B.hh - pad), at("del", -B.hw - pad, -B.hh - pad)];
    if (it.k === "s") out.push(at("flip", -B.hw - pad, B.hh + pad));
    return out;
  }
  handleAt(p) { let best = null, bd = 23; for (const h of this.handles()) { const dd = Math.hypot(p.x - h.x, p.y - h.y); if (dd < bd) { bd = dd; best = h; } } return best; }
  // えらんだ ものを かえる（もどす で もとに もどる）
  edit(fn) {
    const it = this.pickItem(); if (!it) return;
    const prev = it.a.slice(); fn(it.a); this.tidy(it.a, it.k);
    if (JSON.stringify(prev) !== JSON.stringify(it.a)) this.hist.push({ i: this.di, k: it.k, j: it.j, t: "edit", prev });
  }
  // かたむき・はんてんは 0 なら かかない（しゃしんの かたちと おなじ）
  tidy(a, k) {
    const r = Purikura.turn(a[4]), f = k === "s" && !!a[5];
    a.length = 4; if (r || f) a.push(r); if (f) a.push(1);
  }
  toggleFx(id) {
    const d = this.deco[this.di], prev = d.e.slice(), on = d.e.includes(id);
    d.e = Purikura.EFFECTS.map((e) => e.id).filter((x) => (x === id ? !on : d.e.includes(x)));
    this.hist.push({ i: this.di, k: "e", t: "fx", prev }); Sound.se(on ? "cancel" : "puri_stamp"); this.ui();
  }
  move(p) {
    const g = this.grab;
    if (g && (p.id == null || p.id === g.id)) {
      const a = this.deco[this.di][g.k][g.j], v = this.view; if (!a || !v) return;
      if (g.mode === "move") {
        const k = v.w / Purikura.PW, x = Math.round(Math.max(0, Math.min(Purikura.PW, g.bx + (p.x - v.x) / k - g.sx))), y = Math.round(Math.max(0, Math.min(Purikura.PH, g.by + (p.y - v.y) / k - g.sy)));
        a[1] = x; a[2] = y;
      } else {
        // まわした ぶんだけ かたむく（45°の ちかくは ぴったりに）
        let r = Purikura.turn(g.r0 + ((Math.atan2(p.y - g.cy, p.x - g.cx) - g.a0) * 180) / Math.PI); const near = Math.round(r / 45) * 45;
        if (Math.abs(r - near) <= 5) r = Purikura.turn(near);
        a[4] = r; this.tidy(a, g.k);
      }
      return;
    }
    if (this.phase === "shoot") {
      const D = this.drag; if (!D || (p.id != null && p.id !== D.id) || !this.view) return;
      const k = this.view.w / Purikura.PW; this.pos[D.who] = this.clampPos(D.who, [D.base[0] + (p.x - D.x) / k, D.base[1] + (p.y - D.y) / k]);
      if (Math.hypot(p.x - D.x, p.y - D.y) > 4) this.moved = true;
      this.placeReset(); return;
    }
    const D = this.drawing; if (!D || (p.id != null && p.id !== D.id)) return;
    const q = this.toPhoto(p); if (!q) return;
    const pts = D.st.pts, last = pts[pts.length - 1], d = this.deco[this.di], all = d.p.reduce((s, x) => s + x.pts.length, 0);
    if (Math.hypot(q[0] - last[0], q[1] - last[1]) >= 2.5 && all < Purikura.LIMIT.points) pts.push(q);
  }
  up(p) {
    const g = this.grab;
    if (g && (p.id == null || p.id === g.id)) {
      this.grab = null; const a = this.deco[this.di][g.k][g.j];
      if (a && JSON.stringify(a) !== JSON.stringify(g.prev)) { this.hist.push({ i: this.di, k: g.k, j: g.j, t: "edit", prev: g.prev }); Sound.se("tap"); this.ui(); }
      return;
    }
    if (this.drag && (p.id == null || p.id === this.drag.id)) { this.drag = null; this.placeReset(); return; }
    if (this.drawing && (p.id == null || p.id === this.drawing.id)) { this.hist.push({ i: this.di, k: "p" }); this.drawing = null; Sound.se("tap"); this.ui(); }
  }
  // もどす: おいた（pop）・かえた（edit）・けした（del）・キラキラ（fx）を 1つ もどす
  undo() {
    for (let n = this.hist.length - 1; n >= 0; n--) {
      const h = this.hist[n]; if (h.i !== this.di) continue;
      const d = this.deco[h.i];
      if (h.t === "edit") d[h.k][h.j] = h.prev; else if (h.t === "del") d[h.k].splice(h.j, 0, h.item); else if (h.t === "fx") d.e = h.prev; else d[h.k].pop();
      this.hist.splice(n, 1); this.pick = h.t === "edit" && this.kindOf() === h.k ? { k: h.k, j: h.j } : null; Sound.se("cancel"); break;
    }
    this.ui();
  }
  async ownWord() {
    const t = await UI.input(`しゃしんに かく ことば（${Purikura.LIMIT.word}もじ まで）`, "", { max: Purikura.LIMIT.word });
    const w = t ? t.replace(/[<>&"'`\u0000-\u001f]/g, "").slice(0, Purikura.LIMIT.word) : "";
    if (w) { this.word = w; if (!this.words.includes(w)) this.customWord = w; } this.ui();
  }
  // できあがり: しゃしん 4まいを すまほへ（1かいだけ）
  async done() {
    if (this.saved || UI.busy) return;
    this.pick = null; this.grab = null;
    const base = Date.now().toString(36);
    const photos = this.shots.map((s, i) => ({ id: `p${base}-${i}`, t: s.t, bg: s.bg || this.bgs[i], k: this.booth.id, z: s.z, r: Save.d.order.slice(), c: s.c, o: s.o, d: { p: this.deco[i].p.filter((x) => x.pts.length).map(Purikura.packStroke), s: this.deco[i].s, x: this.deco[i].x, e: this.deco[i].e }, ...(s.m ? { m: s.m } : {}) }));
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
  // えらんで いる スタンプ・もじ: てんせんの わく と とって（↻ ピンク・⇆ みずいろ・× くろ）
  drawPick(ctx) {
    const it = this.pickItem(), v = this.view; if (!it || !v) return;
    const k = v.w / Purikura.PW, B = PurikuraArt.box(it.k, it.a);
    ctx.save(); ctx.translate(v.x + B.cx * k, v.y + B.cy * k); ctx.rotate((B.rot * Math.PI) / 180);
    U.rr(ctx, -B.hw * k - 4, -B.hh * k - 4, B.hw * 2 * k + 8, B.hh * 2 * k + 8, 8); ctx.setLineDash([6, 5]); ctx.lineWidth = 3.5; ctx.strokeStyle = "#FFFFFF"; ctx.stroke(); ctx.lineWidth = 2; ctx.strokeStyle = "#F0578D"; ctx.stroke(); ctx.restore();
    for (const h of this.handles()) {
      ctx.save(); ctx.translate(h.x, h.y);
      ctx.beginPath(); ctx.arc(0, 0, 13, 0, 7); ctx.fillStyle = h.id === "rot" ? "#F0578D" : h.id === "flip" ? "#3FA9DE" : INK; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = "#FFFFFF"; ctx.stroke();
      ctx.strokeStyle = "#FFFFFF"; ctx.fillStyle = "#FFFFFF"; ctx.lineWidth = 2.4; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.beginPath();
      if (h.id === "rot") { ctx.arc(0, 0, 6, -2.6, 1.4); ctx.stroke(); const ex = Math.cos(1.4) * 6, ey = Math.sin(1.4) * 6; ctx.beginPath(); ctx.moveTo(ex + 4.2, ey - 0.6); ctx.lineTo(ex, ey); ctx.lineTo(ex + 1.2, ey - 4.4); ctx.stroke(); }
      else if (h.id === "flip") { ctx.moveTo(-6, -2.5); ctx.lineTo(6, -2.5); ctx.moveTo(3, -5.5); ctx.lineTo(6, -2.5); ctx.lineTo(3, 0.5); ctx.moveTo(6, 3); ctx.lineTo(-6, 3); ctx.moveTo(-3, 0); ctx.lineTo(-6, 3); ctx.lineTo(-3, 6); ctx.stroke(); }
      else { ctx.moveTo(-4.5, -4.5); ctx.lineTo(4.5, 4.5); ctx.moveTo(4.5, -4.5); ctx.lineTo(-4.5, 4.5); ctx.stroke(); }
      ctx.restore();
    }
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
      PurikuraArt.draw(ctx, ph, v.x, v.y, v.w, { frame: this.phase === "deco", ...(this.phase === "deco" ? { t: this.clock } : {}) });
      if (this.phase === "deco") this.drawPick(ctx);
      if (this.phase === "shoot") {
        // カメラの しるし（すみの かぎ・REC）
        ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 3; const c = 16;
        for (const [x, y, sx, sy] of [[v.x + 8, v.y + 8, 1, 1], [v.x + v.w - 8, v.y + 8, -1, 1], [v.x + 8, v.y + v.h - 8, 1, -1], [v.x + v.w - 8, v.y + v.h - 8, -1, -1]]) { ctx.beginPath(); ctx.moveTo(x, y + c * sy); ctx.lineTo(x, y); ctx.lineTo(x + c * sx, y); ctx.stroke(); }
        ctx.fillStyle = Math.floor(this.clock * 2) % 2 ? "#FF5A6E" : "rgba(255,90,110,0.4)"; ctx.beginPath(); ctx.arc(v.x + 22, v.y + 24, 5, 0, 7); ctx.fill();
        ctx.font = "900 13px 'M PLUS Rounded 1c', sans-serif"; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillStyle = "#FFFFFF"; ctx.fillText(`${Math.min(this.shots.length + 1, Purikura.SHOTS)} / ${Purikura.SHOTS}`, v.x + 32, v.y + 24);
        // えらんで いる 人の あたまの うえに ▼・はじめは「3人を ゆびで うごかせるよ」
        const k = v.w / Purikura.PW, L = PurikuraArt.LAYOUT[this.z ? 1 : 0], q = this.who !== "all" && PurikuraArt.placed(ph).find((o) => o.id === this.who);
        if (q) { const x = v.x + q.x * k, y = Math.max(v.y + 14, v.y + (q.y - L.S * 0.98) * k), b = Math.sin(this.clock * 5) * 3; ctx.fillStyle = "#FF5A8E"; ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 9, y - 10 + b); ctx.lineTo(x + 9, y - 10 + b); ctx.lineTo(x, y + 2 + b); ctx.closePath(); ctx.stroke(); ctx.fill(); }
        if (!this.moved && !this.count) { ctx.font = "900 13px 'M PLUS Rounded 1c', sans-serif"; ctx.textAlign = "center"; ctx.lineWidth = 4; ctx.strokeStyle = "rgba(31,29,27,0.75)"; ctx.strokeText("3人を ゆびで うごかせるよ", v.x + v.w / 2, v.y + v.h - 16, v.w - 20); ctx.fillStyle = "#FFFFFF"; ctx.fillText("3人を ゆびで うごかせるよ", v.x + v.w / 2, v.y + v.h - 16, v.w - 20); }
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
