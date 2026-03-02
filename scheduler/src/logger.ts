type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function timestamp(): string {
  return new Date().toISOString();
}

function formatMessage(level: LogLevel, component: string, message: string, meta?: Record<string, unknown>): string {
  const parts = [`[${timestamp()}]`, `[${level.toUpperCase()}]`, `[${component}]`, message];
  if (meta && Object.keys(meta).length > 0) {
    parts.push(JSON.stringify(meta));
  }
  return parts.join(' ');
}

export const logger = {
  info(component: string, message: string, meta?: Record<string, unknown>): void {
    console.log(formatMessage('info', component, message, meta));
  },

  warn(component: string, message: string, meta?: Record<string, unknown>): void {
    console.warn(formatMessage('warn', component, message, meta));
  },

  error(component: string, message: string, meta?: Record<string, unknown>): void {
    console.error(formatMessage('error', component, message, meta));
  },

  debug(component: string, message: string, meta?: Record<string, unknown>): void {
    if (process.env.DEBUG) {
      console.log(formatMessage('debug', component, message, meta));
    }
  },
};
