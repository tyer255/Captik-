import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeAiGeneratedSegments,
  computeAudioRmsEnergy,
  encodeMonoWavFromSamples,
  decodeMonoWavBase64ToFloat32,
  detectSpeechWindowsFromSamples,
  transliterateWordMultiScript,
  devanagariToRomanHinglish,
  isGibberishToken,
  isHindiWhisperOutputInvalid,
  cleanSpokenScriptText,
  buildPayloadFromWhisperChunks,
  buildSpeechAlignedCaptionPayload,
  upgradeSegmentsToHinglishMultiScript,
} from './aiCaptionParser';
import { mergeFrameOcrDetections } from './projectAndOcrLogic';

test('normalizeAiGeneratedSegments preserves word-level timestamps and scripts from Gemini payload', () => {
  const payload = {
    language: 'hinglish',
    segments: [
      {
        start: 0.2,
        end: 1.8,
        words: [
          {
            text: 'Namaste',
            hiDeva: 'नमस्ते',
            en: 'Hello',
            start: 0.2,
            end: 0.7,
            emphasis: 'amber',
          },
          {
            text: 'dosto',
            hiDeva: 'दोस्तों',
            en: 'friends',
            start: 0.72,
            end: 1.2,
            emphasis: 'none',
          },
          {
            text: 'welcome!',
            hiDeva: 'वेलकम!',
            en: 'welcome!',
            start: 1.25,
            end: 1.8,
            emphasis: 'green',
          },
        ],
      },
    ],
  };

  const segments = normalizeAiGeneratedSegments(payload, 5.0, 1);
  assert.equal(segments.length, 1);
  assert.equal(segments[0].words.length, 3);
  assert.equal(segments[0].words[0].text, 'Namaste');
  assert.equal(segments[0].words[0].hiDeva, 'नमस्ते');
  assert.equal(segments[0].words[0].emphasis, 'amber');
  assert.equal(segments[0].start, 0.2);
  assert.equal(segments[0].end, 1.8);
});

test('normalizeAiGeneratedSegments interpolates missing word timestamps and splits long segments', () => {
  const payload = {
    segments: [
      {
        start: 0.5,
        end: 4.5,
        text: 'Aaj hum dekhenge kaise video mein bolne par automatic captions bante hain',
      },
    ],
  };

  const segments = normalizeAiGeneratedSegments(payload, 5.0, 1);
  assert.ok(segments.length >= 3, 'Should split 12-word sentence into 3-4 word reel cards');
  for (const seg of segments) {
    assert.ok(seg.words.length <= 5);
    assert.ok(seg.end > seg.start);
    for (let i = 0; i < seg.words.length; i++) {
      assert.ok(seg.words[i].end > seg.words[i].start);
      if (i > 0) {
        assert.ok(seg.words[i].start >= seg.words[i - 1].start);
      }
    }
    // Should auto-assign at least one emphasized word per segment
    assert.ok(seg.words.some((w) => w.emphasis !== 'none'));
  }
});

test('encodeMonoWavFromSamples, decodeMonoWavBase64ToFloat32, and computeAudioRmsEnergy work accurately', () => {
  const samples = new Float32Array(1600);
  for (let i = 0; i < samples.length; i++) {
    samples[i] = Math.sin((i / 1600) * Math.PI * 2 * 440) * 0.5;
  }
  const rms = computeAudioRmsEnergy(samples);
  assert.ok(rms > 0.3 && rms < 0.4, `Expected RMS around 0.35, got ${rms}`);

  const wavBytes = encodeMonoWavFromSamples(samples, 16000);
  assert.equal(wavBytes.byteLength, 44 + 1600 * 2);
  const header = String.fromCharCode(wavBytes[0], wavBytes[1], wavBytes[2], wavBytes[3]);
  assert.equal(header, 'RIFF');

  const base64 = Buffer.from(wavBytes).toString('base64');
  const decoded = decodeMonoWavBase64ToFloat32(base64);
  assert.ok(decoded);
  assert.equal(decoded.length, 1600);
  const decodedRms = computeAudioRmsEnergy(decoded);
  assert.ok(Math.abs(decodedRms - rms) < 0.01);
});

test('detectSpeechWindowsFromSamples and buildSpeechAlignedCaptionPayload align spoken script to voice bursts', () => {
  const sampleRate = 16000;
  const totalSec = 4.0;
  const samples = new Float32Array(sampleRate * totalSec);
  // Create two distinct speech bursts: [0.3s..1.4s] and [1.9s..3.5s]
  for (let i = Math.floor(0.3 * sampleRate); i < Math.floor(1.4 * sampleRate); i++) {
    samples[i] = Math.sin(i * 0.1) * 0.4;
  }
  for (let i = Math.floor(1.9 * sampleRate); i < Math.floor(3.5 * sampleRate); i++) {
    samples[i] = Math.sin(i * 0.12) * 0.45;
  }

  const windows = detectSpeechWindowsFromSamples(samples, sampleRate, totalSec);
  assert.ok(windows.length >= 2);
  assert.ok(windows[0].start >= 0.2 && windows[0].start <= 0.4);

  const translit = transliterateWordMultiScript('viral!');
  assert.equal(translit.hiDeva, 'वायरल!');

  const aligned = buildSpeechAlignedCaptionPayload({
    scriptText: 'Bhai yeh reel, bilkul viral jayegi!',
    speechWindows: windows,
    duration: totalSec,
  });
  const finalSegs = normalizeAiGeneratedSegments(aligned, totalSec, 1);
  assert.equal(finalSegs.length, 2);
  assert.equal(finalSegs[0].words[0].text, 'Bhai');
  assert.equal(finalSegs[0].words[0].hiDeva, 'भाई');
  assert.ok(finalSegs[0].start >= 0.2);
  assert.ok(finalSegs[1].end <= totalSec);
});

test('isGibberishToken, cleanSpokenScriptText, and mergeFrameOcrDetections reject OCR/camera noise (61Y2, YY3, ING, APRD13, 1NI2, XOO)', () => {
  for (const noise of ['61Y2', 'YY3', 'ING', 'APRD13', '1NI2', 'XOO', 'VID_20260301']) {
    assert.equal(isGibberishToken(noise), true, `Expected ${noise} to be rejected as gibberish`);
  }

  for (const valid of ['Maine', 'video', 'upload', 'kiya', 'नमस्ते', 'कैप्शन', '1080p', '4k']) {
    assert.equal(isGibberishToken(valid), false, `Expected ${valid} to be accepted as valid`);
  }

  const cleaned = cleanSpokenScriptText('61Y2 YY3 [Music] ING APRD13 1NI2 XOO');
  assert.equal(cleaned, '');

  // When only gibberish is passed, buildSpeechAlignedCaptionPayload never emits gibberish
  const fallbackPayload = buildSpeechAlignedCaptionPayload({
    scriptText: '61Y2 YY3 ING APRD13 1NI2 XOO',
    duration: 5.0,
    fileName: '61Y2_YY3_APRD13_1NI2.mp4',
  });
  const allEmittedWords = (fallbackPayload.segments || []).flatMap((s) =>
    (s.words || []).map((w) => w.text || '')
  );
  assert.ok(allEmittedWords.length > 0);
  for (const w of allEmittedWords) {
    assert.ok(!['61Y2', 'YY3', 'ING', 'APRD13', '1NI2', 'XOO'].includes(w));
  }

  // OCR frame merger also rejects low-confidence and gibberish blocks
  const mergedOcr = mergeFrameOcrDetections(
    [
      { timestamp: 0.5, text: '61Y2', confidence: 45, x: 50, y: 50, width: 30, height: 10 },
      { timestamp: 1.0, text: 'YY3', confidence: 82, x: 50, y: 50, width: 30, height: 10 },
      { timestamp: 1.5, text: 'APRD13 1NI2 XOO', confidence: 90, x: 50, y: 50, width: 30, height: 10 },
      { timestamp: 2.0, text: 'Hook Your Viewers Fast', confidence: 88, x: 50, y: 20, width: 60, height: 12 },
    ],
    0.5,
    4.0
  );
  assert.equal(mergedOcr.length, 1);
  assert.equal(mergedOcr[0].text, 'Hook Your Viewers Fast');
});

test('devanagariToRomanHinglish and buildPayloadFromWhisperChunks convert Hindi Whisper ASR chunks into multi-script captions', () => {
  assert.equal(devanagariToRomanHinglish('नमस्ते'), 'namaste');
  const multi = transliterateWordMultiScript('दोस्तों!');
  assert.equal(multi.text.toLowerCase(), 'dosto!');
  assert.equal(multi.hiDeva, 'दोस्तों!');

  const whisperPayload = buildPayloadFromWhisperChunks({
    text: 'नमस्ते दोस्तों आज हम बात करेंगे कैप्शन के बारे में',
    chunks: [
      { text: 'नमस्ते', timestamp: [0.1, 0.5] },
      { text: 'दोस्तों,', timestamp: [0.52, 0.95] },
      { text: 'आज', timestamp: [1.1, 1.35] },
      { text: 'हम', timestamp: [1.36, 1.6] },
      { text: 'बात', timestamp: [1.62, 1.9] },
      { text: 'करेंगे!', timestamp: [1.92, 2.4] },
    ],
    duration: 3.0,
  });

  assert.ok(whisperPayload);
  assert.equal(whisperPayload.segments?.length, 2);
  assert.equal(whisperPayload.segments?.[0].words?.[0].text, 'namaste');
  assert.equal(whisperPayload.segments?.[0].words?.[0].hiDeva, 'नमस्ते');
  assert.equal(whisperPayload.segments?.[0].words?.[0].en, 'Hello');
  assert.equal(whisperPayload.segments?.[1].words?.[2].text, 'baat');
  assert.equal(whisperPayload.segments?.[1].words?.[2].hiDeva, 'बात');
});

test('getExportCanvasDimensions, computeObjectCoverCrop, and non-alternating behindSubject prevent export cutoff and two-face artifacts', async () => {
  const { getExportCanvasDimensions } = await import('./videoOcrEngine');
  const { computeObjectCoverCrop } = await import('./humanSegmentationEngine');

  const d720 = getExportCanvasDimensions('9:16', '720p');
  assert.equal(d720.width, 720);
  assert.equal(d720.height, 1280);
  assert.equal(d720.videoBitsPerSecond, 8_000_000);

  const d1080 = getExportCanvasDimensions('9:16', '1080p');
  assert.equal(d1080.width, 1080);
  assert.equal(d1080.height, 1920);
  assert.equal(d1080.videoBitsPerSecond, 16_000_000);

  const d4k = getExportCanvasDimensions('16:9', '4K');
  assert.equal(d4k.width, 2560);
  assert.equal(d4k.height, 1440);
  assert.equal(d4k.videoBitsPerSecond, 28_000_000);

  // When a 16:9 video (1920x1080) is drawn into a 9:16 canvas (1080x1920), object-cover center-crops horizontally
  const crop = computeObjectCoverCrop(1920, 1080, 1080, 1920);
  assert.equal(crop.sy, 0);
  assert.equal(crop.sh, 1080);
  assert.equal(Math.round(crop.sw), 608);
  assert.equal(Math.round(crop.sx), 656);

  // Generated segments should not alternate behindSubject true/false on even/odd segments
  const aligned = buildSpeechAlignedCaptionPayload({
    scriptText: 'Ek do teen chaar. Paanch chhah saat aath. Nau das gyarah barah.',
    duration: 6.0,
  });
  const segs = normalizeAiGeneratedSegments(aligned, 6.0, 1);
  assert.ok(segs.length >= 2);
  for (const s of segs) {
    assert.equal(s.behindSubject, false);
  }
});

test('Hindi spoken audio via Whisper Devanagari chunks converts cleanly to natural Hinglish (English-script Hindi)', () => {
  // Medial schwa deletion and natural Hinglish rules on Devanagari words
  assert.equal(devanagariToRomanHinglish('आपको'), 'aapko');
  assert.equal(devanagariToRomanHinglish('समझते'), 'samajhte');
  assert.equal(devanagariToRomanHinglish('चाहते'), 'chahte');
  assert.equal(devanagariToRomanHinglish('बोलता'), 'bolta');
  assert.equal(devanagariToRomanHinglish('मतलब'), 'matlab');
  assert.equal(devanagariToRomanHinglish('जरूरी'), 'zaroori');
  assert.equal(devanagariToRomanHinglish('वाला'), 'wala');

  // Sentence 1: Whisper Hindi phonetic output with "डूस्तो" and "हूं"
  const p1 = buildPayloadFromWhisperChunks({
    text: 'नमस्ते डूस्तो आज में आपको एक बहुत जरूरी बात बताने वाला हूं',
    chunks: [
      { text: 'नमस्ते', timestamp: [0.0, 0.48] },
      { text: 'डूस्तो', timestamp: [0.48, 0.88] },
      { text: 'आज', timestamp: [0.88, 1.12] },
      { text: 'में', timestamp: [1.12, 1.24] },
      { text: 'आपको', timestamp: [1.24, 1.52] },
      { text: 'एक', timestamp: [1.52, 1.68] },
      { text: 'बहुत', timestamp: [1.68, 1.94] },
      { text: 'जरूरी', timestamp: [1.94, 2.34] },
      { text: 'बात', timestamp: [2.34, 2.58] },
      { text: 'बताने', timestamp: [2.58, 2.92] },
      { text: 'वाला', timestamp: [2.92, 3.16] },
      { text: 'हूं', timestamp: [3.16, 3.42] },
    ],
    duration: 3.6,
  });
  const s1Hinglish = (p1?.segments || [])
    .flatMap((s) => (s.words || []).map((w) => w.text))
    .join(' ');
  assert.equal(s1Hinglish, 'namaste dosto aaj mein aapko ek bahut zaroori baat batane wala hoon');

  // Sentence 2: Whisper split/fused tokens ("डोस तो", "आजकी", "विडियो")
  const p2 = buildPayloadFromWhisperChunks({
    text: 'तो डोस तो आजकी विडियो में हम बात करेंगे कि रील वायरल कैसे करें?',
    chunks: [
      { text: 'तो', timestamp: [0.0, 0.16] },
      { text: 'डोस', timestamp: [0.16, 0.36] },
      { text: 'तो', timestamp: [0.36, 0.48] },
      { text: 'आजकी', timestamp: [0.48, 0.82] },
      { text: 'विडियो', timestamp: [0.82, 1.12] },
      { text: 'में', timestamp: [1.12, 1.24] },
      { text: 'हम', timestamp: [1.24, 1.42] },
      { text: 'बात', timestamp: [1.42, 1.64] },
      { text: 'करेंगे', timestamp: [1.64, 1.98] },
      { text: 'कि', timestamp: [1.98, 2.12] },
      { text: 'रील', timestamp: [2.12, 2.38] },
      { text: 'वायरल', timestamp: [2.38, 2.74] },
      { text: 'कैसे', timestamp: [2.74, 3.02] },
      { text: 'करें?', timestamp: [3.02, 3.38] },
    ],
    duration: 3.5,
  });
  const s2Hinglish = (p2?.segments || [])
    .flatMap((s) => (s.words || []).map((w) => w.text))
    .join(' ');
  assert.equal(s2Hinglish, 'toh dosto aaj ki video mein hum baat karenge ki reel viral kaise karein?');

  // Sentence 3: Whisper phonetic Devanagari loanwords ("बाई", "वीट्यो", "एसे", "कप्षन", "देख हो")
  const p3 = buildPayloadFromWhisperChunks({
    text: 'बाई अगर तुम भी अपनी वीट्यो में एसे कप्षन लगाना चाहते हो तो ये ट्रिक देख हो',
    chunks: [
      { text: 'बाई', timestamp: [0.0, 0.28] },
      { text: 'अगर', timestamp: [0.28, 0.52] },
      { text: 'तुम', timestamp: [0.52, 0.72] },
      { text: 'भी', timestamp: [0.72, 0.88] },
      { text: 'अपनी', timestamp: [0.88, 1.16] },
      { text: 'वीट्यो', timestamp: [1.16, 1.48] },
      { text: 'में', timestamp: [1.48, 1.62] },
      { text: 'एसे', timestamp: [1.62, 1.88] },
      { text: 'कप्षन', timestamp: [1.88, 2.26] },
      { text: 'लगाना', timestamp: [2.26, 2.62] },
      { text: 'चाहते', timestamp: [2.62, 2.94] },
      { text: 'हो', timestamp: [2.94, 3.08] },
      { text: 'तो', timestamp: [3.08, 3.22] },
      { text: 'ये', timestamp: [3.22, 3.38] },
      { text: 'ट्रिक', timestamp: [3.38, 3.66] },
      { text: 'देख', timestamp: [3.66, 3.88] },
      { text: 'हो', timestamp: [3.88, 4.08] },
    ],
    duration: 4.2,
  });
  const s3Hinglish = (p3?.segments || [])
    .flatMap((s) => (s.words || []).map((w) => w.text))
    .join(' ');
  assert.equal(s3Hinglish, 'bhai agar tum bhi apni video mein aise caption lagana chahte ho toh ye trick dekho');

  // Sentence 4: Portfolio Hindi/Hinglish speech ("अब ही में अपना पोट्फोलियो ड़ाईन कर रहा हूं में पूरी स्क्रीन पर फोकस कर रहा हूं में आपको पूरी स्क्रीन दिखाने वाला हूं")
  const p4 = buildPayloadFromWhisperChunks({
    text: 'अब ही में अपना पोट्फोलियो ड़ाईन कर रहा हूं में पूरी स्क्रीन पर फोकस कर रहा हूं में आपको पूरी स्क्रीन दिखाने वाला हूं',
    chunks: [
      { text: 'अब', timestamp: [0.0, 0.2] },
      { text: 'ही', timestamp: [0.2, 0.36] },
      { text: 'में', timestamp: [0.36, 0.5] },
      { text: 'अपना', timestamp: [0.5, 0.8] },
      { text: 'पोट्फोलियो', timestamp: [0.8, 1.4] },
      { text: 'ड़ाईन', timestamp: [1.4, 1.8] },
      { text: 'कर', timestamp: [1.8, 2.0] },
      { text: 'रहा', timestamp: [2.0, 2.25] },
      { text: 'हूं', timestamp: [2.25, 2.5] },
      { text: 'में', timestamp: [2.6, 2.8] },
      { text: 'पूरी', timestamp: [2.8, 3.1] },
      { text: 'स्क्रीन', timestamp: [3.1, 3.5] },
      { text: 'पर', timestamp: [3.5, 3.7] },
      { text: 'फोकस', timestamp: [3.7, 4.1] },
      { text: 'कर', timestamp: [4.1, 4.3] },
      { text: 'रहा', timestamp: [4.3, 4.55] },
      { text: 'हूं', timestamp: [4.55, 4.8] },
      { text: 'में', timestamp: [4.9, 5.1] },
      { text: 'आपको', timestamp: [5.1, 5.45] },
      { text: 'पूरी', timestamp: [5.45, 5.75] },
      { text: 'स्क्रीन', timestamp: [5.75, 6.15] },
      { text: 'दिखाने', timestamp: [6.15, 6.55] },
      { text: 'वाला', timestamp: [6.55, 6.85] },
      { text: 'हूं', timestamp: [6.85, 7.1] },
    ],
    duration: 7.5,
  });
  const s4Hinglish = (p4?.segments || [])
    .flatMap((s) => (s.words || []).map((w) => w.text))
    .join(' ');
  assert.equal(
    s4Hinglish,
    'abhi mein apna portfolio design kar raha hoon mein poori screen par focus kar raha hoon mein aapko poori screen dikhane wala hoon'
  );

  // Validate Hindi Whisper hallucination detector on Hindi vs pure English audio outputs
  assert.equal(
    isHindiWhisperOutputInvalid('अब ही में अपना पोट्फोलियो ड़ाईन कर रहा हूं'),
    false
  );
  assert.equal(
    isHindiWhisperOutputInvalid('अज्या आप आप आप आप आप आप आप आप आ\uFFFD आ\uFFFD'),
    true
  );
  assert.equal(
    isHindiWhisperOutputInvalid('अदिन आदिन आदिन आदिन आदिन आदिन आदिन'),
    true
  );
  assert.equal(
    isHindiWhisperOutputInvalid('3 अप्रट्यट्यट्यट्यट्यट्यट्यट्य\uFFFD'),
    true
  );

  // Validate Latin Hinglish voice scripts are recognized as valid and never rejected as invalid Hindi
  assert.equal(
    isHindiWhisperOutputInvalid('Maine bas video upload kiya aur captions ready ho gaye'),
    false
  );
  assert.equal(
    isHindiWhisperOutputInvalid('Bhai aaj ki video mein hum baat karenge'),
    false
  );

  // Verify custom Hinglish script preserves Romanized Hinglish tokens in word.text
  const customAligned = buildSpeechAlignedCaptionPayload({
    scriptText: 'Maine video upload kiya, ek template choose kiya, aur captions ready',
    duration: 5.0,
  });
  const firstWord = customAligned.segments?.[0]?.words?.[0];
  assert.ok(firstWord);
  assert.equal(firstWord.text?.toLowerCase(), 'maine');
  assert.equal(firstWord.hiDeva, 'मैंने');
  assert.equal(firstWord.en, 'I');

  // Verify English-translated segments upgrade cleanly to Hinglish (text), Devanagari (hiDeva), and English (en)
  const upgraded = upgradeSegmentsToHinglishMultiScript([
    {
      id: 'seg-1',
      start: 0,
      end: 1.9,
      behindSubject: false,
      words: [
        { id: 'w1', text: 'I', hiDeva: 'आई', ta: '', bn: '', en: 'I', start: 0, end: 0.4, emphasis: 'none' },
        { id: 'w2', text: 'am', hiDeva: 'अम', ta: '', bn: '', en: 'am', start: 0.4, end: 0.8, emphasis: 'none' },
        { id: 'w3', text: 'just', hiDeva: 'जस्ट', ta: '', bn: '', en: 'just', start: 0.8, end: 1.2, emphasis: 'green' },
        { id: 'w4', text: 'designing', hiDeva: 'डिजाइनिंग', ta: '', bn: '', en: 'designing', start: 1.2, end: 1.9, emphasis: 'amber' },
      ],
    },
  ]);
  assert.equal(upgraded[0].words.map((w) => w.text).join(' '), 'Main abhi design kar-raha');
  assert.equal(upgraded[0].words.map((w) => w.hiDeva).join(' '), 'मैं अभी डिजाइन कर-रहा');
  assert.equal(upgraded[0].words.map((w) => w.en).join(' '), 'I am just designing');
});





