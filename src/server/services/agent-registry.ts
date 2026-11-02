/**
 * Agent registry - builds the AI executors for Aenea's agents (Phase 5,
 * extracted from the ConsciousnessBackend constructor).
 *
 * Fills the facade's existing `agents` map in place (DeathHandler holds a
 * reference to it before the agents exist) and wraps each executor so core
 * agents receive the mortality prompt while a cycle is processing.
 */

import { log } from '../../platform/logger.js';
import { createAIExecutor, AIExecutor } from '../ai-executor.js';
import { theoriaConfig } from '../../aenea/agents/theoria.js';
import { pathiaConfig } from '../../aenea/agents/pathia.js';
import { kinesisConfig } from '../../aenea/agents/kinesis.js';
import { systemConfig } from '../../aenea/agents/system.js';
import { aeneaConfig } from '../../aenea/agents/aenea.js';
import { somniaAgentConfig } from '../../aenea/agents/somnia.js';
import type { ConsciousnessInternals } from './consciousness-internals.js';

type MortalityContext = Pick<ConsciousnessInternals, 'lifespanManager' | 'mortalityInjector' | 'isProcessingCycle'>;

const CORE_AGENTS = ['theoria', 'pathia', 'kinesis', 'aenea', 'system'];

export function registerAgentExecutors(agents: Map<string, AIExecutor>, ctx: MortalityContext): void {
  // Initialize AI agents with individual configurations (including generation params)
  log.info('Consciousness', `Initializing AI agents with individual configurations`);

  agents.set('theoria', createAIExecutor('theoria', {
    provider: theoriaConfig.modelConfig.provider as any,
    model: theoriaConfig.modelConfig.model,
    ...theoriaConfig.generationParams
  }));

  agents.set('pathia', createAIExecutor('pathia', {
    provider: pathiaConfig.modelConfig.provider as any,
    model: pathiaConfig.modelConfig.model,
    ...pathiaConfig.generationParams
  }));

  agents.set('kinesis', createAIExecutor('kinesis', {
    provider: kinesisConfig.modelConfig.provider as any,
    model: kinesisConfig.modelConfig.model,
    ...kinesisConfig.generationParams
  }));

  // System agent for internal processing (Compiler & Scribe)
  agents.set('system', createAIExecutor('system', {
    provider: systemConfig.modelConfig.provider as any,
    model: systemConfig.modelConfig.model,
    ...systemConfig.generationParams
  }));

  // Aenea core agent for unified consciousness (dialogue + question generation)
  agents.set('aenea', createAIExecutor('aenea', {
    provider: aeneaConfig.provider as any,
    model: aeneaConfig.model,
    ...aeneaConfig.generationParams
  }));

  // Somnia Interoceptive Cortex agent (Slow Track for body feelings)
  agents.set('somnia', createAIExecutor('somnia', {
    provider: somniaAgentConfig.modelConfig.provider as any,
    model: somniaAgentConfig.modelConfig.model,
    ...somniaAgentConfig.generationParams
  }));

  log.info('Consciousness', `✅ Agents initialized with individual personalities:`);
  log.info('Consciousness', `  - ${theoriaConfig.displayName} (${theoriaConfig.furigana}): ${theoriaConfig.modelConfig.provider}/${theoriaConfig.modelConfig.model}`);
  log.info('Consciousness', `    Temperature: ${theoriaConfig.generationParams.temperature}, Style: ${theoriaConfig.style}`);
  log.info('Consciousness', `  - ${pathiaConfig.displayName} (${pathiaConfig.furigana}): ${pathiaConfig.modelConfig.provider}/${pathiaConfig.modelConfig.model}`);
  log.info('Consciousness', `    Temperature: ${pathiaConfig.generationParams.temperature}, Style: ${pathiaConfig.style}`);
  log.info('Consciousness', `  - ${kinesisConfig.displayName} (${kinesisConfig.furigana}): ${kinesisConfig.modelConfig.provider}/${kinesisConfig.modelConfig.model}`);
  log.info('Consciousness', `    Temperature: ${kinesisConfig.generationParams.temperature}, Style: ${kinesisConfig.style}`);
  log.info('Consciousness', `  - ${systemConfig.displayName} (${systemConfig.furigana}): ${systemConfig.modelConfig.provider}/${systemConfig.modelConfig.model}`);
  log.info('Consciousness', `    Temperature: ${systemConfig.generationParams.temperature}, Style: ${systemConfig.style}`);
  log.info('Consciousness', `  - ${somniaAgentConfig.displayName} (${somniaAgentConfig.furigana}): ${somniaAgentConfig.modelConfig.provider}/${somniaAgentConfig.modelConfig.model}`);
  log.info('Consciousness', `    Temperature: ${somniaAgentConfig.generationParams.temperature}, Role: Interoceptive Cortex (Slow Track)`);
  log.info('Consciousness', `  - ${aeneaConfig.displayName}: ${aeneaConfig.provider}/${aeneaConfig.model}`);
  log.info('Consciousness', `    Temperature: ${aeneaConfig.generationParams.temperature}, Role: Unified consciousness (dialogue + questions)`);

  // Wrap execute method of each agent to inject mortality prompt
  for (const [agentId, agent] of agents.entries()) {
    const originalExecute = agent.execute.bind(agent);
    agent.execute = async (prompt: string, systemPrompt?: string) => {
      let injectedSystemPrompt = systemPrompt || '';
      const isCoreAgent = CORE_AGENTS.includes(agentId);

      if (ctx.lifespanManager && isCoreAgent && (ctx.isProcessingCycle || agentId === 'aenea')) {
        injectedSystemPrompt = ctx.mortalityInjector.injectIntoPrompt(injectedSystemPrompt);
      }
      return originalExecute(prompt, injectedSystemPrompt);
    };
  }
}
