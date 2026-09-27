# town-design（町の デザイン見本を 作る 道具）

Node と Playwright（Chromium）で、町の 見本の 画像・部品の 一覧・配置データを 作る。ゲーム本体では 使わない（ここは ES modules で よい）。

```sh
cd game
npm run design:heiwadai   # → docs/design/towns/heiwadai/ に 書き出す
```

| ファイル | 役わり |
| --- | --- |
| `lib.mjs` | 共通の 部品（SVG の 図形・線・文字・影）と 地面の 模様 `defs()`（p-grass・p-asphalt など） |
| `assets.mjs` | 部品（建物・小物・自然・公園・神社・線路）。`def({ id, name, cat, w, h, pass, prio, details, variants, anim, interact }, draw)` |
| `assets_more.mjs` | 追加・作り直しの 部品（商店街・住宅地・公園・交通）。同じ id は こちらが 上書き |
| `heiwadai-v02.mjs` | 平和台 v0.2 の 配置（地面・道の 中心線・建物・小物・人・出口・路面表示） |
| `render.mjs` | 全体図・スマホの 切り抜き・仕様（json/txt）・通れるかの 検査 |
| `sheet.mjs` | 部品の 見本シートと 描く範囲（asset-bbox.json） |
| `assetlist.mjs` | ASSET_LIST.md |
| `heroes.mjs` | ゲームの `chara-data.js` / `chara.js` / `art.js` から 3人と 町の人の SVG を 作る |
| `phones.mjs` / `compare2.mjs` | スマホ見本の まとめ図・v0.1 との 比べ図 |
| `build.mjs` | 上を 順に 実行 |
| `paths.mjs` | 出力先と ブラウザの 起動（`CHROMIUM_PATH` が あれば それを 使う） |

- 1マス = 32px。部品の `draw()` は 足もとの 左上を (0,0) とした SVG 文字列を 返す（高いものは y が マイナスへ はみ出す）。
- 日本語の 文字を 描くので、日本語フォント（Noto Sans CJK JP など）が ない 環境では 文字が □ に なる（絵は 作れる）。
