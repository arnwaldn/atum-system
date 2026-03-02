import { spawn } from 'node:child_process';
import { config } from './config.js';
import { type ScheduleTask, type RunRecord, type RunStatusType } from './schema.js';
import { acquireLock, releaseLock } from './lock.js';
import { appendRun } from './history.js';
import { updateTaskState } from './store.js';
import { notify } from './notifier.js';
import { logger } from './logger.js';

const COMPONENT = 'executor';

interface SpawnResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  timedOut: boolean;
}

function spawnWithTimeout(command: string, args: string[], timeoutMs: number, cwd: string): Promise<SpawnResult> {
  return new Promise((resolve) => {
    const cleanEnv = { ...process.env };
    delete cleanEnv.CLAUDECODE;
    delete cleanEnv.CLAUDE_CODE_SESSION;

    const proc = spawn(command, args, {
      cwd,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: timeoutMs,
      env: cleanEnv,
    });

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    let timedOut = false;

    proc.stdout.on('data', (chunk: Buffer) => stdoutChunks.push(chunk));
    proc.stderr.on('data', (chunk: Buffer) => stderrChunks.push(chunk));

    proc.on('error', (err) => {
      logger.error(COMPONENT, `Spawn error: ${err.message}`);
      resolve({
        stdout: Buffer.concat(stdoutChunks).toString('utf-8'),
        stderr: err.message,
        exitCode: 1,
        timedOut: false,
      });
    });

    proc.on('close', (code, signal) => {
      if (signal === 'SIGTERM') timedOut = true;
      resolve({
        stdout: Buffer.concat(stdoutChunks).toString('utf-8'),
        stderr: Buffer.concat(stderrChunks).toString('utf-8'),
        exitCode: code ?? 1,
        timedOut,
      });
    });
  });
}

function truncateOutput(output: string): string {
  if (output.length <= config.maxOutputBytes) return output;
  return '...[truncated]...\n' + output.slice(-config.maxOutputBytes);
}

function generateRunId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export async function executeTask(task: ScheduleTask, triggeredBy: string): Promise<RunRecord> {
  const runId = generateRunId();
  const startTime = Date.now();

  logger.info(COMPONENT, `[${runId}] Starting: ${task.id}`, { triggeredBy });

  // Attempt lock
  const locked = await acquireLock(task.id);
  if (!locked) {
    const skippedRun: RunRecord = {
      id: runId,
      taskId: task.id,
      triggeredBy,
      status: 'skipped',
      exitCode: -1,
      duration: 0,
      output: 'Skipped: task already running (locked)',
      error: '',
      timestamp: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };
    await appendRun(skippedRun);
    return skippedRun;
  }

  let finalStatus: RunStatusType = 'failure';
  let result: SpawnResult = { stdout: '', stderr: '', exitCode: 1, timedOut: false };
  let attempt = 0;
  const maxAttempts = 1 + (task.retries || 0);

  try {
    while (attempt < maxAttempts) {
      attempt++;
      if (attempt > 1) {
        logger.info(COMPONENT, `[${runId}] Retry ${attempt - 1}/${task.retries} for ${task.id}`);
        await new Promise(r => setTimeout(r, (task.retryDelaySeconds || 60) * 1000));
      }

      // Build claude command args
      const args: string[] = [
        '-p', task.prompt,
        '--permission-mode', 'bypassPermissions',
        '--no-session-persistence',
        '--output-format', 'json',
        '--strict-mcp-config',
        '--mcp-config', task.mcpConfig || config.emptyMcpConfig,
      ];

      if (task.model) {
        args.push('--model', task.model);
      }
      if (task.maxBudgetUsd) {
        args.push('--max-budget-usd', String(task.maxBudgetUsd));
      }
      if (task.appendSystemPrompt) {
        args.push('--append-system-prompt', task.appendSystemPrompt);
      }

      const timeoutMs = (task.timeoutSeconds || config.defaultTimeoutSeconds) * 1000;

      result = await spawnWithTimeout('claude', args, timeoutMs, task.cwd);

      if (result.timedOut) {
        finalStatus = 'timeout';
        logger.warn(COMPONENT, `[${runId}] Task ${task.id} timed out after ${task.timeoutSeconds}s`);
      } else if (result.exitCode === 0) {
        finalStatus = 'success';
        break; // No retry needed
      } else {
        finalStatus = 'failure';
        logger.warn(COMPONENT, `[${runId}] Task ${task.id} failed (exit ${result.exitCode})`);
      }
    }
  } finally {
    await releaseLock(task.id);
  }

  const duration = Date.now() - startTime;
  const run: RunRecord = {
    id: runId,
    taskId: task.id,
    triggeredBy,
    status: finalStatus,
    exitCode: result.exitCode,
    duration,
    output: truncateOutput(result.stdout),
    error: truncateOutput(result.stderr),
    timestamp: new Date(startTime).toISOString(),
    completedAt: new Date().toISOString(),
  };

  // Persist
  await appendRun(run);
  await updateTaskState(task.id, {
    lastRunAt: run.completedAt,
    lastRunStatus: finalStatus,
    runCount: (task.runCount || 0) + 1,
  });

  // Disable one-off tasks
  if (task.trigger.type === 'once') {
    await updateTaskState(task.id, { enabled: false });
  }

  // Notify (async, non-blocking)
  notify(task, run).catch(err => {
    logger.error(COMPONENT, `Notification failed for ${task.id}: ${err}`);
  });

  logger.info(COMPONENT, `[${runId}] Completed: ${task.id}`, {
    status: finalStatus,
    duration: `${Math.round(duration / 1000)}s`,
    attempts: attempt,
  });

  return run;
}
