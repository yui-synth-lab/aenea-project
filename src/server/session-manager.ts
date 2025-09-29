/**
 * Aenea Session Manager - Persistent State Management
 */

import * as fs from 'fs';
import * as path from 'path';
import { log } from './logger.js';

interface SessionData {
  systemClock: number;
  energy: number;
  totalQuestions: number;
  totalThoughts: number;
  questionHistory: any[];
  thoughtHistory: any[];
  lastSaved: string;
  sessionId: string;
}

interface SessionMetadata {
  sessionId: string;
  startTime: string;
  lastActivity: string;
  totalQuestions: number;
  totalThoughts: number;
}

class SessionManager {
  private sessionDir: string;
  private currentSessionId: string;
  private autoSaveInterval: NodeJS.Timer | null = null;

  constructor() {
    this.sessionDir = path.join(process.cwd(), 'sessions');
    this.ensureSessionDirectory();
    this.currentSessionId = this.generateSessionId();
    this.startAutoSave();
  }

  private ensureSessionDirectory(): void {
    if (!fs.existsSync(this.sessionDir)) {
      fs.mkdirSync(this.sessionDir, { recursive: true });
    }
  }

  private generateSessionId(): string {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    return `session-${timestamp}`;
  }

  private getSessionFilePath(sessionId: string): string {
    return path.join(this.sessionDir, `${sessionId}.json`);
  }

  private getMetadataFilePath(): string {
    return path.join(this.sessionDir, 'sessions-metadata.json');
  }

  private startAutoSave(): void {
    // Auto-save every 5 minutes
    this.autoSaveInterval = setInterval(() => {
      // This will be called by consciousness backend
      log.debug('SessionManager', 'Auto-save interval triggered');
    }, 5 * 60 * 1000);
  }

  saveSession(data: Omit<SessionData, 'lastSaved' | 'sessionId'>): void {
    try {
      const sessionData: SessionData = {
        ...data,
        sessionId: this.currentSessionId,
        lastSaved: new Date().toISOString()
      };

      const filePath = this.getSessionFilePath(this.currentSessionId);
      fs.writeFileSync(filePath, JSON.stringify(sessionData, null, 2));

      // Update metadata
      this.updateSessionMetadata(sessionData);

      log.info('SessionManager', `Session saved: ${this.currentSessionId}`, {
        questions: data.totalQuestions,
        thoughts: data.totalThoughts,
        energy: data.energy
      });

    } catch (error) {
      log.error('SessionManager', 'Failed to save session', error);
    }
  }

  private updateSessionMetadata(sessionData: SessionData): void {
    try {
      let metadata: SessionMetadata[] = [];

      // Load existing metadata
      const metadataPath = this.getMetadataFilePath();
      if (fs.existsSync(metadataPath)) {
        const content = fs.readFileSync(metadataPath, 'utf8');
        metadata = JSON.parse(content);
      }

      // Update or add current session
      const existingIndex = metadata.findIndex(m => m.sessionId === this.currentSessionId);
      const sessionMeta: SessionMetadata = {
        sessionId: this.currentSessionId,
        startTime: existingIndex >= 0 ? metadata[existingIndex].startTime : sessionData.lastSaved,
        lastActivity: sessionData.lastSaved,
        totalQuestions: sessionData.totalQuestions,
        totalThoughts: sessionData.totalThoughts
      };

      if (existingIndex >= 0) {
        metadata[existingIndex] = sessionMeta;
      } else {
        metadata.push(sessionMeta);
      }

      // Keep only last 50 sessions in metadata
      if (metadata.length > 50) {
        metadata = metadata.slice(-50);
      }

      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    } catch (error) {
      log.error('SessionManager', 'Failed to update session metadata', error);
    }
  }

  loadLatestSession(): SessionData | null {
    try {
      const metadataPath = this.getMetadataFilePath();
      if (!fs.existsSync(metadataPath)) {
        log.info('SessionManager', 'No previous sessions found');
        return null;
      }

      const metadata: SessionMetadata[] = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      if (metadata.length === 0) {
        return null;
      }

      // Get the most recent session
      const latestSession = metadata.sort((a, b) =>
        new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
      )[0];

      const sessionPath = this.getSessionFilePath(latestSession.sessionId);
      if (!fs.existsSync(sessionPath)) {
        log.warn('SessionManager', `Session file not found: ${latestSession.sessionId}`);
        return null;
      }

      const sessionData: SessionData = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));

      log.info('SessionManager', `Loaded session: ${latestSession.sessionId}`, {
        questions: sessionData.totalQuestions,
        thoughts: sessionData.totalThoughts,
        energy: sessionData.energy,
        age: new Date().getTime() - new Date(sessionData.lastSaved).getTime()
      });

      return sessionData;

    } catch (error) {
      log.error('SessionManager', 'Failed to load latest session', error);
      return null;
    }
  }

  loadSession(sessionId: string): SessionData | null {
    try {
      const sessionPath = this.getSessionFilePath(sessionId);
      if (!fs.existsSync(sessionPath)) {
        return null;
      }

      const sessionData: SessionData = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
      return sessionData;

    } catch (error) {
      log.error('SessionManager', `Failed to load session: ${sessionId}`, error);
      return null;
    }
  }

  listSessions(): SessionMetadata[] {
    try {
      const metadataPath = this.getMetadataFilePath();
      if (!fs.existsSync(metadataPath)) {
        return [];
      }

      const metadata: SessionMetadata[] = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      return metadata.sort((a, b) =>
        new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
      );

    } catch (error) {
      log.error('SessionManager', 'Failed to list sessions', error);
      return [];
    }
  }

  getCurrentSessionId(): string {
    return this.currentSessionId;
  }

  cleanup(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval as NodeJS.Timeout);
    }
  }

  // Clean up old sessions (keep last 30 days)
  cleanupOldSessions(): void {
    try {
      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const metadata = this.listSessions();
      let removedCount = 0;

      for (const session of metadata) {
        if (new Date(session.lastActivity) < cutoff) {
          const filePath = this.getSessionFilePath(session.sessionId);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            removedCount++;
          }
        }
      }

      // Update metadata to remove old sessions
      const updatedMetadata = metadata.filter(s => new Date(s.lastActivity) >= cutoff);
      fs.writeFileSync(this.getMetadataFilePath(), JSON.stringify(updatedMetadata, null, 2));

      if (removedCount > 0) {
        log.info('SessionManager', `Cleaned up ${removedCount} old sessions`);
      }

    } catch (error) {
      log.error('SessionManager', 'Failed to cleanup old sessions', error);
    }
  }
}

export { SessionManager, SessionData, SessionMetadata };