window.XenoTemplates = window.XenoTemplates || {};
window.XenoTemplates.projectSettings = function() {
  return `<div class="type-fields" id="fields-project-settings" style="display:none;">
      <div id="panel-actions-project">
        <button class="btn btn-primary" id="btn-save-project-settings">
          ${xIcon('check', 14)}
          Save Settings
        </button>
      </div>

      <div class="project-settings-section">
        <label class="ps-section-label">Controls &amp; Features</label>
        <div class="form-group toggle-group">
          <label>VR Mode Button</label>
          <input type="checkbox" id="ps-vr">
        </div>
        <div class="form-group toggle-group">
          <label>Gyroscope Button</label>
          <input type="checkbox" id="ps-gyro">
        </div>
        <div class="form-group toggle-group">
          <label>Navigation Buttons</label>
          <input type="checkbox" id="ps-controls" checked>
        </div>
        <div class="form-group toggle-group">
          <label>Fullscreen Button</label>
          <input type="checkbox" id="ps-fullscreen" checked>
        </div>
        <div class="form-group toggle-group">
          <label>Capture Button</label>
          <input type="checkbox" id="ps-capture" checked>
        </div>
        <div class="form-group toggle-group">
          <label>Autorotate Button</label>
          <input type="checkbox" id="ps-autorotate">
        </div>
        <div class="form-group toggle-group">
          <label>Scene Button</label>
          <input type="checkbox" id="ps-show-scenes" checked>
        </div>
      </div>

      <div class="project-settings-section">
        <label class="ps-section-label">Layout Theme</label>
        <input type="hidden" id="ps-layout-theme" value="hamburger">
        <div class="theme-card-grid">

          <div class="theme-card" data-theme="gallery">
            <div class="tc-diagram">
              <div class="tc-pano"></div>
              <div class="tc-gallery-bottom"></div>
              <div class="tc-ctrl"></div>
            </div>
            <div class="tc-name">Gallery</div>
            <div class="tc-desc">Card fan hand, 6 cards with 3D depth</div>
          </div>
          <div class="theme-card" data-theme="float">
            <div class="tc-diagram">
              <div class="tc-pano"></div>
              <div class="tc-float-pill"></div>
              <div class="tc-ctrl"></div>
            </div>
            <div class="tc-name">Float</div>
            <div class="tc-desc">Glass pill at bottom, horizontal cards</div>
          </div>
          <div class="theme-card" data-theme="hamburger">
            <div class="tc-diagram">
              <div class="tc-pano"></div>
              <div class="tc-hamburger-menu"></div>
              <div class="tc-ctrl"></div>
            </div>
            <div class="tc-name">Hamburger</div>
            <div class="tc-desc">Clean sliding panel, thumbnail-only</div>
          </div>
          <div class="theme-card" data-theme="center-bar">
            <div class="tc-diagram">
              <div class="tc-pano"></div>
              <div class="tc-center-bar-bottom"></div>
              <div class="tc-ctrl"></div>
            </div>
            <div class="tc-name">Center Bar</div>
            <div class="tc-desc">Bottom bar with thumbnails, controls pill</div>
          </div>
        </div>
      </div>

      <div class="project-settings-section">
        <label class="ps-section-label">Intro Screen</label>
        <div class="form-group toggle-group">
          <label>Show Intro Screen</label>
          <input type="checkbox" id="ps-intro-enabled">
        </div>
        <div class="form-group">
          <label>Title</label>
          <input type="text" id="ps-intro-title" placeholder="Tour title">
        </div>
        <div class="form-group">
          <label>Subtitle</label>
          <input type="text" id="ps-intro-subtitle" placeholder="Optional subtitle">
        </div>
        <div class="form-group">
          <label>Button Text</label>
          <input type="text" id="ps-intro-btn" placeholder="Enter Tour">
        </div>
      </div>

      <div class="project-settings-section">
        <label class="ps-section-label">Floorplan &amp; Minimap</label>
        <div class="form-group toggle-group">
          <label>Enable Minimap</label>
          <input type="checkbox" id="ps-minimap">
        </div>
        <div class="form-group">
          <label>Minimap Position</label>
          <select id="ps-minimap-pos">
            <option value="bottom-left">Bottom Left</option>
            <option value="bottom-right">Bottom Right</option>
            <option value="top-left">Top Left</option>
            <option value="top-right">Top Right</option>
          </select>
        </div>
        <div class="form-group">
          <label>Floorplan Image</label>
          <div style="display:flex;gap:8px;">
            <input type="text" id="ps-floorplan-url" placeholder="Paste URL or pick\u2026" style="flex:1;">
            <button class="btn btn-secondary" id="ps-pick-floorplan"
              style="padding:0 10px;border-radius:var(--radius-sm);">
              ${xIcon('folder', 14)}
            </button>
          </div>
        </div>
      </div>

      <div class="project-settings-section">
        <label class="ps-section-label">Hotspot Overview</label>
        <div id="ps-hotspot-overview"></div>
      </div>

    </div>`;
};
