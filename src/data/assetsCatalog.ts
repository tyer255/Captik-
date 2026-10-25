export interface WordItem {
  id: string;
  text: string;
  textHi?: string;
  textTa?: string;
  textBn?: string;
  textEn?: string;
  startMs: number;
  endMs: number;
  aiTier?: 0 | 1 | 2; // 2 = emerald green hero word, 1 = amber pop word, 0 = normal
  customColor?: string;
  scaleOverride?: number;
  sfxId?: string;
}

export interface CaptionSegment {
  id: string;
  index: number;
  wordIds: string[];
  behindSubject?: boolean;
  templateOverride?: string;
}

export interface TimelineOverlayItem {
  id: string;
  kind: 'text' | 'element';
  title: string;
  subtitle?: string;
  category: string;
  startMs: number;
  durationMs: number;
  xPercent: number;
  yPercent: number;
  scale: number;
  color: string;
  accentColor: string;
  fontFamily?: string;
  animIn: string;
  animOut: string;
  animLoop: string;
  animCombo: string;
  presetStyle?: string;
  badgeText?: string;
}

export interface TimelineSoundItem {
  id: string;
  sfxId: string;
  label: string;
  group: string;
  startMs: number;
  durationMs: number;
  gain: number;
}

export interface MediaAssetItem {
  id: string;
  title: string;
  category: 'takes' | 'broll' | 'property' | 'backgrounds';
  durationMs: number;
  resolution: '1080p' | '4K';
  aspect: '9:16' | '16:9';
  videoUrl?: string;
  posterUrl: string;
  accentColor: string;
  speakerName: string;
  languageLabel: string;
  words: WordItem[];
}

export const INITIAL_TERRACE_WORDS: WordItem[] = [
  { id: 'w1', text: 'Maine', textHi: 'मैंने', textTa: 'நான்', textBn: 'আমি', textEn: 'I', startMs: 400, endMs: 620, aiTier: 0 },
  { id: 'w2', text: 'bas', textHi: 'बस', textTa: 'வெறும்', textBn: 'শুধু', textEn: 'just', startMs: 620, endMs: 820, aiTier: 0 },
  { id: 'w3', text: 'video', textHi: 'वीडियो', textTa: 'வீடியோ', textBn: 'ভিডিও', textEn: 'uploaded', startMs: 820, endMs: 1020, aiTier: 2 },
  { id: 'w4', text: 'upload', textHi: 'अपलोड', textTa: 'அப்லோட்', textBn: 'আপলোড', textEn: 'the video,', startMs: 1020, endMs: 1200, aiTier: 2 },
  { id: 'w5', text: 'kiya,', textHi: 'किया,', textTa: 'செய்தேன்,', textBn: 'করলাম,', textEn: 'picked', startMs: 1200, endMs: 1550, aiTier: 0 },
  { id: 'w6', text: 'ek', textHi: 'एक', textTa: 'ஒரு', textBn: 'একটা', textEn: 'a', startMs: 1550, endMs: 1850, aiTier: 0 },
  { id: 'w7', text: 'template', textHi: 'टेम्पलेट', textTa: 'டெம்ப்ளேட்', textBn: 'টেমপ্লেট', textEn: 'template,', startMs: 1850, endMs: 2280, aiTier: 2 },
  { id: 'w8', text: 'choose', textHi: 'चूज़', textTa: 'தேர்வு', textBn: 'বেছে', textEn: 'and', startMs: 2280, endMs: 2700, aiTier: 0 },
  { id: 'w9', text: 'kiya,', textHi: 'किया,', textTa: 'செய்தேன்,', textBn: 'নিলাম,', textEn: 'literally', startMs: 2700, endMs: 3100, aiTier: 0 },
  { id: 'w10', text: 'aur', textHi: 'और', textTa: 'மற்றும்', textBn: 'আর', textEn: 'within', startMs: 3100, endMs: 3420, aiTier: 0 },
  { id: 'w11', text: 'literally', textHi: 'लिटरली', textTa: 'உண்மையில்', textBn: 'সত্যিই', textEn: 'one', startMs: 3420, endMs: 3920, aiTier: 2 },
  { id: 'w12', text: 'ek', textHi: 'एक', textTa: 'ஒரு', textBn: 'এক', textEn: 'single', startMs: 3920, endMs: 4300, aiTier: 0 },
  { id: 'w13', text: 'minute', textHi: 'मिनट', textTa: 'நிமிடத்தில்', textBn: 'মিনিটে', textEn: 'minute', startMs: 4300, endMs: 4720, aiTier: 2 },
  { id: 'w14', text: 'mein', textHi: 'में', textTa: 'உள்ளே', textBn: 'মধ্যে', textEn: 'the', startMs: 4720, endMs: 5080, aiTier: 0 },
  { id: 'w15', text: 'captions', textHi: 'कैप्शंस', textTa: 'கேப்ஷன்கள்', textBn: 'ক্যাপশন', textEn: 'captions', startMs: 5080, endMs: 5500, aiTier: 2 },
  { id: 'w16', text: 'ready.', textHi: 'रेडी।', textTa: 'தயார்.', textBn: 'তৈরি।', textEn: 'were ready.', startMs: 5500, endMs: 5900, aiTier: 2 },
  { id: 'w17', text: "That's", textHi: 'बस', textTa: 'அவ்வளவு', textBn: 'ব্যাস', textEn: "That's", startMs: 5900, endMs: 6120, aiTier: 0 },
  { id: 'w18', text: 'it.', textHi: 'इतना ही।', textTa: 'தான்.', textBn: 'এটুকুই।', textEn: 'it.', startMs: 6120, endMs: 6350, aiTier: 1 },
];

export const INITIAL_SEGMENTS: CaptionSegment[] = [
  { id: 'seg-1', index: 1, wordIds: ['w1', 'w2', 'w3', 'w4'], behindSubject: true },
  { id: 'seg-2', index: 2, wordIds: ['w5', 'w6', 'w7', 'w8'], behindSubject: false },
  { id: 'seg-3', index: 3, wordIds: ['w9', 'w10', 'w11', 'w12'], behindSubject: true },
  { id: 'seg-4', index: 4, wordIds: ['w13', 'w14', 'w15', 'w16'], behindSubject: false },
  { id: 'seg-5', index: 5, wordIds: ['w17', 'w18'], behindSubject: false },
];

export const MEDIA_LIBRARY_ASSETS: MediaAssetItem[] = [
  {
    id: 'media_terrace_reel',
    title: 'Terrace reel',
    category: 'takes',
    durationMs: 7070,
    resolution: '1080p',
    aspect: '9:16',
    videoUrl: '/assets/terrace_reel.mp4',
    posterUrl: '/assets/terrace_poster.webp',
    accentColor: '#10B981',
    speakerName: 'Rohan · Rooftop Take',
    languageLabel: 'Hinglish',
    words: INITIAL_TERRACE_WORDS,
  },
  {
    id: 'media_raw_take',
    title: 'Studio Raw Take',
    category: 'takes',
    durationMs: 6800,
    resolution: '4K',
    aspect: '9:16',
    videoUrl: '/assets/raw_take.mp4',
    posterUrl: '/assets/raw_take.webp',
    accentColor: '#F59E0B',
    speakerName: 'Ananya · Founder Vlog',
    languageLabel: 'Hinglish · हिंदी',
    words: [
      { id: 'rw1', text: 'Basically', textHi: 'बेसिकली', textEn: 'Basically', startMs: 300, endMs: 850, aiTier: 0 },
      { id: 'rw2', text: 'yeh', textHi: 'यह', textEn: 'try', startMs: 850, endMs: 1200, aiTier: 0 },
      { id: 'rw3', text: 'feature', textHi: 'फ़ीचर', textEn: 'this feature,', startMs: 1200, endMs: 1750, aiTier: 2 },
      { id: 'rw4', text: 'try', textHi: 'ट्राई', textEn: 'it', startMs: 1750, endMs: 2150, aiTier: 1 },
      { id: 'rw5', text: 'karo,', textHi: 'करो,', textEn: 'actually', startMs: 2150, endMs: 2650, aiTier: 0 },
      { id: 'rw6', text: 'it', textHi: 'यह', textEn: 'works', startMs: 2650, endMs: 3000, aiTier: 0 },
      { id: 'rw7', text: 'actually', textHi: 'वाकई', textEn: 'on every', startMs: 3000, endMs: 3650, aiTier: 2 },
      { id: 'rw8', text: 'works.', textHi: 'काम करता है।', textEn: 'reel.', startMs: 3650, endMs: 4400, aiTier: 2 },
    ],
  },
  {
    id: 'media_take_1',
    title: 'Car Vlog · Traffic Hook',
    category: 'takes',
    durationMs: 6500,
    resolution: '1080p',
    aspect: '9:16',
    posterUrl: '/assets/take1.webp',
    accentColor: '#A3E635',
    speakerName: 'Vikram · Creator Coach',
    languageLabel: 'Hinglish',
    words: [
      { id: 't1w1', text: 'Pehle', textHi: 'पहले', textEn: 'In the first', startMs: 300, endMs: 800, aiTier: 0 },
      { id: 't1w2', text: 'teen', textHi: 'तीन', textEn: 'three', startMs: 800, endMs: 1300, aiTier: 2 },
      { id: 't1w3', text: 'second', textHi: 'सेकंड', textEn: 'seconds,', startMs: 1300, endMs: 1900, aiTier: 2 },
      { id: 't1w4', text: 'mein', textHi: 'में', textEn: 'people', startMs: 1900, endMs: 2300, aiTier: 0 },
      { id: 't1w5', text: 'log', textHi: 'लोग', textEn: 'decide', startMs: 2300, endMs: 2800, aiTier: 0 },
      { id: 't1w6', text: 'rukenge', textHi: 'रुकेंगे', textEn: 'to stay', startMs: 2800, endMs: 3600, aiTier: 2 },
      { id: 't1w7', text: 'ya', textHi: 'या', textEn: 'or', startMs: 3600, endMs: 4000, aiTier: 0 },
      { id: 't1w8', text: 'scroll.', textHi: 'स्क्रॉल।', textEn: 'scroll.', startMs: 4000, endMs: 4900, aiTier: 1 },
    ],
  },
  {
    id: 'media_take_2',
    title: 'Tech Breakdown · AI Stack',
    category: 'takes',
    durationMs: 6400,
    resolution: '4K',
    aspect: '9:16',
    posterUrl: '/assets/take2.webp',
    accentColor: '#38BDF8',
    speakerName: 'Kabir · Tech Reviewer',
    languageLabel: 'English + Hindi',
    words: INITIAL_TERRACE_WORDS,
  },
  {
    id: 'media_take_3',
    title: 'Property Tour · Worli Sea Face',
    category: 'property',
    durationMs: 7000,
    resolution: '4K',
    aspect: '9:16',
    posterUrl: '/assets/take3.webp',
    accentColor: '#F59E0B',
    speakerName: 'Meera · Luxury Estates',
    languageLabel: 'English · Property',
    words: [
      { id: 'pw1', text: '4,200', textHi: '4,200', textEn: '4,200', startMs: 300, endMs: 900, aiTier: 2 },
      { id: 'pw2', text: 'Sq.Ft.', textHi: 'वर्ग फुट', textEn: 'Sq.Ft.', startMs: 900, endMs: 1500, aiTier: 2 },
      { id: 'pw3', text: 'Sky', textHi: 'स्काई', textEn: 'Sky', startMs: 1500, endMs: 2000, aiTier: 0 },
      { id: 'pw4', text: 'Villa', textHi: 'विला', textEn: 'Villa', startMs: 2000, endMs: 2600, aiTier: 2 },
      { id: 'pw5', text: 'at', textHi: 'में', textEn: 'at', startMs: 2600, endMs: 3000, aiTier: 0 },
      { id: 'pw6', text: '₹18.5 Cr', textHi: '₹18.5 करोड़', textEn: '₹18.5 Cr', startMs: 3000, endMs: 4200, aiTier: 2 },
      { id: 'pw7', text: 'Worli', textHi: 'वरली', textEn: 'Worli', startMs: 4200, endMs: 4900, aiTier: 1 },
      { id: 'pw8', text: 'Mumbai.', textHi: 'मुंबई।', textEn: 'Mumbai.', startMs: 4900, endMs: 5800, aiTier: 2 },
    ],
  },
  {
    id: 'media_take_4',
    title: 'Startup Story · D2C Growth',
    category: 'broll',
    durationMs: 6500,
    resolution: '1080p',
    aspect: '9:16',
    posterUrl: '/assets/take4.webp',
    accentColor: '#EC4899',
    speakerName: 'Riya · Founder D2C',
    languageLabel: 'Hinglish',
    words: INITIAL_TERRACE_WORDS,
  },
  {
    id: 'media_take_5',
    title: 'Podcast Clip · Creator Economy',
    category: 'broll',
    durationMs: 6900,
    resolution: '4K',
    aspect: '9:16',
    posterUrl: '/assets/take5.webp',
    accentColor: '#A855F7',
    speakerName: 'Dev · Studio Podcast',
    languageLabel: 'Hindi · देवनागरी',
    words: INITIAL_TERRACE_WORDS,
  },
  {
    id: 'media_take_6',
    title: 'Finance Reel · SIP vs Lump Sum',
    category: 'broll',
    durationMs: 6700,
    resolution: '1080p',
    aspect: '9:16',
    posterUrl: '/assets/take6.webp',
    accentColor: '#10B981',
    speakerName: 'Nikhil · FinTech',
    languageLabel: 'Hinglish',
    words: INITIAL_TERRACE_WORDS,
  },
];

// Complete Dynamic Text & Clip Animations extracted from 0uel7f._b_hrx.js
export interface AnimationPreset {
  id: string;
  name: string;
  type: 'in' | 'out' | 'loop' | 'combo';
  defaultMs: number;
  badge?: string;
}

export const ANIM_IN: AnimationPreset[] = [
  { id: 'fade_in', name: 'Fade in', type: 'in', defaultMs: 400 },
  { id: 'fade_up_in', name: 'Fade up', type: 'in', defaultMs: 450, badge: 'Popular' },
  { id: 'pop_in', name: 'Pop', type: 'in', defaultMs: 350, badge: 'Popular' },
  { id: 'bounce_in', name: 'Bounce', type: 'in', defaultMs: 500 },
  { id: 'spring_in', name: 'Spring', type: 'in', defaultMs: 480, badge: 'Popular' },
  { id: 'thump_in', name: 'Thump', type: 'in', defaultMs: 380 },
  { id: 'slide_bounce_in', name: 'Slide bounce', type: 'in', defaultMs: 520 },
  { id: 'zoom_in', name: 'Zoom in', type: 'in', defaultMs: 400 },
  { id: 'zoom_out_in', name: 'Zoom out', type: 'in', defaultMs: 400 },
  { id: 'blur_in', name: 'Blur in', type: 'in', defaultMs: 450 },
  { id: 'focus_in', name: 'Focus', type: 'in', defaultMs: 500 },
  { id: 'rotate_in', name: 'Rotate', type: 'in', defaultMs: 450 },
  { id: 'spin_in', name: 'Spin', type: 'in', defaultMs: 500 },
  { id: 'whirl_in', name: 'Whirl', type: 'in', defaultMs: 520 },
  { id: 'zoom_spin_in', name: 'Zoom spin', type: 'in', defaultMs: 550 },
  { id: 'swing_in', name: 'Swing', type: 'in', defaultMs: 500 },
  { id: 'drop_in', name: 'Drop', type: 'in', defaultMs: 420 },
  { id: 'tumble_in', name: 'Tumble', type: 'in', defaultMs: 520 },
  { id: 'rise_in', name: 'Rise', type: 'in', defaultMs: 450 },
  { id: 'sink_in', name: 'Sink', type: 'in', defaultMs: 450 },
  { id: 'push_in', name: 'Push in', type: 'in', defaultMs: 400 },
  { id: 'pull_in', name: 'Pull in', type: 'in', defaultMs: 400 },
  { id: 'flip_in', name: 'Flip', type: 'in', defaultMs: 480 },
  { id: 'flip_up_in', name: 'Flip up', type: 'in', defaultMs: 480 },
  { id: 'card_in', name: 'Card', type: 'in', defaultMs: 500 },
  { id: 'hinge_in', name: 'Hinge', type: 'in', defaultMs: 550 },
  { id: 'unfold_in', name: 'Unfold', type: 'in', defaultMs: 500 },
  { id: 'corner_in', name: 'From the corner', type: 'in', defaultMs: 480 },
  { id: 'roll_in', name: 'Roll', type: 'in', defaultMs: 500 },
  { id: 'shake_in', name: 'Shake', type: 'in', defaultMs: 450 },
  { id: 'crisscross_in', name: 'Crisscross', type: 'in', defaultMs: 500 },
  { id: 'wiggle_in', name: 'Wiggle', type: 'in', defaultMs: 480 },
  { id: 'dizzy_in', name: 'Dizzy', type: 'in', defaultMs: 520 },
  { id: 'stretch_in', name: 'Stretch', type: 'in', defaultMs: 450 },
  { id: 'squash_in', name: 'Squash', type: 'in', defaultMs: 450 },
  { id: 'tv_on', name: 'TV on', type: 'in', defaultMs: 420 },
  { id: 'flash_in', name: 'Flash', type: 'in', defaultMs: 350 },
  { id: 'stutter_in', name: 'Stutter', type: 'in', defaultMs: 450 },
  { id: 'glitch_in', name: 'Glitch', type: 'in', defaultMs: 420, badge: 'Popular' },
  { id: 'pixel_in', name: 'Pixelate', type: 'in', defaultMs: 480 },
  { id: 'ripple_in', name: 'Ripple', type: 'in', defaultMs: 500 },
  { id: 'iris_in', name: 'Circle', type: 'in', defaultMs: 480 },
  { id: 'open_in', name: 'Open', type: 'in', defaultMs: 450 },
];

export const ANIM_OUT: AnimationPreset[] = [
  { id: 'fade_out', name: 'Fade out', type: 'out', defaultMs: 400 },
  { id: 'fade_down_out', name: 'Fade down', type: 'out', defaultMs: 450 },
  { id: 'zoom_out', name: 'Zoom out', type: 'out', defaultMs: 400 },
  { id: 'zoom_in_out', name: 'Zoom in', type: 'out', defaultMs: 400 },
  { id: 'shrink_out', name: 'Shrink', type: 'out', defaultMs: 380 },
  { id: 'bounce_out', name: 'Bounce', type: 'out', defaultMs: 480 },
  { id: 'blur_out', name: 'Blur out', type: 'out', defaultMs: 450 },
  { id: 'focus_out', name: 'Lose focus', type: 'out', defaultMs: 450 },
  { id: 'rotate_out', name: 'Rotate', type: 'out', defaultMs: 450 },
  { id: 'spin_out', name: 'Spin', type: 'out', defaultMs: 500 },
  { id: 'whirl_out', name: 'Whirl', type: 'out', defaultMs: 520 },
  { id: 'zoom_spin_out', name: 'Zoom spin', type: 'out', defaultMs: 520 },
  { id: 'black_hole', name: 'Black hole', type: 'out', defaultMs: 550 },
  { id: 'anticipate_out', name: 'Pull back', type: 'out', defaultMs: 450 },
  { id: 'swing_out', name: 'Swing', type: 'out', defaultMs: 480 },
  { id: 'fall_out', name: 'Fall', type: 'out', defaultMs: 450 },
  { id: 'fly_away', name: 'Fly away', type: 'out', defaultMs: 480 },
  { id: 'rise_out', name: 'Rise', type: 'out', defaultMs: 450 },
  { id: 'sink_out', name: 'Sink', type: 'out', defaultMs: 450 },
  { id: 'push_out', name: 'Push out', type: 'out', defaultMs: 420 },
  { id: 'pull_out', name: 'Pull out', type: 'out', defaultMs: 420 },
  { id: 'flip_out', name: 'Flip', type: 'out', defaultMs: 480 },
  { id: 'flip_down_out', name: 'Flip down', type: 'out', defaultMs: 480 },
  { id: 'card_out', name: 'Card', type: 'out', defaultMs: 480 },
  { id: 'hinge_out', name: 'Hinge', type: 'out', defaultMs: 520 },
  { id: 'fold_out', name: 'Fold', type: 'out', defaultMs: 480 },
  { id: 'corner_out', name: 'Into the corner', type: 'out', defaultMs: 480 },
  { id: 'roll_out', name: 'Roll', type: 'out', defaultMs: 480 },
  { id: 'shake_out', name: 'Shake', type: 'out', defaultMs: 450 },
  { id: 'crisscross_out', name: 'Crisscross', type: 'out', defaultMs: 480 },
  { id: 'wiggle_out', name: 'Wiggle', type: 'out', defaultMs: 480 },
  { id: 'dizzy_out', name: 'Dizzy', type: 'out', defaultMs: 500 },
  { id: 'stretch_out', name: 'Stretch', type: 'out', defaultMs: 450 },
  { id: 'squash_out', name: 'Squash', type: 'out', defaultMs: 450 },
  { id: 'tv_off', name: 'TV off', type: 'out', defaultMs: 420 },
  { id: 'flash_out', name: 'Flash', type: 'out', defaultMs: 350 },
  { id: 'stutter_out', name: 'Stutter', type: 'out', defaultMs: 450 },
  { id: 'glitch_out', name: 'Glitch', type: 'out', defaultMs: 420 },
  { id: 'pixel_out', name: 'Pixelate', type: 'out', defaultMs: 480 },
  { id: 'ripple_out', name: 'Ripple', type: 'out', defaultMs: 480 },
  { id: 'smoke_out', name: 'Smoke', type: 'out', defaultMs: 520 },
  { id: 'iris_out', name: 'Circle', type: 'out', defaultMs: 480 },
  { id: 'close_out', name: 'Close', type: 'out', defaultMs: 450 },
];

export const ANIM_LOOP: AnimationPreset[] = [
  { id: 'pulse', name: 'Pulse', type: 'loop', defaultMs: 1200, badge: 'Popular' },
  { id: 'float', name: 'Float', type: 'loop', defaultMs: 2000, badge: 'Popular' },
  { id: 'glow', name: 'Glow', type: 'loop', defaultMs: 1600, badge: 'Popular' },
  { id: 'wave', name: 'Wave', type: 'loop', defaultMs: 1500 },
  { id: 'sway', name: 'Sway', type: 'loop', defaultMs: 1800 },
  { id: 'shake', name: 'Shake', type: 'loop', defaultMs: 800 },
  { id: 'spin', name: 'Spin', type: 'loop', defaultMs: 2400 },
  { id: 'flicker', name: 'Flicker', type: 'loop', defaultMs: 900 },
  { id: 'zoom_breathe', name: 'Breathe', type: 'loop', defaultMs: 2200 },
  { id: 'bounce', name: 'Bounce', type: 'loop', defaultMs: 1100 },
  { id: 'jiggle', name: 'Jiggle', type: 'loop', defaultMs: 900 },
  { id: 'wiggle', name: 'Wiggle', type: 'loop', defaultMs: 1000 },
  { id: 'swing', name: 'Swing', type: 'loop', defaultMs: 1600 },
  { id: 'heartbeat', name: 'Heartbeat', type: 'loop', defaultMs: 1100 },
  { id: 'tilt_3d', name: '3D tilt', type: 'loop', defaultMs: 1800 },
  { id: 'flip', name: 'Flip', type: 'loop', defaultMs: 2000 },
  { id: 'rubber', name: 'Rubber', type: 'loop', defaultMs: 1200 },
  { id: 'blink', name: 'Blink', type: 'loop', defaultMs: 800 },
  { id: 'rgb', name: 'Colour split', type: 'loop', defaultMs: 950 },
  { id: 'tada', name: 'Tada', type: 'loop', defaultMs: 1300 },
  { id: 'drift', name: 'Drift', type: 'loop', defaultMs: 2400 },
  { id: 'pendulum', name: 'Pendulum', type: 'loop', defaultMs: 1800 },
];

export const ANIM_COMBO: AnimationPreset[] = [
  { id: 'pop_rest', name: 'Pop and settle', type: 'combo', defaultMs: 1500, badge: 'Popular' },
  { id: 'zoom_pulse', name: 'Zoom in and out', type: 'combo', defaultMs: 1800, badge: 'Popular' },
  { id: 'flash_zoom', name: 'Flash punches', type: 'combo', defaultMs: 1400 },
  { id: 'glitch_bursts', name: 'Glitch bursts', type: 'combo', defaultMs: 1200 },
  { id: 'ken_in', name: 'Slow push', type: 'combo', defaultMs: 2400 },
  { id: 'ken_out', name: 'Slow pull', type: 'combo', defaultMs: 2400 },
  { id: 'drift', name: 'Drift', type: 'combo', defaultMs: 2200 },
  { id: 'shake_dynamic', name: 'Dynamic shake', type: 'combo', defaultMs: 1200 },
  { id: 'jitter', name: 'Jitter', type: 'combo', defaultMs: 1000 },
  { id: 'wobble', name: 'Wobble', type: 'combo', defaultMs: 1400 },
  { id: 'sway', name: 'Sway', type: 'combo', defaultMs: 1800 },
  { id: 'pendulum', name: 'Pendulum', type: 'combo', defaultMs: 1800 },
  { id: 'pirate_ship', name: 'Pirate ship', type: 'combo', defaultMs: 2000 },
  { id: 'bounce', name: 'Bounce', type: 'combo', defaultMs: 1400 },
  { id: 'breathe', name: 'Breathe', type: 'combo', defaultMs: 2200 },
  { id: 'heartbeat', name: 'Heartbeat', type: 'combo', defaultMs: 1200 },
  { id: 'rock_3d', name: '3D rock', type: 'combo', defaultMs: 1800 },
  { id: 'card_3d', name: '3D card', type: 'combo', defaultMs: 1800 },
  { id: 'swing_3d', name: 'Door swing', type: 'combo', defaultMs: 1800 },
  { id: 'spin', name: 'Spin', type: 'combo', defaultMs: 1600 },
  { id: 'zoom_spin', name: 'Zoom and turn', type: 'combo', defaultMs: 1600 },
  { id: 'spinning_top', name: 'Spinning top', type: 'combo', defaultMs: 1800 },
  { id: 'yoyo', name: 'Yoyo', type: 'combo', defaultMs: 1500 },
  { id: 'roller_coaster', name: 'Roller coaster', type: 'combo', defaultMs: 2000 },
  { id: 'falling', name: 'Falling', type: 'combo', defaultMs: 1600 },
  { id: 'stretch', name: 'Stretch', type: 'combo', defaultMs: 1400 },
  { id: 'funhouse', name: 'Funhouse', type: 'combo', defaultMs: 1800 },
  { id: 'tilt_left', name: 'Tilt left', type: 'combo', defaultMs: 1500 },
  { id: 'tilt_right', name: 'Tilt right', type: 'combo', defaultMs: 1500 },
  { id: 'orbit', name: 'Orbit', type: 'combo', defaultMs: 2000 },
];

export const BOLD_TEXT_PRESETS = [
  { id: 'poster', name: 'Poster', sample: 'BIG HOOK', bg: '#F59E0B', color: '#000000', font: "'Anton', sans-serif" },
  { id: 'b01', name: 'Slam', sample: 'SLAM IN', bg: '#EF4444', color: '#FFFFFF', font: "'ClashDisplay', sans-serif" },
  { id: 'b02', name: 'Tape', sample: 'TAPE LABEL', bg: '#FDE047', color: '#18181B', font: "'Caveat', cursive" },
  { id: 'b03', name: 'Highlighter', sample: 'KEY POINT', bg: '#10B981', color: '#052E16', font: "'Plus Jakarta Sans', sans-serif" },
  { id: 'b04', name: 'Stack Slide', sample: '3X GROWTH', bg: '#1E293B', color: '#38BDF8', font: "'Oswald', sans-serif" },
  { id: 'b05', name: 'Outline', sample: 'OUTLINE', bg: 'transparent', color: '#FFFFFF', font: "'Anton', sans-serif" },
  { id: 'b06', name: 'Sticker', sample: 'WATCH THIS', bg: '#FFFFFF', color: '#111827', font: "'Bricolage Grotesque', sans-serif" },
  { id: 'b07', name: 'Terminal', sample: '01_DEPLOY', bg: '#09090B', color: '#22C55E', font: "'JetBrains Mono', monospace" },
  { id: 'b08', name: 'Letter Drop', sample: 'REVEAL', bg: '#311042', color: '#F472B6', font: "'ClashDisplay', sans-serif" },
  { id: 'b09', name: 'Cover Line', sample: 'EDITORIAL', bg: '#1C1917', color: '#FDE68A', font: "'Playfair Display', serif" },
  { id: 'b10', name: 'Burst', sample: 'VIRAL TAKE', bg: '#7C2D12', color: '#FDBA74', font: "'Anton', sans-serif" },
];

// Graphic & Motion Elements Catalogue across all 16 categories
export interface GraphicElementTemplate {
  id: string;
  name: string;
  category: string;
  subCategory: string;
  badgeText: string;
  defaultTitle: string;
  defaultSubtitle: string;
  accentColor: string;
  description: string;
}

export const GRAPHIC_CATEGORIES = [
  { id: 'all', label: 'All Elements' },
  { id: 'text', label: 'Text & Titles' },
  { id: 'numbers', label: 'Numbers & Stats' },
  { id: 'lists', label: 'Lists & Steps' },
  { id: 'charts', label: 'Charts & Data' },
  { id: 'money', label: 'Money & Business' },
  { id: 'social', label: 'Social Media' },
  { id: 'notify', label: 'Notifications & Chat' },
  { id: 'devices', label: 'Screens & Devices' },
  { id: 'cta', label: 'Buttons & CTA' },
  { id: 'quotes', label: 'Quotes & Reviews' },
  { id: 'compare', label: 'Comparisons' },
  { id: 'time', label: 'Dates & Timelines' },
  { id: 'places', label: 'Maps & Travel' },
  { id: 'brand', label: 'Logos & Intros' },
  { id: 'decor', label: 'Stickers & Decor' },
];

export const GRAPHIC_ELEMENTS: GraphicElementTemplate[] = [
  {
    id: 'el_hook_banner',
    name: 'Hook Banner Slam',
    category: 'text',
    subCategory: 'Hooks & Headlines',
    badgeText: 'STOP SCROLLING',
    defaultTitle: '3 Mistakes Killing Your Reels',
    defaultSubtitle: 'Creator Breakdown · Step 01',
    accentColor: '#F59E0B',
    description: 'High-retention hook card that slams in during the first 2 seconds.',
  },
  {
    id: 'el_lower_third',
    name: 'Creator Lower Third',
    category: 'text',
    subCategory: 'Lower Thirds & Name Tags',
    badgeText: '@ROHAN.CREATES',
    defaultTitle: 'Rohan Sharma',
    defaultSubtitle: 'Founder & Video Strategist',
    accentColor: '#10B981',
    description: 'Clean glassmorphic speaker identification tag with verified badge.',
  },
  {
    id: 'el_stat_counter',
    name: 'Live Revenue Counter',
    category: 'numbers',
    subCategory: 'Counters & Tickers',
    badgeText: '+284% YoY',
    defaultTitle: '₹14.8 Lakhs / mo',
    defaultSubtitle: 'Organic Short-Form Inbound',
    accentColor: '#22C55E',
    description: 'Animated tabular number ticker that rolls up as the figure is spoken.',
  },
  {
    id: 'el_score_gauge',
    name: 'Retention Gauge Meter',
    category: 'numbers',
    subCategory: 'Percentages & Gauges',
    badgeText: 'RETENTION',
    defaultTitle: '88% Watched Full Reel',
    defaultSubtitle: 'Top 1% Creator Benchmark',
    accentColor: '#38BDF8',
    description: 'Swinging gauge needle with color-coded zone indicator.',
  },
  {
    id: 'el_step_checklist',
    name: '3-Step Action Checklist',
    category: 'lists',
    subCategory: 'Checklists & Habits',
    badgeText: 'WORKFLOW',
    defaultTitle: '1. Drop Take · 2. Pick Style · 3. Export 4K',
    defaultSubtitle: 'Under 60 Seconds',
    accentColor: '#FBBF24',
    description: 'Checklist items that check off one by one on spoken beats.',
  },
  {
    id: 'el_tier_list',
    name: 'S-Tier Ranking Board',
    category: 'lists',
    subCategory: 'Rankings & Top Picks',
    badgeText: 'S-TIER',
    defaultTitle: 'Behind-You Cutout Captions',
    defaultSubtitle: 'Ranked #1 for Watch Time',
    accentColor: '#F43F5E',
    description: 'Tier list card whose items slam into S/A/B tiers as ranked.',
  },
  {
    id: 'el_growth_chart',
    name: 'Exponential Growth Curve',
    category: 'charts',
    subCategory: 'Lines & Growth',
    badgeText: 'ANALYTICS',
    defaultTitle: '2.5L+ Creators Signed Up',
    defaultSubtitle: 'Last 30 Days Trajectory',
    accentColor: '#10B981',
    description: 'Animated SVG sparkline and bar chart overlay.',
  },
  {
    id: 'el_upi_payment',
    name: 'UPI Instant Receipt Card',
    category: 'money',
    subCategory: 'Cards & Payments',
    badgeText: 'UPI VERIFIED',
    defaultTitle: '₹20 · Clean 4K Export',
    defaultSubtitle: 'Paid via UPI in 2 Seconds',
    accentColor: '#22C55E',
    description: 'Authentic Indian UPI payment confirmation badge with checkmark.',
  },
  {
    id: 'el_social_comment',
    name: 'Pinned Reel Comment',
    category: 'social',
    subCategory: 'Likes, Comments & Followers',
    badgeText: 'PINNED COMMENT',
    defaultTitle: '“Kaunsa caption app use karte ho bhai? 🔥”',
    defaultSubtitle: '4,820 likes · Reply with reel',
    accentColor: '#EC4899',
    description: 'Floating Instagram/YouTube comment bubble for Q&A hooks.',
  },
  {
    id: 'el_push_toast',
    name: 'iOS Notification Banner',
    category: 'notify',
    subCategory: 'Alerts & Toasts',
    badgeText: 'NOW',
    defaultTitle: 'Export Complete · 4K 60fps',
    defaultSubtitle: 'Ready to post on Reels & Shorts',
    accentColor: '#38BDF8',
    description: 'Frosted notification banner that slides down with a ding.',
  },
  {
    id: 'el_code_terminal',
    name: 'Code & Terminal Frame',
    category: 'devices',
    subCategory: 'Code & Terminals',
    badgeText: 'SARVAM-STT',
    defaultTitle: 'transcribe("terrace_reel.mp4", { lang: "hinglish" })',
    defaultSubtitle: '99.4% syllable accuracy in 18s',
    accentColor: '#A855F7',
    description: 'MacOS dark terminal window with live syntax-highlighted code.',
  },
  {
    id: 'el_cta_subscribe',
    name: 'Follow & Save Reel Pill',
    category: 'cta',
    subCategory: 'Subscribe & Follow',
    badgeText: 'SAVE FOR LATER',
    defaultTitle: 'Follow @captik.in for Daily Edits',
    defaultSubtitle: 'Tap bookmark icon below',
    accentColor: '#F59E0B',
    description: 'Animated call-to-action pill with pointer click bounce.',
  },
  {
    id: 'el_quote_review',
    name: '5-Star Creator Review',
    category: 'quotes',
    subCategory: 'Reviews & Ratings',
    badgeText: '★★★★★ 4.9/5',
    defaultTitle: '“Finally gets Hinglish right on the first take.”',
    defaultSubtitle: 'Trusted by 2.5L+ Indian Creators',
    accentColor: '#FBBF24',
    description: 'Editorial pull-quote card with star rating header.',
  },
  {
    id: 'el_before_after',
    name: 'Raw vs AI Edit Tag',
    category: 'compare',
    subCategory: 'Before & After',
    badgeText: 'COMPARE',
    defaultTitle: 'Raw Take → AI Edit · Voltage',
    defaultSubtitle: 'Auto Pauses Cut + B-Roll + SFX',
    accentColor: '#10B981',
    description: 'Side-by-side comparison badge for transformation reels.',
  },
  {
    id: 'el_countdown_timer',
    name: '60s Speed Timer',
    category: 'time',
    subCategory: 'Clocks & Timers',
    badgeText: 'STOPWATCH',
    defaultTitle: '00:58.42',
    defaultSubtitle: 'Full Reel Edited Under 1 Minute',
    accentColor: '#EF4444',
    description: 'High-contrast digital stopwatch overlay.',
  },
  {
    id: 'el_location_pin',
    name: 'Mumbai Location Drop',
    category: 'places',
    subCategory: 'Maps & Pins',
    badgeText: 'LOCATION',
    defaultTitle: 'Bandra West, Mumbai',
    defaultSubtitle: '19.0596° N, 72.8295° E',
    accentColor: '#38BDF8',
    description: 'Radar pulse map pin with coordinates.',
  },
  {
    id: 'el_brand_watermark',
    name: 'Creator Handle Stamp',
    category: 'brand',
    subCategory: 'Logo Reveals',
    badgeText: 'ORIGINAL',
    defaultTitle: 'CAPTIK STUDIO · 4K',
    defaultSubtitle: 'captik.in/editor',
    accentColor: '#F59E0B',
    description: 'Minimalist corner brand watermark.',
  },
  {
    id: 'el_doodle_arrow',
    name: 'Hand-Drawn Neon Arrow',
    category: 'decor',
    subCategory: 'Arrows & Doodles',
    badgeText: 'LOOK HERE',
    defaultTitle: '↗ Watch the Cutout Behind Head',
    defaultSubtitle: 'Automatic AI Depth Matte',
    accentColor: '#A3E635',
    description: 'Animated hand-drawn pointer arrow & emphasis ring.',
  },
];

// SFX Groups & Library (from 09qa77ulr4q02.js & 15i4pembqvw0h.js)
export interface SfxGroup {
  key: string;
  label: string;
}

export interface SfxSoundItem {
  id: string;
  label: string;
  group: string;
  durationSec: number;
  tags: string;
}

export const SFX_GROUPS: SfxGroup[] = [
  { key: 'all', label: 'All 277 Sounds' },
  { key: 'motion', label: 'Whooshes & Transitions' },
  { key: 'impact', label: 'Impacts & Booms' },
  { key: 'ui', label: 'Clicks & Pops' },
  { key: 'alert', label: 'Dings & Alerts' },
  { key: 'viral', label: 'Viral & Meme' },
  { key: 'rise', label: 'Risers & Tension' },
  { key: 'money', label: 'Money & Counters' },
  { key: 'digital', label: 'Digital & Glitch' },
  { key: 'everyday', label: 'Everyday' },
  { key: 'music', label: 'Music & Loops' },
];

export const SFX_LIBRARY: SfxSoundItem[] = [
  // Whooshes & Transitions
  { id: 'fast_air_whoosh', label: 'Fast Whoosh', group: 'motion', durationSec: 0.45, tags: 'whoosh fast cut transition air' },
  { id: 'cinematic_swoosh', label: 'Cinematic Swoosh', group: 'motion', durationSec: 0.65, tags: 'cinematic wind swoosh transition' },
  { id: 'arrow_whoosh', label: 'Arrow Whoosh', group: 'motion', durationSec: 0.35, tags: 'arrow fast movement swipe' },
  { id: 'cinematic_whoosh', label: 'Deep Whoosh', group: 'motion', durationSec: 0.8, tags: 'deep bass whoosh sweep' },
  { id: 'whip_pan', label: 'Whip Pan Swish', group: 'motion', durationSec: 0.3, tags: 'whip camera pan zoom' },
  { id: 'energy_blast', label: 'Energy Blast', group: 'motion', durationSec: 0.7, tags: 'energy power whoosh magic' },
  // Impacts & Booms
  { id: 'bass_drop', label: 'Bass Drop', group: 'impact', durationSec: 1.4, tags: 'bass drop sub boom hit hook' },
  { id: 'cinematic_thud', label: 'Cinematic Thud', group: 'impact', durationSec: 0.9, tags: 'thud slam punch title hit' },
  { id: 'sub_hit', label: 'Sub Boom Hit', group: 'impact', durationSec: 1.1, tags: 'sub low impact dramatic' },
  { id: 'slam_impact', label: 'Heavy Text Slam', group: 'impact', durationSec: 0.6, tags: 'slam text reveal stomp' },
  // Clicks & Pops
  { id: 'bubble_pop', label: 'Bubble Pop', group: 'ui', durationSec: 0.25, tags: 'bubble pop clean sticker tap' },
  { id: 'mouse_click', label: 'Crisp UI Click', group: 'ui', durationSec: 0.18, tags: 'click button mouse tap' },
  { id: 'finger_snap', label: 'Studio Finger Snap', group: 'ui', durationSec: 0.3, tags: 'snap rhythm cut' },
  { id: 'switch_toggle', label: 'Mechanical Toggle', group: 'ui', durationSec: 0.22, tags: 'switch toggle ui' },
  // Dings & Alerts
  { id: 'notification_ding', label: 'iOS Glass Ding', group: 'alert', durationSec: 0.55, tags: 'ding notification bell message' },
  { id: 'correct_chime', label: 'Success Chime', group: 'alert', durationSec: 0.65, tags: 'success check green correct' },
  { id: 'wrong_buzzer', label: 'Error Buzzer', group: 'alert', durationSec: 0.6, tags: 'wrong error buzzer mistake' },
  // Viral & Meme
  { id: 'crowd_gasp', label: 'Crowd Gasp', group: 'viral', durationSec: 1.2, tags: 'crowd gasp shock reaction viral' },
  { id: 'vine_boom', label: 'Dramatic Boom', group: 'viral', durationSec: 0.95, tags: 'vine boom meme shock zoom' },
  { id: 'record_scratch', label: 'Record Scratch', group: 'viral', durationSec: 0.5, tags: 'record scratch freeze frame wait' },
  { id: 'anime_shine', label: 'Sparkle Shine', group: 'viral', durationSec: 0.7, tags: 'anime glint sparkle glow' },
  // Risers & Tension
  { id: 'cinematic_riser', label: 'Cinematic Riser', group: 'rise', durationSec: 1.8, tags: 'riser build tension drop' },
  { id: 'whoosh_riser', label: 'Short Suck-In Riser', group: 'rise', durationSec: 0.85, tags: 'reverse whoosh riser' },
  { id: 'heartbeat_tension', label: 'Tension Heartbeat', group: 'rise', durationSec: 1.5, tags: 'heartbeat pulse suspense' },
  // Money & Counters
  { id: 'cash_register', label: 'Cash Register Cha-Ching', group: 'money', durationSec: 0.8, tags: 'cash register money rupee sale' },
  { id: 'coin_drop', label: 'Gold Coin Clink', group: 'money', durationSec: 0.5, tags: 'coin clink payment upi' },
  { id: 'counter_roll', label: 'Number Ticker Roll', group: 'money', durationSec: 1.0, tags: 'counter roll stat numbers' },
  // Digital & Glitch
  { id: 'digital_glitch', label: 'Digital Glitch Burst', group: 'digital', durationSec: 0.45, tags: 'glitch digital cyber RGB' },
  { id: 'futuristic_beep', label: 'HUD Telemetry Beep', group: 'digital', durationSec: 0.35, tags: 'beep sci-fi data' },
  { id: 'laser_shot', label: 'Laser Cut Zaps', group: 'digital', durationSec: 0.4, tags: 'laser zap synth' },
  { id: 'tape_rewind', label: 'VHS Tape Rewind', group: 'digital', durationSec: 0.9, tags: 'rewind tape flashback' },
  // Everyday
  { id: 'camera_shutter', label: 'Camera Shutter', group: 'everyday', durationSec: 0.4, tags: 'camera shutter photo flash snapshot' },
  { id: 'typewriter_burst', label: 'Typewriter Clack Burst', group: 'everyday', durationSec: 0.75, tags: 'typewriter keys text kinetic' },
  { id: 'paper_crumple', label: 'Paper Rip & Slide', group: 'everyday', durationSec: 0.6, tags: 'paper scrapbook parcel' },
  { id: 'pencil_writing', label: 'Marker Highlighting', group: 'everyday', durationSec: 0.65, tags: 'marker scribble underline jotter' },
  { id: 'clock_ticking', label: 'Stopwatch Ticking', group: 'everyday', durationSec: 1.2, tags: 'clock tick timer deadline' },
  // Music & Loops
  { id: 'podcast_background_music', label: 'Lo-Fi Creator Underscore', group: 'music', durationSec: 4.0, tags: 'music lofi background voice ducking' },
  { id: 'upbeat_funk_loop', label: 'Upbeat Reels Groove', group: 'music', durationSec: 4.0, tags: 'funk groove upbeat energy' },
  { id: 'trap_beat', label: 'Hype 808 Beat Loop', group: 'music', durationSec: 4.0, tags: 'trap beat 808 bass hype' },
  { id: 'night_synth_groove', label: 'Midnight Synthwave', group: 'music', durationSec: 4.0, tags: 'synth night tech aesthetic' },
];

// Real Web Audio API Sound Effects Synthesizer so every button click & timeline event plays real audio
let sharedAudioCtx: AudioContext | null = null;

export function playSfxSound(sfxId: string, volume = 0.35): void {
  if (typeof window === 'undefined') return;
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    if (!sharedAudioCtx) sharedAudioCtx = new Ctx();
    const ctx = sharedAudioCtx;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(Math.max(0.05, Math.min(1, volume)), now);
    master.connect(ctx.destination);

    if (sfxId.includes('whoosh') || sfxId.includes('swoosh') || sfxId.includes('whip') || sfxId.includes('riser')) {
      // Filtered noise sweep
      const bufferSize = ctx.sampleRate * 0.45;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(220, now);
      filter.frequency.exponentialRampToValueAtTime(2400, now + 0.22);
      filter.frequency.exponentialRampToValueAtTime(300, now + 0.42);
      filter.Q.setValueAtTime(2.5, now);

      const env = ctx.createGain();
      env.gain.setValueAtTime(0.01, now);
      env.gain.linearRampToValueAtTime(0.8, now + 0.16);
      env.gain.exponentialRampToValueAtTime(0.01, now + 0.44);

      noise.connect(filter);
      filter.connect(env);
      env.connect(master);
      noise.start(now);
      noise.stop(now + 0.45);
      return;
    }

    if (sfxId.includes('bass') || sfxId.includes('boom') || sfxId.includes('thud') || sfxId.includes('slam') || sfxId.includes('sub')) {
      // Sub-bass sine drop
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(36, now + 0.65);
      env.gain.setValueAtTime(0.95, now);
      env.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
      osc.connect(env);
      env.connect(master);
      osc.start(now);
      osc.stop(now + 0.72);
      return;
    }

    if (sfxId.includes('cash') || sfxId.includes('coin') || sfxId.includes('ding') || sfxId.includes('chime') || sfxId.includes('shine')) {
      // Two-tone metallic bell cha-ching
      [1318.5, 1760].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        env.gain.setValueAtTime(0.6, now + idx * 0.08);
        env.gain.exponentialRampToValueAtTime(0.008, now + idx * 0.08 + 0.45);
        osc.connect(env);
        env.connect(master);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.46);
      });
      return;
    }

    if (sfxId.includes('shutter') || sfxId.includes('typewriter') || sfxId.includes('click') || sfxId.includes('snap')) {
      // Crisp double mechanical transient
      [0, 0.055].forEach((offset) => {
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(900, now + offset);
        osc.frequency.exponentialRampToValueAtTime(180, now + offset + 0.04);
        env.gain.setValueAtTime(0.55, now + offset);
        env.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.045);
        osc.connect(env);
        env.connect(master);
        osc.start(now + offset);
        osc.stop(now + offset + 0.05);
      });
      return;
    }

    // Default bubble pop / pitch chirp
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(980, now + 0.12);
    env.gain.setValueAtTime(0.65, now);
    env.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc.connect(env);
    env.connect(master);
    osc.start(now);
    osc.stop(now + 0.16);
  } catch {
    // Ignore audio context restrictions if not yet interacted
  }
}

// Color LUT Filters, Video Effects, Transitions, Speed Curves, and AI Tools
export const LUT_FILTERS = [
  { id: 'none', name: 'Original', category: 'Life', css: 'none' },
  { id: 'clear', name: 'Clear', category: 'Life', css: 'contrast(1.06) saturate(1.08) brightness(1.03)' },
  { id: 'vivid', name: 'Vivid', category: 'Life', css: 'saturate(1.32) contrast(1.08)' },
  { id: 'warm', name: 'Warm Terrace', category: 'Life', css: 'sepia(0.16) saturate(1.22) brightness(1.03)' },
  { id: 'glow_skin', name: 'Skin Glow', category: 'Portrait', css: 'brightness(1.06) contrast(0.96) saturate(1.1)' },
  { id: 'studio', name: 'Studio Crisp', category: 'Portrait', css: 'contrast(1.14) saturate(1.05) brightness(1.02)' },
  { id: 'golden', name: 'Golden Hour', category: 'Landscape', css: 'sepia(0.24) saturate(1.35) contrast(1.05)' },
  { id: 'teal_orange', name: 'Teal & Orange', category: 'Movies', css: 'contrast(1.18) saturate(1.25) hue-rotate(-6deg)' },
  { id: 'cinema', name: 'Cinema 35mm', category: 'Movies', css: 'contrast(1.15) saturate(0.88) sepia(0.08)' },
  { id: 'blockbuster', name: 'Blockbuster', category: 'Movies', css: 'contrast(1.22) saturate(1.15) brightness(0.98)' },
  { id: 'vintage', name: 'Vintage 70s', category: 'Retro', css: 'sepia(0.32) contrast(0.94) brightness(1.04)' },
  { id: 'noir', name: 'Noir B&W', category: 'Mono', css: 'grayscale(1) contrast(1.28) brightness(0.96)' },
  { id: 'night_neon', name: 'Neon Night', category: 'Night', css: 'saturate(1.4) contrast(1.16) hue-rotate(8deg)' },
  { id: 'dream', name: 'Dreamy Haze', category: 'Vibe', css: 'brightness(1.08) contrast(0.92) saturate(1.12)' },
  { id: 'dramatic', name: 'Dramatic Punch', category: 'Drama', css: 'contrast(1.26) saturate(0.92) brightness(0.95)' },
];

export const VIDEO_EFFECTS_LIST = [
  { id: 'none', name: 'None', category: 'Basic' },
  { id: 'zoom_lens', name: 'Zoom pulse', category: 'Basic' },
  { id: 'vignette', name: 'Vignette', category: 'Basic' },
  { id: 'letterbox', name: 'Cinema bars', category: 'Basic' },
  { id: 'handheld', name: 'Handheld motion', category: 'Motion' },
  { id: 'punch', name: 'Beat punch', category: 'Motion' },
  { id: 'light_leak', name: 'Light leak', category: 'Light' },
  { id: 'bokeh', name: 'Bokeh glow', category: 'Light' },
  { id: 'neon_glow', name: 'Neon edge', category: 'Light' },
  { id: 'vhs', name: 'VHS Retro', category: 'Retro' },
  { id: 'film_grain', name: '35mm Film grain', category: 'Retro' },
  { id: 'rgb_split', name: 'RGB Chromatic', category: 'Glitch' },
  { id: 'scan_glitch', name: 'Scan line', category: 'Glitch' },
  { id: 'viewfinder', name: 'REC Viewfinder', category: 'Frame' },
  { id: 'polaroid', name: 'Instant Frame', category: 'Frame' },
  { id: 'tilt_shift', name: 'Tilt shift lens', category: 'Lens' },
];

export const SPEED_CURVES = [
  { id: 'normal', name: '1.0x Normal', pts: [[0, 1], [1, 1]] },
  { id: 'montage', name: 'Montage', pts: [[0, 1.6], [0.25, 3], [0.5, 0.6], [0.75, 3], [1, 1.6]] },
  { id: 'hero', name: 'Hero Slow-Mo', pts: [[0, 2.5], [0.38, 2.5], [0.5, 0.25], [0.62, 2.5], [1, 2.5]] },
  { id: 'bullet', name: 'Bullet Time', pts: [[0, 2], [0.38, 0.2], [0.62, 0.2], [1, 2]] },
  { id: 'jump', name: 'Jump Cut', pts: [[0, 1], [0.44, 1], [0.5, 6], [0.56, 1], [1, 1]] },
  { id: 'flash_in', name: 'Flash In', pts: [[0, 5], [0.3, 1], [1, 1]] },
  { id: 'flash_out', name: 'Flash Out', pts: [[0, 1], [0.7, 1], [1, 5]] },
];

export interface AiToolDefinition {
  id: string;
  group: 'Create' | 'Edit' | 'Captions' | 'Video' | 'Audio';
  name: string;
  desc: string;
  badge?: string;
}

export const AI_TOOLS_CATALOG: AiToolDefinition[] = [
  { id: 'recreate', group: 'Create', name: 'Recreate a video', desc: 'Bring a reference reel and match its cuts, camera moves and layout shot by shot.', badge: 'Popular' },
  { id: 'pauses', group: 'Edit', name: 'Remove pauses', desc: 'Cuts dead air and long ums. Natural keeps rhythm; Tight keeps it moving fast.', badge: 'Popular' },
  { id: 'fillers', group: 'Edit', name: 'Remove filler words', desc: 'Automatically trims bare ums, uhs and repeated stutters from the take.' },
  { id: 'split_scenes', group: 'Edit', name: 'Split scenes', desc: 'Finds every camera cut in an edited video and splits it into timeline clips.' },
  { id: 'transcribe', group: 'Captions', name: 'Transcribe again (Sarvam AI)', desc: 'Hinglish and 10 Indian languages timed to the syllable in Roman, Native script or English.', badge: 'Hinglish' },
  { id: 'translate', group: 'Captions', name: 'Translate captions', desc: 'Translate spoken Hinglish or regional language lines into English, Hindi, Tamil, Bengali & more.' },
  { id: 'auto_sfx', group: 'Audio', name: 'Auto sound effects', desc: 'Places named whooshes, pops and dings on key words and cuts automatically.', badge: '277 SFX' },
  { id: 'reduce_noise', group: 'Audio', name: 'Reduce background noise', desc: 'Cleans traffic, fan and room hum while keeping the spoken voice natural.' },
  { id: 'enhance_voice', group: 'Audio', name: 'Enhance studio voice', desc: 'Adds broadcast mic warmth, presence and crispness to phone recordings.' },
  { id: 'loudness', group: 'Audio', name: 'Normalize loudness (-14 LUFS)', desc: 'Levels quiet and loud sentences to standard Reels & YouTube Shorts loudness.' },
  { id: 'voice', group: 'Audio', name: 'Voice changer', desc: 'Transform vocal timbre with Deep Studio, Warm Narrator, or Crisp Creator presets.' },
  { id: 'beats', group: 'Audio', name: 'Beat detection', desc: 'Marks every musical beat on the timeline so cuts and zooms land on time.' },
  { id: 'tts', group: 'Audio', name: 'Text to speech', desc: 'Generate natural Indian-accented English or Hindi voiceover for any caption line.' },
  { id: 'remove_bg', group: 'Video', name: 'Remove background / Depth Cutout', desc: 'Isolates the speaker so "Behind you" words and custom backgrounds sit cleanly behind.', badge: 'Cutout' },
  { id: 'movement', group: 'Video', name: 'AI camera movement', desc: 'Slow push-in through each sentence and punch-in on emphasized hero words.', badge: 'Popular' },
  { id: 'track', group: 'Video', name: 'Camera tracking', desc: 'Locks captions or graphics to follow the speaker’s face or hand movements.' },
  { id: 'reframe', group: 'Video', name: 'Auto reframe 9:16', desc: 'Keeps the speaker centered when converting 16:9 landscape takes to vertical reels.' },
  { id: 'stabilize', group: 'Video', name: 'Stabilize shaky take', desc: 'Smooths walking and handheld phone jitter without warping edges.' },
  { id: 'auto_adjust', group: 'Video', name: 'Auto color grade', desc: 'Balances skin tones, exposure and shadow contrast in one tap.' },
  { id: 'color_match', group: 'Video', name: 'Color match clip', desc: 'Matches the color palette and contrast of any reference frame.' },
  { id: 'flicker', group: 'Video', name: 'Remove light flicker', desc: 'Evens out indoor LED banding and frame-to-frame brightness pumping.' },
  { id: 'denoise', group: 'Video', name: 'Reduce low-light grain', desc: 'Smooths high-ISO sensor noise while preserving facial detail.' },
  { id: 'chroma', group: 'Video', name: 'Chroma key green screen', desc: 'Key out green/blue backdrops with spill suppression and edge feathering.' },
  { id: 'retouch', group: 'Video', name: 'Face retouch', desc: 'Subtle studio skin smoothing, under-eye brightening and teeth whitening.' },
  { id: 'relight', group: 'Video', name: '3D Studio Relight', desc: 'Place virtual warm key lights and colored rim backlights on the speaker.' },
];

export const INDIAN_SCRIPTS = [
  { id: 'hinglish', label: 'English letters (Hinglish)', sample: 'Maine bas video upload kiya' },
  { id: 'devanagari', label: 'हिन्दी · मराठी (Devanagari)', sample: 'मैंने बस वीडियो अपलोड किया' },
  { id: 'english', label: 'English Translation', sample: 'I just uploaded the video' },
  { id: 'tamil', label: 'தமிழ் (Tamil)', sample: 'நான் வெறும் வீடியோ அப்லோட் செய்தேன்' },
  { id: 'bengali', label: 'বাংলা (Bengali)', sample: 'আমি শুধু ভিডিও আপলোড করলাম' },
];
