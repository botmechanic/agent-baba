import { Pool } from 'pg';
import { CONFIG } from '../config';

export class DatabaseService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool(CONFIG.DATABASE);
  }

  async recordPoolState(
    poolAddress: string,
    lpSupply: string,
    tokenABalance: string,
    tokenBBalance: string,
    tokenAPrice: number,
    tokenBPrice: number,
    metadata?: Record<string, any>
  ): Promise<number> {
    const result = await this.pool.query(
      'SELECT record_pool_state($1, $2, $3, $4, $5, $6, $7) as state_id',
      [poolAddress, lpSupply, tokenABalance, tokenBBalance, tokenAPrice, tokenBPrice, metadata]
    );
    return result.rows[0].state_id;
  }

  async recordTrade(
    poolAddress: string,
    inputToken: string,
    outputToken: string,
    inputAmount: number,
    expectedOutput: number,
    poolStateId: number,
    metadata?: Record<string, any>
  ): Promise<number> {
    const result = await this.pool.query(
      'SELECT record_trade($1, $2, $3, $4, $5, $6, $7) as trade_id',
      [poolAddress, inputToken, outputToken, inputAmount, expectedOutput, poolStateId, metadata]
    );
    return result.rows[0].trade_id;
  }

  async updateTradeExecution(
    tradeId: number,
    actualOutput: number,
    signature: string,
    status: 'executed' | 'failed',
    errorMessage?: string
  ): Promise<void> {
    await this.pool.query(
      `UPDATE trades 
       SET actual_output_amount = $2,
           transaction_signature = $3,
           status = $4::trade_status,
           error_message = $5
       WHERE id = $1`,
      [tradeId, actualOutput, signature, status, errorMessage]
    );
  }

  async getRecentPoolStates(
    poolAddress: string,
    limit: number = 10
  ) {
    const result = await this.pool.query(
      `SELECT * FROM meteora_pool_states 
       WHERE pool_address = $1 
       ORDER BY timestamp DESC 
       LIMIT $2`,
      [poolAddress, limit]
    );
    return result.rows;
  }

  async getRecentTrades(
    poolAddress: string,
    limit: number = 10
  ) {
    const result = await this.pool.query(
      `SELECT t.*, ps.* 
       FROM trades t
       LEFT JOIN meteora_pool_states ps ON t.pool_state_id = ps.id
       WHERE t.pool_address = $1
       ORDER BY t.timestamp DESC
       LIMIT $2`,
      [poolAddress, limit]
    );
    return result.rows;
  }

  async close() {
    await this.pool.end();
  }
}

// Export singleton instance
export const dbService = new DatabaseService();