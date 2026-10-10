// おへやを 3ばい・4ばいに ひろげる（UI-114。オーナーの 指示 2026-10-09「部屋を10万円で3倍、50万円で4倍」）の 検査。
// ブラウザ なしで: ひろさ 4しゅ（めんせき 1・2・3・4ばい）・だん（セーブ・ふるい セーブ・こわれた あたい）・ねだんと じゅんばん・
// へやごと・ひょうじ ちゅうの へやだけ・絵（へや・おにわ）・絵の 大きさ・ズーム・2かい・オンラインの ひろさの きごう・とうろく。
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { HomeDesign: HD, HomeRooms: HR, HomeFloors: HF, OnlineRooms: OR, Save: S } = R;
R.UI.updateHud = () => {};
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const read = (f) => readFileSync(new URL("../" + f, import.meta.url), "utf8");
const area = (k) => HD.sizes[k].w * HD.sizes[k].d;

// ---- 1. ひろさ ----
ok(HD.SIZE_KEYS.join() === "standard,expanded,x3,x4" && HD.SIZE_KEYS.every((k) => HD.sizes[k]), "ひろさは 4しゅ");
HD.SIZE_KEYS.forEach((k, i) => ok(area(k) === area("standard") * (i + 1), `${k}: めんせきが ちょうど ${i + 1}ばい（${HD.sizes[k].w}×${HD.sizes[k].d}）`));
ok(HD.SIZE_KEYS.every((k, i) => i === 0 || (HD.sizes[k].w > HD.sizes[HD.SIZE_KEYS[i - 1]].w && HD.sizes[k].d > HD.sizes[HD.SIZE_KEYS[i - 1]].d)), "ひろげると よこも おくも ひろがる（かぐは はみ出さない）");
ok(HD.sizes.x4.w <= 1000 && HD.sizes.x4.d + HD.H <= 1000, "4ばいでも オンラインの ざひょうの はんい（1000 まで）に はいる");

// ---- 2. だん（セーブ）----
S.d = S.fresh();
ok(JSON.stringify(S.d.rooms.grow) === "{}" && S.SCHEMA === 2, "Save.fresh() の rooms.grow・SCHEMA は 2 の まま");
{ const old = S.fresh(); delete old.rooms.grow; old.rooms.expanded.main = true; S.migrate(old); ok(JSON.stringify(old.rooms.grow) === "{}" && HD.level("main", old.rooms) === 2, "ふるい セーブ: grow を たす・2ばいは そのまま"); }
const rs = (expanded, grow) => ({ active: "main", expanded: { main: expanded }, grow: { main: grow } });
ok(HD.level("main", rs(false, 4)) === 1 && HD.level("main", rs(true, 5)) === 2 && HD.level("main", rs(true, "4")) === 2 && HD.level("main", rs(true, 3)) === 3 && HD.level("main", rs(true, 4)) === 4, "こわれた あたい（2ばい なしの 4・5・もじ）は つかわない");
ok(HD.level("main", { expanded: { main: true } }) === 2 && HD.sizeKey("main", rs(true, 4)) === "x4", "grow が なくても うごく・キー");

// ---- 3. ねだん と じゅんばん ----
S.d = S.fresh(); S.d.rooms.owned.study = true; S.d.coins = 5000000;
ok(HR.expansionPrice === 6000 && HR.GROW_PRICE[3] === 100000 && HR.GROW_PRICE[4] === 500000, "2ばい 6000・3ばい 10まん・4ばい 50まん");
ok(HR.nextPrice("main") === 6000 && !HR.grow("main") && S.d.coins === 5000000, "2ばいの まえに 3ばいには できない");
ok(HR.widen("main") && HR.level("main") === 2 && S.d.coins === 4994000 && HD.W * HD.D === area("expanded"), "2ばい（6000）");
ok(!HR.expand("main") && HR.nextPrice("main") === 100000 && S.d.coins === 4994000, "2ばいを 2かい かわない");
S.d.coins = 99999; ok(!HR.widen("main") && S.d.coins === 99999 && HR.level("main") === 2, "コインが たりないと ひろげない");
S.d.coins = 600000;
ok(HR.widen("main") && HR.level("main") === 3 && S.d.coins === 500000 && HD.W * HD.D === area("x3") && S.d.rooms.grow.main === 3, "3ばい（10まん）");
ok(!HR.grow("study") && HR.level("study") === 1, "ひょうじ ちゅうで ない へやは ひろげない");
ok(HR.widen("main") && HR.level("main") === 4 && S.d.coins === 0 && HD.W === 960 && HD.D === 720, "4ばい（50まん）");
S.d.coins = 9999999; ok(!HR.widen("main") && HR.nextPrice("main") === 0 && S.d.coins === 9999999, "4ばいより ひろく ならない");
ok(HR.switchTo("study") && HD.W === 480 && HR.widen("study") && HR.level("study") === 2 && HR.level("main") === 4, "へやごとに ひろさ");
HR.switchTo("main");
ok(!HR.grow("unknown") && !HR.grow("garden"), "しらない・もって いない へや");
{ const re = S.migrate(JSON.parse(JSON.stringify(S.d))); ok(HD.level("main", re.rooms) === 4 && HD.level("study", re.rooms) === 2, "セーブして よみなおしても ひろさ"); }

// ---- 4. 絵・ズーム・2かい ----
for (const k of ["x3", "x4"]) {
  const size = HD.sizes[k], svg = HD.roomSvg("wp_cream", "fl_wood", size), b = HD.bounds(size);
  ok(svg.includes("<svg") && !/NaN|undefined/.test(svg) && svg.length > 20000, `${k}: へやの 絵`);
  ok(!/NaN|undefined/.test(R.HomeGarden.svg(size)), `${k}: おにわの 絵`);
  const k0 = Math.min(2, Math.sqrt(4.5e6 / (b.w * b.h))), k1 = Math.min(3, Math.sqrt(9e6 / (b.w * b.h)));
  ok(Math.ceil(b.w * k0) * Math.ceil(b.h * k0) <= 4.6e6 && Math.ceil(b.w * k1) * Math.ceil(b.h * k1) <= 9.1e6 && k0 > 1.5, `${k}: 絵の 画素は 450まん・900まん まで（${k0.toFixed(2)}）`);
}
{
  const house = read("js/scene-house.js"), floors = read("js/home-floors.js");
  ok(/const k0 = Math\.min\(2, Math\.sqrt\(4\.5e6 \/ \(b\.w \* b\.h\)\)\)/.test(house) && /Math\.ceil\(b\.w \* k0\)/.test(house) && /Math\.ceil\(b\.w \* k0\)/.test(floors), "おへやの 絵と 2かいの 絵は ひろい へやで ちいさめ");
  const P = R.HouseScene.prototype, zmax = (key, guest) => { HD.guestSize = guest ? key : null; const sc = Object.create(P); sc.guest = guest ? {} : null; const z = Object.getOwnPropertyDescriptor(P, "ZMAX").get.call(sc); HD.guestSize = null; return z; };
  S.d = S.fresh(); ok(zmax() === 3, "いつもの へやの ズームは 3ばいまで");
  S.d.rooms.expanded.main = true; S.d.rooms.grow.main = 3; ok(zmax() === 4, "3ばいの へやは 4ばいまで");
  S.d.rooms.grow.main = 4; ok(zmax() === 5 && zmax("standard", true) === 3 && zmax("x4", true) === 5, "4ばいの へやは 5ばいまで（おじゃまは よその へやの ひろさ）");
  S.d.rooms.owned.upstairs = true; S.d.rooms.grow.upstairs = 4;
  ok(HF.size("main").w === 960 && HF.size("upstairs").w === 480, "2かいは じぶんの ひろさ（2ばいの まえの 4は つかわない）");
  S.d.rooms.expanded.upstairs = true; ok(HF.size("upstairs").w === 960 && HF.union().w > HD.bounds(HD.sizes.x4).w, "2かいも 4ばい・2つの かいの わく");
}

// ---- 5. オンライン ----
{
  S.d = S.fresh(); S.d.rooms.owned.study = true; S.d.rooms.stored.study = { wall: "wp_cream", floor: "fl_wood", items: [], wallpapers: {}, floors: {}, nextUid: 1 };
  R.Online.nickCode = () => "5-7";
  const z = (exp, g) => { S.d.rooms.expanded.study = exp; S.d.rooms.grow.study = g; return OR.encode("study").z; };
  ok(z(false) === "s" && z(true) === "e" && z(true, 3) === "3" && z(true, 4) === "4", "ひろさの きごう s・e・3・4");
  const dec = (zz) => OR.decode({ n: "5-7", t: 1, k: "study", w: "wp_cream", f: "fl_wood", z: zz }).size;
  ok(dec("s") === "standard" && dec("e") === "expanded" && dec("3") === "x3" && dec("4") === "x4" && dec("9") === "standard" && dec(4) === "standard" && dec("__proto__") === "standard", "よんだ きごう（しらない ものは 1ばい）");
  const g = (size) => R.OnlineVisit.guest({ uid: "x", room: { k: "main", wall: "wp_cream", floor: "fl_wood", size, items: [] } }).room.size;
  ok(g("x4") === "x4" && g("x3") === "x3" && g("huge") === "standard" && g("constructor") === "standard", "おじゃまの へやの ひろさ");
  const rules = JSON.parse(read("firebase/database.rules.json")), zr = rules.rules.v1.rooms.$uid.z[".validate"], fake = read("tests/online-fake.mjs");
  ok(zr.includes("/^(s|e|3|4)$/") && fake.includes('["s", "e", "3", "4"].includes(v.z)') && read("firebase/README.md").includes("UI-114"), "きまり（ひろさの きごう だけ ふえる）・にせの サーバー・てじゅん");
}

// ---- 6. がめんの ことば ----
{
  const life = read("js/home-life.js");
  ok(life.includes("`${next}ばいに ひろげる`") && life.includes("いちばん ひろいよ") && life.includes("ひろさ ${this.level(r.id)}ばい"), "おへやの がめん: つぎの ばいすう・いちばん ひろい・へやの いちらん");
}
console.log(`✓ おへやを 3ばい・4ばいに（UI-114）: ${n} 項目`);
