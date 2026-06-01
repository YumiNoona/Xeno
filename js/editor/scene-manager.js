(function() {
  'use strict';
  var E = window.XenoEditor;
  var S = E.state;
  var D = E.dom;

  E.setupSceneManager = function() {
    // ─── Scene Grid ──────────────────────────────────────
    E.renderSceneGrid = function() {
      D.sceneGridEl.innerHTML = '';
      if (E.populateTargetDropdowns) E.populateTargetDropdowns();

      S.scenes.forEach(function(s, index) {
        var card = document.createElement('div');
        card.className = 'scene-card';
        card.__sceneData = s.data;
        if (s.data.hidden) card.classList.add('hidden-scene');
        if (S.currentSceneCtx && S.currentSceneCtx.data.id === s.data.id) card.classList.add('active');

        var thumb = s.data.thumbnailUrl || s.data.mediaUrl || '';
        var imgHtml = thumb
          ? '<img class="scene-card-thumb" src="' + thumb + '" onerror="this.outerHTML=\'<div class=&quot;scene-thumb-placeholder&quot;>Scene</div>\'">'
          : '<div class="scene-thumb-placeholder">Scene</div>';

        var eyeSvg = s.data.hidden
          ? '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'
          : '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';

        var cleanName = (s.data.name || 'Untitled').replace(/\.[^/.]+$/, '');
        card.innerHTML = imgHtml +
          '<div class="scene-card-eye">' + eyeSvg + '</div>' +
          '<div class="scene-card-overlay"><div class="scene-card-label">' + cleanName + '</div></div>';

        // Drag & drop
        card.draggable = true;
        card.addEventListener('dragstart', function(e) {
          if (S.selectedSceneIds.has(s.data.id)) {
            S.dragIsMulti = true;
            e.dataTransfer.setData('text/plain', JSON.stringify(Array.from(S.selectedSceneIds)));
          } else {
            S.dragIsMulti = false;
            S.selectedSceneIds.clear();
            syncSceneSelection();
            e.dataTransfer.setData('text/plain', JSON.stringify([s.data.id]));
          }
          S.dragSourceIndex = index;
          card.classList.add('dragging');
          e.dataTransfer.effectAllowed = 'move';
        });
        card.addEventListener('dragend', function() {
          card.classList.remove('dragging');
          document.querySelectorAll('.scene-card').forEach(function(c) { c.classList.remove('drag-over'); });
          S.dragSourceIndex = null;
          S.dragIsMulti = false;
        });
        card.addEventListener('dragover', function(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; return false; });
        card.addEventListener('dragenter', function() {
          if (S.dragSourceIndex !== null && S.dragSourceIndex !== index) card.classList.add('drag-over');
        });
        card.addEventListener('dragleave', function() { card.classList.remove('drag-over'); });
        card.addEventListener('drop', function(e) {
          e.preventDefault(); e.stopPropagation();
          if (S.dragSourceIndex === null) return false;
          var droppedIds = JSON.parse(e.dataTransfer.getData('text/plain'));
          if (S.dragIsMulti) {
            var remaining = S.scenes.filter(function(sc) { return !S.selectedSceneIds.has(sc.data.id); });
            var dragged = droppedIds.map(function(id) { return S.scenes.find(function(sc) { return sc.data.id === id; }); }).filter(Boolean);
            var beforeTarget = S.scenes.slice(0, index).filter(function(sc) { return S.selectedSceneIds.has(sc.data.id); }).length;
            remaining.splice.apply(remaining, [index - beforeTarget, 0].concat(dragged));
            S.scenes = remaining;
          } else {
            var draggedScene = S.scenes.splice(S.dragSourceIndex, 1)[0];
            S.scenes.splice(index, 0, draggedScene);
          }
          window.data.scenes = S.scenes.map(function(item) { return item.data; });
          E.renderSceneGrid();
          E.debouncedSave();
          return false;
        });

        // Click → switch scene (unless multi-select active)
        card.addEventListener('click', function(e) {
          if (e.shiftKey) {
            if (S.lastClickedSceneIndex !== null) {
              var si = Math.min(S.lastClickedSceneIndex, index);
              var ei = Math.max(S.lastClickedSceneIndex, index);
              for (var i = si; i <= ei; i++) S.selectedSceneIds.add(S.scenes[i].data.id);
            } else {
              S.selectedSceneIds.add(s.data.id);
            }
          } else if (S.selectedSceneIds.size > 0) {
            if (S.selectedSceneIds.has(s.data.id)) S.selectedSceneIds.delete(s.data.id);
            else S.selectedSceneIds.add(s.data.id);
          } else {
            E.switchSceneById(s.data.id);
          }
          S.lastClickedSceneIndex = index;
          syncSceneSelection();
        });

        // Eye icon toggle
        card.querySelector('.scene-card-eye').addEventListener('click', function(e) {
          e.stopPropagation();
          s.data.hidden = !s.data.hidden;
          E.renderSceneGrid();
          E.debouncedSave();
        });

        // Right-click context menu
        card.addEventListener('contextmenu', function(e) {
          e.preventDefault();
          S.contextTarget = s;
          D.contextMenu.style.display = 'block';
          D.contextMenu.style.left = e.clientX + 'px';
          D.contextMenu.style.top = e.clientY + 'px';
        });

        D.sceneGridEl.appendChild(card);
      });
    };

    // ─── Scene selection sync ────────────────────────────
    function syncSceneSelection() {
      D.sceneGridEl.querySelectorAll('.scene-card').forEach(function(card) {
        var sid = card.__sceneData ? card.__sceneData.id : null;
        if (sid && S.selectedSceneIds.has(sid)) card.classList.add('scene-selected');
        else card.classList.remove('scene-selected');
      });
      var toolbar = document.getElementById('scene-multi-toolbar');
      var countEl = document.getElementById('scene-sel-count');
      if (S.selectedSceneIds.size > 1) {
        countEl.textContent = S.selectedSceneIds.size + ' scenes selected';
        toolbar.style.display = 'flex';
      } else {
        toolbar.style.display = 'none';
      }
    }

    // ─── Switch scene ────────────────────────────────────
    E.switchSceneById = function(id) {
      var sceneCtx = S.scenes.find(function(s) { return s.data.id === id; });
      if (!sceneCtx) return;

      if (sceneCtx.data.type === 'video') {
        var src = sceneCtx.scene.source();
        var asset = src.asset();
        if (asset && typeof asset.element === 'function') {
          var videoEl = asset.element();
          if (videoEl) videoEl.play().catch(function() {});
        }
      }

      S.currentSceneCtx = sceneCtx;
      var params = sceneCtx.view.parameters();
      D.bottomViewYaw.value = (params.yaw * 180 / Math.PI).toFixed(0);
      D.bottomViewPitch.value = (params.pitch * 180 / Math.PI).toFixed(0);
      D.bottomViewFov.value = (params.fov * 180 / Math.PI).toFixed(0);
      sceneCtx.scene.switchTo({}, function() {
        if (S.autorotateEnabled) S.viewer.startMovement(S.autorotate);
      });
      E.renderSceneGrid();
      E.renderSceneHotspots();
      E.closePropertiesPanel();
      if (window.updateMinimap) window.updateMinimap(sceneCtx);
    };

    // ─── Context menu actions ────────────────────────────
    document.addEventListener('click', function() {
      D.contextMenu.style.display = 'none';
      if (D.mediaFolderCtx) D.mediaFolderCtx.style.display = 'none';
      if (D.mediaItemCtx) D.mediaItemCtx.style.display = 'none';
    });

    D.contextMenu.querySelectorAll('.ctx-item').forEach(function(item) {
      item.addEventListener('click', function() {
        if (!S.contextTarget) return;
        var action = this.getAttribute('data-action');
        if (action === 'rename') {
          var newName = prompt('Rename scene:', S.contextTarget.data.name);
          if (newName) { S.contextTarget.data.name = newName; E.renderSceneGrid(); E.debouncedSave(); }
        } else if (action === 'set-default') {
          var idx = S.scenes.indexOf(S.contextTarget);
          if (idx > 0) {
            S.scenes.splice(idx, 1);
            S.scenes.unshift(S.contextTarget);
            window.data.scenes.splice(idx, 1);
            window.data.scenes.unshift(S.contextTarget.data);
            E.renderSceneGrid();
            E.debouncedSave();
          }
        } else if (action === 'duplicate') {
          var clone = JSON.parse(JSON.stringify(S.contextTarget.data));
          clone.id = 'scene_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
          clone.name = clone.name + ' (copy)';
          window.data.scenes.push(clone);
          var source = window.Xeno.ImageUrlSource.fromString(clone.mediaUrl);
          var geometry = new window.Xeno.EquirectGeometry([{ width: 4000 }]);
          var limiter = window.Xeno.RectilinearView.limit.traditional(1024, 140 * Math.PI / 180);
          var view = new window.Xeno.RectilinearView(clone.initialViewParameters, limiter);
          var scene = S.viewer.createScene({ source: source, geometry: geometry, view: view, pinFirstLevel: true });
          S.scenes.push({ data: clone, scene: scene, view: view });
          E.renderSceneGrid();
          E.debouncedSave();
        } else if (action === 'delete') {
          if (S.scenes.length <= 1) { alert('Cannot delete the only scene.'); return; }
          if (!confirm('Delete "' + S.contextTarget.data.name + '"?')) return;
          var dIdx = S.scenes.indexOf(S.contextTarget);
          S.scenes.splice(dIdx, 1);
          window.data.scenes.splice(dIdx, 1);
          if (S.currentSceneCtx === S.contextTarget) E.switchSceneById(S.scenes[0].data.id);
          E.renderSceneGrid();
          E.debouncedSave();
        }
        S.contextTarget = null;
      });
    });

    // ─── Scene search filter + keyboard shortcut ─────────
    var searchInput = document.getElementById('scene-search');
    if (searchInput) {
      searchInput.addEventListener('input', function() {
        var q = this.value.toLowerCase().trim();
        D.sceneGridEl.querySelectorAll('.scene-card').forEach(function(card) {
          var label = card.querySelector('.scene-card-label');
          var name = label ? label.textContent.toLowerCase() : '';
          card.style.display = (!q || name.indexOf(q) !== -1) ? '' : 'none';
        });
      });
      document.addEventListener('keydown', function(e) {
        if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
          var tag = (e.target || {}).tagName || '';
          if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
            e.preventDefault();
            searchInput.focus();
            searchInput.select();
          }
        }
        if (e.key === 'Escape' && document.activeElement === searchInput) {
          searchInput.value = '';
          searchInput.dispatchEvent(new Event('input'));
          searchInput.blur();
        }
      });
    }

    // ─── Add Scene from media button ─────────────────────
    document.getElementById('btn-add-scene').addEventListener('click', function() {
      D.mediaModal.classList.add('visible');
      E.loadAlbums();
      E.loadMedia(null);
    });

    // ─── Multi-delete scenes ─────────────────────────────
    document.getElementById('btn-delete-scenes').addEventListener('click', function() {
      if (S.selectedSceneIds.size === 0) return;
      if (S.scenes.length - S.selectedSceneIds.size < 1) { alert('Cannot delete all scenes.'); return; }
      if (!confirm('Delete ' + S.selectedSceneIds.size + ' selected scenes?')) return;
      var wasDeleted = S.selectedSceneIds.has(S.currentSceneCtx.data.id);
      S.scenes = S.scenes.filter(function(s) { return !S.selectedSceneIds.has(s.data.id); });
      window.data.scenes = S.scenes.map(function(s) { return s.data; });
      if (wasDeleted && S.scenes.length > 0) E.switchSceneById(S.scenes[0].data.id);
      S.selectedSceneIds.clear();
      S.lastClickedSceneIndex = null;
      E.renderSceneGrid();
      syncSceneSelection();
      E.debouncedSave();
    });

    // ─── Clear scene selection ───────────────────────────
    document.getElementById('btn-clear-scene-sel').addEventListener('click', function() {
      S.selectedSceneIds.clear();
      S.lastClickedSceneIndex = null;
      syncSceneSelection();
    });

    // ─── Add Scene Helpers ───────────────────────────────
    function createSceneFromUrl(url, name, forceVideo) {
      var newId = 'scene_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      var cleanName = (name || 'Untitled').replace(/\.[^/.]+$/, '');
      var isVideo = forceVideo || url.toLowerCase().match(/\.(mp4|webm|ogg)$/) || (name && name.toLowerCase().match(/\.(mp4|webm|ogg)$/));
      var sData = {
        id: newId, name: cleanName, type: isVideo ? 'video' : 'image',
        mediaUrl: url, thumbnailUrl: isVideo ? 'img/photo.png' : url,
        initialViewParameters: { yaw: 0, pitch: 0, fov: 1.57 },
        hotspots: []
      };
      if (isVideo) sData.videoOptions = { autoplay: true, loop: true, muted: true };

      // Wait for SW to be ready before creating Marzipano scene
      // (needed for /xeno-media/ URLs on first visit)
      var readyPromise = (url.indexOf('/xeno-media/') === 0 && window.XenoSupabase)
        ? window.XenoSupabase.swReady() : Promise.resolve();

      readyPromise.then(function() {
        window.data.scenes.push(sData);
        var source, geometry, view, limiter;
        if (isVideo) {
          var asset = new window.XenoVideoAsset();
          asset.setVideo(sData.mediaUrl, sData.videoOptions);
          source = new window.Xeno.SingleAssetSource(asset);
          geometry = new window.Xeno.EquirectGeometry([{ width: 1 }]);
          limiter = window.Xeno.RectilinearView.limit.vfov(60 * Math.PI / 180, 120 * Math.PI / 180);
        } else {
          source = window.Xeno.ImageUrlSource.fromString(sData.mediaUrl);
          geometry = new window.Xeno.EquirectGeometry([{ width: 4000 }]);
          limiter = window.Xeno.RectilinearView.limit.vfov(60 * Math.PI / 180, 120 * Math.PI / 180);
        }
        view = new window.Xeno.RectilinearView(sData.initialViewParameters, limiter);
        var scene = S.viewer.createScene({ source: source, geometry: geometry, view: view, pinFirstLevel: true });
        S.scenes.push({ data: sData, scene: scene, view: view });
        E.renderSceneGrid();
        E.switchSceneById(newId);
        E.startViewReadLoop();
        E.debouncedSave();
      });
    }

    E.addSceneFromUrl = function(url, name) { createSceneFromUrl(url, name, false); };
    E.addVideoSceneFromUrl = function(url, name) { createSceneFromUrl(url, name, true); };
  };
})();
