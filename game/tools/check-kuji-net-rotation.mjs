// みんなの くじの いれかわる けいひん（UI-117。データは js/kuji-net-rotation.js・絵は js/kuji-net-rotation-art.js・しくみは js/ichiban-kuji.js と js/kuji-net.js）の 検査。
// オーナーの 指示 2026-10-12「みんなのくじの景品も2週間で入れ替わるようにしてほしい。そのため、景品の追加作成を依頼する。入れ替わりのタイミングは、ひとりの1番くじとずらしてくれ。」
// ブラウザ なしで:
// 1. よみこみ・データ（2つの コンビニ・24しゅ・80まい・まえからの みんなの くじ／ひとりの くじと ちがう けいひん・ことば）
// 2. こよみ: 2026-10-12 0じ（にほん）から 14にち ごと・ひとりの くじと 1しゅうかん ずれる（1ねん ぶん、いれかわる 日が かさならない）・いつまで・つぎ
// 3. ロットの セット（1まいめの じこく）・まえの きかんの ロット・テストで きめる セット
// 4. ゲームに いれる（家具・もちもの・シール・フィギュア だい・クーポン・コンプリート・セーブ・ずかんの ヒント）
// 5. 絵（SVG・シール・もちもの 3人 × 4むき・なみの ラグの 立体）
// 6. にせの サーバー: まえの きかんの ロットは つぎへ・あたらしい ロットは あたらしい セット・ルールを はりなおす まえは まえの セットの まま
// 7. ルール（database.rules.json の cur）と にせの サーバーが おなじ けいさん・がめん・PokaDebug
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";
import { startOnlineFake } from "../tests/online-fake.mjs";
const R = gameContext();
const { IchibanKuji: K, KujiArt: A, KujiNet: KN, KujiNetRotationArt: NA, StickerBook: SB, Save: S, Online: O, OnlineNet: N, FigureStand: FS } = R;
R.UI.updateHud = () => {}; R.UI.toast = () => {};
const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
let n = 0;
const ok = (c, m) => { n++; assert(c, m); };
const KANJI = /[一-鿿]/, INK = R.INK || "#1F1D1B";
// 絵の なかの 3人（Chara.svg）は じぶんの uid つきの clipPath を つかう（かさならない）。この ファイルの 絵の id・グラデーションは 1. で ソースを みる
const svgOk = (s) => typeof s === "string" && s.startsWith("<svg") && s.trim().endsWith("</svg>") && !/NaN|undefined|null|Infinity/.test(s) && s.includes(INK) && !/<linearGradient|<radialGradient/.test(s);
const JST = (y, m, d, h = 0, mi = 0) => Date.UTC(y, m - 1, d, h - 9, mi); // にほんの じこく → ミリびょう

// ---- 1. よみこみ・データ ----
{
  const html = read("index.html"), sw = read("sw.js"), pos = (f) => html.indexOf(`<script src="js/${f}"></script>`);
  ok(pos("kuji-net-rotation.js") > pos("kuji-deluxe-art.js") && pos("kuji-net-rotation-art.js") === pos("kuji-net-rotation.js") + `<script src="js/kuji-net-rotation.js"></script>\n`.length && pos("kuji-net-rotation-art.js") < pos("ichiban-kuji.js") && sw.includes('"./js/kuji-net-rotation.js"') && sw.includes('"./js/kuji-net-rotation-art.js"'), "kuji-net-rotation.js → kuji-net-rotation-art.js（kuji-deluxe-art.js の あと・ichiban-kuji.js の まえ）・sw.js");
  const src = read("js/kuji-net-rotation-art.js") + read("js/kuji-net-rotation.js");
  ok(!/fetch\(|XMLHttpRequest|WebSocket|sendBeacon|localStorage/.test(src) && (src.match(/https?:\/\/[^"'`\s]+/g) || []).every((u) => u === "http://www.w3.org/2000/svg"), "そとへ つうしん しない");
  ok(!/kira|sparkle|twinkle|glitter/i.test(src) && !/<linearGradient|<radialGradient|<clipPath| id="/.test(src), "キラキラ・グラデーション・SVG の id は つかわない（UI-50）");
}
ok(K.NET_ROTA.length === 2 && K.NET_ROTA.map((X) => X.id).join() === K.STORES.join() && K.NET_ROTA.map((X) => X.key).join() === "mlaw2,msev2", "2つの コンビニに 1つずつ（mlaw2・msev2）");
ok(K.STORES.every((s) => K.NET_THEMES[s].length === 2 && K.NET_THEMES[s][0] === K.NET_BY[s] && K.NET_THEMES[s][0].base && !K.NET_THEMES[s][1].base), "みせごとの セット: まえからの みんなの くじ ⇄ あたらしい セット");
const SOLO_NAMES = new Set(K.ITEMS.filter((it) => !it.net).map((it) => it.name));
for (const X of K.NET_ROTA) {
  const B = K.NET_BY[X.id], mine = K.ITEMS.filter((it) => it.theme === X.key);
  ok(mine.length === 24 && mine.every((it) => it.net && it.store === X.id && new RegExp(`^kj_${X.key}_[a-z0-9]+$`).test(it.id)) && X.lineup.length === 24 && X.total === 80 && X.dcId === B.dcId && !X.lineup.includes(X.dcId), `${X.shop}: 24しゅ（id は kj_${X.key}_）・80まい・ダブルチャンスしょうは おなじ`);
  for (const g of K.GRADES) ok(X.ids[g].length === K.PLAN[g].length && X.ids[g].every((id, k) => X.plan[id] === K.PLAN[g][k] && K.INDEX[id].grade === g && K.INDEX[id].kind === K.INDEX[B.ids[g][k]].kind), `${X.shop} ${g}しょう: ほんすう・しゅるいは まえからの みんなの くじと おなじ`);
  ok(X.shop === B.shop && X.title !== B.title && X.title.startsWith(X.shop + "の ") && !KANJI.test(X.title) && [X.color, X.light, X.dark].every((c) => /^#[0-9A-F]{6}$/i.test(c)), `${X.shop}: シリーズ「${X.title}」・いろ`);
  ok(X.lineup.every((id, i) => K.INDEX[id].name !== K.INDEX[B.lineup[i]].name && !SOLO_NAMES.has(K.INDEX[id].name)) && new Set(mine.map((it) => it.name)).size === 24 && !K.ITEMS.some((it) => it.theme !== X.key && mine.some((m) => m.name === it.name)), `${X.shop}: なまえは ほかの くじの けいひんと かさならない`);
  for (const it of mine) ok(it.name && !KANJI.test(it.name) && [...it.name].length <= 20 && it.desc && !KANJI.test(it.desc) && [...it.desc].length <= 60, `${it.id}: なまえ・せつめい（かな・ながさ）`);
  for (const g of K.GRADES) ok(X.cats[g] && !KANJI.test(X.cats[g]) && [...X.cats[g]].length <= 12, `${X.shop} ${g}しょうの しゅるいの なまえ`);
  ok(X.stickers.length === 6 && X.stickers.every(([id, name]) => new RegExp(`^stk_kj${X.key}_[a-z]+$`).test(id) && name && !KANJI.test(name) && [...name].length <= 10), `${X.shop}: シール 6しゅ`);
  for (const id of X.ids.I) ok(K.INDEX[id].stickers.reduce((a, [, k]) => a + k, 0) === 6 && K.INDEX[id].stickers.every(([sid]) => X.stickers.some(([x]) => x === sid)), `${id}: シール 6まい`);
  // ごうか（ひとりの くじ より・まえからの みんなの くじと おなじ くらい）
  X.lineup.forEach((id, i) => { const a = K.INDEX[id], b = K.INDEX[B.lineup[i]]; if (a.furn) ok(a.comfort === b.comfort && a.w === b.w && a.h === b.h, `${id}: いごこち・おおきさは まえからの ${b.id} と おなじ`); if (a.kind === "coupon") ok(a.uses === 3 && a.item === b.item, `${id}: 3まい つづり`); if (a.kind === "bag") ok(JSON.stringify(a.st) === JSON.stringify(b.st), `${id}: もちものの つよさ`); });
}
ok(K.INDEX.kj_mlaw2_a.name.includes("まほうつかい") && K.INDEX.kj_msev2_b.name.includes("うらしま") && K.NET_THEME_BY.mlaw2.title.includes("まほうの おしろ") && K.NET_THEME_BY.msev2.title.includes("りゅうぐうじょう"), "テーマ（まほうの おしろ・りゅうぐうじょう）");

// ---- 2. こよみ ----
ok(K.NET_EPOCH === JST(2026, 10, 12) && K.NET_PERIOD === 14 * 864e5 && new Date(K.NET_EPOCH).getUTCDay() === 0, "2026-10-12（げつようび）0じ（にほん）から 14にち");
const at = (s, t) => K.netThemeOf(s, t).key;
ok(at("lawson", JST(2026, 10, 11, 23, 59)) === "mlaw" && at("lawson", JST(2026, 10, 12)) === "mlaw2" && at("lawson", JST(2026, 10, 25, 23, 59)) === "mlaw2" && at("lawson", JST(2026, 10, 26)) === "mlaw" && at("lawson", JST(2026, 11, 8, 23, 59)) === "mlaw" && at("lawson", JST(2026, 11, 9)) === "mlaw2", "ローリソン: 10/12〜25 まほうの おしろ → 10/26〜11/8 ロイヤル パーティー → 11/9〜");
ok(at("sevenbun", JST(2026, 10, 12, 0, 1)) === "msev2" && at("sevenbun", JST(2027, 1, 4)) === K.netThemeOf("sevenbun", JST(2027, 1, 4)).key && [JST(2026, 10, 12), JST(2026, 10, 26), JST(2026, 11, 9), JST(2026, 11, 23)].map((t) => at("sevenbun", t)).join() === "msev2,msev,msev2,msev", "せぶんぶんも おなじ 日に いれかわる");
// ひとりの くじと ずれる: 1ねん ぶん、ひとりの くじが いれかわる 日と みんなの くじが いれかわる 日は かさならない（どちらも 14にち ごと・7にち ずれ）
{
  let soloDays = 0, netDays = 0, both = 0;
  for (let i = 0; i < 365; i++) {
    const t = JST(2026, 10, 1) + i * 864e5, prev = t - 864e5, d = new Date(t + 9 * 3600e3), day = `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`, pd = new Date(prev + 9 * 3600e3), pday = `${pd.getUTCFullYear()}-${pd.getUTCMonth() + 1}-${pd.getUTCDate()}`;
    const solo = K.themeOf("lawson", day).key !== K.themeOf("lawson", pday).key, net = at("lawson", t) !== at("lawson", prev);
    soloDays += solo; netDays += net; both += solo && net;
  }
  ok(soloDays === 26 && netDays === 26 && both === 0, `1ねんで ひとりの くじ ${soloDays}かい・みんなの くじ ${netDays}かい いれかわり、おなじ 日は ${both}かい`);
}
ok(K.netUntil(JST(2026, 10, 13, 9)) === "2026-10-25" && K.netUntil(JST(2026, 10, 25, 23, 59)) === "2026-10-25" && K.netUntil(JST(2026, 10, 26)) === "2026-11-8", "いつまで（にほんの ひづけ）");
ok(K.netPeriod(JST(2026, 10, 12)) === 0 && K.netPeriod(JST(2026, 10, 11)) === -1 && K.netPeriod(JST(2026, 10, 26)) === 1, "きかんの ばんごう");

// ---- 3. ロットの セット ----
{
  const v0 = KN.derive("lawson", 1, { n: 1, d: { k0: { u: "a", t: JST(2026, 10, 13) } } }), v1 = KN.derive("lawson", 2, { n: 1, d: { k0: { u: "a", t: JST(2026, 10, 27) } } });
  ok(v0.th === "mlaw2" && v0.S === K.NET_THEME_BY.mlaw2 && (v0.draws[0].id == null || K.INDEX[v0.draws[0].id].theme === "mlaw2") && Object.keys(v0.left).every((id) => K.INDEX[id].theme === "mlaw2"), "1まいめが 10/13 の ロットは まほうの おしろ");
  ok(v1.th === "mlaw" && Object.keys(v1.left).every((id) => K.INDEX[id].theme === "mlaw"), "1まいめが 10/27 の ロットは ロイヤル パーティー（のこりも その セット）");
  // 1まいめの じこくで きまる: あとの くじが つぎの きかんでも セットは かわらない
  const mix = { n: 3, d: { k0: { u: "a", t: JST(2026, 10, 25, 23, 50) }, k1: { u: "b", t: JST(2026, 10, 26, 0, 10) }, k2: { u: "c", t: JST(2026, 10, 27) } } }, vm = KN.derive("lawson", 3, mix);
  ok(vm.th === "mlaw2" && vm.draws.every((x) => !x.id || K.INDEX[x.id].theme === "mlaw2"), "ロットの セットは 1まいめの じこく（とちゅうで かわらない）");
  const now0 = K.netNow; K.netNow = () => JST(2026, 10, 27);
  ok(KN.stale(vm) && !KN.stale(v1) && !KN.stale(KN.derive("lawson", 4, {})), "まえの きかんに はじまった ロット（stale）・だれも ひいて いない ロットは ちがう");
  ok(KN.derive("lawson", 5, {}).th === "mlaw", "だれも ひいて いない ロットは いまの じこくの セット");
  K.netNow = () => JST(2026, 10, 13);
  ok(KN.derive("sevenbun", 5, {}).th === "msev2" && K.netThemeNow("sevenbun").key === "msev2", "10/13 は りゅうぐうじょう");
  ok(K.setNetTheme("sevenbun", "msev") && KN.derive("sevenbun", 6, {}).th === "msev" && KN.derive("sevenbun", 6, mix).th === "msev" && K.setNetTheme("sevenbun", null) && KN.derive("sevenbun", 6, {}).th === "msev2", "テストで セットを きめる・もどす（PokaDebug.kujiNetTheme）");
  ok(!K.setNetTheme("sevenbun", "mlaw2") && !K.setNetTheme("lawson", "nope") && !K.setNetTheme("family", "mlaw"), "ちがう みせ・ない セットは きめられない");
  K.netNow = now0;
}

// ---- 4. ゲームに いれる ----
S.d = S.fresh();
for (const X of K.NET_ROTA) {
  for (const id of X.lineup) {
    const it = K.INDEX[id];
    if (it.furn) { const f = R.FURN_INDEX[id]; ok(f && f.price === 0 && f.rare && f.exclusive === "kuji" && f.kujiPrize === X.id && f.comfort === it.comfort && (it.kind === "brocade" ? f.kind === "rug" : f.kind === "floor") && !!f.figure === it.fig, `${id}: 家具`); }
    if (it.kind === "bag") { const w = R.ITEM_INDEX[id]; ok(w && w.wear === "kuji_ndbag" && w.col[0] === X.key && w.col[1] === it.who && w.rare && !R.FURN_INDEX[id] && typeof R.WEAR.kuji_ndbag === "function", `${id}: もちもの（kuji_ndbag）`); }
    ok(K.source(id).includes("「みんなの くじ」") && K.source(id).includes(`いれかわる「${X.title.replace(X.shop + "の ", "")}」`), `${id}: ずかんの ヒント`);
  }
  ok(X.ids.G.every((id) => FS.isFigure(id)) && X.ids.E.every((id) => K.INDEX[id].fig === (K.INDEX[id].kind === "teacup")), `${X.shop}: フィギュア だいに かざれる もの`);
  ok(X.stickers.every(([id, name]) => SB.INDEX[id] && SB.INDEX[id].name === name && SB.INDEX[id].series === X.id && /「みんなの くじ」/.test(SB.INDEX[id].hint)), `${X.shop}: シールちょうに 6しゅ`);
  // クーポンは その みせで つかえる（まえからの みんなの くじの クーポンと いっしょに）
  const h = X.ids.H[0]; S.d = S.fresh(); K.grant(h);
  ok(K.st().coupons[h] === 3 && K.coupons(X.id).some((c) => c.id === h && c.n === 3), `${X.shop}: クーポン 3まい・その みせで つかえる`);
  // コンプリートは セットごと（done.net_<key>）
  S.d = S.fresh(); for (const id of X.lineup.slice(0, -1)) K.grant(id);
  ok(!K.complete(X.id, true, X) && K.gotCount(X.id, true, X) === 23, `${X.shop}: 23しゅ では まだ`);
  const last = K.grant(X.lineup.at(-1));
  ok(last.complete && K.complete(X.id, true, X) && K.st().done["net_" + X.key] === R.U.today() && !K.st().done["net_" + X.id] && K.doneKey(X) === "net_" + X.key, `${X.shop}: コンプリート（done.net_${X.key}・まえからの みんなの くじとは べつ）`);
  const dd = K.clean({ done: { ["net_" + X.key]: "2026-10-13", net_zzz: "2026-1-1" } }).done;
  ok(dd["net_" + X.key] === "2026-10-13" && !("net_zzz" in dd), `${X.shop}: セーブの done を なおす（net_${X.key} は のこす）`);
}
ok(S.SCHEMA === 2 && S.KEY === "pokapoka-town-save-v1", "セーブの かたちは かわらない");

// ---- 5. 絵 ----
for (const X of K.NET_ROTA) {
  for (const id of X.lineup) { const it = K.INDEX[id]; if (it.kind === "bag") continue; ok(svgOk(A.pic(id)), `${id}: 絵`); if (it.furn && it.kind !== "brocade") ok(svgOk(R.Art.furnSvg(id)), `${id}: へやの 絵`); }
  for (const [id] of X.stickers) { const s = A.sticker(id); ok(svgOk(s) && /viewBox="0 0 100 100"/.test(s), `${id}: シール 100×100`); }
  for (const id of X.ids.F) for (const who of ["wanko", "gachan", "goji"]) for (const dir of ["down", "up", "left", "right"]) {
    const svg = R.Chara.svg(who, { outfit: { hand: id }, dir, color: S.d.chars[who].color });
    ok(!/NaN|undefined/.test(svg) && svg.includes(INK), `${id}: ${who} ${dir} が もつ`);
  }
}
for (const id of K.NET_THEME_BY.msev2.ids.E) { const m = R.HomeDesign.model(id, {}).full; ok(m.includes("#1E8A9A") && !m.includes("#C8323A") && !/NaN|undefined/.test(m), `${id}: なみの ラグの 立体（うみいろ）`); }
for (const id of K.NET_THEME_BY.mlaw2.ids.D) ok(R.FurnLive.get(id) && typeof R.FurnLive.get(id).tap === "function", `${id}: さわると うごく（チェア）`);
for (const id of [...K.NET_ROTA.flatMap((X) => ["A", "B", "C"].map((g) => X.ids[g][0])), ...K.NET_ROTA.map((X) => X.lastId)]) ok(R.FurnLive.get(id), `${id}: とくだい ぬいぐるみ（ぎゅっ）`);

// ---- 6. にせの サーバー ----
const fake = await startOnlineFake();
let oldRules = false;
N.fetchFn = async (url, opt = {}) => {
  // ルールを はりなおす まえ（cur は 80まい うりきれた とき だけ）
  if (oldRules && /\/db\/v1\/kuji\/[a-z]+\.json/.test(url) && opt.method === "PATCH" && /"cur"/.test(String(opt.body || ""))) { const s = /kuji\/([a-z]+)\.json/.exec(url)[1], c = fake.at(`v1/kuji/${s}/cur`) || 1; if (fake.at(`v1/kuji/${s}/lots/l${c}/n`) !== 80) return new Response('{"error":"Permission denied"}', { status: 401 }); }
  return fetch(url, opt);
};
const reset = () => { fake.reset(); S.d = S.fresh(); S.d.coins = 200000; N.over = { ...fake.conf }; N.auth = null; N.pending = null; O.reg = ""; O.syncP = null; R.localStorage.removeItem(N.KEY); KN.reset(); oldRules = false; const s = O.st(); s.on = true; s.agreed = 1; s.ver = O.VER; s.nick = [3, 4]; KN.setMode(true); };
{
  reset();
  // まえの きかんに 1まいめを ひいた ロット 1（のこり 79まい）
  fake.write("v1/kuji/sevenbun/lots/l1", { n: 1, d: { k0: { u: "someone", t: K.NET_EPOCH - 3600e3 } } });
  let L = await KN.load("sevenbun");
  ok(L.cur === 2 && fake.at("v1/kuji/sevenbun/cur") === 2 && L.view.n === 0 && L.view.th === K.netThemeNow("sevenbun").key && L.prev && L.prev.no === 1 && L.prev.ended, "まえの きかんの ロットは つぎの ロットへ（あたらしい セット）");
  const r = await KN.draw("sevenbun", 1);
  ok(r.tickets.length === 1 && K.INDEX[r.tickets[0].id || K.NET_THEME_BY[L.view.th].ids[r.tickets[0].g][0]].theme === L.view.th && fake.at("v1/kuji/sevenbun/lots/l2/n") === 1, "あたらしい ロットで ひくと あたらしい セットの けいひん");
  L = await KN.load("sevenbun"); ok(L.cur === 2 && !KN.stale(L.view), "おなじ きかんの ロットは そのまま");
  // ルールを はりなおす まえ: すすめられない → まえの セットの まま ひける
  reset(); oldRules = true;
  fake.write("v1/kuji/lawson/lots/l1", { n: 1, d: { k0: { u: "someone", t: K.NET_EPOCH - 3600e3 } } });
  L = await KN.load("lawson");
  ok(L.cur === 1 && fake.at("v1/kuji/lawson/cur") == null && L.view.th === "mlaw" && KN.stale(L.view) && !L.prev, "ルールを はりなおす まえは まえの セットの ロットの まま（prev は のこさない）");
  const r2 = await KN.draw("lawson", 1);
  ok(r2.tickets.length === 1 && fake.at("v1/kuji/lawson/lots/l1/n") === 2 && (!r2.tickets[0].id || K.INDEX[r2.tickets[0].id].theme === "mlaw"), "まえの セットの まま ひける");
}
await fake.close();

// ---- 7. ルール・がめん・PokaDebug ----
{
  const rules = JSON.parse(read("firebase/database.rules.json")), cur = rules.rules.v1.kuji.$store.cur[".write"], fakeSrc = read("tests/online-fake.mjs");
  ok(cur.includes(`now - ((now - ${K.NET_EPOCH}) % ${K.NET_PERIOD})`) && cur.includes("child('d').child('k0').child('t').isNumber()") && cur.includes("child('n').val() === 80"), "ルール: うりきれ か まえの きかんの ロットなら つぎへ（おなじ けいさん）");
  ok(fakeSrc.includes(`KUJI_EPOCH = ${K.NET_EPOCH}, KUJI_PERIOD = ${K.NET_PERIOD}`) && /t0 < now - \(\(now - KUJI_EPOCH\) % KUJI_PERIOD\)/.test(fakeSrc), "にせの サーバーも おなじ けいさん");
  ok(read("tools/rules-emulator.mjs").includes("まえの きかんに はじまった ロットは つぎへ すすめられる"), "本物の エミュレーターの ためし（tools/rules-emulator.mjs）");
  const ui = read("js/kuji-ui.js");
  ok(/const netRotaPart = \(V, prev\)/.test(ui) && ui.includes("ひとりの くじとは 1しゅうかん ずれて いるよ") && ui.includes("つぎの ロットから") && /parts\.push\(netRotaPart\(V, prev\)\)/.test(ui) && ui.includes("paint(); // セットの いろ"), "がめん: いつまで・つぎ・ひとりの くじとの ずれ・まえの セットの ロット・いろ");
  const dbg = read("js/debug.js");
  ok(/kujiNetTheme\(s,key=null\)/.test(dbg) && /view:v\?\{no:v\.no,th:v\.th,stale:KujiNet\.stale\(v\)/.test(dbg) && /deluxe:\(\(\)=>\{const K=IchibanKuji,X=v&&v\.S\?v\.S:K\.netThemeNow\(s\)/.test(dbg), "PokaDebug.kujiNetTheme・kujiNet の セット");
}
console.log(`✓ みんなの くじの いれかわる けいひん（UI-117）: ${n} 項目`);
