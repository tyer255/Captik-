import React, { useState } from 'react';
import {
  Search,
  Bookmark,
  Check,
  Sparkles,
  Palette,
  Type,
  Sliders,
  Layers,
  RotateCcw,
  Film,
  LayoutGrid,
} from 'lucide-react';
import {
  TEMPLATES,
  TEMPLATE_TABS,
  type CaptionTemplateSpec,
} from '../data/templatesCatalog';
import { CAPTIK_GOOGLE_FONTS } from '../data/captikLookSpecs';
import {
  filterTemplates,
  type CustomStyleOverrides,
} from '../utils/editorLogic';
import { CaptikCardPreview } from './CaptikTemplateRenderer';

export type RightInspectorTab = 'templates' | 'customize' | 'text' | 'project';

interface RightInspectorPanelProps {
  activeTab: RightInspectorTab;
  onSelectTab: (tab: RightInspectorTab) => void;
  activeTemplate: CaptionTemplateSpec;
  onSelectTemplate: (tpl: CaptionTemplateSpec) => void;
  savedPresets: CaptionTemplateSpec[];
  onSaveCurrentAsPreset: () => void;
  styleOverrides: CustomStyleOverrides;
  onChangeStyleOverrides: (next: CustomStyleOverrides) => void;
  onResetStyleOverrides: () => void;
  projectName: string;
  aspectRatio: string;
  duration: number;
  segmentCount: number;
  wordCount: number;
}

export const RightInspectorPanel: React.FC<RightInspectorPanelProps> = ({
  activeTab,
  onSelectTab,
  activeTemplate,
  onSelectTemplate,
  savedPresets,
  onSaveCurrentAsPreset,
  styleOverrides,
  onChangeStyleOverrides,
  onResetStyleOverrides,
  projectName,
  aspectRatio,
  duration,
  segmentCount,
  wordCount,
}) => {
  const [presetMode, setPresetMode] = useState<'captik' | 'my'>('captik');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [justSavedToast, setJustSavedToast] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useState<'video' | 'studio'>('video');
  const [hoveredTplId, setHoveredTplId] = useState<string | null>(null);

  // Text tab state for 127 Google Fonts & Motion overrides
  const [fontCategory, setFontCategory] = useState<string>('all');
  const [fontSearch, setFontSearch] = useState<string>('');
  const [spokenStyle, setSpokenStyle] = useState<'color' | 'grow' | 'box' | 'underline' | 'glow'>('color');
  const [upcomingMode, setUpcomingMode] = useState<'show' | 'dim' | 'hide'>('dim');

  const sourceList = presetMode === 'captik' ? TEMPLATES : savedPresets;
  const visibleTemplates = filterTemplates(
    sourceList,
    selectedCategory,
    searchQuery
  );

  const filteredGoogleFonts = CAPTIK_GOOGLE_FONTS.filter((f) => {
    const matchesCat = fontCategory === 'all' || f.cat === fontCategory;
    const matchesQuery =
      !fontSearch.trim() ||
      f.family.toLowerCase().includes(fontSearch.trim().toLowerCase());
    return matchesCat && matchesQuery;
  });

  const handleSavePresetClick = () => {
    onSaveCurrentAsPreset();
    setJustSavedToast(true);
    setTimeout(() => setJustSavedToast(false), 1800);
  };

  return (
    <aside className="hidden md:flex w-[290px] xl:w-[340px] bg-[#0e0e10] border-l border-white/[0.07] flex-col h-full shrink-0 select-none z-20 overflow-hidden">
      {/* Top 4 Inspector Tabs (Templates / Style | Customize | Text | Project) */}
      <div className="h-10 px-2 border-b border-white/[0.07] grid grid-cols-4 gap-1 items-center bg-[#0b0b0d] shrink-0">
        {(
          [
            { id: 'templates', label: 'Templates' },
            { id: 'customize', label: 'Customize' },
            { id: 'text', label: 'Text' },
            { id: 'project', label: 'Project' },
          ] as const
        ).map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              data-testid={`right-tab-${tab.id}`}
              onClick={() => onSelectTab(tab.id)}
              className={`py-2 text-xs font-semibold transition-all cursor-pointer relative ${
                isActive
                  ? 'text-white'
                  : 'text-zinc-500 hover:text-zinc-200'
              }`}
            >
              <span>{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 inset-x-3 h-[2px] bg-[#f5a524] rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* ==================== TAB 1: TEMPLATES / STYLES (106 Authentic Captik Templates) ==================== */}
      {activeTab === 'templates' && (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="p-3 border-b border-white/[0.07] space-y-2.5">
            {/* Segmented Toggle: Captik Templates (106) | My Presets */}
            <div className="grid grid-cols-2 gap-1 bg-[#141418] p-1 rounded-full border border-white/[0.07]">
              <button
                type="button"
                onClick={() => setPresetMode('captik')}
                className={`py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                  presetMode === 'captik'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Captik Templates (106)
              </button>
              <button
                type="button"
                onClick={() => setPresetMode('my')}
                className={`py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                  presetMode === 'my'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                My Presets ({savedPresets.length})
              </button>
            </div>

            {/* Search Input + Save Preset Button */}
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Find a template..."
                  className="w-full bg-[#171922] border border-white/[0.08] rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>
              <button
                type="button"
                onClick={handleSavePresetClick}
                className="px-2.5 py-1.5 rounded-lg bg-[#171922] hover:bg-[#222634] border border-white/[0.08] text-[11px] font-semibold text-zinc-200 flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
              >
                <Bookmark className="w-3 h-3 text-amber-400" />
                <span>{justSavedToast ? 'Saved!' : 'Save Preset'}</span>
              </button>
            </div>

            {/* Category Pills (All 106, Popular 16, Behind you 29, Bold & animated 16, Clean 20, Property reels 20, Around you 21) */}
            <div className="flex flex-wrap gap-1">
              {TEMPLATE_TABS.map((cat) => {
                const isSelected = selectedCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setSelectedCategory(cat.key)}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-black'
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

          {/* Section Title + Card View Switcher (Reel + Effect vs Studio Typography) */}
          <div className="px-3.5 py-1.5 border-b border-white/[0.05] flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            <span>DYNAMIC CAPTIONS ({visibleTemplates.length})</span>
            <div className="flex items-center gap-1 bg-[#171922] p-0.5 rounded-md border border-white/[0.06]">
              <button
                type="button"
                onClick={() => setPreviewMode('video')}
                title="Live Captik Reel + Visual Text Effect Cards"
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 cursor-pointer ${
                  previewMode === 'video'
                    ? 'bg-amber-500 text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Film className="w-2.5 h-2.5" />
                <span>Reel + Effect</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('studio')}
                title="Captik Editor Typography Cards"
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 cursor-pointer ${
                  previewMode === 'studio'
                    ? 'bg-amber-500 text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-2.5 h-2.5" />
                <span>Text Only</span>
              </button>
            </div>
          </div>

          {/* 2-Column Authentic Captik Style Cards Grid (Matches captik_desk.webp with Reel Image + Live Styled Text Effect) */}
          <div className="flex-1 overflow-y-auto p-2.5 custom-scrollbar">
            <div className="grid grid-cols-2 gap-2.5">
              {visibleTemplates.map((tpl) => {
                const isSelected = activeTemplate.id === tpl.id;
                const isHovered = hoveredTplId === tpl.id;

                return (
                  <button
                    key={tpl.id}
                    type="button"
                    data-testid={`template-card-${tpl.id}`}
                    onClick={() => onSelectTemplate(tpl)}
                    onMouseEnter={() => setHoveredTplId(tpl.id)}
                    onMouseLeave={() => setHoveredTplId(null)}
                    className={`group relative ${
                      previewMode === 'video' ? 'aspect-[9/14]' : 'min-h-[126px]'
                    } w-full rounded-xl overflow-hidden border text-left transition-all flex flex-col justify-between p-2 cursor-pointer bg-[#15171F] ${
                      isSelected
                        ? 'border-amber-400 ring-2 ring-amber-400/35 shadow-lg shadow-amber-500/10'
                        : 'border-white/[0.08] hover:border-white/25'
                    }`}
                  >
                    {/* Reel Poster / Hover Video Background (Matches captik_desk.webp) */}
                    {previewMode === 'video' && (
                      <>
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
                        {isHovered && (
                          <video
                            src={tpl.previewVideoUrl}
                            autoPlay
                            muted
                            loop
                            playsInline
                            className="absolute inset-0 w-full h-full object-cover z-10"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/25 z-10 pointer-events-none" />
                      </>
                    )}

                    {/* Top Badges (Popular, New, Behind you, etc.) */}
                    <div className="relative z-20 flex items-center justify-between gap-1 w-full">
                      {tpl.badge ? (
                        <span
                          className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-tight ${
                            tpl.badge === 'Popular'
                              ? 'bg-[#f5a524] text-black'
                              : tpl.badge === 'New'
                              ? 'bg-[#ea580c] text-white'
                              : tpl.badge === 'Behind you'
                              ? 'bg-sky-500/30 text-sky-200 border border-sky-400/40'
                              : tpl.badge === 'Property'
                              ? 'bg-fuchsia-500/30 text-fuchsia-200 border border-fuchsia-400/40'
                              : tpl.badge === '3D Around'
                              ? 'bg-purple-500/30 text-purple-200 border border-purple-400/40'
                              : 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40'
                          }`}
                        >
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

                    {/* Live Visual Caption Effect Preview (Always shown in BOTH Reel + Effect and Text Only modes!) */}
                    <div
                      className={`relative z-20 my-auto w-full flex items-center justify-center overflow-hidden pointer-events-none ${
                        previewMode === 'video'
                          ? 'py-1.5 px-1 rounded-lg bg-black/35 backdrop-blur-[1px] scale-95'
                          : 'py-2'
                      }`}
                    >
                      <CaptikCardPreview template={tpl} />
                    </div>

                    {/* Bottom Template Name & Active Checkmark */}
                    <div className="relative z-20 flex items-center justify-between w-full pt-1.5 border-t border-white/[0.08]">
                      <div className="min-w-0 pr-1">
                        <div className="text-[11px] font-bold text-white truncate drop-shadow">
                          {tpl.name}
                        </div>
                        <div className="text-[9px] text-zinc-300 truncate">
                          {tpl.lookSpec
                            ? `${tpl.lookSpec.family} · ${tpl.lookSpec.font
                                .split(',')[0]
                                .replace(/"/g, '')}`
                            : tpl.category}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-amber-400 text-black flex items-center justify-center shrink-0 shadow">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: CUSTOMIZE ==================== */}
      {activeTab === 'customize' && (
        <div className="flex-1 overflow-y-auto p-3.5 space-y-4 custom-scrollbar">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-200">
              <Palette className="w-3.5 h-3.5 text-amber-400" />
              <span>Customize: {activeTemplate.name}</span>
            </div>
            <button
              type="button"
              onClick={onResetStyleOverrides}
              className="text-[11px] text-zinc-400 hover:text-amber-400 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          {/* Template Architecture Summary Card */}
          <div className="p-3 rounded-xl bg-[#161922] border border-white/[0.08] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                {activeTemplate.lookSpec
                  ? `Captik Look Engine · ${activeTemplate.lookSpec.family.toUpperCase()}`
                  : `Captik Classic · ${activeTemplate.id}`}
              </span>
              {activeTemplate.badge && (
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold">
                  {activeTemplate.badge}
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-300 leading-relaxed">
              {activeTemplate.description}
            </p>
            {activeTemplate.lookSpec?.impact && (
              <div className="text-[10px] text-zinc-400 pt-1 border-t border-white/[0.06] flex items-center justify-between">
                <span>Hero Impact Font:</span>
                <span className="font-mono text-zinc-200">
                  {activeTemplate.lookSpec.impact.font.split(',')[0].replace(/"/g, '')} ({activeTemplate.lookSpec.impact.sizePx}px)
                </span>
              </div>
            )}
          </div>

          {/* Editor Masala Persona Switcher (Auto / Persona A Serif / Persona B Montserrat) */}
          {activeTemplate.id === 'editor_masala' && (
            <div className="p-3 rounded-xl bg-[#161922] border border-amber-500/30 space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                Editor Masala Persona Mode
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { id: 'auto', label: 'Auto Alternate' },
                    { id: 'A', label: 'Persona A (Serif)' },
                    { id: 'B', label: 'Persona B (Gold)' },
                  ] as const
                ).map((pm) => {
                  const active = (styleOverrides.personaMode ?? 'auto') === pm.id;
                  return (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() =>
                        onChangeStyleOverrides({
                          ...styleOverrides,
                          personaMode: pm.id,
                        })
                      }
                      className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                        active
                          ? 'bg-amber-500 text-black border-amber-400'
                          : 'bg-[#111217] text-zinc-300 border-white/[0.07] hover:border-white/20'
                      }`}
                    >
                      {pm.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Behind You (AI Person Cutout) */}
          <div className="p-3 rounded-xl bg-[#161922] border border-white/[0.08] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="text-xs font-bold text-white">
                    Behind You (AI Person Cutout)
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    Place giant hero keyword behind speaker’s head
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  onChangeStyleOverrides({
                    ...styleOverrides,
                    behindSubject: !styleOverrides.behindSubject,
                  })
                }
                aria-label="Toggle Behind You depth cutout"
                className={`w-10 h-5 rounded-full transition-colors p-0.5 cursor-pointer ${
                  styleOverrides.behindSubject ? 'bg-amber-500' : 'bg-zinc-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-black transition-transform ${
                    styleOverrides.behindSubject ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {styleOverrides.behindSubject && (
              <div className="pt-1 space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-400">Hero Backdrop Scale</span>
                  <span className="font-mono text-amber-400 tabular-nums">
                    {Math.round((Number.isFinite(styleOverrides.behindHeroScale) ? styleOverrides.behindHeroScale : 1) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.7}
                  max={1.6}
                  step={0.05}
                  value={Number.isFinite(styleOverrides.behindHeroScale) ? styleOverrides.behindHeroScale : 1}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    onChangeStyleOverrides({
                      ...styleOverrides,
                      behindHeroScale: Number.isFinite(val) && val > 0 ? val : 1,
                    });
                  }}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Caption Color Palette */}
          <div className="p-3 rounded-xl bg-[#161922] border border-white/[0.08] space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Caption Color Palette
            </div>

            <div className="grid grid-cols-3 gap-2">
              <label className="p-2 rounded-lg bg-[#111217] border border-white/[0.06] flex flex-col gap-1 cursor-pointer">
                <span className="text-[10px] text-zinc-400">Base Text</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={styleOverrides.primaryColor}
                    onChange={(e) =>
                      onChangeStyleOverrides({
                        ...styleOverrides,
                        primaryColor: e.target.value,
                      })
                    }
                    className="w-5 h-5 rounded border-0 bg-transparent cursor-pointer"
                  />
                  <span className="text-[10px] font-mono text-zinc-200 uppercase">
                    {styleOverrides.primaryColor}
                  </span>
                </div>
              </label>

              <label className="p-2 rounded-lg bg-[#111217] border border-white/[0.06] flex flex-col gap-1 cursor-pointer">
                <span className="text-[10px] text-zinc-400">Active / Hero</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={styleOverrides.accentColor}
                    onChange={(e) =>
                      onChangeStyleOverrides({
                        ...styleOverrides,
                        accentColor: e.target.value,
                      })
                    }
                    className="w-5 h-5 rounded border-0 bg-transparent cursor-pointer"
                  />
                  <span className="text-[10px] font-mono text-zinc-200 uppercase">
                    {styleOverrides.accentColor}
                  </span>
                </div>
              </label>

              <label className="p-2 rounded-lg bg-[#111217] border border-white/[0.06] flex flex-col gap-1 cursor-pointer">
                <span className="text-[10px] text-zinc-400">Accent 2</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={styleOverrides.secondaryColor}
                    onChange={(e) =>
                      onChangeStyleOverrides({
                        ...styleOverrides,
                        secondaryColor: e.target.value,
                      })
                    }
                    className="w-5 h-5 rounded border-0 bg-transparent cursor-pointer"
                  />
                  <span className="text-[10px] font-mono text-zinc-200 uppercase">
                    {styleOverrides.secondaryColor}
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Position & Scale */}
          <div className="p-3 rounded-xl bg-[#161922] border border-white/[0.08] space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Position & Scale
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-300">Caption Size Scale</span>
                <span className="font-mono text-amber-400 tabular-nums">
                  {Math.round((Number.isFinite(styleOverrides.fontScale) ? styleOverrides.fontScale : 1) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0.65}
                max={1.55}
                step={0.05}
                value={Number.isFinite(styleOverrides.fontScale) ? styleOverrides.fontScale : 1}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  onChangeStyleOverrides({
                    ...styleOverrides,
                    fontScale: Number.isFinite(val) && val > 0 ? val : 1,
                  });
                }}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-300">Vertical Y Position</span>
                <span className="font-mono text-amber-400 tabular-nums">
                  {styleOverrides.yOffset}%
                </span>
              </div>
              <input
                type="range"
                min={18}
                max={88}
                value={styleOverrides.yOffset}
                onChange={(e) =>
                  onChangeStyleOverrides({
                    ...styleOverrides,
                    yOffset: Number(e.target.value),
                  })
                }
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 3: TEXT INSPECTOR (127 Google Fonts + Motion Keys) ==================== */}
      {activeTab === 'text' && (
        <div className="flex-1 overflow-y-auto p-3.5 space-y-4 custom-scrollbar">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-200">
              <Type className="w-3.5 h-3.5 text-amber-400" />
              <span>Captik Typography & Motion</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-400">
              {CAPTIK_GOOGLE_FONTS.length} Fonts
            </span>
          </div>

          {/* Spoken Word Highlight & Upcoming Words (from Captik MOTION_KEYS) */}
          <div className="p-3 rounded-xl bg-[#161922] border border-white/[0.08] space-y-2.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Spoken Word Highlight
            </div>
            <div className="grid grid-cols-5 gap-1">
              {(['color', 'grow', 'box', 'underline', 'glow'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSpokenStyle(mode)}
                  className={`py-1 rounded text-[10px] font-bold capitalize cursor-pointer ${
                    spokenStyle === mode
                      ? 'bg-amber-500 text-black'
                      : 'bg-[#111217] text-zinc-300 hover:bg-[#1e2230]'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 pt-1">
              Upcoming Words
            </div>
            <div className="grid grid-cols-3 gap-1">
              {(['show', 'dim', 'hide'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setUpcomingMode(m)}
                  className={`py-1 rounded text-[10px] font-bold capitalize cursor-pointer ${
                    upcomingMode === m
                      ? 'bg-amber-500 text-black'
                      : 'bg-[#111217] text-zinc-300 hover:bg-[#1e2230]'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* 127 Google Fonts Browser */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Font Family ({filteredGoogleFonts.length})
              </span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={fontSearch}
                onChange={(e) => setFontSearch(e.target.value)}
                placeholder="Search 127 Google Fonts..."
                className="w-full bg-[#171922] border border-white/[0.08] rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div className="flex flex-wrap gap-1">
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'display', label: 'Display' },
                  { id: 'sans', label: 'Sans' },
                  { id: 'serif', label: 'Serif' },
                  { id: 'hand', label: 'Handwritten' },
                  { id: 'mono', label: 'Mono' },
                ] as const
              ).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFontCategory(cat.id)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                    fontCategory === cat.id
                      ? 'bg-amber-500 text-black'
                      : 'bg-[#171922] text-zinc-400 hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="max-h-[240px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              {filteredGoogleFonts.map((f) => {
                const cssFamily = `"${f.family}", sans-serif`;
                const isCurrent = activeTemplate.fontFamily.includes(f.family);
                return (
                  <button
                    key={f.family}
                    type="button"
                    onClick={() =>
                      onSelectTemplate({
                        ...activeTemplate,
                        fontFamily: cssFamily,
                        lookSpec: activeTemplate.lookSpec
                          ? { ...activeTemplate.lookSpec, font: cssFamily }
                          : undefined,
                      })
                    }
                    style={{ fontFamily: cssFamily }}
                    className={`w-full px-3 py-1.5 rounded-lg border text-left text-xs flex items-center justify-between transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold'
                        : 'bg-[#161820] border-white/[0.07] text-zinc-200 hover:border-white/20'
                    }`}
                  >
                    <span>{f.family}</span>
                    <span className="text-[9px] font-sans uppercase text-zinc-500">
                      {f.cat}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Case, Shadow & Stroke */}
          <div className="p-3 rounded-xl bg-[#161922] border border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-200">
                Force Uppercase Display
              </span>
              <button
                type="button"
                onClick={() =>
                  onChangeStyleOverrides({
                    ...styleOverrides,
                    uppercase: !styleOverrides.uppercase,
                  })
                }
                className={`px-2.5 py-1 rounded text-xs font-bold cursor-pointer ${
                  styleOverrides.uppercase
                    ? 'bg-amber-500 text-black'
                    : 'bg-[#222634] text-zinc-300'
                }`}
              >
                {styleOverrides.uppercase ? 'UPPERCASE ON' : 'Mixed Case'}
              </button>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-300">Drop Shadow Depth</span>
                <span className="font-mono text-amber-400 tabular-nums">
                  {styleOverrides.shadowStrength}px
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={32}
                value={styleOverrides.shadowStrength}
                onChange={(e) =>
                  onChangeStyleOverrides({
                    ...styleOverrides,
                    shadowStrength: Number(e.target.value),
                  })
                }
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-300">Outline Stroke Width</span>
                <span className="font-mono text-amber-400 tabular-nums">
                  {styleOverrides.strokeWidth}px
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={4}
                step={0.5}
                value={styleOverrides.strokeWidth}
                onChange={(e) =>
                  onChangeStyleOverrides({
                    ...styleOverrides,
                    strokeWidth: Number(e.target.value),
                  })
                }
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 4: PROJECT METADATA ==================== */}
      {activeTab === 'project' && (
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 custom-scrollbar">
          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-200">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>Project Specifications</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#161922] border border-white/[0.08] space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-white/[0.05]">
              <span className="text-zinc-400">Project Title</span>
              <span className="font-semibold text-white">{projectName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/[0.05]">
              <span className="text-zinc-400">Aspect Ratio</span>
              <span className="font-mono tabular-nums text-amber-400 font-bold">
                {aspectRatio}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/[0.05]">
              <span className="text-zinc-400">Duration</span>
              <span className="font-mono tabular-nums text-zinc-200">
                {duration.toFixed(2)}s (30 fps)
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/[0.05]">
              <span className="text-zinc-400">Caption Lines</span>
              <span className="font-mono tabular-nums text-zinc-200">
                {segmentCount} segments
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-zinc-400">Total Transcribed Words</span>
              <span className="font-mono tabular-nums text-emerald-400 font-bold">
                {wordCount} words
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Captik Hinglish Engine v2.4</span>
            </div>
            <p className="text-[11px] text-zinc-300 leading-relaxed">
              Word-level timestamps are locked to 30fps frame boundaries with automatic
              foreground person segmentation for Behind-You templates.
            </p>
          </div>
        </div>
      )}
    </aside>
  );
};

