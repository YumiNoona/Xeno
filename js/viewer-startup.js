(function() {
  'use strict';

  var remoteLoadUrl = window.XENO_LOAD_URL || new URLSearchParams(window.location.search).get('load');
  if (remoteLoadUrl) {
    var _blobUrlsToRevoke = [];
    fetch(remoteLoadUrl)
      .then(function(r) { if (!r.ok) throw new Error('Project not found'); return r.json(); })
      .then(function(bundle) {
        var tourData = bundle.project || bundle;
        if (bundle.media && bundle.media.length) {
          var mediaMap = {};
          var mediaPromises = bundle.media.map(function(m) {
            if (!m.data) return Promise.resolve();
            var base64 = m.data.split(',')[1];
            if (!base64) return Promise.resolve();
            try {
              var mimeType = m.data.split(',')[0].match(/:(.*?);/);
              mimeType = mimeType ? mimeType[1] : 'application/octet-stream';
              return fetch('data:' + mimeType + ';base64,' + base64).then(function(r) {
                return r.blob();
              }).then(function(blob) {
                var blobUrl = URL.createObjectURL(blob);
                mediaMap[m.id] = blobUrl;
                _blobUrlsToRevoke.push(blobUrl);
              }).catch(function() {});
            } catch(e) { return Promise.resolve(); }
          });
          return Promise.all(mediaPromises).then(function() {
            function patchUrls(obj) {
              if (typeof obj === 'string' && mediaMap[obj]) return mediaMap[obj];
              if (Array.isArray(obj)) return obj.map(patchUrls);
              if (obj && typeof obj === 'object') {
                for (var k in obj) if (obj.hasOwnProperty(k) && k !== '_mediaId') obj[k] = patchUrls(obj[k]);
              }
              return obj;
            }
            patchUrls(tourData);
            return tourData;
          });
        }
        return tourData;
      })
      .then(function(tourData) {
        return XenoViewerMedia.preloadSceneImages(tourData);
      })
      .then(function(tourData) {
        window.xenoInitViewer(tourData);
        var handleExit = function() {
          _blobUrlsToRevoke.forEach(function(url) { try { URL.revokeObjectURL(url); } catch(e) {} });
          _blobUrlsToRevoke = [];
        };
        window.addEventListener('pagehide', handleExit);
        window.addEventListener('beforeunload', handleExit);
      })
      .catch(function(err) {
        alert('Failed to load shared project: ' + err.message);
      });
  } else if (!window.isExported) {
    var previewSlug = new URLSearchParams(window.location.search).get('project') || 'sample-tour';
    window.XenoSupabase.loadTour(previewSlug)
      .then(function (savedData) {
        return XenoViewerMedia.resolveAllMedia(savedData || window.data);
      })
      .then(function (tourData) {
        return XenoViewerMedia.preloadSceneImages(tourData);
      })
      .then(function (tourData) {
        window.xenoInitViewer(tourData);
      });
  } else {
    XenoViewerMedia.resolveAllMedia(window.data).then(function () {
      return XenoViewerMedia.preloadSceneImages(window.data);
    }).then(function () {
      window.xenoInitViewer(window.data);
    });
  }
})();
