/**
 * Performs a 3x3 neighborhood smoothing pass strictly on boundary alpha pixels
 * to eliminate jagged staircased edges without modifying color channels.
 */
export function smoothAlphaEdges(maskData: Uint8Array, width: number, height: number): Uint8Array {
  const result = new Uint8Array(maskData);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const val = maskData[idx];

      // Only smooth boundary pixels (semi-transparent or adjacent to transparent pixels)
      let isEdge = false;
      let sum = 0;
      let count = 0;

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nVal = maskData[(y + dy) * width + (x + dx)];
          sum += nVal;
          count++;
          if (nVal === 0 || nVal === 255) {
            isEdge = true;
          }
        }
      }

      if (isEdge && val > 0 && val < 255) {
        result[idx] = Math.round(sum / count);
      }
    }
  }

  return result;
}
