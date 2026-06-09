(function() {
  'use strict';
  var E = window.XenoEditor;
  var S = E.state;
  var D = E.dom;

  // ─── SVG Icons ──────────────────────────────────────────
  var SVG = {
    'arrow-right': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>',
    'info': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
    'link': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07L9.5 3.5"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07L14.5 20.5"></path></svg>',
    'image': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>',
    'video': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 7L16 12 23 17 23 7z"></path><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>',
    'music': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>',
    'code': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>',
    'grid': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="12" x2="21" y2="12"></line><line x1="12" y1="3" x2="12" y2="21"></line></svg>',
    'x': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
    'folder': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>',
    'project': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>',
    'edit': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>',
    'eye': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>',
    'download': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>',
    'trash': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
    'check': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    'sun': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
    'moon': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
    'plus': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    'chevron-left': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
    'chevron-right': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
    'camera': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>',
    'copy': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    'cursor': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="M13 13l6 6"/></svg>',
    'map': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>',
    'move': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/></svg>',
    'photo': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
    'rotate-cw': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>',
    'settings': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    'star': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    'volume': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>',
    'narrator': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8a4 4 0 0 1 4 4v4a4 4 0 0 1-4 4 4 4 0 0 1-4-4v-4a4 4 0 0 1 4-4z"/><path d="M8 12H6a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2"/><path d="M16 12h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2"/></svg>',
    'soundwave': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h2M8 9v6M12 6v12M16 9v6M20 12h2"/></svg>',
    'type': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>'
  };

  window.xIcon = function(name, size) {
    size = size || 24;
    var svg = SVG[name] || '';
    return svg.replace(/width="24"/g, 'width="' + size + '"').replace(/height="24"/g, 'height="' + size + '"');
  };

  // ─── Tool Management ────────────────────────────────────
  E.setupTools = function() {
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
      S.currentSceneCtx.data.hotspots.push(newHs);
      E.createVisualHotspot(newHs);
      E.pushUndo();

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