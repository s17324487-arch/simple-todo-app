// おてつだいの コインは 1つの おみせで 1にち 20000コイン まで（UI-67。オーナーの FB 2026-10-03
// 「一つのお店で1日でお手伝いできる金額を…上限は20000円にして」）。
// きょう もらった ぶんは Save.d.shopDay（{ day: "2026-10-3", earn: { bakery: 1234 } }）。日づけ（U.today）が かわったら 0 から。
// おみせの キーは ShopScene の shopId。おなじ shopId でも べつの おみせは べつに かぞえる
// （ヘイワダイの マックさん = burger_mac・びっくぽの キッチン = bikkupo_burger。あたまの たいそう・パズル こうぼうの 3しゅは おなじ おみせ）。
const ShopDayCap = {
  MAX: 20000,
  key(shop, variant = null, venue = null) { return variant === "mac" ? shop + "_mac" : venue ? venue + "_" + shop : shop; },
  state() {
    const s = Save.d.shopDay, day = U.today();
    if (!s.earn || typeof s.earn !== "object" || Array.isArray(s.earn)) s.earn = {};
    if (s.day !== day) { s.day = day; s.earn = {}; }
    return s;
  },
  earned(key) { const v = this.state().earn[key]; return Number.isFinite(v) && v > 0 ? Math.floor(v) : 0; },
  left(key) { return Math.max(0, this.MAX - this.earned(key)); },
  full(key) { return this.left(key) <= 0; },
  add(key, n) {
    n = Math.floor(Number(n) || 0);
    if (n <= 0) return;
    this.state().earn[key] = Math.min(this.MAX, this.earned(key) + n);
    Save.mark();
  },
  // うりあげ（pay）と チップ（tip）を のこり（left）に おさめる。うりあげ から さきに。cut は へった ぶん
  clip(left, pay, tip) {
    left = Math.max(0, Math.floor(left));
    const p = Math.max(0, Math.min(pay, left)), t = Math.max(0, Math.min(tip, left - p));
    return { pay: p, tip: t, cut: Math.max(0, pay + tip - p - t) };
  },
  // ことば（おみせの 人が いう）
  fullText: "きょうは もう たくさん てつだって もらったよ。\nありがとう！ また あした おねがいね。\n（1つの おみせで\n1にち 20000コイン まで）",
  stopText: "きょうの コインは ここまで！\nたくさん てつだって くれて ありがとう。\nまた あした おねがいね。",
  leftText(key) { return `きょう この おみせで もらえる コインは あと ${U.fmt(this.left(key))}コイン だよ。`; },
  line(key) { return `この おみせで きょう もらった コイン ${U.fmt(this.earned(key))} / ${U.fmt(this.MAX)}`; },
};
