// ⑤ 水族館・恐竜博物館の 展示物の 絵（見本の 実装・classic script）。上から 見た 3/4 ビュー（町と 同じ）。
// prop(kind, o) → { w, h, svg }（px。足もとの 左下が 置く マスの 左下。w = マス数 × 32）。ゲームでは WorldArt と 同じ ように y順で 描く。
// o.swim = true の ときは 魚を 描かずに { …, water: [x, y, w, h], slots: [{ id, x, y, w, h, flip }] } を かえす（魚は ゲームが うごかして 描く）。
// 魚は FishArtRef、骨格は FossilArtRef を つかう（先に 読みこんで おく）。SvgCache の キーは kind ＋ 展示の id ＋ 寄贈の ビット（有限）。
// facade(sp) は 町に たつ 建物の 外がわ（WorldArt.building と 同じ 形）、signIcon は かんばんの アイコン（SIGN_ICON と 同じ 形）。
const MuseumArtRef = (() => {
  const TS = 32, INK = "#1F1D1B";
  const r1 = (n) => Math.round(n * 10) / 10;
  const st = (w = 1.6) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const rng = (seed) => { let s = 0; for (const ch of String(seed)) s = (s * 31 + ch.charCodeAt(0)) >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const inner = (svg) => { const m = svg.match(/viewBox="([^"]+)"/), vb = m ? m[1] : "0 0 100 100"; return { vb, body: svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "") }; };
  // svg を (x, y, w, h) の 箱に ぴったり 入れる（よこむきの 魚・骨格）
  const fit = (svg, x, y, w, h, flip = false, op = 1) => { const { vb, body } = inner(svg); return `<svg x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" viewBox="${vb}" preserveAspectRatio="xMidYMid meet" overflow="visible" opacity="${op}">${flip ? `<g transform="translate(${vb.split(" ").map(Number).reduce((a, v, i) => (i === 0 ? v : i === 2 ? a * 2 + v : a), 0)},0) scale(-1,1)">${body}</g>` : body}</svg>`; };
  const THEME = {
    stream: { water: ["#9ED8D0", "#3E8A8A"], bottom: "#8A8272", deco: "stream" }, river: { water: ["#A8DCE4", "#3C7C96"], bottom: "#C8B894", deco: "river" },
    pond: { water: ["#B8D8A8", "#4E7A5A"], bottom: "#6E5E46", deco: "pond" }, sea: { water: ["#8CCCF0", "#1E5C92"], bottom: "#E0CC98", deco: "sea" },
    rocky: { water: ["#A8D8EC", "#2E6E8C"], bottom: "#B8A888", deco: "rocky" }, deep: { water: ["#2E4A7A", "#0C1630"], bottom: "#2A3450", deco: "deep" },
  };
  // 水の 中（前の ガラスの 中）: 魚を ならべて 描く。fish: [{ svg, flip, have }]
  // out（配列）を わたすと 魚は 描かずに 位置だけ 入れる（ゲームで 魚を うごかす とき）
  function waterBox(x, y, w, h, theme, fish, seed, out) {
    const T = THEME[theme], id = "wg" + Math.abs(Math.round(x * 7 + y * 13 + w * 31 + h * 17)) + theme, R = rng(seed || id);
    let s = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.water[0]}"/><stop offset="1" stop-color="${T.water[1]}"/></linearGradient><clipPath id="${id}c"><rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}"/></clipPath></defs>`;
    s += `<g clip-path="url(#${id}c)"><rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" fill="url(#${id})"/>`;
    // ひかりの すじ
    if (theme !== "deep") for (let i = 0; i < Math.max(2, w / 40); i++) { const lx = x + (i + 0.3) * (w / Math.max(2, w / 40)); s += `<path d="M${r1(lx)},${r1(y)} L${r1(lx + 10)},${r1(y)} L${r1(lx + 26)},${r1(y + h)} L${r1(lx + 8)},${r1(y + h)} Z" fill="#FFFFFF" opacity="0.1"/>`; }
    // そこ と かざり
    s += `<path d="M${r1(x)},${r1(y + h)} L${r1(x)},${r1(y + h - 7)} Q${r1(x + w * 0.25)},${r1(y + h - 11)} ${r1(x + w * 0.5)},${r1(y + h - 7)} T${r1(x + w)},${r1(y + h - 8)} L${r1(x + w)},${r1(y + h)} Z" fill="${T.bottom}"/>`;
    const deco = T.deco;
    for (let i = 0; i < Math.max(2, Math.round(w / 34)); i++) {
      const dx = x + 6 + R() * (w - 12), by = y + h - 6;
      if (deco === "stream" || deco === "rocky" || deco === "river") s += `<path d="M${r1(dx - 9)},${r1(by)} Q${r1(dx - 8)},${r1(by - 9)} ${r1(dx)},${r1(by - 10)} Q${r1(dx + 9)},${r1(by - 8)} ${r1(dx + 10)},${r1(by)} Z" fill="${deco === "river" ? "#A8A08C" : "#8C8272"}" ${st(1.2)}/>`;
      if (deco === "river" || deco === "pond" || deco === "stream") s += `<path d="M${r1(dx + 12)},${r1(by)} Q${r1(dx + 8)},${r1(by - 14)} ${r1(dx + 14)},${r1(by - 24)} M${r1(dx + 14)},${r1(by)} Q${r1(dx + 18)},${r1(by - 12)} ${r1(dx + 15)},${r1(by - 20)}" fill="none" stroke="#5FA24F" stroke-width="2.2" stroke-linecap="round"/>`;
      if (deco === "sea") { s += `<path d="M${r1(dx)},${r1(by)} C${r1(dx - 6)},${r1(by - 12)} ${r1(dx + 6)},${r1(by - 18)} ${r1(dx)},${r1(by - 30)}" fill="none" stroke="#6E9A4A" stroke-width="3" stroke-linecap="round"/><path d="M${r1(dx + 10)},${r1(by)} q-3,-8 2,-12 q4,-3 1,-9" fill="none" stroke="#E07A7A" stroke-width="3" stroke-linecap="round"/>`; }
      if (deco === "deep") s += `<circle cx="${r1(dx)}" cy="${r1(y + 6 + R() * (h - 20))}" r="1.2" fill="#BFE8FF" opacity="0.8"/><circle cx="${r1(dx + 8)}" cy="${r1(y + 10 + R() * (h - 24))}" r="0.9" fill="#FFFFFF" opacity="0.6"/>`;
    }
    if (theme === "stream") s += `<path d="M${r1(x + 4)},${r1(y)} L${r1(x + 12)},${r1(y)} L${r1(x + 14)},${r1(y + h - 8)} L${r1(x + 2)},${r1(y + h - 8)} Z" fill="#FFFFFF" opacity="0.45"/><path d="M${r1(x + 6)},${r1(y + 4)} L${r1(x + 7)},${r1(y + h - 10)} M${r1(x + 10)},${r1(y + 6)} L${r1(x + 11)},${r1(y + h - 10)}" stroke="#FFFFFF" stroke-width="1.4" opacity="0.8"/>`;
    // あわ
    for (let i = 0; i < 5; i++) s += `<circle cx="${r1(x + 8 + R() * (w - 16))}" cy="${r1(y + 6 + R() * (h - 18))}" r="${r1(1 + R() * 1.4)}" fill="none" stroke="#FFFFFF" stroke-width="0.9" opacity="0.7"/>`;
    // 魚（いる ものは 色、いない ものは なにも 描かない。大きい 魚は 大きく）
    const have = fish.filter((f) => f.have), n = have.length;
    have.forEach((f, i) => {
      const k = f.scale || 1, fw = Math.min(w * 0.5, Math.max(22, (w / Math.max(2, n)) * 1.1) * k), fh = fw * 0.5, fx = x + ((i + 0.5) / n) * w - fw / 2 + (R() - 0.5) * 8, fy = y + 6 + ((i * 0.37 + R() * 0.4) % 1) * (h - fh - 16), flip = R() < 0.5 && !f.noflip;
      if (out) out.push({ id: f.id, x: r1(fx), y: r1(fy), w: r1(fw), h: r1(fh), flip }); else s += fit(f.svg, fx, fy, fw, fh, flip);
    });
    if (out) out.water = [r1(x), r1(y), r1(w), r1(h)];
    s += `</g>`;
    return s;
  }
  // ガラスの ふち（くろい わく・つや）
  const glass = (x, y, w, h, col = "#3A3E44") => `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" fill="none" stroke="${col}" stroke-width="3.2" rx="2"/><rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" fill="none" ${st(1.4)} rx="2"/><path d="M${r1(x + 6)},${r1(y + 4)} L${r1(x + w * 0.3)},${r1(y + 4)} M${r1(x + w - 14)},${r1(y + h - 5)} L${r1(x + w - 5)},${r1(y + h - 5)}" stroke="#FFFFFF" stroke-width="2" opacity="0.5" stroke-linecap="round"/>`;
  // 名前の ふだ
  const plate = (x, y, w, text, dark) => `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="12" rx="3" fill="${dark ? "#2E3A56" : "#FFF7E0"}" ${st(1.2)}/><text x="${r1(x + w / 2)}" y="${r1(y + 9)}" font-size="7.5" font-weight="800" fill="${dark ? "#EAF2FF" : "#3C352E"}" text-anchor="middle" font-family="'M PLUS Rounded 1c','Noto Sans CJK JP',sans-serif">${text}</text>`;

  function prop(kind, o = {}) {
    const W = (o.w || 1) * TS, Hf = (o.h || 1) * TS, slots = o.swim ? [] : null;
    let h = Hf, s = "";
    if (kind === "walltank" || kind === "islandtank") {
      // かべの すいそう（まえから 見た まど）・しまの すいそう（上の 水めんも 見える）
      const top = kind === "islandtank" ? 14 : 0, over = o.over == null ? 26 : o.over; h = Hf + over;
      const gx = 4, gy = top + 4, gw = W - 8, gh = h - top - (kind === "islandtank" ? 22 : 18);
      if (kind === "islandtank") { s += `<path d="M2,${top} L${W - 2},${top} L${W - 2},${h - 4} L2,${h - 4} Z" fill="#5E6670" ${st(1.8)}/><path d="M2,${top} L8,2 L${W - 8},2 L${W - 2},${top} Z" fill="${THEME[o.theme].water[0]}" ${st(1.6)}/><path d="M12,6 q6,-2 12,0 M${W - 30},7 q6,-2 12,0" stroke="#FFFFFF" stroke-width="1.4" fill="none" opacity="0.8"/>`; s += `<rect x="4" y="${r1(h - 20)}" width="${W - 8}" height="14" fill="#7A828C" ${st(1.4)}/>`; }
      else s += `<rect x="0" y="0" width="${W}" height="${h - 6}" fill="#6E747C" ${st(1.8)}/>`;
      s += waterBox(gx, gy, gw, gh, o.theme, o.fish || [], o.id, slots) + glass(gx, gy, gw, gh);
      if (o.label) s += plate(W / 2 - Math.min(W - 10, o.label.length * 8 + 12) / 2, h - 16, Math.min(W - 10, o.label.length * 8 + 12), o.label, o.theme === "deep");
      if (o.falls) s += `<path d="M${r1(gx + 2)},${r1(gy - 2)} L${r1(gx + 16)},${r1(gy - 2)}" stroke="#DFF6FF" stroke-width="3" stroke-linecap="round"/>`;
    } else if (kind === "bigtank") {
      // 大水槽: 上から 見た 水めん ＋ 手前の 大きな ガラス
      const depth = o.depth || 70; h = Hf + depth;
      const topH = Hf - 10;
      s += `<defs><linearGradient id="bt${o.id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9ED8F4"/><stop offset="1" stop-color="#4E9CD0"/></linearGradient></defs>`;
      s += `<rect x="0" y="0" width="${W}" height="${topH}" fill="url(#bt${o.id})" ${st(2.4)}/>`;
      const R = rng(o.id + "wave"); for (let i = 0; i < W * topH / 900; i++) { const x = 10 + R() * (W - 20), y = 8 + R() * (topH - 16); s += `<path d="M${r1(x)},${r1(y)} q5,-3 10,0 q5,3 10,0" fill="none" stroke="#FFFFFF" stroke-width="1.4" opacity="0.55"/>`; }
      // 上から 見える 大きな 魚の かげ
      for (const [k, f] of (o.fish || []).filter((f) => f.have && f.big).entries()) s += fit(f.svg, W * (0.2 + k * 0.3), topH * 0.3, W * 0.22, W * 0.11, false, 0.35);
      s += `<rect x="0" y="${topH}" width="${W}" height="${depth + 10}" fill="#4E565E" ${st(2)}/>`;
      s += waterBox(6, topH + 6, W - 12, depth - 4, "sea", o.fish || [], o.id, slots) + glass(6, topH + 6, W - 12, depth - 4);
      for (let i = 1; i < Math.round(W / 64); i++) s += `<rect x="${r1(6 + ((W - 12) * i) / Math.round(W / 64) - 2)}" y="${topH + 6}" width="4" height="${depth - 4}" fill="#3A3E44"/>`;
      if (o.label) s += plate(W / 2 - 70, topH - 22, 140, o.label);
    } else if (kind === "lowtank") {
      // いその ひくい すいそう（こどもの 目の 高さ）
      h = Hf + 12; s += `<path d="M2,12 L${W - 2},12 L${W - 2},${h - 3} L2,${h - 3} Z" fill="#8C7A62" ${st(1.8)}/><path d="M2,12 L6,2 L${W - 6},2 L${W - 2},12 Z" fill="#8FD0E8" ${st(1.6)}/>`;
      const R = rng(o.id + "rock"); for (let i = 0; i < W / 26; i++) { const x = 10 + R() * (W - 20); s += `<ellipse cx="${r1(x)}" cy="${r1(6 + R() * 5)}" rx="5" ry="2.4" fill="#A89878" ${st(1)}/>`; }
      s += waterBox(5, 15, W - 10, h - 34, "rocky", o.fish || [], o.id, slots) + glass(5, 15, W - 10, h - 34);
      if (o.label) s += plate(W / 2 - 40, h - 16, 80, o.label);
    } else if (kind === "pedestal" || kind === "jelly") {
      // まるい すいそう（シーラカンス・くらげ）
      h = Hf + 44; const cx = W / 2, rx = W / 2 - 4;
      s += `<defs><linearGradient id="pd${o.id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${kind === "jelly" ? "#3E5A9A" : "#2E4A7A"}"/><stop offset="1" stop-color="#0E1A36"/></linearGradient></defs>`;
      s += `<path d="M${r1(cx - rx)},10 L${r1(cx - rx)},${h - 20} A${r1(rx)},8 0 0 0 ${r1(cx + rx)},${h - 20} L${r1(cx + rx)},10 Z" fill="url(#pd${o.id})" ${st(2)}/><ellipse cx="${r1(cx)}" cy="10" rx="${r1(rx)}" ry="8" fill="#6E8ACA" ${st(1.8)}/>`;
      if (kind === "jelly") { const R = rng(o.id); for (let i = 0; i < 5; i++) { const x = cx - rx * 0.6 + R() * rx * 1.2, y = 26 + R() * (h - 70); s += `<path d="M${r1(x - 8)},${r1(y)} Q${r1(x)},${r1(y - 11)} ${r1(x + 8)},${r1(y)} Z" fill="#FFFFFF" opacity="0.75" ${st(0.8)}/><path d="M${r1(x - 5)},${r1(y)} q-2,8 1,14 M${r1(x)},${r1(y)} q2,9 -1,15 M${r1(x + 5)},${r1(y)} q2,8 -1,13" stroke="#FFFFFF" stroke-width="0.9" fill="none" opacity="0.6"/><circle cx="${r1(x)}" cy="${r1(y - 4)}" r="2.2" fill="#F4B8D8" opacity="0.8"/>`; } }
      else if (o.fish && o.fish[0] && o.fish[0].have) s += fit(o.fish[0].svg, cx - rx * 0.85, h * 0.32, rx * 1.7, rx * 0.85);
      else s += `<text x="${r1(cx)}" y="${r1(h * 0.5)}" font-size="16" font-weight="900" fill="#FFFFFF" opacity="0.5" text-anchor="middle">？</text>`;
      s += `<path d="M${r1(cx - rx * 0.6)},16 L${r1(cx - rx * 0.4)},${h - 30}" stroke="#FFFFFF" stroke-width="3" opacity="0.2"/><rect x="${r1(cx - rx - 2)}" y="${h - 22}" width="${r1(rx * 2 + 4)}" height="16" rx="3" fill="#3A3E44" ${st(1.6)}/>`;
      if (o.label) s += plate(cx - 44, h - 19, 88, o.label, true);
      if (kind === "pedestal") s += `<path d="M${r1(cx)},-40 L${r1(cx - rx - 6)},14 L${r1(cx + rx + 6)},14 Z" fill="#FFF6C8" opacity="0.18"/>`;
    } else if (kind === "stand") {
      // 骨格の 台（ロープの さく ＋ 名前の ふだ）
      const dino = o.dino, skel = FossilArtRef.svg(dino, { have: o.have, stand: false }), vb = inner(skel).vb.split(" ").map(Number), ar = vb[3] / vb[2], sw = W - 12, sh = sw * ar; h = Hf + sh - 10;
      s += `<path d="M4,${r1(h - Hf + 10)} L${W - 4},${r1(h - Hf + 10)} L${W - 2},${h - 6} L2,${h - 6} Z" fill="#B89A74" ${st(1.8)}/><rect x="2" y="${h - 12}" width="${W - 4}" height="8" fill="#8C7458" ${st(1.4)}/>`;
      s += `<path d="M10,${r1(h - Hf + 14)} L${W - 10},${r1(h - Hf + 14)}" stroke="#D8C0A0" stroke-width="1.4" opacity="0.8"/>`;
      s += fit(skel, 6, h - Hf + 14 - sh, sw, sh);
      // ロープ
      for (const px of [3, W - 3]) s += `<path d="M${px},${h - 6} L${px},${h - 22}" stroke="#C9A24A" stroke-width="2.4" stroke-linecap="round"/><circle cx="${px}" cy="${h - 23}" r="2.4" fill="#E0C060" ${st(1)}/>`;
      s += `<path d="M3,${h - 20} Q${W / 2},${h - 12} ${W - 3},${h - 20}" fill="none" stroke="#C84A4A" stroke-width="2"/>`;
      if (o.label) s += plate(W / 2 - 44, h - 16, 88, o.label);
      if (o.left) s += `<rect x="${W - 40}" y="${r1(h - Hf + 16)}" width="34" height="12" rx="6" fill="#E35D5B" ${st(1.1)}/><text x="${W - 23}" y="${r1(h - Hf + 25)}" font-size="7.5" font-weight="900" fill="#FFF" text-anchor="middle">あと ${o.left}</text>`;
    } else if (kind === "fossilwall") {
      // かせきの かべ（いわに うまった 化石）
      h = Hf + 30; s += `<rect x="0" y="0" width="${W}" height="${h - 6}" fill="#B8A88E" ${st(1.8)}/>`;
      const R = rng(o.id); for (let i = 0; i < W / 8; i++) s += `<path d="M${r1(R() * W)},${r1(4 + R() * (h - 14))} l${r1(4 + R() * 6)},${r1(-1 + R() * 2)}" stroke="#9A8A70" stroke-width="1.2" opacity="0.7"/>`;
      const cx = W / 2, cy = (h - 6) / 2, k = o.fossil;
      if (k === "ammonite") { s += `<circle cx="${cx}" cy="${cy}" r="15" fill="#D8C8A8" ${st(1.6)}/>`; for (let i = 0; i < 9; i++) { const a = i * 0.7, r = 14 - i * 1.4; s += `<path d="M${r1(cx + Math.cos(a) * r)},${r1(cy + Math.sin(a) * r)} L${r1(cx + Math.cos(a) * (r - 4))},${r1(cy + Math.sin(a) * (r - 4))}" stroke="${INK}" stroke-width="1"/>`; } s += `<path d="M${cx},${cy} m-3,0 a3,3 0 1,1 6,0 a6,6 0 1,1 -12,0 a9,9 0 1,1 18,0 a12,12 0 1,1 -24,0" fill="none" ${st(1.2)}/>`; }
      else if (k === "fishfossil") { s += `<path d="M${cx - 22},${cy} Q${cx - 6},${cy - 11} ${cx + 12},${cy - 3} L${cx + 22},${cy - 9} L${cx + 20},${cy} L${cx + 22},${cy + 9} L${cx + 12},${cy + 3} Q${cx - 6},${cy + 11} ${cx - 22},${cy} Z" fill="#D8C8A8" ${st(1.4)}/>`; for (let i = 0; i < 8; i++) s += `<path d="M${cx - 12 + i * 3},${cy - 6} L${cx - 13 + i * 3},${cy + 6}" stroke="${INK}" stroke-width="0.9"/>`; }
      else if (k === "footprint") { for (const [dx, dy] of [[-14, 6], [4, -6]]) s += `<path d="M${cx + dx},${cy + dy} l-6,-9 M${cx + dx},${cy + dy} l0,-11 M${cx + dx},${cy + dy} l6,-9" stroke="#5E4E3A" stroke-width="4" stroke-linecap="round"/><ellipse cx="${cx + dx}" cy="${cy + dy + 2}" rx="4" ry="3" fill="#5E4E3A"/>`; }
      else if (k === "amber") { s += `<path d="M${cx - 12},${cy + 8} Q${cx - 16},${cy - 8} ${cx},${cy - 12} Q${cx + 16},${cy - 8} ${cx + 12},${cy + 8} Z" fill="#E8A840" ${st(1.4)}/><path d="M${cx - 3},${cy - 2} l6,0 M${cx},${cy - 5} l0,6 M${cx - 5},${cy - 4} l2,2 M${cx + 5},${cy - 4} l-2,2" stroke="#5E3A10" stroke-width="1.2"/><path d="M${cx - 8},${cy - 5} q3,-3 7,-3" stroke="#FFF" stroke-width="1.4" fill="none" opacity="0.7"/>`; }
      else if (k === "trilobite") { s += `<ellipse cx="${cx}" cy="${cy}" rx="11" ry="15" fill="#D8C8A8" ${st(1.4)}/><path d="M${cx - 11},${cy - 6} Q${cx},${cy - 16} ${cx + 11},${cy - 6}" fill="none" ${st(1.2)}/>`; for (let i = 0; i < 6; i++) s += `<path d="M${cx - 10},${cy - 2 + i * 3} L${cx + 10},${cy - 2 + i * 3}" stroke="${INK}" stroke-width="0.8"/>`; s += `<path d="M${cx - 3},${cy - 10} L${cx - 3},${cy + 13} M${cx + 3},${cy - 10} L${cx + 3},${cy + 13}" stroke="${INK}" stroke-width="0.9"/>`; }
      if (o.label) s += plate(W / 2 - 34, h - 18, 68, o.label);
    } else if (kind === "tower") {
      // きょうりゅうの とう（ふくいの 恐竜の もけいを つみあげた とう）
      h = Hf + 120; s += `<rect x="${W / 2 - 6}" y="10" width="12" height="${h - 20}" fill="#C0C4C8" ${st(1.6)}/>`;
      const cols = ["#8CC26B", "#E8A840", "#6EA8D8", "#E07A7A", "#B58CD8"];
      for (let i = 0; i < 5; i++) { const y = 18 + i * ((h - 40) / 5), c = cols[i], sx = i % 2 ? -1 : 1, x = W / 2 + sx * 8; s += `<g transform="translate(${r1(x)},${r1(y)}) scale(${sx},1)"><path d="M0,10 C4,2 14,0 22,4 C28,6 30,12 26,14 C34,16 40,20 44,24 C36,24 28,22 22,20 L20,28 L16,28 L16,20 C10,20 4,16 0,10 Z" fill="${c}" ${st(1.4)}/><circle cx="22" cy="7" r="1.4" fill="${INK}"/></g>`; }
      s += `<rect x="${W / 2 - 22}" y="${h - 14}" width="44" height="10" rx="3" fill="#6E747C" ${st(1.4)}/>`;
    } else if (kind === "nest") {
      h = Hf + 10; s += `<ellipse cx="${W / 2}" cy="${h - 16}" rx="${W / 2 - 4}" ry="${Hf / 2 - 2}" fill="#A8845A" ${st(1.8)}/><ellipse cx="${W / 2}" cy="${h - 20}" rx="${W / 2 - 12}" ry="${Hf / 2 - 10}" fill="#7A5E3E"/>`;
      for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2, x = W / 2 + Math.cos(a) * (W / 2 - 22), y = h - 22 + Math.sin(a) * (Hf / 2 - 14); s += `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="7" ry="9" fill="#F0E6D0" ${st(1.3)}/><path d="M${r1(x - 3)},${r1(y - 4)} l2,2" stroke="#C8B89A" stroke-width="1.2"/>`; }
      if (o.label) s += plate(W / 2 - 36, h - 12, 72, o.label);
    } else if (kind === "lab") {
      // けんきゅうしつの まど（化石を きれいに する ようす）
      h = Hf + 30; s += `<rect x="0" y="0" width="${W}" height="${h - 6}" fill="#E8EEF2" ${st(1.8)}/><rect x="6" y="6" width="${W - 12}" height="${h - 30}" fill="#CFE6F2" ${st(1.4)}/>`;
      s += `<rect x="16" y="${h - 46}" width="${W - 32}" height="10" fill="#C8A070" ${st(1.3)}/>` + (o.bone ? fit(o.bone, 26, h - 70, W - 52, 26) : "") + `<path d="M${W - 30},${h - 60} l10,-16 l6,4" fill="none" ${st(1.4)}/><circle cx="${W - 20}" cy="${h - 78}" r="6" fill="#FFF3A8" ${st(1.2)}/>`;
      if (o.label) s += plate(W / 2 - 40, h - 20, 80, o.label);
    } else if (kind === "desk") {
      h = Hf + 18; s += `<path d="M0,18 L${W},18 L${W},${h - 4} L0,${h - 4} Z" fill="#C8A070" ${st(1.8)}/><path d="M0,18 L4,8 L${W - 4},8 L${W},18 Z" fill="#E0C090" ${st(1.6)}/><rect x="${W / 2 - 14}" y="${h - 26}" width="28" height="10" rx="2" fill="#FFF7E0" ${st(1.1)}/>`;
      if (o.label) s += plate(W / 2 - 30, 24, 60, o.label);
    } else if (kind === "shelf") {
      h = Hf + 30; s += `<rect x="2" y="0" width="${W - 4}" height="${h - 6}" fill="#B88A5A" ${st(1.8)}/>`;
      const R = rng(o.id), cols = ["#F48FB1", "#8FD0F0", "#FFD54F", "#8BCB6B", "#B58CD8"];
      for (let row = 0; row < 3; row++) { const y = 10 + row * ((h - 16) / 3); s += `<rect x="6" y="${r1(y + (h - 16) / 3 - 6)}" width="${W - 12}" height="4" fill="#8C6A42"/>`; for (let i = 0; i < W / 16; i++) { const x = 10 + i * 15, c = cols[Math.floor(R() * cols.length)]; s += `<circle cx="${x}" cy="${r1(y + (h - 16) / 3 - 13)}" r="5.5" fill="${c}" ${st(1)}/><circle cx="${x - 2}" cy="${r1(y + (h - 16) / 3 - 14)}" r="0.9" fill="${INK}"/><circle cx="${x + 2}" cy="${r1(y + (h - 16) / 3 - 14)}" r="0.9" fill="${INK}"/>`; } }
    } else if (kind === "bench") { h = Hf; s += `<rect x="3" y="8" width="${W - 6}" height="8" rx="2" fill="#C8A070" ${st(1.4)}/><rect x="6" y="16" width="4" height="10" fill="#6E5E48"/><rect x="${W - 10}" y="16" width="4" height="10" fill="#6E5E48"/>`; }
    else if (kind === "plant") { h = Hf + 16; s += `<path d="M9,${h - 3} L${W - 9},${h - 3} L${W - 11},${h - 14} L11,${h - 14} Z" fill="#E0B070" ${st(1.4)}/>`; for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * 0.4; s += `<path d="M${W / 2},${h - 14} Q${r1(W / 2 + Math.cos(a) * 10)},${r1(h - 26 + Math.sin(a) * 6)} ${r1(W / 2 + Math.cos(a) * 16)},${r1(h - 20 + Math.sin(a) * 22)}" fill="none" stroke="#4E8A3E" stroke-width="4" stroke-linecap="round"/>`; } }
    else if (kind === "sign") { h = Hf + 26; s += `<rect x="${W / 2 - 2}" y="18" width="4" height="${h - 20}" fill="#6E6A66"/><rect x="2" y="0" width="${W - 4}" height="22" rx="5" fill="${o.col || "#FFF7E0"}" ${st(1.6)}/><text x="${W / 2}" y="15" font-size="10" font-weight="900" fill="${o.fg || "#3C352E"}" text-anchor="middle" font-family="'M PLUS Rounded 1c','Noto Sans CJK JP',sans-serif">${o.text || ""}</text>`; }
    else if (kind === "pillar") { h = Hf + 40; s += `<rect x="6" y="0" width="${W - 12}" height="${h - 4}" fill="#E8E2D6" ${st(1.6)}/><path d="M10,6 L10,${h - 10}" stroke="#FFFFFF" stroke-width="2" opacity="0.7"/>`; }
    else if (kind === "escalator") { h = Hf + 12; s += `<rect x="2" y="0" width="${W - 4}" height="${h - 2}" fill="#8C949C" ${st(1.8)}/>`; for (let i = 0; i < Hf / 6; i++) s += `<path d="M8,${r1(8 + i * 6)} L${W - 8},${r1(8 + i * 6)}" stroke="#5E666E" stroke-width="2"/>`; s += `<rect x="2" y="0" width="6" height="${h - 2}" fill="#3A3E44"/><rect x="${W - 8}" y="0" width="6" height="${h - 2}" fill="#3A3E44"/>`; }
    else if (kind === "tunnel") {
      // アクアトンネル（通路の 上の とうめいな トンネル: 水と 魚の かげが 見える）
      h = Hf; s += `<defs><linearGradient id="tn${o.id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2E6E9E"/><stop offset="0.5" stop-color="#8CCCF0" stop-opacity="0.35"/><stop offset="1" stop-color="#2E6E9E"/></linearGradient></defs><rect x="0" y="0" width="${W}" height="${h}" fill="url(#tn${o.id})"/>`;
      for (let y = 0; y < h; y += 48) s += `<path d="M0,${y} Q${W / 2},${y - 10} ${W},${y}" fill="none" stroke="#DFF3FF" stroke-width="2" opacity="0.7"/>`;
      const R = rng(o.id); for (let i = 0; i < h / 60; i++) { const x = 8 + R() * (W - 16), y = 10 + R() * (h - 20); s += `<path d="M${r1(x)},${r1(y)} q8,-5 16,0 l5,-4 l0,8 l-5,-4 q-8,5 -16,0 Z" fill="#1B3A4B" opacity="0.35"/>`; }
    } else if (kind === "arrow") { h = Hf; const a = o.dir || 0; s += `<g transform="translate(${W / 2} ${Hf / 2}) rotate(${a})"><path d="M-8,4 L0,-6 L8,4 L3,4 L3,9 L-3,9 L-3,4 Z" fill="#FFFFFF" opacity="0.55"/></g>`; }
    const out = { w: W, h, svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${r1(h)}" overflow="visible">${s}</svg>` };
    if (slots && slots.water) { out.slots = slots.slice(); out.water = slots.water; }
    return out;
  }
  // かんばんの アイコン（町の 建物の SIGN_ICON と 同じ 形: (x, y) が まんなか）
  const signIcon = {
    aquarium: (x, y) => `<path d="M${x - 9},${y} C${x - 5},${y - 7} ${x + 3},${y - 7} ${x + 6},${y - 1} L${x + 11},${y - 5} L${x + 10},${y} L${x + 11},${y + 5} L${x + 6},${y + 1} C${x + 3},${y + 7} ${x - 5},${y + 7} ${x - 9},${y} Z" fill="#7EC8F0" ${st(1.2)}/><circle cx="${x - 4}" cy="${y - 1}" r="1.2" fill="${INK}"/><path d="M${x},${y - 4} Q${x + 2},${y} ${x},${y + 4}" fill="none" stroke="#FFFFFF" stroke-width="1.2"/>`,
    museum: (x, y) => [[-7, -2.6], [-7, 2.6], [7, -2.6], [7, 2.6]].map(([dx, dy]) => `<circle cx="${x + dx}" cy="${y + dy}" r="3.1" fill="#FFF3DA" ${st(1.2)}/>`).join("") + `<rect x="${x - 7}" y="${y - 2}" width="14" height="4" fill="#FFF3DA" ${st(1.2)}/><rect x="${x - 7.6}" y="${y - 1.4}" width="15.2" height="2.8" fill="#FFF3DA"/>`,
  };
  // 町に たつ 建物の 外がわ（WorldArt.building と 同じ 形: sp = { w, h, door, roof, facility }）→ { w, h, top, svg }
  // ゲームでは world-art.js の tower と 同じ ように WorldArt.building を つつんで、sp.facility が ある ときだけ これを つかう
  function facade(sp) {
    const W = sp.w * TS, H = sp.h * TS, top = 10, dx = (sp.door + 0.5) * TS, kind = sp.facility;
    let s = `<ellipse cx="${W / 2}" cy="${H - 1}" rx="${W / 2 - 2}" ry="4" fill="${INK}" fill-opacity="0.12"/>`;
    if (kind === "aquarium") {
      // ガラスの ドーム ＋ なみの おび ＋ まるい まど ＋ 大きな ガラスの 入口
      const wy = top + 46, gid = "aqf" + sp.w + "x" + sp.h, rx = W / 2 - 6, ry = wy - top + 2;
      s += `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#BFE9FA"/><stop offset="1" stop-color="#4AA3D8"/></linearGradient></defs>`;
      s += `<rect x="4" y="${wy}" width="${W - 8}" height="${H - wy - 2}" fill="#F2FAFA" ${st()}/>`;
      // ガラスの ドーム（半分の だ円）と ほねぐみ（おなじ 高さで はばの ちがう だ円）
      s += `<path d="M6,${wy + 2} A${rx},${ry} 0 0 1 ${W - 6},${wy + 2} Z" fill="url(#${gid})" ${st()}/>`;
      for (const k of [0.34, 0.68]) s += `<path d="M${r1(W / 2 - rx * k)},${wy + 2} A${r1(rx * k)},${ry} 0 0 1 ${r1(W / 2 + rx * k)},${wy + 2}" fill="none" stroke="#FFFFFF" stroke-width="1.3" opacity="0.7"/>`;
      s += `<path d="M${W / 2},${wy + 2} L${W / 2},${wy + 2 - ry}" stroke="#FFFFFF" stroke-width="1.3" opacity="0.7"/><path d="M${r1(W / 2 - rx * 0.92)},${r1(wy - ry * 0.38)} Q${W / 2},${r1(wy - ry * 0.52)} ${r1(W / 2 + rx * 0.92)},${r1(wy - ry * 0.38)}" fill="none" stroke="#FFFFFF" stroke-width="1.3" opacity="0.6"/>`;
      s += `<path d="M${r1(W * 0.16)},${wy - 6} A${r1(rx * 0.8)},${r1(ry * 0.86)} 0 0 1 ${r1(W * 0.38)},${r1(wy - ry * 0.78)}" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity="0.8"/>`;
      // ドームの 中を およぐ 魚の かげ
      for (const [fx, fy, k] of [[W * 0.27, wy - 20, 1], [W * 0.72, wy - 28, 0.7], [W * 0.62, wy - 12, 0.55]]) s += `<path transform="translate(${r1(fx)},${r1(fy)}) scale(${k})" d="M-16,0 C-10,-8 4,-8 10,-1 L17,-6 L15,0 L17,6 L10,1 C4,8 -10,8 -16,0 Z" fill="#2E6E9E" opacity="0.5"/>`;
      // なみの おび
      let wv = `M4,${wy + 14}`; for (let x = 4; x < W - 4; x += 16) wv += ` q4,-5 8,0 q4,5 8,0`;
      s += `<path d="${wv} L${W - 4},${wy + 22} L4,${wy + 22} Z" fill="#8FD0F0" ${st(1.2)}/>`;
      // まるい まど
      for (let i = 0; i < sp.w; i++) { const x = (i + 0.5) * TS; if (Math.abs(x - dx) < TS * 1.4) continue; s += `<circle cx="${x}" cy="${wy + 38}" r="9" fill="#BFE6FF" ${st(1.4)}/><path d="M${x - 4},${wy + 35} q3,-3 7,-2" fill="none" stroke="#FFFFFF" stroke-width="1.6"/>`; }
      // 入口（ガラスの 2まいとびら）と かんばん
      s += `<path d="M${dx - 22},${H - 4} L${dx - 22},${H - 30} Q${dx},${H - 50} ${dx + 22},${H - 30} L${dx + 22},${H - 4} Z" fill="#9FD8F0" ${st(1.6)}/><path d="M${dx},${H - 40} L${dx},${H - 4} M${dx - 22},${H - 26} L${dx + 22},${H - 26}" stroke="#FFFFFF" stroke-width="1.6"/>`;
      s += `<rect x="${dx - 26}" y="${H - 4}" width="52" height="4" rx="1" fill="#8C949C" ${st(1)}/>`;
      s += `<rect x="${dx - 17}" y="${wy - 22}" width="34" height="22" rx="6" fill="#FFF7E0" ${st(1.6)}/>` + signIcon.aquarium(dx, wy - 11);
    } else if (kind === "museum") {
      // さんかくの 屋根（ペディメント）＋ はしら ＋ かいだん ＋ 屋根の うしろから のぞく ブラキオサウルスの 像
      const ry = top + 34, cy = ry + 10;
      s += `<path d="M${W - 50},${ry - 4} C${W - 46},${top - 26} ${W - 30},${top - 34} ${W - 20},${top - 30} C${W - 12},${top - 28} ${W - 10},${top - 20} ${W - 18},${top - 18} C${W - 26},${top - 17} ${W - 30},${top - 12} ${W - 32},${ry - 4} Z" fill="#9CC08A" ${st(1.6)}/><circle cx="${W - 20}" cy="${top - 25}" r="1.6" fill="${INK}"/><path d="M${W - 16},${top - 20} q-3,2 -6,1" fill="none" ${st(1.2)}/>`;
      s += `<rect x="6" y="${cy}" width="${W - 12}" height="${H - cy - 10}" fill="#F3E7CC" ${st()}/>`;
      s += `<path d="M0,${ry} L${W / 2},${top - 4} L${W},${ry} Z" fill="#D9B47A" ${st()}/><path d="M22,${ry - 5} L${W / 2},${top + 8} L${W - 22},${ry - 5} Z" fill="#E8CC96" ${st(1.2)}/>`;
      s += `<rect x="0" y="${ry}" width="${W}" height="10" fill="#FFF8E8" ${st(1.6)}/>`;
      s += `<circle cx="${W / 2}" cy="${ry - 12}" r="10" fill="#FFF7E0" ${st(1.4)}/>` + signIcon.museum(W / 2, ry - 12);
      // はしら（入口の まえは あける）
      const n = sp.w + 1;
      for (let i = 0; i < n; i++) { const x = 14 + ((W - 28) * i) / (n - 1); if (Math.abs(x - dx) < 18) continue; s += `<rect x="${r1(x - 6)}" y="${cy}" width="12" height="${H - cy - 16}" fill="#FFFDF6" ${st(1.4)}/><rect x="${r1(x - 8)}" y="${cy}" width="16" height="4" fill="#EFE3C8" ${st(1)}/><path d="M${r1(x - 2)},${cy + 6} L${r1(x - 2)},${H - 20} M${r1(x + 2)},${cy + 6} L${r1(x + 2)},${H - 20}" stroke="#E0D2B4" stroke-width="1"/>`; }
      // とびらと かいだん
      s += `<rect x="${dx - 14}" y="${H - 44}" width="28" height="34" rx="2" fill="#A8743F" ${st(1.6)}/><path d="M${dx},${H - 44} L${dx},${H - 10}" stroke="#7A5230" stroke-width="1.4"/><circle cx="${dx - 4}" cy="${H - 26}" r="1.4" fill="#F7C948"/><circle cx="${dx + 4}" cy="${H - 26}" r="1.4" fill="#F7C948"/>`;
      s += `<rect x="2" y="${H - 10}" width="${W - 4}" height="5" fill="#E2D6BC" ${st(1.2)}/><rect x="-2" y="${H - 5}" width="${W + 4}" height="5" fill="#D2C4A6" ${st(1.2)}/>`;
    }
    return { w: W, h: H + top, top, svg: s };
  }
  return { prop, THEME, facade, signIcon };
})();
if (typeof module !== "undefined") module.exports = MuseumArtRef;
