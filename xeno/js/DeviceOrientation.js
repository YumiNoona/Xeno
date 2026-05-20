/*
 * Xeno — Device Orientation Control
 * Controls the view based on mobile device orientation (gyroscope).
 */
'use strict';

(function() {
  function DeviceOrientationControlMethod() {
    this._dynamics = {
      yaw: new window.Xeno.Dynamics(),
      pitch: new window.Xeno.Dynamics()
    };

    this._deviceOrientationHandler = this._handleData.bind(this);

    // Modern iOS 13+ requires permission for DeviceOrientation
    this._permissionGranted = false;

    if (window.DeviceOrientationEvent) {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        // Will be called by UI toggle
      } else {
        window.addEventListener('deviceorientation', this._deviceOrientationHandler);
        this._permissionGranted = true;
      }
    }

    this._previous = {};
    this._current = {};
    this._tmp = {};

    this._getPitchCallbacks = [];
  }

  // Use Xeno's event emitter or fallback
  if (window.Xeno && window.Xeno.dependencies && window.Xeno.dependencies.eventEmitter) {
    window.Xeno.dependencies.eventEmitter(DeviceOrientationControlMethod);
  } else {
    DeviceOrientationControlMethod.prototype.on = function(event, handler) {
      this._handlers = this._handlers || {};
      this._handlers[event] = this._handlers[event] || [];
      this._handlers[event].push(handler);
    };
    DeviceOrientationControlMethod.prototype.emit = function(event) {
      this._handlers = this._handlers || {};
      var handlers = this._handlers[event] || [];
      for (var i = 0; i < handlers.length; i++) {
        handlers[i].apply(this, Array.prototype.slice.call(arguments, 1));
      }
    };
  }

  DeviceOrientationControlMethod.prototype.requestPermission = function(callback) {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      var self = this;
      DeviceOrientationEvent.requestPermission()
        .then(function(permissionState) {
          if (permissionState === 'granted') {
            window.addEventListener('deviceorientation', self._deviceOrientationHandler);
            self._permissionGranted = true;
            if (callback) callback(true);
          } else {
            if (callback) callback(false);
          }
        })
        .catch(function(e) {
          console.warn("DeviceOrientationEvent requestPermission failed:", e);
          if (callback) callback(false);
        });
    } else {
      if (callback) callback(true);
    }
  };

  DeviceOrientationControlMethod.prototype.destroy = function() {
    this._dynamics = null;
    if (window.DeviceOrientationEvent) {
      window.removeEventListener('deviceorientation', this._deviceOrientationHandler);
    }
    this._deviceOrientationHandler = null;
    this._previous = null;
    this._current = null;
    this._tmp = null;
    this._getPitchCallbacks = null;
  };

  DeviceOrientationControlMethod.prototype.getPitch = function(cb) {
    this._getPitchCallbacks.push(cb);
  };

  DeviceOrientationControlMethod.prototype._handleData = function(data) {
    if (!data.alpha) return; // Ignore null data

    var previous = this._previous,
        current = this._current,
        tmp = this._tmp;

    tmp.yaw = window.Xeno.util.degToRad(data.alpha);
    tmp.pitch = window.Xeno.util.degToRad(data.beta);
    tmp.roll = window.Xeno.util.degToRad(data.gamma);

    rotateEuler(tmp, current);

    // Report current pitch value.
    this._getPitchCallbacks.forEach(function(callback) {
      callback(null, current.pitch);
    });
    this._getPitchCallbacks.length = 0;

    // Emit control offsets.
    if (previous.yaw != null && previous.pitch != null && previous.roll != null) {
      this._dynamics.yaw.offset = -(current.yaw - previous.yaw);
      this._dynamics.pitch.offset = (current.pitch - previous.pitch);

      this.emit('parameterDynamics', 'yaw', this._dynamics.yaw);
      this.emit('parameterDynamics', 'pitch', this._dynamics.pitch);
    }

    previous.yaw = current.yaw;
    previous.pitch = current.pitch;
    previous.roll = current.roll;
  };

  function rotateEuler(euler, result) {
    var heading, bank, attitude,
      ch = Math.cos(euler.yaw),
      sh = Math.sin(euler.yaw),
      ca = Math.cos(euler.pitch),
      sa = Math.sin(euler.pitch),
      cb = Math.cos(euler.roll),
      sb = Math.sin(euler.roll),

      matrix = [
        sh*sb - ch*sa*cb,   -ch*ca,    ch*sa*sb + sh*cb,
        ca*cb,              -sa,      -ca*sb,
        sh*sa*cb + ch*sb,    sh*ca,   -sh*sa*sb + ch*cb
      ];

    if (matrix[3] > 0.9999) {
      heading = Math.atan2(matrix[2],matrix[8]);
      attitude = Math.PI/2;
      bank = 0;
    }
    else if (matrix[3] < -0.9999) {
      heading = Math.atan2(matrix[2],matrix[8]);
      attitude = -Math.PI/2;
      bank = 0;
    }
    else {
      heading = Math.atan2(-matrix[6],matrix[0]);
      bank = Math.atan2(-matrix[5],matrix[4]);
      attitude = Math.asin(matrix[3]);
    }

    result.yaw = heading;
    result.pitch = attitude;
    result.roll = bank;
  }

  window.DeviceOrientationControlMethod = DeviceOrientationControlMethod;

})();
