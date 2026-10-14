// ぽかぽかタウン × LINE（UI-126。オーナーの 指示 2026-10-14「③にしたいので許可する。」）。
// わんこ・がちゃん・ごじ から、つないだ LINE に おしらせが とどく。Google Apps Script（GAS）に この ファイルを まるごと はって つかう。
// てじゅんは game/line/README.md。
//
// ・ひみつの 値（チャネル アクセストークン）は ここに 書かない。GAS の「プロジェクトの 設定 → スクリプト プロパティ」の LINE_TOKEN に いれる。
// ・ゲームから とどく もの: op（すること）・code（6もじの ひもづけ ばんごう）・sec（あいことば）・s（3人の おなかと ごきげんの すうじ）だけ。
// ・ここに のこる もの（スクリプト プロパティ。オーナーの Google アカウントの 中）:
//     c:<ばんごう> → { h: あいことばの ハッシュ, u: LINE の userId（つないだ あと）, s: 3人の ようす, t: さいごに ゲームから とどいた じこく, a: つくった じこく,
//                      p: さいごに おしらせした 日, n: こんげつの おしらせの かず, m: その つき }
//     u:<userId> → ばんごう
//     month → { m: つき, n: こんげつ ぜんぶで おくった かず }
// ・むりょうの はんい: LINE の むりょうの プラン（つき 200通）を こえない ように、ぜんぶで つき MONTH_MAX 通・ひとり つき USER_MONTH_MAX 通・1にち 1通・
//   21じ〜9じ（にほんの じかん）は おくらない。へんじ（reply）は 200通に かぞえない。
// ・LINE の Webhook の しょめい（X-Line-Signature）は GAS では よめない（ヘッダーが とれない）。ばんごうを しらない 人は つなげない。
const LP = {
  CODE_RE: /^[A-HJ-NP-Z2-9]{6}$/,
  SEC_RE: /^[A-Za-z0-9]{24,64}$/,
  UID_RE: /^U[0-9a-f]{32}$/,
  IDS: ["w", "g", "j"],
  NAME: { w: "わんこ", g: "がちゃん", j: "ごじ" },
  MONTH_MAX: 190,
  USER_MONTH_MAX: 31,
  CODES_MAX: 300,
  QUIET_FROM: 21,
  QUIET_TO: 9,
  AWAY_H: 6,
  PENDING_H: 24,
  API: "https://api.line.me/v2/bot/message/",
  TZ: "Asia/Tokyo",
};

// ---- ことば（ひらがな・3人は じぶんを なまえで よぶ）----
const LINES = {
  follow: "ごじだよ。ともだちに なってくれて ありがとう！\nゲームの ≡ → せってい →「LINE と つなぐ」で でる 6もじの ばんごうを ここに おくってね。",
  linked: { w: "わんこだよ！ LINE と つながったよ。また あそびに きてね♪", g: "がちゃんだよ。つながったね！ がちゃん うれしいな。", j: "ごじだよ。つながったよ。ガゥ！" },
  unlinked: "ごじだよ。LINE との つながりを はずしたよ。また つなぎたく なったら ゲームから ばんごうを おくってね。",
  unknown: "ばんごうが みつからないよ。ゲームの「LINE と つなぐ」で でた 6もじを おくってね。",
  howto: "わんこだよ！ ゲームの ≡ → せってい →「LINE と つなぐ」で でる 6もじの ばんごうを おくってね。",
  test: { w: "わんこだよ！ テストの おしらせだよ。ちゃんと とどいた？", g: "がちゃんだよ。テストの おしらせ だよ。", j: "ごじだよ。テストの おしらせ。ガゥ。" },
  hungry: { w: "わんこだよ。おなか ぺこぺこ… ごはん たべに かえってきて〜", g: "がちゃんだよ。おなか すいちゃった… がちゃん まってるね。", j: "ごじだよ。おなか ぐぅ〜。ごじ、ごはん たべたいな。" },
  lonely: { w: "わんこだよ。きのうから あってないね。わんこ、ちょっと さみしいな。", g: "がちゃんだよ。しばらく あってないね… がちゃん まってるよ。", j: "ごじだよ。ごじ、ずっと まどの そとを みてるよ。はやく かえってきてね。" },
  hello: { w: "わんこだよ！ きょうは なに して あそぶ？ まってるね。", g: "がちゃんだよ。きょうも おつかれさま。あとで あそぼうね。", j: "ごじだよ。おうちで まってるよ。ガゥ！" },
  status: (who, h) => `${LP.NAME[who]}だよ。さいごに あそんだのは ${h < 1 ? "さっき" : `${Math.floor(h)}じかん まえ`}だよ。また あそぼうね。`,
  nostate: "わんこだよ！ まだ ゲームから ようすが とどいて ないよ。ゲームを ひらいてね。",
};

// ---- てつだい ----
const props_ = () => PropertiesService.getScriptProperties();
const get_ = (k) => { const v = props_().getProperty(k); try { return v ? JSON.parse(v) : null; } catch (e) { return null; } };
const put_ = (k, v) => props_().setProperty(k, JSON.stringify(v));
const del_ = (k) => props_().deleteProperty(k);
const hash_ = (s) => Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(s), Utilities.Charset.UTF_8));
const day_ = (t) => Utilities.formatDate(new Date(t), LP.TZ, "yyyy-MM-dd");
const month_ = (t) => Utilities.formatDate(new Date(t), LP.TZ, "yyyy-MM");
const hour_ = (t) => Number(Utilities.formatDate(new Date(t), LP.TZ, "H"));
const json_ = (o) => ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
const now_ = () => Date.now();
const pick_ = (o, k) => o[k];

function line_(path, body) {
  const token = props_().getProperty("LINE_TOKEN");
  if (!token) return 0;
  const res = UrlFetchApp.fetch(LP.API + path, { method: "post", contentType: "application/json", muteHttpExceptions: true, headers: { Authorization: "Bearer " + token }, payload: JSON.stringify(body) });
  return res.getResponseCode();
}
const reply_ = (token, text) => line_("reply", { replyToken: token, messages: [{ type: "text", text }] });
const push_ = (to, text) => line_("push", { to, messages: [{ type: "text", text }] });

// ゲームの ようす（3人の [おなか, ごきげん] 0〜100 の せいすう）だけ うけとる
function cleanState_(s) {
  if (!s || typeof s !== "object") return null;
  const out = {};
  for (const id of LP.IDS) {
    const v = s[id];
    if (!Array.isArray(v) || v.length !== 2 || !v.every((x) => Number.isInteger(x) && x >= 0 && x <= 100)) return null;
    out[id] = [v[0], v[1]];
  }
  return out;
}
// いまの おなかの みこみ（ゲームの るすの へりかた: 1ぷん 0.22・15 まで・12じかん まで。js/save.js の applyElapsed と おなじ）
function hungerNow_(h, min) { const m = Math.min(Math.max(0, min), 720); return Math.max(Math.min(h, 15), h - 0.22 * m); }

// ---- ゲームから（POST・text/plain の JSON）----
function fromGame_(b) {
  const code = String(b.code || ""), sec = String(b.sec || "");
  if (!LP.CODE_RE.test(code) || !LP.SEC_RE.test(sec)) return { ok: false, err: "bad" };
  const key = "c:" + code, c = get_(key), h = hash_(sec), now = now_();
  if (b.op === "hello") {
    if (c && c.h !== h) return { ok: false, err: "used" };
    if (!c) {
      if (props_().getKeys().filter((k) => k.indexOf("c:") === 0).length >= LP.CODES_MAX) return { ok: false, err: "full" };
      put_(key, { h, u: "", s: null, t: 0, a: now, p: "", n: 0, m: "" });
    }
    return { ok: true, linked: !!(c && c.u) };
  }
  if (!c || c.h !== h) return { ok: false, err: "nocode" };
  if (b.op === "check") return { ok: true, linked: !!c.u };
  if (b.op === "state") {
    const s = cleanState_(b.s);
    if (!s) return { ok: false, err: "bad" };
    c.s = s; c.t = now; put_(key, c);
    return { ok: true, linked: !!c.u };
  }
  if (b.op === "test") {
    if (!c.u) return { ok: true, linked: false, sent: false };
    const ok = canPush_(c, now, true) && push_(c.u, pick_(LINES.test, LP.IDS[Math.floor(now / 1000) % 3])) === 200;
    if (ok) counted_(key, c, now);
    return { ok: true, linked: true, sent: ok };
  }
  if (b.op === "bye") {
    if (c.u) del_("u:" + c.u);
    del_(key);
    return { ok: true, linked: false };
  }
  return { ok: false, err: "op" };
}

// ---- LINE から（Webhook）----
function fromLine_(events) {
  for (const ev of events) {
    const uid = ev.source && ev.source.userId;
    if (!uid || !LP.UID_RE.test(uid)) continue;
    if (ev.type === "follow") { if (ev.replyToken) reply_(ev.replyToken, LINES.follow); continue; }
    if (ev.type === "unfollow") { unlink_(uid); continue; }
    if (ev.type !== "message" || !ev.message || ev.message.type !== "text" || !ev.replyToken) continue;
    const text = String(ev.message.text || "").replace(/[\s　]/g, "").toUpperCase();
    if (/^(やめる|はなす|かいじょ|STOP)$/.test(text)) { unlink_(uid); reply_(ev.replyToken, LINES.unlinked); continue; }
    if (LP.CODE_RE.test(text)) {
      const key = "c:" + text, c = get_(key);
      if (!c) { reply_(ev.replyToken, LINES.unknown); continue; }
      const old = get_("u:" + uid);
      if (old && old !== text) { const oc = get_("c:" + old); if (oc) { oc.u = ""; put_("c:" + old, oc); } }
      if (c.u && c.u !== uid) del_("u:" + c.u);
      c.u = uid; put_(key, c); put_("u:" + uid, text);
      reply_(ev.replyToken, pick_(LINES.linked, LP.IDS[text.charCodeAt(0) % 3]));
      continue;
    }
    // つないだ 人には ようすを へんじ（へんじは むりょうの 通数に かぞえない）
    const code = get_("u:" + uid), c = code && get_("c:" + code);
    if (!c) { reply_(ev.replyToken, LINES.howto); continue; }
    if (!c.s || !c.t) { reply_(ev.replyToken, LINES.nostate); continue; }
    const who = LP.IDS[Math.floor(now_() / 3600000) % 3];
    reply_(ev.replyToken, LINES.status(who, (now_() - c.t) / 3600000));
  }
}
function unlink_(uid) {
  const code = get_("u:" + uid);
  if (code) { const c = get_("c:" + code); if (c) { c.u = ""; put_("c:" + code, c); } }
  del_("u:" + uid);
}

// ---- 1じかん ごとの おしらせ（setup() が トリガーを つくる）----
function canPush_(c, now, test) {
  const g = get_("month") || { m: "", n: 0 }, m = month_(now);
  if (g.m === m && g.n >= LP.MONTH_MAX) return false;
  if (c.m === m && c.n >= LP.USER_MONTH_MAX) return false;
  if (test) return true;
  const hr = hour_(now);
  if (hr >= LP.QUIET_FROM || hr < LP.QUIET_TO) return false;
  return c.p !== day_(now);
}
function counted_(key, c, now) {
  const m = month_(now), g = get_("month") || { m: "", n: 0 };
  put_("month", { m, n: g.m === m ? g.n + 1 : 1 });
  c.n = c.m === m ? c.n + 1 : 1; c.m = m; c.p = day_(now); put_(key, c);
}
// どの 子が なにを いうか（おなかが すいた子・ながく あって いない・ふつう）
function message_(c, now) {
  const min = (now - c.t) / 60000;
  let low = null, lowH = 101;
  for (const id of LP.IDS) { const h = hungerNow_(c.s[id][0], min); if (h < lowH) { lowH = h; low = id; } }
  const who = LP.IDS[Math.floor(now / 86400000) % 3];
  if (min >= 24 * 60) return pick_(LINES.lonely, who);
  if (lowH <= 30) return pick_(LINES.hungry, low);
  return pick_(LINES.hello, who);
}
function tick() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return;
  try {
    const now = now_(), all = props_().getProperties();
    for (const k of Object.keys(all)) {
      if (k.indexOf("c:") !== 0) continue;
      let c; try { c = JSON.parse(all[k]); } catch (e) { continue; }
      // つながらないまま 1にち たった ばんごうは けす
      if (!c.u) { if (now - (c.a || 0) > LP.PENDING_H * 3600000) del_(k); continue; }
      if (!c.s || !c.t || now - c.t < LP.AWAY_H * 3600000 || !canPush_(c, now, false)) continue;
      const code = push_(c.u, message_(c, now));
      if (code === 200) counted_(k, c, now);
      else if (code === 429) break; // つきの じょうげん など → こんかいは おしまい
    }
  } finally { lock.releaseLock(); }
}

// ---- いりぐち ----
function doPost(e) {
  let b = null;
  try { b = JSON.parse((e && e.postData && e.postData.contents) || "null"); } catch (err) { b = null; }
  if (!b || typeof b !== "object") return json_({ ok: false, err: "bad" });
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return json_({ ok: false, err: "busy" });
  try {
    if (Array.isArray(b.events)) { fromLine_(b.events); return json_({ ok: true }); }
    return json_(fromGame_(b));
  } finally { lock.releaseLock(); }
}
function doGet() { return json_({ ok: true, app: "pokapoka-line", ver: 1 }); }
// さいしょに 1かいだけ うごかす: 1じかん ごとの トリガーを つくる（まえの ものは けす）
function setup() {
  for (const t of ScriptApp.getProjectTriggers()) if (t.getHandlerFunction() === "tick") ScriptApp.deleteTrigger(t);
  ScriptApp.newTrigger("tick").timeBased().everyHours(1).create();
  return "ok";
}
