// 平和台 デザイン見本 v0.2 を ぜんぶ 作り直す: npm run design:heiwadai
//   1. render.mjs    … 全体図（img/plan.png）・仕様（heiwadai-v02.json / .txt）・スマホの 切り抜き（途中ファイル）
//   2. sheet.mjs     … アセットの 見本シート（img/asset_sheet_1〜4.png）
//   3. assetlist.mjs … アセットリスト（ASSET_LIST.md）
//   4. phones.mjs    … スマホ 1画面の 見本（img/phones.png）
//   5. compare2.mjs  … v0.1 との 比べ図（img/compare.png）
// 日本語の 文字を 描くので「Noto Sans CJK JP」などの 日本語フォントが 必要（ないと 文字が □ になる）。
for (const f of ["render.mjs", "sheet.mjs", "assetlist.mjs", "phones.mjs", "compare2.mjs"]) { const t = Date.now(); await import(`./${f}`); console.log(`✓ ${f} (${((Date.now() - t) / 1000).toFixed(1)}s)`); }
