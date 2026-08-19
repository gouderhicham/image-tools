import React from 'react';
import type { ImageDimensions } from '../types/compressor';
import { formatFileSize } from '../utils/formatters';

interface SelectedFileCardProps {
  fileName: string;
  fileSizeKB: number;
  imageUrl: string;
  dimensions: ImageDimensions | null;
  onReset: () => void;
}

export const SelectedFileCard: React.FC<SelectedFileCardProps> = ({
  fileName,
  fileSizeKB,
  imageUrl,
  dimensions,
  onReset,
}) => {
  return (
    <div className="selected-file-card">
      <div className="file-details">
        <img src={imageUrl} alt="Thumbnail" className="file-icon-thumb" />
        <div className="file-info">
          <span className="file-name" title={fileName}>
            {fileName}
          </span>
          <span className="file-meta">
            {formatFileSize(fileSizeKB)}
            {dimensions && ` • ${dimensions.width} × ${dimensions.height}px`}
          </span>
        </div>
      </div>
      <button type="button" className="btn-change" onClick={onReset}>
        Change
      </button>
    </div>
  );
};
