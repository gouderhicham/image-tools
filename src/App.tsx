import { useState, useEffect, useCallback } from 'react';
import imageCompression, { type Options } from 'browser-image-compression';

import type { CompressedResult, ImageDimensions, OutputFormat } from './types/compressor';
import { formatFileSize } from './utils/formatters';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { SelectedFileCard } from './components/SelectedFileCard';
import { CompressionControls } from './components/CompressionControls';
import { CompressionResults } from './components/CompressionResults';
import { ImageCropper } from './components/ImageCropper';
import { BackgroundRemover } from './components/BackgroundRemover';
import { ImageConverter } from './components/ImageConverter';
import { isHeicFile, decodeHeicFile } from './utils/heicDecoder';

export function App() {
  const [activeTab, setActiveTab] = useState<'compress' | 'crop' | 'convert' | 'remove-bg'>('compress');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string>('');
  const [originalSizeKB, setOriginalSizeKB] = useState<number>(0);
  const [imageDimensions, setImageDimensions] = useState<ImageDimensions | null>(null);
  const [isDecodingHeic, setIsDecodingHeic] = useState<boolean>(false);

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

  const handleFileSelect = useCallback(async (file: File) => {
    const isImage =
      file.type.startsWith('image/') ||
      /\.(svg|avif|jfif|jpg|jpeg|png|webp|gif|bmp|ico|tiff|tif|heic|heif)$/i.test(file.name);

    if (!isImage) {
      setErrorMessage('Please select a valid image file (SVG, AVIF, JFIF, JPEG, PNG, WebP, BMP, ICO, TIFF, GIF, HEIC)');
      return;
    }

    setErrorMessage(null);
    setWarningMessage(null);
    setCompressedResult(null);

    let processedFile = file;

    // Handle Apple HEIC/HEIF decoding
    if (isHeicFile(file)) {
      setIsDecodingHeic(true);
      try {
        processedFile = await decodeHeicFile(file);
      } catch (err) {
        console.error('HEIC decoding failed:', err);
        setErrorMessage('Failed to decode HEIC image. Please try uploading a JPG, PNG, or WebP.');
        setIsDecodingHeic(false);
        return;
      } finally {
        setIsDecodingHeic(false);
      }
    }

    if (originalUrl) {
      URL.revokeObjectURL(originalUrl);
    }

    const url = URL.createObjectURL(processedFile);
    const sizeKB = processedFile.size / 1024;

    setSelectedFile(processedFile);
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
  }, [originalUrl]);

  // Global clipboard paste listener (Ctrl+V / Cmd+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            handleFileSelect(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handleFileSelect]);

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
        alwaysKeepResolution: true,
        initialQuality: 0.95,
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
    <div className="app-shell">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasFile={!!selectedFile}
        onReset={handleReset}
      />

      <main className="main-content">
        <Header activeTab={activeTab} />

        <div className="editor-card">
          {isDecodingHeic ? (
            <div className="loading-state" style={{ padding: '40px 20px', textAlign: 'center' }}>
              <span className="spinner" style={{ width: '28px', height: '28px', margin: '0 auto 12px' }} />
              <p style={{ fontWeight: 600, color: 'var(--text-main)' }}>Decoding Apple HEIC image...</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Converting to high-fidelity format in browser worker</p>
            </div>
          ) : !selectedFile ? (
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

              {activeTab === 'convert' && (
                <ImageConverter
                  originalFile={selectedFile}
                  imageUrl={originalUrl}
                  originalFileName={selectedFile.name}
                  originalDimensions={imageDimensions}
                />
              )}

              {activeTab === 'remove-bg' && (
                <BackgroundRemover imageUrl={originalUrl} originalFileName={selectedFile.name} />
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default App;
