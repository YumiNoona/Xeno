(function() {
  'use strict';
  var E = window.XenoEditor;
  var S = E.state;
  var D = E.dom;

  var currentAlbumId = null;
  var selectedIds = new Set();
  var selectedMap = {};
  var lastIndex = null;
  var mediaCache = [];
  var albumCtx = null;
  var mediaCtx = null;
  var _loadPending = false;
  var _mediaDirty = true;
  var _lastFetchedAlbum = null;
  var _modalOpen = false;
  var _mediaGen = 0;

  // ─── Albums ──────────────────────────────────────────
  function loadAlbums(activeId) {
    if (activeId !== undefined) currentAlbumId = activeId;
    window.XenoSupabase.fetchAlbums().then(function(albums) {
      D.albumListEl.innerHTML = '';
      var rootEl = document.createElement('div');
      rootEl.className = 'album-item' + (currentAlbumId === null ? ' active' : '');
      rootEl.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg> Root';
      rootEl.addEventListener('click', function() { loadAlbums(null); loadMedia(null); });
      D.albumListEl.appendChild(rootEl);

      albums.forEach(function(album) {
        var el = document.createElement('div');
        el.className = 'album-item' + (currentAlbumId === album.id ? ' active' : '');
        el.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg> ' + album.name;
        el.addEventListener('click', function() { loadAlbums(album.id); loadMedia(album.id); });
        el.addEventListener('contextmenu', function(e) {
          e.preventDefault(); e.stopPropagation();
          albumCtx = album;
          D.contextMenu.style.display = 'none';
          D.mediaItemCtx.style.display = 'none';
          D.mediaFolderCtx.style.display = 'block';
          D.mediaFolderCtx.style.left = e.clientX + 'px';
          D.mediaFolderCtx.style.top = e.clientY + 'px';
        });
        D.albumListEl.appendChild(el);
      });
    });
  }

  E.loadAlbums = loadAlbums;

  // ─── Media Grid ──────────────────────────────────────
  function syncSelection() {
    D.mediaGridEl.querySelectorAll('.media-item').forEach(function(item) {
      var mid = item.__mediaData && item.__mediaData.id;
      if (mid && selectedIds.has(mid)) item.classList.add('selected');
      else item.classList.remove('selected');
    });
    var bar = document.getElementById('media-action-bar');
    var count = document.getElementById('media-sel-count');
    if (selectedIds.size > 0) {
      count.textContent = selectedIds.size + ' selected';
      bar.style.display = 'flex';
    } else {
      bar.style.display = 'none';
    }
  }

  function loadMedia(albumId) {
    currentAlbumId = albumId;
    // Treat undefined album_id same as null for root view
    var normalizedId = (albumId === undefined) ? null : albumId;
    currentAlbumId = normalizedId;

    _mediaGen++;
    var currentGen = _mediaGen;

    var useCache = _lastFetchedAlbum === normalizedId && !_mediaDirty && mediaCache.length > 0;
    _lastFetchedAlbum = normalizedId;

    if (!useCache) {
      _mediaDirty = false;
      // Revoke old blob URLs before clearing cache
      mediaCache.forEach(function(m) {
        if (window.XenoSupabase && window.XenoSupabase.revokeBlobUrl) {
          window.XenoSupabase.revokeBlobUrl(m.id);
        } else if (m._blobUrl) {
          URL.revokeObjectURL(m._blobUrl);
        }
      });
      selectedIds.clear();
      selectedMap = {};
      lastIndex = null;
      mediaCache = [];
      syncSelection();
      D.mediaGridEl.innerHTML = '<div class="media-loading"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Loading...</div>';
    }

    _loadPending = true;
    var fetchOrCache = useCache
      ? Promise.resolve(mediaCache)
      : window.XenoSupabase.fetchMedia(normalizedId);
    fetchOrCache.then(function(list) {
      if (currentGen !== _mediaGen) {
        // Stale fetch - clean up blob URLs to prevent memory leaks
        list.forEach(function(m) {
          if (window.XenoSupabase && window.XenoSupabase.revokeBlobUrl) {
            window.XenoSupabase.revokeBlobUrl(m.id);
          } else if (m._blobUrl) {
            URL.revokeObjectURL(m._blobUrl);
          }
        });
        return;
      }
      _loadPending = false;

      if (!useCache) mediaCache = list;
      D.mediaGridEl.innerHTML = '';
      if (list.length === 0) {
        D.mediaGridEl.innerHTML = '<div class="media-empty">No media yet &mdash; upload files above</div>';
        return;
      }
      list.forEach(function(media, index) {
        var item = document.createElement('div');
        item.className = 'media-item';
        item.style.position = 'relative';
        item.__mediaIndex = index;
        item.__mediaData = media;

        var thumb = (media.type && media.type.startsWith('video')) ? '' : media._blobUrl;
        var imgHtml;
        if (thumb) {
          imgHtml = '<img src="' + thumb + '">';
        } else {
          var isVideo = media.type && media.type.startsWith('video');
          var isAudio = media.type && media.type.startsWith('audio');
          var iconCls = isVideo ? 'ti-video' : (isAudio ? 'ti-volume' : 'ti-file');
          var label = isVideo ? 'Video' : (isAudio ? 'Audio' : 'File');
          imgHtml = '<div class="media-thumb-placeholder"><i class="ti ' + iconCls + '"></i>' + label + '</div>';
        }

        var badge = '';
        if (media.is_ephemeral) {
          badge = '<div class="media-ephemeral-badge"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Ephemeral</div>';
        }
        item.innerHTML = badge + imgHtml + '<div class="title">' + media.filename + '</div>';

        // Set onerror safely via JS after innerHTML (avoids triple-escaping)
        var imgEl = item.querySelector('img');
        if (imgEl) {
          imgEl.onerror = function() {
            this.outerHTML = '<div class="media-thumb-placeholder">Broken</div>';
          };
        }

        item.addEventListener('click', function(e) {
          if (S.mediaPickerCallback) {
            S.mediaPickerCallback(media.url, media.filename);
            S.mediaPickerCallback = null;
            D.mediaModal.classList.remove('visible');
            _modalOpen = false;
            return;
          }
          var mid = media.id;
          if (e.shiftKey && lastIndex !== null) {
            var si = Math.min(lastIndex, index);
            var ei = Math.max(lastIndex, index);
            for (var i = si; i <= ei; i++) {
              var cm = mediaCache[i];
              if (cm) { selectedIds.add(cm.id); selectedMap[cm.id] = cm; }
            }
          } else {
            if (selectedIds.has(mid)) { selectedIds.delete(mid); delete selectedMap[mid]; }
            else { selectedIds.add(mid); selectedMap[mid] = media; }
          }
          lastIndex = index;
          syncSelection();
        });

        item.addEventListener('contextmenu', function(e) {
          e.preventDefault(); e.stopPropagation();
          mediaCtx = media;
          D.contextMenu.style.display = 'none';
          D.mediaFolderCtx.style.display = 'none';
          D.mediaItemCtx.style.display = 'block';
          D.mediaItemCtx.style.left = e.clientX + 'px';
          D.mediaItemCtx.style.top = e.clientY + 'px';
        });

        D.mediaGridEl.appendChild(item);
      });
    }).catch(function(err) {
      _loadPending = false;
      D.mediaGridEl.innerHTML = '<div class="media-error"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Error: ' + err.message + '</div>';
    });
  }

  E.loadMedia = loadMedia;

  // ─── Unified entry point (all callers use this) ────────
  // Prevent duplicate simultaneous opens using _modalOpen flag
  E.openMediaModal = function() {
    if (_modalOpen) return;
    _modalOpen = true;
    D.mediaModal.classList.add('visible');
    loadAlbums();
    loadMedia(currentAlbumId);
  };

  // ─── Setup event listeners (called from editor.js) ────
  E.setupMediaManager = function() {
    if (E._mediaMgrSetupDone) return; E._mediaMgrSetupDone = true;
    var btnMedia = document.getElementById('btn-media-manager');
    if (btnMedia) {
      btnMedia.addEventListener('click', function() { E.openMediaModal(); });
    }

    var btnClose = document.getElementById('btn-close-media');
    if (btnClose) {
      btnClose.addEventListener('click', function() {
        _loadPending = false;
        _modalOpen = false;
        S.mediaPickerCallback = null;
        D.mediaModal.classList.remove('visible');
      });
    }

    var btnAddAlbum = document.getElementById('btn-add-album');
    if (btnAddAlbum) {
      btnAddAlbum.addEventListener('click', function() {
        E.prompt('Enter album name:', '', 'New Album').then(function(name) {
          if (name) {
            window.XenoSupabase.createAlbum(name).then(function() { loadAlbums(); })
              .catch(function(err) { E.alert('Error: ' + err.message, 'Create Album Error'); });
          }
        });
      });
    }

    // ─── Upload ────────────────────────────────────────
    var uploadArea = document.getElementById('media-upload-area');
    var fileInput = document.getElementById('media-file-input');

    if (uploadArea && fileInput) {
      uploadArea.addEventListener('click', function() { fileInput.click(); });
      uploadArea.addEventListener('dragover', function(e) { e.preventDefault(); uploadArea.style.borderColor = '#e62e5a'; });
      uploadArea.addEventListener('dragleave', function(e) { e.preventDefault(); uploadArea.style.borderColor = ''; });
      uploadArea.addEventListener('drop', function(e) {
        e.preventDefault(); uploadArea.style.borderColor = '';
        if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
      });
      fileInput.addEventListener('change', function() {
        if (this.files.length > 0) handleFiles(this.files);
      });
    }

    // ─── Album Context Menu ────────────────────────────
    if (D.mediaFolderCtx) {
      D.mediaFolderCtx.querySelectorAll('.ctx-item').forEach(function(item) {
        item.addEventListener('click', function(e) {
          e.stopPropagation();
          if (!albumCtx) return;
          var ta = albumCtx;
          var action = this.getAttribute('data-action');
          if (action === 'rename-folder') {
            E.prompt('Rename Album:', ta.name, 'Rename Album').then(function(n) {
              if (n && n.trim())
                window.XenoSupabase.renameAlbum(ta.id, n.trim()).then(loadAlbums).catch(function(err) { E.alert('Error: ' + err.message, 'Rename Error'); });
            });
          } else if (action === 'delete-folder') {
            E.confirm('Delete album "' + ta.name + '"?', 'Delete Album', true).then(function(ok) {
              if (ok) {
                window.XenoSupabase.deleteAlbum(ta.id).then(function() {
                  if (currentAlbumId === ta.id) currentAlbumId = null;
                  loadAlbums();
                  loadMedia(currentAlbumId);
                }).catch(function(err) { E.alert('Error: ' + err.message, 'Delete Error'); });
              }
            });
          }
          albumCtx = null;
          if (D.mediaFolderCtx) D.mediaFolderCtx.style.display = 'none';
        });
      });
    }

    // ─── Dismiss context menus on outside click ─────────
    function dismissContextMenus(e) {
      if (D.mediaFolderCtx && D.mediaFolderCtx.style.display !== 'none') {
        if (!D.mediaFolderCtx.contains(e.target)) {
          D.mediaFolderCtx.style.display = 'none';
          albumCtx = null;
        }
      }
      if (D.mediaItemCtx && D.mediaItemCtx.style.display !== 'none') {
        if (!D.mediaItemCtx.contains(e.target)) {
          D.mediaItemCtx.style.display = 'none';
          mediaCtx = null;
        }
      }
      if (D.contextMenu && D.contextMenu.style.display !== 'none') {
        if (!D.contextMenu.contains(e.target)) {
          D.contextMenu.style.display = 'none';
        }
      }
      if (D.projectCtx && D.projectCtx.style.display !== 'none') {
        if (!D.projectCtx.contains(e.target)) {
          D.projectCtx.style.display = 'none';
        }
      }
    }
    document.addEventListener('click', dismissContextMenus);
    document.addEventListener('contextmenu', dismissContextMenus, true);

    // ─── Media Context Menu ────────────────────────────
    if (D.mediaItemCtx) {
      D.mediaItemCtx.querySelectorAll('.ctx-item').forEach(function(item) {
        item.addEventListener('click', function(e) {
          e.stopPropagation();
          if (!mediaCtx) return;
          var tm = mediaCtx;
          var action = this.getAttribute('data-action');
          if (action === 'rename-media') {
            E.prompt('Rename Media:', tm.filename, 'Rename Media').then(function(n) {
              if (n && n.trim())
                window.XenoSupabase.renameMedia(tm.id, n.trim()).then(function() { loadMedia(currentAlbumId); }).catch(function(err) { E.alert('Error: ' + err.message, 'Rename Error'); });
            });
          } else if (action === 'delete-media') {
            // Confirm with user before deleting media
            E.confirm('Delete "' + tm.filename + '"?', 'Delete Media', true).then(function(ok) {
              if (ok) {
                _mediaDirty = true;
                window.XenoSupabase.deleteMedia(tm.id).then(function() { loadMedia(currentAlbumId); }).catch(function(err) { E.alert('Error: ' + err.message, 'Delete Error'); });
              }
            });
          } else if (action === 'move-media') {
            openMoveModal();
          } else if (action === 'download-media') {
            var dlUrl = tm._blobUrl || tm.url;
            downloadFile(dlUrl, tm.filename);
          }
          if (action !== 'move-media') mediaCtx = null;
          if (D.mediaItemCtx) D.mediaItemCtx.style.display = 'none';
        });
      });
    }

    // ─── Move Media Modal ──────────────────────────────
    function openMoveModal() {
      if (!mediaCtx || !D.moveTargetAlbum || !D.moveMediaModal) return;
      window.XenoSupabase.fetchAlbums().then(function(albums) {
        D.moveTargetAlbum.innerHTML = '';
        if (mediaCtx.album_id !== null) {
          var root = document.createElement('option');
          root.value = ''; root.textContent = '📁 Root (No Album)';
          D.moveTargetAlbum.appendChild(root);
        }
        albums.forEach(function(a) {
          if (mediaCtx.album_id === a.id) return;
          var o = document.createElement('option');
          o.value = a.id; o.textContent = '📁 ' + a.name;
          D.moveTargetAlbum.appendChild(o);
        });
        D.moveMediaModal.style.display = 'flex';
      }).catch(function(err) { E.alert('Error: ' + err.message, 'Fetch Error'); });
    }

    function closeMoveModal() {
      if (D.moveMediaModal) D.moveMediaModal.style.display = 'none';
      mediaCtx = null;
    }

    if (D.btnCancelMove) D.btnCancelMove.addEventListener('click', closeMoveModal);
    if (D.btnCloseMoveModal) D.btnCloseMoveModal.addEventListener('click', closeMoveModal);
    if (D.btnConfirmMove) {
      D.btnConfirmMove.addEventListener('click', function() {
        if (!mediaCtx || !D.moveTargetAlbum) return;
        window.XenoSupabase.moveMedia(mediaCtx.id, D.moveTargetAlbum.value || null)
          .then(function() { closeMoveModal(); loadMedia(currentAlbumId); })
          .catch(function(err) { E.alert('Error: ' + err.message, 'Move Error'); });
      });
    }

    // ─── Action Bar ────────────────────────────────────
    if (D.btnAddSelected) {
      D.btnAddSelected.addEventListener('click', function() {
        if (selectedIds.size === 0) return;
        if (!S.projectSlug) {
          E.confirm('You need to create a project first. Create a new project now?', 'No Project', false).then(function(ok) {
            if (ok) {
              var slug = 'project_' + Date.now();
              var defaultData = {
                settings: {
                  title: 'New Tour', name: 'New Tour', mouseViewMode: 'drag',
                  autorotateEnabled: false, showScenes: true, autorotateSpeed: 0.03, autorotateInactivityDelay: 3000,
                  fullscreenButton: true, sceneListStyle: 'sidebar',
                  showMinimap: false, minimapPosition: 'bottom-left', showControls: true,
                  gyroscopeEnabled: false, vrEnabled: false,
                  defaultTransition: 'opacity', defaultTransitionDuration: 1000, defaultTransitionEasing: 'easeInOut',
                  branding: { logoUrl: null, accentColor: '#e62e5a', logoPosition: 'top-left' },
                  intro: { enabled: false, title: '', subtitle: '', buttonText: 'Enter Tour' }
                },
                scenes: [],
                floorplan: { enabled: false, imageUrl: '', width: 800, height: 600 }
              };
              window.XenoSupabase.saveTour(slug, defaultData).then(function() {
                window.location.href = window.location.pathname + '?project=' + slug;
              });
            }
          });
          return;
        }
        selectedIds.forEach(function(mid) {
          var m = selectedMap[mid];
          if (m) {
            if (m.type && m.type.startsWith('video/')) E.addVideoSceneFromUrl(m.id, m.filename);
            else E.addSceneFromUrl(m.id, m.filename);
          }
        });
        D.mediaModal.classList.remove('visible');
        _modalOpen = false;
        selectedIds.clear();
        selectedMap = {};
        lastIndex = null;
        syncSelection();
        E.debouncedSave();
      });
    }

    if (D.btnDeleteSelected) {
      D.btnDeleteSelected.addEventListener('click', function() {
        if (selectedIds.size === 0) return;
        E.confirm('Delete ' + selectedIds.size + ' items? This cannot be undone.', 'Batch Delete', true).then(function(ok) {
          if (!ok) return;
          var promises = [];
          selectedIds.forEach(function(mid) {
            var m = selectedMap[mid];
            if (m) promises.push(window.XenoSupabase.deleteMedia(m.id));
          });
          Promise.all(promises).then(function() {
            selectedIds.clear(); selectedMap = {}; lastIndex = null;
            _mediaDirty = true;
            loadMedia(currentAlbumId);
            showToast('Deleted ' + promises.length + ' items.');
          }).catch(function(err) { E.alert('Error: ' + err.message, 'Delete Error'); });
        });
      });
    }

    if (D.btnClearMediaSel) {
      D.btnClearMediaSel.addEventListener('click', function() {
        selectedIds.clear(); selectedMap = {}; lastIndex = null;
        syncSelection();
      });
    }

    // ─── v1 Legacy compat ──────────────────────────────
    var legacyBtn = document.getElementById('btn-create-album');
    if (legacyBtn) {
      legacyBtn.addEventListener('click', function() {
        E.prompt('Enter new album name:', '', 'New Album').then(function(n) {
          if (n) window.XenoSupabase.createAlbum(n).then(function() { loadAlbums(); showToast('Album created.'); }).catch(function(err) { E.alert('Error: ' + err.message, 'Create Error'); });
        });
      });
    }
  };

  // ─── Upload helper ─────────────────────────────────
  function handleFiles(files) {
    var uploadArea = document.getElementById('media-upload-area');
    if (!uploadArea) return;
    var total = files.length;
    var done = 0;
    var originalHtml = uploadArea.innerHTML;
    uploadArea.innerHTML = '<div class="upload-icon-wrap"><svg class="spin" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg></div><div class="upload-title">Uploading ' + done + ' / ' + total + '&hellip;</div><div class="upload-sub">Please wait while your files are processed.</div>';
    var promises = [];
    for (var i = 0; i < files.length; i++) {
      promises.push(window.XenoSupabase.uploadAndRecordMedia(files[i], currentAlbumId).then(function(r) {
        done++;
        var titleEl = uploadArea.querySelector('.upload-title');
        if (titleEl) titleEl.textContent = 'Uploading ' + done + ' / ' + total + '\u2026';
        return r;
      }));
    }
    Promise.all(promises).then(function() {
      uploadArea.innerHTML = originalHtml;
      _mediaDirty = true;
      loadMedia(currentAlbumId);
    }).catch(function(err) {
      E.alert('Error uploading: ' + err.message, 'Upload Error');
      uploadArea.innerHTML = originalHtml;
    });
  }

  // ─── Download helper ───────────────────────────────
  function downloadFile(url, filename) {
    fetch(url).then(function(r) { return r.blob(); }).then(function(blob) {
      var u = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = u; a.download = filename;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(u);
    }).catch(function(err) {
      console.warn('Blob download failed, opening new tab', err);
      window.open(url, '_blank');
    });
  }

  // ─── Toast ─────────────────────────────────────────
  function showToast(msg) {
    var t = document.querySelector('.xeno-toast');
    if (!t) { t = document.createElement('div'); t.className = 'xeno-toast'; document.body.appendChild(t); }
    t.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> ' + msg;
    t.classList.add('visible');
    if (t.timeoutId) clearTimeout(t.timeoutId);
    t.timeoutId = setTimeout(function() { t.classList.remove('visible'); }, 3000);
  }
})();
