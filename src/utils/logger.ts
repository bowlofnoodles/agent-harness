import winston from 'winston';

const { combine, timestamp, printf, colorize } = winston.format;

const logFormat = printf(({ level, message, timestamp: logTimestamp, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${logTimestamp} [${level}]${metaStr}: ${message}`;
});

export function createLogger(level: string = 'info'): winston.Logger {
  return winston.createLogger({
    level,
    format: combine(
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      logFormat,
    ),
    transports: [
      new winston.transports.Console({
        format: combine(
          colorize(),
          timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          logFormat,
        ),
      }),
      new winston.transports.File({
        filename: '.harness/agent.log',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
    ],
  });
}

export const logger = createLogger();
