// ぬいぐるみ・フィギュアを もつ（UI-113。オーナーの 指示 2026-10-09「ぬいぐるみなどを持てるようにして。」）。
// ・もって いる 家具の うち ぬいぐるみ（なまえに「ぬいぐるみ」）と フィギュア（FigureStand）を、きがえの「もちもの」で 3人の 手に もたせる。
//   1こで ひとり（2こ あれば 2人。のこりが ない ときは もって いる 子から わたして もらう）。へやに おいて いても もてる（べつの ものと かんがえない）。
// ・きがえの カードと 3人の 絵は ふつうの もちものと おなじ しくみ（outfit.hand に hold_<家具の id>・WEAR.hold_plush）。
//   ITEM_INDEX にだけ いれる（WEAR_ITEMS には いれない ので おみせ・ずかん・ふくの かずには でない）。
// ・絵は その 家具の アイコン（Art.iconSvg）を 手の まえに だく（たかさ 76。キャラの 絵は 220 はば）。3人の 絵の キャッシュの キーは 家具の id（有限）。
// ・セーブ: outfit.hand に hold_<id> が はいる だけ（Save.SCHEMA は 2 の まま）。もって いた 家具が なくなったら きがえを ひらいた ときに はずす。
const HoldPlush = {
  PREFIX: "hold_", SIZE: 76,
  ok(f) { return !!f && f.kind !== "wall" && f.kind !== "rug" && (/ぬいぐるみ/.test(f.name) || (typeof FigureStand !== "undefined" && FigureStand.isFigure(f.id))); },
  ids: [],
  wearId(fid) { return this.PREFIX + fid; },
  furnOf(wid) { return typeof wid === "string" && wid.startsWith(this.PREFIX) ? wid.slice(this.PREFIX.length) : null; },
  isHold(wid) { const it = ITEM_INDEX[wid]; return !!(it && it.hold); },
  have(fid) { return Math.max(0, Math.floor((Save.d && Save.d.furn && Save.d.furn[fid]) || 0)); },
  holders(wid) { return Chara.IDS.filter((id) => Save.d.chars[id] && Save.d.chars[id].outfit && Save.d.chars[id].outfit.hand === wid); },
  // きがえの「もちもの」に だす もの（もって いる ぶん だけ。ぬいぐるみが さき）
  owned() { return this.ids.filter((fid) => this.have(fid) > 0).map((fid) => ITEM_INDEX[this.wearId(fid)]); },
  // まだ もたせられる かず（もって いる かず − もって いる 子）
  free(wid) { return this.have(this.furnOf(wid)) - this.holders(wid).length; },
  // カードの ふだ: かず（2こ いじょう）・のこりが ない ときは もって いる 子
  badge(wid, who) {
    const n = this.have(this.furnOf(wid)), hs = this.holders(wid).filter((h) => h !== who);
    const from = hs.length >= n && hs[0] ? Save.d.chars[hs[0]].name : null;
    return { n, from, text: from ? `${from}が もってる` : "" };
  },
  // もつ（のこりが なければ いちばん はじめに もった 子から わたす）。もてない ときは false
  take(who, wid) {
    const fid = this.furnOf(wid), n = this.have(fid), c = Save.d.chars[who];
    if (!c || !this.isHold(wid) || n <= 0) return false;
    const hs = this.holders(wid).filter((h) => h !== who);
    if (hs.length >= n) { const from = Save.d.chars[hs[0]]; from.outfit.hand = null; UI.toast(`${from.name}から ${ITEM_INDEX[wid].name}を わたして もらったよ`); }
    c.outfit.hand = wid; Save.mark();
    return true;
  },
  // もって いない 家具を はずす・もちすぎを なおす（きがえを ひらく とき）
  fix() {
    const d = Save.d; if (!d) return 0;
    let n = 0; const used = {};
    for (const id of Chara.IDS) {
      const o = d.chars[id] && d.chars[id].outfit, wid = o && o.hand;
      if (!wid || !String(wid).startsWith(this.PREFIX)) continue;
      const fid = this.furnOf(wid);
      used[wid] = (used[wid] || 0) + 1;
      if (!this.isHold(wid) || used[wid] > this.have(fid)) { o.hand = null; n++; }
    }
    return n;
  },
  // 3人の 手に だく（アイコンを 手の まえに。うしろむきは からだの むこう）
  draw(ctx) {
    const h = HandItems.hand(ctx), fid = ctx.col[0], s = this.SIZE, w = s;
    const icon = typeof Art !== "undefined" && FURN_INDEX[fid] ? Art.iconSvg("furn", fid) : "";
    if (!icon) return { top: "" };
    const x = U.clamp(h.x - h.side * 6, w / 2 - 8, 208 - w / 2), yb = Math.min(h.y + 34, 216);
    const svg = icon.replace(/ width="[^"]*"/, "").replace(/ height="[^"]*"/, "").replace("<svg ", `<svg x="${f2(x - w / 2)}" y="${f2(yb - s)}" width="${w}" height="${s}" preserveAspectRatio="xMidYMax meet" `);
    return ctx.view === "back" ? { behind: svg } : { top: svg }; // うしろむきは からだの むこう（まえで だいて いる）
  },
};

// ---- ゲームに いれる（家具が そろった あと）----
(() => {
  const list = FURNITURE.filter((f) => HoldPlush.ok(f));
  list.sort((a, b) => (/ぬいぐるみ/.test(b.name) ? 1 : 0) - (/ぬいぐるみ/.test(a.name) ? 1 : 0));
  for (const f of list) {
    const id = HoldPlush.wearId(f.id);
    if (ITEM_INDEX[id]) continue;
    ITEM_INDEX[id] = { id, name: f.name, slot: HandItems.SLOT, wear: "hold_plush", col: [f.id], price: 0, hold: true, exclusive: "hold", desc: `${f.name}を だいて あるく` };
    HoldPlush.ids.push(f.id);
  }
  WEAR.hold_plush = (ctx) => HoldPlush.draw(ctx);
})();
