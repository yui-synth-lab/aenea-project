/**
 * Growth Modal Component
 * 意識成長レポート
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, X, Brain, Heart, Lightbulb, Moon as MoonIcon } from 'lucide-react';
import { DPDScoreDisplay } from './DPDScoreDisplay.js';

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
  dreamPatterns?: Array<{
    pattern?: string;
    emotional_tone?: string;
    emotionalTone?: string;
    created_at?: number;
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
      <AnimatePresence>
        <motion.div
          className="growth-modal-overlay"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="growth-modal-container"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
          <div className="growth-modal-header">
            <h2><TrendingUp size={28} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />意識成長レポート</h2>
            <motion.button
              className="close-button"
              onClick={onClose}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              <X size={20} />
            </motion.button>
          </div>

          {loading || !growthData ? (
            <div className="loading-state">Loading growth data...</div>
          ) : (
            <div className="growth-content">
              {/* Overview */}
              <motion.div
                className="growth-card overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h3><Brain size={18} style={{ display: 'inline', marginRight: '8px' }} />Overview</h3>
                <p><strong>Last Update:</strong> {growthData.overview?.lastUpdate ?
                  new Date(growthData.overview.lastUpdate).toLocaleString() : 'Never'}</p>
                <p><strong>Version:</strong> {growthData.overview?.version || 'N/A'}</p>
              </motion.div>

              {/* Personality Traits */}
              <motion.div
                className="growth-card personality"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <h3><Heart size={18} style={{ display: 'inline', marginRight: '8px' }} />Personality Traits</h3>
                {growthData.personalityEvolution?.currentTraits ? Object.entries(growthData.personalityEvolution.currentTraits).map(([trait, value]) => (
                  <p key={trait}>
                    <strong>{trait.replace(/([A-Z])/g, ' $1').trim()}:</strong> {formatValue(value)}
                  </p>
                )) : <p>No personality data available</p>}
              </motion.div>

              {/* DPD Evolution - Using DPDScoreDisplay Component */}
              <motion.div
                className="growth-card dpd-full-display wide"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <DPDScoreDisplay />
              </motion.div>

              {/* Growth Metrics */}
              <motion.div
                className="growth-card metrics"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <h3><Lightbulb size={18} style={{ display: 'inline', marginRight: '8px' }} />Growth Metrics</h3>
                {growthData.growthMetrics ? Object.entries(growthData.growthMetrics).map(([metric, value]) => (
                  <p key={metric}>
                    <strong>{metric.replace(/([A-Z])/g, ' $1').trim()}:</strong> {formatValue(value)}
                  </p>
                )) : <p>No growth metrics available</p>}
              </motion.div>

              {/* Significant Thoughts */}
              <motion.div
                className="growth-card thoughts wide"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h3><Brain size={18} style={{ display: 'inline', marginRight: '8px' }} />Significant Thoughts</h3>
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
              </motion.div>

              {/* Core Beliefs */}
              <motion.div
                className="growth-card beliefs wide"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                <h3><Heart size={18} style={{ display: 'inline', marginRight: '8px' }} />Core Beliefs (核心的信念)</h3>
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
              </motion.div>

              {/* Dream Patterns */}
              <motion.div
                className="growth-card dreams wide"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h3><MoonIcon size={18} style={{ display: 'inline', marginRight: '8px' }} />Dream Patterns (夢パターン)</h3>
                <div className="scrollable-list">
                  {growthData.dreamPatterns && growthData.dreamPatterns.length > 0 ?
                    growthData.dreamPatterns.slice(0, 15).map((dream, index) => (
                      <div key={index} className="list-item dreams-item">
                        <p className="item-content dream-pattern">
                          {dream.pattern || 'No pattern'}
                        </p>
                        <div className="item-meta">
                          <span className="emotional-tone">
                            {dream.emotional_tone || dream.emotionalTone || 'Unknown tone'}
                          </span>
                          {dream.created_at && <span>📅 {new Date(dream.created_at).toLocaleString()}</span>}
                        </div>
                      </div>
                    )) :
                    <p className="no-data">No dreams recorded yet. Enter sleep mode to generate dream patterns.</p>}
                </div>
              </motion.div>

              {/* Unresolved Ideas */}
              <motion.div
                className="growth-card ideas wide"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
              >
                <h3><Lightbulb size={18} style={{ display: 'inline', marginRight: '8px' }} />Unresolved Ideas</h3>
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
              </motion.div>
            </div>
          )}
          </motion.div>
        </motion.div>
      </AnimatePresence>

      <style>{`
        .growth-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 16px;
        }

        .growth-modal-container {
          background: var(--cyber-bg-secondary);
          padding: 32px;
          max-width: 90vw;
          max-height: 90vh;
          overflow: auto;
          border: 2px solid var(--cyber-neon-magenta);
          min-width: min(800px, 90vw);
          clip-path: polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px);
          box-shadow: 0 0 30px var(--cyber-glow-magenta), 0 25px 50px -12px rgba(0, 0, 0, 0.8);
          position: relative;
        }

        .growth-modal-container::before,
        .growth-modal-container::after {
          content: '';
          position: absolute;
          width: 12px;
          height: 12px;
          background: var(--cyber-neon-magenta);
          box-shadow: 0 0 10px var(--cyber-glow-magenta);
        }

        .growth-modal-container::before {
          top: 0;
          left: 0;
        }

        .growth-modal-container::after {
          bottom: 0;
          right: 0;
        }

        .growth-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 2px solid var(--cyber-border);
        }

        .growth-modal-header h2 {
          font-size: 24px;
          font-weight: 700;
          margin: 0;
          color: var(--cyber-neon-magenta);
          text-transform: uppercase;
          letter-spacing: 2px;
          text-shadow: 0 0 10px var(--cyber-glow-magenta);
          font-family: 'Courier New', 'Consolas', monospace;
        }

        .close-button {
          background: var(--cyber-bg-tertiary);
          border: 2px solid var(--cyber-neon-pink);
          padding: 8px 16px;
          color: var(--cyber-neon-pink);
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          text-transform: uppercase;
          letter-spacing: 1px;
          clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px);
          box-shadow: 0 0 8px rgba(255, 20, 147, 0.3);
          font-family: 'Courier New', 'Consolas', monospace;
        }

        .close-button:hover {
          box-shadow: 0 0 15px rgba(255, 20, 147, 0.5);
          transform: translateY(-2px);
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
          background: var(--cyber-bg-tertiary);
          padding: 20px;
          border: 2px solid var(--cyber-border);
          clip-path: polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px);
          box-shadow: inset 0 0 20px rgba(0, 255, 255, 0.05);
          position: relative;
        }

        .growth-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 8px;
          height: 8px;
          background: var(--cyber-neon-cyan);
          box-shadow: 0 0 8px var(--cyber-glow-cyan);
        }

        .growth-card::after {
          content: '';
          position: absolute;
          bottom: 0;
          right: 0;
          width: 8px;
          height: 8px;
          background: var(--cyber-neon-cyan);
          box-shadow: 0 0 8px var(--cyber-glow-cyan);
        }

        .growth-card.wide {
          grid-column: span 2;
        }

        .growth-card h3 {
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          font-family: 'Courier New', 'Consolas', monospace;
          border-bottom: 1px solid var(--cyber-border);
          padding-bottom: 8px;
        }

        .growth-card.overview h3 { color: var(--cyber-neon-cyan); text-shadow: 0 0 8px var(--cyber-glow-cyan); }
        .growth-card.personality h3 { color: var(--cyber-neon-lime); text-shadow: 0 0 8px var(--cyber-glow-lime); }
        .growth-card.dpd h3 { color: var(--cyber-neon-yellow); text-shadow: 0 0 8px rgba(255, 255, 0, 0.3); }
        .growth-card.metrics h3 { color: var(--cyber-neon-magenta); text-shadow: 0 0 8px var(--cyber-glow-magenta); }
        .growth-card.thoughts h3 { color: var(--cyber-neon-pink); text-shadow: 0 0 8px rgba(255, 20, 147, 0.3); }
        .growth-card.beliefs h3 { color: var(--cyber-neon-magenta); text-shadow: 0 0 8px var(--cyber-glow-magenta); }
        .growth-card.dreams h3 { color: var(--cyber-neon-pink); text-shadow: 0 0 8px rgba(255, 20, 147, 0.3); }
        .growth-card.ideas h3 { color: var(--cyber-neon-cyan); text-shadow: 0 0 8px var(--cyber-glow-cyan); }

        .growth-card p {
          color: var(--cyber-text-primary);
          line-height: 1.6;
          margin-bottom: 8px;
          font-family: 'Courier New', 'Consolas', monospace;
          font-size: 13px;
        }

        .dpd-full-display {
          padding: 0;
          background: transparent;
          border: none;
          box-shadow: none;
          clip-path: none;
        }

        .dpd-full-display::before,
        .dpd-full-display::after {
          display: none;
        }

        .scrollable-list {
          max-height: 300px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .list-item {
          background: var(--cyber-bg-secondary);
          padding: 12px;
          border: 1px solid var(--cyber-border);
          clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
          box-shadow: inset 0 0 10px rgba(0, 255, 255, 0.03);
          position: relative;
        }

        .thoughts-item { border-left: 3px solid var(--cyber-neon-pink); }
        .beliefs-item { border-left: 3px solid var(--cyber-neon-magenta); }
        .dreams-item { border-left: 3px solid var(--cyber-neon-pink); }
        .ideas-item { border-left: 3px solid var(--cyber-neon-cyan); }

        .item-content {
          color: var(--cyber-text-primary);
          margin-bottom: 8px;
          line-height: 1.4;
          font-family: 'Courier New', 'Consolas', monospace;
          font-size: 13px;
        }

        .beliefs-item .item-content {
          font-weight: 700;
          color: var(--cyber-neon-magenta);
        }

        .dreams-item .item-content {
          font-style: italic;
          color: var(--cyber-neon-pink);
        }

        .emotional-tone {
          color: var(--cyber-neon-pink);
          font-weight: 600;
        }

        .item-meta {
          font-size: 11px;
          color: var(--cyber-text-secondary);
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          font-family: 'Courier New', 'Consolas', monospace;
        }

        .no-data {
          color: var(--cyber-text-dim);
          font-family: 'Courier New', 'Consolas', monospace;
          text-align: center;
          padding: 40px 20px;
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
