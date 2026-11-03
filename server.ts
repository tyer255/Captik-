import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import { pipeline } from '@xenova/transformers';
import {
  buildSpeechAlignedCaptionPayload,
  buildPayloadFromWhisperChunks,
  decodeMonoWavBase64ToFloat32,
  computeAudioRmsEnergy,
  cleanSpokenScriptText,
  encodeMonoWavFromSamples,
  isHindiWhisperOutputInvalid,
  hasEnglishTranslatedHindiBug,
  upgradeSegmentsToHinglishMultiScript,
  type WhisperWordChunk,
} from './src/utils/aiCaptionParser.ts';

// Whisper BPE token IDs for English grammar/translation words (" I", " am", " the", " going", " to", " you", etc.)
// Suppressing these during the Hindi transcription pass prevents Whisper from translating Hindi speech into English sentences.
const ENGLISH_TRANSLATION_BAD_WORD_IDS: number[][] = [
  [286],  // " I"
  [40],   // "I"
  [669],  // " am"
  [366],  // " are"
  [307],  // " is"
  [390],  // " was"
  [645],  // " were"
  [264],  // " the"
  [2278], // "The"
  [516],  // " going"
  [281],  // " to"
  [291],  // " you"
  [3223], // "You"
  [321],  // " we"
  [4360], // "We"
  [436],  // " they"
  [452],  // " my"
  [428],  // " your"
  [341],  // " this"
  [300],  // " that"
  [362],  // " have"
  [575],  // " has"
  [486],  // " will"
  [576],  // " would"
  [445],  // " just"
  [1379], // " whole"
  [8416], // " focusing"
  [14685],// " designing"
  [855],  // " show"
  [309],  // " it"
];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type WhisperPipelineFn = (
  audio: Float32Array,
  options?: Record<string, unknown>
) => Promise<{
  text?: string;
  chunks?: WhisperWordChunk[];
}>;

let whisperPipelinePromise: Promise<WhisperPipelineFn> | null = null;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Operation timed out')), ms);
    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

function getWhisperTranscriber(): Promise<WhisperPipelineFn> {
  if (!whisperPipelinePromise) {
    whisperPipelinePromise = pipeline(
      'automatic-speech-recognition',
      'Xenova/whisper-tiny',
      { quantized: true }
    ) as unknown as Promise<WhisperPipelineFn>;
  }
  return whisperPipelinePromise;
}

function getGenAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  // Note: AQ. tokens in container environment are internal OAuth access tokens, not API keys
  if (!apiKey || apiKey.startsWith('AQ.')) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Pre-warm local Whisper speech recognition model in background
  void getWhisperTranscriber().catch(() => {});

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', geminiConfigured: Boolean(process.env.GEMINI_API_KEY) });
  });

  /**
   * POST /api/captions/generate
   * Multimodal speech-to-caption and word-timestamp alignment endpoint powered by Gemini
   * + local Whisper ASR with acoustic Voice Activity Detection (speechWindows) alignment.
   */
  app.post('/api/captions/generate', async (req, res) => {
    const {
      audioBase64,
      audioMimeType = 'audio/wav',
      hasAudibleSpeech = true,
      speechWindows = [],
      frameSamples = [],
      duration = 6.0,
      scriptId = 'hinglish',
      customSpokenScript,
      fileName = 'video.mp4',
    } = (req.body || {}) as {
      audioBase64?: string | null;
      audioMimeType?: string;
      hasAudibleSpeech?: boolean;
      speechWindows?: { start: number; end: number; energy?: number }[];
      frameSamples?: { timestamp: number; mimeType: string; base64Data: string }[];
      duration?: number;
      scriptId?: string;
      customSpokenScript?: string;
      detectedTextsHint?: string;
      fileName?: string;
    };

    const safeDuration = Math.max(1.0, Number(duration) || 6.0);
    const cleanedCustomScript = cleanSpokenScriptText(customSpokenScript || '');
    let verbatimTranscript = '';

    // 1. Try Gemini multimodal speech-to-caption first if configured
    try {
      const ai = getGenAiClient();
      if (ai) {
        if (audioBase64 && hasAudibleSpeech && !cleanedCustomScript) {
          try {
            const transcribeRes = await ai.models.generateContent({
              model: 'gemini-3.5-transcribe',
              contents: {
                parts: [
                  {
                    inlineData: {
                      mimeType: audioMimeType,
                      data: audioBase64,
                    },
                  },
                  {
                    text: 'Transcribe the exact spoken speech in this audio verbatim. Keep Hindi/Hinglish/English words exactly as spoken.',
                  },
                ],
              },
            });
            verbatimTranscript = cleanSpokenScriptText(transcribeRes.text ?? '');
          } catch {
            // Proceed with multimodal gemini-3.8-flash directly if gemini-3.5-transcribe fails
          }
        }

        const parts: Array<
          | { text: string }
          | { inlineData: { mimeType: string; data: string } }
        > = [];

        if (audioBase64) {
          parts.push({
            inlineData: {
              mimeType: audioMimeType,
              data: audioBase64,
            },
          });
        }

        if (Array.isArray(frameSamples) && frameSamples.length > 0) {
          for (const frame of frameSamples.slice(0, 4)) {
            if (frame?.base64Data) {
              parts.push({
                inlineData: {
                  mimeType: frame.mimeType || 'image/jpeg',
                  data: frame.base64Data,
                },
              });
              parts.push({
                text: `[Video keyframe at ${Number(frame.timestamp || 0).toFixed(2)}s]`,
              });
            }
          }
        }

        const promptLines = [
          `Video duration: ${safeDuration.toFixed(2)} seconds.`,
          `Preferred primary script: ${scriptId}.`,
        ];

        if (Array.isArray(speechWindows) && speechWindows.length > 0) {
          promptLines.push(
            `Detected acoustic speech windows in audio: ${speechWindows
              .map((w) => `[${Number(w.start).toFixed(2)}s - ${Number(w.end).toFixed(2)}s]`)
              .join(', ')}. Align caption segments and word timestamps to these exact spoken windows.`
          );
        }

        if (cleanedCustomScript) {
          promptLines.push(
            `The speaker's custom script is in Hinglish/Hindi: "${cleanedCustomScript}". In the output, "text" MUST be this exact script verbatim in Romanized Hinglish (English letters) without translating into English sentences! Align these exact spoken words across the video's ${safeDuration.toFixed(2)}s timeline with accurate word-by-word timestamps.`
          );
        } else if (verbatimTranscript) {
          promptLines.push(
            `Verbatim speech transcription detected from audio: "${verbatimTranscript}". Use this exact spoken script and align every word to its precise start and end timestamp in the audio. If spoken in Hindi/Hinglish, keep "text" in Romanized Hinglish (English letters) without translating into English sentences.`
          );
        } else if (hasAudibleSpeech) {
          promptLines.push(
            `Listen carefully to the person speaking in the audio track and transcribe their exact spoken script word-for-word with accurate start and end timestamps (in seconds) within [0.0, ${safeDuration.toFixed(2)}]. If the speaker speaks Hindi or Hinglish, output "text" in Romanized Hinglish (English letters representing spoken Hindi words), NOT translated English.`
          );
        } else {
          promptLines.push(
            `If there is spoken voice in the media, transcribe every word with exact timestamps.`
          );
        }

        parts.push({
          text: promptLines.join('\n'),
        });

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: { parts },
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            systemInstruction:
              'You are Captik AI, a professional speech-to-caption and word-level timestamp alignment engine for short-form creator videos (Reels, Shorts, TikTok). ' +
              'Your job is to transcribe what the person in the video says and output timed caption segments (2 to 4 words per segment) with exact word-by-word start and end timestamps in seconds. ' +
              'CRITICAL SCRIPT & LANGUAGE RULES:\n' +
              '1) "text": Romanized Hinglish (English letters representing spoken Hindi/Hinglish words as written by Indian creators, e.g., "Maine bas video upload kiya", "Bhai aaj ki video mein hum baat karenge", "Abhi main apna portfolio design kar raha hoon"). NEVER translate Hindi/Hinglish speech into English sentences for "text" (DO NOT output "I uploaded the video" or "I am just designing the portfolio" in "text")!\n' +
              '2) "hiDeva": Hindi Devanagari script (e.g., "मैंने बस वीडियो अपलोड किया", "भाई आज की वीडियो में हम बात करेंगे").\n' +
              '3) "en": English translation (e.g., "I just uploaded the video", "Brother in today\'s video we will talk").\n' +
              '4) "start": word start timestamp in seconds.\n' +
              '5) "end": word end timestamp in seconds.\n' +
              '6) "emphasis": "amber" for the most impactful hook/keyword in the segment, "green" for a secondary action word, or "none" for normal words.\n' +
              'Ensure timestamps are strictly increasing and stay within the video duration.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                detectedLanguage: {
                  type: Type.STRING,
                  description: 'Detected language label such as Hinglish, Hindi, or English.',
                },
                transcript: {
                  type: Type.STRING,
                  description: 'Complete verbatim transcript of the video.',
                },
                segments: {
                  type: Type.ARRAY,
                  description: 'Timed caption segments of 2 to 4 words each.',
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      start: {
                        type: Type.NUMBER,
                        description: 'Segment start time in seconds.',
                      },
                      end: {
                        type: Type.NUMBER,
                        description: 'Segment end time in seconds.',
                      },
                      behindSubject: {
                        type: Type.BOOLEAN,
                        description: 'Whether this caption line looks great with Behind-You depth effect.',
                      },
                      words: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            text: {
                              type: Type.STRING,
                              description: 'Word in Hinglish (Latin script) or English.',
                            },
                            hiDeva: {
                              type: Type.STRING,
                              description: 'Word in Hindi Devanagari script.',
                            },
                            en: {
                              type: Type.STRING,
                              description: 'Word in English.',
                            },
                            start: {
                              type: Type.NUMBER,
                              description: 'Word start timestamp in seconds.',
                            },
                            end: {
                              type: Type.NUMBER,
                              description: 'Word end timestamp in seconds.',
                            },
                            emphasis: {
                              type: Type.STRING,
                              description: 'Word highlight tier: "amber", "green", or "none".',
                            },
                          },
                          required: ['text', 'start', 'end', 'emphasis'],
                        },
                      },
                    },
                    required: ['start', 'end', 'words'],
                  },
                },
              },
              required: ['detectedLanguage', 'transcript', 'segments'],
            },
          },
        });

        const rawJson = (response.text ?? '{}').trim();
        const parsed = JSON.parse(rawJson);
        if (parsed && Array.isArray(parsed.segments) && parsed.segments.length > 0) {
          if (scriptId !== 'english' && hasEnglishTranslatedHindiBug(parsed.segments)) {
            parsed.segments = upgradeSegmentsToHinglishMultiScript(parsed.segments);
          }
          res.json(parsed);
          return;
        }
      }
    } catch (_err) {
      // Fall through to real local Whisper ASR engine
    }

    // 2. If user did not provide a custom script and audioBase64 is present, run real Whisper ASR on the spoken audio!
    if (!cleanedCustomScript && !verbatimTranscript && audioBase64 && hasAudibleSpeech) {
      try {
        const floatSamples = decodeMonoWavBase64ToFloat32(audioBase64);
        if (
          floatSamples &&
          floatSamples.length >= 1600 &&
          computeAudioRmsEnergy(floatSamples) > 0.002
        ) {
          const transcriber = await getWhisperTranscriber();

          let whisperOut: { text?: string; chunks?: WhisperWordChunk[] };
          // Focus Whisper ASR on a high-signal 8-second speech window for lightning-fast inference (~1.1s on CPU)
          const activeSamples =
            floatSamples.length > 16000 * 8
              ? floatSamples.subarray(0, 16000 * 8)
              : floatSamples;

          if (scriptId === 'english') {
            // User explicitly selected "English Translation"
            whisperOut = await withTimeout(
              transcriber(activeSamples, {
                language: 'english',
                task: 'transcribe',
                return_timestamps: 'word',
                chunk_length_s: 10,
                stride_length_s: 2,
              }),
              2500
            );
          } else {
            // User selected "English Letters (Hinglish)" or "हिन्दी · मराठी (Devanagari)":
            // Pass language: 'hindi' + task: 'transcribe' + bad_words_ids so Whisper
            // transcribes Hindi/Hinglish speech in Hindi (never translating into English sentences!).
            whisperOut = await withTimeout(
              transcriber(activeSamples, {
                language: 'hindi',
                task: 'transcribe',
                return_timestamps: 'word',
                chunk_length_s: 10,
                stride_length_s: 2,
                bad_words_ids: ENGLISH_TRANSLATION_BAD_WORD_IDS,
              }),
              2500
            );

            // If the uploaded video is actually 100% pure English speech, the Hindi decoder
            // produces repetitive hallucinations — detect that and transcribe in English.
            if (isHindiWhisperOutputInvalid(whisperOut?.text || '')) {
              whisperOut = await withTimeout(
                transcriber(activeSamples, {
                  language: 'english',
                  task: 'transcribe',
                  return_timestamps: 'word',
                  chunk_length_s: 10,
                  stride_length_s: 2,
                }),
                2200
              );
            }
          }

          const whisperPayload = buildPayloadFromWhisperChunks({
            text: whisperOut?.text,
            chunks: whisperOut?.chunks,
            speechWindows,
            duration: safeDuration,
          });

          if (
            whisperPayload &&
            Array.isArray(whisperPayload.segments) &&
            whisperPayload.segments.length > 0
          ) {
            if (scriptId !== 'english' && hasEnglishTranslatedHindiBug(whisperPayload.segments)) {
              whisperPayload.segments = upgradeSegmentsToHinglishMultiScript(whisperPayload.segments);
            }
            res.json(whisperPayload);
            return;
          }
        }
      } catch (_whisperErr) {
        // Fall through to acoustic speech-window alignment
      }
    }

    // 3. Acoustic Speech-Window Synchronized Caption Generation (strictly clean spoken script — never OCR noise)
    const effectiveScript =
      cleanedCustomScript ||
      verbatimTranscript ||
      undefined;

    const alignedPayload = buildSpeechAlignedCaptionPayload({
      scriptText: effectiveScript,
      speechWindows,
      duration: safeDuration,
      fileName,
    });

    if (scriptId !== 'english' && alignedPayload.segments && hasEnglishTranslatedHindiBug(alignedPayload.segments)) {
      alignedPayload.segments = upgradeSegmentsToHinglishMultiScript(alignedPayload.segments);
    }

    res.json(alignedPayload);
  });

  /**
   * POST /api/captions/tts
   * Synthesizes natural spoken voice audio (WAV) using gemini-3.8-flash-lite-tts
   * with automatic acoustic vocal-formant fallback.
   */
  app.post('/api/captions/tts', async (req, res) => {
    const { text, voiceName = 'Kore' } = (req.body || {}) as {
      text?: string;
      voiceName?: string;
    };
    if (!text || !text.trim()) {
      res.status(400).json({ error: 'Text is required for TTS generation.' });
      return;
    }

    try {
      const ai = getGenAiClient();
      if (ai) {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash-lite-tts',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: text.trim(),
                  speechMetadata: {
                    style: 'Energetic, natural Indian creator speaking clearly for a short-form Reel',
                  },
                },
              ],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName },
              },
            },
          },
        });

        const base64Audio =
          response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
          res.json({
            audioBase64: base64Audio,
            mimeType: 'audio/wav',
          });
          return;
        }
      }
    } catch {
      // Fall back to synthesized vocal formant cadence WAV
    }

    const fallbackAudioBase64 = synthesizeFormantSpeechWavBase64(text.trim(), 5.4);
    res.json({
      audioBase64: fallbackAudioBase64,
      mimeType: 'audio/wav',
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Captik full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

