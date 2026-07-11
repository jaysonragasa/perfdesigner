import React from 'react';
import { BUILTIN_JSON_COMPONENTS } from '../data/builtinComponents';

const SPACING = 20;

export const Resistor = ({ x, y, layer, rotation = 0, params, isSelected }) => {
  // Assuming a horizontal resistor spanning 3 holes (4 pins total length but body in middle)
  const length = 4 * SPACING;
  const numBands = params?.numBands || 4;
  const bands = params?.bands || ['#8B4513', '#000000', '#FF0000', '#FFD700'];

  return (
    <g transform={`translate(${x * SPACING}, ${y * SPACING}) rotate(${rotation})`}>
      {/* Leads */}
      <line x1="0" y1="0" x2={length} y2="0" stroke="#silver" strokeWidth="2" />
      {/* Body */}
      <rect x={length/2 - 15} y="-8" width="30" height="16" fill="#e3c498" rx="4" stroke="#c29b6a" strokeWidth="1" />
      
      {/* Bands */}
      {bands.slice(0, numBands).map((hex, i) => {
        const spacing = 30 / (numBands + 1);
        const xPos = (length / 2 - 15) + spacing * (i + 1);
        return <rect key={i} x={xPos - 1.5} y="-8" width="3" height="16" fill={hex} />
      })}

      {/* Value Text */}
      {params?.valueText && (
        <text x={length/2} y="-12" fill="white" fontSize="10" textAnchor="middle">{params.valueText}</text>
      )}
      
      {/* Pins */}
      <rect x="-3" y="-3" width="6" height="6" fill="#d4af37" />
      <rect x={length - 3} y="-3" width="6" height="6" fill="#d4af37" />
      {isSelected && (
        <rect 
          x="-6" y="-12" width={length + 12} height="24" 
          fill="none" stroke="var(--accent)" strokeWidth="2" strokeDasharray="4 2" pointerEvents="none"
        />
      )}
    </g>
  );
};

export const Capacitor = ({ x, y, layer, rotation = 0, params, isSelected }) => {
  // Ceramic capacitor, spans 1 hole normally
  const isLarge = params && params.uF >= 1000;
  const length = isLarge ? 2 * SPACING : SPACING;
  const r = isLarge ? 14 : 7;
  return (
    <g transform={`translate(${x * SPACING}, ${y * SPACING}) rotate(${rotation})`}>
      <line x1="0" y1="0" x2={length} y2="0" stroke="#silver" strokeWidth="2" />
      <circle cx={length/2} cy="0" r={r} fill="#d99b28" stroke="#b07b1a" strokeWidth="1" />
      
      {/* Pins */}
      <rect x="-3" y="-3" width="6" height="6" fill="#d4af37" />
      <rect x={length - 3} y="-3" width="6" height="6" fill="#d4af37" />

      {params?.uF && (
        <text x={length/2} y={isLarge ? -18 : -12} fill="white" fontSize="10" textAnchor="middle">{params.uF}µF</text>
      )}
      {isSelected && (
        <rect 
          x="-6" y={-r - 4} width={length + 12} height={r * 2 + 8} 
          fill="none" stroke="var(--accent)" strokeWidth="2" strokeDasharray="4 2" pointerEvents="none"
        />
      )}
    </g>
  );
};

export const Electrolytic = ({ x, y, layer, rotation = 0, params, isSelected }) => {
  const isLarge = params && params.uF >= 1000;
  const length = isLarge ? 2 * SPACING : SPACING;
  const r = isLarge ? 16 : 9;
  return (
    <g transform={`translate(${x * SPACING}, ${y * SPACING}) rotate(${rotation})`}>
      <line x1="0" y1="0" x2={length} y2="0" stroke="#silver" strokeWidth="2" />
      <circle cx={length/2} cy="0" r={r} fill="#1a1a1a" stroke="#404040" strokeWidth="1" />
      {/* Grey stripe on the right side (negative pin side) */}
      <path d={`M ${length/2} -${r} A ${r} ${r} 0 0 1 ${length/2} ${r}`} fill="#ccc" />
      {/* Minus sign on the negative side */}
      <line x1={length/2 + r/2 - 3} y1="0" x2={length/2 + r/2 + 3} y2="0" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" />
      
      {/* Pins */}
      <rect x="-3" y="-3" width="6" height="6" fill="#d4af37" />
      <rect x={length - 3} y="-3" width="6" height="6" fill="#d4af37" />

      {params?.uF && (
        <text x={length/2} y={isLarge ? -20 : -14} fill="white" fontSize="10" textAnchor="middle">{params.uF}µF</text>
      )}
      {isSelected && (
        <rect 
          x="-6" y={-r - 4} width={length + 12} height={r * 2 + 8} 
          fill="none" stroke="var(--accent)" strokeWidth="2" strokeDasharray="4 2" pointerEvents="none"
        />
      )}
    </g>
  );
};

export const LED = ({ x, y, layer, rotation = 0, params, isSelected }) => {
  // Spans 2 holes (3 pins)
  const length = 2 * SPACING;
  const color = params?.color || '#ff0000';
  return (
    <g transform={`translate(${x * SPACING}, ${y * SPACING}) rotate(${rotation})`}>
      <line x1="0" y1="0" x2={length} y2="0" stroke="#silver" strokeWidth="2" />
      
      {/* 3-pin LED Body: bigger than normal */}
      <circle cx={length/2} cy="0" r="14" fill={color} stroke="#cc0000" strokeWidth="1" opacity="0.85" />
      
      {/* Glare/highlight to make it look like a lens */}
      <circle cx={length/2} cy="-4" r="6" fill="rgba(255,255,255,0.4)" />
      
      {/* Flat edge for cathode */}
      <line x1={length/2 + 11} y1="-8" x2={length/2 + 11} y2="8" stroke="#aa0000" strokeWidth="3" />
      
      {/* Pins */}
      <rect x="-3" y="-3" width="6" height="6" fill="#d4af37" />
      <rect x={length/2 - 3} y="-3" width="6" height="6" fill="#d4af37" />
      <rect x={length - 3} y="-3" width="6" height="6" fill="#d4af37" />

      {/* Anode indicator (+) */}
      <text x="0" y="-14" fill="white" fontSize="14" fontWeight="bold" textAnchor="middle">+</text>
      
      {/* Cathode indicator (-) */}
      <text x={length} y="-14" fill="white" fontSize="14" fontWeight="bold" textAnchor="middle">-</text>

      {isSelected && (
        <rect 
          x="-10" y="-18" width={length + 20} height="36" 
          fill="none" stroke="var(--accent)" strokeWidth="2" strokeDasharray="4 2" pointerEvents="none"
        />
      )}
    </g>
  );
};

export const DIP8 = ({ x, y, layer, rotation = 0, isSelected }) => {
  // Spans 4x3 holes (pins at y and y+3, from x to x+3)
  return (
    <g transform={`translate(${x * SPACING}, ${y * SPACING}) rotate(${rotation})`}>
      <rect x="-5" y="-5" width={3 * SPACING + 10} height={3 * SPACING + 10} fill="#1a1a1a" rx="2" />
      {/* Notch */}
      <path d={`M -5 ${1.5 * SPACING - 5} A 5 5 0 0 1 -5 ${1.5 * SPACING + 5}`} fill="#1a1a1a" stroke="#404040" strokeWidth="1"/>
      <circle cx="5" cy="5" r="2" fill="#404040" />
      {isSelected && (
        <rect 
          x="-7" y="-7" width={3 * SPACING + 14} height={3 * SPACING + 14} 
          fill="none" stroke="var(--accent)" strokeWidth="2" strokeDasharray="4 2" pointerEvents="none"
        />
      )}
    </g>
  );
};

export const Header = ({ x, y, layer, rotation = 0, params, isSelected }) => {
  const pins = params?.pins || 4;
  const baseColor = params?.baseColor || '#2a2a2a';
  return (
    <g transform={`translate(${x * SPACING}, ${y * SPACING}) rotate(${rotation})`}>
      <rect x="-5" y="-7" width={(pins - 1) * SPACING + 10} height="14" fill={baseColor} rx="1" />
      {Array.from({ length: pins }).map((_, i) => (
        <rect key={i} x={i * SPACING - 4} y="-4" width="8" height="8" fill="#d4af37" />
      ))}
      {isSelected && (
        <rect 
          x="-7" y="-9" width={(pins - 1) * SPACING + 14} height="18" 
          fill="none" stroke="var(--accent)" strokeWidth="2" strokeDasharray="4 2" pointerEvents="none"
        />
      )}
    </g>
  );
};

export const MaleHeader = ({ x, y, layer, rotation = 0, params, isSelected }) => {
  const pins = params?.pins || 4;
  const baseColor = params?.baseColor || '#111111';
  
  return (
    <g transform={`translate(${x * SPACING}, ${y * SPACING}) rotate(${rotation})`}>
      <rect x="-5" y="-7" width={(pins - 1) * SPACING + 10} height="14" fill={baseColor} rx="1" />
      {Array.from({ length: pins }).map((_, i) => (
        <rect key={i} x={i * SPACING - 3} y="-3" width="6" height="6" fill="#d4af37" />
      ))}
      {isSelected && (
        <rect 
          x="-7" y="-9" width={(pins - 1) * SPACING + 14} height="18" 
          fill="none" stroke="var(--accent)" strokeWidth="2" strokeDasharray="4 2" pointerEvents="none"
        />
      )}
    </g>
  );
};

export const CustomShape = ({ x, y, layer, rotation = 0, def, isSelected, customComponents = [] }) => {
  if (!def) return null;

  // Fallback for missing width/height by finding pad bounds
  const padXs = def.pads.map(p => p.x);
  const padYs = def.pads.map(p => p.y);
  const minX = padXs.length > 0 ? Math.min(...padXs) : 0;
  const maxX = padXs.length > 0 ? Math.max(...padXs) : 0;
  const minY = padYs.length > 0 ? Math.min(...padYs) : 0;
  const maxY = padYs.length > 0 ? Math.max(...padYs) : 0;

  const bWidth = def.bodyWidth !== undefined ? def.bodyWidth : (def.bodyWidth_mm !== undefined ? def.bodyWidth_mm / 2.54 : (def.width || (maxX - minX + 1)));
  const bHeight = def.bodyHeight !== undefined ? def.bodyHeight : (def.bodyHeight_mm !== undefined ? def.bodyHeight_mm / 2.54 : (def.height || (maxY - minY + 1)));
  
  const bodyWidthPx = bWidth * SPACING;
  const bodyHeightPx = bHeight * SPACING;
  
  // Mimic how ComponentCreator defines grid cols/rows from mm dimensions during import
  const compGridWidth = def.width !== undefined ? def.width : (def.bodyWidth_mm !== undefined ? Math.max(1, Math.round(def.bodyWidth_mm / 2.54)) : (maxX - minX + 1));
  const compGridHeight = def.height !== undefined ? def.height : (def.bodyHeight_mm !== undefined ? Math.max(1, Math.round(def.bodyHeight_mm / 2.54)) : (maxY - minY + 1));

  // If we have no center defined by grid size, fallback to pad bounds (which we now replaced by compGridWidth/Height)
  const padCenterX = ((compGridWidth - 1) * SPACING) / 2;
  const padCenterY = ((compGridHeight - 1) * SPACING) / 2;
  
  const rectX = padCenterX - (bodyWidthPx / 2);
  const rectY = padCenterY - (bodyHeightPx / 2);

  return (
    <g transform={`translate(${x * SPACING}, ${y * SPACING}) rotate(${rotation})`}>
      {/* Custom IC Body */}
      {!def.hideBody && (
        <rect 
          x={rectX} 
          y={rectY} 
          width={bodyWidthPx} 
          height={bodyHeightPx} 
          fill="#1a1a1a" 
          rx="2"
          stroke="#404040"
          strokeWidth="1"
        />
      )}
      
      {/* Pads (top view, just showing the pins inside the holes) */}
      {def.pads.map((p, i) => (
         <circle key={i} cx={p.x * SPACING} cy={p.y * SPACING} r="3" fill="var(--copper)" />
      ))}
      
      {/* Label (Legacy) */}
      {def.label && def.labelPos && (
        <text x={def.labelPos.x * SPACING} y={def.labelPos.y * SPACING} fill="white" fontSize="12" textAnchor="middle" dominantBaseline="central" pointerEvents="none">{def.label}</text>
      )}
      
      {/* Custom Texts */}
      {def.texts && def.texts.map((t, i) => (
        <text key={`text-${i}`} x={t.x * SPACING} y={t.y * SPACING} fill="white" fontSize={t.size || 25} textAnchor="middle" dominantBaseline="central" pointerEvents="none">{t.text}</text>
      ))}

      {/* Nested Components */}
      {def.childComponents && def.childComponents.map((child, i) => (
        <React.Fragment key={`child-${child.id || i}`}>
          {renderComponent(child, layer, customComponents)}
        </React.Fragment>
      ))}

      {/* Selection Border */}
      {isSelected && (
        <rect 
          x={rectX - 2} y={rectY - 2} width={bodyWidthPx + 4} height={bodyHeightPx + 4} 
          fill="none" stroke="var(--accent)" strokeWidth="2" strokeDasharray="4 2" pointerEvents="none"
        />
      )}
    </g>
  );
};

export const renderComponent = (comp, layer, customComponents = [], isSelected = false) => {
  const props = { x: comp.x, y: comp.y, layer, rotation: comp.rotation, key: comp.id, params: comp.params, isSelected };
  
  if (comp.type.startsWith('custom_')) {
    const def = customComponents.find(c => c.id === comp.type);
    return <CustomShape {...props} def={def} customComponents={customComponents} />;
  }

  if (comp.type.startsWith('saved_resistor_')) {
    return <Resistor {...props} />;
  }

  switch (comp.type) {
    case 'resistor': return <Resistor {...props} />;
    case 'capacitor': return <Capacitor {...props} />;
    case 'electrolytic': return <Electrolytic {...props} />;
    case 'led': return <LED {...props} />;
    case 'dip8': return <DIP8 {...props} />;
    case 'dip16': return <DIP8 {...props} />; // Placeholder for dip16
    case 'header4': return <Header {...props} />;
    case 'male_header': return <MaleHeader {...props} />;
    default: 
      const builtin = BUILTIN_JSON_COMPONENTS.find(c => c.id === comp.type);
      if (builtin) return <CustomShape {...props} def={builtin.def} />;
      return null;
  }
};
