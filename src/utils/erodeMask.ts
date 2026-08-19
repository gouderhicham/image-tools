/**
 * Erodes (contracts) the mask boundary inward by radius pixels to eliminate
 * anti-aliased background color halos / fringe lines around the subject.
 *
 * @param maskData Uint8Array mask (0 = transparent, 255 = opaque)
 * @param width Image width
 * @param height Image height
 * @param pixels Number of pixels to erode boundary inward (default 1)
 */
export function erodeMask(
  maskData: Uint8Array,
  width: number,
  height: number,
  pixels: number = 1
): Uint8Array {
  let current = new Uint8Array(maskData);

  for (let step = 0; step < pixels; step++) {
    const next = new Uint8Array(current);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        if (current[idx] === 0) continue; // Already transparent

        // Check 8-way neighbors for any transparent pixel
        let hasTransparentNeighbor = false;

        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx;
            const ny = y + dy;

            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              if (current[ny * width + nx] === 0) {
                hasTransparentNeighbor = true;
                break;
              }
            } else {
              // Edge of canvas counts as transparent boundary
              hasTransparentNeighbor = true;
              break;
            }
          }
          if (hasTransparentNeighbor) break;
        }

        if (hasTransparentNeighbor) {
          next[idx] = 0;
        }
      }
    }

    current = next;
  }

  return current;
}
