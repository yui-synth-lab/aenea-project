import { DialogueHandler } from '../../src/server/dialogue-handler';
import { DatabaseManager } from '../../src/server/database-manager';
import { AIExecutor } from '../../src/server/ai-executor';
import ConsciousnessBackend from '../../src/server/consciousness-backend';
import { analyzeDialogueSentiment } from '../../src/aenea/somnia/core/dialogue-sentiment';

// Mock dependencies
jest.mock('../../yui-protocol/dist/kernel/ai-executor-impl.js', () => ({
  createAIExecutor: jest.fn()
}));
jest.mock('../../yui-protocol/dist/kernel/ai-executor.js', () => ({
  AIExecutor: jest.fn()
}));
jest.mock('../../src/server/database-manager');
jest.mock('../../src/server/ai-executor');
jest.mock('../../src/server/consciousness-backend');
jest.mock('../../src/aenea/somnia/core/dialogue-sentiment');
jest.mock('../../src/rag/index', () => ({
  isRAGEnabled: jest.fn().mockReturnValue(false),
  searchRAG: jest.fn(),
  ingestDialogueToRAG: jest.fn().mockResolvedValue({})
}));
jest.mock('../../src/server/logger', () => ({
  log: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

describe('DialogueHandler Attitude Change Integration', () => {
  let dialogueHandler: DialogueHandler;
  let mockDb: jest.Mocked<DatabaseManager>;
  let mockAi: jest.Mocked<AIExecutor>;
  let mockBackend: jest.Mocked<ConsciousnessBackend>;

  beforeEach(() => {
    mockDb = new DatabaseManager() as jest.Mocked<DatabaseManager>;
    mockAi = {
      execute: jest.fn().mockResolvedValue({
        success: true,
        content: '即座の反応: テスト\n応答本文: テスト本文\n新しい問い: なぜ？\n感情状態: 良好'
      })
    } as any;
    mockBackend = new ConsciousnessBackend() as jest.Mocked<ConsciousnessBackend>;
    mockBackend.getSomniaState.mockReturnValue({
      mode: 'awake',
      somatic: { lambda: 0, phi: 100, mu: { serotonin: 0.5, dopamine: 0.5, cortisol: 0.5, oxytocin: 0.5 } },
      affective: { theta: 0.5, psi: 0.5, xi: 0 },
      cognitive: { qualia: '平穏' }
    } as any);

    // Setup DB mocks
    mockDb.getConsciousnessState.mockReturnValue({
      systemClock: 1,
      energy: 100,
      totalQuestions: 0,
      totalThoughts: 0,
      lastActivity: new Date().toISOString()
    });
    mockDb.getCoreBeliefs.mockReturnValue([]);
    mockDb.getCurrentDPDWeights.mockReturnValue({ 
      empathy: 0.33, 
      coherence: 0.33, 
      dissonance: 0.34,
      timestamp: Date.now(),
      version: 1
    });
    mockDb.getSignificantThoughts.mockReturnValue([]);
    mockDb.getRecentDialogueMemories.mockReturnValue([]);
    mockDb.getCurrentSystemClock.mockReturnValue(1);

    dialogueHandler = new DialogueHandler(mockDb, mockAi, mockBackend);

    // Mock sentiment analysis
    (analyzeDialogueSentiment as jest.Mock).mockReturnValue({
      label: 'neutral',
      valence: 0,
      arousal: 0,
      significance: 0
    });
  });

  test('should call applyDialogueSentiment when sentiment is not neutral', async () => {
    (analyzeDialogueSentiment as jest.Mock).mockReturnValue({
      label: 'joyful',
      valence: 0.7,
      arousal: 0.5,
      significance: 0.4
    });

    await dialogueHandler.handleDialogue('ありがとう！');

    expect(mockBackend.applyDialogueSentiment).toHaveBeenCalledWith(expect.objectContaining({
      context: 'joyful',
      valence: 0.7,
      arousal: 0.5,
      significance: 0.4
    }));
  });

  test('should NOT call applyDialogueSentiment when sentiment is neutral', async () => {
    (analyzeDialogueSentiment as jest.Mock).mockReturnValue({
      label: 'neutral',
      valence: 0,
      arousal: 0,
      significance: 0
    });

    await dialogueHandler.handleDialogue('今日はいい天気ですね。');

    expect(mockBackend.applyDialogueSentiment).not.toHaveBeenCalled();
  });

  test('should proceed with dialogue even if sentiment application fails', async () => {
    (analyzeDialogueSentiment as jest.Mock).mockReturnValue({
      label: 'hostile',
      valence: -0.9,
      arousal: 0.8,
      significance: 0.5
    });
    
    // Make backend call throw
    mockBackend.applyDialogueSentiment.mockImplementation(() => {
      throw new Error('Async failure simulation');
    });

    const response = await dialogueHandler.handleDialogue('嫌いだ！');

    expect(response).toBeDefined();
    expect(response.main).toBe('テスト本文');
  });
});
