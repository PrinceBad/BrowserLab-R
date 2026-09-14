import React, { useState, useEffect, useCallback } from 'react';
import { NIELIT_LABS, NielitLab, LabGradingReport } from '../services/nielitLabs';
import { webrEngine } from '../services/webrEngine';

interface NielitLabSectionProps {
  engineReady: boolean;
}

export const NielitLabSection: React.FC<NielitLabSectionProps> = ({ engineReady }) => {
  const [selectedLabId, setSelectedLabId] = useState<string>(NIELIT_LABS[0].id);
  const [activeCode, setActiveCode] = useState<string>(NIELIT_LABS[0].initialCode);
  const [consoleOutput, setConsoleOutput] = useState<string>('');
  const [plotUrl, setPlotUrl] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isRestarting, setIsRestarting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [watchdogWarning, setWatchdogWarning] = useState<string | null>(null);
  const [executionTimeMs, setExecutionTimeMs] = useState<number | null>(null);

  // Pedagogical State for Lab 1 (Module 4.i)
  const [predictGuess, setPredictGuess] = useState<string | null>(null);
  const [predictRevealed, setPredictRevealed] = useState<boolean>(false);
  const [gradingReport, setGradingReport] = useState<LabGradingReport | null>(null);
  const [isGrading, setIsGrading] = useState<boolean>(false);

  // UI upgrades
  const [plotZoomed, setPlotZoomed] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // ESC key to close plot zoom
  const handleEsc = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setPlotZoomed(false);
  }, []);
  useEffect(() => {
    if (plotZoomed) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [plotZoomed, handleEsc]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const lineCount = activeCode.split('\n').length;

  const activeLab: NielitLab = NIELIT_LABS.find((l) => l.id === selectedLabId) || NIELIT_LABS[0];

  // Update code when lab changes
  const handleSelectLab = (labId: string) => {
    setSelectedLabId(labId);
    const lab = NIELIT_LABS.find((l) => l.id === labId);
    if (lab) {
      setActiveCode(lab.initialCode);
      setConsoleOutput('');
      setPlotUrl(null);
      setErrorMsg(null);
      setWatchdogWarning(null);
      setExecutionTimeMs(null);
      setGradingReport(null);
      setPredictGuess(null);
      setPredictRevealed(false);
    }
  };

  const handleResetCode = () => {
    setActiveCode(activeLab.initialCode);
    setGradingReport(null);
  };

  const handleRestartSession = async () => {
    if (window.confirm('Restart the R WebAssembly Worker? This will terminate the thread and clear all variables currently in memory.')) {
      setIsRestarting(true);
      setErrorMsg(null);
      setWatchdogWarning(null);
      try {
        await webrEngine.restart('User requested reset');
        setConsoleOutput('[R WebAssembly environment restarted cleanly. All in-memory variables reset.]');
        setPlotUrl(null);
        setGradingReport(null);
      } catch (err: any) {
        setErrorMsg('Failed to restart WebR: ' + (err.message || String(err)));
      } finally {
        setIsRestarting(false);
      }
    }
  };

  const handleRunCode = async () => {
    if (!engineReady || isRunning) return;
    setIsRunning(true);
    setErrorMsg(null);
    setWatchdogWarning(null);

    const startTime = performance.now();

    try {
      const result = await webrEngine.executeRScript(activeCode, 15000, (warn) => {
        setWatchdogWarning(warn);
      });
      const elapsed = Math.round(performance.now() - startTime);
      setExecutionTimeMs(elapsed);

      if (result.error) {
        setErrorMsg(result.error);
      }
      setConsoleOutput(result.stdout || (result.error ? '' : '[R execution finished with no standard output]'));
      if (result.plotUrl) {
        setPlotUrl(result.plotUrl);
      }
    } catch (err: any) {
      setErrorMsg(err.message || String(err));
    } finally {
      setIsRunning(false);
      setWatchdogWarning(null);
    }
  };

  // Keyboard shortcut Ctrl+Enter / Cmd+Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRunCode();
    }
  };

  // Automatically execute the initial code when engine becomes ready
  useEffect(() => {
    if (engineReady && !consoleOutput && !isRunning) {
      handleRunCode();
    }
  }, [engineReady]);

  // Pedagogical: Load Fill-in-the-Blank template for active lab
  const handleLoadChallengeTemplate = () => {
    if (activeLab.challenge) {
      setActiveCode(activeLab.challenge.starterCode);
      setGradingReport(null);
    }
  };

  // Pedagogical: Automated "Check My Work" grader with differentiated diagnostics
  const handleCheckMyWork = async () => {
    if (!engineReady || isGrading || !activeLab.challenge) return;
    setIsGrading(true);
    setGradingReport(null);

    try {
      // First ensure student's code runs in WebR
      await webrEngine.executeRScript(activeCode, 10000);

      // Evaluate the diagnostic assertions inside WebR
      const report = await webrEngine.evalJSON<LabGradingReport>(activeLab.challenge.evaluatorScriptR);
      setGradingReport(report);
    } catch (err: any) {
      setGradingReport({
        allPassed: false,
        passedCount: 0,
        totalCount: 1,
        checks: [
          {
            id: 'err',
            label: 'Script Execution & Evaluation',
            passed: false,
            detail: 'Execution error: ' + (err.message || String(err)),
          },
        ],
        nextStepHint: 'Check your R syntax for typos, unclosed quotes, or parentheses before re-running.',
      });
    } finally {
      setIsGrading(false);
    }
  };

  return (
    <div className="nielit-lab-container">
      {/* Top Banner: Syllabus Mapping */}
      <div className="nielit-syllabus-banner">
        <div className="syllabus-header-row">
          <div>
            <div className="syllabus-badge-row">
              <span className="badge-nielit">NIELIT ‘A’ LEVEL (IT) REVISION V</span>
              <span className="badge-module">{activeLab.moduleCode}</span>
              <span className="badge-category">{activeLab.category}</span>
            </div>
            <h2 className="nielit-title">{activeLab.title}</h2>
            <p className="nielit-desc">{activeLab.description}</p>
          </div>

          <div className="lab-selector-wrapper">
            <label htmlFor="lab-select" className="lab-select-label">Choose Syllabus Experiment:</label>
            <select
              id="lab-select"
              className="lab-dropdown"
              value={selectedLabId}
              onChange={(e) => handleSelectLab(e.target.value)}
            >
              {NIELIT_LABS.map((lab) => (
                <option key={lab.id} value={lab.id}>
                  {lab.title} ({lab.moduleCode})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Objectives checklist */}
        <div className="syllabus-objectives">
          <span className="objectives-title">Learning Objectives & Outcomes:</span>
          <div className="objectives-grid">
            {activeLab.objectives.map((obj, i) => (
              <div key={i} className="objective-item">
                <span className="obj-check">✓</span>
                <span>{obj}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pedagogical Interactive Scaffolding: Guided Learning Challenge */}
      {activeLab.challenge && (
        <div className="pedagogy-guided-card">
          <div className="pedagogy-header">
            <span className="pedagogy-badge">PRACTICE & VERIFY</span>
            <h3>Interactive Guided Challenge: {activeLab.challenge.title}</h3>
          </div>

          <div className="pedagogy-columns">
            {/* Step 1: Predict-Then-Run */}
            {activeLab.challenge.predict && (
              <div className="pedagogy-step-box">
                <div className="step-tag">STEP 1: PREDICT-THEN-RUN</div>
                <h4>{activeLab.challenge.predict.title}</h4>
                <p className="step-prompt">{activeLab.challenge.predict.prompt}</p>
                {activeLab.challenge.predict.codeSnippet && (
                  <pre className="inline-r-snippet">{activeLab.challenge.predict.codeSnippet}</pre>
                )}
                <p className="step-question">{activeLab.challenge.predict.question}</p>
                
                <div className="predict-buttons">
                  {activeLab.challenge.predict.options.map((typeOption) => (
                    <button
                      key={typeOption}
                      type="button"
                      className={`btn-predict ${predictGuess === typeOption ? 'selected' : ''}`}
                      onClick={() => {
                        setPredictGuess(typeOption);
                        setPredictRevealed(true);
                      }}
                    >
                      {typeOption}
                    </button>
                  ))}
                </div>

                {predictRevealed && (
                  <div className={`predict-feedback ${predictGuess === activeLab.challenge.predict.correctAnswer ? 'correct' : 'incorrect'}`}>
                    {predictGuess === activeLab.challenge.predict.correctAnswer ? (
                      <span>{activeLab.challenge.predict.explanationCorrect}</span>
                    ) : (
                      <span>{activeLab.challenge.predict.explanationIncorrect}</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Fill-in-the-Blank & Automated Grading */}
            <div className="pedagogy-step-box">
              <div className="step-tag">STEP 2: HANDS-ON CHALLENGE</div>
              <h4>{activeLab.challenge.title}</h4>
              <p className="step-prompt">
                {activeLab.challenge.instructions}
              </p>

              <div className="challenge-actions">
                <button
                  type="button"
                  className="btn-load-challenge"
                  onClick={handleLoadChallengeTemplate}
                >
                  📝 Load Challenge Template
                </button>

                <button
                  type="button"
                  className="btn-check-work"
                  onClick={handleCheckMyWork}
                  disabled={!engineReady || isGrading}
                  id="btn-check-my-work"
                >
                  {isGrading ? 'Evaluating in WebR...' : '✅ Check My Work'}
                </button>
              </div>

              {gradingReport && (
                <div className={`grading-report-card ${gradingReport.allPassed ? 'all-passed' : 'has-failures'}`}>
                  <div className="grading-report-header">
                    <span className={`grading-status-badge ${gradingReport.allPassed ? 'badge-success' : 'badge-progress'}`}>
                      {gradingReport.allPassed
                        ? `🎉 All ${gradingReport.totalCount}/${gradingReport.totalCount} Checks Passed!`
                        : `⚡ Progress: ${gradingReport.passedCount} of ${gradingReport.totalCount} Checks Passed`}
                    </span>
                  </div>

                  <div className="grading-checklist">
                    {gradingReport.checks.map((check) => (
                      <div key={check.id} className={`diagnostic-check-item ${check.passed ? 'pass' : 'fail'}`}>
                        <span className="check-bullet">{check.passed ? '✓' : '✕'}</span>
                        <div className="check-content">
                          <span className="check-rule-title">{check.label}</span>
                          <span className="check-rule-detail">{check.detail}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {gradingReport.nextStepHint && !gradingReport.allPassed && (
                    <div className="differentiated-hint-card">
                      <span className="hint-label">💡 RECOMMENDED NEXT STEP:</span>
                      <p className="hint-text">{gradingReport.nextStepHint}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Watchdog Alert Banner (Infinite Loop / Long Running Warning) */}
      {watchdogWarning && (
        <div className="watchdog-warning-banner">
          <span className="warning-icon">⏳</span>
          <span>{watchdogWarning}</span>
        </div>
      )}

      {/* Main Interactive Studio Grid */}
      <div className="nielit-studio-grid">
        {/* Left Pane: Code Editor */}
        <div className="studio-card editor-card">
          <div className="studio-card-header">
            <div className="card-title-group">
              <span className="terminal-dot red"></span>
              <span className="terminal-dot yellow"></span>
              <span className="terminal-dot green"></span>
              <span className="card-title-text">R Script Editor (WebAssembly Runtime)</span>
            </div>
            <div className="editor-actions">
              <button
                type="button"
                className="btn-secondary-sm btn-restart-engine"
                onClick={handleRestartSession}
                disabled={isRestarting || isRunning}
                title="Terminate worker & reset in-memory variables"
              >
                {isRestarting ? 'Restarting...' : '🔄 Restart R Session'}
              </button>
              <button
                type="button"
                className="btn-secondary-sm"
                onClick={handleCopyCode}
                title="Copy code to clipboard"
              >
                {copiedCode ? '✓ Copied!' : 'Copy Code'}
              </button>
              <button
                type="button"
                className="btn-secondary-sm"
                onClick={handleResetCode}
                title="Reset to initial syllabus template"
              >
                Reset Code
              </button>
              <button
                type="button"
                className={`btn-run-r ${isRunning ? 'running' : ''}`}
                onClick={handleRunCode}
                disabled={!engineReady || isRunning || isRestarting}
                id="run-nielit-code-btn"
              >
                {isRunning ? (
                  <>
                    <span className="spinner-sm"></span>
                    Running...
                  </>
                ) : (
                  <>
                    <span>▶ Run Code</span>
                    <kbd className="kbd-shortcut">Ctrl+↵</kbd>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="editor-wrapper">
            <textarea
              className="r-code-textarea"
              value={activeCode}
              onChange={(e) => setActiveCode(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              rows={22}
              placeholder="Type R code here..."
            />
          </div>
          <div className="editor-footer">
            <span>Powered by WebR (R 4.3 in WebAssembly) &bull; {lineCount} lines</span>
            <span>Safety: 15s Watchdog Enabled &bull; Shortcuts: <kbd>Ctrl+Enter</kbd></span>
          </div>
        </div>

        {/* Right Pane: Outputs (Console + Graphics) */}
        <div className="studio-outputs">
          {/* Console Output Pane */}
          <div className="studio-card console-card">
            <div className="studio-card-header">
              <div className="card-title-group">
                <span className="card-title-text">R Console Output (STDOUT)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {executionTimeMs !== null && (
                  <span className="exec-time-pill">Completed in {executionTimeMs}ms</span>
                )}
                {consoleOutput && (
                  <button
                    className="mini-btn"
                    onClick={() => { setConsoleOutput(''); setErrorMsg(null); }}
                    title="Clear console output"
                  >
                    CLEAR
                  </button>
                )}
              </div>
            </div>

            {errorMsg && (
              <div className="console-error-banner">
                <strong>[R Error / Watchdog]</strong>: {errorMsg}
              </div>
            )}

            <div className="console-output-wrapper">
              <pre className="r-console-pre">
                {isRunning ? (
                  <span className="console-loading">Executing R commands in WebAssembly worker...</span>
                ) : consoleOutput ? (
                  consoleOutput
                ) : (
                  <span className="console-empty">No console output yet. Click 'Run Code' above.</span>
                )}
              </pre>
            </div>
          </div>

          {/* Graphics Device / Plot Pane */}
          <div className="studio-card plot-card">
            <div className="studio-card-header">
              <div className="card-title-group">
                <span className="card-title-text">R Graphics Device (Virtual Canvas)</span>
              </div>
              {plotUrl && (
                <a
                  href={plotUrl}
                  download="r_plot.png"
                  className="btn-link-download"
                  title="Download figure as PNG"
                >
                  Download PNG
                </a>
              )}
            </div>

            <div className="plot-display-wrapper">
              {plotUrl ? (
                <img
                  src={plotUrl}
                  alt="Generated R graphics device plot"
                  className="nielit-plot-img"
                  onClick={() => setPlotZoomed(true)}
                  style={{ cursor: 'zoom-in' }}
                  title="Click to zoom"
                />
              ) : (
                <div className="plot-placeholder">
                  <span className="plot-placeholder-icon">📊</span>
                  <p>Plot output will appear here when your R code calls <code>plot()</code>, <code>hist()</code>, or <code>boxplot()</code>.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Plot zoom overlay */}
      {plotZoomed && plotUrl && (
        <div className="plot-zoom-overlay" onClick={() => setPlotZoomed(false)}>
          <div className="plot-zoom-inner" onClick={(e) => e.stopPropagation()}>
            <button className="plot-zoom-close" onClick={() => setPlotZoomed(false)} title="Close (ESC)">✕</button>
            <img src={plotUrl} alt="Full-screen R plot" className="plot-zoom-img" />
            <p className="plot-zoom-hint">Press ESC or click ✕ to close</p>
          </div>
        </div>
      )}
    </div>
  );
};
