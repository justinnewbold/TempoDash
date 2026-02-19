/**
 * SaveExporter - Export and import save data as JSON files.
 * Enables manual backup/restore and prepares for cloud sync.
 */

export interface ExportedSave {
  version: number;
  exportDate: string;
  appVersion: string;
  data: Record<string, unknown>;
  checksum: string;
}

const APP_VERSION = '1.0.0';

/** Simple checksum for save data integrity */
function computeChecksum(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

export class SaveExporter {
  /**
   * Export save data to a downloadable JSON file.
   */
  exportToFile(saveData: Record<string, unknown>): void {
    const dataStr = JSON.stringify(saveData);
    const exported: ExportedSave = {
      version: 2,
      exportDate: new Date().toISOString(),
      appVersion: APP_VERSION,
      data: saveData,
      checksum: computeChecksum(dataStr),
    };

    const blob = new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `tempodash-save-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Import save data from a JSON file.
   * Returns the parsed save data or null on failure.
   */
  async importFromFile(): Promise<{ data: Record<string, unknown>; warnings: string[] } | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';

      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }

        try {
          const text = await file.text();
          const parsed = JSON.parse(text);
          const warnings: string[] = [];

          // Handle versioned export format
          if (parsed.version && parsed.data) {
            const exported = parsed as ExportedSave;

            // Verify checksum
            const dataStr = JSON.stringify(exported.data);
            const expectedChecksum = computeChecksum(dataStr);
            if (exported.checksum && exported.checksum !== expectedChecksum) {
              warnings.push('Save data checksum mismatch — file may have been modified');
            }

            // Check app version compatibility
            if (exported.appVersion && exported.appVersion !== APP_VERSION) {
              warnings.push(`Save was exported from app version ${exported.appVersion}`);
            }

            resolve({ data: exported.data, warnings });
          } else {
            // Legacy format — raw save data
            warnings.push('Legacy save format detected — some fields may be missing');
            resolve({ data: parsed, warnings });
          }
        } catch (e) {
          console.error('Failed to import save:', e);
          resolve(null);
        }
      };

      input.oncancel = () => resolve(null);
      input.click();
    });
  }

  /**
   * Export save data to clipboard as text.
   */
  async exportToClipboard(saveData: Record<string, unknown>): Promise<boolean> {
    try {
      const exported: ExportedSave = {
        version: 2,
        exportDate: new Date().toISOString(),
        appVersion: APP_VERSION,
        data: saveData,
        checksum: computeChecksum(JSON.stringify(saveData)),
      };

      await navigator.clipboard.writeText(JSON.stringify(exported));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Import save data from clipboard text.
   */
  async importFromClipboard(): Promise<{ data: Record<string, unknown>; warnings: string[] } | null> {
    try {
      const text = await navigator.clipboard.readText();
      const parsed = JSON.parse(text);
      const warnings: string[] = [];

      if (parsed.version && parsed.data) {
        return { data: parsed.data, warnings };
      }
      warnings.push('Legacy format');
      return { data: parsed, warnings };
    } catch {
      return null;
    }
  }
}
