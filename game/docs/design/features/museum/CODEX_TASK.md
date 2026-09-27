# ⑤ 水族館と 恐竜博物館（寄贈で 展示が ふえる・順路の ある 館内）— 作業指示（Codex 向け）

オーナーの 依頼（そのまま）:

> 水族館と恐竜博物館を実装しなさい。これは、捕まえた魚や骨の寄贈を受けて、展示が増えていくデザインとしなさい。実際に中を探検できるようにして、展示物はリアルなデザインとしなさい。建物の構造も、単調ではなく実際の博物館や水族館のような順路があり、様々な嗜好を凝らしたデザインとしなさい。実際の博物館や水族館のデザインを検索して参考にすることをお勧めします。

読む順番: `AGENTS.md` → この ファイル → [`MUSEUM_LIST.md`](MUSEUM_LIST.md)（へや・順路・展示・案内・説明・参考に した 実際の 館と 出典）→ `img/*.png` → `tools/feature-design/museum-art-ref.js`（展示・建物の 外がわ・かんばんの 絵）→ `tools/feature-design/museum-render.mjs`（床と かべの 描きかた）。

前提: ③ 釣り（[`../fishing/CODEX_TASK.md`](../fishing/CODEX_TASK.md)）と ④ 化石（[`../fossils/CODEX_TASK.md`](../fossils/CODEX_TASK.md)）の PR 1（データと 絵）が 入って いること。魚の 絵は `FishArt`、骨の 絵は `FossilArt` を つかう。

## 0. この フォルダに ある もの

| ファイル | 中身 | つかいかた |
| --- | --- | --- |
| `museum-data.js` | データ（`const MUSEUM_DATA = {...}`: マスの 文字・2つの 館の 地図・へや・展示・人・町に たてる 場所・出入り口・説明・ことば・BGM）。**自動生成** | そのまま `game/js/museum-data.js` に コピー。手で 直さない |
| `museum.json` | 上と 同じ 中身（読みやすい 形） | 確認用 |
| `MUSEUM_LIST.md` | 館ごとの 町の 場所・順路・へやの 案内・展示の 一覧・地図の 文字・説明・出典 | 文と 配置の 確認 |
| `img/aquarium-plan.png` / `img/museum-plan.png` | 館の 全体図（寄贈が ぜんぶ そろった ところ・へやの 名前つき） | 配置と 絵の 正解 |
| `img/phones.png` | スマホの 画面 ①〜⑩（館内 5・寄贈 3・展示の 説明 2） | 見た目の 正解 |
| `img/small-phone.png` | 375×667 の 寄贈の 画面 | 見た目の 正解 |
| `img/outside.png` | 町に たてた ところ（ゲームの 町に さしこんで 撮影） | 外がわの 正解 |
| `../../../../tools/feature-design/museum-art-ref.js` | `MuseumArtRef.prop(kind, o)`（展示）・`facade(sp)`（建物の 外がわ）・`signIcon`（かんばん） | `js/museum-art.js` に 移植（ゲームでの 名前は `MuseumArt`） |
| `../../../../tools/feature-design/museum-render.mjs` | 見本の 描きかた（床の もよう `floorTile`・かべ `wallSprite`・y順） | 床と かべの 絵の 正解（`tiles.js` に 移す） |
| `../../../../tools/feature-design/museum-ui.css` | 寄贈の 画面・かんせい・展示の 説明の CSS（`dn-*`・`ex-*`） | `css/style.css` の さいごに 足す |
| `../../../../tools/feature-design/museum-data.mjs` | 元データ（へや・展示・人・ことば・BGM） | 直すときは ここを 直して `npm run design:features` |

## 1. 受け入れ条件

- [ ] あおぞらポート（`harbor`）の (14, 1) に「ぽかぽか すいぞくかん」、きらめきシティ（`city`）の (28, 9) に「きょうりゅう はくぶつかん」（どちらも 7×4 マス）。外がわは `facade`（ガラスの ドーム／はしらと ブラキオサウルスの 像）。`img/outside.png` の とおり。
- [ ] 入口に 入ると 館の マップ（`MAP_DEFS.aquarium` / `MAP_DEFS.museum`）へ。**3にん いっしょに** 歩いて まわれる。出入り口（2か所）から 出ると 町の 入口の まえに もどる。
- [ ] 順路が ある: 水族館は「アクアトンネル → エスカレーターで 上へ → やまの さわ → さとの かわ → いけと たんぼ → 大水槽の まわりを ぐるっと → いその ひろば → よるの うみ・しんかい → おみやげ」、博物館は「エスカレーターで 下へ → かせきの みち → きょうりゅうの せかい（ホール）→ けんきゅうしつ → たまごの へや → おみやげ」。床の 矢印と 案内板つき。へやに はじめて 入ると 案内（`intro`）が 出る。
- [ ] 水族館の かんちょう（マリン）に 話すと 寄贈: いけす（`Save.d.fish.keep`）の 魚から えらぶ → いけすから 1ぴき へる → その 魚の 水そうに 入る（1しゅ 1回）。
- [ ] 博物館の はかせ（ドン）に 話すと 寄贈: もって いる 骨（`Save.d.fossil.bones`）から えらぶ → 1こ へる → 台の 骨格に 入る。その 恐竜の 骨が ぜんぶ そろうと「かんせい！」。
- [ ] **寄贈した 魚だけが 水そうで およぐ**（寄贈 0 の 水そうは 水と かざりだけ）。骨格は、寄贈した 骨は 骨の 色、たりない 骨は 点線の かげ、台に「あと n」。
- [ ] 展示を しらべると 説明: 水そう → 中の 魚（まだの 魚は「？？？」）→ 魚を おすと ③ の ずかん。骨格 → ④ の 骨格の 説明。かざり（化石の かべ・くらげ・トンネル・たまご・恐竜の とう・けんきゅうしつ）→ `info` の 説明。
- [ ] 50しゅ ぜんぶ／10しゅ ぜんぶ そろうと かんちょう・はかせが おいわい（`talk.all`）。
- [ ] 館の 中は 敵が 出ない・館ごとの BGM（`songs.aquarium` / `songs.museum`）。
- [ ] 390×844・375×667 で はみ出さない。ボタンは 44px いじょう。

## 2. データの 形（`MUSEUM_DATA`）

```js
{ version: 1,
  tiles: { X: { name, ground: "museum_wall", solid: true, color }, E: { ground: "museum_mat" }, 0: { ground: "museum_tile" }, ... },
  buildings: {
    aquarium: {
      name, W: 36, H: 39, rows: ["XXXX…", ...],            // 1文字 = 1マス（tiles の 文字だけ）
      rooms: [{ id, name, x, y, w, h, intro }],             // 案内の はんい
      objects: [{ id, kind, x, y, w, h, label?, fish?: [魚 id], dino?, theme?, depth?, walk?, info?, fossil?, boneOf?, text?, col?, dir? }],
      npcs: [{ id, talk, name, sp, outfit, x, y, role: "donate" }],
      exits: [{ x, y, w, to, role: "in" | "out" }], route: [へやの id],
      outside: { map: "harbor", id: "harbor_aquarium", x: 14, y: 1, w: 7, h: 4, label, roof, facility: "aquarium", door: 3, doorAt: [17, 4], front: [17, 5] },
      arrive: { x: 4, y: 37, dir: "up" },                   // 館に 入った ときに 立つ マス
      warps: [{ x, y, w, h: 1, to: "harbor", tx: 17, ty: 5, dir: "down" }, ...] },
    museum: { ... } },
  info: { ammonite: { name, text }, ... },                  // かざりの 説明
  talk: { aq_curator: { first, ask, thanks, none, all, lines }, mu_doctor: { ..., done } },
  songs: { aquarium: { bpm, tracks }, museum: { bpm, tracks } } }  // sound.js の SONGS と 同じ 形
```

- 水族館の 展示 15（魚 50しゅが どこかに 1回ずつ）、博物館の 骨格の 台 10（恐竜 10しゅが 1回ずつ）。`build-museum.mjs` が たしかめて いる。
- `walk: true` の 展示（トンネル・エスカレーター・矢印）は 床の 上の 絵で、上を 歩ける。それ いがいの 展示は 通れない。

## 3. 町に たてる・館の マップ

**町の 建物**（`town-design.js` の `port`（harbor）と `patch("city", …)` の 中）:

```js
house(port.g, port.d, "harbor_aquarium", 14, 1, 7, 4, "ぽかぽか すいぞくかん", "#7EC8E0", { type: "indoor", map: "aquarium" }, { facility: "aquarium", sign: "aquarium" });
house(g, d, "city_museum", 28, 9, 7, 4, "きょうりゅう はくぶつかん", "#D9B47A", { type: "indoor", map: "museum" }, { facility: "museum", sign: "museum" });  // patch("city", (g, d) => { … }) の 中
```

- 場所は `MUSEUM_DATA.buildings.<館>.outside` の とおり（あいた 地面で、たてた あとも 町の 入口から ほかの ドア・ワープ・人・宝箱に 行ける ことを `build-museum.mjs` が ゲームの 地図で たしかめた）。
- 外がわの 絵: `WorldArt.building` を つつむ（`world-art.js` の `tower` と 同じ やりかた）。`sp.facility` が ある ときだけ `MuseumArt.facade(sp)`。かんばんは `SIGN_ICON.aquarium` / `SIGN_ICON.museum` に `MuseumArt.signIcon.*` を 入れる。
- `scene-world.js` の `enterDoor`: `act.type === "indoor"` → `Game.goto("world", { map: act.map, x: arrive.x, y: arrive.y, dir: "up" }, "circle")`（`Sound.se("door")`）。

**館の マップ**（`js/museum.js`。`museum-data.js`・`museum-art.js` の あと、`scene-world.js` より まえ）:

```js
for (const [id, b] of Object.entries(MUSEUM_DATA.buildings)) MAP_DEFS[id] = {
  name: b.name, bgm: id, baseGround: "museum_tile", indoor: true, rows: b.rows,
  buildings: [], signs: [], chests: [], spawns: [], warps: b.warps, npcs: b.npcs.map((n) => ({ ...n })),
  objects: b.objects.map((o) => ({ ...o, kind: "exhibit", ex: o.kind, w: o.w || 1, h: o.h || 1, solid: !o.walk })),
};
```

- `tiles.js`: `GROUND` に `tiles` の `ground` を 足し、`X` を `SOLID_CH` に 足す（ほかの 文字は 通れる）。`drawGround` に 床の 絵（色と もようは `museum-render.mjs` の `floorTile` と 同じ）。かべ `X` は 高さの ある かべ（`wallSprite` と 同じ: 上の 面 `#5E5868`、床に めんした 前の 面 `#9A94A6`）。
- 館の 中は 天気・季節の 色を つけない（`SeasonPalette` を 通さない）。HUD の 場所の 名前は 館の 名前。
- いまの `npm run check` の マップ検査（ワープ・人・`text` の ある もの に 行けるか）が 館にも はたらく。館の 人の `talk` は `TALKS` に 足す（5）。

## 4. 展示の 描きかた

- 展示は `objects` の `kind: "exhibit"`。`spriteCanvas` で `this.objCanvas("exhibit", { id: o.id, bits }, ensure)`、`WorldArt.exhibit = (opt) => Museum.prop(opt.id, opt.bits)`。`bits` は 寄贈の ようすの 文字（有限）:
  - 水そう（`walltank` / `islandtank` / `bigtank` / `lowtank`）: `fish` の じゅんに 寄贈ずみ `1`・まだ `0`（例 `"1101000"`）。
  - 骨格の 台（`stand`）: その 恐竜の `art.parts` の じゅんに `1` / `0`。`MuseumArt.prop("stand", { ...o, dino, have, left })`（`have` = 寄贈した 部品 id、`left` = たりない 数）。
  - `pedestal`（シーラカンス）は `"1"` / `"0"`。かざりは `bits` なし。
- **魚を およがせる**: 水そうは `MuseumArt.prop(kind, { ...o, fish, swim: true })` で「魚の ない 水そう」を キャッシュし、`{ water: [x, y, w, h], slots: [{ id, x, y, w, h, flip }] }` の 位置に 魚を 毎フレーム 描く。
  - 魚の 絵は `FishArt.svg(art)` を キー `"mfish:" + id + ":" + Math.round(slot.w)` で（有限）。
  - うごき: `x = slot.x + Math.sin(G.t * sp + i) * Math.min(10, (water[2] - slot.w) / 4)`、`sp` は 0.6〜1.0（魚 id から きめる）。向きは うごく 向き。上下に ±1.5px ゆらす。`water` の 四角で `clip` する。
  - 大水槽（`bigtank`）の 上の 水めんの 大きな 魚の かげ（`big`）は 絵に 入った まま で よい。
- `walk: true` の 展示は 床の 上に 描く（y順の スプライトより まえ）。エスカレーターだけは y順（手すりが 3にんの 足もとに かかる）。
- 寄贈した あとは、その 展示の 新しい キーを `SvgCache.ensure` してから 描きかえる（いっしゅん 消えない ように）。

## 5. 館の 人と 寄贈

`TALKS.aq_curator = { first: [talk.first], lines: talk.lines.map((t) => [t]) }`（`mu_doctor` も 同じ）。`Talk.run` の さいしょで `if (n.role === "donate") return Museum.talk(n, scene);`。

```text
Museum.talk(n):
1. はじめて → talk.first（Save.d.flags.talked に つける）
2. 50しゅ／10しゅ ぜんぶ → talk.all（はじめての ときだけ トースト「ぜんぶ そろった！」と Sound.se("fanfare")）→ lines から 1つ
3. 寄贈できる ものが ない → talk.none ＋ lines から 1つ
4. ある → talk.ask → 寄贈の 画面（UI.modal）
     水族館（img/phones.png ⑥）: いけすの 魚を dn-grid に。まだ 寄贈して いない 魚に「はじめて！」、寄贈ずみは「きふずみ」（えらべない）
     博物館（⑦）: もって いて まだ 寄贈して いない 骨を dn-list に。恐竜ごとの あつまりぐあい（寄贈ずみ／ぜんぶ）
   えらぶ → 下の「〇〇を きふする」→ へらす（fish.keep −1 ／ fossil.bones −1）→ museum に 日づけ → Sound.se("sparkle") → talk.thanks
   骨が そろったら かんせいの 画面（⑧ dn-done）＋ talk.done（{dino} を 恐竜の 名前に）→ Sound.se("fanfare")
   つづけて えらべる（とじるまで）。ぜんぶ おわったら 4 の 画面を とじて 館に もどる
```

- 寄贈の 画面の ことばは `talk` と 見本の とおり（ひらがな・文節ごとに スペース）。
- 寄贈は 1しゅ（1部品）1回。2ひき目・2こ目は 寄贈できない（② の 物々交換や ③ の「うる」に つかう）。

## 6. 館を 歩く・しらべる

- へやに 入った とき（先頭の 子の マスが `rooms` の はんいに 入った とき）、はじめてなら トースト（`name` ＋ `intro`・`img/phones.png` の ②④）。`Save.d.museum.rooms[館 + "." + へや] = true`。
- 展示を しらべる: `interactFront` の `WorldScenery.at` より まえで `Museum.at(map, x, y)`（`walk` で ない 展示の はんい）→ `Museum.show(o)`:
  - 水そう → ⑨（`ex-card`・`ex-list`）。魚の ボタン → ③ の ずかんの くわしい 画面（まだ 寄贈して いない 魚は「？？？」で おせない）。
  - 骨格の 台 → ④ の かせき ノートの くわしい 画面と 同じ（`FossilArt.svg(dino, { have })`・時代・場所・大きさ・まめちしき）。
  - かざり → ⑩（`ex-card rock`）＋ `MUSEUM_DATA.info[o.info]`。
- BGM: `Object.assign(SONGS, MUSEUM_DATA.songs)`（`sound.js` の あと）。マップの `bgm` が `"aquarium"` / `"museum"`。
- 3にんは いつも いっしょ（町と 同じ ついて くる 動き）。

## 7. セーブ（`Save.fresh()` に 足すだけ。`SCHEMA` は そのまま）

```js
museum: { fish: {}, bones: {}, done: {}, rooms: {}, all: {} },
// fish:  { ayu: "2026-9-27" }        寄贈した 魚と 日づけ
// bones: { "trex.skull": "2026-9-27" } 寄贈した 骨
// done:  { trex: "2026-9-27" }        骨格が そろった 日
// rooms: { "aquarium.river": true }   入った へや（案内を 1回だけ 出す）
// all:   { aquarium: true }           ぜんぶ そろった おいわいを 見た
```

## 8. ほかの 機能との つなぎ

- ② 町の人: `x:aquarium` / `x:museum` の セリフ・おねがいは `MAP_DEFS.aquarium` / `MAP_DEFS.museum` が ある とき（`TownFolkRef.features()`）。寄贈したら `TownFolk.signal({ do: "donate", fish: id })` / `{ do: "donate", bone: key }`。
- ③ 釣り: 寄贈は `Save.d.fish.keep` から へらす。ずかんの くわしい 画面に「すいぞくかんに いるよ」の しるし（`museum.fish[id]`）。
- ④ 化石: かせき ノートと みつけた カードの あつまりぐあいは「もって いる」＋「寄贈した」を あわせて 数える（寄贈しても へらない）。② の 物々交換で わたせるのは 寄贈して いない ぶんだけ。

## 9. テストの 入口（`PokaDebug`）

- `museumGo(id = "aquarium", room)` … その 館（の へや の まんなか）へ。
- `museumGive(kind, key)` … 寄贈した ことに する（`kind` は `"fish"` / `"bone"`、`key` は 魚 id か `"trex.skull"`。`"all"` で ぜんぶ）。
- `museumDonate()` … 館の 人の となりへ 行って 寄贈の 画面を ひらく。`museumPick(key)` … えらぶ。`museumConfirm()` … きふする。
- `museumShow(objId)` … 展示の 説明を ひらく。
- `museumState()` … `{ fish: 数, bones: 数, done: [恐竜 id], rooms: [...] }`。

## 10. テスト

- `tools/check.mjs`: `MUSEUM_DATA` の 検査（`build-museum.mjs` と 同じ）。魚 50・恐竜 10 が 1回ずつ・展示が 床の 中で 重ならない・どの 展示にも 近づける・入口から ぜんぶの へやに 行ける・マスの 文字が ほかと ぶつからない・人の 服と `TALKS`・ことばの 長さ・BGM の 音。町に 建物を 足した あとの 到達性は いまの マップ検査が みる。
- スモーク「水族館と 博物館」（390×844・375×667）:
  1. `fishGive("ayu")` → `teleport("harbor", 17, 6, "up")` → 入口へ 歩く → `aquarium` に 入る。
  2. `museumDonate()` → `museumPick("ayu")` → `museumConfirm()` → `Save.d.museum.fish.ayu` が ある・`Save.d.fish.keep.ayu` が へった。
  3. `museumShow("aq_flow")` → `.ex-card` に「アユ」。
  4. `fossilGive("compso.head")`・`fossilGive("compso.body")` → `museumGo("museum")` → 2つ 寄贈 → `.dn-done` → `Save.d.museum.done.compso`。
  5. 出口から 出ると `city` の (31, 13)。はみ出しなし・スクリーンショット。

## 11. PR の 分けかた

1. **町の 建物と 館の 中**: `js/museum-data.js`・`js/museum-art.js`・`js/museum.js`（index.html と sw.js の 両方）、外がわ・かんばん・`indoor` の ドア・床と かべ・展示（寄贈 0 の すがた）・順路の 矢印・案内・BGM・`museumGo`・スモーク（入って 出る）。
2. **寄贈**: `Save.museum`・館の 人・寄贈の 画面・かんせい・展示に 反映（魚が およぐ・骨格）・PokaDebug・スモーク。
3. **しらべる と つなぎ**: 展示の 説明・③ の ずかん・④ の ノート・② の `signal`。

それぞれ `CHANGELOG.md` の `2.0.0-dev` に 1行、`docs/ROADMAP_V2.md` の M8 に ✅。

## 12. やらないこと

- 入館料・課金・時間せいげん。魚を 食べる・かわいそうな 表現（水そうは いつも きれいで、魚は げんきに およぐ）。
- 寄贈で 魚や 骨が「きえて しまう」と かんじさせる 言いかた（ずかん・ノートには のこる。「すいそうで げんきに して いるよ」）。
- 実在の 館の 名前・ロゴ・展示の 写真を つかう（順路の 考えかただけ 参考に した。`MUSEUM_LIST.md` の 出典）。
- `js/museum-data.js` を 手で 直す。セーブの キーを かえる。
