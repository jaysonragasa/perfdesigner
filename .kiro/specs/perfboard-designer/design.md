# Design Document

## Overview

PerfDesigner is a single-page React application with no backend. All state is held in
memory in the root `App` component and rendered to an SVG canvas. Persistence is handled
entirely client-side by serializing state to a JSON file (download) and deserializing on
upload. This document captures the architecture as it exists so it can guide future work.

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                            App.jsx                             │
│  Owns all state: layers, activeLayer, tool, components,        │
│  links, customComponents, boardSize, boardTransform, clipboard,│
│  selection, modal flags, display toggles.                      │
│  Handles keyboard shortcuts, save/open, import, macro build.   │
└───┬───────────────┬───────────────┬──────────────┬────────────┘
    │ props+setters  │               │              │
    ▼                ▼               ▼              ▼
┌────────┐     ┌──────────┐    ┌──────────┐   ┌───────────────┐
│Toolbar │     │ Sidebar  │    │  Board   │   │ LayersPanel   │
│(tools, │     │(palette, │    │ (SVG:    │   │ (visibility,  │
│ colors,│     │ import)  │    │  grid,   │   │  order,       │
│ files) │     │          │    │  links,  │   │  rename,      │
└────────┘     └──────────┘    │  drag)   │   │  delete)      │
                               └────┬─────┘   └───────────────┘
                                    │ renderComponent()
                                    ▼
                            ┌─────────────────┐
                            │ ComponentShapes │  SVG per-type renderers
                            │  + CustomShape  │  (recursive for macros)
                            └─────────────────┘

Modals (conditional): ComponentCreator, ComponentParamsModal,
ResistorBuilderModal, MacroBuilderModal, BoardSettings.
Data: data/builtinComponents.js (JSON module defs).
```

### State ownership

`App.jsx` is the single source of truth. There is deliberately no Redux/Zustand/Context —
state and setters flow down as props, and children report changes up via callbacks. New
shared state should live in `App.jsx` and follow this pattern.

Key state slices:
- **Board data**: `components`, `links`, `layers`, `activeLayerId`, `boardSize`,
  `boardTransform` (pan/zoom), `boardColor`.
- **Library**: `customComponents` (user-created, imported, saved resistors, macros).
- **Interaction**: `activeTool` (`select` | `component` | `link`), `selectedComponentType`,
  `selectedComponentIds`, `activeLinkId`, `clipboard`, `pendingComponentParams`,
  `wireColor`.
- **Display**: `showGoldBorder`, `dimInactiveLayers`.
- **Modal flags**: `showComponentCreator`, `showBoardSettings`, `showComponentParams`,
  `showMacroBuilder`.

## Coordinate system and geometry

- **Grid units**: components and link points are stored as integer hole indices `(x, y)`.
- **SVG units**: `SPACING = 20` SVG units per hole. Screen conversion:
  `screen = grid * SPACING * scale + transformOffset`.
- **Physical mm**: hole pitch is 2.54 mm. `holes = mm / 2.54`; `mm = holes * 2.54`.
- **Rotation**: stored in degrees; applied to SVG groups with `rotate(deg)`. Pad positions
  are transformed by a rounded rotation matrix in `getComponentPads` so pads stay on grid.

### Link path generation (`Board.jsx`)

- `getComponentPads(comp, customComponents)` returns global pad coordinates for a placed
  component, resolving per-type local pad layouts (built-ins hardcoded, custom from def)
  and applying rotation.
- `generateLinkPath(link, index, allLinks)` builds the SVG path string:
  - **Bottom layer** → straight polyline (solder trace).
  - **Top layer** → polyline that inserts small arcs (`A`) wherever the segment crosses an
    earlier top-layer link, producing "jumper wires hop over" visuals. Crossings are found
    with `getIntersection` (segment-segment), sorted along the segment, and spaced so arcs
    don't overlap.

## Components and Interfaces

This section summarizes each module and its public interface (props/exports). Full
narratives for rendering and interaction follow in later sections.

- **`App` (`App.jsx`)** — root; owns all state. No props. Passes state + setters into
  children and renders modals conditionally.
- **`Board` (`Board.jsx`)** — props: `width, height, layers, activeLayerId,
  showGoldBorder, dimInactiveLayers, boardColor, components, setComponents, links,
  setLinks, activeLinkId, onPadClick, activeTool, customComponents, onEditComponent,
  onGroupComponents, transform, setTransform, selectedComponentIds, setSelectedComponentIds`.
  Exports `getComponentPads(comp, customComponents)`.
- **`renderComponent(comp, layer, customComponents, isSelected)` (`ComponentShapes.jsx`)**
  — pure dispatcher returning SVG for a component. Also exports the individual shape
  components and `CustomShape`.
- **`Toolbar`** — props: active tool + setters, wire color, save/open handlers, transform.
- **`Sidebar`** — props: tool/type selection, custom components, param-modal openers,
  import/delete handlers.
- **`LayersPanel`** — props: `layers, setLayers, activeLayerId, setActiveLayerId`.
- **Modals** (`BoardSettings`, `ComponentCreator`, `ComponentParamsModal`,
  `ResistorBuilderModal`, `MacroBuilderModal`) — each takes `onClose` and `onSave`
  (plus context props) and manages its own local UI state, including drag position.
- **`NumberInput`** — props: `value, onChange, min, max, step, style`.

## Data Models

### Placed component
```js
{ id, type, x, y, layer, rotation, width, height, params }
```

### Link (net / wire)
```js
{ id, layer, color, points: [{ x, y }, …] }
```

### Layer
```js
{ id, name, visible }   // 'top' and 'bottom' are special and undeletable
```

### Custom component definition
```js
{
  id, name, category, type: 'custom',
  pads: [{ x, y }, …],
  width, height,                 // grid holes
  bodyWidth, bodyHeight,         // holes
  bodyWidth_mm, bodyHeight_mm,   // physical mm
  hideBody,
  texts: [{ text, x, y, size }],
  childComponents?,              // nested placed components (macros/breakouts)
  dependencies?                  // referenced custom defs, for export/import
}
```

### JSON module built-in
```js
{ id, categoryId, categoryName, name, icon, def: /* custom component definition */ }
```

### Saved design file
```js
{ boardSize, boardColor, showGoldBorder, dimInactiveLayers,
  components, links, customComponents, layers }
```

Full format details live in [`docs/COMPONENT_FORMAT.md`](../../../docs/COMPONENT_FORMAT.md).

## Component model and rendering

### Placed component
```js
{ id, type, x, y, layer, rotation, width, height, params }
```

### `renderComponent(comp, layer, customComponents, isSelected)`
Dispatches by `comp.type`:
- `custom_*` → `CustomShape` (looks up def in `customComponents`).
- `saved_resistor_*` → `Resistor`.
- `resistor`/`capacitor`/`electrolytic`/`led`/`dip8`/`dip16`/`header4`/`male_header` →
  dedicated SVG components.
- otherwise → match by id in `BUILTIN_JSON_COMPONENTS` and render via `CustomShape`.

### `CustomShape`
Renders a body rect (unless `hideBody`), copper pad dots at each pad, custom text labels,
and recursively renders any `childComponents` (used by macros and breakout modules). Body
size is derived from `bodyWidth`/`bodyHeight` (holes) or `bodyWidth_mm`/`bodyHeight_mm`
(mm), with pad-bounds fallback.

### Custom component definition
```js
{
  id, name, category, type: 'custom',
  pads: [{x, y}, …],
  width, height,                 // grid holes
  bodyWidth, bodyHeight,         // holes
  bodyWidth_mm, bodyHeight_mm,   // physical
  hideBody,
  texts: [{ text, x, y, size }],
  childComponents?,              // nested placed components (macros/breakouts)
  dependencies?                  // referenced custom defs, for export/import
}
```

## Layers

- Layers are an ordered array of `{ id, name, visible }`. `top` and `bottom` are special
  (undeletable; `bottom` drives copper-pad and solder-trace rendering).
- Render stacking iterates layers in reverse so earlier-listed layers draw on top.
- `dimInactiveLayers` lowers opacity and disables pointer events for non-active layers.
- Reordering is drag-and-drop (HTML5 DnD) in `LayersPanel`.

## Interaction flows

- **Placement**: Sidebar select → (optional params modal) → `activeTool='component'` →
  pad click → append component. Parameterized types route through
  `ComponentParamsModal`/`ResistorBuilderModal` first, storing `pendingComponentParams`.
- **Selection/drag**: mouse-down on a component sets selection and records start positions
  of all selected components + a snapshot of links; mouse-move applies the snapped delta to
  components and to any link points coincident with dragged pads.
- **Link drawing**: pad clicks append points to `activeLinkId`; Ctrl-click or Escape ends
  the current link; nodes are draggable (move point) and right-clickable (delete point).
- **Macro build**: select components → Ctrl+G → name modal → compute bounds from all pads
  and bodies → create custom def with relative child components → replace originals with a
  single macro instance.

## Persistence

- **Save**: serialize `{ boardSize, boardColor, showGoldBorder, dimInactiveLayers,
  components, links, customComponents, layers }` to a pretty-printed JSON Blob and trigger
  download.
- **Open**: parse JSON and set each slice, with legacy fallbacks (default layers when
  absent; `label`/`labelPos` → `texts` migration).
- **Component import**: per-file `FileReader`; generate new IDs, import declared
  dependencies as hidden parts, remap `childComponents` type references, and backfill
  derived size fields.

## Styling

- Global tokens (colors, spacing, glass effect, transitions) are CSS custom properties in
  `src/index.css`. Layout/toolbar/sidebar classes are in `src/App.css`.
- Reusable classes: `.glass-panel`, `.tool-btn`, `.sidebar`, `.toolbar`, `.component-item`.
- Component-local styling uses inline `style` objects referencing the tokens
  (e.g. `var(--accent)`).

## Constraints and non-goals

- No electrical model: no nets, no DRC, no simulation, no BOM export. Links are purely
  visual.
- Board size is clamped to 10–100 holes per side.
- Zoom is clamped to 0.2x–5x.
- Single design in memory at a time; no undo/redo stack.

## Known trade-offs / technical debt

- Per-type geometry (pad layouts, size fallbacks) is duplicated across `Board.jsx`,
  `ComponentShapes.jsx`, `Sidebar.jsx`, and the macro logic in `App.jsx`. Adding a
  built-in type requires touching all of them.
- `dip16` currently reuses the `DIP8` renderer as a placeholder.
- IDs based on `Date.now()` can collide in tight loops; bulk import adds random suffixes to
  mitigate.

## Correctness Properties

### Property 1: Grid integrity
Placed components and link points always hold integer grid coordinates; drag operations
snap via `Math.round` and clamp to `[0, width-1]` / `[0, height-1]`.
**Validates: Requirements 2.2, 3.4, 5.6**

### Property 2: Coordinate round-trip
`mm → holes → mm` is stable given the fixed 2.54 pitch; board size is clamped to 10–100
holes per side and zoom to 0.2x–5x.
**Validates: Requirements 1.4, 7.3**

### Property 3: Pad/link coherence
When a component moves, any link point coincident with one of its pads (computed via
`getComponentPads` at drag start) moves by the same delta.
**Validates: Requirements 3.5**

### Property 4: Rotation preserves grid
`getComponentPads` uses a rounded rotation matrix so pads remain on exact holes at
0/90/180/270°.
**Validates: Requirements 3.6**

### Property 5: Layer invariants
`top` and `bottom` always exist and are undeletable; at least one layer always remains;
render stacking follows layer order (reversed).
**Validates: Requirements 6.4, 6.6**

### Property 6: Save/open fidelity
Opening a file produced by save restores an equivalent design; missing optional fields
(notably `layers`) fall back to defaults.
**Validates: Requirements 12.2, 12.3**

### Property 7: Import id uniqueness
Imported components and their dependencies receive freshly generated ids, and child
`type` references are remapped consistently.
**Validates: Requirements 13.1, 13.2**

## Error Handling

- **Malformed design/component JSON**: parsing is wrapped in `try/catch`; a design parse
  failure shows an alert, and a component parse failure logs to console and skips that
  file. The rest of the app state is left intact.
- **Cancelled prompts**: save is aborted if the name prompt is empty/cancelled.
- **Deleting a custom component in use**: the user is asked whether to also remove placed
  instances; the definition is soft-deleted (`deleted: true`) so kept instances still
  render.
- **Empty macros**: grouping with no resolvable pads/components is a no-op that closes the
  modal.
- **Input clamping**: `NumberInput` and board settings clamp to min/max on blur; invalid
  numeric input falls back to the min (or 0).

## Testing Strategy

There is currently **no automated test suite**. Verification is manual via `npm run dev`
and `npm run lint` (oxlint). Recommended approach for future test coverage:

- **Unit tests (Vitest)** for pure logic: `getComponentPads` rotation, `getIntersection`,
  `generateLinkPath`, resistor color-code calculation, and mm↔hole conversion.
- **Component tests (React Testing Library)** for placement, selection/drag reducers, and
  save/open round-trip serialization.
- **Manual smoke checklist**: place each built-in, route a top wire crossing another
  (verify jump arc), route a bottom trace, group/ungroup a macro, save then reopen,
  export/import a custom component with dependencies.
