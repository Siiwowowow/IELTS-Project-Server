import { Redis } from "ioredis";
import { envVars } from "./env.js";

// Initialize Redis only if REDIS_URL is provided, avoiding deployment crashes if omitted initially
export const redisClient = envVars.REDIS_URL ? new Redis(envVars.REDIS_URL) : null;

if (redisClient) {
  redisClient.on('error', (err) => {
    console.error('Redis connection error:', err);
  });
  
  redisClient.on('connect', () => {
    console.log('Redis connected successfully!');
  });
}
