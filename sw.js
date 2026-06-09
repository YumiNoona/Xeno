var CACHE = 'xeno-v4';
var PRECACHE = [
  '/', '/editor.html', '/preview.html', '/index.html',
  '/css/tokens.css',
  '/css/editor/base.css', '/css/editor/buttons.css', '/css/editor/topbar.css',
  '/css/editor/sidebar.css', '/css/editor/viewport.css',
  '/css/editor/panels-controls.css', '/css/editor/panels-base.css',
  '/css/editor/panels-settings.css', '/css/editor/panels-theme.css',
  '/css/editor/panels-hotspot.css', '/css/editor/panels-colorpicker.css',
  '/css/editor/menus.css', '/css/editor/modals.css', '/css/editor/media-grid.css', '/css/editor/media-modal.css',
  '/css/editor/dashboard.css', '/css/editor/theme.css',
  '/css/viewer/layout.css',
  '/css/viewer/components-controls.css', '/css/viewer/components-themes.css', '/css/viewer/components-overlays.css',
  '/css/hotspots/types-standard.css', '/css/hotspots/types-content.css',
  '/css/hotspots/animations.css', '/css/hotspots/dots.css',
  '/css/lib/hint.css', '/css/lib/minimap.css',
  '/css/landing-base.css', '/css/landing-core.css', '/css/landing-donate.css',
  '/js/engine/xeno.js', '/js/engine/transitions.js', '/js/engine/VideoAsset.js',
  '/js/engine/DeviceOrientation.js', '/js/engine/colorEffects.js', '/js/engine/homography.js',
  '/js/hotspots/HotspotFactory.js', '/js/hotspots/Builders-Nav.js',
  '/js/hotspots/Builders-Content.js', '/js/hotspots/Builders-Content-adv.js',
  '/js/ui/Minimap.js', '/js/ui/Supabase.js', '/js/ui/SceneList.js',
  '/js/lib/screenfull.js', '/js/lib/webvr-polyfill.js',
  '/js/vr/XenoVR.js', '/js/viewer.js', '/js/landing.js',
  '/js/editor/modals.js', '/js/editor/editor.js', '/js/editor/state.js', '/js/editor/tools.js',
  '/js/editor/hotspot-manager.js', '/js/editor/hotspot-props-panel.js', '/js/editor/hotspot-props-types.js',
  '/js/editor/color-picker.js', '/js/editor/project-settings.js',
  '/js/editor/scene-manager.js', '/js/editor/scene-settings.js', '/js/editor/media-manager.js',
  '/js/editor/dashboard.js', '/js/editor/export.js', '/js/editor/ui.js',
  '/js/editor/partials/dashboard.js', '/js/editor/partials/workspace-topbar.js',
  '/js/editor/partials/viewport.js', '/js/editor/partials/properties-panel.js',
  '/js/editor/partials/context-menus.js', '/js/editor/partials/media-modal.js',
  '/manifest.json',
  '/public/logo.ico', '/public/logo-16x16.png', '/public/logo-32x32.png'
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
      keys.filter(function(k) { return k !== CACHE; })
        .map(function(k) { return caches.delete(k); })
    );
  });
});

// Fetch: network-first, fallback to cache
self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  var url = e.request.url;
  if (url.indexOf('http:') !== 0 && url.indexOf('https:') !== 0) return;
  // Never cache API responses — always go to network
  if (url.indexOf('/api/') !== -1) return;
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
