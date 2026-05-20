/*
 * Xeno — Supabase Client
 * Handles all reads/writes to Supabase (Postgres + Storage).
 * Falls back to localStorage when no credentials are configured.
 *
 * Usage:
 *   XenoSupabase.init({ url: '...', anonKey: '...' });
 *   XenoSupabase.loadTour('my-tour').then(data => ...);
 *   XenoSupabase.saveTour('my-tour', dataObj).then(() => ...);
 *   XenoSupabase.uploadFile('panoramas', file).then(publicUrl => ...);
 */
(function () {
  'use strict';

  var SUPABASE_URL = null;
  var SUPABASE_ANON_KEY = null;
  var LOCAL_STORAGE_PREFIX = 'xeno_tour_';

  // ─── Helpers ──────────────────────────────────────────────

  function supabaseHeaders() {
    return {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
  }

  function isConfigured() {
    return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
  }

  // ─── REST Wrappers ────────────────────────────────────────

  function restGet(path) {
    return fetch(SUPABASE_URL + path, {
      method: 'GET',
      headers: supabaseHeaders()
    }).then(function (r) { return r.json(); });
  }

  function restPost(path, body) {
    return fetch(SUPABASE_URL + path, {
      method: 'POST',
      headers: supabaseHeaders(),
      body: JSON.stringify(body)
    }).then(function (r) { return r.json(); });
  }

  function restPatch(path, body) {
    var h = supabaseHeaders();
    h['Prefer'] = 'return=representation';
    return fetch(SUPABASE_URL + path, {
      method: 'PATCH',
      headers: h,
      body: JSON.stringify(body)
    }).then(function (r) { return r.json(); });
  }

  function restDelete(path) {
    return fetch(SUPABASE_URL + path, {
      method: 'DELETE',
      headers: supabaseHeaders()
    }).then(function (r) {
      if (!r.ok) throw new Error('Delete failed: ' + r.statusText);
      return r.text().then(function(text) {
        return text ? JSON.parse(text) : null;
      });
    });
  }

  function renameAlbum(albumId, newName) {
    if (!isConfigured()) return Promise.resolve();
    return restPatch('/rest/v1/albums?id=eq.' + albumId, { name: newName });
  }

  function deleteAlbum(albumId) {
    if (!isConfigured()) return Promise.resolve();
    // Set all media in this album to null (Root) before deleting
    return restPatch('/rest/v1/media?album_id=eq.' + albumId, { album_id: null })
      .then(function() {
        return restDelete('/rest/v1/albums?id=eq.' + albumId);
      });
  }

  function renameMedia(mediaId, newName) {
    if (!isConfigured()) return Promise.resolve();
    return restPatch('/rest/v1/media?id=eq.' + mediaId, { filename: newName });
  }

  function deleteMedia(mediaId, url) {
    if (!isConfigured()) return Promise.resolve();
    return restDelete('/rest/v1/media?id=eq.' + mediaId).then(function() {
      // Try to clean up file in storage bucket
      var bucket = (window.ENV_CONFIG && window.ENV_CONFIG.SUPABASE_STORAGE_BUCKET) || 'xeno-media';
      var separator = '/' + bucket + '/';
      if (url && url.indexOf(separator) !== -1) {
        var filePath = url.split(separator)[1];
        var deleteUrl = SUPABASE_URL + '/storage/v1/object/' + bucket + '/' + filePath;
        return fetch(deleteUrl, {
          method: 'DELETE',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
          }
        }).catch(function(err) {
          console.warn('Storage delete failed', err);
        });
      }
    });
  }

  function moveMedia(mediaId, newAlbumId) {
    if (!isConfigured()) return Promise.resolve();
    return restPatch('/rest/v1/media?id=eq.' + mediaId, { album_id: newAlbumId || null });
  }

  // ─── Public API ───────────────────────────────────────────

  /**
   * Initialise Supabase connection.
   * Call once at app start. If url/anonKey are falsy, localStorage mode is used.
   */
  function init(opts) {
    opts = opts || {};
    // Check global config if options not provided
    if (window.ENV_CONFIG) {
      opts.url = opts.url || window.ENV_CONFIG.SUPABASE_URL;
      opts.anonKey = opts.anonKey || window.ENV_CONFIG.SUPABASE_ANON_KEY;
    }
    
    SUPABASE_URL = opts.url || null;
    SUPABASE_ANON_KEY = opts.anonKey || null;
    
    // Ignore dummy placeholder
    if (SUPABASE_URL === 'YOUR_SUPABASE_URL') {
      SUPABASE_URL = null;
      SUPABASE_ANON_KEY = null;
    }

    if (isConfigured()) {
      console.log('[Xeno] Supabase connected → ' + SUPABASE_URL);
    } else {
      console.log('[Xeno] Running in offline mode (localStorage)');
    }
  }

  /**
   * Load all tours from localStorage or Supabase
   * Returns a Promise resolving to an array of {slug, data, updated_at}
   */
  function fetchTours() {
    var tours = [];
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (key.indexOf(LOCAL_STORAGE_PREFIX) === 0) {
        var slug = key.substring(LOCAL_STORAGE_PREFIX.length);
        try {
          var raw = JSON.parse(localStorage.getItem(key));
          tours.push({ slug: slug, data: raw.data, updated_at: raw.updated_at });
        } catch(e) {}
      }
    }
    tours.sort(function(a, b) { return new Date(b.updated_at) - new Date(a.updated_at); });
    
    if (isConfigured()) {
      return restGet('/rest/v1/tours?select=*&order=updated_at.desc')
        .then(function(rows) {
          if (rows && rows.length > 0) {
            return rows.map(function(r) {
              var tourData = typeof r.data === 'string' ? JSON.parse(r.data) : r.data;
              localStorage.setItem(LOCAL_STORAGE_PREFIX + r.slug, JSON.stringify({ data: tourData, updated_at: r.updated_at }));
              return { slug: r.slug, data: tourData, updated_at: r.updated_at };
            });
          }
          return tours;
        }).catch(function(err) {
          console.warn('Supabase fetchTours failed, fallback to local', err);
          return tours;
        });
    }
    return Promise.resolve(tours);
  }

  /**
   * Load a tour synchronously by slug from localStorage
   */
  function loadTour(slug) {
    var raw = localStorage.getItem(LOCAL_STORAGE_PREFIX + slug);
    if (raw) {
      try {
        return JSON.parse(raw).data;
      } catch(e) {}
    }
    return null;
  }

  /**
   * Save a tour by slug (synchronously to localStorage, async to Supabase if configured)
   */
  function saveTour(slug, tourData) {
    var payload = { data: tourData, updated_at: new Date().toISOString() };
    localStorage.setItem(LOCAL_STORAGE_PREFIX + slug, JSON.stringify(payload));
    
    if (isConfigured()) {
      restGet('/rest/v1/tours?slug=eq.' + encodeURIComponent(slug) + '&select=id')
        .then(function(rows) {
          var dbPayload = {
            slug: slug,
            data: tourData,
            updated_at: payload.updated_at
          };
          if (rows && rows.length > 0) {
            return restPatch('/rest/v1/tours?slug=eq.' + encodeURIComponent(slug), dbPayload);
          } else {
            dbPayload.created_at = payload.updated_at;
            return restPost('/rest/v1/tours', dbPayload);
          }
        }).catch(function(err) {
          console.warn('Supabase saveTour failed', err);
        });
    }
  }

  /**
   * Delete a tour by slug
   */
  function deleteTour(slug) {
    localStorage.removeItem(LOCAL_STORAGE_PREFIX + slug);
    if (isConfigured()) {
      restDelete('/rest/v1/tours?slug=eq.' + encodeURIComponent(slug))
        .catch(function(err) {
          console.warn('Supabase deleteTour failed', err);
        });
    }
  }

  /**
   * Upload a file to a Supabase Storage bucket.
   * Returns a Promise resolving to the public URL string.
   */
  function uploadFile(bucket, file) {
    if (!isConfigured()) {
      var objectUrl = URL.createObjectURL(file);
      console.log('[Xeno] Offline upload — using object URL');
      return Promise.resolve(objectUrl);
    }

    // Sanitize filename to remove weird characters
    var safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    var filePath = Date.now() + '_' + safeName;
    var uploadUrl = SUPABASE_URL + '/storage/v1/object/' + bucket + '/' + filePath;

    return fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
        'Content-Type': file.type,
        'x-upsert': 'true'
      },
      body: file
    }).then(function (res) {
      if (!res.ok) throw new Error('Upload failed: ' + res.statusText);
      return SUPABASE_URL + '/storage/v1/object/public/' + bucket + '/' + filePath;
    });
  }

  // ─── Media Manager ────────────────────────────────────────

  function fetchAlbums() {
    if (!isConfigured()) return Promise.resolve([]);
    return restGet('/rest/v1/albums?select=*&order=created_at.asc');
  }

  function createAlbum(name) {
    if (!isConfigured()) return Promise.resolve(null);
    return restPost('/rest/v1/albums', {
      name: name
    }).then(function(res) {
      // Postgres might return array if we requested representation, but let's assume it returns array
      return Array.isArray(res) ? res[0] : res;
    });
  }

  function fetchMedia(albumId) {
    if (!isConfigured()) return Promise.resolve([]);
    var query = '/rest/v1/media?select=*&order=created_at.desc';
    if (albumId) {
      query += '&album_id=eq.' + albumId;
    } else {
      query += '&album_id=is.null';
    }
    return restGet(query);
  }

  function uploadAndRecordMedia(file, albumId) {
    if (!isConfigured()) return Promise.reject(new Error("Supabase not configured"));
    
    var bucket = (window.ENV_CONFIG && window.ENV_CONFIG.SUPABASE_STORAGE_BUCKET) || 'xeno-media';
    
    return uploadFile(bucket, file).then(function(publicUrl) {
      var record = {
        filename: file.name,
        url: publicUrl,
        type: file.type,
        size: file.size,
        album_id: albumId || null
      };
      
      return restPost('/rest/v1/media', record).then(function(res) {
        return Array.isArray(res) ? res[0] : res;
      });
    });
  }

  /**
   * Download tour data as a .js file.
   * Useful for offline / static hosting export.
   */
  function downloadAsFile(tourData, filename) {
    filename = filename || 'data.js';
    var content = 'var data = ' + JSON.stringify(tourData, null, 2) + ';\n';
    var blob = new Blob([content], { type: 'application/javascript' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ─── localStorage Fallback ────────────────────────────────

  function localSave(slug, tourData) {
    try {
      localStorage.setItem(LOCAL_STORAGE_PREFIX + slug, JSON.stringify(tourData));
      console.log('[Xeno] Tour saved to localStorage: ' + slug);
    } catch (e) {
      console.warn('[Xeno] localStorage save failed', e);
    }
  }

  function localLoad(slug) {
    try {
      var raw = localStorage.getItem(LOCAL_STORAGE_PREFIX + slug);
      if (raw) {
        console.log('[Xeno] Tour loaded from localStorage: ' + slug);
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('[Xeno] localStorage load failed', e);
    }
    return null;
  }

  // ─── Expose ───────────────────────────────────────────────

  window.XenoSupabase = {
    init: init,
    loadTour: loadTour,
    saveTour: saveTour,
    fetchTours: fetchTours,
    deleteTour: deleteTour,
    uploadFile: uploadFile,
    downloadAsFile: downloadAsFile,
    isConfigured: isConfigured,
    // Media Manager
    fetchAlbums: fetchAlbums,
    createAlbum: createAlbum,
    fetchMedia: fetchMedia,
    uploadAndRecordMedia: uploadAndRecordMedia,
    renameAlbum: renameAlbum,
    deleteAlbum: deleteAlbum,
    renameMedia: renameMedia,
    deleteMedia: deleteMedia,
    moveMedia: moveMedia
  };

})();
