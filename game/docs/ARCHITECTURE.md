# ぽかぽかタウン 設計書（ARCHITECTURE）

## 4つの町の街区改修

`town-design.js` の後、`transit.js` の前で `town-renewal-art.js` → `town-renewal.js` を読む。平和台の段階的移植から独立して、town / city / harbor / airport の街区を置き換える。基盤はTOWN-01のTownRoads。元の定義は旧ID・座標の検証用に `TownRenewal.originals` で保持する。

- 建物の `style` は専用のSVGモデル、寸法とドア位置は配置から渡す。素材キャッシュはstyle・幅・高さ・doorだけで有限。小物も固定の種類キー。店舗の機能は既存のactを引き継ぐ。
- 道の幅・交差点・入口・小物の置き場所を定義時に確定する。Tiles.chunkで桟橋・滑走路・誘導路・駐機場の地面を描き、道路を上に重ねる。TownRenewal.drawMovingは世界座標の飛行機を固定画像から描き、時刻を画像キーに使わない。
- 外からのワープを新しい入口へ付け替える。TownRenewal.safePositionは公共の通行範囲をマップごとに一度探索して保持し、通れなくなった旧座標だけを最寄りの安全なマスへ戻す。おかね・所持品・保存形式は変更しない。家の出口も建物から導出する。
- PokaDebug.townLayoutは配置の読み取り、townRoutesはNPC込みの実際の経路と現在地の通行判定。saveData / seedSaveは旧セーブ再開のテスト用。townPlanは本編と同じ地面・素材から全体図を生成し、プレイ状態は変えない。
- 詳しい配置・検査・画像の再現手順は `docs/design/towns/renewal/README.md`。旧位置全件の救済と既存機能IDの維持を静的に検査し、ブラウザでは2画面サイズで再開・移動・入口・再保存を検査する。

## 道のベクター描画（TOWN-01）

`road-patterns.js` → `town-roads.js` を tiles.js の後、maps.js の前に読み込む。`MAP_DEFS[id]` に見本JSONと同じ `roads / ring / fillets / crosswalks / marks / driveways` を任意で持てる。道路のない既存マップは以前の描画・衝突判定のまま。

- TownRoads は render.mjs の中心線サンプル・帯・円弧・隅切り・切り下げ・路面表示を Path2D にコンパイルし、定義ごとの WeakMap に保持。歩道→縁石→車道→島→隅切り→切り下げ→路面表示の順。
- `lib.mjs` の歩道・アスファルト・芝・コンクリートのSVGを `node tools/build-road-fixture.mjs` でそのまま生成。4種類の有限キー、固定4倍のラスターを createPattern で論理寸法に戻す。WorldScene.preload が模様を待つ。
- Tiles.chunk は地面を描いた後に同じ世界座標原点で道路を重ね、2端末pxの余白を切り落としてキャッシュ。模様読み込み前のチャンクはキャッシュしない。円弧のAAはCanvasの大きさで微差が出るため、検査は境界の面・白線の芯と全画像差分率を併用する。
- WorldMap.roadGrid はマスの中心から求める純粋な幾何判定（Canvas不要）。島は通れず、既存の木・建物・小物・入口の判定を維持する。道路を定義したマスの下地には通れる地面を配置する。
- 各roadの任意項目 `extendStart` は始点の車道の延長、`center / edges` は中心線に沿った距離 `{from,to}` の配列。見本JSONに未出力のこれらは、検証fixture生成時に元の heiwadai-v02.mjs / render.mjs の値を補う。drivewayの円弧・斜線は `road` の指定先（省略時 avenue）から求める。
- `tools/roads-preview.html` と PokaDebug.roadPreview は本編にマップを登録せず、実際の Tiles.chunk で画像を作る。`node tools/road-screenshots.mjs` で390×844・375×667の見本①②との比較を再現できる。建物・小物のSVG、全体配置、会話は TOWN-02以降で移植する。
- Save.KEY / SCHEMA / world / coinsは変更しない。今回のPRでは公開中の平和台48×44と全ID・ワープ座標を維持。64×68への置き換えと古いセーブ位置の救済は TOWN-04。

## 背景に固定した落ち葉

Seasonal.particles(sc,time,kind,size) は208pxの世界セルごとの固定seedと経過時間から、葉・花びら・蛍の世界位置を求める。カメラは表示対象セルと画面への変換にのみ使い、軌道・回転・周期には使わない。画面端で折り返さず、見えているセルだけを生成する。Weatherの風も同じ処理を使う。葉は2種類の輪郭、葉脈、葉柄、秋の4色、風での揺れと裏返りをcanvasで描く。冬の季節粒子と洞窟内は生成しない。

PokaDebug.drift(time) は現在のカメラと、指定時刻の季節/風の葉のID・世界座標・画面座標を返す。静的検査はカメラ移動からの軌道の独立、画面の移動量一致、時刻による移動、粒数上限、洞窟除外を検証。ブラウザではスマホ2サイズで平和台を歩き、同じ葉が地面と同じ距離だけ動くこと、20FPS以上、コイン不変を確認する。

## 立体のおうち（ver2）

`home-design.js` を seasonal-catalog.js の直後に読み、既存の家具・壁紙・床のIDを保ったまま絵を更新する。HomeDesign の床は480×360、壁高230。床上の位置を `(.88*(x-depth), .48*(x+depth)-height)` へ投影し、家具・キャラは床の奥行き順に描く。家具のSVGは床の足跡と投影範囲を返し、床家具の回転は90度。壁の飾りは左右の壁面へ変換する。

- Save.KEY/SCHEMAは変更しない。保存済みの床家具 `x,y` はそのまま、深さを `y-230` として表示。古い家具が壁を突き抜ける位置の場合、表示だけを床内へ寄せる。プレイヤーが動かすまで保存値を書き換えない。壁の任意項目 `wallSide:"left"` で左壁、未指定・backは右壁。所持数・増築先の家具も従来どおり共有する。
- HouseScene は投影と逆変換、床/壁それぞれのドラッグ、描画範囲とタップ判定を共用。家具の透明部分を避けて選択し、壁の選択は壁面に逆変換する。ボールの高さとキャラ・親・吹き出しは床座標から別に上へ描く。拡大は4段階、空いた場所のドラッグで画面移動、「全体」で復帰。カメラの状態は保存しない。
- SVGキャッシュは家具ID/向き、壁紙/床IDと固定ラスタサイズのみ。座標・時間・カメラ移動をキーに入れない。素材プレビューに部屋3種と全家具を表示。
- PokaDebug.homeDesign() は部屋サイズ・表示倍率・家具の保存座標/画面矩形・家族/ボール/かくれんぼの表示位置を返す。homeLayout(items,wall,floor) は開発用の家具配置。homePoint(x,y) は従来の床座標をそのまま受け取る。
- 静的検査で投影の往復、全家具/背景SVGと旧配置・増築・987654コインの保持を検証。ブラウザは390×844/375×667で旧セーブ再開、床ドラッグ、回転、左右壁、拡大移動、動く鳥かご、みまもり、再保存、ボール・かくれんぼ・睡眠を実操作する。

## 地形のある全体マップ（ver2）

`atlas-art.js` → `world-atlas.js` を seasonal.js のあと、debug.js の前に読む。従来の WorldAtlas を world-expansion.js から移し、メニューの「ちず」と季節イベントの「ぜんたい ちずを みる」から共通利用する。参照画像からは地形・境界・目印の見せ方を参考にし、島の形・配置・図案はオリジナル。

- AtlasArt.places は9エリアの地図上の位置・目印・短い説明、roads は実在する徒歩接続のみ。SVGの800×850座標で海岸線・起伏・植生・水系・街区を描く。素材プレビューに全体図を追加。模様は固定数・決定的な値、SVGのclipPath/patternには描画ごとの一意IDを付け、SvgCacheは使わない。
- WorldAtlas は開いたDOM内に拡大率（1〜3倍）・表示範囲・選択地点を持つ。Pointer Eventsでドラッグと2本指ズーム、44px以上のボタンで拡大縮小・全体・現在地・交通線切り替え。地点はキーボードのEnter/Spaceでも選べ、selectでも全エリアにアクセスできる。イベントは要素にのみ登録し、グローバルリスナーやタイマーを残さない。
- 現在地は world の mapId、それ以外は最後の保存位置を読み取る。マーカーの選択では移動しない。各エリアの実タイル図は「このエリアを くわしく みる」で展開し、現在地・出口・乗り場・しかけを表示。地図の操作状態は保存しないのでSave.KEY/SCHEMAとプレイデータは変更しない。
- 静的検査でエリアと徒歩接続の一致、SVG参照とID重複を確認。ブラウザでは390×844・375×667で9地点、44pxの選択範囲、タップ/キーボード/select、ズーム/ドラッグ/実際の2本指操作、現在地更新、交通線、詳細図、閲覧によるプレイ状態不変を確認。

## エリアの作り込み・交通（ver2）

季節イベント：`seasonal-catalog.js` は home-catalog.js の直後、`seasonal.js` は transit.js の直後に読む。端末の現地日付で春（3〜5月）、夏（6〜8月）、秋（9〜11月）、冬（12〜2月）を決める。1〜2月は前年12月と同じ冬のIDにする。

`Save.fresh().events.records` を追加。キーは `2026-autumn` など、値は `{stamps:{オブジェクトID:true},claimed:false}`。既存フィールドは変更しないのでSCHEMA 1のまま自動補完する。WorldScenery.activate から、今の季節の対象オブジェクトに限りスタンプを確定・保存。3つそろったら当年その季節に1回だけ衣装1点・家具1点・デザ3個を受領できる。claim は画面を開いた時のキーと現在キーを比較し、確定を保存してから演出。季節変更で記録や取得品を削除しない。限定品は rare とし通常販売しない。翌年は新しいスタンプ記録で再参加できる。

WorldScene が季節ボタンを mount / exit で着脱、1秒ごとに表示を更新。春夏秋冬の軽い粒子と対象地の飾りはcanvas描画。PokaDebug.calendar('YYYY-MM-DD') で日付を固定し、nullで戻す（保存しない）。festival() はイベント・対象地点・スタンプ・取得品所持数の読み取り。静的検査で季節境界と受領の重複防止、ブラウザで4季節の実際のタップ・受領・再開・年越しを確かめる。

`world-scenery.js` → `town-design.js` → `transit.js` を arcade.js のあと、debug.js の前に読む。WorldScenery は景観のSVGとcanvasアニメーション、town-design は既存6エリアの拡張と heiwadai / harbor / airport、Transit は8か所の乗り場を管理する。参考画像の平和台は地形構成のオマージュで、縮尺や実店舗の再現ではない。

- マップの `v` は道路、`z` は横断歩道。objects の `solid:true` は全体に衝突判定。`id` と `text` があるものはタップ・決定キーで反応し、WorldScene.goObject が到達できる外周まで案内する。既存の泉の回復処理は維持。
- 建物の `act:{type:"transit",stop}` は乗り場、`act:{type:"visit",text}` は休憩の会話。Transit.stops に map / label / kind を登録し、同じ kind の乗り場を接続。到着は対応するドアの1マス下。乗車取りやめでは移動・支払いなし。
- travel シーンは3人が乗車する4秒の演出。到着を早めるボタンと帰宅ボタンがある。演出中は最後の乗り場がセーブ位置で、到着時に通常のworldセーブへ切り替える。新しい永続フィールドは不要。古いセーブが新設の建物と重なったときは既存の findFree で近隣へ移す。
- WorldScenery の描画で時刻をSVGキャッシュキーに使わない。新しい姿は tools/preview.html の「まちのオブジェクト」で確認できる。
- PokaDebug.world() は現在の party / objects / stops とクリック座標、active（動作中のしかけID）を返す。travel() は from / to / kind / elapsed / party。テストはこれを読み、実際のタップで乗車・中止・帰宅・噴水・セーブ再開を確認する。
- 静的検査は交通の着地点と路線、すべてのしかけへの到達、追加SVGも検査する。

ver1（v1.0.0）時点の設計のまとめ。作業ルールはリポジトリ直下の [`AGENTS.md`](../../AGENTS.md) を先に読むこと。
コードを直したら、この文書の該当するところも直す。

---

## 1. 全体像

```
index.html ─ <script> を順に読む（classic script・グローバル共有）
   │
   ├─ main.js    G（画面・時間）/ Game（ループ・入力・シーン切り替え）/ SCENES（シーンの登録表）
   ├─ ui.js      UI（DOM の会話・選択肢・モーダル・HUD）
   ├─ save.js    Save（セーブ）/ Stats（ステータス）/ Care（ごはん・どうぐ）
   └─ シーン（1画面 = 1クラス）
        title  ─→ house ⇄ world ⇄ battle
                          │ ↑
                          ↓ │
                         shop（お店のおてつだいミニゲーム）
```

- **world** は町（town）と外の世界（meadow → forest → cave）を同じクラスで扱う。マップは `params.map` で切り替える。
- **house** は おうち（育成・着せ替え・もようがえ）。**battle** は3人パーティのターン制。**shop** は おみせっち風ミニゲーム。
- 買い物（ようふくや・かぐや・スーパー）はシーンではなく、world の上に出す DOM のモーダル（`ShopUI`）。

---

## 2. 読み込み順とグローバル名

`index.html` の読み込み順（この順を守る。後ろのファイルは前のファイルの名前を使ってよい）:

| # | ファイル | 主なトップレベル名 |
| --- | --- | --- |
| 1 | `version.js` | `GAME_VERSION` |
| 2 | `chara-data.js` | `CHARA_DATA`（自動生成） |
| 3 | `util.js` | `U`, `SvgCache` |
| 4 | `data.js` | `WEAR_ITEMS`, `SLOT_NAMES`, `PERK_TEXT`, `ITEM_INDEX`, `CHARA_STATS`, `CHARA_INFO`, `SKILLS`, `FOODS`, `TOOLS`, `BAG_INDEX`, `FURNITURE`, `FURN_INDEX`, `WALLPAPERS`, `FLOORS`, `WALL_INDEX`, `FLOOR_INDEX`, `ENEMIES`, `AREAS`, `SHOPS`, `SHOP_LV_REP` |
| 5 | `chara.js` | `INK`, `VB`, `FOOT`, `PROFILE`, `GOJI_COLORS`, `CHARA_IDS`, `EMO`, `WEAR`, `SLOT_ORDER`, `Chara`, 補助関数 `faceOf` `f2` `stroke` `shade` `heartPath` `starPath` `flowerSvg` `hatWrap` `eyeWrap` `neckWrap` `torsoClip` `garment` `sleeves` `t` `backWrap` `buildCharaSvg` `outfitKey` |
| 6 | `art.js` | `Art`, `SK`, `outlineLine`, `vbChar`, `NPC_PROFILE`, `npcEyes`, `SPECIES`, `enemyFace`, `ENEMY_ART`, `FS`, `FURN_ART`, `IS`, `FOOD_ART` |
| 7 | `tiles.js` | `TS`, `GROUND`, `SOLID_CH`, `OBJ_CH`, `Tiles`, `OS`, `WorldArt`, `SIGN_ICON` |
| 8 | `maps.js` | `MAP_DEFS`, `FieldGen`, `genMeadow`, `genForest`, `genCave`, `WorldMap` |
| 9 | `save.js` | `Save`, `Stats`, `Care` |
| 10 | `sound.js` | `Sound`, `DR`, `SONGS` |
| 11 | `ui.js` | `UI` |
| 12 | `main.js` | `G`, `Game`, `SCENES` |
| 13 | `talk.js` | `Loot`, `TALKS`, `Talk` |
| 14 | `menu.js` | `Menu` |
| 15 | `shop.js` | `BUY_SHOPS`, `ShopUI` |
| 16 | `dressup.js` | `DressUp` |
| 17 | `scene-title.js` | `TitleScene` |
| 18 | `scene-world.js` | `DIRS`, `dirOf`, `WALK_DUR`, `RUN_DUR`, `CHAR_SIZE`, `Maps`, `FieldMemory`, `Walker`, `WorldScene`, `DayTint`, `FX` |
| 19 | `scene-house.js` | `ROOM`, `HOUSE_SIZE`, `Room`, `HOUSE_ICONS`, `HouseScene` |
| 20 | `scene-battle.js` | `ALLY_SIZE`, `FOE_SIZE`, `BOSS_SIZE`, `BattleScene` |
| 21 | `minigames.js` | `MG_ART`, `CREPE_TOPS`, `BREADS`, `BREAD_TOPS`, `FLOWER_KINDS`, `RIBBONS`, `SHOP_OWNERS`, `HOWTO`, `CUST_*`, `ShopScene`, `TaskBase`, `CrepeTask`, `DentistTask`, `BakeryTask`, `FloristTask`, `MG_TASKS`, 補助関数 `breadSvg` `flowerIconSvg` `mgCanvas` `mgIcon` `topIcon` `mgBtn` `inBtn` `gridBtns` |
| 22 | `debug.js` | `PokaDebug`（これだけは `window.PokaDebug` にも入れてある） |

注意:

- ここにある名前と同じトップレベル名を新しく作らない（`t`・`f2`・`FS`・`IS`・`OS`・`SK`・`TS`・`DR` のような短い名前もすでに使われている）。
  新しいファイルでは、補助関数を オブジェクトの中や `(() => { ... })()` の中に入れると衝突しない。
- ファイルの途中で定義する関数を、読み込み時（トップレベル）に 後ろのファイルから呼ばない。呼んでよいのは `Game.boot()` 以降。
- `SCENES.xxx = クラス` の登録は各シーンのファイルの末尾で行う（例: `SCENES.shop = ShopScene;`）。

---

## 3. 画面サイズと座標

- キャンバス（`#screen`）は画面いっぱい。**論理座標**で描く。横幅はほぼ 360（`G.W`）、高さ `G.H` は端末の縦横比で変わる（390×844 の端末で約 780）。
- `Game.resize()` が、地面タイル（論理 32px）が端末ピクセルの整数になるように倍率 `G.px`（論理1 = 端末 G.px ピクセル）を決める。すき間の線が出ないため。
- `G.cssPerUnit` = 論理1 が CSS で何 px か。CSS 変数 `--u` にも入っている（DOM の UI を論理座標に合わせたいときに使う）。
- 端末の devicePixelRatio は最大 3 まで使う。

| もの | 大きさ（論理 px） | 定義 |
| --- | --- | --- |
| マップの1マス | 32 | `TS`（tiles.js） |
| 町・フィールドのキャラの幅 | 46 | `CHAR_SIZE`（scene-world.js） |
| おうちのキャラの幅 | 84 | `HOUSE_SIZE`（scene-house.js） |
| おうちの部屋 | 360×460（うち壁 230） | `ROOM`（scene-house.js）。画面に合わせて拡大縮小 |
| バトルの味方／敵／ボス | 100 / 118 / 214 | `ALLY_SIZE` / `FOE_SIZE` / `BOSS_SIZE`（小さい画面では縮む） |
| お店ミニゲームの作業エリア | 画面の下 約6割 | `ShopScene.layout()` の `R`（`{x, y, w, h}`） |

キャラの SVG 座標系（素材と同じ）:

- viewBox は `VB = { x: -10, y: -40, w: 220, h: 260 }`（素材の `-10 0 220 220` を、帽子のために上へ 40 広げたもの）。
- 足元の基準点は `FOOT = (100, 210)`。`Chara.draw(ctx, id, opts, x, y, size)` の `(x, y)` は **足元** の位置。

---

## 4. ループ・シーン・入力（main.js）

### ループ

`requestAnimationFrame` ごとに `G.scene.update(dt)` → `G.scene.render(ctx)` → 画面切り替えの演出。`dt` は最大 0.05 秒。
描画中に例外が出ると、`console.error` とトーストを1回だけ出して続ける。

### シーンの約束（すべて任意。必要なものだけ書く）

```js
class XxxScene {
  async enter(params) {}   // 始まるとき。await 中は画面切り替えの黒幕が出たまま（画像の先読みはここで）
  exit() {}                // 終わるとき。setInterval や DOM を必ず片づける
  update(dt) {}
  render(ctx) {}           // 論理座標で描く
  resize() {}              // 画面サイズが変わったとき
  down(p) {} move(p) {} up(p, canceled) {} cancel(p) {} hover(p) {}  // p = { x, y, sx, sy, t0, dur, tap }（論理座標）
  key(k, isDown) {}        // k = "up" | "down" | "left" | "right" | "ok" | "cancel"
}
SCENES.xxx = XxxScene;
```

### シーンの切り替え

`Game.goto(name, params = {}, type = "fade")`。`type` は `"fade"`（黒）・`"circle"`（丸く閉じる）・`"battle"`（ちかちか→しましま）・`"white"`・`"none"`（演出なし）。
切り替え中（`Game.trans`）と、DOM のモーダル・会話が開いている間（`UI.busy`）は、シーンに入力が届かない（`Game.inputLocked`）。

各シーンの `params`:

| シーン | params |
| --- | --- |
| `title` | `{}` |
| `world` | `{ map, x, y, dir, grace }` — `grace` は着いてから敵に当たらない秒数 |
| `house` | `{ intro?: true, msg?: "トーストの文" }` |
| `battle` | `{ foes: [{ kind, lv }], area, boss, back: { map, x, y, dir }, spawnIdx }` |
| `shop` | `{ shop: "crepe" など, back: { map, x, y, dir } }` |

### 入力

- タッチ・マウスは Pointer Events を論理座標に変換してシーンへ渡す。`p.tap` は「400ms 未満・10 以内の移動」。
- キーボード: 矢印 / WASD = 移動、Z・Enter・Space = ok、X・Esc = cancel。INPUT / TEXTAREA に入力中は無視。
- 会話中は ok キーで会話を送る。

---

## 5. DOM の UI（ui.js）

| 関数 | 使い方 |
| --- | --- |
| `await UI.say(lines, opts)` | 会話ウィンドウ。`lines` は文字列 または `{ text, name?, face?(SVG), who?("wanko" など), emo? }` の配列。`who` を書くと そのキャラの顔と名前が出る |
| `await UI.ask(text, options, { cancel, who })` | 選択肢。押した番号を返す（外をタップしてキャンセルなら -1） |
| `await UI.confirm(text, yes, no)` | はい／いいえ → true / false |
| `await UI.input(text, value, { max })` | 文字入力（`prompt()` の代わり）。やめたら null |
| `UI.modal({ title, body, cls, onClose, closable, footer })` | 画面いっぱいのパネル。`{ el, body, close, setTitle }` を返す |
| `UI.btn(label, onClick, cls)` | ボタン要素（`cls` に `"yellow"`・`"small"`・`"wide"` など） |
| `UI.toast(msg, cls)` | 画面上の短いお知らせ |
| `UI.showHud(on, place)` / `UI.updateHud()` | 上のコイン表示・場所名・メニューボタン |
| `UI.icon(kind, id, size)` | アイテムのアイコン（HTML 文字列） |
| `UI.busy` | 会話やモーダルが開いていれば true |

注意: `html:` や `innerHTML` に入れる文字列に、プレイヤーが入力した文字（キャラの名前など）を入れるときは、HTML の記号を取りのぞく（`menu.js` の名前変更と `Save.migrate()` でそうしている）。新しい入力欄を作るときも同じにする。

---

## 6. 絵の仕組み

### SvgCache（util.js）

SVG 文字列 → 画像 → canvas（端末ピクセルの大きさ）に変換して覚えておく。

- `SvgCache.get(key, () => svg文字列, pw, ph)` … あれば canvas、なければ読み込みを始めて **null** を返す（次のフレーム以降に出る）。
- `SvgCache.ensure(key, fn, pw, ph)` … 読み込み終わるまで待てる Promise。シーンの `enter()` での先読みに使う。
- 700 個を超えると古いものから 150 個捨てる。**キーは有限個に**すること（ランダムな値・時刻を入れない）。
- 画面の倍率が変わると全部捨てて作り直す。

### キャラの合成（chara.js）

- `tools/build-chara.mjs` が素材 SVG を解析して `CHARA_DATA[id] = { feet: [左足, 右足], base: [からだの要素...], poses: { idle_01: [左足の transform, 右足の transform, からだの transform], ... }, faces: { normal: [...], ... } }` を作る。
  素材の全ポーズは idle_01 と同じ要素で transform だけが違い、表情は顔パーツだけが違う、という構造を利用している。
- `buildCharaSvg(id, { pose, dir, face, outfit, color })` が、ポーズ×向き×表情×服 を1枚の SVG にする。
  - `pose`: `idle_01` `idle_02` `walk_01` `walk_02` `jump_01` `land_01`
  - `dir`: `down`（正面）・`up`（後ろ姿。顔を外し、しっぽ・背びれを描く）・`left`（顔を横にずらした 3/4 ビュー）・`right`（left を左右反転）
  - `face`: 感情の名前（`EMO` の `normal` `happy` `love` `excited` `sad` `angry` `surprise` `sleep` `calm`）。キャラごとに持っている表情ファイルへ変換される
  - `color`: ごじだけ `"soft"` / `"dark"`
- `Chara.draw(ctx, id, opts, x, y, size)` が SvgCache を通して描く。まだ無ければ、同じ服の別ポーズなどで代わりに描く（ちらつき防止）。
- `Chara.preload([[id, opts], ...], size)` で先読みする。

### 服の描き方（WEAR）

`WEAR_ITEMS` の `wear` に書いた名前の関数 `WEAR[名前](ctx)` が呼ばれ、次のレイヤーの SVG 断片を返す:

| レイヤー | 描かれる位置 |
| --- | --- |
| `behind` | からだより後ろ（マント・はね を正面から見たとき） |
| `sleeve` | うでの上（そで） |
| `torso` | 胴体の上。`torsoClip()` で胴の形に切り抜くと、3人の体型に自動で合う |
| `top` | いちばん上（帽子・めがね・首のもの・後ろ姿の背中のもの） |

`ctx` = `{ p: PROFILE[id], a: 取り付け位置, view: "front" | "back" | "side", dx: 横向きの顔のずれ, col: アイテムの色の配列, uid: 一意な文字列 }`。
取り付け位置 `a` はキャラごとに `PROFILE[id].a` にある（`hat` `eyes` `cheek` `mouth` `neck` `torso` `back`）。
あたま・かお・くび・せなかは `hatWrap` / `eyeWrap` / `neckWrap` / `backWrap` が「幅100のローカル座標」に変換してくれるので、1つの絵で3人に合う。
からだの服は `garment(ctx, すその高さ, 色)` と `sleeves(ctx, 色)` を使う。重ねる順番は `SLOT_ORDER`（back → body → neck → face → head）。

### そのほかの絵（art.js・tiles.js）

- `Art.npcSvg({ sp, col, stripe, outfit, emo })` … 町の人（`SPECIES` の cat / rabbit / bear / penguin / frog / sheep / mouse / pig）。服も着られる。
- `Art.enemySvg(art, col, emo)` … 敵（`ENEMY_ART` の slime / slime_king / fluff / bee / mushroom / acorn / leaf / bat / rock / crystal）。`emo` は normal / hurt / sleep。
- `Art.furnSvg(id, { flip })` … 家具（`FURN_ART[id]`、大きさは `FURNITURE` の w×h）。
- `Art.iconSvg(kind, id)` … アイコン。`kind` は `"wear"` `"bag"`（食べ物・どうぐ = `FOOD_ART`）`"furn"` `"wall"` `"floor"`。
- `Tiles` / `WorldArt`（tiles.js）… 地面は 8×8 マスのかたまり（チャンク）ごとに canvas に描いて使い回す。木・建物・街灯などは y 順に並べて描く。
- 線はすべて `INK`（#1F1D1B）。キャラ座標系で線幅 4.5（家具・アイコンは `FS()` / `IS()` が同じ見た目の太さを返す）。

---

## 7. データ（data.js）

| 表 | 1行の形 | メモ |
| --- | --- | --- |
| `WEAR_ITEMS` | `{ id, slot, wear, col?, name, price, st?, perk?, rare? }` | slot = head / face / neck / body / back。`st` = 能力の補正（hp sp atk def spd）。`rare` はお店に並ばない。`price: 0` は宝箱・ボスなどでもらうもの |
| `PERK_TEXT` | `{ perk名: 説明 }` | 服の特別な効果（cook / florist / dentist / shop / sleep / eat / explore） |
| `CHARA_STATS` | `{ hp: [Lv1の値, 1Lvごとの伸び], ... }` | |
| `CHARA_INFO` | `{ role, like: [食べ物id], dislike: [...], desc }` | 好物・苦手 |
| `SKILLS` | `{ user, lv, name, sp, target, power?, heal?, buff?, turns?, revive?, scare?, taunt?, fx, desc }` | target = enemy / enemies / ally / party / self / fallen。`e_` で始まるのは敵のわざ |
| `FOODS` / `TOOLS` | `{ id, name, price, hunger?, mood?, hp?, sp?, boost?, revive?, escape?, desc }` | `boost` は能力がずっと上がる。`BAG_INDEX` に両方が入る |
| `FURNITURE` | `{ id, name, price, kind, w, h, comfort, sleep?, rare? }` | kind = floor（床に置く）/ rug（床にしく）/ wall（かべにかける） |
| `WALLPAPERS` / `FLOORS` | `{ id, name, price, base, c2, pat, comfort }` | `pat` は `Art.patternSvg` の模様名 |
| `ENEMIES` | `{ name, art, col, lv, hp, atk, def, spd, exp, coin: [最小, 最大], skills, boss?, desc }` | 実際の強さはレベル差で伸びる（`BattleScene.enter`） |
| `AREAS` | `{ name, bg, table: [[敵id, 最小Lv, 最大Lv, 重み], ...], group: [最小数, 最大数] }` | どのエリアに どの敵が出るか |
| `SHOPS` | `{ name, color, desc, perk }` | おてつだいのお店。`SHOP_LV_REP` = 各レベルに必要な評判 |

---

## 8. セーブ（save.js）

- localStorage のキー `pokapoka-town-save-v1` に JSON で保存。**このキーは変えない**。
- 20秒ごと・画面を隠したとき・閉じるときに自動で保存（`Save.write()`）。値を変えたら `Save.mark()` を呼ぶ習慣にしている。
- 読み込み時に `Save.migrate()` を通す:
  1. `Save.SCHEMA` を上げたときの形式の変換（`if (d.v < N) { ... }` を1段ずつ足す）
  2. `Save.fresh()` にあって古いセーブに無いキーを補う（**新しい項目は fresh() に足すだけでよい**）
  3. 名前の HTML 記号を取りのぞく
- ゲームを閉じていた時間の分だけ、おなか・ごきげんが減る（最大12時間分。`Save.applyElapsed()`）。

`Save.fresh()` の形（ver1、SCHEMA 1）:

```js
{
  v: 1, gameVersion: "1.0.0", created, last,        // last = 最後に保存した時刻（ms）
  coins: 150,
  chars: { wanko: キャラ, gachan: キャラ, goji: キャラ },
  //   キャラ = { name, lv, exp, hp, sp, hunger(0-100), mood(0-100), bond(なかよし 0-100),
  //              outfit: { head, face, neck, body, back }, boost: { hp, sp, atk, def, spd }, color: "soft"|"dark", lastPet }
  order: ["wanko", "gachan", "goji"],              // ならび順（先頭が町でいちばん前を歩く）
  bag: { 食べ物・どうぐのid: 個数 },
  wardrobe: { 服のid: true },                       // 持っている服
  furn: { 家具のid: 持っている数 },
  room: { wall, floor, items: [{ uid, id, x, y, flip }], wallpapers: { id: true }, floors: { id: true }, nextUid },
  shops: { crepe: { lv, rep, best, plays }, dentist: {...}, bakery: {...}, florist: {...} },
  world: { map, x, y, dir, house? },                // つづきから の場所（house: true なら おうちから）
  flags: { intro, chests: { 宝箱id: true | "開けた日" }, boss, talked: { NPCのid: true } },
  //   あとから足されるもの: flags.bossDay（ボスを倒した日）、flags["gift_<NPCのid>"]（プレゼントをもらった）
  dex: { 敵のid: { seen, won } },                   // ずかん
  stats: { battles, wins, coinsEarned, shifts, perfects, fed },
  settings: { bgm, se },
}
```

よく使う関数: `Save.addCoins(n)` `Save.addBag(id, n)` `Save.care(id, { hunger, mood, bond })` `Save.careAll(...)` `Save.healAll()` `Save.avg(key)`、
`Stats.max(id, "atk")`（レベル＋服＋とっくん）`Stats.gainExp(id, n)` `Stats.skills(id)` `Stats.perk(名前)`、`Care.feed(id, itemId)`。

---

## 9. 町と外の世界（maps.js・scene-world.js）

### マップの定義（`MAP_DEFS[id]`）

```js
{
  name, bgm, baseGround: "grass" | "forest" | "cave", area?: "meadow" など（敵が出るエリア）,
  rows: ["TTTT...", ...],              // 1文字 = 1マス（記号は maps.js の先頭のコメント）
  buildings: [{ id, x, y, w, h, door, roof, awning?, chimney?, flowers?, sign, label, act }],
  //   act = { type: "house" } | { type: "buy", shop: "clothes" | "furniture" | "market" } | { type: "work", shop: "crepe" など }
  objects: [{ kind: "fountain" | "gate" | "stairs" | "spring" ..., x, y, w, h, ground? }],
  signs: [{ x, y, text }],
  npcs: [{ id, sp, x, y, dir, name, col?, stripe?, outfit?, wander?: [x0, y0, x1, y1], talk: "TALKS のキー" }],
  warps: [{ x, y, w, h, to: マップid, tx, ty, dir }],   // 踏むと to の (tx, ty) へ
  chests: [{ id, x, y, loot: { coins } | { bag, n } | { wear } | { furn }, daily? }],  // daily = 1日1回また開けられる
  spawns: [[x, y], ...],               // 敵のシンボルが出る場所
  boss?: { x, y, enemy },
}
```

- **町**は ASCII の手描き。**外の世界**は `FieldGen`（ブラシで道・池・木を置く）で作る。乱数は座標のハッシュなので、毎回同じ形になる。
- `npm run check` が、スタート地点から ワープ・宝箱・ドア・人・看板・敵の出現位置・ボスに歩いて行けるかを調べる。マップを変えたら必ず実行する。
- 建物は `rows` の `#` の場所に描かれ、`door` 列目の下の段がドア。ドアに入ると `act` の処理（`WorldScene.enterDoor()`）。

### 歩き方

- 1マスずつ動く（歩き 0.2 秒、遠くをタップしたとき・スティックを大きく倒したときは走り 0.13 秒）。タップした場所まで道を探して歩く（`goTo()`）。ドラッグでその場にスティック。
- 3人は `Save.d.order` の順に並び、前の人がいたマスへ1マスずつついて行く（`WorldScene.stepParty()`・`Walker`）。壁や敵との当たり判定は先頭だけ。
- 敵は `spawns` からシンボルとして出て、近づくと追いかけてくる。触れるとバトル。倒した敵は `FieldMemory` で覚え、別のマップへ行くまで出ない。にげた敵は少しのあいだ止まる。
- ボスは `flags.bossDay` が今日でなければ出る（1日1回）。宝箱の `daily` は `flags.chests[id]` に開けた日付を入れて判定する。
- 時間帯（`U.hourNow()`）で町の色が変わり、夜は街灯がともる（`DayTint`）。

### 会話（talk.js）

`TALKS[キー] = { first: [はじめての会話...], lines: [[会話...], ...], boss?: [ボスを倒した後...], gift?: loot }`。
はじめて話すと `first`、2回目からは `lines` のどれか。`gift` は1回だけもらえる（`Loot.give()`）。

---

## 10. おうち（scene-house.js）

- 部屋は 360×460 の座標（上 230 が壁）。家具の位置 `room.items[].x, y` もこの座標（家具の足元中央）。
- 下のボタン: ごはん（好物だと大喜び・苦手だと不機嫌）／あそぶ（かくれんぼ・ボールあそび）／きがえ（`DressUp`）／もようがえ／ねる（HP・SP 全回復、ベッドが良いほど ごきげん↑）／おでかけ。
- キャラをタップでなでる。「いごこち」（`Room.comfort()` = 壁紙＋床＋家具の comfort の合計）が高いほど ごきげんが減りにくい。
- もようがえ: ドラッグで移動、タップで はんてん・しまう。壁の家具は壁の範囲、床の家具は床の範囲に収める（`clampItem`）。

---

## 11. バトル（scene-battle.js）

- 3人 対 敵1〜3体（ボスは1体）のターン制。毎ラウンド すばやさ（±15% のゆらぎ）の順に行動。コマンドは たたかう・とくぎ（SP を使う）・どうぐ・ぼうぎょ・にげる。おなかが すいていると力が出ない。
- なかよしゲージは こうげきを当てたり受けたりすると たまり、なかよし度が高いほど たまりやすい。満タンで3人とも元気なら「なかよしトリオアタック」。
- ダメージは `calc(a, d, power)` = こうげき × 威力 × 100 /（100 + ぼうぎょ × 2.2）× ゆらぎ（0.88〜1.08）。会心 6%（ごきげん 80 超で +5%）で ×1.6、ぼうぎょ中は半分。
- 勝つと経験値（3人で共有）とコイン。全滅すると おうちに戻って全回復（ごきげん −10。コインは減らない、やさしい仕様）。
- ボス（キングプルン）を倒すと 王冠とトロフィー。`flags.boss` が立つ（1日1回再戦できる）。

---

## 12. お店のおてつだい（minigames.js）

### 流れ（`ShopScene`）

```
intro（店主の説明）→ お客さん × total 人 { enter → work（Task）→ judge（◎○△×）→ leave } → result（コイン・評判・レベルアップ）
```

- お客さんの数 `total = 3 + min(4, お店のLv)`。
- 採点（0〜100）→ ランク: **92以上 ◎ / 72以上 ○ / 45以上 △ / それ未満 ×**。
- 代金 = お店の基本額 ×（1 + 0.28 ×（Lv−1））× ランクの倍率（×0.2 / ×0.6 / ×1 / ×1.5）。◎ で時間に余裕があればチップ。服の perk・ごきげんでチップが増える。
- 評判がたまると お店のレベルが上がる（`SHOP_LV_REP`、最大 Lv5）。レベルが上がると 注文が難しくなり、報酬も増える。

### Task（1人のお客さんの作業）の約束

```js
class NewTask extends TaskBase {
  constructor(sc, lv) {
    super(sc, lv);                 // sc = ShopScene, lv = お店のレベル（1〜5）
    this.timeLimit = 20;           // 秒。時間の半分を過ぎると sc.timePenalty() で減点
    this.hideAfter = 0;            // >0 なら その秒数で注文の吹き出しが消える（タップで少しのぞけるが減点）
    this.title = "〇〇 ください！";  // 吹き出しの見出し
  }
  layout(R) { this.R = R; this.btns = [/* { x, y, w, h, label, fs, icon(ctx,x,y,s), color, cb, disabled, on, badge } */]; }
  drawOrder(ctx, x, y, w, h) {}    // 吹き出しの中身（注文）
  draw(ctx) {}                     // 作業エリア R の絵（ボタンは TaskBase.render が描く）
  tick(dt) {}                      // 毎フレーム（任意）
  downArea(p) {} move(p) {} up(p) {}  // ボタン以外への入力（任意。こする・長押し・ドラッグなど）
  timeout() { return 点数; }       // 時間切れのときの点数
  // できあがったら this.sc.finish(点数) を1回だけ呼ぶ。失敗の演出は this.sc.mistake("いたっ！")
}
```

- ボタンの位置は `gridBtns(R, 個数, 列数, 上端, 高さ)` で並べると、画面の大きさに合う。
- ボタンは作業エリア `R` の中に収める（`npm run check` が スマホ縦画面 相当の `R` で確かめる）。
- 採点は「正しく操作すれば 100 点」になるようにする（check が各 Lv で確かめる）。

---

## 13. 音（sound.js）

- `Sound.se(名前)` … 効果音: tap ok cancel coin buy hit crit miss heal buff debuff eat jump pop door good perfect bad encounter sparkle wan piyo gao germ fanfare levelup sleep whoosh bake ding swish
- `Sound.bgm(名前)` / `Sound.stopBgm()` / `Sound.jingle(名前)` … 曲は `SONGS`: title town house meadow forest cave battle boss shop、ジングル victory（勝利・お店の結果）jingle_lv（レベルアップ）
- 曲は `{ bpm, tracks: [{ wave, vol, notes: "C5 E5 . G5 ..." }] }` の形。`.` は休み、ドラムのトラックは k（キック）s（スネア）h（ハイハット）。
- iOS では、最初に画面を触ったときに音が有効になる（`Sound.init()`）。

---

## 14. 開発・テスト用の API（debug.js の `PokaDebug`）

ブラウザの開発者ツールで `PokaDebug.help()` と打つと一覧が出る。自動テストはこれを使う。

| 関数 | 説明 |
| --- | --- |
| `state()` | `{ version, scene, map, pos, phase, busy, transitioning, coins }` |
| `idle()` | 画面切り替え中・会話中でなければ true |
| `newGame({ goji })` | オープニングを飛ばして はじめから（おうちへ） |
| `teleport(map, x, y, dir)` / `house()` | 移動 |
| `battle(foes, area, boss)` | バトル開始。例 `battle([{ kind: "purun", lv: 2 }], "meadow")` |
| `shop(id, lv)` | お店ミニゲームを そのレベルで開始 |
| `coins(n)` / `level(lv)` / `unlockAll()` / `give(id, n)` | お金・レベル・全アイテム・もちもの |
| `save()` | すぐセーブ |
| `walkTo(x, y)` | 町・フィールドでタップ移動と同じ道さがし |
| `mg()` | お店ミニゲームの状態（注文・ボタンの画面上の位置など）。正解の操作をテストするため |
| `hour(h)` | 時刻を固定（null で戻す） |
| `fps(ms)` | 平均 FPS（Promise） |

新しいお店を足したら `mg()` にそのお店の `order`（注文の中身）を足す。

---

## 15. テスト

### `npm run check`（tools/check.mjs、ブラウザ不要・数秒）

全スクリプトを index.html の順に Node の `vm` に読み込み（ブラウザの代わりに最小限の見せかけを用意）、次を調べる:

1. ファイル構成: js の登録漏れ（index.html・sw.js）、`window.<トップレベル名>` の誤用、version.js が最初か
2. 読み込み: 名前の重複・文法エラー
3. バージョン: GAME_VERSION・package.json・CHANGELOG の一致、Save.KEY が変わっていないか、主要シーンの登録
4. データの参照: 服の描画関数・slot・perk、id の重複、好物、家具の絵、敵の絵・わざ・エリア、お店の表のそろい方
5. セーブ: 初期値の参照、SCHEMA、migrate（キーの補完・名前の記号除去）
6. マップ: 行の長さ、ワープ先が歩ける場所か、宝箱の中身、建物の act、NPC、ボス、歩いて行けるか
7. SVG: 3人×向き×ポーズ×表情×服、NPC、敵、家具、アイコンの SVG に NaN・undefined・タグの閉じ忘れ・存在しない `url(#id)` がないか
8. ロジック: ごはん全種、Lv50 までの経験値、宝箱の中身の受け取り、ミニゲーム各 Lv（ボタンが作業エリアに収まるか・正解で 100 点か）、BGM の音符

### `npm test` / `npm run test:full`（tests/smoke.mjs、Playwright + Chromium）

390×844（スマホ相当・タッチ）で実際に起動し、PokaDebug とタップで遊んで確かめる。ブラウザのエラーが1つでも出たら失敗。

| シナリオ | ふだん | full |
| --- | --- | --- |
| 起動とタイトル / はじめから→おうち→ごはん / きがえ と もようがえ / まちへ→お店の入口 / クレープやさん / バトルに勝つ / セーブ→つづきから | ✓ | ✓ |
| はいしゃさん・パンやさん・おはなやさん（Lv3 を正しく操作して ◎） / ボスに勝つ / 小さい画面（375×667） / 夜の町 | | ✓ |

- オプション: `node tests/smoke.mjs --only=クレープ`（名前の一部で絞る）`--headed`（画面を出す）`--shots`（スクリーンショット）。
- 失敗すると `tests/screenshots/FAIL_<シナリオ名>.png` が残る。
- GitHub Actions: PR のたびに `game-test`（`npm run check` と全シナリオ。スクリーンショットは Artifacts の game-screenshots）、main で版が `x.y.z` になると `release`（タグと Releases ページ）。
- シナリオの足し方: `scenario("名前", async (H) => { await H.open(); await H.newGameFast(); ... }, { full: true })`。
  `H.dbg("メソッド名", 引数...)` で PokaDebug を呼び、次のような道具を使う（smoke.mjs の `helpers()` を参照）:
  `H.tap(x, y)`（CSS px）・`H.tapLabel("ボタン名")`（ミニゲームのボタン）・`H.drag()`・`H.hold()`・`H.until(() => 条件)`・`H.idle()`・
  `H.dialogs()`（会話を最後まで送る）・`H.choose(番号)`（選択肢）・`H.houseButton("ごはん")`・`H.playShop("crepe", 3)`・`H.fightToEnd()`・`H.shot("名前")`。

---

## 16. 追加のしかた（レシピ）

### 服を1つ足す（既存の形の色ちがい）

```js
// data.js の WEAR_ITEMS に1行
{ id: "tshirt_green", slot: "body", wear: "tshirt", col: ["#81C784"], name: "Tシャツ（みどり）", price: 100, st: { hp: 2 } },
```

### 新しい形の服を足す

1. `chara.js` に描画関数を足す（あたまの例）:
   ```js
   WEAR.bunnyears = (ctx) => ({
     top: hatWrap(ctx, (s) => `<path d="M-20,0 C-30,-60 -10,-70 -6,-4 Z" fill="${ctx.col[0]}" ${stroke(s)}/>
       <path d="M20,0 C30,-60 10,-70 6,-4 Z" fill="${ctx.col[0]}" ${stroke(s)}/>`),
   });
   ```
   - `hatWrap` の中は「つばの中心が (0,0)、頭の幅が 100」の座標。`s` は線幅（拡大縮小を打ち消した 4.5）。
   - 後ろ姿（`ctx.view === "back"`）・横向き（`"side"`）で形を変えたいときは `ctx.view` で分ける。
   - clipPath などの id には `ctx.uid` を付ける。
2. `data.js` の `WEAR_ITEMS` に `wear: "bunnyears"` の行を足す。
3. `npm run check` → `tools/preview.html` で3人×向きの見た目を確認。

### 家具を足す

1. `data.js` の `FURNITURE` に `{ id, name, price, kind, w, h, comfort }`。
2. `art.js` の `FURN_ART[id] = () => \`<svg の中身>\``（座標は 0,0〜w,h。線は `FS()`）。
3. お店（かぐやさん）には自動で並ぶ（`rare: true` や `price: 0` は並ばない）。

### 食べ物を足す

`data.js` の `FOODS` に1行、`art.js` の `FOOD_ART[id]`（viewBox 0 0 64 64、線は `IS()`）。好物にするなら `CHARA_INFO[id].like` に足す。

### 敵を足す

1. `data.js` の `ENEMIES` に1行（`art` は既存の形か、新しく作る `ENEMY_ART` の名前）。
2. 出したいエリアの `AREAS[area].table` に `[id, 最小Lv, 最大Lv, 重み]` を足す。
3. 新しい形なら `art.js` の `ENEMY_ART[名前] = (col, emo) => SVG断片`（キャラと同じ座標系 `vbChar`、足元 y≈206 に影、`enemyFace()` で顔。emo は normal / hurt / sleep）。

### 町の人・会話を足す

1. `maps.js` のマップの `npcs` に `{ id, sp, x, y, dir, name, outfit, talk: "newtalk" }`（歩ける場所に置く）。
2. `talk.js` の `TALKS.newtalk = { first: [...], lines: [[...], [...]] }`。

### 新しいお店（おてつだいミニゲーム）を足す

1. `minigames.js` に `class XxxTask extends TaskBase`（§12 の約束どおり）、`MG_TASKS.xxx = XxxTask`。
2. `SHOP_OWNERS.xxx`（店主の見た目）と `HOWTO.xxx`（はじめての説明3行ほど）。
3. `data.js` の `SHOPS.xxx = { name, color, desc, perk }`。
4. `save.js` の `Save.fresh().shops.xxx = { lv: 1, rep: 0, best: 0, plays: 0 }`（古いセーブには migrate が補う）。
5. `maps.js` の町に建物 `{ ..., act: { type: "work", shop: "xxx" } }` を置く（町の空き地を広げる必要があれば rows を編集）。`tiles.js` の看板アイコン `SIGN_ICON` も足す。
6. `debug.js` の `PokaDebug.mg()` に注文の情報を足し、`tests/smoke.mjs` にシナリオを足す。
7. `npm run check`（Lv1〜5 でボタンが収まるか・正解で100点かを調べる）→ `npm run test:full`。

### マップを広げる・新しいエリアを足す

1. `maps.js` に `genXxx()`（`FieldGen` を使う）を書き、`MAP_DEFS.xxx = genXxx()`。
2. つなぐマップの両方に `warps` を足す（行き先 `tx, ty` は歩けるマス）。
3. `data.js` の `AREAS.xxx`、`sound.js` の `SONGS`（新しい曲なら）、バトル背景（`BattleScene.drawBg()` はエリア名で分岐していて、知らないエリアは どうくつの背景になる）。
4. `npm run check` で到達性を確認。

### セーブの形を変える（例: shops を配列に変える、など）

```js
// save.js
SCHEMA: 2,
migrate(d) {
  if (!d.v) d.v = 1;
  if (d.v < 2) { /* d の古い形 → 新しい形に変換 */ d.v = 2; }
  // …（以下は既存のまま）
}
```

`fresh()` の `v` も `this.SCHEMA` と同じにする（check が確かめる）。古い形のセーブを migrate に通すテストを check.mjs に足す。

---

## 17. 既知の制約・注意

- 文言は日本語だけで、各ファイルに直接書いてある（多言語化の仕組みはない）。
- 横向き・後ろ姿は素材に無いので、コードで作った簡易版。素材の正面ほどの完成度ではない。
- セーブは端末のブラウザの中だけ（別の端末に引き継げない。ブラウザのデータを消すと消える）。
- 実機（iPhone / Android）での確認は まだ少ない。自動テストは Chromium のみ。
- 画面の向きは縦を想定（横向きでも動くが、最適化していない）。
- Service Worker は https のときだけ登録する（`file://` と `http://localhost` では登録しない）。

## ver2: 戦闘表示
戦闘の下部メニューは高さを制限し、ResizeObserver で測った上端より上にHPカードを置く。技・道具一覧は枠内スクロール。PokaDebug.battleLayout() はカード下端とメニュー上端を CSS px で返す。

## ver2: おうちの生活
`parent-care.js` を home-life.js の直前に読む。Save.fresh().parents に親ごとの outfit / color / face / hair / accessory / skin、自動お世話フラグauto、3人ごとのlastCareを追加。KEY/SCHEMA/coins/既存所持品は変えずmigrateで不足項目だけ補う。着せ替えは無料で都度保存。

ParentCareはシーン内の親の位置とidle/walk/care・お世話順を持つ。親は13〜18秒ごとに順番に3人へ近づき、おなか70未満なら所持している普段のごはんを1個、なければなでなで。限定品・デザ・とっくん品・辛い食事を選ばずコインは使わない。3人をまとめてお世話する操作も可能。キャラごとに30秒の効果間隔を保存し、再起動による連続効果を防ぐ。メニュー中・他のお世話中・非表示タブでは進めない。外見とポーズの有限な組み合わせでSVGをキャッシュする。

HomeLife.bubbleLayoutは話者の頭の位置に合わせ、文字を折り返し、3つまでの吹き出しの重なりを避けて配置。しっぽは話者の方向へ最大26px。ごはん・なでる・ひとりごと・遊びの発言を統一。PokaDebug.family()は外見・親の行動・食事数・吹き出し矩形の読み取り、needs(hunger,mood)はお世話検証の準備用。スマホ2サイズで自動お世話、3人分の食事消費、無料の外見変更、吹き出し、再開時のコイン987654維持を確認する。

HomeLife はシーン内の会話・けんか・家具アニメーションを管理。HomeRooms は room を現在の部屋として保持し、rooms.stored に非表示の部屋を保存する（同じ家具は全室の配置数で管理）。Save.KEY と schema 1 を維持し、wantsDeza と rooms は migrate の補完で追加。home-catalog.js は art.js の後に読み、服22点・家具12点・壁紙4点・床3点・食べ物6点を追加。PokaDebug.homeLife(event)、feed(id,item)、wins(n)、homePoint(x,y) を生活テストに使用。

## ver2: 全体マップと新エリア
world-art.js は tiles.js の後、world-expansion.js は minigames.js の後に読む。川沿いの公園・city・coast を双方向ワープで接続。WorldAtlas が全体の接続図とタイル地図をメニュー内に表示する。戦闘からの帰宅は全滅時のみ（Game.goto でも制限）。逃走・勝利は元のフィールドへ戻す。お店の帰宅は終了フラグで結果処理を止める。

## ver2: 5属性の戦闘

`battle-elements.js` は sound.js の後・scene-battle.js の前。BattleElements が属性相性・戦闘だけの状態異常・敵の曲選択を管理し、既存の SKILLS に25技を追加する。敵IDは world-expansion.js の追加分も含む。保存形式・KEY・SCHEMAは変更しない。習得技は既存の Stats.skills が保存レベルから算出する。数値・解除条件・技一覧は [BATTLE_ELEMENTS.md](BATTLE_ELEMENTS.md)。

PokaDebug.battleState() は味方・敵の属性/HP/状態、現在の曲・手番・習得技を返す。battleFixture({hp,condition}) はコマンド待ちのときだけ状態を設定し、テストの決着には実際のターン処理を使う。状態は自分の番の開始に効果が発生し、終了に残り回数を減らす。戦闘終了後のセーブには残さない。

## ver2: 天気と四季
`weather.js`のWeatherは端末の年月日と3時間枠から決定的に天候を選ぶ。天候データは保存しないので同じ枠で再開しても同じ天気になり、既存データやコインを変更しない。冬だけ雪を候補に含める。予報は現在と次の2枠。洞窟/屋内は粒0、外は雨48・雪40・風14・雲3で固定し、時刻や座標をSVGキャッシュのキーに使わない。描画は明暗の後、操作スティックの前。

SeasonPaletteは四季4通りの草と木の色。季節が変わるとTilesの地面キャッシュを入れ替え、植物SVGだけ季節IDをキャッシュキーに加える。窓はWeather.sky()の有限な空色、HomeLifeは天気に合うひとことを吹き出す。PokaDebug.weather(type|null)で固定/解除、引数なしで天気・粒数・屋内判定・予報・配色を読む。calendar()は季節と天気を同時に更新する。静的検査で年中の3時間枠の安定性、スマホ2サイズで5天候・予報・屋内移動・20FPS以上・保存とおかね維持を検証する。

## ver2: 12か月のおまつり
`annual-festivals.js`はseasonal.jsの後に読む。ANNUAL_EVENTSが12か月のテーマ・3つの活動・選択肢・限定品を定義。AnnualArtは家具と会場の飾りを共用し、12種類の有限なSVGを使う。通常のショップに限定品は並べない。

「おまつり」から年間予定を開き、その月のイベントに参加する。会場3か所のしかけをタップし、好きな答えを選ぶと進行。開催期間は各月の1日〜月末。Save.events.activeAnnualを追加し、recordsは既存の`${year}-${season}`と別の`${year}-annual-${id}`キーにstamps/answers/claimedを保存。既存のコイン・所持品・四季記録を変換しない。キャンセル・期間外・重複回答は無効。受け取りは画面演出より先に保存するので連打や再起動で増えない。

PokaDebug.calendar('YYYY-MM-DD')で日付を固定し、annual()で現在のイベント・目的地・選択肢・取得数を読む。390pxで全12種類、375pxで七夕とハロウィンを実際のタップで完了し、保存・再開・翌年の持ち越しを確認する。

## ver2: 新ミニゲーム・難易度
economy.js の GameEconomy が報酬と難易度の値を管理する（[比較表](BALANCE.md)）。設定を開始時に保存するため途中変更は次回から反映。セーブには settings.difficulty と shops.link/relay を追加し、旧データは migrate が補完する。

arcade.js は world-expansion.js の後。LinkGardenTask / SkyRelayTask は既存の TaskBase を継承する。パズルは隣接・同種の3個以上をなぞり、重複不可・1個戻り可・pointercancelは破棄。7個で周囲消去、4コンボでフィーバー。配達は3列の移動・担当3人の交代・岩回避と6秒間隔の防御。左右キーで移動、上で交代、決定で防御も可能。

PokaDebug.shop('link'|'relay', lv) で開始。mg() は difficulty/timeLimit/timeLeft、link の cells（i/value/cx/cy）と order（legal/chain/collected/target/shuffles/fever）、relay の order（lane/role/items/progress/caught/target/misses/shield）を返す。描画・入力のテストはこの公開情報で操作する。店別BGMは SONGS.shop_<id>。

PokaDebug.pause(bool) は以前の停止状態を返す。テストで撮影する間だけ停止し、finally で戻す。外部フォントや描画待ちの時間をミニゲームの制限時間に含めないために使用する。

## ver2: 現代的なBGM

`modern-music.js` はsound.jsの後。ModernMusicが加算合成の楽器・ドラム・短い左右の残響・コンプレッサーとボイスの寿命を管理する。`music-arrangements.js` は各追加曲を定義するファイルの後、debug.jsの直前で読み、全32曲を編曲する。旋律以外に7th和音・ベース・パッド・ドラムを持つ8小節のループ（結果ジングルのみ短い一回再生）。音符の `+` は同時に鳴らす和音。

Soundは曲ごとにバスを作り、切替時に80msでフェードして音源/接続を破棄する。タイマーが遅れた場合は過去の音符をまとめて鳴らさない。保存項目は追加・変換せずsettings.bgm/seを引き続き使う。効果音・キャラの声は従来の音源を維持する。

PokaDebug.music(name|null)で試聴/停止、引数なしは再生状態。musicCatalog()は曲名・楽器・拍数。musicRender(name,秒数,wav=false)は同じ楽器・スケジューラでOfflineAudioContextへ合成しピーク/RMS/同時発音数を返す。wav=trueは試聴用16bitステレオWAVのbase64も返す。ブラウザ検査で全曲の無音・クリップ・発音上限、曲切替、設定保持を確認する。詳細・試聴は [MUSIC.md](MUSIC.md)。
mg() の score は採点中の点数、歯医者の order.mistakes は誤操作数。テスト失敗時に残り秒数と合わせて表示する。動くばい菌はPokaDebugで座標を取得した同じフレーム内でDOMのPointerEventを送り、テスト環境の通信遅延をゲームの操作ミスにしない。
