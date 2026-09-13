import React, { useState } from 'react';
import { StatisticalAuditPayload } from '../types';

interface ReceiptsSectionProps {
  payload: StatisticalAuditPayload | null;
}

export const ReceiptsSection: React.FC<ReceiptsSectionProps> = ({ payload }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const jsonText = payload ? JSON.stringify(payload, null, 2) : '// No audit payload available yet...';

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="notebook-cell" id="cell-receipts">
      <div className="cell-header" onClick={() => setIsOpen(!isOpen)} style={{ cursor: 'pointer' }}>
        <span className="step-num">08</span>
        <span className="step-title">VERIFIABLE MACHINE RECEIPTS (STRUCTURED JSON)</span>
        <div className="cell-header-actions">
          <span className="receipts-pill">GROUNDING PAYLOAD</span>
          <button
            className="mini-btn toggle-btn"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
          >
            {isOpen ? 'HIDE RECEIPTS' : 'SHOW RECEIPTS'}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="cell-body receipts-body">
          <div className="receipts-bar">
            <span className="bar-label">Raw R Output Payload (Zero-hallucination verification):</span>
            <button className="mini-btn" onClick={handleCopy}>
              {copied ? 'COPIED JSON!' : 'COPY JSON'}
            </button>
          </div>
          <pre className="json-viewport">
            <code>{jsonText}</code>
          </pre>
        </div>
      )}
    </section>
  );
};
