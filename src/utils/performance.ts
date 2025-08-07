/**
 * Performance tracking utilities for the welcome message system
 */

/**
 * Start timing a section
 */
const timers = new Map<string, number>();

/**
 * Start a timer
 */
export function startTimer(name: string): void {
  timers.set(name, performance.now());
}

/**
 * End a timer and get the duration in seconds
 */
export function endTimer(name: string): number {
  const startTime = timers.get(name);
  if (startTime === undefined) {
    throw new Error(`Timer "${name}" was not started`);
  }
  
  const endTime = performance.now();
  const durationMs = endTime - startTime;
  timers.delete(name);
  
  // Convert to seconds with 3 decimal places
  return parseFloat((durationMs / 1000).toFixed(3));
}

/**
 * Measure the execution time of a function
 */
export async function measureTime<T>(name: string, fn: () => Promise<T>): Promise<T> {
  startTimer(name);
  try {
    return await fn();
  } finally {
    endTimer(name);
  }
}

/**
 * Measure the execution time of a synchronous function
 */
export function measureTimeSync<T>(name: string, fn: () => T): T {
  startTimer(name);
  try {
    return fn();
  } finally {
    endTimer(name);
  }
}
