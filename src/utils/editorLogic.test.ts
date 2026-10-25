import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatTimecode,
  formatShortTime,
  formatSegmentRange,
  formatSrtTimestamp,
  getActiveSegmentAndWord,
  rebuildSegmentsByLineMode,
  splitSegmentAtWord,
  cycleWordEmphasis,
  generateSrt,
  parseSrt,
  filterTemplates,
  applyPauseRemovalMode,
  buildVideoFilterCss,
  DEFAULT_ADJUSTMENTS,
  HYDRATED_INITIAL_SEGMENTS,
} from './editorLogic.ts';
import {
  computeSampleTimestamps,
  mergeFrameOcrDetections,
  convertDetectedTextsToCaptionSegments,
  updateDetectedTextItem,
  getVisibleDetectedTextsAtTime,
  createNewProjectRecord,
} from './projectAndOcrLogic.ts';
import { TEMPLATES } from '../data/templatesCatalog.ts';
import { CAPTIK_LOOK_SPECS, CAPTIK_GOOGLE_FONTS } from '../data/captikLookSpecs.ts';

describe('editorLogic pure functions', () => {
  it('formats studio timecode HH:MM:SS:FF accurately at 30fps', () => {
    assert.equal(formatTimecode(0), '00:00:00:00');
    assert.equal(formatTimecode(7.24, 30), '00:00:07:07');
    assert.equal(formatTimecode(-4, 30), '00:00:00:00');
  });

  it('formats short segment times and ranges like 0:00.4 → 0:01.2', () => {
    assert.equal(formatShortTime(0.4), '0:00.4');
    assert.equal(formatSegmentRange(0.4, 1.2), '0:00.4 → 0:01.2');
    assert.equal(formatSrtTimestamp(1.2), '00:00:01,200');
  });

  it('locates active segment and word for playback timestamp', () => {
    const { segment, activeWord } = getActiveSegmentAndWord(
      HYDRATED_INITIAL_SEGMENTS,
      0.9
    );
    assert.ok(segment);
    assert.equal(segment.id, 'seg-1');
    assert.ok(activeWord);
    assert.equal(activeWord.text, 'video');
  });

  it('rebuilds segments between 1-line and 2-line caption modes without losing words', () => {
    const oneLine = rebuildSegmentsByLineMode(HYDRATED_INITIAL_SEGMENTS, 1);
    const twoLines = rebuildSegmentsByLineMode(HYDRATED_INITIAL_SEGMENTS, 2);
    const totalOriginal = HYDRATED_INITIAL_SEGMENTS.reduce(
      (acc, s) => acc + s.words.length,
      0
    );
    const totalOneLine = oneLine.reduce((acc, s) => acc + s.words.length, 0);
    const totalTwoLines = twoLines.reduce((acc, s) => acc + s.words.length, 0);

    assert.equal(totalOneLine, totalOriginal);
    assert.equal(totalTwoLines, totalOriginal);
    assert.ok(oneLine.length >= twoLines.length);
  });

  it('splits a segment at a specific word index cleanly', () => {
    const split = splitSegmentAtWord(HYDRATED_INITIAL_SEGMENTS, 'seg-1', 2);
    assert.equal(split.length, HYDRATED_INITIAL_SEGMENTS.length + 1);
    assert.equal(split[0].words.length, 2);
    assert.equal(split[1].words.length, 2);
  });

  it('cycles word emphasis state between none, green, and amber', () => {
    assert.equal(cycleWordEmphasis('none'), 'green');
    assert.equal(cycleWordEmphasis('green'), 'amber');
    assert.equal(cycleWordEmphasis('amber'), 'none');
  });

  it('round-trips SRT export and import accurately', () => {
    const srt = generateSrt(HYDRATED_INITIAL_SEGMENTS, 'hinglish');
    assert.ok(srt.includes('00:00:00,400 --> 00:00:01,200'));
    assert.ok(srt.includes('Maine bas video upload'));

    const parsed = parseSrt(srt);
    assert.equal(parsed.length, HYDRATED_INITIAL_SEGMENTS.length);
    assert.equal(
      parsed[0].words.map((w) => w.text).join(' '),
      'Maine bas video upload'
    );
  });

  it('filters all 106 templates across category tabs and search queries and attaches authentic Captik Look specs', () => {
    assert.equal(TEMPLATES.length, 106);
    assert.equal(CAPTIK_LOOK_SPECS.length, 73);
    assert.equal(CAPTIK_GOOGLE_FONTS.length, 127);

    const popular = filterTemplates(TEMPLATES, 'popular', '');
    assert.equal(popular.length, 16);

    const behind = filterTemplates(TEMPLATES, 'behind', '');
    assert.equal(behind.length, 29);

    const searchGarnet = filterTemplates(TEMPLATES, 'all', 'Garnet');
    assert.equal(searchGarnet.length, 1);
    assert.equal(searchGarnet[0].id, 'look_garnet');
    assert.ok(searchGarnet[0].lookSpec);
    assert.equal(searchGarnet[0].lookSpec?.family, 'karaoke');
    assert.ok(searchGarnet[0].lookSpec?.impact);
    assert.equal(searchGarnet[0].lookSpec?.impact?.sizePx, 91);

    const belfry = TEMPLATES.find((t) => t.id === 'look_belfry');
    assert.ok(belfry?.lookSpec);
    assert.equal(belfry?.lookSpec?.family, 'stack');

    const oriel = TEMPLATES.find((t) => t.id === 'look_oriel');
    assert.ok(oriel?.lookSpec);
    assert.equal(oriel?.lookSpec?.family, 'spatial');
  });

  it('computes pause removal savings for Tight and Natural modes', () => {
    const tight = applyPauseRemovalMode(HYDRATED_INITIAL_SEGMENTS, 'Tight');
    assert.ok(tight.savedSeconds > 0);
    assert.ok(
      tight.segments[tight.segments.length - 1].end <
        HYDRATED_INITIAL_SEGMENTS[HYDRATED_INITIAL_SEGMENTS.length - 1].end
    );
  });

  it('builds valid CSS filter string from adjustments', () => {
    const css = buildVideoFilterCss({
      ...DEFAULT_ADJUSTMENTS,
      contrast: 20,
      saturation: 15,
    });
    assert.ok(css.includes('contrast(1.20)'));
    assert.ok(css.includes('saturate(1.15)'));
  });

  it('computes sample timestamps across video duration and merges OCR frame detections accurately', () => {
    const stamps = computeSampleTimestamps(6.0, 6);
    assert.equal(stamps.length, 6);
    assert.ok(stamps[0] > 0 && stamps[stamps.length - 1] < 6.0);

    const rawBlocks = [
      {
        timestamp: 0.5,
        text: 'MUMBAI STREET VLOG\n',
        confidence: 88,
        x: 50,
        y: 22,
        width: 68,
        height: 12,
        bgColor: '#11131a',
      },
      {
        timestamp: 1.5,
        text: 'MUMBAI STREET VLOG',
        confidence: 92,
        x: 50,
        y: 23,
        width: 70,
        height: 12,
        bgColor: '#11131a',
      },
      {
        timestamp: 3.5,
        text: 'BEST VADA PAV IN BANDRA',
        confidence: 86,
        x: 50,
        y: 74,
        width: 74,
        height: 14,
        bgColor: '#1a1510',
      },
    ];

    const merged = mergeFrameOcrDetections(rawBlocks, 1.0, 6.0);
    assert.equal(merged.length, 2);
    assert.equal(merged[0].text, 'MUMBAI STREET VLOG');
    assert.ok(merged[0].endTime > 1.8);
    assert.equal(merged[0].confidence, 92);
    assert.equal(merged[1].text, 'BEST VADA PAV IN BANDRA');

    const visibleAt1 = getVisibleDetectedTextsAtTime(merged, 1.2);
    assert.equal(visibleAt1.length, 1);
    assert.equal(visibleAt1[0].text, 'MUMBAI STREET VLOG');

    // Editing or repositioning automatically enables maskOriginal
    const updated = updateDetectedTextItem(merged, merged[0].id, {
      text: 'DELHI FOOD TOUR',
    });
    assert.equal(updated[0].text, 'DELHI FOOD TOUR');
    assert.equal(updated[0].maskOriginal, true);

    const convertedSegments = convertDetectedTextsToCaptionSegments(updated);
    assert.equal(convertedSegments.length, 2);
    assert.equal(
      convertedSegments[0].words.map((w) => w.text).join(' '),
      'DELHI FOOD TOUR'
    );
  });

  it('creates independent CaptikProject records for uploaded videos', () => {
    const proj = createNewProjectRecord({
      name: 'My Uploaded Clip',
      videoUrl: 'blob:http://localhost:3000/123',
      videoFileName: 'my_clip.mp4',
      duration: 8.5,
      isCustomUpload: true,
      defaultStyleOverrides: {
        fontScale: 1,
        yOffset: 76,
        xOffset: 50,
        primaryColor: '#FFFFFF',
        accentColor: '#F59E0B',
        secondaryColor: '#10B981',
        bgOpacity: 0,
        behindSubject: false,
        behindHeroScale: 1,
        uppercase: true,
        shadowStrength: 14,
        strokeWidth: 0,
        animIn: 'Pop',
        animOut: 'Fade out',
        animLoop: 'Pulse',
      },
    });
    assert.equal(proj.name, 'My Uploaded Clip');
    assert.equal(proj.isCustomUpload, true);
    assert.equal(proj.duration, 8.5);
    assert.equal(proj.ocrStatus, 'idle');
    assert.equal(proj.segments.length, 0);
  });
});


