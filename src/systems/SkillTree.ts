// Skill Tree & Progression System - Permanent upgrades for player abilities
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';

export type SkillId =
  | 'jump_height' | 'jump_height_2'
  | 'dash_speed' | 'dash_recovery' | 'dash_distance'
  | 'shield_duration' | 'shield_recharge'
  | 'coin_magnet' | 'double_coins' | 'coin_value'
  | 'speed_cap' | 'acceleration'
  | 'combo_duration' | 'combo_multiplier'
  | 'checkpoint_save' | 'respawn_shield';

export interface Skill {
  id: SkillId;
  name: string;
  description: string;
  icon: string;
  maxLevel: number;
  costPerLevel: number[];
  requires?: SkillId;
  effect: (level: number) => number;  // Returns multiplier or flat bonus
}

export interface SkillProgress {
  skillId: SkillId;
  level: number;
}

const SKILLS: Record<SkillId, Skill> = {
  // Jump tree
  jump_height: {
    id: 'jump_height',
    name: 'Higher Jump',
    description: 'Increase jump height by 5% per level',
    icon: '⬆️',
    maxLevel: 5,
    costPerLevel: [100, 200, 400, 800, 1600],
    effect: (level) => 1 + level * 0.05,
  },
  jump_height_2: {
    id: 'jump_height_2',
    name: 'Super Jump',
    description: 'Additional 10% jump height per level',
    icon: '🚀',
    maxLevel: 3,
    costPerLevel: [2000, 4000, 8000],
    requires: 'jump_height',
    effect: (level) => 1 + level * 0.10,
  },

  // Dash tree
  dash_speed: {
    id: 'dash_speed',
    name: 'Quick Dash',
    description: 'Increase dash speed by 10% per level',
    icon: '💨',
    maxLevel: 5,
    costPerLevel: [100, 200, 400, 800, 1600],
    effect: (level) => 1 + level * 0.10,
  },
  dash_recovery: {
    id: 'dash_recovery',
    name: 'Swift Recovery',
    description: 'Reduce dash cooldown by 10% per level',
    icon: '⏱️',
    maxLevel: 5,
    costPerLevel: [150, 300, 600, 1200, 2400],
    requires: 'dash_speed',
    effect: (level) => 1 - level * 0.10,  // Multiplier for cooldown
  },
  dash_distance: {
    id: 'dash_distance',
    name: 'Long Dash',
    description: 'Increase dash distance by 15% per level',
    icon: '➡️',
    maxLevel: 3,
    costPerLevel: [500, 1000, 2000],
    requires: 'dash_speed',
    effect: (level) => 1 + level * 0.15,
  },

  // Shield tree
  shield_duration: {
    id: 'shield_duration',
    name: 'Durable Shield',
    description: 'Shield lasts 20% longer per level',
    icon: '🛡️',
    maxLevel: 5,
    costPerLevel: [200, 400, 800, 1600, 3200],
    effect: (level) => 1 + level * 0.20,
  },
  shield_recharge: {
    id: 'shield_recharge',
    name: 'Shield Recharge',
    description: 'Gain partial shield on coin collection',
    icon: '🔋',
    maxLevel: 3,
    costPerLevel: [1000, 2000, 4000],
    requires: 'shield_duration',
    effect: (level) => level * 0.05,  // 5% shield per coin per level
  },

  // Coin tree
  coin_magnet: {
    id: 'coin_magnet',
    name: 'Coin Magnet',
    description: 'Attract coins from 20% further per level',
    icon: '🧲',
    maxLevel: 5,
    costPerLevel: [100, 200, 400, 800, 1600],
    effect: (level) => 1 + level * 0.20,
  },
  double_coins: {
    id: 'double_coins',
    name: 'Lucky Coins',
    description: '5% chance to double coins per level',
    icon: '🍀',
    maxLevel: 5,
    costPerLevel: [300, 600, 1200, 2400, 4800],
    requires: 'coin_magnet',
    effect: (level) => level * 0.05,
  },
  coin_value: {
    id: 'coin_value',
    name: 'Precious Coins',
    description: 'All coins worth 10% more per level',
    icon: '💰',
    maxLevel: 5,
    costPerLevel: [500, 1000, 2000, 4000, 8000],
    requires: 'double_coins',
    effect: (level) => 1 + level * 0.10,
  },

  // Speed tree
  speed_cap: {
    id: 'speed_cap',
    name: 'Speed Demon',
    description: 'Increase max speed by 5% per level',
    icon: '⚡',
    maxLevel: 5,
    costPerLevel: [150, 300, 600, 1200, 2400],
    effect: (level) => 1 + level * 0.05,
  },
  acceleration: {
    id: 'acceleration',
    name: 'Quick Start',
    description: 'Faster speed buildup per level',
    icon: '🏃',
    maxLevel: 3,
    costPerLevel: [400, 800, 1600],
    requires: 'speed_cap',
    effect: (level) => 1 + level * 0.15,
  },

  // Combo tree
  combo_duration: {
    id: 'combo_duration',
    name: 'Combo Master',
    description: 'Combo timer lasts 15% longer per level',
    icon: '🔥',
    maxLevel: 5,
    costPerLevel: [100, 200, 400, 800, 1600],
    effect: (level) => 1 + level * 0.15,
  },
  combo_multiplier: {
    id: 'combo_multiplier',
    name: 'Score Boost',
    description: 'Higher combo score multiplier',
    icon: '✨',
    maxLevel: 3,
    costPerLevel: [1000, 2000, 4000],
    requires: 'combo_duration',
    effect: (level) => 1 + level * 0.10,
  },

  // Survival tree
  checkpoint_save: {
    id: 'checkpoint_save',
    name: 'Auto Checkpoint',
    description: 'Checkpoints trigger more frequently',
    icon: '📍',
    maxLevel: 3,
    costPerLevel: [500, 1000, 2000],
    effect: (level) => 1 - level * 0.10,  // Reduces distance between checkpoints
  },
  respawn_shield: {
    id: 'respawn_shield',
    name: 'Second Chance',
    description: 'Brief invincibility after respawn',
    icon: '💫',
    maxLevel: 3,
    costPerLevel: [800, 1600, 3200],
    requires: 'checkpoint_save',
    effect: (level) => level * 500,  // ms of invincibility
  },
};

export class SkillTreeManager {
  private unlockedSkills: Map<SkillId, number> = new Map();
  private skillPoints = 0;
  private totalPointsEarned = 0;

  constructor() {
    this.load();
  }

  // Add skill points (called when earning points in game)
  addSkillPoints(amount: number): void {
    this.skillPoints += amount;
    this.totalPointsEarned += amount;
    this.save();
  }

  // Get current skill points
  getSkillPoints(): number {
    return this.skillPoints;
  }

  // Get skill level
  getSkillLevel(skillId: SkillId): number {
    return this.unlockedSkills.get(skillId) || 0;
  }

  // Check if skill can be purchased
  canPurchaseSkill(skillId: SkillId): boolean {
    const skill = SKILLS[skillId];
    if (!skill) return false;

    const currentLevel = this.getSkillLevel(skillId);
    if (currentLevel >= skill.maxLevel) return false;

    // Check requirement
    if (skill.requires) {
      const reqLevel = this.getSkillLevel(skill.requires);
      const reqSkill = SKILLS[skill.requires];
      if (reqLevel < reqSkill.maxLevel) return false;
    }

    // Check cost
    const cost = skill.costPerLevel[currentLevel];
    return this.skillPoints >= cost;
  }

  // Purchase skill level
  purchaseSkill(skillId: SkillId): boolean {
    if (!this.canPurchaseSkill(skillId)) return false;

    const skill = SKILLS[skillId];
    const currentLevel = this.getSkillLevel(skillId);
    const cost = skill.costPerLevel[currentLevel];

    this.skillPoints -= cost;
    this.unlockedSkills.set(skillId, currentLevel + 1);
    this.save();

    return true;
  }

  // Get skill effect value (combined multiplier for stacking skills)
  getSkillEffect(skillId: SkillId): number {
    const level = this.getSkillLevel(skillId);
    const skill = SKILLS[skillId];
    // Always call effect function - it returns appropriate default at level 0
    // (1 for multipliers like "1 + level * 0.05", 0 for additive like "level * 0.05")
    return skill.effect(level);
  }

  // Get combined effect for a category
  getJumpMultiplier(): number {
    return this.getSkillEffect('jump_height') * this.getSkillEffect('jump_height_2');
  }

  getDashSpeedMultiplier(): number {
    return this.getSkillEffect('dash_speed');
  }

  getDashCooldownMultiplier(): number {
    const recovery = this.getSkillLevel('dash_recovery');
    return recovery > 0 ? SKILLS['dash_recovery'].effect(recovery) : 1;
  }

  getDashDistanceMultiplier(): number {
    return this.getSkillEffect('dash_distance') || 1;
  }

  getShieldDurationMultiplier(): number {
    return this.getSkillEffect('shield_duration') || 1;
  }

  getCoinMagnetMultiplier(): number {
    return this.getSkillEffect('coin_magnet') || 1;
  }

  getDoubleCoinsChance(): number {
    return this.getSkillEffect('double_coins');
  }

  getCoinValueMultiplier(): number {
    return this.getSkillEffect('coin_value') || 1;
  }

  getSpeedCapMultiplier(): number {
    return this.getSkillEffect('speed_cap') || 1;
  }

  getComboDurationMultiplier(): number {
    return this.getSkillEffect('combo_duration') || 1;
  }

  getComboScoreMultiplier(): number {
    return this.getSkillEffect('combo_multiplier') || 1;
  }

  getRespawnInvincibility(): number {
    return this.getSkillEffect('respawn_shield');
  }

  // Get all skills for UI
  getAllSkills(): Array<Skill & { currentLevel: number; canPurchase: boolean }> {
    return Object.values(SKILLS).map(skill => ({
      ...skill,
      currentLevel: this.getSkillLevel(skill.id),
      canPurchase: this.canPurchaseSkill(skill.id),
    }));
  }

  // Get skill by ID
  getSkill(skillId: SkillId): Skill | undefined {
    return SKILLS[skillId];
  }

  // Render skill tree UI
  render(ctx: CanvasRenderingContext2D, selectedSkill: SkillId | null): void {
    ctx.save();

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Title
    ctx.textAlign = 'center';
    ctx.font = 'bold 36px "Segoe UI", sans-serif';
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 15;
    ctx.fillText('SKILL TREE', GAME_WIDTH / 2, 50);

    // Skill points
    ctx.font = 'bold 20px "Segoe UI", sans-serif';
    ctx.fillStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    ctx.fillText(`Skill Points: ${this.skillPoints}`, GAME_WIDTH / 2, 85);
    ctx.shadowBlur = 0;

    // Draw skill trees (organized in columns)
    const trees = [
      { name: 'MOVEMENT', skills: ['jump_height', 'jump_height_2', 'dash_speed', 'dash_recovery', 'dash_distance'], x: 80 },
      { name: 'DEFENSE', skills: ['shield_duration', 'shield_recharge', 'checkpoint_save', 'respawn_shield'], x: 240 },
      { name: 'COINS', skills: ['coin_magnet', 'double_coins', 'coin_value'], x: 400 },
      { name: 'SPEED', skills: ['speed_cap', 'acceleration', 'combo_duration', 'combo_multiplier'], x: 560 },
    ];

    const startY = 130;
    const skillGap = 70;

    for (const tree of trees) {
      // Tree title
      ctx.font = 'bold 14px "Segoe UI", sans-serif';
      ctx.fillStyle = '#888';
      ctx.textAlign = 'center';
      ctx.fillText(tree.name, tree.x, startY - 20);

      // Draw skills
      tree.skills.forEach((skillId, index) => {
        const skill = SKILLS[skillId as SkillId];
        const level = this.getSkillLevel(skillId as SkillId);
        const canPurchase = this.canPurchaseSkill(skillId as SkillId);
        const isSelected = selectedSkill === skillId;
        const y = startY + index * skillGap;

        // Draw connection line to previous skill
        if (index > 0 && skill.requires) {
          const prevIndex = tree.skills.indexOf(skill.requires);
          if (prevIndex >= 0) {
            ctx.strokeStyle = level > 0 ? '#00ff88' : '#333';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(tree.x, startY + prevIndex * skillGap + 25);
            ctx.lineTo(tree.x, y - 25);
            ctx.stroke();
          }
        }

        // Skill node
        const nodeSize = 50;
        const isMaxed = level >= skill.maxLevel;
        const isLocked = skill.requires && this.getSkillLevel(skill.requires) < SKILLS[skill.requires].maxLevel;

        // Background
        let bgColor = 'rgba(50, 50, 50, 0.8)';
        let borderColor = '#444';

        if (isMaxed) {
          bgColor = 'rgba(0, 255, 136, 0.2)';
          borderColor = '#00ff88';
        } else if (canPurchase) {
          bgColor = 'rgba(255, 215, 0, 0.2)';
          borderColor = '#ffd700';
        } else if (isLocked) {
          bgColor = 'rgba(30, 30, 30, 0.8)';
          borderColor = '#222';
        }

        if (isSelected) {
          ctx.shadowColor = borderColor;
          ctx.shadowBlur = 15;
        }

        ctx.fillStyle = bgColor;
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.beginPath();
        ctx.roundRect(tree.x - nodeSize / 2, y - nodeSize / 2, nodeSize, nodeSize, 8);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Icon
        ctx.font = '24px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = isLocked ? '#444' : '#fff';
        ctx.fillText(skill.icon, tree.x, y + 8);

        // Level indicator
        ctx.font = 'bold 10px "Segoe UI", sans-serif';
        ctx.fillStyle = isMaxed ? '#00ff88' : '#fff';
        ctx.fillText(`${level}/${skill.maxLevel}`, tree.x, y + 35);
      });
    }

    // Selected skill details
    if (selectedSkill) {
      const skill = SKILLS[selectedSkill];
      const level = this.getSkillLevel(selectedSkill);
      const canPurchase = this.canPurchaseSkill(selectedSkill);

      const detailY = GAME_HEIGHT - 120;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(20, detailY - 20, GAME_WIDTH - 40, 100);
      ctx.strokeStyle = '#444';
      ctx.strokeRect(20, detailY - 20, GAME_WIDTH - 40, 100);

      ctx.textAlign = 'left';
      ctx.font = 'bold 18px "Segoe UI", sans-serif';
      ctx.fillStyle = '#fff';
      ctx.fillText(`${skill.icon} ${skill.name}`, 40, detailY + 5);

      ctx.font = '14px "Segoe UI", sans-serif';
      ctx.fillStyle = '#aaa';
      ctx.fillText(skill.description, 40, detailY + 30);

      if (level < skill.maxLevel) {
        const cost = skill.costPerLevel[level];
        ctx.fillStyle = canPurchase ? '#00ff88' : '#ff4444';
        ctx.fillText(`Cost: ${cost} points`, 40, detailY + 55);

        if (canPurchase) {
          ctx.fillStyle = '#ffd700';
          ctx.fillText('Press ENTER to purchase', 250, detailY + 55);
        }
      } else {
        ctx.fillStyle = '#00ff88';
        ctx.fillText('MAX LEVEL', 40, detailY + 55);
      }
    }

    ctx.restore();
  }

  // Save to localStorage
  private save(): void {
    const data = {
      skills: Object.fromEntries(this.unlockedSkills),
      points: this.skillPoints,
      totalEarned: this.totalPointsEarned,
    };
    localStorage.setItem('tempodash_skills', JSON.stringify(data));
  }

  // Load from localStorage
  private load(): void {
    try {
      const data = localStorage.getItem('tempodash_skills');
      if (data) {
        const parsed = JSON.parse(data);
        this.unlockedSkills = new Map(Object.entries(parsed.skills || {})) as Map<SkillId, number>;
        this.skillPoints = parsed.points || 0;
        this.totalPointsEarned = parsed.totalEarned || 0;
      }
    } catch {
      // Reset on error
      this.unlockedSkills = new Map();
      this.skillPoints = 0;
    }
  }

  // Reset all skills (refund points)
  resetSkills(): void {
    this.skillPoints = this.totalPointsEarned;
    this.unlockedSkills = new Map();
    this.save();
  }
}
