# ③ 釣り（釣りざお・魚 50種・ずかん）— 作業指示（Codex 向け）

オーナーの 依頼（そのまま）:

> 釣り竿のアイテムを追加し、釣りができるようにしなさい。魚はコレクターアイテムとして、まず50種類実装しなさい。現実の魚を参考にして、デザインや説明も見れるように。

読む順番: `AGENTS.md` → この ファイル → [`FISH_LIST.md`](FISH_LIST.md)（50種の 一覧と 出典）→ `tools/feature-design/fish-art-ref.js`（魚の 絵）→ `tools/feature-design/fishing-ref.js`（釣りの しくみと 画面）。

## 0. この フォルダに ある もの

| ファイル | 中身 | つかいかた |
| --- | --- | --- |
| `fishing-data.js` | データ（`const FISHING_DATA = {...}`: 魚 50・釣り場・釣りざお）。**自動生成** | そのまま `game/js/fishing-data.js` に コピー。手で 直さない |
| `fishing.json` | 上と 同じ 中身 ＋ 場所×季節×時間ごとの つれる 数（`cover`）・マップの 水べの マス数（`spotTiles`） | 確認用 |
| `FISH_LIST.md` | 50種の 表（場所・季節・時間・天気・めずらしさ・大きさ・ひき・ねだん・説明・まめちしき）と 出典 | 文と バランスの 確認 |
| `img/fish-sheet-1〜3.png` | 50種の 絵（`fish-art-ref.js` で 描いた もの） | 絵の 正解 |
| `img/fishing-flow.png` | 画面の 見本 7まい（ゲームの 上に 重ねて 撮影） | 見た目の 正解 |
| `img/small-phone.png` | 375×667 | 見た目の 正解 |
| `../../../../tools/feature-design/fish-art-ref.js` | 魚の 絵（`FishArtRef.svg(art, {uid, flip})`・かげ `shadow(kind)`） | `js/fish-art.js` に 移植（ゲームでの 名前は `FishArt`。⑤ も この 名前で つかう） |
| `../../../../tools/feature-design/fishing-ref.js` | しくみ（`pick`・`size`・`Game`）と 画面（`draw`） | `js/fishing.js` に 移植 |
| `../../../../tools/feature-design/fishing-ui.css` | ボタン・メーター・つれたカード・ずかんの CSS | `css/style.css` の さいごに 足す |
| `../../../../tools/feature-design/fish-data.mjs` | 元データ | 直すときは ここを 直して `npm run design:features` |

## 1. 受け入れ条件

- [ ] 「つりざお」（だいじな もの）が 手に 入る: タウンの いけの ペン（ぺんぎん）に 話すと もらえる。みなとの マルシェで「りっぱな つりざお」（1200 コイン・大きい 魚が にげにくい）。
- [ ] 釣り場（タウン・はらっぱ・もり・ビーチ・みなと）の 水べで「つる」ボタン → 横から 見た 釣りの 画面。**3にんとも 岸に いて**、1人が さおを もち、2人が おうえんする。
- [ ] なげる → まつ（ちょんちょん）→ ぐいっ！ で タップ → おしつづけて まく（あかい ところで はなす）→ つれた／にげた。にげても なにも なくならない。
- [ ] 魚 50種（いけ 10・かわ 11・さわ 5・うみべ 12・みなと 12。ほかの 場所でも つれる もの あり）。季節・時間・天気で かわる。どの 時間にも つれる 魚が いる。
- [ ] つれた ときの カード: 絵・なまえ・大きさ（cm）・めずらしさ・説明・まめちしき。「はじめて！」の しるし。いけすへ／にがす／うる。
- [ ] さかな ずかん: 50種の 一覧（つった 魚は 絵、まだの 魚は かげ）・場所で しぼれる・くわしい ページ（すむ 場所・季節・時間・大きさ・いちばん 大きい 記録・つった 数・説明・まめちしき）。
- [ ] 390×844・375×667 で はみ出さない。ボタンは 44px いじょう（まく ボタンは 132px）。

## 2. データの 形（`FISHING_DATA`）

```js
{ version: 1,
  fish: [{ id: "ayu", name: "アユ", place: "river", also?: ["stream"], season: [...]|"all", time: [...]|"all", weather?: ["rain"],
           rarity: 1..5, size: [min, max] /* cm */, power: 1..5, sell: コイン, shadow: "S"|"M"|"L"|"XL"|"thin",
           desc: "2行まで", fact: "2行まで", art: {...} /* fish-art-ref.js の パラメータ */, flip?: true /* カレイ: 右むき */, unlock?: 30 }],
  spots: { town: { place: "pond", name }, meadow: {...}, forest: {...}, coast: {...}, harbor: {...} },
  rods: [{ id: "rod", ... }, { id: "rod_pro", power: 1.6, ... }] }
```

- 時間の くぎり・季節・天気は ①② と 同じ（`U.hourNow()`・`Seasonal.current().id`・`Weather.kind()`）。
- 出やすさ: rarity 1:10・2:6・3:3・4:1.2・5:0.35。天気が あう 魚は ×2。りっぱな つりざおは rarity 3 いじょうを ×1.4（`FishingRef.pool`）。
- `unlock: 30` の シーラカンスは、30しゅ つった あとで 出る。

## 3. セーブ（`Save.fresh()` に 足すだけ。`SCHEMA` は そのまま）

```js
fish: { rod: 0, dex: {}, keep: {}, caught: 0 },
// rod: 0 なし / 1 つりざお / 2 りっぱな つりざお
// dex:  { [id]: { n: つった 数, max: いちばん 大きい cm, first: "2026-9-27" } }
// keep: { [id]: いけすの 数 }（ぜんぶで 30ぴきまで。④⑤ の 寄贈・② の 物々交換で へる）
```

## 4. 釣りの 画面（`FishingScene`）

- `SCENES` に `fishing` を 足す（ShopScene と 同じ ように 入る・出る）。町・外の 世界で、先頭の 子が 水（`'~'`）の マスを 向いて いて、`SPOTS` の マップで、さおを もって いる ときだけ「つる」ボタン（44px いじょう）を 出す。出ると もとの 場所に もどる。
- 画面は `FishingRef.draw(ctx, W, H, st)`（見本の 絵を そのまま）＋ DOM（`fishing-ui.css`）。ボタンは 1つ: なげる → まつ…（おせない）→ つる！（きいろ・ぷるぷる）→ まく（おしつづける）。
- `FishingRef.Game` の 数字（まつ 2〜5秒・ちょんちょん 1〜3回・タップの まどは 1.1秒・テンション 0.2〜0.8 が いいかんじ・1 いじょうが 0.6秒 つづくと いとが きれる）は 見本の まま。こどもが 遊べる かんたんさを かえない。
- 3にんの かお: まつ＝normal、ぐいっ！＝surprise（がちゃんは sparkle）、まく＝smile/sparkle/shout、つれた＝smile/sparkle/love。大きさは 3にん おなじ（`FishingRef.heroSize`）で、`Chara.preload` してから 描く（キーを ふやさない）。
- 音: なげる `tap`、ぐいっ！ `sparkle`、つれた `coin` など いまの `Sound.se` を つかう。
- 魚の 絵は `SvgCache` の キー `"fish:" + id`（50こ）と かげ `"fishshadow:" + kind`（5こ）だけ。

## 5. ずかん・いけす・うる

- メニューの「ずかん」に「さかな」タブを 足す（いまの まものの ずかんは そのまま）。見た目は `img/fishing-flow.png` の ⑥⑦。
- いけすが いっぱい（30ぴき）の ときは、カードの「いけすへ」の かわりに「いけすが いっぱい」→ にがす／うる を えらぶ。
- 「うる」は その場で `sell` コイン（`Save.addCoins`）。

## 6. ほかの 機能との つなぎ

- ② 町の人: つれた とき `TownFolk.signal({ do: "catch", fish: id })`。`FISHING_DATA` が あると ② の `x:fishing` の セリフ・`needs: ["fishing"]` の おねがい・物々交換（アジ・サバ）が 出る。物々交換の「わたす」は `Save.d.fish.keep` から へらす。
- ⑤ 水族館: 寄贈は `keep` から 1ぴき へらす（⑤ の 作業指示で）。

## 7. テストの 入口（`PokaDebug`）

- `fishing(place = "pond", fishId)` … 釣りの 画面を はじめる（fishId を わたすと その 魚が かかる）。
- `fishState()` … `{ phase, tension, prog, fish }`。
- `fishInput(kind)` … `"tap"` / `"hold"` / `"release"`。`fishSkip()` … まつ を とばして ぐいっ！ に する。
- `fishGive(id, n = 1)` … いけすに 入れる（ずかんにも のる）。`rod(n)` … さおを もたせる。

## 8. テスト

- `tools/check.mjs`: `FISHING_DATA` の 50種・id の 重複なし・値が 表の とおり・場所×季節×時間で 2しゅ いじょう（`build-fishing.mjs` と 同じ）・文の 長さ・`spots` の マップが ある。
- スモーク「釣り」（390×844・375×667）: `rod(1)` → タウンの いけ → `fishing("pond", "magoi")` → `fishInput("tap")`（なげる）→ `fishSkip()` → `fishInput("tap")` → `hold` で `caught` まで → カードで「いけすへ」→ `Save.d.fish.dex.magoi.n === 1` と `keep.magoi === 1`。はみ出しなし・スクリーンショット。

## 9. PR の 分けかた

1. ✅ **魚の データ・絵・ずかん**（済み: Claude Code。下の「実装メモ」）: `js/fishing-data.js`・`js/fish-art.js`（index.html と sw.js の 両方）、ずかんの「さかな」タブ、`fishGive` で 見られる。
2. ✅ **釣りざおと 釣りの 画面**（済み: Claude Code。下の「実装メモ」）: `Save.fish`・ペンから もらう・「つる」ボタン・`FishingScene`・PokaDebug・スモーク。
3. ✅ **いけす・うる・つなぎ**（済み: Claude Code。下の「実装メモ」）: いけすの 上限・うる・りっぱな つりざお（みなとの マルシェ）・② との つなぎ。

それぞれ `CHANGELOG.md` の `2.0.0-dev` に 1行、`docs/ROADMAP_V2.md` の M8 に ✅。

## 実装メモ（Claude Code が 作った ときの きまり。つぎの 番号も これに あわせる）

- 1番: `js/fishing-data.js`（そのまま コピー）・`js/fish-art.js`（見本 `FishArtRef` を 名前だけ `FishArt` に して そのまま）・`js/fishing.js`（`Fishing`）を index.html・sw.js の `townsfolk.js` の あと、`debug.js` の まえに 置いた。
- `Fishing` に 見本 `FishingRef` の `pool`・`pick`・`size`・`shadowOf`（おなじ 計算。`data` の 引数は なくして `FISHING_DATA` を 見る）と、`context()`（時間の くぎりは ①② と おなじ `U.dayPart()`・`Seasonal.current().id`・`Weather.kind()`）を 入れた。`FishingRef.period` は 移さない。**2番で `Game`・`SCENE`・`tint`・`heroSize`・`draw` を `Fishing` に 足し、`FishingScene` を 作る。**
- `Save.fresh().fish`（`{ rod: 0, dex: {}, keep: {}, caught: 0 }`）は ずかんで つかうので 1番で 足した（2番では 足さない）。つった ときは `Fishing.record(id, cm)`（ずかんの `n`・`max`・`first` と `keep`・`caught`。はじめてなら true）。
- ずかん: メニューの「ずかん」の 上に「まもの／さかな」（`.dex-kinds`）。さかなは `Fishing.dex(el)`（見本 ⑥）、つった 魚を おすと `Fishing.detail(id)`（⑦・`UI.modal`）。NEW は「きょう はじめて つった」（`dex[id].first === U.today()`。セーブは ふやさない）。DOM の 魚の 絵は `FishArt.svg(art, { uid })` を じかに 入れる（uid は ずかん `"d"+id`・くわしい ページ `"x"+id`。`Fishing.svgs` に 1回だけ 作って おく）。canvas で 描く ときは `SvgCache` の `"fish:"+id` と `"fishshadow:"+kind`（2番）。
- しぼりこみの ボタンは 44px に して、375 はばでも 6つ ならぶ ように grid に した（見本は 36px・よこ スクロール）。
- **② との きまり**: `TownFolk.features().fishing` は `FISHING_DATA` が あって **つりざおを もって いる（`Save.d.fish.rod > 0`）とき**だけ true（1番では まだ さおが もらえないので、アユの おねがいや 釣りの セリフは 出ない）。2番で ペンから さおを もらうと 出る ように なるので、**2番で つれた ときの `TownFolk.signal({ do: "catch", fish })` と、`TownFolk.have().fish` を `Save.d.fish.keep` に する ところまで 入れる**（アユを わたす おねがいが すすむ ように）。いけすから へらす・物々交換の さかなは 3番。
- テストの 入口: `PokaDebug.fishGive(id, n)`（大きさは `Fishing.size`。ずかんの きろくと `keep` を かえす）。`rod(n)`・`fishing()`・`fishState()`・`fishInput()`・`fishSkip()` は 2番。
- 2番: 見本 `FishingRef` の `Game`・`SCENE`・`tint`・`heroSize`・`draw` を `Fishing` に そのまま 入れた（文字まで おなじ）。`FishingScene` は `js/fishing.js` の さいごで `SCENES.fishing` に 登録。
- つりざお: `Talk.run` の プレゼントの あと・おねがいの まえに `Fishing.talked(n, who)`（`rods[0].get.npc` の ペン。さおが ない ときだけ `get.talk` を 言って `rod = 1`）。もらった 回は ふつうの セリフ・もちかけを 出さない。メニューの「もちもの」の 上に「だいじな もの」（`.key-item`）。さおの 絵は `Fishing.rodSvg()`（デザインに ないので 作った）。
- 「つる」ボタン: `WorldScene.update` の さいごで `Fishing.refreshButton(this)`（`spotAt`: `spots` の マップ・さおが ある・先頭の 子が 動いて いない・向いた マスが `'~'`）。右下（しゃしんの ボタンと おなじ ところ。しゃしんは シティだけ なので かさならない）。`exit` で `hideButton()`。おすと `Game.goto("fishing", { place, name, back })`。
- 釣りの 画面: canvas は `Fishing.draw`、DOM は `.fish-ui`（`.fish-top`・`.fish-talk`・`.fish-ctrl`）。先頭の 子が いちばん 右で さおを もつ（`heroes = order を ぎゃくに`）。ボタンは `pointerdown` で tap／まく は おして いる あいだ hold（`pointerup`・`cancel`・`leave` で はなす）。キーは ok＝おす・cancel＝やめる。
- 3人の かおは `Fishing.FACES`（EMO の normal・surprise・excited・love）と あかい ところの `DANGER_FACES`（わんこ surprise・がちゃん cry・ごじ shout）。これだけを `Chara.preload` する。
- 魚の かげ: 見本は `Image` の 大きさ（Chromium だと ぜんぶ 300 はば）に たよって いて どの 魚も おなじ 大きさ だった。ゲームでは viewBox の 1.2 ばいで `SvgCache`「`fishshadow:<kind>`」に して、`draw` には `px: G.px / 2` を わたす（S〜XL で 大きさが かわる）。
- つれた: `Fishing.card(f, cm, first)`（見本 ⑤。いけすへ／にがす。✕ で とじたら いけすへ。1かい だけ きまる）→ `Fishing.record(id, cm, { keep })` → `TownFolk.progress({ do: "catch", fish })`。にげたら 1.3びょう ことばを 出して また なげられる（なにも へらない）。
- ② との つなぎ（さおが もらえると アユの おねがい・アジ／サバの 物々交換が 出るので 2番で 入れた）: `TownFolk.have().fish` は `Save.d.fish.keep`、おねがいで わたす・物々交換の さかなは いけすから へらす。名前は `TownFolk.fishName(id)`、交換カードの 絵は `Fishing.svg`。
- 3番: いけすは `Fishing.KEEP_MAX`（30）と `keepCount()`。つれた カードは いけすへ／にがす／うる（`sell` コインを `Save.addCoins`。いけすには 入れず ずかんには のる）。いっぱいの ときは いけすへ の かわりに おせない「いけすが いっぱい」（✕ で とじたら にがす）。ボタンの 文字は `word-break: keep-all`（ことばの とちゅうで おりかえさない）。
- ずかんの 上に「いけすに いる さかな N / 30 ぴき」（`.fish-keep`）。いけすを へらすのは ⑤ の 寄贈と ② の おねがい・物々交換（いけすの 一覧から うる・にがす 画面は つくって いない）。
- りっぱな つりざお: `Fishing.proShop()` が `rods[1].get.shop`（`harbor_market`）の 建物を さがして `{ map: "harbor", shop: "market", price }`。`StoreScene.talk` の えらぶ ことばに、その マップの その お店で `rod < 2` の ときだけ `Fishing.proChoice(store)`（「りっぱな つりざお（1200コイン）」）を 足し、`Fishing.buyPro(owner)` で たしかめて かう（たりない ときは そう いう）。シティ・タウン・平和台の マーケットには 出ない。
- テストの 入口（3番）: 新しい 関数は ない（`fishGive(id, 30)` で いけすを いっぱいに、`store("market", "harbor")` で マルシェへ）。
- テストの 入口（2番）: `rod(n)`・`fishing(place, fishId)`・`fishState()`（`phase`・`tension`・`prog`・`fish`・`place`・`busy`・`msg`）・`fishInput("tap"|"hold"|"release")`・`fishSkip()`・`fishShore(map)`（歩いて 行ける 水べと 向き）。スモークでは 釣りの ボタンを `force` で おす（「つる！」は ぷるぷる うごき、その あいだの スクリーンショットの あとは Playwright が もどした アニメーションが のこる）。その まえに カードの まく（`.modal-wrap`）が きえるのを まつ。

## 10. やらないこと

- 魚を 食べる・さばく 表現、つり針が ささる 絵（ほのぼのに する。AGENTS.md の 9）。
- 失敗で なにかを うしなう しくみ・時間せいげん・課金。
- `js/fishing-data.js` を 手で 直す。セーブの キーを かえる。
