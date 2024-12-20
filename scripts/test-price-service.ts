import { PublicKey } from '@solana/web3.js';
import { birdEyePriceService } from '../src/services/price/birdeye';
import { aggregatedPriceService } from '../src/services/price/aggregated';
import { CONFIG } from '../src/config';

async function testPriceServices() {
    try {
        console.log('\n1. Testing BirdEye Price Service...');
        
        // Test current price
        console.log('\nFetching current BABABILL price from BirdEye...');
        const currentPrice = await birdEyePriceService.getTokenPrice(CONFIG.BABABILL_TOKEN);
        console.log('Current price:', {
            price: currentPrice.price,
            confidence: currentPrice.confidence,
            timestamp: new Date(currentPrice.timestamp).toISOString(),
            source: currentPrice.source
        });

        // Test historical price (24 hours ago)
        const yesterday = Date.now() - (24 * 60 * 60 * 1000);
        console.log('\nFetching historical price from 24 hours ago...');
        const historicalPrice = await birdEyePriceService.getHistoricalPrice(
            CONFIG.BABABILL_TOKEN,
            yesterday
        );
        console.log('Historical price:', {
            price: historicalPrice.price,
            timestamp: new Date(historicalPrice.timestamp).toISOString(),
            source: historicalPrice.source
        });

        // Test price history (last 24 hours)
        console.log('\nFetching price history for last 24 hours...');
        const priceHistory = await birdEyePriceService.getPriceHistory(
            CONFIG.BABABILL_TOKEN,
            yesterday,
            Date.now()
        );
        console.log('Price history entries:', priceHistory.length);
        console.log('First entry:', {
            price: priceHistory[0].price,
            timestamp: new Date(priceHistory[0].timestamp).toISOString(),
            source: priceHistory[0].source
        });
        console.log('Last entry:', {
            price: priceHistory[priceHistory.length - 1].price,
            timestamp: new Date(priceHistory[priceHistory.length - 1].timestamp).toISOString(),
            source: priceHistory[priceHistory.length - 1].source
        });

        console.log('\n2. Testing Aggregated Price Service...');
        
        // Test aggregated current price
        console.log('\nFetching aggregated current price...');
        const aggregatedPrice = await aggregatedPriceService.getTokenPrice(CONFIG.BABABILL_TOKEN);
        console.log('Aggregated price:', {
            price: aggregatedPrice.price,
            confidence: aggregatedPrice.confidence,
            timestamp: new Date(aggregatedPrice.timestamp).toISOString(),
            source: aggregatedPrice.source
        });

        // Compare with BirdEye price
        const priceDiff = Math.abs(aggregatedPrice.price - currentPrice.price);
        const priceDiffPercentage = (priceDiff / currentPrice.price) * 100;
        console.log('\nPrice comparison:', {
            birdEyePrice: currentPrice.price,
            aggregatedPrice: aggregatedPrice.price,
            difference: priceDiff,
            differencePercentage: `${priceDiffPercentage.toFixed(2)}%`
        });

        // Test error handling
        console.log('\n3. Testing error handling...');
        try {
            const invalidToken = new PublicKey('invalid');
            await birdEyePriceService.getTokenPrice(invalidToken);
        } catch (error) {
            console.log('Successfully caught error for invalid token:', error instanceof Error ? error.message : String(error));
        }

        console.log('\nAll tests completed successfully!');

    } catch (error) {
        console.error('\nTest failed:', error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}

// Run tests
console.log('Starting price service tests...');
testPriceServices()
    .then(() => {
        console.log('\nTests completed successfully');
        process.exit(0);
    })
    .catch(error => {
        console.error('\nTests failed:', error instanceof Error ? error.message : String(error));
        process.exit(1);
    });