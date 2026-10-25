/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  TopBar,
  type AppViewMode,
  type ExportQuality,
} from './components/TopBar';
import {
  LeftSidebarPanel,
  type LeftRailTab,
} from './components/LeftSidebarPanel';
import { PlayerStage, type AspectRatioPreset } from './components/PlayerStage';
import {
  RightInspectorPanel,
  type RightInspectorTab,
} from './components/RightInspectorPanel';
import {
  BottomTimeline,
  type SelectedTimelineTrackType,
} from './components/BottomTimeline';
import {
  WorkspaceAndLandingView,
  StudioModals,
} from './components/WorkspaceAndLandingModal';
import {
  AI_EDIT_LOOKS,
  TEMPLATES,
  TEMPLATE_TABS,
  findTemplate,
  type CaptionTemplateSpec,
} from './data/templatesCatalog';
import { CaptikCardPreview } from './components/CaptikTemplateRenderer';
import {
  MEDIA_LIBRARY_ASSETS,
  GRAPHIC_ELEMENTS,
  SFX_LIBRARY,
  playSfxSound,
  type MediaAssetItem,
} from './data/assetsCatalog';
import {
  HYDRATED_INITIAL_SEGMENTS,
  hydrateSegmentsFromWords,
  getActiveSegmentAndWord,
  rebuildSegmentsByLineMode,
  splitSegmentAtWord,
  cycleWordEmphasis,
  generateSrt,
  parseSrt,
  applyPauseRemovalMode,
  filterTemplates,
  createInitialVideoClips,
  createInitialAudioClips,
  computeEditedTimelineDuration,
  splitVideoAndAudioClipsAtTime,
  trimVideoClipBoundary,
  trimAudioClipBoundary,
  deleteVideoOrAudioClip,
  moveOrRearrangeClip,
  DEFAULT_ADJUSTMENTS,
  type CaptionSegment,
  type ColorAdjustments,
  type CustomStyleOverrides,
  type TimelineOverlayItem,
  type VideoTimelineClip,
  type AudioTimelineClip,
} from './utils/editorLogic';
import {
  createNewProjectRecord,
  updateDetectedTextItem,
  convertDetectedTextsToCaptionSegments,
  type CaptikProject,
  type DetectedVideoTextItem,
} from './utils/projectAndOcrLogic';
import {
  saveVideoBlobToIdb,
  loadVideoBlobFromIdb,
  deleteVideoBlobFromIdb,
  extractVideoMetadataAndFilmstrip,
  runAutomaticVideoOcr,
  generateCustomVideoWithEmbeddedText,
  exportEditedVideoToBlob,
  type OcrScanProgress,
} from './utils/videoOcrEngine';
import {
  ScanText,
  Captions,
  Sparkles,
  FolderOpen,
  Play,
  Plus,
  Trash2,
} from 'lucide-react';

const PROJECTS_STORAGE_KEY = 'captik_studio_projects_v2';
const ACTIVE_PROJECT_ID_KEY = 'captik_studio_active_project_id_v2';

interface HistorySnapshot {
  segments: CaptionSegment[];
  templateId: string;
  styleOverrides: CustomStyleOverrides;
  adjustments: ColorAdjustments;
  overlays: TimelineOverlayItem[];
  detectedTexts: DetectedVideoTextItem[];
  videoClips: VideoTimelineClip[];
  audioClips: AudioTimelineClip[];
  isAudioLinked: boolean;
}

function createInitialOverrides(tpl: CaptionTemplateSpec): CustomStyleOverrides {
  return {
    fontScale: 1,
    yOffset: 76,
    xOffset: 50,
    primaryColor: tpl.textColor,
    accentColor: tpl.emphasisColor,
    secondaryColor: tpl.secondaryColor || '#10B981',
    bgOpacity: tpl.boxBg ? 75 : 0,
    behindSubject: Boolean(tpl.behind),
    behindHeroScale: 1,
    uppercase: Boolean(tpl.uppercase),
    shadowStrength: 14,
    strokeWidth: tpl.strokeWidth || 0,
    animIn: 'Pop',
    animOut: 'Fade out',
    animLoop: 'Pulse',
  };
}

function createDefaultInitialProject(): CaptikProject {
  const defaultAsset = MEDIA_LIBRARY_ASSETS[0];
  const defaultTpl = findTemplate('look_garnet');
  const initialDetected: DetectedVideoTextItem[] = [
    {
      id: 'ocr-init-1',
      text: 'TERRACE CREATOR REEL',
      originalText: 'TERRACE CREATOR REEL',
      startTime: 0.2,
      endTime: 2.5,
      x: 50,
      y: 16,
      originalX: 50,
      originalY: 16,
      width: 68,
      height: 10,
      confidence: 94,
      fontScale: 1,
      textColor: '#FFFDF8',
      bgColor: '#141418',
      maskOriginal: true,
      isRemoved: false,
      stylePreset: 'template',
    },
    {
      id: 'ocr-init-2',
      text: 'HINGLISH CAPTIONS IN 1 CLICK',
      originalText: 'HINGLISH CAPTIONS IN 1 CLICK',
      startTime: 2.6,
      endTime: 5.2,
      x: 50,
      y: 18,
      originalX: 50,
      originalY: 18,
      width: 72,
      height: 10,
      confidence: 91,
      fontScale: 1,
      textColor: '#F5A524',
      bgColor: '#101014',
      maskOriginal: true,
      isRemoved: false,
      stylePreset: 'template',
    },
  ];

  return createNewProjectRecord({
    id: 'proj-default-terrace',
    name: defaultAsset.title,
    videoUrl: defaultAsset.videoUrl || '/assets/terrace_reel.mp4',
    posterUrl: defaultAsset.posterUrl,
    fileName: 'terrace_reel.mp4',
    isCustomUpload: false,
    duration: Number((defaultAsset.durationMs / 1000).toFixed(2)),
    aspectRatio: '9:16',
    templateId: defaultTpl.id,
    styleOverrides: createInitialOverrides(defaultTpl),
    adjustments: DEFAULT_ADJUSTMENTS,
    segments: HYDRATED_INITIAL_SEGMENTS,
    overlays: [
      {
        id: 'ov-init-1',
        type: 'element',
        label: 'STOP SCROLLING',
        start: 2.1,
        end: 4.2,
        color: '#F59E0B',
        x: 50,
        y: 24,
      },
      {
        id: 'ov-sfx-1',
        type: 'sfx',
        label: 'Fast Whoosh',
        start: 0.4,
        end: 1.1,
        color: '#10B981',
        sfxId: 'fast_air_whoosh',
      },
    ],
    detectedTexts: initialDetected,
    ocrStatus: 'completed',
    frameThumbnails: [
      '/assets/terrace_poster.webp',
      '/assets/take1.webp',
      '/assets/terrace_clean.webp',
      '/assets/take2.webp',
      '/assets/terrace_behind.webp',
    ],
  });
}

function getInitialViewFromLocation(): AppViewMode {
  if (typeof window === 'undefined') return 'editor';
  const path = window.location.pathname.toLowerCase();
  if (path === '/home' || path === '/landing') return 'landing';
  if (path.startsWith('/templates')) return 'templates';
  if (path.startsWith('/plugin')) return 'plugin';
  if (path.startsWith('/pricing')) return 'pricing';
  if (path.startsWith('/changelog')) return 'changelog';
  if (path.startsWith('/about')) return 'about';
  if (path.startsWith('/privacy')) return 'privacy';
  if (path.startsWith('/terms')) return 'terms';
  if (path.startsWith('/workspace') || path.startsWith('/projects'))
    return 'workspace';
  return 'editor';
}

export default function App() {
  const [activeView, setActiveView] = useState<AppViewMode>(() =>
    getInitialViewFromLocation()
  );

  // Load saved projects from localStorage or initialize with default project
  const [projects, setProjects] = useState<CaptikProject[]>(() => {
    try {
      const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CaptikProject[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback to default project
    }
    return [createDefaultInitialProject()];
  });

  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem(ACTIVE_PROJECT_ID_KEY);
      if (savedId) return savedId;
    } catch {
      // ignore
    }
    return 'proj-default-terrace';
  });

  const currentProject =
    projects.find((p) => p.id === activeProjectId) || projects[0];

  const [projectName, setProjectName] = useState<string>(
    currentProject?.name || 'Terrace reel'
  );
  const [quality, setQuality] = useState<ExportQuality>('1080p');
  const [aspectRatio, setAspectRatio] = useState<AspectRatioPreset>(
    currentProject?.aspectRatio || '9:16'
  );

  // Left & Right Panel Active Tabs
  const [leftTab, setLeftTab] = useState<LeftRailTab>('captions');
  const [rightTab, setRightTab] = useState<RightInspectorTab>('templates');
  // Mobile bottom drawer tab for responsive screens (<768px)
  const [mobileDrawerTab, setMobileDrawerTab] = useState<
    'none' | 'ocr' | 'captions' | 'templates' | 'projects'
  >('none');
  const [mobileStyleCat, setMobileStyleCat] = useState<string>('all');

  // Media & Playback State
  const [activeMediaAsset, setActiveMediaAsset] = useState<MediaAssetItem>(() => {
    const matched = MEDIA_LIBRARY_ASSETS.find(
      (a) => a.videoUrl === currentProject?.videoUrl
    );
    if (matched) return matched;
    return {
      ...MEDIA_LIBRARY_ASSETS[0],
      id: currentProject?.id || 'custom-proj',
      title: currentProject?.name || 'Uploaded Reel',
      videoUrl: currentProject?.videoUrl || MEDIA_LIBRARY_ASSETS[0].videoUrl,
      posterUrl: currentProject?.posterUrl || MEDIA_LIBRARY_ASSETS[0].posterUrl,
      durationMs: Math.round((currentProject?.duration || 7.07) * 1000),
    };
  });

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0.55);
  const [duration, setDuration] = useState<number>(
    currentProject?.duration || 7.07
  );
  const [playbackRate, setPlaybackRate] = useState<number>(1);

  // Caption & Template State
  const [segments, setSegments] = useState<CaptionSegment[]>(
    currentProject?.segments || HYDRATED_INITIAL_SEGMENTS
  );
  const [linesMode, setLinesMode] = useState<1 | 2>(2);
  const [activeScript, setActiveScript] = useState<string>('hinglish');
  const [pauseMode, setPauseMode] = useState<'Off' | 'Natural' | 'Tight'>('Off');
  const [timelineCaptionMode, setTimelineCaptionMode] = useState<
    'words' | 'lines'
  >('lines');
  const [timelineZoom, setTimelineZoom] = useState<number>(1);

  // Active Template
  const [activeTemplate, setActiveTemplate] = useState<CaptionTemplateSpec>(() =>
    findTemplate(currentProject?.templateId || 'look_garnet')
  );
  const [savedPresets, setSavedPresets] = useState<CaptionTemplateSpec[]>(() => [
    findTemplate('look_garnet'),
    findTemplate('captik_glow'),
    findTemplate('hormozi'),
  ]);
  const [styleOverrides, setStyleOverrides] = useState<CustomStyleOverrides>(
    () => {
      const base = currentProject?.styleOverrides || createInitialOverrides(findTemplate('look_garnet'));
      return {
        ...createInitialOverrides(findTemplate(currentProject?.templateId || 'look_garnet')),
        ...base,
        fontScale: Number.isFinite(base?.fontScale) && base.fontScale > 0 ? base.fontScale : 1,
        behindHeroScale: Number.isFinite(base?.behindHeroScale) && base.behindHeroScale > 0 ? base.behindHeroScale : 1,
        yOffset: Number.isFinite(base?.yOffset) ? base.yOffset : 76,
        xOffset: Number.isFinite(base?.xOffset) ? base.xOffset : 50,
      };
    }
  );
  const [adjustments, setAdjustments] = useState<ColorAdjustments>(
    currentProject?.adjustments || DEFAULT_ADJUSTMENTS
  );

  // Timeline Overlays
  const [overlays, setOverlays] = useState<TimelineOverlayItem[]>(
    currentProject?.overlays || []
  );

  // Multi-Clip Video & Synchronized Audio Timeline State
  const [sourceMediaDuration, setSourceMediaDuration] = useState<number>(
    currentProject?.duration || 7.07
  );
  const [videoClips, setVideoClips] = useState<VideoTimelineClip[]>(() => {
    if (currentProject?.videoClips && currentProject.videoClips.length > 0) {
      return currentProject.videoClips;
    }
    return createInitialVideoClips(
      currentProject?.duration || 7.07,
      currentProject?.name || 'Terrace reel'
    );
  });
  const [audioClips, setAudioClips] = useState<AudioTimelineClip[]>(() => {
    if (currentProject?.audioClips && currentProject.audioClips.length > 0) {
      return currentProject.audioClips;
    }
    const initV = createInitialVideoClips(
      currentProject?.duration || 7.07,
      currentProject?.name || 'Terrace reel'
    );
    return createInitialAudioClips(
      initV,
      `${currentProject?.name || 'Terrace reel'} Audio`
    );
  });
  const [isAudioLinked, setIsAudioLinked] = useState<boolean>(
    currentProject?.isAudioLinked ?? true
  );
  const [selectedClipId, setSelectedClipId] = useState<string | null>(
    'vclip-1'
  );
  const [selectedTrackType, setSelectedTrackType] =
    useState<SelectedTimelineTrackType>('video');

  // Real OCR Detected Texts State
  const [detectedTexts, setDetectedTexts] = useState<DetectedVideoTextItem[]>(
    currentProject?.detectedTexts || []
  );
  const [selectedDetectedTextId, setSelectedDetectedTextId] = useState<
    string | null
  >(null);
  const [ocrProgress, setOcrProgress] = useState<OcrScanProgress | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [frameThumbnails, setFrameThumbnails] = useState<string[]>(
    currentProject?.frameThumbnails || []
  );

  // AI Look & Tool Status
  const [activeAiLookId, setActiveAiLookId] = useState<string>('ae_overclock');
  const [aiToolStatus, setAiToolStatus] = useState<Record<string, string>>({
    remove_bg: 'Active',
    loudness: 'Done (-14 LUFS)',
  });

  // Modals
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);
  const [helpModalOpen, setHelpModalOpen] = useState<boolean>(false);
  const [newProjectModalOpen, setNewProjectModalOpen] = useState<boolean>(false);

  // Undo / Redo History Stack
  const [history, setHistory] = useState<HistorySnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<HistorySnapshot[]>([]);

  const hydratedBlobUrlsRef = useRef<Set<string>>(new Set());

  // Sync view changes with browser URL history (without page reload)
  const handleChangeView = useCallback((view: AppViewMode) => {
    setActiveView(view);
    if (typeof window !== 'undefined') {
      const pathMap: Record<AppViewMode, string> = {
        landing: '/',
        editor: '/editor',
        workspace: '/workspace',
        templates: '/templates',
        plugin: '/plugin/download',
        pricing: '/pricing',
        changelog: '/changelog',
        about: '/about',
        privacy: '/privacy',
        terms: '/terms',
      };
      const nextPath = pathMap[view] || '/';
      if (window.location.pathname !== nextPath) {
        window.history.pushState({}, '', nextPath);
      }
    }
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setActiveView(getInitialViewFromLocation());
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Rehydrate any custom uploaded video blobs from IndexedDB on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const proj of projects) {
        if (
          proj.isCustomUpload &&
          !hydratedBlobUrlsRef.current.has(proj.id)
        ) {
          const blob = await loadVideoBlobFromIdb(proj.id);
          if (blob && !cancelled) {
            const freshUrl = URL.createObjectURL(blob);
            hydratedBlobUrlsRef.current.add(proj.id);
            setProjects((prev) =>
              prev.map((p) =>
                p.id === proj.id ? { ...p, videoUrl: freshUrl } : p
              )
            );
            if (proj.id === activeProjectId) {
              setActiveMediaAsset((prev) => ({
                ...prev,
                videoUrl: freshUrl,
              }));
            }
          }
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeProjectId, projects.length]);

  // Keep current project state synced into `projects` array and `localStorage`
  useEffect(() => {
    setProjects((prev) => {
      const updated = prev.map((proj) => {
        if (proj.id !== activeProjectId) return proj;
        return {
          ...proj,
          name: projectName,
          updatedAt: Date.now(),
          duration,
          aspectRatio,
          templateId: activeTemplate.id,
          styleOverrides,
          adjustments,
          segments,
          overlays,
          videoClips,
          audioClips,
          isAudioLinked,
          detectedTexts,
          frameThumbnails,
        };
      });
      try {
        localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(updated));
        localStorage.setItem(ACTIVE_PROJECT_ID_KEY, activeProjectId);
      } catch {
        // Ignore storage quota limits
      }
      return updated;
    });
  }, [
    activeProjectId,
    projectName,
    duration,
    aspectRatio,
    activeTemplate.id,
    styleOverrides,
    adjustments,
    segments,
    overlays,
    videoClips,
    audioClips,
    isAudioLinked,
    detectedTexts,
    frameThumbnails,
  ]);

  const handleSaveProjectExplicit = useCallback(() => {
    try {
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
      localStorage.setItem(ACTIVE_PROJECT_ID_KEY, activeProjectId);
    } catch {
      // ignore
    }
  }, [projects, activeProjectId]);

  const pushHistory = useCallback(() => {
    setHistory((prev) => [
      ...prev.slice(-18),
      {
        segments,
        templateId: activeTemplate.id,
        styleOverrides,
        adjustments,
        overlays,
        detectedTexts,
        videoClips,
        audioClips,
        isAudioLinked,
      },
    ]);
    setRedoStack([]);
  }, [
    segments,
    activeTemplate.id,
    styleOverrides,
    adjustments,
    overlays,
    detectedTexts,
    videoClips,
    audioClips,
    isAudioLinked,
  ]);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setRedoStack((r) => [
      ...r,
      {
        segments,
        templateId: activeTemplate.id,
        styleOverrides,
        adjustments,
        overlays,
        detectedTexts,
        videoClips,
        audioClips,
        isAudioLinked,
      },
    ]);
    setHistory((h) => h.slice(0, -1));
    setSegments(last.segments);
    setActiveTemplate(findTemplate(last.templateId));
    setStyleOverrides(last.styleOverrides);
    setAdjustments(last.adjustments);
    setOverlays(last.overlays);
    setDetectedTexts(last.detectedTexts);
    if (last.videoClips) setVideoClips(last.videoClips);
    if (last.audioClips) setAudioClips(last.audioClips);
    if (last.isAudioLinked !== undefined) setIsAudioLinked(last.isAudioLinked);
    if (last.videoClips && last.audioClips) {
      setDuration(
        computeEditedTimelineDuration(
          last.videoClips,
          last.audioClips,
          sourceMediaDuration
        )
      );
    }
  }, [
    history,
    segments,
    activeTemplate.id,
    styleOverrides,
    adjustments,
    overlays,
    detectedTexts,
    videoClips,
    audioClips,
    isAudioLinked,
    sourceMediaDuration,
  ]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setHistory((h) => [
      ...h,
      {
        segments,
        templateId: activeTemplate.id,
        styleOverrides,
        adjustments,
        overlays,
        detectedTexts,
        videoClips,
        audioClips,
        isAudioLinked,
      },
    ]);
    setRedoStack((r) => r.slice(0, -1));
    setSegments(next.segments);
    setActiveTemplate(findTemplate(next.templateId));
    setStyleOverrides(next.styleOverrides);
    setAdjustments(next.adjustments);
    setOverlays(next.overlays);
    setDetectedTexts(next.detectedTexts);
    if (next.videoClips) setVideoClips(next.videoClips);
    if (next.audioClips) setAudioClips(next.audioClips);
    if (next.isAudioLinked !== undefined) setIsAudioLinked(next.isAudioLinked);
    if (next.videoClips && next.audioClips) {
      setDuration(
        computeEditedTimelineDuration(
          next.videoClips,
          next.audioClips,
          sourceMediaDuration
        )
      );
    }
  }, [
    redoStack,
    segments,
    activeTemplate.id,
    styleOverrides,
    adjustments,
    overlays,
    detectedTexts,
    videoClips,
    audioClips,
    isAudioLinked,
    sourceMediaDuration,
  ]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleUndo, handleRedo]);

  // Switch between saved projects
  const handleSelectProject = useCallback(
    (projectId: string) => {
      const target = projects.find((p) => p.id === projectId);
      if (!target) return;
      setIsPlaying(false);
      setActiveProjectId(target.id);
      setProjectName(target.name);
      setAspectRatio(target.aspectRatio || '9:16');
      const tpl = findTemplate(target.templateId);
      setActiveTemplate(tpl);
      const rawOverrides = target.styleOverrides || createInitialOverrides(tpl);
      setStyleOverrides({
        ...createInitialOverrides(tpl),
        ...rawOverrides,
        fontScale: Number.isFinite(rawOverrides?.fontScale) && rawOverrides.fontScale > 0 ? rawOverrides.fontScale : 1,
        behindHeroScale: Number.isFinite(rawOverrides?.behindHeroScale) && rawOverrides.behindHeroScale > 0 ? rawOverrides.behindHeroScale : 1,
        yOffset: Number.isFinite(rawOverrides?.yOffset) ? rawOverrides.yOffset : 76,
        xOffset: Number.isFinite(rawOverrides?.xOffset) ? rawOverrides.xOffset : 50,
      });
      setAdjustments(target.adjustments || DEFAULT_ADJUSTMENTS);
      setSegments(target.segments || HYDRATED_INITIAL_SEGMENTS);
      setOverlays(target.overlays || []);
      setDetectedTexts(target.detectedTexts || []);
      setFrameThumbnails(target.frameThumbnails || []);
      const targetDur = target.duration || 7.07;
      setSourceMediaDuration(targetDur);
      const nextV =
        target.videoClips && target.videoClips.length > 0
          ? target.videoClips
          : createInitialVideoClips(targetDur, target.name);
      const nextA =
        target.audioClips && target.audioClips.length > 0
          ? target.audioClips
          : createInitialAudioClips(nextV, `${target.name} Audio`);
      setVideoClips(nextV);
      setAudioClips(nextA);
      setIsAudioLinked(target.isAudioLinked ?? true);
      setSelectedClipId(nextV[0]?.id || null);
      setSelectedTrackType('video');
      setDuration(computeEditedTimelineDuration(nextV, nextA, targetDur));
      setCurrentTime(0.2);
      setSelectedDetectedTextId(target.detectedTexts?.[0]?.id || null);

      const libMatch = MEDIA_LIBRARY_ASSETS.find(
        (m) => m.videoUrl === target.videoUrl
      );
      if (libMatch && !target.isCustomUpload) {
        setActiveMediaAsset(libMatch);
      } else {
        setActiveMediaAsset({
          id: target.id,
          title: target.name,
          category: 'takes',
          durationMs: Math.round((target.duration || 6) * 1000),
          resolution: '1080p',
          aspect: target.aspectRatio === '16:9' ? '16:9' : '9:16',
          videoUrl: target.videoUrl,
          posterUrl: target.posterUrl || '/assets/terrace_poster.webp',
          accentColor: '#f5a524',
          speakerName: target.isCustomUpload ? 'Uploaded Video' : 'Studio Take',
          languageLabel: 'Hinglish + OCR',
          words: MEDIA_LIBRARY_ASSETS[0].words,
        });
      }
    },
    [projects]
  );

  // Delete a project
  const handleDeleteProject = useCallback(
    (projectId: string) => {
      if (projects.length <= 1) return;
      deleteVideoBlobFromIdb(projectId).catch(() => {});
      const remaining = projects.filter((p) => p.id !== projectId);
      setProjects(remaining);
      if (projectId === activeProjectId && remaining[0]) {
        handleSelectProject(remaining[0].id);
      }
    },
    [projects, activeProjectId, handleSelectProject]
  );

  // Run Real Automatic OCR Text Detection on a Video URL
  const handleRunOcrScanOnVideo = useCallback(
    async (videoUrlToScan?: string, knownDuration?: number) => {
      const targetUrl = videoUrlToScan || activeMediaAsset.videoUrl;
      if (!targetUrl) return;
      setIsPlaying(false);
      setOcrError(null);
      setOcrProgress({
        phase: 'initializing',
        percent: 5,
        currentFrame: 0,
        totalFrames: 6,
        statusMessage: 'Initializing video frames for OCR text detection...',
        detectedSoFar: 0,
      });

      try {
        const items = await runAutomaticVideoOcr(
          targetUrl,
          knownDuration || duration,
          (prog) => {
            setOcrProgress(prog);
          }
        );

        setDetectedTexts(items);
        if (items.length > 0) {
          setSelectedDetectedTextId(items[0].id);
          setCurrentTime(Number((items[0].startTime + 0.1).toFixed(2)));
          const ocrSegments = convertDetectedTextsToCaptionSegments(items);
          if (ocrSegments.length > 0) {
            setSegments(ocrSegments);
          }
        }
        setOcrProgress(null);
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Automatic OCR text detection encountered an error.';
        setOcrError(msg);
        setOcrProgress({
          phase: 'error',
          percent: 0,
          currentFrame: 0,
          totalFrames: 0,
          statusMessage: msg,
          detectedSoFar: 0,
        });
      }
    },
    [activeMediaAsset.videoUrl, duration]
  );

  // Create a brand new separate editing project from an uploaded File
  const handleCreateProjectFromFile = useCallback(
    async (file: File, customProjectName?: string, autoRunOcr = true) => {
      setIsPlaying(false);
      const newProjId = `proj-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 6)}`;
      const cleanName =
        customProjectName?.trim() ||
        file.name.replace(/\.[^/.]+$/, '') ||
        'Uploaded Video Project';

      const objectUrl = URL.createObjectURL(file);
      hydratedBlobUrlsRef.current.add(newProjId);
      await saveVideoBlobToIdb(newProjId, file);

      const meta = await extractVideoMetadataAndFilmstrip(objectUrl);
      const defaultTpl = findTemplate('captik_glow');
      const initialOverrides: CustomStyleOverrides = {
        ...createInitialOverrides(defaultTpl),
        behindSubject: false,
        yOffset: 84,
        xOffset: 50,
      };

      const newProj = createNewProjectRecord({
        id: newProjId,
        name: cleanName,
        videoUrl: objectUrl,
        posterUrl: meta.posterDataUrl,
        fileName: file.name,
        isCustomUpload: true,
        duration: meta.duration,
        aspectRatio: meta.aspectRatio,
        templateId: defaultTpl.id,
        styleOverrides: initialOverrides,
        adjustments: DEFAULT_ADJUSTMENTS,
        segments: [
          {
            id: `seg-upload-${Date.now()}`,
            start: 0.1,
            end: Math.min(meta.duration, 2.8),
            behindSubject: false,
            words: cleanName
              .split(/\s+/)
              .slice(0, 4)
              .map((word, idx) => ({
                id: `w-up-${idx}`,
                text: word,
                hiDeva: word,
                ta: word,
                bn: word,
                en: word,
                start: Number((0.1 + idx * 0.5).toFixed(2)),
                end: Number((0.6 + idx * 0.5).toFixed(2)),
                emphasis: idx === 0 ? 'amber' : 'none',
              })),
          },
        ],
        overlays: [],
        detectedTexts: [],
        ocrStatus: autoRunOcr ? 'scanning' : 'idle',
        frameThumbnails: meta.filmstripDataUrls,
      });

      const customAsset: MediaAssetItem = {
        id: newProjId,
        title: cleanName,
        category: 'takes',
        durationMs: Math.round(meta.duration * 1000),
        resolution: meta.width >= 2160 || meta.height >= 2160 ? '4K' : '1080p',
        aspect: meta.aspectRatio === '16:9' ? '16:9' : '9:16',
        videoUrl: objectUrl,
        posterUrl: meta.posterDataUrl,
        accentColor: '#f5a524',
        speakerName: 'Uploaded Video',
        languageLabel: 'Auto OCR',
        words: MEDIA_LIBRARY_ASSETS[0].words,
      };

      setProjects((prev) => [newProj, ...prev]);
      setActiveProjectId(newProjId);
      setProjectName(cleanName);
      setAspectRatio(meta.aspectRatio);
      setActiveTemplate(defaultTpl);
      setStyleOverrides(initialOverrides);
      setSourceMediaDuration(meta.duration);
      setDuration(meta.duration);
      const initV = newProj.videoClips || createInitialVideoClips(meta.duration, cleanName);
      const initA =
        newProj.audioClips || createInitialAudioClips(initV, `${cleanName} Audio`);
      setVideoClips(initV);
      setAudioClips(initA);
      setIsAudioLinked(true);
      setSelectedClipId(initV[0]?.id || null);
      setSelectedTrackType('video');
      setCurrentTime(0.2);
      setActiveMediaAsset(customAsset);
      setSegments(newProj.segments);
      setOverlays([]);
      setDetectedTexts([]);
      setSelectedDetectedTextId(null);
      setFrameThumbnails(meta.filmstripDataUrls);
      setActiveView('editor');
      setLeftTab('text');

      if (autoRunOcr) {
        // Trigger OCR asynchronously so the modal closes immediately and the editor shows live progress
        void handleRunOcrScanOnVideo(objectUrl, meta.duration);
      }
    },
    [activeTemplate, handleRunOcrScanOnVideo]
  );

  // Generate a real custom video file with burned-in text and import it as a new project
  const handleGenerateAndImportSampleVideo = useCallback(
    async (
      customTitle: string,
      sceneTexts: [string, string, string],
      autoRunOcr: boolean
    ) => {
      const file = await generateCustomVideoWithEmbeddedText(
        customTitle,
        sceneTexts
      );
      await handleCreateProjectFromFile(file, customTitle, autoRunOcr);
    },
    [handleCreateProjectFromFile]
  );

  // Handlers for editing, replacing, masking, repositioning, and deleting OCR Detected Text
  const handleUpdateDetectedText = useCallback(
    (id: string, patch: Partial<DetectedVideoTextItem>) => {
      pushHistory();
      setDetectedTexts((prev) => updateDetectedTextItem(prev, id, patch));
    },
    [pushHistory]
  );

  const handleDeleteDetectedText = useCallback(
    (id: string) => {
      pushHistory();
      setDetectedTexts((prev) => prev.filter((item) => item.id !== id));
      if (selectedDetectedTextId === id) {
        setSelectedDetectedTextId(null);
      }
    },
    [pushHistory, selectedDetectedTextId]
  );

  const handleAddManualDetectedText = useCallback(() => {
    pushHistory();
    const start = Number(currentTime.toFixed(2));
    const end = Number(Math.min(duration, start + 2.0).toFixed(2));
    const newItem: DetectedVideoTextItem = {
      id: `ocr-manual-${Date.now()}`,
      text: 'NEW VIDEO TEXT',
      originalText: 'NEW VIDEO TEXT',
      startTime: start,
      endTime: Math.max(start + 0.6, end),
      x: 50,
      y: 24,
      originalX: 50,
      originalY: 24,
      width: 60,
      height: 11,
      confidence: 100,
      fontScale: 1,
      textColor: '#FFFDF8',
      bgColor: '#141418',
      maskOriginal: true,
      isRemoved: false,
      stylePreset: 'template',
    };
    setDetectedTexts((prev) => [...prev, newItem]);
    setSelectedDetectedTextId(newItem.id);
  }, [currentTime, duration, pushHistory]);

  const handleSyncOcrToCaptions = useCallback(() => {
    const converted = convertDetectedTextsToCaptionSegments(detectedTexts);
    if (converted.length > 0) {
      pushHistory();
      setSegments(converted);
      setLeftTab('captions');
    }
  }, [detectedTexts, pushHistory]);

  // Real Video Export Handler (Includes Edited Video/Audio Timeline & Human Segmentation)
  const handleRunRealVideoExport = useCallback(
    async (onProgress: (pct: number) => void): Promise<Blob> => {
      setIsPlaying(false);
      return await exportEditedVideoToBlob({
        videoUrl: activeMediaAsset.videoUrl || '/assets/terrace_reel.mp4',
        duration,
        aspectRatio,
        segments,
        activeScript,
        activeTemplate,
        styleOverrides,
        adjustments,
        detectedTexts,
        overlays,
        videoClips,
        audioClips,
        onProgress,
      });
    },
    [
      activeMediaAsset.videoUrl,
      duration,
      aspectRatio,
      segments,
      activeScript,
      activeTemplate,
      styleOverrides,
      adjustments,
      detectedTexts,
      overlays,
      videoClips,
      audioClips,
    ]
  );

  const { segment: activeSegment } = getActiveSegmentAndWord(
    segments,
    currentTime
  );
  const activeSegmentId = activeSegment?.id || segments[0]?.id || 'seg-1';

  const handleSelectTemplate = (tpl: CaptionTemplateSpec) => {
    pushHistory();
    setActiveTemplate(tpl);
    setStyleOverrides((prev) => ({
      ...prev,
      primaryColor: tpl.textColor,
      accentColor: tpl.emphasisColor,
      secondaryColor: tpl.secondaryColor || '#10B981',
      bgOpacity: tpl.boxBg ? 75 : 0,
      behindSubject: Boolean(tpl.behind),
      uppercase: Boolean(tpl.uppercase),
      strokeWidth: tpl.strokeWidth || 0,
    }));
  };

  const handleChangeLinesMode = (mode: 1 | 2) => {
    if (mode === linesMode) return;
    pushHistory();
    setLinesMode(mode);
    setSegments((prev) => rebuildSegmentsByLineMode(prev, mode));
  };

  const handleChangePauseMode = (mode: 'Off' | 'Natural' | 'Tight') => {
    pushHistory();
    setPauseMode(mode);
    const base = hydrateSegmentsFromWords(activeMediaAsset.words);
    if (mode === 'Off') {
      setSegments(rebuildSegmentsByLineMode(base, linesMode));
    } else {
      const { segments: tightened } = applyPauseRemovalMode(base, mode);
      setSegments(rebuildSegmentsByLineMode(tightened, linesMode));
    }
  };

  const handleCycleWordEmphasis = (segmentId: string, wordId: string) => {
    pushHistory();
    setSegments((prev) =>
      prev.map((seg) => {
        if (seg.id !== segmentId) return seg;
        return {
          ...seg,
          words: seg.words.map((w) =>
            w.id === wordId
              ? { ...w, emphasis: cycleWordEmphasis(w.emphasis) }
              : w
          ),
        };
      })
    );
  };

  const handleUpdateWordText = (
    segmentId: string,
    wordId: string,
    newText: string
  ) => {
    pushHistory();
    setSegments((prev) =>
      prev.map((seg) => {
        if (seg.id !== segmentId) return seg;
        return {
          ...seg,
          words: seg.words.map((w) =>
            w.id === wordId
              ? {
                  ...w,
                  text: newText,
                  hiDeva: newText,
                  ta: newText,
                  bn: newText,
                  en: newText,
                }
              : w
          ),
        };
      })
    );
  };

  const handleSplitSegment = (segmentId: string, wordIndex: number) => {
    pushHistory();
    setSegments((prev) => splitSegmentAtWord(prev, segmentId, wordIndex));
  };

  const handleToggleSegmentBehind = (segmentId: string) => {
    pushHistory();
    setSegments((prev) =>
      prev.map((seg) =>
        seg.id === segmentId
          ? { ...seg, behindSubject: !seg.behindSubject }
          : seg
      )
    );
  };

  const handleDeleteSegment = (segmentId: string) => {
    if (segments.length <= 1) return;
    pushHistory();
    setSegments((prev) => prev.filter((s) => s.id !== segmentId));
  };

  const handleAddCaptionSegment = () => {
    pushHistory();
    const lastSeg = segments[segments.length - 1];
    const start = lastSeg ? Number((lastSeg.end + 0.1).toFixed(2)) : 0;
    const end = Number((start + 1.2).toFixed(2));
    const newSeg: CaptionSegment = {
      id: `seg-custom-${Date.now()}`,
      start,
      end,
      behindSubject: true,
      words: [
        {
          id: `w-${Date.now()}-1`,
          text: 'Bilkul',
          hiDeva: 'बिल्कुल',
          ta: 'நிச்சயமாக',
          bn: 'একদম',
          en: 'Absolutely',
          start,
          end: Number((start + 0.55).toFixed(2)),
          emphasis: 'green',
        },
        {
          id: `w-${Date.now()}-2`,
          text: 'viral!',
          hiDeva: 'वायरल!',
          ta: 'வைரல்!',
          bn: 'ভাইরাল!',
          en: 'viral!',
          start: Number((start + 0.55).toFixed(2)),
          end,
          emphasis: 'amber',
        },
      ],
    };
    setSegments((prev) => [...prev, newSeg]);
    setCurrentTime(start + 0.05);
  };

  const handleDownloadSrt = () => {
    const srtContent = generateSrt(segments, activeScript);
    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.replace(/\s+/g, '_')}.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportSrtText = (srtText: string) => {
    const parsed = parseSrt(srtText);
    if (parsed.length > 0) {
      pushHistory();
      setSegments(parsed);
      setCurrentTime(parsed[0].start);
    }
  };

  const handleUploadCustomVideo = (file: File) => {
    handleCreateProjectFromFile(file, undefined, true);
  };

  const handleAddTextOverlay = (
    label: string,
    presetId = 'poster',
    color = '#F59E0B'
  ) => {
    pushHistory();
    const start = Number(currentTime.toFixed(2));
    const end = Number(Math.min(duration, start + 2.2).toFixed(2));
    setOverlays((prev) => [
      ...prev,
      {
        id: `ov-txt-${Date.now()}`,
        type: 'text',
        label,
        presetId,
        start,
        end: Math.max(start + 0.8, end),
        color,
        x: 50,
        y: 26,
      },
    ]);
  };

  const handleApplyTextAnimation = (
    type: 'in' | 'out' | 'loop' | 'combo',
    animName: string
  ) => {
    setStyleOverrides((prev) => ({
      ...prev,
      animIn: type === 'in' || type === 'combo' ? animName : prev.animIn,
      animOut: type === 'out' ? animName : prev.animOut,
      animLoop: type === 'loop' ? animName : prev.animLoop,
    }));
  };

  const handleAddGraphicElement = (el: (typeof GRAPHIC_ELEMENTS)[number]) => {
    pushHistory();
    const start = Number(currentTime.toFixed(2));
    const end = Number(Math.min(duration, start + 2.4).toFixed(2));
    setOverlays((prev) => [
      ...prev,
      {
        id: `ov-el-${Date.now()}`,
        type: 'element',
        label: el.badgeText,
        sublabel: el.name,
        start,
        end: Math.max(start + 0.8, end),
        color: el.accentColor,
        x: 50,
        y: 22,
      },
    ]);
  };

  const handleAddSfxToTimeline = (sfx: (typeof SFX_LIBRARY)[number]) => {
    pushHistory();
    const start = Number(currentTime.toFixed(2));
    setOverlays((prev) => [
      ...prev,
      {
        id: `ov-sfx-${Date.now()}`,
        type: 'sfx',
        label: sfx.label,
        start,
        end: Number(Math.min(duration, start + sfx.durationSec).toFixed(2)),
        color: '#10B981',
        sfxId: sfx.id,
      },
    ]);
  };

  const handleApplyAiLook = (lookId: string) => {
    const look = AI_EDIT_LOOKS.find((l) => l.id === lookId);
    if (!look) return;
    setActiveAiLookId(look.id);
    setStyleOverrides((prev) => ({
      ...prev,
      primaryColor: look.color,
      accentColor: look.accent,
      behindSubject: look.behindSubject,
      yOffset: look.positionYPct,
    }));
    playSfxSound(look.sfxPreset, 0.4);
  };

  const handleTriggerAiTool = (toolId: string, option?: string) => {
    playSfxSound('notification_ding', 0.35);
    setAiToolStatus((prev) => ({
      ...prev,
      [toolId]: option ? `${option} ✓` : 'Applied ✓',
    }));

    if (toolId === 'auto_sfx') {
      handleAddSfxToTimeline(SFX_LIBRARY[0]);
    } else if (toolId === 'remove_bg') {
      setStyleOverrides((prev) => ({
        ...prev,
        behindSubject: !prev.behindSubject,
      }));
    } else if (toolId === 'auto_adjust') {
      setAdjustments((prev) => ({
        ...prev,
        contrast: 16,
        saturation: 18,
        temperature: 12,
      }));
    } else if (toolId === 'translate') {
      setActiveScript((prev) =>
        prev === 'hinglish' ? 'devanagari' : 'hinglish'
      );
    }
  };

  // Exact Playhead Split Handler for Video Clips, Audio Clips, and Caption Segments
  const handleSplitAtPlayhead = useCallback(() => {
    pushHistory();
    const targetTrack =
      isAudioLinked
        ? 'both'
        : selectedTrackType === 'audio'
        ? 'audio'
        : 'video';

    const splitResult = splitVideoAndAudioClipsAtTime({
      videoClips,
      audioClips,
      splitTime: currentTime,
      isAudioLinked,
      targetTrack,
    });

    if (splitResult.didSplitVideo || splitResult.didSplitAudio) {
      setVideoClips(splitResult.videoClips);
      setAudioClips(splitResult.audioClips);
      if (splitResult.newSelectedClipId) {
        setSelectedClipId(splitResult.newSelectedClipId);
      }
    }

    // Also split active caption segment at playhead word boundary if applicable
    if (activeSegment && activeSegment.words.length >= 2) {
      let splitWordIdx = activeSegment.words.findIndex(
        (w) => w.start >= currentTime - 0.04
      );
      if (splitWordIdx <= 0 || splitWordIdx >= activeSegment.words.length) {
        splitWordIdx = Math.ceil(activeSegment.words.length / 2);
      }
      setSegments((prev) =>
        splitSegmentAtWord(prev, activeSegment.id, splitWordIdx)
      );
    }
  }, [
    pushHistory,
    isAudioLinked,
    selectedTrackType,
    videoClips,
    audioClips,
    currentTime,
    activeSegment,
  ]);

  const handleTrimVideoClip = useCallback(
    (clipId: string, edge: 'start' | 'end', newTimelineTime: number) => {
      pushHistory();
      const res = trimVideoClipBoundary({
        videoClips,
        audioClips,
        clipId,
        edge,
        newTimelineTime,
        maxSourceDuration: Math.max(duration, sourceMediaDuration, 7.2),
        isAudioLinked,
      });
      setVideoClips(res.videoClips);
      setAudioClips(res.audioClips);
      const nextDur = computeEditedTimelineDuration(
        res.videoClips,
        res.audioClips,
        sourceMediaDuration
      );
      setDuration(nextDur);
    },
    [
      pushHistory,
      videoClips,
      audioClips,
      duration,
      sourceMediaDuration,
      isAudioLinked,
    ]
  );

  const handleTrimAudioClip = useCallback(
    (clipId: string, edge: 'start' | 'end', newTimelineTime: number) => {
      pushHistory();
      const nextAudio = trimAudioClipBoundary({
        audioClips,
        clipId,
        edge,
        newTimelineTime,
        maxSourceDuration: Math.max(duration, sourceMediaDuration, 7.2),
      });
      setAudioClips(nextAudio);
      if (isAudioLinked) {
        const targetA = nextAudio.find((a) => a.id === clipId);
        if (targetA?.linkedVideoClipId) {
          const resV = trimVideoClipBoundary({
            videoClips,
            audioClips: nextAudio,
            clipId: targetA.linkedVideoClipId,
            edge,
            newTimelineTime,
            maxSourceDuration: Math.max(duration, sourceMediaDuration, 7.2),
            isAudioLinked: true,
          });
          setVideoClips(resV.videoClips);
          setAudioClips(resV.audioClips);
          setDuration(
            computeEditedTimelineDuration(
              resV.videoClips,
              resV.audioClips,
              sourceMediaDuration
            )
          );
          return;
        }
      }
      setDuration(
        computeEditedTimelineDuration(videoClips, nextAudio, sourceMediaDuration)
      );
    },
    [
      pushHistory,
      audioClips,
      videoClips,
      duration,
      sourceMediaDuration,
      isAudioLinked,
    ]
  );

  const handleMoveTimelineClip = useCallback(
    (
      clipId: string,
      trackType: 'video' | 'audio',
      directionOrDelta: 'left' | 'right' | number
    ) => {
      pushHistory();
      const res = moveOrRearrangeClip({
        videoClips,
        audioClips,
        clipId,
        trackType,
        directionOrDelta,
        isAudioLinked,
      });
      setVideoClips(res.videoClips);
      setAudioClips(res.audioClips);
      setDuration(
        computeEditedTimelineDuration(
          res.videoClips,
          res.audioClips,
          sourceMediaDuration
        )
      );
    },
    [pushHistory, videoClips, audioClips, isAudioLinked, sourceMediaDuration]
  );

  const handleDeleteTimelineClip = useCallback(
    (clipId: string, trackType: 'video' | 'audio') => {
      pushHistory();
      const res = deleteVideoOrAudioClip({
        videoClips,
        audioClips,
        clipId,
        trackType,
        isAudioLinked,
      });
      if (res.didDelete) {
        setVideoClips(res.videoClips);
        setAudioClips(res.audioClips);
        const nextDur = computeEditedTimelineDuration(
          res.videoClips,
          res.audioClips,
          sourceMediaDuration
        );
        setDuration(nextDur);
        setCurrentTime((t) => Math.min(t, Math.max(0.1, nextDur - 0.1)));
        setSelectedClipId(res.videoClips[0]?.id || res.audioClips[0]?.id || null);
      }
    },
    [pushHistory, videoClips, audioClips, isAudioLinked, sourceMediaDuration]
  );

  const handleToggleMuteAudioClip = useCallback(
    (clipId: string) => {
      pushHistory();
      setAudioClips((prev) =>
        prev.map((a) => (a.id === clipId ? { ...a, muted: !a.muted } : a))
      );
    },
    [pushHistory]
  );

  const handleDuplicateSelectedSegment = () => {
    if (!activeSegment) return;
    pushHistory();
    const copy: CaptionSegment = {
      ...activeSegment,
      id: `${activeSegment.id}-copy-${Date.now()}`,
      start: Number((activeSegment.end + 0.05).toFixed(2)),
      end: Number(
        (activeSegment.end + (activeSegment.end - activeSegment.start)).toFixed(
          2
        )
      ),
    };
    setSegments((prev) => [...prev, copy]);
  };

  const handleNudgeSelectedSegment = (deltaSec: number) => {
    if (!activeSegment || deltaSec === 0) return;
    pushHistory();
    setSegments((prev) =>
      prev.map((seg) => {
        if (seg.id !== activeSegment.id) return seg;
        return {
          ...seg,
          start: Number(Math.max(0, seg.start + deltaSec).toFixed(2)),
          end: Number(Math.max(0.2, seg.end + deltaSec).toFixed(2)),
          words: seg.words.map((w) => ({
            ...w,
            start: Number(Math.max(0, w.start + deltaSec).toFixed(2)),
            end: Number(Math.max(0.1, w.end + deltaSec).toFixed(2)),
          })),
        };
      })
    );
  };

  const totalWordCount = segments.reduce((acc, s) => acc + s.words.length, 0);
  const isOcrScanning = Boolean(
    ocrProgress &&
      ocrProgress.phase !== 'completed' &&
      ocrProgress.phase !== 'error'
  );

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#0b0b0c] text-[#f3efe7] flex flex-col font-sans antialiased">
      <TopBar
        projectName={projectName}
        onProjectNameChange={setProjectName}
        activeView={activeView}
        onChangeView={handleChangeView}
        canUndo={history.length > 0}
        canRedo={redoStack.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onDownloadSrt={handleDownloadSrt}
        onOpenHelp={() => setHelpModalOpen(true)}
        quality={quality}
        onQualityChange={setQuality}
        onOpenExportModal={() => setExportModalOpen(true)}
        activeTemplateName={activeTemplate.name}
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={(id) => {
          handleSelectProject(id);
          handleChangeView('editor');
        }}
        onOpenNewProjectModal={() => setNewProjectModalOpen(true)}
        onTriggerOcrScan={() => handleRunOcrScanOnVideo()}
        isOcrScanning={isOcrScanning}
        detectedTextCount={detectedTexts.length}
        onSaveProject={handleSaveProjectExplicit}
      />

      {activeView === 'editor' ? (
        <>
          <div className="flex-1 flex min-h-0 overflow-hidden">
            <LeftSidebarPanel
              activeTab={leftTab}
              onSelectTab={setLeftTab}
              segments={segments}
              activeSegmentId={activeSegmentId}
              currentTime={currentTime}
              linesMode={linesMode}
              onChangeLinesMode={handleChangeLinesMode}
              activeScript={activeScript}
              onChangeScript={setActiveScript}
              pauseMode={pauseMode}
              onChangePauseMode={handleChangePauseMode}
              onSeekTo={(sec) => setCurrentTime(sec)}
              onCycleWordEmphasis={handleCycleWordEmphasis}
              onUpdateWordText={handleUpdateWordText}
              onSplitSegment={handleSplitSegment}
              onToggleSegmentBehind={handleToggleSegmentBehind}
              onDeleteSegment={handleDeleteSegment}
              onAddCaptionSegment={handleAddCaptionSegment}
              onImportSrtText={handleImportSrtText}
              activeMediaAsset={activeMediaAsset}
              onSelectMediaAsset={(asset) => {
                const dur = Number((asset.durationMs / 1000).toFixed(2));
                setActiveMediaAsset(asset);
                setProjectName(asset.title);
                setSegments(hydrateSegmentsFromWords(asset.words));
                setSourceMediaDuration(dur);
                setDuration(dur);
                const nextV = createInitialVideoClips(dur, asset.title);
                const nextA = createInitialAudioClips(nextV, `${asset.title} Audio`);
                setVideoClips(nextV);
                setAudioClips(nextA);
                setSelectedClipId(nextV[0]?.id || null);
                setCurrentTime(0.4);
              }}
              onUploadCustomVideo={handleUploadCustomVideo}
              onAddTextOverlay={handleAddTextOverlay}
              onApplyTextAnimation={handleApplyTextAnimation}
              activeTextAnimations={{
                in: styleOverrides.animIn,
                out: styleOverrides.animOut,
                loop: styleOverrides.animLoop,
              }}
              onAddGraphicElement={handleAddGraphicElement}
              onAddSfxToTimeline={handleAddSfxToTimeline}
              adjustments={adjustments}
              onChangeAdjustments={setAdjustments}
              activeAiLookId={activeAiLookId}
              onApplyAiLook={handleApplyAiLook}
              onTriggerAiTool={handleTriggerAiTool}
              aiToolStatus={aiToolStatus}
              canUndo={history.length > 0}
              canRedo={redoStack.length > 0}
              onUndo={handleUndo}
              onRedo={handleRedo}
              projects={projects}
              activeProjectId={activeProjectId}
              onSelectProject={handleSelectProject}
              onDeleteProject={handleDeleteProject}
              onOpenNewProjectModal={() => setNewProjectModalOpen(true)}
              detectedTexts={detectedTexts}
              selectedDetectedTextId={selectedDetectedTextId}
              onSelectDetectedText={(id) => {
                setSelectedDetectedTextId(id);
                if (id) setLeftTab('text');
              }}
              onUpdateDetectedText={handleUpdateDetectedText}
              onDeleteDetectedText={handleDeleteDetectedText}
              onAddManualDetectedText={handleAddManualDetectedText}
              onSyncOcrToCaptions={handleSyncOcrToCaptions}
              onTriggerOcrScan={() => handleRunOcrScanOnVideo()}
              ocrProgress={ocrProgress}
              ocrError={ocrError}
              activeTemplate={activeTemplate}
              onSelectTemplate={handleSelectTemplate}
            />

            <PlayerStage
              mediaAsset={activeMediaAsset}
              isPlaying={isPlaying}
              onTogglePlay={() => setIsPlaying((p) => !p)}
              currentTime={currentTime}
              duration={duration}
              onTimeUpdate={(sec) => setCurrentTime(sec)}
              onDurationLoaded={(dur) => {
                setSourceMediaDuration(dur);
                if (videoClips.length <= 1) {
                  setDuration(dur);
                }
              }}
              segments={segments}
              activeScript={activeScript}
              activeTemplate={activeTemplate}
              styleOverrides={styleOverrides}
              onChangeStyleOverrides={setStyleOverrides}
              adjustments={adjustments}
              overlays={overlays}
              videoClips={videoClips}
              audioClips={audioClips}
              aspectRatio={aspectRatio}
              onChangeAspectRatio={setAspectRatio}
              qualityBadge={quality}
              activeTextAnimations={{
                in: styleOverrides.animIn,
                out: styleOverrides.animOut,
                loop: styleOverrides.animLoop,
              }}
              detectedTexts={detectedTexts}
              selectedDetectedTextId={selectedDetectedTextId}
              onSelectDetectedText={(id) => {
                setSelectedDetectedTextId(id);
                if (id) setLeftTab('text');
              }}
              onUpdateDetectedText={handleUpdateDetectedText}
              onDeleteDetectedText={handleDeleteDetectedText}
              onTriggerOcrScan={() => handleRunOcrScanOnVideo()}
              ocrProgress={ocrProgress}
              onOpenNewProjectModal={() => setNewProjectModalOpen(true)}
              playbackRate={playbackRate}
            />

            <RightInspectorPanel
              activeTab={rightTab}
              onSelectTab={setRightTab}
              activeTemplate={activeTemplate}
              onSelectTemplate={handleSelectTemplate}
              savedPresets={savedPresets}
              onSaveCurrentAsPreset={() => {
                setSavedPresets((prev) =>
                  prev.some((p) => p.id === activeTemplate.id)
                    ? prev
                    : [activeTemplate, ...prev]
                );
              }}
              styleOverrides={styleOverrides}
              onChangeStyleOverrides={setStyleOverrides}
              onResetStyleOverrides={() =>
                setStyleOverrides(createInitialOverrides(activeTemplate))
              }
              projectName={projectName}
              aspectRatio={aspectRatio}
              duration={duration}
              segmentCount={segments.length}
              wordCount={totalWordCount}
            />
          </div>

          <BottomTimeline
            currentTime={currentTime}
            duration={duration}
            onSeekTo={(sec) => setCurrentTime(sec)}
            segments={segments}
            activeSegmentId={activeSegmentId}
            activeScript={activeScript}
            timelineCaptionMode={timelineCaptionMode}
            onChangeTimelineCaptionMode={setTimelineCaptionMode}
            overlays={overlays}
            onDeleteOverlay={(id) =>
              setOverlays((prev) => prev.filter((o) => o.id !== id))
            }
            detectedTexts={detectedTexts}
            selectedDetectedTextId={selectedDetectedTextId}
            onSelectDetectedText={(id) => {
              setSelectedDetectedTextId(id);
              if (id) setLeftTab('text');
            }}
            mediaAsset={activeMediaAsset}
            frameThumbnails={frameThumbnails}
            canUndo={history.length > 0}
            canRedo={redoStack.length > 0}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onSplitAtPlayhead={handleSplitAtPlayhead}
            onDeleteSelectedSegment={() => handleDeleteSegment(activeSegmentId)}
            onDuplicateSelectedSegment={handleDuplicateSelectedSegment}
            onNudgeSelectedSegment={handleNudgeSelectedSegment}
            playbackRate={playbackRate}
            onCyclePlaybackRate={() =>
              setPlaybackRate((r) =>
                r === 1 ? 1.25 : r === 1.25 ? 1.5 : r === 1.5 ? 2 : 1
              )
            }
            timelineZoom={timelineZoom}
            onChangeTimelineZoom={setTimelineZoom}
            videoClips={videoClips}
            audioClips={audioClips}
            selectedClipId={selectedClipId}
            selectedTrackType={selectedTrackType}
            onSelectTimelineClip={(clipId, trackType) => {
              setSelectedClipId(clipId);
              setSelectedTrackType(trackType);
            }}
            isAudioLinked={isAudioLinked}
            onToggleAudioLinked={() => setIsAudioLinked((l) => !l)}
            onTrimVideoClip={handleTrimVideoClip}
            onTrimAudioClip={handleTrimAudioClip}
            onMoveTimelineClip={handleMoveTimelineClip}
            onDeleteTimelineClip={handleDeleteTimelineClip}
            onToggleMuteAudioClip={handleToggleMuteAudioClip}
          />

          {/* Mobile Responsive Workspace Drawer & Tab Bar (<768px) matching captik_phone.webp */}
          <div className="md:hidden shrink-0 bg-[#111114] border-t border-white/[0.08]">
            {mobileDrawerTab !== 'none' && (
              <div className="max-h-60 overflow-y-auto p-3 border-b border-white/[0.07] bg-[#151519]">
                {mobileDrawerTab === 'ocr' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-white">
                        Detected Video Text ({detectedTexts.length})
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleRunOcrScanOnVideo()}
                          className="px-2.5 py-1 rounded-md bg-[#f5a524] text-black text-[10px] font-extrabold"
                        >
                          Scan Video OCR
                        </button>
                        <button
                          type="button"
                          onClick={handleAddManualDetectedText}
                          className="px-2 py-1 rounded-md bg-white/[0.08] text-zinc-200 text-[10px] font-bold"
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                    {detectedTexts.map((dt, idx) => (
                      <div
                        key={dt.id}
                        className="flex items-center gap-2 p-2 rounded-lg bg-[#1c1c22] border border-white/[0.08]"
                      >
                        <input
                          type="text"
                          value={dt.text}
                          onChange={(e) =>
                            handleUpdateDetectedText(dt.id, {
                              text: e.target.value,
                            })
                          }
                          aria-label={`Mobile OCR text ${idx + 1}`}
                          className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => setCurrentTime(dt.startTime + 0.05)}
                          className="px-2 py-1 rounded bg-white/[0.06] text-[10px] font-mono text-amber-300"
                        >
                          {dt.startTime.toFixed(1)}s
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDetectedText(dt.id)}
                          className="p-1 text-zinc-400 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {mobileDrawerTab === 'captions' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-white">
                        Caption Segments ({segments.length})
                      </span>
                      <button
                        type="button"
                        onClick={handleAddCaptionSegment}
                        className="px-2.5 py-1 rounded-md bg-[#f5a524] text-black text-[10px] font-extrabold"
                      >
                        + Add Line
                      </button>
                    </div>
                    {segments.map((seg) => (
                      <div
                        key={seg.id}
                        onClick={() => setCurrentTime(seg.start + 0.05)}
                        className="p-2 rounded-lg bg-[#1c1c22] border border-white/[0.08] flex flex-wrap gap-1.5"
                      >
                        {seg.words.map((w) => (
                          <span
                            key={w.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCycleWordEmphasis(seg.id, w.id);
                            }}
                            className="px-2 py-0.5 rounded bg-[#25252d] text-xs font-bold text-white"
                          >
                            {w.text}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {mobileDrawerTab === 'templates' && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-white">
                        Captik Styles & Templates (106)
                      </span>
                      <span className="text-[10px] font-mono text-[#f5a524]">
                        Active: {activeTemplate.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
                      {TEMPLATE_TABS.map((cat) => (
                        <button
                          key={cat.key}
                          type="button"
                          onClick={() => setMobileStyleCat(cat.key)}
                          className={`px-2 py-1 rounded-md text-[10px] font-bold shrink-0 ${
                            mobileStyleCat === cat.key
                              ? 'bg-[#f5a524] text-black'
                              : 'bg-[#1c1c22] text-zinc-300 border border-white/[0.08]'
                          }`}
                        >
                          {cat.label} ({cat.ids.length})
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {filterTemplates(TEMPLATES, mobileStyleCat, '').map(
                        (tpl) => (
                          <button
                            key={tpl.id}
                            type="button"
                            onClick={() => handleSelectTemplate(tpl)}
                            className={`relative aspect-[9/12] rounded-xl overflow-hidden border text-left p-2 flex flex-col justify-between transition ${
                              activeTemplate.id === tpl.id
                                ? 'border-[#f5a524] ring-2 ring-[#f5a524]/40 text-white'
                                : 'bg-[#1c1c22] border-white/[0.08] text-zinc-300'
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
                            <div className="relative z-20 my-auto py-1 px-1 rounded bg-black/35 w-full flex items-center justify-center overflow-hidden pointer-events-none scale-90">
                              <CaptikCardPreview template={tpl} />
                            </div>
                            <div className="relative z-20 pt-1 border-t border-white/10">
                              <div className="text-[11px] font-bold text-white truncate">
                                {tpl.name}
                              </div>
                              <div className="text-[9px] text-zinc-300 uppercase truncate">
                                {tpl.category}
                              </div>
                            </div>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}

                {mobileDrawerTab === 'projects' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-white">
                        Your Projects ({projects.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => setNewProjectModalOpen(true)}
                        className="px-2.5 py-1 rounded-md bg-[#f5a524] text-black text-[10px] font-extrabold flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> New Project
                      </button>
                    </div>
                    {projects.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectProject(p.id)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg border text-left ${
                          p.id === activeProjectId
                            ? 'bg-[#f5a524]/15 border-[#f5a524] text-white'
                            : 'bg-[#1c1c22] border-white/[0.08] text-zinc-300'
                        }`}
                      >
                        <span className="text-xs font-bold truncate">
                          {p.name}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400">
                          {p.detectedTexts.length} OCR
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="h-11 px-2 flex items-center justify-around">
              {[
                { id: 'none', label: 'Preview', icon: Play },
                { id: 'ocr', label: 'OCR Text', icon: ScanText },
                { id: 'captions', label: 'Captions', icon: Captions },
                { id: 'templates', label: 'Style (106)', icon: Sparkles },
                { id: 'projects', label: 'Projects', icon: FolderOpen },
              ].map((item) => {
                const Icon = item.icon;
                const active = mobileDrawerTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      setMobileDrawerTab(
                        item.id as
                          | 'none'
                          | 'ocr'
                          | 'captions'
                          | 'templates'
                          | 'projects'
                      )
                    }
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition ${
                      active
                        ? 'bg-[#f5a524] text-black font-bold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <WorkspaceAndLandingView
          activeView={activeView}
          onChangeView={handleChangeView}
          activeTemplate={activeTemplate}
          onSelectTemplateAndOpenEditor={(tpl) => {
            handleSelectTemplate(tpl);
            handleChangeView('editor');
          }}
          onSelectMediaAndOpenEditor={(asset) => {
            setActiveMediaAsset(asset);
            setProjectName(asset.title);
            setSegments(hydrateSegmentsFromWords(asset.words));
            setDuration(Number((asset.durationMs / 1000).toFixed(2)));
            setCurrentTime(0.4);
            handleChangeView('editor');
          }}
          projects={projects}
          activeProjectId={activeProjectId}
          onSelectProjectAndOpenEditor={(projId) => {
            handleSelectProject(projId);
            handleChangeView('editor');
          }}
          onDeleteProject={handleDeleteProject}
          onCreateProjectFromFile={handleCreateProjectFromFile}
          onGenerateAndImportSampleVideo={handleGenerateAndImportSampleVideo}
          onOpenNewProjectModal={() => setNewProjectModalOpen(true)}
        />
      )}

      <StudioModals
        exportModalOpen={exportModalOpen}
        onCloseExportModal={() => setExportModalOpen(false)}
        helpModalOpen={helpModalOpen}
        onCloseHelpModal={() => setHelpModalOpen(false)}
        newProjectModalOpen={newProjectModalOpen}
        onCloseNewProjectModal={() => setNewProjectModalOpen(false)}
        onCreateProjectFromFile={handleCreateProjectFromFile}
        onGenerateAndImportSampleVideo={handleGenerateAndImportSampleVideo}
        onRunRealVideoExport={handleRunRealVideoExport}
        projectName={projectName}
        quality={quality}
        aspectRatio={aspectRatio}
        templateName={activeTemplate.name}
        detectedTextCount={detectedTexts.length}
        onDownloadSrt={handleDownloadSrt}
      />
    </div>
  );
}
