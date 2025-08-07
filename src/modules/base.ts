/**
 * Base module interface and module management system
 */
import { WelcomeConfig } from '../types/config';
import { logger } from '../utils/logger';
import { startTimer, endTimer } from '../utils/performance';

/**
 * Interface for welcome message modules
 */
export interface WelcomeModule {
  /**
   * Unique name of the module
   */
  name: string;
  
  /**
   * Setup the module (runs once during initialization)
   */
  setup(config: WelcomeConfig): Promise<void>;
  
  /**
   * Display the module output (runs each time welcome is displayed)
   */
  display(config: WelcomeConfig): Promise<string>;
  
  /**
   * Clean up module resources (optional)
   */
  cleanup?(): Promise<void>;
}

/**
 * Module registry to manage modules
 */
export class ModuleRegistry {
  private modules: Map<string, WelcomeModule> = new Map();

  /**
   * Register a module
   */
  register(module: WelcomeModule): void {
    this.modules.set(module.name, module);
    logger.debug(`Registered module: ${module.name}`);
  }

  /**
   * Get a module by name
   */
  getModule(name: string): WelcomeModule | undefined {
    return this.modules.get(name);
  }

  /**
   * Get all registered modules
   */
  getAllModules(): WelcomeModule[] {
    return Array.from(this.modules.values());
  }

  /**
   * Get enabled modules based on config
   */
  getEnabledModules(config: WelcomeConfig): WelcomeModule[] {
    return config.enabledModules
      .map(name => this.modules.get(name))
      .filter((module): module is WelcomeModule => module !== undefined);
  }
}

// Create a singleton module registry
export const moduleRegistry = new ModuleRegistry();

// Register built-in modules
import { githubModule } from './github';
import { weatherModule } from './weather';
import { linearStalledModule } from './linearStalled';
import { systemModule } from './system';

moduleRegistry.register(githubModule);
moduleRegistry.register(weatherModule);
moduleRegistry.register(linearStalledModule);
moduleRegistry.register(systemModule);

/**
 * Setup all enabled modules
 */
export async function setupModules(config: WelcomeConfig): Promise<void> {
  const enabledModules = moduleRegistry.getEnabledModules(config);
  logger.debug(`Setting up ${enabledModules.length} modules`);
  
  for (const module of enabledModules) {
    try {
      startTimer(`setup_${module.name}`);
      await module.setup(config);
      const setupTime = endTimer(`setup_${module.name}`);
      
      logger.debug(`Module ${module.name} setup completed in ${setupTime}s`);
    } catch (error) {
      logger.error(`Failed to setup module ${module.name}: ${error}`);
    }
  }
}

/**
 * Display welcome message from all enabled modules
 */
export async function displayWelcome(config: WelcomeConfig): Promise<string> {
  const enabledModules = moduleRegistry.getEnabledModules(config);
  const output: string[] = [];
  
  // Start with a blank line for spacing
  output.push('');
  
  startTimer('display_welcome');
  
  // Run each module
  for (const module of enabledModules) {
    try {
      startTimer(`display_${module.name}`);
      const moduleOutput = await module.display(config);
      const displayTime = endTimer(`display_${module.name}`);
      
      if (moduleOutput) {
        output.push(moduleOutput);
      }
      
      // Report slow modules
      if (displayTime > 0.1) {
        logger.debug(`Module ${module.name} display took ${displayTime}s`);
      }
    } catch (error) {
      logger.error(`Failed to display module ${module.name}: ${error}`);
    }
  }
  
  // End with a blank line for spacing
  output.push('');
  
  const totalTime = endTimer('display_welcome');
  logger.debug(`Total welcome display time: ${totalTime}s`);
  
  return output.join('\n');
}
