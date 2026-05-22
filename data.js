/*
 * Xeno — Universal 360° Tour Data
 * This file defines the complete tour configuration.
 * Viewer reads this at load. Editor writes back to it (or Supabase).
 */
var data = {
  settings: {
    title: "Xeno Demo Tour",
    mouseViewMode: "drag",
    autorotateEnabled: false,
    autorotateSpeed: 0.03,
    autorotateInactivityDelay: 3000,
    fullscreenButton: true,
    sceneListStyle: "sidebar",
    showMinimap: false,
    minimapPosition: "bottom-left",
    showControls: true,
    gyroscopeEnabled: false,
    vrEnabled: false,
    defaultTransition: "opacity",
    defaultTransitionDuration: 1000,
    defaultTransitionEasing: "easeInOut",
    branding: {
      logoUrl: null,
      accentColor: "#00d4ff",
      logoPosition: "top-left"
    },
    intro: {
      enabled: false,
      title: "",
      subtitle: "",
      buttonText: "Enter Tour"
    }
  },

  scenes: [],

  floorplan: {
    enabled: false,
    imageUrl: "",
    width: 800,
    height: 600
  }
};
