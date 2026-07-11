import React, { useState, useRef, useEffect } from 'react';
import { X, Save, Download, Upload, Library } from 'lucide-react';

const COLORS = [
  { name: 'Black', hex: '#000000', val: 0, mult: 1, tol: null },
  { name: 'Brown', hex: '#8B4513', val: 1, mult: 10, tol: 1 },
  { name: 'Red', hex: '#FF0000', val: 2, mult: 100, tol: 2 },
  { name: 'Orange', hex: '#FFA500', val: 3, mult: 1000, tol: null },
  { name: 'Yellow', hex: '#FFFF00', val: 4, mult: 10000, tol: null },
  { name: 'Green', hex: '#008000', val: 5, mult: 100000, tol: 0.5 },
  { name: 'Blue', hex: '#0000FF', val: 6, mult: 1000000, tol: 0.25 },
  { name: 'Violet', hex: '#EE82EE', val: 7, mult: 10000000, tol: 0.1 },
  { name: 'Gray', hex: '#808080', val: 8, mult: 100000000, tol: 0.05 },
  { name: 'White', hex: '#FFFFFF', val: 9, mult: 1000000000, tol: null },
  { name: 'Gold', hex: '#FFD700', val: null, mult: 0.1, tol: 5 },
  { name: 'Silver', hex: '#C0C0C0', val: null, mult: 0.01, tol: 10 },
];

const formatRes = (val) => {
  if (isNaN(val) || val === null) return '???';
  if (val >= 1e6) return (val / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'MΩ';
  if (val >= 1e3) return (val / 1e3).toFixed(2).replace(/\.?0+$/, '') + 'kΩ';
  return val.toFixed(2).replace(/\.?0+$/, '') + 'Ω';
};

const ResistorBuilderModal = ({ onClose, onSave, onSaveToLibrary, initialParams = {} }) => {
  const [numBands, setNumBands] = useState(initialParams.numBands || 4);
  const [bands, setBands] = useState(initialParams.bands || [COLORS[1].hex, COLORS[0].hex, COLORS[2].hex, COLORS[10].hex]);
  
  // Update band array length if numBands changes
  useEffect(() => {
    if (bands.length < numBands) {
      const newBands = [...bands];
      while (newBands.length < numBands) newBands.push(COLORS[0].hex);
      setBands(newBands);
    } else if (bands.length > numBands) {
      setBands(bands.slice(0, numBands));
    }
  }, [numBands]);

  const updateBand = (index, hex) => {
    const newBands = [...bands];
    newBands[index] = hex;
    setBands(newBands);
  };

  const getCalculatedValue = () => {
    const b = bands.map(h => COLORS.find(c => c.hex === h) || COLORS[0]);
    if (numBands === 3 || numBands === 4) {
      const d1 = b[0]?.val ?? 0;
      const d2 = b[1]?.val ?? 0;
      const mult = b[2]?.mult ?? 1;
      const tol = numBands === 4 ? (b[3]?.tol ?? 20) : 20;
      const val = (d1 * 10 + d2) * mult;
      return `${formatRes(val)} ±${tol}%`;
    } else {
      const d1 = b[0]?.val ?? 0;
      const d2 = b[1]?.val ?? 0;
      const d3 = b[2]?.val ?? 0;
      const mult = b[3]?.mult ?? 1;
      const tol = b[4]?.tol ?? 20;
      const val = (d1 * 100 + d2 * 10 + d3) * mult;
      return `${formatRes(val)} ±${tol}%`;
    }
  };

  // Dragging logic
  const [isDragging, setIsDragging] = useState(false);
  const [pos, setPos] = useState({ x: window.innerWidth / 2 - 200, y: window.innerHeight / 2 - 250 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const modalRef = useRef(null);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - pos.x,
      y: e.clientY - pos.y
    });
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        setPos({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
      }
    };
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleSave = () => {
    onSave({ 
      numBands, 
      bands: bands.slice(0, numBands), 
      valueText: getCalculatedValue() 
    });
  };

  const handleExportJSON = () => {
    const data = {
      type: 'resistor_config',
      numBands,
      bands: bands.slice(0, numBands),
      valueText: getCalculatedValue()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resistor_${getCalculatedValue().replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.type === 'resistor_config' && data.numBands && data.bands) {
          setNumBands(data.numBands);
          setBands(data.bands);
        } else {
          alert('Invalid resistor configuration file.');
        }
      } catch (err) {
        alert('Failed to parse file.');
      }
    };
    reader.readAsText(file);
    e.target.value = null; // Reset input
  };

  const handleSaveToLibrary = () => {
    onSaveToLibrary({
      numBands,
      bands: bands.slice(0, numBands),
      valueText: getCalculatedValue()
    });
  };

  return (
    <div 
      className="glass-panel"
      ref={modalRef}
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        width: '380px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '12px',
        overflow: 'hidden',
        background: 'rgba(20, 24, 34, 0.95)'
      }}
    >
      <div 
        style={{ 
          padding: '12px 16px', 
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'grab',
          background: 'rgba(255,255,255,0.02)'
        }}
        onMouseDown={handleMouseDown}
      >
        <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--text-main)', textTransform: 'capitalize' }}>
          Resistor Builder
        </h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <X size={16} />
        </button>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Preview Area */}
        <div style={{ 
          padding: '20px', 
          background: 'rgba(0,0,0,0.3)', 
          borderRadius: '8px', 
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{ color: 'var(--accent)', fontSize: '20px', fontWeight: 'bold' }}>
            {getCalculatedValue()}
          </div>
          <svg width="200" height="60" viewBox="0 0 100 30">
            {/* Leads */}
            <line x1="0" y1="15" x2="100" y2="15" stroke="#silver" strokeWidth="2" />
            {/* Body */}
            <rect x="20" y="5" width="60" height="20" fill="#e3c498" rx="4" stroke="#c29b6a" strokeWidth="1" />
            {/* Bands */}
            {bands.slice(0, numBands).map((hex, i) => {
              const spacing = 50 / (numBands + 1);
              const xPos = 20 + spacing * (i + 1);
              return <rect key={i} x={xPos - 2} y="5" width="4" height="20" fill={hex} />
            })}
          </svg>
        </div>

        {/* Band Count Selection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Number of Bands</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[3, 4, 5, 6].map(n => (
              <button
                key={n}
                onClick={() => setNumBands(n)}
                style={{
                  flex: 1,
                  padding: '8px',
                  background: numBands === n ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                  color: numBands === n ? '#fff' : 'var(--text-main)',
                  border: '1px solid ' + (numBands === n ? 'var(--accent)' : 'var(--border-subtle)'),
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Band Color Selection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }}>
          {bands.slice(0, numBands).map((bandHex, i) => {
            let label = `Band ${i + 1}`;
            if (numBands === 3) {
              if (i === 0) label = 'Digit 1';
              if (i === 1) label = 'Digit 2';
              if (i === 2) label = 'Multiplier';
            } else if (numBands === 4) {
              if (i === 0) label = 'Digit 1';
              if (i === 1) label = 'Digit 2';
              if (i === 2) label = 'Multiplier';
              if (i === 3) label = 'Tolerance';
            } else {
              if (i === 0) label = 'Digit 1';
              if (i === 1) label = 'Digit 2';
              if (i === 2) label = 'Digit 3';
              if (i === 3) label = 'Multiplier';
              if (i === 4) label = 'Tolerance';
              if (i === 5) label = 'Temp Coeff.';
            }

            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '80px', fontSize: '12px', color: 'var(--text-muted)' }}>{label}</div>
                <select 
                  value={bandHex}
                  onChange={(e) => updateBand(i, e.target.value)}
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '4px',
                    color: 'white',
                    outline: 'none'
                  }}
                >
                  {COLORS.map(c => {
                    let text = c.name;
                    if (label.startsWith('Digit') && c.val !== null) {
                      text += ` (${c.val})`;
                    } else if (label === 'Multiplier' && c.mult !== null) {
                      text += ` (x${c.mult})`;
                    } else if (label === 'Tolerance' && c.tol !== null) {
                      text += ` (±${c.tol}%)`;
                    }
                    return (
                      <option key={c.name} value={c.hex}>
                        {text}
                      </option>
                    );
                  })}
                </select>
                <div style={{ 
                  width: '24px', 
                  height: '24px', 
                  background: bandHex, 
                  borderRadius: '4px',
                  border: '1px solid rgba(255,255,255,0.2)' 
                }} />
              </div>
            );
          })}
        </div>

      </div>

      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <label style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px',
            background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)',
            borderRadius: '6px', cursor: 'pointer'
          }} title="Import JSON">
            <Upload size={14} />
            <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportJSON} />
          </label>
          <button onClick={handleExportJSON} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px',
            background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)',
            borderRadius: '6px', cursor: 'pointer'
          }} title="Export JSON">
            <Download size={14} />
          </button>
          <button onClick={handleSaveToLibrary} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)',
            padding: '0 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px'
          }} title="Save to Library">
            <Library size={14} /> Save
          </button>
        </div>

        <button 
          onClick={handleSave}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--accent)',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '500'
          }}
        >
          <Save size={14} /> Add Resistor
        </button>
      </div>
    </div>
  );
};

export default ResistorBuilderModal;
