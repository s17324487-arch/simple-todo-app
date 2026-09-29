## おうちの自発的なしぐさ

HomeActions は15秒ごとに3人のうち1人の動作を選ぶ。15種類を重複しにくい袋から選び、椅子・本棚・植物・おもちゃ等は配置済みの場合だけ家具へ歩いてから動作する。動作中は通常の歩行を止め、撫でる・お世話・遊び・模様替えが優先。画面を隠した時とモーダル中はタイマーを進めない。動作の保存・課金・アイテム消費はない。描画は既存キャラの有限ポーズとCanvasの小物で行う。

自動会話は通常24〜40秒、みまもり14〜22秒（従来の2倍）。親の自動お世話は頻度と効果を保ち、会話だけ2回に1回にする。タップや手動のお世話には毎回反応する。PokaDebug.homeActions / homeAction / homeActionSchedule / homeAdvance は状態確認・動作指定・時計の初期化・停止中の時間送り。home-idle-life のスモークで15秒の間隔、15動作、家具条件、所持金維持を2画面サイズで確認する。
## 大人向けスローライフの価格

slow-life-prices.js は全カタログ登録後、debug.js の前に一度だけ実行する。販売価格は家具4倍、服2.5倍、壁紙・床3倍（10コイン単位で切り上げ）。0コインの初期品・非売品・rare は変更しない。食事・道具・部屋増築・収入の式は維持。カタログと索引は同じオブジェクトを参照しているため、買い物・確認・差し引きの価格が揃う。セーブのキー・値・形式の変換は行わない。tools/balance.mjs はチップ・気分加算と概算食費を含め、各店Lv1/Lv5・難易度別の収入と家具を買う回数を表示する。

# ぽかぽかタウン 設計書（ARCHITECTURE）

## おてつだいの途中終了

ShopScene の作業中は「おてつだいを やめる」から確認できる。確認中はシーンの時計と作業を止め、続行なら同じ注文へ戻る。終了は待機中の注文 Promise を解決し、完了済みの人数分だけ results(true) でコイン・評判・成功数を精算する。未完了の注文、完走数、なかよし加算は対象外。おなか・ごきげんは完了した人数に比例する。二重精算を防ぎ、結果画面を出す前に保存する。元のお店経由なら店内、それ以外は元の町へ戻る。セーブのキー・形式を変更しない。スモーク「おてつだいの途中終了」で確認中の時計、続行、0人/1人終了、持ち物維持、再読み込みを2画面で検査。

## 歩いて入るおみせ

`world → store ⇄ shop / puzzle` の構成。建物の既存の `act.type=buy/work` と `act.shop` は変えず、`WorldScene.enterDoor` が `StoreScene` へ入口外の `back` を渡す。`arcade.js` の後に `store-interiors.js` → `scene-store.js` を読み、全9種類の内装・店員・10×12マスの床と衝突判定を登録する。

- `STORE_INTERIORS` の展示は `[kind,x,y,w,d,label]`。描画は奥から足元順、当たり判定は床面の矩形。床タップと方向キーで3人が一緒に歩く。店員または「てんいんと はなす」でレジ前まで経路探索してから会話する。入店しただけでは商品画面を開かない。
- `StoreArt` が各業種の壁・床・棚・作業設備のSVGを作る。部屋は店ID、展示は固定種類、店員は店IDでキャッシュする。蒸気と点灯の時間はCanvas描画だけに使う。
- 商品UIは既存の `ShopUI` を再利用。洋服・家具・スーパーの品揃えと価格は維持し、クレープ・パン・花のお店は既存商品の専門棚を使う。`BUY_SHOPS.kind` がある場合は購入先（bag/furn）を指定する。購入直後に `Save.write()`。
- おてつだい開始に `returnStore:true` を渡すと、報酬を保存して同じ店内に戻る。従来の `PokaDebug.shop()` など、指定しない入口は町へ戻る契約を維持する。空腹時には開始しない。
- KEY/SCHEMA/保存項目の形は変えない。店内へ入る際に `world` に入口の外を保存するため、再読み込み後は同じ町の同じお店の外から再開。店内専用座標を町の座標として保存しない。部屋・アイテム・所持金・育成・お店の進行は共通。
- 開発用API: `PokaDebug.store(id,map='town')`、`storeState()`（店員/出口の画面座標、全床の到達性、展示・パーティ・BGM）、`storeWalkTo(x,y)`。後者も実際に床を歩く。新シーンの操作テストはこのAPI経由。
- 静的検査で全店舗の内装登録・展示範囲・通路の連結を確認。スモークの `walk-in-stores-390/375` と「店員から購入・保存・おてつだい」で、実際の入口、店員タップ、購入、空腹制限、報酬、退出、支店の再開と保存を検証する。

## 管理者用の隠しコマンド

`menu.js` の設定画面下部のバージョン表示を7回連続タップ（間隔1.5秒以内・全体6秒以内）すると「かんりしゃ コマンド」が出る。カウンターと解除状態はその設定画面のDOMの寿命だけに保持し、タブ切替・メニューを閉じる・再読み込みで破棄。通常画面へ入口のヒントは追加しない。

コマンドは所持金を99,999へ設定、3人のHP/SP全回復、おなか/ごきげん100。実行前に確認し、コインは増額ではなく代入するため99,999より多い場合も確認文に変更前後を表示する。獲得コイン統計やレベル・進行・所持品・配置は変更しない。回復系はおうち/ワールドでのみ使用可能とし、戦闘中の生存判定やミニゲームへ干渉させない。実行後は即時保存と表示更新を行う。KEY/SCHEMA/保存項目を変更しない。

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

「おへや」の拡張は各室1回、6,000コイン。`rooms.expanded` に部屋IDごとの購入済みフラグを追加し、既存の `room` / `rooms.stored` の配置・所持品は変更しない。未指定なら通常サイズ。`HomeRooms.expand` は現在の所有部屋・残高・未購入を支払直前に確認して保存する。`HomeDesign.size()` と `ROOM` の寸法は表示中の部屋に追従し、480×360から640×540へ床面積を正確に2倍にする。背景キャッシュにもこの2種類のサイズを含める。拡張後の床・壁・家具ドラッグ・家族の移動範囲は同じ寸法を使う。

`home-design.js` を seasonal-catalog.js の直後に読み、既存の家具・壁紙・床のIDを保ったまま絵を更新する。HomeDesign の床は480×360、壁高230。床上の位置を `(.88*(x-depth), .48*(x+depth)-height)` へ投影し、家具・キャラは床の奥行き順に描く。家具のSVGは床の足跡と投影範囲を返し、床家具の回転は90度。壁の飾りは左右の壁面へ変換する。

- Save.KEY/SCHEMAは変更しない。保存済みの床家具 `x,y` はそのまま、深さを `y-230` として表示。古い家具が壁を突き抜ける位置の場合、表示だけを床内へ寄せる。プレイヤーが動かすまで保存値を書き換えない。壁の任意項目 `wallSide:"left"` で左壁、未指定・backは右壁。所持数・増築先の家具も従来どおり共有する。
- HouseScene は投影と逆変換、床/壁それぞれのドラッグ、描画範囲とタップ判定を共用。家具の透明部分を避けて選択し、壁の選択は壁面に逆変換する。ボールの高さとキャラ・親・吹き出しは床座標から別に上へ描く。拡大は4段階、空いた場所のドラッグで画面移動、「全体」で復帰。カメラの状態は保存しない。
- SVGキャッシュは家具ID/向き、壁紙/床IDと固定ラスタサイズのみ。座標・時間・カメラ移動をキーに入れない。素材プレビューに部屋3種と全家具を表示。
- PokaDebug.homeDesign() は部屋サイズ・表示倍率・家具の保存座標/画面矩形・家族/ボール/かくれんぼの表示位置を返す。homeLayout(items,wall,floor) は開発用の家具配置。homePoint(x,y) は従来の床座標をそのまま受け取る。
- 静的検査で投影の往復、全家具/背景SVGと旧配置・増築・987654コインの保持を検証。ブラウザは390×844/375×667で旧セーブ再開、床ドラッグ、回転、左右壁、拡大移動、動く鳥かご、みまもり、再保存、ボール・かくれんぼ・睡眠を実操作する。

## 地形のある全体マップ（ver2）

`atlas-art.js` → `world-atlas.js` を seasonal.js のあと、debug.js の前に読む。従来の WorldAtlas を world-expansion.js から移し、すまほの「ちず」と季節イベントの「ぜんたい ちずを みる」から共通利用する。参照画像からは地形・境界・目印の見せ方を参考にし、島の形・配置・図案はオリジナル。

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
                         store（歩ける店内）⇄ shop（おてつだいミニゲーム）
```

- **world** は町（town）と外の世界（meadow → forest → cave）を同じクラスで扱う。マップは `params.map` で切り替える。
- **house** は おうち（育成・着せ替え・もようがえ）。**battle** は3人パーティのターン制。**shop** は おみせっち風ミニゲーム。
- 買い物は歩ける店内 `store` の店員から開く DOM のモーダル（`ShopUI`）。おてつだいも同じ店員から開始する。

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
| — | `world-zoom.js`（debug.js の まえ） | `WorldZoom` |
| — | `home-doors.js`（parent-work.js の あと） | `HomeDoors` |
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
- 町・フィールドの ズーム（`WorldZoom`・0.5〜1.5 倍）は `render` の あいだだけ `G.W`・`G.H`・`G.px` を かえる（くわしくは「町の ズーム（UI-08）」）。

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
| `store` | `{ shop, back: { map, x, y, dir }, atCounter?: true }` |
| `shop` | `{ shop: "crepe" など, back: { map, x, y, dir }, returnStore?: true }` |

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

### すまほ（smaho.js・UI-01）

- `Smaho` … ひだり したの「すまほ」ボタン（`.smaho-btn`。町・フィールド・おみせ・おうちの 下の ボタンの 上）と スマホの 画面（`.modal-wrap.smaho-wrap` の 中の `.smaho`）。`Game.openMenu`（Esc・cancel キー）は `Smaho.toggle()`。≡（`UI.hudMenu`）は `Menu.open()` で、タブは せってい・あそびかた（`Menu.help`）だけ。
- `APPS` … `{ id, name, color, when?, render(el, ph) }`。ちず（`WorldAtlas.render`＋町・おみせでは「おうちへ かえる」）・ようす（`Menu.status`）・もちもの（`Menu.bag`）・ずかん（`Menu.dex`）・イベント（`AnnualFestivals.open`）・スタンプラリー（`Seasonal.open` と `DailyPlay.open` の タブ）・ひんと（`hints()`）・うらない（`fortune(day)`）・ごほうび（`ShopRewards.open`）・おんがく（`MusicDiscs` が ある とき）。
- `ph.embed(fn)` … `UI.modal` を 1かいだけ かりて、`fn()` が つくる まどの `body`・`footer` を アプリの 画面に 入れる。かえす `close()` は すまほを とじる（「さんか」「ちずを みる」の あとは あそびに もどる）。
- `fortune(day)` … 日づけの 文字（`U.today()` の 形）から きめる うらない（Math.random・Date を つかわない）。ラッキーの おみせは `DailyPlay.featured(day)`（ほんとうに コイン 1.2ばい）。ひいた 日は `Save.d.flags.fortuneDay`（あたらしい セーブ項目は ない）。
- `Seasonal.mount` は すまほの ボタンだけ つける（町の「おまつり」ボタン `.world-festival` は もう 出さない）。PokaDebug は `smaho(app)`・`smahoState()`・`fortune(day)`。

注意: `html:` や `innerHTML` に入れる文字列に、プレイヤーが入力した文字（キャラの名前など）を入れるときは、HTML の記号を取りのぞく（`menu.js` の名前変更と `Save.migrate()` でそうしている）。新しい入力欄を作るときも同じにする。

### 家具・服の図鑑（V2-14）

- `item-dex.js` の `ItemDex` と `item-dex-sources.js` の `ItemDexSources`。`Menu.dex` の5タブから `ItemDex.render(el, 'furn' | 'wear')` を呼ぶ。`catalog` は実行時の `FURNITURE` / `WEAR_ITEMS` をIDで重複排除し、レア品や後から追加する景品も含む。入手ヒントは配布元の表から読む。
- `Save.fresh().itemDex = { furn: {}, wear: {}, claimed: { furn: {}, wear: {} } }` を追加。`Save.KEY`・SCHEMA・既存の敵 `dex` は維持。`Save.write` と図鑑を開くときの `ItemDex.sync` が所持品を収集記録へ足す。家具総数には設置中を含むので足し算せず、現在の部屋と別室の配置数を下限にする。服は `wardrobe` と3人の `outfit` を見る。無料の親の見た目は対象外。閲覧・プレビューは所持品・装備・配置・コインを変えない。
- 各図鑑の10種類ごとに100コイン。`claim(kind, threshold)` は手動受取だけで、受領記録とコインを同時保存する。保存失敗時は両方を戻す。`PokaDebug.itemDex(kind)` は進捗/一覧、`itemDexClaim(kind, threshold)` は受領の入口。静的検査 `tools/check-item-dex.mjs`、スマホ検査 `tests/item-dex-smoke.mjs`（390×844 / 375×667）。

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
- `FoodArtFix`（food-art.js）… 食べ物の 絵を 名前に あわせる（ART-06）。`home-catalog.js` が ほかの 食べ物の 絵を かりて いた もの・`annual-festivals.js` の おまつりの しるしの デザ・ピーマン・やきざかな の `FOOD_ART` を 上がきする（その あとに 読む）。check は 食べ物ごとに 絵が ちがう ことを 見る。
- `FurnModels`（furniture-models.js）… 家具の 立体モデル（ART-03）。`HomeDesign.model()` の さいしょに `FurnModels.build(id, opts)` を よび、作りなおした 24しゅ（`FurnModels.ids`）と、2D の 絵の 家具（植木・くま・きせつの かざり など。大きな 板を やめて かげだけ）を かえす。ほかは これまでの 絵。
  - ざひょうは HomeDesign と おなじ（x: よこ −w/2〜w/2、y: おく −d〜てまえ 0、z: 上）。見える 面は てまえ・みぎ・上。うしろ → てまえ の 順に かさねる。はんてんは 投影で かわるので、形は 1とおりで よい。
  - 道具: `box`（3面）・`prism`（凸な 形に あつみ。見える 面と ふちを 凸包で）・`cyl`・`frustum`・`ball`（球は はば 1.23 ばいの 円）・`slab`（かたむいた 板）・`onP`（面に 2D の 絵を はる）・`at`（床の 1点に 小さな 絵を たてる）・`lg` / `rg`（グラデーションの id は 通し番号で かさならない）。
  - 床の 大きさ・高さ（`footW` / `footD` / `height`）は `HomeDesign.dimensions` の まま。床の 四すみは かならず 絵の はんいに 入れる（あたり判定を これまでと そろえる）。`npm run check` が 全家具・はんてんで たしかめる。PokaDebug は `furnArt(id, flip)`。
  - かべの 家具の うち はとどけい・まど・ポスターは `FURN_ART` を 上書き（ポスターは `Chara.svg` の 3にんを 入れる。まどの `class="sky"` は 天気の 空の 色に かわる）。
- `FurnLive`（furniture-live.js）… さわれる 家具（ART-03b）。scene-house の 4か所から よぶ: `furnCanvas` で `FurnLive.opts`（`LIVE` の 家具は `opts.live` → 絵から うごく ぶぶんを ぬく。`HomeDesign.model` は `live:` の キーで 別に もつ）、`drawFurn` の さいごに `draw`、タップで `tap`（あつかった ときは これまでの 「わあ！ うごいた♪」を しない）、よるの くらさの あとに `lights`（あかりを `lighter` で 足す）。
  - じょうたいは へや・uid・家具の id ごと（セーブしない）。時こくは `U.hourNow()`（PokaDebug.hour に あわせる）と 分。音は `Sound.tone` / `Sound.noise` を その場で。SvgCache は もくばの 2まいだけ。
  - さわると ちかくの 1人が `react`（とぶ・♪/ハート）と `HomeLife.say` で ひとこと。PokaDebug は `furnLive(id)`（ようすと タップする 点）。
- `Art.iconSvg(kind, id)` … アイコン。`kind` は `"wear"` `"bag"`（食べ物・どうぐ = `FOOD_ART`）`"furn"` `"wall"` `"floor"`。
- `Tiles` / `WorldArt`（tiles.js）… 地面は 8×8 マスのかたまり（チャンク）ごとに canvas に描いて使い回す。木・建物・街灯などは y 順に並べて描く。
- `WaterArt`（water-art.js）… 水の 絵。水の マス（`~` と はし）は これまでと おなじで、見た目だけ なめらかに する。
  - マップごとに 1かい `prep(map)`: 水の かたまり（4方向）を 形で 見わける（ほそながい → 川、大きい・マップの はしへ ひろがる → 海、ほか → 湖。`def.waterKind` で 1つに きめられる）。岸からの ふかさ（すなはま は あさく、いしがき は すぐ ふかい）、川の ながれ（上流の はしからの みちのり）、岸の 線（マスの 水を 2じ B スプラインで ぼかし、すこし ゆらして、マーチング スクエアで 0.5 の 線）。
  - `Tiles.drawGround` の 水・はしの マスは となりの 陸を 描くだけ（`under`）。`Tiles.chunk` の さいごに `WaterArt.chunk` が 水面（ふかさの 色・ながれの すじ・波・うつりこみ・はす・いし）と 岸（ぬれた すな・どて・いしがき・あわ・がま）と はしの いた（`Tiles.bridgeDeck`）を 描く。
  - `WorldScene.renderWater` は `WaterArt.frame`（川の ながれ・波うちぎわの あわ・波がしら・波紋・きらめき・雨の わ）。チャンク 8×8 マスごとに 見える ものだけ。
  - マスの まんなかの 見た目は かならず 水の マス ↔ 水（`looksWet`。`npm run check` が 全マップで たしかめる）。PokaDebug は `water(map, x, y)`。
- `NpcArt`（npc-art.js）… 町の人の 絵 ver2。`Art.npcSvg` を おきかえる（art.js の すぐ あと）。35しゅ（`NpcArt.SP`。`SPECIES` にも 名前と 色を のせる）。
  - `spec.look`: `col3`（もようの 色）・`eye`（9）・`brow`（5）・`mouth`（くちばしの 種は なし）・`cheek`（6）・`pattern`（毛の もよう。頭と 体の 形で きりぬく）・`tuft`（まえがみ・あたまの かざり）・`acc`。体と 服は これまでと おなじ（`NPC_PROFILE`・`WEAR`）。
  - `look` を わたす ところ: `WorldScene.npcCanvas`（キャッシュの キーにも 入る）・`Talk` の 顔・`TownFolk.face`・`Museum` の 係。スプレッドで わたす ところ（お店の 人・お客さん）は そのまま。
- `NpcCast`（npc-cast.js）… 1人ずつの 見た目と 名前（townsfolk.js の あと）。読みこみの さいごに `MAP_DEFS` の 町の人と お店の 人へ `look` を のせる（マップの ならびは かえない）。
  - 名前の ある 人は `FIXED`（種も 名前も そのまま）。役の 名前で よばれる 人は、おなじ 名前の 人が 2人 いじょう なら「役の まえの ことば ＋ 種ごとの 名前」を つけて `n.given = true`（`TownFolk.name` が それを つかう）。
  - 役の 名前・セリフに 種が 出る 役（かわべの カエルさん・ふなのりの ペンギン など）は 種を かえない。のこりは 町ごとの 種の なかま（`POOL`）から、その 町で すくない 種を。
  - おなじ 見た目の キー・小さく 見た ちがい（種・色・もよう・かざり・服）・名前が だれとも かさならない ように えらぶ。あたらしい 人が ふえても 自動で ちがう 人に なる。
  - お店の お客さんは `NpcCast.customer()`（きまった 60人。さいきんの 6人は くりかえさない。SvgCache の キーが ふえつづけない）。
  - PokaDebug は `cast(id)`（id なしで 全員の ようす）。`npm run check` が おなじ 見た目・名前が ない ことを たしかめる。
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
- `ParentWork`（parent-work.js）… ぱぱ・ままの おしごと（ART-04）。`U.hourNow()` が 9〜17 の あいだは 家に いない（`p.hidden`）。`ParentCare` の init・update・draw・open・request を つつむ（parent-care.js と scene-house.js は かえない）。
  - `sc.work.phase`: home → leaving（ドアへ あるいて きえる・「いってきます」）→ away（おるすばん）→ arriving（ドアから 入る・「ただいま」「おかえり」・3人の ごきげん と なかよし +）→ home。`PokaDebug.hour` で 時こくを とばした ときは `snap`（えんしゅつ なし）。
  - おるすばん: `ALONE`（1人ずつ・せいかく）・`TALKS`（かけあい）・`timely`（12じ・15じ・17じはん）。しぐさは `sc.react` / `sc.fx`、うごきは ドア・まど・3人で あつまる。テストで とめて いる 子（`c.t > 100`）は うごかさない。
  - その日 はじめて おしごと ちゅうに 入ると ひとこと（`flags.workDay`）、18〜21じに はじめて 入ると「ただいま」（`flags.homeDay`）。PokaDebug は `parentWork(event)`。
- `MusicDiscs`（music-discs.js）… レアの 音楽プレイヤーと ディスク（ART-05）。
  - プレイヤー 3しゅ（`player_boombox`・`player_gramophone`・`player_jukebox`）は `FURNITURE` に 足す ふつうの 家具（rare・ねだん 0・interactive）。絵は `FurnModels.register`、タップと うごきは `FurnLive.register`（ちくおんきの レコード・ジュークボックスの ひかりは live）。
  - ディスク（`DISCS`）は きょく（`SONGS` の キー）と 手に入る ところ（`from.shop` / `from.map` / `from.town` / `starter` / `jukebox`）。ディスクだけの 名曲（`disc_twinkle`・`disc_canon`・`disc_turkish`・`disc_nacht`）は 作曲者が 1967年 までに なくなった 曲を Mutopia Project の 楽譜から 写して `SONGS` に 足し、`source`（作曲者・作品・楽譜・ライセンス）を つける（check が 出典と 没年を 見る）。この ゲームの ために つくった ぽかぽかの きょく（`disc_theme`・`disc_lullaby`・`disc_march`）は `original: true` で、名曲と いっしょに のこす（出典の 検査は しない）。プレイヤーの おまけは `from.starter` / `from.gramophone` / `from.jukebox` の ディスク ぜんぶ（ぽかぽかの きょくと 名曲 1まいずつ）。セーブは `Save.d.discs`（id → 日づけ）だけ。
  - 手に入れる: `ShopScene.prototype.results` を つつみ、○いじょうが 6わりで その おみせの ディスク（「きょうの けっか」に 1ぎょう 足す）。`Loot.give`（chest）と `WorldScene.prototype.openChest` を つつみ、その マップの ディスクを 中みの あとの ページで 出す。はじめての ディスクで ラジカセ、3まいで ちくおんき（たからばこ）、8まいで ジュークボックス。それぞれ 名曲の ディスクが 1まい つく。
  - きく: プレイヤーを タップ → `open()`（ディスクの ボタン・「とめる」）→ `Sound.bgm(d.song)`。`sc.music` に いま ながして いる ディスク。PokaDebug は `discs()`・`discDrop(kind, where)`・`discLuck(on)`。

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
| `homeSay(id, text, kind)` / `homeTalkLog()` / `homeTalk(id)` / `homeLines(id)` | おうちで しゃべらせる／さいきん しゃべった もの（`line`・`talk` つき）／かけあいを 流す／会話データの 数・1つの セリフや かけあい |
| `folkTalk(id)` / `folkLast()` / `folkLine(id)` | 町の人の となりへ 行って 話しかける（会話は H.dialogs で すすめる）／さいごの セリフと ひとことの id／データの セリフ 1つ |
| `folk()` / `folkOffer(id)` / `folkSignal(sig)` / `folkMarks()` | おねがいの きろく／つぎに かならず もちかける／手順を すすめる（会話は またない）／いまの マップの しるし |
| `folkSpots(map)` / `folkKitten()` / `folkPhotoTile(map)` | さがす きらきら・さわる 小物（となりの 立てる マス `stand`・画面の 位置 `cx`/`cy`）／ついて くる こねこ／しゃしんが とれる マス。`folkOffer` は 物々交換の id（`bt-…`）も うけとる |
| `smaho(app)` / `smahoState()` / `fortune(day)` | すまほを ひらく（app なしで ホーム・null で とじる）／`{ open, app, apps, button, phone, dot, hints }`／その日の うらない |
| `fishGive(id, n)` | ③ 魚を いけすに 入れる（ずかんにも のる。大きさは `Fishing.size`）。ずかんの きろくを かえす |
| `rod(n)` / `fishShore(map)` / `fishState()` / `fishAuto(on, clear)` / `fishSpawn(id, cm, { nibbles, fickle, swim })` / `fishAim(uid)` / `fishCast(wx, wy)` / `fishPull()` | ③ さおを もたせる／岸の 立てる マス `{ x, y, dir }`／つりの ようす（`line`・`bobber`・`shadows`・`nibbled`・`escaped`・`brag`・`zoom`・`button`・`last`）／かってに 魚を 出す か（clear で けす）／3人の ちかくに 魚の かげ（ふつうは うきに 気づく まで とまる）／その かげの あたまの まえ（画面の CSS px。page.mouse で ながおし）／ながおしと おなじ ところへ なげる／「つる」ボタンと おなじ |
| `fossilGive(key, n)` | ④ 骨を もたせる（`"trex.skull"` など）。もって いる 数を かえす |
| `pick(n)` / `fossilRocks(map)` / `fossilSpot(map)` | ④ ピッケルを もたせる（0／1）／きょうの いわ `[[x, y], ...]`（ほった ものは のぞく）／いわの となりの 立てる マス `{ x, y, dir, rock }` |
| `museumGive(kind, key)` / `museumDonate()` / `museumPick(key)` / `museumConfirm()` | ⑤ 寄贈した ことに する（"all" で ぜんぶ）／館の 人に 話しかけて 寄贈の 画面へ／えらぶ／きふする（ありがとうの 会話は またない） |
| `museumShow(objId)` | ⑤ 展示の 説明を ひらく（`aq_flow`・`mu_trex`・`mu_f1` など） |
| `range(course, gun, who, seed)` / `rangeInput(inp)` / `rangeAuto(sec, skill)` / `rangeState()` / `rangeEnd()` | ⑥ ロビーを とばして 射撃場で あそぶ（ロックは むし）／1フレームぶんの 入力／`ShootingRange.bot` で すぐ すすめる（音なし）／`game.hud()` ＋ `{ mode, course, gun, who, result, stars, coins, hop }`／すぐ おわらせる |
| `museumGo(id, room)` / `museumState()` | ⑤ 館（aquarium / museum）の 入口か へやの まんなかの 手前へ／`{ fish, bones, done, rooms, intro }` |
| `fossilDig(site, key)` / `digTap(x, y)` / `digState()` / `fossilState()` | ④ ほる 画面を ひらく（key の 骨が 出る。いわとは むすばない）／マスを たたく（x 0〜6・y 0〜4）／`{ hp, area, taps, done, cols, rows }`／`{ pick, bones, dug }` の うつし |

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

1. `js/mg-xxx.js` を作り index.html / sw.js の minigames.js の後に登録。`class XxxTask extends TaskBase`（§12 の約束どおり）、`MG_TASKS.xxx = XxxTask`。
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

すまほの「イベント」から年間予定を開き、その月のイベントに参加する（UI-01 までは 町の「おまつり」ボタン）。会場3か所のしかけをタップし、好きな答えを選ぶと進行。開催期間は各月の1日〜月末。Save.events.activeAnnualを追加し、recordsは既存の`${year}-${season}`と別の`${year}-annual-${id}`キーにstamps/answers/claimedを保存。既存のコイン・所持品・四季記録を変換しない。キャンセル・期間外・重複回答は無効。受け取りは画面演出より先に保存するので連打や再起動で増えない。

PokaDebug.calendar('YYYY-MM-DD')で日付を固定し、annual()で現在のイベント・目的地・選択肢・取得数を読む。390pxで全12種類、375pxで七夕とハロウィンを実際のタップで完了し、保存・再開・翌年の持ち越しを確認する。

## ver2: 新ミニゲーム・難易度
economy.js の GameEconomy が報酬と難易度の値を管理する（[比較表](BALANCE.md)）。設定を開始時に保存するため途中変更は次回から反映。セーブには settings.difficulty と shops.link/relay を追加し、旧データは migrate が補完する。

arcade.js は world-expansion.js の後。SkyRelayTask は既存の TaskBase を継承する。なかよしパズルは専用の PuzzleScene（お客さんのラウンドなし）へ変更。配達は3列の移動・担当3人の交代・岩回避と6秒間隔の防御。左右キーで移動、上で交代、決定で防御も可能。

PokaDebug.shop('relay', lv) と mg() で配達を操作。パズルは PokaDebug.puzzleStart({practice,seed}) / puzzleState() を使用する。旧 shop('link') はシティの店内へ案内。店別BGMは SONGS.shop_<id>。

パズルのルールは puzzle-engine.js、景品と立体SVGは puzzle-prizes.js、受付/操作/保存は scene-puzzle.js。Save.d.puzzle を追加し、shops.link の旧記録は保持。毎秒と操作・中断時に時計と乱数状態を保存し、育成の経過時間も進める。料金・景品は保存成功を確認し、失敗時はロールバック。[設計・調査・バランス検証](design/features/puzzle-score-attack.md) を参照。

PokaDebug.pause(bool) は以前の停止状態を返す。テストで撮影する間だけ停止し、finally で戻す。外部フォントや描画待ちの時間をミニゲームの制限時間に含めないために使用する。

## ver2: 現代的なBGM

`modern-music.js` はsound.jsの後。ModernMusicが加算合成の楽器・ドラム・短い左右の残響・コンプレッサーとボイスの寿命を管理する。`music-arrangements.js` は各追加曲を定義するファイルの後、debug.jsの直前で読み、全32曲を編曲する。旋律以外に7th和音・ベース・パッド・ドラムを持つ8小節のループ（結果ジングルのみ短い一回再生）。音符の `+` は同時に鳴らす和音。

Soundは曲ごとにバスを作り、切替時に80msでフェードして音源/接続を破棄する。タイマーが遅れた場合は過去の音符をまとめて鳴らさない。保存項目は追加・変換せずsettings.bgm/seを引き続き使う。効果音・キャラの声は従来の音源を維持する。

PokaDebug.music(name|null)で試聴/停止、引数なしは再生状態。musicCatalog()は曲名・楽器・拍数。musicRender(name,秒数,wav=false)は同じ楽器・スケジューラでOfflineAudioContextへ合成しピーク/RMS/同時発音数を返す。wav=trueは試聴用16bitステレオWAVのbase64も返す。ブラウザ検査で全曲の無音・クリップ・発音上限、曲切替、設定保持を確認する。詳細・試聴は [MUSIC.md](MUSIC.md)。

試聴専用の `?audio-preview=1` はDOMContentLoadedでSave.fresh()をメモリに用意するだけで、Game.bootを呼ばない。保存読込・自動保存・visibility/pagehide保存の登録をしない。PokaDebug.persistedSave()でlocalStorageの内容を読み、通常ゲームから試聴→21秒待機→閉じる前後で保存内容の完全一致を検証する。
mg() の score は採点中の点数、歯医者の order.mistakes は誤操作数。テスト失敗時に残り秒数と合わせて表示する。動くばい菌はPokaDebugで座標を取得した同じフレーム内でDOMのPointerEventを送り、テスト環境の通信遅延をゲームの操作ミスにしない。

## 平和台の見本SVG

`heiwadai-art.js` と `heiwadai-assets-s.js` は WorldArt のあとに読み込み、見本の26種類・61パターンを登録する。元のSVGはtoolsから生成し、実行時はclassic scriptのデータを読むだけ。`HeiwadaiArt.model()` の originX/originY は元の足もとからの描画位置、footW/footHは地面の占有寸法。通常のviewBoxは asset-bbox.json を使用。座標・時刻をキーに含めない。素材の優先度とID対応は ASSET_KINDS.md、比較の再現は node tools/heiwadai-asset-screenshots.mjs。

TOWN-03で `heiwadai-assets-ab.js` を追加し、107種類・236パターンを登録済み。A・Bの比較は `node tools/heiwadai-asset-screenshots.mjs --ab`、スマホ一覧は `tools/heiwadai-preview.html?priority=AB`。

### 平和台の見本配置
`heiwadai-layout-data.js` は `tools/build-heiwadai-layout.mjs` で見本JSONと描画コードから生成する。地面のSVGをPath2D・Canvas模様へ変換し、世界座標でチャンクに描く。建物・小物は元SVGの足もと原点を保持し、屋根・旗・電線を最後に重ねる。`heiwadai-town.js` が旧ID・入口・交通・祭り・宝箱を接続する。`PokaDebug.heiwadaiView` は比較画像用に一時カメラと3人の見本位置で描画し、実際の状態は戻す。

`heiwadai-life.js` は8人の住民・5人の通行人、信号・電車・噴水・旗・ブランコと夜の光を担当する。ブランコだけ元SVGの座席と鎖を2組に分離し、支柱を含む3枚の有限キャッシュを回転して描く。住民は移動判定用の整数座標と描画用の小数オフセットを分ける。`PokaDebug.heiwadaiLife(time)` は検証時刻を固定でき、nullで実時間へ戻す。

## ver2: お店ごとのファイル

`minigames.js` は共通の絵・店主・ShopScene・ボタン・TaskBase・空の MG_TASKS を定義。その後の `mg-crepe.js` / `mg-dentist.js` / `mg-bakery.js` / `mg-florist.js` が元と同じクラスを定義し、それぞれ MG_TASKS に登録する。これらの後に world-expansion.js / arcade.js を読み込む。採点・注文・セーブの意味は変更しない。

## ver2: セーブのバックアップ

`save-backup.js` は設定メニューの前に読み込む。SaveBackup.encode/decode がゲーム識別子・書式1のJSONを扱い、既知の型・部屋・所持数・3人・中断盤面を検証してからコピーへ Save.migrate を適用する。未知の追加項目も保持する。確認後の install は localStorage へ書き込み、同じ文字列を読み戻せたときだけ Save.d を置き換える。失敗時は元の保存文字列を戻す。読み込みはおうち・町・タイトルのみ。KEY と SCHEMA は変更しない。

PokaDebug.backupText / backupDecode はテストで同じ処理を使う入口。`tools/check-save-backup.mjs` が旧セーブ・未知の追加項目・不正入力・容量不足を検査し、smoke はダウンロード→はじめから→キャンセル→ファイル復元をスマホ2サイズで検証する。

## ver2: ケーキ屋

`mg-cake.js` の CakeTask は TaskBase を継承。want/made の土台・クリーム・果物・個数・ろうそくを比較し、Lv1は果物、Lv2は土台とクリーム、Lv3以降はろうそくも選択する。Lv3〜5は注文が7/5/3.5秒で隠れ、再表示は既存の8点減点。CakeTaskの描画はCanvasと有限の果物アイコンのみ。店は町(10,32)の南向き入口から既存のStoreSceneへ入る。Save.shops.cake は追加項目で、旧所持金や既存の店記録は変えない。PokaDebug.mg().order に段階・注文・選択肢の名前を返す。

## ver2: びようしつ

`mg-groom.js` の GroomTask は指の移動線分を4px刻みで検査し、見本の輪郭に近い部分をカット済みにする。見本の到達率60点、3か所の乾燥20点、リボン20点から、はみ出しと時間の減点を引く。乾燥は押している間の実ゲーム時間で進む。Lvで輪郭・点数・許容幅・制限時間を変える。新規ショップは Save.fresh.shops.groom に追加。シティの建物 city_gallery のIDを保持して店の入口に変更し、旧位置が重なる場合は既存の安全な位置への補正を使う。PokaDebug.mg().order は線・乾燥位置をCSS座標で返す。

### WebKit のスモークテスト（T-02）
WebKitのオフライン模擬はfile://も遮断するため、ローカルファイル検査はHTTP(S)だけを遮断する。PWAマニフェストはHTTP(S)起動時だけ読み込む。2本指はChromiumではネイティブ入力、WebKitでは合成PointerEventで処理を検証する（捕捉APIのみ代替）。
`npx playwright install --with-deps webkit` の後、`npm run test:webkit` / `npm run test:webkit:full` を実行する。`tests/smoke.mjs --browser=webkit` はChromiumと同じPokaDebug/入力/シナリオを使用し、画像を `tests/screenshots/webkit/` に分ける。独自実行ファイルは `WEBKIT_PATH`。導入できない環境に限り `--skip-missing` で未導入を明示して終了できる（CIには付けない）。これは実機Safari/iPhoneの確認を代替しない。GitHub Actionsは両エンジンの全シナリオを必須として実行する。

### バーガー屋（V2-05）
`mg-burger.js` の `BurgerTask` は TaskBase を継承し、3〜7段の具材を下から積む。`want` / `made` は具材IDの配列で、順番違い・注文の見直し・時間経過を採点する。店内・専用BGM・購入食品を登録。シティ南の `city_reading` はIDと入口を維持してダイナーへ改装し、北側の図書館は維持。セーブは `shops.burger` の既定値追加だけ。PokaDebug.mg().order が注文名と積んだIDを返す。

### お店のレベル装飾（V2-06）
`ShopDecor` は既存の `shops[id].lv` から1/3/5の段階を求める。通常建物のSVGへ星・鉢植え・旗を加え、WorldSceneのキャッシュキーに有限の `shopTier` を追加。平和台は見本のSVGを変えず、別の有限キャッシュで重ねる。店内とミニゲームも同じ段階で描画。セーブ・建物寸法・通行判定は変わらない。PokaDebug.shopDecor(id)は段階と関係するキャッシュキーを返す。

### 毎日のスタンプ（V2-09）
DailyPlay は U.today() を日単位の数値に変換し、最後の取得日より新しい日にだけ daily の記録を進める。7日ごとの報酬は coins と bag へ加算。daily は追加項目だけで旧セーブの値を保持する。おすすめは日付と実装済み店舗表から決まり、ShopScene.enter で倍率を固定する。PokaDebug.dailyVisit / dailyState で日付境界と再取得防止を検査する。
### 町の人のセリフ（FEAT-03）
`townsfolk-data.js`（TOWNSFOLK_DATA・自動生成。元は `tools/feature-design/townsfolk-data.mjs`）と `townsfolk.js`（TownFolk）を daily-play.js の後に読む。Talk.run は初回とボス後は従来どおり、それ以外は3割がTALKSのヒント、7割がTownFolk.line（時間・天気・季節・おまつり・ボス・なかよし・施設の有無を U.condScore で比べ、人ごとに最近12件を避ける）。町のなかま（crowd）は役のセリフとcrowdNamesの名前。会話のあと35%で3人のひとこと（react・話した相手の person 条件あり）。PokaDebug.folkTalk / folkLast / folkLine で検査する。

### 町の人のおねがい（FEAT-04）
Save.fresh().folk（bond・req・done・barter・offered）を追加（migrateの補完だけ・SCHEMAは1のまま）。TownFolk.offerは1人1日1回、候補のchanceの最大値（10〜20%）で、3つまで。ことわると同じ日はもう一度たずねる（offered.wait）。signalは見本と同じ計算で手順を進め、Talk.runが会話・アイテムの消費・ごほうびを出す。いま進められる手順はTownFolk.STEPS（buy・give・talk・quiz・trade）。WorldSceneはTownFolk.mountで右上にノートのボタンを出し、drawNpcでTownFolkArt.marker（▼あいて・！まっている）を描く（白い「!」が優先）。UI.askにface・name・extraを追加。PokaDebug.folk / folkOffer / folkSignal / folkMarks。

### さがす・さわる・つれていく・しゃしん・物々交換（FEAT-05）
TownFolk.STEPS に find・tap・follow・photo・catch・dig を足した（catch・dig は needs の fishing・fossil で ③④ まで出ない）。TownFolk.spotsOn(map) が見本 spots() と同じ選び方（reach は入口と町の人の足もとからの BFS、seed は eventId＋うけた日、spotCache で1日固定）で きらきら（あたり1つ）・小物を返し、WorldScene.render が TownFolkArt.prop を SvgCache「folk:prop:<id>」で描く。tapAt は spotAt を町の人・なかまより先に見て goInteract → TownFolk.investigate（はずれは r.checked、さわったものは r.tapped）。こねこは WorldScene.follower（Walker・0.72倍）で、stepParty がいちばん後ろの子の元のマスを trail にためて1マスずつたどる。しゃしんは onArrive → TownFolk.arrived → refreshPhoto で photoSpot の間だけ右下にボタン。物々交換はおねがいが出なかったとき BARTER_CHANCE（10%）で UI.ask に tradeCard を添える。

### 魚の データ・絵・ずかん（FEAT-06）
`fishing-data.js`（FISHING_DATA・自動生成。元は `tools/feature-design/fish-data.mjs`）・`fish-art.js`（FishArt。見本 FishArtRef と同じ）・`fishing.js`（Fishing）を townsfolk.js の後に読む。Fishing.pool / pick / size / shadowOf は見本と同じ計算（rarity の重み・天気が合えば×2・りっぱなさおは rarity 3 以上×1.4・unlock）。Save.fresh().fish（rod・dex・keep・caught）を追加（migrate の補完だけ）。Fishing.record(id, cm) がずかん（n・max・first）といけす（keep）を進める。Menu.dex は「まもの／さかな」を切り替え、さかなは Fishing.dex（50マス・場所で絞る・つった魚だけ絵・NEW はきょう初めて）と Fishing.detail（UI.modal）。TownFolk.features().fishing はさおを持つまで false。

### 釣りざおと 釣り（FEAT-07 → UI-02 で 見おろしの まま つる ように 作りなおし）
Talk.run はプレゼントの後に Fishing.talked（ペンが rod=1 にする）。UI-02 で よこから 見る 釣りの 画面（FishingScene・Fishing.Game・draw・card・水を むくと 出る「つる」ボタン）を やめ、`fishing-line.js`（FishLine）を fishing.js の あとに 読む。FishLine は WorldScene の down・update・renderWater・renderFx・drawMember・interact・key・exit・render・updateEnemies を 外から つつむ（scene-world.js は かえない）。つりの ようすは sc.fishing（セーブしない）。
- 魚の かげ: spots の マップで ときどき 出る（SLOTS: いけ・かわ・さわ 2・うみべ 3・みなと 4 まで。いない ときも ある）。Fishing.pick・Fishing.size で 魚と cm を きめ、ながさ = cm × 0.8px（shadowLen。9〜128px）、はば 0.34 ばい（ほそながい 魚は 0.13）。水の 中に おさまる ばしょ（fits）だけ およぐ。はしると にげる。check は どの 魚も いちばん 大きい ときに 自分の 釣り場に おさまる ことを 見る。
- なげる: 水を 0.45びょう ながおし（ながおしの わ）→ 立って いる マスから 4.2マス いない なら その ばで、とどかなければ いちばん ちかい 立てる 岸へ あるいて（goTo の pending { type: "fishcast" }）なげる。キーボードは 水を むいて ok。さおを ふる（land_01 → jump_01）→ うきが とぶ → ぽちゃん。
- よって くる: あたまの まえ 80°・2.2マス いない・あいだが ぜんぶ 水 なら 気づく → ちょんちょん 0〜4かい（NIBBLE_W。たまに きが かわる fickle）→ うきが しずむ（「！」・ボタンが きいろ）→ BITE（1びょう）いないに「つる」。はやいと にげる・おそいと にげられる・かげの 上に おとすと びっくりして にげる・あるくと さおを しまう。うきが 水に ある あいだと じまんの あいだは まものが うごかない。
- じまん: 魚が 水から とびだして 3人の ところへ → render を ZOOM（1.9）ばいに して せんとうの 子へ よる（DOM は そのまま）→ drawMember で せんとうは jump_01 で 頭の 上に 魚（SvgCache「fishhold:<id>」は 魚ごとに 1つ）・2人は ぴょんぴょん → UI.say で じまんの ひとこと（QUOTES は 魚ごとの しゃれ・TAIL は 3人の くちぐせ）→ Fishing.record（いけすが いっぱいなら にがす）→ TownFolk.progress({ do: "catch" })。
- こうかおん: Sound.se を つつみ、fish_cast・fish_plop・fish_nibble・fish_bite・fish_hook・fish_splash・fish_catch・fish_flee・fish_reelin を WebAudio で つくる（音声ファイルは ない）。
- 「つる」ボタン（.act-btn.fish-go-btn・右下の まる）は うきが 水に ある ときだけ。Fishing.refreshButton／hideButton／button は FishLine の もの（fossils.js の「ほる」は そのまま）。PokaDebug は fishState・fishAuto・fishSpawn・fishAim・fishCast・fishPull。

### いけす・うる・りっぱな つりざお（FEAT-08・UI-02 で うるのは スーパーに）
Fishing.KEEP_MAX（30）と keepCount()。つった ときには うらない（どうぶつの森と おなじ）。スーパー（shopId が market）で いけすに 魚が いると StoreScene.talk が Fishing.sellChoice(this)「さかなを うる」を 足し、Fishing.sell()（1ぴき うる・ぜんぶ うる。すいぞくかんに まだ いない 魚には しるしと たしかめ）→ Fishing.sellFish(id, n) で Save.addCoins(f.sell × n)。きふは すいぞくかん（Museum）。りっぱな つりざおは Fishing.proShop()（rods[1].get.shop の建物のマップとお店）→ StoreScene.talk が Fishing.proChoice(this) を選択肢に足し、Fishing.buyPro(owner) で rod=2。ずかんには いけすの数（.fish-keep）。

### 骨の データ・絵・かせき ノート（FEAT-09）
`fossil-data.js`（FOSSIL_DATA・自動生成。元は `tools/feature-design/fossil-data.mjs`）・`fossil-art.js`（FossilArt。見本 FossilArtRef と同じ）・`fossils.js`（Fossils）を fishing.js の後に読む。Save.fresh().fossil（pick・bones・dug）を追加（migrate の補完だけ）。Menu.dex は まもの／さかな／かせき、かせきは Fossils.note（10種の骨格・ない骨は点線・そろった！）と Fossils.detail（UI.modal）。TownFolk.features().fossil はピッケルを持つまで false。

### ピッケルと ほる（FEAT-10）
Fossils に見本 FossilRef の rng・rocks・pick・Dig・drawDig・rockSvg・pickSvg をそのまま入れた。Talk.run は Fishing.talked の次に Fossils.talked（ケロスケが pick=1）。いわは Fossils.candidates(map)（入口から行ける・水いがいのかべのとなり・水のとなりでない・ワープ/人/宝箱などのまわりでない・ふさいでも道がきれない）から見本 rocks で日づけごとに選び、Save.d.fossil.dug.at[map] の分をのぞく（rocksOn）。WorldScene は this.rocks と rockAt(x, y) を持ち、walkable・enemyCan・町の人のさんぽで通れなくする（map.isSolid は変えない）。描画は SvgCache「fossil:rock」。タップ／ok／「ほる」ボタン（.act-btn.fossil-go-btn。Fishing.refreshButton の後の Fossils.refreshButton。「つる」が出ている間は出さない）→ interact({type:"rock"}) → Fossils.dig（UI.modal＋canvas の digModal → card か おまけ → dug に入れて this.rocks から消す → TownFolk.progress({do:"dig"})）。「つる」も .act-btn（下のまん中）に移した。

### ② との つなぎ・物々交換（FEAT-11）
TownFolk.have().bone は Save.d.fossil.bones。データの give.bone:"dup"／get.bone:"missing-same-dino" は Fossils.dupTrade(own)（データ順で最初の「2こ以上の骨」と同じ恐竜のまだない骨）で決まった2つにする（TownFolk.resolve）。canGive は dupTrade がある時だけ true。こうかんで Fossils.take／Fossils.give → Fossils.card。tradeCard の絵は FossilArt.partSvg、名前は Fossils.boneName。

### 水族館と 博物館: 町の 建物と 館の 中（FEAT-12）
`museum-data.js`（MUSEUM_DATA・自動生成）・`museum-art.js`（MuseumArt。見本 MuseumArtRef と同じ）・`museum.js`（Museum）を scene-world.js の前に読む。museum.js が GROUND／SOLID_CH（かべ X）・MAP_DEFS.aquarium／museum（indoor）・TALKS（館の人）・SONGS（music-arrangements に aquarium／museum の profile と D の和音）・WorldArt.exhibit を足す。町は town-renewal.js の harbor_aquarium／city_museum（act: indoor）と town-renewal-art.js の facades。WorldScene: enterDoor の indoor → Museum.enter、drawGround の最初に Museum.floor、render は walk の展示を床の上に先に・かべ（Museum.wall）と展示を y順に、spriteCanvas の exhibit は objCanvas("exhibit", { id, bits })。館の中は天気・季節の葉・夜の色なし。へやの案内は Museum.arrived（onArrive）→ .museum-intro、Save.d.museum.rooms。

### 水族館と 博物館: 寄贈（FEAT-13）
Talk.run の最初で role: "donate" の人は Museum.talk（first／all／none／ask → Museum.donate の UI.modal。.dn-grid／.dn-list）。giveFish／giveBone は fish.keep／fossil.bones を減らして Save.d.museum に日づけ、骨がそろうと done と doneCard（.dn-done）。WorldScene.exBits と Museum.shown・refresh で寄贈の後に新しい絵を読んでから切りかえる。水そうは Museum.art の swim（魚なしの絵＋slots・water、id と bits でおぼえる）と drawStatic の後の Museum.drawFish。Fossils.owned（持っている＋寄贈した骨）をノート・カード・ほる・物々交換に使う。

### 水族館と 博物館: 展示を しらべる・つなぎ（FEAT-14）
Museum.at（walk でない展示のはんい）と canShow（fish／dino／info）。interactFront は WorldScenery.at の前、tapAt は いわの後に goObject(o, "exhibit") → interact → Museum.show。水そうは .ex-card（Museum.tankSvg: 町と同じ魚なしの水そう＋町と同じ大きさの魚）と .ex-list → Fishing.detail（寄贈した魚に「すいぞくかんに いるよ」）。骨格の台は Fossils.detail(id, { have, museum: true })、かざりは .ex-card.rock と MUSEUM_DATA.info。寄贈で TownFolk.signal({ do: "donate", fish／bone })。

### 射撃場: じゅうの 絵・町の 建物・ロビー（FEAT-15）
`range-data.js`（RANGE_DATA・自動生成。元は `tools/feature-design/range-data.mjs`）・`gun-art.js`（GunArt。見本 GunArtRef と同じ）・`range.js`（ShootingRange。見本 RangeRef の 弾道と 絵。2番で Game・bot・draw を足す）を museum.js の後・scene-world.js の前に、`scene-range.js`（RangeScene・SCENES.range）を fossils.js の後に読む。シティの `city_range`（10,6・5×4・act: range）の入口は WorldScene.enterDoor → Game.goto("range", { back })。RangeScene は canvas に ロビーの うしろ（ラビは SvgCache「rg:staff」）を描き、update で はじめて Game.trans が なくなったら lobby（初回だけ RO の talk.first → Save.d.range.safety）→ pickWho（.rg-who）→ pickGame（.rg-tabs／.rg-courses／.rg-rule／.rg-guns／.rg-detail／.rg-hop）。ロックは cats.*.unlock と Save.d.range.best、ホップ ダイヤルは Save.d.range.hop[じゅう]。Save.fresh().range（safety・plays・best・hop）を追加（SCHEMA は そのまま）。sound.js に rg_ の 8つ。check.mjs は RANGE_DATA と GUN_LIST.md の 弾道の 表（0.1cm）と 絵を しらべる。

### 射撃場: あそぶ 画面（FEAT-16）
ShootingRange に見本 RangeRef の rng・gauss・Game・SKILL・bot・view・proj・draw* を そのまま足した（range.js は見本と名前以外同じ）。RangeScene.start が ShootingRange.Game（W: G.W・H: G.H）を作り、update で input（.range-scene の ドラッグ・pointerdown の ボタン・キー・PokaDebug.rangeInput）→ game.update → game.take()（RANGE_DATA.sound。あたりは delay 秒あと）→ refresh（game.hud() を DOM に。かわった時だけ）。render は ShootingRange.draw(ctx, game, art) で #screen に描き、art.img は その しゅもくの 的（SvgCache「rt:…」はば 400px）と "fpv"（SvgCache「rg:じゅう:だれ:いろ」）。phase が end で finish: Save.d.range.plays・best（score の むき・ブルズアイは X）・GameEconomy.pay("range", 1, ★, difficulty)（shopBase.range = 60）→ .rg-result／.rg-sheet（もう いちど／えらびなおす／おわる）。✕ は UI.confirm で ロビーへ（コインなし）。

### 射撃場: RO の 号令・おうえん・つなぎ（FEAT-17）
RangeScene.ro（ready 0.8秒 → areYou 0.8秒 → null）の あいだは game.update を よびつつ standby の 時間を もどす（ねらう・のぞくは できる）。.range-cmd は cmdHtml（ro・phase standby・mode done）。finish は きろく・コイン・TownFolk.signal({ do: "range", stars }) の あと mode "done"（アンロード。ショウ クリア。1.2秒）→ showResult。events が あたり 3かいに 1かい hit・IPSC の A 4れんぞく／スチールの のこしなし combo、hurry は のこり 10秒（シリーズごと）で cheerSay（のこりの 2人の どちらか・.range-bubble 1.8秒・かおは RangeScene.CHEER_FACE）。

### おうちの会話データ（FEAT-02）
`home-talk-data.js`（HOME_TALK_DATA・自動生成。元は `tools/feature-design/home-lines.mjs`）を home-life.js の前に読む。HomeLife.talkCtx が時間・天気・季節・おまつり・部屋・近くの家具・state・できごとをまとめ、U.condScore / U.condPick（② と共通）で重み 1＋2×一致数、さいきん40件を避けて選ぶ。くせ（わんこの howl・sniff→sniff-scold、がちゃんの alone→not-alone・rain→thunder、ごじの prefix/suffix）は voice の値で動く。できごとはシーンの時計 life.time で覚え、セーブしない。PokaDebug.homeTalk(id) / homeLines(id) で検査する。

### おうちの吹き出し（FEAT-01）
`HomeBubbles` は `tools/feature-design/home-bubble-ref.js` のCanvas描画と候補配置を移植。`HomeLife` が頭の投影・表示寿命・2つまでの制限・かけあいの待ち行列を管理する。会話ログはシーン内だけ、セーブの形は変えない。PokaDebug.homeSay / homeTalkLog / homeBubbleState で全6種類と通常・みまもりの配置を検証する。
CIは両ブラウザの全シナリオを4分割し、各シナリオ終了時にブラウザプロセスも閉じて描画資源を解放する。`--list --full --shard=1/4` で対象一覧を検査できる。リトライ・失敗無視は行わない。

テスト専用のPlaywrightを1.63.0へ更新。旧1.56.1のLinux WebKitで描画プロセスのクラッシュが複数発生したため、ブラウザの診断ログも保存する。ゲームの実行時依存や保存データは変わらない。

### おてつだいのレベル報酬
`shop-rewards.js` の ShopRewards が8店舗×Lv5/10/15/30の非売品家具32種を登録する。SHOP_LV_REPは旧Lv1〜5の値を保ち、Lv6〜30の必要評判を追加。ShopSceneの表示・育成はLv30まで、workLv（注文と報酬）はLv5まで。ShopRewardArtは4種の立体モデルと8種の店舗モチーフを有限キャッシュで描く。
Save.fresh().shopRewardsは受け取った家具IDの真偽値。結果画面で到達した節目を自動配布し、メニュー→ようす→おみせの ごほうびで既存プレイヤーも過去の評判に応じた報酬を受け取れる。家具と受取記録を同時保存し、コインには触れない。Save.KEY/SCHEMAは維持。PokaDebug.shopRewards(shop)/shopRewardClaim(shop)/shopRewardOpen(shop)とshop(shop,30)、mg().workLvで検証する。

## ネリカスタウン・池袋の交通

district-travel.js は全体地図の後に読み込み、町IDを変えずに名称・接続・地図の配置を更新する。池袋の屋外徒歩ワープはなく、館から町へ戻る室内出口は維持する。Transit.fare/payは池袋への電車だけ500コインを保存し、中止・残高不足では変更しない。帰路は無料。PokaDebug.districtTravel/station/atlas と2画面のスモークで確認。

## マックさん

平和台 heiwadai_diner の act.variant=mac を StoreScene→ShopScene に渡す。MacKitchenRound の同一tickで具材とフライヤーを進める。受け皿の左右・ドラッグ、6〜8秒の揚げ時、10秒後からの冷め、誤順の積み直しを評価。Sound.noiseの短い音と文字を共用し、確認・非表示時は進めない。既存 burger の評判・レベル・中止時精算を引き継ぐ。従来のBurgerTaskは他店で保持。PokaDebug.mac/macState/macAdvanceとcheck-mac・2サイズスモークで検証。

## 町の長い会話とクイズ

`town-dialogue-data.js` の60会話／8相談を `TownDialogue` が文脈ごとに選ぶ。`UI.say` の任意actionは最終行だけ表示し、通常の読み送りを変えない。Talkは初回・贈り物・既存おねがいを優先し、無関係なTownFolk.reactを後付けしない。相談は保存されたノードと選択経路を進め、結末別の再会台詞を読む。

`town-quiz-data.js` はdocsの2JSONから生成。`TownQuiz` は既存town_walker3の会話を出題パネルへつなぐ。activeに出題時点の問題スナップショット・選択肢順・抽選済み景品・開始日を保存し、回答時にactive消去とlast／コイン／袋／家具を同時保存する。Save.writeの失敗が例外を返さないため保存結果のtokenを読み戻し、失敗時は状態を復元する。日次枠は回答した時に消費。UIを閉じてもactiveは保留として残る。

限定家具5品はQuizPrizesへ登録し、HomeDesignと同じ投影で描画。5品×2方向の有限キャッシュ。PokaDebug.conversation／quizState／quizStart／quizAnswer／quizCancelを検証の入口とする。既存Save.KEY／SCHEMAは維持し、conversationsとtownQuizを追加する。

## クレーンゲーム（Meeときょれじゃ・UI-03・UI-07）

読み込み順は `arcade-prizes.js` → `crane-physics.js` → `crane-art.js` → `crane-machines.js` → `crane-scene.js`（mama-schedule.js の あと、debug.js の まえ）。館の 絵は `arcade-art.js` → `ike-arcade.js`（ike-mall.js の あと、aqua-art.js の まえ）。トップレベル名は `ArcadePrizes`・`CranePhys`・`CraneArt`・`CraneMachines`・`CraneCam`・`CraneScene`・`PrizeArcade`・`ArcadeArt`・`IkeArcade`。

- `ArcadePrizes`（arcade-prizes.js）: 景品の 家具 18しゅ（`ITEMS`: `ike_chibi_<だれ>_<0〜3>`・`ike_mini_<だれ>`・`ike_plush_<bear|panda|penguin>`）。絵は `svg(id, dir)`（3人は Chara.svg の 表情・ポーズ・こもの、町の人は Art.npcSvg。viewBox は 絵の はんい `crop`、ぬのの タグ・つや・ミニは キーホルダーの わ）。家具は `cityItem.type = "arcadeplush"`（おうちの 立体は `IkebukuroItemArt.model` から `ArcadePrizes.model`）。コインの 景品は `coinState()`・`coinLeft()`（`Save.d.arcade.coinDay`・`coinToday`。1にち `COIN_DAY_MAX` = 600）。

- `CranePhys.World`: 位置ベースの 物理（Verlet・1フレーム 4サブステップ×2回。スウィートは 3）。景品は 小さな たまの あつまりで、shape matching（Müller 2016 の 回転の とりだし。1かいに まわれる 角度に 上限）で 形を たもつ。stiff 1 = かたい はこ、0.3〜0.7 = ぬいぐるみ。当たりは 平面・箱（かたむき あり）・カプセル（アームの ぼう）・球・まわる 円ばん・穴の ある 床・つつ。うごく もの（move: true）は 前の 位置を おぼえて まさつで 景品を はこぶ。ねむった 景品は 計算しない（まわる 台の 上なら 台と いっしょに まわす）。とおい 当たりは まわりの 箱で はぶく。
- `CraneMachines.DEFS`（12台。`id`・まえの 8台と おなじ 台は `legacy`: 1・4・6）と しかけ: `ClawRig`（くるま・ケーブルの ふりこ・アームの 角度。つかむ ときは うでごとに おされる 量で とまる＝アームの つよさ）・`TrypodRig`（12の ランプ・6本の アーム）・`SweetRig`（まわる 台・ショベル・おしだし）。`CraneRound` は 1かいの あそび（`move` → `stop` → `open` → `down` → `close` → `up` → `top` → `carry` → `release` → `settle`、トライポッドは `spin`／`stopped`、スウィートは `swing` → `dip` → `scoop` → `lift` → `swing2` → `dump` → `back` を 3かい → `watch`）。1/60びょう ずつ すすむので おなじ 台・おなじ そうさ なら おなじ けっか（たねは 台と セーブの ようすから）。
- セーブ: `Save.d.arcade.boards[台]` は 景品ごとの [sid, 形, まん中 x・y・z, 向き]（0.1cm・0.001）と しかけの ようす（トライポッドの アーム・スウィートの 台の 角度）。`miss[台]` は はずれの かず（4で かならず つよい）、`got[台]` は とれた かず。あそんで いる あいだは `active.cp`（`CraneRound.snap()`）に 2びょうごと・おした とき・1かい おわる ごとに のこす。`PrizeArcade.finish` が ごほうび・台の ようす・はずれの かずを 1かいの `Save.write()` で のこし、`settled` で 2かい もらえない。
- 画面: `CraneCam` は まっすぐ まえ（または よこ）を むく ピンホール カメラ（たての せんは たてのまま。目の たかさは 台の 8わり）。かべ・ゆかは しまに わけて アフィンで はる。ぬいぐるみは カメラを むく 絵（うらむきで うらの 絵）、星の クッションは おもて・よこの そう・うらを かさねる、はこは 見える 面だけ。アームは ひらたい いたと ゴムの ツメ、3本アームは UFO の あたま。SvgCache の キーは `crane:<TEX の なまえ>`・`crane:hall:<台>`・`crane:door:<景品>` だけ。
- 景品: まぜて ある 台（ちいさな ぬいぐるみ 4しゅ・ミニマスコット 3しゅ）は 形ごとに 景品が ちがう（`SHAPES[形]().prize`）。`CraneRound.gotShapes`（`snap()` の `gs`）で とれた 形を のこし、`PrizeArcade.prizesOf(台, round)` が 景品に する。コインの 台（`machines[i].coins`: メダル 20・たからばこ 300）は もちものに ならず コインが ふえる。`PrizeArcade.coinOpen(台)` で 1にちの のこりが 1こぶん ない ときは はじめない。
- 台の いれかえ（UI-07）: `board()` に 台の `id`。`CraneRound` は id が ちがう 台の ようす（と `cp`）を つかわない（id の ない ふるい ようすは legacy の 台だけ）。`active` には `def`（台の id）。`PrizeArcade.upgrade()`（`norm()` から）は def の ない とちゅうの 1かいが いれかわった 台なら 100コインを かえして `refunded` を たてる（館に はいった ときに しらせる）。`Save.SCHEMA` は そのまま。
- 館（UI-07）: `VenueHalls.defs.arcade` を `IkeArcade.install()` が 斜めの 館に する（`iso: true`・`art: ArcadeArt`・`guide: MallGuide`・28×22 マス・`rows` の 文字 `.` じゅうたん／`w` とおりみち／`m` 入口の マット／`#` カウンターの うちがわ）。`ArcadeArt` は `Object.create(MallArt)`（くみたて・町の人・ベンチ・あるく おきゃくさんを つかう）。什器 `crane`（`machine`・`dir: 'y'|'x'` = まえの 向き。台の なかの 座標 u・v・z を `frame(f).Q` で ゆかへ。ガラスの 中に 景品の 絵・アーム・かんばん。でんきゅうと とちゅうの しるしは `L.crane`）・`gacha`・`photobooth`・`counter`・`changer`・`drinks`・`apillar`・`exitsign`・`divider`・`asofa`。キーは `arcade:<kind>:<w>x<h>:<台>:<dir>:<variant>:<item>`（有限）。床は うちゅうの じゅうたん・台の まえの ひかり、かべは ネオンと ポスター（`wallSvg`）。クレーンを しらべると `PrizeArcade.open(台, { venue, floor, back, at })`（もどると 台の まえ）。
- けいひん カウンター: `BUY_SHOPS.ike_arcade`（まえの けいひん 5しゅを コインで こうかん。`IkeArcade.EXCHANGE`）。BGM は `SONGS.arcade_hall`（`disc_turkish` の 写しを ゲームセンターの 音に。館・あそぶ 画面・カウンターで おなじ 曲）。
- PokaDebug: `arcadeStart(台)`・`arcadeState()`・`arcadeMove(dx, dz)`（cm）・`arcadeDrop()`・`arcadeAim(景品)`・`arcadeLuck(つよい)`・`arcadeFast(ばい)`・`arcadeCam('front'|'side')`。


## ころころ フルーツ（ネリカスタウンの パズルの おてつだい・MG-01）

- 物理 `KorokoroWorld`（`js/korokoro-physics.js`）: はこの 単位は はば 100・たかさ 110（画面の 大きさに よらない）。1/480 びょうの ステップで 位置の かさなりを なおし（重さ = 半径²）→ 速さに もどし → はねかえり（はやく ぶつかった ときだけ）と まさつ（ころがる 回転も）。かさなりを なおした ぶんで はじけ とばない ように、はなれる はやさは `depen` まで。おなじ だんが ふれると（すきま 0.4 まで）フレームの おわりに 1つに（1つの 玉は 1フレームに 1かい。大きく なる とちゅうは がったい しない）。すいか どうしは はじけて きえる。ふちより 上に 玉の てっぺんが 2びょう いると `overflow` → `spill()` で ゆかを ひらいて ぜんぶ おとす。描画・時計・セーブに 依存しないので Node の 検査と おなじ けっか（`rng` は おちてくる だんだけ）。
- だん（`KOROKORO_TIERS`）: さくらんぼ・わんこ・いちご・がちゃん・ごじ・みかん・りんご・なし・もも・メロン・すいか。おちてくるのは 小さい 5しゅ（くだもの 2・かお 3）。ポイントは (だん+1)(だん+2)/2。
- 絵 `KorokoroArt`（`js/korokoro-art.js`）: くだものは 100×100 の SVG（かお つき・線は 画面で 1.1〜2px）。3人の かおの 玉は `CHARA_DATA` の あたま・みみ（ごじは 目の でっぱり）と 表情の ぶひん（`faceOf`）で、からだは 描かない。表情は normal・happy（がったい した すぐ）・surprise（おちている・ぶつかった）・sad（ふちの ちかく・あふれそう）・sleep（12びょう しずか）。キャッシュの キーは `koro:だん:表情:ピクセル` だけ。回転と 大きく なる とちゅうは drawImage の 変形。
- おてつだい: `KorokoroTask`（TaskBase）が おきゃくさん 1にんの ちゅうもん（`KOROKORO_ORDERS`: レベルごとの だんと じかん）。はこは `ShopScene.board`（`KorokoroBoard`）で、おきゃくさんが かわっても のこる（ShopScene は work いがいの フェーズでも `board.tick`・`board.render` を よぶ）。ちゅうもんの だんが はこに できると とどく（まえから のこって いた 玉でも よい）。点は 100 − 時間 − あふれ×30。時間ぎれは とどいた かずと はこの いちばん 大きい 玉の ちかさで 10〜58。もも・メロン・すいかで チップ（`task.bonusTip` を ShopScene.judge が たす）。2つの かおが がったいすると その子が カウンターで よろこぶ。ことばは `SHOPS.korokoro.lines`、けっかの ポイントと さいこうは `board.summary()`（`shops.korokoro.pts`）。
- 町: `KorokoroTown`（`js/korokoro-town.js`）が `NerikasuTown.install` の まえに nerikasu_home5 を お店に する（足もと・入口・大きさは そのまま）。建物の 絵は `tools/town-design/nerikasu-buildings.mjs` の `korokoro()` → `node tools/build-nerikasu-town.mjs` で `js/nerikasu-town-art.js` に 生成。
- PokaDebug: `shop('korokoro', lv)`・`mg().order`（はこの CSS 座標 `box.x0`/`y0`/`unit`・`bodies`・`held`/`next`・`canDrop`・`want`・`spills`・`points`・`made`）・`koroSetup({ bodies: [[だん, x, y], …], held, next, seed })`。
- 検査: `tools/check-korokoro.mjs`（物理・がったい・あふれ・ちゅうもん・こどもの はやさの ボットの バランス・絵・お店・町・セーブ・BGM）・スモーク `nerikasu-korokoro-390` / `-375`。

## サンシャインいけぶ（斜めの 館・UI-04）

読み込み順は `iso-venue.js` → `mall-art.js` → `mall-music.js` → `ike-mall.js`（crane-scene.js の あと、item-dex-sources.js の まえ）。服の 絵の `ike-wear.js` は `ikebukuro-catalog.js` の すぐ まえ。トップレベル名は `IsoVenue`・`IsoVenueScene`・`MallArt`・`MallMusic`・`IkeMall`・`MallGuide`・`IkeWear`・`WearMannequin`。

- `IsoVenueScene extends VenueScene` を `SCENES.venue` に する。部屋（`VenueHalls.defs.<館>.floors[階]`）に `iso: true` が ある ときだけ 描きかた・タップ・カメラを かえ、ほかの 館（家電・クレーン・学校・保育園・ままの 職場）は いままでと おなじ。
- 投影は `HomeDesign.A`・`B`（おうちと おなじ）。1マス = 48（おうちの 単位）。部屋は `w × h` マス、`rows`（'o' は ふきぬけ・ほかは 床の 材質の 文字）、奥の かべは 北（y=0）と 西（x=0）だけで 高さ `wallH`。床と かべは 部屋ごとに 1まい 描いて 1024px の タイルに きりわけた 静止画（`IsoVenue.build`・`IsoVenue.drawStatic` が 見える タイルだけ 描く。こまかさは 1.2 まで・2フロアぶん おぼえる）。6MP を こえる 1まいの canvas は まいかい 描くと とても おそい（5〜8ms）ので わける。
- 什器 `{ kind, x, y, w, h, height, z?, over?, walk?, action?, label? }`。奥行きは 床の はこどうしの 前後（x か y で まるごと 小さい ほうが さき）で ならべ（`IsoVenue.order`）、`over` は 頭の 上（名前の いた・つりさげ かんばん）。3人の まえに ある 高い もの（70 より 高い）と `fadeOver` の いた（店の 名前の いた・つりさげ かんばん）は すける。タップは 箱の 投影（エスカレーターは ななめの 本体だけ: `MallArt.hit`）。
- `MallArt`: 什器の 絵は `MallArt.M[kind]`（iso の SVG。キーは `mall:<kind>:<w>x<h>:<variant>:<shop>:<item>:<dir>` だけ）、うごく ところは `MallArt.L[kind]`（ふんすいの 水・ステップ・かんばんの 字）。店の かべは `SHOP[店].wall`（clothes・furniture・menu・books・toys・market・game）。品物は 家具＝`HomeDesign.model`（おうちと おなじ 立体）・服＝マネキン（`WearMannequin.svg(品物)`・キー `mannequin:<品物>`・大きさは `MallArt.mannequinSize`）・たべもの＝アイコン。店の 入口の はしらと 名前の いたの 高さは `MallArt.FRONT`（236。店の 中の マネキンに かからない）。買い物の 人（`crowd`）は とおれる マスを あるく（セーブしない）。
- `IkeMall`: フロアは 45×31 マス（カメラの 倍率 0.5）。1F（おおどおりの 店 4: 服の 店 はば 10・おくゆき 8、マネキンの 台は 入口の まえの 列・家具 はば 14、ふんすい ひろば・ステージ・大がめん・エスカレーター・エレベーター ホール・いりぐち）、2F（すばーたっくす・でぃっぱーどん・たぴ・らーめん・フードコート）、3F（いけぶくろ マルシェ・なかよしパズル・ほんの もり・おもちゃの ゆめいろ・ひとやすみ）。品物・メニューは `IkebukuroCatalog.groups`、店の 画面は これまでの `BUY_SHOPS.ike_*`。`MallGuide.open(sc)` は フロア案内（上から 見た 図・番号・マーク）。
- `IkeWear`（ike-wear.js）: 池袋の 服 9ちゃくの 絵・名前・せつめい（`LIST`）。`WEAR[id] = ctx => IkeWear.wear(店, 番号, ctx)`。chara.js の WEAR と おなじ かさね（behind・sleeve・torso・top）で、たての 目安は 見える 上の はし（わんこ・がちゃんは あたまの した）から 胴の したまで（`frame`）。そでは `sleeves(ctx, 色, { len, puff, cuff, frill })`（だ円の うでと ごじの よこの うで）。うしろ すがた（`view === "back"`）・よこむき（`dx` で まえの かざりを ずらす）も 描く。
- `WearMannequin`（ike-wear.js）: かおの ない マネキン（たまごの あたま・くび・胴・うで・スタンド）。`P` が PROFILE と おなじ 形（torsoPath・arms・a の 目安）なので、どの WEAR も そのまま きせられる（正面だけ）。家電の 館の スマホの 展示（venue-hall-art.js）も マネキン。
- `MallMusic`（mall-music.js）: 店内 BGM。`SONGS.mall_1f`（ヘンデル「ガヴォット」）・`mall_2f`（ジョプリン「エンターテイナー」）・`mall_3f`（チャイコフスキー「きの へいたいの マーチ」）。音は Mutopia Project の LilyPond 原本の まま（`source` に 出典）。`FLOOR[階]` を 部屋の `bgm` に、`SHOP[店]` を `SONGS.shop_ike_<店>` に する（レジの 画面でも おなじ 曲。`Sound.bgm` は おなじ 曲なら やりなおさない）。
- セーブは ふえない（館に はいる ときの `Save.d.world` は そとの 入口）。パズルから もどる ときは `venueReturn.at` の マスに たつ。
- PokaDebug: `venue('mall', 階)`・`venueState()`・`venueVisit(label)`・`venuePoint(x, y, label?)`（タップの 画面の 位置）・`venueWalk(x, y)`・`venueIso()`（iso・ready・floor・leader・crowd・holes）。

## サンシャインいけぶ 12F・13F すいぞくかん（UI-05）

読み込み順は `ike-mall.js` → `aqua-art.js` → `ike-aquarium.js`。トップレベル名は `AquaArt`・`IkeAquarium`。`IkeAquarium.install()` が `VenueHalls.defs.mall.floors[12]`・`[13]` を 足す（`iso: true`・`aqua: true`。13F は `noElevator`・`sky`）。

- 順路: 12F（エレベーター → いりぐちと かんちょう → いその ひろば → だいすいそう → くらげの へや → まるい すいそう → しんかい → トンネル → かいだん）→ 13F（かわと たき → いけと たんぼ → てんくうの テラス → かいだん）→ 12F（おみやげ → でぐちの ゲート → エレベーター）。へや（`IkeAquarium.ZONES`）は フロアマップの いろと、はじめて 入った ときの 案内（`Save.d.museum.rooms["aquarium.ike<階>_<へや>"]`・`Museum.showIntro`）。ゆかの やじるしは `decals`（kind "arrow"）。
- かべの 水そうは `walls.north / west` の `{ kind: "tank", obj, style }`（`AquaArt.wallTank`: `MUSEUM_DATA` の 水そうの 魚のうち きふした ものだけ `FishArt.svg` で およぐ）。ゆかの 水そう（lowtank・xtank・islandtank・jellycol・pedestal2）は `obj` で おなじ。しらべると `IkeAquarium.show(f)` → `Museum.showTank` / `showInfo`（へやの なまえは あたらしい へや）。かんちょう（`action: "curator"`）は `Museum.talk(n, { mapId: "aquarium" })`。
- 魚の 絵は 1ぴきごとに `AquaArt.fishSvg`（`SvgCache` の キーは `aqfish:<魚>:<はば>` だけ）。
- 13F へは エレベーターが いかない（`noElevator`）。フロアマップで 13F を えらぶと、12F の かいだんを のぼった ところ から あるく。
- みなとの 建物 `harbor_aquarium` は `act: { type: "visit" }` の おしらせ（12かいに おひっこし）。`WorldScene.prototype.enter` を つつみ、`map: "aquarium"` の セーブは 池袋の サンシャインいけぶの まえ に かえる（`MAP_DEFS.aquarium` は のこす）。みなとの 町の人の ことば `tf0381`（すいぞくかんが できて みなとが にぎやかに）は `TOWNSFOLK_DATA` が 自動生成なので install で「12かいへ おひっこし」に かえる。
- PokaDebug: `museumGo("aquarium", へや)`（あたらしい へやの id。むかしの へやの 名前も うけつける）・`museumDonate()`・`museumShow(objId)`・`aquaTank(objId)`（`{ here, floor, fish }`）。

## ネリカスタウンの実寸アセット

`nerikasu-neighborhood.js` の後に `nerikasu-town-art.js` → `nerikasu-town.js`。原画は `tools/town-design/nerikasu-assets.mjs` / `nerikasu-props.mjs` / `nerikasu-buildings.mjs`、生成は `tools/build-nerikasu-town.mjs`。HeiwadaiArtの既存bboxモデルへ別IDで登録し、共通defsは維持する。NerikasuTownは22棟と駅前の歩道・小物を接続する。駅14×5と駅東の1戸の敷地のみ変更し、入口と営業機能を既存IDで維持。昼夜は2状態の原画を先読みし、列車は座標だけを動かして線路内へクリップする。PokaDebug.nerikasuArtは描画寸法と有限キャッシュの読取用。

## 池袋の 町（配置イメージどおり・TOWN-IKE-01）

`ikebukuro-district.js` の あとに `ikebukuro-town-art.js`（`IKEBUKURO_TOWN_ART`・自動生成）→ `ikebukuro-town.js`（`IkebukuroTown`）。npc-cast.js より まえ（あたらしい 人にも 見た目が つく）。

- `IkebukuroTown.install()` が `MAP_DEFS.city` を 96×58 で 作りなおす。旧IDの 建物は act・label・sign を そのまま 場所だけ うつし、絵は `asset: "ikebukuro.<名前>"`（HeiwadaiArt の bbox モデル。ネリカスと おなじ 登録）。サンシャインいけぶは 入口 2つ（`doors`）。
- 道は `ROADS`（明治通り・東通り・なかどおり・よこちょう・サンシャイン60どおり・緑の大通り）を TownRoads へ。ななめの 交差点の かど（`def.ikeCorners`）と 横断歩道（`def.ikeCross`）、緑の大通りの 分離帯、サンシャイン60どおりの れんが、点字ブロック（`def.ikeTactile`）は `TownRoads.draw` の あとに `IkebukuroTown.drawOver` が チャンクへ 描く。平板・駅まえの 石・線路は `TownRenewal.drawGround` の まえに `drawGround`。もようは `IKEBUKURO_TOWN_ART.grounds`（SvgCache の キーは `ike-ground:<id>` だけ）。
- 電車は `TownRenewal.drawMoving` の あとに 2へんせい（`ikebukuro.train`・昼夜の 2つ）。夜の あかりは `HeiwadaiLife.lights` の あと。夜の 絵は `HeiwadaiTown.canvas` を つつんで えらぶ（キーは 絵の ID × 昼夜）。
- はくぶつかん・射撃場の 出入り口: 生成データの `MUSEUM_DATA.buildings.museum.outside`・`MAP_DEFS.museum.warps`・`RANGE_DATA.outside` を install で 新しい 入口に あわせる（生成データは 手で なおさない）。
- 町の はしの そとは `def.edgeColor`（scene-world.js の 背景。ほかの 町は いままでの 草の 色）。
- 検査: `tools/check-ikebukuro.mjs`（配置イメージの ならび・駅から すべての 入口へ・絵の 登録）・`tools/town-check.mjs`（入口 2つの 建物は `doors` の それぞれを しらべる）・`node tools/build-ikebukuro-town.mjs --check`。

## 町の ズーム（UI-08）

`world-zoom.js`（`WorldZoom`）は `debug.js` の すぐ まえ（WorldScene を つつむ ファイルの いちばん あと）。町・フィールド・館の 中（WorldScene の マップ）で、ゆび 2ほんの ピンチ・ひだりの ＋ −（天気の 下）・マウスの ホイール・キーボードの ＋ − 0 で 0.5〜1.5 倍。おうち・お店・斜めの 館には ない。

- 倍率は `Save.d.settings.worldZoom`（`Save.fresh()` に たした。ふるい セーブは migrate が 1 を いれる）。ボタンの だんは 0.5・0.75・1・1.25・1.5、ピンチ・ホイールは そのあいだも。
- 描きかた: `render` の あいだだけ `G.W`・`G.H` を 町の 見える はばに（`G.W × G.px ÷ 端末の 倍率`）、`ctx` を 端末の 倍率に する。見える ところの しらべ（チャンク・建物・小物・水・あかり）は そのまま G.W で うごく。端末の 倍率は 1マスが 端末の 画素の 整数に なる ように まるめ（`WorldZoom.dev`）、`scene-world.js` の 地面の 位置あわせは `this.devPx`（ズーム ちゅうの 端末の 倍率）を つかう（チャンクの つぎめに すき間が 出ない）。
- 絵の 大きさ: ひろく みる とき（1 より 小さい）は `render` の あいだ `G.px` を 0.75 か 0.5 の だんに して、絵と 地面の チャンクを その 大きさで 描く（SvgCache の キーは 大きさ つき・だんは 3つ だけ）。ちかくで みる とき（1 より 大きい）は いまの 絵を ひろげる（メモリを ふやさない。おうちの ズームと おなじ）。うごいて いる あいだは 絵の だんを かえず、とまったら かえる（`zoom.rz`）。
- 読みこみ ちゅうの かわり: `SvgCache._load` が できた 大きさを おぼえ（`WorldZoom.alt`）、町を 描く あいだの `SvgCache.get` は まだ ない 大きさの かわりに ほかの 大きさを かえす（きえない）。かわりが ある ときは 同時に 読みこむ 数を 6つまで、地面の チャンクは 1コマに 3つまで（のこりは 1倍の チャンクを ちぢめて 出す）。ズームの だんの チャンクは 48 まで（あたらしく 見た じゅん）。
- 画面に そのまま 描く もの: 天気（雨・雪）と スティック（ズームの あとに 描く）。はじめの「タップで いどう」の ヒントは ズーム ちゅうは 出さない。
- 入力: `screenToTile`・`clampCam` は 町の 見える はばで。ピンチの 2ほんめの ゆびが おりたら スティック・タップを やめる（つりの ながおしも）。ピンチの ゆびを はなしても タップに しない。
- テスト: `PokaDebug.worldZoom(z, animate)`（ようす・倍率）・`PokaDebug.worldPoint(x, y)`（マスの 画面の 位置。ズームを ふくむ）。`PokaDebug.world()`・`npcLife()`・`folkSpots()`・`fishAim()` の 画面の 位置も ズームを ふくむ。スモーク「world-zoom-390 / 375」。

## おうちの ドア（UI-09）

`home-doors.js`（`HomeDoors`）は `parent-work.js` の あと。HouseScene を 外から つつむ（`up`・`update`・`pose`・`enter`・`exit`）。`scene-house.js` は へやの 絵を 描いた あとに `HomeDoors.drawSigns` を よぶ 1行だけ。

- ドアの ばしょ（`HomeDoors.list()`）: へやの 絵（`HomeDesign.roomSvg`）の ドアと おなじ。ひだりの かべ u=30〜94「おでかけ」・みぎの かべ u=W−124〜W−60「おへや」、おにわ（`HomeGarden.svg`）は ひだりの うらぐち u=43〜102「おうち」。まえの ばしょ `front` は へやの 座標。
- タップ: 3人・さわれる かぐが かさなって いれば そちらが さき（ぱぱ まま は タップしても なにも しないので ドアが さき）。はばは 44px（CSS）いじょう。もようがえ・みまもり・けんか ちゅうは うごかない。
- うごく: 「おへや」は もって いる ほかの へや（1つなら すぐ・2つ いじょうは `UI.ask`）→ 3人で ドアまで あるく（`mode = "door"`・はやさ 150・2.6びょうで うちきり）→ `HomeRooms.switchTo` → `Game.goto("house", { door })`。あたらしい へやでは `HomeDoors.arrive` が ドアの まえに ならべて 中へ あるかせる。「おでかけ」は たしかめて から `goOut()`。
- ふだは 画面の 大きさ（10px）で ドアの うえに つるす（へやの 絵・SvgCache の キーは かわらない）。
- テスト: `PokaDebug.homeDoors()`（ドアの 画面の ばしょ・いける へや・3人）。スモーク「home-doors-390 / 375」。

### 町の人の生活動作（NpcLife）

`npc-life.js` は WorldScene の NPC にシーン限定の `life` を付ける。屋外では既存 wander または起点±3マスを散歩し、屋内・位置補正つきの固定住民は持ち場を守る（既存 wander は保持）。移動先・移動元、3人、追従こねこ、敵、プレイヤーの予約経路を避け、入口・ワープ・看板・宝箱付近と細い道へは新しく歩き込まない。pending.npc と talking の間は次の歩行を始めない。

しぐさは10種類で10〜18秒の休憩をはさむ。NpcArt.svg の gesture は有限名、表情とポーズも既存の有限名。通常姿勢を先読みし、新しい身ぶりの初回生成中にも人物を描く。StoreScene の店員は stationaryActor を使う。ゲームを閉じれば動作状態は消え、Save.KEY/SCHEMA・所持品には変更しない。

テスト入口は PokaDebug.npcLife（状態・画面位置）、npcLifeAct（しぐさ）、npcLifeAdvance（最大60秒の動作更新）、npcLifeApproach（本編と同じ接近経路）。

### 室内のスライド移動

`indoor-walk.js` の `IndoorWalk` は StoreScene / VenueScene / IsoVenueScene の画面座標のスティックを共用する。12論理pxで開始、10px未満は停止。斜め視点では IsoVenue.inv で床の軸へ方向を変換し、既存の walkable と Walker で1マスずつ3人が歩く。床・展示のタップは短い非ドラッグ入力のみ。会話・階移動・pointercancel・blur・退室で解除し、保存データに入力状態は持たない。

検証API `PokaDebug.indoorState()` は store / venue の3人の位置、入力・経路・各方向の通行可能マス数と画面ベクトルを返す。`tests/indoor-walk-smoke.mjs` は実Pointer入力で9か所×スマホ2サイズを検証する。

### 部屋のプリセット
`RoomPresets` / `rooms.presets[roomId]` は各部屋6件までの配置メモ。所有権は含めず、呼出前に別室の使用数を差し引く。wall/floor/items/size/name を保存し、適用時は新しいuidを採番。SaveBackup.install の検証・原子的保存を共用し、保存失敗時は現状を維持する。

### ぱぱ・ままの所持服
`ParentWardrobe` は parents.papa/mama.equipment の5スロットを共有 wardrobe と照合し、人間用アンカーで既存 WEAR を合成する。旧 outfit（基本服の文字列）は維持。追加 hairColor と equipment は migrate で補完。ParentCare.svg は有限の表情・髪型・服を描画する。人物タップは設定を開かず、家族ボタン・きがえ画面の家族タブから開く。

### 屋外のお庭
`HomeGarden`（`js/home-garden.js`）は部屋ID `yard` の固定背景と初期配置。既存 `garden`（サンルーム）とは別。`HomeRooms.purchase()` は購入と家具の付与をバックアップ検査・書込成功まで一括処理する。室内/庭の家具は共有在庫で、配置・プリセット・拡張は部屋ごと。庭の壁紙・床は固定で、壁掛け家具の追加は不可。`PokaDebug.homeRoom(id)` は所有済み部屋の切替。
