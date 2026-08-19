/**
 * Performs high-precision color match flood fill on RGBA image data.
 * Uses a strict color delta threshold (RGB distance <= 25) to capture anti-aliased border pixels
 * around the subject without bleeding into distinct foreground colors.
 *
 * @param imageData Raw image data of the original source
 * @param currentMask Uint8Array mask of size width * height (0 = transparent, 255 = opaque)
 * @param startX Seed X coordinate
 * @param startY Seed Y coordinate
 * @returns New Uint8Array mask with matching background pixels set to 0 (transparent)
 */
export function floodFill(
  imageData: ImageData,
  currentMask: Uint8Array,
  startX: number,
  startY: number
): Uint8Array {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;

  const newMask = new Uint8Array(currentMask);

  const x0 = Math.floor(Math.max(0, Math.min(width - 1, startX)));
  const y0 = Math.floor(Math.max(0, Math.min(height - 1, startY)));

  const startIdx = (y0 * width + x0) * 4;
  const targetR = data[startIdx];
  const targetG = data[startIdx + 1];
  const targetB = data[startIdx + 2];
  const targetA = data[startIdx + 3];

  if (targetA === 0) {
    return newMask;
  }

  // Max color distance threshold for capturing anti-aliased background edges cleanly
  // Distance = sqrt(dR^2 + dG^2 + dB^2) <= 28
  const maxDistance = 28;

  const visited = new Uint8Array(width * height);
  const queueIndex = y0 * width + x0;

  const queue = new Int32Array(width * height);
  let queueHead = 0;
  let queueTail = 0;

  queue[queueTail++] = queueIndex;
  visited[queueIndex] = 1;

  while (queueHead < queueTail) {
    const idx = queue[queueHead++];
    const px = idx % width;
    const py = Math.floor(idx / width);

    const imgDataIdx = idx * 4;
    const r = data[imgDataIdx];
    const g = data[imgDataIdx + 1];
    const b = data[imgDataIdx + 2];

    const dr = r - targetR;
    const dg = g - targetG;
    const db = b - targetB;
    const dist = Math.sqrt(dr * dr + dg * dg + db * db);

    if (dist <= maxDistance) {
      newMask[idx] = 0; // Set to fully transparent

      const neighbors = [
        px > 0 ? idx - 1 : -1,
        px < width - 1 ? idx + 1 : -1,
        py > 0 ? idx - width : -1,
        py < height - 1 ? idx + width : -1,
      ];

      for (let i = 0; i < 4; i++) {
        const nIdx = neighbors[i];
        if (nIdx !== -1 && !visited[nIdx]) {
          visited[nIdx] = 1;
          queue[queueTail++] = nIdx;
        }
      }
    }
  }

  return newMask;
}
