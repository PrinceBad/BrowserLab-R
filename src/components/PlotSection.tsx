import React, { useState, useEffect, useCallback } from 'react';

interface PlotSectionProps {
  plotUrl: string | null;
  isLoading: boolean;
}

export const PlotSection: React.FC<PlotSectionProps> = ({ plotUrl, isLoading }) => {
  const [zoomed, setZoomed] = useState(false);

  // ESC to close zoom
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setZoomed(false);
  }, []);

  useEffect(() => {
    if (zoomed) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomed, handleKeyDown]);

  return (
    <section className="notebook-cell" id="cell-plot">
      <div className="cell-header">
        <span className="step-num">06</span>
        <span className="step-title">DIAGNOSTIC GRAPHICS DEVICE (RESIDUAL PLOTS)</span>
        <div className="cell-header-actions">
          <span className="cell-badge">High-DPI webr::canvas</span>
          {plotUrl && (
            <>
              <button
                className="mini-btn"
                onClick={() => setZoomed(true)}
                title="View plot full-screen"
              >
                ⛶ ZOOM
              </button>
              <a
                className="mini-btn"
                href={plotUrl}
                download="browserlab_diagnostic_plot.png"
                title="Download plot as PNG"
              >
                ↓ DOWNLOAD PNG
              </a>
            </>
          )}
        </div>
      </div>

      <div className="cell-body plot-body">
        <div className="plot-viewport">
          {plotUrl ? (
            <img
              src={plotUrl}
              alt="Diagnostic residual and normal Q-Q plots"
              className="diagnostic-plot-img"
              onClick={() => setZoomed(true)}
              style={{ cursor: 'zoom-in' }}
              title="Click to zoom"
            />
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
                  <p>Execute audit to render dual-pane residual diagnostic charts (Homoskedasticity &amp; Normal Q-Q)</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Full-screen zoom overlay */}
      {zoomed && plotUrl && (
        <div className="plot-zoom-overlay" onClick={() => setZoomed(false)}>
          <div className="plot-zoom-inner" onClick={(e) => e.stopPropagation()}>
            <button className="plot-zoom-close" onClick={() => setZoomed(false)} title="Close (ESC)">
              ✕
            </button>
            <img src={plotUrl} alt="Full-screen diagnostic plot" className="plot-zoom-img" />
            <p className="plot-zoom-hint">Press ESC or click ✕ to close · Click outside to dismiss</p>
          </div>
        </div>
      )}
    </section>
  );
};
