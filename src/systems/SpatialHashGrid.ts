// Spatial hash grid for O(1) collision queries
// Divides the game world into cells for efficient broad-phase collision detection

import { Rectangle } from '../types';

export interface SpatialEntity {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class SpatialHashGrid<T extends SpatialEntity> {
  private cellSize: number;
  private cells: Map<string, Set<T>> = new Map();
  private entityCells: Map<T, Set<string>> = new Map();

  constructor(cellSize: number = 200) {
    this.cellSize = cellSize;
  }

  // Get cell key for a position
  private getCellKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }

  // Get all cell keys that an entity overlaps
  private getEntityCellKeys(entity: SpatialEntity): string[] {
    const keys: string[] = [];
    const startCellX = Math.floor(entity.x / this.cellSize);
    const startCellY = Math.floor(entity.y / this.cellSize);
    const endCellX = Math.floor((entity.x + entity.width) / this.cellSize);
    const endCellY = Math.floor((entity.y + entity.height) / this.cellSize);

    for (let cx = startCellX; cx <= endCellX; cx++) {
      for (let cy = startCellY; cy <= endCellY; cy++) {
        keys.push(`${cx},${cy}`);
      }
    }
    return keys;
  }

  // Insert an entity into the grid
  insert(entity: T): void {
    const cellKeys = this.getEntityCellKeys(entity);
    const entityCellSet = new Set<string>();

    for (const key of cellKeys) {
      if (!this.cells.has(key)) {
        this.cells.set(key, new Set());
      }
      this.cells.get(key)!.add(entity);
      entityCellSet.add(key);
    }

    this.entityCells.set(entity, entityCellSet);
  }

  // Remove an entity from the grid
  remove(entity: T): void {
    const cellSet = this.entityCells.get(entity);
    if (!cellSet) return;

    for (const key of cellSet) {
      const cell = this.cells.get(key);
      if (cell) {
        cell.delete(entity);
        if (cell.size === 0) {
          this.cells.delete(key);
        }
      }
    }

    this.entityCells.delete(entity);
  }

  // Update an entity's position in the grid
  update(entity: T): void {
    const oldCellSet = this.entityCells.get(entity);
    const newCellKeys = this.getEntityCellKeys(entity);
    const newCellSet = new Set(newCellKeys);

    // Quick check if cells changed
    if (oldCellSet && this.setsEqual(oldCellSet, newCellSet)) {
      return; // No change needed
    }

    // Remove from old cells
    if (oldCellSet) {
      for (const key of oldCellSet) {
        if (!newCellSet.has(key)) {
          const cell = this.cells.get(key);
          if (cell) {
            cell.delete(entity);
            if (cell.size === 0) {
              this.cells.delete(key);
            }
          }
        }
      }
    }

    // Add to new cells
    for (const key of newCellKeys) {
      if (!oldCellSet || !oldCellSet.has(key)) {
        if (!this.cells.has(key)) {
          this.cells.set(key, new Set());
        }
        this.cells.get(key)!.add(entity);
      }
    }

    this.entityCells.set(entity, newCellSet);
  }

  private setsEqual(a: Set<string>, b: Set<string>): boolean {
    if (a.size !== b.size) return false;
    for (const item of a) {
      if (!b.has(item)) return false;
    }
    return true;
  }

  // Query entities that might intersect with a rectangle
  query(rect: Rectangle): T[] {
    const results = new Set<T>();
    const cellKeys = this.getEntityCellKeys(rect);

    for (const key of cellKeys) {
      const cell = this.cells.get(key);
      if (cell) {
        for (const entity of cell) {
          results.add(entity);
        }
      }
    }

    return Array.from(results);
  }

  // Query entities near a point within a radius
  queryNearPoint(x: number, y: number, radius: number): T[] {
    return this.query({
      x: x - radius,
      y: y - radius,
      width: radius * 2,
      height: radius * 2
    });
  }

  // Query entities visible on screen (given camera position)
  queryVisible(cameraX: number, screenWidth: number, screenHeight: number, padding: number = 100): T[] {
    return this.query({
      x: cameraX - padding,
      y: -padding,
      width: screenWidth + padding * 2,
      height: screenHeight + padding * 2
    });
  }

  // Clear all entities from the grid
  clear(): void {
    this.cells.clear();
    this.entityCells.clear();
  }

  // Rebuild the grid with a new set of entities
  rebuild(entities: T[]): void {
    this.clear();
    for (const entity of entities) {
      this.insert(entity);
    }
  }

  // Get stats for debugging
  getStats(): { totalCells: number; totalEntities: number; avgEntitiesPerCell: number } {
    let totalEntities = 0;
    for (const cell of this.cells.values()) {
      totalEntities += cell.size;
    }
    return {
      totalCells: this.cells.size,
      totalEntities: this.entityCells.size,
      avgEntitiesPerCell: this.cells.size > 0 ? totalEntities / this.cells.size : 0
    };
  }
}
