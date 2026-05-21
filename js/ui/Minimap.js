/*
 * Xeno — Minimap Module
 * Secondary DOM-based viewer for floorplans with scene indicators.
 */
'use strict';

(function() {

  window.initMinimap = function() {
    var Xeno = window.Xeno;
    var data = window.data;
    var scenes = window.xenoScenes;
    var viewer = window.xenoViewer;

    var minimapElement = document.getElementById('xeno-minimap');
    var minimapToggle = document.getElementById('minimapToggle');
    
    if (!minimapElement || !data || !data.floorplan || !scenes) return;

    // Is this editor? (presence of saveTour suggests so)
    var isEditor = !!window.XenoSupabase;
    if (isEditor) minimapElement.classList.add('edit-mode');

    var enabled = data.settings.showMinimap === true && data.floorplan.enabled === true;
    var positionClass = 'pos-' + (data.settings.minimapPosition || 'bottom-left');
    
    minimapElement.classList.add(positionClass);

    if (enabled && minimapToggle) {
      minimapToggle.classList.add('active');
      minimapElement.style.display = 'block';
    }

    // Clear existing
    minimapElement.innerHTML = '';

    if (!data.floorplan.imageUrl) {
      if (isEditor) {
        var msg = document.createElement('div');
        msg.style.cssText = 'color:var(--text-muted); font-size:10px; text-align:center; padding:40px 10px;';
        msg.innerHTML = 'No floorplan set.<br>Set it in Scene Settings.';
        minimapElement.appendChild(msg);
      }
      return;
    }

    // Build the DOM map
    var mapImage = document.createElement('img');
    mapImage.src = data.floorplan.imageUrl || '';
    mapImage.style.width = '100%';
    mapImage.style.height = '100%';
    mapImage.style.objectFit = 'contain';
    mapImage.style.position = 'absolute';
    mapImage.style.top = '0';
    mapImage.style.left = '0';
    minimapElement.appendChild(mapImage);

    var dotElements = {};

    // Build scene dots
    scenes.forEach(function(sceneCtx) {
      var sData = sceneCtx.data;
      if (sData.hidden) return;
      if (sData.minimapPosition && sData.minimapPosition.x != null && sData.minimapPosition.y != null) {
        var dot = document.createElement('div');
        dot.classList.add('minimap-dot');
        dot.style.position = 'absolute';
        // Use percentages for responsive positioning over the contain-fitted image.
        // Note: If aspect ratios differ, this needs a wrapper to match image aspect precisely.
        // For simplicity, we assume the minimap container matches the floorplan aspect ratio closely.
        dot.style.left = sData.minimapPosition.x + '%';
        dot.style.top = sData.minimapPosition.y + '%';
        dot.title = sData.name;

        // Radar element
        var radar = document.createElement('div');
        radar.classList.add('minimap-radar');
        dot.appendChild(radar);

        dot.addEventListener('click', function(e) {
          if (dot.classList.contains('dragging')) return;
          // Since we are in the same environment and viewer.js is main, 
          // we'll rely on a global `window.xenoSwitchScene(sceneCtx)` being added in viewer.js.
          if (window.switchSceneById) {
            window.switchSceneById(sData.id);
          } else if (window.xenoSwitchScene) {
            window.xenoSwitchScene(sceneCtx);
          } else {
            // Fallback to basic switch
            sceneCtx.scene.switchTo();
            if (window.updateMinimap) window.updateMinimap(sceneCtx);
          }
        });

        // Drag to reposition in editor
        if (isEditor) {
          dot.addEventListener('mousedown', function(e) {
            e.stopPropagation();
            e.preventDefault();
            
            var rect = minimapElement.getBoundingClientRect();
            var onMouseMove = function(moveE) {
              dot.classList.add('dragging');
              var x = ((moveE.clientX - rect.left) / rect.width) * 100;
              var y = ((moveE.clientY - rect.top) / rect.height) * 100;
              
              // Constrain
              x = Math.max(0, Math.min(100, x));
              y = Math.max(0, Math.min(100, y));
              
              dot.style.left = x + '%';
              dot.style.top = y + '%';
              
              sData.minimapPosition = { x: x, y: y };
            };
            
            var onMouseUp = function() {
              document.removeEventListener('mousemove', onMouseMove);
              document.removeEventListener('mouseup', onMouseUp);
              setTimeout(function() { dot.classList.remove('dragging'); }, 50);
              if (window.debouncedSave) window.debouncedSave();
            };
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
          });
        }

        minimapElement.appendChild(dot);
        dotElements[sData.id] = dot;
      }
    });

    // Rotation tracker
    var lastYaw = 0;
    function syncRadar() {
      if (!viewer || !window.updateMinimap) return;
      var view = viewer.view();
      if (!view) {
        requestAnimationFrame(syncRadar);
        return;
      }
      
      var yaw = view.yaw();
      if (yaw !== lastYaw) {
        lastYaw = yaw;
        // Find the active dot's radar
        var activeDot = minimapElement.querySelector('.minimap-dot.active');
        if (activeDot) {
          var radar = activeDot.querySelector('.minimap-radar');
          if (radar) {
            // Marzipano yaw is in radians, 0 is forward. 
            // Minimap radar rotate(0) is usually up.
            var deg = (yaw * 180 / Math.PI);
            radar.style.transform = 'translate(-50%, -50%) rotate(' + deg + 'deg)';
            
            // Adjust radar cone width based on FOV
            var fov = view.fov();
            var fovDeg = (fov * 180 / Math.PI);
            var halfFov = fovDeg / 2;
            radar.style.background = 'conic-gradient(from -' + halfFov + 'deg, rgba(230,46,90,0.4) 0deg, rgba(230,46,90,0.4) ' + fovDeg + 'deg, transparent ' + fovDeg + 'deg)';
          }
        }
      }
      requestAnimationFrame(syncRadar);
    }
    syncRadar();

    // Global updater function called by switchScene
    window.updateMinimap = function(currentSceneCtx) {
      // Remove active class from all
      Object.keys(dotElements).forEach(function(id) {
        dotElements[id].classList.remove('active');
      });
      
      // Add active class to current
      var currentId = currentSceneCtx.data.id;
      if (dotElements[currentId]) {
        dotElements[currentId].classList.add('active');
      }
    };
  };

})();
