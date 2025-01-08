// src/lib/pos/Deliverect.ts
import { AbstractPOS } from './AbstractPOS'

export class Deliverect extends AbstractPOS {
    syncSubproducts(): Promise<void> {
        throw new Error('Method not implemented.')
    }
    syncCategories(): Promise<void> {
        throw new Error('Method not implemented.')
    }
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
