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
        'body[data-layout-theme="strip"] #titleBar{display:none}',
        'body[data-layout-theme="strip"] #sceneList{position:fixed;top:0;bottom:0;left:auto;right:0;width:80px;height:100%;padding:56px 6px 20px;transform:none;border-right:none;border-left:1px solid var(--border-glass);flex-direction:column;display:flex;gap:6px;overflow-y:auto;overflow-x:hidden;align-items:center;background:rgba(0,0,0,0.45);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}',
        'body[data-layout-theme="strip"] #sceneList.enabled{transform:none}',
        'body[data-layout-theme="strip"] #sceneList .scene{flex-direction:column;gap:3px;padding:4px;min-width:0;width:64px;border-left:none;border-radius:6px;flex-shrink:0;background:rgba(255,255,255,0.04)}',
        'body[data-layout-theme="strip"] #sceneList .scene:hover{background:rgba(255,255,255,0.1)}',
        'body[data-layout-theme="strip"] #sceneList .scene.current{background:rgba(225,29,72,0.2);border:1px solid rgba(225,29,72,0.3)}',
        'body[data-layout-theme="strip"] #sceneList .scene .scene-thumb{width:52px;height:36px;border-radius:4px}',
        'body[data-layout-theme="strip"] #sceneList .scene .scene-name{font-size:8px;text-align:center;max-width:60px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
        'body[data-layout-theme="strip"] #sceneListToggle{display:none}',
        'body[data-layout-theme="strip"] #controls{bottom:20px;left:20px;right:auto}',
        'body[data-layout-theme="minimal"] #titleBar{display:none}',
        'body[data-layout-theme="minimal"] #sceneList{position:fixed;top:0;bottom:auto;left:0;right:0;width:100%;height:auto;min-height:36px;padding:2px 10px;transform:none;border-right:none;border-bottom:1px solid var(--border-glass);flex-direction:row;display:flex;gap:4px;overflow-x:auto;overflow-y:hidden;white-space:nowrap;align-items:center;background:rgba(0,0,0,0.4);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}',
        'body[data-layout-theme="minimal"] #sceneList.enabled{transform:none}',
        'body[data-layout-theme="minimal"] #sceneList .scene{flex-direction:row;gap:4px;padding:2px 4px;min-width:0;border-left:none;border-radius:4px;flex-shrink:0;border-bottom:none}',
        'body[data-layout-theme="minimal"] #sceneList .scene.current{background:rgba(225,29,72,0.2)}',
        'body[data-layout-theme="minimal"] #sceneList .scene .scene-thumb{width:24px;height:24px;border-radius:3px}',
        'body[data-layout-theme="minimal"] #sceneList .scene .scene-name{display:none}',
        'body[data-layout-theme="minimal"] #sceneListToggle{display:none}',
        'body[data-layout-theme="minimal"] #controls .ctrl-btn{width:32px;height:32px;background:rgba(0,0,0,0.4);border-color:rgba(255,255,255,0.12);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)}',
        'body[data-layout-theme="minimal"] #controls .ctrl-btn svg{width:14px;height:14px}',
        'body[data-layout-theme="minimal"] #controls{bottom:20px;right:20px}',
        'body[data-layout-theme="gallery"] #titleBar{display:none}',
        'body[data-layout-theme="gallery"] #sceneList{position:fixed;top:0;bottom:auto;left:0;right:0;width:100%;height:auto;min-height:110px;padding:48px 16px 14px;transform:translateY(-100%);border-right:none;border-bottom:1px solid var(--border-glass);flex-direction:row;display:flex;gap:12px;overflow-x:auto;overflow-y:hidden;white-space:nowrap;align-items:flex-end;background:rgba(0,0,0,0.55);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);transition:transform 0.35s cubic-bezier(0.16,1,0.3,1)}',
        'body[data-layout-theme="gallery"] #sceneList.enabled{transform:translateY(0)}',
        'body[data-layout-theme="gallery"] #sceneList .scene{flex-direction:column;gap:6px;padding:6px 4px;min-width:90px;border-left:none;border-bottom:none;border-radius:8px;flex-shrink:0;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.06);transition:all 0.2s}',
        'body[data-layout-theme="gallery"] #sceneList .scene:hover{background:rgba(255,255,255,0.08);transform:translateY(-4px)}',
        'body[data-layout-theme="gallery"] #sceneList .scene.current{background:rgba(225,29,72,0.2);border:1px solid var(--accent)}',
        'body[data-layout-theme="gallery"] #sceneList .scene .scene-thumb{width:78px;height:58px;border-radius:6px;object-fit:cover;border:1px solid rgba(255,255,255,0.08)}',
        'body[data-layout-theme="gallery"] #sceneList .scene .scene-name{font-size:var(--type-2xs);text-align:center;max-width:80px;overflow:hidden;text-overflow:ellipsis;color:var(--text-secondary);font-weight:var(--weight-medium);white-space:nowrap}',
        'body[data-layout-theme="gallery"] #controls .ctrl-btn{width:38px;height:38px;background:rgba(0,0,0,0.5);border-color:rgba(255,255,255,0.18);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}',
        'body[data-layout-theme="gallery"] #controls{bottom:20px;right:20px}',
        'body[data-layout-theme="float"] #titleBar{position:absolute;top:16px;left:16px;right:auto;width:auto;height:auto;padding:8px 16px;background:rgba(0,0,0,0.5);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);border:1px solid var(--border-glass);border-radius:9999px;box-shadow:0 4px 24px rgba(0,0,0,0.4)}',
        'body[data-layout-theme="float"] #titleBar .sceneName{font-size:var(--type-sm)}',
        'body[data-layout-theme="float"] #sceneList{position:fixed;width:auto;max-width:92%;height:auto;top:auto;bottom:20px;left:50%;transform:translate(-50%,30px);border-right:none;border-top:none;background:rgba(0,0,0,0.45);-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);border:1px solid var(--border-glass);border-radius:18px;box-shadow:0 8px 40px rgba(0,0,0,0.5);padding:8px 12px;flex-direction:row;display:flex;gap:6px;overflow-x:auto;overflow-y:hidden;white-space:nowrap;align-items:center;opacity:0;pointer-events:none;transition:opacity 0.35s,transform 0.35s cubic-bezier(0.16,1,0.3,1)}',
        'body[data-layout-theme="float"] #sceneList.enabled{opacity:1;pointer-events:auto;transform:translate(-50%,0)}',
        'body[data-layout-theme="float"] #sceneList .scene{flex-direction:row;gap:8px;padding:6px 10px;min-width:0;border-left:none;flex-shrink:0;border-radius:10px;transition:all 0.2s;align-items:center}',
        'body[data-layout-theme="float"] #sceneList .scene:hover{background:rgba(255,255,255,0.08)}',
        'body[data-layout-theme="float"] #sceneList .scene.current{background:rgba(225,29,72,0.2);border:1px solid rgba(225,29,72,0.35)}',
        'body[data-layout-theme="float"] #sceneList .scene .scene-thumb{width:36px;height:36px;border-radius:6px;border:1px solid rgba(255,255,255,0.08);flex-shrink:0}',
        'body[data-layout-theme="float"] #sceneList .scene .scene-name{font-size:var(--type-sm);text-align:left;max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text-primary)}',
        'body[data-layout-theme="float"] #controls .ctrl-btn{width:42px;height:42px;background:rgba(0,0,0,0.45);border-color:var(--border-glass);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,0.3)}',
        'body[data-layout-theme="float"] #controls .ctrl-btn svg{width:18px;height:18px}',
        'body[data-layout-theme="float"] #controls{bottom:110px}',
        'body[data-layout-theme="hamburger"] #titleBar{display:none}',
        'body[data-layout-theme="hamburger"] #sceneList{position:fixed;width:240px;height:auto;max-height:70%;top:50%;bottom:auto;left:0;padding:14px 12px;transform:translateX(-100%) translateY(-50%);border-right:1px solid var(--border-glass);border-top:none;flex-direction:column;display:flex;gap:8px;overflow-y:auto;overflow-x:hidden;background:rgba(0,0,0,0.6);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);border-radius:0 16px 16px 0;box-shadow:4px 0 30px rgba(0,0,0,0.4);transition:transform 0.3s cubic-bezier(0.16,1,0.3,1)}',
        'body[data-layout-theme="hamburger"] #sceneList.enabled{transform:translateY(-50%)}',
        'body[data-layout-theme="hamburger"] #sceneList .scene{flex-direction:row;gap:10px;padding:10px 12px;min-width:0;border-left:3px solid transparent;border-radius:12px;flex-shrink:0;background:rgba(255,255,255,0.04);transition:all 0.2s}',
        'body[data-layout-theme="hamburger"] #sceneList .scene:hover{background:rgba(255,255,255,0.1)}',
        'body[data-layout-theme="hamburger"] #sceneList .scene.current{background:rgba(225,29,72,0.15);border-left-color:var(--accent)}',
        'body[data-layout-theme="hamburger"] #sceneList .scene .scene-thumb{width:44px;height:44px;border-radius:10px;object-fit:cover;border:1px solid rgba(255,255,255,0.08);flex-shrink:0}',
        'body[data-layout-theme="hamburger"] #sceneList .scene .scene-name{font-size:var(--type-sm);text-align:left;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;align-self:center}',
        'body[data-layout-theme="hamburger"] #sceneListToggle{position:fixed;top:50%;left:0;transform:translateY(-50%);z-index:30;width:36px;height:44px;background:var(--bg-panel);border:1px solid var(--border);border-left:none;border-radius:0 10px 10px 0;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;padding:0;box-shadow:2px 0 12px rgba(0,0,0,0.2)}',
        'body[data-layout-theme="hamburger"] #sceneListToggle svg{display:none}',
        'body[data-layout-theme="hamburger"] #sceneListToggle::after{content:\'\';display:block;width:18px;height:2px;background:var(--text-secondary);border-radius:2px;box-shadow:0 -6px 0 var(--text-secondary),0 6px 0 var(--text-secondary)}',
        'body[data-layout-theme="hamburger"] #controls{bottom:20px;right:20px}',
        'body[data-layout-theme="center-bar"] #titleBar{display:none}',
        'body[data-layout-theme="center-bar"] #sceneList{position:fixed;top:auto;bottom:50px;left:50%;width:76%;max-width:680px;height:auto;min-height:80px;padding:10px 14px;background:rgba(0,0,0,0.5);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);border:1px solid var(--border-glass);border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.5);flex-direction:row;display:flex;gap:10px;overflow-x:auto;overflow-y:hidden;white-space:nowrap;align-items:center;transform:translateX(-50%)}',
        'body[data-layout-theme="center-bar"] #sceneList.enabled{transform:translateX(-50%)}',
        'body[data-layout-theme="center-bar"] #sceneList .scene{flex-direction:column;gap:4px;padding:6px 8px;min-width:72px;border-left:none;border-radius:10px;flex-shrink:0;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);transition:all 0.2s}',
        'body[data-layout-theme="center-bar"] #sceneList .scene:hover{background:rgba(255,255,255,0.1);transform:translateY(-2px)}',
        'body[data-layout-theme="center-bar"] #sceneList .scene.current{background:rgba(225,29,72,0.2);border-color:var(--accent)}',
        'body[data-layout-theme="center-bar"] #sceneList .scene .scene-thumb{width:60px;height:44px;border-radius:6px;object-fit:cover;border:1px solid rgba(255,255,255,0.08)}',
        'body[data-layout-theme="center-bar"] #sceneList .scene .scene-name{font-size:var(--type-2xs);text-align:center;max-width:68px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
        'body[data-layout-theme="center-bar"] #sceneListToggle{display:none}',
        'body[data-layout-theme="center-bar"] #controls{position:fixed;bottom:auto;top:auto;bottom:150px;left:50%;transform:translateX(-50%);flex-direction:row;gap:8px;background:rgba(0,0,0,0.35);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);border:1px solid var(--border-glass);border-radius:12px;padding:6px 12px}',
        'body[data-layout-theme="center-bar"] #controls .ctrl-btn{width:36px;height:36px;background:transparent;border-color:rgba(255,255,255,0.12);border-radius:8px}',
        'body[data-layout-theme="center-bar"] #controls .ctrl-btn svg{width:16px;height:16px}'
      ].join('');
      document.head.appendChild(ts);
    }

    // Force sceneListStyle based on theme (theme CSS handles positioning)
    if (theme !== 'default') {
      data.settings.sceneListStyle = 'bottom-strip';
    }

    // Apply visibility settings (individual buttons first, then master)
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
      // For hamburger theme, move toggle button outside controls first
      if (theme === 'hamburger' && sceneListToggleElement) {
        var hamburgerParent = sceneListToggleElement.parentNode;
        if (hamburgerParent) hamburgerParent.removeChild(sceneListToggleElement);
        document.body.appendChild(sceneListToggleElement);
      }
      var ctrlEl = document.getElementById('controls');
      if (ctrlEl) ctrlEl.style.display = 'none';
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

    // Intro screen (visibility handled by inline script in preview.html for preview mode)
    var introScreen = document.getElementById('intro-screen');
    var startTourBtn = document.getElementById('btn-start-tour');

    if (data.settings.autorotateEnabled && autorotateToggleElement) {
      autorotateToggleElement.classList.add('enabled');
      autorotateToggleElement.classList.add('active');
    }

    // If inline script didn't show intro (e.g. exported tour), check settings here
    if (introScreen && introScreen.style.display === 'none' && data.settings && data.settings.intro && data.settings.intro.enabled) {
      var introTitle = document.getElementById('intro-title');
      var introDesc = document.getElementById('intro-desc');
      if (introTitle) introTitle.textContent = data.settings.intro.title || data.settings.name || 'Xeno Tour';
      if (introDesc) {
        introDesc.textContent = data.settings.intro.subtitle || '';
        introDesc.style.display = data.settings.intro.subtitle ? '' : 'none';
      }
      if (startTourBtn) startTourBtn.textContent = data.settings.intro.buttonText || 'Enter Tour';
      introScreen.style.display = '';
    }

    if (startTourBtn && introScreen && introScreen.style.display !== 'none') {
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
    if (!document.body.classList.contains('mobile') && sceneListToggleElement && theme !== 'hamburger') {
      showSceneList();
    }

    // Hamburger theme: hover to show scene list
    if (theme === 'hamburger') {
      if (sceneListToggleElement) {
        sceneListToggleElement.addEventListener('mouseenter', showSceneList);
      }
      if (sceneListElement) {
        sceneListElement.addEventListener('mouseenter', showSceneList);
        sceneListElement.addEventListener('mouseleave', function () {
          if (!sceneListToggleElement || !sceneListToggleElement.matches(':hover')) {
            hideSceneList();
          }
        });
      }
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

    // ── Capture ──────────────────────────────────────────────────
    var captureToggle = document.getElementById('captureToggle');
    var captureOverlay = document.getElementById('capture-overlay');
    var captureImage = captureOverlay && captureOverlay.querySelector('.capture-image');
    var captureWrap = captureOverlay && captureOverlay.querySelector('.capture-image-wrap');
    var captureClose = document.getElementById('capture-close');
    var captureDownload = document.getElementById('capture-download');
    var ratioOptions = captureOverlay && captureOverlay.querySelectorAll('.ratio-option');
    var currentCaptureDataUrl = null;

    function showCapture(dataUrl) {
      currentCaptureDataUrl = dataUrl;
      if (captureImage) captureImage.src = dataUrl;
      if (captureOverlay) captureOverlay.style.display = 'flex';
      // Reset to full
      if (ratioOptions) {
        ratioOptions.forEach(function (o) { o.classList.remove('active'); });
        var fullOpt = captureOverlay.querySelector('.ratio-option[data-ratio="full"]');
        if (fullOpt) fullOpt.classList.add('active');
      }
      if (captureWrap) captureWrap.setAttribute('data-ratio', 'full');
    }

    function hideCapture() {
      if (captureOverlay) captureOverlay.style.display = 'none';
    }

    if (captureToggle && viewer && viewer.stage) {
      captureToggle.addEventListener('click', function () {
        try {
          var dataUrl = viewer.stage().takeSnapshot({ quality: 92 });
          showCapture(dataUrl);
        } catch (e) {
          showToast('Capture failed: ' + e.message);
        }
      });
    }

    if (ratioOptions) {
      ratioOptions.forEach(function (opt) {
        opt.addEventListener('click', function () {
          ratioOptions.forEach(function (o) { o.classList.remove('active'); });
          this.classList.add('active');
          var ratio = this.getAttribute('data-ratio');
          if (captureWrap) captureWrap.setAttribute('data-ratio', ratio);
        });
      });
    }

    if (captureClose) {
      captureClose.addEventListener('click', hideCapture);
    }

    if (captureDownload && captureOverlay) {
      captureDownload.addEventListener('click', function () {
        if (!currentCaptureDataUrl) return;
        var ratio = captureWrap ? captureWrap.getAttribute('data-ratio') : 'full';
        var img = new Image();
        img.onload = function () {
          var c = document.createElement('canvas');
          var ctx = c.getContext('2d');
          var w = img.naturalWidth, h = img.naturalHeight;
          var dw = w, dh = h;
          if (ratio === '1-1') { dw = Math.min(w, h); dh = dw; }
          else if (ratio === '4-3') { dh = Math.round(dw * 3 / 4); if (dh > h) { dh = h; dw = Math.round(dh * 4 / 3); } }
          else if (ratio === '3-2') { dh = Math.round(dw * 2 / 3); if (dh > h) { dh = h; dw = Math.round(dh * 3 / 2); } }
          else if (ratio === '16-9') { dh = Math.round(dw * 9 / 16); if (dh > h) { dh = h; dw = Math.round(dh * 16 / 9); } }
          c.width = dw; c.height = dh;
          var sx = (w - dw) / 2, sy = (h - dh) / 2;
          ctx.drawImage(img, sx, sy, dw, dh, 0, 0, dw, dh);
          var link = document.createElement('a');
          link.download = 'xeno-capture-' + ratio + '.png';
          link.href = c.toDataURL('image/png');
          link.click();
        };
        img.src = currentCaptureDataUrl;
      });
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