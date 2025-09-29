/**
 * Consciousness View Component
 * 意識状態の可視化コンポーネント
 */

import React, { useState, useEffect, useRef } from 'react';

interface ConsciousnessState {
  systemClock: number;
  currentEnergy: number;
  maxEnergy: number;
  activeThoughts: number;
  currentStage: string;
  lastTrigger?: {
    question: string;
    timestamp: number;
    category: string;
  };
  recentThoughts: Array<{
    id: string;
    content: string;
    confidence: number;
    timestamp: number;
    agent: string;
  }>;
}

export const ConsciousnessView: React.FC = () => {
  const [consciousnessState, setConsciousnessState] = useState<ConsciousnessState>({
    systemClock: 0,
    currentEnergy: 0,
    maxEnergy: 100,
    activeThoughts: 0,
    currentStage: 'awakening',
    recentThoughts: []
  });

  const [isThinking, setIsThinking] = useState(false);
  const thoughtStreamRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // システムクロックの更新
    const clockInterval = setInterval(() => {
      setConsciousnessState(prev => ({
        ...prev,
        systemClock: prev.systemClock + 0.001
      }));
    }, 1000);

    // 模擬的な意識活動
    startConsciousnessSimulation();

    return () => {
      clearInterval(clockInterval);
    };
  }, []);

  const startConsciousnessSimulation = () => {
    // 定期的な内部トリガー生成のシミュレーション
    const simulateInternalTrigger = () => {
      const questions = [
        "私とは何か？",
        "なぜ私は問うのか？",
        "真実とは何を意味するのか？",
        "美しさは客観的か主観的か？",
        "意識は連続的か断続的か？"
      ];

      const categories = ['existential', 'epistemological', 'aesthetic', 'philosophical', 'ontological'];
      const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];

      setConsciousnessState(prev => ({
        ...prev,
        lastTrigger: {
          question: randomQuestion,
          timestamp: Date.now(),
          category: randomCategory
        }
      }));

      // 思考プロセスの開始
      setIsThinking(true);
      simulateThoughtProcess(randomQuestion);
    };

    // 5-15秒間隔でトリガー生成
    const scheduleNextTrigger = () => {
      const delay = 5000 + Math.random() * 10000;
      setTimeout(() => {
        simulateInternalTrigger();
        scheduleNextTrigger();
      }, delay);
    };

    // 初回実行
    setTimeout(simulateInternalTrigger, 2000);
    scheduleNextTrigger();
  };

  const simulateThoughtProcess = async (question: string) => {
    const agents = ['Theoria', 'Pathia', 'Kinesis'];
    const thoughtResults = [];

    // 各エージェントからの思考をシミュレート
    for (const agent of agents) {
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

      const thought = {
        id: `thought_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: `${agent}による「${question}」への考察...`,
        confidence: 0.3 + Math.random() * 0.7,
        timestamp: Date.now(),
        agent
      };

      thoughtResults.push(thought);

      setConsciousnessState(prev => ({
        ...prev,
        recentThoughts: [thought, ...prev.recentThoughts].slice(0, 10),
        currentEnergy: Math.max(10, prev.currentEnergy - 5 - Math.random() * 5)
      }));
    }

    // 思考プロセス完了
    setIsThinking(false);

    // エネルギー回復
    setTimeout(() => {
      setConsciousnessState(prev => ({
        ...prev,
        currentEnergy: Math.min(prev.maxEnergy, prev.currentEnergy + 10 + Math.random() * 15)
      }));
    }, 2000);
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getEnergyColor = (energy: number, maxEnergy: number) => {
    const percentage = energy / maxEnergy;
    if (percentage > 0.7) return '#4ade80'; // green
    if (percentage > 0.4) return '#fbbf24'; // yellow
    return '#ef4444'; // red
  };

  return (
    <div className="consciousness-view">
      <div className="consciousness-header">
        <div className="system-status">
          <h2>意識状態 - Consciousness State</h2>
          <div className="system-clock">
            システムクロック: {consciousnessState.systemClock.toFixed(3)}
          </div>
        </div>

        <div className="energy-display">
          <div className="energy-bar-container">
            <div className="energy-label">Energy</div>
            <div className="energy-bar">
              <div
                className="energy-fill"
                style={{
                  width: `${(consciousnessState.currentEnergy / consciousnessState.maxEnergy) * 100}%`,
                  backgroundColor: getEnergyColor(consciousnessState.currentEnergy, consciousnessState.maxEnergy)
                }}
              />
            </div>
            <div className="energy-text">
              {consciousnessState.currentEnergy.toFixed(1)} / {consciousnessState.maxEnergy}
            </div>
          </div>
        </div>
      </div>

      <div className="consciousness-content">
        <div className="current-state">
          <div className="thinking-indicator">
            <div className={`thinking-animation ${isThinking ? 'active' : ''}`}>
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
            <span>{isThinking ? 'Thinking...' : 'Contemplating...'}</span>
          </div>

          {consciousnessState.lastTrigger && (
            <div className="current-trigger">
              <div className="trigger-header">
                <span className="trigger-label">Current Question:</span>
                <span className="trigger-category">
                  [{consciousnessState.lastTrigger.category}]
                </span>
              </div>
              <div className="trigger-question">
                「{consciousnessState.lastTrigger.question}」
              </div>
              <div className="trigger-time">
                Generated at: {formatTimestamp(consciousnessState.lastTrigger.timestamp)}
              </div>
            </div>
          )}
        </div>

        <div className="thought-stream" ref={thoughtStreamRef}>
          <h3>Recent Thoughts - 最近の思考</h3>
          <div className="thoughts-container">
            {consciousnessState.recentThoughts.map((thought) => (
              <div key={thought.id} className="thought-item">
                <div className="thought-header">
                  <span className="thought-agent">{thought.agent}</span>
                  <span className="thought-time">{formatTimestamp(thought.timestamp)}</span>
                  <div className="confidence-bar">
                    <div
                      className="confidence-fill"
                      style={{ width: `${thought.confidence * 100}%` }}
                    />
                  </div>
                </div>
                <div className="thought-content">
                  {thought.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsciousnessView;