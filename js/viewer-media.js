window.XenoViewerMedia = (function() {
  'use strict';

  function isMediaId(v) {
    return typeof v === 'string' && v.indexOf('media_') === 0;
  }

  function resolveMediaIdOrUrl(v) {
    if (isMediaId(v)) {
      if (window.XenoSupabase)
        return window.XenoSupabase.resolveMediaId(v).then(function (b) { return b || null; });
      return Promise.resolve(null);
    }
    return Promise.resolve(v);
  }

  function resolveAllMedia(tourData) {
    if (!tourData || !tourData.scenes) return Promise.resolve(tourData);
    var promises = [];
    tourData.scenes.forEach(function (scene) {
      if (isMediaId(scene.mediaUrl)) {
        promises.push(resolveMediaIdOrUrl(scene.mediaUrl).then(function (blobUrl) {
          if (blobUrl) scene.mediaUrl = blobUrl;
        }));
      }
      if (isMediaId(scene.thumbnailUrl)) {
        promises.push(resolveMediaIdOrUrl(scene.thumbnailUrl).then(function (blobUrl) {
          if (blobUrl) scene.thumbnailUrl = blobUrl;
        }));
      }
      var allHotspots = (scene.hotspots || []).concat(scene.linkHotspots || [], scene.infoHotspots || [], scene.mediaHotspots || []);
      allHotspots.forEach(function (hs) {
        var src = hs.content && hs.content.src;
        if (isMediaId(src)) {
          promises.push(resolveMediaIdOrUrl(src).then(function (blobUrl) {
            if (blobUrl) hs.content.src = blobUrl;
          }));
        }
        ['narratorAudio', 'ambientAudio'].forEach(function (field) {
          if (isMediaId(hs[field])) {
            promises.push(resolveMediaIdOrUrl(hs[field]).then(function (blobUrl) {
              if (blobUrl) hs[field] = blobUrl;
            }));
          }
        });
      });
    });
    return Promise.all(promises).then(function () {
      tourData.scenes.forEach(function (s) {
        if (isMediaId(s.thumbnailUrl) && !isMediaId(s.mediaUrl)) {
          s.thumbnailUrl = s.mediaUrl;
        }
      });
      return tourData;
    });
  }

  function preloadSceneImages(tourData) {
    if (!tourData || !tourData.scenes) return Promise.resolve(tourData);
    return new Promise(function (resolve) {
      var first = tourData.scenes[0];
      if (first && first.mediaUrl && first.type !== 'video') {
        var img = new Image();
        img.onload = img.onerror = function () { resolve(tourData); };
        img.src = first.mediaUrl;
      } else {
        resolve(tourData);
      }
    });
  }

  return {
    isMediaId: isMediaId,
    resolveMediaIdOrUrl: resolveMediaIdOrUrl,
    resolveAllMedia: resolveAllMedia,
    preloadSceneImages: preloadSceneImages
  };
})();
