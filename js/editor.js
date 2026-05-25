/*
 * Xeno — Editor Logic (v2 — Tools Pill + Properties Panel + Scene Grid)
 */
'use strict';

(function() {

  var Xeno = window.Xeno;
  
  // Init Supabase
  if (window.XenoSupabase) window.XenoSupabase.init();

  var projectSlug = new URLSearchParams(window.location.search).get('project');
  
  if (!projectSlug) {
    // Hide workspace view, show dashboard
    document.getElementById('workspace-view').style.display = 'none';
    document.getElementById('dashboard-view').style.display = 'flex';
    initDashboard();
    return; // early exit
  }
  
  // Workspace Active
  document.getElementById('workspace-view').style.display = 'flex';
  document.getElementById('dashboard-view').style.display = 'none';

  // Load data asynchronously
  (window.XenoSupabase ? window.XenoSupabase.loadTour(projectSlug) : Promise.resolve(null))
    .then(function(savedData) {
      if (projectSlug === 'sample-tour' && !savedData) {
        savedData = window.data; // fallback to static data.js
        if (window.XenoSupabase) window.XenoSupabase.saveTour('sample-tour', savedData);
      }
      
      if (!savedData) {
        savedData = {
          settings: {
            title: "New Tour",
            name: "New Tour",
            mouseViewMode: "drag",
            autorotateEnabled: false,
            autorotateSpeed: 0.03,
            autorotateInactivityDelay: 3000,
            fullscreenButton: true,
            sceneListStyle: "sidebar",
            showMinimap: false,
            minimapPosition: "bottom-left",
            showControls: true,
            gyroscopeEnabled: false,
            vrEnabled: false,
            defaultTransition: "opacity",
            defaultTransitionDuration: 1000,
            defaultTransitionEasing: "easeInOut",
            branding: { logoUrl: null, accentColor: "#e62e5a", logoPosition: "top-left" },
            intro: { enabled: false, title: "", subtitle: "", buttonText: "Enter Tour" }
          },
          scenes: [],
          floorplan: { enabled: false, imageUrl: "", width: 800, height: 600 }
        };
        if (window.XenoSupabase) window.XenoSupabase.saveTour(projectSlug, savedData);
      }

      startEditor(savedData);
    });

  function startEditor(data) {
    window.data = data;

  // ─── Viewer Init ──────────────────────────────────────────
  var viewerOpts = { controls: { mouseViewMode: (data.settings && data.settings.mouseViewMode) || 'drag' } };
  var viewer = new Xeno.Viewer(document.getElementById('pano'), viewerOpts);

  // Expose for minimap
  window.xenoViewer = viewer;
  window.xenoScenes = [];
  var scenes = window.xenoScenes;
  
  var currentSceneCtx = null;
  var selectedHotspotData = null;
  var selectedHotspotElement = null;

  // Dragging state
  var isDragging = false;
  var dragHsData = null;
  var dragHsElement = null;

  // Debounced Save
  var saveTimeout = null;
  function debouncedSave() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(function() {
      if (projectSlug && window.XenoSupabase) {
        window.XenoSupabase.saveTour(projectSlug, window.data);
        console.log('[Xeno] Tour progress auto-saved');
      }
    }, 500);
  }
  window.debouncedSave = debouncedSave;

  // Autorotate movement definition and tracking state
  var autorotate = Xeno.autorotate({
    yawSpeed: (data.settings && data.settings.autorotateSpeed) || 0.03,
    targetPitch: 0,
    targetFov: Math.PI / 2
  });
  var autorotateEnabled = !!(data.settings && data.settings.autorotateEnabled);

  // Build scenes from data.js
  data.scenes.forEach(function(sData) {
    var source = Xeno.ImageUrlSource.fromString(sData.mediaUrl);
    var geometry = new Xeno.EquirectGeometry([{ width: 4000 }]);
    var limiter = Xeno.RectilinearView.limit.traditional(1024, 140 * Math.PI / 180);
    var view = new Xeno.RectilinearView(sData.initialViewParameters, limiter);
    var scene = viewer.createScene({ source: source, geometry: geometry, view: view, pinFirstLevel: true });
    scenes.push({ data: sData, scene: scene, view: view });
  });

  // ─── Editor State ─────────────────────────────────────────
  var editorState = {
    activeTool: 'select',     // current tool
    placeMode: false          // waiting for click to place hotspot
  };

  var mediaPickerCallback = null;

  var HOTSPOT_TOOLS = ['navigate', 'info', 'url', 'image', 'video', 'audio'];
  var TOGGLE_TOOLS = ['select', 'autorotate', 'minimap', 'scene-settings', 'move'];

  // ─── DOM Refs ─────────────────────────────────────────────
  var panoWrapper = document.getElementById('pano-wrapper');
  var panoEl = document.getElementById('pano');
  var modeBadge = document.getElementById('mode-badge');
  var pillTools = document.querySelectorAll('.pill-tool');
  var propsPanel = document.getElementById('properties-panel');
  // Prevent Marzipano / pano wrapper from capturing touch/pointer/mouse/scroll events on the properties panel
  if (propsPanel) {
    var stopEvents = [
      'click', 'dblclick', 'mousedown', 'mouseup', 'mousemove',
      'touchstart', 'touchmove', 'touchend', 'touchcancel',
      'pointerdown', 'pointermove', 'pointerup', 'pointercancel',
      'wheel', 'contextmenu'
    ];
    stopEvents.forEach(function(evt) {
      propsPanel.addEventListener(evt, function(e) {
        e.stopPropagation();
      });
    });
  }
  var panelTitle = document.getElementById('panel-title');
  var sceneGridEl = document.getElementById('scene-grid');
  var contextMenu = document.getElementById('context-menu');
  var mediaModal = document.getElementById('media-modal');

  // Media Manager DOM Elements
  var mediaFolderCtx = document.getElementById('media-folder-ctx');
  var mediaItemCtx = document.getElementById('media-item-ctx');
  var moveMediaModal = document.getElementById('move-media-modal');
  var moveTargetAlbum = document.getElementById('move-target-album');
  var btnCancelMove = document.getElementById('btn-cancel-move');
  var btnConfirmMove = document.getElementById('btn-confirm-move');
  var btnCloseMoveModal = document.getElementById('btn-close-move-modal');

  // Media Action Bar elements
  var mediaActionBar = document.getElementById('media-action-bar');
  var btnAddSelected = document.getElementById('btn-add-selected');
  var btnDeleteSelected = document.getElementById('btn-delete-selected');
  var btnClearMediaSel = document.getElementById('btn-clear-media-sel');

  btnAddSelected.addEventListener('click', function() {
    if (selectedMediaIds.size === 0) return;

    selectedMediaIds.forEach(function(mediaId) {
      var media = selectedMediaMap[mediaId];
      if (media) {
        var isVideo = media.type && media.type.startsWith('video/');
        if (isVideo) {
          addVideoSceneFromUrl(media.url, media.filename);
        } else {
          addSceneFromUrl(media.url, media.filename);
        }
      }
    });
    mediaModal.classList.remove('visible');
    selectedMediaIds.clear();
    selectedMediaMap = {};
    lastClickedMediaIndex = null;
    syncMediaSelection();
    debouncedSave();
  });

  document.getElementById('btn-clear-scene-sel').addEventListener('click', function() {
    selectedSceneIds.clear();
    lastClickedSceneIndex = null;
    syncSceneSelection();
  });

  btnDeleteSelected.addEventListener('click', function() {
    if (selectedMediaIds.size === 0) return;

    if (!confirm('Delete ' + selectedMediaIds.size + ' items? This cannot be undone.')) return;

    var deletePromises = [];
    selectedMediaIds.forEach(function(mediaId) {
      var media = selectedMediaMap[mediaId];
      if (media) {
        deletePromises.push(window.XenoSupabase.deleteMedia(media.id, media.url));
      }
    });

    Promise.all(deletePromises)
      .then(function() {
        selectedMediaIds.clear();
        selectedMediaMap = {};
        lastClickedMediaIndex = null;
        loadMedia(currentAlbumId); // Reload media grid
        showToast('Deleted ' + deletePromises.length + ' media items.');
      })
      .catch(function(err) {
        alert('Error deleting media: ' + err.message);
        console.error('Error deleting media:', err);
      });
  });

  btnClearMediaSel.addEventListener('click', function() {
    selectedMediaIds.clear();
    selectedMediaMap = {};
    lastClickedMediaIndex = null;
    syncMediaSelection();
  });

  var albumCtxTarget = null;
  var mediaCtxTarget = null;

  // Props fields
  var propType = document.getElementById('prop-type');
  var propTitle = document.getElementById('prop-title');
  var propAnimation = document.getElementById('prop-animation');
  var propIconStyle = document.getElementById('prop-icon-style');
  var propTargetScene = document.getElementById('prop-target-scene');
  var propTransition = document.getElementById('prop-transition');
  var propTransDuration = document.getElementById('prop-trans-duration');
  var propTransDurLabel = document.getElementById('prop-trans-dur-label');
  var propBodyText = document.getElementById('prop-body-text');
  var propLinkUrl = document.getElementById('prop-link-url');
  var propLinkLabel = document.getElementById('prop-link-label');
  var propInfoTargetScene = document.getElementById('prop-info-target-scene');
  var propUrlHref = document.getElementById('prop-url-href');
  var propUrlLabel = document.getElementById('prop-url-label');
  var propUrlOpenIn = document.getElementById('prop-url-open-in');
  var posYaw = document.getElementById('pos-yaw');
  var posPitch = document.getElementById('pos-pitch');
  var propSceneName = document.getElementById('prop-scene-name');
  var propFloorplanEnabled = document.getElementById('prop-floorplan-enabled');
  var propFloorplanUrl = document.getElementById('prop-floorplan-url');
  var btnPickFloorplan = document.getElementById('btn-pick-floorplan');

  var propSceneFov = document.getElementById('prop-scene-fov');
  var sceneFovLabel = document.getElementById('scene-fov-label');
  var btnApplyFov = document.getElementById('btn-apply-fov');

  var propViewYaw = document.getElementById('prop-view-yaw');
  var propViewPitch = document.getElementById('prop-view-pitch');
  var propViewFov = document.getElementById('prop-view-fov');
  var btnReadView = document.getElementById('btn-read-view');
  var btnApplyView = document.getElementById('btn-apply-view');

  // Bottom view controls
  var bottomViewYaw = document.getElementById('bottom-view-yaw');
  var bottomViewPitch = document.getElementById('bottom-view-pitch');
  var bottomViewFov = document.getElementById('bottom-view-fov');

  // New Hotspot Properties
  var propRingEnabled = document.getElementById('prop-ring-enabled');
   var propIconColor = document.getElementById('prop-icon-color');
    var btnResetIconColor = document.getElementById('btn-reset-icon-color');
    var propRingColor = document.getElementById('prop-ring-color');
    var btnResetRingColor = document.getElementById('btn-reset-ring-color');
    var propIconSize = document.getElementById('prop-icon-size');
   var propSizeLabel = document.getElementById('prop-size-label');

   // Custom Icon group container
  var groupCustomIcon = document.getElementById('group-custom-icon');

  // Media inputs (text boxes)
  var propCustomIconUrl = document.getElementById('prop-custom-icon-url');
  var propImageUrl = document.getElementById('prop-image-url');
  var propVideoUrl = document.getElementById('prop-video-url');
  var propAudioUrl = document.getElementById('prop-audio-url');

  // Media picking buttons
  var btnPickCustomIcon = document.getElementById('btn-pick-custom-icon');
  var btnPickImage = document.getElementById('btn-pick-image');
  var btnPickVideo = document.getElementById('btn-pick-video');
  var btnPickAudio = document.getElementById('btn-pick-audio');



  // Other media inputs
  var propImageCaption = document.getElementById('prop-image-caption');
  var propImageLink = document.getElementById('prop-image-link');
  var propVideoAutoplay = document.getElementById('prop-video-autoplay');
  var propVideoLoop = document.getElementById('prop-video-loop');
  var propVideoMuted = document.getElementById('prop-video-muted');
  var propAudioAutoplay = document.getElementById('prop-audio-autoplay');
  var propAudioLabel = document.getElementById('prop-audio-label');

  // ─── Tools Pill Logic ─────────────────────────────────────
  pillTools.forEach(function(btn) {
    btn.addEventListener('click', function() {
      var tool = this.getAttribute('data-tool');
      handleToolClick(tool, this);
    });
  });

  // Initialize pill buttons from saved settings
  var autorotateBtn = Array.prototype.find.call(pillTools, function(btn) {
    return btn.getAttribute('data-tool') === 'autorotate';
  });
  if (autorotateBtn && autorotateEnabled) {
    autorotateBtn.classList.add('active');
    viewer.startMovement(autorotate);
    viewer.setIdleMovement((data.settings && data.settings.autorotateInactivityDelay) || 3000, autorotate);
  }

  var minimapBtn = Array.prototype.find.call(pillTools, function(btn) {
    return btn.getAttribute('data-tool') === 'minimap';
  });
  if (minimapBtn && data.settings && data.settings.showMinimap) {
    minimapBtn.classList.add('active');
  }

  function handleToolClick(tool, btnEl) {
    if (HOTSPOT_TOOLS.indexOf(tool) !== -1) {
      // Enter place mode
      setActiveTool(tool);
      editorState.placeMode = true;
      panoWrapper.classList.add('crosshair-mode');
      showModeBadge('Place: ' + tool);
    } else if (tool === 'select') {
      setActiveTool('select');
      editorState.placeMode = false;
      panoWrapper.classList.remove('crosshair-mode');
      hideModeBadge();
      closePropertiesPanel();
    } else if (tool === 'move') {
      btnEl.classList.toggle('active');
      if (btnEl.classList.contains('active')) {
        showModeBadge('Move Mode: Drag icons');
        panoWrapper.classList.add('move-mode');
      } else {
        hideModeBadge();
        panoWrapper.classList.remove('move-mode');
      }
    } else if (tool === 'autorotate') {
      btnEl.classList.toggle('active');
      autorotateEnabled = !autorotateEnabled;
      if (!data.settings) data.settings = {};
      data.settings.autorotateEnabled = autorotateEnabled;
      if (autorotateEnabled) {
        viewer.startMovement(autorotate);
        viewer.setIdleMovement((data.settings && data.settings.autorotateInactivityDelay) || 3000, autorotate);
      } else {
        viewer.stopMovement();
        viewer.setIdleMovement(Infinity);
      }
      debouncedSave();
    } else if (tool === 'scene-settings') {
      setActiveTool('select');
      editorState.placeMode = false;
      panoWrapper.classList.remove('crosshair-mode');
      hideModeBadge();
      openSceneSettingsPanel();
    } else if (tool === 'minimap') {
      btnEl.classList.toggle('active');
      if (!data.settings) data.settings = {};
      data.settings.showMinimap = btnEl.classList.contains('active');
      
      var minimapEl = document.getElementById('xeno-minimap');
      if (data.settings.showMinimap) {
        window.initMinimap();
        if (minimapEl) minimapEl.style.display = 'block';
      } else {
        if (minimapEl) minimapEl.style.display = 'none';
      }
      debouncedSave();
    }
  }

  function setActiveTool(tool) {
    editorState.activeTool = tool;
    pillTools.forEach(function(p) {
      if (p.getAttribute('data-tool') === tool) {
        p.classList.add('active');
      } else if (HOTSPOT_TOOLS.indexOf(p.getAttribute('data-tool')) !== -1 || p.getAttribute('data-tool') === 'select') {
        p.classList.remove('active');
      }
    });
  }

  function showModeBadge(text) {
    modeBadge.textContent = text;
    modeBadge.classList.add('visible');
  }

  function hideModeBadge() {
    modeBadge.classList.remove('visible');
  }

  function applyIconSize(element, size) {
    var half = size / 2;
    element.style.width  = size + 'px';
    element.style.height = size + 'px';
    element.style.marginLeft = '-' + half + 'px';
    element.style.marginTop  = '-' + half + 'px';
    // Scale inner SVG/img proportionally
    var inner = element.querySelector('svg') || element.querySelector('img.link-icon');
    if (inner) {
      var iconSize = Math.round(size * 0.55); // icon = 55% of container
      inner.style.width  = iconSize + 'px';
      inner.style.height = iconSize + 'px';
    }
  }

  // ─── Pano Click → Place Hotspot ───────────────────────────
  panoEl.addEventListener('click', function(e) {
    if (!editorState.placeMode || !currentSceneCtx) return;

    var rect = panoEl.getBoundingClientRect();
    var coords = currentSceneCtx.view.screenToCoordinates({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });

    var newHs = {
      id: 'hs_' + Date.now(),
      type: editorState.activeTool,
      style: editorState.activeTool,
      yaw: coords.yaw,
      pitch: coords.pitch,
      title: 'New ' + editorState.activeTool,
      text: '',
      animation: 'none',
      iconStyle: 'default',
      // Navigate fields
      target: null,
      transition: 'opacity',
      transitionDuration: 800,
      // Info fields
      linkUrl: '',
      linkType: 'external',
      linkTarget: null,
      linkLabel: '',
      // URL fields
      urlHref: '',
      urlLabel: 'Open link',
      urlOpenIn: 'newtab',
      // Media fields
      content: { src: '', caption: '', linkUrl: '' }
    };

    currentSceneCtx.data.hotspots = currentSceneCtx.data.hotspots || [];
    currentSceneCtx.data.hotspots.push(newHs);
    createVisualHotspot(newHs);

    // Revert to select
    setActiveTool('select');
    editorState.placeMode = false;
    panoWrapper.classList.remove('crosshair-mode');
    hideModeBadge();

    // Open properties for new hotspot
    openPropertiesPanel(newHs);

    debouncedSave();
  });

  // ─── Drag to Reposition ───────────────────────────────────
  panoWrapper.addEventListener('mousedown', function(e) {
    var moveBtn = Array.prototype.find.call(pillTools, function(btn) {
      return btn.getAttribute('data-tool') === 'move' && btn.classList.contains('active');
    });
    if (!moveBtn) return;

    // Check if we clicked a hotspot
    var target = e.target;
    while (target && target !== panoWrapper) {
      if (target.__marzipanoHotspot) {
        isDragging = true;
        dragHsElement = target;
        // Find the data object for this hotspot
        dragHsData = currentSceneCtx.data.hotspots.find(function(h) {
          return h.__tempElement === target || h.id === target.__hsId; // We need a way to link them
        });
        
        // Let's improve the link by storing data on the element in createVisualHotspot
        dragHsData = target.__hsData;

        e.preventDefault();
        e.stopPropagation();
        return;
      }
      target = target.parentElement;
    }
  }, true);

  window.addEventListener('mousemove', function(e) {
    if (!isDragging || !dragHsElement || !dragHsElement.__marzipanoHotspot) return;

    var rect = panoEl.getBoundingClientRect();
    var coords = currentSceneCtx.view.screenToCoordinates({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });

    dragHsElement.__marzipanoHotspot.setPosition(coords);
    
    if (dragHsData) {
      dragHsData.yaw = coords.yaw;
      dragHsData.pitch = coords.pitch;
      
      // Update properties panel if this is the selected hotspot
      if (selectedHotspotData === dragHsData) {
        posYaw.textContent = (coords.yaw * 180 / Math.PI).toFixed(0);
        posPitch.textContent = (coords.pitch * 180 / Math.PI).toFixed(0);
      }
    }
  });

  window.addEventListener('mouseup', function() {
    if (isDragging) {
      isDragging = false;
      dragHsElement = null;
      dragHsData = null;
      debouncedSave();
    }
  });

  // ─── Scene Grid ───────────────────────────────────────────
  var contextTarget = null; // scene being right-clicked
  var selectedSceneIds = new Set(); // Set of scene data.id strings
  var lastClickedSceneIndex = null; // for shift-click range
  var dragIsMulti = false; // true when dragging a selected group
  var dragSourceIndex = null; // scene being dragged index

  function syncSceneSelection() {
    var sceneCards = sceneGridEl.querySelectorAll('.scene-card');
    sceneCards.forEach(function(card) {
      var sceneId = card.__sceneData.id;
      if (selectedSceneIds.has(sceneId)) {
        card.classList.add('scene-selected');
      } else {
        card.classList.remove('scene-selected');
      }
    });

    var sceneMultiToolbar = document.getElementById('scene-multi-toolbar');
    var sceneSelCount = document.getElementById('scene-sel-count');
    if (selectedSceneIds.size > 1) { // Only show if more than one scene is selected
      sceneSelCount.textContent = selectedSceneIds.size + ' scenes selected';
      sceneMultiToolbar.style.display = 'flex';
    } else {
      sceneMultiToolbar.style.display = 'none';
    }
  }

  function renderSceneGrid() {
    sceneGridEl.innerHTML = '';
    populateTargetDropdowns();

    scenes.forEach(function(s, index) {
      var card = document.createElement('div');
      card.className = 'scene-card';
      if (s.data.hidden) {
        card.classList.add('hidden-scene');
      }
      if (currentSceneCtx && currentSceneCtx.data.id === s.data.id) {
        card.classList.add('active');
      }

      var thumb = s.data.thumbnailUrl || s.data.mediaUrl || '';
      var imgHtml = '';
      if (thumb) {
        imgHtml = '<img class="scene-card-thumb" src="' + thumb + '" onerror="this.outerHTML=\'<div class=&quot;scene-thumb-placeholder&quot;>Scene</div>\'">';
      } else {
        imgHtml = '<div class="scene-thumb-placeholder">Scene</div>';
      }
      var eyeSvg = s.data.hidden
        ? '<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"12\" height=\"12\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24\"/><line x1=\"1\" y1=\"1\" x2=\"23\" y2=\"23\"/></svg>'
        : '<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"12\" height=\"12\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/></svg>';

      var cleanName = (s.data.name || 'Untitled').replace(/\.[^/.]+$/, "");

      card.innerHTML =
        imgHtml +
        '<div class="scene-card-eye">' + eyeSvg + '</div>' +
        '<div class="scene-card-overlay">' +
          '<div class="scene-card-label">' + cleanName + '</div>' +
        '</div>';

      // Drag and Drop implementation
      card.draggable = true;

      card.addEventListener('dragstart', function(e) {
        if (selectedSceneIds.has(s.data.id)) {
          dragIsMulti = true;
          // Store all selected scene IDs for multi-drag
          e.dataTransfer.setData('text/plain', JSON.stringify(Array.from(selectedSceneIds)));
        } else {
          dragIsMulti = false;
          // Clear selection if dragging an unselected card
          selectedSceneIds.clear();
          syncSceneSelection();
          e.dataTransfer.setData('text/plain', JSON.stringify([s.data.id]));
        }
        dragSourceIndex = index;
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });

      card.addEventListener('dragend', function() {
        card.classList.remove('dragging');
        var allCards = sceneGridEl.querySelectorAll('.scene-card');
        allCards.forEach(function(c) {
          c.classList.remove('drag-over');
        });
        dragSourceIndex = null;
        dragIsMulti = false; // Reset multi-drag flag
      });

      card.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        return false;
      });

      card.addEventListener('dragenter', function() {
        if (dragSourceIndex !== null && dragSourceIndex !== index) {
          card.classList.add('drag-over');
        }
      });

      card.addEventListener('dragleave', function() {
        card.classList.remove('drag-over');
      });

      card.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();

        if (dragSourceIndex === null) return false;

        var droppedSceneIds = JSON.parse(e.dataTransfer.getData('text/plain'));
        var dropTargetIndex = index;

        if (dragIsMulti) {
          // Filter out selected scenes from the original array
          var remainingScenes = scenes.filter(function(scene) {
            return !selectedSceneIds.has(scene.data.id);
          });

          // Get the actual scene objects for the dropped IDs, maintaining original order
          var draggedScenes = droppedSceneIds.map(function(id) {
            return scenes.find(function(scene) { return scene.data.id === id; });
          }).filter(Boolean); // Filter out any nulls if a scene wasn't found

          // Calculate adjusted drop index
          var numSelectedBeforeTarget = scenes.slice(0, dropTargetIndex).filter(function(scene) {
            return selectedSceneIds.has(scene.data.id);
          }).length;
          var adjustedDropIndex = dropTargetIndex - numSelectedBeforeTarget;

          // Insert the dragged scenes at the adjusted drop index
          remainingScenes.splice(adjustedDropIndex, 0, ...draggedScenes);
          scenes = remainingScenes;

        } else {
          // Existing single-card splice logic
          var draggedScene = scenes.splice(dragSourceIndex, 1)[0];
          scenes.splice(dropTargetIndex, 0, draggedScene);
        }

        // Update underlying database configurations array order
        data.scenes = scenes.map(function(item) { return item.data; });

        renderSceneGrid();
        debouncedSave();
        return false;
      });

      card.addEventListener('click', function(e) {
        var sceneId = s.data.id;
        if (e.shiftKey) {
          if (lastClickedSceneIndex !== null) {
            var startIndex = Math.min(lastClickedSceneIndex, index);
            var endIndex = Math.max(lastClickedSceneIndex, index);
            for (var i = startIndex; i <= endIndex; i++) {
              selectedSceneIds.add(scenes[i].data.id);
            }
          } else {
            selectedSceneIds.add(sceneId);
          }
        } else {
          if (selectedSceneIds.size > 0) {
            // Multi-select mode is active, toggle this card's selection
            if (selectedSceneIds.has(sceneId)) {
              selectedSceneIds.delete(sceneId);
            } else {
              selectedSceneIds.add(sceneId);
            }
          } else {
            // No multi-select active, behave as before (navigate)
            switchSceneById(sceneId);
          }
        }
        lastClickedSceneIndex = index;
        syncSceneSelection();
      });

      // Handle clicking the eye icon to toggle visibility
      var eyeBtn = card.querySelector('.scene-card-eye');
      eyeBtn.addEventListener('click', function(e) {
        e.stopPropagation(); // prevent switching scene
        s.data.hidden = !s.data.hidden;
        renderSceneGrid();
        debouncedSave();
      });

      // Right-click context menu
      card.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        contextTarget = s;
        contextMenu.style.display = 'block';
        contextMenu.style.left = e.clientX + 'px';
        contextMenu.style.top = e.clientY + 'px';
      });

      sceneGridEl.appendChild(card);
    });
  }

  // "+ Add item" button opens the Media Manager modal
  document.getElementById('btn-add-scene').addEventListener('click', function() {
    mediaModal.classList.add('visible');
    loadAlbums();
    loadMedia(currentAlbumId);
  });

  // Scene Multi-select Toolbar buttons
  document.getElementById('btn-delete-scenes').addEventListener('click', function() {
    if (selectedSceneIds.size === 0) return;

    if (scenes.length - selectedSceneIds.size < 1) {
      alert('Cannot delete all scenes. At least one scene must remain.');
      return;
    }

    if (!confirm('Delete ' + selectedSceneIds.size + ' selected scenes? This cannot be undone.')) return;

    var currentSceneWasDeleted = selectedSceneIds.has(currentSceneCtx.data.id);

    // Filter out selected scenes
    scenes = scenes.filter(function(s) {
      return !selectedSceneIds.has(s.data.id);
    });
    data.scenes = scenes.map(function(item) { return item.data; });

    if (currentSceneWasDeleted && scenes.length > 0) {
      switchSceneById(scenes[0].data.id); // Switch to the first remaining scene
    } else if (scenes.length === 0) {
      // This case should be prevented by the check above, but as a fallback
      alert('All scenes deleted. Please add a new scene.');
      // Potentially reset editor state or navigate to dashboard
    }

    selectedSceneIds.clear();
    lastClickedSceneIndex = null;
    renderSceneGrid();
    syncSceneSelection();
    debouncedSave();
  });

  // Context menu actions
  document.addEventListener('click', function() {
    contextMenu.style.display = 'none';
    if (mediaFolderCtx) mediaFolderCtx.style.display = 'none';
    if (mediaItemCtx) mediaItemCtx.style.display = 'none';
  });

  contextMenu.querySelectorAll('.ctx-item').forEach(function(item) {
    item.addEventListener('click', function() {
      if (!contextTarget) return;
      var action = this.getAttribute('data-action');

      if (action === 'rename') {
        var newName = prompt('Rename scene:', contextTarget.data.name);
        if (newName) {
          contextTarget.data.name = newName;
          renderSceneGrid();
          debouncedSave();
        }
      } else if (action === 'set-default') {
        // Move to front
        var idx = scenes.indexOf(contextTarget);
        if (idx > 0) {
          scenes.splice(idx, 1);
          scenes.unshift(contextTarget);
          data.scenes.splice(idx, 1);
          data.scenes.unshift(contextTarget.data);
          renderSceneGrid();
          debouncedSave();
        }
      } else if (action === 'duplicate') {
        var clone = JSON.parse(JSON.stringify(contextTarget.data));
        clone.id = 'scene_' + Date.now();
        clone.name = clone.name + ' (copy)';
        data.scenes.push(clone);

        var source = Xeno.ImageUrlSource.fromString(clone.mediaUrl);
        var geometry = new Xeno.EquirectGeometry([{ width: 4000 }]);
        var limiter = Xeno.RectilinearView.limit.traditional(1024, 140 * Math.PI / 180);
        var view = new Xeno.RectilinearView(clone.initialViewParameters, limiter);
        var scene = viewer.createScene({ source: source, geometry: geometry, view: view, pinFirstLevel: true });
        scenes.push({ data: clone, scene: scene, view: view });
        renderSceneGrid();
        debouncedSave();
      } else if (action === 'delete') {
        if (scenes.length <= 1) { alert('Cannot delete the only scene.'); return; }
        if (!confirm('Delete "' + contextTarget.data.name + '"?')) return;
        var dIdx = scenes.indexOf(contextTarget);
        scenes.splice(dIdx, 1);
        data.scenes.splice(dIdx, 1);
        if (currentSceneCtx === contextTarget) {
          switchSceneById(scenes[0].data.id);
        }
        renderSceneGrid();
        debouncedSave();
      }
      contextTarget = null;
    });
  });



  // ─── Scene Switching ──────────────────────────────────────
  function switchSceneById(id) {
    var sceneCtx = scenes.find(function(s) { return s.data.id === id; });
    if (!sceneCtx) return;
    currentSceneCtx = sceneCtx;
    sceneCtx.scene.switchTo({}, function() {
      if (autorotateEnabled) {
        viewer.startMovement(autorotate);
      }
    });
    renderSceneGrid();
    renderSceneHotspots();
    closePropertiesPanel();
    if (window.updateMinimap) window.updateMinimap(sceneCtx);
  }

  // ─── Resizing & Collapsing ────────────────────────────────
  (function initResizers() {
    var sidebar = document.getElementById('editor-sidebar');
    var leftResizer = document.getElementById('left-resizer');
    var props = document.getElementById('properties-panel');
    var rightResizer = document.getElementById('right-resizer');
    
    var sidebarCollapseBtn = document.getElementById('sidebar-collapse-btn');
    var propsCollapseBtn = document.getElementById('props-collapse-btn');
    
    // Sidebar Collapse
    sidebarCollapseBtn.addEventListener('click', function() {
      document.body.classList.toggle('sidebar-collapsed');
      setTimeout(function() { viewer.updateSize(); }, 250);
    });

    // Props Collapse
    propsCollapseBtn.addEventListener('click', function() {
      props.classList.remove('visible');
      document.getElementById('props-reopen-btn').style.display = 'block';
      setTimeout(function() { viewer.updateSize(); }, 250);
    });

    document.getElementById('props-reopen-btn').addEventListener('click', function() {
      if (selectedHotspotData || document.getElementById('fields-scene-settings').style.display === 'block') {
        props.classList.add('visible');
      }
      this.style.display = 'none';
      setTimeout(function() { viewer.updateSize(); }, 250);
    });

    // Left Resizer
    leftResizer.addEventListener('mousedown', function(e) {
      e.preventDefault();
      leftResizer.classList.add('dragging');
      document.addEventListener('mousemove', onMouseMoveLeft);
      document.addEventListener('mouseup', onMouseUpLeft);
    });

    function onMouseMoveLeft(e) {
      var newWidth = e.clientX;
      if (newWidth > 150 && newWidth < 500) {
        sidebar.style.transition = 'none';
        sidebar.style.width = newWidth + 'px';
        sidebar.style.minWidth = newWidth + 'px';
        viewer.updateSize();
      }
    }

    function onMouseUpLeft() {
      sidebar.style.transition = '';
      leftResizer.classList.remove('dragging');
      document.removeEventListener('mousemove', onMouseMoveLeft);
      document.removeEventListener('mouseup', onMouseUpLeft);
    }

    // Right Resizer
    rightResizer.addEventListener('mousedown', function(e) {
      e.preventDefault();
      rightResizer.classList.add('dragging');
      document.addEventListener('mousemove', onMouseMoveRight);
      document.addEventListener('mouseup', onMouseUpRight);
    });

    function onMouseMoveRight(e) {
      var newWidth = window.innerWidth - e.clientX;
      if (newWidth > 200 && newWidth < 600) {
        props.style.transition = 'none';
        props.style.width = newWidth + 'px';
        viewer.updateSize();
      }
    }

    function onMouseUpRight() {
      props.style.transition = '';
      rightResizer.classList.remove('dragging');
      document.removeEventListener('mousemove', onMouseMoveRight);
      document.removeEventListener('mouseup', onMouseUpRight);
    }
  })();

  // ─── Hotspots Rendering ───────────────────────────────────
  function renderSceneHotspots() {
    if (!currentSceneCtx) return;

    var container = currentSceneCtx.scene.hotspotContainer();
    var existing = container.listHotspots();
    for (var i = 0; i < existing.length; i++) {
      container.destroyHotspot(existing[i]);
    }

    var hotspots = (currentSceneCtx.data.hotspots || []).slice();
    // Also add legacy linkHotspots/infoHotspots/mediaHotspots
    (currentSceneCtx.data.linkHotspots || []).forEach(function(h) {
      var cloneH = Object.assign({}, h);
      cloneH.type = cloneH.type || 'navigate';
      cloneH.style = cloneH.style || 'link';
      hotspots.push(cloneH);
    });
    (currentSceneCtx.data.infoHotspots || []).forEach(function(h) {
      var cloneH = Object.assign({}, h);
      cloneH.type = cloneH.type || 'info';
      cloneH.style = cloneH.style || 'info';
      hotspots.push(cloneH);
    });
    (currentSceneCtx.data.mediaHotspots || []).forEach(function(h) {
      var cloneH = Object.assign({}, h);
      cloneH.type = cloneH.type || 'image';
      cloneH.style = cloneH.style || 'media';
      hotspots.push(cloneH);
    });

    hotspots.forEach(function(hsData) {
      createVisualHotspot(hsData);
    });

    // Re-attach selectedHotspotElement after rebuild
    if (selectedHotspotData) {
      var hotspotsList = container.listHotspots();
      hotspotsList.forEach(function(h) {
        if (h.domElement().__hsData === selectedHotspotData) {
          selectedHotspotElement = h.domElement();
        }
      });
    }
  }

  function createVisualHotspot(hsData) {
    if (!currentSceneCtx) return;
    var el = window.HotspotFactory.create(
      currentSceneCtx.scene,
      hsData,
      hsData.type || 'info',
      function() { /* editor doesn't auto-navigate */ },
      function(id) { return scenes.find(function(s) { return s.data.id === id; }); }
    );

    // Attach data reference for dragging
    el.__hsData = hsData;

    // In editor, clicking a hotspot opens its properties
    el.addEventListener('click', function(e) {
      if (editorState.placeMode) return; // don't intercept during place mode
      e.stopPropagation();
      selectedHotspotElement = el;
      openPropertiesPanel(hsData);
    });
  }

  // ─── Properties Panel ─────────────────────────────────────
  function openPropertiesPanel(hsData) {
    selectedHotspotData = hsData;
    panelTitle.textContent = 'Hotspot Properties';
    
    // Show hotspot actions, hide scene settings
    document.getElementById('panel-actions-hotspot').style.display = 'flex';
    document.getElementById('panel-position').style.display = 'flex';
    document.getElementById('fields-scene-settings').style.display = 'none';

    // Common fields
    propType.value = hsData.type || 'info';
    propTitle.value = hsData.title || hsData.label || '';
    propAnimation.value = hsData.animation || 'none';
    propIconStyle.value = hsData.iconStyle || 'default';
    propCustomIconUrl.value = hsData.customIconUrl || '';
    propRingEnabled.checked = hsData.ringEnabled !== false; // default true
    propIconColor.value = hsData.iconColor || '#ffffff';
    propRingColor.value = hsData.ringColor || '#ffffff';
    
    var size = hsData.iconSize || 44;
    propIconSize.value = size;
    propSizeLabel.textContent = size + 'px';

    toggleCustomIconGroup();

    // Position readout
    posYaw.textContent = ((hsData.yaw || 0) * 180 / Math.PI).toFixed(0);
    posPitch.textContent = ((hsData.pitch || 0) * 180 / Math.PI).toFixed(0);

    // Refresh dropdowns to exclude current scene
    populateTargetDropdowns();

    // Fill type-specific
    fillTypeFields(hsData);

    // Show correct type fields
    showTypeFields(hsData.type);

    propsPanel.classList.add('visible');
    setTimeout(function() { viewer.updateSize(); }, 250);
    startViewReadLoop();
  }

  function openSceneSettingsPanel() {
    selectedHotspotData = null;
    panelTitle.textContent = 'Scene Settings';

    document.getElementById('panel-actions-hotspot').style.display = 'none';
    document.getElementById('panel-position').style.display = 'none';

    // Hide all type fields, show scene settings
    hideAllTypeFields();
    document.getElementById('fields-scene-settings').style.display = 'block';

    if (currentSceneCtx) {
      propSceneName.value = currentSceneCtx.data.name || '';
      // Load saved FOV into slider
      var savedFov = currentSceneCtx.data.defaultFov
        || (currentSceneCtx.data.initialViewParameters && currentSceneCtx.data.initialViewParameters.fov)
        || (Math.PI / 2);
      var savedFovDeg = Math.round(savedFov * 180 / Math.PI);
      propSceneFov.value = savedFovDeg;
      sceneFovLabel.textContent = savedFovDeg + '°';
    }

    // Load project-wide floorplan settings
    if (data.floorplan) {
      propFloorplanEnabled.checked = data.floorplan.enabled !== false;
      propFloorplanUrl.value = data.floorplan.imageUrl || '';
    }

    propsPanel.classList.add('visible');
    setTimeout(function() { viewer.updateSize(); }, 250);
  }

  function closePropertiesPanel() {
    selectedHotspotData = null;
    propsPanel.classList.remove('visible');
    setTimeout(function() { viewer.updateSize(); }, 250);
  }

  function hideAllTypeFields() {
    var allFields = document.querySelectorAll('.type-fields');
    allFields.forEach(function(f) { f.style.display = 'none'; });
  }

  function showTypeFields(type) {
    hideAllTypeFields();
    var el = document.getElementById('fields-' + type);
    if (el) el.style.display = 'block';
  }

  function fillTypeFields(hsData) {
    // Navigate
    propTargetScene.value = hsData.target || '';
    propTransition.value = hsData.transition || 'opacity';
    propTransDuration.value = hsData.transitionDuration || 800;
    propTransDurLabel.textContent = (hsData.transitionDuration || 800) + 'ms';

    // Info
    propBodyText.value = hsData.text || '';
    propLinkUrl.value = hsData.linkUrl || '';
    propLinkLabel.value = hsData.linkLabel || '';
    var linkTypeRadios = document.querySelectorAll('input[name="prop-link-type"]');
    linkTypeRadios.forEach(function(r) { r.checked = r.value === (hsData.linkType || 'external'); });
    propInfoTargetScene.value = hsData.linkTarget || '';
    toggleInfoSceneTarget();

    // URL
    propUrlHref.value = hsData.urlHref || '';
    propUrlLabel.value = hsData.urlLabel || 'Open link';
    propUrlOpenIn.value = hsData.urlOpenIn || 'newtab';

    // Image
    propImageUrl.value = (hsData.content && hsData.content.src) || '';
    propImageCaption.value = (hsData.content && hsData.content.caption) || '';
    propImageLink.value = (hsData.content && hsData.content.linkUrl) || '';

    // Video
    propVideoUrl.value = (hsData.content && hsData.content.src) || '';
    propVideoAutoplay.checked = hsData.autoplay === true;
    propVideoLoop.checked = hsData.loop !== false;
    propVideoMuted.checked = hsData.muted !== false;

    // Audio
    propAudioUrl.value = (hsData.content && hsData.content.src) || '';
    propAudioAutoplay.checked = hsData.autoplay === true;
    propAudioLabel.checked = hsData.showPlayerLabel !== false;
  }

  // Type change
  propType.addEventListener('change', function() {
    if (selectedHotspotData) {
      selectedHotspotData.type = this.value;
      selectedHotspotData.style = this.value;
    }
    showTypeFields(this.value);
  });

  propTargetScene.addEventListener('change', function() {
    if (!selectedHotspotData) return;
    selectedHotspotData.target = this.value;

    // Auto-fill title if user hasn't typed one yet
    var currentTitle = propTitle.value.trim();
    var isDefaultOrEmpty = !currentTitle
      || currentTitle.toLowerCase().indexOf('new ') === 0
      || currentTitle === '';

    if (isDefaultOrEmpty && this.value) {
      // Find the scene name matching this ID
      var targetScene = scenes.find(function(s) { return s.data.id === propTargetScene.value; });
      if (targetScene) {
        var sceneName = targetScene.data.name || '';
        propTitle.value = sceneName;
        selectedHotspotData.title = sceneName;
        selectedHotspotData.label = sceneName;
        renderSceneHotspots();
      }
    }

    debouncedSave();
  });

  propInfoTargetScene.addEventListener('change', function() {
    if (!selectedHotspotData) return;
    selectedHotspotData.linkTarget = this.value;

    // Auto-fill title if user hasn't typed one yet
    var currentTitle = propTitle.value.trim();
    var isDefaultOrEmpty = !currentTitle
      || currentTitle.toLowerCase().indexOf('new ') === 0
      || currentTitle === '';

    if (isDefaultOrEmpty && this.value) {
      // Find the scene name matching this ID
      var targetScene = scenes.find(function(s) { return s.data.id === propInfoTargetScene.value; });
      if (targetScene) {
        var sceneName = targetScene.data.name || '';
        propTitle.value = sceneName;
        selectedHotspotData.title = sceneName;
        selectedHotspotData.label = sceneName;
        renderSceneHotspots();
      }
    }

    debouncedSave();
  });

  // Transition duration slider
  propTransDuration.addEventListener('input', function() {
    propTransDurLabel.textContent = this.value + 'ms';
  });

  propIconSize.addEventListener('input', function() {
    propSizeLabel.textContent = propIconSize.value + 'px';
    // Live preview: find the currently selected hotspot element and resize it
    if (selectedHotspotElement) {
      applyIconSize(selectedHotspotElement, parseInt(propIconSize.value));
    }
    debouncedSave();
  });

  // TITLE — live label update on the hotspot tooltip
  propTitle.addEventListener('input', function() {
    if (!selectedHotspotData) return;
    selectedHotspotData.title = this.value;
    selectedHotspotData.label = this.value;
    // Update just the tooltip text without full rebuild for performance
    if (selectedHotspotElement) {
      var tooltip = selectedHotspotElement.querySelector('.link-tooltip, .info-title, .tip p, .scene-card-label, .tip');
      if (tooltip) {
        // Different hotspot types have different label structures
        if (tooltip.tagName === 'P') tooltip.textContent = this.value;
        else tooltip.textContent = this.value;
      }
    }
    debouncedSave();
  });

  // ANIMATION — full rebuild needed since class changes on the element
  propAnimation.addEventListener('change', function() {
    if (!selectedHotspotData) return;
    selectedHotspotData.animation = this.value;
    renderSceneHotspots();
    debouncedSave();
  });

  // ICON STYLE — full rebuild needed since SVG content changes
  propIconStyle.addEventListener('change', function() {
    toggleCustomIconGroup();
    if (!selectedHotspotData) return;
    selectedHotspotData.iconStyle = this.value;
    renderSceneHotspots();
    debouncedSave();
  });

  // CUSTOM ICON URL — rebuild on change
  propCustomIconUrl.addEventListener('input', function() {
    if (!selectedHotspotData || propIconStyle.value !== 'custom') return;
    selectedHotspotData.customIconUrl = this.value;
    renderSceneHotspots();
    debouncedSave();
  });

  // ICON COLOR — direct DOM update, no rebuild needed
  propIconColor.addEventListener('input', function() {
    if (!selectedHotspotData) return;
    selectedHotspotData.iconColor = this.value;
    if (selectedHotspotElement) {
      var svg = selectedHotspotElement.querySelector('svg');
      if (svg) svg.style.color = this.value;
      var img = selectedHotspotElement.querySelector('img.link-icon');
      if (img) img.style.filter = 'none'; // can't tint img without rebuild
      var inner = selectedHotspotElement.querySelector('.in');
      if (inner) inner.style.backgroundColor = this.value;
    }
    debouncedSave();
  });

  // RING TOGGLE — direct DOM update
  propRingEnabled.addEventListener('change', function() {
    if (!selectedHotspotData) return;
    selectedHotspotData.ringEnabled = this.checked;
    if (selectedHotspotElement) {
      var ringTarget = selectedHotspotElement.querySelector('.link-icon-wrapper, .icon_wrapper, .out');
      if (ringTarget) ringTarget.classList.toggle('has-ring', this.checked);
      else selectedHotspotElement.classList.toggle('has-ring', this.checked);
    }
    debouncedSave();
  });

  // Icon style change
  function toggleCustomIconGroup() {
    if (propIconStyle.value === 'custom') {
      groupCustomIcon.style.display = 'block';
    } else {
      groupCustomIcon.style.display = 'none';
    }
  }
  propIconStyle.addEventListener('change', toggleCustomIconGroup);

  // Unified picker setup
  function bindMediaField(inputEl, pickBtn) {
    if (pickBtn) {
      pickBtn.addEventListener('click', function() {
        mediaPickerCallback = function(url, filename) {
          inputEl.value = url;
          // Trigger change event so data is saved/updated
          inputEl.dispatchEvent(new Event('change'));
          inputEl.dispatchEvent(new Event('input'));
        };
        if (mediaModal) mediaModal.classList.add('visible');
        currentAlbumId = null;
        loadAlbums();
        loadMedia(null);
      });
    }
  }

  bindMediaField(propCustomIconUrl, btnPickCustomIcon);
  bindMediaField(propImageUrl, btnPickImage);
  bindMediaField(propVideoUrl, btnPickVideo);
  bindMediaField(propAudioUrl, btnPickAudio);
  bindMediaField(propFloorplanUrl, btnPickFloorplan);

  btnResetIconColor.addEventListener('click', function() {
      propIconColor.value = '#ffffff';
      if (selectedHotspotData) {
        selectedHotspotData.iconColor = '#ffffff';
        renderSceneHotspots();
        debouncedSave();
      }
    });

    propRingColor.addEventListener('input', function() {
      if (selectedHotspotData) {
        selectedHotspotData.ringColor = this.value;
        renderSceneHotspots();
        debouncedSave();
      }
    });

    btnResetRingColor.addEventListener('click', function() {
      propRingColor.value = '#ffffff';
      if (selectedHotspotData) {
        selectedHotspotData.ringColor = '#ffffff';
        renderSceneHotspots();
        debouncedSave();
      }
    });

  // Info link type toggle
  var linkTypeRadios = document.querySelectorAll('input[name="prop-link-type"]');
  linkTypeRadios.forEach(function(r) {
    r.addEventListener('change', toggleInfoSceneTarget);
  });

  function toggleInfoSceneTarget() {
    var val = document.querySelector('input[name="prop-link-type"]:checked');
    var group = document.getElementById('info-scene-target-group');
    group.style.display = (val && val.value === 'scene') ? 'block' : 'none';
  }

  // ─── Save Properties ─────────────────────────────────────
  document.getElementById('btn-save-properties').addEventListener('click', function() {
    if (!selectedHotspotData) return;

    // Common
    selectedHotspotData.type = propType.value;
    selectedHotspotData.style = propType.value;
    selectedHotspotData.title = propTitle.value;
    selectedHotspotData.label = propTitle.value;
    selectedHotspotData.animation = propAnimation.value;
    selectedHotspotData.iconStyle = propIconStyle.value;
    selectedHotspotData.customIconUrl = propIconStyle.value === 'custom' ? propCustomIconUrl.value : null;
    selectedHotspotData.ringEnabled = propRingEnabled.checked;
    selectedHotspotData.iconColor = propIconColor.value;
    selectedHotspotData.ringColor = propRingColor.value;
    selectedHotspotData.iconSize = parseInt(propIconSize.value);

    // Type-specific
    if (selectedHotspotData.type === 'navigate') {
      selectedHotspotData.target = propTargetScene.value;
      selectedHotspotData.transition = propTransition.value;
      selectedHotspotData.transitionDuration = parseInt(propTransDuration.value);
    } else if (selectedHotspotData.type === 'info') {
      selectedHotspotData.text = propBodyText.value;
      selectedHotspotData.linkUrl = propLinkUrl.value;
      selectedHotspotData.linkLabel = propLinkLabel.value;
      var linkTypeVal = document.querySelector('input[name="prop-link-type"]:checked');
      selectedHotspotData.linkType = linkTypeVal ? linkTypeVal.value : 'external';
      selectedHotspotData.linkTarget = propInfoTargetScene.value;
    } else if (selectedHotspotData.type === 'url') {
      selectedHotspotData.urlHref = propUrlHref.value;
      selectedHotspotData.urlLabel = propUrlLabel.value;
      selectedHotspotData.urlOpenIn = propUrlOpenIn.value;
    } else if (selectedHotspotData.type === 'image') {
      selectedHotspotData.content = selectedHotspotData.content || {};
      selectedHotspotData.content.src = propImageUrl.value;
      selectedHotspotData.content.caption = propImageCaption.value;
      selectedHotspotData.content.linkUrl = propImageLink.value;
    } else if (selectedHotspotData.type === 'video') {
      selectedHotspotData.content = selectedHotspotData.content || {};
      selectedHotspotData.content.src = propVideoUrl.value;
      selectedHotspotData.autoplay = propVideoAutoplay.checked;
      selectedHotspotData.loop = propVideoLoop.checked;
      selectedHotspotData.muted = propVideoMuted.checked;
    } else if (selectedHotspotData.type === 'audio') {
      selectedHotspotData.content = selectedHotspotData.content || {};
      selectedHotspotData.content.src = propAudioUrl.value;
      selectedHotspotData.autoplay = propAudioAutoplay.checked;
      selectedHotspotData.showPlayerLabel = propAudioLabel.checked;
    }

    renderSceneHotspots();
    closePropertiesPanel();
    debouncedSave();
  });

  // ─── Delete Hotspot ───────────────────────────────────────
  document.getElementById('btn-delete-hotspot').addEventListener('click', function() {
    if (!selectedHotspotData || !currentSceneCtx) return;
    if (!confirm('Delete this hotspot?')) return;

    var arr = currentSceneCtx.data.hotspots || [];
    var idx = arr.indexOf(selectedHotspotData);
    if (idx !== -1) arr.splice(idx, 1);

    renderSceneHotspots();
    closePropertiesPanel();
    debouncedSave();
  });

  // ─── Close Panel ──────────────────────────────────────────
  document.getElementById('btn-close-properties').addEventListener('click', closePropertiesPanel);

  // Live label update as slider moves
  propSceneFov.addEventListener('input', function() {
    sceneFovLabel.textContent = this.value + '°';
  });

  // Apply FOV to current scene view immediately + save it
  btnApplyFov.addEventListener('click', function() {
    if (!currentSceneCtx) return;
    var fovDeg = parseInt(propSceneFov.value);
    var fovRad = fovDeg * Math.PI / 180;

    // Apply to the live Marzipano view right now
    currentSceneCtx.view.setParameters({ fov: fovRad });

    // Save into the scene data so it persists
    currentSceneCtx.data.defaultFov = fovRad;

    // Also update the initial view parameters so "Save Default View" picks it up
    if (!currentSceneCtx.data.initialViewParameters) {
      currentSceneCtx.data.initialViewParameters = { yaw: 0, pitch: 0 };
    }
    currentSceneCtx.data.initialViewParameters.fov = fovRad;

    debouncedSave();
  });

  var viewReadLoop = null;
  function startViewReadLoop() {
    if (viewReadLoop) return;
    function tick() {
      if (!currentSceneCtx) {
        viewReadLoop = null;
        return;
      }
      var view = currentSceneCtx.view;
      var params = view.parameters();
      var y = (params.yaw * 180 / Math.PI).toFixed(0);
      var p = (params.pitch * 180 / Math.PI).toFixed(0);
      var f = (params.fov * 180 / Math.PI).toFixed(0);

      // Update bottom bar (always)
      if (document.activeElement !== bottomViewYaw) bottomViewYaw.value = y;
      if (document.activeElement !== bottomViewPitch) bottomViewPitch.value = p;
      if (document.activeElement !== bottomViewFov) bottomViewFov.value = f;

      // Update side panel (if open)
      if (document.getElementById('fields-scene-settings').style.display !== 'none') {
        if (document.activeElement !== propViewYaw) propViewYaw.value = y;
        if (document.activeElement !== propViewPitch) propViewPitch.value = p;
        if (document.activeElement !== propViewFov) propViewFov.value = f;
      }
      viewReadLoop = requestAnimationFrame(tick);
    }
    viewReadLoop = requestAnimationFrame(tick);
  }

  // Handle manual input in bottom bar
  function updateCameraFromBottom() {
    if (!currentSceneCtx) return;
    var yawDeg = parseFloat(bottomViewYaw.value) || 0;
    var pitchDeg = parseFloat(bottomViewPitch.value) || 0;
    var fovDeg = parseFloat(bottomViewFov.value) || 90;
    currentSceneCtx.view.setParameters({
      yaw: yawDeg * Math.PI / 180,
      pitch: pitchDeg * Math.PI / 180,
      fov: fovDeg * Math.PI / 180
    });
  }

  [bottomViewYaw, bottomViewPitch, bottomViewFov].forEach(function(el) {
    el.addEventListener('change', updateCameraFromBottom);
    el.addEventListener('input', updateCameraFromBottom);
  });

  btnReadView.addEventListener('click', function() {
    if (!currentSceneCtx) return;
    var view = currentSceneCtx.view;
    propViewYaw.value = (view.yaw() * 180 / Math.PI).toFixed(0);
    propViewPitch.value = (view.pitch() * 180 / Math.PI).toFixed(0);
    propViewFov.value = (view.fov() * 180 / Math.PI).toFixed(0);
    // Also sync the FOV slider
    propSceneFov.value = propViewFov.value;
    sceneFovLabel.textContent = propSceneFov.value + '°';
  });

  btnApplyView.addEventListener('click', function() {
    if (!currentSceneCtx) return;
    var yawDeg = parseFloat(propViewYaw.value) || 0;
    var pitchDeg = parseFloat(propViewPitch.value) || 0;
    var fovDeg = parseFloat(propViewFov.value) || 90;
    var params = {
      yaw: yawDeg * Math.PI / 180,
      pitch: pitchDeg * Math.PI / 180,
      fov: fovDeg * Math.PI / 180
    };
    currentSceneCtx.view.setParameters(params);
    currentSceneCtx.data.initialViewParameters = params;
    currentSceneCtx.data.defaultFov = params.fov;
    debouncedSave();
    
    var originalText = this.innerHTML;
    this.textContent = '✓ Saved';
    var self = this;
    setTimeout(function() {
      self.innerHTML = originalText;
    }, 1500);
  });

  // ─── Scene Settings Save ──────────────────────────────────
  document.getElementById('btn-save-view').addEventListener('click', function() {
    if (!currentSceneCtx) return;
    currentSceneCtx.data.initialViewParameters = {
      yaw: currentSceneCtx.view.yaw(),
      pitch: currentSceneCtx.view.pitch(),
      fov: currentSceneCtx.view.fov()
    };
    debouncedSave();
    alert('Default view saved for "' + currentSceneCtx.data.name + '"');
  });

  propSceneName.addEventListener('change', function() {
    if (currentSceneCtx) {
      currentSceneCtx.data.name = this.value;
      renderSceneGrid();
      debouncedSave();
    }
  });

  propFloorplanEnabled.addEventListener('change', function() {
    if (!data.floorplan) data.floorplan = {};
    data.floorplan.enabled = this.checked;
    
    if (!data.settings) data.settings = {};
    data.settings.showMinimap = this.checked;

    // Sync the bottom toolbar button state
    var minimapBtn = Array.prototype.find.call(pillTools, function(btn) {
      return btn.getAttribute('data-tool') === 'minimap';
    });
    if (minimapBtn) {
      if (this.checked) minimapBtn.classList.add('active');
      else minimapBtn.classList.remove('active');
    }
    
    var minimapEl = document.getElementById('xeno-minimap');
    if (this.checked) {
      window.initMinimap();
      if (minimapEl) minimapEl.style.display = 'block';
    } else {
      if (minimapEl) minimapEl.style.display = 'none';
    }
    
    debouncedSave();
  });

  propFloorplanUrl.addEventListener('change', function() {
    if (!data.floorplan) data.floorplan = {};
    data.floorplan.imageUrl = this.value;
    window.initMinimap();
    debouncedSave();
  });

  // ─── Populate Target Dropdowns ────────────────────────────
  function populateTargetDropdowns() {
    var currentSceneId = currentSceneCtx ? currentSceneCtx.data.id : null;
    
    [propTargetScene, propInfoTargetScene].forEach(function(sel) {
      if (!sel) return;
      var lastValue = sel.value;
      sel.innerHTML = '<option value="">-- select --</option>';
      scenes.forEach(function(s) {
        // Exclude the current scene from the dropdown
        if (s.data.id === currentSceneId) return;

        var opt = document.createElement('option');
        opt.value = s.data.id;
        opt.textContent = s.data.name;
        sel.appendChild(opt);
      });
      // Restore previous selection if it still exists
      sel.value = lastValue;
    });
  }

  // ─── Add Scene Helper ─────────────────────────────────────
  function addSceneFromUrl(url, name) {
    var newId = 'scene_' + Date.now();
    var cleanName = (name || 'Untitled').replace(/\.[^/.]+$/, "");
    var sData = {
      id: newId,
      name: cleanName,
      type: 'image',
      mediaUrl: url,
      thumbnailUrl: url,
      initialViewParameters: { yaw: 0, pitch: 0, fov: 1.57 },
      hotspots: []
    };

    data.scenes.push(sData);

    var source = Xeno.ImageUrlSource.fromString(sData.mediaUrl);
    var geometry = new Xeno.EquirectGeometry([{ width: 4000 }]);
    var limiter = Xeno.RectilinearView.limit.traditional(1024, 140 * Math.PI / 180);
    var view = new Xeno.RectilinearView(sData.initialViewParameters, limiter);
    var scene = viewer.createScene({ source: source, geometry: geometry, view: view, pinFirstLevel: true });
    scenes.push({ data: sData, scene: scene, view: view });

    renderSceneGrid();
    switchSceneById(newId);
    debouncedSave();
  }

  // ─── Video Scene Helper ───────────────────────────────────
  function addVideoSceneFromUrl(url, name) {
    var newId = 'scene_' + Date.now();
    var cleanName = (name || 'Untitled Video').replace(/\.[^/.]+$/, "");
    var sData = {
      id: newId,
      name: cleanName,
      type: 'video',
      mediaUrl: url,
      thumbnailUrl: 'img/photo.png', // Fallback thumbnail
      initialViewParameters: { yaw: 0, pitch: 0, fov: 1.57 },
      videoOptions: { autoplay: true, loop: true, muted: true },
      hotspots: []
    };

    data.scenes.push(sData);

    var asset = new XenoVideoAsset();
    asset.setVideo(sData.mediaUrl, sData.videoOptions);
    var source = new Xeno.SingleAssetSource(asset);
    var geometry = new Xeno.EquirectGeometry([{ width: 1 }]);
    var limiter = Xeno.RectilinearView.limit.vfov(90*Math.PI/180, 90*Math.PI/180);
    var view = new Xeno.RectilinearView(sData.initialViewParameters, limiter);
    var scene = viewer.createScene({ source: source, geometry: geometry, view: view, pinFirstLevel: true });
    scenes.push({ data: sData, scene: scene, view: view });

    renderSceneGrid();
    switchSceneById(newId);
    debouncedSave();
  }

  // ─── Media Manager ────────────────────────────────────────
  var currentAlbumId = null;
  var selectedMediaIds = new Set(); // Set of media.id strings
  var selectedMediaMap = {}; // id → full media object
  var lastClickedMediaIndex = null; // for shift-click range
  var mediaListCache = []; // current flat array for indexing

  document.getElementById('btn-media-manager').addEventListener('click', function() {
    mediaModal.classList.add('visible');
    loadAlbums();
    loadMedia(currentAlbumId);
  });

  document.getElementById('btn-close-media').addEventListener('click', function() {
    mediaModal.classList.remove('visible');
  });

  var btnAddAlbum = document.querySelector('.media-sidebar .btn-primary');
  var albumListEl = document.querySelector('.album-list');
  var mediaGridEl = document.getElementById('media-grid');

  if (btnAddAlbum) {
    btnAddAlbum.addEventListener('click', function() {
      var name = prompt('Enter album name:');
      if (name) {
        window.XenoSupabase.createAlbum(name).then(function() { loadAlbums(); })
          .catch(function(err) { alert('Error: ' + err.message); });
      }
    });
  }

  function loadAlbums() {
    window.XenoSupabase.fetchAlbums().then(function(albums) {
      albumListEl.innerHTML = '';

      var rootEl = document.createElement('div');
      rootEl.className = 'album-item' + (currentAlbumId === null ? ' active' : '');
      rootEl.innerHTML = '<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"13\" height=\"13\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z\"/></svg> Root';
      rootEl.addEventListener('click', function() { currentAlbumId = null; loadAlbums(); loadMedia(null); });
      albumListEl.appendChild(rootEl);

      albums.forEach(function(album) {
        var el = document.createElement('div');
        el.className = 'album-item' + (currentAlbumId === album.id ? ' active' : '');
        el.innerHTML = '<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"13\" height=\"13\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z\"/></svg> ' + album.name;
        el.addEventListener('click', function() { currentAlbumId = album.id; loadAlbums(); loadMedia(album.id); });
        
        // Right click album context menu
        el.addEventListener('contextmenu', function(e) {
          e.preventDefault();
          e.stopPropagation();
          albumCtxTarget = album;

          // Hide other menus
          contextMenu.style.display = 'none';
          mediaItemCtx.style.display = 'none';

          mediaFolderCtx.style.display = 'block';
          mediaFolderCtx.style.left = e.clientX + 'px';
          mediaFolderCtx.style.top = e.clientY + 'px';
        });

        albumListEl.appendChild(el);
      });
    });
  }

  function syncMediaSelection() {
    var mediaGrid = document.getElementById('media-grid');
    var mediaItems = mediaGrid.querySelectorAll('.media-item');
    mediaItems.forEach(function(item) {
      var mediaId = item.__mediaData.id;
      if (selectedMediaIds.has(mediaId)) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });

    var mediaActionBar = document.getElementById('media-action-bar');
    var mediaSelCount = document.getElementById('media-sel-count');
    if (selectedMediaIds.size > 0) {
      mediaSelCount.textContent = selectedMediaIds.size + ' selected';
      mediaActionBar.style.display = 'flex';
    } else {
      mediaActionBar.style.display = 'none';
    }
  }

  function loadMedia(albumId) {
    selectedMediaIds.clear();
    selectedMediaMap = {};
    lastClickedMediaIndex = null;
    mediaListCache = [];
    syncMediaSelection(); // Update UI to reflect cleared selection
    mediaGridEl.innerHTML = '<div class="media-loading"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" class=\"spin\"><path d=\"M21 12a9 9 0 1 1-6.219-8.56\"/></svg> Loading...</div>';
    window.XenoSupabase.fetchMedia(albumId).then(function(mediaList) {
      mediaListCache = mediaList; // Populate cache
      mediaGridEl.innerHTML = '';
      mediaList.forEach(function(media, index) {
        var item = document.createElement('div');
        item.className = 'media-item';
        item.style.position = 'relative';
        item.__mediaIndex = index; // Store index
        item.__mediaData = media; // Store full media object
        
        var thumb = (media.type && media.type.startsWith('video')) ? '' : media.url;
        var imgHtml = '';
        if (thumb) {
          imgHtml = '<img src="' + thumb + '" onerror="this.outerHTML=\'<div class=&quot;media-thumb-placeholder&quot;>Broken</div>\'">';
        } else {
          var isVideo = media.type && media.type.startsWith('video');
          var isAudio = media.type && media.type.startsWith('audio');
          var iconClass = isVideo ? 'ti-video' : (isAudio ? 'ti-volume' : 'ti-file');
          var fileLabel = isVideo ? 'Video' : (isAudio ? 'Audio' : 'File');
          imgHtml = '<div class="media-thumb-placeholder"><i class="ti ' + iconClass + '"></i>' + fileLabel + '</div>';
        }
        
        var badgeHtml = '';
        if (media.is_ephemeral) {
          badgeHtml = '<div class="media-ephemeral-badge"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"10\" height=\"10\" viewBox=\"0 0 24 24\" fill=\"currentColor\" stroke=\"none\"><polygon points=\"13 2 3 14 12 14 11 22 21 10 12 10 13 2\"/></svg> Ephemeral</div>';
        }
        
        item.innerHTML = badgeHtml + imgHtml + '<div class="title">' + media.filename + '</div>';
        
        item.addEventListener('click', function(e) {
          if (mediaPickerCallback) {
            mediaPickerCallback(media.url, media.filename);
            mediaPickerCallback = null;
            mediaModal.classList.remove('visible');
            return;
          }

          // Multi-select logic
          var mediaId = media.id;
          if (e.shiftKey && lastClickedMediaIndex !== null) {
            var startIndex = Math.min(lastClickedMediaIndex, index);
            var endIndex = Math.max(lastClickedMediaIndex, index);
            for (var i = startIndex; i <= endIndex; i++) {
              var currentMedia = mediaListCache[i];
              selectedMediaIds.add(currentMedia.id);
              selectedMediaMap[currentMedia.id] = currentMedia;
            }
          } else {
            if (selectedMediaIds.has(mediaId)) {
              selectedMediaIds.delete(mediaId);
              delete selectedMediaMap[mediaId];
            } else {
              selectedMediaIds.add(mediaId);
              selectedMediaMap[mediaId] = media;
            }
          }
          lastClickedMediaIndex = index;
          syncMediaSelection();
        });

        // Right click media item context menu
        item.addEventListener('contextmenu', function(e) {
          e.preventDefault();
          e.stopPropagation();
          mediaCtxTarget = media;

          // Hide other menus
          contextMenu.style.display = 'none';
          mediaFolderCtx.style.display = 'none';

          mediaItemCtx.style.display = 'block';
          mediaItemCtx.style.left = e.clientX + 'px';
          mediaItemCtx.style.top = e.clientY + 'px';
        });

        mediaGridEl.appendChild(item);
      });
    }).catch(function(err) {
      mediaGridEl.innerHTML = '<div class="media-error"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z\"/><line x1=\"12\" y1=\"9\" x2=\"12\" y2=\"13\"/><line x1=\"12\" y1=\"17\" x2=\"12.01\" y2=\"17\"/></svg> Error: ' + err.message + '</div>';
    });
  }

  // ─── Album Context Menu Action Listeners ────────────────────
  mediaFolderCtx.querySelectorAll('.ctx-item').forEach(function(item) {
    item.addEventListener('click', function(e) {
      e.stopPropagation();
      if (!albumCtxTarget) return;
      var targetAlbum = albumCtxTarget; // Capture in local variable to avoid race conditions when cleared synchronously
      var action = this.getAttribute('data-action');

      if (action === 'rename-folder') {
        var newName = prompt('Rename Album:', targetAlbum.name);
        if (newName && newName.trim() !== '') {
          window.XenoSupabase.renameAlbum(targetAlbum.id, newName.trim())
            .then(function() {
              loadAlbums();
            })
            .catch(function(err) {
              alert('Error renaming album: ' + err.message);
            });
        }
      } else if (action === 'delete-folder') {
        if (confirm('Are you sure you want to delete album "' + targetAlbum.name + '"? Contained media will be moved back to Root.')) {
          window.XenoSupabase.deleteAlbum(targetAlbum.id)
            .then(function() {
              if (currentAlbumId === targetAlbum.id) {
                currentAlbumId = null;
              }
              loadAlbums();
              loadMedia(currentAlbumId);
            })
            .catch(function(err) {
              alert('Error deleting album: ' + err.message);
            });
        }
      }
      albumCtxTarget = null;
      mediaFolderCtx.style.display = 'none';
    });
  });

  // ─── Media Context Menu Action Listeners ────────────────────
  mediaItemCtx.querySelectorAll('.ctx-item').forEach(function(item) {
    item.addEventListener('click', function(e) {
      e.stopPropagation();
      if (!mediaCtxTarget) return;
      var targetMedia = mediaCtxTarget; // Capture in local variable for closure robustness
      var action = this.getAttribute('data-action');

      if (action === 'rename-media') {
        var newName = prompt('Rename Media:', targetMedia.filename);
        if (newName && newName.trim() !== '') {
          window.XenoSupabase.renameMedia(targetMedia.id, newName.trim())
            .then(function() {
              loadMedia(currentAlbumId);
            })
            .catch(function(err) {
              alert('Error renaming media: ' + err.message);
            });
        }
      } else if (action === 'delete-media') {
        if (confirm('Are you sure you want to delete "' + targetMedia.filename + '" from cloud storage and database? This cannot be undone.')) {
          window.XenoSupabase.deleteMedia(targetMedia.id, targetMedia.url)
            .then(function() {
              loadMedia(currentAlbumId);
            })
            .catch(function(err) {
              alert('Error deleting media: ' + err.message);
            });
        }
      } else if (action === 'move-media') {
        openMoveMediaModal();
      } else if (action === 'download-media') {
        downloadMediaFile(targetMedia.url, targetMedia.filename);
      }

      if (action !== 'move-media') {
        mediaCtxTarget = null;
      }
      mediaItemCtx.style.display = 'none';
    });
  });

  // ─── Move Media Dialog Logic ────────────────────────────────
  function openMoveMediaModal() {
    if (!mediaCtxTarget) return;

    window.XenoSupabase.fetchAlbums().then(function(albums) {
      moveTargetAlbum.innerHTML = '';

      var rootOpt = document.createElement('option');
      rootOpt.value = '';
      rootOpt.textContent = '📁 Root (No Album)';
      moveTargetAlbum.appendChild(rootOpt);

      albums.forEach(function(album) {
        var opt = document.createElement('option');
        opt.value = album.id;
        opt.textContent = '📁 ' + album.name;
        if (mediaCtxTarget.album_id === album.id) {
          opt.selected = true;
        }
        moveTargetAlbum.appendChild(opt);
      });

      moveMediaModal.style.display = 'flex';
    }).catch(function(err) {
      alert('Error fetching albums: ' + err.message);
    });
  }

  function closeMoveMediaModal() {
    moveMediaModal.style.display = 'none';
    mediaCtxTarget = null;
  }

  if (btnCancelMove) {
    btnCancelMove.addEventListener('click', closeMoveMediaModal);
  }
  if (btnCloseMoveModal) {
    btnCloseMoveModal.addEventListener('click', closeMoveMediaModal);
  }
  if (btnConfirmMove) {
    btnConfirmMove.addEventListener('click', function() {
      if (!mediaCtxTarget) return;
      var targetAlbumId = moveTargetAlbum.value || null;

      window.XenoSupabase.moveMedia(mediaCtxTarget.id, targetAlbumId)
        .then(function() {
          closeMoveMediaModal();
          loadMedia(currentAlbumId);
        })
        .catch(function(err) {
          alert('Error moving media: ' + err.message);
        });
    });
  }

  // ─── Elegant CORS/Blob Download Helper ──────────────────────
  function downloadMediaFile(url, filename) {
    fetch(url)
      .then(function(r) { return r.blob(); })
      .then(function(blob) {
        var blobUrl = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      })
      .catch(function(err) {
        console.warn('CORS blob download failed, falling back to new tab', err);
        window.open(url, '_blank');
      });
  }


  // Upload
  var uploadArea = document.getElementById('media-upload-area');
  var fileInput = document.getElementById('media-file-input');

  if (uploadArea) {
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

  function handleFiles(files) {
    uploadArea.innerHTML = '<h3>Uploading...</h3><p>Please wait.</p>';
    var promises = [];
    for (var i = 0; i < files.length; i++) {
      promises.push(window.XenoSupabase.uploadAndRecordMedia(files[i], currentAlbumId));
    }
    Promise.all(promises).then(function() {
      uploadArea.innerHTML = '<h3>Upload Media</h3><p>Drag & drop images, video or audio here or click to browse</p>';
      loadMedia(currentAlbumId);
    }).catch(function(err) {
      alert('Error uploading: ' + err.message);
      uploadArea.innerHTML = '<h3>Upload Media</h3><p>Drag & drop images, video or audio here or click to browse</p>';
    });
  }

  // ─── Workspace Header Action Handlers ───────────────────────
  var logoBack = document.getElementById('logo-back');
  if (logoBack) {
    logoBack.addEventListener('click', function() {
      window.location.search = ''; // back to dashboard
    });
  }

  var btnPreview = document.getElementById('btn-preview-tour');
  if (btnPreview) {
    btnPreview.addEventListener('click', function() {
      if (projectSlug) {
        window.open('preview.html?project=' + encodeURIComponent(projectSlug), '_blank');
      }
    });
  }

  var btnExport = document.getElementById('btn-export');
  if (btnExport) {
    btnExport.addEventListener('click', function() {
      if (!window.JSZip) {
        alert('JSZip library is not loaded.');
        return;
      }
      
      var exportBtn = this;
      var originalText = exportBtn.innerHTML;
      exportBtn.innerHTML = '<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" class=\"spin\"><path d=\"M21 12a9 9 0 1 1-6.219-8.56\"/></svg> Exporting...';
      exportBtn.disabled = true;
      
      var zip = new window.JSZip();
      
      var filesToBundle = [
        'css/viewer.css',
        'css/hotspots.css',
        'css/minimap.css',
        'css/hint.css',
        'js/vendor/screenfull.js',
        'js/vendor/webvr-polyfill.js',
        'js/xeno.js',
        'js/transitions.js',
        'js/VideoAsset.js',
        'js/DeviceOrientation.js',
        'js/colorEffects.js',
        'js/hotspots/HotspotFactory.js',
        'js/ui/Minimap.js',
        'js/ui/SceneList.js',
        'js/ui/Supabase.js',
        'js/viewer.js',
        'config.example.js'
      ];

      var imagesToBundle = [
        'img/link.png',
        'img/photo.png',
        'img/info.png',
        'img/hotspot.png',
        'img/logo.png',
        'img/tooltip.svg'
      ];

      // Clone data to avoid altering active workspace state
      var exportedData = JSON.parse(JSON.stringify(window.data));
      var mediaPromises = [];

      exportedData.scenes.forEach(function(sceneData) {
        var originalUrl = sceneData.mediaUrl;
        if (originalUrl) {
          // Determine extension
          var ext = 'jpg';
          if (originalUrl.indexOf('.png') !== -1) ext = 'png';
          else if (originalUrl.indexOf('.gif') !== -1) ext = 'gif';
          
          var filename = 'scene_' + sceneData.id + '.' + ext;
          var relativePath = 'media/' + filename;
          
          var p = fetch(originalUrl)
            .then(function(res) {
              if (!res.ok) throw new Error('Failed to fetch media for scene: ' + sceneData.name);
              return res.blob();
            })
            .then(function(blob) {
              zip.file(relativePath, blob);
              sceneData.mediaUrl = relativePath;
              if (sceneData.thumbnailUrl) {
                sceneData.thumbnailUrl = relativePath;
              }
            })
            .catch(function(err) {
              console.warn('Could not bundle media for scene ' + sceneData.name + ', keeping original URL.', err);
            });
          mediaPromises.push(p);
        }
      });

      // Add dynamic data.js when media promises resolve
      var makeDataJsContent = function() {
        return 'var data = ' + JSON.stringify(exportedData, null, 2) + ';\n';
      };

      // Add README.txt
      var readmeContent = 
        "Xeno 360° Tour Export\n" +
        "=====================\n\n" +
        "This tour was exported from Xeno 360° Tour Platform.\n\n" +
        "Running the Tour Locally:\n" +
        "-------------------------\n" +
        "For security reasons, modern web browsers restrict local file access (CORS policies)\n" +
        "when opening files directly using the file:// protocol (e.g. by double-clicking index.html).\n\n" +
        "To view this tour locally, you must run it through a local HTTP server:\n" +
        "- If you have Node.js installed, run:\n" +
        "    npx serve\n" +
        "  or\n" +
        "    npm install -g http-server && http-server\n\n" +
        "- If you have Python installed, run:\n" +
        "    python -m http.server 8000\n" +
        "  and open http://localhost:8000 in your browser.\n\n" +
        "- Or deploy it directly to a static hosting service like Vercel, Netlify, or GitHub Pages.\n";
      zip.file('README.txt', readmeContent);

      var fetchPromises = filesToBundle.map(function(path) {
        return fetch(path)
          .then(function(res) {
            if (!res.ok) throw new Error('Failed to fetch ' + path);
            return res.text();
          })
          .then(function(content) {
            zip.file(path, content);
          });
      });

      var imagePromises = imagesToBundle.map(function(path) {
        return fetch(path)
          .then(function(res) {
            if (!res.ok) throw new Error('Failed to fetch ' + path);
            return res.blob();
          })
          .then(function(blob) {
            zip.file(path, blob);
          });
      });

      var previewHtmlPromise = fetch('preview.html')
        .then(function(res) {
          if (!res.ok) throw new Error('Failed to fetch preview.html');
          return res.text();
        })
        .then(function(html) {
          // Inside ZIP, preview.html serves as index.html
          var injectedHtml = html.replace('<head>', '<head>\n  <script>window.isExported = true;</script>');
          zip.file('index.html', injectedHtml);
        });

      var allPromises = fetchPromises.concat(imagePromises).concat(mediaPromises);
      allPromises.push(previewHtmlPromise);

      Promise.all(allPromises)
        .then(function() {
          // Write compiled data.js after all scene rewrites have finished!
          zip.file('data.js', makeDataJsContent());
          return zip.generateAsync({ type: 'blob' });
        })
        .then(function(blob) {
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = url;
          a.download = (projectSlug || 'xeno-tour') + '.zip';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          exportBtn.innerHTML = originalText;
          exportBtn.disabled = false;
        })
        .catch(function(err) {
          alert('ZIP export failed: ' + err.message);
          exportBtn.innerHTML = originalText;
          exportBtn.disabled = false;
        });
    });
  }

    // ─── Start Editor logic inside the function ─────────────────
    renderSceneGrid();
    if (scenes.length > 0) {
      switchSceneById(scenes[0].data.id);
      startViewReadLoop();
    }
  }

  // ─── Dashboard Helper Functions ─────────────────────────────
  function initDashboard() {
    var searchInput = document.getElementById('project-search');
    var btnNewProject = document.getElementById('btn-new-project');
    
    if (searchInput) {
      searchInput.addEventListener('input', function() {
        loadDashboard(this.value);
      });
    }
    
    if (btnNewProject) {
      btnNewProject.addEventListener('click', function() {
        var name = prompt('Enter project name:');
        if (name && name.trim() !== '') {
          var slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          if (!slug) slug = 'project-' + Date.now();
          
          var blankData = {
            settings: {
              title: name.trim(),
              name: name.trim(),
              mouseViewMode: "drag",
              autorotateEnabled: false,
              autorotateSpeed: 0.03,
              autorotateInactivityDelay: 3000,
              fullscreenButton: true,
              sceneListStyle: "sidebar",
              showMinimap: false,
              minimapPosition: "bottom-left",
              showControls: true,
              gyroscopeEnabled: false,
              vrEnabled: false,
              defaultTransition: "opacity",
              defaultTransitionDuration: 1000,
              defaultTransitionEasing: "easeInOut",
              branding: { logoUrl: null, accentColor: "#e62e5a", logoPosition: "top-left" },
              intro: { enabled: false, title: "", subtitle: "", buttonText: "Enter Tour" }
            },
            scenes: [],
            floorplan: { enabled: false, imageUrl: "media/floorplan.jpg", width: 800, height: 600 }
          };
          window.XenoSupabase.saveTour(slug, blankData);
          window.location.search = '?project=' + encodeURIComponent(slug);
        }
      });
    }
    
    loadDashboard();
  }
  
  function loadDashboard(filterQuery) {
    if (!window.XenoSupabase) return;
    window.XenoSupabase.fetchTours().then(function(tours) {
      var filtered = tours;
      if (filterQuery) {
        var query = filterQuery.trim().toLowerCase();
        filtered = tours.filter(function(t) {
          var title = (t.data.settings.name || t.data.settings.title || t.slug).toLowerCase();
          return title.indexOf(query) !== -1;
        });
      }
      
      var grid = document.getElementById('project-grid');
      var countEl = document.getElementById('project-count');
      if (countEl) countEl.textContent = filtered.length;
      
      if (!grid) return;
      grid.innerHTML = '';
      
      filtered.forEach(function(tour) {
        var card = document.createElement('div');
        card.className = 'project-card';
        
        var firstScene = (tour.data && tour.data.scenes && tour.data.scenes[0]) || null;
        var thumb = (firstScene && (firstScene.thumbnailUrl || firstScene.mediaUrl)) || 'img/photo.png';
        var sceneCount = (tour.data && tour.data.scenes && tour.data.scenes.length) || 0;
        var title = tour.data.settings.name || tour.data.settings.title || tour.slug;
        
        card.innerHTML = 
          '<div class="project-card-thumb-wrapper">' +
            '<img class="project-card-thumb" src="' + thumb + '" alt="Tour Thumbnail">' +
            '<div class="project-card-scenes-badge">' + sceneCount + ' Scene' + (sceneCount !== 1 ? 's' : '') + '</div>' +
          '</div>' +
          '<div class="project-card-info">' +
            '<h4 class="project-card-title">' + title + '</h4>' +
            '<div class="project-card-meta">' +
              '<span class="project-card-status">Published</span>' +
              '<span class="project-card-date">' + new Date(tour.updated_at).toLocaleDateString() + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="project-card-actions">' +
            '<button class="btn-delete-project" title="Delete Project"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"13\" height=\"13\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polyline points=\"3 6 5 6 21 6\"/><path d=\"M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2\"/></svg></button>' +
          '</div>';
          
        card.addEventListener('click', function() {
          window.location.search = '?project=' + encodeURIComponent(tour.slug);
        });
        
        var delBtn = card.querySelector('.btn-delete-project');
        delBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          if (confirm('Are you sure you want to delete project "' + title + '"?')) {
            window.XenoSupabase.deleteTour(tour.slug);
            loadDashboard(filterQuery);
          }
        });
        
        grid.appendChild(card);
      });
    });
  }

  function showToast(msg) {
    var toast = document.querySelector('.xeno-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'xeno-toast';
      document.body.appendChild(toast);
    }
    toast.innerHTML = '<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"10\"/><line x1=\"12\" y1=\"8\" x2=\"12\" y2=\"12\"/><line x1=\"12\" y1=\"16\" x2=\"12.01\" y2=\"16\"/></svg> ' + msg;
    toast.classList.add('visible');
    
    if (toast.timeoutId) clearTimeout(toast.timeoutId);
    toast.timeoutId = setTimeout(function() {
      toast.classList.remove('visible');
    }, 3000);
  }

})();