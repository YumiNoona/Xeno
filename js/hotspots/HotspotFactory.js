/*
 * Xeno — Hotspot Factory (Core)
 * Shared helpers and create() entry point.
 * Builders are registered on window.HotspotFactory.builders by Builders-Nav.js and Builders-Content.js.
 */
'use strict';

(function() {

  var isEditor = window.location.pathname.indexOf('editor.html') !== -1;

  function getIconSvg(style) {
    var sw = 'stroke-width="1.8"';
    var sw2 = 'stroke-width="2"';
    var lc = 'stroke-linecap="round"';
    var lj = 'stroke-linejoin="round"';
    var s = 'stroke="currentColor"';
    var f = 'fill="none"';
    var c = 'fill="currentColor"';
    function p(d) { return '<path d="' + d + '" ' + s + ' ' + sw + ' ' + lc + ' ' + lj + ' ' + f + '/>'; }
    var icons = {
      default: p('M12 5v14M5 12h14'),
      dot: '<circle cx="12" cy="12" r="5" ' + c + '/>',
      arrow: p('M5 12h14M12 5l7 7-7 7'),
      eye: p('M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z') + '<circle cx="12" cy="12" r="3" ' + s + ' ' + sw + ' ' + f + '/>',
      home: p('M3 10L12 3l9 7v10H3z') + p('M9 21V12h6v9'),
      camera: p('M2 8h3l2-3h10l2 3h3v13H2z') + '<circle cx="12" cy="14" r="4" ' + s + ' ' + sw + ' ' + f + '/>',
      door: p('M6 3h12v18H6z') + p('M14 12h.01') + '<circle cx="15" cy="12" r="1" ' + c + '/>',
      exit: p('M13 7V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h6a2 2 0 002-2v-2') + p('M17 8l4 4-4 4') + '<line x1="9" y1="12" x2="21" y2="12" ' + s + ' ' + sw2 + ' ' + lc + '/>',
      tag: p('M21 13l-8 8a2 2 0 01-2.83 0L3 14V3h11l8.59 8.59A2 2 0 0121 13z') + '<circle cx="8" cy="8" r="1.5" ' + c + '/>',
      play: '<polygon points="8,5 19,12 8,19" ' + c + '/>',
      pin: p('M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z') + '<circle cx="12" cy="9" r="2.5" ' + c + '/>',
      info: p('M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z') + '<polyline points="14 2 14 8 20 8" ' + s + ' ' + sw + ' ' + lc + ' ' + lj + ' ' + f + '/><line x1="16" y1="13" x2="8" y2="13" ' + s + ' ' + sw + ' ' + lc + '/><line x1="16" y1="17" x2="8" y2="17" ' + s + ' ' + sw + ' ' + lc + '/><line x1="10" y1="9" x2="8" y2="9" ' + s + ' ' + sw + ' ' + lc + '/>',
      star: p('M12 2l3 6 6 1-4 5 1 7-6-3-6 3 1-7-4-5 6-1z'),
      question: p('M8 9a4 4 0 118 0c0 3-4 4-4 5v2') + '<circle cx="12" cy="19" r="1.5" ' + c + '/>',
      stairs: p('M4 20h4v-4h4v-4h4v-4h4'),
      map: p('M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z') + p('M8 2v18M16 6v18'),
      warning: p('M12 2L2 20h20L12 2z') + p('M12 9v5') + '<circle cx="12" cy="18" r="1.5" ' + c + '/>',
      expand: p('M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7'),
      link: p('M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71') + p('M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 00 7.07 7.07l1.71-1.71'),
      photo: p('M2 4h20v16H2z') + p('M2 16l5-5 3 3 4-4 6 6') + '<circle cx="8.5" cy="8.5" r="1.5" ' + c + '/>',
      volume: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" ' + c + '/>' + p('M15.54 8.46a5 5 0 010 7.07') + p('M19.07 4.93a10 10 0 010 14.14'),
      narrator: p('M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z') + p('M19 10v2a7 7 0 0 1-14 0v-2') + '<line x1="12" y1="19" x2="12" y2="23" ' + s + ' ' + sw + ' ' + lc + '/><line x1="8" y1="23" x2="16" y2="23" ' + s + ' ' + sw + ' ' + lc + '/>',
      soundwave: p('M3 18v-6a9 9 0 0 1 18 0v6') + p('M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z'),
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

      // Narrator + ambient: visible only in editor
      if (isEditor && (baseType === 'narrator' || baseType === 'ambient' || style === 'narrator' || style === 'ambient')) {
        element.style.opacity = '1';
      }

      if (hotspotData.iconSize && hotspotData.iconSize >= 24) {
        var size = hotspotData.iconSize;
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
        var tooltip = element.querySelector('.link-tooltip');
        if (tooltip) {
          tooltip.style.top = '50%';
          tooltip.style.left = (size + 4) + 'px';
          tooltip.style.marginLeft = '0';
        }
        var tip = element.querySelector('.tip');
        if (tip) {
          tip.style.left = (size + 16) + 'px';
          tip.style.top = '50%';
        }
        var content = element.querySelector('.content');
        if (content) {
          content.style.left = (size + 16) + 'px';
          content.style.top = '50%';
        }
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
      }

      if (hotspotData.animation && hotspotData.animation !== 'none') {
        var animClass = 'hs-anim-' + hotspotData.animation;
        var animTarget = element.querySelector('.link-icon-wrapper') || element.querySelector('.link-icon') || element.querySelector('.icon_wrapper') || element.querySelector('.out') || element.querySelector('.text-label-inner') || element;
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
