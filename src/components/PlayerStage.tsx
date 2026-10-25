import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  Maximize2,
  Grid,
  ZoomIn,
  ZoomOut,
  Volume2,
  VolumeX,
  Smartphone,
  PersonStanding,
  ScanText,
  Trash2,
  EyeOff,
  Eye,
  Pencil,
  Check,
  Upload,
} from 'lucide-react';
import { LUT_FILTERS, type MediaAssetItem } from '../data/assetsCatalog';
import type { CaptionTemplateSpec } from '../data/templatesCatalog';
import {
  formatTimecode,
  getActiveSegmentAndWord,
  getWordTextForScript,
  buildVideoFilterCss,
  mapTimelineTimeToSourceVideo,
  mapTimelineTimeToSourceAudio,
  type CaptionSegment,
  type ColorAdjustments,
  type CustomStyleOverrides,
  type TimelineOverlayItem,
  type VideoTimelineClip,
  type AudioTimelineClip,
  type WordToken,
} from '../utils/editorLogic';
import {
  getVisibleDetectedTextsAtTime,
  type DetectedVideoTextItem,
} from '../utils/projectAndOcrLogic';
import type { OcrScanProgress } from '../utils/videoOcrEngine';
import {
  HumanSegmentationTracker,
  type HumanSegmentationResult,
} from '../utils/humanSegmentationEngine';
import {
  CaptikCanvasCaptionOverlay,
  CaptikBoldTextOverlayRenderer,
} from './CaptikTemplateRenderer';

export type AspectRatioPreset = '9:16' | '16:9' | '1:1' | '4:5';

interface PlayerStageProps {
  mediaAsset: MediaAssetItem;
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentTime: number;
  duration: number;
  onTimeUpdate: (seconds: number) => void;
  onDurationLoaded: (seconds: number) => void;
  segments: CaptionSegment[];
  activeScript: string;
  activeTemplate: CaptionTemplateSpec;
  styleOverrides: CustomStyleOverrides;
  onChangeStyleOverrides: (next: CustomStyleOverrides) => void;
  adjustments: ColorAdjustments;
  overlays: TimelineOverlayItem[];
  videoClips?: VideoTimelineClip[];
  audioClips?: AudioTimelineClip[];
  aspectRatio: AspectRatioPreset;
  onChangeAspectRatio: (ratio: AspectRatioPreset) => void;
  qualityBadge: string;
  activeTextAnimations: { in: string; out: string; loop: string };
  detectedTexts: DetectedVideoTextItem[];
  selectedDetectedTextId: string | null;
  onSelectDetectedText: (id: string | null) => void;
  onUpdateDetectedText: (id: string, patch: Partial<DetectedVideoTextItem>) => void;
  onDeleteDetectedText: (id: string) => void;
  onTriggerOcrScan: () => void;
  ocrProgress: OcrScanProgress | null;
  onOpenNewProjectModal: () => void;
  playbackRate?: number;
}

export const PlayerStage: React.FC<PlayerStageProps> = ({
  mediaAsset,
  isPlaying,
  onTogglePlay,
  currentTime,
  duration,
  onTimeUpdate,
  onDurationLoaded,
  segments,
  activeScript,
  activeTemplate,
  styleOverrides,
  onChangeStyleOverrides,
  adjustments,
  overlays,
  videoClips = [],
  audioClips = [],
  aspectRatio,
  onChangeAspectRatio,
  qualityBadge,
  detectedTexts,
  selectedDetectedTextId,
  onSelectDetectedText,
  onUpdateDetectedText,
  onDeleteDetectedText,
  onTriggerOcrScan,
  ocrProgress,
  onOpenNewProjectModal,
  playbackRate = 1,
}) => {
  const bgVideoRef = useRef<HTMLVideoElement | null>(null);
  const fgSegmentationCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const segmentationTrackerRef = useRef<HumanSegmentationTracker | null>(null);
  const stageContainerRef = useRef<HTMLDivElement | null>(null);
  const currentTimeRef = useRef<number>(currentTime);
  currentTimeRef.current = currentTime;

  if (!segmentationTrackerRef.current) {
    segmentationTrackerRef.current = new HumanSegmentationTracker();
  }

  const [zoomPercent, setZoomPercent] = useState<number>(100);
  const [showSafeGrid, setShowSafeGrid] = useState<boolean>(false);
  const [showOcrBoxes, setShowOcrBoxes] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isDraggingCaption, setIsDraggingCaption] = useState<boolean>(false);
  const [draggingOcrId, setDraggingOcrId] = useState<string | null>(null);
  const [editingOcrId, setEditingOcrId] = useState<string | null>(null);
  const [editingOcrDraft, setEditingOcrDraft] = useState<string>('');
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  const [humanSegStatus, setHumanSegStatus] = useState<HumanSegmentationResult>({
    hasHumanSubject: true,
    confidence: 88,
    headXPercent: 50,
    headYPercent: 34,
    shoulderYPercent: 52,
    shoulderWidthPercent: 34,
  });

  const effectiveVideoUrl = mediaAsset.videoUrl || '/assets/terrace_reel.mp4';

  const { segment, activeWordIndex } = getActiveSegmentAndWord(
    segments,
    currentTime
  );

  // Convert segment words to WordToken[] for CaptikCanvasCaptionOverlay
  const tokenWords: WordToken[] = segment
    ? segment.words.map((w) => ({
        id: w.id,
        word: getWordTextForScript(w, activeScript),
        start: w.start,
        end: w.end,
        emphasized: w.emphasis !== 'none',
      }))
    : [];

  // Determine whether Behind-Subject depth layering is requested by template or user toggle
  const isBehindActive =
    styleOverrides.behindSubject ||
    activeTemplate.behind ||
    Boolean(activeTemplate.lookSpec?.behindSubject) ||
    Boolean(activeTemplate.lookSpec?.wholeBehind) ||
    Boolean(segment?.behindSubject) ||
    activeTemplate.lookSpec?.family === 'spatial' ||
    activeTemplate.lookSpec?.family === 'story';

  const subjectOutlineSpec = activeTemplate.lookSpec?.subjectOutline;

  // Active LUT CSS
  const lutObj = LUT_FILTERS.find((l) => l.id === adjustments.lutId);
  const videoFilterCss = buildVideoFilterCss(adjustments, lutObj?.css || 'none');

  // Map edited timeline currentTime -> source video & source audio
  const mappedVideo = mapTimelineTimeToSourceVideo(videoClips, currentTime);
  const mappedAudio = mapTimelineTimeToSourceAudio(audioClips, currentTime);

  // Run Human-Only Segmentation on the current decoded video frame
  const updateHumanSegmentationCanvas = useCallback(
    (timeSec: number) => {
      const vid = bgVideoRef.current;
      const fgCanvas = fgSegmentationCanvasRef.current;
      const tracker = segmentationTrackerRef.current;
      if (!vid || !fgCanvas || !tracker || !isBehindActive) return;

      const targetW =
        aspectRatio === '16:9'
          ? 640
          : aspectRatio === '1:1'
          ? 480
          : 360;
      const targetH =
        aspectRatio === '16:9'
          ? 360
          : aspectRatio === '1:1'
          ? 480
          : aspectRatio === '4:5'
          ? 450
          : 640;

      if (fgCanvas.width !== targetW || fgCanvas.height !== targetH) {
        fgCanvas.width = targetW;
        fgCanvas.height = targetH;
      }

      const res = tracker.processVideoFrame(
        vid,
        fgCanvas,
        videoFilterCss,
        timeSec
      );
      setHumanSegStatus((prev) =>
        prev.hasHumanSubject !== res.hasHumanSubject ||
        Math.abs(prev.confidence - res.confidence) >= 4 ||
        Math.abs(prev.headXPercent - res.headXPercent) >= 2
          ? res
          : prev
      );
    },
    [isBehindActive, aspectRatio, videoFilterCss]
  );

  // Reset tracker when video source changes
  useEffect(() => {
    segmentationTrackerRef.current?.reset();
  }, [effectiveVideoUrl]);

  // Sync HTML5 video play/pause, playbackRate, and audio clip volume/mute state
  useEffect(() => {
    const vid = bgVideoRef.current;
    if (!vid) return;

    const clipSpeed = mappedVideo.clip?.speed || 1;
    vid.playbackRate = playbackRate * clipSpeed;

    const effectiveMuted =
      isMuted ||
      Boolean(mappedVideo.clip?.muted) ||
      (audioClips.length > 0 && mappedAudio.isMuted);
    vid.muted = effectiveMuted;
    if (!effectiveMuted && audioClips.length > 0) {
      vid.volume = Math.max(0, Math.min(1, mappedAudio.volume));
    }

    if (isPlaying && !mappedVideo.isGap) {
      vid.play().catch(() => {});
    } else {
      vid.pause();
    }
  }, [
    isPlaying,
    effectiveVideoUrl,
    playbackRate,
    isMuted,
    mappedVideo.clip?.speed,
    mappedVideo.clip?.muted,
    mappedVideo.isGap,
    mappedAudio.isMuted,
    mappedAudio.volume,
    audioClips.length,
  ]);

  // Sync timeline currentTime -> source media time on seek or clip boundary crossing
  useEffect(() => {
    const vid = bgVideoRef.current;
    if (!vid) return;
    const targetSourceTime = mappedVideo.sourceTime;
    if (Math.abs(vid.currentTime - targetSourceTime) > 0.14) {
      try {
        vid.currentTime = targetSourceTime;
      } catch {
        // ignore if metadata not ready
      }
    }
    updateHumanSegmentationCanvas(currentTime);
  }, [currentTime, mappedVideo.sourceTime, updateHumanSegmentationCanvas]);

  // Continuous requestAnimationFrame timeline & human segmentation loop while playing
  useEffect(() => {
    if (!isPlaying) return;
    let rafId = 0;
    let lastPerf = performance.now();

    const step = (now: number) => {
      const dt = Math.min(0.1, Math.max(0, (now - lastPerf) / 1000));
      lastPerf = now;

      const safeDur = Math.max(0.5, duration || 7.07);
      let nextTimelineTime = currentTimeRef.current + dt * playbackRate;

      // If in a gap between split/deleted clips, jump directly to nextClipStart
      const curMap = mapTimelineTimeToSourceVideo(videoClips, nextTimelineTime);
      if (curMap.isGap && curMap.nextClipStart !== null) {
        nextTimelineTime = curMap.nextClipStart;
      }

      if (nextTimelineTime >= safeDur) {
        nextTimelineTime = 0;
      }

      currentTimeRef.current = nextTimelineTime;
      onTimeUpdate(Number(nextTimelineTime.toFixed(2)));
      updateHumanSegmentationCanvas(nextTimelineTime);

      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, duration, playbackRate, videoClips, onTimeUpdate, updateHumanSegmentationCanvas]);

  // Active Timeline Overlays at currentTime
  const visibleOverlays = overlays.filter(
    (ov) => ov.type !== 'sfx' && currentTime >= ov.start && currentTime <= ov.end
  );

  // Active Detected OCR Texts at currentTime
  const visibleDetectedTexts = getVisibleDetectedTextsAtTime(
    detectedTexts,
    currentTime
  );

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!stageContainerRef.current) return;
    const rect = stageContainerRef.current.getBoundingClientRect();
    const relY = Math.max(8, Math.min(92, Math.round(((e.clientY - rect.top) / rect.height) * 100)));
    const relX = Math.max(10, Math.min(90, Math.round(((e.clientX - rect.left) / rect.width) * 100)));

    if (draggingOcrId) {
      onUpdateDetectedText(draggingOcrId, {
        x: relX,
        y: relY,
        maskOriginal: true,
      });
      return;
    }

    if (isDraggingCaption) {
      onChangeStyleOverrides({
        ...styleOverrides,
        yOffset: Math.max(15, Math.min(88, relY)),
        xOffset: Math.max(20, Math.min(80, relX)),
      });
    }
  };

  const handleCanvasPointerUp = () => {
    setIsDraggingCaption(false);
    setDraggingOcrId(null);
  };

  const getAspectDimensions = () => {
    switch (aspectRatio) {
      case '16:9':
        return 'aspect-video w-full max-w-[620px] max-h-[90%]';
      case '1:1':
        return 'aspect-square h-full max-h-[380px] max-w-[92%]';
      case '4:5':
        return 'aspect-[4/5] h-full max-h-[410px] max-w-[92%]';
      case '9:16':
      default:
        return 'aspect-[9/16] h-full max-h-[440px] max-w-[92%]';
    }
  };

  const handleFullscreen = () => {
    if (stageContainerRef.current?.requestFullscreen) {
      stageContainerRef.current.requestFullscreen().catch(() => {});
    }
  };

  const isScanning =
    ocrProgress &&
    ocrProgress.phase !== 'completed' &&
    ocrProgress.phase !== 'error';

  return (
    <main className="flex-1 bg-[#09090b] flex flex-col h-full min-w-[280px] select-none overflow-hidden relative">
      {/* Top Player Sub-Toolbar (Matches captik_desk.webp) */}
      <div className="h-10 px-4 border-b border-white/[0.07] flex items-center justify-between text-xs shrink-0 bg-[#0b0b0d]">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="font-semibold text-[#e4e4e7] text-[13px]">Player</span>

          <button
            type="button"
            onClick={onOpenNewProjectModal}
            className="px-2 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[11px] font-medium text-zinc-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
            title="Upload a new video or create a new project"
          >
            <Upload className="w-3 h-3 text-[#f5a524]" />
            <span className="hidden sm:inline">Upload Video</span>
          </button>

          <button
            type="button"
            data-testid="player-detect-text-btn"
            onClick={onTriggerOcrScan}
            disabled={Boolean(isScanning)}
            className="px-2 py-1 rounded-md bg-[#f5a524]/12 hover:bg-[#f5a524]/20 border border-[#f5a524]/35 text-[11px] font-semibold text-[#f5a524] flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
            title="Run real OCR text detection on video frames"
          >
            <ScanText className="w-3 h-3" />
            <span>
              {isScanning
                ? `Scanning ${ocrProgress?.percent || 0}%`
                : detectedTexts.length > 0
                ? `OCR Text (${detectedTexts.length})`
                : 'Detect Video Text'}
            </span>
          </button>
        </div>

        {/* Right Controls: Zoom - 100% +, Safe Grid, Aspect Frame, Behind-You Cutout */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5 text-zinc-400">
            <button
              type="button"
              onClick={() => setZoomPercent((z) => Math.max(70, z - 10))}
              aria-label="Zoom out player"
              className="p-1 hover:text-white cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1 text-[11px] font-mono tabular-nums text-zinc-300">
              {zoomPercent}%
            </span>
            <button
              type="button"
              onClick={() => setZoomPercent((z) => Math.min(130, z + 10))}
              aria-label="Zoom in player"
              className="p-1 hover:text-white cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowSafeGrid(!showSafeGrid)}
            title="Toggle Reels / Shorts safe zone guides"
            aria-label="Toggle safe zone grid"
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              showSafeGrid
                ? 'bg-[#f5a524]/20 text-[#f5a524]'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05]'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setShowOcrBoxes(!showOcrBoxes)}
            title="Toggle Detected OCR Text bounding boxes on video"
            aria-label="Toggle OCR boxes"
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              showOcrBoxes
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05]'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() =>
              onChangeStyleOverrides({
                ...styleOverrides,
                behindSubject: !styleOverrides.behindSubject,
              })
            }
            title="Toggle 'Behind you' AI human subject depth cutout"
            aria-label="Toggle Behind you cutout"
            className={`px-2 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
              isBehindActive
                ? humanSegStatus.hasHumanSubject
                  ? 'bg-[#f5a524]/20 text-[#f5a524] border border-[#f5a524]/40'
                  : 'bg-zinc-800 text-zinc-300 border border-white/10'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05]'
            }`}
          >
            <PersonStanding className="w-3.5 h-3.5" />
            {isBehindActive && (
              <span
                data-testid="human-segmentation-badge"
                className="hidden lg:inline text-[10px] font-mono font-semibold"
              >
                {humanSegStatus.hasHumanSubject
                  ? `Human Mask · ${humanSegStatus.confidence}%`
                  : 'No Human · Front'}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Live OCR Scanning Progress Banner (Non-blocking, top of canvas) */}
      {ocrProgress && ocrProgress.phase !== 'completed' && (
        <div
          data-testid="ocr-progress-banner"
          className="mx-4 mt-2 px-3 py-2 rounded-xl bg-[#14161e]/95 border border-[#f5a524]/40 flex items-center justify-between gap-3 z-40 shadow-lg shrink-0"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {ocrProgress.currentFramePreviewUrl && (
              <img
                src={ocrProgress.currentFramePreviewUrl}
                alt="Scanned frame"
                className="w-8 h-11 rounded object-cover border border-white/20 shrink-0"
              />
            )}
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#f5a524] truncate">
                {ocrProgress.statusMessage}
              </div>
              <div className="w-48 sm:w-64 h-1.5 rounded-full bg-zinc-800 overflow-hidden mt-1">
                <div
                  style={{ width: `${ocrProgress.percent}%` }}
                  className="h-full bg-[#f5a524] transition-all duration-200"
                />
              </div>
            </div>
          </div>
          <span className="font-mono text-xs font-bold text-white tabular-nums shrink-0">
            {ocrProgress.percent}%
          </span>
        </div>
      )}

      {/* Center Interactive Video Canvas Stage (Large, Unobstructed, Always Visible) */}
      <div
        className="flex-1 min-h-[240px] flex items-center justify-center p-3 md:p-5 relative overflow-hidden"
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
      >
        <div
          ref={stageContainerRef}
          data-testid="video-preview-stage"
          style={{ transform: `scale(${zoomPercent / 100})` }}
          className={`relative ${getAspectDimensions()} rounded-xl overflow-hidden bg-[#111216] shadow-[0_25px_70px_rgba(0,0,0,0.85)] border border-white/[0.12] transition-transform duration-150`}
        >
          {/* LAYER 1: BASE VIDEO BACKGROUND */}
          <video
            ref={bgVideoRef}
            data-testid="editor-video-element"
            src={effectiveVideoUrl}
            poster={mediaAsset.videoUrl ? undefined : mediaAsset.posterUrl}
            preload="auto"
            muted={isMuted}
            playsInline
            loop
            onLoadedData={() => {
              updateHumanSegmentationCanvas(currentTime);
            }}
            onSeeked={() => {
              updateHumanSegmentationCanvas(currentTime);
            }}
            onLoadedMetadata={(e) => {
              if (
                e.currentTarget.duration &&
                Number.isFinite(e.currentTarget.duration) &&
                e.currentTarget.duration > 0 &&
                videoClips.length <= 1
              ) {
                onDurationLoaded(Number(e.currentTarget.duration.toFixed(2)));
              }
              try {
                e.currentTarget.currentTime = mappedVideo.sourceTime;
              } catch {
                // ignore
              }
              updateHumanSegmentationCanvas(currentTime);
            }}
            style={{ filter: videoFilterCss }}
            className="absolute inset-0 w-full h-full object-cover z-0"
          />

          {/* Subtle Vignette */}
          {adjustments.vignette > 0 && (
            <div
              className="absolute inset-0 pointer-events-none z-10"
              style={{
                background: `radial-gradient(circle, transparent 45%, rgba(0,0,0,${
                  adjustments.vignette / 110
                }) 100%)`,
              }}
            />
          )}

          {/* LAYER 1.5: DETECTED VIDEO TEXT (OCR) COVER MASKS & INTERACTIVE REPLACEMENTS (z-28) */}
          {visibleDetectedTexts.map((ocrItem) => {
            const isSelected = selectedDetectedTextId === ocrItem.id;
            const isEditingThis = editingOcrId === ocrItem.id;

            return (
              <React.Fragment key={ocrItem.id}>
                {/* Original Burned-In Video Text Cover Mask (when edited, moved, or removed) */}
                {(ocrItem.maskOriginal || ocrItem.isRemoved) && (
                  <div
                    style={{
                      left: `${ocrItem.originalX ?? ocrItem.x ?? 50}%`,
                      top: `${ocrItem.originalY ?? ocrItem.y ?? 18}%`,
                      width: `${Math.min(92, (ocrItem.width ?? 64) + 4)}%`,
                      height: `${Math.min(36, (ocrItem.height ?? 10) + 2)}%`,
                      transform: 'translate(-50%, -50%)',
                      backgroundColor: ocrItem.bgColor || '#0e1017',
                    }}
                    className="absolute z-22 rounded-lg pointer-events-none shadow-inner"
                  />
                )}

                {/* Active Detected / Replacement Text Box */}
                {!ocrItem.isRemoved && (
                  <div
                    data-testid={`canvas-ocr-item-${ocrItem.id}`}
                    style={{
                      left: `${ocrItem.x ?? 50}%`,
                      top: `${ocrItem.y ?? 18}%`,
                      transform: `translate(-50%, -50%) scale(${ocrItem.fontScale || 1})`,
                    }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      onSelectDetectedText(ocrItem.id);
                      setDraggingOcrId(ocrItem.id);
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setEditingOcrId(ocrItem.id);
                      setEditingOcrDraft(ocrItem.text);
                    }}
                    className={`absolute z-35 cursor-move select-none transition-shadow ${
                      isSelected
                        ? 'ring-2 ring-[#f5a524] rounded-lg shadow-lg'
                        : showOcrBoxes
                        ? 'ring-1 ring-emerald-400/60 rounded-lg hover:ring-[#f5a524]'
                        : ''
                    }`}
                  >
                    {isEditingThis ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (editingOcrDraft.trim()) {
                            onUpdateDetectedText(ocrItem.id, {
                              text: editingOcrDraft.trim(),
                              maskOriginal: true,
                            });
                          }
                          setEditingOcrId(null);
                        }}
                        className="flex items-center gap-1 bg-black/90 p-1 rounded-lg border border-[#f5a524]"
                        onPointerDown={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          value={editingOcrDraft}
                          onChange={(e) => setEditingOcrDraft(e.target.value)}
                          autoFocus
                          aria-label="Edit detected video text"
                          className="bg-zinc-900 text-white text-xs font-bold px-2 py-1 rounded border border-white/20 focus:outline-none w-40"
                        />
                        <button
                          type="submit"
                          className="p-1 rounded bg-[#f5a524] text-black cursor-pointer"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </form>
                    ) : (
                      <div
                        style={{
                          fontFamily: activeTemplate.fontFamily,
                          backgroundColor:
                            ocrItem.maskOriginal || ocrItem.text !== ocrItem.originalText
                              ? 'rgba(12, 13, 18, 0.88)'
                              : 'rgba(0, 0, 0, 0.45)',
                          color: ocrItem.textColor || styleOverrides.accentColor || '#FFFFFF',
                          borderColor: isSelected
                            ? '#f5a524'
                            : 'rgba(16, 185, 129, 0.45)',
                        }}
                        className="px-3 py-1.5 rounded-lg border backdrop-blur-xs font-extrabold text-sm md:text-base tracking-wide uppercase text-center whitespace-nowrap shadow-md"
                      >
                        {ocrItem.text}
                      </div>
                    )}

                    {/* Floating Quick Action Toolbar when Selected */}
                    {isSelected && !isEditingThis && (
                      <div
                        onPointerDown={(e) => e.stopPropagation()}
                        className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#141418] border border-white/20 shadow-xl text-[10px] whitespace-nowrap z-50"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setEditingOcrId(ocrItem.id);
                            setEditingOcrDraft(ocrItem.text);
                          }}
                          className="px-1.5 py-0.5 rounded hover:bg-white/10 text-amber-300 flex items-center gap-0.5 cursor-pointer"
                          title="Edit or replace text"
                        >
                          <Pencil className="w-2.5 h-2.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateDetectedText(ocrItem.id, {
                              maskOriginal: !ocrItem.maskOriginal,
                            })
                          }
                          className="px-1.5 py-0.5 rounded hover:bg-white/10 text-emerald-300 flex items-center gap-0.5 cursor-pointer"
                          title="Toggle cover mask over original video text"
                        >
                          {ocrItem.maskOriginal ? (
                            <Eye className="w-2.5 h-2.5" />
                          ) : (
                            <EyeOff className="w-2.5 h-2.5" />
                          )}
                          <span>{ocrItem.maskOriginal ? 'Masked' : 'Mask BG'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteDetectedText(ocrItem.id)}
                          className="p-0.5 rounded hover:bg-rose-500/20 text-rose-400 cursor-pointer"
                          title="Remove detected text"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </React.Fragment>
            );
          })}

          {/* LAYER 2: AUTHENTIC CAPTIK "BEHIND YOU" DEPTH LAYER (z-12) */}
          {isBehindActive && tokenWords.length > 0 && (
            <CaptikCanvasCaptionOverlay
              layer="behind"
              template={activeTemplate}
              words={tokenWords}
              activeWordIndex={activeWordIndex}
              currentTimeSec={currentTime}
              fontScale={
                (Number.isFinite(styleOverrides.fontScale) && styleOverrides.fontScale > 0
                  ? styleOverrides.fontScale
                  : 1) *
                (Number.isFinite(styleOverrides.behindHeroScale) && styleOverrides.behindHeroScale > 0
                  ? styleOverrides.behindHeroScale
                  : 1)
              }
              captionXPercent={Number.isFinite(styleOverrides.xOffset) ? styleOverrides.xOffset : 50}
              captionYPercent={Number.isFinite(styleOverrides.yOffset) ? styleOverrides.yOffset : 76}
              customTextColor={styleOverrides.primaryColor}
              customAccentColor={styleOverrides.accentColor}
              personaMode={styleOverrides.personaMode}
            />
          )}

          {/* LAYER 3: HUMAN-ONLY SEGMENTED FOREGROUND SILHOUETTE CANVAS (z-20) */}
          {isBehindActive && (
            <canvas
              ref={fgSegmentationCanvasRef}
              data-testid="human-foreground-canvas"
              style={{
                opacity: humanSegStatus.hasHumanSubject ? 1 : 0,
                filter: subjectOutlineSpec
                  ? `drop-shadow(0 -3px 0 ${subjectOutlineSpec.color}) drop-shadow(3px 0 0 ${subjectOutlineSpec.color}) drop-shadow(-3px 0 0 ${subjectOutlineSpec.color})`
                  : undefined,
              }}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none z-20 transition-opacity duration-150"
            />
          )}

          {/* LAYER 4: TIMELINE GRAPHIC & AUTHENTIC BOLD TEXT OVERLAYS (`poster`, `b01`..`b10`) (z-25) */}
          {visibleOverlays.map((ov) =>
            ov.type === 'text' ? (
              <CaptikBoldTextOverlayRenderer
                key={ov.id}
                item={{
                  id: ov.id,
                  text: ov.label,
                  variantId: ov.presetId || 'b02',
                  fontFamily: activeTemplate.fontFamily,
                  fontSize: Math.max(12, Math.round(36 * (Number.isFinite(ov.scale) && ov.scale ? ov.scale : 1))),
                  color: ov.color,
                  xPercent: ov.x ?? 32,
                  yPercent: ov.y ?? 26,
                }}
                isSelected={selectedOverlayId === ov.id}
                onSelect={() => setSelectedOverlayId(ov.id)}
              />
            ) : (
              <div
                key={ov.id}
                style={{
                  top: `${ov.y ?? 24}%`,
                  left: `${ov.x ?? 50}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                className="absolute z-25 pointer-events-none anim-pop"
              >
                <div
                  style={{
                    backgroundColor: `${ov.color}25`,
                    borderColor: ov.color,
                    color: '#ffffff',
                  }}
                  className="px-3 py-1 rounded-lg border-2 font-display font-extrabold text-xs uppercase tracking-wider shadow-lg backdrop-blur-xs"
                >
                  <span style={{ color: ov.color }} className="mr-1">
                    ●
                  </span>
                  {ov.label}
                </div>
              </div>
            )
          )}

          {/* LAYER 5: AUTHENTIC CAPTIK FOREGROUND SYNCHRONIZED CAPTIONS (z-30) */}
          {tokenWords.length > 0 && (
            <div
              onPointerDown={() => setIsDraggingCaption(true)}
              title="Drag to reposition captions on canvas"
              className="absolute inset-0 z-30 cursor-grab active:cursor-grabbing"
            >
              <CaptikCanvasCaptionOverlay
                layer="front"
                template={activeTemplate}
                words={tokenWords}
                activeWordIndex={activeWordIndex}
                currentTimeSec={currentTime}
                fontScale={
                  Number.isFinite(styleOverrides.fontScale) && styleOverrides.fontScale > 0
                    ? styleOverrides.fontScale
                    : 1
                }
                captionXPercent={Number.isFinite(styleOverrides.xOffset) ? styleOverrides.xOffset : 50}
                captionYPercent={
                  activeTemplate.lookSpec?.positionYPct &&
                  styleOverrides.yOffset === 76
                    ? activeTemplate.lookSpec.positionYPct
                    : Number.isFinite(styleOverrides.yOffset)
                    ? styleOverrides.yOffset
                    : 76
                }
                customTextColor={styleOverrides.primaryColor}
                customAccentColor={styleOverrides.accentColor}
                personaMode={styleOverrides.personaMode}
              />
            </div>
          )}

          {/* Safe Zone Guides Overlay */}
          {showSafeGrid && (
            <div className="absolute inset-0 pointer-events-none z-40 border-2 border-dashed border-[#f5a524]/40 m-5 rounded-lg flex flex-col justify-between p-2">
              <span className="text-[9px] font-mono text-[#f5a524] bg-black/70 px-1.5 py-0.5 rounded self-start">
                Reels / Shorts Safe Zone ({aspectRatio})
              </span>
              <span className="text-[9px] font-mono text-[#f5a524] bg-black/70 px-1.5 py-0.5 rounded self-end">
                Y: {styleOverrides.yOffset}%
              </span>
            </div>
          )}

          {/* Top-Right Quality Badge inside video frame (Exact match to captik_desk.webp) */}
          <div className="absolute top-2.5 right-2.5 z-40 px-2 py-0.5 rounded bg-black/65 backdrop-blur-xs text-[10px] font-mono tabular-nums text-zinc-200">
            {qualityBadge}
          </div>
        </div>
      </div>

      {/* Bottom Transport Controls Bar (Matches captik_desk.webp) */}
      <div className="h-11 px-4 border-t border-white/[0.07] bg-[#0b0b0d] flex items-center justify-between text-xs shrink-0">
        {/* Left: Studio Timecode 00:00:07:07 | 00:00:07:07 */}
        <div className="flex items-center gap-2 font-mono text-xs tabular-nums">
          <span data-testid="player-current-timecode" className="text-[#f5a524] font-semibold">
            {formatTimecode(currentTime)}
          </span>
          <span className="text-zinc-600">|</span>
          <span data-testid="player-duration-timecode" className="text-zinc-400">
            {formatTimecode(duration)}
          </span>
        </div>

        {/* Center: Play / Pause + Mute */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            data-testid="player-play-pause-btn"
            onClick={onTogglePlay}
            aria-label={isPlaying ? 'Pause video' : 'Play video'}
            className="w-8 h-8 rounded-full hover:bg-white/[0.08] text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
            className="w-7 h-7 rounded-md hover:bg-white/[0.06] text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
          >
            {isMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <Volume2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Right: Ratio Selector + Fullscreen (Matches captik_desk.webp) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#141418] border border-white/[0.09] rounded-md px-2 py-1">
            <span className="text-[11px] text-zinc-400 mr-1 hidden sm:inline">Ratio</span>
            {(['9:16', '16:9', '1:1', '4:5'] as AspectRatioPreset[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onChangeAspectRatio(r)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold tabular-nums transition-all cursor-pointer ${
                  aspectRatio === r
                    ? 'bg-[#f5a524] text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleFullscreen}
            title="Fullscreen player"
            aria-label="Fullscreen player"
            className="w-7 h-7 rounded-md bg-[#141418] hover:bg-[#1e1e24] border border-white/[0.09] text-zinc-300 hover:text-white flex items-center justify-center cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </main>
  );
};
