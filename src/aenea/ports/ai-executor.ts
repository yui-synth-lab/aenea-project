/**
 * AI execution port — dependency-inversion boundary.
 * The domain layer depends on this contract; src/server supplies the
 * concrete executor (yui-protocol's AIExecutor) which satisfies it
 * structurally.
 */
export interface AIExecutionResult {
  success: boolean;
  content: string;
  duration?: number;
  error?: string;
}

export interface AIExecutorPort {
  execute(prompt: string, systemPrompt?: string): Promise<AIExecutionResult>;
}
