// もようがえの 一覧（js/furn-tray.js・UI-37）の 検査。ブラウザ なしで たしかめる。
// しゅるい（ぜんぶの 家具が どこかに はいる・かべ／ラグは それだけ・まちがえやすい ことば）・なまえで さがす（カタカナ ⇔ ひらがな）・
// ならびかえ（あたらしい＝てに いれた じゅんの ぎゃく・なまえ・いごこち）・おけない 家具は ださない・にわでは かべの 家具を ださない・ことばは ひらがな。
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { FurnTray: T, FURNITURE, FURN_INDEX, Save, Room } = R;
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const kanji = /[一-鿿]/;
const main = ["wall", "rug", "light", "sit", "table", "toy", "plant", "misc"];

// ---- 1. しゅるいの ボタン・ならびかえの ことば ----
ok(T.CATS[0][0] === "all" && T.CATS.length === 10 && new Set(T.CATS.map(([k]) => k)).size === 10, "しゅるいは ぜんぶ＋9");
ok(T.SORTS.map(([k]) => k).join() === "new,name,comfort", "ならびは あたらしい・なまえ・いごこち");
for (const [, label] of [...T.CATS, ...T.SORTS]) ok(!kanji.test(label) && label.length <= 9, `ことば ${label}`);
const src = readFileSync(new URL("../js/furn-tray.js", import.meta.url), "utf8");
for (const m of src.matchAll(/(?:text|placeholder|"aria-label"):\s*"([^"]+)"/g)) ok(!kanji.test(m[1]), `がめんの ことば ${m[1]}`);
for (const m of src.matchAll(/"([^"]*(?:みつからない|ないよ)[^"]*)"/g)) ok(!kanji.test(m[1]), `がめんの ことば ${m[1]}`);

// ---- 2. ぜんぶの 家具に しゅるいが ある ----
const count = Object.fromEntries(main.map((k) => [k, 0]));
for (const f of FURNITURE) {
  const c = T.cats(f), mine = main.filter((k) => c.has(k));
  ok(mine.length >= 1, `${f.id}: しゅるいが ない`);
  if (f.kind === "wall") ok(mine.join() === "wall", `${f.id}: かべの 家具は「かべ」だけ（${mine}）`);
  else if (f.kind === "rug") ok(mine.join() === "rug", `${f.id}: ラグは「ラグ」だけ（${mine}）`);
  else ok(!c.has("wall") && !c.has("rug") && (!c.has("misc") || mine.length === 1), `${f.id}: ゆかの 家具（${mine}）`);
  ok(c.has("special") === !!(f.rare || f.exclusive || f.shopPrize || f.puzzlePrize || f.quizPrize || !(f.price > 0)), `${f.id}: とくべつ`);
  mine.forEach((k) => count[k]++);
}
// よく ある 家具は おもった しゅるいに
const expect = { lamp: "light", sakura_lamp: "light", star_lantern: "light", bed_simple: "sit", bed_royal: "sit", sofa: "sit", chair_wood: "sit", kotatsu: "sit", table_wood: "table", bookshelf: "table", wardrobe_oak: "table", desk: "table",
  teddy: "toy", train: "toy", rockinghorse: "toy", tent: "toy", plant: "plant", plantshelf: "plant", tv: "misc", piano: "misc", fishbowl: "misc", window: "wall", clock: "wall", rug_round: "rug", rug_kilim: "rug" };
for (const [id, k] of Object.entries(expect)) if (FURN_INDEX[id]) ok(T.cats(FURN_INDEX[id]).has(k), `${id} は ${k}`);
// まちがえやすい ことば: グランプリ（ランプ）・たなばた（たな）・はなび／はなかんむり（はな）
const tricky = { fs_trophy_grand: ["light"], annual_tanabata_furn: ["table"], annual_fireworks_furn: ["plant"], gacha_friends_2: ["plant"] };
for (const [id, no] of Object.entries(tricky)) if (FURN_INDEX[id]) for (const k of no) ok(!T.cats(FURN_INDEX[id]).has(k), `${id} は ${k} に いれない`);
if (FURN_INDEX.gacha_friends_2) ok(T.cats(FURN_INDEX.gacha_friends_2).has("toy"), "ガチャの フィギュアは おもちゃ");
for (const k of main) ok(count[k] >= 2, `しゅるい ${k} に 2こ いじょう（${count[k]}）`);
// f.cat を もつ 家具は それに したがう
ok([...T.cats({ id: "x_test", name: "テスト", kind: "floor", price: 100, cat: ["light", "sit"] })].sort().join() === "light,sit", "f.cat で しゅるいを きめられる");

// ---- 3. なまえで さがす ----
ok(T.norm("ベッド") === "べっど" && T.norm("くもいろ ソファ") === "くもいろそふぁ" && T.norm("ＡＢＣ") === "abc" && T.norm("すわる・ねる") === "すわるねる", "ひらがなに そろえる");
ok(T.norm("ふかふかソファ").includes(T.norm("そふぁ")) && T.norm("おもちゃの きしゃ").includes(T.norm("キシャ")), "ひらがなで カタカナも・カタカナで ひらがなも");

// ---- 4. いちらん（ならび・しぼりこみ・おけない ものは ださない）----
Save.d = Save.fresh();
const sample = ["sofa", "lamp", "teddy", "rug_star", "window", "bookshelf", "piano", "cloudsofa"].filter((id) => FURN_INDEX[id]);
for (const id of Object.keys(Save.d.furn)) delete Save.d.furn[id];
Save.d.room.items = [];
sample.forEach((id) => (Save.d.furn[id] = 1));
const st = (o) => ({ size: "s", cat: "all", sort: "new", q: "", ...o });
let L = T.list(st()).map((f) => f.id);
ok(L.join() === sample.slice().reverse().join(), "あたらしい じゅん（さいごに てに いれた ものが さき） " + L);
L = T.list(st({ sort: "name" })).map((f) => f.name);
const coll = new Intl.Collator("ja");
ok(L.every((x, i) => !i || coll.compare(L[i - 1], x) <= 0) && L.length === sample.length, "なまえ じゅん " + L);
L = T.list(st({ sort: "comfort" })).map((f) => f.comfort || 0);
ok(L.every((x, i) => !i || L[i - 1] >= x), "いごこち じゅん");
ok(T.list(st({ cat: "sit" })).every((f) => T.cats(f).has("sit")) && T.list(st({ cat: "sit" })).length === sample.filter((id) => T.cats(FURN_INDEX[id]).has("sit")).length, "しゅるいで しぼる");
ok(T.list(st({ q: "そふぁ" })).map((f) => f.id).sort().join() === ["cloudsofa", "sofa"].filter((id) => FURN_INDEX[id]).sort().join(), "なまえで さがす");
ok(T.list(st({ q: "ぞうさん" })).length === 0, "みつからない");
// へやに おいて のこりが 0 の 家具は ださない
Save.d.room.items = [{ uid: 1, id: "lamp", x: 200, y: 440, flip: false }];
ok(Room.available("lamp") === 0 && !T.list(st()).some((f) => f.id === "lamp"), "おいて のこりが ない 家具は ださない");
const c = T.counts();
ok(c.all === sample.length - 1 && c.wall === 1 && c.rug === 1, "しゅるいの かず " + JSON.stringify(c));
// にわ（yard）では かべの 家具を ださない
const prev = Save.d.rooms.active;
Save.d.rooms.active = "yard";
ok(!T.list(st()).some((f) => f.kind === "wall") && T.counts().wall === 0, "にわでは かべの 家具を ださない");
Save.d.rooms.active = prev;

console.log(`✓ furn tray: ${n} checks（しゅるい ${main.map((k) => k + " " + count[k]).join("・")}・さがす・ならびかえ・にわ）`);
