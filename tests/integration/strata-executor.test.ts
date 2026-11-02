import {
  StrataExecutor,
  stripReasoning,
  withStrataProvider,
  STRATA_DEFAULT_BASE_URL,
  STRATA_DEFAULT_MODEL,
  STRATA_DEFAULT_MAX_TOKENS
} from '../../src/integration/strata-executor';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function completion(content: unknown, extra: Record<string, unknown> = {}) {
  return { model: 'qwen3.8-flash-next', choices: [{ message: { role: 'assistant', content } }], ...extra };
}

describe('StrataExecutor configuration', () => {
  it('uses Strata defaults when nothing is configured', () => {
    const ex = new StrataExecutor({ agentId: 'theoria' }, {});
    expect(ex.baseUrl).toBe(STRATA_DEFAULT_BASE_URL);
    expect(ex.model).toBe(STRATA_DEFAULT_MODEL);
    expect(ex.maxTokens).toBe(STRATA_DEFAULT_MAX_TOKENS);
    expect(ex.reasoningEffort).toBeUndefined();
  });

  it('reads environment variables and strips trailing slashes from the base URL', () => {
    const ex = new StrataExecutor(
      { agentId: 'theoria' },
      {
        STRATA_BASE_URL: 'http://192.168.1.5:9000//',
        STRATA_MODEL: 'qwen-alias',
        STRATA_MAX_TOKENS: '256',
        STRATA_REASONING_EFFORT: 'high',
        STRATA_TIMEOUT_MS: '0'
      }
    );
    expect(ex.baseUrl).toBe('http://192.168.1.5:9000');
    expect(ex.model).toBe('qwen-alias');
    expect(ex.maxTokens).toBe(256);
    expect(ex.reasoningEffort).toBe('high');
    expect(ex.timeoutMs).toBe(0);
  });

  it('STRATA_MODEL overrides the agent model; agent model is used otherwise', () => {
    expect(new StrataExecutor({ agentId: 'a', model: 'agent-model' }, { STRATA_MODEL: 'pinned' }).model).toBe('pinned');
    expect(new StrataExecutor({ agentId: 'a', model: 'agent-model' }, {}).model).toBe('agent-model');
  });

  it.each(['', 'extreme', 'HIGH'])('ignores invalid reasoning effort %p', value => {
    const ex = new StrataExecutor({ agentId: 'a' }, { STRATA_REASONING_EFFORT: value });
    expect(ex.reasoningEffort).toBeUndefined();
  });

  it('falls back to the default max tokens when the env value is not a number', () => {
    const ex = new StrataExecutor({ agentId: 'a' }, { STRATA_MAX_TOKENS: 'lots' });
    expect(ex.maxTokens).toBe(STRATA_DEFAULT_MAX_TOKENS);
  });

  it('customConfig takes precedence over the environment', () => {
    const ex = new StrataExecutor(
      { agentId: 'a', customConfig: { baseUrl: 'http://cfg:1', maxTokens: 10, reasoningEffort: 'none' } },
      { STRATA_BASE_URL: 'http://env:2', STRATA_MAX_TOKENS: '99', STRATA_REASONING_EFFORT: 'high' }
    );
    expect(ex.baseUrl).toBe('http://cfg:1');
    expect(ex.maxTokens).toBe(10);
    expect(ex.reasoningEffort).toBe('none');
  });
});

describe('StrataExecutor.buildRequestBody', () => {
  it('puts personality in a system message before the user prompt', () => {
    const body = new StrataExecutor({ agentId: 'a' }, {}).buildRequestBody('問い', 'あなたはTheoria');
    expect(body.messages).toEqual([
      { role: 'system', content: 'あなたはTheoria' },
      { role: 'user', content: '問い' }
    ]);
    expect(body.stream).toBe(false);
  });

  it('omits the system message when personality is empty', () => {
    const body = new StrataExecutor({ agentId: 'a' }, {}).buildRequestBody('q', '');
    expect(body.messages).toEqual([{ role: 'user', content: 'q' }]);
  });

  it('maps generation params and omits unset ones', () => {
    const body = new StrataExecutor(
      { agentId: 'a', temperature: 0, topP: 0.85, topK: 40, repetitionPenalty: 1.1 },
      { STRATA_REASONING_EFFORT: 'low' }
    ).buildRequestBody('q');
    expect(body).toMatchObject({ temperature: 0, top_p: 0.85, top_k: 40, repeat_penalty: 1.1, reasoning_effort: 'low' });
    expect(body).not.toHaveProperty('presence_penalty');
    expect(body).not.toHaveProperty('frequency_penalty');
  });
});

describe('StrataExecutor.execute', () => {
  it('POSTs to /v1/chat/completions and returns the cleaned content', async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      jsonResponse(completion('<think>hidden</think>  私は問いでできている。 ', { usage: { total_tokens: 42 } }))
    );
    const ex = new StrataExecutor({ agentId: 'a' }, { STRATA_API_KEY: 'secret' }, fetchMock);

    const result = await ex.execute('q', 'p');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://127.0.0.1:8080/v1/chat/completions');
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({ Authorization: 'Bearer secret', 'Content-Type': 'application/json' });
    expect(JSON.parse(init.body).model).toBe('strata');
    expect(result).toMatchObject({
      success: true,
      content: '私は問いでできている。',
      tokensUsed: 42,
      model: 'qwen3.8-flash-next'
    });
  });

  it('sends no Authorization header without an API key', async () => {
    const fetchMock = jest.fn().mockResolvedValue(jsonResponse(completion('ok')));
    await new StrataExecutor({ agentId: 'a' }, {}, fetchMock).execute('q');
    expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty('Authorization');
  });

  it('reports HTTP errors with status and body', async () => {
    const fetchMock = jest.fn().mockResolvedValue(new Response('model not loaded', { status: 503 }));
    const result = await new StrataExecutor({ agentId: 'a' }, {}, fetchMock).execute('q');
    expect(result.success).toBe(false);
    expect(result.content).toBe('');
    expect(result.errorDetails).toMatchObject({ type: 'HTTP_ERROR', httpStatus: 503, responseText: 'model not loaded' });
  });

  it.each([
    ['no choices', { choices: [] }],
    ['null content', completion(null)],
    ['only reasoning', completion('<think>just thinking</think>')]
  ])('treats %s as a failed (empty) response', async (_label, payload) => {
    const fetchMock = jest.fn().mockResolvedValue(jsonResponse(payload));
    const result = await new StrataExecutor({ agentId: 'a' }, {}, fetchMock).execute('q');
    expect(result.success).toBe(false);
    expect(result.errorDetails?.type).toBe('EMPTY_RESPONSE');
  });

  it('explains how to start Strata when the connection is refused', async () => {
    const err = new TypeError('fetch failed');
    (err as any).cause = { code: 'ECONNREFUSED' };
    const fetchMock = jest.fn().mockRejectedValue(err);
    const result = await new StrataExecutor({ agentId: 'a' }, {}, fetchMock).execute('q');
    expect(result.success).toBe(false);
    expect(result.error).toContain('strata launch');
    expect(result.errorDetails?.type).toBe('EXECUTION_ERROR');
  });

  it('aborts and reports a timeout', async () => {
    const fetchMock = jest.fn((_url: string, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          const e = new Error('aborted');
          e.name = 'AbortError';
          reject(e);
        });
      })
    );
    const result = await new StrataExecutor({ agentId: 'a', customConfig: { timeoutMs: 5 } }, {}, fetchMock).execute('q');
    expect(result.success).toBe(false);
    expect(result.error).toContain('timed out after 5ms');
  });

  it('passes no abort signal when the timeout is disabled', async () => {
    const fetchMock = jest.fn().mockResolvedValue(jsonResponse(completion('ok')));
    await new StrataExecutor({ agentId: 'a' }, { STRATA_TIMEOUT_MS: '0' }, fetchMock).execute('q');
    expect(fetchMock.mock.calls[0][1].signal).toBeUndefined();
  });
});

describe('stripReasoning', () => {
  it('removes think/thinking/reasoning blocks case-insensitively and trims', () => {
    expect(stripReasoning('<THINK>a</THINK>x<thinking>b\nc</thinking>y<reasoning>d</reasoning> ')).toBe('xy');
  });
});

describe('withStrataProvider', () => {
  it('serves provider "strata" with StrataExecutor and keeps the agent id', () => {
    const delegate = jest.fn();
    const create = withStrataProvider(delegate);
    const ex = create('pathia', { provider: 'strata', model: 'm' });
    expect(ex).toBeInstanceOf(StrataExecutor);
    expect(ex.agentId).toBe('pathia');
    expect(delegate).not.toHaveBeenCalled();
  });

  it.each([['ollama'], ['gemini'], [undefined]])('delegates provider %p unchanged', provider => {
    const sentinel = { execute: jest.fn() };
    const delegate = jest.fn().mockReturnValue(sentinel);
    const options = { provider, model: 'm' };
    expect(withStrataProvider(delegate)('kinesis', options)).toBe(sentinel);
    expect(delegate).toHaveBeenCalledWith('kinesis', options);
  });
});
