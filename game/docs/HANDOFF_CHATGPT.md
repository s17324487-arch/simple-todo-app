# ChatGPT（Codex）への引き継ぎ手順

ぽかぽかタウンの開発を ChatGPT で続けるための、オーナー（人間）向けの手順書。
AI に守らせる作業ルールは リポジトリ直下の [`AGENTS.md`](../../AGENTS.md) に書いてあり、ChatGPT の **Codex** は それを自動で読む。

> 画面のボタン名や料金は変わることがある。迷ったら公式の説明を見る:
> [Codex cloud](https://learn.chatgpt.com/docs/cloud) ／ [Cloud environments](https://learn.chatgpt.com/docs/environments/cloud-environment) ／ [GitHub との連携](https://help.openai.com/en/articles/11145903-connecting-github-to-chatgpt) ／ [AGENTS.md](https://developers.openai.com/codex/guides/agents-md) ／ [GitHub の PR レビュー](https://developers.openai.com/codex/integrations/github)

---

## 0. 引き継ぎ時点の状態

| 項目 | 内容 |
| --- | --- |
| リポジトリ | https://github.com/s17324487-arch/simple-todo-app （ゲームは `game/` の中） |
| 公開 URL | https://s17324487-arch.github.io/simple-todo-app/game/ （main ブランチがそのまま公開される） |
| ver1 | 完成。git タグ **`v1.0.0`** に保存してある |
| 自動テスト | `npm run check`（静的チェック 約2400項目）、`npm test` / `npm run test:full`（ブラウザで13シナリオ）。PR を作ると GitHub Actions の **game-test** が自動で走る |
| 次にやること | [`ROADMAP_V2.md`](ROADMAP_V2.md) の上から順に（最初は V2-00） |
| まだ やっていないこと | iPhone / Android の実機での確認（→ このファイルの §8 のチェックリスト） |

## 1. しくみ（全体の流れ）

```
あなた ──「V2-03 を作って」──▶ Codex（クラウドの作業場で コードを書いて テストを実行）
                                   │
                                   ▼
                          GitHub に プルリクエスト（PR）
                                   │  ← 自動テスト game-test が走る（✓ か ✗）
                                   ▼
             あなたが確認して「Merge」 ──▶ 1〜2分で 公開URL に反映 ──▶ スマホで遊んで確認
```

- **Codex** は ChatGPT の中にある開発用の AI。GitHub のリポジトリを読んで、変更を作り、テストを実行し、PR を作れる。ChatGPT の各プランで使えるが、使える量はプランで違う（無料プランは制限が きつい。ふつうに開発するなら Plus 以上が目安。最新の条件は [Codex の料金ページ](https://chatgpt.com/codex/pricing/)）。
- **main にマージしたものが すぐ公開される**。だから「PR の自動テストが ✓」を確かめてからマージする。

## 2. Codex の準備（最初の1回だけ・10分くらい）

1. https://chatgpt.com/codex を開いて、ChatGPT のアカウントでログインする。
2. **GitHub と連携**する（「Connect to GitHub」などのボタン）。GitHub の画面に切りかわったら、アクセスを許可するリポジトリに
   `s17324487-arch/simple-todo-app` を選んで許可する。
3. **環境（Environment）を作る**（Codex の設定 → Environments → 新しい環境）。
   - リポジトリ: `s17324487-arch/simple-todo-app`
   - **セットアップスクリプト**（Setup script）に 次の3行を貼る:
     ```sh
     cd game
     npm ci
     npx playwright install --with-deps chromium
     ```
   - メンテナンススクリプト（Maintenance script。欄があれば）: `cd game && npm ci`
   - Node.js のバージョン: 20 以上なら何でもよい（既定のままでよい）
   - エージェントのインターネット接続: **オフ（既定）のままでよい**。テストはネットなしで動く。セットアップスクリプトは ネットありで動くので、上の3行はそのまま使える。
4. 保存する。

うまくいかないときは §7 を見る。

## 3. 最初の依頼（まず理解してもらう）

Codex の入力欄に 次を貼って、**質問（Ask）** として送る（コードは まだ変えさせない）:

```
このリポジトリの AGENTS.md、game/docs/ARCHITECTURE.md、game/docs/ROADMAP_V2.md を読んで、
次の4つを 短く まとめてください。コードは まだ変更しないでください。
1. ゲームの概要（3人のキャラ・遊びの柱）
2. 守るべきルール（特に セーブの互換性・ファイルの登録・ビルドなし）
3. テストのやり方
4. ver2 で最初にやること
```

まとめが的外れなら、どこが違うかを伝えて直してもらう。

## 4. ver2 の最初の PR（V2-00: バージョンを 2.0.0-dev に）

**コードを書く（Code）** として送る:

```
game/docs/ROADMAP_V2.md の V2-00 をやってください。
AGENTS.md のルールに従い、cd game && npm run check と npm test を実行して、結果を報告してください。
```

終わったら Codex の画面で差分（diff）とテスト結果を見て、**PR を作る**（「Create PR」「Push」などのボタン）。
そのあと §6 の手順で確認してマージする。公開 URL のタイトル画面が `ver 2.0.0-dev` になれば成功。

## 5. 依頼のしかた（コピペ用のひな形）

### 機能を作ってもらう

```
game/docs/ROADMAP_V2.md の V2-03（ケーキやさん）を実装してください。
- AGENTS.md のルールと「完了の条件」を守ること
- はじめに 実装の計画を箇条書きで示してから 作業すること
- cd game && npm run check と npm test（できれば npm run test:full）を実行し、結果を報告すること
- 見た目が変わるところは tests/screenshots/ の画像を確認し、気になる点があれば書くこと
- CHANGELOG.md の 2.0.0-dev の節に 追記すること
```

### バグを直してもらう

```
【バグ】（例）iPhone で おうちの「ごはん」ボタンを 2回 押さないと 反応しない。
【手順】1. はじめから → 2. おうちで「ごはん」を押す
【期待】1回で ごはんの一覧が出る
【実際】1回目は 何も起きない
原因を調べて 直してください。直ったことを確かめる テスト（tests/smoke.mjs か tools/check.mjs）も 足してください。
```

スクリーンショットや画面録画があれば いっしょに添付すると早い。

### アイデアを ロードマップに足してもらう（まだ作らない）

```
ver2 に「（やりたいこと）」を足したいです。
ゲームの雰囲気（AGENTS.md の §4-9）に合うように、game/docs/ROADMAP_V2.md に
受け入れ条件つきの項目として 追加する PR を作ってください。まだ実装は しないでください。
```

### コツ

- **1回の依頼で 1つのこと**。「ぜんぶ いい感じに」より「V2-05 だけ」のほうが 失敗が少ない。
- 大きな作り直し（フレームワークを入れる・ファイル構成を変える など）を提案されたら、理由を聞いてから決める（AGENTS.md の §3 で原則 禁止にしている）。
- 同じ会話の中で「ここを直して」と続けて頼める。

## 6. PR の確認とマージ

GitHub で PR のページを開いて:

1. **自動テスト**: 下の方の「Checks」／「All checks have passed」に **game-test ✓** が出ているか。
   - ✗ なら、PR にコメントで `@codex 自動テスト game-test が失敗しています。ログを見て原因を直してください。` と書く（Codex が PR の続きを作業してくれる）。または Codex の画面で同じことを頼む。
2. **スクリーンショット**: 「Checks」→ game-test → 実行結果のページの「Artifacts」にある **game-screenshots** をダウンロードすると、スマホ画面の画像（13シナリオ分）が見られる。
3. **変更されたファイル**（Files changed）: 次に当てはまったら 理由を聞く。
   - リポジトリ直下の `index.html`・`script.js`・`style.css`・`firebase-config.js`（別の ToDo アプリ）が変わっている
   - `game/js/save.js` の `KEY` が変わっている
   - テストが消されている・スキップされている
4. **AI レビュー**（任意）: PR に `@codex review` とコメントすると、Codex が AGENTS.md の「Code Review Rules」にそってレビューしてくれる（Codex の設定で コードレビューを有効にしておく）。
5. 問題なければ **「Merge pull request」**。1〜2分後に 公開 URL に反映される。
   - スマホではページを再読み込みする。ホーム画面に追加したアプリなら、一度 完全に閉じて 開き直す。
6. スマホで少し遊んで、おかしなところがあれば §5 のバグのひな形で頼む。

## 7. 困ったとき

| 困りごと | どうする |
| --- | --- |
| マージしたら 公開中のゲームが壊れた | GitHub の その PR のページの「Revert」ボタン → できた PR をマージすると 元に戻る |
| ver1 に まるごと戻したい | Codex に「git タグ v1.0.0 の状態に game/ を戻す PR を作って。セーブ（Save.KEY）は そのまま」と頼む |
| セーブが消えたように見える | `Save.KEY` が変わっていないか確認（AGENTS.md §4-3）。同じ端末・同じブラウザ・同じ URL で開いているかも確認 |
| Codex の環境でテストが動かない | セットアップスクリプトの3行を確認。`--with-deps` で失敗するなら 3行目を `npx playwright install chromium` に変えて試す。それでも だめなら「npm run check だけ実行して」と頼み、ブラウザのテストは GitHub Actions（game-test）に まかせる |
| 自動テスト game-test が 何度やっても ✗ | Codex に ログを読ませて直してもらう。テストを消して ✓ にするのは禁止（AGENTS.md） |
| 変更が大きすぎて 確認できない | 「この PR を 小さな PR 2〜3個に 分けて作り直して」と頼む |
| Codex の利用上限に達した | 時間をおくか、プランを見直す（上限はプランごとに決まっている） |

## 8. 実機チェックリスト（ROADMAP の V2-02 用）

iPhone（Safari）と Android（Chrome）で、公開 URL を開いて確かめる。NG があれば、端末名・OS のバージョン・手順・スクリーンショットを添えて Codex に頼む。

- [ ] ページが開き、タイトル画面が出る。「ホーム画面に追加」すると 全画面のアプリになる
- [ ] 最初にタップしたあと 音が鳴る（iPhone はマナーモードを解除して確認）
- [ ] 名前の変更で キーボードが出て、入力できる。画面が ずれたままに ならない
- [ ] 町で タップ移動・ドラッグのスティックが 思いどおりに動く
- [ ] 4つのお店が 最後まで遊べる（はいしゃさんの「こする」「ながおし」も）
- [ ] バトルのボタンが 押しやすく、文字が はみ出ていない
- [ ] おうちの もようがえで 家具を ドラッグできる（画面が スクロールしない）
- [ ] アプリを閉じて 開き直すと「つづきから」で 同じ場所から遊べる
- [ ] 機内モードでも 開ける（2回目以降。オフライン対応）
- [ ] 画面の上下（ノッチ・ホームバー）に ボタンや文字が かくれない
- [ ] 10分くらい遊んで、カクカクしない・端末が熱くなりすぎない

## 9. ふつうの ChatGPT（チャット）で続ける場合

Codex を使わずに、いつもの ChatGPT の会話で相談することもできる。

- **GitHub との連携**（ChatGPT の設定の「アプリ」または「コネクタ」→ GitHub）で リポジトリを読ませる。「AGENTS.md と game/docs を読んで、V2-03 の作り方を説明して」のように使う。
- または GitHub の「Code → Download ZIP」で ZIP を作り、ChatGPT に添付して「AGENTS.md を読んでから答えて」と頼む。
- ただし、この方法だと 変更したファイルを 自分で GitHub に反映する手間がかかり、テストも自分で動かすことになる。**開発は Codex、相談は チャット** という分け方がおすすめ。

## 10. Codex 以外の AI に引き継ぐ場合

AGENTS.md は Codex 以外の多くの AI コーディングツールも読む共通の形式なので、そのまま使える。
どの AI でも、最初に「AGENTS.md と game/docs を読んでから作業して」と伝える。
