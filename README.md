<h1 align="center">✦ Xeno</h1>
<p align="center"><strong>Professional 360° Virtual Tour Platform — Create, Edit, Export</strong></p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/🌐_Live_Demo-pending-F59E0B?style=for-the-badge" alt="Live Demo" /></a>
</p>

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

## 📖 About

**Xeno** is a high-performance, feature-rich web platform for creating, managing, and exporting interactive 360° virtual tours. Built on a robust WebGL rendering core (Marzipano), Xeno provides a professional studio interface with real-time editing, local persistence via IndexedDB + localStorage, and single-click offline-ready ZIP exports.

> **🔒 Zero-Build, Zero-Dependency** — Xeno runs on plain HTML, CSS, and Vanilla JavaScript. No bundlers, no frameworks, no build step. Open `editor.html` and go.

---

## ✨ Features

### 🖼️ Scene Management
| Feature | Description |
|---|---|
| **Project Dashboard** | Centralized hub with search and filtering for all tours |
| **Visual Studio** | Real-time authoring of scene properties, hotspots, and transitions |
| **Scene Grid** | Drag-reorder thumbnails with rename and delete |
| **Default Scene** | Set the first scene viewers see when loading a tour |
| **Media Library** | Upload images/videos into albums, reuse across scenes |

### 🎯 Hotspot System
| Type | Description |
|---|---|
| **Navigate** | Scene-to-scene transitions with animated arrows |
| **Info Card** | Rich popups with title, description, and icons |
| **URL Link** | External hyperlinks that open in new tabs |
| **Image / Video / Audio** | Embed media files from the built-in library |
| **Surface (Quad)** | Pin 4-point planar surfaces onto the 360° view |
| **Embed** | YouTube & Google Maps iframes inside the panorama |

### 🎨 Preview Themes
| Theme | Description |
|---|---|
| **Default (Sidebar)** | Left panel slides in/out, title bar at top |
| **Strip** | Right-side vertical filmstrip with compact cards |
| **Minimal** | Ultra-thin always-visible top bar, tiny thumbnails only |
| **Gallery** | Pull-down panel from top with larger cards |
| **Floating** | Glass pill at bottom, horizontal cards, fades on toggle |
| **Hamburger** | 3-line icon on left, hover reveals rounded-card panel |
| **Center Bar** | Bottom-centered bar with cards, controls row above |

### 📸 Capture
| Feature | Description |
|---|---|
| **Screenshot** | Capture current 360° view with one click |
| **Aspect Ratios** | Full, 1:1, 4:3, 3:2, 16:9 with animated frame styles |
| **Download** | Export cropped PNG at selected aspect ratio |

### 🛠️ Developer Tools
| Feature | Description |
|---|---|
| **Smart Logic** | Automatic hotspot naming, self-linking prevention |
| **Offline Exporter** | Bundle entire tour into a self-contained ZIP with run scripts |
| **Local Persistence** | IndexedDB for media blobs + localStorage for metadata |

---

## 📂 Project Structure

```
Xeno/
│
├── css/                        Stylesheets (split by domain)
│   ├── editor/                 ─ base, buttons, topbar, sidebar, viewport, panels, menus, media, dashboard, theme
│   ├── hotspots/               ─ types, animations, dots
│   ├── lib/                    ─ hint.css, minimap.css (third-party)
│   ├── viewer/                 ─ layout, components
│   └── tokens.css              Design tokens
│
├── js/                         Application scripts
│   │
│   ├── editor/                 ★ Tour Studio application
│   │   ├── editor.js           Orchestrator
│   │   ├── partials/           HTML partials (dashboard, topbar, viewport, properties-panel, menus, media)
│   │   ├── state.js            Shared state & DOM refs
│   │   ├── tools.js            Tool pills, SVG icons, hotspot drag
│   │   ├── hotspot-manager.js  Hotspot creation & rendering
│   │   ├── hotspot-props-panel.js  Hotspot property editor
│   │   ├── hotspot-props-types.js  Per-type property forms
│   │   ├── project-settings.js     Project-wide settings panel
│   │   ├── scene-manager.js   Scene CRUD
│   │   ├── scene-settings.js  Per-scene settings
│   │   ├── media-manager.js   Media library UI
│   │   ├── dashboard.js       Project dashboard
│   │   ├── export.js          ZIP export
│   │   └── ui.js              Utility helpers
│   │
│   ├── engine/                 Marzipano-based viewer engine
│   │   ├── xeno.js             Core viewer (~20K lines)
│   │   ├── transitions.js      Scene transitions
│   │   ├── VideoAsset.js       Video support
│   │   ├── DeviceOrientation.js  Gyroscope controls
│   │   └── colorEffects.js     Color filters
│   │
│   ├── hotspots/               Hotspot factory (shared editor + viewer)
│   │   ├── HotspotFactory.js   Entry point
│   │   ├── Builders-Nav.js     Navigate / Link / Info / Quad / Embed / URL
│   │   └── Builders-Content.js Tooltip / Expand / Hintspot / Reveal / Rotate / Textinfo / Image / Video / Audio / Media
│   │
│   ├── lib/                    screenfull.js, webvr-polyfill.js (third-party)
│   ├── ui/                     Minimap.js, Supabase.js, SceneList.js
│   ├── vr/                     XenoVR.js (VR mode)
│   └── viewer.js               ★ Viewer bootstrap
│
├── public/                     Static assets (favicon, logos)
│
├── editor.html                 ★ Tour Studio entry
├── preview.html                ★ 360° Viewer entry
├── index.html                  Landing / portal
├── data.js                     Tour data defaults
├── config.js                   Optional backend keys (gitignored)
├── Schema.sql                  Database schema (optional Supabase)
├── sw.js                       Service Worker
├── manifest.json               PWA manifest
└── package.json                Dev server
```

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Rendering** | WebGL / Marzipano Engine | 360° panoramic viewer with equirectangular and cube-map projections |
| **Storage** | IndexedDB + localStorage | Media blobs & metadata persistence across sessions |
| **Frontend** | Vanilla JavaScript (ES6), CSS3 | Zero-framework, no build step — runs directly in the browser |
| **Export** | JSZip | Single-click offline-ready ZIP bundling with auto-install scripts |
| **VR** | WebVR Polyfill | Cross-browser VR support for Cardboard / Daydream |
| **Optional Sync** | Supabase | Cloud persistence for multi-device access (configurable via config.js) |

## 📦 Getting Started

1. **Install & Run**:
   ```bash
   npm install
   npm run dev
   ```
   This starts a local dev server at `http://localhost:8000`.

2. **Create a Tour**:
   - Open `editor.html` in your browser.
   - Click "New Project" to create a tour.
   - Upload 360° images via the Media Library.
   - Add scenes, hotspots, and configure settings.

3. **Preview**:
   - Click the Preview button to test your tour in real-time.
   - Switch layout themes in Project Settings to change the viewer UI.

4. **Export**:
   - Click Export to bundle your tour as a self-contained ZIP.
   - Includes `run.bat` (Windows) and `run.sh` (macOS/Linux) with auto-install.

---

## 📄 License

This project is licensed under the **Apache-2.0 License**.
