import { WelcomeModule } from './base';
import { WelcomeConfig } from '../types/config';
import { colorBoldText, colorText } from '../utils/color';
import { logger } from '../utils/logger';
import { apiRequest } from '../utils/cache';
import { LinearClient, Issue, Team } from '@linear/sdk';
import dayjs from 'dayjs';
import businessDays from 'dayjs-business-days2';


dayjs.extend(businessDays);

interface StalledIssue {
  issue: Issue;
  daysStalled: number;
}

async function getTeamByName(client: LinearClient, name: string): Promise<Team | undefined> {
  const teams = await client.teams();
  return teams.nodes.find(team => team.name.toLowerCase() === name.toLowerCase());
}

async function getStalledIssues(team: Team, daysStalled: number): Promise<StalledIssue[]> {
  const issues = await team.issues({ filter: { state: { name: { in: ['In Progress', 'In Review'] } } } });
  const now = dayjs();
  const stalled: StalledIssue[] = [];
  for (const issue of issues.nodes) {
    if (!issue.startedAt) continue;
    const startDate = dayjs(issue.startedAt);
    const businessDaysAfterStart = startDate.businessDaysAdd(daysStalled);
    const daysSince = now.diff(businessDaysAfterStart, 'day');
    if (daysSince > 0) {
      stalled.push({ issue, daysStalled: now.diff(startDate, 'day') });
    }
  }
  return stalled;
}

class LinearStalledModule implements WelcomeModule {
  name = 'linearStalled';
  private client: LinearClient | undefined;
  private teamIds: Record<string, string> = {};

  async setup(config: WelcomeConfig): Promise<void> {
    if (!config.linear.apiKey) {
      logger.warn('Linear API key not set. Linear module will be disabled.');
      return;
    }
    this.client = new LinearClient({ apiKey: config.linear.apiKey });

    for (const teamName of config.linear.teamNames) {
      try {
        const team = await getTeamByName(this.client, teamName);
        if (team) this.teamIds[teamName] = team.id;
        else logger.warn(`Linear team not found: ${teamName}`);
      } catch (e) {
        logger.warn(`Error fetching Linear team ${teamName}: ${e}`);
      }
    }
  }

  async display(config: WelcomeConfig): Promise<string> {
    const { daysStalled, teamNames, baseUrl } = config.linear;
    if (!this.client) {
      return `${colorBoldText('cyan', '▶')} Linear: ${colorText('yellow', '⚠️ Linear API not configured')}`;
    }
    let output = `${colorBoldText('cyan', '▶')} ${colorBoldText('white', 'Linear Stalled Issues:')}`;
    for (const teamName of teamNames) {
      output += `\n  ${colorBoldText('blue', teamName)}`;
      const cacheKey = `linear_stalled_${teamName.replace(/\s+/g, '_').toLowerCase()}`;
      let stalled: StalledIssue[] = [];
      try {
        stalled = await apiRequest<StalledIssue[]>(
          cacheKey,
          7200, // 2 hours cache
          async () => {
            const team = this.teamIds[teamName]
              ? await this.client!.team(this.teamIds[teamName])
              : await getTeamByName(this.client!, teamName);
            if (!team) return [];
            return getStalledIssues(team, daysStalled);
          }
        );
      } catch (e) {
        logger.warn(`Failed to fetch stalled issues for ${teamName}: ${e}`);
        output += `\n    ${colorText('red', 'Failed to fetch issues')}`;
        continue;
      }
      if (stalled.length === 0) {
        output += `\n    ${colorText('green', '✔ No stalled issues!')}`;
        continue;
      }
      for (const { issue, daysStalled } of stalled) {
        const url = `${baseUrl}${teamName.toLowerCase().replace(/\s+/g, '-')}/issue/${issue.identifier}`;
        output += `\n    ${colorText('yellow', '↳')} ${colorBoldText('white', issue.title)} (${colorText(daysStalled > 7 ? 'red' : 'magenta', `${daysStalled} days`)})`;
        output += `\n      ${colorText('blue', url)}`;
      }
    }
    return output + '\n';
  }

  async cleanup(): Promise<void> {
    // No cleanup needed
    return Promise.resolve();
  }
}

export const linearStalledModule = new LinearStalledModule(); 