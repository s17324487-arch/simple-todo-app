// ③ 釣り ver2（UI-02）: 町・外の 世界の 見おろしの まま つる（どうぶつの森と おなじ ながれ）。
// ・水べに ときどき 魚の かげが 出る（いない ときも ある）。かげの ながさは 魚の 大きさ（cm）に 比例する（shadowLen）。
// ・さおを もって いれば、水を ながおし（HOLD びょう）→ そこへ さおを なげる（とどかなければ 岸まで あるいて から）。キーボードは 水の ほうを むいて ok。
// ・かげの あたまの まえに うきが おちると 魚が 気づいて よって くる → ちょんちょん（0〜4かい）→ うきが しずむ → BITE びょう いないに「つる」。
//   はやく おすと にげる・おそいと にげられる。かげの 上に おとすと びっくりして にげる。はしると にげる。
// ・つれたら 魚が とびだし、カメラが せんとうの 子に ズーム → 魚を かかげて じまんの ひとこと → いけすへ（いっぱいなら にがす）。
// ・うるのは スーパー（Fishing.sell）、きふは すいぞくかん（museum.js）。つりの ようすは sc.fishing（セーブしない）。
const FishLine = {
  PX_PER_CM: 0.8, MIN_PX: 9, MAX_PX: 128, // かげの ながさ = cm × 0.8（1マス 32px ≒ 40cm）。9〜128px
  HOLD: 0.45, CAST_MAX: 4.2 * TS, CAST_MIN: 0.9 * TS, NOTICE: 2.2 * TS, VIEW: Math.cos((80 * Math.PI) / 180),
  BITE: 1.0, NIBBLE_W: [0.1, 0.25, 0.3, 0.2, 0.15], ZOOM: 1.9, HELD_MAX: 104,
  SLOTS: { pond: 2, river: 2, stream: 2, beach: 3, harbor: 4 },
  // つりあげた ときの ひとこと（どうぶつの森の ように 魚ごとの しゃれ）。さいごに 3人の くちぐせ
  QUOTES: {
    medaka: "ちいさくても めだつ めだかだね！", motsugo: "もつごを もったら ごきげん！", yoshinobori: "よーし、のぼりちょうし！",
    yaritanago: "やりぃ！ たなごが つれた！", wakasagi: "わかさぎ だけに わかさ いっぱい！", dojo: "どじょう すくいを おどりたく なる〜！",
    oikawa: "おいっ！ かわで おいかわ！", kajika: "かじかんだ てでも つれたよ！", kusafugu: "ぷくっと ふくらんで ふぐ ふぐ！",
    kingyo: "きんきら きんぎょ！ おまつり みたい！", kawamutsu: "かわで むつまじく なかよし だね！", kamatsuka: "かまって ほしそうな かおだね！",
    haze: "うれしくて はじけ そう！ はぜ だけに！", ayu: "あゆみを とめずに がんばった！", donko: "どんと こい！ どんこ！",
    kisu: "しろくて きらきら すてきな しろぎす！", kawahagi: "おちょぼぐちが かわいい〜！", kyusen: "きゅうに つれて びっくり！",
    kasago: "ごつごつ かっこいい かさご！", iwashi: "まいにち おいわい したい きぶん！", mebaru: "めが ばっちり おおきい！",
    ginbuna: "ぎんいろ ぴかぴか まぶしい！", ugui: "うぐいすみたいに うたいたい♪", yamame: "やまの めぐみ だね！",
    amago: "あまい ごほうび みたい！", aji: "まあ、じょうずに つれたね！", iwana: "ばしょは いわないで おこう… ひみつ！",
    makogarei: "あこがれの かれいが つれた！", sayori: "さよなら より こんにちは！", ainame: "あいに きて くれたの？",
    saba: "まさか！ ばっちり つれた！", nijimasu: "にじいろに かがやき ます！", ishidai: "しましま もようが すてき！",
    kurodai: "くろうした かいが あった！", namazu: "じしんを もって つりあげた！", sakuramasu: "さくら さく〜！ だいせいこう！",
    nishikigoi: "きれいで こいに おちそう！", madai: "めで たい！ おめでたい！", anago: "あなから でて きて こんにちは！",
    magoi: "まごまご しないで つれた！", unagi: "うなぎのぼりに うれしい！", sake: "おもわず さけびたく なる〜！",
    hirame: "いい こと ひらめいた！", suzuki: "すずしい かおで つれた！", buri: "ひさし ぶりの おおものだ！",
    tachiuo: "たって いるみたいに ながい〜！", ito: "いとが きれなくて よかった〜！", shirakansu: "しーらない うちに すごいのを つった！",
    manbo: "マンボを おどりたい きぶん！", ryugunotsukai: "りゅうぐうじょうから きたの？",
  },
  TAIL: { wanko: "わん！", gachan: "ぴよっ♪", goji: "ガオー！" },
  HAND: { wanko: "#FFFFFF", gachan: "#F9D56E", goji: "#8E8A88" }, // かかげる 手の いろ

  // ---- こうかおん（WebAudio で その場で つくる。Sound.se の なまえ）----
  SE: {
    fish_cast: (S, T, N) => { N({ dur: 0.22, vol: 0.2, freq: 700, f2: 2600, q: 1.4 }); for (let i = 0; i < 8; i++) T({ f: 2300, t: 0.16 + i * 0.03, dur: 0.012, type: "square", vol: 0.045 }); },
    fish_plop: (S, T, N) => { T({ f: 840, f2: 240, dur: 0.1, type: "sine", vol: 0.26 }); N({ t: 0.01, dur: 0.14, vol: 0.12, freq: 900, q: 1.2 }); },
    fish_nibble: (S, T) => { T({ f: 1350, f2: 700, dur: 0.05, type: "sine", vol: 0.17 }); },
    fish_bite: (S, T, N) => { N({ dur: 0.3, vol: 0.36, freq: 560, q: 0.7, type: "lowpass" }); T({ f: 380, f2: 80, dur: 0.24, type: "sine", vol: 0.3 }); T({ f: 950, f2: 280, t: 0.03, dur: 0.1, type: "sine", vol: 0.14 }); },
    fish_hook: (S, T) => { for (let i = 0; i < 12; i++) T({ f: 1800 + (i % 2) * 320, t: i * 0.026, dur: 0.013, type: "square", vol: 0.055 }); T({ f: 300, f2: 1000, t: 0.05, dur: 0.2, type: "triangle", vol: 0.12 }); },
    fish_splash: (S, T, N) => { N({ dur: 0.5, vol: 0.3, freq: 1400, f2: 480, q: 0.6 }); N({ t: 0.08, dur: 0.32, vol: 0.16, freq: 3200, q: 0.9 }); },
    fish_catch: (S, T) => { ["G4", "C5", "E5", "G5", "C6"].forEach((n, i) => T({ f: S.freq(n), t: i * 0.075, dur: i === 4 ? 0.45 : 0.07, type: "pulse", vol: 0.12 })); T({ f: S.freq("E6"), t: 0.3, dur: 0.45, type: "sine", vol: 0.06 }); T({ f: S.freq("G6"), t: 0.38, dur: 0.4, type: "sine", vol: 0.05 }); },
    fish_flee: (S, T, N) => { N({ dur: 0.18, vol: 0.2, freq: 1900, f2: 600, q: 1.8 }); T({ f: 480, f2: 1400, t: 0.02, dur: 0.1, type: "sine", vol: 0.08 }); },
    fish_reelin: (S, T, N) => { for (let i = 0; i < 7; i++) T({ f: 2100, t: i * 0.035, dur: 0.012, type: "square", vol: 0.05 }); N({ t: 0.05, dur: 0.14, vol: 0.08, freq: 1200, q: 1 }); },
  },

  // ---- かげの 大きさ ----
  shadowLen(cm) { return U.clamp(Math.round(cm * this.PX_PER_CM * 10) / 10, this.MIN_PX, this.MAX_PX); },
  shadowWid(f, len) { return Fishing.shadowOf(f) === "thin" ? Math.max(3, len * 0.13) : Math.max(4, len * 0.34); },
  heldLen(cm) { return U.clamp(cm * this.PX_PER_CM, 24, this.HELD_MAX); }, // かかげる 魚（よく 見える ように 24px いじょう）

  // ---- 水 ----
  water(map, x, y) { return map.groundAt(Math.floor(x / TS), Math.floor(y / TS)) === "water"; },
  // かげが ぜんぶ 水の 中に おさまるか（あたま・しっぽ・よこ など 8てん。ふちから 3px）
  fits(map, x, y, a, len, wid) {
    const c = Math.cos(a), s = Math.sin(a), l = len / 2 + 3, w = wid / 2 + 3;
    for (const [u, v] of [[1, 0], [0.5, 1], [0.5, -1], [0, 1], [0, -1], [-0.5, 0.8], [-0.5, -0.8], [-1, 0]]) {
      if (!this.water(map, x + c * u * l - s * v * w, y + s * u * l + c * v * w)) return false;
    }
    return true;
  },
  // 岸に 立って さおが とどく 水の マス（マップごとに 1かい）
  tiles: {},
  waterTiles(map) {
    if (this.tiles[map.id]) return this.tiles[map.id];
    const out = [];
    for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) {
      if (map.groundAt(x, y) !== "water") continue;
      let near = false;
      for (let dy = -4; dy <= 4 && !near; dy++) for (let dx = -4; dx <= 4 && !near; dx++) {
        const X = x + dx, Y = y + dy;
        if (Math.hypot(dx, dy) <= 4.2 && X >= 0 && Y >= 0 && X < map.w && Y < map.h && !map.isSolid(X, Y)) near = true;
      }
      if (near) out.push([x, y]);
    }
    return (this.tiles[map.id] = out);
  },

  // ---- いまの ようす（sc.fishing。マップが かわると つくりなおす）----
  st(sc) {
    if (sc.fishing && sc.fishing.map === sc.mapId) return sc.fishing;
    const D = typeof Fishing !== "undefined" && Fishing.data(), spot = (D && D.spots[sc.mapId]) || null;
    sc.fishing = { map: sc.mapId, spot, shadows: [], next: 0, line: null, brag: null, zoom: 1, press: null, fx: [], uid: 0, rand: Math.random, auto: true, first: true };
    return sc.fishing;
  },
  rollNibbles(rand) { let r = rand(); for (let i = 0; i < this.NIBBLE_W.length; i++) { r -= this.NIBBLE_W[i]; if (r < 0) return i; } return 2; },
  // 魚を 1ぴき 出す（opts: fish・cm・at {x,y,a}・nibbles・fickle（ちょんの あと いって しまう わりあい）。テストは PokaDebug.fishSpawn）
  spawn(sc, opts = {}) {
    const S = this.st(sc); if (!S.spot) return null;
    const R = S.rand, rod = Fishing.rod(), c = Fishing.context(rod ? rod.power : 1);
    const f = opts.fish ? Fishing.fish(opts.fish) : Fishing.pick(S.spot.place, c, R, Fishing.kinds());
    if (!f) return null;
    const cm = opts.cm || Fishing.size(f, R), len = this.shadowLen(cm), wid = this.shadowWid(f, len);
    let at = opts.at || null;
    if (!at) {
      const L = sc.party[0].feet(), cand = this.waterTiles(sc.map).filter(([x, y]) => Math.hypot(x * TS + 16 - L.x, y * TS + 16 - L.y) < 11 * TS);
      for (let i = 0; i < 40 && cand.length && !at; i++) {
        const [tx, ty] = cand[Math.floor(R() * cand.length)], x = tx * TS + 4 + R() * 24, y = ty * TS + 4 + R() * 24, a0 = R() * Math.PI * 2;
        for (let k = 0; k < 8 && !at; k++) { const a = a0 + (k * Math.PI) / 4; if (this.fits(sc.map, x, y, a, len, wid)) at = { x, y, a }; }
      }
    }
    if (!at) return null;
    const sh = { uid: ++S.uid, f, cm, len, wid, x: at.x, y: at.y, a: at.a, aim: at.a, v: 0, state: "swim", t: 0, alpha: opts.alpha != null ? opts.alpha : 0,
      life: opts.life || 45 + R() * 60, pause: 0, turn: 0, cool: 0, poke: 0, wig: R() * 6, nibbles: opts.nibbles != null ? opts.nibbles : this.rollNibbles(R), fickle: opts.fickle != null ? opts.fickle : 0.08 };
    S.shadows.push(sh);
    return sh;
  },
  head(sh) { return { x: sh.x + (Math.cos(sh.a) * sh.len) / 2, y: sh.y + (Math.sin(sh.a) * sh.len) / 2 }; },
  // うきが 見える（あたまの まえ 80° いない・NOTICE いない・あいだが ぜんぶ 水）
  sees(map, sh, bx, by) {
    const h = this.head(sh), dx = bx - h.x, dy = by - h.y, d = Math.hypot(dx, dy);
    if (d > this.NOTICE) return false;
    if (d >= 4 && (dx * Math.cos(sh.a) + dy * Math.sin(sh.a)) / d <= this.VIEW) return false;
    for (let s = 6; s < d; s += 6) if (!this.water(map, h.x + (dx * s) / d, h.y + (dy * s) / d)) return false;
    return true;
  },
  // かげの 上に おちた（びっくりして にげる）
  hits(sh, bx, by) {
    const dx = bx - sh.x, dy = by - sh.y, c = Math.cos(sh.a), s = Math.sin(sh.a), u = dx * c + dy * s, v = -dx * s + dy * c;
    return (u / (sh.len * 0.5)) ** 2 + (v / (sh.wid * 0.5 + 5)) ** 2 < 1;
  },
  turnTo(sh, dt, rate) { let d = sh.aim - sh.a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; sh.a += U.clamp(d, -rate * dt, rate * dt); return Math.abs(d) < 0.05; },
  flee(S, sh, from) {
    if (!sh || sh.state === "flee") return;
    sh.state = "flee"; sh.v = 0;
    if (from) sh.a = Math.atan2(sh.y - from.y, sh.x - from.x) + (S.rand() - 0.5) * 0.6;
    if (S.line && S.line.fish === sh) S.line.fish = null;
    Sound.se("fish_flee");
  },

  // ---- まいフレーム ----
  update(sc, dt) {
    const S = this.st(sc); if (!S.spot) return;
    // すまほ・かいわ・まどが ひらいて いる あいだは とまる（じまんの ひとことの あいだは ズームを すすめる）
    if (UI.busy && !S.brag) { S.press = null; return; }
    const L = sc.party[0], R = S.rand;
    // 魚が ときどき あらわれる（いない ときも ある。その 時間・きせつに つれる 魚だけ）
    if (S.auto && !S.brag) {
      const max = this.SLOTS[S.spot.place] || 2;
      if (S.first) { S.first = false; for (let i = 0; i < max; i++) if (R() < 0.5) { const sh = this.spawn(sc); if (sh) sh.alpha = 1; } S.next = 4 + R() * 10; }
      S.next -= dt;
      if (S.next <= 0) { S.next = 5 + R() * 13; if (S.shadows.filter((s) => s.state !== "flee").length < max) this.spawn(sc); }
    }
    // はしると にげる（どうぶつの森と おなじ）
    const running = L.moving && L.dur && L.dur < 0.2;
    for (const sh of S.shadows) this.shadowStep(sc, S, sh, dt, running);
    S.shadows = S.shadows.filter((sh) => !sh.gone);
    this.lineStep(sc, S, dt);
    if (S.brag) this.bragStep(sc, S, dt);
    // ながおし（水の 上で HOLD びょう）
    const P = S.press;
    if (P) {
      P.t += dt;
      if (!sc.touch || sc.touch.id !== P.id || sc.joy || sc.busy || UI.busy) S.press = null;
      else if (P.t >= this.HOLD) { S.press = null; sc.touch = null; this.aim(sc, P.wx, P.wy); }
    }
    for (const e of S.fx) e.t += dt;
    S.fx = S.fx.filter((e) => e.t < e.dur);
  },
  shadowStep(sc, S, sh, dt, running) {
    const B = S.line && S.line.phase !== "swing" && S.line.phase !== "fly" ? S.line : null, R = S.rand;
    sh.t += dt; sh.wig += dt * (sh.state === "flee" ? 22 : sh.state === "approach" ? 9 : 5);
    if (sh.poke > 0) sh.poke = Math.max(0, sh.poke - dt);
    if (sh.state === "flee") { sh.alpha -= dt * 1.7; sh.x += Math.cos(sh.a) * 120 * dt; sh.y += Math.sin(sh.a) * 120 * dt; if (sh.alpha <= 0) sh.gone = true; return; }
    if (sh.state === "leave") { sh.alpha -= dt * 0.7; if (sh.alpha <= 0) sh.gone = true; this.swim(sc, sh, dt, R); return; }
    sh.alpha = Math.min(1, sh.alpha + dt * 1.1);
    if (running && sc.party.some((w) => { const f = w.feet(); return Math.hypot(f.x - sh.x, f.y - sh.y) < 1.8 * TS; })) return this.flee(S, sh, sc.party[0].feet());
    if (sh.state === "swim") {
      if (sh.cool > 0) sh.cool -= dt;
      sh.life -= dt;
      if (sh.life <= 0 && !(B && B.fish === sh)) { sh.state = "leave"; return; }
      if (B && !B.fish && sh.cool <= 0 && B.phase === "float" && this.sees(sc.map, sh, B.x, B.y)) { B.fish = sh; sh.state = "approach"; sh.v = 0; return; }
      this.swim(sc, sh, dt, R);
    } else if (sh.state === "approach") {
      if (!B || B.fish !== sh) { sh.state = "swim"; sh.cool = 3; return; }
      const h = this.head(sh), dx = B.x - h.x, dy = B.y - h.y, d = Math.hypot(dx, dy);
      sh.aim = Math.atan2(dy, dx); const aligned = this.turnTo(sh, dt, 2.6);
      if (d > 2.5) { sh.v = Math.min(aligned ? 24 : 8, sh.v + dt * 30); const m = Math.min(d - 2, sh.v * dt); sh.x += Math.cos(sh.a) * m; sh.y += Math.sin(sh.a) * m; }
      else { sh.state = "nibble"; sh.t = 0; sh.next = 0.45 + R() * 0.6; }
    } else if (sh.state === "nibble") {
      if (!B || B.fish !== sh) { sh.state = "swim"; sh.cool = 3; return; }
      if (sh.t < sh.next) return;
      if (sh.nibbles > 0) {
        // ちょん: あたまで うきを つつく（うきが すこし しずむ・ちいさな 波・おと）
        sh.nibbles--; sh.poke = 0.3; B.dip = 0.3; B.nibbled++; Sound.se("fish_nibble");
        this.ring(S, B.x, B.y, 3, 11, 0.5);
        sh.next = sh.t + 0.7 + R() * 0.9;
        // たまに きが かわって いって しまう
        if (sh.nibbles > 0 && R() < sh.fickle) { sh.state = "swim"; sh.cool = 8; sh.aim = sh.a + Math.PI; sh.turn = 0; B.fish = null; }
      } else {
        // ぐいっ！ うきが しずむ（ここから BITE びょう）
        sh.state = "bite"; sh.t = 0; B.phase = "bite"; B.t = 0; B.sink = 0; Sound.se("fish_bite");
        this.ring(S, B.x, B.y, 5, 20, 0.7); this.drops(S, B.x, B.y, 7, 26);
      }
    } else if (sh.state === "bite") {
      if (!B || B.fish !== sh) { sh.state = "swim"; sh.cool = 3; return; }
      if (sh.t > this.BITE) { B.phase = "float"; B.fish = null; B.escaped = (B.escaped || 0) + 1; this.flee(S, sh, B); this.toast("にげられちゃった… また まってみよう"); }
    }
  },
  // ふつうに およぐ（ゆっくり・ときどき とまる・水の ふちで むきを かえる）
  swim(sc, sh, dt, R) {
    if (sh.pause > 0) { sh.pause -= dt; sh.v = Math.max(0, sh.v - dt * 18); }
    else { sh.v = Math.min(8 + sh.len * 0.05, sh.v + dt * 10); if (R() < dt * 0.22) sh.pause = 0.8 + R() * 2.4; }
    sh.turn = (sh.turn + (R() - 0.5) * dt * 2.2) * Math.pow(0.4, dt);
    sh.aim += sh.turn * dt;
    this.turnTo(sh, dt, 1.4);
    const d = sh.v * dt, nx = sh.x + Math.cos(sh.a) * d, ny = sh.y + Math.sin(sh.a) * d;
    if (this.fits(sc.map, nx, ny, sh.a, sh.len, sh.wid)) { sh.x = nx; sh.y = ny; return; }
    for (const k of [0.7, -0.7, 1.4, -1.4, 2.2, -2.2, Math.PI]) { const a = sh.a + k; if (this.fits(sc.map, sh.x, sh.y, a, sh.len, sh.wid)) { sh.aim = a; sh.turn = 0; sh.v *= 0.5; return; } }
  },

  // ---- うきと いと ----
  // さおの ねもと（手）と さき。k: 0 = うしろに ふりかぶる・1 = まえ
  rod(sc, k) {
    const L = sc.party[0], f = L.feet(), S = this.st(sc), dir = (S.line && S.line.dir) || L.dir;
    const hand = { down: [10, -15], up: [9, -18], left: [-9, -15], right: [9, -15] }[dir] || [9, -15];
    const bx = f.x + hand[0], by = f.y + hand[1], t = S.line && S.line.to;
    let ux, uy;
    if (t) { const d = Math.hypot(t.x - bx, t.y - by) || 1; ux = (t.x - bx) / d; uy = (t.y - by) / d; } else [ux, uy] = DIRS[dir];
    const elev = U.lerp(2.3, 0.42, k), len = 34;
    return { bx, by, x: bx + ux * Math.cos(elev) * len, y: by + uy * Math.cos(elev) * len * 0.75 - Math.sin(elev) * len };
  },
  rodK(line) {
    if (!line) return 0.85;
    if (line.phase === "swing") return line.t < 0.13 ? U.lerp(0.85, 0, U.ease.outCubic(line.t / 0.13)) : U.lerp(0, 1, Math.min(1, (line.t - 0.13) / 0.15));
    if (line.phase === "bite") return 1.12;
    if (line.phase === "reel") return U.lerp(1, 0.5, Math.min(1, line.t / 0.3));
    return line.phase === "fly" ? 1 : 0.9 + (line.dip > 0 ? 0.08 : 0);
  },
  lineStep(sc, S, dt) {
    const B = S.line; if (!B) return;
    const L = sc.party[0];
    B.t += dt; if (B.dip > 0) B.dip = Math.max(0, B.dip - dt);
    // あるいたら さおを しまう（どうぶつの森と おなじ）
    if (B.phase !== "reel" && (L.moving || (sc.path && sc.path.length) || sc.joy)) { if (B.fish) this.flee(S, B.fish, B); S.line = null; Sound.se("fish_reelin"); return; }
    if (B.phase === "swing" && B.t >= 0.28) {
      const tip = this.rod(sc, 1); B.phase = "fly"; B.t = 0; B.from = { x: tip.x, y: tip.y };
      B.dur = 0.24 + Math.hypot(B.to.x - tip.x, B.to.y - tip.y) / 520;
    } else if (B.phase === "fly") {
      const k = Math.min(1, B.t / B.dur);
      B.x = U.lerp(B.from.x, B.to.x, k); B.y = U.lerp(B.from.y, B.to.y, k); B.h = Math.sin(Math.PI * k) * (14 + Math.hypot(B.to.x - B.from.x, B.to.y - B.from.y) * 0.2);
      if (k >= 1) {
        B.phase = "float"; B.t = 0; B.h = 0; B.x = B.to.x; B.y = B.to.y; Sound.se("fish_plop");
        this.ring(S, B.x, B.y, 3, 16, 0.8); this.drops(S, B.x, B.y, 4, 14);
        // かげの 上に おちたら びっくりして にげる
        for (const sh of S.shadows) if (sh.state !== "flee" && this.hits(sh, B.x, B.y)) { this.flee(S, sh, B); this.toast("びっくりして にげちゃった！ かげの すこし まえを ねらってね"); }
      }
    } else if (B.phase === "bite") {
      B.sink = Math.min(1, B.sink + dt / 0.14);
    } else if (B.phase === "reel") {
      const tip = this.rod(sc, this.rodK(B)), k = Math.min(1, B.t / 0.3);
      B.x = U.lerp(B.rx, tip.x, k); B.y = U.lerp(B.ry, tip.y, k); B.h = Math.sin(Math.PI * k) * 10;
      if (k >= 1) S.line = null;
    }
    if (B.phase === "float" && B.t > 0.6 && Math.floor((B.t - dt) / 2.2) !== Math.floor(B.t / 2.2)) this.ring(S, B.x, B.y, 3, 10, 0.9);
  },

  // ---- そうさ ----
  // ながおしの はじまり（WorldScene.down から）。水の 上 だけ
  down(sc, p) {
    const S = this.st(sc); if (!S.spot || S.brag || sc.busy) return;
    const { wx, wy } = sc.screenToTile(p.x, p.y);
    if (!this.water(sc.map, wx, wy)) return;
    S.press = { id: p.id, sx: p.x, sy: p.y, wx, wy, t: 0 };
    if (!S.posed && Fishing.rod()) { S.posed = true; const id = Save.d.order[0], c = Save.d.chars[id]; Chara.preload(["up", "down", "left", "right"].flatMap((dir) => ["land_01", "jump_01"].map((pose) => [id, { pose, dir, outfit: c.outfit, color: c.color }])), CHAR_SIZE); }
  },
  // さおを なげる ばしょを きめる（とどかなければ 岸まで あるく）
  aim(sc, wx, wy) {
    const S = this.st(sc), L = sc.party[0];
    if (!S.spot || S.brag || sc.busy || UI.busy) return false;
    if (!Fishing.rod()) { this.toast("つりざおが あれば ここで つりが できるよ"); return false; }
    if (S.line) { if (S.line.fish) this.flee(S, S.line.fish, S.line); S.line = null; }
    if (!L.moving && this.standOk(sc, L.tx, L.ty, wx, wy, true)) return this.castAt(sc, wx, wy);
    const t = this.standTile(sc, wx, wy);
    if (!t) { Sound.se("cancel"); this.toast("そこまで さおが とどかないよ"); return false; }
    sc.goTo(t.x, t.y, { type: "fishcast", px: wx, py: wy });
    return true;
  },
  // 立って なげられる マス（水の となり・ワープや ドアでは ない・うきまで CAST_MAX いない）
  standOk(sc, x, y, wx, wy, here) {
    const m = sc.map;
    if (!here && !sc.walkable(x, y)) return false;
    if (m.warpAt(x, y) || m.doorAt(x, y)) return false;
    if (!["up", "down", "left", "right"].some((d) => m.groundAt(x + DIRS[d][0], y + DIRS[d][1]) === "water")) return false;
    return Math.hypot(wx - (x * TS + TS / 2), wy - (y * TS + TS - 17)) <= this.CAST_MAX;
  },
  // いちばん ちかい 立てる マス（あるく みちのりで。BFS）
  standTile(sc, wx, wy) {
    const L = sc.party[0], W = sc.map.w, H = sc.map.h, seen = new Uint8Array(W * H), q = [[L.tx, L.ty]];
    seen[L.ty * W + L.tx] = 1;
    for (let n = 0; q.length && n < 4000; n++) {
      const [x, y] = q.shift();
      if (this.standOk(sc, x, y, wx, wy, x === L.tx && y === L.ty)) return { x, y };
      for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen[ny * W + nx] || !sc.walkable(nx, ny)) continue;
        seen[ny * W + nx] = 1; q.push([nx, ny]);
      }
    }
    return null;
  },
  castAt(sc, wx, wy) {
    const S = this.st(sc), L = sc.party[0], f = L.feet();
    if (!S.spot || !Fishing.rod() || S.brag || L.moving) return false;
    const dx = wx - f.x, dy = wy - (f.y - 12);
    L.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
    S.line = { phase: "swing", t: 0, dir: L.dir, to: { x: wx, y: wy }, x: 0, y: 0, h: 0, fish: null, dip: 0, nibbled: 0, sink: 0 };
    const tip = this.rod(sc, 1);
    let d = Math.hypot(wx - tip.x, wy - tip.y) || 1;
    const ux = (wx - tip.x) / d, uy = (wy - tip.y) / d;
    d = U.clamp(d, this.CAST_MIN, this.CAST_MAX);
    // 水に おちる ところまで ちかづける（岸には おとさない）
    let tx = tip.x + ux * d, ty = tip.y + uy * d;
    for (let i = 0; i < 60 && !this.water(sc.map, tx, ty) && d > 8; i++) { d -= 3; tx = tip.x + ux * d; ty = tip.y + uy * d; }
    for (let i = 0; i < 60 && !this.water(sc.map, tx, ty) && d < this.CAST_MAX + 40; i++) { d += 3; tx = tip.x + ux * d; ty = tip.y + uy * d; }
    if (!this.water(sc.map, tx, ty)) { S.line = null; Sound.se("cancel"); return false; }
    S.line.to = { x: tx, y: ty }; S.line.x = tip.x; S.line.y = tip.y;
    Sound.se("fish_cast");
    return true;
  },
  // キーボード: 水の ほうを むいて ok（まえ 2.6マス）
  castFront(sc) {
    const S = this.st(sc), L = sc.party[0]; if (!S.spot || !Fishing.rod() || L.moving) return false;
    const [dx, dy] = DIRS[L.dir], f = L.feet();
    if (sc.map.groundAt(L.tx + dx, L.ty + dy) !== "water") return false;
    return this.castAt(sc, f.x + dx * 2.6 * TS, f.y - 12 + dy * 2.6 * TS);
  },
  // 「つる」（ボタン・ok キー）: しずんで いれば つりあげる。まだなら さおを もどす（よって きた 魚は にげる）
  pull(sc) {
    const S = this.st(sc), B = S.line;
    if (!B || S.brag || B.phase === "swing" || B.phase === "fly" || B.phase === "reel") return false;
    if (B.phase === "bite" && B.fish) { this.hook(sc); return true; }
    if (B.fish) { const nib = B.fish.state === "nibble"; this.flee(S, B.fish, B); this.toast(nib ? "はやすぎた！ うきが ぐいっと しずむ まで まってね" : "あっ… にげちゃった"); }
    B.phase = "reel"; B.t = 0; B.rx = B.x; B.ry = B.y; Sound.se("fish_reelin");
    return true;
  },
  toast(msg) { this.last = msg; if (UI.toastBox) UI.toast(msg); },

  // ---- つりあげる → じまん ----
  hook(sc) {
    const S = this.st(sc), B = S.line, sh = B.fish, L = sc.party[0];
    S.shadows = S.shadows.filter((x) => x !== sh);
    S.brag = { f: sh.f, cm: sh.cm, t: 0, phase: "jump", from: { x: B.x, y: B.y }, held: this.heldLen(sh.cm), dir: L.dir };
    S.line = null;
    sc.busy = true; sc.path = null; sc.pending = null;
    Sound.se("fish_hook"); Sound.se("fish_splash");
    this.ring(S, B.x, B.y, 6, 26, 0.9); this.drops(S, B.x, B.y, 10, 34);
    this.preload(sc, sh.f);
  },
  preload(sc, f) {
    const jobs = [], big = this.ZOOM;
    Save.d.order.forEach((id, i) => { const c = Save.d.chars[id], o = { pose: "jump_01", dir: "down", face: i ? "excited" : "happy", outfit: c.outfit, color: c.color }; for (const p of ["jump_01", "idle_01"]) { const oo = { ...o, pose: p }, pw = Chara.pxSize(CHAR_SIZE * big), ph = Math.round((pw * VB.h) / VB.w); jobs.push(SvgCache.ensure(Chara.key(id, oo), () => Chara.svg(id, oo), pw, ph)); } });
    jobs.push(this.fishImg(f, true));
    return Promise.all(jobs).catch(() => {});
  },
  fishAspect(f) {
    const vb = (FishArt.svg(f.art, { uid: "fa" + f.id, flip: !!f.flip }).match(/viewBox="[-\d.]+ [-\d.]+ ([\d.]+) ([\d.]+)"/) || [0, 100, 50]);
    return +vb[2] / +vb[1];
  },
  aspects: {},
  // かかげる 魚の 絵（SvgCache「fishhold:<id>」。大きさは 魚ごとに きまった 1つ＝いちばん 大きい ときの ZOOM ばい）
  fishImg(f, ensure) {
    const asp = this.aspects[f.id] || (this.aspects[f.id] = this.fishAspect(f)), pw = Math.ceil(this.heldLen(f.size[1]) * this.ZOOM * G.px), ph = Math.ceil(pw * asp), key = "fishhold:" + f.id;
    const build = () => FishArt.svg(f.art, { uid: "fh" + f.id, flip: !!f.flip });
    return ensure ? SvgCache.ensure(key, build, pw, ph) : SvgCache.get(key, build, pw, ph);
  },
  bragStep(sc, S, dt) {
    const B = S.brag; B.t += dt;
    if (B.phase === "jump" && B.t >= 0.6) {
      B.phase = "show"; B.st = B.t; Sound.se("fish_catch");
      sc.party.forEach((w, i) => { if (i) { w.hop = 0.35; sc.addFx(i === 1 ? "heart" : "note", w, 1.4); } });
      sc.addFx("sparkle", sc.party[0], 1.2);
      this.say(sc, B);
    }
    const zin = B.st != null ? U.ease.outCubic(Math.min(1, (B.t - B.st) / 0.45)) : 0;
    const zout = B.out != null ? U.ease.inOut(Math.min(1, (B.t - B.out) / 0.4)) : 0;
    S.zoom = 1 + (this.ZOOM - 1) * zin * (1 - zout);
    if (B.out != null && B.t - B.out >= 0.4) { S.brag = null; S.zoom = 1; sc.busy = false; }
  },
  quote(f, cm, id) {
    const span = f.size[1] - f.size[0], big = cm >= f.size[1] - span * 0.1, small = cm <= f.size[0] + span * 0.1;
    return `${this.TAIL[id] ? this.TAIL[id] + " " : ""}${f.name}を つりあげた！\n${this.QUOTES[f.id] || "やったね！"}\n${cm}cm${big ? "の おおもの！" : small ? "の ちびっこ！" : ""}`;
  },
  async say(sc, B) {
    const f = B.f, id = Save.d.order[0], full = Fishing.keepCount() >= Fishing.KEEP_MAX;
    const lines = [{ who: id, emo: "happy", text: this.quote(f, B.cm, id) }];
    if (full) lines.push({ who: id, emo: "sad", text: `いけすが いっぱい…。\n${f.name}は みずに かえして あげよう。\nスーパーで うるか すいぞくかんに きふ してね。` });
    await U.wait(450);
    B.talking = true;
    await UI.say(lines);
    const first = Fishing.record(f.id, B.cm, { keep: !full });
    if (first) UI.toast(`<span class="fish-got">${Fishing.svg(f, "c" + f.id)}はじめて！ ずかんに のったよ</span>`, "good");
    if (!full) UI.toast(`${f.name}を いけすに いれたよ（${Fishing.keepCount()} / ${Fishing.KEEP_MAX}）`);
    // ② 町の人の おねがい（つる → わたす）
    if (typeof TownFolk !== "undefined") await TownFolk.progress({ do: "catch", fish: f.id }, { name: "", face: "" });
    Save.write();
    B.talking = false; B.out = B.t; B.phase = "out";
  },

  // ---- こまかい うごき（波の わ・しずく）----
  ring(S, x, y, r0, r1, dur) { S.fx.push({ k: "ring", x, y, r0, r1, t: 0, dur }); },
  drops(S, x, y, n, sp) { for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (S.rand() - 0.5) * 2.2, v = sp * (0.6 + S.rand() * 0.6); S.fx.push({ k: "drop", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20, t: 0, dur: 0.5 + S.rand() * 0.25 }); } },

  // ---- 描く ----
  // 水の 上（キャラより 下）: 魚の かげ・うき・波の わ
  drawWater(sc, ctx, ox, oy) {
    const S = sc.fishing; if (!S || S.map !== sc.mapId) return;
    for (const sh of S.shadows) this.drawShadow(ctx, sh, ox, oy);
    for (const e of S.fx) if (e.k === "ring") {
      const k = e.t / e.dur, r = U.lerp(e.r0, e.r1, U.ease.outCubic(k));
      ctx.save(); ctx.globalAlpha = (1 - k) * 0.85; ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.ellipse(ox + e.x, oy + e.y + 1, r, r * 0.5, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    }
    const B = S.line;
    if (B && B.phase !== "swing") this.drawBobber(ctx, B, ox, oy, sc);
  },
  drawShadow(ctx, sh, ox, oy) {
    const poke = sh.poke > 0 ? Math.sin((1 - sh.poke / 0.3) * Math.PI) * 3.5 : 0, L = sh.len, W = sh.wid;
    const x = ox + sh.x + Math.cos(sh.a) * poke, y = oy + sh.y + Math.sin(sh.a) * poke;
    ctx.save(); ctx.translate(x, y); ctx.rotate(sh.a);
    const thin = Fishing.shadowOf(sh.f) === "thin", sway = Math.sin(sh.wig) * (sh.state === "swim" ? 0.28 : 0.45);
    for (const [grow, al] of [[3, 0.16], [0, 0.34]]) {
      ctx.globalAlpha = al * sh.alpha; ctx.fillStyle = "#10303E"; ctx.strokeStyle = "#10303E";
      if (thin) {
        ctx.lineWidth = W + grow; ctx.lineCap = "round"; ctx.beginPath();
        for (let i = 0; i <= 10; i++) { const u = 0.5 - i / 10, px = u * L, py = Math.sin(sh.wig - i * 0.8) * W * 0.55 * (i / 10); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
        ctx.stroke();
      } else {
        ctx.beginPath(); ctx.ellipse(L * 0.07, 0, L * 0.39 + grow, W / 2 + grow, 0, 0, Math.PI * 2); ctx.fill();
        ctx.save(); ctx.translate(-L * 0.28, 0); ctx.rotate(sway);
        ctx.beginPath(); ctx.moveTo(2, 0); ctx.lineTo(-L * 0.22 - grow, -W * 0.46 - grow); ctx.quadraticCurveTo(-L * 0.15, 0, -L * 0.22 - grow, W * 0.46 + grow); ctx.closePath(); ctx.fill();
        ctx.restore();
        // むなびれ（ゆらゆら）
        const fin = Math.sin(sh.wig * 1.3) * 0.3;
        for (const s of [-1, 1]) { ctx.save(); ctx.translate(L * 0.16, (s * W) / 2.4); ctx.rotate(s * (0.5 + fin)); ctx.beginPath(); ctx.ellipse(-W * 0.18, 0, W * 0.26 + grow / 2, W * 0.1 + grow / 3, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
      }
    }
    ctx.restore();
  },
  drawBobber(ctx, B, ox, oy, sc) {
    const bob = B.phase === "float" ? Math.sin(B.t * 3.2) * 0.8 : 0, dip = B.dip > 0 ? Math.sin((1 - B.dip / 0.3) * Math.PI) * 2.6 : 0;
    const x = ox + B.x, y = oy + B.y + bob + dip + (B.phase === "bite" ? B.sink * 5 : 0) - (B.h || 0);
    ctx.save();
    if (B.h > 1) { ctx.globalAlpha = 0.25; ctx.fillStyle = "#1F1D1B"; ctx.beginPath(); ctx.ellipse(ox + B.x, oy + B.y + 2, 3.5, 1.6, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
    if (B.phase === "bite") {
      // しずんで いる: 水の 下で ぼんやり（うえの あかい ところが すこしだけ）
      ctx.globalAlpha = 1 - B.sink * 0.65;
    }
    if (B.phase === "float" || B.phase === "bite") { ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.beginPath(); ctx.ellipse(x, y + 3.2, 5.5, 2, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#E0525B"; ctx.beginPath(); ctx.arc(x, y, 4, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y - 4); ctx.lineTo(x, y - 7); ctx.stroke();
    ctx.restore();
  },
  // いちばん うえ: さお・いと・とびだす 魚・「！」・ながおしの わ・しずく
  drawTop(sc, ctx, ox, oy) {
    const S = sc.fishing; if (!S || S.map !== sc.mapId) return;
    const B = S.line;
    if (B || (S.brag && S.brag.phase === "jump")) {
      const r = this.rod(sc, B ? this.rodK(B) : 0.3);
      ctx.save(); ctx.lineCap = "round";
      ctx.strokeStyle = INK; ctx.lineWidth = 4.2; ctx.beginPath(); ctx.moveTo(ox + r.bx, oy + r.by); ctx.lineTo(ox + r.x, oy + r.y); ctx.stroke();
      ctx.strokeStyle = "#C98A52"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ox + r.bx, oy + r.by); ctx.lineTo(ox + r.x, oy + r.y); ctx.stroke();
      ctx.fillStyle = "#8FD0F0"; ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(ox + U.lerp(r.bx, r.x, 0.22), oy + U.lerp(r.by, r.y, 0.22), 2.6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      if (B && B.phase !== "swing") {
        const bx = ox + B.x, by = oy + B.y - (B.h || 0) - 5, mx = (ox + r.x + bx) / 2, my = (oy + r.y + by) / 2 + (B.phase === "bite" ? 0 : B.phase === "fly" ? 4 : 10);
        ctx.strokeStyle = "rgba(255,255,255,0.9)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(ox + r.x, oy + r.y); ctx.quadraticCurveTo(mx, my, bx, by); ctx.stroke();
      }
      ctx.restore();
    }
    // ぐいっ！ の「！」（ポケットキャンプの ように）
    if (B && B.phase === "bite") { const f = sc.party[0].feet(); sc.bubble(ctx, ox + f.x + 14, oy + f.y - 52 - Math.abs(Math.sin(B.t * 14)) * 2, "!", "#FFE066"); }
    const BR = S.brag;
    if (BR && BR.phase === "jump") {
      // 魚が 水から とびだして 3人の ところへ
      const f = sc.party[0].feet(), k = Math.min(1, BR.t / 0.6), to = { x: f.x, y: f.y - 58 };
      const x = U.lerp(BR.from.x, to.x, k), y = U.lerp(BR.from.y, to.y, k) - Math.sin(Math.PI * k) * 46;
      this.drawFish(ctx, BR.f, ox + x, oy + y, U.lerp(Math.min(BR.held, 40), BR.held, k), k * Math.PI * 2 * (BR.from.x < to.x ? 1 : -1));
    }
    for (const e of S.fx) if (e.k === "drop") {
      const k = e.t / e.dur; ctx.save(); ctx.globalAlpha = 1 - k; ctx.fillStyle = "#EAF8FF"; ctx.strokeStyle = "rgba(31,29,27,0.4)"; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.arc(ox + e.x + e.vx * e.t, oy + e.y + e.vy * e.t + 70 * e.t * e.t, 1.8, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
    }
    // ながおしの わ（たまると なげる）
    const P = S.press;
    if (P && P.t > 0.08 && Fishing.rod()) {
      const k = Math.min(1, P.t / this.HOLD), { wx, wy } = P;
      ctx.save(); ctx.strokeStyle = "rgba(255,255,255,0.95)"; ctx.lineWidth = 3; ctx.lineCap = "round";
      ctx.beginPath(); ctx.arc(ox + wx, oy + wy, 14, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k); ctx.stroke();
      ctx.globalAlpha = 0.5; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(ox + wx, oy + wy, 14, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    }
  },
  drawFish(ctx, f, x, y, len, rot) {
    const c = this.fishImg(f, false), asp = this.aspects[f.id] || (this.aspects[f.id] = this.fishAspect(f)), h = len * asp;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0);
    if (c) ctx.drawImage(c, -len / 2, -h / 2, len, h);
    else { ctx.fillStyle = "#8FB8C8"; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, len / 2, h / 2.4, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    ctx.restore();
    return h;
  },
  // なげる うごき（せんとう）: ふりかぶる ときは かがむ（land_01）→ なげる ときは のびる（jump_01）。つりあげる ときも のびる
  castPose(S) {
    const B = S.line, BR = S.brag;
    if (BR && BR.phase === "jump") return "jump_01";
    if (B && B.phase === "swing") return B.t < 0.13 ? "land_01" : "jump_01";
    if (B && B.phase === "fly" && B.t < 0.12) return "jump_01";
    return null;
  },
  // じまん ちゅうの 3人（WorldScene.drawMember の かわり）: せんとうは つまさき立ちで 魚を かかげる・2人は ぴょんぴょん
  drawMember(sc, ctx, i, ox, oy) {
    const S = sc.fishing, BR = S && S.map === sc.mapId && S.brag;
    const pose = !i && S && S.map === sc.mapId && this.castPose(S);
    if (pose) {
      const w = sc.party[0], id = Save.d.order[0], c = Save.d.chars[id], f = w.feet();
      sc.shadow(ctx, ox + f.x, oy + f.y, 13);
      Chara.draw(ctx, id, { pose, dir: w.dir, outfit: c.outfit, color: c.color }, ox + f.x, oy + f.y, CHAR_SIZE);
      return true;
    }
    if (!BR || BR.phase === "jump") return false;
    const w = sc.party[i], id = Save.d.order[i], c = Save.d.chars[id], f = w.feet(), T = BR.t - (BR.st || 0);
    const hop = i ? Math.abs(Math.sin(T * 7 + i)) * 5 : Math.abs(Math.sin(T * 5)) * 2.5;
    const o = { pose: i ? (Math.sin(T * 7 + i) > 0 ? "jump_01" : "idle_01") : "jump_01", dir: i ? w.dir : "down", face: i ? "excited" : "happy", outfit: c.outfit, color: c.color };
    sc.shadow(ctx, ox + f.x, oy + f.y, 13);
    this.drawHi(ctx, id, o, ox + f.x, oy + f.y - hop, CHAR_SIZE);
    if (!i) {
      // あたまの 上に 魚（すこし ぴちぴち）＋ 2つの 手
      const cx = ox + f.x, cy = oy + f.y - 60 - hop, len = BR.held, wig = Math.sin(T * 9) * 0.07;
      const h = this.drawFish(ctx, BR.f, cx, cy, len, wig);
      ctx.save(); ctx.fillStyle = this.HAND[id] || "#FFFFFF"; ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(cx + s * Math.min(len * 0.28, 16), cy + h * 0.3 + 2, 4.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
      ctx.restore();
    }
    return true;
  },
  // ズームしても にじまない ように 大きい 絵を つかう（キーは ZOOM ばいの 1つだけ）
  drawHi(ctx, id, o, x, y, size) {
    const pw = Chara.pxSize(size * this.ZOOM), ph = Math.round((pw * VB.h) / VB.w), c = SvgCache.get(Chara.key(id, o), () => Chara.svg(id, o), pw, ph);
    if (!c) return Chara.draw(ctx, id, o, x, y, size);
    const h = (size * VB.h) / VB.w;
    ctx.drawImage(c, x - ((FOOT.x - VB.x) / VB.w) * size, y - ((FOOT.y - VB.y) / VB.h) * h, size, h);
  },

  // ---- 「つる」ボタン（うきが 水に ある ときだけ。下の まん中）----
  button: null,
  syncButton(sc) {
    const S = sc.fishing, B = S && S.map === sc.mapId && !S.brag && G.scene === sc && S.line;
    if (!B) { this.hideButton(); return; }
    if (!this.button) {
      const b = UI.btn(`${Fishing.rodSvg()}<span>つる</span>`, () => { if (!Game.trans && !UI.busy) this.pull(sc); }, "act-btn fish-go-btn");
      b.setAttribute("aria-label", "つる");
      b.addEventListener("pointerdown", (e) => e.stopPropagation());
      UI.root.append(b);
      this.button = b;
    }
    this.button.classList.toggle("bite", B.phase === "bite");
  },
  hideButton() { if (this.button) this.button.remove(); this.button = null; },
  // テスト・PokaDebug 用の ようす
  state(sc) {
    const S = sc && sc.fishing && sc.fishing.map === sc.mapId ? sc.fishing : null; if (!S) return null;
    // 画面の 位置は 町の ズーム（WorldZoom）も ふくめる
    const at = (x, y) => (typeof WorldZoom !== "undefined" ? WorldZoom.toScreen(sc, x, y) : { x: G.W / 2 - sc.cam.x + x, y: G.H / 2 - sc.cam.y + y }), B = S.line, r = this.button && this.button.getBoundingClientRect();
    const bs = B && at(B.x, B.y);
    return { spot: S.spot && S.spot.place, line: B ? B.phase : null, bobber: B ? { x: B.x, y: B.y, sx: bs.x, sy: bs.y } : null, nibbled: B ? B.nibbled : 0, escaped: B ? B.escaped || 0 : 0,
      fish: B && B.fish ? B.fish.f.id : null, shadows: S.shadows.map((s) => { const q = at(s.x, s.y); return { uid: s.uid, id: s.f.id, cm: s.cm, len: s.len, wid: s.wid, x: s.x, y: s.y, a: s.a, sx: q.x, sy: q.y, state: s.state, head: this.head(s) }; }),
      brag: S.brag ? { phase: S.brag.phase, id: S.brag.f.id, cm: S.brag.cm, held: S.brag.held, talking: !!S.brag.talking } : null, zoom: S.zoom, press: !!S.press, last: this.last || null,
      button: r ? { x: r.x, y: r.y, w: r.width, h: r.height, bite: this.button.classList.contains("bite") } : null };
  },
};

// ---- つなぎ（WorldScene を 外から つつむ。scene-world.js は かえない）----
(() => {
  const se = Sound.se;
  Sound.se = function (name) {
    const fx = FishLine.SE[name];
    if (!fx) return se.call(this, name);
    if (!this.ctx || !Save.d || !Save.d.settings.se) return;
    const d = this.seGain; fx(this, (o) => this.tone(d, o), (o) => this.noise(d, o));
  };
  const P = WorldScene.prototype, wrap = (name, fn) => { const orig = P[name]; P[name] = function (...a) { return fn.call(this, orig, ...a); }; };
  wrap("down", function (orig, p) { const r = orig.call(this, p); FishLine.down(this, p); return r; });
  wrap("update", function (orig, dt) { const r = orig.call(this, dt); FishLine.update(this, dt); FishLine.syncButton(this); return r; });
  wrap("renderWater", function (orig, ctx, ox, oy) { const r = orig.call(this, ctx, ox, oy); FishLine.drawWater(this, ctx, ox, oy); return r; });
  wrap("renderFx", function (orig, ctx, ox, oy) { const r = orig.call(this, ctx, ox, oy); FishLine.drawTop(this, ctx, ox, oy); return r; });
  wrap("drawMember", function (orig, ctx, i, ox, oy) { if (!FishLine.drawMember(this, ctx, i, ox, oy)) return orig.call(this, ctx, i, ox, oy); });
  // うきが 水に ある あいだ・じまん ちゅうは まものも そっと して おく（どうぶつの森の つりは じゃま されない）
  wrap("updateEnemies", function (orig, dt) { const S = this.fishing; if (S && S.map === this.mapId && (S.line || S.brag)) return; return orig.call(this, dt); });
  wrap("interact", function (orig, p) { if (p && p.type === "fishcast") return FishLine.castAt(this, p.px, p.py); return orig.call(this, p); });
  wrap("key", function (orig, k, down) {
    if (down && k === "ok") {
      const S = FishLine.st(this);
      if (S.brag) return;
      if (S.line) { FishLine.pull(this); return; }
      if (this.interactFront() === undefined) FishLine.castFront(this);
      return;
    }
    return orig.call(this, k, down);
  });
  wrap("exit", function (orig) { FishLine.hideButton(); if (this.fishing) { this.fishing.line = null; this.fishing.brag = null; this.fishing.zoom = 1; } return orig.call(this); });
  // じまんの ときだけ カメラを せんとうの 子へ ズーム（DOM の ボタンや HUD は そのまま）
  wrap("render", function (orig, ctx) {
    const S = this.fishing, z = S && S.map === this.mapId ? S.zoom : 1;
    if (!(z > 1.001)) return orig.call(this, ctx);
    const f = this.party[0].feet(), cx = G.W / 2 - this.cam.x + f.x, cy = G.H / 2 - this.cam.y + f.y - 36, k = (z - 1) / (FishLine.ZOOM - 1);
    ctx.save(); ctx.translate(U.lerp(cx, G.W / 2, k), U.lerp(cy, G.H * 0.4, k)); ctx.scale(z, z); ctx.translate(-cx, -cy);
    try { return orig.call(this, ctx); } finally { ctx.restore(); }
  });
  // 釣りの ボタンは FishLine が 出す（Fishing.refreshButton は scene-world.js が まいフレーム よぶ）
  Fishing.refreshButton = function (sc) { FishLine.syncButton(sc); };
  Fishing.hideButton = function () { FishLine.hideButton(); };
  Object.defineProperty(Fishing, "button", { get: () => FishLine.button, configurable: true });
})();
