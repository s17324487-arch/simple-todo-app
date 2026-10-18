// コインの じょうげん（300まん）と はじめからの とくべつ スタート（2026-10-18〜20・300まん）の 検査（ブラウザ なし）
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";
const R = gameContext();
const { Save } = R;
let n = 0;
const ok = (c, m) => { n++; assert(c, m); };
const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
// じょうげん
ok(Save.COIN_MAX === 3000000, "じょうげんは 300まん");
Save.d = Save.fresh(); ok(Save.d.coins === 150, "ふつうの はじめは 150");
Save.d.coins = 2999000; Save.addCoins(5000); ok(Save.d.coins === 3000000, "300まんで とまる " + Save.d.coins);
Save.addCoins(1); ok(Save.d.coins === 3000000, "300まんから ふえない");
Save.addCoins(-1000); ok(Save.d.coins === 2999000, "つかうと へる");
Save.d.coins = 5000000; Save.addCoins(100); ok(Save.d.coins === 5000000, "まえから おおい セーブは へらさない・ふえない");
Save.addCoins(-100); ok(Save.d.coins === 4999900, "おおい セーブも つかえる");
ok(Save.capCoins(100, 300) === 300 && Save.capCoins(2999999, 3000005) === 3000000 && Save.capCoins(500, 200) === 200, "capCoins");
// コインを じかに たす ところは capCoins を とおす
for (const f of ["js/crane-scene.js", "js/gacha.js"]) { const src = read(f); ok(!/Save\.d\.coins \+=/.test(src) && /Save\.capCoins\(/.test(src), `${f}: じかに たさない`); }
for (const f of ["js/save.js", "js/scene-battle.js", "js/shop.js", "js/minigames.js"]) ok(!/\.d\.coins \+=|Save\.d\.coins \+=/.test(read(f)), `${f}: Save.d.coins += が ない`);
// とくべつ スタートの きかん（にほんの 10/18 0じ 〜 10/21 0じ）
const B = Save.START_BONUS, jst = (y, m, d, h = 0, mi = 0) => Date.UTC(y, m - 1, d, h - 9, mi);
ok(B.coins === 3000000 && B.from === jst(2026, 10, 18) && B.to === jst(2026, 10, 21), "きかんと コイン");
ok(Save.startBonus(jst(2026, 10, 17, 23, 59)) === 0 && Save.startBonus(jst(2026, 10, 18)) === 3000000 && Save.startBonus(jst(2026, 10, 20, 23, 59)) === 3000000 && Save.startBonus(jst(2026, 10, 21)) === 0, "3にちかん だけ");
Save.d = Save.fresh(); ok(Save.applyStartBonus(jst(2026, 10, 19, 12)) === 3000000 && Save.d.coins === 3000000 && Save.d.flags.startBonus === jst(2026, 10, 19, 12), "きかんの あいだに はじめると 300まん");
Save.d = Save.fresh(); ok(Save.applyStartBonus(jst(2026, 10, 22)) === 0 && Save.d.coins === 150 && !Save.d.flags.startBonus, "きかんの あとは ふつう");
// タイトルの はじめから だけ（PokaDebug.newGame・Save.fresh は かわらない）
const title = read("js/scene-title.js"), dbg = read("js/debug.js");
ok(/Save\.reset\(\);\s*const bonus = Save\.applyStartBonus\(\);/.test(title) && !/applyStartBonus/.test(read("js/save.js").slice(read("js/save.js").indexOf("fresh()"), read("js/save.js").indexOf("fresh()") + 4000)), "タイトルの はじめから だけ");
ok(!/applyStartBonus/.test(dbg.slice(dbg.indexOf("newGame({"), dbg.indexOf("newGame({") + 300)) && /startBonus\(from = null, to = null\)/.test(dbg), "PokaDebug");
console.log(`✓ コインの じょうげん・とくべつ スタート: ${n} 項目`);
