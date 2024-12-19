import { Connection, PublicKey } from '@solana/web3.js';

export const CONFIG = {
  // Token and Pool addresses
  BABABILL_TOKEN: new PublicKey('39xVYiSXUAed2ksrr7KJLxJfbsM9TL7Cs8MMEsKZuABX'),
  METEORA_POOL: new PublicKey('FdE5htL7DfgDqBYESeKbW3TzyWWtA1mLx3MvQjMMGE7u'),
  RAYDIUM_POOL: new PublicKey('GtveJQpWcUY4PENc9CxnBws5ccMF5VvnGohrj1enUzfr'),
  SOL_MINT: new PublicKey("So11111111111111111111111111111111111111112"),
  
  // RPC and API endpoints
  RPC_URL: process.env.HELIUS_RPC_URL || 'https://rpc.helius.xyz/?api-key=YOUR_API_KEY',
  CLAUDE_API_KEY: process.env.CLAUDE_API_KEY || '',
  
  // Trading parameters
  TRADE_SETTINGS: {
    MIN_PRICE_CHANGE_THRESHOLD: 0.02, // 2% price change trigger
    MAX_SLIPPAGE: 0.01, // 1% max slippage
    MIN_TRADE_INTERVAL_MS: 5 * 60 * 1000, // 5 minutes
    MIN_SOL_BALANCE: 0.05, // Minimum SOL to keep for fees
    DEFAULT_SLIPPAGE_BPS: 300 // 3% default slippage
  }
};

// Initialize Solana connection
export const connection = new Connection(CONFIG.RPC_URL, 'confirmed');