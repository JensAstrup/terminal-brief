import { Logger } from '../../utils/logger';
import { LogLevel } from '../../types/config';

describe('Logger', () => {
  let logger: Logger;
  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    logger = new Logger(LogLevel.DEBUG);
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('should log debug messages', () => {
    logger.setLevel(LogLevel.DEBUG);
    logger.debug('debug');
    expect(logSpy).toHaveBeenCalled();
  });

  it('should log info messages', () => {
    logger.setLevel(LogLevel.INFO);
    logger.info('info');
    expect(logSpy).toHaveBeenCalled();
  });

  it('should log warning messages', () => {
    logger.setLevel(LogLevel.WARN);
    logger.warn('warn');
    expect(logSpy).toHaveBeenCalled();
  });

  it('should log error messages', () => {
    logger.setLevel(LogLevel.ERROR);
    logger.error('error');
    expect(errorSpy).toHaveBeenCalled();
  });
}); 