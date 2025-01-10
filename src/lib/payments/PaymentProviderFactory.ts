import { AbstractPaymentProvider } from './AbstractPaymentProvider'
import { MultiSafePayProvider } from './MultiSafePayProvider'

// Import the PaymentMethodDoc + MultiSafePaySettings from shared types
import type { PaymentMethodDoc, MultiSafePaySettings } from '@/types/PaymentTypes'

export async function getPaymentProviderFromMethodDoc(
    methodDoc: PaymentMethodDoc
): Promise<AbstractPaymentProvider> {
    const { provider, multisafepay_settings } = methodDoc

    switch (provider) {
        case 'multisafepay':
            const settings = multisafepay_settings || {}
            return new MultiSafePayProvider('', {
                enable_test_mode: settings.enable_test_mode ?? false,
                live_api_key: settings.live_api_key ?? '',
                test_api_key: settings.test_api_key ?? '',
                methods: settings.methods ?? [],
            })

        // add other providers if you have them

        default:
            throw new Error(`Unsupported payment provider: ${provider}`)
    }
}
