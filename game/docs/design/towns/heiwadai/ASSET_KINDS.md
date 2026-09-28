# 平和台の素材IDとゲームのkind

TOWN-02: 優先度Sの26種類を移植。色・線・文字・細部は元のdraw()出力のまま。

|見本のID|WorldArtのkind|名前|
|---|---|---|
|bld.station|heiwadai_bld_station|平和台駅（駅舎）|
|bld.supermarket|heiwadai_bld_supermarket|えきまえ マーケット（スーパー）|
|bld.shrine|heiwadai_bld_shrine|へいわだい じんじゃ（拝殿）|
|bld.shop.greengrocer|heiwadai_bld_shop_greengrocer|やおや（商店街の店）|
|bld.shop.bakery|heiwadai_bld_shop_bakery|こみちの パンや|
|bld.shop.diner|heiwadai_bld_shop_diner|ファミリー キッチン（食堂）|
|bld.shop.furniture|heiwadai_bld_shop_furniture|くらしの おみせ（家具）|
|bld.sento|heiwadai_bld_sento|せんとう へいわの ゆ（銭湯）|
|prop.vending|heiwadai_prop_vending|自動販売機|
|prop.pole|heiwadai_prop_pole|電柱（変圧器・電線つき）|
|prop.lamp|heiwadai_prop_lamp|街灯（歩道用）|
|prop.signal|heiwadai_prop_signal|信号機（車用＋歩行者用）|
|prop.busstop|heiwadai_prop_busstop|バス停（屋根つき）|
|nat.tree.street|heiwadai_nat_tree_street|街路樹（ケヤキ）＋ 植えます|
|shrine.torii|heiwadai_shrine_torii|鳥居（朱色）|
|park.swing|heiwadai_park_swing|ブランコ（2人のり）|
|park.slide|heiwadai_park_slide|すべり台|
|park.fountain|heiwadai_park_fountain|噴水（円形・二段）|
|rail.train|heiwadai_rail_train|電車（駅に止まる）|
|prop.arcade_gate|heiwadai_prop_arcade_gate|商店街の 入口アーチ|
|prop.nobori|heiwadai_prop_nobori|のぼり旗|
|prop.stall|heiwadai_prop_stall|屋台（たこやき・たいやき など）|
|prop.suzuran|heiwadai_prop_suzuran|商店街の 街灯（すずらん灯・フラッグつき）|
|prop.wall|heiwadai_prop_wall|へい（ブロック塀・フェンス・板塀）|
|prop.mapboard|heiwadai_prop_mapboard|まちの 案内板（地図）|
|park.fujidana|heiwadai_park_fujidana|藤棚（ベンチつき）|

`js/heiwadai-assets-s.js` は `node tools/build-heiwadai-assets.mjs` で生成。通常の描画範囲は `asset-bbox.json` と完全一致し、配置オプションの異なるものだけ元のSVGを測定します。`--check` はブラウザなしで全SVGとメタデータを元の素材に照合します。

`HeiwadaiArt` は登録された61パターンのみを選び、座標や時刻では増えないキャッシュを持ちます。SVG内の模様IDは種類ごとに分離しています。

一覧は `tools/heiwadai-preview.html`。配置を変えるのはTOWN-04です。

## TOWN-03：残りのA・B素材

|見本のID|WorldArtのkind|名前|
|---|---|---|
|bld.mansion|heiwadai_bld_mansion|へいわだい マンション（5かい）|
|bld.office|heiwadai_bld_office|オフィスビル（ガラス張り）|
|bld.koban|heiwadai_bld_koban|交番|
|bld.shop.florist|heiwadai_bld_shop_florist|はなや|
|bld.shop.books|heiwadai_bld_shop_books|ほんや|
|bld.shop.cafe|heiwadai_bld_shop_cafe|きっさ ひだまり（喫茶店）|
|bld.shop.wagashi|heiwadai_bld_shop_wagashi|わがしや（和菓子）|
|bld.post|heiwadai_bld_post|ゆうびんきょく|
|bld.apartment|heiwadai_bld_apartment|アパート（2かい・外階段）|
|bld.nursery|heiwadai_bld_nursery|ほいくえん|
|bld.house.modern|heiwadai_bld_house_modern|おうち（2かい建て・今風）|
|bld.house.hiraya|heiwadai_bld_house_hiraya|おうち（平屋・瓦）|
|bld.house.old|heiwadai_bld_house_old|ふるい おうち（木造・格子）|
|bld.conbini|heiwadai_bld_conbini|コンビニ|
|bld.gas|heiwadai_bld_gas|ガソリンスタンド（大屋根・給油機）|
|bld.bikeshed|heiwadai_bld_bikeshed|駐輪場（屋根つき）|
|bld.toilet|heiwadai_bld_toilet|公園のトイレ|
|prop.bicycle|heiwadai_prop_bicycle|自転車|
|veh.car|heiwadai_veh_car|車（とまっている・上から）|
|veh.taxi|heiwadai_veh_taxi|タクシー|
|veh.bus|heiwadai_veh_bus|路線バス（とまっている）|
|prop.sign.stop|heiwadai_prop_sign_stop|標識『止まれ』|
|prop.sign.cross|heiwadai_prop_sign_cross|標識『横断歩道』|
|prop.bench|heiwadai_prop_bench|ベンチ（木と鉄）|
|prop.trash|heiwadai_prop_trash|ゴミ箱（分別）|
|prop.mailbox|heiwadai_prop_mailbox|郵便ポスト（赤・丸型）|
|prop.phone|heiwadai_prop_phone|公衆電話ボックス|
|prop.mirror|heiwadai_prop_mirror|カーブミラー|
|prop.bollard|heiwadai_prop_bollard|車止め（ポール）|
|prop.guardrail|heiwadai_prop_guardrail|ガードレール（白）|
|prop.planter|heiwadai_prop_planter|植え込み（プランター）|
|prop.flowerbed|heiwadai_prop_flowerbed|花だん（れんがの ふち）|
|nat.tree.big|heiwadai_nat_tree_big|大きな木（ご神木・公園）|
|nat.tree.sakura|heiwadai_nat_tree_sakura|さくらの木|
|nat.pine|heiwadai_nat_pine|松（クロマツ・神社の森）|
|nat.hedge|heiwadai_nat_hedge|生け垣（刈りこみ・つなげて使う）|
|nat.shrub|heiwadai_nat_shrub|低木（まるい）|
|prop.tactile|heiwadai_prop_tactile|点字ブロック|
|shrine.lantern|heiwadai_shrine_lantern|石灯籠|
|shrine.komainu|heiwadai_shrine_komainu|こまいぬ（あ・うん の2体）|
|shrine.chozuya|heiwadai_shrine_chozuya|手水舎（てみずや）|
|shrine.ema|heiwadai_shrine_ema|絵馬かけ|
|shrine.fence|heiwadai_shrine_fence|玉垣（石の さく）|
|park.sandbox|heiwadai_park_sandbox|砂場（木のふち）|
|park.jungle|heiwadai_park_jungle|ジャングルジム|
|park.pond|heiwadai_park_pond|池（石のふち・はす）|
|park.bridge|heiwadai_park_bridge|木の橋（池）|
|park.drink|heiwadai_park_drink|水飲み場|
|park.clock|heiwadai_park_clock|公園の時計|
|prop.dokan|heiwadai_prop_dokan|土管（空き地のひみつきち）|
|rail.canopy|heiwadai_rail_canopy|ホームの屋根（上屋）|
|bg.roofs|heiwadai_bg_roofs|背景の 家なみ（マップの へり）|
|bld.famires|heiwadai_bld_famires|ファミリーレストラン|
|prop.wheelstop|heiwadai_prop_wheelstop|駐車場の車止め（コンクリート）|
|veh.kei|heiwadai_veh_kei|軽トラック（荷台つき）|
|nat.tuft|heiwadai_nat_tuft|草むら・小さな花（地面の かざり）|
|prop.arcade_sign|heiwadai_prop_arcade_sign|商店街の ポールサイン（たて看板）|
|prop.bunting|heiwadai_prop_bunting|旗かざり（通りの上に わたす）|
|prop.aboard|heiwadai_prop_aboard|黒板の 立て看板（A型）|
|prop.gacha|heiwadai_prop_gacha|カプセルトイ（ガチャガチャ）|
|prop.manhole|heiwadai_prop_manhole|マンホール（花の デザイン）|
|prop.hydrant|heiwadai_prop_hydrant|消火栓（赤）と 標識|
|prop.garbage|heiwadai_prop_garbage|ごみ集積所（ストッカー）|
|prop.notice|heiwadai_prop_notice|町内会の 掲示板|
|prop.jizo|heiwadai_prop_jizo|お地蔵さんの ほこら|
|prop.gatepost|heiwadai_prop_gatepost|門柱（表札・インターホン）|
|prop.carport|heiwadai_prop_carport|カーポート（車つき）|
|prop.laundry|heiwadai_prop_laundry|物干し（せんたくもの）|
|prop.pots|heiwadai_prop_pots|植木ばち（あさがお・花）|
|prop.taxistand|heiwadai_prop_taxistand|タクシーのりば の 標識|
|prop.bikerack|heiwadai_prop_bikerack|駐輪ラック（自転車 4台）|
|rail.pole|heiwadai_rail_pole|架線柱（線路の 電柱）|
|park.azumaya|heiwadai_park_azumaya|東屋（あずまや）|
|park.tetsubo|heiwadai_park_tetsubo|鉄棒（3段）|
|park.spring|heiwadai_park_spring|スプリング遊具（どうぶつ）|
|park.seesaw|heiwadai_park_seesaw|シーソー|
|park.tires|heiwadai_park_tires|タイヤの 遊具（半分 うまった タイヤ）|
|park.sign|heiwadai_park_sign|公園の 看板|
|park.ubollard|heiwadai_park_ubollard|U字の 車止め（公園の 入口）|
|prop.pigeons|heiwadai_prop_pigeons|ハト（地面を つつく）|
|prop.guidesign|heiwadai_prop_guidesign|道の 案内標識（青い 看板）|

追加の81種類・175パターンは `node tools/build-heiwadai-assets.mjs --ab` で生成。Sと合わせて107種類・236パターン。全て固定データから選択し、元のSVGを省略せず保持します。
