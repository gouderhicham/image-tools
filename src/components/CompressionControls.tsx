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
          <label htmlFor="target-size">Target Size</label>
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
            <option value="image/webp">WebP (Recommended - Smallest)</option>
            <option value="image/jpeg">JPEG (Standard)</option>
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
            <span className="spinner"></span>
            Compressing...
          </>
        ) : (
          'Compress Image'
        )}
      </button>
    </>
  );
};
