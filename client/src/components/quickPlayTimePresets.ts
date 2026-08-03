export type QuickPlayTimePreset = {
  label: string;
  nameKey: string;
  initial: number;
  increment: number;
};

export type TimePaceGroup = 'bullet' | 'blitz' | 'rapid' | 'classical';

export const TIME_PRESETS: QuickPlayTimePreset[] = [
  { label: '1+0', nameKey: 'time.bullet', initial: 60, increment: 0 },
  { label: '3+0', nameKey: 'time.blitz', initial: 180, increment: 0 },
  { label: '3+2', nameKey: 'time.blitz', initial: 180, increment: 2 },
  { label: '5+0', nameKey: 'time.blitz', initial: 300, increment: 0 },
  { label: '5+3', nameKey: 'time.rapid', initial: 300, increment: 3 },
  { label: '10+0', nameKey: 'time.rapid', initial: 600, increment: 0 },
  { label: '10+5', nameKey: 'time.rapid', initial: 600, increment: 5 },
  { label: '15+10', nameKey: 'time.classical', initial: 900, increment: 10 },
  { label: '30+0', nameKey: 'time.classical', initial: 1800, increment: 0 },
];

/** Featured clocks — same progressive set as HomeFriendPanel. */
export const FEATURED_TIME_LABELS = new Set(['3+0', '5+0', '10+0', '15+10']);

export const TIME_PACE_ORDER: TimePaceGroup[] = ['bullet', 'blitz', 'rapid', 'classical'];

export function getTimePaceGroup(preset: QuickPlayTimePreset): TimePaceGroup {
  if (preset.nameKey === 'time.bullet') return 'bullet';
  if (preset.nameKey === 'time.blitz') return 'blitz';
  if (preset.nameKey === 'time.rapid') return 'rapid';
  return 'classical';
}

/** Group expanded clocks by Makruk pace so each decision stays ≤4 options. */
export function groupTimePresetsByPace(presets: readonly QuickPlayTimePreset[]) {
  return TIME_PACE_ORDER
    .map((pace) => ({
      pace,
      nameKey: `time.${pace}` as const,
      presets: presets.filter((preset) => getTimePaceGroup(preset) === pace),
    }))
    .filter((group) => group.presets.length > 0);
}

export const BOT_FALLBACK_SECONDS = 12;
/** Clear "Sending…" if connect / matchmaking_started never arrives. */
export const REQUEST_PENDING_TIMEOUT_MS = 12_000;

export function formatSearchTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}s`;
}
