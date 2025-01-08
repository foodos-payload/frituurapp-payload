// src/lib/pos/Deliverect.ts
import { AbstractPOS } from './AbstractPOS'

export class Deliverect extends AbstractPOS {
    constructor(apiKey: string, apiSecret: string) {
        super(apiKey, apiSecret)
    }

    async syncProducts(): Promise<void> {
        // Implementation for Deliverect
        console.log('Syncing products with Deliverect...')
    }

    async syncOrders(): Promise<void> {
        // ...
    }

    async getProducts(): Promise<any> {
        // ...
    }
}
