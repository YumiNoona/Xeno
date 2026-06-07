(function() {
  'use strict';
  var E = window.XenoEditor;
  var S = E.state;
  var D = E.dom;

  E.setupHotspotProps = function() {
    // ─── Open / Close ────────────────────────────────────
    E.openPropertiesPanel = function(hsData) {
      S.selectedHotspotData = hsData;
      // Hide all non-hotspot sections
      D.fieldsSceneSettings.style.display = 'none';
      D.fieldsProjectSettings.style.display = 'none';
      D.panelTitle.textContent = 'Hotspot Properties';
      D.panelActionsHotspot.style.display = 'flex';
      D.panelPosition.style.display = 'flex';
      D.fieldsHotspotProperties.style.display = 'block';

      D.propType.value = hsData.type || 'info';
      D.propTitle.value = hsData.title || hsData.label || '';
      D.propAnimation.value = hsData.animation || 'none';
      D.propIconStyle.value = hsData.iconStyle || 'default';
      D.propCustomIconUrl.value = hsData.customIconUrl || '';
      D.propRingEnabled.checked = hsData.ringEnabled !== false;
      D.propIconColor.value = hsData.iconColor || '#ffffff';
      D.propRingColor.value = hsData.ringColor || '#ffffff';

      var rSize = hsData.ringSize || 2;
      D.propRingSize.value = rSize;
      D.propRingSizeLabel.textContent = rSize + 'px';

      var rGap = hsData.ringGap || 6;
      D.propRingGap.value = rGap;
      D.propRingGapLabel.textContent = rGap + 'px';

      var rCount = hsData.ringCount || 1;
      document.querySelectorAll('.ring-count-btn').forEach(function(btn) {
        btn.classList.toggle('active', parseInt(btn.getAttribute('data-count')) === rCount);
      });
      D.groupRingGap.style.display = rCount > 1 ? 'block' : 'none';

      var size = hsData.iconSize || 44;
      D.propIconSize.value = size;
      D.propSizeLabel.textContent = size + 'px';

      toggleCustomIconGroup();
      D.posYaw.textContent = ((hsData.yaw || 0) * 180 / Math.PI).toFixed(0);
      D.posPitch.textContent = ((hsData.pitch || 0) * 180 / Math.PI).toFixed(0);

      populateTargetDropdowns();
      fillTypeFields(hsData);
      showTypeFields(hsData.type);

      D.propsPanel.classList.add('visible');
      setTimeout(function() { if (S.viewer) S.viewer.updateSize(); }, 250);
      E.startViewReadLoop();
    };

    E.closePropertiesPanel = function() {
      S.selectedHotspotData = null;
      var ps = document.getElementById('fields-project-settings');
      if (ps) ps.style.display = 'none';
      var pa = document.getElementById('panel-actions-project');
      if (pa) pa.style.display = 'none';
      D.fieldsHotspotProperties.style.display = 'none';
      D.fieldsSceneSettings.style.display = 'none';
      D.propsPanel.classList.remove('visible');
      setTimeout(function() { if (S.viewer) S.viewer.updateSize(); }, 250);
    };

    // ─── Type field visibility ───────────────────────────
    function hideAllTypeFields() {
      document.querySelectorAll('.type-fields').forEach(function(f) { f.style.display = 'none'; });
    }

    function showTypeFields(type) {
      hideAllTypeFields();
      var el = document.getElementById('fields-' + type);
      if (el) el.style.display = 'block';
      var gen = document.getElementById('group-hotspot-generic');
      if (gen) gen.style.display = type === 'text' ? 'none' : '';
      var title = document.getElementById('group-hotspot-title');
      if (title) title.style.display = type === 'text' ? 'none' : '';
    }

    function fillTypeFields(hsData) {
      D.propTargetScene.value = hsData.target || '';
      D.propTransition.value = hsData.transition || 'opacity';
      D.propTransDuration.value = hsData.transitionDuration || 800;
      D.propTransDurLabel.textContent = (hsData.transitionDuration || 800) + 'ms';
      D.propBodyText.value = hsData.text || '';
      D.propLinkUrl.value = hsData.linkUrl || '';
      D.propLinkLabel.value = hsData.linkLabel || '';
      document.querySelectorAll('input[name="prop-link-type"]').forEach(function(r) { r.checked = r.value === (hsData.linkType || 'external'); });
      D.propInfoTargetScene.value = hsData.linkTarget || '';
      toggleInfoSceneTarget();
      D.propUrlHref.value = hsData.urlHref || '';
      D.propUrlLabel.value = hsData.urlLabel || 'Open link';
      D.propUrlOpenIn.value = hsData.urlOpenIn || 'newtab';
      D.propImageUrl.value = (hsData.content && hsData.content.src) || '';
      D.propImageCaption.value = (hsData.content && hsData.content.caption) || '';
      D.propImageLink.value = (hsData.content && hsData.content.linkUrl) || '';
      D.propVideoUrl.value = (hsData.content && hsData.content.src) || '';
      D.propVideoAutoplay.checked = hsData.autoplay === true;
      D.propVideoLoop.checked = hsData.loop !== false;
      D.propVideoMuted.checked = hsData.muted !== false;
      D.propAudioUrl.value = (hsData.content && hsData.content.src) || '';
      D.propAudioAutoplay.checked = hsData.autoplay === true;
      D.propAudioLabel.checked = hsData.showPlayerLabel !== false;
      D.propEmbedCode.value = hsData.embedCode || '';
      D.propEmbedWidth.value = hsData.embedWidth || 480;
      D.propEmbedHeight.value = hsData.embedHeight || 270;
      D.propEmbedPerspective.checked = hsData.perspectiveEnabled === true;
      D.propEmbedRadius.value = hsData.perspectiveRadius || 1000;
      D.propEmbedTransform.value = hsData.perspectiveTransform || '';
      D.perspectiveOptionsDiv.style.display = hsData.perspectiveEnabled ? 'block' : 'none';
      D.propQuadCode.value = hsData.embedCode || '';
      D.propQuadSrcWidth.value = hsData.srcWidth || 480;
      D.propQuadSrcHeight.value = hsData.srcHeight || 270;
      E.renderQuadPoints(hsData.quadPoints || []);
      D.propTextContent.value = hsData.text || '';
      D.propTextBg.checked = hsData.bgColor !== 'transparent';
      D.propTextColor.value = hsData.textColor || '#ffffff';
      D.propTextBgColor.value = (hsData.bgColor && hsData.bgColor !== 'transparent') ? hsData.bgColor : '#000000';
      D.propTextSize.value = hsData.fontSize || 14;
      D.propTextSizeLabel.textContent = (hsData.fontSize || 14) + 'px';
      D.propTextFont.value = hsData.fontFamily || '';
      D.propTextBold.checked = hsData.bold === true;
      D.propTextItalic.checked = hsData.italic === true;
      D.propTextUnderline.checked = hsData.underline === true;
      D.propTextRotation.value = hsData.rotation || 0;
      D.propTextRotLabel.textContent = (hsData.rotation || 0) + '\u00B0';
    }

    function toggleCustomIconGroup() {
      D.groupCustomIcon.style.display = D.propIconStyle.value === 'custom' ? 'block' : 'none';
    }

    function toggleInfoSceneTarget() {
      var val = document.querySelector('input[name="prop-link-type"]:checked');
      var group = document.getElementById('info-scene-target-group');
      if (group) group.style.display = (val && val.value === 'scene') ? 'block' : 'none';
    }

    function populateTargetDropdowns() {
      var currentId = S.currentSceneCtx ? S.currentSceneCtx.data.id : null;
      [D.propTargetScene, D.propInfoTargetScene].forEach(function(sel) {
        if (!sel) return;
        var last = sel.value;
        sel.innerHTML = '<option value="">-- select --</option>';
        S.scenes.forEach(function(s) {
          if (s.data.id === currentId) return;
          var opt = document.createElement('option');
          opt.value = s.data.id;
          opt.textContent = s.data.name;
          sel.appendChild(opt);
        });
        sel.value = last;
      });
    }

    E.populateTargetDropdowns = populateTargetDropdowns;

    // ─── Common field listeners ──────────────────────────
    D.propType.addEventListener('change', function() {
      if (!S.selectedHotspotData) return;
      S.selectedHotspotData.type = this.value;
      S.selectedHotspotData.style = this.value;
      var defaultIcon = {navigate:'arrow',info:'info',image:'photo',video:'camera',audio:'volume',url:'link'}[this.value];
      if (defaultIcon) {
        S.selectedHotspotData.iconStyle = defaultIcon;
        D.propIconStyle.value = defaultIcon;
      }
      showTypeFields(this.value);
    });

    D.propTitle.addEventListener('input', function() {
      if (!S.selectedHotspotData) return;
      S.selectedHotspotData.title = this.value;
      S.selectedHotspotData.label = this.value;
      if (S.selectedHotspotElement) {
        var tip = S.selectedHotspotElement.querySelector('.link-tooltip, .info-title, .tip p, .scene-card-label, .tip');
        if (tip) tip.textContent = this.value;
      }
      E.debouncedSave();
    });

    D.propAnimation.addEventListener('change', function() {
      if (!S.selectedHotspotData) return;
      S.selectedHotspotData.animation = this.value;
      E.renderSceneHotspots();
      E.debouncedSave();
    });

    D.propIconStyle.addEventListener('change', function() {
      toggleCustomIconGroup();
      if (!S.selectedHotspotData) return;
      S.selectedHotspotData.iconStyle = this.value;
      E.renderSceneHotspots();
      E.debouncedSave();
    });

    D.propCustomIconUrl.addEventListener('input', function() {
      if (!S.selectedHotspotData || D.propIconStyle.value !== 'custom') return;
      S.selectedHotspotData.customIconUrl = this.value;
      E.renderSceneHotspots();
      E.debouncedSave();
    });

    D.propIconColor.addEventListener('input', function() {
      if (!S.selectedHotspotData) return;
      S.selectedHotspotData.iconColor = this.value;
      if (S.selectedHotspotElement) {
        var svg = S.selectedHotspotElement.querySelector('svg');
        if (svg) svg.style.color = this.value;
        var inner = S.selectedHotspotElement.querySelector('.in');
        if (inner) inner.style.backgroundColor = this.value;
      }
      E.debouncedSave();
    });

    D.btnResetIconColor.addEventListener('click', function() {
      D.propIconColor.value = '#ffffff';
      if (S.selectedHotspotData) {
        S.selectedHotspotData.iconColor = '#ffffff';
        E.renderSceneHotspots();
        E.debouncedSave();
      }
    });

    D.propRingColor.addEventListener('input', function() {
      if (!S.selectedHotspotData) return;
      S.selectedHotspotData.ringColor = this.value;
      E.renderSceneHotspots();
      E.debouncedSave();
    });

    D.btnResetRingColor.addEventListener('click', function() {
      D.propRingColor.value = '#ffffff';
      if (S.selectedHotspotData) {
        S.selectedHotspotData.ringColor = '#ffffff';
        E.renderSceneHotspots();
        E.debouncedSave();
      }
    });

    D.propRingEnabled.addEventListener('change', function() {
      if (!S.selectedHotspotData) return;
      S.selectedHotspotData.ringEnabled = this.checked;
      if (S.selectedHotspotElement) {
        var ringTarget = S.selectedHotspotElement.querySelector('.link-icon-wrapper, .icon_wrapper, .out');
        if (ringTarget) ringTarget.classList.toggle('has-ring', this.checked);
        else S.selectedHotspotElement.classList.toggle('has-ring', this.checked);
      }
      E.renderSceneHotspots();
      E.debouncedSave();
    });

    D.propRingSize.addEventListener('input', function() {
      var v = parseInt(this.value);
      D.propRingSizeLabel.textContent = v + 'px';
      if (!S.selectedHotspotData) return;
      S.selectedHotspotData.ringSize = v;
      E.renderSceneHotspots();
      E.debouncedSave();
    });

    D.propRingGap.addEventListener('input', function() {
      var v = parseInt(this.value);
      D.propRingGapLabel.textContent = v + 'px';
      if (!S.selectedHotspotData) return;
      S.selectedHotspotData.ringGap = v;
      E.renderSceneHotspots();
      E.debouncedSave();
    });

    document.querySelectorAll('.ring-count-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.ring-count-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var count = parseInt(btn.getAttribute('data-count'));
        D.groupRingGap.style.display = count > 1 ? 'block' : 'none';
        if (!S.selectedHotspotData) return;
        S.selectedHotspotData.ringCount = count;
        E.renderSceneHotspots();
        E.debouncedSave();
      });
    });

    D.propIconSize.addEventListener('input', function() {
      var size = parseInt(this.value);
      D.propSizeLabel.textContent = size + 'px';
      if (S.selectedHotspotData) {
        S.selectedHotspotData.iconSize = size;
        if (S.selectedHotspotElement) E.applyIconSize(S.selectedHotspotElement, size);
        E.debouncedSave();
      }
    });

    // ─── Save / Delete / Close ───────────────────────────
    document.getElementById('btn-save-properties').addEventListener('click', function() {
      if (!S.selectedHotspotData) return;
      S.selectedHotspotData.type = D.propType.value;
      S.selectedHotspotData.style = D.propType.value;
      S.selectedHotspotData.title = D.propTitle.value;
      S.selectedHotspotData.label = D.propTitle.value;
      S.selectedHotspotData.animation = D.propAnimation.value;
      S.selectedHotspotData.iconStyle = D.propIconStyle.value;
      S.selectedHotspotData.customIconUrl = D.propIconStyle.value === 'custom' ? D.propCustomIconUrl.value : null;
      S.selectedHotspotData.ringEnabled = D.propRingEnabled.checked;
      S.selectedHotspotData.iconColor = D.propIconColor.value;
      S.selectedHotspotData.ringColor = D.propRingColor.value;
      S.selectedHotspotData.ringSize = parseInt(D.propRingSize.value);
      S.selectedHotspotData.ringGap = parseInt(D.propRingGap.value);
      var activeCountBtn = document.querySelector('.ring-count-btn.active');
      S.selectedHotspotData.ringCount = activeCountBtn ? parseInt(activeCountBtn.getAttribute('data-count')) : 1;
      S.selectedHotspotData.iconSize = parseInt(D.propIconSize.value);

      if (S.selectedHotspotData.type === 'navigate') {
        S.selectedHotspotData.target = D.propTargetScene.value;
        S.selectedHotspotData.transition = D.propTransition.value;
        S.selectedHotspotData.transitionDuration = parseInt(D.propTransDuration.value);
      } else if (S.selectedHotspotData.type === 'info') {
        S.selectedHotspotData.text = D.propBodyText.value;
        S.selectedHotspotData.linkUrl = D.propLinkUrl.value;
        S.selectedHotspotData.linkLabel = D.propLinkLabel.value;
        var lv = document.querySelector('input[name="prop-link-type"]:checked');
        S.selectedHotspotData.linkType = lv ? lv.value : 'external';
        S.selectedHotspotData.linkTarget = D.propInfoTargetScene.value;
      } else if (S.selectedHotspotData.type === 'url') {
        S.selectedHotspotData.urlHref = D.propUrlHref.value;
        S.selectedHotspotData.urlLabel = D.propUrlLabel.value;
        S.selectedHotspotData.urlOpenIn = D.propUrlOpenIn.value;
      } else if (S.selectedHotspotData.type === 'image') {
        if (!S.selectedHotspotData.content) S.selectedHotspotData.content = {};
        S.selectedHotspotData.content.src = D.propImageUrl.value;
        S.selectedHotspotData.content.caption = D.propImageCaption.value;
        S.selectedHotspotData.content.linkUrl = D.propImageLink.value;
      } else if (S.selectedHotspotData.type === 'video') {
        if (!S.selectedHotspotData.content) S.selectedHotspotData.content = {};
        S.selectedHotspotData.content.src = D.propVideoUrl.value;
        S.selectedHotspotData.autoplay = D.propVideoAutoplay.checked;
        S.selectedHotspotData.loop = D.propVideoLoop.checked;
        S.selectedHotspotData.muted = D.propVideoMuted.checked;
      } else if (S.selectedHotspotData.type === 'audio') {
        if (!S.selectedHotspotData.content) S.selectedHotspotData.content = {};
        S.selectedHotspotData.content.src = D.propAudioUrl.value;
        S.selectedHotspotData.autoplay = D.propAudioAutoplay.checked;
        S.selectedHotspotData.showPlayerLabel = D.propAudioLabel.checked;
      } else if (S.selectedHotspotData.type === 'text') {
        S.selectedHotspotData.text = D.propTextContent.value;
        S.selectedHotspotData.textColor = D.propTextColor.value;
        S.selectedHotspotData.bgColor = D.propTextBg.checked ? D.propTextBgColor.value : 'transparent';
        S.selectedHotspotData.fontSize = parseInt(D.propTextSize.value);
        S.selectedHotspotData.fontFamily = D.propTextFont.value || null;
        S.selectedHotspotData.bold = D.propTextBold.checked;
        S.selectedHotspotData.italic = D.propTextItalic.checked;
        S.selectedHotspotData.underline = D.propTextUnderline.checked;
        S.selectedHotspotData.rotation = parseInt(D.propTextRotation.value) || 0;
      }
      E.renderSceneHotspots();
      E.closePropertiesPanel();
      E.debouncedSave();
    });

    document.getElementById('btn-delete-hotspot').addEventListener('click', function() {
      if (!S.selectedHotspotData || !S.currentSceneCtx) return;
      if (!confirm('Delete this hotspot?')) return;
      var arr = S.currentSceneCtx.data.hotspots || [];
      var idx = arr.indexOf(S.selectedHotspotData);
      if (idx !== -1) arr.splice(idx, 1);
      E.renderSceneHotspots();
      E.closePropertiesPanel();
      E.debouncedSave();
    });

    document.getElementById('btn-close-properties').addEventListener('click', E.closePropertiesPanel);

    // ─── Media picker binding ────────────────────────────
    function bindMediaField(inputEl, pickBtn) {
      if (!pickBtn) return;
      pickBtn.addEventListener('click', function() {
        S.mediaPickerCallback = function(url) {
          inputEl.value = url;
          inputEl.dispatchEvent(new Event('change'));
          inputEl.dispatchEvent(new Event('input'));
        };
        E.openMediaModal();
      });
    }

    bindMediaField(D.propCustomIconUrl, D.btnPickCustomIcon);
    bindMediaField(D.propImageUrl, D.btnPickImage);
    bindMediaField(D.propVideoUrl, D.btnPickVideo);
    bindMediaField(D.propAudioUrl, D.btnPickAudio);
    bindMediaField(D.propFloorplanUrl, D.btnPickFloorplan);

    // ─── Position editable fields ────────────────────────
    D.posYaw.addEventListener('input', function() {
      if (!S.selectedHotspotData) return;
      S.selectedHotspotData.yaw = parseFloat(this.textContent) * Math.PI / 180;
      E.renderSceneHotspots();
      E.debouncedSave();
    });
    D.posPitch.addEventListener('input', function() {
      if (!S.selectedHotspotData) return;
      S.selectedHotspotData.pitch = parseFloat(this.textContent) * Math.PI / 180;
      E.renderSceneHotspots();
      E.debouncedSave();
    });

    // Setup type-specific listeners from the other module
    E.setupHotspotTypeListeners();
  };
})();