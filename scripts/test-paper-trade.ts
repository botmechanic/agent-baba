import { agentBABA } from '../src/services/agent';

async function testPaperTrading() {
    try {
        console.log('\n1. Initializing paper trading...');
        const portfolioId = await agentBABA.initializePaperTrading();
        console.log('Portfolio created with ID:', portfolioId);

        // Wait for portfolio creation to complete
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('\n2. Getting initial portfolio status...');
        const initialStatus = await agentBABA.getPaperPortfolioStatus();
        if (!initialStatus?.portfolio) {
            throw new Error('Failed to get initial portfolio status');
        }

        console.log('Initial balances:', {
            SOL: initialStatus.portfolio.currentBalanceSol,
            BABABILL: initialStatus.portfolio.currentBalanceBababill
        });

        console.log('\n3. Executing test trades...');
        // Buy 0.1 SOL worth
        const buyTrade = await agentBABA.executePaperTrade('BUY', 0.1);
        console.log('Buy trade executed:', {
            amountIn: buyTrade.amountIn,
            amountOut: buyTrade.amountOut,
            priceImpact: buyTrade.estimatedPriceImpact,
            fee: buyTrade.feesSol
        });

        // Get updated status
        const midStatus = await agentBABA.getPaperPortfolioStatus();
        console.log('\nMid-trade balances:', {
            SOL: midStatus?.portfolio?.currentBalanceSol,
            BABABILL: midStatus?.portfolio?.currentBalanceBababill
        });

        // Sell half of what we bought
        const sellTrade = await agentBABA.executePaperTrade('SELL', buyTrade.amountOut / 2);
        console.log('\nSell trade executed:', {
            amountIn: sellTrade.amountIn,
            amountOut: sellTrade.amountOut,
            priceImpact: sellTrade.estimatedPriceImpact,
            fee: sellTrade.feesSol
        });

        console.log('\n4. Getting final portfolio status...');
        const finalStatus = await agentBABA.getPaperPortfolioStatus();
        console.log('Final balances:', {
            SOL: finalStatus?.portfolio?.currentBalanceSol,
            BABABILL: finalStatus?.portfolio?.currentBalanceBababill,
            trades: finalStatus?.portfolio?.tradesCount,
            pnl: finalStatus?.portfolio?.totalPnlUsd
        });

    } catch (error) {
        console.error('Test failed:', error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}

console.log('Starting paper trading test...');
testPaperTrading()
    .then(() => {
        console.log('\nTest completed successfully');
        process.exit(0);
    })
    .catch(error => {
        console.error('\nTest failed:', error instanceof Error ? error.message : String(error));
        process.exit(1);
    });