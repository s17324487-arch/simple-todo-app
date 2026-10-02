// まいにちの いらい・おてつだい（バイト）・町の人の おねがいで けいけんち（UI-44。オーナーの FB 2026-10-02「日々のクエストやバイトで、少しずつ経験値が増えてレベルがアップするようにして欲しい」）。
// もらえる かずは その 子の「つぎの レベルまで」（Stats.expNeed）の なんぶんの いくつ。レベルが あがっても、おなじ ぐらいの かいすうで 1つ あがる。
// ・おてつだい 1かい: 2%（○◎ なし）〜 8%（ぜんぶ ○◎）× はたらいた ぶん（とちゅうで やめたら その ぶん）
// ・いらい（けいじばん）: ★1 7%・★2 10%・★3 13%・★4 16%・★5 19%
// ・町の人の おねがい: 5%
// 3人 みんなが もらう（3人は いつも いっしょ）。Lv50 は もらわない。セーブは かわらない（Save.d.chars[だれ].lv・exp を Stats.gainExp で ふやす）。
const WorkExp = {
  SHIFT: [0.02, 0.08],
  STAR: [0.04, 0.03], // いらい: 0.04 + 0.03 × ★
  FOLK: 0.05,
  last: null, // いちばん あとの けっか（PokaDebug・テスト）
  rate(kind, v) {
    if (kind === "shift") { const [ranks = [], fraction = 1] = v || []; const good = ranks.filter((r) => r >= 2).length / Math.max(1, ranks.length); return ranks.length ? (this.SHIFT[0] + (this.SHIFT[1] - this.SHIFT[0]) * good) * U.clamp(fraction, 0, 1) : 0; }
    if (kind === "quest") return this.STAR[0] + this.STAR[1] * U.clamp(Math.round(v) || 1, 1, 5);
    if (kind === "folk") return this.FOLK;
    return 0;
  },
  amount(id, rate) {
    const c = Save.d.chars[id];
    if (!c || c.lv >= 50 || !(rate > 0)) return 0;
    return Math.max(1, Math.round(Stats.expNeed(c.lv) * rate));
  },
  // 3人に わたす。[{ id, name, n, lv0, lv, exp, need, ups }]
  give(kind, v) {
    const rate = this.rate(kind, v), out = [];
    for (const id of Save.d.order) {
      const c = Save.d.chars[id], lv0 = c.lv, n = this.amount(id, rate), ups = n ? Stats.gainExp(id, n) : [];
      out.push({ id, name: c.name, n, lv0, lv: c.lv, exp: c.exp, need: c.lv >= 50 ? 0 : Stats.expNeed(c.lv), ups });
    }
    this.last = { kind, rate, rows: out };
    if (out.some((r) => r.n)) Save.mark();
    return out;
  },
  ups(rows) { return rows.filter((r) => r.ups.length); },
  // おてつだいの けっかの まど: 3人の レベルと けいけんちの ぼう（ふえた ぶんは きいろ）
  html(rows) {
    const NM = { hp: "HP", sp: "SP", atk: "こうげき", def: "ぼうぎょ", spd: "すばやさ" };
    let h = `<div class="wexp" aria-label="けいけんち">`;
    for (const r of rows) {
      const max = !r.need, pct = max ? 100 : Math.round((r.exp / r.need) * 100), gain = max ? 0 : Math.min(pct, Math.round((Math.min(r.n, r.exp) / r.need) * 100));
      h += `<div class="wexp-row${r.ups.length ? " up" : ""}"><span class="wexp-name">${r.name}</span><span class="wexp-lv">Lv ${r.lv}</span>`
        + `<span class="wexp-bar"><i style="width:${pct - gain}%"></i><b style="width:${gain}%"></b></span><span class="wexp-n">${max ? "さいこう" : "+" + r.n}</span></div>`;
      for (const u of r.ups) h += `<div class="wexp-lvup">${r.name}は レベル${u.lv}に あがった！ ${Object.entries(u.diff).filter(([, x]) => x).map(([k, x]) => `<span class="wexp-st">${NM[k]}+${x}</span>`).join(" ")}${u.learned.length ? `<br>あたらしい とくぎ「${u.learned.join("・")}」を おぼえた！` : ""}</div>`;
    }
    return h + "</div>";
  },
  // トーストの ことば（いらい・おねがい）
  text(rows) {
    const got = rows.filter((r) => r.n);
    if (!got.length) return "";
    const up = this.ups(rows);
    return `3にんに けいけんち +${got.map((r) => r.n).join("・+")}` + (up.length ? `\n${up.map((r) => `${r.name}が レベル${r.lv}に`).join("・")} あがった！` : "");
  },
  // いらい・おねがいの あとの トースト（レベルが あがったら おとも）
  toast(rows) {
    const t = this.text(rows);
    if (!t) return false;
    UI.toast(`<span class="wexp-toast">${t.replace(/\n/g, "<br>")}</span>`, "good");
    this.cheer(rows);
    return true;
  },
  // レベルが あがった ときの おと（バトルと おなじ。おてつだいの けっかでは ファンファーレの あとに ならす）
  cheer(rows, delay = 0) {
    if (!this.ups(rows).length || typeof Sound === "undefined") return;
    if (delay > 0) setTimeout(() => Sound.jingle("jingle_lv"), delay); else Sound.jingle("jingle_lv");
  },
};
