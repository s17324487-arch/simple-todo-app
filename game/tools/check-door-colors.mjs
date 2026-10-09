// おうちの ドアの いろ（js/home-door-colors.js・UI-111。オーナーの 指示 2026-10-09「トイレとかのドアの色を変えれるようにしたい。」）の 検査。
// ブラウザ なしで: いろ 12・なまえ・セーブ（はじめの いろ・ふるい セーブ・しらない いろ）・えらぶ・へやの 絵に その いろ・絵の キー・とうろく。
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { HomeDoorColors: C, HomeDesign, HomeToilet, Save: S } = R;
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const read = (f) => readFileSync(new URL("../" + f, import.meta.url), "utf8");

// ---- 1. いろ と なまえ ----
ok(C.PALETTE.length === 12 && new Set(C.PALETTE.map((p) => p.id)).size === 12, "いろは 12・id は ちがう");
for (const p of C.PALETTE) {
  ok(["base", "light", "dark"].every((k) => /^#[0-9A-F]{6}$/i.test(p[k])), `${p.id}: いろの かきかた`);
  ok(p.name && !/[一-鿿]/.test(p.name) && [...p.name].length <= 7, `${p.id}: なまえは ひらがな・カタカナ 7もじ まで（${p.name}）`);
}
ok(C.DOORS.map(([k]) => k).join() === "out,room,toilet", "ドアは おでかけ・おへや・おトイレ");
ok(C.color("wood").base === "#A68252" && C.color("mint").base === "#BFE3D8", "はじめの いろは まえの 絵と おなじ（き・ミント）");

// ---- 2. セーブ ----
{
  const f = S.fresh();
  ok(JSON.stringify(f.doorColors) === JSON.stringify(C.DEFAULT) && S.SCHEMA === 2, "Save.fresh() の doorColors は はじめの いろ・SCHEMA は 2 の まま");
  const old = S.fresh(); delete old.doorColors; S.migrate(old);
  ok(JSON.stringify(old.doorColors) === JSON.stringify(C.DEFAULT), "ふるい セーブには はじめの いろを たす");
  S.d = S.fresh();
  ok(C.set("toilet", "pink") && C.cur().toilet === "pink" && C.cur().out === "wood", "えらぶと その ドアだけ かわる");
  ok(!C.set("toilet", "gold") && !C.set("kitchen", "pink") && C.cur().toilet === "pink", "しらない いろ・ドアは えらべない");
  S.d.doorColors = { out: "rainbow", room: 3, toilet: "navy" };
  ok(JSON.stringify(C.cur()) === JSON.stringify({ out: "wood", room: "wood", toilet: "navy" }), "こわれた いろは はじめの いろに");
  S.d.doorColors = null; ok(JSON.stringify(C.cur()) === JSON.stringify(C.DEFAULT), "doorColors が なくても うごく");
}

// ---- 3. へやの 絵 と キー ----
{
  S.d = S.fresh();
  const size = HomeDesign.size(), base = HomeDesign.roomSvg("wp_cream", "fl_wood", size, C.DEFAULT);
  ok(base.includes('fill="#A68252"') && base.includes('fill="#BFE3D8"'), "はじめの いろで 描く");
  const svg = HomeDesign.roomSvg("wp_cream", "fl_wood", size, { out: "red", room: "sky", toilet: "black" });
  ok(svg.includes(`fill="${C.color("red").base}"`) && svg.includes(`fill="${C.color("sky").base}"`), "おでかけ・おへやの ドアの いろ");
  const wc = svg.slice(svg.indexOf('class="wc-door"'));
  ok(wc.includes(`fill="${C.color("black").base}"`) && !wc.includes('fill="#BFE3D8"'), "おトイレの ドアの いろ");
  ok(HomeToilet.doorSvg(HomeDesign.H, "lemon").includes(C.color("lemon").base), "HomeToilet.doorSvg に いろ");
  C.set("room", "green");
  ok(HomeDesign.roomSvg("wp_cream", "fl_wood", size).includes(`fill="${C.color("green").base}"`), "いろを わたさなければ いまの いろ");
  ok(C.sig() === "wood-green-mint" && C.sig(C.DEFAULT) === "wood-wood-mint", "キーの しるし（いろの id 3つ・有限）");
  const house = read("js/scene-house.js"), floors = read("js/home-floors.js");
  ok(/"house-design:"[^\n]*HomeDoorColors\.sig\(doors\)/.test(house) && /HomeDoorColors\.DEFAULT : HomeDoorColors\.cur\(\)/.test(house), "おへやの 絵の キーに ドアの いろ（よその おへやは はじめの いろ）");
  ok(/"house-design:"[^\n]*HomeDoorColors\.sig\(\)/.test(floors), "2かいの 絵の キーにも ドアの いろ");
  ok(/\["door", "ドア"\]/.test(house) && house.includes("HomeDoorColors.set(this.doorPick"), "もようがえに「ドア」の タブ");
  ok(C.PALETTE.every((p) => C.icon(p.id).includes(p.base) && !C.icon(p.id).includes("id=")), "カードの 小さな ドアの 絵（id は つかわない）");
}

// ---- 4. とうろく ----
{
  const html = read("index.html"), sw = read("sw.js");
  ok(html.includes('<script src="js/home-door-colors.js"></script>') && sw.includes('"./js/home-door-colors.js"'), "index.html と sw.js に とうろく");
}
console.log(`✓ ドアの いろ（UI-111）: ${n} 項目`);
