// src/services/vectorizer-worker.ts

import { tradeVectorizer } from './vectorizer';

export async function runVectorizerWorker() {
    console.log('Starting vectorizer worker...');
    
    while (true) {
        try {
            await tradeVectorizer.vectorizeNewTrades();
            // Wait 30 seconds between batches
            await new Promise(resolve => setTimeout(resolve, 30000));
        } catch (error) {
            console.error('Error in vectorizer worker:', error);
            // Wait 1 minute before retrying after error
            await new Promise(resolve => setTimeout(resolve, 60000));
        }
    }
}

// Only start the worker if this module is run directly
if (import.meta.url.endsWith('vectorizer-worker.ts')) {
    runVectorizerWorker()
        .catch(console.error);
}