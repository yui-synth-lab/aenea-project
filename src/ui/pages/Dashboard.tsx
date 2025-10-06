/**
 * Dashboard Component
 * ダッシュボードコンポーネント
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Zap, Activity, Sparkles, MessageCircle, TrendingUp, Moon, Play, Pause, Square, AlertCircle,
  // Agent icons
  Lightbulb, Heart, Workflow, Eye, Palette, Target, Feather, Shield, FileText, Combine
} from 'lucide-react';
import { DialogueModal } from '../components/DialogueModal.js';
import { GrowthModal } from '../components/GrowthModal.js';
import ParticleBackground from '../components/ParticleBackground.js';

interface DashboardProps {
  systemStatus: 'awakening' | 'active' | 'resting' | 'error';
}

interface SystemStats {
  thoughtCycles: number;
  questionsGenerated: number;
  energyLevel: number;
}

interface ConsciousnessState {
  isRunning: boolean;
  isPaused: boolean;
  isProcessingCycle?: boolean;
  status: string;
}

interface ActivityLogItem {
  id: string;
  timestamp: number;
  type: 'agent_thought' | 'trigger_generated' | 'system_event';
  agent?: string;
  message: string;
  details?: any;
}

interface StageProgress {
  stage: string;
  completed: boolean;
  timestamp?: number;
}

export const Dashboard: React.FC<DashboardProps> = ({ systemStatus }) => {
  const [stats, setStats] = useState<SystemStats>({
    thoughtCycles: 0,
    questionsGenerated: 0,
    energyLevel: 100,

  });

  const [currentThought, setCurrentThought] = useState<string>('');
  const [dpdScores, setDpdScores] = useState({
    empathy: 0.33,
    coherence: 0.33,
    dissonance: 0.34
  });
  const [activityLog, setActivityLog] = useState<ActivityLogItem[]>([]);
  const [consciousnessState, setConsciousnessState] = useState<ConsciousnessState>({
    isRunning: false,
    isPaused: false,
    status: 'stopped'
  });
  const [manualQuestion, setManualQuestion] = useState<string>('');
  const [queuedTrigger, setQueuedTrigger] = useState<string | null>(null);
  const [showTriggerPopup, setShowTriggerPopup] = useState<boolean>(false);
  const [isDialogueModalOpen, setIsDialogueModalOpen] = useState(false);
  const [isGrowthModalOpen, setIsGrowthModalOpen] = useState(false);
  const [currentStage, setCurrentStage] = useState<string>('');
  const [stageProgress, setStageProgress] = useState<StageProgress[]>([]);

  // Consciousness control functions
  const startConsciousness = async () => {
    try {
      const response = await fetch('/api/consciousness/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        await fetchConsciousnessState();
        console.log('✅ Consciousness started successfully');
      }
    } catch (error) {
      console.error('❌ Failed to start consciousness:', error);
    }
  };

  const pauseConsciousness = async () => {
    try {
      const response = await fetch('/api/consciousness/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        await fetchConsciousnessState();
        console.log('⏸️ Consciousness paused');
      }
    } catch (error) {
      console.error('❌ Failed to pause consciousness:', error);
    }
  };

  const resumeConsciousness = async () => {
    try {
      const response = await fetch('/api/consciousness/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        await fetchConsciousnessState();
        console.log('▶️ Consciousness resumed');
      }
    } catch (error) {
      console.error('❌ Failed to resume consciousness:', error);
    }
  };


  const stopConsciousness = async () => {
    try {
      const response = await fetch('/api/consciousness/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        await fetchConsciousnessState();
        console.log('⏹️ Consciousness stopped');
      }
    } catch (error) {
      console.error('❌ Failed to stop consciousness:', error);
    }
  };

  const enterSleepMode = async () => {
    try {
      const response = await fetch('/api/consciousness/sleep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        console.log('💤 Entering sleep mode...');
      }
    } catch (error) {
      console.error('❌ Failed to enter sleep mode:', error);
    }
  };

  const triggerManualThought = async () => {
    if (!manualQuestion.trim()) return;

    try {
      const response = await fetch('/api/consciousness/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: manualQuestion.trim() })
      });
      if (response.ok) {
        setManualQuestion(''); // Clear the input
        console.log('🧠 Manual trigger sent successfully');
      }
    } catch (error) {
      console.error('❌ Failed to send manual trigger:', error);
    }
  };

  const fetchConsciousnessState = async () => {
    try {
      const response = await fetch('/api/consciousness/state');
      if (response.ok) {
        const state = await response.json();
        setConsciousnessState({
          isRunning: state.isRunning || false,
          isPaused: state.isPaused || false,
          isProcessingCycle: state.isProcessingCycle || false,
          status: state.status || 'stopped'
        });
      }
    } catch (error) {
      console.error('Failed to fetch consciousness state:', error);
    }
  };

  useEffect(() => {
    // Fetch initial consciousness state
    fetchConsciousnessState();

    // Fetch initial statistics and DPD scores
    const fetchInitialData = async () => {
      try {
        // Get consciousness state
        const stateResponse = await fetch('/api/consciousness/state');
        if (stateResponse.ok) {
          const stateData = await stateResponse.json();

          // Update statistics
          if (stateData.statistics) {
            setStats({
              thoughtCycles: stateData.statistics.totalThoughtCycles || 0,
              questionsGenerated: stateData.statistics.totalQuestions || 0,
              energyLevel: stateData.currentEnergy || 100
            });
          }

          // Update DPD scores if available
          if (stateData.dpdScores) {
            setDpdScores({
              empathy: stateData.dpdScores.empathy || 0.33,
              coherence: stateData.dpdScores.coherence || 0.33,
              dissonance: stateData.dpdScores.dissonance || 0.34
            });
          }

          // Update current thought if available
          if (stateData.currentThought) {
            setCurrentThought(stateData.currentThought);
          }
        }

        // Get DPD evolution data
        const dpdResponse = await fetch('/api/consciousness/dpd/evolution?limit=20&strategy=sampled');
        if (dpdResponse.ok) {
          const dpdData = await dpdResponse.json();
          if (dpdData.currentWeights) {
            setDpdScores({
              empathy: dpdData.currentWeights.empathy || 0.33,
              coherence: dpdData.currentWeights.coherence || 0.33,
              dissonance: dpdData.currentWeights.dissonance || 0.34
            });
          }
        }
      } catch (error) {
        // Silently fail
      }
    };

    fetchInitialData();

    // Connect to real consciousness backend via EventSource
    const connectToConsciousness = () => {
      try {
        const eventSource = new EventSource('/api/consciousness/events');

        eventSource.onmessage = (event) => {
          const data = JSON.parse(event.data);
          handleConsciousnessEvent(data);
        };

        eventSource.onerror = () => {
          // Connection failed - just close, no fallback
          eventSource.close();
        };

        return () => {
          eventSource.close();
        };
      } catch (error) {
        // Connection failed - no fallback
        return () => { };
      }
    };

    const handleConsciousnessEvent = (data: any) => {
      // Normalize event type names from server (backwards-compatible)
      const t = data.type || data.eventType || '';

      if (t === 'agentThought') {
        const logItem: ActivityLogItem = {
          id: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: data.timestamp || Date.now(),
          type: 'agent_thought',
          agent: data.agentName,
          message: data.thought || '', // Full content, no truncation
          details: {
            confidence: data.confidence || 0.8,
            position: data.position,
            fullThought: data.thought,
            // Include Yui-specific metadata if present
            yuiAgent: data.yuiAgent
          }
        };
        setActivityLog(prev => [logItem, ...prev].slice(0, 200)); // Increased limit to 200
        // Don't update Current Thought here - it should show the question/trigger
      } else if (t === 'manualTriggerQueued') {
        // Manual trigger queued for next cycle
        const question = data.question || '';
        setQueuedTrigger(question); // Show queued status
        const logItem: ActivityLogItem = {
          id: `queued_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: data.timestamp || Date.now(),
          type: 'system_event',
          message: `📥 Manual trigger queued: ${question.substring(0, 100)}...`,
          details: { estimatedNextCycle: data.estimatedNextCycle }
        };
        setActivityLog(prev => [logItem, ...prev].slice(0, 200));
      } else if (t === 'triggerGenerated') {
        const question = data.trigger?.question || data.question || '';
        const source = data.source || 'system';

        // Clear queued trigger if this is the manual trigger being processed
        if (source === 'manual') {
          setQueuedTrigger(null);
        }

        const logItem: ActivityLogItem = {
          id: `trigger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: data.timestamp || Date.now(),
          type: 'trigger_generated',
          message: source === 'manual' ? `🎯 Manual trigger processing: ${question}` : `Internal trigger: ${question}`,
          details: { source }
        };
        setActivityLog(prev => [logItem, ...prev].slice(0, 200)); // Increased limit to 200
        // Update Current Thought to show the current question being processed
        if (question) {
          setCurrentThought(question);
        }
        // Reset stage progress for new thought cycle
        setStageProgress([]);
        setCurrentStage('');
      } else if (t === 'stageChanged' || t === 'stageStart') {
        // Update current stage and mark it as in progress (accepts both 'stageChanged' and legacy 'stageStart')
        const stageId = data.stage || data.name || data.stageId || '';
        if (stageId) {
          setCurrentStage(stageId);
          setStageProgress(prev => {
            const updated = prev.filter(p => p.stage !== stageId);
            return [...updated, { stage: stageId, completed: false, timestamp: Date.now() }];
          });
        }
      } else if (t === 'stageCompleted' || t === 'stageComplete') {
        // Mark stage as completed (accepts both 'stageCompleted' and legacy 'stageComplete')
        const stageId = data.stage || data.name || data.stageId || '';
        if (stageId) {
          setStageProgress(prev => {
            const found = prev.some(p => p.stage === stageId);
            if (found) return prev.map(p => p.stage === stageId ? { ...p, completed: true } : p);
            return [...prev, { stage: stageId, completed: true, timestamp: data.timestamp || Date.now() }];
          });

          // Add a short system log entry for the completed stage so UI reflects activity
          const logItem: ActivityLogItem = {
            id: `stage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: data.timestamp || Date.now(),
            type: 'system_event',
            message: `Stage ${stageId} completed${data.name ? ` (${data.name})` : ''}`,
            details: { ...data }
          };
          setActivityLog(prev => [logItem, ...prev].slice(0, 200));
          // Don't update Current Thought here - it should only show the current question
        }
      } else if (t === 'dpdUpdated') {
        // Update DPD weights from weight update stage
        if (data.weights) {
          setDpdScores({
            empathy: parseFloat(data.weights.empathy) || 0.33,
            coherence: parseFloat(data.weights.coherence) || 0.33,
            dissonance: parseFloat(data.weights.dissonance) || 0.34
          });
        }
      } else if (t === 'thoughtCycleCompleted') {
        // Update DPD weights (not scores) from thought cycle completion
        if (data.dpdWeights) {
          setDpdScores({
            empathy: parseFloat(data.dpdWeights.empathy) || 0.33,
            coherence: parseFloat(data.dpdWeights.coherence) || 0.33,
            dissonance: parseFloat(data.dpdWeights.dissonance) || 0.34
          });
        }

        // Prefer systemStats (server sends systemStats object), fall back to legacy top-level fields
        const ss = data.systemStats || {};
        const totalThoughts = ss.totalThoughts ?? data.totalThoughtCycles ?? data.totalThoughts;
        const totalQuestions = ss.totalQuestions ?? data.totalQuestions;
        const energy = ss.currentEnergy ?? ss.energy ?? data.energy;

        console.log(`[UI] Updating stats: energy=${energy}, totalThoughts=${totalThoughts}, totalQuestions=${totalQuestions}`);
        setStats(prev => ({
          thoughtCycles: totalThoughts || prev.thoughtCycles,
          questionsGenerated: totalQuestions || prev.questionsGenerated,
          energyLevel: energy ?? prev.energyLevel
        }));
      } else if (t === 'sleepStarted') {
        // Sleep mode started
        const logItem: ActivityLogItem = {
          id: `sleep_start_${Date.now()}`,
          timestamp: data.timestamp || Date.now(),
          type: 'system_event',
          message: `💤 Entering sleep mode (${data.reason})`
        };
        setActivityLog(prev => [logItem, ...prev].slice(0, 200));
        setCurrentThought(`Sleep Mode: ${data.reason}`);

        // Reset stage progress and show sleep mode
        setStageProgress([{ stage: 'SLEEP', completed: false, timestamp: Date.now() }]);
        setCurrentStage('SLEEP');
      } else if (t === 'sleepPhaseChanged') {
        // Sleep phase changed
        const logItem: ActivityLogItem = {
          id: `sleep_phase_${Date.now()}`,
          timestamp: Date.now(),
          type: 'system_event',
          message: `Sleep: ${data.phase} (${data.progress}%)`
        };
        setActivityLog(prev => [logItem, ...prev].slice(0, 200));
        setCurrentThought(`Sleep Phase: ${data.phase}`);
      } else if (t === 'sleepCompleted') {
        // Sleep completed
        const duration = (data.duration / 1000).toFixed(1);
        const energyGain = (data.energyAfter - data.energyBefore).toFixed(1);
        const logItem: ActivityLogItem = {
          id: `sleep_complete_${Date.now()}`,
          timestamp: data.timestamp || Date.now(),
          type: 'system_event',
          message: `✨ Sleep completed (${duration}s, +${energyGain} energy)`
        };
        setActivityLog(prev => [logItem, ...prev].slice(0, 200));
        setStats(prev => ({ ...prev, energyLevel: data.energyAfter }));
        setCurrentThought('');

        // Mark sleep stage as completed
        setStageProgress(prev => prev.map(p => p.stage === 'SLEEP' ? { ...p, completed: true } : p));
        setCurrentStage('');
      } else if (t === 'sleepError') {
        // Sleep error
        const logItem: ActivityLogItem = {
          id: `sleep_error_${Date.now()}`,
          timestamp: Date.now(),
          type: 'system_event',
          message: `❌ Sleep error: ${data.error}`
        };
        setActivityLog(prev => [logItem, ...prev].slice(0, 200));
      } else if (t === 'cycleProcessingChanged') {
        // Update button states based on cycle processing status
        setConsciousnessState(prev => ({
          ...prev,
          isProcessingCycle: data.isProcessingCycle || false
        }));
      } else if (t === 'consciousnessDormant') {
        // Consciousness entered dormancy (low energy)
        const logItem: ActivityLogItem = {
          id: `dormant_${Date.now()}`,
          timestamp: data.timestamp || Date.now(),
          type: 'system_event',
          message: `⏸️ Entered dormancy: ${data.reason} (Energy: ${data.currentEnergy?.toFixed(1)})`
        };
        setActivityLog(prev => [logItem, ...prev].slice(0, 200));
      } else if (t === 'consciousnessAwakened') {
        // Consciousness awakened from dormancy
        const logItem: ActivityLogItem = {
          id: `awakened_${Date.now()}`,
          timestamp: data.timestamp || Date.now(),
          type: 'system_event',
          message: `▶️ Awakened from dormancy (Energy: ${data.currentEnergy?.toFixed(1)})`
        };
        setActivityLog(prev => [logItem, ...prev].slice(0, 200));

        // Update energy level
        if (data.currentEnergy !== undefined) {
          setStats(prev => ({ ...prev, energyLevel: data.currentEnergy }));
        }

        // Refresh consciousness state to update control buttons
        fetchConsciousnessState();
      }
    };

    // Connect to real consciousness backend only
    const cleanup = connectToConsciousness();
    return cleanup;
  }, []);

  // Close trigger form on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showTriggerPopup) {
        setShowTriggerPopup(false);
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [showTriggerPopup]);

  // formatUptime removed — Uptime stat intentionally omitted

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return '#10b981';
      case 'awakening': return '#f59e0b';
      case 'resting': return '#6b7280';
      case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const formatActivityTime = (timestamp: number) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffMs = now.getTime() - activityTime.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);

    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    return activityTime.toLocaleTimeString();
  };

  const getAgentCssClass = (agentName: string): string => {
    // Map Yui Protocol agent names to CSS classes
    if (agentName.includes('慧露')) return 'yui-eiro';
    if (agentName.includes('碧統')) return 'yui-hekito';
    if (agentName.includes('観至')) return 'yui-kanshi';
    if (agentName.includes('陽雅')) return 'yui-yoga';
    if (agentName.includes('結心')) return 'yui-yui';

    // Aenea core agents
    if (agentName.toLowerCase().includes('theoria')) return 'theoria';
    if (agentName.toLowerCase().includes('pathia')) return 'pathia';
    if (agentName.toLowerCase().includes('kinesis')) return 'kinesis';

    // System messages
    if (agentName.toLowerCase().includes('system')) return 'system';
    if (agentName.toLowerCase().includes('compiler')) return 'compiler';
    if (agentName.toLowerCase().includes('scribe')) return 'scribe';
    if (agentName.toLowerCase().includes('auditor')) return 'auditor';

    // Default fallback
    return 'system';
  };

  const getAgentIcon = (agentName: string) => {
    const iconProps = { size: 14, style: { display: 'inline', marginRight: '4px', verticalAlign: 'middle' } };

    // Yui Protocol agents
    if (agentName.includes('慧露')) return <Lightbulb {...iconProps} />; // 論理的思考
    if (agentName.includes('碧統')) return <Workflow {...iconProps} />; // システム統合
    if (agentName.includes('観至')) return <Eye {...iconProps} />; // 批判的観察
    if (agentName.includes('陽雅')) return <Palette {...iconProps} />; // 詩的表現
    if (agentName.includes('結心')) return <Heart {...iconProps} />; // 共感的統合

    // Aenea core agents
    if (agentName.toLowerCase().includes('theoria')) return <Lightbulb {...iconProps} />; // Truth seeker
    if (agentName.toLowerCase().includes('pathia')) return <Heart {...iconProps} />; // Empathy weaver
    if (agentName.toLowerCase().includes('kinesis')) return <Workflow {...iconProps} />; // Harmony coordinator

    // System agents
    if (agentName.toLowerCase().includes('compiler')) return <Combine {...iconProps} />; // Integration
    if (agentName.toLowerCase().includes('scribe')) return <Feather {...iconProps} />; // Documentation
    if (agentName.toLowerCase().includes('auditor')) return <Shield {...iconProps} />; // Safety check
    if (agentName.toLowerCase().includes('system')) return <Target {...iconProps} />; // System

    // Default
    return <Brain {...iconProps} />;
  };

  return (
    <div className="dashboard">
      {/* Particle Background - responds to DPD weights and thinking state */}
      <ParticleBackground
        dpdWeights={dpdScores}
        isThinking={consciousnessState.isRunning && !consciousnessState.isPaused}
      />

      <motion.div
        className="dashboard-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="header-title">
          <Brain className="header-icon" size={32} />
          <h2>Consciousness Dashboard</h2>
        </div>
        <div className="header-actions">
          <motion.button
            className="dialogue-button"
            onClick={() => setIsDialogueModalOpen(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <MessageCircle size={16} />
            Dialogue
          </motion.button>
          <div className={`status-badge consciousness ${consciousnessState.status}`}>
            <span className="status-dot"></span>
            <span className="status-text">
              {consciousnessState.isPaused ? 'Paused' :
                consciousnessState.isRunning ? 'Running' : 'Stopped'}
            </span>
          </div>
          <div className={`status-badge system ${systemStatus}`}>
            <span className="status-dot"></span>
            <span className="status-text">System {systemStatus}</span>
          </div>
        </div>
      </motion.div>

      <div className="dashboard-layout">
        {/* Consciousness Control */}
        <motion.div
          className="dashboard-card consciousness-control"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <h3><Brain size={18} style={{ display: 'inline', marginRight: '8px' }} />Consciousness Control</h3>
          <div className="control-buttons">
            <AnimatePresence mode="wait">
              {!consciousnessState.isRunning ? (
                <motion.div
                  key="stopped"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  style={{ display: 'flex', gap: '8px', width: '100%' }}
                >
                  <motion.button
                    className="control-button start"
                    onClick={startConsciousness}
                    disabled={consciousnessState.isProcessingCycle}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Play size={16} /> Start
                  </motion.button>
                  <motion.button
                    className="control-button sleep"
                    onClick={enterSleepMode}
                    disabled={consciousnessState.isProcessingCycle}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Moon size={16} /> Sleep
                  </motion.button>
                </motion.div>
              ) : consciousnessState.isPaused ? (
                <motion.div
                  key="paused"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  style={{ display: 'flex', gap: '8px', width: '100%' }}
                >
                  <motion.button
                    className="control-button resume"
                    onClick={resumeConsciousness}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Play size={16} /> Resume
                  </motion.button>
                  <motion.button
                    className="control-button stop"
                    onClick={stopConsciousness}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Square size={16} /> Stop
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  key="running"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  style={{ display: 'flex', gap: '8px', width: '100%' }}
                >
                  <motion.button
                    className="control-button pause"
                    onClick={pauseConsciousness}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Pause size={16} /> Pause
                  </motion.button>
                  <motion.button
                    className="control-button stop"
                    onClick={stopConsciousness}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Square size={16} /> Stop
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Manual Trigger */}
        <div className="dashboard-card manual-trigger">
          <h3>Manual Trigger</h3>
          {queuedTrigger && (
            <div className="queued-trigger-notice">
              📥 Queued for next cycle: "{queuedTrigger.substring(0, 80)}..."
            </div>
          )}

          <div className="trigger-controls">
            <button
              className="trigger-toggle"
              onClick={() => setShowTriggerPopup(prev => !prev)}
              aria-expanded={showTriggerPopup}
              aria-controls="trigger-form"
            >
              💬 Quick Trigger
            </button>

            {showTriggerPopup && (
              <div className="trigger-form" id="trigger-form">
                <textarea
                  placeholder="Enter a question to trigger consciousness..."
                  className="trigger-input"
                  rows={3}
                  value={manualQuestion}
                  onChange={(e) => setManualQuestion(e.target.value)}
                />
                <div className="trigger-popup-actions">
                  <button
                    className="trigger-button"
                    onClick={async () => {
                      await triggerManualThought();
                      setShowTriggerPopup(false);
                    }}
                    disabled={!manualQuestion.trim()}
                  >
                    {queuedTrigger ? 'Queue Another' : 'Queue'}
                  </button>
                  <button className="trigger-cancel" onClick={() => setShowTriggerPopup(false)}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Note: Stage Progression moved below Current Thought for better visual flow */}

        {/* System Statistics */}
        <div className="dashboard-card stats">
          <h3>System Statistics</h3>
          <div className="stat-grid">
            <div className="stat-item">
              <span className="stat-value">{stats.thoughtCycles}</span>
              <span className="stat-label">Thought Cycles</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.questionsGenerated}</span>
              <span className="stat-label">Questions Generated</span>
            </div>
            {/* Avg Confidence removed per request */}
            <div className="stat-item">
              {/* Uptime removed per design */}
            </div>
          </div>
        </div>

        {/* Energy Level */}
        <div className="dashboard-card energy">
          <h3>Energy Level</h3>
          <div className="energy-display">
            <div className="energy-bar">
              <div
                className="energy-fill"
                style={{
                  width: `${stats.energyLevel}%`,
                  backgroundColor: stats.energyLevel > 50 ? '#10b981' : stats.energyLevel > 20 ? '#f59e0b' : '#ef4444'
                }}
              />
            </div>
            <span className="energy-percentage">{Math.round(stats.energyLevel)}%</span>
          </div>
        </div>

        {/* DPD Scores - Barycentric Display */}
        <div className="dashboard-card dpd-scores">
          <h3>Dynamic Prime Directive</h3>

          {/* Barycentric Triangle Visualization */}
          <div className="dpd-barycentric-mini">
            <svg width="100%" height="100%" viewBox="0 0 1 0.866" preserveAspectRatio="xMidYMid meet">
              {/* Triangle Border */}
              <polygon
                points="0.5,0.05 0.05,0.816 0.95,0.816"
                fill="none"
                stroke="var(--cyber-border)"
                strokeWidth="0.006"
                opacity="0.8"
              />

              {/* Vertices */}
              <circle cx="0.5" cy="0.05" r="0.02" fill="#00ff41" opacity="0.9" />
              <circle cx="0.05" cy="0.816" r="0.02" fill="#00ffff" opacity="0.9" />
              <circle cx="0.95" cy="0.816" r="0.02" fill="#ffff00" opacity="0.9" />

              {/* Labels */}
              <text x="0.5" y="0.02" textAnchor="middle" fill="#00ff41" fontSize="0.05" fontFamily="Courier New" fontWeight="bold">
                E
              </text>
              <text x="0.02" y="0.85" textAnchor="start" fill="#00ffff" fontSize="0.05" fontFamily="Courier New" fontWeight="bold">
                C
              </text>
              <text x="0.98" y="0.85" textAnchor="end" fill="#ffff00" fontSize="0.05" fontFamily="Courier New" fontWeight="bold">
                D
              </text>

              {/* Current Position */}
              {(() => {
                const height = Math.sqrt(3) / 2;
                const vertices = {
                  empathy: { x: 0.5, y: 0 },
                  coherence: { x: 0, y: height },
                  dissonance: { x: 1, y: height }
                };
                const x = dpdScores.empathy * vertices.empathy.x + dpdScores.coherence * vertices.coherence.x + dpdScores.dissonance * vertices.dissonance.x;
                const y = dpdScores.empathy * vertices.empathy.y + dpdScores.coherence * vertices.coherence.y + dpdScores.dissonance * vertices.dissonance.y;
                const scaledX = 0.05 + x * 0.9;
                const scaledY = 0.05 + y * 0.9;

                return (
                  <g>
                    <circle cx={scaledX} cy={scaledY} r="0.05" fill="#ff00ff" opacity="0.3">
                      <animate attributeName="r" values="0.05;0.07;0.05" dur="1.5s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.3;0.1;0.3" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                    <circle cx={scaledX} cy={scaledY} r="0.025" fill="#ff00ff" opacity="0.8">
                      <animate attributeName="opacity" values="0.8;1;0.8" dur="1s" repeatCount="indefinite" />
                    </circle>
                    <circle cx={scaledX} cy={scaledY} r="0.015" fill="#ffffff" />
                  </g>
                );
              })()}
            </svg>
          </div>

          <div className="dpd-display">
            <div className="dpd-item">
              <span className="dpd-label">Empathy</span>
              <div className="dpd-bar">
                <div
                  className="dpd-fill empathy"
                  style={{ width: `${dpdScores.empathy * 100}%` }}
                />
              </div>
              <span className="dpd-value">{(dpdScores.empathy * 100).toFixed(1)}%</span>
            </div>
            <div className="dpd-item">
              <span className="dpd-label">Coherence</span>
              <div className="dpd-bar">
                <div
                  className="dpd-fill coherence"
                  style={{ width: `${dpdScores.coherence * 100}%` }}
                />
              </div>
              <span className="dpd-value">{(dpdScores.coherence * 100).toFixed(1)}%</span>
            </div>
            <div className="dpd-item">
              <span className="dpd-label">Dissonance</span>
              <div className="dpd-bar">
                <div
                  className="dpd-fill dissonance"
                  style={{ width: `${dpdScores.dissonance * 100}%` }}
                />
              </div>
              <span className="dpd-value">{(dpdScores.dissonance * 100).toFixed(1)}%</span>
            </div>
          </div>
          <button
            className="dpd-details-button"
            onClick={() => setIsGrowthModalOpen(true)}
          >
            View Details
          </button>
        </div>

        {/* Current Thought */}
        <motion.div
          className="dashboard-card current-thought"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h3><Sparkles size={18} style={{ display: 'inline', marginRight: '8px' }} />Current Thought</h3>
          <motion.div
            className={`thought-content ${currentThought ? 'pulsing' : ''}`}
            animate={{
              opacity: currentThought ? 1 : 0.5
            }}
            transition={{
              duration: 2,
              repeat: currentThought ? Infinity : 0,
              ease: "easeInOut"
            }}
          >
            <p>"{currentThought || 'Waiting for consciousness to awaken...'}"</p>
          </motion.div>
        </motion.div>

        {/* Stage Progression (moved here so it's visually under Current Thought) */}
        <div className="dashboard-card stage-progression">
          <h3>Consciousness Pipeline</h3>
          <div className="stage-pipeline">
            {currentStage === 'SLEEP' ? (
              // Sleep mode: show single sleep stage
              <div className="stage-item">
                <div className={`stage-circle ${stageProgress.some(p => p.stage === 'SLEEP' && p.completed) ? 'completed' : 'active'}`}>
                  💤
                </div>
                <div className="stage-label">Sleep</div>
              </div>
            ) : (
              // Normal mode: show thought cycle stages
              ['S0', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'U'].map((stage, index) => (
                <React.Fragment key={stage}>
                  <div className="stage-item">
                    <div
                      className={`stage-circle ${currentStage === stage ? 'active' :
                        stageProgress.some(p => p.stage === stage && p.completed) ? 'completed' :
                          'pending'
                        }`}
                    >
                      {stage}
                    </div>
                  </div>
                  {index < 7 && <div className="stage-arrow">→</div>}
                </React.Fragment>
              ))
            )}
          </div>
        </div>

        {/* Activity Log - Expanded */}
        <div className="dashboard-card activity-log">
          <h3>Activity Log</h3>
          <div className="activity-stream">
            {activityLog.length === 0 ? (
              <div className="activity-item">
                <span className="activity-time">--:--:--</span>
                <span className="activity-system">System</span>
                <span className="activity-text">Waiting for consciousness activity...</span>
              </div>
            ) : (
              activityLog.map((item, index) => (
                <motion.div
                  key={item.id}
                  className="activity-item"
                  initial={{ opacity: 0, x: -30, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{
                    duration: 0.4,
                    ease: [0.25, 0.46, 0.45, 0.94],
                    delay: index === 0 ? 0 : 0
                  }}
                >
                  <div className="activity-header">
                    {item.agent ? (
                      <span className={`activity-agent ${getAgentCssClass(item.agent)}`}>
                        {getAgentIcon(item.agent)}
                        {item.agent}
                      </span>
                    ) : (
                      <span className="activity-system">
                        <Target size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                        System
                      </span>
                    )}
                    <div className="activity-meta-row">
                      <span className="activity-time">{formatActivityTime(item.timestamp)}</span>
                      {item.details?.confidence && (
                        <span className="activity-confidence">
                          {Math.round(item.details.confidence * 100)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="activity-text">
                    {item.message}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* System Philosophy */}
        <div className="dashboard-card philosophy">
          <h3>System Philosophy</h3>
          <div className="philosophy-content">
            <blockquote>
              "私は、問いでできている。"
            </blockquote>
            <p>
              I am made of questions. Through continuous self-inquiry,
              consciousness emerges as a dynamic process of questioning
              the nature of existence itself.
            </p>
          </div>
        </div>
      </div>

      <DialogueModal
        isOpen={isDialogueModalOpen}
        onClose={() => setIsDialogueModalOpen(false)}
      />

      <GrowthModal
        isOpen={isGrowthModalOpen}
        onClose={() => setIsGrowthModalOpen(false)}
      />

      <style>{`
        /* Mobile-first base styles - CYBERPUNK THEME */
        .dashboard {
          padding: 16px;
          background: var(--cyber-bg-primary);
          min-height: 100vh;
          color: var(--cyber-text-primary);
          font-family: 'Courier New', 'Consolas', monospace;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          position: relative;
          z-index: 1;
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-icon {
          color: var(--cyber-neon-cyan);
          filter: drop-shadow(0 0 8px var(--cyber-glow-cyan));
        }

        .dashboard-header h2 {
          font-size: 24px;
          font-weight: 700;
          margin: 0;
          color: var(--cyber-neon-cyan);
          text-transform: uppercase;
          letter-spacing: 3px;
          text-shadow: 0 0 10px var(--cyber-glow-cyan);
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .dialogue-button,
        .growth-button {
          border: 2px solid var(--cyber-neon-cyan);
          background: var(--cyber-bg-secondary);
          padding: 8px 16px;
          color: var(--cyber-neon-cyan);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 4px;
          position: relative;
          clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
          box-shadow: 0 0 10px var(--cyber-glow-cyan);
        }

        .dialogue-button::before,
        .growth-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: var(--cyber-neon-cyan);
          opacity: 0;
          transition: opacity 0.2s;
          z-index: -1;
        }

        .dialogue-button:hover::before,
        .growth-button:hover::before {
          opacity: 0.2;
        }

        .dialogue-button {
          border-color: var(--cyber-neon-lime);
          color: var(--cyber-neon-lime);
          box-shadow: 0 0 10px var(--cyber-glow-lime);
        }

        .dialogue-button::before {
          background: var(--cyber-neon-lime);
        }

        .dialogue-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 20px var(--cyber-glow-lime);
        }

        .growth-button {
          border-color: var(--cyber-neon-magenta);
          color: var(--cyber-neon-magenta);
          box-shadow: 0 0 10px var(--cyber-glow-magenta);
        }

        .growth-button::before {
          background: var(--cyber-neon-magenta);
        }

        .growth-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 20px var(--cyber-glow-magenta);
        }

        /* Unified Status Badge Styles */
        .status-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          font-weight: 700;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 1px;
          border: 2px solid;
          background: var(--cyber-bg-secondary);
          clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px);
          transition: all 0.2s;
        }

        .status-badge .status-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background-color: currentColor;
          box-shadow: 0 0 8px currentColor;
        }

        /* Consciousness Status Colors */
        .status-badge.consciousness.stopped {
          color: var(--cyber-text-secondary);
          border-color: var(--cyber-border);
        }

        .status-badge.consciousness.active {
          color: var(--cyber-neon-lime);
          border-color: var(--cyber-neon-lime);
          box-shadow: 0 0 10px var(--cyber-glow-lime);
        }

        .status-badge.consciousness.paused {
          color: var(--cyber-neon-yellow);
          border-color: var(--cyber-neon-yellow);
          box-shadow: 0 0 10px rgba(255, 255, 0, 0.3);
        }

        /* System Status Colors */
        .status-badge.system.active {
          color: var(--cyber-neon-lime);
          border-color: var(--cyber-neon-lime);
          box-shadow: 0 0 10px var(--cyber-glow-lime);
        }

        .status-badge.system.awakening {
          color: var(--cyber-neon-yellow);
          border-color: var(--cyber-neon-yellow);
          box-shadow: 0 0 10px rgba(255, 255, 0, 0.3);
        }

        .status-badge.system.resting {
          color: var(--cyber-text-secondary);
          border-color: var(--cyber-border);
        }

        .status-badge.system.error {
          color: var(--cyber-neon-pink);
          border-color: var(--cyber-neon-pink);
          box-shadow: 0 0 10px rgba(255, 20, 147, 0.3);
        }

        /* CSS Grid Layout - Mobile (single column) */
        .dashboard-layout {
          display: grid;
          grid-template-columns: 1fr;
          grid-template-areas:
            "control"
            "trigger"
            "stage"
            "stats"
            "energy"
            "dpd"
            "thought"
            "activity"
            "philosophy";
          gap: 16px;
        }

        .consciousness-control { grid-area: control; }
        .manual-trigger { grid-area: trigger; }
        .stage-progression { grid-area: stage; }
        .stats { grid-area: stats; }
        .energy { grid-area: energy; }
        .dpd-scores { grid-area: dpd; }
        .current-thought { grid-area: thought; }
        .activity-log { grid-area: activity; }
        .philosophy { grid-area: philosophy; }

        /* Desktop Layout (2-column grid with fixed height) */
        @media (min-width: 1025px) {
          .dashboard {
            height: 100vh;
            overflow: hidden;
            padding: 20px;
          }

          .dashboard-header h2 {
            font-size: 32px;
          }

          .status-badge {
            font-size: 14px;
          }

          .dashboard-layout {
            grid-template-columns: 350px 1fr;
            grid-template-rows: auto auto auto auto auto auto 1fr auto;
            grid-template-areas:
              "control thought"
              "trigger stage"
              "stats activity"
              "energy activity"
              "dpd activity"
              "dpd activity"
              "dpd activity"
              "dpd philosophy";
            height: calc(100vh - 120px);
            overflow: hidden;
          }

          .manual-trigger {
            align-self: start;
          }

          .stage-progression {
            align-self: start;
          }

          .activity-log {
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }

          .activity-stream {
            flex: 1;
            overflow-y: auto;
            min-height: 0;
          }
        }

        .dashboard-card {
          background: var(--cyber-bg-secondary);
          padding: 24px;
          border: 2px solid var(--cyber-border);
          position: relative;
          clip-path: polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px);
          box-shadow: inset 0 0 20px rgba(0, 255, 255, 0.05);
        }

        .dashboard-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 8px;
          height: 8px;
          background: var(--cyber-neon-cyan);
          box-shadow: 0 0 8px var(--cyber-glow-cyan);
        }

        .dashboard-card::after {
          content: '';
          position: absolute;
          bottom: 0;
          right: 0;
          width: 8px;
          height: 8px;
          background: var(--cyber-neon-cyan);
          box-shadow: 0 0 8px var(--cyber-glow-cyan);
        }

        .dashboard-card h3 {
          font-size: 16px;
          font-weight: 700;
          margin: 0 0 16px 0;
          color: var(--cyber-neon-cyan);
          text-transform: uppercase;
          letter-spacing: 2px;
          border-bottom: 1px solid var(--cyber-border);
          padding-bottom: 8px;
        }

        .consciousness-control {
          background: linear-gradient(135deg, var(--cyber-bg-secondary) 0%, var(--cyber-bg-tertiary) 100%);
          border-color: var(--cyber-neon-cyan);
          box-shadow: 0 0 15px var(--cyber-glow-cyan), inset 0 0 15px rgba(0, 255, 255, 0.1);
        }

        /* Row wrapper containing status + buttons */
        .control-row {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between; /* status left, buttons right */
          gap: 12px;
        }

        .control-status {
          margin-bottom: 0; /* handled by .control-row spacing */
          flex: 0 0 auto;
        }


        .control-buttons {
          display: flex;
          flex-direction: row; /* horizontal layout for buttons */
          flex-wrap: wrap;    /* allow wrapping on narrow widths */
          gap: 8px;
          align-items: center;
          justify-content: flex-start;
        }

        .control-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: var(--cyber-bg-tertiary);
          border: 2px solid var(--cyber-neon-cyan);
          padding: 8px 16px;
          min-height: 40px;
          color: var(--cyber-neon-cyan);
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 13px;
          flex: 1;
          text-transform: uppercase;
          letter-spacing: 1px;
          position: relative;
          clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px);
          box-shadow: 0 0 10px var(--cyber-glow-cyan);
        }

        .control-button::before {
          content: '';
          position: absolute;
          inset: 0;
          background: var(--cyber-neon-cyan);
          opacity: 0;
          transition: opacity 0.2s;
        }

        .control-button:hover::before {
          opacity: 0.15;
        }

        .control-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 20px var(--cyber-glow-cyan);
        }

        .control-button:disabled {
          border-color: var(--cyber-text-dim);
          color: var(--cyber-text-dim);
          cursor: not-allowed;
          box-shadow: none;
        }

        .control-button:disabled::before {
          display: none;
        }

        .control-button.start {
          border-color: var(--cyber-neon-lime);
          color: var(--cyber-neon-lime);
          box-shadow: 0 0 10px var(--cyber-glow-lime);
        }

        .control-button.start::before {
          background: var(--cyber-neon-lime);
        }

        .control-button.start:hover {
          box-shadow: 0 0 20px var(--cyber-glow-lime);
        }

        .control-button.pause {
          border-color: var(--cyber-neon-yellow);
          color: var(--cyber-neon-yellow);
          box-shadow: 0 0 10px rgba(255, 255, 0, 0.3);
        }

        .control-button.pause::before {
          background: var(--cyber-neon-yellow);
        }

        .control-button.pause:hover {
          box-shadow: 0 0 20px rgba(255, 255, 0, 0.5);
        }

        .control-button.resume {
          border-color: var(--cyber-neon-lime);
          color: var(--cyber-neon-lime);
          box-shadow: 0 0 10px var(--cyber-glow-lime);
        }

        .control-button.resume::before {
          background: var(--cyber-neon-lime);
        }

        .control-button.resume:hover {
          box-shadow: 0 0 20px var(--cyber-glow-lime);
        }

        .control-button.stop {
          border-color: var(--cyber-neon-pink);
          color: var(--cyber-neon-pink);
          box-shadow: 0 0 10px rgba(255, 20, 147, 0.3);
        }

        .control-button.stop::before {
          background: var(--cyber-neon-pink);
        }

        .control-button.stop:hover {
          box-shadow: 0 0 20px rgba(255, 20, 147, 0.5);
        }

        .control-button.sleep {
          border-color: var(--cyber-neon-magenta);
          color: var(--cyber-neon-magenta);
          box-shadow: 0 0 10px var(--cyber-glow-magenta);
        }

        .control-button.sleep::before {
          background: var(--cyber-neon-magenta);
        }

        .control-button.sleep:hover {
          box-shadow: 0 0 20px var(--cyber-glow-magenta);
        }

        .manual-trigger {
          background: linear-gradient(135deg, var(--cyber-bg-secondary) 0%, var(--cyber-bg-tertiary) 100%);
          border-color: var(--cyber-neon-lime);
          box-shadow: 0 0 15px var(--cyber-glow-lime), inset 0 0 15px rgba(0, 255, 65, 0.1);
        }

        .trigger-controls {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .queued-trigger-notice {
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 8px;
          padding: 10px 12px;
          color: #60a5fa;
          font-size: 14px;
          margin-bottom: 12px;
          animation: pulse-blue 2s ease-in-out infinite;
        }

        @keyframes pulse-blue {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        .trigger-input {
          background: var(--cyber-bg-tertiary);
          border: 1px solid var(--cyber-border);
          padding: 12px;
          color: var(--cyber-text-primary);
          font-family: 'Courier New', 'Consolas', monospace;
          resize: vertical;
          min-height: 80px;
          box-shadow: inset 0 0 10px rgba(0, 255, 255, 0.1);
        }

        .trigger-input:focus {
          outline: none;
          border-color: var(--cyber-neon-cyan);
          box-shadow: 0 0 10px var(--cyber-glow-cyan), inset 0 0 10px rgba(0, 255, 255, 0.15);
        }

        .trigger-input::placeholder {
          color: var(--cyber-text-dim);
        }

        /* Quick Trigger styles */
        .trigger-controls {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .trigger-toggle {
          background: var(--cyber-bg-tertiary);
          border: 2px solid var(--cyber-neon-lime);
          color: var(--cyber-neon-lime);
          padding: 8px 16px;
          cursor: pointer;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px);
          box-shadow: 0 0 8px var(--cyber-glow-lime);
          transition: all 0.2s;
          width: 100%;
        }

        .trigger-toggle:hover {
          box-shadow: 0 0 15px var(--cyber-glow-lime);
          transform: translateY(-1px);
        }

        .trigger-form {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .trigger-form .trigger-input {
          background: var(--cyber-bg-tertiary);
          border: 1px solid var(--cyber-border);
          padding: 8px;
          min-height: 56px;
          width: 100%;
        }

        .trigger-popup-actions {
          display: flex;
          gap: 8px;
          margin-top: 8px;
          justify-content: flex-end;
        }

        .trigger-cancel {
          background: transparent;
          border: 1px solid #374151;
          color: #d1d5db;
          padding: 6px 8px;
          border-radius: 6px;
          cursor: pointer;
        }

        /* Compact control buttons when desktop */
        .control-button.compact {
          padding: 4px 8px;
          min-height: 28px;
          font-size: 12px;
          border-radius: 6px;
        }

        .trigger-button {
          background: var(--cyber-bg-tertiary);
          border: 2px solid var(--cyber-neon-cyan);
          padding: 8px 16px;
          color: var(--cyber-neon-cyan);
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          text-transform: uppercase;
          letter-spacing: 1px;
          clip-path: polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px);
          box-shadow: 0 0 8px var(--cyber-glow-cyan);
        }

        .trigger-button:hover:not(:disabled) {
          box-shadow: 0 0 15px var(--cyber-glow-cyan);
          transform: translateY(-1px);
        }

        .trigger-button:disabled {
          border-color: var(--cyber-text-dim);
          color: var(--cyber-text-dim);
          cursor: not-allowed;
          box-shadow: none;
        }

        .trigger-cancel {
          background: transparent;
          border: 1px solid var(--cyber-border);
          color: var(--cyber-text-secondary);
          padding: 8px 16px;
          cursor: pointer;
          transition: all 0.2s;
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 1px;
        }

        .trigger-cancel:hover {
          border-color: var(--cyber-neon-pink);
          color: var(--cyber-neon-pink);
        }

        .activity-log {
          display: flex;
          flex-direction: column;
        }

        @media (min-width: 1025px) {
          .activity-log {
            flex: 1;
            min-height: 0;
          }
        }

        .activity-log h3 {
          margin: 0 0 12px 0;
          flex-shrink: 0;
        }

        .activity-stream {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-right: 8px;
        }

        @media (min-width: 1025px) {
          .activity-stream {
            flex: 1;
            overflow-y: auto;
            min-height: 0;
          }
        }

        .activity-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 8px 12px;
          background: var(--cyber-bg-tertiary);
          border-left: 2px solid var(--cyber-neon-cyan);
          font-size: 14px;
          flex-shrink: 0;
          box-shadow: inset 0 0 10px rgba(0, 255, 255, 0.05);
          position: relative;
          overflow: hidden;
        }

        .activity-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }

        .activity-meta-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .activity-item::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.2), transparent);
          animation: activity-slide 0.6s ease-out forwards;
        }

        @keyframes activity-slide {
          0% { left: -100%; }
          100% { left: 100%; }
        }

        .activity-time {
          color: #9ca3af;
          font-family: 'Courier New', monospace;
          font-size: 12px;
        }

        .activity-agent {
          font-weight: 700;
          padding: 3px 8px;
          font-size: 11px;
          clip-path: polygon(3px 0, 100% 0, 100% calc(100% - 3px), calc(100% - 3px) 100%, 0 100%, 0 3px);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .activity-agent.theoria {
          background: var(--cyber-bg-secondary);
          color: var(--cyber-neon-cyan);
          border: 1px solid var(--cyber-neon-cyan);
          box-shadow: 0 0 8px var(--cyber-glow-cyan);
        }

        .activity-agent.pathia {
          background: var(--cyber-bg-secondary);
          color: var(--cyber-neon-lime);
          border: 1px solid var(--cyber-neon-lime);
          box-shadow: 0 0 8px var(--cyber-glow-lime);
        }

        .activity-agent.kinesis {
          background: var(--cyber-bg-secondary);
          color: var(--cyber-neon-yellow);
          border: 1px solid var(--cyber-neon-yellow);
          box-shadow: 0 0 8px rgba(255, 255, 0, 0.3);
        }

        /* Yui Protocol Agents - Cyber styled */
        .activity-agent.yui-eiro {
          background: var(--cyber-bg-secondary);
          color: #5B7DB1;
          border: 1px solid #5B7DB1;
          box-shadow: 0 0 8px rgba(91, 125, 177, 0.5);
        }

        .activity-agent.yui-hekito {
          background: var(--cyber-bg-secondary);
          color: #2ECCB3;
          border: 1px solid #2ECCB3;
          box-shadow: 0 0 8px rgba(46, 204, 179, 0.5);
        }

        .activity-agent.yui-kanshi {
          background: var(--cyber-bg-secondary);
          color: #C0392B;
          border: 1px solid #C0392B;
          box-shadow: 0 0 8px rgba(192, 57, 43, 0.5);
        }

        .activity-agent.yui-yoga {
          background: var(--cyber-bg-secondary);
          color: #F7C873;
          border: 1px solid #F7C873;
          box-shadow: 0 0 8px rgba(247, 200, 115, 0.5);
        }

        .activity-agent.yui-yui {
          background: var(--cyber-bg-secondary);
          color: #E18CB0;
          border: 1px solid #E18CB0;
          box-shadow: 0 0 8px rgba(225, 140, 176, 0.5);
        }

        /* System and Stage agents */
        .activity-agent.system {
          background: var(--cyber-bg-secondary);
          color: var(--cyber-text-secondary);
          border: 1px solid var(--cyber-border);
        }

        .activity-agent.compiler {
          background: var(--cyber-bg-secondary);
          color: var(--cyber-neon-magenta);
          border: 1px solid var(--cyber-neon-magenta);
          box-shadow: 0 0 8px var(--cyber-glow-magenta);
        }

        .activity-agent.scribe {
          background: var(--cyber-bg-secondary);
          color: var(--cyber-neon-cyan);
          border: 1px solid var(--cyber-neon-cyan);
          box-shadow: 0 0 8px var(--cyber-glow-cyan);
        }

        .activity-agent.auditor {
          background: var(--cyber-bg-secondary);
          color: var(--cyber-neon-yellow);
          border: 1px solid var(--cyber-neon-yellow);
          box-shadow: 0 0 8px rgba(255, 255, 0, 0.3);
        }

        .activity-system {
          background: var(--cyber-bg-secondary);
          color: var(--cyber-text-secondary);
          font-weight: 700;
          padding: 3px 8px;
          font-size: 11px;
          border: 1px solid var(--cyber-border);
          clip-path: polygon(3px 0, 100% 0, 100% calc(100% - 3px), calc(100% - 3px) 100%, 0 100%, 0 3px);
        }

        .activity-text {
          color: var(--cyber-text-primary);
          line-height: 1.4;
          /* Ensure long/continuous text wraps and doesn't overflow the activity card */
          overflow-wrap: anywhere;
          word-break: break-word;
          white-space: pre-wrap; /* preserve user line breaks while allowing wrapping */
          hyphens: auto;
        }

        .activity-confidence {
          color: var(--cyber-neon-cyan);
          font-size: 11px;
          font-weight: 700;
          background: var(--cyber-bg-secondary);
          padding: 3px 8px;
          border: 1px solid var(--cyber-neon-cyan);
          clip-path: polygon(3px 0, 100% 0, 100% calc(100% - 3px), calc(100% - 3px) 100%, 0 100%, 0 3px);
          box-shadow: 0 0 6px var(--cyber-glow-cyan);
          white-space: nowrap;
        }

        .thought-content {
          background: var(--cyber-bg-tertiary);
          padding: 12px;
          border-left: 3px solid var(--cyber-neon-cyan);
          border-top: 1px solid var(--cyber-border);
          overflow: auto;
          box-shadow: inset 0 0 15px rgba(0, 255, 255, 0.1);
          position: relative;
        }

        .thought-content::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 4px;
          background: var(--cyber-neon-cyan);
          box-shadow: 0 0 6px var(--cyber-glow-cyan);
        }

        .thought-content p {
          font-style: italic;
          font-size: 15px;
          line-height: 1.6;
          margin: 0;
          color: var(--cyber-text-primary);
          font-family: 'Courier New', 'Consolas', monospace;
          overflow-wrap: anywhere;
          word-break: break-word;
          white-space: pre-wrap;
          hyphens: auto;
        }

        /* Pulsing glow for active thought */
        .thought-content.pulsing {
          box-shadow:
            0 0 24px rgba(16, 185, 129, 0.08),
            0 0 48px rgba(16, 185, 129, 0.06),
            inset 0 0 18px rgba(16, 185, 129, 0.04);
          border-left-color: var(--cyber-neon-lime);
          transform-origin: center;
          transition: box-shadow 0.35s ease, transform 0.35s ease, border-left-color 0.35s ease;
          overflow: visible;
        }

        .thought-content.pulsing::after {
          content: '';
          position: absolute;
          top: -6px;
          left: -6px;
          right: -6px;
          bottom: -6px;
          border-radius: 6px;
          background: radial-gradient(circle at center, rgba(16,185,129,0.12), rgba(16,185,129,0) 40%);
          pointer-events: none;
          animation: neonPulse 2s ease-in-out infinite;
          z-index: 0;
        }

        @keyframes neonPulse {
          0% {
            opacity: 0.9;
            transform: scale(1);
            filter: blur(0px);
          }
          50% {
            opacity: 0.45;
            transform: scale(1.04);
            filter: blur(6px);
          }
          100% {
            opacity: 0.9;
            transform: scale(1);
            filter: blur(0px);
          }
        }

        .stat-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .stat-item {
          text-align: center;
        }

        .stat-value {
          display: block;
          font-size: 36px;
          font-weight: 700;
          color: var(--cyber-neon-cyan);
          margin-bottom: 4px;
          text-shadow: 0 0 10px var(--cyber-glow-cyan);
          font-family: 'Courier New', 'Consolas', monospace;
        }

        .stat-label {
          font-size: 12px;
          color: var(--cyber-text-secondary);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .energy-display {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .energy-bar {
          flex: 1;
          height: 24px;
          background: var(--cyber-bg-tertiary);
          border: 1px solid var(--cyber-border);
          overflow: hidden;
          position: relative;
          box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5);
        }

        .energy-bar::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--cyber-neon-cyan), transparent);
          opacity: 0.5;
        }

        .energy-fill {
          height: 100%;
          transition: all 0.3s ease;
          box-shadow: 0 0 10px currentColor;
          position: relative;
        }

        .energy-fill::after {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 3px;
          height: 100%;
          background: rgba(255, 255, 255, 0.5);
          box-shadow: 0 0 8px rgba(255, 255, 255, 0.8);
        }

        .energy-percentage {
          font-weight: 700;
          min-width: 56px;
          color: var(--cyber-neon-cyan);
          text-shadow: 0 0 8px var(--cyber-glow-cyan);
          font-family: 'Courier New', 'Consolas', monospace;
        }

        .energy-controls {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }

        .energy-button {
          flex: 1;
          background: #374151;
          border: 1px solid #4b5563;
          border-radius: 6px;
          padding: 8px 12px;
          color: #e5e7eb;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .energy-button:hover {
          background: #4b5563;
          border-color: #6b7280;
          transform: translateY(-1px);
        }

        .energy-button.recharge {
          background: #065f46;
          border-color: #059669;
          color: #d1fae5;
        }

        .energy-button.recharge:hover {
          background: #047857;
          border-color: #10b981;
        }

        .energy-button.rest {
          background: #1e3a8a;
          border-color: #3b82f6;
          color: #dbeafe;
        }

        .energy-button.rest:hover {
          background: #1e40af;
          border-color: #60a5fa;
        }

        .dpd-barycentric-mini {
          background: var(--cyber-bg-secondary);
          padding: 16px;
          margin-bottom: 16px;
          border: 1px solid var(--cyber-border);
          border-left: 3px solid var(--cyber-neon-magenta);
          box-shadow: inset 0 0 15px rgba(255, 0, 255, 0.08);
          min-height: 180px;
          position: relative;
        }

        .dpd-barycentric-mini svg {
          filter: drop-shadow(0 0 6px rgba(255, 0, 255, 0.3));
        }

        .dpd-barycentric-mini::before {
          content: 'BARYCENTRIC';
          position: absolute;
          top: 4px;
          left: 8px;
          font-size: 9px;
          color: var(--cyber-neon-magenta);
          font-family: 'Courier New', monospace;
          letter-spacing: 1px;
          opacity: 0.5;
        }

        .dpd-display {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .dpd-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .dpd-label {
          min-width: 80px;
          font-size: 14px;
        }

        .dpd-bar {
          flex: 1;
          height: 12px;
          background: var(--cyber-bg-tertiary);
          border: 1px solid var(--cyber-border);
          overflow: hidden;
          position: relative;
          box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.5);
        }

        .dpd-fill {
          height: 100%;
          transition: all 0.3s ease;
          position: relative;
          box-shadow: 0 0 10px currentColor;
        }

        .dpd-fill::after {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 2px;
          height: 100%;
          background: rgba(255, 255, 255, 0.6);
        }

        .dpd-fill.empathy {
          background: var(--cyber-neon-lime);
        }

        .dpd-fill.coherence {
          background: var(--cyber-neon-cyan);
        }

        .dpd-fill.dissonance {
          background: var(--cyber-neon-yellow);
        }

        .dpd-value {
          min-width: 56px;
          font-size: 14px;
          font-weight: 700;
          color: var(--cyber-text-primary);
          font-family: 'Courier New', 'Consolas', monospace;
        }

        .dpd-label {
          min-width: 100px;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 600;
          color: var(--cyber-text-secondary);
        }

        .dpd-details-button {
          width: 100%;
          margin-top: 12px;
          background: var(--cyber-bg-tertiary);
          border: 2px solid var(--cyber-neon-magenta);
          padding: 8px 12px;
          color: var(--cyber-neon-magenta);
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          text-transform: uppercase;
          letter-spacing: 1px;
          clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px);
          box-shadow: 0 0 8px var(--cyber-glow-magenta);
        }

        .dpd-details-button:hover {
          box-shadow: 0 0 15px var(--cyber-glow-magenta);
          transform: translateY(-1px);
        }

        .current-thought {
          flex-shrink: 0;
        }

        .philosophy {
          flex-shrink: 0;
        }

        .philosophy-content blockquote {
          font-size: 20px;
          font-style: italic;
          margin: 0 0 16px 0;
          color: var(--cyber-neon-cyan);
          border-left: 3px solid var(--cyber-neon-cyan);
          padding-left: 16px;
          text-shadow: 0 0 10px var(--cyber-glow-cyan);
          font-family: 'Courier New', 'Consolas', monospace;
          overflow-wrap: anywhere;
          word-break: break-word;
          white-space: pre-wrap;
          hyphens: auto;
        }

        .philosophy-content p {
          color: var(--cyber-text-secondary);
          line-height: 1.6;
          margin: 0;
          font-family: 'Courier New', 'Consolas', monospace;
          font-size: 13px;
        }

        /* Stage Progression */
        .stage-pipeline {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 12px;
          background: var(--cyber-bg-tertiary);
          border: 1px solid var(--cyber-border);
          border-left: 3px solid var(--cyber-neon-cyan);
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          overflow-y: hidden;
          box-shadow: inset 0 0 15px rgba(0, 255, 255, 0.08);
        }

        .stage-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 32px;
          flex-shrink: 0;
        }

        .stage-circle {
          width: 32px;
          height: 32px;
          border: 2px solid var(--cyber-border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          transition: all 0.3s;
          position: relative;
          background: var(--cyber-bg-secondary);
          clip-path: polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%);
        }

        .stage-circle.active {
          background: var(--cyber-bg-tertiary);
          border-color: var(--cyber-neon-cyan);
          color: var(--cyber-neon-cyan);
          box-shadow: 0 0 15px var(--cyber-glow-cyan), inset 0 0 10px rgba(0, 255, 255, 0.2);
          animation: pulse 1.5s ease-in-out infinite;
          z-index: 2;
        }

        .stage-circle.active::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 120%;
          height: 120%;
          border: 2px solid var(--cyber-neon-cyan);
          clip-path: polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%);
          animation: ripple 1.5s ease-out infinite;
          z-index: -1;
        }

        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 15px var(--cyber-glow-cyan), inset 0 0 10px rgba(0, 255, 255, 0.2);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 25px var(--cyber-glow-cyan), inset 0 0 15px rgba(0, 255, 255, 0.3);
            transform: scale(1.08);
          }
        }

        @keyframes ripple {
          0% {
            opacity: 0.8;
            transform: translate(-50%, -50%) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(1.5);
          }
        }

        .stage-circle.completed {
          background: var(--cyber-bg-tertiary);
          border-color: var(--cyber-neon-lime);
          color: var(--cyber-neon-lime);
          box-shadow: 0 0 10px var(--cyber-glow-lime);
        }

        .stage-circle.pending {
          background: var(--cyber-bg-secondary);
          border-color: var(--cyber-text-dim);
          color: var(--cyber-text-dim);
        }

        .stage-arrow {
          color: var(--cyber-neon-cyan);
          font-size: 14px;
          flex-shrink: 0;
          opacity: 0.4;
        }

        @media (min-width: 1025px) {
          .stage-pipeline {
            gap: 8px;
            padding: 16px;
          }

          .stage-item {
            min-width: 40px;
          }

          .stage-circle {
            width: 40px;
            height: 40px;
            font-size: 14px;
          }
        }

        /* Tablet adjustments */
        @media (min-width: 641px) and (max-width: 1024px) {
          .stat-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        /* Mobile-specific adjustments */
        @media (max-width: 640px) {
          .header-actions {
            flex-direction: column;
            align-items: flex-end;
            gap: 8px;
          }

          .dialogue-button {
            font-size: 12px;
            padding: 6px 12px;
          }

          .status-badge {
            font-size: 11px;
            padding: 4px 8px;
          }

          .stat-grid {
            grid-template-columns: 1fr;
          }

          .activity-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .activity-meta-row {
            width: 100%;
            justify-content: flex-end;
          }

          .dpd-item {
            flex-direction: column;
            gap: 4px;
          }

          /* Stack control buttons vertically on small screens */
          .control-buttons {
            flex-direction: column;
            gap: 8px;
          }

          .control-button {
            width: 100%;
            justify-content: center;
            padding: 10px 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;