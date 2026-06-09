(function() {
  'use strict';
  var E = window.XenoEditor;
  var S = E.state;
  var D = E.dom;

  // ─── Tool Management ────────────────────────────────────
  E.setupTools = function() {
    if (E._toolsSetupDone) return; E._toolsSetupDone = true;
    D.pillTools.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var tool = btn.getAttribute('data-tool');
        if (tool) handleToolClick(tool, btn);
      });
    });

    // Pano click → place hotspot
    D.panoEl.addEventListener('click', function(e) {
      if (!S.editorState.placeMode || !S.currentSceneCtx) return;
      if (S.isRebuilding && S.isRebuilding()) return;
      var rect = D.panoEl.getBoundingClientRect();
      var coords = S.currentSceneCtx.view.screenToCoordinates({
        x: e.clientX - rect.left, y: e.clientY - rect.top
      });

      var newHs = {
        id: 'hs_' + Date.now(),
        type: S.editorState.activeTool,
        style: S.editorState.activeTool,
        yaw: coords.yaw, pitch: coords.pitch,
        title: 'New ' + S.editorState.activeTool, text: '',
        animation: 'none', iconStyle: {navigate:'arrow',info:'info',image:'photo',video:'camera',audio:'volume',url:'link',text:'default',narrator:'narrator',ambient:'soundwave'}[S.editorState.activeTool] || 'default', iconSize: 44,
        target: null, transition: 'opacity', transitionDuration: 800,
        linkUrl: '', linkType: 'external', linkTarget: null, linkLabel: '',
        urlHref: '', urlLabel: 'Open link', urlOpenIn: 'newtab',
        content: { src: '', caption: '', linkUrl: '' },
        bgColor: 'rgba(0,0,0,0.7)', textColor: '#ffffff', fontSize: 14,
        fontFamily: null, bold: false, italic: false, underline: false,
        rotation: 0
      };

      if (!S.currentSceneCtx.data.hotspots) S.currentSceneCtx.data.hotspots = [];
      E.pushUndo();
      S.currentSceneCtx.data.hotspots.push(newHs);
      E.createVisualHotspot(newHs);

      setActiveTool('select');
      S.editorState.placeMode = false;
      D.panoWrapper.classList.remove('crosshair-mode');
      hideModeBadge();
      E.openPropertiesPanel(newHs);
      E.debouncedSave();
    });

    // Drag to reposition hotspots (with click-to-select detection)
    var dragStartX = 0, dragStartY = 0, hasMoved = false;
    var DRAG_THRESHOLD = 5; // pixels before we consider it a drag

    D.panoWrapper.addEventListener('mousedown', function(e) {
      if (S.editorState.placeMode) return;
      var target = e.target;
      while (target && target !== D.panoWrapper) {
        if (target.__marzipanoHotspot) {
          S.isDragging = false; // not yet — wait for movement
          hasMoved = false;
          dragStartX = e.clientX;
          dragStartY = e.clientY;
          S.dragHsElement = target;
          S.dragHsData = target.__hsData;
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        target = target.parentElement;
      }
      // Clicked on empty pano — deselect
      if (S.dragHsElement === null && !S.editorState.placeMode) {
        // Do nothing on background click (don't close panel)
      }
    }, true);

    window.addEventListener('mousemove', function(e) {
      if (!S.dragHsElement || !S.dragHsElement.__marzipanoHotspot) return;
      var dx = e.clientX - dragStartX;
      var dy = e.clientY - dragStartY;
      if (!hasMoved && Math.sqrt(dx*dx + dy*dy) < DRAG_THRESHOLD) return;
      hasMoved = true;
      S.isDragging = true;
      var rect = D.panoEl.getBoundingClientRect();
      var coords = S.currentSceneCtx.view.screenToCoordinates({
        x: e.clientX - rect.left, y: e.clientY - rect.top
      });
      S.dragHsElement.__marzipanoHotspot.setPosition(coords);
      if (S.dragHsData) {
        S.dragHsData.yaw = coords.yaw;
        S.dragHsData.pitch = coords.pitch;
      }
    });

    window.addEventListener('mouseup', function() {
      if (S.dragHsElement) {
        if (!hasMoved) {
          // It was a click — open properties
          var hsData = S.dragHsData;
          if (hsData) {
            S.selectedHotspotElement = S.dragHsElement;
            E.openPropertiesPanel(hsData);
          }
        } else if (S.isDragging) {
          // Write drag position back to source hotspot (not the render clone)
          if (S.dragHsData && S.currentSceneCtx) {
            var allArrays = [S.currentSceneCtx.data.hotspots || [], S.currentSceneCtx.data.linkHotspots || [], S.currentSceneCtx.data.infoHotspots || [], S.currentSceneCtx.data.mediaHotspots || []];
            var sourceHs;
            for (var ai = 0; ai < allArrays.length; ai++) {
              sourceHs = allArrays[ai].find(function(h) { return h.id === S.dragHsData.id; });
              if (sourceHs) break;
            }
            if (sourceHs) { sourceHs.yaw = S.dragHsData.yaw; sourceHs.pitch = S.dragHsData.pitch; }
          }
          E.pushUndo();
          E.debouncedSave();
        }
        S.isDragging = false;
        S.dragHsElement = null;
        S.dragHsData = null;
        hasMoved = false;
      }
    });
  };

  function handleToolClick(tool, btnEl) {
    if (E.HOTSPOT_TOOLS.indexOf(tool) !== -1) {
      setActiveTool(tool);
      S.editorState.placeMode = true;
      D.panoWrapper.classList.add('crosshair-mode');
      showModeBadge('Place: ' + tool);
    } else if (tool === 'select') {
      setActiveTool('select');
      S.editorState.placeMode = false;
      D.panoWrapper.classList.remove('crosshair-mode');
      hideModeBadge();
      E.closePropertiesPanel();
    } else if (tool === 'move') {
      btnEl.classList.toggle('active');
      if (btnEl.classList.contains('active')) {
        showModeBadge('Move Mode: Drag icons');
        D.panoWrapper.classList.add('move-mode');
      } else {
        hideModeBadge();
        D.panoWrapper.classList.remove('move-mode');
      }
    }

  }; // end handleToolClick
  function setActiveTool(tool) {
    S.editorState.activeTool = tool;
    D.pillTools.forEach(function(p) {
      var t = p.getAttribute('data-tool');
      if (t === tool) {
        p.classList.add('active');
      } else if (E.HOTSPOT_TOOLS.indexOf(t) !== -1 || t === 'select') {
        p.classList.remove('active');
      }
    });
  }

  function showModeBadge(text) {
    D.modeBadge.textContent = text;
    D.modeBadge.classList.add('visible');
  }

  function hideModeBadge() {
    D.modeBadge.classList.remove('visible');
  }

  // ─── Utility: apply icon size to DOM element ────────────
  E.applyIconSize = function(element, size) {
    var half = size / 2;
    element.style.width  = size + 'px';
    element.style.height = size + 'px';
    element.style.marginLeft = '-' + half + 'px';
    element.style.marginTop  = '-' + half + 'px';
    var inner = element.querySelector('svg') || element.querySelector('img.link-icon') || element.querySelector('.image');
    if (inner) {
      var iconSize = Math.round(size * 0.55);
      inner.style.width  = iconSize + 'px';
      inner.style.height = iconSize + 'px';
    }
    // Reposition tooltip/tip labels based on actual hotspot size
    var tooltip = element.querySelector('.link-tooltip');
    if (tooltip) {
      var topOffset = Math.round((size - 28) / 2); // vertically center relative to icon
      tooltip.style.top = topOffset + 'px';
      tooltip.style.left = (size + 4) + 'px';
      tooltip.style.marginLeft = '0';
    }
    var tip = element.querySelector('.tip');
    if (tip) {
      tip.style.left = (size + 16) + 'px';
      tip.style.top = Math.round(size * 0.15) + 'px';
    }
    var content = element.querySelector('.content');
    if (content) {
      content.style.left = (size + 16) + 'px';
      content.style.top = Math.round(size * 0.15) + 'px';
    }
    // Also size the icon wrapper to match
    var iconWrapper = element.querySelector('.link-icon-wrapper, .icon_wrapper, .out');
    if (iconWrapper && !iconWrapper.classList.contains('tip') && !iconWrapper.classList.contains('content')) {
      iconWrapper.style.width = size + 'px';
      iconWrapper.style.height = size + 'px';
    }
    var innerIcon = element.querySelector('.in');
    if (innerIcon) {
      innerIcon.style.width = '';
      innerIcon.style.height = '';
    }
  };
})();