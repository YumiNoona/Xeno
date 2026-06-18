(function() {
  'use strict';
  var E = window.XenoEditor;
  var D = E.dom;
  var currentProjectTour = null;

  E.initDashboard = function() {
    var searchInput = document.getElementById('project-search');
    var btnNewProject = document.getElementById('btn-new-project');
    var btnMediaDashboard = document.getElementById('btn-media-dashboard');

    if (searchInput) {
      searchInput.addEventListener('input', function() { loadDashboard(this.value); });
    }

    if (btnMediaDashboard) {
      btnMediaDashboard.addEventListener('click', function() {
        E.openMediaModal();
      });
    }

    if (btnNewProject) {
      btnNewProject.addEventListener('click', function() {
        E.prompt('Enter project name:', '', 'New Project').then(function(name) {
          if (name && name.trim() !== '') {
            var slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            if (!slug) slug = 'project-' + Date.now();
            var blankData = {
              settings: {
                title: name.trim(), name: name.trim(), mouseViewMode: 'drag',
                autorotateEnabled: false, showScenes: true, autorotateSpeed: 0.03, autorotateInactivityDelay: 3000,
                fullscreenButton: true, sceneListStyle: 'sidebar', layoutTheme: 'hamburger',
                showMinimap: false, minimapPosition: 'bottom-left', showControls: true,
                gyroscopeEnabled: false, vrEnabled: false,
                defaultTransition: 'opacity', defaultTransitionDuration: 1000, defaultTransitionEasing: 'easeInOut',
                branding: { logoUrl: null, accentColor: '#e62e5a', logoPosition: 'top-left' },
                intro: { enabled: false, title: '', subtitle: '', buttonText: 'Enter Tour' }
              },
              scenes: [],
              floorplan: { enabled: false, imageUrl: '', width: 800, height: 600 }
            };
            window.XenoSupabase.saveTour(slug, blankData).then(function() {
              window.location.search = '?project=' + encodeURIComponent(slug);
            });
          }
        });
      });
    }

    // ─── Import project ─────────────────────────────────
    var btnImport = document.getElementById('btn-import-project');
    var importInput = document.createElement('input');
    importInput.type = 'file';
    importInput.accept = '.xeno,.json';
    importInput.style.display = 'none';
    document.body.appendChild(importInput);

    if (btnImport) {
      btnImport.addEventListener('click', function() { importInput.click(); });
      importInput.addEventListener('change', function() {
        var file = this.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function() {
          try {
            var bundle = JSON.parse(reader.result);
            window.XenoSupabase.importProject(bundle).then(function(slug) {
              E.alert('Project imported successfully!', 'Import Success');
              loadDashboard();
            }).catch(function(err) {
              E.alert('Import failed: ' + err.message, 'Import Error');
            });
          } catch(e) {
            E.alert('Invalid project file: ' + e.message, 'Format Error');
          }
        };
        reader.readAsText(file);
        this.value = '';
      });
    }

    if (E.setupThemeToggle) E.setupThemeToggle();

    // ─── Project context menu handlers ──────────────────
    var projectCtx = document.getElementById('project-ctx');
    if (projectCtx) {
      projectCtx.querySelectorAll('.ctx-item').forEach(function(item) {
        item.addEventListener('click', function() {
          var tour = currentProjectTour;
          var action = this.getAttribute('data-action');
          projectCtx.style.display = 'none';
          if (!tour) return;
          var slug = tour.slug;
          var title = (tour.data && tour.data.settings && (tour.data.settings.name || tour.data.settings.title)) || slug;

          if (action === 'rename-project') {
            E.prompt('Rename project:', title, 'Rename Project').then(function(newName) {
              if (newName && newName.trim()) {
                if (!tour.data) tour.data = {};
                if (!tour.data.settings) tour.data.settings = {};
                tour.data.settings.name = newName.trim();
                tour.data.settings.title = newName.trim();
                window.XenoSupabase.saveTour(slug, tour.data).then(function() { loadDashboard(); });
              }
            });
          } else if (action === 'thumb-project') {
            E.state.mediaPickerCallback = function(url) {
              if (!tour.data) tour.data = {};
              if (!tour.data.settings) tour.data.settings = {};
              tour.data.settings.thumbnailUrl = url;
              window.XenoSupabase.saveTour(slug, tour.data).then(function() { loadDashboard(); });
            };
            E.openMediaModal();
          } else if (action === 'download-project') {
            // Flush live editor state before export so unsaved changes are included
            var doExport = function() {
              window.XenoSupabase.exportProject(slug).then(function(bundle) {
                var blob = new Blob([JSON.stringify(bundle)], { type: 'application/json' });
                var a = document.createElement('a');
                var oUrl = URL.createObjectURL(blob);
                a.href = oUrl;
                a.download = slug + '.xeno';
                a.click();
                setTimeout(function() { URL.revokeObjectURL(oUrl); }, 10000);
                showShareModal(slug);
              }).catch(function(err) {
                E.alert('Export failed: ' + err.message, 'Export Error');
              });
            };
            var S = E.state;
            if (S && S.projectSlug === slug && S.scenes && S.scenes.length && window.XenoSupabase) {
              // Sync live scenes into window.data, then persist immediately
              if (S.saveTimeout) clearTimeout(S.saveTimeout);
              window.data.scenes = S.scenes.map(function(sc) { return JSON.parse(JSON.stringify(sc.data)); });
              var saveData = JSON.parse(JSON.stringify(window.data));
              if (E.restoreMediaIds) E.restoreMediaIds(saveData);
              Promise.resolve(window.XenoSupabase.saveTour(slug, saveData)).then(function() {
                S._isDirty = false;
                doExport();
              }).catch(function() {
                // Save failed but still attempt export with whatever is persisted
                doExport();
              });
            } else {
              doExport();
            }
          } else if (action === 'delete-project') {
            E.confirm('Delete project "' + title + '"?', 'Delete Project', true).then(function(ok) {
              if (ok) {
                window.XenoSupabase.deleteTour(slug).then(function() {
                  // Also delete published blob if it exists
                  fetch('/api/delete?slug=' + encodeURIComponent(slug)).catch(function() {});
                  loadDashboard();
                }).catch(function(err) { E.alert('Failed: ' + err.message, 'Error'); });
              }
            });
          }
        });
      });
    }

    loadDashboard();
  };

  function showShareModal(slug, shareUrlOverride) {
    var modal = document.getElementById('share-modal');
    var shareWhatsApp = document.getElementById('share-whatsapp');
    var shareTelegram = document.getElementById('share-telegram');
    var shareWeTransfer = document.getElementById('share-wetransfer');
    var closeBtn = document.getElementById('btn-close-share');
    if (!modal) return;

    var msg = encodeURIComponent('Check out my 360\u00B0 virtual tour project: ' + slug);
    var fileMsg = encodeURIComponent('I created a 360\u00B0 virtual tour called "' + slug + '" with Xeno. Download the .xeno file and import it at https://xeno-tour.com to view or edit!');

    if (shareWhatsApp) shareWhatsApp.href = 'https://wa.me/?text=' + fileMsg;
    if (shareTelegram) shareTelegram.href = 'https://t.me/share/url?url=https://xeno-tour.com&text=' + msg;
    if (shareWeTransfer) shareWeTransfer.href = 'https://wetransfer.com/';

    var embedUrl = shareUrlOverride || (window.location.origin + '/t/' + slug);
    var embedCode = document.getElementById('share-embed-code');
    if (embedCode) embedCode.value = '<iframe src="' + embedUrl + '" width="100%" height="600" frameborder="0" allow="gyroscope; accelerometer; xr-spatial-tracking; fullscreen" allowfullscreen></iframe>';

    var btnCopyEmbed = document.getElementById('btn-copy-embed');
    if (btnCopyEmbed) {
      btnCopyEmbed.onclick = function() {
        if (embedCode) {
          embedCode.select();
          navigator.clipboard.writeText(embedCode.value).then(function() {
            btnCopyEmbed.textContent = 'Copied!';
            setTimeout(function() { btnCopyEmbed.textContent = 'Copy'; }, 2000);
          }).catch(function() {});
        }
      };
    }

    modal.style.display = 'flex';
    if (closeBtn) closeBtn.onclick = function() { modal.style.display = 'none'; };
    modal.onclick = function(e) { if (e.target === modal) modal.style.display = 'none'; };
  }
  window.showShareModal = showShareModal;

  function isMediaId(v) { return window.XenoEditor.isMediaId(v); }

  function resolveThumbUrl(firstScene, settings) {
    if (!firstScene && !settings) return Promise.resolve(null);
    var url = (settings && settings.thumbnailUrl) || (firstScene && firstScene.thumbnailUrl) || (firstScene && firstScene.mediaUrl);
    if (!url) return Promise.resolve(null);
    if (!isMediaId(url) || !window.XenoSupabase) return Promise.resolve(url);
    return window.XenoSupabase.resolveMediaId(url).then(function(b) { return b || url; });
  }

  var _placeholderSvg = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%239CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Crect x="3" y="3" width="18" height="18" rx="2" ry="2"/%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"/%3E%3Cpolyline points="21 15 16 10 5 21"/%3E%3C/svg%3E';

  function renderProjectGrid(tours, filterQuery) {
    var grid = document.getElementById('project-grid');
    var countEl = document.getElementById('project-count');
    if (countEl) countEl.textContent = tours.length;
    if (!grid) return;
    grid.innerHTML = '';

    tours.forEach(function(tour) {
      var firstScene = (tour.data && tour.data.scenes && tour.data.scenes[0]) || null;
      var sceneCount = (tour.data && tour.data.scenes && tour.data.scenes.length) || 0;
      var title = '';
      if (tour.data && tour.data.settings) title = tour.data.settings.name || tour.data.settings.title || '';
      title = title || tour.slug || 'Untitled Project';
      var projectThumb = (tour.data && tour.data.settings && tour.data.settings.thumbnailUrl) || null;
      var thumbUrl = projectThumb || (firstScene && (firstScene.thumbnailUrl || firstScene.mediaUrl)) || '';

      // Use non-media-ID URLs directly; media IDs get resolved in the deferred pass
      var thumbIsMediaId = thumbUrl && isMediaId(thumbUrl);
      var initialSrc = (thumbUrl && !thumbIsMediaId) ? thumbUrl : _placeholderSvg;

      var card = document.createElement('div');
      card.className = 'project-card';
      if (thumbIsMediaId) card.dataset.thumbId = thumbUrl;
      var published = (tour.data && tour.data.settings && tour.data.settings.published) || false;
      var statusText = published ? 'Public' : '';
      var dateStr = tour.created_at ? new Date(tour.created_at).toLocaleDateString() : '';
      var metaHtml = (statusText || dateStr)
        ? '<div class="project-card-meta">' +
            '<span class="project-card-status">' + statusText + '</span>' +
            '<span class="project-card-date">' + dateStr + '</span>' +
          '</div>'
        : '';
      card.innerHTML =
        '<div class="project-card-thumb-wrapper">' +
          '<img class="project-card-thumb" src="' + initialSrc + '" alt="Tour Thumbnail">' +
          '<div class="project-card-scenes-badge">' + sceneCount + ' Scene' + (sceneCount !== 1 ? 's' : '') + '</div>' +
        '</div>' +
        '<div class="project-card-info">' +
          '<h4 class="project-card-title">' + title + '</h4>' +
          metaHtml +
        '</div>' +
        '<div class="project-card-actions">' +
          '<button class="btn-delete-project" title="Delete Project"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>' +
        '</div>';

      // Fall back to placeholder SVG if the thumbnail image fails to load.
      // If it was a stale blob URL, try to recover via reverse-lookup.
      var thumbImg = card.querySelector('.project-card-thumb');
      if (thumbImg) {
        (function(capturedUrl, capturedCard) {
          thumbImg.onerror = function() {
            this.src = _placeholderSvg;
            this.onerror = null;
            // Attempt reverse-lookup from blob URL → media ID for deferred resolution
            if (capturedUrl && capturedUrl.indexOf('blob:') === 0 && window.XenoSupabase && window.XenoSupabase.getMediaIdByBlobUrl) {
              var mediaId = window.XenoSupabase.getMediaIdByBlobUrl(capturedUrl);
              if (mediaId) {
                capturedCard.dataset.thumbId = mediaId;
              }
            }
          };
        })(thumbUrl, card);
      }

      card.addEventListener('click', function() {
        window.location.search = '?project=' + encodeURIComponent(tour.slug);
      });

      var delBtn = card.querySelector('.btn-delete-project');
      delBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        E.confirm('Delete project "' + title + '"?', 'Delete Project', true).then(function(ok) {
          if (ok) {
            window.XenoSupabase.deleteTour(tour.slug).then(function() {
              loadDashboard(filterQuery);
            }).catch(function(err) {
              E.alert('Failed to delete project: ' + err.message, 'Delete Error');
            });
          }
        });
      });

      card.addEventListener('contextmenu', function(e) {
        e.preventDefault(); e.stopPropagation();
        currentProjectTour = tour;
        var ctx = document.getElementById('project-ctx');
        if (ctx) {
          ctx.style.display = 'block';
          ctx.style.left = e.clientX + 'px';
          ctx.style.top = e.clientY + 'px';
        }
      });

      grid.appendChild(card);
    });

    // Deferred pass: resolve media_xxx IDs to blob URLs once the browser is idle
    var _scheduleIdle = window.requestIdleCallback
      ? function(fn) { return window.requestIdleCallback(fn, { timeout: 500 }); }
      : function(fn) { return setTimeout(fn, 150); };
    _scheduleIdle(function() {
      var cards = grid.querySelectorAll('.project-card[data-thumb-id]');
      cards.forEach(function(card) {
        var id = card.dataset.thumbId;
        if (!id || !window.XenoSupabase) return;
        delete card.dataset.thumbId;
        window.XenoSupabase.resolveMediaId(id).then(function(b) {
          if (b) { var img = card.querySelector('.project-card-thumb'); if (img) img.src = b; }
        }).catch(function() {});
      });
    });
  }

  function loadDashboard(filterQuery) {
    if (!window.XenoSupabase) return;
    if (window.XenoSupabase.clearBlobCache) {
      window.XenoSupabase.clearBlobCache();
    }
    var grid = document.getElementById('project-grid');
    if (grid) {
      grid.innerHTML = '<div class="dashboard-loading"><svg class="spin" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Searching for tours...</div>';
    }
    window.XenoSupabase.fetchTours().then(function(tours) {
      if (filterQuery) {
        var q = filterQuery.trim().toLowerCase();
        tours = tours.filter(function(t) {
          var title = '';
          if (t.data && t.data.settings) title = t.data.settings.name || t.data.settings.title || '';
          title = title || t.slug || '';
          return title.toLowerCase().indexOf(q) !== -1;
        });
      }
      
      if (tours.length === 0) {
        if (grid) {
          grid.innerHTML = '<div class="dashboard-empty">' +
            '<div class="empty-icon">' + window.xIcon('folder', 48) + '</div>' +
            '<h3>No tours found</h3>' +
            '<p>' + (filterQuery ? 'No tours match your search query.' : 'Get started by creating your first 360\u00B0 virtual tour.') + '</p>' +
            (filterQuery ? '' : '<button class="btn btn-new-project" onclick="document.getElementById(\'btn-new-project\').click()">+ Create New Project</button>') +
            '</div>';
        }
        var countEl = document.getElementById('project-count');
        if (countEl) countEl.textContent = '0';
        return;
      }
      
      renderProjectGrid(tours, filterQuery);
    }).catch(function(err) {
      if (grid) {
        grid.innerHTML = '<div class="dashboard-error">Failed to load projects: ' + err.message + '</div>';
      }
    });
  }

  // ─── Legacy initDashboard (for old editor.html) ──────────
  // The old initDashboard in editor.js also had project grid rendering.
  // This is a compatibility hook; the new flow never calls it.
  window.initDashboard = E.initDashboard;
})();
