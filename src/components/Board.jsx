import React, { useState, useRef, useEffect } from 'react';
import { renderComponent } from './ComponentShapes';
import { RotateCw, Edit2, Trash2, Ungroup } from 'lucide-react';
import { BUILTIN_JSON_COMPONENTS } from '../data/builtinComponents';

const SPACING = 20; // SVG units between holes
const PAD_OUTER = 12;
const PAD_INNER = 6;

// Finds intersection between segment (A, B) and (C, D)
function getIntersection(A, B, C, D) {
  const tTop = (D.x - C.x) * (A.y - C.y) - (D.y - C.y) * (A.x - C.x);
  const uTop = (C.y - A.y) * (A.x - B.x) - (C.x - A.x) * (A.y - B.y);
  const bottom = (D.y - C.y) * (B.x - A.x) - (D.x - C.x) * (B.y - A.y);
  
  if (bottom !== 0) {
    const t = tTop / bottom;
    const u = uTop / bottom;
    // Strict inequality ensures we don't catch shared endpoints
    if (t > 0.01 && t < 0.99 && u > 0.01 && u < 0.99) {
      return {
        x: A.x + (B.x - A.x) * t,
        y: A.y + (B.y - A.y) * t,
        t: t
      };
    }
  }
  return null;
}

function generateLinkPath(link, index, allLinks) {
  if (link.points.length < 2) return '';

  // Wires jump over earlier wires on the same layer
  let d = `M ${link.points[0].x * SPACING} ${link.points[0].y * SPACING}`;
  const JUMP_R = 8; // Arc radius in pixels
  
  for (let i = 0; i < link.points.length - 1; i++) {
    const A = link.points[i];
    const B = link.points[i + 1];
    
    let intersections = [];
    
    // Check against all PREVIOUS links on the same layer
    for (let prevIdx = 0; prevIdx < index; prevIdx++) {
      const prevLink = allLinks[prevIdx];
      if ((prevLink.layer || 'top') !== (link.layer || 'top')) continue;
      for (let j = 0; j < prevLink.points.length - 1; j++) {
        const C = prevLink.points[j];
        const D = prevLink.points[j + 1];
        const intersect = getIntersection(A, B, C, D);
        if (intersect) intersections.push(intersect);
      }
    }
    
    // Also check against previous segments of the SAME link
    for (let j = 0; j < i - 1; j++) {
       const C = link.points[j];
       const D = link.points[j + 1];
       const intersect = getIntersection(A, B, C, D);
       if (intersect) intersections.push(intersect);
    }
    
    intersections.sort((a, b) => a.t - b.t);
    
    const dx = B.x - A.x;
    const dy = B.y - A.y;
    const len = Math.sqrt(dx*dx + dy*dy);
    
    // Only draw arcs if segment has length
    if (len > 0) {
      const nx = dx / len;
      const ny = dy / len;
      
      let lastValidT = 0;
      
      for (const inter of intersections) {
        // Prevent overlapping arcs if intersections are too close
        if (inter.t - lastValidT < (JUMP_R * 2.5) / (len * SPACING)) continue;
        
        const ix = inter.x * SPACING;
        const iy = inter.y * SPACING;
        
        const sx = ix - nx * JUMP_R;
        const sy = iy - ny * JUMP_R;
        const ex = ix + nx * JUMP_R;
        const ey = iy + ny * JUMP_R;
        
        d += ` L ${sx} ${sy}`;
        // Draw an arc (sweep-flag 1 usually curves upwards relative to direction)
        d += ` A ${JUMP_R} ${JUMP_R} 0 0 1 ${ex} ${ey}`;
        
        lastValidT = inter.t;
      }
    }
    
    d += ` L ${B.x * SPACING} ${B.y * SPACING}`;
  }
  
  return d;
}

export function getComponentPads(comp, customComponents = []) {
  let localPads = [];
  if (comp.type.startsWith('custom_')) {
    const def = customComponents.find(c => c.id === comp.type);
    if (def && def.pads) {
      localPads = def.pads;
    } else {
      const builtin = BUILTIN_JSON_COMPONENTS.find(c => c.id === comp.type || (c.aliases && c.aliases.includes(comp.type)));
      if (builtin && builtin.def && builtin.def.pads) localPads = builtin.def.pads;
    }
  } else {
    const builtin = BUILTIN_JSON_COMPONENTS.find(c => c.id === comp.type || (c.aliases && c.aliases.includes(comp.type)));
    if (builtin && builtin.def && builtin.def.pads) {
      localPads = builtin.def.pads;
    } else if (comp.type === 'resistor') {
    localPads = [{x: 0, y: 0}, {x: 4, y: 0}];
  } else if (comp.type === 'capacitor' || comp.type === 'electrolytic') {
    const isLarge = comp.params && comp.params.uF >= 1000;
    localPads = [{x: 0, y: 0}, {x: isLarge ? 2 : 1, y: 0}];
  } else if (comp.type === 'led') {
    localPads = [{x: 0, y: 0}, {x: 1, y: 0}, {x: 2, y: 0}];
  } else if (comp.type === 'dip8' || comp.type === 'dip16') {
    for (let i=0; i<4; i++) {
      localPads.push({x: i, y: 0});
      localPads.push({x: i, y: 3});
    }
    } else if (comp.type === 'header4' || comp.type === 'male_header') {
      const pins = comp.params?.pins || 4;
      for (let i=0; i<pins; i++) {
        localPads.push({x: i, y: 0});
      }
    }
  }

  const rad = (comp.rotation || 0) * Math.PI / 180;
  const cos = Math.round(Math.cos(rad));
  const sin = Math.round(Math.sin(rad));

  return localPads.map(p => ({
    x: comp.x + p.x * cos - p.y * sin,
    y: comp.y + p.x * sin + p.y * cos
  }));
}

const Board = ({ width, height, layers, activeLayerId, showGoldBorder, dimInactiveLayers, boardColor, components, setComponents, links, setLinks, activeLinkId, onPadClick, activeTool, customComponents = [], onEditComponent, onGroupComponents, onUngroupComponents, transform, setTransform, selectedComponentIds = [], setSelectedComponentIds, onResizeBoard, placingGhost = null, onPlaceGhost, onCancelGhost, onMouseGridChange }) => {
  const svgRef = useRef(null);
  const justDraggedRef = useRef(false);
  const currentMouseGridRef = useRef({ x: 0, y: 0 });

  // Ghost placement position
  const [ghostPos, setGhostPos] = useState(null);

  useEffect(() => {
    if (placingGhost) {
      if (placingGhost.baseX !== undefined && placingGhost.baseY !== undefined) {
        setGhostPos({ x: placingGhost.baseX, y: placingGhost.baseY });
      } else if (currentMouseGridRef.current) {
        setGhostPos({ ...currentMouseGridRef.current });
      }
    } else {
      setGhostPos(null);
    }
  }, [placingGhost]);
  
  // Pan and Zoom state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [draggedComponent, setDraggedComponent] = useState(null); // the anchor component being dragged
  const [draggedComponentsStartPos, setDraggedComponentsStartPos] = useState(null); // map: id -> {x,y}
  const [draggedComponentStartPos, setDraggedComponentStartPos] = useState(null); // anchor start pos
  const [dragStartLinks, setDragStartLinks] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const hasDraggedRef = useRef(false);

  // Node drag state
  const [draggedNode, setDraggedNode] = useState(null);

  // Board Resize state
  const [isResizingBoard, setIsResizingBoard] = useState(false);
  const [resizingHandle, setResizingHandle] = useState(null); // 'corner', 'right', 'bottom'

  const boardPxWidth = width * SPACING;
  const boardPxHeight = height * SPACING;

  const handleResizeMouseDown = (e, handleType) => {
    e.stopPropagation();
    e.preventDefault();

    setIsResizingBoard(true);
    setResizingHandle(handleType);

    const handlePointerMove = (moveEvent) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const mouseCanvasX = (moveEvent.clientX - rect.left - transform.x) / transform.scale;
      const mouseCanvasY = (moveEvent.clientY - rect.top - transform.y) / transform.scale;

      let newWidth = width;
      let newHeight = height;

      if (handleType === 'corner' || handleType === 'right') {
        const targetCols = Math.round((mouseCanvasX + SPACING / 2) / SPACING);
        newWidth = Math.max(5, Math.min(150, targetCols));
      }
      if (handleType === 'corner' || handleType === 'bottom') {
        const targetRows = Math.round((mouseCanvasY + SPACING / 2) / SPACING);
        newHeight = Math.max(5, Math.min(150, targetRows));
      }

      if (onResizeBoard) {
        onResizeBoard({ width: newWidth, height: newHeight });
      }
    };

    const handlePointerUp = () => {
      setIsResizingBoard(false);
      setResizingHandle(null);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Handle Pan and Zoom
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const handleWheel = (e) => {
      e.preventDefault();
      
      const scaleAdjust = e.deltaY > 0 ? 0.9 : 1.1;
      let newScale = transform.scale * scaleAdjust;
      
      newScale = Math.max(0.2, Math.min(newScale, 5));
      
      const rect = svg.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const newX = mouseX - (mouseX - transform.x) * (newScale / transform.scale);
      const newY = mouseY - (mouseY - transform.y) * (newScale / transform.scale);
      
      setTransform({ x: newX, y: newY, scale: newScale });
    };

    svg.addEventListener('wheel', handleWheel, { passive: false });
    return () => svg.removeEventListener('wheel', handleWheel);
  }, [transform]);

  useEffect(() => {
    const handleClick = () => setSelectedComponentIds([]);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);



  const handleMouseDown = (e) => {
    if (placingGhost) {
      if (e.button === 0 && ghostPos) {
        if (onPlaceGhost) onPlaceGhost(ghostPos);
      } else if (e.button === 2) {
        if (onCancelGhost) onCancelGhost();
      }
      return;
    }
    if (activeTool === 'select' || e.button === 1 || activeTool === 'component' || activeTool === 'link') {
      if (e.button === 1 || activeTool === 'select') {
        setIsDragging(true);
        setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
      }
    }
  };

  const handleMouseMove = (e) => {
    const svg = svgRef.current;
    let snappedX = 0;
    let snappedY = 0;
    if (svg) {
      const rect = svg.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const boardX = (mouseX - transform.x) / transform.scale / SPACING;
      const boardY = (mouseY - transform.y) / transform.scale / SPACING;
      
      snappedX = Math.round(boardX);
      snappedY = Math.round(boardY);
      
      snappedX = Math.max(0, Math.min(snappedX, width - 1));
      snappedY = Math.max(0, Math.min(snappedY, height - 1));
      currentMouseGridRef.current = { x: snappedX, y: snappedY };
      if (onMouseGridChange) onMouseGridChange({ x: snappedX, y: snappedY });
    }

    if (placingGhost) {
      if (!ghostPos || ghostPos.x !== snappedX || ghostPos.y !== snappedY) {
        setGhostPos({ x: snappedX, y: snappedY });
      }
      return;
    }

    if (isDragging) {
      setTransform(prev => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      }));
    } else if (draggedNode) {
      if (!svg) return;

      setLinks(prev => {
         const newLinks = [...prev];
         const linkIndex = newLinks.findIndex(l => l.id === draggedNode.linkId);
         if (linkIndex === -1) return prev;
         
         const point = newLinks[linkIndex].points[draggedNode.pointIndex];
         if (point.x === snappedX && point.y === snappedY) return prev;

         const newPoints = [...newLinks[linkIndex].points];
         newPoints[draggedNode.pointIndex] = { x: snappedX, y: snappedY };
         justDraggedRef.current = true;
         
         newLinks[linkIndex] = { ...newLinks[linkIndex], points: newPoints };
         return newLinks;
      });
    } else if (draggedComponent) {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const boardX = (mouseX - transform.x) / transform.scale / SPACING;
      const boardY = (mouseY - transform.y) / transform.scale / SPACING;
      
      let snappedX = Math.round(boardX - dragOffset.x);
      let snappedY = Math.round(boardY - dragOffset.y);
      
      snappedX = Math.max(0, Math.min(snappedX, width - 1));
      snappedY = Math.max(0, Math.min(snappedY, height - 1));

      if (draggedComponentStartPos && (snappedX !== draggedComponentStartPos.x || snappedY !== draggedComponentStartPos.y)) {
         const dx = snappedX - draggedComponentStartPos.x;
         const dy = snappedY - draggedComponentStartPos.y;

         if (dx !== 0 || dy !== 0) {
           hasDraggedRef.current = true;
         }

         // Collect all pads from ALL dragged components
         const allOldPads = [];
         if (draggedComponentsStartPos) {
           Object.values(draggedComponentsStartPos).forEach(startPos => {
             getComponentPads(startPos, customComponents).forEach(pad => allOldPads.push(pad));
           });
         }

         setComponents(prev => prev.map(c => {
           if (!draggedComponentsStartPos || !draggedComponentsStartPos[c.id]) return c;
           const start = draggedComponentsStartPos[c.id];
           return { ...c, x: start.x + dx, y: start.y + dy };
         }));
         
         if (dragStartLinks) {
           setLinks(dragStartLinks.map(link => {
              let changed = false;
              const newPoints = link.points.map(p => {
                 if (allOldPads.some(pad => pad.x === p.x && pad.y === p.y)) {
                    changed = true;
                    return { x: p.x + dx, y: p.y + dy };
                 }
                 return p;
              });
              return changed ? { ...link, points: newPoints } : link;
           }));
         }
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedNode(null);
    setDraggedComponent(null);
    setDraggedComponentStartPos(null);
    setDraggedComponentsStartPos(null);
    setDragStartLinks(null);
    hasDraggedRef.current = false;
  };

  const handleNodeMouseDown = (e, linkId, pointIndex) => {
    if (activeTool !== 'link' && activeTool !== 'select') return;
    e.stopPropagation(); // prevent panning
    setDraggedNode({ linkId, pointIndex });
  };

  const handleNodeContextMenu = (e, linkId, pointIndex) => {
    e.preventDefault();
    e.stopPropagation();
    if (activeTool !== 'link' && activeTool !== 'select') return;

    setLinks(prev => {
      return prev.map(link => {
        if (link.id !== linkId) return link;
        const newPoints = [...link.points];
        newPoints.splice(pointIndex, 1);
        
        // Return null to filter out empty links, but array.map doesn't filter.
        // We'll return the modified link, and handle 0 length below in filter.
        return { ...link, points: newPoints };
      }).filter(link => link.points.length > 0);
    });
  };

  const handleComponentMouseDown = (e, comp) => {
    e.stopPropagation();
    
    // Update selection
    let newSelection;
    if (e.shiftKey) {
       newSelection = selectedComponentIds.includes(comp.id)
         ? selectedComponentIds.filter(id => id !== comp.id)
         : [...selectedComponentIds, comp.id];
    } else {
       newSelection = selectedComponentIds.includes(comp.id)
         ? selectedComponentIds   // keep existing multi-selection
         : [comp.id];             // start fresh single selection
    }
    setSelectedComponentIds(newSelection);
    
    // Compute drag offset relative to the clicked component
    const svg = svgRef.current;
    if (svg) {
      const rect = svg.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const boardX = (mouseX - transform.x) / transform.scale / SPACING;
      const boardY = (mouseY - transform.y) / transform.scale / SPACING;
      
      setDragOffset({ x: boardX - comp.x, y: boardY - comp.y });
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
    
    setDraggedComponent(comp.id);
    setDraggedComponentStartPos({ ...comp });

    // Record start positions of ALL selected (+ clicked) components for multi-drag
    // IMPORTANT: use newSelection (computed above) not selectedComponentIds (stale React state)
    const dragIds = newSelection.length > 0 ? newSelection : [comp.id];
    const startMap = {};
    components.forEach(c => {
      // Store the FULL component snapshot (not just x/y): getComponentPads needs
      // `type`/`rotation` to resolve pads. A bare {x,y} makes comp.type undefined
      // and throws in getComponentPads, which breaks dragging entirely.
      if (dragIds.includes(c.id)) startMap[c.id] = { ...c };
    });
    setDraggedComponentsStartPos(startMap);

    setDragStartLinks(links);
    hasDraggedRef.current = false;
  };

  const grid = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      grid.push({ x, y });
    }
  }

  const handlePadInteraction = (x, y, e) => {
    if (isDragging || draggedNode) return;
    if (placingGhost) {
      if (onPlaceGhost) onPlaceGhost({ x, y });
      return;
    }
    onPadClick(x, y, e);
  };

  return (
    <>
      <svg 
        ref={svgRef}
        style={{ 
          width: '100%', 
          height: '100%', 
          userSelect: 'none', 
          cursor: placingGhost ? 'copy' : (isDragging ? 'grabbing' : (activeTool === 'select' ? 'grab' : 'crosshair')) 
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={(e) => {
          e.preventDefault();
          if (placingGhost && onCancelGhost) onCancelGhost();
        }}
      >
      <defs>
        <pattern id="bg-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx="20" cy="20" r="1" fill="rgba(255,255,255,0.05)" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg-grid)" />

      <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
        <rect 
          x={-SPACING/2} 
          y={-SPACING/2} 
          width={boardPxWidth} 
          height={boardPxHeight} 
          fill={boardColor || 'var(--pcb-base)'} 
          rx="4"
          ry="4"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="2"
        />

        {/* Board Grid */}
        {grid.map(pad => (
          <g 
            key={`${pad.x}-${pad.y}`} 
            transform={`translate(${pad.x * SPACING}, ${pad.y * SPACING})`}
            onClick={(e) => handlePadInteraction(pad.x, pad.y, e)}
            style={{ cursor: 'pointer' }}
          >
            {/* Invisible hit area covering the entire cell */}
            <rect x={-SPACING/2} y={-SPACING/2} width={SPACING} height={SPACING} fill="transparent" />
            
            {layers.find(l => l.id === 'bottom')?.visible && showGoldBorder && (
              <circle 
                cx="0" 
                cy="0" 
                r={PAD_OUTER/2} 
                fill="var(--copper)" 
                stroke="#000" 
                strokeWidth="0.5"
              />
            )}
            <circle 
              cx="0" 
              cy="0" 
              r={PAD_INNER/2} 
              fill="var(--pad-hole)" 
            />
            {/* Highlight active pad for current link */}
            {activeLinkId && links.find(l => l.id === activeLinkId)?.points?.slice(-1)[0]?.x === pad.x && links.find(l => l.id === activeLinkId)?.points?.slice(-1)[0]?.y === pad.y && (
              <circle cx="0" cy="0" r={PAD_OUTER/2 + 2} fill="none" stroke="var(--accent)" strokeWidth="2" />
            )}
          </g>
        ))}

        {/* Layered content: links AND components are drawn per-layer so that
            reordering layers restacks everything on that layer together.
            Layers are iterated in reverse array order so the layer at the top
            of the Layers panel (index 0) is painted last (on top). Link paths
            are precomputed against a global ordering so jump-arc crossing
            detection stays consistent regardless of the render grouping. */}
        {(() => {
          const orderedVisibleLayers = [...layers].reverse().filter(l => l.visible);

          // Global link ordering (matches the panel top-on-top order) for arc detection
          const globallyOrderedLinks = [];
          orderedVisibleLayers.forEach(layerItem => {
            globallyOrderedLinks.push(...links.filter(l => (l.layer || 'top') === layerItem.id));
          });
          const linkPaths = {};
          globallyOrderedLinks.forEach((link, i) => {
            linkPaths[link.id] = generateLinkPath(link, i, globallyOrderedLinks);
          });

          const renderLink = (link) => {
            if (link.points.length === 0) return null;
            const linkLayer = link.layer || 'top';
            const isBottom = linkLayer === 'bottom';
            const pathString = linkPaths[link.id];

            return (
              <g
                key={link.id}
                opacity={dimInactiveLayers ? (activeLayerId === linkLayer ? 1 : 0.5) : 1}
                style={{ pointerEvents: activeLayerId === linkLayer ? 'auto' : 'none' }}
              >
                {link.points.length > 1 && (
                  <path
                    d={pathString}
                    fill="none"
                    stroke={link.color || (isBottom ? 'var(--solder)' : 'var(--wire)')}
                    strokeWidth={6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ pointerEvents: 'none' }}
                  />
                )}
                {/* Nodes for dragging/deletion */}
                {link.points.map((p, index) => (
                  <g
                    key={`${link.id}-${index}`}
                    transform={`translate(${p.x * SPACING}, ${p.y * SPACING})`}
                    style={{ cursor: 'move', pointerEvents: activeLayerId === linkLayer ? 'auto' : 'none' }}
                    onContextMenu={(e) => handleNodeContextMenu(e, link.id, index)}
                    onMouseDown={(e) => handleNodeMouseDown(e, link.id, index)}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (justDraggedRef.current) {
                        justDraggedRef.current = false;
                        return;
                      }
                      onPadClick(p.x, p.y, e);
                    }}
                  >
                    <circle r={12} fill="transparent" style={{ pointerEvents: 'all' }} />
                    <circle
                      r={4}
                      fill={isBottom ? 'var(--solder-hover)' : '#fff'}
                      stroke={link.color || (isBottom ? 'var(--solder)' : 'var(--wire)')}
                      strokeWidth="2"
                    />
                  </g>
                ))}
              </g>
            );
          };

          const renderComp = (comp) => {
            const compLayerId = comp.layer || 'top';
            return (
              <g
                key={comp.id}
                opacity={dimInactiveLayers && activeLayerId !== compLayerId ? 0.5 : 1}
                onMouseDown={(e) => {
                  if (placingGhost) {
                    e.stopPropagation();
                    if (onPlaceGhost && ghostPos) onPlaceGhost(ghostPos);
                    return;
                  }
                  if (activeTool !== 'link') handleComponentMouseDown(e, comp);
                }}
                onClick={(e) => {
                  if (placingGhost) {
                    e.stopPropagation();
                    return;
                  }
                  if (activeTool !== 'link') e.stopPropagation();
                }}
                style={{
                  cursor: placingGhost ? 'copy' : (draggedComponent === comp.id ? 'grabbing' : 'grab'),
                  pointerEvents: activeTool === 'link' ? 'none' : 'auto'
                }}
              >
                {renderComponent(comp, activeLayerId, customComponents, selectedComponentIds.includes(comp.id))}
              </g>
            );
          };

          // For each layer (bottom-of-stack first): draw its links, then its
          // components on top of those links, within the same layer.
          return orderedVisibleLayers.map(layerItem => {
            const layerLinks = links.filter(l => (l.layer || 'top') === layerItem.id);
            const layerComps = components.filter(c => (c.layer || 'top') === layerItem.id);
            return (
              <g key={`layer-${layerItem.id}`}>
                {layerLinks.map(renderLink)}
                {layerComps.map(renderComp)}
              </g>
            );
          });
        })()}

        {/* Ghost Placement Preview */}
        {placingGhost && ghostPos && (
          <g 
            className="placement-ghost" 
            opacity={0.65} 
            style={{ 
              pointerEvents: 'none', 
              filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.75))' 
            }}
          >
            {placingGhost.items.map((item, idx) => {
              const compAtGhostPos = {
                ...item,
                id: `ghost_preview_${idx}`,
                x: Math.max(0, Math.min(width - 1, ghostPos.x + (item.relX || 0))),
                y: Math.max(0, Math.min(height - 1, ghostPos.y + (item.relY || 0))),
                layer: activeLayerId,
                rotation: item.rotation || 0
              };
              return (
                <g key={compAtGhostPos.id}>
                  {renderComponent(compAtGhostPos, activeLayerId, customComponents, true)}
                </g>
              );
            })}
          </g>
        )}

        {/* Floating Board Resize Grips */}
        {onResizeBoard && (() => {
          const brX = boardPxWidth - SPACING / 2;
          const brY = boardPxHeight - SPACING / 2;
          const midY = (boardPxHeight - SPACING) / 2;
          const midX = (boardPxWidth - SPACING) / 2;

          return (
            <g className="board-resize-controls" style={{ userSelect: 'none' }}>
              {/* Right Edge Grip */}
              <g
                transform={`translate(${brX}, ${midY})`}
                style={{ cursor: 'ew-resize' }}
                onMouseDown={(e) => handleResizeMouseDown(e, 'right')}
              >
                <title>Drag to resize board width</title>
                <rect x="-6" y="-16" width="14" height="32" fill="transparent" />
                <rect
                  x="-3"
                  y="-12"
                  width="7"
                  height="24"
                  rx="3.5"
                  fill={isResizingBoard && resizingHandle === 'right' ? 'var(--accent)' : '#1e293b'}
                  stroke="var(--accent)"
                  strokeWidth="1.5"
                  style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))' }}
                />
                <line x1="0.5" y1="-6" x2="0.5" y2="6" stroke={isResizingBoard && resizingHandle === 'right' ? '#fff' : 'rgba(255,255,255,0.7)'} strokeWidth="1.5" strokeLinecap="round" />
              </g>

              {/* Bottom Edge Grip */}
              <g
                transform={`translate(${midX}, ${brY})`}
                style={{ cursor: 'ns-resize' }}
                onMouseDown={(e) => handleResizeMouseDown(e, 'bottom')}
              >
                <title>Drag to resize board height</title>
                <rect x="-16" y="-6" width="32" height="14" fill="transparent" />
                <rect
                  x="-12"
                  y="-3"
                  width="24"
                  height="7"
                  rx="3.5"
                  fill={isResizingBoard && resizingHandle === 'bottom' ? 'var(--accent)' : '#1e293b'}
                  stroke="var(--accent)"
                  strokeWidth="1.5"
                  style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))' }}
                />
                <line x1="-6" y1="0.5" x2="6" y2="0.5" stroke={isResizingBoard && resizingHandle === 'bottom' ? '#fff' : 'rgba(255,255,255,0.7)'} strokeWidth="1.5" strokeLinecap="round" />
              </g>

              {/* Corner Floating Resize Grip */}
              <g
                transform={`translate(${brX}, ${brY})`}
                style={{ cursor: 'nwse-resize' }}
                onMouseDown={(e) => handleResizeMouseDown(e, 'corner')}
              >
                <title>Drag to resize board (width & height)</title>
                <circle cx="6" cy="6" r="22" fill="transparent" />
                <rect
                  x="-2"
                  y="-2"
                  width="20"
                  height="20"
                  rx="5"
                  fill={isResizingBoard && resizingHandle === 'corner' ? 'var(--accent)' : '#1e293b'}
                  stroke="var(--accent)"
                  strokeWidth="1.5"
                  style={{ filter: 'drop-shadow(0 3px 10px rgba(0,0,0,0.6))' }}
                />
                <line x1="4" y1="14" x2="14" y2="4" stroke={isResizingBoard && resizingHandle === 'corner' ? '#fff' : 'var(--accent)'} strokeWidth="1.5" strokeLinecap="round" />
                <line x1="8" y1="14" x2="14" y2="8" stroke={isResizingBoard && resizingHandle === 'corner' ? '#fff' : 'var(--accent)'} strokeWidth="1.5" strokeLinecap="round" />
                <line x1="12" y1="14" x2="14" y2="12" stroke={isResizingBoard && resizingHandle === 'corner' ? '#fff' : 'var(--accent)'} strokeWidth="1.5" strokeLinecap="round" />
              </g>

              {/* Live Floating Dimension Badge while resizing */}
              {isResizingBoard && (
                <g transform={`translate(${brX + 26}, ${brY + 12})`} style={{ pointerEvents: 'none' }}>
                  <rect
                    x="0"
                    y="-14"
                    width="170"
                    height="36"
                    rx="8"
                    fill="rgba(15, 23, 42, 0.95)"
                    stroke="var(--accent)"
                    strokeWidth="1.5"
                    style={{ filter: 'drop-shadow(0 6px 20px rgba(0,0,0,0.6))' }}
                  />
                  <text x="85" y="-1" fill="#fff" fontSize="12" fontWeight="700" textAnchor="middle" dominantBaseline="middle">
                    {width} × {height} holes
                  </text>
                  <text x="85" y="11" fill="var(--text-muted)" fontSize="10" textAnchor="middle" dominantBaseline="middle">
                    {(width * 2.54).toFixed(1)} × {(height * 2.54).toFixed(1)} mm
                  </text>
                </g>
              )}
            </g>
          );
        })()}
      </g>
    </svg>
      
    {/* HTML Floating Selection Toolbar */}
      {selectedComponentIds.length === 1 && (() => {
        const selectedComp = components.find(c => c.id === selectedComponentIds[0]);
        if (!selectedComp) return null;
        
        // Calculate screen coordinates
        const screenX = (selectedComp.x * SPACING) * transform.scale + transform.x;
        const screenY = (selectedComp.y * SPACING) * transform.scale + transform.y;
        
        // Center the toolbar horizontally above the component
        const compWidthPx = (selectedComp.width || 4) * SPACING * transform.scale;
        
        return (
          <div 
            className="glass-panel"
            style={{
              position: 'absolute',
              left: screenX + compWidthPx / 2,
              top: screenY - (20 * transform.scale) - 55, // Positioned safely above the scaled component
              transform: 'translateX(-50%)',
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'row', // Horizontal layout
              gap: '6px',
              padding: '6px',
              background: 'var(--bg-primary)',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button 
              className="tool-btn"
              title="Rotate 90°"
              onClick={() => {
                setComponents(prev => prev.map(c => 
                  c.id === selectedComponentIds[0] ? { ...c, rotation: (c.rotation || 0) + 90 } : c
                ));
              }}
            >
              <RotateCw size={18} />
            </button>
            
            {selectedComp.type.startsWith('custom_') && (
              <button 
                className="tool-btn"
                title="Edit Component"
                onClick={() => {
                  if (onEditComponent) onEditComponent(selectedComponentIds[0]);
                  setSelectedComponentIds([]);
                }}
              >
                <Edit2 size={18} />
              </button>
            )}

            {(() => {
              let def = null;
              if (selectedComp.type.startsWith('custom_')) {
                def = customComponents.find(c => c.id === selectedComp.type);
              } else {
                const builtin = BUILTIN_JSON_COMPONENTS.find(c => c.id === selectedComp.type || (c.aliases && c.aliases.includes(selectedComp.type)));
                if (builtin) def = builtin.def;
              }

              if (def && def.childComponents && def.childComponents.length > 0) {
                return (
                  <button 
                    className="tool-btn"
                    title="Ungroup Component (Ctrl+Shift+G)"
                    onClick={() => {
                      if (onUngroupComponents) onUngroupComponents([selectedComp.id]);
                    }}
                  >
                    <Ungroup size={18} />
                  </button>
                );
              }
              return null;
            })()}
            
            <div style={{ width: '1px', background: 'var(--border-subtle)', margin: '4px 0' }}></div>
            
            <button 
              className="tool-btn"
              title="Delete Component"
              style={{ color: '#ef4444' }}
              onClick={() => {
                setComponents(prev => prev.filter(c => c.id !== selectedComponentIds[0]));
                setSelectedComponentIds([]);
              }}
            >
              <Trash2 size={18} />
            </button>
          </div>
        );
      })()}
    </>
  );
};

export default Board;
