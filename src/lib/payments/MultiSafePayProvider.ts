// src/lib/payments/MultiSafePayProvider.ts

import {
    AbstractPaymentProvider,
    PaymentCreateResult,
    PaymentStatusResult,
} from './AbstractPaymentProvider';

interface MultiSafePaySettings {
    enable_test_mode?: boolean | null;
    live_api_key?: string | null;
    test_api_key?: string | null;
    methods?: string[] | null;
    // any additional fields you need
}

export class MultiSafePayProvider extends AbstractPaymentProvider {
    private environmentUrl: string;

    constructor(apiKey: string, settings: MultiSafePaySettings) {
        super(apiKey, settings);

        // Decide whether to use test or live environment
        const isTest = settings.enable_test_mode;
        this.environmentUrl = isTest
            ? 'https://testapi.multisafepay.com/v1/json/'
            : 'https://api.multisafepay.com/v1/json/';
    }

    /**
     * Create a MultiSafePay order (redirect flow).
     */
    public async createPayment(localOrderDoc: any): Promise<PaymentCreateResult> {
        // If the Shop doc was attached, we can read it:
        const shopSlug = localOrderDoc?.shopSlug || 'frituur-den-overkant';
        const isTest = this.settings.enable_test_mode ?? false;

        // Use the shopDoc’s domain if available
        const productionDomain =
            localOrderDoc.shopDoc?.domain || `${shopSlug}.frituurapp.be`;

        // If test mode => local dev
        // Otherwise => the shop’s production domain
        const localDomain = isTest
            ? `http://${shopSlug}.localhost:3000`
            : `https://${productionDomain}`;

        // Same for notification callbacks
        const notificationDomain = isTest
            ? 'https://frituurapp.ngrok.dev'
            : localDomain;

        // 3) Build the MSP order payload
        const orderId = `${shopSlug}-${localOrderDoc.id}`;
        const amountInCents = Math.round((localOrderDoc.total ?? 0) * 100);

        const requestBody = {
            type: 'redirect',
            order_id: orderId,
            currency: 'EUR',
            amount: amountInCents,
            description: `Order #${localOrderDoc.id}`,

            payment_options: {
                // MSP will post to this endpoint with status updates
                notification_url: `${notificationDomain}/api/mspWebhook?orderId=${localOrderDoc.id}`,

                // After paying, user is redirected back to the local shop domain
                redirect_url: `${localDomain}/order-summary?orderId=${localOrderDoc.id}`,

                // If the user cancels payment, they come back here
                cancel_url: `${localDomain}/checkout?orderId=${localOrderDoc.id}&cancelled=true`,

                close_window: true,
            },

            customer: {
                locale: 'nl_NL', // or "en_US", etc. 
                ip_address: localOrderDoc?.ipAddress || '0.0.0.0',
                first_name: localOrderDoc?.customer_details?.firstName || '',
                last_name: localOrderDoc?.customer_details?.lastName || '',
                address1: localOrderDoc?.customer_details?.address || '',
                zip_code: localOrderDoc?.customer_details?.postalCode || '',
                city: localOrderDoc?.customer_details?.city || '',
                country: 'BE', // or dynamically
                phone: localOrderDoc?.customer_details?.phone || '',
                email: localOrderDoc?.customer_details?.email || '',
            },

            // Optional: e.g. specify "gateway": "IDEAL" or "CREDITCARD" to skip MSP method selection
            // gateway: 'IDEAL',
        };

        // 4) Send to MSP
        const apiKey = this.resolveApiKey();
        const url = `${this.environmentUrl}orders?api_key=${apiKey}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });

        const json = await response.json();
        if (!response.ok || !json.success) {
            throw new Error(`MultiSafePay createPayment failed: ${JSON.stringify(json)}`);
        }

        // MSP responds with { success: true, data: { payment_url, order_id, ... } }
        const paymentUrl = json.data?.payment_url;

        // Return the result to the calling code
        return {
            redirectUrl: paymentUrl,
            providerOrderId: orderId,
            status: 'pending',
        };
    }

    /**
     * Check the current status of a MultiSafePay order by its providerOrderId.
     */
    public async getPaymentStatus(providerOrderId: string): Promise<PaymentStatusResult> {
        const apiKey = this.resolveApiKey();
        const url = `${this.environmentUrl}orders/${encodeURIComponent(providerOrderId)}?api_key=${apiKey}`;
        const response = await fetch(url);
        const json = await response.json();

        if (!response.ok || !json.success) {
            throw new Error(`MultiSafePay getPaymentStatus failed: ${JSON.stringify(json)}`);
        }

        const providerStatus = json.data?.status; // e.g. "completed", "initialized", "cancelled"

        return {
            status: providerStatus,
            providerOrderId,
            rawResponse: json.data,
        };
    }

    /**
     * Pick the correct API key based on test mode or live mode.
     */
    private resolveApiKey(): string {
        if (this.settings.enable_test_mode) {
            return this.settings.test_api_key || '';
        }
        return this.settings.live_api_key || '';
    }
}
