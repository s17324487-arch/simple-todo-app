// 歩いて入る店の 品ぞろえ（専門店でも既存の商品ID・価格・所持品を共用する）。
// 店内の シーン（StoreScene）は js/store-iso.js（O10・斜め上の 館）、内装は STORE_INTERIORS（js/store-interiors.js）。
// ケーキ・クレープ・パンの しなぞろえと タブは js/shop-goods.js（UI-76）が あとで かきかえる。
for (const [id,kind,label,ids] of [
  ["burger","bag","バーガーと のみもの",["burger","milk","juice"]],
  ["groom","wear","リボン",["ribbon_pink","ribbon_blue"]],
  ["cake","bag","ケーキと デザ",["cake","pudding","milk"]],
  ["crepe","bag","デザ",["pudding","cake","juice"]],
  ["bakery","bag","パンと おやつ",["bread","bone","milk"]],
  ["florist","furn","おはなと みどり",["plant","plantshelf","garland"]],
]) {
  const owner=SHOP_OWNERS[id];
  BUY_SHOPS[id]={name:SHOPS[id].name,keeper:owner,keeperName:owner.name,hello:["いらっしゃい！ ゆっくり みていってね。"],kind,
    tabs:[["goods",label]],items:()=>ids.map(k=>kind==="bag"?BAG_INDEX[k]:kind==="wear"?ITEM_INDEX[k]:FURN_INDEX[k])};
}
