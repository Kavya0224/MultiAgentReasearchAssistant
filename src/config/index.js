import dotenv from 'dotenv';
dotenv.config(); // Loads the .env file

// 1. Define which keys are absolutely required
const requiredEnvs = ['GROQ_API_KEY'];

// 2. Check each key
requiredEnvs.forEach((key) => {
  if (!process.env[key]) {
    // Fail Fast: Stop the app if a key is missing
    throw new Error(`CRITICAL ERROR: ${key} is missing in .env file`);
  }
});

// 3. Export a clean config object
export const config = {
  port: process.env.PORT || 3000,
  groqKey: process.env.GROQ_API_KEY,
  env: process.env.NODE_ENV || 'development'
};