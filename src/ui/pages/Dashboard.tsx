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
import '../styles/dashboard.css';

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
    let eventSource: EventSource | null = null;
    let isMounted = true;

    const connectToConsciousness = () => {
      try {
        eventSource = new EventSource('/api/consciousness/events');

        eventSource.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            handleConsciousnessEvent(data);
          } catch (parseError) {
            console.error('Failed to parse consciousness event:', parseError);
          }
        };

        eventSource.onerror = () => {
          // Connection failed - just close, no fallback
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
        };

        return () => {
          isMounted = false;
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
        };
      } catch (error) {
        // Connection failed - no fallback
        return () => {
          isMounted = false;
        };
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
            confidence: data.confidence,
            position: data.position,
            fullThought: data.thought,
            // Include Yui-specific metadata if present
            yuiAgent: data.yuiAgent
          }
        };
        setActivityLog(prev => [logItem, ...prev].slice(0, 50)); // メモリリーク防止: 50件に制限 // Increased limit to 200
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
        setActivityLog(prev => [logItem, ...prev].slice(0, 50)); // メモリリーク防止: 50件に制限
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
        setActivityLog(prev => [logItem, ...prev].slice(0, 50)); // メモリリーク防止: 50件に制限 // Increased limit to 200
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
          setActivityLog(prev => [logItem, ...prev].slice(0, 50)); // メモリリーク防止: 50件に制限
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
        setActivityLog(prev => [logItem, ...prev].slice(0, 50)); // メモリリーク防止: 50件に制限
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
        setActivityLog(prev => [logItem, ...prev].slice(0, 50)); // メモリリーク防止: 50件に制限
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
        setActivityLog(prev => [logItem, ...prev].slice(0, 50)); // メモリリーク防止: 50件に制限
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
        setActivityLog(prev => [logItem, ...prev].slice(0, 50)); // メモリリーク防止: 50件に制限
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
        setActivityLog(prev => [logItem, ...prev].slice(0, 50)); // メモリリーク防止: 50件に制限
      } else if (t === 'consciousnessAwakened') {
        // Consciousness awakened from dormancy
        const logItem: ActivityLogItem = {
          id: `awakened_${Date.now()}`,
          timestamp: data.timestamp || Date.now(),
          type: 'system_event',
          message: `▶️ Awakened from dormancy (Energy: ${data.currentEnergy?.toFixed(1)})`
        };
        setActivityLog(prev => [logItem, ...prev].slice(0, 50)); // メモリリーク防止: 50件に制限

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

    // Stage agents (S2, S3, S4, S5, S6, U)
    if (agentName.toLowerCase().includes('compiler') || agentName.toLowerCase().includes('synthesizer')) return 'compiler';
    if (agentName.toLowerCase().includes('scribe')) return 'scribe';
    if (agentName.toLowerCase().includes('auditor')) return 'auditor';
    if (agentName.toLowerCase().includes('dpd-evaluator') || agentName.toLowerCase().includes('dpd-assessor')) return 'dpd-evaluator';
    if (agentName.toLowerCase().includes('weight-updater') || agentName.toLowerCase().includes('weight updater')) return 'weight-updater';

    // System messages
    if (agentName.toLowerCase().includes('system')) return 'system';

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
            <span className="status-cycles">{stats.thoughtCycles} cycles</span>
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
              opacity: currentThought ? [1, 0.7, 1] : 0.5
            }}
            transition={{
              duration: stats.energyLevel < 20 ? 5.0 : stats.energyLevel < 50 ? 4.0 : 3.0,
              repeat: currentThought ? Infinity : 0,
              ease: [0.4, 0.0, 0.6, 1.0]
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
    </div>
  );
};

export default Dashboard;