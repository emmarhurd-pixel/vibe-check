import type { Piece } from "./themes";

export function formatDate(date?: string): string {
  if (!date) return "";
  const [year, month, day] = date.split("-");
  if (!year || !month || !day) return date;
  return `${month}-${day}-${year}`;
}

function toRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return null;
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

export function lightness(hex: string): number {
  const rgb = toRgb(hex);
  if (!rgb) return 0;
  const [r, g, b] = rgb;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export function colorDistance(a: string, b: string): number {
  const x = toRgb(a);
  const y = toRgb(b);
  if (!x || !y) return a.toLowerCase() === b.toLowerCase() ? 0 : 999;
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
}

export const SAME_COLOR_DISTANCE = 24;

export function sortLightToDark(colors: string[]): string[] {
  return [...colors].sort((a, b) => lightness(b) - lightness(a));
}

export function sortPiecesLightToDark(pieces: Piece[]): Piece[] {
  return [...pieces].sort((a, b) => lightness(b.color) - lightness(a.color));
}

export type ColorGroup = { color: string; names: string[] };

export function uniquePieceColors(pieces: Piece[]): ColorGroup[] {
  const groups: ColorGroup[] = [];
  for (const piece of pieces) {
    const match = groups.find((group) => colorDistance(group.color, piece.color) < SAME_COLOR_DISTANCE);
    if (match) {
      match.names.push(piece.name);
    } else {
      groups.push({ color: piece.color, names: [piece.name] });
    }
  }
  return groups.sort((a, b) => lightness(b.color) - lightness(a.color));
}