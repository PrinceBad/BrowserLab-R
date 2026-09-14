import React, { useEffect, useRef } from 'react';

interface IntentSectionProps {
  prompt: string;
  onPromptChange: (val: string) => void;
  onApplyPreset: (dataset: string, text: string) => void;
  onRunAudit: () => void;
  isExecuting: boolean;
  engineReady: boolean;
}

const MAX_CHARS = 500;

export const IntentSection: React.FC<IntentSectionProps> = ({
  prompt,
  onPromptChange,
  onApplyPreset,
  onRunAudit,
  isExecuting,
  engineReady,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const charCount = prompt.length;
  const isOverLimit = charCount > MAX_CHARS;

  // Ctrl+Enter / Cmd+Enter keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (engineReady && !isExecuting && prompt.trim()) {
          e.preventDefault();
          onRunAudit();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [engineReady, isExecuting, prompt, onRunAudit]);

  return (
    <section className="notebook-cell" id="cell-intent">
      <div className="cell-header">
        <span className="step-num">02</span>
        <span className="step-title">RESEARCH QUESTION &amp; FORMAL SPECIFICATION</span>
        <span className="cell-badge">Natural Language Intent</span>
      </div>

      <div className="cell-body">
        <div className="prompt-container">
          <div className="textarea-wrapper">
            <textarea
              ref={textareaRef}
              className={`audit-textarea ${isOverLimit ? 'over-limit' : ''}`}
              rows={3}
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              placeholder="State your statistical hypothesis (e.g. Evaluate whether horsepower and weight predict fuel economy in mpg, check all OLS assumptions, and report findings)..."
            />
            <div className="char-counter-row">
              <span className={`char-counter ${isOverLimit ? 'over' : charCount > MAX_CHARS * 0.85 ? 'warn' : ''}`}>
                {charCount} / {MAX_CHARS}
              </span>
              <span className="shortcut-hint">
                <kbd>Ctrl</kbd><kbd>↵</kbd> to run
              </span>
            </div>
          </div>

          <div className="preset-row">
            <span className="preset-intro">Benchmark Presets:</span>
            <button
              type="button"
              className="preset-tag"
              onClick={() =>
                onApplyPreset(
                  'mtcars',
                  'Evaluate whether horsepower (hp) and vehicle weight (wt) predict fuel economy (mpg). Check all regression assumptions and verify model validity.'
                )
              }
            >
              mtcars: mpg ~ hp + wt
            </button>
            <button
              type="button"
              className="preset-tag"
              onClick={() =>
                onApplyPreset(
                  'marketing',
                  'Do YouTube and Facebook advertising expenditures predict sales? Test for collinearity and residual normality.'
                )
              }
            >
              marketing: sales ~ youtube + facebook
            </button>
            <button
              type="button"
              className="preset-tag"
              onClick={() =>
                onApplyPreset(
                  'exam',
                  'Examine if hours studied and attendance percentage significantly predict final exam scores. Check homoskedasticity.'
                )
              }
            >
              exam: score ~ hours + attendance
            </button>
          </div>
        </div>

        <div className="action-row">
          <button
            className="run-audit-btn"
            disabled={!engineReady || isExecuting || !prompt.trim() || isOverLimit}
            onClick={onRunAudit}
          >
            {isExecuting ? (
              <>
                <span className="spinner-icon" />
                <span>EXECUTING DETERMINISTIC AUDIT IN WEBR...</span>
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                <span>RUN DETERMINISTIC STATISTICAL AUDIT</span>
                <span className="btn-kbd-hint"><kbd>⌃↵</kbd></span>
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
};
