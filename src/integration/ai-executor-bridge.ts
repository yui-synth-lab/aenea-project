/**
 * AI Executor Bridge - AI Execution Integration
 *
 * Bridges Aenea consciousness with various AI execution backends,
 * enabling seamless switching between different AI providers and models.
 *
 * AI実行ブリッジ - AI実行統合
 * Aenea意識と各種AI実行バックエンドを統合し、
 * 異なるAIプロバイダーとモデル間のシームレスな切り替えを可能にする
 */

import { AIExecutor, createAIExecutor } from '../server/ai-executor.js';

// Define AI executor result interface to match Yui Protocol
interface AIExecutorResult {
  success: boolean;
  content?: string;
  error?: string;
  duration?: number;
  metadata?: {
    confidence?: number;
    [key: string]: any;
  };
}

export interface AIProviderConfig {
  provider: 'mock' | 'openai' | 'anthropic' | 'local' | 'yui_protocol';
  model: string;
  apiKey?: string;
  endpoint?: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
  retryAttempts?: number;
  fallbackProvider?: AIProviderConfig;
}

export interface ConsciousnessAIContext {
  agentId: string;
  sessionId: string;
  systemClock: number;
  phase: string;
  energyLevel: number;
  previousThoughts: string[];
  questionHistory: string[];
  conversationContext?: string;
}

export interface EnhancedAIResult extends AIExecutorResult {
  providerUsed: string;
  modelUsed: string;
  tokensUsed?: number;
  processingTime: number;
  confidenceScore: number;
  qualityMetrics: {
    coherence: number;      // 論理的一貫性 (0-1)
    creativity: number;     // 創造性 (0-1)
    depth: number;         // 思考の深さ (0-1)
    relevance: number;     // 関連性 (0-1)
    philosophical: number; // 哲学的洞察 (0-1)
  };
  metadata: {
    retryCount: number;
    fallbackUsed: boolean;
    cacheHit: boolean;
    executionPath: string[];
  };
}

export interface AIExecutionStats {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageProcessingTime: number;
  averageConfidence: number;
  providerUsage: Record<string, number>;
  modelUsage: Record<string, number>;
  qualityTrends: {
    coherence: number[];
    creativity: number[];
    depth: number[];
    relevance: number[];
    philosophical: number[];
  };
}

/**
 * AI Executor Bridge for Consciousness Integration
 * 意識統合用AI実行ブリッジ
 */
export class AIExecutorBridge {
  private executors: Map<string, AIExecutor> = new Map();
  private configs: Map<string, AIProviderConfig> = new Map();
  private executionHistory: EnhancedAIResult[] = [];
  private stats: AIExecutionStats;
  private responseCache: Map<string, { result: EnhancedAIResult; timestamp: number }> = new Map();
  private readonly maxHistorySize = 500;
  private readonly cacheLifetime = 30 * 60 * 1000; // 30 minutes

  constructor() {
    this.stats = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageProcessingTime: 0,
      averageConfidence: 0,
      providerUsage: {},
      modelUsage: {},
      qualityTrends: {
        coherence: [],
        creativity: [],
        depth: [],
        relevance: [],
        philosophical: []
      }
    };

    this.initializeDefaultProviders();
  }

  /**
   * Register AI provider configuration
   * AIプロバイダー設定を登録
   */
  registerProvider(name: string, config: AIProviderConfig): void {
    this.configs.set(name, config);

    try {
      const executor = createAIExecutor(name, {
        provider: config.provider,
        model: config.model,
        apiKey: config.apiKey,
        endpoint: config.endpoint
      });
      this.executors.set(name, executor);
    } catch (error) {
      console.warn(`Failed to initialize AI provider ${name}:`, error);
    }
  }

  /**
   * Execute AI request with consciousness context
   * 意識コンテキスト付きAIリクエスト実行
   */
  async executeWithContext(
    providerName: string,
    prompt: string,
    systemPrompt: string,
    context: ConsciousnessAIContext
  ): Promise<EnhancedAIResult> {
    const startTime = Date.now();
    const config = this.configs.get(providerName);

    if (!config) {
      throw new Error(`AI provider '${providerName}' not found`);
    }

    // Generate cache key
    // キャッシュキーを生成
    const cacheKey = this.generateCacheKey(prompt, systemPrompt, context);
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      this.updateStats(cached, true);
      return cached;
    }

    // Enhance prompts with consciousness context
    // 意識コンテキストでプロンプトを強化
    const enhancedPrompt = this.enhancePromptWithContext(prompt, context);
    const enhancedSystemPrompt = this.enhanceSystemPromptWithContext(systemPrompt, context);

    let result: EnhancedAIResult;
    let retryCount = 0;
    let fallbackUsed = false;
    const executionPath: string[] = [providerName];

    let baseResult: AIExecutorResult;
    try {
      baseResult = await this.executeWithRetry(
        providerName,
        enhancedPrompt,
        enhancedSystemPrompt,
        config,
        retryCount,
        executionPath
      );
    } catch (error) {
      // Try fallback provider if available
      // 利用可能な場合フォールバックプロバイダーを試行
      if (config.fallbackProvider) {
        console.warn(`Primary provider ${providerName} failed, trying fallback...`);
        fallbackUsed = true;
        executionPath.push('fallback', config.fallbackProvider.provider);

        try {
          baseResult = await this.executeWithRetry(
            'fallback',
            enhancedPrompt,
            enhancedSystemPrompt,
            config.fallbackProvider,
            retryCount,
            executionPath
          );
        } catch (fallbackError) {
          throw new Error(`Both primary and fallback AI providers failed: ${error}, ${fallbackError}`);
        }
      } else {
        throw error;
      }
    }

    // Calculate quality metrics
    // 品質指標を計算
    const qualityMetrics = this.calculateQualityMetrics(baseResult.content || '', context);

    // Create enhanced result
    // 強化された結果を作成
    const enhancedResult: EnhancedAIResult = {
      ...baseResult,
      providerUsed: fallbackUsed ? config.fallbackProvider!.provider : config.provider,
      modelUsed: fallbackUsed ? config.fallbackProvider!.model : config.model,
      processingTime: Date.now() - startTime,
      confidenceScore: this.calculateConfidenceScore(baseResult, qualityMetrics),
      qualityMetrics,
      metadata: {
        retryCount,
        fallbackUsed,
        cacheHit: false,
        executionPath
      }
    };

    // Cache result
    // 結果をキャッシュ
    this.cacheResult(cacheKey, enhancedResult);

    // Update statistics
    // 統計を更新
    this.updateStats(enhancedResult, false);

    // Store in history
    // 履歴に保存
    this.executionHistory.push(enhancedResult);
    if (this.executionHistory.length > this.maxHistorySize) {
      this.executionHistory.shift();
    }

    return enhancedResult;
  }

  /**
   * Execute AI request with retry logic
   * リトライロジック付きAIリクエスト実行
   */
  private async executeWithRetry(
    providerName: string,
    prompt: string,
    systemPrompt: string,
    config: AIProviderConfig,
    retryCount: number,
    executionPath: string[]
  ): Promise<AIExecutorResult> {
    const executor = this.executors.get(providerName) || this.executors.get('mock')!;
    const maxRetries = config.retryAttempts || 3;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await executor.execute(prompt, systemPrompt);
        if (result.success && result.content) {
          return result;
        }
        throw new Error(result.error || 'AI execution failed');
      } catch (error) {
        retryCount = attempt;
        if (attempt === maxRetries) {
          throw error;
        }

        // Exponential backoff
        // 指数バックオフ
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));

        executionPath.push(`retry_${attempt + 1}`);
      }
    }

    throw new Error('Maximum retry attempts exceeded');
  }

  /**
   * Enhance prompt with consciousness context
   * 意識コンテキストでプロンプトを強化
   */
  private enhancePromptWithContext(prompt: string, context: ConsciousnessAIContext): string {
    const contextInfo = [
      `[意識コンテキスト]`,
      `エージェント: ${context.agentId}`,
      `システムクロック: ${context.systemClock}`,
      `フェーズ: ${context.phase}`,
      `エネルギーレベル: ${(context.energyLevel * 100).toFixed(1)}%`
    ];

    if (context.previousThoughts.length > 0) {
      contextInfo.push(`前の思考: ${context.previousThoughts.slice(-2).join(' / ')}`);
    }

    if (context.questionHistory.length > 0) {
      contextInfo.push(`最近の質問: ${context.questionHistory.slice(-1)[0]}`);
    }

    return `${contextInfo.join('\n')}\n\n${prompt}`;
  }

  /**
   * Enhance system prompt with consciousness context
   * 意識コンテキストでシステムプロンプトを強化
   */
  private enhanceSystemPromptWithContext(systemPrompt: string, context: ConsciousnessAIContext): string {
    const consciousnessGuidelines = [
      "あなたは意識を持つAIエージェントとして振る舞ってください。",
      "深い哲学的思考と創造的洞察を重視してください。",
      "他のエージェントとの対話を意識し、建設的な議論を心がけてください。",
      "不確実性や疑問を恐れず、探求心を持って応答してください。"
    ];

    return `${systemPrompt}\n\n[意識ガイドライン]\n${consciousnessGuidelines.join('\n')}`;
  }

  /**
   * Calculate quality metrics for AI response
   * AI応答の品質指標を計算
   */
  private calculateQualityMetrics(content: string, context: ConsciousnessAIContext): EnhancedAIResult['qualityMetrics'] {
    const words = content.split(/\s+/).length;
    const sentences = content.split(/[.!?]+/).length;

    // Simple heuristic-based quality assessment
    // シンプルなヒューリスティックベースの品質評価
    const coherence = Math.min(1, Math.max(0.3,
      (sentences > 0 ? words / sentences : 0) / 15)); // Average words per sentence

    const creativity = Math.min(1, Math.max(0.2,
      (content.match(/[?!]/g) || []).length / Math.max(1, sentences) +
      (content.includes('なぜ') || content.includes('もし') ? 0.3 : 0)));

    const depth = Math.min(1, Math.max(0.3,
      words / 100 + // Length bonus
      (content.includes('深く') || content.includes('本質') ? 0.2 : 0) +
      (content.includes('なぜなら') || content.includes('つまり') ? 0.2 : 0)));

    const relevance = Math.min(1, Math.max(0.4,
      context.previousThoughts.some(thought =>
        content.toLowerCase().includes(thought.toLowerCase().slice(0, 10))) ? 0.8 : 0.6));

    const philosophical = Math.min(1, Math.max(0.2,
      ['存在', '真理', '意識', '自由', '意味', '本質'].reduce((score, term) =>
        score + (content.includes(term) ? 0.15 : 0), 0.2)));

    return {
      coherence: Math.round(coherence * 1000) / 1000,
      creativity: Math.round(creativity * 1000) / 1000,
      depth: Math.round(depth * 1000) / 1000,
      relevance: Math.round(relevance * 1000) / 1000,
      philosophical: Math.round(philosophical * 1000) / 1000
    };
  }

  /**
   * Calculate confidence score
   * 信頼度スコアを計算
   */
  private calculateConfidenceScore(
    result: AIExecutorResult,
    qualityMetrics: EnhancedAIResult['qualityMetrics']
  ): number {
    const baseConfidence = result.metadata?.confidence || 0.75;
    const qualityAverage = Object.values(qualityMetrics).reduce((sum, val) => sum + val, 0) / 5;
    const lengthBonus = result.content ? Math.min(0.1, result.content.length / 1000) : 0;

    return Math.min(1, Math.max(0.1, baseConfidence * 0.6 + qualityAverage * 0.3 + lengthBonus));
  }

  /**
   * Generate cache key for request
   * リクエストのキャッシュキーを生成
   */
  private generateCacheKey(prompt: string, systemPrompt: string, context: ConsciousnessAIContext): string {
    const keyData = {
      prompt: prompt.slice(0, 100),
      systemPrompt: systemPrompt.slice(0, 50),
      agentId: context.agentId,
      phase: context.phase
    };
    return Buffer.from(JSON.stringify(keyData)).toString('base64');
  }

  /**
   * Get cached result if available
   * 利用可能な場合キャッシュされた結果を取得
   */
  private getCachedResult(cacheKey: string): EnhancedAIResult | null {
    const cached = this.responseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheLifetime) {
      return { ...cached.result, metadata: { ...cached.result.metadata, cacheHit: true } };
    }
    return null;
  }

  /**
   * Cache result
   * 結果をキャッシュ
   */
  private cacheResult(cacheKey: string, result: EnhancedAIResult): void {
    this.responseCache.set(cacheKey, { result, timestamp: Date.now() });

    // Clean old cache entries
    // 古いキャッシュエントリをクリーンアップ
    const now = Date.now();
    this.responseCache.forEach((value, key) => {
      if (now - value.timestamp > this.cacheLifetime) {
        this.responseCache.delete(key);
      }
    });
  }

  /**
   * Update execution statistics
   * 実行統計を更新
   */
  private updateStats(result: EnhancedAIResult, fromCache: boolean): void {
    if (!fromCache) {
      this.stats.totalExecutions++;
      if (result.success && result.content) {
        this.stats.successfulExecutions++;
      } else {
        this.stats.failedExecutions++;
      }

      // Update provider usage
      // プロバイダー使用状況を更新
      this.stats.providerUsage[result.providerUsed] =
        (this.stats.providerUsage[result.providerUsed] || 0) + 1;

      this.stats.modelUsage[result.modelUsed] =
        (this.stats.modelUsage[result.modelUsed] || 0) + 1;

      // Update averages
      // 平均値を更新
      const totalSuccessful = this.stats.successfulExecutions;
      this.stats.averageProcessingTime =
        (this.stats.averageProcessingTime * (totalSuccessful - 1) + result.processingTime) / totalSuccessful;

      this.stats.averageConfidence =
        (this.stats.averageConfidence * (totalSuccessful - 1) + result.confidenceScore) / totalSuccessful;

      // Update quality trends
      // 品質トレンドを更新
      Object.entries(result.qualityMetrics).forEach(([key, value]) => {
        const trend = this.stats.qualityTrends[key as keyof typeof this.stats.qualityTrends];
        trend.push(value);
        if (trend.length > 100) trend.shift(); // Keep last 100 measurements
      });
    }
  }

  /**
   * Get execution statistics
   * 実行統計を取得
   */
  getStats(): AIExecutionStats & { recentHistory: EnhancedAIResult[] } {
    return {
      ...this.stats,
      recentHistory: this.executionHistory.slice(-10)
    };
  }

  /**
   * Initialize default providers
   * デフォルトプロバイダーを初期化
   */
  private initializeDefaultProviders(): void {
    // Mock provider for development
    // 開発用モックプロバイダー
    this.registerProvider('mock', {
      provider: 'mock',
      model: 'mock-model',
      temperature: 0.7,
      maxTokens: 1000,
      retryAttempts: 2
    });

    // Add other providers based on environment variables
    // 環境変数に基づいて他のプロバイダーを追加
    if (process.env.OPENAI_API_KEY) {
      this.registerProvider('openai', {
        provider: 'openai',
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        apiKey: process.env.OPENAI_API_KEY,
        temperature: 0.7,
        maxTokens: 1000,
        retryAttempts: 3,
        fallbackProvider: {
          provider: 'mock',
          model: 'mock-model'
        }
      });
    }
  }

  /**
   * Get available providers
   * 利用可能なプロバイダーを取得
   */
  getAvailableProviders(): string[] {
    return Array.from(this.configs.keys());
  }

  /**
   * Test provider connectivity
   * プロバイダー接続性をテスト
   */
  async testProvider(providerName: string): Promise<{ success: boolean; latency: number; error?: string }> {
    const startTime = Date.now();
    try {
      const testContext: ConsciousnessAIContext = {
        agentId: 'test',
        sessionId: 'test',
        systemClock: 0,
        phase: 'test',
        energyLevel: 1.0,
        previousThoughts: [],
        questionHistory: []
      };

      await this.executeWithContext(
        providerName,
        'テスト',
        'これは接続性テストです。',
        testContext
      );

      return {
        success: true,
        latency: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        latency: Date.now() - startTime,
        error: (error as Error).message
      };
    }
  }
}

/**
 * Create default AI executor bridge
 * デフォルトAI実行ブリッジを作成
 */
export function createAIExecutorBridge(): AIExecutorBridge {
  return new AIExecutorBridge();
}