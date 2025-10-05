/**
 * Growth Modal Component
 * 意識成長レポート
 */

import React, { useState, useEffect } from 'react';

interface GrowthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GrowthData {
  overview?: {
    lastUpdate?: number;
    version?: string;
  };
  personalityEvolution?: {
    currentTraits?: Record<string, any>;
  };
  dpdEvolution?: {
    currentWeights?: {
      empathy: number;
      coherence: number;
      dissonance: number;
    };
  };
  growthMetrics?: Record<string, any>;
  significantThoughts?: Array<{
    thought_content?: string;
    content?: string;
    thought?: string;
    confidence?: number;
    timestamp?: number;
  }>;
  beliefEvolution?: {
    currentBeliefs?: Array<{
      belief_content?: string;
      belief?: string;
      content?: string;
      strength?: number;
      confidence?: number;
      reinforcement_count?: number;
      last_reinforced?: number;
    }>;
  };
  unresolvedIdeas?: Array<{
    question?: string;
    content?: string;
    category?: string;
    firstAppeared?: number;
  }>;
}

const formatValue = (value: any): string => {
  if (value === null || value === undefined) return 'None';
  if (typeof value === 'number') {
    if (value >= 0 && value <= 1) return `${(value * 100).toFixed(1)}%`;
    return value.toFixed(2);
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    if (value.length === 0) return 'None';
    return `${value.length} items`;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) return 'None';
    return `{${entries.length} properties}`;
  }
  return String(value);
};

export const GrowthModal: React.FC<GrowthModalProps> = ({ isOpen, onClose }) => {
  const [growthData, setGrowthData] = useState<GrowthData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchGrowthData();
    }
  }, [isOpen]);

  const fetchGrowthData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/growth/full');
      const data = await response.json();
      setGrowthData(data);
    } catch (error) {
      console.error('Failed to fetch growth data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="growth-modal-overlay" onClick={onClose}>
        <div className="growth-modal-container" onClick={(e) => e.stopPropagation()}>
          <div className="growth-modal-header">
            <h2>意識成長レポート</h2>
            <button className="close-button" onClick={onClose}>
              Close
            </button>
          </div>

          {loading || !growthData ? (
            <div className="loading-state">Loading growth data...</div>
          ) : (
            <div className="growth-content">
              {/* Overview */}
              <div className="growth-card overview">
                <h3>Overview</h3>
                <p><strong>Last Update:</strong> {growthData.overview?.lastUpdate ?
                  new Date(growthData.overview.lastUpdate).toLocaleString() : 'Never'}</p>
                <p><strong>Version:</strong> {growthData.overview?.version || 'N/A'}</p>
              </div>

              {/* Personality Traits */}
              <div className="growth-card personality">
                <h3>Personality Traits</h3>
                {growthData.personalityEvolution?.currentTraits ? Object.entries(growthData.personalityEvolution.currentTraits).map(([trait, value]) => (
                  <p key={trait}>
                    <strong>{trait.replace(/([A-Z])/g, ' $1').trim()}:</strong> {formatValue(value)}
                  </p>
                )) : <p>No personality data available</p>}
              </div>

              {/* DPD Evolution with Chart */}
              <div className="growth-card dpd wide">
                <h3>DPD Weight Evolution</h3>
                {growthData.dpdEvolution?.currentWeights ? (
                  <>
                    <div className="dpd-current-values">
                      <p><strong>Empathy:</strong> {(growthData.dpdEvolution.currentWeights.empathy * 100).toFixed(1)}%</p>
                      <p><strong>Coherence:</strong> {(growthData.dpdEvolution.currentWeights.coherence * 100).toFixed(1)}%</p>
                      <p><strong>Dissonance:</strong> {(growthData.dpdEvolution.currentWeights.dissonance * 100).toFixed(1)}%</p>
                    </div>
                    {(growthData.dpdEvolution as any).history && (growthData.dpdEvolution as any).history.length > 1 && (() => {
                      const reversedHistory = [...(growthData.dpdEvolution as any).history].reverse();
                      const historyLength = reversedHistory.length;

                      return (
                        <div className="dpd-evolution-chart">
                          <svg width="100%" height="90%" viewBox="0 0 100 90" preserveAspectRatio="none">
                            <polygon fill="#f59e0b" fillOpacity="0.7" stroke="#f59e0b" strokeWidth="0.5"
                              points={
                                reversedHistory.map((entry: any, index: number) => {
                                  const x = (index / (historyLength - 1)) * 100;
                                  return `${x},90`;
                                }).join(' ') + ' ' +
                                reversedHistory.map((entry: any, index: number) => {
                                  const x = (index / (historyLength - 1)) * 100;
                                  const y = 90 - (entry.dissonance * 90);
                                  return `${x},${y}`;
                                }).reverse().join(' ')
                              }
                            />
                            <polygon fill="#3b82f6" fillOpacity="0.7" stroke="#3b82f6" strokeWidth="0.5"
                              points={
                                reversedHistory.map((entry: any, index: number) => {
                                  const x = (index / (historyLength - 1)) * 100;
                                  const y = 90 - (entry.dissonance * 90);
                                  return `${x},${y}`;
                                }).join(' ') + ' ' +
                                reversedHistory.map((entry: any, index: number) => {
                                  const x = (index / (historyLength - 1)) * 100;
                                  const y = 90 - (entry.dissonance * 90) - (entry.coherence * 90);
                                  return `${x},${y}`;
                                }).reverse().join(' ')
                              }
                            />
                            <polygon fill="#10b981" fillOpacity="0.7" stroke="#10b981" strokeWidth="0.5"
                              points={
                                reversedHistory.map((entry: any, index: number) => {
                                  const x = (index / (historyLength - 1)) * 100;
                                  const y = 90 - (entry.dissonance * 90) - (entry.coherence * 90);
                                  return `${x},${y}`;
                                }).join(' ') + ' ' +
                                reversedHistory.map((entry: any, index: number) => {
                                  const x = (index / (historyLength - 1)) * 100;
                                  return `${x},0`;
                                }).reverse().join(' ')
                              }
                            />
                          </svg>
                          <div className="system-clock-labels">
                            {reversedHistory.filter((_: any, i: number) => i % Math.max(1, Math.floor(historyLength / 5)) === 0 || i === historyLength - 1).map((entry: any) => {
                              const actualIndex = reversedHistory.indexOf(entry);
                              const x = (actualIndex / (historyLength - 1)) * 100;
                              return (
                                <span key={actualIndex} style={{ left: `${x}%` }}>
                                  {entry.id || actualIndex}
                                </span>
                              );
                            })}
                          </div>
                          <div className="chart-legend">
                            <div className="legend-item"><div className="legend-color empathy"></div><span>Empathy</span></div>
                            <div className="legend-item"><div className="legend-color coherence"></div><span>Coherence</span></div>
                            <div className="legend-item"><div className="legend-color dissonance"></div><span>Dissonance</span></div>
                          </div>
                        </div>
                      );
                    })()}
                  </>
                ) : <p>No DPD evolution data available</p>}
              </div>

              {/* Growth Metrics */}
              <div className="growth-card metrics">
                <h3>Growth Metrics</h3>
                {growthData.growthMetrics ? Object.entries(growthData.growthMetrics).map(([metric, value]) => (
                  <p key={metric}>
                    <strong>{metric.replace(/([A-Z])/g, ' $1').trim()}:</strong> {formatValue(value)}
                  </p>
                )) : <p>No growth metrics available</p>}
              </div>

              {/* Significant Thoughts */}
              <div className="growth-card thoughts wide">
                <h3>Significant Thoughts</h3>
                <div className="scrollable-list">
                  {growthData.significantThoughts && growthData.significantThoughts.length > 0 ?
                    growthData.significantThoughts.slice(0, 10).map((thought, index) => (
                      <div key={index} className="list-item thoughts-item">
                        <p className="item-content">
                          {thought.thought_content || thought.content || thought.thought || 'No content'}
                        </p>
                        <div className="item-meta">
                          Confidence: {((thought.confidence || 0) * 100).toFixed(1)}% |
                          {thought.timestamp ? ` ${new Date(thought.timestamp).toLocaleString()}` : ' No timestamp'}
                        </div>
                      </div>
                    )) :
                    <p className="no-data">No significant thoughts recorded yet</p>}
                </div>
              </div>

              {/* Core Beliefs */}
              <div className="growth-card beliefs wide">
                <h3>Core Beliefs (核心的信念)</h3>
                <div className="scrollable-list">
                  {growthData.beliefEvolution?.currentBeliefs && growthData.beliefEvolution.currentBeliefs.length > 0 ?
                    growthData.beliefEvolution.currentBeliefs.slice(0, 10).map((belief, index) => (
                      <div key={index} className="list-item beliefs-item">
                        <p className="item-content">
                          {belief.belief_content || belief.belief || belief.content || 'No content'}
                        </p>
                        <div className="item-meta">
                          <span>💪 Strength: {belief.strength || 0}</span>
                          <span>🎯 Confidence: {((belief.confidence || 0) * 100).toFixed(0)}%</span>
                          <span>🔄 Reinforced: {belief.reinforcement_count || 0} times</span>
                          {belief.last_reinforced && <span>📅 {new Date(belief.last_reinforced).toLocaleString()}</span>}
                        </div>
                      </div>
                    )) :
                    <p className="no-data">No core beliefs formed yet. Continue consciousness cycles to develop beliefs.</p>}
                </div>
              </div>

              {/* Unresolved Ideas */}
              <div className="growth-card ideas wide">
                <h3>Unresolved Ideas</h3>
                <div className="scrollable-list">
                  {growthData.unresolvedIdeas && growthData.unresolvedIdeas.length > 0 ?
                    growthData.unresolvedIdeas.slice(0, 10).map((idea, index) => (
                      <div key={index} className="list-item ideas-item">
                        <p className="item-content">
                          {idea.question || idea.content || 'No content'}
                        </p>
                        <div className="item-meta">
                          Category: {idea.category || 'Unknown'} |
                          {idea.firstAppeared ? ` First appeared: ${new Date(idea.firstAppeared).toLocaleString()}` : ' No timestamp'}
                        </div>
                      </div>
                    )) :
                    <p className="no-data">No unresolved ideas recorded yet</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .growth-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 16px;
        }

        .growth-modal-container {
          background: #111827;
          border-radius: 16px;
          padding: 32px;
          max-width: 90vw;
          max-height: 90vh;
          overflow: auto;
          border: 1px solid #374151;
          min-width: min(800px, 90vw);
        }

        .growth-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .growth-modal-header h2 {
          font-size: 28px;
          font-weight: 700;
          margin: 0;
          color: #f9fafb;
        }

        .close-button {
          background: #6b7280;
          border: none;
          border-radius: 8px;
          padding: 8px 16px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .close-button:hover {
          background: #4b5563;
        }

        .loading-state {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 400px;
          color: #9ca3af;
        }

        .growth-content {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 24px;
        }

        .growth-card {
          background: #1f2937;
          border-radius: 12px;
          padding: 20px;
          border: 1px solid #374151;
        }

        .growth-card.wide {
          grid-column: span 2;
        }

        .growth-card h3 {
          margin: 0 0 16px 0;
          font-size: 18px;
          font-weight: 600;
        }

        .growth-card.overview h3 { color: #60a5fa; }
        .growth-card.personality h3 { color: #10b981; }
        .growth-card.dpd h3 { color: #f59e0b; }
        .growth-card.metrics h3 { color: #8b5cf6; }
        .growth-card.thoughts h3 { color: #ef4444; }
        .growth-card.beliefs h3 { color: #a78bfa; }
        .growth-card.ideas h3 { color: #06b6d4; }

        .growth-card p {
          color: #e5e7eb;
          line-height: 1.6;
          margin-bottom: 8px;
        }

        .dpd-current-values {
          margin-bottom: 16px;
        }

        .dpd-evolution-chart {
          background: #374151;
          padding: 16px;
          padding-bottom: 32px;
          border-radius: 8px;
          height: 220px;
          position: relative;
        }

        .dpd-evolution-chart svg {
          width: 100%;
          height: calc(100% - 20px);
        }

        .system-clock-labels {
          position: absolute;
          bottom: 12px;
          left: 16px;
          right: 16px;
          height: 20px;
          display: flex;
          justify-content: space-between;
        }

        .system-clock-labels span {
          position: absolute;
          font-size: 10px;
          color: #9ca3af;
          white-space: nowrap;
          transform: translateX(-50%);
        }

        .system-clock-labels span:first-child {
          transform: translateX(0);
        }

        .system-clock-labels span:last-child {
          transform: translateX(-100%);
        }

        .chart-legend {
          position: absolute;
          top: 8px;
          right: 8px;
          display: flex;
          gap: 12px;
          font-size: 12px;
          background: rgba(31, 41, 55, 0.8);
          padding: 4px 8px;
          border-radius: 4px;
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

        .scrollable-list {
          max-height: 300px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .list-item {
          background: #374151;
          padding: 12px;
          border-radius: 8px;
        }

        .thoughts-item { border-left: 4px solid #ef4444; }
        .beliefs-item { border-left: 4px solid #a78bfa; }
        .ideas-item { border-left: 4px solid #06b6d4; }

        .item-content {
          color: #e5e7eb;
          margin-bottom: 8px;
          line-height: 1.4;
        }

        .beliefs-item .item-content {
          font-weight: 600;
        }

        .item-meta {
          font-size: 12px;
          color: #9ca3af;
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .no-data {
          color: #9ca3af;
        }

        @media (max-width: 1024px) {
          .growth-content {
            grid-template-columns: 1fr;
          }

          .growth-card.wide {
            grid-column: span 1;
          }
        }

        @media (max-width: 640px) {
          .growth-modal-container {
            padding: 20px;
            min-width: unset;
          }

          .growth-modal-header h2 {
            font-size: 20px;
          }

          .growth-card {
            padding: 16px;
          }
        }
      `}</style>
    </>
  );
};

export default GrowthModal;
