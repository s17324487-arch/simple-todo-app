// オフラインでも遊べるように、ゲームのファイルをキャッシュする
// キャッシュ名は js/version.js の GAME_VERSION と連動（バージョンを上げると古いキャッシュが消える）
importScripts("js/version.js");
const CACHE = "pokapoka-" + GAME_VERSION;
const FILES = [
  "./js/item-dex-sources.js", "./js/item-dex.js",
  "./", "./index.html", "./manifest.webmanifest", "./css/style.css",
  "./icons/icon-192.png", "./icons/icon-512.png",
  "./js/version.js", "./js/chara-data.js", "./js/util.js", "./js/data.js", "./js/chara.js", "./js/art.js", "./js/npc-art.js", "./js/tiles.js", "./js/water-art.js", "./js/maps.js",
  "./js/save.js", "./js/sound.js", "./js/ui.js", "./js/main.js", "./js/talk.js", "./js/save-backup.js", "./js/menu.js", "./js/shop.js",
  "./js/dressup.js", "./js/scene-title.js", "./js/museum-data.js", "./js/museum-art.js", "./js/museum.js", "./js/range-data.js", "./js/gun-art.js", "./js/range.js", "./js/scene-world.js", "./js/npc-life.js", "./js/scene-house.js", "./js/scene-battle.js", "./js/minigames.js", "./js/mg-crepe.js", "./js/mg-dentist.js", "./js/mg-bakery.js", "./js/mg-florist.js", "./js/mg-cake.js", "./js/mg-groom.js", "./js/mg-burger.js", "./js/shop-decor.js", "./js/daily-play.js", "./js/townsfolk-data.js", "./js/townsfolk-art.js", "./js/townsfolk.js", "./js/npc-cast.js", "./js/fishing-data.js", "./js/fish-art.js", "./js/fishing.js", "./js/fossil-data.js", "./js/fossil-art.js", "./js/fossils.js", "./js/scene-range.js", "./js/shop-rewards.js", "./js/slow-life-prices.js", "./js/town-dialogue-data.js", "./js/town-dialogue.js", "./js/quiz-prizes.js", "./js/town-quiz-data.js", "./js/town-quiz.js", "./js/ikebukuro-catalog.js", "./js/ikebukuro-district.js", "./js/mama-schedule.js", "./js/crane-physics.js", "./js/crane-art.js", "./js/crane-machines.js", "./js/crane-scene.js", "./js/debug.js",
  "./js/home-bubbles.js", "./js/home-talk-data.js", "./js/home-life.js", "./js/home-actions.js", "./js/parent-care.js",
  "./js/parent-work.js",
  "./js/home-catalog.js",
  "./js/home-design.js", "./js/furniture-models.js", "./js/furniture-live.js",
  "./js/road-patterns.js", "./js/town-roads.js",
  "./js/heiwadai-art.js", "./js/heiwadai-assets-s.js", "./js/heiwadai-assets-ab.js",
  "./js/world-art.js", "./js/world-expansion.js",
  "./js/economy.js", "./js/arcade.js",
  "./js/puzzle-engine.js", "./js/puzzle-prizes.js", "./js/scene-puzzle.js",
  "./js/store-interiors.js", "./js/scene-store.js",
  "./js/world-scenery.js", "./js/town-design.js", "./js/town-renewal-art.js", "./js/town-renewal.js", "./js/heiwadai-layout-data.js", "./js/heiwadai-ground.js", "./js/heiwadai-town.js", "./js/heiwadai-life.js", "./js/transit.js",
  "./js/seasonal-catalog.js", "./js/seasonal.js",
  "./js/annual-festivals.js", "./js/food-art.js",
  "./js/weather.js", "./js/battle-elements.js",
  "./js/modern-music.js", "./js/music-arrangements.js", "./js/music-discs.js", "./js/smaho.js",
  "./js/fishing-line.js",
  "./js/atlas-art.js", "./js/world-atlas.js", "./js/district-travel.js", "./js/mac-kitchen.js", "./js/venue-hall-art.js", "./js/venue-hall.js", "./js/nerikasu-neighborhood.js", "./js/nerikasu-town-art.js", "./js/nerikasu-town.js",
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
