import Database from 'better-sqlite3';
import { mkdir } from 'node:fs/promises';
import { config } from './config.js';
import { type RunRecord } from './schema.js';
import { logger } from './logger.js';

const COMPONENT = 'history';

let db: Database.Database | null = null;

export async function initHistory(): Promise<void> {
  await mkdir(config.historyDir, { recursive: true });

  db = new Database(config.dbPath);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS runs (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      triggered_by TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'running',
      exit_code INTEGER DEFAULT -1,
      duration INTEGER DEFAULT 0,
      output TEXT DEFAULT '',
      error TEXT DEFAULT '',
      timestamp TEXT NOT NULL,
      completed_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_runs_task_id ON runs(task_id);
    CREATE INDEX IF NOT EXISTS idx_runs_timestamp ON runs(timestamp);
    CREATE INDEX IF NOT EXISTS idx_runs_status ON runs(status);
  `);

  logger.info(COMPONENT, 'Database initialized', { path: config.dbPath });
}

export async function appendRun(run: RunRecord): Promise<void> {
  if (!db) throw new Error('History database not initialized');

  const stmt = db.prepare(`
    INSERT INTO runs (id, task_id, triggered_by, status, exit_code, duration, output, error, timestamp, completed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    run.id,
    run.taskId,
    run.triggeredBy,
    run.status,
    run.exitCode,
    run.duration,
    run.output,
    run.error,
    run.timestamp,
    run.completedAt,
  );
}

export function getRecentRuns(taskId?: string, limit: number = 20): RunRecord[] {
  if (!db) throw new Error('History database not initialized');

  let query: string;
  let params: unknown[];

  if (taskId) {
    query = 'SELECT * FROM runs WHERE task_id = ? ORDER BY timestamp DESC LIMIT ?';
    params = [taskId, limit];
  } else {
    query = 'SELECT * FROM runs ORDER BY timestamp DESC LIMIT ?';
    params = [limit];
  }

  const rows = db.prepare(query).all(...params) as Array<Record<string, unknown>>;

  return rows.map(row => ({
    id: row.id as string,
    taskId: row.task_id as string,
    triggeredBy: row.triggered_by as string,
    status: row.status as RunRecord['status'],
    exitCode: row.exit_code as number,
    duration: row.duration as number,
    output: row.output as string,
    error: row.error as string,
    timestamp: row.timestamp as string,
    completedAt: row.completed_at as string | null,
  }));
}

export function getTaskStats(taskId: string): { total: number; success: number; failure: number; avgDuration: number } {
  if (!db) throw new Error('History database not initialized');

  const row = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
      SUM(CASE WHEN status = 'failure' THEN 1 ELSE 0 END) as failure,
      AVG(CASE WHEN status != 'skipped' THEN duration ELSE NULL END) as avg_duration
    FROM runs WHERE task_id = ?
  `).get(taskId) as Record<string, number>;

  return {
    total: row.total || 0,
    success: row.success || 0,
    failure: row.failure || 0,
    avgDuration: Math.round(row.avg_duration || 0),
  };
}

export function cleanupOldRuns(retentionDays: number = 30): number {
  if (!db) return 0;

  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();
  const result = db.prepare('DELETE FROM runs WHERE timestamp < ?').run(cutoff);
  return result.changes;
}

export function closeHistory(): void {
  if (db) {
    db.close();
    db = null;
  }
}
