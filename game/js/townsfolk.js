// ② 町の人の 会話（docs/design/features/townsfolk の 見本 tools/feature-design/folk-ref.js の TownFolkRef を 移した もの）。
// データは TOWNSFOLK_DATA（自動生成）。さいきん 出た セリフは メモリだけに おぼえる（セーブしない）。
const TownFolk = {
  TIP_SHARE: 0.3,    // いまの TALKS[npc].lines（あそびかたの ヒント）を 出す わりあい
  REACT_CHANCE: 0.35, // 話した あとに 3人の だれかが ひとこと
  RECENT: 12,        // おなじ 人の さいきんの セリフは この 数だけ 出さない
  recent: {}, recentReact: [], last: null,
  data() { return typeof TOWNSFOLK_DATA !== "undefined" ? TOWNSFOLK_DATA : null; },
  // あとから できる しせつ・あそび（feature: の 条件）。できたかどうかは グローバル名と マップで 見る
  features() {
    return {
      fishing: typeof FISHING_DATA !== "undefined", fossil: typeof FOSSIL_DATA !== "undefined",
      aquarium: !!MAP_DEFS.aquarium, museum: !!MAP_DEFS.museum, range: typeof RANGE_DATA !== "undefined",
      heiwadai2: ((MAP_DEFS.heiwadai || {}).rows || []).length >= 60, // 平和台 v0.2（64×68）が できたら
    };
  },
  bond(npcId) { return ((Save.d.folk || {}).bond || {})[npcId] || 0; },
  // いまの ようす（when の キーと 同じ 名前）
  context(npcId) {
    return { time: U.dayPart(), weather: Weather.kind(), season: Seasonal.current().id, festival: AnnualFestivals.current().id,
      event: Save.d.flags.boss ? ["boss"] : [], feature: this.features(), bond: this.bond(npcId), person: npcId };
  },
  // 町の なかま（town_walker0 など）は 役（town_walker）の セリフと 名前を つかう
  role(npcId) { return ((this.data() || {}).crowd || {})[npcId] || null; },
  name(n) { const r = this.role(n.id); return (r && this.data().crowdNames[r]) || n.name; },
  // その人の セリフを 1つ（なければ null）
  line(n) {
    const D = this.data(); if (!D) return null;
    const who = this.role(n.id) || n.id, list = D.lines.filter(l => l.npc === who);
    const r = this.recent[who] || (this.recent[who] = []), l = U.condPick(list, this.context(n.id), r);
    if (l) { r.push(l.id); if (r.length > this.RECENT) r.shift(); }
    return l;
  },
  // 話した あとの 3人の ひとこと（person は 話した あいて）
  react(n) {
    const D = this.data(); if (!D) return null;
    const l = U.condPick(D.react, this.context(n.id), this.recentReact);
    if (l) { this.recentReact.push(l.id); if (this.recentReact.length > this.RECENT) this.recentReact.shift(); }
    return l;
  },
};
