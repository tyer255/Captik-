import React, { useRef, useState } from 'react';
import {
  Undo2,
  Redo2,
  Scissors,
  SkipBack,
  SkipForward,
  Trash2,
  Snowflake,
  Gauge,
  Repeat,
  Copy,
  Clock,
  Link2,
  Unlink2,
  ZoomOut,
  ZoomIn,
  Volume2,
  VolumeX,
  LayoutGrid,
  Maximize2,
  ScanText,
  ArrowLeft,
  ArrowRight,
  Film,
} from 'lucide-react';
import type { MediaAssetItem } from '../data/assetsCatalog';
import {
  getWordTextForScript,
  type CaptionSegment,
  type TimelineOverlayItem,
  type VideoTimelineClip,
  type AudioTimelineClip,
} from '../utils/editorLogic';
import type { DetectedVideoTextItem } from '../utils/projectAndOcrLogic';

export type SelectedTimelineTrackType = 'video' | 'audio' | 'caption';

interface BottomTimelineProps {
  currentTime: number;
  duration: number;
  onSeekTo: (seconds: number) => void;
  segments: CaptionSegment[];
  activeSegmentId: string;
  activeScript: string;
  timelineCaptionMode: 'words' | 'lines';
  onChangeTimelineCaptionMode: (mode: 'words' | 'lines') => void;
  overlays: TimelineOverlayItem[];
  onDeleteOverlay: (id: string) => void;
  detectedTexts: DetectedVideoTextItem[];
  selectedDetectedTextId: string | null;
  onSelectDetectedText: (id: string | null) => void;
  mediaAsset: MediaAssetItem;
  frameThumbnails?: string[];
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSplitAtPlayhead: () => void;
  onDeleteSelectedSegment: () => void;
  onDuplicateSelectedSegment: () => void;
  onNudgeSelectedSegment: (deltaSec: number) => void;
  playbackRate: number;
  onCyclePlaybackRate: () => void;
  timelineZoom: number;
  onChangeTimelineZoom: (z: number) => void;
  // Multi-clip Video & Synchronized Audio Editing Props
  videoClips?: VideoTimelineClip[];
  audioClips?: AudioTimelineClip[];
  selectedClipId?: string | null;
  selectedTrackType?: SelectedTimelineTrackType;
  onSelectTimelineClip?: (
    clipId: string,
    trackType: SelectedTimelineTrackType
  ) => void;
  isAudioLinked?: boolean;
  onToggleAudioLinked?: () => void;
  onTrimVideoClip?: (
    clipId: string,
    edge: 'start' | 'end',
    newTimelineTime: number
  ) => void;
  onTrimAudioClip?: (
    clipId: string,
    edge: 'start' | 'end',
    newTimelineTime: number
  ) => void;
  onMoveTimelineClip?: (
    clipId: string,
    trackType: 'video' | 'audio',
    directionOrDelta: 'left' | 'right' | number
  ) => void;
  onDeleteTimelineClip?: (clipId: string, trackType: 'video' | 'audio') => void;
  onToggleMuteAudioClip?: (clipId: string) => void;
}

const DEFAULT_FILMSTRIP_THUMBS = [
  '/assets/terrace_poster.webp',
  '/assets/take1.webp',
  '/assets/terrace_clean.webp',
  '/assets/take2.webp',
  '/assets/terrace_behind.webp',
  '/assets/take3.webp',
  '/assets/take4.webp',
  '/assets/take5.webp',
  '/assets/take6.webp',
  '/assets/terrace_poster.webp',
];

export const BottomTimeline: React.FC<BottomTimelineProps> = ({
  currentTime,
  duration,
  onSeekTo,
  segments,
  activeSegmentId,
  activeScript,
  timelineCaptionMode,
  onChangeTimelineCaptionMode,
  overlays,
  onDeleteOverlay,
  detectedTexts,
  selectedDetectedTextId,
  onSelectDetectedText,
  mediaAsset,
  frameThumbnails,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSplitAtPlayhead,
  onDeleteSelectedSegment,
  onDuplicateSelectedSegment,
  onNudgeSelectedSegment,
  playbackRate,
  onCyclePlaybackRate,
  timelineZoom,
  onChangeTimelineZoom,
  videoClips = [],
  audioClips = [],
  selectedClipId = null,
  selectedTrackType = 'video',
  onSelectTimelineClip,
  isAudioLinked = true,
  onToggleAudioLinked,
  onTrimVideoClip,
  onTrimAudioClip,
  onMoveTimelineClip,
  onDeleteTimelineClip,
  onToggleMuteAudioClip,
}) => {
  const tracksContainerRef = useRef<HTMLDivElement | null>(null);
  const safeDuration = Math.max(1, duration || 7.2);

  // Dragging state for interactive trim handles or clip move
  const [dragState, setDragState] = useState<{
    mode: 'trim-start' | 'trim-end' | 'move';
    trackType: 'video' | 'audio';
    clipId: string;
    initialX: number;
    initialTime: number;
  } | null>(null);

  const clientXToTimelineTime = (clientX: number): number => {
    if (!tracksContainerRef.current) return currentTime;
    const rect = tracksContainerRef.current.getBoundingClientRect();
    const relX = clientX - rect.left;
    const width = Math.max(120, rect.width);
    const ratio = Math.max(0, Math.min(1, relX / width));
    return Number((ratio * safeDuration).toFixed(2));
  };

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragState) return;
    const targetTime = clientXToTimelineTime(e.clientX);
    onSeekTo(targetTime);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState) return;
    e.stopPropagation();
    const newTime = clientXToTimelineTime(e.clientX);

    if (dragState.mode === 'trim-start' || dragState.mode === 'trim-end') {
      const edge = dragState.mode === 'trim-start' ? 'start' : 'end';
      if (dragState.trackType === 'video') {
        onTrimVideoClip?.(dragState.clipId, edge, newTime);
      } else {
        onTrimAudioClip?.(dragState.clipId, edge, newTime);
      }
    } else if (dragState.mode === 'move') {
      const delta = Number((newTime - dragState.initialTime).toFixed(2));
      if (Math.abs(delta) >= 0.15) {
        onMoveTimelineClip?.(dragState.clipId, dragState.trackType, delta);
        setDragState({ ...dragState, initialTime: newTime });
      }
    }
  };

  const handlePointerUp = () => {
    if (dragState) {
      setDragState(null);
    }
  };

  const playheadPercent = Math.max(
    0,
    Math.min(100, (currentTime / safeDuration) * 100)
  );

  // Separate overlays into visual (Text & Elements) vs Sound Effects
  const visualOverlays = overlays.filter((o) => o.type !== 'sfx');
  const sfxOverlays = overlays.filter((o) => o.type === 'sfx');
  const activeOcrItems = detectedTexts.filter((d) => !d.isRemoved);

  // Flatten all words if in 'words' mode
  const allWords = segments.flatMap((s) =>
    s.words.map((w) => ({ ...w, segmentId: s.id }))
  );

  // Generate ruler ticks every 2 seconds matching captik_desk.webp (00:00, 00:02, 00:04, 00:06, 00:08)
  const maxRulerSec = Math.max(8, Math.ceil(safeDuration / 2) * 2);
  const rulerTicks: number[] = [];
  for (let s = 0; s <= maxRulerSec; s += 2) {
    rulerTicks.push(s);
  }

  const thumbsToUse =
    frameThumbnails && frameThumbnails.length > 0
      ? frameThumbnails
      : DEFAULT_FILMSTRIP_THUMBS;

  // Effective clips to display (fallback to single full-duration clip if empty)
  const effectiveVideoClips: VideoTimelineClip[] =
    videoClips.length > 0
      ? videoClips
      : [
          {
            id: 'vclip-default',
            title: mediaAsset.title,
            timelineStart: 0,
            timelineEnd: safeDuration,
            sourceStart: 0,
            sourceEnd: safeDuration,
          },
        ];

  const effectiveAudioClips: AudioTimelineClip[] =
    audioClips.length > 0
      ? audioClips
      : [
          {
            id: 'aclip-default',
            title: `${mediaAsset.title} Audio`,
            linkedVideoClipId: 'vclip-default',
            timelineStart: 0,
            timelineEnd: safeDuration,
            sourceStart: 0,
            sourceEnd: safeDuration,
            volume: 1,
          },
        ];

  const activeSelectedVideoClip =
    effectiveVideoClips.find((c) => c.id === selectedClipId) ||
    effectiveVideoClips.find(
      (c) => currentTime >= c.timelineStart && currentTime <= c.timelineEnd
    ) ||
    effectiveVideoClips[0];

  const activeSelectedAudioClip =
    effectiveAudioClips.find((a) => a.id === selectedClipId) ||
    effectiveAudioClips.find(
      (a) => currentTime >= a.timelineStart && currentTime <= a.timelineEnd
    ) ||
    effectiveAudioClips[0];

  const handleDeleteAction = () => {
    if (
      selectedTrackType === 'video' &&
      activeSelectedVideoClip &&
      effectiveVideoClips.length > 1 &&
      onDeleteTimelineClip
    ) {
      onDeleteTimelineClip(activeSelectedVideoClip.id, 'video');
      return;
    }
    if (
      selectedTrackType === 'audio' &&
      activeSelectedAudioClip &&
      onDeleteTimelineClip
    ) {
      onDeleteTimelineClip(activeSelectedAudioClip.id, 'audio');
      return;
    }
    onDeleteSelectedSegment();
  };

  return (
    <section
      aria-label="Multi-track video timeline"
      data-testid="bottom-timeline"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className="h-[235px] bg-[#0b0b0c] border-t border-white/[0.08] flex flex-col select-none shrink-0 z-20"
    >
      {/* ==================== TIMELINE ACTION TOOLBAR ==================== */}
      <div className="h-9 px-3 border-b border-white/[0.06] bg-[#0e0e11] flex items-center justify-between gap-2 text-[11px] overflow-x-auto no-scrollbar shrink-0">
        {/* Left Tools: Undo, Redo, Split at Playhead, Skip Back, Skip Forward, Delete, Trim/Move Clip, Speed, Captions [Words | Lines] */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            aria-label="Timeline Undo"
            className="p-1.5 rounded hover:bg-white/[0.06] text-zinc-400 hover:text-white disabled:opacity-35 cursor-pointer"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            aria-label="Timeline Redo"
            className="p-1.5 rounded hover:bg-white/[0.06] text-zinc-400 hover:text-white disabled:opacity-35 cursor-pointer"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>

          <div className="h-3.5 w-[1px] bg-white/10 mx-1" />

          <button
            type="button"
            data-testid="timeline-split-btn"
            onClick={onSplitAtPlayhead}
            title={`Split ${
              isAudioLinked
                ? 'video & linked audio'
                : selectedTrackType === 'audio'
                ? 'audio clip'
                : 'video clip'
            } at exact playhead (${currentTime.toFixed(2)}s)`}
            aria-label="Split at playhead"
            className="px-2 py-1 rounded bg-[#f5a524]/15 hover:bg-[#f5a524]/25 border border-[#f5a524]/40 text-[#f5a524] font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Split</span>
          </button>

          <button
            type="button"
            onClick={() => onSeekTo(Math.max(0, Number((currentTime - 1).toFixed(2))))}
            title="Skip backward 1 second"
            aria-label="Skip backward 1 second"
            className="p-1.5 rounded hover:bg-white/[0.07] text-zinc-400 hover:text-white cursor-pointer"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() =>
              onSeekTo(Math.min(safeDuration, Number((currentTime + 1).toFixed(2))))
            }
            title="Skip forward 1 second"
            aria-label="Skip forward 1 second"
            className="p-1.5 rounded hover:bg-white/[0.07] text-zinc-400 hover:text-white cursor-pointer"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            data-testid="timeline-delete-btn"
            onClick={handleDeleteAction}
            title="Delete selected video/audio clip or caption segment"
            aria-label="Delete selected segment"
            className="p-1.5 rounded hover:bg-rose-500/15 text-zinc-400 hover:text-rose-300 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Clip Move / Rearrange Left & Right Controls */}
          {onMoveTimelineClip && (
            <div className="flex items-center gap-0.5 bg-[#16161b] border border-white/[0.08] rounded-md px-1 py-0.5">
              <button
                type="button"
                data-testid="timeline-move-left-btn"
                onClick={() => {
                  const targetId =
                    selectedTrackType === 'audio'
                      ? activeSelectedAudioClip?.id
                      : activeSelectedVideoClip?.id;
                  if (targetId) {
                    onMoveTimelineClip(
                      targetId,
                      selectedTrackType === 'audio' ? 'audio' : 'video',
                      'left'
                    );
                  }
                }}
                title="Move or rearrange selected clip earlier on timeline"
                aria-label="Move clip left"
                className="p-0.5 rounded hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" />
              </button>
              <span className="text-[10px] font-mono text-zinc-400 px-1">
                {selectedTrackType === 'audio'
                  ? `Audio (${effectiveAudioClips.length})`
                  : `Clips (${effectiveVideoClips.length})`}
              </span>
              <button
                type="button"
                data-testid="timeline-move-right-btn"
                onClick={() => {
                  const targetId =
                    selectedTrackType === 'audio'
                      ? activeSelectedAudioClip?.id
                      : activeSelectedVideoClip?.id;
                  if (targetId) {
                    onMoveTimelineClip(
                      targetId,
                      selectedTrackType === 'audio' ? 'audio' : 'video',
                      'right'
                    );
                  }
                }}
                title="Move or rearrange selected clip later on timeline"
                aria-label="Move clip right"
                className="p-0.5 rounded hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer"
              >
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => onNudgeSelectedSegment(0)}
            title="Freeze frame"
            aria-label="Freeze frame"
            className="hidden lg:flex p-1.5 rounded hover:bg-white/[0.07] text-zinc-400 hover:text-white cursor-pointer"
          >
            <Snowflake className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onCyclePlaybackRate}
            title="Cycle playback speed"
            className="px-2 py-1 rounded hover:bg-white/[0.07] text-zinc-300 hover:text-[#f5a524] flex items-center gap-1 font-semibold tabular-nums cursor-pointer"
          >
            <Gauge className="w-3.5 h-3.5 text-[#f5a524]" />
            <span>{playbackRate}x</span>
          </button>

          <button
            type="button"
            onClick={() => onSeekTo(0)}
            title="Loop to start"
            aria-label="Loop to start"
            className="hidden md:flex p-1.5 rounded hover:bg-white/[0.07] text-zinc-400 hover:text-white cursor-pointer"
          >
            <Repeat className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onDuplicateSelectedSegment}
            title="Duplicate active caption segment"
            aria-label="Duplicate active segment"
            className="p-1.5 rounded hover:bg-white/[0.07] text-zinc-400 hover:text-white cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          <div className="h-3.5 w-[1px] bg-white/10 mx-1" />

          {/* Captions [Words | Lines] toggle */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-zinc-500 hidden sm:inline">Captions</span>
            <div className="flex items-center bg-[#16161b] border border-white/[0.08] rounded-md p-0.5">
              <button
                type="button"
                onClick={() => onChangeTimelineCaptionMode('words')}
                className={`px-2 py-0.5 rounded text-[10.5px] font-semibold transition-all cursor-pointer ${
                  timelineCaptionMode === 'words'
                    ? 'bg-[#3d2d10] text-[#f5a524] border border-[#f5a524]/45'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Words
              </button>
              <button
                type="button"
                onClick={() => onChangeTimelineCaptionMode('lines')}
                className={`px-2 py-0.5 rounded text-[10.5px] font-semibold transition-all cursor-pointer ${
                  timelineCaptionMode === 'lines'
                    ? 'bg-[#3d2d10] text-[#f5a524] border border-[#f5a524]/45'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Lines
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNudgeSelectedSegment(0.1)}
            title="Nudge active caption segment +0.1s"
            aria-label="Time nudge"
            className="p-1.5 rounded hover:bg-white/[0.07] text-zinc-400 hover:text-white cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right Tools: Audio Link/Unlink Toggle, Zoom slider, Fit */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            data-testid="timeline-audio-link-btn"
            onClick={() => {
              if (onToggleAudioLinked) {
                onToggleAudioLinked();
              } else {
                onNudgeSelectedSegment(-0.05);
              }
            }}
            title={
              isAudioLinked
                ? 'Audio Linked to Video (Splitting/trimming video also splits/trims audio. Click to Unlink)'
                : 'Audio Unlinked (Edit video and audio clips independently. Click to Link)'
            }
            aria-label="Ripple link tracks"
            className={`px-2 h-7 rounded-md border flex items-center gap-1 text-[10px] font-semibold transition-colors cursor-pointer ${
              isAudioLinked
                ? 'bg-[#3d2d10] border-[#f5a524]/45 text-[#f5a524]'
                : 'bg-[#16161b] border-white/15 text-zinc-400 hover:text-white'
            }`}
          >
            {isAudioLinked ? (
              <>
                <Link2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Linked A/V</span>
              </>
            ) : (
              <>
                <Unlink2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Unlinked A/V</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-1.5 px-1">
            <button
              type="button"
              onClick={() => onChangeTimelineZoom(Math.max(1, timelineZoom - 0.25))}
              aria-label="Zoom out timeline"
              className="text-zinc-400 hover:text-white cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <input
              type="range"
              min={1}
              max={2.5}
              step={0.25}
              value={timelineZoom}
              aria-label="Timeline zoom"
              onChange={(e) => onChangeTimelineZoom(Number(e.target.value))}
              className="w-20 accent-[#f5a524] cursor-pointer"
            />
            <button
              type="button"
              onClick={() => onChangeTimelineZoom(Math.min(2.5, timelineZoom + 0.25))}
              aria-label="Zoom in timeline"
              className="text-zinc-400 hover:text-white cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => onChangeTimelineZoom(1)}
            title="Fit timeline to window"
            aria-label="Fit timeline to window"
            className="p-1 text-zinc-400 hover:text-white cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ==================== MULTI-TRACK TIMELINE BODY ==================== */}
      <div
        ref={tracksContainerRef}
        data-testid="timeline-tracks-area"
        onClick={handleTrackClick}
        className="flex-1 flex flex-col relative overflow-x-auto overflow-y-hidden custom-scrollbar cursor-pointer px-3"
      >
        {/* Time Ruler Row (00:00, 00:02, 00:04, 00:06, 00:08) */}
        <div className="h-5 relative flex items-center border-b border-white/[0.05] shrink-0">
          {rulerTicks.map((sec) => {
            const leftPct = Math.min(98, (sec / safeDuration) * 100);
            if (sec > safeDuration + 1.5) return null;
            return (
              <div
                key={sec}
                style={{ left: `${leftPct}%` }}
                className="absolute top-0 bottom-0 flex items-center pointer-events-none"
              >
                <span className="text-[10px] font-mono tabular-nums text-zinc-500">
                  00:{String(sec).padStart(2, '0')}
                </span>
              </div>
            );
          })}
        </div>

        {/* 4 Tracks Stack */}
        <div className="flex-1 flex flex-col justify-between py-1 relative gap-1">
          {/* TRACK 1: Detected OCR Text & Visual Overlays */}
          <div className="h-6 relative flex items-center rounded-md bg-white/[0.01]">
            {visualOverlays.length === 0 && activeOcrItems.length === 0 ? (
              <div className="flex items-center gap-1.5 px-2 text-[10.5px] text-zinc-500 pointer-events-none">
                <LayoutGrid className="w-3 h-3 text-zinc-600" />
                <span>
                  Text and elements: add one from the Text or Elements tab, or run Auto-Detect Text (OCR)
                </span>
              </div>
            ) : (
              <>
                {activeOcrItems.map((ocr) => {
                  const left = (ocr.startTime / safeDuration) * 100;
                  const width = Math.max(
                    6,
                    ((ocr.endTime - ocr.startTime) / safeDuration) * 100
                  );
                  const isSel = selectedDetectedTextId === ocr.id;
                  return (
                    <div
                      key={ocr.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectDetectedText(ocr.id);
                        onSeekTo(ocr.startTime + 0.05);
                      }}
                      style={{ left: `${left}%`, width: `${width}%` }}
                      className={`absolute top-0.5 bottom-0.5 rounded-md border px-2 flex items-center gap-1 text-[10px] font-bold truncate transition-all ${
                        isSel
                          ? 'bg-emerald-500/35 border-[#f5a524] text-white z-10'
                          : 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200'
                      }`}
                    >
                      <ScanText className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">{ocr.text}</span>
                    </div>
                  );
                })}

                {visualOverlays.map((ov) => {
                  const left = (ov.start / safeDuration) * 100;
                  const width = Math.max(
                    6,
                    ((ov.end - ov.start) / safeDuration) * 100
                  );
                  return (
                    <div
                      key={ov.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSeekTo(ov.start + 0.05);
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        onDeleteOverlay(ov.id);
                      }}
                      title={`${ov.label} (Double-click to remove)`}
                      style={{
                        left: `${left}%`,
                        width: `${width}%`,
                        borderColor: ov.color,
                        backgroundColor: `${ov.color}28`,
                      }}
                      className="absolute top-0.5 bottom-0.5 rounded-md border px-2 flex items-center text-[10px] font-bold text-white truncate"
                    >
                      <span className="truncate">{ov.label}</span>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* TRACK 2: Warm Gold/Tan Captions Track */}
          <div className="h-8 relative flex items-center">
            {timelineCaptionMode === 'lines'
              ? segments.map((seg) => {
                  const left = (seg.start / safeDuration) * 100;
                  const width = Math.max(
                    3.5,
                    ((seg.end - seg.start) / safeDuration) * 100
                  );
                  const isSelected = seg.id === activeSegmentId;
                  const text = seg.words
                    .map((w) => getWordTextForScript(w, activeScript))
                    .join(' ');
                  return (
                    <div
                      key={seg.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTimelineClip?.(seg.id, 'caption');
                        onSeekTo(seg.start + 0.04);
                      }}
                      style={{ left: `${left}%`, width: `${width}%` }}
                      className={`absolute top-0.5 bottom-0.5 rounded-lg px-2.5 flex items-center text-[11px] font-bold truncate transition-all ${
                        isSelected
                          ? 'bg-[#d8b878] text-[#120f07] ring-2 ring-[#f5a524]'
                          : 'bg-[#bfa36a] text-[#17130a] hover:bg-[#cdb074]'
                      }`}
                    >
                      <span className="truncate">{text}</span>
                    </div>
                  );
                })
              : allWords.map((word) => {
                  const left = (word.start / safeDuration) * 100;
                  const width = Math.max(
                    2.2,
                    ((word.end - word.start) / safeDuration) * 100
                  );
                  const isCurrent =
                    currentTime >= word.start && currentTime <= word.end;
                  return (
                    <div
                      key={word.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSeekTo(word.start + 0.02);
                      }}
                      style={{ left: `${left}%`, width: `${width}%` }}
                      className={`absolute top-0.5 bottom-0.5 rounded-md px-1.5 flex items-center justify-center text-[10px] font-bold truncate ${
                        isCurrent
                          ? 'bg-[#f5a524] text-black z-10'
                          : 'bg-[#bfa36a] text-[#17130a]'
                      }`}
                    >
                      <span className="truncate">
                        {getWordTextForScript(word, activeScript)}
                      </span>
                    </div>
                  );
                })}
          </div>

          {/* TRACK 3: Multi-Clip Video Filmstrip Track with Interactive Trim Handles & Selection */}
          <div
            data-testid="timeline-video-track"
            className="h-9 relative flex items-center rounded-lg bg-[#0d1017]/80"
          >
            {effectiveVideoClips.map((vClip, idx) => {
              const leftPct = Math.max(
                0,
                Math.min(99, (vClip.timelineStart / safeDuration) * 100)
              );
              const widthPct = Math.max(
                4,
                Math.min(
                  100 - leftPct,
                  ((vClip.timelineEnd - vClip.timelineStart) / safeDuration) * 100
                )
              );
              const isClipSelected =
                selectedClipId === vClip.id && selectedTrackType === 'video';
              const clipLen = Math.max(
                0.1,
                vClip.timelineEnd - vClip.timelineStart
              );

              return (
                <div
                  key={vClip.id}
                  data-testid={`timeline-video-clip-${idx}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTimelineClip?.(vClip.id, 'video');
                    const clickTime = clientXToTimelineTime(e.clientX);
                    onSeekTo(
                      Math.max(
                        vClip.timelineStart,
                        Math.min(vClip.timelineEnd, clickTime)
                      )
                    );
                  }}
                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                  className={`group absolute top-0 bottom-0 rounded-lg overflow-hidden border transition-all flex items-center ${
                    isClipSelected
                      ? 'border-[#f5a524] ring-2 ring-[#f5a524]/50 z-20'
                      : 'border-white/15 hover:border-white/35 z-10'
                  }`}
                >
                  {/* Left Trim Handle */}
                  <div
                    data-testid={`video-trim-start-${idx}`}
                    title="Drag to trim clip start"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      onSelectTimelineClip?.(vClip.id, 'video');
                      setDragState({
                        mode: 'trim-start',
                        trackType: 'video',
                        clipId: vClip.id,
                        initialX: e.clientX,
                        initialTime: vClip.timelineStart,
                      });
                    }}
                    className="w-2.5 h-full bg-[#f5a524]/85 hover:bg-[#f5a524] text-black flex items-center justify-center cursor-ew-resize z-20 shrink-0"
                  >
                    <div className="w-[2px] h-3.5 bg-black/70 rounded-full" />
                  </div>

                  {/* Filmstrip Thumbnails inside Video Clip */}
                  <div
                    style={{
                      gridTemplateColumns: `repeat(${Math.max(
                        2,
                        Math.min(thumbsToUse.length, Math.ceil(widthPct / 10))
                      )}, minmax(0, 1fr))`,
                    }}
                    className="flex-1 h-full grid overflow-hidden opacity-90 relative"
                  >
                    {thumbsToUse
                      .slice(
                        0,
                        Math.max(
                          2,
                          Math.min(thumbsToUse.length, Math.ceil(widthPct / 10))
                        )
                      )
                      .map((src, i) => (
                        <img
                          key={i}
                          src={src}
                          alt=""
                          onError={(e) => {
                            e.currentTarget.src = '/assets/terrace_poster.webp';
                          }}
                          className="w-full h-full object-cover border-r border-black/30 pointer-events-none"
                        />
                      ))}

                    {/* Floating Clip Badge */}
                    <div className="absolute inset-y-0 left-1.5 flex items-center pointer-events-none">
                      <div className="px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-xs border border-white/15 flex items-center gap-1 text-[9.5px] font-semibold text-white">
                        <Film className="w-2.5 h-2.5 text-[#f5a524]" />
                        <span className="truncate max-w-[110px]">
                          {vClip.title}
                        </span>
                        <span className="text-zinc-300 font-mono tabular-nums">
                          {clipLen.toFixed(1)}s
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Trim Handle */}
                  <div
                    data-testid={`video-trim-end-${idx}`}
                    title="Drag to trim clip end"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      onSelectTimelineClip?.(vClip.id, 'video');
                      setDragState({
                        mode: 'trim-end',
                        trackType: 'video',
                        clipId: vClip.id,
                        initialX: e.clientX,
                        initialTime: vClip.timelineEnd,
                      });
                    }}
                    className="w-2.5 h-full bg-[#f5a524]/85 hover:bg-[#f5a524] text-black flex items-center justify-center cursor-ew-resize z-20 shrink-0"
                  >
                    <div className="w-[2px] h-3.5 bg-black/70 rounded-full" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* TRACK 4: Synchronized / Independent Audio Waveform Track + Sound Effects */}
          <div
            data-testid="timeline-audio-track"
            className="h-7 relative flex items-center rounded-lg bg-[#080e14]"
          >
            {effectiveAudioClips.map((aClip, idx) => {
              const leftPct = Math.max(
                0,
                Math.min(99, (aClip.timelineStart / safeDuration) * 100)
              );
              const widthPct = Math.max(
                4,
                Math.min(
                  100 - leftPct,
                  ((aClip.timelineEnd - aClip.timelineStart) / safeDuration) * 100
                )
              );
              const isAudioSelected =
                selectedClipId === aClip.id && selectedTrackType === 'audio';
              const clipLen = Math.max(
                0.1,
                aClip.timelineEnd - aClip.timelineStart
              );
              const barCount = Math.max(12, Math.round((widthPct / 100) * 80));

              return (
                <div
                  key={aClip.id}
                  data-testid={`timeline-audio-clip-${idx}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTimelineClip?.(aClip.id, 'audio');
                    const clickTime = clientXToTimelineTime(e.clientX);
                    onSeekTo(
                      Math.max(
                        aClip.timelineStart,
                        Math.min(aClip.timelineEnd, clickTime)
                      )
                    );
                  }}
                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                  className={`absolute top-0 bottom-0 rounded-lg overflow-hidden border transition-all flex items-center bg-[#0b1620] ${
                    isAudioSelected
                      ? 'border-[#2dd4bf] ring-2 ring-[#2dd4bf]/50 z-20'
                      : 'border-[#2dd4bf]/30 hover:border-[#2dd4bf]/60 z-10'
                  } ${aClip.muted ? 'opacity-45' : ''}`}
                >
                  {/* Left Audio Trim Handle */}
                  <div
                    data-testid={`audio-trim-start-${idx}`}
                    title="Drag to trim audio clip start"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      onSelectTimelineClip?.(aClip.id, 'audio');
                      setDragState({
                        mode: 'trim-start',
                        trackType: 'audio',
                        clipId: aClip.id,
                        initialX: e.clientX,
                        initialTime: aClip.timelineStart,
                      });
                    }}
                    className="w-2 h-full bg-[#2dd4bf]/80 hover:bg-[#2dd4bf] cursor-ew-resize z-20 shrink-0"
                  />

                  {/* Cyan Audio Waveform Bars */}
                  <div className="flex-1 h-full px-1 flex items-center justify-between gap-[2px] relative overflow-hidden">
                    {Array.from({ length: barCount }, (_, bIdx) => {
                      const barHeight =
                        24 +
                        Math.abs(
                          Math.sin((bIdx + idx * 7) * 0.65) * 55 +
                            Math.cos(bIdx * 1.3) * 20
                        );
                      return (
                        <div
                          key={bIdx}
                          style={{ height: `${Math.min(92, barHeight)}%` }}
                          className="flex-1 bg-[#2dd4bf]/80 rounded-full pointer-events-none"
                        />
                      );
                    })}

                    <div className="absolute inset-y-0 left-1.5 flex items-center gap-1 pointer-events-none">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleMuteAudioClip?.(aClip.id);
                        }}
                        className="px-1.5 py-0.5 rounded bg-black/75 border border-white/10 flex items-center gap-1 text-[9px] font-semibold text-teal-200 pointer-events-auto cursor-pointer"
                      >
                        {aClip.muted ? (
                          <VolumeX className="w-2.5 h-2.5 text-rose-400" />
                        ) : (
                          <Volume2 className="w-2.5 h-2.5 text-[#2dd4bf]" />
                        )}
                        <span className="truncate max-w-[95px]">
                          {aClip.title}
                        </span>
                        <span className="font-mono text-zinc-400">
                          {clipLen.toFixed(1)}s
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Right Audio Trim Handle */}
                  <div
                    data-testid={`audio-trim-end-${idx}`}
                    title="Drag to trim audio clip end"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      onSelectTimelineClip?.(aClip.id, 'audio');
                      setDragState({
                        mode: 'trim-end',
                        trackType: 'audio',
                        clipId: aClip.id,
                        initialX: e.clientX,
                        initialTime: aClip.timelineEnd,
                      });
                    }}
                    className="w-2 h-full bg-[#2dd4bf]/80 hover:bg-[#2dd4bf] cursor-ew-resize z-20 shrink-0"
                  />
                </div>
              );
            })}

            {/* Added SFX Overlays on Audio Track */}
            {sfxOverlays.map((sfx) => {
              const left = (sfx.start / safeDuration) * 100;
              const width = Math.max(
                5,
                ((sfx.end - sfx.start) / safeDuration) * 100
              );
              return (
                <div
                  key={sfx.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSeekTo(sfx.start);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    onDeleteOverlay(sfx.id);
                  }}
                  title={`${sfx.label} (Double-click to remove)`}
                  style={{ left: `${left}%`, width: `${width}%` }}
                  className="absolute top-0.5 bottom-0.5 rounded-md bg-amber-500/30 border border-amber-400/80 px-2 flex items-center gap-1 text-[9.5px] font-bold text-amber-200 truncate z-30"
                >
                  <Volume2 className="w-2.5 h-2.5 shrink-0" />
                  <span className="truncate">{sfx.label}</span>
                </div>
              );
            })}
          </div>

          {/* ==================== AMBER PLAYHEAD LINE & HANDLE ==================== */}
          <div
            style={{ left: `${playheadPercent}%` }}
            className="absolute top-0 bottom-0 w-[1.5px] bg-[#f5a524] pointer-events-none z-30 shadow-[0_0_8px_#f5a524]"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-[#f5a524] -translate-x-[4px] -translate-y-1 shadow" />
          </div>
        </div>
      </div>
    </section>
  );
};
