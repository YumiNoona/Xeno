window.XenoViewerCapture = (function() {
  'use strict';

  function init(viewer) {
    var captureToggle = document.getElementById('captureToggle');
    var captureOverlay = document.getElementById('capture-overlay');
    var captureImage = captureOverlay && captureOverlay.querySelector('.capture-image');
    var captureWrap = captureOverlay && captureOverlay.querySelector('.capture-image-wrap');
    var captureClose = document.getElementById('capture-close');
    var captureDownload = document.getElementById('capture-download');
    var ratioOptions = captureOverlay && captureOverlay.querySelectorAll('.ratio-option');
    var currentCaptureDataUrl = null;

    function showCapture(dataUrl) {
      currentCaptureDataUrl = dataUrl;
      if (captureImage) captureImage.src = dataUrl;
      if (captureOverlay) captureOverlay.style.display = 'flex';
      if (ratioOptions) {
        ratioOptions.forEach(function (o) { o.classList.remove('active'); });
        var fullOpt = captureOverlay.querySelector('.ratio-option[data-ratio="full"]');
        if (fullOpt) fullOpt.classList.add('active');
      }
      if (captureWrap) captureWrap.setAttribute('data-ratio', 'full');
    }

    function hideCapture() {
      if (captureOverlay) captureOverlay.style.display = 'none';
    }

    if (captureToggle && viewer && viewer.stage) {
      captureToggle.addEventListener('click', function () {
        try {
          var dataUrl = viewer.stage().takeSnapshot({ quality: 92 });
          showCapture(dataUrl);
        } catch (e) {
          var t = document.querySelector('.viewer-toast');
          if (!t) {
            t = document.createElement('div');
            t.className = 'viewer-toast';
            document.body.appendChild(t);
          }
          t.textContent = 'Capture failed: ' + e.message;
          t.classList.add('visible');
          clearTimeout(t._hide);
          t._hide = setTimeout(function() { t.classList.remove('visible'); }, 2500);
        }
      });
    }

    if (ratioOptions) {
      ratioOptions.forEach(function (opt) {
        opt.addEventListener('click', function () {
          ratioOptions.forEach(function (o) { o.classList.remove('active'); });
          this.classList.add('active');
          var ratio = this.getAttribute('data-ratio');
          if (captureWrap) captureWrap.setAttribute('data-ratio', ratio);
        });
      });
    }

    if (captureClose) {
      captureClose.addEventListener('click', hideCapture);
    }

    if (captureDownload && captureOverlay) {
      captureDownload.addEventListener('click', function () {
        if (!currentCaptureDataUrl) return;
        var ratio = captureWrap ? captureWrap.getAttribute('data-ratio') : 'full';
        var img = new Image();
        img.onload = function () {
          var c = document.createElement('canvas');
          var ctx = c.getContext('2d');
          var w = img.naturalWidth, h = img.naturalHeight;
          var dw = w, dh = h;
          if (ratio === '1-1') { dw = Math.min(w, h); dh = dw; }
          else if (ratio === '4-3') { dh = Math.round(dw * 3 / 4); if (dh > h) { dh = h; dw = Math.round(dh * 4 / 3); } }
          else if (ratio === '3-2') { dh = Math.round(dw * 2 / 3); if (dh > h) { dh = h; dw = Math.round(dh * 3 / 2); } }
          else if (ratio === '16-9') { dh = Math.round(dw * 9 / 16); if (dh > h) { dh = h; dw = Math.round(dh * 16 / 9); } }
          c.width = dw; c.height = dh;
          var sx = (w - dw) / 2, sy = (h - dh) / 2;
          ctx.drawImage(img, sx, sy, dw, dh, 0, 0, dw, dh);
          var link = document.createElement('a');
          link.download = 'xeno-capture-' + ratio + '.png';
          link.href = c.toDataURL('image/png');
          link.click();
        };
        img.src = currentCaptureDataUrl;
      });
    }
  }

  return { init: init };
})();
