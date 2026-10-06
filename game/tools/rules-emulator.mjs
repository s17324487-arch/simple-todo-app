// オンライン（E5）の きまり（game/firebase/database.rules.json）を 本物の Firebase Realtime Database エミュレーターで ためして、
// テスト用の にせの サーバー（tests/online-fake.mjs）が おなじ こたえ（とおる／とめる・のこる データ）を かえすかも くらべる。開発者むけ（npm run check には いれない）。
// - いる もの: Java 11 いじょう と エミュレーターの jar（firebase-tools が つかう もの。いまは firebase-database-emulator-v4.11.2.jar）。
//   jar は https://storage.googleapis.com/firebase-preview-drop/emulator/firebase-database-emulator-v4.11.2.jar
//   （firebase-tools の lib/emulator/downloadableEmulatorInfo.json の remoteUrl・SHA-256 b70d99344caf17c98b6f910fa8f6edf32a7c016cb1035e8915f70d38901eb97f）
// - つかいかた: node tools/rules-emulator.mjs <jar の ばしょ>（または FIREBASE_DB_EMULATOR_JAR=<jar> node tools/rules-emulator.mjs）
// - ルールを かえた ときは ここに ためしを たす。エミュレーターと ちがったら ルールを、にせの サーバーと ちがったら tests/online-fake.mjs を なおす。
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { createServer } from "node:net";
import { startOnlineFake } from "../tests/online-fake.mjs";

const JAR = process.argv[2] || process.env.FIREBASE_DB_EMULATOR_JAR;
if (!JAR) { console.error("つかいかた: node tools/rules-emulator.mjs <firebase-database-emulator-*.jar>"); process.exit(2); }
const RULES = readFileSync(new URL("../firebase/database.rules.json", import.meta.url), "utf8");
const NS = "pokapoka-rules-test";
const freePort = () => new Promise((ok) => { const s = createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => ok(p)); }); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SV = { ".sv": "timestamp" };

// ---- エミュレーター ----
const port = await freePort();
const emu = spawn("java", ["-Duser.language=en", "-jar", JAR, "--port", String(port), "--host", "127.0.0.1"], { stdio: ["ignore", "pipe", "pipe"] });
let emuLog = "";
emu.stdout.on("data", (b) => (emuLog += b)); emu.stderr.on("data", (b) => (emuLog += b));
const EMU = `http://127.0.0.1:${port}`;
for (let i = 0; ; i++) {
  try { await fetch(`${EMU}/.json?ns=${NS}`); break; } catch (e) { if (i > 120) { console.error("エミュレーターが うごかない\n" + emuLog); process.exit(2); } await sleep(500); }
}
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const jwt = (uid) => { const t = Math.floor(Date.now() / 1000); return b64({ alg: "none", typ: "JWT" }) + "." + b64({ sub: uid, user_id: uid, aud: NS, iss: "https://securetoken.google.com/" + NS, iat: t, exp: t + 3600, auth_time: t, firebase: { sign_in_provider: "anonymous", identities: {} } }) + "."; };
const put = await fetch(`${EMU}/.settings/rules.json?ns=${NS}`, { method: "PUT", headers: { Authorization: "Bearer owner" }, body: RULES });
if (put.status !== 200) { console.error("ルールが よみこめない " + put.status + " " + (await put.text())); emu.kill(); process.exit(1); }
const emuTarget = {
  name: "エミュレーター",
  users: {},
  async user(name) { return (this.users[name] ||= { uid: "u" + name + "0123456789abcdefghijklmn".slice(0, 27 - name.length), tok: null }); },
  async req(method, path, body, who, q = "") {
    const u = who ? await this.user(who) : null;
    const r = await fetch(`${EMU}/${path}.json?ns=${NS}${u ? "&auth=" + encodeURIComponent(jwt(u.uid)) : ""}${q ? "&" + q : ""}`, { method, headers: { "Content-Type": "application/json" }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    await r.text();
    return r.status;
  },
  async at(path) { const r = await fetch(`${EMU}/${path}.json?ns=${NS}&access_token=owner`); return r.json(); },
  async reset() { await fetch(`${EMU}/.json?ns=${NS}&access_token=owner`, { method: "PUT", body: "null" }); },
};
// ---- にせの サーバー ----
const fake = await startOnlineFake();
const fakeTarget = {
  name: "にせの サーバー",
  users: {},
  async user(name) {
    if (!this.users[name]) { const r = await (await fetch(`${fake.base}/auth/accounts:signUp?key=${fake.conf.apiKey}`, { method: "POST", body: "{}" })).json(); this.users[name] = { uid: r.localId, tok: r.idToken }; }
    return this.users[name];
  },
  async req(method, path, body, who, q = "") {
    const u = who ? await this.user(who) : null;
    const r = await fetch(`${fake.base}/db/${path}.json?auth=${encodeURIComponent(u ? u.tok : "")}${q ? "&" + q : ""}`, { method, headers: { "Content-Type": "application/json" }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    await r.text();
    return r.status;
  },
  async at(path) { return fake.at(path); },
  async reset() { fake.reset(); this.users = {}; },
};

// ---- ためし ----
// { as: "A", m: "PUT"|"PATCH"|"GET"|"DELETE", p: パス, b: からだ, q: クエリ, ok: とおるか, why: せつめい }・{ see: パス, is: のこる データ } は オーナーで よむ
// パスと からだの {A} {B} {C} は その 人の uid に かえる
const L = "v1/kuji/lawson/lots/l1";
const draw = (who, k, lot = "l1", store = "lawson", extra = {}) => ({ as: who, m: "PATCH", p: "v1", b: { [`kuji/${store}/lots/${lot}/n`]: k + 1, [`kuji/${store}/lots/${lot}/d/k${k}`]: { u: `{${who}}`, t: SV, ...extra }, [`kujime/{${who}}/${store}_${lot}`]: true }, ok: true, why: `${who} が ${store} ${lot} の ${k + 1}まいめを ひく` });
const pick = (who, k, p, o, lot = "l1") => ({ as: who, m: "PATCH", p: `v1/kuji/lawson/lots/${lot}`, b: { pc: o + 1, [`d/k${k}/p`]: p, [`d/k${k}/o`]: o }, ok: true, why: `${who} が ${k + 1}まいめの しゅるいを えらぶ（${o + 1}ばんめ）` });
const no = (s, why) => ({ ...s, ok: false, why });
const STEPS = [
  // まえからの きまり（なまえ・スコア・おへや・ぷりくら・ほうこく）
  { as: "A", m: "PUT", p: "v1/players/{A}", b: { n: "1-2", t: SV }, ok: true, why: "なまえ" },
  { as: "A", m: "PUT", p: "v1/players/{B}", b: { n: "1-2", t: SV }, ok: false, why: "ほかの 人の なまえ" },
  { as: "A", m: "PUT", p: "v1/players/{A}", b: { n: "1-2", t: SV, x: 1 }, ok: false, why: "ほかの こうもく" },
  { as: "A", m: "PUT", p: "v1/players/{A}", b: { n: "ab", t: SV }, ok: false, why: "なまえの かたち" },
  { as: "A", m: "PUT", p: "v1/players/{A}", b: { n: "1-2", t: 5 }, ok: false, why: "ふるい じこく" },
  { as: "B", m: "GET", p: "v1/players/{A}", ok: true, why: "なまえを よむ" },
  { as: "B", m: "GET", p: "v1/players", ok: false, why: "なまえを まとめて よむ" },
  { as: "A", m: "PUT", p: "v1/scores/crepe/{A}", b: { s: 120, n: "1-2", t: SV, l: 3, m: "normal" }, ok: true, why: "スコア" },
  { as: "A", m: "PUT", p: "v1/scores/Crepe/{A}", b: { s: 120, n: "1-2", t: SV }, ok: false, why: "へんな ボード" },
  { as: "A", m: "PUT", p: "v1/scores/crepe/{A}", b: { s: 10000001, n: "1-2", t: SV }, ok: false, why: "スコアが おおきすぎる" },
  { as: "A", m: "PUT", p: "v1/scores/crepe/{A}", b: { s: 1, n: "1-2", t: SV, m: "evil" }, ok: false, why: "へんな あそびかた" },
  { as: "B", m: "GET", p: "v1/scores/crepe", q: `orderBy=${encodeURIComponent('"s"')}&limitToLast=30`, ok: true, why: "ランキングを よむ" },
  { as: "A", m: "PATCH", p: "v1", b: { "rooms/{A}": { n: "1-2", t: SV, k: "main", w: "wall_a", f: "floor_a", z: "s", i: { 0: { a: "bed", x: 10, y: 20 } } }, "roomlist/{A}": { n: "1-2", t: SV, c: 1, k: "main" } }, ok: true, why: "おへやを みせる" },
  { as: "A", m: "PATCH", p: "v1", b: { "rooms/{A}": { n: "1-2", t: SV, k: "main", w: "wall_a", f: "floor_a", z: "s", i: { abc: { a: "bed", x: 10, y: 20 } } } }, ok: false, why: "かぐの ばんごうが へん" },
  { as: "A", m: "PUT", p: "v1/photos/{A}_p0001", b: { n: "1-2", t: SV, b: "yume", k: "yume", z: 0, r: "wanko,gachan,goji", c: "stand.happy,stand.happy,stand.happy", o: "soft:|soft:|soft:" }, ok: true, why: "ぷりくらを みせる" },
  { as: "A", m: "PUT", p: "v1/photos/{B}_p0001", b: { n: "1-2", t: SV, b: "yume", k: "yume", z: 0, r: "wanko,gachan,goji", c: "stand.happy,stand.happy,stand.happy", o: "soft:|soft:|soft:" }, ok: false, why: "ほかの 人の キーの ぷりくら" },
  { as: "B", m: "PATCH", p: "v1", b: { "reportlog/{A}_p0001/{B}": "bad", "reportcount/{A}_p0001": 1 }, ok: true, why: "ほうこく" },
  { as: "B", m: "PATCH", p: "v1", b: { "reportlog/{A}_p0001/{B}": "bad", "reportcount/{A}_p0001": 2 }, ok: false, why: "ほうこくは 1かい" },
  { as: "A", m: "PATCH", p: "v1", b: { "reportlog/{A}_p0001/{A}": "bad", "reportcount/{A}_p0001": 2 }, ok: false, why: "じぶんの ぷりくらは ほうこく できない" },
  { as: "A", m: "GET", p: "v1/reportlog/{A}_p0001", ok: false, why: "ほうこくの きろくは よめない" },
  // いちばんくじ（みんなの くじ・UI-100）
  { as: "A", m: "GET", p: "v1/kuji/lawson", ok: true, why: "くじを よむ" },
  { as: null, m: "GET", p: "v1/kuji/lawson", ok: false, why: "ログイン して いないと よめない" },
  { as: "A", m: "GET", p: "v1/kuji", ok: false, why: "くじを まとめて よむ" },
  draw("A", 0),
  { see: `${L}/n`, is: 1 },
  no(draw("B", 0), "おなじ くじ（1まいめ）を 2人で ひく"),
  draw("B", 1),
  no({ as: "A", m: "PATCH", p: "v1", b: { [`kuji/lawson/lots/l1/d/k2`]: { u: "{A}", t: SV } } }, "かずを ふやさずに ひく"),
  no({ as: "A", m: "PATCH", p: "v1", b: { [`kuji/lawson/lots/l1/n`]: 3 } }, "くじを かかずに かずだけ ふやす"),
  no({ as: "A", m: "PATCH", p: "v1", b: { [`kuji/lawson/lots/l1/n`]: 3, [`kuji/lawson/lots/l1/d/k2`]: { u: "{B}", t: SV } } }, "ほかの 人の なまえで ひく"),
  no({ as: "A", m: "PATCH", p: "v1", b: { [`kuji/lawson/lots/l1/n`]: 3, [`kuji/lawson/lots/l1/d/k5`]: { u: "{A}", t: SV } } }, "とばして ひく"),
  no({ as: "A", m: "PATCH", p: "v1", b: { [`kuji/lawson/lots/l1/n`]: 4, [`kuji/lawson/lots/l1/d/k3`]: { u: "{A}", t: SV } } }, "かずを 2 ふやす"),
  no({ as: "A", m: "PATCH", p: "v1", b: { [`kuji/lawson/lots/l1/n`]: 3, [`kuji/lawson/lots/l1/d/k2`]: { u: "{A}", t: 1000 } } }, "じこくを じぶんで きめる"),
  no(draw("A", 2, "l1", "lawson", { x: 1 }), "ほかの こうもく"),
  no(draw("A", 2, "l1", "lawson", { p: 0, o: 0 }), "ひく ときに しゅるいを きめる"),
  no(draw("A", 0, "l2"), "まだ ない ロットで ひく"),
  no(draw("A", 0, "l1", "family"), "ない おみせ"),
  no({ as: "A", m: "PATCH", p: "v1", b: { [`kuji/lawson/lots/l1/n`]: 3, [`kuji/lawson/lots/l1/d/k2`]: { u: "{A}", t: SV }, [`kujime/{B}/lawson_l1`]: true } }, "ほかの 人の きろくを かく"),
  { as: "A", m: "PATCH", p: "v1", b: { [`kuji/lawson/lots/l1/n`]: 3, [`kuji/lawson/lots/l1/d/k2`]: { u: "{A}", t: SV } }, ok: true, why: "じぶんの きろく なしでも ひける" },
  no({ as: "A", m: "PATCH", p: "v1/kuji/lawson", b: { cur: 2 } }, "うりきれる まえに つぎの ロット"),
  no({ as: "A", m: "PATCH", p: "v1/kuji/lawson", b: { cur: "2" } }, "ロットの ばんごうが もじ"),
  no({ as: "A", m: "DELETE", p: `${L}/d/k0` }, "ひいた くじを けす"),
  no({ as: "A", m: "PUT", p: `${L}/d/k0/t`, b: 5 }, "ひいた じこくを かえる"),
  no({ as: "A", m: "PUT", p: `${L}/n`, b: 0 }, "かずを もどす"),
  no({ as: "A", m: "DELETE", p: `${L}` }, "ロットを けす"),
  // えらぶ（D〜F。かずの ばんごうを 1 ずつ）
  pick("A", 0, 1, 0),
  { see: `${L}/d/k0/p`, is: 1 },
  no(pick("A", 0, 2, 1), "2かい えらぶ"),
  no(pick("B", 2, 0, 1), "ほかの 人の くじを えらぶ"),
  no(pick("B", 1, 0, 0), "まえの ばんごうで えらぶ（だれかが さきに えらんだ）"),
  no(pick("B", 1, 3, 1), "しゅるいの ばんごうが 3"),
  no({ as: "B", m: "PATCH", p: L, b: { pc: 2, "d/k1/o": 1 } }, "しゅるい なしで ばんごうだけ"),
  no({ as: "B", m: "PATCH", p: L, b: { "d/k1/p": 1 } }, "ばんごう なしで しゅるいだけ"),
  no({ as: "B", m: "PATCH", p: L, b: { pc: 3, "d/k1/p": 1, "d/k1/o": 2 } }, "ばんごうを とばす"),
  pick("B", 1, 0, 1),
  { as: "C", m: "PATCH", p: L, b: { pc: 3 }, ok: true, why: "ばんごうだけ すすめる（すきまが できる だけ）" },
  no({ as: "C", m: "PATCH", p: "v1/kuji/lawson/lots/l9", b: { pc: 1 } }, "ない ロットの ばんごう"),
  // なまえを けす（けす とき）
  no({ as: "B", m: "PUT", p: `${L}/d/k0/u`, b: "" }, "ほかの 人の くじの なまえを けす"),
  no({ as: "A", m: "PUT", p: `${L}/d/k0/u`, b: "{B}" }, "ほかの 人に かえる"),
  no({ as: "A", m: "DELETE", p: `${L}/d/k0/u` }, "なまえを なくす"),
  { as: "A", m: "PUT", p: `${L}/d/k0/u`, b: "", ok: true, why: "じぶんの くじの なまえを けす" },
  { see: `${L}/d/k0`, isKeys: ["o", "p", "t", "u"] },
  { ...pick("A", 2, 0, 3), why: "すきまの あとの ばんごう（3）で のこりの じぶんの くじを えらぶ" },
  // じぶんの きろく（kujime）
  { as: "A", m: "GET", p: "v1/kujime/{A}", ok: true, why: "じぶんの きろくを よむ" },
  no({ as: "B", m: "GET", p: "v1/kujime/{A}" }, "ほかの 人の きろくを よむ"),
  no({ as: "A", m: "PUT", p: "v1/kujime/{A}/lawson_x", b: true }, "きろくの キーが へん"),
  no({ as: "A", m: "PUT", p: "v1/kujime/{A}/lawson_l1", b: false }, "きろくの あたいが へん"),
  no({ as: "A", m: "PUT", p: "v1/kujime/{A}", b: "x" }, "きろくが もじだけ"),
  no({ as: "A", m: "PUT", p: "v1/kujime/{A}/lawson_l1/x", b: true }, "きろくの したに かく"),
  { as: "A", m: "PUT", p: "v1/kujime/{A}", b: { lawson_l1: true, sevenbun_l1: true }, ok: true, why: "じぶんの きろくを まとめて かく" },
  { as: "A", m: "DELETE", p: "v1/kujime/{A}", ok: true, why: "じぶんの きろくを けす" },
];
// うりきれ → つぎの ロット（80まい）
const FILL = [];
for (let k = 3; k < 80; k++) FILL.push(draw(k % 2 ? "B" : "C", k));
FILL.push(no(draw("A", 80), "81まいめ"));
FILL.push({ see: `${L}/n`, is: 80 });
FILL.push({ as: "C", m: "PATCH", p: "v1/kuji/lawson", b: { cur: 2 }, ok: true, why: "うりきれたら つぎの ロット 2" });
FILL.push(no({ as: "C", m: "PATCH", p: "v1/kuji/lawson", b: { cur: 3 } }, "ロット 2 が うりきれる まえに 3"));
FILL.push(no(draw("A", 80), "まえの ロットで ひく"));
FILL.push(draw("A", 0, "l2"));
FILL.push({ ...pick("C", 4, 2, 4), why: "うりきれた まえの ロットでも じぶんの くじを えらべる" });
FILL.push({ see: "v1/kuji/lawson/cur", is: 2 });
FILL.push(draw("A", 0, "l1", "sevenbun"));

let bad = 0, n = 0;
const fill = (v, users) => JSON.parse(JSON.stringify(v).replace(/\{([ABC])\}/g, (_, x) => users[x] ? users[x].uid : "?"));
for (const T of [emuTarget, fakeTarget]) {
  await T.reset();
  for (const name of ["A", "B", "C"]) await T.user(name);
}
for (const s of [...STEPS, ...FILL]) {
  const got = [];
  for (const T of [emuTarget, fakeTarget]) {
    if (s.see) {
      const v = await T.at(fill(s.see, T.users));
      got.push(s.isKeys ? JSON.stringify(Object.keys(v || {}).sort()) === JSON.stringify(s.isKeys) : JSON.stringify(v) === JSON.stringify(s.is));
      continue;
    }
    const status = await T.req(s.m, fill(s.p, T.users), s.b === undefined ? undefined : fill(s.b, T.users), s.as, s.q || "");
    got.push(s.ok ? status === 200 || status === 204 : status === 401 || status === 403);
  }
  n++;
  if (!got[0] || !got[1]) { bad++; console.log(`✗ ${s.why || "のこる データ " + s.see}: エミュレーター ${got[0] ? "○" : "×"}・にせの サーバー ${got[1] ? "○" : "×"}`); }
}
emu.kill(); await fake.close();
console.log(bad ? `✗ ${bad} / ${n} が ちがう` : `✓ きまり（database.rules.json）: ${n} この ためしが エミュレーター と にせの サーバーで おなじ`);
process.exit(bad ? 1 : 0);
