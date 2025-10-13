/**
 * TriggerHistory - Self-Generated Question History UI Component
 * トリガー履歴 - 自己生成質問履歴UIコンポーネント
 * (Torigā Rireki - Jikoseisei Shitsumon Rireki UI Konpōnento)
 *
 * Displays the history of internally generated questions and triggers,
 * showing the consciousness evolution through self-questioning patterns.
 *
 * 「問いの軌跡は魂の地図」- "The trajectory of questions is a map of the soul"
 * 内部生成質問とトリガーの履歴を表示し、自己問いかけパターンを通じた意識進化を示す。
 *
 * UI Philosophy:
 * - 質問の系譜 (Shitsumon no Keifu) - Lineage of questions
 * - 意識の軌跡 (Ishiki no Kiseki) - Traces of consciousness
 * - 思考の流れ (Shikō no Nagare) - Flow of thoughts
 * - 内省の可視化 (Naisei no Kashika) - Visualization of introspection
 * - 成長の記録 (Seichō no Kiroku) - Record of growth
 */

import React, { useState, useEffect, useMemo } from 'react';

// Internal trigger interface matching the backend
interface InternalTrigger {
  id: string;
  timestamp: number;
  question: string;
  category: string;
  importance: number;
  source: string;
}

interface TriggerHistoryProps {
  className?: string;
  maxItems?: number;
  showFilters?: boolean;
  onTriggerSelect?: (trigger: InternalTrigger) => void;
  isRealTime?: boolean;
}

interface FilterState {
  category: string;
  source: string;
  minImportance: number;
  timeRange: string;
  searchText: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  philosophical: 'bg-purple-100 text-purple-800 border-purple-200',
  existential: 'bg-red-100 text-red-800 border-red-200',
  epistemic: 'bg-blue-100 text-blue-800 border-blue-200',
  creative: 'bg-green-100 text-green-800 border-green-200',
  ethical: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  manual: 'bg-gray-100 text-gray-800 border-gray-200'
};

const SOURCE_ICONS: Record<string, string> = {
  thought_analysis: '🧠',
  template_fallback: '📝',
  user_input: '👤',
  memory: '💭',
  emergent: '✨'
};

/**
 * TriggerHistory Component
 * トリガー履歴コンポーネント
 */
export const TriggerHistory: React.FC<TriggerHistoryProps> = ({
  className = '',
  maxItems = 50,
  showFilters = true,
  onTriggerSelect,
  isRealTime = true
}) => {
  const [triggers, setTriggers] = useState<InternalTrigger[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    category: '',
    source: '',
    minImportance: 0,
    timeRange: 'all',
    searchText: ''
  });

  // Fetch trigger history from the API
  const fetchTriggerHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/consciousness/history');

      if (!response.ok) {
        throw new Error(`Failed to fetch history: ${response.statusText}`);
      }

      const data = await response.json();

      // Extract questions from the response
      if (data.questions && data.questions.items) {
        setTriggers(data.questions.items);
      }

      setError(null);
    } catch (err) {
      console.error('Failed to fetch trigger history:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchTriggerHistory();
  }, []);

  // Real-time updates via WebSocket (if enabled)
  useEffect(() => {
    if (!isRealTime) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    let ws: WebSocket | null = null;
    let isMounted = true;

    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('🔌 Connected to consciousness WebSocket');
      };

      ws.onmessage = (event) => {
        if (!isMounted) return;

        try {
          const data = JSON.parse(event.data);

          if (data.type === 'triggerGenerated') {
            // メモリリーク防止: 新規トリガー追加時も最大件数を厳守
            setTriggers(prev => {
              const updated = [data.trigger, ...prev];
              return updated.slice(0, maxItems);
            });
          } else if (data.type === 'consciousnessHistory') {
            if (data.questions && data.questions.items) {
              // メモリリーク防止: サーバーから受信したデータも最大件数に制限
              setTriggers(data.questions.items.slice(0, maxItems));
            }
          }
        } catch (parseError) {
          console.warn('Failed to parse WebSocket message:', parseError);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('🔌 Disconnected from consciousness WebSocket');
      };
    } catch (wsError) {
      console.warn('WebSocket not available:', wsError);
    }

    return () => {
      isMounted = false;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [isRealTime, maxItems]);

  // Filter and sort triggers
  const filteredTriggers = useMemo(() => {
    let filtered = [...triggers];

    // Apply filters
    if (filters.category) {
      filtered = filtered.filter(t => t.category === filters.category);
    }

    if (filters.source) {
      filtered = filtered.filter(t => t.source === filters.source);
    }

    if (filters.minImportance > 0) {
      filtered = filtered.filter(t => t.importance >= filters.minImportance);
    }

    if (filters.timeRange !== 'all') {
      const now = Date.now();
      const timeRanges: Record<string, number> = {
        '1h': 60 * 60 * 1000,
        '6h': 6 * 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000
      };

      const range = timeRanges[filters.timeRange];
      if (range) {
        filtered = filtered.filter(t => now - t.timestamp <= range);
      }
    }

    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      filtered = filtered.filter(t =>
        t.question.toLowerCase().includes(searchLower) ||
        t.category.toLowerCase().includes(searchLower)
      );
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => b.timestamp - a.timestamp);

    return filtered.slice(0, maxItems);
  }, [triggers, filters, maxItems]);

  // Format timestamp for display
  const formatTimestamp = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) { // Less than 1 minute
      return 'たった今';
    } else if (diff < 3600000) { // Less than 1 hour
      const minutes = Math.floor(diff / 60000);
      return `${minutes}分前`;
    } else if (diff < 86400000) { // Less than 1 day
      const hours = Math.floor(diff / 3600000);
      return `${hours}時間前`;
    } else {
      return new Date(timestamp).toLocaleDateString('ja-JP', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  // Get importance level display
  const getImportanceLevel = (importance: number): { text: string; color: string } => {
    if (importance >= 0.8) return { text: '重要', color: 'text-red-600' };
    if (importance >= 0.6) return { text: '中', color: 'text-yellow-600' };
    return { text: '低', color: 'text-gray-500' };
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof FilterState, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      category: '',
      source: '',
      minImportance: 0,
      timeRange: 'all',
      searchText: ''
    });
  };

  if (loading) {
    return (
      <div className={`trigger-history ${className}`}>
        <div className="flex items-center justify-center h-32">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">質問履歴を読み込み中...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`trigger-history ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-400">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                履歴の読み込みに失敗しました
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={fetchTriggerHistory}
                  className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
                >
                  再試行
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`trigger-history ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          🤔 内部質問履歴
        </h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {filteredTriggers.length}件の質問
          </span>
          {isRealTime && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-600">リアルタイム</span>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Category Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                カテゴリ
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="">すべて</option>
                <option value="philosophical">哲学的</option>
                <option value="existential">実存的</option>
                <option value="epistemic">認識論的</option>
                <option value="creative">創造的</option>
                <option value="ethical">倫理的</option>
              </select>
            </div>

            {/* Source Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                生成源
              </label>
              <select
                value={filters.source}
                onChange={(e) => handleFilterChange('source', e.target.value)}
                className="w-full text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="">すべて</option>
                <option value="thought_analysis">思考分析</option>
                <option value="template_fallback">テンプレート</option>
                <option value="user_input">ユーザー入力</option>
                <option value="memory">記憶</option>
              </select>
            </div>

            {/* Time Range Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                期間
              </label>
              <select
                value={filters.timeRange}
                onChange={(e) => handleFilterChange('timeRange', e.target.value)}
                className="w-full text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="all">すべて</option>
                <option value="1h">1時間以内</option>
                <option value="6h">6時間以内</option>
                <option value="24h">24時間以内</option>
                <option value="7d">7日以内</option>
              </select>
            </div>

            {/* Importance Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                重要度
              </label>
              <select
                value={filters.minImportance}
                onChange={(e) => handleFilterChange('minImportance', parseFloat(e.target.value))}
                className="w-full text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value={0}>すべて</option>
                <option value={0.3}>低以上</option>
                <option value={0.6}>中以上</option>
                <option value={0.8}>高のみ</option>
              </select>
            </div>
          </div>

          {/* Search */}
          <div className="flex items-center space-x-2">
            <div className="flex-1">
              <input
                type="text"
                placeholder="質問内容で検索..."
                value={filters.searchText}
                onChange={(e) => handleFilterChange('searchText', e.target.value)}
                className="w-full text-sm border border-gray-300 rounded px-3 py-1"
              />
            </div>
            <button
              onClick={clearFilters}
              className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
            >
              クリア
            </button>
          </div>
        </div>
      )}

      {/* Trigger List */}
      <div className="space-y-2">
        {filteredTriggers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>🤔 質問がまだありません</p>
            <p className="text-sm mt-1">
              意識システムが動作すると、ここに自己生成された質問が表示されます。
            </p>
          </div>
        ) : (
          filteredTriggers.map((trigger) => {
            const importance = getImportanceLevel(trigger.importance);
            const categoryColor = CATEGORY_COLORS[trigger.category] || CATEGORY_COLORS.manual;
            const sourceIcon = SOURCE_ICONS[trigger.source] || '❓';

            return (
              <div
                key={trigger.id}
                className={`border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors ${
                  onTriggerSelect ? 'cursor-pointer' : ''
                }`}
                onClick={() => onTriggerSelect?.(trigger)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Question Text */}
                    <p className="text-sm font-medium text-gray-900 mb-2">
                      {trigger.question}
                    </p>

                    {/* Metadata */}
                    <div className="flex items-center space-x-3 text-xs text-gray-500">
                      <span className="flex items-center space-x-1">
                        <span>{sourceIcon}</span>
                        <span>{trigger.source}</span>
                      </span>

                      <span className={`px-2 py-1 rounded-full border text-xs ${categoryColor}`}>
                        {trigger.category}
                      </span>

                      <span className={`font-medium ${importance.color}`}>
                        重要度: {importance.text}
                      </span>

                      <span>
                        {formatTimestamp(trigger.timestamp)}
                      </span>
                    </div>
                  </div>

                  {/* Importance Bar */}
                  <div className="ml-3 flex flex-col items-end">
                    <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-gray-400 to-blue-500 transition-all"
                        style={{ width: `${trigger.importance * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 mt-1">
                      {Math.round(trigger.importance * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {filteredTriggers.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200 text-center">
          <button
            onClick={fetchTriggerHistory}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            🔄 履歴を更新
          </button>
        </div>
      )}
    </div>
  );
};

export default TriggerHistory;