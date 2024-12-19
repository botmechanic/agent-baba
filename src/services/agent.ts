import { SolanaAgentKit, createSolanaTools } from 'solana-agent-kit';
import { PublicKey, Connection, Keypair } from '@solana/web3.js';
import { CONFIG } from '../config';
import bs58 from 'bs58';
import { MeteoraService } from './meteora';

export class AgentBABA {
  private agent: SolanaAgentKit;
  private tools: ReturnType<typeof createSolanaTools>;
  private meteoraService: MeteoraService;
  public wallet: Keypair;

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
    } catch (error) {
      console.error('Failed to initialize agent:', error);
      throw new Error('Failed to initialize agent. Check private key format.');
    }
  }

  async checkBABABILLPrice(): Promise<number> {
    try {
      // Use a placeholder price for testing
      const PLACEHOLDER_PRICE = 1.0;  // 1 USD per token
      
      // Log for debugging
      console.log('Using placeholder price:', PLACEHOLDER_PRICE);
      
      return PLACEHOLDER_PRICE;

      /* TODO: Implement actual price calculation once pool is working
      const poolState = await this.meteoraService.getPoolState();
      const price = Number(poolState.tokenBBalance) / Number(poolState.tokenABalance);
      return price;
      */
    } catch (error: unknown) {
      const err = error as MeteoraError;
      console.error('Error checking BABABILL price:', err);
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