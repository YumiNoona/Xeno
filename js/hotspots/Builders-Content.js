/*
 * Xeno — Hotspot Factory: Content Builders
 * Tooltip, expand, hintspot, reveal, rotate, textinfo, image, video, audio, and media builders.
 * Each adds its function to window.HotspotFactory.builders.
 */
'use strict';

(function() {

  var builders = window.HotspotFactory.builders;
  var _ = window.HotspotFactory._;
  var getIconSvg = _.getIconSvg;

  builders.tooltip = function(hotspot) {
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
  };

  builders.expand = function(hotspot) {
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
    icon.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Ccircle cx="12" cy="12" r="10"/%3E%3Cline x1="12" y1="16" x2="12" y2="12"/%3E%3Cline x1="12" y1="8" x2="12.01" y2="8"/%3E%3C/svg%3E';

    var p = document.createElement('p');
    p.textContent = hotspot.text || '';

    wrapper.appendChild(title);
    wrapper.appendChild(icon);
    wrapper.appendChild(p);
    return wrapper;
  };

  builders.hintspot = function(hotspot) {
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
  };

  builders.reveal = function(hotspot) {
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
  };

  builders.rotate = function(hotspot) {
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
  };

  builders.textinfo = function(hotspot) {
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
  };

  builders.text = function(hotspot) {
    var wrapper = document.createElement('div');
    wrapper.classList.add('xeno-hotspot-text');

    var label = document.createElement('div');
    label.classList.add('text-label');

    var inner = document.createElement('div');
    inner.classList.add('text-label-inner');

    var content = document.createElement('span');
    content.textContent = hotspot.text || hotspot.title || 'Text';
    content.classList.add('text-content');
    inner.appendChild(content);
    label.appendChild(inner);

    var hasBg = hotspot.bgColor && hotspot.bgColor !== 'transparent';
    content.style.color = hotspot.textColor || '#ffffff';
    content.style.fontSize = (hotspot.fontSize || 14) + 'px';
    content.style.setProperty('font-family', hotspot.fontFamily || 'inherit', 'important');
    content.style.fontWeight = hotspot.bold ? '900' : 'normal';
    content.style.fontStyle = hotspot.italic ? 'italic' : 'normal';
    content.style.textDecoration = hotspot.underline ? 'underline' : 'none';
    if (hotspot.rotation) {
      inner.style.transform = 'rotate(' + hotspot.rotation + 'deg)';
    }
    if (hasBg) {
      inner.style.backgroundColor = hotspot.bgColor;
      inner.style.padding = '6px 12px';
      inner.style.borderRadius = '6px';
    } else {
      inner.style.backgroundColor = 'transparent';
      inner.style.padding = '0';
      inner.style.borderRadius = '0';
    }
    wrapper.appendChild(label);
    return wrapper;
  };

  builders.narrator = function(hotspot) {
    var wrapper = document.createElement('div');
    wrapper.classList.add('xeno-hotspot-narrator');

    var iconWrapper = document.createElement('div');
    iconWrapper.classList.add('link-icon-wrapper');
    
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '26');
    svg.setAttribute('height', '26');
    svg.style.color = hotspot.iconColor || '#ffffff';
    svg.innerHTML = getIconSvg(hotspot.iconStyle || 'narrator');
    iconWrapper.appendChild(svg);
    
    wrapper.appendChild(iconWrapper);
    return wrapper;
  };

})();
