/**
 * Real-Time Human-Only Segmentation, Person Tracking & Temporal Alpha Matting Engine
 *
 * Specifically identifies and segments the primary human subject (head, hair, shoulders,
 * torso, hands/arms) while rejecting non-human objects, text banners, or empty backgrounds.
 * Uses temporal Exponential Moving Average (EMA) stabilization on both the anatomical
 * person tracker and the per-pixel alpha matte to prevent flickering or broken edges.
 */

export interface HumanSegmentationResult {
  /** True only when an actual human subject (head + shoulders/torso) is reliably detected */
  hasHumanSubject: boolean;
  /** Confidence score 0..100 */
  confidence: number;
  /** Tracked horizontal center of the person's head (0..100%) */
  headXPercent: number;
  /** Tracked vertical center of the person's head (0..100%) */
  headYPercent: number;
  /** Tracked vertical level of the person's shoulders (0..100%) */
  shoulderYPercent: number;
  /** Tracked horizontal span of the person's shoulders (0..100%) */
  shoulderWidthPercent: number;
}

interface ColorSample {
  r: number;
  g: number;
  b: number;
}

/**
 * Evaluates whether an RGB pixel falls within realistic human skin-tone chromaticity
 * in YCbCr + RGB ratio space (covering fair, warm, olive, brown, and deep Indian skin tones)
 * while rejecting flat gray/white/black, neon overlays, and sky/foliage colors.
 */
function computeSkinProbability(r: number, g: number, b: number): number {
  const maxC = Math.max(r, g, b);
  const minC = Math.min(r, g, b);
  const delta = maxC - minC;

  // Reject near-grayscale, extreme darks, or blown-out pure white text pixels
  if (maxC < 38 || (r > 245 && g > 245 && b > 245) || delta < 12) {
    return 0;
  }

  // Human skin always has R > G and R > B, with G not exceeding R
  if (r <= g || r <= b || g < b * 0.65) {
    return 0;
  }

  const y = 0.299 * r + 0.587 * g + 0.114 * b;
  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

  // Perceptual YCbCr skin chromaticity ellipse
  if (y < 35 || y > 242) return 0;
  if (cb < 76 || cb > 131 || cr < 131 || cr > 178) return 0;

  // Distance from skin chromaticity center (cb=105, cr=150)
  const dCb = (cb - 105) / 24;
  const dCr = (cr - 150) / 22;
  const distSq = dCb * dCb + dCr * dCr;
  if (distSq > 1.35) return 0;

  return Math.max(0, Math.min(1, 1.15 - distSq * 0.85));
}

function colorDistSq(r1: number, g1: number, b1: number, c2: ColorSample): number {
  const dr = r1 - c2.r;
  const dg = g1 - c2.g;
  const db = b1 - c2.b;
  // Perceptually weighted RGB distance
  return dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11;
}

function minColorDistSq(r: number, g: number, b: number, palette: ColorSample[]): number {
  let best = Infinity;
  for (let i = 0; i < palette.length; i++) {
    const d = colorDistSq(r, g, b, palette[i]);
    if (d < best) best = d;
  }
  return best;
}

/**
 * Fast 5x5 separable box-gaussian feather pass on an alpha mask (Float32Array 0..1)
 * to produce smooth hair, shoulder, and clothing edges without halo artifacts.
 */
function featherAlphaMask(
  src: Float32Array,
  temp: Float32Array,
  dst: Float32Array,
  w: number,
  h: number
): void {
  // Horizontal 5-tap pass [1, 2, 4, 2, 1] / 10
  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++) {
      const xm2 = Math.max(0, x - 2);
      const xm1 = Math.max(0, x - 1);
      const xp1 = Math.min(w - 1, x + 1);
      const xp2 = Math.min(w - 1, x + 2);
      temp[row + x] =
        (src[row + xm2] +
          src[row + xm1] * 2 +
          src[row + x] * 4 +
          src[row + xp1] * 2 +
          src[row + xp2]) *
        0.1;
    }
  }

  // Vertical 5-tap pass [1, 2, 4, 2, 1] / 10
  for (let y = 0; y < h; y++) {
    const ym2 = Math.max(0, y - 2) * w;
    const ym1 = Math.max(0, y - 1) * w;
    const y0 = y * w;
    const yp1 = Math.min(h - 1, y + 1) * w;
    const yp2 = Math.min(h - 1, y + 2) * w;
    for (let x = 0; x < w; x++) {
      dst[y0 + x] =
        (temp[ym2 + x] +
          temp[ym1 + x] * 2 +
          temp[y0 + x] * 4 +
          temp[yp1 + x] * 2 +
          temp[yp2 + x]) *
        0.1;
    }
  }
}

export class HumanSegmentationTracker {
  private workCanvas: HTMLCanvasElement;
  private workCtx: CanvasRenderingContext2D | null;
  private maskCanvas: HTMLCanvasElement;
  private maskCtx: CanvasRenderingContext2D | null;

  private maskW = 144;
  private maskH = 256;

  private rawMask: Float32Array;
  private tempMask: Float32Array;
  private smoothMask: Float32Array;
  private prevTemporalMask: Float32Array | null = null;
  private maskImageData: ImageData | null = null;

  // Temporal tracking state for primary human subject
  private trackedHeadX = 0.5;
  private trackedHeadY = 0.34;
  private trackedHeadRx = 0.125;
  private trackedHeadRy = 0.115;
  private trackedTorsoX = 0.5;
  private trackedShoulderSpan = 0.34;
  private trackedConfidence = 0;
  private hasInitializedTrack = false;
  private lastProcessedTime = -999;

  constructor() {
    this.workCanvas = document.createElement('canvas');
    this.workCtx = this.workCanvas.getContext('2d', { willReadFrequently: true });
    this.maskCanvas = document.createElement('canvas');
    this.maskCtx = this.maskCanvas.getContext('2d');

    const size = this.maskW * this.maskH;
    this.rawMask = new Float32Array(size);
    this.tempMask = new Float32Array(size);
    this.smoothMask = new Float32Array(size);
  }

  public reset(): void {
    this.prevTemporalMask = null;
    this.hasInitializedTrack = false;
    this.trackedConfidence = 0;
    this.lastProcessedTime = -999;
  }

  private ensureMaskDimensions(aspectRatio: number): void {
    const targetW = aspectRatio > 1.1 ? 224 : aspectRatio > 0.85 ? 176 : 144;
    const targetH = Math.max(128, Math.round(targetW / Math.max(0.45, aspectRatio)));

    if (this.maskW !== targetW || this.maskH !== targetH) {
      this.maskW = targetW;
      this.maskH = targetH;
      this.workCanvas.width = targetW;
      this.workCanvas.height = targetH;
      this.maskCanvas.width = targetW;
      this.maskCanvas.height = targetH;
      const size = targetW * targetH;
      this.rawMask = new Float32Array(size);
      this.tempMask = new Float32Array(size);
      this.smoothMask = new Float32Array(size);
      this.prevTemporalMask = null;
      this.maskImageData = null;
    } else if (this.workCanvas.width !== targetW) {
      this.workCanvas.width = targetW;
      this.workCanvas.height = targetH;
      this.maskCanvas.width = targetW;
      this.maskCanvas.height = targetH;
    }
  }

  /**
   * Analyzes the video frame, detects & tracks the primary human subject, builds a
   * temporally smoothed human silhouette alpha matte, and composites the segmented
   * human foreground onto `targetCanvas`.
   *
   * If no human is reliably detected in the frame, `targetCanvas` is cleared and
   * `hasHumanSubject: false` is returned so text is never masked behind random objects.
   */
  public processVideoFrame(
    source: HTMLVideoElement | HTMLCanvasElement,
    targetCanvas: HTMLCanvasElement,
    filterCss = 'none',
    timestampSec = 0
  ): HumanSegmentationResult {
    const outW = targetCanvas.width || 540;
    const outH = targetCanvas.height || 960;
    const outCtx = targetCanvas.getContext('2d');
    if (!outCtx || !this.workCtx || !this.maskCtx) {
      return {
        hasHumanSubject: false,
        confidence: 0,
        headXPercent: 50,
        headYPercent: 34,
        shoulderYPercent: 52,
        shoulderWidthPercent: 34,
      };
    }

    // Check if HTMLVideoElement has decoded frame data ready
    if (source instanceof HTMLVideoElement && source.readyState < 2) {
      return {
        hasHumanSubject: this.trackedConfidence >= 42,
        confidence: Math.round(this.trackedConfidence),
        headXPercent: Math.round(this.trackedHeadX * 100),
        headYPercent: Math.round(this.trackedHeadY * 100),
        shoulderYPercent: Math.round((this.trackedHeadY + this.trackedHeadRy * 1.45) * 100),
        shoulderWidthPercent: Math.round(this.trackedShoulderSpan * 100),
      };
    }

    this.ensureMaskDimensions(outW / outH);
    const mw = this.maskW;
    const mh = this.maskH;

    try {
      this.workCtx.clearRect(0, 0, mw, mh);
      this.workCtx.drawImage(source, 0, 0, mw, mh);
    } catch {
      outCtx.clearRect(0, 0, outW, outH);
      return {
        hasHumanSubject: false,
        confidence: 0,
        headXPercent: 50,
        headYPercent: 34,
        shoulderYPercent: 52,
        shoulderWidthPercent: 34,
      };
    }

    let frameData: Uint8ClampedArray;
    try {
      frameData = this.workCtx.getImageData(0, 0, mw, mh).data;
    } catch {
      outCtx.clearRect(0, 0, outW, outH);
      return {
        hasHumanSubject: false,
        confidence: 0,
        headXPercent: 50,
        headYPercent: 34,
        shoulderYPercent: 52,
        shoulderWidthPercent: 34,
      };
    }

    // 1. Sample Background Perimeter Palette (top border, upper left/right margins)
    const bgPalette: ColorSample[] = [];
    const bgStepX = Math.max(4, Math.floor(mw / 12));
    const bgStepY = Math.max(4, Math.floor(mh / 14));

    // Top margin samples
    for (let x = 2; x < mw - 2; x += bgStepX) {
      const idx = (3 * mw + x) * 4;
      bgPalette.push({ r: frameData[idx], g: frameData[idx + 1], b: frameData[idx + 2] });
    }
    // Left and right upper/mid margin samples
    for (let y = 6; y < Math.floor(mh * 0.72); y += bgStepY) {
      const idxL = (y * mw + 3) * 4;
      const idxR = (y * mw + (mw - 4)) * 4;
      bgPalette.push({ r: frameData[idxL], g: frameData[idxL + 1], b: frameData[idxL + 2] });
      bgPalette.push({ r: frameData[idxR], g: frameData[idxR + 1], b: frameData[idxR + 2] });
    }

    // 2. Scan for Human Skin Clusters & Face/Head Centroid in upper/middle frame (y: 8%..68%)
    let skinWeightSum = 0;
    let skinXSum = 0;
    let skinYSum = 0;
    let skinCount = 0;

    const yScanStart = Math.floor(mh * 0.08);
    const yScanEnd = Math.floor(mh * 0.68);
    const xScanStart = Math.floor(mw * 0.12);
    const xScanEnd = Math.floor(mw * 0.88);

    for (let y = yScanStart; y < yScanEnd; y++) {
      const rowOffset = y * mw;
      // Weight upper-central region where human head/face naturally appears
      const yPrior = y < mh * 0.54 ? 1.15 : 0.65;
      for (let x = xScanStart; x < xScanEnd; x++) {
        const pIdx = (rowOffset + x) * 4;
        const r = frameData[pIdx];
        const g = frameData[pIdx + 1];
        const b = frameData[pIdx + 2];

        const sProb = computeSkinProbability(r, g, b);
        if (sProb > 0.25) {
          // Ensure this pixel isn't identical to the outer background wall/sky
          const bgDist = minColorDistSq(r, g, b, bgPalette);
          if (bgDist > 180) {
            const w = sProb * yPrior;
            skinWeightSum += w;
            skinXSum += (x / mw) * w;
            skinYSum += (y / mh) * w;
            skinCount++;
          }
        }
      }
    }

    const searchAreaPixels = (yScanEnd - yScanStart) * (xScanEnd - xScanStart);
    const skinFraction = skinCount / Math.max(1, searchAreaPixels);

    // 3. Determine Head Center & Measure Spread
    let rawHeadX = this.trackedHeadX;
    let rawHeadY = this.trackedHeadY;
    let rawHeadRx = 0.125;
    let rawHeadRy = 0.115;

    if (skinWeightSum > 3.5 && skinFraction >= 0.0045 && skinFraction <= 0.48) {
      rawHeadX = Math.max(0.22, Math.min(0.78, skinXSum / skinWeightSum));
      rawHeadY = Math.max(0.16, Math.min(0.56, skinYSum / skinWeightSum));

      // Compute spatial standard deviation of skin cluster around (rawHeadX, rawHeadY)
      let varX = 0;
      let varY = 0;
      let localSkinW = 0;
      const hCx = rawHeadX * mw;
      const hCy = rawHeadY * mh;
      const winR = Math.floor(Math.max(mw, mh) * 0.25);

      for (
        let y = Math.max(yScanStart, Math.floor(hCy - winR));
        y < Math.min(yScanEnd, Math.ceil(hCy + winR));
        y += 2
      ) {
        const rowOffset = y * mw;
        for (
          let x = Math.max(xScanStart, Math.floor(hCx - winR));
          x < Math.min(xScanEnd, Math.ceil(hCx + winR));
          x += 2
        ) {
          const pIdx = (rowOffset + x) * 4;
          const sp = computeSkinProbability(frameData[pIdx], frameData[pIdx + 1], frameData[pIdx + 2]);
          if (sp > 0.3) {
            const dx = x / mw - rawHeadX;
            const dy = y / mh - rawHeadY;
            varX += dx * dx * sp;
            varY += dy * dy * sp;
            localSkinW += sp;
          }
        }
      }

      if (localSkinW > 2) {
        const stdX = Math.sqrt(varX / localSkinW);
        const stdY = Math.sqrt(varY / localSkinW);
        rawHeadRx = Math.max(0.095, Math.min(0.19, stdX * 2.15));
        rawHeadRy = Math.max(0.095, Math.min(0.175, stdY * 2.15));
      }
    }

    // 4. Sample Hair Crown & Torso Clothing Palette and Verify Anatomical Contrast vs Background
    const fgTorsoPalette: ColorSample[] = [];
    const fgHairPalette: ColorSample[] = [];
    let torsoBgContrastSum = 0;
    let torsoSampleCount = 0;

    const headPxX = Math.round(rawHeadX * mw);
    const headPxY = Math.round(rawHeadY * mh);
    const headPxRx = Math.round(rawHeadRx * mw);
    const headPxRy = Math.round(rawHeadRy * mh);

    // Sample hair crown pixels directly above and around the top of the head
    const hairY0 = Math.max(2, headPxY - Math.round(headPxRy * 1.35));
    const hairY1 = Math.max(hairY0 + 2, headPxY - Math.round(headPxRy * 0.35));
    for (let y = hairY0; y <= hairY1; y += 2) {
      for (
        let x = Math.max(2, headPxX - Math.round(headPxRx * 0.95));
        x <= Math.min(mw - 3, headPxX + Math.round(headPxRx * 0.95));
        x += 3
      ) {
        const idx = (y * mw + x) * 4;
        const r = frameData[idx];
        const g = frameData[idx + 1];
        const b = frameData[idx + 2];
        if (minColorDistSq(r, g, b, bgPalette) > 150) {
          fgHairPalette.push({ r, g, b });
        }
      }
    }

    // Sample torso/chest pixels below the head (neck to lower chest)
    const torsoY0 = Math.min(mh - 4, headPxY + Math.round(headPxRy * 1.15));
    const torsoY1 = Math.min(mh - 2, headPxY + Math.round(headPxRy * 3.8));
    const torsoHalfW = Math.round(headPxRx * 1.65);

    for (let y = torsoY0; y <= torsoY1; y += 3) {
      for (
        let x = Math.max(4, headPxX - torsoHalfW);
        x <= Math.min(mw - 5, headPxX + torsoHalfW);
        x += 4
      ) {
        const idx = (y * mw + x) * 4;
        const r = frameData[idx];
        const g = frameData[idx + 1];
        const b = frameData[idx + 2];
        const bgDist = minColorDistSq(r, g, b, bgPalette);
        torsoBgContrastSum += bgDist;
        torsoSampleCount++;
        if (bgDist > 160) {
          fgTorsoPalette.push({ r, g, b });
        }
      }
    }

    const avgTorsoContrast =
      torsoSampleCount > 0 ? torsoBgContrastSum / torsoSampleCount : 0;

    // Compute frame human confidence (0..100)
    // Requires both genuine human skin cluster in the head region AND a distinct torso/body below it
    let frameConfidence = 0;
    if (skinFraction >= 0.0045 && skinFraction <= 0.48 && avgTorsoContrast > 190) {
      const skinScore = Math.min(55, skinFraction * 2600);
      const torsoScore = Math.min(35, (avgTorsoContrast - 150) / 18);
      const hairScore = fgHairPalette.length >= 3 ? 10 : 4;
      frameConfidence = Math.min(99, skinScore + torsoScore + hairScore);
    } else if (
      this.hasInitializedTrack &&
      skinFraction >= 0.0025 &&
      avgTorsoContrast > 240
    ) {
      // Person briefly turned head slightly in a tracked sequence
      frameConfidence = Math.min(78, this.trackedConfidence * 0.85);
    }

    // Smooth confidence with temporal EMA
    const timeDelta = Math.abs(timestampSec - this.lastProcessedTime);
    const isLargeJump = timeDelta > 0.65 || !this.hasInitializedTrack;
    this.lastProcessedTime = timestampSec;

    if (isLargeJump) {
      this.trackedConfidence = frameConfidence;
    } else {
      this.trackedConfidence = this.trackedConfidence * 0.65 + frameConfidence * 0.35;
    }

    const hasHumanSubject = this.trackedConfidence >= 36;

    if (!hasHumanSubject) {
      // No human reliably detected! Clear foreground mask canvas so text never goes behind random objects.
      outCtx.clearRect(0, 0, outW, outH);
      return {
        hasHumanSubject: false,
        confidence: Math.round(this.trackedConfidence),
        headXPercent: 50,
        headYPercent: 34,
        shoulderYPercent: 52,
        shoulderWidthPercent: 34,
      };
    }

    // 5. Update Temporal Person Tracker (Head, Hair, Shoulders, Torso)
    const trackAlpha = isLargeJump ? 1.0 : 0.38;
    this.trackedHeadX = this.trackedHeadX * (1 - trackAlpha) + rawHeadX * trackAlpha;
    this.trackedHeadY = this.trackedHeadY * (1 - trackAlpha) + rawHeadY * trackAlpha;
    this.trackedHeadRx = this.trackedHeadRx * (1 - trackAlpha) + rawHeadRx * trackAlpha;
    this.trackedHeadRy = this.trackedHeadRy * (1 - trackAlpha) + rawHeadRy * trackAlpha;
    this.trackedTorsoX = this.trackedTorsoX * (1 - trackAlpha) + rawHeadX * trackAlpha;
    this.trackedShoulderSpan =
      this.trackedShoulderSpan * (1 - trackAlpha) +
      Math.max(0.28, Math.min(0.46, this.trackedHeadRx * 2.75)) * trackAlpha;
    this.hasInitializedTrack = true;

    // 6. Build Pixel-Level Human Silhouette Alpha Matte (rawMask)
    const hx = this.trackedHeadX;
    const hy = this.trackedHeadY;
    const hrx = this.trackedHeadRx * 1.18; // include hair & ears
    const hry = this.trackedHeadRy * 1.28; // include hair crown & chin
    const shoulderY = hy + hry * 1.08;
    const neckY = hy + hry * 0.72;
    const shoulderHalfW = this.trackedShoulderSpan;

    for (let y = 0; y < mh; y++) {
      const ny = y / mh;
      const rowOffset = y * mw;

      for (let x = 0; x < mw; x++) {
        const nx = x / mw;
        const pIdx = (rowOffset + x) * 4;
        const r = frameData[pIdx];
        const g = frameData[pIdx + 1];
        const b = frameData[pIdx + 2];

        // A. Anatomical Human Silhouette Prior (Head + Hair Crown + Neck + Sloped Shoulders + Torso)
        // Head & Hair ellipse
        const dxHead = (nx - hx) / hrx;
        const dyHead = (ny - (hy - hry * 0.08)) / hry;
        const headDist = Math.sqrt(dxHead * dxHead + dyHead * dyHead);
        const headPrior = Math.max(0, Math.min(1, 1.32 - headDist * 0.95));

        // Neck bridge
        let neckPrior = 0;
        if (ny >= hy && ny <= shoulderY + 0.06) {
          const dxNeck = Math.abs(nx - hx) / (hrx * 0.68);
          neckPrior = Math.max(0, Math.min(1, 1.25 - dxNeck * 0.9));
        }

        // Shoulders & Torso silhouette (smoothly curving outward from neck to shoulders and down to bottom)
        let torsoPrior = 0;
        if (ny >= neckY) {
          const tShoulder = Math.min(1, (ny - neckY) / Math.max(0.08, shoulderY - neckY + 0.07));
          // Smooth S-curve shoulder slope
          const smoothCurve = tShoulder * tShoulder * (3 - 2 * tShoulder);
          const halfWidthAtY =
            hrx * 0.62 + (shoulderHalfW - hrx * 0.62) * smoothCurve + Math.max(0, ny - shoulderY) * 0.08;
          const dxTorso = Math.abs(nx - this.trackedTorsoX) / Math.max(0.08, halfWidthAtY);
          torsoPrior = Math.max(0, Math.min(1, 1.28 - dxTorso * 0.92));
        }

        const anatomicalEnvelope = Math.max(headPrior, neckPrior, torsoPrior);

        if (anatomicalEnvelope <= 0.02) {
          this.rawMask[rowOffset + x] = 0;
          continue;
        }

        // B. Pixel-Level Color & Chromaticity Matting inside/near the anatomical envelope
        const skinProb = computeSkinProbability(r, g, b);
        const bgDist = minColorDistSq(r, g, b, bgPalette);
        const fgTorsoDist =
          fgTorsoPalette.length > 0 ? minColorDistSq(r, g, b, fgTorsoPalette) : 400;
        const fgHairDist =
          fgHairPalette.length > 0 ? minColorDistSq(r, g, b, fgHairPalette) : 400;

        const bestFgDist =
          ny < shoulderY ? Math.min(fgHairDist, fgTorsoDist) : fgTorsoDist;

        // Relative foreground vs background color likelihood (0..1)
        const colorAffinity =
          bgDist / Math.max(1, bgDist + bestFgDist * 0.85 + 90);

        // Combine anatomical prior with pixel-level skin/hair/clothing evidence
        let alpha = 0;
        if (anatomicalEnvelope > 0.78) {
          // Deep interior of head/chest: keep solid unless pixel strongly matches background sky/wall
          alpha =
            bgDist < 95 && skinProb < 0.15
              ? anatomicalEnvelope * colorAffinity * 0.5
              : Math.min(1, anatomicalEnvelope * 0.82 + Math.max(skinProb, colorAffinity) * 0.45);
        } else {
          // Boundary zone (hair edges, shoulder slopes, arms/hands): guided by color & skin affinity
          const pixelEvidence = Math.max(skinProb * 1.15, colorAffinity);
          alpha = anatomicalEnvelope * (0.35 + pixelEvidence * 0.85);
          if (bgDist < 130 && skinProb < 0.2) {
            alpha *= 0.25;
          }
        }

        // Boost gesturing hands/arms slightly outside torso if strong skin tone & non-background
        if (skinProb > 0.55 && bgDist > 260 && anatomicalEnvelope > 0.12) {
          alpha = Math.max(alpha, Math.min(1, skinProb * 0.95));
        }

        // Soft contrast curve to crisp up silhouette boundary
        const clamped = Math.max(0, Math.min(1, alpha));
        this.rawMask[rowOffset + x] =
          clamped < 0.22 ? 0 : clamped > 0.78 ? 1 : (clamped - 0.22) / 0.56;
      }
    }

    // 7. Temporal EMA Stabilization across frames to prevent flickering
    if (
      !this.prevTemporalMask ||
      this.prevTemporalMask.length !== this.rawMask.length ||
      isLargeJump
    ) {
      this.prevTemporalMask = new Float32Array(this.rawMask);
    } else {
      const len = this.rawMask.length;
      for (let i = 0; i < len; i++) {
        const stabilized = this.rawMask[i] * 0.72 + this.prevTemporalMask[i] * 0.28;
        this.rawMask[i] = stabilized;
        this.prevTemporalMask[i] = stabilized;
      }
    }

    // 8. Edge Feathering Pass (smooth anti-aliased hair & shoulder boundaries)
    featherAlphaMask(this.rawMask, this.tempMask, this.smoothMask, mw, mh);

    // 9. Write Feathered Alpha Mask to maskCanvas
    if (
      !this.maskImageData ||
      this.maskImageData.width !== mw ||
      this.maskImageData.height !== mh
    ) {
      this.maskImageData = this.maskCtx.createImageData(mw, mh);
    }
    const mData = this.maskImageData.data;
    const totalPixels = mw * mh;
    for (let i = 0; i < totalPixels; i++) {
      const idx = i * 4;
      mData[idx] = 255;
      mData[idx + 1] = 255;
      mData[idx + 2] = 255;
      mData[idx + 3] = Math.round(Math.max(0, Math.min(1, this.smoothMask[i])) * 255);
    }
    this.maskCtx.putImageData(this.maskImageData, 0, 0);

    // 10. Composite Segmented Human Foreground onto targetCanvas
    outCtx.save();
    outCtx.clearRect(0, 0, outW, outH);
    if (filterCss && filterCss !== 'none') {
      outCtx.filter = filterCss;
    }
    outCtx.drawImage(source, 0, 0, outW, outH);
    outCtx.filter = 'none';
    outCtx.globalCompositeOperation = 'destination-in';
    outCtx.imageSmoothingEnabled = true;
    outCtx.imageSmoothingQuality = 'high';
    outCtx.drawImage(this.maskCanvas, 0, 0, outW, outH);
    outCtx.restore();

    return {
      hasHumanSubject: true,
      confidence: Math.round(this.trackedConfidence),
      headXPercent: Math.round(this.trackedHeadX * 100),
      headYPercent: Math.round(this.trackedHeadY * 100),
      shoulderYPercent: Math.round(shoulderY * 100),
      shoulderWidthPercent: Math.round(this.trackedShoulderSpan * 100),
    };
  }
}
