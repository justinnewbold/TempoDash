import { describe, it, expect, beforeEach } from 'vitest';
import { SpatialGrid, SpatialEntity } from '../systems/SpatialGrid';

interface TestEntity extends SpatialEntity {
  id: number;
}

describe('SpatialGrid', () => {
  let grid: SpatialGrid<TestEntity>;

  beforeEach(() => {
    grid = new SpatialGrid<TestEntity>(100);
  });

  it('inserts and queries entities', () => {
    grid.insert({ id: 1, x: 50, y: 50, width: 30, height: 30 });
    const results = grid.query(40, 40, 50, 50);
    expect(results.size).toBe(1);
  });

  it('returns empty set for empty grid', () => {
    const results = grid.query(0, 0, 100, 100);
    expect(results.size).toBe(0);
  });

  it('finds entities spanning multiple cells', () => {
    // Entity spans two cells (100px boundary)
    grid.insert({ id: 1, x: 80, y: 50, width: 40, height: 30 });
    const left = grid.query(50, 40, 40, 40);
    const right = grid.query(100, 40, 40, 40);
    expect(left.size).toBe(1);
    expect(right.size).toBe(1);
  });

  it('does not find entities in distant cells', () => {
    grid.insert({ id: 1, x: 50, y: 50, width: 30, height: 30 });
    const results = grid.query(500, 500, 50, 50);
    expect(results.size).toBe(0);
  });

  it('deduplicates entities spanning multiple cells', () => {
    // Large entity spanning 4 cells
    grid.insert({ id: 1, x: 80, y: 80, width: 40, height: 40 });
    const results = grid.query(50, 50, 100, 100);
    expect(results.size).toBe(1); // Should be 1, not 4
  });

  it('builds from array', () => {
    grid.build([
      { id: 1, x: 0, y: 0, width: 50, height: 50 },
      { id: 2, x: 200, y: 200, width: 50, height: 50 },
      { id: 3, x: 0, y: 200, width: 50, height: 50 },
    ]);

    const topLeft = grid.query(0, 0, 100, 100);
    expect(topLeft.size).toBe(1);

    const all = grid.query(0, 0, 300, 300);
    expect(all.size).toBe(3);
  });

  it('clears all entities', () => {
    grid.insert({ id: 1, x: 50, y: 50, width: 30, height: 30 });
    grid.clear();
    const results = grid.query(0, 0, 200, 200);
    expect(results.size).toBe(0);
  });

  it('queries viewport with margin', () => {
    grid.insert({ id: 1, x: 450, y: 100, width: 50, height: 50 });
    // Viewport is 0-400, but with 100px margin should find entity at 450
    const results = grid.queryViewport(0, 400, 300, 100);
    expect(results.size).toBe(1);
  });

  it('tracks cell count', () => {
    grid.insert({ id: 1, x: 50, y: 50, width: 10, height: 10 });
    expect(grid.getCellCount()).toBe(1);

    grid.insert({ id: 2, x: 250, y: 250, width: 10, height: 10 });
    expect(grid.getCellCount()).toBe(2);
  });
});
