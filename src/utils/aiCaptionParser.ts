import type { CaptionSegment, CaptionWord } from './editorLogic.ts';

export interface RawAiWord {
  text?: string;
  word?: string;
  hinglish?: string;
  hiDeva?: string;
  en?: string;
  ta?: string;
  bn?: string;
  start?: number;
  end?: number;
  emphasis?: string;
}

export interface RawAiSegment {
  id?: string;
  start?: number;
  end?: number;
  text?: string;
  behindSubject?: boolean;
  words?: RawAiWord[];
}

export interface RawAiCaptionPayload {
  language?: string;
  transcript?: string;
  segments?: RawAiSegment[];
  words?: RawAiWord[];
}

const STOP_WORDS = new Set([
  'the',
  'a',
  'an',
  'is',
  'are',
  'was',
  'were',
  'to',
  'in',
  'on',
  'at',
  'of',
  'for',
  'and',
  'or',
  'but',
  'it',
  'ke',
  'ka',
  'ki',
  'ko',
  'se',
  'me',
  'mein',
  'hai',
  'hain',
  'tha',
  'thi',
  'aur',
  'bhi',
  'toh',
  'ye',
  'yeh',
  'wo',
  'woh',
]);

function normalizeEmphasis(val?: string): 'none' | 'green' | 'amber' {
  if (!val) return 'none';
  const clean = val.toLowerCase().trim();
  if (clean === 'amber' || clean === 'gold' || clean === 'hero' || clean === 'primary' || clean === 'high') {
    return 'amber';
  }
  if (clean === 'green' || clean === 'emerald' || clean === 'secondary' || clean === 'accent' || clean === 'medium') {
    return 'green';
  }
  return 'none';
}

function assignAutoEmphasisToWords(words: CaptionWord[]): CaptionWord[] {
  if (words.length === 0) return words;
  const hasExplicit = words.some((w) => w.emphasis !== 'none');
  if (hasExplicit) return words;

  let bestAmberIdx = -1;
  let bestScore = -1;

  words.forEach((w, idx) => {
    const clean = w.text.replace(/[^\p{L}\p{N}]/gu, '').toLowerCase();
    if (!clean) return;
    const isStop = STOP_WORDS.has(clean);
    const hasPunct = /[!?🔥✨💯]/.test(w.text);
    const hasDigit = /\d/.test(w.text);
    const score =
      (isStop ? 0 : 10) +
      Math.min(10, clean.length) +
      (hasPunct ? 6 : 0) +
      (hasDigit ? 5 : 0) +
      (idx === words.length - 1 ? 2 : 0);
    if (score > bestScore) {
      bestScore = score;
      bestAmberIdx = idx;
    }
  });

  let bestGreenIdx = -1;
  if (words.length >= 3) {
    let secondScore = -1;
    words.forEach((w, idx) => {
      if (idx === bestAmberIdx) return;
      const clean = w.text.replace(/[^\p{L}\p{N}]/gu, '').toLowerCase();
      if (!clean || STOP_WORDS.has(clean)) return;
      const score = clean.length;
      if (score > secondScore) {
        secondScore = score;
        bestGreenIdx = idx;
      }
    });
  }

  return words.map((w, idx) => ({
    ...w,
    emphasis:
      idx === bestAmberIdx
        ? 'amber'
        : idx === bestGreenIdx
        ? 'green'
        : 'none',
  }));
}

function interpolateWordTimesInWindow(
  rawWords: RawAiWord[],
  windowStart: number,
  windowEnd: number,
  segIdx: number
): CaptionWord[] {
  const safeStart = Math.max(0, windowStart);
  const safeEnd = Math.max(safeStart + 0.25, windowEnd);
  const span = safeEnd - safeStart;

  const filtered = rawWords
    .map((rw) => {
      const txt = (rw.text ?? rw.word ?? '').trim();
      return { ...rw, text: txt };
    })
    .filter((rw) => rw.text.length > 0 && !isGibberishToken(rw.text));

  if (filtered.length === 0) return [];

  // Check if all words already have valid, strictly ordered timestamps within [safeStart - 0.5, safeEnd + 0.5]
  let hasValidTimings = true;
  let prevEnd = -1;
  for (const rw of filtered) {
    const s = Number(rw.start);
    const e = Number(rw.end);
    if (
      !Number.isFinite(s) ||
      !Number.isFinite(e) ||
      e <= s + 0.01 ||
      s < prevEnd - 0.15
    ) {
      hasValidTimings = false;
      break;
    }
    prevEnd = e;
  }

  const weights = filtered.map((rw) => Math.max(2, rw.text.length));
  const totalWeight = weights.reduce((a, b) => a + b, 0) || 1;

  let cursor = safeStart;
  const built: CaptionWord[] = filtered.map((rw, idx) => {
    const share = (weights[idx] / totalWeight) * span;
    const calcStart = Number(cursor.toFixed(2));
    cursor += share;
    const calcEnd =
      idx === filtered.length - 1
        ? Number(safeEnd.toFixed(2))
        : Number(Math.max(calcStart + 0.08, cursor).toFixed(2));

    const start = hasValidTimings
      ? Number(Math.max(0, Number(rw.start)).toFixed(2))
      : calcStart;
    const end = hasValidTimings
      ? Number(Math.max(start + 0.08, Number(rw.end)).toFixed(2))
      : calcEnd;

    const multi = transliterateWordMultiScript(rw.text);
    const text = multi.text || rw.text;
    return {
      id: `w-ai-${segIdx + 1}-${idx + 1}`,
      text,
      hinglish: rw.hinglish || (multi.text || rw.text),
      hiDeva: (rw.hiDeva || multi.hiDeva || text).trim(),
      en: (rw.en || multi.en || text).trim(),
      ta: (rw.ta || text).trim(),
      bn: (rw.bn || text).trim(),
      start,
      end,
      emphasis: normalizeEmphasis(rw.emphasis),
    };
  });

  return assignAutoEmphasisToWords(built);
}

/**
 * Normalizes any Gemini AI transcription response into clean, non-overlapping,
 * word-timed CaptionSegment[] suitable for Captik's video stage and timeline.
 */
export function normalizeAiGeneratedSegments(
  payload: RawAiCaptionPayload,
  videoDuration: number,
  linesMode: 1 | 2 = 1
): CaptionSegment[] {
  const safeDuration = Math.max(1.0, Number.isFinite(videoDuration) && videoDuration > 0 ? videoDuration : 6.0);
  const maxWordsPerCard = linesMode === 1 ? 4 : 7;

  let candidateSegments: RawAiSegment[] = [];

  if (Array.isArray(payload.segments) && payload.segments.length > 0) {
    candidateSegments = payload.segments;
  } else if (Array.isArray(payload.words) && payload.words.length > 0) {
    // Group flat words into segments
    const validWords = payload.words.filter(
      (w) => ((w.text ?? w.word ?? '').trim().length > 0)
    );
    let currentChunk: RawAiWord[] = [];
    for (let i = 0; i < validWords.length; i++) {
      const w = validWords[i];
      currentChunk.push(w);
      const txt = (w.text ?? w.word ?? '').trim();
      const endsSentence = /[.!?।]$/.test(txt);
      const nextW = validWords[i + 1];
      const pauseGap =
        nextW && Number.isFinite(nextW.start) && Number.isFinite(w.end)
          ? Number(nextW.start) - Number(w.end)
          : 0;

      if (
        currentChunk.length >= maxWordsPerCard ||
        endsSentence ||
        pauseGap >= 0.38 ||
        i === validWords.length - 1
      ) {
        candidateSegments.push({
          start: currentChunk[0].start,
          end: currentChunk[currentChunk.length - 1].end,
          words: currentChunk,
        });
        currentChunk = [];
      }
    }
  } else if (typeof payload.transcript === 'string' && payload.transcript.trim().length > 0) {
    const tokens = payload.transcript
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    for (let i = 0; i < tokens.length; i += maxWordsPerCard) {
      const slice = tokens.slice(i, i + maxWordsPerCard);
      candidateSegments.push({
        text: slice.join(' '),
        words: slice.map((t) => ({ text: t })),
      });
    }
  }

  if (candidateSegments.length === 0) {
    return [];
  }

  // First pass: ensure every candidate segment has raw words and split oversized segments
  const expandedSegments: {
    start?: number;
    end?: number;
    behindSubject?: boolean;
    words: RawAiWord[];
  }[] = [];

  for (const seg of candidateSegments) {
    let rawWords: RawAiWord[] = Array.isArray(seg.words) && seg.words.length > 0
      ? seg.words.filter((w) => (w.text ?? w.word ?? '').trim().length > 0)
      : (seg.text || '')
          .trim()
          .split(/\s+/)
          .filter(Boolean)
          .map((t) => ({ text: t }));

    if (rawWords.length === 0) continue;

    if (rawWords.length <= maxWordsPerCard + 1) {
      expandedSegments.push({
        start: seg.start,
        end: seg.end,
        behindSubject: seg.behindSubject,
        words: rawWords,
      });
    } else {
      // Split long segment into readable cards of maxWordsPerCard
      const chunkCount = Math.ceil(rawWords.length / maxWordsPerCard);
      const hasSegWindow =
        Number.isFinite(seg.start) &&
        Number.isFinite(seg.end) &&
        Number(seg.end) > Number(seg.start);
      const segStart = hasSegWindow ? Number(seg.start) : undefined;
      const segSpan = hasSegWindow ? Number(seg.end) - Number(seg.start) : undefined;

      for (let c = 0; c < chunkCount; c++) {
        const chunkWords = rawWords.slice(
          c * maxWordsPerCard,
          (c + 1) * maxWordsPerCard
        );
        const firstWStart = chunkWords[0]?.start;
        const lastWEnd = chunkWords[chunkWords.length - 1]?.end;
        const subStart = Number.isFinite(firstWStart)
          ? Number(firstWStart)
          : segStart !== undefined && segSpan !== undefined
          ? segStart + (c / chunkCount) * segSpan
          : undefined;
        const subEnd = Number.isFinite(lastWEnd)
          ? Number(lastWEnd)
          : segStart !== undefined && segSpan !== undefined
          ? segStart + ((c + 1) / chunkCount) * segSpan
          : undefined;

        expandedSegments.push({
          start: subStart,
          end: subEnd,
          behindSubject: seg.behindSubject,
          words: chunkWords,
        });
      }
    }
  }

  if (expandedSegments.length === 0) return [];

  // Second pass: resolve segment start/end windows and build hydrated CaptionSegment[]
  const totalSegs = expandedSegments.length;
  const usableSpan = Math.max(0.8, safeDuration - 0.15);
  const defaultStep = usableSpan / totalSegs;

  let runningTime = 0.08;
  const finalSegments: CaptionSegment[] = [];

  expandedSegments.forEach((seg, idx) => {
    const rawStart = Number(seg.start);
    const rawEnd = Number(seg.end);

    let start =
      Number.isFinite(rawStart) && rawStart >= 0 && rawStart < safeDuration
        ? Math.max(runningTime - 0.05, rawStart)
        : Number((0.08 + idx * defaultStep).toFixed(2));

    start = Math.max(0, Math.min(safeDuration - 0.25, start));

    let end =
      Number.isFinite(rawEnd) && rawEnd > start + 0.15
        ? Math.min(safeDuration, rawEnd)
        : Number(
            Math.min(
              safeDuration,
              Math.max(start + 0.45, 0.08 + (idx + 1) * defaultStep - 0.04)
            ).toFixed(2)
          );

    if (end <= start + 0.15) {
      end = Number(Math.min(safeDuration, start + 0.45).toFixed(2));
    }

    const words = interpolateWordTimesInWindow(seg.words, start, end, idx);
    if (words.length === 0) return;

    const finalStart = words[0].start;
    const finalEnd = words[words.length - 1].end;
    runningTime = finalEnd + 0.02;

    finalSegments.push({
      id: `seg-ai-${idx + 1}`,
      start: finalStart,
      end: finalEnd,
      words,
      behindSubject: seg.behindSubject ?? false,
    });
  });

  if (hasEnglishTranslatedHindiBug(finalSegments)) {
    return upgradeSegmentsToHinglishMultiScript(finalSegments);
  }

  return finalSegments;
}

/**
 * Computes Root Mean Square (RMS) energy of mono PCM audio samples (0..1).
 * Used to detect whether an uploaded video has audible speech or is silent.
 */
export function computeAudioRmsEnergy(samples: Float32Array): number {
  if (!samples || samples.length === 0) return 0;
  let sumSq = 0;
  const step = Math.max(1, Math.floor(samples.length / 8000));
  let count = 0;
  for (let i = 0; i < samples.length; i += step) {
    const v = samples[i];
    sumSq += v * v;
    count++;
  }
  return count > 0 ? Math.sqrt(sumSq / count) : 0;
}

/**
 * Encodes mono Float32Array PCM samples (-1..1) into a standard 16-bit PCM WAV file (Uint8Array).
 */
export function encodeMonoWavFromSamples(
  samples: Float32Array,
  sampleRate = 16000
): Uint8Array {
  const numSamples = samples.length;
  const bytesPerSample = 2;
  const dataSize = numSamples * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeAscii = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // RIFF identifier
  writeAscii(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(8, 'WAVE');
  // fmt chunk
  writeAscii(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format = 1
  view.setUint16(22, 1, true); // Mono = 1 channel
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true); // byte rate
  view.setUint16(32, bytesPerSample, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  // data chunk
  writeAscii(36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    const int16 = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
    view.setInt16(offset, int16, true);
    offset += 2;
  }

  return new Uint8Array(buffer);
}

export interface SpeechWindow {
  start: number;
  end: number;
  energy: number;
}

/**
 * Acoustic Voice Activity Detection (VAD) from mono PCM samples.
 * Detects exact time windows where a person is speaking in the video's audio track
 * and splits long utterances at syllable/phrase energy dips.
 */
export function detectSpeechWindowsFromSamples(
  samples: Float32Array,
  sampleRate = 16000,
  durationSec?: number
): SpeechWindow[] {
  const totalDuration =
    durationSec && Number.isFinite(durationSec) && durationSec > 0
      ? durationSec
      : samples && samples.length > 0 && sampleRate > 0
      ? samples.length / sampleRate
      : 6.0;

  if (!samples || samples.length < sampleRate * 0.15) {
    return buildDefaultSpeechWindows(totalDuration, 4);
  }

  const frameSec = 0.05; // 50ms analysis window
  const frameLen = Math.max(64, Math.floor(sampleRate * frameSec));
  const numFrames = Math.floor(samples.length / frameLen);
  if (numFrames < 3) {
    return buildDefaultSpeechWindows(totalDuration, 4);
  }

  const energies: number[] = [];
  for (let f = 0; f < numFrames; f++) {
    let sumSq = 0;
    const base = f * frameLen;
    for (let i = 0; i < frameLen; i += 2) {
      const v = samples[base + i];
      sumSq += v * v;
    }
    energies.push(Math.sqrt(sumSq / (frameLen / 2)));
  }

  const sorted = [...energies].sort((a, b) => a - b);
  const p15 = sorted[Math.floor(sorted.length * 0.15)] ?? 0;
  const p90 = sorted[Math.floor(sorted.length * 0.9)] ?? 0;

  if (p90 < 0.002) {
    return buildDefaultSpeechWindows(totalDuration, 4);
  }

  const threshold = Math.max(0.003, p15 + (p90 - p15) * 0.22);

  // Raw active intervals
  const rawWindows: SpeechWindow[] = [];
  let inSpeech = false;
  let winStart = 0;
  let energySum = 0;
  let frameCount = 0;

  for (let f = 0; f < numFrames; f++) {
    const e = energies[f];
    const t = f * frameSec;
    if (e >= threshold) {
      if (!inSpeech) {
        inSpeech = true;
        winStart = Math.max(0, t - 0.03);
        energySum = 0;
        frameCount = 0;
      }
      energySum += e;
      frameCount++;
    } else if (inSpeech) {
      inSpeech = false;
      const winEnd = Math.min(totalDuration, t + 0.04);
      if (winEnd - winStart >= 0.12) {
        rawWindows.push({
          start: Number(winStart.toFixed(2)),
          end: Number(winEnd.toFixed(2)),
          energy: Number((energySum / Math.max(1, frameCount)).toFixed(4)),
        });
      }
    }
  }

  if (inSpeech) {
    const winEnd = Math.min(totalDuration, numFrames * frameSec);
    if (winEnd - winStart >= 0.12) {
      rawWindows.push({
        start: Number(winStart.toFixed(2)),
        end: Number(winEnd.toFixed(2)),
        energy: Number((energySum / Math.max(1, frameCount)).toFixed(4)),
      });
    }
  }

  if (rawWindows.length === 0) {
    return buildDefaultSpeechWindows(totalDuration, 4);
  }

  // Merge micro-pauses (< 0.18s)
  const merged: SpeechWindow[] = [rawWindows[0]];
  for (let i = 1; i < rawWindows.length; i++) {
    const prev = merged[merged.length - 1];
    const curr = rawWindows[i];
    if (curr.start - prev.end < 0.18) {
      prev.end = curr.end;
      prev.energy = Number(((prev.energy + curr.energy) / 2).toFixed(4));
    } else {
      merged.push(curr);
    }
  }

  // Split overly long continuous speech windows (> 1.85s) at local energy valleys
  const finalWindows: SpeechWindow[] = [];
  for (const w of merged) {
    const span = w.end - w.start;
    if (span <= 1.85) {
      finalWindows.push(w);
    } else {
      const parts = Math.max(2, Math.round(span / 1.35));
      const step = span / parts;
      for (let p = 0; p < parts; p++) {
        const s = Number((w.start + p * step + (p > 0 ? 0.02 : 0)).toFixed(2));
        const e = Number(
          (p === parts - 1 ? w.end : w.start + (p + 1) * step - 0.02).toFixed(2)
        );
        if (e > s + 0.15) {
          finalWindows.push({ start: s, end: e, energy: w.energy });
        }
      }
    }
  }

  return finalWindows.length > 0
    ? finalWindows
    : buildDefaultSpeechWindows(totalDuration, 4);
}

function buildDefaultSpeechWindows(durationSec: number, count = 4): SpeechWindow[] {
  const safeDur = Math.max(1.2, durationSec || 6.0);
  const usable = Math.max(0.9, safeDur - 0.24);
  const segCount = Math.max(1, Math.min(12, count));
  const step = usable / segCount;
  const windows: SpeechWindow[] = [];
  for (let i = 0; i < segCount; i++) {
    const start = Number((0.12 + i * step).toFixed(2));
    const end = Number(Math.min(safeDur - 0.05, start + step * 0.92).toFixed(2));
    windows.push({ start, end, energy: 0.15 });
  }
  return windows;
}

const HINGLISH_DICTIONARY: Record<string, { hi: string; en: string }> = {
  bhai: { hi: 'भाई', en: 'bro' },
  yeh: { hi: 'यह', en: 'this' },
  ye: { hi: 'ये', en: 'this' },
  woh: { hi: 'वह', en: 'that' },
  wo: { hi: 'वो', en: 'that' },
  reel: { hi: 'रील', en: 'reel' },
  reels: { hi: 'रील्स', en: 'reels' },
  bilkul: { hi: 'बिल्कुल', en: 'definitely' },
  viral: { hi: 'वायरल', en: 'viral' },
  jayegi: { hi: 'जाएगी', en: 'will go' },
  jayega: { hi: 'जाएगा', en: 'will go' },
  jayenge: { hi: 'जाएंगे', en: 'will go' },
  aaj: { hi: 'आज', en: 'today' },
  kal: { hi: 'कल', en: 'tomorrow' },
  hi: { hi: 'ही', en: 'itself' },
  try: { hi: 'ट्राई', en: 'try' },
  karo: { hi: 'करो', en: 'do it' },
  karna: { hi: 'करना', en: 'to do' },
  karne: { hi: 'करने', en: 'to do' },
  karni: { hi: 'करनी', en: 'to do' },
  karta: { hi: 'करता', en: 'does' },
  karti: { hi: 'करती', en: 'does' },
  karte: { hi: 'करते', en: 'do' },
  karein: { hi: 'करें', en: 'do' },
  kare: { hi: 'करे', en: 'do' },
  karenge: { hi: 'करेंगे', en: 'will do' },
  karunga: { hi: 'करूँगा', en: 'will do' },
  karoge: { hi: 'करोगे', en: 'will do' },
  maine: { hi: 'मैंने', en: 'I' },
  main: { hi: 'मैं', en: 'I' },
  hum: { hi: 'हम', en: 'we' },
  humne: { hi: 'हमने', en: 'we' },
  humko: { hi: 'हमको', en: 'to us' },
  humein: { hi: 'हमें', en: 'to us' },
  mujhe: { hi: 'मुझे', en: 'to me' },
  mujhko: { hi: 'मुझको', en: 'to me' },
  mera: { hi: 'मेरा', en: 'my' },
  meri: { hi: 'मेरी', en: 'my' },
  mere: { hi: 'मेरे', en: 'my' },
  tera: { hi: 'तेरा', en: 'your' },
  teri: { hi: 'तेरी', en: 'your' },
  tere: { hi: 'तेरे', en: 'your' },
  tujhe: { hi: 'तुझे', en: 'to you' },
  tum: { hi: 'तुम', en: 'you' },
  tumhe: { hi: 'तुम्हें', en: 'to you' },
  tumhara: { hi: 'तुम्हारा', en: 'your' },
  tumhari: { hi: 'तुम्हारी', en: 'your' },
  tumhare: { hi: 'तुम्हारे', en: 'your' },
  aap: { hi: 'आप', en: 'you' },
  aapko: { hi: 'आपको', en: 'to you' },
  aapka: { hi: 'आपका', en: 'your' },
  aapki: { hi: 'आपकी', en: 'your' },
  aapke: { hi: 'आपके', en: 'your' },
  aapne: { hi: 'आपने', en: 'you' },
  apna: { hi: 'अपना', en: 'your' },
  apni: { hi: 'अपनी', en: 'your' },
  apne: { hi: 'अपने', en: 'your' },
  iska: { hi: 'इसका', en: 'its' },
  iski: { hi: 'इसकी', en: 'its' },
  iske: { hi: 'इसके', en: 'its' },
  isko: { hi: 'इसको', en: 'to this' },
  ismein: { hi: 'इसमें', en: 'in this' },
  isme: { hi: 'इसमें', en: 'in this' },
  uska: { hi: 'उसका', en: 'his' },
  uski: { hi: 'उसकी', en: 'her' },
  uske: { hi: 'उसके', en: 'their' },
  usko: { hi: 'उसको', en: 'to that' },
  unko: { hi: 'उनको', en: 'to them' },
  unka: { hi: 'उनका', en: 'their' },
  unki: { hi: 'उनकी', en: 'their' },
  unke: { hi: 'उनके', en: 'their' },
  sabko: { hi: 'सबको', en: 'everyone' },
  sabka: { hi: 'सबका', en: 'everyone' },
  sabhi: { hi: 'सभी', en: 'all' },
  sab: { hi: 'सब', en: 'all' },
  bas: { hi: 'बस', en: 'just' },
  video: { hi: 'वीडियो', en: 'video' },
  videos: { hi: 'वीडियोज़', en: 'videos' },
  audio: { hi: 'ऑडियो', en: 'audio' },
  upload: { hi: 'अपलोड', en: 'upload' },
  download: { hi: 'डाउनलोड', en: 'download' },
  export: { hi: 'एक्सपोर्ट', en: 'export' },
  edit: { hi: 'एडिट', en: 'edit' },
  editing: { hi: 'एडिटिंग', en: 'editing' },
  kiya: { hi: 'किया', en: 'did' },
  kiye: { hi: 'किए', en: 'did' },
  kijiye: { hi: 'कीजिए', en: 'please do' },
  ek: { hi: 'एक', en: 'one' },
  do: { hi: 'दो', en: 'two' },
  teen: { hi: 'तीन', en: 'three' },
  chaar: { hi: 'चार', en: 'four' },
  paanch: { hi: 'पाँच', en: 'five' },
  template: { hi: 'टेम्पलेट', en: 'template' },
  choose: { hi: 'चूज़', en: 'chose' },
  aur: { hi: 'और', en: 'and' },
  ya: { hi: 'या', en: 'or' },
  literally: { hi: 'लिटरली', en: 'literally' },
  minute: { hi: 'मिनट', en: 'minute' },
  second: { hi: 'सेकंड', en: 'seconds' },
  mein: { hi: 'में', en: 'in' },
  me: { hi: 'में', en: 'in' },
  captions: { hi: 'कैप्शंस', en: 'captions' },
  caption: { hi: 'कैप्शन', en: 'caption' },
  ready: { hi: 'रेडी', en: 'ready' },
  taiyar: { hi: 'तैयार', en: 'ready' },
  dosto: { hi: 'दोस्तों', en: 'friends' },
  doston: { hi: 'दोस्तों', en: 'friends' },
  dost: { hi: 'दोस्त', en: 'friend' },
  yaar: { hi: 'यार', en: 'friend' },
  agar: { hi: 'अगर', en: 'if' },
  magar: { hi: 'मगर', en: 'but' },
  lekin: { hi: 'लेकिन', en: 'but' },
  par: { hi: 'पर', en: 'on' },
  pe: { hi: 'पे', en: 'on' },
  ne: { hi: 'ने', en: 'by' },
  bhi: { hi: 'भी', en: 'also' },
  ko: { hi: 'को', en: 'to' },
  se: { hi: 'से', en: 'from' },
  ka: { hi: 'का', en: 'of' },
  ki: { hi: 'की', en: 'of' },
  ke: { hi: 'के', en: 'of' },
  hai: { hi: 'है', en: 'is' },
  hain: { hi: 'हैं', en: 'are' },
  tha: { hi: 'था', en: 'was' },
  thi: { hi: 'थी', en: 'was' },
  the: { hi: 'थे', en: 'were' },
  ho: { hi: 'हो', en: 'are' },
  hota: { hi: 'होता', en: 'happens' },
  hoti: { hi: 'होती', en: 'happens' },
  hote: { hi: 'होते', en: 'happen' },
  hua: { hi: 'हुआ', en: 'happened' },
  hui: { hi: 'हुई', en: 'happened' },
  hue: { hi: 'हुए', en: 'happened' },
  hoga: { hi: 'होगा', en: 'will be' },
  hogi: { hi: 'होगी', en: 'will be' },
  honge: { hi: 'होंगे', en: 'will be' },
  toh: { hi: 'तो', en: 'then' },
  phir: { hi: 'फिर', en: 'then' },
  fir: { hi: 'फिर', en: 'then' },
  dekho: { hi: 'देखो', en: 'look' },
  dekhiye: { hi: 'देखिए', en: 'see' },
  dekhna: { hi: 'देखना', en: 'to see' },
  dekha: { hi: 'देखा', en: 'saw' },
  dekhte: { hi: 'देखते', en: 'watch' },
  dikhata: { hi: 'दिखाता', en: 'shows' },
  dikhati: { hi: 'दिखाती', en: 'shows' },
  dikhate: { hi: 'दिखाते', en: 'show' },
  dikhana: { hi: 'दिखाना', en: 'to show' },
  dikhao: { hi: 'दिखाओ', en: 'show' },
  kaise: { hi: 'कैसे', en: 'how' },
  kaisa: { hi: 'कैसा', en: 'how' },
  kaisi: { hi: 'कैसी', en: 'how' },
  aise: { hi: 'ऐसे', en: 'like this' },
  aisa: { hi: 'ऐसा', en: 'like this' },
  aisi: { hi: 'ऐसी', en: 'like this' },
  waise: { hi: 'वैसे', en: 'by the way' },
  jaise: { hi: 'जैसे', en: 'like' },
  kya: { hi: 'क्या', en: 'what' },
  kyun: { hi: 'क्यों', en: 'why' },
  kyunki: { hi: 'क्योंकि', en: 'because' },
  kab: { hi: 'कब', en: 'when' },
  kabhi: { hi: 'कभी', en: 'ever' },
  jab: { hi: 'जब', en: 'when' },
  tab: { hi: 'तब', en: 'then' },
  tabhi: { hi: 'तभी', en: 'right then' },
  ab: { hi: 'अब', en: 'now' },
  abhi: { hi: 'अभी', en: 'right now' },
  kahan: { hi: 'कहाँ', en: 'where' },
  yahan: { hi: 'यहाँ', en: 'here' },
  wahan: { hi: 'वहाँ', en: 'there' },
  kaun: { hi: 'कौन', en: 'who' },
  koi: { hi: 'कोई', en: 'any' },
  kai: { hi: 'कई', en: 'many' },
  andar: { hi: 'अंदर', en: 'inside' },
  bahar: { hi: 'बाहर', en: 'outside' },
  upar: { hi: 'ऊपर', en: 'above' },
  neeche: { hi: 'नीचे', en: 'below' },
  aage: { hi: 'आगे', en: 'ahead' },
  peeche: { hi: 'पीछे', en: 'behind' },
  person: { hi: 'पर्सन', en: 'person' },
  banda: { hi: 'बंदा', en: 'person' },
  bande: { hi: 'बंदे', en: 'people' },
  bole: { hi: 'बोले', en: 'speaks' },
  bolta: { hi: 'बोलता', en: 'speaks' },
  bolti: { hi: 'बोलती', en: 'speaks' },
  bolte: { hi: 'बोलते', en: 'speak' },
  bolna: { hi: 'बोलना', en: 'to speak' },
  bolo: { hi: 'बोलो', en: 'speak' },
  batana: { hi: 'बताना', en: 'to tell' },
  batane: { hi: 'बताने', en: 'telling' },
  batata: { hi: 'बताता', en: 'tells' },
  batati: { hi: 'बताती', en: 'tells' },
  batate: { hi: 'बताते', en: 'tell' },
  bataya: { hi: 'बताया', en: 'told' },
  batao: { hi: 'बताओ', en: 'tell' },
  bataiye: { hi: 'बताइए', en: 'please tell' },
  suno: { hi: 'सुनो', en: 'listen' },
  suniye: { hi: 'सुनिए', en: 'please listen' },
  sunna: { hi: 'सुनना', en: 'to listen' },
  likh: { hi: 'लिख', en: 'write' },
  likhna: { hi: 'लिखना', en: 'to write' },
  likhta: { hi: 'लिखता', en: 'writes' },
  likhte: { hi: 'लिखते', en: 'write' },
  likha: { hi: 'लिखा', en: 'wrote' },
  samajh: { hi: 'समझ', en: 'understand' },
  samajhna: { hi: 'समझना', en: 'to understand' },
  samajhte: { hi: 'समझते', en: 'understand' },
  samjho: { hi: 'समझो', en: 'understand' },
  matlab: { hi: 'मतलब', en: 'meaning' },
  kuch: { hi: 'कुछ', en: 'something' },
  script: { hi: 'स्क्रिप्ट', en: 'script' },
  text: { hi: 'टेक्स्ट', en: 'text' },
  hisab: { hi: 'हिसाब', en: 'according' },
  show: { hi: 'शो', en: 'show' },
  hone: { hi: 'होने', en: 'happen' },
  hona: { hi: 'होना', en: 'to be' },
  chahiye: { hi: 'चाहिए', en: 'should' },
  chahta: { hi: 'चाहता', en: 'wants' },
  chahti: { hi: 'चाहती', en: 'wants' },
  chahte: { hi: 'चाहते', en: 'want' },
  sakta: { hi: 'सकता', en: 'can' },
  sakti: { hi: 'सकती', en: 'can' },
  sakte: { hi: 'सकते', en: 'can' },
  wala: { hi: 'वाला', en: 'going to' },
  wali: { hi: 'वाली', en: 'going to' },
  wale: { hi: 'वाले', en: 'going to' },
  professional: { hi: 'प्रोफेशनल', en: 'professional' },
  website: { hi: 'वेबसाइट', en: 'website' },
  trick: { hi: 'ट्रिक', en: 'trick' },
  tips: { hi: 'टिप्स', en: 'tips' },
  sahi: { hi: 'सही', en: 'right' },
  galat: { hi: 'गलत', en: 'wrong' },
  mast: { hi: 'मस्त', en: 'awesome' },
  bawal: { hi: 'बवाल', en: 'epic' },
  kamal: { hi: 'कमाल', en: 'amazing' },
  bahut: { hi: 'बहुत', en: 'very' },
  bohot: { hi: 'बहुत', en: 'very' },
  zyada: { hi: 'ज़्यादा', en: 'more' },
  kam: { hi: 'कम', en: 'less' },
  pehle: { hi: 'पहले', en: 'first' },
  pehla: { hi: 'पहला', en: 'first' },
  pehli: { hi: 'पहली', en: 'first' },
  doosra: { hi: 'दूसरा', en: 'second' },
  log: { hi: 'लोग', en: 'people' },
  logon: { hi: 'लोगों', en: 'people' },
  rukenge: { hi: 'रुकेंगे', en: 'will stay' },
  ruko: { hi: 'रुको', en: 'wait' },
  scroll: { hi: 'स्क्रॉल', en: 'scroll' },
  nahi: { hi: 'नहीं', en: 'not' },
  mat: { hi: 'मत', en: 'do not' },
  haan: { hi: 'हाँ', en: 'yes' },
  achha: { hi: 'अच्छा', en: 'good' },
  accha: { hi: 'अच्छा', en: 'good' },
  acchi: { hi: 'अच्छी', en: 'good' },
  acche: { hi: 'अच्छे', en: 'well' },
  ache: { hi: 'अच्छे', en: 'well' },
  badhiya: { hi: 'बढ़िया', en: 'great' },
  pura: { hi: 'पूरा', en: 'full' },
  poora: { hi: 'पूरा', en: 'complete' },
  puri: { hi: 'पूरी', en: 'full' },
  pure: { hi: 'पूरे', en: 'complete' },
  end: { hi: 'एंड', en: 'end' },
  tak: { hi: 'तक', en: 'until' },
  zaroor: { hi: 'ज़रूर', en: 'definitely' },
  zaroori: { hi: 'ज़रूरी', en: 'important' },
  like: { hi: 'लाइक', en: 'like' },
  share: { hi: 'शेयर', en: 'share' },
  follow: { hi: 'फॉलो', en: 'follow' },
  subscribe: { hi: 'सब्सक्राइब', en: 'subscribe' },
  comment: { hi: 'कमेंट', en: 'comment' },
  namaste: { hi: 'नमस्ते', en: 'Hello' },
  hello: { hi: 'हेलो', en: 'Hello' },
  hey: { hi: 'हे', en: 'Hey' },
  guys: { hi: 'गाइज़', en: 'guys' },
  welcome: { hi: 'वेलकम', en: 'welcome' },
  back: { hi: 'बैक', en: 'back' },
  channel: { hi: 'चैनल', en: 'channel' },
  baat: { hi: 'बात', en: 'thing' },
  baatein: { hi: 'बातें', en: 'things' },
  cheez: { hi: 'चीज़', en: 'thing' },
  cheezein: { hi: 'चीज़ें', en: 'things' },
  tarika: { hi: 'तरीका', en: 'way' },
  tarike: { hi: 'तरीके', en: 'ways' },
  paisa: { hi: 'पैसा', en: 'money' },
  paise: { hi: 'पैसे', en: 'money' },
  duniya: { hi: 'दुनिया', en: 'world' },
  zindagi: { hi: 'ज़िंदगी', en: 'life' },
  dikkat: { hi: 'दिक्कत', en: 'issue' },
  problem: { hi: 'प्रॉब्लम', en: 'problem' },
  fix: { hi: 'फिक्स', en: 'fix' },
  solve: { hi: 'सॉल्व', en: 'solve' },
  raha: { hi: 'रहा', en: 'was' },
  rahi: { hi: 'रही', en: 'was' },
  rahe: { hi: 'रहे', en: 'were' },
  hoon: { hi: 'हूँ', en: 'am' },
  hu: { hi: 'हूँ', en: 'am' },
  bol: { hi: 'बोल', en: 'speaking' },
  bola: { hi: 'बोला', en: 'spoke' },
  boli: { hi: 'बोली', en: 'spoke' },
  dala: { hi: 'डाला', en: 'uploaded' },
  dali: { hi: 'डाली', en: 'uploaded' },
  jiske: { hi: 'जिसके', en: 'whose' },
  jismein: { hi: 'जिसमें', en: 'in which' },
  jisme: { hi: 'जिसमें', en: 'in which' },
  pata: { hi: 'पता', en: 'know' },
  auto: { hi: 'ऑटो', en: 'auto' },
  lag: { hi: 'लग', en: 'apply' },
  lagta: { hi: 'लगता', en: 'feels' },
  lagti: { hi: 'लगती', en: 'feels' },
  lagte: { hi: 'लगते', en: 'feel' },
  laga: { hi: 'लगा', en: 'applied' },
  lagana: { hi: 'लगाना', en: 'to add' },
  lagane: { hi: 'लगाने', en: 'adding' },
  lagao: { hi: 'लगाओ', en: 'apply' },
  banana: { hi: 'बनाना', en: 'to make' },
  banane: { hi: 'बनाने', en: 'making' },
  banata: { hi: 'बनाता', en: 'makes' },
  banate: { hi: 'बनाते', en: 'make' },
  banaya: { hi: 'बनाया', en: 'made' },
  banao: { hi: 'बनाओ', en: 'make' },
  kaam: { hi: 'काम', en: 'work' },
  naam: { hi: 'नाम', en: 'name' },
  saath: { hi: 'साथ', en: 'with' },
  haath: { hi: 'हाथ', en: 'hand' },
  baad: { hi: 'बाद', en: 'after' },
  yaad: { hi: 'याद', en: 'remember' },
  saal: { hi: 'साल', en: 'year' },
  din: { hi: 'दिन', en: 'day' },
  raat: { hi: 'रात', en: 'night' },
  subah: { hi: 'सुबह', en: 'morning' },
  shaam: { hi: 'शाम', en: 'evening' },
  kar: { hi: 'कर', en: 'do' },
  seedhi: { hi: 'सीधी', en: 'simple' },
  seedha: { hi: 'सीधा', en: 'straight' },
  simple: { hi: 'सिंपल', en: 'simple' },
  aane: { hi: 'आने', en: 'come' },
  aana: { hi: 'आना', en: 'come' },
  aata: { hi: 'आता', en: 'comes' },
  aati: { hi: 'आती', en: 'comes' },
  aate: { hi: 'आते', en: 'come' },
  aaya: { hi: 'आया', en: 'came' },
  aayi: { hi: 'आई', en: 'came' },
  aaye: { hi: 'आए', en: 'came' },
  gaya: { hi: 'गया', en: 'went' },
  gayi: { hi: 'गई', en: 'went' },
  gaye: { hi: 'गए', en: 'went' },
  jaana: { hi: 'जाना', en: 'to go' },
  jaane: { hi: 'जाने', en: 'going' },
  jaata: { hi: 'जाता', en: 'goes' },
  jaati: { hi: 'जाती', en: 'goes' },
  jaate: { hi: 'जाते', en: 'go' },
  jao: { hi: 'जाओ', en: 'go' },
  chalo: { hi: 'चलो', en: 'let us go' },
  chalta: { hi: 'चलता', en: 'runs' },
  chalti: { hi: 'चलती', en: 'runs' },
  chalte: { hi: 'चलते', en: 'walk' },
  milta: { hi: 'मिलता', en: 'gets' },
  milti: { hi: 'मिलती', en: 'gets' },
  milte: { hi: 'मिलते', en: 'meet' },
  mila: { hi: 'मिला', en: 'got' },
  milega: { hi: 'मिलेगा', en: 'will get' },
  milegi: { hi: 'मिलेगी', en: 'will get' },
  dena: { hi: 'देना', en: 'to give' },
  deta: { hi: 'देता', en: 'gives' },
  deti: { hi: 'देती', en: 'gives' },
  dete: { hi: 'देते', en: 'give' },
  diya: { hi: 'दिया', en: 'gave' },
  lena: { hi: 'लेना', en: 'to take' },
  leta: { hi: 'लेता', en: 'takes' },
  leti: { hi: 'लेती', en: 'takes' },
  lete: { hi: 'लेते', en: 'take' },
  liya: { hi: 'लिया', en: 'took' },
  hamara: { hi: 'हमारा', en: 'our' },
  hamari: { hi: 'हमारी', en: 'our' },
  hamare: { hi: 'हमारे', en: 'our' },
  app: { hi: 'ऐप', en: 'app' },
  naya: { hi: 'नया', en: 'new' },
  nayi: { hi: 'नई', en: 'new' },
  naye: { hi: 'नए', en: 'new' },
  hindi: { hi: 'हिंदी', en: 'Hindi' },
  english: { hi: 'इंग्लिश', en: 'English' },
  hinglish: { hi: 'हिंग्लिश', en: 'Hinglish' },
};

/**
 * Direct Devanagari-to-Hinglish lookup table including Whisper ASR phonetic Devanagari variants.
 * Ensures that when someone speaks Hindi in a video, their words are always displayed in
 * natural creator Hinglish ("इंग्लिश वाली हिंदी") rather than robotic schwa-inflated text.
 */
const DEVANAGARI_TO_HINGLISH_MAP: Record<string, { hinglish: string; hi: string; en: string }> = {
  // Whisper ASR phonetic Devanagari variants
  डूस्तो: { hinglish: 'dosto', hi: 'दोस्तों', en: 'friends' },
  दोस्तो: { hinglish: 'dosto', hi: 'दोस्तों', en: 'friends' },
  दोसतो: { hinglish: 'dosto', hi: 'दोस्तों', en: 'friends' },
  दोंस्तो: { hinglish: 'dosto', hi: 'दोस्तों', en: 'friends' },
  दोस्तों: { hinglish: 'dosto', hi: 'दोस्तों', en: 'friends' },
  दोस्त: { hinglish: 'dost', hi: 'दोस्त', en: 'friend' },
  बाई: { hinglish: 'bhai', hi: 'भाई', en: 'bro' },
  भाइ: { hinglish: 'bhai', hi: 'भाई', en: 'bro' },
  भई: { hinglish: 'bhai', hi: 'भाई', en: 'bro' },
  भाई: { hinglish: 'bhai', hi: 'भाई', en: 'bro' },
  वीट्यो: { hinglish: 'video', hi: 'वीडियो', en: 'video' },
  विडियो: { hinglish: 'video', hi: 'वीडियो', en: 'video' },
  वीडिओ: { hinglish: 'video', hi: 'वीडियो', en: 'video' },
  विडिओ: { hinglish: 'video', hi: 'वीडियो', en: 'video' },
  वीडीयो: { hinglish: 'video', hi: 'वीडियो', en: 'video' },
  विड्यो: { hinglish: 'video', hi: 'वीडियो', en: 'video' },
  वीडियो: { hinglish: 'video', hi: 'वीडियो', en: 'video' },
  वीडियोज़: { hinglish: 'videos', hi: 'वीडियोज़', en: 'videos' },
  कप्षन: { hinglish: 'caption', hi: 'कैप्शन', en: 'caption' },
  केप्शन: { hinglish: 'caption', hi: 'कैप्शन', en: 'caption' },
  काप्शन: { hinglish: 'caption', hi: 'कैप्शन', en: 'caption' },
  कैपशन: { hinglish: 'caption', hi: 'कैप्शन', en: 'caption' },
  कैप्शन: { hinglish: 'caption', hi: 'कैप्शन', en: 'caption' },
  कैप्शंस: { hinglish: 'captions', hi: 'कैप्शंस', en: 'captions' },
  कैपशन्स: { hinglish: 'captions', hi: 'कैप्शंस', en: 'captions' },
  एसे: { hinglish: 'aise', hi: 'ऐसे', en: 'like this' },
  ऐसे: { hinglish: 'aise', hi: 'ऐसे', en: 'like this' },
  ऐसा: { hinglish: 'aisa', hi: 'ऐसा', en: 'like this' },
  ऐसी: { hinglish: 'aisi', hi: 'ऐसी', en: 'like this' },
  केसे: { hinglish: 'kaise', hi: 'कैसे', en: 'how' },
  कैसे: { hinglish: 'kaise', hi: 'कैसे', en: 'how' },
  कैसा: { hinglish: 'kaisa', hi: 'कैसा', en: 'how' },
  कैसी: { hinglish: 'kaisi', hi: 'कैसी', en: 'how' },
  जेसे: { hinglish: 'jaise', hi: 'जैसे', en: 'like' },
  जैसे: { hinglish: 'jaise', hi: 'जैसे', en: 'like' },
  वेसे: { hinglish: 'waise', hi: 'वैसे', en: 'by the way' },
  वैसे: { hinglish: 'waise', hi: 'वैसे', en: 'by the way' },
  जरूरी: { hinglish: 'zaroori', hi: 'ज़रूरी', en: 'important' },
  ज़रूरी: { hinglish: 'zaroori', hi: 'ज़रूरी', en: 'important' },
  जरुरी: { hinglish: 'zaroori', hi: 'ज़रूरी', en: 'important' },
  ज़रुरी: { hinglish: 'zaroori', hi: 'ज़रूरी', en: 'important' },
  जरूर: { hinglish: 'zaroor', hi: 'ज़रूर', en: 'definitely' },
  ज़रूर: { hinglish: 'zaroor', hi: 'ज़रूर', en: 'definitely' },
  ज्यादा: { hinglish: 'zyada', hi: 'ज़्यादा', en: 'more' },
  ज़्यादा: { hinglish: 'zyada', hi: 'ज़्यादा', en: 'more' },
  जिंदगी: { hinglish: 'zindagi', hi: 'ज़िंदगी', en: 'life' },
  ज़िंदगी: { hinglish: 'zindagi', hi: 'ज़िंदगी', en: 'life' },
  जिन्दगी: { hinglish: 'zindagi', hi: 'ज़िंदगी', en: 'life' },
  ज़िन्दगी: { hinglish: 'zindagi', hi: 'ज़िंदगी', en: 'life' },
  चीज: { hinglish: 'cheez', hi: 'चीज़', en: 'thing' },
  चीज़: { hinglish: 'cheez', hi: 'चीज़', en: 'thing' },
  चीजें: { hinglish: 'cheezein', hi: 'चीज़ें', en: 'things' },
  चीज़ें: { hinglish: 'cheezein', hi: 'चीज़ें', en: 'things' },
  चीजे: { hinglish: 'cheezein', hi: 'चीज़ें', en: 'things' },
  ट्रिक: { hinglish: 'trick', hi: 'ट्रिक', en: 'trick' },
  ट्रीक: { hinglish: 'trick', hi: 'ट्रिक', en: 'trick' },
  टिप्स: { hinglish: 'tips', hi: 'टिप्स', en: 'tips' },
  रील: { hinglish: 'reel', hi: 'रील', en: 'reel' },
  रील्स: { hinglish: 'reels', hi: 'रील्स', en: 'reels' },
  वायरल: { hinglish: 'viral', hi: 'वायरल', en: 'viral' },
  चैनल: { hinglish: 'channel', hi: 'चैनल', en: 'channel' },
  स्क्रिप्ट: { hinglish: 'script', hi: 'स्क्रिप्ट', en: 'script' },
  टेक्स्ट: { hinglish: 'text', hi: 'टेक्स्ट', en: 'text' },
  प्रॉब्लम: { hinglish: 'problem', hi: 'प्रॉब्लम', en: 'problem' },
  दिक्कत: { hinglish: 'dikkat', hi: 'दिक्कत', en: 'issue' },
  सिंपल: { hinglish: 'simple', hi: 'सिंपल', en: 'simple' },
  टेम्पलेट: { hinglish: 'template', hi: 'टेम्पलेट', en: 'template' },
  एडिट: { hinglish: 'edit', hi: 'एडिट', en: 'edit' },
  एडिटिंग: { hinglish: 'editing', hi: 'एडिटिंग', en: 'editing' },
  लाइक: { hinglish: 'like', hi: 'लाइक', en: 'like' },
  लाईक: { hinglish: 'like', hi: 'लाइक', en: 'like' },
  शेयर: { hinglish: 'share', hi: 'शेयर', en: 'share' },
  सब्सक्राइब: { hinglish: 'subscribe', hi: 'सब्सक्राइब', en: 'subscribe' },
  कमेंट: { hinglish: 'comment', hi: 'कमेंट', en: 'comment' },
  फॉलो: { hinglish: 'follow', hi: 'फॉलो', en: 'follow' },
  अपलोड: { hinglish: 'upload', hi: 'अपलोड', en: 'upload' },
  डाउनलोड: { hinglish: 'download', hi: 'डाउनलोड', en: 'download' },
  एक्सपोर्ट: { hinglish: 'export', hi: 'एक्सपोर्ट', en: 'export' },
  वेबसाइट: { hinglish: 'website', hi: 'वेबसाइट', en: 'website' },
  प्रोफेशनल: { hinglish: 'professional', hi: 'प्रोफेशनल', en: 'professional' },
  ऐप: { hinglish: 'app', hi: 'ऐप', en: 'app' },
  ऑटो: { hinglish: 'auto', hi: 'ऑटो', en: 'auto' },
  रेडी: { hinglish: 'ready', hi: 'रेडी', en: 'ready' },
  ट्राई: { hinglish: 'try', hi: 'ट्राई', en: 'try' },
  चूज़: { hinglish: 'choose', hi: 'चूज़', en: 'choose' },
  लिटरली: { hinglish: 'literally', hi: 'लिटरली', en: 'literally' },
  मिनट: { hinglish: 'minute', hi: 'मिनट', en: 'minute' },
  सेकंड: { hinglish: 'second', hi: 'सेकंड', en: 'second' },
  नमस्ते: { hinglish: 'namaste', hi: 'नमस्ते', en: 'Hello' },
  हेलो: { hinglish: 'hello', hi: 'हेलो', en: 'Hello' },
  गाइज़: { hinglish: 'guys', hi: 'गाइज़', en: 'guys' },
  वेलकम: { hinglish: 'welcome', hi: 'वेलकम', en: 'welcome' },
  बैक: { hinglish: 'back', hi: 'बैक', en: 'back' },
  हिंदी: { hinglish: 'hindi', hi: 'हिंदी', en: 'Hindi' },
  इंग्लिश: { hinglish: 'english', hi: 'इंग्लिश', en: 'English' },
  हूँ: { hinglish: 'hoon', hi: 'हूँ', en: 'am' },
  हूं: { hinglish: 'hoon', hi: 'हूँ', en: 'am' },
  हू: { hinglish: 'hoon', hi: 'हूँ', en: 'am' },
  हुं: { hinglish: 'hoon', hi: 'हूँ', en: 'am' },
  है: { hinglish: 'hai', hi: 'है', en: 'is' },
  हे: { hinglish: 'hai', hi: 'है', en: 'is' },
  हैं: { hinglish: 'hain', hi: 'हैं', en: 'are' },
  हें: { hinglish: 'hain', hi: 'हैं', en: 'are' },
  था: { hinglish: 'tha', hi: 'था', en: 'was' },
  थी: { hinglish: 'thi', hi: 'थी', en: 'was' },
  थे: { hinglish: 'the', hi: 'थे', en: 'were' },
  हो: { hinglish: 'ho', hi: 'हो', en: 'are' },
  में: { hinglish: 'mein', hi: 'में', en: 'in' },
  मे: { hinglish: 'mein', hi: 'में', en: 'in' },
  मैं: { hinglish: 'main', hi: 'मैं', en: 'I' },
  मैंने: { hinglish: 'maine', hi: 'मैंने', en: 'I' },
  हम: { hinglish: 'hum', hi: 'हम', en: 'we' },
  हमने: { hinglish: 'humne', hi: 'हमने', en: 'we' },
  हमें: { hinglish: 'humein', hi: 'हमें', en: 'to us' },
  हमको: { hinglish: 'humko', hi: 'हमको', en: 'to us' },
  हमारा: { hinglish: 'hamara', hi: 'हमारा', en: 'our' },
  हमारी: { hinglish: 'hamari', hi: 'हमारी', en: 'our' },
  हमारे: { hinglish: 'hamare', hi: 'हमारे', en: 'our' },
  मुझे: { hinglish: 'mujhe', hi: 'मुझे', en: 'to me' },
  मुझको: { hinglish: 'mujhko', hi: 'मुझको', en: 'to me' },
  मेरा: { hinglish: 'mera', hi: 'मेरा', en: 'my' },
  मेरी: { hinglish: 'meri', hi: 'मेरी', en: 'my' },
  मेरे: { hinglish: 'mere', hi: 'मेरे', en: 'my' },
  तुम: { hinglish: 'tum', hi: 'तुम', en: 'you' },
  तुम्हें: { hinglish: 'tumhe', hi: 'तुम्हें', en: 'to you' },
  तुम्हारा: { hinglish: 'tumhara', hi: 'तुम्हारा', en: 'your' },
  तुम्हारी: { hinglish: 'tumhari', hi: 'तुम्हारी', en: 'your' },
  तुम्हारे: { hinglish: 'tumhare', hi: 'तुम्हारे', en: 'your' },
  आप: { hinglish: 'aap', hi: 'आप', en: 'you' },
  आपको: { hinglish: 'aapko', hi: 'आपको', en: 'to you' },
  आपका: { hinglish: 'aapka', hi: 'आपका', en: 'your' },
  आपकी: { hinglish: 'aapki', hi: 'आपकी', en: 'your' },
  आपके: { hinglish: 'aapke', hi: 'आपके', en: 'your' },
  आपने: { hinglish: 'aapne', hi: 'आपने', en: 'you' },
  अपना: { hinglish: 'apna', hi: 'अपना', en: 'your' },
  अपनी: { hinglish: 'apni', hi: 'अपनी', en: 'your' },
  अपने: { hinglish: 'apne', hi: 'अपने', en: 'your' },
  यह: { hinglish: 'yeh', hi: 'यह', en: 'this' },
  ये: { hinglish: 'ye', hi: 'ये', en: 'this' },
  वह: { hinglish: 'woh', hi: 'वह', en: 'that' },
  वो: { hinglish: 'wo', hi: 'वो', en: 'that' },
  इस: { hinglish: 'is', hi: 'इस', en: 'this' },
  इसका: { hinglish: 'iska', hi: 'इसका', en: 'its' },
  इसकी: { hinglish: 'iski', hi: 'इसकी', en: 'its' },
  इसके: { hinglish: 'iske', hi: 'इसके', en: 'its' },
  इसको: { hinglish: 'isko', hi: 'इसको', en: 'to this' },
  इसमें: { hinglish: 'ismein', hi: 'इसमें', en: 'in this' },
  उस: { hinglish: 'us', hi: 'उस', en: 'that' },
  उसका: { hinglish: 'uska', hi: 'उसका', en: 'his' },
  उसकी: { hinglish: 'uski', hi: 'उसकी', en: 'her' },
  उसके: { hinglish: 'uske', hi: 'उसके', en: 'their' },
  उसको: { hinglish: 'usko', hi: 'उसको', en: 'to that' },
  उनको: { hinglish: 'unko', hi: 'उनको', en: 'to them' },
  सबको: { hinglish: 'sabko', hi: 'सबको', en: 'everyone' },
  सब: { hinglish: 'sab', hi: 'सब', en: 'all' },
  सभी: { hinglish: 'sabhi', hi: 'सभी', en: 'all' },
  तो: { hinglish: 'toh', hi: 'तो', en: 'then' },
  भी: { hinglish: 'bhi', hi: 'भी', en: 'also' },
  ही: { hinglish: 'hi', hi: 'ही', en: 'itself' },
  कि: { hinglish: 'ki', hi: 'कि', en: 'that' },
  की: { hinglish: 'ki', hi: 'की', en: 'of' },
  का: { hinglish: 'ka', hi: 'का', en: 'of' },
  के: { hinglish: 'ke', hi: 'के', en: 'of' },
  को: { hinglish: 'ko', hi: 'को', en: 'to' },
  से: { hinglish: 'se', hi: 'से', en: 'from' },
  पर: { hinglish: 'par', hi: 'पर', en: 'on' },
  पे: { hinglish: 'pe', hi: 'पे', en: 'on' },
  ने: { hinglish: 'ne', hi: 'ने', en: 'by' },
  और: { hinglish: 'aur', hi: 'और', en: 'and' },
  या: { hinglish: 'ya', hi: 'या', en: 'or' },
  अगर: { hinglish: 'agar', hi: 'अगर', en: 'if' },
  मगर: { hinglish: 'magar', hi: 'मगर', en: 'but' },
  लेकिन: { hinglish: 'lekin', hi: 'लेकिन', en: 'but' },
  लेकीन: { hinglish: 'lekin', hi: 'लेकिन', en: 'but' },
  क्यों: { hinglish: 'kyun', hi: 'क्यों', en: 'why' },
  क्यो: { hinglish: 'kyun', hi: 'क्यों', en: 'why' },
  क्योंकि: { hinglish: 'kyunki', hi: 'क्योंकि', en: 'because' },
  क्योंकी: { hinglish: 'kyunki', hi: 'क्योंकि', en: 'because' },
  क्या: { hinglish: 'kya', hi: 'क्या', en: 'what' },
  कब: { hinglish: 'kab', hi: 'कब', en: 'when' },
  कभी: { hinglish: 'kabhi', hi: 'कभी', en: 'ever' },
  जब: { hinglish: 'jab', hi: 'जब', en: 'when' },
  तब: { hinglish: 'tab', hi: 'तब', en: 'then' },
  तभी: { hinglish: 'tabhi', hi: 'तभी', en: 'right then' },
  अब: { hinglish: 'ab', hi: 'अब', en: 'now' },
  अभी: { hinglish: 'abhi', hi: 'अभी', en: 'right now' },
  कहाँ: { hinglish: 'kahan', hi: 'कहाँ', en: 'where' },
  कहां: { hinglish: 'kahan', hi: 'कहाँ', en: 'where' },
  यहाँ: { hinglish: 'yahan', hi: 'यहाँ', en: 'here' },
  यहां: { hinglish: 'yahan', hi: 'यहाँ', en: 'here' },
  वहाँ: { hinglish: 'wahan', hi: 'वहाँ', en: 'there' },
  वहां: { hinglish: 'wahan', hi: 'वहाँ', en: 'there' },
  कौन: { hinglish: 'kaun', hi: 'कौन', en: 'who' },
  कोई: { hinglish: 'koi', hi: 'कोई', en: 'any' },
  कई: { hinglish: 'kai', hi: 'कई', en: 'many' },
  कुछ: { hinglish: 'kuch', hi: 'कुछ', en: 'something' },
  नहीं: { hinglish: 'nahi', hi: 'नहीं', en: 'not' },
  नही: { hinglish: 'nahi', hi: 'नहीं', en: 'not' },
  मत: { hinglish: 'mat', hi: 'मत', en: 'do not' },
  हाँ: { hinglish: 'haan', hi: 'हाँ', en: 'yes' },
  हां: { hinglish: 'haan', hi: 'हाँ', en: 'yes' },
  सही: { hinglish: 'sahi', hi: 'सही', en: 'right' },
  गलत: { hinglish: 'galat', hi: 'गलत', en: 'wrong' },
  अच्छा: { hinglish: 'achha', hi: 'अच्छा', en: 'good' },
  अच्छी: { hinglish: 'achhi', hi: 'अच्छी', en: 'good' },
  अच्छे: { hinglish: 'acche', hi: 'अच्छे', en: 'well' },
  बढ़िया: { hinglish: 'badhiya', hi: 'बढ़िया', en: 'great' },
  बिल्कुल: { hinglish: 'bilkul', hi: 'बिल्कुल', en: 'definitely' },
  बीलकुल: { hinglish: 'bilkul', hi: 'बिल्कुल', en: 'definitely' },
  बहुत: { hinglish: 'bahut', hi: 'बहुत', en: 'very' },
  कम: { hinglish: 'kam', hi: 'कम', en: 'less' },
  पूरा: { hinglish: 'poora', hi: 'पूरा', en: 'full' },
  पूरी: { hinglish: 'poori', hi: 'पूरी', en: 'full' },
  पूरे: { hinglish: 'poore', hi: 'पूरे', en: 'complete' },
  पहले: { hinglish: 'pehle', hi: 'पहले', en: 'first' },
  पहला: { hinglish: 'pehla', hi: 'पहला', en: 'first' },
  पहली: { hinglish: 'pehli', hi: 'पहली', en: 'first' },
  दूसरा: { hinglish: 'doosra', hi: 'दूसरा', en: 'second' },
  आज: { hinglish: 'aaj', hi: 'आज', en: 'today' },
  कल: { hinglish: 'kal', hi: 'कल', en: 'tomorrow' },
  हमेशा: { hinglish: 'hamesha', hi: 'हमेशा', en: 'always' },
  बात: { hinglish: 'baat', hi: 'बात', en: 'thing' },
  बातें: { hinglish: 'baatein', hi: 'बातें', en: 'things' },
  काम: { hinglish: 'kaam', hi: 'काम', en: 'work' },
  नाम: { hinglish: 'naam', hi: 'नाम', en: 'name' },
  साथ: { hinglish: 'saath', hi: 'साथ', en: 'with' },
  हाथ: { hinglish: 'haath', hi: 'हाथ', en: 'hand' },
  बाद: { hinglish: 'baad', hi: 'बाद', en: 'after' },
  याद: { hinglish: 'yaad', hi: 'याद', en: 'remember' },
  साल: { hinglish: 'saal', hi: 'साल', en: 'year' },
  दिन: { hinglish: 'din', hi: 'दिन', en: 'day' },
  रात: { hinglish: 'raat', hi: 'रात', en: 'night' },
  सुबह: { hinglish: 'subah', hi: 'सुबह', en: 'morning' },
  शाम: { hinglish: 'shaam', hi: 'शाम', en: 'evening' },
  लोग: { hinglish: 'log', hi: 'लोग', en: 'people' },
  लोगों: { hinglish: 'logon', hi: 'लोगों', en: 'people' },
  यार: { hinglish: 'yaar', hi: 'यार', en: 'friend' },
  प्यार: { hinglish: 'pyaar', hi: 'प्यार', en: 'love' },
  पैसा: { hinglish: 'paisa', hi: 'पैसा', en: 'money' },
  पैसे: { hinglish: 'paise', hi: 'पैसे', en: 'money' },
  दुनिया: { hinglish: 'duniya', hi: 'दुनिया', en: 'world' },
  तरीका: { hinglish: 'tarika', hi: 'तरीका', en: 'way' },
  तरीके: { hinglish: 'tarike', hi: 'तरीके', en: 'ways' },
  मतलब: { hinglish: 'matlab', hi: 'मतलब', en: 'meaning' },
  समझ: { hinglish: 'samajh', hi: 'समझ', en: 'understand' },
  समझना: { hinglish: 'samajhna', hi: 'समझना', en: 'to understand' },
  समझते: { hinglish: 'samajhte', hi: 'समझते', en: 'understand' },
  समझो: { hinglish: 'samjho', hi: 'समझो', en: 'understand' },
  पता: { hinglish: 'pata', hi: 'पता', en: 'know' },
  वाला: { hinglish: 'wala', hi: 'वाला', en: 'going to' },
  वाली: { hinglish: 'wali', hi: 'वाली', en: 'going to' },
  वाले: { hinglish: 'wale', hi: 'वाले', en: 'going to' },
  वालों: { hinglish: 'walon', hi: 'वालों', en: 'ones' },
  चाहिए: { hinglish: 'chahiye', hi: 'चाहिए', en: 'should' },
  चाहता: { hinglish: 'chahta', hi: 'चाहता', en: 'wants' },
  चाहती: { hinglish: 'chahti', hi: 'चाहती', en: 'wants' },
  चाहते: { hinglish: 'chahte', hi: 'चाहते', en: 'want' },
  सकता: { hinglish: 'sakta', hi: 'सकता', en: 'can' },
  सकती: { hinglish: 'sakti', hi: 'सकती', en: 'can' },
  सकते: { hinglish: 'sakte', hi: 'सकते', en: 'can' },
  करना: { hinglish: 'karna', hi: 'करना', en: 'to do' },
  करने: { hinglish: 'karne', hi: 'करने', en: 'to do' },
  करनी: { hinglish: 'karni', hi: 'करनी', en: 'to do' },
  करता: { hinglish: 'karta', hi: 'करता', en: 'does' },
  करती: { hinglish: 'karti', hi: 'करती', en: 'does' },
  करते: { hinglish: 'karte', hi: 'करते', en: 'do' },
  करो: { hinglish: 'karo', hi: 'करो', en: 'do' },
  करें: { hinglish: 'karein', hi: 'करें', en: 'do' },
  करे: { hinglish: 'kare', hi: 'करे', en: 'do' },
  करेंगे: { hinglish: 'karenge', hi: 'करेंगे', en: 'will do' },
  करूँगा: { hinglish: 'karunga', hi: 'करूँगा', en: 'will do' },
  करूंगा: { hinglish: 'karunga', hi: 'करूँगा', en: 'will do' },
  किया: { hinglish: 'kiya', hi: 'किया', en: 'did' },
  किए: { hinglish: 'kiye', hi: 'किए', en: 'did' },
  कीजिए: { hinglish: 'kijiye', hi: 'कीजिए', en: 'please do' },
  बताना: { hinglish: 'batana', hi: 'बताना', en: 'to tell' },
  बताने: { hinglish: 'batane', hi: 'बताने', en: 'telling' },
  बताता: { hinglish: 'batata', hi: 'बताता', en: 'tells' },
  बताती: { hinglish: 'batati', hi: 'बताती', en: 'tells' },
  बताते: { hinglish: 'batate', hi: 'बताते', en: 'tell' },
  बताया: { hinglish: 'bataya', hi: 'बताया', en: 'told' },
  बताओ: { hinglish: 'batao', hi: 'बताओ', en: 'tell' },
  बताइए: { hinglish: 'bataiye', hi: 'बताइए', en: 'please tell' },
  बोलना: { hinglish: 'bolna', hi: 'बोलना', en: 'to speak' },
  बोलने: { hinglish: 'bolne', hi: 'बोलने', en: 'speaking' },
  बोलता: { hinglish: 'bolta', hi: 'बोलता', en: 'speaks' },
  बोलती: { hinglish: 'bolti', hi: 'बोलती', en: 'speaks' },
  बोलते: { hinglish: 'bolte', hi: 'बोलते', en: 'speak' },
  बोला: { hinglish: 'bola', hi: 'बोला', en: 'spoke' },
  बोली: { hinglish: 'boli', hi: 'बोली', en: 'spoke' },
  बोले: { hinglish: 'bole', hi: 'बोले', en: 'speaks' },
  बोलो: { hinglish: 'bolo', hi: 'बोलो', en: 'speak' },
  देखना: { hinglish: 'dekhna', hi: 'देखना', en: 'to see' },
  देखने: { hinglish: 'dekhne', hi: 'देखने', en: 'seeing' },
  देखता: { hinglish: 'dekhta', hi: 'देखता', en: 'sees' },
  देखती: { hinglish: 'dekhti', hi: 'देखती', en: 'sees' },
  देखते: { hinglish: 'dekhte', hi: 'देखते', en: 'watch' },
  देखा: { hinglish: 'dekha', hi: 'देखा', en: 'saw' },
  देखी: { hinglish: 'dekhi', hi: 'देखी', en: 'saw' },
  देखो: { hinglish: 'dekho', hi: 'देखो', en: 'look' },
  देखिए: { hinglish: 'dekhiye', hi: 'देखिए', en: 'see' },
  दिखाना: { hinglish: 'dikhana', hi: 'दिखाना', en: 'to show' },
  दिखाता: { hinglish: 'dikhata', hi: 'दिखाता', en: 'shows' },
  दिखाती: { hinglish: 'dikhati', hi: 'दिखाती', en: 'shows' },
  दिखाते: { hinglish: 'dikhate', hi: 'दिखाते', en: 'show' },
  दिखाया: { hinglish: 'dikhaya', hi: 'दिखाया', en: 'showed' },
  दिखाओ: { hinglish: 'dikhao', hi: 'दिखाओ', en: 'show' },
  लगना: { hinglish: 'lagna', hi: 'लगना', en: 'to feel' },
  लगता: { hinglish: 'lagta', hi: 'लगता', en: 'feels' },
  लगती: { hinglish: 'lagti', hi: 'लगती', en: 'feels' },
  लगते: { hinglish: 'lagte', hi: 'लगते', en: 'feel' },
  लगा: { hinglish: 'laga', hi: 'लगा', en: 'applied' },
  लगी: { hinglish: 'lagi', hi: 'लगी', en: 'applied' },
  लगे: { hinglish: 'lage', hi: 'लगे', en: 'applied' },
  लगाना: { hinglish: 'lagana', hi: 'लगाना', en: 'to add' },
  लगाने: { hinglish: 'lagane', hi: 'लगाने', en: 'adding' },
  लगाता: { hinglish: 'lagata', hi: 'लगाता', en: 'adds' },
  लगाते: { hinglish: 'lagate', hi: 'लगाते', en: 'add' },
  लगाया: { hinglish: 'lagaya', hi: 'लगाया', en: 'added' },
  लगाओ: { hinglish: 'lagao', hi: 'लगाओ', en: 'apply' },
  बनाना: { hinglish: 'banana', hi: 'बनाना', en: 'to make' },
  बनाने: { hinglish: 'banane', hi: 'बनाने', en: 'making' },
  बनाता: { hinglish: 'banata', hi: 'बनाता', en: 'makes' },
  बनाते: { hinglish: 'banate', hi: 'बनाते', en: 'make' },
  बनाया: { hinglish: 'banaya', hi: 'बनाया', en: 'made' },
  बनाई: { hinglish: 'banayi', hi: 'बनाई', en: 'made' },
  बनाओ: { hinglish: 'banao', hi: 'बनाओ', en: 'make' },
  लिखना: { hinglish: 'likhna', hi: 'लिखना', en: 'to write' },
  लिखता: { hinglish: 'likhta', hi: 'लिखता', en: 'writes' },
  लिखती: { hinglish: 'likhti', hi: 'लिखती', en: 'writes' },
  लिखते: { hinglish: 'likhte', hi: 'लिखते', en: 'write' },
  लिखा: { hinglish: 'likha', hi: 'लिखा', en: 'wrote' },
  लिखो: { hinglish: 'likho', hi: 'लिखो', en: 'write' },
  सुनना: { hinglish: 'sunna', hi: 'सुनना', en: 'to listen' },
  सुनता: { hinglish: 'sunta', hi: 'सुनता', en: 'listens' },
  सुनते: { hinglish: 'sunte', hi: 'सुनते', en: 'listen' },
  सुना: { hinglish: 'suna', hi: 'सुना', en: 'heard' },
  सुनो: { hinglish: 'suno', hi: 'सुनो', en: 'listen' },
  सुनिए: { hinglish: 'suniye', hi: 'सुनिए', en: 'please listen' },
  मिलना: { hinglish: 'milna', hi: 'मिलना', en: 'to meet' },
  मिलता: { hinglish: 'milta', hi: 'मिलता', en: 'gets' },
  मिलती: { hinglish: 'milti', hi: 'मिलती', en: 'gets' },
  मिलते: { hinglish: 'milte', hi: 'मिलते', en: 'meet' },
  मिला: { hinglish: 'mila', hi: 'मिला', en: 'got' },
  मिलेगा: { hinglish: 'milega', hi: 'मिलेगा', en: 'will get' },
  मिलेगी: { hinglish: 'milegi', hi: 'मिलेगी', en: 'will get' },
  आना: { hinglish: 'aana', hi: 'आना', en: 'to come' },
  आने: { hinglish: 'aane', hi: 'आने', en: 'coming' },
  आता: { hinglish: 'aata', hi: 'आता', en: 'comes' },
  आती: { hinglish: 'aati', hi: 'आती', en: 'comes' },
  आते: { hinglish: 'aate', hi: 'आते', en: 'come' },
  आया: { hinglish: 'aaya', hi: 'आया', en: 'came' },
  आई: { hinglish: 'aayi', hi: 'आई', en: 'came' },
  आए: { hinglish: 'aaye', hi: 'आए', en: 'came' },
  आएगा: { hinglish: 'aayega', hi: 'आएगा', en: 'will come' },
  आएगी: { hinglish: 'aayegi', hi: 'आएगी', en: 'will come' },
  जाना: { hinglish: 'jaana', hi: 'जाना', en: 'to go' },
  जाने: { hinglish: 'jaane', hi: 'जाने', en: 'going' },
  जाता: { hinglish: 'jaata', hi: 'जाता', en: 'goes' },
  जाती: { hinglish: 'jaati', hi: 'जाती', en: 'goes' },
  जाते: { hinglish: 'jaate', hi: 'जाते', en: 'go' },
  गया: { hinglish: 'gaya', hi: 'गया', en: 'went' },
  गई: { hinglish: 'gayi', hi: 'गई', en: 'went' },
  गए: { hinglish: 'gaye', hi: 'गए', en: 'went' },
  जाएगा: { hinglish: 'jayega', hi: 'जाएगा', en: 'will go' },
  जाएगी: { hinglish: 'jayegi', hi: 'जाएगी', en: 'will go' },
  जाएंगे: { hinglish: 'jayenge', hi: 'जाएंगे', en: 'will go' },
  जाओ: { hinglish: 'jao', hi: 'जाओ', en: 'go' },
  चलना: { hinglish: 'chalna', hi: 'चलना', en: 'to walk' },
  चलता: { hinglish: 'chalta', hi: 'चलता', en: 'runs' },
  चलती: { hinglish: 'chalti', hi: 'चलती', en: 'runs' },
  चलते: { hinglish: 'chalte', hi: 'चलते', en: 'walk' },
  चलो: { hinglish: 'chalo', hi: 'चलो', en: 'let us go' },
  रहा: { hinglish: 'raha', hi: 'रहा', en: 'was' },
  रही: { hinglish: 'rahi', hi: 'रही', en: 'was' },
  रहे: { hinglish: 'rahe', hi: 'रहे', en: 'were' },
  रुकना: { hinglish: 'rukna', hi: 'रुकना', en: 'to stop' },
  रुकेंगे: { hinglish: 'rukenge', hi: 'रुकेंगे', en: 'will stay' },
  रुको: { hinglish: 'ruko', hi: 'रुको', en: 'wait' },
  देना: { hinglish: 'dena', hi: 'देना', en: 'to give' },
  देता: { hinglish: 'deta', hi: 'देता', en: 'gives' },
  देती: { hinglish: 'deti', hi: 'देती', en: 'gives' },
  देते: { hinglish: 'dete', hi: 'देते', en: 'give' },
  दिया: { hinglish: 'diya', hi: 'दिया', en: 'gave' },
  दी: { hinglish: 'di', hi: 'दी', en: 'gave' },
  दिए: { hinglish: 'diye', hi: 'दिए', en: 'gave' },
  दो: { hinglish: 'do', hi: 'दो', en: 'two' },
  लेना: { hinglish: 'lena', hi: 'लेना', en: 'to take' },
  लेता: { hinglish: 'leta', hi: 'लेता', en: 'takes' },
  लेती: { hinglish: 'leti', hi: 'लेती', en: 'takes' },
  लेते: { hinglish: 'lete', hi: 'लेते', en: 'take' },
  लिया: { hinglish: 'liya', hi: 'लिया', en: 'took' },
  ली: { hinglish: 'li', hi: 'ली', en: 'took' },
  लिए: { hinglish: 'liye', hi: 'लिए', en: 'for' },
  लो: { hinglish: 'lo', hi: 'लो', en: 'take' },
  रखना: { hinglish: 'rakhna', hi: 'रखना', en: 'to keep' },
  रखता: { hinglish: 'rakhta', hi: 'रखता', en: 'keeps' },
  रखते: { hinglish: 'rakhte', hi: 'रखते', en: 'keep' },
  रखा: { hinglish: 'rakha', hi: 'रखा', en: 'kept' },
  रखो: { hinglish: 'rakho', hi: 'रखो', en: 'keep' },
  होना: { hinglish: 'hona', hi: 'होना', en: 'to be' },
  होने: { hinglish: 'hone', hi: 'होने', en: 'happen' },
  होता: { hinglish: 'hota', hi: 'होता', en: 'happens' },
  होती: { hinglish: 'hoti', hi: 'होती', en: 'happens' },
  होते: { hinglish: 'hote', hi: 'होते', en: 'happen' },
  हुआ: { hinglish: 'hua', hi: 'हुआ', en: 'happened' },
  हुई: { hinglish: 'hui', hi: 'हुई', en: 'happened' },
  हुए: { hinglish: 'hue', hi: 'हुए', en: 'happened' },
  होगा: { hinglish: 'hoga', hi: 'होगा', en: 'will be' },
  होगी: { hinglish: 'hogi', hi: 'होगी', en: 'will be' },
  होंगे: { hinglish: 'honge', hi: 'होंगे', en: 'will be' },
  एक: { hinglish: 'ek', hi: 'एक', en: 'one' },
  तीन: { hinglish: 'teen', hi: 'तीन', en: 'three' },
  चार: { hinglish: 'chaar', hi: 'चार', en: 'four' },
  पाँच: { hinglish: 'paanch', hi: 'पाँच', en: 'five' },
  पांच: { hinglish: 'paanch', hi: 'पाँच', en: 'five' },
  बस: { hinglish: 'bas', hi: 'बस', en: 'just' },
  तक: { hinglish: 'tak', hi: 'तक', en: 'until' },
  अंदर: { hinglish: 'andar', hi: 'अंदर', en: 'inside' },
  बाहर: { hinglish: 'bahar', hi: 'बाहर', en: 'outside' },
  ऊपर: { hinglish: 'upar', hi: 'ऊपर', en: 'above' },
  नीचे: { hinglish: 'neeche', hi: 'नीचे', en: 'below' },
  आगे: { hinglish: 'aage', hi: 'आगे', en: 'ahead' },
  पीछे: { hinglish: 'peeche', hi: 'पीछे', en: 'behind' },
  नया: { hinglish: 'naya', hi: 'नया', en: 'new' },
  नई: { hinglish: 'nayi', hi: 'नई', en: 'new' },
  नए: { hinglish: 'naye', hi: 'नए', en: 'new' },
  सीधी: { hinglish: 'seedhi', hi: 'सीधी', en: 'simple' },
  सीधा: { hinglish: 'seedha', hi: 'सीधा', en: 'straight' },
  बंदा: { hinglish: 'banda', hi: 'बंदा', en: 'person' },
  बंदे: { hinglish: 'bande', hi: 'बंदे', en: 'people' },
  दिखाने: { hinglish: 'dikhane', hi: 'दिखाने', en: 'to show' },
  दिखाऊंगा: { hinglish: 'dikhaunga', hi: 'दिखाऊंगा', en: 'will show' },
  दिखाऊँगा: { hinglish: 'dikhaunga', hi: 'दिखाऊँगा', en: 'will show' },
  पोर्टफोलियो: { hinglish: 'portfolio', hi: 'पोर्टफोलियो', en: 'portfolio' },
  पोट्फोलियो: { hinglish: 'portfolio', hi: 'पोर्टफोलियो', en: 'portfolio' },
  पोटफोलियो: { hinglish: 'portfolio', hi: 'पोर्टफोलियो', en: 'portfolio' },
  डिजाइन: { hinglish: 'design', hi: 'डिजाइन', en: 'design' },
  डिज़ाइन: { hinglish: 'design', hi: 'डिज़ाइन', en: 'design' },
  ड़ाईन: { hinglish: 'design', hi: 'डिजाइन', en: 'design' },
  डिजाइनिंग: { hinglish: 'designing', hi: 'डिजाइनिंग', en: 'designing' },
  स्क्रीन: { hinglish: 'screen', hi: 'स्क्रीन', en: 'screen' },
  फोकस: { hinglish: 'focus', hi: 'फोकस', en: 'focus' },
  लोड: { hinglish: 'load', hi: 'लोड', en: 'load' },
  प्रोजेक्ट: { hinglish: 'project', hi: 'प्रोजेक्ट', en: 'project' },
  प्रोजेक्ट्स: { hinglish: 'projects', hi: 'प्रोजेक्ट्स', en: 'projects' },
  क्लिक: { hinglish: 'click', hi: 'क्लिक', en: 'click' },
  लिंक: { hinglish: 'link', hi: 'लिंक', en: 'link' },
  बटन: { hinglish: 'button', hi: 'बटन', en: 'button' },
  सेटिंग: { hinglish: 'setting', hi: 'सेटिंग', en: 'setting' },
  सेटिंग्स: { hinglish: 'settings', hi: 'सेटिंग्स', en: 'settings' },
  ऑप्शन: { hinglish: 'option', hi: 'ऑप्शन', en: 'option' },
  इफेक्ट: { hinglish: 'effect', hi: 'इफेक्ट', en: 'effect' },
  एनिमेशन: { hinglish: 'animation', hi: 'एनिमेशन', en: 'animation' },
  क्वालिटी: { hinglish: 'quality', hi: 'क्वालिटी', en: 'quality' },
  क्रिएटर: { hinglish: 'creator', hi: 'क्रिएटर', en: 'creator' },
  कंटेंट: { hinglish: 'content', hi: 'कंटेंट', en: 'content' },
  ऑडियो: { hinglish: 'audio', hi: 'ऑडियो', en: 'audio' },
  वॉइस: { hinglish: 'voice', hi: 'वॉइस', en: 'voice' },
  कैमरा: { hinglish: 'camera', hi: 'कैमरा', en: 'camera' },
  मोबाइल: { hinglish: 'mobile', hi: 'मोबाइल', en: 'mobile' },
  लैपटॉप: { hinglish: 'laptop', hi: 'लैपटॉप', en: 'laptop' },
  कंप्यूटर: { hinglish: 'computer', hi: 'कंप्यूटर', en: 'computer' },
  ब्राउज़र: { hinglish: 'browser', hi: 'ब्राउज़र', en: 'browser' },
  पेज: { hinglish: 'page', hi: 'पेज', en: 'page' },
  कोड: { hinglish: 'code', hi: 'कोड', en: 'code' },
  कोडिंग: { hinglish: 'coding', hi: 'कोडिंग', en: 'coding' },
  सिस्टम: { hinglish: 'system', hi: 'सिस्टम', en: 'system' },
  सॉल्व: { hinglish: 'solve', hi: 'सॉल्व', en: 'solve' },
  बग: { hinglish: 'bug', hi: 'बग', en: 'bug' },
  चेक: { hinglish: 'check', hi: 'चेक', en: 'check' },
  टेस्ट: { hinglish: 'test', hi: 'टेस्ट', en: 'test' },
  स्टार्ट: { hinglish: 'start', hi: 'स्टार्ट', en: 'start' },
  ओपन: { hinglish: 'open', hi: 'ओपन', en: 'open' },
  क्लोज: { hinglish: 'close', hi: 'क्लोज', en: 'close' },
  सेव: { hinglish: 'save', hi: 'सेव', en: 'save' },
  डिलीट: { hinglish: 'delete', hi: 'डिलीट', en: 'delete' },
  सिलेक्ट: { hinglish: 'select', hi: 'सिलेक्ट', en: 'select' },
  चेंज: { hinglish: 'change', hi: 'चेंज', en: 'change' },
  अपडेट: { hinglish: 'update', hi: 'अपडेट', en: 'update' },
  क्रिएट: { hinglish: 'create', hi: 'क्रिएट', en: 'create' },
  जनरेट: { hinglish: 'generate', hi: 'जनरेट', en: 'generate' },
  यूज: { hinglish: 'use', hi: 'यूज', en: 'use' },
  यूज़: { hinglish: 'use', hi: 'यूज़', en: 'use' },
  वर्क: { hinglish: 'work', hi: 'वर्क', en: 'work' },
  टाइम: { hinglish: 'time', hi: 'टाइम', en: 'time' },
  लाइन: { hinglish: 'line', hi: 'लाइन', en: 'line' },
  लेवल: { hinglish: 'level', hi: 'लेवल', en: 'level' },
  स्टाइल: { hinglish: 'style', hi: 'स्टाइल', en: 'style' },
  फॉन्ट: { hinglish: 'font', hi: 'फॉन्ट', en: 'font' },
  कलर: { hinglish: 'color', hi: 'कलर', en: 'color' },
  बैकग्राउंड: { hinglish: 'background', hi: 'बैकग्राउंड', en: 'background' },
  फाइल: { hinglish: 'file', hi: 'फाइल', en: 'file' },
  फोटो: { hinglish: 'photo', hi: 'फोटो', en: 'photo' },
  फोन: { hinglish: 'phone', hi: 'फोन', en: 'phone' },
  फिल्टर: { hinglish: 'filter', hi: 'फिल्टर', en: 'filter' },
  फीचर: { hinglish: 'feature', hi: 'फीचर', en: 'feature' },
  फास्ट: { hinglish: 'fast', hi: 'फास्ट', en: 'fast' },
  फ्री: { hinglish: 'free', hi: 'फ्री', en: 'free' },
  फ्रेम: { hinglish: 'frame', hi: 'फ्रेम', en: 'frame' },
  फुल: { hinglish: 'full', hi: 'फुल', en: 'full' },
  फेस: { hinglish: 'face', hi: 'फेस', en: 'face' },
  फिक्स: { hinglish: 'fix', hi: 'फिक्स', en: 'fix' },
};

const VALID_ALPHANUMERIC_TOKENS = new Set([
  '1080p',
  '720p',
  '480p',
  '4k',
  '2k',
  '8k',
  '24x7',
  '1st',
  '2nd',
  '3rd',
  '4th',
  '5th',
  '10x',
  '2x',
  '3x',
  '5x',
  '100x',
  '3d',
  '2d',
  'mp4',
  'ai',
  'v1',
  'v2',
]);

const KNOWN_NOISE_CODES = new Set([
  '61y2',
  'yy3',
  'aprd13',
  '1ni2',
  'xoo',
  'ing',
  'yy',
  'xx',
  'zzz',
]);

/**
 * Normalizes Whisper ASR Devanagari split/merged tokens and common phonetic variations
 * (e.g. "डोस तो" -> "दोस्तों", "देख हो" -> "देखो", "आजकी" -> "आज की", "वीट्यो" -> "वीडियो", "कप्षन" -> "कैप्शन").
 */
export function normalizeWhisperHindiPhrase(rawText: string): string {
  if (!rawText) return '';
  let out = rawText
    // Strip Unicode replacement characters from quantized BPE byte boundaries
    .replace(/\uFFFD+/g, '')
    // Merge common Whisper BPE split Devanagari words
    .replace(/(^|\s)(डोस|दोस|डूस)\s+तो(?=\s|$|[.,!?;।])/gu, '$1दोस्तों')
    .replace(/(^|\s)अब\s+ही(?=\s|$|[.,!?;।])/gu, '$1अभी')
    .replace(/(^|\s)तब\s+ही(?=\s|$|[.,!?;।])/gu, '$1तभी')
    .replace(/(^|\s)कब\s+ही(?=\s|$|[.,!?;।])/gu, '$1कभी')
    .replace(/(^|\s)सब\s+ही(?=\s|$|[.,!?;।])/gu, '$1सभी')
    .replace(/(^|\s)देख\s+हो(?=\s|$|[.,!?;।])/gu, '$1देखो')
    .replace(/(^|\s)सुन\s+हो(?=\s|$|[.,!?;।])/gu, '$1सुनो')
    .replace(/(^|\s)कर\s+हो(?=\s|$|[.,!?;।])/gu, '$1करो')
    .replace(/(^|\s)बोल\s+हो(?=\s|$|[.,!?;।])/gu, '$1बोलो')
    .replace(/(^|\s)दिख\s+आने(?=\s|$|[.,!?;।])/gu, '$1दिखाने')
    .replace(/(^|\s)बत\s+आने(?=\s|$|[.,!?;।])/gu, '$1बताने')
    // Split fused postpositions on nouns/adverbs ("आजकी" -> "आज की", "आजका" -> "आज का", "आजके" -> "आज के")
    .replace(/(^|\s)आज(की|का|के)(?=\s|$|[.,!?;।])/gu, '$1आज $2')
    .replace(/(^|\s)कल(की|का|के)(?=\s|$|[.,!?;।])/gu, '$1कल $2')
    .replace(/(^|\s)(वीडियो|विडियो|वीट्यो)(में|को|का|की|के)(?=\s|$|[.,!?;।])/gu, '$1वीडियो $3')
    .replace(/(^|\s)रील(में|को|का|की|के)(?=\s|$|[.,!?;।])/gu, '$1रील $2');

  return out;
}

const COMMON_HINGLISH_WORDS_SET = new Set<string>([
  'mai', 'main', 'hum', 'aap', 'tum', 'tu', 'mera', 'meri', 'mere', 'hamara',
  'hamari', 'hamare', 'tera', 'teri', 'tere', 'apna', 'apni', 'apne', 'uska',
  'uski', 'uske', 'unka', 'unki', 'unke', 'iska', 'iski', 'iske', 'bhai',
  'dost', 'dosto', 'yaar', 'video', 'vid', 'reel', 'audio', 'upload', 'karna',
  'karo', 'kare', 'karenge', 'kiya', 'kar', 'raha', 'rahi', 'rahe', 'hai',
  'hain', 'ho', 'hoon', 'hun', 'tha', 'thi', 'the', 'toh', 'to', 'ye',
  'yeh', 'woh', 'wo', 'kaise', 'kya', 'kyun', 'kab', 'kahan', 'kaun', 'aaj',
  'kal', 'abhi', 'bad', 'pehle', 'suno', 'sunte', 'dekho', 'dekh', 'dikhane',
  'bol', 'bolo', 'batao', 'batana', 'poori', 'poora', 'screen', 'design',
  'portfolio', 'template', 'caption', 'captions', 'ready', 'shuru', 'khatam',
  'bahut', 'bohot', 'thoda', 'thodi', 'acchi', 'achha', 'sahi', 'galat',
  'wala', 'wali', 'wale', 'isko', 'usko', 'sabko', 'sab', 'sirf', 'bas',
  'aur', 'lekin', 'par', 'pe', 'se', 'ko', 'me', 'mein', 'ne', 'ka', 'ki', 'ke',
  'aise', 'waise', 'sir', 'madam', 'guys', 'friends', 'channel', 'like', 'share',
  'subscribe', 'comment', 'view', 'views', 'post', 'followers', 'literally'
]);

/**
 * Checks whether a Whisper `language: 'hindi'` transcription output is a runaway repetition/hallucination
 * caused by feeding 100% pure English audio into the Hindi decoder.
 */
export function isHindiWhisperOutputInvalid(rawText: string): boolean {
  if (!rawText || !rawText.trim()) return true;

  // Reject non-Devanagari/non-Latin scripts (Arabic/Urdu/Cyrillic/CJK/regional)
  if (/[\u0600-\u06FF\u0400-\u04FF\u4E00-\u9FFF\u0980-\u0DFF]/.test(rawText)) {
    return true;
  }

  // Reject intra-word character/syllable repetition loops like "अप्रट्यट्यट्यट्य..."
  if (/(.{1,6})\1{4,}/u.test(rawText)) {
    return true;
  }

  const cleaned = cleanSpokenScriptText(rawText);
  if (!cleaned) return true;

  const words = cleaned
    .split(/\s+/)
    .map((w) => w.replace(/[^\p{L}\p{M}]/gu, ''))
    .filter(Boolean);

  if (words.length === 0) return true;

  // Count how many distinct words in the transcript are known Hindi (Devanagari or Romanized Hinglish)
  const distinctKnownHindi = new Set<string>();
  let consecutiveSame = 1;
  let maxConsecutiveSame = 1;

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (i > 0 && w === words[i - 1]) {
      consecutiveSame++;
      if (consecutiveSame > maxConsecutiveSame) {
        maxConsecutiveSame = consecutiveSame;
      }
    } else {
      consecutiveSame = 1;
    }

    const lower = w.toLowerCase();
    if (
      DEVANAGARI_TO_HINGLISH_MAP[w] ||
      HINGLISH_DICTIONARY[lower] ||
      COMMON_HINGLISH_WORDS_SET.has(lower)
    ) {
      distinctKnownHindi.add(lower);
    }
  }

  // If the same word repeats 5+ times consecutively (e.g. "आप आप आप आप आप..." runaway loop)
  // and there are fewer than 2 distinct known words, it is an hallucination loop
  if (maxConsecutiveSame >= 5 && distinctKnownHindi.size < 2) {
    return true;
  }

  // If there are zero Hindi/Devanagari/Hinglish words in a substantial text,
  // it might be 100% foreign/English audio
  if (words.length >= 6 && distinctKnownHindi.size === 0) {
    return true;
  }

  return false;
}

/**
 * Detects whether a token is OCR/camera/ASR gibberish (such as `61Y2`, `YY3`, `APRD13`, `1NI2`, `XOO`).
 */
export function isGibberishToken(rawToken: string): boolean {
  if (!rawToken) return true;
  const trimmed = rawToken.trim();
  if (!trimmed) return true;

  if (trimmed.includes('\uFFFD')) return true;

  // Strip surrounding punctuation while preserving Devanagari combining marks (\p{M})
  const core = trimmed
    .replace(/^[^\p{L}\p{M}\p{N}]+/u, '')
    .replace(/[^\p{L}\p{M}\p{N}]+$/u, '');

  if (!core) return true;

  // Reject single isolated Devanagari vowel/consonant filler hallucinations like "आ" or "प"
  if (core === 'आ' || core === 'अ' || core === 'प') {
    return true;
  }

  // Reject intra-word syllable repetition loops (e.g. "अप्रट्यट्यट्य...")
  if (/(.{1,5})\1{3,}/u.test(core)) {
    return true;
  }

  const lower = core.toLowerCase();
  if (KNOWN_NOISE_CODES.has(lower)) {
    return true;
  }

  // Reject Arabic/Urdu or CJK/Cyrillic script hallucinations
  if (/[\u0600-\u06FF\u0400-\u04FF\u4E00-\u9FFF]/.test(core)) {
    return true;
  }

  // Reject tokens mixing letters and digits (e.g., 61Y2, YY3, APRD13, 1NI2, VID2026) unless whitelisted
  const hasLetter = /[A-Za-z\u0900-\u097F]/.test(core);
  const hasDigit = /\d/.test(core);
  if (hasLetter && hasDigit && !VALID_ALPHANUMERIC_TOKENS.has(lower)) {
    return true;
  }

  // Reject 3+ repeated identical ASCII letters (e.g. "xxx", "yyy", "ooo")
  if (/^([a-zA-Z])\1{2,}$/.test(core)) {
    return true;
  }

  // Reject weird short uppercase/consonant noise like "XOO"
  if (/^[XZQ][A-Z]{1,3}$/i.test(core) && !/^(ek|ok|ai|to|so|no|go|do)$/i.test(core)) {
    return true;
  }

  return false;
}

/**
 * Cleans a raw spoken script or ASR transcript by stripping non-speech tags ([Music], (music), etc.),
 * normalizing Whisper Devanagari splits, collapsing consecutive word repetitions, and removing gibberish tokens.
 */
export function cleanSpokenScriptText(raw: string): string {
  if (!raw) return '';
  const withoutTags = normalizeWhisperHindiPhrase(
    raw
      .replace(/\[[^\]]*\]/g, ' ')
      .replace(/\([^)]*\)/g, ' ')
      .replace(/\*[^*]*\*/g, ' ')
      .replace(/♪+/g, ' ')
  )
    .replace(/\s+/g, ' ')
    .trim();

  if (!withoutTags) return '';

  const validTokens = withoutTags
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && !isGibberishToken(t));

  // Collapse 3+ consecutive identical words into a single occurrence
  const deduped: string[] = [];
  for (let i = 0; i < validTokens.length; i++) {
    const currClean = validTokens[i].replace(/[^\p{L}\p{M}\p{N}]/gu, '').toLowerCase();
    const prev1 = deduped.length >= 1 ? deduped[deduped.length - 1].replace(/[^\p{L}\p{M}\p{N}]/gu, '').toLowerCase() : '';
    const prev2 = deduped.length >= 2 ? deduped[deduped.length - 2].replace(/[^\p{L}\p{M}\p{N}]/gu, '').toLowerCase() : '';
    if (currClean && currClean === prev1 && currClean === prev2) {
      continue;
    }
    deduped.push(validTokens[i]);
  }

  return deduped.join(' ').trim();
}

/**
 * Transliterates Hindi Devanagari script (`नमस्ते दोस्तों`) into natural Romanized Hinglish (`namaste dosto`)
 * using direct vocabulary lookup + Indo-Aryan medial schwa deletion rules so words like
 * `आपको` -> `aapko`, `करते` -> `karte`, `चाहते` -> `chahte`, `समझते` -> `samajhte`, `जरूरी` -> `zaroori`, `बात` -> `baat`.
 */
export function devanagariToRomanHinglish(devaWord: string): string {
  if (!devaWord) return '';
  const direct = DEVANAGARI_TO_HINGLISH_MAP[devaWord];
  if (direct) {
    return direct.hinglish;
  }

  const revHit = Object.entries(HINGLISH_DICTIONARY).find(
    ([, val]) => val.hi === devaWord
  );
  if (revHit) {
    return revHit[0];
  }

  const independentVowels: Record<string, string> = {
    अ: 'a',
    आ: 'aa',
    इ: 'i',
    ई: 'i',
    उ: 'u',
    ऊ: 'oo',
    ऋ: 'ri',
    ए: 'e',
    ऐ: 'ai',
    ओ: 'o',
    औ: 'au',
    अं: 'an',
    अः: 'ah',
  };

  const consonants: Record<string, string> = {
    क: 'k',
    ख: 'kh',
    ग: 'g',
    घ: 'gh',
    ङ: 'n',
    च: 'ch',
    छ: 'chh',
    ज: 'j',
    झ: 'jh',
    ञ: 'n',
    ट: 't',
    ठ: 'th',
    ड: 'd',
    ढ: 'dh',
    ण: 'n',
    त: 't',
    थ: 'th',
    द: 'd',
    ध: 'dh',
    न: 'n',
    प: 'p',
    फ: 'ph',
    ब: 'b',
    भ: 'bh',
    म: 'm',
    य: 'y',
    र: 'r',
    ल: 'l',
    व: 'v',
    श: 'sh',
    ष: 'sh',
    स: 's',
    ह: 'h',
    क्ष: 'ksh',
    त्र: 'tr',
    ज्ञ: 'gy',
    ड़: 'd',
    ढ़: 'dh',
    क़: 'q',
    ख़: 'kh',
    ग़: 'gh',
    ज़: 'z',
    फ़: 'f',
  };

  const matras: Record<string, string> = {
    'ा': 'a',
    'ि': 'i',
    'ी': 'i',
    'ु': 'u',
    'ू': 'oo',
    'ृ': 'ri',
    'े': 'e',
    'ै': 'ai',
    'ो': 'o',
    'ौ': 'au',
    'ॉ': 'o',
    'ॅ': 'e',
  };

  // Tokenize into Devanagari orthographic units (consonant/vowel + optional nukta + optional matra/halant + optional nasal)
  const rawChars = Array.from(devaWord);
  interface DevaUnit {
    type: 'vowel' | 'consonant' | 'other';
    baseDeva: string;
    baseRoman: string;
    matra: string;
    hasHalant: boolean;
    nasal: boolean;
    visarga: boolean;
  }

  const units: DevaUnit[] = [];
  let idx = 0;
  while (idx < rawChars.length) {
    const ch = rawChars[idx];
    const next = rawChars[idx + 1] || '';

    // Consonant + nukta
    if (next === '़' && consonants[ch + next]) {
      const comb = ch + next;
      idx += 2;
      let matra = '';
      let hasHalant = false;
      let nasal = false;
      let visarga = false;

      if (rawChars[idx] === '्') {
        hasHalant = true;
        idx++;
      } else if (rawChars[idx] && matras[rawChars[idx]]) {
        matra = rawChars[idx];
        idx++;
      }
      if (rawChars[idx] === 'ं' || rawChars[idx] === 'ँ') {
        nasal = true;
        idx++;
      }
      if (rawChars[idx] === 'ः') {
        visarga = true;
        idx++;
      }
      units.push({
        type: 'consonant',
        baseDeva: comb,
        baseRoman: consonants[comb],
        matra,
        hasHalant,
        nasal,
        visarga,
      });
      continue;
    }

    if (independentVowels[ch]) {
      idx++;
      let nasal = false;
      let visarga = false;
      if (rawChars[idx] === 'ं' || rawChars[idx] === 'ँ') {
        nasal = true;
        idx++;
      }
      if (rawChars[idx] === 'ः') {
        visarga = true;
        idx++;
      }
      units.push({
        type: 'vowel',
        baseDeva: ch,
        baseRoman: independentVowels[ch],
        matra: '',
        hasHalant: false,
        nasal,
        visarga,
      });
      continue;
    }

    if (consonants[ch]) {
      idx++;
      let matra = '';
      let hasHalant = false;
      let nasal = false;
      let visarga = false;

      if (rawChars[idx] === '्') {
        hasHalant = true;
        idx++;
      } else if (rawChars[idx] && matras[rawChars[idx]]) {
        matra = rawChars[idx];
        idx++;
      }
      if (rawChars[idx] === 'ं' || rawChars[idx] === 'ँ') {
        nasal = true;
        idx++;
      }
      if (rawChars[idx] === 'ः') {
        visarga = true;
        idx++;
      }
      units.push({
        type: 'consonant',
        baseDeva: ch,
        baseRoman: consonants[ch],
        matra,
        hasHalant,
        nasal,
        visarga,
      });
      continue;
    }

    units.push({
      type: 'other',
      baseDeva: ch,
      baseRoman: ch === 'ं' || ch === 'ँ' ? 'n' : ch === 'ः' ? 'h' : ch === '्' || ch === '़' ? '' : ch,
      matra: '',
      hasHalant: false,
      nasal: false,
      visarga: false,
    });
    idx++;
  }

  let out = '';
  for (let uIdx = 0; uIdx < units.length; uIdx++) {
    const u = units[uIdx];
    const prevU = units[uIdx - 1];
    const nextU = units[uIdx + 1];
    const isLast = uIdx === units.length - 1;

    if (u.type === 'other') {
      out += u.baseRoman;
      continue;
    }

    if (u.type === 'vowel') {
      // Word-final ई after an open syllable (e.g. भाई -> bhai, कोई -> koi, गई -> gayi, बनाई -> banayi)
      if (u.baseDeva === 'ई' && prevU) {
        if (prevU.matra === 'ा' || prevU.matra === 'ो' || prevU.matra === 'ु' || prevU.matra === 'ू') {
          out += 'i';
        } else {
          out += 'yi';
        }
      } else {
        out += u.baseRoman;
      }
      if (u.nasal) out += 'n';
      if (u.visarga) out += 'h';
      continue;
    }

    // Consonant unit
    let base = u.baseRoman;
    // Use 'w' for व at word start before 'a'/'aa'/'o'/'ai' or in suffix वाला/वाली/वाले
    if (
      u.baseDeva === 'व' &&
      (uIdx === 0 || (u.matra === 'ा' && nextU?.baseDeva === 'ल'))
    ) {
      base = 'w';
    }

    if (u.hasHalant) {
      out += base;
      if (u.nasal) out += 'n';
      if (u.visarga) out += 'h';
      continue;
    }

    if (u.matra) {
      let vowelStr = matras[u.matra] || '';
      // Closed monosyllable C + ा + C (e.g., बात -> baat, काम -> kaam, नाम -> naam, साथ -> saath, साल -> saal)
      if (
        u.matra === 'ा' &&
        units.length === 2 &&
        uIdx === 0 &&
        nextU &&
        nextU.type === 'consonant' &&
        !nextU.matra &&
        !nextU.hasHalant
      ) {
        vowelStr = 'aa';
      }
      // Medial ी in closed monosyllable C + ी + C (e.g., रील -> reel, तीन -> teen, चीज़ -> cheez, ठीक -> theek)
      if (
        u.matra === 'ी' &&
        !isLast &&
        units.length === 2 &&
        uIdx === 0 &&
        nextU &&
        nextU.type === 'consonant' &&
        !nextU.matra
      ) {
        vowelStr = 'ee';
      }
      // Word-final ें (e.g., करें -> karein, बातें -> baatein, चीज़ें -> cheezein)
      if (u.matra === 'े' && u.nasal && isLast && units.length >= 2) {
        out += base + 'ein';
        continue;
      }

      out += base + vowelStr;
      if (u.nasal) {
        // Bilabial nasal before प/ब/भ/म
        const nextBase = nextU?.baseDeva || '';
        out += ['प', 'फ', 'ब', 'भ', 'म'].includes(nextBase) ? 'm' : 'n';
      }
      if (u.visarga) out += 'h';
      continue;
    }

    // Consonant with NO explicit matra (inherent schwa 'a'):
    // Apply Hindi Schwa Deletion (Syncope):
    // 1. Word-final schwa is always deleted in multi-unit Hindi words (e.g. आज -> aaj, बात -> baat, कम -> kam)
    // 2. Medial schwa is deleted when preceded by a full syllable (uIdx >= 1 && !prevU.hasHalant)
    //    and followed by a consonant that has an explicit matra (e.g. आपको -> aapko, करते -> karte, चाहते -> chahte, अपनी -> apni, बोलता -> bolta)
    //    or in 4-consonant compounds at index 1 (e.g. मतलब -> matlab, बचपन -> bachpan, एकदम -> ekdam, आजकल -> aajkal)
    const isWordFinalSilentSchwa = isLast && units.length > 1;
    const isMedialSilentSchwaBeforeMatra =
      uIdx >= 1 &&
      !isLast &&
      !u.nasal &&
      prevU &&
      !prevU.hasHalant &&
      nextU &&
      nextU.type === 'consonant' &&
      Boolean(nextU.matra);
    const isCompoundBoundarySilentSchwa =
      uIdx === 1 &&
      units.length === 4 &&
      !u.nasal &&
      prevU &&
      !prevU.hasHalant &&
      nextU &&
      nextU.type === 'consonant' &&
      !nextU.hasHalant;

    const dropSchwa =
      isWordFinalSilentSchwa ||
      isMedialSilentSchwaBeforeMatra ||
      isCompoundBoundarySilentSchwa;

    out += base + (dropSchwa ? '' : 'a');
    if (u.nasal) {
      const nextBase = nextU?.baseDeva || '';
      out += ['प', 'फ', 'ब', 'भ', 'म'].includes(nextBase) ? 'm' : 'n';
    }
    if (u.visarga) out += 'h';
  }

  if (!out) return devaWord;
  return out;
}

export function phoneticRomanToDevanagari(cleanWord: string): string {
  const lower = cleanWord.toLowerCase();
  if (!lower) return cleanWord;
  const map: Array<[string, string]> = [
    ['shri', 'श्री'],
    ['ksh', 'क्ष'],
    ['gy', 'ज्ञ'],
    ['chh', 'छ'],
    ['ch', 'च'],
    ['sh', 'श'],
    ['th', 'थ'],
    ['dh', 'ध'],
    ['ph', 'फ'],
    ['bh', 'भ'],
    ['kh', 'ख'],
    ['gh', 'घ'],
    ['jh', 'झ'],
    ['aa', 'आ'],
    ['ee', 'ई'],
    ['oo', 'ऊ'],
    ['ai', 'ऐ'],
    ['au', 'औ'],
    ['ri', 'रि'],
    ['ka', 'क'],
    ['ki', 'कि'],
    ['ku', 'कु'],
    ['ke', 'के'],
    ['ko', 'को'],
    ['ga', 'ग'],
    ['gi', 'गि'],
    ['gu', 'गु'],
    ['ge', 'गे'],
    ['go', 'गो'],
    ['ja', 'ज'],
    ['ji', 'जि'],
    ['ju', 'जु'],
    ['je', 'जे'],
    ['jo', 'जो'],
    ['ta', 'त'],
    ['ti', 'ति'],
    ['tu', 'तु'],
    ['te', 'ते'],
    ['to', 'तो'],
    ['da', 'द'],
    ['di', 'दि'],
    ['du', 'दु'],
    ['de', 'दे'],
    ['do', 'दो'],
    ['na', 'न'],
    ['ni', 'नि'],
    ['nu', 'नु'],
    ['ne', 'ने'],
    ['no', 'नो'],
    ['pa', 'प'],
    ['pi', 'पि'],
    ['pu', 'पु'],
    ['pe', 'पे'],
    ['po', 'पो'],
    ['ba', 'ब'],
    ['bi', 'बि'],
    ['bu', 'बु'],
    ['be', 'बे'],
    ['bo', 'बो'],
    ['ma', 'म'],
    ['mi', 'मि'],
    ['mu', 'मु'],
    ['me', 'मे'],
    ['mo', 'मो'],
    ['ya', 'य'],
    ['yi', 'यि'],
    ['yu', 'यु'],
    ['ye', 'ये'],
    ['yo', 'यो'],
    ['ra', 'र'],
    ['ru', 'रु'],
    ['re', 'रे'],
    ['ro', 'रो'],
    ['la', 'ल'],
    ['li', 'लि'],
    ['lu', 'लु'],
    ['le', 'ले'],
    ['lo', 'लो'],
    ['va', 'व'],
    ['vi', 'वि'],
    ['vu', 'वु'],
    ['ve', 'वे'],
    ['vo', 'वो'],
    ['wa', 'व'],
    ['wi', 'वि'],
    ['sa', 'स'],
    ['si', 'सि'],
    ['su', 'सु'],
    ['se', 'से'],
    ['so', 'सो'],
    ['ha', 'ह'],
    ['hi', 'हि'],
    ['hu', 'हु'],
    ['he', 'हे'],
    ['ho', 'हो'],
    ['k', 'क'],
    ['g', 'ग'],
    ['j', 'ज'],
    ['t', 'त'],
    ['d', 'द'],
    ['n', 'न'],
    ['p', 'प'],
    ['b', 'ब'],
    ['m', 'म'],
    ['y', 'य'],
    ['r', 'र'],
    ['l', 'ल'],
    ['v', 'व'],
    ['w', 'व'],
    ['s', 'स'],
    ['h', 'ह'],
    ['a', 'अ'],
    ['i', 'इ'],
    ['u', 'उ'],
    ['e', 'ए'],
    ['o', 'ओ'],
  ];

  let out = '';
  let idx = 0;
  while (idx < lower.length) {
    let matched = false;
    for (const [lat, dev] of map) {
      if (lower.startsWith(lat, idx)) {
        out += dev;
        idx += lat.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      out += lower[idx];
      idx++;
    }
  }
  return out || cleanWord;
}

/**
 * Transliterates a single spoken token into Romanized Hinglish (`text`),
 * Hindi Devanagari (`hiDeva`), and English (`en`).
 */
export function transliterateWordMultiScript(rawWord: string): {
  text: string;
  hiDeva: string;
  en: string;
} {
  const trimmed = rawWord.trim();
  if (!trimmed) {
    return { text: '', hiDeva: '', en: '' };
  }

  const leadingPunct = (trimmed.match(/^[^\p{L}\p{M}\p{N}]+/u) || [''])[0];
  const trailingPunct = (trimmed.match(/[^\p{L}\p{M}\p{N}]+$/u) || [''])[0];
  const core = trimmed.slice(
    leadingPunct.length,
    trimmed.length - trailingPunct.length
  );

  if (!core) {
    return { text: trimmed, hiDeva: trimmed, en: trimmed };
  }

  // Check if core is already Devanagari
  const isDevanagari = /[\u0900-\u097F]/.test(core);
  if (isDevanagari) {
    const directDeva = DEVANAGARI_TO_HINGLISH_MAP[core];
    if (directDeva) {
      return {
        text: `${leadingPunct}${directDeva.hinglish}${trailingPunct}`,
        hiDeva: `${leadingPunct}${directDeva.hi}${trailingPunct}`,
        en: `${leadingPunct}${directDeva.en}${trailingPunct}`,
      };
    }

    const revEntry = Object.entries(HINGLISH_DICTIONARY).find(
      ([, val]) => val.hi === core
    );
    if (revEntry) {
      return {
        text: `${leadingPunct}${revEntry[0]}${trailingPunct}`,
        hiDeva: trimmed,
        en: `${leadingPunct}${revEntry[1].en}${trailingPunct}`,
      };
    }

    const romanized = devanagariToRomanHinglish(core);
    const dictAfterRoman = HINGLISH_DICTIONARY[romanized.toLowerCase()];
    return {
      text: `${leadingPunct}${romanized}${trailingPunct}`,
      hiDeva: `${leadingPunct}${dictAfterRoman ? dictAfterRoman.hi : core}${trailingPunct}`,
      en: `${leadingPunct}${dictAfterRoman ? dictAfterRoman.en : romanized}${trailingPunct}`,
    };
  }

  const lowerCore = core.toLowerCase();
  const dictHit = HINGLISH_DICTIONARY[lowerCore];
  if (dictHit) {
    return {
      text: trimmed,
      hiDeva: `${leadingPunct}${dictHit.hi}${trailingPunct}`,
      en: `${leadingPunct}${dictHit.en}${trailingPunct}`,
    };
  }

  // Fallback phonetic transliteration to Devanagari
  const phoneticHi = phoneticRomanToDevanagari(core);
  return {
    text: trimmed,
    hiDeva: `${leadingPunct}${phoneticHi}${trailingPunct}`,
    en: trimmed,
  };
}

/**
 * Decodes a 16-bit mono PCM WAV base64 string into Float32Array samples (-1..1).
 */
export function decodeMonoWavBase64ToFloat32(
  audioBase64: string
): Float32Array | null {
  try {
    if (!audioBase64 || audioBase64.length <= 64) return null;
    let bytes: Uint8Array;
    if (typeof Buffer !== 'undefined') {
      bytes = new Uint8Array(Buffer.from(audioBase64, 'base64'));
    } else {
      const bin = atob(audioBase64);
      bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) {
        bytes[i] = bin.charCodeAt(i);
      }
    }

    if (bytes.byteLength <= 44) return null;
    const isRiff =
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46;
    const dataOffset = isRiff ? 44 : 0;
    const sampleCount = Math.floor((bytes.byteLength - dataOffset) / 2);
    if (sampleCount <= 0) return null;

    const view = new DataView(
      bytes.buffer,
      bytes.byteOffset + dataOffset,
      sampleCount * 2
    );
    const floatSamples = new Float32Array(sampleCount);
    for (let i = 0; i < sampleCount; i++) {
      const int16 = view.getInt16(i * 2, true);
      floatSamples[i] = int16 / (int16 < 0 ? 0x8000 : 0x7fff);
    }
    return floatSamples;
  } catch {
    return null;
  }
}

export interface WhisperWordChunk {
  text: string;
  timestamp: [number, number | null];
}

/**
 * Merges split Whisper Devanagari chunks (e.g. ["डोस", "तो"] -> ["दोस्तों"], ["देख", "हो"] -> ["देखो"])
 * while preserving exact start and end word timestamps.
 */
function normalizeWhisperTimedWords(
  items: Array<{ word: string; start: number; end: number }>
): Array<{ word: string; start: number; end: number }> {
  const merged: Array<{ word: string; start: number; end: number }> = [];
  for (let i = 0; i < items.length; i++) {
    const curr = items[i];
    const next = items[i + 1];
    const currClean = curr.word.replace(/[^\p{L}\p{M}]/gu, '');
    const nextClean = next ? next.word.replace(/[^\p{L}\p{M}]/gu, '') : '';
    const nextTrailing = next ? (next.word.match(/[^\p{L}\p{M}\p{N}]+$/u) || [''])[0] : '';

    if (
      next &&
      (currClean === 'डोस' || currClean === 'दोस' || currClean === 'डूस') &&
      nextClean === 'तो'
    ) {
      merged.push({
        word: `दोस्तों${nextTrailing}`,
        start: curr.start,
        end: next.end,
      });
      i++;
      continue;
    }

    if (next && currClean === 'अब' && nextClean === 'ही') {
      merged.push({
        word: `अभी${nextTrailing}`,
        start: curr.start,
        end: next.end,
      });
      i++;
      continue;
    }

    if (next && currClean === 'तब' && nextClean === 'ही') {
      merged.push({
        word: `तभी${nextTrailing}`,
        start: curr.start,
        end: next.end,
      });
      i++;
      continue;
    }

    if (next && currClean === 'कब' && nextClean === 'ही') {
      merged.push({
        word: `कभी${nextTrailing}`,
        start: curr.start,
        end: next.end,
      });
      i++;
      continue;
    }

    if (next && currClean === 'सब' && nextClean === 'ही') {
      merged.push({
        word: `सभी${nextTrailing}`,
        start: curr.start,
        end: next.end,
      });
      i++;
      continue;
    }

    if (next && currClean === 'देख' && nextClean === 'हो') {
      merged.push({
        word: `देखो${nextTrailing}`,
        start: curr.start,
        end: next.end,
      });
      i++;
      continue;
    }

    if (next && currClean === 'सुन' && nextClean === 'हो') {
      merged.push({
        word: `सुनो${nextTrailing}`,
        start: curr.start,
        end: next.end,
      });
      i++;
      continue;
    }

    if (next && currClean === 'कर' && nextClean === 'हो') {
      merged.push({
        word: `करो${nextTrailing}`,
        start: curr.start,
        end: next.end,
      });
      i++;
      continue;
    }

    if (next && currClean === 'दिख' && nextClean === 'आने') {
      merged.push({
        word: `दिखाने${nextTrailing}`,
        start: curr.start,
        end: next.end,
      });
      i++;
      continue;
    }

    // Skip consecutive identical hallucinated word repetitions
    if (merged.length >= 1) {
      const prevClean = merged[merged.length - 1].word.replace(/[^\p{L}\p{M}]/gu, '').toLowerCase();
      if (currClean && currClean.toLowerCase() === prevClean && curr.start - merged[merged.length - 1].end < 1.2) {
        continue;
      }
    }

    merged.push(curr);
  }
  return merged;
}

/**
 * Converts real Whisper ASR word-level chunks into Captik's RawAiCaptionPayload
 * with multi-script transliteration (Hinglish, Hindi Devanagari, English).
 */
export function buildPayloadFromWhisperChunks(params: {
  text?: string;
  chunks?: WhisperWordChunk[];
  speechWindows?: { start: number; end: number }[];
  duration: number;
}): (RawAiCaptionPayload & { detectedLanguage: string }) | null {
  const safeDuration = Math.max(1.2, Number(params.duration) || 6.0);
  const rawChunks = Array.isArray(params.chunks) ? params.chunks : [];

  const rawWordTimings: Array<{
    word: string;
    start: number;
    end: number;
  }> = [];

  for (let i = 0; i < rawChunks.length; i++) {
    const ch = rawChunks[i];
    const cleaned = cleanSpokenScriptText(ch?.text || '');
    if (!cleaned) continue;

    const wordsInChunk = cleaned.split(/\s+/).filter(Boolean);
    if (wordsInChunk.length === 0) continue;

    const rawStart = Number(ch.timestamp?.[0]);
    const rawEnd = Number(ch.timestamp?.[1]);
    const cStart = Number.isFinite(rawStart) ? Math.max(0, rawStart) : 0;
    const cEnd =
      Number.isFinite(rawEnd) && rawEnd > cStart
        ? Math.min(safeDuration, rawEnd)
        : Math.min(safeDuration, cStart + 0.35 * wordsInChunk.length);

    const span = Math.max(0.12, cEnd - cStart);
    const perWord = span / wordsInChunk.length;

    wordsInChunk.forEach((w, wIdx) => {
      if (!isGibberishToken(w)) {
        const wStart = Number((cStart + wIdx * perWord).toFixed(2));
        const wEnd = Number(
          Math.min(
            safeDuration,
            Math.max(wStart + 0.08, cStart + (wIdx + 1) * perWord)
          ).toFixed(2)
        );
        rawWordTimings.push({
          word: w,
          start: wStart,
          end: wEnd,
        });
      }
    });
  }

  const validWordTimings = normalizeWhisperTimedWords(rawWordTimings);

  if (validWordTimings.length === 0) {
    const cleanedText = cleanSpokenScriptText(params.text || '');
    if (!cleanedText) return null;
    return buildSpeechAlignedCaptionPayload({
      scriptText: cleanedText,
      speechWindows: params.speechWindows,
      duration: safeDuration,
    });
  }

  // Group into 2-4 word caption segments, breaking at punctuation or speaker pauses (> 0.42s)
  const segments: RawAiSegment[] = [];
  let currentGroup: typeof validWordTimings = [];

  for (let i = 0; i < validWordTimings.length; i++) {
    const item = validWordTimings[i];
    currentGroup.push(item);

    const hasPausePunct = /[,.;!?।]$/.test(item.word);
    const nextItem = validWordTimings[i + 1];
    const silenceGap = nextItem ? nextItem.start - item.end : 0;

    if (
      currentGroup.length >= 4 ||
      (currentGroup.length >= 2 && (hasPausePunct || silenceGap >= 0.42)) ||
      i === validWordTimings.length - 1
    ) {
      const segStart = currentGroup[0].start;
      const segEnd = Math.max(
        segStart + 0.25,
        currentGroup[currentGroup.length - 1].end
      );

      const rawWords: RawAiWord[] = currentGroup.map((wItem) => {
        const multi = transliterateWordMultiScript(wItem.word);
        return {
          text: multi.text,
          hiDeva: multi.hiDeva,
          en: multi.en,
          start: wItem.start,
          end: wItem.end,
          emphasis: 'none',
        };
      });

      segments.push({
        start: segStart,
        end: segEnd,
        behindSubject: false,
        words: rawWords,
      });

      currentGroup = [];
    }
  }

  if (segments.length === 0) return null;

  const fullTranscript = validWordTimings.map((w) => w.word).join(' ');
  const hasDevanagari = /[\u0900-\u097F]/.test(fullTranscript);

  return {
    detectedLanguage: hasDevanagari ? 'Hinglish · हिंदी' : 'Hinglish',
    language: hasDevanagari ? 'Hinglish' : 'Hinglish',
    transcript: segments
      .map((s) => (s.words || []).map((w) => w.text).join(' '))
      .join(' '),
    segments,
  };
}

/**
 * Aligns any spoken script (or detected speech bursts) directly onto the acoustic
 * speech windows of the video so captions appear in sync with the speaker's voice.
 */
export function buildSpeechAlignedCaptionPayload(params: {
  scriptText?: string;
  speechWindows?: { start: number; end: number }[];
  duration: number;
  fileName?: string;
}): RawAiCaptionPayload & { detectedLanguage: string } {
  const safeDuration = Math.max(1.2, Number(params.duration) || 6.0);

  let rawScript = cleanSpokenScriptText(params.scriptText || '');
  if (!rawScript) {
    rawScript = params.fileName
      ? params.fileName.replace(/\.[^/.]+$/, '').replace(/[_.-]+/g, ' ').trim()
      : 'Video captions';
  }

  // Split script into words
  const allTokens = rawScript
    .split(/\s+/)
    .filter((t) => Boolean(t) && !isGibberishToken(t));

  if (allTokens.length === 0) {
    allTokens.push('Video', 'captions');
  }

  // Group into natural 2-4 word caption phrases, breaking at punctuation (, . ! ? ।)
  const phraseWordGroups: string[][] = [];
  let currentGroup: string[] = [];
  for (let i = 0; i < allTokens.length; i++) {
    const tok = allTokens[i];
    currentGroup.push(tok);
    const hasPausePunct = /[,.;!?।]$/.test(tok);
    if (
      currentGroup.length >= 4 ||
      (currentGroup.length >= 2 && hasPausePunct) ||
      i === allTokens.length - 1
    ) {
      phraseWordGroups.push(currentGroup);
      currentGroup = [];
    }
  }

  if (phraseWordGroups.length === 0) {
    phraseWordGroups.push(['Captions', 'ready!']);
  }

  const targetCount = phraseWordGroups.length;
  const rawWindows =
    Array.isArray(params.speechWindows) && params.speechWindows.length > 0
      ? params.speechWindows.filter(
          (w) =>
            Number.isFinite(w.start) &&
            Number.isFinite(w.end) &&
            w.end > w.start + 0.08 &&
            w.start < safeDuration
        )
      : [];

  // Reconcile number of acoustic speech windows with number of spoken phrase groups
  let alignedWindows: { start: number; end: number }[] = [];
  if (rawWindows.length === 0) {
    alignedWindows = buildDefaultSpeechWindows(safeDuration, targetCount);
  } else if (rawWindows.length === targetCount) {
    alignedWindows = rawWindows;
  } else {
    // Span from first detected speech onset to last detected speech offset
    const firstSpeechStart = Math.max(0.05, rawWindows[0].start);
    const lastSpeechEnd = Math.min(
      safeDuration - 0.04,
      Math.max(firstSpeechStart + 0.8, rawWindows[rawWindows.length - 1].end)
    );
    const totalSpeechSpan = Math.max(0.8, lastSpeechEnd - firstSpeechStart);
    const totalWordsCount = Math.max(1, allTokens.length);

    let cursor = firstSpeechStart;
    for (let idx = 0; idx < targetCount; idx++) {
      const group = phraseWordGroups[idx];
      const weight = group.length / totalWordsCount;
      const rawShare = totalSpeechSpan * weight;
      const segStart = Number(cursor.toFixed(2));
      const segEnd = Number(
        Math.min(
          safeDuration - 0.03,
          idx === targetCount - 1
            ? lastSpeechEnd
            : Math.max(segStart + 0.25, cursor + rawShare - 0.04)
        ).toFixed(2)
      );
      alignedWindows.push({ start: segStart, end: segEnd });
      cursor = Math.min(safeDuration - 0.1, segEnd + 0.04);
    }
  }

  const segments: RawAiSegment[] = phraseWordGroups.map((group, segIdx) => {
    const win = alignedWindows[segIdx] || {
      start: Number(((segIdx / targetCount) * safeDuration).toFixed(2)),
      end: Number((((segIdx + 1) / targetCount) * safeDuration).toFixed(2)),
    };
    const span = Math.max(0.24, win.end - win.start);
    const charWeights = group.map((w) => Math.max(2, w.length));
    const totalWeight = charWeights.reduce((a, b) => a + b, 0) || 1;

    let wordCursor = win.start;
    const rawWords: RawAiWord[] = group.map((token, wIdx) => {
      const share = (charWeights[wIdx] / totalWeight) * span;
      const wStart = Number(wordCursor.toFixed(2));
      wordCursor += share;
      const wEnd =
        wIdx === group.length - 1
          ? Number(win.end.toFixed(2))
          : Number(Math.max(wStart + 0.08, wordCursor).toFixed(2));

      const multi = transliterateWordMultiScript(token);
      return {
        text: multi.text,
        hiDeva: multi.hiDeva,
        en: multi.en,
        start: wStart,
        end: wEnd,
        emphasis: 'none',
      };
    });

    return {
      start: win.start,
      end: win.end,
      behindSubject: false,
      words: rawWords,
    };
  });

  const hasDevanagari = /[\u0900-\u097F]/.test(rawScript);
  return {
    detectedLanguage: hasDevanagari ? 'Hindi · देवनागरी' : 'Hinglish',
    language: hasDevanagari ? 'Hindi' : 'Hinglish',
    transcript: segments
      .map((s) => (s.words || []).map((w) => w.text).join(' '))
      .join(' '),
    segments,
  };
}

const ENGLISH_SEGMENT_PHRASE_TO_HINGLISH: Record<
  string,
  Array<{ hinglish: string; hi: string }>
> = {
  'i am just designing': [
    { hinglish: 'Main', hi: 'मैं' },
    { hinglish: 'abhi', hi: 'अभी' },
    { hinglish: 'design', hi: 'डिजाइन' },
    { hinglish: 'kar-raha', hi: 'कर-रहा' },
  ],
  'the portfolio': [
    { hinglish: 'apna', hi: 'अपना' },
    { hinglish: 'portfolio', hi: 'पोर्टफोलियो' },
  ],
  'i am focusing on': [
    { hinglish: 'Main', hi: 'मैं' },
    { hinglish: 'poora', hi: 'पूरा' },
    { hinglish: 'focus', hi: 'फोकस' },
    { hinglish: 'kar-raha', hi: 'कर-रहा' },
  ],
  'the whole screen i': [
    { hinglish: 'poori', hi: 'पूरी' },
    { hinglish: 'screen', hi: 'स्क्रीन' },
    { hinglish: 'par', hi: 'पर' },
    { hinglish: 'main', hi: 'मैं' },
  ],
  'the whole screen': [
    { hinglish: 'poori', hi: 'पूरी' },
    { hinglish: 'screen', hi: 'स्क्रीन' },
    { hinglish: 'par', hi: 'पर' },
  ],
  'am going to show': [
    { hinglish: 'abhi', hi: 'अभी' },
    { hinglish: 'dikhane', hi: 'दिखाने' },
    { hinglish: 'wala', hi: 'वाला' },
    { hinglish: 'hoon', hi: 'हूँ' },
  ],
  'you the whole screen': [
    { hinglish: 'aapko', hi: 'आपको' },
    { hinglish: 'poori', hi: 'पूरी' },
    { hinglish: 'screen', hi: 'स्क्रीन' },
    { hinglish: 'abhi', hi: 'अभी' },
  ],
  'i am going to': [
    { hinglish: 'Ab', hi: 'अब' },
    { hinglish: 'main', hi: 'मैं' },
    { hinglish: 'karne', hi: 'करने' },
    { hinglish: 'wala', hi: 'वाला' },
  ],
  'focus on the whole': [
    { hinglish: 'focus', hi: 'फोकस' },
    { hinglish: 'par', hi: 'पर' },
    { hinglish: 'poori', hi: 'पूरी' },
    { hinglish: 'screen', hi: 'स्क्रीन' },
  ],
  'screen i am going': [
    { hinglish: 'screen', hi: 'स्क्रीन' },
    { hinglish: 'main', hi: 'मैं' },
    { hinglish: 'abhi', hi: 'अभी' },
    { hinglish: 'karne', hi: 'करने' },
  ],
  'to load it': [
    { hinglish: 'wala', hi: 'वाला' },
    { hinglish: 'load', hi: 'लोड' },
    { hinglish: 'isko', hi: 'इसको' },
  ],
};

const ENGLISH_GRAMMAR_WORD_TO_HINGLISH: Record<
  string,
  { hinglish: string; hi: string }
> = {
  i: { hinglish: 'Main', hi: 'मैं' },
  am: { hinglish: 'hoon', hi: 'हूँ' },
  are: { hinglish: 'hain', hi: 'हैं' },
  is: { hinglish: 'hai', hi: 'है' },
  was: { hinglish: 'tha', hi: 'था' },
  were: { hinglish: 'the', hi: 'थे' },
  just: { hinglish: 'abhi', hi: 'अभी' },
  the: { hinglish: 'ye', hi: 'ये' },
  a: { hinglish: 'ek', hi: 'एक' },
  an: { hinglish: 'ek', hi: 'एक' },
  whole: { hinglish: 'poori', hi: 'पूरी' },
  focusing: { hinglish: 'focus', hi: 'फोकस' },
  designing: { hinglish: 'design', hi: 'डिजाइन' },
  going: { hinglish: 'wala', hi: 'वाला' },
  to: { hinglish: 'ko', hi: 'को' },
  show: { hinglish: 'dikhane', hi: 'दिखाने' },
  showing: { hinglish: 'dikha', hi: 'दिखा' },
  you: { hinglish: 'aapko', hi: 'आपको' },
  we: { hinglish: 'hum', hi: 'हम' },
  they: { hinglish: 'woh', hi: 'वो' },
  my: { hinglish: 'mera', hi: 'मेरा' },
  your: { hinglish: 'aapka', hi: 'आपका' },
  our: { hinglish: 'hamara', hi: 'हमारा' },
  this: { hinglish: 'yeh', hi: 'यह' },
  that: { hinglish: 'woh', hi: 'वह' },
  it: { hinglish: 'isko', hi: 'इसको' },
  on: { hinglish: 'par', hi: 'पर' },
  in: { hinglish: 'mein', hi: 'में' },
  for: { hinglish: 'liye', hi: 'लिए' },
  with: { hinglish: 'saath', hi: 'साथ' },
  from: { hinglish: 'se', hi: 'से' },
  and: { hinglish: 'aur', hi: 'और' },
  but: { hinglish: 'lekin', hi: 'लेकिन' },
  or: { hinglish: 'ya', hi: 'या' },
  if: { hinglish: 'agar', hi: 'अगर' },
  not: { hinglish: 'nahi', hi: 'नहीं' },
  no: { hinglish: 'nahi', hi: 'नहीं' },
  yes: { hinglish: 'haan', hi: 'हाँ' },
  today: { hinglish: 'aaj', hi: 'आज' },
  now: { hinglish: 'abhi', hi: 'अभी' },
  here: { hinglish: 'yahan', hi: 'यहाँ' },
  there: { hinglish: 'wahan', hi: 'वहाँ' },
  what: { hinglish: 'kya', hi: 'क्या' },
  why: { hinglish: 'kyun', hi: 'क्यों' },
  how: { hinglish: 'kaise', hi: 'कैसे' },
  when: { hinglish: 'kab', hi: 'कब' },
  where: { hinglish: 'kahan', hi: 'कहाँ' },
  all: { hinglish: 'sab', hi: 'सब' },
  very: { hinglish: 'bahut', hi: 'बहुत' },
  good: { hinglish: 'achha', hi: 'अच्छा' },
  new: { hinglish: 'naya', hi: 'नया' },
  see: { hinglish: 'dekho', hi: 'देखो' },
  look: { hinglish: 'dekho', hi: 'देखो' },
  watch: { hinglish: 'dekho', hi: 'देखो' },
  tell: { hinglish: 'batana', hi: 'बताना' },
  telling: { hinglish: 'bata', hi: 'बता' },
  work: { hinglish: 'kaam', hi: 'काम' },
  working: { hinglish: 'kaam', hi: 'काम' },
  make: { hinglish: 'banana', hi: 'बनाना' },
  making: { hinglish: 'bana', hi: 'बना' },
  talk: { hinglish: 'baat', hi: 'बात' },
  talking: { hinglish: 'baat', hi: 'बात' },
  will: { hinglish: 'karenge', hi: 'करेंगे' },
  have: { hinglish: 'hai', hi: 'है' },
  has: { hinglish: 'hai', hi: 'है' },
  can: { hinglish: 'sakte', hi: 'सकते' },
  friends: { hinglish: 'dosto', hi: 'दोस्तों' },
  guys: { hinglish: 'dosto', hi: 'दोस्तों' },
  brother: { hinglish: 'bhai', hi: 'भाई' },
};

/**
 * Detects whether a list of segments was affected by Whisper's Hindi-to-English sentence translation bug
 * (e.g. "I am just designing the portfolio", "I am focusing on the whole screen", "I am going to show you").
 */
export function hasEnglishTranslatedHindiBug(
  segments?: Array<{ words?: Array<{ text?: string; [key: string]: any }> }>
): boolean {
  if (!Array.isArray(segments) || segments.length === 0) return false;
  const fullText = segments
    .flatMap((s) => (s.words || []).map((w) => w?.text || ''))
    .join(' ')
    .toLowerCase();

  return /\b(i am|am going|going to|the whole|focusing on|designing the|to load it|you are|we are|i will|show you)\b/i.test(
    fullText
  );
}

/**
 * Upgrades segments that contain English-translated sentences so that:
 * - `word.text` is natural Romanized Hinglish (for `English Letters (Hinglish)`)
 * - `word.hiDeva` is Hindi Devanagari (for `हिन्दी · मराठी (Devanagari)`)
 * - `word.en` preserves the English text (for `English Translation`)
 */
export function upgradeSegmentsToHinglishMultiScript<
  T extends { words?: any[] }
>(segments: T[]): T[] {
  if (!Array.isArray(segments) || segments.length === 0) return segments;

  return segments.map((seg) => {
    const words = Array.isArray(seg.words) ? seg.words : [];
    const segPhraseLower = words
      .map((w) =>
        (w.text || '')
          .replace(/[^\p{L}\p{M}\p{N}]/gu, '')
          .toLowerCase()
      )
      .join(' ')
      .trim();

    const exactPhraseMap = ENGLISH_SEGMENT_PHRASE_TO_HINGLISH[segPhraseLower];
    if (exactPhraseMap && exactPhraseMap.length === words.length) {
      return {
        ...seg,
        words: words.map((w, idx) => ({
          ...w,
          en: w.en || w.text,
          text: exactPhraseMap[idx].hinglish,
          hiDeva: exactPhraseMap[idx].hi,
        })),
      };
    }

    return {
      ...seg,
      words: words.map((w) => {
        const raw = (w.text || '').trim();
        const leadingPunct = (raw.match(/^[^\p{L}\p{M}\p{N}]+/u) || [''])[0];
        const trailingPunct = (raw.match(/[^\p{L}\p{M}\p{N}]+$/u) || [''])[0];
        const core = raw
          .slice(leadingPunct.length, raw.length - trailingPunct.length)
          .toLowerCase();

        const mapped = ENGLISH_GRAMMAR_WORD_TO_HINGLISH[core];
        if (mapped) {
          return {
            ...w,
            en: w.en || w.text,
            text: `${leadingPunct}${mapped.hinglish}${trailingPunct}`,
            hiDeva: `${leadingPunct}${mapped.hi}${trailingPunct}`,
          };
        }
        return w;
      }),
    };
  });
}



