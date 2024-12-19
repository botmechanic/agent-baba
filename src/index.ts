import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { agentBABA, initializationError } from './services/agent';

const app = new Hono();

// Health check endpoint with detailed status
app.get('/health', (c) => {
  return c.json({
    status: initializationError ? 'error' : 'ok',
    timestamp: new Date().toISOString(),
    wallet: agentBABA?.wallet?.publicKey?.toString() || 'not initialized',
    error: initializationError?.message || null,
    initialization: initializationError ? 'failed' : 'success'
  });
});

// Error handling middleware
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json({
    error: err.message,
    status: 'error',
    timestamp: new Date().toISOString()
  }, 500);
});

const port = process.env.PORT || 3000;
console.log(`Starting server on port ${port}...`);

if (initializationError) {
  console.warn('Server starting with initialization errors. Some features may not work.');
}

serve({
  fetch: app.fetch,
  port: port as number
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`);
});