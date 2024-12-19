import AmmImpl from '@mercurial-finance/dynamic-amm-sdk';
import { Connection, PublicKey } from '@solana/web3.js';
import { CONFIG } from '../config';
import Decimal from 'decimal.js';

export class MeteoraService {
  private pool: AmmImpl | null = null;

  constructor(
    private connection: Connection,
    private poolAddress: PublicKey
  ) {}

  async initialize() {
    try {
      console.log('Initializing Meteora pool monitoring...');
      
      // Create token info objects
      const tokenInfoA = {
        address: CONFIG.TOKEN_A_MINT,
        decimals: CONFIG.TOKEN_A_DECIMALS,
        symbol: CONFIG.TOKEN_A_SYMBOL,
        chainId: 101,  // Solana's chain ID
        name: CONFIG.TOKEN_A_SYMBOL
      };

      const tokenInfoB = {
        address: CONFIG.TOKEN_B_MINT,
        decimals: CONFIG.TOKEN_B_DECIMALS,
        symbol: CONFIG.TOKEN_B_SYMBOL,
        chainId: 101,
        name: CONFIG.TOKEN_B_SYMBOL
      };
      
      // Initialize the pool with token info
      this.pool = await AmmImpl.create(
        this.connection,
        this.poolAddress,
        tokenInfoA,
        tokenInfoB
      );

      console.log('Meteora pool initialized successfully');
      
      return true;
    } catch (error) {
      console.error('Failed to initialize Meteora pool:', error);
      return false;
    }
  }

  async getPoolState(): Promise<{
    poolAddress: string;
    lpSupply: string;
    tokenABalance: string;
    tokenBBalance: string;
    timestamp: Date;
  }> {
    try {
      if (!this.pool) {
        throw new Error('Pool not initialized');
      }

      // Just return the mint addresses for now
      const poolState = this.pool.poolState;
      
      return {
        poolAddress: this.poolAddress.toString(),
        lpSupply: poolState.lpMint.toString(),
        tokenABalance: poolState.tokenAMint.toString(),
        tokenBBalance: poolState.tokenBMint.toString(),
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Failed to get pool state:', error);
      throw error;
    }
  }

  async estimateMicroTrade(amountIn: number, slippage: number = 0.01) {
    try {
      if (!this.pool) {
        throw new Error('Pool not initialized');
      }

      // Get quote for micro-trade
      const quote = await this.pool.getSwapQuote(
        new PublicKey(this.pool.tokenA.address),
        new Decimal(amountIn).toNumber(),
        slippage
      );

      return {
        amountIn,
        estimatedAmountOut: quote.minSwapOutAmount.toString(),
        priceImpact: quote.priceImpact,
        fee: quote.fee
      };
    } catch (error) {
      console.error('Failed to estimate trade:', error);
      throw error;
    }
  }
}