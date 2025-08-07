/**
 * Greeting module for the welcome message system
 * Displays a personalized time-based greeting with optional emoji
 */
import { WelcomeModule } from './base';
import { WelcomeConfig } from '../types/config';
import { colorBoldText, colorText } from '../utils/color';
import { logger } from '../utils/logger';

/**
 * Time periods for greetings
 */
enum TimePeriod {
  MORNING = 'morning',
  AFTERNOON = 'afternoon',
  EVENING = 'evening',
  NIGHT = 'night'
}

/**
 * Get current time period
 */
function getCurrentTimePeriod(): TimePeriod {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    return TimePeriod.MORNING;
  } else if (hour >= 12 && hour < 18) {
    return TimePeriod.AFTERNOON;
  } else if (hour >= 18 && hour < 22) {
    return TimePeriod.EVENING;
  } else {
    return TimePeriod.NIGHT;
  }
}

/**
 * Get emoji for current time period
 */
function getTimeEmoji(timePeriod: TimePeriod): string {
  switch (timePeriod) {
    case TimePeriod.MORNING:
      return '☀️';
    case TimePeriod.AFTERNOON:
      return '🌤️';
    case TimePeriod.EVENING:
      return '🌇';
    case TimePeriod.NIGHT:
      return '✨';
    default:
      return '';
  }
}

/**
 * Greeting module implementation
 */
class GreetingModule implements WelcomeModule {
  name = 'greeting';

  /**
   * Set up the greeting module
   */
  async setup(config: WelcomeConfig): Promise<void> {
    if (!config.user.userName) {
      logger.warn('No user name set in configuration');
    }
    return Promise.resolve();
  }

  /**
   * Display the greeting
   */
  async display(config: WelcomeConfig): Promise<string> {
    // Get the time period and corresponding emoji
    const timePeriod = getCurrentTimePeriod();
    const timeEmoji = config.display.useEmojis ? getTimeEmoji(timePeriod) : '';
    
    // Prepare the greeting
    const userName = config.user.userName || 'User';
    const waveEmoji = config.display.useEmojis ? '👋 ' : '';
    
    // Create the personalized greeting
    let greeting = `${waveEmoji}${colorBoldText('magenta', `Hey ${userName}!`)}`;
    
    // Add time-specific greeting if we have an emoji
    if (timeEmoji) {
      greeting += ` ${colorText('blue', `Good ${timePeriod}`)} ${timeEmoji}`;
    }
    
    return greeting;
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    // Nothing to clean up for this module
    return Promise.resolve();
  }
}

// Create a singleton instance
const greetingModule = new GreetingModule();
export { greetingModule };
