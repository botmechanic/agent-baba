import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { agentBABA, initializationError } from './services/agent';
import { symbiosisService } from './services/symbiosis';

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
    return c.json({ 
      error: 'Failed to fetch price', 
      details: (error as Error).message 
    }, 500);
  }
});

// src/index.ts - Add new endpoints
app.get('/symbiosis/metrics', async (c) => {
  try {
    const metrics = await agentBABA.monitorSymbiosis();
    return c.json(metrics);
  } catch (error) {
    return c.json({ 
      error: 'Failed to get symbiosis metrics', 
      details: (error as Error).message 
    }, 500);
  }
});

app.get('/symbiosis/status', async (c) => {
  try {
    const correlation = await symbiosisService.trackTokenCorrelation();
    return c.json({
      status: correlation.isHealthy ? 'healthy' : 'needs attention',
      correlation: correlation.correlation,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({ 
      error: 'Failed to get symbiosis status', 
      details: (error as Error).message 
    }, 500);
  }
});

// Estimate micro-trade
app.get('/estimate-trade', async (c) => {
  try {
    const estimate = await agentBABA.estimateMicroTrade();
    return c.json(estimate);
  } catch (error) {
    return c.json({ 
      error: 'Failed to estimate trade', 
      details: (error as Error).message 
    }, 500);
  }
});

// Paper Trading Endpoints

// Initialize paper trading
app.post('/paper-trading/initialize', async (c) => {
  try {
    const portfolioId = await agentBABA.initializePaperTrading();
    return c.json({ 
      success: true, 
      portfolioId,
      message: 'Paper trading initialized successfully'
    });
  } catch (error) {
    return c.json({ 
      error: 'Failed to initialize paper trading', 
      details: (error as Error).message 
    }, 500);
  }
});

// Get paper portfolio status
app.get('/paper-trading/status', async (c) => {
  console.log('Hit status endpoint');  // Add this line
  try {
    const status = await agentBABA.getPaperPortfolioStatus();
    return c.json(status);
  } catch (error) {
    console.error('Status endpoint error:', error);  // Add this line
    return c.json({ 
      error: 'Failed to get paper trading status', 
      details: (error as Error).message 
    }, 500);
  }
});

// Execute paper trade
app.post('/paper-trading/trade', async (c) => {
  try {
    const body = await c.req.json();
    const { tradeType, amountIn } = body;

    // Validate input
    if (!['BUY', 'SELL'].includes(tradeType)) {
      return c.json({ error: 'Invalid trade type. Must be BUY or SELL' }, 400);
    }
    if (typeof amountIn !== 'number' || amountIn <= 0) {
      return c.json({ error: 'Invalid amount. Must be a positive number' }, 400);
    }

    const trade = await agentBABA.executePaperTrade(tradeType, amountIn);
    return c.json({
      success: true,
      trade,
      message: `${tradeType} trade executed successfully`
    });
  } catch (error) {
    return c.json({ 
      error: 'Failed to execute paper trade', 
      details: (error as Error).message 
    }, 500);
  }
});

// Get paper trading history
app.get('/paper-trading/trades', async (c) => {
  try {
    const limit = Number(c.req.query('limit')) || 10;
    const offset = Number(c.req.query('offset')) || 0;
    
    const trades = await agentBABA.getPaperTrades(limit, offset);
    return c.json({
      trades,
      pagination: {
        limit,
        offset,
        hasMore: trades.length === limit
      }
    });
  } catch (error) {
    return c.json({ 
      error: 'Failed to get paper trades', 
      details: (error as Error).message 
    }, 500);
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

// Log registered routes
console.log('Registered routes:');
app.routes.forEach(route => {
  console.log(`${route.method} ${route.path}`);
});
serve({
  fetch: app.fetch,
  port: port as number
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`);
});