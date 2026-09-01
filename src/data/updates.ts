import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

export const APP_VERSION = '0.0.2';
export const GITHUB_REPOSITORY = 'mcographics/ChainBreakerApp';
export const GITHUB_RELEASES_API = `https://api.github.com/repos/${GITHUB_REPOSITORY}/releases?per_page=20`;
export const GITHUB_RELEASES_PAGE = `https://github.com/${GITHUB_REPOSITORY}/releases`;

type GitHubAsset = { name?: unknown; size?: unknown; browser_download_url?: unknown };
type GitHubRelease = { tag_name?: unknown; name?: unknown; html_url?: unknown; body?: unknown; draft?: unknown; prerelease?: unknown; assets?: unknown };

export type AppRelease = {
  version: string;
  tag: string;
  name: string;
  notes: string;
  releaseUrl: string;
  apkUrl: string;
  apkName: string;
  apkSize: number;
};

export type UpdateResult = {
  currentVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
  release: AppRelease;
  checkedAt: string;
};

export type UpdateState = {
  phase: 'idle' | 'checking' | 'current' | 'available' | 'error';
  result?: UpdateResult;
  error?: string;
};

function parseVersion(value: string) {
  const match = value.trim().replace(/^v/i, '').match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/);
  if (!match) return null;
  return { core: match.slice(1, 4).map(Number), pre: match[4]?.split(/[.-]/).filter(Boolean) ?? [] };
}

export function compareVersions(left: string, right: string) {
  const a = parseVersion(left); const b = parseVersion(right);
  if (!a || !b) throw new Error('Unable to compare an invalid ChainBreaker version.');
  for (let index = 0; index < 3; index += 1) {
    if (a.core[index] !== b.core[index]) return a.core[index] > b.core[index] ? 1 : -1;
  }
  if (!a.pre.length && !b.pre.length) return 0;
  if (!a.pre.length) return 1;
  if (!b.pre.length) return -1;
  for (let index = 0; index < Math.max(a.pre.length, b.pre.length); index += 1) {
    if (a.pre[index] === undefined) return -1;
    if (b.pre[index] === undefined) return 1;
    if (a.pre[index] === b.pre[index]) continue;
    const aNumber = /^\d+$/.test(a.pre[index]); const bNumber = /^\d+$/.test(b.pre[index]);
    if (aNumber && bNumber) return Number(a.pre[index]) > Number(b.pre[index]) ? 1 : -1;
    if (aNumber !== bNumber) return aNumber ? -1 : 1;
    return a.pre[index].toLowerCase() > b.pre[index].toLowerCase() ? 1 : -1;
  }
  return 0;
}

function releaseVersion(tag: unknown) {
  if (typeof tag !== 'string' || !/^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(tag)) return '';
  return tag.slice(1);
}

function officialApkUrl(tag: string, name: string) {
  return `https://github.com/${GITHUB_REPOSITORY}/releases/download/${encodeURIComponent(tag)}/${encodeURIComponent(name)}`;
}

export async function checkForUpdate(fetchImpl: typeof fetch = globalThis.fetch): Promise<UpdateResult> {
  if (typeof fetchImpl !== 'function') throw new Error('The update service is unavailable.');
  const response = await fetchImpl(GITHUB_RELEASES_API, { headers: { Accept: 'application/vnd.github+json' }, cache: 'no-store' });
  if (!response.ok) throw new Error(`GitHub returned HTTP ${response.status}.`);
  const releases = await response.json() as GitHubRelease[];
  if (!Array.isArray(releases)) throw new Error('GitHub returned invalid release information.');
  const candidates = releases.map((release) => {
    const version = releaseVersion(release.tag_name);
    const assets = Array.isArray(release.assets) ? release.assets as GitHubAsset[] : [];
    const apkName = version ? `ChainBreaker-${version}.apk` : '';
    const apk = assets.find((asset) => asset.name === apkName && typeof asset.browser_download_url === 'string');
    if (!version || release.draft || release.prerelease || !apk) return null;
    return {
      version,
      tag: release.tag_name as string,
      name: typeof release.name === 'string' && release.name ? release.name : release.tag_name as string,
      notes: typeof release.body === 'string' && release.body ? release.body : 'No release notes were provided.',
      releaseUrl: typeof release.html_url === 'string' ? release.html_url : `https://github.com/${GITHUB_REPOSITORY}/releases/tag/${encodeURIComponent(release.tag_name as string)}`,
      apkUrl: officialApkUrl(release.tag_name as string, apkName),
      apkName,
      apkSize: typeof apk.size === 'number' ? apk.size : 0,
    } satisfies AppRelease;
  }).filter((release): release is AppRelease => Boolean(release));
  candidates.sort((left, right) => compareVersions(right.version, left.version));
  const release = candidates[0];
  if (!release) throw new Error('No published ChainBreaker APK release was found on GitHub.');
  return { currentVersion: APP_VERSION, latestVersion: release.version, updateAvailable: compareVersions(release.version, APP_VERSION) > 0, release, checkedAt: new Date().toISOString() };
}

export async function openUpdateInstaller(url: string) {
  if (!url.startsWith(`https://github.com/${GITHUB_REPOSITORY}/releases/download/`)) throw new Error('The update URL is not an official ChainBreaker release.');
  if (Capacitor.isNativePlatform()) await Browser.open({ url });
  else window.open(url, '_blank', 'noopener,noreferrer');
}
