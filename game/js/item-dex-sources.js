// 図鑑の入手ヒント。景品・季節の条件は、配布側のカタログから読む。
const ItemDexSources = {
  source(kind, item) {
    if (!item || (kind !== "wear" && kind !== "furn")) return "";
    const id = item.id;
    if (typeof ANNUAL_EVENTS !== "undefined") {
      const event = ANNUAL_EVENTS.find(e => e.items[kind] === id);
      if (event) return `${event.month}がつの「${event.name}」の きねんひん。`;
    }
    if (typeof SEASON_ITEMS !== "undefined" && typeof Seasonal !== "undefined") {
      const season = Object.keys(SEASON_ITEMS).find(key => SEASON_ITEMS[key][kind] === id);
      const event = season && Seasonal.events[season];
      if (event) return `${event.period}の「${event.name}」で スタンプを あつめよう。`;
    }
    if (kind === "furn") {
      if (typeof ShopRewards !== "undefined") {
        const prize = ShopRewards.prizes.find(p => p.id === id);
        if (prize) {
          const name = typeof SHOPS !== "undefined" && SHOPS[prize.shop] ? SHOPS[prize.shop].name : "おみせ";
          return `${name}の おてつだいで レベル ${prize.level}に すると もらえるよ。`;
        }
      }
      if (typeof PUZZLE_PRIZES !== "undefined") {
        const prize = PUZZLE_PRIZES.find(p => p.id === id);
        if (prize) return `パズルで ${prize.score}てんに とどくと もらえるよ。`;
      }
      if (typeof QuizPrizes !== "undefined" && QuizPrizes.items.some(p => p.id === id)) {
        return "まちの クイズに せいかいすると、たまに もらえるよ。";
      }
      if (id === "player_boombox") return "おてつだいや たからばこで はじめて ディスクを もらうと てに はいるよ。";
      if (id === "player_gramophone") return "ディスクを 3まい あつめて たからばこを あけると、たまに もらえるよ。";
      if (id === "player_jukebox") return "ディスクを 8まい あつめると もらえるよ。";
    }
    if ((kind === "wear" && id === "crown") || (kind === "furn" && id === "trophy")) {
      const name = typeof ENEMIES !== "undefined" && ENEMIES.king ? ENEMIES.king.name : "どうくつの おうさま";
      return `${name}に はじめて かつと もらえるよ。`;
    }
    if (kind === "wear" && id === "batwings") {
      const name = typeof ENEMIES !== "undefined" && ENEMIES.koumori ? ENEMIES.koumori.name : "どうくつの コウモリ";
      return `${name}に かつと、たまに もらえるよ。`;
    }
    if (typeof BUY_SHOPS !== "undefined") {
      const shop = BUY_SHOPS[kind === "wear" ? "clothes" : "furniture"];
      const tab = kind === "wear" ? item.slot : item.kind === "wall" ? "wall" : "floor";
      if (shop && shop.items(tab).some(it => it.id === id)) return `${shop.name}で かえるよ。`;
    }
    return "たんけんや イベントで さがして みよう。";
  },
};
