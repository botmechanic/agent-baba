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
  }
};

// Initialize Solana connection
export const connection = new Connection(CONFIG.RPC_URL, 'confirmed');