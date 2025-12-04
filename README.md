# Pocket Wilder

A tiny low-poly voxel exploration demo built with Three.js. Collect 10 wood, 10 stone, and 10 corn around your camp with third-person controls that work on desktop and mobile.

## Version
- Current release: **v0.3.6**
- What's new in v0.3.6:
  - Centralized map sizing, collection ranges, and steering assist tuning in one config for quicker balancing.
  - Kept the control-hint chip pinned to the lower left so it stays visible without wrapping on mobile.

## Features
- Procedural terrain seeded per session, with the active seed shown in the corner.
- Simple third-person character with WASD + drag-to-look controls; touch joystick and auto/tap-to-collect for mobile.
- Sparse resources near camp to encourage exploration without explicit compass hints.
- Lightweight assets (no build step); served via a single `index.html` + ES modules.

## Getting Started
1. Start a simple server so the modules load correctly:
   ```bash
   npx http-server .
   ```
   or use any static server you prefer.
2. Open `http://localhost:8080` (or your chosen port) in a modern browser.

## Controls
- **Desktop:** WASD/arrow keys to move, drag the mouse to rotate (pitch and yaw), **E** to collect nearby resources.
- **Mobile:** On-screen joystick (larger activation/drag area) to move, drag the right side to look freely even while idle, tap the **Collect** button or simply get close to a resource to auto-pickup.

## Project Layout
- `index.html` – Canvas, HUD, mobile controls.
- `src/main.js` – Game bootstrap and loop.
- `src/world.js` – Terrain generation, camp, and seeding.
- `src/player.js` – Third-person controller and camera follow.
- `src/resources.js` – Resource nodes and collection logic.
- `src/input.js` – Keyboard/mouse/touch input handling.
- `src/ui.js` – HUD updates and win screen.

## Notes
- Each reload generates a new seed; copy the seed in the lower-right corner if you want to replay the same layout.
- Performance is tuned for simplicity—no build steps or heavy dependencies. If you need more polish later, you can swap meshes for higher-detail models without changing the core loop. 
