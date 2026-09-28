# ⑥ 射撃場（本格 エアソフトガン シューティング・主観の 画面）— 作業指示（Codex 向け）

オーナーの 依頼（そのまま）:

> 射撃場を実装しなさい。これは、エアガンで的当てをするミニゲームとして実装しますが、ハンドガン、ライフル、スナイパーライフル、をそれぞれ3種類程度実装し、形状も実際にあるエアガンに合わせたリアルなデザインとしなさい。射撃場では、誰かキャラクター一人を選んで、主観の視点で動く的を撃つゲームにしなさい。

あとから 足された オーナーの 指示（そのまま）:

> ⑥では、これまでのルールである9番（ほのぼの・こわくない）を無視してよい。リアリティのあるゲーム性の高いものとしてほしい。

読む順番: `AGENTS.md` → この ファイル → [`GUN_LIST.md`](GUN_LIST.md)（じゅう・弾道・しゅもく・★の めやす・こうかおん・出典）→ `img/*.png` → `tools/feature-design/gun-art-ref.js`（じゅうの 絵）→ `tools/feature-design/range-ref.js`（しくみ・弾道・画面）。

## ⑥ だけの きまり（オーナーの 指示）

- **AGENTS.md の 9（ほのぼの・こわくない）は ⑥ には あてはめない。** 実際の エアソフトガンと 射撃競技に ちかい、ゲーム性の 高い ものに する。
  - たまは 6mm の BB弾。弾道は くうきの ていこう・ホップの 浮く 力・じゅうりょく・よこかぜ で きまる（`range-ref.js` の `flight` / `ballistics` / `drift`）。
  - しゅもくは 実際の 競技の ルール: スティール チャレンジ・APS ブルズアイ・IPSC・ISSF 10m エアライフル・ロングレンジ（PRS がた）・ランニング ターゲット。
  - じゅうは 実物の 形・大きさ・しくみ（ガス ブローバック・でんどう・エアー コッキング・ボルト・レバー・リボルバー）。日本の エアソフトガンと 同じく **じゅうこうの さきは オレンジに しない**（`GunArtRef.svg(gun, { tip: true })` で 描けるが つかわない）。
  - 音は 動力ごとの 発射音・スチールの「カーン」（きょり ÷ 340m/s おくれて とどく）・ショット タイマーの ブザー・ボルトや マガジンの 音。
  - RO（レンジ オフィサー）の ことばは 実際の 号令（メイク レディ → アー ユー レディ？ → スタンバイ → ブザー → アンロード・ショウ クリア）。
- **かわらない きまり**（ほかの ところと 同じ）
  - AGENTS.md の 5（ひらがな 中心の ことば・390×844 と 375×667・ボタンは 44px いじょう）。
  - 3にんは いつも いっしょ: 1人が うち、2人は うしろで おうえん（画面の ひだりした）。
  - 的は **競技の 的だけ**（スチール プレート・紙の 的・ポッパー・かね・まと紙）。人や どうぶつの 形は つかわない（実際の 競技と 同じ）。
  - じゅうは 射撃場で かりる だけ。町・バトル・ほかの 画面には 出さない。売らない・課金しない。
  - はじめて 来た ときは RO の ラビが 安全の きまりを 話す（ゴーグル・ひきがねに ゆびを かけない・じゅうこうは まとへ・おわったら ショウ クリア）。

## 0. この フォルダに ある もの

| ファイル | 中身 | つかいかた |
| --- | --- | --- |
| `range-data.js` | データ（`const RANGE_DATA = {...}`: じゅう 9・しゅもく 6・弾道・ゆれ・★の めやす・こうかおん・せりふ・町に たてる 場所）。**自動生成** | そのまま `game/js/range-data.js` に コピー。手で 直さない |
| `range.json` | 上と 同じ 中身 ＋ 新しい 音（`newSe`）・弾道の 表（`table` / `hopTable`）・じどう あそびの 点（`sim` / `mid`） | 確認用 |
| `GUN_LIST.md` | じゅう・弾道・ホップ ダイヤル・ゆれ・しゅもく・★・こうかおん（sound.js に 足す case）・町の 場所・出典 | 数と 文の 確認 |
| `img/gun-sheet.png` | じゅう 9しゅ（実物の 長さ・高さの 比）・性能・せつめい | 絵の 正解 |
| `img/ballistics.png` | 弾道の グラフ（高さ・ホップ ダイヤル・かぜ） | 移した あとの 弾道の 正解 |
| `img/range-flow.png` | 画面の 見本 ①〜⑫（ゲームの 上に 重ねて 撮影） | 見た目の 正解 |
| `img/small-phone.png` | 375×667 | 見た目の 正解 |
| `../../../../tools/feature-design/gun-art-ref.js` | じゅうの 絵（`GunArtRef.svg(gun, { px, uid })`・手を そえる 場所 `parts(gun)`） | `js/gun-art.js` に 移植（ゲームでの 名前は `GunArt`） |
| `../../../../tools/feature-design/range-ref.js` | しくみ（`Game`・`bot`・弾道）と 画面（`draw`・`targetSvg`・`fpvSvg`・`facade200`） | `js/range.js` に 移植（ゲームでの 名前は `ShootingRange`。`ShootingRange.Game`・`ShootingRange.draw` …） |
| `../../../../tools/feature-design/range-ui.css` | HUD・うつ／のぞく／ボルト／リロード／いき・ズーム・RO の ことば・スコア モニター・ロビー・けっかの CSS | `css/style.css` の さいごに 足す |
| `../../../../tools/feature-design/range-data.mjs` | 元データ | 直すときは ここを 直して `npm run design:features -- --only=range` |

## 1. 受け入れ条件

- [x] きらめきシティ（`city`）の (10, 6) に「シティ シューティング レンジ」（5×4 マス・入口 (12, 9)・まえは 大通り）。外がわは `RangeRef.facade200()`（`img/range-flow.png` の ①）。
- [x] 入口に 入ると 射撃場（`RangeScene`）。おわると 入口の まえ (12, 10) に もどる。
- [x] はじめての ときは ラビ（うさぎ・サングラス）が きまりを 話す（`talk.first`・②）。
- [x] だれが うつ？ → 3にんから 1人（③）。のこりの 2人は うしろで おうえん。
- [x] しゅもくと じゅう（④）: タブ（ハンドガン・ライフル・スナイパー）→ しゅもく 2つ（ルールの 文）→ じゅう 3しゅ（絵・動力・たま・ベストの ★）→ せいのう（しょそく・まとまり・れんしゃ・はねあがり・おもさ）・まめちしき。ライフルと スナイパーは ホップ ダイヤル（0〜20・まんなか 10）。ロックは `cats.*.unlock`（ライフルは ハンドガンの どれかの しゅもくで ★1、スナイパーは ライフルで ★1）。
- [ ] RO の 号令 → スタンバイ（じゅうを さげて まつ・⑤）→ ブザー → 主観で うつ（⑥〜⑩）→ けっか（⑪⑫）。
- [ ] 6つの しゅもくが `range-ref.js` の とおりに うごく: スチール（5ストリング・いちばん おそい 1かいを のぞく・のこした プレート +3びょう）・ブルズアイ（5はつ × 2シリーズ・X/10/8/5・線に かかれば 上）・IPSC（A5 C3 D1・ポッパー 5・ミス −10・NS −10・60びょう・ヒット ファクター）・10m（10.9 まで）・ロングレンジ（30〜70m の かね 5つを ちかい じゅんに 2はつずつ）・ムービング（まどの 中だけ 見える 的・1かい 1ぱつ）。
- [ ] じゅうの ちがい: 初速・BB の 重さ・まとまり・れんしゃ（カービンは おしっぱなし）・たまの 数・リロード（ガス ブローバックは スライドが とまって +0.4びょう）・ボルト／レバー（うったら じぶんで うごかす）・1ぱつずつ こめる・ダブル アクションの おもい ひきがね・はねあがり・おもさ（ゆれと のぞく はやさ）・サイト・スコープの ばいりつ。
- [ ] のぞく（ADS）: アイアン サイト（3ドット・U・あかい ランプ・ピープ・バックホーン・ダイオプター）と スコープ（1mrad の めもり・ばいりつで 大きさが かわる）。ゆれ・いきを とめる（4びょうで きれて ふるえる）・ひきがねの ぶれ。
- [ ] ロングレンジと ムービングは かぜ（はたが なびく・HUD に むきと つよさ）。スチール・かねは あたって から 音が おくれて とどく。
- [ ] けっか: ★（`courses.*.stars`。タイムは みじかいほど、てん・ヒット ファクターは 大きいほど よい）・きろく・シート（スチールは 5ストリング、IPSC は A/C/D/ミス/NS/てん/じかん）・コイン・RO の ひとこと・3にんの ひとこと・「もう いちど／えらびなおす／おわる」。
- [ ] 390×844・375×667 で はみ出さない（`img/range-flow.png`・`img/small-phone.png`）。ボタンは 44px いじょう（うつ 92px）。
- [ ] スマホで なめらか。`SvgCache` の キーは 有限: 的 `ShootingRange.artKeys(RANGE_DATA)`（`rt:round:200` など 14こ）・主観の じゅう `rg:<gun>:<who>:<tone>`（9×3×2）・建物は `WorldArt.building` の いつもの キー。

## 2. データの 形（`RANGE_DATA`）

```js
{ version: 2,
  cats: { hand: { name, short, unlock: null }, rifle: { …, unlock: { cat: "hand", stars: 1 } }, sniper: { …, unlock: { cat: "rifle", stars: 1 } } },
  guns: [{ id, cat, name, ref, power: "gbb"|"gas"|"aeg"|"spring", action: "semi"|"da"|"auto"|"lever"|"bolt"|"single", pull?, cycle?, perRound?,
           len, h /* mm */, bb /* g */, v0 /* m/s */, group /* 10m で cm */, hip /* mrad */, rate, mag, reload, empty, recoil /* mrad */, back, weight /* kg */,
           sight, zoom /* 数 か [さいしょう, さいだい] */, zero /* m */, sh /* サイトの 高さ m */, hop, desc, fact }],   // 9しゅ
  courses: { steel, bullseye, practical, precision, long, moving },   // cat・name・env・kind・score（"time"|"points"|"hf"）・rule・stars: [★1, ★2, ★3]・しゅもくごとの 数（GUN_LIST.md）
  ballistics: { rho, cd, liftExp, g, dt, maxD, step, spreadGrow, hop: { steps: 20, min, max } },
  hold: { hand, rifle, sniper, breath, rest, calm, shake, trigger: { semi, da, auto, lever, bolt, single } },
  pay: { base: 60, rank: [0, 0.45, 1, 1.5] },
  sound: { fire: { gbb, gas, aeg, spring }, hit: { round, stop, popper, gong }, beep, reload, cycle, load, gasp, series, end: { 3, other } },
  staff: { id: "range_staff", talk: "range_staff", name, sp: "rabbit", outfit: { face: "sunglasses" } },
  talk: { first, lines, cmd: { ready, areYou, standby, done }, lock, pick, go: { wanko, gachan, goji }, cheer: { <だれ>: { hit, combo, hurry, end } }, result: { 0, 1, 2, 3 } },
  outside: { map: "city", id: "city_range", x: 10, y: 6, w: 5, h: 4, label, roof, facility: "range", style: "city_range", door: 2, doorAt: [12, 9], front: [12, 10] } }
```

- 単位: 長さ m（x よこ・y たかさ・z きょり。うつ 人の 目は y = 1.5）・角度 mrad（10m で 1cm）・時間 びょう。
- `courses.*.stars` は `build-range.mjs` が 人に にせた じどう あそび（`ShootingRange.bot` の kid / casual / good・1しゅ 12かい）で きめた。数を かえる ときは `range-data.mjs` を 直して 作りなおす（手で 直さない）。
- 弾道は `ShootingRange.ballistics(gun, hop, RANGE_DATA.ballistics)`（ホップ ダイヤルは `ShootingRange.hopAt(gun, step, RANGE_DATA.ballistics)`）。ゲームに 移した あと、`GUN_LIST.md` の「弾道」の 表と 同じ 数に なる ことを テストで たしかめる。

## 3. 町に たてる・入口

```js
// js/town-renewal.js の シティ（begin("city", …) の ブロック）に 1行
b.building("city_range", 10, 6, 5, 4, "city_range", { label: "シティ シューティング レンジ", door: 2, act: { type: "range" } });
// js/town-renewal-art.js の facades に 1つ（RangeRef.facade200 の 中身を そのまま。200×160 の デザイン・入口は つつむ 関数が 描く）
city_range: () => ShootingRange.facade200(),
```

- 場所は `build-range.mjs` が ゲームの 地図で たしかめた（あいた 地面・たてた あとも 町の 入口から ほかの ドア・ワープ・人・宝箱に 行ける）。
- `scene-world.js` の `enterDoor`: `act.type === "range"` → `this.busy = true; Game.goto("range", { back: out }, "circle")`（お店の `buy` / `work` と 同じ）。

## 4. 射撃場の 画面（`RangeScene`・`SCENES.range`）

```text
enter(p) → ロビー（DOM・UI.modal）
  はじめて → UI.say（ラビの かお・talk.first 3つ）→ Save.d.range.safety = true
  ③ だれが うつ？（.rg-who）→ ④ しゅもくと じゅう（.rg-tabs / .rg-courses / .rg-rule / .rg-guns / .rg-detail / .rg-hop）
RO の 号令（.range-cmd）: talk.cmd.ready →（0.8びょう）→ talk.cmd.areYou →（0.8びょう）→ ShootingRange.Game を つくる（phase = "standby" の あいだ talk.cmd.standby）→ ブザー
あそぶ（canvas ＋ DOM の HUD）: まいフレーム game.update(dt, input) → draw(ctx, game, art) → game.take() の できごとで 音・おうえん
  スチールの ストリングの あいだ・ブルズアイの シリーズの あいだは phase = "between"
おわり（phase = "end"）→ talk.cmd.done（アンロード。ショウ クリア。）→ ⑪⑫ けっか（.rg-result / .rg-sheet）
  もう いちど（同じ しゅもく・じゅう）／えらびなおす（④ へ）／おわる（Game.goto("world", p.back)）
```

- 画面の 大きさ: 論理 はば 360、たかさは 画面の たてよこ比（`H = 360 × innerHeight / innerWidth`）。`ctx.setTransform(dpr × innerWidth / 360, …)`。`new ShootingRange.Game(RANGE_DATA, courseId, gunId, { seed, W: 360, H, who, hopStep })`。
- 入力（1フレームぶん）:
  - ボタンの そとで ゆびを うごかす → `dx / dy`（CSS px × 360 / innerWidth）。ゆびを はなしても ねらいは その まま（ゆれは つづく）。
  - 「うつ」（.range-fire）: おした フレームだけ `fire`、おしている あいだ `hold`（カービンの れんしゃ）。
  - 「のぞく／もどす」（.range-ads）: `ads`。「ボルト／レバー／こめる」（.range-act）: `action`。「リロード／こめる」（.range-reload）: `reload`。
  - 「いき」（.range-breath）: おしている あいだ `breath`。スコープの「＋／−」（.range-zoom）: `zoomIn` / `zoomOut`。IPSC の「おわり」: `finish`。
  - ✕: たしかめて ロビーへ（コインは なし）。
- HUD は `game.hud()` の 数で 描く（`img/range-flow.png` の とおり）:
  - スチール: ストリング 2/5・⏱ 1.82・たま。ブルズアイ: シリーズ 1/2・3/5はつ・⏱ のこり（右うえに スコア モニター .range-monitor）。IPSC: ⏱・たま・おわり。10m: 6/10はつ・⏱ のこり・スコア モニター。
  - ロングレンジ: 5/10はつ・⏱ のこり・てん・たま ＋ 2だんめ「いま 50m（2/2）」「かぜ ←←← つよい」＋ みぎに ズーム。ムービング: ラン 7/10 はやい・てん・たま ＋ かぜ ＋ ズーム。
  - たまは 10ぱつ いかなら ぼう（.range-ammo）、それより 多いと「23/25」。ボルト・レバーを うごかす ときは .range-act に .need、うてない ときは .range-fire に .wait。
- おうえん（.range-cheer）: のこりの 2人の かお（`Chara` の 絵）と .range-bubble。`hit` は 3かいに 1かい・`combo` は IPSC で A ゾーンが 4はつ つづいた とき と スチールで のこしの ない ストリング・`hurry` は のこり 10びょう・`end` は けっか。
- 音（`sound`）: うつ → `fire[power]`・スチール／ポッパー／かね → `hit[shape]` を `delay` びょう あとに（`events` の `hit.delay = z / 340`）・紙の 的は 音なし・ブザー `beep`・リロード `reload`・ボルト／レバー `cycle`・こめる `load`・いきが きれる `gasp`・シリーズ おわり `series`・けっか ★3 `end[3]`／ほか `end.other`。
  - `rg_` で はじまる 8つは `sound.js` の `se()` に 足す（`GUN_LIST.md`「こうかおん」の case を そのまま）。
- 絵: 的 `ShootingRange.targetSvg(shape, def)`（キーは `ShootingRange.tkey(def)`）・主観の じゅう `ShootingRange.fpvSvg(gun, who, tone)`（ごじの `tone` は `soft` / `dark`）を `SvgCache` で。背景・サイト・スコープ・手は `draw` の 中で canvas に 直接 描く。

## 5. セーブ（`Save.fresh()` に 足すだけ。`SCHEMA` は そのまま）

```js
range: { safety: false, plays: 0, best: {}, hop: {} },
// best: { "steel:auto": { result: 26.5, stars: 2 }, "bullseye:classic": { result: 96, stars: 3, xs: 5 } }
//   しゅもく × じゅう ごとの いちばん よい きろく。よさは score の むき（time は 小さいほど・points / hf は 大きいほど。ブルズアイは おなじ てんなら X が 多いほど）
// hop: { bolt: 12 }（じゅう ごとの ホップ ダイヤル。つぎに えらんだ ときの はじめの 値）
```

- ロック: `cats[cat].unlock` の しゅるいの どれかの `best` の ★ が `stars` いじょうなら あく。
- コイン: `Save.addCoins(GameEconomy.pay("range", 1, ★, Save.d.settings.difficulty))`（`GameEconomy.shopBase.range = 60` を 足す）。時間の せいげんは 競技の ルールの まま（むずかしさで かえない）。

## 6. ほかの 機能との つなぎ

- ② 町の人: `RANGE_DATA` が あると `x:range` の セリフ（「シティの しゃてきじょう、もう あそんだ？」「しゃてきじょうでは、ゴーグルを わすれずに！」）が 出る。けっかの あとで `TownFolk.signal({ do: "range", stars })`。
- ① おうち: いまは なし（あとで「きょうは スチールで ★3 だった！」などを 足して よい）。

## 7. テストの 入口（`PokaDebug`）

- `range(courseId = "steel", gunId = "auto", who = "wanko", seed)` … ロビーを とばして あそびを はじめる（ロックは むし）。
- `rangeInput({ dx, dy, fire, hold, ads, breath, action, reload, zoomIn, zoomOut, finish })` … 1フレームぶんの 入力。
- `rangeAuto(sec, skill = "casual")` … じどうで あそぶ（`ShootingRange.bot`）。
- `rangeState()` … `game.hud()` ＋ `{ course, gun, result, stars, coins }`。`rangeEnd()` … すぐ おわらせる。

## 8. テスト

- `tools/check.mjs`: `RANGE_DATA` の 検査（`build-range.mjs` と 同じ）: じゅう 9しゅ（3しゅずつ）・エネルギー 0.98J いか・性能の はんい・しゅもく 6つ（2つずつ）・的の 形と 参照・`stars` が score の むきに ならぶ・こうかおんの 名前・`outside` の マップ。弾道の 表（`GUN_LIST.md`）と `RangeGame` の 弾道が 0.1cm まで あう。
- スモーク「射撃場」（390×844・375×667）:
  - `range("steel", "auto", "wanko", "t1")` → `rangeAuto(90, "good")` → `rangeState().phase === "end"` と `stars >= 2`・`times.length === 5` → `.rg-result` と `.rg-sheet` が 見える → `Save.d.range.best["steel:auto"].stars >= 2`・コインが ふえた。
  - `range("long", "bolt", "goji")` → `rangeInput({ ads: true })` → 0.5びょう あとに `rangeState().ads`・`rangeInput({ zoomIn: true })` で `zoom` が ふえる → ブザーの あと `rangeInput({ fire: true })` で `needAction === true`・`rangeInput({ action: true })` の 0.8びょう あとに `false`。
  - `range("practical", "carbine", "gachan")` → `rangeAuto(70, "good")` → `phase === "end"`・`result > 0`（ヒット ファクター）。
  - はみ出しなし・スクリーンショット。

## 9. PR の 分けかた

1. ✅ **絵と 町の 建物と ロビー**（済み: Claude Code。下の「実装メモ」）: `js/range-data.js`・`js/gun-art.js`・`js/range.js` の 絵と 弾道の 部分（index.html と sw.js の 両方）、シティの 建物・入口、ラビの きまり・だれが うつ・しゅもくと じゅう（ホップ ダイヤル・ロック）、`sound.js` の `rg_` 8つ（あそぶ ボタンは まだ「じゅんび ちゅう」で よい）。
2. **あそぶ 画面**: `RangeScene`・主観の 画面・サイトと スコープ・HUD・そうさ・6しゅもく・けっか・`Save.range`・コイン・PokaDebug・スモーク。
3. **RO の 号令・おうえん・つなぎ**: メイク レディ〜ショウ クリア・2人の おうえん・② の `signal`。

それぞれ `CHANGELOG.md` の `2.0.0-dev` に 1行、`docs/ROADMAP_V2.md` の FEAT-15〜17 に ✅。

## 実装メモ（Claude Code が 作った ときの きまり。つぎの 番号も これに あわせる）

- 1番: `js/range-data.js`（そのまま コピー）・`js/gun-art.js`（見本 `GunArtRef` を 名前だけ `GunArt` に して そのまま）・`js/range.js`（見本 `RangeRef` を 名前だけ `ShootingRange` に。中の `GunArtRef` は `GunArt`）を **`museum.js` の あと・`scene-world.js` の まえ**に、`js/scene-range.js`（`RangeScene`・`SCENES.range`）を **`fossils.js` の あと・`debug.js` の まえ**に 読む（index.html と sw.js の 両方）。`tools/preview.html` も `gun-art.js`・`range.js` を 読む（町の 建物の 一覧で `ShootingRange.facade200` を つかう）。
- `js/range.js` は 1番では 見本の **弾道**（`flight`・`ballistics`・`drift`・`FOV`・`SHAPE`・`hopAt`）と **絵**（`targetSvg`・`tkey`・`artKeys`・`handSvg`・`fpvSvg`・`facade200`）だけ。2番で 見本の `rng`・`gauss`・`Game`・`SKILL`・`bot`・`view`・`proj`・`draw*` を **見本と 同じ ならびの 場所に** 足す（さいごに `range-ref.js` と 名前いがい 同じ に なる）。
- 町の 建物: `town-renewal.js` の シティの ブロックに `b.building("city_range", 10, 6, 5, 4, "city_range", { label, door: 2, act: { type: "range" } })`。店先の 小物の 表（`frontages`）に `city_range`（`city_billboard`・`newsbox`・`planter`・`city_bikerack`）を 足した。外がわは `town-renewal-art.js` の `facades.city_range = () => ShootingRange.facade200()`（入口は いつもの つつむ 関数が 描く）。
- ドア: `WorldScene.enterDoor` で `act.type === "range"` → `this.busy = true; Game.goto("range", { back: out }, "circle")`（`out` は 入口の まえ (12, 10)）。`tools/check.mjs` の 建物の `act` に `range`（`SCENES.range` が ある とき）を みとめた。
- ロビー（`scene-range.js`）: うしろは canvas に 描く（コンクリートの かべ・まとの マーク・カウンターと RO の ラビ。ラビの 絵は `SvgCache` の `rg:staff`）。HUD は 出した まま（コインと 場所の 名前「シティ シューティング レンジ」）。ロビーの 会話と モーダルは、シーンが 入った あと（`Game.trans` が おわって から）`update` で はじめる（`enter` の 中で まつと 画面の きりかえが とまる）。
  - はじめて: `UI.say`（名前 `staff.name`・かお `Art.npcSvg({ sp: "rabbit", outfit: { face: "sunglasses" } })`・`talk.first` 3つ）→ `Save.d.range.safety = true`。2かいめ からは 話さない。
  - だれが うつ？: `.rg-who` の カード（3人の かおは `Chara.svg` を `U.svgUrl` の img に。わんこ smile・がちゃん smile・ごじ love）・ことばは `talk.go[だれ][0]`。さいしょは 先頭の 子。✕ で 町へ もどる。
  - しゅもくと じゅう: `.rg-tabs`（ロックは `🔒`・`.lock`。えらぶと `.rg-lock` に `talk.lock` を 出し「これで うつ」を おせない）→ `.rg-courses`（名前・もとの 競技・てんの かぞえかた・その しゅもくの いちばん よい ★）→ `.rg-rule` → `.rg-guns`（`GunArt.svg(g, { px: ハンドガン 0.5 / ほか 0.105, uid: "sel" + id })`・動力・たま・ばいりつ か うごき・この しゅもくでの ★）→ `.rg-detail`（せいのうの ぼう・ホップ ダイヤル・まめちしき）。✕ で だれが うつ？ に もどる。えらんだ もの（だれ・しゅるい・しゅるいごとの しゅもくと じゅう）は `RangeScene.memo` に おぼえる（セーブ しない）。
  - ホップ ダイヤル（ライフル・スナイパー）: −／＋ で 0〜20（まんなか 10）。かえると すぐ `Save.d.range.hop[じゅう]` に のこす。
  - 1番の「これで うつ」は トースト「しゃてきじょうは じゅんび ちゅう…」を 出して しゅもくと じゅうに もどる（2番で あそぶ 画面に つなぐ）。
  - CSS は `range-ui.css` を そのまま `style.css` の さいごに 足し、その あとに ゲームで 足した 2行（ロビーの 文は `word-break: keep-all` で 文節で おりかえす・したの ボタン `.rg-go` は 48px）。
- セーブ: `Save.fresh().range = { safety: false, plays: 0, best: {}, hop: {} }`（足すだけ。`SCHEMA` は そのまま）。
- 音: `sound.js` の `se()` に `rg_` の 8つ（`GUN_LIST.md` の「こうかおん」。書き方は まわりに あわせて `{ f: … }` に 空白を 入れた）。
- `tools/check.mjs`: `RANGE_DATA` の 検査（じゅう 9しゅ・0.98J いか・性能の はんい・うごきごとの 数・しゅもく 6つ・的の 形と 参照・★の ならび・こうかおん・RO の 服・町の 建物と 入口・セーブ）と、**`GUN_LIST.md` の「弾道」「ホップ ダイヤル」の 表を よんで** `ShootingRange.ballistics` と 0.1cm（とぶ 時間は 0.01びょう）まで あうか。じゅう・主観の じゅう（9×3×2）・的（14）・外がわの SVG。
- `tools/feature-design/build-range.mjs`・`range-mock.mjs`: ゲームに 射撃場が 入った あと（`RANGE_DATA` が ある）でも 見本を 作りなおせる ように、たてた あとの 建物（`act: range`）と sound.js の `rg_` を しらべ、見本の 画面は 建物を たてずに 撮る。
- スモーク `range-lobby-390` / `-375`: 町の 建物 → 入口へ 歩く → きまり → だれが うつ？ → しゅもくと じゅう（えらぶ・ロック・★1 で ライフルが あく・ホップ ダイヤルが のこる）→ ✕ ✕ で 入口の まえ → 2かいめは きまりを 話さない。スクリーンショットは `docs/screenshots/range-lobby/`。

## 10. やらないこと

- 人・どうぶつの 形の 的、町・バトルで じゅうを つかう こと、じゅうを 売る・課金・時間の せいげんで なにかを うしなう しくみ。
- 実在の 商品名・ロゴ・刻印を 絵や 名前に 入れる こと（参考に した 形の 名前は `GUN_LIST.md` だけ）。
- `js/range-data.js` を 手で 直す。セーブの キーを かえる。
