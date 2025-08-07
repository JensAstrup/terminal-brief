import { loadConfig, saveConfig, migrateFromZsh } from '../../config/index';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { WelcomeConfig, defaultConfig } from '../../types/config';

describe('config management', () => {
  const tempDir = path.join(os.tmpdir(), 'welcome-test-config');
  const configFile = path.join(tempDir, 'config.json');
  const zshFile = path.join(tempDir, 'config.zsh');
  let oldHome: string | undefined;

  beforeAll(async () => {
    oldHome = process.env.HOME;
    process.env.HOME = tempDir;
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterAll(async () => {
    if (oldHome) process.env.HOME = oldHome;
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should load default config if file does not exist', async () => {
    await fs.rm(configFile, { force: true });
    const config = await loadConfig();
    expect(config.user.userName).toBeDefined();
  });

  it('should save and load config', async () => {
    const config: WelcomeConfig = { ...defaultConfig, user: { userName: 'TestUser' } };
    await saveConfig(config);
    const loaded = await loadConfig();
    expect(loaded.user.userName).toBe('TestUser');
  });

  it('should migrate from zsh config', async () => {
    const zshContent = 'USER_NAME="MigratedUser"\n';
    await fs.writeFile(zshFile, zshContent, 'utf8');
    const migrated = await migrateFromZsh();
    expect(migrated && migrated.user.userName).toBe('MigratedUser');
  });
}); 