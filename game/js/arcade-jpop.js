// Meeときょれじゃ の 店内 BGM: 魔王魂（森田交一）の 歌もの（J-POP）5きょくを ランダムに ながす（1きょく おわったら すこし あけて つぎの 曲）。
// 音符は js/arcade-jpop-maoudamashii.js（自動生成・tools/build-arcade-jpop.mjs）。ならすのは ModernMusic（WebAudio の 合成・音声ファイルは ない）。
// クレジット: BGM：魔王魂 ／ 編集: fungamemake.com (著作者:魔王魂)（マテリアル・コモンズ・ブルー・ライセンス）。せってい と docs/MUSIC.md にも かく。
const ArcadeJpop = {
  LIST: [], // 曲の id（Sound.lists.arcade_hall）
  now: null, // いま ながれて いる 曲の id
  install() {
    if (typeof ARCADE_JPOP_DATA === "undefined") return;
    const D = ARCADE_JPOP_DATA;
    for (const s of D.songs) {
      SONGS[s.id] = { title: s.title, original: s.original, bpm: s.bpm, grid: 16, modern: true, jpop: true,
        source: { artist: "魔王魂（森田交一）", file: s.file, credit: D.credit, license: D.license },
        tracks: s.tracks.map(({ bars, seq, ...tr }) => ({ ...tr, notes: seq.map((i) => bars[i]).join(" | ") })) };
      this.LIST.push(s.id);
    }
    this.LIST.onStart = (id) => this.started(id);
    // 館・あそぶ 画面・ぷりくら（arcade_hall）と けいひん カウンター（shop_ike_arcade）は おなじ 再生リスト（いどうしても 曲は とぎれない）
    Sound.lists.arcade_hall = Sound.lists.shop_ike_arcade = this.LIST;
    // なまえで 曲を ひく ところ（店の BGM の 検査・試聴室）の ための 1きょくめ。ならす ときは Sound.lists の ランダム
    SONGS.arcade_hall = SONGS.shop_ike_arcade = SONGS[this.LIST[0]];
  },
  title(id) { const s = SONGS[id]; return s ? s.title : ""; },
  // 曲が はじまったら 「♪ きょくめい」を 1かいだけ だす（ゲームセンターの いま ながれて いる 曲）
  started(id) {
    this.now = id;
    if (!Save.d || !Save.d.settings.bgm) return;
    UI.toast(`♪ ${this.title(id)}（BGM：魔王魂）`);
  },
  // せってい に だす クレジット
  credit() { return "Meeときょれじゃ の おんがく: 魔王魂（https://maou.audio/）の うた 5きょく ／ MIDI の 編集: fungamemake.com（著作者: 魔王魂）"; },
};
ArcadeJpop.install();
