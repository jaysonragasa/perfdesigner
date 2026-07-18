# Requirements Document

## Introduction

PerfDesigner is a browser-based visual layout tool for designing perfboard (dot-matrix)
and stripboard prototypes. It lets users place electronic components on a grid that maps
1:1 to physical board holes, route wires on the top layer and solder traces on the bottom
layer, build custom and grouped components, and save/load designs as JSON.

This document reverse-engineers the requirements from the existing implementation. It
describes the behavior the app currently delivers so future changes have a shared
baseline. Terminology: a **hole/pad** is one grid intersection; a **component** is a
placed part; a **link** is a multi-point wire or solder trace; a **layer** groups
components and links (Top, Bottom, or custom).

## Requirements

### Requirement 1: Board canvas and navigation

**User Story:** As a maker, I want a pannable, zoomable board grid, so that I can work on
large layouts comfortably.

#### Acceptance Criteria

1. WHEN the app loads THEN the system SHALL display a perfboard of the configured hole
   dimensions with a background dot grid.
2. WHEN the Select tool is active AND the user drags on empty canvas THEN the system SHALL
   pan the view.
3. WHEN the user drags with the middle mouse button THEN the system SHALL pan the view
   regardless of the active tool.
4. WHEN the user scrolls the mouse wheel over the canvas THEN the system SHALL zoom
   toward the cursor position, clamped between 0.2x and 5x.
5. WHEN the user clicks the on-canvas zoom-in/zoom-out buttons THEN the system SHALL zoom
   by a fixed step within the same clamp.
6. WHEN the bottom layer is visible AND "show copper pads" is enabled THEN the system
   SHALL render copper pad rings around each hole.

### Requirement 2: Placing components

**User Story:** As a user, I want to select a component and click to place it, so that I
can populate my board.

#### Acceptance Criteria

1. WHEN the user selects a component in the sidebar THEN the system SHALL activate the
   Component tool with that component type selected.
2. WHEN the Component tool is active AND the user clicks a hole THEN the system SHALL place
   a new instance at that hole on the active layer with rotation 0.
3. WHEN placing a component that requires parameters (resistor, capacitor, electrolytic,
   LED, headers) THEN the system SHALL open the relevant parameter modal before placement
   and apply those parameters to the placed instance.
4. WHEN a capacitor/electrolytic has capacitance ≥ 1000 µF THEN the system SHALL render it
   at the larger 2-hole footprint; otherwise the 1-hole footprint.
5. WHEN the user presses Escape while the Component tool is active THEN the system SHALL
   return to the Select tool.

### Requirement 3: Selecting, moving, and editing components

**User Story:** As a user, I want to select, move, rotate, and delete components, so that I
can arrange my layout.

#### Acceptance Criteria

1. WHEN the user clicks a component THEN the system SHALL select it and show a floating
   toolbar with rotate, edit (custom only), and delete actions.
2. WHEN the user shift-clicks components THEN the system SHALL toggle them in a
   multi-selection.
3. WHEN the user presses Ctrl+A THEN the system SHALL select all components.
4. WHEN the user drags a selected component THEN the system SHALL move all selected
   components together, snapped to the grid and clamped to the board bounds.
5. WHEN a component is moved AND its pads coincide with link points THEN the system SHALL
   move those link points along with it.
6. WHEN the user presses R (or the rotate action) THEN the system SHALL rotate the
   selected components by 90°.
7. WHEN the user presses Delete/Backspace (or the delete action) THEN the system SHALL
   remove the selected components.
8. WHEN the user chooses edit on a parameterized or custom component THEN the system SHALL
   open the appropriate editor pre-filled with its current values.

### Requirement 4: Clipboard operations

**User Story:** As a user, I want copy/cut/paste, so that I can duplicate parts of my
layout quickly.

#### Acceptance Criteria

1. WHEN the user presses Ctrl+C with a selection THEN the system SHALL copy those
   components to an in-app clipboard.
2. WHEN the user presses Ctrl+X with a selection THEN the system SHALL copy them and
   remove them from the board.
3. WHEN the user presses Ctrl+V THEN the system SHALL paste clipboard components onto the
   active layer, offset by 2 holes, and select the pasted copies.

### Requirement 5: Wire and solder-trace routing (links)

**User Story:** As a user, I want to route multi-segment wires and solder bridges, so that
I can plan my connections.

#### Acceptance Criteria

1. WHEN the Create Links tool is active AND the user clicks holes in sequence THEN the
   system SHALL build a continuous link through those points on the active layer.
2. WHEN a link is being drawn AND the user Ctrl-clicks a hole THEN the system SHALL start a
   new link instead of extending the current one.
3. WHEN the user presses Escape THEN the system SHALL end the current link.
4. WHEN a link is on the top layer THEN the system SHALL render it as a colored wire that
   draws jump arcs where it crosses earlier top-layer links.
5. WHEN a link is on the bottom layer THEN the system SHALL render it as a flat solder
   trace with no jump arcs.
6. WHEN the user drags a link node THEN the system SHALL move that point, snapped and
   clamped to the board.
7. WHEN the user right-clicks a link node THEN the system SHALL delete that point, removing
   the link if it becomes empty.
8. WHEN routing on the top layer THEN the system SHALL let the user pick the wire color
   from a preset palette.

### Requirement 6: Layer management

**User Story:** As a user, I want multiple layers with visibility and ordering control, so
that I can separate top wiring from bottom soldering.

#### Acceptance Criteria

1. WHEN the app loads THEN the system SHALL provide default Top and Bottom layers.
2. WHEN the user adds a layer THEN the system SHALL create a new visible layer and make it
   active.
3. WHEN the user toggles a layer's eye icon THEN the system SHALL show/hide that layer's
   components and links.
4. WHEN the user drags layers in the panel THEN the system SHALL reorder them, affecting
   render stacking order.
5. WHEN the user double-clicks a layer name THEN the system SHALL allow renaming it.
6. WHEN the user deletes a non-default layer THEN the system SHALL remove it; the Top and
   Bottom layers SHALL NOT be deletable, and at least one layer SHALL always remain.
7. WHEN "dim inactive layers" is enabled THEN the system SHALL render items on non-active
   layers at reduced opacity and disable their pointer interaction.

### Requirement 7: Board settings

**User Story:** As a user, I want to configure the physical board, so that the design
matches my real hardware.

#### Acceptance Criteria

1. WHEN the user opens Board Settings THEN the system SHALL show width/height in mm derived
   from the current hole counts.
2. WHEN the user picks a preset size THEN the system SHALL populate the mm dimensions from
   the preset's exact hole counts.
3. WHEN the user applies a size THEN the system SHALL convert mm to holes (÷2.54, rounded)
   and clamp between 10 and 100 holes per side.
4. WHEN the user changes the board color THEN the system SHALL update the board mask color.
5. WHEN the user toggles copper pads or layer dimming THEN the system SHALL apply those
   display preferences immediately.

### Requirement 8: Built-in component library

**User Story:** As a user, I want a ready-made parts palette, so that I can start designing
without defining everything myself.

#### Acceptance Criteria

1. WHEN the sidebar renders THEN the system SHALL group components into collapsible
   categories (Basic, Integrated Circuits, Connectors, plus JSON module categories).
2. WHEN the app includes JSON-defined modules THEN the system SHALL inject each into the
   sidebar under its declared category automatically.
3. WHERE a component type carries adjustable properties THEN the system SHALL render it
   with those properties (bands, capacitance label, pin count, color, texts).

### Requirement 9: Custom component creator

**User Story:** As a user, I want to design my own parts, so that I can represent
non-standard modules.

#### Acceptance Criteria

1. WHEN the user opens the Component Creator THEN the system SHALL provide controls for
   name, grid rows/cols, body width/height (mm), pad toggling, and text labels.
2. WHEN the user sets body dimensions in mm THEN the system SHALL derive grid rows/cols
   (mm÷2.54, rounded, min 1).
3. WHEN the user clicks a grid cell THEN the system SHALL toggle a pad on; right-click
   SHALL toggle it off.
4. WHEN the user adds text THEN the system SHALL allow placing/dragging it and setting its
   font size, and right-click SHALL remove it.
5. WHEN the user saves THEN the system SHALL add the definition to the custom library and
   select it for placement; editing an existing definition SHALL update it in place.
6. WHEN the user exports a component THEN the system SHALL download a JSON file including
   any child-component dependencies; importing SHALL restore it with remapped IDs.

### Requirement 10: Resistor builder

**User Story:** As a user, I want a color-band resistor tool, so that I can visualize and
calculate resistor values.

#### Acceptance Criteria

1. WHEN the user opens the Resistor Builder THEN the system SHALL let them choose 3, 4, 5,
   or 6 bands and pick each band color.
2. WHEN band colors change THEN the system SHALL compute and display the resistance and
   tolerance using standard color-code rules.
3. WHEN the user adds the resistor THEN the system SHALL place it with the chosen bands and
   value label.
4. WHEN the user saves to library THEN the system SHALL store a reusable resistor preset.
5. WHEN the user exports/imports a resistor config THEN the system SHALL round-trip it as
   JSON.

### Requirement 11: Grouping into macros

**User Story:** As a user, I want to group several placed components into one reusable
part, so that I can reuse subassemblies.

#### Acceptance Criteria

1. WHEN the user selects multiple components and presses Ctrl+G THEN the system SHALL
   prompt for a macro name.
2. WHEN the macro is saved THEN the system SHALL compute its bounds from all child pads and
   bodies, create a custom definition containing the child components and combined pads,
   add it to the library, and replace the selected components with a single macro instance.
3. WHEN a macro is rendered THEN the system SHALL recursively render its child components
   at their relative positions.

### Requirement 12: Save and load designs

**User Story:** As a user, I want to persist my work, so that I can resume or share it.

#### Acceptance Criteria

1. WHEN the user saves a design THEN the system SHALL prompt for a name and download a JSON
   file containing board size/color, display toggles, components, links, custom
   components, and layers.
2. WHEN the user opens a design file THEN the system SHALL restore all of those from the
   JSON.
3. WHEN a design file lacks a `layers` field (legacy) THEN the system SHALL fall back to
   default Top/Bottom layers.
4. WHEN importing components with legacy `label`/`labelPos` fields THEN the system SHALL
   migrate them into the `texts` array.

### Requirement 13: Importing external components

**User Story:** As a user, I want to import component JSON files, so that I can add parts
shared by others.

#### Acceptance Criteria

1. WHEN the user imports one or more component JSON files THEN the system SHALL add each to
   the custom library with newly generated IDs.
2. WHEN an imported component declares dependencies THEN the system SHALL import those as
   hidden dependency parts and remap child references to the new IDs.
3. WHEN an imported component lacks derived size fields THEN the system SHALL populate
   sensible width/height/body defaults so it renders.

## Glossary

- **Hole / Pad**: one intersection of the perfboard grid, addressed by integer grid
  coordinates `(x, y)`. `SPACING = 20` SVG units per hole; hole pitch is 2.54 mm.
- **Component**: an instance of a part placed on the board (`{ id, type, x, y, layer,
  rotation, width, height, params }`).
- **Link**: a multi-point wire (top layer) or solder trace (bottom layer),
  `{ id, layer, color, points[] }`.
- **Layer**: a named, orderable group `{ id, name, visible }`. `top` and `bottom` are
  special and undeletable.
- **Custom component**: a user- or JSON-defined part rendered by `CustomShape`; type ids
  are prefixed `custom_`.
- **Macro**: a custom component whose definition embeds `childComponents`, created by
  grouping a selection.
- **Built-in JSON module**: a bundled component defined as data in
  `src/data/builtinComponents.js` (e.g. ESP32, buck converter).
- **Active layer**: the layer new components/links are added to; others may be dimmed.
- **THT**: Through-Hole Technology (leaded components soldered through board holes).
