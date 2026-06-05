(function() {
  'use strict';
  var E = window.XenoEditor = window.XenoEditor || {};

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
    autorotate: null,
    autorotateEnabled: false,
    projectSlug: null,
    contextTarget: null,
    selectedSceneIds: new Set(),
    lastClickedSceneIndex: null,
    dragIsMulti: false,
    dragSourceIndex: null
  };
  var S = E.state;

  // Debounced auto-save
  E.debouncedSave = function() {
    if (S.saveTimeout) clearTimeout(S.saveTimeout);
    S.saveTimeout = setTimeout(function() {
      if (S.projectSlug && window.XenoSupabase) {
        if (S.scenes && S.scenes.length) window.data.scenes = S.scenes.map(function(s) { return JSON.parse(JSON.stringify(s.data)); });
        window.XenoEditor.restoreMediaIds(window.data); window.XenoSupabase.saveTour(S.projectSlug, window.data);
      }
    }, 500);
  };

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
  D.mediaModal       = $('media-modal');

  // Theme Toggles
  D.dashboardThemeToggle = $('dashboard-theme-toggle');
  D.topbarThemeToggle    = $('topbar-theme-toggle');

  // Media Manager DOM
  D.mediaGrid        = $('media-grid');
  D.albumGrid        = $('album-grid');
  D.mediaUploadArea  = $('media-upload-area');
  D.mediaFileInput   = $('media-file-input');
  D.mediaSearchInput = $('media-search-input');
  D.mediaSearchClear = $('media-search-clear');
  D.mediaAlbumName   = $('media-album-name');
  D.btnCreateAlbum   = $('btn-create-album');
  D.btnBackToAlbums  = $('btn-back-to-albums');
  D.btnDeleteAlbum   = $('btn-delete-album');
  D.btnRenameAlbum   = $('btn-rename-album');
  D.btnMoveMedia     = $('btn-move-media');
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
  D.mediaGridEl      = $('media-grid');

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
  D.posYaw           = $('pos-yaw');
  D.posPitch         = $('pos-pitch');
  D.propRoomLabel    = $('prop-room-label');
  D.sceneNameLabel   = $('scene-name-label');
  D.propFloorplanUrl = $('prop-floorplan-url');
  D.btnPickFloorplan = $('btn-pick-floorplan');
  D.propFloorplanEnabled = $('prop-floorplan-enabled');
  D.bottomViewYaw    = $('bottom-view-yaw');
  D.bottomViewPitch  = $('bottom-view-pitch');
  D.bottomViewFov    = $('bottom-view-fov');
  D.propRingEnabled  = $('prop-ring-enabled');
  D.propIconColor    = $('prop-icon-color');
  D.btnResetIconColor = $('btn-reset-icon-color');
  D.propRingColor    = $('prop-ring-color');
  D.btnResetRingColor = $('btn-reset-ring-color');
  D.propRingSize     = $('prop-ring-size');
  D.propRingSizeLabel = $('prop-ring-size-label');
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
  D.propAudioLabel   = $('prop-audio-label');
  D.propAudioNarration = $('prop-audio-narration');

  // Editor panels
  D.fieldsSceneSettings = $('fields-scene-settings');
  D.fieldsHotspotProperties = $('fields-hotspot-properties');
  D.fieldsProjectSettings = $('fields-project-settings');
  D.panelActionsHotspot = $('panel-actions-hotspot');
  D.panelPosition    = $('panel-position');

  // Project settings DOM
  D.psVR          = $('ps-vr');
  D.psGyro        = $('ps-gyro');
  D.psControls    = $('ps-controls');
  D.psFullscreen  = $('ps-fullscreen');
  D.psCapture     = $('ps-capture');
  D.psAutorotate  = $('ps-autorotate');
  D.psLayoutTheme = $('ps-layout-theme');
  D.psMinimap     = $('ps-minimap');
  D.psMinimapPos  = $('ps-minimap-pos');
  D.psIntroEnabled = $('ps-intro-enabled');
  D.psIntroTitle  = $('ps-intro-title');
  D.psIntroSubtitle = $('ps-intro-subtitle');
  D.psIntroBtn    = $('ps-intro-btn');
  D.psTransition  = $('ps-transition');
  D.psTransDur    = $('ps-trans-dur');
  D.psTransDurLabel = $('ps-trans-dur-label');
  D.psHotspotOverview = $('ps-hotspot-overview');
  D.psSaveBtn     = $('btn-save-project-settings');
  D.psFloorplanEnabled = $('ps-minimap');
  D.psFloorplanUrl = $('ps-floorplan-url');

  // Media manager state (shared)
  D.currentAlbumId   = null;
  D.selectedMediaIds = new Set();
  D.selectedMediaMap = {};
  D.lastClickedMediaIndex = null;
  D.mediaListCache   = [];
  D.albumCtxTarget   = null;
  D.mediaCtxTarget   = null;

  var HOTSPOT_TOOLS = ['navigate', 'info', 'url', 'image', 'video', 'audio', 'embed', 'quad'];
  var TOGGLE_TOOLS  = ['select', 'autorotate', 'minimap', 'move'];

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