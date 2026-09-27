// 出力先と ブラウザの 起動（リポジトリの どこから 実行しても 同じ 場所に 書き出す）
import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { chromium } from "playwright";
export const OUT = new URL("../../docs/design/towns/heiwadai/", import.meta.url).pathname;   // 仕様・リスト
export const IMG = OUT + "img/";                                                              // 画像
export const TMP = tmpdir() + "/pokapoka-town-design/";                                       // 途中の ファイル（コミットしない）
mkdirSync(IMG, { recursive: true }); mkdirSync(TMP, { recursive: true });
// すでに Chromium がある 環境では CHROMIUM_PATH=/path/to/chromium で それを使う（tests と同じ）
export const launch = () => chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
