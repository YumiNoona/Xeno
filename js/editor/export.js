(function() {
  'use strict';
  var E = window.XenoEditor;
  var S = E.state;
  var D = E.dom;

  E.setupExport = function() {
    var btnExport = document.getElementById('btn-export');
    if (!btnExport) return;

    btnExport.addEventListener('click', function() {
      if (!window.JSZip) { alert('JSZip library is not loaded.'); return; }

      var exportBtn = this;
      var originalText = exportBtn.innerHTML;
      exportBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Exporting...';
      exportBtn.disabled = true;

      var zip = new window.JSZip();

      var filesToBundle = [
        'css/tokens.css', 'css/viewer/layout.css', 'css/viewer/components.css',
        'css/hotspots/types.css', 'css/hotspots/animations.css', 'css/hotspots/dots.css',
        'css/lib/minimap.css', 'css/lib/hint.css',
        'js/lib/screenfull.js', 'js/lib/webvr-polyfill.js', 'js/engine/xeno.js',
        'js/engine/transitions.js', 'js/engine/VideoAsset.js', 'js/engine/DeviceOrientation.js',
        'js/engine/colorEffects.js', 'js/hotspots/HotspotFactory.js',
        'js/hotspots/Builders-Nav.js', 'js/hotspots/Builders-Content.js',
        'js/ui/Minimap.js', 'js/ui/SceneList.js', 'js/ui/Supabase.js', 'js/vr/XenoVR.js',
        'js/viewer.js'
      ];

      var imagesToBundle = [

        'public/logo.ico', 'public/logo 16x16.png', 'public/logo 32x32.png'
      ];

      // Sync live editor state into window.data before export
      if (S.scenes && S.scenes.length) window.data.scenes = S.scenes.map(function(s) { return JSON.parse(JSON.stringify(s.data)); });
      var exportedData = JSON.parse(JSON.stringify(window.data));
      var mediaPromises = [];

      function extFromMime(mime) {
        var map = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp',
          'video/mp4': 'mp4', 'video/webm': 'webm', 'video/ogg': 'ogv' };
        return map[mime] || 'bin';
      }

      function resolveUrl(url) {
        return url && url.indexOf('blob:') === 0
          ? Promise.resolve(url)
          : url && url.indexOf('media_') === 0 && window.XenoSupabase
            ? window.XenoSupabase.resolveMediaId(url).then(function(b) { return b || url; })
            : Promise.resolve(url);
      }

      function bundleHotspotMedia(hotspots, sceneId) {
        (hotspots || []).forEach(function(hs, idx) {
          var src = hs.content && hs.content.src;
          if (!src || (src.indexOf('blob:') !== 0 && src.indexOf('media_') !== 0)) return;
          var p = resolveUrl(src).then(function(fetchUrl) {
            return fetch(fetchUrl).then(function(res) {
              if (!res.ok) throw new Error('Failed to fetch hotspot media');
              return res.blob();
            }).then(function(blob) {
              var ext = extFromMime(blob.type) || 'bin';
              var path = 'media/hs_' + sceneId + '_' + idx + '.' + ext;
              zip.file(path, blob);
              hs.content.src = path;
            });
          }).catch(function(err) {
            console.warn('Could not bundle hotspot media for scene ' + sceneId, err);
          });
          mediaPromises.push(p);
        });
      }

      function bundleSceneMedia(sceneData) {
        if (!sceneData.mediaUrl) return;
        var origUrl = sceneData.mediaUrl;
        var p = resolveUrl(origUrl).then(function(fetchUrl) {
          return fetch(fetchUrl).then(function(res) {
            if (!res.ok) throw new Error('Failed to fetch ' + sceneData.name);
            return res.blob();
          }).then(function(blob) {
            var ext = extFromMime(blob.type) || 'jpg';
            var relativePath = 'media/scene_' + sceneData.id + '.' + ext;
            zip.file(relativePath, blob);
            sceneData.mediaUrl = relativePath;
            if (sceneData.thumbnailUrl && (sceneData.thumbnailUrl.indexOf('blob:') === 0 || sceneData.thumbnailUrl === origUrl)) {
              sceneData.thumbnailUrl = relativePath;
            }
          });
        }).catch(function(err) {
          console.warn('Could not bundle media for scene ' + sceneData.name, err);
        });
        mediaPromises.push(p);
      }

      exportedData.scenes.forEach(function(sceneData) {
        bundleSceneMedia(sceneData);
        bundleHotspotMedia(sceneData.hotspots, sceneData.id);
        bundleHotspotMedia(sceneData.linkHotspots, sceneData.id);
        bundleHotspotMedia(sceneData.infoHotspots, sceneData.id);
        bundleHotspotMedia(sceneData.mediaHotspots, sceneData.id);
      });

      var readme =
        'Xeno 360\u00B0 Tour Export\n' +
        '=====================\n\n' +
        'This tour was exported from Xeno 360\u00B0 Tour Platform.\n\n' +
        'Running the Tour Locally:\n' +
        '-------------------------\n' +
        'For security reasons, modern web browsers restrict local file access (CORS policies)\n' +
        'when opening files directly using the file:// protocol (e.g. by double-clicking index.html).\n\n' +
        'To view this tour locally, you must run it through a local HTTP server:\n' +
        '- If you have Node.js installed, run:\n' +
        '    npx serve\n' +
        '  or\n' +
        '    npm install -g http-server && http-server\n\n' +
        '- If you have Python installed, run:\n' +
        '    python -m http.server 8000\n' +
        '  and open http://localhost:8000 in your browser.\n\n' +
        '- Or deploy it directly to a static hosting service like Vercel, Netlify, or GitHub Pages.\n';
      zip.file('README.txt', readme);

      var fetchPromises = filesToBundle.map(function(path) {
        return fetch(path)
          .then(function(res) { if (!res.ok) throw new Error('Failed to fetch ' + path); return res.text(); })
          .then(function(content) { zip.file(path, content); });
      });

      var imagePromises = imagesToBundle.map(function(path) {
        return fetch(path)
          .then(function(res) { if (!res.ok) throw new Error('Failed to fetch ' + path); return res.blob(); })
          .then(function(blob) { zip.file(path, blob); });
      });

      var previewPromise = fetch('preview.html')
        .then(function(res) { if (!res.ok) throw new Error('Failed to fetch preview.html'); return res.text(); })
        .then(function(html) { zip.file('index.html', html.replace('<head>', '<head>\n  <script>window.isExported = true;</script>')); });

      var all = fetchPromises.concat(imagePromises).concat(mediaPromises);
      all.push(previewPromise);

      Promise.all(all)
        .then(function() {
          zip.file('data.js', 'var data = ' + JSON.stringify(exportedData, null, 2) + ';\n');
          return zip.generateAsync({ type: 'blob' });
        })
        .then(function(blob) {
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = url;
          a.download = (S.projectSlug || 'xeno-tour') + '.zip';
          document.body.appendChild(a); a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          exportBtn.innerHTML = originalText;
          exportBtn.disabled = false;
        })
        .catch(function(err) {
          alert('ZIP export failed: ' + err.message);
          exportBtn.innerHTML = originalText;
          exportBtn.disabled = false;
        });
    });
  };
})();
