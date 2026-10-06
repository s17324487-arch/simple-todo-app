// オンラインの つなぎさき（E5・UI-94）。Firebase の「プロジェクトの せってい → マイアプリ → ウェブアプリ」に ある 3つ だけを かく。
// - apiKey は ひみつの 値では ない（Firebase の ウェブ用 API キーは プロジェクトを しめす 名前。データは game/firebase/database.rules.json の きまりで まもる）。
// - から の あいだは オンラインは「じゅんびちゅう」（どこにも つながらない）。
// - オーナーの 指示（2026-10-02・2026-10-05）: リアルタイム通信は 無料（Firebase の Spark プラン）・18さい いじょうの 同意を おした 人だけ つながる。
// - 2026-10-06: オーナーが つくった プロジェクト（nerikas5858・データベースは シンガポール asia-southeast1）。SDK の ほかの 値（authDomain・appId など）は つかわない。
const ONLINE_CONFIG = Object.freeze({
  apiKey: "AIzaSyBjVkAjNzgjMsscgvnWW0hJ-hsIms080Cw",
  databaseURL: "https://nerikas5858-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "nerikas5858",
});
