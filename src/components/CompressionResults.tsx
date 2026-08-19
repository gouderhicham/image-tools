import React from 'react';
import type { CompressedResult, OutputFormat } from '../types/compressor';
import { formatFileSize, getCompressedFileName } from '../utils/formatters';

interface CompressionResultsProps {
  originalSizeKB: number;
  originalUrl: string;
  compressedResult: CompressedResult;
  selectedFileName: string;
  outputFormat: OutputFormat;
}

export const CompressionResults: React.FC<CompressionResultsProps> = ({
  originalSizeKB,
  originalUrl,
  compressedResult,
  selectedFileName,
  outputFormat,
}) => {
  const reductionPercentage = Math.max(
    0,
    Math.round(((originalSizeKB - compressedResult.sizeKB) / originalSizeKB) * 100)
  );

  const downloadFileName = getCompressedFileName(selectedFileName, outputFormat);

  return (
    <div className="result-section">
      <div className="result-card">
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Original Size</span>
            <span className="stat-value">{formatFileSize(originalSizeKB)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Compressed Size</span>
            <span className="stat-value success">{formatFileSize(compressedResult.sizeKB)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Size Saved</span>
            <span className="stat-value success">{reductionPercentage}%</span>
          </div>
        </div>
      </div>

      <a
        href={compressedResult.url}
        download={downloadFileName}
        className="btn-download"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <span>Download Compressed Image ({formatFileSize(compressedResult.sizeKB)})</span>
      </a>

      <div className="preview-comparison">
        <div className="preview-title">Visual Quality Comparison</div>
        <div className="preview-grid">
          <div className="preview-box">
            <img src={originalUrl} alt="Original Preview" />
            <div className="preview-caption">Original — {formatFileSize(originalSizeKB)}</div>
          </div>
          <div className="preview-box">
            <img src={compressedResult.url} alt="Compressed Preview" />
            <div className="preview-caption">Compressed — {formatFileSize(compressedResult.sizeKB)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
