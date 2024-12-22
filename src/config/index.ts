import { Connection, PublicKey } from '@solana/web3.js';

export const CONFIG = {
  // Existing token and pool addresses
  BABABILL_TOKEN: new PublicKey('39xVYiSXUAed2ksrr7KJLxJfbsM9TL7Cs8MMEsKZuABX'),
  METEORA_POOL: new PublicKey('FdE5htL7DfgDqBYESeKbW3TzyWWtA1mLx3MvQjMMGE7u'),
  RAYDIUM_POOL: new PublicKey('GtveJQpWcUY4PENc9CxnBws5ccMF5VvnGohrj1enUzfr'),
  SOL_MINT: new PublicKey("So11111111111111111111111111111111111111112"),
  TOKEN_A_MINT: process.env.TOKEN_A_MINT!,
  TOKEN_A_DECIMALS: parseInt(process.env.TOKEN_A_DECIMALS!),
  TOKEN_A_SYMBOL: process.env.TOKEN_A_SYMBOL!,
  TOKEN_B_MINT: process.env.TOKEN_B_MINT!,
  TOKEN_B_DECIMALS: parseInt(process.env.TOKEN_B_DECIMALS!),
  TOKEN_B_SYMBOL: process.env.TOKEN_B_SYMBOL!,
  
  // RPC and API endpoints
  RPC_URL: process.env.HELIUS_RPC_URL || 'https://rpc.helius.xyz/?api-key=YOUR_API_KEY',
  CLAUDE_API_KEY: process.env.CLAUDE_API_KEY || '',
  BIRDEYE_API_KEY: process.env.BIRDEYE_API_KEY || '',
  
  // Database configuration
  DATABASE: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DB || 'agent_baba',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres'
  },
  
  // Trading parameters
  TRADE_SETTINGS: {
    MIN_PRICE_CHANGE_THRESHOLD: 0.02,
    MAX_SLIPPAGE: 0.01,
    MIN_TRADE_INTERVAL_MS: 5 * 60 * 1000,
    MIN_SOL_BALANCE: 0.05,
    DEFAULT_SLIPPAGE_BPS: 300
  },

  // Paper Trading Settings
  PAPER_TRADING: {
    INITIAL_BALANCE: {
      SOL: 1.0,           // Initial SOL balance for new paper portfolios
      BABABILL: 1000.0    // Initial BABABILL balance
    },
    MAX_POSITION_SIZE: {
      SOL: 10.0,          // Maximum SOL per trade
      BABABILL: 10000.0   // Maximum BABABILL per trade
    },
    MIN_TRADE_INTERVAL_MS: 5 * 60 * 1000,  // 5 minutes between trades
    SNAPSHOT_INTERVAL_MS: 15 * 60 * 1000,  // 15 minutes between portfolio snapshots
    RISK_PARAMS: {
      MAX_DRAWDOWN_PCT: 10,        // Maximum drawdown percentage
      MAX_DAILY_TRADES: 48,        // Maximum trades per day
      MIN_PROFIT_TARGET_PCT: 0.5   // Minimum profit target percentage
    }
  },

  TOKENS: {
    BABABILL: new PublicKey('39xVYiSXUAed2ksrr7KJLxJfbsM7TL7Cs8MMEsKZuABX'),
    AGENTB: new PublicKey('3y4LYYzTiCu4AGN4ksTtF7ZNoqmCy3daBcXVrjPApump'), // Deploy this
  },
  
  SYMBIOSIS: {
    MIN_CORRELATION: 0.7,
    PERFORMANCE_WINDOW_HOURS: 24,
    MAX_PRICE_DIVERGENCE: 0.1, // 10%
    ADJUSTMENT_THRESHOLD: 0.05,
    TRADE_SIZE_MULTIPLIER: 1.5
  }
};

// Initialize Solana connection
export const connection = new Connection(CONFIG.RPC_URL, 'confirmed');