/*
 * Xeno — Transitions & Easings
 * Adapted from Marzipano demos and Robert Penner's easing equations.
 */
'use strict';

(function() {
  function linear(val) { return val; }

  var easing = {
    linear: linear,
    easeInQuad: function(pos) { return Math.pow(pos, 2); },
    easeOutQuad: function(pos) { return -(Math.pow((pos-1), 2) -1); },
    easeInOutQuad: function(pos) {
      if ((pos/=0.5) < 1) return 0.5*Math.pow(pos,2);
      return -0.5 * ((pos-=2)*pos - 2);
    },
    easeInCubic: function(pos) { return Math.pow(pos, 3); },
    easeOutCubic: function(pos) { return (Math.pow((pos-1), 3) +1); },
    easeInOutCubic: function(pos) {
      if ((pos/=0.5) < 1) return 0.5*Math.pow(pos,3);
      return 0.5 * (Math.pow((pos-2),3) + 2);
    },
    easeInQuart: function(pos) { return Math.pow(pos, 4); },
    easeOutQuart: function(pos) { return -(Math.pow((pos-1), 4) -1); },
    easeInOutQuart: function(pos) {
      if ((pos/=0.5) < 1) return 0.5*Math.pow(pos,4);
      return -0.5 * ((pos-=2)*Math.pow(pos,3) - 2);
    },
    easeInQuint: function(pos) { return Math.pow(pos, 5); },
    easeOutQuint: function(pos) { return (Math.pow((pos-1), 5) +1); },
    easeInOutQuint: function(pos) {
      if ((pos/=0.5) < 1) return 0.5*Math.pow(pos,5);
      return 0.5 * (Math.pow((pos-2),5) + 2);
    },
    easeInSine: function(pos) { return -Math.cos(pos * (Math.PI/2)) + 1; },
    easeOutSine: function(pos) { return Math.sin(pos * (Math.PI/2)); },
    easeInOutSine: function(pos) { return (-0.5 * (Math.cos(Math.PI*pos) -1)); },
    easeInExpo: function(pos) { return (pos===0) ? 0 : Math.pow(2, 10 * (pos - 1)); },
    easeOutExpo: function(pos) { return (pos===1) ? 1 : -Math.pow(2, -10 * pos) + 1; },
    easeInOutExpo: function(pos) {
      if(pos===0) return 0;
      if(pos===1) return 1;
      if((pos/=0.5) < 1) return 0.5 * Math.pow(2,10 * (pos-1));
      return 0.5 * (-Math.pow(2, -10 * --pos) + 2);
    },
    easeInCirc: function(pos) { return -(Math.sqrt(1 - (pos*pos)) - 1); },
    easeOutCirc: function(pos) { return Math.sqrt(1 - Math.pow((pos-1), 2)); },
    easeInOutCirc: function(pos) {
      if((pos/=0.5) < 1) return -0.5 * (Math.sqrt(1 - pos*pos) - 1);
      return 0.5 * (Math.sqrt(1 - (pos-=2)*pos) + 1);
    },
    easeOutBounce: function(pos) {
      if ((pos) < (1/2.75)) {
        return (7.5625*pos*pos);
      } else if (pos < (2/2.75)) {
        return (7.5625*(pos-=(1.5/2.75))*pos + 0.75);
      } else if (pos < (2.5/2.75)) {
        return (7.5625*(pos-=(2.25/2.75))*pos + 0.9375);
      } else {
        return (7.5625*(pos-=(2.625/2.75))*pos + 0.984375);
      }
    },
    easeInBack: function(pos) {
      var s = 1.70158;
      return (pos)*pos*((s+1)*pos - s);
    },
    easeOutBack: function(pos) {
      var s = 1.70158;
      return (pos=pos-1)*pos*((s+1)*pos + s) + 1;
    },
    easeInOutBack: function(pos) {
      var s = 1.70158;
      if((pos/=0.5) < 1) return 0.5*(pos*pos*(((s*=(1.525))+1)*pos -s));
      return 0.5*((pos-=2)*pos*(((s*=(1.525))+1)*pos +s) +2);
    },
    elastic: function(pos) {
      return -1 * Math.pow(4,-8*pos) * Math.sin((pos*6-1)*(2*Math.PI)/2) + 1;
    },
    bounce: function(pos) {
      if (pos < (1/2.75)) {
        return (7.5625*pos*pos);
      } else if (pos < (2/2.75)) {
        return (7.5625*(pos-=(1.5/2.75))*pos + 0.75);
      } else if (pos < (2.5/2.75)) {
        return (7.5625*(pos-=(2.25/2.75))*pos + 0.9375);
      } else {
        return (7.5625*(pos-=(2.625/2.75))*pos + 0.984375);
      }
    }
  };

  var functions = {
    // Slide from left (mirror of fromRight)
    fromLeft: function(ease) {
      ease = ease || linear;
      return function(val, newScene) {
        newScene.layer().setEffects({ rect: { relativeX: -(1 - ease(val)) }});
      };
    },

    // Iris wipe — expands from center like old film projector
    iris: function(ease) {
      ease = ease || linear;
      return function(val, newScene) {
        var v = ease(val);
        newScene.layer().setEffects({ rect: {
          relativeWidth: v,
          relativeHeight: v,
          relativeX: (1 - v) / 2,
          relativeY: (1 - v) / 2
        }});
      };
    },

    // Through white — flash to white then reveal (opposite of throughBlack)
    throughWhite: function(ease) {
      ease = ease || linear;
      return function(val, newScene, oldScene) {
        var eased = ease(val);
        if (eased < 0.5) {
          var o = eased * 2;
          newScene.layer().setEffects({ opacity: 0 });
          oldScene.layer().setEffects({ colorOffset: [o, o, o, 0] });
        } else {
          var o2 = 1 - ((eased - 0.5) * 2);
          newScene.layer().setEffects({ opacity: 1, colorOffset: [o2, o2, o2, 0] });
        }
      };
    },

    // Horizontal split — top half slides up, bottom half slides down simultaneously
    splitHorizontal: function(ease) {
      ease = ease || linear;
      return function(val, newScene, oldScene) {
        var v = ease(val);
        // Old scene splits apart
        if (oldScene) {
          oldScene.layer().setEffects({ rect: {
            relativeWidth: 1, relativeHeight: 0.5,
            relativeX: 0, relativeY: -(v * 0.5)
          }});
        }
        // New scene fades in underneath
        newScene.layer().setEffects({ opacity: v });
      };
    },

    // Diagonal wipe from top-left corner
    fromCorner: function(ease) {
      ease = ease || linear;
      return function(val, newScene) {
        var v = ease(val);
        newScene.layer().setEffects({ rect: {
          relativeWidth: v,
          relativeHeight: v,
          relativeX: 0,
          relativeY: 0
        }});
      };
    },

    // Horizontal strip — width expands from center
    curtain: function(ease) {
      ease = ease || linear;
      return function(val, newScene) {
        var v = ease(val);
        newScene.layer().setEffects({ rect: {
          relativeWidth: v,
          relativeHeight: 1,
          relativeX: (1 - v) / 2,
          relativeY: 0
        }});
      };
    },

    // Zoom out — new scene starts zoomed in and settles
    zoomOut: function(ease) {
      ease = ease || linear;
      return function(val, newScene) {
        var v = ease(val);
        var scale = 1.5 - (v * 0.5); // starts at 1.5x, settles to 1x
        var offset = (scale - 1) / 2;
        newScene.layer().setEffects({
          opacity: v,
          rect: {
            relativeWidth: scale,
            relativeHeight: scale,
            relativeX: -offset,
            relativeY: -offset
          }
        });
      };
    },
    opacity: function(ease) {
      ease = ease || linear;
      return function(val, newScene) {
        val = ease(val);
        newScene.layer().setEffects({ opacity: val });
      }
    },
    fromRight: function(ease) {
      ease = ease || linear;
      return function(val, newScene) {
        val = ease(val);
        newScene.layer().setEffects({ rect: { relativeX: 1 - val }});
      }
    },
    fromTop: function(ease) {
      ease = ease || linear;
      return function(val, newScene) {
        val = ease(val);
        newScene.layer().setEffects({ rect: { relativeY: -1 + val }});
      }
    },
    fromBottom: function(ease) {
      ease = ease || linear;
      return function(val, newScene) {
        val = ease(val);
        newScene.layer().setEffects({ rect: { relativeY: 1 - val }});
      }
    },
    width: function(ease) {
      ease = ease || linear;
      return function(val, newScene) {
        val = ease(val);
        newScene.layer().setEffects({ rect: { relativeWidth: val }});
      }
    },
    fromCenter: function(ease) {
      ease = ease || linear;
      return function(val, newScene) {
        val = ease(val);
        newScene.layer().setEffects({ rect: {
          relativeWidth: val,
          relativeHeight: val,
          relativeX: 0.5 - val / 2,
          relativeY: 0.5 - val / 2
        }});
      }
    },
    fromCenterAndOpacity: function(ease) {
      ease = ease || linear;
      return function(val, newScene) {
        var eased = ease(val);
        newScene.layer().setEffects({ rect: {
          relativeWidth: eased,
          relativeHeight: eased,
          relativeX: 0.5 - eased / 2,
          relativeY: 0.5 - eased / 2
        },
        opacity: val });
      }
    },
    fromTopAndOpacity: function(ease) {
      ease = ease || linear;
      return function(val, newScene) {
        var eased = ease(val);
        newScene.layer().setEffects({ opacity: val, rect: { relativeY: -1 + eased }});
      }
    },
    fromWhite: function(ease) {
      ease = ease || linear;
      return function(val, newScene) {
        newScene.layer().setEffects({ colorOffset: [ 1-val, 1-val, 1-val, 0 ] });
      }
    },
    throughBlack: function(ease) {
      ease = ease || linear;
      return function(val, newScene, oldScene) {
        var eased = ease(val);
        var offset;
        if (eased < 0.5) {
          offset = eased * 2;
          newScene.layer().setEffects({ opacity: 0 });
          oldScene.layer().setEffects({ colorOffset: [ -offset, -offset, -offset, 0 ] })
        } else {
          offset = 1 - ((eased - 0.5) * 2);
          newScene.layer().setEffects({ opacity: 1, colorOffset: [ -offset, -offset, -offset, 0 ] })
        }
      }
    }
  };

  window.XenoTransitions = {
    functions: functions,
    easings: easing
  };

})();
