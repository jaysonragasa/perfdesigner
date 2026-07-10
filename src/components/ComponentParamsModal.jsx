import React, { useState, useRef, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import NumberInput from './NumberInput';

const ComponentParamsModal = ({ onClose, onSave, initialParams = {}, componentType }) => {
  const [uF, setUF] = useState(initialParams.uF || 100);
  const [voltage, setVoltage] = useState(initialParams.voltage || 25);
  
  const [pins, setPins] = useState(initialParams.pins || 4);
  const [baseColor, setBaseColor] = useState(initialParams.baseColor || '#111111');
  
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
    if (isCapacitor) {
      onSave({ uF, voltage });
    } else if (isMaleHeader) {
      onSave({ pins, baseColor });
    }
  };

  const isCapacitor = componentType === 'capacitor' || componentType === 'electrolytic';
  const isMaleHeader = componentType === 'male_header';

  return (
    <div 
      className="glass-panel"
      ref={modalRef}
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        width: '320px',
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
        <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--text-main)', textTransform: 'capitalize' }}>
          {componentType} Properties
        </h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <X size={16} />
        </button>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {isCapacitor && (
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Capacitance (µF)</label>
              <NumberInput 
                value={uF}
                onChange={(val) => setUF(val)}
                min={1}
              />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Voltage (V)</label>
              <NumberInput 
                value={voltage}
                onChange={(val) => setVoltage(val)}
                min={1}
              />
            </div>
          </div>
        )}
        {isMaleHeader && (
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Number of Pins</label>
              <NumberInput 
                value={pins}
                onChange={(val) => setPins(val)}
                min={1}
                max={40}
              />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Base Color</label>
              <input 
                type="color" 
                value={baseColor}
                onChange={(e) => setBaseColor(e.target.value)}
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
          </div>
        )}
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
          <Save size={14} /> Apply
        </button>
      </div>
    </div>
  );
};

export default ComponentParamsModal;
