import React, { useState, useEffect, useRef } from 'react';
import { X, ZoomIn, ZoomOut, Save, Download, Upload } from 'lucide-react';
import NumberInput from './NumberInput';
import { renderComponent } from './ComponentShapes';

const ComponentCreator = ({ onClose, onSave, editingDef, customComponents = [], onImportDependencies }) => {
  const [name, setName] = useState(editingDef ? editingDef.name : 'My Custom IC');
  const [rows, setRows] = useState(editingDef ? editingDef.height : 3);
  const [cols, setCols] = useState(editingDef ? editingDef.width : 4);
  const [bodyHeight, setBodyHeight] = useState(editingDef ? (editingDef.bodyHeight_mm || (editingDef.height * 2.54)) : 7.62);
  const [bodyWidth, setBodyWidth] = useState(editingDef ? (editingDef.bodyWidth_mm || (editingDef.width * 2.54)) : 10.16);
  
  const [grid, setGrid] = useState([]);
  
  const [texts, setTexts] = useState(() => {
    const initialTexts = editingDef && editingDef.texts ? [...editingDef.texts] : [];
    if (editingDef && editingDef.label) {
      initialTexts.push({ text: editingDef.label, x: editingDef.labelPos?.x || 2, y: editingDef.labelPos?.y || 1.5, size: 12 });
    }
    return initialTexts;
  });
  const [newText, setNewText] = useState('');
  const [newFontSize, setNewFontSize] = useState(25);
  const [selectedTextIndex, setSelectedTextIndex] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [childComponents, setChildComponents] = useState(editingDef ? (editingDef.childComponents || []) : []);
  
  useEffect(() => {
    const computedCols = Math.max(1, Math.round(bodyWidth / 2.54));
    const computedRows = Math.max(1, Math.round(bodyHeight / 2.54));
    if (computedCols !== cols) setCols(computedCols);
    if (computedRows !== rows) setRows(computedRows);
  }, [bodyWidth, bodyHeight]);

  useEffect(() => {
    setGrid(prevGrid => {
      const newGrid = [];
      for (let r = 0; r < Math.min(100, rows); r++) {
        const row = [];
        for (let c = 0; c < Math.min(100, cols); c++) {
          let isActive = false;
          if (prevGrid[r] !== undefined && prevGrid[r][c] !== undefined) {
             isActive = prevGrid[r][c];
          } else if (editingDef && prevGrid.length === 0) {
             isActive = editingDef.pads.some(p => p.x === c && p.y === r);
          } else {
             isActive = false; // Start with no pads active
          }
          row.push(isActive);
        }
        newGrid.push(row);
      }
      return newGrid;
    });
  }, [rows, cols, editingDef]);

  const setPadState = (r, c, state) => {
    const newGrid = [...grid];
    newGrid[r] = [...newGrid[r]];
    newGrid[r][c] = state;
    setGrid(newGrid);
  };

  // Label dragging
  const [draggingTextIndex, setDraggingTextIndex] = useState(null);
  const [textDragOffset, setTextDragOffset] = useState({ x: 0, y: 0 });
  const svgRef = useRef(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const handleWheel = (e) => {
      e.preventDefault();
      setZoom(z => e.deltaY > 0 ? Math.max(0.2, z * 0.9) : Math.min(5, z * 1.1));
    };
    svg.addEventListener('wheel', handleWheel, { passive: false });
    return () => svg.removeEventListener('wheel', handleWheel);
  }, []);

  const handleTextMouseDown = (e, index) => {
    e.stopPropagation();
    setDraggingTextIndex(index);
    
    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) / zoom - 10;
      const mouseY = (e.clientY - rect.top) / zoom - 10;
      
      const currentText = texts[index];
      if (currentText) {
         setTextDragOffset({
            x: (mouseX / 20) - currentText.x,
            y: (mouseY / 20) - currentText.y
         });
      }
    }
  };

  const handleMouseMove = (e) => {
    if (draggingTextIndex !== null && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) / zoom - 10;
      const mouseY = (e.clientY - rect.top) / zoom - 10;
      
      const newX = (mouseX / 20) - textDragOffset.x;
      const newY = (mouseY / 20) - textDragOffset.y;
      
      setTexts(prevTexts => {
        const newTexts = [...prevTexts];
        newTexts[draggingTextIndex] = { ...newTexts[draggingTextIndex], x: newX, y: newY };
        return newTexts;
      });
    }
  };

  const handleMouseUp = () => {
    setDraggingTextIndex(null);
  };

  // Modal dragging
  const [isDraggingModal, setIsDraggingModal] = useState(false);
  const [modalPos, setModalPos] = useState({ x: window.innerWidth / 2 - 350, y: window.innerHeight / 2 - 350 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const modalRef = useRef(null);

  useEffect(() => {
    if (modalRef.current) {
      const rect = modalRef.current.getBoundingClientRect();
      setModalPos({
        x: window.innerWidth / 2 - rect.width / 2,
        y: window.innerHeight / 2 - rect.height / 2
      });
    }
  }, []);

  const handleModalMouseDown = (e) => {
    setIsDraggingModal(true);
    setDragOffset({
      x: e.clientX - modalPos.x,
      y: e.clientY - modalPos.y
    });
  };

  const handleModalMouseMove = (e) => {
    if (isDraggingModal) {
      setModalPos({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  };

  const handleModalMouseUp = () => {
    setIsDraggingModal(false);
  };

  // Global mouse event for dropping
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      handleMouseMove(e);
      handleModalMouseMove(e);
    };
    const handleGlobalMouseUp = () => {
      handleMouseUp();
      handleModalMouseUp();
    };

    if (draggingTextIndex !== null || isDraggingModal) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDraggingModal, draggingTextIndex, dragOffset, modalPos]);

  const handleSave = () => {
    // Generate footprint based on grid
    const activePads = [];
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        if (grid[r][c]) {
          activePads.push({ x: c, y: r });
        }
      }
    }
    
    onSave({
      id: editingDef ? editingDef.id : `custom_${Date.now()}`,
      name,
      category: 'Custom',
      type: 'custom',
      pads: activePads,
      width: Math.min(100, cols),
      height: Math.min(100, rows),
      bodyWidth: Math.min(100, bodyWidth / 2.54),
      bodyHeight: Math.min(100, bodyHeight / 2.54),
      bodyWidth_mm: bodyWidth,
      bodyHeight_mm: bodyHeight,
      hideBody: editingDef?.hideBody || false,
      texts,
      childComponents: childComponents.length > 0 ? childComponents : undefined
    });
  };

  const handleExport = () => {
    const activePads = [];
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        if (grid[r][c]) activePads.push({ x: c, y: r });
      }
    }
    const dependencies = [];
    if (childComponents && childComponents.length > 0) {
      childComponents.forEach(child => {
         if (child.type.startsWith('custom_') || child.type.startsWith('saved_resistor_')) {
            const def = customComponents.find(c => c.id === child.type);
            if (def && !dependencies.find(d => d.id === def.id)) {
               dependencies.push(def);
            }
         }
      });
    }

    const data = {
      name,
      bodyWidth_mm: bodyWidth,
      bodyHeight_mm: bodyHeight,
      hideBody: editingDef?.hideBody || false,
      pads: activePads,
      texts,
      childComponents: childComponents.length > 0 ? childComponents : undefined,
      dependencies: dependencies.length > 0 ? dependencies : undefined
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.replace(/\s+/g, '_')}_component.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.name) setName(data.name);
        if (data.bodyWidth_mm) setBodyWidth(data.bodyWidth_mm);
        if (data.bodyHeight_mm) setBodyHeight(data.bodyHeight_mm);
        
        let importedTexts = data.texts ? [...data.texts] : [];
        if (data.label) {
           importedTexts.push({ text: data.label, x: data.labelPos?.x || 2, y: data.labelPos?.y || 1.5, size: 12 });
        }
        setTexts(importedTexts);
        
        if (data.dependencies && Array.isArray(data.dependencies) && onImportDependencies) {
           const idMap = onImportDependencies(data.dependencies);
           if (data.childComponents && Array.isArray(data.childComponents)) {
              data.childComponents.forEach(child => {
                 if (idMap[child.type]) {
                    child.type = idMap[child.type];
                 }
              });
           }
        }
        
        if (data.childComponents) {
           setChildComponents(data.childComponents);
        } else {
           setChildComponents([]);
        }
        
        if (data.pads && Array.isArray(data.pads)) {
           const newCols = Math.max(1, Math.round((data.bodyWidth_mm || 10.16) / 2.54));
           const newRows = Math.max(1, Math.round((data.bodyHeight_mm || 7.62) / 2.54));
           const newGrid = [];
           for (let r = 0; r < 100; r++) {
             const row = [];
             for (let c = 0; c < 100; c++) {
               row.push(data.pads.some(p => p.x === c && p.y === r));
             }
             newGrid.push(row);
           }
           setGrid(newGrid);
           setCols(newCols);
           setRows(newRows);
        }
      } catch (err) {
        console.error('Failed to import component:', err);
      }
    };
    reader.readAsText(file);
    e.target.value = null; // reset input
  };

  return (
    <div 
      ref={modalRef}
      className="glass-panel"
      style={{
        position: 'fixed',
        left: modalPos.x,
        top: modalPos.y,
        width: '700px',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        overflow: 'hidden'
      }}
    >
      <div 
        style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'grab' }}
        onMouseDown={handleModalMouseDown}
      >
        <span style={{ fontWeight: '600' }}>Component Creator</span>
        <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)}
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', padding: '8px', color: 'white', borderRadius: '4px', outline: 'none', width: '100%', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Grid Rows</label>
            <NumberInput 
              min={1} max={20}
              value={rows} 
              onChange={val => setRows(val || 1)}
            />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Grid Columns</label>
            <NumberInput 
              min={1} max={20}
              value={cols} 
              onChange={val => setCols(val || 1)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Body Height (mm)</label>
            <NumberInput 
              step={0.1} min={1} max={100}
              value={bodyHeight} 
              onChange={val => setBodyHeight(val || 1)}
            />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Body Width (mm)</label>
            <NumberInput 
              step={0.1} min={1} max={100}
              value={bodyWidth} 
              onChange={val => setBodyWidth(val || 1)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', borderRadius: '4px', height: '450px', overflow: 'hidden' }}>
          {/* Inner Toolbar */}
          <div style={{ display: 'flex', padding: '8px', gap: '8px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.05)', alignItems: 'center' }}>
            <button 
              title="Add New Text"
              onClick={() => {
                 setTexts(prev => [...prev, { text: newText || 'Text', size: newFontSize || 25, x: (cols-1) / 2, y: (rows-1) / 2 }]);
                 setSelectedTextIndex(texts.length); // will be the new index
              }}
              style={{ background: 'var(--bg-secondary)', color: 'white', border: '1px solid var(--border-subtle)', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
            >
              A+
            </button>
            
            <div style={{ width: '1px', height: '20px', background: 'var(--border-subtle)', margin: '0 4px' }}></div>
            
            <input 
              type="text" 
              value={newText}
              onChange={e => {
                 setNewText(e.target.value);
                 if (selectedTextIndex !== null && texts[selectedTextIndex]) {
                    setTexts(prev => prev.map((t, i) => i === selectedTextIndex ? { ...t, text: e.target.value } : t));
                 }
              }}
              placeholder="Text" 
              style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', padding: '6px 8px', color: 'white', borderRadius: '4px', outline: 'none', boxSizing: 'border-box', fontSize: '12px' }} 
            />
            
            <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Size:</label>
            <NumberInput 
              min={4} max={72}
              value={newFontSize}
              onChange={val => {
                 const numVal = parseInt(val) || 25;
                 setNewFontSize(numVal);
                 if (selectedTextIndex !== null && texts[selectedTextIndex]) {
                    setTexts(prev => prev.map((t, i) => i === selectedTextIndex ? { ...t, size: numVal } : t));
                 }
              }}
              style={{ width: '90px' }} 
            />
            
            <div style={{ width: '1px', height: '20px', background: 'var(--border-subtle)', margin: '0 4px' }}></div>
            
            <button 
              title="Zoom Out"
              onClick={() => setZoom(z => Math.max(0.2, z * 0.9))}
              style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <ZoomOut size={16} />
            </button>
            <button 
              title="Zoom In"
              onClick={() => setZoom(z => Math.min(5, z * 1.1))}
              style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <ZoomIn size={16} />
            </button>
          </div>

          {/* SVG Area */}
          <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
            <svg 
              ref={svgRef} 
              width={(Math.min(100, cols) * 20 + 20) * zoom} 
              height={(Math.min(100, rows) * 20 + 20) * zoom} 
              style={{ overflow: 'visible', margin: 'auto', display: 'block' }}
              onMouseDown={() => setSelectedTextIndex(null)}
            >
              <g transform={`scale(${zoom}) translate(10, 10)`}>
                {/* Draw component body background */}
                {!(editingDef?.hideBody) && (
                  <rect 
                    x={((cols - 1) * 20) / 2 - ((bodyWidth / 2.54) * 20) / 2} 
                    y={((rows - 1) * 20) / 2 - ((bodyHeight / 2.54) * 20) / 2} 
                    width={(bodyWidth / 2.54) * 20} 
                    height={(bodyHeight / 2.54) * 20} 
                    fill="#1a1a1a" 
                    rx="2" 
                    stroke="#404040" 
                    strokeWidth="1" 
                  />
                )}
                
                {/* Render child components */}
                {childComponents.map((child, i) => (
                  <React.Fragment key={`child-${child.id || i}`}>
                    {renderComponent(child, 'top', customComponents, false)}
                  </React.Fragment>
                ))}
                
                {/* Draw pads */}
                {grid.map((row, r) => (
                  row.map((isActive, c) => (
                    <g 
                      key={`${r}-${c}`} 
                      transform={`translate(${c * 20}, ${r * 20})`}
                      onClick={() => setPadState(r, c, true)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setPadState(r, c, false);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <rect x="-8" y="-8" width="16" height="16" fill="transparent" />
                      {isActive ? (
                         <circle r="4" fill="var(--copper)" stroke="#000" strokeWidth="1" />
                      ) : (
                         <circle r="2" fill="none" stroke="rgba(255,255,255,0.2)" />
                      )}
                    </g>
                  ))
                ))}
                
                {/* Draggable Custom Texts */}
                {texts.map((t, index) => (
                  <g 
                    key={index}
                    transform={`translate(${t.x * 20}, ${t.y * 20})`}
                     onMouseDown={(e) => {
                       handleTextMouseDown(e, index);
                       setSelectedTextIndex(index);
                       setNewText(t.text);
                       setNewFontSize(t.size || 25);
                    }}
                    onContextMenu={(e) => {
                       e.preventDefault();
                       setTexts(prev => prev.filter((_, i) => i !== index));
                       if (selectedTextIndex === index) setSelectedTextIndex(null);
                    }}
                    style={{ cursor: 'move' }}
                  >
                    <text x="0" y="0" fill={selectedTextIndex === index ? 'var(--accent)' : 'white'} fontSize={t.size || 25} textAnchor="middle" dominantBaseline="central" pointerEvents="none">{t.text}</text>
                    <rect x="-10" y="-10" width="20" height="20" fill="transparent" />
                  </g>
                ))}
              </g>
            </svg>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <button 
            onClick={handleExport}
            style={{ flex: 1, background: 'rgba(255,255,255,0.1)', color: 'white', padding: '10px', borderRadius: '6px', fontWeight: '500', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
          >
            <Download size={18} />
            Export
          </button>
          
          <label style={{ flex: 1, background: 'rgba(255,255,255,0.1)', color: 'white', padding: '10px', borderRadius: '6px', fontWeight: '500', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <Upload size={18} />
            Import
            <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
          </label>
        </div>

        <button 
          onClick={handleSave}
          style={{ background: 'var(--accent)', color: 'white', padding: '10px', borderRadius: '6px', fontWeight: '500', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
        >
          <Save size={18} />
          Save Component
        </button>
      </div>
    </div>
  );
};

export default ComponentCreator;
