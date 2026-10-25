import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  Play,
  FolderPlus,
  Film,
  Layers,
  Check,
  Search,
  ArrowRight,
  Download,
  X,
  HelpCircle,
  Keyboard,
  Languages,
  Wand2,
  Upload,
  ScanText,
  Trash2,
  Plus,
  Volume2,
  VolumeX,
  Mail,
  ChevronDown,
  Loader2,
  Monitor,
  Apple,
} from 'lucide-react';
import {
  TEMPLATES,
  TEMPLATE_TABS,
  AI_EDIT_LOOKS,
  findTemplate,
  type CaptionTemplateSpec,
} from '../data/templatesCatalog';
import {
  MEDIA_LIBRARY_ASSETS,
  playSfxSound,
  type MediaAssetItem,
} from '../data/assetsCatalog';
import { filterTemplates } from '../utils/editorLogic';
import type { CaptikProject } from '../utils/projectAndOcrLogic';
import { CaptikCardPreview } from './CaptikTemplateRenderer';
import { CaptikLogoIcon, type AppViewMode, type ExportQuality } from './TopBar';

interface WorkspaceAndLandingProps {
  activeView: AppViewMode;
  onChangeView: (view: AppViewMode) => void;
  onSelectTemplateAndOpenEditor: (tpl: CaptionTemplateSpec) => void;
  onSelectMediaAndOpenEditor: (asset: MediaAssetItem) => void;
  activeTemplate: CaptionTemplateSpec;
  projects: CaptikProject[];
  activeProjectId: string;
  onSelectProjectAndOpenEditor: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onCreateProjectFromFile: (
    file: File,
    projectName?: string,
    autoRunOcr?: boolean
  ) => Promise<void>;
  onGenerateAndImportSampleVideo: (
    projectName: string,
    sceneTexts: [string, string, string],
    autoRunOcr: boolean
  ) => Promise<void>;
  onOpenNewProjectModal: () => void;
}

const HERO_LANGUAGES = [
  'Hinglish',
  'Hindi',
  'Tamil',
  'Bengali',
  'Marathi',
  'Telugu',
  'Kannada',
  'Gujarati',
  'Malayalam',
  'Punjabi',
];

const FAQ_ITEMS = [
  {
    num: '01',
    q: 'How does Captik work?',
    a: 'Drop in a video and say which language it is in. Captik transcribes it, detects burned-in video text with OCR, and times every word to the audio, usually in under a minute. Pick a template or an AI Edits style, fix anything you want, and export an MP4 or WebM.',
  },
  {
    num: '02',
    q: 'What does AI Edits do?',
    a: 'It edits the reel around what you said: a title on the hook, a design on the words that matter, zooms, b roll where you mention something, music under your voice and a sound on each cut. Everything it adds opens in the editor as clips you can move, change or delete.',
  },
  {
    num: '03',
    q: 'Which languages does it understand?',
    a: 'Hindi, Bengali, Gujarati, Kannada, Malayalam, Marathi, Odia, Punjabi, Tamil, Telugu and English, or let it detect the language. Captions come out in the language’s own script, in English letters (the way Hinglish is usually typed), or translated into English.',
  },
  {
    num: '04',
    q: 'Can I change the words after the captions or OCR text are made?',
    a: 'Yes. Every word and detected video text region can be retyped, retimed, recoloured, repositioned, masked or made bigger, and splitting or joining lines is a click. The export draws exactly what the preview shows.',
  },
  {
    num: '05',
    q: 'Can I use my own font?',
    a: 'Yes. Choose from 127 curated Google Fonts or upload a font file (.ttf, .otf, .woff or .woff2) and use it on any caption or text lockup.',
  },
  {
    num: '06',
    q: 'What does "Behind you" mean?',
    a: 'Those templates put a giant hero word behind the speaker, as if it were part of the scene. Captik cuts you out of the background automatically so the subject stands in front of the typography.',
  },
  {
    num: '07',
    q: 'How many templates are there?',
    a: '106 caption templates across Popular (16), Behind you (29), Bold & animated (16), Clean (20), Property reels (20), and Around you (21), plus 36 AI Edit styles.',
  },
  {
    num: '08',
    q: 'Do I need to install anything?',
    a: 'Nothing to install for the browser editor — it runs on any phone or laptop. For Premiere Pro, After Effects, and DaVinci Resolve, you can also download the native desktop plugin.',
  },
  {
    num: '09',
    q: 'What does it cost?',
    a: 'Every feature is unlocked right here in the browser with no login required. On captik.in, single clean exports start at ₹20 a video, ₹99 for a week, or monthly plans from ₹349 GST included.',
  },
  {
    num: '10',
    q: 'Is it really free to start?',
    a: 'Yes. Open the editor, create a new project, upload any video, detect text, apply any of the 106 templates, and export immediately without signing in.',
  },
  {
    num: '11',
    q: 'Can I cancel?',
    a: 'Every plan can be paid once for 30 days with nothing renewing automatically, or cancelled any time with one click.',
  },
  {
    num: '12',
    q: 'What are caption minutes and export minutes?',
    a: 'Caption minutes measure the length of videos you transcribe, and export minutes measure the length of finished videos you render.',
  },
  {
    num: '13',
    q: 'What can I export?',
    a: 'Rendered video files (up to 4K in 9:16, 16:9, 1:1, or 4:5), SubRip (.SRT) caption files, or editable timeline layers in the desktop plugin.',
  },
  {
    num: '14',
    q: 'What happens to my video?',
    a: 'Your projects and edits are stored locally in your browser (IndexedDB and localStorage) on your own device.',
  },
];

const HOME_SHOWCASE_TEMPLATES = [
  { num: '01', id: 'big_reveal', name: 'Big Reveal', tag: 'Behind you' },
  { num: '02', id: 'look_garnet', name: 'Garnet', tag: 'Behind you' },
  { num: '03', id: 'look_netting', name: 'Netting', tag: 'Behind you' },
  { num: '04', id: 'look_belfry', name: 'Belfry', tag: 'Behind you' },
  { num: '05', id: 'captik_glow', name: 'Captik Glow', tag: 'Animated' },
  { num: '06', id: 'look_rudder', name: 'Rudder', tag: 'New look' },
  { num: '07', id: 'look_mizzen', name: 'Mizzen', tag: 'Behind you' },
  { num: '08', id: 'look_keel', name: 'Keel', tag: 'Behind you' },
  { num: '09', id: 'look_outhaul', name: 'Outhaul', tag: 'Behind you' },
  { num: '10', id: 'editor_masala', name: 'Editor Masala', tag: 'Animated' },
  { num: '11', id: 'look_effigy', name: 'Effigy', tag: 'Behind you' },
  { num: '12', id: 'look_yawl', name: 'Yawl', tag: 'Behind you' },
];

export const CaptikFooter: React.FC<{
  onChangeView: (view: AppViewMode) => void;
}> = ({ onChangeView }) => (
  <footer className="relative bg-[#070708] border-t border-white/[0.08] pt-16 md:pt-20 pb-12 overflow-hidden text-[#f3efe7]">
    <div className="max-w-[1180px] mx-auto px-5 md:px-10 grid grid-cols-2 md:grid-cols-12 gap-10 pb-14 border-b border-white/[0.08]">
      <div className="col-span-2 md:col-span-5 space-y-3">
        <button
          type="button"
          onClick={() => onChangeView('landing')}
          className="flex items-center gap-2 cursor-pointer"
        >
          <CaptikLogoIcon className="w-6 h-6" />
          <span className="font-display font-bold text-lg">Captik</span>
        </button>
        <p className="text-sm text-[#8f8a82] max-w-xs leading-relaxed">
          Captions for the way India talks. Upload a video, pick a template, fix
          any word, export.
        </p>
      </div>

      <div className="col-span-1 md:col-span-2 space-y-2.5">
        <p className="text-[11px] font-mono uppercase tracking-wider text-[#8f8a82]">
          Product
        </p>
        <ul className="space-y-2 text-sm text-[#f3efe7]/85">
          <li>
            <button
              type="button"
              onClick={() => onChangeView('editor')}
              className="hover:text-[#f5a524] cursor-pointer"
            >
              Editor
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={() => onChangeView('templates')}
              className="hover:text-[#f5a524] cursor-pointer"
            >
              Templates
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={() => onChangeView('plugin')}
              className="hover:text-[#f5a524] cursor-pointer"
            >
              Plugin
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={() => onChangeView('pricing')}
              className="hover:text-[#f5a524] cursor-pointer"
            >
              Pricing
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={() => onChangeView('changelog')}
              className="hover:text-[#f5a524] cursor-pointer"
            >
              Changelog
            </button>
          </li>
        </ul>
      </div>

      <div className="col-span-1 md:col-span-2 space-y-2.5">
        <p className="text-[11px] font-mono uppercase tracking-wider text-[#8f8a82]">
          Company
        </p>
        <ul className="space-y-2 text-sm text-[#f3efe7]/85">
          <li>
            <button
              type="button"
              onClick={() => onChangeView('about')}
              className="hover:text-[#f5a524] cursor-pointer"
            >
              About
            </button>
          </li>
          <li>
            <a
              href="mailto:support@captik.in"
              className="hover:text-[#f5a524]"
            >
              Support
            </a>
          </li>
        </ul>
      </div>

      <div className="col-span-1 md:col-span-3 space-y-2.5">
        <p className="text-[11px] font-mono uppercase tracking-wider text-[#8f8a82]">
          Legal
        </p>
        <ul className="space-y-2 text-sm text-[#f3efe7]/85">
          <li>
            <button
              type="button"
              onClick={() => onChangeView('privacy')}
              className="hover:text-[#f5a524] cursor-pointer"
            >
              Privacy
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={() => onChangeView('terms')}
              className="hover:text-[#f5a524] cursor-pointer"
            >
              Terms
            </button>
          </li>
        </ul>
      </div>
    </div>

    <div className="max-w-[1180px] mx-auto px-5 md:px-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#8f8a82] gap-2">
      <span>© 2026 Captik</span>
      <span>Made in India, for Indian creators</span>
    </div>

    <p
      aria-hidden="true"
      className="font-display font-black text-[clamp(5rem,18vw,16rem)] leading-none tracking-tighter text-center text-white/[0.03] select-none pointer-events-none mt-4"
    >
      Captik
    </p>
  </footer>
);

export const WorkspaceAndLandingView: React.FC<WorkspaceAndLandingProps> = ({
  activeView,
  onChangeView,
  onSelectTemplateAndOpenEditor,
  activeTemplate,
  projects,
  activeProjectId,
  onSelectProjectAndOpenEditor,
  onDeleteProject,
  onCreateProjectFromFile,
  onOpenNewProjectModal,
}) => {
  const [galleryCategory, setGalleryCategory] = useState<string>('all');
  const [gallerySearch, setGallerySearch] = useState<string>('');
  const [hoveredTplId, setHoveredTplId] = useState<string | null>(null);

  // Landing Page interactive states
  const [langIndex, setLangIndex] = useState(0);
  const [heroLookPill, setHeroLookPill] = useState<
    'Glow' | 'Highlight' | 'Bold' | 'Serif' | 'Outline'
  >('Bold');
  const [heroVideoTime, setHeroVideoTime] = useState<number>(4.2);
  const [heroIsMuted, setHeroIsMuted] = useState<boolean>(true);
  const heroVideoRef = useRef<HTMLVideoElement | null>(null);

  const [activeAiEditTab, setActiveAiEditTab] = useState<string>('Voltage');
  const [compareSplitPct, setCompareSplitPct] = useState<number>(58);
  const [howScriptTab, setHowScriptTab] = useState<'hinglish' | 'hi' | 'en'>(
    'hinglish'
  );
  const [howPauseTab, setHowPauseTab] = useState<'Off' | 'Natural' | 'Tight'>(
    'Natural'
  );
  const [homeShowcaseId, setHomeShowcaseId] = useState<string>('big_reveal');
  const [homeTemplateCategory, setHomeTemplateCategory] = useState<string>('showcase');
  const [editorPreviewDevice, setEditorPreviewDevice] = useState<'desktop' | 'phone'>('desktop');
  const [openFaqNum, setOpenFaqNum] = useState<string | null>('01');
  const [isUploadingHero, setIsUploadingHero] = useState(false);

  const heroFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setLangIndex((i) => (i + 1) % HERO_LANGUAGES.length);
    }, 2200);
    return () => clearInterval(id);
  }, []);

  const handleHeroFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingHero(true);
    try {
      await onCreateProjectFromFile(file, undefined, true);
    } finally {
      setIsUploadingHero(false);
      e.target.value = '';
    }
  };

  const filteredGallery = filterTemplates(
    TEMPLATES,
    galleryCategory,
    gallerySearch
  );

  // ==================== 1. MY PROJECTS WORKSPACE (/projects) ====================
  if (activeView === 'workspace') {
    return (
      <div className="flex-1 bg-[#0b0b0c] overflow-y-auto select-none custom-scrollbar flex flex-col justify-between">
        <div className="max-w-[1180px] w-full mx-auto px-5 md:px-10 py-10 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/[0.08] pb-6">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-[#f5a524] mb-1">
                CAPTIK STUDIO · LOCAL WORKSPACE
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#f3efe7] tracking-tight">
                Your Video Projects ({projects.length})
              </h1>
              <p className="text-sm text-[#8f8a82] mt-1">
                Every uploaded video creates a separate project stored locally on your device. No login required.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onOpenNewProjectModal}
                className="px-5 py-2.5 rounded-full bg-[#f5a524] hover:bg-[#fbbf24] text-[#120d02] text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>New Project / Upload Video</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {/* Create New Project Card */}
            <button
              type="button"
              onClick={onOpenNewProjectModal}
              className="aspect-[9/13] rounded-2xl border-2 border-dashed border-[#f5a524]/45 bg-[#f5a524]/[0.05] hover:bg-[#f5a524]/[0.1] p-6 flex flex-col items-center justify-center text-center gap-3 transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#f5a524] text-black flex items-center justify-center group-hover:scale-105 transition-transform">
                <FolderPlus className="w-6 h-6" />
              </div>
              <div>
                <div className="text-base font-bold text-[#f3efe7]">
                  + Create New Project
                </div>
                <p className="text-xs text-[#8f8a82] mt-1">
                  Upload a video from your device or generate a custom test clip with burned-in text for OCR detection.
                </p>
              </div>
            </button>

            {projects.map((proj) => {
              const isCurrent = proj.id === activeProjectId;
              const tpl = findTemplate(proj.templateId);
              return (
                <div
                  key={proj.id}
                  onClick={() => onSelectProjectAndOpenEditor(proj.id)}
                  className={`group relative aspect-[9/13] rounded-2xl overflow-hidden bg-[#141418] border text-left transition-all cursor-pointer ${
                    isCurrent
                      ? 'border-[#f5a524] ring-2 ring-[#f5a524]/35'
                      : 'border-white/[0.1] hover:border-[#f5a524]/60'
                  }`}
                >
                  <img
                    src={proj.posterUrl}
                    alt={proj.name}
                    onError={(e) => {
                      e.currentTarget.src = '/assets/terrace_poster.webp';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-black/30" />

                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-[#f5a524] text-black text-[10px] font-bold">
                      {proj.isCustomUpload ? 'Uploaded Video' : 'Studio Project'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-black/75 text-white text-[10px] font-mono tabular-nums">
                      {proj.duration.toFixed(1)}s
                    </span>
                  </div>

                  {projects.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteProject(proj.id);
                      }}
                      title="Delete project"
                      className="absolute top-11 right-3 p-1.5 rounded-lg bg-black/70 hover:bg-rose-500 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <div className="absolute bottom-3.5 left-3.5 right-3.5 space-y-1">
                    <div className="text-sm font-bold text-white truncate">
                      {proj.name}
                    </div>
                    <div className="text-[11px] text-zinc-300 flex items-center justify-between">
                      <span>Template: {tpl.name}</span>
                      <span className="text-emerald-400 font-semibold">
                        {proj.detectedTexts.length} OCR text
                        {proj.detectedTexts.length === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <CaptikFooter onChangeView={onChangeView} />
      </div>
    );
  }

  // ==================== 2. FULL 106 TEMPLATES GALLERY (/templates) ====================
  if (activeView === 'templates') {
    return (
      <div className="flex-1 bg-[#0b0b0c] overflow-y-auto select-none custom-scrollbar flex flex-col justify-between">
        <div className="max-w-[1180px] w-full mx-auto px-5 md:px-10 py-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/[0.08] pb-6">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-[#f5a524] mb-1">
                CAPTIK.IN / TEMPLATES
              </div>
              <h1 className="font-display text-3xl sm:text-5xl font-bold text-[#f3efe7] tracking-tight">
                Same take. <span className="text-[#f5a524]">106 looks.</span>
              </h1>
              <p className="text-sm text-[#8f8a82] mt-2 max-w-xl">
                Every template works on your uploaded video. Click any template card to apply it immediately in the Captik Editor.
              </p>
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={gallerySearch}
                onChange={(e) => setGallerySearch(e.target.value)}
                placeholder="Search 106 templates (Garnet, Big Reveal...)"
                className="w-full bg-[#141418] border border-white/10 rounded-full pl-9 pr-4 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#f5a524]"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {TEMPLATE_TABS.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setGalleryCategory(cat.key)}
                className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  galleryCategory === cat.key
                    ? 'bg-[#f5a524] text-[#120d02]'
                    : 'bg-[#141418] text-[#f3efe7] hover:bg-[#1e1e24] border border-white/[0.08]'
                }`}
              >
                <span>{cat.label}</span>
                <span className="px-1.5 py-0.5 rounded-full bg-black/20 text-[10px] tabular-nums">
                  {cat.ids.length}
                </span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
            {filteredGallery.map((tpl) => {
              const isSelected = activeTemplate.id === tpl.id;
              const isHovered = hoveredTplId === tpl.id;

              return (
                <button
                  key={tpl.id}
                  type="button"
                  onMouseEnter={() => setHoveredTplId(tpl.id)}
                  onMouseLeave={() =>
                    setHoveredTplId((prev) => (prev === tpl.id ? null : prev))
                  }
                  onClick={() => onSelectTemplateAndOpenEditor(tpl)}
                  className={`group relative aspect-[9/15] rounded-2xl overflow-hidden border text-left transition-all cursor-pointer bg-[#12141c] ${
                    isSelected
                      ? 'border-[#f5a524] ring-2 ring-[#f5a524]/40'
                      : 'border-white/10 hover:border-[#f5a524]/60'
                  }`}
                >
                  <img
                    src={tpl.previewPosterUrl}
                    alt={tpl.name}
                    loading="lazy"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = tpl.behind
                        ? '/assets/terrace_behind.webp'
                        : '/assets/terrace_poster.webp';
                    }}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {isHovered && (
                    <video
                      src={tpl.previewVideoUrl}
                      poster={tpl.previewPosterUrl}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover z-10"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-black/35 z-10" />

                  <div className="absolute top-2 left-2 right-2 flex justify-between z-20">
                    {tpl.popular ? (
                      <span className="px-1.5 py-0.5 rounded bg-[#f5a524] text-black text-[9px] font-black uppercase">
                        Popular
                      </span>
                    ) : tpl.lookSpec ? (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-black text-[9px] font-black uppercase">
                        {tpl.lookSpec.family}
                      </span>
                    ) : (
                      <span />
                    )}
                    {tpl.behind && (
                      <span className="px-1.5 py-0.5 rounded bg-black/75 border border-[#f5a524]/40 text-[#f5a524] text-[9px] font-bold">
                        Behind you
                      </span>
                    )}
                  </div>

                  <div className="absolute inset-x-2 bottom-11 z-20 rounded-xl bg-black/70 backdrop-blur-xs border border-white/10 px-2 py-2 flex items-center justify-center min-h-[60px] overflow-hidden">
                    <CaptikCardPreview template={tpl} />
                  </div>

                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-end justify-between z-20">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">
                        {tpl.name}
                      </div>
                      <div className="text-[10px] text-zinc-400 truncate capitalize">
                        {tpl.category}
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded-lg bg-[#f5a524] text-black text-[10px] font-extrabold opacity-0 group-hover:opacity-100 transition-opacity">
                      Use
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <CaptikFooter onChangeView={onChangeView} />
      </div>
    );
  }

  // ==================== 3. PLUGIN PAGE (/plugin/download) ====================
  if (activeView === 'plugin') {
    return (
      <div className="flex-1 bg-[#0b0b0c] overflow-y-auto select-none custom-scrollbar text-[#f3efe7]">
        <section className="max-w-[1180px] mx-auto px-5 md:px-10 py-16 md:py-24 space-y-16">
          <div className="grid md:grid-cols-12 gap-8 items-end">
            <div className="md:col-span-7 space-y-4">
              <p className="text-xs font-mono uppercase tracking-widest text-[#f5a524]">
                PREMIERE PRO · AFTER EFFECTS · DAVINCI RESOLVE
              </p>
              <h1 className="font-display text-[clamp(2.6rem,5.8vw,5.6rem)] leading-[0.92] tracking-[-0.04em]">
                Captions inside{' '}
                <span className="text-[#f5a524]">your editor.</span>
              </h1>
            </div>
            <p className="md:col-span-5 text-[15.5px] text-[#8f8a82] leading-relaxed">
              The Captik panel docks in Premiere Pro, After Effects and DaVinci
              Resolve. It transcribes your timeline and puts the captions back on
              it, as layers you can edit or as an exact burn in of the preview.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => onChangeView('editor')}
              className="px-6 py-3.5 rounded-full bg-[#f5a524] hover:bg-[#fbbf24] text-[#120d02] font-bold text-sm flex items-center gap-2 cursor-pointer"
            >
              <Monitor className="w-4 h-4" />
              <span>Download for Windows (captik_plugin.exe)</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeView('editor')}
              className="px-6 py-3.5 rounded-full bg-[#16161b] hover:bg-[#202028] border border-white/15 text-[#f3efe7] font-semibold text-sm flex items-center gap-2 cursor-pointer"
            >
              <Apple className="w-4 h-4" />
              <span>Download for macOS</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeView('editor')}
              className="px-5 py-3.5 rounded-full border border-[#f5a524]/40 text-[#f5a524] font-semibold text-sm cursor-pointer"
            >
              Or use Browser Editor Now →
            </button>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 py-8 border-y border-white/[0.1]">
            <div>
              <div className="font-display text-4xl font-bold text-[#f5a524]">104</div>
              <div className="text-xs text-[#8f8a82] mt-1">templates in the plugin</div>
            </div>
            <div>
              <div className="font-display text-4xl font-bold">63</div>
              <div className="text-xs text-[#8f8a82] mt-1">editable in After Effects</div>
            </div>
            <div>
              <div className="font-display text-4xl font-bold">62</div>
              <div className="text-xs text-[#8f8a82] mt-1">editable in DaVinci Resolve</div>
            </div>
            <div>
              <div className="font-display text-4xl font-bold">13</div>
              <div className="text-xs text-[#8f8a82] mt-1">editable in Premiere Pro</div>
            </div>
            <div>
              <div className="font-display text-4xl font-bold text-emerald-400">10</div>
              <div className="text-xs text-[#8f8a82] mt-1">Indian languages + Hinglish</div>
            </div>
          </div>

          {/* Host comparison cards */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#121216] border border-white/[0.08] space-y-3">
              <div className="text-xs font-mono uppercase text-[#f5a524]">After Effects</div>
              <h3 className="text-xl font-bold">Editable text layers</h3>
              <p className="text-sm text-[#8f8a82] leading-relaxed">
                63 of 104 templates land as native After Effects text layers you can retype, restyle and keyframe like any other layer. Find it in Window → Extensions → Captik.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-[#121216] border border-white/[0.08] space-y-3">
              <div className="text-xs font-mono uppercase text-[#f5a524]">DaVinci Resolve</div>
              <h3 className="text-xl font-bold">Editable Fusion Text+ titles</h3>
              <p className="text-sm text-[#8f8a82] leading-relaxed">
                62 of 104 templates arrive as Text+ titles on your timeline, each one yours to retype and restyle. Workspace → Workflow Integrations → Captik.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-[#121216] border border-white/[0.08] space-y-3">
              <div className="text-xs font-mono uppercase text-[#f5a524]">Premiere Pro</div>
              <h3 className="text-xl font-bold">Editable caption graphics</h3>
              <p className="text-sm text-[#8f8a82] leading-relaxed">
                One caption graphic for every line, with its words, font and colours editable in the Essential Graphics panel, or burn in an exact copy of the preview.
              </p>
            </div>
          </div>
        </section>
        <CaptikFooter onChangeView={onChangeView} />
      </div>
    );
  }

  // ==================== 4. DEDICATED PRICING PAGE (/pricing) ====================
  if (activeView === 'pricing') {
    return (
      <div className="flex-1 overflow-y-auto select-none custom-scrollbar">
        <section className="paper px-5 md:px-10 py-16 md:py-24">
          <div className="max-w-[1180px] mx-auto space-y-12">
            <div className="grid md:grid-cols-12 gap-8 items-end">
              <h1 className="md:col-span-7 font-display text-[clamp(2.6rem,5.8vw,5.6rem)] leading-[0.92] tracking-[-0.04em] text-[#17150f]">
                Pay for what <span className="text-[#b45f06]">you post.</span>
              </h1>
              <p className="md:col-span-5 text-[15.5px] text-[#6b655a] leading-relaxed">
                Tools that edit reels for you charge Rs. 1,800 to Rs. 3,500 a month. Captik captions, cuts and edits from Rs. 349, GST included. In this studio build, every feature is unlocked for free with zero login required.
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-5">
              {[
                {
                  name: 'Free',
                  badge: 'Unlocked Here',
                  sub: 'Try everything',
                  price: '₹0',
                  cadence: 'forever · no login needed',
                  capMin: 'Unlimited',
                  expMin: 'Unlimited',
                  cta: 'Start Editing Free',
                },
                {
                  name: 'Starter',
                  badge: 'Most bought',
                  sub: 'A few reels a week',
                  price: '₹349',
                  cadence: '≈ Rs. 12 a day · 30 days',
                  capMin: '30 caption min',
                  expMin: '45 export min',
                  cta: 'Open Starter Studio',
                },
                {
                  name: 'Editor',
                  badge: 'Recommended',
                  sub: 'A reel a day',
                  price: '₹699',
                  cadence: '≈ Rs. 23 a day · 30 days',
                  capMin: '60 caption min',
                  expMin: '110 export min',
                  cta: 'Open Editor Studio',
                },
                {
                  name: 'Pro',
                  badge: 'Agencies',
                  sub: 'Editors and agencies',
                  price: '₹1,499',
                  cadence: '≈ Rs. 50 a day · 30 days',
                  capMin: '150 caption min',
                  expMin: '230 export min',
                  cta: 'Open Pro Studio',
                },
              ].map((plan) => (
                <div
                  key={plan.name}
                  className="p-6 rounded-2xl bg-white/75 border border-[#17150f]/15 flex flex-col justify-between gap-6"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-xl text-[#17150f]">
                        {plan.name}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#b45f06]/15 text-[#b45f06] text-[11px] font-bold">
                        {plan.badge}
                      </span>
                    </div>
                    <p className="text-xs text-[#6b655a]">{plan.sub}</p>
                    <div className="pt-2">
                      <span className="font-display text-4xl font-bold text-[#17150f]">
                        {plan.price}
                      </span>
                      <p className="text-xs text-[#6b655a] mt-1">{plan.cadence}</p>
                    </div>
                    <div className="pt-3 border-t border-[#17150f]/10 text-xs space-y-1 text-[#17150f]">
                      <div>• {plan.capMin}</div>
                      <div>• {plan.expMin}</div>
                      <div>• All 106 templates & 36 AI Edits</div>
                      <div>• Real OCR video text detection</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onChangeView('editor')}
                    className="w-full py-2.5 rounded-full bg-[#17150f] hover:bg-[#b45f06] text-[#f1ece2] text-xs font-bold transition-colors cursor-pointer"
                  >
                    {plan.cta}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
        <CaptikFooter onChangeView={onChangeView} />
      </div>
    );
  }

  // ==================== 5. CHANGELOG PAGE (/changelog) ====================
  if (activeView === 'changelog') {
    return (
      <div className="flex-1 bg-[#0b0b0c] overflow-y-auto select-none custom-scrollbar text-[#f3efe7]">
        <div className="max-w-[920px] mx-auto px-5 md:px-10 py-16 space-y-12">
          <div className="border-b border-white/[0.1] pb-8">
            <div className="text-xs font-mono uppercase tracking-widest text-[#f5a524]">
              Changelog
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-bold mt-2">
              What’s new
            </h1>
            <p className="text-sm text-[#8f8a82] mt-2">
              Updates, improvements and fixes, newest first.
            </p>
          </div>

          {[
            {
              title: 'Automatic OCR Video Text Detection & Multi-Project Studio',
              date: 'Released · October 2026',
              points: [
                'Upload any video from your device to create a dedicated editing project stored locally in your browser.',
                'Real OCR text detection scans video frames across timestamps, locating burned-in text with bounding coordinates and confidence scores.',
                'Click any detected video text to edit, replace, mask the original video background, reposition, or sync directly into word-by-word animated captions.',
              ],
            },
            {
              title: 'New prices, every feature on every plan',
              date: 'Released · October 2026',
              points: [
                'Every plan, Free included, now has every feature: 4K, camera tracking, SRT, AI Edits, your own fonts and the plugins.',
                'Starter is ₹349, Editor ₹699 and Pro ₹1,499 a month, and the week is ₹99. Every plan can be paid once, with nothing renewing.',
              ],
            },
            {
              title: 'Cut the pauses',
              date: 'Released · October 2026',
              points: [
                'A new Pauses control takes the dead air out of your video. Natural keeps your rhythm, Tight also cuts every bare um, in English and Hindi.',
                'Words that carry meaning stay, a breath is kept on each side of every cut, and Off brings everything back.',
              ],
            },
            {
              title: 'AI Edits: music, sound and camera moves',
              date: 'Released · October 2026',
              points: [
                'AI Edits now play a music bed under your talk, matched to the look you pick, that drops well under your voice whenever you speak.',
                'Every cut to a new scene gets its own sound, the hook lands with a whoosh, and sounds stay spaced out so the edit never feels noisy.',
              ],
            },
          ].map((release) => (
            <article
              key={release.title}
              className="p-6 md:p-8 rounded-2xl bg-[#121216] border border-white/[0.08] space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-2xl font-bold text-[#f3efe7]">
                  {release.title}
                </h2>
                <span className="px-3 py-1 rounded-full bg-[#f5a524]/15 text-[#f5a524] text-xs font-mono">
                  {release.date}
                </span>
              </div>
              <ul className="space-y-2 text-sm text-[#8f8a82] leading-relaxed list-disc pl-5">
                {release.points.map((pt, i) => (
                  <li key={i}>{pt}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <CaptikFooter onChangeView={onChangeView} />
      </div>
    );
  }

  // ==================== 6. ABOUT, PRIVACY, TERMS PAGES ====================
  if (activeView === 'about' || activeView === 'privacy' || activeView === 'terms') {
    return (
      <div className="flex-1 bg-[#0b0b0c] overflow-y-auto select-none custom-scrollbar text-[#f3efe7]">
        <div className="max-w-[920px] mx-auto px-5 md:px-10 py-16 space-y-10">
          {activeView === 'about' && (
            <>
              <div className="space-y-3">
                <div className="text-xs font-mono uppercase tracking-widest text-[#f5a524]">
                  About Captik
                </div>
                <h1 className="font-display text-4xl md:text-6xl font-bold leading-tight">
                  Built in India,{' '}
                  <span className="text-[#f5a524]">for Indian creators.</span>
                </h1>
                <p className="text-base text-[#8f8a82] leading-relaxed pt-2">
                  Indian creators speak Hinglish, a fluid mix of Hindi and English that every auto driver, college kid and startup founder understands without thinking. Caption tools that learned English first tend to treat it like broken English.
                </p>
                <p className="text-base text-[#8f8a82] leading-relaxed">
                  Captik transcribes with speech models trained on Indian languages, detects text inside your video frames with OCR, times every word to the audio, and puts it all behind a simple browser editor: upload your video, pick a template, fix any word, export.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-5">
                <div className="p-5 rounded-2xl bg-[#121216] border border-white/[0.08]">
                  <div className="text-base font-bold text-white">Made for creators</div>
                  <div className="text-sm text-[#8f8a82] mt-1">Not enterprises. You.</div>
                </div>
                <div className="p-5 rounded-2xl bg-[#121216] border border-white/[0.08]">
                  <div className="text-base font-bold text-white">Edit in the browser</div>
                  <div className="text-sm text-[#8f8a82] mt-1">Nothing to install. No login required.</div>
                </div>
                <div className="p-5 rounded-2xl bg-[#121216] border border-white/[0.08]">
                  <div className="text-base font-bold text-white">Bharat first</div>
                  <div className="text-sm text-[#8f8a82] mt-1">10 Indian languages + English.</div>
                </div>
              </div>
            </>
          )}

          {activeView === 'privacy' && (
            <div className="space-y-4">
              <div className="text-xs font-mono uppercase tracking-widest text-[#f5a524]">
                Legal · Last updated June 2026
              </div>
              <h1 className="font-display text-4xl font-bold">Privacy Policy</h1>
              <p className="text-sm text-[#8f8a82] leading-relaxed">
                Your projects, uploaded videos, OCR detections, and edits are stored locally in your browser (IndexedDB and localStorage) on your own device. Clearing site data removes them. We do not train models on your content, and we never share or sell your data.
              </p>
            </div>
          )}

          {activeView === 'terms' && (
            <div className="space-y-4">
              <div className="text-xs font-mono uppercase tracking-widest text-[#f5a524]">
                Legal · Last updated May 2025
              </div>
              <h1 className="font-display text-4xl font-bold">Terms of Service</h1>
              <p className="text-sm text-[#8f8a82] leading-relaxed">
                You own everything you upload. Captik provides browser-based video captioning, OCR text detection, 106 templates, and video export tools so you can create and export reels without restrictions.
              </p>
            </div>
          )}
        </div>
        <CaptikFooter onChangeView={onChangeView} />
      </div>
    );
  }

  // ==================== 7. CAPTIK.IN AUTHENTIC HOMEPAGE (/) ====================
  const activeShowcaseTpl = findTemplate(homeShowcaseId);
  const homeCategoryTemplates =
    homeTemplateCategory === 'showcase'
      ? HOME_SHOWCASE_TEMPLATES.map((item) => ({
          num: item.num,
          tag: item.tag,
          tpl: findTemplate(item.id),
        }))
      : filterTemplates(TEMPLATES, homeTemplateCategory, '')
          .slice(0, 12)
          .map((tpl, idx) => ({
            num: String(idx + 1).padStart(2, '0'),
            tag: tpl.behind
              ? 'Behind you'
              : tpl.badge || tpl.category,
            tpl,
          }));

  const selectedAiEditSpec =
    AI_EDIT_LOOKS.find(
      (l) => l.name.toLowerCase() === activeAiEditTab.toLowerCase()
    ) || AI_EDIT_LOOKS[0];

  // Dynamically cycle reel speech phrases according to video playback time
  // (Prevents text from getting frozen on "HONESTLY YAAR, CAPTIONS HI")
  const heroCycleTime = heroVideoTime % 7.2;
  const heroPhrase =
    heroCycleTime < 1.8
      ? {
          behind: 'CAPTIONS',
          top: 'HONESTLY YAAR,',
          mid: 'CAPTIONS HI',
          bot: 'ZAROORI HAIN.',
        }
      : heroCycleTime < 3.6
      ? {
          behind: 'REELS',
          top: 'EK TAKE MEIN',
          mid: 'VIRAL REEL',
          bot: 'BAN JAAYEGI.',
        }
      : heroCycleTime < 5.6
      ? {
          behind: 'CAPTIONS',
          top: 'MINUTE MEIN',
          mid: 'CAPTIONS',
          bot: 'READY.',
        }
      : {
          behind: 'EXPORT',
          top: '106 TEMPLATES',
          mid: '1 CLICK MEIN',
          bot: 'EXPORT KARO.',
        };

  return (
    <div className="flex-1 bg-[#0b0b0c] overflow-y-auto select-none custom-scrollbar text-[#f3efe7]">
      <input
        ref={heroFileInputRef}
        type="file"
        data-testid="landing-video-file-input"
        accept="video/*"
        onChange={handleHeroFileSelect}
        className="hidden"
      />

      {/* SECTION 1: HERO DARK BAND ("Drop the take. Get the reel. In Hinglish.") - EXACT MATCH TO SCREENSHOT */}
      <section className="dark-band relative px-5 md:px-10 pt-8 md:pt-14 pb-20 border-b border-white/[0.08]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="max-w-[1180px] mx-auto grid lg:grid-cols-12 gap-10 md:gap-12 items-center"
        >
          <div className="lg:col-span-7 space-y-6">
            <h1 className="font-display text-[clamp(2.9rem,6.2vw,5.8rem)] font-bold leading-[0.93] tracking-[-0.04em] text-[#f3efe7]">
              <span className="block">Drop the take.</span>
              <span className="block">
                Get the <span className="text-[#f5a524]">reel.</span>
              </span>
              <span className="block">
                In <span className="text-[#f3efe7]">{HERO_LANGUAGES[langIndex]}</span>.
              </span>
            </h1>

            <p className="text-[16px] md:text-[17px] text-[#8f8a82] leading-relaxed max-w-[530px]">
              Captik writes captions that get Hinglish and ten Indian languages right, usually in under a minute, cuts the pauses, and edits in the zooms, sounds and b roll. Change anything you like, then export for Reels, Shorts or YouTube.
            </p>

            {/* Working Video Dropzone Box (Exact match to captik.in screenshot hero upload card) */}
            <div className="max-w-[540px] rounded-2xl bg-[#121216] border border-white/[0.12] p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-2xl">
              <div
                onClick={() => heroFileInputRef.current?.click()}
                className="flex items-center gap-3.5 flex-1 cursor-pointer group px-2 py-1"
              >
                <div className="w-11 h-11 rounded-xl bg-[#22180c] border border-[#f5a524]/20 text-[#f5a524] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Upload className="w-5 h-5 text-[#f5a524]" />
                </div>
                <div className="text-left">
                  <div className="text-[14.5px] font-bold text-[#f3efe7] group-hover:text-white transition-colors">
                    {isUploadingHero ? 'Importing video...' : 'Drop a video here'}
                  </div>
                  <div className="text-xs text-[#8f8a82]">
                    or <span className="underline text-zinc-300">choose a file</span> · MP4, MOV, Web...
                  </div>
                </div>
              </div>

              <button
                type="button"
                data-testid="landing-caption-my-video-btn"
                onClick={onOpenNewProjectModal}
                className="px-5 py-3.5 rounded-xl bg-[#f5a524] hover:bg-[#fbbf24] text-[#120d02] font-bold text-sm whitespace-nowrap transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
              >
                <span>Caption my video</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Information Rows below Upload Box (Exact match to captik.in screenshot) */}
            <div className="space-y-1.5 text-xs text-[#8f8a82] pt-0.5">
              <div className="text-[#8f8a82]">
                106 templates · Hinglish + 10 languages · up to 4K
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-[#8f8a82]">
                <span>TEMPLATE</span>
                <a
                  href="#templates"
                  className="font-bold text-[#f3efe7] hover:text-[#f5a524] cursor-pointer inline-flex items-center gap-1"
                >
                  <span>pick one below</span>
                  <span>↓</span>
                </a>
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
                  <strong className="text-[#f3efe7] font-mono">2,352</strong> videos exported in the last 24 hours
                </span>
                <span>
                  Trusted by <strong className="text-[#f3efe7]">2.5L+</strong> users
                </span>
              </div>
              <div className="text-xs text-[#8f8a82]">
                Free to try, no card · any video clean for <strong className="text-[#f5a524]">₹20</strong>
              </div>
            </div>
          </div>

          {/* Right: Interactive Hero Reel Stage (Exact match to captik.in screenshot) */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="w-[300px] sm:w-[315px] aspect-[9/16] rounded-[28px] overflow-hidden border border-white/15 bg-[#121318] relative shadow-[0_40px_100px_rgba(0,0,0,0.85)]">
              {/* 5-segment Story Bar at the top of the video */}
              <div className="absolute top-2.5 inset-x-3.5 z-30 flex items-center gap-1.5 pointer-events-none">
                {[0, 1, 2, 3, 4].map((segIdx) => {
                  const activeSeg = Math.floor((heroCycleTime / 7.2) * 5);
                  const isFilled = segIdx <= activeSeg;
                  return (
                    <div
                      key={segIdx}
                      className={`h-[2.5px] flex-1 rounded-full transition-all duration-200 ${
                        isFilled ? 'bg-white shadow-xs' : 'bg-white/30'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Sound Toggle Button */}
              <button
                type="button"
                onClick={() => {
                  setHeroIsMuted((m) => !m);
                  if (heroVideoRef.current) {
                    heroVideoRef.current.muted = !heroIsMuted;
                  }
                  playSfxSound('fast_air_whoosh', 0.25);
                }}
                className="absolute top-6 right-3.5 z-30 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[11px] font-mono uppercase text-white flex items-center gap-1.5 cursor-pointer hover:bg-black/80 transition-colors"
              >
                {heroIsMuted ? (
                  <VolumeX className="w-3 h-3 text-[#f5a524]" />
                ) : (
                  <Volume2 className="w-3 h-3 text-[#f5a524]" />
                )}
                <span>SOUND</span>
              </button>

              <video
                ref={heroVideoRef}
                src="/assets/terrace_reel.mp4"
                poster="/assets/terrace_poster.webp"
                autoPlay
                muted={heroIsMuted}
                loop
                playsInline
                onTimeUpdate={(e) => {
                  setHeroVideoTime(e.currentTarget.currentTime);
                }}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/25 pointer-events-none" />

              {/* 1. Behind Subject Hero Word (e.g. CAPTIK / REEL / CAPTIONS) */}
              <div className="absolute top-[28%] inset-x-0 text-center pointer-events-none select-none z-10 px-2">
                <span
                  className={`font-display font-black text-4xl sm:text-5xl uppercase tracking-wider block transition-all ${
                    heroLookPill === 'Serif'
                      ? 'font-serif-editorial italic text-amber-200/90'
                      : heroLookPill === 'Outline'
                      ? 'text-transparent [-webkit-text-stroke:2px_#ffffff]'
                      : 'text-[#a3e635] drop-shadow-[0_4px_22px_rgba(0,0,0,0.9)]'
                  }`}
                >
                  {heroPhrase.behind}
                </span>
              </div>

              {/* 2. Foreground Speech Stack (Follows video timestamps smoothly) */}
              <div className="absolute top-[58%] inset-x-3 text-center pointer-events-none select-none z-20 flex flex-col items-center justify-center leading-none">
                <div className="space-y-0.5">
                  {/* Line 1 */}
                  <div
                    className={`font-display font-black text-[22px] tracking-wide text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)] uppercase transition-all ${
                      heroLookPill === 'Serif' ? 'font-serif-editorial italic normal-case text-xl' : ''
                    }`}
                  >
                    {heroPhrase.top}
                  </div>

                  {/* Line 2 (Accent word - e.g. CAPTIK, CAPTIONS, VIRAL REEL) */}
                  <div
                    className={`font-display font-black text-[27px] tracking-tight uppercase transition-all ${
                      heroLookPill === 'Glow'
                        ? 'text-[#a0d83e] drop-shadow-[0_0_20px_rgba(160,216,62,0.95)]'
                        : heroLookPill === 'Highlight'
                        ? 'bg-[#f5a524] text-black px-3 py-0.5 rounded-sm inline-block'
                        : heroLookPill === 'Serif'
                        ? 'font-serif-editorial italic text-2xl text-[#fde68a] normal-case'
                        : heroLookPill === 'Outline'
                        ? 'text-transparent [-webkit-text-stroke:2px_#a3e635]'
                        : 'text-[#a3e635] drop-shadow-[0_3px_12px_rgba(0,0,0,0.95)]'
                    }`}
                  >
                    {heroPhrase.mid}
                  </div>

                  {/* Line 3 */}
                  <div
                    className={`font-display font-black text-[23px] tracking-wider text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)] uppercase transition-all ${
                      heroLookPill === 'Serif' ? 'font-serif-editorial italic normal-case text-xl' : ''
                    }`}
                  >
                    {heroPhrase.bot}
                  </div>
                </div>
              </div>

              {/* 3. Hero Look Switcher Pills INSIDE the Video Bottom (Matching Screenshot) */}
              <div className="absolute bottom-3 inset-x-2 z-30 flex items-center justify-center pointer-events-auto">
                <div className="flex items-center gap-1 px-1.5 py-1 rounded-full bg-black/65 backdrop-blur-md border border-white/15 shadow-xl">
                  {(['Glow', 'Highlight', 'Bold', 'Serif', 'Outline'] as const).map(
                    (pill) => (
                      <button
                        key={pill}
                        type="button"
                        onClick={() => {
                          setHeroLookPill(pill);
                          playSfxSound('bubble_pop', 0.25);
                        }}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                          heroLookPill === pill
                            ? 'bg-white text-black shadow-md'
                            : 'text-white/70 hover:text-white'
                        }`}
                      >
                        {pill}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* SECTION 2: STATS BAND */}
      <section className="px-5 md:px-10 py-10 border-b border-white/[0.08] bg-[#0b0b0c]">
        <div className="max-w-[1180px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { val: '2.5L+', label: 'CREATORS SIGNED UP' },
            { val: '2,352', label: 'VIDEOS EXPORTED IN THE LAST 24 HOURS' },
            { val: '4,700+', label: 'CREATORS PAID IN THE LAST 30 DAYS' },
            { val: '10+1', label: 'INDIAN LANGUAGES, AND ENGLISH' },
          ].map((stat, sIdx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: sIdx * 0.1, ease: 'easeOut' }}
            >
              <div className="font-display text-3xl md:text-5xl font-bold text-[#f3efe7] tabular-nums">
                {stat.val.includes('L+') ? (
                  <>2.5<span className="text-[#f5a524]">L+</span></>
                ) : stat.val.includes('+1') ? (
                  <>10<span className="text-[#f5a524]">+1</span></>
                ) : stat.val.includes('+') ? (
                  <>4,700<span className="text-[#f5a524]">+</span></>
                ) : (
                  stat.val
                )}
              </div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#8f8a82] mt-1">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* SECTION 3: #ai-edits ("One tap. A finished edit.") */}
      <section id="ai-edits" className="dark-band px-5 md:px-10 py-20 md:py-28 border-b border-white/[0.08]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.45 }}
          className="max-w-[1180px] mx-auto space-y-10"
        >
          <div className="grid md:grid-cols-12 gap-8 items-end">
            <h2 className="md:col-span-7 font-display text-[clamp(2.4rem,5.4vw,5.4rem)] leading-[0.92] tracking-[-0.04em]">
              One tap. <span className="text-[#f5a524]">A finished edit.</span>
            </h2>
            <p className="md:col-span-5 text-[15.5px] text-[#8f8a82] leading-relaxed">
              AI Edits plans the reel around what you said. The hook gets a title, the words that matter get a design, the music sits under your voice, and a sound lands on every cut. It is an edit you can open and change, not a template stamped on top.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {['Voltage', 'Sleeve', 'Parcel', 'Jotter', 'Overclock', 'Verdict'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setActiveAiEditTab(st)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    activeAiEditTab === st
                      ? 'bg-[#f5a524] text-[#120d02]'
                      : 'bg-white/[0.06] text-[#f3efe7] hover:bg-white/[0.12]'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 text-xs text-[#8f8a82]">
              <span>Drag slider to compare Raw take vs AI Edit</span>
              <input
                type="range"
                min={15}
                max={85}
                value={compareSplitPct}
                aria-label="Compare raw take and AI edit"
                onChange={(e) => setCompareSplitPct(Number(e.target.value))}
                className="w-28 accent-[#f5a524] cursor-pointer"
              />
            </div>
          </div>

          <div className="relative rounded-3xl overflow-hidden border border-white/15 bg-[#12131a] h-[360px] md:h-[440px] flex items-center justify-center">
            <img
              src="/assets/overclock.webp"
              alt="AI Edit preview"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

            {/* Live AI Edit Styled Caption Overlay on the right side */}
            <div className="relative z-10 flex flex-col items-center text-center px-6 pointer-events-none">
              <span className="px-2.5 py-0.5 rounded-full bg-black/75 border border-white/15 text-[10px] font-mono uppercase tracking-widest text-[#f5a524] mb-2">
                {selectedAiEditSpec.name} · {selectedAiEditSpec.tagline}
              </span>
              <div
                style={{
                  fontFamily: selectedAiEditSpec.fontFamily,
                  fontWeight: selectedAiEditSpec.fontWeight,
                  color: selectedAiEditSpec.accent,
                  textShadow: `0 0 24px ${selectedAiEditSpec.accent}77, 0 4px 12px rgba(0,0,0,0.9)`,
                  textTransform: selectedAiEditSpec.uppercase ? 'uppercase' : 'none',
                }}
                className="text-3xl md:text-5xl font-black tracking-tight"
              >
                ONE TAKE TO FINAL REEL
              </div>
            </div>

            <div
              style={{ width: `${100 - compareSplitPct}%` }}
              className="absolute inset-y-0 left-0 overflow-hidden border-r-2 border-[#f5a524] z-20"
            >
              <img
                src="/assets/raw_take.webp"
                alt="Raw take"
                className="w-full h-full object-cover filter grayscale-[25%]"
              />
              <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/70 text-xs font-mono text-zinc-300">
                Raw take
              </span>
            </div>
            <span className="absolute top-4 right-4 z-20 px-3 py-1 rounded-full bg-[#f5a524] text-black text-xs font-bold">
              AI Edit · {activeAiEditTab}
            </span>
          </div>
        </motion.div>
      </section>

      {/* SECTION 4: #how PAPER SECTION ("What happens to your take.") */}
      <section id="how" className="paper px-5 md:px-10 py-20 md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.45 }}
          className="max-w-[1180px] mx-auto space-y-12"
        >
          <div className="grid md:grid-cols-12 gap-8 items-end">
            <h2 className="md:col-span-7 font-display text-[clamp(2.4rem,5.4vw,5.4rem)] leading-[0.92] tracking-[-0.04em] text-[#17150f]">
              What happens <span className="text-[#b45f06]">to your take.</span>
            </h2>
            <p className="md:col-span-5 text-[15.5px] text-[#6b655a] leading-relaxed">
              Five things Captik does before you touch anything. Every one of them can be changed in the editor.
            </p>
          </div>

          <div className="grid md:grid-cols-12 gap-6">
            {/* 1. Hears you right */}
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.45, delay: 0.05 }}
              className="md:col-span-7 p-6 md:p-8 rounded-3xl bg-white/75 border border-[#17150f]/12 space-y-5"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-[#6b655a]">
                  WHAT SHE SAID · SAME TIMINGS IN EVERY SCRIPT
                </span>
                <div className="flex items-center gap-1 bg-[#f1ece2] p-1 rounded-full border border-[#17150f]/12">
                  {(
                    [
                      { id: 'hinglish', label: 'English letters' },
                      { id: 'hi', label: 'Hindi Script' },
                      { id: 'en', label: 'Translation' },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setHowScriptTab(tab.id)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer ${
                        howScriptTab === tab.id
                          ? 'bg-[#17150f] text-[#f1ece2]'
                          : 'text-[#6b655a] hover:text-[#17150f]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#17150f] text-[#f3efe7] font-display text-xl md:text-2xl font-bold">
                {howScriptTab === 'hinglish' &&
                  'Basically yeh feature try karo, it actually works.'}
                {howScriptTab === 'hi' &&
                  'Basically यह फ़ीचर try करो, यह सच में काम करता है।'}
                {howScriptTab === 'en' &&
                  'Basically, try this feature. It actually works.'}
              </div>

              <div>
                <h3 className="font-display text-2xl font-bold text-[#17150f]">
                  Hears you right.
                </h3>
                <p className="text-sm text-[#6b655a] mt-1 leading-relaxed">
                  Hinglish as you say it, and ten Indian languages. Every word is timed to the syllable, in English letters, the native script or a translation.
                </p>
              </div>
            </motion.div>

            {/* 2. Cuts the dead air */}
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.45, delay: 0.12 }}
              className="md:col-span-5 p-6 md:p-8 rounded-3xl bg-white/75 border border-[#17150f]/12 flex flex-col justify-between gap-5"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase text-[#6b655a]">
                    Your take · {howPauseTab === 'Off' ? '0:38' : howPauseTab === 'Natural' ? '0:33' : '0:29'}
                  </span>
                  <div className="flex gap-1 bg-[#f1ece2] p-1 rounded-full border border-[#17150f]/12">
                    {(['Off', 'Natural', 'Tight'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setHowPauseTab(m)}
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold cursor-pointer ${
                          howPauseTab === m
                            ? 'bg-[#b45f06] text-white'
                            : 'text-[#6b655a]'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-14 rounded-xl bg-[#17150f] px-3 flex items-center gap-1">
                  {Array.from({ length: 32 }, (_, i) => {
                    const isSilence = i % 7 === 0 || i % 11 === 0;
                    return (
                      <div
                        key={i}
                        style={{
                          height: isSilence
                            ? '18%'
                            : `${35 + ((i * 19) % 55)}%`,
                        }}
                        className={`flex-1 rounded-full transition-all ${
                          isSilence && howPauseTab !== 'Off'
                            ? 'bg-rose-500/40 scale-y-50'
                            : 'bg-[#f5a524]'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
              <div>
                <h3 className="font-display text-2xl font-bold text-[#17150f]">
                  Cuts the dead air.
                </h3>
                <p className="text-sm text-[#6b655a] mt-1 leading-relaxed">
                  Long pauses and bare ums come out of the export. Natural keeps your rhythm, Tight keeps it moving, and nothing is lost from the project.
                </p>
              </div>
            </motion.div>

            {/* 3, 4, 5 row */}
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.45, delay: 0.18 }}
              className="md:col-span-4 p-6 rounded-3xl bg-white/75 border border-[#17150f]/12 space-y-2"
            >
              <div className="text-xs font-mono uppercase text-[#b45f06]">106 TEMPLATES + HUMAN MASKING</div>
              <h3 className="font-display text-2xl font-bold text-[#17150f]">
                Sets every word.
              </h3>
              <p className="text-sm text-[#6b655a] leading-relaxed">
                106 looks, from one clean line to words behind your head with real-time human silhouette segmentation, plus OCR detection for text inside your video.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.45, delay: 0.24 }}
              className="md:col-span-4 p-6 rounded-3xl bg-white/75 border border-[#17150f]/12 space-y-2"
            >
              <div className="text-xs font-mono uppercase text-[#b45f06]">36 AI EDITS</div>
              <h3 className="font-display text-2xl font-bold text-[#17150f]">
                Edits like an editor.
              </h3>
              <p className="text-sm text-[#6b655a] leading-relaxed">
                AI Edits gives the hook a title, punches in on the words that land, and drops b roll where you mention something.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.45, delay: 0.3 }}
              className="md:col-span-4 p-6 rounded-3xl bg-white/75 border border-[#17150f]/12 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-[#b45f06]">TAP TO HEAR</span>
                <span className="text-xs text-[#6b655a]">277 sounds</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'Fast Whoosh', id: 'fast_air_whoosh' },
                  { label: 'Bass Drop', id: 'bass_drop' },
                  { label: 'Camera Shutter', id: 'camera_shutter' },
                  { label: 'Cash Register', id: 'cash_register' },
                  { label: 'Bubble Pop', id: 'bubble_pop' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => playSfxSound(s.id, 0.4)}
                    className="px-2.5 py-1 rounded-full bg-[#17150f] text-[#f1ece2] text-xs font-semibold flex items-center gap-1 hover:bg-[#b45f06] transition-colors cursor-pointer"
                  >
                    <Volume2 className="w-3 h-3 text-[#f5a524]" />
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
              <h3 className="font-display text-2xl font-bold text-[#17150f]">
                Adds the sounds.
              </h3>
              <p className="text-sm text-[#6b655a] leading-relaxed">
                277 licensed sounds with names you can search. AI Edits places them on the cuts, and you can move any of them.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* SECTION 5: #templates ("Same take. Change the look.") */}
      <section id="templates" className="dark-band px-5 md:px-10 py-20 md:py-28 border-b border-white/[0.08]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.45 }}
          className="max-w-[1180px] mx-auto space-y-8"
        >
          <div className="grid md:grid-cols-12 gap-8 items-end">
            <h2 className="md:col-span-7 font-display text-[clamp(2.4rem,5.4vw,5.4rem)] leading-[0.92] tracking-[-0.04em]">
              Same take. <span className="text-[#f5a524]">Change the look.</span>
            </h2>
            <p className="md:col-span-5 text-[15.5px] text-[#8f8a82] leading-relaxed">
              Every template is on the same take, so the stage changes look without cutting. Point at a name to see it, click to use it on your video.
            </p>
          </div>

          {/* Interactive Category Switcher inside Homepage #templates */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'showcase', label: 'Featured 12' },
                { id: 'popular', label: 'Popular (16)' },
                { id: 'behind', label: 'Behind you (29)' },
                { id: 'bold', label: 'Bold & animated (16)' },
                { id: 'clean', label: 'Clean (20)' },
                { id: 'realestate', label: 'Property reels (20)' },
                { id: 'split', label: 'Around you (21)' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setHomeTemplateCategory(cat.id);
                    const nextList =
                      cat.id === 'showcase'
                        ? HOME_SHOWCASE_TEMPLATES.map((item) => findTemplate(item.id))
                        : filterTemplates(TEMPLATES, cat.id, '');
                    if (nextList[0]) {
                      setHomeShowcaseId(nextList[0].id);
                    }
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    homeTemplateCategory === cat.id
                      ? 'bg-[#f5a524] text-[#120d02]'
                      : 'bg-white/[0.06] text-[#f3efe7] hover:bg-white/[0.12]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => onChangeView('templates')}
              className="text-xs font-bold text-[#f5a524] hover:underline cursor-pointer"
            >
              Browse all 106 templates →
            </button>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {homeCategoryTemplates.map((item, tIdx) => {
                const active = homeShowcaseId === item.tpl.id;
                const tplSpec = item.tpl;
                return (
                  <motion.button
                    key={tplSpec.id}
                    type="button"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: (tIdx % 6) * 0.06 }}
                    onMouseEnter={() => setHomeShowcaseId(tplSpec.id)}
                    onClick={() => onSelectTemplateAndOpenEditor(tplSpec)}
                    className={`group relative rounded-2xl overflow-hidden border text-left transition-all cursor-pointer p-3 flex flex-col justify-between min-h-[138px] ${
                      active
                        ? 'bg-[#1a1813] border-[#f5a524] ring-2 ring-[#f5a524]/30'
                        : 'bg-[#121216] border-white/[0.08] hover:border-white/25'
                    }`}
                  >
                    <img
                      src={tplSpec.previewPosterUrl}
                      alt={tplSpec.name}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = tplSpec.behind
                          ? '/assets/terrace_behind.webp'
                          : '/assets/terrace_poster.webp';
                      }}
                      className="absolute inset-0 w-full h-full object-cover opacity-55 group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/35 pointer-events-none" />

                    <div className="relative z-10 flex items-center justify-between text-[10px] font-mono text-[#8f8a82]">
                      <span className="text-zinc-300 font-bold">{item.num}</span>
                      <span className="px-1.5 py-0.5 rounded bg-[#f5a524]/20 text-[#f5a524] font-bold">
                        {item.tag}
                      </span>
                    </div>

                    <div className="relative z-10 my-auto py-1.5 flex items-center justify-center overflow-hidden pointer-events-none scale-90">
                      <CaptikCardPreview template={tplSpec} />
                    </div>

                    <div className="relative z-10 font-display text-sm font-bold text-[#f3efe7] truncate pt-1 border-t border-white/10">
                      {tplSpec.name}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <div className="lg:col-span-5 flex flex-col items-center gap-4">
              <div className="w-[270px] aspect-[9/15] rounded-3xl overflow-hidden border border-[#f5a524]/50 bg-[#12131a] relative p-4 flex flex-col justify-between shadow-2xl">
                <img
                  src={activeShowcaseTpl.previewPosterUrl}
                  alt={activeShowcaseTpl.name}
                  onError={(e) => {
                    e.currentTarget.src = '/assets/terrace_behind.webp';
                  }}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/30" />
                <div className="relative z-10 flex justify-between items-center">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#f5a524] text-black text-[10px] font-bold uppercase">
                    {activeShowcaseTpl.name}
                  </span>
                  {activeShowcaseTpl.behind && (
                    <span className="px-2 py-0.5 rounded-full bg-black/70 text-[#f5a524] text-[10px] font-mono">
                      BEHIND YOU · HUMAN MASK
                    </span>
                  )}
                </div>
                <div className="relative z-10 my-auto py-4 flex items-center justify-center">
                  <CaptikCardPreview template={activeShowcaseTpl} />
                </div>
                <button
                  type="button"
                  onClick={() => onSelectTemplateAndOpenEditor(activeShowcaseTpl)}
                  className="relative z-10 w-full py-2.5 rounded-xl bg-[#f5a524] text-black font-bold text-xs cursor-pointer"
                >
                  Use {activeShowcaseTpl.name} on my video →
                </button>
              </div>

              <button
                type="button"
                onClick={() => onChangeView('templates')}
                className="text-sm font-semibold text-[#f5a524] hover:underline cursor-pointer"
              >
                106 templates in all · See all 106 →
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* SECTION 6: #ai-styles ("36 ways to edit one take.") */}
      <section id="ai-styles" className="dark-band px-5 md:px-10 py-20 md:py-28 border-b border-white/[0.08]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.45 }}
          className="max-w-[1180px] mx-auto space-y-8"
        >
          <div className="grid md:grid-cols-12 gap-8 items-end">
            <h2 className="md:col-span-7 font-display text-[clamp(2.4rem,5.4vw,5.4rem)] leading-[0.92] tracking-[-0.04em]">
              36 ways to edit <span className="text-[#f5a524]">one take.</span>
            </h2>
            <p className="md:col-span-5 text-[15.5px] text-[#8f8a82] leading-relaxed">
              Each style plans its own titles, cards, b roll, zooms and sounds for what you said. Pick one, then change anything in it.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
            {AI_EDIT_LOOKS.map((look, lIdx) => (
              <motion.button
                key={look.id}
                type="button"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: (lIdx % 6) * 0.05 }}
                onClick={() => onChangeView('editor')}
                className="p-2.5 rounded-2xl bg-[#121216] hover:bg-[#191920] border border-white/[0.08] hover:border-[#f5a524]/50 text-left transition-all cursor-pointer flex flex-col justify-between gap-2"
              >
                <div
                  className="relative h-16 w-full rounded-xl overflow-hidden flex flex-col items-center justify-center px-2 border border-white/10"
                  style={{ backgroundColor: look.bgCard || '#0f1015' }}
                >
                  <img
                    src={
                      look.behindSubject
                        ? '/assets/terrace_behind.webp'
                        : '/assets/terrace_poster.webp'
                    }
                    alt={look.name}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover opacity-45"
                  />
                  <div
                    style={{
                      fontFamily: look.fontFamily,
                      fontWeight: look.fontWeight,
                      color: look.accent,
                      textShadow: `0 0 10px ${look.accent}66, 0 2px 6px rgba(0,0,0,0.85)`,
                      textTransform: look.uppercase
                        ? 'uppercase'
                        : look.lowercase
                        ? 'lowercase'
                        : 'none',
                    }}
                    className="relative z-10 text-sm font-black tracking-tight truncate"
                  >
                    {look.name}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#f3efe7] truncate">
                      {look.name}
                    </span>
                    <span className="text-[9px] font-mono uppercase text-[#f5a524]">
                      {look.zoomIntensity}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#8f8a82] truncate mt-0.5">
                    {look.tagline}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </section>

      {/* SECTION 7: #editor ("Then make it yours.") — Exact match to captik.in/#editor */}
      <section id="editor" className="dark-band px-5 md:px-10 py-20 md:py-28 border-b border-white/[0.08]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.45 }}
          className="max-w-[1180px] mx-auto space-y-12"
        >
          <div className="grid md:grid-cols-12 gap-8 items-end">
            <h2 className="md:col-span-7 font-display text-[clamp(2.5rem,5.6vw,6rem)] leading-[0.9] tracking-[-0.04em]">
              Then make it <span className="text-[#f5a524]">yours.</span>
            </h2>
            <div className="md:col-span-5 space-y-4">
              <p className="text-[15.5px] leading-relaxed text-[#8f8a82] max-w-[420px]">
                The edit opens in a real editor, in your browser, on a laptop or a phone. Nothing is baked in until you export.
              </p>
              <div className="inline-flex items-center gap-1 p-1 rounded-full bg-white/[0.05] border border-white/10">
                <button
                  type="button"
                  onClick={() => setEditorPreviewDevice('desktop')}
                  className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    editorPreviewDevice === 'desktop'
                      ? 'bg-[#f5a524] text-[#120d02]'
                      : 'text-[#8f8a82] hover:text-white'
                  }`}
                >
                  Laptop browser
                </button>
                <button
                  type="button"
                  onClick={() => setEditorPreviewDevice('phone')}
                  className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    editorPreviewDevice === 'phone'
                      ? 'bg-[#f5a524] text-[#120d02]'
                      : 'text-[#8f8a82] hover:text-white'
                  }`}
                >
                  Phone browser
                </button>
              </div>
            </div>
          </div>

          {/* Authentic Browser Frame showing captik_desk.webp & captik_phone.webp */}
          <div
            onClick={() => onChangeView('editor')}
            className="rounded-[22px] border border-white/[0.12] bg-[#0b0d13] overflow-hidden shadow-[0_60px_140px_-40px_rgba(0,0,0,0.95)] cursor-pointer group"
          >
            <div className="flex items-center gap-3 h-11 px-4 border-b border-white/[0.07] bg-white/[0.02]">
              <span className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
              </span>
              <span className="flex-1 flex justify-center min-w-0">
                <span className="px-3 py-1 rounded-md bg-white/[0.04] border border-white/[0.05] text-[11.5px] text-[#8b90a0] truncate">
                  captik.in/editor · terrace_reel.mp4 (Click to launch interactive editor)
                </span>
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#f5a524] text-[#120d02] text-[11.5px] font-semibold">
                <Download className="w-3 h-3" /> Export
              </span>
            </div>
            {editorPreviewDevice === 'desktop' ? (
              <div className="relative aspect-[1440/900] bg-black overflow-hidden">
                <img
                  src="/assets/captik_desk.webp"
                  alt="The Captik editor at work on laptop"
                  className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-300"
                />
              </div>
            ) : (
              <div className="py-10 bg-[#07080c] flex items-center justify-center">
                <div className="w-[300px] rounded-[28px] overflow-hidden border border-white/15 shadow-2xl">
                  <img
                    src="/assets/captik_phone.webp"
                    alt="The Captik editor on phone"
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            )}
          </div>

          <ul className="grid grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-8">
            {[
              {
                title: 'A timeline of clips',
                desc: 'Every cut is a clip with its name and length. Trim, split and move video and audio clips like any editor.',
              },
              {
                title: 'Every word & OCR text, yours',
                desc: 'Retype, retime, recolour, mask or make any word or detected video text bigger. The export draws exactly what you see.',
              },
              {
                title: 'Keyframes on anything',
                desc: 'Move, scale and turn the picture over time, and grade it with your own curves.',
              },
              {
                title: 'Sounds and graphics',
                desc: '277 named sounds, and graphics suggested for the line at the playhead.',
              },
              {
                title: 'Your fonts',
                desc: 'Use 127 curated Google Fonts or upload your own font file.',
              },
              {
                title: 'Every shape, up to 4K',
                desc: '9:16 for Reels and Shorts, 16:9 for YouTube, 1:1 and 4:5 for the feed.',
              },
            ].map((item, bIdx) => (
              <motion.li
                key={item.title}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: bIdx * 0.08 }}
                className="border-t border-white/[0.12] pt-5"
              >
                <p className="text-[16px] md:text-[17px] font-semibold text-[#f3efe7]">
                  {item.title}
                </p>
                <p className="mt-2 text-[14px] leading-relaxed text-[#8f8a82]">
                  {item.desc}
                </p>
              </motion.li>
            ))}
          </ul>

          <div className="rounded-[24px] border border-white/[0.12] p-6 md:p-8 flex flex-col lg:flex-row lg:items-center gap-6 justify-between">
            <div className="lg:w-[38%]">
              <p className="font-display text-2xl md:text-3xl font-bold">
                Works where you edit.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[#8f8a82]">
                Nothing to install for the browser. In Premiere Pro, After Effects and DaVinci Resolve, the plugin puts the captions on your timeline as layers you can edit.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {[
                'Any phone',
                'Any laptop',
                'Premiere Pro',
                'After Effects',
                'DaVinci Resolve',
              ].map((plat) => (
                <span
                  key={plat}
                  className="px-4 py-2 rounded-full border border-white/[0.14] text-sm font-medium text-[#f3efe7]"
                >
                  {plat}
                </span>
              ))}
              <button
                type="button"
                onClick={() => onChangeView('plugin')}
                className="px-4 py-2 rounded-full bg-[#f5a524] text-[#120d02] text-sm font-bold cursor-pointer"
              >
                Get the plugin →
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* SECTION 8: #pricing PAPER SECTION ("Pay for what you post.") */}
      <section id="pricing" className="paper px-5 md:px-10 py-20 md:py-28">
        <div className="max-w-[1180px] mx-auto space-y-10">
          <div className="grid md:grid-cols-12 gap-8 items-end">
            <h2 className="md:col-span-7 font-display text-[clamp(2.4rem,5.4vw,5.4rem)] leading-[0.92] tracking-[-0.04em] text-[#17150f]">
              Pay for what <span className="text-[#b45f06]">you post.</span>
            </h2>
            <p className="md:col-span-5 text-[15.5px] text-[#6b655a] leading-relaxed">
              Tools that edit reels for you charge Rs. 1,800 to Rs. 3,500 a month. Captik captions, cuts and edits from Rs. 349, GST included, paid by UPI in seconds.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: 0.08 }}
              className="p-6 rounded-2xl bg-white/80 border border-[#17150f]/15 flex items-center justify-between gap-4"
            >
              <div>
                <div className="text-xs font-mono uppercase text-[#b45f06]">
                  One clean video
                </div>
                <div className="font-display text-3xl font-bold text-[#17150f] mt-1">
                  ₹20 <span className="text-base font-normal text-[#6b655a]">a video</span>
                </div>
                <p className="text-xs text-[#6b655a] mt-1">
                  The watermark off the video you are exporting, for good.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onChangeView('editor')}
                className="px-5 py-2.5 rounded-full bg-[#17150f] text-[#f1ece2] text-xs font-bold shrink-0 cursor-pointer"
              >
                Start free
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: 0.18 }}
              className="p-6 rounded-2xl bg-white/80 border border-[#17150f]/15 flex items-center justify-between gap-4"
            >
              <div>
                <div className="text-xs font-mono uppercase text-[#b45f06]">
                  A week of Starter
                </div>
                <div className="font-display text-3xl font-bold text-[#17150f] mt-1">
                  ₹99 <span className="text-base font-normal text-[#6b655a]">for 7 days</span>
                </div>
                <p className="text-xs text-[#6b655a] mt-1">
                  9 caption minutes, 13 export minutes, no watermark. Paid once, nothing renews.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onChangeView('pricing')}
                className="px-5 py-2.5 rounded-full bg-[#b45f06] text-white text-xs font-bold shrink-0 cursor-pointer"
              >
                See all plans
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION 9: #faq ("Before you upload.") */}
      <section id="faq" className="dark-band px-5 md:px-10 py-20 md:py-28 border-b border-white/[0.08]">
        <div className="max-w-[1180px] mx-auto grid md:grid-cols-12 gap-10">
          <div className="md:col-span-4 space-y-3">
            <h2 className="font-display text-4xl md:text-5xl font-bold leading-none">
              Before you <span className="text-[#f5a524]">upload.</span>
            </h2>
            <p className="text-sm text-[#8f8a82]">
              Everything you need to know about Captik, Indian language transcription, OCR text detection, and video exports.
            </p>
          </div>

          <div className="md:col-span-8 divide-y divide-white/[0.08]">
            {FAQ_ITEMS.map((item, fIdx) => {
              const isOpen = openFaqNum === item.num;
              return (
                <motion.div
                  key={item.num}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: fIdx * 0.04 }}
                  className="py-4"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setOpenFaqNum(isOpen ? null : item.num)
                    }
                    className="w-full flex items-center justify-between text-left gap-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-xs text-[#f5a524]">
                        {item.num}
                      </span>
                      <span className="text-base font-semibold text-[#f3efe7]">
                        {item.q}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-[#8f8a82] transition-transform ${
                        isOpen ? 'rotate-180 text-[#f5a524]' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <p className="mt-3 pl-8 text-sm text-[#8f8a82] leading-relaxed">
                      {item.a}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 10: BOTTOM UPLOAD CTA ("Your next reel is one take away.") */}
      <section className="dark-band px-5 md:px-10 py-20 md:py-28">
        <div className="max-w-[820px] mx-auto text-center space-y-8">
          <h2 className="font-display text-[clamp(2.6rem,6vw,5.6rem)] font-bold leading-[0.92] tracking-[-0.04em]">
            Your next reel is <span className="text-[#f5a524]">one take</span> away.
          </h2>

          <div className="rounded-2xl bg-[#121216] border border-white/15 p-4 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={() => heroFileInputRef.current?.click()}
              className="flex-1 w-full px-4 py-4 rounded-xl border border-dashed border-white/20 hover:border-[#f5a524] text-left cursor-pointer"
            >
              <div className="text-sm font-semibold text-[#f3efe7]">
                Drop a video here
              </div>
              <div className="text-xs text-[#8f8a82]">
                or choose a file · MP4, MOV, WebM, any size
              </div>
            </button>
            <button
              type="button"
              onClick={onOpenNewProjectModal}
              className="w-full sm:w-auto px-6 py-4 rounded-xl bg-[#f5a524] hover:bg-[#fbbf24] text-[#120d02] font-bold text-sm cursor-pointer"
            >
              Caption my video
            </button>
          </div>

          <p className="text-xs text-[#8f8a82]">
            <strong className="text-[#f3efe7]">2,952</strong> videos exported in the last 24 hours · Free to try, no login required.
          </p>
        </div>
      </section>

      {/* Floating Email Us Button matching exact captik.in screenshot */}
      <a
        href="mailto:support@captik.in"
        className="fixed bottom-6 right-5 z-40 px-3.5 py-2 rounded-full bg-[#18181c]/95 hover:bg-[#232328] border border-white/15 backdrop-blur-md text-[#f3efe7] text-xs font-semibold shadow-2xl flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
      >
        <span className="w-5 h-5 rounded-full bg-[#f5a524] text-[#120d02] flex items-center justify-center shrink-0">
          <Mail className="w-3 h-3 stroke-[2.5]" />
        </span>
        <span>Email us</span>
      </a>

      <CaptikFooter onChangeView={onChangeView} />
    </div>
  );
};

// ==================== STUDIO MODALS (NEW PROJECT + UPLOAD + OCR, REAL EXPORT, HELP) ====================
interface StudioModalProps {
  exportModalOpen: boolean;
  onCloseExportModal: () => void;
  helpModalOpen: boolean;
  onCloseHelpModal: () => void;
  newProjectModalOpen: boolean;
  onCloseNewProjectModal: () => void;
  onCreateProjectFromFile: (
    file: File,
    projectName?: string,
    autoRunOcr?: boolean
  ) => Promise<void>;
  onGenerateAndImportSampleVideo: (
    projectName: string,
    sceneTexts: [string, string, string],
    autoRunOcr: boolean
  ) => Promise<void>;
  onRunRealVideoExport: (onProgress: (pct: number) => void) => Promise<Blob>;
  projectName: string;
  quality: ExportQuality;
  aspectRatio: string;
  templateName: string;
  detectedTextCount: number;
  onDownloadSrt: () => void;
}

export const StudioModals: React.FC<StudioModalProps> = ({
  exportModalOpen,
  onCloseExportModal,
  helpModalOpen,
  onCloseHelpModal,
  newProjectModalOpen,
  onCloseNewProjectModal,
  onCreateProjectFromFile,
  onGenerateAndImportSampleVideo,
  onRunRealVideoExport,
  projectName,
  quality,
  aspectRatio,
  templateName,
  detectedTextCount,
  onDownloadSrt,
}) => {
  // New Project Modal States
  const [customTitle, setCustomTitle] = useState<string>('');
  const [autoRunOcr, setAutoRunOcr] = useState<boolean>(true);
  const [scene1Text, setScene1Text] = useState<string>('MUMBAI TECH VLOG');
  const [scene2Text, setScene2Text] = useState<string>('BUILD FAST SHIP DAILY');
  const [scene3Text, setScene3Text] = useState<string>('SUBSCRIBE FOR REELS');
  const [isCreatingProject, setIsCreatingProject] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const newProjFileRef = useRef<HTMLInputElement | null>(null);

  // Real Video Export Modal States
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleUploadFileChosen = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCreatingProject(true);
    setCreateError(null);
    try {
      await onCreateProjectFromFile(
        file,
        customTitle.trim() || undefined,
        autoRunOcr
      );
      setCustomTitle('');
      onCloseNewProjectModal();
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : 'Failed to import video file.'
      );
    } finally {
      setIsCreatingProject(false);
      e.target.value = '';
    }
  };

  const handleGenerateCustomClip = async () => {
    setIsCreatingProject(true);
    setCreateError(null);
    try {
      const nameToUse = customTitle.trim() || 'Mumbai Vlog Take';
      await onGenerateAndImportSampleVideo(
        nameToUse,
        [
          scene1Text.trim() || 'MUMBAI TECH VLOG',
          scene2Text.trim() || 'BUILD FAST SHIP DAILY',
          scene3Text.trim() || 'SUBSCRIBE FOR REELS',
        ],
        autoRunOcr
      );
      setCustomTitle('');
      onCloseNewProjectModal();
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : 'Failed to generate video clip.'
      );
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleTriggerRealExport = async () => {
    setIsRendering(true);
    setExportError(null);
    setExportProgress(5);
    try {
      const blob = await onRunRealVideoExport((pct) => setExportProgress(pct));
      const url = URL.createObjectURL(blob);
      setExportedVideoUrl(url);

      // Automatically trigger browser download of the rendered video
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName.replace(/\s+/g, '_')}_${quality}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      setExportError(
        err instanceof Error ? err.message : 'Export rendering failed.'
      );
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <>
      {/* ==================== 1. NEW PROJECT & VIDEO UPLOAD MODAL ==================== */}
      {newProjectModalOpen && (
        <div
          data-testid="new-project-modal"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="w-full max-w-lg rounded-2xl bg-[#141419] border border-white/15 p-6 space-y-5 shadow-2xl text-[#f3efe7]">
            <input
              ref={newProjFileRef}
              type="file"
              data-testid="new-project-file-input"
              accept="video/*"
              onChange={handleUploadFileChosen}
              className="hidden"
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CaptikLogoIcon className="w-7 h-7" />
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    Create New Video Project
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Upload a video from your device & run automatic OCR text detection
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onCloseNewProjectModal}
                aria-label="Close new project modal"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Project Title + Auto OCR Toggle */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Project Title (Optional)
                </label>
                <input
                  type="text"
                  data-testid="new-project-title-input"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Bandra Street Reel, Product Demo..."
                  className="w-full bg-[#0d0d11] border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#f5a524]"
                />
              </div>

              <label className="flex items-center justify-between p-3 rounded-xl bg-[#1a1a22] border border-white/[0.08] cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <ScanText className="w-4 h-4 text-[#f5a524]" />
                  <div>
                    <div className="text-xs font-bold text-white">
                      Automatically Detect Text in Video (Real OCR)
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      Scans video frames with Tesseract OCR to extract editable text & positions
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autoRunOcr}
                  onChange={(e) => setAutoRunOcr(e.target.checked)}
                  className="w-4 h-4 accent-[#f5a524]"
                />
              </label>
            </div>

            {/* Option A: Upload Video File from Device */}
            <button
              type="button"
              data-testid="modal-upload-device-video-btn"
              disabled={isCreatingProject}
              onClick={() => newProjFileRef.current?.click()}
              className="w-full py-5 px-4 rounded-2xl border-2 border-dashed border-[#f5a524]/50 bg-[#f5a524]/[0.07] hover:bg-[#f5a524]/[0.14] flex flex-col items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <div className="w-10 h-10 rounded-full bg-[#f5a524] text-black flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <div className="text-sm font-extrabold text-white">
                Select Video File from Your Device
              </div>
              <div className="text-xs text-zinc-400">
                Supports MP4, WebM, MOV · Creates a brand-new editing project
              </div>
            </button>

            {/* Option B: Generate a Fresh Video with Custom Burned-In Text to Test OCR */}
            <div className="p-3.5 rounded-2xl bg-[#0e0f14] border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5" />
                  <span>Or Generate Custom Video with Burned-In Text</span>
                </span>
                <span className="text-[10px] font-mono text-zinc-400">
                  3.6s WebM · 3 Scenes
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Don’t have a test video with burned-in text handy? Customize the 3 frame texts below to synthesize a real video file and run live OCR detection on it:
              </p>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  data-testid="sample-scene-1-input"
                  value={scene1Text}
                  onChange={(e) => setScene1Text(e.target.value)}
                  className="bg-[#161820] border border-white/10 rounded-lg px-2 py-1.5 text-[11px] font-bold text-white"
                  placeholder="Scene 1 text"
                />
                <input
                  type="text"
                  data-testid="sample-scene-2-input"
                  value={scene2Text}
                  onChange={(e) => setScene2Text(e.target.value)}
                  className="bg-[#161820] border border-white/10 rounded-lg px-2 py-1.5 text-[11px] font-bold text-white"
                  placeholder="Scene 2 text"
                />
                <input
                  type="text"
                  data-testid="sample-scene-3-input"
                  value={scene3Text}
                  onChange={(e) => setScene3Text(e.target.value)}
                  className="bg-[#161820] border border-white/10 rounded-lg px-2 py-1.5 text-[11px] font-bold text-white"
                  placeholder="Scene 3 text"
                />
              </div>
              <button
                type="button"
                data-testid="generate-custom-video-btn"
                disabled={isCreatingProject}
                onClick={handleGenerateCustomClip}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {isCreatingProject ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Recording Video & Initializing Project...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Create Video & Run Automatic OCR Detection</span>
                  </>
                )}
              </button>
            </div>

            {createError && (
              <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/40 text-xs text-rose-300">
                {createError}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== 2. REAL VIDEO EXPORT MODAL ==================== */}
      {exportModalOpen && (
        <div
          data-testid="export-modal"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-[#141419] border border-white/15 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CaptikLogoIcon className="w-7 h-7" />
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    Export Captik Video
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {projectName} • {quality} • {aspectRatio}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onCloseExportModal}
                aria-label="Close export modal"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0e1016] border border-white/[0.07] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400">Active Caption Template</span>
                <span className="font-bold text-[#f5a524]">{templateName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Detected OCR Text Layers</span>
                <span className="font-mono font-bold text-emerald-400">
                  {detectedTextCount} layer{detectedTextCount === 1 ? '' : 's'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Render Resolution</span>
                <span className="font-mono font-bold text-white">
                  {quality} (30fps Canvas Burn-In)
                </span>
              </div>
            </div>

            {isRendering ? (
              <div className="space-y-2" data-testid="export-rendering-state">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[#f5a524]">
                    Rendering video frames, OCR replacements & captions...
                  </span>
                  <span className="font-mono tabular-nums text-white">
                    {exportProgress}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    style={{ width: `${exportProgress}%` }}
                    className="h-full bg-[#f5a524] transition-all duration-200"
                  />
                </div>
              </div>
            ) : exportedVideoUrl ? (
              <div
                data-testid="export-complete-banner"
                className="space-y-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30"
              >
                <div className="flex items-center justify-between text-xs text-emerald-300 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Check className="w-4 h-4" />
                    <span>Video Export Complete!</span>
                  </span>
                  <a
                    href={exportedVideoUrl}
                    download={`${projectName.replace(/\s+/g, '_')}_${quality}.webm`}
                    className="underline text-[#f5a524]"
                  >
                    Save File Again
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-3 py-2 rounded-lg">
                <Check className="w-4 h-4 shrink-0" />
                <span>
                  Ready to render burned-in video or download SubRip (.SRT).
                </span>
              </div>
            )}

            {exportError && (
              <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/35 text-xs text-rose-300">
                {exportError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                data-testid="modal-download-srt-btn"
                onClick={onDownloadSrt}
                className="py-2.5 px-3 rounded-xl bg-[#1d202d] hover:bg-[#262a3a] border border-white/10 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-zinc-300" />
                <span>Download .SRT</span>
              </button>

              <button
                type="button"
                data-testid="modal-render-video-btn"
                disabled={isRendering}
                onClick={handleTriggerRealExport}
                className="py-2.5 px-3 rounded-xl bg-[#f5a524] hover:bg-[#fbbf24] disabled:opacity-50 text-black text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>
                  {isRendering ? 'Rendering...' : `Render Video (${quality})`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 3. HELP & SHORTCUTS MODAL ==================== */}
      {helpModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#14161f] border border-white/15 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#f5a524]" />
                <h3 className="text-base font-extrabold text-white">
                  Captik Studio Shortcuts & Guide
                </h3>
              </div>
              <button
                type="button"
                onClick={onCloseHelpModal}
                aria-label="Close help modal"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#0e1016]">
                <span className="text-zinc-300 flex items-center gap-1.5">
                  <Keyboard className="w-3.5 h-3.5 text-[#f5a524]" />
                  Play / Pause Video
                </span>
                <kbd className="px-2 py-0.5 rounded bg-zinc-800 text-[#f5a524] font-mono">
                  Space
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#0e1016]">
                <span className="text-zinc-300">
                  Detect Burned-In Video Text (OCR)
                </span>
                <kbd className="px-2 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono">
                  Text → Video OCR
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#0e1016]">
                <span className="text-zinc-300">
                  Edit Word or OCR Text Inline
                </span>
                <kbd className="px-2 py-0.5 rounded bg-zinc-800 text-[#f5a524] font-mono">
                  Double-Click
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#0e1016]">
                <span className="text-zinc-300 flex items-center gap-1.5">
                  <Languages className="w-3.5 h-3.5 text-emerald-400" />
                  Switch Hinglish / Devanagari / Tamil / Bengali
                </span>
                <kbd className="px-2 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono">
                  Caption Settings
                </kbd>
              </div>
            </div>

            <button
              type="button"
              onClick={onCloseHelpModal}
              className="w-full py-2 rounded-xl bg-[#f5a524] text-black font-bold text-xs cursor-pointer"
            >
              Got it, back to editing
            </button>
          </div>
        </div>
      )}
    </>
  );
};
