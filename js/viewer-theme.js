window.XenoViewerTheme = (function() {
  'use strict';

  function inject(theme, data) {
    if (!document.getElementById('xeno-theme-css')) {
      var ts = document.createElement('style');
      ts.id = 'xeno-theme-css';
      ts.textContent = [
        'body[data-layout-theme="gallery"] #titleBar{display:none}',
        'body[data-layout-theme="gallery"] #sceneList{position:fixed;top:auto;bottom:40px;left:50%;transform:translateX(-50%) translateY(20px);width:fit-content;max-width:560px;height:auto!important;padding:0;display:flex;flex-direction:row;overflow:hidden!important;align-items:flex-end;justify-content:center;opacity:0;pointer-events:none;transition:opacity 0.4s ease,transform 0.45s cubic-bezier(0.16,1,0.3,1);background:none;border:none;box-shadow:none;backdrop-filter:none;-webkit-backdrop-filter:none}',
        'body[data-layout-theme="gallery"] #sceneList.enabled{opacity:1;pointer-events:auto;transform:translateX(-50%) translateY(0)}',
        'body[data-layout-theme="gallery"] #sceneList .scenes{display:flex;flex-direction:row;gap:0;align-items:flex-end;overflow-x:auto;overflow-y:hidden;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.15) transparent;padding:20px 10px 16px}',
        'body[data-layout-theme="gallery"] #sceneList .scenes::-webkit-scrollbar:vertical{display:none;width:0}',
        'body[data-layout-theme="gallery"] #sceneList .scenes::-webkit-scrollbar{height:3px;background:transparent}',
        'body[data-layout-theme="gallery"] #sceneList .scenes::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15);border-radius:2px}',
        'body[data-layout-theme="gallery"] #sceneList .scene{flex-direction:column;gap:0;padding:0;min-width:90px;max-width:110px;flex-shrink:0;border:none;border-radius:10px;background:none;box-shadow:0 4px 16px rgba(0,0,0,0.4),0 1px 3px rgba(0,0,0,0.5);transition:all 0.3s cubic-bezier(0.34,1.56,0.64,1);margin:0 -4px;position:relative;transform-origin:bottom center;backface-visibility:hidden;-webkit-backface-visibility:hidden}',
        'body[data-layout-theme="gallery"] #sceneList .scene:hover{transform:rotate(0deg) translateY(-12px) scale(1.08)!important;z-index:10!important;opacity:1!important;box-shadow:0 16px 40px rgba(0,0,0,0.6),0 0 20px rgba(225,29,72,0.15)}',
        'body[data-layout-theme="gallery"] #sceneList .scene.current{box-shadow:0 8px 24px rgba(225,29,72,0.3),0 4px 8px rgba(0,0,0,0.5),0 0 0 3px var(--accent);transform:rotate(0deg) translateY(-8px) scale(1.06)!important;z-index:8!important;opacity:1!important}',
        'body[data-layout-theme="gallery"] #sceneList .scene .scene-thumb{width:90px;height:64px;border-radius:10px;object-fit:cover;border:none;box-shadow:0 2px 6px rgba(0,0,0,0.3)}',
        'body[data-layout-theme="gallery"] #sceneList .scene .scene-name{display:none}',
        'body[data-layout-theme="gallery"] #sceneList .scene:nth-child(1){transform:rotate(-5deg) translateY(10px);z-index:1}',
        'body[data-layout-theme="gallery"] #sceneList .scene:nth-child(2){transform:rotate(-3deg) translateY(6px);z-index:2}',
        'body[data-layout-theme="gallery"] #sceneList .scene:nth-child(3){transform:rotate(-1deg) translateY(2px);z-index:3}',
        'body[data-layout-theme="gallery"] #sceneList .scene:nth-child(4){transform:rotate(1deg) translateY(2px);z-index:3}',
        'body[data-layout-theme="gallery"] #sceneList .scene:nth-child(5){transform:rotate(3deg) translateY(6px);z-index:2}',
        'body[data-layout-theme="gallery"] #sceneList .scene:nth-child(6){transform:rotate(5deg) translateY(10px);z-index:1}',
        'body[data-layout-theme="gallery"] #sceneList .scene:nth-child(n+7){transform:rotate(6deg) translateY(14px);z-index:0;opacity:0.5}',
        'body[data-layout-theme="gallery"] #controls .ctrl-btn{width:38px;height:38px;background:transparent;border:none}',
        'body[data-layout-theme="gallery"] #controls{bottom:20px;right:20px}',
        'body[data-layout-theme="float"] #titleBar{position:absolute;top:16px;left:16px;right:auto;width:auto;height:auto;padding:8px 16px;background:rgba(0,0,0,0.5);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);border:1px solid var(--border-glass);border-radius:9999px;box-shadow:0 4px 24px rgba(0,0,0,0.4)}',
        'body[data-layout-theme="float"] #titleBar .sceneName{font-size:var(--type-sm)}',
        'body[data-layout-theme="float"] #sceneList{position:fixed;width:max-content;max-width:min(85vw,1200px);height:auto;top:auto;bottom:20px;left:50%;transform:translate(-50%,30px);border-right:none;border-top:none;background:rgba(0,0,0,0.45);-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);border:1px solid var(--border-glass);border-radius:18px;box-shadow:0 8px 40px rgba(0,0,0,0.5);padding:8px 12px;display:flex;flex-direction:row;overflow-x:auto;overflow-y:hidden;white-space:nowrap;align-items:center;opacity:0;pointer-events:none;transition:opacity 0.35s,transform 0.35s cubic-bezier(0.16,1,0.3,1);scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.2) transparent}',
        'body[data-layout-theme="float"] #sceneList.enabled{opacity:1;pointer-events:auto;transform:translate(-50%,0)}',
        'body[data-layout-theme="float"] #sceneList::-webkit-scrollbar:horizontal{height:4px;background:transparent}',
        'body[data-layout-theme="float"] #sceneList::-webkit-scrollbar-track:horizontal{background:transparent}',
        'body[data-layout-theme="float"] #sceneList::-webkit-scrollbar-thumb:horizontal{background:rgba(255,255,255,0.2);border-radius:0;border:none}',
        'body[data-layout-theme="float"] #sceneList .scenes{display:flex;flex-direction:row;gap:8px}',
        'body[data-layout-theme="float"] #sceneList .scene{flex-direction:column;gap:5px;padding:8px 12px;min-width:90px;border-left:none;flex-shrink:0;border-radius:10px;align-items:center}',
        'body[data-layout-theme="float"] #sceneList .scene.current{background:rgba(225,29,72,0.2);border:1px solid rgba(225,29,72,0.35)}',
        'body[data-layout-theme="float"] #sceneList .scene .scene-thumb{width:64px;height:64px;border-radius:8px;border:1px solid rgba(255,255,255,0.08);flex-shrink:0}',
        'body[data-layout-theme="float"] #sceneList .scene .scene-name{font-size:var(--type-xs);text-align:center;max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text-primary)}',
        'body[data-layout-theme="float"] #controls .ctrl-btn{width:42px;height:42px;background:transparent;border:none;box-shadow:none}',
        'body[data-layout-theme="float"] #controls .ctrl-btn svg{width:18px;height:18px}',
        'body[data-layout-theme="float"] #controls{position:fixed;bottom:80px;right:20px;flex-direction:column}',
        'body[data-layout-theme="hamburger"] #titleBar{display:none}',
        'body[data-layout-theme="hamburger"] #sceneList{position:fixed;width:auto;height:auto;max-height:70%;top:50%;bottom:auto;left:0;padding:16px 10px;transform:translateX(-100%) translateY(-50%);border:none;flex-direction:column;display:flex;gap:14px;overflow-y:auto;overflow-x:hidden;background:none;backdrop-filter:none;-webkit-backdrop-filter:none;border-radius:0;box-shadow:none;transition:transform 0.3s cubic-bezier(0.16,1,0.3,1)}',
        'body[data-layout-theme="hamburger"] #sceneList.enabled{transform:translateY(-50%);pointer-events:auto}',
        'body[data-layout-theme="hamburger"] #sceneList .scene{flex-direction:row;gap:8px;padding:0;min-width:0;border:none;border-radius:0;flex-shrink:0;background:none;transition:all 0.2s;align-items:center}',
        'body[data-layout-theme="hamburger"] #sceneList .scene:hover{background:none}',
        'body[data-layout-theme="hamburger"] #sceneList .scenes{display:flex;flex-direction:column;gap:16px}',
        'body[data-layout-theme="hamburger"] #sceneList .scene.current{background:none;border-color:transparent}',
        'body[data-layout-theme="hamburger"] #sceneList .scene.current .scene-thumb{box-shadow:0 0 0 3px var(--accent),0 0 12px var(--accent-glow)}',
        'body[data-layout-theme="hamburger"] #sceneList .scene .scene-thumb{width:64px;height:64px;border-radius:8px;object-fit:cover;border:none;flex-shrink:0;box-shadow:0 2px 6px rgba(0,0,0,0.3)}',
        'body[data-layout-theme="hamburger"] #sceneList .scene .scene-name{font-size:var(--type-sm);text-align:left;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;align-self:center}',
        'body[data-layout-theme="hamburger"] #controls{position:fixed;bottom:20px;right:20px;flex-direction:column}',
        'body[data-layout-theme="center-bar"] #titleBar{display:none}',
        'body[data-layout-theme="center-bar"] #sceneList{position:fixed;top:auto;bottom:90px;left:50%;width:fit-content;max-width:700px;height:auto;min-height:80px;padding:10px 14px;background:rgba(0,0,0,0.5);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);border:1px solid var(--border-glass);border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.5);flex-direction:row;display:flex;overflow:visible;white-space:nowrap;align-items:center;transform:translateX(-50%);opacity:0;pointer-events:none;transition:opacity 0.25s}',
        'body[data-layout-theme="center-bar"] #sceneList.enabled{opacity:1;pointer-events:auto;transform:translateX(-50%)}',
        'body[data-layout-theme="center-bar"] #sceneList .scenes{display:flex;flex-direction:row;gap:4px;max-width:100%;min-width:0;overflow-x:auto;overflow-y:hidden;pointer-events:auto}',
        'body[data-layout-theme="center-bar"] #sceneList .scene{flex-direction:column;gap:0;padding:4px 4px 8px;min-width:72px;border-left:none;border-radius:0;flex-shrink:0;background:none;border:none;transition:none}',
        'body[data-layout-theme="center-bar"] #sceneList .scene:hover{background:none;transform:none}',
        'body[data-layout-theme="center-bar"] #sceneList .scene.current{background:rgba(225,29,72,0.15);border-color:transparent}',
        'body[data-layout-theme="center-bar"] #sceneList .scene.current::after{content:\'\';display:block;width:32px;height:3px;background:var(--accent);border-radius:2px;margin:6px auto 0}',
        'body[data-layout-theme="center-bar"] #sceneList .scene.current .scene-thumb{box-shadow:0 0 0 3px rgba(255,255,255,0.9),0 0 16px var(--accent-glow)}',
        'body[data-layout-theme="center-bar"] #sceneList .scenes::-webkit-scrollbar:horizontal{height:4px;background:transparent}',
        'body[data-layout-theme="center-bar"] #sceneList .scenes::-webkit-scrollbar-track:horizontal{background:transparent}',
        'body[data-layout-theme="center-bar"] #sceneList .scenes::-webkit-scrollbar-thumb:horizontal{background:rgba(255,255,255,0.3);border-radius:4px}',
        'body[data-layout-theme="center-bar"] #sceneList .scenes{scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.3) transparent}',
        'body[data-layout-theme="center-bar"] #sceneList .scene .scene-thumb{width:100px;height:100px;border-radius:10px;object-fit:cover}',
        'body[data-layout-theme="center-bar"] #sceneList .scene .scene-name{display:none}',
        'body[data-layout-theme="center-bar"] #controls{position:fixed;width:max-content;bottom:24px;left:50%;transform:translateX(-50%);flex-direction:row;gap:8px;background:rgba(0,0,0,0.4);border:1px solid var(--border-glass);border-radius:12px;padding:6px 10px}',
        'body[data-layout-theme="center-bar"] #controls .ctrl-btn{width:36px;height:36px;background:transparent;border:none}',
        'body[data-layout-theme="center-bar"] #controls .ctrl-btn svg{width:16px;height:16px}'
      ].join('');
      document.head.appendChild(ts);
    }
    if (theme !== 'hamburger') {
      data.settings.sceneListStyle = 'bottom-strip';
    }
  }

  function initDragScroll() {
    var _prevObserver = null;
    var _dragWindowListeners = null;

    function cleanupDragListeners() {
      if (_dragWindowListeners) {
        window.removeEventListener('mouseup', _dragWindowListeners.mouseup);
        window.removeEventListener('mousemove', _dragWindowListeners.mousemove);
        _dragWindowListeners = null;
      }
    }

    function initDragScrollForEl(el) {
      if (!el || el._dragScrollInit) return;
      el._dragScrollInit = true;
      cleanupDragListeners();

      var isDown  = false;
      var startX  = 0;
      var scrollL = 0;
      var moved   = false;
      var THRESHOLD = 5;

      function onMouseup() {
        if (!isDown) return;
        isDown = false;
        el.style.cursor = '';
        el.style.userSelect = '';
      }

      function onMousemove(e) {
        if (!isDown) return;
        var x    = e.pageX - el.offsetLeft;
        var walk = x - startX;
        if (Math.abs(walk) > THRESHOLD) {
          moved = true;
          e.preventDefault();
          el.scrollLeft = scrollL - walk;
        }
      }

      _dragWindowListeners = { mouseup: onMouseup, mousemove: onMousemove };
      window.addEventListener('mouseup', onMouseup);
      window.addEventListener('mousemove', onMousemove);

      el.addEventListener('mousedown', function(e) {
        if (e.button !== 0) return;
        isDown  = true;
        moved   = false;
        startX  = e.pageX - el.offsetLeft;
        scrollL = el.scrollLeft;
        el.style.cursor = 'grabbing';
        el.style.userSelect = 'none';
      });

      el.addEventListener('click', function(e) {
        if (moved) {
          e.stopPropagation();
          e.preventDefault();
          moved = false;
        }
      }, true);

      var touchStartX  = 0;
      var touchScrollL = 0;
      var touchMoved   = false;

      el.addEventListener('touchstart', function(e) {
        touchStartX  = e.touches[0].pageX;
        touchScrollL = el.scrollLeft;
        touchMoved   = false;
      }, { passive: true });

      el.addEventListener('touchmove', function(e) {
        var dx = touchStartX - e.touches[0].pageX;
        if (Math.abs(dx) > THRESHOLD) {
          touchMoved  = true;
          el.scrollLeft = touchScrollL + dx;
          e.stopPropagation();
        }
      }, { passive: false });

      el.addEventListener('touchend', function(e) {
        if (touchMoved) e.stopPropagation();
      });

      el.addEventListener('wheel', function(e) {
        if (e.deltaY !== 0 && document.body.getAttribute('data-layout-theme') !== 'hamburger') {
          e.preventDefault();
          el.scrollLeft += e.deltaY * 1.5;
        }
      }, { passive: false });
    }

    function attachWhenReady() {
      var scenes = document.querySelector('#sceneList .scenes');
      if (scenes) initDragScrollForEl(scenes);
      var list = document.querySelector('#sceneList');
      if (list && list !== scenes) initDragScrollForEl(list);
    }

    attachWhenReady();

    if (_prevObserver) _prevObserver.disconnect();
    var themeObserver = new MutationObserver(function(mutations) {
      mutations.forEach(function(m) {
        if (m.attributeName === 'data-layout-theme') {
          setTimeout(attachWhenReady, 100);
        }
      });
    });
    themeObserver.observe(document.body, { attributes: true });
    _prevObserver = themeObserver;
  }

  return { inject: inject, initDragScroll: initDragScroll };
})();
