// ⑤ 水族館と 恐竜博物館（docs/design/features/museum の 見本。絵は MuseumArt、床と かべは 見本 tools/feature-design/museum-render.mjs と おなじ）。
// 1番: 町の 建物から 入る 館の マップ（MAP_DEFS.aquarium / MAP_DEFS.museum）・床と かべ・展示（寄贈の ようすで 絵が かわる）・順路の 矢印・へやの 案内・BGM。
// 2番: 館の 人に 寄贈（いけすの 魚・もって いる 骨）・かんせい・寄贈した 魚が 水そうで およぐ。
// 3番: 展示を しらべる（水そう → 中の 魚と ③ の ずかん・骨格の 台 → ④ の くわしい ページ・かざり → info の 説明）・② への しらせ。
// データは MUSEUM_DATA（自動生成）、セーブは Save.d.museum（{ fish, bones, done, rooms, all }）。
const Museum = {
  data() { return typeof MUSEUM_DATA !== "undefined" ? MUSEUM_DATA : null; },
  building(mapId) { return ((this.data() || {}).buildings || {})[mapId] || null; },
  st() { return Save.d.museum; },
  // 展示を id で（2つの 館で id は かさならない）
  object(id) { for (const [map, b] of Object.entries(this.data().buildings)) { const o = b.objects.find((x) => x.id === id); if (o) return { ...o, map }; } return null; },
  // 寄贈した 魚・骨（2番で ふえる）
  gaveFish(id) { return !!(this.st() && this.st().fish[id]); },
  gaveBone(key) { return !!(this.st() && this.st().bones[key]); },
  // 寄贈の ようすの 文字（SvgCache の キーに 入れる。有限）: 水そうは 魚の じゅんに 1/0、骨格の 台は 部品の じゅんに 1/0、シーラカンスの 台は 1/0
  bits(o) {
    if (o.fish) return o.fish.map((f) => (this.gaveFish(f) ? "1" : "0")).join("");
    if (o.dino) { const d = typeof Fossils !== "undefined" && Fossils.dino(o.dino); return d ? d.art.parts.map((p) => (this.gaveBone(o.dino + "." + p.id) ? "1" : "0")).join("") : ""; }
    if (o.boneOf) return this.gaveBone(o.boneOf) ? "1" : "0";
    return "";
  },
  // 展示の 絵（WorldArt.exhibit から。見本 museum-render.mjs の propOf と おなじ）。{ w, h, svg }（svg は WorldArt と おなじ 中身だけ）
  // 2番: 水そうは 魚を 描かずに（swim）、魚の いる 場所（slots）と 水の 四角（water）を かえす。魚は drawFish が うごかして 描く。
  // 毎フレーム よばれるので id と bits で おぼえて おく（有限）
  artCache: {},
  art({ id, bits = "" }) {
    const ck = id + ":" + bits; if (this.artCache[ck]) return this.artCache[ck];
    const o = this.object(id); if (!o) return { w: 32, h: 32, svg: "" };
    const opts = { ...o, swim: !!o.fish };
    if (o.fish) opts.fish = o.fish.map((fid, i) => {
      const f = typeof Fishing !== "undefined" && Fishing.fish(fid);
      return f ? { id: fid, svg: FishArt.svg(f.art, { uid: "m" + fid, flip: !!f.flip }), have: bits[i] === "1", scale: Math.min(1.8, 0.7 + f.size[1] / 120), big: f.size[1] > 90, noflip: !!f.flip } : { id: fid, svg: "", have: false };
    });
    if (o.dino) {
      const d = Fossils.dino(o.dino), have = d.art.parts.filter((p, i) => bits[i] === "1").map((p) => p.id);
      opts.dino = d; opts.have = have; opts.left = d.art.parts.length - have.length || 0;
    }
    if (o.boneOf) { const b = typeof Fossils !== "undefined" && Fossils.bone(o.boneOf); if (b) opts.bone = FossilArt.partSvg(b.dino, b.part.id); }
    const p = MuseumArt.prop(o.kind, opts);
    // 見本は いる 魚の 数で わって 大きさを きめるので、1ぴき だけだと 水そうの 半分に なる。ゲームでは「ぜんぶ いる とき」の 大きさまでに する（ふえても 大きさが かわらない）
    const slots = (p.slots || []).map((sl) => {
      const f = Fishing.fish(sl.id), k = f ? Math.min(1.8, 0.7 + f.size[1] / 120) : 1, cap = Math.min(p.water[2] * 0.5, Math.max(22, (p.water[2] / Math.max(2, o.fish.length)) * 1.1) * k);
      return sl.w <= cap ? sl : { ...sl, x: sl.x + (sl.w - cap) / 2, y: sl.y + (sl.h - cap / 2) / 2, w: cap, h: cap / 2 };
    });
    return (this.artCache[ck] = { w: p.w, h: p.h, svg: p.svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, ""), slots: p.slots ? slots : null, water: p.water || null });
  },
  // いま 描いて いる 寄贈の ようす（寄贈した あと、新しい 絵を よみこんでから きりかえる。いっしゅん 消えない ように）
  shown(sc, o) { const m = sc.exBits || (sc.exBits = {}); return m[o.id] != null ? m[o.id] : (m[o.id] = this.bits(o)); },
  async refresh(sc) {
    if (!sc || !sc.map || !sc.map.def.indoor) return;
    for (const s of sc.map.sprites) {
      if (s.kind !== "exhibit") continue;
      const nb = this.bits(s.o); if (this.shown(sc, s.o) === nb) continue;
      await sc.objCanvas("exhibit", { id: s.o.id, bits: nb }, true);
      await Promise.all(this.fishJobs(this.art({ id: s.o.id, bits: nb })));
      sc.exBits[s.o.id] = nb;
    }
  },
  // ---- 2番: 水そうで およぐ 魚（寄贈した 魚だけ。キーは "mfish:" + 魚 + ":" + はば。有限）----
  fishImg(slot, ensure) {
    const f = typeof Fishing !== "undefined" && Fishing.fish(slot.id); if (!f) return null;
    const w = Math.round(slot.w), svg = () => FishArt.svg(f.art, { uid: "mf" + f.id, flip: false }), vb = (svg().match(/viewBox="([^"]+)"/) || [0, "0 0 2 1"])[1].split(" ").map(Number);
    const h = Math.max(4, Math.round((w * vb[3]) / vb[2])), pw = Math.ceil(w * G.px), ph = Math.ceil(h * G.px), key = "mfish:" + f.id + ":" + w;
    if (ensure) return SvgCache.ensure(key, svg, pw, ph);
    const c = SvgCache.get(key, svg, pw, ph); return c ? { c, w, h, noflip: !!f.flip } : null;
  },
  fishJobs(a) { return (a && a.slots || []).map((sl) => this.fishImg(sl, true)).filter(Boolean); },
  preload(sc) { const jobs = []; for (const s of sc.map.sprites) if (s.kind === "exhibit" && s.o.fish) jobs.push(...this.fishJobs(this.art({ id: s.o.id, bits: this.shown(sc, s.o) }))); return jobs; },
  // x0, y0 は 展示の 絵の 左上（WorldScene.drawStatic から）。見本 CODEX_TASK.md の 4 の うごき: よこに ゆれて、うごく 向きを むく・上下に ±1.5px・水の 四角で clip
  drawFish(ctx, a, x0, y0) {
    if (!a.slots || !a.slots.length || !a.water) return;
    const [wx, wy, ww, wh] = a.water;
    ctx.save(); ctx.beginPath(); ctx.rect(x0 + wx, y0 + wy, ww, wh); ctx.clip();
    a.slots.forEach((sl, i) => {
      const img = this.fishImg(sl, false); if (!img) return;
      const sp = 0.6 + this.hash(sl.id.length, sl.id.charCodeAt(0), 3) * 0.4, amp = Math.min(10, Math.max(0, (ww - sl.w) / 4)), t = G.t * sp + i;
      const x = x0 + sl.x + Math.sin(t) * amp, y = y0 + sl.y + (sl.h - img.h) / 2 + Math.sin(G.t * 1.3 + i * 2) * 1.5, right = Math.cos(t) > 0;
      // 魚の 絵は 左むき。右へ うごく ときは 左右を かえす（flip の 魚は そのまま）
      if (right && !img.noflip) { ctx.save(); ctx.translate(x + img.w, y); ctx.scale(-1, 1); ctx.drawImage(img.c, 0, 0, img.w, img.h); ctx.restore(); }
      else ctx.drawImage(img.c, x, y, img.w, img.h);
    });
    ctx.restore();
  },

  // ---- 床と かべ（見本 museum-render.mjs の floorTile・wallSprite を canvas に）----
  hash(x, y, s = 0) { let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; },
  shade(hex, k) { const n = parseInt(hex.slice(1), 16), c = (s) => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * (1 + k)))); return "#" + ((1 << 24) | (c(16) << 16) | (c(8) << 8) | c(0)).toString(16).slice(1); },
  // Tiles.drawGround から: 館の 中の マスなら 床を 描いて true（かべ X は 下地だけ。かべの 高さは wall で y順に 描く）
  floor(g, map, tx, ty, x, y, s) {
    const D = this.data(); if (!D || !map.def.indoor) return false;
    const ch = map.rows[ty][tx], t = D.tiles[ch]; if (!t) return false;
    const u = s / 32, c = t.color, h = this.hash(tx, ty, 7), line = (col, w, pts) => { g.strokeStyle = col; g.lineWidth = w * u; g.beginPath(); for (const [x0, y0, x1, y1] of pts) { g.moveTo(x + x0 * u, y + y0 * u); g.lineTo(x + x1 * u, y + y1 * u); } g.stroke(); };
    const dot = (cx, cy, r, col, a = 1) => { g.globalAlpha = a; g.fillStyle = col; g.beginPath(); g.arc(x + cx * u, y + cy * u, r * u, 0, 7); g.fill(); g.globalAlpha = 1; };
    g.fillStyle = ch === "X" ? "#2A2630" : c; g.fillRect(x, y, s, s);
    if (ch === "X") return true;
    g.lineCap = "butt";
    if (ch === "9" || ch === "7") { const k = this.shade(c, -0.14), a = ((tx * 13 + ty * 7) % 4) * 8, b = ((tx * 5 + ty * 3) % 4) * 8 + 4; line(k, 1, [[0, 10.5, 32, 10.5], [0, 21.5, 32, 21.5], [a, 0, a, 10.5], [b, 10.5, b, 21.5]]); }
    else if (ch === "0" || ch === "H") { g.strokeStyle = this.shade(c, -0.08); g.lineWidth = u; g.strokeRect(x + 0.5 * u, y + 0.5 * u, 31 * u, 31 * u); }
    else if (ch === "S") { const a = ty % 2 ? 8 : 20, b = ty % 2 ? 24 : 4; line(this.shade(c, -0.12), 1.2, [[0, 16, 32, 16], [a, 0, a, 16], [b, 16, b, 32]]); }
    else if (ch === "6" || ch === "8") { for (let i = 0; i < 3; i++) dot(5 + this.hash(tx, ty, i) * 22, 5 + this.hash(ty, tx, i) * 22, ch === "8" ? 0.8 : 1, ch === "8" ? "#9FC4FF" : this.shade(c, 0.18), ch === "8" ? 0.7 : 0.8); }
    else if (ch === "3") { dot(8 + h * 16, 10 + h * 10, 3, this.shade(c, -0.1)); dot(22 - h * 10, 24 - h * 8, 2, this.shade(c, 0.12)); }
    else if (ch === "4") { for (let i = 0; i < 4; i++) dot(4 + this.hash(tx, ty, i + 3) * 24, 4 + this.hash(ty, tx, i + 3) * 24, 0.9, this.shade(c, -0.2)); }
    else if (ch === "5") { g.lineCap = "round"; line(this.shade(c, -0.2), 1.2, [[6 + h * 10, 22, 7 + h * 10, 17], [9 + h * 10, 22, 8 + h * 10, 18], [20 - h * 6, 12, 21 - h * 6, 8]]); g.lineCap = "butt"; }
    else if (ch === "2") { g.fillStyle = "#8C949C"; g.fillRect(x, y, s, s); line("#6E767E", 2, [[0, 4, 32, 4], [0, 12, 32, 12], [0, 20, 32, 20], [0, 28, 32, 28]]); }
    else if (ch === "E") { g.fillStyle = "#C8B89A"; g.fillRect(x, y, s, s); line("#8C7A62", 3, [[4, 6, 28, 6]]); }
    return true;
  },
  // かべ 1マス（上の 面 ＋ 床に めんした 前の 面）。WorldScene.render の y順の なかで
  wall(ctx, map, x, y, ox, oy) {
    const X = ox + x * TS, Y = oy + y * TS, below = y + 1 < map.h && map.rows[y + 1][x] !== "X";
    ctx.fillStyle = "#5E5868"; ctx.fillRect(X, Y - 14, TS, TS);
    if (this.hash(x, y, 2) < 0.2) { ctx.fillStyle = "#6E6878"; ctx.fillRect(X + 6, Y - 8, 10, 3); }
    if (below) {
      ctx.fillStyle = "#9A94A6"; ctx.fillRect(X, Y + 18, TS, 14); ctx.fillStyle = "#6E6878"; ctx.fillRect(X, Y + 28, TS, 4);
      ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(X, Y + 18); ctx.lineTo(X + TS, Y + 18); ctx.stroke();
    }
  },

  // ---- へやの 案内（はじめて 入った ときだけ。見本 img/phones.png の ②④）----
  roomAt(mapId, x, y) { const b = this.building(mapId); return b ? b.rooms.find((r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) || null : null; },
  arrived(sc) {
    if (!sc.map.def.indoor || !this.st()) return;
    const L = sc.party[0], r = this.roomAt(sc.mapId, L.tx, L.ty); if (!r) return;
    const key = sc.mapId + "." + r.id; if (this.st().rooms[key]) return;
    this.st().rooms[key] = true; Save.mark();
    this.showIntro(r);
  },
  showIntro(r) {
    this.hideIntro();
    const box = U.el("div", { class: "museum-intro" });
    box.append(U.el("div", { class: "nm", text: r.name }), U.el("div", { text: r.intro }));
    UI.root.append(box); this.intro = box;
    this.introTimer = setTimeout(() => this.hideIntro(), 4500);
  },
  hideIntro() { clearTimeout(this.introTimer); if (this.intro) this.intro.remove(); this.intro = null; },
  // ---- 2番: 寄贈（館の 人。Talk.run の さいしょから）----
  talk_(n) { return MUSEUM_DATA.talk[n.talk]; },
  fishCount() { return Object.keys(this.st().fish).length; },
  doneCount() { return Object.keys(this.st().done).length; },
  dinoDone(d) { return d.art.parts.every((p) => this.gaveBone(d.id + "." + p.id)); },
  complete(bid) { return bid === "aquarium" ? FISHING_DATA.fish.every((f) => this.gaveFish(f.id)) : FOSSIL_DATA.dinos.every((d) => this.dinoDone(d)); },
  // 寄贈できる もの: 水族館は いけすに いて まだ 寄贈して いない 魚、博物館は もって いて まだ 寄贈して いない 骨（1しゅ・1部品 1かい）
  donatable(bid) {
    if (bid === "aquarium") return FISHING_DATA.fish.filter((f) => (Save.d.fish.keep[f.id] || 0) > 0 && !this.gaveFish(f.id)).map((f) => f.id);
    return FOSSIL_DATA.dinos.flatMap((d) => d.art.parts.map((p) => d.id + "." + p.id)).filter((k) => (Save.d.fossil.bones[k] || 0) > 0 && !this.gaveBone(k));
  },
  async talk(n, sc) {
    const bid = sc.mapId, T = this.talk_(n), face = Art.npcSvg({ sp: n.sp, col: n.col, col2: n.col2, outfit: n.outfit, look: n.look, emo: "happy" }), f = Save.d.flags;
    const say = (text) => UI.say([{ name: n.name, face, text }]);
    if (!f.talked[n.id]) { f.talked[n.id] = true; Save.mark(); await say(T.first); }
    // きふの かずで もらえる げんていの 服（js/museum-wear.js・UI-33）: まえから きふして いて もう とどいて いる ぶん
    if (typeof MuseumWear !== "undefined") await MuseumWear.reward(bid, n, face);
    // そんちょうさんの ひょうしょう（js/fossil-sell.js・UI-69）: まえに かんせいして いて まだ もらって いない ぶん
    if (bid === "museum" && typeof DinoAward !== "undefined") await DinoAward.catchUp();
    if (this.complete(bid)) {
      if (!this.st().all[bid]) { this.st().all[bid] = true; Save.mark(); Save.write(); Sound.se("fanfare"); UI.toast("ぜんぶ そろった！", "good"); }
      await say(T.all); await say(U.pick(T.lines)); return true;
    }
    if (!this.donatable(bid).length) { await say(T.none); await say(U.pick(T.lines)); return true; }
    await say(T.ask);
    await this.donate(sc, n, face);
    return true;
  },
  // 寄贈の 画面（見本 img/phones.png の ⑥⑦・img/small-phone.png）。えらんで 下の ボタンで きふする。とじるまで つづけて えらべる
  donate(sc, n, face) {
    const bid = sc.mapId, fish = bid === "aquarium", T = this.talk_(n);
    return new Promise((done) => {
      let sel = null, busy = false, m = null;
      const body = U.el("div"), foot = U.el("div", { class: "dn-foot" }), go = UI.btn("", () => confirm(), "yellow wide");
      foot.append(go);
      const render = () => {
        body.innerHTML = "";
        const head = U.el("div", { class: "dn-head" });
        head.append(U.el("span", { class: "cnt", text: fish ? `きふした さかな ${this.fishCount()} / ${FISHING_DATA.fish.length}` : `くみたてた きょうりゅう ${this.doneCount()} / ${FOSSIL_DATA.dinos.length}` }), U.el("span", { class: "muted", text: fish ? "いけすの さかなを えらんでね" : "もって いる ほね" }));
        body.append(head);
        if (typeof MuseumWear !== "undefined") body.append(U.el("div", { class: "mw-hint", text: MuseumWear.hint(bid) }));
        if (fish) {
          const grid = U.el("div", { class: "dn-grid" });
          for (const f of FISHING_DATA.fish) {
            const k = Save.d.fish.keep[f.id] || 0; if (!k) continue;
            const gave = this.gaveFish(f.id), c = U.el("button", { class: "dn-cell" + (gave ? " done" : "") + (sel === f.id ? " sel" : "") });
            c.dataset.key = f.id;
            c.innerHTML = `${Fishing.svg(f, "dn" + f.id)}<span class="nm"></span><span class="n">×${k}</span>` + (gave ? '<span class="tag">きふずみ</span>' : '<span class="tag new">はじめて！</span>');
            c.querySelector(".nm").textContent = f.name;
            if (gave) c.disabled = true; else c.addEventListener("click", () => pick(f.id));
            grid.append(c);
          }
          body.append(grid);
        } else {
          const list = U.el("div", { class: "dn-list" });
          for (const key of this.donatable(bid)) {
            const { dino: d, part: p } = Fossils.bone(key), got = d.art.parts.filter((q) => this.gaveBone(d.id + "." + q.id)).length, total = d.art.parts.length;
            const row = U.el("button", { class: "dn-row" + (sel === key ? " sel" : "") });
            row.dataset.key = key;
            row.innerHTML = `<span class="ic">${FossilArt.partSvg(d, p.id)}</span><span class="tx"><b></b><span class="pr"><span class="bar"><i style="width:${Math.round((got / total) * 100)}%"></i></span>${got}/${total}</span></span><span class="n">×${Save.d.fossil.bones[key]}</span>`;
            row.querySelector("b").textContent = `${d.name}の ${p.name}`;
            row.addEventListener("click", () => pick(key));
            list.append(row);
          }
          body.append(list);
        }
        go.textContent = !sel ? (fish ? "さかなを えらんでね" : "ほねを えらんでね") : fish ? `${Fishing.fish(sel).name}を きふする` : "えらんだ ほねを きふする";
        go.disabled = !sel;
      };
      const pick = (key) => { if (busy || !this.donatable(bid).includes(key)) return false; Sound.se("tap"); sel = key; render(); return true; };
      const confirm = async () => {
        if (!sel || busy) return false;
        busy = true; const key = sel; sel = null;
        const r = fish ? this.giveFish(key) : this.giveBone(key);
        Sound.se("sparkle"); render();
        await this.refresh(sc);
        await UI.say([{ name: n.name, face, text: T.thanks }]);
        if (r.done) await this.doneCard(r.done, n, face, T);
        if (r.done && typeof DinoAward !== "undefined") await DinoAward.present(r.done.id); // そんちょうさんの ひょうしょう（UI-69）
        if (typeof MuseumWear !== "undefined") await MuseumWear.reward(bid, n, face);
        busy = false;
        if (!this.donatable(bid).length) { if (m) m.close(); } else render();
        return true;
      };
      this.picking = { pick, confirm, sel: () => sel };
      render();
      m = UI.modal({ title: `${fish ? "🐟" : "🦴"} ${n.name}`, body, footer: foot, onClose: () => { this.picking = null; m = null; done(); } });
    });
  },
  // 寄贈する（いけす −1 ／ 骨 −1。ずかん・ノートには のこる）。骨が そろったら { done: 恐竜 }
  giveFish(id) {
    const k = Save.d.fish.keep; k[id] = Math.max(0, (k[id] || 0) - 1);
    this.st().fish[id] = U.today(); Save.mark(); Save.write();
    if (typeof TownFolk !== "undefined" && TownFolk.data()) TownFolk.signal({ do: "donate", fish: id }); // ② 3番
    return {};
  },
  giveBone(key) {
    const b = Save.d.fossil.bones; b[key] = Math.max(0, (b[key] || 0) - 1);
    this.st().bones[key] = U.today();
    const d = Fossils.bone(key).dino, done = this.dinoDone(d) && !this.st().done[d.id];
    if (done) this.st().done[d.id] = U.today();
    Save.mark(); Save.write();
    if (typeof TownFolk !== "undefined" && TownFolk.data()) TownFolk.signal({ do: "donate", bone: key }); // ② 3番
    return done ? { done: d } : {};
  },
  // ---- 3番: 展示を しらべる（見本 img/phones.png の ⑨⑩）----
  // 館の マップの (x, y) に ある 展示（上を 歩ける ものは のぞく）と、しらべられるか（水そう・骨格の 台・説明の ある かざり）
  at(map, x, y) { return map.def.indoor ? (map.def.objects || []).find((o) => o.kind === "exhibit" && !o.walk && x >= o.x && x < o.x + o.w && y >= o.y && y < o.y + o.h) || null : null; },
  canShow(o) { return !!(o && (o.fish || o.dino || o.info)); },
  show(sc, o) {
    const d = this.object(o.id); if (!this.canShow(d)) return null;
    const room = (this.roomAt(d.map, d.x, d.y) || {}).name || "";
    if (d.dino) return this.showStand(d);
    if (d.fish) return this.showTank(d, room);
    return this.showInfo(d, room);
  },
  // 水そう → 中の 魚（まだの 魚は ？？？）。魚を おすと ③ の ずかんの くわしい 画面
  showTank(o, room) {
    const got = o.fish.filter((id) => this.gaveFish(id)), bits = o.fish.map((id) => (this.gaveFish(id) ? "1" : "0")).join("");
    const opts = { ...o, fish: o.fish.map((id, i) => { const f = Fishing.fish(id); return { id, svg: FishArt.svg(f.art, { uid: "ex" + id, flip: !!f.flip }), have: bits[i] === "1", scale: Math.min(1.8, 0.7 + f.size[1] / 120), big: f.size[1] > 90, noflip: !!f.flip }; }) };
    const body = U.el("div", { class: "ex-card" });
    body.innerHTML = `<div class="art">${o.kind === "pedestal" ? MuseumArt.prop(o.kind, opts).svg : this.tankSvg(o, bits)}</div><span class="plate"></span><div class="say"></div>`;
    body.querySelector(".plate").textContent = room;
    body.querySelector(".say").textContent = got.length ? `${o.fish.length}しゅの うち ${got.length}しゅが きふされて いるよ。\nさかなを タップすると ずかんが ひらくよ。` : `${o.fish.length}しゅの さかなが くる すいそう。\nいけすの さかなを かんちょうに きふしてね。`;
    const list = U.el("div", { class: "ex-list" });
    for (const id of o.fish) {
      const f = Fishing.fish(id), have = this.gaveFish(id), c = U.el("button", { class: "ex-fish" + (have ? "" : " no") });
      c.dataset.key = id;
      c.innerHTML = `${Fishing.svg(f, "el" + id)}<span></span>`;
      c.querySelector("span").textContent = have ? f.name : "？？？";
      if (have) c.addEventListener("click", () => { Sound.se("tap"); Fishing.detail(id); }); else c.disabled = true;
      list.append(c);
    }
    body.append(list);
    return UI.modal({ title: "🐟 " + (o.label || room), body });
  },
  // 説明の 水そうの 絵: 町と おなじ 魚の いない 水そう（art）に、町と おなじ 大きさ（slots）で 魚を 入れる（見本の fit と おなじ 入れかた・水の 四角で clip）
  tankSvg(o, bits) {
    const a = this.art({ id: o.id, bits }), [wx, wy, ww, wh] = a.water || [0, 0, a.w, a.h];
    const fish = (a.slots || []).map((sl) => {
      const f = Fishing.fish(sl.id), svg = FishArt.svg(f.art, { uid: "ex" + f.id, flip: !!f.flip }), vb = (svg.match(/viewBox="([^"]+)"/) || [0, "0 0 100 50"])[1], body = svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
      // 入れ子の <svg> に すると .ex-card .art svg の CSS（はば 92%）が 魚にも かかるので、g の transform で 入れる
      const n = vb.split(" ").map(Number), inner = sl.flip && !f.flip ? `<g transform="translate(${n[0] * 2 + n[2]},0) scale(-1,1)">${body}</g>` : body;
      const k = Math.min(sl.w / n[2], sl.h / n[3]), tx = sl.x + (sl.w - n[2] * k) / 2 - n[0] * k, ty = sl.y + (sl.h - n[3] * k) / 2 - n[1] * k;
      return `<g transform="translate(${tx.toFixed(1)},${ty.toFixed(1)}) scale(${k.toFixed(4)})">${inner}</g>`;
    }).join("");
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${a.w} ${a.h}">${a.svg}<defs><clipPath id="exw${o.id}"><rect x="${wx}" y="${wy}" width="${ww}" height="${wh}"/></clipPath></defs><g clip-path="url(#exw${o.id})">${fish}</g></svg>`;
  },
  // 骨格の 台 → ④ の くわしい ページ（寄贈した 骨で）
  showStand(o) { const d = Fossils.dino(o.dino); return Fossils.detail(d.id, { have: d.art.parts.filter((p) => this.gaveBone(d.id + "." + p.id)).map((p) => p.id), museum: true }); },
  // かざり（化石の かべ・くらげ・トンネル・たまご・恐竜の とう・けんきゅうしつ）→ info の 説明
  showInfo(o, room) {
    const info = MUSEUM_DATA.info[o.info]; if (!info) return null;
    const art = this.art({ id: o.id, bits: this.bits(o) }), body = U.el("div", { class: "ex-card rock" });
    body.innerHTML = `<div class="art"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${art.w} ${art.h}">${art.svg}</svg></div><span class="plate"></span><div class="say"></div>`;
    body.querySelector(".plate").textContent = room; body.querySelector(".say").textContent = info.text;
    return UI.modal({ title: info.name, body });
  },
  // 骨格が そろった ときの 画面（見本 ⑧ dn-done）→ はかせの ことば（talk.done）
  doneCard(d, n, face, T) {
    return new Promise((done) => {
      const body = U.el("div", { class: "dn-done" });
      body.innerHTML = `<div class="art">${FossilArt.svg(d, { have: d.art.parts.map((p) => p.id) })}</div><div class="nm"></div><div class="dn"></div><div class="fact"><b>まめちしき</b><span></span></div>`;
      body.querySelector(".nm").textContent = `${d.name}の がいこつが かんせい！`;
      body.querySelector(".dn").textContent = `${d.era}・${d.where}・${d.len}m`;
      body.querySelector(".fact span").textContent = d.fact;
      Sound.se("fanfare");
      let m = null;
      const btn = UI.btn("ホールで みる", () => m && m.close(), "yellow wide");
      m = UI.modal({ title: "🎉 かんせい！", body, footer: btn, onClose: async () => { m = null; await UI.say([{ name: n.name, face, text: (T.done || "").replace("{dino}", d.name) }]); done(); } });
    });
  },
  // 町の 入口（act.type === "indoor"）→ 館の 入口
  enter(sc, act) {
    const b = this.building(act.map); if (!b) return false;
    sc.busy = true;
    Game.goto("world", { map: act.map, x: b.arrive.x, y: b.arrive.y, dir: b.arrive.dir || "up" }, "circle");
    return true;
  },
};

// 館の マップ・床の 文字・館の 人の ことば・BGM・展示の 絵（見本 CODEX_TASK.md の 3・4・5）
if (typeof MUSEUM_DATA !== "undefined") {
  for (const [ch, t] of Object.entries(MUSEUM_DATA.tiles)) { GROUND[ch] = t.ground; if (t.solid) SOLID_CH.add(ch); }
  for (const [id, b] of Object.entries(MUSEUM_DATA.buildings)) MAP_DEFS[id] = {
    name: b.name, bgm: id, baseGround: "museum_tile", indoor: true, rows: b.rows,
    buildings: [], signs: [], chests: [], spawns: [], warps: b.warps, npcs: b.npcs.map((n) => ({ ...n, dir: n.dir || "down" })),
    objects: b.objects.map((o) => ({ ...o, kind: "exhibit", ex: o.kind, w: o.w || 1, h: o.h || 1, solid: !o.walk })),
  };
  for (const [id, t] of Object.entries(MUSEUM_DATA.talk)) TALKS[id] = { first: [t.first], lines: t.lines.map((x) => [x]) };
  Object.assign(SONGS, MUSEUM_DATA.songs);
  WorldArt.exhibit = (opt) => Museum.art(opt || {});
}
