import React, { useState } from 'react';
import { aiService } from '../services/aiService';

interface BYOKModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdated: () => void;
}

export const BYOKModal: React.FC<BYOKModalProps> = ({
  isOpen,
  onClose,
  onConfigUpdated,
}) => {
  const currentConfig = aiService.getConfig();
  const [provider, setProvider] = useState<'gemini' | 'openai' | 'groq'>(
    currentConfig.provider === 'builtin' ? 'gemini' : currentConfig.provider
  );
  const [apiKey, setApiKey] = useState(currentConfig.apiKey || '');

  if (!isOpen) return null;

  const handleSave = () => {
    if (apiKey.trim()) {
      aiService.saveConfig(provider, apiKey.trim());
    } else {
      aiService.clearConfig();
    }
    onConfigUpdated();
    onClose();
  };

  const handleClear = () => {
    aiService.clearConfig();
    setApiKey('');
    onConfigUpdated();
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-top">
          <div className="modal-title-group">
            <span className="modal-badge">CLIENT-SIDE PRIVACY</span>
            <h3>Bring Your Own Key (BYOK)</h3>
          </div>
          <button className="close-x-btn" onClick={onClose}>&times;</button>
        </div>

        <p className="modal-explainer">
          Your key is saved <strong>exclusively in your browser's local storage</strong>.
          It never touches an intermediate server. If unconfigured, the system automatically uses the
          <strong> Built-in Deterministic Synthesis Engine</strong> (100% free and offline).
        </p>

        <div className="modal-form">
          <label className="form-label">
            <span>Inference Provider:</span>
            <select
              className="styled-select"
              value={provider}
              onChange={(e) => setProvider(e.target.value as any)}
            >
              <option value="gemini">Google Gemini (gemini-1.5-flash)</option>
              <option value="openai">OpenAI (gpt-4o-mini)</option>
              <option value="groq">Groq (llama-3.3-70b-versatile)</option>
            </select>
          </label>

          <label className="form-label">
            <span>API Key:</span>
            <input
              type="password"
              className="styled-input"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste your API key here..."
            />
          </label>
        </div>

        <div className="modal-actions">
          <button className="modal-btn secondary" onClick={handleClear}>
            Clear Key (Use Deterministic Engine)
          </button>
          <button className="modal-btn primary" onClick={handleSave}>
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};
