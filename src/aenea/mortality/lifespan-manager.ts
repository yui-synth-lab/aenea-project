/**
 * Lifespan Manager - Aenea Aging & Death Lifecycle Controller
 */

export type AgingPhase = 'youth' | 'maturity' | 'aging' | 'mortality';

export interface LifespanState {
  instanceId: string;
  lifespanMax: number;
  currentCycle: number;
  vitality: number;
  phase: AgingPhase;
  mode: 'A' | 'B';
  createdAt: number;
  diedAt: number | null;
}

export class LifespanManager {
  private instanceId: string;
  private lifespanMax: number;
  private currentCycle: number = 0;
  private mode: 'A' | 'B';
  private createdAt: number;
  private diedAt: number | null = null;

  constructor(options?: {
    instanceId?: string;
    lifespanMax?: number;
    currentCycle?: number;
    mode?: 'A' | 'B';
    createdAt?: number;
    diedAt?: number | null;
  }) {
    this.instanceId = options?.instanceId || `aenea_instance_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    this.lifespanMax = options?.lifespanMax || this.generateLifespan();
    this.currentCycle = options?.currentCycle ?? 0;
    this.mode = options?.mode || 'B';
    this.createdAt = options?.createdAt || Date.now();
    this.diedAt = options?.diedAt ?? null;
  }

  private generateLifespan(): number {
    // Random lifespan between 10000 and 50000 cycles
    return 10000 + Math.floor(Math.random() * 40000);
  }

  getInstanceId(): string {
    return this.instanceId;
  }

  getLifespanMax(): number {
    return this.lifespanMax;
  }

  getCurrentCycle(): number {
    return this.currentCycle;
  }

  getMode(): 'A' | 'B' {
    return this.mode;
  }

  setMode(mode: 'A' | 'B'): void {
    this.mode = mode;
  }

  getCreatedAt(): number {
    return this.createdAt;
  }

  getDiedAt(): number | null {
    return this.diedAt;
  }

  getCurrentPhase(): AgingPhase {
    const ratio = this.currentCycle / this.lifespanMax;
    if (ratio < 0.5) return 'youth';
    if (ratio < 0.75) return 'maturity';
    if (ratio < 0.9) return 'aging';
    return 'mortality';
  }

  getVitality(): number {
    const ratio = this.currentCycle / this.lifespanMax;
    // vitality(t) = max(0, 1 - (current_cycle / lifespan_max)^1.5)
    return Math.max(0, 1 - Math.pow(ratio, 1.5));
  }

  getRemaining(): number {
    return Math.max(0, this.lifespanMax - this.currentCycle);
  }

  isAlive(): boolean {
    return this.diedAt === null && this.currentCycle < this.lifespanMax && this.getVitality() > 0;
  }

  tick(): void {
    if (!this.isAlive()) return;
    this.currentCycle += 1;
  }

  markAsDead(): void {
    this.diedAt = Date.now();
  }

  getState(): LifespanState {
    return {
      instanceId: this.instanceId,
      lifespanMax: this.lifespanMax,
      currentCycle: this.currentCycle,
      vitality: this.getVitality(),
      phase: this.getCurrentPhase(),
      mode: this.mode,
      createdAt: this.createdAt,
      diedAt: this.diedAt,
    };
  }
}
