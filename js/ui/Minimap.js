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

    // Clear existing
    minimapElement.innerHTML = '';

    var isEditor = window.location.pathname.indexOf('editor.html') !== -1;
    if (isEditor) minimapElement.classList.add('edit-mode');

    var enabled = data.settings.showMinimap === true && data.floorplan.enabled === true;
    var positionClass = 'pos-' + (data.settings.minimapPosition || 'bottom-left');
    
    minimapElement.classList.remove('pos-bottom-left', 'pos-bottom-right', 'pos-top-left', 'pos-top-right');
    minimapElement.classList.add(positionClass);

    if (enabled && minimapToggle) {
      minimapToggle.classList.add('active');
      minimapElement.style.display = 'block';
    }

    if (!data.floorplan.imageUrl) {
      if (isEditor) {
        var msg = document.createElement('div');
        msg.style.cssText = 'color:var(--text-muted); font-size:var(--type-xs); font-family:inherit; text-align:center; padding:40px 10px;';
        msg.innerHTML = 'No floorplan set.<br>Set it in Scene Settings.';
        minimapElement.appendChild(msg);
      }
      return;
    }

    // Header
    var header = document.createElement('div');
    header.style.cssText = 'padding:8px 12px; background:var(--bg-panel); border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;';
    header.innerHTML = '<span style="font-size:10px; font-weight:600; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.04em;">Mini-map</span>' +
                       '<div style="display:flex; gap:8px; align-items:center;">' +
                         '<span class="minimap-count" style="font-size:10px; color:var(--accent);">0 hotspots</span>' +
                         '<button class="minimap-collapse" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:12px; padding:0 4px;">^</button>' +
                       '</div>';
    minimapElement.appendChild(header);

    var mapBody = document.createElement('div');
    mapBody.className = 'minimap-body';
    mapBody.style.cssText = 'position:relative; width:100%; height:calc(100% - 30px);';
    minimapElement.appendChild(mapBody);

    // Build the DOM map
    var mapImage = document.createElement('img');
    mapImage.src = data.floorplan.imageUrl || '';
    mapImage.style.width = '100%';
    mapImage.style.height = '100%';
    mapImage.style.objectFit = 'contain';
    mapImage.style.position = 'absolute';
    mapImage.style.top = '0';
    mapImage.style.left = '0';
    mapBody.appendChild(mapImage);

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
        dot.style.left = sData.minimapPosition.x + '%';
        dot.style.top = sData.minimapPosition.y + '%';
        dot.title = sData.name.replace(/\.[^/.]+$/, "");

        // Radar element
        var radar = document.createElement('div');
        radar.classList.add('minimap-radar');
        dot.appendChild(radar);

        // View direction arrow
        var viewArrow = document.createElement('div');
        viewArrow.className = 'minimap-view-arrow';
        viewArrow.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12"><polygon points="6,0 9,12 6,9 3,12" fill="#e11d48"/></svg>';
        viewArrow.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);display:none;width:24px;height:24px;z-index:2;pointer-events:none;';
        dot.appendChild(viewArrow);
        dot.__viewArrow = viewArrow;

        dot.addEventListener('click', function(e) {
          if (dot.classList.contains('dragging')) return;
          if (window.switchSceneById) {
            window.switchSceneById(sData.id);
          } else if (window.xenoSwitchScene) {
            window.xenoSwitchScene(sceneCtx);
          } else {
            sceneCtx.scene.switchTo();
            if (window.updateMinimap) window.updateMinimap(sceneCtx);
          }
        });

        // Drag to reposition in editor
        if (isEditor) {
          dot.addEventListener('mousedown', function(e) {
            e.stopPropagation();
            e.preventDefault();
            
            var rect = mapBody.getBoundingClientRect();
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

        mapBody.appendChild(dot);
        dotElements[sData.id] = dot;
      }
    });

    // Unplaced scenes list (Editor only)
    if (isEditor) {
      var unplaced = scenes.filter(function(s) { 
        return !s.data.hidden && (!s.data.minimapPosition || s.data.minimapPosition.x == null); 
      });
      if (unplaced.length > 0) {
        var unplacedBar = document.createElement('div');
        unplacedBar.style.cssText = 'position:absolute; bottom:0; left:0; right:0; background:rgba(0,0,0,0.8); padding:4px 8px; font-size:var(--type-2xs); font-family:inherit; color:var(--text-primary); display:flex; gap:6px; overflow-x:auto; white-space:nowrap; z-index:10; border-top:1px solid var(--border);';
        unplacedBar.innerHTML = '<span style="opacity:0.6;">Unplaced:</span>';
        unplaced.forEach(function(sCtx) {
          var btn = document.createElement('button');
          btn.textContent = sCtx.data.name.replace(/\.[^/.]+$/, "").substring(0, 10);
          btn.style.cssText = 'background:var(--accent); border:none; border-radius:3px; color:#fff; padding:2px 6px; cursor:pointer; font-size:var(--type-2xs); font-family:inherit;';
          btn.addEventListener('click', function() {
            sCtx.data.minimapPosition = { x: 50, y: 50 };
            window.initMinimap();
            if (window.debouncedSave) window.debouncedSave();
          });
          unplacedBar.appendChild(btn);
        });
        mapBody.appendChild(unplacedBar);
      }
    }

    // Collapse toggle
    header.querySelector('.minimap-collapse').addEventListener('click', function() {
      var isCollapsed = mapBody.style.display === 'none';
      mapBody.style.display = isCollapsed ? 'block' : 'none';
      this.textContent = isCollapsed ? '^' : 'v';
      minimapElement.style.height = isCollapsed ? '150px' : '30px';
    });

    function updateHotspotCount(currentSceneCtx) {
      var count = (currentSceneCtx && currentSceneCtx.data.hotspots) 
        ? currentSceneCtx.data.hotspots.length : 0;
      var label = header.querySelector('.minimap-count');
      if (label) label.textContent = count + ' hotspot' + (count !== 1 ? 's' : '');
    }

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
        var activeDot = mapBody.querySelector('.minimap-dot.active');
        if (activeDot) {
          var radar = activeDot.querySelector('.minimap-radar');
          if (radar) {
            var deg = (yaw * 180 / Math.PI);
            radar.style.transform = 'translate(-50%, -50%) rotate(' + deg + 'deg)';
            
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
        if (dotElements[id].__viewArrow) dotElements[id].__viewArrow.style.display = 'none';
      });
      
      // Add active class to current
      var currentId = currentSceneCtx.data.id;
      if (dotElements[currentId]) {
        dotElements[currentId].classList.add('active');
        if (dotElements[currentId].__viewArrow) dotElements[currentId].__viewArrow.style.display = '';
      }

      updateHotspotCount(currentSceneCtx);
    };

    // View direction arrow rotation loop
    setInterval(function() {
      if (!viewer || !scenes) return;
      var active = scenes.find(function(s) { return s.scene.isActive && s.scene.isActive(); });
      if (!active) return;
      var dot = dotElements[active.data.id];
      var arrow = dot && dot.__viewArrow;
      if (!arrow || arrow.style.display === 'none') return;
      var yawDeg = active.view.yaw() * 180 / Math.PI;
      arrow.style.transform = 'translate(-50%, -50%) rotate(' + yawDeg + 'deg)';
    }, 100);

    // Initial count
    var firstVisible = scenes.find(function(s) { return !s.data.hidden; }) || scenes[0];
    updateHotspotCount(firstVisible);
  };

})();