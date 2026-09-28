// WebAudio で こうかおん・BGM を その場で合成する（音声ファイル不要）
const Sound = {
  ctx: null, master: null, bgmGain: null, seGain: null,
  cur: null, // 再生中のBGM
  timer: null,
  jingles: new Set(),
  noiseBuf: null,
  pulse: null,

  init() {
    if (this.ctx) { if (this.ctx.state === "suspended") this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(this.ctx.destination);
    this.bgmGain = this.ctx.createGain();
    this.bgmGain.connect(this.master);
    this.seGain = this.ctx.createGain();
    this.seGain.connect(this.master);
    this.applySettings();
    // ノイズ
    const len = this.ctx.sampleRate;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    // 25% パルス波（やわらかい ファミコン風）
    const n = 32, re = new Float32Array(n), im = new Float32Array(n);
    for (let k = 1; k < n; k++) im[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * 0.25);
    this.pulse = this.ctx.createPeriodicWave(re, im);
    if (this.want) { const w = this.want; this.want = null; this.bgm(w); }
  },
  applySettings() {
    if (!this.ctx || !Save.d) return;
    const s = Save.d.settings;
    this.bgmGain.gain.value = s.bgm ? 0.32 : 0;
    this.seGain.gain.value = s.se ? 0.55 : 0;
  },

  freq(note) {
    // "C4" "F#5" "Bb3"
    const m = /^([A-G])([#b]?)(-?\d)$/.exec(note);
    if (!m) return 0;
    const base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]];
    const acc = m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0;
    const midi = (parseInt(m[3], 10) + 1) * 12 + base + acc;
    return 440 * Math.pow(2, (midi - 69) / 12);
  },

  tone(dest, { f = 440, f2 = null, t = 0, dur = 0.1, type = "square", vol = 0.2, a = 0.004, r = 0.06, vib = 0 }) {
    const c = this.ctx;
    const o = c.createOscillator();
    if (type === "pulse") o.setPeriodicWave(this.pulse); else o.type = type;
    const g = c.createGain();
    const t0 = c.currentTime + t;
    o.frequency.setValueAtTime(f, t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t0 + dur);
    if (vib) {
      const l = c.createOscillator(), lg = c.createGain();
      l.frequency.value = 18; lg.gain.value = vib;
      l.connect(lg); lg.connect(o.frequency);
      l.start(t0); l.stop(t0 + dur + r);
    }
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + a);
    g.gain.setValueAtTime(vol, t0 + Math.max(a, dur - 0.01));
    g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur + r);
    o.connect(g); g.connect(dest);
    o.start(t0); o.stop(t0 + dur + r + 0.02);
  },
  noise(dest, { t = 0, dur = 0.1, vol = 0.2, freq = 3000, q = 0.8, type = "bandpass", f2 = null }) {
    const c = this.ctx;
    const s = c.createBufferSource();
    s.buffer = this.noiseBuf;
    const fl = c.createBiquadFilter();
    fl.type = type; fl.frequency.value = freq; fl.Q.value = q;
    const t0 = c.currentTime + t;
    if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
    s.connect(fl); fl.connect(g); g.connect(dest);
    s.start(t0, Math.random() * 0.5); s.stop(t0 + dur + 0.02);
  },

  se(name) {
    if (!this.ctx || !Save.d || !Save.d.settings.se) return;
    const d = this.seGain, T = (o) => this.tone(d, o), N = (o) => this.noise(d, o);
    switch (name) {
      case "gau": T({ f: 130, f2: 85, dur: 0.5, type: "triangle", vol: 0.23, vib: 18 }); break;
      case "tummy": T({ f: 95, f2: 48, dur: 0.9, type: "sine", vol: 0.26, vib: 14 }); break;
      case "tap": T({ f: 880, dur: 0.035, type: "pulse", vol: 0.12 }); break;
      case "ok": T({ f: 660, dur: 0.05, type: "pulse", vol: 0.14 }); T({ f: 990, t: 0.05, dur: 0.07, type: "pulse", vol: 0.14 }); break;
      case "cancel": T({ f: 520, dur: 0.05, type: "pulse", vol: 0.12 }); T({ f: 390, t: 0.05, dur: 0.08, type: "pulse", vol: 0.12 }); break;
      case "coin": T({ f: 988, dur: 0.06, type: "square", vol: 0.1 }); T({ f: 1319, t: 0.06, dur: 0.22, type: "square", vol: 0.1 }); break;
      case "buy": T({ f: 784, dur: 0.06, type: "pulse", vol: 0.12 }); T({ f: 1047, t: 0.07, dur: 0.06, type: "pulse", vol: 0.12 }); T({ f: 1568, t: 0.14, dur: 0.18, type: "pulse", vol: 0.1 }); break;
      case "hit": N({ dur: 0.12, vol: 0.4, freq: 1200, q: 0.6 }); T({ f: 160, f2: 60, dur: 0.12, type: "sine", vol: 0.4 }); break;
      case "crit": N({ dur: 0.22, vol: 0.5, freq: 2200, q: 0.5 }); T({ f: 220, f2: 50, dur: 0.2, type: "square", vol: 0.25 }); break;
      case "miss": N({ dur: 0.18, vol: 0.2, freq: 900, f2: 3000, q: 1.2 }); break;
      case "heal": ["C5", "E5", "G5", "C6"].forEach((n, i) => T({ f: this.freq(n), t: i * 0.06, dur: 0.1, type: "sine", vol: 0.18 })); break;
      case "buff": T({ f: 300, f2: 1200, dur: 0.3, type: "triangle", vol: 0.2 }); T({ f: 450, f2: 1800, t: 0.05, dur: 0.3, type: "sine", vol: 0.1 }); break;
      case "debuff": T({ f: 700, f2: 180, dur: 0.35, type: "triangle", vol: 0.2 }); break;
      case "eat": N({ dur: 0.06, vol: 0.3, freq: 500, q: 1 }); N({ t: 0.14, dur: 0.06, vol: 0.3, freq: 450, q: 1 }); N({ t: 0.28, dur: 0.06, vol: 0.25, freq: 520, q: 1 }); break;
      case "jump": T({ f: 320, f2: 820, dur: 0.14, type: "sine", vol: 0.25 }); break;
      case "pop": T({ f: 400, f2: 1300, dur: 0.07, type: "sine", vol: 0.25 }); break;
      case "door": N({ dur: 0.3, vol: 0.18, freq: 400, f2: 1600, q: 0.7 }); T({ f: 330, t: 0.02, dur: 0.1, type: "triangle", vol: 0.12 }); break;
      case "good": T({ f: 784, dur: 0.08, type: "pulse", vol: 0.13 }); T({ f: 1047, t: 0.09, dur: 0.18, type: "pulse", vol: 0.13 }); break;
      case "perfect": ["C6", "E6", "G6", "C7"].forEach((n, i) => T({ f: this.freq(n), t: i * 0.07, dur: 0.12, type: "pulse", vol: 0.1 })); break;
      case "bad": T({ f: 180, f2: 110, dur: 0.32, type: "square", vol: 0.12 }); break;
      case "encounter": [0, 1, 2, 3].forEach((i) => T({ f: 440 + i * 120, t: i * 0.06, dur: 0.06, type: "square", vol: 0.1 })); T({ f: 900, t: 0.26, dur: 0.25, type: "square", vol: 0.1 }); break;
      case "sparkle": for (let i = 0; i < 5; i++) T({ f: 1800 + Math.random() * 1500, t: i * 0.05, dur: 0.05, type: "sine", vol: 0.08 }); break;
      case "wan": T({ f: 620, f2: 380, dur: 0.12, type: "pulse", vol: 0.2 }); T({ f: 640, f2: 400, t: 0.16, dur: 0.12, type: "pulse", vol: 0.18 }); break;
      case "piyo": T({ f: 1500, f2: 2100, dur: 0.07, type: "sine", vol: 0.2 }); T({ f: 1500, f2: 2200, t: 0.11, dur: 0.08, type: "sine", vol: 0.2 }); break;
      case "gao": T({ f: 180, f2: 90, dur: 0.45, type: "sawtooth", vol: 0.16, vib: 25 }); N({ dur: 0.4, vol: 0.12, freq: 300, q: 0.7 }); break;
      case "germ": T({ f: 1200, f2: 400, dur: 0.08, type: "square", vol: 0.1 }); N({ dur: 0.05, vol: 0.2, freq: 3000 }); break;
      case "fanfare": ["C5", "E5", "G5", "C6", "G5", "C6"].forEach((n, i) => T({ f: this.freq(n), t: i * 0.09, dur: i === 5 ? 0.4 : 0.08, type: "pulse", vol: 0.13 })); break;
      case "levelup": ["G5", "C6", "E6", "G6"].forEach((n, i) => T({ f: this.freq(n), t: i * 0.08, dur: i === 3 ? 0.35 : 0.07, type: "square", vol: 0.09 })); break;
      case "sleep": T({ f: 520, f2: 260, dur: 0.6, type: "sine", vol: 0.12 }); break;
      case "whoosh": N({ dur: 0.25, vol: 0.2, freq: 600, f2: 2400, q: 1.5 }); break;
      case "bake": N({ dur: 0.5, vol: 0.08, freq: 5000, q: 0.3, type: "highpass" }); break;
      case "ding": T({ f: 1760, dur: 0.3, type: "sine", vol: 0.2 }); T({ f: 2637, dur: 0.3, type: "sine", vol: 0.08 }); break;
      case "swish": N({ dur: 0.12, vol: 0.15, freq: 2500, f2: 1200, q: 2 }); break;
      // ⑥ 射撃場（RANGE_DATA.sound・GUN_LIST.md の「こうかおん」）: ブザー・動力ごとの 発射音・ボルト／レバー・マガジン・かね
      case "rg_beep": T({ f: 2400, dur: 0.32, type: "square", vol: 0.08 }); break;
      case "rg_gbb": N({ dur: 0.06, vol: 0.32, freq: 3000, q: 0.7 }); T({ f: 150, f2: 70, t: 0.01, dur: 0.05, type: "square", vol: 0.1 }); N({ t: 0.06, dur: 0.03, vol: 0.18, freq: 1400, q: 3 }); break;
      case "rg_gas": N({ dur: 0.08, vol: 0.28, freq: 2200, q: 0.8 }); T({ f: 1300, dur: 0.02, type: "pulse", vol: 0.08 }); break;
      case "rg_aeg": T({ f: 95, f2: 140, dur: 0.05, type: "sawtooth", vol: 0.1 }); N({ t: 0.02, dur: 0.05, vol: 0.24, freq: 1800, q: 1 }); break;
      case "rg_spring": N({ dur: 0.1, vol: 0.3, freq: 900, q: 0.8 }); T({ f: 220, f2: 120, dur: 0.08, type: "triangle", vol: 0.14 }); break;
      case "rg_bolt": N({ dur: 0.05, vol: 0.22, freq: 1800, q: 3 }); N({ t: 0.18, dur: 0.05, vol: 0.22, freq: 1500, q: 3 }); break;
      case "rg_mag": N({ dur: 0.04, vol: 0.2, freq: 1300, q: 3 }); N({ t: 0.3, dur: 0.05, vol: 0.24, freq: 900, q: 3 }); break;
      case "rg_gong": T({ f: 620, dur: 0.9, type: "sine", vol: 0.16, vib: 4 }); T({ f: 1540, dur: 0.5, type: "sine", vol: 0.06 }); break;
    }
  },
  voice(id) { this.se(id === "wanko" ? "wan" : id === "gachan" ? "piyo" : Math.random() < 0.5 ? "gao" : "gau"); },

  // ---- BGM ----
  bgm(name) {
    if (!this.ctx) { this.want = name; return; }
    if (this.cur && this.cur.name === name) return;
    this.stopBgm();
    const song = SONGS[name];
    if (!song) return;
    const stepDur = 60 / song.bpm / 2; // 8分音符
    const tracks = song.tracks.map((tr) => ({ ...tr, seq: this.parse(tr.notes) }));
    const len = Math.max(...tracks.map((t) => t.seq.length));
    this.cur = { name, song, tracks, stepDur, len, step: 0, next: this.ctx.currentTime + 0.08,
      bus: song.modern ? ModernMusic.bus(this.ctx, this.bgmGain) : null };
    this.timer = setInterval(() => this.schedule(), 40);
    this.schedule();
  },
  stopBgm() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.want = null;
    if (this.cur?.bus) ModernMusic.release(this.cur.bus);
    this.cur = null;
  },
  parse(str) {
    // トークン1つ = 8分音符。"." は のばす、"_" は やすみ
    const toks = str.trim().split(/\s+/).filter((x) => x !== "|");
    const out = [];
    for (let i = 0; i < toks.length; i++) {
      const tk = toks[i];
      if (tk === "." || tk === "_") { out.push(null); continue; }
      let len = 1;
      while (toks[i + len] === ".") len++;
      out.push({ n: tk, len });
    }
    return out;
  },
  schedule() {
    const cur = this.cur;
    if (!cur || !this.ctx) return;
    const ahead = this.ctx.currentTime + 0.25;
    // 背景タブから戻ったとき、過去の音符を一度に鳴らさない。
    if (cur.next < this.ctx.currentTime - .4) {
      cur.step += Math.floor((this.ctx.currentTime - cur.next) / cur.stepDur);
      cur.next = this.ctx.currentTime + .04;
    }
    while (cur.next < ahead) {
      const t = cur.next - this.ctx.currentTime;
      if (cur.bus) ModernMusic.step(cur.bus, cur.tracks, cur.step, cur.next, cur.stepDur, this.noiseBuf);
      else for (const tr of cur.tracks) {
        const ev = tr.seq[cur.step % tr.seq.length];
        if (!ev) continue;
        const dur = ev.len * cur.stepDur;
        if (tr.drum) {
          if (ev.n === "k") this.tone(this.bgmGain, { f: 150, f2: 45, t, dur: 0.12, type: "sine", vol: tr.vol * 2.2 });
          else if (ev.n === "s") this.noise(this.bgmGain, { t, dur: 0.1, vol: tr.vol, freq: 1800, q: 0.6 });
          else if (ev.n === "h") this.noise(this.bgmGain, { t, dur: 0.035, vol: tr.vol * 0.6, freq: 7000, q: 0.8, type: "highpass" });
        } else {
          this.tone(this.bgmGain, { f: this.freq(ev.n), t, dur: dur * (tr.gate || 0.85), type: tr.wave, vol: tr.vol, r: tr.rel || 0.05, a: tr.att || 0.004 });
        }
      }
      cur.step++;
      if (cur.song.once && cur.step >= cur.len) { this.stopBgm(); return; }
      cur.next += cur.stepDur * (1 + (cur.step % 2 ? 1 : -1) * (cur.song.swing || 0));
    }
  },
  jingle(name) {
    // 短い曲をBGMの上に流す（BGMは一時停止しない）
    if (!this.ctx || !Save.d.settings.se) return;
    const song = SONGS[name];
    const stepDur = 60 / song.bpm / 2;
    if (song.modern) {
      const bus = ModernMusic.bus(this.ctx, this.seGain), tracks = song.tracks.map(tr => ({ ...tr, seq: this.parse(tr.notes) }));
      this.jingles.add(bus);
      const len = Math.max(...tracks.map(tr => tr.seq.length));
      for (let i = 0; i < len; i++) ModernMusic.step(bus, tracks, i, this.ctx.currentTime + .02 + i * stepDur, stepDur, this.noiseBuf);
      setTimeout(() => { ModernMusic.release(bus); this.jingles.delete(bus); }, (len * stepDur + .6) * 1000);
      return;
    }
    for (const tr of song.tracks) {
      const seq = this.parse(tr.notes);
      seq.forEach((ev, i) => {
        if (!ev) return;
        this.tone(this.seGain, { f: this.freq(ev.n), t: i * stepDur, dur: ev.len * stepDur * 0.9, type: tr.wave, vol: tr.vol * 1.3, r: 0.08 });
      });
    }
  },
  stopJingles() { for (const bus of this.jingles) ModernMusic.release(bus); this.jingles.clear(); },
};

// ---- きょく（オリジナル） 1トークン=8分音符 ----
const DR = "k h s h k h s h";
const SONGS = {
  title: {
    bpm: 100,
    tracks: [
      { wave: "pulse", vol: 0.1, notes: "G4 . C5 . E5 . G5 . | A5 . G5 . E5 . C5 . | D5 . F5 . A5 . G5 . | E5 . . . . . _ . | G4 . C5 . E5 . G5 . | C6 . B5 . A5 . G5 . | F5 . E5 . D5 . G4 . | C5 . . . _ . _ ." },
      { wave: "triangle", vol: 0.22, notes: "C3 . G3 . C3 . G3 . | F2 . C3 . F2 . C3 . | D3 . A3 . G2 . D3 . | C3 . G3 . C3 . G3 . | C3 . G3 . E3 . G3 . | A2 . E3 . F2 . C3 . | D3 . G2 . G2 . B2 . | C3 . G2 . C3 . _ ." },
    ],
  },
  town: {
    bpm: 118,
    tracks: [
      { wave: "pulse", vol: 0.09, notes: "A4 . C5 . F5 . E5 D5 | C5 . A4 . F4 . G4 A4 | Bb4 . D5 . G5 . F5 E5 | F5 . . . _ . C5 . | A4 . C5 . F5 . A5 G5 | F5 . D5 . C5 . A4 C5 | Bb4 . A4 . G4 . E4 G4 | F4 . . . _ . _ ." },
      { wave: "triangle", vol: 0.22, notes: "F2 . C3 . F2 . C3 . | F2 . C3 . F2 . C3 . | Bb2 . F3 . C3 . G2 . | F2 . C3 . F2 . C3 . | F2 . C3 . D3 . A2 . | Bb2 . F3 . F2 . C3 . | G2 . D3 . C3 . E3 . | F2 . C3 . F2 . _ ." },
      { drum: true, vol: 0.05, notes: "k _ h _ s _ h _ k _ h _ s _ h h" },
    ],
  },
  house: {
    bpm: 84,
    tracks: [
      { wave: "sine", vol: 0.14, gate: 0.6, rel: 0.25, notes: "E5 . G5 . C6 . G5 . | A5 . G5 . E5 . . . | F5 . A5 . D6 . C6 . | B5 . . . G5 . . . | E5 . G5 . C6 . E6 . | D6 . C6 . A5 . F5 . | E5 . D5 . G5 . B4 . | C5 . . . . . _ ." },
      { wave: "triangle", vol: 0.16, notes: "C3 . G3 . E3 . G3 . | F2 . C3 . A2 . C3 . | D3 . A3 . F3 . A3 . | G2 . D3 . B2 . D3 . | C3 . G3 . E3 . G3 . | F2 . C3 . A2 . C3 . | G2 . D3 . G2 . F3 . | C3 . G2 . C3 . _ ." },
    ],
  },
  meadow: {
    bpm: 132,
    tracks: [
      { wave: "pulse", vol: 0.09, notes: "G4 . B4 . D5 . . G5 | F#5 . E5 . D5 . B4 . | C5 . E5 . A5 . . G5 | F#5 . . . D5 . . . | G4 . B4 . D5 . . G5 | A5 . B5 . A5 . G5 . | E5 . F#5 . G5 . A5 . | G5 . . . _ . _ ." },
      { wave: "triangle", vol: 0.22, notes: "G2 . G3 . G2 . G3 . | D2 . D3 . D2 . D3 . | C2 . C3 . C2 . C3 . | D2 . D3 . D2 . D3 . | G2 . G3 . G2 . G3 . | C2 . C3 . D2 . D3 . | E2 . E3 . C2 . D3 . | G2 . D3 . G2 . _ ." },
      { drum: true, vol: 0.05, notes: DR },
    ],
  },
  forest: {
    bpm: 108,
    tracks: [
      { wave: "pulse", vol: 0.085, notes: "A4 . . C5 E5 . D5 . | C5 . B4 . A4 . . . | F4 . . A4 C5 . B4 . | G#4 . . . E4 . . . | A4 . . C5 E5 . A5 . | G5 . F5 . E5 . D5 . | C5 . D5 . B4 . G#4 . | A4 . . . _ . _ ." },
      { wave: "triangle", vol: 0.2, notes: "A2 . E3 . A2 . E3 . | A2 . E3 . A2 . E3 . | F2 . C3 . F2 . C3 . | E2 . B2 . E2 . B2 . | A2 . E3 . A2 . E3 . | C3 . G3 . G2 . D3 . | F2 . C3 . E2 . B2 . | A2 . E3 . A2 . _ ." },
      { drum: true, vol: 0.04, notes: "k _ h _ h _ h _ k _ h _ h _ h h" },
    ],
  },
  cave: {
    bpm: 92,
    tracks: [
      { wave: "triangle", vol: 0.16, gate: 0.7, rel: 0.3, notes: "D5 . . . F5 . . . | E5 . . . A4 . . . | Bb4 . . . D5 . . . | C#5 . . . . . . . | D5 . . . F5 . A5 . | G5 . . . E5 . . . | F5 . E5 . D5 . C#5 . | D5 . . . _ . _ ." },
      { wave: "triangle", vol: 0.2, notes: "D2 . . . A2 . . . | A1 . . . E2 . . . | Bb1 . . . F2 . . . | A1 . . . E2 . . . | D2 . . . A2 . . . | C2 . . . G2 . . . | Bb1 . . . A1 . . . | D2 . . . A1 . . ." },
      { drum: true, vol: 0.035, notes: "k _ _ _ h _ _ _ k _ _ _ h _ h _" },
    ],
  },
  battle: {
    bpm: 152,
    tracks: [
      { wave: "pulse", vol: 0.09, notes: "A4 A4 C5 A4 E5 . D5 C5 | B4 . G4 . E4 . G4 B4 | A4 A4 C5 A4 F5 . E5 D5 | E5 . . . E5 D5 C5 B4 | A4 A4 C5 A4 E5 . A5 . | G5 . F5 . E5 . D5 . | C5 . D5 . E5 . G#5 . | A5 . . . E5 . . ." },
      { wave: "triangle", vol: 0.22, gate: 0.6, notes: "A2 A3 A2 A3 A2 A3 A2 A3 | G2 G3 G2 G3 G2 G3 G2 G3 | F2 F3 F2 F3 F2 F3 F2 F3 | E2 E3 E2 E3 E2 E3 E2 E3 | A2 A3 A2 A3 A2 A3 A2 A3 | C3 C4 C3 C4 D3 D4 D3 D4 | F2 F3 F2 F3 E2 E3 E2 E3 | A2 A3 A2 A3 E2 E3 E2 E3" },
      { drum: true, vol: 0.06, notes: DR },
    ],
  },
  boss: {
    bpm: 162,
    tracks: [
      { wave: "square", vol: 0.06, notes: "E5 . E5 . G5 . E5 . | D5 . D5 . F#5 . D5 . | C5 . C5 . E5 . G5 . | B4 . . . D#5 . . . | E5 . G5 . B5 . A5 G5 | F#5 . A5 . G5 . F#5 . | E5 . F#5 . G5 . A5 . | B5 . . . B4 . . ." },
      { wave: "triangle", vol: 0.24, gate: 0.6, notes: "E2 E3 E2 E3 E2 E3 E2 E3 | D2 D3 D2 D3 D2 D3 D2 D3 | C2 C3 C2 C3 C2 C3 C2 C3 | B1 B2 B1 B2 B1 B2 B1 B2 | E2 E3 E2 E3 E2 E3 E2 E3 | D2 D3 D2 D3 D2 D3 D2 D3 | C2 C3 C2 C3 A1 A2 A1 A2 | B1 B2 B1 B2 B1 B2 B1 B2" },
      { drum: true, vol: 0.07, notes: "k h s h k k s h" },
    ],
  },
  shop: {
    bpm: 138,
    tracks: [
      { wave: "pulse", vol: 0.085, notes: "C5 . E5 G5 . E5 C5 . | D5 . F5 A5 . F5 D5 . | E5 . G5 C6 . B5 A5 G5 | F5 . D5 . G5 . . . | C5 . E5 G5 . E5 C5 . | D5 . F5 A5 . C6 B5 . | A5 . G5 . F5 . D5 . | C5 . . . _ . _ ." },
      { wave: "triangle", vol: 0.2, notes: "C3 . G2 . C3 . G2 . | D3 . A2 . D3 . A2 . | E3 . B2 . A2 . E3 . | F2 . C3 . G2 . G3 . | C3 . G2 . C3 . G2 . | D3 . A2 . F2 . G2 . | F2 . C3 . G2 . G3 . | C3 . G2 . C3 . _ ." },
      { drum: true, vol: 0.045, notes: "k _ h _ s _ h _" },
    ],
  },
  victory: { bpm: 180, once: true, tracks: [{ wave: "pulse", vol: 0.1, notes: "C5 E5 G5 C6 . . G5 C6 . . . ." }, { wave: "triangle", vol: 0.2, notes: "C3 . G3 . C3 . E3 G3 . . . ." }] },
  jingle_lv: { bpm: 200, once: true, tracks: [{ wave: "pulse", vol: 0.1, notes: "G5 A5 B5 C6 . E6 . G6 . . ." }] },
};
