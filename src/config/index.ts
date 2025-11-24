/**
 * Configuration management for the welcome message system
 */
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { WelcomeConfig, defaultConfig, LogLevel, WeatherUnits, ColorTheme } from '../types/config';
import { logger } from '../utils/logger';

/**
 * Path to the config directory
 */
const CONFIG_DIR = path.join(os.homedir(), '.config', 'welcome');

/**
 * Path to the config file
 */
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

/**
 * Load configuration from file
 */
export async function loadConfig(): Promise<WelcomeConfig> {
  try {
    // Create config directory if it doesn't exist
    await fs.mkdir(CONFIG_DIR, { recursive: true });
    
    // Try to read existing config file
    try {
      const configData = await fs.readFile(CONFIG_FILE, 'utf8');
      const userConfig = JSON.parse(configData) as Partial<WelcomeConfig>;
      
      // Merge with default config (deep merge would be better but this is simpler for now)
      const config = { ...defaultConfig, ...userConfig };
      
      // Update logger level from config
      logger.setLevel(config.display.logLevel);
      logger.debug('Loaded configuration from file');
      return config;
    } catch (error) {
      // Config file doesn't exist or is invalid, create it with defaults
      await saveConfig(defaultConfig);
      logger.info('Created default configuration file');
      return defaultConfig;
    }
  } catch (error) {
    logger.error(`Failed to load/create configuration: ${error}`);
    return defaultConfig;
  }
}

/**
 * Save configuration to file
 */
export async function saveConfig(config: WelcomeConfig): Promise<void> {
  try {
    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
    logger.debug('Saved configuration to file');
  } catch (error) {
    logger.error(`Failed to save configuration: ${error}`);
  }
}

/**
 * Migrate configuration from zsh format
 * This will read the zsh configuration file and convert it to JSON format
 */
export async function migrateFromZsh(): Promise<WelcomeConfig | null> {
  const zshConfigPath = path.join(CONFIG_DIR, 'config.zsh');
  
  try {
    // Check if zsh config exists
    try {
      await fs.access(zshConfigPath);
    } catch {
      logger.debug('No zsh configuration found to migrate');
      return null;
    }

    // Read zsh config
    const zshConfig = await fs.readFile(zshConfigPath, 'utf8');
    
    // Create a new config object starting with defaults
    const config: WelcomeConfig = { ...defaultConfig };
    
    // Parse zsh config line by line
    const lines = zshConfig.split('\n');
    for (const line of lines) {
      // Skip comments and empty lines
      if (line.trim().startsWith('#') || line.trim() === '') {
        continue;
      }
      
      // Match variable assignments
      const match = line.match(/^([A-Z_]+)=["']?([^"']*)["']?$/);
      if (match) {
        const [, key, value] = match;
        
        // Map zsh variables to TypeScript config
        switch (key) {
          case 'USER_NAME':
            config.user.userName = value;
            break;
          case 'WEATHER_CITY':
            config.weather.city = value;
            break;
          case 'WEATHER_COUNTRY':
            config.weather.country = value;
            break;
          case 'WEATHER_ZIP':
            config.weather.zip = value;
            break;
          case 'WEATHER_UNITS':
            config.weather.units = value as WeatherUnits;
            break;
          case 'OPENWEATHERMAP_API_KEY':
            config.weather.apiKey = value;
            break;
          case 'GITHUB_PERSONAL_TOKEN':
            config.github.personalToken = value;
            break;
          case 'WEATHER_SHOW_FORECAST':
            config.weather.showForecast = value === 'true';
            break;
          case 'WEATHER_SHOW_HUMIDITY':
            config.weather.showHumidity = value === 'true';
            break;
          case 'WEATHER_SHOW_WIND':
            config.weather.showWind = value === 'true';
            break;
          case 'GITHUB_SHOW_ASSIGNED_PRS':
            config.github.showAssignedPRs = value === 'true';
            break;
          case 'GITHUB_SHOW_CREATED_PRS':
            config.github.showCreatedPRs = value === 'true';
            break;
          case 'GITHUB_SHOW_MENTIONS':
            config.github.showMentions = value === 'true';
            break;
          case 'GITHUB_MAX_PRS':
            config.github.maxPRs = parseInt(value, 10);
            break;
          case 'CACHE_DURATION_WEATHER':
            config.cache.weatherDuration = parseInt(value, 10);
            break;
          case 'CACHE_DURATION_GITHUB':
            config.cache.githubDuration = parseInt(value, 10);
            break;
          case 'CACHE_DURATION_QUOTE':
            config.cache.quoteDuration = parseInt(value, 10);
            break;
          case 'USE_EMOJIS':
            config.display.useEmojis = value === 'true';
            break;
          case 'COLOR_THEME':
            config.display.colorTheme = value as ColorTheme;
            break;
          case 'WELCOME_LOG_LEVEL':
            config.display.logLevel = parseInt(value, 10) as LogLevel;
            break;
          case 'MAX_EXECUTION_TIME':
            config.performance.maxExecutionTime = parseFloat(value);
            break;
          case 'PARALLEL_EXECUTION':
            config.performance.parallelExecution = value === 'true';
            break;
          case 'SHOW_PERFORMANCE_METRICS':
            config.performance.showMetrics = value === 'true';
            break;
          case 'WELCOME_DATA_DIR':
            config.dataDir = value;
            break;
          case 'POST_WELCOME_COMMAND':
            config.postWelcomeCommand = value;
            break;
        }
      }
      
      // Handle array for enabled modules
      if (line.includes('ENABLED_MODULES=(')) {
        const modulesSection = zshConfig.substring(
          zshConfig.indexOf('ENABLED_MODULES=(') + 'ENABLED_MODULES=('.length,
          zshConfig.indexOf(')', zshConfig.indexOf('ENABLED_MODULES=('))
        );
        const modules = modulesSection
          .split('\n')
          .map(l => l.trim())
          .filter(l => l && !l.startsWith('#'))
          .map(l => {
            // First strip comments (everything after #)
            const commentIndex = l.indexOf('#');
            if (commentIndex !== -1) {
              l = l.substring(0, commentIndex).trim();
            }
            // Then remove quotes
            return l.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1').trim();
          })
          .filter(l => l.length > 0); // Remove empty strings
        
        if (modules.length > 0) {
          config.enabledModules = modules as ('system' | 'greeting' | 'weather' | 'github' | 'linearStalled')[];
        }
      }
    }
    
    // Save the migrated config
    await saveConfig(config);
    logger.info('Successfully migrated configuration from zsh format');
    return config;
  } catch (error) {
    logger.error(`Failed to migrate zsh configuration: ${error}`);
    return null;
  }
}
