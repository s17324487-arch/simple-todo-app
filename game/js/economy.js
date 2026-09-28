// 報酬と難易度を同じ式で計算し、tools/balance.mjs からも確認する。
const GameEconomy = {
  modes: { easy: { name:"のんびり", time:1.35, enemy:.75, reward:.65 }, normal:{ name:"ふつう", time:1, enemy:1, reward:1 }, hard:{ name:"むずかしい", time:.8, enemy:1.3, reward:1.5 } },
  shopBase: { cake:30, crepe:14, florist:18, bakery:24, dentist:28, relay:96 },
  mode(id) { return this.modes[id] || this.modes.normal; },
  pay(shop,lv,rank,mode="normal") { if(shop==="link")return 0; return Math.round(this.shopBase[shop]*(1+.28*(lv-1))*[0,.45,1,1.5][rank]*this.mode(mode).reward); },
  battle(coins,mode="normal",count=1) { return Math.round(coins*1.25*this.mode(mode).reward*(1+.1*(count-1))); },
};
