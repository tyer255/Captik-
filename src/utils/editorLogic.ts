import {
  INITIAL_TERRACE_WORDS,
  INITIAL_SEGMENTS as RAW_INITIAL_SEGMENTS,
  type WordItem,
  type CaptionSegment as RawCaptionSegment,
} from '../data/assetsCatalog.ts';
import {
  TEMPLATES,
  TEMPLATE_TABS,
  type CaptionTemplateSpec,
} from '../data/templatesCatalog.ts';
import {
  devanagariToRomanHinglish,
  phoneticRomanToDevanagari,
} from './aiCaptionParser.ts';

export type CaptikTemplate = CaptionTemplateSpec;

export interface CaptionWord {
  id: string;
  text: string;
  hiDeva: string;
  ta: string;
  bn: string;
  en: string;
  start: number; // seconds
  end: number;   // seconds
  emphasis: 'none' | 'green' | 'amber';
}

export interface CaptionSegment {
  id: string;
  start: number; // seconds
  end: number;   // seconds
  words: CaptionWord[];
  behindSubject: boolean;
}

export interface ColorAdjustments {
  exposure: number;
  brightness: number;
  contrast: number;
  saturation: number;
  temperature: number;
  tint: number;
  vignette: number;
  sharpen: number;
  grain: number;
  lutId: string;
  effectId: string;
}

export const DEFAULT_ADJUSTMENTS: ColorAdjustments = {
  exposure: 0,
  brightness: 0,
  contrast: 0,
  saturation: 0,
  temperature: 0,
  tint: 0,
  vignette: 0,
  sharpen: 0,
  grain: 0,
  lutId: 'none',
  effectId: 'none',
};

export interface TimelineOverlayItem {
  id: string;
  type: 'text' | 'element' | 'sfx';
  label: string;
  sublabel?: string;
  start: number;
  end: number;
  color: string;
  presetId?: string;
  animIn?: string;
  animOut?: string;
  animLoop?: string;
  x?: number; // percentage 0..100
  y?: number; // percentage 0..100
  scale?: number;
  sfxId?: string;
}

export interface WordToken {
  id: string;
  word: string;
  start: number;
  end: number;
  emphasized?: boolean;
}

export interface TextOverlayItem {
  id: string;
  text: string;
  variantId?: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  xPercent: number;
  yPercent: number;
}

export interface CustomStyleOverrides {
  fontScale: number;
  yOffset: number; // percentage from top (18..85)
  xOffset: number; // percentage from left (15..85)
  primaryColor: string;
  accentColor: string;
  secondaryColor: string;
  bgOpacity: number;
  behindSubject: boolean;
  behindHeroScale: number;
  uppercase: boolean;
  shadowStrength: number;
  strokeWidth: number;
  animIn: string;
  animOut: string;
  animLoop: string;
  personaMode?: 'auto' | 'A' | 'B';
}

export interface VideoTimelineClip {
  id: string;
  title: string;
  /** Start timestamp on the edited timeline (seconds) */
  timelineStart: number;
  /** End timestamp on the edited timeline (seconds) */
  timelineEnd: number;
  /** In-point timestamp in the source video media (seconds) */
  sourceStart: number;
  /** Out-point timestamp in the source video media (seconds) */
  sourceEnd: number;
  speed?: number;
  muted?: boolean;
}

export interface AudioTimelineClip {
  id: string;
  title: string;
  /** Linked VideoTimelineClip ID when audio is linked to video */
  linkedVideoClipId?: string;
  /** Start timestamp on the edited timeline (seconds) */
  timelineStart: number;
  /** End timestamp on the edited timeline (seconds) */
  timelineEnd: number;
  /** In-point timestamp in the source audio media (seconds) */
  sourceStart: number;
  /** Out-point timestamp in the source audio media (seconds) */
  sourceEnd: number;
  volume: number;
  muted?: boolean;
}

/**
 * Converts raw WordItem[] and RawCaptionSegment[] from assetsCatalog into hydrated CaptionSegment[] in seconds.
 */
export function hydrateSegmentsFromWords(
  words: WordItem[],
  rawSegments?: RawCaptionSegment[]
): CaptionSegment[] {
  const convertedWords: CaptionWord[] = words.map((w) => ({
    id: w.id,
    text: w.text,
    hiDeva: w.textHi || w.text,
    ta: w.textTa || w.text,
    bn: w.textBn || w.text,
    en: w.textEn || w.text,
    start: Number((w.startMs / 1000).toFixed(2)),
    end: Number((w.endMs / 1000).toFixed(2)),
    emphasis: w.aiTier === 2 ? 'green' : w.aiTier === 1 ? 'amber' : 'none',
  }));

  if (rawSegments && rawSegments.length > 0) {
    const wordMap = new Map(convertedWords.map((cw) => [cw.id, cw]));
    return rawSegments
      .map((seg) => {
        const segWords = seg.wordIds
          .map((id) => wordMap.get(id))
          .filter((w): w is CaptionWord => Boolean(w));
        if (segWords.length === 0) return null;
        return {
          id: seg.id,
          start: segWords[0].start,
          end: segWords[segWords.length - 1].end,
          words: segWords,
          behindSubject: Boolean(seg.behindSubject),
        };
      })
      .filter((s): s is CaptionSegment => Boolean(s));
  }

  // Otherwise group into 4-word segments automatically
  const built: CaptionSegment[] = [];
  for (let i = 0; i < convertedWords.length; i += 4) {
    const chunk = convertedWords.slice(i, i + 4);
    built.push({
      id: `seg-${built.length + 1}`,
      start: chunk[0].start,
      end: chunk[chunk.length - 1].end,
      words: chunk,
      behindSubject: false,
    });
  }
  return built;
}

export const HYDRATED_INITIAL_SEGMENTS: CaptionSegment[] = hydrateSegmentsFromWords(
  INITIAL_TERRACE_WORDS,
  RAW_INITIAL_SEGMENTS
);

/**
 * Formats seconds into Captik's exact studio timecode: HH:MM:SS:FF (30fps)
 * e.g., 7.24 -> "00:00:07:07"
 */
export function formatTimecode(seconds: number, fps = 30): string {
  const clamped = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  const totalSeconds = Math.floor(clamped + 1e-6);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  const frames = Math.min(
    fps - 1,
    Math.floor((clamped - Math.floor(clamped) + 1e-6) * fps)
  );

  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(secs)}:${pad(frames)}`;
}

/**
 * Formats a short timestamp like "0:00.4" used in Captik caption segment cards.
 */
export function formatShortTime(seconds: number): string {
  const clamped = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  const totalTenths = Math.round(clamped * 10);
  const tenths = totalTenths % 10;
  const totalSecs = Math.floor(totalTenths / 10);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins}:${String(secs).padStart(2, '0')}.${tenths}`;
}

/**
 * Formats a segment range like "0:00.4 → 0:01.2"
 */
export function formatSegmentRange(start: number, end: number): string {
  return `${formatShortTime(start)} → ${formatShortTime(end)}`;
}

/**
 * Formats seconds into SRT timestamp "00:00:01,200"
 */
export function formatSrtTimestamp(seconds: number): string {
  const clamped = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  const totalMs = Math.round(clamped * 1000);
  const ms = totalMs % 1000;
  const totalSeconds = Math.floor(totalMs / 1000);
  const s = totalSeconds % 60;
  const m = Math.floor((totalSeconds / 60) % 60);
  const h = Math.floor(totalSeconds / 3600);

  const pad2 = (n: number) => String(n).padStart(2, '0');
  const pad3 = (n: number) => String(n).padStart(3, '0');
  return `${pad2(h)}:${pad2(m)}:${pad2(s)},${pad3(ms)}`;
}

const HINGLISH_TO_ENGLISH_WORD_MAP: Record<string, string> = {
  main: 'I',
  maine: 'I',
  mujhe: 'me',
  mera: 'my',
  meri: 'my',
  mere: 'my',
  apna: 'my',
  apni: 'my',
  apne: 'my',
  hum: 'we',
  hamara: 'our',
  hamari: 'our',
  hamare: 'our',
  aap: 'you',
  aapko: 'you',
  aapka: 'your',
  aapki: 'your',
  aapke: 'your',
  tum: 'you',
  tumhe: 'you',
  tumhara: 'your',
  tera: 'your',
  teri: 'your',
  tere: 'your',
  woh: 'that',
  wo: 'that',
  yeh: 'this',
  ye: 'this',
  iska: 'its',
  iski: 'its',
  iske: 'its',
  uska: 'his',
  uski: 'her',
  uske: 'their',
  bhai: 'bro',
  dost: 'friend',
  dosto: 'friends',
  yaar: 'dude',
  video: 'video',
  reel: 'reel',
  upload: 'upload',
  template: 'template',
  choose: 'choose',
  design: 'design',
  designing: 'designing',
  screen: 'screen',
  portfolio: 'portfolio',
  focus: 'focus',
  load: 'load',
  abhi: 'just',
  bas: 'just',
  sirf: 'only',
  aur: 'and',
  lekin: 'but',
  par: 'on',
  pe: 'on',
  se: 'from',
  ko: 'to',
  mein: 'in',
  me: 'in',
  ne: '',
  ka: 'of',
  ki: 'of',
  ke: 'of',
  karo: 'do',
  kar: 'do',
  karna: 'to do',
  kare: 'do',
  karenge: 'will do',
  kiya: 'did',
  raha: 'working',
  rahi: 'working',
  rahe: 'working',
  'kar-raha': 'designing',
  'kar-rahi': 'working',
  'kar-rahe': 'working',
  hai: 'is',
  hain: 'are',
  ho: 'are',
  hoon: 'am',
  hun: 'am',
  tha: 'was',
  thi: 'was',
  the: 'were',
  dikhane: 'show',
  dikha: 'show',
  dikhana: 'to show',
  dikhao: 'show',
  wala: 'going to',
  wali: 'going to',
  wale: 'going to',
  batana: 'tell',
  bata: 'tell',
  batao: 'tell',
  bataenge: 'will tell',
  bol: 'speak',
  bolo: 'speak',
  dekho: 'look',
  dekh: 'look',
  dekhte: 'look',
  suno: 'listen',
  sun: 'listen',
  poora: 'whole',
  poori: 'whole',
  poore: 'whole',
  ready: 'ready',
  literally: 'literally',
  minute: 'minute',
  bahut: 'very',
  bohot: 'very',
  thoda: 'a bit',
  thodi: 'a bit',
  achha: 'great',
  acchi: 'good',
  badiya: 'awesome',
  badhiya: 'awesome',
  sahi: 'right',
  galat: 'wrong',
  kaise: 'how',
  kya: 'what',
  kyun: 'why',
  kab: 'when',
  kahan: 'where',
  kaun: 'who',
  aaj: 'today',
  kal: 'tomorrow',
  shuru: 'start',
  khatam: 'finish',
  isko: 'it',
  usko: 'that',
  paas: 'with',
  saath: 'together',
  bhi: 'also',
  sab: 'all',
  sabse: 'most',
  accha: 'good',
  kaam: 'work',
  chal: 'come on',
  chalo: 'let us',
  baat: 'talk',
  karen: 'do',
  chahiye: 'need',
  sakte: 'can',
  paise: 'money',
  soch: 'think',
  tarika: 'way',
  zaruri: 'important',
  zaroori: 'important',
  milta: 'get',
  bante: 'make',
};

const ENGLISH_TO_HINGLISH_WORD_MAP: Record<string, string> = {
  i: 'Main',
  me: 'mujhe',
  my: 'apna',
  mine: 'mera',
  we: 'hum',
  our: 'hamara',
  ours: 'hamara',
  you: 'aap',
  your: 'aapka',
  yours: 'aapka',
  he: 'woh',
  she: 'woh',
  they: 'woh',
  them: 'unko',
  their: 'unka',
  it: 'isko',
  its: 'iska',
  this: 'yeh',
  that: 'woh',
  these: 'ye',
  those: 'woh',
  am: 'hoon',
  is: 'hai',
  are: 'hain',
  was: 'tha',
  were: 'the',
  be: 'hona',
  been: 'raha',
  being: 'hote',
  have: 'hai',
  has: 'hai',
  had: 'tha',
  do: 'karna',
  does: 'karta',
  did: 'kiya',
  just: 'abhi',
  now: 'abhi',
  only: 'sirf',
  and: 'aur',
  but: 'lekin',
  or: 'ya',
  so: 'toh',
  the: 'ye',
  a: 'ek',
  an: 'ek',
  whole: 'poori',
  entire: 'poori',
  full: 'poora',
  all: 'sab',
  focusing: 'focus',
  focus: 'focus',
  designing: 'design',
  design: 'design',
  going: 'wala',
  to: 'ko',
  show: 'dikhane',
  showing: 'dikha',
  load: 'load',
  loading: 'load',
  portfolio: 'portfolio',
  screen: 'screen',
  video: 'video',
  template: 'template',
  upload: 'upload',
  uploaded: 'upload kiya',
  choose: 'choose',
  chose: 'choose kiya',
  ready: 'ready',
  literally: 'literally',
  minute: 'minute',
  tell: 'batana',
  telling: 'bata',
  look: 'dekho',
  listen: 'suno',
  work: 'kaam',
  working: 'kaam',
  make: 'banana',
  making: 'bana',
  talk: 'baat',
  talking: 'baat',
  bro: 'bhai',
  brother: 'bhai',
  friend: 'dost',
  friends: 'dosto',
  guys: 'dosto',
  people: 'log',
  today: 'aaj',
  tomorrow: 'kal',
  yesterday: 'kal',
  very: 'bahut',
  great: 'badiya',
  good: 'achha',
  right: 'sahi',
  wrong: 'galat',
  start: 'shuru',
  finish: 'khatam',
  important: 'zaroori',
  can: 'sakte',
  will: 'karenge',
  how: 'kaise',
  why: 'kyun',
  what: 'kya',
  when: 'kab',
  where: 'kahan',
  who: 'kaun',
  need: 'chahiye',
  want: 'chahiye',
  also: 'bhi',
  together: 'saath',
};

const COMMON_DEVANAGARI_MAP: Record<string, string> = {
  main: 'मैं',
  maine: 'मैंने',
  mujhe: 'मुझे',
  mera: 'मेरा',
  meri: 'मेरी',
  mere: 'मेरे',
  apna: 'अपना',
  apni: 'अपनी',
  apne: 'अपने',
  hum: 'हम',
  hamara: 'हमारा',
  aap: 'आप',
  aapko: 'आपको',
  aapka: 'आपका',
  tum: 'तुम',
  yeh: 'यह',
  ye: 'ये',
  woh: 'वह',
  wo: 'वो',
  video: 'वीडियो',
  upload: 'अपलोड',
  kiya: 'किया',
  abhi: 'अभी',
  design: 'डिजाइन',
  designing: 'डिजाइन',
  screen: 'स्क्रीन',
  portfolio: 'पोर्टफोलियो',
  focus: 'फोकस',
  focusing: 'फोकस',
  poora: 'पूरा',
  poori: 'पूरी',
  dikhane: 'दिखाने',
  dikha: 'दिखा',
  wala: 'वाला',
  wali: 'वाली',
  hoon: 'हूँ',
  hai: 'है',
  hain: 'हैं',
  bhai: 'भाई',
  dost: 'दोस्त',
  dosto: 'दोस्तों',
  aaj: 'आज',
  kaise: 'कैसे',
  karna: 'करना',
  load: 'लोड',
  ready: 'रेडी',
  literally: 'सच में',
  minute: 'मिनट',
  aur: 'और',
  lekin: 'लेकिन',
  bas: 'बस',
  sirf: 'सिर्फ',
  par: 'पर',
  ko: 'को',
  mein: 'में',
  me: 'में',
  se: 'से',
  i: 'मैं',
  am: 'हूँ',
  just: 'अभी',
  the: 'यह',
  whole: 'पूरी',
  going: 'वाला',
  to: 'को',
  show: 'दिखाने',
  you: 'आपको',
  it: 'इसको',
  work: 'काम',
  great: 'बढ़िया',
  good: 'अच्छा',
  start: 'शुरू',
  finish: 'खत्म',
  tell: 'बताना',
  listen: 'सुनो',
  look: 'देखो',
};

/**
 * Returns the localized text for a word according to the active Indian language script.
 * Seamlessly translates between Romanized Hinglish, English Translation, Hindi Devanagari,
 * Tamil, and Bengali scripts across both English and Hindi video uploads.
 */
export function getWordTextForScript(word: CaptionWord, scriptId: string): string {
  const raw = (word.text || '').trim();
  const leadingPunct = (raw.match(/^[^\p{L}\p{M}\p{N}]+/u) || [''])[0];
  const trailingPunct = (raw.match(/[^\p{L}\p{M}\p{N}]+$/u) || [''])[0];
  const core = raw.slice(leadingPunct.length, raw.length - trailingPunct.length);
  const lowerCore = core.toLowerCase();

  switch (scriptId) {
    case 'devanagari':
    case 'hi-deva': {
      // 1. If word already has valid Devanagari script stored, use it
      if (word.hiDeva && /[\u0900-\u097F]/.test(word.hiDeva)) {
        return word.hiDeva;
      }
      // 2. If core text is already Devanagari, preserve it
      if (/[\u0900-\u097F]/.test(core)) {
        return word.text;
      }
      // 3. Direct Devanagari dictionary lookup
      const directDeva = COMMON_DEVANAGARI_MAP[lowerCore];
      if (directDeva) {
        return `${leadingPunct}${directDeva}${trailingPunct}`;
      }
      // 4. If core is English word, translate to Hinglish first, then Devanagari
      const hiWord = ENGLISH_TO_HINGLISH_WORD_MAP[lowerCore];
      if (hiWord && COMMON_DEVANAGARI_MAP[hiWord.toLowerCase()]) {
        return `${leadingPunct}${COMMON_DEVANAGARI_MAP[hiWord.toLowerCase()]}${trailingPunct}`;
      }
      // 5. Phonetic transliteration into Devanagari
      const transliterated = phoneticRomanToDevanagari(core);
      return `${leadingPunct}${transliterated}${trailingPunct}`;
    }
    case 'tamil':
    case 'ta':
      return word.ta || word.text;
    case 'bengali':
    case 'bn':
      return word.bn || word.text;
    case 'english':
    case 'en': {
      // 1. If core is already Devanagari, romanize it first
      const romanCore = /[\u0900-\u097F]/.test(core)
        ? devanagariToRomanHinglish(core)
        : core;
      const lowerRoman = romanCore.toLowerCase();

      // 2. Translate Hinglish/Hindi word to genuine English
      const enMap = HINGLISH_TO_ENGLISH_WORD_MAP[lowerRoman];
      if (enMap !== undefined) {
        if (!enMap) return '';
        const cap = core.length > 0 && core[0] === core[0].toUpperCase();
        const formatted = cap ? enMap.charAt(0).toUpperCase() + enMap.slice(1) : enMap;
        return `${leadingPunct}${formatted}${trailingPunct}`;
      }

      // 3. If explicit non-identical English translation is stored, use it
      if (word.en && word.en.trim().length > 0 && word.en.toLowerCase() !== lowerCore) {
        return word.en;
      }

      return word.en || word.text;
    }
    case 'hinglish':
    default: {
      // 1. If core is Devanagari, convert to natural Romanized Hinglish
      if (/[\u0900-\u097F]/.test(core)) {
        const romanized = devanagariToRomanHinglish(core);
        return `${leadingPunct}${romanized}${trailingPunct}`;
      }

      // 2. If original word was English and user selected Hinglish, translate to natural Romanized Hindi
      const hiMap = ENGLISH_TO_HINGLISH_WORD_MAP[lowerCore];
      if (hiMap) {
        const cap = core.length > 0 && core[0] === core[0].toUpperCase();
        const formatted = cap ? hiMap.charAt(0).toUpperCase() + hiMap.slice(1) : hiMap;
        return `${leadingPunct}${formatted}${trailingPunct}`;
      }

      return word.text;
    }
  }
}

/**
 * Finds the active segment and active word at a given playback timestamp.
 */
export function getActiveSegmentAndWord(
  segments: CaptionSegment[],
  currentTime: number
): {
  segment: CaptionSegment | null;
  segmentIndex: number;
  activeWord: CaptionWord | null;
  activeWordIndex: number;
} {
  if (!segments || !segments.length) {
    return { segment: null, segmentIndex: -1, activeWord: null, activeWordIndex: -1 };
  }

  let matchedSegIdx = segments.findIndex(
    (seg) => currentTime >= seg.start - 0.04 && currentTime <= seg.end + 0.08
  );

  if (matchedSegIdx === -1) {
    let bestIdx = 0;
    let bestDist = Infinity;
    segments.forEach((seg, idx) => {
      const dist = Math.min(
        Math.abs(currentTime - seg.start),
        Math.abs(currentTime - seg.end)
      );
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = idx;
      }
    });
    matchedSegIdx = bestIdx;
  }

  const segment = segments[matchedSegIdx] || null;
  if (!segment || !segment.words || !segment.words.length) {
    return { segment, segmentIndex: matchedSegIdx, activeWord: null, activeWordIndex: -1 };
  }

  let activeWordIndex = segment.words.findIndex(
    (w) => currentTime >= w.start - 0.02 && currentTime <= w.end + 0.04
  );

  if (activeWordIndex === -1) {
    if (currentTime < segment.words[0].start) {
      activeWordIndex = 0;
    } else if (currentTime > segment.words[segment.words.length - 1].end) {
      activeWordIndex = segment.words.length - 1;
    } else {
      let closestIdx = 0;
      let minDelta = Infinity;
      segment.words.forEach((w, idx) => {
        const delta = Math.abs(currentTime - (w.start + w.end) / 2);
        if (delta < minDelta) {
          minDelta = delta;
          closestIdx = idx;
        }
      });
      activeWordIndex = closestIdx;
    }
  }

  return {
    segment,
    segmentIndex: matchedSegIdx,
    activeWord: segment.words[activeWordIndex] || null,
    activeWordIndex,
  };
}

/**
 * Rebuilds segments when switching between 1-Line (compact 2 words) and 2-Lines (4 words) mode.
 */
export function rebuildSegmentsByLineMode(
  segments: CaptionSegment[],
  linesMode: 1 | 2
): CaptionSegment[] {
  const allWords: CaptionWord[] = segments.flatMap((s) => s.words || []);
  if (allWords.length === 0) return [];

  const targetChunkSize = linesMode === 1 ? 2 : 4;
  const result: CaptionSegment[] = [];
  let buffer: CaptionWord[] = [];

  for (let i = 0; i < allWords.length; i++) {
    const word = allWords[i];
    buffer.push(word);
    const nextWord = allWords[i + 1];
    const gap = nextWord ? nextWord.start - word.end : 99;

    if (
      buffer.length >= targetChunkSize ||
      gap >= 0.45 ||
      i === allWords.length - 1
    ) {
      const hasBehindHero = buffer.some((w) => w.emphasis !== 'none');
      result.push({
        id: `seg-${result.length + 1}`,
        start: buffer[0].start,
        end: buffer[buffer.length - 1].end,
        words: [...buffer],
        behindSubject: hasBehindHero,
      });
      buffer = [];
    }
  }

  return result;
}

/**
 * Splits a segment at a given word index (1..words.length-1) into two separate segments.
 */
export function splitSegmentAtWord(
  segments: CaptionSegment[],
  segmentId: string,
  wordIndex: number
): CaptionSegment[] {
  const idx = segments.findIndex((s) => s.id === segmentId);
  if (idx === -1) return segments;
  const target = segments[idx];
  if (!target.words || wordIndex <= 0 || wordIndex >= target.words.length) {
    return segments;
  }

  const firstWords = target.words.slice(0, wordIndex);
  const secondWords = target.words.slice(wordIndex);

  const firstSeg: CaptionSegment = {
    id: `${target.id}-a`,
    start: firstWords[0].start,
    end: firstWords[firstWords.length - 1].end,
    words: firstWords,
    behindSubject: target.behindSubject,
  };
  const secondSeg: CaptionSegment = {
    id: `${target.id}-b`,
    start: secondWords[0].start,
    end: secondWords[secondWords.length - 1].end,
    words: secondWords,
    behindSubject: secondWords.some((w) => w.emphasis !== 'none'),
  };

  const next = [...segments];
  next.splice(idx, 1, firstSeg, secondSeg);
  return next;
}

/**
 * Cycles a word's emphasis state: 'none' -> 'green' -> 'amber' -> 'none'
 */
export function cycleWordEmphasis(
  current: 'none' | 'green' | 'amber'
): 'none' | 'green' | 'amber' {
  if (current === 'none') return 'green';
  if (current === 'green') return 'amber';
  return 'none';
}

/**
 * Generates valid SRT file content from the current segments and script.
 */
export function generateSrt(segments: CaptionSegment[], scriptId = 'hinglish'): string {
  return segments
    .map((seg, i) => {
      const index = i + 1;
      const startStr = formatSrtTimestamp(seg.start);
      const endStr = formatSrtTimestamp(seg.end);
      const line = seg.words.map((w) => getWordTextForScript(w, scriptId)).join(' ');
      return `${index}\n${startStr} --> ${endStr}\n${line}`;
    })
    .join('\n\n');
}

/**
 * Parses an SRT string into CaptionSegments with evenly distributed word timestamps.
 */
export function parseSrt(srtText: string): CaptionSegment[] {
  const blocks = srtText
    .replace(/\r\n/g, '\n')
    .trim()
    .split(/\n\s*\n/);

  const parsed: CaptionSegment[] = [];
  let wordCounter = 1;

  const parseTime = (t: string): number => {
    const match = t.trim().match(/(\d+):(\d+):(\d+)[,.](\d+)/);
    if (!match) return 0;
    const [, hh, mm, ss, ms] = match;
    return (
      parseInt(hh, 10) * 3600 +
      parseInt(mm, 10) * 60 +
      parseInt(ss, 10) +
      parseInt(ms.padEnd(3, '0').slice(0, 3), 10) / 1000
    );
  };

  for (const block of blocks) {
    const lines = block
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 2) continue;

    const timeLineIdx = lines.findIndex((l) => l.includes('-->'));
    if (timeLineIdx === -1) continue;

    const [startRaw, endRaw] = lines[timeLineIdx].split('-->');
    const start = parseTime(startRaw);
    const end = Math.max(start + 0.2, parseTime(endRaw));
    const textContent = lines
      .slice(timeLineIdx + 1)
      .join(' ')
      .trim();
    if (!textContent) continue;

    const tokens = textContent.split(/\s+/).filter(Boolean);
    const duration = end - start;
    const perWord = duration / Math.max(1, tokens.length);

    const words: CaptionWord[] = tokens.map((tok, idx) => {
      const wStart = Number((start + idx * perWord).toFixed(2));
      const wEnd = Number((start + (idx + 1) * perWord).toFixed(2));
      const emphasis: 'none' | 'green' | 'amber' =
        idx === tokens.length - 1 && tokens.length > 2
          ? 'amber'
          : idx === 0 && tokens.length > 1
          ? 'green'
          : 'none';
      return {
        id: `srt-w-${wordCounter++}`,
        text: tok,
        hiDeva: tok,
        ta: tok,
        bn: tok,
        en: tok,
        start: wStart,
        end: wEnd,
        emphasis,
      };
    });

    parsed.push({
      id: `srt-seg-${parsed.length + 1}`,
      start,
      end,
      words,
      behindSubject: words.some((w) => w.emphasis === 'amber'),
    });
  }

  return parsed;
}

/**
 * Filters the 106 Captik templates by category tab (matching TEMPLATE_TABS) and search query.
 */
export function filterTemplates(
  templates: CaptionTemplateSpec[],
  categoryKey: string,
  searchQuery: string
): CaptionTemplateSpec[] {
  const q = searchQuery.trim().toLowerCase();
  const tabSpec = TEMPLATE_TABS.find((t) => t.key === categoryKey);
  const allowedIds = tabSpec ? new Set(tabSpec.ids) : null;

  return templates.filter((tpl) => {
    const matchesCategory =
      !categoryKey || categoryKey === 'all'
        ? true
        : allowedIds
        ? allowedIds.has(tpl.id)
        : tpl.category === categoryKey;

    if (!matchesCategory) return false;
    if (!q) return true;

    return (
      tpl.name.toLowerCase().includes(q) ||
      tpl.description.toLowerCase().includes(q) ||
      tpl.category.toLowerCase().includes(q) ||
      tpl.fontFamily.toLowerCase().includes(q)
    );
  });
}

/**
 * Computes pause-removed segments when user switches Remove Pauses between 'Off', 'Natural', and 'Tight'.
 */
export function applyPauseRemovalMode(
  segments: CaptionSegment[],
  mode: 'Off' | 'Natural' | 'Tight'
): { segments: CaptionSegment[]; savedSeconds: number } {
  if (mode === 'Off' || !segments || segments.length === 0) {
    return { segments, savedSeconds: 0 };
  }

  const compressFactor = mode === 'Tight' ? 0.86 : 0.93;
  const originalEnd = segments[segments.length - 1].end;

  const adjusted: CaptionSegment[] = segments.map((seg) => {
    const shiftedWords = seg.words.map((w) => ({
      ...w,
      start: Number((w.start * compressFactor).toFixed(2)),
      end: Number(Math.max(0.08, w.end * compressFactor).toFixed(2)),
    }));

    return {
      ...seg,
      start: shiftedWords[0].start,
      end: shiftedWords[shiftedWords.length - 1].end,
      words: shiftedWords,
    };
  });

  const newEnd = adjusted[adjusted.length - 1].end;
  return {
    segments: adjusted,
    savedSeconds: Number(Math.max(0.05, originalEnd - newEnd).toFixed(2)),
  };
}

/**
 * Builds the CSS filter string for the HTML5 video element based on Adjustment sliders & LUTs.
 */
export function buildVideoFilterCss(
  adj: ColorAdjustments,
  lutFilterCss = 'none'
): string {
  const brightness = 1 + (adj.brightness + adj.exposure * 0.8) / 100;
  const contrast = 1 + (adj.contrast + adj.sharpen * 0.25) / 100;
  const saturate = 1 + adj.saturation / 100;
  const hueRotate = adj.tint * 0.9;
  const sepia = adj.temperature > 0 ? adj.temperature / 220 : 0;

  const parts: string[] = [
    `brightness(${Math.max(0.2, brightness).toFixed(2)})`,
    `contrast(${Math.max(0.2, contrast).toFixed(2)})`,
    `saturate(${Math.max(0, saturate).toFixed(2)})`,
  ];

  if (Math.abs(hueRotate) > 0.5) {
    parts.push(`hue-rotate(${hueRotate.toFixed(0)}deg)`);
  }
  if (sepia > 0.01) {
    parts.push(`sepia(${sepia.toFixed(2)})`);
  }
  if (lutFilterCss && lutFilterCss !== 'none') {
    parts.push(lutFilterCss);
  }

  return parts.join(' ');
}

/**
 * Creates the initial single full-length VideoTimelineClip for a video duration.
 */
export function createInitialVideoClips(
  durationSec: number,
  title = 'Video Clip'
): VideoTimelineClip[] {
  const cleanDur = Number(Math.max(0.5, durationSec || 7.07).toFixed(2));
  return [
    {
      id: 'vclip-1',
      title,
      timelineStart: 0,
      timelineEnd: cleanDur,
      sourceStart: 0,
      sourceEnd: cleanDur,
      speed: 1,
      muted: false,
    },
  ];
}

/**
 * Creates synchronized AudioTimelineClips linked to the provided VideoTimelineClips.
 */
export function createInitialAudioClips(
  videoClips: VideoTimelineClip[],
  title = 'Original Audio'
): AudioTimelineClip[] {
  return videoClips.map((vc, idx) => ({
    id: `aclip-${idx + 1}`,
    title: videoClips.length > 1 ? `${title} ${idx + 1}` : title,
    linkedVideoClipId: vc.id,
    timelineStart: vc.timelineStart,
    timelineEnd: vc.timelineEnd,
    sourceStart: vc.sourceStart,
    sourceEnd: vc.sourceEnd,
    volume: 1,
    muted: false,
  }));
}

/**
 * Computes the effective edited timeline duration across video and audio clips.
 */
export function computeEditedTimelineDuration(
  videoClips: VideoTimelineClip[],
  audioClips: AudioTimelineClip[],
  fallbackDuration = 7.07
): number {
  let maxEnd = 0;
  for (const vc of videoClips) {
    if (vc.timelineEnd > maxEnd) maxEnd = vc.timelineEnd;
  }
  for (const ac of audioClips) {
    if (ac.timelineEnd > maxEnd) maxEnd = ac.timelineEnd;
  }
  return maxEnd > 0.2 ? Number(maxEnd.toFixed(2)) : fallbackDuration;
}

/**
 * Maps a playback timestamp on the edited timeline (`timelineTime`) to the corresponding
 * source video timestamp (`sourceTime`) and active `VideoTimelineClip`.
 */
export function mapTimelineTimeToSourceVideo(
  videoClips: VideoTimelineClip[],
  timelineTime: number
): {
  clip: VideoTimelineClip | null;
  sourceTime: number;
  isGap: boolean;
  nextClipStart: number | null;
} {
  if (!videoClips || videoClips.length === 0) {
    return {
      clip: null,
      sourceTime: Math.max(0, timelineTime),
      isGap: false,
      nextClipStart: null,
    };
  }

  const sorted = [...videoClips].sort((a, b) => a.timelineStart - b.timelineStart);
  const t = Math.max(0, timelineTime);

  // Find clip containing t (with small tolerance at boundary)
  const active = sorted.find(
    (c) => t >= c.timelineStart - 0.02 && t <= c.timelineEnd + 0.02
  );

  if (active) {
    const offsetInClip = Math.max(0, t - active.timelineStart);
    const speed = active.speed || 1;
    const rawSource = active.sourceStart + offsetInClip * speed;
    const clampedSource = Math.max(
      active.sourceStart,
      Math.min(active.sourceEnd, rawSource)
    );
    return {
      clip: active,
      sourceTime: Number(clampedSource.toFixed(3)),
      isGap: false,
      nextClipStart: null,
    };
  }

  // If t is in a gap between clips, find the next clip after t
  const nextClip = sorted.find((c) => c.timelineStart > t);
  const prevClip = [...sorted].reverse().find((c) => c.timelineEnd <= t);
  const fallbackSource = nextClip
    ? nextClip.sourceStart
    : prevClip
    ? prevClip.sourceEnd
    : 0;

  return {
    clip: null,
    sourceTime: Number(fallbackSource.toFixed(3)),
    isGap: true,
    nextClipStart: nextClip ? nextClip.timelineStart : null,
  };
}

/**
 * Maps a playback timestamp on the edited timeline (`timelineTime`) to the active
 * `AudioTimelineClip` and its source audio timestamp (`sourceTime`).
 */
export function mapTimelineTimeToSourceAudio(
  audioClips: AudioTimelineClip[],
  timelineTime: number
): {
  clip: AudioTimelineClip | null;
  sourceTime: number;
  isMuted: boolean;
  volume: number;
} {
  if (!audioClips || audioClips.length === 0) {
    return {
      clip: null,
      sourceTime: timelineTime,
      isMuted: true,
      volume: 0,
    };
  }

  const t = Math.max(0, timelineTime);
  const active = audioClips.find(
    (c) => t >= c.timelineStart - 0.02 && t <= c.timelineEnd + 0.02
  );

  if (!active || active.muted) {
    return {
      clip: active || null,
      sourceTime: active ? active.sourceStart : t,
      isMuted: true,
      volume: 0,
    };
  }

  const offset = Math.max(0, t - active.timelineStart);
  const sourceTime = Math.max(
    active.sourceStart,
    Math.min(active.sourceEnd, active.sourceStart + offset)
  );

  return {
    clip: active,
    sourceTime: Number(sourceTime.toFixed(3)),
    isMuted: false,
    volume: active.volume ?? 1,
  };
}

/**
 * Splits video and/or audio clips at the exact `splitTime` timestamp on the timeline.
 * - When `isAudioLinked` is true (or `targetTrack === 'both'`), splits both the video clip
 *   at `splitTime` and its linked/matching audio clip at the exact same timestamp.
 * - When `isAudioLinked` is false, allows splitting video or audio independently.
 */
export function splitVideoAndAudioClipsAtTime(params: {
  videoClips: VideoTimelineClip[];
  audioClips: AudioTimelineClip[];
  splitTime: number;
  isAudioLinked: boolean;
  targetTrack?: 'both' | 'video' | 'audio';
}): {
  videoClips: VideoTimelineClip[];
  audioClips: AudioTimelineClip[];
  didSplitVideo: boolean;
  didSplitAudio: boolean;
  newSelectedClipId: string | null;
} {
  const {
    videoClips,
    audioClips,
    splitTime,
    isAudioLinked,
    targetTrack = 'both',
  } = params;

  const exactSplit = Number(splitTime.toFixed(2));
  const minClipLen = 0.15;

  let nextVideoClips = [...videoClips];
  let nextAudioClips = [...audioClips];
  let didSplitVideo = false;
  let didSplitAudio = false;
  let newSelectedClipId: string | null = null;
  let splitVideoOriginalId: string | null = null;
  let splitVideoLeftId: string | null = null;
  let splitVideoRightId: string | null = null;

  const shouldSplitVideo =
    isAudioLinked || targetTrack === 'both' || targetTrack === 'video';
  const shouldSplitAudio =
    isAudioLinked || targetTrack === 'both' || targetTrack === 'audio';

  if (shouldSplitVideo) {
    const vIdx = nextVideoClips.findIndex(
      (c) =>
        exactSplit > c.timelineStart + minClipLen &&
        exactSplit < c.timelineEnd - minClipLen
    );

    if (vIdx !== -1) {
      const target = nextVideoClips[vIdx];
      splitVideoOriginalId = target.id;
      const elapsedInTimeline = exactSplit - target.timelineStart;
      const speed = target.speed || 1;
      const sourceSplitPoint = Number(
        (target.sourceStart + elapsedInTimeline * speed).toFixed(2)
      );

      splitVideoLeftId = `${target.id}-pt1-${Date.now().toString(36).slice(-3)}`;
      splitVideoRightId = `${target.id}-pt2-${Date.now().toString(36).slice(-3)}`;

      const baseTitle = target.title.replace(/\s*\(Part\s*\d+\)$/i, '');
      const leftClip: VideoTimelineClip = {
        ...target,
        id: splitVideoLeftId,
        title: `${baseTitle} (Part 1)`,
        timelineStart: Number(target.timelineStart.toFixed(2)),
        timelineEnd: exactSplit,
        sourceStart: Number(target.sourceStart.toFixed(2)),
        sourceEnd: sourceSplitPoint,
      };
      const rightClip: VideoTimelineClip = {
        ...target,
        id: splitVideoRightId,
        title: `${baseTitle} (Part 2)`,
        timelineStart: exactSplit,
        timelineEnd: Number(target.timelineEnd.toFixed(2)),
        sourceStart: sourceSplitPoint,
        sourceEnd: Number(target.sourceEnd.toFixed(2)),
      };

      nextVideoClips.splice(vIdx, 1, leftClip, rightClip);
      didSplitVideo = true;
      newSelectedClipId = rightClip.id;
    }
  }

  if (shouldSplitAudio) {
    const aIdx = nextAudioClips.findIndex((c) => {
      if (isAudioLinked && splitVideoOriginalId && c.linkedVideoClipId === splitVideoOriginalId) {
        return (
          exactSplit > c.timelineStart + minClipLen &&
          exactSplit < c.timelineEnd - minClipLen
        );
      }
      return (
        exactSplit > c.timelineStart + minClipLen &&
        exactSplit < c.timelineEnd - minClipLen
      );
    });

    if (aIdx !== -1) {
      const targetA = nextAudioClips[aIdx];
      const elapsedInAudio = exactSplit - targetA.timelineStart;
      const audioSourceSplit = Number(
        (targetA.sourceStart + elapsedInAudio).toFixed(2)
      );

      const leftAudioId = `${targetA.id}-pt1-${Date.now().toString(36).slice(-3)}`;
      const rightAudioId = `${targetA.id}-pt2-${Date.now().toString(36).slice(-3)}`;
      const baseAudioTitle = targetA.title.replace(/\s*\(Part\s*\d+\)$/i, '');

      const leftAudio: AudioTimelineClip = {
        ...targetA,
        id: leftAudioId,
        title: `${baseAudioTitle} (Part 1)`,
        linkedVideoClipId:
          isAudioLinked && splitVideoLeftId
            ? splitVideoLeftId
            : targetA.linkedVideoClipId,
        timelineStart: Number(targetA.timelineStart.toFixed(2)),
        timelineEnd: exactSplit,
        sourceStart: Number(targetA.sourceStart.toFixed(2)),
        sourceEnd: audioSourceSplit,
      };

      const rightAudio: AudioTimelineClip = {
        ...targetA,
        id: rightAudioId,
        title: `${baseAudioTitle} (Part 2)`,
        linkedVideoClipId:
          isAudioLinked && splitVideoRightId
            ? splitVideoRightId
            : targetA.linkedVideoClipId,
        timelineStart: exactSplit,
        timelineEnd: Number(targetA.timelineEnd.toFixed(2)),
        sourceStart: audioSourceSplit,
        sourceEnd: Number(targetA.sourceEnd.toFixed(2)),
      };

      nextAudioClips.splice(aIdx, 1, leftAudio, rightAudio);
      didSplitAudio = true;
      if (!newSelectedClipId) {
        newSelectedClipId = rightAudio.id;
      }
    }
  }

  return {
    videoClips: nextVideoClips,
    audioClips: nextAudioClips,
    didSplitVideo,
    didSplitAudio,
    newSelectedClipId,
  };
}

/**
 * Trims the start (`edge === 'start'`) or end (`edge === 'end'`) of a VideoTimelineClip,
 * keeping adjacent clips from overlapping and synchronously trimming any linked AudioTimelineClip
 * when `isAudioLinked` is true.
 */
export function trimVideoClipBoundary(params: {
  videoClips: VideoTimelineClip[];
  audioClips: AudioTimelineClip[];
  clipId: string;
  edge: 'start' | 'end';
  newTimelineTime: number;
  maxSourceDuration: number;
  isAudioLinked: boolean;
}): {
  videoClips: VideoTimelineClip[];
  audioClips: AudioTimelineClip[];
} {
  const {
    videoClips,
    audioClips,
    clipId,
    edge,
    newTimelineTime,
    maxSourceDuration,
    isAudioLinked,
  } = params;

  const sorted = [...videoClips].sort((a, b) => a.timelineStart - b.timelineStart);
  const idx = sorted.findIndex((c) => c.id === clipId);
  if (idx === -1) return { videoClips, audioClips };

  const clip = sorted[idx];
  const prevClip = idx > 0 ? sorted[idx - 1] : null;
  const nextClip = idx < sorted.length - 1 ? sorted[idx + 1] : null;
  const minDuration = 0.25;

  let updatedClip = { ...clip };

  if (edge === 'start') {
    const minTimelineStart = prevClip ? prevClip.timelineEnd : 0;
    const maxTimelineStart = clip.timelineEnd - minDuration;
    // Also cannot trim earlier than sourceStart = 0
    const earliestBySource = clip.timelineStart - clip.sourceStart;
    const clampedStart = Number(
      Math.max(
        minTimelineStart,
        earliestBySource,
        Math.min(maxTimelineStart, newTimelineTime)
      ).toFixed(2)
    );
    const delta = clampedStart - clip.timelineStart;
    updatedClip = {
      ...clip,
      timelineStart: clampedStart,
      sourceStart: Number(Math.max(0, clip.sourceStart + delta).toFixed(2)),
    };
  } else {
    const minTimelineEnd = clip.timelineStart + minDuration;
    const maxByNext = nextClip ? nextClip.timelineStart : maxSourceDuration * 2;
    const maxBySource =
      clip.timelineStart + (maxSourceDuration - clip.sourceStart);
    const clampedEnd = Number(
      Math.max(
        minTimelineEnd,
        Math.min(maxByNext, maxBySource, newTimelineTime)
      ).toFixed(2)
    );
    const newLen = clampedEnd - clip.timelineStart;
    updatedClip = {
      ...clip,
      timelineEnd: clampedEnd,
      sourceEnd: Number(
        Math.min(maxSourceDuration, clip.sourceStart + newLen).toFixed(2)
      ),
    };
  }

  const nextVideoClips = sorted.map((c) => (c.id === clipId ? updatedClip : c));

  let nextAudioClips = [...audioClips];
  if (isAudioLinked) {
    nextAudioClips = nextAudioClips.map((ac) => {
      if (ac.linkedVideoClipId !== clipId) return ac;
      return {
        ...ac,
        timelineStart: updatedClip.timelineStart,
        timelineEnd: updatedClip.timelineEnd,
        sourceStart: updatedClip.sourceStart,
        sourceEnd: updatedClip.sourceEnd,
      };
    });
  }

  return {
    videoClips: nextVideoClips,
    audioClips: nextAudioClips,
  };
}

/**
 * Trims an AudioTimelineClip independently (or when unlinked).
 */
export function trimAudioClipBoundary(params: {
  audioClips: AudioTimelineClip[];
  clipId: string;
  edge: 'start' | 'end';
  newTimelineTime: number;
  maxSourceDuration: number;
}): AudioTimelineClip[] {
  const { audioClips, clipId, edge, newTimelineTime, maxSourceDuration } = params;
  const sorted = [...audioClips].sort((a, b) => a.timelineStart - b.timelineStart);
  const idx = sorted.findIndex((c) => c.id === clipId);
  if (idx === -1) return audioClips;

  const clip = sorted[idx];
  const prevClip = idx > 0 ? sorted[idx - 1] : null;
  const nextClip = idx < sorted.length - 1 ? sorted[idx + 1] : null;
  const minDuration = 0.25;

  if (edge === 'start') {
    const minStart = prevClip ? prevClip.timelineEnd : 0;
    const maxStart = clip.timelineEnd - minDuration;
    const earliestBySource = clip.timelineStart - clip.sourceStart;
    const clampedStart = Number(
      Math.max(
        minStart,
        earliestBySource,
        Math.min(maxStart, newTimelineTime)
      ).toFixed(2)
    );
    const delta = clampedStart - clip.timelineStart;
    return sorted.map((c) =>
      c.id === clipId
        ? {
            ...c,
            timelineStart: clampedStart,
            sourceStart: Number(Math.max(0, c.sourceStart + delta).toFixed(2)),
          }
        : c
    );
  } else {
    const minEnd = clip.timelineStart + minDuration;
    const maxByNext = nextClip ? nextClip.timelineStart : maxSourceDuration * 2;
    const maxBySource =
      clip.timelineStart + (maxSourceDuration - clip.sourceStart);
    const clampedEnd = Number(
      Math.max(minEnd, Math.min(maxByNext, maxBySource, newTimelineTime)).toFixed(2)
    );
    const newLen = clampedEnd - clip.timelineStart;
    return sorted.map((c) =>
      c.id === clipId
        ? {
            ...c,
            timelineEnd: clampedEnd,
            sourceEnd: Number(
              Math.min(maxSourceDuration, c.sourceStart + newLen).toFixed(2)
            ),
          }
        : c
    );
  }
}

/**
 * Compacts a list of VideoTimelineClips (and linked AudioTimelineClips) so there are no unintended gaps
 * after deleting or rearranging a clip, keeping the playback timeline continuous and synchronized.
 */
export function ripplePackVideoAndAudioClips(
  videoClips: VideoTimelineClip[],
  audioClips: AudioTimelineClip[],
  isAudioLinked: boolean
): {
  videoClips: VideoTimelineClip[];
  audioClips: AudioTimelineClip[];
} {
  let cursor = 0;
  const packedVideo: VideoTimelineClip[] = [];
  const shiftByVideoId = new Map<string, { start: number; end: number }>();

  for (const vc of videoClips) {
    const len = Number(Math.max(0.2, vc.timelineEnd - vc.timelineStart).toFixed(2));
    const start = Number(cursor.toFixed(2));
    const end = Number((start + len).toFixed(2));
    packedVideo.push({
      ...vc,
      timelineStart: start,
      timelineEnd: end,
    });
    shiftByVideoId.set(vc.id, { start, end });
    cursor = end;
  }

  const packedAudio = audioClips.map((ac) => {
    if (isAudioLinked && ac.linkedVideoClipId && shiftByVideoId.has(ac.linkedVideoClipId)) {
      const bounds = shiftByVideoId.get(ac.linkedVideoClipId)!;
      return {
        ...ac,
        timelineStart: bounds.start,
        timelineEnd: bounds.end,
      };
    }
    return ac;
  });

  return { videoClips: packedVideo, audioClips: packedAudio };
}

/**
 * Deletes a selected video or audio clip and keeps the remaining timeline consistent.
 */
export function deleteVideoOrAudioClip(params: {
  videoClips: VideoTimelineClip[];
  audioClips: AudioTimelineClip[];
  clipId: string;
  trackType: 'video' | 'audio';
  isAudioLinked: boolean;
}): {
  videoClips: VideoTimelineClip[];
  audioClips: AudioTimelineClip[];
  didDelete: boolean;
} {
  const { videoClips, audioClips, clipId, trackType, isAudioLinked } = params;

  if (trackType === 'video') {
    if (videoClips.length <= 1) {
      return { videoClips, audioClips, didDelete: false };
    }
    const remainingVideo = videoClips.filter((c) => c.id !== clipId);
    const remainingAudio = isAudioLinked
      ? audioClips.filter((a) => a.linkedVideoClipId !== clipId)
      : audioClips;

    const packed = ripplePackVideoAndAudioClips(
      remainingVideo,
      remainingAudio,
      isAudioLinked
    );
    return { ...packed, didDelete: true };
  } else {
    // Deleting an audio clip
    const remainingAudio = audioClips.filter((a) => a.id !== clipId);
    if (remainingAudio.length === audioClips.length) {
      return { videoClips, audioClips, didDelete: false };
    }
    return {
      videoClips,
      audioClips: remainingAudio,
      didDelete: true,
    };
  }
}

/**
 * Moves or rearranges a video or audio clip left/right or by a time delta (in seconds).
 */
export function moveOrRearrangeClip(params: {
  videoClips: VideoTimelineClip[];
  audioClips: AudioTimelineClip[];
  clipId: string;
  trackType: 'video' | 'audio';
  directionOrDelta: 'left' | 'right' | number;
  isAudioLinked: boolean;
}): {
  videoClips: VideoTimelineClip[];
  audioClips: AudioTimelineClip[];
} {
  const {
    videoClips,
    audioClips,
    clipId,
    trackType,
    directionOrDelta,
    isAudioLinked,
  } = params;

  if (trackType === 'video') {
    const ordered = [...videoClips].sort((a, b) => a.timelineStart - b.timelineStart);
    const idx = ordered.findIndex((c) => c.id === clipId);
    if (idx === -1) return { videoClips, audioClips };

    if (directionOrDelta === 'left' && idx > 0) {
      const temp = ordered[idx - 1];
      ordered[idx - 1] = ordered[idx];
      ordered[idx] = temp;
      return ripplePackVideoAndAudioClips(ordered, audioClips, isAudioLinked);
    }
    if (directionOrDelta === 'right' && idx < ordered.length - 1) {
      const temp = ordered[idx + 1];
      ordered[idx + 1] = ordered[idx];
      ordered[idx] = temp;
      return ripplePackVideoAndAudioClips(ordered, audioClips, isAudioLinked);
    }
    if (typeof directionOrDelta === 'number') {
      const clip = ordered[idx];
      const len = Number((clip.timelineEnd - clip.timelineStart).toFixed(2));
      const newStart = Number(Math.max(0, clip.timelineStart + directionOrDelta).toFixed(2));
      const newEnd = Number((newStart + len).toFixed(2));

      // Check if moving across another clip's midpoint to rearrange order
      const updated = ordered.map((c) =>
        c.id === clipId ? { ...c, timelineStart: newStart, timelineEnd: newEnd } : c
      );
      if (ordered.length > 1) {
        updated.sort(
          (a, b) =>
            (a.timelineStart + a.timelineEnd) / 2 -
            (b.timelineStart + b.timelineEnd) / 2
        );
        return ripplePackVideoAndAudioClips(updated, audioClips, isAudioLinked);
      }
      const nextAudio = isAudioLinked
        ? audioClips.map((ac) =>
            ac.linkedVideoClipId === clipId
              ? { ...ac, timelineStart: newStart, timelineEnd: newEnd }
              : ac
          )
        : audioClips;
      return { videoClips: updated, audioClips: nextAudio };
    }
    return { videoClips, audioClips };
  } else {
    // Moving an audio clip independently
    const idx = audioClips.findIndex((a) => a.id === clipId);
    if (idx === -1) return { videoClips, audioClips };
    const clip = audioClips[idx];
    const len = Number((clip.timelineEnd - clip.timelineStart).toFixed(2));
    const delta =
      directionOrDelta === 'left'
        ? -0.25
        : directionOrDelta === 'right'
        ? 0.25
        : directionOrDelta;
    const newStart = Number(Math.max(0, clip.timelineStart + delta).toFixed(2));
    const newEnd = Number((newStart + len).toFixed(2));

    const nextAudio = audioClips.map((a) =>
      a.id === clipId ? { ...a, timelineStart: newStart, timelineEnd: newEnd } : a
    );
    return { videoClips, audioClips: nextAudio };
  }
}

