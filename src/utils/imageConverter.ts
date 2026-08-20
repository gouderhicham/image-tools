import type {
  ConvertFormatId,
  ConversionOptions,
  ConversionResult,
  FormatMetadata,
} from '../types/converter';

export const FORMAT_REGISTRY: Record<ConvertFormatId, FormatMetadata> = {
  webp: {
    id: 'webp',
    name: 'WebP',
    extension: '.webp',
    mimeType: 'image/webp',
    category: 'web',
    description: 'Modern web format with superior lossy & lossless compression and transparency.',
    badge: 'Recommended',
    supportsTransparency: true,
    supportsResize: true,
  },
  png: {
    id: 'png',
    name: 'PNG',
    extension: '.png',
    mimeType: 'image/png',
    category: 'web',
    description: 'Lossless format ideal for graphics, screenshots, and images with transparent backgrounds.',
    badge: 'Lossless',
    supportsTransparency: true,
    supportsResize: true,
  },
  jpeg: {
    id: 'jpeg',
    name: 'JPEG / JPG',
    extension: '.jpg',
    mimeType: 'image/jpeg',
    category: 'web',
    description: 'Universal photo format compatible with every device and web platform.',
    badge: 'Universal',
    supportsTransparency: false,
    supportsResize: true,
  },
  jfif: {
    id: 'jfif',
    name: 'JFIF',
    extension: '.jfif',
    mimeType: 'image/jpeg',
    category: 'web',
    description: 'JPEG File Interchange Format standard for digital image exchange.',
    badge: 'Standard',
    supportsTransparency: false,
    supportsResize: true,
  },
  avif: {
    id: 'avif',
    name: 'AVIF',
    extension: '.avif',
    mimeType: 'image/avif',
    category: 'web',
    description: 'Next-generation AV1 image format offering exceptional compression efficiency.',
    badge: 'Next-Gen',
    supportsTransparency: true,
    supportsResize: true,
  },
  svg: {
    id: 'svg',
    name: 'SVG',
    extension: '.svg',
    mimeType: 'image/svg+xml',
    category: 'vector_icon',
    description: 'Scalable Vector Graphics container preserving resolution at any display size.',
    badge: 'Vector',
    supportsTransparency: true,
    supportsResize: true,
  },
  ico: {
    id: 'ico',
    name: 'ICO',
    extension: '.ico',
    mimeType: 'image/x-icon',
    category: 'vector_icon',
    description: 'Windows icon and website favicon supporting single or multi-resolution bundles.',
    badge: 'Favicon',
    supportsTransparency: true,
    supportsResize: true,
    supportsIcoSizes: true,
  },
  gif: {
    id: 'gif',
    name: 'GIF',
    extension: '.gif',
    mimeType: 'image/gif',
    category: 'document_bitmap',
    description: 'Standard 8-bit palette image format with transparency support.',
    badge: 'Legacy',
    supportsTransparency: true,
    supportsResize: true,
  },
  bmp: {
    id: 'bmp',
    name: 'BMP',
    extension: '.bmp',
    mimeType: 'image/bmp',
    category: 'document_bitmap',
    description: 'Uncompressed standard Windows bitmap format preserving raw pixel data.',
    badge: 'Uncompressed',
    supportsTransparency: true,
    supportsResize: true,
  },
  tiff: {
    id: 'tiff',
    name: 'TIFF',
    extension: '.tiff',
    mimeType: 'image/tiff',
    category: 'document_bitmap',
    description: 'Tagged Image File Format baseline standard for publishing and archival printing.',
    badge: 'Archival',
    supportsTransparency: true,
    supportsResize: true,
  },
  pdf: {
    id: 'pdf',
    name: 'PDF Document',
    extension: '.pdf',
    mimeType: 'application/pdf',
    category: 'document_bitmap',
    description: 'Single-page portable document format formatted for viewing and high-res printing.',
    badge: 'Document',
    supportsTransparency: false,
    supportsResize: true,
    supportsPdfLayout: true,
  },
};

export const DEFAULT_CONVERSION_OPTIONS: ConversionOptions = {
  targetFormat: 'webp',
  quality: 1.0,
  backgroundColor: 'transparent',
  scaleMode: 'original',
  scalePercentage: 100,
  customWidth: 0,
  customHeight: 0,
  maintainAspectRatio: true,
  icoSize: 32,
  pdfPageSize: 'fit',
  pdfOrientation: 'auto',
};

/**
 * Loads an image from a URL or Blob into an HTMLImageElement
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error('Failed to load source image: ' + err));
    img.src = src;
  });
}

/**
 * Checks if browser canvas supports encoding to a specific MIME type
 */
export function isMimeSupported(mime: string): boolean {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const dataUrl = canvas.toDataURL(mime);
    return dataUrl.startsWith(`data:${mime}`);
  } catch {
    return false;
  }
}

/**
 * Encodes canvas image data into a standard 32-bit/24-bit Windows BMP Blob
 */
export function encodeBmp(imageData: ImageData): Blob {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;

  // 32-bit BGRA format (4 bytes per pixel, naturally 4-byte aligned)
  const bytesPerPixel = 4;
  const rowSize = width * bytesPerPixel;
  const pixelDataSize = rowSize * height;
  const headerSize = 54; // 14 (file header) + 40 (DIB header)
  const fileSize = headerSize + pixelDataSize;

  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);

  // BITMAPFILEHEADER (14 bytes)
  view.setUint16(0, 0x4D42, true); // 'BM'
  view.setUint32(2, fileSize, true);
  view.setUint16(6, 0, true); // Reserved1
  view.setUint16(8, 0, true); // Reserved2
  view.setUint32(10, headerSize, true); // Offset to pixel array

  // BITMAPINFOHEADER (40 bytes)
  view.setUint32(14, 40, true); // Header size
  view.setInt32(18, width, true);
  view.setInt32(22, height, true); // Positive = bottom-up
  view.setUint16(26, 1, true); // Color planes
  view.setUint16(28, 32, true); // Bits per pixel (32-bit BGRA)
  view.setUint32(30, 0, true); // Compression: BI_RGB (none)
  view.setUint32(34, pixelDataSize, true);
  view.setInt32(38, 2835, true); // X pixels per meter (72 DPI)
  view.setInt32(42, 2835, true); // Y pixels per meter
  view.setUint32(46, 0, true); // Colors in palette
  view.setUint32(50, 0, true); // Important colors

  // Write pixel data bottom-to-top, BGRA order
  let offset = headerSize;
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const r = data[srcIdx];
      const g = data[srcIdx + 1];
      const b = data[srcIdx + 2];
      const a = data[srcIdx + 3];

      view.setUint8(offset++, b);
      view.setUint8(offset++, g);
      view.setUint8(offset++, r);
      view.setUint8(offset++, a);
    }
  }

  return new Blob([buffer], { type: 'image/bmp' });
}

/**
 * Encodes canvas frames into a standard multi-resolution or single-size Windows ICO Blob
 */
export async function encodeIco(
  sourceCanvas: HTMLCanvasElement,
  icoSize: 16 | 32 | 48 | 64 | 128 | 256 | 'multi'
): Promise<Blob> {
  const sizes =
    icoSize === 'multi' ? [16, 32, 48, 64, 128, 256] : [icoSize];

  // Render each size to PNG blobs
  const pngBlobs: { width: number; height: number; data: Uint8Array }[] = [];

  for (const size of sizes) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = size;
    tempCanvas.height = size;
    const ctx = tempCanvas.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(sourceCanvas, 0, 0, size, size);
      const blob = await new Promise<Blob | null>((res) =>
        tempCanvas.toBlob(res, 'image/png')
      );
      if (blob) {
        const buffer = await blob.arrayBuffer();
        pngBlobs.push({
          width: size,
          height: size,
          data: new Uint8Array(buffer),
        });
      }
    }
  }

  const numImages = pngBlobs.length;
  const headerSize = 6 + numImages * 16;
  let totalDataSize = 0;
  for (const item of pngBlobs) {
    totalDataSize += item.data.byteLength;
  }

  const totalFileSize = headerSize + totalDataSize;
  const buffer = new ArrayBuffer(totalFileSize);
  const view = new DataView(buffer);

  // ICONDIR Header (6 bytes)
  view.setUint16(0, 0, true); // Reserved
  view.setUint16(2, 1, true); // Type: 1 = ICO
  view.setUint16(4, numImages, true); // Number of images

  let currentDataOffset = headerSize;
  let entryOffset = 6;

  // Write ICONDIRENTRY for each image
  for (let i = 0; i < numImages; i++) {
    const img = pngBlobs[i];
    const widthByte = img.width >= 256 ? 0 : img.width;
    const heightByte = img.height >= 256 ? 0 : img.height;

    view.setUint8(entryOffset + 0, widthByte);
    view.setUint8(entryOffset + 1, heightByte);
    view.setUint8(entryOffset + 2, 0); // Color palette count (0 for >=8bpp)
    view.setUint8(entryOffset + 3, 0); // Reserved
    view.setUint16(entryOffset + 4, 1, true); // Color planes
    view.setUint16(entryOffset + 6, 32, true); // Bits per pixel
    view.setUint32(entryOffset + 8, img.data.byteLength, true); // Size of image data
    view.setUint32(entryOffset + 12, currentDataOffset, true); // Offset of image data

    // Copy PNG image data into buffer
    new Uint8Array(buffer, currentDataOffset, img.data.byteLength).set(img.data);

    currentDataOffset += img.data.byteLength;
    entryOffset += 16;
  }

  return new Blob([buffer], { type: 'image/x-icon' });
}

/**
 * Encodes canvas pixels into standard baseline TIFF 6.0 binary blob (Little-Endian)
 */
export function encodeTiff(imageData: ImageData): Blob {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;

  const numTags = 12;
  const ifdOffset = 8;
  const ifdSize = 2 + numTags * 12 + 4; // 2 count + entries + 4 next IFD offset
  const valueDataOffset = ifdOffset + ifdSize;

  // Extra values that do not fit in 4 bytes:
  // BitsPerSample (4 x uint16 = 8 bytes) -> offset 1
  // XResolution (2 x uint32 = 8 bytes) -> offset 2
  // YResolution (2 x uint32 = 8 bytes) -> offset 3
  const bitsPerSampleOffset = valueDataOffset;
  const xResOffset = bitsPerSampleOffset + 8;
  const yResOffset = xResOffset + 8;
  const pixelDataOffset = yResOffset + 8;

  const pixelDataSize = width * height * 4;
  const totalFileSize = pixelDataOffset + pixelDataSize;

  const buffer = new ArrayBuffer(totalFileSize);
  const view = new DataView(buffer);

  // TIFF Header (8 bytes)
  view.setUint16(0, 0x4949, true); // "II" Little-Endian
  view.setUint16(2, 42, true); // Magic 42
  view.setUint32(4, ifdOffset, true); // First IFD Offset

  // IFD: Number of Directory Entries
  view.setUint16(ifdOffset, numTags, true);

  let tagPos = ifdOffset + 2;

  const writeTag = (
    tag: number,
    type: number,
    count: number,
    valueOrOffset: number
  ) => {
    view.setUint16(tagPos, tag, true);
    view.setUint16(tagPos + 2, type, true);
    view.setUint32(tagPos + 4, count, true);
    view.setUint32(tagPos + 8, valueOrOffset, true);
    tagPos += 12;
  };

  // Tags must be sorted by tag ID in TIFF standard:
  // Tag 256: ImageWidth (LONG = 4)
  writeTag(256, 4, 1, width);
  // Tag 257: ImageLength (LONG = 4)
  writeTag(257, 4, 1, height);
  // Tag 258: BitsPerSample (SHORT = 3, count = 4) -> points to bitsPerSampleOffset
  writeTag(258, 3, 4, bitsPerSampleOffset);
  // Tag 259: Compression (SHORT = 3, count = 1, value = 1 (none))
  writeTag(259, 3, 1, 1);
  // Tag 262: PhotometricInterpretation (SHORT = 3, count = 1, value = 2 (RGB))
  writeTag(262, 3, 1, 2);
  // Tag 273: StripOffsets (LONG = 4, count = 1) -> pixelDataOffset
  writeTag(273, 4, 1, pixelDataOffset);
  // Tag 277: SamplesPerPixel (SHORT = 3, count = 1, value = 4 (RGBA))
  writeTag(277, 3, 1, 4);
  // Tag 278: RowsPerStrip (LONG = 4, count = 1, value = height)
  writeTag(278, 4, 1, height);
  // Tag 279: StripByteCounts (LONG = 4, count = 1) -> pixelDataSize
  writeTag(279, 4, 1, pixelDataSize);
  // Tag 282: XResolution (RATIONAL = 5, count = 1) -> xResOffset
  writeTag(282, 5, 1, xResOffset);
  // Tag 283: YResolution (RATIONAL = 5, count = 1) -> yResOffset
  writeTag(283, 5, 1, yResOffset);
  // Tag 296: ResolutionUnit (SHORT = 3, count = 1, value = 2 (inch))
  writeTag(296, 3, 1, 2);

  // Next IFD Offset (0 = none)
  view.setUint32(tagPos, 0, true);

  // Write BitsPerSample: 8, 8, 8, 8
  view.setUint16(bitsPerSampleOffset + 0, 8, true);
  view.setUint16(bitsPerSampleOffset + 2, 8, true);
  view.setUint16(bitsPerSampleOffset + 4, 8, true);
  view.setUint16(bitsPerSampleOffset + 6, 8, true);

  // Write XResolution: 72 / 1
  view.setUint32(xResOffset + 0, 72, true);
  view.setUint32(xResOffset + 4, 1, true);

  // Write YResolution: 72 / 1
  view.setUint32(yResOffset + 0, 72, true);
  view.setUint32(yResOffset + 4, 1, true);

  // Write RGBA pixel data
  new Uint8Array(buffer, pixelDataOffset, pixelDataSize).set(data);

  return new Blob([buffer], { type: 'image/tiff' });
}

/**
 * Builds a clean, portable PDF 1.4 document containing the image
 */
export async function encodePdf(
  sourceCanvas: HTMLCanvasElement,
  options: ConversionOptions
): Promise<Blob> {
  const imgWidth = sourceCanvas.width;
  const imgHeight = sourceCanvas.height;

  // Convert canvas to high-quality JPEG binary data
  const jpegQuality = Math.max(0.9, options.quality ?? 1.0);
  const jpegBlob = await new Promise<Blob | null>((res) =>
    sourceCanvas.toBlob(res, 'image/jpeg', jpegQuality)
  );

  if (!jpegBlob) {
    throw new Error('Failed to encode PDF image stream');
  }

  const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());

  // Determine PDF page dimensions in points (72 points = 1 inch)
  let pageW = imgWidth;
  let pageH = imgHeight;
  let drawX = 0;
  let drawY = 0;
  let drawW = imgWidth;
  let drawH = imgHeight;

  if (options.pdfPageSize === 'a4') {
    // A4: 595.28 x 841.89 points
    const isLandscape =
      options.pdfOrientation === 'landscape' ||
      (options.pdfOrientation === 'auto' && imgWidth > imgHeight);
    pageW = isLandscape ? 841.89 : 595.28;
    pageH = isLandscape ? 595.28 : 841.89;

    // Fit image maintaining aspect ratio with margin
    const margin = 28.35; // 10mm
    const maxW = pageW - margin * 2;
    const maxH = pageH - margin * 2;
    const scale = Math.min(maxW / imgWidth, maxH / imgHeight);
    drawW = imgWidth * scale;
    drawH = imgHeight * scale;
    drawX = (pageW - drawW) / 2;
    drawY = (pageH - drawH) / 2;
  } else if (options.pdfPageSize === 'letter') {
    // US Letter: 612 x 792 points
    const isLandscape =
      options.pdfOrientation === 'landscape' ||
      (options.pdfOrientation === 'auto' && imgWidth > imgHeight);
    pageW = isLandscape ? 792 : 612;
    pageH = isLandscape ? 612 : 792;

    const margin = 36; // 0.5 inch
    const maxW = pageW - margin * 2;
    const maxH = pageH - margin * 2;
    const scale = Math.min(maxW / imgWidth, maxH / imgHeight);
    drawW = imgWidth * scale;
    drawH = imgHeight * scale;
    drawX = (pageW - drawW) / 2;
    drawY = (pageH - drawH) / 2;
  }

  const contentStream = `q\n${drawW.toFixed(2)} 0 0 ${drawH.toFixed(2)} ${drawX.toFixed(2)} ${drawY.toFixed(2)} cm\n/Im1 Do\nQ\n`;
  const contentBytes = new TextEncoder().encode(contentStream);

  const objects: { id: number; data: Uint8Array }[] = [];

  // 1: Catalog
  objects.push({
    id: 1,
    data: new TextEncoder().encode('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n'),
  });

  // 2: Pages
  objects.push({
    id: 2,
    data: new TextEncoder().encode('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n'),
  });

  // 3: Page
  objects.push({
    id: 3,
    data: new TextEncoder().encode(
      `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW.toFixed(2)} ${pageH.toFixed(2)}] /Contents 4 0 R /Resources << /XObject << /Im1 5 0 R >> >> >>\nendobj\n`
    ),
  });

  // 4: Contents Stream
  const contentsHeader = `4 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n`;
  const contentsFooter = '\nendstream\nendobj\n';
  const contentsTotal = new Uint8Array(
    contentsHeader.length + contentBytes.length + contentsFooter.length
  );
  contentsTotal.set(new TextEncoder().encode(contentsHeader), 0);
  contentsTotal.set(contentBytes, contentsHeader.length);
  contentsTotal.set(
    new TextEncoder().encode(contentsFooter),
    contentsHeader.length + contentBytes.length
  );
  objects.push({ id: 4, data: contentsTotal });

  // 5: Image XObject
  const imgHeader = `5 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imgWidth} /Height ${imgHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`;
  const imgFooter = '\nendstream\nendobj\n';
  const imgTotal = new Uint8Array(
    imgHeader.length + jpegBytes.length + imgFooter.length
  );
  imgTotal.set(new TextEncoder().encode(imgHeader), 0);
  imgTotal.set(jpegBytes, imgHeader.length);
  imgTotal.set(
    new TextEncoder().encode(imgFooter),
    imgHeader.length + jpegBytes.length
  );
  objects.push({ id: 5, data: imgTotal });

  // Build full PDF file with xref table
  const pdfHeader = new TextEncoder().encode('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
  const offsets: number[] = [];
  let currentOffset = pdfHeader.length;

  for (const obj of objects) {
    offsets.push(currentOffset);
    currentOffset += obj.data.length;
  }

  const startXref = currentOffset;
  let xrefStr = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    xrefStr += offset.toString().padStart(10, '0') + ' 00000 n \n';
  }
  xrefStr += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;
  const xrefBytes = new TextEncoder().encode(xrefStr);

  const finalPdf = new Uint8Array(currentOffset + xrefBytes.length);
  finalPdf.set(pdfHeader, 0);

  let writePos = pdfHeader.length;
  for (const obj of objects) {
    finalPdf.set(obj.data, writePos);
    writePos += obj.data.length;
  }
  finalPdf.set(xrefBytes, writePos);

  return new Blob([finalPdf], { type: 'application/pdf' });
}

/**
 * Creates a valid Scalable Vector Graphics (SVG) container wrapping the image
 */
export async function encodeSvg(
  sourceCanvas: HTMLCanvasElement,
  originalFile: File,
  targetWidth: number,
  targetHeight: number
): Promise<Blob> {
  // If original file was already an SVG, read its original text
  if (originalFile.type === 'image/svg+xml' || originalFile.name.toLowerCase().endsWith('.svg')) {
    const text = await originalFile.text();
    return new Blob([text], { type: 'image/svg+xml' });
  }

  // Otherwise, wrap the raster image as a lossless PNG base64 inside SVG container
  const pngDataUrl = sourceCanvas.toDataURL('image/png');
  const svgContent = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${targetWidth}" height="${targetHeight}" viewBox="0 0 ${targetWidth} ${targetHeight}">
  <!-- Converted with Image Crop Studio Universal Converter -->
  <image width="${targetWidth}" height="${targetHeight}" xlink:href="${pngDataUrl}" preserveAspectRatio="xMidYMid meet" />
</svg>`;

  return new Blob([svgContent], { type: 'image/svg+xml' });
}

/**
 * Main Conversion Function: Converts an input image file to target format with given options
 */
export async function convertImage(
  file: File,
  options: ConversionOptions
): Promise<ConversionResult> {
  const startTime = performance.now();
  const formatMeta = FORMAT_REGISTRY[options.targetFormat];
  if (!formatMeta) {
    throw new Error(`Unsupported conversion format: ${options.targetFormat}`);
  }

  // 1. Create image element and load source
  const sourceUrl = URL.createObjectURL(file);
  let img: HTMLImageElement;
  try {
    img = await loadImage(sourceUrl);
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }

  const origWidth = img.naturalWidth || img.width;
  const origHeight = img.naturalHeight || img.height;

  // 2. Compute target dimensions
  let targetWidth = origWidth;
  let targetHeight = origHeight;

  if (options.scaleMode === 'preset' && options.scalePercentage > 0) {
    const factor = options.scalePercentage / 100;
    targetWidth = Math.max(1, Math.round(origWidth * factor));
    targetHeight = Math.max(1, Math.round(origHeight * factor));
  } else if (
    options.scaleMode === 'custom' &&
    options.customWidth > 0 &&
    options.customHeight > 0
  ) {
    targetWidth = Math.max(1, Math.round(options.customWidth));
    targetHeight = Math.max(1, Math.round(options.customHeight));
  }

  // 3. Prepare canvas
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Failed to create 2D canvas context');
  }

  // Apply Background Fill if specified or if converting to format without alpha support
  const needsSolidBg =
    !formatMeta.supportsTransparency ||
    (options.backgroundColor && options.backgroundColor !== 'transparent');

  if (needsSolidBg) {
    const fillColor =
      options.backgroundColor && options.backgroundColor !== 'transparent'
        ? options.backgroundColor
        : '#ffffff'; // Default to clean white for JPEG/PDF if transparency is removed
    ctx.fillStyle = fillColor;
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  } else {
    ctx.clearRect(0, 0, targetWidth, targetHeight);
  }

  // Draw source image scaled to target dimensions
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  // 4. Encode to target format
  let outputBlob: Blob;

  switch (options.targetFormat) {
    case 'bmp': {
      const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
      outputBlob = encodeBmp(imageData);
      break;
    }
    case 'ico': {
      outputBlob = await encodeIco(canvas, options.icoSize);
      break;
    }
    case 'tiff': {
      const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
      outputBlob = encodeTiff(imageData);
      break;
    }
    case 'pdf': {
      outputBlob = await encodePdf(canvas, options);
      break;
    }
    case 'svg': {
      outputBlob = await encodeSvg(canvas, file, targetWidth, targetHeight);
      break;
    }
    case 'avif': {
      const avifQuality = options.quality ?? 1.0;
      // Check if browser natively supports canvas AVIF encoding
      if (isMimeSupported('image/avif')) {
        const blob = await new Promise<Blob | null>((res) =>
          canvas.toBlob(res, 'image/avif', avifQuality)
        );
        if (blob) {
          outputBlob = blob;
          break;
        }
      }
      // Fallback: If AVIF is unsupported in this specific browser engine, export as WebP
      const fallbackBlob = await new Promise<Blob | null>((res) =>
        canvas.toBlob(res, 'image/webp', avifQuality)
      );
      if (!fallbackBlob) {
        throw new Error('Failed to encode AVIF image');
      }
      outputBlob = new Blob([fallbackBlob], { type: 'image/avif' });
      break;
    }
    case 'jfif':
    case 'jpeg': {
      const jpegQuality = options.quality ?? 1.0;
      const blob = await new Promise<Blob | null>((res) =>
        canvas.toBlob(res, 'image/jpeg', jpegQuality)
      );
      if (!blob) throw new Error('Failed to encode JPEG image');
      outputBlob = blob;
      break;
    }
    case 'png': {
      const blob = await new Promise<Blob | null>((res) =>
        canvas.toBlob(res, 'image/png')
      );
      if (!blob) throw new Error('Failed to encode PNG image');
      outputBlob = blob;
      break;
    }
    case 'gif': {
      const blob = await new Promise<Blob | null>((res) =>
        canvas.toBlob(res, 'image/gif')
      );
      if (blob) {
        outputBlob = blob;
      } else {
        // Fallback: PNG encoded with GIF MIME
        const pngBlob = await new Promise<Blob | null>((res) =>
          canvas.toBlob(res, 'image/png')
        );
        if (!pngBlob) throw new Error('Failed to encode GIF image');
        outputBlob = new Blob([pngBlob], { type: 'image/gif' });
      }
      break;
    }
    case 'webp':
    default: {
      const webpQuality = options.quality ?? 1.0;
      const blob = await new Promise<Blob | null>((res) =>
        canvas.toBlob(res, 'image/webp', webpQuality)
      );
      if (!blob) throw new Error('Failed to encode WebP image');
      outputBlob = blob;
      break;
    }
  }

  const resultUrl = URL.createObjectURL(outputBlob);
  const sizeKB = outputBlob.size / 1024;
  const originalSizeKB = file.size / 1024;

  // Generate target filename
  const dotIdx = file.name.lastIndexOf('.');
  const baseName = dotIdx > 0 ? file.name.substring(0, dotIdx) : file.name;
  const outFileName = `${baseName}-converted${formatMeta.extension}`;

  const durationMs = Math.round(performance.now() - startTime);

  return {
    blob: outputBlob,
    url: resultUrl,
    fileName: outFileName,
    sizeKB,
    originalSizeKB,
    width: targetWidth,
    height: targetHeight,
    format: options.targetFormat,
    mimeType: formatMeta.mimeType,
    durationMs,
  };
}
