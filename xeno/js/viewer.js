/*
 * Xeno — Universal Viewer Main Logic
 * Assembled from Marzipano sample-tour and adapted for universal support.
 */
'use strict';

(function() {
  var Xeno = window.Xeno;
  var bowser = window.bowser;
  var screenfull = window.screenfull;
  
  if (window.XenoSupabase) {
    window.XenoSupabase.init();
  }
  
  var data = window.data;
  if (!window.isExported) {
    var previewSlug = new URLSearchParams(window.location.search).get('project') || 'sample-tour';
    var savedData = window.XenoSupabase ? window.XenoSupabase.loadTour(previewSlug) : null;
    if (savedData) {
      window.data = savedData;
      data = savedData;
    }
  }

  // Grab elements from DOM.
  var panoElement = document.querySelector('#pano');
  var sceneNameElement = document.querySelector('#titleBar .sceneName');
  var sceneListElement = document.querySelector('#sceneList');
  var sceneElements = document.querySelectorAll('#sceneList .scene');
  var sceneListToggleElement = document.querySelector('#sceneListToggle');
  var autorotateToggleElement = document.querySelector('#autorotateToggle');
  var fullscreenToggleElement = document.querySelector('#fullscreenToggle');

  // Detect desktop or mobile mode.
  if (window.matchMedia) {
    var setMode = function() {
      if (mql.matches) {
        document.body.classList.remove('desktop');
        document.body.classList.add('mobile');
      } else {
        document.body.classList.remove('mobile');
        document.body.classList.add('desktop');
      }
    };
    var mql = matchMedia("(max-width: 500px), (max-height: 500px)");
    setMode();
    mql.addListener(setMode);
  } else {
    document.body.classList.add('desktop');
  }

  // Detect whether we are on a touch device.
  document.body.classList.add('no-touch');
  window.addEventListener('touchstart', function() {
    document.body.classList.remove('no-touch');
    document.body.classList.add('touch');
  });

  // Use tooltip fallback mode on IE < 11.
  if (bowser.msie && parseFloat(bowser.version) < 11) {
    document.body.classList.add('tooltip-fallback');
  }

  // Viewer options.
  var viewerOpts = {
    controls: {
      mouseViewMode: data.settings.mouseViewMode || 'drag'
    }
  };

  // Initialize viewer.
  var viewer = new Xeno.Viewer(panoElement, viewerOpts);
  window.xenoViewer = viewer; // export for editor

  // Source builder
  function buildSource(sceneData) {
    if (sceneData.type === 'video') {
      if (window.XenoVideoAsset) {
        var asset = new XenoVideoAsset();
        asset.setVideo(sceneData.mediaUrl, sceneData.videoOptions);
        return new Xeno.SingleAssetSource(asset);
      }
      return new Xeno.SingleAssetSource(new Xeno.DynamicAsset(document.createElement('canvas')));
    }
    if (sceneData.urlTemplate) {
      return Xeno.ImageUrlSource.fromString(sceneData.urlTemplate,
        { cubeMapPreviewUrl: sceneData.mediaUrl });
    }
    return Xeno.ImageUrlSource.fromString(sceneData.mediaUrl);
  }

  // Geometry builder
  function buildGeometry(sceneData) {
    if (sceneData.type === 'video') return new Xeno.EquirectGeometry([{ width: 1 }]);
    if (sceneData.levels) return new Xeno.CubeGeometry(sceneData.levels);
    return new Xeno.EquirectGeometry([{ width: 1 }]);
  }

  // Create scenes.
  var scenes = data.scenes.map(function(sceneData) {
    var source = buildSource(sceneData);
    var geometry = buildGeometry(sceneData);

    var faceSize = sceneData.faceSize || 2048;
    var fovLimit = sceneData.type === 'video' ? (90*Math.PI/180) : (120*Math.PI/180);
    var limiter = sceneData.type === 'video' 
        ? Xeno.RectilinearView.limit.vfov(fovLimit, fovLimit)
        : Xeno.RectilinearView.limit.traditional(faceSize, 100*Math.PI/180, fovLimit);

    var view = new Xeno.RectilinearView(sceneData.initialViewParameters, limiter);

    var scene = viewer.createScene({
      source: source,
      geometry: geometry,
      view: view,
      pinFirstLevel: true
    });

    var sceneContext = {
      data: sceneData,
      scene: scene,
      view: view
    };

    // Hotspot creation (uses HotspotFactory if loaded)
    if (window.HotspotFactory) {
      if (sceneData.hotspots) {
        sceneData.hotspots.forEach(function(hs) {
          HotspotFactory.create(scene, hs, hs.type || 'info', switchScene, findSceneById);
        });
      }
      if (sceneData.linkHotspots) {
        sceneData.linkHotspots.forEach(function(hs) { HotspotFactory.create(scene, hs, 'link', switchScene, findSceneById); });
      }
      if (sceneData.infoHotspots) {
        sceneData.infoHotspots.forEach(function(hs) { HotspotFactory.create(scene, hs, 'info', switchScene, findSceneById); });
      }
      if (sceneData.mediaHotspots) {
        sceneData.mediaHotspots.forEach(function(hs) { HotspotFactory.create(scene, hs, 'media', switchScene, findSceneById); });
      }
    }

    // Apply color effects
    if (window.colorEffects) {
      applyColorEffects(sceneContext);
    }

    return sceneContext;
  });

  window.xenoScenes = scenes; // export for editor

  // Initialize UI modules after scenes are loaded to avoid race condition
  if (window.initSceneList) {
    window.initSceneList();
  }
  if (window.initMinimap) {
    window.initMinimap();
  }

  function applyColorEffects(sceneCtx) {
    if (window.colorEffects && sceneCtx.data.colorEffects) {
      var ce = sceneCtx.data.colorEffects;
      var effect = Xeno.colorEffects.identity();
      effect = colorEffects.brightness(ce.brightness - 1, effect);
      effect = colorEffects.contrast(ce.contrast, effect);
      effect = colorEffects.saturation(ce.saturation, effect);
      sceneCtx.scene.layer().setEffects({ colorMatrix: effect.colorMatrix, colorOffset: effect.colorOffset });
    }
  }

  // Set up autorotate, if enabled.
  var autorotate = Xeno.autorotate({
    yawSpeed: data.settings.autorotateSpeed || 0.03,
    targetPitch: 0,
    targetFov: Math.PI/2
  });
  
  // Intro Screen
  var introScreen = document.getElementById('intro-screen');
  var startTourBtn = document.getElementById('btn-start-tour');
  var introTitle = document.getElementById('intro-title');

  if (introTitle && data.settings && data.settings.name) {
    introTitle.textContent = data.settings.name;
  }

  if (data.settings.autorotateEnabled && autorotateToggleElement) {
    autorotateToggleElement.classList.add('enabled');
    autorotateToggleElement.classList.add('active');
  }

  if (startTourBtn && introScreen) {
    startTourBtn.addEventListener('click', function() {
      introScreen.classList.add('hidden');
      if (data.settings.autorotateEnabled) {
        startAutorotate();
      }
    });
  } else if (data.settings.autorotateEnabled) {
    startAutorotate();
  }

  autorotateToggleElement.addEventListener('click', toggleAutorotate);

  // Set up fullscreen mode, if supported.
  if (screenfull.enabled && data.settings.fullscreenButton) {
    document.body.classList.add('fullscreen-enabled');
    fullscreenToggleElement.addEventListener('click', function() {
      screenfull.toggle();
    });
    screenfull.on('change', function() {
      if (screenfull.isFullscreen) {
        fullscreenToggleElement.classList.add('enabled');
      } else {
        fullscreenToggleElement.classList.remove('enabled');
      }
    });
  } else {
    document.body.classList.add('fullscreen-disabled');
  }

  // Set handler for scene list toggle.
  if (sceneListToggleElement) {
    sceneListToggleElement.addEventListener('click', toggleSceneList);
  }

  // Start with the scene list open on desktop.
  if (!document.body.classList.contains('mobile') && sceneListToggleElement) {
    showSceneList();
  }

  // DOM elements for view controls.
  var viewUpElement = document.querySelector('#viewUp');
  var viewDownElement = document.querySelector('#viewDown');
  var viewLeftElement = document.querySelector('#viewLeft');
  var viewRightElement = document.querySelector('#viewRight');

  var velocity = 0.7;
  var friction = 3;

  var controls = viewer.controls();
  if (viewUpElement) controls.registerMethod('upElement', new Xeno.ElementPressControlMethod(viewUpElement, 'y', -velocity, friction), true);
  if (viewDownElement) controls.registerMethod('downElement', new Xeno.ElementPressControlMethod(viewDownElement, 'y', velocity, friction), true);
  if (viewLeftElement) controls.registerMethod('leftElement', new Xeno.ElementPressControlMethod(viewLeftElement, 'x', -velocity, friction), true);
  if (viewRightElement) controls.registerMethod('rightElement', new Xeno.ElementPressControlMethod(viewRightElement, 'x', velocity, friction), true);

  function sanitize(s) {
    return (s || '').replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;');
  }

  function linear(t) { return t; }

  function switchScene(sceneCtx, transOpts) {
    stopAutorotate();
    sceneCtx.view.setParameters(sceneCtx.data.initialViewParameters);
    
    // Hotspot-level overrides (transOpts) take priority over scene-level, then global defaults
    transOpts = transOpts || {};
    var transType = transOpts.transition || sceneCtx.data.transition || data.settings.defaultTransition || 'opacity';
    var transTime = transOpts.transitionDuration || sceneCtx.data.transitionDuration || data.settings.defaultTransitionDuration || 1000;
    var easeName = data.settings.defaultTransitionEasing || 'easeInOut';
    var ease = window.XenoTransitions ? (XenoTransitions.easings[easeName] || linear) : linear;
    var transUpdate = (transType === 'none' || !window.XenoTransitions) ? null : (XenoTransitions.functions[transType] ? XenoTransitions.functions[transType](ease) : null);
    
    sceneCtx.scene.switchTo({ transitionDuration: transTime, transitionUpdate: transUpdate }, function() {
      startAutorotate();
    });
    
    if (window.colorEffects) {
      applyColorEffects(sceneCtx);
    }

    updateSceneName(sceneCtx);
    if (window.updateSceneList) updateSceneList(sceneCtx); // from SceneList.js
    if (window.updateMinimap) updateMinimap(sceneCtx);     // from Minimap.js
  }
  
  window.xenoSwitchScene = switchScene;

  function updateSceneName(sceneCtx) {
    if (sceneNameElement) sceneNameElement.innerHTML = sanitize(sceneCtx.data.name);
  }

  function showSceneList() {
    if (sceneListElement) sceneListElement.classList.add('enabled');
    if (sceneListToggleElement) sceneListToggleElement.classList.add('enabled');
  }

  function hideSceneList() {
    if (sceneListElement) sceneListElement.classList.remove('enabled');
    if (sceneListToggleElement) sceneListToggleElement.classList.remove('enabled');
  }

  function toggleSceneList() {
    if (sceneListElement) sceneListElement.classList.toggle('enabled');
    if (sceneListToggleElement) sceneListToggleElement.classList.toggle('enabled');
  }

  function startAutorotate() {
    if (!autorotateToggleElement || !autorotateToggleElement.classList.contains('enabled')) return;
    viewer.startMovement(autorotate);
    viewer.setIdleMovement(data.settings.autorotateInactivityDelay || 3000, autorotate);
  }

  function stopAutorotate() {
    viewer.stopMovement();
    viewer.setIdleMovement(Infinity);
  }

  function toggleAutorotate() {
    if (autorotateToggleElement.classList.contains('enabled')) {
      autorotateToggleElement.classList.remove('enabled');
      autorotateToggleElement.classList.remove('active');
      stopAutorotate();
      if (data.settings) data.settings.autorotateEnabled = false;
    } else {
      autorotateToggleElement.classList.add('enabled');
      autorotateToggleElement.classList.add('active');
      startAutorotate();
      if (data.settings) data.settings.autorotateEnabled = true;
    }
    if (window.XenoSupabase && previewSlug) {
      window.XenoSupabase.saveTour(previewSlug, data);
    }
  }

  function findSceneById(id) {
    for (var i = 0; i < scenes.length; i++) {
      if (scenes[i].data.id === id) return scenes[i];
    }
    return null;
  }

  // Toggles (Gyro, VR, Anaglyph, Minimap, ViewControls)
  var gyroToggle = document.querySelector('#gyroToggle');
  var vrToggle = document.querySelector('#vrToggle');
  var anaglyphToggle = document.querySelector('#anaglyphToggle');
  var minimapToggle = document.querySelector('#minimapToggle');
  var viewControlsToggle = document.querySelector('#viewControlsToggle');

  // Set up Device Orientation (Gyroscope)
  var deviceOrientationControlMethod = null;
  if (window.DeviceOrientationControlMethod) {
    deviceOrientationControlMethod = new DeviceOrientationControlMethod();
    controls.registerMethod('deviceOrientation', deviceOrientationControlMethod);
  }

  if (gyroToggle) {
    gyroToggle.addEventListener('click', function() {
      var self = this;
      if (!deviceOrientationControlMethod) return;

      if (self.classList.contains('active')) {
        controls.disableMethod('deviceOrientation');
        self.classList.remove('active');
      } else {
        deviceOrientationControlMethod.requestPermission(function(granted) {
          if (granted) {
            deviceOrientationControlMethod.getPitch(function(err, pitch) {
              if (!err && viewer.scene() && viewer.scene().view()) {
                viewer.scene().view().setPitch(pitch);
              }
            });
            controls.enableMethod('deviceOrientation');
            self.classList.add('active');
          } else {
            console.warn("Device orientation permission denied.");
          }
        });
      }
    });
  }
  
  if (anaglyphToggle) {
    anaglyphToggle.addEventListener('click', function() {
      this.classList.toggle('active');
      alert("Anaglyph 3D requires stereoscopic media (left/right eye scenes). Toggle UI active.");
    });
  }
  
  if (vrToggle) {
    vrToggle.addEventListener('click', function() {
      this.classList.toggle('active');
      alert("WebVR requires stereoscopic media and VR display. Toggle UI active.");
    });
  }

  if (minimapToggle) {
    minimapToggle.addEventListener('click', function() {
      this.classList.toggle('active');
      var minimapEl = document.querySelector('#xeno-minimap');
      if (minimapEl) {
        minimapEl.style.display = this.classList.contains('active') ? 'block' : 'none';
      }
    });
  }

  if (viewControlsToggle) {
    viewControlsToggle.addEventListener('click', function() {
      this.classList.toggle('active');
      var viewControlsEl = document.querySelector('#viewControls');
      if (viewControlsEl) {
        viewControlsEl.classList.toggle('visible');
      }
    });
  }

  // Initial Scene Load
  if (scenes.length > 0) {
    var firstVisibleScene = scenes.find(function(s) { return !s.data.hidden; }) || scenes[0];
    switchScene(firstVisibleScene);
  }

})();
