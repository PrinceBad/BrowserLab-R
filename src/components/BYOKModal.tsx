import React, { useState } from 'react';
import { aiService } from '../services/aiService';
import { LLMProvider, PROVIDER_SPECS } from '../services/aiService';

interface BYOKModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdated: () => void;
}

const PROVIDER_ORDER: Exclude<LLMProvider, 'builtin'>[] = [
  'gemini', 'openai', 'groq', 'deepseek', 'anthropic',
];

const PROVIDER_PRIVACY_NOTES: Record<Exclude<LLMProvider, 'builtin'>, string> = {
  gemini: 'Google processes requests via their US-based APIs.',
  openai: 'OpenAI processes requests via their US-based APIs.',
  groq: 'Groq Cloud: ultra-fast inference via their US-based GroqChip infrastructure.',
  deepseek: '⚠️ DeepSeek routes traffic through servers based in China. Avoid submitting sensitive data.',
  anthropic: 'Anthropic processes requests via their US-based APIs.',
};

export const BYOKModal: React.FC<BYOKModalProps> = ({
  isOpen,
  onClose,
  onConfigUpdated,
}) => {
  const currentConfig = aiService.getConfig();

  const initialProvider: Exclude<LLMProvider, 'builtin'> =
    currentConfig.provider === 'builtin' ? 'gemini' : currentConfig.provider as any;

  const [provider, setProvider] = useState<Exclude<LLMProvider, 'builtin'>>(initialProvider);
  const [selectedModel, setSelectedModel] = useState<string>(
    currentConfig.model || PROVIDER_SPECS[initialProvider].defaultModel
  );
  const [apiKey, setApiKey] = useState(currentConfig.apiKey || '');

  if (!isOpen) return null;

  const handleProviderChange = (p: Exclude<LLMProvider, 'builtin'>) => {
    setProvider(p);
    setSelectedModel(PROVIDER_SPECS[p].defaultModel);
  };

  const handleSave = () => {
    if (apiKey.trim()) {
      aiService.saveConfig(provider, apiKey.trim(), selectedModel);
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

  const spec = PROVIDER_SPECS[provider];
  const privacyNote = PROVIDER_PRIVACY_NOTES[provider];
  const isDeepSeek = provider === 'deepseek';

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel byok-modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-top">
          <div className="modal-title-group">
            <span className="modal-badge">CLIENT-SIDE PRIVACY</span>
            <h3>Bring Your Own Key (BYOK)</h3>
          </div>
          <button className="close-x-btn" onClick={onClose}>&times;</button>
        </div>

        <p className="modal-explainer">
          Your key is saved <strong>exclusively in your browser's local storage</strong>.
          It never touches an intermediate server. Without a key, the{' '}
          <strong>built-in deterministic synthesis engine</strong> is used (100% free &amp; offline).
        </p>

        <div className="modal-form">
          {/* Provider selector */}
          <label className="form-label">
            <span>Inference Provider:</span>
            <div className="provider-grid">
              {PROVIDER_ORDER.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`provider-pill-btn ${provider === p ? 'active' : ''}`}
                  onClick={() => handleProviderChange(p)}
                >
                  {PROVIDER_SPECS[p].name}
                </button>
              ))}
            </div>
          </label>

          {/* Model picker */}
          <label className="form-label">
            <span>Model:</span>
            <div className="model-picker-list">
              {spec.models.map((m) => (
                <label key={m.id} className={`model-option ${selectedModel === m.id ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="model-choice"
                    value={m.id}
                    checked={selectedModel === m.id}
                    onChange={() => setSelectedModel(m.id)}
                  />
                  <span className="model-option-name">{m.name}</span>
                  {m.badge && <span className="model-option-badge">{m.badge}</span>}
                </label>
              ))}
            </div>
          </label>

          {/* Privacy note */}
          <div className={`provider-privacy-note ${isDeepSeek ? 'warn' : ''}`}>
            {privacyNote}
          </div>

          {/* API Key */}
          <label className="form-label">
            <span>API Key (Optional — leave blank to use deterministic engine):</span>
            <input
              type="password"
              name="client_side_llm_token"
              id="client-side-llm-token"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              className="styled-input"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={`Paste your ${spec.name} API key here...`}
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
