// びようしつの しなもの（O11b・UI-77。オーナーの FB 2026-10-03「各お店の売っているものが種類が少なく見た目もチープなので、作り直してほしい」）。
// リボン 2しゅ だけ だった びようしつに、リボンの いろ 4しゅ と ヘアアクセ 10しゅ（シュシュ・はなの ヘアクリップ・ぽんぽん ヘアゴム・
// さくらんぼの ピン・リボンの カチューシャ・ほしの カチューシャ）。あたまの アクセは 2つ まで（HeadPair: ピン・ゴムは pin、カチューシャは band）。
// 絵は WEAR.<なまえ>（hatWrap: あたまの うえの まんなかが 0,0・はば 100）。3人 × 4むき は hatWrap が あわせる。id は つかわない。
// どれも びようしつ だけ（exclusive）。ねだんは SlowLifePrices と おなじ 2.5ばい（ikebukuro-catalog.js の あとに 読む）。
// セーブは 服の かず（Save.d.wardrobe）が ふえる だけ（Save.SCHEMA は そのまま）。
const SalonGoods = (() => {
  const K = INK;
  // ---- ヘアアクセの 絵 ----
  // シュシュ: ふわふわの ぬのの わっか（ふちを さきに 黒で かいて から ぬる → ひとつの かたち）
  WEAR.salon_scrunchie = (ctx) => ({
    top: hatWrap(ctx, (s) => {
      const c = ctx.col[0] || "#F7A6C0", d = shade(c, -0.22), dot = ctx.col[1] || "#FFFFFF";
      const P = Array.from({ length: 9 }, (_, i) => { const a = (i / 9) * Math.PI * 2; return [Math.cos(a) * 11, Math.sin(a) * 8.5]; });
      const blobs = (fill, sw) => P.map(([x, y]) => `<circle cx="${f2(x)}" cy="${f2(y)}" r="6.6" fill="${fill}"${sw ? ` stroke="${K}" stroke-width="${f2(sw)}"` : ""}/>`).join("");
      return `<g transform="translate(32,-4) rotate(-12)">${blobs(K, s * 1.4)}${blobs(c, 0)}<ellipse cx="0" cy="0" rx="9.5" ry="7" fill="${c}"/>`
        + P.map(([x, y]) => `<path d="M${f2(x * 0.66)},${f2(y * 0.66)} L${f2(x * 1.2)},${f2(y * 1.2)}" stroke="${d}" stroke-width="${f2(s * 0.42)}" stroke-linecap="round"/>`).join("")
        + [[-8, -7], [6, -9], [12, 3], [-3, 9], [-13, 2]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.7" fill="${dot}"/>`).join("")
        + `<ellipse cx="0" cy="0" rx="4.4" ry="3.2" fill="${d}" stroke="${K}" stroke-width="${f2(s * 0.6)}"/></g>`;
    }),
  });
  // はなの ヘアクリップ: 5まいの はなびら・まんなか・はっぱ
  WEAR.salon_flowerclip = (ctx) => ({
    top: hatWrap(ctx, (s) => {
      const c = ctx.col[0] || "#FFE07A", m = ctx.col[1] || "#F49A3E";
      return `<g transform="translate(31,-9) rotate(10)"><path d="M-4,6 C-14,9 -19,3 -21,-2 C-12,-4 -6,0 -4,6 Z" fill="#7CC46E" ${stroke(s * 0.7)}/><path d="M-6,4 L-17,0" stroke="#4E9A48" stroke-width="${f2(s * 0.35)}" stroke-linecap="round"/>`
        + flowerSvg(0, 0, 9.5, c, m, s * 0.75) + `<circle cx="-2.4" cy="-2.4" r="2" fill="#FFFFFF" fill-opacity=".8"/></g>`;
    }),
  });
  // ぽんぽん ヘアゴム: ふわふわの たま 2つ（ふちは ちいさな まるの つながり）
  const puff = (x, y, r, c, s) => {
    const n = 11, pts = Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2; return [x + Math.cos(a) * r, y + Math.sin(a) * r]; });
    const br = f2(2 * r * Math.sin(Math.PI / n) * 0.62);
    return `<path d="M${f2(pts[0][0])},${f2(pts[0][1])} ${pts.map((p, i) => { const q = pts[(i + 1) % n]; return `A${br},${br} 0 0 1 ${f2(q[0])},${f2(q[1])}`; }).join(" ")} Z" fill="${c}" ${stroke(s)}/>`;
  };
  WEAR.salon_pompom = (ctx) => ({
    top: hatWrap(ctx, (s) => {
      const c = ctx.col[0] || "#9ED9C7", g = ctx.col[1] || "#FFFFFF";
      return `<g transform="translate(30,-8)"><path d="M-3,1 L9,7" stroke="${K}" stroke-width="${f2(s * 1.1)}" stroke-linecap="round"/><path d="M-3,1 L9,7" stroke="${shade(c, -0.3)}" stroke-width="${f2(s * 0.45)}" stroke-linecap="round"/>`
        + puff(-6, -3, 10.5, c, s * 0.8) + puff(12, 9, 9, c, s * 0.8) + `<circle cx="-9.5" cy="-6.5" r="2.6" fill="${g}" fill-opacity=".85"/><circle cx="9" cy="6" r="2.2" fill="${g}" fill-opacity=".85"/></g>`;
    }),
  });
  // さくらんぼの ピン: ふたごの さくらんぼ・くき・はっぱ
  WEAR.salon_cherrypin = (ctx) => ({
    top: hatWrap(ctx, (s) => {
      const c = ctx.col[0] || "#E8424F";
      return `<g transform="translate(30,-6) rotate(-8)"><path d="M-6,4 Q-2,-10 6,-16 M9,6 Q6,-6 6,-16" fill="none" stroke="${K}" stroke-width="${f2(s * 1.1)}" stroke-linecap="round"/><path d="M-6,4 Q-2,-10 6,-16 M9,6 Q6,-6 6,-16" fill="none" stroke="#6E9A43" stroke-width="${f2(s * 0.45)}" stroke-linecap="round"/>`
        + `<path d="M6,-16 C12,-24 20,-20 21,-14 C15,-12 10,-12 6,-16 Z" fill="#7CC46E" ${stroke(s * 0.6)}/>`
        + `<circle cx="-6" cy="7" r="7" fill="${c}" ${stroke(s * 0.8)}/><circle cx="9.5" cy="9" r="7" fill="${shade(c, -0.08)}" ${stroke(s * 0.8)}/>`
        + `<ellipse cx="-8.5" cy="4.5" rx="2.1" ry="1.3" fill="#FFFFFF" fill-opacity=".8"/><ellipse cx="7" cy="6.5" rx="2.1" ry="1.3" fill="#FFFFFF" fill-opacity=".8"/></g>`;
    }),
  });
  // カチューシャ: あたまの うえの わ（ふちどり つき）
  const band = (s, c) => `<path d="M-48,6 C-36,-26 36,-26 48,6" fill="none" stroke="${K}" stroke-width="${f2(s * 2.6)}" stroke-linecap="round"/><path d="M-48,6 C-36,-26 36,-26 48,6" fill="none" stroke="${c}" stroke-width="${f2(s * 1.2)}" stroke-linecap="round"/>`;
  WEAR.salon_ribbonband = (ctx) => ({
    top: hatWrap(ctx, (s) => {
      const c = ctx.col[0] || "#E8505B", b = ctx.col[1] || c, d = shade(b, -0.2);
      return band(s, c) + `<g transform="translate(25,-16) rotate(24) scale(.8)"><path d="M0,0 C-10,-17 -28,-15 -26,0 C-28,15 -10,17 0,0 Z" fill="${b}" ${stroke(s)}/><path d="M0,0 C10,-17 28,-15 26,0 C28,15 10,17 0,0 Z" fill="${b}" ${stroke(s)}/>`
        + `<path d="M-4,4 L-10,20 M4,4 L10,20" fill="none" ${stroke(s)}/><circle cx="0" cy="0" r="6.5" fill="${d}" ${stroke(s)}/></g>`;
    }),
  });
  WEAR.salon_starband = (ctx) => ({
    top: hatWrap(ctx, (s) => {
      const c = ctx.col[0] || "#7E8FD8", st = ctx.col[1] || "#FFE07A";
      return band(s, c) + [[-25, -15, 7.5], [0, -21, 10], [25, -15, 7.5]].map(([x, y, r]) => `<path d="${starPath(x, y, r, r * 0.46)}" fill="${st}" ${stroke(s * 0.7)}/>`).join("");
    }),
  });
  Object.assign(HeadPair.KIND, { salon_scrunchie: "pin", salon_flowerclip: "pin", salon_pompom: "pin", salon_cherrypin: "pin", salon_ribbonband: "band", salon_starband: "band" });

  // ---- しなもの [id, なまえ, WEAR, いろ, もとの ねだん] ----
  const ITEMS = [
    ["ribbon_yellow", "リボン（きいろ）", "ribbon", ["#FFD54F"], 60],
    ["ribbon_mint", "リボン（ミント）", "ribbon", ["#8EDBC4"], 60],
    ["ribbon_lavender", "リボン（ラベンダー）", "ribbon", ["#C3A8EC"], 60],
    ["ribbon_red", "リボン（あか）", "ribbon", ["#E8505B"], 60],
    ["salon_scrunchie_pink", "シュシュ（ピンク）", "salon_scrunchie", ["#F7A6C0", "#FFFFFF"], 80],
    ["salon_scrunchie_navy", "シュシュ（ネイビー）", "salon_scrunchie", ["#4A5D9C", "#FFFFFF"], 80],
    ["salon_flowerclip_yellow", "はなの クリップ（きいろ）", "salon_flowerclip", ["#FFE07A", "#F49A3E"], 90],
    ["salon_flowerclip_pink", "はなの クリップ（ピンク）", "salon_flowerclip", ["#F9B4C8", "#FFE07A"], 90],
    ["salon_pompom_mint", "ぽんぽん ゴム（ミント）", "salon_pompom", ["#6FCFB2", "#FFFFFF"], 80],
    ["salon_pompom_orange", "ぽんぽん ゴム（オレンジ）", "salon_pompom", ["#FFA94D", "#FFF3D6"], 80],
    ["salon_cherrypin", "さくらんぼの ピン", "salon_cherrypin", ["#E8424F"], 70],
    ["salon_ribbonband_red", "リボン カチューシャ（あか）", "salon_ribbonband", ["#E8505B", "#E8505B"], 120],
    ["salon_ribbonband_navy", "リボン カチューシャ（こん）", "salon_ribbonband", ["#4A5D9C", "#F9F3E6"], 120],
    ["salon_starband", "ほしの カチューシャ", "salon_starband", ["#7E8FD8", "#FFE07A"], 130],
  ];
  const DESC = {
    ribbon: "あたまに ちょこんと つける リボン。",
    salon_scrunchie: "ふわふわの ぬのの シュシュ。",
    salon_flowerclip: "おはなの かたちの ヘアクリップ。",
    salon_pompom: "まんまる ぽんぽんの ヘアゴム。",
    salon_cherrypin: "ふたごの さくらんぼの ピン。",
    salon_ribbonband: "よこに リボンの ついた カチューシャ。",
    salon_starband: "おほしさまが 3つ ならんだ カチューシャ。",
  };
  for (const [id, name, wear, col, base] of ITEMS) {
    if (ITEM_INDEX[id]) continue;
    const it = { id, slot: "head", wear, col, name, price: SlowLifePrices.price("wear", base), exclusive: "groom", salonGoods: true, desc: DESC[wear] };
    WEAR_ITEMS.push(it); ITEM_INDEX[id] = it;
  }
  const NEW = ITEMS.map((r) => r[0]);

  // ---- びようしつの タブ ----
  const TABS = [
    ["ribbon", "リボン", ["ribbon_pink", "ribbon_blue", "ribbon_yellow", "ribbon_mint", "ribbon_lavender", "ribbon_red"]],
    ["acc", "ヘアアクセ", NEW.filter((id) => !id.startsWith("ribbon_"))],
  ];
  const shop = BUY_SHOPS.groom;
  if (shop) {
    shop.hello = ["いらっしゃいませ！ きょうは どの ヘアアクセに する？", "リボンは 6いろ そろってるよ。"];
    shop.tabs = TABS.map(([k, label]) => [k, label]);
    shop.items = (tab) => (TABS.find((t) => t[0] === tab) || TABS[0])[2].map((k) => ITEM_INDEX[k]).filter(Boolean);
    shop.cls = ((shop.cls || "") + " shop-goods shop-salon").trim();
  }
  return {
    ITEMS, NEW, TABS,
    ids: () => TABS.flatMap((t) => t[2]),
    // PokaDebug 用
    state() { return { tabs: TABS.map(([k, label, ids]) => ({ k, label, ids: [...ids] })), total: TABS.reduce((a, t) => a + t[2].length, 0) }; },
  };
})();
