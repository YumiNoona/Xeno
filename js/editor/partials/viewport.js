(()=>{const s=document.currentScript;s.insertAdjacentHTML('beforebegin',`<!-- Pano Workspace -->
<div id="pano-wrapper">
  <div id="pano"></div>

  <div id="xeno-minimap" class="xeno-minimap"></div>

  <div id="mode-badge">Select</div>

  <div id="view-controls-bar">
    <div class="view-control-field">
      <span>Yaw</span>
      <input type="number" id="bottom-view-yaw" step="1">
    </div>
    <div class="view-control-field">
      <span>Pitch</span>
      <input type="number" id="bottom-view-pitch" step="1">
    </div>
    <div class="view-control-field">
      <span>FOV</span>
      <input type="number" id="bottom-view-fov" step="1" min="60" max="120">
    </div>
    <button id="btn-save-view">
      ${xIcon('camera', 14)}
      Save Default View
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
    <div class="pill-tool" data-tool="autorotate" title="Autorotate">
      ${xIcon('rotate-cw', 16)}
    </div>
    <div class="pill-tool" data-tool="minimap" title="Minimap">
      ${xIcon('map', 16)}
    </div>
  </div>

  <div class="resizer right-resizer" id="right-resizer"></div>`);s.remove()})();
