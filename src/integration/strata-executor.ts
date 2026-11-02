/**
 * Strata Executor — local LLM provider backed by a Strata server.
 *
 * Strata (https://github.com/Niko1221/Strata) runs Qwen / DeepSeek models on
 * the user's own machine and exposes an OpenAI-compatible API on localhost
 * (default http://127.0.0.1:8080). This executor speaks the Chat Completions
 * endpoint (`POST /v1/chat/completions`) and satisfies the same structural
 * contract as yui-protocol's AIExecutor (`execute(prompt, personality)`), so it
 * can be dropped into any agent slot via `provider: 'strata'`.
 *
 * Environment variables (all optional):
 * - STRATA_BASE_URL          Server base URL (default http://127.0.0.1:8080)
 * - STRATA_API_KEY           Sent as `Authorization: Bearer <key>` when set
 * - STRATA_MODEL             Model name sent to Strata. When set it overrides every
 *                            agent's model, since one Strata server serves one
 *                            loaded model; otherwise the agent's model is used
 *                            (default "strata")
 * - STRATA_REASONING_EFFORT  none | low | medium | high (omitted when unset)
 * - STRATA_MAX_TOKENS        Response token cap (default 4000)
 * - STRATA_TIMEOUT_MS        Request timeout in ms (default 600000; 0 disables)
 */

export const STRATA_PROVIDER = 'strata';
export const STRATA_DEFAULT_BASE_URL = 'http://127.0.0.1:8080';
export const STRATA_DEFAULT_MODEL = 'strata';
export const STRATA_DEFAULT_MAX_TOKENS = 4000;
export const STRATA_DEFAULT_TIMEOUT_MS = 600_000;

const REASONING_EFFORTS = ['none', 'low', 'medium', 'high'] as const;
export type StrataReasoningEffort = typeof REASONING_EFFORTS[number];

export interface StrataExecutorOptions {
  agentId: string;
  model?: string;
  temperature?: number;
  topP?: number;
  topK?: number;
  repetitionPenalty?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  customConfig?: {
    baseUrl?: string;
    apiKey?: string;
    maxTokens?: number;
    reasoningEffort?: StrataReasoningEffort;
    timeoutMs?: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface StrataExecutionResult {
  content: string;
  tokensUsed?: number;
  model?: string;
  duration: number;
  success: boolean;
  error?: string;
  errorDetails?: {
    type: string;
    message: string;
    stack?: string;
    httpStatus?: number;
    responseText?: string;
  };
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

function parseNumber(value: string | undefined): number | undefined {
  if (value === undefined || value.trim() === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function parseReasoningEffort(value: unknown): StrataReasoningEffort | undefined {
  return typeof value === 'string' && (REASONING_EFFORTS as readonly string[]).includes(value)
    ? (value as StrataReasoningEffort)
    : undefined;
}

/** Strip reasoning tags some local models leave inline in `content`. */
export function stripReasoning(content: string): string {
  return content
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
    .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '')
    .trim();
}

export class StrataExecutor {
  readonly agentId: string;
  readonly provider = STRATA_PROVIDER;
  readonly baseUrl: string;
  readonly model: string;
  readonly maxTokens: number;
  readonly timeoutMs: number;
  readonly reasoningEffort?: StrataReasoningEffort;
  private readonly apiKey?: string;
  private readonly temperature?: number;
  private readonly topP?: number;
  private readonly topK?: number;
  private readonly repetitionPenalty?: number;
  private readonly presencePenalty?: number;
  private readonly frequencyPenalty?: number;
  private readonly fetchImpl: FetchLike;

  constructor(
    options: StrataExecutorOptions,
    env: NodeJS.ProcessEnv = process.env,
    fetchImpl: FetchLike = (input, init) => fetch(input, init)
  ) {
    const custom = options.customConfig ?? {};
    this.agentId = options.agentId;
    this.baseUrl = (custom.baseUrl || env.STRATA_BASE_URL || STRATA_DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.model = env.STRATA_MODEL || options.model || STRATA_DEFAULT_MODEL;
    this.apiKey = custom.apiKey || env.STRATA_API_KEY || undefined;
    this.maxTokens = custom.maxTokens ?? parseNumber(env.STRATA_MAX_TOKENS) ?? STRATA_DEFAULT_MAX_TOKENS;
    this.timeoutMs = custom.timeoutMs ?? parseNumber(env.STRATA_TIMEOUT_MS) ?? STRATA_DEFAULT_TIMEOUT_MS;
    this.reasoningEffort = parseReasoningEffort(custom.reasoningEffort) ?? parseReasoningEffort(env.STRATA_REASONING_EFFORT);
    this.temperature = options.temperature;
    this.topP = options.topP;
    this.topK = options.topK;
    this.repetitionPenalty = options.repetitionPenalty;
    this.presencePenalty = options.presencePenalty;
    this.frequencyPenalty = options.frequencyPenalty;
    this.fetchImpl = fetchImpl;
  }

  /** Build the Chat Completions request body (exposed for testing). */
  buildRequestBody(prompt: string, personality?: string): Record<string, unknown> {
    const body: Record<string, unknown> = {
      model: this.model,
      messages: [
        ...(personality ? [{ role: 'system', content: personality }] : []),
        { role: 'user', content: prompt }
      ],
      max_tokens: this.maxTokens,
      stream: false
    };
    const optional: Record<string, number | string | undefined> = {
      temperature: this.temperature,
      top_p: this.topP,
      top_k: this.topK,
      repeat_penalty: this.repetitionPenalty,
      presence_penalty: this.presencePenalty,
      frequency_penalty: this.frequencyPenalty,
      reasoning_effort: this.reasoningEffort
    };
    for (const [key, value] of Object.entries(optional)) {
      if (value !== undefined) body[key] = value;
    }
    return body;
  }

  async execute(prompt: string, personality?: string): Promise<StrataExecutionResult> {
    const startTime = Date.now();
    const url = `${this.baseUrl}/v1/chat/completions`;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.apiKey) headers.Authorization = `Bearer ${this.apiKey}`;

    const controller = this.timeoutMs > 0 ? new AbortController() : undefined;
    const timer = controller ? setTimeout(() => controller.abort(), this.timeoutMs) : undefined;

    try {
      const response = await this.fetchImpl(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(this.buildRequestBody(prompt, personality)),
        signal: controller?.signal
      });

      if (!response.ok) {
        const responseText = await response.text().catch(() => '');
        const message = `Strata HTTP ${response.status}: ${responseText}`;
        return this.failure(startTime, message, {
          type: 'HTTP_ERROR',
          message,
          httpStatus: response.status,
          responseText
        });
      }

      const data = (await response.json()) as any;
      const raw = data?.choices?.[0]?.message?.content;
      const content = typeof raw === 'string' ? stripReasoning(raw) : '';
      if (!content) {
        const message = 'Strata returned an empty response';
        return this.failure(startTime, message, { type: 'EMPTY_RESPONSE', message });
      }

      return {
        content,
        tokensUsed: data?.usage?.total_tokens,
        model: typeof data?.model === 'string' ? data.model : this.model,
        duration: Date.now() - startTime,
        success: true
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      const cause = (err as any).cause?.code ?? '';
      let message = err.message;
      if (err.name === 'AbortError') {
        message = `Strata request timed out after ${this.timeoutMs}ms (${url}). The model may still be loading.`;
      } else if (/ECONNREFUSED|ENOTFOUND|fetch failed/.test(`${message} ${cause}`)) {
        message = `Connection failed to Strata server at ${this.baseUrl}. Start it with: strata launch`;
      }
      return this.failure(startTime, message, { type: 'EXECUTION_ERROR', message, stack: err.stack });
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  private failure(
    startTime: number,
    message: string,
    errorDetails: NonNullable<StrataExecutionResult['errorDetails']>
  ): StrataExecutionResult {
    return {
      content: '',
      model: this.model,
      duration: Date.now() - startTime,
      success: false,
      error: message,
      errorDetails
    };
  }
}

/**
 * Wrap an AIExecutor factory so that `provider: 'strata'` is served by
 * StrataExecutor while every other provider is delegated unchanged.
 */
export function withStrataProvider<F extends (agentId: string, options?: any) => any>(delegate: F): F {
  return ((agentId: string, options?: any) => {
    if (options?.provider === STRATA_PROVIDER) {
      return new StrataExecutor({ ...options, agentId });
    }
    return delegate(agentId, options);
  }) as F;
}
