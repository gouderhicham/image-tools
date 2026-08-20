import React, { useRef, useState } from 'react';

interface DropZoneProps {
  onFileSelect: (file: File) => void;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFileSelect }) => {
  const [isDragActive, setIsDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = () => {
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      className={`dropzone ${isDragActive ? 'drag-active' : ''}`}
      onClick={() => fileInputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="dropzone-icon-box">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </div>

      <div className="dropzone-title">Click to upload or drag & drop image</div>
      <div className="dropzone-sub">Supports SVG, AVIF, JFIF, JPG, PNG, WebP, BMP, ICO, TIFF, GIF (up to 100MB)</div>

      <div className="dropzone-paste-badge">
        <span>Paste from clipboard</span>
        <kbd>Ctrl</kbd>
        <span>+</span>
        <kbd>V</kbd>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.jfif,.avif,.webp,.svg,.ico,.bmp,.tiff,.tif"
        className="file-input"
        onChange={handleInputChange}
      />
    </div>
  );
};
