# Component & Design File Formats

PerfDesigner stores everything as JSON. This document describes the shapes used for
placed components, custom component definitions, JSON module built-ins, and saved designs.
All positions are in **grid units** (hole indices) unless the field name ends in `_mm`.

## Placed component

An instance placed on the board.

```jsonc
{
  "id": "1699999999999",     // unique; generated from Date.now()
  "type": "resistor",         // dispatch key (see below)
  "x": 4,                     // hole column
  "y": 2,                     // hole row
  "layer": "top",             // layer id
  "rotation": 0,              // degrees: 0 | 90 | 180 | 270
  "width": 4,                 // grid holes (may be null → derived by type)
  "height": 1,                // grid holes (may be null → derived by type)
  "params": { }               // type-specific properties (see below)
}
```

### `type` values

| Value | Renderer | Notes |
|-------|----------|-------|
| `resistor` | `Resistor` | `params`: `{ numBands, bands[], valueText }` |
| `capacitor` | `Capacitor` | `params`: `{ uF, voltage }`; footprint grows at ≥1000 µF |
| `electrolytic` | `Electrolytic` | `params`: `{ uF, voltage }`; polarized |
| `led` | `LED` | `params`: `{ color }` |
| `dip8` | `DIP8` | 8-pin DIP (4×2) |
| `dip16` | `DIP8`* | *placeholder reuses DIP8 renderer |
| `header4` | `Header` | female; `params`: `{ pins, baseColor }` |
| `male_header` | `MaleHeader` | male; `params`: `{ pins, baseColor }` |
| `custom_*` | `CustomShape` | looked up in `customComponents` by id |
| `saved_resistor_*` | `Resistor` | resistor preset from library |
| any other | `CustomShape` | matched by `id` in `builtinComponents.js` |

## Custom component definition

Stored in `customComponents` and in exported component files.

```jsonc
{
  "id": "custom_1699999999999",
  "name": "My Sensor",
  "category": "Custom",
  "type": "custom",
  "pads": [ { "x": 0, "y": 0 }, { "x": 0, "y": 1 } ],  // pin holes (grid units)
  "width": 4,                 // grid columns
  "height": 3,                // grid rows
  "bodyWidth": 4,             // body size in holes
  "bodyHeight": 3,
  "bodyWidth_mm": 10.16,      // body size in mm (kept in sync with holes)
  "bodyHeight_mm": 7.62,
  "hideBody": false,          // if true, no body rect (used by macros/breakouts)
  "texts": [                  // free-placed labels (grid-unit position)
    { "text": "VCC", "x": 1, "y": 0, "size": 12 }
  ],
  "childComponents": [ /* placed components, relative coords */ ],  // optional (macros)
  "dependencies": [ /* custom defs referenced by children */ ]      // optional (export)
}
```

Notes:
- Provide either holes (`bodyWidth`/`bodyHeight`) or mm (`bodyWidth_mm`/`bodyHeight_mm`);
  the app derives the missing pair. Keep them consistent when editing by hand.
- `childComponents` makes the definition a **macro/breakout**: those parts render nested at
  their relative positions.
- On import, ids are regenerated and `dependencies` are added as hidden library parts with
  child `type` references remapped.

### Legacy migration
Older files may use `label` (string) + `labelPos` (`{x, y}`) instead of `texts`. On import
these are converted into a single `texts` entry.

## JSON module built-in

Entries in `src/data/builtinComponents.js`. These render through `CustomShape` but ship
with the app and auto-populate the sidebar.

```jsonc
{
  "id": "mpu6050",                 // used as the placed component's type
  "categoryId": "sensors",
  "categoryName": "Sensors",       // sidebar category (created if missing)
  "name": "MPU6050 (Gyro/Accel)",  // sidebar label
  "icon": "🧭",                     // sidebar icon (emoji or short text)
  "def": {                          // a custom component definition (see above)
    "name": "MPU6050",
    "bodyWidth_mm": 15,
    "bodyHeight_mm": 20,
    "hideBody": false,
    "pads": [ { "x": 0, "y": 0 } /* … */ ],
    "texts": [ { "text": "VCC", "size": 11, "x": 0.98, "y": 0.03 } /* … */ ]
  }
}
```

To add a module, append an object here — no other code changes needed. For a module that
embeds other parts (like a breakout with headers), include `childComponents` and set
`hideBody: true` in `def` (see `esp32s3sm_breakout`).

## Resistor config file

Exported/imported by the Resistor Builder.

```jsonc
{
  "type": "resistor_config",
  "numBands": 4,
  "bands": ["#8B4513", "#000000", "#FF0000", "#FFD700"],  // hex per band
  "valueText": "10kΩ ±5%"
}
```

## Saved design file

The full document produced by "Save Design" and consumed by "Open Design".

```jsonc
{
  "boardSize": { "width": 32, "height": 22 },  // holes
  "boardColor": "#142e1d",
  "showGoldBorder": true,
  "dimInactiveLayers": true,
  "components": [ /* placed components */ ],
  "links": [ /* links */ ],
  "customComponents": [ /* custom defs */ ],
  "layers": [
    { "id": "top", "name": "Top Layer", "visible": true },
    { "id": "bottom", "name": "Bottom Layer", "visible": true }
  ]
}
```

If `layers` is absent (legacy file), the app falls back to default Top/Bottom layers.

## Link (net / wire)

```jsonc
{
  "id": "1699999999999",
  "layer": "top",             // top → jumper wire (arcs over crossings); bottom → solder trace
  "color": "#10b981",         // wire color (top layer)
  "points": [ { "x": 1, "y": 1 }, { "x": 5, "y": 1 }, { "x": 5, "y": 4 } ]
}
```
