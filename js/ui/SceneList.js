/*
 * Xeno — Scene List UI
 * Handles rendering the list of scenes in either sidebar or bottom-strip mode.
 */
'use strict';

(function() {

  window.initSceneList = function() {
    var data = window.data;
    var scenes = window.xenoScenes;
    
    var sceneListContainer = document.querySelector('#sceneList');
    var scenesWrapper = document.querySelector('#sceneList .scenes');
    
    if (!sceneListContainer || !scenesWrapper || !data || !scenes) return;

    var style = data.settings.sceneListStyle || 'sidebar'; // 'sidebar' or 'bottom-strip'
    
    if (style === 'bottom-strip') {
      sceneListContainer.classList.add('bottom-strip');
    } else {
      sceneListContainer.classList.remove('bottom-strip');
    }

    // Clear existing
    scenesWrapper.innerHTML = '';
    
    if (!scenes || scenes.length === 0) {
      scenesWrapper.innerHTML = '<div style="padding: 20px; color: var(--text-secondary); text-align: center;">No scenes added yet.</div>';
      return;
    }

    var sceneElements = {};

    scenes.forEach(function(sceneCtx) {
      var sData = sceneCtx.data;
      if (sData.hidden) return;
      
      var el = document.createElement('div');
      el.classList.add('scene');
      el.setAttribute('data-id', sData.id);
      
      var placeholderSvg = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%239CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Crect x="3" y="3" width="18" height="18" rx="2" ry="2"/%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"/%3E%3Cpolyline points="21 15 16 10 5 21"/%3E%3C/svg%3E';
      var thumbUrl = sData.thumbnailUrl || (sData.type === 'image' ? sData.mediaUrl : placeholderSvg);
      
      var img = document.createElement('img');
      img.classList.add('scene-thumb');
      if (thumbUrl.indexOf('media_') === 0) {
        img.src = placeholderSvg;
        if (window.XenoViewerMedia) {
          window.XenoViewerMedia.resolveMediaIdOrUrl(thumbUrl).then(function(res) {
            if (res) img.src = res;
          });
        }
      } else {
        img.src = thumbUrl;
        img.onerror = function() { this.src = placeholderSvg; };
      }
      
      var name = document.createElement('div');
      name.classList.add('scene-name');
      var cleanName = (sData.name || 'Untitled Scene').replace(/\.[^/.]+$/, "");
      name.textContent = cleanName;
      
      el.appendChild(img);
      el.appendChild(name);
      
      el.addEventListener('click', function() {
        if (window.xenoSwitchScene) {
          window.xenoSwitchScene(sceneCtx);
        }
        
        // On mobile, hide scene list after selecting a scene
        if (document.body.classList.contains('mobile')) {
          sceneListContainer.classList.remove('enabled');
          var toggle = document.querySelector('#sceneListToggle');
          if (toggle) toggle.classList.remove('enabled');
        }
      });
      
      scenesWrapper.appendChild(el);
      sceneElements[sData.id] = el;
    });

    // Global updater function called by switchScene
    window.updateSceneList = function(currentSceneCtx) {
      var currentId = currentSceneCtx.data.id;
      
      Object.keys(sceneElements).forEach(function(id) {
        if (id === currentId) {
          sceneElements[id].classList.add('current');
          // Optional: auto-scroll to current scene
          sceneElements[id].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        } else {
          sceneElements[id].classList.remove('current');
        }
      });
    };
  };

})();
