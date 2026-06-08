(function () {
  'use strict';

  var E = window.XenoEditor;
  var S = E.state;
  var D = E.dom;

  E.openProjectSettingsPanel = function () {
    var panel = D.propsPanel;
    if (!panel) return;

    D.panelTitle.textContent = 'Project Settings';
    D.fieldsHotspotProperties.style.display = 'none';
    if (D.fieldsSceneSettings) D.fieldsSceneSettings.style.display = 'none';
    D.fieldsProjectSettings.style.display = 'block';
    D.panelActionsHotspot.style.display = 'none';
    // Show the save button (may have been hidden by closePropertiesPanel)
    var pa = document.getElementById('panel-actions-project');
    if (pa) pa.style.display = '';

    S.selectedHotspotElement = null;
    panel.classList.add('visible');

    loadSettings();
  };

  E.closeProjectSettingsPanel = function () {
    if (D.fieldsProjectSettings) D.fieldsProjectSettings.style.display = 'none';
    D.propsPanel.classList.remove('visible');
  };

  function loadSettings() {
    var s = window.data.settings || {};
    if (D.psVR) D.psVR.checked = s.vrEnabled === true;
    if (D.psGyro) D.psGyro.checked = s.gyroscopeEnabled === true;
    if (D.psControls) D.psControls.checked = s.showControls !== false;
    if (D.psFullscreen) D.psFullscreen.checked = s.fullscreenButton !== false;
    if (D.psCapture) D.psCapture.checked = s.showCaptureButton !== false;
    if (D.psAutorotate) D.psAutorotate.checked = s.autorotateEnabled === true;
    if (D.psShowScenes) D.psShowScenes.checked = s.showScenes !== false;
    if (D.psLayoutTheme) {
      D.psLayoutTheme.value = s.layoutTheme || 'hamburger';
      document.querySelectorAll('.theme-card').forEach(function(c) {
        c.classList.toggle('selected', c.dataset.theme === D.psLayoutTheme.value);
      });
    }
    if (D.psIntroEnabled) D.psIntroEnabled.checked = s.intro && s.intro.enabled === true;
    if (D.psIntroTitle) D.psIntroTitle.value = (s.intro && s.intro.title) || '';
    if (D.psIntroSubtitle) D.psIntroSubtitle.value = (s.intro && s.intro.subtitle) || '';
    if (D.psIntroBtn) D.psIntroBtn.value = (s.intro && s.intro.buttonText) || 'Enter Tour';
    if (D.psMinimap) D.psMinimap.checked = s.showMinimap === true;
    if (D.psMinimapPos) D.psMinimapPos.value = s.minimapPosition || 'bottom-left';

    // Floorplan
    var fp = window.data.floorplan || {};
    if (D.psMinimap) D.psMinimap.checked = fp.enabled === true;
    if (D.psFloorplanUrl) D.psFloorplanUrl.value = fp.imageUrl || '';

    renderHotspotOverview();
  }

  function saveSettings() {
    var s = window.data.settings || {};
    s.vrEnabled = D.psVR ? D.psVR.checked : false;
    s.gyroscopeEnabled = D.psGyro ? D.psGyro.checked : false;
    s.showControls = D.psControls ? D.psControls.checked : true;
    s.fullscreenButton = D.psFullscreen ? D.psFullscreen.checked : true;
    s.showCaptureButton = D.psCapture ? D.psCapture.checked : true;
    s.autorotateEnabled = D.psAutorotate ? D.psAutorotate.checked : false;
    s.showScenes = D.psShowScenes ? D.psShowScenes.checked : true;
    s.layoutTheme = D.psLayoutTheme ? D.psLayoutTheme.value : 'hamburger';
    try {
      var slug = window.currentProjectSlug || (window.location.search.match(/[?&]project=([^&]+)/) || [])[1];
      if (slug) {
        var raw = localStorage.getItem('xeno_tour_' + slug);
        if (raw) {
          var parsed = JSON.parse(raw);
          if (!parsed.data) parsed.data = {};
          if (!parsed.data.settings) parsed.data.settings = {};
          parsed.data.settings.layoutTheme = s.layoutTheme;
          localStorage.setItem('xeno_tour_' + slug, JSON.stringify(parsed));
        }
      }
    } catch(e) {}
    if (!s.intro) s.intro = {};
    s.intro.enabled = D.psIntroEnabled ? D.psIntroEnabled.checked : false;
    s.intro.title = D.psIntroTitle ? D.psIntroTitle.value : '';
    s.intro.subtitle = D.psIntroSubtitle ? D.psIntroSubtitle.value : '';
    s.intro.buttonText = D.psIntroBtn ? D.psIntroBtn.value : 'Enter Tour';
    s.showMinimap = D.psMinimap ? D.psMinimap.checked : false;
    s.minimapPosition = D.psMinimapPos ? D.psMinimapPos.value : 'bottom-left';

    window.data.settings = s;

    // Floorplan
    var fp = window.data.floorplan || {};
    fp.enabled = D.psMinimap ? D.psMinimap.checked : false;
    fp.imageUrl = D.psFloorplanUrl ? D.psFloorplanUrl.value : '';
    window.data.floorplan = fp;

    E.debouncedSave();
  }

  function renderHotspotOverview() {
    var container = D.psHotspotOverview;
    if (!container) return;
    var scenes = window.data.scenes || [];
    if (scenes.length === 0) {
      container.innerHTML = '<div style="color:var(--text-muted);font-size:var(--type-xs);padding:8px 0;">No scenes yet.</div>';
      return;
    }
    var html = '';
    scenes.forEach(function (scene, si) {
      var hotspots = scene.hotspots || [];
      html += '<div class="hs-overview-scene">';
      html += '<div class="hs-overview-scene-name">' + (scene.name || 'Scene ' + (si + 1)) + ' <span class="hs-overview-count">' + hotspots.length + ' hotspot' + (hotspots.length !== 1 ? 's' : '') + '</span></div>';
      if (hotspots.length > 0) {
        html += '<div class="hs-overview-list">';
        hotspots.forEach(function (hs, hi) {
          var label = hs.title || hs.label || hs.type || 'hotspot';
          html += '<div class="hs-overview-item" data-scene-index="' + si + '" data-hotspot-index="' + hi + '">';
          html += '<input type="checkbox" class="hs-overview-check" data-scene="' + si + '" data-hotspot="' + hi + '" data-hsid="' + hs.id + '">';
          html += '<span class="hs-overview-type hs-type-' + (hs.type || 'info') + '"></span>' + label;
          html += '<button class="hs-overview-delete" title="Delete hotspot">&times;</button>';
          html += '</div>';
        });
        html += '</div>';
      }
      html += '</div>';
    });
    html += '<div class="hs-overview-bulk" id="hs-overview-bulk"><span id="hs-bulk-count">0 selected</span><button id="hs-bulk-delete">Delete Selected</button></div>';
    container.innerHTML = html;

    // ── Single delete buttons ──
    container.querySelectorAll('.hs-overview-delete').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var si = parseInt(this.parentElement.getAttribute('data-scene-index'));
        var hi = parseInt(this.parentElement.getAttribute('data-hotspot-index'));
        if (isNaN(si) || isNaN(hi)) return;
        var sceneData = scenes[si];
        if (!sceneData || !sceneData.hotspots || !sceneData.hotspots[hi]) return;
        var hsData = sceneData.hotspots[hi];
        var label = hsData.title || hsData.label || hsData.type || 'hotspot';
        E.confirm('Delete hotspot "' + label + '" from ' + (sceneData.name || 'Scene ' + (si + 1)) + '?', 'Delete Hotspot', true).then(function(ok) {
          if (ok) {
            deleteHotspotsById([{ id: hsData.id, sceneId: sceneData.id }]);
            renderHotspotOverview();
          }
        });
      });
    });

    // ── Bulk select + delete ──
    var bulkBar = document.getElementById('hs-overview-bulk');
    var bulkCount = document.getElementById('hs-bulk-count');
    function updateBulkUI() {
      var checked = container.querySelectorAll('.hs-overview-check:checked');
      var count = checked.length;
      if (bulkBar) bulkBar.classList.toggle('visible', count > 0);
      if (bulkCount) bulkCount.textContent = count + ' selected';
    }
    container.querySelectorAll('.hs-overview-check').forEach(function(cb) {
      cb.addEventListener('click', function(e) { e.stopPropagation(); updateBulkUI(); });
    });
    var bulkDeleteBtn = document.getElementById('hs-bulk-delete');
    if (bulkDeleteBtn) {
      bulkDeleteBtn.onclick = function() {
        var checked = container.querySelectorAll('.hs-overview-check:checked');
        if (checked.length === 0) return;
        E.confirm('Delete ' + checked.length + ' selected hotspot(s)?', 'Batch Delete', true).then(function(ok) {
          if (ok) {
            var toDelete = [];
            checked.forEach(function(cb) {
              toDelete.push({
                id: cb.getAttribute('data-hsid'),
                sceneId: scenes[parseInt(cb.getAttribute('data-scene'))].id
              });
            });
            deleteHotspotsById(toDelete);
            renderHotspotOverview();
          }
        });
      };
    }
  }

  function deleteHotspotsById(list) {
    // Delete from canonical data
    var scenes = window.data.scenes || [];
    scenes.forEach(function(scene) {
      list.forEach(function(item) {
        if (scene.id !== item.sceneId) return;
        for (var i = scene.hotspots.length - 1; i >= 0; i--) {
          if (scene.hotspots[i].id === item.id) scene.hotspots.splice(i, 1);
        }
      });
    });
    // Delete from live editor state
    var E = window.XenoEditor;
    if (E && E.state) {
      var S = E.state;
      list.forEach(function(item) {
        var liveCtx = S.scenes.find(function(s) { return s.data.id === item.sceneId; });
        if (!liveCtx || !liveCtx.data.hotspots) return;
        for (var i = liveCtx.data.hotspots.length - 1; i >= 0; i--) {
          if (liveCtx.data.hotspots[i].id === item.id) {
            liveCtx.data.hotspots.splice(i, 1);
            break;
          }
        }
      });
      if (S.currentSceneCtx && list.some(function(item) { return S.currentSceneCtx.data.id === item.sceneId; })) {
        S.selectedHotspotData = null;
        S.selectedHotspotElement = null;
      }
      if (E.pushUndo) E.pushUndo();
      if (E.renderSceneHotspots) E.renderSceneHotspots();
      if (E.debouncedSave) E.debouncedSave();
    }
  }

  // Wire up event listeners once DOM is ready
  setTimeout(function () {

    // Theme card click handler
    document.querySelectorAll('.theme-card').forEach(function(card) {
      card.addEventListener('click', function() {
        document.querySelectorAll('.theme-card').forEach(function(c) { c.classList.remove('selected'); });
        this.classList.add('selected');
        D.psLayoutTheme.value = this.dataset.theme;
        D.psLayoutTheme.dispatchEvent(new Event('change'));
      });
    });

    // Auto-save on any change to project settings fields
    if (D.fieldsProjectSettings) {
      D.fieldsProjectSettings.addEventListener('change', function () {
        saveSettings();
      });
    }

    var saveBtn = D.psSaveBtn;
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        saveSettings();
        E.closeProjectSettingsPanel();
        if (window.data.floorplan && window.data.floorplan.imageUrl) {
          if (window.initMinimap) window.initMinimap();
        }
      });
    }

    // Floorplan picker
    var pickBtn = document.getElementById('ps-pick-floorplan');
    var fpInput = D.psFloorplanUrl;
    if (pickBtn && fpInput) {
      pickBtn.addEventListener('click', function () {
        S.mediaPickerCallback = function (url) {
          fpInput.value = url;
          fpInput.dispatchEvent(new Event('change'));
        };
        E.openMediaModal();
      });
    }
  }, 0);

})();
