---
inclusion: always
---

# Product Overview

PerfDesigner is a web-based prototyping and layout tool for **perfboards** (dot-matrix
boards) and stripboards. It sits between simple breadboard sketches and full PCB CAD
software (KiCad, Altium), giving makers, hobbyists, and electronics engineers a fast,
focused way to plan point-to-point soldering layouts before touching a soldering iron.

## Who it's for

- Makers and hobbyists building one-off prototypes on perfboard.
- Electronics engineers who want to plan placement and routing without the overhead of
  a full CAD tool.

## Core value

- **Plan ahead** – map component placement and trace routing digitally to avoid wasted
  components and rework.
- **Visualize both sides** – place components on the top layer while routing wires and
  solder bridges on the bottom layer.
- **Save and share** – export designs as JSON to keep or hand off to others.

## Key capabilities

- **Multi-layer routing** – Top and Bottom layers plus user-added custom layers, each
  independently visible/orderable. Top-layer links render as jumper wires (with arcs
  that hop over crossings); bottom-layer links render as flat solder traces.
- **Built-in component library** – THT parts (resistor, ceramic/electrolytic capacitor,
  LED, DIP ICs, male/female headers) plus JSON-defined modules (ESP32 boards, buck
  converters, OLED, sensors, audio amps, etc.).
- **Component Creator** – define custom parts by grid dimensions (mm), pad layout, body
  size, and free-placed text labels. Import/export individual components as JSON.
- **Resistor Builder** – pick 3–6 color bands and get the calculated resistance/tolerance;
  save configured resistors to the library.
- **Macro/Grouping** – group multiple placed components into a single reusable macro
  component (Ctrl+G).
- **Dynamic board settings** – set physical board size in mm (with presets), board mask
  color, copper-pad visibility, and layer dimming.
- **Pan & zoom canvas** – middle-click / select-tool drag to pan, scroll wheel to zoom.

## Design principles

- **Physical-first mental model** – board dimensions are expressed in mm; hole pitch is a
  fixed 2.54 mm (0.1"). Grid coordinates map 1:1 to physical holes.
- **Lightweight and focused** – no netlist/DRC/simulation. The tool is a visual layout
  planner, not an electrical verification suite. Keep new features aligned with that scope.
- **Keep it in the browser** – no backend. Persistence is via JSON file download/upload.
