import { startTimer, endTimer, measureTime, measureTimeSync } from '../../utils/performance';

describe('startTimer and endTimer', () => {
  it('should measure elapsed time', () => {
    startTimer('test');
    const duration = endTimer('test');
    expect(typeof duration).toBe('number');
    expect(duration).toBeGreaterThanOrEqual(0);
  });

  it('should throw if timer not started', () => {
    expect(() => endTimer('not_started')).toThrow();
  });
});

describe('measureTime', () => {
  it('should measure async function time', async () => {
    const result = await measureTime('async', async () => {
      return 42;
    });
    expect(result).toBe(42);
  });
});

describe('measureTimeSync', () => {
  it('should measure sync function time', () => {
    const result = measureTimeSync('sync', () => 7);
    expect(result).toBe(7);
  });
}); 