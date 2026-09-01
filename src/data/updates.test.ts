import { describe, expect, it } from 'vitest';
import { checkForUpdate, compareVersions } from './updates';

describe('ChainBreaker release updates', () => {
  it('compares stable and prerelease versions', () => {
    expect(compareVersions('0.0.2', '0.0.1')).toBe(1);
    expect(compareVersions('0.0.1', '0.0.1')).toBe(0);
    expect(compareVersions('0.0.1-beta.1', '0.0.1')).toBe(-1);
  });

  it('accepts only the official versioned ChainBreaker APK', async () => {
    const result = await checkForUpdate(async () => ({
      ok: true,
      status: 200,
      json: async () => [{
        tag_name: 'v0.0.3',
        name: 'ChainBreaker 0.0.3',
        html_url: 'https://github.com/mcographics/ChainBreakerApp/releases/tag/v0.0.3',
        body: 'Bug fixes.',
        draft: false,
        prerelease: false,
        assets: [{ name: 'ChainBreaker-0.0.3.apk', size: 100, browser_download_url: 'https://github.com/mcographics/ChainBreakerApp/releases/download/v0.0.3/ChainBreaker-0.0.3.apk' }],
      }],
    }) as Response);
    expect(result.updateAvailable).toBe(true);
    expect(result.release.apkUrl).toBe('https://github.com/mcographics/ChainBreakerApp/releases/download/v0.0.3/ChainBreaker-0.0.3.apk');
  });

  it('rejects a release without the expected APK', async () => {
    await expect(checkForUpdate(async () => ({
      ok: true,
      status: 200,
      json: async () => [{ tag_name: 'v0.0.3', draft: false, prerelease: false, assets: [] }],
    }) as Response)).rejects.toThrow('No published ChainBreaker APK release');
  });
});
