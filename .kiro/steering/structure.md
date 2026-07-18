---
inclusion: always
---

# Project Structure

## Directory layout

```
PCBDesign/
├── index.html                 # Vite entry HTML (mounts #root)
├── vite.config.js             # Vite + React plugin config
├── package.json               # scripts and dependencies
├── .oxlintrc.json             # linter config
├── public/                    # static assets served as-is (favicon, icons)
├── dist/                      # production build output (generated)
└── src/
    ├── main.jsx               # React entry; renders <App/> in StrictMode
    ├── App.jsx                # root component — owns ALL app state
    ├── App.css                # layout + toolbar/sidebar/canvas styles
    ├── index.css              # global styles + CSS custom properties (design tokens)
    ├── assets/                # images bundled by Vite (hero, logos)
    ├── data/
    │   └── builtinComponents.js   # JSON-defined built-in modules (ESP32, buck, OLED…)
    └── components/
        ├── Board.jsx              # SVG canvas: grid, pan/zoom, links, drag, geometry
        ├── ComponentShapes.jsx    # SVG renderers for each component type + dispatcher
        ├── Toolbar.jsx            # top bar: tools, wire color, save/open, settings
        ├── Sidebar.jsx            # left panel: categorized component palette + import
        ├── LayersPanel.jsx        # right panel: layer list, visibility, reorder, rename
        ├── BoardSettings.jsx      # modal: board size (mm/presets), color, toggles
        ├── ComponentCreator.jsx   # modal: design custom components (grid, pads, text)
        ├── ComponentParamsModal.jsx  # modal: params for capacitor/header/LED
        ├── ResistorBuilderModal.jsx  # modal: color-band resistor calculator/builder
        ├── MacroBuilderModal.jsx     # modal: name a grouped selection (macro)
        └── NumberInput.jsx        # reusable stepper number input
```

## Architecture

- **Single-owner state**: `App.jsx` holds every piece of shared state and passes it down.
  Children never own board data; they call setter props. Follow this pattern for new
  features rather than introducing context or a store.
- **Board is presentational + interactive**: `Board.jsx` renders the SVG and handles
  pointer interactions (pan, zoom, pad clicks, node drag, component drag), then reports
  changes up through callbacks (`onPadClick`, `setComponents`, `setLinks`, etc.).
- **Rendering dispatch**: `ComponentShapes.jsx` exports `renderComponent(comp, layer,
  customComponents, isSelected)` which switches on `comp.type` prefix/value to pick the
  right SVG renderer. `CustomShape` handles all `custom_*` parts and JSON built-ins, and
  recursively renders nested `childComponents` (macros/breakouts).
- **Geometry helpers** live in `Board.jsx`: `getComponentPads` (exported) computes global
  pad coordinates for a placed component; `generateLinkPath`/`getIntersection` build the
  SVG path for links, adding jump arcs where top-layer wires cross.
- **Modals** are self-contained, draggable panels rendered conditionally from `App.jsx`
  based on `show*` state flags. Each takes `onClose`/`onSave` callbacks.

## Data model (in-memory & JSON)

- **component (placed)**: `{ id, type, x, y, layer, rotation, width, height, params }`
- **link (net/wire)**: `{ id, layer, color, points: [{x, y}, …] }`
- **layer**: `{ id, name, visible }` — `top`/`bottom` are special (cannot be deleted)
- **custom component def**: `{ id, name, category, type, pads: [{x,y}], width, height,
  bodyWidth(_mm), bodyHeight(_mm), hideBody, texts: [{text,x,y,size}], childComponents?,
  dependencies? }`
- **saved design (file)**: `{ boardSize, boardColor, showGoldBorder, dimInactiveLayers,
  components, links, customComponents, layers }`

## Where to make common changes

- **New built-in component type** → add renderer in `ComponentShapes.jsx`, pad layout in
  `getComponentPads` (Board.jsx), palette entry in `Sidebar.jsx` `CATEGORIES`, and size
  fallbacks in the macro logic in `App.jsx`.
- **New JSON module** (no custom code) → add an entry to `data/builtinComponents.js`; it
  auto-appears in the sidebar under its `categoryName`.
- **New tool or toolbar action** → `Toolbar.jsx` + wire state/handler in `App.jsx`.
- **New global style/token** → `src/index.css` `:root`.
- **Keyboard shortcuts** → the `keydown` handlers in `App.jsx` (and the Ctrl+G handler in
  `Board.jsx`).
