(function() {
  'use strict';
  var themeToggle = document.getElementById('theme-toggle');
  var sunIcon = document.getElementById('sun-icon');
  var moonIcon = document.getElementById('moon-icon');
  var transitionOverlay = document.getElementById('xeno-page-transition');

  var currentTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);
  document.body.setAttribute('data-theme', currentTheme);
  updateIcons(currentTheme);

  themeToggle.addEventListener('click', function() {
    var theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    updateIcons(theme);
  });

  function updateIcons(theme) {
    sunIcon.style.display = theme === 'dark' ? 'none' : 'block';
    moonIcon.style.display = theme === 'dark' ? 'block' : 'none';
  }

  function navigateWithTransition(url) {
    transitionOverlay.style.opacity = '1';
    transitionOverlay.style.pointerEvents = 'auto';
    setTimeout(function() {
      window.location.href = url;
    }, 200);
  }

  // Attach click handlers to all internal links
  document.addEventListener('click', function(e) {
    var link = e.target.closest('a');
    if (link && link.href && !link.target) {
      var url = new URL(link.href);
      if (url.origin === window.location.origin && !url.pathname.includes('marzipano.net')) {
        e.preventDefault();
        navigateWithTransition(link.href);
      }
    }
  });

  // Preview tour picker
  var cardPreview = document.getElementById('card-preview');
  var pickerOverlay = document.getElementById('tour-picker-overlay');
  var pickerList = document.getElementById('tour-picker-list');
  var pickerEmpty = document.getElementById('tour-picker-empty');
  var pickerClose = document.getElementById('tour-picker-close');

  function getTours() {
    var tours = [];
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (key.indexOf('xeno_tour_') === 0) {
        try {
          var raw = localStorage.getItem(key);
          var parsed = JSON.parse(raw);
          var data = parsed.data || parsed;
          var name = (data.settings && (data.settings.name || data.settings.title)) || key.replace('xeno_tour_', '');
          var slug = key.replace('xeno_tour_', '');
          var scenes = (data.scenes && data.scenes.length) || 0;
          tours.push({ slug: slug, name: name, scenes: scenes });
        } catch(e) {}
      }
    }
    tours.sort(function(a, b) { return b.slug.localeCompare(a.slug); });
    return tours;
  }

  if (cardPreview) {
    cardPreview.addEventListener('click', function() {
      var tours = getTours();
      pickerList.innerHTML = '';
      if (tours.length === 0) {
        pickerList.style.display = 'none';
        pickerEmpty.style.display = '';
      } else {
        pickerList.style.display = '';
        pickerEmpty.style.display = 'none';
        tours.forEach(function(t) {
          var el = document.createElement('a');
          el.href = 'preview.html?project=' + encodeURIComponent(t.slug);
          el.target = '_blank';
          el.style.cssText = 'display:block;padding:12px 16px;background:var(--bg-raised);border:2px solid var(--border);color:var(--text-primary);text-decoration:none;transition:all 0.15s;font-family:inherit;';
          el.innerHTML = '<strong>' + t.name + '</strong><br><span style="font-size:var(--type-xs);color:var(--text-muted);">' + t.scenes + ' scene' + (t.scenes !== 1 ? 's' : '') + '</span>';
          el.addEventListener('mouseenter', function() { this.style.borderColor = 'var(--accent)'; });
          el.addEventListener('mouseleave', function() { this.style.borderColor = 'var(--border)'; });
          pickerList.appendChild(el);
        });
      }
      pickerOverlay.style.display = 'flex';
    });
  }

  if (pickerClose) {
    pickerClose.addEventListener('click', function() { pickerOverlay.style.display = 'none'; });
  }
  pickerOverlay.addEventListener('click', function(e) {
    if (e.target === pickerOverlay) pickerOverlay.style.display = 'none';
  });

  // Donate modal
  var donateBtn = document.getElementById('donate-btn');
  var donateOverlay = document.getElementById('donate-overlay');
  var donateClose = document.getElementById('donate-close');

  if (donateBtn && donateOverlay) {
    donateBtn.addEventListener('click', function() {
      donateOverlay.style.display = 'flex';
    });
    if (donateClose) {
      donateClose.addEventListener('click', function() { donateOverlay.style.display = 'none'; });
    }
    donateOverlay.addEventListener('click', function(e) {
      if (e.target === donateOverlay) donateOverlay.style.display = 'none';
    });
    var donateCopy = document.getElementById('donate-copy');
    if (donateCopy) {
      donateCopy.addEventListener('click', function() {
        navigator.clipboard.writeText('rushikeshingale2001@okicici').then(function() {
          donateCopy.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square" stroke-linejoin="miter"><polyline points="20 6 9 17 4 12"/></svg>';
          setTimeout(function() {
            donateCopy.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square" stroke-linejoin="miter"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
          }, 1500);
        }).catch(function() {});
      });
    }
  }
})();
