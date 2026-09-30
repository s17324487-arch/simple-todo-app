// 秋・冬をテーマにした家具と服（Gemini 追加）
(() => {
  // ---- 10種類の服 ----
  // 既存の wear を使って実装する。色はパステル調、INKの線。
  const hzClothes = [
    ["hz_acorn_knit", "どんぐりの ニットぼう", "head", "knit", ["#A67A5B", "#664229"], 140],
    ["hz_maple_beret", "もみじの ベレー", "head", "beret", ["#C45B4B"], 150],
    ["hz_snow_scarf", "ゆきの マフラー", "neck", "muffler", ["#FFFFFF", "#E0F2F1"], 180],
    ["hz_check_scarf", "チェックの スカーフ", "neck", "scarf", ["#8B4513"], 100],
    ["hz_autumn_coat", "あきいろ コート", "body", "raincoat", ["#D2A679"], 240],
    ["hz_winter_sweater", "ふゆの セーター", "body", "sweater", ["#B0C4DE", "#FFFFFF"], 230],
    ["hz_star_pajama", "ほしぞら パジャマ", "body", "pajama", ["#4B3D6B", "#FAD872"], 210],
    ["hz_knit_dress", "あみもの ワンピース", "body", "dress", ["#C5A3C7", "#FFF0F5"], 280],
    ["hz_fluffy_earmuffs", "もこもこ みみあて", "head", "catears", ["#FFFFFF", "#FFB6C1"], 200],
    ["hz_fox_tail", "きつねの リュック", "back", "backpack", ["#E58332"], 290]
  ];
  for (const [id, name, slot, wear, col, price] of hzClothes) {
    const item = { id, name, slot, wear, col, price };
    WEAR_ITEMS.push(item);
    ITEM_INDEX[id] = item;
  }

  // ---- 4種類の通常家具 ----
  const hzFurn = {
    hz_acorn_lamp: [40, 60, "どんぐり ランプ", 160, "floor", true, 3, () => {
      const r = (x,y,w,h,c,rad=0) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rad}" fill="${c}" ${FS(2)}/>`;
      const p = (d,c) => `<path d="${d}" fill="${c}" ${FS(2)}/>`;
      return r(18,50,4,10,"#8C6239") + r(10,56,20,4,"#8C6239",2) +
             p("M10,40 Q20,55 30,40 Z","#E6B373") + p("M5,40 Q20,20 35,40 Z","#664229");
    }],
    hz_maple_rug: [120, 50, "もみじの ラグ", 210, "rug", false, 3, () => {
      return `<path d="M60,10 L70,30 L90,20 L80,35 L100,40 L70,45 L70,50 L50,50 L50,45 L20,40 L40,35 L30,20 L50,30 Z" fill="#C45B4B" ${FS(2)}/>`;
    }],
    hz_snow_tree: [60, 90, "ゆきげしきの ツリー", 320, "floor", false, 4, () => {
      const r = (x,y,w,h,c,rad=0) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rad}" fill="${c}" ${FS(2)}/>`;
      const p = (d,c) => `<path d="${d}" fill="${c}" ${FS(2)}/>`;
      return r(26,80,8,10,"#664229") + p("M10,80 L30,40 L50,80 Z","#4B8255") + p("M15,60 L30,25 L45,60 Z","#4B8255") + p("M20,40 L30,10 L40,40 Z","#4B8255") +
             p("M30,10 L25,15 Q30,20 35,15 Z","#FFFFFF") + p("M30,25 L20,35 Q30,40 40,35 Z","#FFFFFF") + p("M30,40 L15,55 Q30,60 45,55 Z","#FFFFFF");
    }],
    hz_knit_sofa: [100, 60, "あみもの ソファ", 450, "floor", false, 6, () => {
      const r = (x,y,w,h,c,rad=0) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rad}" fill="${c}" ${FS(2)}/>`;
      return r(5,30,90,30,"#E0C2C0",10) + r(10,10,80,25,"#E0C2C0",10) + r(5,20,15,20,"#D1A19E",5) + r(80,20,15,20,"#D1A19E",5) +
             `<path d="M20,15 L30,30 M30,15 L20,30 M40,15 L50,30 M50,15 L40,30 M60,15 L70,30 M70,15 L60,30 M80,15 L90,30 M90,15 L80,30" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>`;
    }]
  };
  for (const [id, [w, h, name, price, kind, interactive, comfort, draw]] of Object.entries(hzFurn)) {
    const f = { id, name, price, w, h, kind, comfort, interactive };
    FURNITURE.push(f);
    FURN_INDEX[id] = f;
    FURN_ART[id] = draw;
  }

  // ---- レア家具（ほしぞらの だんろ） ----
  // クイズの luxury 枠として実装
  const sfId = "hz_starry_fireplace";
  const sfFurn = {
    id: sfId, name: "ほしぞらの だんろ", price: 0, rare: true, quizPrize: true, w: 96, h: 70, depth: 36, kind: "floor", comfort: 10, interactive: true,
    desc: "星空のように きらめく とくべつな だんろ。"
  };
  // 既存の FURNITURE へ追加
  FURNITURE.push(sfFurn);
  FURN_INDEX[sfId] = sfFurn;
  FURN_ART[sfId] = () => {
    const r = (x,y,w,h,c,rad=0) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rad}" fill="${c}" ${FS(2)}/>`;
    const p = (d,c) => `<path d="${d}" fill="${c}" ${FS(2)}/>`;
    return r(8,8,80,60,"#3B4254") + p("M28,68 Q48,40 68,68 Z","#E65C4F") + p("M38,68 Q48,50 58,68 Z","#F7D35E") +
           `<circle cx="20" cy="20" r="1.5" fill="#FFFFFF"/><circle cx="70" cy="25" r="2" fill="#F7D35E"/><circle cx="45" cy="15" r="1.5" fill="#FFFFFF"/><path d="M48,15 L55,22 M55,15 L48,22" stroke="#F7D35E" stroke-width="2"/>`;
  };

  // quiz-prizes.js の QuizPrizes.items に差し込む（ロード順に注意。QuizPrizes は定義済み前提）
  if (typeof QuizPrizes !== "undefined" && QuizPrizes.items) {
    QuizPrizes.items.push({
      id: sfId, tier: "luxury", name: sfFurn.name, price: 45000, w: 96, depth: 36, h: 70, comfort: 10, desc: sfFurn.desc
    });
    // クイズのモデル描画フックが FURN_ART 経由で行われるため、ここでは通常の FURN_ART を登録済み
  }
})();
