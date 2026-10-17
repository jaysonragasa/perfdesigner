import { 
  MousePointer2, 
  Cpu, 
  Waypoints, 
  Droplet,
  Save,
  FolderOpen,
  FilePlus,
  PlusSquare,
  Settings,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

// Order: Black, Red, Orange, Yellow, Brown, Violet, Green, White
const COLORS = ['#171717', '#ef4444', '#f59e0b', '#facc15', '#8B4513', '#8b5cf6', '#10b981', '#f1f5f9'];

const Toolbar = ({ activeLayerId, activeTool, setActiveTool, setActiveLinkId, setShowComponentCreator, setShowBoardSettings, wireColor, setWireColor, onSaveDesign, onOpenDesign, onNewDesign, boardTransform, setBoardTransform }) => {
  return (
    <div className="toolbar">
      <div className="toolbar-group">
        <div className="logo" style={{ fontWeight: 'bold', fontSize: '18px', marginRight: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '24px', height: '24px', background: 'var(--accent)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '12px', height: '12px', border: '2px solid white', borderRadius: '50%' }}></div>
          </div>
          PerfDesigner
        </div>
        
        <button 
          className={`tool-btn ${activeTool === 'select' ? 'active' : ''}`}
          onClick={() => setActiveTool('select')}
          title="Select/Move Tool"
        >
          <MousePointer2 size={18} />
          <span>Select</span>
        </button>
        
        <button 
          className={`tool-btn ${activeTool === 'link' ? 'active' : ''}`}
          onClick={() => {
            if (activeTool === 'link' && setActiveLinkId) {
              setActiveLinkId(null); // start fresh if already active
            } else {
              setActiveTool('link');
            }
          }}
          title="Create Links"
        >
          <Waypoints size={18} />
          <span>Create Links</span>
        </button>

        {activeTool === 'link' && activeLayerId !== 'bottom' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '8px', padding: '4px 8px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
            {COLORS.map(c => (
              <div 
                key={c}
                onClick={() => setWireColor && setWireColor(c)}
                style={{ 
                  width: '18px', 
                  height: '18px', 
                  borderRadius: '50%', 
                  background: c, 
                  cursor: 'pointer',
                  border: wireColor === c ? '2px solid white' : '1px solid rgba(255,255,255,0.2)',
                  boxShadow: wireColor === c ? `0 0 8px ${c}` : 'none'
                }}
                title={`Select wire color`}
              />
            ))}
          </div>
        )}
        
        <div style={{ width: '1px', height: '24px', background: 'var(--border-active)', margin: '0 8px' }}></div>
        
        <button 
          className="tool-btn"
          onClick={() => setShowComponentCreator(true)}
          title="Component Creator"
        >
          <PlusSquare size={18} />
          <span>Component Creator</span>
        </button>
      </div>



      
      <div className="toolbar-group">
        <button 
          className="tool-btn" 
          title="Board Settings"
          onClick={() => setShowBoardSettings(true)}
        >
          <Settings size={18} />
        </button>
        <div style={{ width: '1px', height: '24px', background: 'var(--border-active)', margin: '0 8px' }}></div>
        {onNewDesign && (
          <button className="tool-btn" title="New Blank Design" onClick={onNewDesign}>
            <FilePlus size={18} />
          </button>
        )}
        <label className="tool-btn" title="Open Design" style={{ cursor: 'pointer', margin: 0 }}>
          <FolderOpen size={18} />
          <input type="file" accept=".json" style={{ display: 'none' }} onChange={onOpenDesign} />
        </label>
        <button className="tool-btn" title="Export Design (JSON)" onClick={onSaveDesign}>
          <Save size={18} />
        </button>
        <div style={{ width: '1px', height: '24px', background: 'var(--border-subtle)', margin: '0 4px' }}></div>
        <div 
          title="Continuous Auto-Save is active. Changes are automatically saved to your browser's local storage."
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px', 
            fontSize: '11px', 
            color: 'var(--text-muted)',
            padding: '4px 8px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '6px',
            border: '1px solid var(--border-subtle)',
            userSelect: 'none'
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }}></span>
          <span>Auto-saved</span>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
