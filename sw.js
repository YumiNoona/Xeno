var CACHE = 'xeno-v1';
var PRECACHE = [
  '/',
  '/editor.html',
  '/preview.html',
  '/index.html',
  '/config.js',
  '/data.js',
  '/css/tokens.css',
  '/css/editor/base.css',
  '/css/editor/buttons.css',
  '/css/editor/topbar.css',
  '/css/editor/sidebar.css',
  '/css/editor/viewport.css',
  '/css/editor/panels.css',
  '/css/editor/menus.css',
  '/css/editor/media.css',
  '/css/editor/dashboard.css',
  '/css/editor/theme.css',
  '/css/viewer/layout.css',
  '/css/viewer/components.css',
  '/css/hotspots/types.css',
  '/css/hotspots/animations.css',
  '/css/hotspots/dots.css',
  '/css/lib/hint.css',
  '/css/lib/minimap.css',
  '/js/engine/xeno.js',
  '/js/engine/transitions.js',
  '/js/engine/VideoAsset.js',
  '/js/engine/DeviceOrientation.js',
  '/js/engine/colorEffects.js',
  '/js/engine/homography.js',
  '/js/hotspots/HotspotFactory.js',
  '/js/hotspots/Builders-Nav.js',
  '/js/hotspots/Builders-Content.js',
  '/js/ui/Minimap.js',
  '/js/ui/Supabase.js',
  '/js/ui/SceneList.js',
  '/js/lib/screenfull.js',
  '/js/lib/webvr-polyfill.js',
  '/js/vr/XenoVR.js',
  '/js/viewer.js',
  '/js/editor/editor.js',
  '/js/editor/state.js',
  '/js/editor/tools.js',
  '/js/editor/hotspot-manager.js',
  '/js/editor/hotspot-props-panel.js',
  '/js/editor/hotspot-props-types.js',
  '/js/editor/scene-manager.js',
  '/js/editor/scene-settings.js',
  '/js/editor/media-manager.js',
  '/js/editor/dashboard.js',
  '/js/editor/export.js',
  '/js/editor/ui.js',
  '/js/editor/partials/dashboard.js',
  '/js/editor/partials/workspace-topbar.js',
  '/js/editor/partials/viewport.js',
  '/js/editor/partials/properties-panel.js',
  '/js/editor/partials/context-menus.js',
  '/js/editor/partials/media-modal.js',
  '/img/logo.ico',
  '/img/link.png',
  '/img/photo.png',
  '/img/info.png',
  '/img/hotspot.png',
  '/img/tooltip.svg',
  '/manifest.json'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(PRECACHE);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; }).map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request).then(function(res) {
        if (res && res.status === 200) {
          var copy = res.clone();
          caches.open(CACHE).then(function(cache) { cache.put(e.request, copy); });
        }
        return res;
      }).catch(function() { return cached; });
    })
  );
});
