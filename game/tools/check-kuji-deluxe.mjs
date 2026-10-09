// みんなの くじの ごうかな けいひん（UI-101。js/ichiban-kuji.js の DELUXE・絵は js/kuji-deluxe-art.js・がめんは js/kuji-ui.js）の 検査。ブラウザ なしで:
// 1. よみこみ（kuji-art.js の あと・ichiban-kuji.js の まえ・sw.js）
// 2. データ: 2つの コンビニ・ひとりの くじと おなじ ほんすう（80まい）・ちがう けいひん（id・なまえ・シール）・なまえと せつめいは かな
// 3. ごうか: どの 賞も ひとりの くじ より おおきい／いごこちが よい・もちものは つよい・クーポンは 3まい・シールは 6まい・ラストワンは いちばん ごうか
// 4. ゲームに いれる: 家具（ゆか・ラグ）・フィギュア だい・もちもの（kuji_dbag）・シールちょう・おみせに ならばない・ずかんの ヒント（「みんなの くじ」）
// 5. 絵: SVG（NaN なし・おなじ 属性が 2かい ない・線は INK・id なし）・ぬいぐるみの タグ・シール 100×100・3人 × 4むき で もてる・へやの 立体・さわる うごき
// 6. もらう: クーポン 3まい・シール 6まい・コンプリートは ひとりの くじと べつ（done.net_<みせ>）・KujiNet.derive は この けいひんを つかう
// 7. がめん（KujiUI の みんなの くじ）・PokaDebug・ことば・キラキラ なし・そとへ つうしん しない
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";
const R = gameContext();
const { IchibanKuji: K, KujiArt: A, KujiDeluxeArt: DA, KujiNet: KN, StickerBook: SB, Save: S } = R;
// いちばんくじの けいひんは 2しゅうかん ごとに いれかわる（UI-112）。ここでは まえからの セットの きかん（2026-10-19〜11-01）に きめる
R.U.today = () => "2026-10-20";
R.UI.updateHud = () => {}; R.UI.toast = () => {};
const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
let n = 0;
const ok = (c, m) => { n++; assert(c, m); };
const KANJI = /[一-鿿]/, INK = R.INK || "#1F1D1B";
const sum = (a) => a.reduce((x, y) => x + y, 0);
const dupAttr = (s) => { for (const m of s.matchAll(/<[a-zA-Z][^<>]*>/g)) { const names = [...m[0].matchAll(/\s([a-zA-Z_:][-a-zA-Z0-9_:.]*)="/g)].map((x) => x[1]); if (new Set(names).size !== names.length) return m[0].slice(0, 90); } return ""; };
const svgOk = (s) => typeof s === "string" && s.startsWith("<svg") && s.trim().endsWith("</svg>") && !/NaN|undefined|null|Infinity/.test(s) && !dupAttr(s) && s.includes(INK);

// ---- 1. よみこみ ----
const html = read("index.html"), sw = read("sw.js"), pos = (f) => html.indexOf(`<script src="js/${f}"></script>`);
ok(pos("kuji-deluxe-art.js") > pos("kuji-art.js") && pos("kuji-deluxe-art.js") < pos("ichiban-kuji.js") && pos("kuji-art.js") > 0 && sw.includes('"./js/kuji-deluxe-art.js"'), "kuji-deluxe-art.js は kuji-art.js の あと・ichiban-kuji.js の まえ・sw.js にも");
const src = read("js/kuji-deluxe-art.js");
ok(!/fetch\(|XMLHttpRequest|WebSocket|sendBeacon|localStorage/.test(src) && (src.match(/https?:\/\/[^"'`\s]+/g) || []).every((u) => u === "http://www.w3.org/2000/svg"), "kuji-deluxe-art.js は そとへ つうしん しない");
ok(!/kira|sparkle|twinkle|glitter/i.test(src) && !/<linearGradient|<radialGradient|<clipPath| id="/.test(src), "キラキラの えんしゅつ・グラデーション・SVG の id は つかわない（UI-50）");

// ---- 2. データ ----
ok(K.DELUXE.length === 2 && K.DELUXE.map((X) => X.id).join() === K.STORES.join() && K.STORES.every((s) => K.NET_BY[s] && K.NET_BY[s] !== K.BY[s]), "みんなの くじの けいひんは 2つの コンビニ（ひとりの くじと べつ）");
const NET = K.ITEMS.filter((it) => it.net), SOLO = K.ITEMS.filter((it) => !it.net);
ok(NET.length === 48 && NET.every((it) => /^kj_m(law|sev)_[a-z0-9]+$/.test(it.id) && K.INDEX[it.id] === it) && !NET.some((it) => SOLO.some((x) => x.id === it.id)), "けいひん 48しゅ（24しゅ × 2・id は kj_m<みせ>_）");
for (const X of K.DELUXE) {
  const O = K.BY[X.id], mine = NET.filter((it) => it.store === X.id);
  ok(mine.length === 24 && X.lineup.length === 24 && X.total === 80 && X.lineup.includes(X.lastId) && X.dcId === O.dcId && !X.lineup.includes(X.dcId), `${X.shop}: 24しゅ（ラストワン いり）・80まい・ダブルチャンスしょうは ひとりの くじと おなじ`);
  for (const g of K.GRADES) ok(X.ids[g].length === K.PLAN[g].length && X.ids[g].every((id, k) => X.plan[id] === K.PLAN[g][k] && K.INDEX[id].grade === g && K.INDEX[id].net), `${X.shop} ${g}しょう: しゅるいと ほんすうは ひとりの くじと おなじ`);
  ok(X.shop === O.shop && X.title !== O.title && X.title && !KANJI.test(X.title) && X.color && X.light && X.dark, `${X.shop}: シリーズの なまえ「${X.title}」・いろ`);
  ok(X.lineup.every((id, i) => K.INDEX[id].name !== K.INDEX[O.lineup[i]].name) && new Set(mine.map((it) => it.name)).size === mine.length, `${X.shop}: ひとりの くじと ちがう けいひん（なまえも かさならない）`);
  for (const it of mine) ok(it.name && !KANJI.test(it.name) && it.name.length <= 20 && it.desc && !KANJI.test(it.desc) && it.desc.length <= 60, `${it.id}: なまえ・せつめい（かな・ながさ）`);
  for (const g of K.GRADES) ok(X.cats[g] && !KANJI.test(X.cats[g]) && X.cats[g].length <= 12, `${X.shop} ${g}しょうの しゅるいの なまえ`);
  ok(["A", "B", "C"].every((g) => K.INDEX[X.ids[g][0]].kind === "plush") && new Set(["A", "B", "C"].map((g) => K.INDEX[X.ids[g][0]].who)).size === 3 && K.INDEX[X.lastId].kind === "plush" && K.INDEX[X.lastId].who === "trio", `${X.shop}: A〜Cしょうは 3人の とくだい ぬいぐるみ・ラストワンは 3にん`);
  ok(X.ids.F.every((id) => K.INDEX[id].kind === "bag") && X.ids.H.every((id) => K.INDEX[id].kind === "coupon") && X.ids.I.every((id) => K.INDEX[id].kind === "sheet"), `${X.shop}: F もちもの・H クーポン・I シール`);
  ok(X.stickers.length === 6 && X.stickers.every(([id, name]) => /^stk_kjm(law|sev)_[a-z]+$/.test(id) && !O.stickers.some(([x]) => x === id) && name && !KANJI.test(name) && name.length <= 10), `${X.shop}: シール 6しゅ（ひとりの くじと ちがう）`);
}
const [LD, SD] = K.DELUXE;
ok(LD.ids.D.every((id) => K.INDEX[id].kind === "chair") && SD.ids.D.every((id) => K.INDEX[id].kind === "zabuton") && LD.ids.E.every((id) => K.INDEX[id].kind === "teacup") && SD.ids.E.every((id) => K.INDEX[id].kind === "brocade") && LD.ids.G.every((id) => K.INDEX[id].kind === "frame") && SD.ids.G.every((id) => K.INDEX[id].kind === "maneki"), "ローリソン と せぶんぶん で ちがう（D: チェア／ざぶとん・E: ティーカップ／ラグ・G: がくぶち／ふくまねき）");
ok(LD.items.A[0][1].includes("おうかん") && SD.items.A[0][1].includes("だるま") && LD.title.includes("ロイヤル") && SD.title.includes("おしょうがつ"), "テーマ（ロイヤル パーティー・ごうか おしょうがつ）");

// ---- 3. ごうか（ひとりの くじ より）----
for (const X of K.DELUXE) {
  const O = K.BY[X.id];
  for (const g of K.GRADES) X.ids[g].forEach((id, k) => {
    const a = K.INDEX[id], b = K.INDEX[O.ids[g][k]];
    if (a.furn && b.furn) ok(a.comfort > b.comfort, `${id}: いごこちが ${b.id} より よい（${a.comfort} > ${b.comfort}）`);
    if (a.kind === "plush") ok(a.w * a.h > b.w * b.h * 1.25 && a.h > b.h, `${id}: ${b.id} より おおきい（${a.w}×${a.h}）`);
    if (a.kind === "bag") ok(sum(Object.values(a.st)) > sum(Object.values(b.st)), `${id}: もちものが つよい ${JSON.stringify(a.st)}`);
    if (a.kind === "coupon") ok(a.uses === 3 && !b.uses && a.item === b.item, `${id}: クーポンは 3まい（${b.id} は 1まい・おなじ しなもの）`);
    if (a.kind === "sheet") ok(sum(a.stickers.map(([, c]) => c)) === 6 && sum(b.stickers.map(([, c]) => c)) === 4 && a.stickers.every(([sid]) => X.stickers.some(([x]) => x === sid)), `${id}: シールは 6まい（ひとりの くじは 4まい）`);
  });
  const L = K.INDEX[X.lastId], OL = K.INDEX[O.lastId];
  ok(L.comfort > OL.comfort && L.comfort === Math.max(...NET.filter((it) => it.store === X.id && it.furn).map((it) => it.comfort)) && L.w * L.h > OL.w * OL.h, `${X.shop}: ラストワンしょうが いちばん ごうか（${L.comfort}）`);
  ok(X.stickers.every(([sid]) => X.ids.I.some((id) => K.INDEX[id].stickers.some(([x]) => x === sid))), `${X.shop}: シール 6しゅ ぜんぶが どれかの シートに ある`);
}

// ---- 4. ゲームに いれる ----
for (const it of NET) {
  if (it.furn) {
    const f = R.FURN_INDEX[it.id], kind = it.kind === "brocade" ? "rug" : "floor";
    ok(f && f.kind === kind && f.price === 0 && f.rare && f.exclusive === "kuji" && f.kujiPrize === it.store && f.w === it.w && f.h === it.h && f.comfort === it.comfort && typeof R.FURN_ART[it.id] === "function" && !R.ITEM_INDEX[it.id], `${it.id}: 家具（${kind}）`);
    ok(!!f.figure === it.fig && R.FigureStand.isFigure(it.id) === it.fig && it.fig === ["teacup", "frame", "maneki"].includes(it.kind), `${it.id}: フィギュア だいに ${it.fig ? "かざれる" : "かざれない"}`);
    const hint = R.ItemDexSources.source("furn", f);
    ok(/いちばんくじ「みんなの くじ」/.test(hint) && hint.includes(K.BY[it.store].shop), `${it.id}: ずかんの ヒント「${hint}」`);
  } else if (it.kind === "bag") {
    const w = R.ITEM_INDEX[it.id];
    ok(w && w.slot === "hand" && w.wear === "kuji_dbag" && w.col[0] === it.store && w.col[1] === it.who && w.exclusive === "kuji" && typeof R.WEAR.kuji_dbag === "function" && /みんなの くじ/.test(R.ItemDexSources.source("wear", w)), `${it.id}: もちもの（kuji_dbag・ずかんの ヒント）`);
  } else ok(!R.FURN_INDEX[it.id] && !R.ITEM_INDEX[it.id], `${it.id}: 家具・服に はいらない（${it.kind}）`);
}
for (const shop of Object.values(R.BUY_SHOPS)) for (const tab of ["hand", "floor", "wall", "food", "goods", ""]) {
  let list = []; try { list = shop.items(tab) || []; } catch (e) { list = []; }
  ok(!list.some((i) => i && K.INDEX[i.id] && K.INDEX[i.id].net), `おみせ ${shop.name} に みんなの くじの けいひんが ならぶ`);
}
for (const X of K.DELUXE) ok(X.stickers.every(([id, name]) => SB.INDEX[id] && SB.INDEX[id].series === X.id && SB.INDEX[id].name === name && /いちばんくじ「みんなの くじ」/.test(SB.INDEX[id].hint) && SB.groupOf(SB.INDEX[id]) === "kuji"), `${X.shop}: シール 6しゅが シールちょうに ある（ヒント・くじの まとまり）`);

// ---- 5. 絵 ----
for (const it of NET) {
  const s = A.pic(it.id), s2 = A.pic(it.id);
  ok(svgOk(s), `${it.id}: 絵の SVG（NaN なし・おなじ 属性が 2かい ない・線は INK）`);
  const ids = (x) => [...x.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]), a = ids(s);
  ok(new Set(a).size === a.length && ids(s2).every((x) => !a.includes(x)), `${it.id}: SVG の id（かさならない・よぶ たびに あたらしい）`);
  if (it.kind === "plush") ok(/viewBox="0 0 (1[0-9]{2}) (1[0-9]{2})"/.test(s) && !/<text/.test(s) && /#FFFDF5/.test(s) && /#E8B83A/.test(s), `${it.id}: とくだい ぬいぐるみ（タグ・きんいろ・もじ なし）`);
  if (it.kind === "coupon") ok(/むりょう/.test(s) && /3まい/.test(s) && /textLength="42"/.test(s), `${it.id}: クーポン（むりょう・3まい・もじの はばを きめる）`);
  if (it.kind === "sheet") ok((s.match(/<svg /g) || []).length >= 7, `${it.id}: シートに シール 6まい`);
  if (it.furn && it.kind !== "brocade") { const fa = R.FURN_ART[it.id](); ok(svgOk(fa), `${it.id}: へやの 絵（FURN_ART）`); }
}
for (const X of K.DELUXE) for (const [id] of X.stickers) {
  const s = R.StickerArt.piece(id);
  ok(svgOk(s) && /viewBox="0 0 100 100"/.test(s) && !/<text/.test(s) && s.includes('fill="#FFFFFF" stroke="#FFFFFF"'), `シール ${id}（100×100・しろい ふち・もじ なし）`);
}
for (const s of K.STORES) { const b = A.box(s, true), b0 = A.box(s); ok(svgOk(b) && b !== b0 && b.includes("#E8B83A"), `${s}: みんなの くじの はこ（きんの おび）`); }
for (const X of K.DELUXE) for (const id of X.ids.F) for (const who of ["wanko", "gachan", "goji"]) for (const dir of ["down", "up", "left", "right"]) {
  const s = R.Chara.svg(who, { pose: "idle_01", dir, outfit: { hand: id }, color: "soft" });
  ok(svgOk(s) && s.length > R.Chara.svg(who, { pose: "idle_01", dir, outfit: {}, color: "soft" }).length, `${id}: ${who} ${dir} で もてる`);
}
for (const it of NET.filter((x) => x.furn)) {
  const m = R.HomeDesign.model(it.id, { id: it.id });
  ok(m && m.full && svgOk(m.full) && m.w > 0 && m.h > 0, `${it.id}: へやの 立体`);
  if (["plush", "chair", "zabuton"].includes(it.kind)) ok(R.FurnLive.has ? R.FurnLive.has(it.id) : R.FURN_INDEX[it.id].interactive, `${it.id}: さわると うごく`);
}
ok(DA.LIVE.chair.lines.length >= 3 && DA.LIVE.zabuton.lines.length >= 3 && A.LIVE.royal.lines.length >= 3 && [...DA.LIVE.chair.lines, ...DA.LIVE.zabuton.lines, ...A.LIVE.royal.lines].every((t) => !KANJI.test(t) && t.length <= 24), "さわった ときの ひとこと（かな・24もじ まで）");

// ---- 6. もらう ----
S.d = S.fresh(); S.d.coins = 0;
const cpn = K.grant("kj_mlaw_h0");
ok(K.st().coupons.kj_mlaw_h0 === 3 && /3かい つかえるよ/.test(cpn.note), "クーポンは 3まい（3かい つかえる）");
const cp = K.couponFor("lawson", R.BAG_INDEX.karaage);
ok(cp && cp.id === "kj_mlaw_h0" && /のこり 3まい/.test(cp.label) && cp.use() && K.st().coupons.kj_mlaw_h0 === 2 && S.d.bag.karaage === 1, "みんなの くじの クーポンも その コンビニで つかえる（3まいから 1まい）");
ok(K.couponFor("sevenbun", R.BAG_INDEX.karaage) === null, "ほかの コンビニでは つかえない");
const sh = K.grant("kj_msev_i0");
ok(SB.have("stk_kjmsev_wanko") === 2 && SB.have("stk_kjmsev_kagami") === 2 && SB.have("stk_kjmsev_tai") === 1 && SB.have("stk_kjmsev_koban") === 1 && sh.sheet.n === 6 && /シールが 6まい/.test(sh.note), "シール シートは 6まい");
S.d = S.fresh(); S.d.coins = 0;
for (const id of LD.lineup.slice(0, -1)) K.grant(id);
ok(!K.complete("lawson", true) && K.gotCount("lawson", true) === 23 && !K.st().done.net_lawson, "23しゅ では まだ");
const last = K.grant(LD.lastId);
ok(last.complete && K.complete("lawson", true) && K.st().done.net_lawson === R.U.today() && !K.complete("lawson") && !K.st().done.lawson && K.gotCount("lawson") === 0, "みんなの くじの 24しゅで コンプリート（ひとりの くじとは べつ）");
const dd = K.clean({ done: { lawson: "2026-1-2", net_lawson: "2026-1-3", net_x: "2026-1-4", nope: 3 } }).done;
ok(JSON.stringify(dd) === '{"lawson":"2026-1-2","net_lawson":"2026-1-3"}', "セーブの done を なおす（net_<みせ> は のこす）");
ok(JSON.stringify(S.fresh().kuji.done) === "{}" && S.SCHEMA === 2 && S.KEY === "pokapoka-town-save-v1", "セーブは かわらない（SCHEMA 2・KEY）");
for (const s of K.STORES) {
  const v = KN.derive(s, 1, {});
  ok(JSON.stringify(v.left) === JSON.stringify(K.NET_BY[s].plan) && Object.keys(v.left).every((id) => K.INDEX[id].net), `${s}: みんなの くじ（KujiNet.derive）は この けいひん`);
}
const kn = read("js/kuji-net.js");
ok(!/K\.BY\[/.test(kn) && (kn.match(/K\.NET_BY\[s\]/g) || []).length === 4, "kuji-net.js は ひとりの くじの けいひんを つかわない（K.NET_BY）");
ok(K.source("kj_mlaw_a") === "ネリカスタウンの ローリソンの いちばんくじ「みんなの くじ」（Aしょう）で でるよ。" && K.source("kj_law_a") === "ネリカスタウンの ローリソンの いちばんくじ（Aしょう）で でるよ。", "ずかんの ヒント（みんなの くじ／ひとりの くじ）");

// ---- 7. がめん・PokaDebug・ことば ----
const ui = read("js/kuji-ui.js");
ok(/const X = \(\) => \(mode === "net" \? K\.NET_BY\[s\] : K\.BY\[s\]\)/.test(ui) && /classList\.toggle\("deluxe", mode === "net"\)/.test(ui) && /boxUrl\(s, mode === "net"\)/.test(ui), "がめん: みんなの くじは ごうかな けいひん・きんいろの ボード・きんの はこ");
for (const t of ["みんなの くじ だけの ごうかな けいひん", "「みんなの くじ」は けいひんが ごうか！", "けいひんは みんなの くじ だけの ごうかな もの！", "みんなの くじの "]) ok(ui.includes(t), "がめんの ことば: " + t);
const css = read("css/style.css");
ok(/\.kuji\.deluxe \.kuji-poster\{/.test(css) && /\.kuji-ribbon\{/.test(css) && /\.kuji-modehint\{/.test(css), "CSS: きんいろの ボード・リボン・しらせ");
const code = src.split("\n").map((l) => l.replace(/^\s*\/\/.*$/, "").replace(/\s\/\/ [^"`]*$/, "")).join("\n");
for (const m of code.matchAll(/"([^"\n]*)"|`([^`\n]*)`/g)) { const t = (m[1] ?? m[2]).replace(/\$\{[^}]*\}/g, ""); ok(!KANJI.test(t), `kuji-deluxe-art.js の ことばに 漢字: ${t.slice(0, 40)}`); }
const D = R.PokaDebug;
S.d = S.fresh(); K.grant("kj_msev_a");
const pd = D.kujiNet("sevenbun");
ok(pd && pd.deluxe && pd.deluxe.title === SD.title && pd.deluxe.lineup.length === 24 && pd.deluxe.ids.A[0] === "kj_msev_a" && pd.deluxe.lastId === "kj_msev_l" && pd.deluxe.got.join() === "kj_msev_a" && pd.deluxe.complete === false, "PokaDebug.kujiNet().deluxe");

console.log(`✓ みんなの くじの ごうかな けいひん（UI-101）: ${n} 項目`);
process.exit(0);
