import { PublicKey } from '@solana/web3.js';
import { birdEyePriceService } from './birdeye';
import { TokenPrice, PriceService } from './birdeye';

export class AggregatedPriceService implements PriceService {
    private services: PriceService[];
    private isDev: boolean;

    constructor() {
        this.isDev = process.env.NODE_ENV === 'development';
        this.services = [birdEyePriceService];
    }

    async getTokenPrice(tokenMint: PublicKey): Promise<TokenPrice> {
        if (this.isDev) {
            console.log('Using development mode in aggregated price service');
            return {
                price: 1,
                timestamp: Date.now(),
                confidence: 0.95,
                source: 'aggregated-dev'
            };
        }

        let lastError: Error | null = null;
        for (const service of this.services) {
            try {
                const price = await service.getTokenPrice(tokenMint);
                if (price) return price;
            } catch (error) {
                console.warn(`Failed to fetch price from service:`, error);
                lastError = error instanceof Error ? error : new Error(String(error));
            }
        }

        if (lastError) throw lastError;
        throw new Error('No price services available');
    }

    async getHistoricalPrice(tokenMint: PublicKey, timestamp: number): Promise<TokenPrice> {
        if (this.isDev) {
            return {
                price: 1,
                timestamp,
                confidence: 0.95,
                source: 'aggregated-dev'
            };
        }

        let lastError: Error | null = null;
        for (const service of this.services) {
            try {
                const price = await service.getHistoricalPrice(tokenMint, timestamp);
                if (price) return price;
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
            }
        }

        if (lastError) throw lastError;
        throw new Error('No price services available');
    }

    async getPriceHistory(tokenMint: PublicKey, startTime: number, endTime: number): Promise<TokenPrice[]> {
        if (this.isDev) {
            const prices: TokenPrice[] = [];
            let currentTime = startTime;
            while (currentTime <= endTime) {
                prices.push({
                    price: 1,
                    timestamp: currentTime,
                    confidence: 0.95,
                    source: 'aggregated-dev'
                });
                currentTime += 3600000; // Add 1 hour
            }
            return prices;
        }

        let lastError: Error | null = null;
        for (const service of this.services) {
            try {
                const prices = await service.getPriceHistory(tokenMint, startTime, endTime);
                if (prices && prices.length > 0) return prices;
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
            }
        }

        if (lastError) throw lastError;
        throw new Error('No price services available');
    }
}

// Export singleton instance
export const aggregatedPriceService = new AggregatedPriceService();