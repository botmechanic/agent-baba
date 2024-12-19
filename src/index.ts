import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { agentBABA, initializationError } from './services/agent';

const app = new Hono();

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: initializationError ? 'error' : 'ok',
    timestamp: new Date().toISOString(),
    wallet: agentBABA?.wallet?.publicKey?.toString() || 'not initialized',
    error: initializationError?.message || null,
    initialization: initializationError ? 'failed' : 'success'
  });
});

// Get BABABILL price
app.get('/price', async (c) => {
  try {
    const price = await agentBABA.checkBABABILLPrice();
    return c.json({ price });
  } catch (error) {
    return c.json({ error: 'Failed to fetch price', details: (error as Error).message }, 500);
  }
});

// Estimate micro-trade
app.get('/estimate-trade', async (c) => {
  try {
    const estimate = await agentBABA.estimateMicroTrade();
    return c.json(estimate);
  } catch (error) {
    return c.json({ error: 'Failed to estimate trade', details: (error as Error).message }, 500);
  }
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

serve({
  fetch: app.fetch,
  port: port as number
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`);
});