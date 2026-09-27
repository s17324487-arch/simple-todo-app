# 作業指示: 平和台を デザイン見本 v0.2 の とおりに 作り直す

いまの 平和台（`js/town-design.js` の 48×44 マス）を、見本 v0.2（64×68 マス）の とおりに 作り直す。
**ゴールは「見本の 画像と 並べて、同じ 町に 見える」こと。** 似た 雰囲気の 別の 絵に 置きかえない。

## 0. 読むもの（この 順）

1. [`AGENTS.md`](../../../../../AGENTS.md) … いつもの ルール（classic script・セーブ互換・文言・DoD）
2. [`../../TOWN_GUIDE.md`](../../TOWN_GUIDE.md) … 町づくりの きまり（道・建物・密度・検査）
3. この ファイル
4. [`ASSET_LIST.md`](ASSET_LIST.md) … 部品 107種の 一覧（必須の 細部・はみ出し・優先度）
5. 見た目の 正解: [`img/plan.png`](img/plan.png)（全体）・[`img/phones.png`](img/phones.png)（スマホ 1画面 ①〜⑤）・[`img/asset_sheet_1〜4.png`](img/)（部品）・[`img/compare.png`](img/compare.png)（v0.1 との ちがい）
6. 配置の 正解: [`heiwadai-v02.json`](heiwadai-v02.json)（道・建物・小物・人・出口・路面表示）と [`heiwadai-v02.txt`](heiwadai-v02.txt)（通れる マスの ASCII）
7. 絵と 道の コードの 正解: [`tools/town-design/`](../../../../tools/town-design/)
   - `assets.mjs` / `assets_more.mjs` … 各アセットの SVG（`def({ id: ... }, draw)`）。**この SVG を ゲームへ うつす**
   - `render.mjs` … 道の 描きかた（歩道 → 縁石 → 車道 → 島 → 隅切り → 切り下げ → 路面表示）と 置く 順番
   - `heiwadai-v02.mjs` … 配置の 元データ（JSON は ここから 作られる）

## 1. PR の 分けかた（1つずつ マージする。どの 段階でも ゲームは 遊べる）

| PR | 内容 | 受け入れ条件（その PR で） |
| --- | --- | --- |
| **1. 道の ベクター描画** | `MAP_DEFS[id]` に 道の データ（`roads` 中心線＋幅・`ring`・`fillets`・`crosswalks`・`marks`・`driveways`。形は `heiwadai-v02.json` と 同じ）を 持てるように する。`Tiles.chunk()` の 中で、地面タイルの あとに Canvas 2D（`Path2D`・`createPattern`）で 描く。当たり判定は これまでどおり マス | 小さな テスト用 マップ（または PokaDebug の 入口）で、T字路・円弧・45度・ロータリーが `img/phones.png` ①② と 同じに 見える。チャンクの つなぎ目で 線が ずれない。道の ない 町の 見た目は 変わらない |
| **2. アセット S** | `ASSET_LIST.md` の 優先度 S を `WorldArt` に 移す（SVG を そのまま。viewBox は `asset-bbox.json` の はみ出し量で 決める）。kind 名は `prop.nobori` → `nobori` のように 短くして よい（対応表を この フォルダに `ASSET_KINDS.md` として 残す） | `tools/preview.html`（または 新しい 一覧ページ）で、`img/asset_sheet_*.png` と 並べて 同じ 形・色・細部。`SvgCache` の キーが 有限 |
| **3. アセット A・B** | のこりを 移す | 同上 |
| **4. 平和台の 配置** | `MAP_DEFS.heiwadai` を v0.2 に 置きかえる（`heiwadai-v02.json` から 変換する スクリプトを 作っても よい）。建物の 入口・おみせ・会話・宝箱・ワープを 下の「2. こわしては いけない もの」の とおりに つなぐ | `npm run audit:town -- --check heiwadai` ✓。390×844・375×667 の スクリーンショットが `img/phones.png` の ①〜⑤と 同じ 見え方。スモークテストに 平和台の シナリオを 追加 |
| **5. 仕上げ** | 町の人の 会話（v0.2 の 8人）、動く 景観（信号・噴水・旗かざり・電車）、夜の あかり（街灯・自販機・ちょうちん） | 見本に ある 人・動きが そろう。FPS が 下がらない |

## 2. こわしては いけない もの（互換）

- **ID は 残す**（ほかの ファイルや セーブが ID で 見ている）:
  | ID | 役わり | v0.2 での 場所 |
  | --- | --- | --- |
  | `heiwadai_station` | 乗り物の 駅（`transit.js`） | 駅舎（`bld.station`） |
  | `heiwadai_market` | お買い物（market） | えきまえ マーケット（`bld.supermarket`） |
  | `heiwadai_living` | お買い物（furniture） | 商店街の 家具屋（`bld.shop.furniture`） |
  | `heiwadai_bread` | おてつだい（bakery） | 商店街の パン屋（`bld.shop.bakery`） |
  | `heiwadai_diner` | おてつだい（crepe） | 商店街の 食堂（`bld.shop.diner`） |
  | `heiwadai_clock` | おまつりの 目的地 | 駅前広場の 時計（`park.clock`・広場の 中央） |
  | `heiwadai_fountain` | おまつりの 目的地 | 公園の 噴水（`park.fountain`） |
  | `heiwadai_cart` | おまつりの 目的地（はなワゴン） | 商店街の 花屋の 前に ワゴンを 1つ 置く |
  | `heiwadai_local` | 町の人（まちの ハル） | 駅前広場（v0.2 の NPC 一覧の 先頭） |
  | `heiwadai_lane` | 宝箱（`save.flags.chests` に ID で 残る） | 住宅地の 路地 |
- **座標を 決め打ちしている ところを 直す**:
  - `js/seasonal.js` の `heiwadai_festivalboard`（いまは 25,24）→ 駅前広場の 空いた マス
  - シティ → 平和台 の ワープ先（いまは 23,42）→ 出口通りの 下の はし（v0.2 の `warps` の city）
  - 空港 → 平和台 の ワープ先（いまは 46,23）→ 大通りの 下の はし（v0.2 の `warps` の airport）
  - 平和台 → シティ／空港 の ワープ（v0.2 の `warps`）。全体マップ（`atlas-art.js`）の 絵は そのままで よい
  - `tests/smoke.mjs` の 平和台の 座標（`teleport` の 27,14 と 16,28、`heiwadai_fountain` を タップする 確認）を 新しい 配置に 合わせる（テストは 消さない・飛ばさない）
  - いまの 平和台に ある 景観の ID（`heiwadai_swing`・`heiwadai_signal`・`heiwadai_bus`・`heiwadai_bikes`・`heiwadai_drink`・`heiwadai_track`・`heiwadai_house*`）は、v0.2 の 同じ 役わりの ものに 付けかえる（ブランコ・信号・バス停・駐輪場・自販機・線路・家）
- **セーブ**: `Save.KEY`・`Save.SCHEMA` は 変えない（形は 変わらない）。ただし `save.world` が 平和台の 古い 座標を 指している ことが ある →
  読み込んだとき その マスが 通れなければ 駅前（v0.2 の 27,19 付近）へ 移す。これを テストで 確かめる（古い 座標の セーブで 平和台に 入る）。

## 3. 絵の うつしかた

- `assets.mjs` / `assets_more.mjs` の `draw()` が 返す SVG は、足もとの 左上を (0,0) とした 論理px。ゲームの `WorldArt`（足もとの 下はし中央が 基準）に 合わせて viewBox を ずらす。
- 地面の 質感（`p-grass` など）は SVG の `<pattern>`。チャンク描画では 同じ 模様を `createPattern` で 作る（`lib.mjs` の `defs()` が 正解）。
- 色・線の 太さ・影の 向き（右下）・細部は 変えない。ゲームの 画面で 小さすぎて 見えない 細部が あれば、消さずに 少し 太く／大きく する。
- 文字（看板・路面の「止まれ」など）は SVG の `<text>` か Canvas の `fillText`。日本語フォントが ない 端末でも 形が くずれない 大きさ・太さに。

## 4. 完了の 条件（ぜんぶ）

- [ ] `npm run check` ✓ ／ `npm test` ✓
- [ ] `npm run audit:town -- --check heiwadai` ✓（小物/100マス ≥ 8・種類 ≥ 20・何もない 場所 ≤ 10%・同じ 建物の 型 ≤ 30%・道の 島 = 1・ギザギザ = 0）
- [ ] 390×844 と 375×667 の スクリーンショットを PR に はり、`img/phones.png` の ①〜⑤と 並べて 見せる
- [ ] 建物の 入口・出口に ぜんぶ 歩いて 行ける（テストで 確かめる）
- [ ] 3人は いつも いっしょに 動く
- [ ] `CHANGELOG.md` と `ROADMAP_V2.md`（TOWN-01〜05）を 更新

## 5. やっては いけない こと

- 見本の 絵を 別の 絵に 置きかえる・細部を はぶく（変えたい ときは PR に 案を 書いて オーナーに 聞く）
- 斜めや カーブの 道を タイルの 階段で 表す
- ゲーム本体（`js/`）に ES modules・外部ライブラリ・CDN を 入れる（`tools/town-design/` は Node 用の 道具なので ES modules で よい）
- 1つの PR に 複数の 段階を まとめる
