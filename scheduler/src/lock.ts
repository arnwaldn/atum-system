import { writeFile, unlink, mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { config } from './config.js';
import { logger } from './logger.js';

const COMPONENT = 'lock';
const STALE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes — consider lock stale

interface LockData {
  taskId: string;
  pid: number;
  acquiredAt: string;
}

function lockPath(taskId: string): string {
  return join(config.lockDir, `${taskId}.lock`);
}

export async function acquireLock(taskId: string): Promise<boolean> {
  await mkdir(config.lockDir, { recursive: true });
  const path = lockPath(taskId);

  // Check if existing lock is stale
  try {
    const content = await readFile(path, 'utf-8');
    const data: LockData = JSON.parse(content);
    const age = Date.now() - new Date(data.acquiredAt).getTime();
    if (age > STALE_THRESHOLD_MS) {
      logger.warn(COMPONENT, `Stale lock for ${taskId} (${Math.round(age / 60000)}min), removing`);
      await unlink(path);
    } else {
      logger.info(COMPONENT, `Task ${taskId} already locked (pid: ${data.pid})`);
      return false;
    }
  } catch {
    // No existing lock — good
  }

  // Write lock file
  const lockData: LockData = {
    taskId,
    pid: process.pid,
    acquiredAt: new Date().toISOString(),
  };

  try {
    await writeFile(path, JSON.stringify(lockData), { flag: 'wx' }); // exclusive create
    return true;
  } catch {
    // Race condition — another process created the lock
    return false;
  }
}

export async function releaseLock(taskId: string): Promise<void> {
  try {
    await unlink(lockPath(taskId));
  } catch {
    // Lock already released
  }
}
