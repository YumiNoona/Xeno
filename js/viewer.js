/*
 * Xeno — Universal Viewer Main Logic
 * Assembled from Marzipano sample-tour and adapted for universal support.
 */
'use strict';

(function () {
  var Xeno = window.Xeno;
  var screenfull = window.screenfull;

  var data = window.data;

  function initViewer(tourData) {
    if (tourData) {
      data = tourData;
      window.data = tourData;
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
      var setMode = function () {
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
    window.addEventListener('touchstart', function () {
      document.body.classList.remove('no-touch');
      document.body.classList.add('touch');
    });

    // Apply layout theme class and inject inline styles (bypasses CSS cache)
    var theme = data.settings.layoutTheme;
    // Direct localStorage fallback — bypasses any data flow issues
    if (!theme) {
      try {
        var slug = new URLSearchParams(window.location.search).get('project');
        if (slug) {
          var raw = localStorage.getItem('xeno_tour_' + slug);
          if (raw) {
            var p = JSON.parse(raw);
            if (p && p.data && p.data.settings) theme = p.data.settings.layoutTheme;
          }
        }
      } catch(e) {}
    }
    if (!theme) theme = 'default';
    document.body.setAttribute('data-layout-theme', theme);

    if (!document.getElementById('xeno-theme-css')) {
      var ts = document.createElement('style');
      ts.id = 'xeno-theme-css';
      ts.textContent = [
        'body[data-layout-theme="strip"] #titleBar{height:40px;padding:0 12px}',
        'body[data-layout-theme="strip"] #titleBar .sceneName{font-size:var(--type-sm)}',
        'body[data-layout-theme="strip"] #sceneList{width:100%;height:90px;top:auto;bottom:0;left:0;padding:8px 12px;transform:translateY(100%);border-right:none;border-top:1px solid var(--border-glass);flex-direction:row;display:flex;gap:8px;overflow-x:auto;overflow-y:hidden;white-space:nowrap;align-items:center}',
        'body[data-layout-theme="strip"] #sceneList.enabled{transform:translateY(0)}',
        'body[data-layout-theme="strip"] #sceneList .scene{flex-direction:column;gap:4px;padding:4px 6px;min-width:64px;border-left:none;border-bottom:3px solid transparent;flex-shrink:0}',
        'body[data-layout-theme="strip"] #sceneList .scene.current{border-bottom-color:var(--accent)}',
        'body[data-layout-theme="strip"] #sceneList .scene .scene-thumb{width:52px;height:40px;border-radius:4px}',
        'body[data-layout-theme="strip"] #sceneList .scene .scene-name{font-size:var(--type-2xs);text-align:center;max-width:64px;overflow:hidden;text-overflow:ellipsis}',
        'body[data-layout-theme="strip"] #controls{bottom:100px}',
        'body[data-layout-theme="minimal"] #titleBar{display:none}',
        'body[data-layout-theme="minimal"] #sceneList{width:100%;height:64px;top:auto;bottom:0;left:0;padding:6px 10px;transform:translateY(100%);border-right:none;border-top:1px solid var(--border-glass);flex-direction:row;display:flex;gap:6px;overflow-x:auto;overflow-y:hidden;white-space:nowrap;align-items:center;background:rgba(0,0,0,0.5);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}',
        'body[data-layout-theme="minimal"] #sceneList.enabled{transform:translateY(0)}',
        'body[data-layout-theme="minimal"] #sceneList .scene{flex-direction:column;gap:2px;padding:2px 4px;min-width:48px;border-left:none;border-bottom:2px solid transparent;flex-shrink:0}',
        'body[data-layout-theme="minimal"] #sceneList .scene.current{border-bottom-color:var(--accent)}',
        'body[data-layout-theme="minimal"] #sceneList .scene .scene-thumb{width:40px;height:30px;border-radius:3px}',
        'body[data-layout-theme="minimal"] #sceneList .scene .scene-name{font-size:9px;text-align:center;max-width:48px;overflow:hidden;text-overflow:ellipsis;color:var(--text-muted)}',
        'body[data-layout-theme="minimal"] #controls .ctrl-btn{width:36px;height:36px;background:rgba(0,0,0,0.4);border-color:rgba(255,255,255,0.15);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)}',
        'body[data-layout-theme="minimal"] #controls .ctrl-btn svg{width:16px;height:16px}',
        'body[data-layout-theme="minimal"] #controls{bottom:74px}',
        'body[data-layout-theme="gallery"] #titleBar{display:none}',
        'body[data-layout-theme="gallery"] #sceneList{width:100%;height:130px;top:auto;bottom:0;left:0;padding:10px 14px;transform:translateY(100%);border-right:none;border-top:1px solid var(--border-glass);flex-direction:row;display:flex;gap:12px;overflow-x:auto;overflow-y:hidden;white-space:nowrap;align-items:stretch;background:linear-gradient(to top,rgba(0,0,0,0.7),transparent)}',
        'body[data-layout-theme="gallery"] #sceneList.enabled{transform:translateY(0)}',
        'body[data-layout-theme="gallery"] #sceneList .scene{flex-direction:column;gap:6px;padding:6px 4px;min-width:100px;border-left:none;border-bottom:none;border-radius:8px;flex-shrink:0;background:rgba(0,0,0,0.35);transition:all 0.2s}',
        'body[data-layout-theme="gallery"] #sceneList .scene:hover{background:rgba(255,255,255,0.1);transform:translateY(-4px)}',
        'body[data-layout-theme="gallery"] #sceneList .scene.current{background:rgba(225,29,72,0.25);border:1px solid var(--accent)}',
        'body[data-layout-theme="gallery"] #sceneList .scene .scene-thumb{width:88px;height:66px;border-radius:6px;object-fit:cover;border:1px solid rgba(255,255,255,0.1)}',
        'body[data-layout-theme="gallery"] #sceneList .scene .scene-name{font-size:var(--type-2xs);text-align:center;max-width:90px;overflow:hidden;text-overflow:ellipsis;color:var(--text-secondary);font-weight:var(--weight-medium)}',
        'body[data-layout-theme="gallery"] #controls .ctrl-btn{width:40px;height:40px;background:rgba(0,0,0,0.5);border-color:rgba(255,255,255,0.2);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}',
        'body[data-layout-theme="gallery"] #controls{bottom:140px}',
        'body[data-layout-theme="float"] #titleBar{position:absolute;top:16px;left:16px;right:auto;width:auto;height:auto;padding:8px 16px;background:rgba(0,0,0,0.5);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);border:1px solid var(--border-glass);border-radius:9999px;box-shadow:0 4px 24px rgba(0,0,0,0.4)}',
        'body[data-layout-theme="float"] #titleBar .sceneName{font-size:var(--type-sm)}',
        'body[data-layout-theme="float"] #sceneList{width:auto;max-width:90%;height:auto;top:auto;bottom:16px;left:50%;transform:translate(-50%,20px);border-right:none;border-top:none;background:rgba(0,0,0,0.45);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border:1px solid var(--border-glass);border-radius:16px;box-shadow:0 4px 30px rgba(0,0,0,0.5);padding:8px 14px;flex-direction:row;display:flex;gap:10px;overflow-x:auto;overflow-y:hidden;white-space:nowrap;align-items:center;opacity:0;pointer-events:none;transition:opacity 0.3s,transform 0.3s}',
        'body[data-layout-theme="float"] #sceneList.enabled{opacity:1;pointer-events:auto;transform:translate(-50%,0)}',
        'body[data-layout-theme="float"] #sceneList .scene{flex-direction:column;gap:4px;padding:4px 6px;min-width:60px;border-left:none;border-bottom:2px solid transparent;flex-shrink:0;border-radius:8px;transition:all 0.2s}',
        'body[data-layout-theme="float"] #sceneList .scene:hover{background:rgba(255,255,255,0.08)}',
        'body[data-layout-theme="float"] #sceneList .scene.current{background:rgba(225,29,72,0.2);border-bottom-color:var(--accent)}',
        'body[data-layout-theme="float"] #sceneList .scene .scene-thumb{width:56px;height:42px;border-radius:6px;border:1px solid rgba(255,255,255,0.1)}',
        'body[data-layout-theme="float"] #sceneList .scene .scene-name{font-size:var(--type-2xs);text-align:center;max-width:60px;overflow:hidden;text-overflow:ellipsis;color:var(--text-muted)}',
        'body[data-layout-theme="float"] #controls .ctrl-btn{width:42px;height:42px;background:rgba(0,0,0,0.45);border-color:var(--border-glass);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,0.3)}',
        'body[data-layout-theme="float"] #controls .ctrl-btn svg{width:18px;height:18px}',
        'body[data-layout-theme="float"] #controls{bottom:100px}'
      ].join('');
      document.head.appendChild(ts);
    }

    // Force sceneListStyle based on theme (theme CSS handles positioning)
    if (theme !== 'default') {
      data.settings.sceneListStyle = 'bottom-strip';
    }

    // Viewer options.
    var viewerOpts = {
      controls: {
        mouseViewMode: data.settings.mouseViewMode || 'drag'
      }
    };

    // Initialize viewer.
    var viewer = new Xeno.Viewer(panoElement, viewerOpts);
    window.xenoViewer = viewer;

    // Source builder
    function buildSource(sceneData) {
      if (sceneData.type === 'video') {
        if (window.XenoVideoAsset) {
          var asset = new window.XenoVideoAsset();
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
      return new Xeno.EquirectGeometry([{ width: 4000 }]);
    }

    // Create scenes.
    var scenes = data.scenes.map(function (sceneData) {
      var source = buildSource(sceneData);
      var geometry = buildGeometry(sceneData);

      var minFov = 60 * Math.PI / 180;
      var maxFov = 120 * Math.PI / 180;
      var limiter;
      if (sceneData.type === 'video') {
        limiter = Xeno.RectilinearView.limit.vfov(minFov, maxFov);
      } else {
        var resLimit = Xeno.RectilinearView.limit.resolution(sceneData.faceSize || 2048);
        var fovLimit = Xeno.RectilinearView.limit.vfov(minFov, maxFov);
        var pitchLimit = Xeno.RectilinearView.limit.pitch(-Math.PI/2, Math.PI/2);
        limiter = function(params) {
          params = resLimit(params);
          params = fovLimit(params);
          params = pitchLimit(params);
          return params;
        };
      }

      var view = new Xeno.RectilinearView(sceneData.initialViewParameters, limiter);
      var scene = viewer.createScene({
        source: source, geometry: geometry, view: view, pinFirstLevel: true
      });

      var sceneContext = { data: sceneData, scene: scene, view: view };

      // Hotspot creation
      if (window.HotspotFactory) {
        if (sceneData.hotspots) {
          sceneData.hotspots.forEach(function (hs) {
            HotspotFactory.create(scene, hs, hs.type || 'info', switchScene, findSceneById);
          });
        }
        if (sceneData.linkHotspots) {
          sceneData.linkHotspots.forEach(function (hs) {
            HotspotFactory.create(scene, hs, 'link', switchScene, findSceneById);
          });
        }
        if (sceneData.infoHotspots) {
          sceneData.infoHotspots.forEach(function (hs) {
            HotspotFactory.create(scene, hs, 'info', switchScene, findSceneById);
          });
        }
        if (sceneData.mediaHotspots) {
          sceneData.mediaHotspots.forEach(function (hs) {
            HotspotFactory.create(scene, hs, 'media', switchScene, findSceneById);
          });
        }
      }

      if (window.colorEffects) applyColorEffects(sceneContext);

      return sceneContext;
    });

    window.xenoScenes = scenes;

    // Initialize UI modules after scenes are loaded
    if (window.initSceneList) window.initSceneList();
    if (window.initMinimap) window.initMinimap();

    function applyColorEffects(sceneCtx) {
      if (Xeno.colorEffects && sceneCtx.data.colorEffects) {
        var ce = sceneCtx.data.colorEffects;
        var effect = Xeno.colorEffects.identity();
        effect = Xeno.colorEffects.brightness(ce.brightness - 1, effect);
        effect = Xeno.colorEffects.contrast(ce.contrast, effect);
        effect = Xeno.colorEffects.saturation(ce.saturation, effect);
        sceneCtx.scene.layer().setEffects({
          colorMatrix: effect.colorMatrix,
          colorOffset: effect.colorOffset
        });
      }
    }

    // Autorotate
    var autorotate = Xeno.autorotate({
      yawSpeed: data.settings.autorotateSpeed || 0.03,
      targetPitch: 0,
      targetFov: Math.PI / 2
    });

    // Intro screen
    var introScreen = document.getElementById('intro-screen');
    var startTourBtn = document.getElementById('btn-start-tour');
    var introTitle = document.getElementById('intro-title');
    var introDesc = document.getElementById('intro-desc');
    var intro = data.settings && data.settings.intro;

    if (data.settings.autorotateEnabled && autorotateToggleElement) {
      autorotateToggleElement.classList.add('enabled');
      autorotateToggleElement.classList.add('active');
    }

    if (intro && intro.enabled && introScreen) {
      if (introTitle) introTitle.textContent = intro.title || data.settings.name || 'Xeno Tour';
      if (introDesc) {
        introDesc.textContent = intro.subtitle || '';
        introDesc.style.display = intro.subtitle ? '' : 'none';
      }
      if (startTourBtn) startTourBtn.textContent = intro.buttonText || 'Enter Tour';
      introScreen.style.display = '';
      startTourBtn.addEventListener('click', function () {
        introScreen.style.display = 'none';
        if (data.settings.autorotateEnabled) startAutorotate();
      });
    } else if (data.settings.autorotateEnabled) {
      startAutorotate();
    }

    if (autorotateToggleElement) autorotateToggleElement.addEventListener('click', toggleAutorotate);

    // Fullscreen
    if (screenfull.enabled && data.settings.fullscreenButton) {
      document.body.classList.add('fullscreen-enabled');
      fullscreenToggleElement.addEventListener('click', function () {
        screenfull.toggle();
      });
      screenfull.on('change', function () {
        if (screenfull.isFullscreen) {
          fullscreenToggleElement.classList.add('enabled');
        } else {
          fullscreenToggleElement.classList.remove('enabled');
        }
      });
    } else {
      document.body.classList.add('fullscreen-disabled');
    }

    // Scene list toggle
    if (sceneListToggleElement) {
      sceneListToggleElement.addEventListener('click', toggleSceneList);
    }
    if (!document.body.classList.contains('mobile') && sceneListToggleElement) {
      showSceneList();
    }

    // View controls (directional pan)
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

    function linear(t) { return t; }

    function showToast(msg) {
      var t = document.querySelector('.viewer-toast');
      if (!t) {
        t = document.createElement('div');
        t.className = 'viewer-toast';
        document.body.appendChild(t);
      }
      t.textContent = msg;
      t.classList.add('visible');
      clearTimeout(t._hide);
      t._hide = setTimeout(function() { t.classList.remove('visible'); }, 2500);
    }

    // ── switchScene (internal) ───────────────────────────────────
    function switchScene(sceneCtx, transOpts) {
      if (sceneCtx && sceneCtx.data && sceneCtx.data.hidden) {
        showToast('This scene is hidden in the editor');
        return;
      }
      stopAutorotate();
      sceneCtx.view.setParameters(sceneCtx.data.initialViewParameters);

      transOpts = transOpts || {};
      var transType = transOpts.transition || sceneCtx.data.transition || data.settings.defaultTransition || 'opacity';
      var transTime = transOpts.transitionDuration || sceneCtx.data.transitionDuration || data.settings.defaultTransitionDuration || 1000;
      var easeName = data.settings.defaultTransitionEasing || 'easeInOut';
      var ease = window.XenoTransitions ? (XenoTransitions.easings[easeName] || linear) : linear;
      var transUpdate = (transType === 'none' || !window.XenoTransitions) ? null
        : (XenoTransitions.functions[transType] ? XenoTransitions.functions[transType](ease) : null);

      sceneCtx.scene.switchTo({ transitionDuration: transTime, transitionUpdate: transUpdate }, function () {
        startAutorotate();
      });

      if (window.colorEffects) applyColorEffects(sceneCtx);
      updateSceneName(sceneCtx);
      if (window.updateSceneList) updateSceneList(sceneCtx);
      if (window.updateMinimap) updateMinimap(sceneCtx);
    }

    // ── xenoSwitchScene — public API + VR sync ───────────────────
    window.xenoSwitchScene = function (sceneCtx, transOpts) {
      switchScene(sceneCtx, transOpts);
      // Keep VR sky in sync when navigating via Marzipano hotspots
      if (window.XenoVR && sceneCtx && sceneCtx.data) {
        window.XenoVR.syncScene(sceneCtx.data.id);
      }
    };

    function updateSceneName(sceneCtx) {
      if (sceneNameElement) {
        var name = (sceneCtx.data.name || '').replace(/\.[^/.]+$/, "");
        sceneNameElement.textContent = name;
      }
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
    }

    function findSceneById(id) {
      for (var i = 0; i < scenes.length; i++) {
        if (scenes[i].data.id === id) return scenes[i];
      }
      return null;
    }

    // ── Button references ────────────────────────────────────────
    var gyroToggle = document.querySelector('#gyroToggle');
    var vrToggle = document.querySelector('#vrToggle');
    var minimapToggle = document.querySelector('#minimapToggle');
    var viewControlsToggle = document.querySelector('#viewControlsToggle');
    // ── Gyroscope ────────────────────────────────────────────────
    var deviceOrientationControlMethod = null;
    if (window.DeviceOrientationControlMethod) {
      deviceOrientationControlMethod = new DeviceOrientationControlMethod();
      controls.registerMethod('deviceOrientation', deviceOrientationControlMethod);
    }

    if (gyroToggle) {
      gyroToggle.addEventListener('click', function () {
        var self = this;
        if (!deviceOrientationControlMethod) return;
        if (self.classList.contains('active')) {
          controls.disableMethod('deviceOrientation');
          self.classList.remove('active');
        } else {
          deviceOrientationControlMethod.requestPermission(function (granted) {
            if (granted) {
              deviceOrientationControlMethod.getPitch(function (err, pitch) {
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

    // ── VR Toggle — powered by XenoVR (js/vr/XenoVR.js) ────────
    if (vrToggle) {
      if (window.XenoVR && window.XenoVR.isSupported()) {
        vrToggle.title = 'Enter VR Mode';
      } else {
        vrToggle.title = 'VR (requires WebXR browser + HTTPS)';
        vrToggle.style.opacity = '0.45';
      }
      vrToggle.addEventListener('click', function () {
        if (window.XenoVR) {
          window.XenoVR.toggle();
        } else {
          showToast('VR engine not loaded. Check js/vr/XenoVR.js path.');
        }
      });
    }

    // ── Minimap ──────────────────────────────────────────────────
    if (minimapToggle) {
      minimapToggle.addEventListener('click', function () {
        this.classList.toggle('active');
        var minimapEl = document.querySelector('#xeno-minimap');
        if (minimapEl) {
          minimapEl.style.display = this.classList.contains('active') ? 'block' : 'none';
        }
      });
    }

    // ── Pan Controls ─────────────────────────────────────────────
    if (viewControlsToggle) {
      viewControlsToggle.addEventListener('click', function () {
        this.classList.toggle('active');
        var viewControlsEl = document.querySelector('#viewControls');
        if (viewControlsEl) viewControlsEl.classList.toggle('visible');
      });
    }

    // ── Toast helper ─────────────────────────────────────────────
    function showToast(msg) {
      if (window.showToast) { window.showToast(msg); return; }
      var t = document.createElement('div');
      t.textContent = msg;
      t.style.cssText = [
        'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);',
        'background:rgba(20,20,20,0.95);color:#fff;',
        'padding:9px 18px;border-radius:20px;font-size:12px;',
        'z-index:999999;pointer-events:none;',
        'font-family:"JetBrains Mono",monospace;letter-spacing:0.04em;',
        'border:1px solid rgba(255,255,255,0.1);'
      ].join('');
      document.body.appendChild(t);
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 3500);
    }

    // ── Initial scene load ───────────────────────────────────────
    if (scenes.length > 0) {
      var firstVisible = scenes.find(function (s) { return !s.data.hidden; }) || scenes[0];
      switchScene(firstVisible);
    }

  } // end initViewer()

  // ── Resolve media IDs to blob URLs ────────────────────────
  function isMediaId(v) { return typeof v === 'string' && v.indexOf('media_') === 0; }

  function resolveMediaIdOrUrl(v) {
    return isMediaId(v) && window.XenoSupabase
      ? window.XenoSupabase.resolveMediaId(v).then(function (b) { return b || v; })
      : Promise.resolve(v);
  }

  function resolveAllMedia(tourData) {
    if (!tourData || !tourData.scenes) return Promise.resolve(tourData);
    var promises = [];
    tourData.scenes.forEach(function (scene) {
      if (isMediaId(scene.mediaUrl)) {
        promises.push(resolveMediaIdOrUrl(scene.mediaUrl).then(function (blobUrl) {
          scene.mediaUrl = blobUrl;
        }));
      }
      if (isMediaId(scene.thumbnailUrl)) {
        promises.push(resolveMediaIdOrUrl(scene.thumbnailUrl).then(function (blobUrl) {
          scene.thumbnailUrl = blobUrl;
        }));
      }
      var allHotspots = (scene.hotspots || []).concat(scene.linkHotspots || [], scene.infoHotspots || [], scene.mediaHotspots || []);
      allHotspots.forEach(function (hs) {
        var src = hs.content && hs.content.src;
        if (isMediaId(src)) {
          promises.push(resolveMediaIdOrUrl(src).then(function (blobUrl) {
            hs.content.src = blobUrl;
          }));
        }
      });
    });
    return Promise.all(promises).then(function () { return tourData; });
  }

  // ── Preload scene images so Marzipano has them ready ──────
  function preloadSceneImages(tourData) {
    if (!tourData || !tourData.scenes) return Promise.resolve(tourData);
    return new Promise(function (resolve) {
      var total = 0;
      var loaded = 0;
      tourData.scenes.forEach(function (s) {
        if (s.type === 'video' || !s.mediaUrl) return;
        total++;
        var img = new Image();
        img.onload = img.onerror = function () { loaded++; if (loaded >= total) resolve(tourData); };
        img.src = s.mediaUrl;
      });
      if (total === 0) resolve(tourData);
    });
  }

  // ── Startup ──────────────────────────────────────────────────
  if (!window.isExported) {
    var previewSlug = new URLSearchParams(window.location.search).get('project') || 'sample-tour';
    window.XenoSupabase.loadTour(previewSlug)
      .then(function (savedData) {
        return resolveAllMedia(savedData || window.data);
      })
      .then(function (tourData) {
        return preloadSceneImages(tourData);
      })
      .then(function (tourData) {
        initViewer(tourData);
      });
  } else {
    resolveAllMedia(window.data).then(function () {
      return preloadSceneImages(window.data);
    }).then(function () {
      initViewer(window.data);
    });
  }

})();