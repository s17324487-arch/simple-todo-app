# 機能の 見本（①〜⑥）

オーナーが Codex に たのむ 機能ごとに、**見本（画面・絵）＋ 部品リスト（データ・一覧）＋ 作業指示（CODEX_TASK.md）** を 置く ところ。
Claude Code が 見本を 作り、Codex が それを ゲームに 入れる（町の 見本 [`../README.md`](../README.md) と 同じ 流れ）。

| # | 機能 | フォルダ | 見本 | 部品リスト | 作業指示 | PR の 数 |
| --- | --- | --- | --- | --- | --- | --- |
| ① | おうちの 吹き出しと 会話（718種・3人の 性格） | [`home-talk/`](home-talk/) | `img/before-after.png`・`img/bubble-kinds.png` | [`LINES.md`](home-talk/LINES.md)・`home-talk-data.js` | [`CODEX_TASK.md`](home-talk/CODEX_TASK.md) | 2 |
| ② | 町の人の 会話・物々交換・おねがい 20種 | [`townsfolk/`](townsfolk/) | `img/flow.png`・`img/small-phone.png`・`img/items.png` | [`LINES.md`](townsfolk/LINES.md)・[`EVENTS.md`](townsfolk/EVENTS.md)・`townsfolk-data.js` | [`CODEX_TASK.md`](townsfolk/CODEX_TASK.md) | 3 |
| ③ | 釣り（釣りざお・魚 50種・図鑑） | [`fishing/`](fishing/) | `img/fishing-flow.png`・`img/small-phone.png`・`img/fish-sheet-1〜3.png` | [`FISH_LIST.md`](fishing/FISH_LIST.md)・`fishing-data.js` | [`CODEX_TASK.md`](fishing/CODEX_TASK.md) | 3 |
| ④ | 化石ほり（ピッケル・恐竜 10種の 骨 63こ） | [`fossils/`](fossils/) | `img/dig-flow.png`・`img/small-phone.png`・`img/dino-sheet.png`・`img/bone-sheet-1〜2.png` | [`FOSSIL_LIST.md`](fossils/FOSSIL_LIST.md)・`fossil-data.js` | [`CODEX_TASK.md`](fossils/CODEX_TASK.md) | 3 |
| ⑤ | 水族館と 恐竜博物館（寄贈で 展示が ふえる・順路の ある 館内） | [`museum/`](museum/) | `img/aquarium-plan.png`・`img/museum-plan.png`・`img/phones.png`・`img/outside.png`・`img/small-phone.png` | [`MUSEUM_LIST.md`](museum/MUSEUM_LIST.md)・`museum-data.js` | [`CODEX_TASK.md`](museum/CODEX_TASK.md) | 3 |
| ⑥ | 射撃場（本格 エアソフトガン 9種・BB弾の 弾道・実際の 競技 6しゅもく・1人が 主観で うって 2人が おうえん） | [`range/`](range/) | `img/range-flow.png`・`img/gun-sheet.png`・`img/ballistics.png`・`img/small-phone.png` | [`GUN_LIST.md`](range/GUN_LIST.md)・`range-data.js` | [`CODEX_TASK.md`](range/CODEX_TASK.md) | 3 |

見本を 作る 道具は [`../../../tools/feature-design/`](../../../tools/feature-design/)。作り直すときは `npm run design:features`（画像なしなら `-- --no-mock`）。

## いまの 実装状況（Codex と Claude Code の 引き継ぎ）

2026-09-28 から、Codex の 利用制限の あいだは オーナーの 指示で **Claude Code が 代わりに 実装して いる**。
つぎに 作業する 人（Codex でも Claude Code でも）は、**この 表の「つぎ」の 番号から 続ける**。✅ の 番号は もう 作らない（同じ ものを 2回 作ると ぶつかる）。
作業を はじめる まえに、GitHub の あいて いる PR も 見る（同じ 番号の PR が もう あれば それを 仕上げる）。
済んだ 番号は、各 `CODEX_TASK.md` の「PR の 分けかた」と `docs/ROADMAP_V2.md` の M8 にも ✅ を 付けて いる。見本から かえた ところは その `CODEX_TASK.md` の「実装メモ」に ある。

| # | 1番 | 2番 | 3番 |
| --- | --- | --- | --- |
| ① おうちの 吹き出しと 会話 | ✅ 吹き出し（Codex #44） | ✅ 会話データと えらびかた（Claude Code） | — |
| ② 町の人 | ✅ セリフ（Claude Code） | ✅ おねがいの しくみ（Claude Code） | ✅ さがす・さわる・物々交換（Claude Code） |
| ③ 釣り | ✅ 魚の データ・絵・ずかん（Claude Code） | ✅ 釣りざおと 釣りの 画面（Claude Code） | ✅ いけす・うる・つなぎ（Claude Code） |
| ④ 化石ほり | ✅ 骨の データ・絵・かせき ノート（Claude Code） | ✅ ピッケルと ほる（Claude Code） | ✅ ② との つなぎ（物々交換。Claude Code） |
| ⑤ 水族館と 恐竜博物館 | **つぎ**: 町の 建物と 館の 中 | まだ | まだ |
| ⑥ 射撃場 | まだ | まだ | まだ |

## たのむ 順番（おすすめ）

1. ① の 1番（吹き出し）→ ① の 2番（会話データ）
2. ② の 1番（セリフ）→ 2番（おねがいの しくみ）→ 3番（さがす・さわる・物々交換）
3. ③ の 1番（魚の データ・絵・ずかん）→ 2番（釣りの 画面）→ 3番（いけす・うる・つなぎ）
4. ④ の 1番（骨の データ・絵・ノート）→ 2番（ほる）→ 3番（つなぎ）
5. ⑤ の 1番（町の 建物と 館の 中）→ 2番（寄贈）→ 3番（しらべる と つなぎ）。**③④ の 1番が 入って から**
6. ⑥ の 1番（絵と 町の 建物と ロビー）→ 2番（あそぶ 画面）→ 3番（RO の 号令・おうえん・つなぎ）。⑥ だけは オーナーの 指示で AGENTS.md の 9（ほのぼの）を はずして いる（`range/CODEX_TASK.md` の さいしょ）

平和台 v0.2（[`../towns/heiwadai/CODEX_TASK.md`](../towns/heiwadai/CODEX_TASK.md)）と 同時に すすめて よい。ただし 1つの PR に まぜない。

## Codex への 渡しかた（オーナー向け）

1. この フォルダが **main に マージ されている** ことを 確かめる（Codex は main の 中身しか 見えない）。
2. 下の 依頼文を はる（1回に 1つの PR）。上の「いまの 実装状況」で ✅ の 番号は とばして、「つぎ」の 番号を たのむ（依頼文の「1番」を その 番号に かえる）。
3. Codex の PR を 見る: スクリーンショットが 見本の 画像と 同じに 見えるか、`npm test` が ✓ か。
4. よければ マージ。次の 番号を 同じ 依頼文で たのむ（「1番」を「2番」に かえる）。

### ① の 依頼文（そのまま はる）

```text
おうちの吹き出しと会話を、デザイン見本のとおりに作ってください。
手順・互換・完了の条件は game/docs/design/features/home-talk/CODEX_TASK.md にあります。
AGENTS.md → CODEX_TASK.md → LINES.md → game/tools/feature-design/home-bubble-ref.js の順に読み、
CODEX_TASK.md の「PR の分けかた」の 1番だけを、1つの PR にしてください。
吹き出しは home-bubble-ref.js の描きかた・置きかたをそのまま移し、会話データ（home-talk-data.js）は手で直さずにそのままコピーすること。
PR には 390×844 と 375×667（ふつう・みまもり）のスクリーンショットを付け、img/before-after.png の右がわと並べてください。
終わったら、次の番号に進んでよいか私に聞いてください。
```

### ② の 依頼文（そのまま はる）

```text
町の人の会話・物々交換・おねがい（サブイベント）を、デザイン見本のとおりに作ってください。
手順・互換・完了の条件は game/docs/design/features/townsfolk/CODEX_TASK.md にあります。
AGENTS.md → CODEX_TASK.md → EVENTS.md → LINES.md → game/tools/feature-design/folk-ref.js の順に読み、
CODEX_TASK.md の「PR の分けかた」の 1番だけを、1つの PR にしてください。
しくみは folk-ref.js（TownFolkRef）を、絵は TownFolkArt の SVG をそのまま移し、データ（townsfolk-data.js）は手で直さずにそのままコピーすること。
PR には 390×844 と 375×667 のスクリーンショットを付け、img/flow.png・img/small-phone.png の同じ場面と並べてください。
終わったら、次の番号に進んでよいか私に聞いてください。
```

### ③ の 依頼文（そのまま はる）

```text
釣り（釣りざお・魚50種・ずかん）を、デザイン見本のとおりに作ってください。
手順・互換・完了の条件は game/docs/design/features/fishing/CODEX_TASK.md にあります。
AGENTS.md → CODEX_TASK.md → FISH_LIST.md → game/tools/feature-design/fish-art-ref.js → fishing-ref.js の順に読み、
CODEX_TASK.md の「PR の分けかた」の 1番だけを、1つの PR にしてください。
魚の絵は fish-art-ref.js（FishArtRef）を、しくみは fishing-ref.js（FishingRef）をそのまま移し、データ（fishing-data.js）は手で直さずにそのままコピーすること。
PR には 390×844 と 375×667 のスクリーンショットを付け、img/fishing-flow.png・img/fish-sheet-*.png の同じ場面と並べてください。
終わったら、次の番号に進んでよいか私に聞いてください。
```

### ④ の 依頼文（そのまま はる）

```text
化石ほり（ピッケル・恐竜10種の骨・かせきノート）を、デザイン見本のとおりに作ってください。
手順・互換・完了の条件は game/docs/design/features/fossils/CODEX_TASK.md にあります。
AGENTS.md → CODEX_TASK.md → FOSSIL_LIST.md → game/tools/feature-design/fossil-art-ref.js → fossils-ref.js の順に読み、
CODEX_TASK.md の「PR の分けかた」の 1番だけを、1つの PR にしてください。
骨の絵は fossil-art-ref.js（FossilArtRef）を、しくみは fossils-ref.js（FossilRef）をそのまま移し、データ（fossil-data.js）は手で直さずにそのままコピーすること。
PR には 390×844 と 375×667 のスクリーンショットを付け、img/dig-flow.png・img/dino-sheet.png の同じ場面と並べてください。
終わったら、次の番号に進んでよいか私に聞いてください。
```

### ⑤ の 依頼文（そのまま はる。③④ の 1番が 入って から）

```text
水族館と恐竜博物館（寄贈で展示がふえる・順路のある館内）を、デザイン見本のとおりに作ってください。
手順・互換・完了の条件は game/docs/design/features/museum/CODEX_TASK.md にあります。
AGENTS.md → CODEX_TASK.md → MUSEUM_LIST.md → game/tools/feature-design/museum-art-ref.js → museum-render.mjs の順に読み、
CODEX_TASK.md の「PR の分けかた」の 1番だけを、1つの PR にしてください。
館の地図・展示・町に建てる場所はデータ（museum-data.js）を手で直さずにそのままコピーし、展示と建物の外がわの絵は museum-art-ref.js（MuseumArtRef）をそのまま移すこと。
PR には 390×844 と 375×667 のスクリーンショットを付け、img/phones.png・img/outside.png の同じ場面と並べてください。
終わったら、次の番号に進んでよいか私に聞いてください。
```

### ⑥ の 依頼文（そのまま はる）

```text
射撃場（本格エアソフトガン9種・主観の射撃競技6種目）を、デザイン見本のとおりに作ってください。
⑥だけは私の指示で AGENTS.md の9番（ほのぼの・こわくない）をはずし、実際のエアソフトガンと射撃競技に近い、ゲーム性の高いものにします。
手順・互換・完了の条件は game/docs/design/features/range/CODEX_TASK.md にあります。
AGENTS.md → CODEX_TASK.md（とくに「⑥ だけの きまり」）→ GUN_LIST.md → game/tools/feature-design/gun-art-ref.js → range-ref.js の順に読み、
CODEX_TASK.md の「PR の分けかた」の 1番だけを、1つの PR にしてください。
じゅうの絵は gun-art-ref.js（GunArtRef）を、弾道・しくみ・画面は range-ref.js（RangeRef）をそのまま移し、データ（range-data.js）は手で直さずにそのままコピーすること。弾道は GUN_LIST.md の表と同じ数になることをテストで確かめること。
PR には 390×844 と 375×667 のスクリーンショットを付け、img/range-flow.png・img/gun-sheet.png の同じ場面と並べてください。
終わったら、次の番号に進んでよいか私に聞いてください。
```
