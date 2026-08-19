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
            <span className="stat-label">Original</span>
            <span className="stat-value">{formatFileSize(originalSizeKB)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Compressed</span>
            <span className="stat-value success">{formatFileSize(compressedResult.sizeKB)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Reduction</span>
            <span className="stat-value success">{reductionPercentage}%</span>
          </div>
        </div>
      </div>

      <a
        href={compressedResult.url}
        download={downloadFileName}
        className="btn-download"
      >
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        Download Compressed Image ({formatFileSize(compressedResult.sizeKB)})
      </a>

      <div className="preview-comparison">
        <div className="preview-title">Visual Comparison</div>
        <div className="preview-grid">
          <div className="preview-box">
            <img src={originalUrl} alt="Original Preview" />
            <div className="preview-caption">Original ({formatFileSize(originalSizeKB)})</div>
          </div>
          <div className="preview-box">
            <img src={compressedResult.url} alt="Compressed Preview" />
            <div className="preview-caption">Compressed ({formatFileSize(compressedResult.sizeKB)})</div>
          </div>
        </div>
      </div>
    </div>
  );
};
