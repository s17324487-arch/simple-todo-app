# 機能の 見本（①〜⑥）

オーナーが Codex に たのむ 機能ごとに、**見本（画面・絵）＋ 部品リスト（データ・一覧）＋ 作業指示（CODEX_TASK.md）** を 置く ところ。
Claude Code が 見本を 作り、Codex が それを ゲームに 入れる（町の 見本 [`../README.md`](../README.md) と 同じ 流れ）。

| # | 機能 | フォルダ | 見本 | 部品リスト | 作業指示 | PR の 数 |
| --- | --- | --- | --- | --- | --- | --- |
| ① | おうちの 吹き出しと 会話（718種・3人の 性格） | [`home-talk/`](home-talk/) | `img/before-after.png`・`img/bubble-kinds.png` | [`LINES.md`](home-talk/LINES.md)・`home-talk-data.js` | [`CODEX_TASK.md`](home-talk/CODEX_TASK.md) | 2 |
| ② | 町の人の 会話・物々交換・おねがい 20種 | [`townsfolk/`](townsfolk/) | `img/flow.png`・`img/small-phone.png`・`img/items.png` | [`LINES.md`](townsfolk/LINES.md)・[`EVENTS.md`](townsfolk/EVENTS.md)・`townsfolk-data.js` | [`CODEX_TASK.md`](townsfolk/CODEX_TASK.md) | 3 |
| ③ | 釣り（釣りざお・魚 50種・図鑑） | これから | | | | |
| ④ | 化石ほり（ピッケル・恐竜 10種の 骨） | これから | | | | |
| ⑤ | 水族館と 恐竜博物館（寄贈で 展示が ふえる） | これから | | | | |
| ⑥ | 射撃場（エアガンの 的あて） | これから | | | | |

見本を 作る 道具は [`../../../tools/feature-design/`](../../../tools/feature-design/)。作り直すときは `npm run design:features`（画像なしなら `-- --no-mock`）。

## たのむ 順番（おすすめ）

1. ① の 1番（吹き出し）→ ① の 2番（会話データ）
2. ② の 1番（セリフ）→ 2番（おねがいの しくみ）→ 3番（さがす・さわる・物々交換）
3. ③〜⑥ は 見本が できたら ここに 足す（③ 釣り → ④ 化石 → ⑤ 水族館・博物館 → ⑥ 射撃場。⑤ は ③④ の あと）

平和台 v0.2（[`../towns/heiwadai/CODEX_TASK.md`](../towns/heiwadai/CODEX_TASK.md)）と 同時に すすめて よい。ただし 1つの PR に まぜない。

## Codex への 渡しかた（オーナー向け）

1. この フォルダが **main に マージ されている** ことを 確かめる（Codex は main の 中身しか 見えない）。
2. 下の 依頼文を はる（1回に 1つの PR）。
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
