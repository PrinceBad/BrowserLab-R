import React from 'react';

interface PlotSectionProps {
  plotUrl: string | null;
  isLoading: boolean;
}

export const PlotSection: React.FC<PlotSectionProps> = ({ plotUrl, isLoading }) => {
  return (
    <section className="notebook-cell" id="cell-plot">
      <div className="cell-header">
        <span className="step-num">06</span>
        <span className="step-title">DIAGNOSTIC GRAPHICS DEVICE (RESIDUAL PLOTS)</span>
        <span className="cell-badge">High-DPI webr::canvas</span>
      </div>

      <div className="cell-body plot-body">
        <div className="plot-viewport">
          {plotUrl ? (
            <img src={plotUrl} alt="Diagnostic residual and normal Q-Q plots" className="diagnostic-plot-img" />
          ) : (
            <div className="plot-placeholder">
              {isLoading ? (
                <>
                  <div className="spinner-icon lg" />
                  <p>Rendering High-DPI Diagnostic Graphics Device in WebR...</p>
                </>
              ) : (
                <>
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <p>Execute audit to render dual-pane residual diagnostic charts (Homoskedasticity & Normal Q-Q)</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
