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
  var _db = null;

  function dbOpen() {
    if (_db) return _db;
    _db = new Promise(function(resolve, reject) {
      var req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function(e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME))
          db.createObjectStore(STORE_NAME);
      };
      req.onsuccess = function(e) { resolve(e.target.result); };
      req.onerror = function(e) { _db = null; reject(e.target.error); };
      req.onblocked = function() { _db = null; reject(new Error('IndexedDB blocked')); };
    });
    return _db;
  }

  function dbStore(key, blob) {
    return dbOpen().then(function(db) {
      return new Promise(function(resolve, reject) {
        var tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(blob, key);
        tx.oncomplete = function() { resolve(); };
        tx.onerror = function(e) { reject(e.target.error); };
        tx.onabort = function() { reject(new Error('Transaction aborted')); };
      });
    });
  }

  function dbGet(key) {
    return dbOpen().then(function(db) {
      return new Promise(function(resolve, reject) {
        var tx = db.transaction(STORE_NAME, 'readonly');
        var req = tx.objectStore(STORE_NAME).get(key);
        req.onsuccess = function() { resolve(req.result || null); };
        req.onerror = function(e) { reject(e.target.error); };
        tx.onabort = function() { reject(new Error('Transaction aborted')); };
      });
    });
  }

  function dbDelete(key) {
    return dbOpen().then(function(db) {
      return new Promise(function(resolve, reject) {
        var tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(key);
        tx.oncomplete = function() { resolve(); };
        tx.onerror = function(e) { reject(e.target.error); };
        tx.onabort = function() { reject(new Error('Transaction aborted')); };
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
    if (_blobUrls[key]) return Promise.resolve(_blobUrls[key]);
    return blobGet(key).then(function(blob) {
      if (!blob) return null;
      _blobUrls[key] = URL.createObjectURL(blob);
      return _blobUrls[key];
    });
  }

  function cleanOrphanBlobs() {
    var mediaIds = {};
    var list = getLocalMedia();
    list.forEach(function(m) { mediaIds[m.id] = true; });
    // Scan all tour data for media references to prevent cross-project deletion
    var tourRefs = {};
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k.indexOf(LOCAL_STORAGE_PREFIX) !== 0) continue;
      try {
        var tourData = JSON.parse(localStorage.getItem(k)).data;
        (tourData.scenes || []).forEach(function(s) {
          if (s.mediaUrl) tourRefs[s.mediaUrl] = true;
          if (s.thumbnailUrl) tourRefs[s.thumbnailUrl] = true;
          var allHs = (s.hotspots || []).concat(s.linkHotspots || [], s.infoHotspots || [], s.mediaHotspots || []);
          allHs.forEach(function(h) {
            if (h.customIconUrl) tourRefs[h.customIconUrl] = true;
            if (h.narratorAudio) tourRefs[h.narratorAudio] = true;
            if (h.ambientAudio) tourRefs[h.ambientAudio] = true;
            if (h.content && h.content.src) tourRefs[h.content.src] = true;
          });
        });
      } catch(e) {}
    }
    dbOpen().then(function(db) {
      var tx = db.transaction(STORE_NAME, 'readonly');
      var store = tx.objectStore(STORE_NAME);
      var req = store.getAllKeys();
      req.onsuccess = function() {
        var keys = req.result || [];
        var orphanKeys = keys.filter(function(k) { return !mediaIds[k] && !tourRefs[k]; });
        if (!orphanKeys.length) return;
        var delTx = db.transaction(STORE_NAME, 'readwrite');
        var delStore = delTx.objectStore(STORE_NAME);
        orphanKeys.forEach(function(k) { delStore.delete(k); });
      };
    }).catch(function() {});
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
    try {
      var d = localStorage.getItem('xeno_media');
      if (!d) return [];
      var list = JSON.parse(d);
      list.forEach(function(m) { delete m._blobUrl; });
      return list;
    } catch(e) { return []; }
  }

  function getMediaRecord(id) {
    if (!id) return null;
    var list = getLocalMedia();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
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
        t.push({ slug: k.substring(LOCAL_STORAGE_PREFIX.length), data: r.data, created_at: r.created_at, updated_at: r.updated_at });
      } catch (e) {}
    }
    t.sort(function(a, b) { return new Date(b.updated_at) - new Date(a.updated_at); });
    return Promise.resolve(t);
  }

  function loadTour(slug) {
    var raw = localStorage.getItem(LOCAL_STORAGE_PREFIX + slug);
    if (!raw) return Promise.resolve(null);
    try {
      var parsed = JSON.parse(raw);
      return Promise.resolve(parsed.data || parsed);
    }
    catch (e) { return Promise.resolve(null); }
  }

  function saveTour(slug, tourData) {
    var raw = localStorage.getItem(LOCAL_STORAGE_PREFIX + slug);
    var existing = raw ? JSON.parse(raw) : {};
    var payload = {
      data: tourData,
      created_at: existing.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    try {
      localStorage.setItem(LOCAL_STORAGE_PREFIX + slug, JSON.stringify(payload));
    } catch(e) {
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        alert('Storage is full! Please free up space. Your recent changes may not be saved.');
        return Promise.resolve();
      }
    }
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
    // Create blob URLs for items not already cached (session-scoped)
    var blobPromises = [];
    list.forEach(function(m) {
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
        // Create blob URL immediately so uploaded image shows right away
        record._blobUrl = URL.createObjectURL(file);
        _blobUrls[mediaId] = record._blobUrl;
        resolve(record);
      }).catch(function(err) {
        reject(err);
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
    return createBlobUrl(mediaId).then(function(blobUrl) {
      return blobUrl || null;
    });
  }

  // ─── Export / Import ──────────────────────────────────

  function exportProject(slug) {
    var raw = localStorage.getItem(LOCAL_STORAGE_PREFIX + slug);
    if (!raw) return Promise.reject(new Error('Project not found'));
    var bundle = JSON.parse(raw);
    var projectData = bundle.data || bundle;
    projectData.slug = slug;
    var mediaList = getLocalMedia();
    var albums = getLocalAlbums();

    // Collect all media IDs referenced by this project
    var referencedIds = {};
    function scanForMediaIds(obj) {
      if (typeof obj === 'string' && obj.indexOf('media_') === 0) referencedIds[obj] = true;
      if (Array.isArray(obj)) obj.forEach(scanForMediaIds);
      if (obj && typeof obj === 'object') {
        for (var k in obj) { if (obj.hasOwnProperty(k)) scanForMediaIds(obj[k]); }
      }
    }
    scanForMediaIds(projectData);

    // Filter media to only include items referenced by this project
    var projectMedia = mediaList.filter(function(m) { return referencedIds[m.id]; });

    return Promise.all(projectMedia.map(function(m) {
      return blobGet(m.id).then(function(blob) {
        if (!blob) return { id: m.id, filename: m.filename, type: m.type, size: m.size, album_id: m.album_id, created_at: m.created_at, data: null };
        return new Promise(function(resolve) {
          var reader = new FileReader();
          reader.onload = function() {
            resolve({ id: m.id, filename: m.filename, type: m.type, size: m.size, album_id: m.album_id, created_at: m.created_at, data: reader.result });
          };
          reader.onerror = function() { resolve({ id: m.id, filename: m.filename, type: m.type, size: m.size, album_id: m.album_id, created_at: m.created_at, data: null }); };
          reader.readAsDataURL(blob);
        });
      });
    })).then(function(mediaEntries) {
      return {
        version: '1.0',
        type: 'xeno-project',
        exportedAt: new Date().toISOString(),
        project: projectData,
        albums: albums,
        media: mediaEntries
      };
    });
  }

  function importProject(bundle) {
    if (!bundle || bundle.type !== 'xeno-project') return Promise.reject(new Error('Invalid project file'));
    var slug = bundle.project.slug;
    // Save tour data
    var raw = localStorage.getItem(LOCAL_STORAGE_PREFIX + slug);
    var existing = raw ? JSON.parse(raw) : {};
    var payload = {
      data: bundle.project,
      created_at: existing.created_at || bundle.project.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    localStorage.setItem(LOCAL_STORAGE_PREFIX + slug, JSON.stringify(payload));
    // Merge albums
    if (bundle.albums && bundle.albums.length) {
      var existingAlbums = getLocalAlbums();
      var albumIds = {};
      existingAlbums.forEach(function(a) { albumIds[a.id] = true; });
      bundle.albums.forEach(function(a) { if (!albumIds[a.id]) existingAlbums.push(a); });
      saveLocalAlbums(existingAlbums);
    }
    // Merge media records
    var existingMedia = getLocalMedia();
    var mediaIds = {};
    existingMedia.forEach(function(m) { mediaIds[m.id] = true; });
    var newRecords = (bundle.media || []).map(function(m) {
      return { id: m.id, filename: m.filename, type: m.type, size: m.size, album_id: m.album_id, created_at: m.created_at, url: m.id };
    });
    newRecords.forEach(function(r) { if (!mediaIds[r.id]) existingMedia.push(r); });
    saveLocalMedia(existingMedia);
    // Restore blobs to IndexedDB
    var blobPromises = (bundle.media || []).map(function(m) {
      if (!m.data) return Promise.resolve();
      var base64 = m.data.split(',')[1] || m.data.split(',')[0];
      if (!base64) return Promise.resolve();
      var mimeType = m.data.split(',')[0].match(/:(.*?);/);
      mimeType = mimeType ? mimeType[1] : 'application/octet-stream';
      return fetch('data:' + mimeType + ';base64,' + base64).then(function(res) {
        return res.blob();
      }).then(function(blob) {
        return blobStore(m.id, blob);
      }).catch(function() {});
    });
    return Promise.all(blobPromises).then(function() { return slug; });
  }

  // ─── Init / stubs ─────────────────────────────────────

  function init() { console.log('[Xeno] Running in local storage mode'); }
  function isConfigured() { return false; }

  // ─── Expose ───────────────────────────────────────────

  window.XenoSupabase = {
    init: init, isConfigured: isConfigured,
    loadTour: loadTour, saveTour: saveTour,
    fetchTours: fetchTours, deleteTour: deleteTour,
    downloadAsFile: downloadAsFile,
    fetchAlbums: fetchAlbums, createAlbum: createAlbum,
    fetchMedia: fetchMedia, uploadAndRecordMedia: uploadAndRecordMedia, getMediaRecord: getMediaRecord,
    renameAlbum: renameAlbum, deleteAlbum: deleteAlbum,
    renameMedia: renameMedia, deleteMedia: deleteMedia, moveMedia: moveMedia,
    resolveMediaId: resolveMediaId,
    exportProject: exportProject, importProject: importProject
  };

  // Cleanup orphaned IndexedDB blobs (media records deleted but blobs remain)
  setTimeout(function() { cleanOrphanBlobs(); }, 3000);
})();
