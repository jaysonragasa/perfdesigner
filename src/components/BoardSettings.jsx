import React, { useState, useRef, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import NumberInput from './NumberInput';

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
