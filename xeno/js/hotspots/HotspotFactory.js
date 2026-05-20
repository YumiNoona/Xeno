/*
 * Xeno — Hotspot Factory
 * Creates DOM elements for different hotspot styles and adds them to the scene.
 * Supports animation classes and link buttons in info popups.
 */
'use strict';

(function() {

  function sanitize(s) {
    return (s || '').replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;');
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

  var builders = {
    // ─── Navigate (Link) Hotspots ──────────────────────────────
    navigate: function(hotspot, switchSceneFn, findSceneByIdFn) {
      var wrapper = document.createElement('div');
      wrapper.classList.add('xeno-hotspot-link');

      var icon = document.createElement('img');
      icon.src = hotspot.customIconUrl || 'img/link.png';
      icon.classList.add('link-icon');

      if (hotspot.rotation) {
        var transformProperties = [ '-ms-transform', '-webkit-transform', 'transform' ];
        for (var i = 0; i < transformProperties.length; i++) {
          icon.style[transformProperties[i]] = 'rotate(' + hotspot.rotation + 'rad)';
        }
      }

      var tooltip = document.createElement('div');
      tooltip.classList.add('link-tooltip');
      tooltip.innerHTML = sanitize(hotspot.title || hotspot.label || 'Link');

      wrapper.appendChild(icon);
      wrapper.appendChild(tooltip);

      // Pass hotspot-level transition overrides to switchScene
      wrapper.addEventListener('click', function() {
        var targetScene = findSceneByIdFn(hotspot.target);
        if (targetScene) {
          var transOpts = {};
          if (hotspot.transition) transOpts.transition = hotspot.transition;
          if (hotspot.transitionDuration) transOpts.transitionDuration = hotspot.transitionDuration;
          switchSceneFn(targetScene, transOpts);
        }
      });

      return wrapper;
    },

    // Keep old 'link' as alias for navigate
    link: function(hotspot, switchSceneFn, findSceneByIdFn) {
      return builders.navigate(hotspot, switchSceneFn, findSceneByIdFn);
    },

    // ─── Info Hotspots (with link support) ─────────────────────
    info: function(hotspot, switchSceneFn, findSceneByIdFn) {
      var wrapper = document.createElement('div');
      wrapper.classList.add('xeno-hotspot-info');

      var iconWrapper = document.createElement('div');
      iconWrapper.classList.add('icon_wrapper');
      iconWrapper.innerHTML = '<div class="icon"><div class="inner_icon"><div class="icon1"></div><div class="icon2"></div></div></div>';

      var tip = document.createElement('div');
      tip.classList.add('tip');
      tip.innerHTML = '<p>' + sanitize(hotspot.title || 'Info') + '</p>';

      var content = document.createElement('div');
      content.classList.add('content');
      
      var contentHtml = '<h2>' + sanitize(hotspot.title || 'Info') + '</h2>';
      contentHtml += '<div class="content-text">' + sanitize(hotspot.text) + '</div>';
      
      content.innerHTML = contentHtml;

      // Link support
      if (hotspot.linkUrl || (hotspot.linkType === 'scene' && hotspot.linkTarget)) {
        var linkBtn = document.createElement('a');
        linkBtn.classList.add('hs-info-link-btn');
        
        if (hotspot.linkType === 'scene' && hotspot.linkTarget) {
          linkBtn.href = 'javascript:void(0)';
          linkBtn.textContent = hotspot.linkLabel || 'Go to scene';
          linkBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            var targetScene = findSceneByIdFn(hotspot.linkTarget);
            if (targetScene) switchSceneFn(targetScene);
          });
        } else {
          linkBtn.href = hotspot.linkUrl;
          linkBtn.target = '_blank';
          linkBtn.rel = 'noopener noreferrer';
          linkBtn.textContent = hotspot.linkLabel || 'Open link';
        }
        
        var textDiv = content.querySelector('.content-text');
        if (textDiv) textDiv.appendChild(linkBtn);
      }

      // Close button
      var closeBtn = document.createElement('button');
      closeBtn.className = 'close';
      closeBtn.textContent = 'Close';
      content.appendChild(closeBtn);

      wrapper.appendChild(iconWrapper);
      wrapper.appendChild(tip);
      wrapper.appendChild(content);

      var toggle = function() {
        wrapper.classList.toggle('expanded');
        var innerIcon = wrapper.querySelector('.inner_icon');
        if (innerIcon) innerIcon.classList.toggle('closeIcon');
      };

      iconWrapper.addEventListener('click', toggle);
      closeBtn.addEventListener('click', toggle);

      return wrapper;
    },

    // ─── URL Hotspot ───────────────────────────────────────────
    url: function(hotspot) {
      var wrapper = document.createElement('div');
      wrapper.classList.add('xeno-hotspot-link');
      var label = hotspot.title || hotspot.urlLabel || 'Open link';
      wrapper.innerHTML = '<img class="link-icon" src="img/link.png"><div class="link-tooltip">' + sanitize(label) + '</div>';

      wrapper.addEventListener('click', function() {
        if (hotspot.urlOpenIn === 'popup') {
          // Simple popup overlay
          var overlay = document.createElement('div');
          overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);z-index:9999;display:flex;align-items:center;justify-content:center;';
          var iframe = document.createElement('iframe');
          iframe.src = hotspot.urlHref || hotspot.linkUrl || '#';
          iframe.style.cssText = 'width:80%;height:80%;border:none;border-radius:12px;';
          overlay.appendChild(iframe);
          overlay.addEventListener('click', function(e) { if (e.target === overlay) document.body.removeChild(overlay); });
          document.body.appendChild(overlay);
        } else {
          window.open(hotspot.urlHref || hotspot.linkUrl || '#', '_blank');
        }
      });

      return wrapper;
    },

    // ─── Tooltip Hotspot ───────────────────────────────────────
    tooltip: function(hotspot) {
      var wrapper = document.createElement('div');
      wrapper.classList.add('xeno-hotspot-tooltip');
      wrapper.innerHTML = '<div class="out"><div class="in"><div class="image"></div></div></div><div class="tip"><p>' + sanitize(hotspot.title) + '</p></div>';
      return wrapper;
    },

    // ─── Expand Hotspot ────────────────────────────────────────
    expand: function(hotspot) {
      var wrapper = document.createElement('div');
      wrapper.classList.add('xeno-hotspot-expand');
      wrapper.innerHTML = '<h1 class="title">' + sanitize(hotspot.title) + '</h1><img class="icon" src="img/info.png"><p>' + sanitize(hotspot.text) + '</p>';
      return wrapper;
    },

    // ─── Hintspot Hotspot ──────────────────────────────────────
    hintspot: function(hotspot) {
      var wrapper = document.createElement('div');
      wrapper.classList.add('xeno-hotspot-hintspot');
      wrapper.classList.add('hint--right', 'hint--info', 'hint--bounce');
      wrapper.setAttribute('data-hint', sanitize(hotspot.title));
      wrapper.innerHTML = '<img src="img/hotspot.png">';
      return wrapper;
    },

    // ─── Reveal Hotspot ────────────────────────────────────────
    reveal: function(hotspot) {
      var wrapper = document.createElement('div');
      wrapper.classList.add('xeno-hotspot-reveal');
      wrapper.innerHTML = '<img src="img/photo.png"><div class="reveal-content"><p>' + sanitize(hotspot.title) + '</p></div>';
      return wrapper;
    },

    // ─── Rotate Hotspot ────────────────────────────────────────
    rotate: function(hotspot) {
      var wrapper = document.createElement('div');
      wrapper.classList.add('xeno-hotspot-rotate');
      wrapper.innerHTML = '<div class="rotate-img"><img src="img/logo.png"></div><div class="rotate-content"><h1>' + sanitize(hotspot.title) + '</h1><p>' + sanitize(hotspot.text) + '</p></div>';
      return wrapper;
    },

    // ─── TextInfo Hotspot ──────────────────────────────────────
    textinfo: function(hotspot) {
      var wrapper = document.createElement('div');
      wrapper.classList.add('xeno-hotspot-textinfo');
      wrapper.innerHTML = '<div class="hotspot"><div class="out"></div><div class="in"></div></div><div class="tooltip-content"><p>' + sanitize(hotspot.text) + '</p></div>';
      return wrapper;
    },

    // ─── Image Hotspot ─────────────────────────────────────────
    image: function(hotspot) {
      var wrapper = document.createElement('div');
      wrapper.classList.add('xeno-hotspot-link');
      wrapper.innerHTML = '<img class="link-icon" src="img/photo.png"><div class="link-tooltip">' + sanitize(hotspot.title || hotspot.label || 'Image') + '</div>';

      wrapper.addEventListener('click', function() {
        if (hotspot.content && hotspot.content.src) {
          window.open(hotspot.content.src, '_blank');
        } else {
          alert('Image hotspot: ' + (hotspot.title || 'No image'));
        }
      });
      return wrapper;
    },

    // ─── Video Hotspot ─────────────────────────────────────────
    video: function(hotspot) {
      var wrapper = document.createElement('div');
      wrapper.classList.add('xeno-hotspot-link');
      wrapper.innerHTML = '<img class="link-icon" src="img/photo.png"><div class="link-tooltip">' + sanitize(hotspot.title || 'Video') + '</div>';

      wrapper.addEventListener('click', function() {
        alert('Video hotspot: ' + (hotspot.title || 'No video'));
      });
      return wrapper;
    },

    // ─── Audio Hotspot ─────────────────────────────────────────
    audio: function(hotspot) {
      var wrapper = document.createElement('div');
      wrapper.classList.add('xeno-hotspot-tooltip');
      wrapper.innerHTML = '<div class="out"><div class="in"><div class="image" style="background-image:url(img/info.png)"></div></div></div><div class="tip"><p>' + sanitize(hotspot.title || 'Audio') + '</p></div>';
      return wrapper;
    },

    // ─── Media Hotspot (legacy) ────────────────────────────────
    media: function(hotspot) {
      return builders.image(hotspot);
    }
  };

  window.HotspotFactory = {
    create: function(scene, hotspotData, baseType, switchSceneFn, findSceneByIdFn) {
      var style = hotspotData.style || baseType;
      var builder = builders[style] || builders[baseType] || builders['info'];
      
      var element = builder(hotspotData, switchSceneFn, findSceneByIdFn);
      stopTouchAndScrollEventPropagation(element);

      // Apply animation class to the inner icon element for navigate/link hotspots
      // so the arrow itself animates, not the outer wrapper (which causes a blur square)
      if (hotspotData.animation && hotspotData.animation !== 'none') {
        var animClass = 'hs-anim-' + hotspotData.animation;
        var animTarget = element.querySelector('.link-icon') || element.querySelector('.icon_wrapper') || element.querySelector('.out') || element;
        animTarget.classList.add(animClass);
      }

      scene.hotspotContainer().createHotspot(element, { 
        yaw: hotspotData.yaw, 
        pitch: hotspotData.pitch 
      });

      return element;
    }
  };

})();
