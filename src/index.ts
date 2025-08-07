/**
 * Main entry point for the welcome message system
 */
import { loadConfig } from './config';
import { displayWelcome, moduleRegistry, setupModules } from './modules/base';
import { logger } from './utils/logger';
import { ensureCacheDir } from './utils/cache';
import { LogLevel } from './types/config';

/**
 * Initialize the welcome message system
 */
async function init() {
  try {
    // Ensure cache directory exists
    await ensureCacheDir();
    
    // Load config (or use migrated config if available)
    const config = await loadConfig();
    
    // Set debug level to see what's happening
    logger.setLevel(LogLevel.WARN);
    
    logger.debug(`Enabled modules in config: ${config.enabledModules.join(', ')}`);
    
    // Register modules
    const registeredModules = moduleRegistry.getAllModules();
    logger.debug(`Registered modules: ${registeredModules.map(m => m.name).join(', ')}`);
    
    const enabledModules = moduleRegistry.getEnabledModules(config);
    logger.debug(`Enabled and registered modules: ${enabledModules.map(m => m.name).join(', ')}`);
    
    // Set up modules
    await setupModules(config);
    
    // Display welcome message
    const welcomeMessage = await displayWelcome(config);
    logger.debug(`Welcome message length: ${welcomeMessage.length}`);
    logger.debug(`Welcome message content: "${welcomeMessage}"`);
    console.log(welcomeMessage);
    
    // Execute post-welcome command if configured
    if (config.postWelcomeCommand) {
      // This would be implemented to run a shell command
      logger.debug(`Executing post-welcome command: ${config.postWelcomeCommand}`);
    }
  } catch (error) {
    logger.error(`Failed to initialize welcome message system: ${error}`);
  }
}

// Run the program if this file is executed directly
if (require.main === module) {
  init();
}

init();

// Export for use as a module
export { init };
