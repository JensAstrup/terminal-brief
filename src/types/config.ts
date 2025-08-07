/**
 * Configuration types for the welcome message system
 */

// Log levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

// Color themes
export type ColorTheme = 'default' | 'light' | 'dark' | 'pastel';

// Weather units
export type WeatherUnits = 'metric' | 'imperial';

// Basic user configuration
export interface UserConfig {
  userName: string;
}

// Weather configuration
export interface WeatherConfig {
  city?: string;
  country?: string;
  zip?: string;
  units: WeatherUnits;
  apiKey?: string;
  showForecast: boolean;
  showHumidity: boolean;
  showWind: boolean;
}

// GitHub configuration
export interface GitHubConfig {
  personalToken?: string;
  username?: string;
  showAssignedPRs: boolean;
  showCreatedPRs: boolean;
  showMentions: boolean;
  maxPRs: number;
}

// Linear configuration
export interface LinearConfig {
  apiKey?: string;
  teamNames: string[];
  daysStalled: number;
  baseUrl: string;
}

// System info display configuration
export interface SystemConfig {
  showLoad: boolean;
  showMemory: boolean;
  showDisk: boolean;
  showBattery: boolean;
  showUptime: boolean;
}

// Cache configuration
export interface CacheConfig {
  weatherDuration: number;
  githubDuration: number;
  quoteDuration: number;
}

// Performance configuration
export interface PerformanceConfig {
  maxExecutionTime: number;
  parallelExecution: boolean;
  showMetrics: boolean;
}

// Display preferences
export interface DisplayConfig {
  useEmojis: boolean;
  colorTheme: ColorTheme;
  logLevel: LogLevel;
}

// Main configuration interface
export interface WelcomeConfig {
  user: UserConfig;
  weather: WeatherConfig;
  github: GitHubConfig;
  linear: LinearConfig;
  system: SystemConfig;
  cache: CacheConfig;
  performance: PerformanceConfig;
  display: DisplayConfig;
  enabledModules: string[];
  dataDir: string;
  postWelcomeCommand?: string;
}

// Default configuration
export const defaultConfig: WelcomeConfig = {
  user: {
    userName: 'Jens'
  },
  weather: {
    city: 'New York',
    country: 'US',
    zip: '10001',
    units: 'imperial',
    apiKey: '',
    showForecast: false,
    showHumidity: true,
    showWind: false
  },
  github: {
    personalToken: process.env.GITHUB_PERSONAL_TOKEN,
    username: undefined,
    showAssignedPRs: true,
    showCreatedPRs: false,
    showMentions: false,
    maxPRs: 5
  },
  linear: {
    apiKey: process.env.LINEAR_API_KEY,
    teamNames: ['Application', 'Security', 'Dev Ops'],
    daysStalled: 3,
    baseUrl: 'https://linear.app/'
  },
  system: {
    showLoad: true,
    showMemory: true,
    showDisk: false,
    showBattery: true,
    showUptime: true
  },
  cache: {
    weatherDuration: 3600,
    githubDuration: 300,
    quoteDuration: 86400
  },
  performance: {
    maxExecutionTime: 1.0,
    parallelExecution: false,
    showMetrics: false
  },
  display: {
    useEmojis: true,
    colorTheme: 'default',
    logLevel: LogLevel.INFO
  },
  enabledModules: ['system', 'greeting', 'weather', 'github', 'linearStalled'],
  dataDir: `${process.env.HOME || process.env.USERPROFILE}/.config/welcome/data`
};
