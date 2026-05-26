/*
 * Xeno — Hotspot Factory
 * Creates DOM elements for different hotspot styles and adds them to the scene.
 * Supports animation classes and link buttons in info popups.
 */
'use strict';

(function() {

  var isEditor = window.location.pathname.indexOf('editor.html') !== -1;

  function getIconSvg(style) {
    var icons = {
      dot:      '<circle cx="12" cy="12" r="5" fill="currentColor"/>',
      arrow:    '<path d="M12 5l7 7-7 7M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>',
      eye:      '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" fill="none"/>',
      pin:      '<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>',
      star:     '<polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" stroke="currentColor" stroke-width="1.5" fill="none"/>',
      play:     '<polygon points="10,8 16,12 10,16" fill="currentColor"/>',
      question: '<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/><line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
      default:  '<line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>'
    };
    return icons[style] || icons.default;
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
      if (hotspot.ringEnabled !== false) {
        iconWrapper.classList.add('has-ring');
        if (hotspot.ringColor) {
          iconWrapper.style.borderColor = hotspot.ringColor;
        }
      }

      if (hotspot.iconStyle === 'custom' && hotspot.customIconUrl) {
        var icon = document.createElement('img');
        icon.src = hotspot.customIconUrl;
        icon.classList.add('link-icon');
        iconWrapper.appendChild(icon);
      } else {
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('width', '26');
        svg.setAttribute('height', '26');
        svg.style.color = hotspot.iconColor || '#ffffff';
        svg.innerHTML = getIconSvg(hotspot.iconStyle || 'default');
        iconWrapper.appendChild(svg);
      }

      if (hotspot.rotation) {
        var transformProperties = [ '-ms-transform', '-webkit-transform', 'transform' ];
        for (var i = 0; i < transformProperties.length; i++) {
          iconWrapper.style[transformProperties[i]] = 'rotate(' + hotspot.rotation + 'rad)';
        }
      }

      var tooltip = document.createElement('div');
      tooltip.classList.add('link-tooltip');
      tooltip.textContent = hotspot.title || hotspot.label || 'Link';

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
      } else if (hotspot.iconStyle === 'custom' && hotspot.customIconUrl) {
        iconWrapper.style.cssText = 'display:flex; align-items:center; justify-content:center; width:44px; height:44px; border-radius:50%; background:rgba(0,0,0,0.6); border:2px solid rgba(255,255,255,0.4); cursor:pointer; overflow:hidden; box-shadow:0 0 10px rgba(0,0,0,0.5); transition:transform 0.2s, background-color 0.2s;';
        var img = document.createElement('img');
        img.src = hotspot.customIconUrl;
        img.style.cssText = 'width:24px; height:24px; object-fit:contain; pointer-events:none;';
        iconWrapper.appendChild(img);
      } else {
        iconWrapper.style.cssText = 'display:flex; align-items:center; justify-content:center; width:44px; height:44px; border-radius:50%; background:rgba(0,0,0,0.6); border:2px solid rgba(255,255,255,0.4); cursor:pointer; overflow:hidden; box-shadow:0 0 10px rgba(0,0,0,0.5); transition:transform 0.2s, background-color 0.2s;';
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('width', '24');
        svg.setAttribute('height', '24');
        svg.style.color = hotspot.iconColor || '#ffffff';
        svg.innerHTML = getIconSvg(hotspot.iconStyle);
        iconWrapper.appendChild(svg);
      }
      
      if (hotspot.ringEnabled !== false) {
         iconWrapper.classList.add('has-ring');
         if (hotspot.ringColor) {
           iconWrapper.style.borderColor = hotspot.ringColor;
         }
       }

      var tip = document.createElement('div');
      tip.classList.add('tip');
      var tipP = document.createElement('p');
      tipP.textContent = hotspot.title || 'Info';
      tip.appendChild(tipP);

      var content = document.createElement('div');
      content.classList.add('content');
      
      var contentTitle = document.createElement('h2');
      contentTitle.textContent = hotspot.title || 'Info';
      content.appendChild(contentTitle);

      var textDiv = document.createElement('div');
      textDiv.className = 'content-text';
      textDiv.textContent = hotspot.text || '';
      content.appendChild(textDiv);

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
        
        textDiv.appendChild(linkBtn);
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

    // ─── Quadrilateral Hotspots (4-Point Surface Mapping) ──────
    quad: function(scene, hotspotData) {
      var wrapper = document.createElement('div');
      wrapper.classList.add('xeno-hotspot-quad');
      wrapper.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: hidden; pointer-events: none;';

      var content = document.createElement('div');
      content.classList.add('xeno-hotspot-quad-content');
      content.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; transform-origin: 0 0;';
      
      var embedCode = hotspotData.embedCode || '';
      var srcWidth = hotspotData.srcWidth || 480;
      var srcHeight = hotspotData.srcHeight || 270;

      if (embedCode) {
        if (embedCode.indexOf('<iframe') !== -1) {
          content.innerHTML = embedCode;
          var iframe = content.querySelector('iframe');
          if (iframe) {
            iframe.width = srcWidth;
            iframe.height = srcHeight;
            iframe.style.maxWidth = '100%';
            iframe.style.maxHeight = '100%';
          }
        } else {
          var iframe = document.createElement('iframe');
          iframe.src = embedCode;
          iframe.width = srcWidth;
          iframe.height = srcHeight;
          iframe.frameBorder = '0';
          iframe.allowFullscreen = true;
          iframe.style.maxWidth = '100%';
          iframe.style.maxHeight = '100%';
          content.appendChild(iframe);
        }
      }

      wrapper.appendChild(content);

      // Calculate and apply homography if 4 points are defined
      if (hotspotData.quadPoints && hotspotData.quadPoints.length === 4) {
        var srcPoints = [
          { x: 0, y: 0 },
          { x: srcWidth, y: 0 },
          { x: srcWidth, y: srcHeight },
          { x: 0, y: srcHeight }
        ];
        
        // Convert yaw/pitch to screen coordinates for homography calculation
        // This requires a temporary Marzipano hotspot for each point to get screen coords
        var dstPoints = hotspotData.quadPoints.map(function(p) {
          var tempHotspot = scene.hotspotContainer().createHotspot(document.createElement('div'), { yaw: p.yaw, pitch: p.pitch });
          var screenCoords = tempHotspot.screen();
          scene.hotspotContainer().destroyHotspot(tempHotspot); // Clean up temp hotspot
          return { x: screenCoords.x, y: screenCoords.y };
        });

        var transformMatrix = window.Homography.getTransform(srcPoints, dstPoints);
        content.style.transform = transformMatrix;
        content.style.transformOrigin = '0 0'; // Important for correct transformation
      }

      // Create Marzipano hotspot
      var hotspot = scene.hotspotContainer().createHotspot(wrapper, {
        yaw: hotspotData.yaw, // Use the first point's yaw/pitch as the hotspot's anchor
        pitch: hotspotData.pitch
      });

      // Add visual markers for the 4 points in editor mode
      if (window.isEditorMode && hotspotData.quadPoints && hotspotData.quadPoints.length === 4) {
        hotspotData.quadPoints.forEach(function(p, index) {
          var marker = document.createElement('div');
          marker.className = 'quad-point-marker';
          marker.textContent = index + 1;
          scene.hotspotContainer().createHotspot(marker, { yaw: p.yaw, pitch: p.pitch });
        });
      }

      return hotspot.domElement();
    },

    // ─── Embedded Hotspots (YouTube, Maps, etc.) ───────────────
    embed: function(hotspot) {
      var wrapper = document.createElement('div');
      wrapper.classList.add('xeno-hotspot-info'); // Use same base styles

      var iconWrapper = document.createElement('div');
      iconWrapper.classList.add('icon_wrapper');
      
      iconWrapper.style.cssText = 'display:flex; align-items:center; justify-content:center; width:44px; height:44px; border-radius:50%; background:rgba(0,0,0,0.6); border:2px solid rgba(255,255,255,0.4); cursor:pointer; overflow:hidden; box-shadow:0 0 10px rgba(0,0,0,0.5); transition:transform 0.2s, background-color 0.2s;';
      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('width', '24');
      svg.setAttribute('height', '24');
      svg.style.color = hotspot.iconColor || '#ffffff';
      svg.innerHTML = '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" stroke-width="2" fill="none"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" stroke-width="2" fill="none"/>';
      iconWrapper.appendChild(svg);

      var content = document.createElement('div');
      content.classList.add('content');
      
      var contentTitle = document.createElement('h2');
      contentTitle.textContent = hotspot.title || 'Embedded Content';
      content.appendChild(contentTitle);

      var embedDiv = document.createElement('div');
      embedDiv.className = 'content-text';
      
      var embedCode = hotspot.embedCode || '';
      var width = hotspot.embedWidth || 480;
      var height = hotspot.embedHeight || 270;

      if (embedCode) {
        if (embedCode.indexOf('<iframe') !== -1) {
          // It's full iframe code
          embedDiv.innerHTML = embedCode;
          var iframe = embedDiv.querySelector('iframe');
          if (iframe) {
            iframe.width = width;
            iframe.height = height;
            iframe.style.maxWidth = '100%';
          }
        } else {
          // Assume it's just a URL
          var iframe = document.createElement('iframe');
          iframe.src = embedCode;
          iframe.width = width;
          iframe.height = height;
          iframe.frameBorder = '0';
          iframe.allowFullscreen = true;
          iframe.style.maxWidth = '100%';
          embedDiv.appendChild(iframe);
        }
      }

      content.appendChild(embedDiv);

      var closeBtn = document.createElement('button');
      closeBtn.className = 'close';
      closeBtn.textContent = 'Close';
      content.appendChild(closeBtn);

      wrapper.appendChild(iconWrapper);
      wrapper.appendChild(content);

      var toggle = function() {
        wrapper.classList.toggle('expanded');
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
      
      var iconWrapper = document.createElement('div');
       iconWrapper.classList.add('link-icon-wrapper');
       if (hotspot.ringEnabled !== false) {
         iconWrapper.classList.add('has-ring');
         if (hotspot.ringColor) {
           iconWrapper.style.borderColor = hotspot.ringColor;
         }
       }

      if (hotspot.iconStyle === 'custom' && hotspot.customIconUrl) {
        var icon = document.createElement('img');
        icon.src = hotspot.customIconUrl;
        icon.classList.add('link-icon');
        iconWrapper.appendChild(icon);
      } else {
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('width', '26');
        svg.setAttribute('height', '26');
        svg.style.color = hotspot.iconColor || '#ffffff';
        svg.innerHTML = getIconSvg(hotspot.iconStyle || 'default');
        iconWrapper.appendChild(svg);
      }

      wrapper.appendChild(iconWrapper);
      var tooltip = document.createElement('div');
      tooltip.classList.add('link-tooltip');
      var tooltipText = document.createTextNode(label);
      tooltip.appendChild(tooltipText);
      wrapper.appendChild(tooltip);

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
      
      var out = document.createElement('div');
       out.classList.add('out');
       if (hotspot.ringEnabled !== false) {
         out.classList.add('has-ring');
         if (hotspot.ringColor) {
           out.style.borderColor = hotspot.ringColor;
         }
       }

      var inner = document.createElement('div');
      inner.classList.add('in');
      inner.style.backgroundColor = hotspot.iconColor || '';

      var img = document.createElement('div');
      img.classList.add('image');
      if (hotspot.iconStyle === 'custom' && hotspot.customIconUrl) {
        img.style.backgroundImage = 'url(' + hotspot.customIconUrl + ')';
      }
      inner.appendChild(img);
      out.appendChild(inner);
      wrapper.appendChild(out);
      var tip = document.createElement('div');
      tip.classList.add('tip');
      var tipP = document.createElement('p');
      tipP.textContent = hotspot.title || '';
      tip.appendChild(tipP);
      wrapper.appendChild(tip);
      return wrapper;
    },

    // ─── Expand Hotspot ────────────────────────────────────────
    expand: function(hotspot) {
      var wrapper = document.createElement('div');
      wrapper.classList.add('xeno-hotspot-expand');
      if (hotspot.iconColor) {
        wrapper.style.backgroundColor = hotspot.iconColor;
      }
      var title = document.createElement('h1');
      title.className = 'title';
      title.textContent = hotspot.title || '';

      var icon = document.createElement('img');
      icon.className = 'icon';
      icon.src = new URL('img/info.png', document.baseURI).href;

      var p = document.createElement('p');
      p.textContent = hotspot.text || '';

      wrapper.appendChild(title);
      wrapper.appendChild(icon);
      wrapper.appendChild(p);
      return wrapper;
    },

    // ─── Hintspot Hotspot ──────────────────────────────────────
    hintspot: function(hotspot) {
      var wrapper = document.createElement('div');
      wrapper.classList.add('xeno-hotspot-hintspot');
      wrapper.classList.add('hint--right', 'hint--info', 'hint--bounce');
      wrapper.setAttribute('data-hint', hotspot.title || '');
      
      if (hotspot.ringEnabled !== false) {
         wrapper.classList.add('has-ring');
         if (hotspot.ringColor) {
           wrapper.style.borderColor = hotspot.ringColor;
         }
       }

      if (hotspot.iconStyle === 'custom' && hotspot.customIconUrl) {
        var img = document.createElement('img');
        img.src = hotspot.customIconUrl;
        wrapper.appendChild(img);
      } else {
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('width', '44');
        svg.setAttribute('height', '44');
        svg.style.color = hotspot.iconColor || '#ffffff';
        svg.innerHTML = getIconSvg(hotspot.iconStyle || 'default');
        wrapper.appendChild(svg);
      }
      return wrapper;
    },

    // ─── Reveal Hotspot ────────────────────────────────────────
    reveal: function(hotspot) {
      var wrapper = document.createElement('div');
      wrapper.classList.add('xeno-hotspot-reveal');
      if (hotspot.iconColor) {
        wrapper.style.backgroundColor = hotspot.iconColor;
      }
      
      if (hotspot.iconStyle === 'custom' && hotspot.customIconUrl) {
        var img = document.createElement('img');
        img.src = hotspot.customIconUrl;
        img.style.cssText = 'width:40px;margin:20px 0;';
        wrapper.appendChild(img);
      } else {
        var iconWrap = document.createElement('div');
        iconWrap.style.cssText = 'margin:20px 0;color:#fff;';
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('width', '40');
        svg.setAttribute('height', '40');
        svg.innerHTML = getIconSvg(hotspot.iconStyle || 'default');
        iconWrap.appendChild(svg);
        wrapper.appendChild(iconWrap);
      }
      
      var content = document.createElement('div');
      content.className = 'reveal-content';
      var p = document.createElement('p');
      p.textContent = hotspot.title || '';
      content.appendChild(p);
      wrapper.appendChild(content);
      return wrapper;
    },

    // ─── Rotate Hotspot ────────────────────────────────────────
    rotate: function(hotspot) {
      var wrapper = document.createElement('div');
      wrapper.classList.add('xeno-hotspot-rotate');
      
      var rotateImg = document.createElement('div');
      rotateImg.classList.add('rotate-img');
      if (hotspot.iconColor) {
        rotateImg.style.backgroundColor = hotspot.iconColor;
      }

      if (hotspot.iconStyle === 'custom' && hotspot.customIconUrl) {
        var img = document.createElement('img');
        img.src = hotspot.customIconUrl;
        rotateImg.appendChild(img);
      } else {
        rotateImg.innerHTML = getIconSvg(hotspot.iconStyle || 'default');
      }

      var rotateContent = document.createElement('div');
      rotateContent.classList.add('rotate-content');
      var title = document.createElement('h1');
      title.textContent = hotspot.title || '';
      var p = document.createElement('p');
      p.textContent = hotspot.text || '';
      rotateContent.appendChild(title);
      rotateContent.appendChild(p);
      
      wrapper.appendChild(rotateImg);
      wrapper.appendChild(rotateContent);
      return wrapper;
    },

    // ─── TextInfo Hotspot ──────────────────────────────────────
    textinfo: function(hotspot) {
      var wrapper = document.createElement('div');
      wrapper.classList.add('xeno-hotspot-textinfo');
      
      var hs = document.createElement('div');
      hs.classList.add('hotspot');
      
      var out = document.createElement('div');
       out.classList.add('out');
       if (hotspot.ringEnabled !== false) {
         out.classList.add('has-ring');
         if (hotspot.ringColor) {
           out.style.borderColor = hotspot.ringColor;
         }
       }
      if (hotspot.iconColor) {
        out.style.borderColor = hotspot.iconColor;
      }

      var inner = document.createElement('div');
      inner.classList.add('in');
      if (hotspot.iconColor) {
        inner.style.backgroundColor = hotspot.iconColor;
      }

      hs.appendChild(out);
      hs.appendChild(inner);
      wrapper.appendChild(hs);
      var tooltip = document.createElement('div');
      tooltip.className = 'tooltip-content';
      var tooltipP = document.createElement('p');
      tooltipP.textContent = hotspot.text || '';
      tooltip.appendChild(tooltipP);
      wrapper.appendChild(tooltip);
      return wrapper;
    },

    // ─── Image Hotspot ─────────────────────────────────────────
    // ─── Image Hotspot ─────────────────────────────────────────
    image: function(hotspot) {
      var wrapper = document.createElement('div');
      wrapper.classList.add('xeno-hotspot-link');
      
      var iconWrapper = document.createElement('div');
       iconWrapper.classList.add('link-icon-wrapper');
       if (hotspot.ringEnabled !== false) {
         iconWrapper.classList.add('has-ring');
         if (hotspot.ringColor) {
           iconWrapper.style.borderColor = hotspot.ringColor;
         }
       }

      if (hotspot.iconStyle === 'custom' && hotspot.customIconUrl) {
        var icon = document.createElement('img');
        icon.src = hotspot.customIconUrl;
        icon.classList.add('link-icon');
        iconWrapper.appendChild(icon);
      } else {
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('width', '26');
        svg.setAttribute('height', '26');
        svg.style.color = hotspot.iconColor || '#ffffff';
        svg.innerHTML = getIconSvg(hotspot.iconStyle || 'default');
        iconWrapper.appendChild(svg);
      }

      wrapper.appendChild(iconWrapper);
      var tooltip = document.createElement('div');
      tooltip.classList.add('link-tooltip');
      var tooltipText = document.createTextNode(hotspot.title || hotspot.label || 'Image');
      tooltip.appendChild(tooltipText);
      wrapper.appendChild(tooltip);

      wrapper.addEventListener('click', function() {
        if (isEditor) return;
        var src = hotspot.content && hotspot.content.src;
        if (!src) {
          alert('No image file selected.');
          return;
        }

        var overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(10,10,18,0.9); z-index:9999; display:flex; flex-direction:column; align-items:center; justify-content:center; backdrop-filter:blur(8px); animation:fadeIn 0.3s ease;';

        var closeBtn = document.createElement('div');
        closeBtn.textContent = '×';
        closeBtn.style.cssText = 'position:absolute; top:20px; right:30px; font-size:var(--type-4xl); font-family:inherit; color:#fff; cursor:pointer; opacity:0.7; transition:opacity 0.2s;';
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
          caption.style.cssText = 'margin-top:15px; color:#fff; font-size:var(--type-lg); font-family:inherit; text-shadow:0 2px 4px rgba(0,0,0,0.8); opacity:0.9; text-align:center;';
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
      
      var iconWrapper = document.createElement('div');
       iconWrapper.classList.add('link-icon-wrapper');
       if (hotspot.ringEnabled !== false) {
         iconWrapper.classList.add('has-ring');
         if (hotspot.ringColor) {
           iconWrapper.style.borderColor = hotspot.ringColor;
         }
       }

      if (hotspot.iconStyle === 'custom' && hotspot.customIconUrl) {
        var icon = document.createElement('img');
        icon.src = hotspot.customIconUrl;
        icon.classList.add('link-icon');
        iconWrapper.appendChild(icon);
      } else {
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('width', '26');
        svg.setAttribute('height', '26');
        svg.style.color = hotspot.iconColor || '#ffffff';
        svg.innerHTML = getIconSvg(hotspot.iconStyle || 'default');
        iconWrapper.appendChild(svg);
      }

      wrapper.appendChild(iconWrapper);
      var tooltip = document.createElement('div');
      tooltip.classList.add('link-tooltip');
      tooltip.textContent = hotspot.title || 'Video';
      wrapper.appendChild(tooltip);

      wrapper.addEventListener('click', function() {
        if (isEditor) return;
        var src = hotspot.content && hotspot.content.src;
        if (!src) {
          alert('No video file selected.');
          return;
        }

        var overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(10,10,18,0.9); z-index:9999; display:flex; flex-direction:column; align-items:center; justify-content:center; backdrop-filter:blur(8px); animation:fadeIn 0.3s ease;';

        var closeBtn = document.createElement('div');
        closeBtn.textContent = '×';
        closeBtn.style.cssText = 'position:absolute; top:20px; right:30px; font-size:var(--type-4xl); font-family:inherit; color:#fff; cursor:pointer; opacity:0.7; transition:opacity 0.2s;';
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
      
      var out = document.createElement('div');
       out.classList.add('out');
       if (hotspot.ringEnabled !== false) {
         out.classList.add('has-ring');
         if (hotspot.ringColor) {
           out.style.borderColor = hotspot.ringColor;
         }
       }

      var inner = document.createElement('div');
      inner.classList.add('in');

      if (hotspot.iconStyle === 'custom' && hotspot.customIconUrl) {
        var img = document.createElement('div');
        img.classList.add('image');
        img.style.backgroundImage = 'url(' + hotspot.customIconUrl + ')';
        inner.appendChild(img);
      } else {
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('width', '24');
        svg.setAttribute('height', '24');
        svg.style.color = hotspot.iconColor || '#ffffff';
        svg.innerHTML = getIconSvg(hotspot.iconStyle || 'default');
        inner.appendChild(svg);
      }

      out.appendChild(inner);
      wrapper.appendChild(out);
      var tip = document.createElement('div');
      tip.classList.add('tip');
      var tipP = document.createElement('p');
      tipP.textContent = hotspot.title || 'Audio';
      tip.appendChild(tipP);
      wrapper.appendChild(tip);

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

      // Apply saved icon size
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
      }

      // Apply animation class to the inner icon element for navigate/link hotspots
      // so the arrow itself animates, not the outer wrapper (which causes a blur square)
      if (hotspotData.animation && hotspotData.animation !== 'none') {
        var animClass = 'hs-anim-' + hotspotData.animation;
        var animTarget = element.querySelector('.link-icon-wrapper') || element.querySelector('.link-icon') || element.querySelector('.icon_wrapper') || element.querySelector('.out') || element;
        animTarget.classList.add(animClass);
      }

      var hotspotOptions = { 
        yaw: hotspotData.yaw, 
        pitch: hotspotData.pitch 
      };

      // Add perspective support for embedded surface hotspots
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