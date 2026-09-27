// オフラインでも遊べるように、ゲームのファイルをキャッシュする
// キャッシュ名は js/version.js の GAME_VERSION と連動（バージョンを上げると古いキャッシュが消える）
importScripts("js/version.js");
const CACHE = "pokapoka-" + GAME_VERSION;
const FILES = [
  "./", "./index.html", "./manifest.webmanifest", "./css/style.css",
  "./icons/icon-192.png", "./icons/icon-512.png",
  "./js/version.js", "./js/chara-data.js", "./js/util.js", "./js/data.js", "./js/chara.js", "./js/art.js", "./js/tiles.js", "./js/maps.js",
  "./js/save.js", "./js/sound.js", "./js/ui.js", "./js/main.js", "./js/talk.js", "./js/menu.js", "./js/shop.js",
  "./js/dressup.js", "./js/scene-title.js", "./js/scene-world.js", "./js/scene-house.js", "./js/scene-battle.js", "./js/minigames.js", "./js/debug.js",
  "./js/home-life.js",
  "./js/home-catalog.js",
  "./js/world-art.js", "./js/world-expansion.js",
];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// ゲーム本体はネット優先（更新をすぐ反映）、つながらないときはキャッシュ。フォントはキャッシュ優先。
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    e.respondWith(fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; }).catch(() => caches.match(req).then((r) => r || caches.match("./index.html"))));
  } else if (url.hostname.endsWith("fonts.googleapis.com") || url.hostname.endsWith("fonts.gstatic.com")) {
    e.respondWith(caches.match(req).then((r) => r || fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; })));
  }
});
