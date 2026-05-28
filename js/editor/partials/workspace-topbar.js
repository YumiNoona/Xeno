(()=>{const s=document.currentScript;s.insertAdjacentHTML('beforebegin',`<!-- Top Bar -->
<div id="editor-topbar">
  <div class="logo" id="logo-back">
    ${xIcon('chevron-left', 16)}
    Dashboard
  </div>
  <div class="topbar-center">
    <span class="topbar-project-name" id="topbar-project-name" contenteditable="true" spellcheck="false">Untitled Tour</span>
  </div>
  <div class="topbar-actions">
    <button class="btn-icon" id="topbar-theme-toggle" title="Toggle Theme"></button>
    <div class="topbar-sep"></div>
    <button class="btn" id="btn-media-manager">
      ${xIcon('folder', 16)}
      Media
    </button>
    <button class="btn" id="btn-preview-tour">
      ${xIcon('eye', 16)}
      Preview
    </button>
    <div class="topbar-sep"></div>
    <button class="btn btn-publish" id="btn-export" style="color: #ff0000;">
      ${xIcon('download', 16)}
      Export Zip
    </button>
  </div>
</div>`);s.remove()})();
