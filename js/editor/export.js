(function() {
  'use strict';
  var E = window.XenoEditor;
  var S = E.state;
  var D = E.dom;

  E.setupExport = function() {
    // ─── Publish to web ──────────────────────────────────
    var btnPublish = document.getElementById('btn-publish');
    if (btnPublish && window.XenoSupabase) {
      btnPublish.addEventListener('click', function() {
        if (!S.projectSlug) { alert('No project to publish.'); return; }

        // Expiry picker
        var expiry = prompt('How long should this tour stay online?\n\n1 = 1 day\n7 = 7 days\n0 or blank = forever', '0');
        if (expiry === null) return; // cancelled
        expiry = expiry.trim();
        var expiryValue = 'forever';
        if (expiry === '1') expiryValue = '1d';
        else if (expiry === '7') expiryValue = '7d';
        else if (expiry && expiry !== '0') expiryValue = 'forever';

        var pubBtn = this;
        var origText = pubBtn.innerHTML;
        pubBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Publishing...';
        pubBtn.disabled = true;

        window.XenoSupabase.exportProject(S.projectSlug).then(function(bundle) {
          return fetch('/api/publish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ project: bundle, expiry: expiryValue })
          }).then(function(r) {
            if (!r.ok) throw new Error('Publish failed');
            return r.json();
          });
        }).then(function(result) {
          var shareUrl = result.shareUrl || ('https://xeno.venusapp.in/t/' + result.slug);
          // Save view count to project settings
          if (result.views !== undefined) {
            if (!window.data.settings) window.data.settings = {};
            window.data.settings.views = result.views;
          }
          if (window.showShareModal) {
            window.showShareModal(result.slug, shareUrl);
          } else {
            prompt('Share this link:', shareUrl);
            if (navigator.clipboard) navigator.clipboard.writeText(shareUrl).catch(function() {});
          }
        }).catch(function(err) {
          var previewUrl = window.location.origin + '/preview.html?project=' + S.projectSlug;
          prompt('Publish API not available (local dev). Share this:', previewUrl);
          if (navigator.clipboard) {
            navigator.clipboard.writeText(previewUrl).then(function() {}).catch(function() {});
          }
        }).finally(function() {
          pubBtn.innerHTML = origText;
          pubBtn.disabled = false;
        });
      });
    }

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
        'css/editor/buttons.css',
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

      // Build media ID → original filename map from localStorage
      var mediaRecords = JSON.parse(localStorage.getItem('xeno_media') || '[]');
      var mediaMap = {};
      mediaRecords.forEach(function(r) { mediaMap[r.id] = r; });

      var usedNames = {};

      function uniqueName(name) {
        if (!usedNames[name]) { usedNames[name] = true; return name; }
        var base = name.replace(/\.[^.]+$/, '');
        var ext = name.indexOf('.') !== -1 ? name.slice(name.lastIndexOf('.')) : '';
        for (var i = 1; i < 100; i++) {
          var c = base + '_' + i + ext;
          if (!usedNames[c]) { usedNames[c] = true; return c; }
        }
        return name;
      }

      // Sync live editor state into window.data before export
      if (S.scenes && S.scenes.length) window.data.scenes = S.scenes.map(function(s) { return JSON.parse(JSON.stringify(s.data)); });
      var exportedData = JSON.parse(JSON.stringify(window.data));
      if (!exportedData.settings) exportedData.settings = {};
      exportedData.settings.layoutTheme = (window.data.settings && window.data.settings.layoutTheme) || 'hamburger';
      var mediaPromises = [];

      function extFromMime(mime) {
        var map = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp',
          'video/mp4': 'mp4', 'video/webm': 'webm', 'video/ogg': 'ogv' };
        return map[mime] || 'bin';
      }

      function getOriginalName(mediaId, fallback) {
        var rec = mediaMap[mediaId];
        return rec && rec.filename ? rec.filename : fallback;
      }

      function resolveUrl(url) {
        return url && url.indexOf('blob:') === 0
          ? Promise.resolve(url)
          : url && url.indexOf('media_') === 0 && window.XenoSupabase
            ? window.XenoSupabase.resolveMediaId(url).then(function(b) { return b || null; })
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
              var orig = src.indexOf('media_') === 0 ? getOriginalName(src, null) : null;
              var name = uniqueName(orig || ('hs_' + sceneId + '_' + idx + '.' + ext));
              var path = 'media/' + name;
              zip.file(path, blob);
              hs.content.src = path;
            });
          }).catch(function(err) {
            console.warn('Could not bundle hotspot media for scene ' + sceneId, err);
            hs.content.src = null;
          });
          mediaPromises.push(p);
        });
      }

      function bundleHotspotAudio(hotspots, field, sceneId) {
        (hotspots || []).forEach(function(hs, idx) {
          var src = hs[field];
          if (!src || (src.indexOf('blob:') !== 0 && src.indexOf('media_') !== 0)) return;
          var p = resolveUrl(src).then(function(fetchUrl) {
            return fetch(fetchUrl).then(function(res) {
              if (!res.ok) throw new Error('Failed to fetch audio');
              return res.blob();
            }).then(function(blob) {
              var ext = extFromMime(blob.type) || 'mp3';
              var orig = src.indexOf('media_') === 0 ? getOriginalName(src, null) : null;
              var name = uniqueName(orig || ('audio_' + sceneId + '_' + idx + '.' + ext));
              var path = 'media/' + name;
              zip.file(path, blob);
              hs[field] = path;
            });
          }).catch(function(err) {
            console.warn('Could not bundle audio for scene ' + sceneId, err);
            hs[field] = null;
          });
          mediaPromises.push(p);
        });
      }

      function bundleSceneMedia(sceneData) {
        if (!sceneData.mediaUrl) return;
        var origUrl = sceneData.mediaUrl;
        var p = resolveUrl(origUrl).then(function(fetchUrl) {
          if (!fetchUrl) throw new Error('No blob found for ' + sceneData.name);
          return fetch(fetchUrl).then(function(res) {
            if (!res.ok) throw new Error('Failed to fetch ' + sceneData.name);
            return res.blob();
          }).then(function(blob) {
            var ext = extFromMime(blob.type) || 'jpg';
            var mediaId = origUrl.indexOf('media_') === 0 ? origUrl : sceneData._mediaId;
            var orig = mediaId ? getOriginalName(mediaId, null) : null;
            var name = uniqueName(orig || ('scene_' + sceneData.id + '.' + ext));
            var path = 'media/' + name;
            zip.file(path, blob);
            sceneData.mediaUrl = path;
            if (sceneData.thumbnailUrl && (sceneData.thumbnailUrl.indexOf('blob:') === 0 || sceneData.thumbnailUrl === origUrl || sceneData.thumbnailUrl === mediaId)) {
              sceneData.thumbnailUrl = path;
            }
          });
        }).catch(function(err) {
          console.warn('Could not bundle media for scene ' + sceneData.name, err);
          sceneData.mediaUrl = null;
          sceneData.thumbnailUrl = null;
        });
        mediaPromises.push(p);
      }

      exportedData.scenes.forEach(function(sceneData) {
        bundleSceneMedia(sceneData);
        bundleHotspotMedia(sceneData.hotspots, sceneData.id);
        bundleHotspotMedia(sceneData.linkHotspots, sceneData.id);
        bundleHotspotMedia(sceneData.infoHotspots, sceneData.id);
        bundleHotspotMedia(sceneData.mediaHotspots, sceneData.id);
        bundleHotspotAudio(sceneData.hotspots, 'narratorAudio', sceneData.id);
        bundleHotspotAudio(sceneData.hotspots, 'ambientAudio', sceneData.id);
      });

      var readme =
        '------------THANK YOU FOR CHOOSING-------------\n' +
        '----------------XENO 360\u00B0 TOUR----------------\n' +
        '\n' +
        'Thank you for choosing Xeno 360\u00B0 Tour.\n' +
        '\n' +
        'This package contains your exported virtual tour and everything required\n' +
        'to run it locally on your device.\n' +
        '\n' +
        '--------------VIEWING YOUR TOUR---------------\n' +
        '\n' +
        'Windows\n' +
        '\u2022 Double-click run.bat\n' +
        '\n' +
        'macOS / Linux\n' +
        '\u2022 Double-click run.sh\n' +
        '\u2022 Or run: bash run.sh\n' +
        '\n' +
        'The launch script will automatically:\n' +
        '\n' +
        '\u2022 Detect Python or Node.js on your system\n' +
        '\u2022 Start a local web server\n' +
        '\u2022 Open the tour in your default browser\n' +
        '\n' +
        'If neither Python nor Node.js is installed, you\u2019ll be guided through\n' +
        'the installation process with minimal setup required.\n' +
        '\n' +
        '-----------------LOCAL ACCESS-----------------\n' +
        '\n' +
        'Once started, your tour will be available at:\n' +
        '\n' +
        'http://localhost:8080\n' +
        '\n' +
        'Note: The exported tour runs independently from the Xeno editor\n' +
        'environment.\n' +
        '\n' +
        '----------------MANUAL STARTUP----------------\n' +
        '\n' +
        'If the launcher script does not work, open a terminal in this folder\n' +
        'and run:\n' +
        '\n' +
        'python -m http.server 8080\n' +
        '\n' +
        'Then open:\n' +
        '\n' +
        'http://localhost:8080\n' +
        '\n' +
        '---\n' +
        '\n' +
        'Made with \u2665 by Veil\n';
      zip.file('README.txt', readme);

      var batContent =
        '@echo off\r\n' +
        'setlocal enabledelayedexpansion\r\n' +
        'title Xeno Tour\r\n' +
        'set PORT=8080\r\n' +
        '\r\n' +
        'python --version >nul 2>&1\r\n' +
        'if !errorlevel! equ 0 (\r\n' +
        '  start http://localhost:%PORT%\r\n' +
        '  python -m http.server %PORT%\r\n' +
        '  exit /b\r\n' +
        ')\r\n' +
        '\r\n' +
        'node --version >nul 2>&1\r\n' +
        'if !errorlevel! equ 0 (\r\n' +
        '  start http://localhost:%PORT%\r\n' +
        '  npx serve -p %PORT% -s\r\n' +
        '  exit /b\r\n' +
        ')\r\n' +
        '\r\n' +
        'powershell -NoProfile -ExecutionPolicy Bypass -Command "& {$w=New-Object -ComObject WScript.Shell;$ask=$w.Popup(\'Xeno Tour needs Python or Node.js.\'+[char]10+\'Which one do you want to install?\',0,\'Xeno Tour\',3+32);if($ask -eq 6){$w.Popup(\'Downloading Python...\',1,\'Xeno Tour\',0+64);try{$wc=New-Object System.Net.WebClient;$py=Join-Path $env:TEMP \'python-installer.exe\';$wc.DownloadFile(\'https://www.python.org/ftp/python/3.13.3/python-3.13.3-amd64.exe\',$py);Start-Process -Wait -FilePath $py -ArgumentList \'/quiet InstallAllUsers=1 PrependPath=1\';Start-Process cmd -ArgumentList \'/c start http://localhost:%PORT% && python -m http.server %PORT%\';$w.Popup(\'Python installed! Tour starting in new window.\',0,\'Xeno Tour\',0+64)}catch{$w.Popup(\'Failed to install Python.\',0,\'Xeno Tour\',0+16)}}elseif($ask -eq 7){$w.Popup(\'Downloading Node.js...\',1,\'Xeno Tour\',0+64);try{$wc=New-Object System.Net.WebClient;$nj=Join-Path $env:TEMP \'node-installer.msi\';$wc.DownloadFile(\'https://nodejs.org/dist/v22.14.0/node-v22.14.0-x64.msi\',$nj);Start-Process -Wait -FilePath $nj -ArgumentList \'/quiet\';Start-Process cmd -ArgumentList \'/c start http://localhost:%PORT% && npx serve -p %PORT% -s\';$w.Popup(\'Node.js installed! Tour starting in new window.\',0,\'Xeno Tour\',0+64)}catch{$w.Popup(\'Failed to install Node.js.\',0,\'Xeno Tour\',0+16)}}else{$w.Popup(\'Please install Python or Node.js manually and run this script again.\',0,\'Xeno Tour\',0+48)}}"\r\n';
      zip.file('run.bat', batContent);

      var shContent =
        '#!/bin/bash\n' +
        'PORT=8080\n' +
        '\n' +
        'open_url() {\n' +
        '  xdg-open "$1" 2>/dev/null || open "$1" 2>/dev/null || true\n' +
        '}\n' +
        '\n' +
        '# --- Check for Python ---\n' +
        'if command -v python3 &>/dev/null; then\n' +
        '  open_url "http://localhost:$PORT"\n' +
        '  python3 -m http.server $PORT\n' +
        '  exit 0\n' +
        'fi\n' +
        'if command -v python &>/dev/null; then\n' +
        '  open_url "http://localhost:$PORT"\n' +
        '  python -m http.server $PORT\n' +
        '  exit 0\n' +
        'fi\n' +
        '\n' +
        '# --- Check for Node.js ---\n' +
        'if command -v node &>/dev/null; then\n' +
        '  open_url "http://localhost:$PORT"\n' +
        '  npx serve -p $PORT -s\n' +
        '  exit 0\n' +
        'fi\n' +
        '\n' +
        '# --- macOS GUI ---\n' +
        'if [ "$(uname)" = "Darwin" ]; then\n' +
        '  ans=$(osascript -e ' + "'" + 'button returned of (display dialog "Xeno Tour needs Python or Node.js." + (ASCII character 10) + "Select one to download and install:" buttons {"Cancel","Node.js","Python"} default button "Python" with icon note)' + "'" + ' 2>/dev/null)\n' +
        '  if [ "$ans" = "Python" ]; then\n' +
        '    if command -v brew &>/dev/null; then\n' +
        '      brew install python && open_url "http://localhost:$PORT" && python3 -m http.server $PORT && exit 0\n' +
        '    fi\n' +
        '    open_url "https://www.python.org/downloads/"\n' +
        '    osascript -e ' + "'" + 'display dialog "Python website opened. Download and install Python, then run this script again." buttons {"OK"} default button "OK" with icon note' + "'" + ' 2>/dev/null\n' +
        '    exit 1\n' +
        '  elif [ "$ans" = "Node.js" ]; then\n' +
        '    if command -v brew &>/dev/null; then\n' +
        '      brew install node && open_url "http://localhost:$PORT" && npx serve -p $PORT -s && exit 0\n' +
        '    fi\n' +
        '    open_url "https://nodejs.org/"\n' +
        '    osascript -e ' + "'" + 'display dialog "Node.js website opened. Download and install Node.js, then run this script again." buttons {"OK"} default button "OK" with icon note' + "'" + ' 2>/dev/null\n' +
        '    exit 1\n' +
        '  else\n' +
        '    osascript -e ' + "'" + 'display dialog "Please install Python or Node.js to run this tour." buttons {"OK"} default button "OK" with icon stop' + "'" + ' 2>/dev/null\n' +
        '    exit 1\n' +
        '  fi\n' +
        'fi\n' +
        '\n' +
        '# --- Linux GUI (zenity) ---\n' +
        'if command -v zenity &>/dev/null; then\n' +
        '  ans=$(zenity --list --title="Xeno Tour" --text="Select what to install:" --radiolist --column="" --column="Option" TRUE "Python" FALSE "Node.js" --height=200 2>/dev/null)\n' +
        '  if [ "$ans" = "Python" ]; then\n' +
        '    if command -v apt &>/dev/null; then\n' +
        '      sudo apt update -qq && sudo apt install -y -qq python3 && open_url "http://localhost:$PORT" && python3 -m http.server $PORT && exit 0\n' +
        '    elif command -v dnf &>/dev/null; then\n' +
        '      sudo dnf install -y -q python3 && open_url "http://localhost:$PORT" && python3 -m http.server $PORT && exit 0\n' +
        '    else\n' +
        '      zenity --error --text="No supported package manager found.\\nInstall Python from python.org" 2>/dev/null\n' +
        '      exit 1\n' +
        '    fi\n' +
        '  elif [ "$ans" = "Node.js" ]; then\n' +
        '    if command -v apt &>/dev/null; then\n' +
        '      sudo apt update -qq && sudo apt install -y -qq nodejs npm && open_url "http://localhost:$PORT" && npx serve -p $PORT -s && exit 0\n' +
        '    elif command -v dnf &>/dev/null; then\n' +
        '      sudo dnf install -y -q nodejs && open_url "http://localhost:$PORT" && npx serve -p $PORT -s && exit 0\n' +
        '    else\n' +
        '      zenity --error --text="No supported package manager found.\\nInstall Node.js from nodejs.org" 2>/dev/null\n' +
        '      exit 1\n' +
        '    fi\n' +
        '  else\n' +
        '    zenity --info --text="Please install Python or Node.js to run this tour." 2>/dev/null\n' +
        '    exit 1\n' +
        '  fi\n' +
        'fi\n' +
        '\n' +
        '# --- Terminal fallback ---\n' +
        'echo ""\n' +
        'echo "  Xeno Tour"\n' +
        'echo "  ----------"\n' +
        'echo "  Python or Node.js is required to run the tour."\n' +
        'echo "  Install one and run this script again."\n' +
        'echo "  https://www.python.org/downloads/"\n' +
        'echo "  https://nodejs.org/"\n' +
        'echo ""\n';
      zip.file('run.sh', shContent);

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
          setTimeout(function() { URL.revokeObjectURL(url); }, 10000);
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
