# ✦ Xeno — Professional 360° Virtual Tour Platform

Xeno is a high-performance, feature-rich web platform for creating, managing, and exporting interactive 360° virtual tours. Built on a robust WebGL rendering core, Xeno provides a professional studio interface with real-time editing, cloud persistence via Supabase, and single-click offline-ready exports.

## 🚀 Key Features

- **Project Dashboard**: Manage multiple tours from a centralized hub with search and filtering.
- **Visual Studio**: Real-time authoring of scene properties, hotspots, and transitions.
- **Multi-Type Hotspots**: Support for Navigation (Scene-to-Scene), Info (Popups), External Links, and Media hotspots.
- **Gyroscope & Motion**: Built-in support for mobile device orientation, allowing users to look around by moving their phone.
- **360° Video Scenes**: Native playback support for spherical video scenes with autoplay, loop, and muted options.
- **Smart Logic**: Automatic hotspot naming based on target scenes and self-linking prevention.
- **Modern UI**: Clean, dark, technical interface built with a glassmorphic aesthetic.
- **Cloud & Local Sync**: Dual persistence using LocalStorage and Supabase for maximum reliability.
- **Offline Exporter**: Bundle your entire tour into a self-contained ZIP for hosting anywhere.

## 📂 Project Structure

- `engine/`: Core 360° rendering engine source, scripts, and legacy reference demos.
- `engine/demos/`: Legacy Marzipano examples (Anaglyph, Video, etc.) for feature reference.
- `js/`: Application-specific logic (UI, Hotspots, Supabase integration).
- `css/`: Thematic styling and component layouts.
- `img/`: Optimized UI assets and hotspot icons.
- `Schema.sql`: Master database schema for Supabase setup.

## 🛠️ Tech Stack

- **Rendering**: WebGL / Marzipano Engine
- **Backend**: Supabase (PostgreSQL, Storage, RLS)
- **Frontend**: Vanilla JavaScript (ES5/ES6 compatible), CSS3
- **Bundling**: JSZip for real-time exports

## 📦 Getting Started

1. **Setup Database**:
   Run the provided `Schema.sql` in your Supabase SQL Editor. It will set up all tables and storage buckets (`xeno-media`).

2. **Configure Environment**:
   Update `config.js` with your Supabase URL and Anon Key.

3. **Install & Run**:
   ```bash
   npm install
   npm run dev
   ```

## 📄 License
This project is licensed under the Apache-2.0 License.
