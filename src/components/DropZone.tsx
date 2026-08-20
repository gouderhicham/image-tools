import React, { useRef, useState } from 'react';

interface DropZoneProps {
  onFileSelect: (file: File) => void;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFileSelect }) => {
  const [isDragActive, setIsDragActive] = useState<boolean>(false);
  const [pasteStatus, setPasteStatus] = useState<string | null>(null);
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

  // Interactive mobile/desktop tap-to-paste
  const handlePasteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setPasteStatus('Reading clipboard...');

    try {
      if (!navigator.clipboard) {
        setPasteStatus('Clipboard unsupported');
        setTimeout(() => setPasteStatus(null), 3000);
        return;
      }

      if (navigator.clipboard.read) {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          for (const type of item.types) {
            if (type.startsWith('image/')) {
              const blob = await item.getType(type);
              const ext = type.split('/')[1]?.replace('+xml', '') || 'png';
              const file = new File([blob], `pasted-image.${ext}`, { type });
              setPasteStatus('Pasted!');
              setTimeout(() => setPasteStatus(null), 1500);
              onFileSelect(file);
              return;
            }
          }
        }
      }

      if (navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text.trim().startsWith('<svg') || text.includes('xmlns="http://www.w3.org/2000/svg"')) {
          const blob = new Blob([text], { type: 'image/svg+xml' });
          const file = new File([blob], 'pasted-vector.svg', { type: 'image/svg+xml' });
          setPasteStatus('SVG Pasted!');
          setTimeout(() => setPasteStatus(null), 1500);
          onFileSelect(file);
          return;
        }
      }

      setPasteStatus('No image on clipboard');
      setTimeout(() => setPasteStatus(null), 3000);
    } catch (err: unknown) {
      console.warn('Clipboard read error:', err);
      setPasteStatus('Permission denied / Empty');
      setTimeout(() => setPasteStatus(null), 3000);
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
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      </div>

      <div className="dropzone-title">Click to upload or drag & drop image</div>
      <div className="dropzone-sub">Supports HEIC, SVG, AVIF, JFIF, JPG, PNG, WebP, BMP, ICO, TIFF, GIF (up to 100MB)</div>

      <button
        type="button"
        className="dropzone-paste-btn"
        onClick={handlePasteClick}
        title="Tap to paste image directly from clipboard"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        </svg>
        <span>{pasteStatus || 'Paste from clipboard'}</span>
        <span className="desktop-keys">
          <kbd>Ctrl</kbd>
          <span>+</span>
          <kbd>V</kbd>
        </span>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.heic,.heif,.jfif,.avif,.webp,.svg,.ico,.bmp,.tiff,.tif"
        className="file-input"
        onChange={handleInputChange}
      />
    </div>
  );
};
