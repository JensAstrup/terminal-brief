/**
 * Cache utilities for the welcome message system
 */
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { logger } from './logger';

// Cache directory
const CACHE_DIR = path.join(os.homedir(), '.config', 'welcome', 'cache');

/**
 * Ensure the cache directory exists
 */
export async function ensureCacheDir(): Promise<void> {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch (error) {
    logger.error(`Failed to create cache directory: ${error}`);
  }
}

/**
 * Get data from cache if not expired
 */
export async function getCache<T>(cacheName: string, maxAge: number): Promise<T | null> {
  const cacheFile = path.join(CACHE_DIR, `${cacheName}.json`);
  
  try {
    const stats = await fs.stat(cacheFile);
    const fileAge = Date.now() - stats.mtimeMs;
    
    if (fileAge < maxAge * 1000) {
      const data = await fs.readFile(cacheFile, 'utf8');
      return JSON.parse(data) as T;
    }
  } catch {
    // File doesn't exist or can't be read - that's okay
  }
  
  return null;
}

/**
 * Save data to cache
 */
export async function saveCache<T>(cacheName: string, data: T): Promise<void> {
  try {
    await ensureCacheDir();
    const cacheFile = path.join(CACHE_DIR, `${cacheName}.json`);
    await fs.writeFile(cacheFile, JSON.stringify(data, null, 2), 'utf8');
    logger.debug(`Cached data for ${cacheName}`);
  } catch (error) {
    logger.error(`Failed to cache data for ${cacheName}: ${error}`);
  }
}

/**
 * Make API request with caching
 */
export async function apiRequest<T>(cacheName: string, cacheAge: number, requestFn: () => Promise<T>): Promise<T> {
  // Try to get from cache first
  const cachedData = await getCache<T>(cacheName, cacheAge);
  if (cachedData) {
    logger.debug(`Using cached data for ${cacheName}`);
    return cachedData;
  }

  // Cache miss, make the actual request
  logger.debug(`Cache miss for ${cacheName}, making API request`);
  try {
    const response = await requestFn();
    // Cache the successful response
    await saveCache(cacheName, response);
    return response;
  } catch (error) {
    logger.error(`API request failed for ${cacheName}: ${error}`);
    throw error;
  }
}
