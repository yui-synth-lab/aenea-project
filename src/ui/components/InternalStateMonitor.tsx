/**
 * Internal State Monitor Component
 * 内部状態監視コンポーネント
 */

import React, { useState, useEffect } from 'react';

interface InternalState {
  consciousness: {
    depth: number;
    complexity: number;
    selfAwareness: number;
  };
  emotional: {
    valence: number;
    arousal: number;
    curiosity: number;
  };
  cognitive: {
    focus: number;
    processing: number;
    memory: number;
  };
  growth: {
    maturity: number;
    adaptability: number;
    wisdom: number;
  };
}

export const InternalStateMonitor: React.FC = () => {
  const [internalState, setInternalState] = useState<InternalState>({
    consciousness: { depth: 0.3, complexity: 0.2, selfAwareness: 0.4 },
    emotional: { valence: 0.1, arousal: 0.3, curiosity: 0.8 },
    cognitive: { focus: 0.6, processing: 0.4, memory: 0.5 },
    growth: { maturity: 0.2, adaptability: 0.7, wisdom: 0.1 }
  });

  const [isExpanded, setIsExpanded] = useState(true);

  const renderStateCategory = (
    title: string,
    states: Record<string, number>,
    color: string
  ) => (
    <div className="state-category">
      <h4 className="category-title">{title}</h4>
      <div className="state-items">
        {Object.entries(states).map(([key, value]) => (
          <div key={key} className="state-item">
            <div className="state-label">
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </div>
            <div className="state-bar-container">
              <div className="state-bar">
                <div
                  className="state-fill"
                  style={{
                    width: `${Math.abs(value) * 100}%`,
                    backgroundColor: value >= 0 ? color : '#ef4444'
                  }}
                />
              </div>
              <div className="state-value">
                {value.toFixed(3)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const getOverallStateColor = () => {
    const avg = (
      (internalState.consciousness.depth +
       internalState.consciousness.complexity +
       internalState.consciousness.selfAwareness +
       Math.max(0, internalState.emotional.valence) +
       internalState.emotional.curiosity +
       internalState.cognitive.focus +
       internalState.growth.maturity) / 7
    );

    if (avg > 0.7) return '#10b981'; // green
    if (avg > 0.5) return '#f59e0b'; // amber
    if (avg > 0.3) return '#ef4444'; // red
    return '#6b7280'; // gray
  };

  return (
    <div className="internal-state-monitor">
      <div className="monitor-header">
        <div className="header-title">
          <div
            className="state-indicator"
            style={{ backgroundColor: getOverallStateColor() }}
          />
          <h3>Internal State</h3>
          <span className="subtitle">内部状態</span>
        </div>
        <button
          className="expand-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {isExpanded && (
        <div className="monitor-content">
          {renderStateCategory(
            'Consciousness 意識',
            internalState.consciousness,
            '#8b5cf6'
          )}

          {renderStateCategory(
            'Emotional 感情',
            internalState.emotional,
            '#06b6d4'
          )}

          {renderStateCategory(
            'Cognitive 認知',
            internalState.cognitive,
            '#10b981'
          )}

          {renderStateCategory(
            'Growth 成長',
            internalState.growth,
            '#f59e0b'
          )}

          <div className="state-summary">
            <div className="summary-title">System Health</div>
            <div className="health-indicators">
              <div className={`health-item ${
                internalState.consciousness.depth > 0.5 ? 'healthy' : 'concern'
              }`}>
                <span>Depth</span>
                <span>{internalState.consciousness.depth > 0.5 ? '✓' : '⚠'}</span>
              </div>
              <div className={`health-item ${
                internalState.emotional.curiosity > 0.6 ? 'healthy' : 'concern'
              }`}>
                <span>Curiosity</span>
                <span>{internalState.emotional.curiosity > 0.6 ? '✓' : '⚠'}</span>
              </div>
              <div className={`health-item ${
                internalState.cognitive.focus > 0.4 ? 'healthy' : 'concern'
              }`}>
                <span>Focus</span>
                <span>{internalState.cognitive.focus > 0.4 ? '✓' : '⚠'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InternalStateMonitor;