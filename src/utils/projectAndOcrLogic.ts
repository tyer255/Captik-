import {
  type CaptionSegment,
  type CaptionWord,
  type ColorAdjustments,
  type CustomStyleOverrides,
  type TimelineOverlayItem,
  type VideoTimelineClip,
  type AudioTimelineClip,
  createInitialVideoClips,
  createInitialAudioClips,
  DEFAULT_ADJUSTMENTS,
} from './editorLogic.ts';

export interface RawFrameOcrBlock {
  timestamp: number;
  text: string;
  confidence: number;
  /** Bounding box in percentage (0..100) of video frame */
  x: number;
  y: number;
  width: number;
  height: number;
  bgColor?: string;
  textColor?: string;
  frameThumbDataUrl?: string;
}

export interface DetectedVideoTextItem {
  id: string;
  originalText: string;
  text: string;
  startTime: number;
  endTime: number;
  /** Center X position (0..100%) where replacement text is drawn */
  x: number;
  /** Center Y position (0..100%) where replacement text is drawn */
  y: number;
  /** Original bounding box center X (0..100%) for masking original video text */
  originalX: number;
  /** Original bounding box center Y (0..100%) for masking original video text */
  originalY: number;
  /** Bounding box width (0..100%) */
  width: number;
  /** Bounding box height (0..100%) */
  height: number;
  confidence: number;
  bgColor: string;
  textColor: string;
  fontScale: number;
  /** Whether to cover/mask the original burned-in video text region */
  maskOriginal: boolean;
  /** Whether the user chose to remove/erase this detected text from the video */
  isRemoved: boolean;
  /** Optional style preset ID ('poster', 'b01'..'b10', or 'template') */
  stylePreset: string;
  frameThumbDataUrl?: string;
}

export interface CaptikProject {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  videoUrl: string;
  videoFileName: string;
  isCustomUpload: boolean;
  duration: number;
  aspectRatio: '9:16' | '16:9' | '1:1' | '4:5';
  posterUrl: string;
  frameThumbnails: string[];
  segments: CaptionSegment[];
  detectedTexts: DetectedVideoTextItem[];
  templateId: string;
  styleOverrides: CustomStyleOverrides;
  adjustments: ColorAdjustments;
  overlays: TimelineOverlayItem[];
  videoClips?: VideoTimelineClip[];
  audioClips?: AudioTimelineClip[];
  isAudioLinked?: boolean;
  ocrStatus: 'idle' | 'scanning' | 'done' | 'error';
  ocrError?: string;
  ocrLastRunAt?: number;
}

/**
 * Computes evenly spaced timestamps across a video's duration for OCR frame extraction.
 */
export function computeSampleTimestamps(
  durationSec: number,
  maxSamples = 8
): number[] {
  const cleanDur = Number.isFinite(durationSec) && durationSec > 0 ? durationSec : 6;
  const count = Math.max(2, Math.min(maxSamples, Math.ceil(cleanDur * 1.2)));
  const step = cleanDur / count;
  const timestamps: number[] = [];
  for (let i = 0; i < count; i++) {
    const t = Number(Math.min(cleanDur - 0.05, Math.max(0.08, i * step + step * 0.35)).toFixed(2));
    if (!timestamps.includes(t)) {
      timestamps.push(t);
    }
  }
  return timestamps;
}

/**
 * Cleans raw OCR output strings while preserving meaningful punctuation, numbers, and words.
 */
export function normalizeOcrText(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/[\r\n]+/g, ' ')
    .replace(/[|\\~`^]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculates normalized similarity (0..1) between two OCR strings to merge adjacent frames.
 */
export function computeTextSimilarity(a: string, b: string): number {
  const s1 = normalizeOcrText(a).toLowerCase();
  const s2 = normalizeOcrText(b).toLowerCase();
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1;
  if (s1.includes(s2) || s2.includes(s1)) {
    const minLen = Math.min(s1.length, s2.length);
    const maxLen = Math.max(s1.length, s2.length);
    return minLen / maxLen >= 0.5 ? 0.85 : 0.4;
  }

  const words1 = new Set(s1.split(/\s+/));
  const words2 = new Set(s2.split(/\s+/));
  let overlap = 0;
  for (const w of words1) {
    if (words2.has(w)) overlap++;
  }
  const union = new Set([...words1, ...words2]).size;
  return union > 0 ? overlap / union : 0;
}

/**
 * Merges raw frame-by-frame OCR detections into continuous timed DetectedVideoTextItem objects.
 */
export function mergeFrameOcrDetections(
  frameDetections: RawFrameOcrBlock[],
  sampleStepSec: number,
  videoDuration: number
): DetectedVideoTextItem[] {
  const safeDuration = Math.max(1, videoDuration || 6);
  const halfStep = Math.max(0.25, sampleStepSec / 2);

  // Filter out noise / 1-char artifacts
  const validBlocks = frameDetections
    .map((b) => ({
      ...b,
      text: normalizeOcrText(b.text),
    }))
    .filter((b) => {
      if (b.text.length < 2) return false;
      // Require at least two alphanumeric/script characters
      const alphaCount = (b.text.match(/[\p{L}\p{N}]/gu) || []).length;
      return alphaCount >= 2 && b.confidence >= 25;
    })
    .sort((a, b) => a.timestamp - b.timestamp || a.y - b.y);

  const merged: DetectedVideoTextItem[] = [];

  for (const block of validBlocks) {
    const blockStart = Number(Math.max(0, block.timestamp - halfStep * 0.7).toFixed(2));
    const blockEnd = Number(
      Math.min(safeDuration, block.timestamp + Math.max(0.6, sampleStepSec * 0.85)).toFixed(2)
    );

    // Check if an existing merged item has similar text, nearby Y position, and adjacent timing
    const match = merged.find(
      (m) =>
        Math.abs(m.originalY - block.y) <= 18 &&
        blockStart <= m.endTime + sampleStepSec * 0.65 &&
        computeTextSimilarity(m.originalText, block.text) >= 0.55
    );

    if (match) {
      match.endTime = Number(Math.max(match.endTime, blockEnd).toFixed(2));
      // Keep higher confidence text version
      if (block.confidence > match.confidence && block.text.length >= match.originalText.length * 0.8) {
        match.originalText = block.text;
        match.text = block.text;
        match.confidence = Math.round(block.confidence);
      }
      match.width = Math.max(match.width, Math.round(block.width));
      match.height = Math.max(match.height, Math.round(block.height));
    } else {
      merged.push({
        id: `ocr-${merged.length + 1}-${Math.round(block.timestamp * 100)}`,
        originalText: block.text,
        text: block.text,
        startTime: blockStart,
        endTime: Math.max(Number((blockStart + 0.6).toFixed(2)), blockEnd),
        x: Math.round(Math.max(10, Math.min(90, block.x))),
        y: Math.round(Math.max(8, Math.min(92, block.y))),
        originalX: Math.round(Math.max(10, Math.min(90, block.x))),
        originalY: Math.round(Math.max(8, Math.min(92, block.y))),
        width: Math.round(Math.max(16, Math.min(92, block.width))),
        height: Math.round(Math.max(6, Math.min(40, block.height))),
        confidence: Math.round(block.confidence),
        bgColor: block.bgColor || '#101218',
        textColor: block.textColor || '#FFFFFF',
        fontScale: 1,
        maskOriginal: true,
        isRemoved: false,
        stylePreset: 'template',
        frameThumbDataUrl: block.frameThumbDataUrl,
      });
    }
  }

  return merged;
}

/**
 * Converts DetectedVideoTextItem[] into word-timed CaptionSegment[] so users can also
 * apply all 106 Captik word-by-word templates directly to the detected video text!
 */
export function convertDetectedTextsToCaptionSegments(
  items: DetectedVideoTextItem[]
): CaptionSegment[] {
  const activeItems = items.filter((item) => !item.isRemoved && item.text.trim().length > 0);
  if (activeItems.length === 0) return [];

  let wordSeq = 1;
  return activeItems.map((item, segIdx) => {
    const rawTokens = item.text.trim().split(/\s+/).filter(Boolean);
    const duration = Math.max(0.4, item.endTime - item.startTime);
    const perWord = duration / Math.max(1, rawTokens.length);

    const words: CaptionWord[] = rawTokens.map((tok, wIdx) => {
      const start = Number((item.startTime + wIdx * perWord).toFixed(2));
      const end = Number((item.startTime + (wIdx + 1) * perWord).toFixed(2));
      const emphasis: 'none' | 'green' | 'amber' =
        wIdx === rawTokens.length - 1 && rawTokens.length > 1
          ? 'amber'
          : wIdx === 0 && rawTokens.length > 2
          ? 'green'
          : 'none';
      return {
        id: `ocr-w-${wordSeq++}`,
        text: tok,
        hiDeva: tok,
        ta: tok,
        bn: tok,
        en: tok,
        start,
        end,
        emphasis,
      };
    });

    return {
      id: `ocr-seg-${segIdx + 1}`,
      start: item.startTime,
      end: item.endTime,
      words,
      behindSubject: segIdx % 2 === 0,
    };
  });
}

/**
 * Updates a single DetectedVideoTextItem immutably. Automatically enables `maskOriginal`
 * if the user edits the text, moves its position, or removes it so the original burned-in
 * video text is cleanly covered.
 */
export function updateDetectedTextItem(
  items: DetectedVideoTextItem[],
  id: string,
  patch: Partial<DetectedVideoTextItem>
): DetectedVideoTextItem[] {
  return items.map((item) => {
    if (item.id !== id) return item;
    const next: DetectedVideoTextItem = { ...item, ...patch };
    const textChanged = next.text !== next.originalText;
    const posChanged =
      Math.abs(next.x - next.originalX) > 2 || Math.abs(next.y - next.originalY) > 2;
    if (
      patch.maskOriginal === undefined &&
      (textChanged || posChanged || next.isRemoved)
    ) {
      next.maskOriginal = true;
    }
    return next;
  });
}

/**
 * Returns all detected text items active at `currentTime`.
 */
export function getVisibleDetectedTextsAtTime(
  items: DetectedVideoTextItem[],
  currentTime: number
): DetectedVideoTextItem[] {
  return items.filter(
    (item) =>
      currentTime >= item.startTime - 0.05 && currentTime <= item.endTime + 0.05
  );
}

export function createNewProjectRecord(params: {
  id?: string;
  name: string;
  videoUrl: string;
  videoFileName?: string;
  fileName?: string;
  duration: number;
  isCustomUpload: boolean;
  aspectRatio?: '9:16' | '16:9' | '1:1' | '4:5';
  posterUrl?: string;
  frameThumbnails?: string[];
  templateId?: string;
  defaultStyleOverrides?: CustomStyleOverrides;
  styleOverrides?: CustomStyleOverrides;
  adjustments?: ColorAdjustments;
  overlays?: TimelineOverlayItem[];
  videoClips?: VideoTimelineClip[];
  audioClips?: AudioTimelineClip[];
  isAudioLinked?: boolean;
  ocrStatus?: 'idle' | 'scanning' | 'done' | 'completed' | 'error';
  segments?: CaptionSegment[];
  detectedTexts?: DetectedVideoTextItem[];
}): CaptikProject {
  const now = Date.now();
  const cleanName = params.name.trim() || 'Untitled Reel';
  const providedOverrides = params.styleOverrides || params.defaultStyleOverrides;
  const cleanDuration = Number(Math.max(0.5, params.duration || 6).toFixed(2));
  const initialVideoClips =
    params.videoClips && params.videoClips.length > 0
      ? params.videoClips
      : createInitialVideoClips(cleanDuration, cleanName);
  const initialAudioClips =
    params.audioClips && params.audioClips.length > 0
      ? params.audioClips
      : createInitialAudioClips(initialVideoClips, `${cleanName} Audio`);

  return {
    id: params.id || `proj-${now}-${Math.random().toString(36).slice(2, 7)}`,
    name: cleanName,
    createdAt: now,
    updatedAt: now,
    videoUrl: params.videoUrl,
    videoFileName:
      params.videoFileName || params.fileName || `${cleanName}.mp4`,
    isCustomUpload: params.isCustomUpload,
    duration: cleanDuration,
    aspectRatio: params.aspectRatio || '9:16',
    posterUrl: params.posterUrl || '/assets/terrace_poster.webp',
    frameThumbnails: params.frameThumbnails || [],
    segments: params.segments || [],
    detectedTexts: params.detectedTexts || [],
    templateId: params.templateId || 'look_garnet',
    styleOverrides: {
      fontScale: 1,
      yOffset: 76,
      xOffset: 50,
      primaryColor: '#FFFFFF',
      accentColor: '#A8FF1A',
      secondaryColor: '#10B981',
      bgOpacity: 0,
      behindSubject: true,
      behindHeroScale: 1,
      uppercase: false,
      shadowStrength: 14,
      strokeWidth: 0,
      animIn: 'Pop',
      animOut: 'Fade out',
      animLoop: 'Pulse',
      ...providedOverrides,
    },
    adjustments: params.adjustments
      ? { ...DEFAULT_ADJUSTMENTS, ...params.adjustments }
      : { ...DEFAULT_ADJUSTMENTS },
    overlays: params.overlays || [],
    videoClips: initialVideoClips,
    audioClips: initialAudioClips,
    isAudioLinked: params.isAudioLinked ?? true,
    ocrStatus:
      (params.ocrStatus as 'idle' | 'scanning' | 'done' | 'error') ||
      (params.detectedTexts && params.detectedTexts.length > 0
        ? 'done'
        : 'idle'),
  };
}
