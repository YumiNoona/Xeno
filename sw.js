var CACHE = 'xeno-v1';
var BLOB_CACHE = 'xeno-blobs';
var PRECACHE = [
  '/', '/editor.html', '/preview.html', '/index.html', '/data.js',
  '/css/tokens.css',
  '/css/editor/base.css', '/css/editor/buttons.css', '/css/editor/topbar.css',
  '/css/editor/sidebar.css', '/css/editor/viewport.css', '/css/editor/panels.css',
  '/css/editor/menus.css', '/css/editor/media.css', '/css/editor/dashboard.css',
  '/css/editor/theme.css',
  '/css/viewer/layout.css', '/css/viewer/components.css',
  '/css/hotspots/types.css', '/css/hotspots/animations.css', '/css/hotspots/dots.css',
  '/css/lib/hint.css', '/css/lib/minimap.css',
  '/js/engine/xeno.js', '/js/engine/transitions.js', '/js/engine/VideoAsset.js',
  '/js/engine/DeviceOrientation.js', '/js/engine/colorEffects.js', '/js/engine/homography.js',
  '/js/hotspots/HotspotFactory.js', '/js/hotspots/Builders-Nav.js', '/js/hotspots/Builders-Content.js',
  '/js/ui/Minimap.js', '/js/ui/Supabase.js', '/js/ui/SceneList.js',
  '/js/lib/screenfull.js', '/js/lib/webvr-polyfill.js',
  '/js/vr/XenoVR.js', '/js/viewer.js',
  '/js/editor/editor.js', '/js/editor/state.js', '/js/editor/tools.js',
  '/js/editor/hotspot-manager.js', '/js/editor/hotspot-props-panel.js', '/js/editor/hotspot-props-types.js',
  '/js/editor/scene-manager.js', '/js/editor/scene-settings.js', '/js/editor/media-manager.js',
  '/js/editor/dashboard.js', '/js/editor/export.js', '/js/editor/ui.js',
  '/js/editor/partials/dashboard.js', '/js/editor/partials/workspace-topbar.js',
  '/js/editor/partials/viewport.js', '/js/editor/partials/properties-panel.js',
  '/js/editor/partials/context-menus.js', '/js/editor/partials/media-modal.js',
  '/manifest.json',
  '/public/logo.ico', '/public/logo 16x16.png', '/public/logo 32x32.png'
];

// Install: activate immediately without waiting for precache
self.addEventListener('install', function(e) {
  self.skipWaiting();
  e.waitUntil(Promise.resolve());
});

// Activate: claim clients immediately, then precache + cleanup in background
self.addEventListener('activate', function(e) {
  e.waitUntil(self.clients.claim());
  // Background precache — doesn't block activation
  caches.open(CACHE).then(function(cache) {
    cache.addAll(PRECACHE).catch(function() {});
  });
  // Cleanup old caches
  caches.keys().then(function(keys) {
    return Promise.all(
      keys.filter(function(k) { return k !== CACHE && k !== BLOB_CACHE; })
        .map(function(k) { return caches.delete(k); })
    );
  });
});

// Fetch: intercept xeno-media blobs, then network-first for everything else
self.addEventListener('fetch', function(e) {
  if (e.request.url.indexOf('/xeno-media/') !== -1) {
    e.respondWith(
      caches.open(BLOB_CACHE).then(function(cache) {
        return cache.match(e.request).then(function(cached) {
          return cached || fetch(e.request).catch(function() {
            return new Response('', { status: 404, statusText: 'Not Found' });
          });
        });
      })
    );
    return;
  }
  if (e.request.method !== 'GET') return;
  var url = e.request.url;
  if (url.indexOf('http:') !== 0 && url.indexOf('https:') !== 0) return;
  e.respondWith(
    fetch(e.request).then(function(res) {
      if (res && res.status === 200) {
        var copy = res.clone();
        caches.open(CACHE).then(function(cache) { cache.put(e.request, copy); });
      }
      return res;
    }).catch(function() {
      return caches.match(e.request);
    })
  );
});
