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
  <img src="https://img.shields.io/badge/Service_Worker-FF6B35?style=flat-square" alt="Service Worker" />
  <img src="https://img.shields.io/badge/JSZip-3.10-FF6B35?style=flat-square" alt="JSZip" />
  <img src="https://img.shields.io/badge/License-Apache_2.0-blue?style=flat-square" alt="License" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Build-Passing-brightgreen?style=flat-square" alt="Build" />
  <img src="https://img.shields.io/badge/Client--Side-100%25-blueviolet?style=flat-square" alt="Client-Side" />
  <img src="https://img.shields.io/badge/No_Dependencies-Zero-success?style=flat-square" alt="No Dependencies" />
  <img src="https://img.shields.io/badge/Export-Offline_Zip-orange?style=flat-square" alt="Offline Export" />
</p>

---

## 📖 About

**Xeno** is a high-performance, feature-rich web platform for creating, managing, and exporting interactive 360° virtual tours. Built on a robust WebGL rendering core (Marzipano), Xeno provides a professional studio interface with real-time editing, cloud persistence via Supabase, and single-click offline-ready ZIP exports.

> **🔒 Zero-Build, Zero-Dependency** — Xeno runs on plain HTML, CSS, and Vanilla JavaScript. No bundlers, no frameworks, no build step. Open `editor.html` and go.

---

## ✨ Features

### 🖼️ Scene Management
| Feature | Description |
|---|---|
| **Project Dashboard** | Centralized hub with search and filtering for all tours |
| **Visual Studio** | Real-time authoring of scene properties, hotspots, and transitions |
| **Scene Grid** | Drag-reorder thumbnails with multi-select, rename, and delete |
| **Default Scene** | Set the first scene viewers see when loading a tour |

### 🎯 Hotspot System
| Type | Description |
|---|---|
| **Navigate** | Scene-to-scene transitions with animated arrows |
| **Info Card** | Rich popups with title, description, and icons |
| **URL Link** | External hyperlinks that open in new tabs |
| **Image / Video / Audio** | Embed media files from the built-in library |
| **Surface (Quad)** | Pin 4-point planar surfaces onto the 360° view |
| **Embed** | YouTube & Google Maps iframes inside the panorama |

### 🛠️ Developer Tools
| Feature | Description |
|---|---|
| **Smart Logic** | Automatic hotspot naming, self-linking prevention |
| **Media Library** | Upload, organize into albums, reuse across scenes |
| **Offline Exporter** | Bundle entire tour into a self-contained ZIP |
| **Cloud Sync** | Dual persistence via LocalStorage + Supabase |

---

## 📂 Project Structure

```
Xeno/
│
├── build/                      Compiled Marzipano engine
│
├── engine/                     Marzipano 360° rendering engine
│   ├── demos/                  Feature reference demos
│   ├── scripts/                Build / deploy / release
│   └── src/                    Engine source (Viewer, Scene, Layer, Hotspot, controls, shaders, …)
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
│   │   ├── hotspot-manager.js
│   │   ├── hotspot-props-panel.js
│   │   ├── hotspot-props-types.js
│   │   ├── scene-manager.js
│   │   ├── scene-settings.js
│   │   ├── media-manager.js
│   │   ├── dashboard.js
│   │   ├── export.js
│   │   └── ui.js
│   │
│   ├── engine/                 Marzipano-based viewer engine
│   │   ├── xeno.js             Core viewer (~20 K lines)
│   │   ├── transitions.js
│   │   ├── VideoAsset.js
│   │   ├── DeviceOrientation.js
│   │   ├── colorEffects.js
│   │   └── homography.js
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
├── img/                        UI assets & hotspot icons
│
├── editor.html                 ★ Tour Studio entry
├── preview.html                ★ 360° Viewer entry
├── index.html                  Landing / portal
├── data.js                     Tour data persistence
├── config.js                   Supabase credentials (gitignored)
├── Schema.sql                  Database schema (Supabase)
└── package.json                Dev server & dependencies
```

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Rendering** | WebGL / Marzipano Engine | 360° panoramic viewer with equirectangular and cube-map projections |
| **Backend** | Supabase (PostgreSQL, Storage, RLS) | Cloud persistence, media storage, row-level security |
| **Frontend** | Vanilla JavaScript (ES6), CSS3 | Zero-framework, no build step — runs directly in the browser |
| **Export** | JSZip | Single-click offline-ready ZIP bundling |
| **VR** | WebVR Polyfill | Cross-browser VR support for Cardboard / Daydream |

## 📦 Getting Started

1. **Setup Database**:
   Run the provided `Schema.sql` in your Supabase SQL Editor. It will set up all tables and storage buckets (`xeno-media`).

2. **Configure Environment**:
   Edit `config.js` with your Supabase URL and Anon Key.

3. **Install & Run**:
   ```bash
   npm install
   npm run dev
   ```

## 📄 License

This project is licensed under the **Apache-2.0 License**.
