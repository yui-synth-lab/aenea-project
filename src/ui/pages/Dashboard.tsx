/**
 * Dashboard Component
 * ダッシュボードコンポーネント
 */

import React, { useState, useEffect } from 'react';
import { DialogueModal } from '../components/DialogueModal.js';
import { GrowthModal } from '../components/GrowthModal.js';
import { DPDScoreDisplay } from '../components/DPDScoreDisplay.js';

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
        return () => {};
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

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Consciousness Dashboard</h2>
        <div className="header-actions">
          <button className="dialogue-button" onClick={() => setIsDialogueModalOpen(true)}>
            💬 Dialogue
          </button>
          <div className="system-status" style={{ color: getStatusColor(systemStatus) }}>
            <span className="status-dot" style={{ backgroundColor: getStatusColor(systemStatus) }} />
            System {systemStatus}
          </div>
        </div>
      </div>

      <div className="dashboard-layout">
        {/* Consciousness Control */}
        <div className="dashboard-card consciousness-control">
            <h3>Consciousness Control</h3>
            <div className="control-status">
              <div className="status-display">
                <span className={`status-indicator ${consciousnessState.status}`}>
                  <span className="status-dot"></span>
                  <span className="status-text">
                    {consciousnessState.isPaused ? 'Paused' :
                     consciousnessState.isRunning ? 'Running' : 'Stopped'}
                  </span>
                </span>
              </div>
            </div>
            <div className="control-buttons">
              {!consciousnessState.isRunning ? (
                <>
                  <button
                    className="control-button start"
                    onClick={startConsciousness}
                    disabled={consciousnessState.isProcessingCycle}
                  >
                    ▶️ Start Consciousness
                  </button>
                  <button
                    className="control-button sleep"
                    onClick={enterSleepMode}
                    disabled={consciousnessState.isProcessingCycle}
                  >
                    💤 Sleep
                  </button>
                </>
              ) : consciousnessState.isPaused ? (
                <>
                  <button
                    className="control-button resume"
                    onClick={resumeConsciousness}
                  >
                    ▶️ Resume
                  </button>
                  <button
                    className="control-button stop"
                    onClick={stopConsciousness}
                  >
                    ⏹️ Stop
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="control-button pause"
                    onClick={pauseConsciousness}
                  >
                    ⏸️ Pause
                  </button>
                  <button
                    className="control-button stop"
                    onClick={stopConsciousness}
                  >
                    ⏹️ Stop
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Manual Trigger */}
          <div className="dashboard-card manual-trigger">
            <h3>Manual Trigger</h3>
            {queuedTrigger && (
              <div className="queued-trigger-notice">
                📥 Queued for next cycle: "{queuedTrigger.substring(0, 80)}..."
              </div>
            )}
            <div className="trigger-controls">
              <textarea
                placeholder="Enter a question to trigger consciousness..."
                className="trigger-input"
                rows={3}
                value={manualQuestion}
                onChange={(e) => setManualQuestion(e.target.value)}
              />
              <button
                className="trigger-button"
                onClick={triggerManualThought}
                disabled={!manualQuestion.trim()}
              >
                {queuedTrigger ? 'Queue Another Trigger' : 'Queue for Next Cycle'}
              </button>
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

          {/* DPD Scores - Simple Display */}
          <div className="dashboard-card dpd-scores">
            <h3>Dynamic Prime Directive</h3>
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
        <div className="dashboard-card current-thought">
            <h3>Current Thought</h3>
            <div className="thought-content">
              <p>"{currentThought}"</p>
            </div>
          </div>

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
                        className={`stage-circle ${
                          currentStage === stage ? 'active' :
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
                activityLog.map((item) => (
                  <div key={item.id} className="activity-item">
                    <span className="activity-time">{formatActivityTime(item.timestamp)}</span>
                    {item.agent ? (
                      <span className={`activity-agent ${getAgentCssClass(item.agent)}`}>{item.agent}</span>
                    ) : (
                      <span className="activity-system">System</span>
                    )}
                    <div className="activity-text">
                      {item.message}
                    </div>
                    {item.details?.confidence && (
                      <span className="activity-confidence">
                        {Math.round(item.details.confidence * 100)}%
                      </span>
                    )}
                  </div>
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
        /* Mobile-first base styles */
        .dashboard {
          padding: 16px;
          background: #111827;
          min-height: 100vh;
          color: #f9fafb;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .dashboard-header h2 {
          font-size: 24px;
          font-weight: 700;
          margin: 0;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .dialogue-button,
        .growth-button {
          border: none;
          border-radius: 8px;
          padding: 8px 16px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .dialogue-button {
          background: #059669;
        }

        .dialogue-button:hover {
          background: #047857;
          transform: translateY(-1px);
        }

        .growth-button {
          background: #8b5cf6;
        }

        .growth-button:hover {
          background: #7c3aed;
          transform: translateY(-1px);
        }

        .system-status {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
        }

        .status-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
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

          .system-status {
            font-size: 16px;
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
          background: #1f2937;
          border-radius: 12px;
          padding: 24px;
          border: 1px solid #374151;
        }

        .dashboard-card h3 {
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 16px 0;
          color: #f9fafb;
        }

        .consciousness-control {
          background: #1e40af;
          border: 1px solid #3b82f6;
          padding: 12px;
        }

        .consciousness-control h3 {
          margin: 0 0 8px 0;
          font-size: 15px;
        }

        /* Make the Consciousness Control card more compact on larger screens */
        @media (min-width: 1025px) {
          .consciousness-control {
            overflow: hidden;
            display: flex;
            flex-direction: column;
            padding: 12px;
          }

          .consciousness-control h3 {
            margin: 0 0 6px 0;
            font-size: 14px;
          }

          .consciousness-control .control-status {
            margin-bottom: 6px;
          }

          .control-buttons {
            gap: 4px;
            margin-top: 0;
            display: flex;
            flex-direction: column;
            overflow-y: auto;
          }

          .control-button {
            padding: 5px 8px;
            font-size: 11px;
          }
        }

        .control-status {
          margin-bottom: 8px;
        }

        .status-display {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 12px;
        }

        .status-indicator.stopped {
          background: #374151;
          color: #9ca3af;
        }

        .status-indicator.active {
          background: #064e3b;
          color: #10b981;
        }

        .status-indicator.paused {
          background: #451a03;
          color: #f59e0b;
        }

        .status-indicator .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: currentColor;
        }

        .control-buttons {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .control-button {
          background: #3b82f6;
          border: none;
          border-radius: 6px;
          padding: 8px 12px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 13px;
        }

        .control-button:hover {
          background: #2563eb;
          transform: translateY(-1px);
        }

        .control-button:disabled {
          background: #6b7280;
          cursor: not-allowed;
          transform: none;
        }

        .control-button.start {
          background: #059669;
        }

        .control-button.start:hover {
          background: #047857;
        }

        .control-button.pause {
          background: #d97706;
        }

        .control-button.pause:hover {
          background: #b45309;
        }

        .control-button.resume {
          background: #059669;
        }

        .control-button.resume:hover {
          background: #047857;
        }

        .control-button.stop {
          background: #dc2626;
        }

        .control-button.stop:hover {
          background: #b91c1c;
        }

        .manual-trigger {
          background: #1e3a8a;
          border: 1px solid #3b82f6;
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
          background: #374151;
          border: 1px solid #4b5563;
          border-radius: 8px;
          padding: 12px;
          color: #f9fafb;
          font-family: inherit;
          resize: vertical;
          min-height: 80px;
        }

        .trigger-input::placeholder {
          color: #9ca3af;
        }

        .trigger-button {
          background: #3b82f6;
          border: none;
          border-radius: 8px;
          padding: 12px 16px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .trigger-button:hover:not(:disabled) {
          background: #2563eb;
        }

        .trigger-button:disabled {
          background: #6b7280;
          cursor: not-allowed;
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
          display: grid;
          grid-template-rows: auto auto 1fr auto;
          gap: 6px;
          align-items: center;
          padding: 8px 12px;
          background: #374151;
          border-radius: 6px;
          font-size: 14px;
          flex-shrink: 0;
        }

        .activity-time {
          color: #9ca3af;
          font-family: 'Courier New', monospace;
          font-size: 12px;
        }

        .activity-agent {
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
        }

        .activity-agent.theoria {
          background: #1e40af;
          color: #dbeafe;
        }

        .activity-agent.pathia {
          background: #059669;
          color: #d1fae5;
        }

        .activity-agent.kinesis {
          background: #7c2d12;
          color: #fed7aa;
        }

        /* Yui Protocol Agents - Official colors */
        .activity-agent.yui-eiro {
          background: #5B7DB1;
          color: #ffffff;
          border: 2px solid #5B7DB1;
          box-shadow: 0 0 8px rgba(91, 125, 177, 0.4);
        }

        .activity-agent.yui-hekito {
          background: #2ECCB3;
          color: #ffffff;
          border: 2px solid #2ECCB3;
          box-shadow: 0 0 8px rgba(46, 204, 179, 0.4);
        }

        .activity-agent.yui-kanshi {
          background: #C0392B;
          color: #ffffff;
          border: 2px solid #C0392B;
          box-shadow: 0 0 8px rgba(192, 57, 43, 0.4);
        }

        .activity-agent.yui-yoga {
          background: #F7C873;
          color: #000000;
          border: 2px solid #F7C873;
          box-shadow: 0 0 8px rgba(247, 200, 115, 0.4);
        }

        .activity-agent.yui-yui {
          background: #E18CB0;
          color: #ffffff;
          border: 2px solid #E18CB0;
          box-shadow: 0 0 8px rgba(225, 140, 176, 0.4);
        }

        /* System and Stage agents */
        .activity-agent.system {
          background: #6b7280;
          color: #f3f4f6;
          border: 2px solid #6b7280;
        }

        .activity-agent.compiler {
          background: #8b5cf6;
          color: #ffffff;
          border: 2px solid #8b5cf6;
          box-shadow: 0 0 8px rgba(139, 92, 246, 0.4);
        }

        .activity-agent.scribe {
          background: #14b8a6;
          color: #ffffff;
          border: 2px solid #14b8a6;
          box-shadow: 0 0 8px rgba(20, 184, 166, 0.4);
        }

        .activity-agent.auditor {
          background: #f59e0b;
          color: #000000;
          border: 2px solid #f59e0b;
          box-shadow: 0 0 8px rgba(245, 158, 11, 0.4);
        }

        .activity-system {
          background: #6b7280;
          color: #f3f4f6;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
        }

        .activity-text {
          color: #e5e7eb;
          line-height: 1.4;
          /* Ensure long/continuous text wraps and doesn't overflow the activity card */
          overflow-wrap: anywhere;
          word-break: break-word;
          white-space: pre-wrap; /* preserve user line breaks while allowing wrapping */
          hyphens: auto;
        }

        .activity-confidence {
          color: #3b82f6;
          font-size: 12px;
          font-weight: 600;
          background: #1e3a8a;
          padding: 2px 6px;
          border-radius: 3px;
        }

        .thought-content {
          background: #374151;
          padding: 16px;
          border-radius: 8px;
          border-left: 4px solid #3b82f6;
          /* Allow vertical scrolling when content exceeds the fixed max-height */
          overflow: auto;
        }

        .thought-content p {
          font-style: italic;
          font-size: 16px;
          line-height: 1.6;
          margin: 0;
          color: #e5e7eb;
          /* Prevent long words (or Japanese text without natural spaces) from breaking layout */
          overflow-wrap: anywhere;
          word-break: break-word;
          white-space: pre-wrap;
          hyphens: auto;
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
          font-size: 32px;
          font-weight: 700;
          color: #3b82f6;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 14px;
          color: #9ca3af;
        }

        .energy-display {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .energy-bar {
          flex: 1;
          height: 20px;
          background: #374151;
          border-radius: 10px;
          overflow: hidden;
        }

        .energy-fill {
          height: 100%;
          transition: all 0.3s ease;
        }

        .energy-percentage {
          font-weight: 600;
          min-width: 48px;
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
          height: 8px;
          background: #374151;
          border-radius: 4px;
          overflow: hidden;
        }

        .dpd-fill {
          height: 100%;
          transition: all 0.3s ease;
        }

        .dpd-fill.empathy {
          background: #10b981;
        }

        .dpd-fill.coherence {
          background: #3b82f6;
        }

        .dpd-fill.dissonance {
          background: #f59e0b;
        }

        .dpd-value {
          min-width: 48px;
          font-size: 14px;
          font-weight: 600;
        }

        .dpd-details-button {
          width: 100%;
          margin-top: 12px;
          background: #374151;
          border: 1px solid #4b5563;
          border-radius: 6px;
          padding: 8px 12px;
          color: #e5e7eb;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .dpd-details-button:hover {
          background: #4b5563;
          border-color: #6b7280;
        }

        .current-thought {
          flex-shrink: 0;
          max-height: 120px;
        }

        .philosophy {
          flex-shrink: 0;
          max-height: 140px;
          /* allow scrolling when philosophy text is long */
          overflow: auto;
        }

        .philosophy-content blockquote {
          font-size: 24px;
          font-style: italic;
          margin: 0 0 16px 0;
          color: #3b82f6;
          border-left: 4px solid #3b82f6;
          padding-left: 16px;
          /* Ensure long single-line strings wrap in blockquote */
          overflow-wrap: anywhere;
          word-break: break-word;
          white-space: pre-wrap;
          hyphens: auto;
        }

        .philosophy-content p {
          color: #d1d5db;
          line-height: 1.6;
          margin: 0;
        }

        /* Stage Progression */
        .stage-pipeline {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 12px;
          background: #374151;
          border-radius: 8px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          overflow-y: hidden;
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
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          transition: all 0.3s;
          position: relative;
        }

        .stage-circle.active {
          background: #3b82f6;
          color: white;
          box-shadow: 0 0 12px rgba(59, 130, 246, 0.8), 0 0 24px rgba(59, 130, 246, 0.4);
          animation: pulse 1.5s ease-in-out infinite;
          z-index: 2;
        }

        .stage-circle.active::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 3px solid #60a5fa;
          animation: ripple 1.5s ease-out infinite;
          z-index: -1;
        }

        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 12px rgba(59, 130, 246, 0.8), 0 0 24px rgba(59, 130, 246, 0.4);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 20px rgba(59, 130, 246, 1), 0 0 40px rgba(59, 130, 246, 0.6);
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
            transform: translate(-50%, -50%) scale(1.8);
          }
        }

        .stage-circle.completed {
          background: #10b981;
          color: white;
        }

        .stage-circle.pending {
          background: #6b7280;
          color: white;
        }

        .stage-arrow {
          color: #9ca3af;
          font-size: 16px;
          flex-shrink: 0;
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

          .system-status {
            font-size: 12px;
          }

          .stat-grid {
            grid-template-columns: 1fr;
          }

          .activity-item {
            grid-template-rows: auto 1fr;
            gap: 8px;
          }

          .activity-time {
            grid-row: 1 / 2;
          }

          .activity-confidence {
            grid-row: 2 / 3;
            justify-self: start;
          }

          .dpd-item {
            flex-direction: column;
            gap: 4px;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;