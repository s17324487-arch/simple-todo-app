// オフラインでも遊べるように、ゲームのファイルをキャッシュする
// キャッシュ名は js/version.js の GAME_VERSION と連動（バージョンを上げると古いキャッシュが消える）
importScripts("js/version.js");
const CACHE = "pokapoka-" + GAME_VERSION;
const FILES = [
  "./", "./index.html", "./manifest.webmanifest", "./css/style.css",
  "./icons/icon-192.png", "./icons/icon-512.png",
  "./js/version.js", "./js/chara-data.js", "./js/util.js", "./js/data.js", "./js/chara.js", "./js/art.js", "./js/tiles.js", "./js/maps.js",
  "./js/save.js", "./js/sound.js", "./js/ui.js", "./js/main.js", "./js/talk.js", "./js/save-backup.js", "./js/menu.js", "./js/shop.js",
  "./js/dressup.js", "./js/scene-title.js", "./js/museum-data.js", "./js/museum-art.js", "./js/museum.js", "./js/scene-world.js", "./js/scene-house.js", "./js/scene-battle.js", "./js/minigames.js", "./js/mg-crepe.js", "./js/mg-dentist.js", "./js/mg-bakery.js", "./js/mg-florist.js", "./js/mg-cake.js", "./js/mg-groom.js", "./js/mg-burger.js", "./js/shop-decor.js", "./js/daily-play.js", "./js/townsfolk-data.js", "./js/townsfolk-art.js", "./js/townsfolk.js", "./js/fishing-data.js", "./js/fish-art.js", "./js/fishing.js", "./js/fossil-data.js", "./js/fossil-art.js", "./js/fossils.js", "./js/debug.js",
  "./js/home-bubbles.js", "./js/home-talk-data.js", "./js/home-life.js", "./js/parent-care.js",
  "./js/home-catalog.js",
  "./js/home-design.js",
  "./js/road-patterns.js", "./js/town-roads.js",
  "./js/heiwadai-art.js", "./js/heiwadai-assets-s.js", "./js/heiwadai-assets-ab.js",
  "./js/world-art.js", "./js/world-expansion.js",
  "./js/economy.js", "./js/arcade.js",
  "./js/puzzle-engine.js", "./js/puzzle-prizes.js", "./js/scene-puzzle.js",
  "./js/store-interiors.js", "./js/scene-store.js",
  "./js/world-scenery.js", "./js/town-design.js", "./js/town-renewal-art.js", "./js/town-renewal.js", "./js/heiwadai-layout-data.js", "./js/heiwadai-ground.js", "./js/heiwadai-town.js", "./js/heiwadai-life.js", "./js/transit.js",
  "./js/seasonal-catalog.js", "./js/seasonal.js",
  "./js/annual-festivals.js",
  "./js/weather.js", "./js/battle-elements.js",
  "./js/modern-music.js", "./js/music-arrangements.js",
  "./js/atlas-art.js", "./js/world-atlas.js",
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
