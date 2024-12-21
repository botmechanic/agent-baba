import { SolanaAgentKit, createSolanaTools } from 'solana-agent-kit';
import { PublicKey, Connection, Keypair } from '@solana/web3.js';
import { CONFIG } from '../config';
import bs58 from 'bs58';
import { MeteoraService } from './meteora';
import { PaperTradingService, paperTradingService } from './paper-trading';
import { aggregatedPriceService } from './price/aggregated';

interface MeteoraError {
  message: string;
}

export class AgentBABA {
  private agent: SolanaAgentKit;
  private tools: ReturnType<typeof createSolanaTools>;
  private meteoraService: MeteoraService;
  private paperTradingService: PaperTradingService;
  public wallet: Keypair;
  private paperPortfolioId?: number;

  constructor() {
    try {
      // Generate a new keypair for development
      this.wallet = Keypair.generate();
      const privateKeyBase58 = bs58.encode(this.wallet.secretKey);
      
      console.log('Wallet public key:', this.wallet.publicKey.toString());
      
      // Initialize agent
      this.agent = new SolanaAgentKit(
        privateKeyBase58,
        'https://api.devnet.solana.com',
        CONFIG.CLAUDE_API_KEY
      );
      
      // Create LangChain tools
      this.tools = createSolanaTools(this.agent);

      // Initialize Meteora service
      this.meteoraService = new MeteoraService(
        new Connection(CONFIG.RPC_URL),
        CONFIG.METEORA_POOL
      );

      // Initialize Meteora pool
      this.meteoraService.initialize()
        .then(success => {
          if (success) {
            console.log('Meteora pool initialized in agent');
          } else {
            console.error('Failed to initialize Meteora pool in agent');
          }
        })
        .catch(error => {
          console.error('Error initializing Meteora pool:', error);
        });

      // Initialize paper trading
      this.paperTradingService = paperTradingService;

    } catch (error) {
      console.error('Failed to initialize agent:', error);
      throw new Error('Failed to initialize agent. Check private key format.');
    }
  }

  async initializePaperTrading() {
    try {
      // Create paper trading portfolio
      this.paperPortfolioId = await this.paperTradingService.createPortfolio(
        this.wallet.publicKey.toString(),
        CONFIG.PAPER_TRADING.INITIAL_BALANCE.SOL,
        CONFIG.PAPER_TRADING.INITIAL_BALANCE.BABABILL
      );
      
      console.log('Paper trading portfolio initialized:', this.paperPortfolioId);
      return this.paperPortfolioId;
    } catch (error) {
      console.error('Failed to initialize paper trading:', error);
      throw error;
    }
  }

  async checkBABABILLPrice(): Promise<number> {
    try {
        const price = await aggregatedPriceService.getTokenPrice(CONFIG.BABABILL_TOKEN);
        return price.price;
    } catch (error) {
        console.error('Error checking BABABILL price:', error);
        throw error;
    }
}

  async getBalance(tokenMint?: PublicKey): Promise<number> {
    try {
      const balance = await this.agent.getBalance(tokenMint);
      return balance ?? 0;
    } catch (error) {
      console.error('Error getting balance:', error);
      throw error;
    }
  }

  async executePaperTrade(
    tradeType: 'BUY' | 'SELL',
    amountIn: number
  ) {
    try {
      if (!this.paperPortfolioId) {
        throw new Error('Paper trading not initialized');
      }

      // Double-check Meteora initialization
      if (!this.meteoraService.isInitialized()) {
        console.log('Re-initializing Meteora pool...');
        const success = await this.meteoraService.initialize();
        if (!success) {
          throw new Error('Failed to initialize Meteora pool');
        }
        console.log('Meteora pool re-initialized successfully');
      }

      // Get current BABABILL price
      const currentPrice = await this.checkBABABILLPrice();

      // Validate trade size
      const maxTradeSize = tradeType === 'BUY' 
        ? CONFIG.PAPER_TRADING.MAX_POSITION_SIZE.SOL
        : CONFIG.PAPER_TRADING.MAX_POSITION_SIZE.BABABILL;

      if (amountIn > maxTradeSize) {
        throw new Error(`Trade size exceeds maximum allowed (${maxTradeSize})`);
      }

      // Execute paper trade
      const trade = await this.paperTradingService.executePaperTrade(
        this.paperPortfolioId,
        tradeType,
        amountIn,
        currentPrice,
        CONFIG.TRADE_SETTINGS.DEFAULT_SLIPPAGE_BPS
      );

      // Update portfolio snapshot
      await this.paperTradingService.updatePortfolioSnapshot(this.paperPortfolioId);

      return trade;
    } catch (error) {
      console.error('Failed to execute paper trade:', error);
      throw error;
    }
  }

  async estimateMicroTrade(amountUsd: number = 1) {
    try {
      // Ensure positive amount
      if (typeof amountUsd !== 'number' || isNaN(amountUsd) || amountUsd <= 0) {
        throw new Error('Invalid USD amount. Must be a positive number.');
      }

      // Initialize pool only once
      if (!this.meteoraService.isInitialized()) {
        const success = await this.meteoraService.initialize();
        if (!success) {
          throw new Error('Failed to initialize Meteora pool');
        }
      }

      const price = await this.checkBABABILLPrice();
      if (!price || price <= 0) {
        throw new Error('Invalid price received from pool');
      }

      // Calculate token amount from USD value
      const tokenAmount = amountUsd / price;
      
      // Log for debugging
      console.log('Estimating trade:', {
        amountUsd,
        price,
        tokenAmount
      });

      return await this.meteoraService.estimateMicroTrade(
        tokenAmount,
        CONFIG.TRADE_SETTINGS.MAX_SLIPPAGE
      );
    } catch (error: unknown) {
      const err = error as MeteoraError;
      console.error('Error estimating micro-trade:', err);
      throw error;
    }
  }

  async getPaperPortfolioStatus() {
    // Check initialization without try-catch
    if (!this.paperPortfolioId) {
      return {
        status: 'uninitialized',
        message: 'Paper trading not initialized',
        action: 'Please initialize paper trading first',
        portfolio: null,
        stats: null,
        lastPrice: await this.checkBABABILLPrice()
      };
    }

    try {
      const [portfolio, stats] = await Promise.all([
        this.paperTradingService.getPortfolio(this.paperPortfolioId),
        this.paperTradingService.getPortfolioStats(this.paperPortfolioId)
      ]);

      return {
        status: 'active',
        message: 'Paper trading portfolio is active',
        portfolio,
        stats,
        lastPrice: await this.checkBABABILLPrice()
      };
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
      throw new Error('Failed to fetch portfolio data');
    }
  }

  async getPaperTrades(limit: number = 10, offset: number = 0) {
    if (!this.paperPortfolioId) {
      throw new Error('Paper trading not initialized');
    }
    return this.paperTradingService.getPortfolioTrades(
      this.paperPortfolioId,
      limit,
      offset
    );
  }
}

// Create singleton instance with error handling
let initializationError: Error | null = null;
let agentBABA: AgentBABA;

try {
  agentBABA = new AgentBABA();
  console.log('Agent BABA initialized successfully');
} catch (error) {
  console.error('Failed to initialize Agent BABA:', error);
  initializationError = error as Error;
  agentBABA = null!;
}

export { agentBABA, initializationError };