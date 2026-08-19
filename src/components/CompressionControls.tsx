import React from 'react';
import type { OutputFormat } from '../types/compressor';

interface CompressionControlsProps {
  targetKB: string;
  setTargetKB: (val: string) => void;
  outputFormat: OutputFormat;
  setOutputFormat: (val: OutputFormat) => void;
  isCompressing: boolean;
  onCompress: () => void;
  errorMessage: string | null;
  warningMessage: string | null;
}

export const CompressionControls: React.FC<CompressionControlsProps> = ({
  targetKB,
  setTargetKB,
  outputFormat,
  setOutputFormat,
  isCompressing,
  onCompress,
  errorMessage,
  warningMessage,
}) => {
  return (
    <>
      <div className="options-grid">
        <div className="form-group">
          <label htmlFor="target-size">Target Output Size</label>
          <div className="input-wrapper">
            <input
              id="target-size"
              type="number"
              min="1"
              step="1"
              className="form-control"
              value={targetKB}
              onChange={(e) => setTargetKB(e.target.value)}
              placeholder="e.g. 100"
            />
            <span className="input-unit">KB</span>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="format-select">Output Format</label>
          <select
            id="format-select"
            className="form-control"
            value={outputFormat}
            onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
          >
            <option value="image/webp">WebP (Efficient Compression)</option>
            <option value="image/jpeg">JPEG (Standard Format)</option>
          </select>
        </div>
      </div>

      {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}
      {warningMessage && <div className="alert alert-warning">{warningMessage}</div>}

      <button
        type="button"
        className="btn-primary"
        onClick={onCompress}
        disabled={isCompressing}
      >
        {isCompressing ? (
          <>
            <span className="spinner" />
            <span>Processing Compression...</span>
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="4 14 10 14 10 20" />
              <polyline points="20 10 14 10 14 4" />
              <line x1="14" y1="10" x2="21" y2="3" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
            <span>Compress Image</span>
          </>
        )}
      </button>
    </>
  );
};
