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
        'css/tokens.css', 'css/viewer.css', 'css/hotspots.css', 'css/minimap.css', 'css/hint.css',
        'js/vendor/screenfull.js', 'js/vendor/webvr-polyfill.js', 'js/core/xeno.js',
        'js/core/transitions.js', 'js/core/VideoAsset.js', 'js/core/DeviceOrientation.js',
        'js/core/colorEffects.js', 'js/hotspots/HotspotFactory.js', 'js/ui/Minimap.js',
        'js/ui/SceneList.js', 'js/ui/Supabase.js', 'js/viewer.js', 'config.example.js'
      ];

      var imagesToBundle = [
        'img/link.png', 'img/photo.png', 'img/info.png', 'img/hotspot.png', 'img/logo.ico', 'img/tooltip.svg'
      ];

      var exportedData = JSON.parse(JSON.stringify(window.data));
      var mediaPromises = [];

      exportedData.scenes.forEach(function(sceneData) {
        var originalUrl = sceneData.mediaUrl;
        if (originalUrl) {
          var ext = 'jpg';
          if (originalUrl.indexOf('.png') !== -1) ext = 'png';
          else if (originalUrl.indexOf('.gif') !== -1) ext = 'gif';
          var filename = 'scene_' + sceneData.id + '.' + ext;
          var relativePath = 'media/' + filename;
          var p = fetch(originalUrl)
            .then(function(res) { if (!res.ok) throw new Error('Failed to fetch ' + sceneData.name); return res.blob(); })
            .then(function(blob) { zip.file(relativePath, blob); sceneData.mediaUrl = relativePath; if (sceneData.thumbnailUrl) sceneData.thumbnailUrl = relativePath; })
            .catch(function(err) { console.warn('Could not bundle media for scene ' + sceneData.name, err); });
          mediaPromises.push(p);
        }
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
          .then(function(content) { zip.file(path === 'config.example.js' ? 'config.js' : path, content); });
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
