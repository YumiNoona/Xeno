(function() {
  'use strict';
  var E = window.XenoEditor;
  var S = E.state;
  var D = E.dom;

  E.createVisualHotspot = function(hsData) {
    if (!S.currentSceneCtx) return;
    // Double-destroy guard: only fires on direct createVisualHotspot calls on live data
    // (renderSceneHotspots uses deep-cloned copies without __marzipanoHotspot, so this is normally skipped)
    if (hsData.__marzipanoHotspot) {
      S.currentSceneCtx.scene.hotspotContainer().destroyHotspot(hsData.__marzipanoHotspot);
      hsData.__marzipanoHotspot = null;
    }

    var el = window.HotspotFactory.create(
      S.currentSceneCtx.scene, hsData, hsData.type || 'info',
      function() {},
      function(id) { return S.scenes.find(function(s) { return s.data.id === id; }); }
    );
    if (!el) return;

    el.__hsData = hsData;

    el.addEventListener('click', function(e) {
      if (S.editorState.placeMode) return;
      e.stopPropagation();
      S.selectedHotspotElement = el;
      E.openPropertiesPanel(hsData, { skipUndo: true });
    });

    // Prevent hotspot clicks from initiating pano drag
    el.addEventListener('pointerdown', function(e) { e.stopPropagation(); });
    el.addEventListener('mousedown', function(e) { e.stopPropagation(); });

    if (hsData.iconSize) E.applyIconSize(el, hsData.iconSize);
    return el;
  };

  var _hotspotGen = 0;
  E._resetHotspotGen = function() { _hotspotGen++; };

  E.renderSceneHotspots = function() {
    if (!S.currentSceneCtx) return;
    var sceneCtx = S.currentSceneCtx;
    var container = sceneCtx.scene.hotspotContainer();
    var existing = container.listHotspots();
    for (var i = 0; i < existing.length; i++) {
      container.destroyHotspot(existing[i]);
    }

    var hotspots = (sceneCtx.data.hotspots || []).slice();
    // Legacy hotspot compatibility
    (sceneCtx.data.linkHotspots || []).forEach(function(h) {
      var c = Object.assign({}, h); c.type = c.type || 'navigate'; c.style = c.style || 'link'; hotspots.push(c);
    });
    (sceneCtx.data.infoHotspots || []).forEach(function(h) {
      var c = Object.assign({}, h); c.type = c.type || 'info'; c.style = c.style || 'info'; hotspots.push(c);
    });
    (sceneCtx.data.mediaHotspots || []).forEach(function(h) {
      var c = Object.assign({}, h); c.type = c.type || 'image'; c.style = c.style || 'media'; hotspots.push(c);
    });

    // Deep-clone hotspots to avoid mutating source data with temp _srcId/_customIconId
    var renderHotspots = hotspots.map(function(hs) { return JSON.parse(JSON.stringify(hs)); });
    var isMediaId = window.XenoEditor.isMediaId;
    var resolvePromises = [];
    renderHotspots.forEach(function(hs) {
      var src = hs.content && hs.content.src;
      if (isMediaId(src) && window.XenoSupabase) {
        hs.content._srcId = hs.content.src;
        resolvePromises.push(window.XenoSupabase.resolveMediaId(src).then(function(blobUrl) {
          if (blobUrl) hs.content.src = blobUrl;
        }).catch(function() {}));
      }
      if (isMediaId(hs.customIconUrl) && window.XenoSupabase) {
        (function(capture) {
          hs._customIconId = capture;
          resolvePromises.push(window.XenoSupabase.resolveMediaId(capture).then(function(blobUrl) {
            if (blobUrl) hs.customIconUrl = blobUrl;
          }).catch(function() {}));
        })(hs.customIconUrl);
      }
    });

    var thisGen = ++_hotspotGen;
    Promise.all(resolvePromises).then(function() {
      if (thisGen !== _hotspotGen) return; // Stale generation — scene switched
      if (S.currentSceneCtx !== sceneCtx) return;
      renderHotspots.forEach(function(hsData) { E.createVisualHotspot(hsData); });

      if (S.selectedHotspotData) {
        var list = container.listHotspots();
        list.forEach(function(h) {
          if (h.domElement().__hsData && h.domElement().__hsData.id === S.selectedHotspotData.id) {
            S.selectedHotspotElement = h.domElement();
          }
        });
      }
    });
  };

  // ─── Quad Points ────────────────────────────────────────
  E.renderQuadPoints = function(points) {
    D.quadPointsList.innerHTML = '';
    if (!points || points.length === 0) {
      D.btnClearQuadPoints.style.display = 'none';
      return;
    }
    D.btnClearQuadPoints.style.display = 'inline-flex';
    points.forEach(function(p, index) {
      var el = document.createElement('div');
      el.className = 'quad-point-item';
      el.innerHTML = '<span>Point ' + (index + 1) + ': Yaw ' + p.yaw.toFixed(2) + ', Pitch ' + p.pitch.toFixed(2) + '</span>' +
        '<button class="btn-icon btn-remove-quad-point" data-index="' + index + '">' + window.xIcon('x', 12) + '</button>';
      D.quadPointsList.appendChild(el);
    });
    D.quadPointsList.querySelectorAll('.btn-remove-quad-point').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var i = parseInt(this.getAttribute('data-index'));
        if (S.selectedHotspotData && S.selectedHotspotData.quadPoints) {
          S.selectedHotspotData.quadPoints.splice(i, 1);
          E.renderQuadPoints(S.selectedHotspotData.quadPoints);
          E.renderSceneHotspots();
          E.debouncedSave();
        }
      });
    });
  };
})();
