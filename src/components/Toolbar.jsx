import { 
  MousePointer2, 
  Cpu, 
  Waypoints, 
  Droplet,
  Save,
  FolderOpen,
  PlusSquare,
  Settings,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#171717', '#f1f5f9'];

const Toolbar = ({ activeLayerId, activeTool, setActiveTool, setActiveLinkId, setShowComponentCreator, setShowBoardSettings, wireColor, setWireColor, onSaveDesign, onOpenDesign, boardTransform, setBoardTransform }) => {
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
        <label className="tool-btn" title="Open Design" style={{ cursor: 'pointer', margin: 0 }}>
          <FolderOpen size={18} />
          <input type="file" accept=".json" style={{ display: 'none' }} onChange={onOpenDesign} />
        </label>
        <button className="tool-btn" title="Save Design" onClick={onSaveDesign}>
          <Save size={18} />
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
