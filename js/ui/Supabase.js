/*
 * Xeno — Local Storage Engine
 * Tour data → localStorage. Media blobs → Cache API.
 * Media URLs use /xeno-media/<id> paths — the service worker intercepts
 * these and serves cached blobs with proper Content-Type. No blob: URLs
 * involved, so no WebGL crossOrigin security errors.
 *
 * Fallback: if the SW isn't active yet (first-visit race), media grid
 * thumbnails fall back to a session-only blob URL. Scene creation waits
 * up to 3 s for the SW, then tries the /xeno-media/ path regardless.
 *
 * Keeps window.XenoSupabase namespace for backward compatibility.
 */
(function () {
  'use strict';

  var LOCAL_STORAGE_PREFIX = 'xeno_tour_';
  var CACHE_NAME = 'xeno-blobs';

  // ─── SW readiness ───────────────────────────────────

  function swReady() {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator))
      return Promise.resolve();
    if (navigator.serviceWorker.controller)
      return Promise.resolve();
    // Wait for SW to take control (with timeout)
    return new Promise(function(resolve) {
      var done = false;
      function finish() { if (!done) { done = true; resolve(); } }
      navigator.serviceWorker.addEventListener('controllerchange', finish);
      setTimeout(finish, 3000);
    });
  }

  // ─── Cache API helpers ───────────────────────────────

  function cacheAvailable() { return typeof caches !== 'undefined'; }

  function cacheStore(key, blob) {
    if (!cacheAvailable()) return Promise.resolve();
    return caches.open(CACHE_NAME).then(function(cache) {
      return cache.put('/xeno-media/' + key, new Response(blob, {
        headers: { 'Content-Type': blob.type || 'application/octet-stream' }
      }));
    }).catch(function(err) { console.warn('[Xeno] Cache store failed', err); });
  }

  function cacheGet(key) {
    if (!cacheAvailable()) return Promise.resolve(null);
    return caches.open(CACHE_NAME).then(function(cache) {
      return cache.match('/xeno-media/' + key).then(function(r) { return r ? r.blob() : null; });
    }).catch(function() { return null; });
  }

  function cacheDelete(key) {
    if (!cacheAvailable()) return Promise.resolve();
    return caches.open(CACHE_NAME).then(function(c) { return c.delete('/xeno-media/' + key); });
  }

  // Create a session-only blob URL from cache (fallback when SW isn't active)
  var _sessionUrls = {};

  function sessionUrl(key) {
    if (_sessionUrls[key]) return Promise.resolve(_sessionUrls[key]);
    return cacheGet(key).then(function(blob) {
      if (!blob) return null;
      _sessionUrls[key] = URL.createObjectURL(blob);
      return _sessionUrls[key];
    });
  }

  // ─── LocalStorage helpers ─────────────────────────────

  function getLocalAlbums() {
    try { var d = localStorage.getItem('xeno_albums'); return d ? JSON.parse(d) : []; }
    catch (e) { return []; }
  }
  function saveLocalAlbums(a) {
    try { localStorage.setItem('xeno_albums', JSON.stringify(a)); } catch (e) { console.error(e); }
  }
  function getLocalMedia() {
    try { var d = localStorage.getItem('xeno_media'); return d ? JSON.parse(d) : []; }
    catch (e) { return []; }
  }
  function saveLocalMedia(m) {
    try { localStorage.setItem('xeno_media', JSON.stringify(m)); } catch (e) { console.error(e); }
  }

  // ─── Album / Media CRUD ───────────────────────────────

  function renameAlbum(id, name) {
    var a = getLocalAlbums(); var f = a.find(function(x) { return x.id === id; }); if (f) f.name = name;
    saveLocalAlbums(a); return Promise.resolve(f);
  }
  function deleteAlbum(id) {
    var a = getLocalAlbums(); a = a.filter(function(x) { return x.id !== id; }); saveLocalAlbums(a);
    var m = getLocalMedia();
    m.forEach(function(x) { if (x.album_id === id) x.album_id = null; });
    saveLocalMedia(m); return Promise.resolve();
  }
  function renameMedia(id, name) {
    var m = getLocalMedia(); var f = m.find(function(x) { return x.id === id; }); if (f) f.filename = name;
    saveLocalMedia(m); return Promise.resolve(f);
  }
  function deleteMedia(id) {
    var m = getLocalMedia(); var rec = m.find(function(x) { return x.id === id; });
    if (rec && rec.url && rec.url.indexOf('/xeno-media/') === 0)
      cacheDelete(rec.url.replace('/xeno-media/', ''));
    if (rec && rec._sessionUrl && rec._sessionUrl.indexOf('blob:') === 0)
      URL.revokeObjectURL(rec._sessionUrl);
    m = m.filter(function(x) { return x.id !== id; }); saveLocalMedia(m);
    return Promise.resolve();
  }
  function moveMedia(id, albumId) {
    var m = getLocalMedia(); var rec = m.find(function(x) { return x.id === id; });
    if (rec) rec.album_id = albumId || null;
    saveLocalMedia(m); return Promise.resolve(rec);
  }

  // ─── Tour CRUD ────────────────────────────────────────

  function fetchTours() {
    var t = [];
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k.indexOf(LOCAL_STORAGE_PREFIX) !== 0) continue;
      try {
        var r = JSON.parse(localStorage.getItem(k));
        t.push({ slug: k.substring(LOCAL_STORAGE_PREFIX.length), data: r.data, updated_at: r.updated_at });
      } catch (e) {}
    }
    t.sort(function(a, b) { return new Date(b.updated_at) - new Date(a.updated_at); });
    return Promise.resolve(t);
  }

  function loadTour(slug) {
    var raw = localStorage.getItem(LOCAL_STORAGE_PREFIX + slug);
    if (!raw) return Promise.resolve(null);
    try { return Promise.resolve(JSON.parse(raw).data || JSON.parse(raw)); }
    catch (e) { return Promise.resolve(null); }
  }

  function saveTour(slug, tourData) {
    var payload = { data: tourData, updated_at: new Date().toISOString() };
    localStorage.setItem(LOCAL_STORAGE_PREFIX + slug, JSON.stringify(payload));
    return Promise.resolve();
  }

  function deleteTour(slug) {
    localStorage.removeItem(LOCAL_STORAGE_PREFIX + slug);
    return Promise.resolve();
  }

  // ─── File upload ──────────────────────────────────────

  function uploadFile(bucket, file) {
    return Promise.resolve(URL.createObjectURL(file));
  }

  // ─── Media Manager ────────────────────────────────────

  function fetchAlbums() { return Promise.resolve(getLocalAlbums()); }

  function createAlbum(name) {
    var a = getLocalAlbums();
    var n = {
      id: 'album_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      name: name, created_at: new Date().toISOString()
    };
    a.push(n); saveLocalAlbums(a); return Promise.resolve(n);
  }

  function fetchMedia(albumId) {
    var list = getLocalMedia();
    // Filter out dead blob: URLs from previous sessions
    list = list.filter(function(m) {
      if (m.url && m.url.indexOf('blob:') === 0) {
        if (m._sessionUrl && m._sessionUrl.indexOf('blob:') === 0)
          URL.revokeObjectURL(m._sessionUrl);
        return false;
      }
      return true;
    });
    // Attach session URLs for cached media (SW fallback)
    list.forEach(function(m) {
      if (m.url && m.url.indexOf('/xeno-media/') === 0 && !m._sessionUrl) {
        var key = m.url.replace('/xeno-media/', '');
        cacheGet(key).then(function(blob) {
          if (blob) {
            m._sessionUrl = URL.createObjectURL(blob);
            m._sessionUrlKey = key;
          }
        });
      }
    });
    var f = list.filter(function(m) {
      return albumId ? m.album_id === albumId : m.album_id === null;
    });
    f.sort(function(a, b) { return new Date(b.created_at) - new Date(a.created_at); });
    return Promise.resolve(f);
  }

  function uploadAndRecordMedia(file, albumId) {
    return new Promise(function(resolve, reject) {
      var mediaId = 'media_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      var record = {
        id: mediaId, filename: file.name, type: file.type, size: file.size,
        album_id: albumId || null, created_at: new Date().toISOString()
      };

      function storeAndResolve(asBase64) {
        cacheStore(mediaId, file).then(function() {
          record.url = '/xeno-media/' + mediaId;
          record.is_ephemeral = false;
          // For current-session display: also create a blob URL
          var blobUrl = URL.createObjectURL(file);
          _sessionUrls[mediaId] = blobUrl;
          record._sessionUrl = blobUrl;
          if (asBase64) record.url = asBase64; // small files use base64
          var list = getLocalMedia(); list.push(record); saveLocalMedia(list);
          resolve(record);
        });
      }

      if (file.size > 2 * 1024 * 1024) {
        storeAndResolve(null);
        return;
      }

      var reader = new FileReader();
      reader.onload = function(e) {
        record.url = e.target.result;
        record.is_ephemeral = false;
        var list = getLocalMedia(); list.push(record);
        try {
          localStorage.setItem('xeno_media', JSON.stringify(list));
          // Also store in cache for persistence
          cacheStore(mediaId, file);
          resolve(record);
        } catch (err) {
          if (err.name === 'QuotaExceededError' || err.code === 22)
            storeAndResolve(null);
          else reject(err);
        }
      };
      reader.onerror = function(err) { reject(err); };
      reader.readAsDataURL(file);
    });
  }

  // ─── Data export ──────────────────────────────────────

  function downloadAsFile(tourData, filename) {
    filename = filename || 'data.js';
    // Strip any remaining /xeno-media/ URLs (they won't work in exported tour)
    var cleaned = JSON.parse(JSON.stringify(tourData));
    function stripXeno(obj) {
      if (typeof obj === 'string' && obj.indexOf('/xeno-media/') === 0)
        return 'media/' + obj.replace('/xeno-media/', '') + '.bin';
      if (Array.isArray(obj)) return obj.map(stripXeno);
      if (obj && typeof obj === 'object') {
        var out = {};
        for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k)) out[k] = stripXeno(obj[k]);
        return out;
      }
      return obj;
    }
    cleaned = stripXeno(cleaned);
    var content = 'var data = ' + JSON.stringify(cleaned, null, 2) + ';\n';
    var blob = new Blob([content], { type: 'application/javascript' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ─── Init / stubs ─────────────────────────────────────

  function init() { console.log('[Xeno] Running in local storage mode'); }
  function isConfigured() { return false; }

  // ─── Expose ───────────────────────────────────────────

  window.XenoSupabase = {
    init: init, isConfigured: isConfigured,
    loadTour: loadTour, saveTour: saveTour,
    fetchTours: fetchTours, deleteTour: deleteTour,
    uploadFile: uploadFile, downloadAsFile: downloadAsFile,
    fetchAlbums: fetchAlbums, createAlbum: createAlbum,
    fetchMedia: fetchMedia, uploadAndRecordMedia: uploadAndRecordMedia,
    renameAlbum: renameAlbum, deleteAlbum: deleteAlbum,
    renameMedia: renameMedia, deleteMedia: deleteMedia, moveMedia: moveMedia,
    swReady: swReady,
    cacheGet: cacheGet
  };
})();
