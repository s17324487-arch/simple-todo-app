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
    const sources = [];
    for (const detune of d.detune ? [-d.detune, d.detune] : [0]) {
      const o = ctx.createOscillator(); o.setPeriodicWave(this.wave(ctx, name)); o.frequency.value = frequency; o.detune.value = detune;
      o.connect(filter); sources.push(o);
    }
    if (sources.length > 1) { const trim = ctx.createGain(); trim.gain.value = .55; filter.connect(trim); trim.connect(g); this.voice(bus, sources, [trim, filter, g, stereo], start, end + .01); }
    else { filter.connect(g); this.voice(bus, sources, [filter, g, stereo], start, end + .01); }
    g.connect(stereo); stereo.connect(bus.input);
  },
  drum(bus, noise, type, start, volume, pan = 0) {
    if (bus.closed || bus.voices.size >= 80) return;
    const ctx = bus.ctx, g = ctx.createGain(), filter = ctx.createBiquadFilter(), stereo = ctx.createStereoPanner();
    const duration = type === "k" ? .19 : type === "s" ? .14 : .055;
    stereo.pan.value = pan;
    let source;
    if (type === "k") {
      source = ctx.createOscillator(); source.type = "sine";
      source.frequency.setValueAtTime(125, start); source.frequency.exponentialRampToValueAtTime(43, start + .15);
      filter.type = "lowpass"; filter.frequency.value = 700;
    } else {
      source = ctx.createBufferSource(); source.buffer = noise;
      filter.type = type === "s" ? "bandpass" : "highpass"; filter.frequency.value = type === "s" ? 1700 : 6000; filter.Q.value = .5;
    }
    g.gain.setValueAtTime(0, start); g.gain.linearRampToValueAtTime(volume, start + .003); g.gain.exponentialRampToValueAtTime(.00001, start + duration);
    source.connect(filter); filter.connect(g); g.connect(stereo); stereo.connect(bus.input);
    this.voice(bus, [source], [filter, g, stereo], start, start + duration + .01);
  },
  step(bus, tracks, step, at, stepDur, noise) {
    tracks.forEach((tr, index) => {
      const ev = tr.seq[step % tr.seq.length];
      if (!ev) return;
      // 決まった強弱なので、実再生とオフライン試聴の編曲は同じ。
      const velocity = step % 8 === 0 ? 1 : step % 2 ? .83 : .93;
      if (tr.drum) this.drum(bus, noise, ev.n, at, tr.vol * velocity, tr.pan || 0);
      else {
        const notes = ev.n.split("+");
        notes.forEach((n, i) => this.note(bus, tr.instrument, Sound.freq(n), at + i * .009, ev.len * stepDur * (tr.gate || .88), tr.vol * velocity / Math.sqrt(notes.length), tr.pan ?? (index % 2 ? -.12 : .12)));
      }
    });
  },
  async render(name, seconds = 8) {
    const song = SONGS[name];
    if (!song?.modern) throw new Error("unknown modern song: " + name);
    seconds = U.clamp(seconds, 1, 30);
    const ctx = new OfflineAudioContext(2, Math.ceil(22050 * seconds), 22050), level = ctx.createGain();
    level.gain.value = .32 * .9; level.connect(ctx.destination);
    const bus = this.bus(ctx, level), noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    let seed = 12345;
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) { seed = (seed * 1664525 + 1013904223) >>> 0; data[i] = seed / 2147483648 - 1; }
    const tracks = song.tracks.map(tr => ({ ...tr, seq: Sound.parse(tr.notes) })), stepDur = 60 / song.bpm / 2;
    const len = Math.max(...tracks.map(tr => tr.seq.length));
    // オフラインも実際と同じ先読み幅で予約。長い書き出しでもボイス上限に達しない。
    let step = 0, next = .02;
    const schedule = now => {
      while (next < Math.min(seconds - .08, now + .25) && (!song.once || step < len)) {
        this.step(bus, tracks, step, next, stepDur, noise); step++;
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
