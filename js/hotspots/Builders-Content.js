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
    icon.src = new URL('img/info.png', document.baseURI).href;

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

  builders.image = function(hotspot) {
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
      if (_.isEditor) return;
      var src = hotspot.content && hotspot.content.src;
      if (!src) {
        alert('No image file selected.');
        return;
      }

      var overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(10,10,18,0.9); z-index:9999; display:flex; flex-direction:column; align-items:center; justify-content:center; backdrop-filter:blur(8px); animation:fadeIn 0.3s ease;';

      var closeBtn = document.createElement('div');
      closeBtn.textContent = '\u00D7';
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
  };

  builders.video = function(hotspot) {
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
      if (_.isEditor) return;
      var src = hotspot.content && hotspot.content.src;
      if (!src) {
        alert('No video file selected.');
        return;
      }

      var overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(10,10,18,0.9); z-index:9999; display:flex; flex-direction:column; align-items:center; justify-content:center; backdrop-filter:blur(8px); animation:fadeIn 0.3s ease;';

      var closeBtn = document.createElement('div');
      closeBtn.textContent = '\u00D7';
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
  };

  builders.audio = function(hotspot) {
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
      if (_.isEditor) return;
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
  };

  builders.media = function(hotspot) {
    return builders.image(hotspot);
  };

})();
