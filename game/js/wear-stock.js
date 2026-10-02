// 服の かず（UI-31。オーナーの FB 2026-10-01「服などについて、ひとつ買うとみんな着れる仕様になっているが、1アイテム1人までにしてほしい。
// (例えば、3人に着せたい場合は、三つ買わなくてはならない)」）。
// Save.d.wardrobe[id] は もって いる かず（true は まえからの 1こ。2こ いじょうは かず）。1こで 1人 だけ つかえる
// （3人の outfit と ぱぱ・ままの equipment を あわせて かぞえる）。もてるのは CAP こ まで（つかう 人は 5人 だけ）。
// かしだしの いしょう（Meeときょれじゃ の こういしつ・もって いない もの）は かず に いれない。
// ふるい セーブ（SCHEMA 1）は Save.migrate() が いま きて いる 人の かずまで ふやす（Save.repairWear・みためを かえない）。
const WearStock = {
  CAP: 5,
  PARENTS: ["papa", "mama"],
  // もって いる かず
  count(id, d = Save.d) {
    const v = d && d.wardrobe ? d.wardrobe[id] : 0;
    if (v === true) return 1;
    return Number.isFinite(v) && v > 0 ? Math.min(this.CAP, Math.floor(v)) : 0;
  },
  // かずを きめる（1こは まえからの true・0 は もって いない）
  set(id, n, d = Save.d) {
    const k = Math.max(0, Math.min(this.CAP, Math.floor(n) || 0));
    if (!k) delete d.wardrobe[id]; else d.wardrobe[id] = k === 1 ? true : k;
    return k;
  },
  // n こ ふやす（CAP まで）。ふえた かずを かえす
  add(id, n = 1, d = Save.d) {
    const c = this.count(id, d), k = Math.min(this.CAP, c + Math.max(0, Math.floor(n) || 0));
    if (k > c) this.set(id, k, d);
    return k - c;
  },
  // あと なんこ もてるか
  room(id, d = Save.d) { return Math.max(0, this.CAP - this.count(id, d)); },
  slots(who, d = Save.d) {
    if (this.PARENTS.includes(who)) return (d.parents && d.parents[who] && d.parents[who].equipment) || null;
    return (d.chars && d.chars[who] && d.chars[who].outfit) || null;
  },
  people(d = Save.d) { return [...((d && d.order) || Object.keys((d && d.chars) || {})), ...this.PARENTS]; },
  // いま つかって いる 人（3人 → ぱぱ・まま の じゅん）
  wearers(id, d = Save.d) {
    if (!id || !d) return [];
    return this.people(d).filter((who) => { const o = this.slots(who, d); return !!o && Object.values(o).includes(id); });
  },
  // who いがいが つかって いない のこりの かず（who が つかって いる 1こは who の ぶん）
  free(id, who, d = Save.d) { return this.count(id, d) - this.wearers(id, d).filter((w) => w !== who).length; },
  can(id, who, d = Save.d) { return this.free(id, who, d) > 0; },
  // つかって いる ほかの 人（わたして もらう あいて）
  holder(id, who, d = Save.d) { return this.wearers(id, d).find((w) => w !== who) || null; },
  name(who, d = Save.d) {
    if (this.PARENTS.includes(who)) return typeof ParentCare !== "undefined" ? ParentCare.name(who) : who === "papa" ? "ぱぱ" : "まま";
    return (d.chars && d.chars[who] && d.chars[who].name) || who;
  },
  // who の slot に id を つける（null は はずす）。のこりが なければ ほかの 人から わたして もらう。{ ok, from（わたした 人）}
  put(who, slot, id, d = Save.d) {
    const o = this.slots(who, d);
    if (!o) return { ok: false, from: null };
    if (!id) { o[slot] = null; return { ok: true, from: null }; }
    let from = null;
    if (!this.can(id, who, d)) {
      from = this.holder(id, who, d);
      if (!from) return { ok: false, from: null }; // もって いない
      const f = this.slots(from, d);
      for (const s of Object.keys(f)) if (f[s] === id) f[s] = null;
    }
    o[slot] = id;
    return { ok: true, from };
  },
  // つける まえの たしかめ（ほかの 人が つかって いる ときは「わたす？」と きく）。つけたら true
  async ask(who, slot, it, d = Save.d) {
    if (this.can(it.id, who, d)) return this.put(who, slot, it.id, d).ok;
    const from = this.holder(it.id, who, d);
    if (!from) return false;
    const n = this.count(it.id, d), more = n < this.CAP ? "\nおみせで もう 1こ かうと、いっしょに つかえるよ。" : "";
    const yes = await UI.confirm(`「${it.name}」は ${n}こ だけ。\nいまは ${this.name(from, d)}が つかって いるよ。\n${this.name(who, d)}に わたす？${more}`, "わたす", "やめる");
    if (!yes) return false;
    return this.put(who, slot, it.id, d).ok;
  },
  // カードの ふだ: もって いる かず と、のこりが ない ときに つかって いる 人（from）
  badge(id, who, d = Save.d) {
    const mine = Object.values(this.slots(who, d) || {}).includes(id), from = !mine && !this.can(id, who, d) ? this.holder(id, who, d) : null;
    return { n: this.count(id, d), from, text: from ? `${this.name(from, d)}が つかってる` : "" };
  },
};
