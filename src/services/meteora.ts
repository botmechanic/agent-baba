import AmmImpl from '@mercurial-finance/dynamic-amm-sdk';
import { Connection, PublicKey } from '@solana/web3.js';
import { CONFIG } from '../config';
import { BN } from 'bn.js';
import Decimal from 'decimal.js';

interface MeteoraError {
  message: string;
}

export interface PoolState {
  poolAddress: string;
  lpSupply: string;
  tokenABalance: string;
  tokenBBalance: string;
  timestamp: Date;
}

export interface TradeQuote {
  amountIn: number;
  estimatedAmountOut: string;
  priceImpact: number;
  fee: string;
}

export interface PoolHealth {
  isHealthy: boolean;
  liquidityAdequate: boolean;
  priceDeviation: number;
  warnings: string[];
}

export class MeteoraService {
  private pool: AmmImpl | null = null;
  private initialized = false;

  constructor(
    private connection: Connection,
    private poolAddress: PublicKey
  ) {}

  isInitialized(): boolean {
    return this.initialized;
  }

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
      await this.validatePoolHealth();
      
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize Meteora pool:', error);
      return false;
    }
  }

  async getPoolState(): Promise<PoolState> {
    try {
      if (!this.pool) {
        throw new Error('Pool not initialized');
      }

      const poolState = this.pool.poolState;
      
      // For now, just return the mint addresses as placeholders
      return {
        poolAddress: this.poolAddress.toString(),
        lpSupply: poolState.lpMint.toString(),
        tokenABalance: poolState.tokenAMint.toString(),
        tokenBBalance: poolState.tokenBMint.toString(),
        timestamp: new Date()
      };
    } catch (error: any) {
      console.error('Failed to get pool state:', error);
      throw new Error(`Pool state fetch failed: ${error.message}`);
    }
  }

  async validatePoolHealth(): Promise<PoolHealth> {
    try {
      if (!this.pool) {
        throw new Error('Pool not initialized');
      }

      const state = await this.getPoolState();
      const warnings: string[] = [];

      // For now, skip liquidity checks since we're only getting mint addresses
      const liquidityAdequate = true;  // Temporary
      const priceDeviation = 0;        // Temporary

      // Overall health check
      const isHealthy = liquidityAdequate && priceDeviation < 0.05;

      return {
        isHealthy,
        liquidityAdequate,
        priceDeviation,
        warnings
      };
    } catch (error: unknown) {
      const err = error as MeteoraError;
      console.error('Failed to validate pool health:', err);
      throw new Error(`Pool health validation failed: ${err.message}`);
    }
  }

  async estimateMicroTrade(amountIn: number, slippage: number = 0.01): Promise<TradeQuote> {
    try {
      if (!this.pool) {
        throw new Error('Pool not initialized');
      }

      // Validate input amount
      if (typeof amountIn !== 'number' || isNaN(amountIn) || amountIn <= 0) {
        throw new Error('Invalid input amount. Must be a positive number.');
      }

      await this.pool.updateState();

      // Get token info for token B (SOL)
      const tokenB = this.pool.tokenB;
      const decimals = tokenB.decimals;
      const multiplier = Math.pow(10, decimals);

      // Get pool state
      const poolState = this.pool.poolState;
      const tokenBMint = poolState.tokenBMint;

      // Convert input amount to lamports
      const suggestedAmount = Math.floor(amountIn * multiplier);
      const amountInBN = new BN(suggestedAmount);

      // Get quote for micro-trade
      const quote = await this.pool.getSwapQuote(
        tokenBMint,  // Swap from SOL
        amountInBN,
        slippage
      );

      return {
        amountIn: suggestedAmount / multiplier, // Convert back to SOL
        estimatedAmountOut: quote.minSwapOutAmount.toString(),
        priceImpact: Number(quote.priceImpact),
        fee: quote.fee.toString() // Convert BN to string for easier handling
      };
    } catch (error: unknown) {
      const err = error as MeteoraError;
      console.error('Failed to estimate trade:', err);
      throw new Error(`Trade estimation failed: ${err.message}`);
    }
  }

  async calculatePriceImpact(amountIn: number): Promise<number> {
    try {
      if (!this.pool) {
        throw new Error('Pool not initialized');
      }

      const amountInBN = new BN(
        new Decimal(amountIn)
          .mul(new Decimal(10).pow(this.pool.tokenA.decimals))
          .toFixed(0)
      );

      const quote = await this.pool.getSwapQuote(
        new PublicKey(this.pool.tokenA.address),
        amountInBN,
        0.01 // Default slippage
      );

      return Number(quote.priceImpact);
    } catch (error: unknown) {
      const err = error as MeteoraError;
      console.error('Failed to calculate price impact:', err);
      throw new Error(`Price impact calculation failed: ${err.message}`);
    }
  }

  async getCurrentPrice(): Promise<number> {
    try {
      if (!this.pool) {
        throw new Error('Pool not initialized');
      }

      // Get raw pool data
      const rawPoolData = await this.connection.getAccountInfo(this.poolAddress);
      if (!rawPoolData) {
        throw new Error('Failed to get pool data');
      }

      // For now, return a placeholder price of 1
      return 1;

    } catch (error: unknown) {
      const err = error as MeteoraError;
      console.error('Failed to get current price:', err);
      throw new Error(`Price fetch failed: ${err.message}`);
    }
  }

  async updatePoolState(): Promise<void> {
    try {
      if (!this.pool) {
        throw new Error('Pool not initialized');
      }

      await this.pool.updateState();
    } catch (error: unknown) {
      const err = error as MeteoraError;
      console.error('Failed to update pool state:', err);
      throw new Error(`Pool state update failed: ${err.message}`);
    }
  }

  async getTokenInfo() {
    if (!this.pool) {
      throw new Error('Pool not initialized');
    }

    return {
      tokenA: this.pool.tokenA,
      tokenB: this.pool.tokenB
    };
  }
}