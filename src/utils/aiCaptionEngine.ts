import {
  normalizeAiGeneratedSegments,
  computeAudioRmsEnergy,
  encodeMonoWavFromSamples,
  detectSpeechWindowsFromSamples,
  type RawAiCaptionPayload,
  type SpeechWindow,
} from './aiCaptionParser';
import type { CaptionSegment } from './editorLogic';

export interface AiCaptionProgress {
  phase: 'extracting_audio' | 'transcribing' | 'aligning' | 'completed' | 'error';
  percent: number;
  statusMessage: string;
}

export interface VideoFrameSample {
  timestamp: number;
  mimeType: string;
  base64Data: string;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const sub = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode.apply(null, Array.from(sub));
  }
  return btoa(binary);
}

function seekVideoElement(video: HTMLVideoElement, timeSec: number): Promise<void> {
  return new Promise((resolve) => {
    const target = Math.max(0, Math.min((video.duration || 6) - 0.05, timeSec));
    if (Math.abs(video.currentTime - target) < 0.03 && video.readyState >= 2) {
      resolve();
      return;
    }
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      video.removeEventListener('seeked', finish);
      video.removeEventListener('error', finish);
      resolve();
    };
    const timer = setTimeout(finish, 1200);
    video.addEventListener(
      'seeked',
      () => {
        clearTimeout(timer);
        finish();
      },
      { once: true }
    );
    video.addEventListener(
      'error',
      () => {
        clearTimeout(timer);
        finish();
      },
      { once: true }
    );
    try {
      video.currentTime = target;
    } catch {
      clearTimeout(timer);
      finish();
    }
  });
}

/**
 * Extracts 4 lightweight keyframe JPEGs from a video URL to provide visual context
 * (and fallback text/scene understanding if the video has no audio stream).
 */
async function extractKeyframeSamples(
  videoUrl: string,
  knownDuration?: number,
  sampleCount = 4
): Promise<{ frames: VideoFrameSample[]; duration: number }> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.src = videoUrl;

    const timeout = setTimeout(() => {
      resolve({ frames: [], duration: knownDuration || 6 });
    }, 6000);

    video.onloadeddata = async () => {
      clearTimeout(timeout);
      try {
        let dur = video.duration;
        if (!Number.isFinite(dur) || dur <= 0) {
          dur = knownDuration && knownDuration > 0 ? knownDuration : 6;
        }
        const vw = video.videoWidth || 540;
        const vh = video.videoHeight || 960;
        const canvas = document.createElement('canvas');
        const targetW = 360;
        const targetH = Math.max(200, Math.round((targetW * vh) / vw));
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');

        const frames: VideoFrameSample[] = [];
        for (let i = 0; i < sampleCount; i++) {
          const ts = Number(((dur * (i + 0.4)) / sampleCount).toFixed(2));
          await seekVideoElement(video, ts);
          if (ctx) {
            ctx.drawImage(video, 0, 0, targetW, targetH);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.68);
            const base64Data = dataUrl.split(',')[1] || '';
            if (base64Data) {
              frames.push({
                timestamp: ts,
                mimeType: 'image/jpeg',
                base64Data,
              });
            }
          }
        }
        video.src = '';
        resolve({ frames, duration: dur });
      } catch {
        video.src = '';
        resolve({ frames: [], duration: knownDuration || 6 });
      }
    };

    video.onerror = () => {
      clearTimeout(timeout);
      resolve({ frames: [], duration: knownDuration || 6 });
    };
  });
}

/**
 * Decodes the audio track from a video File, Blob, or URL, computes acoustic Voice Activity
 * Detection (speechWindows), and downsamples to 16kHz mono 16-bit PCM WAV for Gemini API.
 */
async function extractDownsampledWavFromVideo(
  source: File | Blob | string,
  maxDurationSec = 90
): Promise<{
  audioBase64: string | null;
  audioMimeType: string;
  hasAudibleSpeech: boolean;
  durationSec: number;
  speechWindows: SpeechWindow[];
}> {
  let arrayBuffer: ArrayBuffer | null = null;
  let rawMimeType = 'video/mp4';

  try {
    if (typeof source === 'string') {
      const resp = await fetch(source);
      rawMimeType = resp.headers.get('content-type') || 'video/mp4';
      arrayBuffer = await resp.arrayBuffer();
    } else {
      rawMimeType = source.type || 'video/mp4';
      arrayBuffer = await source.arrayBuffer();
    }
  } catch {
    return {
      audioBase64: null,
      audioMimeType: 'audio/wav',
      hasAudibleSpeech: false,
      durationSec: 6,
      speechWindows: [],
    };
  }

  if (!arrayBuffer || arrayBuffer.byteLength === 0) {
    return {
      audioBase64: null,
      audioMimeType: 'audio/wav',
      hasAudibleSpeech: false,
      durationSec: 6,
      speechWindows: [],
    };
  }

  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

  if (AudioCtx) {
    const audioCtx = new AudioCtx();
    try {
      const bufferCopy = arrayBuffer.slice(0);
      const decoded = await audioCtx.decodeAudioData(bufferCopy);
      const actualDuration = Math.min(maxDurationSec, decoded.duration || 6);
      // Keep base64 payload safely under Vercel Serverless 4.5 MB request limit
      const targetSampleRate = actualDuration > 45 ? 12000 : 16000;
      const frameCount = Math.max(1600, Math.ceil(actualDuration * targetSampleRate));

      const offlineCtx = new OfflineAudioContext(1, frameCount, targetSampleRate);
      const bufferSource = offlineCtx.createBufferSource();
      bufferSource.buffer = decoded;
      bufferSource.connect(offlineCtx.destination);
      bufferSource.start(0);

      const rendered = await offlineCtx.startRendering();
      const monoSamples = rendered.getChannelData(0);
      const rms = computeAudioRmsEnergy(monoSamples);
      const hasAudibleSpeech = rms > 0.0025;
      const speechWindows = detectSpeechWindowsFromSamples(
        monoSamples,
        targetSampleRate,
        decoded.duration || actualDuration
      );

      const wavBytes = encodeMonoWavFromSamples(monoSamples, targetSampleRate);
      const audioBase64 = uint8ArrayToBase64(wavBytes);

      await audioCtx.close().catch(() => {});
      return {
        audioBase64,
        audioMimeType: 'audio/wav',
        hasAudibleSpeech,
        durationSec: decoded.duration || actualDuration,
        speechWindows,
      };
    } catch {
      await audioCtx.close().catch(() => {});
      if (arrayBuffer.byteLength <= 15 * 1024 * 1024) {
        return {
          audioBase64: uint8ArrayToBase64(new Uint8Array(arrayBuffer)),
          audioMimeType:
            rawMimeType.startsWith('video/') || rawMimeType.startsWith('audio/')
              ? rawMimeType.split(';')[0]
              : 'video/mp4',
          hasAudibleSpeech: false,
          durationSec: 6,
          speechWindows: [],
        };
      }
    }
  }

  return {
    audioBase64: null,
    audioMimeType: 'audio/wav',
    hasAudibleSpeech: false,
    durationSec: 6,
    speechWindows: [],
  };
}

function parseSerovalNode(node: any, idMap = new Map<number, any>()): any {
  if (!node || typeof node !== 'object') return node;
  const id = node.i;
  let result: any;
  switch (node.t) {
    case 0:
      result = typeof node.s === 'number' ? node.s : Number(node.s);
      break;
    case 1:
      result = String(node.s);
      break;
    case 2:
      result = Boolean(node.s);
      break;
    case 3:
      result = undefined;
      break;
    case 4:
      result = null;
      break;
    case 9:
      result = [];
      if (id !== undefined) idMap.set(id, result);
      if (Array.isArray(node.a)) {
        for (const item of node.a) {
          result.push(parseSerovalNode(item, idMap));
        }
      }
      return result;
    case 10:
      result = {};
      if (id !== undefined) idMap.set(id, result);
      if (node.p && Array.isArray(node.p.k) && Array.isArray(node.p.v)) {
        for (let idx = 0; idx < node.p.k.length; idx++) {
          const key = node.p.k[idx];
          const valNode = node.p.v[idx];
          result[key] = parseSerovalNode(valNode, idMap);
        }
      }
      return result;
    default:
      if (node.o !== undefined && idMap.has(node.o)) {
        return idMap.get(node.o);
      }
      return node.s !== undefined ? node.s : node;
  }
  if (id !== undefined) idMap.set(id, result);
  return result;
}

async function transcribeDirectWithReelCaptionClient(
  audioBase64: string,
  scriptId: string
): Promise<{ language?: string; rawWords: any[] } | null> {
  const payload = {
    t: {
      t: 10,
      i: 0,
      p: {
        k: ['data'],
        v: [
          {
            t: 10,
            i: 1,
            p: {
              k: ['audioBase64'],
              v: [{ t: 1, s: audioBase64 }],
            },
          },
        ],
      },
    },
  };

  try {
    const res = await fetch(
      'https://reel-lingo-caption-studio.lovable.app/_serverFn/583f13a92f82120d39e37a767cba7c57a7688ed0fd5431d572eb3afb82c11939',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept':
            'application/x-tss-framed, application/x-ndjson, application/json',
          'x-tsr-serverfn': 'true',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) return null;
    const rawJson = await res.json();
    const parsed = parseSerovalNode(rawJson);
    if (parsed?.result && Array.isArray(parsed.result.segments)) {
      const rawWords = parsed.result.segments.map((seg: any) => {
        const hinglishText = (seg.hinglish || seg.original || '').trim();
        const hindiText = (seg.hindi || seg.original || hinglishText).trim();
        const englishText = (seg.english || seg.original || hinglishText).trim();

        let activeText = hinglishText;
        if (scriptId === 'devanagari' || scriptId === 'hi-deva') {
          activeText = hindiText;
        } else if (scriptId === 'english' || scriptId === 'en') {
          activeText = englishText;
        }

        return {
          text: activeText,
          hinglish: hinglishText,
          hiDeva: hindiText,
          en: englishText,
          start: Number(seg.start),
          end: Number(seg.end),
        };
      });

      return {
        language: parsed.result.language || 'Hinglish (Hindi + English mix)',
        rawWords,
      };
    }
    return null;
  } catch (err) {
    console.error('[ReelCaption Client Fallback] Error:', err);
    return null;
  }
}

/**
 * Main client-to-server pipeline that extracts the spoken audio track, acoustic speech windows,
 * and keyframes from any video in the editor, sends it to the server-side Gemini API endpoint
 * (/api/captions/generate), and returns word-by-word timed CaptionSegment[].
 */
export async function generateAiCaptionsFromVideo(params: {
  videoSource: File | Blob | string;
  videoUrlForFrames: string;
  duration: number;
  scriptId?: string;
  customSpokenScript?: string;
  detectedTextsHint?: string;
  linesMode?: 1 | 2;
  fileName?: string;
  onProgress?: (prog: AiCaptionProgress) => void;
}): Promise<{
  segments: CaptionSegment[];
  transcript: string;
  detectedLanguage: string;
}> {
  const {
    videoSource,
    videoUrlForFrames,
    duration,
    scriptId = 'hinglish',
    customSpokenScript,
    detectedTextsHint,
    linesMode = 1,
    fileName = 'video.mp4',
    onProgress,
  } = params;

  onProgress?.({
    phase: 'extracting_audio',
    percent: 18,
    statusMessage: 'Extracting 16kHz audio waveform & voice activity windows...',
  });

  const [audioResult, frameResult] = await Promise.all([
    extractDownsampledWavFromVideo(videoSource),
    extractKeyframeSamples(videoUrlForFrames, duration, 4),
  ]);

  const effectiveDuration =
    Number.isFinite(duration) && duration > 0
      ? duration
      : frameResult.duration || audioResult.durationSec || 6;

  onProgress?.({
    phase: 'transcribing',
    percent: 36,
    statusMessage: 'Transcribing spoken words with ReelCaption AI...',
  });

  let currentPct = 38;
  const progressMessages = [
    'Listening to audio with ReelCaption AI engine...',
    'Detecting spoken Hindi & Hinglish phonetics...',
    'Transcribing words and timing each syllable...',
    'Aligning word-level timestamps with voice peaks...',
    'Generating synchronized Hindi & Romanized Hinglish segments...',
    'Formatting high-impact caption cards...',
  ];
  let msgIdx = 0;

  const progressInterval = setInterval(() => {
    if (currentPct < 60) {
      currentPct += 2.2;
    } else if (currentPct < 80) {
      currentPct += 1.4;
    } else if (currentPct < 94) {
      currentPct += 0.7;
    }
    msgIdx = (msgIdx + 1) % progressMessages.length;
    onProgress?.({
      phase: 'transcribing',
      percent: Math.round(Math.min(94, currentPct)),
      statusMessage: progressMessages[msgIdx],
    });
  }, 300);

  let response: Response | null = null;
  try {
    response = await fetch('/api/captions/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audioBase64: audioResult.audioBase64,
        audioMimeType: audioResult.audioMimeType,
        hasAudibleSpeech: audioResult.hasAudibleSpeech,
        speechWindows: audioResult.speechWindows,
        frameSamples: audioResult.hasAudibleSpeech ? [] : frameResult.frames,
        duration: effectiveDuration,
        scriptId,
        linesMode,
        customSpokenScript: customSpokenScript?.trim() || undefined,
        detectedTextsHint: detectedTextsHint?.trim() || undefined,
        fileName,
      }),
    });
  } catch {
    // Network or server endpoint unreachable
  } finally {
    clearInterval(progressInterval);
  }

  let data: (RawAiCaptionPayload & { detectedLanguage?: string }) | null = null;

  if (response && response.ok) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  // If server API returned 404 (e.g. Vercel static deployment) or failed, run client-side ReelCaption fallback!
  if (!data && audioResult.audioBase64) {
    console.warn('[AI Caption Engine] Backend endpoint returned error/404. Activating direct ReelCaption client fallback...');
    const directResult = await transcribeDirectWithReelCaptionClient(
      audioResult.audioBase64,
      scriptId
    );

    if (directResult && directResult.rawWords.length > 0) {
      data = {
        detectedLanguage: directResult.language,
        transcript: directResult.rawWords.map((w) => w.text).join(' '),
        words: directResult.rawWords,
      };
    }
  }

  if (!data) {
    throw new Error('ReelCaption AI was unable to transcribe audio in this video. Please check your network connection or try another video.');
  }

  onProgress?.({
    phase: 'aligning',
    percent: 96,
    statusMessage: 'Synchronizing word-level timestamps & Indian language scripts...',
  });

  const segments = normalizeAiGeneratedSegments(
    data,
    effectiveDuration,
    linesMode
  );

  if (segments.length === 0) {
    throw new Error('Could not generate captions from this video.');
  }

  const transcript =
    data.transcript ||
    segments.map((s) => s.words.map((w) => w.text).join(' ')).join(' ');

  onProgress?.({
    phase: 'completed',
    percent: 100,
    statusMessage: `Generated ${segments.length} synchronized caption cards (${segments.reduce(
      (acc, s) => acc + s.words.length,
      0
    )} words).`,
  });

  return {
    segments,
    transcript,
    detectedLanguage: data.detectedLanguage || data.language || 'Hinglish',
  };
}

