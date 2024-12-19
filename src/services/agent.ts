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

  async initializeMeteora() {
    return this.meteoraService.initialize();
  }

  async checkBABABILLPrice(): Promise<number> {
    try {
      const poolState = await this.meteoraService.getPoolState();
      // Calculate price based on pool balances
      // This is a simplified calculation - we'll make it more accurate
      const price = poolState.tokenBBalance / poolState.tokenABalance;
      return price;
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

  async estimateMicroTrade(amountUsd: number = 1) {
    try {
      const price = await this.checkBABABILLPrice();
      const tokenAmount = amountUsd / price;
      
      return await this.meteoraService.estimateMicroTrade(
        tokenAmount,
        CONFIG.TRADE_SETTINGS.MAX_SLIPPAGE
      );
    } catch (error) {
      console.error('Error estimating micro-trade:', error);
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
  
  // Initialize Meteora monitoring
  agentBABA.initializeMeteora()
    .then(success => {
      if (success) {
        console.log('Meteora monitoring initialized successfully');
      } else {
        console.error('Failed to initialize Meteora monitoring');
      }
    })
    .catch(error => {
      console.error('Error initializing Meteora monitoring:', error);
    });
} catch (error) {
  console.error('Failed to initialize Agent BABA:', error);
  initializationError = error as Error;
  agentBABA = null!;
}

export { agentBABA, initializationError };