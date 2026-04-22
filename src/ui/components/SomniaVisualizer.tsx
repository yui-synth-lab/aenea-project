import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Zap, Heart, Moon, Sun, Wind } from 'lucide-react';
import '../styles/somnia.css';

interface SomniaState {
  timestamp: number;
  mode: 'awake' | 'dream' | 'flow';
  somatic: {
    lambda: number;
    phi: number;
  };
  affective: {
    theta: number;
    psi: number;
    xi: number;
  };
}

interface SomniaVisualizerProps {
  somniaState?: SomniaState;
}

export const SomniaVisualizer: React.FC<SomniaVisualizerProps> = ({ somniaState }) => {
  if (!somniaState) {
    return (
      <div className="dashboard-card somnia-visualizer empty">
        <Activity size={24} opacity={0.5} />
        <span>Waiting for SOMNIA state...</span>
      </div>
    );
  }

  const { mode, somatic, affective } = somniaState;
  const { lambda, phi } = somatic || { lambda: 0, phi: 0 };
  const { theta, psi, xi } = affective || { theta: 0, psi: 0, xi: 0 };

  const getModeIcon = () => {
    switch (mode) {
      case 'awake': return <Sun size={20} className="text-yellow-400" />;
      case 'dream': return <Moon size={20} className="text-indigo-400" />;
      case 'flow': return <Wind size={20} className="text-cyan-400" />;
    }
  };

  const getModeColor = () => {
    switch (mode) {
      case 'awake': return 'var(--cyber-accent)';
      case 'dream': return '#818cf8';
      case 'flow': return '#22d3ee';
    }
  };

  return (
    <div className="dashboard-card somnia-visualizer">
      <div className="somnia-header">
        <h3><Heart size={18} style={{ display: 'inline', marginRight: '8px' }} />SOMNIA Engine</h3>
        <div className={`somnia-mode-badge ${mode}`}>
          {getModeIcon()}
          <span>{mode.toUpperCase()}</span>
        </div>
      </div>

      <div className="somnia-metrics">
        {/* Somatic Layer */}
        <div className="metric-group somatic">
          <h4>Somatic Layer (L1)</h4>
          <div className="metric-row">
            <span className="metric-label">Affective (λ)</span>
            <div className="metric-bar-container">
              <motion.div 
                className="metric-bar" 
                initial={{ width: 0 }}
                animate={{ width: `${((lambda + 1) / 2) * 100}%` }}
                style={{ backgroundColor: lambda >= 0 ? '#10b981' : '#ef4444' }}
              />
            </div>
            <span className="metric-value">{lambda >= 0 ? '+' : ''}{lambda.toFixed(2)}</span>
          </div>
          <div className="metric-row">
            <span className="metric-label">Energy (φ)</span>
            <div className="metric-bar-container">
              <motion.div 
                className="metric-bar"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Math.max(0, phi))}%` }}
                style={{ backgroundColor: '#f59e0b' }}
              />
            </div>
            <span className="metric-value">{phi.toFixed(1)}</span>
          </div>
        </div>

        {/* Affective Layer */}
        <div className="metric-group affective">
          <h4>Affective Core (L2)</h4>
          <div className="metric-row">
            <span className="metric-label">Temporal Anchor (θ)</span>
            <div className="metric-bar-container">
              <motion.div 
                className="metric-bar"
                initial={{ width: 0 }}
                animate={{ width: `${theta * 100}%` }}
                style={{ backgroundColor: '#3b82f6' }}
              />
            </div>
            <span className="metric-value">{theta.toFixed(2)}</span>
          </div>
          <div className="metric-row">
            <span className="metric-label">Mental Energy (ψ)</span>
            <div className="metric-bar-container">
              <motion.div 
                className="metric-bar"
                initial={{ width: 0 }}
                animate={{ width: `${psi * 100}%` }}
                style={{ backgroundColor: '#8b5cf6' }}
              />
            </div>
            <span className="metric-value">{psi.toFixed(2)}</span>
          </div>
          <div className="metric-row">
            <span className="metric-label">Dissonance (ξ)</span>
            <div className="metric-bar-container">
              <motion.div 
                className="metric-bar"
                initial={{ width: 0 }}
                animate={{ width: `${xi * 100}%` }}
                style={{ backgroundColor: '#ec4899' }}
              />
            </div>
            <span className="metric-value">{xi.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SomniaVisualizer;
