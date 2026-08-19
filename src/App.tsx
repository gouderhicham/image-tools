import { useState, useEffect } from 'react';
import imageCompression, { type Options } from 'browser-image-compression';

import type { CompressedResult, ImageDimensions, OutputFormat } from './types/compressor';
import { formatFileSize } from './utils/formatters';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { SelectedFileCard } from './components/SelectedFileCard';
import { CompressionControls } from './components/CompressionControls';
import { CompressionResults } from './components/CompressionResults';
import { ImageCropper } from './components/ImageCropper';
import { BackgroundRemover } from './components/BackgroundRemover';

export function App() {
  const [activeTab, setActiveTab] = useState<'compress' | 'crop' | 'remove-bg'>('compress');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string>('');
  const [originalSizeKB, setOriginalSizeKB] = useState<number>(0);
  const [imageDimensions, setImageDimensions] = useState<ImageDimensions | null>(null);

  // Compression options
  const [targetKB, setTargetKB] = useState<string>('100');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('image/webp');

  // Execution state
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [compressedResult, setCompressedResult] = useState<CompressedResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Memory management: clean up object URLs
  useEffect(() => {
    return () => {
      if (originalUrl) URL.revokeObjectURL(originalUrl);
      if (compressedResult?.url) URL.revokeObjectURL(compressedResult.url);
    };
  }, [originalUrl, compressedResult?.url]);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPEG, PNG, WebP, GIF, etc.)');
      return;
    }

    setErrorMessage(null);
    setWarningMessage(null);
    setCompressedResult(null);

    if (originalUrl) {
      URL.revokeObjectURL(originalUrl);
    }

    const url = URL.createObjectURL(file);
    const sizeKB = file.size / 1024;

    setSelectedFile(file);
    setOriginalUrl(url);
    setOriginalSizeKB(sizeKB);

    // Suggest target size: 50% of original, minimum 30KB
    const suggestedTarget = Math.max(30, Math.round(sizeKB * 0.5));
    setTargetKB(suggestedTarget.toString());

    // Load original image dimensions
    const img = new Image();
    img.onload = () => {
      setImageDimensions({ width: img.width, height: img.height });
    };
    img.src = url;
  };

  const handleCompress = async () => {
    if (!selectedFile) return;

    const targetSizeKBNum = parseFloat(targetKB);
    if (isNaN(targetSizeKBNum) || targetSizeKBNum <= 0) {
      setErrorMessage('Please enter a valid target size greater than 0 KB');
      return;
    }

    setIsCompressing(true);
    setErrorMessage(null);
    setWarningMessage(null);

    try {
      const options: Options = {
        maxSizeMB: targetSizeKBNum / 1024,
        useWebWorker: true,
        fileType: outputFormat,
        // Always keep original width & height
        alwaysKeepResolution: true,
        // Start from near-max quality (0.95) and binary-search down only as needed
        initialQuality: 0.95,
        // More iterations = finer quality steps = less over-compression
        maxIteration: 20,
      };

      const compressedFile = await imageCompression(selectedFile, options);
      const resultSizeKB = compressedFile.size / 1024;

      if (compressedResult?.url) {
        URL.revokeObjectURL(compressedResult.url);
      }

      const resultUrl = URL.createObjectURL(compressedFile);

      setCompressedResult({
        file: compressedFile,
        url: resultUrl,
        sizeKB: resultSizeKB,
      });

      if (resultSizeKB > targetSizeKBNum * 1.15) {
        setWarningMessage(
          `Could not reach target ${targetSizeKBNum} KB without excessive quality reduction. Reached ${formatFileSize(resultSizeKB)}.`
        );
      }
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Compression failed. Please try a different target size or image.';
      setErrorMessage(msg);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    setOriginalUrl('');
    setOriginalSizeKB(0);
    setImageDimensions(null);
    if (compressedResult?.url) URL.revokeObjectURL(compressedResult.url);
    setCompressedResult(null);
    setErrorMessage(null);
    setWarningMessage(null);
  };

  return (
    <div className="container">
      <Header activeTab={activeTab} />

      {/* Tab Switcher */}
      <div className="tab-bar">
        <button
          type="button"
          className={`tab-button ${activeTab === 'compress' ? 'active' : ''}`}
          onClick={() => setActiveTab('compress')}
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
          Compress Size
        </button>

        <button
          type="button"
          className={`tab-button ${activeTab === 'crop' ? 'active' : ''}`}
          onClick={() => setActiveTab('crop')}
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Crop Image
        </button>

        <button
          type="button"
          className={`tab-button ${activeTab === 'remove-bg' ? 'active' : ''}`}
          onClick={() => setActiveTab('remove-bg')}
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          Remove BG
        </button>
      </div>

      {!selectedFile ? (
        <DropZone onFileSelect={handleFileSelect} />
      ) : (
        <div>
          <SelectedFileCard
            fileName={selectedFile.name}
            fileSizeKB={originalSizeKB}
            imageUrl={originalUrl}
            dimensions={imageDimensions}
            onReset={handleReset}
          />

          {activeTab === 'compress' && (
            <>
              <CompressionControls
                targetKB={targetKB}
                setTargetKB={setTargetKB}
                outputFormat={outputFormat}
                setOutputFormat={setOutputFormat}
                isCompressing={isCompressing}
                onCompress={handleCompress}
                errorMessage={errorMessage}
                warningMessage={warningMessage}
              />

              {compressedResult && (
                <CompressionResults
                  originalSizeKB={originalSizeKB}
                  originalUrl={originalUrl}
                  compressedResult={compressedResult}
                  selectedFileName={selectedFile.name}
                  outputFormat={outputFormat}
                />
              )}
            </>
          )}

          {activeTab === 'crop' && (
            <ImageCropper imageUrl={originalUrl} originalFileName={selectedFile.name} />
          )}

          {activeTab === 'remove-bg' && (
            <BackgroundRemover imageUrl={originalUrl} originalFileName={selectedFile.name} />
          )}
        </div>
      )}
    </div>
  );
}

export default App;
