import { DatabaseService } from './database';
import { MeteoraService } from './meteora';
import { CONFIG } from '../config';
import { Connection } from '@solana/web3.js';

export interface PaperPortfolio {
    id: number;
    walletAddress: string;
    initialBalanceSol: number;
    initialBalanceBababill: number;
    currentBalanceSol: number;
    currentBalanceBababill: number;
    totalPnlUsd: number;
    totalFeesSol: number;
    tradesCount: number;
    winningTradesCount: number;
    createdAt: Date;
    updatedAt: Date;
    metadata?: Record<string, any>;
}

export interface PaperTrade {
    id: number;
    portfolioId: number;
    tradeType: 'BUY' | 'SELL';
    tokenIn: string;
    tokenOut: string;
    amountIn: number;
    amountOut: number;
    priceAtTrade: number;
    estimatedPriceImpact: number;
    slippageBps: number;
    feesSol: number;
    virtualSignature: string;
    poolStateId: number;
    status: 'PENDING' | 'EXECUTED' | 'FAILED' | 'CANCELLED';
    executedAt?: Date;
    createdAt: Date;
    tradePnlUsd?: number;
    metadata?: Record<string, any>;
}

export class PaperTradingService {
    constructor(
        private db: DatabaseService,
        private meteora: MeteoraService
    ) {}

    private mapDatabaseRowToPortfolio(row: any): PaperPortfolio {
        return {
            id: row.id,
            walletAddress: row.wallet_address,
            initialBalanceSol: Number(row.initial_balance_sol),
            initialBalanceBababill: Number(row.initial_balance_bababill),
            currentBalanceSol: Number(row.current_balance_sol),
            currentBalanceBababill: Number(row.current_balance_bababill),
            totalPnlUsd: Number(row.total_pnl_usd),
            totalFeesSol: Number(row.total_fees_sol),
            tradesCount: row.trades_count,
            winningTradesCount: row.winning_trades_count,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            metadata: row.metadata
        };
    }

    private mapDatabaseRowToTrade(row: any): PaperTrade {
        return {
            id: row.id,
            portfolioId: row.portfolio_id,
            tradeType: row.trade_type,
            tokenIn: row.token_in,
            tokenOut: row.token_out,
            amountIn: Number(row.amount_in),
            amountOut: Number(row.amount_out),
            priceAtTrade: Number(row.price_at_trade),
            estimatedPriceImpact: Number(row.estimated_price_impact),
            slippageBps: Number(row.slippage_bps),
            feesSol: Number(row.fees_sol),
            virtualSignature: row.virtual_signature,
            poolStateId: row.pool_state_id,
            status: row.status,
            executedAt: row.executed_at,
            createdAt: row.created_at,
            tradePnlUsd: Number(row.trade_pnl_usd),
            metadata: row.metadata
        };
    }

    async createPortfolio(
        walletAddress: string,
        initialBalanceSol: number = CONFIG.PAPER_TRADING.INITIAL_BALANCE.SOL,
        initialBalanceBababill: number = CONFIG.PAPER_TRADING.INITIAL_BALANCE.BABABILL,
        metadata?: Record<string, any>
    ): Promise<number> {
        await this.db.query('BEGIN', []);
        try {
            const portfolioResult = await this.db.query(
                `INSERT INTO paper_portfolios (
                    wallet_address,
                    initial_balance_sol,
                    initial_balance_bababill,
                    current_balance_sol,
                    current_balance_bababill,
                    metadata
                ) VALUES ($1, $2, $3, $2, $3, $4)
                RETURNING *`,
                [walletAddress, initialBalanceSol, initialBalanceBababill, metadata]
            );

            const portfolio = portfolioResult.rows[0];

            await this.db.query(
                `INSERT INTO portfolio_snapshots (
                    portfolio_id,
                    balance_sol,
                    balance_bababill,
                    sol_price_usd,
                    bababill_price_usd
                ) VALUES ($1, $2, $3, $4, $5)`,
                [
                    portfolio.id,
                    portfolio.current_balance_sol,
                    portfolio.current_balance_bababill,
                    40, // Default SOL price
                    1   // Default BABABILL price
                ]
            );

            await this.db.query('COMMIT', []);
            return portfolio.id;
        } catch (error) {
            await this.db.query('ROLLBACK', []);
            throw error;
        }
    }

    async getPortfolio(portfolioId: number): Promise<PaperPortfolio | null> {
        const result = await this.db.query(
            'SELECT * FROM paper_portfolios WHERE id = $1',
            [portfolioId]
        );
        return result.rows[0] ? this.mapDatabaseRowToPortfolio(result.rows[0]) : null;
    }

    async executePaperTrade(
        portfolioId: number,
        tradeType: 'BUY' | 'SELL',
        amountIn: number,
        currentPrice: number,
        slippageBps: number = CONFIG.TRADE_SETTINGS.DEFAULT_SLIPPAGE_BPS
    ): Promise<PaperTrade> {
        try {
            if (!this.meteora.isInitialized()) {
                console.log('Initializing Meteora pool in paper trading service...');
                const success = await this.meteora.initialize();
                if (!success) {
                    throw new Error('Failed to initialize Meteora pool');
                }
                console.log('Meteora pool initialized successfully');
            }

            await this.db.query('BEGIN', []);
            try {
                const poolState = await this.meteora.getPoolState();
                const poolStateId = await this.db.recordPoolState(
                    poolState.poolAddress,
                    poolState.lpSupply,
                    poolState.tokenABalance,
                    poolState.tokenBBalance,
                    currentPrice,
                    1.0 // SOL price in USD (simplified)
                );

                const { priceImpact, fee } = await this.meteora.estimateMicroTrade(amountIn);
                const amountOut = tradeType === 'BUY' 
                    ? (amountIn / currentPrice) * (1 - priceImpact)
                    : amountIn * currentPrice * (1 - priceImpact);

                if (isNaN(amountOut) || amountOut <= 0) {
                    throw new Error('Invalid output amount calculated');
                }

                const tradeId = await this.recordTrade(
                    portfolioId,
                    tradeType,
                    tradeType === 'BUY' ? 'SOL' : 'BABABILL',
                    tradeType === 'BUY' ? 'BABABILL' : 'SOL',
                    amountIn,
                    amountOut,
                    currentPrice,
                    priceImpact * 100,
                    slippageBps,
                    Number(fee) / 1e9,
                    poolStateId,
                    { executedVia: 'METEORA' }
                );

                await this.db.query(
                    `UPDATE paper_portfolios 
                     SET current_balance_sol = CASE 
                         WHEN $2 = 'BUY' THEN current_balance_sol - $3
                         ELSE current_balance_sol + $4
                     END,
                     current_balance_bababill = CASE 
                         WHEN $2 = 'BUY' THEN current_balance_bababill + $4
                         ELSE current_balance_bababill - $3
                     END,
                     trades_count = trades_count + 1,
                     updated_at = NOW()
                     WHERE id = $1`,
                    [portfolioId, tradeType, amountIn, amountOut]
                );

                await this.db.query('COMMIT', []);
                const trade = await this.getTradeById(tradeId);
                if (!trade) {
                    throw new Error('Failed to retrieve executed trade');
                }
                return trade;
            } catch (error) {
                await this.db.query('ROLLBACK', []);
                throw error;
            }
        } catch (error) {
            console.error('Failed to execute paper trade:', error);
            throw error;
        }
    }

    private async recordTrade(
        portfolioId: number,
        tradeType: 'BUY' | 'SELL',
        tokenIn: string,
        tokenOut: string,
        amountIn: number,
        amountOut: number,
        priceAtTrade: number,
        priceImpact: number,
        slippageBps: number,
        feesSol: number,
        poolStateId: number,
        metadata?: Record<string, any>
    ): Promise<number> {
        const result = await this.db.query(
            `INSERT INTO paper_trades (
                portfolio_id,
                trade_type,
                token_in,
                token_out,
                amount_in,
                amount_out,
                price_at_trade,
                estimated_price_impact,
                slippage_bps,
                fees_sol,
                pool_state_id,
                metadata,
                status,
                executed_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
            RETURNING id`,
            [
                portfolioId,
                tradeType,
                tokenIn,
                tokenOut,
                amountIn,
                amountOut,
                priceAtTrade,
                priceImpact,
                slippageBps,
                feesSol,
                poolStateId,
                metadata,
                'EXECUTED'
            ]
        );
        return result.rows[0].id;
    }

    async getTradeById(tradeId: number): Promise<PaperTrade | null> {
        const result = await this.db.query(
            'SELECT * FROM paper_trades WHERE id = $1',
            [tradeId]
        );
        return result.rows[0] ? this.mapDatabaseRowToTrade(result.rows[0]) : null;
    }

    async getPortfolioTrades(
        portfolioId: number,
        limit: number = 10,
        offset: number = 0
    ): Promise<PaperTrade[]> {
        const result = await this.db.query(
            `SELECT * FROM paper_trades 
             WHERE portfolio_id = $1 
             ORDER BY created_at DESC
             LIMIT $2 OFFSET $3`,
            [portfolioId, limit, offset]
        );
        return result.rows.map(row => this.mapDatabaseRowToTrade(row));
    }

    async getPortfolioStats(portfolioId: number): Promise<{
        totalTrades: number;
        winningTrades: number;
        totalPnl: number;
        averageReturn: number;
    }> {
        const result = await this.db.query(
            `SELECT 
                COUNT(*) as total_trades,
                COUNT(*) FILTER (WHERE trade_pnl_usd > 0) as winning_trades,
                SUM(trade_pnl_usd) as total_pnl,
                AVG(trade_pnl_usd) as average_return
             FROM paper_trades
             WHERE portfolio_id = $1`,
            [portfolioId]
        );
        return {
            totalTrades: Number(result.rows[0].total_trades),
            winningTrades: Number(result.rows[0].winning_trades),
            totalPnl: Number(result.rows[0].total_pnl),
            averageReturn: Number(result.rows[0].average_return)
        };
    }

    async updatePortfolioSnapshot(portfolioId: number): Promise<void> {
        const portfolio = await this.getPortfolio(portfolioId);
        if (!portfolio) {
            throw new Error('Portfolio not found');
        }

        const currentPrice = await this.meteora.getCurrentPrice();
        const solPriceUsd = 40; // Simplified SOL price in USD

        await this.db.query(
            `INSERT INTO portfolio_snapshots (
                portfolio_id,
                balance_sol,
                balance_bababill,
                sol_price_usd,
                bababill_price_usd
            ) VALUES ($1, $2, $3, $4, $5)`,
            [
                portfolioId,
                portfolio.currentBalanceSol,
                portfolio.currentBalanceBababill,
                solPriceUsd,
                currentPrice
            ]
        );
    }
}

// Export singleton instance
export const paperTradingService = new PaperTradingService(
    new DatabaseService(),
    new MeteoraService(
        new Connection(CONFIG.RPC_URL),
        CONFIG.METEORA_POOL
    )
);