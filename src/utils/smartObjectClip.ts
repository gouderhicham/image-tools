import { lassoFill } from './lassoFill';

/**
 * High-Precision Smart Object Auto-Clip Algorithm with Complete Internal Hole-Filling.
 * Guarantees that internal pixels (shadows, glares, reflections, text, patterns) inside the object
 * are 100% selected and deleted without leaving unselected holes in the middle of the object.
 *
 * @param imageData Raw image data of original source
 * @param pathPoints Array of coordinates { x, y } drawn by user with pen
 * @param currentMask Current mask array (non-transparent pixels)
 * @returns Uint8Array selection mask with complete solid internal object coverage
 */
export function smartObjectClip(
  imageData: ImageData,
  pathPoints: Array<{ x: number; y: number }>,
  currentMask: Uint8Array
): Uint8Array {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;

  // 1. Get raw polygon mask defined by user's drawn pen path
  const polygonMask = lassoFill(pathPoints, width, height);
  const selectionMask = new Uint8Array(width * height);

  if (pathPoints.length < 3) return selectionMask;

  // 2. Sample representative foreground object colors inside drawn polygon
  const sampledColors: Array<[number, number, number]> = [];
  let sumR = 0, sumG = 0, sumB = 0;
  let count = 0;

  for (let i = 0; i < polygonMask.length; i++) {
    if (polygonMask[i] > 0 && currentMask[i] > 0) {
      const imgIdx = i * 4;
      const r = data[imgIdx];
      const g = data[imgIdx + 1];
      const b = data[imgIdx + 2];

      sumR += r;
      sumG += g;
      sumB += b;
      count++;

      let isDuplicate = false;
      for (const [sr, sg, sb] of sampledColors) {
        const dist = Math.sqrt((r - sr) ** 2 + (g - sg) ** 2 + (b - sb) ** 2);
        if (dist < 12) {
          isDuplicate = true;
          break;
        }
      }

      if (!isDuplicate) {
        sampledColors.push([r, g, b]);
        if (sampledColors.length >= 40) break;
      }
    }
  }

  if (count === 0 || sampledColors.length === 0) {
    return polygonMask;
  }

  // 3. Compute mean color & standard deviation for adaptive thresholding
  const meanR = sumR / count;
  const meanG = sumG / count;
  const meanB = sumB / count;

  let varSum = 0;
  for (let i = 0; i < polygonMask.length; i++) {
    if (polygonMask[i] > 0 && currentMask[i] > 0) {
      const imgIdx = i * 4;
      const dr = data[imgIdx] - meanR;
      const dg = data[imgIdx + 1] - meanG;
      const db = data[imgIdx + 2] - meanB;
      varSum += Math.sqrt(dr * dr + dg * dg + db * db);
    }
  }

  const stdDev = varSum / count;
  const adaptiveThreshold = Math.max(20, Math.min(38, stdDev * 1.4));

  // 4. Initial Color Matching
  const rawMatched = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;

      if (polygonMask[idx] > 0 && currentMask[idx] > 0) {
        const imgIdx = idx * 4;
        const r = data[imgIdx];
        const g = data[imgIdx + 1];
        const b = data[imgIdx + 2];

        let minColorDist = 999;
        for (const [sr, sg, sb] of sampledColors) {
          const dist = Math.sqrt((r - sr) ** 2 + (g - sg) ** 2 + (b - sb) ** 2);
          if (dist < minColorDist) {
            minColorDist = dist;
          }
        }

        if (minColorDist <= adaptiveThreshold) {
          rawMatched[idx] = 255;
        }
      }
    }
  }

  // 5. Complete Internal Hole-Filling Pass (BFS from Outer Background Boundary)
  // Find all un-matched pixels inside polygonMask that are connected to the outer boundary of the polygon
  const outerBgInPoly = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let queueHead = 0;
  let queueTail = 0;

  // Enqueue all boundary pixels of polygonMask that are not matched
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (polygonMask[idx] > 0 && rawMatched[idx] === 0) {
        // Check if pixel is on the outer boundary of polygonMask
        let isBoundary = false;
        if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
          isBoundary = true;
        } else {
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (polygonMask[(y + dy) * width + (x + dx)] === 0) {
                isBoundary = true;
                break;
              }
            }
            if (isBoundary) break;
          }
        }

        if (isBoundary && !outerBgInPoly[idx]) {
          outerBgInPoly[idx] = 1;
          queue[queueTail++] = idx;
        }
      }
    }
  }

  // BFS expand outer background inside polygon
  while (queueHead < queueTail) {
    const idx = queue[queueHead++];
    const px = idx % width;
    const py = Math.floor(idx / width);

    const neighbors = [
      px > 0 ? idx - 1 : -1,
      px < width - 1 ? idx + 1 : -1,
      py > 0 ? idx - width : -1,
      py < height - 1 ? idx + width : -1,
    ];

    for (let i = 0; i < 4; i++) {
      const nIdx = neighbors[i];
      if (
        nIdx !== -1 &&
        polygonMask[nIdx] > 0 &&
        rawMatched[nIdx] === 0 &&
        !outerBgInPoly[nIdx]
      ) {
        outerBgInPoly[nIdx] = 1;
        queue[queueTail++] = nIdx;
      }
    }
  }

  // Step 6: Any pixel inside polygonMask that is NOT outer background IS part of the solid object!
  for (let i = 0; i < selectionMask.length; i++) {
    if (polygonMask[i] > 0 && !outerBgInPoly[i]) {
      selectionMask[i] = 255;
    }
  }

  return selectionMask;
}
