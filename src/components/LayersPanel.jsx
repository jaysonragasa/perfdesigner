import React, { useState } from 'react';
import { Eye, EyeOff, GripVertical, Plus, Trash2 } from 'lucide-react';

const LayersPanel = ({ layers, setLayers, activeLayerId, setActiveLayerId }) => {
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const handleDragStart = (e, index) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
      if (e.target) e.target.style.opacity = '0.4';
    }, 0);
  };

  const handleDragEnd = (e) => {
    if (e.target) e.target.style.opacity = '1';
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (dragOverIdx !== index) {
      setDragOverIdx(index);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOverIdx(null);
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    setDragOverIdx(null);
    
    if (draggedIdx === null || draggedIdx === index) {
      if (e.target) e.target.style.opacity = '1';
      return;
    }
    
    const newLayers = [...layers];
    const [moved] = newLayers.splice(draggedIdx, 1);
    newLayers.splice(index, 0, moved);
    setLayers(newLayers);
    setDraggedIdx(null);
  };

  const toggleVisibility = (id) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
  };

  const addNewLayer = () => {
    const id = `layer_${Date.now()}`;
    const newLayer = {
      id,
      name: `Layer ${layers.length + 1}`,
      visible: true
    };
    setLayers([newLayer, ...layers]);
    setActiveLayerId(id);
  };

  const deleteLayer = (id) => {
    const remaining = layers.filter(l => l.id !== id);
    if (remaining.length === 0) return; // Prevent deleting all layers
    setLayers(remaining);
    if (activeLayerId === id) {
      setActiveLayerId(remaining[0].id);
    }
  };

  const startRename = (layer) => {
    setEditingId(layer.id);
    setEditName(layer.name);
  };

  const saveRename = () => {
    if (editingId && editName.trim()) {
      setLayers(prev => prev.map(l => l.id === editingId ? { ...l, name: editName.trim() } : l));
    }
    setEditingId(null);
  };

  return (
    <div style={{
      width: '240px',
      background: 'var(--bg-panel)',
      borderLeft: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 5,
      color: 'white'
    }}>
      <div style={{
        padding: '16px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h2 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', margin: 0, color: 'var(--text-muted)' }}>
          Layers
        </h2>
        <button 
          onClick={addNewLayer}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          title="New Layer"
        >
          <Plus size={18} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {layers.map((layer, idx) => {
          const isDragOver = dragOverIdx === idx;
          const showTopBorder = isDragOver && draggedIdx !== null && draggedIdx > idx;
          const showBottomBorder = isDragOver && draggedIdx !== null && draggedIdx < idx;
          
          return (
            <div
              key={layer.id}
              draggable
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, idx)}
              onClick={() => setActiveLayerId(layer.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px',
                marginBottom: '4px',
                background: activeLayerId === layer.id ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                border: `1px solid ${activeLayerId === layer.id ? 'var(--accent)' : 'var(--border-subtle)'}`,
                borderTop: showTopBorder ? '2px solid var(--accent)' : undefined,
                borderBottom: showBottomBorder ? '2px solid var(--accent)' : undefined,
                borderRadius: '6px',
                cursor: 'pointer',
                opacity: layer.visible ? 1 : 0.5,
                transition: 'var(--trans-fast)'
              }}
            >
            <div style={{ cursor: 'grab', marginRight: '8px', color: 'var(--text-muted)' }}>
              <GripVertical size={16} />
            </div>
            
            <div 
              onClick={(e) => { e.stopPropagation(); toggleVisibility(layer.id); }}
              style={{ marginRight: '10px', color: layer.visible ? 'white' : 'var(--text-muted)' }}
            >
              {layer.visible ? <Eye size={16} /> : <EyeOff size={16} />}
            </div>

            <div style={{ flex: 1, overflow: 'hidden' }} onDoubleClick={() => startRename(layer)}>
              {editingId === layer.id ? (
                <input
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={saveRename}
                  onKeyDown={(e) => e.key === 'Enter' && saveRename()}
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.5)',
                    border: '1px solid var(--accent)',
                    color: 'white',
                    padding: '2px 4px',
                    borderRadius: '4px',
                    outline: 'none',
                    fontSize: '13px'
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span style={{ fontSize: '13px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {layer.name}
                </span>
              )}
            </div>

            {(layer.id !== 'top' && layer.id !== 'bottom') && (
              <div 
                onClick={(e) => { e.stopPropagation(); deleteLayer(layer.id); }}
                style={{ marginLeft: '8px', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <Trash2 size={16} />
              </div>
            )}
          </div>
        )})}
      </div>
    </div>
  );
};

export default LayersPanel;
