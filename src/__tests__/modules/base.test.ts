import { ModuleRegistry, setupModules, displayWelcome } from '../../modules/base';
import { WelcomeModule } from '../../modules/base';
import { WelcomeConfig, defaultConfig } from '../../types/config';

describe('ModuleRegistry', () => {
  it('should register and retrieve modules', () => {
    const registry = new ModuleRegistry();
    const mod: WelcomeModule = {
      name: 'test',
      async setup() {},
      async display() { return 'hi'; }
    };
    registry.register(mod);
    expect(registry.getModule('test')).toBe(mod);
    expect(registry.getAllModules()).toContain(mod);
  });
});

describe('setupModules', () => {
  it('should call setup on enabled modules', async () => {
    const called: string[] = [];
    const mod: WelcomeModule = {
      name: 'test',
      async setup() { called.push('setup'); },
      async display() { return 'hi'; }
    };
    const registry = new ModuleRegistry();
    registry.register(mod);
    const config: WelcomeConfig = { ...defaultConfig, enabledModules: ['test'] };
    await setupModules.call({ moduleRegistry: registry }, config);
    expect(called).toContain('setup');
  });
});

describe('displayWelcome', () => {
  it('should call display on enabled modules and return output', async () => {
    const mod: WelcomeModule = {
      name: 'test',
      async setup() {},
      async display() { return 'hi'; }
    };
    const registry = new ModuleRegistry();
    registry.register(mod);
    const config: WelcomeConfig = { ...defaultConfig, enabledModules: ['test'] };
    const output = await displayWelcome.call({ moduleRegistry: registry }, config);
    expect(output).toContain('hi');
  });
}); 