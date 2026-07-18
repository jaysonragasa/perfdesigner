import React from 'react';
import { Info } from 'lucide-react';

const StatusBar = ({ message }) => {
  return (
    <div className="status-bar">
      <Info size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
      <span className="status-bar-text">{message || 'Ready'}</span>
    </div>
  );
};

export default StatusBar;
