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
        if (data.type === 'dpdUpdate' || data.type === 'thoughtCycleComplete' || data.type === 'weightUpdate') {
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
        return `hsl(${120 * value}, 70%, 50%)`; // Green spectrum
      case 'coherence':
        return `hsl(${240 * value}, 70%, 50%)`; // Blue spectrum
      case 'dissonance':
        return `hsl(${(1 - value) * 60}, 70%, 50%)`; // Red-Yellow spectrum (inverted)
      case 'total':
        return `hsl(${180 * value}, 70%, 50%)`; // Cyan spectrum
      default:
        return '#6b7280';
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
            {history.length > 0 && (
              <>
                {renderScoreDimension('Empathy 共感', history[0].scores.empathy, currentWeights.empathy, 'empathy')}
                {renderScoreDimension('Coherence 一貫性', history[0].scores.coherence, currentWeights.coherence, 'coherence')}
                {renderScoreDimension('Dissonance 不協和', history[0].scores.dissonance, currentWeights.dissonance, 'dissonance')}

                <div className="total-score">
                  {renderScoreDimension('Weighted Total', history[0].scores.weightedTotal, 1.0, 'total')}
                </div>
              </>
            )}
          </div>

          <div className="weight-evolution">
            <div className="section-title">Weight Evolution</div>
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
          background: #1f2937;
          border-radius: 12px;
          padding: 24px;
          border: 1px solid #374151;
        }

        .dpd-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .header-title h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #f9fafb;
        }

        .subtitle {
          color: #9ca3af;
          font-size: 12px;
        }

        .expand-toggle {
          background: #374151;
          border: none;
          border-radius: 4px;
          padding: 4px 8px;
          color: #f9fafb;
          cursor: pointer;
          font-size: 14px;
        }

        .expand-toggle:hover {
          background: #4b5563;
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
          height: 8px;
          background: #374151;
          border-radius: 4px;
          overflow: hidden;
        }

        .dimension-fill {
          height: 100%;
          transition: width 0.3s ease;
        }

        .weight-evolution {
          background: #374151;
          padding: 16px;
          border-radius: 8px;
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