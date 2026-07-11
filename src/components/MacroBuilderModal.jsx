import React, { useState } from 'react';

const MacroBuilderModal = ({ onClose, onSave }) => {
  const [name, setName] = useState('New Macro');

  return (
    <div 
      onClick={(e) => e.stopPropagation()}
      style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div className="glass-panel" style={{ width: '300px', padding: '20px', borderRadius: '12px', background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Create Component Group</h3>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Component Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', color: 'white', borderRadius: '4px', outline: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button 
            className="tool-button" 
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            onClick={() => onSave(name)}
            style={{ background: 'var(--accent)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Save to Library
          </button>
        </div>
      </div>
    </div>
  );
};

export default MacroBuilderModal;
