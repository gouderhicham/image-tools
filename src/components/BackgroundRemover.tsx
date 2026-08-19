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

  // AI Auto-remove state
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

  // Draw base canvas mask
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

  // Initialize canvas & mask on image load
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
      initialMask.fill(255); // fully opaque

      maskRef.current = new Uint8Array(initialMask);
      setHistory([initialMask]);
      setHistoryIndex(0);
      setAiCompleted(false);
      setAiError(null);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Keep maskRef in sync when user performs Undo / Redo
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

  // Automated 1-Click AI Background Removal
  const handleAiAutoRemove = async () => {
    setIsAiProcessing(true);
    setAiError(null);
    setProgressPercent(0);
    setProgressLabel('Initializing neural segmentation engine...');

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
            const assetName = key.split('/').pop() || 'neural assets';
            setProgressLabel(`Downloading ${assetName}: ${pct}%`);
          } else {
            setProgressLabel('Analyzing and segmenting foreground object...');
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

        // Extract alpha channel mask
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
        setAiError('Failed to decode AI output image. Please try again.');
      };

      img.src = resultUrl;
    } catch (err: unknown) {
      console.error('AI background removal error:', err);
      setIsAiProcessing(false);
      setAiError(
        err instanceof Error
          ? err.message
          : 'AI background removal encountered an issue. Please try again or use the manual tools below.'
      );
    }
  };

  // Convert mouse coordinates to canvas pixel space
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

  // Paint circle into mask for Eraser / Restore
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

  // Render brush cursor & Pen Lasso preview overlay
  const drawOverlay = (mouseX?: number, mouseY?: number, scale: number = 1) => {
    const overlay = overlayCanvasRef.current;
    if (!overlay) return;

    const ctx = overlay.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, overlay.width, overlay.height);

    // Render Pen Lasso red preview highlight if active
    if (isLassoPreviewActive && lassoSelection) {
      const previewImgData = ctx.createImageData(overlay.width, overlay.height);
      const px = previewImgData.data;

      for (let i = 0; i < lassoSelection.length; i++) {
        if (lassoSelection[i] > 0) {
          const idx = i * 4;
          px[idx] = 239;     // R
          px[idx + 1] = 68;  // G
          px[idx + 2] = 68;  // B
          px[idx + 3] = 160; // Alpha
        }
      }

      ctx.putImageData(previewImgData, 0, 0);
    }

    // Render active drawing Pen Path line
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

    // Render visible brush / cursor outline
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
        ctx.strokeStyle = '#22c55e';
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
        ctx.strokeStyle = '#3b82f6';
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
      {/* 1-Click AI Auto Background Removal Hero Banner */}
      <div className="ai-hero-card">
        <div className="ai-hero-header">
          <div className="ai-hero-badge">
            <span className="sparkle-icon">✨</span>
            <span>AI Neural Auto-Remove</span>
          </div>
          <span className="ai-tag">High Accuracy (ISNet)</span>
        </div>

        <p className="ai-hero-desc">
          Automatically detect and cutout subjects, portraits, products, and objects with sub-pixel edge precision without manual editing.
        </p>

        {isAiProcessing ? (
          <div className="ai-progress-card">
            <div className="ai-progress-header">
              <div className="ai-spinner-row">
                <div className="spinner ai-spin" />
                <span className="ai-progress-title">{progressLabel || 'Processing image...'}</span>
              </div>
              <span className="ai-progress-pct">{progressPercent}%</span>
            </div>
            <div className="ai-progress-bar-bg">
              <div className="ai-progress-bar-fill" style={{ width: `${Math.max(5, progressPercent)}%` }} />
            </div>
            <span className="ai-progress-hint">Runs 100% privately in your browser using WebGPU/WebAssembly</span>
          </div>
        ) : (
          <div className="ai-action-row">
            <button
              type="button"
              className="btn-ai-hero"
              onClick={handleAiAutoRemove}
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {aiCompleted ? '⚡ Re-run 1-Click AI Auto Remove' : '⚡ 1-Click AI Auto Remove Background'}
            </button>
          </div>
        )}

        {aiCompleted && !isAiProcessing && (
          <div className="ai-success-banner">
            <span>🎉 <strong>AI Cutout Applied!</strong> You can download now or use the fine-tuning tools below if you want any custom touch-ups.</span>
          </div>
        )}

        {aiError && !isAiProcessing && (
          <div className="alert alert-danger" style={{ marginTop: '10px' }}>
            {aiError}
          </div>
        )}
      </div>

      {/* Manual Refinement Section Header */}
      <div className="section-divider">
        <span>Optional Manual Fine-Tuning Tools</span>
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
          title="Magic Wand: Click any background area to remove matching color precisely"
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          Magic Wand
        </button>

        <button
          type="button"
          className={`tool-btn ${activeTool === 'pen' ? 'active' : ''}`}
          onClick={() => {
            setActiveTool('pen');
            setIsLassoPreviewActive(false);
          }}
          title="Pen Lasso Clip: Draw a line around/over any object to clip and delete it"
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Pen Lasso Clip
        </button>

        <button
          type="button"
          className={`tool-btn ${activeTool === 'erase' ? 'active' : ''}`}
          onClick={() => {
            setActiveTool('erase');
            setIsLassoPreviewActive(false);
          }}
          title="Eraser Brush: Paint directly over pixels to erase them"
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Eraser Brush
        </button>

        <button
          type="button"
          className={`tool-btn ${activeTool === 'restore' ? 'active' : ''}`}
          onClick={() => {
            setActiveTool('restore');
            setIsLassoPreviewActive(false);
          }}
          title="Restore Brush: Paint back pixels that were erased"
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Restore Brush
        </button>
      </div>

      {/* Brush Size Slider (Only active for Eraser or Restore) */}
      {(activeTool === 'erase' || activeTool === 'restore') && (
        <div className="form-group" style={{ marginTop: '4px' }}>
          <label htmlFor={brushSliderId}>Brush Size: {brushSize}px</label>
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

      {/* Pen Lasso Delete Confirmation Action Banner */}
      {isLassoPreviewActive && (
        <div className="alert alert-warning" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
          <span><strong>Object Auto-Detected!</strong> Red highlight shows detected object. Confirm deletion?</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn-download"
              style={{ backgroundColor: '#dc2626', padding: '6px 12px', fontSize: '0.85rem' }}
              onClick={handleConfirmLassoDelete}
            >
              ✓ Delete Object
            </button>
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.85rem' }}
              onClick={handleCancelLassoDelete}
            >
              ✗ Cancel
            </button>
          </div>
        </div>
      )}

      {/* Canvas Workspace with Stacked Dual Canvases */}
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

      {/* Action Bar */}
      <div className="action-row">
        <div className="btn-group">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            title="Undo last change"
          >
            ↩ Undo
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            title="Redo"
          >
            ↪ Redo
          </button>
          <button type="button" className="btn-secondary" onClick={() => handleTrimHalo(1)} title="Contract edges by 1 pixel to remove stray color fringing">
            ✨ Trim Halo (1px)
          </button>
          <button type="button" className="btn-secondary" onClick={() => handleTrimHalo(2)} title="Contract edges by 2 pixels">
            ✨ Trim Halo (2px)
          </button>
          <button type="button" className="btn-secondary" onClick={handleSmoothEdges} title="Feather and anti-alias cut edges">
            🌿 Smooth Edges
          </button>
          <button type="button" className="btn-secondary" onClick={handleReset} title="Reset to original image">
            ↺ Reset
          </button>
        </div>

        <button type="button" className="btn-download" onClick={handleDownload}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Download Cutout (Transparent PNG)
        </button>
      </div>
    </div>
  );
};
