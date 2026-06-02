(function() {
  'use strict';
  var E = window.XenoEditor;
  var D = E.dom;

  E.initDashboard = function() {
    var searchInput = document.getElementById('project-search');
    var btnNewProject = document.getElementById('btn-new-project');
    var btnMediaDashboard = document.getElementById('btn-media-dashboard');

    if (searchInput) {
      searchInput.addEventListener('input', function() { loadDashboard(this.value); });
    }

    if (btnMediaDashboard) {
      btnMediaDashboard.addEventListener('click', function() {
        D.mediaModal.classList.add('visible');
        E.loadAlbums();
        E.loadMedia(null);
      });
    }

    if (btnNewProject) {
      btnNewProject.addEventListener('click', function() {
        var name = prompt('Enter project name:');
        if (name && name.trim() !== '') {
          var slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          if (!slug) slug = 'project-' + Date.now();
          var blankData = {
            settings: {
              title: name.trim(), name: name.trim(), mouseViewMode: 'drag',
              autorotateEnabled: false, autorotateSpeed: 0.03, autorotateInactivityDelay: 3000,
              fullscreenButton: true, sceneListStyle: 'sidebar',
              showMinimap: false, minimapPosition: 'bottom-left', showControls: true,
              gyroscopeEnabled: false, vrEnabled: false,
              defaultTransition: 'opacity', defaultTransitionDuration: 1000, defaultTransitionEasing: 'easeInOut',
              branding: { logoUrl: null, accentColor: '#e62e5a', logoPosition: 'top-left' },
              intro: { enabled: false, title: '', subtitle: '', buttonText: 'Enter Tour' }
            },
            scenes: [],
            floorplan: { enabled: false, imageUrl: 'media/floorplan.jpg', width: 800, height: 600 }
          };
          window.XenoSupabase.saveTour(slug, blankData).then(function() {
            window.location.search = '?project=' + encodeURIComponent(slug);
          });
        }
      });
    }

    if (E.setupThemeToggle) E.setupThemeToggle();
    loadDashboard();
  };

  function isMediaId(v) { return typeof v === 'string' && v.indexOf('media_') === 0; }

  function resolveThumbUrl(firstScene) {
    if (!firstScene) return Promise.resolve(null);
    var url = firstScene.thumbnailUrl || firstScene.mediaUrl;
    if (!url) return Promise.resolve(null);
    if (!isMediaId(url) || !window.XenoSupabase) return Promise.resolve(url);
    return window.XenoSupabase.resolveMediaId(url).then(function(b) { return b || url; });
  }

  function renderProjectGrid(tours, filterQuery) {
    var grid = document.getElementById('project-grid');
    var countEl = document.getElementById('project-count');
    if (countEl) countEl.textContent = tours.length;
    if (!grid) return;
    grid.innerHTML = '';

    // First pass: render all cards with a data-thumb attribute
    tours.forEach(function(tour) {
      var firstScene = (tour.data && tour.data.scenes && tour.data.scenes[0]) || null;
      var sceneCount = (tour.data && tour.data.scenes && tour.data.scenes.length) || 0;
      var title = '';
      if (tour.data && tour.data.settings) title = tour.data.settings.name || tour.data.settings.title || '';
      title = title || tour.slug || 'Untitled Project';
      var thumbUrl = (firstScene && (firstScene.thumbnailUrl || firstScene.mediaUrl)) || '';

      // Use non-media-ID URLs directly; media IDs get resolved in the second pass
      var initialSrc = (thumbUrl && !isMediaId(thumbUrl)) ? thumbUrl : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%239CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Crect x="3" y="3" width="18" height="18" rx="2" ry="2"/%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"/%3E%3Cpolyline points="21 15 16 10 5 21"/%3E%3C/svg%3E';

      var card = document.createElement('div');
      card.className = 'project-card';
      if (isMediaId(thumbUrl)) card.dataset.thumbId = thumbUrl;
      card.innerHTML =
        '<div class="project-card-thumb-wrapper">' +
          '<img class="project-card-thumb" src="' + initialSrc + '" alt="Tour Thumbnail">' +
          '<div class="project-card-scenes-badge">' + sceneCount + ' Scene' + (sceneCount !== 1 ? 's' : '') + '</div>' +
        '</div>' +
        '<div class="project-card-info">' +
          '<h4 class="project-card-title">' + title + '</h4>' +
          '<div class="project-card-meta">' +
            '<span class="project-card-status">Published</span>' +
            '<span class="project-card-date">' + new Date(tour.updated_at).toLocaleDateString() + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="project-card-actions">' +
          '<button class="btn-delete-project" title="Delete Project"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>' +
        '</div>';

      card.addEventListener('click', function() {
        window.location.search = '?project=' + encodeURIComponent(tour.slug);
      });

      var delBtn = card.querySelector('.btn-delete-project');
      delBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (confirm('Delete project "' + title + '"?')) {
          window.XenoSupabase.deleteTour(tour.slug).then(function() {
            loadDashboard(filterQuery);
          }).catch(function(err) {
            alert('Failed to delete project: ' + err.message);
          });
        }
      });

      grid.appendChild(card);
    });

    // Second pass: resolve media IDs and update thumbnails
    var cards = grid.querySelectorAll('.project-card');
    cards.forEach(function(card) {
      var id = card.dataset.thumbId;
      if (!id || !window.XenoSupabase) return;
      window.XenoSupabase.resolveMediaId(id).then(function(b) {
        if (b) { var img = card.querySelector('.project-card-thumb'); if (img) img.src = b; }
      });
    });
  }

  function loadDashboard(filterQuery) {
    if (!window.XenoSupabase) return;
    window.XenoSupabase.fetchTours().then(function(tours) {
      if (filterQuery) {
        var q = filterQuery.trim().toLowerCase();
        tours = tours.filter(function(t) {
          var title = '';
          if (t.data && t.data.settings) title = t.data.settings.name || t.data.settings.title || '';
          title = title || t.slug || '';
          return title.toLowerCase().indexOf(q) !== -1;
        });
      }
      renderProjectGrid(tours, filterQuery);
    });
  }

  // ─── Legacy initDashboard (for old editor.html) ──────────
  // The old initDashboard in editor.js also had project grid rendering.
  // This is a compatibility hook; the new flow never calls it.
  window.initDashboard = E.initDashboard;
})();
