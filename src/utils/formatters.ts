import type { OutputFormat } from '../types/compressor';
import type { ConvertFormatId } from '../types/converter';

/**
 * Formats file size in KB or MB
 */
export function formatFileSize(kb: number): string {
  if (kb >= 1024) {
    return `${(kb / 1024).toFixed(2)} MB`;
  }
  return `${kb.toFixed(1)} KB`;
}

/**
 * Generates an appropriate output filename based on format for compression
 */
export function getCompressedFileName(originalName: string | undefined, outputFormat: OutputFormat): string {
  const extension = outputFormat === 'image/webp' ? '.webp' : '.jpg';
  if (!originalName) return `compressed-image${extension}`;

  const lastDot = originalName.lastIndexOf('.');
  const baseName = lastDot > 0 ? originalName.substring(0, lastDot) : originalName;
  return `${baseName}-compressed${extension}`;
}

/**
 * Generates an appropriate output filename for image conversions
 */
export function getConvertedFileName(originalName: string | undefined, targetFormat: ConvertFormatId): string {
  const extMap: Record<ConvertFormatId, string> = {
    webp: '.webp',
    png: '.png',
    jpeg: '.jpg',
    jfif: '.jfif',
    avif: '.avif',
    svg: '.svg',
    ico: '.ico',
    gif: '.gif',
    bmp: '.bmp',
    tiff: '.tiff',
    pdf: '.pdf',
  };

  const extension = extMap[targetFormat] || `.${targetFormat}`;
  if (!originalName) return `converted-image${extension}`;

  const lastDot = originalName.lastIndexOf('.');
  const baseName = lastDot > 0 ? originalName.substring(0, lastDot) : originalName;
  return `${baseName}-converted${extension}`;
}

