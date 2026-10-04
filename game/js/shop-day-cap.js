// おてつだいで きょう もらった コインの きろく（1つの おみせごと）。
// UI-67（オーナーの FB 2026-10-03「一つのお店で1日でお手伝いできる金額を…上限は20000円にして」）で つくった
// 「1つの おみせで 1にち 20000コイン まで」の じょうげんは、オーナーの FB 2026-10-04「お手伝いの上限金額について、
// やっぱりなしにして」で なくした（UI-83）。いまは おてつだいの けっかに「きょう この おみせで もらった コイン」を だすだけ。
// きょう もらった ぶんは Save.d.shopDay（{ day: "2026-10-3", earn: { bakery: 1234 } }）。日づけ（U.today）が かわったら 0 から。
// おみせの キーは ShopScene の shopId。おなじ shopId でも べつの おみせは べつに かぞえる
// （ヘイワダイの マックさん = burger_mac・びっくぽの キッチン = bikkupo_burger。あたまの たいそう・パズル こうぼうの ゲームは おなじ おみせ）。
const ShopDayCap = {
  key(shop, variant = null, venue = null) { return variant === "mac" ? shop + "_mac" : venue ? venue + "_" + shop : shop; },
  state() {
    const s = Save.d.shopDay, day = U.today();
    if (!s.earn || typeof s.earn !== "object" || Array.isArray(s.earn)) s.earn = {};
    if (s.day !== day) { s.day = day; s.earn = {}; }
    return s;
  },
  earned(key) { const v = this.state().earn[key]; return Number.isFinite(v) && v > 0 ? Math.floor(v) : 0; },
  add(key, n) {
    n = Math.floor(Number(n) || 0);
    if (n <= 0) return;
    this.state().earn[key] = this.earned(key) + n;
    Save.mark();
  },
  line(key) { return `きょう この おみせで もらった コイン ${U.fmt(this.earned(key))}`; },
};
