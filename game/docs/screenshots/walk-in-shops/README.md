# 歩いて入るおみせ

全9業種。入口 → 3人で店内を歩く → 店員をタップ → 買い物/おてつだい。全店舗に専用の展示・設備と通れる床を設けています。

[390の一覧](overview-390.png) / [375の一覧](overview-375.png) / [内装素材](assets.png) / [3人と向きの確認](characters-directions.png)

390×844 / 375×667、deviceScaleFactor=2 の実行画面。残高987,654は互換性テスト用の既存セーブを再現したものです。

| おみせ | 390×844 | 375×667 |
| --- | --- | --- |
| 洋服店 | ![洋服店390](walk-in-stores-390_clothes.png) | ![洋服店375](walk-in-stores-375_clothes.png) |
| 家具店 | ![家具店390](walk-in-stores-390_furniture.png) | ![家具店375](walk-in-stores-375_furniture.png) |
| スーパー | ![スーパー390](walk-in-stores-390_market.png) | ![スーパー375](walk-in-stores-375_market.png) |
| クレープ屋 | ![クレープ屋390](walk-in-stores-390_crepe.png) | ![クレープ屋375](walk-in-stores-375_crepe.png) |
| 歯医者 | ![歯医者390](walk-in-stores-390_dentist.png) | ![歯医者375](walk-in-stores-375_dentist.png) |
| パン屋 | ![パン屋390](walk-in-stores-390_bakery.png) | ![パン屋375](walk-in-stores-375_bakery.png) |
| 花屋 | ![花屋390](walk-in-stores-390_florist.png) | ![花屋375](walk-in-stores-375_florist.png) |
| パズル店 | ![パズル店390](walk-in-stores-390_link.png) | ![パズル店375](walk-in-stores-375_link.png) |
| 配送所 | ![配送所390](walk-in-stores-390_relay.png) | ![配送所375](walk-in-stores-375_relay.png) |

再現: `node tests/smoke.mjs --full --shots --only=walk-in-stores`。素材の一覧は `tools/preview.html` の「おみせの内装・展示」。

保存キー・スキーマは従来どおり。入店時に入口の外を保存し、購入は即時保存します。再読み込みでは同じ入口の外から再開します。

確認結果: `npm run check` 成功、`npm test` 24/24成功。両サイズの専用テストと、最終レイアウト調整後の375テストも成功。`file://` で全9店舗×2サイズを撮影し、素材プレビューを含めブラウザエラーは0件。
