import React, { useState } from 'react';

interface CodeSectionProps {
  code: string;
}

export const CodeSection: React.FC<CodeSectionProps> = ({ code }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code ? code.trim().split('\n') : ['# Diagnostic code will be generated upon audit execution...'];

  return (
    <section className="notebook-cell" id="cell-code">
      <div className="cell-header">
        <span className="step-num">03</span>
        <span className="step-title">EXECUTABLE R DIAGNOSTIC SCRIPT (THE TRUST ANCHOR)</span>
        <div className="cell-header-actions">
          <span className="trust-pill">AUDITABLE WEBR EXECUTION</span>
          <button
            className="mini-btn"
            onClick={handleCopy}
            title="Copy script to clipboard"
          >
            {copied ? 'COPIED!' : 'COPY CODE'}
          </button>
          <button
            className="mini-btn toggle-btn"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'COLLAPSE' : 'EXPAND'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="cell-body code-body">
          <div className="code-meta-bar">
            <span className="meta-text">
              The AI generates executable R instructions containing formal assumption checks. The LLM never touches raw data.
            </span>
            <span className="lang-tag">R 4.3 (Native GNU)</span>
          </div>

          <div className="code-viewport">
            <div className="line-numbers">
              {lines.map((_, i) => (
                <span key={i} className="line-num">{i + 1}</span>
              ))}
            </div>
            <pre className="code-content">
              <code>{lines.join('\n')}</code>
            </pre>
          </div>
        </div>
      )}
    </section>
  );
};
