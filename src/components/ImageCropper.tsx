import React, { useState, useRef, useEffect, useCallback, useId } from 'react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageCropperProps {
  imageUrl: string;
  originalFileName: string;
}

type CornerRadiusUnit = 'px' | '%';
type OutputFormat = 'image/png' | 'image/webp' | 'image/jpeg';
type BgFillType = 'transparent' | '#ffffff' | '#000000' | 'custom';

export const ImageCropper: React.FC<ImageCropperProps> = ({ imageUrl, originalFileName }) => {
  const aspectSelectId = useId();
  const radiusSliderId = useId();
  const radiusInputId = useId();
  const tlSliderId = useId();
  const trSliderId = useId();
  const brSliderId = useId();
  const blSliderId = useId();
  const customColorId = useId();
  const formatSelectId = useId();

  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    x: 10,
    y: 10,
    width: 80,
    height: 80,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const [croppedUrl, setCroppedUrl] = useState<string | null>(null);
  const [croppedBlobSize, setCroppedBlobSize] = useState<number | null>(null);
  const [croppedDimensions, setCroppedDimensions] = useState<{ width: number; height: number } | null>(null);

  // Corner radius states
  const [isIndependentCorners, setIsIndependentCorners] = useState<boolean>(false);
  const [unifiedRadius, setUnifiedRadius] = useState<number>(0);
  const [radiusUnit, setRadiusUnit] = useState<CornerRadiusUnit>('px');
  const [topLeftRadius, setTopLeftRadius] = useState<number>(0);
  const [topRightRadius, setTopRightRadius] = useState<number>(0);
  const [bottomRightRadius, setBottomRightRadius] = useState<number>(0);
  const [bottomLeftRadius, setBottomLeftRadius] = useState<number>(0);

  // Background fill and output format
  const [bgFill, setBgFill] = useState<BgFillType>('transparent');
  const [customBgColor, setCustomBgColor] = useState<string>('#ffffff');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('image/png');

  const imgRef = useRef<HTMLImageElement | null>(null);

  const handleAspectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'free') {
      setAspect(undefined);
    } else if (val === '1:1') {
      setAspect(1);
    } else if (val === '4:3') {
      setAspect(4 / 3);
    } else if (val === '16:9') {
      setAspect(16 / 9);
    } else if (val === '3:2') {
      setAspect(3 / 2);
    } else if (val === '9:16') {
      setAspect(9 / 16);
    }
  };

  const getEffectiveRadiusValues = useCallback((cropWidth: number, cropHeight: number) => {
    const minDim = Math.min(cropWidth, cropHeight);
    const maxAllowedPx = Math.floor(minDim / 2);

    if (!isIndependentCorners) {
      if (radiusUnit === '%') {
        const val = Math.min(50, Math.max(0, unifiedRadius));
        const pxVal = (val / 100) * minDim;
        return { tl: pxVal, tr: pxVal, br: pxVal, bl: pxVal, isPercent: true, percent: val };
      } else {
        const pxVal = Math.min(maxAllowedPx, Math.max(0, unifiedRadius));
        return { tl: pxVal, tr: pxVal, br: pxVal, bl: pxVal, isPercent: false, percent: 0 };
      }
    } else {
      return {
        tl: Math.min(maxAllowedPx, Math.max(0, topLeftRadius)),
        tr: Math.min(maxAllowedPx, Math.max(0, topRightRadius)),
        br: Math.min(maxAllowedPx, Math.max(0, bottomRightRadius)),
        bl: Math.min(maxAllowedPx, Math.max(0, bottomLeftRadius)),
        isPercent: false,
        percent: 0,
      };
    }
  }, [isIndependentCorners, radiusUnit, unifiedRadius, topLeftRadius, topRightRadius, bottomRightRadius, bottomLeftRadius]);

  // CSS border radius string for the preview crop selection box
  const getCssBorderRadius = () => {
    const displayedWidth = completedCrop?.width || 200;
    const displayedHeight = completedCrop?.height || 200;
    const radii = getEffectiveRadiusValues(displayedWidth, displayedHeight);

    if (radii.isPercent) {
      return `${radii.percent}%`;
    }
    return `${radii.tl}px ${radii.tr}px ${radii.br}px ${radii.bl}px`;
  };

  const drawRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    radii: [number, number, number, number]
  ) => {
    let [tl, tr, br, bl] = radii;
    const maxRadius = Math.min(w, h) / 2;
    tl = Math.min(Math.max(0, tl), maxRadius);
    tr = Math.min(Math.max(0, tr), maxRadius);
    br = Math.min(Math.max(0, br), maxRadius);
    bl = Math.min(Math.max(0, bl), maxRadius);

    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(x, y, w, h, [tl, tr, br, bl]);
    } else {
      ctx.moveTo(x + tl, y);
      ctx.lineTo(x + w - tr, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + tr);
      ctx.lineTo(x + w, y + h - br);
      ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
      ctx.lineTo(x + bl, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - bl);
      ctx.lineTo(x, y + tl);
      ctx.quadraticCurveTo(x, y, x + tl, y);
      ctx.closePath();
    }
  };

  const generateCrop = useCallback(() => {
    const image = imgRef.current;
    if (!image || !completedCrop || completedCrop.width === 0 || completedCrop.height === 0) {
      return;
    }

    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const targetWidth = Math.round(completedCrop.width * scaleX);
    const targetHeight = Math.round(completedCrop.height * scaleY);

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Calculate radii scaled to natural image resolution
    const effectiveRadii = getEffectiveRadiusValues(completedCrop.width, completedCrop.height);
    const scaledTL = effectiveRadii.isPercent ? (effectiveRadii.percent / 100) * Math.min(targetWidth, targetHeight) : effectiveRadii.tl * scaleX;
    const scaledTR = effectiveRadii.isPercent ? (effectiveRadii.percent / 100) * Math.min(targetWidth, targetHeight) : effectiveRadii.tr * scaleX;
    const scaledBR = effectiveRadii.isPercent ? (effectiveRadii.percent / 100) * Math.min(targetWidth, targetHeight) : effectiveRadii.br * scaleX;
    const scaledBL = effectiveRadii.isPercent ? (effectiveRadii.percent / 100) * Math.min(targetWidth, targetHeight) : effectiveRadii.bl * scaleX;

    // Fill canvas background if non-transparent or JPEG
    const effectiveFill = outputFormat === 'image/jpeg' && bgFill === 'transparent' ? '#ffffff' : bgFill;
    if (effectiveFill !== 'transparent') {
      ctx.fillStyle = effectiveFill === 'custom' ? customBgColor : effectiveFill;
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    } else {
      ctx.clearRect(0, 0, targetWidth, targetHeight);
    }

    // Clip with rounded rect if any radius is set
    const hasRounding = scaledTL > 0 || scaledTR > 0 || scaledBR > 0 || scaledBL > 0;

    ctx.save();
    if (hasRounding) {
      drawRoundedRect(ctx, 0, 0, targetWidth, targetHeight, [scaledTL, scaledTR, scaledBR, scaledBL]);
      ctx.clip();
    }

    // Draw the cropped sub-image
    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      targetWidth,
      targetHeight
    );
    ctx.restore();

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        if (croppedUrl) {
          URL.revokeObjectURL(croppedUrl);
        }
        const newUrl = URL.createObjectURL(blob);
        setCroppedUrl(newUrl);
        setCroppedBlobSize(blob.size / 1024);
        setCroppedDimensions({ width: targetWidth, height: targetHeight });
      },
      outputFormat,
      outputFormat === 'image/jpeg' || outputFormat === 'image/webp' ? 0.95 : undefined
    );
  }, [completedCrop, getEffectiveRadiusValues, bgFill, customBgColor, outputFormat, croppedUrl]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (croppedUrl) URL.revokeObjectURL(croppedUrl);
    };
  }, [croppedUrl]);

  const getCroppedFileName = () => {
    const lastDot = originalFileName.lastIndexOf('.');
    const baseName = lastDot > 0 ? originalFileName.substring(0, lastDot) : originalFileName;
    let ext = '.png';
    if (outputFormat === 'image/webp') ext = '.webp';
    if (outputFormat === 'image/jpeg') ext = '.jpg';
    
    const hasRounding = unifiedRadius > 0 || topLeftRadius > 0 || topRightRadius > 0 || bottomRightRadius > 0 || bottomLeftRadius > 0;
    return `${baseName}-cropped${hasRounding ? '-rounded' : ''}${ext}`;
  };

  const applyPreset = (preset: 'sharp' | 'subtle' | 'rounded' | 'smooth' | 'circle') => {
    setIsIndependentCorners(false);
    if (preset === 'sharp') {
      setRadiusUnit('px');
      setUnifiedRadius(0);
    } else if (preset === 'subtle') {
      setRadiusUnit('px');
      setUnifiedRadius(12);
    } else if (preset === 'rounded') {
      setRadiusUnit('px');
      setUnifiedRadius(24);
    } else if (preset === 'smooth') {
      setRadiusUnit('px');
      setUnifiedRadius(48);
    } else if (preset === 'circle') {
      setRadiusUnit('%');
      setUnifiedRadius(50);
    }
  };

  const maxSliderValue = radiusUnit === '%' ? 50 : 200;

  return (
    <div className="cropper-container">
      {/* Workspace with live styled border-radius */}
      <div 
        className="crop-workspace" 
        style={{ '--crop-border-radius': getCssBorderRadius() } as React.CSSProperties}
      >
        <ReactCrop
          crop={crop}
          onChange={(c) => setCrop(c)}
          onComplete={(c) => setCompletedCrop(c)}
          aspect={aspect}
        >
          <img
            ref={imgRef}
            src={imageUrl}
            alt="Source for crop"
            onLoad={() => {
              setCrop({
                unit: '%',
                x: 10,
                y: 10,
                width: 80,
                height: 80,
              });
            }}
          />
        </ReactCrop>
      </div>

      <div className="cropper-controls">
        {/* Aspect Ratio Row */}
        <div className="form-group">
          <label htmlFor={aspectSelectId}>
            <span className="control-icon">📐</span> Aspect Ratio Lock
          </label>
          <select id={aspectSelectId} className="form-control" onChange={handleAspectChange}>
            <option value="free">Free (Custom Size & Shape)</option>
            <option value="1:1">1 : 1 (Square / Avatar)</option>
            <option value="4:3">4 : 3 (Standard Photo)</option>
            <option value="16:9">16 : 9 (Widescreen)</option>
            <option value="3:2">3 : 2 (Classic 35mm)</option>
            <option value="9:16">9 : 16 (Story / Reel)</option>
          </select>
        </div>

        {/* Corner Border Radius Controls */}
        <div className="radius-control-card">
          <div className="radius-card-header">
            <div className="radius-card-title">
              <span className="control-icon">🔲</span>
              <div>
                <strong>Corner Border Radius</strong>
                <span className="radius-subtext">Curvature for cropped corners</span>
              </div>
            </div>
            <button
              type="button"
              className={`btn-corner-toggle ${isIndependentCorners ? 'active' : ''}`}
              onClick={() => setIsIndependentCorners(!isIndependentCorners)}
              title={isIndependentCorners ? 'Switch to unified corners' : 'Switch to individual corner control'}
            >
              {isIndependentCorners ? '🔗 Link All Corners' : '🔀 Independent Corners'}
            </button>
          </div>

          {/* Quick Presets */}
          {!isIndependentCorners && (
            <div className="radius-presets-row">
              <span className="presets-label">Presets:</span>
              <button 
                type="button" 
                className={`btn-preset ${unifiedRadius === 0 && radiusUnit === 'px' ? 'active' : ''}`} 
                onClick={() => applyPreset('sharp')}
              >
                Sharp (0)
              </button>
              <button 
                type="button" 
                className={`btn-preset ${unifiedRadius === 12 && radiusUnit === 'px' ? 'active' : ''}`} 
                onClick={() => applyPreset('subtle')}
              >
                Subtle (12px)
              </button>
              <button 
                type="button" 
                className={`btn-preset ${unifiedRadius === 24 && radiusUnit === 'px' ? 'active' : ''}`} 
                onClick={() => applyPreset('rounded')}
              >
                Rounded (24px)
              </button>
              <button 
                type="button" 
                className={`btn-preset ${unifiedRadius === 48 && radiusUnit === 'px' ? 'active' : ''}`} 
                onClick={() => applyPreset('smooth')}
              >
                Smooth (48px)
              </button>
              <button 
                type="button" 
                className={`btn-preset ${unifiedRadius === 50 && radiusUnit === '%' ? 'active' : ''}`} 
                onClick={() => applyPreset('circle')}
              >
                Circle / Pill (50%)
              </button>
            </div>
          )}

          {/* Unified Radius Slider */}
          {!isIndependentCorners ? (
            <div className="radius-slider-group">
              <div className="slider-header">
                <label htmlFor={radiusSliderId}>Radius Size</label>
                <div className="radius-unit-toggle">
                  <button
                    type="button"
                    className={`btn-unit ${radiusUnit === 'px' ? 'active' : ''}`}
                    onClick={() => {
                      setRadiusUnit('px');
                      if (unifiedRadius > 200) setUnifiedRadius(32);
                    }}
                  >
                    PX
                  </button>
                  <button
                    type="button"
                    className={`btn-unit ${radiusUnit === '%' ? 'active' : ''}`}
                    onClick={() => {
                      setRadiusUnit('%');
                      if (unifiedRadius > 50) setUnifiedRadius(50);
                    }}
                  >
                    %
                  </button>
                </div>
              </div>
              <div className="slider-with-number">
                <input
                  id={radiusSliderId}
                  type="range"
                  min="0"
                  max={maxSliderValue}
                  step="1"
                  value={unifiedRadius}
                  onChange={(e) => setUnifiedRadius(Number(e.target.value))}
                  className="range-slider"
                />
                <div className="number-input-wrapper">
                  <input
                    id={radiusInputId}
                    type="number"
                    min="0"
                    max={maxSliderValue}
                    value={unifiedRadius}
                    onChange={(e) => setUnifiedRadius(Math.max(0, Math.min(maxSliderValue, Number(e.target.value) || 0)))}
                    className="number-input"
                  />
                  <span className="unit-label">{radiusUnit}</span>
                </div>
              </div>
            </div>
          ) : (
            /* 4-Corner Independent Controls Grid */
            <div className="independent-corners-grid">
              <div className="corner-control-box">
                <label htmlFor={tlSliderId} className="corner-label">
                  <span>↖ Top Left</span>
                  <span className="corner-val">{topLeftRadius}px</span>
                </label>
                <input
                  id={tlSliderId}
                  type="range"
                  min="0"
                  max="200"
                  value={topLeftRadius}
                  onChange={(e) => setTopLeftRadius(Number(e.target.value))}
                  className="range-slider"
                />
              </div>

              <div className="corner-control-box">
                <label htmlFor={trSliderId} className="corner-label">
                  <span>↗ Top Right</span>
                  <span className="corner-val">{topRightRadius}px</span>
                </label>
                <input
                  id={trSliderId}
                  type="range"
                  min="0"
                  max="200"
                  value={topRightRadius}
                  onChange={(e) => setTopRightRadius(Number(e.target.value))}
                  className="range-slider"
                />
              </div>

              <div className="corner-control-box">
                <label htmlFor={blSliderId} className="corner-label">
                  <span>↙ Bottom Left</span>
                  <span className="corner-val">{bottomLeftRadius}px</span>
                </label>
                <input
                  id={blSliderId}
                  type="range"
                  min="0"
                  max="200"
                  value={bottomLeftRadius}
                  onChange={(e) => setBottomLeftRadius(Number(e.target.value))}
                  className="range-slider"
                />
              </div>

              <div className="corner-control-box">
                <label htmlFor={brSliderId} className="corner-label">
                  <span>↘ Bottom Right</span>
                  <span className="corner-val">{bottomRightRadius}px</span>
                </label>
                <input
                  id={brSliderId}
                  type="range"
                  min="0"
                  max="200"
                  value={bottomRightRadius}
                  onChange={(e) => setBottomRightRadius(Number(e.target.value))}
                  className="range-slider"
                />
              </div>
            </div>
          )}
        </div>

        {/* Outer Background Fill and Format Selection */}
        <div className="options-grid" style={{ marginTop: 0 }}>
          <div className="form-group">
            <label>
              <span className="control-icon">🎨</span> Corner Background Fill
            </label>
            <div className="bg-fill-options">
              <button
                type="button"
                className={`bg-chip ${bgFill === 'transparent' ? 'active' : ''}`}
                onClick={() => setBgFill('transparent')}
                title="Transparent alpha channel (ideal for PNG/WebP)"
              >
                <span className="checker-dot"></span> Transparent
              </button>
              <button
                type="button"
                className={`bg-chip ${bgFill === '#ffffff' ? 'active' : ''}`}
                onClick={() => setBgFill('#ffffff')}
              >
                <span className="color-dot" style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1' }}></span> White
              </button>
              <button
                type="button"
                className={`bg-chip ${bgFill === '#000000' ? 'active' : ''}`}
                onClick={() => setBgFill('#000000')}
              >
                <span className="color-dot" style={{ backgroundColor: '#000000' }}></span> Black
              </button>
              <label htmlFor={customColorId} className={`bg-chip ${bgFill === 'custom' ? 'active' : ''}`} style={{ cursor: 'pointer' }}>
                <span className="color-dot" style={{ backgroundColor: customBgColor, border: '1px solid #cbd5e1' }}></span>
                Custom
                <input
                  id={customColorId}
                  type="color"
                  value={customBgColor}
                  onChange={(e) => {
                    setCustomBgColor(e.target.value);
                    setBgFill('custom');
                  }}
                  className="hidden-color-input"
                />
              </label>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor={formatSelectId}>
              <span className="control-icon">💾</span> Output Format
            </label>
            <select
              id={formatSelectId}
              className="form-control"
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
            >
              <option value="image/png">PNG (Preserves Transparency)</option>
              <option value="image/webp">WebP (Compressed with Alpha)</option>
              <option value="image/jpeg">JPEG (Solid corners only)</option>
            </select>
          </div>
        </div>

        {/* Warning if JPEG selected with transparent background */}
        {outputFormat === 'image/jpeg' && bgFill === 'transparent' && (
          <div className="alert alert-warning" style={{ margin: '0' }}>
            JPEG does not support transparency. Outer rounded corners will be filled with white background automatically. Choose <strong>PNG</strong> or <strong>WebP</strong> for transparent corners.
          </div>
        )}

        {/* Apply Action Button */}
        <button type="button" className="btn-primary" onClick={generateCrop}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Apply Crop & Corner Radius
        </button>

        {/* Results & Download Section */}
        {croppedUrl && (
          <div className="result-section">
            <div className="cropped-download-box">
              <a
                href={croppedUrl}
                download={getCroppedFileName()}
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
                Download Cropped Image
              </a>

              {croppedBlobSize && croppedDimensions && (
                <div className="crop-meta-info">
                  <span>Resolution: <strong>{croppedDimensions.width} × {croppedDimensions.height} px</strong></span>
                  <span>•</span>
                  <span>Size: <strong>{croppedBlobSize.toFixed(1)} KB</strong></span>
                  <span>•</span>
                  <span>Format: <strong>{outputFormat.replace('image/', '').toUpperCase()}</strong></span>
                </div>
              )}
            </div>

            <div className="preview-comparison">
              <div className="preview-title">Cropped Result Preview</div>
              <div className="preview-box-rounded">
                <img src={croppedUrl} alt="Cropped Preview" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
