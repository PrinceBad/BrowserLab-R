import React from 'react';
import { StatisticalAuditPayload, GuardrailStatus } from '../types';

interface GuardrailsSectionProps {
  payload: StatisticalAuditPayload | null;
  activeMetric: string | null;
  onHoverMetric: (metric: string | null) => void;
}

// Plain-English one-liners per status
const VERDICTS: Record<string, Record<GuardrailStatus | 'pending', string>> = {
  normality: {
    pass: 'Residuals are normally distributed. OLS inference is valid.',
    borderline: 'Slight non-normality. Inspect Q-Q plot tails carefully.',
    fail: 'Residuals violate normality. Consider robust standard errors.',
    pending: '',
  },
  homoskedasticity: {
    pass: 'Constant variance confirmed. Standard errors are unbiased.',
    borderline: 'Mild variance instability. Monitor with residual plots.',
    fail: 'Heteroskedasticity detected. Use sandwich::vcovHC correction.',
    pending: '',
  },
  vif: {
    pass: 'Predictors are orthogonal. No collinearity concerns.',
    borderline: 'Moderate collinearity. Coefficients may shift under resampling.',
    fail: 'Severe multicollinearity. Consider PCA or ridge regression.',
    pending: '',
  },
  'model-fit': {
    pass: 'Model is globally significant. Predictors explain the outcome.',
    borderline: 'Weak model significance. Inspect individual predictors.',
    fail: 'Model not significant. Predictors do not explain the outcome.',
    pending: '',
  },
};

// Threshold bar config: [min, max, "good" direction]
const BAR_CONFIG: Record<string, { min: number; max: number; invert: boolean }> = {
  normality:        { min: 0, max: 1, invert: false },  // p-value, higher = better
  homoskedasticity: { min: 0, max: 1, invert: false },
  vif:              { min: 1, max: 10, invert: true },   // VIF, lower = better
  'model-fit':      { min: 0, max: 1, invert: true },   // p-value, lower = better
};

function ThresholdBar({ metricId, value, status }: { metricId: string; value: number; status: GuardrailStatus | 'pending' }) {
  const cfg = BAR_CONFIG[metricId];
  if (!cfg || status === 'pending') return null;

  const pct = Math.min(100, Math.max(0, ((value - cfg.min) / (cfg.max - cfg.min)) * 100));
  const fillPct = cfg.invert ? 100 - pct : pct;

  return (
    <div className="threshold-bar-track">
      <div
        className={`threshold-bar-fill status-${status}`}
        style={{ width: `${fillPct}%` }}
      />
    </div>
  );
}

export const GuardrailsSection: React.FC<GuardrailsSectionProps> = ({
  payload,
  activeMetric,
  onHoverMetric,
}) => {
  const renderBadge = (
    id: string,
    title: string,
    testName: string,
    status: GuardrailStatus | 'pending',
    statLabel: string,
    pValLabel: string,
    thresholdNote: string,
    barValue: number
  ) => {
    const isHighlighted = activeMetric === id;
    const statusText = status.toUpperCase();
    const verdict = VERDICTS[id]?.[status] || '';

    return (
      <div
        className={`guardrail-card status-${status} ${isHighlighted ? 'highlighted' : ''}`}
        onMouseEnter={() => onHoverMetric(id)}
        onMouseLeave={() => onHoverMetric(null)}
      >
        <div className="card-top">
          <span className="card-title">{title}</span>
          <span className={`status-badge badge-${status}`}>{statusText}</span>
        </div>

        <div className="card-metrics">
          <span className="primary-stat">{statLabel}</span>
          <span className="pval-stat">{pValLabel}</span>
        </div>

        <ThresholdBar metricId={id} value={barValue} status={status} />

        <div className="card-footer">
          <span className="test-name">{testName}</span>
          <span className="threshold-hint">{thresholdNote}</span>
          {verdict && <span className="guardrail-verdict">{verdict}</span>}
        </div>
      </div>
    );
  };

  return (
    <section className="notebook-cell" id="cell-guardrails">
      <div className="cell-header">
        <span className="step-num">05</span>
        <span className="step-title">STATISTICAL ASSUMPTION GUARDRAILS (3-TIER VERIFICATION)</span>
        <span className="cell-badge">Deterministic Proof</span>
      </div>

      <div className="cell-body">
        <p className="guardrail-lead">
          Tests are evaluated along a continuous spectrum (<span style={{ color: '#10b981' }}>PASS</span>,{' '}
          <span style={{ color: '#f59e0b' }}>BORDERLINE</span>,{' '}
          <span style={{ color: '#f43f5e' }}>FAIL</span>). Exact test statistics and <em>p</em>-values are permanently displayed:
        </p>

        <div className="guardrails-quad">
          {/* Normality */}
          {renderBadge(
            'normality',
            'Residual Normality',
            'Shapiro-Wilk Test',
            payload ? payload.shapiro.status : 'pending',
            payload ? `W = ${payload.shapiro.statistic}` : 'W = --',
            payload ? `p = ${payload.shapiro.pValue}` : 'p = --',
            'Pass: p ≥ .10 | Borderline: .05 ≤ p < .10',
            payload ? payload.shapiro.pValue : 0
          )}

          {/* Homoskedasticity */}
          {renderBadge(
            'homoskedasticity',
            'Homoskedasticity',
            'Breusch-Pagan Score',
            payload ? payload.breuschPagan.status : 'pending',
            payload ? `Chi2 = ${payload.breuschPagan.statistic}` : 'Chi2 = --',
            payload ? `p = ${payload.breuschPagan.pValue}` : 'p = --',
            'Pass: p ≥ .10 | Borderline: .05 ≤ p < .10',
            payload ? payload.breuschPagan.pValue : 0
          )}

          {/* Collinearity */}
          {renderBadge(
            'vif',
            'Multicollinearity',
            'Variance Inflation Factor',
            payload ? payload.vif.status : 'pending',
            payload ? `Max VIF = ${payload.vif.maxVif}` : 'Max VIF = --',
            payload ? `${payload.vif.terms.length} predictors` : 'Terms: --',
            'Pass: VIF < 2.5 | Borderline: 2.5 ≤ VIF < 5.0',
            payload ? payload.vif.maxVif : 0
          )}

          {/* Model Fit */}
          {renderBadge(
            'model-fit',
            'Model Goodness-of-Fit',
            'Omnibus F-Test',
            payload ? payload.modelFitStatus : 'pending',
            payload ? `F(${payload.dfNum}, ${payload.dfDenom}) = ${payload.fStatistic}` : 'F = --',
            payload ? `p = ${payload.fPValue}` : 'p = --',
            'Pass: p < .01 | Borderline: .01 ≤ p < .05',
            payload ? payload.fPValue : 0
          )}
        </div>

        {/* Methodological Warnings */}
        {payload && payload.warnings.length > 0 && (
          <div className="guardrail-alert-box">
            <div className="alert-heading">
              <span className="alert-icon">⚠️</span>
              <strong>Active Methodological Flags ({payload.warnings.length}):</strong>
            </div>
            <ul className="alert-list">
              {payload.warnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
};
