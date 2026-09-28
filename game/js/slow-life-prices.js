// 店でこれから買う品の価格。セーブ済みの所持金・所持品は変更しない。
const SlowLifePrices = {
  factors: {wear:2.5, furniture:4, wall:3, floor:3},
  price(kind, base) {return base>0 ? Math.ceil(base*this.factors[kind]/10)*10 : base;},
  apply() {
    for(const [kind,list] of [['wear',WEAR_ITEMS],['furniture',FURNITURE],['wall',WALLPAPERS],['floor',FLOORS]])
      for(const item of list)if(item.price>0&&!item.rare)item.price=this.price(kind,item.price);
  },
};
SlowLifePrices.apply();
