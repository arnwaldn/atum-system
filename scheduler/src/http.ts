import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { config } from './config.js';
import { loadTask, loadAllTasks } from './store.js';
import { executeTask } from './executor.js';
import { getRecentRuns, getTaskStats } from './history.js';
import { getScheduledIds, scheduleAll } from './scheduler.js';
import { logger } from './logger.js';

const COMPONENT = 'http';

function json(res: ServerResponse, status: number, data: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function parseBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
  });
}

async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url || '/', `http://${config.host}:${config.port}`);
  const path = url.pathname;
  const method = req.method || 'GET';

  // GET /status — daemon health
  if (method === 'GET' && path === '/status') {
    const tasks = await loadAllTasks();
    const scheduledIds = getScheduledIds();

    json(res, 200, {
      status: 'running',
      uptime: process.uptime(),
      pid: process.pid,
      tasks: {
        total: tasks.length,
        enabled: tasks.filter(t => t.enabled).length,
        scheduled: scheduledIds.length,
      },
      port: config.port,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // POST /trigger/:id — manual trigger
  if (method === 'POST' && path.startsWith('/trigger/')) {
    const taskId = path.slice('/trigger/'.length);
    const task = await loadTask(taskId);

    if (!task) {
      json(res, 404, { error: `Task not found: ${taskId}` });
      return;
    }

    // Execute async (don't block the response)
    executeTask(task, 'manual').catch(err => {
      logger.error(COMPONENT, `Manual trigger failed for ${taskId}: ${err}`);
    });

    json(res, 202, { message: `Task ${taskId} triggered`, taskId });
    return;
  }

  // POST /webhook/:id — external webhook trigger
  if (method === 'POST' && path.startsWith('/webhook/')) {
    const taskId = path.slice('/webhook/'.length);
    const task = await loadTask(taskId);

    if (!task) {
      json(res, 404, { error: `Task not found: ${taskId}` });
      return;
    }

    if (!task.enabled) {
      json(res, 409, { error: `Task ${taskId} is disabled` });
      return;
    }

    const body = await parseBody(req);
    const triggeredBy = `webhook: ${body.slice(0, 100)}`;

    executeTask(task, triggeredBy).catch(err => {
      logger.error(COMPONENT, `Webhook trigger failed for ${taskId}: ${err}`);
    });

    json(res, 202, { message: `Task ${taskId} triggered via webhook`, taskId });
    return;
  }

  // POST /reload — hot-reload task definitions
  if (method === 'POST' && path === '/reload') {
    const tasks = await loadAllTasks();
    scheduleAll(tasks);
    json(res, 200, { message: 'Reloaded', taskCount: tasks.length });
    return;
  }

  // GET /runs?taskId=X&limit=N — query run history
  if (method === 'GET' && path === '/runs') {
    const taskId = url.searchParams.get('taskId') || undefined;
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const runs = getRecentRuns(taskId, limit);
    json(res, 200, { runs, count: runs.length });
    return;
  }

  // GET /stats/:id — task statistics
  if (method === 'GET' && path.startsWith('/stats/')) {
    const taskId = path.slice('/stats/'.length);
    const stats = getTaskStats(taskId);
    json(res, 200, { taskId, ...stats });
    return;
  }

  // GET /tasks — list all tasks
  if (method === 'GET' && path === '/tasks') {
    const tasks = await loadAllTasks();
    json(res, 200, { tasks, count: tasks.length });
    return;
  }

  // 404
  json(res, 404, { error: 'Not found' });
}

export function startHttpServer(): Promise<void> {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      handleRequest(req, res).catch(err => {
        logger.error(COMPONENT, `Request error: ${err}`);
        json(res, 500, { error: 'Internal server error' });
      });
    });

    server.listen(config.port, config.host, () => {
      logger.info(COMPONENT, `HTTP server listening on ${config.host}:${config.port}`);
      resolve();
    });

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        logger.error(COMPONENT, `Port ${config.port} already in use — another daemon running?`);
        process.exit(1);
      }
      throw err;
    });
  });
}
