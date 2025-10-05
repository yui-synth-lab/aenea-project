/**
 * Aenea Application Root Component
 */

import React, { useState, useEffect } from 'react';
import { Dashboard } from './pages/Dashboard';

type SystemStatus = 'awakening' | 'active' | 'resting' | 'error';

export const App: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>('awakening');

  useEffect(() => {
    // Check system status and load initial data
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/consciousness/state');
        if (response.ok) {
          const data = await response.json();
          if (data.isRunning) {
            setSystemStatus('active');
          } else {
            setSystemStatus('resting');
          }
        } else {
          setSystemStatus('error');
        }
      } catch (error) {
        console.error('Failed to check system status:', error);
        setSystemStatus('error');
      }
    };

    // Load initial data
    const loadInitialData = async () => {
      try {
        // Trigger initial data fetch for DPD scores
        await fetch('/api/consciousness/dpd/evolution?limit=20&strategy=sampled');
      } catch (error) {
        console.error('Failed to load initial data:', error);
      }
    };

    checkStatus();
    loadInitialData();

    // Poll status every 10 seconds
    const interval = setInterval(checkStatus, 10000);

    return () => clearInterval(interval);
  }, []);

  return <Dashboard systemStatus={systemStatus} />;
};
