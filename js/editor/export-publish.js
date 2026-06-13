window.XenoEditorPublish = (function() {
  'use strict';

  function showPublishExpiry(callback, onCancel) {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:10000;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);';
    var modal = document.createElement('div');
    modal.style.cssText = 'background:var(--bg-panel);border:3px solid var(--border);max-width:440px;width:90%;padding:0;';
    modal.innerHTML =
      '<div style="display:flex;justify-content:center;align-items:center;padding:18px 22px;border-bottom:2px solid var(--border);position:relative;">' +
        '<h3 style="text-transform:uppercase;letter-spacing:0.06em;margin:0;color:var(--text-primary);font-size:var(--type-lg);">// PUBLISH_TOUR</h3>' +
      '</div>' +
      '<div style="padding:24px 22px;">' +
        '<p style="color:var(--text-muted);font-size:var(--type-sm);margin-bottom:20px;text-align:center;">$ expiry --set duration</p>' +
        '<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:24px;">' +
          '<label class="pub-radio" style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:var(--bg-raised);border:2px solid var(--border);cursor:pointer;transition:border-color 0.15s;">' +
            '<input type="radio" name="pub-expiry" value="1d" style="accent-color:var(--accent);width:16px;height:16px;">' +
            '<span style="color:var(--text-primary);font-size:var(--type-sm);">1 Day</span>' +
          '</label>' +
          '<label class="pub-radio" style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:var(--bg-raised);border:2px solid var(--border);cursor:pointer;transition:border-color 0.15s;">' +
            '<input type="radio" name="pub-expiry" value="7d" style="accent-color:var(--accent);width:16px;height:16px;">' +
            '<span style="color:var(--text-primary);font-size:var(--type-sm);">7 Days</span>' +
          '</label>' +
          '<label class="pub-radio" style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:var(--bg-raised);border:2px solid var(--border);cursor:pointer;transition:border-color 0.15s;">' +
            '<input type="radio" name="pub-expiry" value="forever" checked style="accent-color:var(--accent);width:16px;height:16px;">' +
            '<span style="color:var(--text-primary);font-size:var(--type-sm);">Forever</span>' +
          '</label>' +
        '</div>' +
        '<div style="display:flex;gap:8px;">' +
          '<button id="pub-cancel-btn" style="flex:1;display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:10px 18px;border:3px solid var(--border);background:transparent;color:var(--text-secondary);font-family:var(--font);font-size:var(--type-sm);font-weight:var(--weight-bold);cursor:pointer;text-transform:uppercase;letter-spacing:0.06em;">Cancel</button>' +
          '<button id="pub-go-btn" class="pub-publish-btn" style="flex:1;display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:10px 18px;border:3px solid var(--accent-hover);background:var(--accent);font-family:var(--font);font-size:var(--type-sm);font-weight:var(--weight-bold);cursor:pointer;text-transform:uppercase;letter-spacing:0.06em;">Publish</button>' +
        '</div>' +
      '</div>';
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    var pubGoBtn = modal.querySelector('#pub-go-btn');
    function setPubBtnColor() {
      var theme = document.documentElement.getAttribute('data-theme') || 'dark';
      pubGoBtn.style.color = theme === 'light' ? '#000' : '#fff';
    }
    setPubBtnColor();

    var labels = modal.querySelectorAll('.pub-radio');
    labels.forEach(function(l) {
      l.addEventListener('mouseenter', function() { this.style.borderColor = 'var(--accent)'; });
      l.addEventListener('mouseleave', function() {
        var radio = this.querySelector('input[type="radio"]');
        this.style.borderColor = radio && radio.checked ? 'var(--accent)' : 'var(--border)';
      });
      l.addEventListener('click', function() {
        var radio = this.querySelector('input[type="radio"]');
        radio.checked = true;
        labels.forEach(function(x) { x.style.borderColor = 'var(--border)'; });
        this.style.borderColor = 'var(--accent)';
      });
    });

    var defaultRadio = modal.querySelector('input[value="forever"]');
    if (defaultRadio && defaultRadio.parentElement) defaultRadio.parentElement.style.borderColor = 'var(--accent)';

    modal.querySelector('#pub-cancel-btn').addEventListener('click', function() {
      document.body.removeChild(overlay);
      if (onCancel) onCancel();
    });
    modal.querySelector('#pub-go-btn').addEventListener('click', function() {
      var checked = modal.querySelector('input[name="pub-expiry"]:checked');
      var value = checked ? checked.value : 'forever';
      document.body.removeChild(overlay);
      callback(value);
    });
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
        if (onCancel) onCancel();
      }
    });
  }

  return { showPublishExpiry: showPublishExpiry };
})();
