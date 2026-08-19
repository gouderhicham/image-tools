/**
 * Fills a freehand pen/lasso loop path into a binary selection mask.
 * Automatically connects the last point back to the start point to form a closed polygon,
 * then uses canvas path filling to accurately determine every pixel inside the pen selection.
 *
 * @param pathPoints Array of coordinates { x, y } drawn by user with the pen
 * @param width Canvas width
 * @param height Canvas height
 * @returns Uint8Array mask where 255 = inside pen selection, 0 = outside
 */
export function lassoFill(
  pathPoints: Array<{ x: number; y: number }>,
  width: number,
  height: number
): Uint8Array {
  const selectionMask = new Uint8Array(width * height);
  if (pathPoints.length < 3) return selectionMask;

  // Use an offscreen canvas for pixel-perfect polygon rasterization
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return selectionMask;

  ctx.beginPath();
  ctx.moveTo(pathPoints[0].x, pathPoints[0].y);

  for (let i = 1; i < pathPoints.length; i++) {
    ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
  }

  ctx.closePath();
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  const imgData = ctx.getImageData(0, 0, width, height);
  const pixels = imgData.data;

  // Transfer filled white pixels to selection mask
  for (let i = 0; i < selectionMask.length; i++) {
    if (pixels[i * 4 + 3] > 128) {
      selectionMask[i] = 255;
    }
  }

  return selectionMask;
}
