import { ensureCacheDir, getCache, saveCache, apiRequest } from '../../utils/cache';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('cache utils', () => {
  const tempDir = path.join(os.tmpdir(), 'welcome-test-cache');
  const cacheName = 'test';
  const cacheFile = path.join(tempDir, `${cacheName}.json`);

  beforeAll(async () => {
    process.env.HOME = tempDir; // override for test
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should ensure cache directory exists', async () => {
    await ensureCacheDir();
    const exists = await fs.stat(tempDir).then(() => true, () => false);
    expect(exists).toBe(true);
  });

  it('should save and get cache', async () => {
    const data = { foo: 'bar' };
    await saveCache(cacheName, data);
    const result = await getCache<typeof data>(cacheName, 1000);
    expect(result).toEqual(data);
  });

  it('should return null for expired cache', async () => {
    const data = { foo: 'baz' };
    await saveCache(cacheName, data);
    // artificially set mtime to old
    await fs.utimes(cacheFile, new Date(), new Date(Date.now() - 2000 * 1000));
    const result = await getCache<typeof data>(cacheName, 1);
    expect(result).toBeNull();
  });

  it('should use apiRequest and cache result', async () => {
    let called = 0;
    const fn = async () => { called++; return { value: 123 }; };
    const result1 = await apiRequest('api', 1000, fn);
    const result2 = await apiRequest('api', 1000, fn);
    expect(result1).toEqual({ value: 123 });
    expect(result2).toEqual({ value: 123 });
    expect(called).toBe(1);
  });
}); 