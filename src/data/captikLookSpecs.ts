// Auto-extracted authentic Captik LOOK_SPECS and GOOGLE_FONTS from captik.in production bundle
export interface CaptikLookSpec {
  id: string;
  name: string;
  tags: string[];
  family: "karaoke" | "flat" | "emphasis" | "stack" | "story" | "spatial" | "aiedit";
  font: string;
  weight: number;
  sizePx: number;
  color?: string;
  accent?: string;
  accentFont?: string;
  accentWeight?: number;
  accentItalic?: boolean;
  accentScale?: number;
  accentUppercase?: boolean;
  accentAlign?: "center" | "baseline";
  accentFontVariants?: string[];
  contextSizePx?: number;
  transform?: "uppercase" | "lowercase";
  letterSpacingEm?: number;
  lineHeight?: number;
  wordGapEm?: number;
  maxWords?: number;
  wrap?: boolean;
  wrapRows?: number;
  wordsPerLine?: number;
  positionYPct?: number;
  behindSubject?: boolean;
  wholeBehind?: boolean;
  heroBox?: boolean;
  heroFromStart?: boolean;
  lockup?: "center" | "splash";
  restOpacity?: number;
  reveal?: boolean;
  animIn?: string;
  animInMs?: number;
  animOutMs?: number;
  markColor?: string;
  stroke?: { px: number; color: string };
  shadow?: { blurPx: number; color: string; offsetY?: number; offsetX?: number };
  glow?: { px: number; color?: string };
  gradient?: { from: string; to: string; accentFrom?: string; accentTo?: string };
  chip?: { bg: string; padEm?: [number, number]; radiusEm?: number; skewDeg?: number };
  subjectOutline?: { color: string; px: number };
  echo?: {
    font: string;
    weight: number;
    sizePx: number;
    yPct: number;
    stepPct: number;
    maxWidthPct: number;
    fitFactor: number;
    uppercase?: boolean;
    fillColor: string;
    strokePx: number;
    strokeColor: string;
    persistMs: number;
  };
  impact?: {
    font: string;
    weight?: number;
    italic?: boolean;
    sizePx: number;
    yPct: number;
    widthPct: number;
    fitFactor: number;
    uppercase?: boolean;
    letterSpacingEm?: number;
    color?: string;
    litColor?: string;
    litAlpha?: number;
    chip?: { bg: string; wipeMs?: number; delayMs?: number; slide?: boolean };
    chipPad?: { left: number; right: number; top: number; bottom: number; radiusEm?: number };
  };
  stack?: {
    maxPerRow: number;
    rowScale: number[];
    rowGapEm?: number;
    overlapEm?: number;
    lean?: number;
    motion?: string;
    roles?: Array<{
      tier: number;
      font?: string;
      weight?: number;
      italic?: boolean;
      uppercase?: boolean;
      letterSpacingEm?: number;
      color?: string;
      chip?: { bg: string; padEm?: [number, number]; radiusEm?: number };
    }>;
  };
  variety?: {
    pattern: string[];
    curveYPct?: number;
    behindYPct?: number;
    quietYPct?: number;
    quietScale?: number;
    behindHeroScale?: number;
    preserveBehind?: boolean;
  };
  curve?: { radiusPct: number };
  story?: "reel" | "agent";
  reel?: string;
  reelTheme?: {
    gradient: [string, string, string];
    twin: [string, string];
    shade: string;
    stroke: string;
    heroInk: "gradient" | "hollow";
    heroWeight: number;
    heroUpper: boolean;
    figureFont?: string;
    figureWeight?: number;
    figureInk: "outline" | "fill";
    outlineBlend?: "difference" | "normal";
    supportColor: string;
    supportWeight: number;
    supportUpper: boolean;
    supportTrackingEm: number;
    glow?: string;
    banner?: { bg: string; fg: string; style: string };
    accents?: string[];
  };
  spatial?: "red" | "yellow" | "blue";
  spatialTheme?: {
    layout: "orbit" | "pairs" | "stair" | "poster" | "stack";
    texture: "puffy" | "extruded" | "flat";
    motion: string;
    caption: {
      color: string;
      accent: string;
      glow?: { core?: string; mid?: string; outer?: string; deep?: string };
      stroke?: { px: number; color: string };
      extrude?: { layers: number; stepPx: number; color: string };
      chip?: { bg: string; fg: string; radiusEm?: number };
    };
  };
}

export const CAPTIK_LOOK_SPECS: CaptikLookSpec[] = ([
  {
    "id": "look_anchorage",
    "name": "Anchorage",
    "tags": [
      "Popular"
    ],
    "family": "karaoke",
    "maxWords": 3,
    "font": "Montserrat, sans-serif",
    "weight": 800,
    "sizePx": 21,
    "transform": "uppercase",
    "wrap": true,
    "boxWidthPct": 100,
    "wordGapEm": 0.42,
    "lineHeight": 1.3,
    "stroke": {
      "px": 0.75,
      "color": "#141414"
    },
    "positionYPct": 73.9,
    "color": "#FFFFFF",
    "accent": "#111111",
    "chip": {
      "bg": "#FFE500"
    },
    "animIn": "fade",
    "animInMs": 30,
    "restOpacity": 1,
    "shadow": {
      "blurPx": 8,
      "color": "rgba(0,0,0,0.4)",
      "offsetY": 3
    }
  },
  {
    "id": "look_beacon",
    "name": "Beacon",
    "tags": [
      "Behind"
    ],
    "family": "karaoke",
    "maxWords": 4,
    "font": "Montserrat, sans-serif",
    "weight": 800,
    "sizePx": 23,
    "wordGapEm": 0.38,
    "accentFont": "\"Kaushan Script\", cursive",
    "accentWeight": 400,
    "accentScale": 1.22,
    "behindSubject": true,
    "depth": {
      "blurPx": 6,
      "dim": 0.4,
      "shrink": 0.06
    },
    "positionYPct": 78.3,
    "color": "#FFFFFF",
    "accent": "#2742C4",
    "animIn": "fade",
    "animInMs": 30,
    "restOpacity": 0.85,
    "shadow": {
      "blurPx": 18,
      "color": "rgba(0,0,0,0.5)",
      "offsetY": 5
    },
    "impact": {
      "font": "\"Kaushan Script\", cursive",
      "sizePx": 91,
      "yPct": 27.7,
      "widthPct": 92,
      "fitFactor": 0.777
    }
  },
  {
    "id": "look_cove",
    "name": "Cove",
    "tags": [
      "Behind"
    ],
    "family": "karaoke",
    "maxWords": 4,
    "font": "\"Special Elite\", \"Courier New\", monospace",
    "weight": 400,
    "sizePx": 22,
    "wordGapEm": 0.38,
    "behindSubject": true,
    "depth": {
      "blurPx": 6,
      "dim": 0.4,
      "shrink": 0.06
    },
    "positionYPct": 77.8,
    "color": "#F6EFE2",
    "accent": "#F25FA0",
    "animIn": "fade",
    "animInMs": 30,
    "restOpacity": 0.85,
    "shadow": {
      "blurPx": 14,
      "color": "#7A1442",
      "offsetY": 6
    },
    "impact": {
      "font": "\"Press Start 2P\", monospace",
      "sizePx": 60,
      "letterSpacingEm": 0.02,
      "yPct": 26.2,
      "widthPct": 92,
      "fitFactor": 1.389,
      "uppercase": true
    }
  },
  {
    "id": "look_driftwood",
    "name": "Driftwood",
    "tags": [
      "Behind"
    ],
    "family": "karaoke",
    "maxWords": 4,
    "font": "Montserrat, sans-serif",
    "weight": 800,
    "sizePx": 21,
    "wordGapEm": 0.38,
    "behindSubject": true,
    "depth": {
      "blurPx": 6,
      "dim": 0.4,
      "shrink": 0.06
    },
    "positionYPct": 78.3,
    "color": "#FFF1DC",
    "accent": "#FF6A2B",
    "animIn": "fade",
    "animInMs": 30,
    "restOpacity": 0.85,
    "shadow": {
      "blurPx": 12,
      "color": "rgba(0,0,0,0.5)",
      "offsetY": 4
    },
    "impact": {
      "font": "\"Luckiest Guy\", \"Luckiest Guy\", cursive",
      "sizePx": 84,
      "letterSpacingEm": 0.02,
      "yPct": 26.4,
      "widthPct": 92,
      "fitFactor": 0.759,
      "uppercase": true
    }
  },
  {
    "id": "look_ellis",
    "name": "Ellis",
    "tags": [
      "Behind"
    ],
    "family": "karaoke",
    "maxWords": 4,
    "font": "Montserrat, sans-serif",
    "weight": 800,
    "sizePx": 22,
    "wordGapEm": 0.38,
    "behindSubject": true,
    "depth": {
      "blurPx": 6,
      "dim": 0.4,
      "shrink": 0.06
    },
    "positionYPct": 78.3,
    "color": "#EAF0FF",
    "accent": "#2B53D4",
    "animIn": "fade",
    "animInMs": 30,
    "restOpacity": 0.85,
    "shadow": {
      "blurPx": 18,
      "color": "rgba(10,18,48,0.55)",
      "offsetY": 5
    },
    "impact": {
      "font": "\"Great Vibes\", cursive",
      "sizePx": 97,
      "yPct": 26.8,
      "widthPct": 90,
      "fitFactor": 0.61
    }
  },
  {
    "id": "look_ferrier",
    "name": "Ferrier",
    "tags": [
      "Behind"
    ],
    "family": "karaoke",
    "maxWords": 4,
    "font": "PoppinsBold, Poppins, sans-serif",
    "weight": 700,
    "sizePx": 22,
    "wordGapEm": 0.38,
    "behindSubject": true,
    "depth": {
      "blurPx": 6,
      "dim": 0.4,
      "shrink": 0.06
    },
    "positionYPct": 78.2,
    "color": "#FBF4E4",
    "accent": "#6E7B2E",
    "animIn": "fade",
    "animInMs": 30,
    "restOpacity": 0.85,
    "shadow": {
      "blurPx": 16,
      "color": "rgba(0,0,0,0.5)",
      "offsetY": 4
    },
    "impact": {
      "font": "\"Bagel Fat One\", sans-serif",
      "sizePx": 96,
      "yPct": 27.1,
      "widthPct": 89,
      "fitFactor": 0.96
    }
  },
  {
    "id": "look_garnet",
    "name": "Garnet",
    "tags": [
      "Behind"
    ],
    "family": "karaoke",
    "maxWords": 4,
    "font": "Inter, sans-serif",
    "weight": 700,
    "sizePx": 22,
    "wordGapEm": 0.38,
    "behindSubject": true,
    "depth": {
      "blurPx": 6,
      "dim": 0.4,
      "shrink": 0.06
    },
    "positionYPct": 76.9,
    "color": "#FFFFFF",
    "accent": "#A8FF1A",
    "animIn": "fade",
    "animInMs": 30,
    "restOpacity": 0.85,
    "shadow": {
      "blurPx": 14,
      "color": "rgba(0,0,0,0.5)",
      "offsetY": 4
    },
    "impact": {
      "font": "Inter, sans-serif",
      "weight": 900,
      "sizePx": 91,
      "yPct": 22.2,
      "widthPct": 94,
      "fitFactor": 0.852,
      "uppercase": true
    }
  },
  {
    "id": "look_hawser",
    "name": "Hawser",
    "tags": [
      "Behind"
    ],
    "family": "flat",
    "maxWords": 4,
    "wordsPerLine": 2,
    "headAnchor": 0.35,
    "wholeBehind": true,
    "font": "Anton, sans-serif",
    "weight": 400,
    "sizePx": 55,
    "transform": "uppercase",
    "fitFactor": 0.69,
    "wordGapEm": 0.55,
    "boxWidthPct": 90,
    "behindSubject": true,
    "depth": {
      "blurPx": 7,
      "dim": 0.45,
      "shrink": 0.07
    },
    "positionYPct": 36.7,
    "wrapRows": 2,
    "color": "#FFFFFF",
    "accent": "#FFFFFF",
    "animIn": "fade",
    "animInMs": 30,
    "shadow": {
      "blurPx": 26,
      "color": "rgba(0,0,0,0.45)",
      "offsetY": 8
    }
  },
  {
    "id": "look_ibis",
    "name": "Ibis",
    "tags": [
      "Popular"
    ],
    "family": "karaoke",
    "maxWords": 4,
    "font": "Montserrat, sans-serif",
    "weight": 700,
    "sizePx": 22,
    "wordGapEm": 0.38,
    "behindSubject": true,
    "depth": {
      "blurPx": 6,
      "dim": 0.4,
      "shrink": 0.06
    },
    "positionYPct": 78.3,
    "color": "#FFFFFF",
    "accent": "#FFE500",
    "chip": {
      "bg": "rgba(255,229,0,0.22)"
    },
    "animIn": "fade",
    "animInMs": 30,
    "restOpacity": 0.85,
    "shadow": {
      "blurPx": 18,
      "color": "rgba(0,0,0,0.5)",
      "offsetY": 5
    },
    "accentScale": 1.1872,
    "pop": {
      "heroOnlyScale": 1.12
    },
    "impact": {
      "font": "Anton, sans-serif",
      "sizePx": 119,
      "yPct": 21.7,
      "widthPct": 89,
      "fitFactor": 0.616,
      "uppercase": true,
      "color": "#FFFFFF",
      "litColor": "#FFE500",
      "litAlpha": 0.22,
      "chipPad": {
        "left": 0.175,
        "right": 0.175,
        "top": 0.15,
        "bottom": 0.15,
        "radiusEm": 0.13
      }
    }
  },
  {
    "id": "look_jetty",
    "name": "Jetty",
    "tags": [
      "Behind"
    ],
    "family": "karaoke",
    "maxWords": 4,
    "font": "\"Instrument Serif\", serif",
    "weight": 400,
    "sizePx": 43,
    "wordGapEm": 0.38,
    "letterSpacingEm": -0.023,
    "behindSubject": true,
    "reveal": true,
    "wrap": true,
    "boxWidthPct": 94,
    "fitFactor": 0.7,
    "positionYPct": 78,
    "color": "#FFFFFF",
    "accent": "#FFFFFF",
    "animIn": "fade",
    "animInMs": 10,
    "restOpacity": 0.85,
    "shadow": {
      "blurPx": 18,
      "color": "rgba(255,5,3,0.42)",
      "offsetY": 5
    },
    "impact": {
      "select": "leading",
      "maxPerClip": 2,
      "font": "\"Rubik Spray Paint\", sans-serif",
      "sizePx": 130,
      "letterSpacingEm": -0.07,
      "yPct": 28.9,
      "widthPct": 92,
      "fitFactor": 0.957,
      "uppercase": true,
      "color": "#FF0503"
    }
  },
  {
    "id": "look_keel",
    "name": "Keel",
    "tags": [
      "Popular"
    ],
    "family": "karaoke",
    "pop": {
      "rowFace": true
    },
    "maxWords": 3,
    "font": "Gloock, serif",
    "weight": 400,
    "sizePx": 41,
    "wordGapEm": 0.38,
    "letterSpacingEm": -0.012,
    "accentLetterSpacingEm": -0.04,
    "behindSubject": true,
    "reveal": true,
    "wrap": true,
    "boxWidthPct": 93,
    "positionYPct": 74.5,
    "color": "#FFF18F",
    "accent": "#FFF18F",
    "animIn": "fade",
    "animInMs": 10,
    "restOpacity": 0.85,
    "shadow": {
      "blurPx": 14,
      "color": "rgba(0,0,0,0.45)",
      "offsetY": 4
    },
    "impact": {
      "select": "leading",
      "maxPerClip": 2,
      "font": "Gloock, serif",
      "sizePx": 127,
      "letterSpacingEm": -0.04,
      "yPct": 19.9,
      "widthPct": 92,
      "fitFactor": 0.932,
      "uppercase": true
    }
  },
  {
    "id": "look_lanyard",
    "name": "Lanyard",
    "tags": [
      "Popular"
    ],
    "family": "flat",
    "pop": {
      "rowFace": true
    },
    "maxWords": 3,
    "font": "ArchivoBlack, sans-serif",
    "weight": 400,
    "sizePx": 28,
    "wordGapEm": 0.38,
    "letterSpacingEm": -0.06,
    "behindSubject": true,
    "reveal": true,
    "boxWidthPct": 89,
    "positionYPct": 75.1,
    "color": "#FFFFFF",
    "accent": "#FFFFFF",
    "animIn": "fade",
    "animInMs": 10,
    "shadow": {
      "blurPx": 14,
      "color": "rgba(0,0,0,0.42)",
      "offsetY": 4
    },
    "impact": {
      "select": "leading",
      "maxPerClip": 2,
      "font": "ArchivoBlack, sans-serif",
      "sizePx": 95,
      "yPct": 17.6,
      "widthPct": 92,
      "fitFactor": 1.104,
      "letterSpacingEm": -0.07,
      "color": "#FFFFFF"
    }
  },
  {
    "id": "look_mizzen",
    "name": "Mizzen",
    "tags": [
      "Behind"
    ],
    "family": "stack",
    "pop": {
      "plainColor": true,
      "rowFace": true
    },
    "maxWords": 7,
    "font": "Inter, sans-serif",
    "weight": 400,
    "accentFont": "Inter, sans-serif",
    "accentWeight": 900,
    "accentItalic": true,
    "sizePx": 34,
    "lineHeight": 0.9,
    "letterSpacingEm": -0.025,
    "accentLetterSpacingEm": -0.06,
    "behindSubject": true,
    "focusline": true,
    "inception": true,
    "positionYPct": 27,
    "color": "#F3F0EA",
    "accent": "#9BCDD0",
    "heroEnter": {
      "kind": "fadeUp",
      "ms": 220,
      "em": 0.33,
      "outMs": 140
    },
    "rowEnter": {
      "kind": "fadeUp",
      "ms": 200,
      "outMs": 120
    },
    "animIn": "fadeUp",
    "animInMs": 260,
    "animOutMs": 120,
    "stack": {
      "maxPerRow": 3,
      "fillByWidth": true,
      "rowScale": [
        1.05,
        1.05,
        1.22
      ],
      "rowGapEm": 0.02,
      "heroPair": true,
      "roles": {
        "pop": {
          "color": "#DAD8D2"
        }
      }
    },
    "shadow": {
      "blurPx": 12,
      "color": "rgba(0,0,0,0.46)",
      "offsetY": 3
    }
  },
  {
    "id": "look_netting",
    "name": "Netting",
    "tags": [
      "Behind"
    ],
    "family": "karaoke",
    "maxWords": 4,
    "font": "Inter, sans-serif",
    "weight": 400,
    "sizePx": 23,
    "wordGapEm": 0.38,
    "letterSpacingEm": -0.03,
    "behindSubject": true,
    "reveal": true,
    "boxWidthPct": 89,
    "positionYPct": 76.9,
    "color": "#FFFFFF",
    "accent": "#FFFFFF",
    "animIn": "fade",
    "animInMs": 10,
    "restOpacity": 0.85,
    "impact": {
      "select": "leading",
      "maxPerClip": 2,
      "maxChars": 11,
      "font": "Inter, sans-serif",
      "weight": 600,
      "italic": true,
      "sizePx": 50,
      "yPct": 17.6,
      "widthPct": 92,
      "fitFactor": 0.886,
      "letterSpacingEm": -0.08,
      "color": "#121212",
      "chip": {
        "bg": "#96FF1A",
        "wipeMs": 480,
        "delayMs": 120,
        "slide": 1.15
      },
      "chipPad": {
        "left": 0.13,
        "right": 0.05,
        "top": 0.12,
        "bottom": 0.08,
        "radiusEm": 0.1
      }
    }
  },
  {
    "id": "look_outhaul",
    "name": "Outhaul",
    "tags": [
      "Behind"
    ],
    "family": "karaoke",
    "maxWords": 4,
    "font": "\"Gloria Hallelujah\", cursive",
    "weight": 400,
    "sizePx": 29,
    "wordGapEm": 0.38,
    "letterSpacingEm": -0.03,
    "behindSubject": true,
    "reveal": true,
    "positionYPct": 14.3,
    "color": "#FFFFFF",
    "accent": "#96FF1A",
    "heroEnter": {
      "kind": "fadeDown",
      "ms": 480,
      "em": 0.33
    },
    "rowEnter": {
      "kind": "fadeUp",
      "ms": 300,
      "delayMs": 120
    },
    "heroFromStart": true,
    "animIn": "fadeDown",
    "animInMs": 560,
    "restOpacity": 1,
    "shadow": {
      "blurPx": 14,
      "color": "rgba(0,0,0,0.48)",
      "offsetY": 4
    },
    "impact": {
      "select": "trailing",
      "maxPerClip": 1,
      "font": "Anton, sans-serif",
      "sizePx": 116,
      "letterSpacingEm": 0,
      "yPct": 26.3,
      "widthPct": 93,
      "fitFactor": 0.65,
      "uppercase": true
    }
  },
  {
    "id": "look_painter",
    "name": "Painter",
    "tags": [
      "Behind"
    ],
    "family": "karaoke",
    "maxWords": 4,
    "font": "Unna, serif",
    "weight": 400,
    "sizePx": 16,
    "wordGapEm": 0.38,
    "letterSpacingEm": 0.02,
    "stroke": {
      "px": 0.5,
      "color": "#111111"
    },
    "accentFont": "Anton, sans-serif",
    "accentWeight": 400,
    "accentUppercase": true,
    "accentScale": 1.1,
    "accentLetterSpacingEm": -0.03,
    "accentAlign": "center",
    "behindSubject": true,
    "reveal": true,
    "positionYPct": 77.7,
    "color": "#FFF600",
    "accent": "#FFF600",
    "heroEnter": {
      "kind": "fadeUp",
      "ms": 300,
      "em": 0.33
    },
    "animIn": "fadeDown",
    "animInMs": 240,
    "restOpacity": 0.85,
    "shadow": {
      "blurPx": 16,
      "color": "rgba(0,0,0,0.58)",
      "offsetY": 6
    },
    "impact": {
      "select": "leading",
      "maxPerClip": 2,
      "font": "Anton, sans-serif",
      "sizePx": 135,
      "letterSpacingEm": -0.03,
      "yPct": 17.7,
      "widthPct": 92,
      "fitFactor": 0.616,
      "uppercase": true
    }
  },
  {
    "id": "look_quay",
    "name": "Quay",
    "tags": [
      "Behind"
    ],
    "family": "karaoke",
    "maxWords": 4,
    "font": "\"Instrument Serif\", serif",
    "weight": 400,
    "sizePx": 35,
    "wordGapEm": 0.38,
    "letterSpacingEm": -0.03,
    "behindSubject": true,
    "reveal": true,
    "positionYPct": 75.9,
    "color": "#EEEEEE",
    "accent": "#E50914",
    "heroEnter": {
      "kind": "fadeUp",
      "ms": 300,
      "em": 0.33
    },
    "animIn": "fade",
    "animInMs": 10,
    "restOpacity": 0.85,
    "shadow": {
      "blurPx": 18,
      "color": "rgba(229,9,20,0.46)",
      "offsetY": 5
    },
    "impact": {
      "select": "leading",
      "maxPerClip": 2,
      "font": "\"Instrument Serif\", serif",
      "sizePx": 130,
      "letterSpacingEm": -0.08,
      "yPct": 18.2,
      "widthPct": 92,
      "fitFactor": 0.68
    }
  },
  {
    "id": "look_rudder",
    "name": "Rudder",
    "tags": [
      "Popular"
    ],
    "family": "stack",
    "maxWords": 4,
    "font": "ArchivoBlack, sans-serif",
    "weight": 400,
    "sizePx": 22.6,
    "letterSpacingEm": -0.065,
    "accentLetterSpacingEm": 0,
    "accentScale": 1.48,
    "lineHeight": 0.92,
    "boxWidthPct": 100,
    "inception": true,
    "positionYPct": 54.8,
    "color": "#FFFFFF",
    "accent": "#FFFFFF",
    "animIn": "fade",
    "animInMs": 60,
    "stack": {
      "maxPerRow": 6,
      "fillByWidth": true,
      "rowScale": [
        1.08,
        1.65,
        2.75
      ],
      "rowGapEm": 0.025
    },
    "letterMask": {
      "maxMoments": 2,
      "openingWindowSec": 5,
      "payoffTailFraction": 0.28,
      "secondMomentMinDurationSec": 24,
      "minGapSec": 8
    },
    "shadow": {
      "blurPx": 14,
      "color": "rgba(0,0,0,0.5)",
      "offsetY": 3
    }
  },
  {
    "id": "look_scupper",
    "name": "Scupper",
    "tags": [
      "Behind"
    ],
    "family": "stack",
    "behindOcclusion": {
      "hideMax": 0.46,
      "flipAbove": 0.68
    },
    "pop": {
      "plainColor": true,
      "rowFace": true
    },
    "maxWords": 4,
    "font": "Inter, sans-serif",
    "weight": 900,
    "sizePx": 24,
    "accentFont": "\"Bebas Neue\", sans-serif",
    "accentWeight": 400,
    "letterSpacingEm": -0.028,
    "accentScale": 1.36,
    "accentLetterSpacingEm": -0.025,
    "behindSubject": true,
    "positionYPct": 48,
    "color": "#FFF8E8",
    "accent": "#FFF8E8",
    "animIn": "fade",
    "animInMs": 100,
    "animOutMs": 100,
    "stack": {
      "maxPerRow": 4,
      "rowScale": [
        1.05,
        1.24,
        1.72
      ],
      "rowGapEm": 0.018,
      "roles": {
        "pop": {
          "color": "#8E2530",
          "font": "\"Pinyon Script\", cursive",
          "weight": 400,
          "transform": "none",
          "letterSpacingEm": 0
        }
      }
    },
    "shadow": {
      "blurPx": 7,
      "color": "rgba(29,23,18,0.34)",
      "offsetY": 2
    }
  },
  {
    "id": "look_taffrail",
    "name": "Taffrail",
    "tags": [
      "Behind"
    ],
    "family": "stack",
    "behindOcclusion": {
      "hideMax": 0.45,
      "flipAbove": 0.68
    },
    "pop": {
      "plainColor": true,
      "rowFace": true
    },
    "maxWords": 4,
    "font": "Inter, sans-serif",
    "weight": 500,
    "sizePx": 20,
    "accentFont": "BlackHanSans, sans-serif",
    "accentWeight": 400,
    "letterSpacingEm": -0.04,
    "accentScale": 1.7,
    "accentLetterSpacingEm": -0.05,
    "behindSubject": true,
    "variety": {
      "pattern": [
        "front",
        "behind",
        "front",
        "front",
        "behind"
      ],
      "layerOnly": true
    },
    "dynamic": {
      "style": "impact",
      "intensity": "subtle"
    },
    "positionYPct": 58,
    "color": "#F4F1ED",
    "accent": "#8971FA",
    "linger": true,
    "animIn": "fadeUp",
    "animInMs": 160,
    "animOutMs": 100,
    "stack": {
      "maxPerRow": 3,
      "rowScale": [
        1.05,
        1.45,
        2.2
      ],
      "rowGapEm": 0.025,
      "heroPair": true,
      "roles": {
        "pop": {
          "weight": 900,
          "transform": "uppercase"
        }
      }
    },
    "glow": {
      "blurPx": 3.75,
      "alpha": 0.82
    },
    "shadow": {
      "blurPx": 10,
      "color": "rgba(10,15,20,0.52)",
      "offsetY": 2
    }
  },
  {
    "id": "look_underway",
    "name": "Underway",
    "tags": [
      "Behind"
    ],
    "family": "flat",
    "behindOcclusion": {
      "hideMax": 0.5,
      "flipAbove": 0.72
    },
    "pop": {
      "plainColor": true,
      "rowFace": true
    },
    "maxWords": 4,
    "font": "\"Bebas Neue\", sans-serif",
    "weight": 400,
    "sizePx": 15,
    "transform": "uppercase",
    "letterSpacingEm": -0.012,
    "wordGapEm": 0.3,
    "behindSubject": true,
    "depth": {
      "blurPx": 6,
      "dim": 0.4,
      "shrink": 0.06
    },
    "positionYPct": 17.5,
    "color": "#FDF8FA",
    "accent": "#B5D54A",
    "heroEnter": {
      "kind": "fadeUp",
      "ms": 120,
      "em": 0.33
    },
    "rowEnter": {
      "kind": "fadeDown",
      "ms": 100
    },
    "animIn": "fade",
    "animInMs": 100,
    "animOutMs": 100,
    "impact": {
      "select": "trailing",
      "maxPerClip": 2,
      "maxChars": 13,
      "font": "ArchivoBlack, sans-serif",
      "sizePx": 25.4,
      "yPct": 24,
      "widthPct": 94,
      "fitFactor": 1.104,
      "uppercase": true,
      "letterSpacingEm": -0.045,
      "color": "#B5D54A"
    },
    "shadow": {
      "blurPx": 8,
      "color": "rgba(0,0,0,0.52)",
      "offsetY": 2
    }
  },
  {
    "id": "look_vang",
    "name": "Vang",
    "tags": [
      "Behind"
    ],
    "family": "emphasis",
    "curveBodyAware": true,
    "maxWords": 3,
    "font": "Inter, sans-serif",
    "weight": 700,
    "accentFont": "PoppinsBold, Poppins, sans-serif",
    "sizePx": 33.5,
    "contextSizePx": 15,
    "accentAlign": "center",
    "behindSubject": true,
    "depth": {
      "blurPx": 6,
      "dim": 0.4,
      "shrink": 0.06
    },
    "variety": {
      "pattern": [
        "front",
        "behind",
        "front",
        "front",
        "curve",
        "behind",
        "front",
        "behind"
      ],
      "behindYPct": 29,
      "behindScale": 2.05,
      "curveYPct": 18,
      "preserveBehind": true
    },
    "curve": {
      "radiusPct": 0.5
    },
    "positionYPct": 22,
    "color": "#FFFFFF",
    "accent": "#F6FBC5",
    "animIn": "fade",
    "animInMs": 30,
    "glow": {
      "blurPx": 3.75,
      "alpha": 0.82
    },
    "shadow": {
      "blurPx": 10,
      "color": "rgba(0,0,0,0.32)",
      "offsetY": 2
    }
  },
  {
    "id": "look_windlass",
    "name": "Windlass",
    "tags": [
      "Behind"
    ],
    "family": "emphasis",
    "behindOcclusion": {
      "hideMax": 0.48,
      "flipAbove": 0.64
    },
    "pop": {
      "plainColor": true,
      "rowFace": true
    },
    "maxWords": 4,
    "font": "Inter, sans-serif",
    "weight": 700,
    "sizePx": 43,
    "accentFont": "FredokaOne, cursive",
    "accentWeight": 400,
    "contextSizePx": 14,
    "letterSpacingEm": -0.018,
    "behindSubject": true,
    "depth": {
      "blurPx": 6,
      "dim": 0.4,
      "shrink": 0.06
    },
    "positionYPct": 72.5,
    "color": "#FFFFFF",
    "accent": "#F6FBC5",
    "heroEnter": {
      "kind": "fadeLeft",
      "ms": 420,
      "em": 0.33,
      "outMs": 120
    },
    "rowEnter": {
      "kind": "fadeUp",
      "ms": 260,
      "outMs": 120
    },
    "animOutMs": 120,
    "animIn": "fade",
    "shadow": {
      "blurPx": 10,
      "color": "rgba(0,0,0,0.42)",
      "offsetY": 3
    }
  },
  {
    "id": "look_yawl",
    "name": "Yawl",
    "tags": [
      "Behind"
    ],
    "family": "stack",
    "pop": {
      "plainColor": true
    },
    "maxWords": 4,
    "font": "Inter, sans-serif",
    "weight": 900,
    "sizePx": 17,
    "transform": "lowercase",
    "behindSubject": true,
    "depth": {
      "blurPx": 6,
      "dim": 0.4,
      "shrink": 0.06
    },
    "variety": {
      "pattern": [
        "front",
        "behind",
        "front",
        "front",
        "behind"
      ],
      "layerOnly": true
    },
    "positionYPct": 23,
    "color": "#FFFFFF",
    "accent": "#E3FC3E",
    "linger": true,
    "animIn": "fadeUp",
    "animInMs": 220,
    "popoff": {
      "accentScale": 3,
      "leftPct": 3.6,
      "rightPct": 91.4,
      "step": 0.8,
      "accumulate": true
    },
    "stack": {
      "maxPerRow": 2,
      "rowScale": [
        1,
        1.9,
        3
      ],
      "rowGapEm": -0.16,
      "heroPair": true,
      "hyphenSplit": true
    },
    "shadow": {
      "blurPx": 16,
      "color": "rgba(0,0,0,0.45)",
      "offsetY": 3
    }
  },
  {
    "id": "look_abbey",
    "name": "Abbey",
    "tags": [
      "Behind"
    ],
    "family": "emphasis",
    "curveBodyAware": true,
    "maxWords": 4,
    "font": "Montserrat, sans-serif",
    "accentFont": "AbrilFatface, \"Times New Roman\", serif",
    "accentWeight": 400,
    "weight": 800,
    "sizePx": 22.7,
    "contextSizePx": 11.6,
    "behindSubject": true,
    "depth": {
      "blurPx": 6,
      "dim": 0.4,
      "shrink": 0.06
    },
    "variety": {
      "pattern": [
        "curve",
        "front",
        "behind",
        "front",
        "curve",
        "behind",
        "front",
        "curve"
      ],
      "behindYPct": 28.1,
      "behindScale": 5.69,
      "curveYPct": 15.6,
      "preserveBehind": true
    },
    "curve": {
      "radiusPct": 0.47
    },
    "positionYPct": 55.5,
    "color": "#FFFFFF",
    "accent": "#FFE451",
    "animIn": "fade",
    "animInMs": 30,
    "shadow": {
      "blurPx": 14,
      "color": "rgba(0,0,0,0.5)",
      "offsetY": 3
    }
  },
  {
    "id": "look_belfry",
    "name": "Belfry",
    "tags": [
      "Behind"
    ],
    "family": "stack",
    "maxWords": 3,
    "font": "Montserrat, sans-serif",
    "weight": 800,
    "sizePx": 22.7,
    "lineHeight": 1,
    "boxWidthPct": 100,
    "accentFont": "\"Dancing Script\", cursive",
    "accentWeight": 700,
    "accentFontVariants": [
      "\"Dancing Script\", cursive",
      "FredokaOne, cursive",
      "\"Dancing Script\", cursive"
    ],
    "behindSubject": true,
    "depth": {
      "blurPx": 6,
      "dim": 0.4,
      "shrink": 0.06
    },
    "positionYPct": 71.5,
    "color": "#FFFFFF",
    "accent": "#F4F1BE",
    "linger": true,
    "animIn": "fade",
    "animInMs": 450,
    "restOpacity": 0.5,
    "stack": {
      "maxPerRow": 2,
      "rowScale": [
        1.3,
        2.4,
        3.1
      ],
      "rowGapEm": 0.1,
      "shortHeroLetters": 4
    },
    "variety": {
      "pattern": [
        "front",
        "behind",
        "front",
        "front",
        "behind"
      ],
      "behindYPct": 30,
      "behindHeroScale": 1.61,
      "quietYPct": 18.6,
      "quietScale": 0.7
    },
    "shadow": {
      "blurPx": 8,
      "color": "rgba(0,0,0,0.25)",
      "offsetY": 2
    }
  },
  {
    "id": "look_cloister",
    "name": "Cloister",
    "tags": [
      "Behind"
    ],
    "family": "emphasis",
    "maxWords": 4,
    "lockup": "center",
    "pop": {
      "font": "Inter, sans-serif",
      "weight": 700,
      "chip": {
        "bg": "#F068A8",
        "radiusEm": 0.12,
        "padEm": [
          0.02,
          0.22
        ]
      }
    },
    "adjacentMarks": "pop",
    "font": "\"Instrument Serif\", serif",
    "weight": 400,
    "sizePx": 60,
    "contextSizePx": 20,
    "fitFactor": 1.85,
    "boxWidthPct": 100,
    "accentFont": "\"Syne\", sans-serif",
    "accentWeight": 400,
    "accentUppercase": true,
    "behindSubject": true,
    "depth": {
      "blurPx": 6,
      "dim": 0.4,
      "shrink": 0.06
    },
    "variety": {
      "pattern": [
        "front",
        "front",
        "behind",
        "front"
      ],
      "layerOnly": true
    },
    "dynamic": {
      "style": "around",
      "intensity": "balanced",
      "placementRegion": "mostly-lower",
      "consistentScale": true
    },
    "positionYPct": 52,
    "color": "#FFFFFF",
    "accent": "#171816",
    "chip": {
      "bg": "#F2EFE8",
      "radius": 2
    },
    "animIn": "fadeUp",
    "animInMs": 240,
    "animOutMs": 120,
    "jitter": {
      "rotateDeg": 1.6,
      "yEm": 0.03
    },
    "subjectOutline": {
      "color": "#FFD400",
      "px": 40
    },
    "shadow": {
      "blurPx": 8,
      "color": "rgba(15,24,15,0.32)",
      "offsetY": 2
    }
  },
  {
    "id": "look_dovecote",
    "name": "Dovecote",
    "tags": [
      "Behind"
    ],
    "family": "karaoke",
    "pop": {
      "plainColor": true,
      "heroOnlyScale": 1.34
    },
    "font": "\"Gloria Hallelujah\", cursive",
    "weight": 400,
    "sizePx": 25,
    "wrap": true,
    "lineHeight": 0.9,
    "accentScale": 1.34,
    "boxWidthPct": 90,
    "wordGapEm": 0.38,
    "behindSubject": true,
    "reveal": true,
    "positionYPct": 61,
    "color": "rgba(247,244,236,0.94)",
    "accent": "#F7F4EC",
    "markColor": "#FFD400",
    "linger": true,
    "animIn": "fade",
    "animInMs": 160,
    "restOpacity": 1,
    "jitter": {
      "rotateDeg": 3,
      "yEm": 0.05
    },
    "subjectOutline": {
      "color": "#FFD400",
      "px": 36
    },
    "shadow": {
      "blurPx": 10,
      "color": "rgba(0,0,0,0.45)",
      "offsetY": 2
    }
  },
  {
    "id": "look_effigy",
    "name": "Effigy",
    "tags": [
      "Behind"
    ],
    "family": "flat",
    "font": "Mynerve, cursive",
    "weight": 400,
    "sizePx": 27,
    "wordGapEm": 0.32,
    "accentFont": "Mynerve, cursive",
    "accentWeight": 400,
    "accentScale": 1.14,
    "behindSubject": true,
    "reveal": true,
    "positionYPct": 63.4,
    "wrapRows": 2,
    "color": "#FFFDF7",
    "accent": "#FFFDF7",
    "linger": true,
    "animIn": "fade",
    "animInMs": 140,
    "shadow": {
      "blurPx": 12,
      "color": "rgba(0,0,0,0.46)",
      "offsetY": 2
    },
    "echo": {
      "font": "Poppins, sans-serif",
      "weight": 600,
      "uppercase": true,
      "sizePx": 30,
      "yPct": 47.7,
      "persistMs": 2570,
      "inMs": 260,
      "outMs": 270,
      "swoosh": true
    }
  },
  {
    "id": "look_iron",
    "name": "Iron",
    "tags": [
      "Property"
    ],
    "family": "story",
    "story": "reel",
    "reel": "magenta-estate",
    "maxWords": 16,
    "font": "PoppinsStory, Poppins, sans-serif",
    "weight": 500,
    "sizePx": 52,
    "contextSizePx": 16,
    "wordGapEm": 0.16,
    "accentFont": "PoppinsStory, Poppins, sans-serif",
    "accentWeight": 700,
    "behindSubject": true,
    "positionYPct": 47,
    "color": "#FFFFFF",
    "accent": "#EC00B5",
    "shadow": {
      "blurPx": 14,
      "color": "rgba(0,0,0,0.5)",
      "offsetY": 3
    }
  },
  {
    "id": "look_jamb",
    "name": "Jamb",
    "tags": [
      "Property"
    ],
    "family": "story",
    "story": "reel",
    "reel": "dimension-story",
    "maxWords": 16,
    "font": "PoppinsStory, Poppins, sans-serif",
    "weight": 500,
    "sizePx": 52,
    "contextSizePx": 14,
    "wordGapEm": 0.16,
    "accentFont": "PoppinsStory, Poppins, sans-serif",
    "accentWeight": 700,
    "behindSubject": true,
    "positionYPct": 47,
    "color": "#FFFFFF",
    "accent": "#EC00B5",
    "shadow": {
      "blurPx": 14,
      "color": "rgba(0,0,0,0.5)",
      "offsetY": 3
    }
  },
  {
    "id": "look_oriel",
    "name": "Oriel",
    "tags": [
      "Spatial"
    ],
    "family": "spatial",
    "spatial": "red",
    "maxWords": 3,
    "font": "InterStory, Inter, sans-serif",
    "weight": 500,
    "sizePx": 17.5,
    "accentFont": "Anton, sans-serif",
    "accentWeight": 400,
    "behindSubject": true,
    "positionYPct": 50,
    "color": "#FFF8EE",
    "accent": "#B90000"
  },
  {
    "id": "look_lantern",
    "name": "Lantern",
    "tags": [
      "Spatial"
    ],
    "family": "spatial",
    "spatial": "yellow",
    "maxWords": 3,
    "font": "InterStory, Inter, sans-serif",
    "weight": 900,
    "sizePx": 18.25,
    "behindSubject": true,
    "positionYPct": 50,
    "color": "#FFFFFF",
    "accent": "#FFE000"
  },
  {
    "id": "look_atrium",
    "name": "Atrium",
    "tags": [
      "Spatial"
    ],
    "family": "spatial",
    "spatial": "white",
    "maxWords": 3,
    "font": "InterStory, Inter, sans-serif",
    "weight": 700,
    "sizePx": 21.25,
    "behindSubject": true,
    "positionYPct": 50,
    "color": "#F6EDE2",
    "accent": "#D00A07"
  },
  {
    "id": "look_mullion",
    "name": "Mullion",
    "tags": [
      "Behind"
    ],
    "family": "karaoke",
    "pop": {
      "plainColor": true,
      "rowFace": true
    },
    "maxWords": 4,
    "font": "\"Baloo 2\", sans-serif",
    "weight": 800,
    "sizePx": 20,
    "wordGapEm": 0.38,
    "behindSubject": true,
    "depth": {
      "blurPx": 6,
      "dim": 0.4,
      "shrink": 0.06
    },
    "positionYPct": 78.3,
    "color": "#FFFFFF",
    "accent": "#FFE14F",
    "animIn": "fade",
    "animInMs": 30,
    "restOpacity": 0.85,
    "shadow": {
      "blurPx": 16,
      "color": "rgba(0,0,0,0.6)",
      "offsetY": 5
    },
    "impact": {
      "font": "\"Baloo 2\", sans-serif",
      "weight": 800,
      "sizePx": 82,
      "yPct": 22.1,
      "widthPct": 92,
      "fitFactor": 0.761,
      "uppercase": true
    }
  },
  {
    "family": "story",
    "story": "reel",
    "maxWords": 16,
    "sizePx": 52,
    "wordGapEm": 0.16,
    "behindSubject": true,
    "positionYPct": 47,
    "reel": "dimension-story",
    "contextSizePx": 14,
    "id": "look_newel",
    "name": "Newel",
    "tags": [
      "Property"
    ],
    "font": "\"Instrument Serif\", serif",
    "weight": 400,
    "accentFont": "Gloock, serif",
    "accentWeight": 400,
    "color": "#F7F1E6",
    "accent": "#E9C989",
    "shadow": {
      "blurPx": 14,
      "color": "rgba(0,0,0,0.5)",
      "offsetY": 3
    },
    "reelTheme": {
      "heroInk": "solid",
      "accents": [
        "#EBCB8B",
        "#F6EEE0",
        "#D9A86C",
        "#F1DCAE"
      ],
      "shade": "#6B4B22",
      "heroWeight": 400,
      "heroItalic": "never",
      "heroTrackingEm": -0.02,
      "heroTuck": 0.34,
      "heroMotion": "rise",
      "supportMotion": "fade",
      "supportWeight": 400,
      "supportBoldWeight": 400,
      "supportColor": "#F7F1E6",
      "supportTrackingEm": -0.005,
      "supportItalic": "never"
    }
  },
  {
    "family": "story",
    "story": "reel",
    "maxWords": 16,
    "sizePx": 52,
    "wordGapEm": 0.16,
    "behindSubject": true,
    "positionYPct": 47,
    "reel": "dimension-story",
    "contextSizePx": 13,
    "id": "look_soffit",
    "name": "Soffit",
    "tags": [
      "Property"
    ],
    "font": "InterStory, Inter, sans-serif",
    "weight": 800,
    "accentFont": "Anton, sans-serif",
    "accentWeight": 400,
    "color": "#FFFFFF",
    "accent": "#FF5A2E",
    "shadow": {
      "blurPx": 14,
      "color": "rgba(0,0,0,0.5)",
      "offsetY": 3
    },
    "reelTheme": {
      "heroInk": "solid",
      "accents": [
        "#FF5A2E",
        "#FFD23F",
        "#F4F1EA",
        "#FF5A2E",
        "#FFD23F"
      ],
      "shade": "#3A1206",
      "heroWeight": 400,
      "heroItalic": "never",
      "heroUpper": true,
      "heroTrackingEm": 0.005,
      "heroTuck": 0.62,
      "heroMotion": "drop",
      "heroRotate": -3,
      "supportWeight": 700,
      "supportBoldWeight": 800,
      "supportColor": "#FFFFFF",
      "supportUpper": true,
      "supportTrackingEm": 0.06,
      "supportItalic": "never"
    }
  },
  {
    "family": "story",
    "story": "reel",
    "maxWords": 16,
    "sizePx": 52,
    "wordGapEm": 0.16,
    "behindSubject": true,
    "positionYPct": 47,
    "reel": "dimension-story",
    "contextSizePx": 14,
    "id": "look_casement",
    "name": "Casement",
    "tags": [
      "Property"
    ],
    "font": "MonaSans, sans-serif",
    "weight": 400,
    "accentFont": "ClashDisplay, sans-serif",
    "accentWeight": 400,
    "color": "#FFFFFF",
    "accent": "#9BE7FF",
    "shadow": {
      "blurPx": 14,
      "color": "rgba(0,0,0,0.5)",
      "offsetY": 3
    },
    "reelTheme": {
      "heroInk": "hollow",
      "accents": [
        "#9BE7FF",
        "#C9B8FF",
        "#A6F2C8",
        "#FFC9E4"
      ],
      "shade": "#1F2433",
      "heroWeight": 400,
      "heroItalic": "never",
      "heroTrackingEm": -0.01,
      "heroTuck": 0.33,
      "heroMotion": "wipe",
      "supportMotion": "type",
      "supportWeight": 400,
      "supportBoldWeight": 700,
      "supportColor": "#FFFFFF",
      "supportTrackingEm": -0.02,
      "supportItalic": "scene"
    }
  },
  {
    "family": "story",
    "story": "reel",
    "maxWords": 16,
    "sizePx": 52,
    "wordGapEm": 0.16,
    "behindSubject": true,
    "positionYPct": 47,
    "reel": "dimension-story",
    "contextSizePx": 14,
    "id": "look_sash",
    "name": "Sash",
    "tags": [
      "Property"
    ],
    "font": "Mynerve, cursive",
    "weight": 400,
    "accentFont": "Caveat, cursive",
    "accentWeight": 700,
    "color": "#FFF8EE",
    "accent": "#FFD6A5",
    "shadow": {
      "blurPx": 14,
      "color": "rgba(0,0,0,0.5)",
      "offsetY": 3
    },
    "reelTheme": {
      "heroInk": "solid",
      "accents": [
        "#FFFFFF",
        "#FFD6A5",
        "#CDEAC0",
        "#FFC8DD"
      ],
      "shade": "#8A7F74",
      "heroWeight": 700,
      "heroItalic": "never",
      "heroTrackingEm": 0,
      "heroTuck": 0.36,
      "heroMotion": "type",
      "heroRotate": -4,
      "supportMotion": "type",
      "supportWeight": 400,
      "supportBoldWeight": 400,
      "supportColor": "#FFF8EE",
      "supportTrackingEm": 0.01,
      "supportItalic": "never"
    }
  },
  {
    "family": "story",
    "story": "reel",
    "maxWords": 16,
    "sizePx": 52,
    "wordGapEm": 0.16,
    "behindSubject": true,
    "positionYPct": 47,
    "reel": "dimension-story",
    "contextSizePx": 14,
    "id": "look_muntin",
    "name": "Muntin",
    "tags": [
      "Property"
    ],
    "font": "InterStory, Inter, sans-serif",
    "weight": 500,
    "accentFont": "InterStory, Inter, sans-serif",
    "accentWeight": 800,
    "color": "#FFFFFF",
    "accent": "#9CC3FF",
    "shadow": {
      "blurPx": 14,
      "color": "rgba(0,0,0,0.5)",
      "offsetY": 3
    },
    "reelTheme": {
      "heroInk": "solid",
      "accents": [
        "#FFFFFF",
        "#9CC3FF"
      ],
      "shade": "#5C6B80",
      "heroWeight": 800,
      "heroItalic": "never",
      "heroTrackingEm": -0.035,
      "heroTuck": 0.4,
      "heroMotion": "blur",
      "heroAlign": "left",
      "planes": "front",
      "supportMotion": "fade",
      "supportWeight": 500,
      "supportBoldWeight": 600,
      "supportColor": "#FFFFFF",
      "supportTrackingEm": -0.01,
      "supportItalic": "never"
    }
  },
  {
    "family": "story",
    "story": "reel",
    "maxWords": 16,
    "sizePx": 52,
    "wordGapEm": 0.16,
    "behindSubject": true,
    "positionYPct": 47,
    "reel": "dimension-story",
    "contextSizePx": 12,
    "id": "look_louver",
    "name": "Louver",
    "tags": [
      "Property"
    ],
    "font": "\"Inter\", Helvetica, Arial, sans-serif",
    "weight": 700,
    "accentFont": "DrukWide, sans-serif",
    "accentWeight": 400,
    "color": "#FFFFFF",
    "accent": "#FF3B30",
    "shadow": {
      "blurPx": 14,
      "color": "rgba(0,0,0,0.5)",
      "offsetY": 3
    },
    "reelTheme": {
      "heroInk": "solid",
      "accents": [
        "#FFFFFF",
        "#FF3B30"
      ],
      "shade": "#3B0D0A",
      "heroWeight": 400,
      "heroItalic": "never",
      "heroUpper": true,
      "heroTrackingEm": -0.02,
      "heroTuck": 0.82,
      "heroMotion": "stretch",
      "heroAlign": "right",
      "supportWeight": 700,
      "supportBoldWeight": 700,
      "supportColor": "#FFFFFF",
      "supportUpper": true,
      "supportTrackingEm": 0.04,
      "supportItalic": "never"
    }
  },
  {
    "family": "story",
    "story": "reel",
    "maxWords": 16,
    "sizePx": 52,
    "wordGapEm": 0.16,
    "behindSubject": true,
    "positionYPct": 47,
    "reel": "dimension-story",
    "contextSizePx": 12,
    "id": "look_shutter",
    "name": "Shutter",
    "tags": [
      "Property"
    ],
    "font": "\"Instrument Sans\", sans-serif",
    "weight": 400,
    "accentFont": "\"Instrument Serif\", serif",
    "accentWeight": 400,
    "color": "#FFFFFF",
    "accent": "#FFE8D6",
    "shadow": {
      "blurPx": 14,
      "color": "rgba(0,0,0,0.5)",
      "offsetY": 3
    },
    "reelTheme": {
      "heroInk": "solid",
      "accents": [
        "#FFFFFF",
        "#FFE8D6"
      ],
      "shade": "#7A6A5C",
      "heroWeight": 400,
      "heroItalic": "never",
      "heroTrackingEm": -0.02,
      "heroTuck": 0.3,
      "heroMotion": "zoom",
      "planes": "behind",
      "supportMotion": "fade",
      "supportWeight": 400,
      "supportBoldWeight": 400,
      "supportColor": "#FFFFFF",
      "supportUpper": true,
      "supportTrackingEm": 0.14,
      "supportItalic": "never"
    }
  },
  {
    "family": "story",
    "story": "reel",
    "maxWords": 16,
    "sizePx": 52,
    "wordGapEm": 0.16,
    "behindSubject": true,
    "positionYPct": 47,
    "reel": "dimension-story",
    "contextSizePx": 12,
    "id": "look_patio",
    "name": "Patio",
    "tags": [
      "Property"
    ],
    "font": "InterStory, Inter, sans-serif",
    "weight": 700,
    "accentFont": "\"Press Start 2P\", monospace",
    "accentWeight": 400,
    "color": "#FFFFFF",
    "accent": "#39FF14",
    "shadow": {
      "blurPx": 14,
      "color": "rgba(0,0,0,0.5)",
      "offsetY": 3
    },
    "reelTheme": {
      "heroInk": "solid",
      "accents": [
        "#39FF14",
        "#FF2BD6",
        "#00E5FF",
        "#FFE600"
      ],
      "shade": "#0B1F0B",
      "heroGlow": "accent",
      "heroWeight": 400,
      "heroItalic": "never",
      "heroUpper": true,
      "heroTrackingEm": 0,
      "heroTuck": 0.78,
      "heroMotion": "flip",
      "supportMotion": "bounce",
      "supportWeight": 700,
      "supportBoldWeight": 700,
      "supportColor": "#FFFFFF",
      "supportUpper": true,
      "supportTrackingEm": 0.08,
      "supportItalic": "never"
    }
  },
  {
    "family": "story",
    "story": "reel",
    "maxWords": 16,
    "sizePx": 52,
    "wordGapEm": 0.16,
    "behindSubject": true,
    "positionYPct": 47,
    "reel": "dimension-story",
    "contextSizePx": 12,
    "id": "look_porch",
    "name": "Porch",
    "tags": [
      "Property"
    ],
    "font": "\"Bungee\", sans-serif",
    "weight": 400,
    "accentFont": "\"Luckiest Guy\", sans-serif",
    "accentWeight": 400,
    "color": "#FFFFFF",
    "accent": "#FFD60A",
    "shadow": {
      "blurPx": 14,
      "color": "rgba(0,0,0,0.5)",
      "offsetY": 3
    },
    "reelTheme": {
      "heroInk": "solid",
      "accents": [
        "#FFD60A",
        "#FF4D6D",
        "#4CC9F0",
        "#80ED99"
      ],
      "shade": "#5C3B00",
      "heroStroke": {
        "color": "#111111",
        "em": 0.07
      },
      "heroWeight": 400,
      "heroItalic": "never",
      "heroUpper": true,
      "heroTrackingEm": 0.01,
      "heroTuck": 0.44,
      "heroMotion": "pop",
      "heroRotate": -4,
      "supportMotion": "bounce",
      "supportWeight": 400,
      "supportBoldWeight": 400,
      "supportColor": "#FFFFFF",
      "supportUpper": true,
      "supportTrackingEm": 0.02,
      "supportItalic": "never"
    }
  },
  {
    "family": "story",
    "story": "reel",
    "maxWords": 16,
    "sizePx": 52,
    "wordGapEm": 0.16,
    "behindSubject": true,
    "positionYPct": 47,
    "reel": "magenta-estate",
    "contextSizePx": 16,
    "id": "look_awning",
    "name": "Awning",
    "tags": [
      "Property"
    ],
    "font": "\"Instrument Serif\", serif",
    "weight": 400,
    "accentFont": "AbrilFatface, serif",
    "accentWeight": 400,
    "color": "#FFF8EC",
    "accent": "#E2B254",
    "shadow": {
      "blurPx": 14,
      "color": "rgba(0,0,0,0.5)",
      "offsetY": 3
    },
    "reelTheme": {
      "heroInk": "solid",
      "gradient": [
        "#FFF0C2",
        "#E2B254",
        "#A06E22"
      ],
      "twin": "#2A1C08",
      "stroke": [
        "#F7E2A8",
        "#D9A747",
        "#8F611B"
      ],
      "figureInk": "fill",
      "figureWeight": 400,
      "glow": "#E8B54A",
      "glowBack": "#C9922B",
      "banner": "#B98A33",
      "heroWeight": 400,
      "heroItalic": "never",
      "heroTrackingEm": -0.01,
      "supportColor": "#FFF8EC",
      "supportItalic": "never"
    }
  },
  {
    "family": "story",
    "story": "reel",
    "maxWords": 16,
    "sizePx": 52,
    "wordGapEm": 0.16,
    "behindSubject": true,
    "positionYPct": 47,
    "reel": "magenta-estate",
    "contextSizePx": 16,
    "id": "look_sill",
    "name": "Sill",
    "tags": [
      "Property"
    ],
    "font": "MonaSans, sans-serif",
    "weight": 400,
    "accentFont": "ClashDisplay, sans-serif",
    "accentWeight": 400,
    "color": "#FFFFFF",
    "accent": "#18C8B4",
    "shadow": {
      "blurPx": 14,
      "color": "rgba(0,0,0,0.5)",
      "offsetY": 3
    },
    "reelTheme": {
      "heroInk": "inception",
      "gradient": [
        "#B8FFF1",
        "#18C8B4",
        "#0B7C86"
      ],
      "twin": "#04282B",
      "stroke": [
        "#A3FBEA",
        "#19BFAE",
        "#08707A"
      ],
      "outlineBlend": "normal",
      "figureWeight": 400,
      "glow": "#13D3BF",
      "glowBack": "#0FB5A3",
      "heroWeight": 400,
      "heroItalic": "never",
      "heroTrackingEm": -0.02,
      "heroMotion": "zoom"
    }
  },
  {
    "family": "story",
    "story": "reel",
    "maxWords": 16,
    "sizePx": 52,
    "wordGapEm": 0.16,
    "behindSubject": true,
    "positionYPct": 47,
    "reel": "magenta-estate",
    "contextSizePx": 16,
    "id": "look_joist",
    "name": "Joist",
    "tags": [
      "Property"
    ],
    "font": "InterStory, Inter, sans-serif",
    "weight": 500,
    "accentFont": "ArchivoBlack, sans-serif",
    "accentWeight": 400,
    "color": "#FFFFFF",
    "accent": "#FF7A3D",
    "shadow": {
      "blurPx": 14,
      "color": "rgba(0,0,0,0.5)",
      "offsetY": 3
    },
    "reelTheme": {
      "heroInk": "solid",
      "gradient": [
        "#FFD36E",
        "#FF7A3D",
        "#FF2E7E"
      ],
      "twin": "#2B0A1A",
      "stroke": [
        "#FFD36E",
        "#FF7A3D",
        "#E8246C"
      ],
      "outlineBlend": "normal",
      "figureWeight": 400,
      "glow": "#FF6A3D",
      "glowBack": "#FF4D5E",
      "banner": "#FF4D5E",
      "heroWeight": 400,
      "heroItalic": "scene",
      "heroUpper": true,
      "heroTrackingEm": -0.01,
      "heroMotion": "skid"
    }
  },
  {
    "family": "story",
    "story": "reel",
    "maxWords": 16,
    "sizePx": 52,
    "wordGapEm": 0.16,
    "behindSubject": true,
    "positionYPct": 47,
    "reel": "magenta-estate",
    "contextSizePx": 16,
    "id": "look_foyer",
    "name": "Foyer",
    "tags": [
      "Property"
    ],
    "font": "\"Instrument Serif\", serif",
    "weight": 400,
    "accentFont": "\"Pinyon Script\", cursive",
    "accentWeight": 400,
    "color": "#FFF3F5",
    "accent": "#E8A0B4",
    "shadow": {
      "blurPx": 14,
      "color": "rgba(0,0,0,0.5)",
      "offsetY": 3
    },
    "reelTheme": {
      "heroInk": "solid",
      "gradient": [
        "#FFE3E8",
        "#E8A0B4",
        "#B5657E"
      ],
      "twin": "#3A1420",
      "stroke": [
        "#FFE3E8",
        "#E8A0B4",
        "#B5657E"
      ],
      "figureInk": "fill",
      "figureWeight": 400,
      "glow": "#E8A0B4",
      "glowBack": "#B5657E",
      "banner": "#B5657E",
      "heroWeight": 400,
      "heroItalic": "never",
      "heroTrackingEm": 0,
      "heroMotion": "wipe",
      "supportColor": "#FFF3F5",
      "supportItalic": "never"
    }
  },
  {
    "family": "story",
    "story": "reel",
    "maxWords": 16,
    "sizePx": 52,
    "wordGapEm": 0.16,
    "behindSubject": true,
    "positionYPct": 47,
    "reel": "magenta-estate",
    "contextSizePx": 16,
    "id": "look_loft",
    "name": "Loft",
    "tags": [
      "Property"
    ],
    "font": "Montserrat, sans-serif",
    "weight": 500,
    "accentFont": "Montserrat, sans-serif",
    "accentWeight": 800,
    "color": "#FFFFFF",
    "accent": "#D9DDE3",
    "shadow": {
      "blurPx": 14,
      "color": "rgba(0,0,0,0.5)",
      "offsetY": 3
    },
    "reelTheme": {
      "heroInk": "solid",
      "gradient": [
        "#FFFFFF",
        "#F4F5F7",
        "#D9DDE3"
      ],
      "twin": "#1B1E24",
      "stroke": [
        "#FFFFFF",
        "#E6E9EE",
        "#C9CED6"
      ],
      "outlineBlend": "normal",
      "figureWeight": 800,
      "glow": "#6E8BFF",
      "glowBack": "#1A2238",
      "banner": "#1A2238",
      "heroWeight": 800,
      "heroItalic": "never",
      "heroTrackingEm": -0.03,
      "heroMotion": "blur",
      "supportItalic": "never"
    }
  },
  {
    "family": "story",
    "story": "reel",
    "maxWords": 16,
    "sizePx": 52,
    "wordGapEm": 0.16,
    "behindSubject": true,
    "positionYPct": 47,
    "reel": "magenta-estate",
    "contextSizePx": 16,
    "id": "look_attic",
    "name": "Attic",
    "tags": [
      "Property"
    ],
    "font": "InterStory, Inter, sans-serif",
    "weight": 600,
    "accentFont": "\"Bebas Neue\", sans-serif",
    "accentWeight": 400,
    "color": "#FFFFFF",
    "accent": "#FF4FD8",
    "shadow": {
      "blurPx": 14,
      "color": "rgba(0,0,0,0.5)",
      "offsetY": 3
    },
    "reelTheme": {
      "heroInk": "solid",
      "gradient": [
        "#FFE6F7",
        "#FF4FD8",
        "#C800A1"
      ],
      "twin": "#3A0030",
      "stroke": [
        "#FFE6F7",
        "#FF4FD8",
        "#C800A1"
      ],
      "heroGlow": "#FF4FD8",
      "outlineBlend": "normal",
      "figureWeight": 400,
      "glow": "#FF4FD8",
      "glowBack": "#B0007E",
      "banner": "#B0007E",
      "heroWeight": 400,
      "heroItalic": "never",
      "heroUpper": true,
      "heroTrackingEm": 0.02,
      "heroMotion": "flicker",
      "supportItalic": "never"
    }
  },
  {
    "family": "story",
    "story": "reel",
    "maxWords": 16,
    "sizePx": 52,
    "wordGapEm": 0.16,
    "behindSubject": true,
    "positionYPct": 47,
    "reel": "magenta-estate",
    "contextSizePx": 16,
    "id": "look_chimney",
    "name": "Chimney",
    "tags": [
      "Property"
    ],
    "font": "\"Instrument Sans\", sans-serif",
    "weight": 400,
    "accentFont": "\"Rubik\", sans-serif",
    "accentWeight": 400,
    "color": "#FFFFFF",
    "accent": "#E53935",
    "shadow": {
      "blurPx": 14,
      "color": "rgba(0,0,0,0.5)",
      "offsetY": 3
    },
    "reelTheme": {
      "heroInk": "solid",
      "gradient": [
        "#FF6B5E",
        "#E53935",
        "#B71C1C"
      ],
      "twin": "#2B0505",
      "stroke": [
        "#FF6B5E",
        "#E53935",
        "#B71C1C"
      ],
      "outlineBlend": "normal",
      "figureWeight": 400,
      "glow": "#E53935",
      "glowBack": "#8E1414",
      "banner": "#B71C1C",
      "heroWeight": 400,
      "heroItalic": "never",
      "heroUpper": true,
      "heroTrackingEm": 0,
      "heroMotion": "stamp",
      "heroRotate": -6,
      "supportItalic": "never"
    }
  },
  {
    "family": "story",
    "story": "reel",
    "maxWords": 16,
    "sizePx": 52,
    "wordGapEm": 0.16,
    "behindSubject": true,
    "positionYPct": 47,
    "reel": "magenta-estate",
    "contextSizePx": 16,
    "id": "look_baluster",
    "name": "Baluster",
    "tags": [
      "Property"
    ],
    "font": "\"Special Elite\", monospace",
    "weight": 400,
    "accentFont": "\"Special Elite\", monospace",
    "accentWeight": 400,
    "color": "#F2EBDD",
    "accent": "#D9CBB2",
    "shadow": {
      "blurPx": 14,
      "color": "rgba(0,0,0,0.5)",
      "offsetY": 3
    },
    "reelTheme": {
      "heroInk": "solid",
      "gradient": [
        "#FFFDF6",
        "#F2EBDD",
        "#D9CBB2"
      ],
      "twin": "#2A2418",
      "stroke": [
        "#FFFDF6",
        "#F2EBDD",
        "#D9CBB2"
      ],
      "figureInk": "fill",
      "figureWeight": 400,
      "glow": "#D9CBB2",
      "glowBack": "#3A3222",
      "banner": "#3A3222",
      "heroWeight": 400,
      "heroItalic": "never",
      "heroTrackingEm": 0,
      "heroMotion": "type",
      "supportColor": "#F2EBDD",
      "supportItalic": "never"
    }
  },
  {
    "family": "story",
    "story": "reel",
    "maxWords": 16,
    "sizePx": 52,
    "wordGapEm": 0.16,
    "behindSubject": true,
    "positionYPct": 47,
    "reel": "magenta-estate",
    "contextSizePx": 16,
    "id": "look_banister",
    "name": "Banister",
    "tags": [
      "Property"
    ],
    "font": "\"Kaushan Script\", cursive",
    "weight": 400,
    "accentFont": "\"Rubik Spray Paint\", sans-serif",
    "accentWeight": 400,
    "color": "#FFFFFF",
    "accent": "#70FF8F",
    "shadow": {
      "blurPx": 14,
      "color": "rgba(0,0,0,0.5)",
      "offsetY": 3
    },
    "reelTheme": {
      "heroInk": "solid",
      "gradient": [
        "#E9FF70",
        "#70FF8F",
        "#00D9C0"
      ],
      "twin": "#06231E",
      "stroke": [
        "#E9FF70",
        "#70FF8F",
        "#00D9C0"
      ],
      "outlineBlend": "normal",
      "figureWeight": 400,
      "glow": "#70FF8F",
      "glowBack": "#00A890",
      "banner": "#00A890",
      "heroWeight": 400,
      "heroItalic": "never",
      "heroTrackingEm": 0,
      "heroMotion": "pop",
      "heroRotate": 4,
      "supportItalic": "never"
    }
  },
  {
    "family": "spatial",
    "maxWords": 3,
    "behindSubject": true,
    "positionYPct": 50,
    "id": "look_oculus",
    "name": "Oculus",
    "tags": [
      "Spatial"
    ],
    "spatial": "red",
    "font": "\"Instrument Serif\", serif",
    "weight": 400,
    "sizePx": 19.5,
    "accentFont": "Gloock, serif",
    "accentWeight": 400,
    "color": "#F6F0E6",
    "accent": "#F2C46D",
    "spatialTheme": {
      "caption": {
        "fontSizePx": 78,
        "color": "#F6F0E6",
        "emphasisColor": "#F2C46D"
      },
      "faces": {
        "inter-medium": "instrument-serif",
        "anton": "gloock",
        "inter-black": "gloock",
        "bagel-fat": "abril"
      },
      "puffy": "#F2C46D"
    }
  },
  {
    "family": "spatial",
    "maxWords": 3,
    "behindSubject": true,
    "positionYPct": 50,
    "id": "look_fanlight",
    "name": "Fanlight",
    "tags": [
      "Spatial"
    ],
    "spatial": "red",
    "font": "\"Baloo 2\", sans-serif",
    "weight": 800,
    "sizePx": 17.5,
    "accentFont": "\"Bagel Fat One\", sans-serif",
    "accentWeight": 400,
    "color": "#FFFFFF",
    "accent": "#FF4F9A",
    "spatialTheme": {
      "caption": {
        "fontSizePx": 70,
        "color": "#FFFFFF",
        "emphasisColor": "#FF4F9A"
      },
      "faces": {
        "inter-medium": "baloo",
        "anton": "bagel-fat",
        "inter-black": "bagel-fat"
      },
      "puffy": "#7B61FF",
      "layout": "orbit",
      "texture": "puffy",
      "motion": "spring"
    }
  },
  {
    "family": "spatial",
    "maxWords": 3,
    "behindSubject": true,
    "positionYPct": 50,
    "id": "look_clerestory",
    "name": "Clerestory",
    "tags": [
      "Spatial"
    ],
    "spatial": "red",
    "font": "Montserrat, sans-serif",
    "weight": 500,
    "sizePx": 17.5,
    "accentFont": "\"Bebas Neue\", sans-serif",
    "accentWeight": 400,
    "color": "#F2F6FF",
    "accent": "#C6FF3A",
    "spatialTheme": {
      "caption": {
        "fontSizePx": 70,
        "color": "#F2F6FF",
        "emphasisColor": "#C6FF3A"
      },
      "faces": {
        "inter-medium": "montserrat-medium",
        "anton": "bebas",
        "inter-black": "bebas",
        "bagel-fat": "archivo-black"
      },
      "puffy": "#C6FF3A",
      "layout": "pairs",
      "texture": "extruded",
      "motion": "snap"
    }
  },
  {
    "family": "spatial",
    "maxWords": 3,
    "behindSubject": true,
    "positionYPct": 50,
    "id": "look_tread",
    "name": "Tread",
    "tags": [
      "Spatial"
    ],
    "spatial": "red",
    "font": "Caveat, cursive",
    "weight": 700,
    "sizePx": 21,
    "accentFont": "\"Gloria Hallelujah\", cursive",
    "accentWeight": 400,
    "color": "#FFFDF5",
    "accent": "#FFE45C",
    "spatialTheme": {
      "caption": {
        "fontSizePx": 98,
        "color": "#FFFDF5",
        "emphasisColor": "#FFE45C"
      },
      "faces": {
        "inter-medium": "caveat",
        "anton": "gloria",
        "inter-black": "gloria",
        "bagel-fat": "gloria"
      },
      "puffy": "#FFE45C",
      "layout": "stair",
      "texture": "flat",
      "motion": "paint"
    }
  },
  {
    "family": "spatial",
    "maxWords": 3,
    "behindSubject": true,
    "positionYPct": 50,
    "id": "look_riser",
    "name": "Riser",
    "tags": [
      "Spatial"
    ],
    "spatial": "red",
    "font": "InterStory, Inter, sans-serif",
    "weight": 500,
    "sizePx": 17.5,
    "accentFont": "\"Inter\", Helvetica, Arial, sans-serif",
    "accentWeight": 700,
    "color": "#FFFFFF",
    "accent": "#8AB4FF",
    "spatialTheme": {
      "caption": {
        "fontSizePx": 70,
        "color": "#FFFFFF",
        "emphasisColor": "#8AB4FF"
      },
      "faces": {
        "anton": "helvetica",
        "inter-black": "helvetica",
        "bagel-fat": "helvetica"
      },
      "puffy": "#8AB4FF",
      "layout": "poster",
      "texture": "flat",
      "motion": "glide",
      "drift": "off"
    }
  },
  {
    "family": "spatial",
    "maxWords": 3,
    "behindSubject": true,
    "positionYPct": 50,
    "id": "look_parquet",
    "name": "Parquet",
    "tags": [
      "Spatial"
    ],
    "spatial": "red",
    "font": "Unna, serif",
    "weight": 400,
    "sizePx": 19,
    "accentFont": "\"Dancing Script\", cursive",
    "accentWeight": 700,
    "color": "#FFF6EE",
    "accent": "#F7B2C4",
    "spatialTheme": {
      "caption": {
        "fontSizePx": 76,
        "color": "#FFF6EE",
        "emphasisColor": "#F7B2C4"
      },
      "faces": {
        "inter-medium": "unna",
        "anton": "dancing",
        "inter-black": "dancing",
        "bagel-fat": "dancing"
      },
      "puffy": "#F7B2C4",
      "texture": "flat",
      "motion": "land",
      "keepCase": true
    }
  },
  {
    "family": "spatial",
    "maxWords": 3,
    "behindSubject": true,
    "positionYPct": 50,
    "id": "look_terrazzo",
    "name": "Terrazzo",
    "tags": [
      "Spatial"
    ],
    "spatial": "red",
    "font": "\"Instrument Sans\", sans-serif",
    "weight": 400,
    "sizePx": 17.5,
    "accentFont": "\"Playfair Display\", serif",
    "accentWeight": 700,
    "color": "#FFFFFF",
    "accent": "#FF6F59",
    "spatialTheme": {
      "caption": {
        "fontSizePx": 70,
        "color": "#FFFFFF",
        "emphasisColor": "#FF6F59"
      },
      "faces": {
        "inter-medium": "instrument-sans",
        "anton": "playfair-italic",
        "inter-black": "playfair-italic",
        "bagel-fat": "playfair-italic"
      },
      "puffy": "#FF6F59",
      "layout": "stack",
      "texture": "flat",
      "motion": "swing"
    }
  },
  {
    "family": "spatial",
    "maxWords": 3,
    "behindSubject": true,
    "positionYPct": 50,
    "id": "look_fresco",
    "name": "Fresco",
    "tags": [
      "Spatial"
    ],
    "spatial": "red",
    "font": "\"Kaushan Script\", cursive",
    "weight": 400,
    "sizePx": 18,
    "accentFont": "\"Rubik Spray Paint\", sans-serif",
    "accentWeight": 400,
    "color": "#FFFFFF",
    "accent": "#B6FF3B",
    "spatialTheme": {
      "caption": {
        "fontSizePx": 72,
        "color": "#FFFFFF",
        "emphasisColor": "#B6FF3B"
      },
      "faces": {
        "inter-medium": "kaushan",
        "anton": "spray",
        "inter-black": "spray",
        "bagel-fat": "spray"
      },
      "puffy": "#FF3BAA",
      "texture": "flat",
      "motion": "burst"
    }
  },
  {
    "family": "spatial",
    "maxWords": 3,
    "behindSubject": true,
    "positionYPct": 50,
    "id": "look_mural",
    "name": "Mural",
    "tags": [
      "Spatial"
    ],
    "spatial": "red",
    "font": "\"Bungee\", sans-serif",
    "weight": 400,
    "sizePx": 16.5,
    "accentFont": "\"Luckiest Guy\", sans-serif",
    "accentWeight": 400,
    "color": "#FFFFFF",
    "accent": "#FFD60A",
    "spatialTheme": {
      "caption": {
        "fontSizePx": 66,
        "color": "#FFFFFF",
        "emphasisColor": "#FFD60A",
        "heroOutline": 0.05
      },
      "faces": {
        "inter-medium": "komika",
        "anton": "luckiest",
        "inter-black": "luckiest",
        "bagel-fat": "luckiest"
      },
      "puffy": "#FFD60A",
      "texture": "extruded",
      "motion": "zoom"
    }
  },
  {
    "family": "spatial",
    "maxWords": 3,
    "behindSubject": true,
    "positionYPct": 50,
    "id": "look_gazebo",
    "name": "Gazebo",
    "tags": [
      "Spatial"
    ],
    "spatial": "yellow",
    "font": "ArchivoBlack, sans-serif",
    "weight": 400,
    "sizePx": 18.25,
    "color": "#FFFFFF",
    "accent": "#8FF3FF",
    "spatialTheme": {
      "caption": {
        "fontSizePx": 70,
        "color": "#FFFFFF",
        "emphasisColor": "#8FF3FF",
        "glow": {
          "deep": "#0A6FD0",
          "light": "#ECFFFF",
          "sand": "#8EA6BC",
          "warm": [
            0,
            84,
            255
          ],
          "hot": [
            150,
            246,
            255
          ]
        }
      },
      "faces": {
        "inter-black": "archivo-black"
      }
    }
  },
  {
    "family": "spatial",
    "maxWords": 3,
    "behindSubject": true,
    "positionYPct": 50,
    "id": "look_eave",
    "name": "Eave",
    "tags": [
      "Spatial"
    ],
    "spatial": "yellow",
    "font": "AbrilFatface, serif",
    "weight": 400,
    "sizePx": 19,
    "color": "#FFF6EA",
    "accent": "#FF8A5B",
    "spatialTheme": {
      "caption": {
        "fontSizePx": 76,
        "color": "#FFF6EA",
        "emphasisColor": "#FF8A5B",
        "glow": {
          "deep": "#C2185B",
          "light": "#FFD9B8",
          "sand": "#B8917B",
          "warm": [
            255,
            30,
            96
          ],
          "hot": [
            255,
            196,
            128
          ]
        }
      },
      "faces": {
        "inter-black": "abril"
      }
    }
  },
  {
    "family": "spatial",
    "maxWords": 3,
    "behindSubject": true,
    "positionYPct": 50,
    "id": "look_adobe",
    "name": "Adobe",
    "tags": [
      "Spatial"
    ],
    "spatial": "yellow",
    "font": "\"Special Elite\", monospace",
    "weight": 400,
    "sizePx": 18,
    "color": "#F5EFE0",
    "accent": "#FFB347",
    "spatialTheme": {
      "caption": {
        "fontSizePx": 72,
        "color": "#F5EFE0",
        "emphasisColor": "#FFB347",
        "rowTrackingEm": -0.01,
        "glow": {
          "deep": "#B85C00",
          "light": "#FFE0A3",
          "sand": "#A08C6C",
          "warm": [
            255,
            110,
            0
          ],
          "hot": [
            255,
            222,
            140
          ]
        }
      },
      "faces": {
        "inter-black": "special-elite"
      }
    }
  },
  {
    "family": "spatial",
    "maxWords": 3,
    "behindSubject": true,
    "positionYPct": 50,
    "id": "look_tile",
    "name": "Tile",
    "tags": [
      "Spatial"
    ],
    "spatial": "yellow",
    "font": "FredokaOne, sans-serif",
    "weight": 400,
    "sizePx": 18.5,
    "color": "#FFFFFF",
    "accent": "#C3A8FF",
    "spatialTheme": {
      "caption": {
        "fontSizePx": 74,
        "color": "#FFFFFF",
        "emphasisColor": "#C3A8FF",
        "rowTrackingEm": -0.02,
        "glow": {
          "deep": "#6A3FE0",
          "light": "#F1EAFF",
          "sand": "#A79DBB",
          "warm": [
            110,
            60,
            255
          ],
          "hot": [
            220,
            200,
            255
          ]
        }
      },
      "faces": {
        "inter-black": "fredoka"
      }
    }
  },
  {
    "family": "spatial",
    "maxWords": 3,
    "behindSubject": true,
    "positionYPct": 50,
    "id": "look_thatch",
    "name": "Thatch",
    "tags": [
      "Spatial"
    ],
    "spatial": "yellow",
    "font": "Caveat, cursive",
    "weight": 700,
    "sizePx": 22,
    "color": "#FFFFFF",
    "accent": "#FF8FD1",
    "spatialTheme": {
      "caption": {
        "fontSizePx": 88,
        "color": "#FFFFFF",
        "emphasisColor": "#FF8FD1",
        "rowTrackingEm": 0,
        "glow": {
          "deep": "#C2187A",
          "light": "#FFE0F2",
          "sand": "#B68FA5",
          "warm": [
            255,
            40,
            150
          ],
          "hot": [
            255,
            200,
            235
          ]
        }
      },
      "faces": {
        "inter-black": "caveat"
      }
    }
  },
  {
    "family": "spatial",
    "maxWords": 3,
    "behindSubject": true,
    "positionYPct": 50,
    "id": "look_dome",
    "name": "Dome",
    "tags": [
      "Spatial"
    ],
    "spatial": "white",
    "font": "ClashDisplay, sans-serif",
    "weight": 400,
    "sizePx": 20,
    "transform": "uppercase",
    "color": "#FFFFFF",
    "accent": "#FFC53D",
    "spatialTheme": {
      "caption": {
        "fontSizePx": 80,
        "color": "#FFFFFF",
        "emphasisColor": "#FFC53D",
        "textTransform": "uppercase"
      },
      "faces": {
        "inter-bold": "clash"
      },
      "texture": "flat"
    }
  },
  {
    "family": "spatial",
    "maxWords": 3,
    "behindSubject": true,
    "positionYPct": 50,
    "id": "look_stucco",
    "name": "Stucco",
    "tags": [
      "Spatial"
    ],
    "spatial": "white",
    "font": "Gloock, serif",
    "weight": 400,
    "sizePx": 21,
    "color": "#F7F1E6",
    "accent": "#E2B254",
    "spatialTheme": {
      "caption": {
        "fontSizePx": 84,
        "color": "#F7F1E6",
        "emphasisColor": "#E2B254"
      },
      "faces": {
        "inter-bold": "gloock"
      },
      "texture": "flat",
      "motion": "paint"
    }
  },
  {
    "family": "spatial",
    "maxWords": 3,
    "behindSubject": true,
    "positionYPct": 50,
    "id": "look_shingle",
    "name": "Shingle",
    "tags": [
      "Spatial"
    ],
    "spatial": "white",
    "font": "Futura, sans-serif",
    "weight": 900,
    "sizePx": 20,
    "color": "#FFFFFF",
    "accent": "#FF2BD6",
    "spatialTheme": {
      "caption": {
        "fontSizePx": 80,
        "color": "#FFFFFF",
        "emphasisColor": "#FFC2F3",
        "neon": "#FF2BD6"
      },
      "faces": {
        "inter-bold": "futura-heavy"
      },
      "texture": "flat",
      "motion": "zoom"
    }
  },
  {
    "family": "spatial",
    "maxWords": 3,
    "behindSubject": true,
    "positionYPct": 50,
    "id": "look_lath",
    "name": "Lath",
    "tags": [
      "Spatial"
    ],
    "spatial": "white",
    "font": "\"Gloria Hallelujah\", cursive",
    "weight": 400,
    "sizePx": 19,
    "color": "#FFFFFF",
    "accent": "#5CE1E6",
    "spatialTheme": {
      "caption": {
        "fontSizePx": 76,
        "color": "#FFFFFF",
        "emphasisColor": "#5CE1E6"
      },
      "faces": {
        "inter-bold": "gloria"
      },
      "texture": "flat",
      "motion": "spring"
    }
  },
  {
    "id": "ae_bold_poster",
    "name": "Bold",
    "tags": [
      "AI Edits",
      "Bold"
    ],
    "family": "aiedit",
    "aiedit": "pop-bold",
    "boldLook": "poster",
    "font": "\"AE Bricolage Grotesque\", \"Bricolage Grotesque\", sans-serif",
    "weight": 500,
    "sizePx": 17.5,
    "color": "#111111",
    "accent": "#111111",
    "positionYPct": 73.2,
    "maxWords": 4,
    "behindSubject": true
  },
  {
    "id": "ae_bold_b02",
    "name": "Tape",
    "tags": [
      "AI Edits",
      "Bold"
    ],
    "family": "aiedit",
    "aiedit": "pop-bold",
    "boldLook": "b02",
    "font": "\"AE Bricolage Grotesque\", \"Bricolage Grotesque\", sans-serif",
    "weight": 500,
    "sizePx": 17.5,
    "color": "#111111",
    "accent": "#111111",
    "positionYPct": 73.2,
    "maxWords": 4,
    "behindSubject": true
  }
] as unknown) as CaptikLookSpec[];

export const CAPTIK_LOOK_SPEC_MAP: Record<string, CaptikLookSpec> = Object.fromEntries(
  CAPTIK_LOOK_SPECS.map((s) => [s.id, s])
);

export interface CaptikGoogleFont {
  family: string;
  name?: string;
  weights: number[];
  weight?: number;
  italic?: boolean;
  cat: "display" | "sans" | "serif" | "mono" | "hand" | string;
  category?: string;
  scripts?: string[];
}

const RAW_CAPTIK_GOOGLE_FONTS: Array<{
  name: string;
  weight?: number;
  category: string;
  scripts?: string[];
  scriptOnly?: boolean;
}> = [
  {
    "name": "Bebas Neue",
    "weight": 400,
    "category": "display"
  },
  {
    "name": "Oswald",
    "weight": 700,
    "category": "display"
  },
  {
    "name": "Righteous",
    "weight": 400,
    "category": "display"
  },
  {
    "name": "Bungee",
    "weight": 400,
    "category": "display"
  },
  {
    "name": "Lilita One",
    "weight": 400,
    "category": "display"
  },
  {
    "name": "Russo One",
    "weight": 400,
    "category": "display"
  },
  {
    "name": "Archivo Black",
    "weight": 400,
    "category": "display"
  },
  {
    "name": "Syne",
    "weight": 800,
    "category": "display"
  },
  {
    "name": "Teko",
    "weight": 700,
    "category": "display",
    "scripts": [
      "devanagari"
    ]
  },
  {
    "name": "Audiowide",
    "weight": 400,
    "category": "display"
  },
  {
    "name": "Fredoka One",
    "weight": 400,
    "category": "display"
  },
  {
    "name": "Exo 2",
    "weight": 700,
    "category": "display"
  },
  {
    "name": "Roboto",
    "weight": 700,
    "category": "sans"
  },
  {
    "name": "Open Sans",
    "weight": 700,
    "category": "sans"
  },
  {
    "name": "Lato",
    "weight": 700,
    "category": "sans"
  },
  {
    "name": "Raleway",
    "weight": 800,
    "category": "sans"
  },
  {
    "name": "Nunito",
    "weight": 800,
    "category": "sans"
  },
  {
    "name": "Outfit",
    "weight": 700,
    "category": "sans"
  },
  {
    "name": "Plus Jakarta Sans",
    "weight": 700,
    "category": "sans"
  },
  {
    "name": "DM Sans",
    "weight": 700,
    "category": "sans"
  },
  {
    "name": "Barlow",
    "weight": 700,
    "category": "sans"
  },
  {
    "name": "Cabin",
    "weight": 700,
    "category": "sans"
  },
  {
    "name": "Ubuntu",
    "weight": 700,
    "category": "sans"
  },
  {
    "name": "Figtree",
    "weight": 700,
    "category": "sans"
  },
  {
    "name": "Mulish",
    "weight": 700,
    "category": "sans"
  },
  {
    "name": "Chivo",
    "weight": 900,
    "category": "sans"
  },
  {
    "name": "Source Sans 3",
    "weight": 700,
    "category": "sans"
  },
  {
    "name": "Google Sans",
    "weight": 700,
    "category": "sans",
    "scripts": [
      "devanagari",
      "bengali",
      "gurmukhi",
      "gujarati",
      "oriya",
      "tamil",
      "telugu",
      "kannada",
      "malayalam"
    ]
  },
  {
    "name": "Playfair Display",
    "weight": 700,
    "category": "serif"
  },
  {
    "name": "Merriweather",
    "weight": 700,
    "category": "serif"
  },
  {
    "name": "PT Serif",
    "weight": 700,
    "category": "serif"
  },
  {
    "name": "Libre Baskerville",
    "weight": 700,
    "category": "serif"
  },
  {
    "name": "Space Mono",
    "weight": 700,
    "category": "mono"
  },
  {
    "name": "Inconsolata",
    "weight": 700,
    "category": "mono"
  },
  {
    "name": "Share Tech Mono",
    "weight": 400,
    "category": "mono"
  },
  {
    "name": "Dancing Script",
    "weight": 700,
    "category": "hand"
  },
  {
    "name": "Caveat",
    "weight": 700,
    "category": "hand"
  },
  {
    "name": "Pacifico",
    "weight": 400,
    "category": "hand"
  },
  {
    "name": "Permanent Marker",
    "weight": 400,
    "category": "hand"
  },
  {
    "name": "Kalam",
    "weight": 700,
    "category": "hand",
    "scripts": [
      "devanagari"
    ]
  },
  {
    "name": "Baloo 2",
    "weight": 800,
    "category": "display",
    "scripts": [
      "devanagari"
    ],
    "scriptOnly": true
  },
  {
    "name": "Yatra One",
    "weight": 400,
    "category": "display",
    "scripts": [
      "devanagari"
    ],
    "scriptOnly": true
  },
  {
    "name": "Modak",
    "weight": 400,
    "category": "display",
    "scripts": [
      "devanagari"
    ],
    "scriptOnly": true
  },
  {
    "name": "Sarpanch",
    "weight": 900,
    "category": "display",
    "scripts": [
      "devanagari"
    ],
    "scriptOnly": true
  },
  {
    "name": "Tillana",
    "weight": 800,
    "category": "display",
    "scripts": [
      "devanagari"
    ],
    "scriptOnly": true
  },
  {
    "name": "Mukta",
    "weight": 800,
    "category": "sans",
    "scripts": [
      "devanagari"
    ],
    "scriptOnly": true
  },
  {
    "name": "Hind",
    "weight": 700,
    "category": "sans",
    "scripts": [
      "devanagari"
    ],
    "scriptOnly": true
  },
  {
    "name": "Rajdhani",
    "weight": 700,
    "category": "sans",
    "scripts": [
      "devanagari"
    ],
    "scriptOnly": true
  },
  {
    "name": "Khula",
    "weight": 800,
    "category": "sans",
    "scripts": [
      "devanagari"
    ],
    "scriptOnly": true
  },
  {
    "name": "Biryani",
    "weight": 900,
    "category": "sans",
    "scripts": [
      "devanagari"
    ],
    "scriptOnly": true
  },
  {
    "name": "Palanquin Dark",
    "weight": 700,
    "category": "sans",
    "scripts": [
      "devanagari"
    ],
    "scriptOnly": true
  },
  {
    "name": "Anek Devanagari",
    "weight": 800,
    "category": "sans",
    "scripts": [
      "devanagari"
    ],
    "scriptOnly": true
  },
  {
    "name": "Rozha One",
    "weight": 400,
    "category": "serif",
    "scripts": [
      "devanagari"
    ],
    "scriptOnly": true
  },
  {
    "name": "Eczar",
    "weight": 800,
    "category": "serif",
    "scripts": [
      "devanagari"
    ],
    "scriptOnly": true
  },
  {
    "name": "Martel",
    "weight": 800,
    "category": "serif",
    "scripts": [
      "devanagari"
    ],
    "scriptOnly": true
  },
  {
    "name": "Noto Serif Devanagari",
    "weight": 700,
    "category": "serif",
    "scripts": [
      "devanagari"
    ],
    "scriptOnly": true
  },
  {
    "name": "Amita",
    "weight": 700,
    "category": "hand",
    "scripts": [
      "devanagari"
    ],
    "scriptOnly": true
  },
  {
    "name": "Baloo Da 2",
    "weight": 800,
    "category": "display",
    "scripts": [
      "bengali"
    ],
    "scriptOnly": true
  },
  {
    "name": "Galada",
    "weight": 400,
    "category": "display",
    "scripts": [
      "bengali"
    ],
    "scriptOnly": true
  },
  {
    "name": "Atma",
    "weight": 700,
    "category": "display",
    "scripts": [
      "bengali"
    ],
    "scriptOnly": true
  },
  {
    "name": "Alkatra",
    "weight": 700,
    "category": "display",
    "scripts": [
      "devanagari",
      "bengali",
      "oriya"
    ],
    "scriptOnly": true
  },
  {
    "name": "Hind Siliguri",
    "weight": 700,
    "category": "sans",
    "scripts": [
      "bengali"
    ],
    "scriptOnly": true
  },
  {
    "name": "Anek Bangla",
    "weight": 800,
    "category": "sans",
    "scripts": [
      "bengali"
    ],
    "scriptOnly": true
  },
  {
    "name": "Mina",
    "weight": 700,
    "category": "sans",
    "scripts": [
      "bengali"
    ],
    "scriptOnly": true
  },
  {
    "name": "Noto Serif Bengali",
    "weight": 700,
    "category": "serif",
    "scripts": [
      "bengali"
    ],
    "scriptOnly": true
  },
  {
    "name": "Tiro Bangla",
    "weight": 400,
    "category": "serif",
    "scripts": [
      "bengali"
    ],
    "scriptOnly": true
  },
  {
    "name": "Baloo Paaji 2",
    "weight": 800,
    "category": "display",
    "scripts": [
      "gurmukhi"
    ],
    "scriptOnly": true
  },
  {
    "name": "Langar",
    "weight": 400,
    "category": "display",
    "scripts": [
      "gurmukhi"
    ],
    "scriptOnly": true
  },
  {
    "name": "BhuTuka Expanded One",
    "weight": 400,
    "category": "display",
    "scripts": [
      "gurmukhi"
    ],
    "scriptOnly": true
  },
  {
    "name": "Braah One",
    "weight": 400,
    "category": "sans",
    "scripts": [
      "gurmukhi"
    ],
    "scriptOnly": true
  },
  {
    "name": "Mukta Mahee",
    "weight": 800,
    "category": "sans",
    "scripts": [
      "gurmukhi"
    ],
    "scriptOnly": true
  },
  {
    "name": "Anek Gurmukhi",
    "weight": 800,
    "category": "sans",
    "scripts": [
      "gurmukhi"
    ],
    "scriptOnly": true
  },
  {
    "name": "Noto Serif Gurmukhi",
    "weight": 700,
    "category": "serif",
    "scripts": [
      "gurmukhi"
    ],
    "scriptOnly": true
  },
  {
    "name": "Tiro Gurmukhi",
    "weight": 400,
    "category": "serif",
    "scripts": [
      "gurmukhi"
    ],
    "scriptOnly": true
  },
  {
    "name": "Baloo Bhai 2",
    "weight": 800,
    "category": "display",
    "scripts": [
      "gujarati"
    ],
    "scriptOnly": true
  },
  {
    "name": "Kumar One",
    "weight": 400,
    "category": "display",
    "scripts": [
      "gujarati"
    ],
    "scriptOnly": true
  },
  {
    "name": "Shrikhand",
    "weight": 400,
    "category": "display",
    "scripts": [
      "gujarati"
    ],
    "scriptOnly": true
  },
  {
    "name": "Mogra",
    "weight": 400,
    "category": "display",
    "scripts": [
      "gujarati"
    ],
    "scriptOnly": true
  },
  {
    "name": "Hind Vadodara",
    "weight": 700,
    "category": "sans",
    "scripts": [
      "gujarati"
    ],
    "scriptOnly": true
  },
  {
    "name": "Mukta Vaani",
    "weight": 800,
    "category": "sans",
    "scripts": [
      "gujarati"
    ],
    "scriptOnly": true
  },
  {
    "name": "Anek Gujarati",
    "weight": 800,
    "category": "sans",
    "scripts": [
      "gujarati"
    ],
    "scriptOnly": true
  },
  {
    "name": "Noto Serif Gujarati",
    "weight": 700,
    "category": "serif",
    "scripts": [
      "gujarati"
    ],
    "scriptOnly": true
  },
  {
    "name": "Rasa",
    "weight": 700,
    "category": "serif",
    "scripts": [
      "gujarati"
    ],
    "scriptOnly": true
  },
  {
    "name": "Farsan",
    "weight": 400,
    "category": "hand",
    "scripts": [
      "gujarati"
    ],
    "scriptOnly": true
  },
  {
    "name": "Baloo Bhaina 2",
    "weight": 800,
    "category": "display",
    "scripts": [
      "oriya"
    ],
    "scriptOnly": true
  },
  {
    "name": "Anek Odia",
    "weight": 800,
    "category": "sans",
    "scripts": [
      "oriya"
    ],
    "scriptOnly": true
  },
  {
    "name": "Noto Serif Oriya",
    "weight": 700,
    "category": "serif",
    "scripts": [
      "oriya"
    ],
    "scriptOnly": true
  },
  {
    "name": "Baloo Thambi 2",
    "weight": 800,
    "category": "display",
    "scripts": [
      "tamil"
    ],
    "scriptOnly": true
  },
  {
    "name": "Anek Tamil",
    "weight": 800,
    "category": "display",
    "scripts": [
      "tamil"
    ],
    "scriptOnly": true
  },
  {
    "name": "Coiny",
    "weight": 400,
    "category": "display",
    "scripts": [
      "tamil"
    ],
    "scriptOnly": true
  },
  {
    "name": "Oi",
    "weight": 400,
    "category": "display",
    "scripts": [
      "tamil"
    ],
    "scriptOnly": true
  },
  {
    "name": "Arima",
    "weight": 700,
    "category": "display",
    "scripts": [
      "tamil",
      "malayalam"
    ],
    "scriptOnly": true
  },
  {
    "name": "Catamaran",
    "weight": 800,
    "category": "sans",
    "scripts": [
      "tamil"
    ],
    "scriptOnly": true
  },
  {
    "name": "Mukta Malar",
    "weight": 800,
    "category": "sans",
    "scripts": [
      "tamil"
    ],
    "scriptOnly": true
  },
  {
    "name": "Hind Madurai",
    "weight": 700,
    "category": "sans",
    "scripts": [
      "tamil"
    ],
    "scriptOnly": true
  },
  {
    "name": "Meera Inimai",
    "weight": 400,
    "category": "sans",
    "scripts": [
      "tamil"
    ],
    "scriptOnly": true
  },
  {
    "name": "Pavanam",
    "weight": 400,
    "category": "sans",
    "scripts": [
      "tamil"
    ],
    "scriptOnly": true
  },
  {
    "name": "Noto Serif Tamil",
    "weight": 700,
    "category": "serif",
    "scripts": [
      "tamil"
    ],
    "scriptOnly": true
  },
  {
    "name": "Tiro Tamil",
    "weight": 400,
    "category": "serif",
    "scripts": [
      "tamil"
    ],
    "scriptOnly": true
  },
  {
    "name": "Kavivanar",
    "weight": 400,
    "category": "hand",
    "scripts": [
      "tamil"
    ],
    "scriptOnly": true
  },
  {
    "name": "Baloo Tammudu 2",
    "weight": 800,
    "category": "display",
    "scripts": [
      "telugu"
    ],
    "scriptOnly": true
  },
  {
    "name": "Ramabhadra",
    "weight": 400,
    "category": "display",
    "scripts": [
      "telugu"
    ],
    "scriptOnly": true
  },
  {
    "name": "Akaya Telivigala",
    "weight": 400,
    "category": "display",
    "scripts": [
      "telugu"
    ],
    "scriptOnly": true
  },
  {
    "name": "Ravi Prakash",
    "weight": 400,
    "category": "display",
    "scripts": [
      "telugu"
    ],
    "scriptOnly": true
  },
  {
    "name": "Anek Telugu",
    "weight": 800,
    "category": "sans",
    "scripts": [
      "telugu"
    ],
    "scriptOnly": true
  },
  {
    "name": "Hind Guntur",
    "weight": 700,
    "category": "sans",
    "scripts": [
      "telugu"
    ],
    "scriptOnly": true
  },
  {
    "name": "Chathura",
    "weight": 800,
    "category": "sans",
    "scripts": [
      "telugu"
    ],
    "scriptOnly": true
  },
  {
    "name": "NTR",
    "weight": 400,
    "category": "sans",
    "scripts": [
      "telugu"
    ],
    "scriptOnly": true
  },
  {
    "name": "Mandali",
    "weight": 400,
    "category": "sans",
    "scripts": [
      "telugu"
    ],
    "scriptOnly": true
  },
  {
    "name": "Noto Serif Telugu",
    "weight": 700,
    "category": "serif",
    "scripts": [
      "telugu"
    ],
    "scriptOnly": true
  },
  {
    "name": "Suranna",
    "weight": 400,
    "category": "serif",
    "scripts": [
      "telugu"
    ],
    "scriptOnly": true
  },
  {
    "name": "Lakki Reddy",
    "weight": 400,
    "category": "hand",
    "scripts": [
      "telugu"
    ],
    "scriptOnly": true
  },
  {
    "name": "Baloo Tamma 2",
    "weight": 800,
    "category": "display",
    "scripts": [
      "kannada"
    ],
    "scriptOnly": true
  },
  {
    "name": "Akaya Kanadaka",
    "weight": 400,
    "category": "display",
    "scripts": [
      "kannada"
    ],
    "scriptOnly": true
  },
  {
    "name": "Padyakke Expanded One",
    "weight": 400,
    "category": "display",
    "scripts": [
      "kannada"
    ],
    "scriptOnly": true
  },
  {
    "name": "Anek Kannada",
    "weight": 800,
    "category": "sans",
    "scripts": [
      "kannada"
    ],
    "scriptOnly": true
  },
  {
    "name": "Hind Mysuru",
    "weight": 700,
    "category": "sans",
    "scripts": [
      "kannada"
    ],
    "scriptOnly": true
  },
  {
    "name": "Hubballi",
    "weight": 400,
    "category": "sans",
    "scripts": [
      "kannada"
    ],
    "scriptOnly": true
  },
  {
    "name": "Noto Serif Kannada",
    "weight": 700,
    "category": "serif",
    "scripts": [
      "kannada"
    ],
    "scriptOnly": true
  },
  {
    "name": "Tiro Kannada",
    "weight": 400,
    "category": "serif",
    "scripts": [
      "kannada"
    ],
    "scriptOnly": true
  },
  {
    "name": "Benne",
    "weight": 400,
    "category": "serif",
    "scripts": [
      "kannada"
    ],
    "scriptOnly": true
  },
  {
    "name": "Baloo Chettan 2",
    "weight": 800,
    "category": "display",
    "scripts": [
      "malayalam"
    ],
    "scriptOnly": true
  },
  {
    "name": "Anek Malayalam",
    "weight": 800,
    "category": "sans",
    "scripts": [
      "malayalam"
    ],
    "scriptOnly": true
  },
  {
    "name": "Manjari",
    "weight": 700,
    "category": "sans",
    "scripts": [
      "malayalam"
    ],
    "scriptOnly": true
  },
  {
    "name": "Gayathri",
    "weight": 700,
    "category": "sans",
    "scripts": [
      "malayalam"
    ],
    "scriptOnly": true
  },
  {
    "name": "Noto Serif Malayalam",
    "weight": 700,
    "category": "serif",
    "scripts": [
      "malayalam"
    ],
    "scriptOnly": true
  },
  {
    "name": "Chilanka",
    "weight": 400,
    "category": "hand",
    "scripts": [
      "malayalam"
    ],
    "scriptOnly": true
  }
];

export const CAPTIK_GOOGLE_FONTS: CaptikGoogleFont[] = RAW_CAPTIK_GOOGLE_FONTS.map((f) => ({
  family: f.name,
  name: f.name,
  weights: [f.weight ?? 400],
  weight: f.weight ?? 400,
  cat: f.category,
  category: f.category,
  scripts: f.scripts,
}));

