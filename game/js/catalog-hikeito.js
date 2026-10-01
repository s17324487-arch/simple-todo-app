(() => {
  // 家具、壁紙、壁掛け、ゆか、服を限定関係なく各10種類 (合計50種類)
  // ハイクオリティ日替わりけいと定義し、少し値段も高めにする
  // お店での出現も2種類ずつにし、2日ごとに出現されるものを変える

  const hkFurnFloor = [
    { id: "hk_luxury_sofa", name: "ハイクオリティ・ソファ", price: 3000, kind: "floor", w: 104, h: 62, comfort: 15, rare: false, interactive: false, draw: () => `<rect x="5" y="20" width="94" height="42" rx="10" fill="#4A4A4A"/><rect x="15" y="10" width="74" height="30" rx="10" fill="#3A3A3A"/>` },
    { id: "hk_marble_table", name: "大理石のテーブル", price: 3500, kind: "floor", w: 76, h: 50, comfort: 12, rare: false, interactive: false, draw: () => `<rect x="10" y="25" width="56" height="25" fill="#C0C0C0"/><rect x="5" y="15" width="66" height="10" rx="2" fill="#F0F0F0"/>` },
    { id: "hk_gold_lamp", name: "金色のランプ", price: 2500, kind: "floor", w: 34, h: 88, comfort: 10, rare: false, interactive: true, draw: () => `<rect x="14" y="40" width="6" height="48" fill="#D4AF37"/><circle cx="17" cy="25" r="15" fill="#FFFACD"/>` },
    { id: "hk_crystal_piano", name: "クリスタルピアノ", price: 8000, kind: "floor", w: 110, h: 80, comfort: 20, rare: false, interactive: true, draw: () => `<path d="M10,40 Q55,10 100,40 Q80,70 10,70 Z" fill="#E0FFFF" stroke="#B0E0E6" stroke-width="3"/>` },
    { id: "hk_royal_bed", name: "王室のベッド", price: 6000, kind: "floor", w: 118, h: 104, comfort: 18, rare: false, interactive: false, draw: () => `<rect x="10" y="30" width="98" height="74" rx="5" fill="#800000"/><rect x="20" y="10" width="78" height="25" rx="5" fill="#DAA520"/>` },
    { id: "hk_antique_bookshelf", name: "アンティーク本棚", price: 4000, kind: "floor", w: 62, h: 92, comfort: 14, rare: false, interactive: false, draw: () => `<rect x="5" y="5" width="52" height="87" fill="#5C4033"/><rect x="10" y="10" width="42" height="77" fill="#3E2723"/><line x1="10" y1="30" x2="52" y2="30" stroke="#5C4033" stroke-width="2"/><line x1="10" y1="50" x2="52" y2="50" stroke="#5C4033" stroke-width="2"/>` },
    { id: "hk_silver_clock", name: "銀の柱時計", price: 3200, kind: "floor", w: 36, h: 96, comfort: 11, rare: false, interactive: false, draw: () => `<rect x="6" y="5" width="24" height="91" fill="#C0C0C0"/><circle cx="18" cy="25" r="10" fill="#FFFFFF"/><circle cx="18" cy="25" r="1" fill="#000000"/>` },
    { id: "hk_velvet_chair", name: "ベルベットチェア", price: 2000, kind: "floor", w: 34, h: 52, comfort: 12, rare: false, interactive: false, draw: () => `<rect x="4" y="25" width="26" height="27" fill="#800020"/><rect x="7" y="5" width="20" height="25" rx="5" fill="#800020"/>` },
    { id: "hk_huge_tv", name: "巨大なテレビ", price: 5500, kind: "floor", w: 100, h: 72, comfort: 15, rare: false, interactive: true, draw: () => `<rect x="5" y="10" width="90" height="50" rx="3" fill="#1A1A1A"/><rect x="8" y="13" width="84" height="44" fill="#000000"/><rect x="40" y="60" width="20" height="12" fill="#1A1A1A"/>` },
    { id: "hk_art_sculpture", name: "芸術的な彫刻", price: 4500, kind: "floor", w: 40, h: 80, comfort: 16, rare: false, interactive: false, draw: () => `<rect x="10" y="70" width="20" height="10" fill="#696969"/><path d="M20,10 C5,30 35,50 20,70" fill="none" stroke="#F5F5DC" stroke-width="10" stroke-linecap="round"/>` }
  ];

  const hkFurnWall = [
    { id: "hk_gold_mirror", name: "金縁の鏡", price: 2800, kind: "wall", w: 40, h: 60, comfort: 10, rare: false, interactive: false, draw: () => `<ellipse cx="20" cy="30" rx="15" ry="25" fill="#E0FFFF" stroke="#FFD700" stroke-width="4"/>` },
    { id: "hk_masterpiece", name: "名画", price: 4200, kind: "wall", w: 60, h: 50, comfort: 14, rare: false, interactive: false, draw: () => `<rect x="5" y="5" width="50" height="40" fill="#DEB887" stroke="#8B4513" stroke-width="4"/><circle cx="20" cy="20" r="10" fill="#FF4500"/><path d="M5,45 L60,15" stroke="#2E8B57" stroke-width="5"/>` },
    { id: "hk_crystal_chandelier", name: "クリスタルシャンデリア", price: 5000, kind: "wall", w: 60, h: 40, comfort: 16, rare: false, interactive: true, draw: () => `<line x1="30" y1="0" x2="30" y2="15" stroke="#C0C0C0" stroke-width="2"/><path d="M10,30 L30,15 L50,30 Z" fill="#E0FFFF"/><circle cx="20" cy="35" r="3" fill="#FFFFFF"/><circle cx="30" cy="38" r="4" fill="#FFFFFF"/><circle cx="40" cy="35" r="3" fill="#FFFFFF"/>` },
    { id: "hk_sword_display", name: "飾りの剣", price: 3500, kind: "wall", w: 70, h: 30, comfort: 12, rare: false, interactive: false, draw: () => `<line x1="10" y1="20" x2="60" y2="10" stroke="#C0C0C0" stroke-width="4"/><circle cx="15" cy="19" r="4" fill="#FFD700"/><rect x="8" y="18" width="2" height="15" fill="#FFD700" transform="rotate(-10 8 18)"/>` },
    { id: "hk_deer_head", name: "鹿の剥製", price: 3800, kind: "wall", w: 50, h: 60, comfort: 11, rare: false, interactive: false, draw: () => `<path d="M25,25 L15,5 L20,25 M25,25 L35,5 L30,25" stroke="#8B4513" stroke-width="3" fill="none"/><circle cx="25" cy="40" r="12" fill="#A0522D"/>` },
    { id: "hk_cuckoo_clock", name: "高級鳩時計", price: 2900, kind: "wall", w: 40, h: 50, comfort: 10, rare: false, interactive: true, draw: () => `<rect x="10" y="10" width="20" height="25" fill="#8B4513"/><path d="M5,10 L20,0 L35,10 Z" fill="#A0522D"/><circle cx="20" cy="22" r="5" fill="#FFFFFF"/><line x1="20" y1="35" x2="20" y2="45" stroke="#FFD700" stroke-width="2"/><circle cx="20" cy="45" r="3" fill="#FFD700"/>` },
    { id: "hk_tapestry", name: "立派なタペストリー", price: 3100, kind: "wall", w: 50, h: 70, comfort: 13, rare: false, interactive: false, draw: () => `<line x1="5" y1="5" x2="45" y2="5" stroke="#FFD700" stroke-width="3"/><rect x="10" y="5" width="30" height="60" fill="#800000"/><path d="M15,20 L35,40 M15,40 L35,20" stroke="#FFD700" stroke-width="2"/>` },
    { id: "hk_neon_sign", name: "ネオンサイン", price: 2600, kind: "wall", w: 60, h: 30, comfort: 9, rare: false, interactive: true, draw: () => `<path d="M10,20 Q20,5 30,20 T50,20" fill="none" stroke="#FF1493" stroke-width="4" stroke-linecap="round"/>` },
    { id: "hk_shelf_luxury", name: "高級ウォールシェルフ", price: 2400, kind: "wall", w: 70, h: 20, comfort: 10, rare: false, interactive: false, draw: () => `<rect x="5" y="10" width="60" height="5" fill="#2F4F4F"/><rect x="15" y="2" width="10" height="8" fill="#8B4513"/><circle cx="45" cy="5" r="5" fill="#FFD700"/>` },
    { id: "hk_wreath_gold", name: "金のリース", price: 2700, kind: "wall", w: 50, h: 50, comfort: 12, rare: false, interactive: false, draw: () => `<circle cx="25" cy="25" r="18" fill="none" stroke="#DAA520" stroke-width="6"/><circle cx="25" cy="7" r="4" fill="#FF0000"/>` }
  ];

  const hkWallpapers = [
    { id: "hk_wp_royal", name: "王室の壁紙", price: 2000, base: "#8B0000", c2: "#B22222", pat: "stripe", comfort: 10 },
    { id: "hk_wp_gold", name: "金箔の壁紙", price: 2500, base: "#DAA520", c2: "#FFD700", pat: "dots", comfort: 12 },
    { id: "hk_wp_marble", name: "大理石の壁紙", price: 2200, base: "#F0F8FF", c2: "#E6E6FA", pat: "cloud", comfort: 11 },
    { id: "hk_wp_velvet", name: "ベルベット壁紙", price: 2100, base: "#4B0082", c2: "#800080", pat: "plain", comfort: 10 },
    { id: "hk_wp_silk", name: "シルクの壁紙", price: 2300, base: "#FFF0F5", c2: "#FFC0CB", pat: "stripe", comfort: 11 },
    { id: "hk_wp_leather", name: "レザーの壁紙", price: 2400, base: "#8B4513", c2: "#A0522D", pat: "check", comfort: 11 },
    { id: "hk_wp_silver", name: "銀箔の壁紙", price: 2500, base: "#C0C0C0", c2: "#D3D3D3", pat: "star", comfort: 12 },
    { id: "hk_wp_damask", name: "ダマスク柄壁紙", price: 2600, base: "#2F4F4F", c2: "#556B2F", pat: "flower", comfort: 12 },
    { id: "hk_wp_night", name: "極夜の壁紙", price: 2700, base: "#000080", c2: "#191970", pat: "star", comfort: 13 },
    { id: "hk_wp_mansion", name: "洋館の壁紙", price: 2800, base: "#5C4033", c2: "#3E2723", pat: "wood", comfort: 14 }
  ];

  const hkFloors = [
    { id: "hk_fl_marble", name: "大理石の床", price: 2000, base: "#F8F8FF", c2: "#F5F5F5", pat: "checker", comfort: 10 },
    { id: "hk_fl_mahogany", name: "マホガニーの床", price: 2200, base: "#800000", c2: "#8B0000", pat: "plank", comfort: 11 },
    { id: "hk_fl_gold", name: "金箔の床", price: 2500, base: "#FFD700", c2: "#DAA520", pat: "stone", comfort: 12 },
    { id: "hk_fl_velvet", name: "ベルベットカーペット", price: 2100, base: "#8B008B", c2: "#9932CC", pat: "carpet", comfort: 10 },
    { id: "hk_fl_silk", name: "シルクのラグ床", price: 2300, base: "#FAF0E6", c2: "#FAEBD7", pat: "carpet", comfort: 11 },
    { id: "hk_fl_leather", name: "レザーの床", price: 2400, base: "#A0522D", c2: "#D2691E", pat: "plank", comfort: 11 },
    { id: "hk_fl_silver", name: "銀箔の床", price: 2500, base: "#D3D3D3", c2: "#C0C0C0", pat: "stone", comfort: 12 },
    { id: "hk_fl_glass", name: "ガラスの床", price: 2600, base: "#E0FFFF", c2: "#F0FFFF", pat: "checker", comfort: 12 },
    { id: "hk_fl_obsidian", name: "黒曜石の床", price: 2700, base: "#1A1A1A", c2: "#2A2A2A", pat: "stone", comfort: 13 },
    { id: "hk_fl_palace", name: "宮殿の床", price: 2800, base: "#F5DEB3", c2: "#DEB887", pat: "checker", comfort: 14 }
  ];

  const hkClothes = [
    { id: "hk_royal_crown", name: "王様の王冠", slot: "head", wear: "partyhat", col: ["#FFD700", "#FF0000"], price: 3000 },
    { id: "hk_diamond_tiara", name: "ダイヤのティアラ", slot: "head", wear: "ribbon", col: ["#E0FFFF"], price: 3500 },
    { id: "hk_silk_hat", name: "シルクハット", slot: "head", wear: "beret", col: ["#1A1A1A"], price: 2500 },
    { id: "hk_pearl_necklace", name: "真珠のネックレス", slot: "neck", wear: "scarf", col: ["#FFFFFF"], price: 4000 },
    { id: "hk_gold_chain", name: "金のチェーン", slot: "neck", wear: "muffler", col: ["#FFD700", "#DAA520"], price: 3800 },
    { id: "hk_royal_mantle", name: "王様のマント", slot: "back", wear: "backpack", col: ["#8B0000"], price: 4500 },
    { id: "hk_angel_wings", name: "天使の羽", slot: "back", wear: "backpack", col: ["#FFFFFF"], price: 5000 },
    { id: "hk_tuxedo", name: "高級タキシード", slot: "body", wear: "sweater", col: ["#1A1A1A", "#FFFFFF"], price: 4200 },
    { id: "hk_party_dress", name: "パーティードレス", slot: "body", wear: "dress", col: ["#FF1493", "#FF69B4"], price: 4800 },
    { id: "hk_armor", name: "黄金の鎧", slot: "body", wear: "raincoat", col: ["#FFD700"], price: 6000 }
  ];

  for (const f of [...hkFurnFloor, ...hkFurnWall]) {
    FURNITURE.push({ id: f.id, name: f.name, price: f.price, kind: f.kind, w: f.w, h: f.h, comfort: f.comfort, interactive: f.interactive, rare: f.rare, hikeito: true });
    FURN_INDEX[f.id] = FURNITURE[FURNITURE.length - 1];
    FURN_ART[f.id] = f.draw;
  }
  for (const w of hkWallpapers) {
    WALLPAPERS.push({ ...w, hikeito: true });
    WALL_INDEX[w.id] = WALLPAPERS[WALLPAPERS.length - 1];
  }
  for (const fl of hkFloors) {
    FLOORS.push({ ...fl, hikeito: true });
    FLOOR_INDEX[fl.id] = FLOORS[FLOORS.length - 1];
  }
  for (const c of hkClothes) {
    WEAR_ITEMS.push({ ...c, hikeito: true });
    ITEM_INDEX[c.id] = WEAR_ITEMS[WEAR_ITEMS.length - 1];
  }

  // ハイクオリティ日替わりけいのロジック (2日ごとに2種類ずつ)
  const hkItems = {
    floor: hkFurnFloor,
    wall: hkFurnWall,
    wp: hkWallpapers,
    fl: hkFloors,
    head: hkClothes.filter(c => c.slot === "head"),
    neck: hkClothes.filter(c => c.slot === "neck"),
    body: hkClothes.filter(c => c.slot === "body"),
    back: hkClothes.filter(c => c.slot === "back")
  };
  window.hkItems = hkItems; // ほかのファイルでも参照できるようにエクスポート

  // オリジナルの items 関数をラップする
  if (typeof BUY_SHOPS !== "undefined") {
    const originalClothesItems = BUY_SHOPS.clothes.items;
    BUY_SHOPS.clothes.items = (tab) => {
      const orig = originalClothesItems(tab);
      let dayStr = "";
      if (typeof Save !== "undefined" && Save.d && Save.d.calendar) {
        dayStr = Save.d.calendar;
      } else {
        const d = new Date();
        dayStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      }
      const parts = dayStr.split("-").map(Number);
      let days = 0;
      if (parts.length === 3) {
        days = parts[0] * 365 + parts[1] * 30 + parts[2];
      } else {
        days = Math.floor(Date.now() / 86400000);
      }
      const cycle = Math.floor(days / 2);

      const hkList = hkItems[tab] || [];
      if (hkList.length === 0) return orig;
      const dailyHk = [hkList[(cycle * 2) % hkList.length], hkList[(cycle * 2 + 1) % hkList.length]].filter(Boolean);
      return [...orig, ...dailyHk];
    };

    const originalFurnitureItems = BUY_SHOPS.furniture.items;
    BUY_SHOPS.furniture.items = (tab) => {
      const orig = originalFurnitureItems(tab);
      let dayStr = "";
      if (typeof Save !== "undefined" && Save.d && Save.d.calendar) {
        dayStr = Save.d.calendar;
      } else {
        const d = new Date();
        dayStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      }
      const parts = dayStr.split("-").map(Number);
      let days = 0;
      if (parts.length === 3) {
        days = parts[0] * 365 + parts[1] * 30 + parts[2];
      } else {
        days = Math.floor(Date.now() / 86400000);
      }
      const cycle = Math.floor(days / 2);

      const hkList = hkItems[tab] || [];
      if (hkList.length === 0) return orig;
      const dailyHk = [hkList[(cycle * 2) % hkList.length], hkList[(cycle * 2 + 1) % hkList.length]].filter(Boolean);
      return [...orig, ...dailyHk];
    };
  }
})();
