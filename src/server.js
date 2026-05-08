import app from './app.js';
import { config } from './config/index.js';
import { logger } from './middleware/logger.js';

const server = app.listen(config.port, () => {
  logger.info(`🚀 Research Assistant Backend live on port ${config.port}`);
});

// Senior Move: Handle "Clean Shutdowns"
// If the server crashes, try to close connections gracefully
process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Rejection at: ${reason}`);
  server.close(() => process.exit(1));
});