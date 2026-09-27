// SVGマスター(game/assets/chara) を解析して game/js/chara-data.js を生成する。
// 使い方: node game/tools/build-chara.mjs
//
// 素材の構造:
//   <g 左足/> <g 右足/> <g からだ(しっぽ・うで・どう・あたま・かお)/>
// 全ポーズは idle_01 と同じ要素で、グループの transform だけが違う。
// 表情ファイルは からだグループの末尾(顔パーツ)だけが違う。
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const assetDir = join(root, "assets", "chara");

const CHARAS = {
  wanko: { dir: "wanko/svg", faces: ["normal", "smile", "angry", "cry", "surprise", "sleep"] },
  gachan: { dir: "gachan/svg", faces: ["normal", "smile", "angry", "cry", "sparkle", "sleep"] },
  goji: { dir: "goji/soft/svg", darkDir: "goji/dark/svg", faces: ["normal", "calm", "cry", "love", "shout", "surprise"] },
};
const POSES = ["idle_01", "idle_02", "walk_01", "walk_02", "jump_01", "land_01"];

function parse(file) {
  const src = readFileSync(join(assetDir, file), "utf8");
  const viewBox = /viewBox="([^"]+)"/.exec(src)[1];
  const groups = [];
  const reG = /<g transform="([^"]*)">([\s\S]*?)<\/g>/g;
  let m;
  while ((m = reG.exec(src))) {
    const els = m[2].match(/<\w+\b[^>]*\/>/g) || [];
    groups.push({ transform: m[1], els });
  }
  if (groups.length !== 3) throw new Error(`${file}: expected 3 groups, got ${groups.length}`);
  return { viewBox, groups };
}

const out = {};
for (const [id, def] of Object.entries(CHARAS)) {
  const name = (f) => `${def.dir}/${id}_${f}.svg`;
  const idle = parse(name("idle_01"));
  const faceEls = {};
  for (const f of def.faces) faceEls[f] = parse(name(`face_${f}`)).groups[2].els;

  // 全表情に共通する先頭要素 = 顔以外のからだ
  let prefix = 0;
  const lists = Object.values(faceEls);
  while (lists.every((l) => l[prefix] !== undefined && l[prefix] === lists[0][prefix])) prefix++;
  const base = lists[0].slice(0, prefix);
  const faces = {};
  for (const f of def.faces) faces[f] = faceEls[f].slice(prefix);

  // ポーズは transform のみ抽出。要素が idle_01 と同一であることを検証する。
  const poses = {};
  for (const p of POSES) {
    const svg = parse(name(p));
    svg.groups.forEach((g, i) => {
      if (g.els.join("") !== idle.groups[i].els.join("")) throw new Error(`${id} ${p}: group ${i} differs from idle_01`);
    });
    poses[p] = svg.groups.map((g) => g.transform);
  }

  if (def.darkDir) {
    // dark は塗り色だけが違うことを検証
    for (const p of POSES) {
      const soft = readFileSync(join(assetDir, name(p)), "utf8");
      const dark = readFileSync(join(assetDir, `${def.darkDir}/${id}_${p}.svg`), "utf8");
      if (soft.replaceAll("#8C8686", "#4A4A4C") !== dark) throw new Error(`${id} ${p}: dark variant differs beyond body color`);
    }
  }

  out[id] = { viewBox: idle.viewBox, feet: [idle.groups[0].els, idle.groups[1].els], base, faces, poses };
  console.log(`${id}: base ${base.length} els, faces ${def.faces.join("/")}`);
}

const js =
  "// 自動生成ファイル: node game/tools/build-chara.mjs で再生成する。手で編集しないこと。\n" +
  "const CHARA_DATA = " + JSON.stringify(out, null, 1) + ";\n";
writeFileSync(join(root, "js", "chara-data.js"), js);
console.log("wrote js/chara-data.js");
