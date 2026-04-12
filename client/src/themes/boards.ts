import { PIECE_THEMES } from './pieces';

export type BoardThemeId =
  | 'classic-wood'
  | 'dark-wood'
  | 'jade'
  | 'ivory'
  | 'slate';

export type BoardThemeCategory = 'classic' | 'soft' | 'dark' | 'elegant';
type BoardMaterial = 'wood' | 'jade' | 'ivory' | 'slate';

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface HSL {
  h: number;
  s: number;
  l: number;
}

interface RawBoardTheme {
  id: BoardThemeId;
  label: string;
  description: string;
  category: BoardThemeCategory;
  material: BoardMaterial;
  baseColor: string;
  gridColor: string;
  accent: string;
}

export interface BoardThemeValidation {
  gridContrast: number;
  coordinateContrast: number;
  weakestPieceContrast: number;
}

export interface BoardThemeConfig {
  id: BoardThemeId;
  label: string;
  description: string;
  category: BoardThemeCategory;
  material: BoardMaterial;
  baseColor: string;
  gridColor: string;
  surfaceBackground: string;
  frameBackground: string;
  coordinateColor: string;
  hoverBackground: string;
  selectedBackground: string;
  selectedRing: string;
  lastMoveBackground: string;
  premoveBackground: string;
  premoveRing: string;
  legalDot: string;
  legalCapture: string;
  checkOverlay: string;
  legacyPreviewLight: string;
  legacyPreviewDark: string;
  validation: BoardThemeValidation;
}

const MIN_GRID_CONTRAST = 1.18;
const MAX_GRID_CONTRAST = 2.45;
const MIN_COORDINATE_CONTRAST = 4.5;
const MIN_PIECE_CONTRAST = 2.35;

const RAW_BOARD_THEMES: RawBoardTheme[] = [
  {
    id: 'classic-wood',
    label: 'Classic Wood',
    description: 'Light brown timber with a calm carved grid.',
    category: 'classic',
    material: 'wood',
    baseColor: '#d0b285',
    gridColor: '#8c6b42',
    accent: '#8d7046',
  },
  {
    id: 'dark-wood',
    label: 'Dark Wood',
    description: 'Deep brown lacquer with soft gold square lines.',
    category: 'classic',
    material: 'wood',
    baseColor: '#b28b5a',
    gridColor: '#d6bb85',
    accent: '#b58d51',
  },
  {
    id: 'jade',
    label: 'Jade',
    description: 'Muted green lacquer with understated structure.',
    category: 'soft',
    material: 'jade',
    baseColor: '#a5b99a',
    gridColor: '#687c62',
    accent: '#6d8668',
  },
  {
    id: 'ivory',
    label: 'Ivory',
    description: 'Warm cream board with refined brown guide lines.',
    category: 'elegant',
    material: 'ivory',
    baseColor: '#e8dcc2',
    gridColor: '#a98758',
    accent: '#b39464',
  },
  {
    id: 'slate',
    label: 'Slate',
    description: 'Dark grey stone with soft high-clarity grid lines.',
    category: 'dark',
    material: 'slate',
    baseColor: '#959ca3',
    gridColor: '#d0d6dd',
    accent: '#7a848d',
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function parseHex(hex: string): RGB {
  const normalized = hex.replace('#', '').trim();
  const value = normalized.length === 3
    ? normalized.split('').map((part) => `${part}${part}`).join('')
    : normalized;

  if (!/^[0-9a-f]{6}$/i.test(value)) {
    throw new Error(`Unsupported color format: ${hex}`);
  }

  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

function toHex({ r, g, b }: RGB) {
  return `#${[r, g, b]
    .map((channel) => clamp(Math.round(channel), 0, 255).toString(16).padStart(2, '0'))
    .join('')}`;
}

function rgbToHsl({ r, g, b }: RGB): HSL {
  const nr = r / 255;
  const ng = g / 255;
  const nb = b / 255;
  const max = Math.max(nr, ng, nb);
  const min = Math.min(nr, ng, nb);
  const delta = max - min;
  const l = (max + min) / 2;

  if (delta === 0) {
    return { h: 0, s: 0, l };
  }

  const s = delta / (1 - Math.abs(2 * l - 1));
  let h = 0;

  switch (max) {
    case nr:
      h = ((ng - nb) / delta) % 6;
      break;
    case ng:
      h = (nb - nr) / delta + 2;
      break;
    default:
      h = (nr - ng) / delta + 4;
      break;
  }

  return {
    h: (h * 60 + 360) % 360,
    s,
    l,
  };
}

function hslToRgb({ h, s, l }: HSL): RGB {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));

  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (hp >= 0 && hp < 1) {
    r1 = c;
    g1 = x;
  } else if (hp < 2) {
    r1 = x;
    g1 = c;
  } else if (hp < 3) {
    g1 = c;
    b1 = x;
  } else if (hp < 4) {
    g1 = x;
    b1 = c;
  } else if (hp < 5) {
    r1 = x;
    b1 = c;
  } else {
    r1 = c;
    b1 = x;
  }

  const m = l - c / 2;

  return {
    r: (r1 + m) * 255,
    g: (g1 + m) * 255,
    b: (b1 + m) * 255,
  };
}

function adjustLightness(hex: string, amount: number) {
  const hsl = rgbToHsl(parseHex(hex));
  return toHex(hslToRgb({ ...hsl, l: clamp(hsl.l + amount, 0, 1) }));
}

function capSaturation(hex: string, maxSaturation: number) {
  const hsl = rgbToHsl(parseHex(hex));
  return toHex(hslToRgb({ ...hsl, s: Math.min(hsl.s, maxSaturation) }));
}

function mix(colorA: string, colorB: string, amount: number) {
  const a = parseHex(colorA);
  const b = parseHex(colorB);
  const ratio = clamp(amount, 0, 1);

  return toHex({
    r: a.r + (b.r - a.r) * ratio,
    g: a.g + (b.g - a.g) * ratio,
    b: a.b + (b.b - a.b) * ratio,
  });
}

function channelToLinear(channel: number) {
  const value = channel / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string) {
  const { r, g, b } = parseHex(hex);
  return 0.2126 * channelToLinear(r) + 0.7152 * channelToLinear(g) + 0.0722 * channelToLinear(b);
}

function contrastRatio(colorA: string, colorB: string) {
  const lighter = Math.max(relativeLuminance(colorA), relativeLuminance(colorB));
  const darker = Math.min(relativeLuminance(colorA), relativeLuminance(colorB));
  return (lighter + 0.05) / (darker + 0.05);
}

function buildSurfaceBackground(base: string, material: BoardMaterial) {
  switch (material) {
    case 'wood':
      return [
        `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 12%, transparent 24%, rgba(123,92,54,0.07) 38%, transparent 52%, rgba(255,255,255,0.04) 68%, transparent 100%)`,
        `linear-gradient(180deg, rgba(255,255,255,0.12), transparent 16%, transparent 82%, rgba(77,52,24,0.08))`,
        base,
      ].join(', ');
    case 'jade':
      return [
        `radial-gradient(circle at 18% 16%, rgba(255,255,255,0.12), transparent 34%)`,
        `linear-gradient(180deg, rgba(255,255,255,0.07), transparent 20%, rgba(34,57,38,0.08) 100%)`,
        base,
      ].join(', ');
    case 'ivory':
      return [
        `radial-gradient(circle at 22% 18%, rgba(255,255,255,0.16), transparent 38%)`,
        `linear-gradient(180deg, rgba(255,255,255,0.12), transparent 24%, rgba(120,93,58,0.05) 100%)`,
        base,
      ].join(', ');
    case 'slate':
      return [
        `linear-gradient(180deg, rgba(255,255,255,0.08), transparent 20%, rgba(34,39,44,0.08) 100%)`,
        `radial-gradient(circle at 82% 12%, rgba(255,255,255,0.07), transparent 26%)`,
        base,
      ].join(', ');
    default:
      return base;
  }
}

function buildFrameBackground(base: string, accent: string, material: BoardMaterial) {
  const top = mix(accent, '#f3deaf', material === 'ivory' ? 0.16 : 0.08);
  const mid = mix(base, '#433126', material === 'slate' ? 0.48 : 0.4);
  const bottom = mix(base, '#18130f', material === 'slate' ? 0.62 : 0.58);
  return `linear-gradient(180deg, ${top}, ${mid} 48%, ${bottom})`;
}

function getCoordinateColor(base: string, grid: string) {
  const dark = mix(grid, '#120d09', 0.9);
  const light = mix(grid, '#fffaf2', 0.9);
  const darkContrast = contrastRatio(base, dark);
  const lightContrast = contrastRatio(base, light);

  return darkContrast >= lightContrast ? dark : light;
}

function getPieceVisibility(base: string) {
  return PIECE_THEMES.reduce((report, theme) => {
    const weakestForTheme = (['white', 'black'] as const).reduce((themeWeakest, side) => {
      const palette = theme.colors[side];
      const bodyContrast = Math.max(
        contrastRatio(palette.fillTop, base),
        contrastRatio(palette.fillBase, base),
        contrastRatio(palette.fillBottom, base),
      );
      const outlineContrast = contrastRatio(palette.stroke, base);
      return Math.min(themeWeakest, Math.max(bodyContrast, outlineContrast));
    }, Number.POSITIVE_INFINITY);

    return Math.min(report, weakestForTheme);
  }, Number.POSITIVE_INFINITY);
}

function tuneBoardSurface(rawBase: string, rawGrid: string) {
  let base = capSaturation(rawBase, 0.26);
  let grid = capSaturation(rawGrid, 0.28);

  for (let step = 0; step < 14; step += 1) {
    const weakestPieceContrast = getPieceVisibility(base);
    const gridContrast = contrastRatio(base, grid);

    if (
      weakestPieceContrast >= MIN_PIECE_CONTRAST &&
      gridContrast >= MIN_GRID_CONTRAST &&
      gridContrast <= MAX_GRID_CONTRAST
    ) {
      return {
        base,
        grid,
        validation: {
          gridContrast,
          weakestPieceContrast,
        },
      };
    }

    if (weakestPieceContrast < MIN_PIECE_CONTRAST) {
      base = relativeLuminance(base) < 0.42
        ? adjustLightness(base, 0.024)
        : adjustLightness(base, -0.014);
    }

    if (gridContrast < MIN_GRID_CONTRAST) {
      grid = relativeLuminance(base) > 0.52
        ? adjustLightness(grid, -0.055)
        : adjustLightness(grid, 0.06);
    } else if (gridContrast > MAX_GRID_CONTRAST) {
      grid = mix(grid, base, 0.16);
    }
  }

  const weakestPieceContrast = getPieceVisibility(base);
  const gridContrast = contrastRatio(base, grid);

  if (
    weakestPieceContrast < MIN_PIECE_CONTRAST ||
    gridContrast < MIN_GRID_CONTRAST ||
    gridContrast > MAX_GRID_CONTRAST
  ) {
    throw new Error(`Board theme failed Makruk surface validation (${base} / ${grid}).`);
  }

  return {
    base,
    grid,
    validation: {
      gridContrast,
      weakestPieceContrast,
    },
  };
}

function buildBoardTheme(theme: RawBoardTheme): BoardThemeConfig {
  const tuned = tuneBoardSurface(theme.baseColor, theme.gridColor);
  const hoverBackground = `linear-gradient(180deg, rgba(255,255,255,0.1), transparent 45%), ${mix(tuned.base, '#fff6df', 0.12)}`;
  const selectedBackground = `linear-gradient(180deg, rgba(255,255,255,0.12), transparent 45%), ${mix(tuned.base, theme.accent, 0.24)}`;
  const lastMoveBackground = `linear-gradient(180deg, rgba(255,255,255,0.08), transparent 42%), ${mix(tuned.base, '#d8b777', 0.18)}`;
  const premoveBackground = `linear-gradient(180deg, rgba(255,255,255,0.08), transparent 42%), ${mix(tuned.base, '#93a276', 0.16)}`;
  const legalColor = relativeLuminance(tuned.base) > 0.52 ? 'rgba(41, 31, 21, 0.34)' : 'rgba(250, 243, 230, 0.44)';
  const coordinateColor = getCoordinateColor(tuned.base, tuned.grid);
  const coordinateContrast = contrastRatio(tuned.base, coordinateColor);

  if (coordinateContrast < MIN_COORDINATE_CONTRAST) {
    throw new Error(`Board theme failed coordinate contrast validation (${tuned.base} / ${coordinateColor}).`);
  }

  return {
    id: theme.id,
    label: theme.label,
    description: theme.description,
    category: theme.category,
    material: theme.material,
    baseColor: tuned.base,
    gridColor: tuned.grid,
    surfaceBackground: buildSurfaceBackground(tuned.base, theme.material),
    frameBackground: buildFrameBackground(tuned.base, theme.accent, theme.material),
    coordinateColor,
    hoverBackground,
    selectedBackground,
    selectedRing: mix(theme.accent, '#f4e4b6', 0.34),
    lastMoveBackground,
    premoveBackground,
    premoveRing: mix(theme.accent, '#dbe2bf', 0.3),
    legalDot: legalColor,
    legalCapture: legalColor,
    checkOverlay: 'radial-gradient(ellipse at center, rgba(174, 60, 47, 0.7) 0%, rgba(122, 33, 25, 0.3) 58%, transparent 84%)',
    legacyPreviewLight: mix(tuned.base, '#fff2d7', 0.34),
    legacyPreviewDark: mix(tuned.base, relativeLuminance(tuned.base) > 0.56 ? '#6f5337' : '#4d5560', 0.28),
    validation: {
      ...tuned.validation,
      coordinateContrast,
    },
  };
}

export const BOARD_THEMES: BoardThemeConfig[] = RAW_BOARD_THEMES.map(buildBoardTheme);

export const DEFAULT_BOARD_THEME_ID: BoardThemeId = 'classic-wood';

export function getBoardThemeById(id: string | null | undefined): BoardThemeConfig {
  return BOARD_THEMES.find((theme) => theme.id === id) ?? BOARD_THEMES[0];
}
