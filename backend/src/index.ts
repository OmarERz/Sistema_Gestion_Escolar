import app from './app.js';
import { env } from './config/env.js';

const start = async () => {
  try {
    app.listen(env.PORT, () => {
      console.log(`[backend] Server running on http://localhost:${env.PORT}`);
      console.log(`[backend] Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('[backend] Failed to start server:', error);
    process.exit(1);
  }
};

start();
