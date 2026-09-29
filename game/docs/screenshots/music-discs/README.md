# レアの 音楽プレイヤーと ディスク（ART-05）

`npm run test:full` の スモーク「music-disc-390 / music-disc-375」で とった 画面（`tests/screenshots/` から コピー）。

| ファイル | 場面 |
| --- | --- |
| `music-disc-390_crepe_result.png` / `-375_crepe_result.png` | クレープやさんの おてつだいを ぜんぶ ◎ で おえた「きょうの けっか」。ディスク「あまい カフェ」と ラジカセ・おまけの「3にんの テーマ」と「きらきらぼし」 |
| `music-disc-390_disc-list.png` / `-375_disc-list.png` | へやの ラジカセを タップ → もって いる ディスクを えらぶ まど（ボタンは 44px いじょう） |
| `music-disc-390_playing.png` / `-375_playing.png` | ラジカセで「あまい カフェ」を ならして いる ところ（スピーカーが ゆれて 音ぷが とぶ） |
| `music-disc-390_jukebox.png` / `-375_jukebox.png` | 8まいで もらえる ジュークボックスで「トルコ こうしんきょく」・たからばこの ちくおんき・ラジカセを ならべた へや |
| `music-disc-390_chest-disc.png` / `-375_chest-disc.png` | はらっぱの たからばこ。中みの あとの ページで ディスク「はらっぱを こえて」 |

## ディスクだけの きょく

ゲームの 音は WebAudio で その場で 合成する（音声ファイルは ない）。ディスクだけの きょくは 2しゅるい ある。

### ぽかぽかの きょく（この ゲームの ために つくった きょく）

オーナーの 指示（2026-09-29「自作の曲を消す必要はない」）で、名曲と いっしょに のこして いる（`SONGS.*.original: true`・出典は ない）。

| ディスク | テンポ・調 | がっき | 手に入る ところ |
| --- | --- | --- | --- |
| 3にんの テーマ | 112・ハ長調 | プラック・エレピ・ベース | ラジカセ（はじめての ディスク）の おまけ |
| ほしぞら ララバイ | 72・ヘ長調 | マレット・ピアノ | ちくおんき（たからばこ）の おまけ |
| ぽかぽか マーチ | 124・ト長調 | ピアノ・エレピ・ベース | ジュークボックス（ディスク 8まい）の おまけ |

### 名曲（パブリックドメイン）の 出典

作曲者が なくなって 70年 いじょう たった 名曲の メロディと 和音を、つぎの 公開楽譜（LilyPond の 原本）から 写した。
日本では 2018年12月30日から 保護期間が 死後70年に なったが、1967年 までに なくなった 作者の 作品は その まえに 期間が おわって いる（[文化庁 Q&A](https://www.bunka.go.jp/seisaku/chosakuken/hokaisei/kantaiheiyo_chosakuken/1411890.html)）。

| ディスク | 作品 | 作曲者 | 楽譜（Mutopia Project） | ライセンス |
| --- | --- | --- | --- | --- |
| きらきらぼし | 「ああ ママに 言うわ」による 12の 変奏曲 K.265 の 主題（1785） | W. A. モーツァルト（1756-1791） | [#2236](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=2236) | Public Domain |
| カノン | 3つの ヴァイオリンと 通奏低音の ための カノン（1694） | J. パッヘルベル（1653-1706） | [#2047](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=2047) | 作品は Public Domain。楽譜の 清書は CC BY 4.0（Michael Fischer v. Mollard） |
| トルコ こうしんきょく | ピアノソナタ 第11番 K.331 第3楽章（1783ごろ） | W. A. モーツァルト | [#108](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=108) | Public Domain |
| アイネ クライネ | アイネ・クライネ・ナハトムジーク K.525 第1楽章（1787） | W. A. モーツァルト | [#900](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=900) | Public Domain |

- 写した ところ: きらきらぼし は 主題 16小節（2/4）、カノン は ヴァイオリン I の はじめ 8小節と 低音、トルコ こうしんきょく は はじめの 8小節（右手・左手）、アイネ クライネ は はじめの 8小節（第1ヴァイオリン・チェロ）。
- ModernMusic の 8分音符（トルコ こうしんきょく は 16分音符）に あわせる ため、装飾音と 付点16分は 8分音符に まとめた。
- 楽譜の 原本は [MutopiaProject/mutopiaproject](https://github.com/MutopiaProject/mutopiaproject) の `ftp/` に ある。
