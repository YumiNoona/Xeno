(function() {
  'use strict';
  var E = window.XenoEditor;
  var S = E.state;
  var D = E.dom;

  E.setupSceneSettings = function() {
    if (E._sceneSettingsSetupDone) return; E._sceneSettingsSetupDone = true;
    // ─── Save current view as default ──────────────────────
    var btnSaveView = document.getElementById('btn-save-view');
    if (btnSaveView) {
      btnSaveView.addEventListener('click', function() {
        if (!S.currentSceneCtx) return;
        S.currentSceneCtx.data.initialViewParameters = {
          yaw: S.currentSceneCtx.view.yaw(),
          pitch: S.currentSceneCtx.view.pitch(),
          fov: S.currentSceneCtx.view.fov()
        };
        E.debouncedSave();
      });
    }

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
