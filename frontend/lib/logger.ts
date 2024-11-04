// logger.ts
import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }), // Include stack trace
    format.splat(),
    format.json() // Log in JSON format
  ),
  defaultMeta: { service: 'form-submission-service' },
  transports: [
    new transports.Console(),
    // Add additional transports like files or external services if needed
  ],
});

export default logger;
