// オンラインの つなぎさき（E5・UI-94）。Firebase の「プロジェクトの せってい → マイアプリ → ウェブアプリ」に ある 3つ だけを かく。
// - apiKey は ひみつの 値では ない（Firebase の ウェブ用 API キーは プロジェクトを しめす 名前。データは game/firebase/database.rules.json の きまりで まもる）。
// - から の あいだは オンラインは「じゅんびちゅう」（どこにも つながらない）。
// - オーナーの 指示（2026-10-02・2026-10-05）: リアルタイム通信は 無料（Firebase の Spark プラン）・18さい いじょうの 同意を おした 人だけ つながる。
const ONLINE_CONFIG = Object.freeze({ apiKey: "", databaseURL: "", projectId: "" });
