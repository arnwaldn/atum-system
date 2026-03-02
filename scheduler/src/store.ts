import { readdir, readFile, writeFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { config } from './config.js';
import { validateTask, type ScheduleTask } from './schema.js';
import { logger } from './logger.js';

const COMPONENT = 'store';

export async function loadAllTasks(): Promise<ScheduleTask[]> {
  const tasks: ScheduleTask[] = [];
  let files: string[];

  try {
    files = await readdir(config.schedulesDir);
  } catch {
    logger.warn(COMPONENT, 'Schedules directory not found, creating empty task list');
    return [];
  }

  const jsonFiles = files.filter(f => f.endsWith('.json') && !f.startsWith('.'));

  for (const file of jsonFiles) {
    try {
      const content = await readFile(join(config.schedulesDir, file), 'utf-8');
      const data = JSON.parse(content);
      const task = validateTask(data);
      tasks.push(task);
    } catch (err) {
      logger.error(COMPONENT, `Failed to load task from ${file}`, {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  logger.info(COMPONENT, `Loaded ${tasks.length} tasks from ${jsonFiles.length} files`);
  return tasks;
}

export async function loadTask(id: string): Promise<ScheduleTask | null> {
  const filePath = join(config.schedulesDir, `${id}.json`);
  try {
    const content = await readFile(filePath, 'utf-8');
    return validateTask(JSON.parse(content));
  } catch {
    return null;
  }
}

export async function saveTask(task: ScheduleTask): Promise<void> {
  const filePath = join(config.schedulesDir, `${task.id}.json`);
  const now = new Date().toISOString();

  const updated: ScheduleTask = {
    ...task,
    createdAt: task.createdAt || now,
    updatedAt: now,
  };

  await writeFile(filePath, JSON.stringify(updated, null, 2), 'utf-8');
  logger.info(COMPONENT, `Saved task: ${task.id}`);
}

export async function deleteTask(id: string): Promise<boolean> {
  const filePath = join(config.schedulesDir, `${id}.json`);
  try {
    await unlink(filePath);
    logger.info(COMPONENT, `Deleted task: ${id}`);
    return true;
  } catch {
    return false;
  }
}

export async function updateTaskState(
  id: string,
  updates: Partial<Pick<ScheduleTask, 'lastRunAt' | 'lastRunStatus' | 'runCount' | 'enabled'>>,
): Promise<void> {
  const task = await loadTask(id);
  if (!task) {
    logger.error(COMPONENT, `Cannot update state: task ${id} not found`);
    return;
  }

  const updated: ScheduleTask = {
    ...task,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await saveTask(updated);
}
