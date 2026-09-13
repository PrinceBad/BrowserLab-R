import React, { useEffect, useRef } from 'react';

interface ReportSectionProps {
  reportHtml: string | null;
  isLoading: boolean;
  activeMetric: string | null;
  onHoverMetric: (metric: string | null) => void;
}

export const ReportSection: React.FC<ReportSectionProps> = ({
  reportHtml,
  isLoading,
  activeMetric,
  onHoverMetric,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Attach hover listeners to traceable metric chips
    const chips = containerRef.current.querySelectorAll('.traceable-metric');
    chips.forEach((chip) => {
      const metricId = chip.getAttribute('data-metric');
      if (!metricId) return;

      const enterHandler = () => onHoverMetric(metricId);
      const leaveHandler = () => onHoverMetric(null);

      chip.addEventListener('mouseenter', enterHandler);
      chip.addEventListener('mouseleave', leaveHandler);
    });
  }, [reportHtml, onHoverMetric]);

  // Handle cross-highlighting when activeMetric changes from badge hover
  useEffect(() => {
    if (!containerRef.current) return;
    const chips = containerRef.current.querySelectorAll('.traceable-metric');
    chips.forEach((chip) => {
      const metricId = chip.getAttribute('data-metric');
      if (metricId === activeMetric) {
        chip.classList.add('active-trace-highlight');
      } else {
        chip.classList.remove('active-trace-highlight');
      }
    });
  }, [activeMetric]);

  return (
    <section className="notebook-cell" id="cell-report">
      <div className="cell-header">
        <span className="step-num">07</span>
        <span className="step-title">GROUNDED STATISTICAL AUDIT REPORT (APA 7TH FORMAT)</span>
        <span className="proof-pill">Zero Hallucination Proof</span>
      </div>

      <div className="cell-body report-body">
        <div className="report-lead-bar">
          <span className="lead-text">
            Every coefficient, test statistic, and <em>p</em>-value below is deterministically derived from Section 03/05.
            Hover over highlighted metrics to trace them directly to their source guardrail.
          </span>
        </div>

        <div className="report-rendered-container" ref={containerRef}>
          {reportHtml ? (
            <div dangerouslySetInnerHTML={{ __html: reportHtml }} />
          ) : (
            <div className="report-empty-state">
              {isLoading ? (
                <div className="loading-row">
                  <span className="spinner-icon" />
                  <span>Synthesizing grounded APA 7th summary from verified metrics...</span>
                </div>
              ) : (
                <p>Run a statistical audit to generate the grounded, verified APA report.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
