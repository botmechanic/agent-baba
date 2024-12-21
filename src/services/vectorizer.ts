import { DatabaseService } from './database';
import { CONFIG } from '../config';
import Anthropic from '@anthropic-ai/sdk';

export interface TradeVectorizer {
  vectorizeNewTrades(): Promise<void>;
  searchSimilarTrades(query: string, limit?: number): Promise<any[]>;
  getSimilarTradesByVector(embedding: number[], limit?: number): Promise<any[]>;
}

export class ClaudeTradeVectorizer implements TradeVectorizer {
  private batchSize = 10;
  private anthropic: Anthropic;

  constructor(private db: DatabaseService) {
    this.anthropic = new Anthropic({
      apiKey: CONFIG.CLAUDE_API_KEY
    });
  }

  private async createEmbedding(text: string): Promise<number[]> {
    try {
      const messages = [{
        role: 'user' as const,
        content: `Please generate a vector embedding for the following trade data to be used in similarity search: ${text}`
      }];

      const response = await this.anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1024,
        messages,
        system: "You are a financial data analysis assistant that specializes in creating vector embeddings for trade data. Generate embeddings that capture the essential characteristics of trades such as type, size, impact, and performance."
      }, {
        headers: {
          'Anthropic-Beta': 'tools=1'
        }
      });

      const toolOutput = response.content[0]?.text;
      if (!toolOutput) {
        throw new Error('Failed to get embedding from Claude');
      }

      const embedding = JSON.parse(toolOutput).embedding;
      return embedding;
    } catch (error) {
      console.error('Error creating embedding:', error);
      throw error;
    }
  }

  private formatTradeForEmbedding(trade: any): string {
    return `Trade: ${trade.trade_type} ${trade.amount_in} ${trade.token_in} for ${trade.amount_out} ${trade.token_out} at price ${trade.price_at_trade} with ${trade.estimated_price_impact}% price impact and ${trade.fees_sol} SOL fees. PNL: ${trade.trade_pnl_usd || 0} USD`;
  }

  async vectorizeNewTrades(): Promise<void> {
    try {
      // Get trades without embeddings
      const unvectorizedTrades = await this.db.query(`
        SELECT t.* 
        FROM paper_trades t
        LEFT JOIN trade_embeddings_store e ON t.id = e.trade_id
        WHERE e.id IS NULL
        ORDER BY t.created_at DESC
        LIMIT $1
      `, [this.batchSize]);

      for (const trade of unvectorizedTrades.rows) {
        const tradeText = this.formatTradeForEmbedding(trade);
        const embedding = await this.createEmbedding(tradeText);

        await this.db.query(`
          INSERT INTO trade_embeddings_store (
            chunk_id,
            trade_id,
            embedding,
            metadata
          ) VALUES ($1, $2, $3, $4)
        `, [
          `trade-${trade.id}`,
          trade.id,
          embedding,
          { 
            formatted_text: tradeText,
            vectorized_at: new Date().toISOString()
          }
        ]);

        console.log(`Created embedding for trade ${trade.id}`);
      }
    } catch (error) {
      console.error('Error vectorizing trades:', error);
      throw error;
    }
  }

  async searchSimilarTrades(query: string, limit: number = 5): Promise<any[]> {
    try {
      const queryEmbedding = await this.createEmbedding(query);
      return this.getSimilarTradesByVector(queryEmbedding, limit);
    } catch (error) {
      console.error('Error searching similar trades:', error);
      throw error;
    }
  }

  async getSimilarTradesByVector(embedding: number[], limit: number = 5): Promise<any[]> {
    try {
      const result = await this.db.query(`
        SELECT 
          e.*,
          1 - (e.embedding <=> $1::vector) as similarity
        FROM trade_embeddings_store e
        ORDER BY e.embedding <=> $1::vector
        LIMIT $2
      `, [embedding, limit]);

      return result.rows;
    } catch (error) {
      console.error('Error getting similar trades:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const tradeVectorizer = new ClaudeTradeVectorizer(new DatabaseService());