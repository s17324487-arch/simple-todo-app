// LINE れんけい（js/line-link.js・game/line/Code.gs・UI-126）の 検査（ブラウザ なし）
// 1. ゲーム: つなぎさきの かたち・セーブ・ばんごうと あいことば・おくる もの（きまった かぎ だけ）・つうしんは OnlineNet.gas だけ・登録
// 2. GAS（tests/line-fake.mjs で Code.gs を うごかす）: ひもづけ・ようす・あいことば ちがい・へんじ・はなす・ともだち かいじょ・
//    おしらせ（6じかん いじょう・1にち 1かい・よるは おくらない・つき 190 と ひとり 31 まで・429 で とまる）・ことば
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";
import { lineFake } from "../tests/line-fake.mjs";
const R = gameContext();
const { LineLink: L, Save } = R;
let n = 0;
const ok = (c, m) => { n++; assert(c, m); };
const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const kanji = /[一-鿿]/;

// ---- 1. ゲーム ----
{
  ok(!L.ready() && R.ONLINE_CONFIG.lineUrl === "" && R.ONLINE_CONFIG.lineFriend === "", "はじめは じゅんびちゅう（つなぎさきは から）");
  const url = (u, f = "") => { L.over = { lineUrl: u, lineFriend: f }; return L.ready(); };
  ok(url("https://script.google.com/macros/s/AKfycbx1234567890abcdefghijk/exec"), "GAS の URL");
  for (const bad of ["https://example.com/exec", "http://script.google.com/macros/s/AKfycbx1234567890abcdefghijk/exec", "https://script.google.com/macros/s/short/exec", "https://script.google.com.evil.jp/macros/s/AKfycbx1234567890abcdefghijk/exec", "http://127.0.0.1:8080/line"]) { L.over = null; ok(!L.URL_RE.test(bad), "だめな URL " + bad); }
  url("https://script.google.com/macros/s/AKfycbx1234567890abcdefghijk/exec", "https://lin.ee/AbCd123");
  ok(L.friendUrl() === "https://lin.ee/AbCd123", "ともだち ついかの URL");
  L.over = { lineUrl: "https://script.google.com/macros/s/AKfycbx1234567890abcdefghijk/exec", lineFriend: "javascript:alert(1)" };
  ok(L.friendUrl() === "", "へんな ともだち URL は つかわない");
  ok(url("http://127.0.0.1:8080/line"), "テストは 127.0.0.1");
  L.over = null;
  // セーブ
  ok(JSON.stringify(Save.fresh().line) === JSON.stringify(L.fresh()), "Save.fresh().line");
  const old = Save.fresh(); delete old.line; const m = Save.migrate(JSON.parse(JSON.stringify(old)));
  Save.d = m; ok(L.st().code === "" && !L.on(), "ふるい セーブにも はいる");
  Save.d.line = { on: true, agreed: 5, ver: 1, code: "abc", sec: "x", linked: true, sent: -1, junk: 1 };
  const s = L.st(); ok(!s.on && !s.linked && s.code === "" && s.sent === 0 && !("junk" in s), "こわれた かたちを なおす " + JSON.stringify(s));
  // ばんごう・あいことば
  for (let i = 0; i < 200; i++) { const c = L.rand(6, L.ALPHA), k = L.rand(32, L.SEC_ALPHA); ok(/^[A-HJ-NP-Z2-9]{6}$/.test(c) && /^[A-Za-z0-9]{32}$/.test(k), "ばんごう " + c); }
  ok(!/[IO01]/.test(L.ALPHA), "まぎらわしい もじを つかわない");
  // おくる もの
  Save.d = Save.fresh(); Object.assign(L.st(), { on: true, agreed: 1, ver: 1, code: "ABC234", sec: "a".repeat(32), linked: true });
  Save.d.chars.wanko.hunger = 33.7; Save.d.chars.goji.mood = 120; Save.d.chars.gachan.name = "ひみつの なまえ";
  for (const op of ["hello", "check", "test", "bye"]) { const b = L.payload(op); ok(JSON.stringify(Object.keys(b)) === '["op","code","sec"]', `${op}: きまった かぎ だけ`); }
  const st = L.payload("state");
  ok(JSON.stringify(Object.keys(st)) === '["op","code","sec","s"]' && JSON.stringify(Object.keys(st.s)) === '["w","g","j"]' && st.s.w[0] === 34 && st.s.j[1] === 100 && Object.values(st.s).every((v) => v.length === 2 && v.every(Number.isInteger)), "ようすは 3人の [おなか, ごきげん] の せいすう だけ " + JSON.stringify(st.s));
  ok(!JSON.stringify(st).includes("ひみつ"), "つけた なまえを おくらない");
  // つうしんは OnlineNet.gas だけ
  const src = read("js/line-link.js").replace(/^\s*\/\/.*$/gm, "");
  ok(!/\bfetch\(|XMLHttpRequest|EventSource|sendBeacon|WebSocket|navigator\.|import\(/.test(src) && /OnlineNet\.gas\(/.test(src), "line-link.js は じぶんで つながない");
  ok(/gas\(url, body, keepalive = false\)/.test(read("js/online-net.js")), "OnlineNet.gas");
  // 同意の まえに つながらない（begin は consent の あと）
  const beg = src.slice(src.indexOf("async begin()"), src.indexOf("async check()"));
  ok(beg.indexOf("this.consent()") > 0 && beg.indexOf("this.consent()") < beg.indexOf('this.call("hello")'), "18さい いじょうの 同意の あとに つながる");
  ok(/sync\(force = false, keepalive = false\) \{[\s\S]*?if \(!this\.on\(\) \|\| !s\.linked\)/.test(src), "つないで いない ときは おくらない");
  // 登録
  const html = read("index.html"), sw = read("sw.js");
  ok(html.indexOf('src="js/online-net.js"') < html.indexOf('src="js/line-link.js"') && html.indexOf('src="js/menu.js"') < html.indexOf('src="js/line-link.js"') && html.indexOf('src="js/line-link.js"') < html.indexOf('src="js/debug.js"') && sw.includes('"./js/line-link.js"'), "index.html と sw.js");
  ok(!sw.includes("line/Code.gs") && !html.includes("Code.gs"), "GAS の ファイルは ゲームに いれない");
  ok(/LineLink\.settings\(el/.test(read("js/menu.js")), "≡ の せってい");
  const dbg = read("js/debug.js"); ok(/lineServer\(conf = null\)/.test(dbg) && /lineLink\(\)/.test(dbg) && /lineSync\(\)/.test(dbg), "PokaDebug");
}

// ---- 2. GAS ----
{
  const U1 = "U" + "1".repeat(32), U2 = "U" + "2".repeat(32), SEC = "s".repeat(32), SEC2 = "t".repeat(32);
  const G = lineFake();
  const T0 = G.now; // 2026-10-14 12:00（にほん）
  ok(G.api.doGet().text.includes("pokapoka-line"), "doGet");
  ok(G.post("x").err === "bad" && G.post({ op: "hello", code: "abc", sec: SEC }).err === "bad" && G.post({ op: "hello", code: "ABC234", sec: "short" }).err === "bad", "へんな もの は うけとらない");
  // ひもづけ
  let r = G.post({ op: "hello", code: "ABC234", sec: SEC });
  ok(r.ok && r.linked === false && G.code("ABC234") && G.code("ABC234").h !== SEC && !JSON.stringify(G.props()).includes(SEC), "hello（あいことばは ハッシュ だけ のこす）");
  ok(G.post({ op: "hello", code: "ABC234", sec: SEC2 }).err === "used" && G.post({ op: "check", code: "ABC234", sec: SEC2 }).err === "nocode", "あいことばが ちがうと つかえない");
  ok(G.post({ op: "state", code: "ABC234", sec: SEC, s: { w: [50, 50], g: [50, 50], j: [50, 50] } }).ok, "つながる まえの ようす");
  ok(G.post({ op: "state", code: "ABC234", sec: SEC, s: { w: [50, 50], g: [50, 50], j: [50, 101] } }).err === "bad" && G.post({ op: "state", code: "ABC234", sec: SEC, s: { w: [50, 50], g: [50, 50] } }).err === "bad" && G.post({ op: "state", code: "ABC234", sec: SEC, s: { w: [50, 50], g: [50, 50], j: [50, 50], x: "なまえ" } }).ok, "ようすは きまった かたち だけ");
  ok(!JSON.stringify(G.code("ABC234").s).includes("なまえ"), "よけいな ものは のこさない");
  G.line([{ type: "follow", replyToken: "rf", source: { type: "user", userId: U1 } }]);
  ok(G.last().path === "reply" && G.last().body.replyToken === "rf" && /ばんごう/.test(G.last().body.messages[0].text) && G.last().auth === "Bearer TEST_TOKEN", "ともだち ついかの あいさつ（へんじ）");
  G.text(U1, "zzz999"); ok(/みつからない/.test(G.last().body.messages[0].text), "しらない ばんごう");
  G.text(U1, " abc 234 "); ok(G.code("ABC234").u === U1 && G.store.get("u:" + U1) === '"ABC234"' && /つながった/.test(G.last().body.messages[0].text), "LINE で ばんごうを おくると つながる（こもじ・くうはく も OK）");
  ok(G.post({ op: "check", code: "ABC234", sec: SEC }).linked === true, "check で つながった");
  G.text(U2, "ABC234"); ok(G.code("ABC234").u === U2 && !G.store.has("u:" + U1), "べつの 人が おくると つけかわる");
  G.text(U1, "ABC234");
  // ようすの へんじ
  G.post({ op: "state", code: "ABC234", sec: SEC, s: { w: [70, 80], g: [60, 60], j: [40, 50] } });
  G.now = T0 + 3 * 3600000; G.text(U1, "げんき？");
  ok(G.last().path === "reply" && /3じかん まえ/.test(G.last().body.messages[0].text), "ようすの へんじ " + G.last().body.messages[0].text);
  G.text(U2, "こんにちは"); ok(/ばんごうを おくってね/.test(G.last().body.messages[0].text), "つないで いない 人には つなぎかた");
  // おしらせ（tick）
  const pushes = () => G.sent.filter((x) => x.path === "push").length;
  G.now = T0 + 1 * 3600000; G.post({ op: "state", code: "ABC234", sec: SEC, s: { w: [70, 80], g: [60, 60], j: [40, 50] } });
  G.now = T0 + 5 * 3600000; G.tick(); ok(pushes() === 0, "6じかん たつ まえは おくらない");
  G.now = T0 + 8 * 3600000; G.tick(); // 20じ（にほん）
  ok(pushes() === 1 && G.last().body.to === U1 && /おなか/.test(G.last().body.messages[0].text), "6じかん いじょう → おなかが すいた子から " + JSON.stringify(G.last().body));
  G.now = T0 + 8.5 * 3600000; G.tick(); ok(pushes() === 1, "1にち 1かい");
  G.now = T0 + 10 * 3600000; G.tick(); ok(pushes() === 1, "22じ は おくらない");
  G.now = T0 + 19 * 3600000; G.tick(); ok(pushes() === 1, "7じ（あさ）は おくらない");
  G.now = T0 + 21 * 3600000; G.tick(); ok(pushes() === 2, "つぎの 日の 9じ");
  G.now = T0 + 46 * 3600000; G.tick(); ok(pushes() === 3 && /あって|まって|かえって/.test(G.last().body.messages[0].text), "ながく あわないと さみしい " + G.last().body.messages[0].text);
  // テストの おしらせ
  r = G.post({ op: "test", code: "ABC234", sec: SEC }); ok(r.sent && G.last().path === "push", "テストの おしらせ");
  // つきの じょうげん（ひとり 31・ぜんぶ 190）
  const c = G.code("ABC234"); c.n = 31; G.store.set("c:ABC234", JSON.stringify(c));
  ok(!G.post({ op: "test", code: "ABC234", sec: SEC }).sent, "ひとり つき 31 まで");
  c.n = 0; G.store.set("c:ABC234", JSON.stringify(c)); G.store.set("month", JSON.stringify({ m: "2026-10", n: 190 }));
  ok(!G.post({ op: "test", code: "ABC234", sec: SEC }).sent, "ぜんぶで つき 190 まで");
  G.now = Date.UTC(2026, 10, 2, 3, 0, 0); ok(G.post({ op: "test", code: "ABC234", sec: SEC }).sent, "つぎの つきは また おくれる");
  // 429 で とまる・LINE_TOKEN が ないと おくらない
  G.status = 429; const before = pushes(), n0 = G.code("ABC234").n; G.now += 30 * 3600000; G.tick(); ok(pushes() === before + 1 && G.code("ABC234").n === n0, "429 は かぞえない");
  G.status = 200;
  // はなす（LINE で「やめる」・ゲームの bye・ともだち かいじょ）
  G.text(U1, "やめる"); ok(G.code("ABC234").u === "" && !G.store.has("u:" + U1) && /はずした/.test(G.last().body.messages[0].text), "LINE で やめる");
  G.text(U1, "ABC234"); G.line([{ type: "unfollow", source: { type: "user", userId: U1 } }]); ok(G.code("ABC234").u === "" && !G.store.has("u:" + U1), "ともだち かいじょで はずれる");
  G.text(U1, "ABC234"); r = G.post({ op: "bye", code: "ABC234", sec: SEC });
  ok(r.ok && !G.code("ABC234") && !G.store.has("u:" + U1) && Object.keys(G.props()).every((k) => k === "LINE_TOKEN" || k === "month"), "ゲームの bye で ぜんぶ けす " + JSON.stringify(Object.keys(G.props())));
  // つながらない ばんごうは 1にちで けす・かずの じょうげん
  G.post({ op: "hello", code: "ZZZ234", sec: SEC }); G.now += 25 * 3600000; G.tick(); ok(!G.code("ZZZ234"), "つながらない ばんごうは 1にちで けす");
  const H = lineFake(); for (let i = 0; i < 300; i++) H.store.set("c:" + String(i).padStart(6, "A"), "{}");
  ok(H.post({ op: "hello", code: "ABC234", sec: SEC }).err === "full", "ばんごうの かずの じょうげん");
  // トークンが ない
  const N = lineFake({ token: "" }); N.post({ op: "hello", code: "ABC234", sec: SEC }); N.text(U1, "ABC234"); ok(!N.sent.length, "LINE_TOKEN が ないと おくらない");
  // setup は トリガーを 1つ だけ
  G.api.setup(); G.api.setup(); ok(G.triggers.join() === "tick", "setup の トリガーは 1つ");
  // ことば
  const all = []; const walk = (v) => { if (typeof v === "string") all.push(v); else if (v && typeof v === "object") Object.values(v).forEach(walk); };
  walk(G.api.LINES); all.push(G.api.LINES.status("w", 3), G.api.LINES.status("j", 0.2));
  for (const t of all) { ok(!kanji.test(t.replace(/LINE|≡/g, "")), "かんじ「" + t + "」"); ok(!/ぼく|わたし|おれ/.test(t), "3人は なまえで よぶ「" + t + "」"); ok(t.length <= 90, "ながすぎる「" + t + "」"); }
  ok(!/LINE_TOKEN"\s*[:=]\s*"[A-Za-z0-9+/=]{20,}/.test(read("line/Code.gs")), "トークンを かいて いない");
}
console.log(`✓ LINE れんけい（UI-126）: ${n} 項目`);
