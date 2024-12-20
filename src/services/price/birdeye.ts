import { PublicKey } from '@solana/web3.js';
import { CONFIG } from '../../config';

export interface TokenPrice {
    price: number;
    timestamp: number;
    confidence?: number;
    source: string;
}

export interface PriceService {
    getTokenPrice(tokenMint: PublicKey): Promise<TokenPrice>;
    getHistoricalPrice(tokenMint: PublicKey, timestamp: number): Promise<TokenPrice>;
    getPriceHistory(tokenMint: PublicKey, startTime: number, endTime: number): Promise<TokenPrice[]>;
}

export class BirdEyePriceService implements PriceService {
    private baseUrl = 'https://public-api.birdeye.so';
    private apiKey: string;
    private isDev: boolean;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
        this.isDev = process.env.NODE_ENV === 'development';
    }

    private async makeRequest(endpoint: string): Promise<any> {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                headers: {
                    'X-API-KEY': this.apiKey,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`BirdEye API error: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('BirdEye API request failed:', error);
            throw new Error(`BirdEye API request failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async getTokenPrice(tokenMint: PublicKey): Promise<TokenPrice> {
        if (this.isDev) {
            return {
                price: 1,
                timestamp: Date.now(),
                confidence: 0.95,
                source: 'birdeye-dev'
            };
        }

        try {
            const endpoint = `/public/price?address=${tokenMint.toString()}`;
            const data = await this.makeRequest(endpoint);

            return {
                price: data.data.value,
                timestamp: Date.now(),
                confidence: data.data.confidence,
                source: 'birdeye'
            };
        } catch (error) {
            console.error('Failed to get token price from BirdEye:', error);
            throw error;
        }
    }

    async getHistoricalPrice(tokenMint: PublicKey, timestamp: number): Promise<TokenPrice> {
        if (this.isDev) {
            return {
                price: 1,
                timestamp: timestamp,
                confidence: 0.95,
                source: 'birdeye-dev'
            };
        }

        try {
            const timestampSec = Math.floor(timestamp / 1000);
            const endpoint = `/public/historical_price?address=${tokenMint.toString()}&time=${timestampSec}`;
            const data = await this.makeRequest(endpoint);

            return {
                price: data.data.value,
                timestamp: timestamp,
                source: 'birdeye'
            };
        } catch (error) {
            console.error('Failed to get historical price from BirdEye:', error);
            throw error;
        }
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
                    source: 'birdeye-dev'
                });
                currentTime += 3600000; // Add 1 hour
            }
            return prices;
        }

        try {
            const startTimeSec = Math.floor(startTime / 1000);
            const endTimeSec = Math.floor(endTime / 1000);
            const endpoint = `/public/price_history?address=${tokenMint.toString()}&type=1H&start_time=${startTimeSec}&end_time=${endTimeSec}`;
            const data = await this.makeRequest(endpoint);

            return data.data.items.map((item: any) => ({
                price: item.value,
                timestamp: item.unixTime * 1000,
                source: 'birdeye'
            }));
        } catch (error) {
            console.error('Failed to get price history from BirdEye:', error);
            throw error;
        }
    }
}

// Export singleton instance
export const birdEyePriceService = new BirdEyePriceService(
  process.env.NODE_ENV === 'development' ? 'dev_key' : CONFIG.BIRDEYE_API_KEY
);