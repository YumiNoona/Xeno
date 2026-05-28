(()=>{const s=document.currentScript;s.insertAdjacentHTML('beforebegin',`<!-- Dashboard -->
<div id="dashboard-view">
  <div class="dashboard-header">
    <div class="logo">\u2726 <span>Xeno</span> Tour Studio</div>
    <div class="header-right">
      <button class="btn-icon" id="dashboard-theme-toggle" title="Toggle Theme"></button>
      <button class="btn btn-new-project btn-primary" id="btn-new-project" style="color: #ffffff;">
        ${xIcon('plus', 14)}
        New Project
      </button>
    </div>
  </div>

  <div class="dashboard-toolbar">
    <div class="search-box">
      <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <input type="text" id="project-search" placeholder="Search tours\u2026">
    </div>
    <div class="toolbar-stats">
      Projects: <span id="project-count">0</span>
    </div>
  </div>

  <div id="project-grid" class="project-grid"></div>
</div>`);s.remove()})();
