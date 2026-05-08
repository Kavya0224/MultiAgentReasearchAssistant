import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { logger } from './middleware/logger.js';

const app = express();

// A. Standard Middlewares
app.use(cors());         // Allow frontend requests
app.use(express.json()); // Allow the app to read JSON in request bodies

// B. Request Logging
// This tells Morgan to send its logs to our Winston logger
app.use(morgan('tiny', { 
  stream: { write: (message) => logger.info(message.trim()) } 
}));

// C. Simple Health Check
// A common production practice to see if the server is "alive"
app.get('/health', (req, res) => {
  res.json({ status: 'online', uptime: process.uptime() });
});

// D. Global Error Handler
// This catches any error thrown in our agents later on
app.use((err, req, res, next) => {
  logger.error(`UNEXPECTED ERROR: ${err.message}`);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

export default app;