import type { Language } from './i18n';

export const ENGLISH_BOARD_FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
export const THAI_BOARD_FILES = ['ก', 'ข', 'ค', 'ง', 'จ', 'ฉ', 'ช', 'ญ'] as const;

export function getBoardFileLabel(col: number, lang: Language): string {
  const files = lang === 'th' ? THAI_BOARD_FILES : ENGLISH_BOARD_FILES;
  return files[col] ?? '';
}

export function getBoardRankLabel(row: number): string {
  return String(row + 1);
}

export function getBoardSquareLabel(row: number, col: number, lang: Language): string {
  return `${getBoardFileLabel(col, lang)}${getBoardRankLabel(row)}`;
}
