(function() {
  'use strict';
  var E = window.XenoEditor;
  var S = E.state;
  var D = E.dom;

  E.createVisualHotspot = function(hsData) {
    if (!S.currentSceneCtx) return;
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
      E.openPropertiesPanel(hsData);
    });

    if (hsData.iconSize) E.applyIconSize(el, hsData.iconSize);
    return el;
  };

  E.renderSceneHotspots = function() {
    if (!S.currentSceneCtx) return;
    var container = S.currentSceneCtx.scene.hotspotContainer();
    var existing = container.listHotspots();
    for (var i = 0; i < existing.length; i++) {
      container.destroyHotspot(existing[i]);
    }

    var hotspots = (S.currentSceneCtx.data.hotspots || []).slice();
    // Legacy hotspot compatibility
    (S.currentSceneCtx.data.linkHotspots || []).forEach(function(h) {
      var c = Object.assign({}, h); c.type = c.type || 'navigate'; c.style = c.style || 'link'; hotspots.push(c);
    });
    (S.currentSceneCtx.data.infoHotspots || []).forEach(function(h) {
      var c = Object.assign({}, h); c.type = c.type || 'info'; c.style = c.style || 'info'; hotspots.push(c);
    });
    (S.currentSceneCtx.data.mediaHotspots || []).forEach(function(h) {
      var c = Object.assign({}, h); c.type = c.type || 'image'; c.style = c.style || 'media'; hotspots.push(c);
    });

    hotspots.forEach(function(hsData) { E.createVisualHotspot(hsData); });

    if (S.selectedHotspotData) {
      var list = container.listHotspots();
      list.forEach(function(h) {
        if (h.domElement().__hsData === S.selectedHotspotData) {
          S.selectedHotspotElement = h.domElement();
        }
      });
    }
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
