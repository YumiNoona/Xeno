(function() {
  'use strict';
  var E = window.XenoEditor;
  var S = E.state;
  var D = E.dom;

  E.setupUI = function() {
    // ─── Resizers ────────────────────────────────────────
    var sidebar = document.getElementById('editor-sidebar');
    var leftResizer = document.getElementById('left-resizer');
    var props = document.getElementById('properties-panel');
    var rightResizer = document.getElementById('right-resizer');
    var sidebarCollapse = document.getElementById('sidebar-collapse-btn');

    if (sidebarCollapse) {
      function updateSidebarCollapseIcon() {
        var collapsed = document.body.classList.contains('sidebar-collapsed');
        sidebarCollapse.innerHTML = collapsed
          ? window.xIcon('chevron-right', 14)
          : window.xIcon('chevron-left', 14);
        sidebarCollapse.title = collapsed ? 'Expand sidebar' : 'Collapse sidebar';
      }
      sidebarCollapse.addEventListener('click', function() {
        document.body.classList.toggle('sidebar-collapsed');
        updateSidebarCollapseIcon();
        sidebarCollapse.style.left = ''; // clear inline so CSS transition works
        setTimeout(function() { if (S.viewer) S.viewer.updateSize(); }, 250);
      });
      updateSidebarCollapseIcon();
      // After sidebar transition, sync inline position for resizer tracking
      sidebar.addEventListener('transitionend', function(e) {
        if (e.propertyName === 'width') {
          sidebarCollapse.style.left = sidebar.offsetWidth + 'px';
        }
      });
    }

    if (leftResizer) {
      leftResizer.addEventListener('mousedown', function(e) {
        e.preventDefault();
        leftResizer.classList.add('dragging');
        function onMove(e2) {
          var w = e2.clientX;
          if (w > 180 && w < 500) {
            sidebar.style.transition = 'none';
            sidebar.style.width = w + 'px';
            sidebar.style.minWidth = w + 'px';
            // Keep collapse btn aligned with sidebar right edge
            var colBtn = document.getElementById('sidebar-collapse-btn');
            if (colBtn) colBtn.style.left = w + 'px';
            if (S.viewer) S.viewer.updateSize();
          }
        }
        function onUp() {
          sidebar.style.transition = ''; leftResizer.classList.remove('dragging');
          document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp);
        }
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    }

    if (rightResizer) {
      rightResizer.addEventListener('mousedown', function(e) {
        e.preventDefault();
        rightResizer.classList.add('dragging');
        function onMove(e2) {
          var w = window.innerWidth - e2.clientX;
          if (w > 200 && w < 600) { props.style.transition = 'none'; props.style.width = w + 'px'; if (S.viewer) S.viewer.updateSize(); }
        }
        function onUp() {
          props.style.transition = ''; rightResizer.classList.remove('dragging');
          document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp);
        }
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    }

    // ─── Toast ───────────────────────────────────────────
    E.showToast = function(msg) {
      var t = document.querySelector('.xeno-toast');
      if (!t) { t = document.createElement('div'); t.className = 'xeno-toast'; document.body.appendChild(t); }
      t.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> ' + msg;
      t.classList.add('visible');
      if (t.timeoutId) clearTimeout(t.timeoutId);
      t.timeoutId = setTimeout(function() { t.classList.remove('visible'); }, 3000);
    };

    // ─── Workspace Header ────────────────────────────────
    var logoBack = document.getElementById('logo-back');
    if (logoBack) logoBack.addEventListener('click', function() { window.location.search = ''; });

    var btnPreview = document.getElementById('btn-preview-tour');
    if (btnPreview) {
      btnPreview.addEventListener('click', function() {
        if (S.projectSlug) window.open('preview.html?project=' + encodeURIComponent(S.projectSlug), '_blank');
      });
    }

    var btnSettings = document.getElementById('btn-settings');
    if (btnSettings) {
      btnSettings.addEventListener('click', function() {
        E.openProjectSettingsPanel();
      });
    }

    E.setupThemeToggle();
  };

  E.setupThemeToggle = function() {
    var theme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', theme);

    function updateThemeIcons(currentTheme) {
      var iconName = currentTheme === 'dark' ? 'sun' : 'moon';
      var iconHtml = window.xIcon(iconName, 16);
      if (D.dashboardThemeToggle) D.dashboardThemeToggle.innerHTML = iconHtml;
      if (D.topbarThemeToggle) D.topbarThemeToggle.innerHTML = iconHtml;
    }

    function toggleTheme() {
      var current = document.documentElement.getAttribute('data-theme');
      var next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      updateThemeIcons(next);
    }

    if (D.dashboardThemeToggle) {
      D.dashboardThemeToggle.addEventListener('click', toggleTheme);
    }
    var dashDonate = document.getElementById('dashboard-donate-btn');
    if (dashDonate) {
      dashDonate.addEventListener('click', function() { if (window.showDonatePopup) window.showDonatePopup(true); });
    }
    if (D.topbarThemeToggle) {
      D.topbarThemeToggle.addEventListener('click', toggleTheme);
    }

    updateThemeIcons(theme);
  };
})();