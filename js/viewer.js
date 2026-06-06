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
      mql.addEventListener('change', setMode);
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
    if (!theme) theme = 'hamburger';
    document.body.setAttribute('data-layout-theme', theme);

    if (!document.getElementById('xeno-theme-css')) {
      var ts = document.createElement('style');
      ts.id = 'xeno-theme-css';
      ts.textContent = [
        // ── Gallery: hand of cards at bottom, fan-cascade with 3D depth ──
        'body[data-layout-theme="gallery"] #titleBar{display:none}',
        'body[data-layout-theme="gallery"] #sceneList{position:fixed;top:auto;bottom:40px;left:50%;transform:translateX(-50%) translateY(20px);width:fit-content;max-width:560px;height:auto!important;padding:0;display:flex;flex-direction:row;overflow:hidden!important;align-items:flex-end;justify-content:center;opacity:0;pointer-events:none;transition:opacity 0.4s ease,transform 0.45s cubic-bezier(0.16,1,0.3,1);background:none;border:none;box-shadow:none;backdrop-filter:none;-webkit-backdrop-filter:none}',
        'body[data-layout-theme="gallery"] #sceneList.enabled{opacity:1;pointer-events:auto;transform:translateX(-50%) translateY(0)}',
        'body[data-layout-theme="gallery"] #sceneList .scenes{display:flex;flex-direction:row;gap:0;align-items:flex-end;overflow-x:auto;overflow-y:hidden;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.15) transparent;padding:20px 10px 16px}',
        'body[data-layout-theme="gallery"] #sceneList .scenes::-webkit-scrollbar:vertical{display:none;width:0}',
        'body[data-layout-theme="gallery"] #sceneList .scenes::-webkit-scrollbar{height:3px;background:transparent}',
        'body[data-layout-theme="gallery"] #sceneList .scenes::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15);border-radius:2px}',
        'body[data-layout-theme="gallery"] #sceneList .scene{flex-direction:column;gap:0;padding:0;min-width:90px;max-width:110px;flex-shrink:0;border:none;border-radius:10px;background:none;box-shadow:0 4px 16px rgba(0,0,0,0.4),0 1px 3px rgba(0,0,0,0.5);transition:all 0.3s cubic-bezier(0.34,1.56,0.64,1);margin:0 -4px;position:relative;transform-origin:bottom center;backface-visibility:hidden;-webkit-backface-visibility:hidden}',
        'body[data-layout-theme="gallery"] #sceneList .scene:hover{transform:rotate(0deg) translateY(-12px) scale(1.08)!important;z-index:10!important;opacity:1!important;box-shadow:0 16px 40px rgba(0,0,0,0.6),0 0 20px rgba(225,29,72,0.15)}',
        'body[data-layout-theme="gallery"] #sceneList .scene.current{box-shadow:0 8px 24px rgba(225,29,72,0.3),0 4px 8px rgba(0,0,0,0.5),0 0 0 3px var(--accent);transform:rotate(0deg) translateY(-8px) scale(1.06)!important;z-index:8!important;opacity:1!important}',
        'body[data-layout-theme="gallery"] #sceneList .scene .scene-thumb{width:90px;height:64px;border-radius:10px;object-fit:cover;border:none;box-shadow:0 2px 6px rgba(0,0,0,0.3)}',
        'body[data-layout-theme="gallery"] #sceneList .scene .scene-name{display:none}',
        'body[data-layout-theme="gallery"] #sceneList .scene:nth-child(1){transform:rotate(-5deg) translateY(10px);z-index:1}',
        'body[data-layout-theme="gallery"] #sceneList .scene:nth-child(2){transform:rotate(-3deg) translateY(6px);z-index:2}',
        'body[data-layout-theme="gallery"] #sceneList .scene:nth-child(3){transform:rotate(-1deg) translateY(2px);z-index:3}',
        'body[data-layout-theme="gallery"] #sceneList .scene:nth-child(4){transform:rotate(1deg) translateY(2px);z-index:3}',
        'body[data-layout-theme="gallery"] #sceneList .scene:nth-child(5){transform:rotate(3deg) translateY(6px);z-index:2}',
        'body[data-layout-theme="gallery"] #sceneList .scene:nth-child(6){transform:rotate(5deg) translateY(10px);z-index:1}',
        'body[data-layout-theme="gallery"] #sceneList .scene:nth-child(n+7){transform:rotate(6deg) translateY(14px);z-index:0;opacity:0.5}',
        'body[data-layout-theme="gallery"] #controls .ctrl-btn{width:38px;height:38px;background:rgba(0,0,0,0.5);border-color:rgba(255,255,255,0.18);backdrop-filter:blur(8px)}',
        'body[data-layout-theme="gallery"] #controls{bottom:20px;right:20px}',
        // ── Float: floating pill at bottom center, controls bottom-right stacked ──
        'body[data-layout-theme="float"] #titleBar{position:absolute;top:16px;left:16px;right:auto;width:auto;height:auto;padding:8px 16px;background:rgba(0,0,0,0.5);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);border:1px solid var(--border-glass);border-radius:9999px;box-shadow:0 4px 24px rgba(0,0,0,0.4)}',
        'body[data-layout-theme="float"] #titleBar .sceneName{font-size:var(--type-sm)}',
        'body[data-layout-theme="float"] #sceneList{position:fixed;width:max-content;max-width:min(85vw,1200px);height:auto;top:auto;bottom:20px;left:50%;transform:translate(-50%,30px);border-right:none;border-top:none;background:rgba(0,0,0,0.45);-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);border:1px solid var(--border-glass);border-radius:18px;box-shadow:0 8px 40px rgba(0,0,0,0.5);padding:8px 12px;display:flex;flex-direction:row;overflow-x:auto;overflow-y:hidden;white-space:nowrap;align-items:center;opacity:0;pointer-events:none;transition:opacity 0.35s,transform 0.35s cubic-bezier(0.16,1,0.3,1);scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.2) transparent}',
        'body[data-layout-theme="float"] #sceneList.enabled{opacity:1;pointer-events:auto;transform:translate(-50%,0)}',
        'body[data-layout-theme="float"] #sceneList::-webkit-scrollbar:horizontal{height:4px;background:transparent}',
        'body[data-layout-theme="float"] #sceneList::-webkit-scrollbar-track:horizontal{background:transparent}',
        'body[data-layout-theme="float"] #sceneList::-webkit-scrollbar-thumb:horizontal{background:rgba(255,255,255,0.2);border-radius:0;border:none}',
        'body[data-layout-theme="float"] #sceneList .scenes{display:flex;flex-direction:row;gap:8px}',
        'body[data-layout-theme="float"] #sceneList .scene{flex-direction:column;gap:5px;padding:8px 12px;min-width:90px;border-left:none;flex-shrink:0;border-radius:10px;align-items:center}',
        'body[data-layout-theme="float"] #sceneList .scene.current{background:rgba(225,29,72,0.2);border:1px solid rgba(225,29,72,0.35)}',
        'body[data-layout-theme="float"] #sceneList .scene .scene-thumb{width:64px;height:64px;border-radius:8px;border:1px solid rgba(255,255,255,0.08);flex-shrink:0}',
        'body[data-layout-theme="float"] #sceneList .scene .scene-name{font-size:var(--type-xs);text-align:center;max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text-primary)}',
        'body[data-layout-theme="float"] #controls .ctrl-btn{width:42px;height:42px;background:rgba(0,0,0,0.45);border-color:var(--border-glass);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,0.3)}',
        'body[data-layout-theme="float"] #controls .ctrl-btn svg{width:18px;height:18px}',
        'body[data-layout-theme="float"] #controls{position:fixed;bottom:80px;right:20px;flex-direction:column}',
        // ── Hamburger: side-pull from left, toggle at vertical center, controls bottom-right ──
        'body[data-layout-theme="hamburger"] #titleBar{display:none}',
        'body[data-layout-theme="hamburger"] #sceneList{position:fixed;width:240px;height:auto;max-height:70%;top:50%;bottom:auto;left:0;padding:14px 12px;transform:translateX(-100%) translateY(-50%);border-right:1px solid var(--border-glass);border-top:none;flex-direction:column;display:flex;gap:8px;overflow-y:auto;overflow-x:hidden;background:rgba(0,0,0,0.6);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);border-radius:0 16px 16px 0;box-shadow:4px 0 30px rgba(0,0,0,0.4);transition:transform 0.3s cubic-bezier(0.16,1,0.3,1)}',
        'body[data-layout-theme="hamburger"] #sceneList.enabled{transform:translateY(-50%);pointer-events:auto}',
        'body[data-layout-theme="hamburger"] #sceneList .scene{flex-direction:row;gap:10px;padding:10px 12px;min-width:0;border-left:3px solid transparent;border-radius:12px;flex-shrink:0;background:rgba(255,255,255,0.04);transition:all 0.2s}',
        'body[data-layout-theme="hamburger"] #sceneList .scene:hover{background:rgba(255,255,255,0.1)}',
        'body[data-layout-theme="hamburger"] #sceneList .scene.current{background:rgba(225,29,72,0.15);border-left-color:var(--accent)}',
        'body[data-layout-theme="hamburger"] #sceneList .scene .scene-thumb{width:44px;height:44px;border-radius:10px;object-fit:cover;border:1px solid rgba(255,255,255,0.08);flex-shrink:0}',
        'body[data-layout-theme="hamburger"] #sceneList .scene .scene-name{font-size:var(--type-sm);text-align:left;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;align-self:center}',
        'body[data-layout-theme="hamburger"] #controls{position:fixed;bottom:20px;right:20px;flex-direction:column}',
        // ── Center Bar: full-width bottom bar always visible, controls pill above it ──
        'body[data-layout-theme="center-bar"] #titleBar{display:none}',
        'body[data-layout-theme="center-bar"] #sceneList{position:fixed;top:auto;bottom:90px;left:50%;width:fit-content;max-width:700px;height:auto;min-height:80px;padding:10px 14px;background:rgba(0,0,0,0.5);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);border:1px solid var(--border-glass);border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.5);flex-direction:row;display:flex;overflow:visible;white-space:nowrap;align-items:center;transform:translateX(-50%);opacity:0;pointer-events:none;transition:opacity 0.25s}',
        'body[data-layout-theme="center-bar"] #sceneList.enabled{opacity:1;pointer-events:auto;transform:translateX(-50%)}',
        'body[data-layout-theme="center-bar"] #sceneList .scenes{display:flex;flex-direction:row;gap:4px;max-width:100%;min-width:0;overflow-x:auto;overflow-y:hidden;pointer-events:auto}',
        'body[data-layout-theme="center-bar"] #sceneList .scene{flex-direction:column;gap:0;padding:4px 4px 8px;min-width:72px;border-left:none;border-radius:0;flex-shrink:0;background:none;border:none;transition:none}',
        'body[data-layout-theme="center-bar"] #sceneList .scene:hover{background:none;transform:none}',
        'body[data-layout-theme="center-bar"] #sceneList .scene.current{background:rgba(225,29,72,0.15);border-color:transparent}',
        'body[data-layout-theme="center-bar"] #sceneList .scene.current::after{content:\'\';display:block;width:32px;height:3px;background:var(--accent);border-radius:2px;margin:6px auto 0}',
        'body[data-layout-theme="center-bar"] #sceneList .scene.current .scene-thumb{box-shadow:0 0 0 3px rgba(255,255,255,0.9),0 0 16px var(--accent-glow)}',
        
        'body[data-layout-theme="center-bar"] #sceneList .scenes::-webkit-scrollbar:horizontal{height:4px;background:transparent}',
        'body[data-layout-theme="center-bar"] #sceneList .scenes::-webkit-scrollbar-track:horizontal{background:transparent}',
        'body[data-layout-theme="center-bar"] #sceneList .scenes::-webkit-scrollbar-thumb:horizontal{background:rgba(255,255,255,0.3);border-radius:4px}',
        'body[data-layout-theme="center-bar"] #sceneList .scenes{scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.3) transparent}',
        'body[data-layout-theme="center-bar"] #sceneList .scene .scene-thumb{width:100px;height:100px;border-radius:10px;object-fit:cover}',
        'body[data-layout-theme="center-bar"] #sceneList .scene .scene-name{display:none}',
        'body[data-layout-theme="center-bar"] #controls{position:fixed;width:max-content;bottom:24px;left:50%;transform:translateX(-50%);flex-direction:row;gap:8px;background:rgba(0,0,0,0.4);border:1px solid var(--border-glass);border-radius:12px;padding:6px 10px}',
        'body[data-layout-theme="center-bar"] #controls .ctrl-btn{width:36px;height:36px;background:transparent;border-color:rgba(255,255,255,0.12);border-radius:8px}',
        'body[data-layout-theme="center-bar"] #controls .ctrl-btn svg{width:16px;height:16px}'
      ].join('');
      document.head.appendChild(ts);
    }

    // Force sceneListStyle based on theme (theme CSS handles positioning)
    if (theme !== 'hamburger') {
      data.settings.sceneListStyle = 'bottom-strip';
    }

    // ── Center-bar drag-to-scroll (mouse + touch) ──────────────────────────
    (function() {
      function initDragScroll(el) {
        if (!el || el._dragScrollInit) return;
        el._dragScrollInit = true;

        var isDown  = false;
        var startX  = 0;
        var scrollL = 0;
        var moved   = false;
        var THRESHOLD = 5;

        // ── Mouse ──────────────────────────────
        el.addEventListener('mousedown', function(e) {
          if (e.button !== 0) return;
          isDown  = true;
          moved   = false;
          startX  = e.pageX - el.offsetLeft;
          scrollL = el.scrollLeft;
          el.style.cursor = 'grabbing';
          el.style.userSelect = 'none';
        });

        window.addEventListener('mouseup', function() {
          if (!isDown) return;
          isDown = false;
          el.style.cursor = '';
          el.style.userSelect = '';
        });

        window.addEventListener('mousemove', function(e) {
          if (!isDown) return;
          var x    = e.pageX - el.offsetLeft;
          var walk = x - startX;
          if (Math.abs(walk) > THRESHOLD) {
            moved = true;
            e.preventDefault();
            el.scrollLeft = scrollL - walk;
          }
        });

        el.addEventListener('click', function(e) {
          if (moved) {
            e.stopPropagation();
            e.preventDefault();
            moved = false;
          }
        }, true);

        // ── Touch ──────────────────────────────
        var touchStartX  = 0;
        var touchScrollL = 0;
        var touchMoved   = false;

        el.addEventListener('touchstart', function(e) {
          touchStartX  = e.touches[0].pageX;
          touchScrollL = el.scrollLeft;
          touchMoved   = false;
        }, { passive: true });

        el.addEventListener('touchmove', function(e) {
          var dx = touchStartX - e.touches[0].pageX;
          if (Math.abs(dx) > THRESHOLD) {
            touchMoved  = true;
            el.scrollLeft = touchScrollL + dx;
            e.stopPropagation();
          }
        }, { passive: false });

        el.addEventListener('touchend', function(e) {
          if (touchMoved) e.stopPropagation();
        });

        // ── Wheel: vertical scroll → horizontal ──
        el.addEventListener('wheel', function(e) {
          if (e.deltaY !== 0 && document.body.getAttribute('data-layout-theme') !== 'hamburger') {
            e.preventDefault();
            el.scrollLeft += e.deltaY * 1.5;
          }
        }, { passive: false });
      }

      function attachWhenReady() {
        var scenes = document.querySelector('#sceneList .scenes');
        if (scenes) initDragScroll(scenes);
        var list = document.querySelector('#sceneList');
        if (list && list !== scenes) initDragScroll(list);
      }

      attachWhenReady();

      var themeObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(m) {
          if (m.attributeName === 'data-layout-theme') {
            setTimeout(attachWhenReady, 100);
          }
        });
      });
      themeObserver.observe(document.body, { attributes: true });
    })();

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
      var ctrlEl = document.getElementById('controls');
      if (ctrlEl) ctrlEl.style.display = 'none';
    }
    if (data.settings.showScenes === false) {
      if (sceneListToggleElement) sceneListToggleElement.style.display = 'none';
      if (sceneListElement) { sceneListElement.style.display = 'none'; sceneListElement.classList.remove('enabled'); }
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
    var scenes = (data.scenes || []).map(function (sceneData) {
      if (!sceneData || !sceneData.mediaUrl) return null;
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
    }).filter(Boolean);

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
      });
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
    var showScenes = data.settings.showScenes !== false;
    if (!showScenes) {
      hideSceneList();
    } else if (!document.body.classList.contains('mobile') && sceneListToggleElement && theme !== 'hamburger') {
      hideSceneList();
    }

    // Prevent wheel events on scene list from zooming the pano
    if (sceneListElement) {
      sceneListElement.addEventListener('wheel', function(e) { e.stopPropagation(); }, { passive: false });
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

    // ── Pan Controls ─────────────────────────────────────────────
    if (viewControlsToggle) {
      viewControlsToggle.addEventListener('click', function () {
        this.classList.toggle('active');
        var viewControlsEl = document.querySelector('#viewControls');
        if (viewControlsEl) viewControlsEl.classList.toggle('visible');
      });
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

    // Hide loading overlay after first scene renders
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
        setTimeout(function() { loader.classList.add('hide'); }, 200);
      }
    }

  } // end initViewer()

  // ── Resolve media IDs to blob URLs ────────────────────────
  function isMediaId(v) { return typeof v === 'string' && v.indexOf('media_') === 0; }

  function resolveMediaIdOrUrl(v) {
    if (isMediaId(v)) {
      if (window.XenoSupabase)
        return window.XenoSupabase.resolveMediaId(v).then(function (b) { return b || null; });
      return Promise.resolve(null);
    }
    return Promise.resolve(v);
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
      var loadCount = 0;
      var first = tourData.scenes[0];
      if (first && first.mediaUrl && first.type !== 'video') {
        var img = new Image();
        img.onload = img.onerror = function () { resolve(tourData); };
        img.src = first.mediaUrl;
      } else {
        resolve(tourData);
      }
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