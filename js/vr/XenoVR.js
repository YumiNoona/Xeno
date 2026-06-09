/*
 * Xeno VR — WebXR + A-Frame Immersive Mode
 * ─────────────────────────────────────────

 
 * Features:
 *  • WebXR immersive-vr (Quest 2/3, Pico, any OpenXR browser)
 *  • Fallback stereo CSS split for non-XR phones (Google Cardboard)
 *  • Head-tracked 360° equirectangular sky — full stereoscopic in headset
 *  • Gaze reticle with animated dwell ring (1.4 s) for navigate hotspots
 *  • Info hotspot gaze-dwell shows floating label panel in-world
 *  • Scene switching syncs back to Marzipano on exit
 *  • VR button shows "not supported" toast if WebXR unavailable
 *  • Exit VR restores Marzipano at the scene you were viewing
 */
(function () {
  'use strict';

  /* ── State ───────────────────────────────────────────────── */
  var vrOverlay        = null;   // full-screen wrapper div
  var aScene           = null;   // <a-scene> element
  var vrActive         = false;
  var currentVrSceneId = null;   // scene id currently shown in VR
  var componentsRegistered = false;

  /* ── Public API ──────────────────────────────────────────── */
  window.XenoVR = {
    isSupported : isSupported,
    enter       : enterVR,
    exit        : exitVR,
    toggle      : toggleVR,
    syncScene   : syncScene
  };

  /* ─────────────────────────────────────────────────────────
     Support detection
  ───────────────────────────────────────────────────────── */
  function isSupported() {
    return !!(navigator.xr);
  }

  function checkImmersiveSupport(cb) {
    if (navigator.xr && navigator.xr.isSessionSupported) {
      navigator.xr.isSessionSupported('immersive-vr')
        .then(cb).catch(function () { cb(false); });
    } else {
      cb(false);
    }
  }

  /* ─────────────────────────────────────────────────────────
     Toggle / Enter / Exit
  ───────────────────────────────────────────────────────── */
  function toggleVR() {
    if (vrActive) { exitVR(); } else { enterVR(); }
  }

  function enterVR() {
    if (vrActive) return;

    var sceneData = currentSceneData();
    if (!sceneData) { showToast('No scene loaded yet.'); return; }

    ensureAFrame(function () {
      buildOverlay(sceneData);
      vrActive = true;
      updateVrButton(true);
      document.body.classList.add('xeno-vr-active');
    });
  }

  function exitVR() {
    if (!vrActive) return;

    if (aScene && aScene.is && aScene.is('vr-mode')) {
      try { aScene.exitVR(); } catch(e) {}
    }

    /* Sync the scene the user ended on back to Marzipano */
    if (currentVrSceneId && window.xenoScenes) {
      var ctx = window.xenoScenes.find(function (s) {
        return s.data.id === currentVrSceneId;
      });
      if (ctx && window.xenoSwitchScene) {
        window.xenoSwitchScene(ctx, { transition: 'none' });
      }
    }

    if (vrOverlay && vrOverlay.parentNode) {
      vrOverlay.parentNode.removeChild(vrOverlay);
    }
    vrOverlay = null;
    aScene    = null;
    vrActive  = false;
    updateVrButton(false);
    document.body.classList.remove('xeno-vr-active');
  }

  /* Sync to a scene while already in VR (called from switchScene hook) */
  function syncScene(sceneId) {
    if (!vrActive || !aScene) return;
    var ctx = (window.xenoScenes || []).find(function (s) {
      return s.data.id === sceneId;
    });
    if (ctx) swapVrScene(ctx.data);
  }

  /* ─────────────────────────────────────────────────────────
     A-Frame lazy loader
  ───────────────────────────────────────────────────────── */
  var aframeLoaded    = false;
  var aframeCallbacks = [];

  function ensureAFrame(cb) {
    if (aframeLoaded) { cb(); return; }
    aframeCallbacks.push(cb);
    if (document.querySelector('script[data-xenovr-aframe]')) return;

    var s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/aframe/1.5.0/aframe.min.js';
    s.setAttribute('data-xenovr-aframe', '1');
    s.onload = function () {
      aframeLoaded = true;
      registerComponents();
      aframeCallbacks.forEach(function (fn) { fn(); });
      aframeCallbacks = [];
    };
    s.onerror = function () {
      showToast('Could not load VR engine. Check your internet connection.');
    };
    document.head.appendChild(s);
  }

  /* ─────────────────────────────────────────────────────────
     Custom A-Frame components
  ───────────────────────────────────────────────────────── */
  function registerComponents() {
    if (componentsRegistered) return;
    componentsRegistered = true;

    /* ── gaze-hotspot ────────────────────────────────────────
       Attach to any <a-entity>. Fires on cursor fuse or click.
       Updates the SVG dwell ring in the HUD overlay.
    ─────────────────────────────────────────────────────── */
    AFRAME.registerComponent('gaze-hotspot', {
      schema: {
        label    : { type: 'string', default: '' },
        duration : { type: 'number', default: 1400 },
        type     : { type: 'string', default: 'navigate' },
        sceneId  : { type: 'string', default: '' },
        infoText : { type: 'string', default: '' }
      },
      init: function () {
        var self = this;
        self._timer = null;
        self._t0    = 0;

        this.el.addEventListener('mouseenter', function () {
          showVrLabel(self.data.label);
          self._startDwell();
        });
        this.el.addEventListener('mouseleave', function () {
          hideVrLabel();
          self._cancelDwell();
        });
        /* Also respond to controller trigger / screen tap */
        this.el.addEventListener('click', function () {
          self._cancelDwell();
          self._activate();
        });
      },
      _startDwell: function () {
        var self = this;
        self._t0 = Date.now();
        clearInterval(self._timer);
        self._timer = setInterval(function () {
          var pct = Math.min(1, (Date.now() - self._t0) / self.data.duration);
          setDwellRing(pct);
          if (pct >= 1) {
            clearInterval(self._timer);
            self._activate();
          }
        }, 16);
      },
      _cancelDwell: function () {
        clearInterval(this._timer);
        setDwellRing(0);
      },
      _activate: function () {
        hideVrLabel();
        setDwellRing(0);
        if (this.data.type === 'navigate') {
          vrSwitchScene(this.data.sceneId);
        } else {
          showVrInfoPanel(this.data.label, this.data.infoText);
        }
      }
    });

    /* ── billboard ───────────────────────────────────────────
       Always face the camera (for hotspot entities)
    ─────────────────────────────────────────────────────── */
    AFRAME.registerComponent('billboard', {
      tick: function () {
        var cam = document.querySelector('#xenovr-cam');
        if (!cam) return;
        this.el.object3D.lookAt(cam.object3D.getWorldPosition(new THREE.Vector3()));
      }
    });
  }

  /* ─────────────────────────────────────────────────────────
     Build the VR overlay DOM
  ───────────────────────────────────────────────────────── */
  function buildOverlay(sceneData) {
    /* Wrapper */
    vrOverlay = document.createElement('div');
    vrOverlay.id = 'xeno-vr-overlay';
    vrOverlay.style.cssText = [
      'position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999;',
      'background:#000;overflow:hidden;',
      'animation:xenoVrIn 0.3s cubic-bezier(0.16,1,0.3,1)'
    ].join('');
    document.body.appendChild(vrOverlay);

    /* ── A-Frame scene ───────────────────────────────────── */
    var sceneEl = document.createElement('a-scene');
    sceneEl.setAttribute('embedded', '');
    sceneEl.setAttribute('renderer',
      'antialias:true;logarithmicDepthBuffer:true;colorManagement:true;');
    sceneEl.setAttribute('vr-mode-ui', 'enabled:true');
    sceneEl.setAttribute('loading-screen', 'enabled:false');
    sceneEl.setAttribute('background', 'color:#000000');
    sceneEl.style.cssText = 'width:100%;height:100%;position:absolute;top:0;left:0;';
    aScene = sceneEl;

    /* Sky — equirectangular 360 image */
    var sky = document.createElement('a-sky');
    sky.id = 'xenovr-sky';
    sky.setAttribute('src', (sceneData.mediaUrl && sceneData.mediaUrl.indexOf('media_') === 0) ? '' : (sceneData.mediaUrl || ''));
    sky.setAttribute('rotation', '0 -90 0');
    sky.setAttribute('radius', '100');
    sceneEl.appendChild(sky);

    /* Camera rig (parent = positional; child = camera with look-controls) */
    var rig = document.createElement('a-entity');
    rig.id = 'xenovr-rig';
    rig.setAttribute('position', '0 0 0');

    var cam = document.createElement('a-camera');
    cam.id = 'xenovr-cam';
    cam.setAttribute('look-controls',
      'enabled:true;pointerLockEnabled:false;touchEnabled:true;magicWindowTrackingEnabled:true;');
    cam.setAttribute('wasd-controls', 'enabled:false');
    cam.setAttribute('fov', '90');
    cam.setAttribute('near', '0.1');
    cam.setAttribute('far', '200');

    /* Gaze cursor — small white dot with dwell animation */
    var cursor = document.createElement('a-cursor');
    cursor.id = 'xenovr-cursor';
    cursor.setAttribute('color', '#ffffff');
    cursor.setAttribute('opacity', '0.85');
    cursor.setAttribute('radius', '0.007');
    cursor.setAttribute('max-distance', '100');
    cursor.setAttribute('rayOrigin', 'mouse');
    /* Fuse drives the click event after duration (as backup for controller) */
    cursor.setAttribute('fuse', 'false');

    /* Cursor hover / click animations */
    cursor.setAttribute('animation__mouseenter',
      'property:scale;startEvents:mouseenter;easing:easeOutBack;dur:200;from:1 1 1;to:1.6 1.6 1.6');
    cursor.setAttribute('animation__mouseleave',
      'property:scale;startEvents:mouseleave;easing:easeOutQuad;dur:200;from:1.6 1.6 1.6;to:1 1 1');

    cam.appendChild(cursor);

    /* In-world scene name text (subtle, bottom of view) */
    var nameText = document.createElement('a-text');
    nameText.id = 'xenovr-scene-name';
    nameText.setAttribute('value', cleanName(sceneData.name));
    nameText.setAttribute('position', '0 -0.65 -2.2');
    nameText.setAttribute('align', 'center');
    nameText.setAttribute('color', '#aaaaaa');
    nameText.setAttribute('width', '3.5');
    nameText.setAttribute('font', 'roboto');
    nameText.setAttribute('letter-spacing', '2');
    cam.appendChild(nameText);

    /* In-world info panel (hidden until gaze-activated) */
    buildVrInfoPanelEl(cam);

    rig.appendChild(cam);
    sceneEl.appendChild(rig);

    /* Left controller (Quest) */
    var leftCtrl = document.createElement('a-entity');
    leftCtrl.setAttribute('oculus-touch-controls', 'hand:left');
    sceneEl.appendChild(leftCtrl);

    /* Right controller (Quest) — ray for pointing at hotspots */
    var rightCtrl = document.createElement('a-entity');
    rightCtrl.setAttribute('oculus-touch-controls', 'hand:right');
    rightCtrl.setAttribute('laser-controls', 'hand:right');
    rightCtrl.setAttribute('raycaster', 'far:100;objects:.vr-hotspot');
    sceneEl.appendChild(rightCtrl);

    /* Hotspots */
    buildVrHotspots(sceneData, sceneEl);

    vrOverlay.appendChild(sceneEl);

    /* HUD layer (DOM, outside canvas) */
    buildVrHUD();

    /* Auto-enter WebXR once scene is ready */
    sceneEl.addEventListener('loaded', function () {
      checkImmersiveSupport(function (supported) {
        if (supported) {
          /* Small delay so the scene has fully initialised */
          setTimeout(function () { sceneEl.enterVR(); }, 400);
        }
        /* else: stays in flat 360° mode — still great on desktop/mobile */
      });
    });

    /* If the user exits via the browser's own VR UI */
    sceneEl.addEventListener('exit-vr', function () {
      if (vrActive) exitVR();
    });

    currentVrSceneId = sceneData.id;
  }

  /* ─────────────────────────────────────────────────────────
     Hotspot entities
  ───────────────────────────────────────────────────────── */
  function buildVrHotspots(sceneData, sceneEl) {
    var old = sceneEl.querySelector('#xenovr-hotspots');
    if (old) old.parentNode.removeChild(old);

    var group = document.createElement('a-entity');
    group.id = 'xenovr-hotspots';

    /* Collect all hotspot arrays */
    var all = [];
    var add = function (arr, forceType) {
      (arr || []).forEach(function (hs) { all.push({ hs: hs, forceType: forceType }); });
    };
    add(sceneData.hotspots,      null);
    add(sceneData.linkHotspots,  'navigate');
    add(sceneData.infoHotspots,  'info');
    add(sceneData.mediaHotspots, 'info');

    all.forEach(function (item) {
      var hs   = item.hs;
      var type = item.forceType
        || hs.style
        || (hs.target ? 'navigate' : 'info');
      if (type === 'link') type = 'navigate';

      var yaw   = hs.yaw   || 0;
      var pitch = hs.pitch || 0;

      /* Spherical → cartesian, r=95 (just inside sky radius=100) */
      var r = 95;
      var x = -r * Math.cos(pitch) * Math.sin(yaw);
      var y =  r * Math.sin(pitch);
      var z = -r * Math.cos(pitch) * Math.cos(yaw);

      var entity = document.createElement('a-entity');
      entity.setAttribute('position', x + ' ' + y + ' ' + z);
      entity.setAttribute('billboard', '');
      entity.classList.add('vr-hotspot');

      var isNav = (type === 'navigate');

      /* Backing disc */
      var disc = document.createElement('a-circle');
      disc.setAttribute('radius', '1.8');
      disc.setAttribute('color',   isNav ? '#0a0a20' : '#0a200a');
      disc.setAttribute('opacity', '0.82');
      disc.setAttribute('side',    'double');
      disc.classList.add('vr-hotspot');

      /* Outer glow ring */
      var ring = document.createElement('a-torus');
      ring.setAttribute('radius',         '1.9');
      ring.setAttribute('radius-tubular', '0.08');
      ring.setAttribute('color',  isNav ? '#4466ff' : '#44cc88');
      ring.setAttribute('opacity', '0.7');
      ring.setAttribute('animation',
        'property:scale;from:1 1 1;to:1.25 1.25 1.25;' +
        'loop:true;dir:alternate;dur:1400;easing:easeInOutSine');

      /* Icon text (A-Frame text as icon approximation) */
      var icon = document.createElement('a-text');
      icon.setAttribute('value',    isNav ? '▶' : '●');
      icon.setAttribute('align',    'center');
      icon.setAttribute('baseline', 'center');
      icon.setAttribute('color',    isNav ? '#88aaff' : '#88ffcc');
      icon.setAttribute('width',    '5');
      icon.setAttribute('position', '0 0 0.2');
      icon.setAttribute('font',     'roboto');

      /* Label */
      var label = document.createElement('a-text');
      var labelStr = cleanName(hs.title || hs.label || (isNav ? 'Go' : 'Info'));
      label.setAttribute('value',    labelStr);
      label.setAttribute('align',    'center');
      label.setAttribute('baseline', 'center');
      label.setAttribute('color',    '#ffffff');
      label.setAttribute('width',    '7');
      label.setAttribute('position', '0 -2.6 0');
      label.setAttribute('font',     'roboto');

      /* Attach gaze component to disc */
      disc.setAttribute('gaze-hotspot', [
        'label:' + labelStr,
        'type:'  + type,
        'sceneId:' + (hs.target || ''),
        'infoText:' + (hs.text  || '')
      ].join(';'));

      entity.appendChild(disc);
      entity.appendChild(ring);
      entity.appendChild(icon);
      entity.appendChild(label);
      group.appendChild(entity);
    });

    sceneEl.appendChild(group);
  }

  /* ─────────────────────────────────────────────────────────
     In-world info panel (attached to camera so it follows head)
  ───────────────────────────────────────────────────────── */
  function buildVrInfoPanelEl(cam) {
    var panel = document.createElement('a-entity');
    panel.id = 'xenovr-info-panel';
    panel.setAttribute('visible', 'false');
    panel.setAttribute('position', '0 0.1 -2.5');

    var bg = document.createElement('a-plane');
    bg.setAttribute('width',   '1.6');
    bg.setAttribute('height',  '0.7');
    bg.setAttribute('color',   '#111111');
    bg.setAttribute('opacity', '0.92');
    bg.setAttribute('side',    'double');

    var title = document.createElement('a-text');
    title.id = 'xenovr-info-title';
    title.setAttribute('value',    '');
    title.setAttribute('align',    'center');
    title.setAttribute('baseline', 'center');
    title.setAttribute('color',    '#ffffff');
    title.setAttribute('width',    '2.8');
    title.setAttribute('position', '0 0.18 0.01');
    title.setAttribute('font',     'roboto');

    var body = document.createElement('a-text');
    body.id = 'xenovr-info-body';
    body.setAttribute('value',      '');
    body.setAttribute('align',      'center');
    body.setAttribute('baseline',   'center');
    body.setAttribute('color',      '#cccccc');
    body.setAttribute('width',      '2.6');
    body.setAttribute('position',   '0 -0.04 0.01');
    body.setAttribute('font',       'roboto');
    body.setAttribute('wrap-count', '50');

    var hint = document.createElement('a-text');
    hint.setAttribute('value',    'Look away to close');
    hint.setAttribute('align',    'center');
    hint.setAttribute('color',    '#666666');
    hint.setAttribute('width',    '2');
    hint.setAttribute('position', '0 -0.26 0.01');
    hint.setAttribute('font',     'roboto');

    panel.appendChild(bg);
    panel.appendChild(title);
    panel.appendChild(body);
    panel.appendChild(hint);
    cam.appendChild(panel);
  }

  function showVrInfoPanel(titleStr, bodyStr) {
    var panel = document.getElementById('xenovr-info-panel');
    if (!panel) return;
    var t = document.getElementById('xenovr-info-title');
    var b = document.getElementById('xenovr-info-body');
    if (t) t.setAttribute('value', titleStr || '');
    if (b) b.setAttribute('value', bodyStr  || '');
    panel.setAttribute('visible', 'true');
    /* Auto-hide after 6 s */
    clearTimeout(panel._ht);
    panel._ht = setTimeout(function () {
      if (panel) panel.setAttribute('visible', 'false');
    }, 6000);
  }

  /* ─────────────────────────────────────────────────────────
     Dwell ring — drawn in the HUD SVG layer (DOM, not 3D)
  ───────────────────────────────────────────────────────── */
  function setDwellRing(pct) {
    var ring = document.getElementById('xenovr-dwell-ring');
    if (!ring) return;
    var r    = 20;
    var circ = 2 * Math.PI * r;
    ring.setAttribute('stroke-dasharray',  (circ * pct).toFixed(2) + ' ' + circ);
    ring.setAttribute('stroke-dashoffset', '0');
    ring.setAttribute('opacity', pct > 0 ? '1' : '0');
  }

  /* ─────────────────────────────────────────────────────────
     HUD overlay — exit button, dwell ring SVG, scene strip
  ───────────────────────────────────────────────────────── */
  function buildVrHUD() {
    var hud = document.createElement('div');
    hud.id = 'xenovr-hud';
    hud.style.cssText = [
      'position:absolute;top:0;left:0;right:0;bottom:0;',
      'pointer-events:none;z-index:10;',
      'font-family:"JetBrains Mono","Courier New",monospace;'
    ].join('');

    /* Exit button */
    var exitBtn = document.createElement('button');
    exitBtn.id = 'xenovr-exit-btn';
    exitBtn.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" ' +
      'fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">' +
      '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
      '<span style="margin-left:7px">Exit VR</span>';
    exitBtn.style.cssText = [
      'position:absolute;top:16px;right:16px;',
      'background:rgba(0,0,0,0.72);',
      'border:1px solid rgba(255,255,255,0.18);',
      'color:#fff;padding:8px 16px;border-radius:8px;',
      'font-family:inherit;font-size:12px;letter-spacing:0.06em;',
      'cursor:pointer;pointer-events:auto;',
      'display:flex;align-items:center;',
      'backdrop-filter:blur(10px);',
      'transition:background 0.14s,border-color 0.14s;'
    ].join('');
    exitBtn.onmouseenter = function () {
      exitBtn.style.background     = 'rgba(200,30,60,0.8)';
      exitBtn.style.borderColor    = 'rgba(255,80,100,0.5)';
    };
    exitBtn.onmouseleave = function () {
      exitBtn.style.background     = 'rgba(0,0,0,0.72)';
      exitBtn.style.borderColor    = 'rgba(255,255,255,0.18)';
    };
    exitBtn.addEventListener('click', exitVR);

    /* Dwell ring SVG — centred crosshair */
    var dwellSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    dwellSvg.id = 'xenovr-dwell-svg';
    dwellSvg.setAttribute('width',  '56');
    dwellSvg.setAttribute('height', '56');
    dwellSvg.setAttribute('viewBox', '0 0 56 56');
    dwellSvg.style.cssText = [
      'position:absolute;top:50%;left:50%;',
      'transform:translate(-50%,-50%);',
      'pointer-events:none;'
    ].join('');

    /* Background circle (faint) */
    var bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    bgCircle.setAttribute('cx', '28');
    bgCircle.setAttribute('cy', '28');
    bgCircle.setAttribute('r',  '20');
    bgCircle.setAttribute('fill',   'none');
    bgCircle.setAttribute('stroke', 'rgba(255,255,255,0.12)');
    bgCircle.setAttribute('stroke-width', '2.5');

    /* Progress arc */
    var ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    ring.id = 'xenovr-dwell-ring';
    ring.setAttribute('cx', '28');
    ring.setAttribute('cy', '28');
    ring.setAttribute('r',  '20');
    ring.setAttribute('fill',   'none');
    ring.setAttribute('stroke', '#e62e5a');
    ring.setAttribute('stroke-width',    '3');
    ring.setAttribute('stroke-linecap',  'round');
    ring.setAttribute('stroke-dasharray','0 125.66');
    ring.setAttribute('opacity', '0');
    /* Rotate so arc starts from top */
    ring.setAttribute('transform', 'rotate(-90 28 28)');

    /* Centre dot */
    var dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('cx', '28');
    dot.setAttribute('cy', '28');
    dot.setAttribute('r',  '3');
    dot.setAttribute('fill', 'rgba(255,255,255,0.9)');

    dwellSvg.appendChild(bgCircle);
    dwellSvg.appendChild(ring);
    dwellSvg.appendChild(dot);

    /* Gaze label */
    var gazeLabel = document.createElement('div');
    gazeLabel.id = 'xenovr-hud-label';
    gazeLabel.style.cssText = [
      'position:absolute;top:calc(50% + 42px);left:50%;',
      'transform:translateX(-50%);',
      'background:rgba(0,0,0,0.65);color:#fff;',
      'padding:5px 14px;border-radius:20px;',
      'font-size:12px;letter-spacing:0.06em;white-space:nowrap;',
      'opacity:0;transition:opacity 0.18s;pointer-events:none;',
      'backdrop-filter:blur(6px);',
      'border:1px solid rgba(255,255,255,0.12);'
    ].join('');

    /* Scene strip */
    var strip = buildSceneStrip();

    /* VR status badge */
    var badge = document.createElement('div');
    badge.id = 'xenovr-badge';
    badge.textContent = 'VR READY — ENTER HEADSET';
    badge.style.cssText = [
      'position:absolute;top:16px;left:50%;transform:translateX(-50%);',
      'background:rgba(0,0,0,0.6);color:rgba(255,255,255,0.5);',
      'padding:4px 12px;border-radius:20px;',
      'font-size:10px;letter-spacing:0.1em;pointer-events:none;',
      'border:1px solid rgba(255,255,255,0.1);'
    ].join('');

    /* Check if actually immersive — hide badge once in VR */
    checkImmersiveSupport(function (sup) {
      if (!sup) {
        badge.textContent = '360° VIEW — WebXR not detected';
      }
    });

    hud.appendChild(exitBtn);
    hud.appendChild(dwellSvg);
    hud.appendChild(gazeLabel);
    hud.appendChild(badge);
    hud.appendChild(strip);
    vrOverlay.appendChild(hud);
  }

  /* ─────────────────────────────────────────────────────────
     Scene thumbnail strip (bottom of screen)
  ───────────────────────────────────────────────────────── */
  function buildSceneStrip() {
    var strip = document.createElement('div');
    strip.id = 'xenovr-scene-strip';
    strip.style.cssText = [
      'position:absolute;bottom:0;left:0;right:0;',
      'display:flex;align-items:flex-end;gap:8px;padding:16px 20px 14px;',
      'background:linear-gradient(to top,rgba(0,0,0,0.75) 0%,transparent 100%);',
      'pointer-events:auto;overflow-x:auto;'
    ].join('');

    (window.xenoScenes || []).forEach(function (ctx) {
      if (ctx.data.hidden) return;

      var btn = document.createElement('button');
      var isCurrent = ctx.data.id === currentVrSceneId;
      btn.title = cleanName(ctx.data.name);
      btn.style.cssText = [
        'flex-shrink:0;width:80px;height:52px;',
        'border-radius:7px;overflow:hidden;',
        'border:2px solid ' + (isCurrent ? '#e62e5a' : 'rgba(255,255,255,0.15)') + ';',
        'cursor:pointer;background:#111;padding:0;',
        'transform:' + (isCurrent ? 'translateY(-5px)' : 'none') + ';',
        'transition:border-color 0.14s,transform 0.14s;',
        'font-family:inherit;position:relative;'
      ].join('');

      if (ctx.data.thumbnailUrl || ctx.data.mediaUrl) {
        btn.style.backgroundImage    = 'url(' + (ctx.data.thumbnailUrl || ctx.data.mediaUrl) + ')';
        btn.style.backgroundSize     = 'cover';
        btn.style.backgroundPosition = 'center';
      }

      /* Scene name chip */
      var name = document.createElement('div');
      name.textContent = cleanName(ctx.data.name);
      name.style.cssText = [
        'position:absolute;bottom:0;left:0;right:0;',
        'background:rgba(0,0,0,0.65);color:#fff;',
        'font-size:9px;letter-spacing:0.04em;',
        'padding:3px 4px;text-align:center;',
        'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;'
      ].join('');
      btn.appendChild(name);

      btn.addEventListener('mouseenter', function () {
        btn.style.borderColor = '#e62e5a';
        btn.style.transform   = 'translateY(-5px)';
      });
      btn.addEventListener('mouseleave', function () {
        if (ctx.data.id !== currentVrSceneId) {
          btn.style.borderColor = 'rgba(255,255,255,0.15)';
          btn.style.transform   = 'none';
        }
      });
      btn.addEventListener('click', function () { vrSwitchScene(ctx.data.id); });
      strip.appendChild(btn);
    });

    return strip;
  }

  /* ─────────────────────────────────────────────────────────
     Switch scene inside VR
  ───────────────────────────────────────────────────────── */
  function vrSwitchScene(sceneId) {
    if (!sceneId || !window.xenoScenes) return;
    var ctx = window.xenoScenes.find(function (s) { return s.data.id === sceneId; });
    if (!ctx) return;
    currentVrSceneId = sceneId;
    swapVrScene(ctx.data);
    if (window.xenoSwitchScene) window.xenoSwitchScene(ctx, { transition: 'none' });
  }

  function swapVrScene(sceneData) {
    if (!aScene) return;

    /* Fade sky out, swap texture, fade back in */
    var sky = aScene.querySelector('#xenovr-sky');
    if (sky) {
      sky.setAttribute('animation',
        'property:material.opacity;from:1;to:0;dur:300;easing:easeInQuad');
      setTimeout(function () {
        sky.setAttribute('src', '');
        sky.setAttribute('src', (sceneData.mediaUrl && sceneData.mediaUrl.indexOf('media_') === 0) ? '' : (sceneData.mediaUrl || ''));
        sky.setAttribute('animation',
          'property:material.opacity;from:0;to:1;dur:400;easing:easeOutQuad');
      }, 320);
    }

    buildVrHotspots(sceneData, aScene);

    var nameEl = aScene.querySelector('#xenovr-scene-name');
    if (nameEl) nameEl.setAttribute('value', cleanName(sceneData.name));

    /* Rebuild strip */
    var oldStrip = document.getElementById('xenovr-scene-strip');
    if (oldStrip && oldStrip.parentNode) {
      oldStrip.parentNode.replaceChild(buildSceneStrip(), oldStrip);
    }
  }

  /* ─────────────────────────────────────────────────────────
     HUD label helpers
  ───────────────────────────────────────────────────────── */
  function showVrLabel(text) {
    var el = document.getElementById('xenovr-hud-label');
    if (el) { el.textContent = text; el.style.opacity = '1'; }
  }
  function hideVrLabel() {
    var el = document.getElementById('xenovr-hud-label');
    if (el) el.style.opacity = '0';
  }

  /* ─────────────────────────────────────────────────────────
     Helpers
  ───────────────────────────────────────────────────────── */
  function currentSceneData() {
    var scenes = window.xenoScenes || [];
    if (!scenes.length) return null;
    if (currentVrSceneId) {
      var found = scenes.find(function (s) { return s.data.id === currentVrSceneId; });
      if (found) return found.data;
    }
    /* Fall back to first visible */
    var vis = scenes.find(function (s) { return !s.data.hidden; });
    return vis ? vis.data : scenes[0].data;
  }

  function cleanName(name) {
    return (name || '').replace(/\.[^/.]+$/, '').trim();
  }

  function updateVrButton(active) {
    var btn = document.getElementById('vrToggle');
    if (btn) btn.classList.toggle('active', active);
  }

  function showToast(msg) {
    if (window.showToast) { window.showToast(msg); return; }
    var t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = [
      'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);',
      'background:#222;color:#fff;padding:10px 20px;',
      'border-radius:20px;font-size:13px;z-index:999999;',
      'pointer-events:none;font-family:"JetBrains Mono",monospace;'
    ].join('');
    document.body.appendChild(t);
    setTimeout(function () { t.parentNode && t.parentNode.removeChild(t); }, 3000);
  }

  /* ─────────────────────────────────────────────────────────
     Global CSS
  ───────────────────────────────────────────────────────── */
  var style = document.createElement('style');
  style.textContent = [
    '@keyframes xenoVrIn {',
    '  from { opacity:0; transform:scale(1.04); }',
    '  to   { opacity:1; transform:scale(1); }',
    '}',
    /* Hide Marzipano UI when VR overlay is active */
    'body.xeno-vr-active > #pano,',
    'body.xeno-vr-active > #controls,',
    'body.xeno-vr-active > #titleBar,',
    'body.xeno-vr-active > #sceneList,',
    'body.xeno-vr-active > #viewControls,',
    'body.xeno-vr-active > #viewModeMenu,',
    'body.xeno-vr-active > #xeno-minimap,',
    'body.xeno-vr-active > #transition-overlay {',
    '  visibility:hidden !important;',
    '}',
    /* Hide A-Frame's own enter-VR button (we control it) */
    '.a-enter-vr { display:none !important; }',
    /* Thin scrollbar on scene strip */
    '#xenovr-scene-strip::-webkit-scrollbar { height:3px; }',
    '#xenovr-scene-strip::-webkit-scrollbar-thumb {',
    '  background:rgba(255,255,255,0.22);border-radius:2px;',
    '}',
    /* Dwell ring pulse while filling */
    '#xenovr-dwell-ring[opacity="1"] {',
    '  filter: drop-shadow(0 0 4px #e62e5a);',
    '}',
  ].join('\n');
  document.head.appendChild(style);

})();
