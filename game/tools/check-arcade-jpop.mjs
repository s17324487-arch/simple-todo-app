// Meeときょれじゃ の 店内 BGM（js/arcade-jpop.js・js/arcade-jpop-maoudamashii.js）の 検査。ブラウザ なしで たしかめる。
// 5きょく・クレジット・ライセンス・1きょく ぜんぶの 音符・楽器・ドラム・同時発音（さいごまで 60 みまん）・再生リスト（ランダム・れんぞく しない・
// 曲が おわると つぎの 曲・館の 中の いどうで とぎれない・ほかの 曲に かわる）・せっていの クレジット・もとの トルコ こうしんきょくは つかわない。
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { ArcadeJpop: AJ, ARCADE_JPOP_DATA: D, SONGS, Sound, ModernMusic: MM } = R;
R.UI.toast = () => {};
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const kanji = /[一-鿿]/;
const root = new URL("..", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8");

// ---- 1. データ・クレジット・ライセンス ----
ok(D.songs.length === 5 && AJ.LIST.length === 5 && new Set(AJ.LIST).size === 5, "5きょく");
ok(D.credit.some((c) => c.includes("BGM：魔王魂")) && D.credit.some((c) => c === "編集: fungamemake.com (著作者:魔王魂)"), "クレジット（BGM：魔王魂・編集: fungamemake.com (著作者:魔王魂)）");
ok(D.license === "マテリアル・コモンズ・ブルー・ライセンス", "ライセンス");
const dataSrc = read("js/arcade-jpop-maoudamashii.js");
ok(dataSrc.startsWith("// 自動生成") && dataSrc.includes("tools/build-arcade-jpop.mjs") && dataSrc.includes("マテリアル・コモンズ・ブルー") && dataSrc.includes("maou.audio"), "データの ファイルの あたまに 自動生成・出典・ライセンス");
for (const s of D.songs) {
  ok(/^jpop_[a-z]+$/.test(s.id) && AJ.LIST.includes(s.id), `${s.id}: id`);
  ok(s.title && !kanji.test(s.title) && s.title.length <= 14, `${s.id}: なまえは ひらがな・カタカナで 14もじ まで`);
  ok(/^maoudamashii_\d\d_[a-z_.]+\.mid$/.test(s.file) && /^[0-9a-f]{64}$/.test(s.sha256), `${s.id}: もとの MIDI の なまえと sha256`);
  ok(s.bpm >= 110 && s.bpm <= 190 && s.seconds >= 180 && s.seconds <= 300 && s.bars * 16 * 60 / s.bpm / 4 - s.seconds < 0.2, `${s.id}: テンポ・ながさ（J-POP の 1きょく ぜんぶ）`);
}
ok(new Set(D.songs.map((s) => s.title)).size === 5 && new Set(D.songs.map((s) => s.file)).size === 5, "5きょくは ぜんぶ ちがう");

// ---- 2. SONGS の 曲・音符・楽器 ----
const ALLOWED_DRUM = ["k", "s", "h", "o", "c", "t", "l"];
const voicePeak = {};
for (const s of D.songs) {
  const song = SONGS[s.id];
  ok(song && song.jpop && song.modern && song.grid === 16 && song.bpm === s.bpm && song.title === s.title && !song.once, `${s.id}: SONGS に 16分音符の 曲`);
  ok(song.source && song.source.credit === D.credit && song.source.file === s.file, `${s.id}: 曲に 出典`);
  const seqs = song.tracks.map((tr) => Sound.parse(tr.notes));
  const len = s.bars * 16;
  ok(seqs.every((q) => q.length === len), `${s.id}: どの パートも ${len} トークン`);
  const parts = song.tracks.map((tr) => tr.part);
  for (const need of ["lead", "bass", "kick", "snare", "hat"]) ok(parts.includes(need), `${s.id}: ${need} の パート`);
  ok(song.tracks.find((tr) => tr.part === "lead").instrument === "lead" && song.tracks.find((tr) => tr.part === "bass").instrument === "ebass", `${s.id}: うたの リード と エレキの ベース`);
  ok(song.tracks.some((tr) => !tr.drum && tr.notes.includes("+")), `${s.id}: 和音`);
  song.tracks.forEach((tr, k) => {
    ok(tr.vol > 0 && tr.vol <= 0.3 && Math.abs(tr.pan || 0) <= 0.5, `${s.id}/${tr.part}: 音量・左右`);
    if (tr.drum) { for (const ev of seqs[k]) if (ev) ok(ALLOWED_DRUM.includes(ev.n), `${s.id}: ドラム ${ev.n}`); return; }
    ok(MM.instruments[tr.instrument] && !tr.wave && tr.gate > 0.5 && tr.gate <= 1, `${s.id}/${tr.part}: 楽器 ${tr.instrument}`);
    let lo = 1e9, hi = 0, cnt = 0;
    for (const ev of seqs[k]) if (ev) for (const note of ev.n.split("+")) { const f = Sound.freq(note); ok(f > 0, `${s.id}: 音符 ${note}`); lo = Math.min(lo, f); hi = Math.max(hi, f); cnt++; }
    if (tr.part === "lead") ok(cnt >= 300 && lo >= 110 && hi <= 1500, `${s.id}: うたの 音域・かず（${cnt}・${lo.toFixed(0)}〜${hi.toFixed(0)}Hz）`);
    if (tr.part === "bass") ok(cnt >= 300 && lo >= 30 && hi <= 420, `${s.id}: ベースの 音域（${lo.toFixed(0)}〜${hi.toFixed(0)}Hz）`);
  });
  ok(seqs[song.tracks.findIndex((tr) => tr.part === "kick")].filter(Boolean).length >= 200, `${s.id}: ドラムが ある（J-POP）`);
  // 同時発音: ModernMusic.note / drum と おなじ ながさで 1きょく ぜんぶ かぞえる（ボイスの 上限 80・スモークの 60 みまん）
  const stepDur = MM.stepDur(song), ev = [];
  const DRUM_DUR = { k: 0.19, s: 0.14, o: 0.24, c: 0.95, t: 0.22, l: 0.28 };
  song.tracks.forEach((tr, k) => seqs[k].forEach((e, step) => {
    if (!e) return;
    const at = step * stepDur;
    if (tr.drum) { ev.push([at, 1], [at + (DRUM_DUR[e.n] || 0.055) + 0.01, -1]); return; }
    const d = MM.instruments[tr.instrument], dur = e.len * stepDur * (tr.gate || 0.88), hold = Math.max(d.attack + 0.03, dur);
    e.n.split("+").forEach((_, i) => { const t0 = at + i * 0.009; ev.push([t0, 1], [t0 + hold + d.release + 0.01, -1]); });
  }));
  ev.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  let v = 0, peak = 0;
  for (const [, d] of ev) { v += d; peak = Math.max(peak, v); }
  voicePeak[s.id] = peak;
  ok(peak < 60, `${s.id}: 同時発音が おおすぎる（${peak}）`);
}

// ---- 3. 再生リスト ----
const L = Sound.lists.arcade_hall;
ok(L === AJ.LIST && Sound.lists.shop_ike_arcade === L, "館と けいひん カウンターは おなじ 再生リスト");
ok(SONGS.arcade_hall && SONGS.arcade_hall.jpop && SONGS.shop_ike_arcade === SONGS.arcade_hall && !/トルコ/.test(SONGS.arcade_hall.title), "arcade_hall は J-POP（トルコ こうしんきょくは つかわない）");
ok(!read("js/ike-arcade.js").includes("disc_turkish"), "ike-arcade.js に トルコ こうしんきょくの アレンジが のこって いない");
{
  // ランダム: ひとまわりで ぜんぶ 1かいずつ・となりどうし おなじ 曲に ならない
  Sound.bags.delete(L);
  const picks = Array.from({ length: 500 }, () => Sound.pickFrom(L));
  for (let i = 0; i + 5 <= picks.length; i += 5) ok(new Set(picks.slice(i, i + 5)).size === 5, "5かいで 5きょく ぜんぶ");
  for (let i = 1; i < picks.length; i++) ok(picks[i] !== picks[i - 1], "おなじ 曲が つづかない");
  const first = new Set(); for (let t = 0; t < 200; t++) { Sound.bags.delete(L); first.add(Sound.pickFrom(L)); }
  ok(first.size === 5, "はじめの 曲も ランダム");
}
{
  // Sound.bgm の ながれ（音は ださない: ctx と ModernMusic を まねる）
  const calls = [], started = [];
  const bus0 = MM.bus, step0 = MM.step, rel0 = MM.release, on0 = L.onStart;
  MM.bus = () => ({ voices: new Set() }); MM.release = () => {}; MM.step = (bus, tracks, step, at) => calls.push([step, at]);
  L.onStart = (id) => { started.push(id); on0(id); };
  Sound.ctx = { currentTime: 0, state: "running" };
  const tick = (sec) => { const end = Sound.ctx.currentTime + sec; while (Sound.ctx.currentTime < end) { Sound.ctx.currentTime = Math.min(end, Sound.ctx.currentTime + 0.04); Sound.schedule(); } };
  const run = (name) => { Sound.bgm(name); clearInterval(Sound.timer); };
  run("arcade_hall");
  const a = Sound.cur.id;
  ok(Sound.cur.name === "arcade_hall" && Sound.cur.list === L && L.includes(a) && started[0] === a && AJ.now === a, "館に はいると 5きょくの どれか");
  tick(3);
  ok(calls.length > 0 && Math.abs(calls[1][1] - calls[0][1] - MM.stepDur(SONGS[a])) < 1e-9, "16分音符の はやさで すすむ");
  run("shop_ike_arcade"); ok(Sound.cur.id === a && Sound.cur.name === "arcade_hall", "けいひん カウンターに はいっても 曲は そのまま");
  run("arcade_hall"); ok(Sound.cur.id === a, "あそぶ 画面から もどっても そのまま");
  // 曲の おわり → GAP あけて つぎの 曲（ちがう 曲）
  const lastAt = () => calls[calls.length - 1][1];
  const lenA = Sound.cur.len;
  Sound.cur.step = lenA - 4; calls.length = 0; tick(Sound.GAP + 1.5);
  const endAt = calls.find((c) => c[0] === lenA - 1)[1];
  const b = Sound.cur.id, firstB = calls.find((c) => c[0] === 0);
  ok(b !== a && L.includes(b) && started[started.length - 1] === b, "曲が おわると つぎの 曲（おなじ 曲は つづかない）");
  ok(firstB && Math.abs(firstB[1] - endAt - MM.stepDur(SONGS[a]) - Sound.GAP) < 1e-6, "曲と 曲の あいだは GAP びょう");
  ok(Sound.cur.name === "arcade_hall" && Sound.cur.list === L, "つぎの 曲も 館の 再生リスト");
  // うしろの タブから もどった とき（ながい とび）も つぎの 曲へ すすむ
  Sound.ctx.currentTime += 400; tick(Sound.GAP + 0.5);
  ok(L.includes(Sound.cur.id) && Sound.cur.step < Sound.cur.len && lastAt() >= Sound.ctx.currentTime - 0.5, "ながく とんでも 再生リストの まま");
  // ほかの 曲に かえると とまる・もどると また ランダム
  run("town"); ok(Sound.cur.name === "town" && !Sound.cur.list, "町に でると 町の 曲");
  run("arcade_hall"); ok(L.includes(Sound.cur.id) && Sound.cur.step <= 8, "また はいると 曲の はじめから（ランダムの つぎ）");
  Sound.stopBgm(); ok(!Sound.cur, "とめられる");
  MM.bus = bus0; MM.step = step0; MM.release = rel0; L.onStart = on0; Sound.ctx = null;
}

// ---- 4. クレジット・ファイル ----
{
  const credit = AJ.credit();
  ok(credit.includes("魔王魂") && credit.includes("https://maou.audio/") && credit.includes("fungamemake.com") && credit.length <= 120, "せっていの クレジット");
  ok(read("js/menu.js").includes("ArcadeJpop.credit()"), "せっていに クレジットを だす");
  const doc = read("docs/MUSIC.md");
  ok(doc.includes("魔王魂") && doc.includes("fungamemake.com") && doc.includes("マテリアル・コモンズ・ブルー") && doc.includes("maou.audio/rule"), "docs/MUSIC.md に 出典・ライセンス");
  const html = read("index.html"), sw = read("sw.js");
  for (const f of ["js/arcade-jpop-maoudamashii.js", "js/arcade-jpop.js"]) ok(html.includes(`<script src="${f}">`) && sw.includes(`"./${f}"`), `${f}: index.html と sw.js`);
  ok(html.indexOf("js/ike-arcade.js") < html.indexOf("js/arcade-jpop-maoudamashii.js") && html.indexOf("js/arcade-jpop-maoudamashii.js") < html.indexOf("js/arcade-jpop.js"), "よみこむ じゅんばん");
  for (const f of ["js/arcade-jpop.js", "js/arcade-jpop-maoudamashii.js"]) ok(!/fetch\(|XMLHttpRequest|new Audio\(|\.mp3|\.ogg|\.mid"/.test(read(f).replace(/"file":"maoudamashii_[^"]+\.mid"/g, "")), `${f}: 音声ファイル・そとへの つうしん なし`);
}

console.log(`✓ arcade-jpop OK（${n} 項目）: 5きょく ${D.songs.map((s) => `${s.title} ${s.bpm}BPM ${Math.round(s.seconds)}びょう`).join("・")}・同時発音 ${Object.values(voicePeak).join("/")}`);
