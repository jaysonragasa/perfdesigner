import React from 'react';
import { Minus, Plus } from 'lucide-react';

const NumberInput = ({ value, onChange, min, max, step = 1, style = {} }) => {
  const handleDecrement = () => {
    const newVal = parseFloat(value) - step;
    if (min !== undefined && newVal < min) return;
    onChange(newVal);
  };

  const handleIncrement = () => {
    const newVal = parseFloat(value) + step;
    if (max !== undefined && newVal > max) return;
    onChange(newVal);
  };

  const handleChange = (e) => {
    const val = parseFloat(e.target.value);
    if (isNaN(val)) {
      onChange(e.target.value); // Let them type
      return;
    }
    onChange(val);
  };

  const handleBlur = () => {
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
      background: 'rgba(0,0,0,0.3)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '6px',
      overflow: 'hidden',
      height: '35px',
      ...style
    }}>
      <button 
        onClick={handleDecrement}
        style={{
          width: '32px',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          background: 'rgba(255,255,255,0.05)',
          borderRight: '1px solid var(--border-subtle)'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--text-main)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
      >
        <Minus size={14} />
      </button>
      
      <input 
        type="number"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        style={{
          flex: 1,
          width: '100%',
          background: 'transparent',
          border: 'none',
          color: 'white',
          textAlign: 'center',
          padding: '0 8px',
          outline: 'none',
          fontFamily: 'inherit',
          fontSize: '13px'
        }}
      />
      
      <button 
        onClick={handleIncrement}
        style={{
          width: '32px',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          background: 'rgba(255,255,255,0.05)',
          borderLeft: '1px solid var(--border-subtle)'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--text-main)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
      >
        <Plus size={14} />
      </button>
    </div>
  );
};

export default NumberInput;
