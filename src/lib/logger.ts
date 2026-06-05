import pino from 'pino';

// Detect environment
const isProduction = process.env.NODE_ENV === 'production';
const isServer = typeof window === 'undefined';

// Configure logger
export const logger = pino({
  level: process.env.NEXT_PUBLIC_LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  browser: {
    asObject: true,
    write: (o: any) => {
      // Browser console logging formatting
      const level = o.level === 30 ? 'info' : o.level === 40 ? 'warn' : o.level >= 50 ? 'error' : 'debug';
      const color = level === 'error' ? 'color: #ff6b6b' : level === 'warn' ? 'color: #ffd43b' : 'color: #4dabf7';
      console.log(`%c[${level.toUpperCase()}] %c${o.msg || ''}`, color, 'color: inherit', o.err || o.error || '');
    }
  },
  // Use pretty printing only in local development server environment
  transport: isServer && !isProduction
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});

// Specialized logging wrappers
export const logTracker = {
  apiError: (route: string, error: unknown, context?: Record<string, any>) => {
    logger.error({
      msg: `API error in ${route}`,
      err: error instanceof Error ? { message: error.message, stack: error.stack } : error,
      ...context,
    });
  },

  openAiError: (action: string, error: unknown, context?: Record<string, any>) => {
    logger.error({
      msg: `OpenAI service failure: ${action}`,
      err: error instanceof Error ? { message: error.message, stack: error.stack } : error,
      ...context,
    });
  },

  uploadFailure: (filename: string, error: unknown, context?: Record<string, any>) => {
    logger.error({
      msg: `Image upload failed for ${filename}`,
      err: error instanceof Error ? { message: error.message, stack: error.stack } : error,
      ...context,
    });
  },

  info: (msg: string, context?: Record<string, any>) => {
    logger.info({ msg, ...context });
  },

  warn: (msg: string, context?: Record<string, any>) => {
    logger.warn({ msg, ...context });
  },

  debug: (msg: string, context?: Record<string, any>) => {
    logger.debug({ msg, ...context });
  }
};
