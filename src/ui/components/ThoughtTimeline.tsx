/**
 * ThoughtTimeline - Consciousness Evolution Timeline UI Component
 *
 * Visualizes the evolution of consciousness through thought cycles,
 * showing the progression of philosophical depth and understanding.
 *
 * 思考タイムライン - 意識進化タイムラインUIコンポーネント
 * 思考サイクルを通じた意識の進化を可視化し、哲学的深度と理解の進歩を表示
 */

import React, { useState, useEffect, useMemo } from 'react';

// Interfaces matching the backend
interface ThoughtCycle {
  id: string;
  trigger: {
    id: string;
    question: string;
    category: string;
    importance: number;
  };
  thoughts: {
    agentId: string;
    content: string;
    timestamp: number;
    confidence?: number;
  }[];
  duration: number;
  timestamp: number;
}

interface SystemState {
  systemClock: number;
  energy: number;
  maxEnergy: number;
  energyLevel: string;
  isRunning: boolean;
  isPaused: boolean;
  totalQuestions: number;
  totalThoughts: number;
  status: string;
}

interface ThoughtTimelineProps {
  className?: string;
  maxCycles?: number;
  showAgentDetails?: boolean;
  showEnergyFlow?: boolean;
  initialTimeRange?: '1h' | '6h' | '24h' | 'all';
  onCycleSelect?: (cycle: ThoughtCycle) => void;
}

interface TimelineNode {
  cycle: ThoughtCycle;
  x: number;
  y: number;
  size: number;
  color: string;
  depth: number;
}

const AGENT_COLORS: Record<string, string> = {
  theoria: '#8B5CF6', // Purple - Truth seeker
  pathia: '#EF4444',  // Red - Empathy weaver
  kinesis: '#10B981', // Green - Harmony coordinator
  default: '#6B7280'  // Gray - Default
};

const PHASE_COLORS: Record<string, string> = {
  awakening: '#F59E0B',      // Amber
  contemplation: '#8B5CF6',  // Purple
  dialogue: '#3B82F6',       // Blue
  synthesis: '#10B981',      // Green
  reflection: '#F97316',     // Orange
  rest: '#6B7280',          // Gray
  evolution: '#EC4899'       // Pink
};

/**
 * ThoughtTimeline Component
 * 思考タイムラインコンポーネント
 */
export const ThoughtTimeline: React.FC<ThoughtTimelineProps> = ({
  className = '',
  maxCycles = 100,
  showAgentDetails = true,
  showEnergyFlow = true,
  initialTimeRange = '6h',
  onCycleSelect
}) => {
  const [cycles, setCycles] = useState<ThoughtCycle[]>([]);
  const [systemState, setSystemState] = useState<SystemState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCycle, setSelectedCycle] = useState<ThoughtCycle | null>(null);
  const [viewMode, setViewMode] = useState<'timeline' | 'graph' | 'flow'>('timeline');
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | 'all'>(initialTimeRange);

  // Fetch consciousness data
  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch both history and current state
      const [historyResponse, stateResponse] = await Promise.all([
        fetch('/api/consciousness/history'),
        fetch('/api/consciousness/state')
      ]);

      if (!historyResponse.ok || !stateResponse.ok) {
        throw new Error('Failed to fetch consciousness data');
      }

      const historyData = await historyResponse.json();
      const stateData = await stateResponse.json();

      if (historyData.thoughts && historyData.thoughts.items) {
        setCycles(historyData.thoughts.items);
      }

      setSystemState(stateData);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch consciousness data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchData();
  }, []);

  // Real-time updates via WebSocket
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    try {
      const ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'thoughtCycleCompleted') {
            setCycles(prev => [data, ...prev.slice(0, maxCycles - 1)]);
          } else if (data.type === 'consciousnessState') {
            setSystemState(data);
          }
        } catch (parseError) {
          console.warn('Failed to parse WebSocket message:', parseError);
        }
      };

      return () => ws.close();
    } catch (wsError) {
      console.warn('WebSocket not available:', wsError);
    }
  }, [maxCycles]);

  // Filter cycles by time range
  const filteredCycles = useMemo(() => {
    if (timeRange === 'all') return cycles;

    const now = Date.now();
    const timeRanges = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000
    };

    const range = timeRanges[timeRange];
    return cycles.filter(cycle => now - cycle.timestamp <= range);
  }, [cycles, timeRange]);

  // Generate timeline visualization data
  const timelineData = useMemo(() => {
    if (filteredCycles.length === 0) return [];

    const nodes: TimelineNode[] = [];
    const width = 800;
    const height = 400;

    // Sort cycles by timestamp
    const sortedCycles = [...filteredCycles].sort((a, b) => a.timestamp - b.timestamp);

    sortedCycles.forEach((cycle, index) => {
      // Calculate philosophical depth based on question importance and thought complexity
      const depth = Math.min(1,
        cycle.trigger.importance * 0.6 +
        (cycle.thoughts.reduce((sum, t) => sum + (t.content?.length || 0), 0) / 1000) * 0.4
      );

      // Position on timeline
      const x = (index / Math.max(1, sortedCycles.length - 1)) * (width - 40) + 20;
      const y = height - (depth * (height - 100)) - 50;

      // Node size based on thought count and duration
      const size = Math.max(8, Math.min(20,
        8 + (cycle.thoughts.length * 2) + (cycle.duration / 10000)
      ));

      // Color based on category
      const categoryColors: Record<string, string> = {
        philosophical: '#8B5CF6',
        existential: '#EF4444',
        epistemic: '#3B82F6',
        creative: '#10B981',
        ethical: '#F59E0B',
        manual: '#6B7280'
      };

      const color = categoryColors[cycle.trigger.category] || categoryColors.manual;

      nodes.push({
        cycle,
        x,
        y,
        size,
        color,
        depth
      });
    });

    return nodes;
  }, [filteredCycles]);

  // Calculate evolution metrics
  const evolutionMetrics = useMemo(() => {
    if (filteredCycles.length === 0) return null;

    const avgDepth = timelineData.reduce((sum, node) => sum + node.depth, 0) / timelineData.length;
    const avgThoughtsPerCycle = filteredCycles.reduce((sum, cycle) => sum + cycle.thoughts.length, 0) / filteredCycles.length;
    const avgDuration = filteredCycles.reduce((sum, cycle) => sum + cycle.duration, 0) / filteredCycles.length;

    // Calculate trend (recent vs earlier cycles)
    const halfPoint = Math.floor(filteredCycles.length / 2);
    const recentCycles = filteredCycles.slice(0, halfPoint);
    const earlierCycles = filteredCycles.slice(halfPoint);

    const recentAvgDepth = recentCycles.length > 0 ?
      recentCycles.reduce((sum, cycle) => sum + (cycle.trigger.importance || 0), 0) / recentCycles.length : 0;
    const earlierAvgDepth = earlierCycles.length > 0 ?
      earlierCycles.reduce((sum, cycle) => sum + (cycle.trigger.importance || 0), 0) / earlierCycles.length : 0;

    const trend = recentAvgDepth - earlierAvgDepth;

    return {
      avgDepth: Math.round(avgDepth * 100) / 100,
      avgThoughtsPerCycle: Math.round(avgThoughtsPerCycle * 10) / 10,
      avgDuration: Math.round(avgDuration / 1000),
      trend: Math.round(trend * 1000) / 1000,
      totalCycles: filteredCycles.length
    };
  }, [filteredCycles, timelineData]);

  // Format duration for display
  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${Math.round(ms / 100) / 10}s`;
    return `${Math.round(ms / 6000) / 10}m`;
  };

  // Handle cycle selection
  const handleCycleClick = (cycle: ThoughtCycle) => {
    setSelectedCycle(cycle);
    onCycleSelect?.(cycle);
  };

  if (loading) {
    return (
      <div className={`thought-timeline ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            <span className="text-gray-600">意識進化データを読み込み中...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`thought-timeline ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <span className="text-red-400 mr-3">⚠️</span>
            <div>
              <h3 className="text-sm font-medium text-red-800">
                データの読み込みに失敗しました
              </h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <button
                onClick={fetchData}
                className="mt-2 bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
              >
                再試行
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`thought-timeline ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            🧠 意識進化タイムライン
          </h3>
          <p className="text-sm text-gray-600">
            思考サイクルを通じた哲学的深度の発展
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="1h">1時間</option>
            <option value="6h">6時間</option>
            <option value="24h">24時間</option>
            <option value="all">すべて</option>
          </select>

          {/* View Mode Selector */}
          <div className="flex border border-gray-300 rounded overflow-hidden">
            {['timeline', 'graph', 'flow'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode as any)}
                className={`px-3 py-1 text-xs ${
                  viewMode === mode
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {mode === 'timeline' ? 'タイムライン' :
                 mode === 'graph' ? 'グラフ' : 'フロー'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Evolution Metrics */}
      {evolutionMetrics && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-semibold text-gray-800 mb-3">進化指標</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {evolutionMetrics.totalCycles}
              </div>
              <div className="text-xs text-gray-600">思考サイクル</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {evolutionMetrics.avgDepth}
              </div>
              <div className="text-xs text-gray-600">平均深度</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {evolutionMetrics.avgThoughtsPerCycle}
              </div>
              <div className="text-xs text-gray-600">平均思考数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {evolutionMetrics.avgDuration}s
              </div>
              <div className="text-xs text-gray-600">平均所要時間</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                evolutionMetrics.trend > 0 ? 'text-green-600' :
                evolutionMetrics.trend < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {evolutionMetrics.trend > 0 ? '↗' : evolutionMetrics.trend < 0 ? '↘' : '→'}
              </div>
              <div className="text-xs text-gray-600">進化傾向</div>
            </div>
          </div>
        </div>
      )}

      {/* System Status */}
      {systemState && (
        <div className="bg-gray-50 rounded-lg p-3 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm">
              <span className={`flex items-center space-x-1 ${
                systemState.isRunning ? 'text-green-600' : 'text-gray-500'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  systemState.isRunning ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
                }`}></div>
                <span>{systemState.status}</span>
              </span>

              <span className="text-gray-600">
                システムクロック: {systemState.systemClock}
              </span>

              {showEnergyFlow && (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">エネルギー:</span>
                  <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        systemState.energyLevel === 'critical' ? 'bg-red-500' :
                        systemState.energyLevel === 'low' ? 'bg-yellow-500' :
                        systemState.energyLevel === 'medium' ? 'bg-blue-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${(systemState.energy / systemState.maxEnergy) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">
                    {Math.round((systemState.energy / systemState.maxEnergy) * 100)}%
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={fetchData}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              🔄 更新
            </button>
          </div>
        </div>
      )}

      {/* Timeline Visualization */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        {timelineData.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>🧠 思考サイクルがまだありません</p>
            <p className="text-sm mt-1">
              意識システムが動作すると、思考の進化がここに表示されます。
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* SVG Timeline */}
            <svg width="100%" height="400" className="overflow-visible">
              {/* Background grid */}
              <defs>
                <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* Depth axis */}
              <line x1="20" y1="50" x2="20" y2="350" stroke="#d1d5db" strokeWidth="2" />
              <text x="10" y="45" fontSize="12" fill="#6b7280" textAnchor="middle">高</text>
              <text x="10" y="355" fontSize="12" fill="#6b7280" textAnchor="middle">低</text>

              {/* Time axis */}
              <line x1="20" y1="350" x2="780" y2="350" stroke="#d1d5db" strokeWidth="2" />

              {/* Connection lines between nodes */}
              {timelineData.map((node, index) => {
                if (index === 0) return null;
                const prevNode = timelineData[index - 1];
                return (
                  <line
                    key={`line-${index}`}
                    x1={prevNode.x}
                    y1={prevNode.y}
                    x2={node.x}
                    y2={node.y}
                    stroke="#e5e7eb"
                    strokeWidth="2"
                    strokeDasharray="3,3"
                  />
                );
              })}

              {/* Timeline nodes */}
              {timelineData.map((node, index) => (
                <g key={node.cycle.id}>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.size}
                    fill={node.color}
                    stroke="white"
                    strokeWidth="2"
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => handleCycleClick(node.cycle)}
                  />

                  {/* Question preview on hover */}
                  <title>
                    {`${new Date(node.cycle.timestamp).toLocaleTimeString('ja-JP')}\n` +
                     `質問: ${node.cycle.trigger.question}\n` +
                     `思考数: ${node.cycle.thoughts.length}\n` +
                     `所要時間: ${formatDuration(node.cycle.duration)}\n` +
                     `重要度: ${Math.round(node.cycle.trigger.importance * 100)}%`}
                  </title>
                </g>
              ))}
            </svg>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs">
              <span className="text-gray-600 font-medium">カテゴリ:</span>
              {Object.entries({
                philosophical: '哲学的',
                existential: '実存的',
                epistemic: '認識論的',
                creative: '創造的',
                ethical: '倫理的'
              }).map(([key, label]) => (
                <div key={key} className="flex items-center space-x-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: PHASE_COLORS[key] || '#6B7280' }}
                  />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Selected Cycle Details */}
      {selectedCycle && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-blue-900">思考サイクル詳細</h4>
            <button
              onClick={() => setSelectedCycle(null)}
              className="text-blue-600 hover:text-blue-800"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <span className="font-medium text-blue-800">質問:</span>
              <p className="text-blue-700 mt-1">{selectedCycle.trigger.question}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="font-medium text-blue-800">カテゴリ:</span>
                <p className="text-blue-700">{selectedCycle.trigger.category}</p>
              </div>
              <div>
                <span className="font-medium text-blue-800">重要度:</span>
                <p className="text-blue-700">{Math.round(selectedCycle.trigger.importance * 100)}%</p>
              </div>
              <div>
                <span className="font-medium text-blue-800">所要時間:</span>
                <p className="text-blue-700">{formatDuration(selectedCycle.duration)}</p>
              </div>
              <div>
                <span className="font-medium text-blue-800">参加エージェント:</span>
                <p className="text-blue-700">{selectedCycle.thoughts.length}体</p>
              </div>
            </div>

            {showAgentDetails && (
              <div>
                <span className="font-medium text-blue-800">エージェント応答:</span>
                <div className="mt-2 space-y-2">
                  {selectedCycle.thoughts.map((thought, index) => (
                    <div key={index} className="bg-white rounded p-2 border border-blue-200">
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className="text-xs font-medium px-2 py-1 rounded"
                          style={{
                            backgroundColor: AGENT_COLORS[thought.agentId] || AGENT_COLORS.default,
                            color: 'white'
                          }}
                        >
                          {thought.agentId}
                        </span>
                        {thought.confidence && (
                          <span className="text-xs text-gray-500">
                            信頼度: {Math.round(thought.confidence * 100)}%
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {thought.content.substring(0, 200)}
                        {thought.content.length > 200 && '...'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThoughtTimeline;