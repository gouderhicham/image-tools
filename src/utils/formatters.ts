import type { OutputFormat } from '../types/compressor';

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
 * Generates an appropriate output filename based on format
 */
export function getCompressedFileName(originalName: string | undefined, outputFormat: OutputFormat): string {
  const extension = outputFormat === 'image/webp' ? '.webp' : '.jpg';
  if (!originalName) return `compressed-image${extension}`;

  const lastDot = originalName.lastIndexOf('.');
  const baseName = lastDot > 0 ? originalName.substring(0, lastDot) : originalName;
  return `${baseName}-compressed${extension}`;
}
