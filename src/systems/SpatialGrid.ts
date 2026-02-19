/**
 * SpatialGrid - Grid-based spatial index for efficient collision queries.
 * Divides the level into cells and maps entities to cells for O(1) neighbor lookup
 * instead of O(n) all-pairs checks.
 */

export interface SpatialEntity {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class SpatialGrid<T extends SpatialEntity> {
  private cellSize: number;
  private cells: Map<string, T[]> = new Map();

  constructor(cellSize = 256) {
    this.cellSize = cellSize;
  }

  /** Clear all entities from the grid */
  clear(): void {
    this.cells.clear();
  }

  /** Insert an entity into all cells it overlaps */
  insert(entity: T): void {
    const minCol = Math.floor(entity.x / this.cellSize);
    const maxCol = Math.floor((entity.x + entity.width) / this.cellSize);
    const minRow = Math.floor(entity.y / this.cellSize);
    const maxRow = Math.floor((entity.y + entity.height) / this.cellSize);

    for (let col = minCol; col <= maxCol; col++) {
      for (let row = minRow; row <= maxRow; row++) {
        const key = `${col},${row}`;
        let cell = this.cells.get(key);
        if (!cell) {
          cell = [];
          this.cells.set(key, cell);
        }
        cell.push(entity);
      }
    }
  }

  /** Build the grid from an array of entities */
  build(entities: T[]): void {
    this.clear();
    for (const entity of entities) {
      this.insert(entity);
    }
  }

  /**
   * Query all entities that might overlap the given rectangle.
   * Returns a Set (no duplicates even if an entity spans multiple cells).
   */
  query(x: number, y: number, width: number, height: number): Set<T> {
    const result = new Set<T>();

    const minCol = Math.floor(x / this.cellSize);
    const maxCol = Math.floor((x + width) / this.cellSize);
    const minRow = Math.floor(y / this.cellSize);
    const maxRow = Math.floor((y + height) / this.cellSize);

    for (let col = minCol; col <= maxCol; col++) {
      for (let row = minRow; row <= maxRow; row++) {
        const cell = this.cells.get(`${col},${row}`);
        if (cell) {
          for (const entity of cell) {
            result.add(entity);
          }
        }
      }
    }

    return result;
  }

  /**
   * Query entities visible within a camera viewport.
   * Includes a margin to account for entities partially off-screen.
   */
  queryViewport(cameraX: number, viewportWidth: number, viewportHeight: number, margin = 100): Set<T> {
    return this.query(
      cameraX - margin,
      -margin,
      viewportWidth + margin * 2,
      viewportHeight + margin * 2
    );
  }

  /** Get the number of occupied cells (for debugging) */
  getCellCount(): number {
    return this.cells.size;
  }

  /** Get total entities across all cells (includes duplicates) */
  getTotalEntries(): number {
    let total = 0;
    for (const cell of this.cells.values()) {
      total += cell.length;
    }
    return total;
  }
}
