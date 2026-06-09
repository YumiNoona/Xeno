<h1 align="center">✦ Xeno</h1>
<p align="center"><strong>Professional 360° Virtual Tour Platform — Create, Edit, Share</strong></p>

<p align="center">
  <img src="https://img.shields.io/badge/WebGL-2.0-990000?style=flat-square&logo=webgl&logoColor=white" alt="WebGL" />
  <img src="https://img.shields.io/badge/Vanilla_JS-ES6-F7DF1E?style=flat-square&logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/CSS_3-1572B6?style=flat-square&logo=css3&logoColor=white" alt="CSS3" />
  <img src="https://img.shields.io/badge/Marzipano-555555?style=flat-square" alt="Marzipano" />
  <img src="https://img.shields.io/badge/IndexedDB-336791?style=flat-square" alt="IndexedDB" />
  <img src="https://img.shields.io/badge/License-Apache_2.0-blue?style=flat-square" alt="License" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Build-Passing-brightgreen?style=flat-square" alt="Build" />
  <img src="https://img.shields.io/badge/Client--Side-100%25-blueviolet?style=flat-square" alt="Client-Side" />
  <img src="https://img.shields.io/badge/No_Build-Zero-success?style=flat-square" alt="No Build" />
  <img src="https://img.shields.io/badge/Portable-.xeno_File-orange?style=flat-square" alt="Portable" />
</p>

---

## About

**Xeno** is a high-performance, zero-build platform for creating, managing, and sharing interactive 360-degree virtual tours. Built on the Marzipano WebGL rendering engine, Xeno provides a professional studio interface with real-time editing, full local persistence via IndexedDB + localStorage, and portable `.xeno` project files for sharing across devices.

> **Zero-Build, Zero-Dependency** — Runs on plain HTML, CSS, and Vanilla JavaScript. No bundlers, no frameworks, no build step. Open `editor.html` and go.

---

## Features

### Scene Management
| Feature | Description |
|---|---|
| Project Dashboard | Central hub with search, right-click context menu, project cards with thumbnails and scene counts |
| Visual Studio | Real-time authoring of scene properties, hotspots, transitions |
| Scene Grid | Drag-reorder thumbnails, shift-click multi-select, right-click context menu (rename, duplicate, set thumbnail, set default, delete) |
| Media Library | Upload images/videos/audio into albums, browse/search, move between albums, right-click context menu on items |
| Scene Thumbnails | Right-click on any scene to set a custom thumbnail for preview mode |

### Hotspot System
| Type | Description |
|---|---|
| Navigate | Scene-to-scene transitions with auto-updating target scene name tooltips |
| Info Card | Rich popups with title, description, and link buttons |
| URL Link | External hyperlinks that open in new tabs |
| Image / Video / Audio | Embed media from the built-in library |
| Text Label | Floating text with full formatting — font family, size, bold, italic, underline, rotation, colors, background toggle, animations |
| Surface (Quad) | Pin 4-point planar surfaces onto the 360-degree view |
| Embed | YouTube and Google Maps iframes inside the panorama |

### Viewer Themes
| Theme | Description |
|---|---|
| Hamburger (default) | Clean sliding panel from left edge, thumbnail-only scene list with accent ring selection |
| Gallery | 6-card fan hand at bottom with 3D depth, overlapping card deck with hover lift |
| Float | Glass pill at bottom center, horizontal cards, fades on toggle |
| Center Bar | Bottom-centered bar with thumbnails, controls pill above |

### Project Settings
| Setting | Description |
|---|---|
| VR Mode | Enable WebXR immersive VR with Cardboard fallback |
| Gyroscope | Device orientation control for mobile |
| Layout Theme | Switch viewer chrome layout (4 themes) |
| Show Scenes | Toggle scene list visibility in preview |
| Intro Screen | Custom tour intro with title, subtitle, enter button |
| Floorplan / Minimap | Toggle minimap overlay with floorplan image |
| Default Transition | Effect and duration for scene-to-scene changes |
| Autorotate | Optional auto-spin for the viewer |

### Sharing & Portability
| Feature | Description |
|---|---|
| Download (.xeno) | Right-click any project to download a complete portable bundle — includes all scenes, hotspots, text styles, media files, albums, settings |
| Import | Import `.xeno` files from any device via the dashboard Import button |
| Offline ZIP | Bundle entire tour into a self-contained ZIP with run scripts |
| Local Persistence | IndexedDB for media blobs + localStorage for tour data with auto-save and crash protection |
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
│   └── tokens.css              Design tokens (dark + light themes)
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
│   │   ├── media-manager.js   Media library UI
│   │   ├── dashboard.js       Project dashboard
│   │   ├── export.js          ZIP export
│   │   ├── modals.js          Alert / confirm dialog helpers
│   │   ├── color-picker.js    Color picker widget
│   │   └── ui.js              Utility helpers, theme toggle, resizers
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
│   │   └── Builders-Content.js Text Label / Tooltip / Expand / Hintspot / Reveal / Rotate / Textinfo / Image / Video / Audio / Media
│   │
│   ├── lib/                    screenfull.js, webvr-polyfill.js (third-party)
│   ├── ui/                     Minimap.js, Supabase.js (local storage engine), SceneList.js
│   ├── vr/                     XenoVR.js (VR mode)
│   └── viewer.js               Viewer bootstrap
│
├── engine/                     Marzipano source (src/, scripts/, demos/)
├── build/                      Compiled Marzipano bundle (build/marzipano.js)
├── public/                     Static assets (favicon ICO + PNG)
│
├── editor.html                 Tour Studio entry
├── preview.html                360-degree Viewer entry
├── index.html                  Brutal retro landing page
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
| Storage | IndexedDB + localStorage | Media blobs and tour data, fully local with crash protection |
| Frontend | Vanilla JavaScript (ES6), CSS3 | Zero-framework, no build step |
| Export | JSON + base64 blobs | Portable `.xeno` project files |
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
   - Open `editor.html` to see the project dashboard, then click **New Project**.
   - Upload 360-degree images via the **Media** button.
   - Add scenes via the **Add Scene** button.
   - Place hotspots using the bottom toolbar (Navigate, Info, Text, Image, etc.).
   - Right-click scenes for rename, duplicate, set thumbnail, delete.

3. **Customize:**
   - Click the gear icon to open **Project Settings**.
   - Choose a layout theme, toggle controls, add intro screen.
   - Configure default transition effect and duration.

4. **Preview:**
   - Click **Preview** in the topbar to test your tour in real-time.

5. **Share:**
   - Right-click any project in the dashboard → **Download** for a portable `.xeno` file.
   - Use **Import** on another device to restore the complete project.

---

## License

This project is licensed under the **Apache-2.0 License**.

Built with love by Veil
