(()=>{const s=document.currentScript;s.insertAdjacentHTML('beforebegin',`<!-- Dashboard -->
<div id="dashboard-view">
  <div class="dashboard-header">
    <div class="logo">\u2726 <span>Xeno</span> Tour Studio</div>
    <div class="header-right">
      <button class="btn btn-media btn-secondary" id="btn-media-dashboard">
        ${xIcon('folder', 14)}
        Media
      </button>
      <button class="btn btn-secondary" id="btn-import-project">
        ${xIcon('upload', 14)}
        Import
      </button>
      <button class="btn btn-new-project" id="btn-new-project">
        ${xIcon('plus', 14)}
        New Project
      </button>
      <button class="btn-icon" id="dashboard-theme-toggle" title="Toggle Theme"></button>
      <button class="btn-icon" id="dashboard-donate-btn" title="Support Xeno" style="color:var(--accent);">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square" stroke-linejoin="miter"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
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

  <!-- Share Modal -->
  <div id="share-modal" class="share-modal-overlay" style="display:none;">
    <div class="share-modal">
      <div class="share-modal-header">
        <h3>// SHARE_PROJECT</h3>
        <button class="share-modal-close" id="btn-close-share">&times;</button>
      </div>
      <div class="share-modal-body">
        <p style="color:var(--text-muted);margin-bottom:20px;text-align:center;font-size:var(--type-sm);">$ distribute --output web --target all</p>
        <div class="share-buttons">
          <a class="share-btn share-whatsapp" id="share-whatsapp" target="_blank">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 12.5c.5 1 1 1.8 1 2.2 0 1.3-1.5 2.4-2.5 2.8-2 .7-5.4-.3-8.7-3.6C4.2 11 3.1 7.6 3.8 5.6c.4-1 1.5-2.5 2.8-2.5.4 0 1.2.5 2.2 1 .3.1.6.4.5.8-.1.3-.4.7-.6.9-.2.3-.3.6-.1.9.3.7 1 2 2.4 3.4 1.4 1.4 2.7 2.1 3.4 2.4.3.2.6.1.9-.1.2-.2.6-.5.9-.6.4-.1.7.2.8.5z"/></svg>
            WhatsApp
          </a>
          <a class="share-btn share-telegram" id="share-telegram" target="_blank">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.2 3.1l-19 7.4c-.9.3-.8 1.5.1 1.7l4.9 1.6 1.4 4.6c.2.7 1.1.8 1.5.2l2.3-3.6 4.9 3.6c.6.4 1.4 0 1.6-.6l3.9-14.2c.2-.8-.5-1.5-1.3-1.2z"/><line x1="9.5" y1="12.5" x2="21.2" y2="3.1"/></svg>
            Telegram
          </a>
          <a class="share-btn share-wetransfer" id="share-wetransfer" target="_blank">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12l4-4 4 4"/><line x1="12" y1="8" x2="12" y2="16"/></svg>
            WeTransfer
          </a>
        </div>
        <div style="margin-top:20px;padding-top:16px;border-top:2px solid var(--border);">
          <p style="color:var(--text-muted);font-size:var(--type-2xs);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.08em;">&gt; embed_code</p>
          <div style="display:flex;gap:6px;">
            <textarea id="share-embed-code" readonly style="flex:1;font-size:10px;resize:none;height:36px;background:#0a0a0a;border:2px solid var(--border);color:var(--text-primary);padding:8px;border-radius:0;font-family:var(--font-mono);"></textarea>
            <button class="btn btn-secondary" id="btn-copy-embed" style="padding:4px 10px;font-size:var(--type-xs);flex-shrink:0;">Copy</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>`);s.remove()})();
