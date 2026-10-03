// ごはんの せき（js/dine-seats.js・UI-72）の 検査。
// ブラウザ なしで: すわる ポーズ（CHARA_POSE_EXTRA.sit_01・あしを からだの まえに）・せきの かたち 4しゅ（いち・むき・たかさ・そう・おさら）・
// テーブルの そうの 絵（MallArt の only・はんいが おなじ・ぜんぶの 絵に ふくまれる）・館の テーブル（びっくぽ・サンシャインいけぶ・はくぶつかん）の
// いりぐちと みち・3人の わりあて（おおきい 子ほど おく）・ほかの おきゃくさんの 席 → あいている 席・カウンター → テーブル・
// いまの いち（あるく → すべりこむ → すわる → たべる → たつ）・くみこみ（iso-venue・venue-hall・neri-bikkupo）・ことば・index.html と sw.js・PokaDebug
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { DineSeats: D, CHARA_POSE_EXTRA: PX, Chara, VenueHalls, SCENES, Save, Walker, G, PokaDebug } = R;
R.UI.updateHud = () => {}; R.UI.toast = (m) => { toasts.push(m); };
const toasts = [];
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const kanji = /[一-鿿]/;
const read = (f) => readFileSync(new URL("../" + f, import.meta.url), "utf8");
Save.d = Save.fresh();

// ---- 1. すわる ポーズ ----
for (const id of Chara.IDS) {
  for (const view of ["front", "side", "back"]) {
    const tr = PX.sit_01(id, view);
    ok(Array.isArray(tr) && tr.length === 3 && tr.every((t) => typeof t === "string" && /translate|rotate|scale/.test(t)), `${id} ${view}: すわる ポーズの transform`);
    ok(!!tr.feetOver === (view !== "back"), `${id} ${view}: あしは ${view === "back" ? "うしろ" : "からだの まえ"}`);
  }
  for (const dir of ["down", "left", "right", "up"]) {
    const sit = Chara.svg(id, { pose: "sit_01", dir }), idle = Chara.svg(id, { pose: "idle_01", dir });
    ok(sit.startsWith("<svg") && sit !== idle && sit.includes(PX.sit_01(id, dir === "up" ? "back" : dir === "down" ? "front" : "side")[2]), `${id} ${dir}: すわる 絵`);
    ok(Chara.key(id, { pose: "sit_01", dir }).includes(":sit_01:"), `${id} ${dir}: キャッシュの キーに ポーズ`);
  }
}
// あしを まえに 描く ときは からだの あと（front・side）
{ const s = Chara.svg("wanko", { pose: "sit_01", dir: "down" }), feet = s.lastIndexOf('<ellipse cx="87"'), face = s.indexOf("</g>"); ok(feet > face, "まえむきの すわる 絵は あしが からだの まえ"); }

// ---- 2. せきの かたち ----
ok(Object.keys(D.KINDS).sort().join() === "booth,fmtable,mucafetable,table", "せきの かたちは 4しゅ（ボックス席・4にんがけ・まるい テーブル・カフェ ジュラ）");
const VENUES = [["bikkupo", 1], ["mall", 2], ["museum", 3]];
const all = [];
for (const [vid, fl] of VENUES) {
  const def = VenueHalls.defs[vid], r = def.floors[fl];
  for (const f of r.fixtures.filter((f) => D.isSeat(f) && f.action)) all.push({ vid, fl, def, r, f });
}
ok(all.filter((x) => x.vid === "bikkupo").length === 10 && all.filter((x) => x.vid === "mall").length === 13 && all.filter((x) => x.vid === "museum").length === 4, `すわれる テーブル: びっくぽ 10・いけぶ 2F 13・はくぶつかん 4（${all.length}）`);
for (const { vid, f } of all) {
  const K = D.KINDS[f.kind], seats = K.seats(f), tag = `${vid} ${f.label} (${f.x},${f.y})`;
  ok(seats.length === 3 && new Set(seats.map((s) => s.x.toFixed(2) + "," + s.y.toFixed(2))).size === 3, tag + ": せき 3つ");
  ok(seats.every((s) => s.x > 0 && s.x < f.w && s.y > 0 && s.y < f.h && s.z >= 20 && s.z <= 60 && ["down", "left", "right", "up"].includes(s.dir)), tag + ": せきは テーブルの なか・たかさ・むき");
  ok(seats.every((s) => s.plate[0] > 0 && s.plate[0] < f.w && s.plate[1] > 0 && s.plate[1] < f.h && Math.hypot(s.plate[0] - s.x, s.plate[1] - s.y) > 0.25 && Math.hypot(s.plate[0] - s.x, s.plate[1] - s.y) < 0.9), tag + ": おさらは せきの まえ");
  ok(seats.filter((s) => s.layer < K.plates).length === 2 && seats.filter((s) => s.layer > K.plates && s.layer <= K.n).length === 1, tag + ": おくの せき 2つ（テーブルの まえに 描く）・てまえ 1つ（おさらの あと）");
  // おくの せきは テーブルの まんなかより おく（x+y が ちいさい）
  const far = seats.filter((s) => s.layer < K.plates), near = seats.find((s) => s.layer > K.plates);
  ok(far.every((s) => s.x + s.y < near.x + near.y), tag + ": おくの せきは てまえの せきより おく");
  // むきは おさら（テーブル）の ほう
  const dirOk = (s) => { const dx = s.plate[0] - s.x, dy = s.plate[1] - s.y; return s.dir === (Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up"); };
  ok(seats.every(dirOk), tag + ": テーブルの ほうを むいて すわる");
}

// ---- 3. テーブルの そうの 絵 ----
const keys = new Set();
for (const { vid, def, f } of all) {
  const art = def.art, K = D.KINDS[f.kind], full = art.model(f), tag = `${vid} ${f.label} (${f.x},${f.y})`;
  ok(full && full.svg.startsWith("<svg"), tag + ": ぜんぶの 絵");
  // なかに うめた 絵（おきゃくさん・たべもの）は つくる たびに uid が かわる ので のぞいて くらべる
  const body = (m) => m.svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "").replace(/href="[^"]*"/g, 'href=""');
  for (let L = 0; L < K.n; L++) {
    const lf = D.layerFix(f, L), m = art.model(lf);
    ok(m && /<(polygon|ellipse|path)/.test(m.svg) && JSON.stringify(m.vb) === JSON.stringify(full.vb), `${tag}: そう ${L} の 絵（はんいが おなじ）`);
    ok(body(full).includes(body(m)), `${tag}: そう ${L} は ぜんぶの 絵の いちぶ`);
    ok(art.modelKey(lf) === art.modelKey(f) + ":L" + L && D.layerFix(f, L) === lf, `${tag}: そう ${L} の キー`);
    keys.add(art.modelKey(lf));
  }
  ok(!/\bid="/.test(full.svg), tag + ": SVG に id を つかわない");
}
ok(keys.size <= 120, `そうの 絵の キーは かぎられた かず（${keys.size}）`);
// テーブルの かざり（そう 9）は すわって いる ときは 描かない（ぜんぶの 絵 だけ）
{ const b = VenueHalls.defs.bikkupo, t2 = b.floors[1].fixtures.find((f) => f.label === "テーブル 2"), art = b.art; ok(t2.variant === "pancake" && art.model(t2).svg.length > [0, 1, 2, 3].reduce((a, L) => a + art.model(D.layerFix(t2, L)).svg.length, 0) - 4 * 120, "テーブルの かざりは ぜんぶの 絵 だけ"); }

// ---- 4. いりぐち・みち・わりあて ----
const scene = (def, r, vid) => { const sc = new SCENES.venue(); sc.def = def; sc.id = vid; sc.room = r; sc.fixtures = r.fixtures.map((f) => ({ ...f })); const at = r.spawn || [Math.floor(r.w / 2), r.h - 3]; sc.party = Save.d.order.map((id, i) => new Walker(at[0], at[1] + (i ? 0 : 0), "up")); return sc; };
for (const [vid, fl] of VENUES) {
  const def = VenueHalls.defs[vid], r = def.floors[fl], sc = scene(def, r, vid);
  ok(sc.iso === true, vid + ": ななめの 館");
  for (const f of sc.fixtures.filter((f) => D.isSeat(f) && f.action)) {
    const tag = `${vid} ${f.label} (${f.x},${f.y})`, ring = D.ring(sc, f);
    ok(ring.length >= 2 && ring.every(([x, y]) => sc.walkable(x, y) && !(x >= f.x && x < f.x + f.w && y >= f.y && y < f.y + f.h)), tag + ": まわりに とおれる マス");
    if (f.taken) continue;
    const plan = D.plan(sc, f);
    ok(plan && plan.length === 3 && new Set(plan.map((k) => k.n)).size === 3 && plan.every((k) => sc.walkable(k.entry[0], k.entry[1]) && k.route.length >= 1 && k.route[k.route.length - 1].join() === k.entry.join()), tag + ": 3人の せき・いりぐち・みち");
    ok(plan.every((k) => k.route.every(([x, y], i) => i === 0 || sc.walkable(x, y))), tag + ": とおれる マスだけ あるく");
    // おおきい 子ほど おく（ごじ → いちばん おく・がちゃん → てまえ）
    const depth = (k) => k.seat.layer * 10 + k.seat.x + k.seat.y, by = Object.fromEntries(plan.map((k) => [k.id, depth(k)]));
    ok(by.goji <= by.wanko && by.wanko <= by.gachan && plan.find((k) => k.id === "gachan").seat.layer === Math.max(...plan.map((k) => k.seat.layer)), tag + ": おおきい 子ほど おくの せき " + JSON.stringify(by));
  }
}

// ---- 5. すわれる・ほかの せき・カウンター ----
{
  const def = VenueHalls.defs.bikkupo, sc = scene(def, def.floors[1], "bikkupo");
  const booths = sc.fixtures.filter((f) => f.kind === "booth"), taken = booths.filter((f) => f.taken);
  ok(booths.length === 6 && taken.length === 4 && taken.every((f) => ["a", "b", "c", "d"].includes(f.variant)) && booths.filter((f) => !f.taken).every((f) => !f.variant), "おきゃくさんの いる ボックス席は taken（4つ）・あいている 席 2つ");
  ok(sc.fixtures.filter((f) => D.can(sc, f)).length === 6, "びっくぽで すわれる 席は 6つ（ボックス席 2・テーブル 4）");
  ok(!D.can(sc, taken[0]) && !D.can(sc, sc.fixtures.find((f) => f.kind === "bench")) && !D.can({ ...sc, iso: false }, booths.find((f) => !f.taken)), "すわれない: ほかの おきゃくさん・ベンチ・ななめで ない 館");
  for (const f of taken) { const t = D.nearest(sc, sc.fixtures.filter((o) => o !== f && o.action === f.action && D.isSeat(o) && !o.taken)); ok(t && !t.taken && D.isSeat(t), f.label + ": あいている 席へ（" + (t && t.label) + "）"); }
  toasts.length = 0; ok(D.redirect(sc, taken[0]) && /ほかの おきゃくさんの せき/.test(toasts[0]), "ほかの おきゃくさんの 席 → ひとこと");
  ok(!D.redirect(sc, booths.find((f) => !f.taken)), "あいている 席は そのまま");
  sc.dine = { f: booths[0] }; ok(!D.can(sc, booths.find((f) => !f.taken)), "すわって いる ときは ほかの 席に すわらない"); sc.dine = null;
  const h = { ...booths.find((f) => !f.taken), hidden: true }; ok(!D.can(sc, h), "かくれた 席には すわらない");
}
{
  const def = VenueHalls.defs.mall, sc = scene(def, def.floors[2], "mall");
  for (const c of sc.fixtures.filter((f) => f.kind === "foodcounter")) {
    const tables = D.COUNTERS.foodcounter(sc, c);
    ok(tables.length === 3 && tables.every((t) => t.kind === "table" && t.shop === c.shop && t.menu.join() === c.menu.join()), c.label + ": カウンターと おなじ おみせの テーブル 3つ（おなじ メニュー）");
    toasts.length = 0; ok(D.counter(sc, c) && /テーブルに すわって ちゅうもん/.test(toasts[0]), c.label + ": カウンター → テーブルへ");
  }
  ok(sc.fixtures.filter((f) => f.kind === "table" && f.action === "sit").length === 4 && sc.fixtures.filter((f) => f.kind === "table" && f.action === "sit").every((f) => D.can(sc, f)), "フードコートの テーブル 4つ（ひとやすみ）にも すわれる");
  const dm = VenueHalls.defs.museum, ms = scene(dm, dm.floors[3], "museum"), bar = ms.fixtures.find((f) => f.kind === "mucafebar");
  ok(D.COUNTERS.mucafebar(ms, bar).length === 4 && D.counter(ms, bar), "カフェ ジュラの カウンター → テーブル 4つ");
  ok(!D.counter(ms, ms.fixtures.find((f) => f.kind === "mucafetable")), "テーブルは カウンターでは ない");
}

// ---- 6. いまの いち（あるく → すべりこむ → すわる → たべる → たつ）----
{
  const def = VenueHalls.defs.bikkupo, sc = scene(def, def.floors[1], "bikkupo"), f = sc.fixtures.find((f) => f.label === "テーブル 3");
  const kids = D.plan(sc, f); G.t = 100; kids.forEach((k, j) => { k.j = j; k.t0 = 100 + j * D.GAP; k.walkT = Math.max(0, k.route.length - 1) / D.SPEED; });
  const d = { f, kids, phase: "down", food: null, ready: true, upT: 0, eatT: 0 };
  let w = kids.map((k) => D.where(d, k));
  ok(w.every((x, i) => !x.inside && Math.abs(x.x - (kids[i].route[0][0] + 0.5)) < 1e-6 && x.z === 0), "はじめは いまの マスに いる（ゆかの うえ）");
  G.t = 100 + Math.max(...kids.map((k) => k.t0 - 100 + k.walkT)) + D.SLIDE * 0.5; w = kids.map((k) => D.where(d, k));
  ok(w.some((x) => x.inside && x.z > 0), "すべりこむ ときは テーブルと いっしょに 描く");
  G.t = 100 + Math.max(...kids.map((k) => k.t0 - 100 + k.walkT + D.SLIDE)) + 0.01; w = kids.map((k) => D.where(d, k));
  ok(w.every((x, i) => x.inside && x.pose === "sit_01" && Math.abs(x.x - (f.x + kids[i].seat.x)) < 1e-6 && x.z === kids[i].seat.z - D.SINK && x.dir === kids[i].seat.dir), "すわる: いすの うえ・すわる ポーズ・テーブルを むく");
  d.phase = "eat"; d.eatT = G.t; G.t += 0.11; w = kids.map((k) => D.where(d, k));
  ok(w.every((x) => x.face === "happy" && x.bob <= 0) && w.some((x) => x.bob < 0), "たべる: にこにこ・もぐもぐ");
  d.phase = "up"; d.upT = G.t; G.t += D.SLIDE + 1; w = kids.map((k) => D.where(d, k));
  ok(w.every((x, i) => !x.inside && x.x === kids[i].entry[0] + 0.5 && x.y === kids[i].entry[1] + 0.5 && x.z === 0), "たつ: いりぐちの マスに もどる");
  sc.dine = d; const ws = [0, 1, 2].map((i) => D.walker(sc, i)); ok(ws.every((x) => x && x.ghost === false && typeof x.pose === "function"), "たった あとは いつもの 3人と おなじ ように 描く");
  d.phase = "sit"; G.t = 1e6; ok([0, 1, 2].every((i) => D.walker(sc, i).ghost === true && D.walker(sc, i).z > 0), "すわって いる 子は ghost（描かない・すかす ため だけ）");
  const st = D.state(sc); ok(st && st.seated && st.kids.length === 3 && st.kids.every((k) => k.inside && k.pose === "sit_01"), "DineSeats.state（PokaDebug.dine）");
  sc.dine = null; ok(D.state(sc) === null && D.walker(sc, 0) === sc.party[0], "すわって いない ときは いつもの まま");
}

// ---- 7. くみこみ・ことば・とうろく ----
{
  const iso = read("js/iso-venue.js"), hall = read("js/venue-hall.js"), bik = read("js/neri-bikkupo.js"), mall = read("js/mall-art.js"), dino = read("js/dino-hall-art.js"), src = read("js/dine-seats.js"), chara = read("js/chara.js");
  ok(/dine && dine\.f === f \? \(ctx, o\) => DineSeats\.draw\(ctx, this, f, o\)/.test(iso) && /DineSeats\.walker\(this, i\)/.test(iso) && /ghost: !!w\.ghost/.test(iso) && /!\(this\.dine && this\.dine\.f === o\.f\)/.test(iso) && /z = p\.z \|\| 0/.test(iso), "iso-venue.js: すわった テーブルの 絵・3人・すかす");
  ok(/D\.counter\(this,f\)/.test(hall) && /D\.can\(this,f\)\?await D\.sit\(this,f\)/.test(hall) && /await D\.serve\(this,food\.id\)/.test(hall) && /finally\{if\(seated\)await D\.stand\(this\);\}/.test(hall) && /f\.action==='sit'&&this\.iso/.test(hall), "venue-hall.js: たべる・ひとやすみで すわる");
  ok(/D\.redirect\(sc, f\)/.test(bik) && /await D\.sit\(sc, f\)/.test(bik) && /await D\.until\(\(\) => !r \|\| !r\.goal, 5\)/.test(bik) && /await D\.serve\(sc, food\.id\)/.test(bik) && /finally \{ if \(seated\) await D\.stand\(sc\); \}/.test(bik) && /taken: !!GUESTS\[v\]/.test(bik), "neri-bikkupo.js: すわってから ちゅうもん・ロボが きて おさら・ほかの おきゃくさんの 席");
  ok(/only\(k, str\)/.test(mall) && /S\.layer = f\._layer \?\? null/.test(mall) && [mall, dino, bik].every((t) => /\(f\._layer != null \? ":L" \+ f\._layer : ""\)/.test(t)), "そうの 絵の くみたて（mall-art・dino-hall-art・neri-bikkupo の キー）");
  ok(/const CHARA_POSE_EXTRA = \{\};/.test(chara) && /xp && xp\.feetOver/.test(chara), "chara.js: CHARA_POSE_EXTRA と feetOver");
  const texts = [...src.matchAll(/UI\.toast\("([^"]+)"\)/g)].map((m) => m[1]);
  ok(texts.length === 2 && texts.every((t) => !kanji.test(t) && / /.test(t)), "ことばは ひらがな（" + texts.join(" / ") + "）");
  const html = read("index.html"), sw = read("sw.js"), at = (f) => html.indexOf(`js/${f}"`);
  ok(at("dine-seats.js") > at("chara.js") && at("dine-seats.js") > at("iso-venue.js") && at("dine-seats.js") < at("debug.js") && sw.includes('"./js/dine-seats.js"'), "index.html と sw.js に とうろく");
  ok(typeof PokaDebug.dine === "function" && PokaDebug.dine() === null, "PokaDebug.dine");
  ok(/SvgCache\.get\("dinefood:" \+ d\.food/.test(src) && !/SvgCache\.(get|ensure)\([^)]*(Math\.random|Date\.now|G\.t)/.test(src), "おさらの 絵の キーは たべもの ごと（かぎられた かず）");
}

console.log(`✓ dine seats (UI-72): ${n} checks（すわる ポーズ・せき 4しゅ・テーブル ${all.length}・そうの 絵・いりぐち・わりあて・ほかの 席・カウンター・いち・くみこみ）`);
