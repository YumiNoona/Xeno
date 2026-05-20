# Xeno — Universal 360° Virtual Tour Platform

Xeno is a feature-rich, high-performance web platform for creating, managing, and exporting interactive 360° virtual tours. Built on top of a robust 360° rendering core, Xeno provides a professional editor interface, auto-saving workspace, project dashboard, and single-click offline-ready ZIP exports.

## 🚀 Key Features

- **Project Dashboard**: A Panoee-style projects management hub to create, search, and manage virtual tours.
- **Visual Editor**: Author scene properties, configure hotspot placements (Navigate, Info, URL, Tooltip, Audio/Video), customize icons, transitions, rotation angles, and other metadata.
- **Drag & Drop Scene Reordering**: Rearrange scene ordering in the editor sidebar using natural HTML5 drag-and-drop actions.
- **Distraction-Free Live Viewer**: Segmented `preview.html` workspace optimized for showing the published virtual tour.
- **Granular Transitions Control**: Configure transition types (opacity, slide from directions, width expand, color offsets) and ease profiles per hotspot to guide users smoothly between scenes.
- **Offline ZIP Exporter**: Pack your entire virtual tour project into a self-contained ZIP bundle with relative paths, so it can be hosted anywhere, local server or static web host.

## 🛠️ Tech Stack & Architecture

- **Core**: HTML5, Vanilla JavaScript, and WebGL 360° rendering.
- **Styling**: Premium custom CSS with a modern glassmorphic dark theme.
- **Persistence**: Debounced local storage (or Supabase remote integration) to prevent data loss.
- **Bundling**: Integrated with JSZip for real-time asset compiling and exporting.

## 📦 Getting Started

To launch the project locally:

1. Clone this repository:
   ```bash
   git clone https://github.com/YumiNoona/Xeno.git
   cd Xeno
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:8080` in your web browser.

## 📄 License
This project is licensed under the Apache-2.0 License.
