(()=>{const s=document.currentScript;s.insertAdjacentHTML('beforebegin',`<!-- Top Bar -->
<div id="editor-topbar">
  <div class="logo" id="logo-back">
    ${xIcon('chevron-left', 16)}
    Dashboard
  </div>
<div class="topbar-center">
<span class="topbar-project-name" id="topbar-project-name" contenteditable="true" spellcheck="false">Untitled Tour</span>
<span id="save-indicator" style="margin-left:8px;font-size:var(--type-2xs);opacity:0;transition:opacity 0.2s;"></span>
  </div>
  <div class="topbar-actions">
    <button class="btn-icon" id="topbar-theme-toggle" title="Toggle Theme"></button>
    <div class="topbar-sep"></div>
    <button class="btn btn-settings" id="btn-settings">
      ${xIcon('settings', 16)}
      Settings
    </button>
    <button class="btn" id="btn-media-manager">
      ${xIcon('folder', 16)}
      Media
    </button>
    <button class="btn" id="btn-preview-tour">
      ${xIcon('eye', 16)}
      Preview
    </button>
    <div class="topbar-sep"></div>
    <button class="btn btn-publish" id="btn-publish">
      ${xIcon('upload', 16)}
      Publish
    </button>
    <button class="btn btn-publish" id="btn-export">
      ${xIcon('download', 16)}
      Export Zip
    </button>
  </div>
</div>`);s.remove()})();
