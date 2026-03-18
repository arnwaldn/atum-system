import { homedir } from 'node:os';
import { join } from 'node:path';

const HOME = homedir();

export const config = {
  // Paths
  schedulesDir: join(HOME, '.claude', 'schedules'),
  historyDir: join(HOME, '.claude', 'schedules', '.history'),
  dbPath: join(HOME, '.claude', 'schedules', '.history', 'runs.db'),
  lockDir: join(HOME, '.claude', 'schedules', '.locks'),
  schedulerDir: join(HOME, '.claude', 'scheduler'),
  emptyMcpConfig: join(HOME, '.claude', 'scheduler', 'empty-mcp.json'),

  // HTTP server
  host: '127.0.0.1',
  port: parseInt(process.env.SCHEDULER_PORT || '4820', 10),

  // Execution defaults
  defaultTimeoutSeconds: 300,
  defaultModel: 'sonnet',
  maxOutputBytes: 50 * 1024, // 50KB truncation for stored output

  // Notification
  notificationModel: 'haiku',
  notificationTimeoutMs: 180_000, // 3 min — Gmail MCP needs startup + tool call
  defaultEmail: 'contact@atum.tech',

  // Daemon
  pollIntervalMs: 10_000, // reload check interval
} as const;
