// ころころ フルーツ（パズルの おてつだい）の お店を ネリカスタウンに おく。
// みなみの 通学路の「小さな 中庭の 家」（nerikasu_home5・6×5・入口 3）を お店に する。足もと・入口・大きさは そのまま。
// 建物の 絵は tools/town-design/nerikasu-buildings.mjs の korokoro（js/nerikasu-town-art.js に 生成）。
// NerikasuTown.install（js/nerikasu-town.js）が originals を とる まえに かえる（池袋が 住宅を おてつだいに かえたのと おなじ）。
const KorokoroTown = {
  install() {
    const b = MAP_DEFS.town.buildings.find((x) => x.id === "nerikasu_home5");
    if (!b) throw Error("korokoro: ネリカスタウンの お店の 場所が ない");
    Object.assign(b, { act: { type: "work", shop: "korokoro" }, label: "ころころ フルーツ", sign: "korokoro" });
  },
};
KorokoroTown.install();
