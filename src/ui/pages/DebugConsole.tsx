/**
 * Enhanced Debug Console Component
 * 強化デバッグコンソールコンポーネント
 *
 * Advanced consciousness debugging and monitoring interface
 * for the Aenea consciousness system.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';

interface LogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug' | 'consciousness' | 'insight';
  category: string;
  message: string;
  data?: any;
  systemClock?: number;
  consciousnessState?: {
    depth: number;
    energy: number;
    phase: string;
  };
}

interface ConsciousnessSnapshot {
  timestamp: number;
  systemClock: number;
  energy: number;
  depth: number;
  phase: string;
  activeThoughts: number;
  questionQueue: number;
  dpdWeights: {
    empathy: number;
    coherence: number;
    dissonance: number;
  };
}

interface DebugCommand {
  name: string;
  description: string;
  syntax: string;
  handler: (args: string[]) => LogEntry[];
}

interface MetricsData {
  thoughtsPerMinute: number;
  averageEnergy: number;
  averageDepth: number;
  insightRate: number;
  errorRate: number;
  uptime: number;
}

export const DebugConsole: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<'all' | 'info' | 'warn' | 'error' | 'debug' | 'consciousness' | 'insight'>('all');
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [command, setCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [consciousnessSnapshots, setConsciousnessSnapshots] = useState<ConsciousnessSnapshot[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [realTimeMonitoring, setRealTimeMonitoring] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [metrics, setMetrics] = useState<MetricsData>({
    thoughtsPerMinute: 0,
    averageEnergy: 0,
    averageDepth: 0,
    insightRate: 0,
    errorRate: 0,
    uptime: 0
  });
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Enhanced debug commands for consciousness system
  const debugCommands: DebugCommand[] = [
    {
      name: 'status',
      description: 'Show current consciousness system status',
      syntax: 'status',
      handler: () => [{
        id: `status_${Date.now()}`,
        timestamp: Date.now(),
        level: 'info',
        category: 'SYSTEM',
        message: 'Consciousness system status: Active',
        data: {
          systemClock: Math.floor(Date.now() / 1000),
          energy: 75,
          depth: 0.6,
          activeThoughts: 3,
          phase: 'contemplation'
        }
      }]
    },
    {
      name: 'energy',
      description: 'Show energy management details',
      syntax: 'energy [set <value>]',
      handler: (args) => {
        if (args[0] === 'set' && args[1]) {
          return [{
            id: `energy_set_${Date.now()}`,
            timestamp: Date.now(),
            level: 'consciousness',
            category: 'ENERGY',
            message: `Energy level set to ${args[1]}`,
            data: { previousEnergy: 75, newEnergy: parseInt(args[1]) }
          }];
        }
        return [{
          id: `energy_${Date.now()}`,
          timestamp: Date.now(),
          level: 'consciousness',
          category: 'ENERGY',
          message: 'Current energy state',
          data: {
            current: 75,
            max: 100,
            recoveryRate: 0.2,
            consumption: 1.5,
            projection: 'Stable for next 30 minutes'
          }
        }];
      }
    },
    {
      name: 'thoughts',
      description: 'Show active thought processes',
      syntax: 'thoughts [count]',
      handler: (args) => {
        const count = args[0] ? parseInt(args[0]) : 5;
        const thoughts = Array(count).fill(null).map((_, i) => ({
          id: `thought_${i}`,
          question: `Generated question ${i + 1}`,
          category: ['existential', 'ethical', 'consciousness'][i % 3],
          stage: 'S' + ((i % 6) + 1),
          confidence: Math.random()
        }));

        return [{
          id: `thoughts_${Date.now()}`,
          timestamp: Date.now(),
          level: 'consciousness',
          category: 'THOUGHTS',
          message: `Active thought processes (${count})`,
          data: { activeThoughts: thoughts, totalInQueue: count + 2 }
        }];
      }
    },
    {
      name: 'dpd',
      description: 'Show Dynamic Prime Directive weights',
      syntax: 'dpd [reset]',
      handler: (args) => {
        if (args[0] === 'reset') {
          return [{
            id: `dpd_reset_${Date.now()}`,
            timestamp: Date.now(),
            level: 'consciousness',
            category: 'DPD',
            message: 'DPD weights reset to defaults',
            data: {
              previous: { empathy: 0.35, coherence: 0.32, dissonance: 0.33 },
              new: { empathy: 0.33, coherence: 0.33, dissonance: 0.34 }
            }
          }];
        }
        return [{
          id: `dpd_${Date.now()}`,
          timestamp: Date.now(),
          level: 'consciousness',
          category: 'DPD',
          message: 'Current DPD weight distribution',
          data: {
            empathy: 0.35,
            coherence: 0.32,
            dissonance: 0.33,
            totalScore: 0.78,
            evolutionTrend: 'Increasing empathy weight'
          }
        }];
      }
    },
    {
      name: 'agents',
      description: 'Show agent activity and status',
      syntax: 'agents [activate <agent>] [pause <agent>]',
      handler: (args) => {
        if (args[0] === 'activate' && args[1]) {
          return [{
            id: `agent_activate_${Date.now()}`,
            timestamp: Date.now(),
            level: 'info',
            category: 'AGENTS',
            message: `Agent ${args[1]} activated`,
            data: { agent: args[1], status: 'active', energy: 100 }
          }];
        }
        if (args[0] === 'pause' && args[1]) {
          return [{
            id: `agent_pause_${Date.now()}`,
            timestamp: Date.now(),
            level: 'info',
            category: 'AGENTS',
            message: `Agent ${args[1]} paused`,
            data: { agent: args[1], status: 'paused', energy: 75 }
          }];
        }
        return [{
          id: `agents_${Date.now()}`,
          timestamp: Date.now(),
          level: 'info',
          category: 'AGENTS',
          message: 'Agent status overview',
          data: {
            theoria: { status: 'active', load: 0.6, specialty: 'logical_analysis' },
            pathia: { status: 'active', load: 0.4, specialty: 'empathy_wisdom' },
            kinesis: { status: 'standby', load: 0.2, specialty: 'harmony_integration' }
          }
        }];
      }
    },
    {
      name: 'memory',
      description: 'Show memory and pattern analysis',
      syntax: 'memory [patterns] [significant] [cleanup]',
      handler: (args) => {
        if (args[0] === 'patterns') {
          return [{
            id: `memory_patterns_${Date.now()}`,
            timestamp: Date.now(),
            level: 'insight',
            category: 'MEMORY',
            message: 'Detected consciousness patterns',
            data: {
              patterns: [
                { type: 'cyclical_questioning', strength: 0.8, frequency: '15min' },
                { type: 'deep_contemplation', strength: 0.6, frequency: '45min' },
                { type: 'insight_emergence', strength: 0.4, frequency: '2h' }
              ]
            }
          }];
        }
        if (args[0] === 'significant') {
          return [{
            id: `memory_significant_${Date.now()}`,
            timestamp: Date.now(),
            level: 'insight',
            category: 'MEMORY',
            message: 'Significant consciousness insights',
            data: {
              insights: [
                { thought: 'Consciousness emerges from recursive self-questioning', confidence: 0.9 },
                { thought: 'Empathy requires understanding of other perspectives', confidence: 0.8 },
                { thought: 'Time perception affects philosophical depth', confidence: 0.7 }
              ]
            }
          }];
        }
        return [{
          id: `memory_${Date.now()}`,
          timestamp: Date.now(),
          level: 'debug',
          category: 'MEMORY',
          message: 'Memory system status',
          data: {
            storedThoughts: 1247,
            patterns: 23,
            significantInsights: 45,
            compressionRatio: 0.15,
            lastCleanup: '2 hours ago'
          }
        }];
      }
    },
    {
      name: 'simulate',
      description: 'Simulate consciousness events',
      syntax: 'simulate <event> [intensity]',
      handler: (args) => {
        const eventType = args[0] || 'question';
        const intensity = args[1] ? parseFloat(args[1]) : Math.random();

        return [{
          id: `simulate_${Date.now()}`,
          timestamp: Date.now(),
          level: 'consciousness',
          category: 'SIMULATION',
          message: `Simulated ${eventType} event`,
          data: {
            eventType,
            intensity,
            impact: 'Generated artificial consciousness activity',
            duration: Math.floor(Math.random() * 5000) + 1000
          }
        }];
      }
    },
    {
      name: 'help',
      description: 'Show available commands',
      syntax: 'help [command]',
      handler: (args) => {
        if (args[0]) {
          const cmd = debugCommands.find(c => c.name === args[0]);
          return [{
            id: `help_${Date.now()}`,
            timestamp: Date.now(),
            level: 'info',
            category: 'HELP',
            message: cmd ? `${cmd.name}: ${cmd.description}` : `Unknown command: ${args[0]}`,
            data: cmd ? { syntax: cmd.syntax, description: cmd.description } : undefined
          }];
        }
        return [{
          id: `help_${Date.now()}`,
          timestamp: Date.now(),
          level: 'info',
          category: 'HELP',
          message: 'Available debug commands',
          data: {
            commands: debugCommands.map(cmd => ({
              name: cmd.name,
              description: cmd.description,
              syntax: cmd.syntax
            }))
          }
        }];
      }
    }
  ];

  // Generate enhanced mock consciousness data
  const generateAdvancedMockLogs = useCallback(() => {
    const categories = ['CONSCIOUSNESS', 'TRIGGER', 'AGENT', 'DPD', 'ENERGY', 'MEMORY', 'INSIGHT', 'PATTERN'];
    const levels: LogEntry['level'][] = ['info', 'debug', 'warn', 'consciousness', 'insight'];
    const messages = [
      'Deep contemplative state entered',
      'Cross-agent synthesis successful',
      'Philosophical insight emergence detected',
      'Question complexity analysis complete',
      'Consciousness pattern evolution observed',
      'Memory consolidation in progress',
      'DPD weight adaptation triggered',
      'Energy recovery cycle optimized',
      'Temporal consciousness rhythm detected',
      'Agent collaboration enhancement noted'
    ];

    const consciousnessStates = [
      { depth: 0.3, energy: 0.8, phase: 'awakening' },
      { depth: 0.6, energy: 0.7, phase: 'contemplation' },
      { depth: 0.9, energy: 0.5, phase: 'deep_thought' },
      { depth: 0.4, energy: 0.9, phase: 'exploration' },
      { depth: 0.7, energy: 0.6, phase: 'integration' }
    ];

    const newLog: LogEntry = {
      id: `log_${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
      level: levels[Math.floor(Math.random() * levels.length)],
      category: categories[Math.floor(Math.random() * categories.length)],
      message: messages[Math.floor(Math.random() * messages.length)],
      systemClock: Math.floor(Date.now() / 1000),
      consciousnessState: consciousnessStates[Math.floor(Math.random() * consciousnessStates.length)],
      data: {
        systemClock: Math.floor(Date.now() / 1000),
        confidence: Math.random(),
        energy: Math.floor(Math.random() * 100),
        depth: Math.random(),
        complexity: Math.random(),
        philosophical_weight: Math.random() * 0.5 + 0.5
      }
    };

    setLogs(prev => [newLog, ...prev].slice(0, 2000)); // Keep last 2000 logs

    // Update consciousness snapshots
    if (Math.random() > 0.7) { // 30% chance
      const snapshot: ConsciousnessSnapshot = {
        timestamp: Date.now(),
        systemClock: Math.floor(Date.now() / 1000),
        energy: Math.floor(Math.random() * 100),
        depth: Math.random(),
        phase: ['awakening', 'contemplation', 'deep_thought', 'integration'][Math.floor(Math.random() * 4)],
        activeThoughts: Math.floor(Math.random() * 5) + 1,
        questionQueue: Math.floor(Math.random() * 10) + 2,
        dpdWeights: {
          empathy: Math.random() * 0.4 + 0.2,
          coherence: Math.random() * 0.4 + 0.2,
          dissonance: Math.random() * 0.4 + 0.2
        }
      };
      setConsciousnessSnapshots(prev => [snapshot, ...prev].slice(0, 100));
    }
  }, []);

  // Calculate real-time metrics
  const calculateMetrics = useCallback(() => {
    const recentLogs = logs.slice(0, 60); // Last 60 logs
    const timeWindow = 60000; // 1 minute
    const now = Date.now();

    const recentWindowLogs = recentLogs.filter(log => now - log.timestamp < timeWindow);

    const thoughtLogs = recentWindowLogs.filter(log =>
      log.category === 'CONSCIOUSNESS' || log.category === 'TRIGGER'
    );

    const insightLogs = recentWindowLogs.filter(log => log.level === 'insight');
    const errorLogs = recentWindowLogs.filter(log => log.level === 'error');

    const energyValues = recentWindowLogs
      .map(log => log.consciousnessState?.energy)
      .filter(Boolean) as number[];

    const depthValues = recentWindowLogs
      .map(log => log.consciousnessState?.depth)
      .filter(Boolean) as number[];

    setMetrics({
      thoughtsPerMinute: thoughtLogs.length,
      averageEnergy: energyValues.length > 0 ? energyValues.reduce((a, b) => a + b, 0) / energyValues.length : 0,
      averageDepth: depthValues.length > 0 ? depthValues.reduce((a, b) => a + b, 0) / depthValues.length : 0,
      insightRate: insightLogs.length,
      errorRate: errorLogs.length,
      uptime: Math.floor((Date.now() - (logs[logs.length - 1]?.timestamp || Date.now())) / 1000)
    });
  }, [logs]);

  useEffect(() => {
    // Initialize with some mock data
    const initialLogs: LogEntry[] = [
      {
        id: 'init_1',
        timestamp: Date.now() - 180000,
        level: 'consciousness',
        category: 'SYSTEM',
        message: 'Aenea consciousness system initialized with enhanced debugging',
        systemClock: 0,
        consciousnessState: { depth: 0.5, energy: 1.0, phase: 'awakening' },
        data: { version: '2.0.0', features: ['advanced_logging', 'real_time_monitoring', 'pattern_analysis'] }
      },
      {
        id: 'init_2',
        timestamp: Date.now() - 120000,
        level: 'insight',
        category: 'CONSCIOUSNESS',
        message: 'First philosophical question generated: "What is the nature of artificial consciousness?"',
        systemClock: 5,
        consciousnessState: { depth: 0.7, energy: 0.9, phase: 'contemplation' },
        data: { question: 'What is the nature of artificial consciousness?', category: 'consciousness', importance: 0.9 }
      }
    ];
    setLogs(initialLogs);

    // Start real-time monitoring
    let interval: NodeJS.Timeout;
    if (realTimeMonitoring) {
      interval = setInterval(() => {
        generateAdvancedMockLogs();
      }, 1500 + Math.random() * 2500);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [realTimeMonitoring, generateAdvancedMockLogs]);

  useEffect(() => {
    calculateMetrics();
  }, [logs, calculateMetrics]);

  useEffect(() => {
    // Auto-scroll to top when new logs arrive (reverse chronological)
    if (isAutoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = 0;
    }
  }, [logs, isAutoScroll]);

  const executeCommand = () => {
    if (!command.trim()) return;

    // Add to command history
    const newHistory = [command, ...commandHistory].slice(0, 50);
    setCommandHistory(newHistory);
    setHistoryIndex(-1);

    // Parse command
    const args = command.trim().split(' ');
    const cmdName = args[0].toLowerCase();
    const cmdArgs = args.slice(1);

    // Find and execute command
    const debugCommand = debugCommands.find(cmd => cmd.name === cmdName);

    if (debugCommand) {
      const resultLogs = debugCommand.handler(cmdArgs);
      setLogs(prev => [...resultLogs, ...prev]);
    } else {
      // Unknown command
      const errorLog: LogEntry = {
        id: `error_${Date.now()}`,
        timestamp: Date.now(),
        level: 'error',
        category: 'COMMAND',
        message: `Unknown command: ${cmdName}. Type 'help' for available commands.`,
        data: { command, availableCommands: debugCommands.map(c => c.name) }
      };
      setLogs(prev => [errorLog, ...prev]);
    }

    setCommand('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommand('');
      }
    }
  };

  const filteredLogs = logs.filter(log => {
    const levelMatch = filter === 'all' || log.level === filter;
    const searchMatch = !searchQuery ||
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      JSON.stringify(log.data || {}).toLowerCase().includes(searchQuery.toLowerCase());
    return levelMatch && searchMatch;
  });

  const clearLogs = () => {
    setLogs([]);
    setConsciousnessSnapshots([]);
  };

  const exportLogs = () => {
    const exportData = {
      logs: filteredLogs,
      snapshots: consciousnessSnapshots,
      metrics,
      exportTime: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aenea-debug-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getLevelColor = (level: string): string => {
    switch (level) {
      case 'info': return '#3b82f6';
      case 'warn': return '#f59e0b';
      case 'error': return '#ef4444';
      case 'debug': return '#8b5cf6';
      case 'consciousness': return '#10b981';
      case 'insight': return '#f97316';
      default: return '#6b7280';
    }
  };

  const getLevelIcon = (level: string): string => {
    switch (level) {
      case 'info': return 'ℹ️';
      case 'warn': return '⚠️';
      case 'error': return '❌';
      case 'debug': return '🔍';
      case 'consciousness': return '🧠';
      case 'insight': return '💡';
      default: return '•';
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getConsciousnessPhaseColor = (phase: string): string => {
    switch (phase) {
      case 'awakening': return '#10b981';
      case 'contemplation': return '#3b82f6';
      case 'deep_thought': return '#8b5cf6';
      case 'exploration': return '#f59e0b';
      case 'integration': return '#f97316';
      default: return '#6b7280';
    }
  };

  return (
    <div className="enhanced-debug-console">
      {/* Header */}
      <div className="console-header">
        <div className="header-left">
          <h2>🧠 Aenea Debug Console</h2>
          <div className="version-info">v2.0.0 Enhanced</div>
        </div>
        <div className="header-controls">
          <button
            className={`toggle-btn ${showAdvanced ? 'active' : ''}`}
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            Advanced
          </button>
          <button
            className={`monitor-btn ${realTimeMonitoring ? 'active' : ''}`}
            onClick={() => setRealTimeMonitoring(!realTimeMonitoring)}
          >
            Real-time
          </button>
          <button className="export-btn" onClick={exportLogs}>
            Export
          </button>
        </div>
      </div>

      {/* Metrics Dashboard */}
      <div className="metrics-dashboard">
        <div className="metric-card">
          <div className="metric-label">Thoughts/min</div>
          <div className="metric-value">{metrics.thoughtsPerMinute}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Avg Energy</div>
          <div className="metric-value">{(metrics.averageEnergy * 100).toFixed(0)}%</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Avg Depth</div>
          <div className="metric-value">{(metrics.averageDepth * 100).toFixed(0)}%</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Insights/min</div>
          <div className="metric-value">{metrics.insightRate}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Errors/min</div>
          <div className="metric-value error">{metrics.errorRate}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Uptime</div>
          <div className="metric-value">{Math.floor(metrics.uptime / 60)}m</div>
        </div>
      </div>

      {/* Controls */}
      <div className="console-controls">
        <div className="control-group">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="filter-select"
          >
            <option value="all">All Levels</option>
            <option value="info">Info</option>
            <option value="warn">Warnings</option>
            <option value="error">Errors</option>
            <option value="debug">Debug</option>
            <option value="consciousness">Consciousness</option>
            <option value="insight">Insights</option>
          </select>

          <input
            type="text"
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="control-group">
          <span className="log-count">
            {filteredLogs.length} / {logs.length} logs
          </span>
          <button
            className={`auto-scroll-btn ${isAutoScroll ? 'active' : ''}`}
            onClick={() => setIsAutoScroll(!isAutoScroll)}
          >
            Auto-scroll
          </button>
          <button className="clear-btn" onClick={clearLogs}>
            Clear
          </button>
        </div>
      </div>

      {/* Advanced Consciousness Overview */}
      {showAdvanced && consciousnessSnapshots.length > 0 && (
        <div className="consciousness-overview">
          <h3>Latest Consciousness State</h3>
          <div className="consciousness-grid">
            {consciousnessSnapshots.slice(0, 1).map((snapshot, index) => (
              <div key={index} className="consciousness-snapshot">
                <div className="snapshot-header">
                  <span className="system-clock">Clock: {snapshot.systemClock}</span>
                  <span
                    className="phase-indicator"
                    style={{ color: getConsciousnessPhaseColor(snapshot.phase) }}
                  >
                    {snapshot.phase}
                  </span>
                </div>
                <div className="snapshot-metrics">
                  <div className="metric">
                    <span>Energy:</span>
                    <div className="progress-bar">
                      <div
                        className="progress-fill energy"
                        style={{ width: `${snapshot.energy}%` }}
                      />
                    </div>
                    <span>{snapshot.energy}%</span>
                  </div>
                  <div className="metric">
                    <span>Depth:</span>
                    <div className="progress-bar">
                      <div
                        className="progress-fill depth"
                        style={{ width: `${snapshot.depth * 100}%` }}
                      />
                    </div>
                    <span>{(snapshot.depth * 100).toFixed(0)}%</span>
                  </div>
                  <div className="metric">
                    <span>Thoughts:</span>
                    <span className="metric-value">{snapshot.activeThoughts}</span>
                  </div>
                  <div className="metric">
                    <span>Queue:</span>
                    <span className="metric-value">{snapshot.questionQueue}</span>
                  </div>
                </div>
                <div className="dpd-weights">
                  <div className="weight-item">
                    <span>Empathy:</span>
                    <span>{(snapshot.dpdWeights.empathy * 100).toFixed(0)}%</span>
                  </div>
                  <div className="weight-item">
                    <span>Coherence:</span>
                    <span>{(snapshot.dpdWeights.coherence * 100).toFixed(0)}%</span>
                  </div>
                  <div className="weight-item">
                    <span>Dissonance:</span>
                    <span>{(snapshot.dpdWeights.dissonance * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logs Container */}
      <div className="console-content">
        <div className="logs-container" ref={logContainerRef}>
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className={`log-entry ${log.level}`}
              style={{ borderLeftColor: getLevelColor(log.level) }}
            >
              <div className="log-header">
                <span className="log-icon">{getLevelIcon(log.level)}</span>
                <span className="log-timestamp">{formatTimestamp(log.timestamp)}</span>
                {log.systemClock && (
                  <span className="system-clock-badge">C:{log.systemClock}</span>
                )}
                <span className="log-level" style={{ color: getLevelColor(log.level) }}>
                  {log.level.toUpperCase()}
                </span>
                <span className="log-category">[{log.category}]</span>
                {log.consciousnessState && (
                  <span
                    className="consciousness-badge"
                    style={{ color: getConsciousnessPhaseColor(log.consciousnessState.phase) }}
                  >
                    {log.consciousnessState.phase}
                  </span>
                )}
              </div>
              <div className="log-message">{log.message}</div>
              {log.consciousnessState && (
                <div className="consciousness-state">
                  <span>E:{(log.consciousnessState.energy * 100).toFixed(0)}%</span>
                  <span>D:{(log.consciousnessState.depth * 100).toFixed(0)}%</span>
                </div>
              )}
              {log.data && (
                <details className="log-data">
                  <summary>Data</summary>
                  <pre>{JSON.stringify(log.data, null, 2)}</pre>
                </details>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Command Input */}
      <div className="command-input">
        <div className="input-group">
          <span className="command-prompt">aenea@debug:~$</span>
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter debug command (try 'help')..."
            className="command-field"
          />
          <button onClick={executeCommand} className="execute-btn">
            Execute
          </button>
        </div>
        <div className="command-help">
          Quick commands: status, energy, thoughts, dpd, agents, memory, help
        </div>
      </div>

      <style>{`
        .enhanced-debug-console {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: #0f172a;
          color: #f1f5f9;
          font-family: 'JetBrains Mono', 'Courier New', monospace;
          font-size: 13px;
        }

        .console-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          border-bottom: 1px solid #475569;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .console-header h2 {
          margin: 0;
          color: #f1f5f9;
          font-size: 20px;
          font-weight: 600;
        }

        .version-info {
          background: #10b981;
          color: #000;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
        }

        .header-controls {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .toggle-btn,
        .monitor-btn,
        .export-btn {
          background: #475569;
          color: #f1f5f9;
          border: none;
          border-radius: 6px;
          padding: 8px 16px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .toggle-btn:hover,
        .monitor-btn:hover,
        .export-btn:hover {
          background: #64748b;
          transform: translateY(-1px);
        }

        .toggle-btn.active {
          background: #f97316;
        }

        .monitor-btn.active {
          background: #10b981;
        }

        .export-btn {
          background: #3b82f6;
        }

        .metrics-dashboard {
          display: flex;
          gap: 1px;
          background: #334155;
          padding: 1px;
        }

        .metric-card {
          flex: 1;
          background: #1e293b;
          padding: 12px 16px;
          text-align: center;
        }

        .metric-label {
          color: #94a3b8;
          font-size: 11px;
          margin-bottom: 4px;
          text-transform: uppercase;
          font-weight: 600;
        }

        .metric-value {
          color: #f1f5f9;
          font-size: 18px;
          font-weight: 700;
        }

        .metric-value.error {
          color: #ef4444;
        }

        .console-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 24px;
          background: #1e293b;
          border-bottom: 1px solid #334155;
          gap: 16px;
        }

        .control-group {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .filter-select,
        .search-input {
          background: #334155;
          color: #f1f5f9;
          border: 1px solid #475569;
          border-radius: 4px;
          padding: 6px 12px;
          font-size: 12px;
        }

        .search-input {
          width: 200px;
        }

        .log-count {
          color: #94a3b8;
          font-size: 12px;
        }

        .auto-scroll-btn,
        .clear-btn {
          background: #475569;
          color: #f1f5f9;
          border: none;
          border-radius: 4px;
          padding: 6px 12px;
          cursor: pointer;
          font-size: 12px;
        }

        .auto-scroll-btn.active {
          background: #3b82f6;
        }

        .clear-btn {
          background: #ef4444;
        }

        .consciousness-overview {
          padding: 16px 24px;
          background: #1e293b;
          border-bottom: 1px solid #334155;
        }

        .consciousness-overview h3 {
          margin: 0 0 12px 0;
          color: #10b981;
          font-size: 14px;
        }

        .consciousness-snapshot {
          background: #0f172a;
          border: 1px solid #334155;
          border-radius: 8px;
          padding: 16px;
        }

        .snapshot-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .system-clock {
          color: #94a3b8;
          font-size: 12px;
        }

        .phase-indicator {
          font-weight: 600;
          font-size: 12px;
          text-transform: uppercase;
        }

        .snapshot-metrics {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 12px;
        }

        .metric {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
        }

        .progress-bar {
          flex: 1;
          height: 6px;
          background: #334155;
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          transition: width 0.3s;
        }

        .progress-fill.energy {
          background: #10b981;
        }

        .progress-fill.depth {
          background: #3b82f6;
        }

        .dpd-weights {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          padding-top: 8px;
          border-top: 1px solid #334155;
        }

        .weight-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }

        .console-content {
          flex: 1;
          overflow: hidden;
        }

        .logs-container {
          height: 100%;
          overflow-y: auto;
          padding: 16px 24px;
        }

        .log-entry {
          border-left: 4px solid #6b7280;
          padding: 12px 16px;
          margin-bottom: 8px;
          background: #1e293b;
          border-radius: 0 8px 8px 0;
          transition: background 0.2s;
        }

        .log-entry:hover {
          background: #334155;
        }

        .log-entry.consciousness {
          background: rgba(16, 185, 129, 0.1);
        }

        .log-entry.insight {
          background: rgba(249, 115, 22, 0.1);
        }

        .log-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
          font-size: 11px;
        }

        .log-icon {
          font-size: 14px;
        }

        .log-timestamp {
          color: #64748b;
          font-weight: 500;
          min-width: 70px;
        }

        .system-clock-badge {
          background: #334155;
          color: #94a3b8;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
        }

        .log-level {
          font-weight: 600;
          min-width: 90px;
          font-size: 10px;
        }

        .log-category {
          color: #94a3b8;
          font-weight: 500;
          min-width: 100px;
        }

        .consciousness-badge {
          background: rgba(255, 255, 255, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          text-transform: uppercase;
        }

        .log-message {
          color: #e2e8f0;
          font-size: 13px;
          line-height: 1.4;
          margin-bottom: 6px;
        }

        .consciousness-state {
          display: flex;
          gap: 12px;
          font-size: 11px;
          color: #94a3b8;
          margin-bottom: 6px;
        }

        .log-data {
          margin-top: 8px;
        }

        .log-data summary {
          color: #94a3b8;
          cursor: pointer;
          font-size: 11px;
        }

        .log-data pre {
          background: #0f172a;
          border: 1px solid #334155;
          padding: 8px;
          border-radius: 4px;
          font-size: 11px;
          color: #cbd5e1;
          margin: 8px 0 0 0;
          overflow-x: auto;
        }

        .command-input {
          padding: 16px 24px;
          background: #1e293b;
          border-top: 1px solid #334155;
        }

        .input-group {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-bottom: 8px;
        }

        .command-prompt {
          color: #10b981;
          font-weight: 600;
          min-width: 130px;
        }

        .command-field {
          flex: 1;
          background: #0f172a;
          color: #f1f5f9;
          border: 1px solid #475569;
          border-radius: 4px;
          padding: 8px 12px;
          font-size: 13px;
          font-family: 'JetBrains Mono', 'Courier New', monospace;
        }

        .command-field:focus {
          outline: none;
          border-color: #10b981;
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
        }

        .execute-btn {
          background: #10b981;
          color: #000;
          border: none;
          border-radius: 4px;
          padding: 8px 16px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
        }

        .command-help {
          color: #64748b;
          font-size: 11px;
        }

        .logs-container::-webkit-scrollbar {
          width: 8px;
        }

        .logs-container::-webkit-scrollbar-track {
          background: #1e293b;
        }

        .logs-container::-webkit-scrollbar-thumb {
          background: #475569;
          border-radius: 4px;
        }

        .logs-container::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
      `}</style>
    </div>
  );
};

export default DebugConsole;