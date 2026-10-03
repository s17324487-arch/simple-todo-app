// あたまの アクセサリーは 2つ まで（js/chara.js の HeadPair・UI-43。オーナーの FB 2026-10-02「頭につけるものとか2個くらい同時につけれるように。うさぎみみとリボンとか！」）の 検査。
// ブラウザ なしで: あたまの 服は どれも しゅるいが きまって いる・いっしょに つけられる くみあわせ・描く じゅんと はんたいがわ・つける／はずす／とりかえる きまり・
// 絵（NaN なし・SVG の id が かさならない・2つめが ちゃんと 描ける）・キャッシュの キー・セーブ（head2 は たすだけ）・服の かず・おみせ・こういしつ・ことば。
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { HeadPair: H, WEAR_SLOT_KEYS, Save: S, WearStock: W, ITEM_INDEX, WEAR_ITEMS, WEAR, Chara, MeeFitting: MF, MeeRentalWear: MW, Stats, PokaDebug, SLOT_NAMES } = R;
R.UI.updateHud = () => {}; // ブラウザ なし（HUD が ない）
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const kanji = /[一-鿿]/;
const fresh = () => { S.d = S.fresh(); return S.d; };
// かぶる ぼうし（しらない ものも ぼうしに なる。あたらしい あたまの 服を たしたら HeadPair.KIND か ここに いれる）
const HATS = ["strawhat", "beret", "knit", "partyhat", "chefhat", "helmet", "tophat", "bunnyhood", "mee_schoolhat", "kc_cap", "aqc_whalehat", "gacha_ebifry", "gacha_sushihat", "gacha_kinokohat", "gacha_cakehat", "season_santahat", "season_witchhat"]; // gacha_* の 4つは 4F の おもしろ かぶりもの（UI-52）・season_* は クレーンの きせつの ぬいぐるみ だけの ぼうし（UI-63）

// ---- 1. あたまの 服は どれも しゅるいが きまって いる ----
const heads = Object.values(ITEM_INDEX).filter((it) => it && it.slot === "head");
ok(heads.length >= 40, "あたまの 服 " + heads.length);
for (const it of heads) {
  ok(WEAR[it.wear], `${it.id}: 絵が ある`);
  ok(H.KIND[it.wear] || HATS.includes(it.wear), `${it.id}（${it.wear}）: しゅるいが きまって いない。HeadPair.KIND か この 検査の HATS に いれる`);
  ok(!(H.KIND[it.wear] && HATS.includes(it.wear)), `${it.id}: しゅるいが 2つ`);
}
for (const w of Object.keys(H.KIND)) ok(heads.some((it) => it.wear === w), `KIND の ${w} を つかう 服が ある`);
const count = { hat: 0, band: 0, crown: 0, pin: 0 };
for (const it of heads) count[H.kind(it.id)]++;
ok(count.pin >= 8 && count.band >= 6 && count.crown >= 5 && count.hat >= 15, "しゅるいの かず " + JSON.stringify(count));
ok(H.kind("gacha_ears_1") === "band" && H.kind("ribbon_pink") === "pin" && H.kind("strawhat") === "hat" && H.kind("crown") === "crown" && H.kind("nope") === "hat", "うさみみ・リボン・むぎわら・おうかん・しらない もの");
ok(Object.keys(H.ORDER).join() === "band,crown,hat,pin" && Object.values(H.NAME).every((s) => !kanji.test(s)), "じゅん と なまえ");

// ---- 2. いっしょに つけられる くみあわせ ----
const ex = { hat: "strawhat", band: "gacha_ears_1", crown: "gacha_sparkle_3", pin: "ribbon_pink" };
const want = { "hat+hat": false, "hat+band": false, "hat+crown": false, "hat+pin": true, "band+band": false, "band+crown": true, "band+pin": true, "crown+crown": false, "crown+pin": true, "pin+pin": true };
const other = { hat: "beret", band: "catears", crown: "flowercrown", pin: "pearl_bow" };
for (const [k, v] of Object.entries(want)) {
  const [x, y] = k.split("+"), a = ex[x], b = x === y ? other[y] : ex[y];
  ok(H.ok(a, b) === v && H.ok(b, a) === v, `${k}: ${v ? "つけられる" : "つけられない"}`);
}
ok(H.ok("gacha_ears_1", "ribbon_pink"), "うさみみ と リボン（オーナーの れい）");
ok(!H.ok("ribbon_pink", "ribbon_pink") && !H.ok("ribbon_pink", null) && !H.ok(null, "ribbon_pink"), "おなじ もの・ない もの は ×");
let pairs = 0;
for (const a of heads) for (const b of heads) { if (H.ok(a.id, b.id)) pairs++; ok(H.ok(a.id, b.id) === H.ok(b.id, a.id), `${a.id}+${b.id}: どちらから でも おなじ`); }
ok(pairs > 600, "つけられる くみあわせ " + pairs);

// ---- 3. 描く じゅん（band → crown → hat → pin）・はんたいがわ ----
const ids = (L) => L.map(([id, m]) => id + (m ? "*" : "")).join(",");
ok(ids(H.list({})) === "" && ids(H.list({ head: "strawhat" })) === "strawhat" && ids(H.list({ head2: "ribbon_pink" })) === "ribbon_pink", "0こ・1こ・2つめ だけ");
ok(ids(H.list({ head: "ribbon_pink", head2: "gacha_ears_1" })) === "gacha_ears_1,ribbon_pink", "みみの うえに リボン");
ok(ids(H.list({ head: "gacha_sparkle_3", head2: "catears" })) === "catears,gacha_sparkle_3", "みみの うえに ティアラ");
ok(ids(H.list({ head: "starclip", head2: "helmet" })) === "helmet,starclip", "ヘルメットの うえに ピン");
ok(ids(H.list({ head: "ribbon_pink", head2: "ribbon_blue" })) === "ribbon_pink,ribbon_blue*", "ピン 2つは 2つめが はんたいがわ");
ok(ids(H.list({ head: "strawhat", head2: "gacha_ears_1" })) === "strawhat", "あわない 2つめは 描かない");
ok(ids(H.list({ head: "ribbon_pink", head2: "ribbon_pink" })) === "ribbon_pink", "おなじ ものは 1つ");

// ---- 4. つける・はずす・とりかえる ----
const plan = (o, id) => { const p = H.plan(o, id); return `${p.slot}|${p.drop.join("+")}|${p.out.join("+")}|${p.why}`; };
ok(plan({}, "strawhat") === "head|||", "なにも ない → 1つめ");
ok(plan({ head2: "ribbon_pink" }, "strawhat") === "head|head2|ribbon_pink|", "2つめ だけ（こわれた かたち）→ 1つめに つけて 2つめを はずす");
ok(plan({ head: "gacha_ears_1" }, "ribbon_pink") === "head2|||", "うさみみ ＋ リボン → 2つめ");
ok(plan({ head: "gacha_ears_1" }, "strawhat") === "head||gacha_ears_1|clash", "うさみみ ＋ ぼうし → とりかえ");
ok(plan({ head: "gacha_ears_1", head2: "ribbon_pink" }, "pearl_bow") === "head2||ribbon_pink|max", "2つ ＋ ピン → 2つめを とりかえ（2つ まで）");
ok(plan({ head: "gacha_ears_1", head2: "ribbon_pink" }, "gacha_sparkle_3") === "head2||ribbon_pink|max", "うさみみ＋リボン ＋ ティアラ → 2つめを とりかえ（ティアラは どちらとも あうが 2つ まで）");
ok(plan({ head: "gacha_ears_1", head2: "gacha_sparkle_3" }, "strawhat") === "head|head2|gacha_ears_1+gacha_sparkle_3|clash", "みみ＋ティアラ ＋ ぼうし → どちらとも あわない");
ok(plan({ head: "strawhat", head2: "ribbon_pink" }, "gacha_ears_1") === "head||strawhat|clash", "ぼうし＋リボン ＋ みみ → ぼうしを とりかえ（リボンは のこる）");
{
  const o = { head: "gacha_ears_1", head2: "ribbon_pink" }, v = H.preview(o, "strawhat");
  ok(v.head === "strawhat" && v.head2 === "ribbon_pink" && o.head === "gacha_ears_1", "ためしぎは もとを かえない");
  ok(H.preview({ head: "gacha_ears_1", head2: "gacha_sparkle_3" }, "strawhat").head2 === null, "ためしぎ: あわない 2つめは はずれる");
  H.off(o, "gacha_ears_1"); ok(o.head === "ribbon_pink" && o.head2 === null, "1つめを はずすと 2つめが 1つめに");
  H.off(o, "ribbon_pink"); ok(o.head === null && o.head2 === null, "ぜんぶ はずす");
  const f = { head: "strawhat", head2: "gacha_ears_1" }; H.fix(f); ok(f.head === "strawhat" && f.head2 === null, "fix: あわない 2つめを はずす");
  const g = { head: null, head2: "ribbon_pink" }; H.fix(g); ok(g.head === "ribbon_pink" && g.head2 === null, "fix: 2つめ だけ なら 1つめに");
  const h = { head: "gacha_ears_1", head2: "ribbon_pink" }; H.fix(h); ok(h.head2 === "ribbon_pink", "fix: あう 2つめは そのまま");
}
for (const [o, id] of [[{ head: "gacha_ears_1" }, "strawhat"], [{ head: "gacha_ears_1", head2: "ribbon_pink" }, "pearl_bow"], [{ head: "gacha_ears_1", head2: "gacha_sparkle_3" }, "strawhat"]]) {
  const t = H.say(H.plan(o, id), id);
  ok(t && !kanji.test(t) && t.includes(ITEM_INDEX[id].name) && t.length <= 70, "とりかえた ことば " + t);
}
ok(H.say(H.plan({ head: "gacha_ears_1" }, "ribbon_pink"), "ribbon_pink") === "", "2つめに つけた ときは なにも いわない");

// ---- 5. 絵: 2つ とも 描く・NaN なし・SVG の id が かさならない・キャッシュの キー ----
const svgIds = (s) => [...s.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
const sample = [["gacha_ears_1", "ribbon_pink"], ["catears", "pearl_bow"], ["strawhat", "ribbon_blue"], ["gacha_ears_1", "gacha_sparkle_3"], ["ribbon_pink", "ribbon_blue"], ["starclip", "gacha_sparkle_2"], ["catears", "crown"], ["helmet", "starclip"], ["bunnyhood", "gacha_hair_3"], ["hachimaki", "gacha_sparkle_3"], ["tophat", "ribbon_pink"], ["aqc_whalehat", "gacha_sparkle_2"]];
for (const [a, b] of sample) {
  ok(H.ok(a, b), `${a}+${b}: いっしょに つけられる`);
  for (const id of Chara.IDS) for (const dir of ["down", "left", "right", "up"]) for (const pose of ["idle_01", "walk_01"]) {
    const one = Chara.svg(id, { dir, pose, outfit: { head: a } }), two = Chara.svg(id, { dir, pose, outfit: { head: a, head2: b } }), solo = Chara.svg(id, { dir, pose, outfit: { head: b } });
    ok(!/NaN|undefined/.test(two), `${id} ${dir} ${a}+${b}: NaN なし`);
    const L = svgIds(two);
    ok(new Set(L).size === L.length, `${id} ${dir} ${a}+${b}: SVG の id が かさならない`);
    ok(two.length > one.length && two.length > solo.length, `${id} ${dir} ${a}+${b}: 2つめも 描く`);
  }
}
{
  const m = Chara.svg("wanko", { outfit: { head: "ribbon_pink", head2: "ribbon_blue" } });
  ok(/scale\(-1,1\)/.test(m) && !/scale\(-1,1\)/.test(Chara.svg("wanko", { outfit: { head: "ribbon_pink", head2: "gacha_ears_1" } })), "ピン 2つは はんたいがわ（はんてん）・ほかは はんてん しない");
  const side = Chara.svg("wanko", { dir: "left", outfit: { head: "ribbon_pink", head2: "ribbon_blue" } });
  ok(!/NaN/.test(side) && /scale\(-1,1\)/.test(side), "よこむきの 2つめの ピンは あたまの うしろ");
}
// 2つめが あわない とき・ない ときは 1つめ だけの 絵と おなじ（id の ばんごうを のぞく）
const plain = (s) => s.replace(/u\d+/g, "U");
ok(plain(Chara.svg("gachan", { outfit: { head: "strawhat", head2: "gacha_ears_1" } })) === plain(Chara.svg("gachan", { outfit: { head: "strawhat" } })), "あわない 2つめは 絵に でない");
const k1 = Chara.key("wanko", { outfit: { head: "gacha_ears_1" } }), k2 = Chara.key("wanko", { outfit: { head: "gacha_ears_1", head2: "ribbon_pink" } }), k3 = Chara.key("wanko", { outfit: { head: "gacha_ears_1", head2: "pearl_bow" } });
ok(k1 !== k2 && k2 !== k3 && k2.includes("ribbon_pink"), "キャッシュの キーに 2つめ（かずは 服の かずまで）");
ok(WEAR_SLOT_KEYS.join() === "head,head2,face,neck,body,back" && Object.keys(SLOT_NAMES).join() === "head,face,neck,body,back", "outfit の キー と きがえの タブ（あたまは 1つの タブ）");

// ---- 6. セーブ: head2 は 2つめを つけた ときに できる（Save.fresh() には ない・まえの セーブは そのまま・SCHEMA は 2 の まま）----
{
  ok(S.SCHEMA === 2, "SCHEMA は 2 の まま");
  const d = fresh();
  for (const id of Chara.IDS) ok(Object.keys(d.chars[id].outfit).join() === "head,face,neck,body,back" && !("head2" in d.chars[id].outfit), `${id}: あたらしい セーブの outfit は まえと おなじ`);
  const old = S.fresh();
  for (const id of Chara.IDS) old.chars[id].outfit = { head: "ribbon_pink", face: null, neck: null, body: null, back: null };
  const raw = JSON.stringify(old.chars), m = S.migrate(JSON.parse(JSON.stringify(old)));
  ok(JSON.stringify(m.chars) === raw, "まえの セーブの 3人は そのまま（head2 を たさない）");
  for (const id of Chara.IDS) ok(H.list(m.chars[id].outfit).map(([x]) => x).join() === "ribbon_pink", `${id}: head2 が なくても 1つめを 描く`);
  W.put("wanko", "head2", "gacha_ears_1"); // もって いない ので つけられない
  ok(!("head2" in S.d.chars.wanko.outfit) || S.d.chars.wanko.outfit.head2 === null, "もって いない 2つめは つかない");
}

// ---- 7. 服の かず（1こで 1人）・ほかの 画面で あたまを かえた とき ----
{
  const d = fresh();
  for (const id of ["gacha_ears_1", "strawhat", "pearl_bow"]) W.set(id, 1);
  const o = d.chars.wanko.outfit;
  ok(W.put("wanko", "head", "gacha_ears_1").ok && W.put("wanko", "head2", "ribbon_pink").ok && o.head === "gacha_ears_1" && o.head2 === "ribbon_pink", "うさみみ と リボン");
  ok(W.wearers("ribbon_pink").join() === "wanko" && !W.can("ribbon_pink", "gachan"), "2つめも 1こ つかう");
  ok(W.put("wanko", "head", "strawhat").ok && o.head === "strawhat" && o.head2 === "ribbon_pink", "ぼうしに かえても リボンは のこる");
  o.head2 = "gacha_ears_1"; ok(W.put("wanko", "head", "strawhat").ok && o.head2 === null, "あわない 2つめは はずれる（fix）");
  W.put("wanko", "head", "gacha_ears_1"); W.put("wanko", "head2", "pearl_bow");
  // がちゃんに わたす: わんこの 1つめが なくなると 2つめが 1つめに
  ok(W.put("gachan", "head", "gacha_ears_1").ok && o.head === "pearl_bow" && o.head2 === null && d.chars.gachan.outfit.head === "gacha_ears_1", "わたすと のこりが 1つめに");
  ok(W.put("wanko", "head", null).ok && o.head === null && o.head2 === null, "はずす");
  // ステータスは 2つ ぶん（おうかん ＋ ねこみみ）
  W.set("crown", 1); W.set("catears", 1);
  W.put("goji", "head", "crown"); const a = Stats.equip("goji", "spd"); W.put("goji", "head2", "catears");
  ok(Stats.equip("goji", "spd") === a + ITEM_INDEX.catears.st.spd, "2つめの つよさも たす");
}

// ---- 8. こういしつ: かりた いしょうを 2つめに つけても もとに もどる ----
{
  const d = fresh(); d.arcade = d.arcade || {}; d.arcade.rental = {};
  const hat = MW.ITEMS.map((it) => it.id).find((id) => ITEM_INDEX[id] && ITEM_INDEX[id].slot === "head");
  ok(hat && H.kind(hat) === "hat", "かしだしの ぼうし " + hat);
  W.put("wanko", "head", "ribbon_pink");
  const before = { wanko: { ...d.chars.wanko.outfit }, gachan: { ...d.chars.gachan.outfit }, goji: { ...d.chars.goji.outfit } };
  d.chars.wanko.outfit.head2 = hat; MF.track(before);
  ok(MF.count() === 1 && d.arcade.rental.wanko && Object.hasOwn(d.arcade.rental.wanko, "head2"), "2つめの かしだしを おぼえる");
  ok(MF.giveBack() === 1 && d.chars.wanko.outfit.head === "ribbon_pink" && d.chars.wanko.outfit.head2 === null, "でる ときに 2つめを かえす・1つめは そのまま");
  W.set("gacha_ears_1", 1); W.put("gachan", "head", "gacha_ears_1");
  const b2 = { wanko: { ...d.chars.wanko.outfit }, gachan: { ...d.chars.gachan.outfit }, goji: { ...d.chars.goji.outfit } };
  d.chars.gachan.outfit.head = hat; MF.track(b2);
  ok(MF.giveBack() === 1 && d.chars.gachan.outfit.head === "gacha_ears_1", "1つめの かしだしは まえの みみに もどる");
}

// ---- 9. がめんの ことば・おみせ・PokaDebug ----
const du = readFileSync(new URL("../js/dressup.js", import.meta.url), "utf8"), shop = readFileSync(new URL("../js/shop.js", import.meta.url), "utf8");
const note = du.match(/head-pair-note", text: "([^"]+)"/);
ok(note && !kanji.test(note[1]) && note[1].includes("2つ まで"), "きがえの あんない " + (note && note[1]));
ok(/HeadPair\.plan\(c\.outfit, it\.id\)/.test(du) && /HeadPair\.off\(c\.outfit, it\.id\)/.test(du) && /HeadPair\.say\(p, it\.id\)/.test(du), "きがえは HeadPair の きまりで つける・はずす");
ok(/HeadPair\.preview\(c\.outfit, it\.id\)/.test(shop) && /HeadPair\.plan\(o, it\.id\)/.test(shop), "おみせの ためしぎ と「きる！」も おなじ きまり");
ok(/for \(const k of Object\.keys\(o\)\) o\[k\] = null/.test(du), "ぜんぶ ぬぐ は 2つめも");
{
  const d = fresh(); R.Save.d = d;
  W.set("gacha_ears_1", 1); W.put("wanko", "head", "gacha_ears_1"); W.put("wanko", "head2", "ribbon_pink");
  const p = PokaDebug.headPair("wanko");
  ok(p.head === "gacha_ears_1" && p.head2 === "ribbon_pink" && p.kinds.join() === "band,pin" && p.drawn.length === 2, "PokaDebug.headPair " + JSON.stringify(p));
}

console.log(`✓ head pair: ${n} checks（あたまの 服 ${heads.length}・ぼうし ${count.hat}・カチューシャ ${count.band}・かんむり ${count.crown}・ピン ${count.pin}・くみあわせ ${pairs}）`);
