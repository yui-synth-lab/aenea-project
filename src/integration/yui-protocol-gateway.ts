/**
 * Yui Protocol Gateway — the single boundary into yui-protocol/dist.
 *
 * This is the ONLY file permitted to reach into `yui-protocol/dist` directly
 * (enforced by the `no-reach-into-yui-dist` dependency-cruiser rule). All other
 * src/ modules consume yui-protocol exclusively through this gateway.
 *
 * Responsibilities:
 * - Dynamically load a Yui agent's personality config (used by yui-consultation).
 * - Re-export the AIExecutor surface so src/server/ai-executor.ts can forward it.
 */

import { log } from '../platform/logger.js';

// Re-export Yui Protocol's AIExecutor functionality (mirrors the legacy
// src/server/ai-executor.ts public surface so downstream importers are unchanged).
// @ts-ignore
export { createAIExecutor } from '../../yui-protocol/dist/kernel/ai-executor-impl.js';
// @ts-ignore
export { AIExecutor } from '../../yui-protocol/dist/kernel/ai-executor.js';

/**
 * Configuration shape consumed by yui-consultation. Mirrors the fields read off
 * a Yui agent's `.agent` config.
 */
export interface YuiAgentConfig {
  name: string;
  personality: string;
  tone: string;
  communicationStyle?: string;
  style?: string;
  specificBehaviors?: string;
  thinkingPatterns?: string;
  interactionPatterns?: string;
  [key: string]: any;
}

/**
 * Load a Yui Protocol agent's personality configuration by agent id.
 *
 * Dynamically imports the agent module from yui-protocol/dist, instantiates the
 * agent class, and extracts its `.agent` config. Returns null if the agent id is
 * unknown, the class is missing, or the config is inaccessible.
 */
export async function loadYuiAgentConfig(agentId: string): Promise<YuiAgentConfig | null> {
  try {
    // Map agent id to the yui-protocol agent module name
    const agentMap: Record<string, string> = {
      'eiro-001': 'agent-eiro',
      'hekito-001': 'agent-hekito',
      'kanshi-001': 'agent-kanshi',
      'yoga-001': 'agent-yoga',
      'yui-001': 'agent-yui'
    };

    const agentModule = agentMap[agentId];
    if (!agentModule) {
      log.warn('YuiProtocolGateway', `Unknown agent ID: ${agentId}, using default`);
      return null;
    }

    // Import agent configuration from yui-protocol (use dist for built files)
    const module = await import(`../../yui-protocol/dist/agents/${agentModule}.js`);

    // Get the agent class (e.g., agent-eiro -> EiroAgent, with capitalized first letter)
    const baseName = agentModule.replace('agent-', '');
    const agentClassName = baseName.charAt(0).toUpperCase() + baseName.slice(1) + 'Agent';

    log.info('YuiProtocolGateway', `Loading agent class: ${agentClassName} from module: ${agentModule}`);
    log.info('YuiProtocolGateway', `Available exports: ${Object.keys(module).join(', ')}`);

    const AgentClass = module[agentClassName];

    if (!AgentClass) {
      log.warn('YuiProtocolGateway', `Agent class not found for ${agentModule}, tried: ${agentClassName}`);
      return null;
    }

    // Create agent instance to access config
    const agentInstance = new AgentClass();
    const config = agentInstance.agent; // BaseAgent stores config in .agent property

    if (!config) {
      log.warn('YuiProtocolGateway', `Config not accessible from agent instance: ${agentModule}`);
      return null;
    }

    log.info('YuiProtocolGateway', `Successfully loaded config for ${agentId}: ${config.name}`);
    return config;
  } catch (error) {
    log.error('YuiProtocolGateway', `Failed to load Yui agent ${agentId}`, error);
    return null;
  }
}
