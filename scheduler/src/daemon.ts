import { loadAllTasks } from './store.js';
import { initHistory, cleanupOldRuns, closeHistory } from './history.js';
import { scheduleAll, stopAll } from './scheduler.js';
import { watchAll, stopAllWatchers } from './watcher.js';
import { startHttpServer } from './http.js';
import { logger } from './logger.js';

const COMPONENT = 'daemon';

async function boot(): Promise<void> {
  logger.info(COMPONENT, 'Claude Scheduler starting...');

  // Initialize history database
  await initHistory();

  // Cleanup old runs (>30 days)
  const cleaned = cleanupOldRuns(30);
  if (cleaned > 0) {
    logger.info(COMPONENT, `Cleaned up ${cleaned} old run records`);
  }

  // Load task definitions
  const tasks = await loadAllTasks();

  // Register cron jobs and one-off timers
  scheduleAll(tasks);

  // Start file watchers for event-based tasks
  watchAll(tasks);

  // Start HTTP server for manual triggers, webhooks, and status
  await startHttpServer();

  logger.info(COMPONENT, 'Claude Scheduler ready', {
    tasks: tasks.length,
    enabled: tasks.filter(t => t.enabled).length,
  });
}

function shutdown(): void {
  logger.info(COMPONENT, 'Shutting down...');
  stopAll();
  stopAllWatchers();
  closeHistory();
  logger.info(COMPONENT, 'Goodbye');
  process.exit(0);
}

// Graceful shutdown
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Unhandled errors
process.on('uncaughtException', (err) => {
  logger.error(COMPONENT, `Uncaught exception: ${err.message}`, { stack: err.stack });
  shutdown();
});

process.on('unhandledRejection', (reason) => {
  logger.error(COMPONENT, `Unhandled rejection: ${reason}`);
});

// Start
boot().catch((err) => {
  logger.error(COMPONENT, `Boot failed: ${err.message}`, { stack: err.stack });
  process.exit(1);
});
