# ④ 化石ほり（ピッケル・恐竜 10種の 骨）— 作業指示（Codex 向け）

オーナーの 依頼（そのまま）:

> ピッケルのアイテムを追加し、化石発掘ができるようにしなさい。化石は2~10個の骨（コレクターズアイテム）を組み合わせて、後述の恐竜博物館にて一つの恐竜となるようにしなさい。骨のデザインも史実と合わせて作りこみなさい。こちらは、10種類程度実装しなさい。

読む順番: `AGENTS.md` → この ファイル → [`FOSSIL_LIST.md`](FOSSIL_LIST.md)（10種・骨 63こ・出典）→ `tools/feature-design/fossil-art-ref.js`（骨の 絵）→ `tools/feature-design/fossils-ref.js`（ほる しくみ）。組み立てと 展示は ⑤（`../museum/CODEX_TASK.md`）。

## 0. この フォルダに ある もの

| ファイル | 中身 | つかいかた |
| --- | --- | --- |
| `fossil-data.js` | データ（`const FOSSIL_DATA = {...}`: 恐竜 10・骨の 部品・骨格・出る 場所・ピッケル・おまけ）。**自動生成** | そのまま `game/js/fossil-data.js` に コピー。手で 直さない |
| `fossils.json` | 上と 同じ 中身（読みやすい 形） | 確認用 |
| `FOSSIL_LIST.md` | 10種の 表（じだい・場所・大きさ・たべもの・骨の 数・説明・まめちしき）・骨 63この 一覧・出典 | 文の 確認用 |
| `img/dino-sheet.png` | 10種の 骨格（展示の 台つき） | 絵の 正解（⑤ の 展示にも つかう） |
| `img/bone-sheet-1〜2.png` | 骨 63こ（アイテムの 絵） | 絵の 正解 |
| `img/dig-flow.png` | 画面の 見本 5まい（ゲームの 上に 重ねて 撮影） | 見た目の 正解 |
| `img/small-phone.png` | 375×667 | 見た目の 正解 |
| `../../../../tools/feature-design/fossil-art-ref.js` | 骨の 絵（`FossilArtRef.svg(dino, {have})`・`partSvg(dino, partId)`） | `js/fossil-art.js` に 移植（ゲームでの 名前は `FossilArt`。⑤ も この 名前で つかう） |
| `../../../../tools/feature-design/fossils-ref.js` | しくみ（`rocks`・`pick`・`progress`・`Dig`）と 絵（`drawDig`・`rockSvg`・`pickSvg`） | `js/fossils.js` に 移植 |
| `../../../../tools/feature-design/fossil-ui.css` | ほる ボタン・ほる 画面・みつけた カード・ノートの CSS | `css/style.css` の さいごに 足す |
| `../../../../tools/feature-design/fossil-data.mjs` | 元データ | 直すときは ここを 直して `npm run design:features` |

## 1. 受け入れ条件

- [ ] 「ピッケル」（だいじな もの）: もりの ケロスケに 話すと もらえる。
- [ ] まいにち、どうくつ（4こ）・もりの がけ（3こ）・ビーチの がけ（3こ）に「ひびの ある いわ」が でる。日づけで 場所が きまり、その日に ほった いわは きえる。
- [ ] いわの となりで「ほる」→ いわを タップして こつこつ けずる（7×5 マス。たたいた マスは 2、となりは 1 けずれる）。骨の マスが ぜんぶ 見えたら おわり。**しっぱいは ない**（たたいた かずで ★1〜3）。
- [ ] 70% で 骨、30% で おまけ（コイン・キャンディ）。骨は まだ もって いない ものが 出やすい（70%）。
- [ ] 恐竜 10種・骨 63こ（2〜10こ／1ぴき）。骨は 実際の 骨格に あわせた 形（頭骨の 穴と 歯・つのと フリル・背中の 板と しっぽの とげ・ほ・とさか・かぎづめ など）。
- [ ] みつけた カード: 骨の 絵・なまえ（「ティラノサウルスの あたま」）・時代と 場所・あつまりぐあい（3/8）・骨格の 小さい 絵（ない 骨は 点線）。
- [ ] かせき ノート: 10種の 一覧（ない 骨は 点線の かげ）・そろった 恐竜に「そろった！」。
- [ ] 390×844・375×667 で はみ出さない。ボタンは 44px いじょう。

## 2. データの 形（`FOSSIL_DATA`）

```js
{ version: 1,
  dinos: [{ id: "trex", name, era, ago, where, len /* m */, food, site: "cave"|"forest"|"coast", rarity: 1..4, desc, fact,
            art: { box, spine: [{ el, n, pts, size, spine, chev? }], ribs, skull, limbs, extras, posts,
                   parts: [{ id: "skull", name: "あたま", el: ["skull"] }, ...], partBox: { skull: [x, y, w, h], ... } } }],
  sites: { cave: { name, rocks: 4, maps: ["cave"] }, forest: {...}, coast: {...} },
  pick: { id: "pickaxe", name: "ピッケル", get: { npc: "explorer", talk } },
  extras: [{ bag|coins, n?, text }], rule: { boneChance: 0.7, newFirst: 0.7 } }
```

骨の id は `"<恐竜>.<部品>"`（例 `"trex.skull"`）。63こ。

## 3. セーブ（`Save.fresh()` に 足すだけ。`SCHEMA` は そのまま）

```js
fossil: { pick: 0, bones: {}, dug: { day: "", at: {} } },
// bones: { "trex.skull": もって いる 数 }（2こめ いじょうは ② の 物々交換で ケロスケと こうかん できる）
// dug:   { day: "2026-9-27", at: { cave: ["12,8", ...] } }（その日に ほった いわ。日が かわったら けす）
```

⑤ の 寄贈（はくぶつかんに わたした 骨）は ⑤ で `museum` に 足す。

## 4. 画面と しくみ

- いわの 場所: `FossilRef.rocks(mapId, sites[site].rocks, 日づけ, 候補)`。候補は「歩ける マスで、となりに かべ（solid）が ある」マス（`build-fossils.mjs` と 同じ 考え）。ワープ・宝箱・人の いる マスは のぞく。
- 町の 絵: `FossilRef.rockSvg()` を y順の スプライトとして 描く（`SvgCache` の キー `"fossil:rock"`）。
- 「ほる」ボタン: 先頭の 子が いわの となりに いて、ピッケルを もって いる ときだけ（`act-btn`・`img/dig-flow.png` ①）。釣りの「つる」と 同じ 場所・同じ 大きさ。
- ほる 画面: `UI.modal` ＋ canvas（`FossilRef.drawDig`）。見本 ②③。タップ した マスに ピッケルの こつんと いう 音（`Sound.se("tap")`）、おわったら `sparkle`。
- みつけた カード・ノート: 見本 ④⑤（`fossil-ui.css`）。ノートは メニューの「ずかん」に「かせき」タブを 足す。
- 骨の 絵: `FossilArtRef.partSvg(dino, partId)`（キー `"bone:" + key`・63こ）。骨格: `FossilArtRef.svg(dino, { have })`（キー `"dino:" + id + ":" + もって いる 部品の ビット`。1ぴき 2^n とおりまで・有限）。

## 5. ほかの 機能との つなぎ

- ② 町の人: ほるたびに `TownFolk.signal({ do: "dig" })`。`FOSSIL_DATA` が あると ② の `x:fossil` の セリフ・`needs: ["fossil"]` の おねがい（ほねを みせて）・物々交換（ケロスケ: だぶった 骨 → 同じ 恐竜の まだ ない 骨）が 出る。
- ⑤ 恐竜博物館: 骨を わたすと 展示に なる。ぜんぶ そろうと 1ぴきの 骨格。

## 6. テストの 入口（`PokaDebug`）

- `fossilGive(key, n = 1)` … 骨を もたせる。`pick(n)` … ピッケルを もたせる。
- `fossilDig(site = "cave", key)` … ほる 画面を ひらく（key を わたすと その 骨が 出る）。`digTap(x, y)` … マスを たたく。`digState()` … `{ hp, area, taps, done }`。
- `fossilState()` … `{ bones, dug }` の うつし。`fossilRocks(map)` … きょうの いわの 場所。

## 7. テスト

- `tools/check.mjs`: `FOSSIL_DATA` の 10種・骨 2〜10こ・部品 id の 重複なし・骨格の 要素が ちょうど 1回ずつ・`sites` の マップが ある・`pick.get.npc` が いる・文の 長さ（`build-fossils.mjs` と 同じ）。
- スモーク「化石ほり」（390×844・375×667）: `pick(1)` → どうくつ → `fossilRocks("cave")` が 4こ → `fossilDig("cave", "trex.skull")` → `digTap` を くりかえして `done` → カード → `Save.d.fossil.bones["trex.skull"] === 1` → ノートで「ほね 1/8」。はみ出しなし・スクリーンショット。

## 8. PR の 分けかた

1. ✅ **骨の データ・絵・かせき ノート**（済み: Claude Code。下の「実装メモ」）: `js/fossil-data.js`・`js/fossil-art.js`（index.html と sw.js の 両方）、ノート、`fossilGive` で 見られる。
2. ✅ **ピッケルと ほる**（済み: Claude Code。下の「実装メモ」）: `Save.fossil`・ケロスケから もらう・いわ・「ほる」ボタン・ほる 画面・カード・PokaDebug・スモーク。
3. ✅ **つなぎ**（済み: Claude Code。下の「実装メモ」）: ② の 物々交換（ケロスケ: だぶった 骨 → 同じ 恐竜の まだ ない 骨）。おねがい「ほねを みせて」は 2番で うごく。

それぞれ `CHANGELOG.md` の `2.0.0-dev` に 1行、`docs/ROADMAP_V2.md` の M8 に ✅。

## 実装メモ（Claude Code が 作った ときの きまり。つぎの 番号も これに あわせる）

- 1番: `js/fossil-data.js`（そのまま コピー）・`js/fossil-art.js`（見本 `FossilArtRef` を 名前だけ `FossilArt` に して そのまま）・`js/fossils.js`（`Fossils`）を index.html・sw.js の `fishing.js` の あと、`debug.js` の まえに 置いた。骨の 絵には SVG の id が ないので、DOM に なんまい 入れても かさならない。
- `Fossils` に 見本 `FossilRef.progress`（おなじ 計算）と、`have(dino)`（もって いる 部品 id の 配列。`FossilArt.svg` の `have` に わたす）・`bone(key)`・`give(key, n)`・`count()`・`total()` を 入れた。**2番で `rng`・`rocks`・`pick`・`Dig`・`drawDig`・`rockSvg`・`pickSvg` を 足す。**
- `Save.fresh().fossil`（`{ pick: 0, bones: {}, dug: { day: "", at: {} } }`）は ノートで つかうので 1番で 足した（2番では 足さない）。
- ノート: メニューの「ずかん」の まもの／さかな／かせき（`.dex-kinds`。ある タブの 数で ならべる）。`Fossils.note(el)`（見本 ⑤）、骨が 1つ いじょう ある 恐竜を おすと `Fossils.detail(id)`（くわしい ページ: 骨格・何年 まえ・じだい・みつかった ところ・おおきさ・たべもの・ほね n/全部・説明・まめちしき。デザインに ないので ③ の さかなの ページに あわせて 作った）。上の 文は はくぶつかん（⑤ の `MAP_DEFS.museum`）が できるまで「くみたてられるよ」を 言わない。
- **② との きまり**: `TownFolk.features().fossil` は `FOSSIL_DATA` が あって **ピッケルを もって いる（`Save.d.fossil.pick > 0`）とき**だけ true（釣りと おなじ。1番では まだ ピッケルが もらえないので、ほねの おねがいや 化石の セリフは 出ない）。2番で ケロスケから ピッケルを もらうと 出る ように なるので、**2番で ほる たびの `TownFolk.signal({ do: "dig" })` と、`TownFolk.have().bone` を `Save.d.fossil.bones` に する ところ（物々交換の「だぶった 骨」）まで 入れる**。
- テストの 入口: `PokaDebug.fossilGive(key, n)`（もって いる 数を かえす）。`pick(n)`・`fossilDig()`・`digTap()`・`digState()`・`fossilState()`・`fossilRocks()` は 2番。
- 2番: 見本 `FossilRef` の `rng`・`rocks`・`pick`・`Dig`・`drawDig`・`rockSvg`・`pickSvg` を `Fossils` に そのまま 入れた（文字まで おなじ）。
- ピッケル: `Talk.run` の つりざおの つぎに `Fossils.talked(n, who)`（`pick.get.npc` の ケロスケ。ピッケルが ない ときだけ `get.talk` を 言って `pick = 1`）。もらった 回は ふつうの セリフを 出さない。メニューの「もちもの」の「だいじな もの」に ならぶ。
- いわの 場所: `Fossils.candidates(map)`（マップごとに 1かい。入口から 歩いて 行ける・となりに 水 いがいの かべ・**水の となりは のぞく**（釣り場を あける）・ワープと 入口・ドア・宝箱・かんばん・人・しかけ・建物・ボスの まわり 1マスと 敵の 出る マスを のぞく・**ふさいでも まわりの 8マスで となりどうしが つながる マスだけ**（道が きれない））→ 見本 `rocks(map, sites[site].rocks, U.today(), 候補)` → `Save.d.fossil.dug.at[map]`（**キーは マップ id**。いまは site と おなじ）に ある いわを のぞく（`Fossils.rocksOn(map)`）。こうほは どうくつ 94・もり 169・ビーチ 84 マス。
- 町では: `WorldScene.enter` で `this.rocks = Fossils.rocksOn(...)`（3人が 立って いる マスは のぞく）。`rockAt(x, y)` を `walkable`・`enemyCan`・町の人の さんぽに 足して **いわは とおれない**（`map.isSolid` は かえない）。y順の スプライト（`SvgCache`「`fossil:rock`」・`drawRock`）。タップ／ok で となりまで 行って `interact({ type: "rock" })` → `Fossils.dig(scene, rock)`。ピッケルが ない ときは「ピッケルが あれば ほれそう……」。
- 「ほる」ボタン: `WorldScene.update` の さいごで `Fishing.refreshButton` の あとに `Fossils.refreshButton(this)`（`rockNear`: ピッケルが ある・先頭の 子が 動いて いない・上下左右の となりに いわ。むいて いる いわを さきに）。`.act-btn.fossil-go-btn`（見本 ①・下の まん中）。**「つる」も 同じ `.act-btn`（`.act-btn.fish-go-btn` で 青）に して、「つる」が 出て いる ときは「ほる」を 出さない**。`exit` で `hideButton()`。
- 出る もの: 日づけ・マップ・いわの 場所の `rng` で `pick` と `Dig` を きめる（とちゅうで とじて やりなおしても おなじ）。ほる 画面は `UI.modal`「かせきを ほる」＋ canvas（`drawDig`・`devicePixelRatio`）。マスを `pointerdown` で たたく（`Sound.se("tap")`）。ほりだせたら `sparkle` と「〇〇の △△！ ★★☆」を 1.4びょう 見せて とじる。✕ で とちゅうで とじたら なにも おきない（いわは のこる）。
- 下の 絵: 骨は `partSvg` を `partBox` の 形の まま 360 に（`SvgCache`「`bone:<key>`」・63こ）、おまけは `Fossils.extraSvg(kind)`（キラキラの いし・こはく・アンモナイト。**デザインに ないので 作った**。`extraKind` が データの 文から えらぶ。キー「`fossil:extra:<kind>`」・3つ）。
- みつけた カード: 見本 ④ の とおり（`.bone-card`）。はじめての 骨には「はじめて！」、2こめ いじょうは「おなじ ほねは これで Nこ」、そろったら「ぜんぶ そろった！」（はくぶつかんの ことは ⑤ まで 言わない）。おまけは コイン／キャンディを `Loot.give` して データの 文を 言う。
- ほった あと: その いわを `dug.at[map]` に 入れて きえる（`dugToday()` が 日が かわったら けす）→ `TownFolk.progress({ do: "dig" })`（② の「ほねを みせて」が ほる → ケロスケに 話す で おわる）。
- テストの 入口（2番）: `pick(n)`・`fossilDig(site, key)`（いわと むすばない）・`digTap(x, y)`・`digState()`（`{ hp, area, taps, done, cols, rows }`）・`fossilState()`・`fossilRocks(map)`・`fossilSpot(map)`（いわの となりの 立てる マスと 向き）。スモーク `fossil-dig-390`・`-375`。
- 2番の あとに のこした こと（3番で やった）: `TownFolk.have().bone` と だぶった 骨の 物々交換。
- 3番: `TownFolk.have().bone` を `Save.d.fossil.bones` に した。データの `give: { bone: "dup" }`・`get: { bone: "missing-same-dino" }` は、`Fossils.dupTrade(own)`（**データの じゅんで さいしょに 見つかる「2こ いじょう ある 骨」と、その 恐竜の まだ ない 骨**。そろった 恐竜の だぶりは つかわない）で きまった 2つに する（`TownFolk.resolve(bt)`）。`canGive({ bone: "dup" })` は `dupTrade` が ある ときだけ true なので、こうかん できる ものが ない ときは もちかけない。
- こうかん: カード（`tradeCard`）の 絵は `FossilArt.partSvg`、なまえは `Fossils.boneName(key)`（「ティラノサウルスの あたま」。ながいので `.folk-trade` の はばを 42% までに して ことばの きれめで おりかえす）。「こうかん する」で `Fossils.take(give)`・`Fossils.give(get)` → もらった 骨の カード（`Fossils.card`・はじめて！）。テストは スモーク `fossil-trade-390`・`-375` と check.mjs。
- これで ④ は おわり。⑤ の 寄贈は `Save.d.fossil.bones` の 骨を はくぶつかんに わたす（`museum` に 足す）。

## 9. やらないこと

- こわい 骨の 絵（血・きず・肉）。骨は きれいな 化石の 色と 形だけ（AGENTS.md の 9）。
- 失敗で いわや ピッケルが こわれる・なにかを うしなう しくみ。
- `js/fossil-data.js` を 手で 直す。セーブの キーを かえる。
