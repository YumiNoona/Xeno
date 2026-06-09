(function() {
  'use strict';
  var E = window.XenoEditor = window.XenoEditor || {};
  E.isMediaId = function(v) { return typeof v === 'string' && v.indexOf('media_') === 0; };
  E.restoreMediaIds = function(data) {
    (data.scenes || []).forEach(function(s) {
      if (s._mediaId) {
        s.mediaUrl = s._mediaId;
        if (s.thumbnailUrl && s.thumbnailUrl.indexOf('blob:') === 0) s.thumbnailUrl = s._mediaId;
        delete s._mediaId;
      }
      if (s._thumbId) { s.thumbnailUrl = s._thumbId; delete s._thumbId; }
      var allHs = (s.hotspots || []).concat(s.linkHotspots || [], s.infoHotspots || [], s.mediaHotspots || []);
      allHs.forEach(function(h) {
        if (h.content && h.content._srcId) { h.content.src = h.content._srcId; delete h.content._srcId; }
        if (h._customIconId) { h.customIconUrl = h._customIconId; delete h._customIconId; }
      });
    });
  };

  // Shared mutable state — populated by init.js, consumed by all modules
  E.state = {
    viewer: null,
    scenes: [],
    currentSceneCtx: null,
    selectedHotspotData: null,
    selectedHotspotElement: null,
    isDragging: false,
    dragHsData: null,
    dragHsElement: null,
    editorState: { activeTool: 'select', placeMode: false },
    mediaPickerCallback: null,
    saveTimeout: null,
    viewReadLoop: null,
    projectSlug: null,
    contextTarget: null,
    selectedSceneIds: new Set(),
    lastClickedSceneIndex: null,
    dragIsMulti: false,
    dragSourceIndex: null
  };
  var S = E.state;

  // Debounced auto-save (does not push undo — callers push undo when needed)
  E.debouncedSave = function() {
    if (S.saveTimeout) clearTimeout(S.saveTimeout);
    S.saveTimeout = setTimeout(function() {
      if (S.projectSlug && window.XenoSupabase) {
        if (S.scenes && S.scenes.length) {
          window.data.scenes = S.scenes.map(function(s) { return JSON.parse(JSON.stringify(s.data)); });
        }
        var saveData = JSON.parse(JSON.stringify(window.data));
        E.restoreMediaIds(saveData);
        Promise.resolve(window.XenoSupabase.saveTour(S.projectSlug, saveData)).then(function() {
          flashSaveIndicator(true);
        }).catch(function(e) {
          console.error('Save failed:', e);
          flashSaveIndicator(false);
        });
      }
    }, 500);
  };

  function flashSaveIndicator(success) {
    var indicator = document.getElementById('save-indicator');
    if (!indicator) return;
    if (success) {
      indicator.style.color = 'var(--success)';
      indicator.textContent = '\u2714 Saved';
      indicator.style.opacity = '1';
      setTimeout(function() { indicator.style.opacity = '0'; }, 1500);
    } else {
      indicator.style.color = 'var(--danger)';
      indicator.textContent = '\u26A0 Save failed';
      indicator.style.opacity = '1';
      // Failure stays visible until next successful save (cleared in success branch above)
    }
  }

  // ─── Undo/Redo stack (circular buffer, 50 entries) ──────
  var _undoStack = [];
  var _undoIndex = -1;
  var UNDO_MAX = 50;

  E.pushUndo = function() {
    if (!S.projectSlug) return;
    var snapshot = JSON.parse(JSON.stringify(window.data));
    E.restoreMediaIds(snapshot);
    _undoIndex++;
    _undoStack.length = _undoIndex;
    _undoStack.push(snapshot);
    if (_undoStack.length > UNDO_MAX) { _undoStack.shift(); _undoIndex--; }
    refreshUndoButtons();
  };

  E.performUndo = function() {
    if (_undoIndex <= 0 || !S.projectSlug || !S.viewer) return;
    _undoIndex--;
    refreshUndoButtons();
    var snap = _undoStack[_undoIndex];
    window.data = JSON.parse(JSON.stringify(snap));
    rebuildViewerFromData(window.data);
  };

  E.performRedo = function() {
    if (_undoIndex >= _undoStack.length - 1 || !S.projectSlug || !S.viewer) return;
    _undoIndex++;
    refreshUndoButtons();
    var snap = _undoStack[_undoIndex];
    window.data = JSON.parse(JSON.stringify(snap));
    rebuildViewerFromData(window.data);
  };

  var _isRebuilding = false;
  S.isRebuilding = function() { return _isRebuilding; };

  function rebuildViewerFromData(data) {
    if (_isRebuilding) return;
    _isRebuilding = true;
    // Capture the active scene ID before destroying
    var prevSceneId = S.currentSceneCtx ? S.currentSceneCtx.data.id : null;
    // Cancel running read loop before destroying viewer
    if (S.viewReadLoop) { cancelAnimationFrame(S.viewReadLoop); S.viewReadLoop = null; }
    // Clear stale hotspot references
    if (data.scenes) {
      data.scenes.forEach(function(s) {
        var allArrs = [s.hotspots, s.linkHotspots, s.infoHotspots, s.mediaHotspots];
        allArrs.forEach(function(arr) { (arr || []).forEach(function(h) { delete h.__marzipanoHotspot; }); });
      });
      S.scenes.forEach(function(ctx) {
        var allArrs = [ctx.data.hotspots, ctx.data.linkHotspots, ctx.data.infoHotspots, ctx.data.mediaHotspots];
        allArrs.forEach(function(arr) { (arr || []).forEach(function(h) { delete h.__marzipanoHotspot; }); });
      });
    }
    S.scenes = [];
    if (E._resetHotspotGen) E._resetHotspotGen();
    try {
      S.viewer.destroy();
      S.viewer = new window.Xeno.Viewer(D.panoEl, { controls: { mouseViewMode: (data.settings && data.settings.mouseViewMode) || 'drag' } });
      window.xenoViewer = S.viewer;
    } catch(e) {
      console.warn('Failed to destroy/create viewer during rebuild', e);
      _isRebuilding = false;
      return;
    }
    var resolved = resolveSnapshotMedia(data);
    resolved.then(function(rData) {
      (rData.scenes || []).forEach(function(sData) {
        var source, geometry, view, limiter;
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
        view = new window.Xeno.RectilinearView(sData.initialViewParameters || {}, limiter);
        var scene = S.viewer.createScene({ source: source, geometry: geometry, view: view, pinFirstLevel: true });
        S.scenes.push({ data: sData, scene: scene, view: view });
      });
      if (S.scenes.length > 0) {
        var targetScene = null;
        if (prevSceneId) targetScene = S.scenes.find(function(s) { return s.data.id === prevSceneId; });
        if (!targetScene) targetScene = S.scenes[0];
        S.currentSceneCtx = targetScene;
        targetScene.scene.switchTo({});
        E.renderSceneGrid();
        E.renderSceneHotspots();
      }
      S.selectedHotspotData = null;
      S.selectedHotspotElement = null;
      E.closePropertiesPanel();
      if (E.startViewReadLoop) E.startViewReadLoop();
      E.debouncedSave();
      _isRebuilding = false;
    }).catch(function() {
      _isRebuilding = false;
    });
  }

  var isMediaId = E.isMediaId;

  function resolveSnapshotMedia(data) {
    if (!data || !data.scenes) return Promise.resolve(data);
    var clone = JSON.parse(JSON.stringify(data));
    var promises = [];
    clone.scenes.forEach(function(s) {
      if (isMediaId(s.mediaUrl) && window.XenoSupabase) {
        s._mediaId = s.mediaUrl;
        var _placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="4000" height="2000"%3E%3Crect fill="%231a1a1a" width="4000" height="2000"/%3E%3Ctext fill="%23666" font-family="monospace" font-size="48" x="2000" y="1000" text-anchor="middle" dominant-baseline="middle"%3EMedia unavailable%3C/text%3E%3C/svg%3E';
        promises.push(
          window.XenoSupabase.resolveMediaId(s.mediaUrl).then(function(b) {
            s.mediaUrl = b || _placeholder;
          }).catch(function() { s.mediaUrl = _placeholder; })
        );
      }
      if (isMediaId(s.thumbnailUrl) && s.thumbnailUrl !== s.mediaUrl && s.thumbnailUrl !== s._mediaId && window.XenoSupabase) {
        s._thumbId = s.thumbnailUrl;
        (function(capture) {
          promises.push(
            window.XenoSupabase.resolveMediaId(capture).then(function(b) {
              if (b) s.thumbnailUrl = b;
            }).catch(function() {})
          );
        })(s.thumbnailUrl);
      }
    });
    return Promise.all(promises).then(function() {
      // After all resolutions, sync any thumbnailUrl that was skipped (matched mediaUrl)
      clone.scenes.forEach(function(s) { if (s._mediaId && s.thumbnailUrl === s._mediaId) { s.thumbnailUrl = s.mediaUrl; } });
      return clone;
    });
  }
  E.resolveSnapshotMedia = resolveSnapshotMedia;

  // Ctrl+Z / Ctrl+Shift+Z
  document.addEventListener('keydown', function(e) {
    if (!e.ctrlKey && !e.metaKey) return;
    if (_isRebuilding) return;
    if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); E.performUndo(); }
    if (e.key === 'y' && !e.shiftKey) { e.preventDefault(); E.performRedo(); }
    if (e.key === 'Z' || (e.key === 'z' && e.shiftKey)) { e.preventDefault(); E.performRedo(); }
  });

  function refreshUndoButtons() {
    var undoBtn = document.getElementById('btn-undo');
    var redoBtn = document.getElementById('btn-redo');
    if (undoBtn) undoBtn.disabled = _undoIndex <= 0;
    if (redoBtn) redoBtn.disabled = _undoIndex >= _undoStack.length - 1;
  }

  // Emergency flush on tab close to prevent data loss
  function emergencySave() {
    if (S.isRebuilding && S.isRebuilding()) return;
    if (S.saveTimeout) clearTimeout(S.saveTimeout);
    if (S.projectSlug && window.XenoSupabase && S.scenes && S.scenes.length) {
      try {
        window.data.scenes = S.scenes.map(function(s) { return JSON.parse(JSON.stringify(s.data)); });
        var saveData = JSON.parse(JSON.stringify(window.data));
        E.restoreMediaIds(saveData);
        // Synchronous localStorage only — beforeunload cannot await async saveTour
        localStorage.setItem('xeno_emergency_' + S.projectSlug, JSON.stringify({ data: saveData, savedAt: Date.now() }));
      } catch(e) { console.error('Emergency save failed', e); }
    }
  }
  window.addEventListener('beforeunload', emergencySave);
  window.addEventListener('pagehide', emergencySave);
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') emergencySave();
  });

  // ─── DOM refs (editor layout) ───────────────────────────
  E.dom = {};
  var $ = function(id) { return document.getElementById(id); };
  var D = E.dom;

  D.panoWrapper      = $('pano-wrapper');
  D.panoEl           = $('pano');
  D.modeBadge        = $('mode-badge');
  D.pillTools        = document.querySelectorAll('.pill-tool');
  D.propsPanel       = $('properties-panel');
  D.panelTitle       = $('panel-title');
  D.sceneGridEl      = $('scene-grid');
  D.contextMenu      = $('context-menu');
  D.projectCtx       = $('project-ctx');
  D.mediaModal       = $('media-modal');

  // Theme Toggles
  D.dashboardThemeToggle = $('dashboard-theme-toggle');
  D.topbarThemeToggle    = $('topbar-theme-toggle');

  // Media Manager DOM
  D.mediaGridEl      = $('media-grid');
  D.mediaUploadArea  = $('media-upload-area');
  D.mediaFileInput   = $('media-file-input');
  D.mediaActionBar   = $('media-action-bar');
  D.btnAddSelected   = $('btn-add-selected');
  D.btnDeleteSelected = $('btn-delete-selected');
  D.btnClearMediaSel = $('btn-clear-media-sel');
  D.mediaFolderCtx   = $('media-folder-ctx');
  D.mediaItemCtx     = $('media-item-ctx');
  D.moveMediaModal   = $('move-media-modal');
  D.moveTargetAlbum  = $('move-target-album');
  D.btnCancelMove    = $('btn-cancel-move');
  D.btnConfirmMove   = $('btn-confirm-move');
  D.btnCloseMoveModal = $('btn-close-move-modal');

  // Media manager v2
  D.albumListEl      = document.querySelector('.album-list');

  // Properties panel fields
  D.propType         = $('prop-type');
  D.propTitle        = $('prop-title');
  D.propAnimation    = $('prop-animation');
  D.propIconStyle    = $('prop-icon-style');
  D.propTargetScene  = $('prop-target-scene');
  D.propTransition   = $('prop-transition');
  D.propTransDuration = $('prop-trans-duration');
  D.propTransDurLabel = $('prop-trans-dur-label');
  D.propBodyText     = $('prop-body-text');
  D.propLinkUrl      = $('prop-link-url');
  D.propLinkLabel    = $('prop-link-label');
  D.propInfoTargetScene = $('prop-info-target-scene');
  D.propUrlHref      = $('prop-url-href');
  D.propUrlLabel     = $('prop-url-label');
  D.propUrlOpenIn    = $('prop-url-open-in');
  D.bottomViewYaw    = $('bottom-view-yaw');
  D.bottomViewPitch  = $('bottom-view-pitch');
  D.bottomViewFov    = $('bottom-view-fov');
  D.propRingEnabled  = $('prop-ring-enabled');
  D.propIconColor    = $('prop-icon-color');
  D.btnResetIconColor = $('btn-reset-icon-color');
  D.propIconColorHex  = $('prop-icon-color-hex');
  D.propIconColorSwatch = $('prop-icon-color-swatch');
  D.propRingColor    = $('prop-ring-color');
  D.propRingColorHex  = $('prop-ring-color-hex');
  D.propRingColorSwatch = $('prop-ring-color-swatch');
  D.btnResetRingColor = $('btn-reset-ring-color');
  D.propRingSize     = $('prop-ring-size');
  D.propRingSizeLabel = $('prop-ring-size-label');
  D.propRingCount     = $('prop-ring-count');
  D.propRingCountLabel = $('prop-ring-count-label');
  D.propRingGap      = $('prop-ring-gap');
  D.propRingGapLabel = $('prop-ring-gap-label');
  D.groupRingGap     = $('group-ring-gap');
  D.propIconSize     = $('prop-icon-size');
  D.propSizeLabel    = $('prop-size-label');
  D.groupCustomIcon  = $('group-custom-icon');
  D.propCustomIconUrl = $('prop-custom-icon-url');
  D.propImageUrl     = $('prop-image-url');
  D.propVideoUrl     = $('prop-video-url');
  D.propAudioUrl     = $('prop-audio-url');
  D.propEmbedCode    = $('prop-embed-code');
  D.propEmbedWidth   = $('prop-embed-width');
  D.propEmbedHeight  = $('prop-embed-height');
  D.propEmbedPerspective = $('prop-embed-perspective');
  D.propEmbedRadius  = $('prop-embed-radius');
  D.propEmbedTransform = $('prop-embed-transform');
  D.perspectiveOptionsDiv = $('perspective-options');
  D.propQuadCode     = $('prop-quad-code');
  D.propQuadSrcWidth = $('prop-quad-src-width');
  D.propQuadSrcHeight = $('prop-quad-src-height');
  D.quadPointsList   = $('quad-points-list');
  D.btnAddQuadPoint  = $('btn-add-quad-point');
  D.btnClearQuadPoints = $('btn-clear-quad-points');
  D.btnPickCustomIcon = $('btn-pick-custom-icon');
  D.btnPickImage     = $('btn-pick-image');
  D.btnPickVideo     = $('btn-pick-video');
  D.btnPickAudio     = $('btn-pick-audio');
  D.propImageCaption = $('prop-image-caption');
  D.propImageLink    = $('prop-image-link');
  D.propVideoAutoplay = $('prop-video-autoplay');
  D.propVideoLoop    = $('prop-video-loop');
  D.propVideoMuted   = $('prop-video-muted');
  D.propAudioAutoplay = $('prop-audio-autoplay');
  D.propAudioMuted   = $('prop-audio-muted');
  D.propAudioVolume  = $('prop-audio-volume');
  D.propAudioVolLabel = $('prop-audio-vol-label');
  D.groupAudioVolume = $('group-audio-volume');
  D.propTextContent  = $('prop-text-content');
  D.propTextBg       = $('prop-text-bg');
  D.propTextColor    = $('prop-text-color');
  D.propTextBgColor  = $('prop-text-bg-color');
  D.groupTextBgColor = $('group-text-bg-color');
  D.propTextSize     = $('prop-text-size');
  D.propTextSizeLabel = $('prop-text-size-label');
  D.propTextFont     = $('prop-text-font');
  D.propTextBold     = $('prop-text-bold');
  D.propTextItalic   = $('prop-text-italic');
  D.propTextUnderline = $('prop-text-underline');
  D.propTextRotation = $('prop-text-rotation');
  D.propTextRotLabel = $('prop-text-rot-label');
  D.propNarratorAudio = $('prop-narrator-audio');
  D.propNarratorText  = $('prop-narrator-text');
  D.propNarratorDuration = $('prop-narrator-duration');
  D.propAmbientAudio  = $('prop-ambient-audio');
  D.propAmbientLoop   = $('prop-ambient-loop');
  D.propAmbientAutoplay = $('prop-ambient-autoplay');
  D.propAmbientVolume = $('prop-ambient-volume');
  D.propAmbientRadius = $('prop-ambient-radius');
  D.btnPickNarratorAudio = $('btn-pick-narrator-audio');
  D.btnPickAmbientAudio  = $('btn-pick-ambient-audio');

  // Editor panels
  D.fieldsHotspotProperties = $('fields-hotspot-properties');
  D.fieldsProjectSettings = $('fields-project-settings');
  D.panelActionsHotspot = $('panel-actions-hotspot');

  // Project settings DOM
  D.psVR          = $('ps-vr');
  D.psGyro        = $('ps-gyro');
  D.psControls    = $('ps-controls');
  D.psFullscreen  = $('ps-fullscreen');
  D.psCapture     = $('ps-capture');
  D.psAutorotate  = $('ps-autorotate');
  D.psShowScenes  = $('ps-show-scenes');
  D.psLayoutTheme = $('ps-layout-theme'); // hidden input
  D.psMinimap     = $('ps-minimap');
  D.psMinimapPos  = $('ps-minimap-pos');
  D.psIntroEnabled = $('ps-intro-enabled');
  D.psIntroTitle  = $('ps-intro-title');
  D.psIntroSubtitle = $('ps-intro-subtitle');
  D.psIntroBtn    = $('ps-intro-btn');
  D.psHotspotOverview = $('ps-hotspot-overview');
  D.psSaveBtn     = $('btn-save-project-settings');
  D.psFloorplanUrl = $('ps-floorplan-url');

  // Media manager state (shared)
  D.currentAlbumId   = null;

  var HOTSPOT_TOOLS = ['navigate', 'info', 'url', 'image', 'video', 'audio', 'embed', 'quad', 'text', 'narrator', 'ambient'];
  var TOGGLE_TOOLS  = ['select', 'move'];

  E.HOTSPOT_TOOLS = HOTSPOT_TOOLS;
  E.TOGGLE_TOOLS  = TOGGLE_TOOLS;

  // Prevent pano events from leaking onto properties panel
  if (D.propsPanel) {
    var stopEvents = [
      'click', 'dblclick', 'mousedown', 'mouseup', 'mousemove',
      'touchstart', 'touchmove', 'touchend', 'touchcancel',
      'pointerdown', 'pointermove', 'pointerup', 'pointercancel',
      'wheel', 'contextmenu'
    ];
    stopEvents.forEach(function(evt) {
      D.propsPanel.addEventListener(evt, function(e) { e.stopPropagation(); });
    });
  }
})();