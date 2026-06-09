/*
 * Xeno — Standalone / Sample Tour Data
 * Serves as the default fallback for exported tours (window.isExported = true)
 * and the sample tour shown when no project is loaded.
 * The viewer reads this; the editor writes to localStorage/IndexedDB instead.
 */
var data = {
  settings: {
    title: "Xeno Demo Tour",
    mouseViewMode: "drag",
    autorotateEnabled: false,
    showScenes: true,
    autorotateSpeed: 0.03,
    autorotateInactivityDelay: 3000,
    fullscreenButton: true,
    sceneListStyle: "sidebar",
    layoutTheme: "hamburger",
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
