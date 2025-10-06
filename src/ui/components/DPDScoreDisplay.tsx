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
          const historyData = (data.history || []).map((item: any) => ({
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


  const renderScoreDimension = (label: string, value: number, weight: number, dimension: string) => (
    <div className="dpd-dimension">
      <div className="dimension-header">
        <span className="dimension-label">{label}</span>
        <span className="dimension-weight">({(weight * 100).toFixed(0)}%)</span>
        <span className="dimension-value">{value.toFixed(3)}</span>
      </div>
      <div className="dimension-bar">
        <div
          className="dimension-fill"
          style={{
            width: `${value * 100}%`,
            backgroundColor: getDPDColor(dimension, value)
          }}
        />
      </div>
    </div>
  );

  return (
    <>
      <div className="dpd-score-display">
        <div className="dpd-header">
          <div className="header-title">
            <h3>DPD Scores</h3>
            <span className="subtitle">Dynamic Prime Directive</span>
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
          <div className="current-scores">
            <>
              {renderScoreDimension('Empathy 共感', currentWeights.empathy, currentWeights.empathy, 'empathy')}
              {renderScoreDimension('Coherence 一貫性', currentWeights.coherence, currentWeights.coherence, 'coherence')}
              {renderScoreDimension('Dissonance 不協和', currentWeights.dissonance, currentWeights.dissonance, 'dissonance')}
            </>
          </div>

          <div className="weight-evolution">
            <div className="section-title">Weight Evolution Chart</div>
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

          {history.length > 0 && (
            <div className="score-history">
              <div className="section-title">
                Score History
                <span className="history-count">
                  {' '}(Showing {history.length} of {totalCount} total)
                </span>
              </div>
              <div className="history-list">
                {history.map((entry, index) => (
                  <div key={`${entry.timestamp}-${index}`} className="history-item">
                    <div className="history-time">
                      {formatTimestamp(entry.timestamp)}
                    </div>
                    <div className="history-scores">
                      <span>E:{entry.scores.empathy.toFixed(2)}</span>
                      <span>C:{entry.scores.coherence.toFixed(2)}</span>
                      <span>D:{entry.scores.dissonance.toFixed(2)}</span>
                      <span className="total">Σ:{entry.scores.weightedTotal.toFixed(2)}</span>
                    </div>
                    <div className="history-context">{entry.context}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {history.length > 0 && (
            <div className="dpd-insights">
              <div className="section-title">Current Assessment</div>
              <div className="insights-list">
                {history[0].scores.empathy > 0.7 && (
                  <div className="insight empathy">High empathetic response detected</div>
                )}
                {history[0].scores.coherence > 0.8 && (
                  <div className="insight coherence">Strong logical coherence maintained</div>
                )}
                {history[0].scores.dissonance > 0.6 && (
                  <div className="insight dissonance">Significant ethical tension present</div>
                )}
                {history[0].scores.weightedTotal > 0.7 && (
                  <div className="insight total">System operating within optimal parameters</div>
                )}
                {history[0].scores.weightedTotal < 0.3 && (
                  <div className="insight warning">System values may need recalibration</div>
                )}
              </div>
            </div>
          )}
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
          gap: 16px;
        }

        .dpd-dimension {
          margin-bottom: 12px;
        }

        .dimension-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .dimension-label {
          font-size: 14px;
          color: #e5e7eb;
        }

        .dimension-weight {
          font-size: 12px;
          color: #9ca3af;
        }

        .dimension-value {
          font-size: 14px;
          font-weight: 600;
          color: #f9fafb;
        }

        .dimension-bar {
          height: 12px;
          background: var(--cyber-bg-secondary);
          border: 1px solid var(--cyber-border);
          overflow: hidden;
          position: relative;
          box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.5);
        }

        .dimension-bar::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--cyber-neon-cyan), transparent);
          opacity: 0.5;
        }

        .dimension-fill {
          height: 100%;
          transition: width 0.3s ease;
          box-shadow: 0 0 10px currentColor;
          position: relative;
        }

        .dimension-fill::after {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 2px;
          height: 100%;
          background: rgba(255, 255, 255, 0.6);
        }

        .weight-evolution {
          background: var(--cyber-bg-secondary);
          padding: 16px;
          border: 1px solid var(--cyber-border);
          border-left: 3px solid var(--cyber-neon-cyan);
          box-shadow: inset 0 0 15px rgba(0, 255, 255, 0.05);
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

        .score-history {
          background: #374151;
          padding: 16px;
          border-radius: 8px;
          max-height: 300px;
          overflow-y: auto;
        }

        .history-count {
          font-size: 12px;
          color: #9ca3af;
          font-weight: 400;
        }

        .history-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .history-item {
          background: #1f2937;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 12px;
        }

        .history-time {
          color: #9ca3af;
          font-family: 'Courier New', monospace;
          margin-bottom: 4px;
        }

        .history-scores {
          display: flex;
          gap: 12px;
          margin-bottom: 4px;
        }

        .history-scores span {
          color: #e5e7eb;
        }

        .history-scores .total {
          color: #3b82f6;
          font-weight: 600;
        }

        .history-context {
          color: #9ca3af;
          font-style: italic;
        }

        .dpd-insights {
          background: #1e3a8a;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #3b82f6;
        }

        .insights-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .insight {
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 13px;
        }

        .insight.empathy {
          background: #064e3b;
          color: #10b981;
          border-left: 3px solid #10b981;
        }

        .insight.coherence {
          background: #1e3a8a;
          color: #3b82f6;
          border-left: 3px solid #3b82f6;
        }

        .insight.dissonance {
          background: #451a03;
          color: #f59e0b;
          border-left: 3px solid #f59e0b;
        }

        .insight.total {
          background: #065f46;
          color: #34d399;
          border-left: 3px solid #34d399;
        }

        .insight.warning {
          background: #7f1d1d;
          color: #ef4444;
          border-left: 3px solid #ef4444;
        }

        @media (max-width: 640px) {
          .dpd-score-display {
            padding: 16px;
          }

          .header-title h3 {
            font-size: 16px;
          }

          .dimension-label,
          .dimension-value {
            font-size: 12px;
          }

          .weight-item span {
            min-width: 50px;
            font-size: 11px;
          }

          .history-item {
            padding: 6px 10px;
          }

          .history-scores {
            flex-wrap: wrap;
            gap: 8px;
          }
        }
      `}</style>
    </>
  );
};

export default DPDScoreDisplay;