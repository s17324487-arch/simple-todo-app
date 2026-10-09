// おうちの ドアの いろ（UI-111）: 「おでかけ」「おへや」「おトイレ」の 3つの ドアの とびらの いろを 12いろから えらぶ。
// もようがえの「ドア」タブ（js/scene-house.js）で えらぶ。いろは おうち ぜんぶ おなじ（Save.d.doorColors）。
// へやの 絵（HomeDesign.roomSvg・HomeToilet.doorSvg）が この いろで 描き、絵の キーには sig()（いろの id 3つ）を いれる（有限）。
const HomeDoorColors = {
  DOORS: [["out", "おでかけ"], ["room", "おへや"], ["toilet", "おトイレ"]],
  DEFAULT: { out: "wood", room: "wood", toilet: "mint" },
  // base: とびら・light: パネルと ふち・dark: いたの すじ と よこぎ
  PALETTE: [
    { id: "wood", name: "きの いろ", base: "#A68252", light: "#CFB681", dark: "#775731" },
    { id: "mint", name: "ミント", base: "#BFE3D8", light: "#D7F0E8", dark: "#86B5A6" },
    { id: "pink", name: "ピンク", base: "#F4B6C2", light: "#FAD3DA", dark: "#C97C8E" },
    { id: "sky", name: "そらいろ", base: "#A9CFEF", light: "#CDE3F6", dark: "#6F9CC6" },
    { id: "lemon", name: "レモン", base: "#F6DE7E", light: "#FBEDB4", dark: "#C4A743" },
    { id: "lavender", name: "ラベンダー", base: "#C9B6E4", light: "#E0D4F1", dark: "#9580B8" },
    { id: "white", name: "しろ", base: "#F2EEE5", light: "#FFFFFF", dark: "#B9B2A3" },
    { id: "red", name: "あか", base: "#D9665B", light: "#EE9C92", dark: "#9E3F37" },
    { id: "green", name: "みどり", base: "#8DBF7A", light: "#B7D9A9", dark: "#5E8C4E" },
    { id: "navy", name: "こん", base: "#4D6A93", light: "#7D97BC", dark: "#2F4566" },
    { id: "choco", name: "チョコ", base: "#7A5038", light: "#A07457", dark: "#4E3122" },
    { id: "black", name: "くろ", base: "#4A4A4F", light: "#74747C", dark: "#2A2A2E" },
  ],
  color(id) { return this.PALETTE.find((p) => p.id === id) || this.PALETTE[0]; },
  // いまの いろ（セーブに ない・しらない いろは はじめの いろ）
  cur() {
    const s = (typeof Save !== "undefined" && Save.d && Save.d.doorColors) || {}, out = {};
    for (const [k] of this.DOORS) out[k] = this.PALETTE.some((p) => p.id === s[k]) ? s[k] : this.DEFAULT[k];
    return out;
  },
  sig(doors = this.cur()) { return this.DOORS.map(([k]) => doors[k] || this.DEFAULT[k]).join("-"); },
  set(door, id) {
    if (!this.DOORS.some(([k]) => k === door) || !this.PALETTE.some((p) => p.id === id)) return false;
    Save.d.doorColors = { ...this.cur(), [door]: id }; Save.mark();
    return true;
  },
  // もようがえの カードの 小さな ドアの 絵（いろごとに 1つ）
  icon(id, size = 50) {
    const c = this.color(id);
    return `<svg viewBox="0 0 40 50" width="${size}" height="${size}" aria-hidden="true"><path d="M5,48 V12 Q5,3 20,3 Q35,3 35,12 V48 Z" fill="#75543D" stroke="${INK}" stroke-width="2.2"/><path d="M9,48 V13 Q9,7 20,7 Q31,7 31,13 V48" fill="${c.base}" stroke="${c.light}" stroke-width="1.6"/><path d="M15,10 V47 M25,10 V47" stroke="${c.dark}" stroke-width="1.1"/><path d="M9,20 H31 M9,38 H31" stroke="${c.dark}" stroke-width="2.4"/><circle cx="27" cy="29" r="2.2" fill="#E0BD66" stroke="${INK}" stroke-width="1"/></svg>`;
  },
};
