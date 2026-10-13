// ゲームセンターの ふえた けいひんと レア（js/arcade-prizes.js・js/crane-machines.js・UI-124）の 検査（ブラウザ なし）
// ふつうの ぬいぐるみ 12しゅ（3人 × 4）・いろちがい 9しゅ（ひやけ・ピンク・にじいろ）・まえの いちばんくじの ぬいぐるみ 24しゅ（くじの 絵・家具を わたす）・
// レアは ふだんの なかまに はいらない・3人の 台に 5にちに 1にち くらい 1しゅ まざる・でにくい（pick）・絵の id・ことば・登録
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";
const R = gameContext();
const { ArcadePrizes: A, CraneMachines: CM, PrizeArcade: PA, KujiArt, FURN_INDEX } = R;
let n = 0;
const ok = (c, m) => { n++; assert(c, m); };
const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const IDS = ["wanko", "gachan", "goji"];
const dayOf = (k) => { const t = new Date(Date.UTC(2026, 8, 1) + k * 86400000); return `${t.getUTCFullYear()}-${t.getUTCMonth() + 1}-${t.getUTCDate()}`; };

// ---- 1. ふつうの ぬいぐるみ（12〜15 ばん）----
for (const who of IDS) {
  ok(A.MORE_HERO[who].length === 4, `${who}: ふえた ぬいぐるみ 4しゅ`);
  for (let i = 12; i < 16; i++) {
    const it = A.INDEX[`ike_chibi_${who}_${i}`];
    ok(it && it.size === "chibi" && !it.rare && !it.season && FURN_INDEX[it.id] && !/[一-鿿]/.test(it.name), `${who} ${i}: ふつうの ぬいぐるみ`);
    for (const dir of ["down", "up"]) { const s = A.svg(it.id, dir); ok(s.startsWith("<svg") && !/undefined|NaN/.test(s), `${it.id} の 絵（${dir}）`); }
  }
  const words = A.ITEMS.filter((it) => it.size === "chibi" && it.spec.who === who && !it.rare).map((it) => it.word);
  ok(new Set(words).size === words.length, `${who}: なまえが かさならない ${words}`);
}
// ---- 2. いろちがい（レア）----
for (const who of IDS) for (const tint of Object.keys(A.TINT)) {
  const it = A.INDEX[`ike_chibi_${who}_${tint}`];
  ok(it && it.rare && it.size === "chibi" && it.spec.tint === tint && FURN_INDEX[it.id] && FURN_INDEX[it.id].rare, `${who} ${tint}: いろちがい`);
  for (const dir of ["down", "up"]) {
    // からだの いろ（PROFILE の fill）が ぜんぶ かわる（のこるのは ふだの 白など まわりの かざりだけ）
    const s = A.svg(it.id, dir), base = R.PROFILE[who].fill, cnt = (x, t) => x.split(t).length - 1;
    const plain = R.Chara.svg(who, { pose: it.spec.pose, face: it.spec.face, dir, outfit: {}, color: "soft" }), body = cnt(plain, `fill="${base}"`);
    const now = tint === "rainbow" ? `fill="url(#rb_${who}_${dir})"` : `fill="${A.TINT[tint].col[who]}"`;
    ok(s.startsWith("<svg") && !/undefined|NaN/.test(s) && body >= 4 && cnt(s, now) === body && cnt(s, `fill="${base}"`) <= 1, `${it.id}（${dir}）: からだの いろが かわって いない`);
    if (tint === "rainbow") { const ids = s.match(/id="rb_[^"]+"/g) || []; ok(ids.length === 1 && ids[0] === `id="rb_${who}_${dir}"`, `${it.id}: にじいろの グラデーションの id`); }
  }
  ok(/^(ひやけ |ピンクの |にじいろ )/.test(it.name) && !/[一-鿿]/.test(it.name + it.desc), `${it.id}: なまえ「${it.name}」`);
}
ok(A.INDEX.ike_chibi_goji_tan.name === "ひやけ ごじの ぬいぐるみ" && A.INDEX.ike_chibi_wanko_rainbow.name === "にじいろ わんこの ぬいぐるみ" && A.INDEX.ike_chibi_gachan_pink.name === "ピンクの がちゃんの ぬいぐるみ", "いろちがいの なまえ（オーナーの れい）");
// ---- 3. まえの いちばんくじの ぬいぐるみ（レア）----
ok(A.KUJI_RARE.length === 24, "くじの ぬいぐるみ 24しゅ");
for (const [kid, who, w, h] of A.KUJI_RARE) {
  const it = A.INDEX[`ike_kuji_${kid}`], P = KujiArt.PLUSH[kid], f = FURN_INDEX[kid];
  ok(P && P.w === w && P.h === h, `${kid}: 絵の 大きさが KujiArt.PLUSH と ちがう`);
  ok(f && f.kujiPrize && f.name.includes(R.ArcadePrizes.NAME[who]) && /ぬいぐるみ/.test(f.name), `${kid}: くじの ${who} の ぬいぐるみ（${f && f.name}）`);
  ok(it && it.rare && it.noFurn && it.prize === kid && A.prizeOf(it) === kid && !FURN_INDEX[it.id] && it.name === f.name, `${kid}: レア・とれると くじの 家具`);
  const s = A.svg(it.id, "down");
  ok(s.startsWith("<svg") && s.includes(`viewBox="0 0 ${w} ${h}"`) && s.length > 2000, `${kid}: くじの 絵`);
  const S = CM.SHAPES[it.shape]();
  ok(S.prize === kid && S.look === it.look && S.parts.length && S.art[2] > 0 && S.art[3] > 0, `${kid}: 台の 形`);
}
// ---- 4. レアの でかた ----
for (const who of IDS) {
  const L = A.rarePool(who);
  ok(L.length === 3 + 8 && L.every((it) => it.spec.who === who && it.rare), `${who}: レアの なかま ${L.length}`);
}
const heroDefs = CM.DEFS.filter((d) => d && d.season);
ok(heroDefs.length >= 3 && IDS.every((who) => heroDefs.some((d) => d.season === who)), "3人の ぬいぐるみの 台");
for (const d of CM.DEFS) if (d && d.pool) ok(!d.pool.some((sh) => A.ITEMS.some((it) => it.rare && it.shape === sh)), `台 ${d.id}: ふだんの なかまに レアが いない`);
for (const d of heroDefs) {
  let rareDays = 0; const seen = new Set();
  for (let k = 0; k < 400; k++) {
    const day = dayOf(k), r = A.rareOf(d.season, d.id, day), list = CM.lineup(d, day), rs = list.filter((sh) => A.ITEMS.some((it) => it.rare && it.shape === sh));
    ok(r ? rs.length === 1 && rs[0] === r.shape && list[list.length - 1] === r.shape : !rs.length, `台 ${d.id} ${day}: レアの ならび ${list}`);
    ok(A.rareOf(d.season, d.id, day) === r, "おなじ 日は おなじ レア");
    if (r) { rareDays++; seen.add(r.id); ok(r.spec.who === d.season, "その 台の 子の レア"); }
  }
  ok(rareDays >= 50 && rareDays <= 115, `台 ${d.id}: レアの 日 ${rareDays} / 400（5にちに 1にち くらい）`);
  ok(seen.size >= 9, `台 ${d.id}: いろいろな レアが でる ${seen.size}`);
  const idx = CM.DEFS.indexOf(d);
  const k = [...Array(400).keys()].find((k) => A.rareOf(d.season, d.id, dayOf(k)));
  const day = dayOf(k), r = A.rareOf(d.season, d.id, day);
  ok(PA.prizeList(idx, day).includes(A.prizeOf(r)) && PA.rareNote(idx, day).includes("レア") && PA.rareNote(idx, day).includes(PA.item(A.prizeOf(r)).name), `台 ${d.id}: レアの ひとこと「${PA.rareNote(idx, day)}」`);
  const k2 = [...Array(400).keys()].find((k) => !A.rareOf(d.season, d.id, dayOf(k)));
  ok(PA.rareNote(idx, dayOf(k2)) === "", "レアの ない 日は ひとこと なし");
}
// でにくい: pick の おもみ（レアは ほかの 1/3）
{
  const d = heroDefs[0], k = [...Array(400).keys()].find((k) => A.rareOf(d.season, d.id, dayOf(k))), list = CM.lineup(d, dayOf(k)), rare = list[list.length - 1];
  let seed = 7; const fake = { rand: () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648) };
  const cnt = {}; for (let i = 0; i < 30000; i++) { const s = CM.CraneRound.prototype.pick.call(fake, list); cnt[s] = (cnt[s] || 0) + 1; }
  const others = list.filter((s) => s !== rare).map((s) => cnt[s] || 0), avg = others.reduce((a, b) => a + b, 0) / others.length;
  ok(cnt[rare] > avg * 0.22 && cnt[rare] < avg * 0.45, `レアは でにくい ${cnt[rare]} / ${avg | 0}`);
  const plain = list.slice(0, -1); seed = 7; const c2 = {}; for (let i = 0; i < 3000; i++) { const s = CM.CraneRound.prototype.pick.call(fake, plain); c2[s] = (c2[s] || 0) + 1; }
  ok(Object.keys(c2).length === plain.length, "レアが ない ときは まえと おなじ");
}
// ---- 5. ことば・登録 ----
{
  const src = read("js/arcade-prizes.js");
  ok(/rareOf/.test(read("js/crane-machines.js")) && /rareNote/.test(read("js/crane-scene.js")), "台の ならび・ひとこと");
  ok(!/Math\.random|Date\.now/.test(src.slice(src.indexOf("RARE_EVERY"))), "レアは 日づけと 台で きまる（乱数・時刻を つかわない）");
  ok(/check-arcade-rare\.mjs/.test(read("package.json")), "package.json の check");
}
console.log(`✓ ゲームセンターの けいひんと レア（UI-124）: ${n} 項目`);
