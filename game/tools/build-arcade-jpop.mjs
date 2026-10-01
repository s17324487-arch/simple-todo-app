// Meeときょれじゃ の 店内 BGM（J-POP 5きょく）を MIDI から つくる。
// 使い方: node tools/build-arcade-jpop.mjs <MIDI の フォルダ>
//
// もとの 曲: 魔王魂（森田交一）の 歌もの。MIDI は fungamemake.com が ゲーム用に 編集した もの
//   （https://github.com/munokura/maoudamashii-sound-dmg-ogg の song-midi/・マテリアル・コモンズ・ブルー・ライセンス・
//    クレジット「編集: fungamemake.com (著作者:魔王魂)」）。MIDI は リポジトリに いれない（sha256 が ちがう ときは とまる）。
// できる もの: js/arcade-jpop-maoudamashii.js（自動生成。手で なおさない）。
//   音の たかさ・ながさ・タイミングは MIDI の まま（16分音符に そろえる・テンポの かわる ところは 時間の まま）。
//   どの パートを どの 楽器で ならすか・音量・ドラムの おきかえ は この ゲームの アレンジ（下の SONGS）。
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(root, "js", "arcade-jpop-maoudamashii.js");

// ---- MIDI（Standard MIDI File）の よみこみ ----
function readSmf(file) {
  const b = readFileSync(file);
  let p = 0;
  const u32 = () => { const v = b.readUInt32BE(p); p += 4; return v; };
  const u16 = () => { const v = b.readUInt16BE(p); p += 2; return v; };
  const str = (n) => { const s = b.toString("latin1", p, p + n); p += n; return s; };
  if (str(4) !== "MThd") throw new Error("MIDI では ない: " + file);
  const hl = u32(); u16(); const ntr = u16(), div = u16();
  p = 8 + hl;
  if (div & 0x8000) throw new Error("SMPTE の 時間は よめない: " + file);
  const tracks = [];
  for (let i = 0; i < ntr; i++) {
    const id = str(4), len = u32(), end = p + len;
    if (id !== "MTrk") { p = end; continue; }
    const events = []; let t = 0, status = 0;
    const vlq = () => { let v = 0, c; do { c = b[p++]; v = (v << 7) | (c & 0x7f); } while (c & 0x80); return v; };
    while (p < end) {
      t += vlq();
      let st = b[p];
      if (st & 0x80) p++; else st = status;
      if (st === 0xff) {
        const type = b[p++], l = vlq(), data = b.subarray(p, p + l); p += l;
        if (type === 0x51) events.push({ t, type: "tempo", us: (data[0] << 16) | (data[1] << 8) | data[2] });
        else if (type === 0x2f) break;
        continue;
      }
      if (st === 0xf0 || st === 0xf7) { p += vlq(); continue; }
      status = st;
      const kind = st & 0xf0, ch = st & 0x0f;
      if (kind === 0x90 || kind === 0x80) { const note = b[p++], vel = b[p++]; events.push({ t, type: kind === 0x90 && vel > 0 ? "on" : "off", ch, note }); }
      else if (kind === 0xa0 || kind === 0xb0 || kind === 0xe0) p += 2;
      else if (kind === 0xc0 || kind === 0xd0) p += 1;
    }
    p = end;
    tracks.push(events);
  }
  return { tpq: div, tracks };
}
function notesOf(smf) {
  const out = [];
  for (const events of smf.tracks) {
    const open = new Map();
    for (const e of events) {
      if (e.type !== "on" && e.type !== "off") continue;
      const k = e.ch * 128 + e.note;
      if (open.has(k)) { const o = open.get(k); open.delete(k); out.push({ ...o, t1: e.t }); }
      if (e.type === "on") open.set(k, { ch: e.ch, note: e.note, t0: e.t });
    }
    for (const o of open.values()) out.push({ ...o, t1: o.t0 + smf.tpq / 4 });
  }
  return out.sort((a, b) => a.t0 - b.t0 || a.ch - b.ch || a.note - b.note);
}
function tempoMap(smf) {
  const ev = [];
  for (const events of smf.tracks) for (const e of events) if (e.type === "tempo") ev.push({ t: e.t, us: e.us });
  ev.sort((a, b) => a.t - b.t);
  if (!ev.length || ev[0].t > 0) ev.unshift({ t: 0, us: 500000 });
  let s = 0;
  for (let i = 0; i < ev.length; i++) { if (i) s += (ev[i].t - ev[i - 1].t) * ev[i - 1].us / 1e6 / smf.tpq; ev[i].s = s; }
  const sec = (t) => { let i = ev.length - 1; while (i > 0 && ev[i].t > t) i--; return ev[i].s + (t - ev[i].t) * ev[i].us / 1e6 / smf.tpq; };
  return { ev, sec };
}

// ---- アレンジ ----
// ドラム（GM の おとの ばんごう → ModernMusic の k s h o c t l）
const KIT = {
  kick: { 35: "k", 36: "k", 41: "l", 43: "l", 45: "l", 47: "t", 48: "t", 50: "t" },
  snare: { 37: "s", 38: "s", 39: "s", 40: "s" },
  hat: { 42: "h", 44: "h", 46: "o", 51: "h", 53: "h", 59: "h", 54: "h", 69: "h", 70: "h" },
  crash: { 49: "c", 52: "c", 55: "c", 57: "c" },
};
// 音量は うた（lead）との くらべで きめた（なって いる ところの 音の 大きさ: ベース −2dB・バスドラム −4dB・スネア −8dB・ハイハット −20dB くらい）
const drums = (v = 1) => [
  { part: "kick", drum: true, map: KIT.kick, vol: 0.28 * v, pri: "ktl" },
  { part: "snare", drum: true, map: KIT.snare, vol: 0.3 * v, pan: -0.04 },
  { part: "hat", drum: true, map: KIT.hat, vol: 0.1 * v, pan: 0.24, pri: "oh" },
  { part: "crash", drum: true, map: KIT.crash, vol: 0.12 * v, pan: -0.2 },
];
// from = MIDI の チャンネル・fill = from が やすみの ところだけ つかう チャンネル（ギターソロ など。fillMin より ひくい 音は つかわない）
// mono = "high"（いちばん たかい 音）/ "low"・max = 和音の 音の かず・keep = "low" なら したから
export const SONGS = [
  { id: "jpop_smile", file: "maoudamashii_13_smileandsmile.mid", sha256: "526d1940d76e0e8b37979a181e88eb9d36d7b4e67547ee39f16890a66e63a038",
    title: "スマイル アンド スマイル", original: "Smile and Smile", parts: [
      { part: "lead", instrument: "lead", from: [0], fill: [5], mono: "high", vol: 0.2, pan: 0.06, gate: 0.94 },
      { part: "harmony", instrument: "lead", from: [1, 2], mono: "high", vol: 0.07, pan: -0.3, gate: 0.9 },
      { part: "riff", instrument: "chip", from: [15], mono: "high", vol: 0.07, pan: 0.32, gate: 0.7 },
      { part: "guitar", instrument: "gtr", from: [6], max: 3, keep: "low", vol: 0.09, pan: -0.24, gate: 0.9 },
      { part: "counter", instrument: "epiano", from: [7], mono: "high", vol: 0.07, pan: 0.2, gate: 0.9 },
      { part: "rhythm", instrument: "pluck", from: [8], max: 2, vol: 0.08, pan: -0.36, gate: 0.7 },
      { part: "pad", instrument: "pad", from: [13], max: 4, vol: 0.055, pan: 0, gate: 0.96 },
      { part: "bass", instrument: "ebass", from: [4], mono: "low", vol: 0.17, pan: 0, gate: 0.86 },
      ...drums(),
    ] },
  { id: "jpop_drive", file: "maoudamashii_10_drive.mid", sha256: "100430a2e633fb24fc4dc20b4c8f06cf85bc602c0c7ad2194f51ed2705a2d102",
    title: "ドライブ", original: "Drive", parts: [
      { part: "lead", instrument: "lead", from: [0], fill: [5, 6], mono: "high", vol: 0.2, pan: 0.06, gate: 0.94 },
      { part: "harmony", instrument: "lead", from: [1], mono: "high", vol: 0.07, pan: -0.3, gate: 0.9 },
      { part: "riff", instrument: "pluck", from: [7], max: 2, vol: 0.06, pan: 0.3, gate: 0.72 },
      { part: "guitar", instrument: "gtr", from: [8], max: 3, keep: "low", vol: 0.085, pan: -0.26, gate: 0.86 },
      { part: "pad", instrument: "pad", from: [13], max: 4, vol: 0.055, pan: 0, gate: 0.96 },
      { part: "bass", instrument: "ebass", from: [4], mono: "low", vol: 0.17, pan: 0, gate: 0.86 },
      ...drums(),
    ] },
  { id: "jpop_memories", file: "maoudamashii_04_memories.mid", sha256: "ba432851290372f58c14f6bc6cae4abcb24fe867211edbda343cd03e840326ca",
    title: "メモリーズ", original: "Memories", parts: [
      { part: "lead", instrument: "lead", from: [0], fill: [5], mono: "high", vol: 0.2, pan: 0.06, gate: 0.94 },
      { part: "harmony", instrument: "lead", from: [1], mono: "high", vol: 0.07, pan: -0.3, gate: 0.9 },
      { part: "riff", instrument: "chip", from: [6], mono: "high", vol: 0.07, pan: 0.3, gate: 0.8 },
      { part: "guitar", instrument: "gtr", from: [7], max: 3, keep: "low", vol: 0.08, pan: -0.24, gate: 0.8 },
      { part: "piano", instrument: "piano", from: [12], max: 2, vol: 0.09, pan: 0.2, gate: 0.8 },
      { part: "counter", instrument: "epiano", from: [13], mono: "high", vol: 0.06, pan: -0.14, gate: 0.9 },
      { part: "pad", instrument: "pad", from: [14], max: 4, vol: 0.055, pan: 0, gate: 0.96 },
      { part: "bass", instrument: "ebass", from: [4], mono: "low", vol: 0.17, pan: 0, gate: 0.86 },
      ...drums(),
    ] },
  { id: "jpop_flower", file: "maoudamashii_01_flower.mid", sha256: "76368510fd166020ff17792c58e27881646a45eb2ce2f8c765b57b4bb1bbc839",
    title: "フラワー", original: "Flower", parts: [
      { part: "lead", instrument: "lead", from: [0], fill: [5, 6], mono: "high", vol: 0.2, pan: 0.06, gate: 0.94 },
      { part: "harmony", instrument: "lead", from: [1], mono: "high", vol: 0.07, pan: -0.3, gate: 0.9 },
      { part: "riff", instrument: "chip", from: [10], max: 2, vol: 0.065, pan: 0.3, gate: 0.7 },
      { part: "guitar", instrument: "gtr", from: [7, 8], max: 3, keep: "low", vol: 0.08, pan: -0.24, gate: 0.8 },
      { part: "piano", instrument: "piano", from: [12], max: 2, vol: 0.09, pan: 0.18, gate: 0.85 },
      { part: "counter", instrument: "epiano", from: [13], mono: "high", vol: 0.06, pan: -0.14, gate: 0.9 },
      { part: "pad", instrument: "pad", from: [14], max: 4, vol: 0.055, pan: 0, gate: 0.96 },
      { part: "bass", instrument: "ebass", from: [4], mono: "low", vol: 0.17, pan: 0, gate: 0.86 },
      ...drums(),
    ] },
  { id: "jpop_tsubasa", file: "maoudamashii_20_tsubasa.mid", sha256: "da37139bdb80b6b2753db7e66b592144cd1a0aa52250711f6457284d69a34f66",
    title: "つばさ", original: "Tsubasa", parts: [
      { part: "lead", instrument: "lead", from: [0], fill: [5], mono: "high", vol: 0.2, pan: 0.06, gate: 0.94 },
      { part: "harmony", instrument: "lead", from: [1], mono: "high", vol: 0.07, pan: -0.3, gate: 0.9 },
      { part: "riff", instrument: "chip", from: [14], mono: "high", vol: 0.07, pan: 0.3, gate: 0.7 },
      { part: "arpeggio", instrument: "pluck", from: [10], max: 2, vol: 0.055, pan: 0.34, gate: 0.72 },
      { part: "guitar", instrument: "gtr", from: [7], max: 2, keep: "low", vol: 0.08, pan: -0.24, gate: 0.8 },
      { part: "piano", instrument: "epiano", from: [12], max: 3, vol: 0.07, pan: 0.16, gate: 0.85 },
      { part: "pad", instrument: "pad", from: [13], max: 3, vol: 0.055, pan: 0, gate: 0.96 },
      { part: "bass", instrument: "ebass", from: [4], mono: "low", vol: 0.17, pan: 0, gate: 0.86 },
      ...drums(),
    ] },
];

const NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const noteName = (m) => NAMES[m % 12] + (Math.floor(m / 12) - 1);

export function convert(file, parts) {
  const smf = readSmf(file), notes = notesOf(smf), tm = tempoMap(smf);
  const last = Math.max(...notes.map((n) => n.t1));
  // いちばん ながく つづく テンポが 曲の テンポ（はじめの 1小節の じゅんびと おわりの ゆっくりは 時間の まま 16分音符に よせる）
  const spans = new Map();
  tm.ev.forEach((e, i) => { const t2 = i + 1 < tm.ev.length ? tm.ev[i + 1].t : last; spans.set(e.us, (spans.get(e.us) || 0) + Math.max(0, t2 - e.t)); });
  const mainUs = [...spans.entries()].sort((a, b) => b[1] - a[1])[0][0];
  const bpm = Math.round(60e6 / mainUs), origin = tm.ev.find((e) => e.us === mainUs).t;
  const stepSec = 60 / bpm / 4, s0 = tm.sec(origin);
  const at = (t) => Math.round((tm.sec(t) - s0) / stepSec);
  const all = notes.filter((n) => n.t0 >= origin).map((n) => { const a = at(n.t0); return { ...n, a, b: Math.max(a + 1, at(n.t1)) }; });
  const len = Math.ceil((Math.max(...all.map((n) => n.b)) + 1) / 16) * 16;
  const tracks = [];
  for (const p of parts) {
    const tok = new Array(len).fill("_");
    if (p.drum) {
      const pri = p.pri || "";
      for (const n of all) {
        if (n.ch !== 9 || !p.map[n.note]) continue;
        const k = p.map[n.note], cur = tok[n.a];
        if (cur === "_" || pri.indexOf(k) < pri.indexOf(cur)) tok[n.a] = k;
      }
    } else {
      let ns = all.filter((n) => p.from.includes(n.ch));
      if (p.fill) {
        const busy = new Uint8Array(len + 8);
        for (const n of ns) for (let s = Math.max(0, n.a - 2); s < n.b + 2; s++) busy[s] = 1;
        // ソロの ギターの ひくい きざみ（C3 より した）は うたの パートに いれない
        ns = ns.concat(all.filter((n) => p.fill.includes(n.ch) && n.note >= (p.fillMin ?? 48) && ![...Array(n.b - n.a).keys()].some((i) => busy[n.a + i])));
      }
      const by = new Map();
      for (const n of ns) { if (!by.has(n.a)) by.set(n.a, []); by.get(n.a).push(n); }
      const onsets = [...by.keys()].sort((x, y) => x - y);
      onsets.forEach((a, i) => {
        let g = by.get(a).sort((x, y) => x.note - y.note).filter((n, j, arr) => j === 0 || n.note !== arr[j - 1].note);
        if (p.mono) g = [p.mono === "low" ? g[0] : g[g.length - 1]];
        else if (p.max && g.length > p.max) g = p.keep === "low" ? g.slice(0, p.max) : g.slice(g.length - p.max);
        const next = i + 1 < onsets.length ? onsets[i + 1] : len;
        const b = Math.min(next, Math.max(...g.map((n) => n.b)));
        tok[a] = g.map((n) => noteName(n.note)).join("+");
        for (let s = a + 1; s < b; s++) tok[s] = ".";
      });
    }
    // 小節の じしょ（おなじ 小節は 1かいだけ かく）
    const bars = [], seq = [], index = new Map();
    for (let i = 0; i < len; i += 16) {
      const bar = tok.slice(i, i + 16).join(" ");
      if (!index.has(bar)) { index.set(bar, bars.length); bars.push(bar); }
      seq.push(index.get(bar));
    }
    const tr = p.drum ? { drum: true, part: p.part, vol: round(p.vol), pan: p.pan || 0 } : { part: p.part, instrument: p.instrument, vol: round(p.vol), pan: p.pan, gate: p.gate };
    tracks.push({ ...tr, bars, seq, notes: tok.filter((x) => x !== "_" && x !== ".").length });
  }
  return { bpm, len, seconds: Math.round(len * stepSec * 10) / 10, tracks };
}
const round = (v) => Math.round(v * 1000) / 1000;

export function build(dir) {
  const songs = [];
  for (const s of SONGS) {
    const file = join(dir, s.file), sha = createHash("sha256").update(readFileSync(file)).digest("hex");
    if (sha !== s.sha256) throw new Error(`${s.file}: sha256 が ちがう（${sha}）。べつの MIDI かも しれない`);
    const r = convert(file, s.parts);
    songs.push({ id: s.id, title: s.title, original: s.original, file: s.file, sha256: s.sha256, bpm: r.bpm, bars: r.len / 16, seconds: r.seconds,
      tracks: r.tracks.map(({ notes, ...t }) => t) });
  }
  return songs;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dir = process.argv[2];
  if (!dir) { console.error("使い方: node tools/build-arcade-jpop.mjs <MIDI の フォルダ>（munokura/maoudamashii-sound-dmg-ogg の song-midi）"); process.exit(1); }
  const songs = build(dir);
  const head = `// 自動生成（node tools/build-arcade-jpop.mjs <MIDI の フォルダ>）。手で なおさない。
// Meeときょれじゃ の 店内 BGM: 魔王魂（森田交一）の 歌もの（J-POP）5きょくを この ゲームの 音で ならす アレンジ（1トークン = 16分音符・小節の じしょ）。
// もとの MIDI: 編集: fungamemake.com (著作者:魔王魂)（https://github.com/munokura/maoudamashii-sound-dmg-ogg）。
// ライセンス: マテリアル・コモンズ・ブルー・ライセンス（https://ja.materialcommons.org/mtcm-b-summary/）。この ファイルも おなじ ライセンスで くばる。
// 魔王魂の 利用規約（https://maou.audio/rule/）: アレンジを「魔王魂の アレンジ」と 著作表記して くばれる。クレジット「BGM：魔王魂」。
`;
  const body = "const ARCADE_JPOP_DATA = {\n  credit: " + JSON.stringify(["BGM：魔王魂（https://maou.audio/）", "編集: fungamemake.com (著作者:魔王魂)"]) + ",\n  license: \"マテリアル・コモンズ・ブルー・ライセンス\",\n  songs: [\n" +
    songs.map((s) => "    " + JSON.stringify(s)).join(",\n") + ",\n  ],\n};\n";
  writeFileSync(OUT, head + body);
  for (const s of songs) console.log(`${s.id}: ${s.bpm} BPM・${s.bars} しょうせつ・${s.seconds} びょう・${s.tracks.length} パート・${JSON.stringify(s).length} バイト`);
  console.log("→ " + OUT);
}
