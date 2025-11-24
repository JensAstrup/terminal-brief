/**
 * Config command handler for terminal-brief
 * Provides interactive menu system for configuring API keys and application settings
 */
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import inquirer from 'inquirer';
import { 
  WelcomeConfig, 
  defaultConfig, 
  LogLevel,
  ColorTheme,
  WeatherUnits,
  UserConfig,
  WeatherConfig,
  GitHubConfig,
  LinearConfig,
  SystemConfig,
  CacheConfig,
  PerformanceConfig,
  DisplayConfig
} from '../types/config';
import { saveConfig } from '../config';
import { logger } from '../utils/logger';

// Config directory and file paths
const CONFIG_DIR = path.join(os.homedir(), '.config', 'welcome');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

// Available choices for enum/union types
const MODULE_CHOICES = ['system', 'greeting', 'weather', 'github', 'linearStalled'];
const LINEAR_TEAM_CHOICES = ['Backup Care', 'Concierge', 'Platform', 'Security', 'Dev Ops', 'AI'];
const COLOR_THEME_CHOICES: ColorTheme[] = ['default', 'light', 'dark', 'pastel'];
const WEATHER_UNITS_CHOICES: WeatherUnits[] = ['metric', 'imperial'];
const LOG_LEVEL_CHOICES = [
  { name: 'DEBUG (0)', value: LogLevel.DEBUG },
  { name: 'INFO (1)', value: LogLevel.INFO },
  { name: 'WARN (2)', value: LogLevel.WARN },
  { name: 'ERROR (3)', value: LogLevel.ERROR }
];

/**
 * Detect which shell environment file to use
 */
async function detectShellEnvFile(): Promise<string> {
  const zshEnv = path.join(os.homedir(), '.zshenv');
  const bashRc = path.join(os.homedir(), '.bashrc');
  
  try {
    await fs.access(zshEnv);
    logger.debug('Using ~/.zshenv for environment variables');
    return zshEnv;
  } catch {
    logger.debug('Using ~/.bashrc for environment variables');
    return bashRc;
  }
}

/**
 * Update or append an environment variable in a shell file
 */
async function updateEnvFile(key: string, value: string, filePath: string): Promise<void> {
  try {
    let content = '';
    
    try {
      content = await fs.readFile(filePath, 'utf8');
    } catch {
      logger.debug(`Creating new file: ${filePath}`);
    }
    
    const exportLine = `export ${key}="${value}"`;
    const lines = content.split('\n');
    
    let keyExists = false;
    const updatedLines = lines.map(line => {
      if (line.trim().startsWith(`export ${key}=`) || line.trim().startsWith(`${key}=`)) {
        keyExists = true;
        return exportLine;
      }
      return line;
    });
    
    if (keyExists) {
      await fs.writeFile(filePath, updatedLines.join('\n'), 'utf8');
      logger.debug(`Updated ${key} in ${filePath}`);
    } else {
      const newContent = content.trim() ? `${content}\n${exportLine}\n` : `${exportLine}\n`;
      await fs.writeFile(filePath, newContent, 'utf8');
      logger.debug(`Added ${key} to ${filePath}`);
    }
  } catch (error) {
    logger.error(`Failed to update ${filePath}: ${error}`);
    throw error;
  }
}

/**
 * Load current configuration
 */
async function loadCurrentConfig(): Promise<WelcomeConfig> {
  try {
    await fs.mkdir(CONFIG_DIR, { recursive: true });
    const configData = await fs.readFile(CONFIG_FILE, 'utf8');
    const userConfig = JSON.parse(configData) as Partial<WelcomeConfig>;
    
    // Deep merge with default config
    const config: WelcomeConfig = {
      ...defaultConfig,
      ...userConfig,
      user: { ...defaultConfig.user, ...userConfig.user },
      weather: { ...defaultConfig.weather, ...userConfig.weather },
      github: { ...defaultConfig.github, ...userConfig.github },
      linear: { ...defaultConfig.linear, ...userConfig.linear },
      system: { ...defaultConfig.system, ...userConfig.system },
      cache: { ...defaultConfig.cache, ...userConfig.cache },
      performance: { ...defaultConfig.performance, ...userConfig.performance },
      display: { ...defaultConfig.display, ...userConfig.display }
    };
    
    return config;
  } catch {
    // Config doesn't exist, use defaults
    return { ...defaultConfig };
  }
}

/**
 * Display main menu and return selection
 */
async function promptMainMenu(): Promise<string> {
  const { selection } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selection',
      message: 'What would you like to configure?',
      choices: [
        { name: 'API Keys (GitHub & Linear)', value: 'apiKeys' },
        { name: 'User Settings', value: 'user' },
        { name: 'Weather Configuration', value: 'weather' },
        { name: 'GitHub Configuration', value: 'github' },
        { name: 'Linear Configuration', value: 'linear' },
        { name: 'System Display', value: 'system' },
        { name: 'Cache Settings', value: 'cache' },
        { name: 'Performance Settings', value: 'performance' },
        { name: 'Display Preferences', value: 'display' },
        { name: 'Enabled Modules', value: 'enabledModules' },
        new inquirer.Separator(),
        { name: 'Exit', value: 'exit' }
      ]
    }
  ]);
  
  return selection;
}

/**
 * Handle API keys configuration
 */
async function handleApiKeys(): Promise<void> {
  console.log('\n📝 Configure API Keys\n');
  
  try {
    const answers = await inquirer.prompt([
      {
        type: 'password',
        name: 'githubToken',
        message: 'Enter your GitHub Personal Token (leave empty to skip):',
        mask: '*'
      },
      {
        type: 'password',
        name: 'linearApiKey',
        message: 'Enter your Linear API Key (leave empty to skip):',
        mask: '*'
      }
    ]);
    
    const envFile = await detectShellEnvFile();
    console.log(`\nUpdating ${envFile}...`);
    
    if (answers.githubToken && answers.githubToken.trim() !== '') {
      await updateEnvFile('GITHUB_PERSONAL_TOKEN', answers.githubToken, envFile);
      console.log('✓ GitHub token saved');
    }
    
    if (answers.linearApiKey && answers.linearApiKey.trim() !== '') {
      await updateEnvFile('LINEAR_API_KEY', answers.linearApiKey, envFile);
      console.log('✓ Linear API key saved');
    }
    
    console.log('\n✓ API keys configuration complete!');
    console.log(`\nTo apply changes, run: source ${envFile}`);
    console.log('Or open a new terminal session.\n');
  } catch (error) {
    if (error instanceof Error && error.message === 'User force closed the prompt') {
      console.log('\nConfiguration cancelled.');
      return;
    }
    throw error;
  }
}

/**
 * Handle user configuration
 */
async function handleUserConfig(config: WelcomeConfig): Promise<void> {
  console.log('\n👤 User Settings\n');
  
  const answers = await inquirer.prompt<UserConfig>([
    {
      type: 'input',
      name: 'userName',
      message: 'User name:',
      default: config.user.userName
    }
  ]);
  
  config.user = answers;
  await saveConfig(config);
  console.log('\n✓ User settings saved!\n');
}

/**
 * Handle weather configuration
 */
async function handleWeatherConfig(config: WelcomeConfig): Promise<void> {
  console.log('\n🌤️  Weather Configuration\n');
  
  const answers = await inquirer.prompt<WeatherConfig>([
    {
      type: 'input',
      name: 'city',
      message: 'City:',
      default: config.weather.city
    },
    {
      type: 'input',
      name: 'country',
      message: 'Country code (e.g., US):',
      default: config.weather.country
    },
    {
      type: 'input',
      name: 'zip',
      message: 'ZIP code:',
      default: config.weather.zip
    },
    {
      type: 'list',
      name: 'units',
      message: 'Temperature units:',
      choices: WEATHER_UNITS_CHOICES,
      default: config.weather.units
    },
    {
      type: 'input',
      name: 'apiKey',
      message: 'OpenWeatherMap API key (leave empty to skip):',
      default: config.weather.apiKey
    },
    {
      type: 'list',
      name: 'showForecast',
      message: 'Show forecast:',
      choices: [
        { name: 'True', value: true },
        { name: 'False', value: false }
      ],
      default: config.weather.showForecast
    },
    {
      type: 'list',
      name: 'showHumidity',
      message: 'Show humidity:',
      choices: [
        { name: 'True', value: true },
        { name: 'False', value: false }
      ],
      default: config.weather.showHumidity
    },
    {
      type: 'list',
      name: 'showWind',
      message: 'Show wind:',
      choices: [
        { name: 'True', value: true },
        { name: 'False', value: false }
      ],
      default: config.weather.showWind
    }
  ]);
  
  config.weather = answers;
  await saveConfig(config);
  console.log('\n✓ Weather configuration saved!\n');
}

/**
 * Handle GitHub configuration
 */
async function handleGitHubConfig(config: WelcomeConfig): Promise<void> {
  console.log('\n🐙 GitHub Configuration\n');
  
  const answers = await inquirer.prompt<Partial<GitHubConfig>>([
    {
      type: 'input',
      name: 'username',
      message: 'GitHub username:',
      default: config.github.username
    },
    {
      type: 'list',
      name: 'showAssignedPRs',
      message: 'Show assigned PRs:',
      choices: [
        { name: 'True', value: true },
        { name: 'False', value: false }
      ],
      default: config.github.showAssignedPRs
    },
    {
      type: 'list',
      name: 'showCreatedPRs',
      message: 'Show created PRs:',
      choices: [
        { name: 'True', value: true },
        { name: 'False', value: false }
      ],
      default: config.github.showCreatedPRs
    },
    {
      type: 'list',
      name: 'showMentions',
      message: 'Show mentions:',
      choices: [
        { name: 'True', value: true },
        { name: 'False', value: false }
      ],
      default: config.github.showMentions
    },
    {
      type: 'number',
      name: 'maxPRs',
      message: 'Maximum PRs to display:',
      default: config.github.maxPRs
    }
  ]);
  
  config.github = { ...config.github, ...answers };
  await saveConfig(config);
  console.log('\n✓ GitHub configuration saved!\n');
}

/**
 * Handle Linear configuration
 */
async function handleLinearConfig(config: WelcomeConfig): Promise<void> {
  console.log('\n📐 Linear Configuration\n');
  
  const answers = await inquirer.prompt<Partial<LinearConfig>>([
    {
      type: 'checkbox',
      name: 'teamNames',
      message: 'Select teams to monitor:',
      choices: LINEAR_TEAM_CHOICES,
      default: config.linear.teamNames
    },
    {
      type: 'number',
      name: 'daysStalled',
      message: 'Days before issue is considered stalled:',
      default: config.linear.daysStalled
    },
    {
      type: 'input',
      name: 'baseUrl',
      message: 'Linear base URL:',
      default: config.linear.baseUrl
    }
  ]);
  
  config.linear = { ...config.linear, ...answers };
  await saveConfig(config);
  console.log('\n✓ Linear configuration saved!\n');
}

/**
 * Handle system configuration
 */
async function handleSystemConfig(config: WelcomeConfig): Promise<void> {
  console.log('\n💻 System Display Configuration\n');
  
  const answers = await inquirer.prompt<SystemConfig>([
    {
      type: 'list',
      name: 'showLoad',
      message: 'Show system load:',
      choices: [
        { name: 'True', value: true },
        { name: 'False', value: false }
      ],
      default: config.system.showLoad
    },
    {
      type: 'list',
      name: 'showMemory',
      message: 'Show memory usage:',
      choices: [
        { name: 'True', value: true },
        { name: 'False', value: false }
      ],
      default: config.system.showMemory
    },
    {
      type: 'list',
      name: 'showDisk',
      message: 'Show disk usage:',
      choices: [
        { name: 'True', value: true },
        { name: 'False', value: false }
      ],
      default: config.system.showDisk
    },
    {
      type: 'list',
      name: 'showBattery',
      message: 'Show battery status:',
      choices: [
        { name: 'True', value: true },
        { name: 'False', value: false }
      ],
      default: config.system.showBattery
    },
    {
      type: 'list',
      name: 'showUptime',
      message: 'Show system uptime:',
      choices: [
        { name: 'True', value: true },
        { name: 'False', value: false }
      ],
      default: config.system.showUptime
    }
  ]);
  
  config.system = answers;
  await saveConfig(config);
  console.log('\n✓ System configuration saved!\n');
}

/**
 * Handle cache configuration
 */
async function handleCacheConfig(config: WelcomeConfig): Promise<void> {
  console.log('\n⏱️  Cache Settings\n');
  
  const answers = await inquirer.prompt<CacheConfig>([
    {
      type: 'number',
      name: 'weatherDuration',
      message: 'Weather cache duration (seconds):',
      default: config.cache.weatherDuration
    },
    {
      type: 'number',
      name: 'githubDuration',
      message: 'GitHub cache duration (seconds):',
      default: config.cache.githubDuration
    },
    {
      type: 'number',
      name: 'quoteDuration',
      message: 'Quote cache duration (seconds):',
      default: config.cache.quoteDuration
    }
  ]);
  
  config.cache = answers;
  await saveConfig(config);
  console.log('\n✓ Cache settings saved!\n');
}

/**
 * Handle performance configuration
 */
async function handlePerformanceConfig(config: WelcomeConfig): Promise<void> {
  console.log('\n⚡ Performance Settings\n');
  
  const answers = await inquirer.prompt<PerformanceConfig>([
    {
      type: 'number',
      name: 'maxExecutionTime',
      message: 'Maximum execution time (seconds):',
      default: config.performance.maxExecutionTime
    },
    {
      type: 'list',
      name: 'parallelExecution',
      message: 'Enable parallel execution:',
      choices: [
        { name: 'True', value: true },
        { name: 'False', value: false }
      ],
      default: config.performance.parallelExecution
    },
    {
      type: 'list',
      name: 'showMetrics',
      message: 'Show performance metrics:',
      choices: [
        { name: 'True', value: true },
        { name: 'False', value: false }
      ],
      default: config.performance.showMetrics
    }
  ]);
  
  config.performance = answers;
  await saveConfig(config);
  console.log('\n✓ Performance settings saved!\n');
}

/**
 * Handle display configuration
 */
async function handleDisplayConfig(config: WelcomeConfig): Promise<void> {
  console.log('\n🎨 Display Preferences\n');
  
  const answers = await inquirer.prompt<DisplayConfig>([
    {
      type: 'list',
      name: 'useEmojis',
      message: 'Use emojis:',
      choices: [
        { name: 'True', value: true },
        { name: 'False', value: false }
      ],
      default: config.display.useEmojis
    },
    {
      type: 'list',
      name: 'colorTheme',
      message: 'Color theme:',
      choices: COLOR_THEME_CHOICES,
      default: config.display.colorTheme
    },
    {
      type: 'list',
      name: 'logLevel',
      message: 'Log level:',
      choices: LOG_LEVEL_CHOICES,
      default: config.display.logLevel
    }
  ]);
  
  config.display = answers;
  await saveConfig(config);
  console.log('\n✓ Display preferences saved!\n');
}

/**
 * Handle enabled modules configuration
 */
async function handleEnabledModules(config: WelcomeConfig): Promise<void> {
  console.log('\n🔌 Enabled Modules\n');
  
  const { enabledModules } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'enabledModules',
      message: 'Select modules to enable:',
      choices: MODULE_CHOICES,
      default: config.enabledModules
    }
  ]);
  
  config.enabledModules = enabledModules;
  await saveConfig(config);
  console.log('\n✓ Enabled modules saved!\n');
}

/**
 * Main config command handler
 */
export async function runConfigCommand(): Promise<void> {
  console.log('\n🚀 Terminal Brief Configuration\n');
  
  try {
    let running = true;
    
    while (running) {
      const selection = await promptMainMenu();
      
      if (selection === 'exit') {
        console.log('\n👋 Configuration complete!\n');
        running = false;
        break;
      }
      
      const config = await loadCurrentConfig();
      
      switch (selection) {
        case 'apiKeys':
          await handleApiKeys();
          break;
        case 'user':
          await handleUserConfig(config);
          break;
        case 'weather':
          await handleWeatherConfig(config);
          break;
        case 'github':
          await handleGitHubConfig(config);
          break;
        case 'linear':
          await handleLinearConfig(config);
          break;
        case 'system':
          await handleSystemConfig(config);
          break;
        case 'cache':
          await handleCacheConfig(config);
          break;
        case 'performance':
          await handlePerformanceConfig(config);
          break;
        case 'display':
          await handleDisplayConfig(config);
          break;
        case 'enabledModules':
          await handleEnabledModules(config);
          break;
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'User force closed the prompt') {
      console.log('\n\nConfiguration cancelled.\n');
      process.exit(0);
    }
    console.error('\nError during configuration:', error);
    process.exit(1);
  }
}
