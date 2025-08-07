import os from 'os';
import { WelcomeModule } from './base';
import { WelcomeConfig, SystemConfig } from '../types/config';
import { colorText, colorBoldText } from '../utils/color';
import { logger } from '../utils/logger';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

async function getDiskUsage(): Promise<string> {
  // Only works on Unix-like systems
  try {
    const { stdout } = await execAsync('df -h /');
    const lines = stdout.trim().split('\n');
    if (lines.length > 1) {
      const parts = lines[1].split(/\s+/);
      return `${parts[2]} used / ${parts[1]} total (${parts[4]} used)`;
    }
  } catch (error) {
    logger.warn('Could not get disk usage');
  }
  return 'N/A';
}

async function getBatteryInfo(): Promise<string> {
  // macOS: use pmset, Linux: upower or acpi
  try {
    const { stdout } = await execAsync('pmset -g batt');
    const match = stdout.match(/(\d+)%/);
    if (match) {
      return `${match[1]}%`;
    }
  } catch {
    // Try Linux
    try {
      const { stdout } = await execAsync('upower -i $(upower -e | grep BAT) | grep percentage');
      const match = stdout.match(/(\d+)%/);
      if (match) {
        return `${match[1]}%`;
      }
    } catch {
      // Not available
    }
  }
  return 'N/A';
}

function getUptime(): string {
  const uptime = os.uptime();
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);
  return `${hours}h ${minutes}m ${seconds}s`;
}

class SystemModule implements WelcomeModule {
  name = 'system';

  async setup(_config: WelcomeConfig): Promise<void> {
    // No setup needed
    return Promise.resolve();
  }

  async display(config: WelcomeConfig): Promise<string> {
    const sys: SystemConfig = config.system;
    const lines: string[] = [];
    lines.push(colorBoldText('yellow', 'System Information:'));

    if (sys.showLoad) {
      const loads = os.loadavg();
      lines.push(`${colorText('cyan', 'Load')}: ${loads.map(l => l.toFixed(2)).join(', ')}`);
    }
    if (sys.showMemory) {
      const total = os.totalmem();
      const free = os.freemem();
      lines.push(`${colorText('green', 'Memory')}: ${formatBytes(total - free)} used / ${formatBytes(total)} total`);
    }
    if (sys.showDisk) {
      const disk = await getDiskUsage();
      lines.push(`${colorText('magenta', 'Disk')}: ${disk}`);
    }
    if (sys.showBattery) {
      const battery = await getBatteryInfo();
      lines.push(`${colorText('yellow', 'Battery')}: ${battery}`);
    }
    if (sys.showUptime) {
      lines.push(`${colorText('blue', 'Uptime')}: ${getUptime()}`);
    }
    return lines.join('\n');
  }

  async cleanup(): Promise<void> {
    return Promise.resolve();
  }
}

export const systemModule = new SystemModule(); 