/*
 * Xeno — Local Storage Engine
 * Tour data → localStorage. Media blobs → IndexedDB.
 * No Service Worker dependency — blobs are served as blob: URLs directly.
 */
(function () {
  'use strict';

  var LOCAL_STORAGE_PREFIX = 'xeno_tour_';
  var DB_NAME = 'xeno-media-db';
  var DB_VERSION = 1;
  var STORE_NAME = 'blobs';

  // ─── IndexedDB helpers ────────────────────────────────

  function dbOpen() {
    return new Promise(function(resolve, reject) {
      var req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function(e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME))
          db.createObjectStore(STORE_NAME);
      };
      req.onsuccess = function(e) { resolve(e.target.result); };
      req.onerror = function(e) { reject(e.target.error); };
    });
  }

  function dbStore(key, blob) {
    return dbOpen().then(function(db) {
      return new Promise(function(resolve, reject) {
        var tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(blob, key);
        tx.oncomplete = function() { db.close(); resolve(); };
        tx.onerror = function(e) { db.close(); reject(e.target.error); };
      });
    });
  }

  function dbGet(key) {
    return dbOpen().then(function(db) {
      return new Promise(function(resolve, reject) {
        var tx = db.transaction(STORE_NAME, 'readonly');
        var req = tx.objectStore(STORE_NAME).get(key);
        req.onsuccess = function() { db.close(); resolve(req.result || null); };
        req.onerror = function(e) { db.close(); reject(e.target.error); };
      });
    });
  }

  function dbDelete(key) {
    return dbOpen().then(function(db) {
      return new Promise(function(resolve, reject) {
        var tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(key);
        tx.oncomplete = function() { db.close(); resolve(); };
        tx.onerror = function(e) { db.close(); reject(e.target.error); };
      });
    });
  }

  // ─── Blob storage helpers ─────────────────────────────

  function blobStore(key, blob) {
    return dbStore(key, blob).catch(function(err) {
      console.warn('[Xeno] IndexedDB store failed', err);
    });
  }

  function blobGet(key) {
    return dbGet(key).catch(function() { return null; });
  }

  function blobDelete(key) {
    return dbDelete(key).catch(function() {});
  }

  // Track active blob URLs so we can revoke them
  var _blobUrls = {};

  function revokeBlobUrl(key) {
    if (_blobUrls[key]) {
      URL.revokeObjectURL(_blobUrls[key]);
      delete _blobUrls[key];
    }
  }

  function createBlobUrl(key) {
    revokeBlobUrl(key);
    return blobGet(key).then(function(blob) {
      if (!blob) return null;
      _blobUrls[key] = URL.createObjectURL(blob);
      return _blobUrls[key];
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
    if (rec) {
      revokeBlobUrl(rec.id);
      blobDelete(rec.id);
    }
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
    // Attach blob URLs from IDB
    var blobPromises = [];
    list.forEach(function(m) {
      if (m._blobUrl) return;
      blobPromises.push(
        createBlobUrl(m.id).then(function(blobUrl) {
          if (blobUrl) m._blobUrl = blobUrl;
        })
      );
    });
    return Promise.all(blobPromises).then(function() {
      var f = list.filter(function(m) {
        return albumId ? m.album_id === albumId : m.album_id === null;
      });
      f.sort(function(a, b) { return new Date(b.created_at) - new Date(a.created_at); });
      return f;
    });
  }

  function uploadAndRecordMedia(file, albumId) {
    return new Promise(function(resolve, reject) {
      var mediaId = 'media_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

      var record = {
        id: mediaId, filename: file.name, type: file.type, size: file.size,
        album_id: albumId || null, created_at: new Date().toISOString(),
        url: mediaId
      };

      blobStore(mediaId, file).then(function() {
        var list = getLocalMedia(); list.push(record); saveLocalMedia(list);
        resolve(record);
      });
    });
  }

  // ─── Data export ──────────────────────────────────────

  function downloadAsFile(tourData, filename) {
    filename = filename || 'data.js';
    var cleaned = JSON.parse(JSON.stringify(tourData));
    function stripBlob(obj) {
      if (typeof obj === 'string' && obj.indexOf('blob:') === 0)
        return '';
      if (Array.isArray(obj)) return obj.map(stripBlob);
      if (obj && typeof obj === 'object') {
        var out = {};
        for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k)) out[k] = stripBlob(obj[k]);
        return out;
      }
      return obj;
    }
    cleaned = stripBlob(cleaned);
    var content = 'var data = ' + JSON.stringify(cleaned, null, 2) + ';\n';
    var blob = new Blob([content], { type: 'application/javascript' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ─── Resolve a stored media ID to a blob URL ──────────

  function resolveMediaId(mediaId) {
    if (_blobUrls[mediaId]) return Promise.resolve(_blobUrls[mediaId]);
    return createBlobUrl(mediaId).then(function(blobUrl) {
      return blobUrl || null;
    });
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
    resolveMediaId: resolveMediaId
  };
})();
