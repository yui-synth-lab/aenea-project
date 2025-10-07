/**
 * DPD Score Display Component
 * Dynamic Prime Directive スコア表示コンポーネント
 */

import React, { useState, useEffect } from 'react';

interface DPDScores {
  empathy: number;
  coherence: number;
  dissonance: number;
  weightedTotal: number;
}

interface DPDWeights {
  empathy: number;
  coherence: number;
  dissonance: number;
  timestamp: number;
}

interface DPDHistory {
  timestamp: number;
  scores: DPDScores;
  context: string;
}

export const DPDScoreDisplay: React.FC = () => {
  const [currentWeights, setCurrentWeights] = useState<DPDWeights>({
    empathy: 0.33,
    coherence: 0.33,
    dissonance: 0.34,
    timestamp: Date.now()
  });

  const [history, setHistory] = useState<DPDHistory[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    // サーバーからDPD履歴を取得（常にサンプリングされた最新データを取得）
    const fetchDPDEvolution = async () => {
      try {
        const response = await fetch('/api/consciousness/dpd/evolution?limit=20&strategy=sampled');
        if (response.ok) {
          const data = await response.json();

          // 現在のweightsを更新
          if (data.currentWeights) {
            setCurrentWeights({
              empathy: data.currentWeights.empathy,
              coherence: data.currentWeights.coherence,
              dissonance: data.currentWeights.dissonance,
              timestamp: data.timestamp || Date.now()
            });
          }

          // 履歴を完全に置き換え（サンプリングされたデータセット）
          const historyData = (data.history || []).sort((a: any, b: any) => a.version - b.version).map((item: any) => ({
            timestamp: item.timestamp,
            scores: {
              empathy: item.empathy,
              coherence: item.coherence,
              dissonance: item.dissonance,
              weightedTotal: (item.empathy + item.coherence + (1 - item.dissonance)) / 3
            },
            context: item.context || item.trigger_type || 'System update'
          }));
          setHistory(historyData);
          setTotalCount(data.totalCount || historyData.length);
        }
      } catch (error) {
        console.error('Failed to fetch DPD evolution:', error);
      }
    };

    // 初回取得
    fetchDPDEvolution();

    // EventSource で DPD 更新イベントを受け取る
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource('/api/consciousness/events');

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);

        // DPD 更新イベントまたは思考サイクル完了時に再取得
        if (data.type === 'dpdUpdated' || data.type === 'thoughtCycleCompleted' || data.type === 'weightUpdate') {
          fetchDPDEvolution();
        }
      };

      eventSource.onerror = () => {
        console.warn('DPD EventSource connection failed, using polling fallback');
        eventSource?.close();

        // フォールバック: 10秒ごとにポーリング
        const fallbackInterval = setInterval(fetchDPDEvolution, 10000);
        return () => clearInterval(fallbackInterval);
      };
    } catch (error) {
      console.warn('Failed to connect to EventSource, using polling fallback');

      // フォールバック: 10秒ごとにポーリング
      const fallbackInterval = setInterval(fetchDPDEvolution, 10000);
      return () => clearInterval(fallbackInterval);
    }

    return () => {
      eventSource?.close();
    };
  }, []);

  const generateRandomContext = (): string => {
    const contexts = [
      'Philosophical reflection',
      'Ethical consideration',
      'Creative expression',
      'Logical analysis',
      'Empathetic response',
      'System integration',
      'Value alignment',
      'Conflict resolution'
    ];
    return contexts[Math.floor(Math.random() * contexts.length)];
  };

  const getDPDColor = (dimension: string, value: number): string => {
    switch (dimension) {
      case 'empathy':
        return '#00ff41'; // Cyber lime
      case 'coherence':
        return '#00ffff'; // Cyber cyan
      case 'dissonance':
        return '#ffff00'; // Cyber yellow
      case 'total':
        return '#ff00ff'; // Cyber magenta
      default:
        return '#4a5568';
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString();
  };


  // バリセントリック座標変換（三角形内の位置を計算）
  const barycentricToCartesian = (empathy: number, coherence: number, dissonance: number) => {
    // 正三角形の頂点座標（上：Empathy, 左下：Coherence, 右下：Dissonance）
    const height = Math.sqrt(3) / 2;
    const vertices = {
      empathy: { x: 0.5, y: 0 },
      coherence: { x: 0, y: height },
      dissonance: { x: 1, y: height }
    };

    // バリセントリック座標で重心計算
    const x = empathy * vertices.empathy.x + coherence * vertices.coherence.x + dissonance * vertices.dissonance.x;
    const y = empathy * vertices.empathy.y + coherence * vertices.coherence.y + dissonance * vertices.dissonance.y;

    return { x, y };
  };

  return (
    <>
      <div className="dpd-score-display">
        <div className="dpd-header">
          <div className="header-title">
            <h3>Dynamic Prime Directive</h3>
            <span className="subtitle">DPD Weight Evolution</span>
          </div>
          <button
            className="expand-toggle"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>

      {isExpanded && (
        <div className="dpd-content">
          {/* バリセントリック三角図 */}
          <div className="barycentric-triangle">
            <svg width="100%" height="100%" viewBox="0 0 1 0.866" preserveAspectRatio="xMidYMid meet">
              {/* 背景グリッド線 */}
              <defs>
                <linearGradient id="empathyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style={{stopColor: '#00ff41', stopOpacity: 0.1}} />
                  <stop offset="100%" style={{stopColor: '#00ff41', stopOpacity: 0.4}} />
                </linearGradient>
                <linearGradient id="coherenceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{stopColor: '#00ffff', stopOpacity: 0.1}} />
                  <stop offset="100%" style={{stopColor: '#00ffff', stopOpacity: 0.4}} />
                </linearGradient>
                <linearGradient id="dissonanceGradient" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{stopColor: '#ffff00', stopOpacity: 0.1}} />
                  <stop offset="100%" style={{stopColor: '#ffff00', stopOpacity: 0.4}} />
                </linearGradient>
              </defs>

              {/* 三角形の辺 */}
              <polygon
                points="0.5,0.05 0.05,0.816 0.95,0.816"
                fill="none"
                stroke="var(--cyber-border)"
                strokeWidth="0.004"
                opacity="0.6"
              />

              {/* 内部グリッド線（10%刻み） */}
              {[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map((ratio) => (
                <g key={ratio} opacity="0.15">
                  {/* Empathy方向の線 */}
                  <line
                    x1={0.05 + (0.45 * ratio)}
                    y1={0.816 - (0.766 * ratio)}
                    x2={0.95 - (0.45 * ratio)}
                    y2={0.816 - (0.766 * ratio)}
                    stroke="#00ff41"
                    strokeWidth="0.001"
                  />
                  {/* Coherence方向の線 */}
                  <line
                    x1={0.5 - (0.45 * ratio)}
                    y1={0.05 + (0.766 * ratio)}
                    x2={0.95 - (0.45 * ratio)}
                    y2={0.816}
                    stroke="#00ffff"
                    strokeWidth="0.001"
                  />
                  {/* Dissonance方向の線 */}
                  <line
                    x1={0.5 + (0.45 * ratio)}
                    y1={0.05 + (0.766 * ratio)}
                    x2={0.05 + (0.45 * ratio)}
                    y2={0.816}
                    stroke="#ffff00"
                    strokeWidth="0.001"
                  />
                </g>
              ))}

              {/* 頂点ラベルと光点 */}
              <g className="vertex empathy">
                <circle cx="0.5" cy="0.05" r="0.015" fill="#00ff41" opacity="0.8" />
                <circle cx="0.5" cy="0.05" r="0.025" fill="none" stroke="#00ff41" strokeWidth="0.002" opacity="0.4">
                  <animate attributeName="r" values="0.025;0.035;0.025" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
                </circle>
                <text x="0.5" y="0.02" textAnchor="middle" fill="#00ff41" fontSize="0.04" fontFamily="Courier New" fontWeight="bold">
                  E {(currentWeights.empathy * 100).toFixed(0)}%
                </text>
              </g>

              <g className="vertex coherence">
                <circle cx="0.05" cy="0.816" r="0.015" fill="#00ffff" opacity="0.8" />
                <circle cx="0.05" cy="0.816" r="0.025" fill="none" stroke="#00ffff" strokeWidth="0.002" opacity="0.4">
                  <animate attributeName="r" values="0.025;0.035;0.025" dur="2s" repeatCount="indefinite" begin="0.66s" />
                  <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" begin="0.66s" />
                </circle>
                <text x="0.05" y="0.85" textAnchor="middle" fill="#00ffff" fontSize="0.04" fontFamily="Courier New" fontWeight="bold">
                  C {(currentWeights.coherence * 100).toFixed(0)}%
                </text>
              </g>

              <g className="vertex dissonance">
                <circle cx="0.95" cy="0.816" r="0.015" fill="#ffff00" opacity="0.8" />
                <circle cx="0.95" cy="0.816" r="0.025" fill="none" stroke="#ffff00" strokeWidth="0.002" opacity="0.4">
                  <animate attributeName="r" values="0.025;0.035;0.025" dur="2s" repeatCount="indefinite" begin="1.33s" />
                  <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" begin="1.33s" />
                </circle>
                <text x="0.95" y="0.85" textAnchor="middle" fill="#ffff00" fontSize="0.04" fontFamily="Courier New" fontWeight="bold">
                  D {(currentWeights.dissonance * 100).toFixed(0)}%
                </text>
              </g>

              {/* 現在位置の点とトレイル */}
              {(() => {
                const pos = barycentricToCartesian(currentWeights.empathy, currentWeights.coherence, currentWeights.dissonance);
                // 三角形内にスケーリング調整
                const scaledX = 0.05 + pos.x * 0.9;
                const scaledY = 0.05 + pos.y * 0.9;

                return (
                  <g className="current-position">
                    {/* 光る円（パルス） */}
                    <circle cx={scaledX} cy={scaledY} r="0.04" fill="#ff00ff" opacity="0.2">
                      <animate attributeName="r" values="0.04;0.06;0.04" dur="1.5s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.2;0;0.2" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                    <circle cx={scaledX} cy={scaledY} r="0.02" fill="#ff00ff" opacity="0.6">
                      <animate attributeName="opacity" values="0.6;1;0.6" dur="1s" repeatCount="indefinite" />
                    </circle>
                    <circle cx={scaledX} cy={scaledY} r="0.012" fill="#ffffff" opacity="1" />

                    {/* 十字線 */}
                    <line x1={scaledX - 0.03} y1={scaledY} x2={scaledX + 0.03} y2={scaledY} stroke="#ff00ff" strokeWidth="0.002" opacity="0.8" />
                    <line x1={scaledX} y1={scaledY - 0.03} x2={scaledX} y2={scaledY + 0.03} stroke="#ff00ff" strokeWidth="0.002" opacity="0.8" />
                  </g>
                );
              })()}

              {/* 履歴軌跡（中央線として表示） */}
              {history.length > 1 && (
                <g className="history-trail">
                  {/* グラデーション定義 */}
                  <defs>
                    <linearGradient id="trailGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style={{stopColor: '#ff00ff', stopOpacity: 0.2}} />
                      <stop offset="100%" style={{stopColor: '#ff00ff', stopOpacity: 1}} />
                    </linearGradient>
                  </defs>

                  {/* 軌跡線（太めで目立つ） */}
                  <polyline
                    points={history.slice(0, 20).reverse().map((entry) => {
                      const pos = barycentricToCartesian(entry.scores.empathy, entry.scores.coherence, entry.scores.dissonance);
                      const scaledX = 0.05 + pos.x * 0.9;
                      const scaledY = 0.05 + pos.y * 0.9;
                      return `${scaledX},${scaledY}`;
                    }).join(' ')}
                    fill="none"
                    stroke="url(#trailGradient)"
                    strokeWidth="0.004"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.8"
                  />

                  {/* 履歴ポイント（新しいほど大きく明るく） */}
                  {history.slice(0, 20).map((entry, index) => {
                    const pos = barycentricToCartesian(entry.scores.empathy, entry.scores.coherence, entry.scores.dissonance);
                    const scaledX = 0.05 + pos.x * 0.9;
                    const scaledY = 0.05 + pos.y * 0.9;
                    const progress = index / Math.min(19, history.length - 1);
                    const radius = 0.004 + (progress * 0.008); // 古い: 0.004 → 新しい: 0.012
                    const opacity = 0.3 + (progress * 0.5); // 古い: 0.3 → 新しい: 0.8

                    return (
                      <g key={`trail-${index}`}>
                        {/* 外側のグロウ */}
                        <circle
                          cx={scaledX}
                          cy={scaledY}
                          r={radius * 2}
                          fill="#ff00ff"
                          opacity={opacity * 0.3}
                        />
                        {/* コアポイント */}
                        <circle
                          cx={scaledX}
                          cy={scaledY}
                          r={radius}
                          fill="#ff00ff"
                          opacity={opacity}
                        />
                      </g>
                    );
                  })}
                </g>
              )}
            </svg>
          </div>

          <div className="weight-evolution">
            <div className="evolution-chart">
              {history.length > 1 ? (
                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {/* Stacked area chart */}
                  {/* Bottom: Dissonance (yellow) */}
                  <polygon
                    fill="#ffff00"
                    fillOpacity="0.6"
                    stroke="#ffff00"
                    strokeWidth="0.8"
                    points={
                      history.map((entry, index) => {
                        const x = (index / (history.length - 1)) * 100;
                        return `${x},100`;
                      }).join(' ') + ' ' +
                      history.map((entry, index) => {
                        const x = (index / (history.length - 1)) * 100;
                        const y = 100 - (entry.scores.dissonance * 100);
                        return `${x},${y}`;
                      }).reverse().join(' ')
                    }
                  />
                  {/* Middle: Coherence (cyan) */}
                  <polygon
                    fill="#00ffff"
                    fillOpacity="0.6"
                    stroke="#00ffff"
                    strokeWidth="0.8"
                    points={
                      history.map((entry, index) => {
                        const x = (index / (history.length - 1)) * 100;
                        const y = 100 - (entry.scores.dissonance * 100);
                        return `${x},${y}`;
                      }).join(' ') + ' ' +
                      history.map((entry, index) => {
                        const x = (index / (history.length - 1)) * 100;
                        const y = 100 - (entry.scores.dissonance * 100) - (entry.scores.coherence * 100);
                        return `${x},${y}`;
                      }).reverse().join(' ')
                    }
                  />
                  {/* Top: Empathy (lime) */}
                  <polygon
                    fill="#00ff41"
                    fillOpacity="0.6"
                    stroke="#00ff41"
                    strokeWidth="0.8"
                    points={
                      history.map((entry, index) => {
                        const x = (index / (history.length - 1)) * 100;
                        const y = 100 - (entry.scores.dissonance * 100) - (entry.scores.coherence * 100);
                        return `${x},${y}`;
                      }).join(' ') + ' ' +
                      history.map((entry, index) => {
                        const x = (index / (history.length - 1)) * 100;
                        return `${x},0`;
                      }).reverse().join(' ')
                    }
                  />
                </svg>
              ) : (
                <div className="no-data">Waiting for weight evolution data...</div>
              )}

              <div className="chart-legend">
                <div className="legend-item">
                  <div className="legend-color empathy"></div>
                  <span>Empathy</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color coherence"></div>
                  <span>Coherence</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color dissonance"></div>
                  <span>Dissonance</span>
                </div>
              </div>
            </div>

            <div className="weight-display">
              <div className="weight-item">
                <span>E: {(currentWeights.empathy * 100).toFixed(1)}%</span>
                <div
                  className="weight-bar"
                  style={{ width: `${currentWeights.empathy * 100}%`, backgroundColor: getDPDColor('empathy', 0.7) }}
                />
              </div>
              <div className="weight-item">
                <span>C: {(currentWeights.coherence * 100).toFixed(1)}%</span>
                <div
                  className="weight-bar"
                  style={{ width: `${currentWeights.coherence * 100}%`, backgroundColor: getDPDColor('coherence', 0.7) }}
                />
              </div>
              <div className="weight-item">
                <span>D: {(currentWeights.dissonance * 100).toFixed(1)}%</span>
                <div
                  className="weight-bar"
                  style={{ width: `${currentWeights.dissonance * 100}%`, backgroundColor: getDPDColor('dissonance', 0.3) }}
                />
              </div>
            </div>
            <div className="weight-timestamp">
              Updated: {formatTimestamp(currentWeights.timestamp)}
            </div>
          </div>
        </div>
      )}
      </div>

      <style>{`
        .dpd-score-display {
          background: var(--cyber-bg-tertiary);
          padding: 24px;
          border: 2px solid var(--cyber-border);
          clip-path: polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px);
          box-shadow: inset 0 0 20px rgba(0, 255, 255, 0.05);
          position: relative;
        }

        .dpd-score-display::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 8px;
          height: 8px;
          background: var(--cyber-neon-cyan);
          box-shadow: 0 0 8px var(--cyber-glow-cyan);
        }

        .dpd-score-display::after {
          content: '';
          position: absolute;
          bottom: 0;
          right: 0;
          width: 8px;
          height: 8px;
          background: var(--cyber-neon-cyan);
          box-shadow: 0 0 8px var(--cyber-glow-cyan);
        }

        .dpd-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--cyber-border);
        }

        .header-title h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          color: var(--cyber-neon-cyan);
          text-transform: uppercase;
          letter-spacing: 2px;
          text-shadow: 0 0 8px var(--cyber-glow-cyan);
          font-family: 'Courier New', 'Consolas', monospace;
        }

        .subtitle {
          color: var(--cyber-text-secondary);
          font-size: 11px;
          font-family: 'Courier New', 'Consolas', monospace;
        }

        .expand-toggle {
          background: var(--cyber-bg-secondary);
          border: 2px solid var(--cyber-neon-cyan);
          padding: 4px 12px;
          color: var(--cyber-neon-cyan);
          cursor: pointer;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          clip-path: polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px);
          box-shadow: 0 0 6px var(--cyber-glow-cyan);
          transition: all 0.2s;
          font-family: 'Courier New', 'Consolas', monospace;
        }

        .expand-toggle:hover {
          box-shadow: 0 0 12px var(--cyber-glow-cyan);
          transform: translateY(-1px);
        }

        .dpd-content {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .barycentric-triangle {
          background: var(--cyber-bg-secondary);
          padding: 24px;
          border: 2px solid var(--cyber-border);
          border-left: 4px solid var(--cyber-neon-magenta);
          box-shadow: inset 0 0 20px rgba(255, 0, 255, 0.1);
          min-height: 400px;
          position: relative;
        }

        .barycentric-triangle::before {
          content: 'BARYCENTRIC VISUALIZATION';
          position: absolute;
          top: 8px;
          left: 12px;
          font-size: 10px;
          color: var(--cyber-neon-magenta);
          font-family: 'Courier New', monospace;
          letter-spacing: 1px;
          opacity: 0.6;
          text-transform: uppercase;
        }

        .barycentric-triangle svg {
          filter: drop-shadow(0 0 8px rgba(255, 0, 255, 0.3));
        }

        .weight-evolution {
          background: var(--cyber-bg-secondary);
          padding: 16px;
          border: 2px solid var(--cyber-border);
          border-left: 4px solid var(--cyber-neon-cyan);
          box-shadow: inset 0 0 20px rgba(0, 255, 255, 0.1);
          position: relative;
        }

        .weight-evolution::before {
          content: 'STACKED AREA CHART';
          position: absolute;
          top: 8px;
          left: 12px;
          font-size: 10px;
          color: var(--cyber-neon-cyan);
          font-family: 'Courier New', monospace;
          letter-spacing: 1px;
          opacity: 0.6;
          text-transform: uppercase;
        }

        .evolution-chart {
          background: var(--cyber-bg-tertiary);
          padding: 16px;
          border: 1px solid var(--cyber-border);
          height: 200px;
          position: relative;
          margin-bottom: 16px;
          box-shadow: inset 0 0 15px rgba(0, 0, 0, 0.5);
        }

        .evolution-chart svg {
          width: 100%;
          height: 100%;
        }

        .no-data {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #9ca3af;
          font-size: 14px;
        }

        .chart-legend {
          position: absolute;
          bottom: 8px;
          right: 8px;
          display: flex;
          gap: 12px;
          font-size: 12px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .legend-color {
          width: 12px;
          height: 2px;
        }

        .legend-color.empathy {
          background: #10b981;
        }

        .legend-color.coherence {
          background: #3b82f6;
        }

        .legend-color.dissonance {
          background: #f59e0b;
        }

        .legend-item span {
          color: #e5e7eb;
        }

        .section-title {
          font-size: 14px;
          font-weight: 600;
          color: #f9fafb;
          margin-bottom: 12px;
        }

        .weight-display {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .weight-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .weight-item span {
          min-width: 60px;
          font-size: 12px;
          color: #e5e7eb;
        }

        .weight-bar {
          height: 6px;
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .weight-timestamp {
          margin-top: 8px;
          font-size: 11px;
          color: #9ca3af;
          text-align: right;
        }

        @media (max-width: 640px) {
          .dpd-score-display {
            padding: 16px;
          }

          .header-title h3 {
            font-size: 16px;
          }

          .weight-item span {
            min-width: 50px;
            font-size: 11px;
          }
        }
      `}</style>
    </>
  );
};

export default DPDScoreDisplay;