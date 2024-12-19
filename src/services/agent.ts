import { SolanaAgentKit, createSolanaTools } from 'solana-agent-kit';
import { PublicKey, Keypair } from '@solana/web3.js';
import { CONFIG } from '../config';
import bs58 from 'bs58';

export class AgentBABA {
  private agent: SolanaAgentKit;
  private tools: ReturnType<typeof createSolanaTools>;
  public wallet: Keypair;

  constructor() {
    try {
      // Generate a new keypair for development
      this.wallet = Keypair.generate();
      
      // Convert secret key to bs58 string
      const privateKeyBase58 = bs58.encode(this.wallet.secretKey);
      
      console.log('Wallet public key:', this.wallet.publicKey.toString());
      
      // Initialize agent with bs58-encoded private key
      this.agent = new SolanaAgentKit(
        privateKeyBase58,
        'https://api.devnet.solana.com',
        CONFIG.CLAUDE_API_KEY
      );
      
      // Create LangChain tools for the agent
      this.tools = createSolanaTools(this.agent);
    } catch (error) {
      console.error('Failed to initialize agent:', error);
      throw new Error('Failed to initialize agent. Check private key format.');
    }
  }

  async checkBABABILLPrice(): Promise<number> {
    try {
      const balance = await this.getBalance(CONFIG.BABABILL_TOKEN);
      return balance || 0;
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
}

// Create singleton instance with more descriptive logging
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