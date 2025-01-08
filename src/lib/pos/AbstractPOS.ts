// src/lib/pos/AbstractPOS.ts

/**
 * Abstract class for all POS systems.
 *
 * @param apiKey - Generic 'API key' usage if needed by certain POS
 * @param apiSecret - Generic 'API secret' usage if needed by certain POS
 */
export abstract class AbstractPOS {
    constructor(protected apiKey: string, protected apiSecret: string) { }

    // Method placeholders each POS child class must implement:
    abstract syncProducts(): Promise<void>
    abstract syncSubproducts(): Promise<void>
    abstract syncCategories(): Promise<void>
    abstract syncOrders(): Promise<void>
    abstract getProducts(): Promise<any[]>

    abstract pushLocalOrderToCloudPOS(localOrderId: string | number): Promise<number>

    // Optionally define a shared helper method for calling POS endpoints
    // but each child might override or implement their own logic.
    protected callPOSAPI(_endpoint: string, _requestBody: any): Promise<any> {
        throw new Error('Not implemented')
    }
}
