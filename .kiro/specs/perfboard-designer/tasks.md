# Implementation Plan

## Overview

This plan documents the already-implemented feature set as a checklist, reflecting the
current state of the codebase. All completed items are a map from requirements to the code
that satisfies them and a template for future changes. Unchecked items at the end are
suggested future work.

## Tasks

- [x] 1. Project scaffolding and global styling
  - Vite + React 19 app, entry in `main.jsx`, root `App.jsx`.
  - Global design tokens and utility classes in `index.css` / `App.css`.
  - _Requirements: 1_

- [x] 2. Board canvas with pan and zoom
  - SVG grid of holes, background dot pattern, board mask rect.
  - Wheel zoom toward cursor (0.2x–5x), drag-to-pan, on-canvas zoom buttons.
  - Copper pad rendering gated on bottom-layer visibility + `showGoldBorder`.
  - _Requirements: 1_

- [x] 3. Component placement pipeline
  - Sidebar selection sets tool + type; pad click appends a placed component.
  - Parameter modals gate placement for resistor/capacitor/electrolytic/LED/headers.
  - Capacitor footprint scales at ≥ 1000 µF.
  - _Requirements: 2, 8_

- [x] 4. Selection, move, rotate, delete
  - Click/shift-click selection, Ctrl+A select-all, floating action toolbar.
  - Grid-snapped multi-drag with board clamping; coincident link points follow.
  - R to rotate, Delete/Backspace to remove, edit opens the right editor.
  - _Requirements: 3_

- [x] 5. Clipboard (copy / cut / paste)
  - Ctrl+C / Ctrl+X / Ctrl+V with 2-hole paste offset onto the active layer.
  - _Requirements: 4_

- [x] 6. Link routing engine
  - Multi-point link building; Ctrl-click / Escape to end a link.
  - Top-layer wires with jump arcs over crossings; bottom-layer flat solder traces.
  - Node drag (move point) and right-click (delete point); wire color palette.
  - Geometry helpers: `getComponentPads`, `getIntersection`, `generateLinkPath`.
  - _Requirements: 5_

- [x] 7. Layer management
  - Default Top/Bottom; add/rename/delete/reorder; visibility toggle.
  - Undeletable Top/Bottom; dim-inactive-layers rendering and pointer gating.
  - _Requirements: 6_

- [x] 8. Board settings
  - mm dimensions with presets, mm→holes conversion (clamp 10–100), board color.
  - Copper-pad and layer-dimming toggles.
  - _Requirements: 7_

- [x] 9. Built-in component library
  - Hardcoded THT categories plus JSON modules auto-injected from
    `data/builtinComponents.js`.
  - Collapsible categories in the sidebar.
  - _Requirements: 8_

- [x] 10. Component shapes and render dispatch
  - `renderComponent` dispatcher; per-type SVG shapes; `CustomShape` with recursive
    child rendering.
  - _Requirements: 8, 9, 11_

- [x] 11. Custom Component Creator
  - Name, grid rows/cols, body mm dims (derive grid), pad toggle, draggable text labels,
    zoom, per-component JSON export/import with dependency handling, save/edit.
  - _Requirements: 9, 13_

- [x] 12. Resistor Builder
  - 3–6 bands, standard color-code calculation, place, save-to-library, JSON round-trip.
  - _Requirements: 10_

- [x] 13. Macro grouping
  - Ctrl+G → name modal → bounds computation → custom def with relative children →
    replace selection with one macro instance.
  - _Requirements: 11_

- [x] 14. Save / open designs
  - JSON download of full design state; upload restore with legacy fallbacks and
    label→texts migration.
  - _Requirements: 12_

- [x] 15. External component import
  - Multi-file import, new ID generation, dependency import + child remap, derived size
    backfill.
  - _Requirements: 13_

### Suggested future work (not yet implemented)

- [ ] 16. Undo/redo history stack for board edits.
  - _Requirements: 3, 4, 5_
- [ ] 17. Distinct `dip16` renderer (currently reuses `DIP8`).
  - _Requirements: 8_
- [ ] 18. Consolidate per-type geometry into a single component registry to remove the
  duplication across `Board.jsx`, `ComponentShapes.jsx`, `Sidebar.jsx`, and `App.jsx`.
  - _Requirements: 8, 11_
- [ ] 19. Optional netlist/connectivity awareness or BOM export.
  - _Requirements: 5_
- [ ] 20. Automated tests (currently none) — set up Vitest + React Testing Library.
  - _Requirements: 5, 10, 12_

## Task Dependency Graph

The implemented tasks were built roughly bottom-up. Foundational tasks enable the rest:

```
1 (scaffolding + styling)
└─ 2 (board canvas: pan/zoom/grid)
   ├─ 3 (placement) ── needs 9 (library) + 10 (shapes)
   │  ├─ 4 (clipboard)
   │  └─ 13 (macro grouping) ── needs 6 (links geometry) + 10
   ├─ 6 (link routing) ── needs 10 (getComponentPads/shapes)
   ├─ 7 (layers)
   └─ 8 (board settings)
9 (built-in library) ── feeds 3, 10
10 (shapes + renderComponent) ── feeds 3, 6, 11, 13
11 (custom creator) ── needs 10; feeds 15 (import) round-trip
12 (save/open) ── needs 3, 6, 7, 9, 11
15 (external import) ── needs 11

Future work:
16 (undo/redo) ── depends on 3,4,5,6
17 (dip16) ── depends on 10
18 (registry refactor) ── depends on 8,10,11
19 (netlist/BOM) ── depends on 6
20 (tests) ── depends on the modules under test
```

Executable wave definitions (tasks that can proceed in parallel within a wave, after all
prior waves complete):

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1"] },
    { "wave": 2, "tasks": ["2", "9"] },
    { "wave": 3, "tasks": ["10"] },
    { "wave": 4, "tasks": ["3", "6", "7", "8", "11"] },
    { "wave": 5, "tasks": ["4", "13", "15"] },
    { "wave": 6, "tasks": ["12"] },
    { "wave": 7, "tasks": ["17", "18", "19", "20"] },
    { "wave": 8, "tasks": ["16"] }
  ]
}
```

## Notes

- All checked tasks reflect shipped behavior; this file is documentation of the current
  system, not a forward plan to execute.
- When implementing future work, follow the "Where to make common changes" guidance in
  `.kiro/steering/structure.md` and update the corresponding requirements/design sections.
- There is no test harness yet; task 20 must land before other future tasks can be
  verified automatically.
