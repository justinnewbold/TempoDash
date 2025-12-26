/**
 * Level Sharing System
 * Handles encoding/decoding levels for sharing, import/export functionality
 */

import { CustomLevel } from '../types';

// Characters used for base64-like encoding (URL-safe)
const ENCODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

export interface ShareResult {
  success: boolean;
  code?: string;
  error?: string;
  url?: string;
}

export interface ImportResult {
  success: boolean;
  level?: CustomLevel;
  error?: string;
}

export class LevelSharingManager {
  private static readonly VERSION = 1;
  private static readonly CODE_PREFIX = 'TD'; // TempoDash prefix

  /**
   * Encodes a level into a shareable code string
   */
  static encodeLevel(level: CustomLevel): ShareResult {
    try {
      // Create a minimal version of the level for sharing
      const shareData = {
        v: this.VERSION,
        n: level.name.substring(0, 30),
        a: level.author.substring(0, 20),
        b: level.bpm,
        bg: level.background.type,
        ps: level.playerStart,
        g: level.goal,
        p: level.platforms.map(p => ({
          x: Math.round(p.x),
          y: Math.round(p.y),
          w: Math.round(p.width),
          h: Math.round(p.height),
          t: p.type,
          ...(p.movePattern && { m: p.movePattern }),
          ...(p.conveyorSpeed !== undefined && { cs: p.conveyorSpeed }),
        })),
        c: level.coins.map(c => ({
          x: Math.round(c.x),
          y: Math.round(c.y),
        })),
        ...(level.powerUps && level.powerUps.length > 0 && {
          pu: level.powerUps.map(pu => ({
            t: pu.type,
            x: Math.round(pu.x),
            y: Math.round(pu.y),
          })),
        }),
      };

      // Convert to JSON and compress using simple encoding
      const json = JSON.stringify(shareData);
      const compressed = this.compress(json);
      const code = `${this.CODE_PREFIX}${compressed}`;

      // Generate share URL
      const baseUrl = window.location.origin + window.location.pathname;
      const url = `${baseUrl}?level=${encodeURIComponent(code)}`;

      return { success: true, code, url };
    } catch (error) {
      return { success: false, error: `Failed to encode level: ${error}` };
    }
  }

  /**
   * Decodes a level code back into a CustomLevel
   */
  static decodeLevel(code: string): ImportResult {
    try {
      // Strip prefix
      if (!code.startsWith(this.CODE_PREFIX)) {
        return { success: false, error: 'Invalid level code format' };
      }

      const compressed = code.substring(this.CODE_PREFIX.length);
      const json = this.decompress(compressed);
      const shareData = JSON.parse(json);

      // Validate version
      if (shareData.v > this.VERSION) {
        return { success: false, error: 'Level was created with a newer version. Please update the game.' };
      }

      // Reconstruct the level
      const level: CustomLevel = {
        id: this.generateId(),
        name: shareData.n || 'Imported Level',
        author: shareData.a || 'Unknown',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        bpm: shareData.b || 120,
        background: this.reconstructBackground(shareData.bg),
        playerStart: shareData.ps || { x: 100, y: 460 },
        goal: shareData.g || { x: 1000, y: 400, width: 60, height: 100 },
        platforms: (shareData.p || []).map((p: Record<string, unknown>) => {
          const platform: {
            x: number;
            y: number;
            width: number;
            height: number;
            type: string;
            movePattern?: unknown;
            conveyorSpeed?: number;
          } = {
            x: p.x as number,
            y: p.y as number,
            width: p.w as number,
            height: p.h as number,
            type: p.t as string,
          };
          if (p.m) platform.movePattern = p.m;
          if (p.cs !== undefined) platform.conveyorSpeed = p.cs as number;
          return platform;
        }),
        coins: (shareData.c || []).map((c: Record<string, unknown>) => ({
          x: c.x as number,
          y: c.y as number,
        })),
        powerUps: shareData.pu ? shareData.pu.map((pu: Record<string, unknown>) => ({
          type: pu.t as string,
          x: pu.x as number,
          y: pu.y as number,
        })) : [],
      };

      return { success: true, level };
    } catch (error) {
      return { success: false, error: `Failed to decode level: ${error}` };
    }
  }

  /**
   * Simple compression using base64 encoding with minification
   */
  private static compress(str: string): string {
    // Convert to base64
    try {
      return btoa(unescape(encodeURIComponent(str)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    } catch {
      // Fallback for environments without btoa
      return this.simpleEncode(str);
    }
  }

  /**
   * Decompress base64 encoded string
   */
  private static decompress(str: string): string {
    try {
      // Add back padding if needed
      const padded = str + '==='.slice(0, (4 - str.length % 4) % 4);
      const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
      return decodeURIComponent(escape(atob(base64)));
    } catch {
      // Fallback for environments without atob
      return this.simpleDecode(str);
    }
  }

  /**
   * Fallback simple encoding
   */
  private static simpleEncode(str: string): string {
    let result = '';
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      result += ENCODE_CHARS[code >> 6] + ENCODE_CHARS[code & 63];
    }
    return result;
  }

  /**
   * Fallback simple decoding
   */
  private static simpleDecode(str: string): string {
    let result = '';
    for (let i = 0; i + 1 < str.length; i += 2) {
      const high = ENCODE_CHARS.indexOf(str[i]);
      const low = ENCODE_CHARS.indexOf(str[i + 1]);
      // Validate characters are in the encoding alphabet
      if (high === -1 || low === -1) break;
      result += String.fromCharCode((high << 6) | low);
    }
    return result;
  }

  /**
   * Reconstruct background config from type
   */
  private static reconstructBackground(type: string) {
    const backgrounds: Record<string, { primaryColor: string; secondaryColor: string; accentColor: string }> = {
      city: { primaryColor: '#0a0a1a', secondaryColor: '#151530', accentColor: '#00ffff' },
      neon: { primaryColor: '#0d0221', secondaryColor: '#1a0533', accentColor: '#ff00ff' },
      space: { primaryColor: '#0a1628', secondaryColor: '#1a2a4a', accentColor: '#88ddff' },
      forest: { primaryColor: '#0a1a0a', secondaryColor: '#1a2a1a', accentColor: '#66ff66' },
      volcano: { primaryColor: '#1a0a00', secondaryColor: '#2d1200', accentColor: '#ff4400' },
      ocean: { primaryColor: '#001a33', secondaryColor: '#002244', accentColor: '#00ccff' },
      inferno: { primaryColor: '#1a0505', secondaryColor: '#2d0a0a', accentColor: '#ff4400' },
    };

    const bg = backgrounds[type] || backgrounds.city;
    return {
      type: type as 'city' | 'neon' | 'space' | 'forest' | 'volcano' | 'ocean' | 'inferno',
      ...bg,
    };
  }

  /**
   * Generate a unique ID for imported levels
   */
  private static generateId(): string {
    return `imported_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  /**
   * Copy level code to clipboard
   */
  static async copyToClipboard(code: string): Promise<boolean> {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(code);
        return true;
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = code;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        return true;
      }
    } catch {
      return false;
    }
  }

  /**
   * Read level code from clipboard
   */
  static async readFromClipboard(): Promise<string | null> {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        return await navigator.clipboard.readText();
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Check if there's a level code in the URL
   */
  static checkUrlForLevel(): ImportResult | null {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const levelCode = urlParams.get('level');

      if (levelCode) {
        return this.decodeLevel(decodeURIComponent(levelCode));
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Generate a short preview/description of a level
   */
  static getLevelPreview(level: CustomLevel): string {
    return `${level.name} by ${level.author} (${level.platforms.length} platforms, ${level.coins.length} coins)`;
  }

  /**
   * Export level as downloadable JSON file
   */
  static exportAsFile(level: CustomLevel): void {
    const data = JSON.stringify(level, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${level.name.replace(/[^a-z0-9]/gi, '_')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Import level from JSON file
   */
  static importFromFile(): Promise<ImportResult> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';

      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
          resolve({ success: false, error: 'No file selected' });
          return;
        }

        try {
          const text = await file.text();
          const level = JSON.parse(text) as CustomLevel;

          // Validate basic structure
          if (!level.name || !level.platforms || !level.playerStart || !level.goal) {
            resolve({ success: false, error: 'Invalid level file format' });
            return;
          }

          // Ensure it has an ID
          level.id = level.id || this.generateId();
          level.updatedAt = Date.now();

          resolve({ success: true, level });
        } catch (error) {
          resolve({ success: false, error: `Failed to parse file: ${error}` });
        }
      };

      input.click();
    });
  }
}
