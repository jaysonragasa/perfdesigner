import React, { useState, useRef, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import NumberInput from './NumberInput';

const PRESETS = [
  { label: '60 × 40 mm  (20 × 14 holes)',  cols: 20, rows: 14 },
  { label: '70 × 50 mm  (24 × 18 holes)',  cols: 24, rows: 18 },
  { label: '80 × 60 mm  (27 × 22 holes)',  cols: 27, rows: 22 },
  { label: '90 × 70 mm  (31 × 26 holes)',  cols: 31, rows: 26 },
  { label: '120 × 80 mm (42 × 30 holes)',  cols: 42, rows: 30 },
  { label: '150 × 90 mm (43 × 69 holes)',  cols: 43, rows: 69 },
  { label: '180 × 120 mm (65 × 46 holes)', cols: 65, rows: 46 },
];

const BoardSettings = ({ onClose, onSave, currentWidth, currentHeight, showGoldBorder, setShowGoldBorder, dimInactiveLayers, setDimInactiveLayers, boardColor, setBoardColor }) => {
  const [widthMM, setWidthMM] = useState((currentWidth * 2.54).toFixed(2));
  const [heightMM, setHeightMM] = useState((currentHeight * 2.54).toFixed(2));
  
  // Dragging logic
  const [isDragging, setIsDragging] = useState(false);
  const [pos, setPos] = useState({ x: window.innerWidth / 2 - 150, y: window.innerHeight / 2 - 100 });
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
    const cols = Math.round((parseFloat(widthMM) || 0) / 2.54);
    const rows = Math.round((parseFloat(heightMM) || 0) / 2.54);
    onSave({ width: Math.max(10, Math.min(100, cols)), height: Math.max(10, Math.min(100, rows)) });
  };

  return (
    <div 
      className="glass-panel"
      ref={modalRef}
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        width: '340px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '12px',
        overflow: 'hidden',
        background: 'rgba(20, 24, 34, 0.85)'
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
        <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--text-main)' }}>Board Settings</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <X size={16} />
        </button>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Presets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Preset Sizes</label>
          <select
            defaultValue=""
            onChange={(e) => {
              const idx = parseInt(e.target.value);
              if (isNaN(idx)) return;
              const preset = PRESETS[idx];
              // derive mm from exact hole counts so rounding is exact
              setWidthMM(parseFloat((preset.cols * 2.54).toFixed(4)));
              setHeightMM(parseFloat((preset.rows * 2.54).toFixed(4)));
              e.target.value = '';
            }}
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-main)',
              borderRadius: '6px',
              padding: '8px 10px',
              fontSize: '13px',
              outline: 'none',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            <option value="" disabled style={{ color: 'var(--text-muted)' }}>— select a preset —</option>
            {PRESETS.map((p, i) => (
              <option key={i} value={i} style={{ background: '#1a1e2e' }}>{p.label}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Width (mm)</label>
            <NumberInput 
              value={widthMM}
              onChange={(val) => setWidthMM(val)}
              min={25.4}
              step={2.54}
            />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Height (mm)</label>
            <NumberInput 
              value={heightMM}
              onChange={(val) => setHeightMM(val)}
              min={25.4}
              step={2.54}
            />
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Color</label>
          <input 
            type="color" 
            value={boardColor}
            onChange={(e) => setBoardColor(e.target.value)}
            style={{
              width: '100%',
              height: '35px',
              boxSizing: 'border-box',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '2px',
              cursor: 'pointer'
            }}
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-main)' }}>
            <input 
              type="checkbox" 
              checked={showGoldBorder} 
              onChange={(e) => setShowGoldBorder(e.target.checked)} 
              style={{ accentColor: 'var(--accent)' }}
            />
            Show Copper Pads on Bottom Layer
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-main)' }}>
            <input 
              type="checkbox" 
              checked={dimInactiveLayers} 
              onChange={(e) => setDimInactiveLayers(e.target.checked)} 
              style={{ accentColor: 'var(--accent)' }}
            />
            Dim Inactive Layers
          </label>
        </div>
      </div>

      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', background: 'rgba(0,0,0,0.2)' }}>
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
          <Save size={14} /> Apply Changes
        </button>
      </div>
    </div>
  );
};

export default BoardSettings;
