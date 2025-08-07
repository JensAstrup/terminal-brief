import { WelcomeModule } from './base';
import { WelcomeConfig, GitHubConfig } from '../types/config';
import { colorBoldText, colorText } from '../utils/color';
import { logger } from '../utils/logger';
import { apiRequest } from '../utils/cache';

// --- Types for GitHub API responses ---
interface GitHubUserResponse {
  login: string;
}

interface GitHubPRItem {
  title: string;
  number: number;
  repository_url: string;
}

interface GitHubSearchResponse {
  total_count: number;
  items: GitHubPRItem[];
}

// --- Helper functions ---
function getToken(config: GitHubConfig): string | undefined {
  return config.personalToken || process.env.GITHUB_PERSONAL_TOKEN || process.env.GITHUB_TOKEN;
}

async function fetchGitHub<T>(url: string, token: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'welcome-message-ts',
    },
  });
  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

async function getUsername(config: WelcomeConfig): Promise<string | undefined> {
  if (config.github.username) return config.github.username;
  const token = getToken(config.github);
  if (!token) return undefined;
  try {
    const data = await fetchGitHub<GitHubUserResponse>('https://api.github.com/user', token);
    return data.login;
  } catch (e) {
    logger.warn('Could not fetch GitHub username: ' + e);
    return undefined;
  }
}

function repoNameFromUrl(url: string): string {
  const parts = url.split('/');
  return parts[parts.length - 1];
}

// --- Main module class ---
class GitHubModule implements WelcomeModule {
  name = 'github';
  private username: string | undefined;
  private token: string | undefined;

  async setup(config: WelcomeConfig): Promise<void> {
    this.token = getToken(config.github);
    this.username = config.github.username || await getUsername(config);
    if (!this.token) {
      logger.warn('GitHub token not configured. GitHub information will not be available.');
    }
    if (!this.username) {
      logger.warn('GitHub username not configured or could not be fetched.');
    }
  }

  async display(config: WelcomeConfig): Promise<string> {
    if (!this.token || !this.username) {
      return `${colorBoldText('cyan', '▶')} GitHub: ${colorText('yellow', '⚠️ GitHub API not configured')}`;
    }
    const { showAssignedPRs, showCreatedPRs, showMentions, maxPRs } = config.github;
    const cacheAge = config.cache.githubDuration;
    let reviewCount = 0, createdCount = 0, mentionCount = 0;
    let reviewItems: string[] = [], createdItems: string[] = [], mentionItems: string[] = [];
    // --- Assigned PRs ---
    if (showAssignedPRs) {
      try {
        const reviewData = await apiRequest<GitHubSearchResponse>(
          `github_review_${this.username}`,
          cacheAge,
          () => fetchGitHub<GitHubSearchResponse>(
            `https://api.github.com/search/issues?q=is:open+is:pr+review-requested:${this.username}&per_page=${maxPRs}`,
            this.token!
          )
        );
        reviewCount = reviewData.total_count;
        reviewItems = reviewData.items.map(item => `${repoNameFromUrl(item.repository_url)} #${item.number}: ${item.title}`);
      } catch (e) {
        logger.warn('Failed to fetch review requests: ' + e);
      }
    }
    // --- Created PRs ---
    if (showCreatedPRs) {
      try {
        const createdData = await apiRequest<GitHubSearchResponse>(
          `github_created_${this.username}`,
          cacheAge,
          () => fetchGitHub<GitHubSearchResponse>(
            `https://api.github.com/search/issues?q=is:open+is:pr+author:${this.username}&per_page=${maxPRs}`,
            this.token!
          )
        );
        createdCount = createdData.total_count;
        createdItems = createdData.items.map(item => `${repoNameFromUrl(item.repository_url)}/${item.number}: ${item.title}`);
      } catch (e) {
        logger.warn('Failed to fetch created PRs: ' + e);
      }
    }
    // --- Mentions ---
    if (showMentions) {
      try {
        const mentionData = await apiRequest<GitHubSearchResponse>(
          `github_mentions_${this.username}`,
          cacheAge,
          () => fetchGitHub<GitHubSearchResponse>(
            `https://api.github.com/search/issues?q=is:open+is:pr+mentions:${this.username}&per_page=${maxPRs}`,
            this.token!
          )
        );
        mentionCount = mentionData.total_count;
        mentionItems = mentionData.items.map(item => `${repoNameFromUrl(item.repository_url)}/${item.number}: ${item.title}`);
      } catch (e) {
        logger.warn('Failed to fetch PR mentions: ' + e);
      }
    }
    // --- Build output ---
    let githubMessage = `${colorBoldText('cyan', '▶')} ${colorBoldText('white', 'GitHub:')}`;
    if (showAssignedPRs) {
      const reviewEmoji = '🔍';
      let reviewColor: 'green' | 'yellow' | 'red' = 'green';
      if (reviewCount > 3) reviewColor = 'red';
      else if (reviewCount > 0) reviewColor = 'yellow';
      githubMessage += ` ${reviewEmoji} ${colorBoldText(reviewColor, `${reviewCount} PRs`)} awaiting your review`;
    }
    if (showCreatedPRs) {
      githubMessage += ` | 📤 ${colorText('blue', `${createdCount}`)} created by you`;
    }
    if (showMentions) {
      githubMessage += ` | 💬 ${colorText('magenta', `${mentionCount}`)} mentions`;
    }
    // Details
    if (reviewItems.length > 0) {
      githubMessage += `\n  ${colorBoldText('yellow', 'PRs awaiting your review:')}`;
      for (const item of reviewItems) {
        githubMessage += `\n    ${colorText('blue', '↳')} ${colorText('white', item)}`;
      }
    }
    if (createdItems.length > 0) {
      githubMessage += `\n  ${colorBoldText('blue', 'Your open PRs:')}`;
      for (const item of createdItems) {
        githubMessage += `\n    ${colorText('green', '↳')} ${colorText('white', item)}`;
      }
    }
    if (mentionItems.length > 0) {
      githubMessage += `\n  ${colorBoldText('magenta', 'PR mentions:')}`;
      for (const item of mentionItems) {
        githubMessage += `\n    ${colorText('yellow', '↳')} ${colorText('white', item)}`;
      }
    }
    return githubMessage + '\n';
  }

  async cleanup(): Promise<void> {
    // No cleanup needed
    return Promise.resolve();
  }
}

export const githubModule = new GitHubModule(); 