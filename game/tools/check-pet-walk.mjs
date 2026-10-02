// いぬの さんぽ（js/pet-walk.js・UI-49。オーナーの FB 2026-10-02「持ち物で…犬を連れたり…したい」）の 検査。
// ブラウザ なしで: おさんぽ リード（もちもの・ようふくやさん・ねだん・ことば）・こいぬ 3びき（なまえ・いろ）・絵（4むき × あし × しっぽ・id なし・キャッシュの キーは 48）・
// もった 子だけに いる・まちと おうちで ついて くる（よこ・むき・とおいと すぐ そば・おうちは かさならない がわ）・おうちで タップ（まえに 見えて いる ほうが さき）・つなぎ（scene-world.js / scene-house.js の 1行）・とうろく・セーブ
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { PetWalk: PW, HandItems: HI, Save: S, ITEM_INDEX, BUY_SHOPS, WearStock, SCENES, ROOM, G, UI, PokaDebug } = R;
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const kanji = /[一-鿿]/;
const fresh = () => { S.d = S.fresh(); return S.d; };
const read = (f) => readFileSync(new URL("../" + f, import.meta.url), "utf8");
const IDS = ["wanko", "gachan", "goji"];

// ---- 1. リードと こいぬ ----
{
  const w = ITEM_INDEX[PW.ITEM];
  ok(w && w.slot === "hand" && w.wear === "hi_leash" && R.WEAR.hi_leash && !w.rare, "おさんぽ リード は もちもの");
  ok(w.price === R.SlowLifePrices.price("wear", 240) && !kanji.test(w.name) && !kanji.test(w.desc) && w.st && w.st.spd === 2, `ねだん ${w.price}（ふくと おなじ 2.5ばい）・ことば・すばやさ +2`);
  ok(BUY_SHOPS.clothes.items("hand").some((x) => x.id === PW.ITEM) && !HI.ITEMS.some((x) => x.id === PW.ITEM), "ようふくやさんの「もちもの」に ある（もちもの 7しゅ とは べつ）");
  ok(IDS.every((id) => PW.PUPS[id] && !kanji.test(PW.PUPS[id].name) && [...PW.PUPS[id].name].length <= 4) && new Set(IDS.map((id) => PW.PUPS[id].body)).size === 3, "こいぬ 3びき（なまえ・いろが ちがう）");
}

// ---- 2. 絵 ----
{
  fresh();
  let keys = new Set();
  for (const id of IDS) for (const dir of ["down", "left", "right", "up"]) for (const leg of [0, 1]) for (const tail of [0, 1]) {
    const svg = PW.svg(id, dir, leg, tail);
    ok(svg.startsWith("<svg") && svg.includes(PW.PUPS[id].body) && svg.includes(PW.PUPS[id].collar) && !/\sid=/.test(svg) && svg.includes('stroke="#1F1D1B"'), `${id} ${dir} ${leg}${tail}: 描ける（いろ・くびわ・id なし・INK）`);
    keys.add(`pet:${id}:${dir}:${leg}:${tail}`);
  }
  ok(keys.size === 48, "キャッシュの キーは 48");
  ok(PW.svg("wanko", "right", 0, 0).includes("matrix(-1,0,0,1,120,0)") && PW.collar("right")[0] === PW.W - PW.collar("left")[0], "みぎむきは ひだりむきの かがみ（くびわも）");
  const svgK = R.Chara.svg("wanko", { outfit: { hand: PW.ITEM } }); ok(svgK.includes("#E8545E"), "リードの とってを 手に もつ");
}

// ---- 3. もった 子 だけ・ついて くる ----
{
  const d = fresh();
  ok(PW.holders().length === 0, "はじめは いない");
  WearStock.set(PW.ITEM, 2); d.chars.gachan.outfit.hand = PW.ITEM;
  ok(PW.holders().join() === "gachan", "もった 子 だけ");
  d.chars.goji.outfit.hand = PW.ITEM; ok(PW.holders().join() === "gachan,goji", "2人なら 2ひき");
  d.chars.goji.outfit.hand = "hi_balloon_red"; ok(PW.holders().join() === "gachan", "ほかの もちもの では いない");
  // まち（にせの シーン）
  const walker = (x, y, dir) => ({ x, y, dir, feet() { return { x: this.x, y: this.y }; } });
  const sc = { party: [walker(100, 100, "down"), walker(100, 132, "down"), walker(100, 164, "down")] };
  PW.worldUpdate(sc, 0.016);
  const p = sc.pets.gachan, f = sc.party[1].feet();
  ok(p && Object.keys(sc.pets).join() === "gachan" && Math.hypot(p.x - f.x, p.y - f.y) < 40 && p.x > f.x, "まちで もった 子の よこ（したむきは みぎ）");
  sc.party[1].x += 64; for (let i = 0; i < 40; i++) PW.worldUpdate(sc, 0.016);
  ok(Math.hypot(p.x - (sc.party[1].x + PW.SIDE.down[0] * R.CHAR_SIZE), p.y - (sc.party[1].y + PW.SIDE.down[1] * R.CHAR_SIZE)) < 4, "あるくと ついて くる");
  let moved = false; sc.party[1].x += 40; PW.worldUpdate(sc, 0.016); moved = p.moving && p.dir === "right"; ok(moved, "うごいて いる ときは すすむ むき・あしが うごく");
  sc.party[1].dir = "left"; for (let i = 0; i < 60; i++) PW.worldUpdate(sc, 0.016);
  ok(p.x < sc.party[1].x && !p.moving && p.dir === "left", "ひだりむきなら ひだりよこ・とまると おなじ むき");
  sc.party[1].x += 900; PW.worldUpdate(sc, 0.016); ok(Math.hypot(p.x - sc.party[1].x, p.y - sc.party[1].y) < 40, "とおく はなれたら（ワープ）すぐ そば");
  d.chars.gachan.outfit.hand = null; PW.worldUpdate(sc, 0.016); ok(!sc.pets.gachan, "リードを はずすと いない");
  // て の ばしょ
  const hd = PW.hand("wanko", "down", 0, 0, 220), hb = PW.hand("wanko", "up", 0, 0, 220), hl = PW.hand("wanko", "left", 0, 0, 220), hr = PW.hand("wanko", "right", 0, 0, 220);
  ok(hd.x > 0 && hb.x < 0 && hd.y < 0 && Math.abs(hl.x + hr.x) < 0.01, "手の ばしょ（まえ: みぎ・うしろ: ひだり・よこは かがみ）");
}

// ---- 4. おうち ----
{
  const d = fresh(); UI.layers = 0; G.W = 390; G.H = 844;
  WearStock.set(PW.ITEM, 2); d.chars.wanko.outfit.hand = PW.ITEM;
  const kid = (id, i) => ({ id, x: 160 + i * 80, y: 430, dir: "down", state: "idle", hidden: false, anim: 0, jumpT: -1 });
  const HSP = R.HouseScene.prototype;
  const room = () => ({ chars: IDS.map(kid), parents: [], mode: null, s: 0.5, actorScale: 0.675, life: { bubbles: [], log: [], queue: [] }, toScreen: (x, y) => R.HomeDesign.project(x, y - ROOM.WALL), depth: (p) => p.x + p.y - ROOM.WALL, actorRect: HSP.actorRect, contains: HSP.contains });
  const sc = room(); sc.chars[1].x = 600; sc.chars[2].x = 900; // そばに だれも いない
  PW.houseUpdate(sc, 0.016);
  const p = sc.pets.wanko, c = sc.chars[0];
  ok(p && p.side === 0 && Math.abs(p.x - (c.x + PW.HSIDE.down[0])) < 1 && Math.abs(p.y - (c.y + PW.HSIDE.down[1])) < 1, "おうちで もった 子の よこ（手の がわ）");
  c.x = 2000; for (let i = 0; i < 80; i++) PW.houseUpdate(sc, 0.05);
  ok(p.x <= ROOM.W - 30 && p.x >= 30, "へやの なか（はしに よせる）");
  c.x = 200; for (let i = 0; i < 80; i++) PW.houseUpdate(sc, 0.05);
  const q = sc.toScreen(p.x, p.y);
  ok(PW.houseTap(sc, { x: q.x, y: q.y - 6 }) && p.love > 1 && sc.life.log.some((x) => x.pet === "wanko"), "タップで「わん！」・ハート・ことば");
  ok(!PW.houseTap(sc, { x: q.x + 300, y: q.y }), "はなれた ところは いぬでは ない");
  // こいぬの まえに 人が いれば 人が さき・こいぬが まえなら こいぬ
  const g = sc.chars[2]; Object.assign(g, { x: p.x + 20, y: p.y + 20 }); const qa = sc.toScreen(p.x, p.y);
  ok(!PW.houseTap(sc, { x: qa.x, y: qa.y - 12 }), "こいぬの まえに いる 3人が さき（ごじを なでる）");
  Object.assign(g, { x: p.x - 20, y: p.y - 20 }); ok(PW.houseTap(sc, { x: qa.x, y: qa.y - 12 }), "こいぬが まえに 見えて いれば こいぬ");
  g.x = 900;
  // 手の がわに 人が いれば はんたいの がわ（0.5びょうごとに えらびなおす・いったり きたり しない）
  for (let i = 0; i < 40; i++) PW.houseUpdate(sc, 0.05);
  Object.assign(g, PW.hspot(c, 0).reduce((o, v, i) => ((o[i ? "y" : "x"] = v), o), {}));
  for (let i = 0; i < 40; i++) PW.houseUpdate(sc, 0.05);
  ok(p.side === 1 && Math.hypot(p.x - PW.hspot(c, 1)[0], p.y - PW.hspot(c, 1)[1]) < 4, "手の がわに ごじ → はんたいの がわ");
  let flips = 0, last = p.side; for (let i = 0; i < 120; i++) { PW.houseUpdate(sc, 0.05); if (p.side !== last) { flips++; last = p.side; } }
  ok(flips === 0, "いったり きたり しない");
  g.x = 900; for (let i = 0; i < 40; i++) PW.houseUpdate(sc, 0.05); ok(p.side === 0, "だれも いなく なれば 手の がわに もどる");
  const list = []; PW.houseDrawables(sc, list, null); ok(list.length === 1 && Number.isFinite(list[0].z), "おうちの 絵の ならびに はいる");
  sc.mode = "sleep"; const l2 = []; PW.houseDrawables(sc, l2, null); ok(l2.length === 0, "ねて いる ときは 描かない");
  // 3人 くっついて たつ（homeBubbleFixture の ならび）・2ひき: どちらも 見えて いて タップ できる
  for (const [a, b] of [["wanko", "gachan"], ["gachan", "goji"], ["wanko", "goji"]]) {
    fresh(); WearStock.set(PW.ITEM, 2); S.d.chars[a].outfit.hand = PW.ITEM; S.d.chars[b].outfit.hand = PW.ITEM;
    const s2 = room(); s2.chars.forEach((k, i) => Object.assign(k, { x: 160 + i * 80, y: 430 + (i % 2) * 35 }));
    for (let i = 0; i < 60; i++) PW.houseUpdate(s2, 0.05);
    const sides = () => Object.values(s2.pets).map((x) => x.side).join(), s0 = sides();
    for (let i = 0; i < 100; i++) PW.houseUpdate(s2, 0.05);
    ok(sides() === s0, `${a}・${b}: いったり きたり しない（${s0}）`);
    for (const id of [a, b]) {
      const t = PW.houseTapPoint(s2, id); s2.life.log = [];
      ok(t && PW.houseTap(s2, t) && s2.life.log.some((x) => x.pet === id), `${a}・${b}: ${id} の こいぬが 見えて いて タップ できる`);
    }
  }
}

// ---- 5. つなぎ・とうろく・セーブ・PokaDebug ----
{
  const sw = read("js/scene-world.js"), sh = read("js/scene-house.js");
  ok(/typeof PetWalk !== "undefined"\) PetWalk\.worldDrawables\(this, list, ctx, ox, oy\)/.test(sw), "scene-world.js: 絵の ならびで よぶ 1行");
  ok(/typeof PetWalk !== "undefined"\) PetWalk\.houseDrawables\(this, list, ctx\)/.test(sh), "scene-house.js: 絵の ならびで よぶ 1行");
  const idx = read("index.html"), swf = read("sw.js"), at = (f) => idx.indexOf(`js/${f}`);
  ok(at("pet-walk.js") > 0 && ["hand-items.js", "scene-world.js", "scene-house.js", "slow-life-prices.js", "home-life.js"].every((f) => at(f) > 0 && at(f) < at("pet-walk.js")) && at("pet-walk.js") < at("world-zoom.js"), "index.html の じゅんばん");
  ok(swf.includes('"./js/pet-walk.js"'), "sw.js の FILES");
  const f = S.fresh(); ok(!("pets" in f) && S.SCHEMA === 2, "セーブは かわらない");
  fresh(); WearStock.set(PW.ITEM, 1);
  const r = PokaDebug.petHold("goji"); ok(r && r.holders.join() === "goji" && S.d.chars.goji.outfit.hand === PW.ITEM, "PokaDebug.petHold");
  ok(PokaDebug.petHold("goji", false).holders.length === 0, "PokaDebug.petHold(id, false) で はずす");
}

console.log(`✓ pet walk: ${n} checks（おさんぽ リード・こいぬ 3びき・まちと おうちで ついて くる）`);
