import React from 'react';
import { DatasetInfo } from '../types';

interface DataSectionProps {
  selectedDataset: string;
  onSelectDataset: (name: string) => void;
  datasetInfo: DatasetInfo | null;
}

export const DataSection: React.FC<DataSectionProps> = ({
  selectedDataset,
  onSelectDataset,
  datasetInfo,
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
            <option value="marketing">marketing (Omni-channel Ad Spend & Sales, N=200)</option>
            <option value="exam">exam_scores (Study Hours, Attendance, GPA, N=100)</option>
          </select>
        </div>

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
          </div>
        )}
      </div>
    </section>
  );
};
