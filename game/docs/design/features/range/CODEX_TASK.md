# ⑥ 射撃場（エアガンの まとあて・主観の 画面）— 作業指示（Codex 向け）

オーナーの 依頼（そのまま）:

> 射撃場を実装しなさい。これは、エアガンで的当てをするミニゲームとして実装しますが、ハンドガン、ライフル、スナイパーライフル、をそれぞれ3種類程度実装し、形状も実際にあるエアガンに合わせたリアルなデザインとしなさい。射撃場では、誰かキャラクター一人を選んで、主観の視点で動く的を撃つゲームにしなさい。

読む順番: `AGENTS.md` → この ファイル → [`GUN_LIST.md`](GUN_LIST.md)（じゅう 9しゅ・せいのう・コース・★の めやす・出典）→ `img/*.png` → `tools/feature-design/gun-art-ref.js`（じゅうの 絵）→ `tools/feature-design/range-ref.js`（しくみと 画面）。

## ほのぼのを まもる きまり（AGENTS.md の 9。かならず まもる）

- まとは **紙の まと・かん・ふうせん・ほし・かね だけ**。人・どうぶつ・かおの ある ものを まとに しない。
- じゅうは **射撃場の 中で かりる だけ**。町に もって 出ない・町の 人や 敵に むけない・バトルで つかわない・買えない。
- はじめて 来た ときに ラビが やくそくを 話す（ゴーグルを つける・まとだけを ねらう・ひとや どうぶつに むけない）。実際の エアソフトガンの 安全の きまりと 同じ（出典は `GUN_LIST.md`）。
- 名前・絵は オリジナル。実在の 商品名・ロゴ・刻印を 入れない。じゅうこうの さきは オレンジ（おもちゃの しるし）。
- 音は くうきの「ぽん」「ぷしゅ」。火花・けむり・やっきょうは 出さない。あたった まとは たおれる・われる・なる だけ（こわれ かたを こわく しない）。
- **3にんは いつも いっしょ**: 1人が うち、のこりの 2人は 画面の ひだりしたで おうえん する。

## 0. この フォルダに ある もの

| ファイル | 中身 | つかいかた |
| --- | --- | --- |
| `range-data.js` | データ（`const RANGE_DATA = {...}`: じゅう 9・まと 7・コース 3・★の めやす・せりふ・町に たてる 場所）。**自動生成** | そのまま `game/js/range-data.js` に コピー。手で 直さない |
| `range.json` | 上と 同じ 中身 ＋ じどう あそびの 点（`sim`） | 確認用 |
| `GUN_LIST.md` | じゅうの 表（参考に した 形・長さ・しくみ・せいのう・せつめい）・コースと ★・出典 | 文と バランスの 確認 |
| `img/gun-sheet.png` | じゅう 9しゅ（実物の 長さ・高さの 比）・せいのう・せつめい | 絵の 正解 |
| `img/range-flow.png` | 画面の 見本 ①〜⑧（ゲームの 上に 重ねて 撮影） | 見た目の 正解 |
| `img/small-phone.png` | 375×667 | 見た目の 正解 |
| `../../../../tools/feature-design/gun-art-ref.js` | じゅうの 絵（`GunArtRef.svg(gun, { px, uid })`・手を そえる 場所 `parts(gun)`） | `js/gun-art.js` に 移植（ゲームでの 名前は `GunArt`） |
| `../../../../tools/feature-design/range-ref.js` | しくみ（`Game`・`bot`）と 画面（`draw`・`targetSvg`・`fpvSvg`・`facade`・`signIcon`） | `js/range.js` に 移植（ゲームでの 名前は `RangeRef` → `RangeGame` など 長めの 名前に） |
| `../../../../tools/feature-design/range-ui.css` | HUD・うつ／スコープ・おうえん・だれが うつ・じゅうを えらぶ・けっかの CSS | `css/style.css` の さいごに 足す |
| `../../../../tools/feature-design/range-data.mjs` | 元データ | 直すときは ここを 直して `npm run design:features` |

## 1. 受け入れ条件

- [ ] きらめきシティ（`city`）の (1, 11) に「シティ しゃてきじょう」（5×4 マス・外がわは `facade`: あかしろの ひさし・中に まとが 見える まど・やねの うえの まとの かんばん）。`img/range-flow.png` の ①。
- [ ] 入口に 入ると 射撃場の 画面（`RangeScene`）。おわると 入口の まえ (3, 15) に もどる。
- [ ] はじめての ときは ラビ（うさぎ・サングラス）が やくそくを 話す（`talk.first`・②）。
- [ ] だれが うつ？ → 3にんから 1人（③）。えらんだ 子の ひとこと（`talk.go`）。
- [ ] じゅうを えらぶ（④）: ハンドガンは はじめから。ライフルは ハンドガンの どれかで ★1、スナイパー ライフルは ライフルの どれかで ★1 で あそべる（`cats.*.unlock`）。3しゅずつ。絵・せつめい・まめちしき・せいのうの ぼう・ベストの ★。
- [ ] 主観の 画面（⑤⑥⑦）: えらんだ 子の 手（わんこ: しろい まえあし・がちゃん: きいろい はね・ごじ: はいいろの 手と しろい つめ）で じゅうを もつ。ゆびで ずらして ねらい、右したの「うつ」（92px）で うつ。カービンは おしっぱなしで れんしゃ。スナイパーは「スコープ」（64px）で ×2.5〜4（ゆれ あり）。
- [ ] コース 3つ: ちかくの まと（30びょう・おまつりの しゃてき）・まんなかの まと（30びょう・しゃげきじょう）・とおくの まと（35びょう・そとの はら）。まとは レール・ふりこ・ふうせん・ぴょこっと・かん で うごく。
- [ ] たまの 数・れんしゃ・ばらつき・はねあがり・リロード・スコープ・ゆれ が じゅうごとに ちがう（`guns`）。
- [ ] あてると てん（まとの まんなかほど 高い）。れんぞく 5かいめ から 1ぱつ +1。
- [ ] けっか（⑧）: ★（`courses.*.stars`）・てん・あてた 数・れんぞく・コイン（`GameEconomy.pay`）・3にんの ひとこと・「もう いちど／じゅうを かえる／おわる」。
- [ ] 390×844・375×667 で はみ出さない。ボタンは 44px いじょう。
- [ ] スマホで なめらか（`SvgCache` の キーは 有限: まと `rt:<kind>:<col>`・主観の じゅう `rg:<gun>:<who>:<tone>`）。

## 2. データの 形（`RANGE_DATA`）

```js
{ version: 1,
  cats: { hand: { name, short, course: "near", unlock: null }, rifle: { …, course: "mid", unlock: { cat: "hand", stars: 1 } }, sniper: { …, course: "far", unlock: { cat: "rifle", stars: 1 } } },
  guns: [{ id, cat, name, power, len, h /* mm */, ref, mag, rate /* 1びょうに */, auto, spread /* px */, recoil /* px */, reload /* びょう */, zoom?, sway?, desc, fact }],   // 9しゅ
  targets: { plate: { name, r, hit: "ring", pts: [3, 2, 1], se }, can: { w, h, hit: "box", pts: 1, fall }, popup, balloon, star, gong, far },
  courses: { near: { name, time, stars: [★1, ★2, ★3], items: [{ kind, motion: "rail"|"swing"|"rise"|"pop"|"stay", x | xs | win, y, vx?, vy?, amp?, period?, t, every?, life?, respawn? }] }, mid, far },
  combo: { from: 5, bonus: 1 }, pay: { base: 60, rank: [0, 0.45, 1, 1.5] },
  staff: { id: "range_staff", talk: "range_staff", name, sp: "rabbit", outfit: { face: "sunglasses" } },
  talk: { first, lines, lock, pick, go: { wanko, gachan, goji }, cheer: { wanko: { hit, combo, hurry, end }, … }, result: { 0, 1, 2, 3 } },
  outside: { map: "city", id: "city_range", x: 1, y: 11, w: 5, h: 4, label, roof, facility: "range", door, doorAt, front } }
```

- `courses.*.stars` は `build-range.mjs` が 人に にせた じどう あそび（`RangeRef.bot` の kid / casual / good）で きめた（★1 は 小さい 子でも・★3 は じょうずな 人なら どの じゅうでも とどく）。数を かえる ときは `range-data.mjs` を 直して 作りなおす。
- まとの 位置: `x` は -1（ひだり）〜 1（みぎ）、`y` は 0（おく）〜 1（てまえ）。画面の 位置と 大きさは `RangeRef.project`（コースごとの `VIEW`）。

## 3. 町に たてる・入口

```js
// town-design.js の patch("city", (g, d) => { … }) の 中
house(g, d, "city_range", 1, 11, 5, 4, "シティ しゃてきじょう", "#E35D5B", { type: "range" }, { facility: "range", sign: "range" });
```

- 外がわ: `WorldArt.building` を つつむ（`world-art.js` の `tower`・⑤ の 水族館と 同じ やりかた。`sp.facility === "range"` の ときだけ `facade(sp)`）。`SIGN_ICON.range = signIcon`。
- `scene-world.js` の `enterDoor`: `act.type === "range"` → `Game.goto("range", { back: out })`（お店の「work」と 同じ）。
- 場所は `build-range.mjs` が ゲームの 地図で たしかめた（あいた 地面・たてた あとも 町の 入口から ほかの ドア・ワープ・人・宝箱に 行ける）。

## 4. 射撃場の 画面（`RangeScene`）

```text
enter(p) → ロビー（DOM）
  はじめて → UI.say（ラビの かお・talk.first 3つ）→ Save.d.range.safety = true
  ③ だれが うつ？（UI.modal .rg-who）→ ④ じゅうを えらぶ（.rg-tabs / .rg-guns / .rg-detail。ロックは .tab.lock と talk.lock）
あそぶ（canvas ＋ DOM の HUD）
  よーい…（1.6びょう）→ スタート！ → RangeGame.update(dt, input) を まいフレーム → draw(ctx, game, art)
  おわり → ⑧ けっか（UI.modal .rg-result）→ もう いちど／じゅうを かえる／おわる（Game.goto("world", p.back)）
```

- 画面の 大きさ: 論理 はば 360、たかさは 画面の たてよこ比（`H = 360 × innerHeight / innerWidth`）。`ctx.setTransform(dpr × innerWidth / 360, …)`。
- 入力: ボタンの そとで ゆびを うごかすと `input.dx/dy`（CSS px × 360 / innerWidth）。「うつ」: おした フレームだけ `fire = true`、おしている あいだ `hold = true`（カービンの れんしゃ）。「スコープ」: おした フレームだけ `scope = true`。
- HUD（`.range-top`）: ⏱ のこり・🎯 てん・たま（10ぱつ いかは ぼう、それより 多いと「12 / 30」・リロード ちゅうは「リロード…」）・✕（やめる: たしかめて ロビーへ。コインは なし）。れんぞく 5 いじょうで `.range-combo`。
- おうえん（`.range-cheer`）: のこりの 2人の かお（`Chara` の 絵）と ふきだし `.range-bubble`。`hit` は 3かいに 1かい・`combo` は 5／10／15かいめ・`hurry` は のこり 5びょう・`end` は けっか。
- 音: うつ → `Sound.se("swish")`（くうきの おと）・あたり → まとの `se`（ding / hit / pop / sparkle）・リロード → `tap`・★3 → `fanfare`、それ いがい → `good`。
- えらんだ 子の `talk.go` を スタートの とき トーストで。
- 絵: まと `RangeRef.targetSvg(kind, col, T)`・主観の じゅう `RangeRef.fpvSvg(gun, who, tone)`（`tone` は ごじの いろ `soft` / `dark`）を `SvgCache` で。背景は `draw` の 中で canvas に 直接 描く。

## 5. セーブ（`Save.fresh()` に 足すだけ。`SCHEMA` は そのまま）

```js
range: { safety: false, plays: 0, best: {} },
// best: { auto: { score: 65, stars: 1 } }（じゅうごとの いちばん よい きろく。ロックは ここから きめる）
```

コインは `Save.addCoins(GameEconomy.pay("range", 1, ★))`（`GameEconomy.shopBase.range = 60` を 足す）。

## 6. ほかの 機能との つなぎ

- ② 町の人: `RANGE_DATA` が あると `x:range` の セリフ（「シティの しゃてきじょう、もう あそんだ？」「しゃてきじょうでは、ゴーグルを わすれずに！」）が 出る。けっかの あとで `TownFolk.signal({ do: "range", stars })`。
- ① おうち: いまは なし（あとで「きょうは しゃてきで ★3 だった！」などを 足して よい）。

## 7. テストの 入口（`PokaDebug`）

- `range(gunId = "auto", who = "wanko", seed)` … ロビーを とばして あそびを はじめる（ロックは むし）。
- `rangeInput({ dx, dy, fire, hold, scope })` … 1フレームぶんの 入力。
- `rangeAuto(sec, skill = "casual")` … じどうで あそぶ（`RangeRef.bot`）。
- `rangeState()` … `{ phase, score, ammo, left, scoped, stars, coins }`。`rangeEnd()` … すぐ おわらせる。

## 8. テスト

- `tools/check.mjs`: `RANGE_DATA` の 検査（`build-range.mjs` と 同じ）: じゅう 9しゅ（3しゅずつ）・せいのうの はんい・ことばの 長さ・まとと コースの 参照・`stars` が ふえて いく・`outside` の マップ。
- スモーク「射撃場」（390×844・375×667）: `range("auto", "wanko", "t1")` → `rangeAuto(40, "good")` → `rangeState().phase === "end"` と `stars >= 1` → `.rg-result` が 見える → `Save.d.range.best.auto.stars >= 1`・コインが ふえた。スナイパーは `range("heavy", "goji")` → `rangeInput({ scope: true })` → `rangeState().scoped`。はみ出しなし・スクリーンショット。

## 9. PR の 分けかた

1. **絵と 町の 建物と ロビー**: `js/range-data.js`・`js/gun-art.js`・`js/range.js` の 絵の 部分（index.html と sw.js の 両方）、シティの 建物・かんばん・入口、ラビの やくそく・だれが うつ・じゅうを えらぶ（あそぶ ボタンは まだ「じゅんび ちゅう」で よい）。
2. **あそぶ 画面**: `RangeScene`・主観の 画面・HUD・うつ／スコープ・けっか・`Save.range`・コイン・PokaDebug・スモーク。
3. **おうえんと つなぎ**: 2人の おうえん・えらんだ 子の ひとこと・ロック・② の `signal`。

それぞれ `CHANGELOG.md` の `2.0.0-dev` に 1行、`docs/ROADMAP_V2.md` の M8 に ✅。

## 10. やらないこと

- 上の「ほのぼのを まもる きまり」を やぶる こと（人・どうぶつの まと、町や バトルで じゅうを つかう、火花・やっきょう、実在の 商品名・ロゴ）。
- じゅうを 売る・課金・時間せいげん・しっぱいで なにかを うしなう しくみ。
- `js/range-data.js` を 手で 直す。セーブの キーを かえる。
