/*
 * Xeno — Editor Logic
 * Split into modules under js/editor/ for maintainability.
 * This file is the final bootstrap that triggers the editor.
 * All modules (state.js, tools.js, etc.) must load before this.
 */
'use strict';

(function() {
  var E = window.XenoEditor;
  var S = E.state;
  var D = E.dom;

  var projectSlug = new URLSearchParams(window.location.search).get('project');
  S.projectSlug = projectSlug;

  if (!projectSlug) {
    D.panoWrapper.style.display = 'none';
    document.getElementById('workspace-view').style.display = 'none';
    document.getElementById('dashboard-view').style.display = 'flex';
    E.initDashboard();
    E.setupMediaManager();
    return;
  }

  document.getElementById('workspace-view').style.display = 'flex';
  document.getElementById('dashboard-view').style.display = 'none';

  function isMediaId(v) { return typeof v === 'string' && v.indexOf('media_') === 0; }

  function resolveSceneMedia(data) {
    if (!data || !data.scenes) return Promise.resolve(null);
    // Clone to avoid mutating the canonical data (preserve media IDs for saving)
    var clone = JSON.parse(JSON.stringify(data));
    var promises = [];
    clone.scenes.forEach(function(s) {
      if (isMediaId(s.mediaUrl)) {
        s._mediaId = s.mediaUrl;
        promises.push(window.XenoSupabase.resolveMediaId(s.mediaUrl).then(function(b) {
          if (b) { s.mediaUrl = b; if (isMediaId(s.thumbnailUrl)) s.thumbnailUrl = b; }
        }));
      }
    });
    return Promise.all(promises).then(function() { return clone; });
  }

  window.XenoEditor.restoreMediaIds = function restoreMediaIds(data) {
    (data.scenes || []).forEach(function(s) {
      if (s._mediaId) {
        s.mediaUrl = s._mediaId;
        if (s.thumbnailUrl && s.thumbnailUrl.indexOf('blob:') === 0) s.thumbnailUrl = s._mediaId;
        delete s._mediaId;
      }
    });
  };

  window.XenoSupabase.loadTour(projectSlug)
    .then(function(savedData) {
      if (projectSlug === 'sample-tour' && !savedData) {
        savedData = JSON.parse(JSON.stringify(window.data));
        window.XenoSupabase.saveTour('sample-tour', savedData);
      }
      if (!savedData) {
        savedData = {
          settings: {
            title: 'New Tour', name: 'New Tour', mouseViewMode: 'drag',
            autorotateEnabled: false, autorotateSpeed: 0.03, autorotateInactivityDelay: 3000,
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
        window.XenoSupabase.saveTour(projectSlug, savedData);
      }
      // Keep canonical data (with media IDs) for saving — clone once more in case
      // modules modify it later (they push/remove scenes, but mediaUrl stays as IDs)
      window.data = JSON.parse(JSON.stringify(savedData));
      return resolveSceneMedia(savedData);
    })
    .then(function(resolvedClone) {
      if (resolvedClone) startEditor(resolvedClone);
    });

  function startEditor(data) {
    window.isEditorMode = true;

    var topbarName = document.getElementById('topbar-project-name');
    if (topbarName && data.settings) {
      topbarName.textContent = data.settings.title || data.settings.name || 'Untitled Tour';
      topbarName.addEventListener('input', function() {
        var n = this.textContent.trim();
        if (data.settings) { data.settings.title = n || 'Untitled Tour'; data.settings.name = n || 'Untitled Tour'; }
        E.debouncedSave();
      });
      topbarName.addEventListener('blur', function() {
        if (!this.textContent.trim()) this.textContent = 'Untitled Tour';
        if (projectSlug) { if (S.scenes && S.scenes.length) window.data.scenes = S.scenes.map(function(s) { return JSON.parse(JSON.stringify(s.data)); }); window.XenoEditor.restoreMediaIds(window.data); window.XenoSupabase.saveTour(projectSlug, window.data); }
      });
      topbarName.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') { e.preventDefault(); this.blur(); }
      });
    }

    var viewMode = (data.settings && data.settings.mouseViewMode) || 'drag';
    S.viewer = new window.Xeno.Viewer(D.panoEl, { controls: { mouseViewMode: viewMode } });
    window.xenoViewer = S.viewer;
    window.xenoScenes = S.scenes;

    var autorotateOpts = {
      yawSpeed: (data.settings && data.settings.autorotateSpeed) || 0.03,
      targetPitch: 0, targetFov: Math.PI / 2
    };
    S.autorotate = window.Xeno.autorotate(autorotateOpts);
    S.autorotateEnabled = !!(data.settings && data.settings.autorotateEnabled);

    (data.scenes || []).forEach(function(sData) {
      var source = window.Xeno.ImageUrlSource.fromString(sData.mediaUrl);
      var geometry = new window.Xeno.EquirectGeometry([{ width: 4000 }]);
      var limiter = window.Xeno.RectilinearView.limit.vfov(60 * Math.PI / 180, 120 * Math.PI / 180);
      var view = new window.Xeno.RectilinearView(sData.initialViewParameters || {}, limiter);
      var scene = S.viewer.createScene({ source: source, geometry: geometry, view: view, pinFirstLevel: true });
      S.scenes.push({ data: sData, scene: scene, view: view });
    });

    var autorotateBtn = Array.prototype.find.call(D.pillTools, function(btn) {
      return btn.getAttribute('data-tool') === 'autorotate';
    });
    if (autorotateBtn && S.autorotateEnabled) {
      autorotateBtn.classList.add('active');
      S.viewer.startMovement(S.autorotate);
      S.viewer.setIdleMovement((data.settings && data.settings.autorotateInactivityDelay) || 3000, S.autorotate);
    }

    var minimapBtn = Array.prototype.find.call(D.pillTools, function(btn) {
      return btn.getAttribute('data-tool') === 'minimap';
    });
    if (minimapBtn && data.settings && data.settings.showMinimap) {
      minimapBtn.classList.add('active');
    }

    // Initialize all editor modules
    E.setupTools();
    E.setupHotspotProps();
    E.setupSceneManager();
    E.setupSceneSettings();
    E.setupMediaManager();
    E.setupUI();
    E.setupExport();

    E.renderSceneGrid();
    if (S.scenes.length > 0) {
      var initialSceneId = new URLSearchParams(window.location.search).get('scene') || S.scenes[0].data.id;
      E.switchSceneById(initialSceneId);
      E.startViewReadLoop();
    } else {
      E.openSceneSettingsPanel();
    }
  }
})();
