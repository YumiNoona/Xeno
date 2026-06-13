window.XenoTemplates = window.XenoTemplates || {};
window.XenoTemplates.hotspotFields = function() {
  return `<div id="fields-hotspot-properties">
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
        <option value="text">Text Label</option>
        <option value="narrator">Narrator (Auto Tour)</option>
        <option value="ambient">Ambient Audio</option>
      </select>
    </div>
    <div class="form-group" id="group-hotspot-title">
      <label>Label / Title</label>
      <input type="text" id="prop-title" placeholder="Hotspot title">
    </div>
    <div class="form-group" id="group-hotspot-animation">
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
    <div id="group-hotspot-generic">
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
        <option value="star">Star</option>
        <option value="question">Question</option>
        <option value="warning">Warning</option>
        <option value="stairs">Stairs</option>
        <option value="expand">Expand</option>
        <option value="custom">Custom Image</option>
      </select>
    </div>

    <div class="form-group">
      <div style="display:flex;gap:10px;align-items:flex-start;">
        <div id="group-icon-color">
          <label>Color</label>
            <label style="display:block;width:32px;height:32px;border:2px solid var(--border);cursor:pointer;position:relative;">
              <input type="color" id="prop-icon-color" value="#ffffff" style="position:absolute;inset:0;opacity:0;cursor:pointer;">
              <span id="prop-icon-color-swatch" style="display:block;width:100%;height:100%;background:#fff;"></span>
            </label>

        </div>
        <div style="flex:1;margin-left:12px;">
          <label>Size</label>
          <div class="hs-stepper" style="align-items:stretch;">
            <span id="prop-size-label" style="height:32px;display:flex;align-items:center;">44px</span>
            <div class="hs-stepper-btns">
              <button class="hs-stepper-up" data-target="prop-icon-size" data-delta="2" style="height:15px;">&#9650;</button>
              <button class="hs-stepper-down" data-target="prop-icon-size" data-delta="-2" style="height:15px;">&#9660;</button>
            </div>
          </div>
          <input type="hidden" id="prop-icon-size" value="44" min="24" max="96">
        </div>
      </div>
    </div>

    <div class="form-group toggle-group" style="padding-top:20px;" id="group-outer-ring">
      <label>Outer Ring</label>
      <input type="checkbox" id="prop-ring-enabled" checked>
    </div>

    <div id="group-ring-props" style="display:none;padding-top:12px;">
      <div class="form-group">
        <div style="display:flex;gap:10px;align-items:flex-start;">
          <div>
            <label>Color</label>
            <label style="display:block;width:32px;height:32px;border:2px solid var(--border);cursor:pointer;position:relative;">
              <input type="color" id="prop-ring-color" value="#ffffff" style="position:absolute;inset:0;opacity:0;cursor:pointer;">
              <span id="prop-ring-color-swatch" style="display:block;width:100%;height:100%;background:#fff;"></span>
            </label>
          </div>
          <div style="flex:1;margin-left:12px;">
            <label>Thickness</label>
            <div class="hs-stepper" style="align-items:stretch;">
              <span id="prop-ring-size-label" style="height:32px;display:flex;align-items:center;">2px</span>
              <div class="hs-stepper-btns">
                <button class="hs-stepper-up" data-target="prop-ring-size" data-delta="1" style="height:15px;">&#9650;</button>
                <button class="hs-stepper-down" data-target="prop-ring-size" data-delta="-1" style="height:15px;">&#9660;</button>
              </div>
            </div>
            <input type="hidden" id="prop-ring-size" value="2" min="1" max="8">
          </div>
          <div style="flex:1;">
            <label>Ring Gap</label>
            <div class="hs-stepper" style="align-items:stretch;">
              <span id="prop-ring-gap-label" style="height:32px;display:flex;align-items:center;">6px</span>
              <div class="hs-stepper-btns">
                <button class="hs-stepper-up" data-target="prop-ring-gap" data-delta="1" style="height:15px;">&#9650;</button>
                <button class="hs-stepper-down" data-target="prop-ring-gap" data-delta="-1" style="height:15px;">&#9660;</button>
              </div>
            </div>
            <input type="hidden" id="prop-ring-gap" value="6" min="1" max="20">
          </div>
        </div>
      </div>
      <div class="form-group" style="padding-top:10px;">
        <div style="display:flex;gap:10px;align-items:flex-start;">
          <div style="flex:1;">
            <label>No. of Rings</label>
            <div class="hs-stepper">
              <span id="prop-ring-count-label" style="min-width:24px;">1</span>
              <div class="hs-stepper-btns">
                <button class="hs-stepper-up" data-target="prop-ring-count" data-delta="1" style="height:15px;">&#9650;</button>
                <button class="hs-stepper-down" data-target="prop-ring-count" data-delta="-1" style="height:15px;">&#9660;</button>
              </div>
            </div>
            <input type="hidden" id="prop-ring-count" value="1" min="1" max="3">
          </div>
        </div>
      </div>
    </div>
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
    </div><!-- /group-hotspot-generic -->

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
        <label>Mute</label>
        <input type="checkbox" id="prop-audio-muted">
      </div>
      <div class="form-group" id="group-audio-volume">
        <label>Volume <span id="prop-audio-vol-label">100%</span></label>
        <input type="range" id="prop-audio-volume" min="0" max="100" value="100" step="5">
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

    <!-- Text fields -->
    <div class="type-fields" id="fields-text" style="display:none;">
      <div class="form-group">
        <label>Text Content</label>
        <textarea id="prop-text-content" placeholder="Enter text to display on the tour..." rows="4" style="width:100%;resize:vertical;"></textarea>
      </div>
      <div class="form-group toggle-group">
        <label>Background</label>
        <input type="checkbox" id="prop-text-bg" checked>
      </div>
      <div class="form-group">
        <div style="display:flex;gap:10px;align-items:flex-start;">
          <div style="flex:1;">
            <label>Text Color</label>
            <label style="display:block;width:32px;height:32px;border:2px solid var(--border);cursor:pointer;position:relative;">
              <input type="hidden" id="prop-text-color" value="#ffffff">
              <span id="prop-text-color-swatch" style="display:block;width:100%;height:100%;background:#fff;"></span>
            </label>
          </div>
          <div style="flex:1;" id="group-text-bg-color">
            <label>Background Color</label>
            <label style="display:block;width:32px;height:32px;border:2px solid var(--border);cursor:pointer;position:relative;">
              <input type="hidden" id="prop-text-bg-color" value="#000000">
              <span id="prop-text-bg-color-swatch" style="display:block;width:100%;height:100%;background:#000;"></span>
            </label>
          </div>
        </div>
      </div>
      <div class="form-group">
        <label>Font Size <span id="prop-text-size-label">14px</span></label>
        <input type="range" id="prop-text-size" min="10" max="48" value="14" step="1">
      </div>
      <div class="form-group">
        <label>Rotation <span id="prop-text-rot-label">0°</span></label>
        <input type="range" id="prop-text-rotation" min="-180" max="180" value="0" step="1">
      </div>
      <div class="form-group">
        <label>Font Family</label>
        <select id="prop-text-font">
          <option value="">Default</option>
          <option value="Arial, sans-serif">Arial</option>
          <option value="'Helvetica Neue', sans-serif">Helvetica</option>
          <option value="Georgia, serif">Georgia</option>
          <option value="'Times New Roman', serif">Times New Roman</option>
          <option value="'Courier New', monospace">Courier</option>
          <option value="Verdana, sans-serif">Verdana</option>
          <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
          <option value="Impact, fantasy">Impact</option>
          <option value="'Comic Sans MS', cursive">Comic Sans</option>
        </select>
      </div>
      <div class="form-group" style="display:flex;gap:16px;align-items:center;">
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;">
          <input type="checkbox" id="prop-text-bold"><strong>B</strong>
        </label>
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;">
          <input type="checkbox" id="prop-text-italic"><em>I</em>
        </label>
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;">
          <input type="checkbox" id="prop-text-underline"><u>U</u>
        </label>
      </div>
    </div>

    <!-- Narrator fields -->
    <div class="type-fields" id="fields-narrator" style="display:none;">
      <div class="form-group">
        <label>Audio URL</label>
        <div style="display:flex;gap:8px;">
          <input type="text" id="prop-narrator-audio" placeholder="Narration audio URL\u2026" style="flex:1;">
          <button class="btn btn-secondary" id="btn-pick-narrator-audio"
            style="padding:0 10px;border-radius:var(--radius-sm);">
            ${xIcon('folder', 14)}
          </button>
        </div>
      </div>
      <div class="form-group">
        <label>Caption Text</label>
        <textarea id="prop-narrator-text" placeholder="Welcome to the tour\u2026" rows="2"></textarea>
      </div>
      <div class="form-group">
        <label>Scene Duration (seconds)</label>
        <input type="number" id="prop-narrator-duration" min="3" max="120" value="10" step="1">
      </div>
    </div>

    <!-- Ambient fields -->
    <div class="type-fields" id="fields-ambient" style="display:none;">
      <div class="form-group">
        <label>Audio URL</label>
        <div style="display:flex;gap:8px;">
          <input type="text" id="prop-ambient-audio" placeholder="Ambient sound URL\u2026" style="flex:1;">
          <button class="btn btn-secondary" id="btn-pick-ambient-audio"
            style="padding:0 10px;border-radius:var(--radius-sm);">
            ${xIcon('folder', 14)}
          </button>
        </div>
      </div>
      <div class="form-group toggle-group">
        <label>Auto-play on enter</label>
        <input type="checkbox" id="prop-ambient-autoplay" checked>
      </div>
      <div class="form-group toggle-group">
        <label>Loop Audio</label>
        <input type="checkbox" id="prop-ambient-loop" checked>
      </div>
      <div class="form-group">
        <label>Max Volume <span id="prop-ambient-vol-label">70%</span></label>
        <input type="range" id="prop-ambient-volume" min="10" max="100" value="70" step="5">
      </div>
      <div class="form-group">
        <label>Fade Radius (degrees)</label>
        <input type="range" id="prop-ambient-radius" min="10" max="90" value="30" step="5">
      </div>
    </div>

    </div><!-- /#fields-hotspot-properties -->`;
};
