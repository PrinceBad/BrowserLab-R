import React from 'react';
import { StatisticalAuditPayload, GuardrailStatus } from '../types';

interface GuardrailsSectionProps {
  payload: StatisticalAuditPayload | null;
  activeMetric: string | null;
  onHoverMetric: (metric: string | null) => void;
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
    thresholdNote: string
  ) => {
    const isHighlighted = activeMetric === id;
    const statusText = status.toUpperCase();

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

        <div className="card-footer">
          <span className="test-name">{testName}</span>
          <span className="threshold-hint">{thresholdNote}</span>
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
            'Pass: p ≥ .10 | Borderline: .05 ≤ p < .10'
          )}

          {/* Homoskedasticity */}
          {renderBadge(
            'homoskedasticity',
            'Homoskedasticity',
            'Breusch-Pagan Score',
            payload ? payload.breuschPagan.status : 'pending',
            payload ? `Chi2 = ${payload.breuschPagan.statistic}` : 'Chi2 = --',
            payload ? `p = ${payload.breuschPagan.pValue}` : 'p = --',
            'Pass: p ≥ .10 | Borderline: .05 ≤ p < .10'
          )}

          {/* Collinearity */}
          {renderBadge(
            'vif',
            'Multicollinearity',
            'Variance Inflation Factor',
            payload ? payload.vif.status : 'pending',
            payload ? `Max VIF = ${payload.vif.maxVif}` : 'Max VIF = --',
            payload ? `${payload.vif.terms.length} predictors` : 'Terms: --',
            'Pass: VIF < 2.5 | Borderline: 2.5 ≤ VIF < 5.0'
          )}

          {/* Model Fit */}
          {renderBadge(
            'model-fit',
            'Model Goodness-of-Fit',
            'Omnibus F-Test',
            payload ? payload.modelFitStatus : 'pending',
            payload ? `F(${payload.dfNum}, ${payload.dfDenom}) = ${payload.fStatistic}` : 'F = --',
            payload ? `p = ${payload.fPValue}` : 'p = --',
            'Pass: p < .01 | Borderline: .01 ≤ p < .05'
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
