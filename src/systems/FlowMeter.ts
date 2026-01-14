// Flow Meter / Overdrive Mode System
// Builds through skillful play, triggers Overdrive when full

export interface FlowMeterState {
  current: number;      // 0-100
  isOverdrive: boolean;
  overdriveDuration: number;  // remaining ms
}

export class FlowMeterManager {
  private meter = 0;                    // 0-100
  private isOverdrive = false;
  private overdriveDuration = 0;
  private overdriveTimeRemaining = 0;

  // Configuration
  private static readonly MAX_METER = 100;
  private static readonly OVERDRIVE_DURATION = 5000;     // 5 seconds of Overdrive
  private static readonly DECAY_RATE = 2;                // Points lost per second when idle
  private static readonly DECAY_DELAY = 1500;            // ms before decay starts

  // Gain amounts
  private static readonly GAIN_PERFECT_LANDING = 3;      // Land on platform perfectly
  private static readonly GAIN_ON_BEAT_JUMP = 5;         // Jump exactly on beat
  private static readonly GAIN_COIN_COLLECT = 2;         // Collect a coin
  private static readonly GAIN_NEAR_MISS = 8;            // Close call with hazard
  private static readonly GAIN_COMBO_MILESTONE = 10;     // Hit combo milestone (5, 10, 15...)
  private static readonly GAIN_DASH = 4;                 // Trigger dash

  // Loss amounts
  private static readonly LOSS_DEATH = 50;               // Lose half on death

  private lastGainTime = 0;
  private comboMilestoneTracked = 0;

  // Visual pulse effect
  private pulseIntensity = 0;

  constructor() {
    this.reset();
  }

  reset(): void {
    this.meter = 0;
    this.isOverdrive = false;
    this.overdriveDuration = 0;
    this.overdriveTimeRemaining = 0;
    this.lastGainTime = 0;
    this.comboMilestoneTracked = 0;
    this.pulseIntensity = 0;
  }

  update(deltaTime: number): void {
    const now = performance.now();

    // Update Overdrive timer
    if (this.isOverdrive) {
      this.overdriveTimeRemaining -= deltaTime;
      if (this.overdriveTimeRemaining <= 0) {
        this.endOverdrive();
      }
    } else {
      // Decay meter when not in Overdrive and no recent gains
      if (now - this.lastGainTime > FlowMeterManager.DECAY_DELAY) {
        this.meter = Math.max(0, this.meter - FlowMeterManager.DECAY_RATE * (deltaTime / 1000));
      }
    }

    // Decay pulse effect
    if (this.pulseIntensity > 0) {
      this.pulseIntensity = Math.max(0, this.pulseIntensity - deltaTime * 0.003);
    }
  }

  // Gain methods - call these when player does skillful things
  onPerfectLanding(): void {
    this.addMeter(FlowMeterManager.GAIN_PERFECT_LANDING);
  }

  onOnBeatJump(): void {
    this.addMeter(FlowMeterManager.GAIN_ON_BEAT_JUMP);
  }

  onCoinCollect(): void {
    this.addMeter(FlowMeterManager.GAIN_COIN_COLLECT);
  }

  onNearMiss(): void {
    this.addMeter(FlowMeterManager.GAIN_NEAR_MISS);
  }

  onComboMilestone(combo: number): void {
    // Only trigger once per milestone (5, 10, 15, 20, 25)
    const milestone = Math.floor(combo / 5) * 5;
    if (milestone > this.comboMilestoneTracked && milestone >= 5) {
      this.comboMilestoneTracked = milestone;
      this.addMeter(FlowMeterManager.GAIN_COMBO_MILESTONE);
    }
  }

  onDash(): void {
    this.addMeter(FlowMeterManager.GAIN_DASH);
  }

  onDeath(): void {
    if (!this.isOverdrive) {
      this.meter = Math.max(0, this.meter - FlowMeterManager.LOSS_DEATH);
    }
    this.comboMilestoneTracked = 0;
  }

  // Activate Overdrive (called by player input when meter is full)
  activateOverdrive(): boolean {
    if (this.meter >= FlowMeterManager.MAX_METER && !this.isOverdrive) {
      this.isOverdrive = true;
      this.overdriveTimeRemaining = FlowMeterManager.OVERDRIVE_DURATION;
      this.overdriveDuration = FlowMeterManager.OVERDRIVE_DURATION;
      this.meter = 0; // Consume the meter
      this.pulseIntensity = 1;
      return true;
    }
    return false;
  }

  private endOverdrive(): void {
    this.isOverdrive = false;
    this.overdriveTimeRemaining = 0;
    this.overdriveDuration = 0;
  }

  private addMeter(amount: number): void {
    if (this.isOverdrive) return; // Can't gain during Overdrive

    this.meter = Math.min(FlowMeterManager.MAX_METER, this.meter + amount);
    this.lastGainTime = performance.now();
    this.pulseIntensity = Math.min(1, this.pulseIntensity + 0.3);
  }

  // Getters for Game/UI
  getMeter(): number {
    return this.meter;
  }

  getMeterPercent(): number {
    return this.meter / FlowMeterManager.MAX_METER;
  }

  isInOverdrive(): boolean {
    return this.isOverdrive;
  }

  getOverdriveTimeRemaining(): number {
    return this.overdriveTimeRemaining;
  }

  getOverdrivePercent(): number {
    if (!this.isOverdrive || this.overdriveDuration === 0) return 0;
    return this.overdriveTimeRemaining / this.overdriveDuration;
  }

  isMeterFull(): boolean {
    return this.meter >= FlowMeterManager.MAX_METER;
  }

  getPulseIntensity(): number {
    return this.pulseIntensity;
  }

  // Score multiplier during Overdrive
  getScoreMultiplier(): number {
    return this.isOverdrive ? 3 : 1;
  }

  // Invincibility during Overdrive
  isInvincible(): boolean {
    return this.isOverdrive;
  }

  getState(): FlowMeterState {
    return {
      current: this.meter,
      isOverdrive: this.isOverdrive,
      overdriveDuration: this.overdriveTimeRemaining,
    };
  }
}
