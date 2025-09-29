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
  const [currentScores, setCurrentScores] = useState<DPDScores>({
    empathy: 0.6,
    coherence: 0.7,
    dissonance: 0.2,
    weightedTotal: 0.55
  });

  const [currentWeights, setCurrentWeights] = useState<DPDWeights>({
    empathy: 0.4,
    coherence: 0.4,
    dissonance: 0.2,
    timestamp: Date.now()
  });

  const [history, setHistory] = useState<DPDHistory[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    // DPDスコアの定期更新
    const updateInterval = setInterval(() => {
      // スコアの微調整
      const newScores: DPDScores = {
        empathy: Math.max(0, Math.min(1, currentScores.empathy + (Math.random() - 0.5) * 0.05)),
        coherence: Math.max(0, Math.min(1, currentScores.coherence + (Math.random() - 0.5) * 0.03)),
        dissonance: Math.max(0, Math.min(1, currentScores.dissonance + (Math.random() - 0.5) * 0.08)),
        weightedTotal: 0
      };

      // 重み付け合計の計算
      newScores.weightedTotal =
        newScores.empathy * currentWeights.empathy +
        newScores.coherence * currentWeights.coherence +
        (1 - newScores.dissonance) * currentWeights.dissonance;

      setCurrentScores(newScores);

      // 履歴の更新（10%の確率で）
      if (Math.random() < 0.1) {
        const newHistoryEntry: DPDHistory = {
          timestamp: Date.now(),
          scores: { ...newScores },
          context: generateRandomContext()
        };

        setHistory(prev => [newHistoryEntry, ...prev].slice(0, 20));
      }

      // 重みの調整（5%の確率で）
      if (Math.random() < 0.05) {
        const adjustment = (Math.random() - 0.5) * 0.1;
        const weightToAdjust = ['empathy', 'coherence', 'dissonance'][Math.floor(Math.random() * 3)];

        setCurrentWeights(prev => {
          const newWeights = { ...prev };
          newWeights[weightToAdjust as keyof Omit<DPDWeights, 'timestamp'>] =
            Math.max(0.1, Math.min(0.8, newWeights[weightToAdjust as keyof Omit<DPDWeights, 'timestamp'>] + adjustment));
          newWeights.timestamp = Date.now();

          // 正規化
          const total = newWeights.empathy + newWeights.coherence + newWeights.dissonance;
          newWeights.empathy /= total;
          newWeights.coherence /= total;
          newWeights.dissonance /= total;

          return newWeights;
        });
      }
    }, 3000);

    return () => clearInterval(updateInterval);
  }, [currentScores, currentWeights]);

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
            {renderScoreDimension('Empathy 共感', currentScores.empathy, currentWeights.empathy, 'empathy')}
            {renderScoreDimension('Coherence 一貫性', currentScores.coherence, currentWeights.coherence, 'coherence')}
            {renderScoreDimension('Dissonance 不協和', currentScores.dissonance, currentWeights.dissonance, 'dissonance')}

            <div className="total-score">
              {renderScoreDimension('Weighted Total', currentScores.weightedTotal, 1.0, 'total')}
            </div>
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
              <div className="section-title">Recent History</div>
              <div className="history-list">
                {history.slice(0, 5).map((entry, index) => (
                  <div key={entry.timestamp} className="history-item">
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

          <div className="dpd-insights">
            <div className="section-title">Current Assessment</div>
            <div className="insights-list">
              {currentScores.empathy > 0.7 && (
                <div className="insight empathy">High empathetic response detected</div>
              )}
              {currentScores.coherence > 0.8 && (
                <div className="insight coherence">Strong logical coherence maintained</div>
              )}
              {currentScores.dissonance > 0.6 && (
                <div className="insight dissonance">Significant ethical tension present</div>
              )}
              {currentScores.weightedTotal > 0.7 && (
                <div className="insight total">System operating within optimal parameters</div>
              )}
              {currentScores.weightedTotal < 0.3 && (
                <div className="insight warning">System values may need recalibration</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DPDScoreDisplay;