(function() {
  'use strict';
  var E = window.XenoEditor;
  var S = E.state;
  var D = E.dom;

  E.setupHotspotTypeListeners = function() {
    // ─── Info fields ─────────────────────────────────────
    D.propBodyText.addEventListener('input', function() {
      if (S.selectedHotspotData) S.selectedHotspotData.text = this.value;
      E.debouncedSave();
    });
    D.propLinkUrl.addEventListener('input', function() {
      if (S.selectedHotspotData) S.selectedHotspotData.linkUrl = this.value;
      E.debouncedSave();
    });
    D.propLinkLabel.addEventListener('input', function() {
      if (S.selectedHotspotData) S.selectedHotspotData.linkLabel = this.value;
      E.debouncedSave();
    });

    document.querySelectorAll('input[name="prop-link-type"]').forEach(function(r) {
      r.addEventListener('change', function() {
        var val = document.querySelector('input[name="prop-link-type"]:checked');
        var group = document.getElementById('info-scene-target-group');
        if (group) group.style.display = (val && val.value === 'scene') ? 'block' : 'none';
      });
    });

    D.propInfoTargetScene.addEventListener('change', function() {
      if (!S.selectedHotspotData) return;
      S.selectedHotspotData.linkTarget = this.value;
      var cur = D.propTitle.value.trim();
      if (!cur || cur.toLowerCase().indexOf('new ') === 0 || cur === '') {
        if (this.value) {
          var ts = S.scenes.find(function(s) { return s.data.id === D.propInfoTargetScene.value; });
          if (ts) {
            var sn = ts.data.name || '';
            D.propTitle.value = sn;
            S.selectedHotspotData.title = sn;
            S.selectedHotspotData.label = sn;
            E.renderSceneHotspots();
          }
        }
      }
      E.debouncedSave();
    });

    // ─── URL fields ──────────────────────────────────────
    D.propUrlHref.addEventListener('input', function() {
      if (S.selectedHotspotData) S.selectedHotspotData.urlHref = this.value;
      E.debouncedSave();
    });
    D.propUrlLabel.addEventListener('input', function() {
      if (S.selectedHotspotData) S.selectedHotspotData.urlLabel = this.value;
      E.debouncedSave();
    });
    D.propUrlOpenIn.addEventListener('change', function() {
      if (S.selectedHotspotData) S.selectedHotspotData.urlOpenIn = this.value;
      E.debouncedSave();
    });

    // ─── Image fields ────────────────────────────────────
    D.propImageUrl.addEventListener('input', function() {
      if (!S.selectedHotspotData) return;
      if (!S.selectedHotspotData.content) S.selectedHotspotData.content = {};
      S.selectedHotspotData.content.src = this.value;
      E.renderSceneHotspots();
      E.debouncedSave();
    });
    D.propImageCaption.addEventListener('input', function() {
      if (!S.selectedHotspotData) return;
      if (!S.selectedHotspotData.content) S.selectedHotspotData.content = {};
      S.selectedHotspotData.content.caption = this.value;
      E.debouncedSave();
    });
    D.propImageLink.addEventListener('input', function() {
      if (!S.selectedHotspotData) return;
      if (!S.selectedHotspotData.content) S.selectedHotspotData.content = {};
      S.selectedHotspotData.content.linkUrl = this.value;
      E.debouncedSave();
    });

    // ─── Video fields ────────────────────────────────────
    D.propVideoUrl.addEventListener('input', function() {
      if (!S.selectedHotspotData) return;
      if (!S.selectedHotspotData.content) S.selectedHotspotData.content = {};
      S.selectedHotspotData.content.src = this.value;
      E.renderSceneHotspots();
      E.debouncedSave();
    });
    D.propVideoAutoplay.addEventListener('change', function() {
      if (!S.selectedHotspotData) return;
      S.selectedHotspotData.autoplay = this.checked;
      E.debouncedSave();
    });
    D.propVideoLoop.addEventListener('change', function() {
      if (!S.selectedHotspotData) return;
      S.selectedHotspotData.loop = this.checked;
      E.debouncedSave();
    });
    D.propVideoMuted.addEventListener('change', function() {
      if (!S.selectedHotspotData) return;
      S.selectedHotspotData.muted = this.checked;
      E.debouncedSave();
    });

    // ─── Audio fields ────────────────────────────────────
    D.propAudioUrl.addEventListener('input', function() {
      if (!S.selectedHotspotData) return;
      if (!S.selectedHotspotData.content) S.selectedHotspotData.content = {};
      S.selectedHotspotData.content.src = this.value;
      E.renderSceneHotspots();
      E.debouncedSave();
    });
    D.propAudioAutoplay.addEventListener('change', function() {
      if (!S.selectedHotspotData) return;
      S.selectedHotspotData.autoplay = this.checked;
      E.debouncedSave();
    });
    D.propAudioLabel.addEventListener('change', function() {
      if (!S.selectedHotspotData) return;
      S.selectedHotspotData.showPlayerLabel = this.checked;
      E.debouncedSave();
    });
    D.propAudioNarration.addEventListener('change', function() {
      if (!S.selectedHotspotData) return;
      S.selectedHotspotData.narration = this.checked;
      E.debouncedSave();
    });

    // ─── Embed fields ────────────────────────────────────
    D.propEmbedCode.addEventListener('input', function() {
      if (S.selectedHotspotData) S.selectedHotspotData.embedCode = this.value;
      E.debouncedSave();
    });
    D.propEmbedWidth.addEventListener('input', function() {
      if (S.selectedHotspotData) S.selectedHotspotData.embedWidth = parseInt(this.value) || 480;
      E.debouncedSave();
    });
    D.propEmbedHeight.addEventListener('input', function() {
      if (S.selectedHotspotData) S.selectedHotspotData.embedHeight = parseInt(this.value) || 270;
      E.debouncedSave();
    });
    D.propEmbedPerspective.addEventListener('change', function() {
      if (!S.selectedHotspotData) return;
      S.selectedHotspotData.perspectiveEnabled = this.checked;
      D.perspectiveOptionsDiv.style.display = this.checked ? 'block' : 'none';
      E.renderSceneHotspots();
      E.debouncedSave();
    });
    D.propEmbedRadius.addEventListener('input', function() {
      if (!S.selectedHotspotData || !S.selectedHotspotElement || !S.selectedHotspotElement.__marzipanoHotspot) return;
      S.selectedHotspotData.perspectiveRadius = parseInt(this.value) || 1000;
      S.selectedHotspotElement.__marzipanoHotspot.setPerspective({
        radius: S.selectedHotspotData.perspectiveRadius,
        extraTransforms: S.selectedHotspotData.perspectiveTransform
      });
      E.debouncedSave();
    });
    D.propEmbedTransform.addEventListener('input', function() {
      if (!S.selectedHotspotData || !S.selectedHotspotElement || !S.selectedHotspotElement.__marzipanoHotspot) return;
      S.selectedHotspotData.perspectiveTransform = this.value;
      S.selectedHotspotElement.__marzipanoHotspot.setPerspective({
        radius: S.selectedHotspotData.perspectiveRadius,
        extraTransforms: S.selectedHotspotData.perspectiveTransform
      });
      E.debouncedSave();
    });

    // ─── Quad fields ─────────────────────────────────────
    D.propQuadCode.addEventListener('input', function() {
      if (S.selectedHotspotData) S.selectedHotspotData.embedCode = this.value;
      E.debouncedSave();
    });
    D.propQuadSrcWidth.addEventListener('input', function() {
      if (S.selectedHotspotData) S.selectedHotspotData.srcWidth = parseInt(this.value) || 480;
      E.debouncedSave();
    });
    D.propQuadSrcHeight.addEventListener('input', function() {
      if (S.selectedHotspotData) S.selectedHotspotData.srcHeight = parseInt(this.value) || 270;
      E.debouncedSave();
    });
    D.btnAddQuadPoint.addEventListener('click', function() {
      if (!S.selectedHotspotData) return;
      if (!S.selectedHotspotData.quadPoints) S.selectedHotspotData.quadPoints = [];
      if (S.selectedHotspotData.quadPoints.length < 4) {
        var view = S.viewer.lookAt();
        S.selectedHotspotData.quadPoints.push({ yaw: view.yaw, pitch: view.pitch });
        E.renderQuadPoints(S.selectedHotspotData.quadPoints);
        E.renderSceneHotspots();
        E.debouncedSave();
      } else {
        alert('You can only add up to 4 points for a quadrilateral hotspot.');
      }
    });
    D.btnClearQuadPoints.addEventListener('click', function() {
      if (!S.selectedHotspotData) return;
      S.selectedHotspotData.quadPoints = [];
      E.renderQuadPoints([]);
      E.renderSceneHotspots();
      E.debouncedSave();
    });

    // ─── Text fields ──────────────────────────────────
    D.propTextContent.addEventListener('input', function() {
      if (S.selectedHotspotData) S.selectedHotspotData.text = this.value;
      E.renderSceneHotspots();
      E.debouncedSave();
    });
    D.propTextBg.addEventListener('change', function() {
      if (S.selectedHotspotData) S.selectedHotspotData.bgColor = this.checked ? (D.propTextBgColor.value || 'rgba(0,0,0,0.7)') : 'transparent';
      E.renderSceneHotspots();
      E.debouncedSave();
    });
    D.propTextColor.addEventListener('input', function() {
      if (S.selectedHotspotData) S.selectedHotspotData.textColor = this.value;
      E.renderSceneHotspots();
      E.debouncedSave();
    });
    D.propTextBgColor.addEventListener('input', function() {
      if (S.selectedHotspotData && D.propTextBg.checked) S.selectedHotspotData.bgColor = this.value;
      E.renderSceneHotspots();
      E.debouncedSave();
    });
    D.propTextSize.addEventListener('input', function() {
      D.propTextSizeLabel.textContent = this.value + 'px';
      if (S.selectedHotspotData) S.selectedHotspotData.fontSize = parseInt(this.value);
      E.renderSceneHotspots();
      E.debouncedSave();
    });
    D.propTextFont.addEventListener('change', function() {
      if (S.selectedHotspotData) S.selectedHotspotData.fontFamily = this.value;
      E.renderSceneHotspots();
      E.debouncedSave();
    });
    D.propTextBold.addEventListener('change', function() {
      if (S.selectedHotspotData) S.selectedHotspotData.bold = this.checked;
      E.renderSceneHotspots();
      E.debouncedSave();
    });
    D.propTextItalic.addEventListener('change', function() {
      if (S.selectedHotspotData) S.selectedHotspotData.italic = this.checked;
      E.renderSceneHotspots();
      E.debouncedSave();
    });
    D.propTextUnderline.addEventListener('change', function() {
      if (S.selectedHotspotData) S.selectedHotspotData.underline = this.checked;
      E.renderSceneHotspots();
      E.debouncedSave();
    });
    D.propTextRotation.addEventListener('input', function() {
      D.propTextRotLabel.textContent = this.value + '\u00B0';
      if (S.selectedHotspotData) S.selectedHotspotData.rotation = parseInt(this.value);
      E.renderSceneHotspots();
      E.debouncedSave();
    });

    // ─── Narrator fields ─────────────────────────────
    D.propNarratorAudio.addEventListener('change', function() {
      if (S.selectedHotspotData) { S.selectedHotspotData.narratorAudio = this.value; E.debouncedSave(); }
    });
    D.propNarratorText.addEventListener('input', function() {
      if (S.selectedHotspotData) { S.selectedHotspotData.narratorText = this.value; E.debouncedSave(); }
    });
    D.propNarratorDuration.addEventListener('change', function() {
      if (S.selectedHotspotData) { S.selectedHotspotData.sceneDuration = parseInt(this.value) || 10; E.debouncedSave(); }
    });
    // ─── Ambient fields ──────────────────────────────
    D.propAmbientAudio.addEventListener('change', function() {
      if (S.selectedHotspotData) { S.selectedHotspotData.ambientAudio = this.value; E.debouncedSave(); }
    });
    D.propAmbientLoop.addEventListener('change', function() {
      if (S.selectedHotspotData) { S.selectedHotspotData.ambientLoop = this.checked; E.debouncedSave(); }
    });
    D.propAmbientAutoplay.addEventListener('change', function() {
      if (S.selectedHotspotData) { S.selectedHotspotData.ambientAutoplay = this.checked; E.debouncedSave(); }
    });
    D.propAmbientVolume.addEventListener('input', function() {
      if (S.selectedHotspotData) { S.selectedHotspotData.ambientVolume = parseInt(this.value); E.debouncedSave(); }
    });
    D.propAmbientRadius.addEventListener('input', function() {
      if (S.selectedHotspotData) { S.selectedHotspotData.ambientRadius = parseInt(this.value); E.debouncedSave(); }
    });
  };
})();
