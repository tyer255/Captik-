import React from 'react';
import { CaptionTemplateSpec } from '../data/templatesCatalog';
import { CaptikLookSpec } from '../data/captikLookSpecs';
import { WordToken, TextOverlayItem } from '../utils/editorLogic';

function hexWithAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '').trim();
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean.slice(0, 6);
  const num = parseInt(full, 16);
  if (!Number.isFinite(num)) return `rgba(255,255,255,${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getHeroIndex(words: WordToken[]): number {
  const explicitIdx = words.findIndex((w) => w.emphasized);
  if (explicitIdx >= 0) return explicitIdx;
  if (words.length === 0) return -1;
  let bestIdx = 0;
  let bestLen = -1;
  words.forEach((w, idx) => {
    const cleanLen = w.word.replace(/[^\p{L}\p{N}]/gu, '').length;
    if (cleanLen > bestLen) {
      bestLen = cleanLen;
      bestIdx = idx;
    }
  });
  return bestIdx;
}

function buildLookShadow(look: CaptikLookSpec, fallbackColor = '#000000'): string {
  const parts: string[] = [];
  if (look.shadow) {
    parts.push(
      `${look.shadow.offsetX ?? 0}px ${look.shadow.offsetY ?? 4}px ${look.shadow.blurPx}px ${look.shadow.color}`
    );
  }
  if (look.glow) {
    const gc = look.glow.color ?? look.accent ?? fallbackColor;
    parts.push(`0 0 ${look.glow.px}px ${gc}`, `0 0 ${Math.round(look.glow.px * 1.8)}px ${hexWithAlpha(gc, 0.5)}`);
  }
  return parts.length > 0 ? parts.join(', ') : '0 2px 8px rgba(0,0,0,0.55)';
}

/**
 * 1. AUTHENTIC CAPTIK STYLE CARD PREVIEW (Ported from 0ns2lbwew3o6..js CAPTION_STYLES)
 */
export const CaptikCardPreview: React.FC<{
  template: CaptionTemplateSpec;
  showVideoOnHover?: boolean;
}> = ({ template }) => {
  const id = template.id;
  const look = template.lookSpec;

  if (id === 'captik_glow') {
    return (
      <div style={{ textAlign: 'center', fontFamily: 'Inter, sans-serif', lineHeight: 1 }}>
        <div
          style={{
            color: 'rgba(255,255,255,0.45)',
            fontSize: 10,
            fontWeight: 500,
            marginBottom: 3,
            textShadow: '0 0 8px rgba(160,216,62,0.2)',
          }}
        >
          the quick
        </div>
        <div
          style={{
            color: '#a0d83e',
            fontWeight: 800,
            fontSize: 25,
            textTransform: 'uppercase',
            textShadow:
              '0 0 4px #a0d83e, 0 0 16px rgba(160,216,62,0.8), 0 0 32px rgba(160,216,62,0.45)',
          }}
        >
          BROWN
        </div>
        <div
          style={{
            color: 'rgba(255,255,255,0.45)',
            fontSize: 10,
            fontWeight: 500,
            marginTop: 3,
            textShadow: '0 0 8px rgba(160,216,62,0.2)',
          }}
        >
          fox jumps
        </div>
      </div>
    );
  }

  if (id === 'ali_abdaal') {
    return (
      <div
        style={{
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 10,
          padding: '6px 10px',
          display: 'inline-flex',
          gap: 5,
          alignItems: 'center',
          fontFamily: 'Poppins, sans-serif',
        }}
      >
        <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 500, fontSize: 12 }}>the</span>
        <span
          style={{
            color: '#000',
            fontWeight: 800,
            fontSize: 13,
            background: '#ffffff',
            padding: '1px 6px',
            borderRadius: 5,
          }}
        >
          quick
        </span>
        <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 500, fontSize: 12 }}>fox</span>
      </div>
    );
  }

  if (id === 'captik_shadow') {
    const dimGrad: React.CSSProperties = {
      backgroundImage: 'linear-gradient(to bottom,rgba(255,255,255,0.38),rgba(110,110,110,0.38))',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    };
    return (
      <div style={{ textAlign: 'center', fontFamily: 'Inter, sans-serif', lineHeight: 1 }}>
        <div style={{ ...dimGrad, fontSize: 10, marginBottom: 3 }}>the quick</div>
        <div
          style={{
            backgroundImage: 'linear-gradient(to bottom,#ffffff 0%,#ffffff 40%,#848484 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontWeight: 800,
            fontSize: 26,
          }}
        >
          BROWN
        </div>
        <div style={{ ...dimGrad, fontSize: 10, marginTop: 3 }}>fox jumps</div>
      </div>
    );
  }

  if (id === 'captik') {
    return (
      <div style={{ textAlign: 'center', fontFamily: 'Inter, sans-serif', lineHeight: 1 }}>
        <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: 500, marginBottom: 3 }}>
          the quick
        </div>
        <div style={{ color: '#C8FF00', fontWeight: 900, fontSize: 26, lineHeight: 1, textTransform: 'uppercase' }}>
          BROWN
        </div>
        <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: 500, marginTop: 3 }}>
          fox jumps
        </div>
      </div>
    );
  }

  if (id === 'clean_motion') {
    return (
      <div style={{ fontFamily: 'Inter, sans-serif', textAlign: 'center' }}>
        <div style={{ color: '#ffffff', fontWeight: 600, fontSize: 20, letterSpacing: '-0.01em' }}>brown</div>
        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, marginTop: 2 }}>one word at a time</div>
      </div>
    );
  }

  if (id === 'bubble') {
    return (
      <div
        style={{
          display: 'flex',
          gap: 5,
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: '"Times New Roman", serif',
        }}
      >
        <span style={{ color: '#ffffff', fontWeight: 600, fontSize: 13 }}>the</span>
        <span
          style={{
            background: '#48A680',
            color: '#000',
            fontWeight: 700,
            fontSize: 13,
            padding: '2px 8px',
            borderRadius: 7,
          }}
        >
          quick
        </span>
        <span style={{ color: '#ffffff', fontWeight: 600, fontSize: 13 }}>fox</span>
      </div>
    );
  }

  if (id === 'hormozi') {
    const st: React.CSSProperties = {
      backgroundImage: 'linear-gradient(to bottom,#77a748 0%,#97DE25 35%,#a5fd4b 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      fontFamily: 'Anton, sans-serif',
      fontWeight: 700,
      textTransform: 'uppercase',
    };
    return (
      <div style={{ display: 'flex', gap: 5, alignItems: 'baseline', justifyContent: 'center' }}>
        <span style={{ ...st, fontSize: 12 }}>THE</span>
        <span style={{ ...st, fontSize: 27 }}>BROWN</span>
        <span style={{ ...st, fontSize: 12 }}>FOX</span>
      </div>
    );
  }

  if (id === 'boxed') {
    return (
      <div style={{ textAlign: 'center', fontFamily: 'Inter, sans-serif', lineHeight: 1 }}>
        <div style={{ color: 'rgba(255,255,255,0.22)', fontSize: 9, marginBottom: 4 }}>the quick</div>
        <div style={{ background: '#f48601', borderRadius: 4, padding: '4px 16px', display: 'inline-block' }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 19, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            BROWN
          </span>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.22)', fontSize: 9, marginTop: 4 }}>fox jumps</div>
      </div>
    );
  }

  if (id === 'mrbeast') {
    const sh = '-2px -2px 0 #000,2px -2px 0 #000,-2px 2px 0 #000,2px 2px 0 #000';
    return (
      <div style={{ display: 'flex', gap: 5, alignItems: 'baseline', justifyContent: 'center' }}>
        <span
          style={{
            fontFamily: '"Luckiest Guy", cursive',
            color: '#fff',
            fontWeight: 900,
            fontSize: 12,
            textTransform: 'uppercase',
            textShadow: sh,
          }}
        >
          THE
        </span>
        <span
          style={{
            fontFamily: '"Luckiest Guy", cursive',
            color: '#FFD700',
            fontWeight: 900,
            fontSize: 24,
            textTransform: 'uppercase',
            textShadow: sh,
          }}
        >
          BROWN
        </span>
        <span
          style={{
            fontFamily: '"Luckiest Guy", cursive',
            color: '#fff',
            fontWeight: 900,
            fontSize: 12,
            textTransform: 'uppercase',
            textShadow: sh,
          }}
        >
          FOX
        </span>
      </div>
    );
  }

  if (id === 'mr_beast_2') {
    return (
      <div style={{ display: 'flex', gap: 5, alignItems: 'baseline', justifyContent: 'center' }}>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>
          THE
        </span>
        <span
          style={{
            color: '#FFD700',
            fontWeight: 900,
            fontSize: 23,
            textTransform: 'uppercase',
            fontFamily: 'Montserrat, sans-serif',
            textShadow: '0 4px 12px rgba(0,0,0,0.9)',
          }}
        >
          BROWN
        </span>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>
          FOX
        </span>
      </div>
    );
  }

  if (id === 'iman_gadzhi') {
    return (
      <div style={{ textAlign: 'center', fontFamily: 'Montserrat, sans-serif' }}>
        <div style={{ color: '#ffffff', fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          THE QUICK
        </div>
        <div style={{ color: '#ffffff', fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 4 }}>
          BROWN FOX
        </div>
      </div>
    );
  }

  if (id === 'prism') {
    return (
      <div style={{ display: 'flex', gap: 5, alignItems: 'baseline', justifyContent: 'center', fontFamily: 'Montserrat, sans-serif' }}>
        <span style={{ color: 'rgba(163,78,255,0.35)', fontWeight: 700, fontSize: 13, textTransform: 'uppercase' }}>THE</span>
        <span style={{ color: '#A34EFF', fontWeight: 700, fontSize: 23, textTransform: 'uppercase', letterSpacing: '0.03em' }}>BROWN</span>
        <span style={{ color: 'rgba(163,78,255,0.35)', fontWeight: 700, fontSize: 13, textTransform: 'uppercase' }}>FOX</span>
      </div>
    );
  }

  if (id === 'highlighted_word') {
    return (
      <div style={{ display: 'flex', gap: 5, alignItems: 'baseline', justifyContent: 'center', fontFamily: 'Montserrat, sans-serif' }}>
        <span style={{ color: '#ffffff', fontWeight: 600, fontSize: 14 }}>the</span>
        <span style={{ color: '#F5A623', fontWeight: 700, fontSize: 19 }}>quick</span>
        <span style={{ color: '#ffffff', fontWeight: 600, fontSize: 14 }}>fox</span>
      </div>
    );
  }

  if (id === 'clean_glow') {
    return (
      <div style={{ textAlign: 'center', fontFamily: 'Inter, sans-serif', lineHeight: 1.1 }}>
        <div style={{ color: '#ffffff', fontWeight: 400, fontSize: 14, textShadow: '0 0 16px rgba(255,255,255,0.95), 0 0 6px rgba(255,255,255,0.7)' }}>
          the quick brown fox
        </div>
        <div style={{ color: '#ffffff', fontWeight: 400, fontSize: 14, textShadow: '0 0 16px rgba(255,255,255,0.95), 0 0 6px rgba(255,255,255,0.7)', marginTop: 4 }}>
          jumps over
        </div>
      </div>
    );
  }

  if (id === 'captik_clean') {
    return (
      <div style={{ textAlign: 'center', fontFamily: 'Inter, sans-serif', lineHeight: 1.1 }}>
        <div style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 400, fontSize: 14 }}>the quick brown fox</div>
        <div style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 400, fontSize: 14, marginTop: 4 }}>jumps over</div>
      </div>
    );
  }

  if (id === 'black_punch') {
    return (
      <div
        style={{
          textAlign: 'center',
          fontFamily: 'Anton, sans-serif',
          lineHeight: 1,
          background: '#c2c2c2',
          padding: '6px 14px',
          borderRadius: 6,
        }}
      >
        <div style={{ color: 'rgba(0,0,0,0.35)', fontSize: 9, marginBottom: 4 }}>the quick</div>
        <div style={{ color: '#000', fontWeight: 700, fontSize: 24, textTransform: 'uppercase' }}>BROWN</div>
        <div style={{ color: 'rgba(0,0,0,0.35)', fontSize: 9, marginTop: 4 }}>fox jumps</div>
      </div>
    );
  }

  if (id === 'captik_word') {
    return (
      <div style={{ display: 'flex', gap: 5, alignItems: 'baseline', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
        <span style={{ color: '#ffffff', fontWeight: 600, fontSize: 15 }}>the</span>
        <span style={{ color: '#ffffff', fontWeight: 600, fontSize: 15 }}>quick</span>
        <span style={{ color: 'rgba(255,255,255,0.18)', fontWeight: 600, fontSize: 15 }}>brown</span>
      </div>
    );
  }

  if (id === 'pixelated') {
    return (
      <div style={{ textAlign: 'center', fontFamily: '"Press Start 2P", monospace', lineHeight: 1 }}>
        <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 8, letterSpacing: '0.14em', marginBottom: 6 }}>
          THE_QUICK
        </div>
        <div style={{ color: '#ffffff', fontWeight: 400, fontSize: 16, letterSpacing: '0.06em' }}>BROWN</div>
      </div>
    );
  }

  if (id === 'liquid_glass') {
    return (
      <div
        style={{
          background: 'rgba(255,255,255,0.16)',
          border: '1px solid rgba(255,255,255,0.28)',
          borderRadius: 50,
          padding: '5px 14px',
          display: 'inline-flex',
          gap: 5,
          backdropFilter: 'blur(10px)',
          fontFamily: 'Montserrat, sans-serif',
        }}
      >
        <span style={{ color: '#857e6e', fontWeight: 300, fontSize: 12 }}>the</span>
        <span style={{ color: 'rgba(255,255,255,0.95)', fontWeight: 400, fontSize: 12 }}>quick</span>
        <span style={{ color: '#857e6e', fontWeight: 300, fontSize: 12 }}>fox</span>
      </div>
    );
  }

  if (id === 'tabahi') {
    const sh = '-2px -2px 0 #000,2px -2px 0 #000,-2px 2px 0 #000,2px 2px 0 #000';
    return (
      <div style={{ textAlign: 'center', lineHeight: 1 }}>
        <div
          style={{
            color: '#fff',
            fontWeight: 900,
            fontSize: 19,
            textTransform: 'uppercase',
            WebkitTextStroke: '0.066em black',
            textShadow: sh,
            fontFamily: '"Bungee", cursive',
          }}
        >
          THE QUICK
        </div>
        <div
          style={{
            color: '#fff',
            fontWeight: 900,
            fontSize: 14,
            textTransform: 'uppercase',
            WebkitTextStroke: '0.066em black',
            textShadow: sh,
            fontFamily: '"Bungee", cursive',
            opacity: 0.72,
            marginTop: 5,
          }}
        >
          BROWN FOX
        </div>
      </div>
    );
  }

  if (id === 'deep_glow') {
    return (
      <div style={{ textAlign: 'center', lineHeight: 1 }}>
        <div
          style={{
            color: '#FF00FF',
            fontWeight: 900,
            fontSize: 21,
            textTransform: 'uppercase',
            textShadow: '0 0 10px #FF00FF, 0 0 24px #FF00FF, 0 0 42px #FF00FF',
            fontFamily: 'Anton, Impact, sans-serif',
            letterSpacing: '0.03em',
          }}
        >
          BROWN FOX
        </div>
        <div
          style={{
            color: '#FF00FF',
            fontWeight: 900,
            fontSize: 13,
            textTransform: 'uppercase',
            textShadow: '0 0 8px rgba(255,0,255,0.55)',
            fontFamily: 'Anton, Impact, sans-serif',
            opacity: 0.42,
            marginTop: 5,
          }}
        >
          JUMPS OVER
        </div>
      </div>
    );
  }

  if (id === 'seedha_saadha') {
    const sh = '-3px -3px 0 #000,3px -3px 0 #000,-3px 3px 0 #000,3px 3px 0 #000';
    return (
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            color: '#fff',
            fontWeight: 900,
            fontSize: 28,
            textTransform: 'uppercase',
            WebkitTextStroke: '0.085em black',
            textShadow: sh,
            fontFamily: 'Rubik, sans-serif',
            lineHeight: 1,
          }}
        >
          BROWN
        </div>
      </div>
    );
  }

  if (id === 'thora_cinematic') {
    return (
      <div style={{ textAlign: 'center', fontFamily: 'Montserrat, sans-serif', lineHeight: 1 }}>
        <div
          style={{
            color: 'rgba(255,255,255,0.25)',
            fontSize: 8,
            letterSpacing: '0.38em',
            textTransform: 'uppercase',
            marginBottom: 6,
          }}
        >
          THE QUICK
        </div>
        <div
          style={{
            color: '#ffffff',
            fontWeight: 600,
            fontSize: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.34em',
          }}
        >
          BROWN FOX
        </div>
      </div>
    );
  }

  if (id === 'delhi') {
    return (
      <div style={{ display: 'flex', gap: 5, alignItems: 'baseline', justifyContent: 'center' }}>
        <span style={{ fontFamily: '"Instrument Sans", sans-serif', color: '#ffffff', fontWeight: 400, fontSize: 14 }}>
          the
        </span>
        <span
          style={{
            fontFamily: '"Instrument Serif", serif',
            color: '#ffffff',
            fontWeight: 400,
            fontSize: 19,
            fontStyle: 'italic',
            textShadow: '0 0 16px rgba(255,255,255,0.75)',
          }}
        >
          quick
        </span>
        <span style={{ fontFamily: '"Instrument Sans", sans-serif', color: '#ffffff', fontWeight: 400, fontSize: 14 }}>
          fox
        </span>
      </div>
    );
  }

  if (id === 'illusion') {
    return (
      <div
        style={{
          fontFamily: 'Inter, sans-serif',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          width: 'max-content',
        }}
      >
        <div style={{ color: '#ffffff', fontWeight: 700, fontSize: 9.5, lineHeight: 1, textAlign: 'center' }}>
          he had rented the
        </div>
        <div style={{ color: '#ffffff', fontWeight: 900, fontSize: 25, lineHeight: 0.85, textAlign: 'center' }}>
          Biggest
        </div>
        <div style={{ color: '#ffffff', fontWeight: 700, fontSize: 9.5, lineHeight: 1, textAlign: 'center' }}>
          apartment in town
        </div>
      </div>
    );
  }

  if (id === 'editor_masala') {
    return (
      <div
        style={{
          fontFamily: 'Montserrat, sans-serif',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1,
          width: 'max-content',
          lineHeight: 0.8,
        }}
      >
        <div style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 700, fontSize: 11, lineHeight: 0.9, textAlign: 'center' }}>
          trust the
        </div>
        <div
          style={{
            color: '#FFD700',
            fontWeight: 900,
            fontSize: 28,
            lineHeight: 0.85,
            textAlign: 'center',
            textShadow: '0 0 12px rgba(255,215,0,0.35)',
          }}
        >
          PROCESS
        </div>
      </div>
    );
  }

  if (id === 'aura') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 0.82, padding: '4px' }}>
        <span
          style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontStyle: 'italic',
            fontWeight: 600,
            fontSize: 26,
            color: '#ffffff',
          }}
        >
          forget
        </span>
        <span
          style={{
            fontFamily: 'Anton, sans-serif',
            fontWeight: 900,
            fontSize: 20,
            color: '#7fd3ff',
            textTransform: 'uppercase',
            letterSpacing: '0.01em',
            marginTop: -2,
          }}
        >
          STATUS
        </span>
      </div>
    );
  }

  if (id === 'aura_helvetica') {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          lineHeight: 0.82,
          padding: '4px',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <span style={{ fontWeight: 900, fontSize: 25, color: '#ffffff', letterSpacing: '-0.04em' }}>focus</span>
        <span
          style={{
            fontWeight: 900,
            fontSize: 20,
            color: '#F5D300',
            textTransform: 'uppercase',
            letterSpacing: '-0.02em',
            marginTop: -2,
          }}
        >
          DEEPLY
        </span>
      </div>
    );
  }

  if (id === 'big_reveal') {
    return (
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: 'max-content',
          lineHeight: 0.85,
        }}
      >
        <span
          style={{
            fontFamily: 'Anton, sans-serif',
            fontWeight: 900,
            fontSize: 26,
            color: '#FFE800',
            textTransform: 'uppercase',
            letterSpacing: '-0.01em',
          }}
        >
          HELLO
        </span>
        <div
          style={{
            position: 'absolute',
            top: 15,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: '#2b2b2b',
          }}
        />
        <span
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 700,
            fontSize: 10.5,
            color: '#ffffff',
            marginTop: 6,
            position: 'relative',
          }}
        >
          guys.
        </span>
      </div>
    );
  }

  if (id === 'big_red') {
    return (
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 'max-content',
          padding: '8px 2px',
          fontFamily: '"Playfair Display", "Times New Roman", serif',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            fontWeight: 700,
            fontSize: 28,
            lineHeight: 1,
            textTransform: 'uppercase',
            transform: 'scaleY(1.35)',
            backgroundImage: 'linear-gradient(90deg,#C9302F 0%,#D53E3E 18%,#E68C8C 50%,#D53E3E 82%,#C9302F 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            color: 'transparent',
            filter: 'drop-shadow(0 0 5px rgba(150,15,15,0.55))',
          }}
        >
          SECOND
        </span>
        <span
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%,-50%)',
            fontWeight: 700,
            fontSize: 11,
            color: '#ffffff',
            whiteSpace: 'nowrap',
          }}
        >
          the quick fox
        </span>
      </div>
    );
  }

  if (id === 'scribble') {
    return (
      <div
        style={{
          display: 'flex',
          gap: 6,
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: '"Caveat", cursive',
          fontWeight: 700,
          padding: '4px 2px',
        }}
      >
        <span style={{ color: '#FDFAF3', fontSize: 14, display: 'inline-block', transform: 'rotate(-2deg)' }}>the</span>
        <span style={{ position: 'relative', display: 'inline-block', transform: 'rotate(1.5deg)' }}>
          <span
            aria-hidden
            style={{
              position: 'absolute',
              top: '6%',
              bottom: '-2%',
              left: '-6%',
              right: '-8%',
              background: 'linear-gradient(94deg, rgba(255,224,66,0.94) 0%, rgba(255,214,40,0.86) 55%, rgba(255,228,90,0.92) 100%)',
              borderRadius: '8px 14px 10px 12px / 14px 8px 13px 9px',
              transform: 'skewX(-5deg)',
            }}
          />
          <span style={{ position: 'relative', color: '#241C12', fontSize: 19 }}>little</span>
        </span>
        <span style={{ position: 'relative', display: 'inline-block', transform: 'rotate(-1deg)' }}>
          <span style={{ color: '#FDFAF3', fontSize: 14 }}>things</span>
          <svg
            viewBox="0 0 100 60"
            preserveAspectRatio="none"
            style={{ position: 'absolute', top: '-16%', left: '-12%', width: '124%', height: '132%', overflow: 'visible' }}
          >
            <ellipse
              cx={50}
              cy={30}
              rx={46}
              ry={25}
              fill="none"
              stroke="#FF5A36"
              strokeWidth={4}
              strokeLinecap="round"
            />
          </svg>
        </span>
      </div>
    );
  }

  if (id === 'archives') {
    return (
      <div
        style={{
          display: 'flex',
          gap: 5,
          alignItems: 'baseline',
          justifyContent: 'center',
          fontFamily: '"Kaushan Script", cursive',
          fontWeight: 400,
          padding: '6px 2px 10px',
        }}
      >
        <span style={{ color: '#E1CDC2', fontSize: 13 }}>Your</span>
        <span style={{ position: 'relative', display: 'inline-block', color: '#E1CDC2', fontSize: 18 }}>
          <span style={{ position: 'relative', zIndex: 2 }}>Style</span>
          <svg
            viewBox="0 0 100 14"
            preserveAspectRatio="none"
            style={{ position: 'absolute', left: '-8%', bottom: '-30%', width: '116%', height: '28%', overflow: 'visible' }}
          >
            <path d="M2,7 Q26,3 50,8 T97,6" fill="none" stroke="#E1CDC2" strokeWidth={2.6} strokeLinecap="round" />
            <path
              d="M3,11 Q28,7 52,12 T96,10"
              fill="none"
              stroke="#E1CDC2"
              strokeWidth={1.6}
              strokeLinecap="round"
              opacity={0.6}
            />
          </svg>
        </span>
        <span style={{ color: '#E1CDC2', fontSize: 13 }}>is it</span>
      </div>
    );
  }

  if (id === 'blockbuster') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px 2px 10px' }}>
        <div
          style={{
            fontFamily: 'Anton, sans-serif',
            fontWeight: 700,
            textTransform: 'uppercase',
            fontSize: 15,
            lineHeight: 1,
            letterSpacing: '.035em',
            color: '#FA232D',
            transform: 'scaleX(.885)',
            textShadow: '0 0 5px rgba(250,35,45,.45),0 0 11px rgba(250,35,45,.42),0 0 20px rgba(250,35,45,.26)',
          }}
        >
          THIS IS THE NEXT
        </div>
        <div
          style={{
            fontFamily: '"Great Vibes", cursive',
            fontWeight: 400,
            fontSize: 21,
            lineHeight: 1,
            letterSpacing: '.02em',
            color: '#fff',
            marginTop: -6,
            zIndex: 2,
            textShadow: '0 0 6px rgba(255,255,255,.6),0 2px 4px rgba(0,0,0,.68)',
          }}
        >
          big thing
        </div>
      </div>
    );
  }

  if (id === 'journal') {
    return (
      <div
        style={{
          fontFamily: '"Caveat", cursive',
          fontSize: 24,
          lineHeight: 1.1,
          color: '#fff',
          textShadow: '0 1.2px 5px rgba(0,0,0,.5)',
          whiteSpace: 'nowrap',
          display: 'flex',
          gap: 6,
          alignItems: 'baseline',
        }}
      >
        <span style={{ filter: 'blur(2px)', opacity: 0.55, transform: 'scale(.96)' }}>Back</span>
        <span>to</span>
        <span style={{ color: '#E8202A' }}>routine</span>
      </div>
    );
  }

  if (id === 'interlock') {
    const capStyle: React.CSSProperties = {
      position: 'absolute',
      fontFamily: 'Montserrat, sans-serif',
      fontWeight: 600,
      fontSize: 9.5,
      letterSpacing: '.045em',
      color: '#F7F4EE',
      whiteSpace: 'pre',
      lineHeight: 1,
    };
    return (
      <div style={{ position: 'relative', width: 145, height: 48 }}>
        <div
          style={{
            position: 'absolute',
            left: 12,
            top: 2,
            fontFamily: '"Playfair Display", Georgia, serif',
            fontStyle: 'italic',
            fontWeight: 500,
            fontSize: 38,
            lineHeight: 1,
            color: '#F7F4EE',
            whiteSpace: 'pre',
          }}
        >
          straight
        </div>
        <span style={{ ...capStyle, left: 0, top: 0 }}>I</span>
        <span style={{ ...capStyle, left: 9, top: 0 }}>CAN&apos;T</span>
        <span style={{ ...capStyle, left: 46, top: 0 }}>DRAW</span>
        <span style={{ ...capStyle, left: 94, top: 0 }}>A</span>
        <span style={{ ...capStyle, left: 116, top: 38 }}>LINE</span>
      </div>
    );
  }

  // Authentic LOOK_SPECS preview renderers from 0ns2lbwew3o6..js
  if (look) {
    // 1. Impact Behind-You looks (Beacon, Cove, Driftwood, Ellis, Ferrier, Garnet, Ibis, Jetty, Keel, Mullion, etc.)
    if (look.impact) {
      const imp = look.impact;
      const word = imp.uppercase ? 'QUICK' : 'quick';
      const heroColor = imp.chip
        ? imp.color ?? '#121212'
        : imp.litColor ?? imp.color ?? look.accent ?? '#ffffff';
      const impSize = Number.isFinite(imp.sizePx) && imp.sizePx > 0 ? imp.sizePx : 54;
      return (
        <div style={{ textAlign: 'center', lineHeight: 1 }}>
          <div
            style={{
              display: 'inline-block',
              fontFamily: imp.font,
              fontWeight: imp.weight ?? 400,
              fontSize: Math.min(28, Math.max(18, Math.round(impSize * 0.34))),
              lineHeight: 1.05,
              color: heroColor,
              fontStyle: imp.italic ? 'italic' : 'normal',
              letterSpacing: imp.letterSpacingEm ? `${imp.letterSpacingEm}em` : undefined,
              ...(imp.chip
                ? { background: imp.chip.bg, borderRadius: '0.12em', padding: '0.06em 0.2em' }
                : imp.litColor
                ? { background: `${imp.litColor}38`, borderRadius: '0.13em', padding: '0.04em 0.16em' }
                : { textShadow: '0 2px 8px rgba(0,0,0,0.65)' }),
            }}
          >
            {word}
          </div>
          <div
            style={{
              marginTop: 5,
              display: 'flex',
              gap: '0.35em',
              justifyContent: 'center',
              alignItems: 'baseline',
              fontFamily: look.font,
              fontWeight: look.weight,
              fontSize: 10.5,
              color: look.color ?? '#ffffff',
              textTransform: look.transform,
            }}
          >
            <span>the</span>
            <span style={{ color: look.accent ?? '#ffffff' }}>brown</span>
            <span>fox</span>
          </div>
        </div>
      );
    }

    // 2. Property Reels (story === 'reel' | 'agent')
    if (look.family === 'story') {
      const accent = look.accent ?? '#EC00B5';
      const heroFont = look.accentFont ?? look.font;
      if (look.story === 'agent') {
        return (
          <div style={{ textAlign: 'center', lineHeight: 1 }}>
            <div style={{ fontFamily: heroFont, fontWeight: 700, fontSize: 22, color: accent, letterSpacing: '-0.02em' }}>
              ASKING
            </div>
            <div
              style={{
                fontFamily: heroFont,
                fontWeight: 700,
                fontSize: 17,
                marginTop: 2,
                color: 'transparent',
                WebkitTextStroke: '1px #ffffff',
              }}
            >
              $600,000
            </div>
            <div style={{ fontFamily: look.font, fontSize: 9.5, color: '#ffffff', marginTop: 4 }}>
              the asking price is
            </div>
          </div>
        );
      }
      if (look.reel === 'reach-counter') {
        return (
          <div style={{ textAlign: 'center', lineHeight: 1 }}>
            <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 800,
                  fontSize: 28,
                  backgroundImage: `linear-gradient(180deg,#D457DF 0%,${accent} 48%,#792CA4 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                1.8
              </span>
              <span style={{ fontFamily: heroFont, fontWeight: 700, fontSize: 12, color: '#ffffff' }}>MILLION</span>
            </div>
            <div style={{ fontFamily: look.font, fontSize: 9.5, color: '#ffffff', marginTop: 4 }}>views in 30 days</div>
          </div>
        );
      }
      const rt = look.reelTheme;
      const g0 = rt?.gradient?.[0] ?? accent;
      const g1 = rt?.gradient?.[1] ?? accent;
      const g2 = rt?.gradient?.[2] ?? '#ffffff';
      const isHollow = rt?.heroInk === 'hollow';
      return (
        <div style={{ textAlign: 'center', lineHeight: 1 }}>
          <div
            style={{
              display: 'inline-block',
              fontFamily: heroFont,
              fontWeight: rt?.heroWeight ?? 800,
              fontSize: 25,
              letterSpacing: '-0.02em',
              transform: 'perspective(150px) rotateY(-24deg) skewY(-3deg)',
              ...(isHollow
                ? { color: 'transparent', WebkitTextStroke: `1.2px ${g1}` }
                : {
                    backgroundImage: `linear-gradient(170deg, ${g0}, ${g1} 55%, ${g2})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }),
            }}
          >
            {rt && !rt.heroUpper ? 'Story' : 'STORY'}
          </div>
          <div
            style={{
              fontFamily: look.font,
              fontWeight: rt?.supportWeight ?? 600,
              fontSize: 9.5,
              color: rt?.supportColor ?? '#ffffff',
              textTransform: rt?.supportUpper ? 'uppercase' : undefined,
              marginTop: 4,
            }}
          >
            the difference is often
          </div>
        </div>
      );
    }

    // 3. Spatial Around-You looks (look_oriel .. look_lath)
    if (look.family === 'spatial') {
      const c = look.spatialTheme?.caption;
      const baseColor = c?.color ?? look.color ?? '#ffffff';
      const accColor = c?.accent ?? look.accent ?? '#FFE500';
      if (look.spatial === 'red') {
        return (
          <div style={{ textAlign: 'left', lineHeight: 0.95 }}>
            <div style={{ fontFamily: look.font, fontWeight: look.weight, fontSize: 9.5, color: baseColor }}>
              you only
            </div>
            <div
              style={{
                fontFamily: look.accentFont ?? look.font,
                fontWeight: look.weight,
                fontSize: 25,
                color: accColor,
                textTransform: 'uppercase',
              }}
            >
              NEED
            </div>
            <div style={{ fontFamily: look.font, fontWeight: look.weight, fontSize: 9.5, color: baseColor, textAlign: 'right' }}>
              one shot
            </div>
          </div>
        );
      }
      if (look.spatial === 'yellow') {
        return (
          <div style={{ lineHeight: 0.92, transform: 'perspective(160px) rotateY(16deg)' }}>
            <div style={{ fontFamily: look.font, fontWeight: look.weight, fontSize: 12, color: baseColor }}>
              it builds
            </div>
            <div
              style={{
                fontFamily: look.font,
                fontWeight: 900,
                fontSize: 21,
                color: accColor,
                textShadow: `0 0 8px ${accColor}AA`,
              }}
            >
              AROUND
            </div>
            <div style={{ fontFamily: look.font, fontWeight: look.weight, fontSize: 12, color: baseColor }}>
              your head
            </div>
          </div>
        );
      }
      return (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, alignItems: 'flex-end', lineHeight: 1 }}>
          <span
            style={{
              fontFamily: look.font,
              fontWeight: look.weight,
              fontSize: 11,
              color: baseColor,
              transform: 'rotate(-14deg) translateY(3px)',
            }}
          >
            words
          </span>
          <span
            style={{
              fontFamily: look.font,
              fontWeight: look.weight,
              fontSize: 20,
              color: accColor,
              textTransform: look.transform,
            }}
          >
            above
          </span>
          <span
            style={{
              fontFamily: look.font,
              fontWeight: look.weight,
              fontSize: 11,
              color: baseColor,
              transform: 'rotate(14deg) translateY(3px)',
            }}
          >
            you
          </span>
        </div>
      );
    }

    // 4. Stack looks (look_belfry, look_abbey, look_scupper)
    if (look.family === 'stack') {
      const rawRoles: any = look.stack?.roles;
      return (
        <div style={{ textAlign: 'center', lineHeight: 1.02 }}>
          {['the quick', 'brown', 'fox jumps'].map((txt, idx) => {
            const isHero = idx === 1;
            const role = Array.isArray(rawRoles)
              ? rawRoles.find((r: any) => r.tier === (isHero ? 2 : 0))
              : isHero
              ? rawRoles?.pop ?? rawRoles?.hero
              : rawRoles?.lead ?? rawRoles?.support;
            return (
              <div
                key={idx}
                style={{
                  fontFamily: role?.font ?? (isHero ? look.accentFont ?? look.font : look.font),
                  fontWeight: role?.weight ?? (isHero ? look.accentWeight ?? look.weight : look.weight),
                  fontStyle: role?.italic || (isHero && look.accentItalic) ? 'italic' : 'normal',
                  fontSize: isHero ? 22 : 11,
                  color: role?.color ?? (isHero ? look.accent ?? '#ffffff' : look.color ?? '#ffffff'),
                  textTransform: role?.uppercase || look.transform === 'uppercase' ? 'uppercase' : undefined,
                  ...(role?.chip
                    ? {
                        background: role.chip.bg,
                        padding: '1px 6px',
                        borderRadius: 4,
                        display: 'inline-block',
                      }
                    : {}),
                }}
              >
                {txt}
              </div>
            );
          })}
        </div>
      );
    }

    // 5. Emphasis / Curve / Behind looks (look_cloister, look_dovecote, look_effigy, look_hawser, etc.)
    const baseTextColor = look.color ?? '#ffffff';
    const accentTextColor = look.accent ?? '#FFE500';
    return (
      <div style={{ textAlign: 'center', lineHeight: 1.08 }}>
        <div
          style={{
            fontFamily: look.font,
            fontWeight: look.weight,
            fontSize: 10.5,
            color: baseTextColor,
            opacity: look.restOpacity ?? 0.85,
            textTransform: look.transform,
          }}
        >
          the quick
        </div>
        <div
          style={{
            fontFamily: look.accentFont ?? look.font,
            fontWeight: look.accentWeight ?? look.weight,
            fontStyle: look.accentItalic ? 'italic' : 'normal',
            fontSize: 22,
            color: look.chip ? baseTextColor : accentTextColor,
            textTransform: look.accentUppercase || look.transform === 'uppercase' ? 'uppercase' : undefined,
            display: 'inline-block',
            marginTop: 2,
            ...(look.chip
              ? {
                  background: look.chip.bg,
                  padding: '1px 8px',
                  borderRadius: `${look.chip.radiusEm ?? 0.18}em`,
                }
              : {}),
            ...(look.stroke ? { WebkitTextStroke: `${look.stroke.px}px ${look.stroke.color}` } : {}),
            textShadow: buildLookShadow(look, accentTextColor),
          }}
        >
          brown
        </div>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', fontFamily: template.fontFamily }}>
      <span style={{ color: template.emphasisColor, fontWeight: template.fontWeight, fontSize: 18 }}>
        {template.name}
      </span>
    </div>
  );
};

/**
 * 2. AUTHENTIC CAPTIK LIVE STAGE RENDERER (Ported from 0ca-mzhmvo36a.js)
 * Renders both the "behind" layer (behind speaker cutout) and "front" layer (foreground captions).
 */
export const CaptikCanvasCaptionOverlay: React.FC<{
  layer: 'behind' | 'front';
  template: CaptionTemplateSpec;
  words: WordToken[];
  activeWordIndex: number;
  currentTimeSec: number;
  fontScale: number;
  captionXPercent: number;
  captionYPercent: number;
  customFontFamily?: string;
  customTextColor?: string;
  customAccentColor?: string;
  personaMode?: 'auto' | 'A' | 'B';
  onWordClick?: (word: WordToken) => void;
}> = ({
  layer,
  template,
  words,
  activeWordIndex,
  currentTimeSec,
  fontScale,
  captionXPercent,
  captionYPercent,
  customFontFamily,
  customTextColor,
  customAccentColor,
  personaMode = 'auto',
  onWordClick,
}) => {
  if (!words || words.length === 0) return null;

  const id = template.id;
  const look = template.lookSpec;
  const heroIdx = getHeroIndex(words);
  const heroWord = words[heroIdx] ?? words[0];
  const preWords = words.slice(0, heroIdx);
  const postWords = words.slice(heroIdx + 1);
  const safeFontScale = Number.isFinite(fontScale) && fontScale > 0 ? fontScale : 1;
  const sz = (px: number | undefined, fallback = 18): number => {
    const raw = Number.isFinite(px) && (px as number) > 0 ? (px as number) : fallback;
    const computed = Math.round(raw * safeFontScale);
    return Number.isFinite(computed) && computed >= 9 ? computed : Math.max(9, fallback);
  };

  const userText = customTextColor || template.textColor;
  const userAccent = customAccentColor || template.emphasisColor;
  const overrideFont = (defaultFont: string) => customFontFamily || defaultFont;

  // ============================================================================
  // LAYER 1: BEHIND THE SPEAKER ("behind")
  // ============================================================================
  if (layer === 'behind') {
    // 1A. Classic `big_reveal` behind-head giant #FFE800 Anton word
    if (id === 'big_reveal') {
      return (
        <div
          data-caption-content="emph"
          style={{
            position: 'absolute',
            top: '23%',
            left: '50%',
            width: '90%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 12,
          }}
        >
          <span
            style={{
              display: 'inline-block',
              fontFamily: overrideFont('Anton, "Arial Black", sans-serif'),
              fontWeight: 900,
              fontSize: sz(54),
              lineHeight: 0.95,
              textTransform: 'uppercase',
              letterSpacing: '-0.01em',
              color: customAccentColor || '#FFE800',
              textShadow: '0 8px 28px rgba(0,0,0,0.75)',
              whiteSpace: 'nowrap',
            }}
          >
            {heroWord.word.toUpperCase()}
          </span>
        </div>
      );
    }

    if (!look) return null;

    // 1B. `look.echo` (e.g. `look_effigy` repeating hollow outline echoes rising behind head)
    if (look.echo) {
      const ec = look.echo;
      const echoText = ec.uppercase ? heroWord.word.toUpperCase() : heroWord.word;
      return (
        <div
          data-caption-content="echo"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 12,
          }}
        >
          {[0, 1, 2].map((step) => (
            <div
              key={step}
              style={{
                position: 'absolute',
                top: `${ec.yPct - step * ec.stepPct}%`,
                left: '50%',
                transform: `translate(-50%, -50%) scale(${1 - step * 0.06})`,
                fontFamily: overrideFont(ec.font),
                fontWeight: ec.weight,
                fontSize: sz(Number.isFinite(ec.sizePx) ? ec.sizePx * 0.68 : 36),
                lineHeight: 1,
                color: step === 0 ? (look.accent ?? '#FFFFFF') : ec.fillColor,
                WebkitTextStroke: `${ec.strokePx}px ${ec.strokeColor}`,
                opacity: 1 - step * 0.28,
                whiteSpace: 'nowrap',
              }}
            >
              {echoText}
            </div>
          ))}
        </div>
      );
    }

    // 1C. `look.impact` (Beacon, Cove, Driftwood, Ellis, Ferrier, Garnet, Ibis, Jetty, Keel, Mullion, etc.)
    if (look.impact) {
      const imp = look.impact;
      const isHeroLit = activeWordIndex === heroIdx || activeWordIndex >= 0;
      const heroText = imp.uppercase ? heroWord.word.toUpperCase() : heroWord.word;
      const fgColor = imp.chip
        ? imp.color ?? '#121212'
        : isHeroLit && imp.litColor
        ? imp.litColor
        : customAccentColor || imp.color || look.accent || '#FFFFFF';

      return (
        <div
          data-caption-content="emph"
          style={{
            position: 'absolute',
            top: `${imp.yPct ?? 23}%`,
            left: '50%',
            transform: 'translate(-50%, -50%)',
            whiteSpace: 'nowrap',
            lineHeight: 1,
            pointerEvents: 'none',
            zIndex: 12,
          }}
        >
          <span
            data-impact=""
            style={{
              display: 'inline-block',
              position: 'relative',
              lineHeight: 1,
              fontFamily: overrideFont(imp.font),
              fontWeight: imp.weight ?? 400,
              fontSize: sz(Math.min(68, Math.max(42, (Number.isFinite(imp.sizePx) ? imp.sizePx : 54) * 0.65))),
              fontStyle: imp.italic ? 'italic' : 'normal',
              textTransform: imp.uppercase ? 'uppercase' : 'none',
              letterSpacing: imp.letterSpacingEm ? `${imp.letterSpacingEm}em` : undefined,
              color: fgColor,
              textShadow: buildLookShadow(look, fgColor),
            }}
          >
            {imp.litColor && !imp.chip && (
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  zIndex: -1,
                  inset: '-0.06em -0.14em',
                  background: hexWithAlpha(imp.litColor, imp.litAlpha ?? 0.32),
                  borderRadius: `${imp.chipPad?.radiusEm ?? 0.08}em`,
                }}
              />
            )}
            {imp.chip && (
              <span
                aria-hidden="true"
                data-plate=""
                style={{
                  position: 'absolute',
                  zIndex: -1,
                  inset: '-0.06em -0.16em',
                  background: imp.chip.bg,
                  borderRadius: `${imp.chipPad?.radiusEm ?? 0.1}em`,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
                }}
              />
            )}
            {heroText}
          </span>
        </div>
      );
    }

    // 1D. `look.wholeBehind` (e.g. `look_hawser` giant 2-row Anton behind speaker)
    if (look.wholeBehind) {
      const mid = Math.ceil(words.length / 2);
      const rows = [words.slice(0, mid), words.slice(mid)].filter((r) => r.length > 0);
      return (
        <div
          data-caption-content="whole-behind"
          style={{
            position: 'absolute',
            top: `${look.positionYPct ?? 36.7}%`,
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            pointerEvents: 'none',
            zIndex: 12,
          }}
        >
          {rows.map((r, rIdx) => (
            <div key={rIdx} style={{ display: 'flex', gap: sz(8), whiteSpace: 'nowrap' }}>
              {r.map((w) => {
                const isEmph = w.id === heroWord.id || w.emphasized;
                return (
                  <span
                    key={w.id}
                    style={{
                      fontFamily: overrideFont(look.font),
                      fontWeight: look.weight,
                      fontSize: sz(Number.isFinite(look.sizePx) ? look.sizePx * 0.88 : 22),
                      lineHeight: 0.95,
                      textTransform: look.transform ?? 'uppercase',
                      color: isEmph ? (look.accent ?? '#FF5722') : (look.color ?? '#FFFFFF'),
                      textShadow: buildLookShadow(look),
                    }}
                  >
                    {w.word}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      );
    }

    // 1E. Property Reels (`look.family === 'story'`) behind-subject architectural headline / figure
    if (look.family === 'story') {
      const rt = look.reelTheme;
      const g0 = rt?.gradient?.[0] ?? look.accent ?? '#EC00B5';
      const g1 = rt?.gradient?.[1] ?? look.accent ?? '#EC00B5';
      const g2 = rt?.gradient?.[2] ?? '#FFFFFF';
      const isHollow = rt?.heroInk === 'hollow' || rt?.figureInk === 'outline';
      return (
        <div
          data-caption-content="story-behind"
          style={{
            position: 'absolute',
            top: '25%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            pointerEvents: 'none',
            zIndex: 12,
          }}
        >
          {rt?.banner && (
            <div
              style={{
                background: rt.banner.bg,
                color: rt.banner.fg,
                fontFamily: overrideFont(look.font),
                fontWeight: 800,
                fontSize: sz(10),
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                padding: '2px 10px',
                borderRadius: rt.banner.style === 'pill' ? 999 : 4,
                marginBottom: 4,
              }}
            >
              FEATURED SPEC
            </div>
          )}
          <div
            style={{
              fontFamily: overrideFont(rt?.figureFont ?? look.accentFont ?? look.font),
              fontWeight: rt?.heroWeight ?? 800,
              fontSize: sz(52),
              lineHeight: 0.92,
              letterSpacing: '-0.02em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              ...(isHollow
                ? {
                    color: 'transparent',
                    WebkitTextStroke: `2px ${g1}`,
                    filter: `drop-shadow(0 6px 20px ${hexWithAlpha(g1, 0.5)})`,
                  }
                : {
                    backgroundImage: `linear-gradient(175deg, ${g0} 0%, ${g1} 52%, ${g2} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.65))',
                  }),
            }}
          >
            {heroWord.word.toUpperCase()}
          </div>
        </div>
      );
    }

    // 1F. Spatial Around-You looks (`look.family === 'spatial'`, e.g. `look_oriel` .. `look_lath`)
    // Places words in an arc/stair/pair layout around the speaker's head behind the cutout mask!
    if (look.family === 'spatial') {
      const st = look.spatialTheme;
      const cap = st?.caption;
      const baseColor = customTextColor || cap?.color || look.color || '#FFFFFF';
      const accColor = customAccentColor || cap?.accent || look.accent || '#FFE500';
      const layout = st?.layout ?? 'orbit';

      const anchors =
        layout === 'stair'
          ? [
              { x: 24, y: 22, rot: -4 },
              { x: 50, y: 15, rot: 0 },
              { x: 76, y: 24, rot: 4 },
              { x: 26, y: 38, rot: -2 },
            ]
          : layout === 'pairs'
          ? [
              { x: 22, y: 26, rot: -6 },
              { x: 78, y: 26, rot: 6 },
              { x: 24, y: 40, rot: -4 },
              { x: 76, y: 40, rot: 4 },
            ]
          : [
              { x: 22, y: 28, rot: -10 },
              { x: 50, y: 15, rot: 0 },
              { x: 78, y: 28, rot: 10 },
              { x: 24, y: 42, rot: -6 },
              { x: 76, y: 42, rot: 6 },
            ];

      return (
        <div
          data-caption-content="spatial-behind"
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 12 }}
        >
          {words.map((w, idx) => {
            const isHero = idx === heroIdx || w.emphasized;
            const isSpoken = idx <= activeWordIndex || activeWordIndex === -1;
            const pos = anchors[idx % anchors.length];
            const extrudeShadow =
              st?.texture === 'extruded' && cap?.extrude
                ? Array.from(
                    { length: cap.extrude.layers },
                    (_, l) =>
                      `${(l + 1) * cap.extrude!.stepPx}px ${(l + 1) * cap.extrude!.stepPx}px 0 ${cap.extrude!.color}`
                  ).join(', ')
                : st?.texture === 'puffy' && cap?.glow
                ? `0 0 8px ${cap.glow.core ?? accColor}, 0 0 18px ${cap.glow.outer ?? accColor}`
                : '0 4px 14px rgba(0,0,0,0.75)';

            return (
              <span
                key={w.id}
                onClick={() => onWordClick?.(w)}
                style={{
                  pointerEvents: 'auto',
                  cursor: 'pointer',
                  position: 'absolute',
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: `translate(-50%, -50%) rotate(${pos.rot}deg) scale(${isHero ? 1.25 : 1})`,
                  fontFamily: overrideFont(isHero ? look.accentFont ?? look.font : look.font),
                  fontWeight: isHero ? look.accentWeight ?? 800 : look.weight,
                  fontSize: sz(isHero ? 28 : 17),
                  textTransform: look.transform ?? (isHero ? 'uppercase' : 'none'),
                  color: isHero ? accColor : baseColor,
                  opacity: isSpoken ? 1 : 0.4,
                  textShadow: extrudeShadow,
                  ...(cap?.stroke ? { WebkitTextStroke: `${cap.stroke.px}px ${cap.stroke.color}` } : {}),
                  ...(isHero && cap?.chip
                    ? {
                        background: cap.chip.bg,
                        color: cap.chip.fg,
                        padding: '2px 10px',
                        borderRadius: `${cap.chip.radiusEm ?? 0.2}em`,
                      }
                    : {}),
                  whiteSpace: 'nowrap',
                }}
              >
                {w.word}
              </span>
            );
          })}
        </div>
      );
    }

    // 1G. Behind-subject Stack or Emphasis looks (`look_belfry`, `look_cloister`, `look_dovecote`, `look_gable`, `look_lintel`)
    if (look.behindSubject) {
      return (
        <div
          data-caption-content="behind-hero"
          style={{
            position: 'absolute',
            top: `${look.variety?.behindYPct ?? 27}%`,
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 12,
            whiteSpace: 'nowrap',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              fontFamily: overrideFont(look.accentFont ?? look.font),
              fontWeight: look.accentWeight ?? look.weight,
              fontStyle: look.accentItalic ? 'italic' : 'normal',
              fontSize: sz(
                Math.max(
                  44,
                  (Number.isFinite(look.sizePx) ? look.sizePx : 24) *
                    (Number.isFinite(look.accentScale) ? (look.accentScale as number) : 1.6)
                )
              ),
              lineHeight: 0.95,
              textTransform: look.accentUppercase || look.transform === 'uppercase' ? 'uppercase' : 'none',
              color: customAccentColor || look.accent || '#FFE500',
              ...(look.stroke ? { WebkitTextStroke: `${look.stroke.px}px ${look.stroke.color}` } : {}),
              textShadow: buildLookShadow(look),
            }}
          >
            {heroWord.word}
          </span>
        </div>
      );
    }

    return null;
  }

  // ============================================================================
  // LAYER 2: FOREGROUND CAPTIONS ("front")
  // ============================================================================
  const safeX = Number.isFinite(captionXPercent) ? captionXPercent : 50;
  const safeY = Number.isFinite(captionYPercent) ? captionYPercent : 76;
  const boxStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${safeX}%`,
    top: `${safeY}%`,
    width: '90%',
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    justifyContent: 'center',
    pointerEvents: 'auto',
    zIndex: 30,
  };

  // If `wholeBehind` is true (`look_hawser`), the entire caption lives in the behind layer
  if (look?.wholeBehind) {
    return null;
  }

  // ----------------------------------------------------------------------------
  // 2A. CLASSIC TEMPLATE: `editor_masala` (Diagonal 3-row lockup with Persona A / B)
  // ----------------------------------------------------------------------------
  if (id === 'editor_masala') {
    const usePersonaA =
      personaMode === 'A' ? true : personaMode === 'B' ? false : heroWord.word.length % 2 === 0;
    const heroFont = usePersonaA
      ? '"Instrument Serif", "Playfair Display", Georgia, serif'
      : 'Montserrat, sans-serif';
    const heroColor = usePersonaA ? '#FFFFFF' : customAccentColor || '#FFD700';
    const diagShift = sz(18);

    return (
      <div style={boxStyle} data-caption-content="true">
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {preWords.length > 0 && (
            <div
              style={{
                display: 'flex',
                gap: sz(4),
                marginBottom: sz(2),
                transform: `translate3d(${-diagShift}px, 0, 0)`,
                zIndex: 2,
              }}
            >
              {preWords.map((w) => (
                <span
                  key={w.id}
                  onClick={() => onWordClick?.(w)}
                  style={{
                    cursor: 'pointer',
                    fontFamily: overrideFont('Montserrat, sans-serif'),
                    fontWeight: 600,
                    fontSize: sz(15),
                    lineHeight: 0.9,
                    color: userText,
                    textShadow: '0 2px 8px rgba(0,0,0,0.65)',
                  }}
                >
                  {w.word}
                </span>
              ))}
            </div>
          )}
          <div style={{ zIndex: 1 }}>
            <span
              onClick={() => onWordClick?.(heroWord)}
              style={{
                cursor: 'pointer',
                display: 'inline-block',
                fontFamily: overrideFont(heroFont),
                fontStyle: usePersonaA ? 'italic' : 'normal',
                fontWeight: usePersonaA ? 600 : 900,
                fontSize: sz(usePersonaA ? 38 : 34),
                lineHeight: 0.92,
                textTransform: usePersonaA ? 'lowercase' : 'uppercase',
                color: heroColor,
                textShadow: usePersonaA
                  ? '0 4px 16px rgba(0,0,0,0.7)'
                  : '0 0 15px rgba(255,255,255,0.4), 0 0 30px rgba(255,255,255,0.2)',
              }}
            >
              {heroWord.word}
            </span>
          </div>
          {postWords.length > 0 && (
            <div
              style={{
                display: 'flex',
                gap: sz(4),
                marginTop: sz(2),
                transform: `translate3d(${diagShift}px, 0, 0)`,
                zIndex: 2,
              }}
            >
              {postWords.map((w) => (
                <span
                  key={w.id}
                  onClick={() => onWordClick?.(w)}
                  style={{
                    cursor: 'pointer',
                    fontFamily: overrideFont('Montserrat, sans-serif'),
                    fontWeight: 600,
                    fontSize: sz(15),
                    lineHeight: 0.9,
                    color: userText,
                    textShadow: '0 2px 8px rgba(0,0,0,0.65)',
                  }}
                >
                  {w.word}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------------
  // 2B. CLASSIC TEMPLATES: `aura` & `aura_helvetica` (Swiss) 3-Role Editorial Stack
  // ----------------------------------------------------------------------------
  if (id === 'aura' || id === 'aura_helvetica') {
    const isSwiss = id === 'aura_helvetica';
    return (
      <div style={boxStyle} data-caption-content="true">
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            lineHeight: 0.86,
          }}
        >
          {preWords.length > 0 && (
            <div style={{ display: 'flex', gap: sz(5), marginBottom: sz(2) }}>
              {preWords.map((w) => (
                <span
                  key={w.id}
                  onClick={() => onWordClick?.(w)}
                  style={{
                    cursor: 'pointer',
                    fontFamily: overrideFont(
                      isSwiss ? 'Inter, sans-serif' : '"Playfair Display", Georgia, serif'
                    ),
                    fontStyle: isSwiss ? 'normal' : 'italic',
                    fontWeight: isSwiss ? 900 : 600,
                    fontSize: sz(isSwiss ? 26 : 32),
                    letterSpacing: isSwiss ? '-0.04em' : '0em',
                    color: userText,
                    textShadow: '0 4px 14px rgba(0,0,0,0.65)',
                  }}
                >
                  {w.word}
                </span>
              ))}
            </div>
          )}
          <span
            onClick={() => onWordClick?.(heroWord)}
            style={{
              cursor: 'pointer',
              fontFamily: overrideFont(isSwiss ? 'Inter, sans-serif' : 'Anton, sans-serif'),
              fontWeight: 900,
              fontSize: sz(30),
              textTransform: 'uppercase',
              letterSpacing: isSwiss ? '-0.03em' : '0.02em',
              color: customAccentColor || (isSwiss ? '#F5D300' : '#7fd3ff'),
              textShadow: '0 4px 16px rgba(0,0,0,0.75)',
            }}
          >
            {heroWord.word}
          </span>
          {postWords.length > 0 && (
            <div style={{ display: 'flex', gap: sz(5), marginTop: sz(3) }}>
              {postWords.map((w) => (
                <span
                  key={w.id}
                  onClick={() => onWordClick?.(w)}
                  style={{
                    cursor: 'pointer',
                    fontFamily: overrideFont('Inter, sans-serif'),
                    fontWeight: 700,
                    fontSize: sz(14),
                    color: userText,
                    textShadow: '0 2px 10px rgba(0,0,0,0.65)',
                  }}
                >
                  {w.word}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------------
  // 2C. CLASSIC TEMPLATE: `blockbuster` (2-Row Cinema Trailer Lockup)
  // ----------------------------------------------------------------------------
  if (id === 'blockbuster') {
    const splitAt = Math.max(1, words.length - 2);
    const topWords = words.slice(0, splitAt);
    const bottomWords = words.slice(splitAt);
    return (
      <div style={boxStyle} data-caption-content="true">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: sz(5), transform: 'scaleX(0.885)' }}>
            {topWords.map((w) => (
              <span
                key={w.id}
                onClick={() => onWordClick?.(w)}
                style={{
                  cursor: 'pointer',
                  fontFamily: overrideFont('Anton, Impact, sans-serif'),
                  fontWeight: 700,
                  fontSize: sz(25),
                  lineHeight: 1,
                  textTransform: 'uppercase',
                  letterSpacing: '0.035em',
                  color: customTextColor || '#FA232D',
                  textShadow:
                    '0 0 5px rgba(250,35,45,.45), 0 0 11px rgba(250,35,45,.42), 0 0 20px rgba(250,35,45,.26)',
                }}
              >
                {w.word}
              </span>
            ))}
          </div>
          {bottomWords.length > 0 && (
            <div style={{ display: 'flex', gap: sz(6), marginTop: -sz(8), zIndex: 2 }}>
              {bottomWords.map((w) => (
                <span
                  key={w.id}
                  onClick={() => onWordClick?.(w)}
                  style={{
                    cursor: 'pointer',
                    fontFamily: overrideFont('"Great Vibes", cursive'),
                    fontWeight: 400,
                    fontSize: sz(32),
                    lineHeight: 1,
                    color: '#FFFFFF',
                    textShadow:
                      '0 0 6px rgba(255,255,255,.6), 0 0 15px rgba(255,255,255,.32), 0 2px 4px rgba(0,0,0,.68)',
                  }}
                >
                  {w.word.toLowerCase()}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------------
  // 2D. CLASSIC TEMPLATE: `archives` (Hand-drawn boil + double SVG underline)
  // ----------------------------------------------------------------------------
  if (id === 'archives') {
    const jitterDeg = Math.sin(currentTimeSec * 8) * 1.1;
    return (
      <div style={boxStyle} data-caption-content="true">
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: sz(7),
            alignItems: 'baseline',
            justifyContent: 'center',
            fontFamily: overrideFont('"Kaushan Script", cursive'),
            transform: `rotate(${jitterDeg.toFixed(2)}deg)`,
          }}
        >
          {words.map((w, idx) => {
            const isHero = idx === heroIdx;
            return (
              <span
                key={w.id}
                onClick={() => onWordClick?.(w)}
                style={{
                  cursor: 'pointer',
                  position: 'relative',
                  display: 'inline-block',
                  color: customTextColor || '#E1CDC2',
                  fontSize: sz(isHero ? 28 : 20),
                  textShadow: '0 2px 6px rgba(0,0,0,0.65)',
                }}
              >
                <span style={{ position: 'relative', zIndex: 2 }}>{w.word}</span>
                {isHero && (
                  <svg
                    viewBox="0 0 100 14"
                    preserveAspectRatio="none"
                    style={{
                      position: 'absolute',
                      left: '-8%',
                      bottom: '-24%',
                      width: '116%',
                      height: '28%',
                      overflow: 'visible',
                      zIndex: 3,
                    }}
                  >
                    <path
                      d="M2,7 Q26,3 50,8 T97,6"
                      fill="none"
                      stroke={customTextColor || '#E1CDC2'}
                      strokeWidth={2.6}
                      strokeLinecap="round"
                    />
                    <path
                      d="M3,11 Q28,7 52,12 T96,10"
                      fill="none"
                      stroke={customTextColor || '#E1CDC2'}
                      strokeWidth={1.6}
                      strokeLinecap="round"
                      opacity={0.6}
                    />
                  </svg>
                )}
              </span>
            );
          })}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------------
  // 2E. CLASSIC TEMPLATE: `scribble` (Yellow skewed marker + SVG hand-drawn ellipse)
  // ----------------------------------------------------------------------------
  if (id === 'scribble') {
    return (
      <div style={boxStyle} data-caption-content="true">
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: sz(8),
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: overrideFont('"Caveat", cursive'),
            fontWeight: 700,
          }}
        >
          {words.map((w, idx) => {
            const isHero = idx === heroIdx;
            const isCircled = idx === Math.min(words.length - 1, heroIdx + 1) && idx !== heroIdx;
            return (
              <span
                key={w.id}
                onClick={() => onWordClick?.(w)}
                style={{
                  cursor: 'pointer',
                  position: 'relative',
                  display: 'inline-block',
                  transform: `rotate(${idx % 2 === 0 ? -1.8 : 1.5}deg)`,
                }}
              >
                {isHero && (
                  <span
                    aria-hidden
                    style={{
                      position: 'absolute',
                      top: '6%',
                      bottom: '-2%',
                      left: '-6%',
                      right: '-8%',
                      background:
                        'linear-gradient(94deg, rgba(255,224,66,0.94) 0%, rgba(255,214,40,0.88) 55%, rgba(255,228,90,0.92) 100%)',
                      borderRadius: '8px 14px 10px 12px / 14px 8px 13px 9px',
                      transform: 'skewX(-5deg)',
                    }}
                  />
                )}
                <span
                  style={{
                    position: 'relative',
                    color: isHero ? '#241C12' : '#FDFAF3',
                    fontSize: sz(isHero ? 29 : 22),
                    textShadow: isHero ? 'none' : '0 1px 4px rgba(30,20,10,0.55)',
                  }}
                >
                  {w.word}
                </span>
                {isCircled && (
                  <svg
                    viewBox="0 0 100 60"
                    preserveAspectRatio="none"
                    style={{
                      position: 'absolute',
                      top: '-16%',
                      left: '-12%',
                      width: '124%',
                      height: '132%',
                      overflow: 'visible',
                    }}
                  >
                    <ellipse
                      cx={50}
                      cy={30}
                      rx={46}
                      ry={25}
                      fill="none"
                      stroke="#FF5A36"
                      strokeWidth={3.5}
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </span>
            );
          })}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------------
  // 2F. CLASSIC TEMPLATE: `interlock` (Nested Giant Italic Serif + Tucked Caps)
  // ----------------------------------------------------------------------------
  if (id === 'interlock') {
    return (
      <div style={boxStyle} data-caption-content="true">
        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
          {preWords.length > 0 && (
            <div
              style={{
                display: 'flex',
                gap: sz(5),
                alignSelf: 'flex-start',
                marginBottom: -sz(6),
                zIndex: 2,
              }}
            >
              {preWords.map((w) => (
                <span
                  key={w.id}
                  onClick={() => onWordClick?.(w)}
                  style={{
                    cursor: 'pointer',
                    fontFamily: overrideFont('Montserrat, sans-serif'),
                    fontWeight: 600,
                    fontSize: sz(12),
                    letterSpacing: '0.045em',
                    textTransform: 'uppercase',
                    color: '#F7F4EE',
                    textShadow: '0 1px 4px rgba(0,0,0,0.7)',
                  }}
                >
                  {w.word}
                </span>
              ))}
            </div>
          )}
          <div
            onClick={() => onWordClick?.(heroWord)}
            style={{
              cursor: 'pointer',
              fontFamily: overrideFont('"Playfair Display", Georgia, serif'),
              fontStyle: 'italic',
              fontWeight: 500,
              fontSize: sz(46),
              lineHeight: 0.9,
              color: customAccentColor || '#F7F4EE',
              textShadow: '0 2.5px 12px rgba(0,0,0,0.75)',
            }}
          >
            {heroWord.word.toLowerCase()}
          </div>
          {postWords.length > 0 && (
            <div
              style={{
                display: 'flex',
                gap: sz(5),
                alignSelf: 'flex-end',
                marginTop: -sz(4),
                zIndex: 2,
              }}
            >
              {postWords.map((w) => (
                <span
                  key={w.id}
                  onClick={() => onWordClick?.(w)}
                  style={{
                    cursor: 'pointer',
                    fontFamily: overrideFont('Montserrat, sans-serif'),
                    fontWeight: 600,
                    fontSize: sz(12),
                    letterSpacing: '0.045em',
                    textTransform: 'uppercase',
                    color: '#F7F4EE',
                    textShadow: '0 1px 4px rgba(0,0,0,0.7)',
                  }}
                >
                  {w.word}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------------
  // 2G. CLASSIC TEMPLATE: `big_red` (Grid Overlay: Tall ScaleY(1.35) Crimson Behind + White Context)
  // ----------------------------------------------------------------------------
  if (id === 'big_red') {
    const nonHeroWords = words.filter((_, i) => i !== heroIdx);
    return (
      <div style={{ ...boxStyle, display: 'grid', placeItems: 'center' }} data-caption-content="true">
        <div style={{ gridArea: '1 / 1', zIndex: 0 }}>
          <span
            onClick={() => onWordClick?.(heroWord)}
            style={{
              cursor: 'pointer',
              display: 'inline-block',
              lineHeight: 1,
              transform: 'scaleY(1.35)',
              fontFamily: overrideFont('"Playfair Display", "Times New Roman", serif'),
              fontWeight: 700,
              fontSize: sz(46),
              textTransform: 'uppercase',
              backgroundImage:
                'linear-gradient(90deg,#C9302F 0%,#D53E3E 18%,#E68C8C 50%,#D53E3E 82%,#C9302F 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 8px rgba(150,15,15,0.55))',
              whiteSpace: 'nowrap',
            }}
          >
            {heroWord.word}
          </span>
        </div>
        {nonHeroWords.length > 0 && (
          <div
            style={{
              gridArea: '1 / 1',
              zIndex: 1,
              display: 'flex',
              gap: sz(6),
              justifyContent: 'center',
              alignItems: 'baseline',
            }}
          >
            {nonHeroWords.map((w) => (
              <span
                key={w.id}
                onClick={() => onWordClick?.(w)}
                style={{
                  cursor: 'pointer',
                  fontFamily: overrideFont('"Playfair Display", "Times New Roman", serif'),
                  fontWeight: 700,
                  fontSize: sz(15),
                  color: '#FFFFFF',
                  textShadow: '0 2px 6px rgba(0,0,0,0.85)',
                }}
              >
                {w.word}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ----------------------------------------------------------------------------
  // 2H. 3-ROW SPLASH LOCKUPS (`captik_glow`, `captik_shadow`, `captik`, `illusion`)
  // ----------------------------------------------------------------------------
  if (id === 'captik_glow' || id === 'captik_shadow' || id === 'captik' || id === 'illusion') {
    const isGlow = id === 'captik_glow';
    const isShadow = id === 'captik_shadow';
    const isIllusion = id === 'illusion';
    const glowFn = (c: string) =>
      `0 0 ${sz(3)}px ${hexWithAlpha(c, 1)}, 0 0 ${sz(7)}px ${hexWithAlpha(c, 0.65)}, 0 0 ${sz(
        16
      )}px ${hexWithAlpha(c, 0.32)}, 0 0 ${sz(27)}px ${hexWithAlpha(c, 0.1)}`;

    return (
      <div style={boxStyle} data-caption-content="true">
        <div
          style={{
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            gap: isShadow ? 0 : sz(2),
            width: 'fit-content',
          }}
        >
          {preWords.length > 0 && (
            <div style={{ display: 'flex', gap: sz(6), justifyContent: 'flex-start', zIndex: 1 }}>
              {preWords.map((w) => (
                <span
                  key={w.id}
                  onClick={() => onWordClick?.(w)}
                  style={{
                    cursor: 'pointer',
                    fontFamily: overrideFont('Inter, sans-serif'),
                    fontWeight: isShadow ? 800 : 700,
                    fontSize: sz(isGlow ? 18 : 14),
                    color: userText,
                    ...(isShadow
                      ? {
                          backgroundImage: `linear-gradient(to bottom, ${userText} 45%, #555555 100%)`,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                        }
                      : {}),
                    textShadow: isGlow ? glowFn(userText) : '0 2px 8px rgba(0,0,0,0.65)',
                  }}
                >
                  {w.word}
                </span>
              ))}
            </div>
          )}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: isShadow && preWords.length > 0 ? -sz(5) : 0,
              zIndex: 2,
            }}
          >
            <span
              onClick={() => onWordClick?.(heroWord)}
              style={{
                cursor: 'pointer',
                fontFamily: overrideFont('Inter, sans-serif'),
                fontWeight: 900,
                fontSize: sz(isIllusion ? 40 : 44),
                lineHeight: 1,
                textTransform: isIllusion ? 'none' : 'uppercase',
                color: userAccent,
                ...(isShadow
                  ? {
                      backgroundImage: `linear-gradient(to bottom, ${userAccent} 45%, #555555 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }
                  : {}),
                textShadow: isGlow ? glowFn(userAccent) : '0 6px 18px rgba(0,0,0,0.75)',
              }}
            >
              {heroWord.word}
            </span>
          </div>
          {postWords.length > 0 && (
            <div
              style={{
                display: 'flex',
                gap: sz(6),
                justifyContent: 'flex-end',
                marginTop: isShadow ? -sz(5) : 0,
                zIndex: 3,
              }}
            >
              {postWords.map((w) => (
                <span
                  key={w.id}
                  onClick={() => onWordClick?.(w)}
                  style={{
                    cursor: 'pointer',
                    fontFamily: overrideFont('Inter, sans-serif'),
                    fontWeight: isShadow ? 800 : 700,
                    fontSize: sz(isGlow ? 18 : 14),
                    color: userText,
                    ...(isShadow
                      ? {
                          backgroundImage: `linear-gradient(to bottom, ${userText} 45%, #555555 100%)`,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                        }
                      : {}),
                    textShadow: isGlow ? glowFn(userText) : '0 2px 8px rgba(0,0,0,0.65)',
                  }}
                >
                  {w.word}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------------
  // 2I. SPATIAL AROUND-YOU LOOKS (`look.family === 'spatial'`)
  // Already rendered around the speaker's head in the behind-subject depth layer!
  // ----------------------------------------------------------------------------
  if (look && look.family === 'spatial') {
    return null;
  }

  // ----------------------------------------------------------------------------
  // 2J. STACK LOOKS (`look.family === 'stack'`, e.g., `look_belfry`, `look_abbey`)
  // ----------------------------------------------------------------------------
  if (look && look.family === 'stack' && look.stack) {
    const rows: Array<{ words: WordToken[]; tier: number }> = [];
    if (preWords.length > 0) rows.push({ words: preWords, tier: 0 });
    rows.push({ words: [heroWord], tier: 2 });
    if (postWords.length > 0) rows.push({ words: postWords, tier: 1 });
    const rawRoles: any = look.stack?.roles;

    return (
      <div style={boxStyle} data-caption-content="true">
        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: sz(2) }}>
          {rows.map((r, rIdx) => {
            const isHeroRow = r.tier >= 2;
            const role = Array.isArray(rawRoles)
              ? rawRoles.find((ro: any) => ro.tier === r.tier)
              : isHeroRow
              ? rawRoles?.pop ?? rawRoles?.hero
              : rawRoles?.lead ?? rawRoles?.support;
            const scale = look.stack?.rowScale[Math.min(r.tier, (look.stack.rowScale.length || 1) - 1)] ?? 1;
            return (
              <div key={rIdx} style={{ display: 'flex', gap: sz(6), justifyContent: 'center' }}>
                {r.words.map((w) => (
                  <span
                    key={w.id}
                    onClick={() => onWordClick?.(w)}
                    style={{
                      cursor: 'pointer',
                      fontFamily: overrideFont(
                        role?.font ?? (isHeroRow ? look.accentFont ?? look.font : look.font)
                      ),
                      fontWeight: role?.weight ?? (isHeroRow ? look.accentWeight ?? look.weight : look.weight),
                      fontStyle: role?.italic || (isHeroRow && look.accentItalic) ? 'italic' : 'normal',
                      fontSize: sz(
                        Math.min(
                          42,
                          Math.round(
                            (Number.isFinite(look.sizePx) ? look.sizePx : 24) *
                              (Number.isFinite(scale) ? scale : 1) *
                              0.72
                          )
                        )
                      ),
                      lineHeight: 0.98,
                      textTransform:
                        role?.uppercase || look.transform === 'uppercase' ? 'uppercase' : 'none',
                      color:
                        role?.color ??
                        (isHeroRow ? customAccentColor || look.accent || '#FFE500' : userText),
                      textShadow: buildLookShadow(look),
                      ...(role?.chip
                        ? {
                            background: role.chip.bg,
                            padding: '2px 10px',
                            borderRadius: `${role.chip.radiusEm ?? 0.16}em`,
                          }
                        : {}),
                    }}
                  >
                    {w.word}
                  </span>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------------
  // 2K. STANDARD ROW & KARAOKE / PILL / GLOW / LOOK RENDERER
  // Handles `ali_abdaal`, `liquid_glass`, `boxed`, `hormozi`, `mrbeast`, `delhi`,
  // `journal`, `tabahi`, `deep_glow`, `seedha_saadha`, `pixelated`, and all `look_*` foreground rows!
  // ----------------------------------------------------------------------------
  if (id === 'pixelated') {
    const activeW = words[Math.max(0, activeWordIndex)] ?? heroWord;
    return (
      <div style={boxStyle}>
        <span
          onClick={() => onWordClick?.(activeW)}
          style={{
            cursor: 'pointer',
            fontFamily: overrideFont('"Press Start 2P", monospace'),
            fontWeight: 700,
            fontSize: sz(18),
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: userText,
            textShadow: '0 4px 12px rgba(0,0,0,0.85)',
          }}
        >
          {activeW.word}
        </span>
      </div>
    );
  }

  // If `look.impact` or `big_reveal` is active, filter out the hero word from the bottom row (just like Captik's `a.row`!)
  const rowWords =
    (id === 'big_reveal' || (look?.impact && look.behindSubject)) && words.length > 1
      ? words.filter((_, idx) => idx !== heroIdx)
      : words;

  const containerChipStyle: React.CSSProperties =
    id === 'ali_abdaal'
      ? {
          background: '#ffffff',
          borderRadius: 14,
          padding: '8px 18px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
        }
      : id === 'liquid_glass'
      ? {
          background: 'rgba(255,255,255,0.2)',
          border: '1px solid rgba(255,255,255,0.28)',
          borderRadius: 36,
          padding: '8px 22px',
          backdropFilter: 'blur(10px)',
        }
      : id === 'boxed'
      ? {
          background: customAccentColor || '#f48601',
          borderRadius: 4,
          padding: '7px 18px',
        }
      : {};

  return (
    <div style={boxStyle} data-caption-content="true">
      <div
        data-cap-row=""
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'baseline',
          gap: sz(6),
          maxWidth: '94%',
          ...containerChipStyle,
        }}
      >
        {rowWords.map((w) => {
          const origIdx = words.findIndex((item) => item.id === w.id);
          const isActive = origIdx === activeWordIndex;
          const isSpoken = origIdx <= activeWordIndex || activeWordIndex === -1;
          const isEmph = origIdx === heroIdx || w.emphasized;

          // Delhi: italic Instrument Serif on emphasized words
          if (id === 'delhi') {
            return (
              <span
                key={w.id}
                onClick={() => onWordClick?.(w)}
                style={{
                  cursor: 'pointer',
                  fontFamily: overrideFont(
                    isEmph ? '"Instrument Serif", serif' : '"Instrument Sans", sans-serif'
                  ),
                  fontStyle: isEmph ? 'italic' : 'normal',
                  fontSize: sz(isEmph ? 22 : 18),
                  color: userText,
                  opacity: isSpoken ? 1 : 0.25,
                  textShadow: isEmph ? '0 0 18px rgba(255,255,255,0.75)' : '0 2px 6px rgba(0,0,0,0.5)',
                }}
              >
                {w.word}
              </span>
            );
          }

          // Journal: blur-to-sharp entrance + #E8202A crimson sweep on hero/last word
          if (id === 'journal') {
            return (
              <span
                key={w.id}
                onClick={() => onWordClick?.(w)}
                style={{
                  cursor: 'pointer',
                  fontFamily: overrideFont('"Caveat", cursive'),
                  fontWeight: 600,
                  fontSize: sz(26),
                  color: isEmph ? '#E8202A' : userText,
                  filter: isSpoken ? 'none' : 'blur(2.4px)',
                  opacity: isSpoken ? 1 : 0.55,
                  textShadow: '0 1.2px 5px rgba(0,0,0,0.55)',
                }}
              >
                {w.word}
              </span>
            );
          }

          // Hormozi: multi-stop lime gradient
          if (id === 'hormozi') {
            return (
              <span
                key={w.id}
                onClick={() => onWordClick?.(w)}
                style={{
                  cursor: 'pointer',
                  fontFamily: overrideFont('Anton, sans-serif'),
                  fontWeight: 700,
                  fontSize: sz(isEmph || isActive ? 25 : 21),
                  textTransform: 'uppercase',
                  backgroundImage:
                    'linear-gradient(to bottom, #77a748 0%, #8abe4c 25%, #97DE25 38%, #9FF747 60%, #a5fd4b 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(6px 6px 4px rgba(0,0,0,0.85))',
                }}
              >
                {w.word}
              </span>
            );
          }

          // Look Spec styling
          if (look) {
            const isHighlighted = isActive || isEmph;
            const wordFont =
              isHighlighted && look.accentFont ? look.accentFont : look.font;
            const wordChip = isHighlighted ? look.chip : undefined;
            const fg = wordChip
              ? look.accent ?? '#111111'
              : isHighlighted
              ? customAccentColor || look.accent || '#FFE500'
              : customTextColor || look.color || '#FFFFFF';

            return (
              <span
                key={w.id}
                onClick={() => onWordClick?.(w)}
                style={{
                  cursor: 'pointer',
                  display: 'inline-block',
                  fontFamily: overrideFont(wordFont),
                  fontWeight: isHighlighted ? look.accentWeight ?? look.weight : look.weight,
                  fontStyle: isHighlighted && look.accentItalic ? 'italic' : 'normal',
                  fontSize: sz(
                    Math.round(
                      (Number.isFinite(look.sizePx) ? look.sizePx : 20) *
                        (isHighlighted && Number.isFinite(look.accentScale)
                          ? (look.accentScale as number)
                          : 1) *
                        0.85
                    )
                  ),
                  textTransform:
                    look.transform ?? (isHighlighted && look.accentUppercase ? 'uppercase' : 'none'),
                  color: fg,
                  opacity: isSpoken ? 1 : look.restOpacity ?? 0.75,
                  ...(look.stroke
                    ? { WebkitTextStroke: `${look.stroke.px}px ${look.stroke.color}` }
                    : {}),
                  ...(wordChip
                    ? {
                        background: wordChip.bg,
                        padding: '2px 8px',
                        borderRadius: `${wordChip.radiusEm ?? 0.18}em`,
                      }
                    : {}),
                  textShadow: buildLookShadow(look, fg),
                }}
              >
                {w.word}
              </span>
            );
          }

          // Classic templates fallback (`ali_abdaal`, `liquid_glass`, `bubble`, `mrbeast`, `tabahi`, `deep_glow`, `seedha_saadha`, etc.)
          const isPillActive = id === 'bubble' && (isActive || isEmph);
          return (
            <span
              key={w.id}
              onClick={() => onWordClick?.(w)}
              style={{
                cursor: 'pointer',
                display: 'inline-block',
                fontFamily: overrideFont(template.fontFamily),
                fontWeight: template.fontWeight,
                fontSize: sz(isActive || isEmph ? 21 : 18),
                textTransform: template.uppercase ? 'uppercase' : 'none',
                letterSpacing: id === 'thora_cinematic' ? '0.28em' : undefined,
                color:
                  id === 'ali_abdaal'
                    ? isSpoken
                      ? '#000000'
                      : '#71717A'
                    : id === 'liquid_glass'
                    ? isSpoken
                      ? '#FFFFFF'
                      : '#918b7c'
                    : isPillActive
                    ? '#000000'
                    : isActive || isEmph
                    ? userAccent
                    : userText,
                background: isPillActive ? customAccentColor || '#48A680' : 'transparent',
                padding: isPillActive ? '2px 8px' : undefined,
                borderRadius: isPillActive ? 8 : undefined,
                opacity:
                  id === 'captik_word' && !isSpoken ? 0.18 : 1,
                WebkitTextStroke:
                  template.strokeWidth && template.strokeColor
                    ? `${template.strokeWidth * 0.45}px ${template.strokeColor}`
                    : undefined,
                textShadow:
                  id === 'ali_abdaal' || id === 'liquid_glass' ? 'none' : template.shadowStyle,
              }}
            >
              {w.word}
            </span>
          );
        })}
      </div>
    </div>
  );
};

/**
 * 3. AUTHENTIC CAPTIK BOLD TEXT LOCKUPS (poster, b01..b10 from 0.qv7x8vhnr1~.js)
 * Renders jagged tape polygons, SVG circles/underlines/strikes, vertical slide bars,
 * terminal blinking cursors, comic bursts, and doodle icons!
 */
export const CaptikBoldTextOverlayRenderer: React.FC<{
  item: TextOverlayItem;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ item, isSelected, onSelect }) => {
  const v = item.variantId || 'poster';
  const lines = item.text.includes('\n')
    ? item.text.split('\n')
    : item.text.split(' ').length >= 3
    ? [
        item.text
          .split(' ')
          .slice(0, Math.ceil(item.text.split(' ').length / 2))
          .join(' '),
        item.text
          .split(' ')
          .slice(Math.ceil(item.text.split(' ').length / 2))
          .join(' '),
      ]
    : [item.text];

  const safeItemFontSize = Number.isFinite(item.fontSize) && item.fontSize > 0 ? item.fontSize : 36;
  const baseScale = Math.max(0.65, safeItemFontSize / 38);

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      style={{
        position: 'absolute',
        left: `${item.xPercent}%`,
        top: `${item.yPercent}%`,
        transform: `translate(-50%, -50%) scale(${baseScale})`,
        cursor: 'pointer',
        zIndex: isSelected ? 38 : 26,
      }}
      className={`transition-shadow ${
        isSelected ? 'ring-2 ring-amber-400/90 rounded-lg p-1.5 bg-black/20' : ''
      }`}
    >
      {/* poster: Classic stacked serif/display lockup */}
      {v === 'poster' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 0.94 }}>
          {lines.map((ln, idx) => (
            <div
              key={idx}
              style={{
                fontFamily: idx === 0 ? '"Instrument Serif", Georgia, serif' : item.fontFamily,
                fontStyle: idx === 0 ? 'italic' : 'normal',
                fontWeight: idx === 0 ? 600 : 900,
                fontSize: idx === 0 ? 30 : 34,
                color: idx === 0 ? '#FFFFFF' : item.color || '#FFE500',
                textTransform: idx === 0 ? 'none' : 'uppercase',
                textShadow: '0 6px 20px rgba(0,0,0,0.8)',
              }}
            >
              {ln}
            </div>
          ))}
        </div>
      )}

      {/* b01: Slam (Heavy display slam with accent bottom word) */}
      {v === 'b01' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 0.9 }}>
          {lines.map((ln, idx) => (
            <div
              key={idx}
              style={{
                fontFamily: '"Bebas Neue", Anton, sans-serif',
                fontWeight: 900,
                fontSize: 38,
                letterSpacing: '-0.02em',
                textTransform: 'uppercase',
                color: idx === lines.length - 1 ? '#FFE500' : '#FFFFFF',
                textShadow: '0 2px 14px rgba(0,0,0,0.65), 0 1px 3px rgba(0,0,0,0.8)',
              }}
            >
              {ln}
            </div>
          ))}
        </div>
      )}

      {/* b02: Tape (Jagged torn tape strips + hand-drawn SVG underline/circle) */}
      {v === 'b02' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
          {lines.map((ln, idx) => {
            const isRed = idx === 1;
            return (
              <div
                key={idx}
                style={{
                  position: 'relative',
                  background: isRed ? '#FF3B30' : idx === 0 ? '#FFE500' : '#FAF6EE',
                  color: isRed ? '#FFFFFF' : '#141413',
                  padding: '5px 14px 6px',
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
                  fontWeight: 800,
                  fontSize: 22,
                  lineHeight: 1.05,
                  transform: `rotate(${idx % 2 === 0 ? -2.2 : 1.8}deg)`,
                  clipPath:
                    'polygon(1% 4%, 99% 0%, 100% 93%, 98% 100%, 0% 97%, 2% 48%)',
                  boxShadow: '0 6px 18px rgba(0,0,0,0.4)',
                }}
              >
                {ln}
                {idx === 0 && (
                  <svg
                    viewBox="0 0 120 12"
                    preserveAspectRatio="none"
                    style={{
                      position: 'absolute',
                      left: 10,
                      right: 10,
                      bottom: 2,
                      width: 'calc(100% - 20px)',
                      height: 6,
                      overflow: 'visible',
                    }}
                  >
                    <path
                      d="M 2 7 Q 60 2 118 6"
                      fill="none"
                      stroke="#FF3B30"
                      strokeWidth={3}
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* b03: Highlighter (Marker swipe across key line) */}
      {v === 'b03' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
          {lines.map((ln, idx) => (
            <div key={idx} style={{ position: 'relative', display: 'inline-block' }}>
              <span
                style={{
                  position: 'absolute',
                  inset: '8% -6% -4% -4%',
                  background: idx === 0 ? '#FFE500' : '#FF3B30',
                  borderRadius: 4,
                  transform: 'skewX(-6deg)',
                  zIndex: 0,
                }}
              />
              <span
                style={{
                  position: 'relative',
                  zIndex: 1,
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: 900,
                  fontSize: 26,
                  color: idx === 0 ? '#111111' : '#FFFFFF',
                  padding: '0 6px',
                }}
              >
                {ln}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* b04: Stack Slide (Vertical red accent bar + stacked typography) */}
      {v === 'b04' && (
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 10 }}>
          <div
            style={{
              width: 5,
              borderRadius: 3,
              background: '#FF3B30',
              boxShadow: '0 2px 8px rgba(0,0,0,0.45)',
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {lines.map((ln, idx) => (
              <div
                key={idx}
                style={{
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
                  fontWeight: 800,
                  fontSize: 26,
                  lineHeight: 1.04,
                  letterSpacing: '-0.025em',
                  color: idx === 1 ? '#FFE500' : '#FFFFFF',
                  textShadow: '0 2px 12px rgba(0,0,0,0.65)',
                }}
              >
                {ln}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* b05: Outline (Hollow stroke filling solid from bottom) */}
      {v === 'b05' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 0.92 }}>
          {lines.map((ln, idx) => (
            <div
              key={idx}
              style={{
                fontFamily: 'Anton, sans-serif',
                fontWeight: 800,
                fontSize: 38,
                textTransform: 'uppercase',
                color: idx === 0 ? 'transparent' : '#FFE500',
                WebkitTextStroke: idx === 0 ? '1.8px #FFFFFF' : '1.5px #111111',
                filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.6))',
              }}
            >
              {ln}
            </div>
          ))}
        </div>
      )}

      {/* b06: Sticker (Die-cut white border tilted pill) */}
      {v === 'b06' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
          {lines.map((ln, idx) => (
            <div
              key={idx}
              style={{
                background: idx === 0 ? '#FF3B30' : '#FFE500',
                color: idx === 0 ? '#FFFFFF' : '#111111',
                border: '3px solid #FFFFFF',
                borderRadius: 12,
                padding: '4px 14px',
                fontFamily: '"Fredoka", Montserrat, sans-serif',
                fontWeight: 700,
                fontSize: 24,
                transform: `rotate(${idx % 2 === 0 ? -4 : 3}deg)`,
                boxShadow: '0 6px 0 #111111, 0 10px 20px rgba(0,0,0,0.5)',
              }}
            >
              {ln}
            </div>
          ))}
        </div>
      )}

      {/* b07: Terminal (Monospace bracket badge with blinking block cursor) */}
      {v === 'b07' && (
        <div
          style={{
            background: 'rgba(10, 14, 18, 0.9)',
            border: '1px solid rgba(56, 189, 248, 0.45)',
            borderRadius: 8,
            padding: '8px 14px',
            fontFamily: '"Space Mono", "JetBrains Mono", monospace',
            boxShadow: '0 8px 24px rgba(0,0,0,0.65)',
          }}
        >
          {lines.map((ln, idx) => (
            <div
              key={idx}
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: idx === 0 ? '#38BDF8' : '#A3E635',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={{ opacity: 0.5 }}>&gt;</span>
              <span>{ln}</span>
              {idx === lines.length - 1 && (
                <span
                  style={{
                    display: 'inline-block',
                    width: 9,
                    height: 18,
                    background: '#A3E635',
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* b08: Letter Drop ( Editorial Serif + Sans wave lockup) */}
      {v === 'b08' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 0.92 }}>
          {lines.map((ln, idx) => (
            <div
              key={idx}
              style={{
                fontFamily: idx === 0 ? '"Playfair Display", serif' : 'Montserrat, sans-serif',
                fontStyle: idx === 0 ? 'italic' : 'normal',
                fontWeight: idx === 0 ? 700 : 900,
                fontSize: idx === 0 ? 32 : 28,
                textTransform: idx === 0 ? 'none' : 'uppercase',
                color: idx === 0 ? '#FFE500' : '#FFFFFF',
                textShadow: '0 4px 16px rgba(0,0,0,0.75)',
              }}
            >
              {ln}
            </div>
          ))}
        </div>
      )}

      {/* b09: Cover Line (Magazine masthead with numbered hairline rule) */}
      {v === 'b09' && (
        <div
          style={{
            borderTop: '2px solid #FFE500',
            borderBottom: '1px solid rgba(255,255,255,0.35)',
            padding: '6px 4px',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <div
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 10,
              letterSpacing: '0.2em',
              color: '#FFE500',
              textTransform: 'uppercase',
            }}
          >
            01 // FEATURED NOTE
          </div>
          {lines.map((ln, idx) => (
            <div
              key={idx}
              style={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontWeight: 700,
                fontSize: 26,
                lineHeight: 1.02,
                color: '#FFFFFF',
                textShadow: '0 4px 14px rgba(0,0,0,0.7)',
              }}
            >
              {ln}
            </div>
          ))}
        </div>
      )}

      {/* b10: Burst (Comic multi-point star polygon badge) */}
      {v === 'b10' && (
        <div
          style={{
            background: '#FFE500',
            color: '#111111',
            padding: '14px 22px',
            clipPath:
              'polygon(5% 15%, 22% 4%, 48% 12%, 78% 2%, 96% 18%, 92% 52%, 98% 86%, 72% 96%, 46% 88%, 16% 98%, 2% 76%, 8% 45%)',
            transform: 'rotate(-3deg)',
            boxShadow: '0 10px 28px rgba(0,0,0,0.55)',
            textAlign: 'center',
          }}
        >
          {lines.map((ln, idx) => (
            <div
              key={idx}
              style={{
                fontFamily: 'Anton, Impact, sans-serif',
                fontWeight: 900,
                fontSize: 26,
                lineHeight: 1,
                textTransform: 'uppercase',
                color: idx === 1 ? '#D00A07' : '#111111',
              }}
            >
              {ln}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
