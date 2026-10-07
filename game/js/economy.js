// 報酬と難易度を同じ式で計算し、tools/balance.mjs からも確認する。
// おみせ Lv.1〜5 は ちゅうもんの むずかしさと いっしょに コインが ふえる（+28% ずつ）。
// Lv.6 からは 1レベル ごとに すこしずつ（+2%。Lv.30 で +50%・Lv.50 で +90%。lvBonus・UI-108）。チップも おなじ わりあいで ふえる（unit）。
const GameEconomy = {
  modes: { easy: { name:"のんびり", time:1.35, enemy:.75, reward:.65 }, normal:{ name:"ふつう", time:1, enemy:1, reward:1 }, hard:{ name:"むずかしい", time:.8, enemy:1.3, reward:1.5 } },
  shopBase: { burger:28, groom:34, cake:30, crepe:14, florist:18, bakery:24, dentist:28, relay:96, range:60, korokoro:44, gasstand:36, postoffice:32, brain:40, kobo:40 },
  lvMax: 50, lvStep: 0.02,
  mode(id) { return this.modes[id] || this.modes.normal; },
  // おみせ Lv の コインの ばいりつ（Lv.5 まで 1）・その ふえた ぶんの ％（がめんに だす）
  lvBonus(lv) { const n = Math.min(this.lvMax, Math.max(5, Math.floor(Number(lv)) || 1)); return n > 5 ? 1 + this.lvStep * (n - 5) : 1; },
  lvBonusPct(lv) { return Math.round((this.lvBonus(lv) - 1) * 100); },
  // 1にんぶんの もと（○ の とき。チップの けいさんにも つかう）
  unit(shop, lv, mode="normal") { return this.shopBase[shop]*(1+.28*(Math.min(5,lv)-1))*this.mode(mode).reward*this.lvBonus(lv); },
  pay(shop,lv,rank,mode="normal") { if(shop==="link")return 0; return Math.round(this.shopBase[shop]*(1+.28*(Math.min(5,lv)-1))*[0,.45,1,1.5][rank]*this.mode(mode).reward*this.lvBonus(lv)); },
  battle(coins,mode="normal",count=1) { return Math.round(coins*1.25*this.mode(mode).reward*(1+.1*(count-1))); },
};
