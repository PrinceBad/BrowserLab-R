export type GuardrailStatus = 'pass' | 'borderline' | 'fail';

export interface CoefficientMetric {
  term: string;
  estimate: number;
  stdError: number;
  statistic: number;
  pValue: number;
}

export interface StatisticalAuditPayload {
  formula: string;
  dataset: string;
  n: number;
  coefficients: CoefficientMetric[];
  rSquared: number;
  adjRSquared: number;
  fStatistic: number;
  fPValue: number;
  dfNum: number;
  dfDenom: number;
  residualSE: number;
  shapiro: {
    statistic: number;
    pValue: number;
    status: GuardrailStatus;
  };
  breuschPagan: {
    statistic: number;
    pValue: number;
    status: GuardrailStatus;
  };
  vif: {
    terms: { term: string; vif: number }[];
    maxVif: number;
    status: GuardrailStatus;
  };
  modelFitStatus: GuardrailStatus;
  overallAuditSummary: {
    passedCount: number;
    borderlineCount: number;
    failedCount: number;
  };
  warnings: string[];
}

export interface DatasetInfo {
  name: string;
  label: string;
  rows: number;
  cols: number;
  columns: { name: string; type: string }[];
}

export type ExecutionStage = 
  | 'idle'
  | 'booting'
  | 'fitting'
  | 'diagnostics'
  | 'vif'
  | 'plotting'
  | 'reporting'
  | 'complete'
  | 'error';

export interface StageStep {
  id: ExecutionStage;
  label: string;
  detail?: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  timestamp?: string;
}
