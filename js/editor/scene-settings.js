(function() {
  'use strict';
  var E = window.XenoEditor;
  var S = E.state;
  var D = E.dom;

  E.setupSceneSettings = function() {
    // ─── Open / Close ────────────────────────────────────
    E.openSceneSettingsPanel = function() {
      S.selectedHotspotData = null;
      D.panelTitle.textContent = 'Scene Settings';
      D.panelActionsHotspot.style.display = 'none';
      D.panelPosition.style.display = 'none';
      document.getElementById('panel-actions-hotspot').style.display = 'none';
      document.getElementById('panel-position').style.display = 'none';
      document.querySelectorAll('.type-fields').forEach(function(f) { f.style.display = 'none'; });
      D.fieldsSceneSettings.style.display = 'block';

      if (S.currentSceneCtx) {
        D.propSceneName.value = S.currentSceneCtx.data.name || '';
        var savedFov = S.currentSceneCtx.data.defaultFov ||
          (S.currentSceneCtx.data.initialViewParameters && S.currentSceneCtx.data.initialViewParameters.fov) ||
          (Math.PI / 2);
        var savedFovDeg = Math.round(savedFov * 180 / Math.PI);
        D.propSceneFov.value = savedFovDeg;
        D.sceneFovLabel.textContent = savedFovDeg + '\u00B0';
      }

      if (window.data.floorplan) {
        D.propFloorplanEnabled.checked = window.data.floorplan.enabled !== false;
        D.propFloorplanUrl.value = window.data.floorplan.imageUrl || '';
      }

      D.propsPanel.classList.add('visible');
      D.propsReopenBtn.style.display = 'none';
      setTimeout(function() { if (S.viewer) S.viewer.updateSize(); }, 250);
    };

    // ─── Scene Name ──────────────────────────────────────
    D.propSceneName.addEventListener('change', function() {
      if (S.currentSceneCtx) {
        S.currentSceneCtx.data.name = this.value;
        E.renderSceneGrid();
        E.debouncedSave();
      }
    });

    // ─── Floorplan ───────────────────────────────────────
    D.propFloorplanEnabled.addEventListener('change', function() {
      if (!window.data.floorplan) window.data.floorplan = {};
      window.data.floorplan.enabled = this.checked;
      if (!window.data.settings) window.data.settings = {};
      window.data.settings.showMinimap = this.checked;

      var minimapBtn = Array.prototype.find.call(D.pillTools, function(btn) {
        return btn.getAttribute('data-tool') === 'minimap';
      });
      if (minimapBtn) {
        if (this.checked) minimapBtn.classList.add('active');
        else minimapBtn.classList.remove('active');
      }
      var minimapEl = document.getElementById('xeno-minimap');
      if (this.checked) {
        if (window.initMinimap) window.initMinimap();
        if (minimapEl) minimapEl.style.display = 'block';
      } else {
        if (minimapEl) minimapEl.style.display = 'none';
      }
      E.debouncedSave();
    });

    D.propFloorplanUrl.addEventListener('change', function() {
      if (!window.data.floorplan) window.data.floorplan = {};
      window.data.floorplan.imageUrl = this.value;
      if (window.initMinimap) window.initMinimap();
      E.debouncedSave();
    });

    // ─── FOV ─────────────────────────────────────────────
    D.propSceneFov.addEventListener('input', function() {
      D.sceneFovLabel.textContent = this.value + '\u00B0';
    });

    D.btnApplyFov.addEventListener('click', function() {
      if (!S.currentSceneCtx) return;
      var fovRad = parseInt(D.propSceneFov.value) * Math.PI / 180;
      S.currentSceneCtx.view.setParameters({ fov: fovRad });
      S.currentSceneCtx.data.defaultFov = fovRad;
      if (!S.currentSceneCtx.data.initialViewParameters) S.currentSceneCtx.data.initialViewParameters = { yaw: 0, pitch: 0 };
      S.currentSceneCtx.data.initialViewParameters.fov = fovRad;
      E.debouncedSave();
    });

    // ─── Initial View ────────────────────────────────────
    D.btnReadView.addEventListener('click', function() {
      if (!S.currentSceneCtx) return;
      var v = S.currentSceneCtx.view;
      D.propViewYaw.value = (v.yaw() * 180 / Math.PI).toFixed(0);
      D.propViewPitch.value = (v.pitch() * 180 / Math.PI).toFixed(0);
      D.propViewFov.value = (v.fov() * 180 / Math.PI).toFixed(0);
      D.propSceneFov.value = D.propViewFov.value;
      D.sceneFovLabel.textContent = D.propViewFov.value + '\u00B0';
    });

    D.btnApplyView.addEventListener('click', function() {
      if (!S.currentSceneCtx) return;
      var params = {
        yaw: (parseFloat(D.propViewYaw.value) || 0) * Math.PI / 180,
        pitch: (parseFloat(D.propViewPitch.value) || 0) * Math.PI / 180,
        fov: (parseFloat(D.propViewFov.value) || 90) * Math.PI / 180
      };
      S.currentSceneCtx.view.setParameters(params);
      S.currentSceneCtx.data.initialViewParameters = params;
      S.currentSceneCtx.data.defaultFov = params.fov;
      E.debouncedSave();
      var orig = this.innerHTML;
      this.textContent = '\u2713 Saved';
      var self = this;
      setTimeout(function() { self.innerHTML = orig; }, 1500);
    });

    document.getElementById('btn-save-view').addEventListener('click', function() {
      if (!S.currentSceneCtx) return;
      S.currentSceneCtx.data.initialViewParameters = {
        yaw: S.currentSceneCtx.view.yaw(),
        pitch: S.currentSceneCtx.view.pitch(),
        fov: S.currentSceneCtx.view.fov()
      };
      E.debouncedSave();
      alert('Default view saved for "' + S.currentSceneCtx.data.name + '"');
    });

    // ─── Bottom bar camera readout ───────────────────────
    E.startViewReadLoop = function() {
      if (S.viewReadLoop) return;
      function tick() {
        if (!S.currentSceneCtx) { S.viewReadLoop = null; return; }
        var view = S.currentSceneCtx.view;
        var params = view.parameters();
        var y = (params.yaw * 180 / Math.PI).toFixed(0);
        var p = (params.pitch * 180 / Math.PI).toFixed(0);
        var f = (params.fov * 180 / Math.PI).toFixed(0);

        if (document.activeElement !== D.bottomViewYaw) D.bottomViewYaw.value = y;
        if (document.activeElement !== D.bottomViewPitch) D.bottomViewPitch.value = p;
        if (document.activeElement !== D.bottomViewFov) D.bottomViewFov.value = f;

        if (D.fieldsSceneSettings.style.display !== 'none') {
          if (document.activeElement !== D.propViewYaw) D.propViewYaw.value = y;
          if (document.activeElement !== D.propViewPitch) D.propViewPitch.value = p;
          if (document.activeElement !== D.propViewFov) D.propViewFov.value = f;
        }
        S.viewReadLoop = requestAnimationFrame(tick);
      }
      S.viewReadLoop = requestAnimationFrame(tick);
    };

    function updateCameraFromBottom() {
      if (!S.currentSceneCtx) return;
      S.currentSceneCtx.view.setParameters({
        yaw: (parseFloat(D.bottomViewYaw.value) || 0) * Math.PI / 180,
        pitch: (parseFloat(D.bottomViewPitch.value) || 0) * Math.PI / 180,
        fov: (parseFloat(D.bottomViewFov.value) || 90) * Math.PI / 180
      });
    }

    [D.bottomViewYaw, D.bottomViewPitch, D.bottomViewFov].forEach(function(el) {
      el.addEventListener('change', updateCameraFromBottom);
      el.addEventListener('input', updateCameraFromBottom);
    });
  };
})();
