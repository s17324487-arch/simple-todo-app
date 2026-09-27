# tools/feature-design — ①〜⑥ の 見本を 作る 道具

ゲームの 機能（① おうちの 吹き出しと 会話・② 町の人 …）の「見本」を 作る。できた ものは `docs/design/features/<機能>/` に 書き出す。
ゲーム本体（`js/`）からは 使わない。ここの `.mjs` は ES modules で よい（AGENTS.md の 3）。

```bash
npm run design:features               # ぜんぶ（データ・一覧・画像）。画像には ブラウザと 日本語フォントが いる
npm run design:features -- --no-mock  # データと 一覧だけ（ブラウザ不要）
npm run design:features -- --only=townsfolk
```

| ファイル | 中身 |
| --- | --- |
| `home-lines.mjs` | ① セリフの 元データ（まわり・性格・ぱぱまま・めずらしい・かけあい・くせ） |
| `build-home-talk.mjs` | ① を 検査して `home-talk-data.js`・JSON・`LINES.md` に する |
| `home-bubble-ref.js` | ① 吹き出しの 見本の 実装（classic script。`js/home-life.js` に 移植する） |
| `home-talk-mock.mjs` | ① ゲームを 動かして いま と 見本を 撮る |
| `townsfolk-data.mjs` | ② 町の人の セリフ・ひとこと・物々交換・おねがい・もちもの |
| `folk-ref.js` | ② しくみ（`TownFolkRef`）と 絵（`TownFolkArt`）の 見本の 実装 |
| `folk-ui.css` | ② ノート・交換カード・ボタンの CSS |
| `build-townsfolk.mjs` | ② を ゲームの データと 照らして 検査し、20 の おねがいを 動かして たしかめ、`townsfolk-data.js`・JSON・一覧に する |
| `townsfolk-mock.mjs` | ② ゲームを 動かして 画面の 見本を 撮る・文が 会話まどに おさまるか はかる |
| `build.mjs` | 上を まとめて 動かす（`npm run design:features`） |

文を 直すときは 元データ（`*-lines.mjs` / `*-data.mjs`）を 直して 作りなおす。`docs/design/features/**/**-data.js` を 手で 直さない。
