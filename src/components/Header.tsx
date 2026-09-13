import React from 'react';

interface HeaderProps {
  engineReady: boolean;
  engineStatusText: string;
  memoryMB: number | null;
  onOpenBYOK: () => void;
  hasCustomKey: boolean;
  activeTab: 'copilot' | 'nielit';
  onSelectTab: (tab: 'copilot' | 'nielit') => void;
}

export const Header: React.FC<HeaderProps> = ({
  engineReady,
  engineStatusText,
  memoryMB,
  onOpenBYOK,
  hasCustomKey,
  activeTab,
  onSelectTab,
}) => {
  return (
    <header className="audit-header">
      <div className="header-left">
        <div className="system-pill">R WEBASSEMBLY RUNTIME</div>
        <div className="title-group">
          <h1>BrowserLab R</h1>
          <span className="version-tag">WASM 4.3 // Zero-Cloud Statistical Studio & NIELIT IDE</span>
        </div>
      </div>

      <nav className="header-nav-tabs">
        <button
          type="button"
          className={`nav-tab-btn ${activeTab === 'nielit' ? 'active' : ''}`}
          onClick={() => onSelectTab('nielit')}
          id="tab-nielit-lab"
        >
          <span className="tab-icon">🎓</span>
          <span className="tab-text">NIELIT 'A' Level R Lab & Console</span>
          <span className="tab-badge">Practical Labs</span>
        </button>

        <button
          type="button"
          className={`nav-tab-btn ${activeTab === 'copilot' ? 'active' : ''}`}
          onClick={() => onSelectTab('copilot')}
          id="tab-ai-copilot"
        >
          <span className="tab-icon">🛡️</span>
          <span className="tab-text">AI Statistical Audit Co-Pilot</span>
        </button>
      </nav>

      <div className="header-right">
        <div className={`engine-chip ${engineReady ? 'ready' : 'loading'}`}>
          <span className="pulse-indicator" />
          <span className="chip-label">{engineStatusText}</span>
        </div>

        <div className="telemetry-chip" title="Browser Tab JS Heap Footprint">
          <span className="label">HEAP:</span>
          <span className="value">{memoryMB !== null ? `${memoryMB} MB` : 'ACTIVE'}</span>
        </div>

        {activeTab === 'copilot' && (
          <button className="byok-button" onClick={onOpenBYOK}>
            <span className={`key-dot ${hasCustomKey ? 'active' : ''}`} />
            {hasCustomKey ? 'CUSTOM LLM (BYOK)' : 'BYOK (OPTIONAL)'}
          </button>
        )}
      </div>
    </header>
  );
};
