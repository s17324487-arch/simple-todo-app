# ② 町の人の 会話・物々交換・おねがい — 作業指示（Codex 向け）

オーナーの 依頼（そのまま）:

> 住民のコメントバリエーションを増やしなさい。また、たまに物々交換や、20種類のサブイベント（買い物依頼や伝言など）を10~20%の確率で発生するように追加しなさい。

読む順番: `AGENTS.md` → この ファイル → [`EVENTS.md`](EVENTS.md)（おねがい・物々交換）→ [`LINES.md`](LINES.md)（セリフ）→ `tools/feature-design/folk-ref.js`（見本の 実装）。

## 0. この フォルダに ある もの

| ファイル | 中身 | つかいかた |
| --- | --- | --- |
| `townsfolk-data.js` | データ（`const TOWNSFOLK_DATA = {...}`）。**自動生成** | そのまま `game/js/townsfolk-data.js` に コピー。手で 直さない |
| `townsfolk.json` | 上と 同じ 中身 ＋ 20 の おねがいを 動かした きろく（`sim`）・さがす ばしょの 例（`spotsExample`） | 確認用 |
| `LINES.md` / `EVENTS.md` | セリフ 266 種 ／ おねがい 20・物々交換 16・もちもの 10 の 一覧 | 文と 手順の 確認用 |
| `fit-check.json` | ② の 文 350 こを 375×667 の 会話まどに 入れて はかった 結果（ぜんぶ 4行 いない） | 確認用 |
| `img/flow.png` | 画面の 見本（390×844・ゲームを 実際に 動かして 撮影） | 見た目の 正解 |
| `img/small-phone.png` | 375×667 で ノートと 物々交換 | 見た目の 正解 |
| `img/items.png` | もちもの 10・小物 6・しるし 2・こねこ の 絵 | 絵の 正解 |
| `../../../../tools/feature-design/folk-ref.js` | しくみ（`TownFolkRef`）と 絵（`TownFolkArt`）の 見本の 実装。classic script | `js/townsfolk.js` に 移植 |
| `../../../../tools/feature-design/folk-ui.css` | ノート・物々交換カード・ボタンの CSS | `css/style.css` の さいごに 足す |
| `../../../../tools/feature-design/townsfolk-data.mjs` | 元データ | 文を 直すときは ここを 直して `npm run design:features` |

## 1. 受け入れ条件

- [ ] 町の人 16人 すべてに、時間・天気・季節・おまつり・ボスの あと に あわせた セリフが ある（いまの 1〜4 → **12〜18**。合計 230）。
- [ ] 話した あとの 3人の ひとことが 性格に あう（`REACT` 36。いまの「ときどき なかまが ひとこと」を おきかえる）。
- [ ] 話しかけると **10〜20%** で おねがいを もちかけられる（20種: かいもの・でんごん・とどけもの・さがしもの・まいご・おそうじ・みずやり・しゅうかく・なぞなぞ・しゃしん・わらしべ・釣り・化石）。
- [ ] おねがいが 出なかった ときに 10% で 物々交換（16種。わたす ものを もって いる ときだけ）。
- [ ] おねがいは 3つまで。**おねがい ノート** で いま なにを すれば よいか わかる。あいての 人には **▼**、ことわった おねがいの 人には **！**（きいろ）が 出る。
- [ ] かなえると コイン・アイテム・家具と「なかよし」が もらえ、なかよしが たまると とくべつな セリフ（`b:5`・`b:10`）が 出る。
- [ ] 375×667 と 390×844 で はみ出さない（`img/small-phone.png`）。ボタンは 44px いじょう。
- [ ] 釣り・化石・水族館・博物館・射撃場・平和台 v0.2 が まだ ない あいだは、それに ふれる セリフ・おねがいは 出ない（`x:` と `needs`）。

## 2. データの 形（`TOWNSFOLK_DATA`）

```js
{ version: 2, tipShare: 0.3, maxActive: 3, barterChance: 0.1,
  lines:  [{ id: "tf0001", npc: "mayor", group: "line"|"bond"|"crowd", text, when }], // 町の人の セリフ（crowd は npc が 役の 名前）
  crowd:  { town_walker0: "town_walker", city_local3: "city_local", ... },            // 町の なかま（町の 作り直しで ふえた 人）→ 役
  crowdNames: { town_walker: "おさんぽの なかま", ... },                              // 役ごとの 会話まどの 名前
  react:  [{ id: "tr0231", who: "wanko", text, when }],                                 // 話した あとの 3人の ひとこと
  barter: [{ id, npc, give: {bag|fish|bone, n}, get: {bag|wear|furn, n}, once?, repeat?, text, needs: [] }],
  events: [{ id, kind, title, giver, map, chance, limit: "daily"|"once", when, steps: [...], reward: {coins, bag, n, furn, wear, bond, first}, lines: {offer, remind, done}, needs: [], doneBy }],
  items:  { letter: { name: "おてがみ", art: "folk:letter" }, ... } }                  // おねがいの もちもの（かばんに 入れない）
```

### 条件（`when`）

同じ キーの 中は「どれか」、ちがう キーは「ぜんぶ」。重み `1 + 2 ×（あった キーの 数。x: は 数えない）` で えらぶ（`TownFolkRef.score / pick`）。

| キー | 値 | しらべかた |
| --- | --- | --- |
| time | morning 5–10時／day 10–16／evening 16–19／night 19–23／late 23–5 | `U.hourNow()` |
| weather | clear／cloudy／rain／snow／wind | `Weather.kind()` |
| season | spring／summer／autumn／winter | `Seasonal.current().id` |
| festival | newyear … christmas | `AnnualFestivals.current().id` |
| event | boss（キングプルンを たおした あと） | `Save.d.flags.boss` |
| bond | 数（その人の なかよし ポイントが それ いじょう） | `Save.d.folk.bond[npc]` |
| person | 町の人の id（`react` だけ: 話した あいて） | `n.id` |
| feature | fishing／fossil／aquarium／museum／range／heiwadai2（`!` を つけると「まだ ない あいだ」） | `TownFolkRef.features()`（下の 表） |

| feature | 「できた」の しらべかた |
| --- | --- |
| fishing | `typeof FISHING_DATA !== "undefined"`（③ で 足す） |
| fossil | `typeof FOSSIL_DATA !== "undefined"`（④） |
| aquarium / museum | `MAP_DEFS.aquarium` / `MAP_DEFS.museum` が ある（⑤） |
| range | `typeof RANGE_DATA !== "undefined"`（⑥） |
| heiwadai2 | `MAP_DEFS.heiwadai.rows.length >= 60`（平和台 v0.2 は 64×68） |

## 3. セーブ（`Save.fresh()` に 足すだけ。`SCHEMA` は そのまま）

```js
folk: { bond: {}, req: [], done: {}, barter: {}, offered: {} },
// req:     [{ id, step, n, day, carry, follow }]   … うけて いる おねがい（3つまで）
// done:    { [eventId]: "2026-9-27" | "once" }   … daily は その日づけ、once は "once"
// barter:  { [barterId]: かいすう }  offered: { [npcId]: { day, wait? } }（その日に もちかけた・ことわって まって いる）
```

古い セーブには `Save.migrate()` が 自動で 補う。さいきん 出た セリフは セーブしない（メモリだけ）。

## 4. 話しかけた ときの 流れ（`Talk.run` を かえる）

```text
1. はじめての 会話（TALKS[npc].first）は いまの まま。
2. おねがいを すすめる: TownFolk.signal({do:"talk", npc, map}) → すすんだ 手順ごとに
     でんごん(talk+say) … 3人の だれか（なかよしが いちばん 高い 子）が say を 言い、あいてが こたえる
     わたす(give)      … 「〇〇を わたした！」 → アイテムを へらす（かばん・さかな）/ もちものを けす
     わらしべ(trade)   … その人の chain の セリフ → つぎの もちものを わたす
     つれていく(follow)… こねこが ぴょんと もどる
   おわったら doneBy の 人が lines.done → Loot.give(TownFolkRef.rewards(ev, はじめて)) → なかよし +（bondOf）→ トースト「おねがい かなえた！」
3. ふつうの セリフ: 30% は いまの TALKS[npc].lines（あそびかたの ヒント）、70% は lines から pick。
   町の なかま（`crowd[npc]` が ある 人。`js/town-renewal.js` の `town_walker0` など）は、`lines` の `npc === crowd[npc]`（役）から pick し、会話まどの 名前は `crowdNames[役]`。
   いまの TALKS の 1行（「いろんな けしきが あって おさんぽが たのしいね。」）は 30% の がわに のこす。
4. もちかける: TownFolkRef.offer(...) →
     おねがい: UI.ask(offer, ["うん、まかせて！", "あとでね"], {face, name}) → answer(ok)
               うけたら トースト「おねがい ノートに かいたよ」。なぞなぞは その場で はじめる
     物々交換: UI.ask(text, ["こうかん する", "やめておく"], {face, name, extra: 交換カード}) → わたす・もらう
5. 3人の ひとこと（react）: 35% で 1つ（いまの しくみの おきかえ）。
```

- `UI.ask` に `{ face, name, extra }` を 足す（町の人の 顔と 名前・交換カード）。見た目は `img/flow.png` の ②③。
- 1人 1日 1回まで もちかける。「あとでね」の おねがいは その日の うちなら つぎに 話した とき もう一度 きく（`offered.wait`）。
- 出る かくりつ = その人の 候補の `chance`（0.10〜0.20）の いちばん 大きい 値。どれに するかは chance の 重みで。

### ほかの 場所で 出す できごと

| できごと | どこで | signal |
| --- | --- | --- |
| かばんが かわった | `Loot.give`・お店で かった あと | `{do:"have"}`（かう 手順は かばんに n こ あれば すむ） |
| さがす | 町・外の 世界で、手順が find の マップに 入った とき `TownFolkRef.spots(map, spots, eventId+日づけ, walk, reach)` で きらきらを 置く（どれか 1つが あたり）。タップで しらべる | あたり: `{do:"find", map, item\|npc}`。はずれ: 「ここには ない みたい…」 |
| さわる | 同じく `spots(map, n, …)` に 小物（litter・flowerbed・crop・acorn）を 置く。タップで 1つずつ（みずやりは flowerbed → flowerbed_ok に かわる） | `{do:"tap", target, map}` |
| つれていく | こねこを みつけたら 3人の うしろを ついて くる（`Walker`・0.72 ばい）。ミケに 話すと おわり | talk の signal で すすむ |
| しゃしん | 手順が photo で、`near` の 小物から `r` マス いないに いる とき、画面に「しゃしんを とる」ボタン（44px）。おすと 白く ひかって 3人が ポーズ | `{do:"photo", map, near}` |
| つる／ほる | ③ 釣り・④ 化石 で 1ぴき つった・ほねを ほった とき | `{do:"catch", fish}` / `{do:"dig"}` |

`walk(x,y)` は `!map.isSolid(x,y)`、`reach` は マップの 入口（ほかの マップの ワープの 着く ところ）から 歩いて 行ける マス（`build-townsfolk.mjs` の `reach()` と 同じ）。ワープの マスと 端の 2マスは のぞく。

## 5. 画面

| 部品 | 見本 | きまり |
| --- | --- | --- |
| 人の 上の しるし | `img/flow.png` ① | ！（きいろ・ことわった おねがいが まって いる）／▼（みどり・おねがいの あいて）。`TownFolkArt.marker(ctx, kind, x, y, G.t)` を `drawNpc` で よぶ（いまの 白い「!」と 同じ 場所。白い「!」が ある ときは そちらを 優先） |
| きらきら・小物 | ① | `TownFolkArt.prop(id)`（32×32・足もとが 下の まん中）。`SvgCache` の キーは `"folk:prop:" + id`（有限個） |
| おねがい ボタン | ① 右上 | おねがいが 1つ いじょう ある ときだけ。`folk-note-btn`（右上・天気ボタンと 同じ 高さ）。数の バッジ |
| おねがい ノート | ⑤・small-phone | `UI.modal`。1つの カードに 顔・名前・たのんだ 人・いまの 手順の ヒント（`remind` または 手順から 作る 文）・すすみぐあい（tap／quiz／trade）・もちもの・「やめる」（たしかめて から けす。ばつは ない） |
| 物々交換カード | ③・small-phone | 「わたす → もらう」の アイコンと かず |
| もちもの・小物・こねこ | `img/items.png` | `TownFolkArt.ITEM` / `PROP`。bag:・furn: は いまの 絵（`Art.iconSvg`） |

## 6. テストの 入口（`PokaDebug`）

- `folk()` … `{ bond, req, done, offered }` の うつし。
- `folkOffer(id)` … つぎに その人と 話した とき、かならず その おねがい／物々交換を もちかける。
- `folkTalk(npcId)` … その人の マップの となりへ 行って 話しかける（`Talk.run`）。
- `folkSignal(sig)` … `TownFolk.signal` を よぶ（アイテムを へらす などの 処理も する）。すすんだ 手順を かえす。
- `folkSpots(map)` … いま その マップに 置いて いる きらきら・小物。

## 7. テスト

- `tools/check.mjs`: `TOWNSFOLK_DATA` が ある・おねがい 20 いじょう・chance 0.1〜0.2・人／マップ／アイテム／家具／服／小物の id が ゲームに ある・たのむ人が その マップに いる・町の人 みんなに セリフが ある（町の なかまは `crowd` の 役で）・文の 長さ（1行 30・会話まどで 4行 まで）。
- スモーク「町の人の おねがい」（390×844・375×667）:
  1. `folkOffer("ev-milk")` → `folkTalk("sheep")` → 「うん、まかせて！」→ `folk().req` に ある → ノートを ひらいて スクリーンショット・はみ出しなし。
  2. `give("milk", 1)` → `folkTalk("sheep")` → コイン +80・`folk().done["ev-milk"]`・なかよし +2。
  3. `give("corn", 2)` → `folkOffer("bt-pig-corn")` → `folkTalk("pig")` → 「こうかん する」→ とうもろこし −2・メロンパン +1。
  4. `folkOffer("ev-lost-hat")` → うける → `folkSpots("meadow")` の あたりを しらべる → `folkTalk("rabbit")` で おわる。

## 8. PR の 分けかた

1. ✅ **町の人の セリフ**（済み: Claude Code。下の「実装メモ」）: `js/townsfolk-data.js`（index.html と sw.js の 両方。`talk.js`・`world-expansion.js`・`town-design.js` より あと）と `js/townsfolk.js` の セリフ・ひとこと 部分。`Talk.run` の 3・5。
2. ✅ **おねがいの しくみ**（済み: Claude Code。下の「実装メモ」）: `Save.folk`・offer／answer／signal・`UI.ask` の 顔・ノート・しるし・PokaDebug・スモーク。まずは かいもの・でんごん・とどけもの・なぞなぞ・わらしべ。
3. ✅ **さがす・さわる・つれていく・しゃしん・物々交換**（済み: Claude Code。下の「実装メモ」）: 小物の 絵・こねこ・しゃしんボタン・交換カード。
   （釣り・化石の おねがいは、③④ が できると 自動で 出る。）

それぞれ `CHANGELOG.md` の `2.0.0-dev` に 1行、`docs/ROADMAP_V2.md` の M8 に ✅。

## 実装メモ（Claude Code が 作った ときの きまり。つぎの 番号も これに あわせる）

- 1番: `js/townsfolk-data.js`（そのまま コピー）と `js/townsfolk.js`（`TownFolk`）を index.html・sw.js の `daily-play.js` の あと、`debug.js` の まえに 置いた（町の 組み立てが ぜんぶ おわった あと）。
- 条件の 点数と くじは ① と 共通の `U.condScore` / `U.condPick`、時間の くぎりは `U.dayPart()`（`js/util.js`）。`TownFolkRef.score / pick / period` は 移さない。
- `TownFolk.context(npcId)` の `bond` は `Save.d.folk.bond`（2番で `Save.fresh()` に 足す。まだ ない あいだは 0 なので なかよしの セリフは 出ない）。
- `Talk.run`: はじめての 会話と ボスの あとの `t.boss` は いまの まま。それ いがいは 3わり ヒント（`TALKS[npc].lines`）・7わり `TownFolk.line(n)`。会話まどの 名前は `TownFolk.name(n)`（町の なかまは `crowdNames`）。ひとことは 35% で `TownFolk.react(n)`。
- テストの 入口: `PokaDebug.folkTalk(id)`（その人の となりへ 行って 話しかける。会話は テストの がわで すすめる）・`folkLast()`（さいごの `{ npc, line, react }`）・`folkLine(id)`。2番の `folk()`・`folkOffer()`・`folkSignal()`・`folkSpots()` は まだ。
- 村長は はじめて 話すと プレゼントを くれる（いまの `TALKS.mayor.gift`）。テストで おかねを くらべる ときは その あとから。
- 2番: `TownFolk` に offer／answer／signal／match／targets／rewards／bondOf（見本と 同じ 計算）と、会話・ノート・ボタンを 足した。絵は `js/townsfolk-art.js`（`TownFolkArt` を そのまま）。CSS は `folk-ui.css` を `css/style.css` の さいごに（「やめる」は 44px に した）。
- いま すすめられる 手順は `TownFolk.STEPS`（buy・give・talk・quiz・trade）。**3番で find・tap・follow・photo を 足す**と、さがしもの・まいご・おそうじ・しゃしんの おねがいも 出る（catch・dig は ③④ が できると `needs` で 出る）。
- `Talk.run` の 順番: はじめての あいさつ → プレゼント → `TownFolk.talked`（でんごん・わたす・わらしべ・なぞなぞの やりなおし・おわり）→ すすまなかった ときだけ ふつうの セリフ と `TownFolk.propose`（もちかける）→ 3人の ひとこと。はじめて 話した ときは もちかけない。
- でんごんを つたえる 子は 3人の うち なかよし（`chars[id].bond`）が いちばん 高い 子。「〇〇さん！ 〈say〉！」→ あいては「わかった！ おしえて くれて ありがとう♪」。
- おわると doneBy の 人の おれい → `Loot.give` → なかよし → トースト。家具・服・もちものは どこで つかうかも 会話まどで つたえる。
- ノートを ひらく ときに `signal({do:"have"})` で かって ある ものを 数えなおす（お店や `Loot.give` には まだ 足して いない）。
- 右上の ボタンは `TownFolk.mount(sc)`〜`unmount()` の あいだだけ 出す。`mount` は `WorldScene.enter` の 中（`G.scene` が かわる まえ）で よばれるので、`G.scene === sc` で きめない（お店・おうちから もどった ときに ボタンが 出なく なる）。
- テストで おなじ 人に 2回 話すと、2回めは 何も すすまないので たまに べつの おねがいが 出る（10〜20%）。すすめる ための 会話は 1回に する（はじめての あいさつの あとでも すすむ）。
- 3番: `TownFolk.STEPS` に find・tap・follow・photo・catch・dig を 足した（catch・dig の おねがいは `needs` の fishing・fossil で、③④ が できるまで 出ない）。これで 20種 ぜんぶが 出る。
- さがす・さわる ばしょは `TownFolk.spotsOn(map)`。見本 `spots()` と 同じ えらびかた（`reach()` は `build-townsfolk.mjs` と 同じ）で、たね は `eventId + ":" + うけた 日`（`r.day`）。1日の あいだは かわらない（`spotCache`）。あたりは `rng(eventId + ":" + r.day + ":hit")` で 1つ。はずれを しらべると `r.checked` に 入れて けす。さわった 小物は `r.tapped`（みずやりだけ flowerbed_ok に かわって のこる）。
- 町の 画面（`WorldScene`）: タップは きらきら・小物を 町の人・なかまより 先に みる（頭が かさなっても しらべられる）→ となりまで 歩いて `TownFolk.investigate`。絵は `TownFolkArt.prop(id)` を `SvgCache` の `"folk:prop:" + id` で。
- こねこ: `WorldScene.startFollower(x, y)` で `follower`（`Walker`・0.72 ばい・`Art.npcSvg({ sp: "cat", col: "#F6C28B", stripe: true })`）。3人の いちばん うしろの 子が 歩いた マスを `trail` に ためて 1マスずつ たどる（おくれたら 小走り）。マップを かえても `TownFolk.following()` なら うしろに 出る。ミケに 話すと follow が すすんで きえる。
- しゃしん: `TownFolk.refreshPhoto()` が 1マス 歩く たびに（`onArrive` → `TownFolk.arrived`）`photoSpot` を みて、右下（おまつりの ボタンと おなじ 高さ）に「しゃしんを とる」（44px）を 出す。おすと `.folk-flash` で 白く ひかって 3人が 下を むいて はねる → `{do:"photo", map, near}`。
- 物々交換: おねがいが 出なかった ときに `BARTER_CHANCE`（10%）。`UI.ask(text, ["こうかん する", "やめておく"], { face, name, extra: tradeCard })`。わたす もちものを へらして `Loot.give`。さかな・ほねの こうかん（fish・bone）は ③④ で `have()`・`canGive()`・`lootOf()` に 足す（いまは `needs` で 出ない）。
- さわる・しゃしんが おわると「ぜんぶ できた！／しゃしんを とった！ 〇〇に はなしかけよう」の トースト。
- テストの 入口（3番）: `folkSpots(map)`（`stand` は となりの 立てる マス、いまの マップなら `cx`・`cy`）・`folkKitten()`・`folkPhotoTile(map)`。`folkOffer(id)` は 物々交換の id（`bt-…`）も うけとる。
- テストの 入口: `folk()`・`folkOffer(id)`（つぎに その人と 話すと かならず もちかける）・`folkSignal(sig)`（会話は またない）・`folkMarks()`（いまの マップの しるし）。`folkSpots()` は 3番。

## 9. やらないこと

- 3人の だれかを 置いて いく おねがい（こねこが ふえるのは よい）。こわい・かなしすぎる 文。
- 失敗で なにかを うしなう しくみ（やめても ばつは ない）。時間せいげん。
- `js/townsfolk-data.js` を 手で 直す。セーブの キーを かえる。外部の 通信。
