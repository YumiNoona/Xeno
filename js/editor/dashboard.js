(function() {
  'use strict';
  var E = window.XenoEditor;

  E.initDashboard = function() {
    var searchInput = document.getElementById('project-search');
    var btnNewProject = document.getElementById('btn-new-project');

    if (searchInput) {
      searchInput.addEventListener('input', function() { loadDashboard(this.value); });
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

  function loadDashboard(filterQuery) {
    if (!window.XenoSupabase) return;
    window.XenoSupabase.fetchTours().then(function(tours) {
      var filtered = tours;
      if (filterQuery) {
        var q = filterQuery.trim().toLowerCase();
        filtered = tours.filter(function(t) {
          var title = '';
          if (t.data && t.data.settings) title = t.data.settings.name || t.data.settings.title || '';
          title = title || t.slug || '';
          return title.toLowerCase().indexOf(q) !== -1;
        });
      }

      var grid = document.getElementById('project-grid');
      var countEl = document.getElementById('project-count');
      if (countEl) countEl.textContent = filtered.length;
      if (!grid) return;
      grid.innerHTML = '';

      filtered.forEach(function(tour) {
        var card = document.createElement('div');
        card.className = 'project-card';

        var firstScene = (tour.data && tour.data.scenes && tour.data.scenes[0]) || null;
        var thumb = (firstScene && (firstScene.thumbnailUrl || firstScene.mediaUrl)) || 'img/photo.png';
        var sceneCount = (tour.data && tour.data.scenes && tour.data.scenes.length) || 0;
        var title = '';
        if (tour.data && tour.data.settings) title = tour.data.settings.name || tour.data.settings.title || '';
        title = title || tour.slug || 'Untitled Project';

        card.innerHTML =
          '<div class="project-card-thumb-wrapper">' +
            '<img class="project-card-thumb" src="' + thumb + '" alt="Tour Thumbnail">' +
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
    });
  }

  // ─── Legacy initDashboard (for old editor.html) ──────────
  // The old initDashboard in editor.js also had project grid rendering.
  // This is a compatibility hook; the new flow never calls it.
  window.initDashboard = E.initDashboard;
})();
