window.XenoTemplates = window.XenoTemplates || {};
window.XenoTemplates.colorPicker = function() {
  return `<!-- Custom Color Picker -->
<div id="xeno-color-picker" class="xcp-overlay" style="display:none;">
  <div class="xcp-panel">
    <span class="xcp-ornament"></span>
    <span class="xcp-ornament br"></span>
    <div class="xcp-header">
      <span class="xcp-title">COLOR</span>
      <div style="display:flex;gap:8px;align-items:center;">
        <button class="xcp-dropper" id="xcp-eyedropper" title="Pick from screen">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 22 1-1h3l9-9"/><path d="M3 21v-3l9-9"/></svg>
        </button>
        <button class="xcp-close" id="xcp-close">&times;</button>
      </div>
    </div>
    <div class="xcp-body">
      <div class="xcp-main">
        <div class="xcp-sv-box">
          <canvas id="xcp-sv-canvas" width="200" height="200"></canvas>
          <div class="xcp-sv-cursor" id="xcp-sv-cursor"></div>
        </div>
        <div class="xcp-hue-bar">
          <canvas id="xcp-hue-canvas" width="20" height="200"></canvas>
          <div class="xcp-hue-cursor" id="xcp-hue-cursor"></div>
        </div>
      </div>
      <div class="xcp-preview-row">
        <div class="xcp-preview-old" id="xcp-preview-old"></div>
        <div class="xcp-preview-new" id="xcp-preview-new"></div>
        <input type="text" class="hs-hex-input" id="xcp-hex" maxlength="7" value="#ffffff" style="flex:1;min-width:0;">
      </div>
      <div class="xcp-presets" id="xcp-presets">
        <div class="xcp-preset" data-color="#ffffff" style="background:#fff;" title="White"></div>
        <div class="xcp-preset" data-color="#e11d48" style="background:#e11d48;" title="Red"></div>
        <div class="xcp-preset" data-color="#f97316" style="background:#f97316;" title="Orange"></div>
        <div class="xcp-preset" data-color="#eab308" style="background:#eab308;" title="Yellow"></div>
        <div class="xcp-preset" data-color="#22c55e" style="background:#22c55e;" title="Green"></div>
        <div class="xcp-preset" data-color="#06b6d4" style="background:#06b6d4;" title="Cyan"></div>
        <div class="xcp-preset" data-color="#3b82f6" style="background:#3b82f6;" title="Blue"></div>
        <div class="xcp-preset" data-color="#8b5cf6" style="background:#8b5cf6;" title="Purple"></div>
        <div class="xcp-preset" data-color="#ec4899" style="background:#ec4899;" title="Pink"></div>
      </div>
      <div class="xcp-recent" id="xcp-recent">
        <span class="xcp-recent-label">Recent</span>
        <div class="xcp-recent-swatches" id="xcp-recent-list"></div>
      </div>
    </div>
  </div>
</div>`;
};
