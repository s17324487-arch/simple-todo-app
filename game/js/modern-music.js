// 原音・和音・短い残響を WebAudio で合成。音源ファイルや外部通信は使わない。
const ModernMusic = {
  waves: new WeakMap(),
  instruments: {
    piano: { harmonics: [0, 1, .32, .13, .055], attack: .006, decay: .22, sustain: .18, release: .26, cutoff: 4200 },
    epiano: { harmonics: [0, 1, .16, .02, .055], attack: .009, decay: .3, sustain: .32, release: .3, cutoff: 3000 },
    pluck: { harmonics: [0, 1, .38, .17, .06], attack: .004, decay: .13, sustain: .12, release: .2, cutoff: 3400 },
    mallet: { harmonics: [0, 1, .015, 0, .07], attack: .005, decay: .17, sustain: .1, release: .22, cutoff: 2800 },
    pad: { harmonics: [0, 1, .12, .045], attack: .16, decay: .4, sustain: .72, release: .5, cutoff: 1800, detune: 5 },
    bass: { harmonics: [0, 1, .2, .045], attack: .012, decay: .19, sustain: .52, release: .12, cutoff: 850 },
    // Meeときょれじゃ の J-POP（js/arcade-jpop.js）: うたの かわりの リード（ビブラート つき）・ゲームセンターの ピコピコ・エレキの ベースと ギター
    lead: { harmonics: [0, 1, .52, .3, .17, .1, .06, .035], attack: .018, decay: .28, sustain: .66, release: .16, cutoff: 3600, vib: [5.2, 11, .2] },
    chip: { harmonics: [0, 1, 0, .33, 0, .2, 0, .14, 0, .1], attack: .003, decay: .11, sustain: .34, release: .07, cutoff: 3200 },
    ebass: { harmonics: [0, 1, .46, .24, .12, .05], attack: .008, decay: .16, sustain: .5, release: .1, cutoff: 1300 },
    gtr: { harmonics: [0, 1, .62, .44, .3, .22, .15, .1, .07], attack: .01, decay: .3, sustain: .45, release: .14, cutoff: 2300 },
  },
  wave(ctx, name) {
    let cache = this.waves.get(ctx);
    if (!cache) { cache = {}; this.waves.set(ctx, cache); }
    if (!cache[name]) { const im = Float32Array.from(this.instruments[name].harmonics); cache[name] = ctx.createPeriodicWave(new Float32Array(im.length), im); }
    return cache[name];
  },
  bus(ctx, destination) {
    const input = ctx.createGain(), output = ctx.createGain(), compressor = ctx.createDynamicsCompressor();
    input.gain.value = .82;
    compressor.threshold.value = -18; compressor.knee.value = 18; compressor.ratio.value = 2.5;
    compressor.attack.value = .015; compressor.release.value = .18;
    input.connect(compressor); compressor.connect(output); output.connect(destination);
    const nodes = [input, output, compressor];
    // 左右で違う短い反射。フィードバックなしなので停止後に残響が増殖しない。
    for (const [time, pan, level] of [[.073, -.65, .13], [.127, .65, .09]]) {
      const delay = ctx.createDelay(.3), filter = ctx.createBiquadFilter(), gain = ctx.createGain(), stereo = ctx.createStereoPanner();
      delay.delayTime.value = time; filter.type = "lowpass"; filter.frequency.value = 2200;
      gain.gain.value = level; stereo.pan.value = pan;
      input.connect(delay); delay.connect(filter); filter.connect(gain); gain.connect(stereo); stereo.connect(compressor);
      nodes.push(delay, filter, gain, stereo);
    }
    return { ctx, input, output, nodes, voices: new Set(), peakVoices: 0, closed: false };
  },
  release(bus) {
    if (!bus || bus.closed) return;
    bus.closed = true;
    const now = bus.ctx.currentTime;
    bus.output.gain.cancelScheduledValues(now); bus.output.gain.setValueAtTime(bus.output.gain.value, now);
    bus.output.gain.linearRampToValueAtTime(0, now + .08);
    for (const voice of bus.voices) voice.stop(now + .09);
    setTimeout(() => { for (const node of bus.nodes) node.disconnect(); }, 160);
  },
  voice(bus, sources, nodes, start, end) {
    let remaining = sources.length;
    const voice = { stop: t => sources.forEach(source => { try { source.stop(t); } catch {} }) };
    bus.voices.add(voice); bus.peakVoices = Math.max(bus.peakVoices, bus.voices.size);
    for (const source of sources) {
      source.onended = () => { if (--remaining === 0) { for (const n of [...sources, ...nodes]) n.disconnect(); bus.voices.delete(voice); } };
      source.start(start); source.stop(end);
    }
  },
  note(bus, name, frequency, start, duration, volume, pan = 0) {
    if (bus.closed || bus.voices.size >= 80) return;
    const ctx = bus.ctx, d = this.instruments[name], g = ctx.createGain(), filter = ctx.createBiquadFilter(), stereo = ctx.createStereoPanner();
    const hold = Math.max(d.attack + .03, duration), decayAt = Math.min(hold, Math.max(d.attack + .01, d.decay));
    const end = start + hold + d.release;
    stereo.pan.value = pan;
    filter.type = "lowpass"; filter.Q.value = .55;
    filter.frequency.setValueAtTime(d.cutoff, start);
    filter.frequency.exponentialRampToValueAtTime(Math.max(500, d.cutoff * .38), start + hold);
    g.gain.setValueAtTime(0, start); g.gain.linearRampToValueAtTime(volume, start + d.attack);
    if (decayAt < hold) g.gain.exponentialRampToValueAtTime(Math.max(.0001, volume * .6), start + decayAt);
    g.gain.exponentialRampToValueAtTime(Math.max(.0001, volume * d.sustain), start + hold);
    g.gain.exponentialRampToValueAtTime(.00001, end);
    const sources = [], extra = [];
    for (const detune of d.detune ? [-d.detune, d.detune] : [0]) {
      const o = ctx.createOscillator(); o.setPeriodicWave(this.wave(ctx, name)); o.frequency.value = frequency; o.detune.value = detune;
      o.connect(filter); sources.push(o);
    }
    // ながい 音だけ すこし おくれて ゆれる（うたの ビブラート）
    if (d.vib && hold > d.vib[2] + .08) {
      const lfo = ctx.createOscillator(), depth = ctx.createGain();
      lfo.frequency.value = d.vib[0]; depth.gain.setValueAtTime(0, start); depth.gain.linearRampToValueAtTime(d.vib[1], start + d.vib[2] + .08);
      lfo.connect(depth); for (const o of sources) depth.connect(o.detune);
      sources.push(lfo); extra.push(depth);
    }
    if (d.detune) { const trim = ctx.createGain(); trim.gain.value = .55; filter.connect(trim); trim.connect(g); this.voice(bus, sources, [...extra, trim, filter, g, stereo], start, end + .01); }
    else { filter.connect(g); this.voice(bus, sources, [...extra, filter, g, stereo], start, end + .01); }
    g.connect(stereo); stereo.connect(bus.input);
  },
  drum(bus, noise, type, start, volume, pan = 0) {
    if (bus.closed || bus.voices.size >= 80) return;
    const ctx = bus.ctx, g = ctx.createGain(), filter = ctx.createBiquadFilter(), stereo = ctx.createStereoPanner();
    // k バスドラム・s スネア・h ハイハット／o ひらいた ハイハット・c シンバル（J-POP 用）・t たかい タム・l ひくい タム
    const duration = { k: .19, s: .14, o: .24, c: .95, t: .22, l: .28 }[type] || .055;
    stereo.pan.value = pan;
    let source;
    if (type === "k" || type === "t" || type === "l") {
      const [f0, f1] = type === "k" ? [125, 43] : type === "t" ? [210, 118] : [140, 74];
      source = ctx.createOscillator(); source.type = "sine";
      source.frequency.setValueAtTime(f0, start); source.frequency.exponentialRampToValueAtTime(f1, start + duration * .8);
      filter.type = "lowpass"; filter.frequency.value = type === "k" ? 700 : 1200;
    } else {
      source = ctx.createBufferSource(); source.buffer = noise;
      filter.type = type === "s" ? "bandpass" : "highpass"; filter.frequency.value = type === "s" ? 1700 : type === "c" ? 4200 : 6000; filter.Q.value = .5;
      if (type === "c") volume *= .55;
    }
    g.gain.setValueAtTime(0, start); g.gain.linearRampToValueAtTime(volume, start + .003); g.gain.exponentialRampToValueAtTime(.00001, start + duration);
    source.connect(filter); filter.connect(g); g.connect(stereo); stereo.connect(bus.input);
    this.voice(bus, [source], [filter, g, stereo], start, start + duration + .01);
  },
  // 1トークンの ながさ（grid 8 = 8分音符・grid 16 = 16分音符。bpm は 4分音符の かず）
  stepDur(song) { return 60 / song.bpm / ((song.grid || 8) / 4); },
  step(bus, tracks, step, at, stepDur, noise, per = 2) {
    tracks.forEach((tr, index) => {
      const ev = tr.seq[step % tr.seq.length];
      if (!ev) return;
      // 決まった強弱なので、実再生とオフライン試聴の編曲は同じ。per = 1拍の トークン数（小節の あたまが いちばん つよい）
      const velocity = step % (4 * per) === 0 ? 1 : step % per ? .83 : .93;
      if (tr.drum) this.drum(bus, noise, ev.n, at, tr.vol * velocity, tr.pan || 0);
      else {
        const notes = ev.n.split("+");
        notes.forEach((n, i) => this.note(bus, tr.instrument, Sound.freq(n), at + i * .009, ev.len * stepDur * (tr.gate || .88), tr.vol * velocity / Math.sqrt(notes.length), tr.pan ?? (index % 2 ? -.12 : .12)));
      }
    });
  },
  async render(name, seconds = 8, from = 0) {
    const song = SONGS[name];
    if (!song?.modern) throw new Error("unknown modern song: " + name);
    seconds = U.clamp(seconds, 1, 30);
    const ctx = new OfflineAudioContext(2, Math.ceil(22050 * seconds), 22050), level = ctx.createGain();
    level.gain.value = .32 * .9; level.connect(ctx.destination);
    const bus = this.bus(ctx, level), noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    let seed = 12345;
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) { seed = (seed * 1664525 + 1013904223) >>> 0; data[i] = seed / 2147483648 - 1; }
    const tracks = song.tracks.map(tr => ({ ...tr, seq: Sound.parse(tr.notes) })), stepDur = this.stepDur(song), per = (song.grid || 8) / 4;
    const len = Math.max(...tracks.map(tr => tr.seq.length));
    // オフラインも実際と同じ先読み幅で予約。長い書き出しでもボイス上限に達しない。from = はじめる トークン（ながい 曲の とちゅうを きく）
    let step = Math.max(0, Math.floor(from)), next = .02;
    const schedule = now => {
      while (next < Math.min(seconds - .08, now + .25) && (!song.once || step < len)) {
        this.step(bus, tracks, step, next, stepDur, noise, per); step++;
        next += stepDur * (1 + (step % 2 ? 1 : -1) * (song.swing || 0));
      }
    };
    schedule(0);
    for (let t = .2; t < seconds - .1; t += .2) ctx.suspend(t).then(() => { schedule(ctx.currentTime); ctx.resume(); });
    const audio = await ctx.startRendering();
    let peak = 0, sum = 0, finite = true;
    for (let ch = 0; ch < 2; ch++) for (const value of audio.getChannelData(ch)) { finite = finite && Number.isFinite(value); peak = Math.max(peak, Math.abs(value)); sum += value * value; }
    return { audio, stats: { name, seconds, peak, rms: Math.sqrt(sum / (audio.length * 2)), finite, peakVoices: bus.peakVoices } };
  },
};
