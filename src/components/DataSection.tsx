import React from 'react';
import { DatasetInfo } from '../types';

interface DataSectionProps {
  selectedDataset: string;
  onSelectDataset: (name: string) => void;
  datasetInfo: DatasetInfo | null;
  engineReady: boolean;
}

const DATASET_DESCRIPTIONS: Record<string, string> = {
  mtcars: 'Motor Trend Car Road Tests (1974) — performance metrics for 32 automobiles.',
  marketing: 'Omni-channel advertising spend vs. sales revenue — 200 weekly observations.',
  exam: 'Study hours, attendance & GPA as predictors of final exam score — 100 students.',
};

const PREVIEW_ROWS = 5;

export const DataSection: React.FC<DataSectionProps> = ({
  selectedDataset,
  onSelectDataset,
  datasetInfo,
  engineReady,
}) => {
  return (
    <section className="notebook-cell" id="cell-data">
      <div className="cell-header">
        <span className="step-num">01</span>
        <span className="step-title">ACTIVE DATA CONTEXT</span>
        <span className="cell-badge">In-Memory Environment</span>
      </div>

      <div className="cell-body data-context-body">
        <div className="dataset-selector-row">
          <label htmlFor="dataset-dropdown">Target Dataset:</label>
          <select
            id="dataset-dropdown"
            className="styled-select"
            value={selectedDataset}
            onChange={(e) => onSelectDataset(e.target.value)}
          >
            <option value="mtcars">mtcars (Motor Trend Car Road Tests, N=32)</option>
            <option value="marketing">marketing (Omni-channel Ad Spend &amp; Sales, N=200)</option>
            <option value="exam">exam_scores (Study Hours, Attendance, GPA, N=100)</option>
          </select>
        </div>

        {/* Dataset description */}
        <p className="dataset-description">
          {DATASET_DESCRIPTIONS[selectedDataset]}
        </p>

        {/* Loading skeleton while WebR boots */}
        {!datasetInfo && !engineReady && (
          <div className="dataset-skeleton">
            <div className="skeleton-bar w-40" />
            <div className="skeleton-bar w-60" />
            <div className="skeleton-bar w-80" />
          </div>
        )}

        {!datasetInfo && engineReady && (
          <div className="dataset-skeleton">
            <div className="skeleton-bar w-40 animate" />
            <div className="skeleton-bar w-60 animate" />
            <div className="skeleton-bar w-80 animate" />
          </div>
        )}

        {datasetInfo && (
          <div className="dataset-meta-box">
            <div className="meta-stats">
              <span className="stat-pill"><strong>N:</strong> {datasetInfo.rows} observations</span>
              <span className="stat-pill"><strong>K:</strong> {datasetInfo.cols} variables</span>
              <span className="stat-pill"><strong>Engine:</strong> WebR Virtual Heap</span>
            </div>

            <div className="schema-strip">
              <span className="schema-label">Available Covariates:</span>
              <div className="schema-pills">
                {datasetInfo.columns.map((col) => (
                  <span key={col.name} className="covariate-pill">
                    <code>{col.name}</code>
                    <span className="type-tag">{col.type}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* 5-row column preview table */}
            <div className="dataset-preview-wrapper">
              <span className="schema-label">Column Preview (first {Math.min(PREVIEW_ROWS, datasetInfo.cols)} variables):</span>
              <div className="dataset-preview-scroll">
                <table className="dataset-preview-table">
                  <thead>
                    <tr>
                      <th className="row-idx-col">#</th>
                      {datasetInfo.columns.slice(0, PREVIEW_ROWS).map((col) => (
                        <th key={col.name}>{col.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i}>
                        <td className="row-idx-col">{i + 1}</td>
                        {datasetInfo.columns.slice(0, PREVIEW_ROWS).map((col) => (
                          <td key={col.name} className="preview-cell-val">
                            <span className="skeleton-inline" />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <span className="preview-note">Schema preview only — data lives exclusively in the WebR WASM heap.</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
