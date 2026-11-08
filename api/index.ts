import {
  buildSpeechAlignedCaptionPayload,
  cleanSpokenScriptText,
  encodeMonoWavFromSamples,
  hasEnglishTranslatedHindiBug,
  upgradeSegmentsToHinglishMultiScript,
  normalizeAiGeneratedSegments,
} from '../src/utils/aiCaptionParser.ts';

interface ReelCaptionSegment {
  start: number;
  end: number;
  original?: string;
  hindi?: string;
  hinglish?: string;
  english?: string;
}

interface ReelCaptionResponse {
  language?: string;
  segments?: ReelCaptionSegment[];
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

function createWavChunkFromBuffer(
  wavBuf: Buffer,
  startSec: number,
  endSec: number
): string | null {
  if (wavBuf.length < 44) return null;
  if (
    wavBuf.subarray(0, 4).toString() !== 'RIFF' ||
    wavBuf.subarray(8, 12).toString() !== 'WAVE'
  ) {
    return null;
  }

  let fmtOffset = 12;
  while (
    fmtOffset < wavBuf.length - 8 &&
    wavBuf.subarray(fmtOffset, fmtOffset + 4).toString() !== 'fmt '
  ) {
    const chunkSize = wavBuf.readUInt32LE(fmtOffset + 4);
    fmtOffset += 8 + chunkSize;
  }
  if (fmtOffset >= wavBuf.length - 8) return null;

  const audioFormat = wavBuf.readUInt16LE(fmtOffset + 8);
  const numChannels = wavBuf.readUInt16LE(fmtOffset + 10);
  const sampleRate = wavBuf.readUInt32LE(fmtOffset + 12);
  const byteRate = wavBuf.readUInt32LE(fmtOffset + 16);
  const blockAlign = wavBuf.readUInt16LE(fmtOffset + 20) || 2;
  const bitsPerSample = wavBuf.readUInt16LE(fmtOffset + 22) || 16;

  let dataOffset = fmtOffset + 8 + wavBuf.readUInt32LE(fmtOffset + 4);
  while (
    dataOffset < wavBuf.length - 8 &&
    wavBuf.subarray(dataOffset, dataOffset + 4).toString() !== 'data'
  ) {
    const chunkSize = wavBuf.readUInt32LE(dataOffset + 4);
    dataOffset += 8 + chunkSize;
  }
  if (dataOffset >= wavBuf.length - 8) return null;

  const totalPcmBytes = wavBuf.readUInt32LE(dataOffset + 4);
  const rawPcm = wavBuf.subarray(dataOffset + 8, dataOffset + 8 + totalPcmBytes);
  const bytesPerSec =
    byteRate || sampleRate * numChannels * (bitsPerSample / 8) || 32000;

  const startByte =
    Math.floor((startSec * bytesPerSec) / blockAlign) * blockAlign;
  const endByte = Math.min(
    rawPcm.length,
    Math.ceil((endSec * bytesPerSec) / blockAlign) * blockAlign
  );
  const sliceLen = Math.max(0, endByte - startByte);
  if (sliceLen <= 0) return null;

  const chunkPcm = rawPcm.subarray(startByte, startByte + sliceLen);
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + chunkPcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(audioFormat, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(chunkPcm.length, 40);

  return Buffer.concat([header, chunkPcm]).toString('base64');
}

async function callSingleReelCaptionPayload(
  audioBase64: string,
  attempt = 1
): Promise<ReelCaptionResponse | null> {
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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 55000);

  try {
    const response = await fetch(
      'https://reel-lingo-caption-studio.lovable.app/_serverFn/583f13a92f82120d39e37a767cba7c57a7688ed0fd5431d572eb3afb82c11939',
      {
        method: 'POST',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
          'Origin': 'https://reel-lingo-caption-studio.lovable.app',
          'Referer': 'https://reel-lingo-caption-studio.lovable.app/',
          'Content-Type': 'application/json',
          'Accept':
            'application/x-tss-framed, application/x-ndjson, application/json',
          'x-tsr-serverfn': 'true',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      console.warn(
        `[ReelCaption Serverless] attempt ${attempt} responded with HTTP ${response.status}`
      );
      return null;
    }

    const rawJson = await response.json();
    const parsed = parseSerovalNode(rawJson);
    if (parsed?.result && Array.isArray(parsed.result.segments)) {
      return {
        language: parsed.result.language,
        segments: parsed.result.segments,
      };
    }
    return null;
  } catch (err) {
    console.error(`[ReelCaption Serverless] attempt ${attempt} error:`, err);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function transcribeWithReelCaptionServerless(
  audioBase64: string
): Promise<ReelCaptionResponse | null> {
  const wavBuf = Buffer.from(audioBase64, 'base64');

  let totalDurationSec = 0;
  if (
    wavBuf.length >= 44 &&
    wavBuf.subarray(0, 4).toString() === 'RIFF' &&
    wavBuf.subarray(8, 12).toString() === 'WAVE'
  ) {
    const sampleRate = wavBuf.readUInt32LE(24) || 16000;
    const channels = wavBuf.readUInt16LE(22) || 1;
    const bitsPerSample = wavBuf.readUInt16LE(34) || 16;
    const bytesPerSec = sampleRate * channels * (bitsPerSample / 8);
    totalDurationSec = (wavBuf.length - 44) / Math.max(1, bytesPerSec);
  }

  if (totalDurationSec > 16) {
    const targetChunkDuration = 14;
    const chunkCount = Math.ceil(totalDurationSec / targetChunkDuration);
    const chunkPromises: Promise<ReelCaptionSegment[]>[] = [];
    let detectedLang = 'Hinglish (Hindi + English mix)';

    for (let c = 0; c < chunkCount; c++) {
      const startSec = c * targetChunkDuration;
      const endSec = Math.min(totalDurationSec, (c + 1) * targetChunkDuration);
      const chunkB64 = createWavChunkFromBuffer(wavBuf, startSec, endSec);
      if (!chunkB64) continue;

      const p = (async (): Promise<ReelCaptionSegment[]> => {
        let chunkRes = await callSingleReelCaptionPayload(chunkB64, 1);
        if (!chunkRes && c === 0) {
          await new Promise((r) => setTimeout(r, 500));
          chunkRes = await callSingleReelCaptionPayload(chunkB64, 2);
        }
        if (chunkRes?.language) {
          detectedLang = chunkRes.language;
        }
        if (chunkRes && Array.isArray(chunkRes.segments)) {
          return chunkRes.segments.map((seg) => ({
            ...seg,
            start: Number((Number(seg.start || 0) + startSec).toFixed(2)),
            end: Number((Number(seg.end || 0) + startSec).toFixed(2)),
          }));
        }
        return [];
      })();

      chunkPromises.push(p);
    }

    const chunkResults = await Promise.all(chunkPromises);
    const allSegments = chunkResults.flat().sort((a, b) => a.start - b.start);

    if (allSegments.length > 0) {
      return {
        language: detectedLang,
        segments: allSegments,
      };
    }
  }

  const firstAttempt = await callSingleReelCaptionPayload(audioBase64, 1);
  if (firstAttempt) return firstAttempt;

  await new Promise((r) => setTimeout(r, 600));
  return callSingleReelCaptionPayload(audioBase64, 2);
}

function synthesizeFormantSpeechWavBase64(text: string, durationSec = 5.4): string {
  const sampleRate = 16000;
  const words = text.trim().split(/\s+/).filter(Boolean);
  const totalSamples = Math.max(sampleRate, Math.floor(sampleRate * durationSec));
  const samples = new Float32Array(totalSamples);
  const usableSec = Math.max(0.8, durationSec - 0.3);
  const wordSpan = usableSec / Math.max(1, words.length);

  words.forEach((w, idx) => {
    const wStartSec = 0.15 + idx * wordSpan;
    const wDurSec = Math.max(0.14, wordSpan * 0.82);
    const startSample = Math.floor(wStartSec * sampleRate);
    const endSample = Math.min(
      totalSamples,
      Math.floor((wStartSec + wDurSec) * sampleRate)
    );
    const basePitch = 135 + ((w.charCodeAt(0) || 65) % 35);

    for (let s = startSample; s < endSample; s++) {
      const rel = (s - startSample) / Math.max(1, endSample - startSample);
      const env = Math.sin(Math.PI * rel);
      const t = s / sampleRate;
      const f0 = Math.sin(2 * Math.PI * basePitch * t);
      const f1 = Math.sin(2 * Math.PI * (basePitch * 2) * t) * 0.45;
      const f2 = Math.sin(2 * Math.PI * 720 * t) * 0.25;
      samples[s] = (f0 + f1 + f2) * 0.28 * env;
    }
  });

  const wavBytes = encodeMonoWavFromSamples(samples, sampleRate);
  return Buffer.from(wavBytes).toString('base64');
}

export async function handleGenerateCaptionsBody(body: any): Promise<{
  status: number;
  payload: any;
}> {
  const {
    audioBase64,
    speechWindows = [],
    duration = 6.0,
    scriptId = 'hinglish',
    linesMode = 1,
    customSpokenScript,
    fileName = 'video.mp4',
  } = body || {};

  const safeDuration = Math.max(1.0, Number(duration) || 6.0);
  const cleanedCustomScript = cleanSpokenScriptText(customSpokenScript || '');

  if (audioBase64) {
    try {
      const reelData = await transcribeWithReelCaptionServerless(audioBase64);
      if (reelData && Array.isArray(reelData.segments) && reelData.segments.length > 0) {
        const rawWords = reelData.segments.map((seg) => {
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

        const normalizedCards = normalizeAiGeneratedSegments(
          { words: rawWords, language: reelData.language },
          safeDuration,
          linesMode || 1
        );

        if (normalizedCards.length > 0) {
          return {
            status: 200,
            payload: {
              detectedLanguage: reelData.language || 'Hinglish (Hindi + English mix)',
              transcript: rawWords.map((w) => w.text).join(' '),
              segments: normalizedCards,
            },
          };
        }
      }
    } catch (err) {
      console.error('[Serverless Caption Handler] ReelCaption error:', err);
    }
  }

  if (!cleanedCustomScript && audioBase64) {
    return {
      status: 502,
      payload: {
        error:
          'ReelCaption was unable to detect clear speech in this video audio. Please try again or provide a custom script in the Captions panel.',
      },
    };
  }

  const alignedPayload = buildSpeechAlignedCaptionPayload({
    scriptText: cleanedCustomScript || undefined,
    speechWindows,
    duration: safeDuration,
    fileName,
  });

  if (
    scriptId !== 'english' &&
    alignedPayload.segments &&
    hasEnglishTranslatedHindiBug(alignedPayload.segments)
  ) {
    alignedPayload.segments = upgradeSegmentsToHinglishMultiScript(
      alignedPayload.segments
    );
  }

  return {
    status: 200,
    payload: alignedPayload,
  };
}

export async function handleTtsBody(body: any): Promise<{
  status: number;
  payload: any;
}> {
  const { text } = body || {};
  if (!text || !String(text).trim()) {
    return {
      status: 400,
      payload: { error: 'Text is required for TTS generation.' },
    };
  }
  const fallbackAudioBase64 = synthesizeFormantSpeechWavBase64(
    String(text).trim(),
    5.4
  );
  return {
    status: 200,
    payload: {
      audioBase64: fallbackAudioBase64,
      mimeType: 'audio/wav',
    },
  };
}

import { handleTemplatesApi } from '../src/utils/templatesApiHandler.ts';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const url = String(req.url || '');

  if (url.includes('/health')) {
    res.status(200).json({
      status: 'ok',
      reelCaptionReady: true,
      vercelServerless: true,
    });
    return;
  }

  if (url.includes('/templates') || url.includes('/text-templates')) {
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    let query = req.query || {};
    if (req.url && (!query || Object.keys(query).length === 0)) {
      try {
        const urlObj = new URL(req.url, 'http://localhost');
        query = Object.fromEntries(urlObj.searchParams.entries());
      } catch {
        // ignore
      }
    }
    const { status, payload } = handleTemplatesApi(query);
    res.status(status).json(payload);
    return;
  }

  if (url.includes('/captions/tts') && req.method === 'POST') {
    const result = await handleTtsBody(req.body);
    res.status(result.status).json(result.payload);
    return;
  }

  if (url.includes('/captions/generate') || req.method === 'POST') {
    const result = await handleGenerateCaptionsBody(req.body);
    res.status(result.status).json(result.payload);
    return;
  }

  res.status(200).json({
    status: 'ok',
    reelCaptionReady: true,
  });
}
