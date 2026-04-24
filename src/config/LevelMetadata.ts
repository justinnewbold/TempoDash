// Single source of truth for level-select card display (name, color, star
// rating). Indexed by levelId - 1. Adding a new level? Append one entry here
// alongside registering the factory in src/levels/index.ts.

export interface LevelCard {
  name: string;
  color: string;
  difficulty: number; // 1-5 stars
}

export const LEVEL_CARDS: LevelCard[] = [
  { name: 'First Flight',     color: '#00ffaa', difficulty: 1 },
  { name: 'Neon Dreams',      color: '#ff00ff', difficulty: 2 },
  { name: 'Final Ascent',     color: '#ff6600', difficulty: 3 },
  { name: 'Frozen Peak',      color: '#88ddff', difficulty: 3 },
  { name: 'Volcanic Descent', color: '#ff4400', difficulty: 4 },
  { name: 'Abyssal Depths',   color: '#00ccff', difficulty: 5 },
  { name: 'The Gauntlet',     color: '#ff0000', difficulty: 5 },
  { name: 'Sky Temple',       color: '#e94560', difficulty: 5 },
  { name: 'Crystal Caverns',  color: '#aa66ff', difficulty: 4 },
  { name: 'Storm Surge',      color: '#ffaa00', difficulty: 5 },
  { name: 'Shadow Realm',     color: '#666699', difficulty: 5 },
  { name: 'Cyber Grid',       color: '#00ffff', difficulty: 4 },
  { name: 'Ancient Ruins',    color: '#cc9966', difficulty: 3 },
  { name: 'Starlight Path',   color: '#aaaaff', difficulty: 4 },
  { name: 'Chaos Dimension',  color: '#ff0066', difficulty: 5 },
  { name: 'Stellar Circuit',  color: '#cc88ff', difficulty: 4 },
];
