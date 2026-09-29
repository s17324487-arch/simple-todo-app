# サンシャインいけぶ の 見本（UI-04・UI-06）

## UI-06（2026-09-29）: 服の 質・マネキン・店を ひろく・店内 BGM

オーナーの FB「店内で 売られて いる 洋服の クオリティが 低い・お店を 広げて 見やすく・展示の モデルを マネキンに・店内 BGM を 適切に」への 対応。

| 画像 | 中み |
| --- | --- |
| `wear-before-after.png` | 服 9ちゃくの まえ（うえ）と あと（した）。1ぎょう = 1ちゃく、わんこ（まえ・うしろ・ひだり・みぎ）・がちゃん（まえ・うしろ・よこ）・ごじ（まえ・うしろ・よこ）・マネキン |
| `390-1f-shops.png` / `375-1f.png` | 1F の 服の 店（はねーず・あにまるず）。入口の まえに マネキンが 3たいずつ |
| `390-1f-inside.png` | 店の 中に はいった ところ（3人の まえの マネキンは すける） |
| `375-buy.png` | 台を タップして かう 画面（ひらがなの 名前・せつめいは 文節で おりかえす） |
| `390-1f-lux.png` / `390-1f-plaza.png` / `390-1f-east.png` / `390-1f-spawn.png` | ごしごし と いいつか かぐ・ふんすい ひろば・ひがしがわ・いりぐち |
| `390-2f-food.png` / `390-2f-atrium.png` | 2F の フードコート（テーブルは 店の 中）・ふきぬけ |
| `390-3f-marche.png` / `390-3f-play.png` / `375-3f.png` | 3F の マルシェ・ほんと おもちゃ・パズル |
| `390-map.png` / `375-map.png` | フロアマップ（45×31 マスの 1F） |

- 服は chara.js の WEAR と おなじ かさね（behind・sleeve・torso・top）で 描く（`js/ike-wear.js` の `IkeWear`）。まえは 体に はった 絵（top に 1まい）だったので、そでが なく、うしろ すがたも まえと おなじ だった。
- 名前は ひらがなに した（はなびら ワンピース・リボンの カーディガン・ほしくず ケープ・パンダ ポンチョ・こぐま パーカー・うさぎ ケープ・ぶとうかいの ドレス・つきよの マント・くろばらの ジャケット）。ID・ねだん・ステータスは そのまま（セーブは かわらない）。
- マネキン（`WearMannequin`）は かおの ない 人形。PROFILE と おなじ 形の 目安を もつので、どの 服も そのまま きせられる。

### 店内 BGM の 出典

どれも 作曲者が なくなって 70年 いじょう たった 作品（日本では 1967年 までに なくなった 作者の 作品は 保護期間が おわって いる）。楽譜は Mutopia Project の LilyPond 原本（GitHub `MutopiaProject/MutopiaProject` の `ftp/`）で、清書も Public Domain。音の たかさ・ながさは 楽譜の まま 写し、楽器の わりふりと ベース・パッド・ドラムの そえものは この ゲームの アレンジ。

| 場所 | 曲（ゲームの 名前） | 作曲者 | 作品 | 楽譜 | つかった ところ |
| --- | --- | --- | --- | --- | --- |
| 1F（ふく・かぐ・ふんすい ひろば） | ガヴォット | G. F. Händel（1685-1759） | Gavotte（Aylesford Pieces） | Mutopia #151（`HandelGF/Aylesford/03-gavotte`・Edition Schott 1930） | はじめの 8小節（4/4・G） |
| 2F（グルメ・フードコート） | エンターテイナー | S. Joplin（1868-1917） | The Entertainer, A Ragtime Two Step（1902） | Mutopia #263（`JoplinS/entertainer`・1902年 初版の 複製） | A の 8小節（小節5〜12・2/4・C） |
| 3F（マルシェ・ほん・おもちゃ・パズル） | きの へいたいの マーチ | P. I. Tchaikovsky（1840-1893） | Album for the Young Op.39 No.5 March of the Wooden Soldiers | Mutopia #1806（`TchaikovskyPI/O39/05MarchOfTheWoodenSoldiers`・Schirmer 1904） | はじめの 8小節（2/4・D） |

- 3きょく とも 8小節で 1まわり（ModernMusic の 64 step）。3/4 の ワルツは 64 step で きれいに まわらないので えらばなかった。
- レジの 画面（`BUY_SHOPS.ike_*`）の 曲は フロアの 曲と おなじ もの（`SONGS.shop_ike_hane === SONGS.mall_1f`）。`Sound.bgm` は おなじ 曲なら とちゅうから やりなおさない。
- 12F・13F の すいぞくかんは これまでの `aquarium` の まま。ネリカス電機（べつの たてもの）の 曲も そのまま。

## UI-04（2026-09-29）: 斜め上から 見る 館

`before/` は 作りなおす まえの よこから 見た モール。`before-after.png` は UI-04 の まえと あと。
