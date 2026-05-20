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

    var enabled = data.settings.showMinimap === true && data.floorplan.enabled === true;
    var positionClass = 'pos-' + (data.settings.minimapPosition || 'bottom-left');
    
    minimapElement.classList.add(positionClass);

    if (enabled && minimapToggle) {
      minimapToggle.classList.add('active');
      minimapElement.style.display = 'block';
    }

    // Clear existing
    minimapElement.innerHTML = '';

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

        dot.addEventListener('click', function() {
          // Since we are in the same environment and viewer.js is main, 
          // we'll rely on a global `window.xenoSwitchScene(sceneCtx)` being added in viewer.js.
          if (window.xenoSwitchScene) {
            window.xenoSwitchScene(sceneCtx);
          } else {
            // Fallback to basic switch
            sceneCtx.scene.switchTo();
            if (window.updateMinimap) window.updateMinimap(sceneCtx);
          }
        });

        minimapElement.appendChild(dot);
        dotElements[sData.id] = dot;
      }
    });

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
