import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { config } from './config.js';
import { type ScheduleTask, type RunRecord } from './schema.js';
import { logger } from './logger.js';

const gmailMcpConfig = join(config.schedulerDir, 'gmail-mcp.json');

const COMPONENT = 'notifier';

function shouldNotify(task: ScheduleTask, run: RunRecord): boolean {
  if (!task.notify) return false;
  const { on } = task.notify;
  if (on.includes('never')) return false;
  if (on.includes('always')) return true;
  if (on.includes('success') && run.status === 'success') return true;
  if (on.includes('failure') && run.status !== 'success') return true;
  return false;
}

function buildEmailPrompt(task: ScheduleTask, run: RunRecord): string {
  const statusLabel = run.status === 'success' ? 'SUCCESS' : run.status.toUpperCase();
  const durationStr = `${Math.round(run.duration / 1000)}s`;
  const email = task.notify?.email || config.defaultEmail;

  const outputSection = task.notify?.includeOutput && run.output
    ? `\n\nOutput (last 2000 chars):\n${run.output.slice(-2000)}`
    : '';

  const errorSection = run.error
    ? `\n\nErrors:\n${run.error.slice(-500)}`
    : '';

  return [
    'Send an email using the Gmail MCP send_email tool with the following details:',
    `To: ${email}`,
    `Subject: [Claude Scheduler] ${task.name} - ${statusLabel}`,
    'Body (in plain text):',
    `Task: ${task.name} (${task.id})`,
    `Status: ${statusLabel}`,
    `Duration: ${durationStr}`,
    `Triggered by: ${run.triggeredBy}`,
    `Time: ${run.timestamp}`,
    `Working directory: ${task.cwd}`,
    outputSection,
    errorSection,
  ].join('\n');
}

export async function notify(task: ScheduleTask, run: RunRecord): Promise<void> {
  if (!shouldNotify(task, run)) return;

  const prompt = buildEmailPrompt(task, run);

  logger.info(COMPONENT, `Sending notification for ${task.id} (${run.status})`);

  return new Promise((resolve) => {
    const cleanEnv = { ...process.env };
    delete cleanEnv.CLAUDECODE;
    delete cleanEnv.CLAUDE_CODE_SESSION;

    const proc = spawn('claude', [
      '-p', prompt,
      '--permission-mode', 'bypassPermissions',
      '--no-session-persistence',
      '--model', config.notificationModel,
      '--strict-mcp-config',
      '--mcp-config', gmailMcpConfig,
    ], {
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: config.notificationTimeoutMs,
      env: cleanEnv,
    });

    proc.on('close', (code) => {
      if (code === 0) {
        logger.info(COMPONENT, `Notification sent for ${task.id}`);
      } else {
        logger.error(COMPONENT, `Notification failed for ${task.id} (exit ${code})`);
      }
      resolve();
    });

    proc.on('error', (err) => {
      logger.error(COMPONENT, `Notification spawn error: ${err.message}`);
      resolve(); // Non-fatal
    });
  });
}
