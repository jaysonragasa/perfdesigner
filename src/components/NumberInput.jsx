import React from 'react';
import { Minus, Plus } from 'lucide-react';

const NumberInput = ({ value, onChange, min, max, step = 1, style = {}, disabled = false }) => {
  const handleDecrement = () => {
    if (disabled) return;
    let newVal = parseFloat(value) - step;
    newVal = parseFloat(newVal.toFixed(4));
    if (min !== undefined && newVal < min) return;
    onChange(newVal);
  };

  const handleIncrement = () => {
    if (disabled) return;
    let newVal = parseFloat(value) + step;
    newVal = parseFloat(newVal.toFixed(4));
    if (max !== undefined && newVal > max) return;
    onChange(newVal);
  };

  const handleChange = (e) => {
    if (disabled) return;
    const val = parseFloat(e.target.value);
    if (isNaN(val)) {
      onChange(e.target.value); // Let them type
      return;
    }
    onChange(val);
  };

  const handleBlur = () => {
    if (disabled) return;
    let val = parseFloat(value);
    if (isNaN(val)) val = min !== undefined ? min : 0;
    if (min !== undefined && val < min) val = min;
    if (max !== undefined && val > max) val = max;
    onChange(val);
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      background: disabled ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.3)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '6px',
      overflow: 'hidden',
      height: '35px',
      opacity: disabled ? 0.5 : 1,
      pointerEvents: disabled ? 'none' : 'auto',
      ...style
    }}>
      <button 
        disabled={disabled}
        onClick={handleDecrement}
        style={{
          width: '24px',
          minWidth: '24px',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          background: 'rgba(255,255,255,0.05)',
          borderRight: '1px solid var(--border-subtle)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          padding: 0
        }}
        onMouseEnter={(e) => { if (!disabled) { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--text-main)'; } }}
        onMouseLeave={(e) => { if (!disabled) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-muted)'; } }}
      >
        <Minus size={13} />
      </button>
      
      <input 
        type="number"
        disabled={disabled}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        style={{
          flex: 1,
          width: '100%',
          minWidth: 0,
          background: 'transparent',
          border: 'none',
          color: 'white',
          textAlign: 'center',
          padding: '0 4px',
          outline: 'none',
          fontFamily: 'inherit',
          fontSize: '13px',
          cursor: disabled ? 'not-allowed' : 'text'
        }}
      />
      
      <button 
        disabled={disabled}
        onClick={handleIncrement}
        style={{
          width: '24px',
          minWidth: '24px',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          background: 'rgba(255,255,255,0.05)',
          borderLeft: '1px solid var(--border-subtle)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          padding: 0
        }}
        onMouseEnter={(e) => { if (!disabled) { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--text-main)'; } }}
        onMouseLeave={(e) => { if (!disabled) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-muted)'; } }}
      >
        <Plus size={13} />
      </button>
    </div>
  );
};

export default NumberInput;
