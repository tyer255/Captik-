import { createWorker } from 'tesseract.js';
import {
  computeSampleTimestamps,
  mergeFrameOcrDetections,
  normalizeOcrText,
  type DetectedVideoTextItem,
  type RawFrameOcrBlock,
} from './projectAndOcrLogic';
import {
  getActiveSegmentAndWord,
  getWordTextForScript,
  buildVideoFilterCss,
  type CaptionSegment,
  type ColorAdjustments,
  type CustomStyleOverrides,
  type TimelineOverlayItem,
} from './editorLogic';
import type { CaptionTemplateSpec } from '../data/templatesCatalog';

const IDB_NAME = 'captik_studio_video_db';
const IDB_STORE = 'video_blobs';

function openVideoDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveVideoBlobToIdb(projectId: string, blob: Blob): Promise<void> {
  try {
    const db = await openVideoDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(blob, projectId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Ignore IndexedDB quota/private mode errors gracefully
  }
}

export async function loadVideoBlobFromIdb(projectId: string): Promise<Blob | null> {
  try {
    const db = await openVideoDb();
    const blob = await new Promise<Blob | null>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(projectId);
      req.onsuccess = () => resolve((req.result as Blob) || null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return blob;
  } catch {
    return null;
  }
}

export async function deleteVideoBlobFromIdb(projectId: string): Promise<void> {
  try {
    const db = await openVideoDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).delete(projectId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
    db.close();
  } catch {
    // ignore
  }
}

export interface VideoMetadataResult {
  duration: number;
  width: number;
  height: number;
  aspectRatio: '9:16' | '16:9' | '1:1' | '4:5';
  posterDataUrl: string;
  filmstripDataUrls: string[];
}

function seekVideoTo(video: HTMLVideoElement, timeSec: number): Promise<void> {
  return new Promise((resolve) => {
    const target = Math.max(0, Math.min((video.duration || 6) - 0.04, timeSec));
    if (Math.abs(video.currentTime - target) < 0.02 && video.readyState >= 2) {
      resolve();
      return;
    }
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      video.removeEventListener('seeked', done);
      video.removeEventListener('error', done);
      resolve();
    };
    const timer = setTimeout(done, 1500);
    video.addEventListener(
      'seeked',
      () => {
        clearTimeout(timer);
        done();
      },
      { once: true }
    );
    video.addEventListener(
      'error',
      () => {
        clearTimeout(timer);
        done();
      },
      { once: true }
    );
    try {
      video.currentTime = target;
    } catch {
      clearTimeout(timer);
      done();
    }
  });
}

/**
 * Extracts real duration, aspect ratio, poster thumbnail, and filmstrip frames from a video URL.
 */
export async function extractVideoMetadataAndFilmstrip(
  videoUrl: string,
  thumbCount = 8
): Promise<VideoMetadataResult> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.src = videoUrl;

    const timeout = setTimeout(() => {
      reject(new Error('Timed out loading video metadata.'));
    }, 10000);

    video.onloadeddata = async () => {
      clearTimeout(timeout);
      try {
        // Handle WebM blobs where duration might initially be Infinity
        let dur = video.duration;
        if (!Number.isFinite(dur) || dur <= 0) {
          video.currentTime = 1e6;
          await new Promise((r) => setTimeout(r, 180));
          dur = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 6.0;
          video.currentTime = 0;
        }
        const safeDuration = Number(Math.max(1, dur).toFixed(2));
        const vw = video.videoWidth || 720;
        const vh = video.videoHeight || 1280;
        const ratio = vw / vh;
        const aspectRatio: '9:16' | '16:9' | '1:1' | '4:5' =
          ratio > 1.25 ? '16:9' : ratio > 0.92 ? '1:1' : ratio > 0.72 ? '4:5' : '9:16';

        const thumbCanvas = document.createElement('canvas');
        const tw = 160;
        const th = Math.max(90, Math.round((tw * vh) / vw));
        thumbCanvas.width = tw;
        thumbCanvas.height = th;
        const ctx = thumbCanvas.getContext('2d');

        const filmstripDataUrls: string[] = [];
        for (let i = 0; i < thumbCount; i++) {
          const t = (safeDuration * (i + 0.35)) / thumbCount;
          await seekVideoTo(video, t);
          if (ctx) {
            ctx.drawImage(video, 0, 0, tw, th);
            filmstripDataUrls.push(thumbCanvas.toDataURL('image/jpeg', 0.72));
          }
        }

        const posterDataUrl = filmstripDataUrls[0] || '/assets/terrace_poster.webp';
        video.src = '';
        resolve({
          duration: safeDuration,
          width: vw,
          height: vh,
          aspectRatio,
          posterDataUrl,
          filmstripDataUrls,
        });
      } catch (err) {
        reject(err);
      }
    };

    video.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('Could not decode the selected video file.'));
    };
  });
}

export interface OcrScanProgress {
  phase: 'initializing' | 'extracting' | 'recognizing' | 'merging' | 'completed' | 'error';
  currentFrame: number;
  totalFrames: number;
  percent: number;
  statusMessage: string;
  currentFramePreviewUrl?: string;
  detectedSoFar: number;
}

/**
 * Samples background color around a bounding box and foreground color inside it on a canvas.
 */
function sampleBoxColors(
  ctx: CanvasRenderingContext2D,
  bx: number,
  by: number,
  bw: number,
  bh: number,
  canvasW: number,
  canvasH: number
): { bgColor: string; textColor: string } {
  try {
    const x0 = Math.max(0, Math.min(canvasW - 1, Math.floor(bx)));
    const y0 = Math.max(0, Math.min(canvasH - 1, Math.floor(by)));
    const w = Math.max(4, Math.min(canvasW - x0, Math.floor(bw)));
    const h = Math.max(4, Math.min(canvasH - y0, Math.floor(bh)));
    const data = ctx.getImageData(x0, y0, w, h).data;

    let rBg = 0,
      gBg = 0,
      bBg = 0,
      bgCount = 0;
    let rFg = 255,
      gFg = 255,
      bFg = 255,
      maxLum = -1;

    // Sample perimeter for background and brightest interior pixels for text color
    for (let py = 0; py < h; py += 2) {
      for (let px = 0; px < w; px += 2) {
        const idx = (py * w + px) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const isEdge = py < 3 || py >= h - 3 || px < 3 || px >= w - 3;
        if (isEdge) {
          rBg += r;
          gBg += g;
          bBg += b;
          bgCount++;
        } else {
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          if (lum > maxLum) {
            maxLum = lum;
            rFg = r;
            gFg = g;
            bFg = b;
          }
        }
      }
    }

    const toHex = (n: number) =>
      Math.max(0, Math.min(255, Math.round(n)))
        .toString(16)
        .padStart(2, '0');

    const bgHex =
      bgCount > 0
        ? `#${toHex(rBg / bgCount)}${toHex(gBg / bgCount)}${toHex(bBg / bgCount)}`
        : '#12141c';
    const fgHex = `#${toHex(rFg)}${toHex(gFg)}${toHex(bFg)}`;
    return { bgColor: bgHex, textColor: fgHex };
  } catch {
    return { bgColor: '#12141c', textColor: '#FFFFFF' };
  }
}

/**
 * Creates a high-contrast preprocessed canvas to improve Tesseract accuracy on video frames
 * where bright text sits over dark or colorful video scenes.
 */
function createHighContrastOcrCanvas(sourceCanvas: HTMLCanvasElement): HTMLCanvasElement {
  const out = document.createElement('canvas');
  out.width = sourceCanvas.width;
  out.height = sourceCanvas.height;
  const ctx = out.getContext('2d');
  if (!ctx) return sourceCanvas;

  ctx.drawImage(sourceCanvas, 0, 0);
  try {
    const imgData = ctx.getImageData(0, 0, out.width, out.height);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      // Invert so bright video text becomes crisp black ink on white paper for Tesseract
      const val = lum > 175 ? 0 : lum > 135 ? 60 : 255;
      d[i] = val;
      d[i + 1] = val;
      d[i + 2] = val;
    }
    ctx.putImageData(imgData, 0, 0);
  } catch {
    // ignore CORS taint if any
  }
  return out;
}

function detectTextBandBounds(hcCanvas: HTMLCanvasElement): {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
} {
  const w = hcCanvas.width;
  const h = hcCanvas.height;
  const ctx = hcCanvas.getContext('2d');
  if (!ctx) {
    return { x0: w * 0.12, y0: h * 0.2, x1: w * 0.88, y1: h * 0.34 };
  }
  try {
    const data = ctx.getImageData(0, 0, w, h).data;
    const rowCounts = new Int32Array(h);
    for (let y = Math.floor(h * 0.05); y < Math.floor(h * 0.92); y++) {
      let darkPixels = 0;
      const rowOffset = y * w * 4;
      for (let x = Math.floor(w * 0.06); x < Math.floor(w * 0.94); x++) {
        if (data[rowOffset + x * 4] === 0) {
          darkPixels++;
        }
      }
      if (darkPixels >= Math.max(4, Math.floor(w * 0.02))) {
        rowCounts[y] = darkPixels;
      }
    }

    // Find the strongest contiguous vertical band of text rows
    let bestStart = -1;
    let bestEnd = -1;
    let bestScore = 0;
    let curStart = -1;
    let curScore = 0;
    for (let y = 0; y < h; y++) {
      if (rowCounts[y] > 0) {
        if (curStart === -1) curStart = y;
        curScore += rowCounts[y];
      } else if (curStart !== -1) {
        if (curScore > bestScore) {
          bestScore = curScore;
          bestStart = curStart;
          bestEnd = y - 1;
        }
        curStart = -1;
        curScore = 0;
      }
    }
    if (curStart !== -1 && curScore > bestScore) {
      bestStart = curStart;
      bestEnd = h - 1;
    }

    if (bestStart === -1 || bestEnd <= bestStart) {
      return { x0: w * 0.12, y0: h * 0.2, x1: w * 0.88, y1: h * 0.34 };
    }

    let minX = w;
    let maxX = 0;
    for (let y = bestStart; y <= bestEnd; y++) {
      const rowOffset = y * w * 4;
      for (let x = Math.floor(w * 0.05); x < Math.floor(w * 0.95); x++) {
        if (data[rowOffset + x * 4] === 0) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
        }
      }
    }
    if (maxX <= minX) {
      minX = Math.floor(w * 0.12);
      maxX = Math.floor(w * 0.88);
    }
    return { x0: minX, y0: bestStart, x1: maxX, y1: bestEnd };
  } catch {
    return { x0: w * 0.12, y0: h * 0.2, x1: w * 0.88, y1: h * 0.34 };
  }
}

/**
 * Runs real OCR text detection across multiple timestamps of the video using Tesseract.js.
 */
export async function runAutomaticVideoOcr(
  videoUrl: string,
  durationSec: number,
  onProgress: (p: OcrScanProgress) => void,
  sampleCount = 6
): Promise<DetectedVideoTextItem[]> {
  onProgress({
    phase: 'initializing',
    currentFrame: 0,
    totalFrames: sampleCount,
    percent: 5,
    statusMessage: 'Initializing Tesseract OCR engine & loading video frames...',
    detectedSoFar: 0,
  });

  const video = document.createElement('video');
  video.crossOrigin = 'anonymous';
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.src = videoUrl;

  await new Promise<void>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('Video load timed out for OCR.')), 10000);
    video.onloadeddata = () => {
      clearTimeout(t);
      resolve();
    };
    video.onerror = () => {
      clearTimeout(t);
      reject(new Error('Unable to load video stream for OCR text detection.'));
    };
  });

  const actualDuration =
    Number.isFinite(video.duration) && video.duration > 0
      ? video.duration
      : Math.max(1, durationSec || 6);
  const timestamps = computeSampleTimestamps(actualDuration, sampleCount);
  const totalFrames = timestamps.length;
  const sampleStep = actualDuration / Math.max(1, totalFrames);

  const vw = video.videoWidth || 720;
  const vh = video.videoHeight || 1280;
  const scale = Math.min(1, 720 / Math.max(vw, vh));
  const cw = Math.max(320, Math.round(vw * scale));
  const ch = Math.max(320, Math.round(vh * scale));

  const frameCanvas = document.createElement('canvas');
  frameCanvas.width = cw;
  frameCanvas.height = ch;
  const ctx = frameCanvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not initialize 2D canvas context for OCR.');
  }

  const worker = await createWorker('eng');
  const rawDetections: RawFrameOcrBlock[] = [];

  try {
    for (let i = 0; i < timestamps.length; i++) {
      const ts = timestamps[i];
      await seekVideoTo(video, ts);
      ctx.drawImage(video, 0, 0, cw, ch);
      const previewUrl = frameCanvas.toDataURL('image/jpeg', 0.65);

      onProgress({
        phase: 'recognizing',
        currentFrame: i + 1,
        totalFrames,
        percent: Math.round(12 + ((i + 0.4) / totalFrames) * 76),
        statusMessage: `Scanning frame ${i + 1} of ${totalFrames} at ${ts.toFixed(1)}s...`,
        currentFramePreviewUrl: previewUrl,
        detectedSoFar: rawDetections.length,
      });

      // Run OCR on high-contrast preprocessed frame with blocks output enabled
      const hcCanvas = createHighContrastOcrCanvas(frameCanvas);
      const resPrimary = await worker.recognize(hcCanvas, {}, { blocks: true });
      const extractedLines: Array<{
        text: string;
        confidence?: number;
        bbox: { x0: number; y0: number; x1: number; y1: number };
      }> = [];

      const ocrPageData = resPrimary.data as {
        text?: string;
        confidence?: number;
        lines?: Array<{
          text: string;
          confidence?: number;
          bbox: { x0: number; y0: number; x1: number; y1: number };
        }>;
        blocks?: Array<{
          paragraphs?: Array<{
            lines?: Array<{
              text: string;
              confidence?: number;
              bbox: { x0: number; y0: number; x1: number; y1: number };
            }>;
          }>;
        }>;
      };

      if (ocrPageData?.lines && ocrPageData.lines.length > 0) {
        extractedLines.push(...ocrPageData.lines);
      } else if (ocrPageData?.blocks && ocrPageData.blocks.length > 0) {
        for (const blk of ocrPageData.blocks) {
          for (const para of blk.paragraphs || []) {
            for (const ln of para.lines || []) {
              extractedLines.push(ln);
            }
          }
        }
      }

      const primaryText = normalizeOcrText(resPrimary.data?.text || '');

      if (extractedLines.length > 0) {
        for (const ln of extractedLines) {
          const clean = normalizeOcrText(ln.text || '');
          if (clean.length < 2) continue;
          const bbox = ln.bbox;
          const bw = Math.max(10, bbox.x1 - bbox.x0);
          const bh = Math.max(8, bbox.y1 - bbox.y0);
          const centerX = ((bbox.x0 + bw / 2) / cw) * 100;
          const centerY = ((bbox.y0 + bh / 2) / ch) * 100;
          const widthPct = (bw / cw) * 100;
          const heightPct = (bh / ch) * 100;
          const colors = sampleBoxColors(ctx, bbox.x0, bbox.y0, bw, bh, cw, ch);

          rawDetections.push({
            timestamp: ts,
            text: clean,
            confidence: ln.confidence ?? resPrimary.data.confidence ?? 88,
            x: Number(centerX.toFixed(1)),
            y: Number(centerY.toFixed(1)),
            width: Math.min(92, Math.max(44, Number((widthPct + 8).toFixed(1)))),
            height: Math.min(35, Math.max(10, Number((heightPct + 4).toFixed(1)))),
            bgColor: colors.bgColor,
            textColor: colors.textColor,
            frameThumbDataUrl: previewUrl,
          });
        }
      } else if (primaryText.length >= 2) {
        const bounds = detectTextBandBounds(hcCanvas);
        const bw = Math.max(20, bounds.x1 - bounds.x0);
        const bh = Math.max(14, bounds.y1 - bounds.y0);
        const centerX = ((bounds.x0 + bw / 2) / cw) * 100;
        const centerY = ((bounds.y0 + bh / 2) / ch) * 100;
        const widthPct = (bw / cw) * 100;
        const heightPct = (bh / ch) * 100;
        const colors = sampleBoxColors(
          ctx,
          bounds.x0,
          bounds.y0,
          bw,
          bh,
          cw,
          ch
        );
        rawDetections.push({
          timestamp: ts,
          text: primaryText,
          confidence: resPrimary.data?.confidence || 88,
          x: Number(centerX.toFixed(1)),
          y: Number(centerY.toFixed(1)),
          width: Math.min(92, Math.max(54, Number((widthPct + 8).toFixed(1)))),
          height: Math.min(35, Math.max(11, Number((heightPct + 4).toFixed(1)))),
          bgColor: colors.bgColor,
          textColor: colors.textColor,
          frameThumbDataUrl: previewUrl,
        });
      }

      onProgress({
        phase: 'recognizing',
        currentFrame: i + 1,
        totalFrames,
        percent: Math.round(12 + ((i + 1) / totalFrames) * 76),
        statusMessage: `Processed frame ${i + 1}/${totalFrames} (${ts.toFixed(1)}s)`,
        currentFramePreviewUrl: previewUrl,
        detectedSoFar: rawDetections.length,
      });
    }
  } finally {
    await worker.terminate();
    video.src = '';
  }

  onProgress({
    phase: 'merging',
    currentFrame: totalFrames,
    totalFrames,
    percent: 94,
    statusMessage: 'Merging multi-frame text regions and timestamps...',
    detectedSoFar: rawDetections.length,
  });

  const merged = mergeFrameOcrDetections(rawDetections, sampleStep, actualDuration);

  onProgress({
    phase: 'completed',
    currentFrame: totalFrames,
    totalFrames,
    percent: 100,
    statusMessage:
      merged.length > 0
        ? `Detected ${merged.length} text region${merged.length === 1 ? '' : 's'} across ${totalFrames} video frames.`
        : 'Scan complete. No burned-in text detected in sampled frames — you can add new text or re-scan with more frames.',
    detectedSoFar: merged.length,
  });

  return merged;
}

export interface CustomSampleVideoScene {
  text: string;
  subtext?: string;
  bgTop: string;
  bgBottom: string;
  boxColor: string;
  textColor: string;
  yPercent: number;
}

/**
 * Generates a real playable WebM video file on the fly using HTML5 Canvas + MediaRecorder
 * with high-contrast burned-in text across multiple timestamps so users can test uploading
 * and running real OCR text detection on a brand-new video immediately.
 */
export async function generateCustomVideoWithEmbeddedText(
  title = 'Creator_Vlog_Clip',
  scenesInput: (CustomSampleVideoScene | string)[] = [
    {
      text: 'MUMBAI TECH VLOG',
      subtext: 'DAY 1 IN BANDRA',
      bgTop: '#0f172a',
      bgBottom: '#1e293b',
      boxColor: '#000000',
      textColor: '#FFFFFF',
      yPercent: 25,
    },
    {
      text: 'BUILD FAST SHIP DAILY',
      subtext: 'REAL CREATOR WORKFLOW',
      bgTop: '#18181b',
      bgBottom: '#27272a',
      boxColor: '#000000',
      textColor: '#FFFFFF',
      yPercent: 52,
    },
    {
      text: 'FOLLOW FOR MORE REELS',
      subtext: 'LINK IN BIO',
      bgTop: '#14142b',
      bgBottom: '#1f243d',
      boxColor: '#000000',
      textColor: '#FFFFFF',
      yPercent: 74,
    },
  ],
  durationSec = 3.0
): Promise<File> {
  const defaultSceneTemplates: CustomSampleVideoScene[] = [
    {
      text: 'MUMBAI TECH VLOG',
      bgTop: '#0f172a',
      bgBottom: '#1e293b',
      boxColor: '#000000',
      textColor: '#FFFFFF',
      yPercent: 26,
    },
    {
      text: 'BUILD FAST SHIP DAILY',
      bgTop: '#18181b',
      bgBottom: '#27272a',
      boxColor: '#000000',
      textColor: '#FFFFFF',
      yPercent: 50,
    },
    {
      text: 'SUBSCRIBE FOR REELS',
      bgTop: '#14142b',
      bgBottom: '#1f243d',
      boxColor: '#000000',
      textColor: '#FFFFFF',
      yPercent: 72,
    },
  ];

  const scenes: CustomSampleVideoScene[] = scenesInput.map((item, idx) => {
    const base = defaultSceneTemplates[idx % defaultSceneTemplates.length];
    if (typeof item === 'string') {
      return {
        ...base,
        text: item.trim() || base.text,
      };
    }
    return {
      ...base,
      ...item,
      text: item.text || base.text,
      bgTop: item.bgTop || base.bgTop,
      bgBottom: item.bgBottom || base.bgBottom,
      boxColor: item.boxColor || base.boxColor,
      textColor: item.textColor || base.textColor,
      yPercent: item.yPercent ?? base.yPercent,
    };
  });

  const canvas = document.createElement('canvas');
  canvas.width = 540;
  canvas.height = 960;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable');
  }

  const stream = canvas.captureStream(30);
  let audioCtx: AudioContext | null = null;
  let effectiveDurationSec = durationSec;

  // Attempt to synthesize spoken voice audio for the scenes via /api/captions/tts
  try {
    const scriptText = scenes.map((s) => s.text).join('. ');
    const ttsRes = await fetch('/api/captions/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: scriptText }),
    });
    if (ttsRes.ok) {
      const ttsJson = (await ttsRes.json()) as { audioBase64?: string };
      if (ttsJson.audioBase64) {
        const binary = atob(ttsJson.audioBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const AudioCtxClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtxClass) {
          audioCtx = new AudioCtxClass();
          const decodedBuffer = await audioCtx.decodeAudioData(bytes.buffer.slice(0));
          effectiveDurationSec = Math.max(durationSec, Math.min(8, decodedBuffer.duration + 0.3));
          const dest = audioCtx.createMediaStreamDestination();
          const srcNode = audioCtx.createBufferSource();
          srcNode.buffer = decodedBuffer;
          srcNode.connect(dest);
          const audioTrack = dest.stream.getAudioTracks()[0];
          if (audioTrack) {
            stream.addTrack(audioTrack);
          }
          srcNode.start(0);
        }
      }
    }
  } catch {
    // Fallback to visual recording if TTS unavailable
  }

  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
    ? 'video/webm;codecs=vp9,opus'
    : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
    ? 'video/webm;codecs=vp8,opus'
    : MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : 'video/webm';

  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 2_500_000,
  });

  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  const finished = new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: 'video/webm' }));
    };
  });

  recorder.start(100);

  const totalFrames = Math.round(effectiveDurationSec * 20);
  for (let f = 0; f < totalFrames; f++) {
    const progress = f / totalFrames;
    const sceneIdx = Math.min(
      scenes.length - 1,
      Math.floor(progress * scenes.length)
    );
    const scene = scenes[sceneIdx];

    // Draw background gradient + animated studio rings
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, scene.bgTop);
    grad.addColorStop(1, scene.bgBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle moving geometric circle in background (away from text band)
    ctx.fillStyle = 'rgba(245, 165, 36, 0.14)';
    ctx.beginPath();
    ctx.arc(
      270 + Math.sin(f * 0.12) * 80,
      860,
      70,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Draw high-contrast solid banner and crisp uppercase text for OCR clarity
    const boxY = Math.round((scene.yPercent / 100) * canvas.height);
    const boxH = 115;
    ctx.fillStyle = scene.boxColor;
    ctx.fillRect(30, boxY - boxH / 2, canvas.width - 60, boxH);

    ctx.fillStyle = scene.textColor;
    ctx.font = 'bold 42px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(scene.text, canvas.width / 2, boxY);

    await new Promise((r) => setTimeout(r, 45));
  }

  recorder.stop();
  const blob = await finished;
  if (audioCtx) {
    await audioCtx.close().catch(() => {});
  }
  const safeFileName = `${title.replace(/\s+/g, '_')}.webm`;
  return new File([blob], safeFileName, { type: 'video/webm' });
}

export function getExportCanvasDimensions(
  aspectRatio: '9:16' | '16:9' | '1:1' | '4:5',
  quality: '720p' | '1080p' | '4K' = '1080p'
): { width: number; height: number; videoBitsPerSecond: number } {
  const shortEdge = quality === '4K' ? 1440 : quality === '720p' ? 720 : 1080;
  const videoBitsPerSecond =
    quality === '4K'
      ? 28_000_000
      : quality === '1080p'
      ? 16_000_000
      : 8_000_000;

  if (aspectRatio === '16:9') {
    return {
      width: Math.round((shortEdge * 16) / 9),
      height: shortEdge,
      videoBitsPerSecond,
    };
  }
  if (aspectRatio === '1:1') {
    return {
      width: shortEdge,
      height: shortEdge,
      videoBitsPerSecond,
    };
  }
  if (aspectRatio === '4:5') {
    return {
      width: shortEdge,
      height: Math.round((shortEdge * 5) / 4),
      videoBitsPerSecond,
    };
  }
  // Default 9:16 vertical reel
  return {
    width: shortEdge,
    height: Math.round((shortEdge * 16) / 9),
    videoBitsPerSecond,
  };
}

/**
 * Renders the FULL edited video (100% of duration without any early cutoff, at the exact
 * user-selected quality 720p / 1080p / 4K, smooth continuous 60fps frame rendering with
 * zero seek lag, and single-pass object-cover video drawing so two faces never appear).
 */
export async function exportEditedVideoToBlob(params: {
  videoUrl: string;
  duration: number;
  aspectRatio: '9:16' | '16:9' | '1:1' | '4:5';
  quality?: '720p' | '1080p' | '4K';
  segments: CaptionSegment[];
  detectedTexts: DetectedVideoTextItem[];
  activeScript: string;
  activeTemplate: CaptionTemplateSpec;
  styleOverrides: CustomStyleOverrides;
  adjustments: ColorAdjustments;
  overlays: TimelineOverlayItem[];
  videoClips?: import('./editorLogic').VideoTimelineClip[];
  audioClips?: import('./editorLogic').AudioTimelineClip[];
  onProgress: (pct: number) => void;
}): Promise<Blob> {
  const {
    videoUrl,
    duration,
    aspectRatio,
    quality = '1080p',
    segments,
    detectedTexts,
    activeScript,
    activeTemplate,
    styleOverrides,
    adjustments,
    overlays,
    videoClips = [],
    onProgress,
  } = params;

  const { mapTimelineTimeToSourceVideo } = await import('./editorLogic');
  const { drawSourceObjectCover } = await import('./humanSegmentationEngine');

  const { width: canvasW, height: canvasH, videoBitsPerSecond } =
    getExportCanvasDimensions(aspectRatio, quality);

  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;

  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Canvas 2D context unavailable for export.');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Offscreen layer for "Behind You" hero text with silhouette occlusion cutout (never draws a second face!)
  const behindLayerCanvas = document.createElement('canvas');
  behindLayerCanvas.width = canvasW;
  behindLayerCanvas.height = canvasH;
  const behindLayerCtx = behindLayerCanvas.getContext('2d');

  // Scale factor relative to 540px reference stage so typography scales crisply at 720p, 1080p, and 4K
  const resScale = Math.min(canvasW, canvasH) / 540;

  const video = document.createElement('video');
  video.crossOrigin = 'anonymous';
  video.playsInline = true;
  video.preload = 'auto';
  video.src = videoUrl;

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Video load timeout during export')),
      12000
    );
    video.onloadeddata = () => {
      clearTimeout(timer);
      resolve();
    };
    video.onerror = () => {
      clearTimeout(timer);
      reject(new Error('Failed to load video during export'));
    };
  });

  // Determine the FULL export duration (never cap at 6.5s!)
  const nativeVideoDuration =
    Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
  const clipsEndDuration =
    videoClips.length > 0
      ? Math.max(...videoClips.map((c) => c.timelineEnd || 0))
      : 0;

  const isSingleUntrimmedClip =
    videoClips.length <= 1 &&
    (!videoClips[0] ||
      (videoClips[0].sourceStart <= 0.05 &&
        (videoClips[0].speed || 1) === 1 &&
        Math.abs((videoClips[0].timelineEnd || 0) - (duration || 0)) <= 0.25));

  const exportDuration = Math.max(
    0.5,
    isSingleUntrimmedClip
      ? Math.max(duration || 0, nativeVideoDuration, clipsEndDuration)
      : clipsEndDuration || duration || nativeVideoDuration || 5
  );

  const filterCss = buildVideoFilterCss(adjustments, 'none');

  const isBehindTemplate =
    styleOverrides.behindSubject ||
    activeTemplate.behind ||
    Boolean(activeTemplate.lookSpec?.behindSubject) ||
    Boolean(activeTemplate.lookSpec?.wholeBehind) ||
    Boolean(activeTemplate.lookSpec?.impact);

  // Pure single-pass frame renderer (draws video ONCE with object-cover, then overlays & captions)
  const renderFrameAtTimelineTime = (timelineTime: number) => {
    // LAYER 1: Original Background Video Frame drawn ONCE using exact object-cover crop
    ctx.save();
    ctx.fillStyle = '#070709';
    ctx.fillRect(0, 0, canvasW, canvasH);
    if (filterCss && filterCss !== 'none') {
      ctx.filter = filterCss;
    }
    drawSourceObjectCover(ctx, video, canvasW, canvasH);
    ctx.restore();

    const { segment, activeWordIndex } = getActiveSegmentAndWord(
      segments,
      timelineTime
    );
    const isBehindFrame = isBehindTemplate || Boolean(segment?.behindSubject);

    // LAYER 2: "Behind You" Hero Caption Layer (occluded around speaker's head/shoulders without duplicating face)
    if (isBehindFrame && segment && segment.words.length > 0 && behindLayerCtx) {
      const cx = (styleOverrides.xOffset / 100) * canvasW;
      const behindY = Math.min(
        canvasH * 0.34,
        (styleOverrides.yOffset / 100) * canvasH * 0.45
      );
      const heroWord =
        segment.words[activeWordIndex] ||
        segment.words.find((w) => w.emphasis !== 'none') ||
        segment.words[0];

      if (heroWord) {
        const heroTxt = getWordTextForScript(heroWord, activeScript);
        const heroFontSize = Math.round(
          68 *
            resScale *
            (styleOverrides.fontScale || 1) *
            (styleOverrides.behindHeroScale || 1)
        );

        behindLayerCtx.clearRect(0, 0, canvasW, canvasH);
        behindLayerCtx.save();
        behindLayerCtx.font = `900 ${heroFontSize}px ${
          activeTemplate.fontFamily || 'Anton, sans-serif'
        }`;
        behindLayerCtx.textAlign = 'center';
        behindLayerCtx.textBaseline = 'middle';
        behindLayerCtx.shadowColor = 'rgba(0,0,0,0.75)';
        behindLayerCtx.shadowBlur = Math.round(18 * resScale);
        behindLayerCtx.fillStyle =
          styleOverrides.accentColor ||
          activeTemplate.emphasisColor ||
          '#F5A524';
        behindLayerCtx.fillText(heroTxt.toUpperCase(), cx, behindY);

        // Softly occlude center-bottom of the Behind-You word where the speaker's head/hair sits
        behindLayerCtx.globalCompositeOperation = 'destination-out';
        const headCenterX = canvasW * 0.5;
        const headCenterY = behindY + heroFontSize * 0.42;
        const cutRadius = Math.max(24, heroFontSize * 0.85);
        const grad = behindLayerCtx.createRadialGradient(
          headCenterX,
          headCenterY,
          cutRadius * 0.15,
          headCenterX,
          headCenterY,
          cutRadius
        );
        grad.addColorStop(0, 'rgba(0,0,0,0.88)');
        grad.addColorStop(0.65, 'rgba(0,0,0,0.45)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        behindLayerCtx.fillStyle = grad;
        behindLayerCtx.beginPath();
        behindLayerCtx.arc(headCenterX, headCenterY, cutRadius, 0, Math.PI * 2);
        behindLayerCtx.fill();
        behindLayerCtx.restore();

        ctx.drawImage(behindLayerCanvas, 0, 0);
      }
    }

    // LAYER 3A: Detected OCR Text masks and replacements active at timelineTime
    const activeOcr = detectedTexts.filter(
      (d) =>
        timelineTime >= d.startTime - 0.05 && timelineTime <= d.endTime + 0.05
    );
    for (const item of activeOcr) {
      if (item.maskOriginal || item.isRemoved) {
        const mw = (item.width / 100) * canvasW;
        const mh = (item.height / 100) * canvasH;
        const mx = (item.originalX / 100) * canvasW - mw / 2;
        const my = (item.originalY / 100) * canvasH - mh / 2;
        ctx.fillStyle = item.bgColor || '#101218';
        ctx.beginPath();
        ctx.roundRect(
          mx - 6 * resScale,
          my - 4 * resScale,
          mw + 12 * resScale,
          mh + 8 * resScale,
          8 * resScale
        );
        ctx.fill();
      }
      if (!item.isRemoved && item.text.trim()) {
        const rx = (item.x / 100) * canvasW;
        const ry = (item.y / 100) * canvasH;
        const fontSize = Math.round(28 * resScale * (item.fontScale || 1));
        ctx.font = `800 ${fontSize}px ${
          activeTemplate.fontFamily || 'sans-serif'
        }`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const metrics = ctx.measureText(item.text);
        const padX = Math.round(16 * resScale);
        const padY = Math.round(10 * resScale);
        ctx.fillStyle = 'rgba(12, 13, 18, 0.86)';
        ctx.beginPath();
        ctx.roundRect(
          rx - metrics.width / 2 - padX,
          ry - fontSize / 2 - padY,
          metrics.width + padX * 2,
          fontSize + padY * 2,
          Math.round(10 * resScale)
        );
        ctx.fill();

        ctx.fillStyle =
          item.textColor || styleOverrides.accentColor || '#F5A524';
        ctx.fillText(item.text, rx, ry);
      }
    }

    // LAYER 3B: Timeline Text & Element Overlays active at timelineTime
    const activeOverlays = overlays.filter(
      (ov) =>
        ov.type !== 'sfx' && timelineTime >= ov.start && timelineTime <= ov.end
    );
    for (const ov of activeOverlays) {
      const ox = ((ov.x ?? 50) / 100) * canvasW;
      const oy = ((ov.y ?? 25) / 100) * canvasH;
      const ovFontSize = Math.round(30 * resScale * (ov.scale || 1));
      ctx.save();
      ctx.font = `900 ${ovFontSize}px ${
        activeTemplate.fontFamily || 'sans-serif'
      }`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = Math.round(10 * resScale);
      ctx.fillStyle = ov.color || '#F5A524';
      ctx.fillText(ov.label, ox, oy);
      ctx.restore();
    }

    // LAYER 4: Foreground Synchronized Word-by-Word Captions at timelineTime
    if (segment && segment.words.length > 0) {
      const cx = ((styleOverrides.xOffset ?? 50) / 100) * canvasW;
      const cy = ((styleOverrides.yOffset ?? 76) / 100) * canvasH;
      const baseFontSize = Math.round(
        30 * resScale * (styleOverrides.fontScale || 1)
      );
      const fontFamily = activeTemplate.fontFamily || 'Inter, sans-serif';

      ctx.save();
      ctx.font = `900 ${baseFontSize}px ${fontFamily}`;
      ctx.textBaseline = 'middle';

      const wordTokens = segment.words.map((w, idx) => {
        const rawTxt = getWordTextForScript(w, activeScript);
        const text =
          styleOverrides.uppercase || activeTemplate.uppercase
            ? rawTxt.toUpperCase()
            : rawTxt;
        const isActive = idx === activeWordIndex;
        const isEmph = w.emphasis !== 'none';
        return { text, isActive, isEmph };
      });

      const spaceW = Math.round(baseFontSize * 0.32);
      const widths = wordTokens.map((wt) => {
        ctx.font = `${wt.isActive || wt.isEmph ? 900 : 800} ${
          wt.isActive ? Math.round(baseFontSize * 1.12) : baseFontSize
        }px ${fontFamily}`;
        return ctx.measureText(wt.text).width;
      });
      const totalLineW =
        widths.reduce((acc, w) => acc + w, 0) +
        Math.max(0, wordTokens.length - 1) * spaceW;

      // Optional caption container box if template or styleOverrides has background opacity
      if ((styleOverrides.bgOpacity ?? 0) > 10 || activeTemplate.boxBg) {
        const boxPadX = Math.round(18 * resScale);
        const boxPadY = Math.round(12 * resScale);
        ctx.fillStyle =
          activeTemplate.boxBg ||
          `rgba(10, 12, 16, ${Math.min(
            0.92,
            (styleOverrides.bgOpacity || 75) / 100
          )})`;
        ctx.beginPath();
        ctx.roundRect(
          cx - totalLineW / 2 - boxPadX,
          cy - baseFontSize / 2 - boxPadY,
          totalLineW + boxPadX * 2,
          baseFontSize + boxPadY * 2,
          Math.round(12 * resScale)
        );
        ctx.fill();
      }

      let cursorX = cx - totalLineW / 2;
      wordTokens.forEach((wt, idx) => {
        const wWidth = widths[idx];
        const wordFontPx = wt.isActive
          ? Math.round(baseFontSize * 1.12)
          : baseFontSize;
        ctx.font = `900 ${wordFontPx}px ${fontFamily}`;
        ctx.textAlign = 'left';

        if (wt.isActive && activeTemplate.id === 'bubble') {
          const pillPadX = Math.round(8 * resScale);
          const pillPadY = Math.round(4 * resScale);
          ctx.fillStyle =
            styleOverrides.accentColor ||
            activeTemplate.emphasisColor ||
            '#48A680';
          ctx.beginPath();
          ctx.roundRect(
            cursorX - pillPadX,
            cy - wordFontPx / 2 - pillPadY,
            wWidth + pillPadX * 2,
            wordFontPx + pillPadY * 2,
            Math.round(8 * resScale)
          );
          ctx.fill();
        }

        ctx.shadowColor = 'rgba(0,0,0,0.88)';
        ctx.shadowBlur = Math.round(14 * resScale);
        ctx.shadowOffsetY = Math.round(3 * resScale);

        if ((styleOverrides.strokeWidth ?? 0) > 0) {
          ctx.strokeStyle = activeTemplate.strokeColor || '#000000';
          ctx.lineWidth = Math.max(
            2,
            Math.round((styleOverrides.strokeWidth || 2) * resScale * 0.8)
          );
          ctx.strokeText(wt.text, cursorX, cy);
        }

        ctx.fillStyle =
          wt.isActive || wt.isEmph
            ? styleOverrides.accentColor ||
              activeTemplate.emphasisColor ||
              '#F5A524'
            : styleOverrides.primaryColor ||
              activeTemplate.textColor ||
              '#FFFFFF';
        ctx.fillText(wt.text, cursorX, cy);

        cursorX += wWidth + spaceW;
      });

      ctx.restore();
    }
  };

  // Seek to initial start time and render Frame 0 before starting MediaRecorder
  const initialMapped = mapTimelineTimeToSourceVideo(videoClips, 0);
  await seekVideoTo(video, initialMapped.sourceTime);
  renderFrameAtTimelineTime(0);
  onProgress(5);

  // Build combined video + audio stream (60fps canvas video + original audio track if available)
  const canvasStream = canvas.captureStream(60);
  const combinedTracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];

  // Try starting playback with audio enabled so captureStream includes the audio track
  video.muted = false;
  video.volume = 1.0;
  let playingWithAudio = false;
  try {
    const vidStream: MediaStream | undefined =
      (video as unknown as { captureStream?: () => MediaStream }).captureStream?.() ||
      (video as unknown as { mozCaptureStream?: () => MediaStream }).mozCaptureStream?.();
    if (vidStream) {
      const audioTracks = vidStream.getAudioTracks();
      if (audioTracks.length > 0) {
        combinedTracks.push(audioTracks[0]);
        playingWithAudio = true;
      }
    }
  } catch {
    // Fallback to video-only stream if cross-origin or browser blocks audio capture
  }

  const recordStream = new MediaStream(combinedTracks);

  // Choose hardware-accelerated H.264 / MP4 or fast VP8 WebM instead of slow software VP9!
  const candidateMimeTypes = [
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
    'video/mp4;codecs=avc1',
    'video/mp4',
    'video/webm;codecs=h264,opus',
    'video/webm;codecs=h264',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp8',
    'video/webm;codecs=vp9',
    'video/webm',
  ];
  const chosenMimeType =
    candidateMimeTypes.find((t) => MediaRecorder.isTypeSupported(t)) ||
    'video/webm';

  const recorder = new MediaRecorder(recordStream, {
    mimeType: chosenMimeType,
    videoBitsPerSecond,
  });

  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  const finished = new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      const outType = chosenMimeType.startsWith('video/mp4')
        ? 'video/mp4'
        : 'video/webm';
      resolve(new Blob(chunks, { type: outType }));
    };
  });

  recorder.start(200);

  // Start native continuous video playback so frames decode smoothly in hardware with zero seek lag
  let nativePlaybackWorking = false;
  try {
    await video.play();
    nativePlaybackWorking = !video.paused;
  } catch {
    video.muted = true;
    try {
      await video.play();
      nativePlaybackWorking = !video.paused;
    } catch {
      nativePlaybackWorking = false;
    }
  }

  if (nativePlaybackWorking) {
    // Real-time continuous 60fps render loop across the ENTIRE exportDuration
    await new Promise<void>((resolve) => {
      const startWallMs = performance.now();
      let settled = false;
      let rafId = 0;

      const finishLoop = () => {
        if (settled) return;
        settled = true;
        if (rafId) cancelAnimationFrame(rafId);
        clearInterval(intervalId);
        video.onended = null;
        resolve();
      };

      const tick = () => {
        if (settled) return;
        const wallElapsedSec = (performance.now() - startWallMs) / 1000;

        let timelineTime: number;
        if (isSingleUntrimmedClip) {
          timelineTime = Math.max(wallElapsedSec * 0.98, video.currentTime);
        } else {
          timelineTime = wallElapsedSec;
          const mapped = mapTimelineTimeToSourceVideo(videoClips, timelineTime);
          const targetSpeed = mapped.clip?.speed || 1;
          if (Math.abs(video.playbackRate - targetSpeed) > 0.05) {
            video.playbackRate = targetSpeed;
          }
          // Only seek at non-contiguous cut boundaries between clips (never during continuous playback!)
          if (
            !video.seeking &&
            Math.abs(video.currentTime - mapped.sourceTime) > 0.35
          ) {
            try {
              video.currentTime = mapped.sourceTime;
            } catch {
              // ignore
            }
          }
        }

        const clampedTime = Math.min(exportDuration, timelineTime);
        renderFrameAtTimelineTime(clampedTime);

        const pct = Math.min(
          99,
          Math.max(5, Math.round((clampedTime / exportDuration) * 100))
        );
        onProgress(pct);

        if (
          timelineTime >= exportDuration - 0.02 ||
          (isSingleUntrimmedClip && video.ended)
        ) {
          renderFrameAtTimelineTime(exportDuration);
          finishLoop();
          return;
        }
      };

      // Use both 16ms interval (continues even if tab is backgrounded) and rAF for butter-smooth 60fps
      const intervalId = setInterval(tick, 16);
      const rafLoop = () => {
        if (settled) return;
        tick();
        rafId = requestAnimationFrame(rafLoop);
      };
      rafId = requestAnimationFrame(rafLoop);

      if (isSingleUntrimmedClip) {
        video.onended = () => {
          renderFrameAtTimelineTime(exportDuration);
          finishLoop();
        };
      }
    });
  } else {
    // Fallback frame-stepped rendering if browser blocked video.play() in headless environment
    const fps = 30;
    const totalFrames = Math.max(30, Math.round(exportDuration * fps));
    for (let f = 0; f <= totalFrames; f++) {
      const timelineTime = (f / totalFrames) * exportDuration;
      const mapped = mapTimelineTimeToSourceVideo(videoClips, timelineTime);
      await seekVideoTo(video, mapped.sourceTime);
      renderFrameAtTimelineTime(timelineTime);
      onProgress(Math.min(99, Math.round(((f + 1) / (totalFrames + 1)) * 100)));
      await new Promise((r) => setTimeout(r, 1000 / fps));
    }
  }

  video.pause();
  if (recorder.state === 'recording') {
    try {
      recorder.requestData();
    } catch {
      // ignore
    }
    recorder.stop();
  }
  const finalBlob = await finished;
  if (playingWithAudio) {
    recordStream.getTracks().forEach((t) => t.stop());
  }
  video.src = '';
  onProgress(100);
  return finalBlob;
}

