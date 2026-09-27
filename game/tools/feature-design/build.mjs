// ①〜⑥ の 見本（データ・一覧・画像）を まとめて 作りなおす: npm run design:features
//   --no-mock … 画像を 撮らない（ブラウザ不要。データと 一覧だけ）
//   --only=townsfolk … 名前に その 文字が ある ものだけ
import { execFileSync } from "node:child_process";
const args = process.argv.slice(2), noMock = args.includes("--no-mock"), only = (args.find((a) => a.startsWith("--only=")) || "").slice(7);
const HERE = new URL(".", import.meta.url).pathname;
// [作る もの, 画像]。⑤ は ③④ の データ（fishing.json・fossils.json）を 読むので その あと。あとから ⑥ を 足す
const JOBS = [
  ["build-home-talk.mjs", "home-talk-mock.mjs"],   // ① おうちの 吹き出しと 会話
  ["build-townsfolk.mjs", "townsfolk-mock.mjs"],   // ② 町の人
  ["build-fishing.mjs", "fishing-mock.mjs"],       // ③ 釣り
  ["build-fossils.mjs", "fossils-mock.mjs"],       // ④ 化石ほり
  ["build-museum.mjs", "museum-mock.mjs"],         // ⑤ 水族館と 恐竜博物館
];
for (const [build, mock] of JOBS) {
  if (only && !build.includes(only)) continue;
  execFileSync(process.execPath, [HERE + build], { stdio: "inherit" });
  if (!noMock && mock) execFileSync(process.execPath, [HERE + mock], { stdio: "inherit" });
}
