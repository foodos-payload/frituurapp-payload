// File: src/lib/payments/MultiSafePayProvider.ts

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

interface TerminalIDEntry {
    kiosk: number;
    terminal_id: string;
}

/**
 * Full map from your MSP documentation (gateway IDs).
 * Key = local label after removing "MSP_"
 * Value = MSP's recognized "gateway" string.
 */
const MSP_GATEWAY_MAP: Record<string, string> = {
    // Payment methods:
    Alipay: 'ALIPAY',
    'Alipay+': 'ALIPAYPLUS',
    'Amazon Pay': 'AMAZONBTN',
    'American Express': 'AMEX',
    'Apple Pay': 'APPLEPAY',
    Bancontact: 'MISTERCASH',
    'Bank transfer': 'BANKTRANS',
    Belfius: 'BELFIUS',
    'Betaal per Maand': 'SANTANDER',
    Bizum: 'BIZUM',
    'CBC/KBC': 'CBC', // The MSP docs show "CBC / KBC"
    'Card payments': 'CREDITCARD',
    Dotpay: 'DOTPAY',
    Edenred: 'EDENCOM',
    'E-Invoicing': 'EINVOICE',
    EPS: 'EPS',
    Giropay: 'GIROPAY',
    'Google Pay': 'GOOGLEPAY',
    iDEAL: 'IDEAL',
    'iDEAL QR': 'IDEALQR',
    in3: 'IN3',
    Klarna: 'KLARNA',
    Maestro: 'MAESTRO',
    Mastercard: 'MASTERCARD',
    'MB Way': 'MBWAY',
    Multibanco: 'MULTIBANCO',
    MyBank: 'MYBANK',
    'Pay After Delivery': 'BNPL_MF',
    'Pay After Delivery installments': 'BNPL_INSTM',
    PayPal: 'PAYPAL',
    Paysafecard: 'PSAFECARD',
    'Request to Pay': 'DBRTP',
    Riverty: 'AFTERPAY',
    'Direct debit': 'DIRDEB',
    Sofort: 'DIRECTBANK',
    Trustly: 'TRUSTLY',
    TrustPay: 'TRUSTPAY',
    'Visa, Cartes Bancaires, Dankort, V Pay': 'VISA',
    'WeChat Pay': 'WECHAT',
    Zinia: 'ZINIA',

    // Gift cards (add more if your local "MSP_..." labels match these):
    'Amsterdam stadspas': 'AMSGIFT',
    'Baby Cadeaubon': 'BABYCAD',
    Beautyandwellness: 'BEAUTYWELL',
    'Beauty cadeau': 'BEAUTYCAD',
    Bloemencadeaukaart: 'BLOEMENCAD',
    Boekenbon: 'BOEKENBON',
    'Degrotespeelgoedwinkel': 'DEGROTESPL',
    Dordtpas: 'DORDTPAS',
    'Edenred Ticket Compliments': 'EDENCOM',
    'Edenred Ticket EcoCheque': 'EDENCO',
    'Edenred Ticket Restaurant': 'EDENRES',
    'Edenred Ticket Sport & Culture': 'EDENSPORTS',
    Fashioncheque: 'FASHIONCHQ',
    Fashiongiftcard: 'FASHIONGFT',
    Fietsenbon: 'FIETSENBON',
    Gelrepas: 'GELREPAS',
    Gezondheidsbon: 'GEZONDHEID',
    Good4fun: 'GOOD4FUN',
    'Horses & Gifts': 'HORSESGIFT',
    'Monizze eco voucher': 'MONIECO',
    'Monizze gift voucher': 'MONIGIFT',
    'Monizze meal voucher': 'MONIMEAL',
    'Nationale bioscoopbon': 'NATNLBIOSC',
    'Nationale tuinbon': 'NATNLETUIN',
    Parfumcadeaukaart: 'PARFUMCADE',
    'Rotterdampas': 'ROTGIFT',
    'U-pas': 'UPAS',
    Sportenfit: 'SPORTENFIT',
    Sodexo: 'SODESPORTS',
    'Vuur & rook gift card': 'VRGIFTCARD',
    'VVV Cadeaukaart': 'VVVGIFTCRD',
    Webshopgiftcard: 'WEBSHOPGFT',
    Wijncadeau: 'WIJNCADEAU',
    YourGift: 'YOURGIFT',
};

export class MultiSafePayProvider extends AbstractPaymentProvider {
    private environmentUrl: string;

    constructor(apiKey: string, settings: MultiSafePaySettings) {
        super(apiKey, settings);

        const isTest = settings.enable_test_mode;
        this.environmentUrl = isTest
            ? 'https://testapi.multisafepay.com/v1/json/'
            : 'https://api.multisafepay.com/v1/json/';
    }

    /**
     * Create a MultiSafePay order (redirect or terminal flow).
     */
    public async createPayment(localOrderDoc: any): Promise<PaymentCreateResult> {
        // 1) Shop details
        const shopSlug = localOrderDoc?.shopSlug || 'frituur-den-overkant';
        const isTest = this.settings.enable_test_mode ?? false;

        // 2) Domain logic
        //    - Where do we redirect the user after successful or canceled payment?
        const productionDomain =
            localOrderDoc.shopDoc?.domain || `${shopSlug}.frituurapp.be`;
        const localDomain = isTest
            ? `http://${shopSlug}.localhost:3000`
            : `${productionDomain}`;
        const notificationDomain = isTest
            ? 'https://frituurapp.ngrok.dev'
            : localDomain;

        // 3) Build order reference for MSP
        const orderId = `${shopSlug}-${localOrderDoc.id}`;
        const amountInCents = Math.round((localOrderDoc.total ?? 0) * 100);

        const requestBody: Record<string, any> = {
            type: 'redirect', // or 'redirect', 'checkout', etc.
            order_id: orderId,
            currency: 'EUR',
            amount: amountInCents,
            description: `Order #${localOrderDoc.id}`,

            payment_options: {
                notification_url: `${notificationDomain}/api/mspWebhook?orderId=${localOrderDoc.id}`,
                redirect_url: `${localDomain}/order-summary?orderId=${localOrderDoc.id}`,
                cancel_url: `${localDomain}/checkout?orderId=${localOrderDoc.id}&cancelled=true`,
                close_window: true,
            },

            customer: {
                locale: 'nl_NL',
                ip_address: localOrderDoc?.ipAddress || '0.0.0.0',
                first_name: localOrderDoc?.customer_details?.firstName || '',
                last_name: localOrderDoc?.customer_details?.lastName || '',
                address1: localOrderDoc?.customer_details?.address || '',
                zip_code: localOrderDoc?.customer_details?.postalCode || '',
                city: localOrderDoc?.customer_details?.city || '',
                country: 'BE', // or dynamic from order
                phone: localOrderDoc?.customer_details?.phone || '',
                email: localOrderDoc?.customer_details?.email || '',
            },
        };

        // 4) If kiosk => set gateway_info.terminal_id
        if (localOrderDoc.order_type === 'kiosk') {
            // 4A) If your PaymentMethod doc has 'terminal_ids' field:
            //     We can find the kiosk => terminal ID match:
            const pmDoc = localOrderDoc?.payments?.[0]?.payment_method;
            // pmDoc might be a string or object; you can pass it from the route
            // but let's assume we have it as localOrderDoc.pmDoc or something similar
            // or you already found it in "updatedOrderDoc"

            // For example, if we have pmDoc.terminal_ids = [{ kiosk: 1, terminal_id: "198" }, ...]
            // match localOrderDoc.kioskNumber:
            let kioskTerminalId = '';
            if (pmDoc?.terminal_ids && Array.isArray(pmDoc.terminal_ids)) {
                // find the match
                const kioskEntry = pmDoc.terminal_ids.find(
                    (entry: TerminalIDEntry) => entry.kiosk === localOrderDoc.kioskNumber
                );
                kioskTerminalId = kioskEntry?.terminal_id || '';
            }

            // Fallback or default if not found
            if (!kioskTerminalId) {
                kioskTerminalId = '198'; // or any default
            }

            // 4B) Add gateway_info to requestBody => signals a Cloud POS payment
            requestBody.gateway_info = {
                terminal_id: kioskTerminalId,
            };

            // If you don't set any `requestBody.gateway`, MSP will show a "Card Payment" on the terminal
            // If you want to specify a particular method, you can do:
            // requestBody.gateway = 'CREDITCARD';
        } else {
            // If not kiosk => do normal "redirect" flow
            // 5) Detect "MSP_" sub_method_label => map to MSP gateway
            const subMethodLabel = localOrderDoc.payments?.[0]?.sub_method_label;
            if (
                typeof subMethodLabel === 'string' &&
                subMethodLabel.startsWith('MSP_')
            ) {
                const methodName = subMethodLabel.replace(/^MSP_/, ''); // e.g. "Mastercard"
                const gateway = MSP_GATEWAY_MAP[methodName];
                if (gateway) {
                    requestBody.gateway = gateway;
                }
            }
        }

        // ---- Console logs for debugging
        console.log('=== MultiSafePay createPayment - Request Body ===');
        console.log(JSON.stringify(requestBody, null, 2));

        // 6) Send to MSP
        const apiKey = this.resolveApiKey();
        const url = `${this.environmentUrl}orders?api_key=${apiKey}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });
        const json = await response.json();

        const eventsToken = json.data?.events_token || null;
        const eventsStreamUrl = json.data?.events_stream_url || null;

        console.log('=== MultiSafePay createPayment - Response JSON ===');
        console.log(JSON.stringify(json, null, 2));

        if (!response.ok || !json.success) {
            throw new Error(
                `MultiSafePay createPayment failed: ${JSON.stringify(json)}`
            );
        }

        // MSP returns { success: true, data: { payment_url, order_id, ... } }
        const paymentUrl = json.data?.payment_url;

        // Return result
        return {
            redirectUrl: paymentUrl,
            providerOrderId: orderId,
            status: 'pending',
            eventsToken,
            eventsStreamUrl,
        };
    }

    /**
     * Check the current status of a MultiSafePay order by its providerOrderId.
     */
    public async getPaymentStatus(
        providerOrderId: string
    ): Promise<PaymentStatusResult> {
        const apiKey = this.resolveApiKey();
        const url = `${this.environmentUrl}orders/${encodeURIComponent(
            providerOrderId
        )}?api_key=${apiKey}`;
        const response = await fetch(url);
        const json = await response.json();

        if (!response.ok || !json.success) {
            throw new Error(
                `MultiSafePay getPaymentStatus failed: ${JSON.stringify(json)}`
            );
        }

        const providerStatus = json.data?.status; // e.g. "completed", "initialized", "cancelled"

        return {
            status: providerStatus,
            providerOrderId,
            rawResponse: json.data,
        };
    }

    /**
     * Decide test vs. live API key
     */
    private resolveApiKey(): string {
        if (this.settings.enable_test_mode) {
            return this.settings.test_api_key || '';
        }
        return this.settings.live_api_key || '';
    }
}
