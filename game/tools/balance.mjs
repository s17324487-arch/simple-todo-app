// チップ・装備・ごきげん加算前の報酬を、実装と同じ式から表示する。
import { readFileSync } from "node:fs";
import vm from "node:vm";
const economy = vm.runInNewContext(readFileSync(new URL("../js/economy.js", import.meta.url), "utf8") + ";GameEconomy");
console.table(Object.keys(economy.shopBase).map(shop => {
  const rounds = shop === "relay" ? 3 : 4;
  return { shop, rounds, easy: rounds * economy.pay(shop,1,3,"easy"), normal: rounds * economy.pay(shop,1,3), hard: rounds * economy.pay(shop,1,3,"hard") };
}));
console.log("battle: former 100 coins, one / three foes", economy.battle(100), economy.battle(100,"normal",3));

const rules=vm.runInNewContext(readFileSync(new URL("../js/puzzle-engine.js",import.meta.url),"utf8")+";PUZZLE_RULES");
console.log("puzzle: entry",rules.fee,"coins; no coin wages; exclusive score prizes. Free practice available.");
