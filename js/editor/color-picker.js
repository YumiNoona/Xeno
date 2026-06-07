/*
 * Xeno — Custom Brutal Retro Color Picker
 * HSV square + hue slider + hex input + recent colors
 */
(function() {
  'use strict';
  var E = window.XenoEditor;
  var S = E.state;
  var D = E.dom;

  var _hue = 0, _sat = 100, _val = 100;
  var _targetInput = null;
  var _targetSwatch = null;
  var _targetHex = null;
  var _oldColor = '#ffffff';
  var _dragging = { sv: false, hue: false };

  function hsvToHex(h, s, v) {
    s /= 100; v /= 100;
    var c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c;
    var r, g, b;
    if (h < 60) { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  function hexToHsv(hex) {
    var r = parseInt(hex.slice(1, 3), 16) / 255;
    var g = parseInt(hex.slice(3, 5), 16) / 255;
    var b = parseInt(hex.slice(5, 7), 16) / 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var d = max - min;
    var h = 0, s = max === 0 ? 0 : d / max, v = max;
    if (d) {
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
      else if (max === g) h = ((b - r) / d + 2) * 60;
      else h = ((r - g) / d + 4) * 60;
    }
    return { h: Math.round(h), s: Math.round(s * 100), v: Math.round(v * 100) };
  }

  function drawSV() {
    var canvas = document.getElementById('xcp-sv-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var w = canvas.width, h = canvas.height;
    var imageData = ctx.createImageData(w, h);
    var satRad = _sat / 100;
    for (var y = 0; y < h; y++) {
      var val = 1 - y / h;
      for (var x = 0; x < w; x++) {
        var sat = x / w;
        var c = val;
        var X = c * (1 - Math.abs((_hue / 60) % 2 - 1));
        var m = val - c * sat;
        var r, g, b;
        if (_hue < 60) { r = c; g = X; b = 0; }
        else if (_hue < 120) { r = X; g = c; b = 0; }
        else if (_hue < 180) { r = 0; g = c; b = X; }
        else if (_hue < 240) { r = 0; g = X; b = c; }
        else if (_hue < 300) { r = X; g = 0; b = c; }
        else { r = c; g = 0; b = X; }
        var idx = (y * w + x) * 4;
        imageData.data[idx] = (r * sat + m) * 255;
        imageData.data[idx + 1] = (g * sat + m) * 255;
        imageData.data[idx + 2] = (b * sat + m) * 255;
        imageData.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }

  function drawHue() {
    var canvas = document.getElementById('xcp-hue-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var w = canvas.width, h = canvas.height;
    for (var y = 0; y < h; y++) {
      var hue = (y / h) * 360;
      ctx.fillStyle = 'hsl(' + hue + ',100%,50%)';
      ctx.fillRect(0, y, w, 1);
    }
  }

  function updateCursors() {
    var sv = document.getElementById('xcp-sv-cursor');
    if (sv) {
      sv.style.left = (_sat / 100 * 200) + 'px';
      sv.style.top = ((1 - _val / 100) * 200) + 'px';
    }
    var hue = document.getElementById('xcp-hue-cursor');
    if (hue) {
      hue.style.top = ((_hue / 360) * 200 - 3) + 'px';
    }
  }

  function syncAll() {
    var hex = hsvToHex(_hue, _sat, _val);
    var hexInput = document.getElementById('xcp-hex');
    if (hexInput) hexInput.value = hex;
    var preview = document.getElementById('xcp-preview-new');
    if (preview) preview.style.background = hex;
    updateCursors();
    // Live-update the target
    if (_targetInput) { _targetInput.value = hex; _targetInput.dispatchEvent(new Event('input')); }
    if (_targetSwatch) _targetSwatch.style.background = hex;
    if (_targetHex) _targetHex.value = hex;
  }

  function addRecent(hex) {
    var list = JSON.parse(localStorage.getItem('xeno_recent_colors') || '[]');
    list = list.filter(function(c) { return c !== hex; });
    list.unshift(hex);
    if (list.length > 12) list.pop();
    localStorage.setItem('xeno_recent_colors', JSON.stringify(list));
    renderRecent();
  }

  function renderRecent() {
    var el = document.getElementById('xcp-recent-list');
    if (!el) return;
    var list = JSON.parse(localStorage.getItem('xeno_recent_colors') || '[]');
    el.innerHTML = '';
    list.forEach(function(c) {
      var s = document.createElement('div');
      s.className = 'xcp-recent-swatch';
      s.style.background = c;
      s.title = c;
      s.addEventListener('click', function() {
        var hsv = hexToHsv(c);
        _hue = hsv.h; _sat = hsv.s; _val = hsv.v;
        drawSV(); syncAll();
      });
      el.appendChild(s);
    });
  }

  function openPicker(inputId, swatchId, hexInputId) {
    _targetInput = document.getElementById(inputId);
    _targetSwatch = document.getElementById(swatchId);
    _targetHex = document.getElementById(hexInputId);
    if (!_targetInput) return;
    _oldColor = _targetInput.value || '#ffffff';
    var hsv = hexToHsv(_oldColor);
    _hue = hsv.h; _sat = hsv.s; _val = hsv.v;
    var oldPrev = document.getElementById('xcp-preview-old');
    if (oldPrev) oldPrev.style.background = _oldColor;
    var overlay = document.getElementById('xeno-color-picker');
    if (overlay) overlay.style.display = 'flex';
    drawSV();
    drawHue();
    syncAll();
    renderRecent();
  }

  function closePicker() {
    addRecent(hsvToHex(_hue, _sat, _val));
    var overlay = document.getElementById('xeno-color-picker');
    if (overlay) overlay.style.display = 'none';
    _targetInput = null;
    _targetSwatch = null;
    _targetHex = null;
  }

  // ── Event listeners ──────────────────────────────
  function setupPicker() {
    var svBox = document.querySelector('.xcp-sv-box');
    var hueBar = document.querySelector('.xcp-hue-bar');
    var hexInput = document.getElementById('xcp-hex');
    var closeBtn = document.getElementById('xcp-close');
    var overlay = document.getElementById('xeno-color-picker');

    if (!overlay) return;

    // SV box
    if (svBox) {
      svBox.addEventListener('mousedown', function(e) {
        _dragging.sv = true;
        updateSV(e);
        e.preventDefault();
      });
      svBox.addEventListener('touchstart', function(e) {
        _dragging.sv = true;
        updateSV(e.touches[0]);
        e.preventDefault();
      }, { passive: false });
    }

    // Hue bar
    if (hueBar) {
      hueBar.addEventListener('mousedown', function(e) {
        _dragging.hue = true;
        updateHue(e);
        e.preventDefault();
      });
      hueBar.addEventListener('touchstart', function(e) {
        _dragging.hue = true;
        updateHue(e.touches[0]);
        e.preventDefault();
      }, { passive: false });
    }

    window.addEventListener('mousemove', function(e) {
      if (_dragging.sv) updateSV(e);
      if (_dragging.hue) updateHue(e);
    });
    window.addEventListener('touchmove', function(e) {
      if (_dragging.sv) updateSV(e.touches[0]);
      if (_dragging.hue) updateHue(e.touches[0]);
    });
    window.addEventListener('mouseup', function() { _dragging.sv = _dragging.hue = false; });
    window.addEventListener('touchend', function() { _dragging.sv = _dragging.hue = false; });

    function updateSV(e) {
      var rect = svBox.getBoundingClientRect();
      var x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      var y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      _sat = Math.round(x * 100);
      _val = Math.round((1 - y) * 100);
      syncAll();
    }
    function updateHue(e) {
      var rect = hueBar.getBoundingClientRect();
      var y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      _hue = Math.round(y * 360);
      drawSV();
      syncAll();
    }

    // Hex input
    if (hexInput) {
      hexInput.addEventListener('change', function() {
        var val = this.value;
        if (!val.startsWith('#')) val = '#' + val;
        if (val.length === 7 && /^#[0-9a-fA-F]{6}$/.test(val)) {
          var hsv = hexToHsv(val);
          _hue = hsv.h; _sat = hsv.s; _val = hsv.v;
          drawSV(); syncAll();
        }
      });
    }

    // Close
    if (closeBtn) closeBtn.addEventListener('click', closePicker);
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closePicker();
    });

    // Eyedropper
    var dropper = document.getElementById('xcp-eyedropper');
    if (dropper && window.EyeDropper) {
      dropper.addEventListener('click', function() {
        var ed = new EyeDropper();
        ed.open().then(function(result) {
          var hsv = hexToHsv(result.sRGBHex);
          _hue = hsv.h; _sat = hsv.s; _val = hsv.v;
          drawSV(); syncAll();
        }).catch(function() {});
      });
    } else if (dropper) {
      dropper.style.display = 'none';
    }

    // Preset color clicks
    document.querySelectorAll('.xcp-preset').forEach(function(el) {
      el.addEventListener('click', function() {
        var hex = this.getAttribute('data-color');
        var hsv = hexToHsv(hex);
        _hue = hsv.h; _sat = hsv.s; _val = hsv.v;
        drawSV(); syncAll();
      });
    });

    // Initial draw
    drawHue();
  }

  // Wire up swatch clicks to open custom picker instead of native
  function wireSwatches() {
    var iconSwatch = document.getElementById('prop-icon-color-swatch');
    var ringSwatch = document.getElementById('prop-ring-color-swatch');
    if (iconSwatch && iconSwatch.parentElement) {
      iconSwatch.parentElement.addEventListener('click', function(e) {
        e.preventDefault(); e.stopPropagation();
        openPicker('prop-icon-color', 'prop-icon-color-swatch');
      });
    }
    if (ringSwatch && ringSwatch.parentElement) {
      ringSwatch.parentElement.addEventListener('click', function(e) {
        e.preventDefault(); e.stopPropagation();
        openPicker('prop-ring-color', 'prop-ring-color-swatch');
      });
    }
  }

  // Initialize after DOM is ready
  setTimeout(function() {
    setupPicker();
    wireSwatches();
  }, 500);
})();
