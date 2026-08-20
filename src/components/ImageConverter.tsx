import React, { useState, useEffect, useId } from 'react';
import type {
  ConvertFormatId,
  ConversionOptions,
  ConversionResult,
  IcoResolution,
  PdfPageSize,
  PdfOrientation,
} from '../types/converter';
import {
  FORMAT_REGISTRY,
  DEFAULT_CONVERSION_OPTIONS,
  convertImage,
} from '../utils/imageConverter';
import { formatFileSize } from '../utils/formatters';

interface ImageConverterProps {
  originalFile: File;
  imageUrl: string;
  originalFileName: string;
  originalDimensions: { width: number; height: number } | null;
}

export const ImageConverter: React.FC<ImageConverterProps> = ({
  originalFile,
  imageUrl,
  originalFileName,
  originalDimensions,
}) => {
  const scaleSelectId = useId();
  const widthInputId = useId();
  const heightInputId = useId();
  const customBgColorId = useId();
  const icoSizeId = useId();
  const pdfSizeId = useId();
  const pdfOrientationId = useId();

  // State
  const [options, setOptions] = useState<ConversionOptions>(() => ({
    ...DEFAULT_CONVERSION_OPTIONS,
    customWidth: originalDimensions?.width ?? 0,
    customHeight: originalDimensions?.height ?? 0,
  }));
  const [activeCategory, setActiveCategory] = useState<'all' | 'web' | 'vector_icon' | 'document_bitmap'>('all');
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);

  // Clean up object URLs on unmount or new conversion
  useEffect(() => {
    return () => {
      if (result?.url) {
        URL.revokeObjectURL(result.url);
      }
    };
  }, [result?.url]);

  const selectedFormatMeta = FORMAT_REGISTRY[options.targetFormat];

  // Effective dimensions for display and calculation
  const effectiveWidth = options.customWidth || originalDimensions?.width || 0;
  const effectiveHeight = options.customHeight || originalDimensions?.height || 0;

  // Handle format switch
  const handleFormatChange = (formatId: ConvertFormatId) => {
    const meta = FORMAT_REGISTRY[formatId];
    setOptions((prev) => ({
      ...prev,
      targetFormat: formatId,
      // Background is always selected to transparent if possible, otherwise solid white
      backgroundColor: meta.supportsTransparency ? 'transparent' : '#ffffff',
    }));
    setErrorMessage(null);
  };

  // Dimension scaling handlers with aspect ratio lock
  const handleWidthChange = (val: number) => {
    if (!originalDimensions || !options.maintainAspectRatio || originalDimensions.width === 0) {
      setOptions((prev) => ({ ...prev, customWidth: val }));
      return;
    }
    const ratio = originalDimensions.height / originalDimensions.width;
    const newHeight = Math.round(val * ratio);
    setOptions((prev) => ({
      ...prev,
      customWidth: val,
      customHeight: newHeight,
    }));
  };

  const handleHeightChange = (val: number) => {
    if (!originalDimensions || !options.maintainAspectRatio || originalDimensions.height === 0) {
      setOptions((prev) => ({ ...prev, customHeight: val }));
      return;
    }
    const ratio = originalDimensions.width / originalDimensions.height;
    const newWidth = Math.round(val * ratio);
    setOptions((prev) => ({
      ...prev,
      customHeight: val,
      customWidth: newWidth,
    }));
  };

  // Convert handler
  const handleConvert = async () => {
    setIsConverting(true);
    setErrorMessage(null);

    try {
      if (result?.url) {
        URL.revokeObjectURL(result.url);
      }

      const conversionOptions: ConversionOptions = {
        ...options,
        customWidth: effectiveWidth,
        customHeight: effectiveHeight,
      };

      const conversionResult = await convertImage(originalFile, conversionOptions);
      setResult(conversionResult);
    } catch (err: unknown) {
      console.error(err);
      const msg =
        err instanceof Error
          ? err.message
          : 'Image conversion failed. Please try different options or formats.';
      setErrorMessage(msg);
    } finally {
      setIsConverting(false);
    }
  };

  // Copy converted image to clipboard
  const handleCopyToClipboard = async () => {
    if (!result) return;
    try {
      if (
        result.format === 'png' ||
        result.format === 'jpeg' ||
        result.format === 'webp'
      ) {
        // Modern Clipboard API
        const item = new ClipboardItem({ [result.mimeType]: result.blob });
        await navigator.clipboard.write([item]);
        setCopiedNotification(true);
        setTimeout(() => setCopiedNotification(false), 3000);
      } else {
        // For other formats (SVG text or general feedback)
        if (result.format === 'svg') {
          const text = await result.blob.text();
          await navigator.clipboard.writeText(text);
          setCopiedNotification(true);
          setTimeout(() => setCopiedNotification(false), 3000);
        } else {
          setErrorMessage('Clipboard copy is only supported for raster PNG/JPEG/WebP and SVG code.');
        }
      }
    } catch (err) {
      console.warn('Clipboard write failed:', err);
      setErrorMessage('Could not write to clipboard. Use the Download button instead.');
    }
  };

  // Filter formats by category
  const formatList = Object.values(FORMAT_REGISTRY).filter((meta) => {
    if (activeCategory === 'all') return true;
    return meta.category === activeCategory;
  });

  // Calculate size change percentage
  const sizeDiffPercent = result
    ? Math.round(((result.sizeKB - result.originalSizeKB) / result.originalSizeKB) * 100)
    : 0;

  return (
    <div className="converter-container">
      {/* Category Filter Tabs */}
      <div className="converter-tabs-row">
        <div className="converter-category-tabs" role="tablist" aria-label="Format categories">
          <button
            type="button"
            className={`category-tab-btn ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            All Formats ({Object.keys(FORMAT_REGISTRY).length})
          </button>
          <button
            type="button"
            className={`category-tab-btn ${activeCategory === 'web' ? 'active' : ''}`}
            onClick={() => setActiveCategory('web')}
          >
            Web & Modern (AVIF, WebP, JPG, PNG)
          </button>
          <button
            type="button"
            className={`category-tab-btn ${activeCategory === 'vector_icon' ? 'active' : ''}`}
            onClick={() => setActiveCategory('vector_icon')}
          >
            Vector & Icons (SVG, ICO)
          </button>
          <button
            type="button"
            className={`category-tab-btn ${activeCategory === 'document_bitmap' ? 'active' : ''}`}
            onClick={() => setActiveCategory('document_bitmap')}
          >
            Documents & Bitmaps (PDF, BMP, TIFF, GIF)
          </button>
        </div>
      </div>

      {/* Target Format Selector Grid */}
      <div className="format-selection-section">
        <label className="section-label">Select Target Output Format</label>
        <div className="format-grid">
          {formatList.map((meta) => {
            const isSelected = options.targetFormat === meta.id;
            return (
              <button
                key={meta.id}
                type="button"
                className={`format-card ${isSelected ? 'selected' : ''}`}
                onClick={() => handleFormatChange(meta.id)}
              >
                <div className="format-card-header">
                  <span className="format-name">{meta.name}</span>
                  <span className={`format-badge badge-${meta.id}`}>{meta.badge}</span>
                </div>
                <div className="format-ext">{meta.extension}</div>
                <div className="format-desc">{meta.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Conversion Settings & Controls */}
      <div className="converter-controls-panel">
        <div className="converter-settings-grid">
          {/* Background / Transparency Fill */}
          <div className="control-card">
            <div className="control-card-header">
              <label className="control-label">Background / Transparency Fill</label>
              {!selectedFormatMeta.supportsTransparency && (
                <span className="control-tag-warning">Solid Fill Required</span>
              )}
            </div>
            <div className="bg-fill-swatches">
              {selectedFormatMeta.supportsTransparency && (
                <button
                  type="button"
                  className={`bg-swatch-btn ${options.backgroundColor === 'transparent' ? 'selected' : ''}`}
                  onClick={() => setOptions((prev) => ({ ...prev, backgroundColor: 'transparent' }))}
                  title="Preserve Transparent Background"
                >
                  <span className="swatch-preview checkerboard" />
                  <span>Alpha (Transparent)</span>
                </button>
              )}
              <button
                type="button"
                className={`bg-swatch-btn ${options.backgroundColor === '#ffffff' ? 'selected' : ''}`}
                onClick={() => setOptions((prev) => ({ ...prev, backgroundColor: '#ffffff' }))}
                title="White Background"
              >
                <span className="swatch-preview swatch-white" />
                <span>Solid White</span>
              </button>
              <button
                type="button"
                className={`bg-swatch-btn ${options.backgroundColor === '#000000' ? 'selected' : ''}`}
                onClick={() => setOptions((prev) => ({ ...prev, backgroundColor: '#000000' }))}
                title="Black Background"
              >
                <span className="swatch-preview swatch-black" />
                <span>Solid Black</span>
              </button>
              <div className="custom-color-wrapper">
                <input
                  id={customBgColorId}
                  type="color"
                  value={options.backgroundColor.startsWith('#') ? options.backgroundColor : '#ffffff'}
                  className="color-picker-input"
                  onChange={(e) =>
                    setOptions((prev) => ({ ...prev, backgroundColor: e.target.value }))
                  }
                  title="Pick custom color"
                />
                <label htmlFor={customBgColorId} className="custom-color-label">Custom</label>
              </div>
            </div>
          </div>

          {/* Resolution & Rescaling */}
          <div className="control-card">
            <div className="control-card-header">
              <label htmlFor={scaleSelectId} className="control-label">Image Scaling & Dimensions</label>
              {originalDimensions && (
                <span className="control-hint">
                  Original: {originalDimensions.width} × {originalDimensions.height} px
                </span>
              )}
            </div>
            <div className="scale-mode-selector">
              <div className="scale-preset-buttons">
                <button
                  type="button"
                  className={`preset-chip ${options.scaleMode === 'original' ? 'active' : ''}`}
                  onClick={() => setOptions((prev) => ({ ...prev, scaleMode: 'original' }))}
                >
                  Original (100%)
                </button>
                <button
                  type="button"
                  className={`preset-chip ${options.scaleMode === 'preset' && options.scalePercentage === 75 ? 'active' : ''}`}
                  onClick={() =>
                    setOptions((prev) => ({ ...prev, scaleMode: 'preset', scalePercentage: 75 }))
                  }
                >
                  75%
                </button>
                <button
                  type="button"
                  className={`preset-chip ${options.scaleMode === 'preset' && options.scalePercentage === 50 ? 'active' : ''}`}
                  onClick={() =>
                    setOptions((prev) => ({ ...prev, scaleMode: 'preset', scalePercentage: 50 }))
                  }
                >
                  50%
                </button>
                <button
                  type="button"
                  className={`preset-chip ${options.scaleMode === 'preset' && options.scalePercentage === 25 ? 'active' : ''}`}
                  onClick={() =>
                    setOptions((prev) => ({ ...prev, scaleMode: 'preset', scalePercentage: 25 }))
                  }
                >
                  25%
                </button>
                <button
                  type="button"
                  className={`preset-chip ${options.scaleMode === 'preset' && options.scalePercentage === 200 ? 'active' : ''}`}
                  onClick={() =>
                    setOptions((prev) => ({ ...prev, scaleMode: 'preset', scalePercentage: 200 }))
                  }
                >
                  200% (2x)
                </button>
                <button
                  type="button"
                  className={`preset-chip ${options.scaleMode === 'custom' ? 'active' : ''}`}
                  onClick={() => setOptions((prev) => ({ ...prev, scaleMode: 'custom' }))}
                >
                  Custom Pixels
                </button>
              </div>

              {options.scaleMode === 'custom' && (
                <div className="custom-dimension-inputs">
                  <div className="dim-input-group">
                    <label htmlFor={widthInputId}>Width (px)</label>
                    <input
                      id={widthInputId}
                      type="number"
                      min="1"
                      className="form-control"
                      value={options.customWidth || ''}
                      onChange={(e) => handleWidthChange(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <button
                    type="button"
                    className={`aspect-lock-btn ${options.maintainAspectRatio ? 'locked' : ''}`}
                    onClick={() =>
                      setOptions((prev) => ({
                        ...prev,
                        maintainAspectRatio: !prev.maintainAspectRatio,
                      }))
                    }
                    title={options.maintainAspectRatio ? 'Aspect Ratio Locked' : 'Aspect Ratio Unlocked'}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {options.maintainAspectRatio ? (
                        <>
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </>
                      ) : (
                        <>
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                        </>
                      )}
                    </svg>
                  </button>
                  <div className="dim-input-group">
                    <label htmlFor={heightInputId}>Height (px)</label>
                    <input
                      id={heightInputId}
                      type="number"
                      min="1"
                      className="form-control"
                      value={options.customHeight || ''}
                      onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ICO Specific Resolution Picker */}
          {selectedFormatMeta.supportsIcoSizes && (
            <div className="control-card highlight-card">
              <div className="control-card-header">
                <label htmlFor={icoSizeId} className="control-label">ICO Favicon Resolution</label>
                <span className="control-hint">Windows & Web standard</span>
              </div>
              <div className="ico-size-selector">
                {(['multi', 16, 32, 48, 64, 128, 256] as (IcoResolution)[]).map((sz) => (
                  <button
                    key={sz.toString()}
                    type="button"
                    className={`preset-chip ${options.icoSize === sz ? 'active' : ''}`}
                    onClick={() => setOptions((prev) => ({ ...prev, icoSize: sz }))}
                  >
                    {sz === 'multi' ? 'All-in-One Multi-Size Pack (16-256)' : `${sz} × ${sz} px`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PDF Specific Page Options */}
          {selectedFormatMeta.supportsPdfLayout && (
            <div className="control-card highlight-card">
              <div className="control-card-header">
                <label className="control-label">PDF Document Layout</label>
              </div>
              <div className="pdf-options-row">
                <div className="pdf-opt-group">
                  <label htmlFor={pdfSizeId}>Page Size</label>
                  <select
                    id={pdfSizeId}
                    className="form-control"
                    value={options.pdfPageSize}
                    onChange={(e) =>
                      setOptions((prev) => ({
                        ...prev,
                        pdfPageSize: e.target.value as PdfPageSize,
                      }))
                    }
                  >
                    <option value="fit">Fit to Image Size</option>
                    <option value="a4">Standard A4 Sheet</option>
                    <option value="letter">US Letter (8.5 × 11 in)</option>
                  </select>
                </div>
                {options.pdfPageSize !== 'fit' && (
                  <div className="pdf-opt-group">
                    <label htmlFor={pdfOrientationId}>Orientation</label>
                    <select
                      id={pdfOrientationId}
                      className="form-control"
                      value={options.pdfOrientation}
                      onChange={(e) =>
                        setOptions((prev) => ({
                          ...prev,
                          pdfOrientation: e.target.value as PdfOrientation,
                        }))
                      }
                    >
                      <option value="auto">Auto (Match Image Ratio)</option>
                      <option value="portrait">Portrait</option>
                      <option value="landscape">Landscape</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="alert alert-danger" role="alert">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Primary Convert Button */}
        <div className="converter-action-bar">
          <button
            type="button"
            className="btn-primary btn-large"
            onClick={handleConvert}
            disabled={isConverting}
          >
            {isConverting ? (
              <>
                <span className="spinner" />
                <span>Converting to {selectedFormatMeta.name}...</span>
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                </svg>
                <span>Convert to {selectedFormatMeta.name}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Result Section */}
      {result && (
        <div className="conversion-result-card animate-fade-in">
          <div className="result-header">
            <div className="result-title-box">
              <span className="result-status-badge">Conversion Complete</span>
              <h3>{result.fileName}</h3>
            </div>
            <span className="result-time-tag">Generated in {result.durationMs}ms</span>
          </div>

          {/* Stats Bar */}
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Original Size</span>
              <span className="stat-value">{formatFileSize(result.originalSizeKB)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Converted Size</span>
              <span className={`stat-value ${sizeDiffPercent <= 0 ? 'success' : ''}`}>
                {formatFileSize(result.sizeKB)}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Size Change</span>
              <span className={`stat-value ${sizeDiffPercent <= 0 ? 'success' : 'neutral'}`}>
                {sizeDiffPercent <= 0 ? `${sizeDiffPercent}% Saved` : `+${sizeDiffPercent}%`}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Dimensions</span>
              <span className="stat-value">{result.width} × {result.height} px</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Output Format</span>
              <span className="stat-value format-pill-badge">{result.mimeType}</span>
            </div>
          </div>

          {/* Actions: Download, Copy, View */}
          <div className="result-actions-row">
            <a
              href={result.url}
              download={result.fileName}
              className="btn-download"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Download {selectedFormatMeta.name} ({formatFileSize(result.sizeKB)})</span>
            </a>

            <button
              type="button"
              className="btn-secondary"
              onClick={handleCopyToClipboard}
              title="Copy converted image to clipboard"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              <span>{copiedNotification ? 'Copied to Clipboard!' : 'Copy to Clipboard'}</span>
            </button>

            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
              title="Open full resolution preview in new tab"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              <span>Open in New Tab</span>
            </a>
          </div>

          {/* Visual Comparison Grid */}
          <div className="preview-comparison">
            <div className="preview-title">Visual Comparison</div>
            <div className="preview-grid">
              <div className="preview-box">
                <div className="preview-box-inner checkerboard">
                  <img src={imageUrl} alt="Original Image Preview" />
                </div>
                <div className="preview-caption">
                  Original ({originalFileName}) — {formatFileSize(result.originalSizeKB)}
                </div>
              </div>
              <div className="preview-box">
                <div className="preview-box-inner checkerboard">
                  {result.format === 'pdf' ? (
                    <div className="pdf-preview-box">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.5">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                      </svg>
                      <span>PDF Document Ready</span>
                    </div>
                  ) : (
                    <img src={result.url} alt="Converted Image Preview" />
                  )}
                </div>
                <div className="preview-caption">
                  Converted ({selectedFormatMeta.name}) — {formatFileSize(result.sizeKB)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
