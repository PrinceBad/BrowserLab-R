import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { DataSection } from './components/DataSection';
import { IntentSection } from './components/IntentSection';
import { CodeSection } from './components/CodeSection';
import { ExecutionLogSection } from './components/ExecutionLogSection';
import { GuardrailsSection } from './components/GuardrailsSection';
import { PlotSection } from './components/PlotSection';
import { ReportSection } from './components/ReportSection';
import { ReceiptsSection } from './components/ReceiptsSection';
import { BYOKModal } from './components/BYOKModal';
import { NielitLabSection } from './components/NielitLabSection';

import { webrEngine } from './services/webrEngine';
import { guardrailService } from './services/guardrailService';
import { aiService } from './services/aiService';
import { DatasetInfo, StageStep, StatisticalAuditPayload } from './types';

const INITIAL_STEPS: StageStep[] = [
  { id: 'booting', label: 'Mount WebR WebAssembly 4.3 Runtime', status: 'pending' },
  { id: 'fitting', label: 'Fit Ordinary Least Squares (OLS) Model', status: 'pending' },
  { id: 'diagnostics', label: 'Execute Shapiro-Wilk & Breusch-Pagan Tests', status: 'pending' },
  { id: 'vif', label: 'Calculate Variance Inflation Factors (VIF)', status: 'pending' },
  { id: 'plotting', label: 'Render High-DPI Diagnostic Plots', status: 'pending' },
  { id: 'reporting', label: 'Synthesize Grounded APA 7th Audit Report', status: 'pending' },
];

export const App: React.FC = () => {
  const [engineReady, setEngineReady] = useState(false);
  const [engineStatusText, setEngineStatusText] = useState('Booting WebR WASM...');
  const [memoryMB, setMemoryMB] = useState<number | null>(null);

  const [selectedDataset, setSelectedDataset] = useState('mtcars');
  const [datasetInfo, setDatasetInfo] = useState<DatasetInfo | null>(null);

  const [prompt, setPrompt] = useState(
    'Evaluate whether horsepower (hp) and vehicle weight (wt) predict fuel economy (mpg). Check all regression assumptions and verify model validity.'
  );
  const [activeCode, setActiveCode] = useState('');

  const [isExecuting, setIsExecuting] = useState(false);
  const [steps, setSteps] = useState<StageStep[]>(INITIAL_STEPS);
  const [rError, setRError] = useState<{ message: string; rCall?: string } | null>(null);

  const [auditPayload, setAuditPayload] = useState<StatisticalAuditPayload | null>(null);
  const [plotUrl, setPlotUrl] = useState<string | null>(null);
  const [reportHtml, setReportHtml] = useState<string | null>(null);

  const [activeMetric, setActiveMetric] = useState<string | null>(null);
  const [isBYOKOpen, setIsBYOKOpen] = useState(false);
  const [hasCustomKey, setHasCustomKey] = useState(false);
  const [activeTab, setActiveTab] = useState<'nielit' | 'copilot'>('nielit');

  // Initialize WebR and Dataset
  useEffect(() => {
    webrEngine.onStatus((status, ready) => {
      setEngineStatusText(status);
      setEngineReady(ready);

      if (ready) {
        setSteps((prev) =>
          prev.map((s) =>
            s.id === 'booting'
              ? { ...s, status: 'completed', timestamp: new Date().toLocaleTimeString() }
              : s
          )
        );
      }
    });

    webrEngine.init().catch(() => {});

    // Monitor JS heap
    const interval = setInterval(() => {
      const perf = (performance as any).memory;
      if (perf && perf.usedJSHeapSize) {
        setMemoryMB(Math.round(perf.usedJSHeapSize / (1024 * 1024)));
      }
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  // Update dataset information
  const loadDatasetMetadata = useCallback(async (datasetName: string) => {
    try {
      const info = await webrEngine.getDatasetSummary(datasetName);
      setDatasetInfo(info);
    } catch (err) {
      console.warn('Dataset metadata load deferred until WebR is ready:', err);
    }
  }, []);

  useEffect(() => {
    if (engineReady) {
      const realName = selectedDataset === 'exam' ? 'exam_scores' : selectedDataset;
      loadDatasetMetadata(realName);
    }
  }, [engineReady, selectedDataset, loadDatasetMetadata]);

  // Initial code preview
  useEffect(() => {
    const realDataset = selectedDataset === 'exam' ? 'exam_scores' : selectedDataset;
    const { formula, dataset } = guardrailService.parseFormula(prompt, realDataset);
    setActiveCode(guardrailService.generateDiagnosticScript(formula, dataset));
  }, [prompt, selectedDataset]);

  // Handle Preset Selection
  const handleApplyPreset = (dataset: string, presetPrompt: string) => {
    setSelectedDataset(dataset);
    setPrompt(presetPrompt);
  };

  // Run Statistical Audit
  const handleRunAudit = async () => {
    if (!engineReady || isExecuting || !prompt.trim()) return;

    setIsExecuting(true);
    setRError(null);
    setAuditPayload(null);
    setPlotUrl(null);
    setReportHtml(null);

    const realDataset = selectedDataset === 'exam' ? 'exam_scores' : selectedDataset;
    const { formula, dataset } = guardrailService.parseFormula(prompt, realDataset);
    const diagnosticScript = guardrailService.generateDiagnosticScript(formula, dataset);
    setActiveCode(diagnosticScript);

    // Reset steps
    setSteps([
      { id: 'booting', label: 'Mount WebR WebAssembly 4.3 Runtime', status: 'completed', timestamp: 'Ready' },
      { id: 'fitting', label: 'Fit Ordinary Least Squares (OLS) Model', status: 'active', timestamp: new Date().toLocaleTimeString() },
      { id: 'diagnostics', label: 'Execute Shapiro-Wilk & Breusch-Pagan Tests', status: 'pending' },
      { id: 'vif', label: 'Calculate Variance Inflation Factors (VIF)', status: 'pending' },
      { id: 'plotting', label: 'Render High-DPI Diagnostic Plots', status: 'pending' },
      { id: 'reporting', label: 'Synthesize Grounded APA 7th Audit Report', status: 'pending' },
    ]);

    try {
      // Step 2 & 3: Fit model & diagnostics
      await new Promise((r) => setTimeout(r, 120)); // Small yield for UI render
      setSteps((prev) =>
        prev.map((s) => {
          if (s.id === 'fitting') return { ...s, status: 'completed' };
          if (s.id === 'diagnostics') return { ...s, status: 'active', timestamp: new Date().toLocaleTimeString() };
          return s;
        })
      );

      const payload = await guardrailService.runAudit(formula, dataset);

      setSteps((prev) =>
        prev.map((s) => {
          if (s.id === 'diagnostics') return { ...s, status: 'completed' };
          if (s.id === 'vif') return { ...s, status: 'completed', timestamp: new Date().toLocaleTimeString() };
          if (s.id === 'plotting') return { ...s, status: 'active', timestamp: new Date().toLocaleTimeString() };
          return s;
        })
      );
      setAuditPayload(payload);

      // Step 4: Render plot
      const plotScript = guardrailService.generatePlotScript(formula, dataset);
      const generatedPlotUrl = await webrEngine.renderPlot(plotScript);
      setPlotUrl(generatedPlotUrl);

      setSteps((prev) =>
        prev.map((s) => {
          if (s.id === 'plotting') return { ...s, status: 'completed' };
          if (s.id === 'reporting') return { ...s, status: 'active', timestamp: new Date().toLocaleTimeString() };
          return s;
        })
      );

      // Step 5: Synthesize Grounded Report
      const html = await aiService.generateReport(payload);
      setReportHtml(html);

      setSteps((prev) =>
        prev.map((s) =>
          s.id === 'reporting'
            ? { ...s, status: 'completed', timestamp: new Date().toLocaleTimeString() }
            : s
        )
      );
    } catch (err: any) {
      console.error('Audit execution error:', err);
      setRError({
        message: err.message || 'Unknown R execution fault',
        rCall: err.rCall,
      });
      setSteps((prev) =>
        prev.map((s) => (s.status === 'active' ? { ...s, status: 'failed' } : s))
      );
    } finally {
      setIsExecuting(false);
    }
  };

  const checkCustomKey = () => {
    const cfg = aiService.getConfig();
    setHasCustomKey(Boolean(cfg.apiKey && cfg.provider !== 'builtin'));
  };

  useEffect(() => {
    checkCustomKey();
  }, []);

  return (
    <div className="audit-notebook-app">
      <Header
        engineReady={engineReady}
        engineStatusText={engineStatusText}
        memoryMB={memoryMB}
        onOpenBYOK={() => setIsBYOKOpen(true)}
        hasCustomKey={hasCustomKey}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      <main className="notebook-stream">
        {activeTab === 'nielit' ? (
          <NielitLabSection engineReady={engineReady} />
        ) : (
          <>
            {/* 01. Active Data Context */}
            <DataSection
              selectedDataset={selectedDataset}
              onSelectDataset={setSelectedDataset}
              datasetInfo={datasetInfo}
            />

            {/* 02. Research Question & Formal Specification */}
            <IntentSection
              prompt={prompt}
              onPromptChange={setPrompt}
              onApplyPreset={handleApplyPreset}
              onRunAudit={handleRunAudit}
              isExecuting={isExecuting}
              engineReady={engineReady}
            />

            {/* 03. The Trust Anchor: Executable R Diagnostic Script */}
            <CodeSection code={activeCode} />

            {/* 04. Deterministic Staged Execution Log */}
            <ExecutionLogSection steps={steps} error={rError} />

            {/* 05. Statistical Assumption Guardrails (3-State Badges) */}
            <GuardrailsSection
              payload={auditPayload}
              activeMetric={activeMetric}
              onHoverMetric={setActiveMetric}
            />

            {/* 06. Diagnostic Graphics Device (webr::canvas) */}
            <PlotSection plotUrl={plotUrl} isLoading={isExecuting} />

            {/* 07. Grounded Statistical Audit Report */}
            <ReportSection
              reportHtml={reportHtml}
              isLoading={isExecuting}
              activeMetric={activeMetric}
              onHoverMetric={setActiveMetric}
            />

            {/* 08. Verifiable Machine Receipts (Raw Structured JSON) */}
            <ReceiptsSection payload={auditPayload} />
          </>
        )}
      </main>

      {/* BYOK Configuration Modal */}
      <BYOKModal
        isOpen={isBYOKOpen}
        onClose={() => setIsBYOKOpen(false)}
        onConfigUpdated={checkCustomKey}
      />
    </div>
  );
};
