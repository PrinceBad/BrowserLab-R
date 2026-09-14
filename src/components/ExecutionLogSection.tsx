import React, { useEffect, useRef, useState } from 'react';
import { StageStep } from '../types';

interface ExecutionLogSectionProps {
  steps: StageStep[];
  error: { message: string; rCall?: string } | null;
}

function ElapsedTimer({ startTime }: { startTime: number }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 100);
    return () => clearInterval(id);
  }, [startTime]);

  return <span className="elapsed-timer">{(elapsed / 1000).toFixed(1)}s</span>;
}

export const ExecutionLogSection: React.FC<ExecutionLogSectionProps> = ({ steps, error }) => {
  // Track when each step became active to calculate elapsed time
  const activeTimestamps = useRef<Record<string, number>>({});

  steps.forEach((s) => {
    if (s.status === 'active' && !activeTimestamps.current[s.id]) {
      activeTimestamps.current[s.id] = Date.now();
    }
    if (s.status !== 'active') {
      delete activeTimestamps.current[s.id];
    }
  });

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
                    <div className="node-time-group">
                      {s.status === 'active' && activeTimestamps.current[s.id] && (
                        <ElapsedTimer startTime={activeTimestamps.current[s.id]} />
                      )}
                      {s.timestamp && s.status !== 'active' && (
                        <span className="node-time">{s.timestamp}</span>
                      )}
                    </div>
                  </div>
                  {s.detail && <span className="node-detail">{s.detail}</span>}
                  {/* Progress bar for active step */}
                  {s.status === 'active' && (
                    <div className="step-progress-bar">
                      <div className="step-progress-fill" />
                    </div>
                  )}
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
