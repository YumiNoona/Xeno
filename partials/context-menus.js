(()=>{const s=document.currentScript;s.insertAdjacentHTML('beforebegin',`<!-- Context Menus -->
<div id="context-menu">
  <div class="ctx-item" data-action="rename">
    ${xIcon('edit', 14)}
    Rename
  </div>
  <div class="ctx-item" data-action="set-default">
    ${xIcon('star', 14)}
    Set as Default
  </div>
  <div class="ctx-item" data-action="duplicate">
    ${xIcon('copy', 14)}
    Duplicate
  </div>
  <div class="ctx-sep"></div>
  <div class="ctx-item ctx-danger" data-action="delete">
    ${xIcon('trash', 14)}
    Delete Scene
  </div>
</div>

<div id="media-folder-ctx" class="xeno-ctx-menu">
  <div class="ctx-item" data-action="rename-folder">
    ${xIcon('edit', 14)}
    Rename Album
  </div>
  <div class="ctx-sep"></div>
  <div class="ctx-item ctx-danger" data-action="delete-folder">
    ${xIcon('trash', 14)}
    Delete Album
  </div>
</div>

<div id="media-item-ctx" class="xeno-ctx-menu">
  <div class="ctx-item" data-action="rename-media">
    ${xIcon('edit', 14)}
    Rename
  </div>
  <div class="ctx-item" data-action="move-media">
    ${xIcon('move', 14)}
    Move to Album
  </div>
  <div class="ctx-item" data-action="download-media">
    ${xIcon('download', 14)}
    Download
  </div>
  <div class="ctx-sep"></div>
  <div class="ctx-item ctx-danger" data-action="delete-media">
    ${xIcon('trash', 14)}
    Delete
  </div>
</div>

<!-- Move Media Modal -->
<div id="move-media-modal" class="move-modal-overlay">
  <div class="move-modal-content">
    <div class="move-modal-header">
      <h3>Move Media</h3>
      <button class="close-move-modal" id="btn-close-move-modal">\u00D7</button>
    </div>
    <div class="move-modal-body">
      <div class="form-group">
        <label>Target Album</label>
        <select id="move-target-album"></select>
      </div>
    </div>
    <div class="move-modal-actions">
      <button class="btn" id="btn-cancel-move">Cancel</button>
      <button class="btn btn-primary" id="btn-confirm-move">Move</button>
    </div>
  </div>
</div>`);s.remove()})();
