// Collapses a texture's colors down to a small, cohesive palette so raw
// model output reads as clean pixel art instead of a noisy gradient of
// near-duplicate colors. Runs entirely client/server-side — no extra API
// calls, no cost.

type RGBA = [number, number, number, number];

function parseHex(hex: string): RGBA {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const a = hex.length >= 9 ? parseInt(hex.slice(7, 9), 16) : 255;
  return [r, g, b, a];
}

function toHex(c: RGBA): string {
  const h = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, "0");
  return `#${h(c[0])}${h(c[1])}${h(c[2])}${h(c[3])}`;
}

function dist2(a: RGBA, b: RGBA): number {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  const da = a[3] - b[3];
  return dr * dr + dg * dg + db * db + da * da;
}

/**
 * Reduces the palette of a texture (an array of hex color strings, or null
 * for transparent) to at most `maxColors` distinct colors using k-means
 * clustering, then snaps every pixel to its nearest cluster center.
 * Transparent pixels are left untouched and don't count toward the budget.
 */
export function pixelateQuantize(
  pixels: (string | null)[],
  maxColors = 7,
): (string | null)[] {
  const opaque = pixels.filter((p): p is string => p !== null);
  if (opaque.length === 0) return pixels;

  const samples = opaque.map(parseHex);
  const uniqueKeys = new Set(opaque);
  if (uniqueKeys.size <= maxColors) return pixels; // already compact enough

  // k-means++-ish init: spread seeds out by picking the point farthest
  // from the current seed set each time.
  const seeds: RGBA[] = [samples[Math.floor(Math.random() * samples.length)]];
  while (seeds.length < maxColors) {
    let best: RGBA = samples[0];
    let bestScore = -1;
    for (const s of samples) {
      const nearest = Math.min(...seeds.map((seed) => dist2(s, seed)));
      if (nearest > bestScore) {
        bestScore = nearest;
        best = s;
      }
    }
    seeds.push(best);
  }

  let centers = seeds;
  for (let iter = 0; iter < 8; iter++) {
    const sums = centers.map(() => [0, 0, 0, 0, 0]);
    for (const s of samples) {
      let bestIdx = 0;
      let bestDist = Infinity;
      centers.forEach((c, i) => {
        const d = dist2(s, c);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      });
      sums[bestIdx][0] += s[0];
      sums[bestIdx][1] += s[1];
      sums[bestIdx][2] += s[2];
      sums[bestIdx][3] += s[3];
      sums[bestIdx][4] += 1;
    }
    centers = sums.map((sum, i) =>
      sum[4] > 0
        ? ([sum[0] / sum[4], sum[1] / sum[4], sum[2] / sum[4], sum[3] / sum[4]] as RGBA)
        : centers[i],
    );
  }

  const centerHex = centers.map(toHex);

  return pixels.map((p) => {
    if (p === null) return null;
    const c = parseHex(p);
    let bestIdx = 0;
    let bestDist = Infinity;
    centers.forEach((center, i) => {
      const d = dist2(c, center);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    });
    return centerHex[bestIdx];
  });
}
