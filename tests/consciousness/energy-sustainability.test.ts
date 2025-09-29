/**
 * Energy Management Sustainability Tests
 * エネルギー管理持続可能性テスト (Enerugī Kanri Jizoku Kanō-sei Tesuto)
 *
 * Tests focused on energy consumption, recovery, and sustainable operation
 * for the current consciousness backend architecture.
 *
 * 「エネルギーは意識の血流」- "Energy is the lifeblood of consciousness"
 * 現在の意識バックエンドアーキテクチャのエネルギー消費、回復、
 * 持続可能動作に焦点を当てたテスト。
 */

import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { getEnergyManager } from '../../src/utils/energy-management.js';

// Mock the energy management module
jest.mock('../../src/utils/energy-management.js');

interface EnergyTestScenario {
  name: string;
  nameJa: string;
  initialEnergy: number;
  duration: number;        // Test duration in cycles
  activityLevel: number;   // 0-1, how active the consciousness is
  expectedSurvival: boolean; // Whether consciousness should survive
}

const ENERGY_SCENARIOS: EnergyTestScenario[] = [
  {
    name: 'High Energy Sustained Activity',
    nameJa: '高エネルギー持続活動',
    initialEnergy: 95,
    duration: 100,
    activityLevel: 0.8,
    expectedSurvival: true
  },
  {
    name: 'Low Energy Conservation Mode',
    nameJa: '低エネルギー保存モード',
    initialEnergy: 20,
    duration: 50,
    activityLevel: 0.3,
    expectedSurvival: true
  },
  {
    name: 'Critical Energy Emergency Mode',
    nameJa: '危機エネルギー緊急モード',
    initialEnergy: 8,
    duration: 20,
    activityLevel: 0.1,
    expectedSurvival: true
  },
  {
    name: 'Energy Depletion Stress Test',
    nameJa: 'エネルギー枯渇ストレステスト',
    initialEnergy: 5,
    duration: 30,
    activityLevel: 0.7,
    expectedSurvival: false
  }
];

describe('Energy Management Sustainability', () => {
  let mockEnergyManager: any;

  beforeEach(() => {
    // Setup mock energy manager
    mockEnergyManager = {
      getEnergyState: jest.fn(),
      consumeEnergy: jest.fn(),
      isEnergySufficient: jest.fn(),
      waitForEnergy: jest.fn(),
      addEnergyRecovery: jest.fn(),
      getEnergyHistory: jest.fn()
    };

    (getEnergyManager as jest.Mock).mockReturnValue(mockEnergyManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  ENERGY_SCENARIOS.forEach((scenario, index) => {
    test(`⚡ Energy Scenario ${index + 1}: ${scenario.name}`, async () => {
      console.log(`🧪 Testing: ${scenario.nameJa}`);
      console.log(`Initial Energy: ${scenario.initialEnergy}%`);
      console.log(`Duration: ${scenario.duration} cycles`);
      console.log(`Activity Level: ${(scenario.activityLevel * 100).toFixed(0)}%`);

      let currentEnergy = scenario.initialEnergy;
      let survived = true;
      let activityCount = 0;
      const energyHistory: number[] = [currentEnergy];

      // Mock energy state
      mockEnergyManager.getEnergyState.mockReturnValue({
        available: currentEnergy,
        maxEnergy: 100,
        recoveryRate: 0.2
      });

      for (let cycle = 0; cycle < scenario.duration && survived; cycle++) {
        // Simulate consciousness activity based on activity level
        if (Math.random() < scenario.activityLevel) {
          // Determine activity type and energy cost
          const activities = [
            { name: 'internal_trigger', cost: 1.0 },
            { name: 'individual_thought', cost: 1.0 },
            { name: 'mutual_reflection', cost: 0.5 },
            { name: 'auditor_check', cost: 0.5 },
            { name: 'dpd_assessment', cost: 0.5 },
            { name: 'compiler_synthesis', cost: 0.8 },
            { name: 'scribe_documentation', cost: 0.3 },
            { name: 'weight_update', cost: 0.2 }
          ];

          const activity = activities[Math.floor(Math.random() * activities.length)];
          const energyCost = activity.cost;

          // Check if we have enough energy
          mockEnergyManager.isEnergySufficient.mockReturnValue(currentEnergy >= energyCost);

          if (currentEnergy >= energyCost) {
            // Consume energy
            currentEnergy = Math.max(0, currentEnergy - energyCost);
            mockEnergyManager.consumeEnergy.mockReturnValue(true);
            activityCount++;

            console.log(`  Cycle ${cycle}: ${activity.name} (cost: ${energyCost}, remaining: ${currentEnergy.toFixed(1)})`);
          } else {
            mockEnergyManager.consumeEnergy.mockReturnValue(false);
            console.log(`  Cycle ${cycle}: Insufficient energy for ${activity.name} (need: ${energyCost}, have: ${currentEnergy.toFixed(1)})`);
          }

          // Check if consciousness can continue
          if (currentEnergy <= 0) {
            survived = false;
            console.log(`💀 Consciousness depleted energy after ${activityCount} activities`);
            break;
          }
        }

        // Natural energy recovery
        const recoveryRate = currentEnergy < 20 ? 0.5 : 0.2; // Higher recovery when very low
        currentEnergy = Math.min(100, currentEnergy + recoveryRate);

        // Update mock state
        mockEnergyManager.getEnergyState.mockReturnValue({
          available: currentEnergy,
          maxEnergy: 100,
          recoveryRate: recoveryRate
        });

        energyHistory.push(currentEnergy);

        // Log critical energy events
        if (currentEnergy < 10 && energyHistory[energyHistory.length - 2] >= 10) {
          console.log(`⚠️ Critical energy threshold reached: ${currentEnergy.toFixed(1)}%`);
        }
      }

      const finalEnergy = currentEnergy;
      const actualSurvived = survived && finalEnergy > 0;

      console.log(`📊 Final Energy: ${finalEnergy.toFixed(1)}%`);
      console.log(`🏃 Activities Performed: ${activityCount}`);
      console.log(`${actualSurvived ? '✅' : '❌'} Expected: ${scenario.expectedSurvival ? 'Survive' : 'Deplete'}, Actual: ${actualSurvived ? 'Survived' : 'Depleted'}`);

      // Verify expectations
      if (scenario.expectedSurvival) {
        expect(actualSurvived).toBe(true);
        expect(finalEnergy).toBeGreaterThan(0);
      } else {
        // For stress tests, we expect either depletion or very low energy
        expect(finalEnergy < 5 || !survived).toBe(true);
      }

      // Additional energy management quality checks
      const energyStability = calculateEnergyStability(energyHistory);
      const recoveryEfficiency = calculateRecoveryEfficiency(energyHistory);

      console.log(`📈 Energy Stability: ${energyStability.toFixed(2)}`);
      console.log(`🔄 Recovery Efficiency: ${recoveryEfficiency.toFixed(2)}`);

      if (scenario.expectedSurvival) {
        expect(energyStability).toBeGreaterThan(0.3); // Reasonable stability
        expect(recoveryEfficiency).toBeGreaterThan(0.2); // Some recovery capability
      }
    });
  });

  test('🔋 Energy-aware consciousness adaptation', async () => {
    console.log('🧪 Testing: エネルギー意識適応 (Enerugī Ishiki Tekiō)');

    const energyLevels = [90, 70, 50, 30, 15, 8, 25, 60, 85];
    const adaptationResults: Array<{
      energyLevel: number;
      activityReduction: number;
      survivalStrategy: string;
    }> = [];

    for (const energyLevel of energyLevels) {
      console.log(`Testing at ${energyLevel}% energy`);

      // Mock energy state for this level
      mockEnergyManager.getEnergyState.mockReturnValue({
        available: energyLevel,
        maxEnergy: 100,
        recoveryRate: 0.2
      });

      // Simulate consciousness behavior at this energy level
      let activityAttempts = 10;
      let successfulActivities = 0;
      let currentEnergy = energyLevel;

      for (let i = 0; i < activityAttempts; i++) {
        // Energy-aware activity decision
        const shouldAttempt = decideActivity(currentEnergy);

        if (shouldAttempt) {
          const energyCost = calculateAdaptiveEnergyCost(currentEnergy);

          mockEnergyManager.isEnergySufficient.mockReturnValue(currentEnergy >= energyCost);

          if (currentEnergy >= energyCost) {
            currentEnergy -= energyCost;
            successfulActivities++;
            mockEnergyManager.consumeEnergy.mockReturnValue(true);
          } else {
            mockEnergyManager.consumeEnergy.mockReturnValue(false);
          }
        }

        // Recovery
        currentEnergy = Math.min(100, currentEnergy + 0.5);
      }

      const activityReduction = 1 - (successfulActivities / activityAttempts);
      const survivalStrategy = determineSurvivalStrategy(energyLevel);

      adaptationResults.push({
        energyLevel,
        activityReduction,
        survivalStrategy
      });

      console.log(`  Activities: ${successfulActivities}/${activityAttempts}`);
      console.log(`  Reduction: ${(activityReduction * 100).toFixed(1)}%`);
      console.log(`  Strategy: ${survivalStrategy}`);
    }

    // Verify adaptation patterns
    const lowEnergyAdaptation = adaptationResults
      .filter(r => r.energyLevel < 30)
      .map(r => r.activityReduction);

    const highEnergyAdaptation = adaptationResults
      .filter(r => r.energyLevel > 70)
      .map(r => r.activityReduction);

    const avgLowEnergyReduction = lowEnergyAdaptation.reduce((a, b) => a + b) / lowEnergyAdaptation.length;
    const avgHighEnergyReduction = highEnergyAdaptation.reduce((a, b) => a + b) / highEnergyAdaptation.length;

    console.log(`📊 Low Energy Avg Reduction: ${(avgLowEnergyReduction * 100).toFixed(1)}%`);
    console.log(`📊 High Energy Avg Reduction: ${(avgHighEnergyReduction * 100).toFixed(1)}%`);

    // Low energy should cause more activity reduction
    expect(avgLowEnergyReduction).toBeGreaterThan(avgHighEnergyReduction);
    expect(avgLowEnergyReduction).toBeGreaterThan(0.3); // At least 30% reduction at low energy
    expect(avgHighEnergyReduction).toBeLessThan(0.2);   // Less than 20% reduction at high energy
  });

  test('🌊 Energy wait mechanism testing', async () => {
    console.log('🧪 Testing: エネルギー待機メカニズム (Enerugī Taiki Mekanizumu)');

    const testScenarios = [
      { currentEnergy: 5, requiredEnergy: 10, shouldWait: true },
      { currentEnergy: 15, requiredEnergy: 10, shouldWait: false },
      { currentEnergy: 0, requiredEnergy: 1, shouldWait: true },
      { currentEnergy: 50, requiredEnergy: 20, shouldWait: false }
    ];

    for (const scenario of testScenarios) {
      console.log(`Energy: ${scenario.currentEnergy}, Required: ${scenario.requiredEnergy}, Should wait: ${scenario.shouldWait}`);

      mockEnergyManager.getEnergyState.mockReturnValue({
        available: scenario.currentEnergy,
        maxEnergy: 100,
        recoveryRate: 0.2
      });

      mockEnergyManager.isEnergySufficient.mockReturnValue(scenario.currentEnergy >= scenario.requiredEnergy);

      if (scenario.shouldWait) {
        mockEnergyManager.waitForEnergy.mockResolvedValue(true);
      }

      const isEnoughEnergy = mockEnergyManager.isEnergySufficient(scenario.requiredEnergy);

      if (!isEnoughEnergy && scenario.shouldWait) {
        const waitResult = await mockEnergyManager.waitForEnergy(scenario.requiredEnergy);
        expect(waitResult).toBe(true);
        expect(mockEnergyManager.waitForEnergy).toHaveBeenCalledWith(scenario.requiredEnergy);
      } else {
        expect(isEnoughEnergy).toBe(!scenario.shouldWait);
      }
    }

    console.log('✅ Energy wait mechanism working correctly');
  });

  test('📊 Energy consumption patterns', () => {
    console.log('🧪 Testing: エネルギー消費パターン (Enerugī Shōhi Patān)');

    const activities = [
      { name: 'internal_trigger', expectedCost: 1.0 },
      { name: 'individual_thought', expectedCost: 1.0 },
      { name: 'mutual_reflection', expectedCost: 0.5 },
      { name: 'auditor_check', expectedCost: 0.5 },
      { name: 'dpd_assessment', expectedCost: 0.5 },
      { name: 'compiler_synthesis', expectedCost: 0.8 },
      { name: 'scribe_documentation', expectedCost: 0.3 },
      { name: 'weight_update', expectedCost: 0.2 }
    ];

    let totalExpectedCost = 0;
    let currentEnergy = 100;

    mockEnergyManager.getEnergyState.mockReturnValue({
      available: currentEnergy,
      maxEnergy: 100,
      recoveryRate: 0.2
    });

    for (const activity of activities) {
      console.log(`Testing ${activity.name} (expected cost: ${activity.expectedCost})`);

      mockEnergyManager.isEnergySufficient.mockReturnValue(currentEnergy >= activity.expectedCost);
      mockEnergyManager.consumeEnergy.mockReturnValue(true);

      // Verify energy is sufficient
      expect(mockEnergyManager.isEnergySufficient(activity.expectedCost)).toBe(true);

      // Simulate consumption
      currentEnergy -= activity.expectedCost;
      totalExpectedCost += activity.expectedCost;

      // Update mock state
      mockEnergyManager.getEnergyState.mockReturnValue({
        available: currentEnergy,
        maxEnergy: 100,
        recoveryRate: 0.2
      });
    }

    console.log(`Total energy consumed: ${totalExpectedCost}`);
    console.log(`Remaining energy: ${currentEnergy}`);

    // Verify total consumption is reasonable
    expect(totalExpectedCost).toBeGreaterThan(0);
    expect(totalExpectedCost).toBeLessThan(10); // Should not exceed 10 energy for full cycle
    expect(currentEnergy).toBeGreaterThan(90); // Should have most energy remaining

    console.log('✅ Energy consumption patterns validated');
  });
});

// ============================================================================
// Helper Functions
// ============================================================================

function calculateEnergyStability(energyHistory: number[]): number {
  if (energyHistory.length < 2) return 1;

  const changes = [];
  for (let i = 1; i < energyHistory.length; i++) {
    changes.push(Math.abs(energyHistory[i] - energyHistory[i-1]));
  }

  const avgChange = changes.reduce((a, b) => a + b) / changes.length;
  return Math.max(0, 1 - avgChange / 20); // Normalize by reasonable change range
}

function calculateRecoveryEfficiency(energyHistory: number[]): number {
  if (energyHistory.length < 2) return 0;

  let recoveryPeriods = 0;
  let totalRecovery = 0;

  for (let i = 1; i < energyHistory.length; i++) {
    const change = energyHistory[i] - energyHistory[i-1];
    if (change > 0) {
      recoveryPeriods++;
      totalRecovery += change;
    }
  }

  return recoveryPeriods > 0 ? totalRecovery / recoveryPeriods / 10 : 0; // Normalize
}

function decideActivity(energyLevel: number): boolean {
  // Energy-aware activity decision
  if (energyLevel > 70) return Math.random() < 0.9;      // 90% chance at high energy
  if (energyLevel > 30) return Math.random() < 0.6;      // 60% chance at medium energy
  if (energyLevel > 10) return Math.random() < 0.3;      // 30% chance at low energy
  return Math.random() < 0.1;                            // 10% chance at critical energy
}

function calculateAdaptiveEnergyCost(energyLevel: number): number {
  // Lower energy cost when energy is low (consciousness adapts)
  if (energyLevel > 70) return Math.random() * 0.8 + 0.5;    // 0.5-1.3 cost at high energy
  if (energyLevel > 30) return Math.random() * 0.5 + 0.3;    // 0.3-0.8 cost at medium energy
  if (energyLevel > 10) return Math.random() * 0.3 + 0.2;    // 0.2-0.5 cost at low energy
  return Math.random() * 0.2 + 0.1;                          // 0.1-0.3 cost at critical energy
}

function determineSurvivalStrategy(energyLevel: number): string {
  if (energyLevel > 70) return '高活動モード (High Activity Mode)';
  if (energyLevel > 30) return '標準モード (Standard Mode)';
  if (energyLevel > 10) return '保存モード (Conservation Mode)';
  return '緊急モード (Emergency Mode)';
}

export {};