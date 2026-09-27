// Codex 用の アセットリスト（Markdown）を 作る → docs/design/towns/heiwadai/ASSET_LIST.md
import { writeFileSync, readFileSync } from "node:fs";
import { REG } from "./assets_more.mjs";
import * as M from "./heiwadai-v02.mjs";
import { OUT } from "./paths.mjs";
const spec = JSON.parse(readFileSync(OUT + "heiwadai-v02.json", "utf8")), BB = JSON.parse(readFileSync(OUT + "asset-bbox.json", "utf8"));
const reach = (id) => { const b = BB[id]; if (!b) return ""; const a = REG[id], up = Math.max(0, -b[1]), l = Math.max(0, -b[0]), r = Math.max(0, b[2] - a.w * 32), dn = Math.max(0, b[3] - a.h * 32); return [up && `上${up}`, l && `左${l}`, r && `右${r}`, dn && `下${dn}`].filter(Boolean).join(" ") || "なし"; };
const use = {}; for (const it of [...M.B, ...M.P, ...M.DECAL, ...M.OVER]) use[it.asset] = (use[it.asset] || 0) + 1;
const cats = ["建物", "神社", "公園", "小物", "自然", "乗り物", "線路", "背景", "地面"];
const all = Object.values(REG), cnt = (p) => all.filter((a) => a.prio === p).length;
const esc = (s) => String(s || "").replace(/\|/g, "／");
let md = `# 平和台 アセットリスト（Codex 用・v0.2）

町を 作り直すときの **絵の 部品の 一覧** である。見本の 絵は [\`img/asset_sheet_1〜4.png\`](img/)（1マス=32px を 1.25倍で 表示）、
使いかたの 見本は [\`img/plan.png\`](img/plan.png)（全体）と [\`img/phones.png\`](img/phones.png)（スマホ 1画面）。
**絵の 正解は 画像ではなく コード**である: 各アセットの SVG は [\`tools/town-design/assets.mjs\`](../../../../tools/town-design/assets.mjs) と [\`assets_more.mjs\`](../../../../tools/town-design/assets_more.mjs) の \`def({ id: ... })\` に ある。ゲームへは この SVG を うつす（形・色・細部を 変えない）。

- アセット数: **${all.length}**（優先度 S=${cnt("S")} / A=${cnt("A")} / B=${cnt("B")}）。平和台 v0.2 で 使っているのは ${Object.keys(use).length} 種・${Object.values(use).reduce((a, b) => a + b, 0)} 個。
- 優先度: **S** = これが ないと 町の 顔に ならない（最初に 作る）／ **A** = 密度と 本物らしさに 効く ／ **B** = あると うれしい。

## 1. 絵の きまり（全アセット共通）

| 項目 | きまり |
| --- | --- |
| 大きさ | 1マス = 論理 32px。w×h は **足もと（地面に 置く 範囲）** の マス数。高いものは 足もとから **上へ はみ出して** 描く（電柱 3マス・街路樹 2.5マス など）。はみ出す 量は 表の「はみ出し(px)」と \`asset-bbox.json\`（足もとの 左上を 0,0 とした 描く範囲 [x0,y0,x1,y1]） |
| 見かた | 3/4 見下ろし。建物は **南の 面（正面）** だけ 見せ、入口は 下の はしに つける |
| 線 | 輪郭は \`INK\`（#1F1D1B）1.0〜1.4px、内側の 線は その色の 暗い色 0.5〜0.9px。\`stroke-linejoin/linecap = round\` |
| 色 | パステル調。1つの 部品に 3〜5色 ＋ 明るい面・暗い面（左上が 明るい） |
| 影 | 光は 左上 → 影は **右下**。\`#1A1410\` の 不透明度 0.15〜0.2。建物は 右と 下に 平行四辺形の 影、小物は 足もとに だ円 |
| 細部 | 各アセットの「必須の 細部」を かならず 入れる（下の 表）。のっぺりした 四角だけに しない |
| 文字 | 看板は ひらがな中心・短く。実物で 見なれた 表示（止まれ・交番・〒・消火栓）は 漢字でも よい（形で わかる） |
| 地面の 質感 | SVG の \`<pattern>\` を 使う（§3）。同じ id を 2回 定義しない（\`ctx.uid\` などで 一意に） |
| キャッシュ | \`SvgCache\` の キーは **有限個**。色・種類・seed は 決まった 候補から えらぶ（乱数や 座標を キーに 入れない） |
| バリエーション | 同じ 型が 並ぶところは 色・向き・seed を かえる（同じ 絵が 3つ以上 横に 続かない） |

## 2. 道の 描きかた（タイルではなく ベクター）

v0.1 までの「道タイルを 並べる」方式だと 斜めや カーブが ギザギザに なる。v0.2 は **中心線（直線＋円弧）と 幅** で 道を 持ち、
地面の 塊（チャンク）ごとに 多角形として 描く。**当たり判定と 歩ける判定は これまでどおり マス**（中心点が 道の 中なら 道）。

1. 描く 順番: ①地面の マス → ②**歩道**（中心線 ± 車道/2+歩道）→ ③**縁石**（車道の ふちの 外がわ 0.18マス・明るい灰色）→ ④**車道**（アスファルト）→ ⑤ロータリーの 島 → ⑥**隅切り**（交差点の 角を 半径1.5マスで まるく）→ ⑦**切り下げ**（駐車場・路地の 出入り口は 縁石を 低く）→ ⑧路面表示 → ⑨建物・小物（足もとの y が 小さい 順）→ ⑩上の層（ホームの屋根・旗かざり・電線）。
2. 車道が 別の 車道に つながる ところ（交差点の 口）は、縁石を 描いた あとで 車道を ぬるので 自然に 消える。
3. 大通り: 直線（駅前通り）→ 円弧（半径8マス）→ 45度の 直線。**角ばった 折れ線に しない**。
4. ロータリーは **時計回り**。日本の 環状交差点は「右回り（時計回り）」と 決まっており、左側通行なので 入るときも 出るときも 左折に なる。駅前広場の 形にも「右回りロータリー」が ある。
5. バス停・タクシーのりば・送り迎えの 場所は ロータリーの **外がわ（駅がわの 歩道）**。時計回りだと 車の 左（乗り降りの がわ）が 外がわ だから。島は 植えこみ・時計・案内に する。
6. 路面表示の 寸法（1マス ≒ 1.5m で 縮めた 値）:

| 表示 | 描きかた | 実物の 目安 |
| --- | --- | --- |
| 横断歩道 | 白い 帯（はば 0.28マス・すき間 0.28マス）を 道の 向きに そろえて 並べる。帯の 長さ 2マス | 帯 45cm・間隔 45cm・長さ 3m |
| 停止線 | 白い 線 7px。横断歩道の 手前 約1マス | 横断歩道から 2m 以上 はなす |
| ひし形（◇） | 信号の ない 横断歩道の 手前の 車線に 白い ひし形 | 横断歩道の 30m・50m 手前 |
| 中央線 | 大通りは 黄色の 実線 4px。交差点・横断歩道の 中は 切る | — |
| 外側線 | 大通りの 両がわ、縁石から 0.38マス 内がわに 白 2.4px | — |
| 矢印 | 交差点の 手前の 車線に「まっすぐ＋左」「まっすぐ＋右」 | — |
| 止まれ | 白い 字を 進む 向きに 1.8〜2倍 のばす。停止線と セット | — |
| 路地 | アスファルト＋両はしの 側溝（ふたの すき間）＋白い 外側線 | — |

## 3. 地面の 質感（pattern）

| id | 使う ところ | 必須の 細部 |
| --- | --- | --- |
| p-grass | 芝・空き地の まわり | 2トーンの むら・草の 葉・小さな 花 |
| p-lawn | 公園・中庭・前庭 | 刈り目の しま |
| p-asphalt | 車道・駐車場・路地 | 粒・わずかな むら |
| p-paver | 歩道・広場 | ずらし積みの 敷石（2色） |
| p-granite | 駅前広場 | 大きめの 石板・2トーン |
| p-terrazzo | 商店街の 床 | 市松・小石の 粒・目地 |
| p-concrete | 前庭・切り下げ・ホーム | 目地・ひび |
| p-gravel / p-stone | 神社の 玉砂利 ／ 参道 | 丸い 小石 ／ 長方形の 敷石 |
| p-dirt / p-sand | 公園の 道 ／ 砂場 | 小石・粒 |
| p-ballast | 線路 | 砕石 ＋ まくら木 ＋ レール 2本 |
| p-lot | 空き地 | 土と 雑草 |
| p-tactile-line / -dot | 点字ブロック（誘導 ／ 警告） | 黄色・線 ／ 点。駅の 入口 → バス停・横断歩道 |
| p-kawara-* / p-metal-roof / p-slate | 屋根（瓦3色・金属・スレート） | 瓦の 波・はぜ・目地 |
| p-siding / p-wood / p-tile-wall / p-brick / p-block-wall | 外壁・塀 | 板の すじ・目地 |

## 4. アセット一覧
`;
for (const c of cats) {
  const list = all.filter((a) => a.cat === c);
  if (!list.length) continue;
  md += `\n### ${c}（${list.length}）\n\n| id | 名前 | 大きさ | はみ出し(px) | 通れる | 優先 | 必須の 細部 | バリエーション | 動き・さわると | v0.2 で 使った数 |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n`;
  for (const a of list) md += `| \`${a.id}\` | ${esc(a.name)} | ${a.w}×${a.h} | ${reach(a.id)} | ${a.pass ? "○" : ""} | ${a.prio} | ${esc((a.details || []).join("・"))} | ${esc((a.variants || []).join("・"))} | ${esc([a.anim, a.interact].filter(Boolean).join(" ／ "))} | ${use[a.id] || 0} |\n`;
}
const m = spec.metrics;
md += `
## 5. 置きかたの めやす（平和台 v0.2 の 実測）

| めやす | 目標 | v0.2 |
| --- | --- | --- |
| 小物の 密度（歩ける 100マス あたり。木・へい・背景を のぞく） | 8 以上 | ${m.propsPer100} |
| 小物の 種類 | 20 以上 | ${m.propKinds} |
| 何もない 場所（半径2マスに 何も ない 歩ける マス） | 10% 以下 | ${m.emptyPct}% |
| いちばん 多い 建物の 型の わりあい | 30% 以下 | ${m.maxModelShare}% |
| 入口・出口に 歩いて 行ける | 100% | ${m.unreachable.length ? "×" : "100%"} |

- 道ぞいの ならべかた: 並木・街灯・電柱・信号は 歩道の **車道がわの 1マス**、歩く ところは 反対がわの 1マスを あける。
- 住宅地: 家の 前に 1マスの 前庭（ブロック塀・生け垣・フェンス・門柱・カーポート・植木ばち）。路地に 電柱と 電線、角に カーブミラー。
- 商店街: 店ごとに のぼり・立て看板・店先の 品物。すずらん灯の 間に 旗かざり。屋台は 通りの 片がわ だけ（歩く はば 2マスを 残す）。
- 大きな 広場・芝生の 空白は 草むら（\`nat.tuft\`、通れる）や ハトで うめる。ただし 密度の 計算には 入れない。

## 6. 出典（事実の 確認）

- 環状交差点は 右回り（時計回り）通行: [愛知県警察 環状交差点の通行方法](https://www.pref.aichi.jp/police/koutsu/topics/ko-kisei/kannjyoukousatenn.html) ・ [警視庁 環状交差点の交通規制](https://www.keishicho.metro.tokyo.lg.jp/kotsu/doro/kisei_kanjokosaten.html)
- 駅前広場の 形式に「右回りロータリー（島有・島無）」が ある: [駅前広場のバス乗降場の効率的な運用に関する研究（運輸総合研究所）](https://www.jttri.or.jp/members2/coll/106_sasaki.pdf)
- 横断歩道の 白線（長さ3m・幅45cm・間隔45cm）・停止線: [国交省 東北地整 区画線の資料](http://www.thr.mlit.go.jp/sendai/furukoku/pdf/kouji/kouji/kukaku-mame.pdf) ・ [長野県警察 白線の間隔](https://www.pref.nagano.lg.jp/police/anshin/koutsu/oudanhodou-hakusenkankaku.html)
- ダイヤマーク（横断歩道の 予告・30m と 50m 手前）: [警視庁 ダイヤマークって何？](https://www.keishicho.metro.tokyo.lg.jp/kotsu/mark/daiyamark.html)
- 停止線は 横断歩道から 2m 以上: [交差点の道路標示の寸法と配置基準（CAD-LINE）](https://cad-line.jp/2025/11/15/kousaten-hyouji/)
`;
writeFileSync(OUT + "ASSET_LIST.md", md);
console.log("wrote ASSET_LIST.md", md.length, "chars;", all.length, "assets; used", Object.keys(use).length);
