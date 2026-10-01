# AGENTS.md — ぽかぽかタウン 開発ルール（AI エージェント・開発者向け）

このリポジトリで作業する AI エージェント（ChatGPT / Codex など）と人間の開発者は、作業の前にこのファイルを読むこと。
詳しい設計は [`game/docs/ARCHITECTURE.md`](game/docs/ARCHITECTURE.md)、ver2 でやることは [`game/docs/ROADMAP_V2.md`](game/docs/ROADMAP_V2.md) にある。

## 1. プロジェクトの概要

- `game/` にあるのが、スマホ向けブラウザゲーム「ぽかぽかタウン」。**ver1（v1.0.0）は完成済み**で、いまは **ver2 を開発中**。
- 主人公は わんこ・がちゃん・ごじ の3人。**3人はいつも一緒に行動する**（町・おうち・お店・バトル）。これはゲームの核なので崩さない。
- 遊びの柱: おうちでの ほのぼの育成 ／ 着せ替え（服・部屋） ／ お店のおてつだいミニゲーム（たまごっちの「プチプチおみせっち」風）でコインをためる ／ 上から見下ろす町と外の世界の探検 ／ ターン制バトル。
- 公開先は GitHub Pages（main ブランチのルート）: https://s17324487-arch.github.io/simple-todo-app/game/
  **main にマージしたものが そのまま公開される**（1〜2分で反映）。
- リポジトリ直下の `index.html` / `script.js` / `style.css` / `firebase-config.js` は**別の ToDo アプリ**。触らない。
- ver1 の状態は git タグ `v1.0.0`（GitHub の Releases ページ）に保存してある。

## 2. コマンド（すべて `game/` フォルダで実行）

| 目的 | コマンド | かかる時間 |
| --- | --- | --- |
| 初回の準備 | `npm ci` → `npx playwright install --with-deps chromium` | 1〜3分 |
| 静的チェック（ブラウザ不要） | `npm run check` | 数秒 |
| 自動テスト（静的チェック＋ブラウザで実際に遊ぶスモークテスト） | `npm test` | 約1分 |
| 全部のテスト＋スクリーンショット（`tests/screenshots/`） | `npm run test:full` | 約5分 |
| 手元で遊ぶ | `npm start` → http://localhost:8080/ | — |
| 素材プレビュー（服・NPC・敵・家具を一覧表示） | `npm start` → http://localhost:8080/tools/preview.html | — |
| キャラ素材 SVG から `js/chara-data.js` を作り直す | `npm run build:chara` | 数秒 |
| 町の検査（小物の密度・何もない場所・道のつながり など） | `npm run audit:town`（`-- --check heiwadai` で めやす未満なら失敗） | 数秒 |
| 町のデザイン見本を作り直す（`docs/design/towns/heiwadai/`） | `npm run design:heiwadai`（日本語フォントが必要） | 約20秒 |
| 機能の見本 ①〜⑥ を作り直す（`docs/design/features/`） | `npm run design:features`（画像なしは `-- --no-mock`） | 約3分 |

- すでに Chromium がある環境では `CHROMIUM_PATH=/path/to/chromium npm test` でも動く。
- ブラウザが使えない環境では、最低限 `npm run check` を通し、そのことを PR に書く。
- テストはネットにつながっていなくても動く（Google Fonts が読めないエラーは無視している）。

## 3. 技術の前提（変えない）

- **ビルドなし・実行時の依存なしの素の JavaScript**。`game/index.html` が `<script src>` の classic script を決まった順に読む。
  - ES modules（`import`/`export`）、バンドラ、TypeScript、React などのフレームワーク、CDN のスクリプト、npm の実行時依存を入れない。
    `file://` で直接開いても、GitHub Pages でも、そのまま動くことが要件。
  - npm パッケージはテスト用の `playwright`（devDependencies）だけ。`tools/` と `tests/` の Node スクリプト（`.mjs`）は ES modules でよい。
- **全スクリプトがグローバルスコープを共有する**。
  - トップレベルの名前が重複すると、ゲーム全体が起動しなくなる。新しいトップレベル名は長めで固有にする（`npm run check` が重複を検出する）。
    すでに使っている名前の一覧は ARCHITECTURE.md の「グローバル名」にある。
  - トップレベルの `const`/`let`/`class` は `window` のプロパティにならない。`window.G` ではなく `G`、有無の確認は `typeof G !== "undefined"` と書く。
- 描画は Canvas 2D（論理座標、横幅およそ 360）＋ DOM の UI（会話・メニュー・モーダル）。
  キャラ・服・敵・家具・アイコンは SVG 文字列を組み立て、`SvgCache` で canvas にラスタライズして描く。
- 音は WebAudio でその場で合成する（音声ファイルはない）。
- セーブはブラウザの localStorage（キー `pokapoka-town-save-v1`）。

## 4. 必ず守るルール

1. **新しい js ファイル**を足したら、`game/index.html` の `<script>` と `game/sw.js` の `FILES` の**両方**に登録する。
   読み込み順に意味がある（`version.js` が最初、`debug.js` が最後。使う側より先に定義する側を読む）。
2. **`js/chara-data.js` は自動生成**。手で直さない。キャラ素材（`assets/chara/`）を変えたら `npm run build:chara`。
3. **セーブの互換性**（プレイヤーのデータを消さない）:
   - `Save.KEY` は絶対に変えない。
   - 新しい項目を足すだけなら `Save.fresh()` に足せばよい（古いセーブには `Save.migrate()` が自動で補う）。
   - 既存の項目の意味や形を変えるときは、`Save.SCHEMA` を +1 し、`migrate()` に `if (d.v < 新しい番号) { 変換 }` を1段足す。
     古いセーブを読んでも壊れないことをテストで確かめる。
   - 項目の削除・名前の変更は原則しない（どうしても必要なら migrate で移しかえる）。
4. **バージョン**は `js/version.js` の `GAME_VERSION`・`package.json` の `version`・`CHANGELOG.md` のいちばん上の版の3か所をそろえる（`npm run check` が確認する）。
   - ver2 の開発中は `2.0.0-dev`。ver2 の最初の PR で 1.0.0 → 2.0.0-dev に変え、`CHANGELOG.md` の先頭に `## [2.0.0-dev] - 開発中` の節を作る。
   - PR ごとに、その節へ変更点を1〜数行ずつ追記する（番号は上げない）。
   - ver2 を完成させるとき（オーナーが「リリースして」と言ったとき）に `2.0.0` にして日付を書く。
     その PR が main にマージされると、GitHub Actions の `release` が タグ `v2.0.0` と Releases のページを自動で作る（タグを自分で push しなくてよい）。
     その後は 修正=2.0.1、機能追加=2.1.0 のように上げる。
5. **画面の文言**:
   - 小さな子どもにも読める、ひらがな中心の やさしい言葉にする。文節ごとに半角スペースを入れる
     （例:「おみせで おてつだいすると コインが もらえるよ。」）。漢字・カタカナ語は最小限。
   - スマホの縦画面が基準。**390×844 と 375×667 で、はみ出し・重なり・読めない文字がない**こと。指で押すところは 44px 以上を目安。
6. **絵のルール**（素材の画風に合わせる）:
   - 線の色は `INK`（`#1F1D1B`）。キャラの座標系（viewBox 220 幅）で線幅 4.5、`stroke-linecap`/`stroke-linejoin` は `round`。塗りはパステル調。
   - SVG の中の id（`clipPath`・`linearGradient` など）は必ず一意にする（キャラなら `ctx.uid` を付ける）。同じ id が重なると別の絵が欠ける。
   - 新しい絵は `tools/preview.html` で3人×向きの見た目を確認する。
7. **`SvgCache` のキーは有限個にする**（乱数・時刻・座標をキーに入れない）。キャッシュがふくらみ続けて重くなる。
8. **テストは `PokaDebug`（`js/debug.js`）を通して操作する**。ゲーム内部の変数を直接いじるテストを書かない。
   - PokaDebug の関数名・引数は「約束」。変えたら `tests/smoke.mjs` と docs も直す。
   - 新しいシーンやミニゲームを足したら、PokaDebug に入口（例: `shop('newshop', 3)`）と状態の取得を足し、スモークテストのシナリオを1つ足す。
9. **ゲームの雰囲気を守る**: ほのぼの・こわくない・かなしすぎない。バトルはコミカルに。3人のうち誰かを置いていく仕様にしない。
   （例外: ⑥ 射撃場だけは オーナーの 指示で この 9 を はずし、実際の エアソフトガンと 射撃競技に ちかくする。くわしくは [`game/docs/design/features/range/CODEX_TASK.md`](game/docs/design/features/range/CODEX_TASK.md)。3人が いっしょ・競技の 的だけ・じゅうは 射撃場の 中だけ は かわらない）
10. **外部への通信・課金・広告・個人情報の収集を入れない**（外部通信は Google Fonts だけ）。API キーや秘密の値をコミットしない。

## 5. 作業の進め方

- **1つの PR = 1つの機能 または 1つの修正**。main にマージすると すぐ公開されるので、小さく・動く状態で出す。
- 着手前に `game/docs/ROADMAP_V2.md` の該当項目と「受け入れ条件」を読む。終わったら その項目に ✅ を付ける。
- 迷ったら、既存のコードの書き方（名前の付け方・コメントの量・ひらがなの文言）に合わせる。
- 大きな作り直し（ファイル構成の変更・描画方式の変更・全面的なリファクタ）は、先に提案してオーナーの了解をもらう。
- **いまの 分担（2026-09-28〜）**: Codex は エリア（マップ・町の 配置・道・建物の 場所）。Claude Code は 絵と アイテム（水の 絵 `js/water-art.js`・町の人の 見た目・家具の 絵と さわる 機能・ぱぱ ままの おしごとと おるすばん・音楽プレイヤーと ディスク）と、サンシャインいけぶ の 中（`js/ike-mall.js`・12F／13F の すいぞくかん `js/ike-aquarium.js` など。2026-09-29 から）と、はたけ（`js/farm-art.js`・`js/farm.js`・`js/farm-cook.js`。2026-09-30 から）。一覧は `game/docs/ROADMAP_V2.md` の M9。あいての 担当の ファイルを 大きく かえる ときは、先に あいて いる PR を 見て ぶつからない ように する。

### 完了の条件（Definition of Done）

- [ ] `npm run check` が ✓
- [ ] `npm test` が ✓（ブラウザが使えない環境では、その旨を PR に書く）
- [ ] 新しい機能には、スモークテストのシナリオ か `tools/check.mjs` の検査を足した
- [ ] スマホ縦画面（390×844・375×667）で見た目を確認した（`npm run test:full` のスクリーンショット、または preview.html）
- [ ] `CHANGELOG.md` に追記した
- [ ] セーブの形式を変えたなら `Save.SCHEMA` と `migrate()` を更新した
- [ ] PR の説明に「何を・なぜ・どう確かめたか」を書き、見た目が変わるならスクリーンショットを付けた

## 6. ファイルの地図（`game/`）

| ファイル | 中身 |
| --- | --- |
| `index.html` | 起動ページ。js の読み込み順はここで決まる |
| `sw.js` / `manifest.webmanifest` / `icons/` | PWA（オフライン・ホーム画面に追加）。キャッシュ名は GAME_VERSION と連動 |
| `css/style.css` | DOM の UI（会話・メニュー・モーダル・HUD）の見た目 |
| `js/version.js` | `GAME_VERSION`（バージョンの唯一の置き場所） |
| `js/chara-data.js` | **自動生成**。キャラ素材 SVG の構造データ |
| `js/util.js` | `U`（小物関数）、`SvgCache` |
| `js/data.js` | 服・食べ物・どうぐ・家具・壁紙・床・敵・出現エリア・とくぎ・お店のデータ |
| `js/chara.js` | キャラの合成（ポーズ×向き×表情×服）。服の描き方 `WEAR.*` |
| `js/art.js` | 町の人（どうぶつ）・敵・家具・アイコンの絵 |
| `js/tiles.js` | 地面タイル・木・建物などの絵 |
| `js/parent-work.js` | ぱぱ・ままの おしごと（ほんとうの 時こくで 9〜18じは いない）と 3人の おるすばん（ことば・しぐさ）・いってきます／ただいま |
| `js/home-doors.js` | おうちの ドア（`HomeDoors`）: ドアを タップすると 3人で ドアまで あるいて べつの おへや（「おへや」）・まち（「おでかけ」）・おにわの うらぐちから おうちへ。ドアの うえの ふだ |
| `js/home-floors.js` | おうちの 2かい（`HomeFloors`）: 3000 コインの へや `upstairs`・いつもの おへやの ひだりの かべの 木の かいだんと かべの うえの おどりば・1かいの みぎ うえ（おくの ながい かべの うえ）に いっしょに 見える 2かい（いない かいは かぐごと 1まいの 絵）・かいだんを のぼる／おりる |
| `js/music-discs.js` | レアの 音楽プレイヤー 3しゅ（ラジカセ・ちくおんき・ジュークボックス）と ディスク 25まい（おてつだい・たからばこで 手に入る・へやで きける）。ディスクだけの きょくは パブリックドメインの 名曲 4つ（出典つき）と、この ゲームの ために つくった ぽかぽかの きょく 3つ |
| `js/food-art.js` | 食べ物の 絵の なおし（名前と 絵を そろえる 20しゅ。`FOOD_ART` を 上がき） |
| `js/fishing.js` / `js/fishing-line.js` | 釣り: 魚の えらびかた・ずかん・つりざお・スーパーで うる（`Fishing`）と、見おろしの まま つる ながれ（`FishLine`: 魚の かげ・ながおしで なげる・うき・じまんの ズーム・こうかおん） |
| `js/smaho.js` | すまほ（`Smaho`）。ひだり したの ボタンで ひらく スマホの 画面。ちず・ようす・もちもの・ずかん・イベント・スタンプラリー・ひんと・うらない・ごほうび・おんがく・しゃしん の アプリ。≡ は せってい・あそびかた だけ |
| `js/area-map-art.js` / `js/area-map.js` | すまほの「ちず」の「この エリア」。いまの 町・フィールドの ポンチ絵ふうの ちず（道・水・こうえん・たてものの いろわけと めじるし 60しゅ・なまえ・でぐちの いきさき・いま ここ・タップで せつめい・いちらん・2ばい）。`MAP_DEFS` から つくる（`AreaMapArt`・`AreaMap`）。「せかい ちず」は `js/world-atlas.js` |
| `js/furniture-live.js` | さわれる 家具（ライト・テレビ・ピアノ・とけい・魚・だんろ・きしゃ など 16しゅ。うごく ぶぶんを canvas に 描く） |
| `js/furniture-models.js` | 家具の 立体モデル（まるい ラグ・天がいの ベッド・キッチン・ピアノ など 24しゅ。床の 大きさは かえない） |
| `js/water-art.js` | 水の 絵（川・海・湖。なめらかな 岸・ふかさ・ながれ・波。マスの 形は かえない） |
| `js/npc-art.js` / `js/npc-cast.js` | 町の人の 絵（35しゅ・顔の ぶひん・もよう）と、1人ずつの 見た目・名前（おなじ 人は いない）・お店の お客さん 60人 |
| `js/iso-venue.js` / `js/mall-art.js` / `js/ike-mall.js` | サンシャインいけぶ（池袋の モール）を おうちと おなじ 斜め上から 見る 館に。投影・奥行き・タップ（`IsoVenue`・`IsoVenueScene`）・内装の 絵と 買い物の 人（`MallArt`）・1F〜3F の 配置と フロアマップ（`IkeMall`・`MallGuide`） |
| `js/ike-wear.js` / `js/mall-music.js` | サンシャインいけぶの 服 9ちゃくの 絵（そで・うしろ すがた・よこむき。`IkeWear`）と 店に かざる マネキン（`WearMannequin`）、フロアごとの 店内 BGM（パブリックドメインの 名曲 3きょく・出典つき。`MallMusic`） |
| `js/aqua-art.js` / `js/ike-aquarium.js` | サンシャインいけぶ 12F・13F の すいぞくかん（みなとから おひっこし）。かべの 水そう・トンネル・そらの テラスの 絵（`AquaArt`）と、ぐるっと 一周 できる 順路・へやの 案内・きふ（`IkeAquarium`） |
| `js/arcade-prizes.js` / `js/crane-physics.js` / `js/crane-art.js` / `js/snack-art.js` / `js/bridge-prizes.js` / `js/crane-machines.js` / `js/crane-scene.js` | クレーンゲーム（池袋 Meeときょれじゃ の 19台。1F 12台・2F の おかし キャッチャー 5台・はしわたし 2台〔1F の 7台と 2F の 7台は けいひんが 日がわり `CraneMachines.lineup`。トライポッドと はしわたしは とれるまで そのまま `keepDay`〕。台 3 は コイン プッシャー `PusherRig`）。おかしの けいひん 23しゅ（たべもの。ふくろ・はこの 絵 `SnackArt`）。はしわたしの けいひん 14しゅ（フィギュア 6・ざっか 8。家具・まどつきの はこの 絵 `BridgePrizes`）。景品の ぬいぐるみ 54しゅ（3人の 表情・ポーズ・こもの ちがい 24・ミニマスコット 10・ビッグ／どうぶつえん／みずべの なかま 20）と コインの 上限（`ArcadePrizes`）・物理（`CranePhys`）・景品と 台の 絵（`CraneArt`）・12台の しかけと 1かいの あそび（`CraneMachines`・`CraneRound`）・画面と 100コイン・ごほうび・つづきから（`SCENES.prize`・`PrizeArcade`） |
| `js/korokoro-physics.js` / `js/korokoro-art.js` / `js/mg-korokoro.js` / `js/korokoro-score.js` / `js/korokoro-prizes.js` / `js/korokoro-town.js` | ころころ フルーツ（ネリカスタウンの パズルの おてつだい。スイカゲームの ような おちもの パズル。だんは さくらんぼ → いちご → みかん → りんご → なし → がちゃん → わんこ → ごじ）。玉の 物理・がったい・あふれ（`KorokoroWorld`）・くだもの と 3人の かおの 玉の 絵（`KorokoroArt`）・はこと ちゅうもん モード（`KorokoroBoard`・`KorokoroTask`）・本物の スイカゲームと おなじ きまりの スコア モード（`KorokoroScore`・`SCENES.koroscore`。ハイスコアと ランキングは `shops.korokoro.hi`・`tops`）・ハイスコアの ごほうびの フルーツの とくべつな かぐ 6つ（`KOROKORO_PRIZES`・`KorokoroPrizes`。立体モデルと さわる うごき）・お店（nerikasu_home5 を かえる `KorokoroTown`。建物の 原画は `tools/town-design/nerikasu-buildings.mjs`） |
| `js/farm-art.js` / `js/farm.js` / `js/farm-cook.js` | はたけ（ネリカスタウンの おうちの ひだり・まえの やおや の ところ）。さくもつ 13しゅの 5だんかいの 絵・つち・どうぐ・あたらしい 食べ物の 絵（`FarmArt`）と、たねまき・みずやり・ほんとうの じかんで そだつ・あめ・ひりょう・しゅうかく・町の はたけ 6まい・はたけの がめん（`Farm`・`FARM_CROPS`・`SCENES.farm`）と、とれた やさいで つくる りょうり 10しゅ（おうちの ごはん・はたけの がめんの「りょうり」。`FarmCook`・`FARM_RECIPES`） |
| `js/arcade-art.js` / `js/ike-arcade.js` | Meeときょれじゃ の 館（サンシャインいけぶ と おなじ 斜め上・1F・2F〔おかしの フロア・まんなかに ガチャ コーナー〕・3F〔ぷりくら 3台・おめかし コーナー〕・エスカレーター）。台・ガチャ・ぷりくら・カウンター・フロア あんない・かがみ・ふきぬけの 絵（`ArcadeArt`）と 28×22 マスの 配置・フロアマップ・こうかんの 店（`IkeArcade`） |
| `js/collab-goods.js` / `js/puzzle-collab.js` / `js/korokoro-collab.js` | ごわが × ミニゲームの コラボ グッズ。あそんだ スコアの つみたてで もらえる げんていの 服・家具の しくみ（`CollabGoods`・`Save.d.collab`）と、なかよしパズルの 5しゅ（パーカー・クッション・カチューシャ・テーブル・アーケード。`PuzzleCollab`）・ころころ フルーツの 5しゅ（Tシャツ・ボールプール・いちご ぼうし・はこの ベッド・くっつき ぬいぐるみ。`KorokoroCollab`） |
| `js/arcade-jpop-maoudamashii.js` / `js/arcade-jpop.js` | Meeときょれじゃ の 店内 BGM。魔王魂の 歌もの（J-POP）5きょくの 音符（**自動生成**。`node tools/build-arcade-jpop.mjs <MIDI の フォルダ>`・マテリアル・コモンズ・ブルー）と、ランダムに 1きょくずつ ながす 再生リスト・「♪ 曲の なまえ」・せっていの クレジット（`ArcadeJpop`・`Sound.lists`）。出典は `docs/MUSIC.md` |
| `js/purikura.js` | ぷりくら（Meeときょれじゃ 3F の しゃしんの ブース 3台〔ゆめかわ・がっこう・おでかけ。はいけい 6しゅずつ・わく・ことばが ちがう `BOOTHS`〕・300コイン）。はいけい → 4まい とる（ポーズ・かお・アップ）→ らくがき（ペン・スタンプ・もじ）→ すまほの「しゃしん」アプリで みる・けす・ほぞん（`Purikura`・`PurikuraArt`・`PurikuraScene`）。しゃしんは 絵の データ（`Save.d.photos`） |
| `js/gacha-art.js` / `js/gacha.js` | ガチャガチャ（Meeときょれじゃ 2F の ガチャ コーナーの 6だい・1かい 200コイン）。6シリーズ × 4しゅ（ふつう 3しゅ 30%・レア 1しゅ 10%）・へやに かざる フィギュア 16しゅと ふく 8しゅ・まわす → カプセル → あける 画面（`Gacha`）と フィギュア・ふくの かたち・カプセル・台の 絵（`GachaArt`） |
| `js/ikebukuro-town.js` / `js/ikebukuro-town-art.js` | 池袋の 町（オーナーの 配置イメージどおり: 西に 駅・上に ネリカス電機／Meeときょれじゃ／サンシャインいけぶ・ななめの 東通りと サンシャイン60どおり・下に 緑の大通り）。道・建物・人・小物・地面・電車・夜の あかり（`IkebukuroTown`）と 建物・めじるしの 絵（**自動生成**。原画は `tools/town-design/ikebukuro-buildings.mjs`、`node tools/build-ikebukuro-town.mjs`） |
| `js/nerikasu-layout.js` | ネリカスタウン（オーナーの 配置イメージどおり・78×72）。ななめの 大通り・道・建物 36・公園 2つ・池 3つ（どこでも つれる）・憩いの森・はたけ・住人 34人の 場所（`NerikasuLayout`）。建物の 原画は `tools/town-design/nerikasu-buildings.mjs`（`js/nerikasu-town-art.js` に 生成）。設計は `docs/design/towns/nerikasu/README.md` |
| `js/neri-shops.js` / `js/neri-bikkupo.js` | ネリカスタウンの コンビニ 2つ（ローリソン・せぶんぶん。ちがう 商品・店内の 什器・あたらしい 食べ物 10しゅ `NeriShops`）と ファミレス びっくぽ（斜め上の 館・ボックス席で たべる・ドリンクバー・キッチンで バーガーの おてつだい・はいぜん ロボ `Bikkupo`） |
| `js/neri-gas.js` / `js/neri-post.js` / `js/neri-apart.js` | ネリカスタウンの ガソリンスタンドの おてつだい（ノズルの いろ・ながおしで きゅうゆ・せんしゃ・タイヤ。`GasTask`）・ゆうびんきょくの おてつだい（けしいん・あてさきの はこへ しわける。`PostTask`）・ひだまり アパート（斜め上の 2かいだて。おうちの 家具の 立体・すむ 人・こたつ・ギター・ベランダ。`NeriApart`） |
| `js/neri-quests.js` | ネリカスタウンの いらいの けいじばん（町の いりぐち）。たいじ・おつかい・さがしもの の いらい 24しゅ（まいにち 6まい・3つまで・★で ほうしゅう 400〜2600）。すまほの「いらい」アプリ（`NeriQuests`） |
| `js/maps.js` | マップ（町は ASCII の手描き、外の世界は `FieldGen` で決まった形に生成） |
| `js/save.js` | セーブ（`Save`）、ステータス計算（`Stats`）、お世話（`Care`） |
| `js/sound.js` | 効果音と BGM（WebAudio 合成） |
| `js/ui.js` | 会話・選択肢・入力・モーダル・トースト・HUD（`UI`） |
| `js/main.js` | 起動・画面サイズ・ループ・入力・シーン切り替え（`G`・`Game`・`SCENES`） |
| `js/talk.js` | 町の人の会話（`TALKS`）とアイテムの受け取り（`Loot`） |
| `js/menu.js` / `js/shop.js` / `js/dressup.js` | メニュー（≡ は せってい・あそびかた。ようす・もちもの・ずかん・ちず の 中みは すまほの アプリが よぶ）、買い物のお店、着せ替え画面 |
| `js/scene-title.js` / `scene-world.js` / `scene-house.js` / `scene-battle.js` | タイトル／町・フィールド／おうち／バトル |
| `js/world-zoom.js` | 町・フィールドの ズーム（`WorldZoom`: ピンチ・ひだりの ＋ −・ホイール、0.5〜1.5 倍。ひろく みる ときは 絵を その 大きさで 描きなおす。debug.js の まえ） |
| `js/minigames.js` | お店のおてつだいミニゲーム（`ShopScene`、`TaskBase` と4つのお店） |
| `js/debug.js` | テスト・開発用の `PokaDebug`（ゲーム本編からは使わない） |
| `tools/check.mjs` | 静的チェック（約2400項目: 登録漏れ・名前の重複・データの参照・マップの到達性・SVG・ミニゲームの採点など） |
| `tools/serve.mjs` | 依存なしのローカルサーバー |
| `tools/build-chara.mjs` | 素材 SVG → `js/chara-data.js` |
| `tools/preview.html` | 素材プレビュー（開発用） |
| `tools/town-audit.mjs` | 町の検査（`npm run audit:town`） |
| `tools/build-arcade-jpop.mjs` | MIDI → `js/arcade-jpop-maoudamashii.js`（Meeときょれじゃ の J-POP。MIDI は リポジトリに いれない） |
| `tools/town-design/` | 町のデザイン見本を作る道具（部品の SVG・道の描き方・配置）。**見本の絵の正解はここの SVG** |
| `tools/feature-design/` | 機能の見本 ①〜⑥ を作る道具（セリフ・おねがいの元データ、吹き出し・しくみの見本の実装 `*-ref.js`） |
| `tests/smoke.mjs` | Playwright のスモークテスト（13シナリオ） |
| `assets/chara/` | キャラ素材（SVG マスター）。README.txt に素材の決まりごと |
| `docs/` | 設計書・ロードマップ・引き継ぎ手順 |
| `docs/design/` | デザイン見本（町づくりのきまり `TOWN_GUIDE.md`、町ごとの見本・部品リスト・作業指示、機能ごとの見本 `features/`） |

## 7. よくある作業の入口（詳しくは ARCHITECTURE.md の「追加のしかた」）

- 服を足す → `data.js` の `WEAR_ITEMS` に1行 ＋（新しい形なら）`chara.js` に `WEAR.<名前>` の描画関数
- 家具を足す → `data.js` の `FURNITURE` ＋ `art.js` の `FURN_ART`
- 食べ物・どうぐ → `data.js` の `FOODS` / `TOOLS` ＋ `art.js` の `FOOD_ART`
- 敵を足す → `data.js` の `ENEMIES` と `AREAS` ＋ `art.js` の `ENEMY_ART`
- 町の人・会話 → `maps.js` の `npcs` ＋ `talk.js` の `TALKS`
- すまほに アプリを 足す → `smaho.js` の `APPS` に 1行（`id`・`name` は ひらがな・カタカナ 7もじ まで・`color`・`render(el, ph)`）＋ `ICON[id]` ＋ スモーク「smaho」の `checks`。ゲームの 画面は ≡ ではなく すまほに 足す
- お店のミニゲームを足す → `minigames.js`（`TaskBase` を継承したクラス）＋ `MG_TASKS`・`SHOPS`・`SHOP_OWNERS`・`HOWTO` ＋ `maps.js` の建物 ＋ `Save.fresh().shops` ＋ `PokaDebug.mg()` ＋ スモークテスト
- マップを変える → `maps.js`。`npm run check` が、ワープ先・宝箱・ドア・人・敵の出現位置に歩いて行けるかまで調べる
- 町・建物・道を作る／直す → 先に [`game/docs/design/README.md`](game/docs/design/README.md) と `TOWN_GUIDE.md` を読む。見本がある町（平和台）は、見本の絵と配置のとおりに作る（`towns/<町>/CODEX_TASK.md`）
- 見本がある機能（おうちの会話・町の人・釣り・化石ほり・水族館と博物館・射撃場）→ [`game/docs/design/features/README.md`](game/docs/design/features/README.md) の `<機能>/CODEX_TASK.md` のとおりに作る。`docs/design/features/**/*-data.js` は自動生成なので、手で直さずにそのまま `js/` にコピーする

## Code Review Rules

- セーブの互換性を壊す変更を指摘する: `Save.KEY` の変更、既存のセーブ項目の削除・改名・型の変更で `Save.SCHEMA` の更新と `migrate()` の変換がないもの。プレイヤーのデータが消えるため。
- 新しい `game/js/*.js` が `game/index.html` と `game/sw.js` の `FILES` の両方に登録されていなければ指摘する。片方だと起動しない、またはオフラインで動かない。
- ゲーム本体（`game/js/`）への ES modules・外部ライブラリ・CDN・ビルド工程の追加を指摘する。`file://` と GitHub Pages でそのまま動くことが要件のため。
- `window.<トップレベルの const/class 名>` の参照と、短く衝突しやすいトップレベル名（1〜2文字など）の追加を指摘する。全スクリプトがグローバルを共有するため。
- `game/js/chara-data.js` を手で編集していたら指摘する（`npm run build:chara` で生成するファイル）。
- リポジトリ直下の ToDo アプリ（`index.html`・`script.js`・`style.css`・`firebase-config.js`）の変更を指摘する。
- 画面の文言が漢字の多い大人向けの言い回しになっていたり、390×844 / 375×667 で はみ出すおそれのあるレイアウトだったりしたら指摘する。
- `GAME_VERSION`・`package.json` の version・`CHANGELOG.md` の先頭の版の不一致、テストの削除・スキップを指摘する。
