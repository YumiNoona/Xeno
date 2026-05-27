/*
 * Xeno — Hotspot Factory (Core)
 * Shared helpers and create() entry point.
 * Builders are registered on window.HotspotFactory.builders by Builders-Nav.js and Builders-Content.js.
 */
'use strict';

(function() {

  var isEditor = window.location.pathname.indexOf('editor.html') !== -1;

  function getIconSvg(style) {
    var icons = {
      dot:        '<circle cx="12" cy="12" r="5" fill="currentColor"/>',
      arrow:      '<path d="M12 5l7 7-7 7M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>',
      eye:        '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" fill="none"/>',
      pin:        '<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>',
      star:       '<polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" stroke="currentColor" stroke-width="1.5" fill="none"/>',
      play:       '<polygon points="10,8 16,12 10,16" fill="currentColor"/>',
      question:   '<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/><line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
      info:       '<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" fill="none"/><line x1="12" y1="8" x2="12" y2="8.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="11" x2="12" y2="16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
      home:       '<path d="M3 9.5L12 3l9 6.5V21H15v-5h-6v5H3z" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linejoin="round"/>',
      camera:     '<rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" stroke-width="1.8" fill="none"/><circle cx="12" cy="14" r="3.5" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M8 7V5.5A1.5 1.5 0 019.5 4h5A1.5 1.5 0 0116 5.5V7" stroke="currentColor" stroke-width="1.8" fill="none"/>',
      map:        '<polygon points="1,6 1,22 8,18 16,22 23,18 23,2 16,6 8,2" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linejoin="round"/><line x1="8" y1="2" x2="8" y2="18" stroke="currentColor" stroke-width="1.8"/><line x1="16" y1="6" x2="16" y2="22" stroke="currentColor" stroke-width="1.8"/>',
      compass:    '<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.8" fill="none"/><polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88" fill="currentColor"/>',
      stairs:     '<path d="M4 20h4v-4h4v-4h4v-4h4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
      door:       '<rect x="5" y="2" width="14" height="20" rx="1" stroke="currentColor" stroke-width="1.8" fill="none"/><circle cx="16" cy="12" r="1" fill="currentColor"/>',
      exit:       '<path d="M14 8V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2h7a2 2 0 002-2v-2" stroke="currentColor" stroke-width="1.8" fill="none"/><line x1="7" y1="12" x2="21" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><polyline points="18,9 21,12 18,15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
      warning:    '<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" stroke-width="1.8" fill="none"/><line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
      tag:        '<path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" stroke="currentColor" stroke-width="1.8" fill="none"/><line x1="7" y1="7" x2="7.01" y2="7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
      expand:     '<polyline points="15,3 21,3 21,9" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><polyline points="9,21 3,21 3,15" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><line x1="21" y1="3" x2="14" y2="10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="3" y1="21" x2="10" y2="14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
      '360':      '<path d="M12 2a10 10 0 100 20A10 10 0 0012 2z" stroke="currentColor" stroke-width="1.5" fill="none"/><ellipse cx="12" cy="12" rx="10" ry="4" stroke="currentColor" stroke-width="1.5" fill="none"/><line x1="12" y1="2" x2="12" y2="22" stroke="currentColor" stroke-width="1.5"/>',
      default:    '<line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>'
    };
    return icons[style] || icons.default;
  }

  function applyRingStyle(element, hotspot) {
    if (hotspot.ringEnabled === false) return;
    var ringColor = hotspot.ringColor || 'rgba(255,255,255,0.7)';
    var ringSize  = hotspot.ringSize || 2;
    var ringCount = hotspot.ringCount || 1;
    var ringGap   = hotspot.ringGap || 6;

    var old = element.querySelectorAll('.xeno-extra-ring');
    for (var i = 0; i < old.length; i++) old[i].parentNode.removeChild(old[i]);

    if (ringCount <= 1) return;

    for (var r = 2; r <= ringCount; r++) {
      var extra = document.createElement('div');
      extra.className = 'xeno-extra-ring';
      var offset = (r - 1) * (ringSize + ringGap);
      extra.style.cssText = [
        'position:absolute',
        'border-radius:50%',
        'pointer-events:none',
        'top:' + (-offset) + 'px',
        'left:' + (-offset) + 'px',
        'right:' + (-offset) + 'px',
        'bottom:' + (-offset) + 'px',
        'border:' + ringSize + 'px solid ' + ringColor,
        'box-sizing:border-box',
        'opacity:' + (1 - (r - 1) * 0.25)
      ].join(';');
      element.style.overflow = 'visible';
      element.appendChild(extra);
    }
  }

  function applyPrimaryRingStyle(ringTarget, hotspot) {
    if (!ringTarget) return;
    var ringColor = hotspot.ringColor || 'rgba(255,255,255,0.7)';
    var ringSize  = hotspot.ringSize || 2;
    var ringGap   = hotspot.ringGap || 6;
    ringTarget.style.borderWidth = ringSize + 'px';
    ringTarget.style.borderColor = ringColor;
    ringTarget.style.padding     = ringGap + 'px';
  }

  function stopTouchAndScrollEventPropagation(element) {
    var eventList = [
      'touchstart', 'touchmove', 'touchend', 'touchcancel',
      'pointerdown', 'pointermove', 'pointerup', 'pointercancel',
      'wheel'
    ];
    for (var i = 0; i < eventList.length; i++) {
      element.addEventListener(eventList[i], function(event) {
        event.stopPropagation();
      });
    }
  }

  window.HotspotFactory = {
    _: {
      isEditor: isEditor,
      getIconSvg: getIconSvg,
      applyRingStyle: applyRingStyle,
      applyPrimaryRingStyle: applyPrimaryRingStyle,
      stopTouchAndScrollEventPropagation: stopTouchAndScrollEventPropagation
    },
    builders: {},
    create: function(scene, hotspotData, baseType, switchSceneFn, findSceneByIdFn) {
      var style = hotspotData.style || baseType;
      var builder = window.HotspotFactory.builders[style] || window.HotspotFactory.builders[baseType] || window.HotspotFactory.builders['info'];

      var element = builder(hotspotData, switchSceneFn, findSceneByIdFn);
      stopTouchAndScrollEventPropagation(element);

      if (hotspotData.iconSize && hotspotData.iconSize !== 44) {
        var size = hotspotData.iconSize;
        var half = size / 2;
        element.style.width  = size + 'px';
        element.style.height = size + 'px';
        element.style.marginLeft = '-' + half + 'px';
        element.style.marginTop  = '-' + half + 'px';
        var inner = element.querySelector('svg') || element.querySelector('img.link-icon');
        if (inner) {
          var iconSize = Math.round(size * 0.55);
          inner.style.width  = iconSize + 'px';
          inner.style.height = iconSize + 'px';
        }
        var tooltip = element.querySelector('.link-tooltip');
        if (tooltip) {
          tooltip.style.top = Math.round((size - 28) / 2) + 'px';
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
        var iconWrapper = element.querySelector('.link-icon-wrapper, .icon_wrapper, .out');
        if (iconWrapper && !iconWrapper.classList.contains('tip') && !iconWrapper.classList.contains('content')) {
          iconWrapper.style.width = size + 'px';
          iconWrapper.style.height = size + 'px';
        }
      }

      if (hotspotData.animation && hotspotData.animation !== 'none') {
        var animClass = 'hs-anim-' + hotspotData.animation;
        var animTarget = element.querySelector('.link-icon-wrapper') || element.querySelector('.link-icon') || element.querySelector('.icon_wrapper') || element.querySelector('.out') || element;
        animTarget.classList.add(animClass);
      }

      if (hotspotData.ringEnabled !== false) {
        var primaryRingTarget = element.querySelector('.link-icon-wrapper, .icon_wrapper, .out') || element;
        applyPrimaryRingStyle(primaryRingTarget, hotspotData);
        applyRingStyle(element, hotspotData);
      }

      var hotspotOptions = {
        yaw: hotspotData.yaw,
        pitch: hotspotData.pitch
      };

      if (hotspotData.perspectiveEnabled) {
        hotspotOptions.perspective = {
          radius: hotspotData.perspectiveRadius || 1000,
          extraTransforms: hotspotData.perspectiveTransform || ''
        };
      }

      var hotspot = scene.hotspotContainer().createHotspot(element, hotspotOptions);
      element.__marzipanoHotspot = hotspot;

      return element;
    }
  };

})();
