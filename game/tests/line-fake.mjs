// LINE れんけい（UI-126）の テスト用: game/line/Code.gs を そのまま Node の vm で うごかす にせの GAS（スクリプト プロパティ・UrlFetchApp・時計）。
// - post(body) … ゲームからの POST（JSON の もじれつ か オブジェクト）→ こたえの オブジェクト
// - line(events) … LINE の Webhook（userId つきの イベント）
// - tick() … 1じかん ごとの おしらせ・now … いまの じこく（ミリ秒。かえられる）
// - sent … LINE へ おくった もの [{ path, body }]・props … のこって いる もの・status … LINE の こたえ（200 / 429 など）
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { createHash } from "node:crypto";

export function lineFake({ token = "TEST_TOKEN", now = Date.UTC(2026, 9, 14, 3, 0, 0) } = {}) {
  const store = new Map(token ? [["LINE_TOKEN", token]] : []);
  const F = { now, sent: [], status: 200, triggers: [] };
  const props = {
    getProperty: (k) => (store.has(k) ? store.get(k) : null),
    setProperty: (k, v) => { store.set(k, String(v)); },
    deleteProperty: (k) => { store.delete(k); },
    getKeys: () => [...store.keys()],
    getProperties: () => Object.fromEntries(store),
  };
  const fmt = (d, tz, f) => {
    // Asia/Tokyo だけ（UTC+9）
    const t = new Date(d.getTime() + 9 * 3600000), p = (n) => String(n).padStart(2, "0");
    return f.replace("yyyy", t.getUTCFullYear()).replace("MM", p(t.getUTCMonth() + 1)).replace("dd", p(t.getUTCDate())).replace(/^H$/, String(t.getUTCHours()));
  };
  const ctx = {
    PropertiesService: { getScriptProperties: () => props },
    LockService: { getScriptLock: () => ({ tryLock: () => true, waitLock: () => {}, releaseLock: () => {} }) },
    Utilities: {
      DigestAlgorithm: { SHA_256: "sha256" }, Charset: { UTF_8: "utf8" },
      computeDigest: (alg, s) => [...createHash("sha256").update(String(s), "utf8").digest()],
      base64Encode: (b) => Buffer.from(b.map((x) => x & 255)).toString("base64"),
      formatDate: fmt,
    },
    ContentService: { MimeType: { JSON: "json" }, createTextOutput: (s) => ({ text: s, setMimeType() { return this; } }) },
    UrlFetchApp: { fetch: (url, opt) => { F.sent.push({ path: url.replace("https://api.line.me/v2/bot/message/", ""), auth: opt.headers.Authorization, body: JSON.parse(opt.payload) }); return { getResponseCode: () => F.status }; } },
    ScriptApp: {
      getProjectTriggers: () => F.triggers.map((h) => ({ getHandlerFunction: () => h })),
      deleteTrigger: (t) => { F.triggers.splice(F.triggers.indexOf(t.getHandlerFunction()), 1); },
      newTrigger: (h) => ({ timeBased: () => ({ everyHours: () => ({ create: () => { F.triggers.push(h); } }) }) }),
    },
    Date: class extends Date { constructor(...a) { super(...(a.length ? a : [F.now])); } static now() { return F.now; } },
    JSON, Math, Number, String, Array, Object, RegExp,
  };
  vm.createContext(ctx);
  vm.runInContext(readFileSync(new URL("../line/Code.gs", import.meta.url), "utf8") + "\n;globalThis.__api = { doPost, doGet, tick, setup, LP, LINES };", ctx);
  const api = ctx.__api;
  const out = (r) => JSON.parse(r.text);
  return Object.assign(F, {
    api, store,
    post(body) { return out(api.doPost({ postData: { contents: typeof body === "string" ? body : JSON.stringify(body) } })); },
    line(events) { return out(api.doPost({ postData: { contents: JSON.stringify({ destination: "Uxxx", events }) } })); },
    text(userId, text, replyToken = "r" + Math.random().toString(36).slice(2)) { return this.line([{ type: "message", replyToken, source: { type: "user", userId }, message: { type: "text", text } }]); },
    tick() { api.tick(); },
    props() { return Object.fromEntries(store); },
    code(code) { const v = store.get("c:" + code); return v ? JSON.parse(v) : null; },
    last() { return F.sent[F.sent.length - 1] || null; },
  });
}
