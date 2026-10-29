import type { Piece } from "./themes";

export function formatDate(date?: string): string {
  if (!date) return "";
  const [year, month, day] = date.split("-");
  if (!year || !month || !day) return date;
  return `${month}-${day}-${year}`;
}

function lightness(hex: string): number {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return 0;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export function sortLightToDark(colors: string[]): string[] {
  return [...colors].sort((a, b) => lightness(b) - lightness(a));
}

export function sortPiecesLightToDark(pieces: Piece[]): Piece[] {
  return [...pieces].sort((a, b) => lightness(b.color) - lightness(a.color));
}