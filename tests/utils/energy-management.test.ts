/**
 * Energy Management Tests - Minimal Implementation Tests
 */

import { EnergyManager, getEnergyManager, resetEnergyManager } from '../../src/utils/energy-management';

describe('EnergyManager', () => {
  let energyManager: EnergyManager;

  beforeEach(() => {
    resetEnergyManager();
    energyManager = getEnergyManager();
  });

  describe('Initialization', () => {
    test('should initialize with default energy', () => {
      const state = energyManager.getEnergyState();
      expect(state).toBeDefined();
      expect(state.total).toBeGreaterThan(0);
      expect(state.available).toBeGreaterThan(0);
    });

    test('should have valid efficiency', () => {
      const state = energyManager.getEnergyState();
      expect(state.efficiency).toBeGreaterThan(0);
      expect(state.efficiency).toBeLessThanOrEqual(1);
    });
  });

  describe('Energy Operations', () => {
    test('should consume energy for activities', async () => {
      const result = await energyManager.consumeEnergy(10, 'thinking');
      expect(typeof result).toBe('boolean');
    });

    test('should check energy sufficiency', () => {
      const sufficient = energyManager.isEnergySufficient(5);
      expect(typeof sufficient).toBe('boolean');
    });

    test('should recharge energy', async () => {
      await energyManager.consumeEnergy(20, 'thinking');
      expect(() => energyManager.rechargeEnergy(10)).not.toThrow();
    });

    test('should reset energy', async () => {
      await energyManager.consumeEnergy(30, 'thinking');
      energyManager.resetEnergy();
      const state = energyManager.getEnergyState();
      expect(state.available).toBeGreaterThan(0);
    });
  });

  describe('Energy Levels', () => {
    test('should report energy level', () => {
      const level = energyManager.getEnergyLevel();
      expect(['critical', 'low', 'moderate', 'high', 'maximum']).toContain(level);
    });
  });

  describe('Singleton Pattern', () => {
    test('should return same instance', () => {
      const instance1 = getEnergyManager();
      const instance2 = getEnergyManager();
      expect(instance1).toBe(instance2);
    });

    test('should reset and create new instance', async () => {
      const instance1 = getEnergyManager();
      await instance1.consumeEnergy(20, 'test');

      resetEnergyManager();
      const instance2 = getEnergyManager();

      expect(instance2.getEnergyState().available).toBeGreaterThan(instance1.getEnergyState().available);
    });
  });
});
