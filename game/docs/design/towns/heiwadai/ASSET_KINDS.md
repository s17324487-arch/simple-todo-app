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
