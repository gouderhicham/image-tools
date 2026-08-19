/**
 * Executes a strictly bounded, highly-accurate object detection fill on RGBA image data.
 * Constrains pixel selection to:
 * 1. Pixels directly painted over by the user's stroke.
 * 2. Nearby connected pixels within a strict spatial expansion radius (<= 15px) of the stroke
 *    that match representative RGBA colors sampled directly from the user's painted stroke.
 *
 * This guarantees the detection NEVER leaks across the canvas to unpainted objects or background.
 *
 * @param imageData Raw image data of original source
 * @param seedPoints Array of canvas pixel coordinates painted over by the user
 * @param currentMask Current mask array (only non-transparent pixels will be sampled)
 * @returns Uint8Array selection mask where 255 = in detected object, 0 = outside object
 */
export function multiSeedFloodFill(
  imageData: ImageData,
  seedPoints: Array<{ x: number; y: number }>,
  currentMask: Uint8Array
): Uint8Array {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;

  const selectionMask = new Uint8Array(width * height);
  if (seedPoints.length === 0) return selectionMask;

  // Step 1: Collect unique target seed colors from stroke points
  const sampledColors: Array<[number, number, number, number]> = [];
  const colorDistThreshold = 15;

  let minX = width;
  let maxX = 0;
  let minY = height;
  let maxY = 0;

  for (const pt of seedPoints) {
    const x = Math.floor(Math.max(0, Math.min(width - 1, pt.x)));
    const y = Math.floor(Math.max(0, Math.min(height - 1, pt.y)));
    const idx = y * width + x;

    // Track tight bounding box of drawn stroke
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);

    // Direct painted stroke pixels are always part of the selection if not transparent
    if (currentMask[idx] > 0) {
      selectionMask[idx] = 255;
    }

    const imgIdx = idx * 4;
    const r = data[imgIdx];
    const g = data[imgIdx + 1];
    const b = data[imgIdx + 2];
    const a = data[imgIdx + 3];

    let isDuplicate = false;
    for (const [sr, sg, sb] of sampledColors) {
      const dist = Math.sqrt((r - sr) ** 2 + (g - sg) ** 2 + (b - sb) ** 2);
      if (dist < colorDistThreshold) {
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      sampledColors.push([r, g, b, a]);
      if (sampledColors.length >= 25) break;
    }
  }

  if (sampledColors.length === 0) return selectionMask;

  // Expand bounding box by max spatial radius (16px)
  const margin = 16;
  const bboxMinX = Math.max(0, minX - margin);
  const bboxMaxX = Math.min(width - 1, maxX + margin);
  const bboxMinY = Math.max(0, minY - margin);
  const bboxMaxY = Math.min(height - 1, maxY + margin);

  // Distance transform map to track spatial distance from drawn stroke (max 15px expansion)
  const distFromStroke = new Int16Array(width * height);
  distFromStroke.fill(999);

  const queue = new Int32Array(width * height);
  let queueHead = 0;
  let queueTail = 0;

  // Enqueue initial stroke pixels with distance 0
  for (const pt of seedPoints) {
    const x = Math.floor(Math.max(0, Math.min(width - 1, pt.x)));
    const y = Math.floor(Math.max(0, Math.min(height - 1, pt.y)));
    const idx = y * width + x;

    if (distFromStroke[idx] === 999) {
      distFromStroke[idx] = 0;
      queue[queueTail++] = idx;
    }
  }

  // Local BFS traversal capped at max spatial distance 15px inside bounding box
  const maxSpatialDist = 15;
  const maxColorDist = 24;

  while (queueHead < queueTail) {
    const idx = queue[queueHead++];
    const px = idx % width;
    const py = Math.floor(idx / width);
    const d = distFromStroke[idx];

    if (d >= maxSpatialDist) continue;

    // Check 4-way neighbors
    const neighbors = [
      px > bboxMinX ? idx - 1 : -1,
      px < bboxMaxX ? idx + 1 : -1,
      py > bboxMinY ? idx - width : -1,
      py < bboxMaxY ? idx + width : -1,
    ];

    for (let i = 0; i < 4; i++) {
      const nIdx = neighbors[i];
      if (nIdx !== -1 && distFromStroke[nIdx] > d + 1 && currentMask[nIdx] > 0) {
        const imgIdx = nIdx * 4;
        const r = data[imgIdx];
        const g = data[imgIdx + 1];
        const b = data[imgIdx + 2];

        // Check if color matches any sampled stroke color
        let matchesColor = false;
        for (const [sr, sg, sb] of sampledColors) {
          const colorDist = Math.sqrt((r - sr) ** 2 + (g - sg) ** 2 + (b - sb) ** 2);
          if (colorDist <= maxColorDist) {
            matchesColor = true;
            break;
          }
        }

        if (matchesColor) {
          distFromStroke[nIdx] = d + 1;
          selectionMask[nIdx] = 255;
          queue[queueTail++] = nIdx;
        }
      }
    }
  }

  return selectionMask;
}
