(function() {
  'use strict';
  var E = window.XenoEditor;
  var S = E.state;
  var D = E.dom;

  E.setupExport = function() {
    if (E._exportSetupDone) return; E._exportSetupDone = true;
    // ─── Publish to web ──────────────────────────────────
    var btnPublish = document.getElementById('btn-publish');
    if (btnPublish && window.XenoSupabase) {
      var _publishInProgress = false;
      btnPublish.addEventListener('click', function() {
        if (!S.projectSlug) { alert('No project to publish.'); return; }
        if (_publishInProgress) return;
        _publishInProgress = true;
        // Custom expiry picker modal
        showPublishExpiry(function(expiryValue) {
          doPublish(expiryValue);
        }, function() { _publishInProgress = false; });
      });

      function doPublish(expiryValue) {
        var pubBtn = document.getElementById('btn-publish');
        var origText = pubBtn.innerHTML;
        pubBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Publishing...';
        pubBtn.disabled = true;

        window.XenoSupabase.exportProject(S.projectSlug).then(function(bundle) {
          var controller = new AbortController();
          var timeout = setTimeout(function() { controller.abort(); }, 30000);
          return fetch('/api/publish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ project: bundle, expiry: expiryValue }),
            signal: controller.signal
          }).then(function(r) {
            clearTimeout(timeout);
            if (!r.ok) throw new Error('Publish failed');
            return r.json();
          });
        }).then(function(result) {
          var shareUrl = result.shareUrl || ('https://xeno.venusapp.in/t/' + result.slug);
          // Save view count + published flag to project settings
          if (result.views !== undefined) {
            if (!window.data.settings) window.data.settings = {};
            window.data.settings.views = result.views;
          }
          window.data.settings.published = true;
          window.data.settings.publishedAt = new Date().toISOString();
          if (window.showShareModal) {
            window.showShareModal(result.slug, shareUrl);
          } else {
            prompt('Share this link:', shareUrl);
            if (navigator.clipboard) navigator.clipboard.writeText(shareUrl).catch(function() {});
          }
          setTimeout(function() { if (window.showDonatePopup) window.showDonatePopup(); }, 800);
        }).catch(function(err) {
          if (err && err.name === 'AbortError') {
            alert('Publish timed out after 30 seconds. Please check your connection and try again.');
          } else {
            // Fallback: show inline modal instead of browser prompt()
            var fbUrl = window.location.origin + '/preview.html?project=' + S.projectSlug;
            var fbOverlay = document.createElement('div');
            fbOverlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:10000;display:flex;align-items:center;justify-content:center;';
            fbOverlay.innerHTML = '<div style="background:var(--bg-panel);border:3px solid var(--border);padding:24px;max-width:440px;width:90%;text-align:center;">' +
              '<p style="color:var(--text-primary);margin-bottom:16px;">Share this link:</p>' +
              '<input value="' + fbUrl + '" readonly style="width:100%;padding:8px;background:#0a0a0a;border:2px solid var(--border);color:var(--text-primary);font-family:monospace;font-size:12px;margin-bottom:12px;text-align:center;" onclick="this.select()">' +
              '<button style="background:var(--accent);color:#fff;border:none;padding:10px 24px;cursor:pointer;font-weight:bold;text-transform:uppercase;" onclick="navigator.clipboard.writeText(\'' + fbUrl + '\');this.textContent=\'Copied!\';setTimeout(function(){document.body.removeChild(document.querySelector(\'[data-pub-fallback]\'))},600);">Copy & Close</button>' +
              '</div>';
            fbOverlay.setAttribute('data-pub-fallback', '1');
            fbOverlay.addEventListener('click', function(e) { if (e.target === fbOverlay) document.body.removeChild(fbOverlay); });
            document.body.appendChild(fbOverlay);
        }).finally(function() {
          pubBtn.innerHTML = origText;
          pubBtn.disabled = false;
          _publishInProgress = false;
        });
      }
    }

    function showPublishExpiry(callback, onCancel) {
      var overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:10000;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);';
      var modal = document.createElement('div');
      modal.style.cssText = 'background:var(--bg-panel);border:3px solid var(--border);max-width:440px;width:90%;padding:0;';
      modal.innerHTML =
        '<div style="display:flex;justify-content:center;align-items:center;padding:18px 22px;border-bottom:2px solid var(--border);position:relative;">' +
          '<h3 style="text-transform:uppercase;letter-spacing:0.06em;margin:0;color:var(--text-primary);font-size:var(--type-lg);">// PUBLISH_TOUR</h3>' +
        '</div>' +
        '<div style="padding:24px 22px;">' +
          '<p style="color:var(--text-muted);font-size:var(--type-sm);margin-bottom:20px;text-align:center;">$ expiry --set duration</p>' +
          '<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:24px;">' +
            '<label class="pub-radio" style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:var(--bg-raised);border:2px solid var(--border);cursor:pointer;transition:border-color 0.15s;">' +
              '<input type="radio" name="pub-expiry" value="1d" style="accent-color:var(--accent);width:16px;height:16px;">' +
              '<span style="color:var(--text-primary);font-size:var(--type-sm);">1 Day</span>' +
            '</label>' +
            '<label class="pub-radio" style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:var(--bg-raised);border:2px solid var(--border);cursor:pointer;transition:border-color 0.15s;">' +
              '<input type="radio" name="pub-expiry" value="7d" style="accent-color:var(--accent);width:16px;height:16px;">' +
              '<span style="color:var(--text-primary);font-size:var(--type-sm);">7 Days</span>' +
            '</label>' +
            '<label class="pub-radio" style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:var(--bg-raised);border:2px solid var(--border);cursor:pointer;transition:border-color 0.15s;">' +
              '<input type="radio" name="pub-expiry" value="forever" checked style="accent-color:var(--accent);width:16px;height:16px;">' +
              '<span style="color:var(--text-primary);font-size:var(--type-sm);">Forever</span>' +
            '</label>' +
          '</div>' +
          '<div style="display:flex;gap:8px;">' +
            '<button id="pub-cancel-btn" style="flex:1;display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:10px 18px;border:3px solid var(--border);background:transparent;color:var(--text-secondary);font-family:var(--font);font-size:var(--type-sm);font-weight:var(--weight-bold);cursor:pointer;text-transform:uppercase;letter-spacing:0.06em;">Cancel</button>' +
            '<button id="pub-go-btn" class="pub-publish-btn" style="flex:1;display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:10px 18px;border:3px solid var(--accent-hover);background:var(--accent);font-family:var(--font);font-size:var(--type-sm);font-weight:var(--weight-bold);cursor:pointer;text-transform:uppercase;letter-spacing:0.06em;">Publish</button>' +
          '</div>' +
        '</div>';
      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      var pubGoBtn = modal.querySelector('#pub-go-btn');
      function setPubBtnColor() {
        var theme = document.documentElement.getAttribute('data-theme') || 'dark';
        pubGoBtn.style.color = theme === 'light' ? '#000' : '#fff';
      }
      setPubBtnColor();

      var labels = modal.querySelectorAll('.pub-radio');
      labels.forEach(function(l) {
        l.addEventListener('mouseenter', function() { this.style.borderColor = 'var(--accent)'; });
        l.addEventListener('mouseleave', function() {
          var radio = this.querySelector('input[type="radio"]');
          this.style.borderColor = radio && radio.checked ? 'var(--accent)' : 'var(--border)';
        });
        l.addEventListener('click', function() {
          var radio = this.querySelector('input[type="radio"]');
          radio.checked = true;
          labels.forEach(function(x) { x.style.borderColor = 'var(--border)'; });
          this.style.borderColor = 'var(--accent)';
        });
      });

      // Highlight default selected
      var defaultRadio = modal.querySelector('input[value="forever"]');
      if (defaultRadio && defaultRadio.parentElement) defaultRadio.parentElement.style.borderColor = 'var(--accent)';

      modal.querySelector('#pub-cancel-btn').addEventListener('click', function() {
        document.body.removeChild(overlay);
        if (onCancel) onCancel();
      });
      modal.querySelector('#pub-go-btn').addEventListener('click', function() {
        var checked = modal.querySelector('input[name="pub-expiry"]:checked');
        var value = checked ? checked.value : 'forever';
        document.body.removeChild(overlay);
        callback(value);
      });
      overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
          document.body.removeChild(overlay);
          if (onCancel) onCancel();
        }
      });
    }

    var btnExport = document.getElementById('btn-export');
    if (!btnExport) return;

    btnExport.addEventListener('click', function() {
      if (!window.JSZip) { alert('JSZip library is not loaded.'); return; }

      var exportBtn = this;
      var originalText = exportBtn.innerHTML;
      var mediaFailures = 0;
      var bundleFailures = 0;
      var unresolved = [];
      exportBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Exporting...';
      exportBtn.disabled = true;

      var zip = new window.JSZip();
      var baseUrl = window.location.href.split('?')[0].replace(/[^/]*$/, '');
      var absUrl = function(path) { return baseUrl + path; };

      // js/engine/xeno.js IS the compiled Marzipano bundle (renamed from marzipano.js)
      var filesToBundle = [
        'css/tokens.css', 'css/viewer/layout.css',
        'css/viewer/components-controls.css', 'css/viewer/components-themes.css', 'css/viewer/components-overlays.css',
        'css/editor/buttons.css',
        'css/hotspots/types-standard.css', 'css/hotspots/types-content.css', 'css/hotspots/animations.css', 'css/hotspots/dots.css',
        'css/lib/minimap.css', 'css/lib/hint.css',
        'js/lib/screenfull.js', 'js/lib/webvr-polyfill.js', 'js/engine/xeno.js',
        'js/engine/transitions.js', 'js/engine/VideoAsset.js', 'js/engine/DeviceOrientation.js',
        'js/engine/colorEffects.js', 'js/engine/homography.js', 'js/hotspots/HotspotFactory.js',
        'js/hotspots/Builders-Nav.js', 'js/hotspots/Builders-Content.js', 'js/hotspots/Builders-Content-adv.js',
        'js/ui/Minimap.js', 'js/ui/SceneList.js', 'js/vr/XenoVR.js',
        'js/viewer.js'
      ];

      var imagesToBundle = [

        'public/logo.ico', 'public/logo-16x16.png', 'public/logo-32x32.png'
      ];

      // Pre-check favicons — if missing, embed an inline SVG fallback
      var faviconPromises = ['public/logo.ico'].map(function(fav) {
        return fetch(absUrl(fav), { method: 'HEAD' }).then(function(r) {
          if (!r.ok) {
            bundleFailures++;
            // Provide inline SVG favicon as ZIP fallback
            zip.file(fav, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#e11d48"/><text x="16" y="23" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="22" fill="#fff">X</text></svg>');
          }
        }).catch(function() {});
      });

      // Build media ID → original filename map from localStorage
      var mediaRecords = JSON.parse(localStorage.getItem('xeno_media') || '[]');
      var mediaMap = {};
      mediaRecords.forEach(function(r) { mediaMap[r.id] = r; });

      var usedNames = {};
      var usedMedia = {}; // Track already-written zip paths to prevent double-write

      function uniqueName(name) {
        if (!usedNames[name]) { usedNames[name] = true; return name; }
        var base = name.replace(/\.[^.]+$/, '');
        var ext = name.indexOf('.') !== -1 ? name.slice(name.lastIndexOf('.')) : '';
        for (var i = 1; i < 100; i++) {
          var c = base + '_' + i + ext;
          if (!usedNames[c]) { usedNames[c] = true; return c; }
        }
        return name;
      }

      // Sync live editor state into window.data before export
      if (S.scenes && S.scenes.length) window.data.scenes = S.scenes.map(function(s) { return JSON.parse(JSON.stringify(s.data)); });
      var exportedData = JSON.parse(JSON.stringify(window.data));
      if (!exportedData.settings) exportedData.settings = {};
      exportedData.settings.layoutTheme = (window.data.settings && window.data.settings.layoutTheme) || 'hamburger';
      var mediaPromises = [];

      function extFromMime(mime) {
        var map = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp',
          'video/mp4': 'mp4', 'video/webm': 'webm', 'video/ogg': 'ogv' };
        return map[mime] || 'bin';
      }

      function getOriginalName(mediaId, fallback) {
        var rec = mediaMap[mediaId];
        if (rec && rec.filename) return rec.filename;
        // Cross-reference Supabase if localStorage meta is stale
        if (window.XenoSupabase && window.XenoSupabase.getMediaRecord) {
          var supRec = window.XenoSupabase.getMediaRecord(mediaId);
          if (supRec && supRec.filename) return supRec.filename;
        }
        return fallback;
      }

      function resolveUrl(url) {
        return url && url.indexOf('blob:') === 0
          ? Promise.resolve(url)
          : url && url.indexOf('media_') === 0 && window.XenoSupabase
            ? window.XenoSupabase.resolveMediaId(url).then(function(b) { return b || null; })
            : Promise.resolve(url);
      }

      function bundleHotspotMedia(hotspots, sceneId) {
        (hotspots || []).forEach(function(hs, idx) {
          var src = hs.content && hs.content.src;
          if (!src || (src.indexOf('blob:') !== 0 && src.indexOf('media_') !== 0)) return;
          var p = resolveUrl(src).then(function(fetchUrl) {
            return fetch(fetchUrl).then(function(res) {
              if (!res.ok) throw new Error('Failed to fetch hotspot media');
              return res.blob();
            }).then(function(blob) {
              var ext = extFromMime(blob.type) || 'bin';
              var orig = src.indexOf('media_') === 0 ? getOriginalName(src, null) : null;
              var name = uniqueName(orig || ('hs_' + sceneId + '_' + idx + '.' + ext));
              var path = 'media/' + name;
              zip.file(path, blob);
              hs.content.src = path;
            });
          }).catch(function(err) {
            mediaFailures++;
            console.warn('Could not bundle hotspot media for scene ' + sceneId, err);
          });
          mediaPromises.push(p);
        });
      }

      // bundleHotspotAudio — called for all four hotspot arrays (hotspots, linkHotspots, infoHotspots, mediaHotspots)
      function bundleHotspotAudio(hotspots, field, sceneId) {
        (hotspots || []).forEach(function(hs, idx) {
          var src = hs[field];
          if (!src || (src.indexOf('blob:') !== 0 && src.indexOf('media_') !== 0)) return;
          var p = resolveUrl(src).then(function(fetchUrl) {
            return fetch(fetchUrl).then(function(res) {
              if (!res.ok) throw new Error('Failed to fetch audio');
              return res.blob();
            }).then(function(blob) {
              var ext = extFromMime(blob.type) || 'mp3';
              var orig = src.indexOf('media_') === 0 ? getOriginalName(src, null) : null;
              var name = uniqueName(orig || ('audio_' + sceneId + '_' + idx + '.' + ext));
              var path = 'media/' + name;
              zip.file(path, blob);
              hs[field] = path;
            });
          }).catch(function(err) {
            mediaFailures++;
            console.warn('Could not bundle audio for scene ' + sceneId, err);
            hs[field] = null;
          });
          mediaPromises.push(p);
        });
      }

      function bundleSceneMedia(sceneData) {
        if (!sceneData.mediaUrl) return Promise.resolve();
        var origUrl = sceneData.mediaUrl;
        var p = resolveUrl(origUrl).then(function(fetchUrl) {
          if (!fetchUrl) throw new Error('No blob found for ' + sceneData.name);
          return fetch(fetchUrl).then(function(res) {
            if (!res.ok) throw new Error('Failed to fetch ' + sceneData.name);
            return res.blob();
          }).then(function(blob) {
            var ext = extFromMime(blob.type) || 'jpg';
            var mediaId = origUrl.indexOf('media_') === 0 ? origUrl : sceneData._mediaId;
            var orig = mediaId ? getOriginalName(mediaId, null) : null;
            var name = uniqueName(orig || ('scene_' + sceneData.id + '.' + ext));
            var path = 'media/' + name;
            zip.file(path, blob);
            sceneData.mediaUrl = path;
            if (sceneData.thumbnailUrl && (sceneData.thumbnailUrl.indexOf('blob:') === 0 || sceneData.thumbnailUrl === origUrl || sceneData.thumbnailUrl === mediaId)) {
              sceneData.thumbnailUrl = path;
            } else if (sceneData.thumbnailUrl && sceneData.thumbnailUrl.indexOf('media_') === 0) {
              sceneData.thumbnailUrl = path;
            }
          });
        }).catch(function(err) {
          mediaFailures++;
          console.warn('Could not bundle media for scene ' + sceneData.name, err);
        });
        mediaPromises.push(p);
        return p;
      }

      function bundleHotspotCustomIcons(hotspots, sceneId) {
        (hotspots || []).forEach(function(hs, idx) {
          var src = hs.customIconUrl;
          if (!src || (src.indexOf('blob:') !== 0 && src.indexOf('media_') !== 0)) return;
          var p = resolveUrl(src).then(function(fetchUrl) {
            if (!fetchUrl) throw new Error('No blob found for custom icon');
            return fetch(fetchUrl).then(function(res) {
              if (!res.ok) throw new Error('Failed to fetch custom icon');
              return res.blob();
            }).then(function(blob) {
              var ext = extFromMime(blob.type) || 'png';
              var orig = src.indexOf('media_') === 0 ? getOriginalName(src, null) : null;
              var name = uniqueName(orig || ('icon_' + sceneId + '_' + idx + '.' + ext));
              zip.file('media/' + name, blob);
              hs.customIconUrl = 'media/' + name;
            });
          }).catch(function(err) {
            mediaFailures++;
            console.warn('Could not bundle custom icon for scene ' + sceneId, err);
          });
          mediaPromises.push(p);
        });
      }

      function bundleSceneThumbnail(sceneData, depPromise, origMediaUrl) {
        var p = (depPromise || Promise.resolve()).then(function() {
          var tUrl = sceneData.thumbnailUrl;
          if (!tUrl || tUrl === origMediaUrl || (tUrl.indexOf('blob:') !== 0 && tUrl.indexOf('media_') !== 0)) return;
          return resolveUrl(tUrl).then(function(fetchUrl) {
            if (!fetchUrl) throw new Error('No blob found for thumbnail');
            return fetch(fetchUrl).then(function(res) {
              if (!res.ok) throw new Error('Failed to fetch thumbnail');
              return res.blob();
            }).then(function(blob) {
              var ext = extFromMime(blob.type) || 'jpg';
              var mediaId = tUrl.indexOf('media_') === 0 ? tUrl : null;
              var orig = mediaId ? getOriginalName(mediaId, null) : null;
              var name = uniqueName(orig || ('thumb_' + sceneData.id + '.' + ext));
              var path = 'media/' + name;
              if (!usedMedia[path]) { usedMedia[path] = true; zip.file(path, blob); }
              sceneData.thumbnailUrl = path;
            });
          }).catch(function(err) {
            mediaFailures++;
            console.warn('Could not bundle thumbnail for scene ' + sceneData.name, err);
            sceneData.thumbnailUrl = null;
          });
        });
        mediaPromises.push(p);
      }

      exportedData.scenes.forEach(function(sceneData) {
        var origMediaUrl = sceneData.mediaUrl;
        var mediaPromise = bundleSceneMedia(sceneData);
        bundleSceneThumbnail(sceneData, mediaPromise, origMediaUrl);
        bundleHotspotMedia(sceneData.hotspots, sceneData.id);
        bundleHotspotMedia(sceneData.linkHotspots, sceneData.id);
        bundleHotspotMedia(sceneData.infoHotspots, sceneData.id);
        bundleHotspotMedia(sceneData.mediaHotspots, sceneData.id);
        // Scan all four hotspot arrays for narrator/ambient audio
        var _allHS = [sceneData.hotspots, sceneData.linkHotspots, sceneData.infoHotspots, sceneData.mediaHotspots];
        _allHS.forEach(function(arr) { bundleHotspotAudio(arr, 'narratorAudio', sceneData.id); });
        _allHS.forEach(function(arr) { bundleHotspotAudio(arr, 'ambientAudio', sceneData.id); });
        bundleHotspotCustomIcons(sceneData.hotspots, sceneData.id);
        bundleHotspotCustomIcons(sceneData.linkHotspots, sceneData.id);
        bundleHotspotCustomIcons(sceneData.infoHotspots, sceneData.id);
        bundleHotspotCustomIcons(sceneData.mediaHotspots, sceneData.id);
      });

      // Bundle floorplan image if set
      if (exportedData.floorplan && exportedData.floorplan.imageUrl) {
        var fpSrc = exportedData.floorplan.imageUrl;
        if (fpSrc.indexOf('blob:') === 0 || fpSrc.indexOf('media_') === 0) {
          var fp = resolveUrl(fpSrc).then(function(fetchUrl) {
            if (!fetchUrl) return;
            return fetch(fetchUrl).then(function(res) {
              if (!res.ok) throw new Error('Failed to fetch floorplan');
              return res.blob();
            }).then(function(blob) {
              var ext = extFromMime(blob.type) || 'png';
              var name = uniqueName('floorplan.' + ext);
              var path = 'media/' + name;
              zip.file(path, blob);
              exportedData.floorplan.imageUrl = path;
            });
          }).catch(function(err) {
            mediaFailures++;
            console.warn('Could not bundle floorplan image', err);
            exportedData.floorplan.imageUrl = null;
          });
          mediaPromises.push(fp);
        }
      }

      var readme =
        '------------THANK YOU FOR CHOOSING-------------\n' +
        '----------------XENO 360\u00B0 TOUR----------------\n' +
        '\n' +
        'Thank you for choosing Xeno 360\u00B0 Tour.\n' +
        '\n' +
        'This package contains your exported virtual tour and everything required\n' +
        'to run it locally on your device.\n' +
        '\n' +
        '--------------VIEWING YOUR TOUR---------------\n' +
        '\n' +
        'Windows\n' +
        '\u2022 Double-click run.bat\n' +
        '\n' +
        'macOS / Linux\n' +
        '\u2022 Double-click run.sh\n' +
        '\u2022 Or run: bash run.sh\n' +
        '\n' +
        'The launch script will automatically:\n' +
        '\n' +
        '\u2022 Detect Python or Node.js on your system\n' +
        '\u2022 Start a local web server\n' +
        '\u2022 Open the tour in your default browser\n' +
        '\n' +
        'If neither Python nor Node.js is installed, you\u2019ll be guided through\n' +
        'the installation process with minimal setup required.\n' +
        '\n' +
        '-----------------LOCAL ACCESS-----------------\n' +
        '\n' +
        'Once started, your tour will be available at:\n' +
        '\n' +
        'http://localhost:8080\n' +
        '\n' +
        'Note: The exported tour runs independently from the Xeno editor\n' +
        'environment.\n' +
        '\n' +
        '----------------MANUAL STARTUP----------------\n' +
        '\n' +
        'If the launcher script does not work, open a terminal in this folder\n' +
        'and run:\n' +
        '\n' +
        'python -m http.server 8080\n' +
        '\n' +
        'Then open:\n' +
        '\n' +
        'http://localhost:8080\n' +
        '\n' +
        '---\n' +
        '\n' +
        'Made with \u2665 by Veil\n';
      zip.file('README.txt', readme);

      var batContent =
        '@echo off\r\n' +
        'setlocal enabledelayedexpansion\r\n' +
        'title Xeno Tour\r\n' +
        'set PORT=8080\r\n' +
        '\r\n' +
        'python --version >nul 2>&1\r\n' +
        'if !errorlevel! equ 0 (\r\n' +
        '  start http://localhost:%PORT%\r\n' +
        '  python -m http.server %PORT%\r\n' +
        '  exit /b\r\n' +
        ')\r\n' +
        '\r\n' +
        'node --version >nul 2>&1\r\n' +
        'if !errorlevel! equ 0 (\r\n' +
        '  start http://localhost:%PORT%\r\n' +
        '  npx serve -p %PORT% -s\r\n' +
        '  exit /b\r\n' +
        ')\r\n' +
        '\r\n' +
        'powershell -NoProfile -ExecutionPolicy Bypass -Command "& {$w=New-Object -ComObject WScript.Shell;$ask=$w.Popup(\'Xeno Tour needs Python or Node.js.\'+[char]10+\'Which one do you want to install?\',0,\'Xeno Tour\',3+32);if($ask -eq 6){$w.Popup(\'Downloading Python...\',1,\'Xeno Tour\',0+64);try{$wc=New-Object System.Net.WebClient;$py=Join-Path $env:TEMP \'python-installer.exe\';$wc.DownloadFile(\'https://www.python.org/ftp/python/3.13.3/python-3.13.3-amd64.exe\',$py);Start-Process -Wait -FilePath $py -ArgumentList \'/quiet InstallAllUsers=1 PrependPath=1\';Start-Process cmd -ArgumentList \'/c start http://localhost:%PORT% && python -m http.server %PORT%\';$w.Popup(\'Python installed! Tour starting in new window.\',0,\'Xeno Tour\',0+64)}catch{$w.Popup(\'Failed to install Python.\',0,\'Xeno Tour\',0+16)}}elseif($ask -eq 7){$w.Popup(\'Downloading Node.js...\',1,\'Xeno Tour\',0+64);try{$wc=New-Object System.Net.WebClient;$nj=Join-Path $env:TEMP \'node-installer.msi\';$wc.DownloadFile(\'https://nodejs.org/dist/v22.14.0/node-v22.14.0-x64.msi\',$nj);Start-Process -Wait -FilePath $nj -ArgumentList \'/quiet\';Start-Process cmd -ArgumentList \'/c start http://localhost:%PORT% && npx serve -p %PORT% -s\';$w.Popup(\'Node.js installed! Tour starting in new window.\',0,\'Xeno Tour\',0+64)}catch{$w.Popup(\'Failed to install Node.js.\',0,\'Xeno Tour\',0+16)}}else{$w.Popup(\'Please install Python or Node.js manually and run this script again.\',0,\'Xeno Tour\',0+48)}}"\r\n';
      zip.file('run.bat', batContent);

      var shContent =
        '#!/bin/bash\n' +
        'PORT=8080\n' +
        '\n' +
        'open_url() {\n' +
        '  xdg-open "$1" 2>/dev/null || open "$1" 2>/dev/null || true\n' +
        '}\n' +
        '\n' +
        '# --- Check for Python ---\n' +
        'if command -v python3 &>/dev/null; then\n' +
        '  open_url "http://localhost:$PORT"\n' +
        '  python3 -m http.server $PORT\n' +
        '  exit 0\n' +
        'fi\n' +
        'if command -v python &>/dev/null; then\n' +
        '  open_url "http://localhost:$PORT"\n' +
        '  python -m http.server $PORT\n' +
        '  exit 0\n' +
        'fi\n' +
        '\n' +
        '# --- Check for Node.js ---\n' +
        'if command -v node &>/dev/null; then\n' +
        '  open_url "http://localhost:$PORT"\n' +
        '  npx serve -p $PORT -s\n' +
        '  exit 0\n' +
        'fi\n' +
        '\n' +
        '# --- macOS GUI ---\n' +
        'if [ "$(uname)" = "Darwin" ]; then\n' +
        '  ans=$(osascript -e ' + "'" + 'button returned of (display dialog "Xeno Tour needs Python or Node.js." + (ASCII character 10) + "Select one to download and install:" buttons {"Cancel","Node.js","Python"} default button "Python" with icon note)' + "'" + ' 2>/dev/null)\n' +
        '  if [ "$ans" = "Python" ]; then\n' +
        '    if command -v brew &>/dev/null; then\n' +
        '      brew install python && open_url "http://localhost:$PORT" && python3 -m http.server $PORT && exit 0\n' +
        '    fi\n' +
        '    open_url "https://www.python.org/downloads/"\n' +
        '    osascript -e ' + "'" + 'display dialog "Python website opened. Download and install Python, then run this script again." buttons {"OK"} default button "OK" with icon note' + "'" + ' 2>/dev/null\n' +
        '    exit 1\n' +
        '  elif [ "$ans" = "Node.js" ]; then\n' +
        '    if command -v brew &>/dev/null; then\n' +
        '      brew install node && open_url "http://localhost:$PORT" && npx serve -p $PORT -s && exit 0\n' +
        '    fi\n' +
        '    open_url "https://nodejs.org/"\n' +
        '    osascript -e ' + "'" + 'display dialog "Node.js website opened. Download and install Node.js, then run this script again." buttons {"OK"} default button "OK" with icon note' + "'" + ' 2>/dev/null\n' +
        '    exit 1\n' +
        '  else\n' +
        '    osascript -e ' + "'" + 'display dialog "Please install Python or Node.js to run this tour." buttons {"OK"} default button "OK" with icon stop' + "'" + ' 2>/dev/null\n' +
        '    exit 1\n' +
        '  fi\n' +
        'fi\n' +
        '\n' +
        '# --- Linux GUI (zenity) ---\n' +
        'if command -v zenity &>/dev/null; then\n' +
        '  ans=$(zenity --list --title="Xeno Tour" --text="Select what to install:" --radiolist --column="" --column="Option" TRUE "Python" FALSE "Node.js" --height=200 2>/dev/null)\n' +
        '  if [ "$ans" = "Python" ]; then\n' +
        '    if command -v apt &>/dev/null; then\n' +
        '      sudo apt update -qq && sudo apt install -y -qq python3 && open_url "http://localhost:$PORT" && python3 -m http.server $PORT && exit 0\n' +
        '    elif command -v dnf &>/dev/null; then\n' +
        '      sudo dnf install -y -q python3 && open_url "http://localhost:$PORT" && python3 -m http.server $PORT && exit 0\n' +
        '    else\n' +
        '      zenity --error --text="No supported package manager found.\\nInstall Python from python.org" 2>/dev/null\n' +
        '      exit 1\n' +
        '    fi\n' +
        '  elif [ "$ans" = "Node.js" ]; then\n' +
        '    if command -v apt &>/dev/null; then\n' +
        '      sudo apt update -qq && sudo apt install -y -qq nodejs npm && open_url "http://localhost:$PORT" && npx serve -p $PORT -s && exit 0\n' +
        '    elif command -v dnf &>/dev/null; then\n' +
        '      sudo dnf install -y -q nodejs && open_url "http://localhost:$PORT" && npx serve -p $PORT -s && exit 0\n' +
        '    else\n' +
        '      zenity --error --text="No supported package manager found.\\nInstall Node.js from nodejs.org" 2>/dev/null\n' +
        '      exit 1\n' +
        '    fi\n' +
        '  else\n' +
        '    zenity --info --text="Please install Python or Node.js to run this tour." 2>/dev/null\n' +
        '    exit 1\n' +
        '  fi\n' +
        'fi\n' +
        '\n' +
        '# --- Terminal fallback ---\n' +
        'echo ""\n' +
        'echo "  Xeno Tour"\n' +
        'echo "  ----------"\n' +
        'echo "  Python or Node.js is required to run the tour."\n' +
        'echo "  Install one and run this script again."\n' +
        'echo "  https://www.python.org/downloads/"\n' +
        'echo "  https://nodejs.org/"\n' +
        'echo ""\n';
      zip.file('run.sh', shContent);

      var fetchPromises = filesToBundle.map(function(path) {
        return fetch(absUrl(path))
          .then(function(res) { if (!res.ok) throw new Error('Failed to fetch ' + path); return res.text(); })
          .then(function(content) { zip.file(path, content); })
          .catch(function(err) { bundleFailures++; console.warn(err); });
      });

      var imagePromises = imagesToBundle.map(function(path) {
        return fetch(absUrl(path))
          .then(function(res) { if (!res.ok) throw new Error('Failed to fetch ' + path); return res.blob(); })
          .then(function(blob) { zip.file(path, blob); })
          .catch(function(err) { bundleFailures++; console.warn(err); });
      });

      var previewPromise = fetch(absUrl('preview.html'))
        .then(function(res) { if (!res.ok) throw new Error('Failed to fetch preview.html'); return res.text(); })
        .then(function(html) { zip.file('index.html', html
          .replace('<head>', '<head>\n  <script>window.isExported = true;</script>')
          .split('\n').filter(function(l) { return l.indexOf('xeno-export-remove') === -1; }).join('\n')
        ); });

      var all = fetchPromises.concat(imagePromises).concat(mediaPromises).concat(faviconPromises);
      all.push(previewPromise);

      Promise.all(all)
        .then(function() {
          // Post-validation: warn about unresolved media_ or blob: URLs in exported data
          unresolved.length = 0;
          exportedData.scenes.forEach(function(s) {
            var t = s.thumbnailUrl || '';
            var m = s.mediaUrl || '';
            if (t.indexOf('media_') === 0 || t.indexOf('blob:') === 0) unresolved.push('thumbnailUrl on ' + (s.name || s.id));
            if (m.indexOf('media_') === 0 || m.indexOf('blob:') === 0) unresolved.push('mediaUrl on ' + (s.name || s.id));
          });
          if (unresolved.length) bundleFailures += unresolved.length;
          zip.file('data.js', 'var data = ' + JSON.stringify(exportedData, null, 2) + ';\n');
          return zip.generateAsync({ type: 'blob' });
        })
        .then(function(blob) {
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = url;
          a.download = (S.projectSlug || 'xeno-tour') + '.zip';
          document.body.appendChild(a); a.click();
          document.body.removeChild(a);
          setTimeout(function() { URL.revokeObjectURL(url); }, 10000);
          exportBtn.innerHTML = originalText;
          exportBtn.disabled = false;
          if (mediaFailures > 0 || bundleFailures > 0) {
            var msg = [];
            if (mediaFailures > 0) msg.push(mediaFailures + ' media file(s) could not be included');
            if (bundleFailures > 0) msg.push(bundleFailures + ' static asset(s) failed to bundle');
            msg.push('The exported tour may not display correctly.');
            if (unresolved.length > 0) {
              var prefix = unresolved.slice(0, 5);
              msg.push('Unresolved: ' + prefix.join(', ') + (unresolved.length > 5 ? ' \u2026and ' + (unresolved.length - 5) + ' more' : ''));
            }
            alert('Warning: ' + msg.join('. '));
          }
          setTimeout(function() { if (window.showDonatePopup) window.showDonatePopup(); }, 600);
        })
        .catch(function(err) {
          alert('ZIP export failed: ' + err.message);
          exportBtn.innerHTML = originalText;
          exportBtn.disabled = false;
        });
    });
  };
})();
