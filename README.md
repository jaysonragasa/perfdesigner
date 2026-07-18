# PerfDesigner

PerfDesigner is a modern, web-based prototyping and layout tool specifically designed for perfboards (dot matrix boards) and stripboards. It bridges the gap between simple breadboard sketches and full-blown PCB CAD software, allowing makers, hobbyists, and electronics engineers to visually plan their point-to-point soldering layouts before turning on their soldering irons.

## 🚀 Why do you need it?

When building prototypes on perfboard, it's easy to make a mistake in routing, run out of space, or solder a component in the wrong spot. While professional PCB CAD tools (like KiCad or Altium) are immensely powerful, they are often overkill for simple one-off perfboard projects. 

PerfDesigner provides a lightweight, focused environment to:
- **Plan ahead**: Map out component placements and trace routes digitally to avoid mistakes and wasted components.
- **Visualize the board**: See your components on the top layer while simultaneously routing wires and solder bridges on the bottom layer.
- **Save and Share**: Export your designs as JSON files to keep track of your projects or share them with others.

## ✨ Features

- **Multi-Layer Routing**: Seamlessly switch between Top and Bottom layers. Route your physical wires on the top and map out solder bridges on the bottom.
- **Rich Component Library**: Comes with built-in THT (Through-Hole Technology) components like Resistors, Ceramic/Electrolytic Capacitors, LEDs, DIP ICs, and Headers.
- **Custom Component Creator**: Need a specialized sensor module or a non-standard IC? Use the built-in Component Creator to define your own parts, specifying dimensions, pin counts, and colors.
- **Dynamic Board Settings**: Adjust the physical dimensions of your board (in mm) and customize the board mask color to match your physical hardware.
- **Smart Opacity & Layering**: Dim inactive layers and components to easily see what's happening underneath, making complex routing tasks a breeze.
- **Accordion Components Panel**: Organize your workspace with a sleek, categorized component sidebar.
- **Pan & Zoom Canvas**: Navigate your large designs intuitively using middle-click drag and scroll-wheel zoom.

## 🛠️ Tech Stack

PerfDesigner is built with a fast and modern web stack, focusing on performance, modularity, and an excellent developer experience.

- **Frontend Framework**: [React](https://react.dev/) (Functional Components, Hooks)
- **Build Tool**: [Vite](https://vitejs.dev/) (Extremely fast HMR and optimized builds)
- **Styling**: Pure CSS (Custom properties for dynamic theming, variables, and dark mode aesthetics)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Graphics**: SVG (Scalable Vector Graphics) for high-performance, crisp, and interactive canvas rendering without the overhead of WebGL.

## 📦 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/jaysonragasa/perfdesigner.git
   cd perfdesigner
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`.

## 📚 Documentation

- [Architecture](docs/ARCHITECTURE.md) – module map, state model, coordinate systems, and
  how to add features.
- [Component & Design File Formats](docs/COMPONENT_FORMAT.md) – JSON shapes for placed
  components, custom definitions, JSON modules, resistor configs, and saved designs.
- Specs and steering for AI-assisted development live in `.kiro/` (`specs/perfboard-designer`
  and `steering/`).
