// クレーンゲームの 機械 19台（1F 12台・2F の おかし キャッチャー 5台・はしわたし 2台）の アーム・台・景品の おき方と 1かいの あそび（CraneRound）。絵と ボタンは crane-scene.js、景品は arcade-prizes.js・snack-art.js・bridge-prizes.js。
// 日がわりの 台（1F の 7台・2F の 7台）: 台ごとの pool から その日の pick しゅ（lineup）。台の ようすは 日が かわると はじめから（セーブの 形は かわらない・board.day を たす だけ）。
// keep の 台（トライポッド・はしわたし）は、まえの 日の けいひんが 台に のこって いれば とれるまで その日の ならびの まま（keepDay。すこしずつ すすめた ぶんが きえない）。
// たんい: cm・びょう。x = 左→右・y = 下→上・z = 手前→おく。おとしぐちに 落ちた 景品が「とれた」。
// 物理は CranePhys（crane-physics.js）。おなじ ばめんからは おなじ けっかに なる（Math.random を つかわない）。
const CraneMachines = (() => {
  const CP = CranePhys, D2R = Math.PI / 180, DT = 1 / 60;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const mix = (a, b, t) => a + (b - a) * t;
  const ease = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
  // アームで あそぶ 台（3本・2本アーム・リングフック・はしわたし）
  const clawy = (t) => t === "claw" || t === "ring" || t === "bridge";
  // きまった たねの 乱数（mulberry32）
  const rng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  // ---- 日がわり（その日の けいひん）----
  // 日づけは その日の 0じ から（PokaDebug.calendar の Seasonal.override も つかう）。"2026-9-30" の かたち（U.today と おなじ）
  const today = () => { const d = (typeof Seasonal !== "undefined" && Seasonal.override) || new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
  const dayNum = (day) => { const [y, m, d] = String(day).split("-").map(Number); return Math.floor(Date.UTC(y || 2026, (m || 1) - 1, d || 1) / 86400000); };
  const hashStr = (t) => { let h = 2166136261; for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; };
  // 台ごとに きまった じゅんばん（pool を まぜる）で、1にち step こずつ すすむ pick この まど。step は pick いか で pool の かずと たがいに そ
  // → まいにち かならず かわる・pool の かず の 日で ぜんぶ でる。さいしょが その日の 「めだまの けいひん」
  const stepOf = (L, k) => { const g = (a, b) => (b ? g(b, a % b) : a); for (let q = k; q > 1; q--) if (g(q, L) === 1) return q; return 1; };
  const lineup = (d, day = today()) => {
    if (!d || !d.pool) return null;
    const L = d.pool.length, k = Math.min(d.pick || 1, L), r = rng(hashStr(d.id)), order = d.pool.slice();
    for (let i = L - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    const n = dayNum(day), at = (((n * stepOf(L, k)) % L) + L) % L;
    return Array.from({ length: k }, (_, j) => order[(at + j) % L]);
  };
  // keep の 台: セーブの 台に まえの 日の けいひんが のこって いれば その日（とれたら つぎから きょうの ならび）
  const keepDay = (d, board, day = today()) => (d && d.keep && d.pool && board && board.id === d.id && board.day && board.day !== day && Array.isArray(board.b) && board.b.length ? board.day : day);

  // ---- 景品の かたち（たまの ならび）。ローカル: +x 右・+y 上・-z が おもて（顔）----
  const lattice = (w, h, d, n) => {
    const r = Math.max(w / n[0], h / n[1], d / n[2]) * 0.56, parts = [];
    for (let i = 0; i < n[0]; i++) for (let j = 0; j < n[1]; j++) for (let k = 0; k < n[2]; k++) {
      const u = n[0] > 1 ? i / (n[0] - 1) : 0.5, v = n[1] > 1 ? j / (n[1] - 1) : 0.5, s = n[2] > 1 ? k / (n[2] - 1) : 0.5;
      // 1れつの 向きは すこし ずらす（ひらたすぎると 回転が きまらない）
      const jig = ((i + j + k) % 2 ? 0.1 : -0.1);
      parts.push({ x: (u - 0.5) * (w - 2 * Math.min(r, w / 2)) + (n[0] === 1 ? jig : 0), y: (v - 0.5) * (h - 2 * Math.min(r, h / 2)) + (n[1] === 1 ? jig : 0), z: (s - 0.5) * (d - 2 * Math.min(r, d / 2)) + (n[2] === 1 ? jig : 0), r: Math.min(r, w / 2, h / 2, d / 2) * 1.02, m: 1 });
    }
    return parts;
  };
  // リング（あなの 向きは z。まえ・うしろから ツメが とおる）。すこし おもく する（かるいと フックで もちあげても 景品が ついて こない）
  const RING_N = 18, ringParts = (cy, R, r = 0.55, m = 0.5) => Array.from({ length: RING_N }, (_, i) => { const a = (i / RING_N) * Math.PI * 2; return { x: Math.cos(a) * R, y: cy + Math.sin(a) * R, z: 0, r, m }; });
  const SHAPES = {
    // ほしの クッション（ひらたい 星。まん中＋とがり 5＋くぼみ 5）
    star: () => {
      const parts = [{ x: 0, y: 0, z: -1, r: 3, m: 1 }, { x: 0, y: 0, z: 1, r: 3, m: 1 }]; // まん中は まえと うしろ（ひらたすぎると 回転が きまらない）
      for (let i = 0; i < 10; i++) { const a = (90 + i * 36) * D2R, R = i % 2 ? 3.9 : 6.3; parts.push({ x: Math.cos(a) * R, y: Math.sin(a) * R, z: 0, r: i % 2 ? 2.5 : 2.25, m: 0.6 }); }
      return { parts, stiff: 0.45, fric: 0.75, look: "star", size: [18, 18, 5.4] };
    },
    // ごじ（大きい ぬいぐるみ。まるい からだ・耳・うで・あし・しっぽ）
    goji: () => ({ parts: [
      { x: 0, y: -6, z: 0, r: 8, m: 4 }, { x: 0, y: 1, z: 0, r: 8.5, m: 4 }, { x: 0, y: 7.5, z: 0.4, r: 7.5, m: 3 },
      { x: -6, y: 13, z: 0.5, r: 2.4, m: 0.4 }, { x: 6, y: 13, z: 0.5, r: 2.4, m: 0.4 },
      { x: -12.8, y: -0.5, z: -0.6, r: 2.8, m: 0.6 }, { x: 12.8, y: -0.5, z: -0.6, r: 2.8, m: 0.6 },
      { x: -5, y: -12.5, z: -1, r: 2.8, m: 0.8 }, { x: 5, y: -12.5, z: -1, r: 2.8, m: 0.8 }, { x: 10.5, y: -9, z: 5, r: 2.8, m: 0.6 },
    ], stiff: 0.32, fric: 0.8, look: "goji", art: [0, 0.4, 31, 31], size: [31, 31, 17] }),
    // わんこ（あたまが 大きい。たれた 耳）
    wanko: () => ({ art: [0, -0.5, 23.6, 24.4], parts: [
      { x: 0, y: 5, z: 0, r: 7.6, m: 3 }, { x: 0, y: -5.5, z: 0.5, r: 5.4, m: 2.5 },
      { x: -8.4, y: 5.5, z: 0.5, r: 3.3, m: 0.5 }, { x: 8.4, y: 5.5, z: 0.5, r: 3.3, m: 0.5 },
      { x: -4.6, y: -4, z: -1.5, r: 2.4, m: 0.4 }, { x: 4.6, y: -4, z: -1.5, r: 2.4, m: 0.4 },
      { x: -2.9, y: -10.6, z: -0.8, r: 2.5, m: 0.5 }, { x: 2.9, y: -10.6, z: -0.8, r: 2.5, m: 0.5 }, { x: 4.5, y: -8, z: 4.4, r: 1.8, m: 0.2 },
    ], stiff: 0.34, fric: 0.8, look: "wanko", size: [23, 26, 16] }),
    // がちゃん（まるい ひよこ）＋あたまの リング
    gachan: () => ({ art: [0, -0.7, 14.4, 20.6], parts: [
      { x: 0, y: 3.2, z: 0.3, r: 6.4, m: 2.2 }, { x: 0, y: -5, z: 0.4, r: 5.5, m: 3.2 },
      { x: -5.2, y: -4.4, z: 0, r: 2, m: 0.3 }, { x: 5.2, y: -4.4, z: 0, r: 2, m: 0.3 },
      { x: -3.4, y: -8.7, z: -3.4, r: 2.2, m: 0.8 }, { x: 3.4, y: -8.7, z: -3.4, r: 2.2, m: 0.8 }, { x: 0, y: -8.2, z: 4, r: 2.6, m: 0.8 }, { x: -4, y: -8.6, z: 1.5, r: 2.3, m: 0.6 }, { x: 4, y: -8.6, z: 1.5, r: 2.3, m: 0.6 },
      { x: 0, y: 10.2, z: 0.3, r: 0.9, m: 0.15 }, ...ringParts(14.8, 2.9, 0.6),
    ], stiff: 0.7, fric: 0.8, look: "gachan", ring: [0, 14.8, 0, 2.9], size: [15, 30, 14] }),
    // メリーゴーランドの はこ（かたい はこ）
    carousel: () => ({ parts: lattice(22, 26, 22, [3, 3, 3]), stiff: 1, fric: 0.55, look: "carousel", box: [22, 26, 22], size: [22, 26, 22] }),
    // クッキーの はこ＋リング
    cookie: () => ({ parts: [...lattice(17, 8, 11, [3, 2, 2]), { x: 0, y: 4.6, z: 0, r: 0.9, m: 0.15 }, ...ringParts(9.3, 2.9, 0.6)], stiff: 1, fric: 0.5, look: "cookie", box: [17, 8, 11], ring: [0, 9.3, 0, 2.9], size: [17, 17, 11] }),
    // うまーぼう（ぼう）
    stick: () => ({ parts: Array.from({ length: 4 }, (_, i) => ({ x: (i - 1.5) * 3.5, y: i % 2 ? 0.12 : -0.12, z: i < 2 ? 0.1 : -0.1, r: 1.35, m: 0.5 })), stiff: 1, fric: 0.45, look: "uma", size: [13.2, 2.7, 2.7] }),
    // ぱいのみんの はこ（ひらたい）
    pie: () => ({ parts: lattice(9.5, 3, 7.5, [3, 1, 2]), stiff: 1, fric: 0.45, look: "pie", box: [9.5, 3, 7.5], size: [9.5, 3, 7.5] }),
  };

  // 大きい ぬいぐるみ（おなじ 形を k ばい）
  const scaled = (name, k) => () => { const S = SHAPES[name](); return { ...S, parts: S.parts.map((a) => ({ x: a.x * k, y: a.y * k, z: a.z * k, r: a.r * k, m: a.m })), art: S.art && S.art.map((v) => v * k), size: S.size.map((v) => v * k), ring: S.ring && S.ring.map((v) => v * k) }; };
  SHAPES.wankoBig = scaled("wanko", 1.35);

  // ---- Meeときょれじゃ の 景品（js/arcade-prizes.js の ぬいぐるみ・マスコット・コイン）----
  // 絵の はんい（viewBox）から art を きめる。xref・refY: 大きい ぬいぐるみの 絵で 形の 原点に あたる ところ・bottom: 足もと・k: cm / 絵の 1
  const HERO_ART = { wanko: { xref: 105, refY: 114.07, bottom: 207, k: 24.4 / 192 }, gachan: { xref: 100, refY: 122.16, bottom: 207, k: 20.6 / 172 }, goji: { xref: 106, refY: 123.4, bottom: 211, k: 31 / 186 } };
  const artOf = (it, H, k) => { const [x, y, w, h] = it.crop, u = H.k * k, cy = H.refY + ((it.feet || H.bottom) - H.bottom); return [(x + w / 2 - H.xref) * u, (cy - (y + h / 2)) * u, w * u, h * u]; };
  // がちゃんの からだ だけ（タグと リングを のぞく）
  const gachanBody = () => { const S = SHAPES.gachan(); return { ...S, parts: S.parts.slice(0, 9), ring: undefined }; };
  // 3人の ちいさな ぬいぐるみ（大きい ぬいぐるみの 0.6ばい。表情・ポーズ・こもの ごとに 絵が ちがう。物理の 形は 3人ごとに おなじ）
  for (const it of ArcadePrizes.ITEMS) if (it.size === "chibi") SHAPES[it.shape] = () => {
    const who = it.spec.who, S = who === "gachan" ? gachanBody() : SHAPES[who](), k = who === "goji" ? 0.52 : 0.6;
    return { ...S, parts: S.parts.map((a) => ({ x: a.x * k, y: a.y * k, z: a.z * k, r: a.r * k, m: a.m })), size: S.size.map((q) => q * k), look: it.look, art: artOf(it, HERO_ART[who], k), prize: it.id };
  };
  // ミニマスコット（スウィートランド。まるい かたまり。3人も 町の どうぶつも おなじ 形）
  for (const it of ArcadePrizes.ITEMS) if (it.size === "mini") SHAPES[it.shape] = () => {
    const [, , w, h] = it.crop, H = 7.2;
    return { parts: lattice(5.8, 6.2, 4.4, [2, 2, 2]), stiff: 0.9, fric: 0.6, look: it.look, art: [0, 0.4, (w / h) * H, H], size: [5.8, 6.2, 4.4], prize: it.id };
  };
  // 町の人の ぬいぐるみ（なかまごとに 台が ちがう）。ビッグ（2本アーム）: あたまが 大きい ごじの 形・どうぶつえん（トライポッド）: 大きい わんこと おなじ 形・
  // みずべ（リング）: がちゃんと おなじ 形。おなじ なかまは 物理が おなじで、絵は さいしょの 1しゅ（くま・パンダ・ぺんぎん）と おなじ ちぢみ（足もとを そろえる。うさぎの みみは うえに でる）
  const FOLK_ART = { big: { base: "goji", ref: "ike_plush_bear", H: () => 34, y: () => 1.2 }, zoo: { base: "wankoBig", ref: "ike_plush_panda", H: (S) => S.art[3] * 1.04, y: (S) => S.art[1] }, water: { base: "gachan", ref: "ike_plush_penguin", H: () => 20.2, y: () => -0.6 } };
  for (const it of ArcadePrizes.ITEMS) if (it.group) SHAPES[it.shape] = () => {
    const A = FOLK_ART[it.group], S = SHAPES[A.base](), [rx, ry, rw, rh] = ArcadePrizes.INDEX[A.ref].crop, u = A.H(S) / rh, [x, y, w, h] = it.crop;
    return { ...S, look: it.look, art: [(x + w / 2 - (rx + rw / 2)) * u, A.y(S) - (y + h / 2 - (ry + rh / 2)) * u, w * u, h * u], prize: it.id };
  };
  const prizePool = (ok) => ArcadePrizes.ITEMS.filter(ok).map((it) => it.shape);
  const heroPool = (who) => prizePool((it) => it.size === "chibi" && it.spec.who === who);
  // コイン メダル（まるい うすい えんばん: まん中＋まわり 6つ。おもて・うらは まるい 絵）と コインの たからばこ（クッキーの はこと おなじ 形＋リング）
  SHAPES.medal = () => ({ parts: [{ x: 0, y: 0, z: 0, r: 0.95, m: 1 }, ...Array.from({ length: 6 }, (_, i) => { const a = (i / 6) * Math.PI * 2; return { x: Math.cos(a) * 2.05, y: Math.sin(a) * 2.05, z: 0, r: 0.95, m: 1 }; })], stiff: 1, fric: 0.42, look: "medal", slab: [6, 6, 1.9], size: [6, 6, 1.9] });
  SHAPES.chest = () => ({ ...SHAPES.cookie(), look: "chest" });
  // ---- 2F の おかし（js/snack-art.js）。ふくろは やわらかい ひらたい 形（絵は まえ・うしろ・あつみ）、はこは かたい はこ、
  // リングの はこは クッキーの はこと おなじ 形（リングフックの ちょうせいを そのまま）、こつぶは ミニマスコットと おなじ 形 ----
  for (const it of SnackArt.ITEMS) {
    const [w, h, d] = it.size, look = "snack-" + it.key, prize = it.id;
    SHAPES["snack_" + it.key] = it.form === "bag" ? () => ({ parts: lattice(w, h, d, [3, 3, 2]), stiff: 0.5, fric: 0.72, look, slab: [w, h, d], size: [w, h, d], prize })
      : it.form === "big" ? () => ({ parts: lattice(w, h, d, [3, 4, 2]).map((a) => ({ ...a, m: 0.6 })), stiff: 0.42, fric: 0.8, look, slab: [w, h, d], size: [w, h, d], prize })
      : it.form === "box" ? () => ({ parts: lattice(w, h, d, [3, 2, 2]), stiff: 1, fric: 0.64, look, box: [w, h, d], size: [w, h, d], prize })
      : it.form === "ring" ? () => ({ ...SHAPES.cookie(), look, prize })
      : () => ({ parts: lattice(5.8, 6.2, 4.4, [2, 2, 2]), stiff: 0.9, fric: 0.6, look, art: [0, 0.3, 7, 7], size: [5.8, 6.2, 4.4], prize });
  }
  const snackPool = (form) => SnackArt.ITEMS.filter((it) => it.form === form).map((it) => "snack_" + it.key);
  // ---- 2F はしわたしの けいひん（js/bridge-prizes.js）。どれも 24×12×15cm の かたい はこ（まどつき）----
  for (const it of BridgePrizes.ITEMS) { const [w, h, d] = it.size; SHAPES["hashi_" + it.key] = () => ({ parts: lattice(w, h, d, [4, 3, 3]), stiff: 1, fric: 0.55, look: "hashi-" + it.key, box: [w, h, d], size: [w, h, d], prize: it.id }); }
  const hashiPool = (kind) => BridgePrizes.ITEMS.filter((it) => it.kind === kind).map((it) => "hashi_" + it.key);

  // ---- アーム（2本・3本。ツメの 先は ゴム）----
  class ClawRig {
    constructor(W, o) {
      Object.assign(this, { W, o, x: o.home.x, z: o.home.z, vx: 0, vz: 0, tvx: 0, tvz: 0, y: o.top, sx: 0, sz: 0, svx: 0, svz: 0, mode: "hold", power: 1, loose: 0 });
      this.th = o.yaws.map(() => o.rest); this.stall = o.yaws.map(() => 0); this.base = o.yaws.map(() => o.rest);
      this.head = W.collider({ k: "sphere", c: [this.x, this.y, this.z], r: o.headR, move: true, fr: 0.4 });
      this.segs = o.yaws.map(() => o.segs.map((s) => W.collider({ k: "cap", a: [0, 0, 0], b: [0, 0, 0], r: s.r, move: true, fr: s.fr || 0.6, grip: s.grip || 1 })));
      this.place(); for (const c of this.all()) W.save(c);
    }
    all() { return [this.head, ...this.segs.flat()]; }
    hub() { return [this.x + this.sx, this.y, this.z + this.sz]; }
    // うでの ふし（ねもと → ひじ → ツメ）
    joints(k) {
      const o = this.o, [hx, hy, hz] = this.hub(), yaw = o.yaws[k] * D2R, ux = Math.cos(yaw), uz = Math.sin(yaw);
      let p = [hx + ux * o.pivot, hy - o.drop, hz + uz * o.pivot], ang = this.th[k];
      const out = [p];
      for (const s of o.segs) { ang -= (s.bend || 0) * D2R; const q = [p[0] + ux * Math.sin(ang) * s.len, p[1] - Math.cos(ang) * s.len, p[2] + uz * Math.sin(ang) * s.len]; out.push(q); p = q; }
      return out;
    }
    place() {
      this.head.c = this.hub();
      for (let k = 0; k < this.segs.length; k++) { const j = this.joints(k); this.segs[k].forEach((c, i) => { c.a = j[i]; c.b = j[i + 1]; }); }
    }
    push() { return this.all().reduce((s, c) => s + c.push, 0); }
    tipY() { let m = Infinity; for (let k = 0; k < this.segs.length; k++) { const j = this.joints(k); for (const p of j) m = Math.min(m, p[1]); } return m - this.o.segs[this.o.segs.length - 1].r; }
    step(h) {
      const o = this.o, A = o.accel * h;
      const ovx = this.vx, ovz = this.vz;
      this.vx += clamp(this.tvx - this.vx, -A, A); this.vz += clamp(this.tvz - this.vz, -A, A);
      let nx = this.x + this.vx * h, nz = this.z + this.vz * h;
      if (nx < o.lim[0]) { nx = o.lim[0]; this.vx = 0; } if (nx > o.lim[1]) { nx = o.lim[1]; this.vx = 0; }
      if (nz < o.lim[2]) { nz = o.lim[2]; this.vz = 0; } if (nz > o.lim[3]) { nz = o.lim[3]; this.vz = 0; }
      this.x = nx; this.z = nz;
      // ふりこ（ケーブルで つるされた あたま）。くるまが 止まると ゆれる
      const L = Math.max(12, o.cable + o.top - this.y), w2 = CP.GRAV / L, ax = (this.vx - ovx) / h, az = (this.vz - ovz) / h, c = o.swingDamp;
      this.svx += (-w2 * this.sx - ax - c * this.svx) * h; this.svz += (-w2 * this.sz - az - c * this.svz) * h;
      this.sx = clamp(this.sx + this.svx * h, -5, 5); this.sz = clamp(this.sz + this.svz * h, -5, 5);
      if (this.head.push > 0.4) { this.svx *= 0.9; this.svz *= 0.9; } // なにかに のって いると ゆれが へる
      for (let k = 0; k < this.th.length; k++) {
        const push = this.segs[k].reduce((s, c) => s + c.push, 0);
        if (this.mode === "open") this.th[k] = Math.min(o.open, this.th[k] + o.wOpen * h);
        else if (this.mode === "release") this.th[k] = Math.min(o.release || o.open, this.th[k] + o.wOpen * h);
        else if (this.mode === "close") { if (push < this.power * o.force) this.th[k] = Math.max(o.closed, this.th[k] - o.wClose * h); else this.stall[k] += h; this.base[k] = this.th[k]; }
        else if (this.mode === "loose") this.th[k] = Math.min(this.base[k] + this.loose, this.th[k] + o.wOpen * 0.5 * h);
        else if (this.mode === "rest") this.th[k] += clamp(o.rest - this.th[k], -o.wOpen * h, o.wOpen * h);
      }
      // はなす ときは ツメが すべる（ゴムに ひっかかって のこらない）。フックは かたむいて リングが ぬける
      const slip = this.mode === "release";
      if (slip !== this.slipping) {
        this.slipping = slip;
        this.segs.forEach((arm) => arm.forEach((c, i) => { c.fr = slip ? 0.08 : o.segs[i].fr || 0.6; c.grip = slip ? 1 : o.segs[i].grip || 1; c.off = !!(slip && o.hookFree && i >= 1); }));
        this.head.fr = slip ? 0.05 : 0.4;
      }
      this.place();
    }
    // セーブ（うごきの とちゅうは のこさない）
    save() { return { x: +this.x.toFixed(2), z: +this.z.toFixed(2) }; }
    load(s) { if (s) { this.x = clamp(s.x, this.o.lim[0], this.o.lim[1]); this.z = clamp(s.z, this.o.lim[2], this.o.lim[3]); } this.place(); for (const c of this.all()) this.W.save(c); }
  }

  // ---- トライポッド（あなの まわりの ランプを とめると、その アームが おちる）----
  class TrypodRig {
    constructor(W, o) {
      Object.assign(this, { W, o, light: 0, run: true, flash: 0 });
      this.arms = Array.from({ length: o.n }, (_, k) => ({ yaw: o.a0 + (k * 360) / o.n, up: true, drop: 0, c: W.collider({ k: "cap", a: [0, 0, 0], b: [0, 0, 0], r: o.armR, move: true, fr: 0.55 }) }));
      this.place(); for (const a of this.arms) W.save(a.c);
    }
    place() {
      const o = this.o;
      for (const a of this.arms) {
        const yaw = a.yaw * D2R, ux = Math.cos(yaw), uz = Math.sin(yaw), fall = ease(a.drop) * 82 * D2R, len = o.out - o.in;
        a.c.a = [o.cx + ux * o.out, o.y, o.cz + uz * o.out];
        a.c.b = [a.c.a[0] - ux * Math.cos(fall) * len, o.y - Math.sin(fall) * len, a.c.a[2] - uz * Math.cos(fall) * len];
      }
    }
    cells() { return this.o.n * this.o.per; }
    cell() { return Math.floor(this.light) % this.cells(); }
    armAt(cell) { return cell % this.o.per === 0 ? this.arms[cell / this.o.per] : null; }
    step(h) {
      if (this.run) this.light = (this.light + this.o.speed * h) % this.cells();
      for (const a of this.arms) if (!a.up && a.drop < 1) a.drop = Math.min(1, a.drop + h / 0.32);
      if (this.flash > 0) this.flash -= h;
      this.place();
    }
    save() { return { up: this.arms.map((a) => (a.up ? 1 : 0)).join("") }; }
    load(s) { if (s && typeof s.up === "string") this.arms.forEach((a, k) => { a.up = s.up[k] !== "0"; a.drop = a.up ? 0 : 1; }); this.place(); for (const a of this.arms) this.W.save(a.c); }
  }

  // ---- スウィートランド（まわる 台・ショベル・おしだす 台）----
  class SweetRig {
    constructor(W, o) {
      Object.assign(this, { W, o, ang: 0, pusherT: 0, sx: o.cx + Math.cos(o.arc[0]) * o.arcR, sy: o.idleY, sz: o.cz + Math.sin(o.arc[0]) * o.arcR, yaw: 0, tilt: 0, mode: "swing", swingT: 0, pz: o.push[0] });
      this.disk = W.collider({ k: "disk", c: [o.cx, o.top, o.cz], rad: o.rad, h: 3, ang: 0, move: true, fr: 0.9 });
      this.fence = W.collider({ k: "cyl", cx: o.cx, cz: o.cz, rad: o.rad + 0.6, y0: o.top - 2, y1: o.top + 6.5, inside: true, fr: 0.3, spin: this.disk });
      this.hubC = W.collider({ k: "cyl", cx: o.cx, cz: o.cz, rad: 4.5, y0: o.top - 2, y1: o.top + 14, fr: 0.3, spin: this.disk });
      // ショベル（そこ・うしろ・よこ 2まい）
      const S = o.scoop;
      this.parts = [
        { l: [0, 0, 0], h: [S.w / 2, 0.45, S.d / 2] }, { l: [0, S.wall / 2, S.d / 2], h: [S.w / 2, S.wall / 2, 0.45] },
        { l: [-S.w / 2, S.wall / 2 - 0.5, 0], h: [0.45, S.wall / 2, S.d / 2] }, { l: [S.w / 2, S.wall / 2 - 0.5, 0], h: [0.45, S.wall / 2, S.d / 2] },
      ].map((p) => ({ ...p, c: W.collider({ k: "box", c: [0, 0, 0], h: p.h, move: true, fr: 0.5 }) }));
      this.pusher = W.collider({ k: "box", c: [0, 0, 0], h: [o.stage.w / 2, 3.2, o.pdepth / 2], move: true, fr: 0.35 });
      this.place(); for (const c of [this.disk, ...this.parts.map((p) => p.c), this.pusher]) W.save(c);
    }
    place() {
      const o = this.o, R = CP.rotYXZ(this.yaw, this.tilt, 0);
      for (const p of this.parts) {
        const l = p.l, w = [R[0][0] * l[0] + R[1][0] * l[1] + R[2][0] * l[2], R[0][1] * l[0] + R[1][1] * l[1] + R[2][1] * l[2], R[0][2] * l[0] + R[1][2] * l[1] + R[2][2] * l[2]];
        p.c.c = [this.sx + w[0], this.sy + w[1], this.sz + w[2]]; p.c.R = R;
      }
      this.disk.ang = this.ang;
      this.pusher.c = [o.stage.cx, o.stage.top + 3.2, this.pz + o.pdepth / 2];
    }
    step(h) {
      const o = this.o;
      this.ang += o.spin * h;
      this.pusherT += h; this.pz = mix(o.push[0], o.push[1], 0.5 - 0.5 * Math.cos((this.pusherT * 2 * Math.PI) / o.period));
      // ショベルは まわる 台の みぎの ふちを 弧を えがいて いったり きたり（まえから よく みえる）→ すくったら ステージの 上を よこに
      if (this.mode === "swing" || this.mode === "swing2") {
        this.swingT += h; const s = 0.5 - 0.5 * Math.cos((this.swingT * 2 * Math.PI) / o.swingPeriod);
        if (this.mode === "swing") { const a = mix(o.arc[0], o.arc[1], s); this.sx = o.cx + Math.cos(a) * o.arcR; this.sz = o.cz + Math.sin(a) * o.arcR; }
        else this.sx = mix(o.swing2[0], o.swing2[1], s);
      }
      this.place();
    }
    // ながれに 向かって あける（まわる 台の その 場所の うごき）
    flowYaw() { const dx = this.sx - this.o.cx, dz = this.sz - this.o.cz, vx = -dz * this.o.spin, vz = dx * this.o.spin; return Math.atan2(vx, vz); }
    save() { return { a: +(this.ang % (Math.PI * 2)).toFixed(3), p: +this.pusherT.toFixed(2) }; }
    load(s) { if (s) { this.ang = s.a || 0; this.pusherT = s.p || 0; this.pz = mix(this.o.push[0], this.o.push[1], 0.5 - 0.5 * Math.cos((this.pusherT * 2 * Math.PI) / this.o.period)); } this.place(); for (const c of [this.disk, ...this.parts.map((p) => p.c), this.pusher]) this.W.save(c); }
  }

  // ---- コイン プッシャー（いったり きたり する おしだし台・うえの かべ・メダルを いれる ランチャー・チャンスの リング）----
  // ほんものの プッシャーと おなじ: フィールドには はじめから メダルが たくさん。いれた メダルが おしだし台の うえに おちて、かべに おされて フィールドへ。
  // てまえの ふちから おちた メダルは もらえる・よこの あなに おちた メダルは おみせの もの。
  class PusherRig {
    constructor(W, o) {
      Object.assign(this, { W, o, pt: 0, gt: 0, lx: (o.lim[0] + o.lim[1]) / 2, lv: 0, tv: 0, hold: false });
      this.pusher = W.collider({ k: "box", c: [0, 0, 0], h: [o.pw / 2, o.ph / 2, o.pd / 2], move: true, fr: 0.4 });
      this.place(); W.save(this.pusher);
    }
    // おしだし台の まえの ふち（pt = 0 は いちばん うしろ）
    front() { const o = this.o; return mix(o.push[0], o.push[1], 0.5 + 0.5 * Math.cos((this.pt * 2 * Math.PI) / o.period)); }
    // チャンスの リング（おなじ はやさで いったり きたり）
    gateX() { const o = this.o, k = (this.gt / o.gatePeriod) % 1; return mix(o.gate[0], o.gate[1], k < 0.5 ? k * 2 : 2 - k * 2); }
    place() { const o = this.o; this.pusher.c = [o.cx, o.top + o.ph / 2, this.front() + o.pd / 2]; }
    step(h) {
      const o = this.o;
      if (!this.hold) { this.pt += h; this.gt += h; }
      // ランチャー（やじるしで よこに うごく）
      this.lv += clamp(this.tv - this.lv, -o.lacc * h, o.lacc * h);
      const nx = clamp(this.lx + this.lv * h, o.lim[0], o.lim[1]); if (nx !== this.lx + this.lv * h) this.lv = 0; this.lx = nx;
      this.place();
    }
    save() { return { p: +(this.pt % this.o.period).toFixed(3), g: +(this.gt % this.o.gatePeriod).toFixed(3), x: +this.lx.toFixed(2) }; }
    load(s) { if (s) { this.pt = +s.p || 0; this.gt = +s.g || 0; this.lx = clamp(Number.isFinite(+s.x) ? +s.x : this.lx, this.o.lim[0], this.o.lim[1]); } this.place(); this.W.save(this.pusher); }
  }

  // ---- 台の かたち（ゆか・おとしぐち・ガード）----
  const floorWithChute = (W, M, ch) => {
    // ゆかは 厚い 板を あなの まわりに ならべる
    const t = 4, add = (x0, x1, z0, z1) => { if (x1 - x0 > 0.1 && z1 - z0 > 0.1) W.collider({ k: "box", c: [(x0 + x1) / 2, -t / 2, (z0 + z1) / 2], h: [(x1 - x0) / 2, t / 2, (z1 - z0) / 2], fr: 0.62 }); };
    add(0, M.w, ch.z1, M.d); add(0, ch.x0, 0, ch.z1); add(ch.x1, M.w, 0, ch.z1);
    if (ch.z0 > 0) add(ch.x0, ch.x1, 0, ch.z0);
    // ガード（とうめいの いた）
    for (const g of ch.guards || []) W.collider({ k: "box", c: g.c, h: g.h, fr: 0.3 });
  };

  // ---- アーム（3本・2本・リングの フック）----
  const CLAW3 = { yaws: [90, 210, 330], pivot: 3.1, drop: 2.6, segs: [{ len: 10.5, r: 0.75, fr: 0.5 }, { len: 5.2, bend: 45, r: 0.85, fr: 0.9, grip: 1.6 }], rest: -2 * D2R, open: 41 * D2R, release: 62 * D2R, closed: -2 * D2R, wOpen: 1.6, wClose: 1.05, force: 2.2, headR: 4.4, accel: 70, swingDamp: 1.3, cable: 8 };
  const CLAW2 = { yaws: [0, 180], pivot: 4, drop: 3, segs: [{ len: 22, r: 1, fr: 0.5 }, { len: 6.5, bend: 50, r: 1.05, fr: 0.9, grip: 1.6 }], rest: 0, open: 48 * D2R, release: 64 * D2R, closed: 0, wOpen: 1.2, wClose: 0.75, force: 3.2, headR: 5.4, accel: 60, swingDamp: 1.2, cable: 9 };
  // フックづめ: よこむきの フック（7cm）が リングの あなに はいる。ねもとは 外がわ（リングの まえで とまる）
  const HOOK2 = { yaws: [90, 270], pivot: 5, drop: 2.5, segs: [{ len: 10, r: 0.6, fr: 0.5 }, { len: 7, bend: 80, r: 0.5, fr: 0.8, grip: 1.3 }, { len: 2.2, bend: 100, r: 0.45, fr: 0.8 }], rest: -3 * D2R, open: 38 * D2R, release: 60 * D2R, closed: -3 * D2R, wOpen: 1.5, wClose: 1.0, force: 1.4, headR: 3.8, accel: 70, swingDamp: 1.1, cable: 8, hookFree: true };
  // 12台（番号は PrizeArcade.machines と 館の 什器 machine と おなじ）。id が かわった 台の ふるい セーブ（台の ようす）は つかわない。
  // legacy: まえの 8台の ときと おなじ 台（1・4・6）。ふるい セーブの 台の ようす・とちゅうの 1かいを そのまま つかう
  const CHUTE_CLAW3 = { x0: 0, x1: 17, z0: 0, z1: 17, guards: [{ c: [17.4, 3.5, 8.5], h: [0.4, 3.5, 8.5] }, { c: [8.7, 3.5, 17.4], h: [8.7, 3.5, 0.4] }] };
  const CHUTE_CLAW2 = { x0: 11, x1: 45, z0: 0, z1: 21, guards: [{ c: [10.6, 2, 10.5], h: [0.4, 2, 10.5] }, { c: [45.4, 2, 10.5], h: [0.4, 2, 10.5] }, { c: [28, 1.4, 21.4], h: [17.4, 1.4, 0.4] }] };
  const CHUTE_RING = { x0: 0, x1: 17, z0: 0, z1: 16, guards: [{ c: [17.4, 3, 8], h: [0.4, 3, 8] }, { c: [8.7, 3, 16.4], h: [8.7, 3, 0.4] }] };
  const claw3 = (id, theme, who) => ({ id, type: "claw", theme, rig: CLAW3, box: { w: 60, d: 48, h: 64 }, chute: CHUTE_CLAW3, home: { x: 8.5, z: 8.5 }, top: 50, minY: 14, moveTime: 30,
    fill: { mix: [0, 1, 2, 3].map((v) => `chibi_${who}_${v}`), n: 12, keep: 9, area: [21, 57, 4, 45] }, got: "win" });
  const claw2 = (id, theme, shape, extra = {}) => ({ id, type: "claw", theme, rig: CLAW2, box: { w: 56, d: 50, h: 76 }, chute: CHUTE_CLAW2, home: { x: 28, z: 10 }, top: 60, minY: 16, moveTime: 30,
    fill: { shape, n: 1, keep: 1, upright: true, at: [[31, 34, 0.35]] }, got: "win", ...extra });
  const ring = (id, theme, fill, minY, extra = {}) => ({ id, type: "ring", theme, rig: HOOK2, box: { w: 60, d: 48, h: 62 }, chute: CHUTE_RING, home: { x: 8.5, z: 8 }, top: 50, minY, moveTime: 30, fill, got: "win", ...extra });
  const sweet = (id, theme, pieces) => ({ id, type: "sweet", theme, box: { w: 64, d: 62, h: 66 }, sweet: pieces, got: "piece", sub: 3 });
  const tripod = (id, theme, prize, extra = {}) => ({ id, type: "tripod", theme, box: { w: 60, d: 56, h: 52 }, prize, got: "win", ...extra });
  // はしわたし（橋渡し）: てまえ → おくに のびる 2本の ぼう（はし）の うえに はこの けいひん。ぼうの あいだ（はしはば）から したに おちれば とれる。
  // 2本アームで はさむと、はこは アームの まんなかへ よる。すこしずつ ずらして、はこの はしを ぼうから おとす。
  // bars: x0・x1 = 2本の ぼうの まんなか・y = たかさ・r = ふとさ・z0〜z1 = ながさ・fr = すべりにくさ（ゴムの チューブは すべりにくい）
  // アームは 2本アーム。もちあげて 3cm で ゆるむ（slip）ので はこごと はこべない（はこは ぼうの そとには おちない。もし おちたら おみせの 人が もどす）。
  // アームの まちいち（home）は ひだりの てまえ（はこが かくれない）
  const bridge = (id, theme, shape, bars, extra = {}) => {
    const M = { w: 60, d: 50, h: 72 }, cx = (bars.x0 + bars.x1) / 2;
    return { id, type: "bridge", theme, rig: CLAW2, box: M, bars, keep: true, slip: { after: 3, open: 14 }, chute: { x0: bars.x0, x1: bars.x1, z0: 0, z1: M.d },
      home: { x: 9, z: 9 }, top: 62, minY: 12, moveTime: 30, fill: { shape, n: 1, keep: 1, upright: true, onBars: true, at: [[cx, 27, 0]] }, got: "win", ...extra };
  };
  // コイン プッシャー: フィールド（x0〜x1・てまえの ふち ze・たかさ top）。よこの あなは てまえから open cm。wipe: うえの かべの まえ。
  // drop: ランチャーの メダルが でる ところ（z・たかさ）・lim: ランチャーの はんい・gate: リングの はんい（gateY の たかさ・gateR より ちかいと とおった）
  // medals: 1かいの メダル・fill: はじめの メダル・keep: これより へったら おみせの 人が たす・bonus: スロットの メダル
  const pusher = (id, theme) => ({ id, type: "pusher", theme, box: { w: 60, d: 56, h: 50 }, cam: { eyeY: 1.45, dist: 0.95 }, got: "piece", sub: 3,
    field: { x0: 7, x1: 53, ze: 10, top: 12, open: 18, wipe: 40, push: [26, 36], period: 3, drop: [36.5, 27], lim: [11, 49], gate: [13, 47], gateY: 24, gateR: 2.4, gatePeriod: 3, medals: 10, fill: 42, keep: 28, cool: 0.3, watch: 6, bonus: { big: 4, small: 1 } } });
  // 日がわりの 台: pool（かたちの なまえ）から その日の pick しゅ（lineup）
  const daily = (d, pool, pick) => ({ ...d, pool, pick, ...(d.fill ? { fill: { ...d.fill, ...(d.fill.mix ? { mix: pool.slice(0, pick) } : {}) } } : {}) });
  const DEFS = [
    // ---- 1F（日がわり 7台: 3人の ぬいぐるみ 8しゅから 4しゅ・ミニマスコット 10しゅから 3しゅ・どうぶつえん 6しゅから 1しゅ・ビッグ ぬいぐるみ 9しゅから 1しゅ・
    // みずべの なかま 5しゅから 3しゅ。legacy の 3台と コインの 2台は いつも おなじ）----
    daily(claw3("chibi-wanko", "paw", "wanko"), heroPool("wanko"), 4),
    claw2("goji-big", "goji", "goji", { legacy: true }),
    daily(sweet("mini", "candy", ["mini_wanko", "mini_gachan", "mini_goji"]), prizePool((it) => it.size === "mini"), 3),
    pusher("pusher", "gold"),
    tripod("wanko-big", "wanko", "wankoBig", { legacy: true }),
    daily(tripod("panda-big", "bamboo", "pandaBig", { keep: true }), prizePool((it) => it.group === "zoo"), 1),
    ring("gachan-ring", "chick", { shape: "gachan", n: 3, keep: 3, upright: true, gap: 15, at: [[30, 22, 0.25], [45, 29, -0.3], [29, 38, 0.1], [44, 40, 0.2]] }, 39, { legacy: true }),
    ring("coin-chest", "treasure", { shape: "chest", n: 4, keep: 4, upright: true, gap: 13, at: [[30, 20, 0.1], [48, 22, -0.15], [30, 35, -0.1], [47, 37, 0.12]] }, 26.7),
    daily(claw3("chibi-gachan", "sunny", "gachan"), heroPool("gachan"), 4),
    daily(claw3("chibi-goji", "jungle", "goji"), heroPool("goji"), 4),
    daily(claw2("bear-big", "forest", "bearBig"), prizePool((it) => it.group === "big"), 1),
    daily(ring("penguin-ring", "snow", { shape: "penguinRing", n: 3, keep: 3, upright: true, gap: 15, at: [[30, 22, 0.25], [45, 29, -0.3], [29, 38, 0.1], [44, 40, 0.2]] }, 39), prizePool((it) => it.group === "water"), 3),
    // ---- 2F おかし キャッチャー（日がわり: pool から pick しゅ）----
    daily(claw3("snack-bag", "snackbag", "wanko"), snackPool("bag"), 3),
    daily(claw3("snack-box", "snackbox", "wanko"), snackPool("box"), 3),
    daily(ring("snack-ring", "snackring", { shape: snackPool("ring")[0], n: 4, keep: 4, upright: true, gap: 13, at: [[30, 20, 0.1], [48, 22, -0.15], [30, 35, -0.1], [47, 37, 0.12]] }, 26.7), snackPool("ring"), 2),
    daily(sweet("snack-sweet", "sweetsnack", snackPool("piece").slice(0, 3)), snackPool("piece"), 3),
    daily(claw2("snack-big", "chips", snackPool("big")[0]), snackPool("big"), 1),
    // ---- 2F はしわたし（日がわり: その日の はこ 1しゅ）。フィギュアは ぎんの ぼう・ざっかは ゴムの チューブを まいた ぼう ----
    // assistAim: おみせの 人が なおした あと ねらう ところ（はこの まん中から みぎへ cm）
    daily(bridge("hashi-fig", "hashi", hashiPool("fig")[0], { x0: 21.95, x1: 38.05, y: 14, r: 1.3, z0: 5, z1: 45, fr: 0.4 }, { assistAim: 3 }), hashiPool("fig"), 1),
    daily(bridge("hashi-goods", "hashigum", hashiPool("goods")[0], { x0: 21.95, x1: 38.05, y: 14, r: 1.5, z0: 5, z1: 45, fr: 0.8, rubber: true }, { assistAim: 2.5 }), hashiPool("goods"), 1),
  ];

  // ---- 1かいの あそび ----
  class CraneRound {
    // i: 台の 番号・board: セーブされた 台の ようす（なければ はじめから）・luck: アームが つよいか
    constructor(i, board, o = {}) {
      // たねは 台と その ようすで きまる（おなじ 台・おなじ そうさ → おなじ けっか。テストでも くりかえせる）
      this.i = i; this.def = DEFS[i]; this.type = this.def.type;
      // 日がわりの 台: とちゅうの 1かいは はじめた 日の ならびの まま（o.cp.day）・そのほかは きょう（o.day は テスト用）。
      // keep の 台は まえの 日の けいひんが のこって いれば その日の ならび（keepDay）
      this.day = o.cp && o.cp.day ? o.cp.day : keepDay(this.def, board, o.day || today()); this.mix = lineup(this.def, this.day);
      // ほかの 台の ようす（台の いれかえの まえの セーブ）は つかわない。legacy の 台は id の ない ふるい ようすも つかう。日がわりの 台は きょうの ようすだけ
      const fits = (b) => b && (b.id ? b.id === this.def.id && (!this.def.pool || b.day === this.day) : !!this.def.legacy);
      if (!fits(board)) board = null; if (o.cp && !fits(o.cp.board)) o = { ...o, cp: null };
      this.seed = o.seed != null ? o.seed : o.cp && o.cp.seed != null ? o.cp.seed : 1234 + i * 77 + ((board && board.n) || 0) * 7919 + (this.mix ? (dayNum(this.day) % 1000) * 31 : 0);
      this.rand = rng(this.seed); this.strong = o.strong != null ? !!o.strong : true; this.t = 0; this.pt = 0; this.phase = "move"; this.done = false;
      this.got = []; this.gotShapes = []; this.events = []; this.acc = 0; this.frames = 0; this.presses = 0; this.msg = "";
      this.build(board);
      const staff = this.def.bars && !o.cp ? (this.tidyBars() ? "back" : o.assist && this.assist() ? "assist" : null) : null;
      if (clawy(this.type)) { this.time = this.def.moveTime; this.rig.power = this.strong || this.type !== "claw" ? 1 : 0.34; }
      if (this.type === "tripod") { this.phase = "spin"; this.stops = 3; }
      if (this.type === "sweet") { this.phase = "swing"; this.scoops = 3; }
      if (this.type === "pusher") Object.assign(this, { phase: "play", left: this.field.medals, lost: 0, shower: 0, showerT: 0, slot: null, queue: 0, cool: 0, idle: 0, hits: 0 });
      this.events.length = 0; this.staff = staff; if (staff) this.events.push({ e: "staff", what: staff });
      if (o.cp) this.resume(o.cp);
    }
    // 台を つくる（ゆか・かべ・しかけ・景品）
    build(board) {
      const d = this.def, M = d.box, W = (this.W = new CP.World({ bounds: { x0: 0, x1: M.w, z0: 0, z1: M.d, y1: M.h }, outY: -12, sub: d.sub || 4 })); this.sid = (board && board.n) || 1; this.bodies = [];
      if (clawy(d.type)) {
        floorWithChute(W, M, d.chute);
        if (d.bars) for (const x of [d.bars.x0, d.bars.x1]) W.collider({ k: "cap", a: [x, d.bars.y, d.bars.z0], b: [x, d.bars.y, d.bars.z1], r: d.bars.r, fr: d.bars.fr });
        this.rig = new ClawRig(W, { ...d.rig, home: d.home, top: d.top, lim: [6, M.w - 6, Math.min(d.home.z, 8), M.d - 6] });
        this.rig.load(null);
      } else if (d.type === "tripod") {
        W.collider({ k: "holefloor", y: 0, cx: M.w / 2, cz: M.d / 2 + 2, rad: 17.5, th: 3, fr: 0.6 });
        W.collider({ k: "cyl", cx: M.w / 2, cz: M.d / 2 + 2, rad: 17.5, y0: -40, y1: -0.5, inside: true, fr: 0.2 });
        this.rig = new TrypodRig(W, { cx: M.w / 2, cz: M.d / 2 + 2, in: 6.5, out: 20.5, y: 1.4, armR: 1.25, n: 6, per: 2, a0: 90, speed: 5.5, hole: 17.5 });
      } else if (d.type === "pusher") {
        // フィールド（あつい いた）・よこの かべ（てまえの open cm は よこの あな）・うえの かべ（おしだし台の うえの メダルを フィールドへ おとす）
        const F = (this.field = d.field), zw = F.ze + F.open, cx = (F.x0 + F.x1) / 2;
        W.collider({ k: "box", c: [cx, F.top - 1.5, (F.ze + M.d) / 2], h: [(F.x1 - F.x0) / 2, 1.5, (M.d - F.ze) / 2], fr: 0.3 });
        for (const x of [F.x0 - 0.4, F.x1 + 0.4]) W.collider({ k: "box", c: [x, F.top + 6, (zw + M.d) / 2], h: [0.4, 6, (M.d - zw) / 2], fr: 0.3 });
        W.collider({ k: "box", c: [cx, F.top + 4.4 + 9, (F.wipe + M.d) / 2], h: [(F.x1 - F.x0) / 2, 9, (M.d - F.wipe) / 2], fr: 0.3 });
        this.rig = new PusherRig(W, { cx, top: F.top, pw: F.x1 - F.x0 - 0.4, ph: 4, pd: 30, push: F.push, period: F.period, gate: F.gate, gatePeriod: F.gatePeriod, lim: F.lim, lacc: 160 });
      } else {
        // ゆか（まえの 14cm は とりだしぐちへの あな。ガラスと ステージの あいだに おかしが はさまらない ひろさ）
        W.collider({ k: "box", c: [M.w / 2, -2, (14 + M.d) / 2], h: [M.w / 2, 2, (M.d - 14) / 2], fr: 0.6 });
        const st = { cx: 32, w: 48, z0: 14, z1: 40, top: 30 };
        W.collider({ k: "box", c: [st.cx, st.top - 1.5, (st.z0 + st.z1) / 2], h: [st.w / 2, 1.5, (st.z1 - st.z0) / 2], fr: 0.28 });
        // ステージの よこの かべ・うしろの かべ（おかしは まえからだけ おちる）
        W.collider({ k: "box", c: [st.cx - st.w / 2 - 0.4, st.top + 6, (st.z0 + st.z1) / 2], h: [0.4, 6, (st.z1 - st.z0) / 2], fr: 0.3 });
        W.collider({ k: "box", c: [st.cx + st.w / 2 + 0.4, st.top + 6, (st.z0 + st.z1) / 2], h: [0.4, 6, (st.z1 - st.z0) / 2], fr: 0.3 });
        W.collider({ k: "box", c: [st.cx, st.top + 6, st.z1 + 0.4], h: [st.w / 2 + 0.8, 6, 0.4], fr: 0.3 });
        this.stage = st;
        this.rig = new SweetRig(W, { cx: 32, cz: 44, rad: 16.5, top: 4, spin: 0.42, arc: [-62 * D2R, 62 * D2R], arcR: 10.5, swing2: [14, 50], swingPeriod: 3.6, idleY: 13, dumpZ: 19.5, dumpY: 47, stage: st, pdepth: 12, push: [23, 32], period: 2.3, scoop: { w: 12, d: 9, wall: 5.5 } });
      }
      W.pre = (h) => this.rig.step(h);
      // トライポッドは けいひんが とれた あと（台に けいひんが ない）なら、おみせの 人が アームを ぜんぶ もどして あたらしい けいひんを のせる
      const empty = !(board && Array.isArray(board.b) && board.b.length);
      if (board && board.s && !(d.type === "tripod" && empty)) this.rig.load(board.s);
      if (board && Array.isArray(board.b) && board.b.length) { this.restore(board); if (d.type === "sweet") this.refillTable(); else if (d.type === "pusher") this.refillField(); else if (d.type !== "tripod") { if (this.refill(false)) this.settle(2.5); } }
      else this.fresh();
    }
    // 景品を ひとつ おく（p: 位置・q: 向き）
    add(shape, p, q, extra = {}) {
      const S = SHAPES[shape](), R = CP.qmat(q);
      let mx = 0, my = 0, mz = 0, mm = 0; for (const a of S.parts) { mx += a.x * a.m; my += a.y * a.m; mz += a.z * a.m; mm += a.m; }
      const parts = S.parts.map((a) => ({ x: p[0] + R[0][0] * a.x + R[1][0] * a.y + R[2][0] * a.z, y: p[1] + R[0][1] * a.x + R[1][1] * a.y + R[2][1] * a.z, z: p[2] + R[0][2] * a.x + R[1][2] * a.y + R[2][2] * a.z, r: a.r, m: a.m }));
      // org: まん中（おもさの 中心）から 形の 原点への ずれ（ローカル）。絵を かさねる ときに つかう
      const b = this.W.body({ parts, stiff: S.stiff, fric: S.fric, q, data: { sid: extra.sid || this.sid++, shape, look: S.look, box: S.box, ring: S.ring, slab: S.slab, art: S.art, size: S.size, org: [-mx / mm, -my / mm, -mz / mm], ...extra } });
      // q で 回した ぶん rest は もとに もどって いる（world.body が 回転を とりのぞく）
      this.bodies.push(b); return b;
    }
    // まぜて おく 景品（ぬいぐるみの 表情・ミニマスコット）から 1つ（きまった たねの 乱数）
    pick(list) { return Array.isArray(list) ? list[Math.floor(this.rand() * list.length) % list.length] : list; }
    randQ(upright) {
      const r = this.rand;
      if (upright) return CP.qaxis(0, 1, 0, (r() - 0.5) * 0.9);
      return CP.qnorm(CP.qmul(CP.qaxis(0, 1, 0, r() * Math.PI * 2), CP.qaxis(1, 0, 0, (0.5 + (r() - 0.5) * 0.6) * Math.PI)));
    }
    fresh() {
      const d = this.def, r = this.rand;
      if (clawy(d.type)) this.refill(true);
      else if (d.type === "tripod") this.placeTripodPrize();
      else if (d.type === "pusher") {
        // フィールドに ならべる（1だんめ 4れつ×7・のこりは その うえ）
        const F = this.field, cols = 7, rows = 4, x0 = F.x0 + 3.6, dx = (F.x1 - F.x0 - 7.2) / (cols - 1), z0 = F.ze + 6.5, dz = (F.push[1] - 3 - z0) / (rows - 1);
        for (let k = 0; k < F.fill; k++) {
          const top = k >= cols * rows, i = k % cols, j = Math.floor(k / cols) % rows;
          const x = top ? mix(F.x0 + 4, F.x1 - 4, r()) : x0 + i * dx + (r() - 0.5) * 1.2, z = top ? mix(F.ze + 5, F.push[1] - 4, r()) : z0 + j * dz + (r() - 0.5) * 1.2;
          this.add("medal", [x, F.top + (top ? 3.4 + (k % 3) * 2 : 1.05), z], this.flat());
        }
      } else {
        // まわる 台の 上に 20こ・おしだし台に 12こ
        const o = this.rig.o, st = this.stage;
        for (let k = 0; k < 20; k++) { const a = (k / 20) * Math.PI * 2 * 3 + r() * 0.4, rr = 7.5 + ((k * 7) % 5) * 1.2; this.add(this.pick(this.mix || d.sweet), [o.cx + Math.cos(a) * rr, o.top + 2 + Math.floor(k / 7) * 3, o.cz + Math.sin(a) * rr], CP.qaxis(0, 1, 0, -a + (r() - 0.5) * 0.5)); }
        for (let k = 0; k < 12; k++) this.add(this.pick(this.mix || d.sweet), [st.cx - st.w / 2 + 7 + ((k % 4) + 0.3 + r() * 0.4) * (st.w - 14) / 4, st.top + 2 + (k % 2) * 2.5, st.z0 + 4 + Math.floor(k / 4) * 3.2 + r() * 1.2], CP.qaxis(0, 1, 0, (r() - 0.5) * 0.5));
      }
      this.settle(d.type === "pusher" ? 1.5 : 3);
      if (d.type === "pusher") this.prime();
    }
    // プッシャーの じゅんび（おみせの 人が おしだし台を 1かい うごかして、ふちに のった メダルを おとして おく）。はじめの 1かいで ただで おちない
    prime() {
      const F = this.field;
      for (let i = 0; i < Math.round(60 * F.period); i++) this.W.step(DT);
      for (const b of this.list()) if (this.W.centroid(b)[1] < F.top - 1) this.W.remove(b);
      this.W.events.length = 0; this.bodies = this.bodies.filter((b) => b.alive); this.settle(0.5);
    }
    // へった 景品を たす（スタッフの ほじゅう）
    refill(first) {
      const d = this.def, f = d.fill, r = this.rand, alive = this.bodies.filter((b) => b.alive).length;
      if (!first && alive >= f.keep) return 0;
      const want = first ? f.n : f.n - alive;
      const list = this.mix || f.mix, shape0 = (this.mix && this.mix[0]) || f.shape || f.mix[0], low = f.upright ? -Math.min(...SHAPES[shape0]().parts.map((a) => a.y - a.r)) + 0.25 : 0; // たてて おく ものは ゆかに そっと おく
      for (let k = 0; k < want; k++) {
        if (f.at) {
          // きまった ばしょ（あいて いる ところだけ）
          const free = f.at.filter(([x, z]) => this.list().every((b) => { const c = this.W.centroid(b); return Math.hypot(c[0] - x, c[2] - z) > (f.gap || 14); }));
          const [x, z, yaw] = first ? f.at[k % f.at.length] : free.length ? free[Math.floor(r() * free.length)] : f.at[k % f.at.length];
          this.add(this.mix ? this.pick(list) : f.shape || this.pick(f.mix), [x, f.onBars ? d.bars.y + d.bars.r + low : f.upright ? low : 20, z], CP.qaxis(0, 1, 0, yaw)); if (!first) this.settle(0.6); continue;
        }
        // 上から 1こずつ おとして 山に する（かさなって おくと はじける）
        const [x0, x1, z0, z1] = f.area, x = mix(x0, x1, r()), z = mix(z0, z1, first ? r() : 0.55 + r() * 0.45);
        this.add(this.mix ? this.pick(list) : f.shape || this.pick(f.mix), [x, 30 + r() * 4, z], this.randQ(false)); this.settle(0.5);
      }
      return want;
    }
    // はしわたし: ぼうから おちて よこの ゆかに ある はこは、おみせの 人が はじめの ばしょに もどす（つぎの 1かいの はじめ）
    tidyBars() {
      const B = this.def.bars; let n = 0;
      for (const b of this.list()) { const c = this.W.centroid(b); if (c[1] < B.y - 3 && (c[0] < B.x0 - 1 || c[0] > B.x1 + 1)) { this.W.remove(b); n++; } }
      if (!n) return 0;
      this.bodies = this.bodies.filter((b) => b.alive); this.refill(false); this.settle(1); return n;
    }
    // はずれが つづいた とき: おみせの 人が はこを「たて むき」に おきなおす（ながい へんを ぼうに そって・すこし かたむけて ぼうの あいだへ）。
    // はこの おくゆき（15cm）で 2本の ぼうに すこし のる だけ。「ここを ねらってね」の しるし（hint）を だす（ほんものの 店員さんの アドバイス）。
    // しるしの 2.5cm いないで「つかむ」と しるしに ぴったり あわせる（press）。しるしを はさむと たてに おちる（tools/check-crane.mjs で たしかめる）
    assist() {
      const B = this.def.bars, b = this.list()[0]; if (!b) return false;
      const S = SHAPES[b.data.shape](), sid = b.data.sid, low = -Math.min(...S.parts.map((a) => a.y - a.r)) + 0.25, z = this.def.fill.at[0][1];
      this.W.remove(b); this.bodies = this.bodies.filter((q) => q.alive);
      this.add(b.data.shape, [(B.x0 + B.x1) / 2 + 0.6, B.y + B.r + low + 0.6, z], CP.qnorm(CP.qmul(CP.qaxis(0, 0, 1, 12 * D2R), CP.qaxis(0, 1, 0, Math.PI / 2))), { sid }); this.settle(2);
      const n = this.list()[0]; if (!n) return false;
      const c = this.W.centroid(n); this.hint = [+(c[0] + this.def.assistAim).toFixed(2), +c[2].toFixed(2)]; return true;
    }
    // まわる 台の おかしが へったら 上から たす（おみせの 人の ほじゅう）
    refillTable() {
      const o = this.rig.o, r = this.rand, on = this.list().filter((b) => { const c = this.W.centroid(b); return c[1] < 14 && Math.hypot(c[0] - o.cx, c[2] - o.cz) < o.rad + 1; }).length;
      if (on >= 14) return 0;
      for (let k = 0; k < 20 - on; k++) { const a = r() * Math.PI * 2, rr = 7.5 + r() * (o.rad - 10); this.add(this.pick(this.mix || this.def.sweet), [o.cx + Math.cos(a) * rr, o.top + 6 + (k % 3) * 3, o.cz + Math.sin(a) * rr], CP.qaxis(0, 1, 0, -a + (r() - 0.5) * 0.5)); }
      this.settle(2.5); this.refilled = 20 - on; return this.refilled;
    }
    // メダルは たいらに（うすい むきが たて）・くるっと まわして
    flat() { return CP.qnorm(CP.qmul(CP.qaxis(0, 1, 0, this.rand() * Math.PI * 2), CP.qaxis(1, 0, 0, Math.PI / 2))); }
    // フィールドの メダルが へったら おみせの 人が たす（上から そっと）
    refillField() {
      const F = this.field, r = this.rand, on = this.list().length;
      if (on >= F.keep) { this.settle(1); return 0; }
      const n = F.fill - on;
      for (let k = 0; k < n; k++) this.add("medal", [mix(F.x0 + 4, F.x1 - 4, r()), F.top + 5 + (k % 4) * 2.2, mix(F.ze + 5, F.push[1] - 4, r())], this.flat());
      this.settle(2.5); this.prime(); this.refilled = n; return n;
    }
    placeTripodPrize() {
      // 日がわりの 台は その日の けいひん（どうぶつえんの なかまは みな 大きい わんこと おなじ 形）
      const o = this.rig.o, shape = (this.mix && this.mix[0]) || this.def.prize, S = SHAPES[shape](), hy = S.size[1] / 2, big = shape === "wankoBig" || shape === "pandaBig" || shape.startsWith("zoo_");
      this.add(shape, [o.cx, o.y + o.armR + hy + (big ? 2 : 0.2), o.cz], CP.qaxis(0, 1, 0, 0.2));
    }
    // しずまるまで すすめる（はじめの ならべ・ほじゅうの あと）
    settle(sec) {
      const hold = this.type === "pusher"; if (hold) this.rig.hold = true; // プッシャーは とめて おく（ならべた メダルを おとさない）
      for (let i = 0; i < sec * 60; i++) { this.W.step(DT); if (this.W.B.every((b) => !b.alive || b.sleep)) break; }
      if (hold) this.rig.hold = false;
      this.W.events.length = 0; this.bodies = this.bodies.filter((b) => b.alive);
    }
    restore(board) {
      this.sid = board.n || 1;
      for (const e of board.b) {
        const [sid, shape, x, y, z, qw, qx, qy, qz] = e; if (!SHAPES[shape] || ![x, y, z, qw, qx, qy, qz].every(Number.isFinite)) continue;
        // セーブは おもさの 中心。形の 原点に もどして おく（まるくない ぬいぐるみが ずれない）
        const q = CP.qnorm([qw, qx, qy, qz]), R = CP.qmat(q), P = SHAPES[shape]().parts; let mx = 0, my = 0, mz = 0, mm = 0;
        for (const a of P) { mx += a.x * a.m; my += a.y * a.m; mz += a.z * a.m; mm += a.m; }
        const l = [mx / mm, my / mm, mz / mm], w = [R[0][0] * l[0] + R[1][0] * l[1] + R[2][0] * l[2], R[0][1] * l[0] + R[1][1] * l[1] + R[2][1] * l[2], R[0][2] * l[0] + R[1][2] * l[1] + R[2][2] * l[2]];
        this.add(shape, [x - w[0], y - w[1], z - w[2]], q, { sid });
      }
      for (const b of this.W.B) b.sleep = true;
    }
    // セーブ用（まん中と 向きだけ。0.1cm・0.001）
    board() {
      const b = this.bodies.filter((b) => b.alive && !b.data.fell && !b.data.fresh).map((b) => { const c = this.W.centroid(b); return [b.data.sid, b.data.shape, ...c.map((v) => Math.round(v * 10) / 10), ...b.q.map((v) => Math.round(v * 1000) / 1000)]; });
      return { v: 1, id: this.def.id, n: this.sid, b, s: this.rig.save(), ...(this.def.pool ? { day: this.day } : {}) };
    }
    // ---- そうさ ----
    // dx・dz: -1〜1（よこ・おく）
    move(dx, dz) {
      if (this.type === "pusher") { this.rig.tv = this.phase === "play" ? clamp(dx, -1, 1) * 24 : 0; return; }
      if (!clawy(this.type) || this.phase !== "move") return;
      const sp = 15; this.rig.tvx = clamp(dx, -1, 1) * sp; this.rig.tvz = clamp(dz, -1, 1) * sp;
    }
    press() {
      this.presses++;
      if (clawy(this.type)) {
        if (this.phase === "move") {
          // おみせの 人の しるしの ちかく: しるしに ぴったり（ゆれも とめる）
          const R = this.rig, H = this.hint; if (H && Math.hypot(R.x - H[0], R.z - H[1]) <= 2.5) { Object.assign(R, { vx: 0, vz: 0, sx: 0, sz: 0, svx: 0, svz: 0 }); R.load({ x: H[0], z: H[1] }); this.snapped = true; }
          this.go("stop"); R.tvx = 0; R.tvz = 0; this.events.push({ e: "checkpoint" }); return "drop";
        }
        if (this.phase === "down" && this.pt > 0.25) { this.go("close"); return "stop"; }
        return null;
      }
      if (this.type === "tripod") {
        if (this.phase !== "spin") return null;
        const R = this.rig, cell = R.cell(), arm = R.armAt(cell); R.run = false; this.stops--; this.lastCell = cell;
        this.hit = !!(arm && arm.up); if (this.hit) { arm.up = false; this.jolt(); this.events.push({ e: "armdrop", k: R.arms.indexOf(arm) }); } else this.events.push({ e: "trymiss" });
        R.flash = 0.8; this.go("stopped"); return this.hit ? "hit" : "miss";
      }
      if (this.type === "pusher") {
        // ランチャーから メダルを 1まい（すこし まを あける）
        if (this.phase !== "play" || this.left <= 0 || this.cool > 0) return null;
        const F = this.field, R = this.rig;
        this.add("medal", [R.lx, F.drop[1], F.drop[0]], this.flat(), { fresh: this.t + 0.001 });
        this.left--; this.cool = F.cool; this.idle = 0; this.events.push({ e: "drop", x: R.lx }); return "drop";
      }
      if (this.type === "sweet") {
        if (this.phase === "swing") { this.go("dip"); this.rig.mode = "work"; this.dipX = this.rig.sx; return "scoop"; }
        if (this.phase === "swing2") { this.go("dump"); this.rig.mode = "work"; return "dump"; }
      }
      return null;
    }
    go(p) { this.phase = p; this.pt = 0; if (p === "up" && this.rig) this.closeY = this.rig.y; this.events.push({ e: "phase", p }); }
    // アームが おちた ときの ガタン（景品が ぐらっと ゆれる）
    jolt() {
      const r = this.rand;
      for (const b of this.list()) { this.W.wake(b); const kx = (r() - 0.5) * 0.05, kz = (r() - 0.5) * 0.05; for (let j = b.i0; j < b.i0 + b.n; j++) { const p = this.W.P[j]; p.px -= kx; p.pz -= kz; p.py -= 0.03; } }
    }
    // つづきから あそべる ように（セーブ用）。board は 台の ようす
    snap() {
      const R = this.rig, o = { v: 1, type: this.type, phase: this.phase, got: this.got.slice(), gs: this.gotShapes.slice(), seed: this.seed, strong: this.strong, board: this.board(), ...(this.def.pool ? { day: this.day } : {}) };
      if (clawy(this.type)) Object.assign(o, { time: +this.time.toFixed(2), x: +R.x.toFixed(2), z: +R.z.toFixed(2), drop: this.phase !== "move", ...(this.hint ? { hint: this.hint.slice() } : {}) });
      if (this.type === "tripod") o.stops = this.stops;
      if (this.type === "sweet") o.scoops = this.scoops;
      // プッシャー: まだ おちて いる とちゅうの メダルは のこりに もどす・スロットの あたりは まだ ふって いない ぶんも
      if (this.type === "pusher") Object.assign(o, { left: this.left + this.list().filter((b) => b.data.fresh).length, lost: this.lost, bonus: this.shower + (this.slot && !this.slot.paid ? this.slot.win : 0), queue: this.queue });
      return o;
    }
    resume(cp) {
      if (!cp) return;
      this.got = Array.isArray(cp.got) ? cp.got.slice() : []; this.gotShapes = Array.isArray(cp.gs) ? cp.gs.slice(0, this.got.length) : [];
      if (clawy(this.type)) {
        this.time = clamp(+cp.time || 0, 0, this.def.moveTime); const R = this.rig; R.load({ x: +cp.x || R.x, z: +cp.z || R.z });
        if (this.def.bars && Array.isArray(cp.hint) && cp.hint.length === 2 && cp.hint.every(Number.isFinite)) this.hint = cp.hint.slice();
        if (cp.drop) { this.go("stop"); this.events.push({ e: "replay" }); } // おりる とちゅうだった → もういちど おろす
      }
      if (this.type === "tripod") this.stops = clamp(cp.stops | 0, 0, 3);
      if (this.type === "sweet") this.scoops = clamp(cp.scoops | 0, 0, 3);
      if (this.type === "pusher") Object.assign(this, { left: clamp(cp.left | 0, 0, this.field.medals), lost: Math.max(0, cp.lost | 0), shower: clamp(cp.bonus | 0, 0, 30), queue: clamp(cp.queue | 0, 0, 2) });
      if ((this.type === "tripod" && this.stops <= 0) || (this.type === "sweet" && this.scoops <= 0)) this.go(this.type === "tripod" ? "settle" : "watch");
    }
    // ---- すすめる（かならず 1/60びょう ずつ）----
    step(dt) {
      this.acc = Math.min(this.acc + dt, DT * 6);
      while (this.acc >= DT - 1e-9) { this.acc -= DT; this.tick(); }
    }
    tick() {
      if (this.done) { this.W.step(DT); return; }
      this.t += DT; this.pt += DT; this.frames++;
      if (clawy(this.type)) this.clawTick();
      else if (this.type === "tripod") this.tripodTick();
      else if (this.type === "pusher") this.pusherTick();
      else this.sweetTick();
      this.W.step(DT);
      // プッシャーの メダルは ふちを こえた ときに かぞえて いる（ここでは けすだけ）
      for (const ev of this.W.events.splice(0)) if (ev.e === "out") { if (ev.b.data.fell) this.bodies = this.bodies.filter((x) => x !== ev.b); else this.collect(ev.b); }
    }
    // おとしぐちに おちた（とれた）
    collect(b) {
      const d = this.def;
      this.got.push(b.data.sid); this.gotShapes.push(b.data.shape); this.events.push({ e: "got", sid: b.data.sid, look: b.data.look, shape: b.data.shape }); this.bodies = this.bodies.filter((x) => x !== b);
      if (d.got === "win" && this.type !== "tripod" && this.phase !== "done") this.won = true;
      if (this.type === "tripod") this.won = true;
    }
    // ゆかに おちて とまった おかしは まわる 台へ もどす（ほんものの 台も ゆかが かたむいて いる）
    returnSweets() {
      const o = this.rig.o, r = this.rand;
      for (const b of this.list()) {
        if (!b.sleep) continue; const c = this.W.centroid(b);
        if (c[1] < 5 && Math.hypot(c[0] - o.cx, c[2] - o.cz) > o.rad + 0.5) { this.W.remove(b); this.bodies = this.bodies.filter((x) => x !== b); const a = r() * Math.PI * 2, rr = 7 + r() * 6; this.add(b.data.shape, [o.cx + Math.cos(a) * rr, o.top + 9, o.cz + Math.sin(a) * rr], CP.qaxis(0, 1, 0, r() * 3), { sid: b.data.sid }); }
      }
    }
    clawTick() {
      const R = this.rig, d = this.def, ph = this.phase;
      if (ph === "move") {
        this.time -= DT;
        if (this.time <= 0) { this.time = 0; this.go("stop"); R.tvx = 0; R.tvz = 0; this.events.push({ e: "timeup" }, { e: "checkpoint" }); }
      } else if (ph === "stop") { R.tvx = 0; R.tvz = 0; if (Math.abs(R.vx) + Math.abs(R.vz) < 0.05 && this.pt > 0.25) { this.go("open"); R.mode = "open"; } }
      else if (ph === "open") { if (this.pt > 0.55) this.go("down"); }
      else if (ph === "down") {
        R.y -= 15 * DT;
        const landed = this.pt > 0.3 && (R.push() > 1.2 || R.tipY() < 0.9);
        if (landed || R.y <= d.minY) { R.y = Math.max(R.y, d.minY); this.go("close"); }
      } else if (ph === "close") {
        R.mode = "close";
        const allStop = R.th.every((t, k) => t <= R.o.closed + 1e-4 || R.stall[k] > 0.25);
        if ((allStop && this.pt > 0.5) || this.pt > 1.6) { this.go("up"); }
      } else if (ph === "up") {
        R.y = Math.min(d.top, R.y + 12 * DT);
        // はしわたしの アームは もちあげると すぐ ゆるむ（はこの はしが すこし あがって、ずれて おちる）
        if (d.slip && R.mode === "close" && R.y > this.closeY + d.slip.after) { R.loose = d.slip.open * D2R; R.mode = "loose"; this.events.push({ e: "loose" }); }
        if (R.y >= d.top) { if (!this.strong && this.type === "claw") { R.loose = 13 * D2R; R.mode = "loose"; this.events.push({ e: "loose" }); } this.go("top"); }
      } else if (ph === "top") { if (this.pt > 0.55) this.go("carry"); }
      else if (ph === "carry") {
        const dx = d.home.x - R.x, dz = d.home.z - R.z, dist = Math.hypot(dx, dz), sp = Math.min(15, dist * 3);
        R.tvx = dist > 0.05 ? (dx / dist) * sp : 0; R.tvz = dist > 0.05 ? (dz / dist) * sp : 0;
        if (dist < 0.15 && Math.abs(R.vx) + Math.abs(R.vz) < 0.2) { R.tvx = R.tvz = 0; this.go("release"); R.mode = "release"; }
      } else if (ph === "release") { if (this.pt > 1.3) { R.mode = "rest"; this.go("settle"); } }
      else if (ph === "settle") {
        const calm = this.W.B.every((b) => !b.alive || b.sleep);
        if ((calm && this.pt > 0.8) || this.pt > 3.5) this.finish();
      }
    }
    tripodTick() {
      const R = this.rig;
      if (this.phase === "spin") { R.run = true; if (this.t > 40) this.press(); }
      else if (this.phase === "stopped") {
        if (this.pt > 1.2) {
          this.events.push({ e: "checkpoint" });
          if (this.won) { this.go("settle"); }
          else if (this.stops > 0) { R.light = (R.light + 1) % R.cells(); this.go("spin"); }
          else this.go("settle");
        }
      } else if (this.phase === "settle") {
        const calm = this.W.B.every((b) => !b.alive || b.sleep);
        if ((calm && this.pt > 1) || this.pt > 4) this.finish();
      }
    }
    sweetTick() {
      const R = this.rig, o = R.o;
      if (this.frames % 60 === 0) this.returnSweets();
      if (this.phase === "swing") { R.sy += (o.idleY - R.sy) * 0.1; R.yaw += (R.flowYaw() - R.yaw) * 0.1; R.tilt += (0 - R.tilt) * 0.1; if (this.t > 60) this.press(); }
      else if (this.phase === "dip") {
        const k = ease(this.pt / 0.8); R.yaw = R.flowYaw(); R.sy = mix(o.idleY, o.top + 1.2, k); R.tilt = mix(0, -14 * D2R, k);
        if (this.pt >= 0.8) this.go("scoop");
      } else if (this.phase === "scoop") {
        // ながれに さからって すくいながら すすむ（くちの 向きへ 6cm）
        if (this.pt < 1.4) { const k = DT / 1.4 * 6; R.sx -= Math.sin(R.yaw) * k; R.sz -= Math.cos(R.yaw) * k; }
        else R.tilt = mix(-14 * D2R, 14 * D2R, ease((this.pt - 1.4) / 0.5));
        if (this.pt > 1.9) { this.liftFrom = [R.sx, R.sz]; this.go("lift"); }
      }
      else if (this.phase === "lift") {
        const k = ease(this.pt / 1.1), f = this.liftFrom; R.sy = mix(o.top + 1.2, o.dumpY, k); R.sz = mix(f[1], o.dumpZ, ease((this.pt - 0.9) / 0.9)); R.tilt = 14 * D2R; R.yaw += (0 - R.yaw) * 0.06;
        if (this.pt >= 1.8) { R.mode = "swing2"; R.swingT = Math.acos(clamp(1 - 2 * (R.sx - o.swing2[0]) / (o.swing2[1] - o.swing2[0]), -1, 1)) * o.swingPeriod / (2 * Math.PI); this.go("swing2"); }
      } else if (this.phase === "swing2") { R.yaw += (0 - R.yaw) * 0.1; if (this.pt > 12) this.press(); }
      else if (this.phase === "dump") {
        R.tilt = mix(12 * D2R, -125 * D2R, ease(this.pt / 0.7));
        if (this.pt > 1.4) this.go("back");
      } else if (this.phase === "back") {
        if (!this.backFrom) this.backFrom = [R.sx, R.sz];
        const k = ease(this.pt / 1.4), f = this.backFrom, a0 = o.arc[0]; R.tilt = mix(-125 * D2R, 0, k); R.sy = mix(o.dumpY, o.idleY, k); R.sx = mix(f[0], o.cx + Math.cos(a0) * o.arcR, k); R.sz = mix(f[1], o.cz + Math.sin(a0) * o.arcR, k);
        if (this.pt >= 1.4) { this.backFrom = null; this.scoops--; this.events.push({ e: "checkpoint" }); if (this.scoops > 0) { R.mode = "swing"; R.swingT = 0; this.go("swing"); } else this.go("watch"); }
      } else if (this.phase === "watch") { if (this.pt > 4.5) this.finish(); }
    }
    pusherTick() {
      const F = this.field, R = this.rig, r = this.rand, gx = R.gateX();
      if (this.cool > 0) this.cool -= DT;
      for (const b of this.bodies) {
        if (!b.alive || b.data.fell) continue;
        const c = this.W.centroid(b);
        // いれた メダルが リングの たかさを とおった（リングの 中なら チャンス）
        if (b.data.fresh && (c[1] < F.gateY || this.t - b.data.fresh > 2)) { const hit = c[1] < F.gateY + 1 && Math.abs(c[0] - gx) < F.gateR; b.data.fresh = 0; if (hit) this.chance(); this.events.push({ e: "checkpoint" }); }
        // フィールドの ふちを こえて おちた: てまえ = もらえる・よこ = おみせの もの
        if (c[1] < F.top - 2.5) {
          const front = c[2] < F.ze + 1 && c[0] > F.x0 - 1 && c[0] < F.x1 + 1; b.data.fell = front ? "front" : "side";
          if (front) { this.got.push(b.data.sid); this.gotShapes.push(b.data.shape); this.events.push({ e: "got", sid: b.data.sid, look: b.data.look, shape: b.data.shape, x: c[0] }); }
          else { this.lost++; this.events.push({ e: "lost", x: c[0] }); }
        }
      }
      // スロット（3つ そろうと たくさん・2つで すこし メダルが ふって くる）
      const S = this.slot;
      if (S) {
        S.t += DT;
        if (!S.paid && S.t >= 2.3) { S.paid = true; this.shower += S.win; this.events.push({ e: "slot", res: S.res.slice(), win: S.win }); }
        if (S.t >= 3.3) { this.slot = null; if (this.queue > 0) { this.queue--; this.chance(); } }
      }
      if (this.shower > 0 && (this.showerT -= DT) <= 0) { this.showerT = 0.16; this.shower--; this.add("medal", [mix(F.lim[0], F.lim[1], r()), F.drop[1] + 2, F.drop[0] - r() * 1.5], this.flat(), { bonus: 1 }); this.events.push({ e: "shower" }); }
      if (this.phase === "play") {
        this.idle += DT;
        if (this.left > 0 && this.idle > 20) this.press(); // ずっと おさない ときは じぶんで いれる
        const air = this.bodies.some((b) => b.alive && b.data.fresh);
        if (this.left <= 0 && !air && !this.slot && !this.queue && this.shower <= 0) { this.go("watch"); this.events.push({ e: "checkpoint" }); }
      } else if (this.phase === "watch") {
        if (this.slot || this.shower > 0) this.pt = 0;
        if (this.pt > F.watch) this.finish();
      }
    }
    // チャンス（リングを とおった）: スロットを まわす。まわって いる ときは 2つまで まつ
    chance() {
      if (this.slot) { this.queue = Math.min(2, this.queue + 1); this.events.push({ e: "hold", n: this.queue }); return; }
      const r = this.rand, roll = r(), F = this.field, pick = () => Math.floor(r() * 3) % 3;
      let res, win = 0;
      if (roll < 1 / 8) { const f = pick(); res = [f, f, f]; win = F.bonus.big; }
      else if (roll < 3 / 8) { const f = pick(), g = (f + 1 + (r() < 0.5 ? 0 : 1)) % 3, k = pick(); res = [f, f, f]; res[k] = g; win = F.bonus.small; }
      else res = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]][Math.floor(r() * 6) % 6];
      this.slot = { t: 0, res, win, paid: false }; this.hits++; this.events.push({ e: "chance" });
    }
    finish() { if (this.done) return; this.done = true; this.phase = "done"; if (clawy(this.type)) this.rig.mode = "rest"; if (this.type === "pusher") { this.rig.hold = true; this.rig.tv = 0; } this.events.push({ e: "done", got: this.got.length }); }
    // 台の うえに ある 景品（絵と テスト用）
    list() { return this.bodies.filter((b) => b.alive); }
  }
  // ローカルの 点 → world（L は 形の 原点から）
  const toWorld = (W, b, L) => { const c = W.centroid(b), o = b.data.org || [0, 0, 0], R = CP.qmat(b.q), x = L[0] + o[0], y = L[1] + o[1], z = L[2] + o[2]; return [c[0] + R[0][0] * x + R[1][0] * y + R[2][0] * z, c[1] + R[0][1] * x + R[1][1] * y + R[2][1] * z, c[2] + R[0][2] * x + R[1][2] * y + R[2][2] * z]; };
  return { DEFS, SHAPES, ClawRig, TrypodRig, SweetRig, CraneRound, rng, toWorld, DT, today, dayNum, lineup, keepDay, clawy, lattice };
})();
