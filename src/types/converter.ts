export type ConvertFormatId =
  | 'png'
  | 'jpeg'
  | 'jfif'
  | 'webp'
  | 'avif'
  | 'svg'
  | 'ico'
  | 'bmp'
  | 'gif'
  | 'tiff'
  | 'pdf';

export type FormatCategory = 'web' | 'vector_icon' | 'document_bitmap';

export type IcoResolution = 16 | 32 | 48 | 64 | 128 | 256 | 'multi';

export type PdfPageSize = 'fit' | 'a4' | 'letter';
export type PdfOrientation = 'auto' | 'portrait' | 'landscape';

export interface FormatMetadata {
  id: ConvertFormatId;
  name: string;
  extension: string;
  mimeType: string;
  category: FormatCategory;
  description: string;
  badge: string;
  supportsTransparency: boolean;
  supportsResize: boolean;
  supportsIcoSizes?: boolean;
  supportsPdfLayout?: boolean;
}

export interface ConversionOptions {
  targetFormat: ConvertFormatId;
  quality?: number; // Defaults to 1.0 (100% max quality)
  backgroundColor: string; // 'transparent' | '#ffffff' | '#000000' | custom hex
  scaleMode: 'original' | 'preset' | 'custom';
  scalePercentage: number; // e.g. 25, 50, 75, 100, 150, 200
  customWidth: number;
  customHeight: number;
  maintainAspectRatio: boolean;
  icoSize: IcoResolution;
  pdfPageSize: PdfPageSize;
  pdfOrientation: PdfOrientation;
}

export interface ConversionResult {
  blob: Blob;
  url: string;
  fileName: string;
  sizeKB: number;
  originalSizeKB: number;
  width: number;
  height: number;
  format: ConvertFormatId;
  mimeType: string;
  durationMs: number;
}
