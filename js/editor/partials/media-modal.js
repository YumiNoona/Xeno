(()=>{const s=document.currentScript;s.insertAdjacentHTML('beforebegin',`<!-- Media Manager Modal -->
<div id="media-modal">
  <div class="media-header">
    <div class="media-header-title">
      ${xIcon('folder', 16)}
      Media Library
    </div>
    <div class="media-header-actions">
      <button class="btn" id="btn-close-media">
        ${xIcon('x', 14)}
        Close
      </button>
    </div>
  </div>
  <div class="media-body">
    <div class="media-sidebar">
      <button class="media-add-album-btn" id="btn-add-album">
        ${xIcon('plus', 14)}
        New Album
      </button>
      <div class="media-sidebar-label">Albums</div>
      <div class="album-list"></div>
    </div>
    <div class="media-content">
      <div class="media-content-inner">
        <div class="media-upload-area" id="media-upload-area">
          <div class="upload-icon-wrap">
            ${xIcon('download', 24)}
          </div>
          <div class="upload-title">Drop files here or click to browse</div>
          <div class="upload-sub">Upload images, video, or audio to your library</div>
          <div class="upload-types">
            <span class="upload-type-badge">JPG</span>
            <span class="upload-type-badge">PNG</span>
            <span class="upload-type-badge">MP4</span>
            <span class="upload-type-badge">WebM</span>
            <span class="upload-type-badge">MP3</span>
          </div>
          <input type="file" id="media-file-input" style="display:none" accept="image/*,video/*,audio/*" multiple>
        </div>
        <div class="media-search-box"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg><input type="text" id="media-search-input" placeholder="Search media..."></div>
        <div class="media-grid" id="media-grid"></div>
      </div>
      <div id="media-action-bar" style="display: none;">
        <span id="media-sel-count">0 selected</span>
        <div style="display:flex;gap:6px;align-items:center;">
          <button id="btn-add-selected" class="btn btn-primary">
            ${xIcon('plus', 14)}
            Use in Scene
          </button>
          <button id="btn-delete-selected" class="btn btn-danger">
            ${xIcon('trash', 14)}
            Delete
          </button>
          <button id="btn-clear-media-sel" class="btn btn-secondary">
            ${xIcon('x', 14)}
          </button>
        </div>
      </div>
    </div>
  </div>
</div>`);s.remove()})();
