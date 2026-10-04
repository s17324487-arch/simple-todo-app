// Meeときょれじゃ の ガチャの しゅうがわり（UI-62。オーナーの FB 2026-10-03「ときょれじゃの景品やガチャガチャの中身は、定期的に変わるようにしろ。そのための機能と景品も実装しておけ」）。
// ・ほんものの カプセルトイ専門店と おなじく、まいしゅう げつようびに ガチャの なかみが いれかわる（クレーンの けいひんは まいにち かわる。js/crane-machines.js の lineup）。
// ・わ（ring）: ならんだ 台（slot）と、そこを まわる シリーズ（pool。台の かず より おおい）。1しゅうに 1シリーズずつ いれかわる:
//   いちばん ながく でて いた シリーズが やすみ、その 台に やすんで いた シリーズが はいる（ほかの 台は おなじ シリーズの まま・ばしょも かわらない）。
//   pool が L・台が M なら、どの シリーズも L しゅうの うち M しゅう でて、L−M しゅう やすむ。4F は しま 6つ（3だい・4シリーズ）・2F は ガチャ コーナーの 4くみ（3だい・5シリーズ。UI-63・js/gacha-corner-more.js、5ばんめは UI-79 の へいせい じょじ ふう js/gacha-heisei.js）。
// ・しゅうの ばんごう: 2026-09-21（げつ）から かぞえる（0 = まえの ならび・1 = 2026-09-28〜 さいしょの いれかえ）。日づけは CraneMachines.today（PokaDebug.calendar で かえられる）。
// ・はいった ばかりの 台には「NEW」の はた（ArcadeArt の gacha・f.fresh）。ガチャの がめんに「NEW！ あたらしい ガチャ」「NEW！ また きた ガチャ」「らいしゅうは おやすみ」（Gacha.tagOf）。
// ・2F・4F に はいった とき、まえに きた しゅうと ちがえば「ガチャの なかみが いれかわったよ」。2F の かんばん（rotInfo: 2）・1F／4F の あんない（rotInfo: 1／4）に こんしゅうの ないようと つぎの いれかえの 日（apply が かく）。
// ・セーブ: Save.d.gacha.week（さいごに いれかえの ある 階を みた しゅう）だけ。ならびは 日づけで きまる（セーブに のこらない）。
const MeeRotation = (() => {
  const EPOCH = "2026-9-21";
  const mod = (a, n) => ((a % n) + n) % n;
  const today = () => CraneMachines.today();
  const week = (day = today()) => Math.floor((CraneMachines.dayNum(day) - CraneMachines.dayNum(EPOCH)) / 7);
  // その しゅうの げつようび（"2026-10-5" の かたち）
  const monday = (w) => { const d = new Date(Date.UTC(2026, 8, 21) + w * 7 * 86400000); return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`; };
  // わ: { id, floor, name, ids（さいしょの ならび。slot 0〜M−1）, add（あとから まわる シリーズ）, rest（さいしょに やすむ ids の ばんごう）, from（さいしょに いれかわる しゅう） }
  const RINGS = [];
  const pool = (R) => { const M = R.ids.length, j = mod(R.rest || 0, M); return [...R.ids.slice(j), ...R.ids.slice(0, j), ...(R.add || [])]; };
  // その しゅうの ならび（slot の じゅん）: [{ slot, id, si, fresh〔こんしゅう はいった〕, debut〔はじめて はいった〕, leaving〔らいしゅう やすむ〕}]
  // e しゅうめに はいる シリーズは pool[(e + M − 1) mod L]・台は (e + rest − 1) mod M（0 しゅうめは ids の とおり）。add の シリーズ（pool[p]・p ≥ M）が はじめて はいるのは e = p − M + 1
  const lineup = (R, w = week()) => {
    const P = pool(R), L = P.length, M = R.ids.length, o = (R.rest || 0) - 1, lw = Math.max(0, w - (R.from ?? 1) + 1);
    if (L <= M) return R.ids.map((id, slot) => ({ slot, id, si: Gacha.byId(id).index, fresh: false, debut: false, leaving: false }));
    const out = [];
    for (let e = lw - M + 1; e <= lw; e++) { const p = mod(e + M - 1, L), id = P[p], fresh = lw > 0 && e === lw; out.push({ slot: mod(e + o, M), id, si: Gacha.byId(id).index, fresh, debut: fresh && p >= M && e === p - M + 1, leaving: e === lw - M + 1 }); }
    return out.sort((a, b) => a.slot - b.slot);
  };
  const resting = (R, w = week()) => { const on = new Set(lineup(R, w).map((x) => x.id)); return pool(R).filter((id) => !on.has(id)); };
  // 館の 台に その しゅうの シリーズを いれる（VenueHalls.defs.arcade の 部屋。台は ring・slot で さがす）
  const apply = (day = today()) => {
    const def = typeof VenueHalls !== "undefined" ? VenueHalls.defs.arcade : null; if (!def || !def.floors) return null;
    const w = week(day);
    for (const R of RINGS) {
      const r = def.floors[R.floor]; if (!r) continue;
      for (const it of lineup(R, w)) {
        const f = r.fixtures.find((q) => q.kind === "gacha" && q.ring === R.id && q.slot === it.slot);
        if (f) Object.assign(f, { variant: it.si, series: it.si, fresh: it.fresh, leaving: it.leaving });
      }
    }
    // あんない・かんばんの ことば（さいしょの ことばの あとに こんしゅうの ないよう）
    for (const r of Object.values(def.floors)) for (const f of r.fixtures) if (f.rotInfo) { if (f.baseText == null) f.baseText = f.text || ""; f.text = f.baseText + infoText(f.rotInfo, day, w); }
    return w;
  };
  // "2026-10-12" → "10がつ 12にち"
  const md = (day) => { const [, m, d] = String(day).split("-"); return `${+m}がつ ${+d}にち`; };
  // あんないに たす ことば（kind 2: 2F の かんばん・1: 1F の あんない〔クレーンの きせつの ぬいぐるみ も〕・4: 4F の あんない）
  const infoText = (kind, day, w) => {
    const next = `つぎの いれかえは ${md(monday(w + 1))}（げつようび）。`;
    if (kind === 2) {
      const L = RINGS.filter((R) => R.floor === 2).flatMap((R) => lineup(R, w)), nm = (x) => `「${Gacha.SERIES[x.si].name}」`, fresh = L.filter((x) => x.fresh).map(nm), out = L.filter((x) => x.leaving).map(nm);
      return (fresh.length ? `\nこんしゅうの NEW: ${fresh.join("")}` : "") + `\nらいしゅう おやすみ: ${out.join("")}\n${next}`;
    }
    if (kind === 1) {
      const se = typeof ArcadePrizes !== "undefined" && ArcadePrizes.seasonal ? ["wanko", "gachan", "goji"].map((who) => ArcadePrizes.seasonal(who, day)).filter(Boolean) : [];
      return `\nクレーンの けいひんは まいにち、ガチャは まいしゅう げつようびに かわるよ。つぎの いれかえは ${md(monday(w + 1))}。` + (se.length ? `\nいまの きせつの ぬいぐるみ: ${se.map((it) => it.name.replace(/の ぬいぐるみ$/, "")).join("・")}（1F の 3にんの クレーン）` : "");
    }
    return "\n" + next;
  };
  // いまの しゅうの シリーズの ようす（ガチャの がめん・PokaDebug）
  const stateOf = (si, w = week()) => { for (const R of RINGS) { const it = lineup(R, w).find((x) => x.si === si); if (it) return { ring: R.id, ...it }; } return null; };
  const info = (day = today()) => {
    const w = week(day);
    return { day, week: w, monday: monday(w), next: monday(w + 1), rings: RINGS.map((R) => ({ id: R.id, floor: R.floor, name: R.name, pool: pool(R), slots: lineup(R, w).map((x) => ({ ...x, name: Gacha.SERIES[x.si].name })), resting: resting(R, w) })) };
  };
  // 2F・4F（わの ある 階）に きた とき: まえに きた しゅうと ちがえば おしらせ（はじめて の ときは きろく だけ）
  const notice = (sc) => {
    if (!RINGS.some((R) => R.floor === sc.floor)) return;
    const g = Gacha.st(), w = week(), was = g.week, fl = sc.floor;
    if (was === w) return;
    g.week = w; Save.write();
    if (Number.isFinite(was) && was > 0 && was < w) setTimeout(() => { if (G.scene === sc && !sc.closed && sc.floor === fl) UI.toast("ガチャの なかみが いれかわったよ！"); }, 900);
  };

  const install = () => {
    // 4F の ガチャの しま 6つ（js/gacha-forest.js の ISLES。add・rest は js/gacha-forest-more.js）
    for (const I of GachaForest.ISLES) RINGS.push({ id: "4f-" + I.id, floor: 4, name: I.name, ids: I.ids.slice(), add: (I.add || []).slice(), rest: I.rest || 0, from: 1 });
    // 2F の ガチャ コーナーの 4くみ（js/gacha-corner-more.js の RINGS・台は js/ike-arcade.js の ring／slot・UI-63）
    if (typeof GachaCornerMore !== "undefined") for (const C of GachaCornerMore.RINGS) RINGS.push({ id: C.id, floor: 2, name: C.name, ids: C.ids.slice(), add: C.add.slice(), rest: C.rest || 0, from: 1 });
    // ガチャの がめんの ふだ（js/gacha.js の Gacha.tagOf）
    Gacha.tagOf = (si) => { const s = stateOf(si); return !s ? "" : s.debut ? "NEW！ あたらしい ガチャ" : s.fresh ? "NEW！ また きた ガチャ" : s.leaving ? "らいしゅうは おやすみ" : ""; };
    // 館に はいる・かいを うつる たびに その しゅうの ならびに する（gowaga-wish.js も loadFloor を つつむ・どちらが さきでも よい）
    const VP = VenueScene.prototype, load0 = VP.loadFloor;
    VP.loadFloor = function (...a) {
      const mee = this.def && this.def === VenueHalls.defs.arcade;
      if (mee) apply();
      const r = load0.apply(this, a);
      if (mee && G.sceneName === "venue") notice(this);
      return r;
    };
    // もりの あんない（4F）に いれかえの こと
    const def = VenueHalls.defs.arcade, dir = def && def.floors && def.floors[4] && def.floors[4].fixtures.find((f) => f.kind === "directory");
    if (dir && !/いれかわる/.test(dir.text)) dir.text += "\nガチャの なかみは まいしゅう げつようびに しまごとに 1だいずつ いれかわるよ（NEW の はたが あたらしい ガチャ）";
    if (dir) dir.rotInfo = 4;
    // 1F の フロア あんない: クレーンの 日がわり・ガチャの しゅうがわり・きせつの ぬいぐるみ
    const dir1 = def && def.floors && def.floors[1] && def.floors[1].fixtures.find((f) => f.kind === "directory");
    if (dir1) dir1.rotInfo = 1;
    apply();
  };
  install();

  return { EPOCH, RINGS, week, monday, pool, lineup, resting, apply, stateOf, info, notice, infoText, md };
})();
