export type OutputFormat = 'image/webp' | 'image/jpeg';

export interface CompressedResult {
  file: File;
  url: string;
  sizeKB: number;
}

export interface ImageDimensions {
  width: number;
  height: number;
}
