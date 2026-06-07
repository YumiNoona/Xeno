(()=>{const s=document.currentScript;s.insertAdjacentHTML('beforebegin',`<!-- Pano Workspace -->
<div id="pano-wrapper">
  <div id="pano"></div>

  <div id="xeno-minimap" class="xeno-minimap"></div>

  <div id="mode-badge">Select</div>

  <div id="view-controls-bar">
    <div class="view-control-field">
      <span>Yaw</span>
      <input type="number" id="bottom-view-yaw" value="0" min="-180" max="180">
    </div>
    <div class="view-control-field">
      <span>Pitch</span>
      <input type="number" id="bottom-view-pitch" value="0" min="-90" max="90">
    </div>
    <div class="view-control-field">
      <span>FOV</span>
      <input type="number" id="bottom-view-fov" step="1" min="60" max="120">
    </div>
    <div class="view-control-sep"></div>
    <button id="btn-save-view" title="Save current view as default for this scene">
      ${xIcon('check', 14)}
    </button>
  </div>

  <!-- Tools Pill -->
  <div id="tools-pill">
    <div class="pill-tool active" data-tool="select" title="Select">
      ${xIcon('cursor', 16)}
    </div>
    <div class="pill-sep"></div>
    <div class="pill-tool" data-tool="navigate" title="Navigate">
      ${xIcon('arrow-right', 16)}
    </div>
    <div class="pill-tool" data-tool="info" title="Info card">
      ${xIcon('info', 16)}
    </div>
    <div class="pill-tool" data-tool="url" title="URL link">
      ${xIcon('link', 16)}
    </div>
    <div class="pill-tool" data-tool="image" title="Image">
      ${xIcon('photo', 16)}
    </div>
    <div class="pill-tool" data-tool="video" title="Video">
      ${xIcon('video', 16)}
    </div>
    <div class="pill-tool" data-tool="audio" title="Audio">
      ${xIcon('volume', 16)}
    </div>
    <div class="pill-tool" data-tool="text" title="Text">
      ${xIcon('type', 16)}
    </div>
    <div class="pill-sep"></div>
    <div class="pill-tool" data-tool="narrator" title="Narrator (Auto Tour)">
      ${xIcon('narrator', 16)}
    </div>
    <div class="pill-tool" data-tool="ambient" title="Ambient Audio">
      ${xIcon('soundwave', 16)}
    </div>
  </div>

  <div class="resizer right-resizer" id="right-resizer"></div>`);s.remove()})();
