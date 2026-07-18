# PerfDesigner Architecture

A developer-oriented tour of how PerfDesigner is built. For the product pitch and
setup, see the root [`README.md`](../README.md).

## High-level

PerfDesigner is a client-only React SPA. There is no server, database, or API. The entire
application state lives in memory in `App.jsx` and is rendered to a single SVG canvas.
Designs persist as JSON files the user downloads and re-uploads.

```
main.jsx → App.jsx (all state) → Toolbar / Sidebar / Board / LayersPanel + modals
                                       │
                                       └─ ComponentShapes.renderComponent()
```

## Module map

| File | Responsibility |
|------|----------------|
| `src/main.jsx` | Mounts `<App/>` in `React.StrictMode`. |
| `src/App.jsx` | Owns all state; keyboard shortcuts; save/open/import; macro build. |
| `src/components/Board.jsx` | SVG canvas: grid, pan/zoom, link rendering + geometry, component drag, node edit. Exports `getComponentPads`. |
| `src/components/ComponentShapes.jsx` | SVG renderers per component type + `renderComponent` dispatcher + `CustomShape`. |
| `src/components/Toolbar.jsx` | Tool selection, wire color palette, save/open, settings, creator. |
| `src/components/Sidebar.jsx` | Categorized component palette; injects JSON built-ins; import/export/delete custom parts. |
| `src/components/LayersPanel.jsx` | Layer visibility, reorder (DnD), rename, add/delete. |
| `src/components/BoardSettings.jsx` | Board size (mm + presets), color, display toggles. |
| `src/components/ComponentCreator.jsx` | Design custom components: grid, pads, body, texts; JSON import/export. |
| `src/components/ComponentParamsModal.jsx` | Params for capacitor/electrolytic/header/LED. |
| `src/components/ResistorBuilderModal.jsx` | Color-band resistor calculator/builder. |
| `src/components/MacroBuilderModal.jsx` | Name prompt for grouping a selection. |
| `src/components/NumberInput.jsx` | Reusable stepper number input. |
| `src/data/builtinComponents.js` | JSON module definitions (ESP32, buck, OLED, sensors…). |

## State

All shared state is declared in `App.jsx` with `useState` and passed down as props. There
is no external store. The main slices:

- **Board data**: `components`, `links`, `layers`, `activeLayerId`, `boardSize`,
  `boardTransform`, `boardColor`.
- **Library**: `customComponents` (user-created, imported, saved resistors, macros).
- **Interaction**: `activeTool`, `selectedComponentType`, `selectedComponentIds`,
  `activeLinkId`, `clipboard`, `pendingComponentParams`, `wireColor`.
- **Display**: `showGoldBorder`, `dimInactiveLayers`.
- **Modals**: `showComponentCreator`, `showBoardSettings`, `showComponentParams`,
  `showMacroBuilder`.

## Coordinate systems

Three coordinate spaces, converted with two constants:

- **Grid units** — integer hole indices `(x, y)`. Everything stored uses these.
- **SVG units** — `SPACING = 20` per hole. `svg = grid * SPACING`.
- **Physical mm** — hole pitch `2.54 mm`. `holes = mm / 2.54`.

Screen position = `grid * SPACING * transform.scale + transform.{x,y}`.

## Rendering the board

`Board.jsx` draws, in order inside a pan/zoom `<g>`:

1. The board mask rectangle.
2. The hole grid (copper ring if bottom layer visible + `showGoldBorder`, then the hole,
   plus an invisible hit rect per cell for clicks).
3. Links, iterating layers in reverse for stacking. Each link's path comes from
   `generateLinkPath`; nodes are drawn as draggable/right-click-deletable handles.
4. Components, via `renderComponent`, skipping hidden layers and dimming inactive ones.

### Link geometry

- `getComponentPads(comp, customComponents)` → global pad coordinates (per-type local pads
  + rotation matrix).
- `getIntersection(A,B,C,D)` → segment-segment crossing point (interior only).
- `generateLinkPath(link, index, allLinks)`:
  - bottom layer → straight polyline (solder trace).
  - top layer → polyline with arc "hops" where it crosses earlier top-layer links.

## Component rendering

`renderComponent(comp, layer, customComponents, isSelected)` dispatches on `comp.type`:

- `custom_*` → `CustomShape` (def looked up in `customComponents`).
- `saved_resistor_*` → `Resistor`.
- literal built-ins (`resistor`, `capacitor`, `electrolytic`, `led`, `dip8`, `dip16`,
  `header4`, `male_header`) → their dedicated SVG components.
- else → match `id` in `BUILTIN_JSON_COMPONENTS` → `CustomShape`.

`CustomShape` renders the body (unless `hideBody`), pad dots, text labels, and recursively
renders `childComponents` (macros and breakout boards).

## Adding features

### A new hardcoded built-in component type
Touch **all four**:
1. `ComponentShapes.jsx` — add the SVG renderer + a `case` in `renderComponent`.
2. `Board.jsx` `getComponentPads` — add its local pad layout.
3. `Sidebar.jsx` `CATEGORIES` — add the palette entry.
4. `App.jsx` macro-bounds logic — add width/height fallbacks so grouping works.

### A new JSON module (no code)
Add an object to `src/data/builtinComponents.js`. It auto-appears in the sidebar under its
`categoryName`. See [`COMPONENT_FORMAT.md`](./COMPONENT_FORMAT.md).

### A new tool / toolbar action
Add UI in `Toolbar.jsx` and state/handler in `App.jsx`.

### A keyboard shortcut
Extend the `keydown` handler in `App.jsx` (and the Ctrl+G handler in `Board.jsx`).

## Persistence

- **Design save/open**: `handleSaveDesign` / `handleOpenDesign` in `App.jsx`. File shape:
  `{ boardSize, boardColor, showGoldBorder, dimInactiveLayers, components, links,
  customComponents, layers }`. Preserve legacy fallbacks when editing.
- **Component import/export**: `handleImportComponents` in `App.jsx`, and export logic in
  `Sidebar.jsx` / `ComponentCreator.jsx`.

## Conventions

- Functional components + hooks only; one default-exported component per file.
- Use CSS tokens from `index.css`; reuse `.glass-panel` / `.tool-btn` classes.
- Keep the app backend-free and within the "visual layout planner" scope (no DRC/sim).
- `StrictMode` double-invokes effects in dev — keep effects idempotent.
