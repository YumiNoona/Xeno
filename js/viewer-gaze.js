window.XenoViewerGaze = (function() {
  'use strict';

  function init(scenes) {
    var _gazeHotspot = null;
    var _gazeStart = 0;
    var GAZE_THRESHOLD = window.matchMedia('(max-width:500px)').matches ? 8 : 6;
    var GAZE_TIME = 2000;

    setInterval(function() {
      if (!scenes.length) return;
      var current = scenes.find(function(s) { return s.scene.isActive && s.scene.isActive(); });
      if (!current) return;
      if (current.__narratorTimer) return;
      var view = current.scene.viewer().view();
      var params = view.parameters();
      var gazeYaw = params.yaw;
      var gazePitch = params.pitch;

      var closest = null;
      var closestDist = Infinity;
      var container = current.scene.hotspotContainer();
      if (!container) return;
      var hotspots = container.listHotspots();

      hotspots.forEach(function(hs) {
        var dom = hs.domElement();
        if (!dom || !dom.__hsData) return;
        var hd = dom.__hsData;
        var hy = hd.yaw;
        var hp = hd.pitch;
        if (hy == null || hp == null) return;
        var dy = Math.abs(gazeYaw - hy);
        if (dy > Math.PI) dy = 2 * Math.PI - dy;
        var dp = Math.abs(gazePitch - hp);
        var dist = Math.sqrt(dy * dy + dp * dp) * 180 / Math.PI;

        if (hd.type === 'ambient' && hd.ambientAudio && hd.ambientAutoplay !== false) {
          if (!hd.__ambientAudio) {
            hd.__ambientAudio = new Audio(hd.ambientAudio);
            hd.__ambientAudio.loop = hd.ambientLoop !== false;
            hd.__ambientAudio.volume = 0;
            hd.__ambientAudio.play().catch(function() {});
          }
          var radius = hd.ambientRadius || 30;
          var maxVol = (hd.ambientVolume || 70) / 100;
          var vol = dist < radius ? maxVol * (1 - dist / radius) : 0;
          hd.__ambientAudio.volume = Math.max(0, vol);
          return;
        }

        if (hd.type === 'navigate' || hd.type === 'info') {
          if (dist < GAZE_THRESHOLD && dist < closestDist) {
            closestDist = dist;
            closest = dom;
          }
        }
      });

      if (closest === _gazeHotspot) {
        if (Date.now() - _gazeStart >= GAZE_TIME && _gazeHotspot) {
          _gazeHotspot.click();
          _gazeStart = 0;
          _gazeHotspot = null;
        }
      } else {
        _gazeHotspot = closest;
        _gazeStart = closest ? Date.now() : 0;
      }
    }, 200);
  }

  return { init: init };
})();
