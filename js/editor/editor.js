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

  window.XenoSupabase.loadTour(projectSlug)
    .then(function(savedData) {
      if (projectSlug === 'sample-tour' && !savedData && window.data) {
        savedData = JSON.parse(JSON.stringify(window.data));
        window.XenoSupabase.saveTour('sample-tour', savedData);
      }
      // Try emergency recovery — prefer if its timestamp is newer than the normal save
      try {
        var emergencyRaw = localStorage.getItem('xeno_emergency_' + projectSlug);
        if (emergencyRaw) {
          var emergencyParsed = JSON.parse(emergencyRaw);
          var emergencyData = emergencyParsed.data || emergencyParsed;
          if (emergencyData && Array.isArray(emergencyData.scenes)) {
            var emTime = emergencyParsed.savedAt || 0;
            var dbTime = savedData ? (savedData._savedAt || 0) : 0;
            if (!savedData || emTime > dbTime || !Array.isArray(savedData.scenes)) {
              savedData = emergencyData;
              console.warn('Recovered project from emergency save' + (!dbTime ? '' : ' (newer than IndexedDB)'));
            }
          }
        }
      } catch(e) {}
      // Always clean up emergency key after a successful load
      try { localStorage.removeItem('xeno_emergency_' + projectSlug); } catch(e) {}
      if (!savedData) {
        savedData = {
          settings: {
            title: 'New Tour', name: 'New Tour', mouseViewMode: 'drag',
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
        window.XenoSupabase.saveTour(projectSlug, savedData);
      }
      // Keep canonical data (with media IDs) for saving — clone once more in case
      // modules modify it later (they push/remove scenes, but mediaUrl stays as IDs)
      window.data = JSON.parse(JSON.stringify(savedData));
      return E.resolveSnapshotMedia ? E.resolveSnapshotMedia(savedData) : Promise.resolve(null);
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
        if (this.textContent.length > 100) {
          this.textContent = this.textContent.substring(0, 100);
          // Move cursor to end
          var range = document.createRange();
          range.selectNodeContents(this);
          range.collapse(false);
          var sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        }
        var n = this.textContent.trim();
        if (window.data && window.data.settings) { window.data.settings.title = n || 'Untitled Tour'; window.data.settings.name = n || 'Untitled Tour'; }
        E.debouncedSave();
      });
      topbarName.addEventListener('blur', function() {
        if (!this.textContent.trim()) { this.textContent = 'Untitled Tour'; if (window.data && window.data.settings) { window.data.settings.title = 'Untitled Tour'; window.data.settings.name = 'Untitled Tour'; } }
        E.debouncedSave();
      });
      topbarName.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') { e.preventDefault(); this.blur(); }
      });
    }

    var viewMode = (data.settings && data.settings.mouseViewMode) || 'drag';
    S.viewer = new window.Xeno.Viewer(D.panoEl, { controls: { mouseViewMode: viewMode } });
    window.xenoViewer = S.viewer;
    Object.defineProperty(window, 'xenoScenes', { get: function() { return S.scenes; }, configurable: false });

    (data.scenes || []).forEach(function(sData) {
      var source, geometry, limiter;
      if (sData.type === 'video' && window.XenoVideoAsset) {
        var asset = new window.XenoVideoAsset();
        if (sData.videoOptions) asset.setVideo(sData.mediaUrl, sData.videoOptions);
        else asset.setVideo(sData.mediaUrl);
        source = new window.Xeno.SingleAssetSource(asset);
        geometry = new window.Xeno.EquirectGeometry([{ width: 1 }]);
        limiter = window.Xeno.RectilinearView.limit.vfov(60 * Math.PI / 180, 120 * Math.PI / 180);
      } else {
        source = window.Xeno.ImageUrlSource.fromString(sData.mediaUrl);
        geometry = new window.Xeno.EquirectGeometry([{ width: 4000 }]);
        limiter = window.Xeno.RectilinearView.limit.vfov(60 * Math.PI / 180, 120 * Math.PI / 180);
      }
      var view = new window.Xeno.RectilinearView(sData.initialViewParameters || {}, limiter);
      var scene = S.viewer.createScene({ source: source, geometry: geometry, view: view, pinFirstLevel: true });
      S.scenes.push({ data: sData, scene: scene, view: view });
    });

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
    }
    E.pushUndo(); // Capture initial clean state as undo entry 0
    if (E.refreshUndoButtons) E.refreshUndoButtons();

    if (window.XenoSupabase && window.XenoSupabase.cleanOrphanBlobs) {
      window.XenoSupabase.cleanOrphanBlobs();
    }
  }
})();
