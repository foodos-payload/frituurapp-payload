// File: src/lib/payments/AbstractPaymentProvider.ts

/**
 * The result of calling "createPayment" on a provider.
 * - `redirectUrl` is where the user should be sent to complete payment (if any).
 * - `providerOrderId` is the unique identifier from the external payment provider (if any).
 * - `status` can be "pending", "created", "failed", etc., depending on the provider.
 */
export interface PaymentCreateResult {
    redirectUrl?: string;
    providerOrderId?: string;
    status: string;
    eventsToken?: string;
    eventsStreamUrl?: string;

}

/**
 * The result of calling "getPaymentStatus" on a provider.
 * - `status` might be "completed", "pending", "canceled", etc.
 * - `providerOrderId` is the external payment reference.
 * - `rawResponse` can include the entire response body from the provider for debugging/logging.
 */
export interface PaymentStatusResult {
    status: string;
    providerOrderId?: string;
    rawResponse?: any;

}

/**
 * Abstract base class for all payment providers.
 * Extend this class to implement provider-specific logic for creating payments and checking statuses.
 */
export abstract class AbstractPaymentProvider {
    /**
     * @param apiKey    - Typically the provider API key or secret.
     * @param settings  - Additional provider-specific settings (e.g. test/live mode).
     */
    constructor(
        protected apiKey: string,
        protected settings: Record<string, any> = {},
    ) { }

    /**
     * Create a payment for a given local order or partial order data.
     * This usually returns a PaymentCreateResult indicating where to redirect the user,
     * along with a providerOrderId to store in your local DB.
     */
    public abstract createPayment(localOrderDoc: any): Promise<PaymentCreateResult>;

    /**
     * Check the payment status at the provider, given the external reference (providerOrderId).
     * Return the updated payment status and any relevant info.
     */
    public abstract getPaymentStatus(providerOrderId: string): Promise<PaymentStatusResult>;
}
