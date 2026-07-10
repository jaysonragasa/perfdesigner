import React from 'react';
import { Trash2 } from 'lucide-react';

const CATEGORIES = [
  {
    name: 'Basic',
    items: [
      { id: 'resistor', name: 'Resistor (THT)', icon: 'R' },
      { id: 'capacitor', name: 'Capacitor (Ceramic)', icon: 'C' },
      { id: 'electrolytic', name: 'Capacitor (Electrolytic)', icon: 'Ce' },
      { id: 'led', name: 'LED (5mm)', icon: 'L' },
    ]
  },
  {
    name: 'Integrated Circuits',
    items: [
      { id: 'dip8', name: 'IC (DIP-8)', icon: 'IC' },
      { id: 'dip16', name: 'IC (DIP-16)', icon: 'IC' },
    ]
  },
  {
    name: 'Connectors',
    items: [
      { id: 'header4', name: 'Female Header (4-pin)', icon: 'H' },
      { id: 'male_header', name: 'Male Header', icon: 'M' },
    ]
  }
];

const Sidebar = ({ activeTool, setActiveTool, selectedComponentType, setSelectedComponentType, customComponents = [], setShowComponentParams, setPendingComponentParams, onImportComponents, onDeleteCustomComponent }) => {
  
  const allCategories = [...CATEGORIES];
  const visibleCustomComps = customComponents.filter(c => !c.deleted);
  if (visibleCustomComps.length > 0) {
    allCategories.push({
      name: 'Custom',
      items: visibleCustomComps.map(c => ({ id: c.id, name: c.name, icon: '⚙️', isCustom: true }))
    });
  }

  return (
    <div className="sidebar" style={{ overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h2 style={{ margin: 0 }}>Components</h2>
        <label 
           className="tool-btn" 
           style={{ cursor: 'pointer', padding: '4px 8px', fontSize: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '4px' }}
        >
           Import
           <input type="file" multiple accept=".json" style={{ display: 'none' }} onChange={onImportComponents} />
        </label>
      </div>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
        Select a component below, then click on the board to place it.
      </p>
      
      <div className="component-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {allCategories.map(cat => (
          <div key={cat.name}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: '8px', fontWeight: '600' }}>
              {cat.name}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {cat.items.map(comp => (
                <div 
                  key={comp.id}
                  className={`component-item ${selectedComponentType === comp.id ? 'selected' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', cursor: 'pointer', borderRadius: '6px' }}
                >
                  <div 
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}
                    onClick={() => {
                      if (comp.id === 'capacitor' || comp.id === 'electrolytic' || comp.id === 'male_header') {
                        if (setShowComponentParams) setShowComponentParams({ type: comp.id });
                      } else {
                        setSelectedComponentType(comp.id);
                        if (activeTool !== 'component') setActiveTool('component');
                        if (setPendingComponentParams) setPendingComponentParams(null);
                      }
                    }}
                  >
                    <div style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                      {comp.icon}
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>{comp.name}</span>
                  </div>
                  {comp.isCustom && onDeleteCustomComponent && (
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteCustomComponent(comp.id);
                      }}
                      style={{ color: 'var(--text-muted)', display: 'flex', padding: '4px' }}
                      title="Delete Component"
                    >
                      <Trash2 size={16} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
