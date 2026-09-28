// ④ 化石ほり（docs/design/features/fossils の 見本 tools/feature-design/fossils-ref.js の FossilRef を 移した もの）。
// 1番: 骨の あつまりぐあい（progress は 見本と おなじ）・骨を もつ・メニューの「かせき ノート」。
// 2番: ほる しくみ（rng・rocks・pick・Dig）と 画面（drawDig・rockSvg・pickSvg）は 見本の まま。ピッケル・町の いわ・「ほる」ボタン・ほる 画面・みつけた カード。
// データは FOSSIL_DATA（自動生成）、セーブは Save.d.fossil（{ pick, bones, dug }）。
const Fossils = {
  data() { return typeof FOSSIL_DATA !== "undefined" ? FOSSIL_DATA : null; },
  dino(id) { return ((this.data() || {}).dinos || []).find((d) => d.id === id) || null; },
  st() { return Save.d.fossil; },
  // ある 恐竜の 骨が いくつ そろったか（own: { "trex.skull": もって いる 数 }）
  progress(dino, own) { const n = dino.art.parts.filter((p) => own[dino.id + "." + p.id]).length; return { n, total: dino.art.parts.length, done: n === dino.art.parts.length }; },
  // もって いる 骨 ＋ ⑤ はくぶつかんに 寄贈した 骨（寄贈しても ノートや あつまりぐあいは へらない）
  owned() { const own = { ...this.st().bones }; for (const k of Object.keys((Save.d.museum || {}).bones || {})) own[k] = Math.max(own[k] || 0, 1); return own; },
  // もって いる（寄贈した ものも）部品の id（FossilArt.svg の have に わたす）
  have(dino) { const own = this.owned(); return dino.art.parts.filter((p) => own[dino.id + "." + p.id]).map((p) => p.id); },
  // 骨の id「<恐竜>.<部品>」→ { dino, part }
  bone(key) { const [id, pid] = String(key).split("."), d = this.dino(id), p = d && d.art.parts.find((x) => x.id === pid); return p ? { dino: d, part: p } : null; },
  give(key, n = 1) { const st = this.st(); st.bones[key] = (st.bones[key] || 0) + n; Save.mark(); },
  // 3番: 骨を へらす（② の 物々交換で わたす）と、なまえ（「ティラノサウルスの あたま」）
  take(key, n = 1) { const st = this.st(); st.bones[key] = Math.max(0, (st.bones[key] || 0) - n); Save.mark(); },
  boneName(key) { const b = this.bone(key); return b ? `${b.dino.name}の ${b.part.name}` : key; },
  // 3番: ② の 物々交換（ケロスケ「だぶった 骨 → 同じ 恐竜の まだ ない 骨」）。2こ いじょう ある 骨と、
  // その 恐竜の まだ ない 骨を データの じゅんで 1つずつ（{ give, get }）。そろった 恐竜の だぶりは つかわない。なければ null
  // ⑤ 寄贈した 骨は わたせない（own は 寄贈して いない ぶん）・もって いる ことに なる（まだ ない 骨に しない）
  dupTrade(own = this.st().bones) {
    const all = { ...this.owned(), ...Object.fromEntries(Object.entries(own).filter(([, n]) => n > 0)) };
    for (const d of this.data().dinos) {
      const dup = d.art.parts.find((p) => (own[d.id + "." + p.id] || 0) >= 2), miss = d.art.parts.find((p) => !all[d.id + "." + p.id]);
      if (dup && miss) return { give: d.id + "." + dup.id, get: d.id + "." + miss.id };
    }
    return null;
  },
  total() { return this.data().dinos.reduce((a, d) => a + d.art.parts.length, 0); },
  count() { return this.data().dinos.reduce((a, d) => a + this.have(d).length, 0); },

  // ---- かせき ノート（メニューの「ずかん」→「かせき」。見本 img/dig-flow.png の ⑤）----
  // ない 骨は 点線の かげ。そろった 恐竜に「そろった！」。はくぶつかん（⑤）が できるまでは その ことを 言わない
  museum() { return !!(typeof MAP_DEFS !== "undefined" && MAP_DEFS.museum); },
  note(el) {
    const museum = this.museum();
    el.append(U.el("div", { class: "muted fossil-sum", text: `あつめた ほね ${this.count()} / ${this.total()}。` + (museum ? "そろった きょうりゅうは はくぶつかんで くみたてられるよ。" : "ほねが ぜんぶ そろうと きょうりゅうが かんせい！") }));
    const grid = U.el("div", { class: "fossil-note" });
    for (const d of this.data().dinos) {
      const h = this.have(d), done = h.length === d.art.parts.length, c = U.el("div", { class: "fossil-cell" + (done ? " done" : "") });
      c.dataset.id = d.id;
      c.innerHTML = `${FossilArt.svg(d, { have: h })}<div class="nm"></div><div class="cnt">${done ? "そろった！" : `ほね ${h.length}/${d.art.parts.length}`}</div>`;
      c.querySelector(".nm").textContent = h.length ? d.name : "？？？";
      if (h.length) c.addEventListener("click", () => { Sound.se("tap"); this.detail(d.id); });
      grid.append(c);
    }
    el.append(grid);
  },
  // くわしい ページ: 骨格・じだい・ばしょ・おおきさ・たべもの・あつまりぐあい・説明・まめちしき
  detail(id) {
    const d = this.dino(id); if (!d) return null;
    const h = this.have(d); if (!h.length) return null;
    const body = U.el("div", { class: "bone-card fossil-detail" });
    body.innerHTML = `<div class="art">${FossilArt.svg(d, { have: h })}</div><div class="nm"></div><div class="dn"></div>`
      + `<div class="facts"><span>いた じだい</span><span></span><span>みつかった ところ</span><span></span><span>おおきさ</span><span>${d.len}m</span><span>たべもの</span><span></span><span>ほね</span><span>${h.length} / ${d.art.parts.length}</span></div>`
      + `<div class="desc"></div><div class="fact"><b>まめちしき</b><span></span></div>`;
    const cells = body.querySelectorAll(".facts span");
    body.querySelector(".nm").textContent = d.name; body.querySelector(".dn").textContent = d.ago;
    cells[1].textContent = d.era; cells[3].textContent = d.where; cells[7].textContent = d.food;
    body.querySelector(".desc").textContent = d.desc; body.querySelector(".fact span").textContent = d.fact;
    return UI.modal({ title: d.name, body });
  },

  // ---- 2番: 見本 FossilRef の しくみと 絵（そのまま）----
  rng(seed) { let s = 0; for (const ch of String(seed)) s = (s * 31 + ch.charCodeAt(0)) >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; },
  // その日の いわ: 歩ける マスの となりに ある「かべ・いわ」の マス（walk / solid は ゲーム側）。今日 ほった ものは のぞく
  rocks(mapId, n, day, cand) { const R = this.rng(mapId + ":" + day), pool = cand.slice(); const out = []; while (pool.length && out.length < n) { const i = Math.floor(R() * pool.length); const p = pool.splice(i, 1)[0]; if (out.every((q) => Math.abs(q[0] - p[0]) + Math.abs(q[1] - p[1]) >= 5)) out.push(p); } return out; },
  // own: { "trex.skull": 1, ... }（もって いる 骨の 数）
  pick(data, site, own, rand = Math.random) {
    if (rand() >= data.rule.boneChance) return { extra: data.extras[Math.floor(rand() * data.extras.length)] };
    const dinos = data.dinos.filter((d) => d.site === site), W = { 1: 4, 2: 3, 3: 2, 4: 1 };
    const all = dinos.flatMap((d) => d.art.parts.map((p) => ({ d, p, w: W[d.rarity], key: d.id + "." + p.id })));
    const missing = all.filter((b) => !own[b.key]), pool = missing.length && rand() < data.rule.newFirst ? missing : all;
    let r = rand() * pool.reduce((a, b) => a + b.w, 0);
    for (const b of pool) { r -= b.w; if (r < 0) return { dino: b.d, part: b.p, key: b.key }; }
    const b = pool[pool.length - 1]; return { dino: b.d, part: b.p, key: b.key };
  },
  // ---- ほる ミニゲーム: 7×5 の いわ。たたいた マスは 2 へり、となりは 1 へる。骨の マスが ぜんぶ 見えたら おわり ----
  Dig: class {
    constructor(bone, { cols = 7, rows = 5, rand = Math.random } = {}) {
      this.cols = cols; this.rows = rows; this.hp = []; this.taps = 0; this.done = false; this.bone = bone;
      for (let i = 0; i < cols * rows; i++) this.hp.push(1 + (rand() < 0.45 ? 1 : 0) + (rand() < 0.15 ? 1 : 0));
      // 骨の ある マス（まんなか あたりに 4×2 〜 5×3）
      const bw = 4 + (rand() < 0.5 ? 1 : 0), bh = 2 + (rand() < 0.5 ? 1 : 0), bx = 1 + Math.floor(rand() * (cols - bw - 1)), by = 1 + Math.floor(rand() * (rows - bh - 1));
      this.area = { x: bx, y: by, w: bw, h: bh };
    }
    cellOf(i) { return [i % this.cols, Math.floor(i / this.cols)]; }
    isBone(x, y) { const a = this.area; return x >= a.x && x < a.x + a.w && y >= a.y && y < a.y + a.h; }
    tap(x, y) {
      if (this.done) return null;
      this.taps++;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const cx = x + dx, cy = y + dy; if (cx < 0 || cy < 0 || cx >= this.cols || cy >= this.rows) continue; const i = cy * this.cols + cx; this.hp[i] = Math.max(0, this.hp[i] - (dx === 0 && dy === 0 ? 2 : Math.abs(dx) + Math.abs(dy) === 1 ? 1 : 0)); }
      let left = 0; for (let yy = 0; yy < this.rows; yy++) for (let xx = 0; xx < this.cols; xx++) if (this.isBone(xx, yy) && this.hp[yy * this.cols + xx] > 0) left++;
      if (!left) this.done = true;
      return { left, done: this.done, stars: this.done ? (this.taps <= 8 ? 3 : this.taps <= 11 ? 2 : 1) : 0 };
    }
  },
  // ほる 画面（canvas）: boneImg は FossilArt.partSvg を Image に した もの
  drawDig(ctx, W, H, dig, boneImg, t = 0) {
    const pad = 10, cw = (W - pad * 2) / dig.cols, ch = (H - pad * 2) / dig.rows, INK = "#1F1D1B";
    // 土の 下地
    let g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#C9A77A"); g.addColorStop(1, "#A8845A"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(90,60,30,.25)"; for (let i = 0; i < 40; i++) { const x = (i * 71) % W, y = (i * 37) % H; ctx.beginPath(); ctx.arc(x, y, 1.5 + (i % 3), 0, 7); ctx.fill(); }
    // 骨（まだ いわの 下）
    if (boneImg) { const a = dig.area, bx = pad + a.x * cw, by = pad + a.y * ch, bw = a.w * cw, bh = a.h * ch, k = Math.min(bw / boneImg.width, bh / boneImg.height) * 0.92; ctx.drawImage(boneImg, bx + (bw - boneImg.width * k) / 2, by + (bh - boneImg.height * k) / 2, boneImg.width * k, boneImg.height * k); }
    // いわの マス（のこりの かたさで 色と ひびが かわる）
    for (let i = 0; i < dig.hp.length; i++) {
      const hp = dig.hp[i]; if (!hp) continue; const [x, y] = dig.cellOf(i), px = pad + x * cw, py = pad + y * ch;
      ctx.fillStyle = hp >= 3 ? "#7E7468" : hp === 2 ? "#948A7C" : "#ABA192"; ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(px + 3, py + 2); ctx.lineTo(px + cw - 2, py + 4); ctx.lineTo(px + cw - 1, py + ch - 3); ctx.lineTo(px + 4, py + ch - 1); ctx.lineTo(px + 1, py + ch / 2); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(px + 6, py + 7); ctx.lineTo(px + cw * 0.45, py + 5); ctx.stroke();
      if (hp === 1) { ctx.strokeStyle = INK; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(px + cw * 0.3, py + ch * 0.2); ctx.lineTo(px + cw * 0.5, py + ch * 0.5); ctx.lineTo(px + cw * 0.42, py + ch * 0.8); ctx.moveTo(px + cw * 0.5, py + ch * 0.5); ctx.lineTo(px + cw * 0.75, py + ch * 0.6); ctx.stroke(); }
    }
    // わく
    ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.strokeRect(1.5, 1.5, W - 3, H - 3);
    if (dig.done) { ctx.fillStyle = "rgba(255,243,168,.9)"; for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + t, x = W / 2 + Math.cos(a) * W * 0.36, y = H / 2 + Math.sin(a) * H * 0.34; ctx.beginPath(); ctx.moveTo(x, y - 6); ctx.lineTo(x + 2, y - 2); ctx.lineTo(x + 6, y); ctx.lineTo(x + 2, y + 2); ctx.lineTo(x, y + 6); ctx.lineTo(x - 2, y + 2); ctx.lineTo(x - 6, y); ctx.lineTo(x - 2, y - 2); ctx.closePath(); ctx.fill(); } }
  },
  // 町に おく「ひびの ある いわ」（1マス。足もとが 下の まん中。viewBox 0 0 32 32）
  rockSvg() {
    const INK = "#1F1D1B";
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><ellipse cx="16" cy="28" rx="13" ry="3.2" fill="#000" fill-opacity="0.16"/><path d="M4,27 C2,20 5,11 11,8 C15,5 22,6 26,10 C30,14 30,22 28,27 Z" fill="#9A8E7E" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/><path d="M8,13 C11,10 15,9 18,10" fill="none" stroke="#C8BEB0" stroke-width="1.6" stroke-linecap="round"/><path d="M15,9 L17,15 L14,19 L18,24 M17,15 L22,17 L24,22 M14,19 L10,21" fill="none" stroke="${INK}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M20,12 L21.5,13.5 M9,24 l1.5,-1" stroke="#F5E6C8" stroke-width="1.2" stroke-linecap="round"/><path d="M25,6 l1,2.2 2.2,1 -2.2,1 -1,2.2 -1,-2.2 -2.2,-1 2.2,-1 Z" fill="#FFF3A8" stroke="${INK}" stroke-width="0.9"/></svg>`;
  },
  // ピッケルの アイコン（だいじな もの。viewBox 0 0 64 64・FOOD_ART と おなじ かき方）
  pickSvg() {
    const INK = "#1F1D1B";
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M14,58 L40,20" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M14,58 L40,20" stroke="#C98A52" stroke-width="5" stroke-linecap="round"/><path d="M18,52 L22,46" stroke="#A86E3E" stroke-width="5" stroke-linecap="round"/><path d="M22,14 C32,10 46,12 56,22 C48,20 42,20 38,22 L34,28 C30,24 26,19 22,14 Z" fill="#B8C4CC" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M26,15 C34,13 44,15 50,19" fill="none" stroke="#FFF" stroke-width="2" stroke-linecap="round" stroke-opacity="0.8"/></svg>`;
  },

  // ---- 2番: ピッケル（だいじな もの）。もりの ケロスケ（pick.get.npc）から もらう ----
  hasPick() { return ((Save.d.fossil || {}).pick || 0) > 0; },
  // Talk.run から（プレゼントの あと・おねがいの まえ）。もらった 回は ふつうの セリフを 出さない
  async talked(n, who) {
    const D = this.data(), g = D && D.pick.get; if (!g || n.id !== g.npc || this.hasPick()) return false;
    await UI.say([{ name: who.name, face: who.face, text: g.talk }]);
    this.st().pick = 1; Save.mark(); Save.write();
    Sound.se("fanfare"); UI.toast(`<span class="fossil-got">${this.pickSvg()}「${D.pick.name}」を もらった！</span>`, "good");
    await UI.say([{ text: `だいじな もの「${D.pick.name}」を てにいれた！\nひびの ある いわの そばで「ほる」が でるよ。` }]);
    return true;
  },

  // ---- 2番: まいにちの「ひびの ある いわ」----
  // マップ → 化石が 出る 場所（sites の maps）
  siteOf(mapId) { const D = this.data(); return D ? Object.keys(D.sites).find((k) => D.sites[k].maps.includes(mapId)) || null : null; },
  // その日に ほった いわ（{ day, at: { <マップ>: ["x,y", ...] } }。日が かわったら けす）
  dugToday() { const st = this.st(), day = U.today(); if (!st.dug || st.dug.day !== day) { st.dug = { day, at: {} }; Save.mark(); } return st.dug; },
  // いわを おける マス（マップごとに 1かいだけ 計算）: 入口から 歩いて 行ける・となりに 水 いがいの かべが ある・水の となりでない（釣り場を あける）・
  // ワープと 入口・ドア・宝箱・かんばん・人・しかけ・建物・ボスの まわりと 敵の 出る マスでない・ふさいでも まわりの 道が つながって いる
  candCache: {},
  candidates(mapId) {
    if (this.candCache[mapId]) return this.candCache[mapId];
    const m = Maps.get(mapId), d = m.def, busy = new Set(), starts = [], N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const mark = (x, y, w = 1, h = 1, r = 1) => { for (let yy = y - r; yy < y + h + r; yy++) for (let xx = x - r; xx < x + w + r; xx++) busy.add(xx + "," + yy); };
    for (const w of d.warps || []) mark(w.x, w.y, w.w, w.h);
    for (const od of Object.values(MAP_DEFS)) for (const w of od.warps || []) if (w.to === mapId) { mark(w.tx, w.ty); starts.push([w.tx, w.ty]); }
    for (const n of d.npcs || []) mark(n.x, n.y);
    for (const c of d.chests || []) mark(c.x, c.y);
    for (const s of d.signs || []) mark(s.x, s.y);
    for (const o of d.objects || []) mark(o.x, o.y, o.w || 1, o.h || 1);
    for (const b of d.buildings || []) mark(b.x, b.y, b.w, b.h);
    for (const [x, y] of d.spawns || []) mark(x, y, 1, 1, 0);
    if (d.boss) mark(d.boss.x - 1, d.boss.y - 1, 3, 3);
    const open = (x, y) => x >= 0 && y >= 0 && x < m.w && y < m.h && !m.isSolid(x, y);
    const seen = new Set(), q = starts.filter(([x, y]) => open(x, y));
    for (const [x, y] of q) seen.add(x + "," + y);
    while (q.length) { const [x, y] = q.shift(); for (const [dx, dy] of N4) { const k = x + dx + "," + (y + dy); if (!seen.has(k) && open(x + dx, y + dy)) { seen.add(k); q.push([x + dx, y + dy]); } } }
    const out = [];
    for (let y = 1; y < m.h - 1; y++) for (let x = 1; x < m.w - 1; x++) {
      if (!seen.has(x + "," + y) || busy.has(x + "," + y) || m.warpAt(x, y) || m.doorAt(x, y)) continue;
      const wall = N4.filter(([dx, dy]) => !open(x + dx, y + dy));
      if (!wall.length || wall.some(([dx, dy]) => (d.rows[y + dy] || "")[x + dx] === "~")) continue;
      if (this.keepsWay(open, x, y)) out.push([x, y]);
    }
    return (this.candCache[mapId] = out);
  },
  // (x, y) を ふさいでも、となりの 歩ける マスどうしが まわりの 8マスで つながって いるか（道が きれない）
  keepsWay(open, x, y) {
    const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]], nb = N4.filter(([dx, dy]) => open(x + dx, y + dy));
    if (!nb.length) return false;
    const seen = new Set([nb[0].join()]), q = [nb[0]];
    while (q.length) {
      const [cx, cy] = q.shift();
      for (const [dx, dy] of N4) { const nx = cx + dx, ny = cy + dy; if (Math.max(Math.abs(nx), Math.abs(ny)) !== 1 || seen.has(nx + "," + ny) || !open(x + nx, y + ny)) continue; seen.add(nx + "," + ny); q.push([nx, ny]); }
    }
    return nb.every((p) => seen.has(p.join()));
  },
  // きょうの いわ（[[x, y], ...]。見本 rocks で えらぶ。ほった ものは のぞく）
  rocksOn(mapId) {
    const D = this.data(), site = this.siteOf(mapId); if (!site || !Save.d.fossil) return [];
    const dug = this.dugToday().at[mapId] || [];
    return this.rocks(mapId, D.sites[site].rocks, U.today(), this.candidates(mapId)).filter(([x, y]) => !dug.includes(x + "," + y));
  },

  // ---- 2番: 町・外の 世界の「ほる」ボタン（act-btn。釣りの「つる」と おなじ 場所・大きさ。「つる」が 出て いる ときは 出さない）----
  // 先頭の 子が いわの となり（上下左右）に いて、ピッケルを もって いる ときだけ。むいて いる いわを さきに
  rockNear(sc) {
    if (!this.hasPick() || !sc.rocks || !sc.rocks.length || !sc.party) return null;
    const L = sc.party[0]; if (L.moving) return null;
    const [dx, dy] = DIRS[L.dir];
    return sc.rockAt(L.tx + dx, L.ty + dy) || sc.rocks.find(([x, y]) => Math.abs(x - L.tx) + Math.abs(y - L.ty) === 1) || null;
  },
  refreshButton(sc) {
    const rock = G.scene === sc && !sc.busy && !UI.busy && !Game.trans && !(typeof Fishing !== "undefined" && Fishing.button) && this.rockNear(sc);
    if (!rock) { this.hideButton(); return; }
    if (this.button) return;
    this.button = UI.btn(`${this.pickSvg()}<span>ほる</span>`, () => this.start(sc), "act-btn fossil-go-btn");
    this.button.setAttribute("aria-label", "ほる");
    UI.root.append(this.button);
  },
  hideButton() { if (this.button) this.button.remove(); this.button = null; },
  start(sc) {
    const rock = this.rockNear(sc); if (!rock || sc.busy || Game.inputLocked || UI.busy) return;
    const L = sc.party[0]; L.dir = dirOf(rock[0] - L.tx, rock[1] - L.ty) || L.dir;
    this.hideButton(); Sound.se("ok");
    sc.interact({ type: "rock", rock });
  },

  // ---- 2番: ほる（WorldScene.interact から。rock は [x, y]。テストは key で 出る 骨を きめられる）----
  // 出る ものは 日づけ・マップ・いわの 場所で きまる（とちゅうで とじて やりなおしても おなじ）。70% 骨・30% おまけ（見本 pick）
  async dig(sc, rock, { key = null, site = null } = {}) {
    const D = this.data(), mapId = sc ? sc.mapId : null;
    if (!this.hasPick()) {
      Sound.se("tap");
      await UI.say([{ name: "ひびの ある いわ", text: "かたい いわに ひびが はいって いる。\nピッケルが あれば ほれそう……" }]);
      return null;
    }
    const R = this.rng(`${mapId}:${U.today()}:${rock ? rock.join(",") : "test"}`);
    const got = key ? { ...this.bone(key), key } : this.pick(D, site || this.siteOf(mapId) || "cave", this.owned(), R);
    const stars = await this.digModal(got, R);
    if (!stars) return null;
    if (rock && mapId) {
      const at = this.dugToday().at; (at[mapId] = at[mapId] || []).push(rock.join(","));
      if (sc.rocks) sc.rocks = sc.rocks.filter(([x, y]) => x !== rock[0] || y !== rock[1]);
    }
    if (got.extra) {
      const x = got.extra;
      Loot.give(x.bag ? { bag: x.bag, n: x.n || 1 } : { coins: x.coins });
      Save.mark(); Save.write();
      await UI.say([{ text: x.text }]);
    } else {
      const first = !this.owned()[got.key];
      this.give(got.key); Save.write();
      await this.card(got, first);
    }
    // ② ほる おねがい（ほねを みせて）
    if (typeof TownFolk !== "undefined") await TownFolk.progress({ do: "dig" }, { name: "", face: "" });
    return got;
  },
  // ほる 画面の 下の 絵（骨は partSvg、おまけは extraSvg）。viewBox の 形の まま canvas に する（キーは 骨 63こ・おまけ 3つ）
  digImage(got) {
    if (got.extra) { const k = this.extraKind(got.extra); return SvgCache.ensure("fossil:extra:" + k, () => this.extraSvg(k), 240, 160); }
    const b = got.dino.art.partBox[got.part.id] || got.dino.art.box, s = 360 / Math.max(b[2], b[3]);
    return SvgCache.ensure("bone:" + got.key, () => FossilArt.partSvg(got.dino, got.part.id), Math.max(24, Math.round(b[2] * s)), Math.max(24, Math.round(b[3] * s)));
  },
  // ほる 画面（見本 ②③。UI.modal ＋ canvas）。タップした マスで こつん（tap）、骨が ぜんぶ 見えたら sparkle。
  // ★（1〜3）を かえす。とちゅうで とじたら 0（いわは のこる。しっぱいは ない）
  async digModal(got, rand) {
    const img = await this.digImage(got), dig = new this.Dig(got.key || "extra", { rand });
    return new Promise((done) => {
      const wrap = U.el("div", { class: "dig-wrap" }), cv = document.createElement("canvas"), info = U.el("div", { class: "dig-info" }), body = U.el("div");
      wrap.append(cv); body.append(wrap, info);
      const name = got.extra ? "なにか でてきた！" : `${got.dino.name}の ${got.part.name}！`;
      let stars = 0, over = false, t = 0, raf = 0, m = null;
      const draw = () => {
        const w = wrap.clientWidth, h = wrap.clientHeight, px = Math.min(3, window.devicePixelRatio || 1);
        if (!w || !h) return;
        if (cv.width !== Math.round(w * px) || cv.height !== Math.round(h * px)) { cv.width = Math.round(w * px); cv.height = Math.round(h * px); }
        const ctx = cv.getContext("2d"); ctx.setTransform(px, 0, 0, px, 0, 0);
        this.drawDig(ctx, w, h, dig, img, t);
      };
      const text = () => {
        info.innerHTML = dig.done ? `<span class="nm"></span><span class="stars">${"★".repeat(stars)}${"☆".repeat(3 - stars)}</span>` : `<span>いわを タップして こつこつ ほろう</span><span class="taps">たたいた かず ${dig.taps}</span>`;
        if (dig.done) info.querySelector(".nm").textContent = name;
      };
      const finish = () => { if (over) return; over = true; cancelAnimationFrame(raf); this.digging = null; const mm = m; m = null; if (mm) mm.close(); done(stars); };
      // ほりだせたら キラキラを すこし 見せてから とじる
      const shine = (t0) => { const loop = (now) => { if (over) return; t = (now - t0) / 700; draw(); if (now - t0 > 1400) finish(); else raf = requestAnimationFrame(loop); }; raf = requestAnimationFrame(loop); };
      const tap = (x, y) => {
        if (over || dig.done) return null;
        const r = dig.tap(U.clamp(x, 0, dig.cols - 1), U.clamp(y, 0, dig.rows - 1));
        Sound.se("tap");
        if (r.done) { stars = r.stars; Sound.se("sparkle"); shine(performance.now()); }
        text(); draw();
        return r;
      };
      cv.addEventListener("pointerdown", (e) => {
        const r = cv.getBoundingClientRect(), pad = 10, cw = (r.width - pad * 2) / dig.cols, ch = (r.height - pad * 2) / dig.rows;
        tap(Math.floor((e.clientX - r.left - pad) / cw), Math.floor((e.clientY - r.top - pad) / ch));
      });
      this.digging = { dig, tap };
      text();
      m = UI.modal({ title: "かせきを ほる", body, onClose: () => { m = null; finish(); } });
      requestAnimationFrame(draw);
    });
  },
  // みつけた カード（見本 ④）: 骨の 絵・なまえ・じだいと ばしょ・あつまりぐあい・骨格の 小さい 絵（ない 骨は 点線）
  card(got, first) {
    return new Promise((done) => {
      const d = got.dino, pr = this.progress(d, this.owned()), body = U.el("div", { class: "bone-card" });
      body.innerHTML = `<div class="art">${first ? '<span class="badge">はじめて！</span>' : ""}${FossilArt.partSvg(d, got.part.id)}</div><div class="nm"></div><div class="dn"></div>`
        + `<div class="prog"><span class="dnm"></span><div class="bar"><i style="width:${Math.round((pr.n / pr.total) * 100)}%"></i></div><span>${pr.n}/${pr.total}</span></div>`
        + FossilArt.svg(d, { have: this.have(d) }).replace("<svg ", '<svg class="mini" ') + `<div class="muted"></div>`;
      body.querySelector(".nm").textContent = `${d.name}の ${got.part.name}`;
      body.querySelector(".dn").textContent = `${d.era}・${d.where}`;
      body.querySelector(".dnm").textContent = d.name;
      body.querySelector(".muted").textContent = pr.done ? (this.museum() ? "ぜんぶ そろった！ はくぶつかんに もって いこう！" : "ぜんぶ そろった！ ノートで 見てみよう！")
        : !first ? `おなじ ほねは これで ${this.st().bones[got.key]}こ。` : this.museum() ? "そろったら はくぶつかんに もって いこう！" : "のこりの ほねも さがそう！";
      if (pr.done) Sound.se("fanfare");
      UI.modal({ title: "ほねを みつけた！", body, onClose: () => done() });
    });
  },
  // おまけ（データの extras）の 絵: キラキラの いし・こはく・アンモナイト（デザインに ないので 作った。viewBox 0 0 96 64）
  extraKind(x) { return /こはく/.test(x.text) ? "amber" : /アンモナイト/.test(x.text) ? "ammonite" : "crystal"; },
  extraSvg(kind) {
    const INK = "#1F1D1B", sw = 'stroke="' + INK + '" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"';
    const body = kind === "amber"
      ? `<path d="M30,50 C18,44 20,26 32,18 C42,11 60,12 68,22 C78,34 72,50 58,54 C48,57 38,55 30,50 Z" fill="#F2B24C" ${sw}/><path d="M34,24 C40,19 50,18 56,21" fill="none" stroke="#FFE3A6" stroke-width="3" stroke-linecap="round"/><path d="M44,38 C48,33 54,33 57,37 M50,35 L49,44" fill="none" stroke="#B8741E" stroke-width="2" stroke-linecap="round"/>`
      : kind === "ammonite"
        ? `<circle cx="48" cy="34" r="22" fill="#E9D8B4" ${sw}/><path d="M48,34 C48,30 54,30 54,35 C54,41 44,42 42,35 C40,27 50,22 57,26 C65,31 64,44 55,49 C45,54 31,48 29,37 C27,26 36,15 48,14" fill="none" ${sw}/><path d="M62,20 L58,25 M68,31 L62,32 M66,44 L60,41 M54,53 L52,47 M38,51 L41,45 M29,42 L35,40" fill="none" stroke="#B9A57E" stroke-width="2" stroke-linecap="round"/>`
        : `<path d="M22,54 L28,30 L38,22 L44,34 L40,54 Z" fill="#C9B8F0" ${sw}/><path d="M38,54 L44,24 L54,12 L64,26 L60,54 Z" fill="#A9D8F4" ${sw}/><path d="M58,54 L64,34 L72,30 L78,40 L74,54 Z" fill="#F4C0DA" ${sw}/><path d="M16,54 L82,54" ${sw}/><path d="M48,22 L52,16 M30,34 L33,29" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round"/><path d="M76,12 l1.6,3.4 3.4,1.6 -3.4,1.6 -1.6,3.4 -1.6,-3.4 -3.4,-1.6 3.4,-1.6 Z" fill="#FFF3A8" stroke="${INK}" stroke-width="1.2"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 64">${body}</svg>`;
  },
};
