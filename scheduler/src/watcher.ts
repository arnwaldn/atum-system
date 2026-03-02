import { watch as chokidarWatch, type FSWatcher } from 'chokidar';
import { type ScheduleTask } from './schema.js';
import { executeTask } from './executor.js';
import { logger } from './logger.js';

const COMPONENT = 'watcher';

const watchers = new Map<string, FSWatcher>();
const debounceTimers = new Map<string, NodeJS.Timeout>();

function debounce(taskId: string, fn: () => void, delayMs: number): void {
  const existing = debounceTimers.get(taskId);
  if (existing) clearTimeout(existing);

  const timer = setTimeout(() => {
    debounceTimers.delete(taskId);
    fn();
  }, delayMs);

  debounceTimers.set(taskId, timer);
}

export function watchTask(task: ScheduleTask): void {
  if (task.trigger.type !== 'event') return;
  if (!task.enabled) return;

  // Stop existing watcher for this task
  unwatchTask(task.id);

  if (task.trigger.event === 'file-change') {
    const pattern = task.trigger.pattern || '**/*';
    const debounceMs = task.trigger.debounceMs || 5000;

    const watcher = chokidarWatch(pattern, {
      cwd: task.cwd,
      ignoreInitial: true,
      persistent: true,
      ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**'],
    });

    const triggerFn = (changedPath: string) => {
      debounce(task.id, () => {
        logger.info(COMPONENT, `File change detected for ${task.id}: ${changedPath}`);
        executeTask(task, `file-change: ${changedPath}`).catch(err => {
          logger.error(COMPONENT, `File-change execution failed for ${task.id}: ${err}`);
        });
      }, debounceMs);
    };

    watcher.on('change', triggerFn);
    watcher.on('add', triggerFn);
    watcher.on('unlink', triggerFn);

    watchers.set(task.id, watcher);
    logger.info(COMPONENT, `Watching files for ${task.id}`, { pattern, cwd: task.cwd, debounceMs });

  } else if (task.trigger.event === 'git-push' || task.trigger.event === 'webhook') {
    // These are handled via HTTP endpoints in http.ts
    logger.info(COMPONENT, `Task ${task.id} uses ${task.trigger.event} trigger (HTTP-based)`);
  }
}

export function unwatchTask(id: string): void {
  const watcher = watchers.get(id);
  if (watcher) {
    watcher.close().catch(() => {});
    watchers.delete(id);
  }

  const timer = debounceTimers.get(id);
  if (timer) {
    clearTimeout(timer);
    debounceTimers.delete(id);
  }
}

export function watchAll(tasks: ScheduleTask[]): void {
  // Stop all existing watchers
  for (const id of watchers.keys()) unwatchTask(id);

  // Start watchers for enabled event tasks
  const eventTasks = tasks.filter(t => t.enabled && t.trigger.type === 'event');
  for (const task of eventTasks) {
    watchTask(task);
  }

  logger.info(COMPONENT, `Watching ${eventTasks.length} event tasks`);
}

export function stopAllWatchers(): void {
  for (const id of [...watchers.keys()]) unwatchTask(id);
  logger.info(COMPONENT, 'All watchers stopped');
}
