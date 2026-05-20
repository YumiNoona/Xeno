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
      
      var thumbUrl = sData.thumbnailUrl || (sData.type === 'image' ? sData.mediaUrl : 'img/photo.png');
      
      var img = document.createElement('img');
      img.classList.add('scene-thumb');
      img.src = thumbUrl;
      
      var name = document.createElement('div');
      name.classList.add('scene-name');
      name.textContent = sData.name || 'Untitled Scene';
      
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
