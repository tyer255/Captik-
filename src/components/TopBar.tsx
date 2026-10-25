import React, { useState } from 'react';
import {
  ArrowLeft,
  Download,
  HelpCircle,
  Check,
  Pencil,
  Save,
  Plus,
  ScanText,
  FolderKanban,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import type { CaptikProject } from '../utils/projectAndOcrLogic';

export type AppViewMode =
  | 'landing'
  | 'editor'
  | 'workspace'
  | 'templates'
  | 'plugin'
  | 'pricing'
  | 'changelog'
  | 'about'
  | 'privacy'
  | 'terms';

export type ExportQuality = '1080p' | '720p' | '4K';

interface TopBarProps {
  projectName: string;
  onProjectNameChange: (name: string) => void;
  activeView: AppViewMode;
  onChangeView: (view: AppViewMode) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onDownloadSrt: () => void;
  onOpenHelp: () => void;
  quality: ExportQuality;
  onQualityChange: (q: ExportQuality) => void;
  onOpenExportModal: () => void;
  activeTemplateName: string;
  projects: CaptikProject[];
  activeProjectId: string;
  onSelectProject: (projectId: string) => void;
  onOpenNewProjectModal: () => void;
  onTriggerOcrScan: () => void;
  isOcrScanning: boolean;
  detectedTextCount: number;
  onSaveProject: () => void;
}

/**
 * Official Captik two-row pill emblem from captik.in & captik_desk.webp
 */
export const CaptikLogoIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <div
    className={`${className} rounded-[7px] bg-[#19191d] border border-white/[0.12] flex flex-col items-center justify-center gap-[3px] p-1 shrink-0`}
  >
    <div className="flex items-center gap-[2.5px] w-full justify-center">
      <span className="w-[4.5px] h-[4.5px] rounded-full bg-[#f5a524]" />
      <span className="w-[9px] h-[4px] rounded-full bg-[#71717a]" />
    </div>
    <div className="flex items-center gap-[2.5px] w-full justify-center">
      <span className="w-[9px] h-[4px] rounded-full bg-[#a1a1aa]" />
      <span className="w-[4.5px] h-[4.5px] rounded-full bg-[#52525b]" />
    </div>
  </div>
);

export const TopBar: React.FC<TopBarProps> = ({
  projectName,
  onProjectNameChange,
  activeView,
  onChangeView,
  onDownloadSrt,
  onOpenHelp,
  quality,
  onQualityChange,
  onOpenExportModal,
  projects,
  activeProjectId,
  onSelectProject,
  onOpenNewProjectModal,
  onTriggerOcrScan,
  isOcrScanning,
  detectedTextCount,
  onSaveProject,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState(projectName);
  const [savedToast, setSavedToast] = useState(false);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);

  const commitName = () => {
    const trimmed = draftName.trim();
    if (trimmed) {
      onProjectNameChange(trimmed);
    } else {
      setDraftName(projectName);
    }
    setIsEditingName(false);
  };

  const handleSaveClick = () => {
    onSaveProject();
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 1600);
  };

  // When on non-editor marketing/site pages (Home, Templates, Plugin, Pricing, Changelog, About, Privacy, Terms),
  // render the exact Captik.in site navigation header!
  if (activeView !== 'editor') {
    const isPaperTop = activeView === 'pricing';
    return (
      <header
        className={`h-14 px-4 md:px-10 border-b flex items-center justify-between select-none shrink-0 z-40 transition-colors ${
          isPaperTop
            ? 'bg-[#f1ece2]/95 border-[#17150f]/12 text-[#17150f]'
            : 'bg-[#0b0b0c]/95 border-white/[0.08] text-[#f3efe7]'
        } backdrop-blur-md`}
      >
        {/* Left: Captik Logo */}
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => onChangeView('landing')}
            className="flex items-center gap-2 group cursor-pointer"
          >
            <CaptikLogoIcon className="w-6 h-6" />
            <span className="font-display font-bold text-[17px] tracking-tight">
              Captik
            </span>
          </button>

          {/* Center-Left Nav Links matching https://captik.in/ */}
          <nav
            aria-label="Captik site navigation"
            className="hidden md:flex items-center gap-7 text-[13.5px] font-medium"
          >
            <button
              type="button"
              onClick={() => onChangeView('landing')}
              className={`transition-colors cursor-pointer flex items-center gap-1 ${
                activeView === 'landing'
                  ? 'text-white font-medium'
                  : isPaperTop
                  ? 'text-[#6b655a] hover:text-[#17150f]'
                  : 'text-[#8f8a82] hover:text-[#f3efe7]'
              }`}
            >
              <span>Product</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#8f8a82]" />
            </button>
            <button
              type="button"
              onClick={() => onChangeView('plugin')}
              className={`transition-colors cursor-pointer ${
                activeView === 'plugin'
                  ? 'text-[#f5a524] font-semibold'
                  : isPaperTop
                  ? 'text-[#6b655a] hover:text-[#17150f]'
                  : 'text-[#8f8a82] hover:text-[#f3efe7]'
              }`}
            >
              Plugin
            </button>
            <button
              type="button"
              onClick={() => onChangeView('pricing')}
              className={`transition-colors cursor-pointer ${
                activeView === 'pricing'
                  ? 'text-[#b45f06] font-semibold'
                  : isPaperTop
                  ? 'text-[#6b655a] hover:text-[#17150f]'
                  : 'text-[#8f8a82] hover:text-[#f3efe7]'
              }`}
            >
              Pricing
            </button>
            <button
              type="button"
              onClick={() => onChangeView('changelog')}
              className={`transition-colors cursor-pointer ${
                activeView === 'changelog'
                  ? 'text-[#f5a524] font-semibold'
                  : isPaperTop
                  ? 'text-[#6b655a] hover:text-[#17150f]'
                  : 'text-[#8f8a82] hover:text-[#f3efe7]'
              }`}
            >
              Changelog
            </button>
            <button
              type="button"
              onClick={() => onChangeView('about')}
              className={`transition-colors cursor-pointer ${
                activeView === 'about'
                  ? 'text-[#f5a524] font-semibold'
                  : isPaperTop
                  ? 'text-[#6b655a] hover:text-[#17150f]'
                  : 'text-[#8f8a82] hover:text-[#f3efe7]'
              }`}
            >
              About
            </button>
          </nav>
        </div>

        {/* Right: Exactly as screenshot: "Editor" (NO "M" avatar per user instructions) */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            data-testid="header-open-editor-btn"
            onClick={() => onChangeView('editor')}
            className="text-[13.5px] font-medium transition-colors cursor-pointer hover:text-white text-[#c4c0b8]"
          >
            Editor
          </button>
        </div>
      </header>
    );
  }

  // ==================== STUDIO EDITOR TOP BAR (Exact Match to captik_desk.webp) ====================
  return (
    <header className="h-11 bg-[#0b0b0c] border-b border-white/[0.08] px-3 flex items-center justify-between select-none shrink-0 z-30">
      {/* Left: Back Arrow, Captik Logo + Wordmark, Project Title + Switcher + New Project */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={() => onChangeView('landing')}
          title="Back to Captik.in Home"
          aria-label="Back to Captik.in Home"
          className="w-7 h-7 rounded-md hover:bg-white/[0.06] flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => onChangeView('landing')}
          className="flex items-center gap-2 cursor-pointer"
          title="Captik.in Home"
        >
          <CaptikLogoIcon className="w-6 h-6" />
          <span className="font-display font-bold text-[15px] text-[#f3efe7] tracking-tight hidden sm:inline">
            Captik
          </span>
        </button>

        {/* Editable Project Name (matching "Terrace reel ✏️" in captik_desk.webp) */}
        {isEditingName ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              commitName();
            }}
            className="flex items-center gap-1 ml-1"
          >
            <input
              type="text"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onBlur={commitName}
              autoFocus
              aria-label="Project title"
              className="bg-[#16161a] text-white text-xs font-medium px-2 py-1 rounded border border-[#f5a524]/60 focus:outline-none w-36"
            />
            <button
              type="submit"
              aria-label="Save project title"
              className="p-1 text-emerald-400 hover:text-emerald-300"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => {
              setDraftName(projectName);
              setIsEditingName(true);
            }}
            className="group flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/[0.05] text-[#d4d4d8] text-[13px] font-medium transition-colors cursor-pointer"
            title="Click to rename project"
          >
            <span className="truncate max-w-[90px] sm:max-w-[140px]">{projectName}</span>
            <Pencil className="w-3 h-3 text-zinc-500 group-hover:text-zinc-300 transition-colors shrink-0" />
          </button>
        )}

        {/* Project Switcher Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setProjectMenuOpen((v) => !v)}
            className="h-7 px-2 rounded-md bg-[#141418] hover:bg-[#1c1c22] border border-white/[0.08] text-[11px] font-medium text-zinc-300 flex items-center gap-1 cursor-pointer"
            title="Switch or manage video projects"
          >
            <FolderKanban className="w-3 h-3 text-[#f5a524]" />
            <span className="hidden md:inline">Projects ({projects.length})</span>
            <ChevronDown className="w-3 h-3 text-zinc-500" />
          </button>

          {projectMenuOpen && (
            <div
              className="absolute left-0 top-9 w-64 rounded-xl bg-[#141418] border border-white/15 shadow-2xl p-1.5 z-50 space-y-1"
              onMouseLeave={() => setProjectMenuOpen(false)}
            >
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                <span>Your Video Projects</span>
                <button
                  type="button"
                  onClick={() => {
                    setProjectMenuOpen(false);
                    onChangeView('workspace');
                  }}
                  className="text-[#f5a524] hover:underline cursor-pointer"
                >
                  View all
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-0.5">
                {projects.map((p) => {
                  const isCurrent = p.id === activeProjectId;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        onSelectProject(p.id);
                        setProjectMenuOpen(false);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        isCurrent
                          ? 'bg-[#f5a524]/15 text-[#f5a524] font-semibold'
                          : 'text-zinc-200 hover:bg-white/[0.06]'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="truncate">{p.name}</div>
                        <div className="text-[10px] text-zinc-500 truncate">
                          {p.duration.toFixed(1)}s • {p.detectedTexts.length} OCR text
                          {p.detectedTexts.length === 1 ? '' : 's'}
                        </div>
                      </div>
                      {isCurrent && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
              <div className="pt-1 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => {
                    setProjectMenuOpen(false);
                    onOpenNewProjectModal();
                  }}
                  className="w-full py-1.5 px-2.5 rounded-lg bg-[#f5a524] text-black font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>New Project / Upload Video</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Prominent + New Project Button */}
        <button
          type="button"
          data-testid="new-project-btn"
          onClick={onOpenNewProjectModal}
          className="h-7 px-2.5 rounded-md bg-[#18181d] hover:bg-[#23232b] border border-[#f5a524]/40 text-[#f5a524] text-[11.5px] font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
          title="Create a new project and upload a video from your device"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span className="hidden sm:inline">New Project</span>
          <span className="sm:hidden">New</span>
        </button>

        {/* Automatic OCR Text Detection Button */}
        <button
          type="button"
          data-testid="topbar-ocr-btn"
          onClick={onTriggerOcrScan}
          disabled={isOcrScanning}
          className="hidden lg:flex h-7 px-2.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/35 text-emerald-300 text-[11.5px] font-semibold items-center gap-1.5 transition-colors cursor-pointer shrink-0 disabled:opacity-60"
          title="Scan current video frames with real OCR to detect and edit text inside the video"
        >
          {isOcrScanning ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
          ) : (
            <ScanText className="w-3.5 h-3.5 text-emerald-400" />
          )}
          <span>
            {isOcrScanning
              ? 'Scanning Video Text...'
              : detectedTextCount > 0
              ? `Detected Text (${detectedTextCount})`
              : 'Auto-Detect Text'}
          </span>
        </button>
      </div>

      {/* Right: Save, SRT, Help ?, Quality [1080p | 720p], Export (Exact match to captik_desk.webp) */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleSaveClick}
          className="hidden sm:flex h-7 px-2.5 rounded-md hover:bg-white/[0.06] text-zinc-300 hover:text-white text-xs font-medium items-center gap-1.5 transition-colors cursor-pointer"
          title="Save project locally"
        >
          {savedToast ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Saved</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5 text-zinc-400" />
              <span>Save</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onDownloadSrt}
          title="Download SubRip (.SRT) subtitle file"
          className="hidden sm:flex h-7 px-2.5 rounded-md bg-[#f5a524]/10 hover:bg-[#f5a524]/20 border border-[#f5a524]/45 text-[#f5a524] text-xs font-semibold items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Download className="w-3 h-3" />
          <span>SRT</span>
        </button>

        <button
          type="button"
          onClick={onOpenHelp}
          title="Keyboard shortcuts & Captik Studio Guide"
          aria-label="Help and shortcuts"
          className="hidden sm:flex relative w-7 h-7 rounded-md hover:bg-white/[0.06] text-zinc-400 hover:text-white items-center justify-center transition-colors cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#f5a524]" />
        </button>

        {/* Quality segmented selector matching captik_desk.webp */}
        <div className="hidden md:flex items-center gap-1 bg-[#141418] border border-white/[0.08] rounded-lg px-2 py-0.5 h-7">
          <span className="text-[11px] text-zinc-400 font-medium mr-0.5">Quality</span>
          {(['1080p', '720p', '4K'] as ExportQuality[]).map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => onQualityChange(q)}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold tabular-nums transition-all cursor-pointer ${
                quality === q
                  ? 'bg-[#26262e] text-white shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Amber Export CTA */}
        <button
          type="button"
          data-testid="export-video-btn"
          onClick={onOpenExportModal}
          className="h-7 px-3.5 rounded-lg bg-[#f5a524] hover:bg-[#fbbf24] active:bg-[#d97706] text-[#120d02] font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 stroke-[2.2]" />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
};
