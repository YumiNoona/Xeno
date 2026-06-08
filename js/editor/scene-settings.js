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
      document.querySelectorAll('.type-fields').forEach(function(f) { f.style.display = 'none'; });
      D.fieldsSceneSettings.style.display = 'block';

      if (window.data.floorplan) {
        D.propFloorplanEnabled.checked = window.data.floorplan.enabled !== false;
        D.propFloorplanUrl.value = window.data.floorplan.imageUrl || '';
      }

      D.propsPanel.classList.add('visible');
      setTimeout(function() { if (S.viewer) S.viewer.updateSize(); }, 250);
    };

    // ─── Capture as thumbnail ─────────────────────────────
    var btnCapture = document.getElementById('btn-capture-thumb');
    if (btnCapture) {
      btnCapture.addEventListener('click', function() {
        if (!S.currentSceneCtx || !S.viewer) return;
        var panoEl = D.panoEl;
        if (!panoEl) return;
        // Capture the WebGL canvas as a data URL
        var canvas = panoEl.querySelector('canvas');
        if (!canvas) { alert('No canvas found'); return; }
        try {
          var dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          // Convert to Blob and upload through media system to avoid base64 storage bloat
          var parts = dataUrl.split(',');
          var mime = parts[0].match(/:(.*?);/)[1];
          var binary = atob(parts[1]);
          var bytes = new Uint8Array(binary.length);
          for (var j = 0; j < binary.length; j++) bytes[j] = binary.charCodeAt(j);
          var blob = new Blob([bytes], { type: mime });
          var fakeFile = new File([blob], 'thumb_' + Date.now() + '.jpg', { type: mime });
          window.XenoSupabase.uploadAndRecordMedia(fakeFile, null).then(function(mediaId) {
            S.currentSceneCtx.data.thumbnailUrl = mediaId;
            E.renderSceneGrid();
            E.debouncedSave();
            alert('Thumbnail captured!');
          }).catch(function(err) {
            alert('Failed to save thumbnail: ' + err.message);
          });
        } catch(e) {
          alert('Capture failed: ' + e.message);
        }
      });
    }

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

    document.getElementById('btn-save-view').addEventListener('click', function() {
      if (!S.currentSceneCtx) return;
      S.currentSceneCtx.data.initialViewParameters = {
        yaw: S.currentSceneCtx.view.yaw(),
        pitch: S.currentSceneCtx.view.pitch(),
        fov: S.currentSceneCtx.view.fov()
      };
      E.debouncedSave();
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
