/**
 * Convert a `#rrggbb` hex string to an `rgba(r, g, b, alpha)` string. Canvas
 * 2D's fillStyle/strokeStyle reject hex with an alpha channel, so this is the
 * standard workaround for "draw this brand colour at 30% opacity". The input
 * is assumed to be a 6-digit hex with leading `#`; behaviour for other forms
 * is undefined - callers branch on `startsWith('#')` themselves where they
 * accept multiple formats.
 */
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
