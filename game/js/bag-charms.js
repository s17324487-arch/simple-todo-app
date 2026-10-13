// バッグ・ポーチの チャーム（UI-123。オーナーの 指示 2026-10-13「バッグやポーチにつけられるアイテムも追加、修正してほしい。
// なお、既存の目印アクセサリーやミニフィギュアはバックやポーチにつけられるようにしてほしい。」）。
// ・きがえに あたらしい しゅるい「チャーム」（outfit.charm）。もちもの（outfit.hand）が バッグ・ポーチの ときだけ、その バッグに さがる。
//   バッグ: トート・かご・ポシェット（js/hand-items.js）・ガチャの どうぶつ／おやつ ポーチ・いちばんくじの バッグ 4しゅ（ひとりの くじ・みんなの くじ）。
//   バッグを もって いない ときは みえない（きがえの カードに「バッグや ポーチを もつと つくよ」）。
// ・つけられる もの:
//   1. あたらしい チャーム 10しゅ（ようふくやさんの「チャーム」の たなで かう。1こで ひとり・WearStock は ほかの ふくと おなじ）
//   2. もって いる めじるし アクセサリー（ガチャの めじるし 12しゅ。もちものの まま でも つけられる）
//   3. もって いる ミニフィギュア（クレーンの ミニマスコット 10しゅ と フィギュアだいに かざれる フィギュア。家具の まま でも つけられる）
//   2・3 は ITEM_INDEX にだけ いれる（charm_<もとの id>・WEAR_ITEMS に いれない ので おみせ・ずかん・ふくの かずには でない。3人 みんな つけられる）。
// ・絵: バッグの はしの わっか（手に さげる バッグは そとがわの うえ・かたから かける ポーチは よこ）から くさりで さがる（たかさ やく 24）。
//   2・3 は もとの アイコン（Art.iconSvg）を ちいさく いれる（3人の 絵の キャッシュの キーは もとの id ＝ 有限）。
// ・セーブ: outfit.charm に はいる だけ（Save.SCHEMA は 2 の まま）。もって いない めじるし・フィギュアは きがえを ひらいた ときに はずす。
const BagCharms = {
  SLOT: "charm", TAB: "チャーム", PREFIX: "charm_", SIZE: 24,
  // バッグの しゅるい（wear → hand 手に さげる ／ cross かたから かける）
  BAGS: { hi_tote: "hand", hi_basket: "hand", kuji_bag: "hand", kuji_dbag: "hand", kuji_rbag: "hand", kuji_ndbag: "hand", hi_pochette: "cross", gacha_pouch: "cross" },
  ITEMS: [
    { id: "bc_pompom_pink", name: "ポンポン チャーム", col: ["pompom", "#F8A5C2", "#FFFFFF"], price: 140, st: { sp: 1 }, desc: "ふわふわの ピンクの ポンポン" },
    { id: "bc_pompom_mint", name: "ミントの ポンポン", col: ["pompom", "#9EDBC8", "#FFFFFF"], price: 140, st: { spd: 1 }, desc: "ふわふわの ミントいろの ポンポン" },
    { id: "bc_ribbon", name: "リボン チャーム", col: ["ribbon", "#E86F8E", "#FFD1DC"], price: 160, st: { sp: 1 }, desc: "サテンの リボンを むすんだ チャーム" },
    { id: "bc_heart", name: "ハートの チャーム", col: ["heart", "#F06292", "#FFE0EA"], price: 180, st: { hp: 2 }, desc: "つやつやの ハートの キーホルダー" },
    { id: "bc_strawberry", name: "いちごの チャーム", col: ["strawberry", "#E53950", "#7CC36A"], price: 180, st: { hp: 1, sp: 1 }, desc: "まっかな いちごの マスコット" },
    { id: "bc_star", name: "ほしの チャーム", col: ["star", "#FFD54F", "#FFF6C8"], price: 180, st: { spd: 1, sp: 1 }, desc: "きらきらの おほしさまの キーホルダー" },
    { id: "bc_clover", name: "クローバー チャーム", col: ["clover", "#7CC36A", "#D8F0C8"], price: 200, st: { def: 1, sp: 1 }, desc: "よつばの クローバー。いい こと ありそう" },
    { id: "bc_bell", name: "すずの チャーム", col: ["bell", "#F2C14E", "#E86F8E"], price: 200, st: { def: 1 }, desc: "あるくと ちりんと なる すず" },
    { id: "bc_cat", name: "ねこの チャーム", col: ["cat", "#FFFFFF", "#F59AC0"], price: 240, st: { spd: 1, hp: 1 }, desc: "まんまるの しろねこの マスコット" },
    { id: "bc_trio", name: "3にんの アクリル チャーム", col: ["trio", "#BFE6F7", "#FFFFFF"], price: 320, st: { hp: 2, sp: 2 }, desc: "わんこ・がちゃん・ごじの アクリル キーホルダー" },
  ],
  proxies: [], // めじるし・ミニフィギュアの charm_<id>
  isCharm(wid) { const it = ITEM_INDEX[wid]; return !!(it && it.slot === this.SLOT); },
  isProxy(wid) { const it = ITEM_INDEX[wid]; return !!(it && it.charmProxy); },
  // もって いる めじるし・ミニフィギュア（きがえの「チャーム」に だす）
  owned(d = Save.d) {
    if (!d) return [];
    return this.proxies.map((id) => ITEM_INDEX[id]).filter((it) => (it.col[0] === "wear" ? !!d.wardrobe[it.col[1]] : (d.furn && d.furn[it.col[1]]) > 0));
  },
  // もって いない めじるし・フィギュアの チャームを はずす（きがえを ひらく とき）
  fix(d = Save.d) {
    if (!d || !d.chars) return 0;
    const ok = new Set(this.owned(d).map((it) => it.id));
    let n = 0;
    for (const id of Object.keys(d.chars)) { const o = d.chars[id].outfit; if (o && o.charm && this.isProxy(o.charm) && !ok.has(o.charm)) { o.charm = null; n++; } }
    if (n) Save.mark();
    return n;
  },
  // バッグの わっかの ばしょ（キャラの 絵の ざひょう）。バッグで なければ null
  anchor(ctx, wear) {
    const kind = this.BAGS[wear];
    if (!kind) return null;
    if (kind === "hand") { const h = HandItems.hand(ctx), x = U.clamp(h.x + h.side * 3, 18, 184), y0 = h.y + 9; return { x: U.clamp(x + h.side * 13, 10, 210), y: y0 + 3, side: h.side }; }
    const T = ctx.a.torso, sgn = ctx.view === "back" ? -1 : 1, px = T.cx + sgn * T.w * 0.47, py = U.clamp(T.bottom - 23, T.top + 27, 200);
    return { x: U.clamp(px + sgn * 10, 10, 210), y: py - 3, side: sgn };
  },
  // くさりと わっか（ax, ay から dy さがる）
  chain(ax, ay, dy) {
    let s = `<circle cx="${f2(ax)}" cy="${f2(ay)}" r="2.6" fill="none" stroke="#B9BEC8" stroke-width="1.8"/>`;
    for (let y = ay + 3.2; y < ay + dy - 1; y += 3) s += `<ellipse cx="${f2(ax)}" cy="${f2(y)}" rx="1.1" ry="1.6" fill="none" stroke="#9AA0AC" stroke-width="1"/>`;
    return s;
  },
  // あたらしい チャームの 絵（まんなか x, y・おおきさ やく 22）
  shape(kind, x, y, c, c2) {
    const S = (w = 2.2) => stroke(w);
    if (kind === "pompom") { let s = ""; for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; s += `<circle cx="${f2(x + Math.cos(a) * 7.5)}" cy="${f2(y + Math.sin(a) * 7.5)}" r="4.6" fill="${c}"/>`; } return s + `<circle cx="${f2(x)}" cy="${f2(y)}" r="10.2" fill="none" ${S(1.6)} stroke-dasharray="2.2 2.4"/><circle cx="${f2(x)}" cy="${f2(y)}" r="7" fill="${c}"/><circle cx="${f2(x - 3)}" cy="${f2(y - 3)}" r="2.4" fill="${c2}" opacity=".85"/>`; }
    if (kind === "ribbon") return `<path d="M${f2(x)},${f2(y - 2)} C${f2(x - 6)},${f2(y - 12)} ${f2(x - 14)},${f2(y - 8)} ${f2(x - 12)},${f2(y)} C${f2(x - 10)},${f2(y + 6)} ${f2(x - 4)},${f2(y + 3)} ${f2(x)},${f2(y - 2)} Z M${f2(x)},${f2(y - 2)} C${f2(x + 6)},${f2(y - 12)} ${f2(x + 14)},${f2(y - 8)} ${f2(x + 12)},${f2(y)} C${f2(x + 10)},${f2(y + 6)} ${f2(x + 4)},${f2(y + 3)} ${f2(x)},${f2(y - 2)} Z" fill="${c}" ${S(2)}/><path d="M${f2(x - 2)},${f2(y)} L${f2(x - 6)},${f2(y + 11)} M${f2(x + 2)},${f2(y)} L${f2(x + 6)},${f2(y + 11)}" stroke="${c}" stroke-width="3.4" stroke-linecap="round"/><circle cx="${f2(x)}" cy="${f2(y - 2)}" r="3" fill="${c2}" ${S(1.6)}/>`;
    if (kind === "heart") return `<path d="${heartPath(x, y, 0.95)}" fill="${c}" ${S(2.2)}/><ellipse cx="${f2(x - 4)}" cy="${f2(y - 3)}" rx="2.4" ry="1.5" fill="${c2}" transform="rotate(-30 ${f2(x - 4)} ${f2(y - 3)})"/>`;
    if (kind === "strawberry") { let s = `<path d="M${f2(x - 9)},${f2(y - 4)} C${f2(x - 10)},${f2(y + 6)} ${f2(x - 3)},${f2(y + 11)} ${f2(x)},${f2(y + 11)} C${f2(x + 3)},${f2(y + 11)} ${f2(x + 10)},${f2(y + 6)} ${f2(x + 9)},${f2(y - 4)} C${f2(x + 5)},${f2(y - 7)} ${f2(x - 5)},${f2(y - 7)} ${f2(x - 9)},${f2(y - 4)} Z" fill="${c}" ${S(2.2)}/>`; for (const [dx, dy] of [[-4, -1], [3, -1], [-1, 3], [4, 4], [-4, 5], [0, 7]]) s += `<ellipse cx="${f2(x + dx)}" cy="${f2(y + dy)}" rx="0.8" ry="1.2" fill="#FFF3B0"/>`; return s + `<path d="M${f2(x - 7)},${f2(y - 5)} L${f2(x - 3)},${f2(y - 9)} L${f2(x)},${f2(y - 6)} L${f2(x + 3)},${f2(y - 9)} L${f2(x + 7)},${f2(y - 5)} Z" fill="${c2}" ${S(1.6)}/>`; }
    if (kind === "star") return `<path d="${starPath(x, y + 1, 11, 5.2)}" fill="${c}" ${S(2.2)}/><circle cx="${f2(x - 2.6)}" cy="${f2(y - 1.4)}" r="1.8" fill="${c2}"/>`;
    if (kind === "clover") { let s = ""; for (const [dx, dy] of [[0, -4.6], [4.6, 0], [0, 4.6], [-4.6, 0]]) s += `<circle cx="${f2(x + dx)}" cy="${f2(y - 2 + dy)}" r="4.6" fill="${c}" ${S(1.6)}/>`; return s + `<circle cx="${f2(x)}" cy="${f2(y - 2)}" r="2" fill="${c2}"/><path d="M${f2(x)},${f2(y + 2)} Q${f2(x + 2)},${f2(y + 8)} ${f2(x + 5)},${f2(y + 11)}" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`; }
    if (kind === "bell") return `<path d="M${f2(x - 9)},${f2(y + 6)} C${f2(x - 9)},${f2(y - 4)} ${f2(x - 5)},${f2(y - 9)} ${f2(x)},${f2(y - 9)} C${f2(x + 5)},${f2(y - 9)} ${f2(x + 9)},${f2(y - 4)} ${f2(x + 9)},${f2(y + 6)} Z" fill="${c}" ${S(2.2)}/><path d="M${f2(x - 9)},${f2(y + 6)} H${f2(x + 9)}" ${S(2.2)}/><circle cx="${f2(x)}" cy="${f2(y + 7.5)}" r="2.4" fill="${shade(c, -0.25)}" ${S(1.4)}/><path d="M${f2(x - 6)},${f2(y - 4)} L${f2(x - 3)},${f2(y - 2)} L${f2(x - 6)},${f2(y)}" fill="none" stroke="${c2}" stroke-width="2" stroke-linecap="round"/><path d="M${f2(x - 8)},${f2(y + 1)} C${f2(x - 6)},${f2(y + 3)} ${f2(x + 6)},${f2(y + 3)} ${f2(x + 8)},${f2(y + 1)}" fill="none" stroke="${c2}" stroke-width="2.4"/>`;
    if (kind === "cat") return `<path d="M${f2(x - 9)},${f2(y - 2)} L${f2(x - 8)},${f2(y - 11)} L${f2(x - 3)},${f2(y - 7)} L${f2(x + 3)},${f2(y - 7)} L${f2(x + 8)},${f2(y - 11)} L${f2(x + 9)},${f2(y - 2)} C${f2(x + 10)},${f2(y + 7)} ${f2(x - 10)},${f2(y + 7)} ${f2(x - 9)},${f2(y - 2)} Z" fill="${c}" ${S(2.2)}/><circle cx="${f2(x - 3.6)}" cy="${f2(y - 1)}" r="1.4" fill="${INK}"/><circle cx="${f2(x + 3.6)}" cy="${f2(y - 1)}" r="1.4" fill="${INK}"/><path d="M${f2(x - 1.6)},${f2(y + 2)} Q${f2(x)},${f2(y + 3.6)} ${f2(x + 1.6)},${f2(y + 2)}" fill="none" stroke="${INK}" stroke-width="1.2"/><ellipse cx="${f2(x - 6)}" cy="${f2(y + 2)}" rx="1.8" ry="1.1" fill="${c2}"/><ellipse cx="${f2(x + 6)}" cy="${f2(y + 2)}" rx="1.8" ry="1.1" fill="${c2}"/>`;
    // 3にんの アクリル: すきとおった いたに 3人の かお
    let s = `<rect x="${f2(x - 12)}" y="${f2(y - 9)}" width="24" height="18" rx="5" fill="${c}" fill-opacity=".75" ${S(2)}/>`;
    s += `<circle cx="${f2(x - 6.5)}" cy="${f2(y + 1)}" r="4.4" fill="#FFFFFF" ${S(1.2)}/><circle cx="${f2(x - 10)}" cy="${f2(y - 1)}" r="1.8" fill="${INK}"/><circle cx="${f2(x - 3)}" cy="${f2(y - 1)}" r="1.8" fill="${INK}"/>`;
    s += `<circle cx="${f2(x)}" cy="${f2(y + 1)}" r="4.4" fill="#FFE07A" ${S(1.2)}/><path d="M${f2(x - 1.4)},${f2(y + 2)} L${f2(x)},${f2(y + 3.6)} L${f2(x + 1.4)},${f2(y + 2)} Z" fill="#F59A3B"/>`;
    s += `<rect x="${f2(x + 2.6)}" y="${f2(y - 3)}" width="8" height="8.4" rx="3.4" fill="#8F8A86" ${S(1.2)}/><path d="M${f2(x + 4.2)},${f2(y + 1.4)} H${f2(x + 9.2)}" stroke="#E53950" stroke-width="1.6"/>`;
    return s;
  },
  draw(ctx) {
    const A = ctx.charmAt; if (!A) return {};
    const dy = 7, cy = A.y + dy + this.SIZE / 2 - 1, x = A.x, chain = this.chain(x, A.y, dy + 1);
    let body = "";
    if (ctx.col[0] === "wear" || ctx.col[0] === "furn") { // めじるし・ミニフィギュア（col: [しゅるい, もとの id]）
      const [kind, id] = ctx.col;
      const icon = typeof Art !== "undefined" ? Art.iconSvg(kind === "wear" ? "wear" : "furn", id) : "";
      if (!icon) return {};
      const s = this.SIZE + (kind === "wear" ? 6 : 0);
      body = icon.replace(/ width="[^"]*"/, "").replace(/ height="[^"]*"/, "").replace("<svg ", `<svg x="${f2(x - s / 2)}" y="${f2(A.y + dy - 1)}" width="${s}" height="${s}" preserveAspectRatio="xMidYMin meet" `);
    } else body = this.shape(ctx.col[0], x, cy, ctx.col[1], ctx.col[2]);
    return { top: chain + body };
  },
};

// ---- ゲームに いれる（hold-plush.js の あと＝家具・ガチャの ふく・フィギュアが そろった あと）----
(() => {
  // あたらしい チャーム
  for (const it of BagCharms.ITEMS) { const w = { ...it, slot: BagCharms.SLOT, wear: "bc_charm" }; WEAR_ITEMS.push(w); ITEM_INDEX[w.id] = w; }
  // めじるし アクセサリー と ミニフィギュア（ミニマスコット・フィギュアだいの フィギュア）
  const add = (kind, id, name) => { const pid = BagCharms.PREFIX + id; if (ITEM_INDEX[pid]) return; ITEM_INDEX[pid] = { id: pid, name, slot: BagCharms.SLOT, wear: "bc_charm", col: [kind, id], price: 0, charmProxy: true, exclusive: "charm", desc: `${name}を バッグや ポーチに つける` }; BagCharms.proxies.push(pid); };
  for (const w of WEAR_ITEMS.filter((w) => w.wear === "gacha_mejirushi")) add("wear", w.id, w.name);
  const mini = (f) => (typeof ArcadePrizes !== "undefined" && ArcadePrizes.INDEX && ArcadePrizes.INDEX[f.id] && ArcadePrizes.INDEX[f.id].size === "mini") || (typeof FigureStand !== "undefined" && FigureStand.isFigure && FigureStand.isFigure(f.id));
  for (const f of FURNITURE.filter(mini)) add("furn", f.id, f.name);
  // 絵: もちものの バッグが わっかの ばしょを おいて、チャームが そこに さがる（SLOT_ORDER で hand の あと）
  WEAR.bc_charm = (ctx) => BagCharms.draw(ctx);
  for (const wear of Object.keys(BagCharms.BAGS)) {
    const base = WEAR[wear]; if (typeof base !== "function") continue;
    WEAR[wear] = (ctx) => { const r = base(ctx); ctx.charmAt = BagCharms.anchor(ctx, wear); return r; };
  }
  if (!SLOT_ORDER.includes(BagCharms.SLOT)) SLOT_ORDER.push(BagCharms.SLOT);
  if (BUY_SHOPS.clothes && !BUY_SHOPS.clothes.tabs.some((t) => t[0] === BagCharms.SLOT)) BUY_SHOPS.clothes.tabs.push([BagCharms.SLOT, BagCharms.TAB]);
  // アイコン（おみせ・きがえ・ずかん）: チャームだけ
  const icon = Art.iconSvg;
  Art.iconSvg = function (kind, id) {
    const it = kind === "wear" && ITEM_INDEX[id];
    if (!it || it.slot !== BagCharms.SLOT) return icon.apply(this, arguments);
    if (it.charmProxy) return icon.call(this, it.col[0] === "wear" ? "wear" : "furn", it.col[1]);
    const inner = `<g class="content">${BagCharms.chain(30, 4, 8)}${BagCharms.shape(it.col[0], 30, 23, it.col[1], it.col[2])}</g>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="14 0 32 40">${inner}</svg>`;
  };
})();
