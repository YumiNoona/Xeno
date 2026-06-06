<h1 align="center">✦ Xeno</h1>
<p align="center"><strong>Professional 360° Virtual Tour Platform — Create, Edit, Export</strong></p>

<p align="center">
  <img src="https://img.shields.io/badge/WebGL-2.0-990000?style=flat-square&logo=webgl&logoColor=white" alt="WebGL" />
  <img src="https://img.shields.io/badge/Vanilla_JS-ES6-F7DF1E?style=flat-square&logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/CSS_3-1572B6?style=flat-square&logo=css3&logoColor=white" alt="CSS3" />
  <img src="https://img.shields.io/badge/Marzipano-555555?style=flat-square" alt="Marzipano" />
  <img src="https://img.shields.io/badge/IndexedDB-336791?style=flat-square" alt="IndexedDB" />
  <img src="https://img.shields.io/badge/JSZip-3.10-FF6B35?style=flat-square" alt="JSZip" />
  <img src="https://img.shields.io/badge/License-Apache_2.0-blue?style=flat-square" alt="License" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Build-Passing-brightgreen?style=flat-square" alt="Build" />
  <img src="https://img.shields.io/badge/Client--Side-100%25-blueviolet?style=flat-square" alt="Client-Side" />
  <img src="https://img.shields.io/badge/No_Build-Zero-success?style=flat-square" alt="No Build" />
  <img src="https://img.shields.io/badge/Export-Offline_Zip-orange?style=flat-square" alt="Offline Export" />
</p>

---

## About

**Xeno** is a high-performance, zero-build platform for creating, managing, and exporting interactive 360-degree virtual tours. Built on the Marzipano WebGL rendering engine, Xeno provides a professional studio interface with real-time editing, full local persistence via IndexedDB + localStorage, and single-click offline-ready ZIP exports.

> **Zero-Build, Zero-Dependency** — Runs on plain HTML, CSS, and Vanilla JavaScript. No bundlers, no frameworks, no build step. Open `editor.html` and go.

---

## Features

### Scene Management
| Feature | Description |
|---|---|
| Project Dashboard | Central hub with search, project cards with thumbnails and scene counts |
| Visual Studio | Real-time authoring of scene properties, hotspots, transitions |
| Scene Grid | Drag-reorder thumbnails, shift-click multi-select, rename/duplicate/delete |
| Media Library | Upload images/videos/audio into albums, browse/search, move between albums |
| Default Scene | Set the first scene viewers see when loading a tour |

### Hotspot System
| Type | Description |
|---|---|
| Navigate | Scene-to-scene transitions with animated arrows |
| Info Card | Rich popups with title, description, and icons |
| URL Link | External hyperlinks that open in new tabs |
| Image / Video / Audio | Embed media from the built-in library |
| Surface (Quad) | Pin 4-point planar surfaces onto the 360-degree view |
| Embed | YouTube and Google Maps iframes inside the panorama |

### Viewer Themes
| Theme | Description |
|---|---|
| Default | Left sidebar slides in/out, title bar at top, controls bottom-right |
| Gallery | Slide-up bottom drawer with large cards, controls top-right |
| Float | Glass pill at bottom center, horizontal cards, fades on toggle |
| Hamburger | Side-pull from left edge, hover reveals rounded-card panel |
| Center Bar | Bottom-centered bar with thumbnails, controls pill above |

### Project Settings
| Setting | Description |
|---|---|
| VR Mode | Enable WebXR immersive VR with Cardboard fallback |
| Gyroscope | Device orientation control for mobile |
| Layout Theme | Switch viewer chrome layout (5 themes) |
| Intro Screen | Tour intro with title, subtitle, enter button |
| Floorplan / Minimap | Toggle minimap overlay with floorplan image |
| Default Transition | Effect and duration for scene-to-scene changes |

### Developer Tools
| Feature | Description |
|---|---|
| Offline Exporter | Bundle entire tour into a self-contained ZIP |
| Local Persistence | IndexedDB for media blobs + localStorage for tour data |
| No Server Required | Fully client-side — works from file:// or any static host |
| PWA Ready | Service worker with precaching, installable manifest |

---

## Project Structure

```
Xeno/
│
├── css/                        Stylesheets (split by domain)
│   ├── editor/                 base, buttons, topbar, sidebar, viewport, panels, menus, media, dashboard, theme
│   ├── hotspots/               types, animations, dots
│   ├── lib/                    hint.css, minimap.css (third-party)
│   ├── viewer/                 layout, components
│   └── tokens.css              Design tokens
│
├── js/                         Application scripts
│   │
│   ├── editor/                 Tour Studio application
│   │   ├── editor.js           Orchestrator
│   │   ├── partials/           HTML partials (dashboard, topbar, viewport, properties-panel, context-menus, media-modal)
│   │   ├── state.js            Shared state and DOM refs
│   │   ├── tools.js            Tool pills, SVG icons, hotspot drag
│   │   ├── hotspot-manager.js  Hotspot creation and rendering
│   │   ├── hotspot-props-panel.js  Hotspot property editor
│   │   ├── hotspot-props-types.js  Per-type property forms
│   │   ├── project-settings.js     Project-wide settings panel
│   │   ├── scene-manager.js   Scene CRUD and selection
│   │   ├── scene-settings.js  Per-scene settings
│   │   ├── media-manager.js   Media library UI
│   │   ├── dashboard.js       Project dashboard
│   │   ├── export.js          ZIP export
│   │   └── ui.js              Utility helpers, theme toggle
│   │
│   ├── engine/                 Marzipano-based viewer engine
│   │   ├── xeno.js             Core viewer
│   │   ├── transitions.js      Scene transitions
│   │   ├── VideoAsset.js       Video support
│   │   ├── DeviceOrientation.js  Gyroscope controls
│   │   ├── colorEffects.js     Color filters
│   │   └── homography.js       Perspective transforms
│   │
│   ├── hotspots/               Hotspot factory (shared editor + viewer)
│   │   ├── HotspotFactory.js   Entry point
│   │   ├── Builders-Nav.js     Navigate / Link / Info / Quad / Embed / URL
│   │   └── Builders-Content.js Tooltip / Expand / Hintspot / Reveal / Rotate / Textinfo / Image / Video / Audio / Media
│   │
│   ├── lib/                    screenfull.js, webvr-polyfill.js (third-party)
│   ├── ui/                     Minimap.js, Supabase.js, SceneList.js
│   ├── vr/                     XenoVR.js (VR mode)
│   └── viewer.js               Viewer bootstrap
│
├── engine/                     Marzipano engine source (bundled into build/)
├── build/                      Compiled Marzipano bundle
├── public/                     Static assets (favicon ICO + PNG)
├── img/                        UI assets and hotspot icons
│
├── editor.html                 Tour Studio entry
├── preview.html                360-degree Viewer entry
├── index.html                  Landing page
├── data.js                     Tour data defaults
├── sw.js                       Service Worker
├── manifest.json               PWA manifest
└── package.json                Dev server
```

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Rendering | WebGL / Marzipano Engine | 360-degree panoramic viewer |
| Storage | IndexedDB + localStorage | Media blobs and tour data, fully local |
| Frontend | Vanilla JavaScript (ES6), CSS3 | Zero-framework, no build step |
| Export | JSZip | Single-click offline-ready ZIP |
| VR | WebXR / A-Frame | Immersive VR with Cardboard fallback |
| PWA | Service Worker | Precaching, offline support, installable |

---

## Getting Started

1. **Install and run:**
   ```bash
   npm install
   npm run dev
   ```
   Starts a local dev server at `http://localhost:8080` with live-reload.

2. **Create a tour:**
   - Open `editor.html?project=sample-tour` to start with the sample.
   - Or open `editor.html` to see the project dashboard, then click **New Project**.
   - Upload 360-degree images via the Media Library button.
   - Add scenes, place hotspots, and configure settings.

3. **Preview:**
   - Click **Preview** in the topbar to test your tour in real-time.
   - Switch layout themes in **Project Settings** to change the viewer UI.

4. **Export:**
   - Click **Export** to bundle your tour as a self-contained ZIP.
   - Open `index.html` inside the ZIP to run the tour locally.

---

## License

This project is licensed under the **Apache-2.0 License**.

Built with love by Veil
