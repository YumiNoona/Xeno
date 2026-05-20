/*
 * Xeno — Video Asset Wrapper
 * Adapted from Marzipano demos to support 360° video scenes.
 */
'use strict';

(function() {

  function XenoVideoAsset() {
    this._videoElement = null;
    this._destroyed = false;
    this._emitChange = this.emit.bind(this, 'change');
    this._lastTimestamp = -1;

    this._emptyCanvas = document.createElement('canvas');
    this._emptyCanvas.width = 1;
    this._emptyCanvas.height = 1;
  }

  // We must use Xeno's internal eventEmitter mechanism if it's exposed,
  // or provide a simple one. The original demo uses Marzipano.dependencies.eventEmitter.
  if (window.Xeno && window.Xeno.dependencies && window.Xeno.dependencies.eventEmitter) {
    window.Xeno.dependencies.eventEmitter(XenoVideoAsset);
  } else {
    // Simple fallback EventEmitter if dependencies is stripped
    XenoVideoAsset.prototype.on = function(event, handler) {
      this._handlers = this._handlers || {};
      this._handlers[event] = this._handlers[event] || [];
      this._handlers[event].push(handler);
    };
    XenoVideoAsset.prototype.emit = function(event) {
      this._handlers = this._handlers || {};
      var handlers = this._handlers[event] || [];
      for (var i = 0; i < handlers.length; i++) {
        handlers[i].apply(this, Array.prototype.slice.call(arguments, 1));
      }
    };
  }

  XenoVideoAsset.prototype.setVideo = function(url, options) {
    var self = this;
    options = options || {};

    if (this._videoElement) {
      this._videoElement.removeEventListener('timeupdate', this._emitChange);
      this._videoElement.pause();
    }

    if (!url) {
      this._videoElement = null;
      return;
    }

    var video = document.createElement('video');
    video.src = url;
    video.crossOrigin = 'anonymous';
    
    if (options.autoplay !== false) video.autoplay = true;
    if (options.loop !== false) video.loop = true;
    if (options.muted === true) video.muted = true;

    // Prevent full screen on iOS
    video.playsInline = true;
    video.webkitPlaysInline = true;

    if (options.autoplay !== false) {
      // Must interact to play if not muted on most browsers, but we try anyway.
      var playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(function(e) {
          console.warn("Autoplay prevented by browser, requires user interaction or muted video.");
        });
      }
    }

    this._videoElement = video;
    this._videoElement.addEventListener('timeupdate', this._emitChange);

    if (this._emitChangeIfPlayingLoop) {
      cancelAnimationFrame(this._emitChangeIfPlayingLoop);
      this._emitChangeIfPlayingLoop = null;
    }

    function emitChangeIfPlaying() {
      if (self._videoElement && !self._videoElement.paused) {
        self.emit('change');
      }
      if (!self._destroyed) {
        self._emitChangeIfPlayingLoop = requestAnimationFrame(emitChangeIfPlaying);
      }
    }
    emitChangeIfPlaying();
    this.emit('change');
  };

  XenoVideoAsset.prototype.width = function() {
    if (this._videoElement) {
      return this._videoElement.videoWidth || this._emptyCanvas.width;
    }
    return this._emptyCanvas.width;
  };

  XenoVideoAsset.prototype.height = function() {
    if (this._videoElement) {
      return this._videoElement.videoHeight || this._emptyCanvas.height;
    }
    return this._emptyCanvas.height;
  };

  XenoVideoAsset.prototype.element = function() {
    if (this._videoElement) {
      return this._videoElement;
    }
    return this._emptyCanvas;
  };

  XenoVideoAsset.prototype.isDynamic = function() {
    return true;
  };

  XenoVideoAsset.prototype.timestamp = function() {
    if (this._videoElement) {
      this._lastTimestamp = this._videoElement.currentTime;
    }
    return this._lastTimestamp;
  };

  XenoVideoAsset.prototype.destroy = function() {
    this._destroyed = true;
    if (this._videoElement) {
      this._videoElement.removeEventListener('timeupdate', this._emitChange);
      this._videoElement.pause();
      this._videoElement.src = "";
      this._videoElement.load();
    }
    if (this._emitChangeIfPlayingLoop) {
      cancelAnimationFrame(this._emitChangeIfPlayingLoop);
      this._emitChangeIfPlayingLoop = null;
    }
  };

  window.XenoVideoAsset = XenoVideoAsset;

})();
