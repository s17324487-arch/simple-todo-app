# デザイン見本（町・アセット）

ゲームの 見た目の **正解（見本）** を 置く ところ。Claude Code が 見本を 作り、Codex が それを ゲームに 入れる。

| ファイル | 中身 |
| --- | --- |
| [`towns/nerikasu-station/README.md`](towns/nerikasu-station/README.md) | ネリカス駅の原画集 v0.1（32種のSVG・昼夜・スマホ配置見本。本編組み込み前） |
| [`TOWN_GUIDE.md`](TOWN_GUIDE.md) | 町づくりの 共通の きまり（道・見かた・にぎやかさの めやす・確かめかた） |
| [`towns/renewal/README.md`](towns/renewal/README.md) | ぽかぽかタウン・シティ・港・空港のテーマ、街区の配置、保存データの互換と検証 |
| [`towns/heiwadai/CODEX_TASK.md`](towns/heiwadai/CODEX_TASK.md) | 平和台を v0.2 に 作り直す 作業指示（PR の 分けかた・互換・完了の 条件） |
| [`towns/heiwadai/ASSET_LIST.md`](towns/heiwadai/ASSET_LIST.md) | 部品 107種の 一覧（必須の 細部・はみ出し・優先度・使った数・出典） |
| `towns/heiwadai/img/` | 全体図 `plan.png`・スマホ見本 `phones.png`・比べ図 `compare.png`・部品の 見本 `asset_sheet_1〜4.png`・v0.1 `v01_plan.png` |
| `towns/heiwadai/heiwadai-v02.json` / `.txt` | 配置の データ（道・建物・小物・人・出口・路面表示）と 通れる マスの ASCII |
| `towns/heiwadai/asset-bbox.json` | 各部品の 描く範囲（足もとの 左上を 0,0 とした [x0,y0,x1,y1]） |
| [`../../tools/town-design/`](../../tools/town-design/) | 見本を 作る コード（部品の SVG・道の 描きかた・配置）。**絵の 正解は ここの SVG** |
| [`../../tools/town-audit.mjs`](../../tools/town-audit.mjs) | 町の 検査（`npm run audit:town`） |
| [`features/README.md`](features/README.md) | **機能の 見本 ①〜⑥**（おうちの 会話・町の人・釣り・化石・水族館と 博物館・射撃場）と Codex への 依頼文 |

## 見本を 作り直す（見本を 変えたとき）

```sh
cd game
npm run design:heiwadai    # img/・ASSET_LIST.md・json/txt を ぜんぶ 作り直す（約 20秒。日本語フォントが 必要）
npm run audit:town         # いまの ゲームの 町を 検査（見本では なく ゲームの ほう）
```

## Codex への 渡しかた（オーナー向け）

1. この フォルダが **main に マージ されている** ことを 確かめる（Codex は main の 中身しか 見えない）。
2. Codex に 下の 依頼文を はる（1回に 1つの PR）。
3. Codex の PR を 見る: スクリーンショットが `img/phones.png` と 同じに 見えるか、`npm run audit:town -- --check heiwadai` が ✓ か。
4. よければ マージ。次の 番号を 同じ 依頼文で たのむ（「1番」を「2番」に かえる）。

### 依頼文（そのまま はる）

```text
平和台を、デザイン見本 v0.2 のとおりに作り直してください。
手順・互換・完了の条件は game/docs/design/towns/heiwadai/CODEX_TASK.md にあります。
AGENTS.md → game/docs/design/TOWN_GUIDE.md → CODEX_TASK.md → ASSET_LIST.md の順に読み、
CODEX_TASK.md の「PR の分けかた」の 1番だけを、1つの PR にしてください。
絵は game/tools/town-design/assets.mjs と assets_more.mjs の SVG をそのまま移し、別の絵に置きかえたり細部をはぶいたりしないこと。
PR には 390×844 と 375×667 のスクリーンショットを付け、img/phones.png の同じ場所と並べてください。
終わったら、次の番号に進んでよいか私に聞いてください。
```
