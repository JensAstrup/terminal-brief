import { LogLevel, ColorTheme, WeatherUnits, defaultConfig, WelcomeConfig } from '../../types/config';

describe('LogLevel', () => {
  it('should have correct enum values', () => {
    expect(LogLevel.DEBUG).toBe(0);
    expect(LogLevel.INFO).toBe(1);
    expect(LogLevel.WARN).toBe(2);
    expect(LogLevel.ERROR).toBe(3);
  });
});

describe('ColorTheme', () => {
  it('should allow valid themes', () => {
    const theme: ColorTheme = 'default';
    expect(theme).toBe('default');
  });
});

describe('WeatherUnits', () => {
  it('should allow valid units', () => {
    const units: WeatherUnits = 'imperial';
    expect(units).toBe('imperial');
  });
});

describe('defaultConfig', () => {
  it('should have expected structure', () => {
    expect(defaultConfig.user.userName).toBeDefined();
    expect(defaultConfig.weather.units).toBeDefined();
    expect(defaultConfig.github.maxPRs).toBeGreaterThan(0);
    expect(Array.isArray(defaultConfig.enabledModules)).toBe(true);
  });
  it('should be assignable to WelcomeConfig', () => {
    const config: WelcomeConfig = defaultConfig;
    expect(config.user.userName).toBeDefined();
  });
}); 