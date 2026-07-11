import React, { useState, useRef, useEffect } from 'react';
import { renderComponent } from './ComponentShapes';
import { RotateCw, Edit2, Trash2 } from 'lucide-react';

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
  
  // Solder traces (bottom layer) just use simple lines without arcs
  if (link.layer === 'bottom') {
    return `M ${link.points[0].x * SPACING} ${link.points[0].y * SPACING} ` + 
           link.points.slice(1).map(p => `L ${p.x * SPACING} ${p.y * SPACING}`).join(' ');
  }

  // Wires (top layer) jump over earlier wires
  let d = `M ${link.points[0].x * SPACING} ${link.points[0].y * SPACING}`;
  const JUMP_R = 8; // Arc radius in pixels
  
  for (let i = 0; i < link.points.length - 1; i++) {
    const A = link.points[i];
    const B = link.points[i + 1];
    
    let intersections = [];
    
    // Check against all PREVIOUS links on the same layer
    for (let prevIdx = 0; prevIdx < index; prevIdx++) {
      const prevLink = allLinks[prevIdx];
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
    if (def && def.pads) localPads = def.pads;
  } else if (comp.type === 'resistor') {
    localPads = [{x: 0, y: 0}, {x: 4, y: 0}];
  } else if (comp.type === 'capacitor' || comp.type === 'electrolytic') {
    const isLarge = comp.params && comp.params.uF >= 1000;
    localPads = [{x: 0, y: 0}, {x: isLarge ? 2 : 1, y: 0}];
  } else if (comp.type === 'led') {
    localPads = [{x: 0, y: 0}, {x: 1, y: 0}];
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

  const rad = (comp.rotation || 0) * Math.PI / 180;
  const cos = Math.round(Math.cos(rad));
  const sin = Math.round(Math.sin(rad));

  return localPads.map(p => ({
    x: comp.x + p.x * cos - p.y * sin,
    y: comp.y + p.x * sin + p.y * cos
  }));
}

const Board = ({ width, height, layers, activeLayerId, showGoldBorder, dimInactiveLayers, boardColor, components, setComponents, links, setLinks, activeLinkId, onPadClick, activeTool, customComponents = [], onEditComponent, onGroupComponents, transform, setTransform }) => {
  const svgRef = useRef(null);
  
  // Pan and Zoom state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [selectedComponentIds, setSelectedComponentIds] = useState([]);
  const [draggedComponent, setDraggedComponent] = useState(null);
  const [draggedComponentStartPos, setDraggedComponentStartPos] = useState(null);
  const [dragStartLinks, setDragStartLinks] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Node drag state
  const [draggedNode, setDraggedNode] = useState(null);

  const boardPxWidth = width * SPACING;
  const boardPxHeight = height * SPACING;

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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault();
        if (selectedComponentIds.length > 0 && onGroupComponents) {
          onGroupComponents(selectedComponentIds);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedComponentIds, onGroupComponents]);

  const handleMouseDown = (e) => {
    if (activeTool === 'select' || e.button === 1 || activeTool === 'component' || activeTool === 'link') {
      if (e.button === 1 || activeTool === 'select') {
        setIsDragging(true);
        setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
      }
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setTransform(prev => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      }));
    } else if (draggedNode) {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const boardX = (mouseX - transform.x) / transform.scale / SPACING;
      const boardY = (mouseY - transform.y) / transform.scale / SPACING;
      
      let snappedX = Math.round(boardX);
      let snappedY = Math.round(boardY);
      
      snappedX = Math.max(0, Math.min(snappedX, width - 1));
      snappedY = Math.max(0, Math.min(snappedY, height - 1));

      setLinks(prev => {
         const newLinks = [...prev];
         const linkIndex = newLinks.findIndex(l => l.id === draggedNode.linkId);
         if (linkIndex === -1) return prev;
         
         const point = newLinks[linkIndex].points[draggedNode.pointIndex];
         if (point.x === snappedX && point.y === snappedY) return prev;

         const newPoints = [...newLinks[linkIndex].points];
         newPoints[draggedNode.pointIndex] = { x: snappedX, y: snappedY };
         
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
         
         const oldPads = getComponentPads(draggedComponentStartPos, customComponents);
         
         setComponents(prev => prev.map(c => 
           c.id === draggedComponent ? { ...c, x: snappedX, y: snappedY } : c
         ));
         
         if (dragStartLinks) {
           setLinks(dragStartLinks.map(link => {
              let changed = false;
              const newPoints = link.points.map(p => {
                 if (oldPads.some(pad => pad.x === p.x && pad.y === p.y)) {
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
    setDragStartLinks(null);
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
    
    // Select the component
    if (e.shiftKey) {
       setSelectedComponentIds(prev => 
         prev.includes(comp.id) ? prev.filter(id => id !== comp.id) : [...prev, comp.id]
       );
    } else {
       if (!selectedComponentIds.includes(comp.id)) {
          setSelectedComponentIds([comp.id]);
       }
    }
    
    // Compute offset so the component doesn't jump to the top-left
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
    setDragStartLinks(links);
  };

  const grid = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      grid.push({ x, y });
    }
  }

  const handlePadInteraction = (x, y, e) => {
    if (isDragging || draggedNode) return;
    onPadClick(x, y);
  };

  return (
    <>
      <svg 
        ref={svgRef}
      style={{ width: '100%', height: '100%', userSelect: 'none', cursor: isDragging ? 'grabbing' : (activeTool === 'select' ? 'grab' : 'crosshair') }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={(e) => e.preventDefault()}
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

        {/* Links (Nets) */}
        {(() => {
          const globallyOrderedLinks = [];
          [...layers].reverse().forEach(layerItem => {
            if (layerItem.visible) {
              globallyOrderedLinks.push(...links.filter(l => (l.layer || 'top') === layerItem.id));
            }
          });
          
          return globallyOrderedLinks.map((link, globalIndex) => {
            if (link.points.length === 0) return null;
            const isBottom = (link.layer || 'top') === 'bottom';
            const pathString = generateLinkPath(link, globalIndex, globallyOrderedLinks);
            const linkLayer = link.layer || 'top';
            
            return (
              <g 
                key={link.id} 
                opacity={dimInactiveLayers ? (activeLayerId === linkLayer ? 1 : 0.4) : 1}
                style={{ pointerEvents: activeLayerId === linkLayer ? 'auto' : 'none' }}
              >
                {link.points.length > 1 && (
                  <path 
                    d={pathString} 
                    fill="none" 
                    stroke={isBottom ? 'var(--solder)' : (link.color || 'var(--wire)')}
                    strokeWidth={isBottom ? 10 : 6}
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
                      onPadClick(p.x, p.y);
                    }}
                  >
                    <circle r={12} fill="transparent" style={{ pointerEvents: 'all' }} />
                    <circle
                      r={isBottom ? 6 : 4}
                      fill={isBottom ? 'var(--solder-hover)' : '#fff'}
                      stroke={isBottom ? 'var(--solder)' : 'var(--wire)'}
                      strokeWidth="2"
                    />
                  </g>
                ))}
              </g>
            );
          });
        })()}

        {/* Drawn Components */}
        {layers.find(l => l.id === 'top')?.visible !== false && components.map(comp => (
          <g 
            key={comp.id}
            opacity={dimInactiveLayers && activeLayerId !== 'top' ? 0.4 : 1}
            onMouseDown={(e) => { if (activeTool !== 'link') handleComponentMouseDown(e, comp); }}
            onClick={(e) => { if (activeTool !== 'link') e.stopPropagation(); }}
            style={{ 
              cursor: draggedComponent === comp.id ? 'grabbing' : 'grab',
              pointerEvents: activeTool === 'link' ? 'none' : 'auto'
            }}
          >
            {renderComponent(comp, activeLayerId, customComponents, selectedComponentIds.includes(comp.id))}
          </g>
        ))}
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
