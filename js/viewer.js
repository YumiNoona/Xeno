'use strict';

(function () {
  var Xeno = window.Xeno;
  var screenfull = window.screenfull;

  var data = window.data;
  var _mqlListener = null;

  function initViewer(tourData) {
    if (tourData) {
      data = tourData;
      window.data = tourData;
    }

    var panoElement = document.querySelector('#pano');
    var sceneNameElement = document.querySelector('#titleBar .sceneName');
    var sceneListElement = document.querySelector('#sceneList');
    var sceneElements = document.querySelectorAll('#sceneList .scene');
    var sceneListToggleElement = document.querySelector('#sceneListToggle');
    var autorotateToggleElement = document.querySelector('#autorotateToggle');
    var fullscreenToggleElement = document.querySelector('#fullscreenToggle');

    if (window.matchMedia) {
      if (_mqlListener) {
        _mqlListener.mql.removeEventListener('change', _mqlListener.fn);
        _mqlListener = null;
      }
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
      mql.addEventListener('change', setMode);
      _mqlListener = { mql: mql, fn: setMode };
    } else {
      document.body.classList.add('desktop');
    }

    document.body.classList.add('no-touch');
    window.addEventListener('touchstart', function () {
      document.body.classList.remove('no-touch');
      document.body.classList.add('touch');
    });

    var theme = data.settings.layoutTheme;
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
    if (!theme) theme = 'hamburger';
    document.body.setAttribute('data-layout-theme', theme);
    if (window.XenoViewerTheme) {
      XenoViewerTheme.inject(theme, data);
      XenoViewerTheme.initDragScroll();
    }

    if (data.settings.gyroscopeEnabled === false) {
      var gEl = document.getElementById('gyroToggle');
      if (gEl) gEl.style.display = 'none';
    }
    if (data.settings.vrEnabled === false) {
      var vEl = document.getElementById('vrToggle');
      if (vEl) vEl.style.display = 'none';
    }
    if (data.settings.showCaptureButton === false) {
      var capEl = document.getElementById('captureToggle');
      if (capEl) capEl.style.display = 'none';
    }
    if (data.settings.showControls === false) {
      var ctrlEl = document.getElementById('controls');
      if (ctrlEl) ctrlEl.style.display = 'none';
    }
    if (data.settings.showScenes === false) {
      if (sceneListToggleElement) sceneListToggleElement.style.display = 'none';
      if (sceneListElement) { sceneListElement.style.display = 'none'; sceneListElement.classList.remove('enabled'); }
    }

    var viewerOpts = {
      controls: {
        mouseViewMode: data.settings.mouseViewMode || 'drag'
      }
    };

    var viewer = new Xeno.Viewer(panoElement, viewerOpts);
    window.xenoViewer = viewer;

    // WebGL context loss recovery — fires when GPU context is reclaimed
    // (mobile background, heavy load, driver reset). Shows overlay; auto-recovers on restore.
    var _ctxLossOverlay = null;
    panoElement.addEventListener('webglcontextlost', function() {
      if (!_ctxLossOverlay) {
        _ctxLossOverlay = document.createElement('div');
        _ctxLossOverlay.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.85);color:#fff;font-family:inherit;font-size:14px;z-index:9999;flex-direction:column;gap:12px;';
        _ctxLossOverlay.innerHTML = '<div style="opacity:0.6">Display context lost</div><button onclick="window.location.reload()" style="padding:8px 20px;background:var(--accent,#e62e5a);border:none;color:#fff;cursor:pointer;font-family:inherit;">Reload</button>';
        panoElement.style.position = 'relative';
        panoElement.appendChild(_ctxLossOverlay);
      }
    });
    panoElement.addEventListener('webglcontextrestored', function() {
      if (_ctxLossOverlay) {
        _ctxLossOverlay.remove();
        _ctxLossOverlay = null;
      }
      try { viewer.updateSize(); } catch(e) {}
    });

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

    function buildGeometry(sceneData) {
      if (sceneData.type === 'video') return new Xeno.EquirectGeometry([{ width: 1 }]);
      if (sceneData.levels) return new Xeno.CubeGeometry(sceneData.levels);
      return new Xeno.EquirectGeometry([{ width: 4000 }]);
    }

    var scenes = (data.scenes || []).map(function (sceneData) {
      if (!sceneData || !sceneData.mediaUrl || sceneData.mediaUrl.indexOf('media_') === 0) return null;
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
    }).filter(Boolean);

    if (typeof Object.getOwnPropertyDescriptor(window, 'xenoScenes') === 'undefined') {
      window.xenoScenes = scenes;
    }

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

    var autorotate = Xeno.autorotate({
      yawSpeed: data.settings.autorotateSpeed || 0.03,
      targetPitch: 0,
      targetFov: Math.PI / 2
    });

    var introScreen = document.getElementById('intro-screen');
    var startTourBtn = document.getElementById('btn-start-tour');

    if (introScreen && introScreen.style.display === 'none' && data.settings && data.settings.intro && data.settings.intro.enabled) {
      var introTitleElement = document.getElementById('intro-title');
      var introDescElement = document.getElementById('intro-desc');
      if (introTitleElement) introTitleElement.textContent = data.settings.intro.title || data.settings.name || 'Xeno Tour';
      if (introDescElement) {
        introDescElement.textContent = data.settings.intro.subtitle || '';
        introDescElement.style.display = data.settings.intro.subtitle ? '' : 'none';
      }
      if (startTourBtn) startTourBtn.textContent = data.settings.intro.buttonText || 'Enter Tour';
      introScreen.style.display = '';
    }

    if (startTourBtn && introScreen && introScreen.style.display !== 'none') {
      startTourBtn.addEventListener('click', function () {
        introScreen.style.display = 'none';
      });
    }

    if (autorotateToggleElement) autorotateToggleElement.addEventListener('click', toggleAutorotate);

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

    if (sceneListToggleElement) {
      sceneListToggleElement.addEventListener('click', toggleSceneList);
    }
    var showScenes = data.settings.showScenes !== false;
    if (!showScenes) {
      hideSceneList();
    } else if (!document.body.classList.contains('mobile') && sceneListToggleElement && theme !== 'hamburger') {
      hideSceneList();
    }

    if (sceneListElement) {
      sceneListElement.addEventListener('wheel', function(e) { e.stopPropagation(); }, { passive: false });
    }

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

    function switchScene(sceneCtx, transOpts) {
      if (sceneCtx && sceneCtx.data && sceneCtx.data.hidden) {
        showToast('This scene is hidden in the editor');
        return;
      }
      stopAutorotate();
      sceneCtx.view.setParameters(sceneCtx.data.initialViewParameters);

      (sceneCtx.data.hotspots || []).forEach(function(h) {
        if (h.__ambientAudio) { h.__ambientAudio.pause(); h.__ambientAudio = null; }
      });

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

      clearTimeout(sceneCtx.__narratorTimer);
      if (sceneCtx.__narratorAudio) {
        sceneCtx.__narratorAudio.pause();
        sceneCtx.__narratorAudio.currentTime = 0;
        sceneCtx.__narratorAudio = null;
      }
      var narratorHs = (sceneCtx.data.hotspots || []).find(function(h) { return h.type === 'narrator' && h.narratorAudio; });
      if (narratorHs) {
        var capEl = document.getElementById('narrator-caption');
        if (!capEl) {
          capEl = document.createElement('div');
          capEl.id = 'narrator-caption';
          capEl.style.cssText = 'position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.8);color:#fff;padding:12px 24px;border-radius:12px;font-size:16px;max-width:80vw;text-align:center;z-index:200;pointer-events:none;text-shadow:0 1px 3px rgba(0,0,0,0.5);font-family:inherit;';
          document.body.appendChild(capEl);
        }
        capEl.textContent = narratorHs.narratorText || '';
        capEl.style.display = 'block';

        var audio = new Audio(narratorHs.narratorAudio);
        audio.volume = 0.8;
        audio.play().catch(function() {});
        sceneCtx.__narratorAudio = audio;

        var duration = (narratorHs.sceneDuration || 10) * 1000;
        var currentIndex = scenes.indexOf(sceneCtx);
        var nextIndex = currentIndex + 1;
        sceneCtx.__narratorTimer = setTimeout(function() {
          capEl.style.display = 'none';
          if (nextIndex < scenes.length) {
            switchScene(scenes[nextIndex]);
          } else {
            capEl.textContent = 'Thank you for watching!';
            capEl.style.display = 'block';
            capEl.style.bottom = '50%';
            capEl.style.transform = 'translate(-50%, 50%)';
            capEl.style.fontSize = '24px';
            setTimeout(function() { capEl.style.display = 'none'; }, 5000);
          }
        }, duration);

        var ctrlBtns = document.querySelectorAll('#controls .ctrl-btn, #sceneList .scene');
        ctrlBtns.forEach(function(b) { b.style.pointerEvents = 'none'; b.style.opacity = '0.3'; });
        clearTimeout(sceneCtx.__narratorTimer + '_unlock');
      } else {
        var capEl = document.getElementById('narrator-caption');
        if (capEl) capEl.style.display = 'none';
        var ctrlBtns = document.querySelectorAll('#controls .ctrl-btn, #sceneList .scene');
        ctrlBtns.forEach(function(b) { b.style.pointerEvents = ''; b.style.opacity = ''; });
      }

      if (window.colorEffects) applyColorEffects(sceneCtx);
      updateSceneName(sceneCtx);
      if (window.updateSceneList) updateSceneList(sceneCtx);
      if (window.updateMinimap) updateMinimap(sceneCtx);
    }

    window.xenoSwitchScene = function (sceneCtx, transOpts) {
      switchScene(sceneCtx, transOpts);
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

    if (window.XenoViewerGaze) {
      XenoViewerGaze.init(scenes);
    }

    var gyroToggle = document.querySelector('#gyroToggle');
    var vrToggle = document.querySelector('#vrToggle');
    var minimapToggle = document.querySelector('#minimapToggle');
    var viewControlsToggle = document.querySelector('#viewControlsToggle');

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

    if (minimapToggle) {
      minimapToggle.addEventListener('click', function () {
        if (!data.floorplan || !data.floorplan.imageUrl) {
          showToast('No floorplan image has been set');
          return;
        }
        this.classList.toggle('active');
        var minimapEl = document.querySelector('#xeno-minimap');
        if (minimapEl) {
          minimapEl.style.display = this.classList.contains('active') ? 'block' : 'none';
        }
      });
    }

    if (viewControlsToggle) {
      viewControlsToggle.addEventListener('click', function () {
        this.classList.toggle('active');
        var viewControlsEl = document.querySelector('#viewControls');
        if (viewControlsEl) viewControlsEl.classList.toggle('visible');
      });
    }

    if (window.XenoViewerCapture) {
      XenoViewerCapture.init(viewer);
    }

    if (scenes.length > 0) {
      var firstVisible = scenes.find(function (s) { return !s.data.hidden; }) || scenes[0];
      switchScene(firstVisible);
    }

    var loader = document.getElementById('xeno-loading');
    if (loader) {
      if (scenes.length > 0 && scenes[0].scene) {
        var firstScene = scenes[0].scene;
        var checkReady = function() {
          try { firstScene.viewer().updateSize(); } catch(e) {}
          setTimeout(function() { loader.classList.add('hide'); }, 400);
        };
        setTimeout(checkReady, 100);
      } else {
        loader.innerHTML = '<div style="color:#fff;font-family:monospace;font-size:16px;text-align:center;">Project not found or contains no valid scenes.<br><br><a href="/" style="color:var(--accent,#e62e5a);text-decoration:none;">Return Home</a></div>';
        loader.style.background = 'rgba(0,0,0,0.9)';
      }
    }
  }

  window.xenoInitViewer = initViewer;
})();
