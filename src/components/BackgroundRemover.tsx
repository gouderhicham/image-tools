import React, { useState, useRef, useEffect, useCallback, useId } from 'react';
import { removeBackground } from '@imgly/background-removal';
import { floodFill } from '../utils/floodFill';
import { smoothAlphaEdges } from '../utils/alphaSmooth';
import { erodeMask } from '../utils/erodeMask';
import { smartObjectClip } from '../utils/smartObjectClip';

interface BackgroundRemoverProps {
  imageUrl: string;
  originalFileName: string;
}

type ToolMode = 'wand' | 'pen' | 'erase' | 'restore';

export const BackgroundRemover: React.FC<BackgroundRemoverProps> = ({ imageUrl, originalFileName }) => {
  const brushSliderId = useId();

  // Automatic segmentation state
  const [isAiProcessing, setIsAiProcessing] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [progressLabel, setProgressLabel] = useState<string>('');
  const [aiCompleted, setAiCompleted] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Manual tools state
  const [activeTool, setActiveTool] = useState<ToolMode>('wand');
  const [brushSize, setBrushSize] = useState<number>(25);

  // Lasso / Pen preview state
  const [lassoSelection, setLassoSelection] = useState<Uint8Array | null>(null);
  const [isLassoPreviewActive, setIsLassoPreviewActive] = useState<boolean>(false);

  // History stack for Undo / Redo
  const [history, setHistory] = useState<Uint8Array[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const originalImageDataRef = useRef<ImageData | null>(null);

  // Active working mask ref for fluid brush strokes
  const maskRef = useRef<Uint8Array | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const penPathRef = useRef<Array<{ x: number; y: number }>>([]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const origData = originalImageDataRef.current;
    const mask = maskRef.current;
    if (!canvas || !origData || !mask) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const outputData = ctx.createImageData(origData.width, origData.height);
    const origPixels = origData.data;
    const outPixels = outputData.data;

    for (let i = 0; i < mask.length; i++) {
      const pxIdx = i * 4;
      outPixels[pxIdx] = origPixels[pxIdx];
      outPixels[pxIdx + 1] = origPixels[pxIdx + 1];
      outPixels[pxIdx + 2] = origPixels[pxIdx + 2];
      outPixels[pxIdx + 3] = mask[i];
    }

    ctx.putImageData(outputData, 0, 0);
  }, []);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = canvasRef.current;
      const overlay = overlayCanvasRef.current;
      if (!canvas || !overlay) return;

      canvas.width = img.width;
      canvas.height = img.height;
      overlay.width = img.width;
      overlay.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, img.width, img.height);
      originalImageDataRef.current = imgData;

      const initialMask = new Uint8Array(img.width * img.height);
      initialMask.fill(255);

      maskRef.current = new Uint8Array(initialMask);
      setHistory([initialMask]);
      setHistoryIndex(0);
      setAiCompleted(false);
      setAiError(null);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  useEffect(() => {
    if (historyIndex >= 0 && history[historyIndex]) {
      maskRef.current = new Uint8Array(history[historyIndex]);
      drawCanvas();
    }
  }, [historyIndex, history, drawCanvas]);

  const pushToHistory = (newMask: Uint8Array) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(new Uint8Array(newMask));
    if (newHistory.length > 25) {
      newHistory.shift();
    }
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleAutoSegmentation = async () => {
    setIsAiProcessing(true);
    setAiError(null);
    setProgressPercent(0);
    setProgressLabel('Initializing segmentation model...');

    try {
      const resultBlob = await removeBackground(imageUrl, {
        model: 'isnet',
        output: {
          format: 'image/png',
          quality: 1.0,
        },
        progress: (key: string, current: number, total: number) => {
          if (total > 0) {
            const pct = Math.min(100, Math.max(0, Math.round((current / total) * 100)));
            setProgressPercent(pct);
            const assetName = key.split('/').pop() || 'model weights';
            setProgressLabel(`Loading ${assetName}: ${pct}%`);
          } else {
            setProgressLabel('Segmenting foreground subject...');
          }
        },
      });

      setProgressLabel('Extracting alpha mask...');
      setProgressPercent(100);

      const resultUrl = URL.createObjectURL(resultBlob);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        URL.revokeObjectURL(resultUrl);
        const origData = originalImageDataRef.current;
        if (!origData) {
          setIsAiProcessing(false);
          return;
        }

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = origData.width;
        tempCanvas.height = origData.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) {
          setIsAiProcessing(false);
          return;
        }

        tempCtx.drawImage(img, 0, 0, origData.width, origData.height);
        const aiData = tempCtx.getImageData(0, 0, origData.width, origData.height);
        const aiPixels = aiData.data;

        const newMask = new Uint8Array(origData.width * origData.height);
        for (let i = 0; i < newMask.length; i++) {
          newMask[i] = aiPixels[i * 4 + 3];
        }

        maskRef.current = newMask;
        pushToHistory(newMask);
        drawCanvas();
        setIsAiProcessing(false);
        setAiCompleted(true);
      };

      img.onerror = () => {
        URL.revokeObjectURL(resultUrl);
        setIsAiProcessing(false);
        setAiError('Failed to decode segmentation output.');
      };

      img.src = resultUrl;
    } catch (err: unknown) {
      console.error('Segmentation error:', err);
      setIsAiProcessing(false);
      setAiError(
        err instanceof Error
          ? err.message
          : 'Background segmentation encountered an issue. Please try again or use the manual tools below.'
      );
    }
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, scale: 1 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: Math.floor((e.clientX - rect.left) * scaleX),
      y: Math.floor((e.clientY - rect.top) * scaleY),
      scale: scaleX,
    };
  };

  const paintCircle = (cx: number, cy: number, radius: number, targetAlpha: number) => {
    const canvas = canvasRef.current;
    const mask = maskRef.current;
    if (!canvas || !mask) return;

    const width = canvas.width;
    const height = canvas.height;

    const minY = Math.max(0, Math.floor(cy - radius));
    const maxY = Math.min(height - 1, Math.ceil(cy + radius));
    const minX = Math.max(0, Math.floor(cx - radius));
    const maxX = Math.min(width - 1, Math.ceil(cx + radius));

    const r2 = radius * radius;

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy <= r2) {
          mask[y * width + x] = targetAlpha;
        }
      }
    }
  };

  const paintLine = (x0: number, y0: number, x1: number, y1: number, radius: number, targetAlpha: number) => {
    const dist = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.max(1, Math.ceil(dist / (radius * 0.5)));

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = x0 + (x1 - x0) * t;
      const y = y0 + (y1 - y0) * t;
      paintCircle(x, y, radius, targetAlpha);
    }
  };

  const drawOverlay = (mouseX?: number, mouseY?: number, scale: number = 1) => {
    const overlay = overlayCanvasRef.current;
    if (!overlay) return;

    const ctx = overlay.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, overlay.width, overlay.height);

    if (isLassoPreviewActive && lassoSelection) {
      const previewImgData = ctx.createImageData(overlay.width, overlay.height);
      const px = previewImgData.data;

      for (let i = 0; i < lassoSelection.length; i++) {
        if (lassoSelection[i] > 0) {
          const idx = i * 4;
          px[idx] = 239;
          px[idx + 1] = 68;
          px[idx + 2] = 68;
          px[idx + 3] = 160;
        }
      }

      ctx.putImageData(previewImgData, 0, 0);
    }

    if (activeTool === 'pen' && penPathRef.current.length > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(penPathRef.current[0].x, penPathRef.current[0].y);

      for (let i = 1; i < penPathRef.current.length; i++) {
        ctx.lineTo(penPathRef.current[i].x, penPathRef.current[i].y);
      }

      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = Math.max(2, scale * 1.5);
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.restore();
    }

    if (mouseX !== undefined && mouseY !== undefined) {
      const radius = Math.max(2, (brushSize * scale) / 2);

      ctx.save();
      ctx.beginPath();

      if (activeTool === 'erase') {
        ctx.arc(mouseX, mouseY, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(2, scale * 1.5);
        ctx.setLineDash([6, 4]);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(mouseX, mouseY, radius + 1, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.lineWidth = Math.max(1, scale);
        ctx.setLineDash([]);
        ctx.stroke();
      } else if (activeTool === 'restore') {
        ctx.arc(mouseX, mouseY, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = '#16a34a';
        ctx.lineWidth = Math.max(2, scale * 1.5);
        ctx.stroke();
      } else if (activeTool === 'pen') {
        ctx.arc(mouseX, mouseY, Math.max(4, scale * 3), 0, 2 * Math.PI);
        ctx.strokeStyle = '#2563eb';
        ctx.fillStyle = 'rgba(37, 99, 235, 0.4)';
        ctx.lineWidth = Math.max(2, scale);
        ctx.fill();
        ctx.stroke();
      } else if (activeTool === 'wand') {
        const arm = Math.max(8, scale * 6);
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = Math.max(2, scale);
        ctx.beginPath();
        ctx.moveTo(mouseX - arm, mouseY);
        ctx.lineTo(mouseX + arm, mouseY);
        ctx.moveTo(mouseX, mouseY - arm);
        ctx.lineTo(mouseX, mouseY + arm);
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(mouseX, mouseY, Math.max(2, scale), 0, 2 * Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      ctx.restore();
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y, scale } = getCanvasCoords(e);
    const origData = originalImageDataRef.current;
    const mask = maskRef.current;
    if (!origData || !mask) return;

    if (activeTool === 'wand') {
      const newMask = floodFill(origData, mask, x, y);
      maskRef.current = newMask;
      pushToHistory(newMask);
      drawCanvas();
    } else if (activeTool === 'pen') {
      isDrawingRef.current = true;
      penPathRef.current = [{ x, y }];
      setIsLassoPreviewActive(false);
      setLassoSelection(null);
      drawOverlay(x, y, scale);
    } else {
      isDrawingRef.current = true;
      lastPosRef.current = { x, y };

      const radius = Math.max(2, (brushSize * scale) / 2);
      const targetAlpha = activeTool === 'erase' ? 0 : 255;

      paintCircle(x, y, radius, targetAlpha);
      drawCanvas();
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y, scale } = getCanvasCoords(e);
    drawOverlay(x, y, scale);

    if (!isDrawingRef.current || activeTool === 'wand') return;

    if (activeTool === 'pen') {
      penPathRef.current.push({ x, y });
      drawOverlay(x, y, scale);
      return;
    }

    const radius = Math.max(2, (brushSize * scale) / 2);
    const targetAlpha = activeTool === 'erase' ? 0 : 255;

    if (lastPosRef.current) {
      paintLine(lastPosRef.current.x, lastPosRef.current.y, x, y, radius, targetAlpha);
    } else {
      paintCircle(x, y, radius, targetAlpha);
    }

    lastPosRef.current = { x, y };
    drawCanvas();
  };

  const handleMouseUp = () => {
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      lastPosRef.current = null;

      if (activeTool === 'pen') {
        const canvas = canvasRef.current;
        const origData = originalImageDataRef.current;
        const mask = maskRef.current;
        if (canvas && origData && mask && penPathRef.current.length >= 3) {
          const selection = smartObjectClip(origData, penPathRef.current, mask);
          setLassoSelection(selection);
          setIsLassoPreviewActive(true);
          drawOverlay();
        }
      } else if (maskRef.current) {
        pushToHistory(maskRef.current);
      }
    }
  };

  const handleConfirmLassoDelete = () => {
    if (!lassoSelection || !maskRef.current) return;

    const newMask = new Uint8Array(maskRef.current);
    for (let i = 0; i < lassoSelection.length; i++) {
      if (lassoSelection[i] > 0) {
        newMask[i] = 0;
      }
    }

    maskRef.current = newMask;
    pushToHistory(newMask);
    setIsLassoPreviewActive(false);
    setLassoSelection(null);
    penPathRef.current = [];
    drawCanvas();
    drawOverlay();
  };

  const handleCancelLassoDelete = () => {
    setIsLassoPreviewActive(false);
    setLassoSelection(null);
    penPathRef.current = [];
    drawOverlay();
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
    }
  };

  const handleReset = () => {
    if (history.length > 0 && originalImageDataRef.current) {
      const resetMask = new Uint8Array(originalImageDataRef.current.width * originalImageDataRef.current.height);
      resetMask.fill(255);
      maskRef.current = resetMask;
      pushToHistory(resetMask);
      setIsLassoPreviewActive(false);
      setLassoSelection(null);
      penPathRef.current = [];
      setAiCompleted(false);
      setAiError(null);
      drawCanvas();
      drawOverlay();
    }
  };

  const handleTrimHalo = (pixels: number = 1) => {
    const origData = originalImageDataRef.current;
    if (!maskRef.current || !origData) return;

    const trimmed = erodeMask(maskRef.current, origData.width, origData.height, pixels);
    maskRef.current = trimmed;
    pushToHistory(trimmed);
    drawCanvas();
  };

  const handleSmoothEdges = () => {
    const origData = originalImageDataRef.current;
    if (!maskRef.current || !origData) return;

    const smoothed = smoothAlphaEdges(maskRef.current, origData.width, origData.height);
    maskRef.current = smoothed;
    pushToHistory(smoothed);
    drawCanvas();
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const lastDot = originalFileName.lastIndexOf('.');
    const baseName = lastDot > 0 ? originalFileName.substring(0, lastDot) : originalFileName;
    const downloadName = `${baseName}-no-bg.png`;

    const link = document.createElement('a');
    link.download = downloadName;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="bg-remover-container">
      {/* Automatic Segmentation Section */}
      <div className="auto-segmentation-card">
        <div className="auto-segmentation-header">
          <div className="auto-segmentation-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span>Automatic Segmentation</span>
          </div>
          <span className="auto-segmentation-tag">Client-Side AI</span>
        </div>

        <p className="auto-segmentation-desc">
          Automatically extract subjects, portraits, products, and complex objects with sub-pixel edge masking.
        </p>

        {isAiProcessing ? (
          <div className="segmentation-progress-card">
            <div className="progress-header-row">
              <div className="progress-title-with-spinner">
                <div className="spinner" />
                <span className="progress-title-text">{progressLabel || 'Processing image...'}</span>
              </div>
              <span className="progress-pct-badge">{progressPercent}%</span>
            </div>
            <div className="progress-bar-track">
              <div className="progress-bar-indicator" style={{ width: `${Math.max(5, progressPercent)}%` }} />
            </div>
            <span className="progress-footnote">Processing locally via WebAssembly / WebGPU</span>
          </div>
        ) : (
          <button
            type="button"
            className="btn-auto-segment"
            onClick={handleAutoSegmentation}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
              <path d="M2 12h20" />
            </svg>
            <span>{aiCompleted ? 'Re-run Automatic Segmentation' : 'Run Automatic Background Removal'}</span>
          </button>
        )}

        {aiCompleted && !isAiProcessing && (
          <div className="segmentation-success-notice">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>Segmentation applied. You can download directly or use the refinement tools below.</span>
          </div>
        )}

        {aiError && !isAiProcessing && (
          <div className="alert alert-danger" style={{ marginTop: '4px' }}>
            {aiError}
          </div>
        )}
      </div>

      {/* Manual Refinement Tools Divider */}
      <div className="section-divider">
        <span>Surgical Refinement Tools</span>
      </div>

      {/* Tool Selection Bar */}
      <div className="tool-selector-bar">
        <button
          type="button"
          className={`tool-btn ${activeTool === 'wand' ? 'active' : ''}`}
          onClick={() => {
            setActiveTool('wand');
            setIsLassoPreviewActive(false);
          }}
          title="Magic Wand: Click any color region to remove connected pixels"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m19 11-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2c.8.8 2 .8 2.8 0L19 11Z" />
            <path d="m5 2 5 5" />
            <path d="M2 5l5 5" />
          </svg>
          <span>Magic Wand</span>
        </button>

        <button
          type="button"
          className={`tool-btn ${activeTool === 'pen' ? 'active' : ''}`}
          onClick={() => {
            setActiveTool('pen');
            setIsLassoPreviewActive(false);
          }}
          title="Pen Lasso: Encircle any area to clip and delete"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19l7-7 3 3-7 7-3-3z" />
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
            <path d="M2 2l7.586 7.586" />
            <circle cx="11" cy="11" r="2" />
          </svg>
          <span>Pen Lasso</span>
        </button>

        <button
          type="button"
          className={`tool-btn ${activeTool === 'erase' ? 'active' : ''}`}
          onClick={() => {
            setActiveTool('erase');
            setIsLassoPreviewActive(false);
          }}
          title="Eraser Brush: Paint to remove pixels manually"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
            <path d="M22 21H7" />
            <path d="m5 11 9 9" />
          </svg>
          <span>Eraser</span>
        </button>

        <button
          type="button"
          className={`tool-btn ${activeTool === 'restore' ? 'active' : ''}`}
          onClick={() => {
            setActiveTool('restore');
            setIsLassoPreviewActive(false);
          }}
          title="Restore Brush: Paint back removed pixels"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 16h5v5" />
          </svg>
          <span>Restore</span>
        </button>
      </div>

      {/* Brush Size Slider */}
      {(activeTool === 'erase' || activeTool === 'restore') && (
        <div className="form-group" style={{ marginTop: '2px' }}>
          <label htmlFor={brushSliderId}>Brush Diameter: {brushSize}px</label>
          <input
            id={brushSliderId}
            type="range"
            min="5"
            max="120"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="form-control"
          />
        </div>
      )}

      {/* Pen Lasso Delete Confirmation */}
      {isLassoPreviewActive && (
        <div className="alert alert-warning" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
          <span>Area selected. Confirm deletion of enclosed region?</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              className="btn-download"
              style={{ backgroundColor: '#dc2626', padding: '5px 10px', fontSize: '0.8rem' }}
              onClick={handleConfirmLassoDelete}
            >
              Delete Selection
            </button>
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: '5px 10px', fontSize: '0.8rem' }}
              onClick={handleCancelLassoDelete}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Canvas Workspace */}
      <div className="bg-canvas-workspace">
        <canvas ref={canvasRef} />
        <canvas
          ref={overlayCanvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => drawOverlay()}
          style={{ cursor: activeTool === 'pen' ? 'crosshair' : 'none' }}
        />
      </div>

      {/* Action Toolbar */}
      <div className="action-row">
        <div className="btn-group">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            title="Undo"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
            <span>Undo</span>
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            title="Redo"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            <span>Redo</span>
          </button>
          <button type="button" className="btn-secondary" onClick={() => handleTrimHalo(1)} title="Contract edges by 1px to remove boundary fringing">
            <span>Contract Edge (1px)</span>
          </button>
          <button type="button" className="btn-secondary" onClick={() => handleTrimHalo(2)} title="Contract edges by 2px">
            <span>Contract Edge (2px)</span>
          </button>
          <button type="button" className="btn-secondary" onClick={handleSmoothEdges} title="Feather and smooth alpha edges">
            <span>Feather Edges</span>
          </button>
          <button type="button" className="btn-secondary" onClick={handleReset} title="Reset mask to original image">
            <span>Reset All</span>
          </button>
        </div>

        <button type="button" className="btn-download" onClick={handleDownload}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>Download Transparent Cutout (PNG)</span>
        </button>
      </div>
    </div>
  );
};
