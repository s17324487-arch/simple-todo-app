// ファッションショー（UI-36）の 検査。ブラウザ なしで しらべる。
// オーナーの FB 2026-10-01「池袋駅にファションショーができる所を追加してほしい。ファッションのレベルとタイミングに合わせてごわががポーズをとる
// (ボタンを押す)ことで、点数が決まる。ボタンを押す操作は、難しめにして。審査コメントも欲しいところだ。…点数によってお金がもらえるのと、景品を用意して。
// 記念写真ももらえるようにして。…受付と着替えスペースがあって、過去のショーの写真も飾ってある。参加費500円もとる。実施できる場所は既存の建物(ほんのギャラリー)でよい」
// ・きまり（js/fashion-show.js）: テーマ 8しゅ・おしゃれ レベル・はんていの はば（むずかしめ）・てんすう・ランク・コイン・けいひん・しゃしん・セーブ
// ・絵（js/fashion-art.js）: かお・ポーズ・けいひんの 服と トロフィー・しゃしん
// ・会場（js/fashion-hall.js）: ほんの ギャラリーの なか・うけつけ・きがえ・しゃしんの かべ・とどく ところ・SVG・キャッシュの キー
// ・ランウェイ（js/fashion-scene.js）: 3人の かお・ひとこと・PokaDebug・ことば（ひらがな）
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { FashionShow: F, FashionArt: A, FashionHall: Hl, FashionScene: Sc, Save, ITEM_INDEX, FURN_INDEX, WEAR, FURN_ART, VenueHalls, MAP_DEFS, MallArt, SCENES, CHARA_GESTURES, CHARA_FACE_EXTRA, CHARA_DATA, ItemDexSources, SONGS, PokaDebug } = R;
R.UI.updateHud = () => {}; // HUD は ブラウザ だけ
let n = 0;
const ok = (v, msg) => { n++; assert.ok(v, msg); };
const near = (a, b, e = 1e-9) => Math.abs(a - b) <= e;

// ---- 1. セーブ ----
Save.d = Save.fresh();
const fresh = Save.fresh().fashion;
ok(fresh && fresh.entry === 0 && fresh.shows === 0 && fresh.best === 0 && Array.isArray(fresh.photos) && fresh.last === null, "Save.fresh().fashion");
ok(Save.SCHEMA === 2, "Save.SCHEMA は かわらない（あたらしい 項目だけ）");
{ const old = Save.fresh(); delete old.fashion; const m = Save.migrate(JSON.parse(JSON.stringify(old))); ok(m.fashion && m.fashion.photos.length === 0 && m.fashion.entry === 0, "ふるい セーブにも fashion が はいる"); }
{ const d = Save.fresh(); d.fashion = { entry: -3, shows: "x", photos: [null, { id: 1 }, { id: "a", o: {} }], ranks: [], got: null, last: 5 }; const f = F.st(d); ok(f.entry === 0 && f.shows === 0 && f.photos.length === 1 && !Array.isArray(f.ranks) && typeof f.got === "object" && f.last === null, "こわれた データを なおす"); }

// ---- 2. テーマ と おしゃれ レベル ----
ok(F.THEMES.length === 8 && new Set(F.THEMES.map((t) => t.id)).size === 8, "テーマ 8しゅ");
const buyable = R.WEAR_ITEMS.filter((w) => w.price > 0);
for (const t of F.THEMES) {
  ok(F.RULES[t.id] && F.POSES[t.id] && F.POSES[t.id].length === 3, `${t.id}: きまりと ポーズ 3つ`);
  for (const g of F.POSES[t.id]) ok(CHARA_GESTURES[g], `${t.id}: ポーズ ${g} が ある`);
  const hit = buyable.filter((w) => F.tagsOf(w.id).includes(t.id));
  ok(hit.length >= 4, `${t.id}: おみせで かえる テーマの ふく 4つ いじょう（${hit.length}）`);
  ok(/^[぀-ヿA-Za-z・ 　ー]+$/.test(t.hint) && /^[぀-ヿ]+$/.test(t.name), `${t.id}: ことばは ひらがな・カタカナ`);
}
ok(F.themeOn(new Date(2026, 9, 1)).id !== F.themeOn(new Date(2026, 9, 2)).id, "テーマは 日がわり");
{
  const empty = F.level("wanko", "kawaii", Save.fresh(), {});
  ok(empty.total === 0 && empty.stars === 1 && empty.empty.length === 5, "なにも きて いない: 0てん・★1");
  const full = F.level("wanko", "kawaii", Save.fresh(), { head: "ribbon_pink", face: "heartglasses", neck: "necklace", body: "dress", back: "fairywings" });
  ok(full.slots === 20 && full.theme === 15 && full.total <= 60 && full.total >= 45 && full.stars >= 4, "5か所 ぜんぶ・テーマ 3つ いじょう: ★4 いじょう " + JSON.stringify(full));
  const rare = F.level("wanko", "kawaii", Save.fresh(), { head: "fs_star_tiara" });
  ok(rare.value > 0, "けいひんの ふく（ねだん 0）も ねだんの てんが ある");
  for (const id of ["wanko", "gachan", "goji"]) for (const t of F.THEMES) { const L = F.level(id, t.id, Save.fresh(), {}); ok(L.total >= 0 && L.total <= 60, `${id}/${t.id}: 0〜60`); }
}

// ---- 3. ポーズの はんてい（むずかしめ）と てんすう ----
ok(F.WINDOW.perfect <= 0.06 && F.WINDOW.great <= 0.12 && F.WINDOW.good <= 0.2, "はんていの はば: ぴったり ±60ms いか・いいね ±120ms いか・おしい ±200ms いか（むずかしめ）");
ok(F.judgeOf(0) === "perfect" && F.judgeOf(-0.05) === "perfect" && F.judgeOf(0.08) === "great" && F.judgeOf(-0.15) === "good" && F.judgeOf(0.3) === "miss" && F.judgeOf(null) === "miss", "judgeOf");
for (let k = 1; k < 3; k++) for (let m = 0; m < 3; m++) ok(F.ringDur(m, k) < F.ringDur(m, k - 1), "わは だんだん はやく なる");
ok(F.ringDur(2, 2) < 0.7 && F.ringDur(0, 0) === 1, "1かいめ 1.0びょう → さいご 0.7びょう いか");
{
  const best = F.level("wanko", "kawaii", Save.fresh(), { head: "ribbon_pink", face: "heartglasses", neck: "necklace", body: "dress", back: "fairywings" });
  const top = F.scoreModel(best, ["perfect", "perfect", "perfect"], "kawaii", 3), low = F.scoreModel(F.level("wanko", "kawaii", Save.fresh(), {}), ["miss", "miss", "miss"], "kawaii", 3);
  ok(top.pose === 30 && top.bonus === 10 && top.total === best.total + 40 && top.total <= 100, "ぜんぶ ぴったり: ポーズ 30・ボーナス 10");
  ok(low.total === 0 && low.cards.every((c) => c === 1), "なにも きないで ぜんぶ ミス: 0てん・ふだ 1");
  ok(top.cards.length === 3 && top.cards.every((c) => c >= 1 && c <= 10) && top.comments.length === 3, "しんさいん 3人の ふだ（1〜10）と ひとこと");
  for (const c of [...top.comments, ...low.comments]) ok(!/[一-鿿]/.test(c) && c.length > 6, "ひとことは ひらがな: " + c);
  ok(!top.comments.some((c) => /\{.\}/.test(c)), "ひとことに {t} などが のこらない");
}
ok(F.RANKS.map((r) => r.min).join() === "90,75,60,40,0" && F.RANKS.map((r) => r.coins).join() === "2000,1200,800,500,200", "ランクと コイン");
ok(F.rankOf(90).id === "grand" && F.rankOf(89).id === "gold" && F.rankOf(0).id === "try", "rankOf");

// ---- 4. うけつけ・ショー・ごほうび・しゃしん ----
{
  Save.d = Save.fresh(); Save.d.coins = 400;
  const short = F.pay(); ok(!short.ok && short.short === 100 && Save.d.coins === 400 && !F.hasEntry(), "コインが たりない: はらえない");
  Save.d.coins = 1200; ok(F.pay().ok && Save.d.coins === 700 && F.hasEntry(), "さんかひ 500");
  ok(F.pay().already && Save.d.coins === 700, "2かい はらわない");
  F.override = "kawaii";
  const show = F.begin(12345); ok(show && !F.hasEntry() && show.theme === "kawaii" && show.order.length === 3, "begin: うけつけを つかう");
  ok(F.begin(1) === null, "うけつけ なしでは はじまらない");
  const res = show.order.map((id) => ({ id, judgments: ["perfect", "perfect", "perfect"], gestures: ["heart", "nyan", "peace"], face: "fs_kime" }));
  const sum = F.finish(show, res);
  ok(sum && sum.models.length === 3 && Save.d.coins === 700 + sum.coins && sum.coins === F.RANK[sum.rank].coins, "コインが もらえる");
  ok(Save.d.fashion.photos.length === 1 && sum.photo.r.length === 3 && sum.photo.th === "kawaii", "きねん しゃしん");
  const again = F.finish(show, res); ok(again === sum && Save.d.coins === 700 + sum.coins && Save.d.fashion.photos.length === 1, "おなじ ショーは 1かいだけ");
  // ランクの けいひん（グランプリなら した の ランクの ぶんも）
  Save.d = Save.fresh(); Save.d.coins = 5000; Save.d.chars.wanko.outfit = { head: "ribbon_pink", face: "heartglasses", neck: "necklace", body: "dress", back: "fairywings" }; Save.d.chars.gachan.outfit = { ...Save.d.chars.wanko.outfit }; Save.d.chars.goji.outfit = { ...Save.d.chars.wanko.outfit };
  for (const id of Object.values(Save.d.chars.wanko.outfit)) Save.d.wardrobe[id] = 3;
  F.pay(); const s2 = F.begin(777), sum2 = F.finish(s2, s2.order.map((id) => ({ id, judgments: ["perfect", "perfect", "perfect"], gestures: ["heart"] })));
  ok(sum2.rank === "grand" && sum2.got.length === 8, "グランプリ: 4つの ランクの トロフィーと 服（8こ） " + sum2.score);
  for (const P of Object.values(F.PRIZES)) ok(Save.d.furn[P.furn] === 1 && Save.d.wardrobe[P.wear] >= 1, "けいひんを もらう " + P.furn);
  F.pay(); const s3 = F.begin(778), sum3 = F.finish(s3, s3.order.map((id) => ({ id, judgments: ["perfect", "perfect", "perfect"], gestures: ["heart"] })));
  ok(sum3.got.length === 0 && Save.d.furn.fs_trophy_grand === 1, "けいひんは はじめての とき だけ");
  for (let i = 0; i < 14; i++) { F.pay(); const s = F.begin(1000 + i); F.finish(s, s.order.map((id) => ({ id, judgments: ["good", "miss", "great"] }))); }
  ok(Save.d.fashion.photos.length === F.MAX_PHOTOS && F.photos().length === 12, "しゃしんは 12まい まで");
  ok(Save.d.fashion.shows === 16 && Save.d.fashion.best === sum2.score, "きろく（でた かず・いちばん）");
  F.override = null;
}

// ---- 5. けいひん（服・トロフィー）と ずかん ----
for (const w of F.WEARS) { const it = ITEM_INDEX[w.id]; ok(it && it.price === 0 && it.exclusive === "fashion" && WEAR[it.wear], `${w.id}: 服の 絵が ある・かえない`); ok(ItemDexSources.source("wear", it).includes("ファッションショー"), `${w.id}: ずかんの ヒント`); }
for (const f of F.FURN) { const it = FURN_INDEX[f.id]; ok(it && it.price === 0 && it.exclusive === "fashion" && typeof FURN_ART[f.id] === "function", `${f.id}: トロフィーの 絵`); ok(ItemDexSources.source("furn", it).includes("ファッションショー"), `${f.id}: ずかんの ヒント`); ok(A.TROPHY[f.id], `${f.id}: トロフィーの いろ`); }

// ---- 6. 会場（ほんの ギャラリー）----
const bld = MAP_DEFS.city.buildings.find((b) => b.id === "ike_annex1");
ok(bld && bld.act.type === "venue" && bld.act.venue === "fashion" && bld.label === "ほんの ギャラリー", "池袋の ほんの ギャラリーの なかが 会場");
const def = VenueHalls.defs.fashion, room = def && def.floors[1];
ok(def && def.iso && def.art === Hl.art && def.bgm === "fashion_hall" && room && room.fashionHall, "VenueHalls.defs.fashion");
ok(SONGS.fashion_hall && SONGS.fashion_show && SONGS.fashion_hall.modern && SONGS.fashion_show.modern, "会場と ランウェイの BGM（この ゲームの ために つくった 曲）");
const kinds = new Set(room.fixtures.map((f) => f.kind));
for (const k of ["gate", "reception", "backpanel", "booth", "vanity", "gallery", "trophycase", "gpedestal", "chandelier", "rope", "lsofa", "bookshelf", "photospot", "exitMat", "easel"]) ok(kinds.has(k), "会場に " + k);
for (const rk of ["bronze", "silver", "gold", "grand"]) ok(room.fixtures.some((f) => f.kind === "gpedestal" && f.item === F.PRIZES[rk].wear), "けいひんの マネキン " + rk);
const base = new Set(["sit", "info", "leave"]);
for (const f of room.fixtures.filter((f) => f.action)) ok(base.has(f.action) || Hl.ACT[f.action], `${f.label}: しらべると なにか おきる（${f.action}）`);
for (const z of room.zones) ok(MallArt.SHOP[z.shop], "フロアマップの いろ " + z.shop);
ok(room.rows.length === room.h && room.rows.every((r) => r.length === room.w), "ゆかの かたち");
{ // とどく ところ（入口から ランウェイ・うけつけ・きがえ・しゃしん）
  const sc = new SCENES.venue(); sc.room = room; sc.fixtures = room.fixtures; sc.party = [{ tx: room.spawn[0], ty: room.spawn[1] }];
  ok(sc.walkable(...room.spawn), "入口に たてる");
  for (const f of room.fixtures.filter((f) => f.action && f.spots)) ok(f.spots.some(([x, y]) => sc.route(x, y) !== null), `${f.label}: まえまで あるける`);
  ok(sc.route(...Hl.AT_GATE) !== null, "ランウェイの いりぐちの まえ（ショーから もどる ところ）");
}
{ // SVG（おなじ 属性を 2かい かかない・id は ひとつ）と キャッシュの キー
  const dup = (svg) => { for (const m of svg.matchAll(/<([a-zA-Z]+)((?:\s+[a-zA-Z:-]+="[^"]*")*)\s*\/?>/g)) { const names = [...m[2].matchAll(/([a-zA-Z:-]+)="/g)].map((x) => x[1]); if (new Set(names).size !== names.length) return m[0].slice(0, 80); } return null; };
  const keys = new Set();
  for (const f of room.fixtures) { const m = Hl.art.model(f); keys.add(Hl.art.modelKey(f)); if (!m) continue; ok(!dup(m.svg), `${f.kind}: おなじ 属性が ない ${dup(m.svg) || ""}`); ok(m.vb.w > 0 && m.vb.h > 0 && m.vb.w < 2000, `${f.kind}: 絵の 大きさ`); }
  ok(keys.size <= 30 && [...keys].every((k) => !/\d{6,}/.test(k)), "キャッシュの キーは すくない（乱数・時刻を いれない）");
  for (const side of ["north", "west"]) { const w = Hl.art.wallSvg(room, side); ok(!dup(w.svg), "かべ " + side); const ids = [...w.svg.matchAll(/ id="([^"]+)"/g)].map((x) => x[1]); ok(new Set(ids).size === ids.length && ids.every((id) => id.startsWith("fhw" + side)), "かべの id は ひとつ " + side); }
  for (const p of Hl.PAST) { const s = Hl.pastSvg(p); ok(s.startsWith("<svg") && !dup(s), "これまでの ショーの しゃしん " + p.no); ok(F.THEME[p.th] && F.RANK[p.rk], "しゃしんの テーマと ランク"); }
  ok(Hl.trophiesGot().length >= 0 && Hl.art.modelKey({ kind: "trophycase", w: 3, h: 1 }).startsWith("fhall:trophycase"), "トロフィーの たなの キー");
}

// ---- 7. ランウェイ ----
ok(SCENES.fashion === Sc, "SCENES.fashion");
for (const id of ["wanko", "gachan", "goji"]) {
  for (const f of ["fs_doki", "fs_kime", "smile", "love", "oops", "normal"]) { const name = (Sc.FACE[f] && Sc.FACE[f][id]) || f; ok(CHARA_DATA[id].faces[name] || (CHARA_FACE_EXTRA[id] && CHARA_FACE_EXTRA[id][name]), `${id}: かお ${f} → ${name}`); }
  ok(Sc.LINES.wait[id] && Sc.LINES.after[id].length === 3, `${id}: ひとこと`);
}
for (const g of ["fs_hip", "fs_point", "fs_wave", "fs_star"]) ok(CHARA_GESTURES[g] && Object.keys(CHARA_GESTURES[g].arms).length === 3, "ポーズ " + g);

// ---- 8. ことば（ひらがな 中心・漢字なし）と PokaDebug ----
const strings = (file) => { const src = readFileSync(new URL("../js/" + file, import.meta.url), "utf8").split("\n").filter((l) => !/^\s*\/\//.test(l)).map((l) => l.replace(/\/\/ .*$/, "")).join("\n"); return [...src.matchAll(/"([^"\n]*)"|`([^`]*)`/g)].map((m) => m[1] ?? m[2]); };
for (const file of ["fashion-show.js", "fashion-hall.js", "fashion-scene.js", "fashion-art.js"]) for (const s of strings(file)) ok(!/[一-鿿]/.test(s), `${file}: 漢字が ない「${s.slice(0, 40)}」`);
for (const fn of ["fashion", "fashionGo", "fashionStart", "fashionAuto", "fashionSpeed", "fashionTheme", "fashionScene", "fashionPress"]) ok(typeof PokaDebug[fn] === "function", "PokaDebug." + fn);
Save.d = Save.fresh();
ok(PokaDebug.fashionTheme("cool") === "cool" && PokaDebug.fashionTheme(null) === F.themeOn().id, "PokaDebug.fashionTheme");
const st = PokaDebug.fashion(); ok(st.building === "ike_annex1" && st.venue && st.fee === 500 && st.source.includes("ファッションショー"), "PokaDebug.fashion()");

console.log(`Fashion show: ${n} checks（テーマ 8・はんてい・てんすう・ランク・けいひん・しゃしん・セーブ・会場・ランウェイ・ことば）OK`);
