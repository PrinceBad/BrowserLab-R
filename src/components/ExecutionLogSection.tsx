import React from 'react';
import { StageStep } from '../types';

interface ExecutionLogSectionProps {
  steps: StageStep[];
  error: { message: string; rCall?: string } | null;
}

export const ExecutionLogSection: React.FC<ExecutionLogSectionProps> = ({ steps, error }) => {
  return (
    <section className="notebook-cell" id="cell-execution">
      <div className="cell-header">
        <span className="step-num">04</span>
        <span className="step-title">DETERMINISTIC EXECUTION LOG</span>
        <span className="cell-badge">Web Worker Subsystem</span>
      </div>

      <div className="cell-body execution-body">
        {/* Staged Linear Milestones */}
        <div className="milestones-track">
          {steps.map((s, idx) => {
            let statusIcon = '○';
            let statusClass = 'pending';
            if (s.status === 'active') {
              statusIcon = '●';
              statusClass = 'active';
            } else if (s.status === 'completed') {
              statusIcon = '✓';
              statusClass = 'completed';
            } else if (s.status === 'failed') {
              statusIcon = '✕';
              statusClass = 'failed';
            }

            return (
              <div key={s.id} className={`milestone-node ${statusClass}`}>
                <div className="node-marker">
                  <span className="marker-icon">{statusIcon}</span>
                  {idx < steps.length - 1 && <span className="marker-line" />}
                </div>
                <div className="node-content">
                  <div className="node-header">
                    <span className="node-label">{s.label}</span>
                    {s.timestamp && <span className="node-time">{s.timestamp}</span>}
                  </div>
                  {s.detail && <span className="node-detail">{s.detail}</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* First-Class Inline R Error Screen */}
        {error && (
          <div className="r-error-terminal">
            <div className="terminal-header">
              <span className="terminal-dot red" />
              <span className="terminal-dot yellow" />
              <span className="terminal-dot green" />
              <span className="terminal-title">R Engine Runtime Condition Error</span>
            </div>
            <div className="terminal-body">
              <div className="error-line">
                <span className="error-prefix">Error in R Worker:</span> {error.message}
              </div>
              {error.rCall && (
                <div className="call-line">
                  <span className="call-prefix">Originating Call:</span> <code>{error.rCall}</code>
                </div>
              )}
              <div className="recovery-advice">
                <em>Audit Remediation:</em> The R compiler rejected this operation. Check predictor column names against available dataset variables in Section 01.
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
