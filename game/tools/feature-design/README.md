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
| `fish-data.mjs` | ③ 魚 50種（場所・季節・時間・天気・大きさ・説明・まめちしき・絵の 形）・釣り場・釣りざお |
| `fish-art-ref.js` | ③ 魚の 絵（`FishArtRef`。classic script。`js/fish-art.js` に 移植する） |
| `fishing-ref.js` | ③ 釣りの しくみと 画面（`FishingRef`） |
| `fishing-ui.css` | ③ 釣りの 画面・つれた カード・ずかんの CSS |
| `build-fishing.mjs` | ③ を 検査し（場所×季節×時間で 2しゅ いじょう・マップの 水べ）、`fishing-data.js`・JSON・`FISH_LIST.md` に する |
| `fishing-mock.mjs` | ③ ゲームの 上に 重ねて 画面の 見本・魚の 一覧を 撮る |
| `fossil-data.mjs` | ④ 恐竜 10種（骨格の 形・部品・時代・説明）・化石の 出る 場所・ピッケル |
| `fossil-art-ref.js` | ④ 骨と 骨格の 絵（`FossilArtRef`） |
| `fossils-ref.js` | ④ ほる しくみと 画面（`FossilRef`） |
| `fossil-ui.css` | ④ ほる 画面・みつけた カード・ノートの CSS |
| `build-fossils.mjs` | ④ を 検査し（せぼねの 番号・部品・場所）、`fossil-data.js`・JSON・`FOSSIL_LIST.md` に する |
| `fossils-mock.mjs` | ④ 画面の 見本・骨格と 骨の 一覧を 撮る |
| `museum-data.mjs` | ⑤ 2つの 館の へや・展示・人・案内・説明・ことば・BGM・町に たてる 場所 |
| `museum-art-ref.js` | ⑤ 展示（水そう・骨格の 台・かざり）・建物の 外がわ・かんばんの 絵（`MuseumArtRef`） |
| `museum-render.mjs` | ⑤ 館の 中を 描く 見本（床・かべ・y順） |
| `museum-ui.css` | ⑤ 寄贈の 画面・かんせい・展示の 説明の CSS |
| `build-museum.mjs` | ⑤ を 検査し（魚と 恐竜が 1回ずつ・どこにも 行ける・マスの 文字・町の 場所を ゲームの 地図で）、`museum-data.js`・JSON・`MUSEUM_LIST.md` に する |
| `museum-mock.mjs` | ⑤ 全体図・スマホの 画面・寄贈の 画面・町に たてた ところを 撮る |
| `range-data.mjs` | ⑥ じゅう 9しゅ（参考に した 形・長さ・せいのう・せつめい）・まと・コース・せりふ・町に たてる 場所 |
| `gun-art-ref.js` | ⑥ じゅうの 絵（`GunArtRef`。実物の 長さ・高さの 比・右がわから 見た すがた） |
| `range-ref.js` | ⑥ しくみ（`Game`・人に にせた じどう あそび `bot`）と 画面（`draw`・まと・主観の じゅう・建物の 外がわ） |
| `range-ui.css` | ⑥ HUD・うつ／スコープ・おうえん・じゅうを えらぶ・けっかの CSS |
| `build-range.mjs` | ⑥ を 検査し、じどうで あそんで ★の めやすを きめ、`range-data.js`・JSON・`GUN_LIST.md` に する |
| `range-mock.mjs` | ⑥ じゅうの 一覧・スマホの 画面を 撮る |
| `game-vm.mjs` | ⑤⑥ の 検査で ゲームを node に 読みこむ・町に 建物を たてて みる（`probeOutside`） |
| `build.mjs` | 上を まとめて 動かす（`npm run design:features`） |

文を 直すときは 元データ（`*-lines.mjs` / `*-data.mjs`）を 直して 作りなおす。`docs/design/features/**/**-data.js` を 手で 直さない。
