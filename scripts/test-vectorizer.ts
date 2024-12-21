import { tradeVectorizer } from '../src/services/vectorizer';
import { dbService } from '../src/services/database';
import { paperTradingService, PaperTrade } from '../src/services/paper-trading';
import { agentBABA } from '../src/services/agent';

async function testVectorizer() {
    try {
        console.log('\n1. Setting up test data...');
        
        // Initialize paper trading if needed
        const portfolioId = await agentBABA.initializePaperTrading();
        console.log('Created test portfolio:', portfolioId);
        
        // Execute some test trades
        const trades: PaperTrade[] = [];  // Add type annotation
        trades.push(await agentBABA.executePaperTrade('BUY', 0.1));
        console.log('Executed test buy trade');
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        trades.push(await agentBABA.executePaperTrade('SELL', 0.05));
        console.log('Executed test sell trade');
        
        console.log('\n2. Vectorizing trades...');
        await tradeVectorizer.vectorizeNewTrades();
        
        // Verify embeddings were created
        const embeddingCount = await dbService.query(
            'SELECT COUNT(*) FROM trade_embeddings_store',
            []
        );
        console.log('\nCreated embeddings:', embeddingCount.rows[0].count);
        
        console.log('\n3. Testing similarity search...');
        
        // Test search with different queries
        const queries = [
            'profitable trades with low price impact',
            'trades with high fees',
            'large buy orders'
        ];
        
        for (const query of queries) {
            console.log(`\nSearching for: "${query}"`);
            const results = await tradeVectorizer.searchSimilarTrades(query, 2);
            
            console.log('Results:');
            for (const result of results) {
                console.log('-'.repeat(50));
                console.log('Trade:', {
                    type: result.trade_type,
                    amountIn: result.amount_in,
                    amountOut: result.amount_out,
                    priceImpact: result.estimated_price_impact,
                    pnl: result.trade_pnl_usd,
                    similarity: result.similarity.toFixed(4)
                });
            }
        }
        
        console.log('\nAll tests completed successfully!');
    } catch (error) {
        console.error('\nTest failed:', error instanceof Error ? error.message : String(error));
        throw error;
    } finally {
        await dbService.close();
    }
}

console.log('Starting vectorizer tests...');
testVectorizer()
    .then(() => {
        console.log('\nTests completed successfully');
        process.exit(0);
    })
    .catch(error => {
        console.error('\nTests failed:', error);
        process.exit(1);
    });