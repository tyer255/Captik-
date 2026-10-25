import React, { useState, useRef } from 'react';
import {
  FolderOpen,
  Volume2,
  Type,
  Shapes,
  Captions,
  SlidersHorizontal,
  Sparkles,
  Upload,
  Plus,
  Search,
  Play,
  Scissors,
  Trash2,
  ChevronDown,
  ChevronRight,
  Undo2,
  Redo2,
  Check,
  Wand2,
  Languages,
  RotateCcw,
  ScanText,
  Eye,
  EyeOff,
  Loader2,
  PersonStanding,
  ArrowRight,
  Film,
  Palette,
} from 'lucide-react';
import {
  MEDIA_LIBRARY_ASSETS,
  ANIM_IN,
  ANIM_OUT,
  ANIM_LOOP,
  ANIM_COMBO,
  BOLD_TEXT_PRESETS,
  GRAPHIC_CATEGORIES,
  GRAPHIC_ELEMENTS,
  SFX_GROUPS,
  SFX_LIBRARY,
  LUT_FILTERS,
  VIDEO_EFFECTS_LIST,
  SPEED_CURVES,
  AI_TOOLS_CATALOG,
  INDIAN_SCRIPTS,
  playSfxSound,
  type MediaAssetItem,
} from '../data/assetsCatalog';
import {
  AI_EDIT_LOOKS,
  TEMPLATES,
  TEMPLATE_TABS,
  type CaptionTemplateSpec,
} from '../data/templatesCatalog';
import {
  formatSegmentRange,
  getWordTextForScript,
  filterTemplates,
  type CaptionSegment,
  type ColorAdjustments,
  DEFAULT_ADJUSTMENTS,
} from '../utils/editorLogic';
import { CaptikCardPreview } from './CaptikTemplateRenderer';
import type {
  CaptikProject,
  DetectedVideoTextItem,
} from '../utils/projectAndOcrLogic';
import type { OcrScanProgress } from '../utils/videoOcrEngine';

export type LeftRailTab =
  | 'media'
  | 'audio'
  | 'text'
  | 'styles'
  | 'elements'
  | 'captions'
  | 'adjustment'
  | 'ai';

interface LeftSidebarPanelProps {
  activeTab: LeftRailTab;
  onSelectTab: (tab: LeftRailTab) => void;
  segments: CaptionSegment[];
  activeSegmentId: string;
  currentTime: number;
  linesMode: 1 | 2;
  onChangeLinesMode: (mode: 1 | 2) => void;
  activeScript: string;
  onChangeScript: (scriptId: string) => void;
  pauseMode: 'Off' | 'Natural' | 'Tight';
  onChangePauseMode: (mode: 'Off' | 'Natural' | 'Tight') => void;
  onSeekTo: (seconds: number) => void;
  onCycleWordEmphasis: (segmentId: string, wordId: string) => void;
  onUpdateWordText: (segmentId: string, wordId: string, newText: string) => void;
  onSplitSegment: (segmentId: string, wordIndex: number) => void;
  onToggleSegmentBehind: (segmentId: string) => void;
  onDeleteSegment: (segmentId: string) => void;
  onAddCaptionSegment: () => void;
  onImportSrtText: (srtContent: string) => void;
  activeMediaAsset: MediaAssetItem;
  onSelectMediaAsset: (asset: MediaAssetItem) => void;
  onUploadCustomVideo: (file: File) => void;
  onAddTextOverlay: (label: string, presetId?: string, color?: string) => void;
  onApplyTextAnimation: (
    type: 'in' | 'out' | 'loop' | 'combo',
    animName: string
  ) => void;
  activeTextAnimations: { in: string; out: string; loop: string };
  onAddGraphicElement: (el: (typeof GRAPHIC_ELEMENTS)[number]) => void;
  onAddSfxToTimeline: (sfx: (typeof SFX_LIBRARY)[number]) => void;
  adjustments: ColorAdjustments;
  onChangeAdjustments: (next: ColorAdjustments) => void;
  activeAiLookId: string;
  onApplyAiLook: (lookId: string) => void;
  onTriggerAiTool: (toolId: string, option?: string) => void;
  aiToolStatus: Record<string, string>;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  // Project & Real OCR Detection Props
  projects: CaptikProject[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onOpenNewProjectModal: () => void;
  detectedTexts: DetectedVideoTextItem[];
  selectedDetectedTextId: string | null;
  onSelectDetectedText: (id: string | null) => void;
  onUpdateDetectedText: (id: string, patch: Partial<DetectedVideoTextItem>) => void;
  onDeleteDetectedText: (id: string) => void;
  onAddManualDetectedText: () => void;
  onSyncOcrToCaptions: () => void;
  onTriggerOcrScan: () => void;
  ocrProgress: OcrScanProgress | null;
  ocrError: string | null;
  activeTemplate: CaptionTemplateSpec;
  onSelectTemplate: (tpl: CaptionTemplateSpec) => void;
}

const RAIL_ITEMS: {
  id: LeftRailTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'media', label: 'Media', icon: FolderOpen },
  { id: 'audio', label: 'Audio', icon: Volume2 },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'styles', label: 'Styles', icon: Palette },
  { id: 'elements', label: 'Elements', icon: Shapes },
  { id: 'captions', label: 'Captions', icon: Captions },
  { id: 'adjustment', label: 'Adjustment', icon: SlidersHorizontal },
  { id: 'ai', label: 'AI tools', icon: Sparkles },
];

export const LeftSidebarPanel: React.FC<LeftSidebarPanelProps> = ({
  activeTab,
  onSelectTab,
  segments,
  activeSegmentId,
  linesMode,
  onChangeLinesMode,
  activeScript,
  onChangeScript,
  pauseMode,
  onChangePauseMode,
  onSeekTo,
  onCycleWordEmphasis,
  onUpdateWordText,
  onSplitSegment,
  onToggleSegmentBehind,
  onDeleteSegment,
  onAddCaptionSegment,
  onImportSrtText,
  activeMediaAsset,
  onSelectMediaAsset,
  onUploadCustomVideo,
  onAddTextOverlay,
  onApplyTextAnimation,
  activeTextAnimations,
  onAddGraphicElement,
  onAddSfxToTimeline,
  adjustments,
  onChangeAdjustments,
  activeAiLookId,
  onApplyAiLook,
  onTriggerAiTool,
  aiToolStatus,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  projects,
  activeProjectId,
  onSelectProject,
  onDeleteProject,
  onOpenNewProjectModal,
  detectedTexts,
  selectedDetectedTextId,
  onSelectDetectedText,
  onUpdateDetectedText,
  onDeleteDetectedText,
  onAddManualDetectedText,
  onSyncOcrToCaptions,
  onTriggerOcrScan,
  ocrProgress,
  ocrError,
  activeTemplate,
  onSelectTemplate,
}) => {
  const [captionSettingsOpen, setCaptionSettingsOpen] = useState(false);
  const [editingWordKey, setEditingWordKey] = useState<string | null>(null);
  const [editingWordValue, setEditingWordValue] = useState('');

  // Audio SFX states
  const [sfxSearch, setSfxSearch] = useState('');
  const [selectedSfxGroup, setSelectedSfxGroup] = useState<string>('all');
  const [playingSfxId, setPlayingSfxId] = useState<string | null>(null);

  // Text tab states: 'styles' (106 Captik Styles) | 'ocr' (Automatic Video Text Detection) | 'lockups' (Bold Text Lockups & Animations)
  const [textModeTab, setTextModeTab] = useState<'ocr' | 'styles' | 'lockups'>('ocr');
  const [animSubTab, setAnimSubTab] = useState<'in' | 'out' | 'loop' | 'combo'>('in');
  const [animSearch, setAnimSearch] = useState('');

  // Left-panel 106 Styles Browser states
  const [leftStyleCategory, setLeftStyleCategory] = useState<string>('all');
  const [leftStyleSearch, setLeftStyleSearch] = useState<string>('');

  // Elements tab states
  const [elementCategory, setElementCategory] = useState<string>('all');
  const [elementSearch, setElementSearch] = useState('');

  // Adjustment sub-tab
  const [adjSubTab, setAdjSubTab] = useState<'color' | 'luts' | 'effects' | 'speed'>(
    'color'
  );

  // AI tools sub-tab
  const [aiSubTab, setAiSubTab] = useState<'tools' | 'styles'>('tools');

  const srtInputRef = useRef<HTMLInputElement | null>(null);
  const mediaInputRef = useRef<HTMLInputElement | null>(null);

  const handleSrtFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onImportSrtText(reader.result);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadCustomVideo(file);
    }
    e.target.value = '';
  };

  const triggerSfxPreview = (sfx: (typeof SFX_LIBRARY)[number]) => {
    setPlayingSfxId(sfx.id);
    playSfxSound(sfx.id, 0.4);
    setTimeout(() => {
      setPlayingSfxId((prev) => (prev === sfx.id ? null : prev));
    }, 450);
  };

  const filteredSfx = SFX_LIBRARY.filter((item) => {
    const matchesCat =
      selectedSfxGroup === 'all' || item.group === selectedSfxGroup;
    const matchesSearch =
      !sfxSearch.trim() ||
      item.label.toLowerCase().includes(sfxSearch.toLowerCase()) ||
      item.tags.toLowerCase().includes(sfxSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const currentAnimList =
    animSubTab === 'in'
      ? ANIM_IN
      : animSubTab === 'out'
      ? ANIM_OUT
      : animSubTab === 'loop'
      ? ANIM_LOOP
      : ANIM_COMBO;

  const filteredAnimations = currentAnimList.filter(
    (item) =>
      !animSearch.trim() ||
      item.name.toLowerCase().includes(animSearch.toLowerCase())
  );

  const filteredElements = GRAPHIC_ELEMENTS.filter((el) => {
    const matchesCat =
      elementCategory === 'all' || el.category === elementCategory;
    const matchesQuery =
      !elementSearch.trim() ||
      el.name.toLowerCase().includes(elementSearch.toLowerCase()) ||
      el.defaultTitle.toLowerCase().includes(elementSearch.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const isScanning =
    ocrProgress &&
    ocrProgress.phase !== 'completed' &&
    ocrProgress.phase !== 'error';

  return (
    <aside className="hidden md:flex h-full shrink-0 select-none z-20">
      {/* 62px Left Icon Rail (Exact Match to captik_desk.webp) */}
      <div className="w-[62px] bg-[#0b0b0c] border-r border-white/[0.07] flex flex-col items-center py-2 gap-1 shrink-0">
        {RAIL_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              data-testid={`left-rail-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              className={`relative w-13 py-2.5 rounded-lg flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#171614] text-white'
                  : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]'
              }`}
            >
              {isActive && (
                <span className="absolute top-0 inset-x-2 h-[2px] bg-[#f5a524] rounded-full" />
              )}
              <Icon
                className={`w-4 h-4 ${
                  isActive ? 'text-[#f5a524]' : 'text-zinc-400'
                }`}
              />
              <span className="text-[10px] font-medium leading-none tracking-tight">
                {item.label}
              </span>
              {item.id === 'text' && detectedTexts.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-emerald-500 text-black text-[8px] font-black flex items-center justify-center">
                  {detectedTexts.length}
                </span>
              )}
              {item.id === 'styles' && (
                <span className="absolute top-1 right-1 px-1 rounded-full bg-[#f5a524] text-black text-[7px] font-black leading-tight">
                  106
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Contextual Panel Drawer (Responsive width so Left + Center + Right fit on all desktop screens) */}
      <div className="w-[265px] xl:w-[305px] bg-[#0e0e10] border-r border-white/[0.07] flex flex-col h-full overflow-hidden">
        {/* ==================== TAB 1: CAPTIONS (Default Active) ==================== */}
        {activeTab === 'captions' && (
          <div className="flex flex-col h-full">
            <input
              ref={srtInputRef}
              type="file"
              accept=".srt,.txt"
              onChange={handleSrtFileChange}
              className="hidden"
            />

            {/* Top Header: Captions + Quick Jump to OCR & 106 Styles */}
            <div className="px-3.5 py-2.5 border-b border-white/[0.07] flex items-center justify-between gap-1">
              <span className="text-[13px] font-bold text-[#f3efe7]">Captions</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onSelectTab('styles')}
                  className="px-2 py-0.5 rounded bg-[#f5a524]/15 border border-[#f5a524]/40 text-[10px] font-semibold text-[#f5a524] flex items-center gap-1 hover:bg-[#f5a524]/25 cursor-pointer"
                >
                  <Palette className="w-3 h-3" />
                  <span>Styles (106)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSelectTab('text');
                    setTextModeTab('ocr');
                  }}
                  className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/35 text-[10px] font-semibold text-emerald-300 flex items-center gap-1 hover:bg-emerald-500/25 cursor-pointer"
                >
                  <ScanText className="w-3 h-3" />
                  <span>
                    {detectedTexts.length > 0
                      ? `OCR (${detectedTexts.length})`
                      : 'OCR'}
                  </span>
                </button>
              </div>
            </div>

            {/* LINES (1 Line / 2 Lines) & CAPTION SETTINGS (Matches captik_desk.webp) */}
            <div className="p-3.5 border-b border-white/[0.07] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  LINES
                </span>
                <div className="flex items-center bg-[#151519] p-0.5 rounded-lg border border-white/[0.07]">
                  <button
                    type="button"
                    onClick={() => onChangeLinesMode(1)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      linesMode === 1
                        ? 'bg-[#3d2d10] text-[#f5a524] border border-[#f5a524]/45'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    1 Line
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeLinesMode(2)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      linesMode === 2
                        ? 'bg-[#3d2d10] text-[#f5a524] border border-[#f5a524]/45'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    2 Lines
                  </button>
                </div>
              </div>

              {/* Collapsible CAPTION SETTINGS */}
              <div className="rounded-lg bg-[#141418] border border-white/[0.07] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setCaptionSettingsOpen(!captionSettingsOpen)}
                  className="w-full px-3 py-2 flex items-center justify-between text-[10.5px] font-semibold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3 h-3 text-zinc-500" />
                    <span>CAPTION SETTINGS</span>
                  </span>
                  {captionSettingsOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                  )}
                </button>

                {captionSettingsOpen && (
                  <div className="px-3 pb-3 pt-1.5 border-t border-white/[0.06] space-y-2.5">
                    <div>
                      <label className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-medium mb-1">
                        <Languages className="w-3 h-3 text-[#f5a524]" />
                        <span>Language & Script (10 Indian Languages)</span>
                      </label>
                      <div className="grid grid-cols-1 gap-1 max-h-36 overflow-y-auto pr-1">
                        {INDIAN_SCRIPTS.map((scr) => (
                          <button
                            key={scr.id}
                            type="button"
                            onClick={() => onChangeScript(scr.id)}
                            className={`px-2.5 py-1.5 rounded-md text-left text-[11px] flex items-center justify-between transition-all cursor-pointer ${
                              activeScript === scr.id
                                ? 'bg-[#f5a524]/20 text-[#f5a524] border border-[#f5a524]/40 font-semibold'
                                : 'bg-[#101014] text-zinc-300 hover:bg-white/[0.04]'
                            }`}
                          >
                            <span>{scr.label}</span>
                            <span className="text-[10px] text-zinc-500 truncate max-w-[100px]">
                              {scr.sample}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] text-zinc-400 font-medium mb-1">
                        Cut the pauses
                      </div>
                      <div className="grid grid-cols-3 gap-1 bg-[#101014] p-0.5 rounded-md">
                        {(['Off', 'Natural', 'Tight'] as const).map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => onChangePauseMode(m)}
                            className={`py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                              pauseMode === m
                                ? 'bg-[#f5a524] text-black'
                                : 'text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* CAPTIONS Subheader with Import SRT + Undo/Redo (Exact match to captik_desk.webp) */}
            <div className="px-3.5 py-2 border-b border-white/[0.06] flex items-center justify-between">
              <span className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-400">
                CAPTIONS
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => srtInputRef.current?.click()}
                  className="px-2 py-1 rounded bg-[#17171c] hover:bg-[#22222a] border border-white/[0.08] text-[11px] font-medium text-zinc-300 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Upload className="w-3 h-3 text-zinc-400" />
                  <span>Import SRT</span>
                </button>
                <button
                  type="button"
                  onClick={onUndo}
                  disabled={!canUndo}
                  aria-label="Undo caption edit"
                  className="w-6 h-6 rounded hover:bg-white/[0.06] disabled:opacity-35 flex items-center justify-center text-zinc-400 cursor-pointer"
                >
                  <Undo2 className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={onRedo}
                  disabled={!canRedo}
                  aria-label="Redo caption edit"
                  className="w-6 h-6 rounded hover:bg-white/[0.06] disabled:opacity-35 flex items-center justify-center text-zinc-400 cursor-pointer"
                >
                  <Redo2 className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Scrollable Segment Cards List (Matches captik_desk.webp) */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
              {segments.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#141418] border border-white/[0.07] text-center space-y-2.5">
                  <div className="text-xs font-semibold text-zinc-200">
                    No captions yet for this video
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Run Automatic Text Detection (OCR) to extract text from video frames, or add captions manually.
                  </p>
                  <div className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={onTriggerOcrScan}
                      className="w-full py-2 rounded-lg bg-[#f5a524] text-black font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ScanText className="w-3.5 h-3.5" />
                      <span>Detect Video Text (OCR)</span>
                    </button>
                    <button
                      type="button"
                      onClick={onAddCaptionSegment}
                      className="w-full py-1.5 rounded-lg bg-[#1d1d24] text-zinc-200 font-semibold text-xs cursor-pointer"
                    >
                      + Add Caption Line
                    </button>
                  </div>
                </div>
              ) : (
                segments.map((seg, idx) => {
                  const isSelected = seg.id === activeSegmentId;
                  return (
                    <div
                      key={seg.id}
                      onClick={() => onSeekTo(seg.start + 0.05)}
                      className={`rounded-xl p-3 transition-all border cursor-pointer ${
                        isSelected
                          ? 'bg-[#161512] border-[#f5a524]/60'
                          : 'bg-[#131317] border-white/[0.07] hover:border-white/[0.15]'
                      }`}
                    >
                      {/* Card Header: Index + chevron + Person icon + Timestamp range */}
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[11px] font-bold tabular-nums ${
                              isSelected ? 'text-[#f5a524]' : 'text-zinc-400'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <ChevronDown className="w-3 h-3 text-zinc-500" />
                        </div>

                        <div
                          className="flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => onToggleSegmentBehind(seg.id)}
                            title="Toggle 'Behind you' subject cutout depth for this line"
                            className={`p-1 rounded transition-colors cursor-pointer ${
                              seg.behindSubject
                                ? 'text-[#f5a524] bg-[#f5a524]/15'
                                : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                          >
                            <PersonStanding className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-[11px] font-mono tabular-nums text-zinc-400">
                            {formatSegmentRange(seg.start, seg.end)}
                          </span>
                          {seg.words.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                onSplitSegment(
                                  seg.id,
                                  Math.ceil(seg.words.length / 2)
                                )
                              }
                              title="Split caption segment in half"
                              aria-label="Split caption segment"
                              className="p-0.5 rounded hover:bg-white/[0.08] text-zinc-500 hover:text-zinc-200 cursor-pointer"
                            >
                              <Scissors className="w-3 h-3" />
                            </button>
                          )}
                          {segments.length > 1 && (
                            <button
                              type="button"
                              onClick={() => onDeleteSegment(seg.id)}
                              title="Delete caption segment"
                              aria-label="Delete caption segment"
                              className="p-0.5 rounded hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Word Pills Row (Exact match to captik_desk.webp) */}
                      <div
                        className="flex flex-wrap items-center gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {seg.words.map((word) => {
                          const wordKey = `${seg.id}:${word.id}`;
                          const displayedText = getWordTextForScript(
                            word,
                            activeScript
                          );

                          if (editingWordKey === wordKey) {
                            return (
                              <input
                                key={word.id}
                                type="text"
                                value={editingWordValue}
                                onChange={(e) => setEditingWordValue(e.target.value)}
                                onBlur={() => {
                                  if (editingWordValue.trim()) {
                                    onUpdateWordText(
                                      seg.id,
                                      word.id,
                                      editingWordValue.trim()
                                    );
                                  }
                                  setEditingWordKey(null);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    if (editingWordValue.trim()) {
                                      onUpdateWordText(
                                        seg.id,
                                        word.id,
                                        editingWordValue.trim()
                                      );
                                    }
                                    setEditingWordKey(null);
                                  }
                                }}
                                autoFocus
                                className="px-2 py-0.5 rounded bg-black text-white text-xs font-semibold border border-[#f5a524] w-24 focus:outline-none"
                              />
                            );
                          }

                          const pillClasses =
                            word.emphasis === 'green'
                              ? 'bg-[#143d29] text-[#6ee7b7] border border-[#236b47] px-2 py-0.5 rounded-md'
                              : word.emphasis === 'amber'
                              ? 'bg-[#4d3811] text-[#fcd34d] border border-[#f5a524]/60 px-2 py-0.5 rounded-md'
                              : 'text-[#f3efe7] hover:bg-white/[0.06] px-1.5 py-0.5 rounded-md border border-transparent';

                          return (
                            <button
                              key={word.id}
                              type="button"
                              onClick={() => {
                                onSeekTo(word.start + 0.02);
                                onCycleWordEmphasis(seg.id, word.id);
                              }}
                              onDoubleClick={() => {
                                setEditingWordKey(wordKey);
                                setEditingWordValue(word.text);
                              }}
                              title="Click to cycle highlight (Normal → Green Accent → Amber Hero) • Double-click to edit text"
                              className={`text-[13px] font-bold transition-all cursor-pointer ${pillClasses}`}
                            >
                              {displayedText}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}

              {/* + Add caption button matching bottom of Captik Captions panel */}
              <button
                type="button"
                onClick={onAddCaptionSegment}
                className="w-full py-2.5 rounded-xl border border-dashed border-white/15 hover:border-[#f5a524]/50 bg-[#131317] hover:bg-[#18181e] text-zinc-400 hover:text-[#f5a524] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add caption</span>
              </button>
            </div>
          </div>
        )}

        {/* ==================== TAB 2: MEDIA & PROJECTS ==================== */}
        {activeTab === 'media' && (
          <div className="flex flex-col h-full p-3.5 space-y-3.5 overflow-y-auto custom-scrollbar">
            <input
              ref={mediaInputRef}
              type="file"
              data-testid="sidebar-video-upload-input"
              accept="video/*"
              onChange={handleVideoFileChange}
              className="hidden"
            />

            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                Projects & Video Media
              </span>
              <button
                type="button"
                onClick={onOpenNewProjectModal}
                className="px-2 py-1 rounded-md bg-[#f5a524] text-black text-[10px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3 stroke-[2.5]" />
                <span>New Project</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => mediaInputRef.current?.click()}
              className="w-full py-3.5 px-3 rounded-xl border border-dashed border-[#f5a524]/45 bg-[#f5a524]/[0.06] hover:bg-[#f5a524]/[0.12] flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-[#f5a524]/20 flex items-center justify-center text-[#f5a524]">
                <Upload className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-amber-200">
                Upload Video from Device
              </span>
              <span className="text-[10px] text-zinc-400 text-center">
                Creates a separate project & runs automatic OCR text detection
              </span>
            </button>

            {/* User Projects List */}
            <div className="space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                YOUR PROJECTS ({projects.length})
              </div>
              <div className="space-y-1.5">
                {projects.map((proj) => {
                  const isCurrent = proj.id === activeProjectId;
                  return (
                    <div
                      key={proj.id}
                      onClick={() => onSelectProject(proj.id)}
                      className={`p-2 rounded-xl border flex items-center justify-between gap-2 transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-[#191814] border-[#f5a524]'
                          : 'bg-[#141418] border-white/[0.07] hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={proj.posterUrl}
                          alt={proj.name}
                          onError={(e) => {
                            e.currentTarget.src = '/assets/terrace_poster.webp';
                          }}
                          className="w-9 h-12 rounded-lg object-cover border border-white/10 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                            <span className="truncate">{proj.name}</span>
                            {proj.isCustomUpload && (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold shrink-0">
                                Uploaded
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-400 mt-0.5">
                            {proj.duration.toFixed(1)}s • {proj.detectedTexts.length} OCR text
                            {proj.detectedTexts.length === 1 ? '' : 's'}
                          </div>
                        </div>
                      </div>
                      {projects.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteProject(proj.id);
                          }}
                          title="Delete project"
                          className="p-1.5 rounded hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Studio Sample Takes */}
            <div className="space-y-2 pt-2 border-t border-white/[0.07]">
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                STUDIO REFERENCE CLIPS ({MEDIA_LIBRARY_ASSETS.length})
              </div>
              <div className="grid grid-cols-2 gap-2">
                {MEDIA_LIBRARY_ASSETS.map((asset) => {
                  const isCurrent = activeMediaAsset.id === asset.id;
                  const durSec = (asset.durationMs / 1000).toFixed(1);
                  return (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => onSelectMediaAsset(asset)}
                      className={`group relative rounded-xl overflow-hidden border text-left transition-all cursor-pointer ${
                        isCurrent
                          ? 'border-[#f5a524] ring-1 ring-[#f5a524]/40 bg-[#1b1e28]'
                          : 'border-white/[0.08] bg-[#161820] hover:border-white/25'
                      }`}
                    >
                      <div className="aspect-[9/13] w-full bg-zinc-900 relative overflow-hidden">
                        <img
                          src={asset.posterUrl}
                          alt={asset.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-bold text-[#f5a524]">
                          {asset.languageLabel}
                        </span>
                        <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono tabular-nums text-zinc-200">
                          {durSec}s
                        </span>
                        <div className="absolute bottom-2 left-2 right-2">
                          <div className="text-[11px] font-bold text-white truncate">
                            {asset.title}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 3: AUDIO & 277 SOUND EFFECTS ==================== */}
        {activeTab === 'audio' && (
          <div className="flex flex-col h-full">
            <div className="p-3.5 border-b border-white/[0.07] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                  Sound Effects Library
                </span>
                <span className="px-2 py-0.5 rounded bg-[#f5a524]/15 text-[#f5a524] text-[10px] font-bold tabular-nums">
                  277 SFX
                </span>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={sfxSearch}
                  onChange={(e) => setSfxSearch(e.target.value)}
                  placeholder="Search whoosh, ding, bass, cash..."
                  className="w-full bg-[#171922] border border-white/[0.08] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#f5a524]/50"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
                {SFX_GROUPS.map((grp) => (
                  <button
                    key={grp.key}
                    type="button"
                    onClick={() => setSelectedSfxGroup(grp.key)}
                    className={`px-2 py-1 rounded-md text-[10px] font-semibold shrink-0 cursor-pointer ${
                      selectedSfxGroup === grp.key
                        ? 'bg-[#f5a524] text-black'
                        : 'bg-[#171922] text-zinc-400 hover:text-white'
                    }`}
                  >
                    {grp.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
              {filteredSfx.map((sfx) => {
                const isPlaying = playingSfxId === sfx.id;
                return (
                  <div
                    key={sfx.id}
                    className="p-2 rounded-xl bg-[#141418] hover:bg-[#1c1c22] border border-white/[0.06] flex items-center justify-between gap-2 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => triggerSfxPreview(sfx)}
                        aria-label={`Preview ${sfx.label}`}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                          isPlaying
                            ? 'bg-[#f5a524] text-black scale-95'
                            : 'bg-[#202028] text-[#f5a524] hover:bg-[#f5a524] hover:text-black'
                        }`}
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-zinc-100 truncate">
                          {sfx.label}
                        </div>
                        <div className="text-[10px] text-zinc-400 flex items-center gap-1.5">
                          <span className="capitalize">{sfx.group}</span>
                          <span>•</span>
                          <span className="font-mono tabular-nums">
                            {sfx.durationSec}s
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        triggerSfxPreview(sfx);
                        onAddSfxToTimeline(sfx);
                      }}
                      title="Add sound effect to timeline at playhead"
                      className="px-2 py-1 rounded-md bg-white/[0.06] hover:bg-[#f5a524] hover:text-black text-zinc-200 text-[11px] font-semibold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================== TAB 3B: STYLES (106 CAPTIK TEMPLATES WITH REEL + TEXT EFFECT PREVIEWS) ==================== */}
        {activeTab === 'styles' && (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="p-3 border-b border-white/[0.07] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-[#f5a524]" />
                  <span>Captik Styles & Templates</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-[#f5a524]/20 text-[#f5a524] text-[10px] font-extrabold tabular-nums">
                  106 Styles
                </span>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={leftStyleSearch}
                  onChange={(e) => setLeftStyleSearch(e.target.value)}
                  placeholder="Search 106 styles (Glow, Garnet, Hormozi...)"
                  className="w-full bg-[#171922] border border-white/[0.08] rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#f5a524]/50"
                />
              </div>

              <div className="flex flex-wrap gap-1">
                {TEMPLATE_TABS.map((cat) => {
                  const isSelected = leftStyleCategory === cat.key;
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setLeftStyleCategory(cat.key)}
                      className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#f5a524] text-black'
                          : 'bg-[#171922] text-zinc-300 hover:bg-[#202330] border border-white/[0.05]'
                      }`}
                    >
                      <span>{cat.label}</span>
                      <span
                        className={`tabular-nums text-[9px] px-1 rounded ${
                          isSelected
                            ? 'bg-black/20 text-black'
                            : 'bg-white/[0.06] text-zinc-400'
                        }`}
                      >
                        {cat.ids.length}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2.5 custom-scrollbar">
              <div className="grid grid-cols-2 gap-2">
                {filterTemplates(TEMPLATES, leftStyleCategory, leftStyleSearch).map(
                  (tpl) => {
                    const isSelected = activeTemplate.id === tpl.id;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => onSelectTemplate(tpl)}
                        className={`group relative aspect-[9/14] w-full rounded-xl overflow-hidden border text-left transition-all flex flex-col justify-between p-2 cursor-pointer bg-[#15171F] ${
                          isSelected
                            ? 'border-[#f5a524] ring-2 ring-[#f5a524]/35'
                            : 'border-white/[0.08] hover:border-white/25'
                        }`}
                      >
                        <img
                          src={tpl.previewPosterUrl}
                          alt={tpl.name}
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.src = tpl.behind
                              ? '/assets/terrace_behind.webp'
                              : '/assets/terrace_poster.webp';
                          }}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/25 z-10 pointer-events-none" />

                        <div className="relative z-20 flex items-center justify-between gap-1 w-full">
                          {tpl.badge ? (
                            <span className="px-1.5 py-0.5 rounded bg-[#f5a524] text-black text-[8px] font-extrabold uppercase tracking-tight">
                              {tpl.badge}
                            </span>
                          ) : (
                            <span />
                          )}
                          {tpl.behind && tpl.badge !== 'Behind you' && (
                            <span className="px-1.5 py-0.5 rounded bg-black/80 border border-amber-400/40 text-amber-300 text-[8px] font-bold">
                              Behind you
                            </span>
                          )}
                        </div>

                        <div className="relative z-20 my-auto py-1.5 px-1 rounded-lg bg-black/35 backdrop-blur-[1px] w-full flex items-center justify-center overflow-hidden pointer-events-none scale-95">
                          <CaptikCardPreview template={tpl} />
                        </div>

                        <div className="relative z-20 flex items-center justify-between w-full pt-1 border-t border-white/[0.08]">
                          <div className="min-w-0 pr-1">
                            <div className="text-[11px] font-bold text-white truncate">
                              {tpl.name}
                            </div>
                            <div className="text-[9px] text-zinc-300 truncate capitalize">
                              {tpl.category}
                            </div>
                          </div>
                          {isSelected && (
                            <div className="w-4 h-4 rounded-full bg-[#f5a524] text-black flex items-center justify-center shrink-0">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 4: TEXT (OCR AUTOMATIC TEXT DETECTION + 106 STYLES + BOLD LOCKUPS) ==================== */}
        {activeTab === 'text' && (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Top Sub-Tab Switcher: Video OCR | 106 Styles | Lockups & Anim */}
            <div className="p-3 border-b border-white/[0.07] space-y-2.5">
              <div className="grid grid-cols-3 gap-1 bg-[#15151a] p-1 rounded-lg border border-white/[0.07]">
                <button
                  type="button"
                  data-testid="tab-ocr-detected-text"
                  onClick={() => setTextModeTab('ocr')}
                  className={`py-1.5 rounded-md text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    textModeTab === 'ocr'
                      ? 'bg-[#f5a524] text-black'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <ScanText className="w-3 h-3" />
                  <span>OCR ({detectedTexts.length})</span>
                </button>
                <button
                  type="button"
                  data-testid="tab-text-106-styles"
                  onClick={() => setTextModeTab('styles')}
                  className={`py-1.5 rounded-md text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    textModeTab === 'styles'
                      ? 'bg-[#f5a524] text-black'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Palette className="w-3 h-3" />
                  <span>106 Styles</span>
                </button>
                <button
                  type="button"
                  data-testid="tab-text-lockups"
                  onClick={() => setTextModeTab('lockups')}
                  className={`py-1.5 rounded-md text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    textModeTab === 'lockups'
                      ? 'bg-[#f5a524] text-black'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Type className="w-3 h-3" />
                  <span>Lockups</span>
                </button>
              </div>
            </div>

            {textModeTab === 'styles' ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-2.5 border-b border-white/[0.07] space-y-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={leftStyleSearch}
                      onChange={(e) => setLeftStyleSearch(e.target.value)}
                      placeholder="Find a text template (106 styles)..."
                      className="w-full bg-[#171922] border border-white/[0.08] rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#f5a524]/50"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {TEMPLATE_TABS.map((cat) => (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => setLeftStyleCategory(cat.key)}
                        className={`px-2 py-0.5 rounded text-[9.5px] font-bold flex items-center gap-1 cursor-pointer ${
                          leftStyleCategory === cat.key
                            ? 'bg-[#f5a524] text-black'
                            : 'bg-[#171922] text-zinc-300'
                        }`}
                      >
                        <span>{cat.label}</span>
                        <span className="opacity-75">({cat.ids.length})</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2.5 grid grid-cols-2 gap-2 custom-scrollbar">
                  {filterTemplates(TEMPLATES, leftStyleCategory, leftStyleSearch).map(
                    (tpl) => {
                      const isSelected = activeTemplate.id === tpl.id;
                      return (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => onSelectTemplate(tpl)}
                          className={`group relative aspect-[9/14] w-full rounded-xl overflow-hidden border text-left transition-all flex flex-col justify-between p-2 cursor-pointer bg-[#15171F] ${
                            isSelected
                              ? 'border-[#f5a524] ring-2 ring-[#f5a524]/35'
                              : 'border-white/[0.08] hover:border-white/25'
                          }`}
                        >
                          <img
                            src={tpl.previewPosterUrl}
                            alt={tpl.name}
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.src = tpl.behind
                                ? '/assets/terrace_behind.webp'
                                : '/assets/terrace_poster.webp';
                            }}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/25 z-10 pointer-events-none" />
                          <div className="relative z-20 flex items-center justify-between w-full">
                            {tpl.badge ? (
                              <span className="px-1.5 py-0.5 rounded bg-[#f5a524] text-black text-[8px] font-extrabold uppercase">
                                {tpl.badge}
                              </span>
                            ) : (
                              <span />
                            )}
                          </div>
                          <div className="relative z-20 my-auto py-1.5 px-1 rounded-lg bg-black/35 w-full flex items-center justify-center overflow-hidden pointer-events-none scale-95">
                            <CaptikCardPreview template={tpl} />
                          </div>
                          <div className="relative z-20 flex items-center justify-between w-full pt-1 border-t border-white/[0.08]">
                            <span className="text-[11px] font-bold text-white truncate">
                              {tpl.name}
                            </span>
                            {isSelected && (
                              <Check className="w-3 h-3 text-[#f5a524] shrink-0" />
                            )}
                          </div>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            ) : textModeTab === 'ocr' ? (
              <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 custom-scrollbar">
                {/* Real OCR Action Card */}
                <div className="p-3 rounded-xl bg-[#14151c] border border-white/[0.08] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <ScanText className="w-3.5 h-3.5 text-[#f5a524]" />
                      <span>Automatic Text Detection</span>
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 text-[9px] font-bold">
                      Real Frame OCR
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Scans frames across your video to detect burned-in text with timestamps and bounding coordinates. Select any text to edit, replace, move, or remove it.
                  </p>

                  <button
                    type="button"
                    data-testid="run-ocr-scan-btn"
                    onClick={onTriggerOcrScan}
                    disabled={Boolean(isScanning)}
                    className="w-full py-2 px-3 rounded-lg bg-[#f5a524] hover:bg-[#fbbf24] disabled:opacity-60 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    {isScanning ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Scanning Frames ({ocrProgress?.percent || 0}%)...</span>
                      </>
                    ) : (
                      <>
                        <ScanText className="w-3.5 h-3.5" />
                        <span>
                          {detectedTexts.length > 0
                            ? 'Re-Scan Video Frames (OCR)'
                            : 'Scan Video for Text (OCR)'}
                        </span>
                      </>
                    )}
                  </button>

                  {ocrError && (
                    <div className="p-2 rounded-lg bg-rose-500/15 border border-rose-500/35 text-[11px] text-rose-300">
                      {ocrError}
                    </div>
                  )}
                </div>

                {/* Detected Text Regions List */}
                <div className="space-y-2" data-testid="detected-text-list">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-400">
                      DETECTED VIDEO TEXT ({detectedTexts.length})
                    </span>
                    <div className="flex items-center gap-1.5">
                      {detectedTexts.length > 0 && (
                        <button
                          type="button"
                          onClick={onSyncOcrToCaptions}
                          title="Convert detected OCR text into word-by-word animated captions"
                          className="text-[10px] font-bold text-[#f5a524] hover:underline cursor-pointer"
                        >
                          Sync to Captions →
                        </button>
                      )}
                    </div>
                  </div>

                  {detectedTexts.length === 0 ? (
                    <div className="p-4 rounded-xl bg-[#131317] border border-dashed border-white/10 text-center space-y-2">
                      <p className="text-xs text-zinc-400">
                        {ocrProgress?.phase === 'completed'
                          ? 'No burned-in text was detected in the sampled frames.'
                          : 'Click "Scan Video for Text (OCR)" above to analyze your video frames.'}
                      </p>
                      <button
                        type="button"
                        onClick={onAddManualDetectedText}
                        className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-zinc-200 cursor-pointer"
                      >
                        + Add Video Text Region Manually
                      </button>
                    </div>
                  ) : (
                    detectedTexts.map((item, idx) => {
                      const isSelected = selectedDetectedTextId === item.id;
                      return (
                        <div
                          key={item.id}
                          data-testid={`detected-text-card-${idx}`}
                          onClick={() => {
                            onSelectDetectedText(item.id);
                            onSeekTo(item.startTime + 0.05);
                          }}
                          className={`p-3 rounded-xl border space-y-2.5 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#191814] border-[#f5a524]'
                              : 'bg-[#13141a] border-white/[0.08] hover:border-white/20'
                          }`}
                        >
                          {/* Top row: index + timestamp range + confidence + remove button */}
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1.5">
                              <span className="px-1.5 py-0.5 rounded bg-[#f5a524]/20 text-[#f5a524] text-[10px] font-bold tabular-nums">
                                #{idx + 1}
                              </span>
                              <span className="text-[11px] font-mono tabular-nums text-zinc-300">
                                {formatSegmentRange(item.startTime, item.endTime)}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 text-[9px] font-mono">
                                {item.confidence}% OCR
                              </span>
                            </div>

                            <button
                              type="button"
                              aria-label={`Remove detected text ${idx + 1}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteDetectedText(item.id);
                              }}
                              className="p-1 rounded hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 cursor-pointer"
                              title="Delete detected text item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Editable Text Input (Replace/Edit Detected Text) */}
                          <div onClick={(e) => e.stopPropagation()}>
                            <label className="text-[10px] text-zinc-400 block mb-1">
                              Detected / Replacement Text
                            </label>
                            <input
                              type="text"
                              data-testid={`ocr-text-input-${idx}`}
                              value={item.text}
                              onChange={(e) =>
                                onUpdateDetectedText(item.id, {
                                  text: e.target.value,
                                  maskOriginal: true,
                                })
                              }
                              className="w-full bg-[#0c0d12] border border-white/15 focus:border-[#f5a524] rounded-lg px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none"
                            />
                            {item.text !== item.originalText && (
                              <div className="text-[10px] text-zinc-500 mt-0.5 flex items-center justify-between">
                                <span className="truncate">
                                  Original: “{item.originalText}”
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onUpdateDetectedText(item.id, {
                                      text: item.originalText,
                                    })
                                  }
                                  className="text-amber-400 hover:underline ml-1 shrink-0"
                                >
                                  Restore
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Position (X%, Y%) & Font Color / Mask Controls */}
                          <div
                            className="grid grid-cols-2 gap-2 pt-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div>
                              <div className="flex justify-between text-[10px] text-zinc-400">
                                <span>X Pos</span>
                                <span className="font-mono text-zinc-200">
                                  {item.x}%
                                </span>
                              </div>
                              <input
                                type="range"
                                min={10}
                                max={90}
                                value={item.x}
                                aria-label="Detected text X position"
                                onChange={(e) =>
                                  onUpdateDetectedText(item.id, {
                                    x: Number(e.target.value),
                                    maskOriginal: true,
                                  })
                                }
                                className="w-full accent-[#f5a524] cursor-pointer"
                              />
                            </div>
                            <div>
                              <div className="flex justify-between text-[10px] text-zinc-400">
                                <span>Y Pos</span>
                                <span className="font-mono text-zinc-200">
                                  {item.y}%
                                </span>
                              </div>
                              <input
                                type="range"
                                min={10}
                                max={90}
                                value={item.y}
                                aria-label="Detected text Y position"
                                onChange={(e) =>
                                  onUpdateDetectedText(item.id, {
                                    y: Number(e.target.value),
                                    maskOriginal: true,
                                  })
                                }
                                className="w-full accent-[#f5a524] cursor-pointer"
                              />
                            </div>
                          </div>

                          {/* Mask Original & Erase Toggles */}
                          <div
                            className="flex items-center justify-between gap-1.5 pt-1 border-t border-white/[0.06]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateDetectedText(item.id, {
                                  maskOriginal: !item.maskOriginal,
                                })
                              }
                              className={`flex-1 py-1 px-2 rounded-md text-[10px] font-semibold flex items-center justify-center gap-1 border cursor-pointer ${
                                item.maskOriginal
                                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                                  : 'bg-white/[0.04] border-white/10 text-zinc-400'
                              }`}
                            >
                              {item.maskOriginal ? (
                                <Eye className="w-3 h-3" />
                              ) : (
                                <EyeOff className="w-3 h-3" />
                              )}
                              <span>
                                {item.maskOriginal ? 'Masking Original' : 'Mask Original'}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                onUpdateDetectedText(item.id, {
                                  isRemoved: !item.isRemoved,
                                  maskOriginal: true,
                                })
                              }
                              className={`py-1 px-2 rounded-md text-[10px] font-semibold border cursor-pointer ${
                                item.isRemoved
                                  ? 'bg-rose-500/25 border-rose-500/50 text-rose-300'
                                  : 'bg-white/[0.04] border-white/10 text-zinc-400 hover:text-white'
                              }`}
                            >
                              {item.isRemoved ? 'Erased ✓' : 'Erase Text'}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              /* Bold Text Lockups (`poster`, `b01`..`b10`) & Dynamic Animations */
              <div className="flex-1 overflow-y-auto p-3.5 space-y-4 custom-scrollbar">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                    ADD TEXT OVERLAY
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        onAddTextOverlay('TERRACE REEL', 'poster', '#FBBF24')
                      }
                      className="py-2 px-2 rounded-lg bg-[#181b24] hover:bg-[#222634] border border-white/[0.08] text-xs font-extrabold text-white cursor-pointer"
                    >
                      + Heading
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onAddTextOverlay('KEY POINT', 'b03', '#10B981')
                      }
                      className="py-2 px-2 rounded-lg bg-[#181b24] hover:bg-[#222634] border border-white/[0.08] text-xs font-semibold text-zinc-200 cursor-pointer"
                    >
                      + Subheading
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onAddTextOverlay('WATCH THIS', 'b06', '#38BDF8')
                      }
                      className="py-2 px-2 rounded-lg bg-[#181b24] hover:bg-[#222634] border border-white/[0.08] text-xs font-medium text-zinc-300 cursor-pointer"
                    >
                      + Callout
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      BOLD TEXT LOCKUPS ({BOLD_TEXT_PRESETS.length})
                    </span>
                    <span className="text-[10px] text-[#f5a524]">
                      Click to insert
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {BOLD_TEXT_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() =>
                          onAddTextOverlay(
                            preset.sample,
                            preset.id,
                            preset.bg !== 'transparent' ? preset.bg : '#F59E0B'
                          )
                        }
                        className="p-2.5 rounded-xl bg-[#161922] hover:bg-[#1e2230] border border-white/[0.07] hover:border-[#f5a524]/40 text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 overflow-hidden"
                      >
                        <div className="min-h-[34px] flex items-center justify-center bg-[#0d0f15] rounded-lg px-2 py-1 overflow-hidden">
                          <span
                            style={{ fontFamily: preset.font }}
                            className="text-xs font-black uppercase text-white truncate"
                          >
                            {preset.sample}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-zinc-200 truncate">
                            {preset.name}
                          </span>
                          <span className="text-[9px] font-mono text-zinc-500 uppercase">
                            {preset.id}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 flex flex-col min-h-[240px]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      DYNAMIC TEXT ANIMATIONS (139)
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1 bg-[#161820] p-1 rounded-lg border border-white/[0.06] mb-2">
                    {(
                      [
                        { id: 'in', label: `In (${ANIM_IN.length})` },
                        { id: 'out', label: `Out (${ANIM_OUT.length})` },
                        { id: 'loop', label: `Loop (${ANIM_LOOP.length})` },
                        { id: 'combo', label: `Combo (${ANIM_COMBO.length})` },
                      ] as const
                    ).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setAnimSubTab(t.id)}
                        className={`py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                          animSubTab === t.id
                            ? 'bg-[#f5a524] text-black'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    value={animSearch}
                    onChange={(e) => setAnimSearch(e.target.value)}
                    placeholder="Filter animations (Spring, Glitch, Pulse...)"
                    className="w-full bg-[#161820] border border-white/[0.07] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-zinc-500 mb-2 focus:outline-none focus:border-[#f5a524]/50"
                  />

                  <div className="grid grid-cols-2 gap-1.5 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                    {filteredAnimations.map((anim) => {
                      const isActive =
                        (animSubTab === 'in' &&
                          activeTextAnimations.in === anim.name) ||
                        (animSubTab === 'out' &&
                          activeTextAnimations.out === anim.name) ||
                        (animSubTab === 'loop' &&
                          activeTextAnimations.loop === anim.name);
                      return (
                        <button
                          key={anim.id}
                          type="button"
                          onClick={() => onApplyTextAnimation(animSubTab, anim.name)}
                          className={`p-2 rounded-xl text-left border flex flex-col justify-between gap-1.5 transition-all cursor-pointer ${
                            isActive
                              ? 'bg-[#f5a524]/20 border-[#f5a524] text-[#f5a524]'
                              : 'bg-[#161820] border-white/[0.06] text-zinc-300 hover:border-white/20'
                          }`}
                        >
                          <div className="w-full py-1.5 rounded-lg bg-[#0d0f15] flex items-center justify-center overflow-hidden">
                            <span
                              className="text-xs font-black uppercase tracking-wider text-amber-300"
                              style={{
                                textShadow:
                                  '0 0 8px rgba(245,165,36,0.65), 0 2px 4px rgba(0,0,0,0.8)',
                              }}
                            >
                              {anim.name.slice(0, 10)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between w-full">
                            <span className="text-[10.5px] font-semibold truncate">
                              {anim.name}
                            </span>
                            {isActive ? (
                              <Check className="w-3 h-3 text-[#f5a524] shrink-0" />
                            ) : (
                              <span className="text-[9px] text-zinc-500 font-mono tabular-nums">
                                {anim.defaultMs}ms
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 5: ELEMENTS & MOTION GRAPHICS ==================== */}
        {activeTab === 'elements' && (
          <div className="flex flex-col h-full">
            <div className="p-3.5 border-b border-white/[0.07] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                  Motion Graphics & Stickers
                </span>
                <span className="text-[10px] text-[#f5a524] font-semibold">
                  16 Categories
                </span>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={elementSearch}
                  onChange={(e) => setElementSearch(e.target.value)}
                  placeholder="Search stats, badges, charts, CTAs..."
                  className="w-full bg-[#171922] border border-white/[0.08] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#f5a524]/50"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
                {GRAPHIC_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setElementCategory(cat.id)}
                    className={`px-2 py-1 rounded-md text-[10px] font-semibold shrink-0 cursor-pointer ${
                      elementCategory === cat.id
                        ? 'bg-[#f5a524] text-black'
                        : 'bg-[#171922] text-zinc-400 hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-2 custom-scrollbar">
              {filteredElements.map((el) => (
                <button
                  key={el.id}
                  type="button"
                  onClick={() => onAddGraphicElement(el)}
                  className="p-2.5 rounded-xl bg-[#161820] hover:bg-[#1f222e] border border-white/[0.07] hover:border-[#f5a524]/40 text-left flex flex-col justify-between gap-2 transition-all cursor-pointer"
                >
                  <div
                    className="px-2 py-1.5 rounded-lg text-[10px] font-extrabold tracking-tight truncate border"
                    style={{
                      backgroundColor: `${el.accentColor}18`,
                      borderColor: `${el.accentColor}45`,
                      color: el.accentColor,
                    }}
                  >
                    {el.badgeText}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-zinc-100 truncate">
                      {el.name}
                    </div>
                    <div className="text-[10px] text-zinc-500 truncate">
                      {el.defaultTitle}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ==================== TAB 6: ADJUSTMENT (Color, LUTs, Effects, Speed) ==================== */}
        {activeTab === 'adjustment' && (
          <div className="flex flex-col h-full">
            <div className="p-3.5 border-b border-white/[0.07] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                  Color & Visual Grading
                </span>
                <button
                  type="button"
                  onClick={() => onChangeAdjustments(DEFAULT_ADJUSTMENTS)}
                  className="text-[11px] text-zinc-400 hover:text-[#f5a524] flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>

              <div className="grid grid-cols-4 gap-1 bg-[#161820] p-1 rounded-lg border border-white/[0.06]">
                {(
                  [
                    { id: 'color', label: 'Color' },
                    { id: 'luts', label: 'LUTs (80)' },
                    { id: 'effects', label: 'Effects' },
                    { id: 'speed', label: 'Speed' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setAdjSubTab(tab.id)}
                    className={`py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                      adjSubTab === tab.id
                        ? 'bg-[#f5a524] text-black'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3.5 space-y-3 custom-scrollbar">
              {adjSubTab === 'color' && (
                <div className="space-y-3">
                  {(
                    [
                      { key: 'exposure', label: 'Exposure', min: -50, max: 50 },
                      { key: 'brightness', label: 'Brightness', min: -50, max: 50 },
                      { key: 'contrast', label: 'Contrast', min: -50, max: 50 },
                      {
                        key: 'saturation',
                        label: 'Saturation',
                        min: -100,
                        max: 100,
                      },
                      {
                        key: 'temperature',
                        label: 'Warmth / Temp',
                        min: -50,
                        max: 50,
                      },
                      { key: 'tint', label: 'Tint', min: -50, max: 50 },
                      { key: 'vignette', label: 'Vignette', min: 0, max: 100 },
                      { key: 'sharpen', label: 'Sharpen', min: 0, max: 100 },
                      { key: 'grain', label: 'Film Grain', min: 0, max: 100 },
                    ] as const
                  ).map((slider) => {
                    const val = adjustments[slider.key];
                    return (
                      <div key={slider.key} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-300 font-medium">
                            {slider.label}
                          </span>
                          <span className="font-mono text-[11px] tabular-nums text-[#f5a524]">
                            {val > 0 ? `+${val}` : val}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={slider.min}
                          max={slider.max}
                          value={val}
                          aria-label={slider.label}
                          onChange={(e) =>
                            onChangeAdjustments({
                              ...adjustments,
                              [slider.key]: Number(e.target.value),
                            })
                          }
                          className="w-full accent-[#f5a524] cursor-pointer"
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {adjSubTab === 'luts' && (
                <div className="grid grid-cols-2 gap-2">
                  {LUT_FILTERS.map((lut) => {
                    const isSelected = adjustments.lutId === lut.id;
                    return (
                      <button
                        key={lut.id}
                        type="button"
                        onClick={() =>
                          onChangeAdjustments({ ...adjustments, lutId: lut.id })
                        }
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#f5a524]/15 border-[#f5a524] text-amber-200'
                            : 'bg-[#161820] border-white/[0.07] text-zinc-200 hover:border-white/20'
                        }`}
                      >
                        <div
                          className="h-10 rounded-lg mb-2 bg-cover bg-center border border-white/10"
                          style={{
                            backgroundImage: `url('/assets/terrace_poster.webp')`,
                            filter: lut.css,
                          }}
                        />
                        <div className="text-xs font-bold truncate">{lut.name}</div>
                        <div className="text-[10px] text-zinc-400">
                          {lut.category}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {adjSubTab === 'effects' && (
                <div className="grid grid-cols-2 gap-2">
                  {VIDEO_EFFECTS_LIST.map((fx) => {
                    const isSelected = adjustments.effectId === fx.id;
                    return (
                      <button
                        key={fx.id}
                        type="button"
                        onClick={() =>
                          onChangeAdjustments({
                            ...adjustments,
                            effectId: isSelected ? 'none' : fx.id,
                          })
                        }
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#f5a524]/20 border-[#f5a524] text-amber-200'
                            : 'bg-[#161820] border-white/[0.07] text-zinc-200 hover:border-white/20'
                        }`}
                      >
                        <div className="text-xs font-bold mb-0.5">{fx.name}</div>
                        <div className="text-[10px] text-zinc-400">
                          {fx.category}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {adjSubTab === 'speed' && (
                <div className="space-y-2">
                  <div className="text-[11px] text-zinc-400 mb-2">
                    Velocity & Speed Ramp Presets
                  </div>
                  {SPEED_CURVES.map((curve) => (
                    <button
                      key={curve.id}
                      type="button"
                      onClick={() => onTriggerAiTool('speed-curve', curve.name)}
                      className="w-full p-2.5 rounded-xl bg-[#161820] hover:bg-[#1e222e] border border-white/[0.07] flex items-center justify-between text-left cursor-pointer"
                    >
                      <div>
                        <div className="text-xs font-bold text-zinc-100">
                          {curve.name}
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          Bezier speed ramp curve ({curve.pts.length} keyframes)
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-[#f5a524]">
                        Apply
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== TAB 7: AI TOOLS (25 Tools + 36 AI Edit Styles) ==================== */}
        {activeTab === 'ai' && (
          <div className="flex flex-col h-full">
            <div className="p-3.5 border-b border-white/[0.07] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#f5a524]" />
                  <span>Captik AI Studio</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold">
                  25 Tools • 36 Looks
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1 bg-[#161820] p-1 rounded-lg border border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setAiSubTab('tools')}
                  className={`py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                    aiSubTab === 'tools'
                      ? 'bg-[#f5a524] text-black'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  25 AI Tools
                </button>
                <button
                  type="button"
                  onClick={() => setAiSubTab('styles')}
                  className={`py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                    aiSubTab === 'styles'
                      ? 'bg-[#f5a524] text-black'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  36 AI Edit Looks
                </button>
              </div>
            </div>

            {aiSubTab === 'tools' ? (
              <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                {AI_TOOLS_CATALOG.map((tool) => {
                  const status = aiToolStatus[tool.id];
                  const isPauseTool = tool.id === 'pauses';
                  return (
                    <div
                      key={tool.id}
                      className="p-2.5 rounded-xl bg-[#161820] border border-white/[0.07] hover:border-white/15 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-zinc-100">
                              {tool.name}
                            </span>
                            {tool.badge && (
                              <span className="px-1.5 py-0.2 rounded bg-[#f5a524]/20 text-amber-300 text-[9px] font-bold">
                                {tool.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-zinc-400 leading-relaxed mt-0.5">
                            {tool.desc}
                          </p>
                        </div>

                        {!isPauseTool && (
                          <button
                            type="button"
                            onClick={() => onTriggerAiTool(tool.id)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 flex items-center gap-1 transition-all cursor-pointer ${
                              status
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-[#f5a524]/15 hover:bg-[#f5a524] text-amber-300 hover:text-black border border-[#f5a524]/30'
                            }`}
                          >
                            <Wand2 className="w-3 h-3" />
                            <span>{status || 'Run'}</span>
                          </button>
                        )}
                      </div>

                      {isPauseTool && (
                        <div className="flex items-center gap-1 pt-0.5">
                          {(['Off', 'Natural', 'Tight'] as const).map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => onChangePauseMode(opt)}
                              className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                                pauseMode === opt
                                  ? 'bg-[#f5a524] text-black'
                                  : 'bg-[#1f222d] text-zinc-300 hover:bg-[#282c3a]'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-2 custom-scrollbar">
                {AI_EDIT_LOOKS.map((look) => {
                  const isSelected = activeAiLookId === look.id;
                  return (
                    <button
                      key={look.id}
                      type="button"
                      onClick={() => onApplyAiLook(look.id)}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                        isSelected
                          ? 'bg-[#f5a524]/15 border-[#f5a524]'
                          : 'bg-[#161820] border-white/[0.07] hover:border-white/20'
                      }`}
                    >
                      <div
                        className="relative h-16 w-full rounded-lg overflow-hidden flex flex-col items-center justify-center px-1.5 border border-white/10"
                        style={{ backgroundColor: look.bgCard || '#0f1015' }}
                      >
                        <img
                          src={
                            look.behindSubject
                              ? '/assets/terrace_behind.webp'
                              : '/assets/terrace_poster.webp'
                          }
                          alt={look.name}
                          className="absolute inset-0 w-full h-full object-cover opacity-45"
                        />
                        <div className="relative z-10 text-center leading-none">
                          <div
                            style={{
                              fontFamily: look.fontFamily,
                              fontWeight: look.fontWeight,
                              color: look.color,
                              textTransform: look.uppercase
                                ? 'uppercase'
                                : look.lowercase
                                ? 'lowercase'
                                : 'none',
                            }}
                            className="text-[9px] opacity-85 truncate"
                          >
                            the quick
                          </div>
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
                            className="text-sm font-black tracking-tight truncate mt-0.5"
                          >
                            {look.name}
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white truncate">
                            {look.name}
                          </span>
                          <span className="text-[8px] font-bold uppercase tracking-wider text-amber-400">
                            {look.zoomIntensity}
                          </span>
                        </div>
                        <div className="text-[9.5px] text-zinc-400 truncate mt-0.5">
                          {look.tagline}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
