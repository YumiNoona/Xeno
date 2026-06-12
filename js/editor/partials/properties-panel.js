(()=>{
  var html = `<!-- Properties Panel -->
<div id="properties-panel">
  <div class="panel-header">
    <h3 id="panel-title">Hotspot Properties</h3>
    <button class="close-panel" id="btn-close-properties">
      ${xIcon('x', 16)}
    </button>
  </div>
  <div class="panel-body">

    ${window.XenoTemplates && window.XenoTemplates.hotspotFields ? XenoTemplates.hotspotFields() : ''}

    ${window.XenoTemplates && window.XenoTemplates.projectSettings ? XenoTemplates.projectSettings() : ''}

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

        </div>

      </div>
<!-- /pano-wrapper -->
</div><!-- /editor-main -->
</div><!-- /workspace-view -->

${window.XenoTemplates && window.XenoTemplates.colorPicker ? XenoTemplates.colorPicker() : ''}`;

  var s = document.currentScript;
  s.insertAdjacentHTML('beforebegin', html);
  s.remove();
})();
