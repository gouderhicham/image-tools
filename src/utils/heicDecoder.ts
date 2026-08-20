import heic2any from 'heic2any';

/**
 * Checks if a file is an Apple HEIC / HEIF image
 */
export function isHeicFile(file: File): boolean {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return (
    name.endsWith('.heic') ||
    name.endsWith('.heif') ||
    type === 'image/heic' ||
    type === 'image/heif' ||
    type === 'image/heic-sequence' ||
    type === 'image/heif-sequence'
  );
}

/**
 * Decodes a HEIC / HEIF image into a standard JPEG File object
 */
export async function decodeHeicFile(file: File): Promise<File> {
  const result = await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: 1.0,
  });

  const singleBlob = Array.isArray(result) ? result[0] : result;
  const newName = file.name.replace(/\.(heic|heif)$/i, '.jpg') || `${file.name}.jpg`;

  return new File([singleBlob], newName, { type: 'image/jpeg' });
}
