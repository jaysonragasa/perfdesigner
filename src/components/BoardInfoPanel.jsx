import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Grid, Plus, Minus, Sliders } from 'lucide-react';

const PRESET_SIZES = [
  { label: '60 × 40 mm', width: 20, height: 14 },
  { label: '70 × 50 mm', width: 24, height: 18 },
  { label: '82 × 55 mm', width: 32, height: 22 },
  { label: '90 × 70 mm', width: 31, height: 26 },
  { label: '120 × 80 mm', width: 42, height: 30 },
];

const BoardInfoPanel = ({ 
  boardSize, 
  onResizeBoard, 
  componentsCount = 0, 
  linksCount = 0,
  onOpenSettings 
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const widthHoles = boardSize.width;
  const heightHoles = boardSize.height;
  const totalHoles = widthHoles * heightHoles;

  const widthMM = (widthHoles * 2.54).toFixed(1);
  const heightMM = (heightHoles * 2.54).toFixed(1);
  const widthInches = ((widthHoles * 2.54) / 25.4).toFixed(2);
  const heightInches = ((heightHoles * 2.54) / 25.4).toFixed(2);

  const handleAdjust = (axis, delta) => {
    if (!onResizeBoard) return;
    if (axis === 'width') {
      const newWidth = Math.max(5, Math.min(150, widthHoles + delta));
      onResizeBoard({ width: newWidth, height: heightHoles });
    } else {
      const newHeight = Math.max(5, Math.min(150, heightHoles + delta));
      onResizeBoard({ width: widthHoles, height: newHeight });
    }
  };

  return (
    <div 
      className="board-info-panel-container"
      style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        zIndex: 20,
        userSelect: 'none',
        fontFamily: "'Inter', sans-serif"
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Collapsed Pill */}
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(15, 20, 30, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '8px 14px',
            color: 'var(--text-main)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent)';
            e.currentTarget.style.boxShadow = '0 4px 24px var(--accent-glow)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.4)';
          }}
          title="Click to expand perfboard details"
        >
          <Grid size={15} style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.3px' }}>
            {widthHoles} × {heightHoles} holes
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '8px' }}>
            {widthMM} × {heightMM} mm
          </span>
          <ChevronUp size={15} style={{ color: 'var(--text-muted)' }} />
        </button>
      ) : (
        /* Expanded Card */
        <div
          style={{
            width: '280px',
            background: 'rgba(15, 20, 30, 0.90)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Grid size={16} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                Perfboard Details
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {onOpenSettings && (
                <button
                  onClick={onOpenSettings}
                  title="Open Board Settings"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-main)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  <Sliders size={14} />
                </button>
              )}
              <button
                onClick={() => setIsExpanded(false)}
                title="Collapse panel"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-main)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                <ChevronDown size={16} />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Grid Holes Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>
                Grid Matrix
              </div>

              {/* Horizontal Holes */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '6px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Horizontal Holes</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => handleAdjust('width', -1)}
                    title="Decrease width by 1 hole"
                    style={{ width: '22px', height: '22px', borderRadius: '4px', border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Minus size={11} />
                  </button>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', minWidth: '24px', textAlign: 'center' }}>
                    {widthHoles}
                  </span>
                  <button
                    onClick={() => handleAdjust('width', 1)}
                    title="Increase width by 1 hole"
                    style={{ width: '22px', height: '22px', borderRadius: '4px', border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Plus size={11} />
                  </button>
                </div>
              </div>

              {/* Vertical Holes */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '6px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Vertical Holes</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => handleAdjust('height', -1)}
                    title="Decrease height by 1 hole"
                    style={{ width: '22px', height: '22px', borderRadius: '4px', border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Minus size={11} />
                  </button>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', minWidth: '24px', textAlign: 'center' }}>
                    {heightHoles}
                  </span>
                  <button
                    onClick={() => handleAdjust('height', 1)}
                    title="Increase height by 1 hole"
                    style={{ width: '22px', height: '22px', borderRadius: '4px', border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Plus size={11} />
                  </button>
                </div>
              </div>

              {/* Total Hole Count */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 4px', fontSize: '11px', color: 'var(--text-muted)' }}>
                <span>Total Holes:</span>
                <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{totalHoles.toLocaleString()} holes</span>
              </div>
            </div>

            {/* Physical Dimensions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>
                Physical Dimensions (2.54mm Pitch)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '6px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>WIDTH</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>{widthMM} mm</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{widthInches}"</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '6px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>HEIGHT</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>{heightMM} mm</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{heightInches}"</div>
                </div>
              </div>
            </div>

            {/* Quick Presets */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>
                Quick Presets
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {PRESET_SIZES.map(preset => {
                  const isCurrent = preset.width === widthHoles && preset.height === heightHoles;
                  return (
                    <button
                      key={preset.label}
                      onClick={() => onResizeBoard && onResizeBoard({ width: preset.width, height: preset.height })}
                      style={{
                        padding: '3px 7px',
                        fontSize: '10px',
                        fontWeight: isCurrent ? 700 : 500,
                        background: isCurrent ? 'var(--accent-glow)' : 'rgba(255,255,255,0.04)',
                        color: isCurrent ? 'var(--accent)' : 'var(--text-muted)',
                        border: isCurrent ? '1px solid var(--accent)' : '1px solid var(--border-subtle)',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Board Objects Info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid var(--border-subtle)', fontSize: '11px', color: 'var(--text-muted)' }}>
              <span>Placed: <strong style={{ color: 'var(--text-main)' }}>{componentsCount}</strong> comps</span>
              <span>Wiring: <strong style={{ color: 'var(--text-main)' }}>{linksCount}</strong> links</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardInfoPanel;
