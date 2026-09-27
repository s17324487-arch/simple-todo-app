// ゲームのバージョン（単一の情報源）。
// タイトル画面・せってい画面・セーブデータ・Service Worker のキャッシュ名がこの値を使う。
// リリースのたびに上げる（semver: 大きな変更=2.0.0 / 機能追加=1.1.0 / 修正=1.0.1）。
// package.json の version と CHANGELOG.md の先頭も同じ値にそろえる（tools/check.mjs が確認する）。
const GAME_VERSION = "1.0.0";
