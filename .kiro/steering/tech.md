---
inclusion: always
---

# Technology Stack

## Stack

- **Framework**: React 19 (functional components + hooks only, no class components)
- **Build tool**: Vite 8 (`@vitejs/plugin-react`)
- **Language**: JavaScript + JSX (no TypeScript; `@types/*` are present only for editor
  intellisense)
- **Styling**: Plain CSS with CSS custom properties (design tokens). No CSS-in-JS library,
  no Tailwind. Inline `style` objects are used heavily for component-local styling.
- **Icons**: `lucide-react`
- **Rendering**: SVG for the board canvas and all component graphics (no Canvas/WebGL)
- **Analytics**: `@vercel/analytics`
- **Linter**: `oxlint`

## Commands

Run from the project root (`c:\Vibe\Web\PCBDesign`):

```bash
npm install       # install dependencies
npm run dev       # start Vite dev server (http://localhost:5173)
npm run build     # production build to dist/
npm run preview   # preview the production build
npm run lint      # run oxlint
```

Note: this is a Windows/cmd environment. `npm run dev`, `preview`, and any watch mode are
long-running — do not launch them in blocking shell calls; start them as background
processes or ask the user to run them.

## Conventions

- **Components** live in `src/components/` as `PascalCase.jsx`, one component per file,
  default-exported.
- **State lives in `App.jsx`.** It is the single source of truth for board data
  (components, links, layers, custom components, board settings) and passes state +
  setters down as props. There is no external state library (no Redux/Zustand/Context).
- **Coordinate system**: board positions are in **grid units** (integer hole indices).
  `SPACING = 20` SVG units per hole. Convert with `value * SPACING`. Physical mm convert
  with the 2.54 factor (`mm / 2.54` → holes).
- **Rotation** is stored in degrees (0/90/180/270) and applied via SVG `rotate()`. Pad
  positions are rotated with a rounded rotation matrix in `getComponentPads`.
- **IDs** are generated with `Date.now()` (plus a random suffix for bulk imports). Type
  prefixes are meaningful and used for dispatch:
  - `custom_*` → user/imported custom component or macro (rendered via `CustomShape`)
  - `saved_resistor_*` → a resistor preset saved to the library
  - built-in string types: `resistor`, `capacitor`, `electrolytic`, `led`, `dip8`,
    `dip16`, `header4`, `male_header`
  - JSON built-ins from `builtinComponents.js` are matched by their `id`.
- **Styling tokens**: use the CSS variables in `src/index.css` (`--accent`, `--bg-panel`,
  `--copper`, `--wire`, `--solder`, `--text-muted`, etc.) rather than hardcoding colors.
  Reuse the `.glass-panel`, `.tool-btn`, `.sidebar`, `.toolbar` classes where possible.
- **Persistence** is JSON only, via Blob download and `FileReader` upload. Preserve
  backward compatibility when changing the schema (see `handleOpenDesign` and the legacy
  `label`/`labelPos` → `texts` migration for the pattern to follow).

## Gotchas

- `getComponentPads` and the geometry helpers in `Board.jsx` (`getIntersection`,
  `generateLinkPath`) hardcode per-type pad layouts and body sizes. When adding a new
  built-in component type, update **all** of: the shape in `ComponentShapes.jsx`, the pad
  layout in `getComponentPads`, the sidebar `CATEGORIES` entry, and any size fallbacks in
  the macro-bounds logic in `App.jsx`.
- Custom components support `bodyWidth`/`bodyHeight` (holes) and `bodyWidth_mm`/
  `bodyHeight_mm` (mm) — several code paths derive one from the other. Keep both in sync.
- `React.StrictMode` is enabled, so effects run twice in dev. The sidebar de-dupes
  injected built-in categories to survive this.
