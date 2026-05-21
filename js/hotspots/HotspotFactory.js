/*
 * Xeno — Hotspot Factory
 * Creates DOM elements for different hotspot styles and adds them to the scene.
 * Supports animation classes and link buttons in info popups.
 */
'use strict';

(function() {

  var isEditor = window.location.pathname.indexOf('editor.html') !== -1;

  function sanitize(s) {
    return (s || '').replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;');
  }

  function getIconSrc(hotspot, defaultIcon) {
    if (hotspot.iconStyle === 'custom') {
      return hotspot.customIconUrl || defaultIcon;
    }
    if (hotspot.iconStyle === 'dot') {
      return 'img/hotspot.png';
    }
    if (hotspot.iconStyle === 'arrow') {
      return 'img/up.png';
    }
    return defaultIcon;
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

      var iconWrapper = document.createElement('div');
      iconWrapper.classList.add('link-icon-wrapper');

      var icon = document.createElement('img');
      icon.src = getIconSrc(hotspot, 'img/link.png');
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

      iconWrapper.appendChild(icon);
      wrapper.appendChild(iconWrapper);
      wrapper.appendChild(tooltip);

      // Pass hotspot-level transition overrides to switchScene
      wrapper.addEventListener('click', function() {
        if (isEditor) return;
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
      
      var useDefaultIcon = !hotspot.iconStyle || hotspot.iconStyle === 'default';
      if (useDefaultIcon) {
        iconWrapper.innerHTML = '<div class="icon"><div class="inner_icon"><div class="icon1"></div><div class="icon2"></div></div></div>';
      } else {
        var iconSrc = getIconSrc(hotspot, 'img/info.png');
        iconWrapper.style.cssText = 'display:flex; align-items:center; justify-content:center; width:44px; height:44px; border-radius:50%; background:rgba(0,0,0,0.6); border:2px solid rgba(255,255,255,0.4); cursor:pointer; overflow:hidden; box-shadow:0 0 10px rgba(0,0,0,0.5); transition:transform 0.2s, background-color 0.2s;';
        iconWrapper.addEventListener('mouseenter', function() {
          iconWrapper.style.transform = 'scale(1.1)';
          iconWrapper.style.backgroundColor = 'rgba(0,111,255,0.3)';
        });
        iconWrapper.addEventListener('mouseleave', function() {
          iconWrapper.style.transform = 'scale(1)';
          iconWrapper.style.backgroundColor = 'rgba(0,0,0,0.6)';
        });
        var img = document.createElement('img');
        img.src = iconSrc;
        img.style.cssText = 'width:24px; height:24px; object-fit:contain; pointer-events:none;';
        iconWrapper.appendChild(img);
      }

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
      var iconSrc = getIconSrc(hotspot, 'img/link.png');
      wrapper.innerHTML = '<img class="link-icon" src="' + iconSrc + '"><div class="link-tooltip">' + sanitize(label) + '</div>';

      wrapper.addEventListener('click', function() {
        if (isEditor) return;
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
    // ─── Image Hotspot ─────────────────────────────────────────
    image: function(hotspot) {
      var wrapper = document.createElement('div');
      wrapper.classList.add('xeno-hotspot-link');
      var iconSrc = getIconSrc(hotspot, 'img/photo.png');
      wrapper.innerHTML = '<img class="link-icon" src="' + iconSrc + '"><div class="link-tooltip">' + sanitize(hotspot.title || hotspot.label || 'Image') + '</div>';

      wrapper.addEventListener('click', function() {
        if (isEditor) return;
        var src = hotspot.content && hotspot.content.src;
        if (!src) {
          alert('No image file selected.');
          return;
        }

        // Inject keyframes if not exists
        if (!document.getElementById('xeno-modal-animation-styles')) {
          var style = document.createElement('style');
          style.id = 'xeno-modal-animation-styles';
          style.innerHTML = '\
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }\
            @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }\
          ';
          document.head.appendChild(style);
        }

        var overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(10,10,18,0.9); z-index:9999; display:flex; flex-direction:column; align-items:center; justify-content:center; backdrop-filter:blur(8px); animation:fadeIn 0.3s ease;';

        var closeBtn = document.createElement('div');
        closeBtn.innerHTML = '&times;';
        closeBtn.style.cssText = 'position:absolute; top:20px; right:30px; font-size:40px; color:#fff; cursor:pointer; opacity:0.7; transition:opacity 0.2s;';
        closeBtn.addEventListener('mouseenter', function() { closeBtn.style.opacity = '1'; });
        closeBtn.addEventListener('mouseleave', function() { closeBtn.style.opacity = '0.7'; });
        closeBtn.addEventListener('click', function() { document.body.removeChild(overlay); });
        overlay.appendChild(closeBtn);

        var contentWrapper = document.createElement('div');
        contentWrapper.style.cssText = 'max-width:85%; max-height:80%; display:flex; flex-direction:column; align-items:center; justify-content:center; animation:scaleUp 0.3s ease;';

        var img = document.createElement('img');
        img.src = src;
        img.style.cssText = 'max-width:100%; max-height:85vh; object-fit:contain; border-radius:8px; box-shadow:0 20px 40px rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.1);';
        
        if (hotspot.content && hotspot.content.linkUrl) {
          img.style.cursor = 'pointer';
          img.addEventListener('click', function() {
            window.open(hotspot.content.linkUrl, '_blank');
          });
        }
        contentWrapper.appendChild(img);

        if (hotspot.content && hotspot.content.caption) {
          var caption = document.createElement('div');
          caption.textContent = hotspot.content.caption;
          caption.style.cssText = 'margin-top:15px; color:#fff; font-size:16px; font-family:sans-serif; text-shadow:0 2px 4px rgba(0,0,0,0.8); opacity:0.9; text-align:center;';
          contentWrapper.appendChild(caption);
        }

        overlay.appendChild(contentWrapper);
        overlay.addEventListener('click', function(e) { if (e.target === overlay) document.body.removeChild(overlay); });
        document.body.appendChild(overlay);
      });
      return wrapper;
    },

    // ─── Video Hotspot ─────────────────────────────────────────
    video: function(hotspot) {
      var wrapper = document.createElement('div');
      wrapper.classList.add('xeno-hotspot-link');
      var iconSrc = getIconSrc(hotspot, 'img/photo.png');
      wrapper.innerHTML = '<img class="link-icon" src="' + iconSrc + '"><div class="link-tooltip">' + sanitize(hotspot.title || 'Video') + '</div>';

      wrapper.addEventListener('click', function() {
        if (isEditor) return;
        var src = hotspot.content && hotspot.content.src;
        if (!src) {
          alert('No video file selected.');
          return;
        }

        if (!document.getElementById('xeno-modal-animation-styles')) {
          var style = document.createElement('style');
          style.id = 'xeno-modal-animation-styles';
          style.innerHTML = '\
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }\
            @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }\
          ';
          document.head.appendChild(style);
        }

        var overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(10,10,18,0.9); z-index:9999; display:flex; flex-direction:column; align-items:center; justify-content:center; backdrop-filter:blur(8px); animation:fadeIn 0.3s ease;';

        var closeBtn = document.createElement('div');
        closeBtn.innerHTML = '&times;';
        closeBtn.style.cssText = 'position:absolute; top:20px; right:30px; font-size:40px; color:#fff; cursor:pointer; opacity:0.7; transition:opacity 0.2s;';
        closeBtn.addEventListener('mouseenter', function() { closeBtn.style.opacity = '1'; });
        closeBtn.addEventListener('mouseleave', function() { closeBtn.style.opacity = '0.7'; });
        closeBtn.addEventListener('click', function() { document.body.removeChild(overlay); });
        overlay.appendChild(closeBtn);

        var contentWrapper = document.createElement('div');
        contentWrapper.style.cssText = 'width:80%; max-width:960px; aspect-ratio:16/9; display:flex; align-items:center; justify-content:center; animation:scaleUp 0.3s ease;';

        var video = document.createElement('video');
        video.src = src;
        video.controls = true;
        video.autoplay = hotspot.autoplay !== false;
        video.loop = hotspot.loop === true;
        video.muted = hotspot.muted === true;
        video.style.cssText = 'width:100%; height:100%; border-radius:8px; box-shadow:0 20px 40px rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.1); background:#000;';
        contentWrapper.appendChild(video);

        overlay.appendChild(contentWrapper);
        overlay.addEventListener('click', function(e) { if (e.target === overlay) { video.pause(); document.body.removeChild(overlay); } });
        closeBtn.addEventListener('click', function() { video.pause(); });
        document.body.appendChild(overlay);
      });
      return wrapper;
    },

    // ─── Audio Hotspot ─────────────────────────────────────────
    audio: function(hotspot) {
      var wrapper = document.createElement('div');
      wrapper.classList.add('xeno-hotspot-tooltip');
      wrapper.style.cursor = 'pointer';
      
      var iconSrc = getIconSrc(hotspot, 'img/info.png');
      wrapper.innerHTML = '<div class="out"><div class="in"><div class="image" style="background-image:url(' + iconSrc + ')"></div></div></div><div class="tip"><p>' + sanitize(hotspot.title || 'Audio') + '</p></div>';

      var audio = null;
      var isPlaying = false;

      wrapper.addEventListener('click', function() {
        if (isEditor) return;
        var src = hotspot.content && hotspot.content.src;
        if (!src) {
          alert('No audio file selected.');
          return;
        }

        if (!audio) {
          audio = new Audio(src);
          audio.loop = hotspot.loop === true;
          audio.addEventListener('ended', function() {
            isPlaying = false;
            wrapper.querySelector('.in').style.background = '';
          });
        }

        if (isPlaying) {
          audio.pause();
          isPlaying = false;
          wrapper.querySelector('.in').style.background = '';
        } else {
          audio.play().then(function() {
            isPlaying = true;
            wrapper.querySelector('.in').style.background = '#006fff';
          }).catch(function(err) {
            alert('Playback failed: ' + err.message);
          });
        }
      });
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
        var animTarget = element.querySelector('.link-icon-wrapper') || element.querySelector('.link-icon') || element.querySelector('.icon_wrapper') || element.querySelector('.out') || element;
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
