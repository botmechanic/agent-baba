import { Pool } from 'pg';
import { CONFIG } from '../config';

export class DatabaseService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: CONFIG.DATABASE.host,
      port: CONFIG.DATABASE.port,
      database: CONFIG.DATABASE.database,
      user: CONFIG.DATABASE.user,
      password: CONFIG.DATABASE.password
    });
  }

  async query(text: string, params: any[]) {
    return this.pool.query(text, params);
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
    const result = await this.query(
      `INSERT INTO meteora_pool_states (
        pool_address,
        lp_supply,
        token_a_balance,
        token_b_balance,
        token_a_price,
        token_b_price,
        metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id`,
      [poolAddress, lpSupply, tokenABalance, tokenBBalance, tokenAPrice, tokenBPrice, metadata]
    );
    return result.rows[0].id;
  }

  async close() {
    await this.pool.end();
  }
}

export const dbService = new DatabaseService();