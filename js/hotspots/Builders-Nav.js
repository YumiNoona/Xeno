/*
 * Xeno — Hotspot Factory: Navigation Builders
 * Navigate (link), info, quad, embed, and url hotspot builders.
 * Each adds its function to window.HotspotFactory.builders.
 */
'use strict';

(function() {

  var builders = window.HotspotFactory.builders;
  var _ = window.HotspotFactory._;
  var getIconSvg = _.getIconSvg;

  builders.navigate = function(hotspot, switchSceneFn, findSceneByIdFn) {
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
    var targetScene = null;
    try { if (hotspot.target && findSceneByIdFn) targetScene = findSceneByIdFn(hotspot.target); } catch(e) {}
    var displayName = (targetScene && targetScene.data && targetScene.data.name) 
      ? targetScene.data.name.replace(/\.[^/.]+$/, '') 
      : (hotspot.title || hotspot.label || 'Link');
    tooltip.textContent = displayName;

    wrapper.appendChild(iconWrapper);
    wrapper.appendChild(tooltip);

    wrapper.addEventListener('click', function() {
      if (_.isEditor) return;
      var targetScene = findSceneByIdFn(hotspot.target);
      if (targetScene) {
        var transOpts = {};
        if (hotspot.transition) transOpts.transition = hotspot.transition;
        if (hotspot.transitionDuration) transOpts.transitionDuration = hotspot.transitionDuration;
        switchSceneFn(targetScene, transOpts);
      }
    });

    return wrapper;
  };

  builders.link = function(hotspot, switchSceneFn, findSceneByIdFn) {
    return builders.navigate(hotspot, switchSceneFn, findSceneByIdFn);
  };

  builders.info = function(hotspot, switchSceneFn, findSceneByIdFn) {
    var wrapper = document.createElement('div');
    wrapper.classList.add('xeno-hotspot-info');

    var iconWrapper = document.createElement('div');
    iconWrapper.classList.add('icon_wrapper');

    var useDefaultIcon = !hotspot.iconStyle || hotspot.iconStyle === 'default';
    if (useDefaultIcon || hotspot.iconStyle === 'custom' && hotspot.customIconUrl) {
      iconWrapper.style.cssText = 'display:flex; align-items:center; justify-content:center; width:44px; height:44px; border-radius:50%; background:rgba(0,0,0,0.6); border:2px solid rgba(255,255,255,0.4); cursor:pointer; overflow:hidden; box-shadow:0 0 10px rgba(0,0,0,0.5); transition:transform 0.2s, background-color 0.2s;';
      if (hotspot.iconStyle === 'custom' && hotspot.customIconUrl) {
        var img = document.createElement('img');
        img.src = hotspot.customIconUrl;
        img.style.cssText = 'width:24px; height:24px; object-fit:contain; pointer-events:none;';
        iconWrapper.appendChild(img);
      } else {
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('width', '24');
        svg.setAttribute('height', '24');
        svg.style.color = hotspot.iconColor || '#ffffff';
        svg.innerHTML = getIconSvg('info');
        iconWrapper.appendChild(svg);
      }
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
  };

  builders.quad = function(scene, hotspotData) {
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

    if (hotspotData.quadPoints && hotspotData.quadPoints.length === 4) {
      var srcPoints = [
        { x: 0, y: 0 },
        { x: srcWidth, y: 0 },
        { x: srcWidth, y: srcHeight },
        { x: 0, y: srcHeight }
      ];

      var dstPoints = hotspotData.quadPoints.map(function(p) {
        var tempHotspot = scene.hotspotContainer().createHotspot(document.createElement('div'), { yaw: p.yaw, pitch: p.pitch });
        var screenCoords = tempHotspot.screen();
        scene.hotspotContainer().destroyHotspot(tempHotspot);
        return { x: screenCoords.x, y: screenCoords.y };
      });

      var transformMatrix = window.Homography ? window.Homography.getTransform(srcPoints, dstPoints) : '';
      content.style.transform = transformMatrix;
      content.style.transformOrigin = '0 0';
    }

    var hotspot = scene.hotspotContainer().createHotspot(wrapper, {
      yaw: hotspotData.yaw,
      pitch: hotspotData.pitch
    });

    if (window.isEditorMode && hotspotData.quadPoints && hotspotData.quadPoints.length === 4) {
      hotspotData.quadPoints.forEach(function(p, index) {
        var marker = document.createElement('div');
        marker.className = 'quad-point-marker';
        marker.textContent = index + 1;
        scene.hotspotContainer().createHotspot(marker, { yaw: p.yaw, pitch: p.pitch });
      });
    }

    return hotspot.domElement();
  };

  builders.embed = function(hotspot) {
    var wrapper = document.createElement('div');
    wrapper.classList.add('xeno-hotspot-info');

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
        embedDiv.innerHTML = embedCode;
        var iframe = embedDiv.querySelector('iframe');
        if (iframe) {
          iframe.width = width;
          iframe.height = height;
          iframe.style.maxWidth = '100%';
        }
      } else {
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
  };

  builders.url = function(hotspot) {
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
      if (_.isEditor) return;
      if (hotspot.urlOpenIn === 'popup') {
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
  };

})();
