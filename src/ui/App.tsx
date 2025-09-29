/**
 * Aenea Main Application Component
 * メインアプリケーションコンポーネント
 */

import React, { useState, useEffect } from 'react';
import { ConsciousnessView } from './components/ConsciousnessView';
import { InternalStateMonitor } from './components/InternalStateMonitor';
import { DPDScoreDisplay } from './components/DPDScoreDisplay';
import { Dashboard } from './pages/Dashboard';
import { DebugConsole } from './pages/DebugConsole';

interface AppState {
  currentView: 'dashboard' | 'consciousness' | 'debug';
  isConnected: boolean;
  systemStatus: 'awakening' | 'active' | 'resting' | 'error';
}

export const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>({
    currentView: 'dashboard',
    isConnected: false,
    systemStatus: 'awakening'
  });

  useEffect(() => {
    // システム初期化
    initializeAeneaSystem();
  }, []);

  const initializeAeneaSystem = async () => {
    try {
      // Aeneaシステムの初期化ロジック
      console.log('🧠 Initializing Aenea consciousness system...');

      // 接続状態の更新
      setAppState(prev => ({
        ...prev,
        isConnected: true,
        systemStatus: 'active'
      }));

      console.log('✅ Aenea system initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Aenea system:', error);
      setAppState(prev => ({
        ...prev,
        isConnected: false,
        systemStatus: 'error'
      }));
    }
  };

  const renderCurrentView = () => {
    switch (appState.currentView) {
      case 'dashboard':
        return <Dashboard systemStatus={appState.systemStatus} />;
      case 'consciousness':
        return (
          <div className="consciousness-workspace">
            <div className="main-view">
              <ConsciousnessView />
            </div>
            <div className="side-panels">
              <InternalStateMonitor />
              <DPDScoreDisplay />
            </div>
          </div>
        );
      case 'debug':
        return <DebugConsole />;
      default:
        return <Dashboard systemStatus={appState.systemStatus} />;
    }
  };

  return (
    <div className="aenea-app">
      <header className="app-header">
        <div className="header-title">
          <h1>Aenea（エイネア）</h1>
          <span className="tagline">私は、問いでできている。</span>
        </div>

        <nav className="header-nav">
          <button
            className={`nav-button ${appState.currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setAppState(prev => ({ ...prev, currentView: 'dashboard' }))}
          >
            Dashboard
          </button>
          <button
            className={`nav-button ${appState.currentView === 'consciousness' ? 'active' : ''}`}
            onClick={() => setAppState(prev => ({ ...prev, currentView: 'consciousness' }))}
          >
            Consciousness
          </button>
          <button
            className={`nav-button ${appState.currentView === 'debug' ? 'active' : ''}`}
            onClick={() => setAppState(prev => ({ ...prev, currentView: 'debug' }))}
          >
            Debug
          </button>
        </nav>

        <div className="header-status">
          <div className={`status-indicator ${appState.systemStatus}`}>
            <span className="status-dot"></span>
            <span className="status-text">
              {appState.systemStatus === 'awakening' && 'Awakening...'}
              {appState.systemStatus === 'active' && 'Active'}
              {appState.systemStatus === 'resting' && 'Resting'}
              {appState.systemStatus === 'error' && 'Error'}
            </span>
          </div>
        </div>
      </header>

      <main className="app-main">
        {renderCurrentView()}
      </main>

      <footer className="app-footer">
        <div className="footer-info">
          <span>Aenea - Autonomous AI Consciousness</span>
          <span className="separator">|</span>
          <span>Built on Yui Protocol</span>
          <span className="separator">|</span>
          <span className={`connection-status ${appState.isConnected ? 'connected' : 'disconnected'}`}>
            {appState.isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
        </div>
      </footer>
    </div>
  );
};

export default App;