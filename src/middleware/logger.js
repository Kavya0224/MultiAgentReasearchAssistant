import winston from 'winston';

export const logger = winston.createLogger({
  level: 'info', // Only log 'info' level and above (warn, error)
  format: winston.format.combine(
    winston.format.timestamp(), // Add time to the log
    winston.format.colorize(),  // Make it pretty in the terminal
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console() // For now, just show logs in terminal
  ],
});