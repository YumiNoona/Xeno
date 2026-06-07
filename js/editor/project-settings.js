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
    D.fieldsSceneSettings.style.display = 'none';
    D.fieldsProjectSettings.style.display = 'block';
    D.panelActionsHotspot.style.display = 'none';
    D.panelPosition.style.display = 'none';
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
    if (D.psTransition) D.psTransition.value = s.defaultTransition || 'opacity';
    if (D.psTransDur) D.psTransDur.value = s.defaultTransitionDuration || 1000;
    if (D.psTransDurLabel) D.psTransDurLabel.textContent = (s.defaultTransitionDuration || 1000) + 'ms';

    // Floorplan
    var fp = window.data.floorplan || {};
    if (D.psFloorplanEnabled) D.psFloorplanEnabled.checked = fp.enabled === true;
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
    s.defaultTransition = D.psTransition ? D.psTransition.value : 'opacity';
    s.defaultTransitionDuration = D.psTransDur ? parseInt(D.psTransDur.value) : 1000;

    window.data.settings = s;

    // Floorplan
    var fp = window.data.floorplan || {};
    fp.enabled = D.psFloorplanEnabled ? D.psFloorplanEnabled.checked : false;
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
          html += '<div class="hs-overview-item"><span class="hs-overview-type hs-type-' + (hs.type || 'info') + '"></span>' + label + '</div>';
        });
        html += '</div>';
      }
      html += '</div>';
    });
    container.innerHTML = html;
  }

  // Wire up event listeners once DOM is ready
  setTimeout(function () {
    if (D.psTransDur && D.psTransDurLabel) {
      D.psTransDur.addEventListener('input', function () {
        D.psTransDurLabel.textContent = this.value + 'ms';
      });
    }

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
