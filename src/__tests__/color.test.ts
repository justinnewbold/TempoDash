import { describe, it, expect } from 'vitest';
import { hexToRgba } from '../util/color';

describe('hexToRgba', () => {
  it('parses pure red, green, blue at full alpha', () => {
    expect(hexToRgba('#ff0000', 1)).toBe('rgba(255, 0, 0, 1)');
    expect(hexToRgba('#00ff00', 1)).toBe('rgba(0, 255, 0, 1)');
    expect(hexToRgba('#0000ff', 1)).toBe('rgba(0, 0, 255, 1)');
  });

  it('handles black, white, and grey', () => {
    expect(hexToRgba('#000000', 0.5)).toBe('rgba(0, 0, 0, 0.5)');
    expect(hexToRgba('#ffffff', 0.5)).toBe('rgba(255, 255, 255, 0.5)');
    expect(hexToRgba('#808080', 0.5)).toBe('rgba(128, 128, 128, 0.5)');
  });

  it('preserves the requested alpha unchanged', () => {
    // Alpha is a literal substitution, not clamped or scaled.
    expect(hexToRgba('#abcdef', 0)).toBe('rgba(171, 205, 239, 0)');
    expect(hexToRgba('#abcdef', 0.27)).toBe('rgba(171, 205, 239, 0.27)');
    expect(hexToRgba('#abcdef', 1)).toBe('rgba(171, 205, 239, 1)');
  });

  it('parses both upper and lower case hex digits', () => {
    expect(hexToRgba('#FF00AA', 1)).toBe('rgba(255, 0, 170, 1)');
    expect(hexToRgba('#ff00aa', 1)).toBe('rgba(255, 0, 170, 1)');
  });

  it('matches a brand colour used by the game (Level 1 cyan card)', () => {
    expect(hexToRgba('#00ffaa', 0.15)).toBe('rgba(0, 255, 170, 0.15)');
  });
});
