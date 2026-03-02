import cron from 'node-cron';
import { type ScheduleTask } from './schema.js';
import { executeTask } from './executor.js';
import { logger } from './logger.js';

const COMPONENT = 'scheduler';

interface ScheduledJob {
  task: ScheduleTask;
  stop: () => void;
}

const jobs = new Map<string, ScheduledJob>();
const oneOffTimers = new Map<string, NodeJS.Timeout>();

export function scheduleTask(task: ScheduleTask): void {
  // Remove existing job if any
  unscheduleTask(task.id);

  if (!task.enabled) {
    logger.debug(COMPONENT, `Skipping disabled task: ${task.id}`);
    return;
  }

  if (task.trigger.type === 'cron') {
    if (!cron.validate(task.trigger.cron)) {
      logger.error(COMPONENT, `Invalid cron expression for ${task.id}: ${task.trigger.cron}`);
      return;
    }

    const cronJob = cron.schedule(task.trigger.cron, () => {
      executeTask(task, 'cron').catch(err => {
        logger.error(COMPONENT, `Execution failed for ${task.id}: ${err}`);
      });
    }, { scheduled: true });

    jobs.set(task.id, {
      task,
      stop: () => cronJob.stop(),
    });

    logger.info(COMPONENT, `Scheduled cron task: ${task.id}`, { cron: task.trigger.cron });

  } else if (task.trigger.type === 'once') {
    const targetTime = new Date(task.trigger.scheduledAt).getTime();
    const delay = targetTime - Date.now();

    if (delay <= 0) {
      logger.warn(COMPONENT, `One-off task ${task.id} scheduled in the past, executing now`);
      executeTask(task, 'once-immediate').catch(err => {
        logger.error(COMPONENT, `Execution failed for ${task.id}: ${err}`);
      });
      return;
    }

    const timer = setTimeout(() => {
      executeTask(task, 'once').catch(err => {
        logger.error(COMPONENT, `Execution failed for ${task.id}: ${err}`);
      });
      oneOffTimers.delete(task.id);
    }, delay);

    oneOffTimers.set(task.id, timer);

    const targetDate = new Date(task.trigger.scheduledAt);
    logger.info(COMPONENT, `Scheduled one-off task: ${task.id}`, {
      at: targetDate.toLocaleString(),
      inMinutes: Math.round(delay / 60000),
    });
  }
  // Event triggers handled by watcher.ts, not here
}

export function unscheduleTask(id: string): void {
  const job = jobs.get(id);
  if (job) {
    job.stop();
    jobs.delete(id);
    logger.debug(COMPONENT, `Unscheduled cron task: ${id}`);
  }

  const timer = oneOffTimers.get(id);
  if (timer) {
    clearTimeout(timer);
    oneOffTimers.delete(id);
    logger.debug(COMPONENT, `Cancelled one-off timer: ${id}`);
  }
}

export function scheduleAll(tasks: ScheduleTask[]): void {
  // Clear all existing
  for (const id of jobs.keys()) unscheduleTask(id);
  for (const id of oneOffTimers.keys()) unscheduleTask(id);

  // Register enabled tasks
  const enabled = tasks.filter(t => t.enabled);
  for (const task of enabled) {
    scheduleTask(task);
  }

  logger.info(COMPONENT, `Scheduled ${enabled.length}/${tasks.length} tasks`);
}

export function getScheduledIds(): string[] {
  return [...jobs.keys(), ...oneOffTimers.keys()];
}

export function stopAll(): void {
  for (const id of [...jobs.keys()]) unscheduleTask(id);
  for (const id of [...oneOffTimers.keys()]) unscheduleTask(id);
  logger.info(COMPONENT, 'All tasks unscheduled');
}
