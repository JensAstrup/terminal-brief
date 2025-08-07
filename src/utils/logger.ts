/**
 * Logging utilities for the welcome message system
 */
import { LogLevel } from '../types/config';
import { colorText } from './color';

export class Logger {
  private level: LogLevel;

  constructor(level: LogLevel = LogLevel.INFO) {
    this.level = level;
  }

  /**
   * Set the log level
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Log a debug message
   */
  debug(message: string): void {
    if (this.level <= LogLevel.DEBUG) {
      console.log(colorText('cyan', `[DEBUG] ${message}`));
    }
  }

  /**
   * Log an info message
   */
  info(message: string): void {
    if (this.level <= LogLevel.INFO) {
      console.log(colorText('blue', `[INFO] ${message}`));
    }
  }

  /**
   * Log a warning message
   */
  warn(message: string): void {
    if (this.level <= LogLevel.WARN) {
      console.log(colorText('yellow', `[WARN] ${message}`));
    }
  }

  /**
   * Log an error message
   */
  error(message: string): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(colorText('red', `[ERROR] ${message}`));
    }
  }
}

// Create a default logger instance
export const logger = new Logger();
