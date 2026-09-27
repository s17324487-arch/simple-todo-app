# ① おうちの 吹き出しと 会話 — 作業指示（Codex 向け）

オーナーの 依頼（そのまま）:

> お家にいるときのコメントの吹き出しが不自然で見にくい。吹き出しデザインを見直しなさい。コメントの種類が少ない。自然な会話のバリエーションをもっと増やしなさい。周辺の環境に合わせて、500種類以上はほしい。さらに、キャラクターごとの性格を踏まえた、独自コメントもほしい。
> ・ガーちゃんはすこし臆病な性格で、優しい性格だ。だけど泣き虫で、一人になりたくない、甘えん坊だ。「ままーたすけてー」と頼りにすることがある。
> ・ごじは、愛嬌があり、なんでもガウっとしちゃう癖がある。また、語尾に「・・・ガゥ」と付けるときがたまにある。一人で以外に何でもできちゃう器用さがある。そして、将来の夢は「おっきくなること」だ。
> ・わんこは、正義感があるが、ずるがしこいところもある。また、なんでもクンクンしちゃう癖もあるが、やりすぎると、ママにおこられる。お風呂が好きで、入りたい。たまに「わうーん！」と遠吠えする。

読む順番: `AGENTS.md` → この ファイル → [`LINES.md`](LINES.md)（全セリフ）→ `tools/feature-design/home-bubble-ref.js`（見本の 実装）。

## 0. この フォルダに ある もの

| ファイル | 中身 | つかいかた |
| --- | --- | --- |
| `home-talk-data.js` | 会話データ（`const HOME_TALK_DATA = {...}`）。**自動生成** | そのまま `game/js/home-talk-data.js` に コピーする。手で 直さない |
| `home-talk-lines.json` | 上と 同じ 中身の JSON（読みやすい 形） | 確認用 |
| `LINES.md` | 全セリフの 一覧（id・文・条件・形） | 文の 確認用 |
| `img/before-after.png` | いま と 見本の くらべ（ゲームを 実際に 動かして 撮影。390×844 ×2・375×667 ×1） | 見た目の 正解 |
| `img/bubble-kinds.png` | 吹き出しの 形 6種 | 見た目の 正解 |
| `../../../../tools/feature-design/home-bubble-ref.js` | 吹き出しの 見本の 実装（`HomeBubbleRef`。canvas 2D・classic script） | `js/home-life.js` に 移植する |
| `../../../../tools/feature-design/home-lines.mjs` | セリフの 元データ | 文を 直すときは ここを 直して `npm run design:features` |

数: **ひとこと 658 ＋ かけあい 60（187 セリフ）＝ 718 種**（わんこ・がちゃん・ごじ 各 まわり 156 ＋ 性格 45 ＋ めずらしい 5、ぱぱ・まま 各 20）。

## 1. 受け入れ条件

- [ ] 吹き出しは **話し手の 頭の 真上** に 出て、しっぽが 短く 話し手を さす（`img/before-after.png` の 右と 同じ）。
- [ ] 名札の 色で だれか わかる（わんこ `#9C7552`・がちゃん `#E1A21E`・ごじ `#667A83`・ぱぱ `#4F86C6`・まま `#DE7A9C`）。
- [ ] 形で 気持ちが わかる: ふつう（まる角）／さけぶ（ぎざぎざ）／なく（なみなみ・なみだ）／こころの こえ（くも・しっぽは 丸 2つ）／ひそひそ（点線）／めずらしい（金色・きらきら）。
- [ ] **同時に 出すのは 2つまで**。かけあいは 1つずつ 順番に 出す。吹き出しどうし・話し手の 顔と 重ならない。
- [ ] 390×844・375×667、ふつう と みまもり の 4とおりで、はみ出し・重なりが ない。
- [ ] セリフが **500 種 いじょう**（いまは 718）。まわり（時間・天気・季節・おまつり・部屋・近くの 家具・おなか／きげん・できごと）で えらばれる。
- [ ] 3人の 性格の セリフと くせ（わんこの クンクン → ままに おこられる・わうーん！／がちゃんの ひとりは いや・ままー たすけてー／ごじの ガウっ・…ガゥ）が 出る。
- [ ] セーブの 形は かえない（`Save.SCHEMA` は そのまま）。

## 2. 吹き出し（`HomeBubbleRef` を 移植する）

`HomeLife.bubbleLayout(sc, ctx)` と `HomeLife.draw(sc, ctx)` を、`HomeBubbleRef.layout` / `HomeBubbleRef.draw` の 中身で おきかえる。
`PokaDebug.family()` が `HomeLife.bubbleLayout(sc, G.ctx)` の 戻り値（`{id, text, x, y, w, h, anchor}`）を 使って いるので、**この 関数名と 戻り値の 形は のこす**（`kind`・`tail` を 足すのは よい）。

| 項目 | 値 |
| --- | --- |
| 文字 | `700 13px 'M PLUS Rounded 1c', sans-serif`、行の 高さ 18、1行 最大 186px、3行まで（あふれたら「…」） |
| 余白・角 | 横 11・縦 8・角の 丸み 13・線 2（`INK`）・しっぽ 10 |
| 名札 | 高さ 15・文字 10px・話し手の 色で ぬる（白い 文字）。めずらしい ときは 名前の 後ろに ☆ |
| 置く 場所 | 頭の てっぺん: こども `sc.toScreen(c.x, c.y - 84)` 半径 `24 * sc.s`、ぱぱ・まま `sc.toScreen(c.x, c.y - 104)` 半径 `21 * sc.s` |
| 置ける はんい | 上 `sc.watching ? 112 : 194`、下 `G.H - (sc.watching ? 65 : 143)`、左 8、右 `G.W - 8` |
| えらびかた | 候補（頭の 真上 1〜2段 × 左右に 22px きざみで ±154 ＋ 頭の 左横・右横）に 点数を つけ、いちばん 小さい ものに する。ほかの 吹き出しと 重なる: 面積×6、話し手の 顔: ×6、ほかの 子の 顔: ×4、話して いない ぱぱ・ままの 顔: ×0.8、真上の 候補が 頭に かぶる: ＋4000 |
| 出して いる 時間 | `max(2.4, min(5.5, 1.8 + 文字数 × 0.1))` 秒。出る とき 0.18 秒で ふくらみ、きえる とき 0.35 秒で うすく なる |
| かず | 同時に 2つまで。3つめが 来たら いちばん 古い ものを 消す。同じ 人の 新しい ことばは 前の ものと 入れかえる |

- `HomeLife.say(sc, id, text, rare = false, kind = "say")` に `kind` を 足す（いまの 呼び出しは そのまま 動く）。`born`（`G.t`）と `life` を 持たせる。
- 「タップで なかなおり」の 帯は いまの まま。
- canvas に じかに 描くので `SvgCache` は つかわない。

## 3. 会話の えらびかた

### データの 形（`HOME_TALK_DATA`）

```js
{ version: 1,
  voice: { wanko: {...}, gachan: {...}, goji: {...} },        // くせの きまり（下の 表）
  lines: [{ id: "wa0001", who: "wanko", group: "context"|"persona"|"parent"|"rare", text, kind: "say"|"shout"|"cry"|"think"|"whisper", when: { time: ["morning"], near: ["bed"], ... }, tag?, rare? }],
  talks: [{ id: "tea-time", trigger?: "sniff3"|"thunder"|"alone"|"quarrel"|"settle", when: {...}, turns: [{ who, text, kind }] }] }
```

### 条件（`when`）

同じ キーの 中は「どれか」、ちがう キーは「ぜんぶ」。あった キーの 数を `score` と して、重み `1 + 2 × score` で くじを 引く（`tools/feature-design/folk-ref.js` の `TownFolkRef.score / pick` と 同じ 計算。共通の 関数に して よい）。

| キー | 値 | ゲームで どう しらべるか |
| --- | --- | --- |
| time | morning 5–10時／day 10–16／evening 16–19／night 19–23／late 23–5 | `U.hourNow()` |
| weather | clear／cloudy／rain／snow／wind | `Weather.kind()`（おうちの 中でも そとの 天気） |
| season | spring／summer／autumn／winter | `Seasonal.current().id` |
| festival | newyear … christmas（12か月の おまつり） | `AnnualFestivals.current().id` |
| room | main／study／garden | `Save.d.rooms.active` |
| near | bed・sofa・tv・piano・bookshelf・toybox・kotatsu・fishbowl・aquarium・fireplace・kitchen・desk・tent・window・clock・plant・teddy・trophy・rockinghorse・train・musicbox・snow_globe・painting・poster・teacart・vanity・sakura_lamp・star_lantern・cloudsofa・acorn_cart | 話し手から 70px いないに ある 家具（`Save.d.room.items`。`bed` は `bed_simple`/`bed_royal` の どちらでも） |
| state | hungry（おなか < 30）／full（≧ 90）／deza（`wantsDeza`）／happy（きげん ≧ 80）／sad（< 30） | `Save.d.chars[id]` |
| event | return（帰って 20秒）／win（バトルに 勝って 帰った）／work（おてつだいの あと）／dress（きがえの あと）／edit（もようがえの あと）／watch（みまもり中） | `house` に 入る ときの 引数 や `sc.mode` の 変化で 覚えて おく（シーンの 中だけ・セーブしない） |

- さいきん 出た 40 この id は えらばない（シーンの 中だけで 覚える）。
- `group: "persona"` は ひとことの 約 30%、`context` が のこり。`parent` は ぱぱ・ままが 見えて いる ときだけ。`rare` は いまの `event("rare")` の かわり（`Save.d.flags.rareChats` は いまと 同じく 数える）。

### いまの `HomeLife.update` / `event` との つなぎ

| いまの できごと | これから |
| --- | --- |
| `solo` | 1人を えらび、その 子の `context`＋`persona` から 1つ |
| `chat` | 条件に あう `talks`（`trigger` なし）を 1つ えらび、`turns` を 1.3 秒おきに 順番に 出す |
| `quarrel` / `settle` | `trigger: "quarrel"`（toy-turn）と `"settle"`（make-up）の かけあいを つかう。`sc.life.quarrel` の しくみは いまの まま |
| `weather` | `when.weather` が ある セリフを 優先（`Weather.comment` は つかっても よい） |
| おなか・デザ | `state` の 条件で えらぶ（`Care.fullText` は のこして よい） |
| `rare` | `group: "rare"` から（金色の 吹き出し・`Sound.se("sparkle")`） |

### くせ（`voice`）

| 子 | きまり |
| --- | --- |
| わんこ | 3% で「わうーん！」（shout）。家具の 70px いないに いると 15% で「クンクン… {家具の 名前}の におい！」。60 秒に 3回 クンクン したら かけあい `sniff-scold`（ままに おこられる → しょんぼり） |
| がちゃん | ほかの 2人から 120px いじょう はなれて 8 秒 たつと かけあい `not-alone`。あめの 日は 10% で かけあい `thunder`（「ままー たすけてー」） |
| ごじ | 12% で 文の おわりに「 …ガゥ」（文に ガウ・ガゥ・ガォ が あれば つけない）。8% で ふつうの 文の 前に「ガウっ！ 」 |

## 4. テストの 入口（`PokaDebug`）

- `homeSay(id, text, kind = "say")` … いまの おうちで しゃべらせる。
- `homeTalk(talkId)` … かけあいを 1つ 流す。
- `homeTalkLog()` … さいきん しゃべった もの `[{ id, text, kind, t }]`（シーンの 中だけ）。
- `homeLines()` … `{ total, byWho, talks }`（データの 数）。
- `family().bubbles` は いまの まま（見えて いる 2つまで）。

## 5. テスト

- `tools/check.mjs`: `HOME_TALK_DATA` が ある・合計 500 いじょう・キーと 値が 表の とおり・同じ 文が ない・1行 26（全角1・半角0.5）まで・`talks` の id が 重ならない・`voice` の `talk` が ある。
- `tests/smoke.mjs` の「ぱぱまま・吹き出し・セーブ」の `f.bubbles.length === 3`（3人の 会話）は、**「2つまで 同時・順番に 出る」の 仕様に あわせて 直す**: `homeLife("chat")` の あと 6 秒 いないに `homeTalkLog()` に 3人とも 出る／どの ときも `family().bubbles.length <= 2`・重ならない・画面の 中・しっぽの 先が 話し手の 頭から 30px いない。テストを けずらない。
- あたらしい シナリオ「吹き出しの 形と 場所」（390×844・375×667 × ふつう／みまもり）: `homeSay` で 6種の 形を 出し、上の 条件を たしかめて スクリーンショットを 残す。

## 6. PR の 分けかた

1. **吹き出しの 描きかた**: `HomeBubbleRef` の 移植・`say` の `kind`・PokaDebug・スモークの 直し。セリフは いまの まま。
2. **会話データと えらびかた**: `js/home-talk-data.js`（index.html と sw.js の 両方に、`home-life.js` より 前）・条件・くせ・かけあい・check.mjs。

それぞれ `CHANGELOG.md` の `2.0.0-dev` に 1行、`docs/ROADMAP_V2.md` の M8 に ✅。

## 7. やらないこと

- `js/home-talk-data.js` を 手で 直す（元データを 直して 作りなおす）。
- 3人の だれかが いない かけあい、こわい・かなしすぎる ことば（AGENTS.md の 9）。
- セーブの キーや 形を かえる。フォントや 外部の 通信を 足す。
