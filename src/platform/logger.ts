/**
 * Aenea Logger - Persistent Logging System
 */

import * as fs from 'fs';
import * as path from 'path';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

interface LogEntry {
  timestamp: string;
  level: string;
  module: string;
  message: string;
  data?: any;
}

class Logger {
  private logDir: string;
  private currentLogFile: string;
  private minLevel: LogLevel = LogLevel.INFO;

  constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    this.ensureLogDirectory();
    this.currentLogFile = this.generateLogFileName();
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private generateLogFileName(): string {
    const now = new Date();
    const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
    return path.join(this.logDir, `aenea-${date}.log`);
  }

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private writeToFile(entry: LogEntry): void {
    const logLine = JSON.stringify(entry) + '\n';
    fs.appendFileSync(this.currentLogFile, logLine, 'utf8');
  }

  private formatConsoleOutput(entry: LogEntry): string {
    const timestamp = entry.timestamp.substring(11, 19); // HH:MM:SS
    const levelColors = {
      DEBUG: '\x1b[36m', // Cyan
      INFO: '\x1b[32m',  // Green
      WARN: '\x1b[33m',  // Yellow
      ERROR: '\x1b[31m'  // Red
    };
    const reset = '\x1b[0m';
    const color = levelColors[entry.level as keyof typeof levelColors] || '';

    return `${color}[${timestamp}] ${entry.level.padEnd(5)} ${entry.module.padEnd(12)} ${entry.message}${reset}`;
  }

  private log(level: LogLevel, module: string, message: string, data?: any): void {
    if (level < this.minLevel) return;

    const entry: LogEntry = {
      timestamp: this.formatTimestamp(),
      level: LogLevel[level],
      module,
      message,
      data
    };

    // Write to file
    this.writeToFile(entry);

    // Output to console
    console.log(this.formatConsoleOutput(entry));
    if (data && level >= LogLevel.WARN) {
      console.log('Data:', data);
    }
  }

  debug(module: string, message: string, data?: any): void {
    this.log(LogLevel.DEBUG, module, message, data);
  }

  info(module: string, message: string, data?: any): void {
    this.log(LogLevel.INFO, module, message, data);
  }

  warn(module: string, message: string, data?: any): void {
    this.log(LogLevel.WARN, module, message, data);
  }

  error(module: string, message: string, data?: any): void {
    this.log(LogLevel.ERROR, module, message, data);
  }

  setLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  // Get recent logs for API
  getRecentLogs(hours: number = 24): LogEntry[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const logs: LogEntry[] = [];

    try {
      const logContent = fs.readFileSync(this.currentLogFile, 'utf8');
      const lines = logContent.trim().split('\n');

      for (const line of lines) {
        try {
          const entry = JSON.parse(line) as LogEntry;
          if (new Date(entry.timestamp) >= cutoff) {
            logs.push(entry);
          }
        } catch (e) {
          // Skip malformed lines
        }
      }
    } catch (error) {
      // Log file doesn't exist yet
    }

    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // Get consciousness-specific logs
  getConsciousnessLogs(hours: number = 24): LogEntry[] {
    return this.getRecentLogs(hours).filter(entry =>
      entry.module === 'Consciousness' ||
      entry.module === 'Trigger' ||
      entry.module === 'ThoughtCycle'
    );
  }
}

// Singleton logger instance
export const logger = new Logger();

// Convenience functions
export const log = {
  debug: (module: string, message: string, data?: any) => logger.debug(module, message, data),
  info: (module: string, message: string, data?: any) => logger.info(module, message, data),
  warn: (module: string, message: string, data?: any) => logger.warn(module, message, data),
  error: (module: string, message: string, data?: any) => logger.error(module, message, data),
};