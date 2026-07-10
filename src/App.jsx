import React, { useState, useEffect } from 'react';
import './App.css';
import Board from './components/Board';
import Toolbar from './components/Toolbar';
import Sidebar from './components/Sidebar';
import ComponentCreator from './components/ComponentCreator';
import BoardSettings from './components/BoardSettings';
import ComponentParamsModal from './components/ComponentParamsModal';

import LayersPanel from './components/LayersPanel';

function App() {
  const [layers, setLayers] = useState([
    { id: 'top', name: 'Top Layer', visible: true },
    { id: 'bottom', name: 'Bottom Layer', visible: true }
  ]);
  const [activeLayerId, setActiveLayerId] = useState('top');
  const [showGoldBorder, setShowGoldBorder] = useState(true);
  const [dimInactiveLayers, setDimInactiveLayers] = useState(true);
  const [boardColor, setBoardColor] = useState('#142e1d');
  const [activeTool, setActiveTool] = useState('select'); // 'select', 'component', 'link'
  const [selectedComponentType, setSelectedComponentType] = useState(null);
  const [showComponentCreator, setShowComponentCreator] = useState(false);
  const [showBoardSettings, setShowBoardSettings] = useState(false);
  const [showComponentParams, setShowComponentParams] = useState(null);
  const [pendingComponentParams, setPendingComponentParams] = useState(null);
  const [customComponents, setCustomComponents] = useState([]);
  const [wireColor, setWireColor] = useState('#10b981'); // Default to green wire
  
  // Board Data
  const [boardSize, setBoardSize] = useState({ width: 40, height: 30 });
  const [boardTransform, setBoardTransform] = useState({ x: 50, y: 50, scale: 1 });
  
  const [components, setComponents] = useState([]);
  const [links, setLinks] = useState([]);
  const [activeLinkId, setActiveLinkId] = useState(null);

  // Clear active link if tool changes
  useEffect(() => {
    if (activeTool !== 'link') {
      setActiveLinkId(null);
    }
  }, [activeTool]);

  // Press ESC to end current link
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActiveLinkId(null);
        if (activeTool === 'component') setActiveTool('select');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTool]);

  const handlePadClick = (x, y) => {
    if (activeTool === 'component' && selectedComponentType) {
      let compWidth = null;
      let compHeight = null;
      if (selectedComponentType === 'capacitor' || selectedComponentType === 'electrolytic') {
        compWidth = (pendingComponentParams && pendingComponentParams.uF >= 1000) ? 2 : 1;
      } else if (selectedComponentType.startsWith('custom_')) {
        const def = customComponents.find(c => c.id === selectedComponentType);
        if (def) {
          compWidth = def.bodyWidth !== undefined ? def.bodyWidth : def.width;
          compHeight = def.bodyHeight !== undefined ? def.bodyHeight : def.height;
        }
      }
      
      const newComponent = {
        id: Date.now().toString(),
        type: selectedComponentType,
        x,
        y,
        rotation: 0,
        width: compWidth,
        height: compHeight,
        params: pendingComponentParams || null
      };
      setComponents([...components, newComponent]);
    } else if (activeTool === 'link') {
      setLinks(prevLinks => {
        const newLinks = [...prevLinks];
        if (activeLinkId) {
          // Append to existing active link
          const linkIndex = newLinks.findIndex(l => l.id === activeLinkId);
          if (linkIndex !== -1) {
            // Check if clicking the same pad twice (ignore)
            const lastPoint = newLinks[linkIndex].points[newLinks[linkIndex].points.length - 1];
            if (lastPoint.x !== x || lastPoint.y !== y) {
              newLinks[linkIndex] = {
                ...newLinks[linkIndex],
                points: [...newLinks[linkIndex].points, { x, y }]
              };
            }
          }
        } else {
          // Start a new link
          const newId = Date.now().toString();
          newLinks.push({
            id: newId,
            layer: activeLayerId, // The layer it was started on
            color: activeLayerId === 'top' ? wireColor : (layers.find(l => l.id === activeLayerId)?.color || wireColor),
            points: [{ x, y }]
          });
          setActiveLinkId(newId);
        }
        return newLinks;
      });
    }
  };

  const handleSaveDesign = () => {
    const name = prompt('Enter design name:', 'MyDesign');
    if (!name) return;
    
    const designData = {
      boardSize,
      boardColor,
      showGoldBorder,
      dimInactiveLayers,
      components,
      links,
      customComponents,
      layers
    };
    
    const blob = new Blob([JSON.stringify(designData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenDesign = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.boardSize) setBoardSize(data.boardSize);
        if (data.boardColor) setBoardColor(data.boardColor);
        if (data.showGoldBorder !== undefined) setShowGoldBorder(data.showGoldBorder);
        if (data.dimInactiveLayers !== undefined) setDimInactiveLayers(data.dimInactiveLayers);
        if (data.components) setComponents(data.components);
        if (data.links) setLinks(data.links);
        if (data.customComponents) setCustomComponents(data.customComponents);
        if (data.layers) {
          setLayers(data.layers);
        } else {
          // Legacy support
          setLayers([
            { id: 'top', name: 'Top Layer', visible: true },
            { id: 'bottom', name: 'Bottom Layer', visible: true }
          ]);
        }
      } catch (err) {
        alert('Failed to parse design file.');
      }
    };
    reader.readAsText(file);
    e.target.value = null; // reset
  };

  const handleImportComponents = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    let importedCount = 0;
    const newComps = [];
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          if (data.name && data.pads) {
            data.id = `custom_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
            
            // Migrate legacy labels to texts on bulk import too!
            if (!data.texts) data.texts = [];
            if (data.label) {
               data.texts.push({ text: data.label, x: data.labelPos?.x || 2, y: data.labelPos?.y || 1.5, size: 12 });
               delete data.label;
               delete data.labelPos;
            }
            
            // Populate derived fields required by Board.jsx for rendering
            if (data.bodyWidth_mm) {
               data.bodyWidth = data.bodyWidth_mm / 2.54;
               if (!data.width) data.width = Math.max(1, Math.round(data.bodyWidth_mm / 2.54));
            } else if (!data.width) {
               data.width = 4;
               data.bodyWidth = 4;
            }
            if (data.bodyHeight_mm) {
               data.bodyHeight = data.bodyHeight_mm / 2.54;
               if (!data.height) data.height = Math.max(1, Math.round(data.bodyHeight_mm / 2.54));
            } else if (!data.height) {
               data.height = 3;
               data.bodyHeight = 3;
            }
            
            data.type = 'custom';
            data.category = 'Custom';

            newComps.push(data);
          }
        } catch (err) {
          console.error('Failed to parse', file.name);
        }
        importedCount++;
        if (importedCount === files.length) {
          setCustomComponents(prev => [...prev, ...newComps]);
        }
      };
      reader.readAsText(file);
    });
    e.target.value = null;
  };

  const handleDeleteCustomComponent = (compId) => {
    const componentName = customComponents.find(c => c.id === compId)?.name || 'this component';
    const uses = components.filter(c => c.type === compId);
    
    let deleteInstances = false;
    if (uses.length > 0) {
       const confirmMsg = `There are ${uses.length} instances of "${componentName}" on the board. Do you want to delete them as well?\n\nClick OK to delete instances from the board.\nClick Cancel to keep them on the board.`;
       deleteInstances = window.confirm(confirmMsg);
       
       if (deleteInstances) {
           setComponents(prev => prev.filter(c => c.type !== compId));
       }
    }
    
    // Mark as deleted so it doesn't show in the Sidebar, but can still render on the board if kept
    setCustomComponents(prev => prev.map(c => c.id === compId ? { ...c, deleted: true } : c));
    
    if (selectedComponentType === compId) {
       setSelectedComponentType(null);
    }
  };

  return (
    <div className="app-container">
      <Toolbar 
        activeLayerId={activeLayerId}
        activeTool={activeTool} 
        setActiveTool={setActiveTool} 
        setActiveLinkId={setActiveLinkId}
        setShowComponentCreator={setShowComponentCreator}
        setShowBoardSettings={setShowBoardSettings}
        wireColor={wireColor}
        setWireColor={setWireColor}
        onSaveDesign={handleSaveDesign}
        onOpenDesign={handleOpenDesign}
        boardTransform={boardTransform}
        setBoardTransform={setBoardTransform}
      />
      <div className="main-area">
        <Sidebar 
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          selectedComponentType={selectedComponentType}
          setSelectedComponentType={setSelectedComponentType}
          customComponents={customComponents}
          setShowComponentParams={setShowComponentParams}
          setPendingComponentParams={setPendingComponentParams}
          onImportComponents={handleImportComponents}
          onDeleteCustomComponent={handleDeleteCustomComponent}
        />
        <div className="canvas-container">
          <Board 
            width={boardSize.width} 
            height={boardSize.height} 
            layers={layers}
            activeLayerId={activeLayerId}
            showGoldBorder={showGoldBorder}
            dimInactiveLayers={dimInactiveLayers}
            boardColor={boardColor}
            components={components}
            setComponents={setComponents}
            links={links}
            setLinks={setLinks}
            activeLinkId={activeLinkId}
            onPadClick={handlePadClick}
            activeTool={activeTool}
            customComponents={customComponents}
            transform={boardTransform}
            setTransform={setBoardTransform}
            onEditComponent={(compId) => {
              const comp = components.find(c => c.id === compId);
              if (comp && comp.type.startsWith('custom_')) {
                const def = customComponents.find(c => c.id === comp.type);
                if (def) setShowComponentCreator(def);
              } else if (comp && (comp.type === 'capacitor' || comp.type === 'electrolytic' || comp.type === 'male_header')) {
                setShowComponentParams({ type: comp.type, editingId: comp.id, params: comp.params });
              }
            }}
          />
        </div>
        <LayersPanel 
          layers={layers} 
          setLayers={setLayers} 
          activeLayerId={activeLayerId} 
          setActiveLayerId={setActiveLayerId} 
        />
      </div>
      {showComponentCreator && (
        <ComponentCreator 
          editingDef={typeof showComponentCreator === 'object' ? showComponentCreator : null}
          onClose={() => setShowComponentCreator(false)}
          onSave={(comp) => {
            if (typeof showComponentCreator === 'object') {
              setCustomComponents(customComponents.map(c => c.id === comp.id ? comp : c));
            } else {
              setCustomComponents([...customComponents, comp]);
            }
            setShowComponentCreator(false);
            setActiveTool('component');
            setSelectedComponentType(comp.id);
          }}
        />
      )}
      {showBoardSettings && <BoardSettings 
            currentWidth={boardSize.width} 
            currentHeight={boardSize.height} 
            onSave={(newSize) => {
              setBoardSize(newSize);
              setShowBoardSettings(false);
            }} 
            onClose={() => setShowBoardSettings(false)} 
            showGoldBorder={showGoldBorder}
            setShowGoldBorder={setShowGoldBorder}
            dimInactiveLayers={dimInactiveLayers}
            setDimInactiveLayers={setDimInactiveLayers}
            boardColor={boardColor}
            setBoardColor={setBoardColor}
          />}
      {showComponentParams && (
        <ComponentParamsModal
          componentType={showComponentParams.type}
          initialParams={showComponentParams.params || {}}
          onClose={() => setShowComponentParams(null)}
          onSave={(params) => {
            if (showComponentParams.editingId) {
              setComponents(components.map(c => {
                if (c.id === showComponentParams.editingId) {
                  let compWidth = c.width;
                  if (c.type === 'capacitor' || c.type === 'electrolytic') {
                    compWidth = (params && params.uF >= 1000) ? 2 : 1;
                  }
                  return { ...c, params, width: compWidth };
                }
                return c;
              }));
            } else {
              setPendingComponentParams(params);
              setSelectedComponentType(showComponentParams.type);
              setActiveTool('component');
            }
            setShowComponentParams(null);
          }}
        />
      )}
    </div>
  );
}

export default App;
