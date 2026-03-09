import { z } from 'zod';

// --- Trigger schemas ---

const CronTrigger = z.object({
  type: z.literal('cron'),
  cron: z.string().min(9).max(100), // "* * * * *" minimum
});

const EventTrigger = z.object({
  type: z.literal('event'),
  event: z.enum(['file-change', 'git-push', 'webhook']),
  pattern: z.string().optional(),     // glob for file-change, branch for git-push
  debounceMs: z.number().int().min(0).default(5000),
});

const OnceTrigger = z.object({
  type: z.literal('once'),
  scheduledAt: z.string().datetime(), // ISO 8601
});

const Trigger = z.discriminatedUnion('type', [CronTrigger, EventTrigger, OnceTrigger]);

// --- Notification schema ---

const NotifyConfig = z.object({
  on: z.array(z.enum(['success', 'failure', 'always', 'never'])).default(['failure']),
  email: z.string().email(),
  includeOutput: z.boolean().default(true),
});

// --- Task schema ---

export const TaskSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/).min(3).max(64),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),

  trigger: Trigger,

  prompt: z.string().min(1).max(10000),
  cwd: z.string().min(1),
  model: z.enum(['opus', 'sonnet', 'haiku']).optional(),
  maxBudgetUsd: z.number().positive().optional(),
  timeoutSeconds: z.number().int().min(10).max(3600).default(300),
  worktree: z.boolean().default(false),
  appendSystemPrompt: z.string().max(5000).optional(),
  maxTurns: z.number().int().min(1).max(50).default(10),
  mcpConfig: z.string().max(500).optional(), // path to MCP config JSON (default: empty = no MCP)

  notify: NotifyConfig.optional(),

  enabled: z.boolean().default(true),
  retries: z.number().int().min(0).max(5).default(0),
  retryDelaySeconds: z.number().int().min(0).max(600).default(60),
  concurrencyGroup: z.string().default('default'),
  tags: z.array(z.string()).default([]),

  // State (managed by daemon)
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  lastRunAt: z.string().datetime().nullable().optional(),
  lastRunStatus: z.enum(['success', 'failure', 'timeout', 'skipped']).nullable().optional(),
  runCount: z.number().int().min(0).default(0),
});

export type ScheduleTask = z.infer<typeof TaskSchema>;

// --- Run record (stored in SQLite) ---

export const RunStatus = z.enum(['running', 'success', 'failure', 'timeout', 'skipped']);
export type RunStatusType = z.infer<typeof RunStatus>;

export interface RunRecord {
  id: string;           // UUID short (8 chars)
  taskId: string;
  triggeredBy: string;  // "cron", "file-change: *.ts", "manual", "webhook"
  status: RunStatusType;
  exitCode: number;
  duration: number;     // milliseconds
  output: string;       // stdout (truncated to 50KB)
  error: string;        // stderr
  timestamp: string;    // ISO 8601
  completedAt: string | null;
}

// --- Validation helpers ---

export function validateTask(data: unknown): ScheduleTask {
  return TaskSchema.parse(data);
}

export function validateTaskPartial(data: unknown): Partial<ScheduleTask> {
  return TaskSchema.partial().parse(data);
}
