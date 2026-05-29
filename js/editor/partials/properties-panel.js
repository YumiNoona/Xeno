(()=>{const s=document.currentScript;s.insertAdjacentHTML('beforebegin',`<!-- Properties Panel -->
<div id="properties-panel">
  <div class="collapse-btn" id="props-collapse-btn">
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  </div>
  <div class="panel-header">
    <h3 id="panel-title">Hotspot Properties</h3>
    <button class="close-panel" id="btn-close-properties">
      ${xIcon('x', 16)}
    </button>
  </div>
  <div class="panel-body">

    <div id="fields-hotspot-properties">
    <div class="form-group">
      <label>Type</label>
      <select id="prop-type">
        <option value="navigate">Navigate</option>
        <option value="info">Info Card</option>
        <option value="url">URL Link</option>
        <option value="image">Image</option>
        <option value="video">Video</option>
        <option value="audio">Audio</option>
        <option value="embed">Embedded (YouTube/Maps)</option>
        <option value="quad">Surface (4-Point)</option>
      </select>
    </div>
    <div class="form-group">
      <label>Label / Title</label>
      <input type="text" id="prop-title" placeholder="Hotspot title">
    </div>
    <div class="form-group">
      <label>Animation</label>
      <select id="prop-animation">
        <option value="none">None</option>
        <option value="pulse">Pulse</option>
        <option value="bounce">Bounce</option>
        <option value="spin">Spin</option>
        <option value="float">Float</option>
        <option value="heartbeat">Heartbeat</option>
        <option value="wiggle">Wiggle</option>
        <option value="breathe">Breathe</option>
        <option value="flicker">Flicker</option>
        <option value="orbit">Orbit Ring</option>
        <option value="shake">Shake</option>
        <option value="swing">Swing</option>
        <option value="glow">Glow</option>
        <option value="ripple">Ripple</option>
        <option value="pop">Pop</option>
        <option value="wobble">Wobble</option>
      </select>
    </div>
    <div class="form-group">
      <label>Icon Style</label>
      <select id="prop-icon-style">
        <option value="default">Default (+)</option>
        <option value="dot">Dot</option>
        <option value="arrow">Arrow</option>
        <option value="eye">Eye (View)</option>
        <option value="home">Home</option>
        <option value="camera">Camera</option>
        <option value="door">Door</option>
        <option value="exit">Exit</option>
        <option value="tag">Tag / Label</option>
        <option value="play">Play Button</option>
        <option value="link">Link / URL</option>
        <option value="photo">Photo / Image</option>
        <option value="volume">Volume / Audio</option>
        <option value="pin">Map Pin</option>
        <option value="info">Info Circle</option>
        <option value="map">Map</option>
        <option value="compass">Compass</option>
        <option value="star">Star</option>
        <option value="question">Question</option>
        <option value="warning">Warning</option>
        <option value="stairs">Stairs</option>
        <option value="expand">Expand</option>
        <option value="360">360\u00B0 View</option>
        <option value="restroom">Restroom</option>
        <option value="elevator">Elevator</option>
        <option value="escalator">Escalator</option>
        <option value="parking">Parking</option>
        <option value="food">Food / Dining</option>
        <option value="shop">Shop</option>
        <option value="custom">Custom Image</option>
      </select>
    </div>
    <div class="form-group">
      <label>Outer Ring</label>
      <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
        <input type="checkbox" id="prop-ring-enabled" checked>
        <span>Show outer ring</span>
      </label>
    </div>
    <div class="form-group">
      <label>Icon Color</label>
      <div style="display:flex;gap:8px;align-items:center;">
        <input type="color" id="prop-icon-color" value="#ffffff"
          style="width:40px;height:32px;border-radius:6px;border:1px solid var(--border);cursor:pointer;padding:2px;">
        <button class="btn btn-secondary" id="btn-reset-icon-color"
          style="font-size:var(--type-xs);padding:4px 8px;">Reset</button>
      </div>
    </div>
    <div class="form-group">
      <label>Ring Color</label>
      <div style="display:flex;gap:8px;align-items:center;">
        <input type="color" id="prop-ring-color" value="#ffffff"
          style="width:40px;height:32px;border-radius:6px;border:1px solid var(--border);cursor:pointer;padding:2px;">
        <button class="btn btn-secondary" id="btn-reset-ring-color"
          style="font-size:var(--type-xs);padding:4px 8px;">Reset</button>
      </div>
    </div>
    <div class="form-group">
      <label>Ring Thickness <span id="prop-ring-size-label">2px</span></label>
      <input type="range" id="prop-ring-size" min="1" max="8" value="2" step="1">
    </div>
    <div class="form-group">
      <label>Number of Rings</label>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-secondary ring-count-btn active" data-count="1" style="flex:1;padding:4px 0;font-size:var(--type-xs);">1</button>
        <button class="btn btn-secondary ring-count-btn" data-count="2" style="flex:1;padding:4px 0;font-size:var(--type-xs);">2</button>
        <button class="btn btn-secondary ring-count-btn" data-count="3" style="flex:1;padding:4px 0;font-size:var(--type-xs);">3</button>
      </div>
    </div>
    <div class="form-group" id="group-ring-gap">
      <label>Ring Gap <span id="prop-ring-gap-label">6px</span></label>
      <input type="range" id="prop-ring-gap" min="2" max="20" value="6" step="1">
    </div>
    <div class="form-group">
      <label>Icon Size <span id="prop-size-label">44px</span></label>
      <input type="range" id="prop-icon-size" min="24" max="96" value="44" step="2">
    </div>
    <div class="form-group" id="group-custom-icon" style="display:none;">
      <label>Custom Icon</label>
      <div style="display:flex;gap:8px;">
        <input type="text" id="prop-custom-icon-url" placeholder="Paste URL or pick\u2026" style="flex:1;">
        <button class="btn btn-secondary" id="btn-pick-custom-icon"
              style="padding:0 10px;border-radius:var(--radius-sm);">
              ${xIcon('folder', 14)}
            </button>
      </div>
    </div>

    <!-- Navigate fields -->
    <div class="type-fields" id="fields-navigate">
      <div class="form-group">
        <label>Target Scene</label>
        <select id="prop-target-scene"></select>
      </div>
      <div class="form-group">
        <label>Transition</label>
        <select id="prop-transition">
          <option value="opacity">Opacity</option>
          <option value="fromRight">From Right</option>
          <option value="throughBlack">Through Black</option>
          <option value="fromCenter">From Center</option>
          <option value="fromWhite">From White</option>
          <option value="fromLeft">From Left</option>
          <option value="iris">Iris</option>
          <option value="throughWhite">Through White</option>
          <option value="curtain">Curtain</option>
          <option value="fromCorner">From Corner</option>
          <option value="splitHorizontal">Split</option>
          <option value="zoomOut">Zoom Out</option>
        </select>
      </div>
      <div class="form-group">
        <label>Duration <span id="prop-trans-dur-label">800ms</span></label>
        <input type="range" id="prop-trans-duration" min="300" max="2000" value="800" step="100">
      </div>
    </div>

    <!-- Info fields -->
    <div class="type-fields" id="fields-info" style="display:none;">
      <div class="form-group">
        <label>Body Text</label>
        <textarea id="prop-body-text" rows="3" placeholder="Description\u2026"></textarea>
      </div>
      <div class="form-group">
        <label>Link URL (optional)</label>
        <input type="text" id="prop-link-url" placeholder="https://\u2026">
      </div>
      <div class="form-group">
        <label>Link opens in</label>
        <div class="radio-group">
          <label class="radio-label"><input type="radio" name="prop-link-type" value="external" checked>
            External tab</label>
          <label class="radio-label"><input type="radio" name="prop-link-type" value="scene"> Scene</label>
        </div>
      </div>
      <div class="form-group" id="info-scene-target-group" style="display:none;">
        <label>Target Scene</label>
        <select id="prop-info-target-scene"></select>
      </div>
      <div class="form-group">
        <label>Button Label</label>
        <input type="text" id="prop-link-label" placeholder="Open link">
      </div>
    </div>

    <!-- URL fields -->
    <div class="type-fields" id="fields-url" style="display:none;">
      <div class="form-group">
        <label>URL</label>
        <input type="text" id="prop-url-href" placeholder="https://\u2026">
      </div>
      <div class="form-group">
        <label>Button Label</label>
        <input type="text" id="prop-url-label" placeholder="Open link">
      </div>
      <div class="form-group">
        <label>Open in</label>
        <select id="prop-url-open-in">
          <option value="newtab">New Tab</option>
          <option value="popup">Popup Overlay</option>
        </select>
      </div>
    </div>

    <!-- Image fields -->
    <div class="type-fields" id="fields-image" style="display:none;">
      <div class="form-group">
        <label>Image File / URL</label>
        <div style="display:flex;gap:8px;">
          <input type="text" id="prop-image-url" placeholder="Paste URL or pick\u2026" style="flex:1;">
          <button class="btn btn-secondary" id="btn-pick-image"
            style="padding:0 10px;border-radius:var(--r-sm);">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        </div>
      </div>
      <div class="form-group">
        <label>Caption</label>
        <input type="text" id="prop-image-caption" placeholder="Optional caption">
      </div>
      <div class="form-group">
        <label>Link URL (optional)</label>
        <input type="text" id="prop-image-link" placeholder="https://\u2026">
      </div>
    </div>

    <!-- Video fields -->
    <div class="type-fields" id="fields-video" style="display:none;">
      <div class="form-group">
        <label>Video File / URL</label>
        <div style="display:flex;gap:8px;">
          <input type="text" id="prop-video-url" placeholder="Paste URL or pick\u2026" style="flex:1;">
          <button class="btn btn-secondary" id="btn-pick-video"
            style="padding:0 10px;border-radius:var(--r-sm);">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        </div>
      </div>
      <div class="form-group toggle-group">
        <label>Autoplay</label>
        <input type="checkbox" id="prop-video-autoplay">
      </div>
      <div class="form-group toggle-group">
        <label>Loop</label>
        <input type="checkbox" id="prop-video-loop" checked>
      </div>
      <div class="form-group toggle-group">
        <label>Muted</label>
        <input type="checkbox" id="prop-video-muted" checked>
      </div>
    </div>

    <!-- Audio fields -->
    <div class="type-fields" id="fields-audio" style="display:none;">
      <div class="form-group">
        <label>Audio File / URL</label>
        <div style="display:flex;gap:8px;">
          <input type="text" id="prop-audio-url" placeholder="Paste URL or pick\u2026" style="flex:1;">
          <button class="btn btn-secondary" id="btn-pick-audio"
            style="padding:0 10px;border-radius:var(--r-sm);">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        </div>
      </div>
      <div class="form-group toggle-group">
        <label>Autoplay</label>
        <input type="checkbox" id="prop-audio-autoplay">
      </div>
      <div class="form-group toggle-group">
        <label>Show Player Label</label>
        <input type="checkbox" id="prop-audio-label" checked>
      </div>
      <div class="form-group toggle-group">
        <label>Narration (auto-play on enter)</label>
        <input type="checkbox" id="prop-audio-narration">
      </div>
    </div>

    <!-- Embed fields -->
    <div class="type-fields" id="fields-embed" style="display:none;">
      <div class="form-group">
        <label>Iframe URL / Embed Code</label>
        <textarea id="prop-embed-code" placeholder="https://www.youtube.com/embed/... or <iframe> code" rows="3"></textarea>
        <div style="font-size:var(--type-2xs);color:var(--text-muted);margin-top:4px;">
          Supports YouTube, Vimeo, Google Maps, etc.
        </div>
      </div>
      <div class="form-group">
        <label>Width (px)</label>
        <input type="number" id="prop-embed-width" value="480">
      </div>
      <div class="form-group">
        <label>Height (px)</label>
        <input type="number" id="prop-embed-height" value="270">
      </div>

      <div class="ctx-sep" style="margin: 12px 0;"></div>

      <div class="form-group toggle-group">
        <label>Perspective Mode</label>
        <input type="checkbox" id="prop-embed-perspective">
      </div>
      <div id="perspective-options" style="display:none;">
        <div class="form-group">
          <label>Radius (Depth)</label>
          <input type="number" id="prop-embed-radius" value="1000" step="10">
        </div>
        <div class="form-group">
          <label>Extra Transforms</label>
          <input type="text" id="prop-embed-transform" placeholder="e.g. rotateX(5deg) scale(1.2)">
        </div>
      </div>
    </div>

    <!-- Quad fields -->
    <div class="type-fields" id="fields-quad" style="display:none;">
      <div class="form-group">
        <label>Iframe URL / Embed Code</label>
        <textarea id="prop-quad-code" placeholder="https://www.youtube.com/embed/... or <iframe> code" rows="3"></textarea>
        <div style="font-size:var(--type-2xs);color:var(--text-muted);margin-top:4px;">
          Supports YouTube, Vimeo, Google Maps, etc.
        </div>
      </div>
      <div class="form-group">
        <label>Source Width (px)</label>
        <input type="number" id="prop-quad-src-width" value="480">
      </div>
      <div class="form-group">
        <label>Source Height (px)</label>
        <input type="number" id="prop-quad-src-height" value="270">
      </div>
      <div class="ctx-sep" style="margin: 12px 0;"></div>
      <div class="form-group">
        <label>Corner Points (Yaw, Pitch)</label>
        <div id="quad-points-list"></div>
        <button class="btn btn-secondary" id="btn-add-quad-point">
          ${xIcon('plus', 14)}
          Add Point
        </button>
        <button class="btn btn-danger" id="btn-clear-quad-points" style="display:none;">
          ${xIcon('trash', 14)}
          Clear Points
        </button>
      </div>
    </div>

    </div><!-- /#fields-hotspot-properties -->

    <!-- Scene settings -->
    <div class="type-fields" id="fields-scene-settings" style="display:none;">
      <div style="margin-top:0; padding-top:0; border-top:none;">
        <label
          style="font-size:var(--type-xs); color:var(--text-muted); text-transform:uppercase; letter-spacing:0.06em; font-weight:var(--weight-semibold); margin-bottom:8px; display:block;">Floorplan
          Settings</label>
        <div class="form-group toggle-group">
          <label>Enable Minimap</label>
          <input type="checkbox" id="prop-floorplan-enabled">
        </div>
        <div class="form-group">
          <label>Floorplan Image</label>
          <div style="display:flex;gap:8px;">
            <input type="text" id="prop-floorplan-url" placeholder="Paste URL or pick\u2026" style="flex:1;">
            <button class="btn btn-secondary" id="btn-pick-floorplan"
              style="padding:0 10px;border-radius:var(--radius-sm);">
              ${xIcon('folder', 14)}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="panel-actions" id="panel-actions-hotspot">
      <button class="btn btn-primary" id="btn-save-properties">
        ${xIcon('check', 14)}
        Save
      </button>
      <button class="btn btn-danger" id="btn-delete-hotspot">
        ${xIcon('trash', 14)}
        Delete
      </button>
    </div>

    <div class="panel-position" id="panel-position">
      <span>yaw: <span id="pos-yaw">0.00</span></span>
      <span>pitch: <span id="pos-pitch">0.00</span></span>
    </div>
  </div>
</div>
<!-- Props reopen tab -->
<div id="props-reopen-btn" title="Open Properties Panel" style="display:none;">
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
</div>

</div><!-- /pano-wrapper -->
</div><!-- /editor-main -->
</div><!-- /workspace-view -->`);s.remove()})();
