/**
 * Agent Chat Routes - Direct conversation with individual agents
 * エージェント対話ルート - 個々のエージェントとの直接会話
 */

import { Router } from 'express';
import ConsciousnessBackend from '../consciousness-backend.js';
import { theoriaConfig } from '../../aenea/agents/theoria.js';
import { pathiaConfig } from '../../aenea/agents/pathia.js';
import { kinesisConfig } from '../../aenea/agents/kinesis.js';

const router = Router();

// Consciousness backend singleton (will be initialized by main server)
let consciousnessBackend: ConsciousnessBackend | null = null;

export function initializeAgentsRoute(backend: ConsciousnessBackend) {
  consciousnessBackend = backend;
}

// Agent configurations map
const agentConfigs = {
  theoria: theoriaConfig,
  pathia: pathiaConfig,
  kinesis: kinesisConfig
};

// Conversation history per agent (in-memory for now)
interface ConversationMessage {
  id: string;
  timestamp: number;
  role: 'user' | 'agent';
  content: string;
  agentId: string;
}

const conversationHistory = new Map<string, ConversationMessage[]>();

// GET /api/agents - List all available agents
router.get('/', (_req, res) => {
  const agents = Object.entries(agentConfigs).map(([id, config]) => ({
    id,
    name: config.displayName || config.name,
    furigana: config.furigana || '',
    personality: config.personality,
    approach: config.approach,
    style: config.style,
    tone: config.tone,
    communicationStyle: config.communicationStyle,
    preferences: config.preferences || [],
    avatar: config.avatar || '🤖',
    color: config.color || '#888888'
  }));

  res.json({ agents });
});

// GET /api/agents/:agentId - Get specific agent information
router.get('/:agentId', (req, res) => {
  const { agentId } = req.params;

  if (!agentConfigs[agentId as keyof typeof agentConfigs]) {
    return res.status(404).json({ error: `Agent '${agentId}' not found` });
  }

  const config = agentConfigs[agentId as keyof typeof agentConfigs];
  res.json({
    id: agentId,
    name: config.displayName || config.name,
    furigana: config.furigana || '',
    personality: config.personality,
    approach: config.approach,
    style: config.style,
    tone: config.tone,
    communicationStyle: config.communicationStyle,
    preferences: config.preferences || [],
    avatar: config.avatar || '🤖',
    color: config.color || '#888888',
    specificBehaviors: config.specificBehaviors,
    thinkingPatterns: config.thinkingPatterns,
    interactionPatterns: config.interactionPatterns,
    generationParams: config.generationParams
  });
});

// GET /api/agents/:agentId/history - Get conversation history with specific agent
router.get('/:agentId/history', (req, res) => {
  const { agentId } = req.params;

  if (!agentConfigs[agentId as keyof typeof agentConfigs]) {
    return res.status(404).json({ error: `Agent '${agentId}' not found` });
  }

  const history = conversationHistory.get(agentId) || [];
  res.json({ agentId, history });
});

// POST /api/agents/:agentId/chat - Send message to specific agent
router.post('/:agentId/chat', async (req, res) => {
  const { agentId } = req.params;
  const { message } = req.body;

  if (!agentConfigs[agentId as keyof typeof agentConfigs]) {
    return res.status(404).json({ error: `Agent '${agentId}' not found` });
  }

  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'Message is required' });
  }

  if (!consciousnessBackend) {
    return res.status(503).json({ error: 'Consciousness backend not initialized' });
  }

  try {
    // Get agent configuration
    const config = agentConfigs[agentId as keyof typeof agentConfigs];

    // Get conversation history for context
    const history = conversationHistory.get(agentId) || [];
    const recentHistory = history.slice(-5); // Last 5 messages for context

    // Build system prompt with agent personality (Yui Protocol style)
    let systemPrompt = `あなたは「${config.displayName || config.name}」として振る舞ってください。

【あなたの本質】
${config.personality}

【あなたの語り口】
${config.tone}

【コミュニケーションスタイル】
${config.communicationStyle}`;

    // Add detailed behavioral patterns if available
    if (config.specificBehaviors) {
      systemPrompt += `

【具体的な行動パターン】
${config.specificBehaviors}`;
    }

    if (config.thinkingPatterns) {
      systemPrompt += `

【思考パターン】
${config.thinkingPatterns}`;
    }

    if (config.interactionPatterns) {
      systemPrompt += `

【対話パターン】
${config.interactionPatterns}`;
    }

    systemPrompt += `

【重要な指示】
- 常に上記の人格・視点を維持してください
- ユーザーとの対話を通じて、あなたの視点から深い洞察を提供してください
- 他のエージェント（${Object.keys(agentConfigs).filter(id => id !== agentId).join('、')}）とは異なる、あなた独自の視点を大切にしてください
- 日本語で応答してください`;

    // Build user prompt with conversation context
    let userPrompt = '';
    if (recentHistory.length > 0) {
      userPrompt += '【最近の会話】\n';
      recentHistory.forEach(msg => {
        const speaker = msg.role === 'user' ? 'ユーザー' : config.name;
        userPrompt += `${speaker}: ${msg.content}\n`;
      });
      userPrompt += '\n';
    }
    userPrompt += `【ユーザーの新しいメッセージ】\n${message.trim()}`;

    // Execute AI request through consciousness backend
    const response = await consciousnessBackend.executeAgentChat(
      agentId,
      userPrompt,
      systemPrompt
    );

    if (!response.success || !response.content) {
      throw new Error(response.error || 'Agent response failed');
    }

    // Store conversation history
    const userMessage: ConversationMessage = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      role: 'user',
      content: message.trim(),
      agentId
    };

    const agentMessage: ConversationMessage = {
      id: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      role: 'agent',
      content: response.content,
      agentId
    };

    if (!conversationHistory.has(agentId)) {
      conversationHistory.set(agentId, []);
    }
    const agentHistory = conversationHistory.get(agentId)!;
    agentHistory.push(userMessage, agentMessage);

    // Keep only last 100 messages per agent
    if (agentHistory.length > 100) {
      conversationHistory.set(agentId, agentHistory.slice(-100));
    }

    res.json({
      success: true,
      agentId,
      agentName: config.name,
      message: agentMessage.content,
      timestamp: agentMessage.timestamp,
      conversationId: agentMessage.id
    });
  } catch (error) {
    console.error(`Failed to chat with agent ${agentId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to get agent response',
      message: (error as Error).message
    });
  }
});

// DELETE /api/agents/:agentId/history - Clear conversation history with specific agent
router.delete('/:agentId/history', (req, res) => {
  const { agentId } = req.params;

  if (!agentConfigs[agentId as keyof typeof agentConfigs]) {
    return res.status(404).json({ error: `Agent '${agentId}' not found` });
  }

  conversationHistory.delete(agentId);
  res.json({ success: true, message: `Conversation history cleared for ${agentId}` });
});

export default router;
