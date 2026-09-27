// ④ 化石ほりの 見本の 実装（classic script）。ゲームに 入れるときは js/fossils.js に うつし、data は FOSSIL_DATA を つかう。
// ・FossilRef.rocks  … その日の「ひびの ある いわ」の 場所（マップごとに きまった 数。日づけで かわる）
// ・FossilRef.pick   … ほった ときに 出る もの（骨 70%・おまけ 30%。骨は まだ ない ものが 出やすい）
// ・FossilRef.Dig    … いわを こつこつ たたいて 骨を ほりだす ミニゲーム（しっぱいは ない）
// ・FossilRef.drawDig / rockSvg … ほる 画面と、町に おく いわの 絵
const FossilRef = {
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
  // ある 恐竜の 骨が いくつ そろったか
  progress(dino, own) { const n = dino.art.parts.filter((p) => own[dino.id + "." + p.id]).length; return { n, total: dino.art.parts.length, done: n === dino.art.parts.length }; },

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
  // ほる 画面（canvas）: boneImg は FossilArtRef.partSvg を Image に した もの
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
};
if (typeof module !== "undefined") module.exports = FossilRef;
